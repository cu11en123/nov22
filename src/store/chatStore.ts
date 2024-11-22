import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface ChatMessage {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: number;
}

interface Favorite {
  id: string;
  query: string;
  description: string;
  timestamp: number;
}

interface ChatState {
  messages: ChatMessage[];
  favorites: Favorite[];
  context: Record<string, any>;
  addMessage: (message: Omit<ChatMessage, 'id' | 'timestamp'>) => void;
  addFavorite: (query: string, description: string) => void;
  removeFavorite: (id: string) => void;
  clearMessages: () => void;
  updateContext: (newContext: Record<string, any>) => void;
  clearContext: () => void;
}

export const useChatStore = create<ChatState>()(
  persist(
    (set) => ({
      messages: [],
      favorites: [],
      context: {},
      addMessage: (message) =>
        set((state) => ({
          messages: [
            ...state.messages,
            {
              ...message,
              id: crypto.randomUUID(),
              timestamp: Date.now(),
            },
          ],
        })),
      addFavorite: (query, description) =>
        set((state) => ({
          favorites: [
            ...state.favorites,
            {
              id: crypto.randomUUID(),
              query,
              description,
              timestamp: Date.now(),
            },
          ],
        })),
      removeFavorite: (id) =>
        set((state) => ({
          favorites: state.favorites.filter((f) => f.id !== id),
        })),
      clearMessages: () => set({ messages: [] }),
      updateContext: (newContext) =>
        set((state) => ({
          context: { ...state.context, ...newContext },
        })),
      clearContext: () => set({ context: {} }),
    }),
    {
      name: 'chat-store',
    }
  )
);