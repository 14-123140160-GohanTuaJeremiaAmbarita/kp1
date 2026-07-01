import { Request, Response } from "express";
import { ChatbotService } from "../services/chatbot.service";

const chatbotService = new ChatbotService();

export async function chat(
    req: Request,
    res: Response
) {

    try {

        const {

            message,

            conversationId,

            model

        } = req.body;

        if (!message) {

            return res.status(400).json({

                success: false,

                message: "Message is required."

            });

        }

        const result = await chatbotService.chat(

            message,

            conversationId,

            model || "Gemini"

        );

        return res.json({

            success: true,

            data: result

        });

    }

    catch (err) {

        console.error("Chat Controller Error:", err);

        return res.status(500).json({

            success: false,

            message: "Internal Server Error"

        });

    }

}