export interface Conversation {
    ConversationId: string;
    Title: string;
    Model?: string;
    CreatedAt: Date;
    UpdatedAt: Date;
}

export interface Message {
    MessageId: string;
    ConversationId: string;
    Role: "user" | "assistant" | "system";
    Content: string;
    SqlQuery?: string;
    Model?: string;
    CreatedAt: Date;
}

export interface CreateConversationRequest {
    title: string;
    model?: string;
}

export interface CreateMessageRequest {
    conversationId: string;
    role: string;
    content: string;
    sqlQuery?: string;
    model?: string;
}