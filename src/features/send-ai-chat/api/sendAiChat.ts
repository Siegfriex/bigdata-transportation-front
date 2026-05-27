import type { AiChatResponse } from "../../../entities/chat-message/model/types";
import type { UserPreferences } from "../../../entities/user-preferences/model/types";

export interface SendAiChatInput {
  message: string;
  context: {
    startStation: string;
    endStation: string;
    deadlineTime: string;
    preferences: UserPreferences;
  };
}

export async function sendAiChat(input: SendAiChatInput): Promise<AiChatResponse> {
  const response = await fetch("/api/chat", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });

  if (!response.ok) {
    throw new Error("서버 연동 지연");
  }

  return response.json() as Promise<AiChatResponse>;
}
