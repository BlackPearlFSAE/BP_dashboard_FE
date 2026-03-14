// WebSocket client for live telemetry streaming
const isDev = import.meta.env.DEV;

const getWsUrl = () => {
  if (isDev) {
    // In dev, Vite proxy handles /ws → backend
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    return `${protocol}//${window.location.host}/ws?role=dashboard`;
  }
  // Production: connect directly to backend
  return 'wss://blackpearl-ws-8z9a.onrender.com/?role=dashboard';
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
      // Auto-reconnect after 2s
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

  // Return cleanup function
  return () => {
    isDestroyed = true;
    clearTimeout(reconnectTimer);
    if (ws) {
      ws.close();
      ws = null;
    }
  };
};
