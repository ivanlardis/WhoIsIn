import { useEffect, useRef, useState, useCallback } from "react";
import type { PipelineStatus } from "../types";

export function usePipelineWS(
  eventId: number | null
): PipelineStatus | null {
  const [status, setStatus] = useState<PipelineStatus | null>(null);
  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimeout = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const mountedRef = useRef(true);

  const connect = useCallback(() => {
    if (!eventId || !mountedRef.current) return;

    const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
    const url = `${protocol}//${window.location.host}/api/v1/events/${eventId}/pipeline/ws`;
    const ws = new WebSocket(url);
    wsRef.current = ws;

    ws.onmessage = (e) => {
      try {
        const data = JSON.parse(e.data) as PipelineStatus;
        if (mountedRef.current) setStatus(data);
      } catch {
        // ignore parse errors
      }
    };

    ws.onclose = () => {
      if (mountedRef.current) {
        reconnectTimeout.current = setTimeout(connect, 3000);
      }
    };

    ws.onerror = () => {
      ws.close();
    };
  }, [eventId]);

  useEffect(() => {
    mountedRef.current = true;
    connect();

    return () => {
      mountedRef.current = false;
      clearTimeout(reconnectTimeout.current);
      wsRef.current?.close();
    };
  }, [connect]);

  return status;
}
