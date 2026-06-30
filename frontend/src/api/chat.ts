import api from "./axios";
import type { ChatMessage } from "../types/chat";

const SESSION_ID = crypto.randomUUID();

export async function sendMessage(message: string, history: Pick<ChatMessage, "role" | "content">[] = []) {
    const { data } = await api.post("/chat", {
        message,
        history,
        sessionId: SESSION_ID
    });
    return data;
}