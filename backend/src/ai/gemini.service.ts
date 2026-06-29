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

    async chat(question: string): Promise<string> {

        let lastError: unknown;

        for (const model of this.MODELS) {

            try {

                const response =
                    await this.ai.models.generateContent({

                        model,

                        contents: question,

                        config: {

                            systemInstruction: SYSTEM_PROMPT,

                            temperature: 0.2,

                            maxOutputTokens: 1000

                        }

                    });

                const text = response.text?.trim();

                if (text) {

                    return text;

                }

            }

            catch (err) {

                lastError = err;

                console.log("Model gagal :", model);

            }

        }

        throw lastError;

    }

}