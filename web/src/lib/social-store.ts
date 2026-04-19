import { create } from 'zustand';
import { socialApi } from './api';

interface Message {
  id: number;
  sender_id: number;
  receiver_id: number;
  content: string;
  is_read: boolean;
  created_at: string;
}

interface SocialState {
  similarMinds: any[];
  messages: Record<number, Message[]>;
  isLoading: boolean;
  fetchSimilarMinds: () => Promise<void>;
  fetchMessages: (otherId: number) => Promise<void>;
  sendMessage: (receiverId: number, content: string) => Promise<void>;
}

export const useSocialStore = create<SocialState>((set, get) => ({
  similarMinds: [],
  messages: {},
  isLoading: false,

  fetchSimilarMinds: async () => {
    set({ isLoading: true });
    try {
      const res = await socialApi.getSimilarMinds();
      set({ similarMinds: res.data.data.matches, isLoading: false });
    } catch (err) {
      console.error("Failed to fetch similar minds", err);
      set({ isLoading: false });
    }
  },

  fetchMessages: async (otherId) => {
    try {
      const res = await socialApi.getMessages(otherId);
      set((state) => ({
        messages: {
          ...state.messages,
          [otherId]: res.data.data.messages
        }
      }));
    } catch (err) {
      console.error("Failed to fetch messages", err);
    }
  },

  sendMessage: async (receiverId, content) => {
    try {
      await socialApi.sendMessage(receiverId, content);
      // Refresh messages
      await get().fetchMessages(receiverId);
    } catch (err) {
      console.error("Failed to send message", err);
      throw err;
    }
  }
}));
