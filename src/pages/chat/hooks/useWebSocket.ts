import { useRef, useEffect, useCallback, useState } from 'react';
import { createTwinSocket } from '../services/TwinSocket';
import type { TwinWebSocketEvent, TwinWsQuestionRequest } from '../types/TwinTypes';
import { getAuthToken } from '../utils/messageUtils';

const WS_URL = 'http://localhost:8080/ws';

interface UseWebSocketOptions {
  onEvent: (event: TwinWebSocketEvent) => void;
}

/**
 * Custom hook for managing WebSocket connection to the Twin service
 * Handles connection lifecycle and message sending
 */
export const useWebSocket = ({ onEvent }: UseWebSocketOptions) => {
  const socketRef = useRef<ReturnType<typeof createTwinSocket> | null>(null);
  const wsEventHandlerRef = useRef<(e: TwinWebSocketEvent) => void>(() => {});
  const [wsReady, setWsReady] = useState(false);

  /**
   * Update event handler reference when callback changes
   */
  useEffect(() => {
    wsEventHandlerRef.current = onEvent;
  }, [onEvent]);

  /**
   * Setup WebSocket connection (runs once on mount)
   */
  useEffect(() => {
    if (socketRef.current) return;

    const token = getAuthToken();
    if (!token) return;

    socketRef.current = createTwinSocket({
      wsUrl: WS_URL,
      token,
      onEvent: (event) => wsEventHandlerRef.current(event),
      onConnect: () => setWsReady(true),
      onDisconnect: () => setWsReady(false),
      onStompError: (msg) => {
        console.error('STOMP error:', msg);
        setWsReady(false);
      },
    });

    return () => {
      socketRef.current?.disconnect();
      socketRef.current = null;
    };
  }, []);

  /**
   * Send a chat message via WebSocket
   */
  const sendChat = useCallback((payload: TwinWsQuestionRequest) => {
    if (socketRef.current?.client?.connected) {
      socketRef.current.sendChat(payload);
      return true;
    }
    return false;
  }, []);

  /**
   * Check if WebSocket is connected and ready
   */
  const isConnected = useCallback(() => {
    return wsReady && socketRef.current?.client?.connected;
  }, [wsReady]);

  return {
    wsReady,
    sendChat,
    isConnected,
    socketRef,
  };
};
