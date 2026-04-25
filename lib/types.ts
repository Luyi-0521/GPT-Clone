export interface Message {
  id: string;
  content: string;
  role: 'user' | 'assistant';
  createdAt: string;
  editedAt?: string;
}

export interface Session {
  id: string;
  title: string;
  messages: Message[];
  createdAt: string;
}

export interface ModelConfig {
  id: string;
  name: string;
  description: string;
}