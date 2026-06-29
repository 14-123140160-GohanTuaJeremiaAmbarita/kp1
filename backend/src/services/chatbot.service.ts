import { randomUUID } from "crypto";
import { GeminiService } from "../ai/gemini.service";
import { IntentService } from "../ai/intent.service";
import { SQLService } from "../ai/sql.service";
import { NormalizeService } from "../ai/normalize.service";

const gemini = new GeminiService();
const intentService = new IntentService();
const sqlService = new SQLService();
const normalizeService = new NormalizeService();

export class ChatbotService {
    
    // Tambahkan parameter history agar percakapan memiliki konteks memori berkelanjutan
    async chat(message: string, history: any[] = []) {
        
        // 1. SMART CORRECTION: Perbaiki typo terlebih dahulu
        const cleanMessage = normalizeService.correctTypos(message);

        // 2. DETEKSI INTENT (Tujuan Percakapan)
        const result = intentService.detect(cleanMessage);

        if (result.intent !== "general") {
            // Eksekusi pencarian data ke SQL Server
            const sqlResult = await sqlService.execute(cleanMessage);

            if (sqlResult && sqlResult.data && sqlResult.data.length > 0) {
                
                // ========================================================
                // FITUR 3: AI EXPLANATION & INSIGHT (PROMPT ENGINEERING)
                // ========================================================
                const stringifiedData = JSON.stringify(sqlResult.data.slice(0, 30)); // Batasi 30 baris agar AI tidak bingung
                const promptInsight = `
                    Pengguna bertanya: "${message}".
                    Sistem telah menarik data mentah berikut dari database SQL Server: ${stringifiedData}.
                    
                    Tugas Anda:
                    Jangan hanya memberikan data mentah. Berikan ringkasan insight yang cerdas dan penjelasan naratif yang mudah dipahami.
                    Sebutkan angka totalnya, dan berikan insight (misal: penyebab mayoritas tiket, atau departemen terbanyak). Gunakan bullet points.
                `;

                // Minta Gemini membuat narasi cerdas berdasarkan data SQL, dengan mempertimbangkan histori obrolan
                const aiExplanation = await gemini.chat(promptInsight, history);

                return {
                    id: randomUUID(),
                    role: "assistant",
                    content: aiExplanation, // Narasi cerdas dari Gemini
                    table: sqlResult.data   // Data mentah untuk di-render di komponen DataTable frontend
                };
            } else {
                return {
                    id: randomUUID(),
                    role: "assistant",
                    content: "Berdasarkan penelusuran di database, saya tidak menemukan data operasional yang relevan dengan kriteria tersebut.",
                    table: []
                };
            }
        }

        // Jika intent general (salam, pertanyaan umum), langsung chat biasa ke Gemini dengan memori history
        const answer = await gemini.chat(cleanMessage, history);

        return {
            id: randomUUID(),
            role: "assistant",
            content: answer,
            table: []
        };
    }
}