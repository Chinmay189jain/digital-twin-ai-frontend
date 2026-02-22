import React, { createContext, useContext, useEffect, useRef, useCallback, useState } from 'react';
import { createTwinSocket } from '../pages/chat/services/TwinSocket';
import type { TwinWebSocketEvent, TwinWsQuestionRequest } from '../pages/chat/types/TwinTypes';
import { getAuthToken } from '../pages/chat/utils/messageUtils';
import { useAuth } from './AuthContext';

const WS_URL = (process.env.REACT_APP_WS_URL || "/ws").trim();

interface WebSocketContextType {
  isConnected: () => boolean;
  sendChat: (payload: TwinWsQuestionRequest) => boolean;
  subscribe: (handler: (event: TwinWebSocketEvent) => void) => () => void; // Returns unsubscribe function
}

const WebSocketContext = createContext<WebSocketContextType | undefined>(undefined);

/**
 * WebSocket Context Provider
 * 
 * Manages a single WebSocket connection per logged-in user
 * - Creates connection when user logs in
 * - Reuses connection across Chat component mounts/switches
 * - Properly cleans up on logout with race condition prevention
 * - Supports multiple event subscribers (e.g., multiple Chat instances)
 * - Auto-cleanup on provider unmount
 */
export const WebSocketProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  
  const socketRef = useRef<ReturnType<typeof createTwinSocket> | null>(null);
  const [wsReady, setWsReady] = useState(false);
  
  // Multiple components can subscribe to events
  // Each subscription gets a unique ID for easy unsubscribing
  const subscribersRef = useRef<Map<string, (event: TwinWebSocketEvent) => void>>(new Map());
  const subscriberCounterRef = useRef(0);
  
  // Track if cleanup is in progress to avoid race conditions
  const isCleaningUpRef = useRef(false);

  /**
   * Handler that broadcasts events to all subscribers
   */
  const handleBroadcastEvent = useCallback((event: TwinWebSocketEvent) => {
    subscribersRef.current.forEach((handler) => {
      try {
        handler(event);
      } catch (error) {
        console.error('Error in WebSocket event handler:', error);
      }
    });
  }, []);

  /**
   * Clean up WebSocket connection
   * Called on logout or component unmount
   */
  const cleanupSocket = useCallback(() => {
    if (isCleaningUpRef.current) return; // Prevent double cleanup
    
    isCleaningUpRef.current = true;
    
    try {
      if (socketRef.current) {
        
        // Disconnect STOMP and close the WebSocket
        socketRef.current.disconnect();
        socketRef.current = null;
        
        // Clear all subscribers
        subscribersRef.current.clear();
        subscriberCounterRef.current = 0;
        
        setWsReady(false);
      }
    } catch (error) {
      console.error('[WebSocket] Error during cleanup:', error);
    } finally {
      isCleaningUpRef.current = false;
    }
  }, []);

  /**
   * Initialize WebSocket when user logs in
   * Clean up when user logs out
   */
  useEffect(() => {
    // User logged out - disconnect socket
    if (!user) {
      cleanupSocket();
      return;
    }

    // Socket already exists - skip re-initialization
    if (socketRef.current) {
      return;
    }

    // Create new socket for logged-in user
    const token = getAuthToken();
    if (!token) {
      console.warn('[WebSocket] No token available, cannot connect');
      return;
    }

    socketRef.current = createTwinSocket({
      wsUrl: WS_URL,
      token,
      onEvent: handleBroadcastEvent,
      onConnect: () => {
        setWsReady(true);
      },
      onDisconnect: () => {
        setWsReady(false);
      },
      onStompError: (msg) => {
        console.error('[WebSocket] STOMP error:', msg);
        setWsReady(false);
      },
    });
  }, [user, handleBroadcastEvent, cleanupSocket]);

  /**
   * Clean up socket on component unmount
   */
  useEffect(() => {
    return () => {
      cleanupSocket();
    };
  }, [cleanupSocket]);

  /**
   * Send a chat message via WebSocket
   */
  const sendChat = useCallback((payload: TwinWsQuestionRequest) => {
    if (socketRef.current?.client?.connected) {
      socketRef.current.sendChat(payload);
      return true;
    }
    console.warn('[WebSocket] Not connected, cannot send chat');
    return false;
  }, []);

  /**
   * Check if WebSocket is connected and ready
   */
  const isConnected = useCallback(() => {
    return wsReady && (socketRef.current?.client?.connected ?? false);
  }, [wsReady]);

  /**
   * Subscribe to WebSocket events
   * Returns unsubscribe function
   */
  const subscribe = useCallback((handler: (event: TwinWebSocketEvent) => void) => {
    const subscriberId = `sub_${++subscriberCounterRef.current}`;
    subscribersRef.current.set(subscriberId, handler);

    // Return unsubscribe function
    return () => {
      subscribersRef.current.delete(subscriberId);
    };
  }, []);

  const value: WebSocketContextType = {
    isConnected,
    sendChat,
    subscribe,
  };

  return (
    <WebSocketContext.Provider value={value}>
      {children}
    </WebSocketContext.Provider>
  );
};

/**
 * Hook to use WebSocket context
 */
export const useWebSocketContext = (): WebSocketContextType => {
  const context = useContext(WebSocketContext);
  if (!context) {
    throw new Error('useWebSocketContext must be used within a WebSocketProvider');
  }
  return context;
};
