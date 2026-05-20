import { useEffect, useRef, useState, useCallback } from "react";
import { Client } from "@stomp/stompjs";
import SockJS from "sockjs-client";
import { getAccessToken } from "../api/axiosClient";
import { getWsBaseUrl } from "../api/realtimeClient";

const WS_BASE_URL = getWsBaseUrl();

/**
 * Hook chuyên dụng để lắng nghe cập nhật trạng thái thanh toán theo thời gian thực qua WebSocket (STOMP).
 *
 * @param {string} orderCode - Mã đơn hàng cần theo dõi.
 * @param {function} onStatusChange - Hàm callback được gọi khi có thông tin trạng thái mới.
 * @returns {object} Trạng thái kết nối và phương thức điều khiển.
 */
export const usePaymentWebSocket = (orderCode, onStatusChange) => {
  const [isConnected, setIsConnected] = useState(false);
  const [error, setError] = useState(null);
  const clientRef = useRef(null);

  // Ghi nhớ callback để tránh việc khởi tạo lại client không cần thiết
  const onStatusChangeRef = useRef(onStatusChange);
  useEffect(() => {
    onStatusChangeRef.current = onStatusChange;
  }, [onStatusChange]);

  const connect = useCallback(() => {
    if (!orderCode) return;

    // Cấu hình client STOMP chuyên nghiệp
    const client = new Client({
      // SockJS factory đảm bảo hoạt động tốt trên cả các trình duyệt cũ hoặc qua proxy hạn chế
      webSocketFactory: () => {
        // Sử dụng endpoint cụ thể /ws/stomp đã được cấu hình ở Backend
        return new SockJS(`${WS_BASE_URL}/ws/stomp`);
      },
      beforeConnect: () => {
        const accessToken = getAccessToken();
        client.connectHeaders = accessToken
          ? { Authorization: `Bearer ${accessToken}` }
          : {};
      },
      reconnectDelay: 5000,
      heartbeatIncoming: 10000,
      heartbeatOutgoing: 10000,
      debug: (msg) => {
        if (import.meta.env?.DEV) console.log("[PaymentWS]:", msg);
      },
      onConnect: (frame) => {
        setIsConnected(true);
        setError(null);

        const topic = `/topic/payments/${orderCode}`;
        client.subscribe(topic, (message) => {
          try {
            const data = JSON.parse(message.body);
            onStatusChangeRef.current?.(data);
          } catch (err) {
            console.error("[PaymentWS] Error parsing message:", err);
          }
        });
      },
      onStompError: (frame) => {
        console.error("[PaymentWS] Broker error:", frame.headers["message"]);
        setError(frame.body);
      },
      onDisconnect: () => {
        setIsConnected(false);
      },
      onWebSocketClose: () => {
        setIsConnected(false);
      },
    });

    client.activate();
    clientRef.current = client;
  }, [orderCode]);

  useEffect(() => {
    connect();

    return () => {
      if (clientRef.current) {
        clientRef.current.deactivate();
        clientRef.current = null;
      }
      setIsConnected(false);
    };
  }, [connect]);

  return {
    isConnected,
    error,
    wsUrl: WS_BASE_URL,
    reconnect: connect,
  };
};
