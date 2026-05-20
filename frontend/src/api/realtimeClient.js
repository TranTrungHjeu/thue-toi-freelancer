import { getAccessToken } from "./axiosClient";

/**
 * Lấy Base URL của API từ biến môi trường.
 */
export const getApiBaseUrl = () => {
  if (typeof process !== "undefined" && process.env?.NEXT_PUBLIC_API_BASE_URL) {
    return process.env.NEXT_PUBLIC_API_BASE_URL;
  }
  if (
    typeof import.meta !== "undefined" &&
    import.meta.env?.VITE_API_BASE_URL
  ) {
    return import.meta.env.VITE_API_BASE_URL;
  }
  return "/api";
};

/**
 * Lấy tường minh Base URL của WebSocket từ biến môi trường nếu có.
 */
export const getExplicitWsBaseUrl = () => {
  if (typeof process !== "undefined" && process.env?.NEXT_PUBLIC_WS_BASE_URL) {
    return process.env.NEXT_PUBLIC_WS_BASE_URL;
  }
  if (typeof import.meta !== "undefined" && import.meta.env?.VITE_WS_BASE_URL) {
    return import.meta.env.VITE_WS_BASE_URL;
  }
  return "";
};

/**
 * Phân giải cấu hình để trả về một URL chuẩn hóa cho WebSocket (dùng cho raw WS hoặc STOMP over SockJS).
 * Đảm bảo tương thích hoàn toàn với Vite proxy.
 */
export const getWsBaseUrl = () => {
  const explicitWs = getExplicitWsBaseUrl();
  if (explicitWs) {
    return explicitWs.replace(/\/+$/, "");
  }

  const apiBase = getApiBaseUrl();
  const normalizedApi = apiBase.replace(/\/+$/, "");

  // SockJS CẦN giao thức HTTP/HTTPS. KHÔNG chuyển sang WS/WSS ở đây.
  if (normalizedApi.startsWith("http")) {
    return normalizedApi.replace(/\/api$/, "");
  }

  // Trường hợp đường dẫn tương đối (relative path) như "/api", sử dụng host của trình duyệt hiện tại
  if (typeof window !== "undefined") {
    const protocol = window.location.protocol; // "http:" hoặc "https:"
    const { hostname, port, host } = window.location;

    // Fallback cho môi trường Local Development (npm run dev)
    // Nếu đang chạy ở port 3000, ưu tiên kết nối thẳng tới backend port 8080
    // để tránh các vấn đề không tương thích của Vite Proxy với Raw WebSockets.
    if (
      (hostname === "localhost" || hostname === "127.0.0.1") &&
      port === "3000"
    ) {
      return `${protocol}//${hostname}:8080`;
    }

    // Môi trường Production: Sử dụng host hiện tại (đi qua Nginx/Proxy)
    return `${protocol}//${host}`;
  }

  return "http://localhost:3000";
};

/**
 * Phân giải cấu hình cho Raw WebSocket (dùng cho chat messages)
 * Raw WebSocket CẦN giao thức WS/WSS.
 */
export const getRawWsUrl = () => {
  const baseUrl = getWsBaseUrl();
  return baseUrl.replace(/^http:/, "ws:").replace(/^https:/, "wss:");
};

// Duy trì khả năng tương thích ngược
export const toWebSocketBaseUrl = () => getRawWsUrl();

export const createMessageRealtimeClient = ({
  contractId,
  onMessage,
  onStatusChange,
}) => {
  let socket = null;
  let reconnectTimeout = null;
  let manuallyClosed = false;

  const notifyStatus = (status) => {
    if (typeof onStatusChange === "function") {
      onStatusChange(status);
    }
  };

  let reconnectAttempts = 0;

  const connect = () => {
    const accessToken = getAccessToken();
    if (!accessToken || !contractId) {
      notifyStatus("disconnected");
      return;
    }

    // Nếu token có dấu hiệu hết hạn (thường gây lỗi liên tục), ta tạm dừng kết nối để tránh spam server
    if (reconnectAttempts > 5) {
      console.warn(
        "[RealtimeClient] Quá nhiều lần thử kết nối lại thất bại. Vui lòng làm mới trang hoặc đăng nhập lại.",
      );
      notifyStatus("disconnected");
      return;
    }

    const rawWsUrl = getRawWsUrl();
    const params = new URLSearchParams({
      token: accessToken,
      contractId: String(contractId),
    });

    socket = new WebSocket(`${rawWsUrl}/ws/messages?${params.toString()}`);
    notifyStatus("connecting");

    socket.onopen = () => {
      reconnectAttempts = 0; // Reset số lần thử khi kết nối thành công
      notifyStatus("connected");
    };

    socket.onmessage = (event) => {
      try {
        const payload = JSON.parse(event.data);
        if (
          payload?.event === "MESSAGE_CREATED" &&
          payload?.data &&
          typeof onMessage === "function"
        ) {
          onMessage(payload.data);
        }
      } catch {
        notifyStatus("degraded");
      }
    };

    socket.onclose = (e) => {
      notifyStatus("disconnected");
      if (!manuallyClosed) {
        reconnectAttempts++;
        // Tăng dần thời gian chờ để tránh spam request (Exponential backoff)
        const backoffTime = Math.min(
          2000 * Math.pow(1.5, reconnectAttempts),
          15000,
        );
        reconnectTimeout = window.setTimeout(connect, backoffTime);
      }
    };

    socket.onerror = () => {
      notifyStatus("degraded");
    };
  };

  connect();

  return {
    close: () => {
      manuallyClosed = true;
      if (reconnectTimeout) {
        window.clearTimeout(reconnectTimeout);
      }
      if (
        socket &&
        (socket.readyState === WebSocket.OPEN ||
          socket.readyState === WebSocket.CONNECTING)
      ) {
        socket.close();
      }
    },
  };
};
