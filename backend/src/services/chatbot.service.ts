import { randomUUID } from "crypto";
import { GeminiService } from "../ai/gemini.service";
import { IntentService } from "../ai/intent.service";
import { SQLService } from "../ai/sql.service";
import { NormalizeService } from "../ai/normalize.service";
import { LearningService } from "./learning.service";

const gemini = new GeminiService();
const intentService = new IntentService();
const sqlService = new SQLService();
const normalizeService = new NormalizeService();
const learningService = new LearningService();

// Simpan sementara kata yang sedang ditanyakan ke user
// key = sessionId, value = kata yang tidak dikenal
const pendingLearning: Record<string, string> = {};

export class ChatbotService {

    async chat(message: string, history: any[] = [], sessionId: string = "default") {

        const cleanMessage = normalizeService.correctTypos(message);

        // ============================================
        // CEK: apakah user sedang menjawab pertanyaan
        // "apa maksud kata X?"
        // ============================================
        if (pendingLearning[sessionId]) {
            const unknownWord = pendingLearning[sessionId];
            const correction = cleanMessage.trim().toLowerCase();

            // Simpan ke database
            learningService.learn(unknownWord, correction);
            delete pendingLearning[sessionId];

            return {
                id: randomUUID(),
                role: "assistant",
                content: `✅ Terima kasih! Saya sudah belajar bahwa **"${unknownWord}"** artinya **"${correction}"**. Sekarang coba tanyakan lagi.`,
                table: []
            };
        }

        // ============================================
        // CEK: ada kata yang tidak dikenal?
        // ============================================
        const unknownWords = normalizeService.findUnknownWords(message);

        if (unknownWords.length > 0) {
            const unknownWord = unknownWords[0]; // tanya satu per satu

            // Simpan ke pending
            pendingLearning[sessionId] = unknownWord;

            return {
                id: randomUUID(),
                role: "assistant",
                content: `🤔 Maaf, saya tidak mengenal kata **"${unknownWord}"**. Maksudnya apa ya? (contoh: jumlah, karyawan, computer, tiket)`,
                table: []
            };
        }

        // ============================================
        // PROSES NORMAL
        // ============================================
        const isCount = normalizeService.isCountQuery(message);
        const result = intentService.detect(cleanMessage);

        if (result.intent !== "general") {
            const sqlResult = await sqlService.execute(cleanMessage);

            if (sqlResult && sqlResult.data && sqlResult.data.length > 0) {

                if (isCount) {
                    const count = sqlResult.data.length;
                    const label = this.getLabel(sqlResult.type);
                    const keyword = this.extractKeyword(cleanMessage);
                    const detail = keyword ? ` dengan kata kunci "${keyword}"` : "";

                    return {
                        id: randomUUID(),
                        role: "assistant",
                        content: `📊 **Jumlah ${label}${detail}: ${count}**`,
                        table: []
                    };
                }

                const stringifiedData = JSON.stringify(sqlResult.data.slice(0, 30));
                const promptInsight = `
                    Pengguna bertanya: "${message}".
                    Data dari database: ${stringifiedData}.
                    Berikan ringkasan singkat dalam bahasa Indonesia.
                    Sebutkan jumlah total dan insight singkat. Gunakan bullet points. Maksimal 3 poin.
                `;

                const aiExplanation = await gemini.chat(promptInsight, history);

                return {
                    id: randomUUID(),
                    role: "assistant",
                    content: aiExplanation,
                    table: sqlResult.data
                };

            } else {
                return {
                    id: randomUUID(),
                    role: "assistant",
                    content: "Data tidak ditemukan untuk kriteria tersebut.",
                    table: []
                };
            }
        }

        const answer = await gemini.chat(cleanMessage, history);
        return {
            id: randomUUID(),
            role: "assistant",
            content: answer,
            table: []
        };
    }

    private getLabel(type: string): string {
        const labels: Record<string, string> = {
            "employees": "Karyawan",
            "tickets": "Tiket",
            "workorders": "Work Order",
            "assets": "Aset Komputer"
        };
        return labels[type] ?? type;
    }

    private extractKeyword(message: string): string | null {
        const stopWords = [
            "jumlah", "berapa", "total", "data", "semua", "seluruh",
            "karyawan", "pegawai", "staff", "computer", "komputer", "laptop",
            "ticket", "tiket", "work", "order", "asset", "aset",
            "it", "hrd", "accounting", "marketing", "finance", "ppic",
            "jml", "comp", "cari", "tampilkan", "lihat", "di", "yang"
        ];

        const words = message.toLowerCase().split(" ")
            .filter(w => w.length > 1 && !stopWords.includes(w));

        return words.length > 0 ? words.join(" ") : null;
    }
}