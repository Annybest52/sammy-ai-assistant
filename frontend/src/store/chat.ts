import { create } from 'zustand';

export interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  audioUrl?: string;
  actions?: Array<{
    tool: string;
    result: string;
    success: boolean;
  }>;
}

interface ChatState {
  messages: Message[];
  isTyping: boolean;
  sessionId: string | null;
  isConnected: boolean;
  
  addMessage: (message: Omit<Message, 'id' | 'timestamp'>) => void;
  setTyping: (isTyping: boolean) => void;
  setSessionId: (sessionId: string) => void;
  setConnected: (isConnected: boolean) => void;
  clearMessages: () => void;
}

export const useChatStore = create<ChatState>((set) => ({
  messages: [],
  isTyping: false,
  sessionId: null,
  isConnected: false,

  addMessage: (message) =>
    set((state) => ({
      messages: [
        ...state.messages,
        {
          ...message,
          id: crypto.randomUUID(),
          timestamp: new Date(),
        },
      ],
    })),

  setTyping: (isTyping) => set({ isTyping }),
  
  setSessionId: (sessionId) => set({ sessionId }),
  
  setConnected: (isConnected) => set({ isConnected }),
  
  clearMessages: () => set({ messages: [] }),
}));


