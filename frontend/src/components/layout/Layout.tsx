import Sidebar from "./Sidebar";
import Topbar from "./Topbar";
import ChatWindow from "../chat/ChatWindow";
import ChatInput from "../chat/ChatInput";
import type { ChatMessage } from "../../types/chat";
import type { ReactNode } from "react";

interface Props {
    messages: ChatMessage[];
    isTyping: boolean;
    onSend: (text: string) => void;
    activePage: string;
    onPageChange: (page: string) => void;
    dashboardContent: ReactNode;
    knowledgeContent: ReactNode;
}

export default function Layout({
    messages, isTyping, onSend,
    activePage, onPageChange,
    dashboardContent, knowledgeContent
}: Props) {
    return (
        <div className="app-layout">
            <Sidebar active={activePage} onSelect={onPageChange} />
            <main className="main-content">
                <Topbar activePage={activePage} />

                {activePage === "Chat" ? (
                    <section className="chat-area">
                        <ChatWindow
                            messages={messages}
                            isTyping={isTyping}
                            onSuggest={onSend}
                        />
                        <ChatInput onSend={onSend} />
                    </section>
                ) : activePage === "Dashboard" ? (
                    dashboardContent
                ) : activePage === "Knowledge" ? (
                    knowledgeContent
                ) : (
                    <div className="dash-loading">
                        <p>🚧 Halaman <strong>{activePage}</strong> belum tersedia.</p>
                    </div>
                )}
            </main>
        </div>
    );
}