import { randomUUID } from "crypto";
import { GeminiService } from "../ai/gemini.service";
import { SQLService } from "../ai/sql.service";
import { SchemaService } from "../ai/schema.service";

const gemini = new GeminiService();
const sqlService = new SQLService();
const schemaService = new SchemaService();

export class ChatbotService {

    async chat(message: string, history: any[] = [], sessionId: string = "default") {
        try {
            // 0. Ambil skema asli database (cached) supaya Gemini tidak mengarang nama tabel/kolom
            const schemaText = await schemaService.getSchemaText();

            // 1. Kirim input user ke Gemini untuk dianalisis (typo dikoreksi & SQL dirumuskan langsung oleh AI)
            const aiResponse = await gemini.analyzeAndChat(message, schemaText, history);

            // =============================================================
            // KODE PENGECEKAN: Apakah Gemini memutuskan perlu mengambil data dari database?
            // =============================================================
            if (aiResponse.action === "EXECUTE_SQL") {
                if (!aiResponse.sqlQuery || typeof aiResponse.sqlQuery !== "string" || !aiResponse.sqlQuery.trim()) {
                    console.error("[AI LOG] Gemini mengembalikan action EXECUTE_SQL tanpa sqlQuery yang valid.");
                    return {
                        id: randomUUID(),
                        role: "assistant",
                        content: "Maaf, saya belum bisa menyusun query yang tepat untuk pertanyaan Anda. Bisa diperjelas lagi?",
                        table: []
                    };
                }

                console.log(`[AI LOG] Gemini menghasilkan query SQL: ${aiResponse.sqlQuery}`);

                // 2. Eksekusi query SQL hasil rumusan Gemini ke SQL Server
                const sqlResult = await sqlService.execute(aiResponse.sqlQuery);

                if (sqlResult.type === "error") {
                    // Query gagal dieksekusi (mis. tabel/kolom salah, error koneksi, dll) — jangan disamarkan jadi "data kosong"
                    return {
                        id: randomUUID(),
                        role: "assistant",
                        content: "Maaf, terjadi kesalahan saat mengambil data dari database. Silakan coba pertanyaan lain atau hubungi admin jika masalah berlanjut.",
                        table: []
                    };
                }

                if (sqlResult.data && sqlResult.data.length > 0) {
                    // 3. Masukkan data mentah dari SQL Server kembali ke Gemini untuk disusun menjadi kesimpulan bahasa alami
                    const finalAnswer = await gemini.generateFinalAnswerWithData(
                        message, 
                        sqlResult.data, 
                        history
                    );

                    return {
                        id: randomUUID(),
                        role: "assistant",
                        content: finalAnswer,
                        table: sqlResult.data // Dikembalikan ke frontend untuk merender komponen tabel UI
                    };
                } else {
                    return {
                        id: randomUUID(),
                        role: "assistant",
                        content: "Data tidak ditemukan di database SQL Server.",
                        table: []
                    };
                }
            }

            // Jika Gemini memutuskan input berupa obrolan umum (GENERAL_CHAT)
            return {
                id: randomUUID(),
                role: "assistant",
                content: aiResponse.content,
                table: []
            };

        } catch (err) {
            console.error("Error pada alur ChatbotService:", err);
            return {
                id: randomUUID(),
                role: "assistant",
                content: "Maaf, terjadi kesalahan internal saat memproses data.",
                table: []
            };
        }
    }
}