'use client';

import React, { useEffect, useRef, useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { toast } from 'sonner';

interface AlertMessage {
  student_id: string;
  behaviour_type: string;
  confidence: number;
  explanation: string;
  timestamp: string;
}

export function AlertProvider({ children }: { children: React.ReactNode }) {
  const { isAuthenticated } = useAuth();
  const wsRef = useRef<WebSocket | null>(null);
  const reconnectAttempts = useRef(0);
  const maxReconnectAttempts = 5;
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (!isAuthenticated) {
      if (wsRef.current) {
        wsRef.current.close();
        wsRef.current = null;
      }
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
      return;
    }

    const connect = () => {
      if (wsRef.current?.readyState === WebSocket.OPEN) return;

      const wsUrl = process.env.NEXT_PUBLIC_WS_URL || 'ws://localhost:8000';
      const ws = new WebSocket(`${wsUrl}/api/ws/alerts`);
      
      ws.onopen = () => {
        console.log('Alert WebSocket connected');
        reconnectAttempts.current = 0;
      };

      ws.onmessage = (event) => {
        try {
          const data: AlertMessage = JSON.parse(event.data);
          
          // Schema validation check (basic)
          if (data.student_id && data.behaviour_type && data.explanation) {
            toast(`Alert: ${data.behaviour_type}`, {
              description: `${data.student_id} - ${data.explanation}`,
              action: {
                label: 'View',
                onClick: () => window.location.href = '/dashboard/events',
              },
            });
          }
        } catch (err) {
          console.error('Failed to parse websocket message', err);
        }
      };

      ws.onclose = () => {
        console.log('Alert WebSocket disconnected');
        wsRef.current = null;
        
        if (isAuthenticated && reconnectAttempts.current < maxReconnectAttempts) {
          const timeout = Math.min(1000 * Math.pow(2, reconnectAttempts.current), 10000);
          reconnectAttempts.current += 1;
          console.log(`Reconnecting in ${timeout}ms... (Attempt ${reconnectAttempts.current})`);
          
          reconnectTimeoutRef.current = setTimeout(() => {
            connect();
          }, timeout);
        }
      };

      ws.onerror = () => {
        console.error('Alert WebSocket connection error occurred. Ensure backend is running.');
        ws.close();
      };

      wsRef.current = ws;
    };

    connect();

    return () => {
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
      if (wsRef.current) {
        wsRef.current.close();
        wsRef.current = null;
      }
    };
  }, [isAuthenticated]);

  return <>{children}</>;
}
