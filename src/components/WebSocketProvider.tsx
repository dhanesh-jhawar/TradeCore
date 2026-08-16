'use client';

import React, { createContext, useContext, useEffect, useRef, useState, useCallback } from 'react';

type WebSocketContextType = {
  subscribe: (channel: string, callback: (event: any) => void) => () => void;
  isConnected: boolean;
};

const WebSocketContext = createContext<WebSocketContextType | null>(null);

export function WebSocketProvider({ children }: { children: React.ReactNode }) {
  const [isConnected, setIsConnected] = useState(false);
  const wsRef = useRef<WebSocket | null>(null);
  
  // Track subscribers: channel -> set of callbacks
  const subscribersRef = useRef<Map<string, Set<(event: any) => void>>>(new Map());
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const reconnectDelayRef = useRef(1000); // Start with 1s

  const connect = useCallback(() => {
    if (wsRef.current?.readyState === WebSocket.OPEN || wsRef.current?.readyState === WebSocket.CONNECTING) {
      return;
    }

    try {
      const wsUrl = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1' 
        ? 'ws://localhost:3001' 
        : `ws://${window.location.hostname}:3001`; // Adjust for network deployments

      const ws = new WebSocket(wsUrl);

      ws.onopen = () => {
        setIsConnected(true);
        reconnectDelayRef.current = 1000; // Reset backoff
        
        // Resubscribe to active channels
        for (const channel of subscribersRef.current.keys()) {
          ws.send(JSON.stringify({ action: 'SUBSCRIBE', channel }));
        }
      };

      ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          const callbacks = subscribersRef.current.get(data.channel);
          if (callbacks) {
            callbacks.forEach(cb => cb(data));
          }
        } catch (err) {
          console.error('[WS Provider] Failed to parse message:', err);
        }
      };

      ws.onclose = () => {
        setIsConnected(false);
        wsRef.current = null;
        
        // Exponential backoff reconnect
        if (reconnectTimeoutRef.current) clearTimeout(reconnectTimeoutRef.current);
        reconnectTimeoutRef.current = setTimeout(() => {
          reconnectDelayRef.current = Math.min(reconnectDelayRef.current * 1.5, 10000);
          connect();
        }, reconnectDelayRef.current);
      };

      ws.onerror = (error) => {
        // console.error('[WS Provider] WebSocket error:', error);
        ws.close();
      };

      wsRef.current = ws;
    } catch (e) {
      console.error('[WS Provider] Connection failed:', e);
    }
  }, []);

  useEffect(() => {
    connect();
    return () => {
      if (reconnectTimeoutRef.current) clearTimeout(reconnectTimeoutRef.current);
      if (wsRef.current) wsRef.current.close();
    };
  }, [connect]);

  const subscribe = useCallback((channel: string, callback: (event: any) => void) => {
    if (!subscribersRef.current.has(channel)) {
      subscribersRef.current.set(channel, new Set());
      if (wsRef.current?.readyState === WebSocket.OPEN) {
        wsRef.current.send(JSON.stringify({ action: 'SUBSCRIBE', channel }));
      }
    }
    
    subscribersRef.current.get(channel)!.add(callback);

    // Return unsubscribe function
    return () => {
      const callbacks = subscribersRef.current.get(channel);
      if (callbacks) {
        callbacks.delete(callback);
        if (callbacks.size === 0) {
          subscribersRef.current.delete(channel);
          if (wsRef.current?.readyState === WebSocket.OPEN) {
            wsRef.current.send(JSON.stringify({ action: 'UNSUBSCRIBE', channel }));
          }
        }
      }
    };
  }, []);

  return (
    <WebSocketContext.Provider value={{ subscribe, isConnected }}>
      {children}
    </WebSocketContext.Provider>
  );
}

export function useWebSocket(channel: string | null, callback?: (event: any) => void) {
  const context = useContext(WebSocketContext);
  if (!context) {
    throw new Error('useWebSocket must be used within a WebSocketProvider');
  }

  useEffect(() => {
    if (!channel || !callback) return;
    const unsubscribe = context.subscribe(channel, callback);
    return () => unsubscribe();
  }, [channel, callback, context]);

  return context;
}
