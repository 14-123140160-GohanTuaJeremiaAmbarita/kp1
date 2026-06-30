import { useState } from "react";
import Layout from "../components/layout/Layout";
import Dashboard from "../components/dashboard/Dashboard";
import KnowledgePage from "../components/knowledge/KnowledgePage";
import { sendMessage } from "../api/chat";
import type { ChatMessage } from "../types/chat"; // Wajib import type

export default function Home() {
    const [messages, setMessages] = useState<ChatMessage[]>([]);
    const [isTyping, setIsTyping] = useState(false);
    const [activePage, setActivePage] = useState("Chat");

    async function handleSend(text: string) {
        const user: ChatMessage = {
            id: crypto.randomUUID(),
            role: "user",
            content: text,
        };

        const updatedMessages = [...messages, user];
        setMessages(updatedMessages);
        setIsTyping(true);

        try {
            const history = messages.map(m => ({
                role: m.role,
                content: m.content
            }));

            // Response sekarang langsung berupa objek ChatMessage
            const botMessage = await sendMessage(text, history);
            setMessages([...updatedMessages, botMessage]);

        } catch (error) {
            setMessages(old => [...old, {
                id: crypto.randomUUID(),
                role: "assistant",
                content: "Terjadi kesalahan pada server. Coba lagi.",
            }]);
        } finally {
            setIsTyping(false);
        }
    }

    return (
        <Layout
            messages={messages}
            isTyping={isTyping}
            onSend={handleSend}
            activePage={activePage}
            onPageChange={setActivePage}
            dashboardContent={<Dashboard />}
            knowledgeContent={<KnowledgePage />}
        />
    );
}