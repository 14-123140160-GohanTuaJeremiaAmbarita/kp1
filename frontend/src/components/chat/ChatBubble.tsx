export const ChatBubble = ({ message }: { message: ChatMessage }) => {
    return (
        <div className={`chat-bubble ${message.role}`}>
            {/* Render teks jawaban */}
            <div className="chat-content">
                <MarkdownMessage content={message.content || ""} />
            </div>

            {/* Render DataTable HANYA jika array table ada dan panjangnya > 0 */}
            {message.table && message.table.length > 0 && (
                <div className="chat-table-container mt-4 overflow-x-auto">
                    <DataTable data={message.table} />
                </div>
            )}
        </div>
    );
};