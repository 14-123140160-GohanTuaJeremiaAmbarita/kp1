export interface TableRow {
  [key: string]: string | number | boolean | null;
}

export interface ChatResponse {
  success: boolean;
  answer: string;
  table?: TableRow[];
}

export interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  table?: TableRow[];
}