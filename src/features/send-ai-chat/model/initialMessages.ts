import type { ChatMessage } from "../../../entities/chat-message";

export const initialChatMessages: ChatMessage[] = [
  {
    id: "msg-welcome",
    sender: "ai",
    text: "현재 지도 경로를 기준으로 도착 여유, 탑승 가능성, 혼잡 압력, 복구 대안을 함께 설명합니다.",
    timestamp: "오전 08:31",
  },
];
