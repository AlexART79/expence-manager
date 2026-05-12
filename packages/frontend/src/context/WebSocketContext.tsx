import {
  createContext,
  useContext,
  useEffect,
  useRef,
  useState,
  useCallback,
  type ReactNode,
} from 'react';
import { z } from 'zod';
import { useAuth } from './AuthContext.tsx';
import { logger } from '../lib/logger.ts';

export interface BudgetAlert {
  id: string;
  month: string;
  threshold: number;
  usagePercent: number;
}

interface WebSocketContextValue {
  alerts: BudgetAlert[];
  dismissAlert: (id: string) => void;
}

const WS_BASE_URL = (import.meta.env['VITE_API_BASE_URL'] ?? 'http://localhost:3000').replace(
  /^http/,
  'ws',
);

const AlertMessageSchema = z.object({
  type: z.literal('budget_alerts.alert'),
  payload: z.object({
    month: z.string(),
    threshold: z.number(),
    usagePercent: z.number(),
  }),
});

const WebSocketContext = createContext<WebSocketContextValue | null>(null);

export function WebSocketProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const wsRef = useRef<WebSocket | null>(null);
  const [alerts, setAlerts] = useState<BudgetAlert[]>([]);

  useEffect(() => {
    if (!user) {
      wsRef.current?.close();
      wsRef.current = null;
      return;
    }

    const ws = new WebSocket(WS_BASE_URL);
    wsRef.current = ws;

    ws.onopen = () => {
      ws.send(
        JSON.stringify({ type: 'budget_alerts.subscribe', payload: { month: 'current' } }),
      );
      logger.info('WebSocket connected and subscribed');
    };

    ws.onmessage = (event) => {
      try {
        const raw = JSON.parse(event.data as string) as unknown;
        const parsed = AlertMessageSchema.safeParse(raw);
        if (!parsed.success) return;
        const { month, threshold, usagePercent } = parsed.data.payload;
        setAlerts((prev) => [
          ...prev,
          { id: `${threshold}-${Date.now()}`, month, threshold, usagePercent },
        ]);
      } catch {
        // ignore malformed messages
      }
    };

    ws.onerror = () => logger.warn('WebSocket error');
    ws.onclose = () => logger.info('WebSocket disconnected');

    return () => {
      ws.close();
    };
  }, [user]);

  const dismissAlert = useCallback((id: string) => {
    setAlerts((prev) => prev.filter((a) => a.id !== id));
  }, []);

  return (
    <WebSocketContext.Provider value={{ alerts, dismissAlert }}>
      {children}
    </WebSocketContext.Provider>
  );
}

export function useWebSocket(): WebSocketContextValue {
  const ctx = useContext(WebSocketContext);
  if (!ctx) throw new Error('useWebSocket must be used inside WebSocketProvider');
  return ctx;
}
