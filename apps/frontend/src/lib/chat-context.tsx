'use client';

import { createContext, useContext, useState, useEffect, useCallback, useRef, ReactNode } from 'react';
import { useApi } from './api-client';

interface Chat {
  id: string;
  title: string;
}

interface ChatContextType {
  chats: Chat[];
  refreshChats: () => Promise<void>;
  addChat: (chat: Chat) => void;
  removeChat: (id: string) => void;
  updateChat: (id: string, updates: Partial<Chat>) => void;
  isLoading: boolean;
}

const ChatContext = createContext<ChatContextType | undefined>(undefined);

export function ChatProvider({ children }: { children: ReactNode }) {
  const [chats, setChats] = useState<Chat[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const api = useApi();
  const apiRef = useRef(api);

  useEffect(() => {
    apiRef.current = api;
  }, [api]);

  const refreshChats = useCallback(async () => {
    try {
      const res = await apiRef.current.get('/chats');
      setChats(res || []);
    } catch (error) {
      console.error('Failed to fetch chats:', error);
    }
  }, []);

  const addChat = useCallback((chat: Chat) => {
    setChats((prev) => [chat, ...prev]);
  }, []);

  const removeChat = useCallback(async (id: string) => {
    try {
      await apiRef.current.delete(`/chats/${id}`);
      setChats((prev) => prev.filter((chat) => chat.id !== id));
    } catch (error) {
      console.error('Failed to delete chat:', error);
      throw error;
    }
  }, []);

  const updateChat = useCallback(async (id: string, updates: Partial<Chat>) => {
    try {
      await apiRef.current.put(`/chats/${id}`, updates);
      setChats((prev) =>
        prev.map((chat) => (chat.id === id ? { ...chat, ...updates } : chat))
      );
    } catch (error) {
      console.error('Failed to update chat:', error);
      throw error;
    }
  }, []);

  useEffect(() => {
    setIsLoading(true);
    refreshChats().finally(() => setIsLoading(false));
  }, [refreshChats]);

  return (
    <ChatContext.Provider
      value={{
        chats,
        refreshChats,
        addChat,
        removeChat,
        updateChat,
        isLoading,
      }}
    >
      {children}
    </ChatContext.Provider>
  );
}

export function useChats() {
  const context = useContext(ChatContext);
  if (!context) {
    throw new Error('useChats must be used within a ChatProvider');
  }
  return context;
}
