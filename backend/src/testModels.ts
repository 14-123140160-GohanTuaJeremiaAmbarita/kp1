import "dotenv/config";
import { GoogleGenAI } from "@google/genai";

const MODELS = [

    "gemini-3.5-flash",

    "gemini-2.5-pro",

    "gemini-2.5-flash",

    "gemini-3.1-flash-lite",

    "gemini-2.0-flash",

    "gemini-2.5-flash-lite"

];

async function test() {

    const ai = new GoogleGenAI({

        apiKey: process.env.GEMINI_API_KEY!

    });

    console.log("====================================");
    console.log("CHECK GEMINI MODELS");
    console.log("====================================");

    for (const model of MODELS) {

        try {

            const result = await ai.models.generateContent({

                model,

                contents: "Balas hanya kata OK"

            });

            console.log("✅", model, "READY");

        }

        catch (err: any) {

            console.log("❌", model);

            if (err.status)
                console.log("Status :", err.status);

            if (err.message)
                console.log(err.message);

        }

        console.log("--------------------------------");

    }

}

test();