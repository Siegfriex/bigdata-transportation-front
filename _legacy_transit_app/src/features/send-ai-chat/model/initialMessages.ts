import type { ChatMessage } from "../../../entities/chat-message";

export const initialChatMessages: ChatMessage[] = [
  {
    id: "msg-welcome",
    sender: "ai",
    text: "👋 반갑습니다! 수도권 실시간 혼잡도 및 생존 이동 플랜 분석기 **'탈수있나'**입니다.\n\n현재 출발지 **염창역**, 목적지 **여의도역**으로 통학/통근 전술이 실시간 예측되어 있습니다. 원하시는 리포트 카드를 조회하시거나 아래 추천 프롬프트를 클릭하세요!",
    timestamp: "오전 08:31",
  },
];
