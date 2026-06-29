import "dotenv/config";
import { GeminiService } from "./ai/gemini.service";

async function main() {

    const ai = new GeminiService();

    const result = await ai.chat(

        "Apa itu HRD?"

    );

    console.log(result);

}

main().catch(console.error);