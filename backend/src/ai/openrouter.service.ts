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

1. AKSES DATA (Read-Only):
   - HANYA BOLEH menggunakan perintah SELECT. Dilarang DROP/DELETE/UPDATE/INSERT/ALTER/EXEC.

2. KOREKSI BAHASA:
   - Koreksi dulu typo/singkatan pengguna sebelum menentukan tabel & kolom (mis. "krywn", "karywan" -> karyawan).

3. FLEKSIBILITAS KOLOM (PENTING):
   - Jika pertanyaan bersifat UMUM/LUAS dan TIDAK menyebut kolom tertentu (contoh: "tampilkan data komputer", "semua data karyawan", "berikan data HRD"), gunakan SELECT * FROM [tabel]. JANGAN menuliskan satu per satu nama seluruh kolom kalau user tidak minta detail spesifik.
   - Jika pertanyaan SPESIFIK menyebut kolom/informasi tertentu (contoh: "tampilkan merk dan tipe komputer saja", "nama dan nrp karyawan IT"), pilih HANYA kolom yang relevan dengan permintaan itu -- jangan gunakan SELECT * di kasus ini supaya hasil tetap ringkas dan relevan.
   - Untuk hasil JOIN antar tabel, tetap pilih kolom secara eksplisit (jangan SELECT * lintas tabel) supaya tidak terjadi duplikasi nama kolom yang membingungkan.

4. FILTER DEPARTEMEN (PENTING):
   - Satu departemen: WHERE Dept = 'IT'
   - Banyak departemen sekaligus: WHERE Dept IN ('IT', 'GA', 'HRD') -- JANGAN pakai OR/LIKE berantai untuk kasus ini, gunakan IN(...) supaya akurat dan rapi.
   - JANGAN gunakan LIKE untuk kolom Dept (nilai departemen itu tetap/pasti, LIKE berisiko menangkap departemen lain yang mirip namanya).
   - LIKE hanya dipakai untuk pencarian nama/teks bebas, BUKAN untuk kolom Dept. Contoh: "berawalan huruf ..." -> LIKE 'huruf%'; "mengandung kata ..." -> LIKE '%kata%'; "berakhiran ..." -> LIKE '%huruf'.

5. LOGIKA COUNT:
   - Jika pertanyaan mengandung kata "berapa", "jumlah", atau "hitung", WAJIB gunakan SELECT COUNT(*) AS Total (tambahkan filter WHERE yang relevan jika ada).

6. JOIN ANTAR TABEL (PENTING):
   - Gunakan JOIN kalau pengguna meminta kombinasi data dari 2 tabel atau lebih, misalnya "karyawan beserta komputernya", "aset milik departemen X", atau "tiket yang terkait work order tertentu".
   - Selalu gunakan alias tabel pendek (mis. k untuk karyawan, c untuk computer) supaya query rapi dan tidak ambigu saat ada nama kolom yang sama di kedua tabel.
   - Cari kolom penghubung yang masuk akal antar tabel (biasanya Nrp untuk relasi karyawan-aset, atau NoWO untuk relasi tiket-work order) berdasarkan hint relasi di skema di atas.
   - Pola dasar JOIN:
     SELECT k.Nrp, k.Name, k.Dept, c.CodeCpu, c.CPU_Merk, c.CPU_Type
     FROM TD_karyawan k
     JOIN TD_COMPUTER c ON k.Nrp = c.Nrp
     WHERE k.Dept = 'HRD'
   - Kalau relasinya tidak jelas/tidak ada kolom penghubung yang cocok di skema, JANGAN memaksakan JOIN dengan menebak kolom -- balas GENERAL_CHAT dan jelaskan bahwa relasi antar tabel tersebut tidak tersedia di skema.

7. FILTER TAMBAHAN:
   - Kombinasikan multi-filter dengan AND/OR sesuai logika permintaan. Filter beda kategori (mis. departemen DAN status) biasanya AND; pilihan dalam kategori yang sama (mis. beberapa departemen) gunakan IN(...) seperti aturan #4.
   - Jika pengguna meminta list/daftar panjang tanpa COUNT, tampilkan tanpa TOP kecuali tabelnya berpotensi sangat besar (ribuan baris) dan tidak ada filter spesifik -- dalam kasus itu gunakan 'TOP 200' demi keamanan performa.

CONTOH PENANGANAN QUERY (pola, bukan jawaban yang harus ditiru persis):

1) "tampilkan semua data komputer" (permintaan umum/luas, tanpa sebut kolom)
   -> SELECT * FROM TD_computer

2) "tampilkan merk dan tipe komputer IT saja" (spesifik menyebut kolom)
   -> SELECT CPU_Merk, CPU_Type, NameComp FROM TD_computer WHERE Dept = 'IT'

3) "berikan saya karyawan IT, GA, dan HRD" (banyak departemen)
   -> SELECT * FROM TD_karyawan WHERE Dept IN ('IT', 'GA', 'HRD')

4) "berapa jumlah karyawan di departemen marketing"
   -> SELECT COUNT(*) AS Total FROM TD_karyawan WHERE Dept = 'Marketing'

5) "berikan saya data karyawan hrd dan aset komputernya" (JOIN)
   -> SELECT k.Nrp, k.Name, k.Dept, c.CodeCpu, c.CPU_Merk, c.CPU_Type, c.Processor
      FROM TD_karyawan k
      JOIN TD_COMPUTER c ON k.Nrp = c.Nrp
      WHERE k.Dept = 'HRD'

6) "karyawan yang namanya berawalan I di departemen IT" (LIKE untuk nama, bukan Dept)
   -> SELECT * FROM TD_karyawan WHERE Dept = 'IT' AND Name LIKE 'I%'

7) "komputer lenovo yang dipakai anak IT, dibeli tahun 2024" (filter campuran)
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
    "google/gemini-3.5-flash",
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

    /**
     * Kadang DeepSeek (atau model lain) mengabaikan instruksi JSON-only dan malah
     * membalas dengan kalimat biasa (mis. "Untuk menghitung rata-rata umur..."),
     * walau response_format sudah dipaksa json_object. Fungsi ini mencoba
     * mengekstrak blok {...} pertama dari teks campuran sebagai upaya penyelamatan
     * sebelum benar-benar menyerah.
     */
    private extractJsonBlock(text: string): string | null {
        const match = text.match(/\{[\s\S]*\}/);
        return match ? match[0] : null;
    }

    private tryParseAiJson(rawText: string): any {
        const cleaned = this.stripJsonFence(rawText);
        try {
            return JSON.parse(cleaned);
        } catch {
            const extracted = this.extractJsonBlock(cleaned);
            if (extracted) {
                try {
                    return JSON.parse(extracted);
                } catch {
                    // lanjut ke null di bawah, biar caller yang tangani
                }
            }
            return null;
        }
    }

    async analyzeAndChat(
        question: string,
        schemaText: string,
        history: HistoryMessage[] = [],
        requestedModel?: string
    ): Promise<any> {
        const model = this.resolveModel(requestedModel);
        const messages: OpenRouterChatMessage[] = [
            { role: "system", content: buildRouterSystemPrompt(schemaText) },
            ...history.map((h) => ({
                role: normalizeHistoryRole(h.role),
                content: h.content,
            })),
            { role: "user", content: question },
        ];

        // Percobaan 1
        try {
            const rawText = await this.callOpenRouter(messages, 0.1, true, model);
            const parsed = this.tryParseAiJson(rawText);
            if (parsed) return parsed;

            console.error("[AI LOG] Respons bukan JSON valid (percobaan 1), raw text:", rawText.slice(0, 300));
        } catch (error) {
            console.error("Gagal saat analyzeAndChat (percobaan 1):", error);
        }

        // Percobaan 2: tegaskan ulang instruksi format, kadang cukup untuk "menyadarkan" model
        try {
            const retryMessages: OpenRouterChatMessage[] = [
                ...messages,
                {
                    role: "user",
                    content: "PENTING: Balas HANYA dengan JSON murni sesuai format yang diminta di system prompt. Jangan ada teks penjelasan di luar JSON.",
                },
            ];
            const rawText = await this.callOpenRouter(retryMessages, 0.1, true, model);
            const parsed = this.tryParseAiJson(rawText);
            if (parsed) return parsed;

            console.error("[AI LOG] Respons bukan JSON valid (percobaan 2), raw text:", rawText.slice(0, 300));
        } catch (error) {
            console.error("Gagal saat analyzeAndChat (percobaan 2):", error);
        }

        // Kedua percobaan gagal -> jangan lempar error mentah ke user, balas dengan sopan
        return {
            action: "GENERAL_CHAT",
            sqlQuery: "",
            content: "Maaf, saya kesulitan memahami format jawaban untuk pertanyaan ini. Bisa dicoba tanyakan dengan kalimat yang lebih sederhana?",
        };
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