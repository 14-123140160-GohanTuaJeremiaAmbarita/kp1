// src/ai/gemini.service.ts
// Versi OpenRouter dengan dukungan pemilihan model dinamis dari frontend.

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

Kamu HARUS merespons HANYA dengan JSON MURNI (tanpa markdown code fence, tanpa teks tambahan apapun di luar JSON) dengan format berikut:
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

/** Daftar model yang BOLEH dipilih dari frontend — proteksi supaya user tidak bisa kirim model_id sembarangan lewat request langsung ke API. */
const ALLOWED_MODELS = new Set([
    "deepseek/deepseek-chat",
    "deepseek/deepseek-v4-pro",
    "openai/gpt-4o-mini",
    "openai/gpt-5",
    "google/gemini-2.5-flash",
    "anthropic/claude-sonnet-4.5",
]);

interface HistoryMessage {
    role: string;
    content: string;
}

interface OpenRouterChatMessage {
    role: "system" | "user" | "assistant";
    content: string;
}

interface OpenRouterAPIResponse {
    choices?: Array<{ message?: { role: string; content: string } }>;
    error?: { message: string; code?: number };
}

function normalizeHistoryRole(role: string): "user" | "assistant" {
    if (role === "model" || role === "assistant") return "assistant";
    return "user";
}

export class GeminiService {
    private readonly DEFAULT_MODEL = process.env.OPENROUTER_MODEL || "deepseek/deepseek-chat";
    private readonly API_URL = "https://openrouter.ai/api/v1/chat/completions";

    private getApiKey(): string {
        const apiKey = process.env.OPENROUTER_API_KEY;
        if (!apiKey) throw new Error("OPENROUTER_API_KEY belum dikonfigurasi.");
        return apiKey;
    }

    /** Validasi model yang diminta frontend; fallback ke default kalau tidak dikenali/kosong. */
    private resolveModel(requestedModel?: string): string {
        if (requestedModel && ALLOWED_MODELS.has(requestedModel)) return requestedModel;
        return this.DEFAULT_MODEL;
    }

    private async callOpenRouter(
        messages: OpenRouterChatMessage[],
        temperature: number,
        forceJson: boolean,
        model: string
    ): Promise<string> {
        const apiKey = this.getApiKey();

        const body: Record<string, any> = {
            model,
            messages,
            temperature,
        };

        if (forceJson) {
            body.response_format = { type: "json_object" };
        }

        const response = await fetch(this.API_URL, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${apiKey}`,
                "HTTP-Referer": process.env.APP_URL || "http://localhost:5173",
                "X-Title": "Voksel Smart IT Assistant",
            },
            body: JSON.stringify(body),
        });

        const data = (await response.json()) as OpenRouterAPIResponse;

        if (!response.ok || data.error) {
            const errMsg = data.error?.message || `HTTP ${response.status}`;
            throw new Error(`OpenRouter API error (model: ${model}): ${errMsg}`);
        }

        const content = data.choices?.[0]?.message?.content;
        if (!content) throw new Error("OpenRouter tidak mengembalikan konten yang valid.");
        return content;
    }

    private stripJsonFence(text: string): string {
        return text.trim().replace(/^```json\s*/i, "").replace(/^```\s*/i, "").replace(/```$/i, "").trim();
    }

    async analyzeAndChat(
        question: string,
        schemaText: string,
        history: HistoryMessage[] = [],
        requestedModel?: string
    ): Promise<any> {
        const model = this.resolveModel(requestedModel);
        try {
            const messages: OpenRouterChatMessage[] = [
                { role: "system", content: buildRouterSystemPrompt(schemaText) },
                ...history.map((h) => ({
                    role: normalizeHistoryRole(h.role),
                    content: h.content,
                })),
                { role: "user", content: question },
            ];

            const rawText = await this.callOpenRouter(messages, 0.1, true, model);
            return JSON.parse(this.stripJsonFence(rawText));
        } catch (error) {
            console.error("Gagal saat analyzeAndChat:", error);
            throw error;
        }
    }

    async generateFinalAnswerWithData(
        question: string,
        databaseData: any[],
        history: HistoryMessage[] = [],
        requestedModel?: string
    ): Promise<string> {
        const model = this.resolveModel(requestedModel);
        const stringifiedData = JSON.stringify(databaseData.slice(0, 50));
        const promptInsight = `
            Pengguna bertanya: "${question}".
            Data dari database: ${stringifiedData}.
            Tugas: Buat kesimpulan yang informatif dari data tersebut.
        `;
        try {
            const messages: OpenRouterChatMessage[] = [
                { role: "system", content: ANSWER_SYSTEM_PROMPT },
                { role: "user", content: promptInsight },
            ];

            const rawText = await this.callOpenRouter(messages, 0.3, false, model);
            return rawText.trim();
        } catch (error) {
            console.error("Gagal saat generateFinalAnswer:", error);
            return "Terjadi kesalahan saat merangkum data.";
        }
    }
}