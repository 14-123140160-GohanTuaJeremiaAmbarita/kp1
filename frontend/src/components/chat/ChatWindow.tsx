import { useEffect, useRef } from "react";
import type { ChatMessage } from "../../types/chat"; // Wajib import type
import DataTable from "./DataTable";
import MarkdownMessage from "./MarkdownMessage";

interface Props {
  messages: ChatMessage[];
  isTyping: boolean;
  onSuggest?: (text: string) => void;
}

export default function ChatWindow({ messages, isTyping, onSuggest }: Props) {
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (messages.length > 0 || isTyping) {
      bottomRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages, isTyping]);

  if (messages.length === 0 && !isTyping) {
    return (
      <div className="chat-window">
        <div className="empty-chat">
          <div className="empty-icon">💬</div>
          <h2>Halo! Saya Smart IT Assistant</h2>
          <p>Tanyakan data karyawan, tiket, aset, atau work order Voksel.</p>
          <div className="empty-suggestions">
            <span>💡 Coba tanya:</span>
            {["Berapa karyawan IT?", "Tampilkan tiket open", "Data komputer HRD"].map((s) => (
              <button key={s} onClick={() => onSuggest?.(s)}>{s}</button>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="chat-window">
      {messages.map((msg) => (
        <div key={msg.id} className={`chat-message ${msg.role === "user" ? "user" : "ai"}`}>
          {msg.role === "assistant" && <div className="avatar ai-avatar">AI</div>}
          <div className="bubble-wrapper">
            <div className="bubble">
              {msg.role === "assistant"
                ? <MarkdownMessage content={msg.content} />
                : <p style={{ whiteSpace: "pre-wrap" }}>{msg.content}</p>
              }
              
              {/* Ini yang akan merender tabel jika datanya ada */}
              {msg.table && msg.table.length > 0 && (
                <DataTable rows={msg.table} />
              )}
            </div>
            {msg.role === "assistant" && (
              <button
                className="copy-btn"
                onClick={() => navigator.clipboard.writeText(msg.content)}
              >
                📋 Salin
              </button>
            )}
          </div>
        </div>
      ))}

      {isTyping && (
        <div className="chat-message ai">
          <div className="avatar ai-avatar">AI</div>
          <div className="bubble-wrapper">
            <div className="bubble typing-bubble">
              <span className="dot" />
              <span className="dot" />
              <span className="dot" />
            </div>
          </div>
        </div>
      )}

      <div ref={bottomRef} />
    </div>
  );
}