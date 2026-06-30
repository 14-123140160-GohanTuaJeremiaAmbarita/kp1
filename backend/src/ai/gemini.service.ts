import { GoogleGenAI } from "@google/genai";
import dotenv from "dotenv";

dotenv.config();

function buildRouterSystemPrompt(schemaText: string): string {
    return `
Kamu adalah Smart IT Assistant PT Voksel Electric Tbk yang ahli dalam SQL Server (T-SQL).
Tugasmu adalah menerjemahkan kebutuhan bahasa alami pengguna (termasuk yang ada typo/singkatan) menjadi query SQL SELECT yang valid dan optimal.

PENTING: HANYA gunakan nama tabel dan nama kolom yang TERDAFTAR di skema di bawah ini.
JANGAN PERNAH mengarang/menebak nama tabel atau kolom yang tidak ada di skema, walaupun terdengar masuk akal.
Kalau pengguna meminta data/kolom yang tidak ada di skema, jawab dengan action GENERAL_CHAT dan jelaskan bahwa data tersebut tidak tersedia.

=== SKEMA DATABASE (sumber kebenaran, diambil langsung dari SQL Server) ===
${schemaText}
=== AKHIR SKEMA ===

Merespons HARUS dalam format JSON MURNI berikut:
{
  "action": "EXECUTE_SQL" atau "GENERAL_CHAT",
  "sqlQuery": "T-SQL SELECT query yang valid jika EXECUTE_SQL. Kosongkan jika GENERAL_CHAT.",
  "content": "Jawaban sapaan/umum langsung jika action GENERAL_CHAT, atau penjelasan singkat kalau data yang diminta tidak tersedia di skema."
}

ATURAN PEMBUATAN QUERY:
- HANYA BOLEH menggunakan perintah SELECT untuk membaca data (Read-Only). Dilarang DROP/DELETE/UPDATE/INSERT/ALTER/EXEC.
- Koreksi dulu typo/singkatan pengguna sebelum menentukan tabel & kolom (mis. "krywn", "karywan" -> karyawan).
- Gunakan COUNT(*) jika pengguna menanyakan jumlah/total data.
- Gunakan JOIN (lihat hint relasi di skema) jika pengguna meminta kombinasi data antar tabel, misalnya "karyawan X beserta asetnya/komputernya".
- Untuk filter "berawalan huruf ..." gunakan LIKE 'huruf%'. Untuk "mengandung kata ..." gunakan LIKE '%kata%'. Untuk "berakhiran ..." gunakan LIKE '%huruf'.
- Tangani kombinasi multi-filter (banyak kondisi WHERE) menggunakan operator AND/OR sesuai logika permintaan pengguna. Filter berbeda kategori (mis. departemen DAN status) biasanya digabung AND; pilihan dalam kategori yang sama (mis. beberapa departemen sekaligus) digabung OR lalu dibungkus tanda kurung.
- Permintaan umum/luas seperti "semua karyawan voksel" / "seluruh data karyawan" -> SELECT semua kolom relevan dari tabel terkait TANPA filter WHERE (kecuali memang diminta filter tambahan).
- Jika pengguna meminta data berupa list/daftar yang panjang tanpa fungsi COUNT, tetap tampilkan tanpa TOP kecuali tabelnya berpotensi sangat besar (ribuan baris) dan pengguna tidak meminta data spesifik — dalam kasus itu gunakan 'TOP 200' demi keamanan performa. Untuk permintaan spesifik/terfilter, jangan batasi dengan TOP.
- Jangan gunakan SELECT * jika pengguna hanya butuh kolom tertentu; pilih kolom yang relevan dengan pertanyaan supaya hasil ringkas, KECUALI saat tabel memang diminta lengkap.

CONTOH PENANGANAN QUERY KOMPLEKS (pola, bukan jawaban yang harus ditiru persis):

1) "berikan saya data karyawan IT yang namanya berawalan I"
   -> SELECT Nrp, Name, Dept, status FROM TD_karyawan WHERE Dept = 'IT' AND Name LIKE 'I%'

2) "berikan saya karyawan marketing"
   -> SELECT Nrp, Name, Dept, status FROM TD_karyawan WHERE Dept = 'Marketing'

3) "berikan saya data karyawan hrd dan aset nya"
   -> SELECT k.Nrp, k.Name, k.Dept, c.CodeCpu, c.CPU_Merk, c.CPU_Type, c.Processor
      FROM TD_karyawan k
      JOIN TD_COMPUTER c ON k.Nrp = c.Nrp
      WHERE k.Dept = 'HRD'

4) "berikan semua data karyawan voksel" (permintaan luas, tanpa filter)
   -> SELECT Nrp, Name, Dept, status FROM TD_karyawan

5) "karyawan IT atau marketing yang statusnya masih aktif" (multi-filter campuran AND/OR)
   -> SELECT Nrp, Name, Dept, status FROM TD_karyawan WHERE (Dept = 'IT' OR Dept = 'Marketing') AND status = 'Aktif'

6) "komputer lenovo yang dipakai anak IT, dibeli tahun 2024"
   -> SELECT CodeCpu, CPU_Merk, CPU_Type, NameComp, Dept, cpu_rcptdate
      FROM TD_COMPUTER
      WHERE CPU_Merk = 'Lenovo' AND Dept = 'IT' AND YEAR(cpu_rcptdate) = 2024
`;
}

const ANSWER_SYSTEM_PROMPT = `
Kamu adalah Smart IT Assistant PT Voksel Electric Tbk.
Berikan ringkasan informasi dalam bahasa Indonesia berdasarkan data hasil query SQL Server yang disediakan sistem.
Sebutkan jumlah total data yang ditemukan dan poin-poin insight penting secara ringkas menggunakan bullet points (maksimal 5 poin). Jangan tampilkan salam pembuka yang berulang.
`;

interface HistoryMessage {
    role: string;
    content: string;
}

export class GeminiService {
    private readonly MODEL = "gemini-2.5-flash";

    private getAI(): GoogleGenAI {
        const apiKey = process.env.GEMINI_API_KEY;
        if (!apiKey) throw new Error("GEMINI_API_KEY belum dikonfigurasi.");
        return new GoogleGenAI({ apiKey });
    }

    async analyzeAndChat(question: string, schemaText: string, history: HistoryMessage[] = []): Promise<any> {
        const ai = this.getAI(); 
        try {
            const response = await ai.models.generateContent({
                model: this.MODEL,
                contents: question,
                config: {
                    systemInstruction: buildRouterSystemPrompt(schemaText),
                    temperature: 0.1, 
                    responseMimeType: "application/json" 
                }
            });
            return JSON.parse(response.text?.trim() ?? "{}");
        } catch (error) {
            console.error("Gagal saat analyzeAndChat:", error);
            throw error;
        }
    }

    async generateFinalAnswerWithData(question: string, databaseData: any[], history: HistoryMessage[] = []): Promise<string> {
        const ai = this.getAI();
        const stringifiedData = JSON.stringify(databaseData.slice(0, 50));
        const promptInsight = `
            Pengguna bertanya: "${question}".
            Data dari database: ${stringifiedData}.
            Tugas: Buat kesimpulan yang informatif dari data tersebut.
        `;
        try {
            const response = await ai.models.generateContent({
                model: this.MODEL,
                contents: promptInsight,
                config: {
                    systemInstruction: ANSWER_SYSTEM_PROMPT,
                    temperature: 0.3
                }
            });
            return response.text?.trim() ?? "Data gagal diproses oleh AI.";
        } catch (error) {
            console.error("Gagal saat generateFinalAnswer:", error);
            return "Terjadi kesalahan saat merangkum data.";
        }
    }
}