export type TwinEventType =
  | "SESSION_CREATED"
  | "START"
  | "DELTA"
  | "DONE"
  | "ERROR";

export type TwinWebSocketEvent = {
  type: TwinEventType;
  sessionId?: string;
  clientMessageId: string;
  delta?: string;
  fullText?: string;
  error?: string;
  errorCode?: string;
  timestamp?: number;
};

export type TwinWsQuestionRequest = {
  sessionId?: string;
  userQuestion: string;
  clientMessageId: string;
};
