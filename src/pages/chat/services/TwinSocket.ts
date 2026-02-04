import { Client } from "@stomp/stompjs";
import SockJS from "sockjs-client";
import type { TwinWebSocketEvent, TwinWsQuestionRequest } from "../types/TwinTypes";

type CreateTwinSocketArgs = {
  wsUrl: string; // e.g. http://localhost:8080/ws
  token: string; // JWT
  onEvent: (e: TwinWebSocketEvent) => void;
  onConnect?: () => void;
  onDisconnect?: () => void;
  onStompError?: (msg: string) => void;
};

export function createTwinSocket({
  wsUrl,
  token,
  onEvent,
  onConnect,
  onDisconnect,
  onStompError,
}: CreateTwinSocketArgs) {
  const client = new Client({
    webSocketFactory: () => new SockJS(wsUrl),
    reconnectDelay: 2000,
    // These headers go inside the STOMP CONNECT frame
    connectHeaders: {
      Authorization: `Bearer ${token}`,
    },
    onConnect: () => {
      client.subscribe("/user/queue/twin.events", (message) => {
        try {
          const event: TwinWebSocketEvent = JSON.parse(message.body);
          onEvent(event);
        } catch {
          // ignore bad frames
        }
      });
      onConnect?.();
    },
    onDisconnect: () => onDisconnect?.(),
    onStompError: (frame) => {
      onStompError?.(frame.headers["message"] || "STOMP error");
    },
  });

  client.activate();
  client.debug = (msg) => console.log("[STOMP]", msg);

  return {
    client,
    disconnect: () => client.deactivate(),
    sendChat: (payload: TwinWsQuestionRequest) => {
      client.publish({
        destination: "/app/twin.chat",
        body: JSON.stringify(payload),
      });
    },
    cancel: (clientMessageId: string) => {
      client.publish({
        destination: "/app/twin.cancel",
        body: clientMessageId,
      });
    },
  };
}
