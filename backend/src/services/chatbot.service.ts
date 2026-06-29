import { randomUUID } from "crypto";

import { GeminiService } from "../ai/gemini.service";
import { IntentService } from "../ai/intent.service";
import { SQLService } from "../ai/sql.service";

const gemini = new GeminiService();

const intentService = new IntentService();

const sqlService = new SQLService();

export class ChatbotService {

    async chat(message: string) {

        const result = intentService.detect(message);

        if (result.intent !== "general") {

            const sqlResult = await sqlService.execute(message);

            if (sqlResult) {

                return {

                    id: randomUUID(),

                    role: "assistant",

                    content: sqlResult.answer,

                    table: sqlResult.data

                };

            }

        }

        const answer = await gemini.chat(message);

        return {

            id: randomUUID(),

            role: "assistant",

            content: answer,

            table: []

        };

    }

}