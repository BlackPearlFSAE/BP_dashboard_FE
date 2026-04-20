// WebSocket client for live telemetry streaming.
// Relative by default (FE & BE same origin via nginx/Vite proxy).
// Set VITE_WS_URL at build time to override (e.g. FE & BE on different hosts).
const getWsUrl = () => {
  if (import.meta.env.VITE_WS_URL) return import.meta.env.VITE_WS_URL;
  const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
  return `${protocol}//${window.location.host}/ws?role=dashboard`;
};

export const createTelemetrySocket = (onMessage, onStatusChange) => {
  let ws = null;
  let reconnectTimer = null;
  let isDestroyed = false;

  const connect = () => {
    if (isDestroyed) return;

    ws = new WebSocket(getWsUrl());
    onStatusChange?.('connecting');

    ws.onopen = () => {
      console.log('[WS] Dashboard connected');
      onStatusChange?.('connected');
    };

    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        onMessage(data);
      } catch (err) {
        console.error('[WS] Parse error:', err);
      }
    };

    ws.onclose = () => {
      console.log('[WS] Disconnected');
      onStatusChange?.('disconnected');
      if (!isDestroyed) {
        reconnectTimer = setTimeout(connect, 2000);
      }
    };

    ws.onerror = (err) => {
      console.error('[WS] Error:', err);
      ws.close();
    };
  };

  connect();

  const send = (msg) => {
    if (ws?.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify(msg));
    }
  };

  const cleanup = () => {
    isDestroyed = true;
    clearTimeout(reconnectTimer);
    if (ws) {
      ws.close();
      ws = null;
    }
  };

  return { cleanup, send };
};
