import type { ChatMessage } from "../../../entities/chat-message/model/types";
import type { ReportType } from "../../../entities/report/model/types";
import { formatKoreanTime } from "../../../shared/lib/time";

export function createFallbackChatMessage(text: string): ChatMessage {
  let textAnswer = "";
  let suggestedReportType: ReportType | null = null;
  const query = text.toLowerCase();

  if (query.includes("9시") || query.includes("지각") || query.includes("마감")) {
    textAnswer = `**마감도착 근거**\n\n선택 전략은 도착 여유와 환승 실패 위험을 함께 본 결과입니다.\n\n- 도착 기준: 09:00 전 도착 가능성이 높습니다.\n- 핵심 근거: 초기 지연 구간을 우회하고 급행 또는 고빈도 수단을 우선 사용합니다.\n- 리스크: 대기 시간이 6분 이상 늘면 다음 후보로 전환해야 합니다.`;
    suggestedReportType = "deadline";
  } else if (query.includes("칸") || query.includes("혼잡") || query.includes("몇번") || query.includes("생존")) {
    textAnswer = `**생존칸 근거**\n\n현재 선택 전략은 3-3번 또는 6-1번 칸을 기준으로 혼잡 압력을 낮춥니다.\n\n- 빠른 환승 칸은 하차 인파가 집중됩니다.\n- 추천 칸은 환승 동선에서 한 칸 이격되어 체감 압박이 낮습니다.\n- 혼잡이 급등하면 다음 열차 대기 전략으로 전환할 수 있습니다.`;
    suggestedReportType = "carriage";
  } else if (query.includes("막차") || query.includes("놓치") || query.includes("심야")) {
    textAnswer = `**복구전략 근거**\n\n막차 또는 만차 실패 시 전체 택시 호출보다 대중교통이 남아 있는 구간을 먼저 소진하는 전략이 비용 손실을 줄입니다.\n\n- 심야 버스 또는 대체 노선을 우선 사용합니다.\n- 마지막 단절 구간만 택시로 연결합니다.\n- 대기 시간이 길어지면 안전 대기 지점으로 전환합니다.`;
    suggestedReportType = "recovery";
  } else {
    textAnswer = `**선택 전략 근거**\n\n현재 경로의 도착 여유, 탑승 가능성, 혼잡 압력, 실패 시 복구 대안을 함께 설명할 수 있습니다. 리포트의 선택 전략을 기준으로 질문해 주세요.`;
  }

  return {
    id: `msg-${Date.now() + 2}`,
    sender: "ai",
    text: textAnswer,
    timestamp: formatKoreanTime(),
    suggestedReportType,
  };
}
