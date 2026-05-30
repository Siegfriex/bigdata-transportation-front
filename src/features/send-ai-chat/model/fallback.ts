import type { ChatMessage } from "../../../entities/chat-message/model/types";
import type { ReportType } from "../../../entities/report/model/types";
import { formatKoreanTime } from "../../../shared/lib/time";

export function createFallbackChatMessage(text: string): ChatMessage {
  let textAnswer = "";
  let suggestedReportType: ReportType | null = null;
  const query = text.toLowerCase();

  if (query.includes("9시") || query.includes("지각") || query.includes("마감")) {
    textAnswer = `⏱️ **[마감도착 비상처방]** 현재 염창역에서 여의도역까지 9시 정각 도착 안을 검토했습니다.\n\n대중교통의 예상 대기지연 확률상 **Plan A (택시 연계)**가 가장 안심할 수 있습니다.\n\n- **행동 요령**: 처음에 택시를 택해 당산역 환승 통로로 우선 수송한 뒤 급행 연함으로 환승하세요.\n- **도착 시간 정지**: 08:57 (여유 3분)\n- **택시 예산**: 약 8,000원 수반\n\n조율 플랜이 완료되었습니다!`;
    suggestedReportType = "deadline";
  } else if (query.includes("칸") || query.includes("혼잡") || query.includes("몇번") || query.includes("생존")) {
    textAnswer = `**[칸별 혼잡 회피 추천]** 9호선 여의도행 기준 추천입니다.\n\n- **추천 위치**: **3-3** 또는 **6-1** 칸 주변\n- **근거**: 빠른 하차 계단 주변은 환승 인파가 몰릴 가능성이 높습니다. 한 칸 떨어진 위치를 선택하면 승차 피로도를 줄일 수 있습니다.`;
    suggestedReportType = "carriage";
  } else if (query.includes("막차") || query.includes("놓치") || query.includes("심야")) {
    textAnswer = `**[심야 귀가 대안]** 홍대입구에서 남양주 방향 이동 기준입니다.\n\n- **핵심 경로**: 전철 막차 이후에는 **심야 N62 버스**로 최대한 이동한 뒤, 남은 구간만 택시로 연결합니다.\n- **예상 비용**: 전구간 택시 대비 비용을 낮출 수 있으며, 단거리 택시 구간은 약 **9,800원 내외**로 추정됩니다.`;
    suggestedReportType = "recovery";
  } else {
    textAnswer = `**'탈수있나' 이동 리포트 안내**\n\n무엇을 확인할까요? 아래 질문을 선택해 보세요:\n1. "9시까지 강남역 갈 수 있어?"\n2. "9호선 출근 지하철 어느 칸이 한산해?"\n3. "막차가 끊겼는데 최소비용 복구 방법은?"`;
  }

  return {
    id: `msg-${Date.now() + 2}`,
    sender: "ai",
    text: textAnswer,
    timestamp: formatKoreanTime(),
    suggestedReportType,
  };
}
