// src/api/chat.ts

import api from "./axios";
import type { ChatMessage } from "../types/chat"; // Wajib menggunakan 'import type'

const SESSION_ID = crypto.randomUUID();

export async function sendMessage(
    message: string,
    history: Pick<ChatMessage, "role" | "content">[] = [],
    model?: string
): Promise<ChatMessage> {
    const { data } = await api.post("/chat", {
        message,
        history,
        sessionId: SESSION_ID,
        model
    });

    // Backend mengirim { success: true, message: { id, role, content, table } }
    // Kita langsung kembalikan 'data.message' agar mudah dipakai
    return data.message;
}