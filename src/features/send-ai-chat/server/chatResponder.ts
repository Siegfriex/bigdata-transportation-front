import { GoogleGenAI, Type } from "@google/genai";
import type { AiChatResponse } from "../../../entities/chat-message/model/types";
import type { UserPreferences } from "../../../entities/user-preferences/model/types";
import { validateAiChatRequest, validateAiChatResponse } from "../api/schema";

export interface AiChatRequest {
  message: string;
  context?: {
    startStation?: string;
    endStation?: string;
    deadlineTime?: string;
    preferences?: UserPreferences;
  };
}

let aiClient: GoogleGenAI | null = null;

function getAiClient(env: NodeJS.ProcessEnv) {
  if (!aiClient) {
    const apiKey = env.GEMINI_API_KEY;
    if (apiKey && apiKey !== "MY_GEMINI_API_KEY" && apiKey.trim() !== "") {
      aiClient = new GoogleGenAI({
        apiKey,
        httpOptions: {
          headers: {
            "User-Agent": "talsu-inna-vercel-function",
          },
        },
      });
    }
  }

  return aiClient;
}

function createHeuristicResponse(request: AiChatRequest): AiChatResponse {
  const context = request.context;
  const query = request.message.toLowerCase();
  const startStation = context?.startStation || "염창역";
  const endStation = context?.endStation || "여의도역";

  if (query.includes("9시") || query.includes("deadline") || query.includes("마감")) {
    return {
      textAnswer: `**마감도착 근거**\n\n${startStation}에서 ${endStation}까지 9시 전 도착을 기준으로 도착 여유와 환승 실패 위험을 함께 봅니다.\n\n- 추천 방향: 초반 지연 구간은 택시 또는 고빈도 대중교통으로 우회하고, 이후 급행 또는 수송력이 큰 노선으로 연결합니다.\n- 도착 예정: 08:57 기준으로 약 3분 여유가 있습니다.\n- 비용 영향: 약 8,000원 수준의 추가 비용을 지각 리스크와 비교해야 합니다.\n\n현재 전략리포트의 선택 경로를 유지한 상태에서 대기 시간이 늘어나면 다음 후보로 전환하는 것이 안전합니다.`,
      suggestedReportType: "deadline",
      startStation,
      endStation,
      recommendedCarNo: "3-3",
      routeIndex: 0,
    };
  }

  if (query.includes("칸") || query.includes("car") || query.includes("몇번") || query.includes("생존")) {
    return {
      textAnswer: `**생존칸 근거**\n\n${startStation}에서 ${endStation}까지의 선택 경로는 빠른 환승보다 혼잡 압력 완화를 우선합니다.\n\n- 추천 칸: 3-3번 또는 6-1번 문 주변을 우선 봅니다.\n- 이유: 환승 게이트 중심부에서 한 칸 이상 떨어져 차내 압박과 하차 인파 충돌을 낮춥니다.\n- 회피 기준: 환승 통로 바로 앞 칸은 빠르지만 인파가 집중되므로 혼잡 민감도가 높으면 피하는 편이 안전합니다.`,
      suggestedReportType: "carriage",
      startStation,
      endStation,
      recommendedCarNo: "3-3",
      routeIndex: 0,
    };
  }

  if (query.includes("막차") || query.includes("recovery") || query.includes("놓치면") || query.includes("실패")) {
    return {
      textAnswer: `**복구전략 근거**\n\n${startStation}에서 ${endStation}까지 막차 또는 만차 실패가 발생하면 전체 택시보다 남아 있는 대중교통 구간을 먼저 쓰는 편이 손실을 줄입니다.\n\n- 추천 방향: 심야 버스로 이동 가능한 구간을 먼저 확보한 뒤 마지막 단절 구간만 택시로 연결합니다.\n- 예상 비용: 단절 구간 택시 기준 약 9,800원 수준으로 비교합니다.\n- 대기 기준: 대체 교통이 끊기면 24시간 개방 대기 지점에서 첫차 연계를 선택합니다.`,
      suggestedReportType: "recovery",
      startStation,
      endStation,
      recommendedCarNo: "3-3",
      routeIndex: 0,
    };
  }

  if (query.includes("이번") || query.includes("버스") || query.includes("boarding") || query.includes("탈수") || query.includes("가능성")) {
    return {
      textAnswer: `**탑승가능성 근거**\n\n현재 선택 전략은 이번 차 탑승 성공률과 다음 차 대기 손실을 함께 비교합니다.\n\n- 현재 차량: 잔여석이 낮고 정류장 대기 인원이 많아 무정차 또는 탑승 실패 위험이 큽니다.\n- 추천 방향: 다음 차량 대기로 전환하면 좌석 확보 가능성과 안정성이 높아집니다.\n- 판단 기준: 8분 대기 손실보다 만차 실패 후 재대기 손실이 더 크면 다음 차 전략이 유리합니다.`,
      suggestedReportType: "boarding",
      startStation,
      endStation,
      recommendedCarNo: "3-3",
      routeIndex: 0,
    };
  }

  return {
    textAnswer: `**선택 전략 근거**\n\n${startStation}에서 ${endStation}까지의 현재 경로를 기준으로 도착 여유, 탑승 가능성, 혼잡 압력, 실패 시 복구 대안을 함께 설명할 수 있습니다.\n\n리포트의 선택 전략을 유지한 상태에서 궁금한 근거 항목을 질문해 주세요.`,
    suggestedReportType: null,
    startStation,
    endStation,
    recommendedCarNo: "3-3",
    routeIndex: 0,
  };
}

export async function createAiChatResponse(
  input: unknown,
  env: NodeJS.ProcessEnv = process.env
): Promise<AiChatResponse> {
  const request = validateAiChatRequest(input);
  const ai = getAiClient(env);
  if (!ai) return createHeuristicResponse(request);

  const context = request.context;
  const systemInstruction = `
You are the core AI decision center for "탈수있나" (Can I Ride?), a Korean transit mobile web app that helps users optimize their trip based on 'Boarding Possibility' (탑승가능성), 'Carriage Survival' (칸별 생존가이드), 'Deadline Arrival' (마감도착), and 'Late Night Failure Recovery' (실패복구).

Always answer in polite Korean with structured transport terms. Do not use emoji prefixes, chatbot self-introductions, product marketing copy, or raw internal labels such as Plan A, plan_a, boarding, deadline, carriage, recovery, savedReportId, or report ids. Keep the formatting neat and professional in Markdown. Go straight to the current route evidence and actionable advice.

Given the user query, identify:
1. textAnswer: A detailed analysis with transport reasoning, comparison tables, or clear steps (referencing real patterns in Seoul metro/bus).
2. suggestedReportType: Set to 'boarding', 'carriage', 'deadline', 'recovery' or null depending on what the user asks about:
 - "boarding" (탑승가능성 / 이번 차 vs 다음 차 / 잔여 좌석)
 - "carriage" (칸별 생존 / 지하철 어느 칸)
 - "deadline" (9시까지 / 특정 시각 도착 / 복합 수단 조합)
 - "recovery" (막차 / 실패 / 심야 대안 / 귀가 불가)
3. startStation: Source station if mentioned (Korean, default e.g. "염창역").
4. endStation: Destination station if mentioned (Korean, default e.g. "여의도역" or "강남역").
5. recommendedCarNo: If 지하철 carriage is asked, suggest a less crowded car (e.g. "3-3" or "6-1").
6. routeIndex: 0-based route candidate index to recommend. Do not mention this index in user-facing text.

Current state context provided by user:
${JSON.stringify(context)}
`;

  const response = await ai.models.generateContent({
    model: env.GEMINI_MODEL || "gemini-2.5-flash",
    contents: request.message,
    config: {
      systemInstruction,
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          textAnswer: { type: Type.STRING, description: "Detailed polite Korean transport analysis" },
          suggestedReportType: { type: Type.STRING, description: "One of: 'boarding', 'carriage', 'deadline', 'recovery', or null" },
          startStation: { type: Type.STRING, description: "Start location name" },
          endStation: { type: Type.STRING, description: "End location name" },
          recommendedCarNo: { type: Type.STRING, description: "Subway recommended car number like '3-3'" },
          routeIndex: { type: Type.INTEGER, description: "0-based route candidate index" },
        },
        required: ["textAnswer"],
      },
    },
  });

  const parsed = validateAiChatResponse(JSON.parse(response.text || "{}"));

  return {
    textAnswer: parsed.textAnswer,
    suggestedReportType: parsed.suggestedReportType || null,
    startStation: parsed.startStation || context?.startStation || "염창역",
    endStation: parsed.endStation || context?.endStation || "여의도역",
    recommendedCarNo: parsed.recommendedCarNo || "3-3",
    routeIndex: parsed.routeIndex ?? 0,
  };
}
