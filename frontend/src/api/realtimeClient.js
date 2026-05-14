import { getAccessToken } from './axiosClient';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || '';

const toWebSocketBaseUrl = (apiBaseUrl) => {
  const normalized = apiBaseUrl.replace(/\/+$/, '');
  if (normalized.startsWith('https://')) {
    return normalized.replace(/^https:\/\//, 'wss://').replace(/\/api$/, '');
  }
  if (normalized.startsWith('http://')) {
    return normalized.replace(/^http:\/\//, 'ws://').replace(/\/api$/, '');
  }
  
  if (typeof window !== 'undefined') {
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    return `${protocol}//${window.location.host}`;
  }
  
  return 'ws://localhost:3000';
};

export const createMessageRealtimeClient = ({ contractId, onMessage, onStatusChange }) => {
  let socket = null;
  let reconnectTimeout = null;
  let manuallyClosed = false;

  const notifyStatus = (status) => {
    if (typeof onStatusChange === 'function') {
      onStatusChange(status);
    }
  };

  const connect = () => {
    const accessToken = getAccessToken();
    if (!accessToken || !contractId) {
      notifyStatus('disconnected');
      return;
    }

    const wsBaseUrl = toWebSocketBaseUrl(API_BASE_URL);
    const params = new URLSearchParams({
      token: accessToken,
      contractId: String(contractId),
    });

    socket = new WebSocket(`${wsBaseUrl}/ws/messages?${params.toString()}`);
    notifyStatus('connecting');

    socket.onopen = () => {
      notifyStatus('connected');
    };

    socket.onmessage = (event) => {
      try {
        const payload = JSON.parse(event.data);
        if (payload?.event === 'MESSAGE_CREATED' && payload?.data && typeof onMessage === 'function') {
          onMessage(payload.data);
        }
      } catch {
        notifyStatus('degraded');
      }
    };

    socket.onclose = () => {
      notifyStatus('disconnected');
      if (!manuallyClosed) {
        reconnectTimeout = window.setTimeout(connect, 2000);
      }
    };

    socket.onerror = () => {
      notifyStatus('degraded');
    };
  };

  connect();

  return {
    close: () => {
      manuallyClosed = true;
      if (reconnectTimeout) {
        window.clearTimeout(reconnectTimeout);
      }
      if (socket && (socket.readyState === WebSocket.OPEN || socket.readyState === WebSocket.CONNECTING)) {
        socket.close();
      }
    },
  };
};
