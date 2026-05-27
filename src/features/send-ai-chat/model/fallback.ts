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
    textAnswer = `🚇 **[칸별 생존가이드 추천]** 9호선 여의도행 출근 길 전술입니다.\n\n- **혼잡 회피 구역**: **3-3** 및 **6-1** 칸 무조건 대기하십시오.\n- **근거**: 빠른 하차 계단(4-2)은 기형적으로 출근 인파가 뭉쳐 산소 농도가 희박합니다. 1칸 떨어진 3-3번을 노리면 신체 접촉 압박을 42% 방어할 수 있습니다.`;
    suggestedReportType = "carriage";
  } else if (query.includes("막차") || query.includes("놓치") || query.includes("심야")) {
    textAnswer = `🌙 **[실패복구 심야 어드바이스]** 홍대입구에서 남양주 귀가 전술입니다.\n\n- **플랜 핵심**: 전철 막차가 끊겼으므로 전철 대신 **심야 N62 뻐스**를 승차해 중랑구 방면 최대 종단에 하차 후, 남은 4km만 택시 연계 처리하십시오.\n- **절감 비용**: 전체 택시 소환(3.5만원) 대비 **9,800원 내외**로 요금 보전을 실현합니다.`;
    suggestedReportType = "recovery";
  } else {
    textAnswer = `💡 **'탈수있나' 지능형 시스템 안내**:\n\n무엇을 도와드릴까요? 아래 추천 질문을 탭하세요:\n1. ⏱️ "9시까지 강남역 갈 수 있어?"\n2. 🚇 "9호선 출근 지하철 어느 칸이 한산해?"\n3. 🌙 "막차가 끊겼는데 최소비용 복구 방법은?"`;
  }

  return {
    id: `msg-${Date.now() + 2}`,
    sender: "ai",
    text: textAnswer,
    timestamp: formatKoreanTime(),
    suggestedReportType,
  };
}
