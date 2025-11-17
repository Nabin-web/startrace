import { useEffect, useRef } from "react";

export const useWebSocket = (url, onMessage) => {
  const ws = useRef(null);
  const reconnectTimeoutRef = useRef(null);

  const connect = () => {
    try {
      const token = localStorage.getItem("access_token");
      const wsUrl = token ? `${url}?token=${token}` : url;

      ws.current = new WebSocket(wsUrl);

      ws.current.onopen = () => {
        console.log("WebSocket connected");
        // Send ping periodically to keep connection alive
        const pingInterval = setInterval(() => {
          if (ws.current?.readyState === WebSocket.OPEN) {
            ws.current.send("ping");
          } else {
            clearInterval(pingInterval);
          }
        }, 30000); // Ping every 30 seconds
      };

      ws.current.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          if (data.event === "csv_list_updated") {
            onMessage && onMessage(data);
          } else if (event.data === "pong") {
            // Pong response, connection is alive
          }
        } catch (e) {
          // Not JSON, ignore
        }
      };

      ws.current.onerror = (error) => {
        console.error("WebSocket error:", error);
      };

      ws.current.onclose = () => {
        console.log("WebSocket disconnected");
        // Reconnect after 3 seconds
        reconnectTimeoutRef.current = setTimeout(() => {
          connect();
        }, 3000);
      };
    } catch (error) {
      console.error("Failed to connect WebSocket:", error);
    }
  };

  useEffect(() => {
    connect();

    return () => {
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
      if (ws.current) {
        ws.current.close();
      }
    };
  }, [url]);

  return ws.current;
};
