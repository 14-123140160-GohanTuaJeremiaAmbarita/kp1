// src/components/chat/ChatInput.tsx

import { useState, type KeyboardEvent } from "react";
import ModelSelector from "./ModelSelector";

interface Props {
  onSend(text: string): void;
  selectedModel: string;
  onModelChange(modelId: string): void;
}

export default function ChatInput({ onSend, selectedModel, onModelChange }: Props) {
  const [text, setText] = useState("");

  function send() {
    if (!text.trim()) return;
    onSend(text);
    setText("");
  }

  function keyDown(e: KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Enter") {
      send();
    }
  }

  return (
    <div className="chat-input">
      <input
        value={text}
        placeholder="Tanyakan Kepada Smart IT Assistant"
        onChange={(e) => setText(e.target.value)}
        onKeyDown={keyDown}
      />

      <ModelSelector selectedModel={selectedModel} onChange={onModelChange} />

      <button onClick={send}>Kirim</button>
    </div>
  );
}