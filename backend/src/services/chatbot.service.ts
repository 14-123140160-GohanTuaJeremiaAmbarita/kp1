import { randomUUID } from "crypto";
import { GeminiService } from "../ai/openrouter.service";
import { SQLService } from "../ai/sql.service";
import { SchemaService } from "../ai/schema.service";
import { HistoryService } from "./history.service";

const gemini = new GeminiService();
const sqlService = new SQLService();
const schemaService = new SchemaService();
const historyService = new HistoryService();

export class ChatbotService {

    async chat(

        message: string,

        conversationId?: string,

        model: string = "Gemini"

    ) {

        try {

            //---------------------------------------------------
            // Conversation
            //---------------------------------------------------

            const currentConversationId =
                await historyService.createOrGetConversation(

                    conversationId,

                    message,

                    model

                );

            //---------------------------------------------------
            // Save User Message
            //---------------------------------------------------

            await historyService.saveUserMessage(

                currentConversationId,

                message,

                model

            );

            //---------------------------------------------------
            // Load History
            //---------------------------------------------------

            const history =
                await historyService.getConversationForAI(

                    currentConversationId

                );

            //---------------------------------------------------
            // Database Schema
            //---------------------------------------------------

            const schemaText =
                await schemaService.getSchemaText();

            //---------------------------------------------------
            // AI Analyze
            //---------------------------------------------------

            const aiResponse =
                await gemini.analyzeAndChat(

                    message,

                    schemaText,

                    history,

                    model

                );

            //---------------------------------------------------
            // SQL
            //---------------------------------------------------

            if (aiResponse.action === "EXECUTE_SQL") {

                if (
                    !aiResponse.sqlQuery ||
                    aiResponse.sqlQuery.trim() === ""
                ) {

                    const errorMessage =
                        "Maaf, saya belum dapat membuat SQL yang sesuai.";

                    await historyService.saveAssistantMessage(

                        currentConversationId,

                        errorMessage,

                        undefined,

                        model

                    );

                    return {

                        id: randomUUID(),

                        conversationId: currentConversationId,

                        role: "assistant",

                        content: errorMessage,

                        table: []

                    };

                }

                console.log(
                    "[AI SQL]",
                    aiResponse.sqlQuery
                );

                //---------------------------------------------------

                const sqlResult =
                    await sqlService.execute(

                        aiResponse.sqlQuery

                    );

                //---------------------------------------------------

                if (sqlResult.type === "error") {

                    const errorMessage =
                        "Terjadi kesalahan saat mengambil data.";

                    await historyService.saveAssistantMessage(

                        currentConversationId,

                        errorMessage,

                        aiResponse.sqlQuery,

                        model

                    );

                    return {

                        id: randomUUID(),

                        conversationId: currentConversationId,

                        role: "assistant",

                        content: errorMessage,

                        table: []

                    };

                }

                //---------------------------------------------------

                if (

                    sqlResult.data &&

                    sqlResult.data.length > 0

                ) {

                    const answer =
                        await gemini.generateFinalAnswerWithData(

                            message,

                            sqlResult.data,

                            history,

                            model

                        );

                    await historyService.saveAssistantMessage(

                        currentConversationId,

                        answer,

                        aiResponse.sqlQuery,

                        model

                    );

                    return {

                        id: randomUUID(),

                        conversationId: currentConversationId,

                        role: "assistant",

                        content: answer,

                        table: sqlResult.data

                    };

                }

                //---------------------------------------------------

                const noData =
                    "Data tidak ditemukan.";

                await historyService.saveAssistantMessage(

                    currentConversationId,

                    noData,

                    aiResponse.sqlQuery,

                    model

                );

                return {

                    id: randomUUID(),

                    conversationId: currentConversationId,

                    role: "assistant",

                    content: noData,

                    table: []

                };

            }

            //---------------------------------------------------
            // GENERAL CHAT
            //---------------------------------------------------

            await historyService.saveAssistantMessage(

                currentConversationId,

                aiResponse.content,

                undefined,

                model

            );

            return {

                id: randomUUID(),

                conversationId: currentConversationId,

                role: "assistant",

                content: aiResponse.content,

                table: []

            };

        }

        catch (err) {

            console.error(err);

            return {

                id: randomUUID(),

                role: "assistant",

                content: "Internal Server Error",

                table: []

            };

        }

    }

}