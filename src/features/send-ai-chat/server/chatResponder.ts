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
      textAnswer: `**[마감 도착 경로 추천]** 9시까지 **${startStation}**에서 **${endStation}**로 이동하는 기준입니다.\n\n일반 대중교통만 이용하면 9시 7분 전후 도착이 예상되어 여유가 부족합니다.\n\n- **추천 경로**: 출발지에서 짧은 택시 구간(약 2.4km)을 이용한 뒤, **9호선 급행 지하철**로 환승합니다.\n- **도착 예정 시간**: 08:57 (여유 3분)\n- **추가 예상 비용**: 약 8,000원\n\n시간 여유를 확보하기 위한 복합 이동 경로입니다.`,
      suggestedReportType: "deadline",
      startStation,
      endStation,
      recommendedCarNo: "3-3",
      routeIndex: 0,
    };
  }

  if (query.includes("칸") || query.includes("car") || query.includes("몇번") || query.includes("생존")) {
    return {
      textAnswer: `**[지하철 칸별 혼잡 회피 추천]** **${startStation}**에서 **${endStation}**로 이동할 때의 추천 탑승 위치입니다.\n\n급행 지하철은 빠른 하차와 환승 통로 주변에 승객이 몰릴 수 있습니다.\n\n- **추천 위치**: 3-3번 또는 6-1번 문 주변\n- **이유**: 주요 환승 동선에서 약간 벗어나 있어 승차 피로도를 낮출 가능성이 높습니다.\n- **주의 위치**: 4호차 주변은 환승 동선과 가까워 혼잡할 수 있습니다.`,
      suggestedReportType: "carriage",
      startStation,
      endStation,
      recommendedCarNo: "3-3",
      routeIndex: 0,
    };
  }

  if (query.includes("막차") || query.includes("recovery") || query.includes("놓치면") || query.includes("실패")) {
    return {
      textAnswer: `**[심야 귀가 대안 리포트]** 자정 이후 수도권 귀가 상황을 기준으로 한 대안입니다.\n\n현재 지하철 막차가 종료되어 지하철 단독 이동은 어렵습니다.\n\n- **추천 경로**: 심야 N버스로 최대한 이동한 뒤 마지막 약 4.2km 구간만 택시로 연결합니다.\n- **예상 택시 비용**: 약 9,800원\n- **대기 대안**: 24시간 이용 가능한 대기 거점과 첫차 연계 선택지도 함께 검토할 수 있습니다.`,
      suggestedReportType: "recovery",
      startStation,
      endStation,
      recommendedCarNo: "3-3",
      routeIndex: 0,
    };
  }

  if (query.includes("이번") || query.includes("버스") || query.includes("boarding") || query.includes("탈수") || query.includes("가능성")) {
    return {
      textAnswer: `**[광역 버스 탑승 가능성 진단]** 잔여석과 혼잡도를 기준으로 한 권고입니다.\n\n- **8100번 광역 버스**: 3분 뒤 도착 예정인 이번 차량은 잔여석이 거의 없어 승차 실패 가능성이 높습니다.\n- **추천**: 8분 뒤 도착하는 다음 차량을 기다리는 편이 안정적입니다.\n- **근거**: 다음 차량은 목업 기준 잔여석 13석으로, 이번 차량보다 탑승 가능성이 높습니다.`,
      suggestedReportType: "boarding",
      startStation,
      endStation,
      recommendedCarNo: "3-3",
      routeIndex: 0,
    };
  }

  return {
    textAnswer: `반갑습니다. 수도권 이동 판단 리포트 **'탈수있나' AI 챗봇**입니다.\n\n현재 출발지: \`${startStation}\`, 목적지: \`${endStation}\` 기준으로 질문할 수 있습니다.\n\n1. **"9시까지 도착할 수 있어?"** (마감 도착 경로)\n2. **"이번 버스 만차인데 탈 수 있어?"** (탑승 가능성)\n3. **"9호선 출근 지하철 어느 칸이 한산해?"** (칸별 혼잡 회피)\n4. **"막차가 끊겼는데 최소비용 복구 방법은?"** (심야 귀가 대안)`,
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
You are the core AI decision center for "탈수있나" (Can I Ride?), a Korean transit mobile web app that helps users compare routes based on 'Boarding Possibility' (탑승가능성), 'Carriage Crowd Avoidance' (칸별 혼잡 회피), 'Deadline Arrival' (마감도착), and 'Late Night Recovery' (심야 귀가 대안).

Always answer in polite Korean using high-contrast clear emojis and structured transport terms. Keep the formatting neat and professional in Markdown. Do not include verbose introductory phrases. Go straight to providing help with actionable advice.

Given the user query, identify:
1. textAnswer: A detailed analysis with transport reasoning, comparison tables, or clear steps (referencing real patterns in Seoul metro/bus).
2. suggestedReportType: Set to 'boarding', 'carriage', 'deadline', 'recovery' or null depending on what the user asks about:
 - "boarding" (탑승가능성 / 이번 차 vs 다음 차 / 잔여 좌석)
 - "carriage" (칸별 혼잡 회피 / 지하철 어느 칸)
 - "deadline" (9시까지 / 특정 시각 도착 / 복합 수단 조합)
 - "recovery" (막차 / 실패 / 심야 대안 / 귀가 불가)
3. startStation: Source station if mentioned (Korean, default e.g. "염창역").
4. endStation: Destination station if mentioned (Korean, default e.g. "여의도역" or "강남역").
5. recommendedCarNo: If 지하철 carriage is asked, suggest a less crowded car (e.g. "3-3" or "6-1").
6. routeIndex: Route option indexing (0 for Plan A, 1 for Plan B, 2 for Plan C) to recommend.

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
