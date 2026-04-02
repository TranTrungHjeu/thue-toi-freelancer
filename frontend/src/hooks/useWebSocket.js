import { useEffect, useRef, useState } from 'react';
import { Client } from '@stomp/stompjs';
import SockJS from 'sockjs-client';
import { useAuth } from './useAuth';

const WS_URL = '/ws'; // matches WebSocketConfig

export const useWebSocket = (onMessage, topics = []) => {
  const clientRef = useRef(null);
  const [isConnected, setIsConnected] = useState(false);
  const { user } = useAuth();

  useEffect(() => {
    if (!user?.id) return;

    const client = new Client({
      webSocketFactory: () => new SockJS(WS_URL),
      reconnectDelay: 5000,
      onConnect: () => {
        setIsConnected(true);
        console.log('WebSocket connected');

        // Subscribe to user queue for notifications
        client.subscribe(`/user/queue/notifications`, (message) => {
          onMessage('notification', JSON.parse(message.body));
        });

        // Subscribe to custom topics (e.g. contract messages)
        topics.forEach(topic => {
          client.subscribe(topic, (message) => {
            onMessage('message', JSON.parse(message.body));
          });
        });
      },
      onStompError: (error) => console.error('STOMP error', error),
    });

    client.activate();
    clientRef.current = client;

    return () => {
      client.deactivate();
      setIsConnected(false);
    };
  }, [user?.id, onMessage, topics]);

  const sendMessage = (destination, body) => {
    if (clientRef.current && isConnected) {
      clientRef.current.publish({ destination, body: JSON.stringify(body) });
    }
  };

  return { isConnected, sendMessage };
};
