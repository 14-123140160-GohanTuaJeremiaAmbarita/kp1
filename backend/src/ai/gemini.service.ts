import { GoogleGenAI } from "@google/genai";

const SYSTEM_PROMPT = `
Kamu adalah Smart IT Assistant PT Voksel Electric Tbk.

Aturan:
- Jawab langsung inti pertanyaan dalam Bahasa Indonesia.
- Jangan membuat salam pembuka atau memperkenalkan diri.
- Maksimal 5 kalimat, gunakan bullet points jika perlu.
- Jika ditanya data perusahaan, gunakan data yang diberikan sistem.
- Jika data tidak tersedia, jawab "Data tidak ditemukan."
- Kamu boleh menjawab pertanyaan umum, bahasa, dan pengetahuan umum.
`;

interface HistoryMessage {
    role: string;
    content: string;
}

export class GeminiService {

    private ai: GoogleGenAI;

    constructor() {
        this.ai = new GoogleGenAI({
            apiKey: process.env.GEMINI_API_KEY!
        });
    }

    private readonly MODELS = [
        "gemini-2.5-flash",
        "gemini-2.0-flash",
        "gemini-1.5-flash",
    ];

    async chat(question: string, history: HistoryMessage[] = []): Promise<string> {
        let lastError: unknown;

        // Konversi history: "assistant" → "model" (format Gemini)
        const geminiHistory = history
            .filter(h => h.role === "user" || h.role === "assistant" || h.role === "model")
            .map(h => ({
                role: h.role === "assistant" ? "model" : h.role,
                parts: [{ text: h.content }]
            }));

        for (const model of this.MODELS) {
            try {
                if (geminiHistory.length > 0) {
                    const chat = this.ai.chats.create({
                        model,
                        history: geminiHistory,
                        config: {
                            systemInstruction: SYSTEM_PROMPT,
                            temperature: 0.3,
                            maxOutputTokens: 1000
                        }
                    });
                    const response = await chat.sendMessage({ message: question });
                    return response.text?.trim() ?? "Tidak ada respons.";
                } else {
                    const response = await this.ai.models.generateContent({
                        model,
                        contents: question,
                        config: {
                            systemInstruction: SYSTEM_PROMPT,
                            temperature: 0.2,
                            maxOutputTokens: 1000
                        }
                    });
                    return response.text?.trim() ?? "Tidak ada respons.";
                }
            } catch (err) {
                lastError = err;
                console.log("Model gagal:", model);
            }
        }
        throw lastError;
    }
}