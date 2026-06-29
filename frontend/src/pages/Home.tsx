import { useState } from "react";
import Layout from "../components/layout/Layout";
import Dashboard from "../components/dashboard/Dashboard";
import { sendMessage } from "../api/chat";
import type { ChatMessage } from "../types/chat";

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
    setMessages((old) => [...old, user]);
    setIsTyping(true);

    try {
      const response = await sendMessage(text);
      setMessages((old) => [...old, response.message]);
    } catch {
      setMessages((old) => [
        ...old,
        { id: crypto.randomUUID(), role: "assistant", content: "Terjadi kesalahan.", table: [] },
      ]);
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
    />
  );
}