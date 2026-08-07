import type { AiChatResponse } from "../../../entities/chat-message/model/types";
import type { UserPreferences } from "../../../entities/user-preferences/model/types";
import { postJson } from "../../../shared/api";
import { validateAiChatResponse } from "./schema";

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
  return validateAiChatResponse(await postJson("/api/chat", input));
}
