import ReactMarkdown from "react-markdown";

interface Props {
  content: string;
}

export default function MarkdownMessage({ content }: Props) {
  return (
    <div className="markdown-body">
      <ReactMarkdown
        components={{
          code({ className, children }) {
            const isBlock = className?.includes("language-");
            const text = String(children).replace(/\n$/, "");

            if (isBlock) {
              return (
                <div className="code-block">
                  <div className="code-header">
                    <span>{className?.replace("language-", "") ?? "code"}</span>
                    <button
                      onClick={() => navigator.clipboard.writeText(text)}
                      className="code-copy"
                    >
                      📋 Salin
                    </button>
                  </div>
                  <pre><code>{text}</code></pre>
                </div>
              );
            }

            return <code className="inline-code">{text}</code>;
          },
          p({ children }) {
            return <p style={{ marginBottom: "8px" }}>{children}</p>;
          },
          ul({ children }) {
            return <ul className="md-list">{children}</ul>;
          },
          ol({ children }) {
            return <ol className="md-list">{children}</ol>;
          },
          li({ children }) {
            return <li className="md-list-item">{children}</li>;
          },
          strong({ children }) {
            return <strong style={{ fontWeight: 600, color: "var(--primary)" }}>{children}</strong>;
          },
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
}