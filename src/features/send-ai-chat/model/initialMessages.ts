import type { ChatMessage } from "../../../entities/chat-message";

export const initialChatMessages: ChatMessage[] = [
  {
    id: "msg-welcome",
    sender: "ai",
    text: "반갑습니다. 수도권 이동 판단 리포트 서비스 **'탈수있나'**입니다.\n\n현재 출발지 **염창역**, 목적지 **여의도역** 기준으로 경로와 혼잡 정보를 비교하고 있습니다. 필요한 리포트를 열거나 아래 추천 질문을 선택해 주세요.",
    timestamp: "오전 08:31",
  },
];
