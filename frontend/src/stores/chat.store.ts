import { create } from 'zustand';

interface Message {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  type: string;
  createdAt: string;
  reactions?: { emoji: string; userId: string }[];
}

interface ChatState {
  messages: Message[];
  streamingContent: string;
  isStreaming: boolean;
  conversationId: string | null;
  setConversationId: (id: string | null) => void;
  setMessages: (messages: Message[]) => void;
  addMessage: (message: Message) => void;
  appendStream: (chunk: string) => void;
  finalizeStream: (messageId: string) => void;
  setIsStreaming: (v: boolean) => void;
  clearMessages: () => void;
}

export const useChatStore = create<ChatState>((set, get) => ({
  messages: [],
  streamingContent: '',
  isStreaming: false,
  conversationId: null,
  setConversationId: (id) => set({ conversationId: id }),
  setMessages: (messages) => set({ messages }),
  addMessage: (message) => set((s) => ({ messages: [...s.messages, message] })),
  appendStream: (chunk) => set((s) => ({ streamingContent: s.streamingContent + chunk })),
  finalizeStream: (messageId) => {
    const { streamingContent, messages } = get();
    const msg: Message = {
      id: messageId,
      role: 'assistant',
      content: streamingContent,
      type: 'TEXT',
      createdAt: new Date().toISOString(),
    };
    set({ messages: [...messages, msg], streamingContent: '', isStreaming: false });
  },
  setIsStreaming: (isStreaming) => set({ isStreaming }),
  clearMessages: () => set({ messages: [], streamingContent: '', isStreaming: false }),
}));
