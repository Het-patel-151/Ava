import { create } from 'zustand';

type VoiceStatus = 'idle' | 'listening' | 'thinking' | 'speaking';

interface VoiceState {
  status: VoiceStatus;
  transcript: string;
  response: string;
  isConnected: boolean;
  conversationId: string | null;
  setStatus: (status: VoiceStatus) => void;
  setTranscript: (transcript: string) => void;
  setResponse: (response: string) => void;
  setConnected: (connected: boolean) => void;
  setConversationId: (id: string | null) => void;
  reset: () => void;
}

export const useVoiceStore = create<VoiceState>((set) => ({
  status: 'idle',
  transcript: '',
  response: '',
  isConnected: false,
  conversationId: null,
  setStatus: (status) => set({ status }),
  setTranscript: (transcript) => set({ transcript }),
  setResponse: (response) => set({ response }),
  setConnected: (isConnected) => set({ isConnected }),
  setConversationId: (conversationId) => set({ conversationId }),
  reset: () => set({ status: 'idle', transcript: '', response: '' }),
}));
