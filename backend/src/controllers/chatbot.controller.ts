import { Request, Response } from "express";
import { ChatbotService } from "../services/chatbot.service";

const chatbot = new ChatbotService();

export async function chat(req: Request, res: Response) {
    // console.log('tes');
    try {
        const { message, history, sessionId } = req.body;
        const result = await chatbot.chat(
            message,
            history || [],
            sessionId || "default"
        );

        res.json({ success: true, message: result });
    } catch (err) {
        console.error("Chat Controller Error:", err);
        res.status(500).json({ success: false, message: "Internal Server Error" });
    }
}