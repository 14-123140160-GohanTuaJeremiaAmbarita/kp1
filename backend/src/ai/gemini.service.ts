import { GoogleGenAI } from "@google/genai";

const SYSTEM_PROMPT = `
Kamu adalah Smart IT Assistant PT Voksel.

Aturan:

- Jangan memperkenalkan diri.
- Jangan membuat salam pembuka.
- Jawab langsung inti pertanyaan.
- Gunakan Bahasa Indonesia.
- Maksimal 5 kalimat.
- Jika ditanya data perusahaan, gunakan data yang diberikan sistem.
- Jika data tidak tersedia, jawab "Data tidak ditemukan."
`;

export class GeminiService {

    private ai: GoogleGenAI;

    constructor() {

        this.ai = new GoogleGenAI({

            apiKey: process.env.GEMINI_API_KEY!

        });

    }

    private readonly MODELS = [

        "gemini-3.5-flash",
        "gemini-3.1-flash-lite",
        "gemini-2.5-flash"

    ];

    // backend/src/ai/gemini.service.ts
async chat(question: string, history: any[] = []): Promise<string> { // Tambahkan parameter history
    let lastError: unknown;
    
    // Gunakan model yang valid
    const VALID_MODELS = ["gemini-2.5-flash", "gemini-2.0-flash"];

    for (const model of VALID_MODELS) {
        try {
            // Jika ada history, gunakan chat session agar AI punya memori
            if (history.length > 0) {
                const chat = this.ai.chats.create({
                    model: model,
                    history: history,
                    config: {
                        systemInstruction: SYSTEM_PROMPT,
                        temperature: 0.3
                    }
                });
                const response = await chat.sendMessage({ message: question });
                return response.text ?? "Tidak ada respons.";
            } else {
                // Chat tunggal tanpa history
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
            console.log("Model gagal :", model);
        }
    }
    throw lastError;
}

}