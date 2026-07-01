// src/services/chatbot.service.ts

import { randomUUID } from "crypto";
import { GeminiService } from "../ai/openrouter.service";
import { SQLService } from "../ai/sql.service";
import { SchemaService } from "../ai/schema.service";

const gemini = new GeminiService();
const sqlService = new SQLService();
const schemaService = new SchemaService();

export class ChatbotService {

    async chat(message: string, history: any[] = [], sessionId: string = "default", model?: string) {
        try {
            // 0. Ambil skema asli database (cached) supaya AI tidak mengarang nama tabel/kolom
            const schemaText = await schemaService.getSchemaText();

            // 1. Kirim input user ke AI untuk dianalisis (typo dikoreksi & SQL dirumuskan langsung oleh AI)
            const aiResponse = await gemini.analyzeAndChat(message, schemaText, history, model);

            // =============================================================
            // KODE PENGECEKAN: Apakah AI memutuskan perlu mengambil data dari database?
            // =============================================================
            if (aiResponse.action === "EXECUTE_SQL") {
                if (!aiResponse.sqlQuery || typeof aiResponse.sqlQuery !== "string" || !aiResponse.sqlQuery.trim()) {
                    console.error("[AI LOG] AI mengembalikan action EXECUTE_SQL tanpa sqlQuery yang valid.");
                    return {
                        id: randomUUID(),
                        role: "assistant",
                        content: "Maaf, saya belum bisa menyusun query yang tepat untuk pertanyaan Anda. Bisa diperjelas lagi?",
                        table: []
                    };
                }

                console.log(`[AI LOG] Model "${model || "default"}" menghasilkan query SQL: ${aiResponse.sqlQuery}`);

                // 2. Eksekusi query SQL hasil rumusan AI ke SQL Server
                const sqlResult = await sqlService.execute(aiResponse.sqlQuery);

                if (sqlResult.type === "error") {
                    return {
                        id: randomUUID(),
                        role: "assistant",
                        content: "Maaf, terjadi kesalahan saat mengambil data dari database. Silakan coba pertanyaan lain atau hubungi admin jika masalah berlanjut.",
                        table: []
                    };
                }

                if (sqlResult.data && sqlResult.data.length > 0) {
                    // 3. Masukkan data mentah dari SQL Server kembali ke AI untuk disusun menjadi kesimpulan bahasa alami
                    const finalAnswer = await gemini.generateFinalAnswerWithData(
                        message,
                        sqlResult.data,
                        history,
                        model
                    );

                    return {
                        id: randomUUID(),
                        role: "assistant",
                        content: finalAnswer,
                        table: sqlResult.data
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

            // Jika AI memutuskan input berupa obrolan umum (GENERAL_CHAT)
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