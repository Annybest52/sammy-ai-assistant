import { useEffect, useRef, useCallback } from 'react';
import { io, Socket } from 'socket.io-client';
import { useChatStore } from '../store/chat';

const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || 'http://localhost:3001';

export function useSocket() {
  const socketRef = useRef<Socket | null>(null);
  const { setTyping, addMessage, setConnected, setSessionId, sessionId } = useChatStore();

  useEffect(() => {
    // Generate session ID if not exists
    let currentSessionId = sessionId;
    if (!currentSessionId) {
      currentSessionId = crypto.randomUUID();
      setSessionId(currentSessionId);
    }

    // Initialize socket connection
    socketRef.current = io(SOCKET_URL, {
      query: { sessionId: currentSessionId },
      transports: ['websocket', 'polling'],
    });

    const socket = socketRef.current;

    socket.on('connect', () => {
      console.log('🔌 Connected to server');
      setConnected(true);
    });

    socket.on('disconnect', () => {
      console.log('🔌 Disconnected from server');
      setConnected(false);
    });

    socket.on('agent:typing', ({ isTyping }: { isTyping: boolean }) => {
      setTyping(isTyping);
    });

    socket.on('agent:response', (data: {
      message: string;
      actions?: Array<{ tool: string; result: string; success: boolean }>;
      audioUrl?: string;
    }) => {
      addMessage({
        role: 'assistant',
        content: data.message,
        actions: data.actions,
        audioUrl: data.audioUrl,
      });
    });

    socket.on('agent:error', ({ message }: { message: string }) => {
      addMessage({
        role: 'assistant',
        content: message,
      });
    });

    return () => {
      socket.disconnect();
    };
  }, []);

  const sendMessage = useCallback((message: string, userId?: string) => {
    if (socketRef.current?.connected) {
      addMessage({ role: 'user', content: message });
      socketRef.current.emit('chat:message', { message, userId });
    }
  }, [addMessage]);

  return { sendMessage };
}


