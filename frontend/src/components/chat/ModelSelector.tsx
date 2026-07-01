import { useEffect, useRef, useState } from "react";
import { MODEL_OPTIONS } from "../../types/models";

interface Props {
  selectedModel: string;
  onChange: (modelId: string) => void; // Format TS diperbaiki
}

export default function ModelSelector({ selectedModel, onChange }: Props) {
  const [open, setOpen] = useState(false);
  const wrapperRef = useRef<HTMLDivElement>(null);

  const current = MODEL_OPTIONS.find((m) => m.id === selectedModel) ?? MODEL_OPTIONS[0];

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div className="model-selector" ref={wrapperRef}>
      <button
        type="button"
        className="model-selector-trigger"
        onClick={() => setOpen((v) => !v)}
      >
        {current.label}
        <span className={`model-selector-caret ${open ? "up" : ""}`}>⌄</span>
      </button>

      {open && (
        <div className="model-selector-menu">
          {MODEL_OPTIONS.map((model) => (
            <button
              type="button"
              key={model.id}
              className={`model-selector-item ${model.id === selectedModel ? "active" : ""}`}
              onClick={() => {
                onChange(model.id);
                setOpen(false);
              }}
            >
              <div className="model-selector-item-main">
                <span className="model-selector-item-label">{model.label}</span>
                <span className="model-selector-item-badge">{model.badge}</span>
              </div>
              {model.id === selectedModel && <span className="model-selector-check">✓</span>}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}