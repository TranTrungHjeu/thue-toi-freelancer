"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Client } from "@stomp/stompjs";
import SockJS from "sockjs-client";
import { useAuth } from "./useAuth";
import { getAccessToken } from "../api/axiosClient";

const DEFAULT_HTTP_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL || "/api";

const WS_URL =
  process.env.NEXT_PUBLIC_WS_BASE_URL || DEFAULT_HTTP_BASE_URL.replace(/\/api\/?$/, "");

const NOTIFICATION_TOPIC_PREFIX = "/user/queue/notifications";

const parseMessagePayload = (body) => {
  try {
    return JSON.parse(body);
  } catch {
    return body;
  }
};

const resolveChannel = (topic) =>
  topic.startsWith(NOTIFICATION_TOPIC_PREFIX) ? "notification" : "contract";

export const useWebSocket = (onMessage, topics = []) => {
  const clientRef = useRef(null);
  const [isConnected, setIsConnected] = useState(false);
  const [connectionVersion, setConnectionVersion] = useState(0);
  const { user } = useAuth();
  const normalizedTopics = useMemo(
    () => [...new Set(topics.filter(Boolean))],
    [topics],
  );

  useEffect(() => {
    if (!user?.id || normalizedTopics.length === 0) {
      return undefined;
    }

    const client = new Client({
      webSocketFactory: () => new SockJS(`${WS_URL}/ws`),
      beforeConnect: () => {
        const accessToken = getAccessToken();
        client.connectHeaders = accessToken
          ? { Authorization: `Bearer ${accessToken}` }
          : {};
      },
      reconnectDelay: 5000,
      onConnect: () => {
        setIsConnected(true);
        setConnectionVersion((version) => version + 1);
        normalizedTopics.forEach((topic) => {
          client.subscribe(topic, (message) => {
            if (typeof onMessage !== "function") {
              return;
            }
            onMessage({
              channel: resolveChannel(topic),
              topic,
              payload: parseMessagePayload(message.body),
            });
          });
        });
      },
      onStompError: (error) => console.error("STOMP error", error),
      onDisconnect: () => setIsConnected(false),
      onWebSocketClose: () => setIsConnected(false),
    });

    client.activate();
    clientRef.current = client;

    return () => {
      client.deactivate();
      clientRef.current = null;
      setIsConnected(false);
    };
  }, [normalizedTopics, onMessage, user?.id]);

  const sendMessage = (destination, body) => {
    if (clientRef.current && isConnected) {
      clientRef.current.publish({ destination, body: JSON.stringify(body) });
    }
  };

  return { isConnected, connectionVersion, sendMessage };
};
