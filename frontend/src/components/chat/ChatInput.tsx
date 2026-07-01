// src/components/chat/ChatInput.tsx
import { useState, type KeyboardEvent, useRef, useEffect } from "react";
import ModelSelector from "./ModelSelector";

interface Props {
  onSend(text: string): void;
  selectedModel: string;
  onModelChange(modelId: string): void;
}

export default function ChatInput({ onSend, selectedModel, onModelChange }: Props) {
  const [text, setText] = useState("");
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  function send() {
    if (!text.trim()) return;
    onSend(text);
    setText("");
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto"; // Reset tinggi setelah kirim
    }
  }

  function keyDown(e: KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault(); // Mencegah enter membuat baris baru, langsung kirim
      send();
    }
  }

  // Efek untuk auto-resize tinggi textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
    }
  }, [text]);

  return (
    <div className="chat-input-container">
      <div className="chat-input-wrapper">
        <textarea
          ref={textareaRef}
          className="chat-textarea"
          value={text}
          placeholder="Tanyakan Kepada Smart IT Assistant..."
          onChange={(e) => setText(e.target.value)}
          onKeyDown={keyDown}
          rows={1}
        />

        <div className="chat-input-actions">
          <div className="chat-input-actions-left">
            <ModelSelector selectedModel={selectedModel} onChange={onModelChange} />
          </div>
          
          <div className="chat-input-actions-right">
            <button 
              className="send-button" 
              onClick={send} 
              disabled={!text.trim()}
              title="Kirim"
            >
              <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor">
                <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z"></path>
              </svg>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}