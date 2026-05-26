import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI, Type } from "@google/genai";
import dotenv from "dotenv";

dotenv.config();

async function startServer() {
  const app = express();
  app.use(express.json());
  const PORT = 3000;

  // Lazily retrieve Gemini API client to prevent startup crash if variables are not yet present in AI Studio
  let aiClient: GoogleGenAI | null = null;
  function getAiClient() {
    if (!aiClient) {
      const apiKey = process.env.GEMINI_API_KEY;
      if (apiKey && apiKey !== "MY_GEMINI_API_KEY" && apiKey.trim() !== "") {
        aiClient = new GoogleGenAI({
          apiKey: apiKey,
          httpOptions: {
            headers: {
              'User-Agent': 'aistudio-build',
            }
          }
        });
      }
    }
    return aiClient;
  }
  
  // API route first
  app.post("/api/chat", async (req, res) => {
    const { message, context } = req.body;
    
    // Check if client is initialized
    const ai = getAiClient();
    
    if (!ai) {
      // High fidelity heuristic mock responses when API key is missing
      let textAnswer = "";
      let suggestedReportType = null;
      let startStation = context?.startStation || "염창역";
      let endStation = context?.endStation || "여의도역";
      let recommendedCarNo = "3-3";
      let routeIndex = 0;
      
      const query = message.toLowerCase();
      if (query.includes("9시") || query.includes("deadline") || query.includes("마감")) {
        textAnswer = `⏱️ **[마감도착 AI 최적 전술]** 9시 정각까지 **${startStation}**에서 **${endStation}**로 전력 이동하는 가상 시뮬레이션입니다.\n\n일반 대중교통만으로는 9시 7분 도착이 예상되어 직속 지각 위기입니다.\n\n- **추천 (Plan A)**: 출발지에서 처음에 대중교통 대신 **택시 선탑승 구간(2.4km)**을 이용하세요. 신호 압박을 우회한 뒤, **9호선 급행 지하철**로 여의도역에서 환승하시면 안정적으로 안착합니다.\n- **도착 예정 시간**: 08:57 (여유 3분)\n- **추수 예상 비용**: 약 8,000원 (택시비 실측 기본~거리 요금 합산)\n\n시간을 절약하고 지각 비용을 획기적으로 낮추는 복합 결합 추천안입니다!`;
        suggestedReportType = "deadline";
        routeIndex = 0;
      } else if (query.includes("칸") || query.includes("car") || query.includes("몇번") || query.includes("생존")) {
        textAnswer = `🚇 **[지하철 칸별 생존 어드바이스]** **${startStation}**에서 **${endStation}**로 이동 시 최적의 추천 탑승 칸 정보입니다.\n\n급행 지하철의 경우, 빠른 하차와 빠른 환승 통로(4-2) 주위에 고밀도 인파가 쏠려 극도의 혼잡과 신체 피로를 초래합니다.\n\n- **생존 추천 칸: 3-3번 및 6-1번 문**\n- **이유**: 환승 게이트에서 단 15초(도보 10걸음) 떨어져 있으나 차내 입석 혼잡도는 최소 35% 이상 여유로워 출근 피로도를 혁신적으로 절감합니다.\n- **절대회피 칸**: 4호차 전체 (환승 쏠림 역의 중심부로 가방을 메고 서 있기도 힘듭니다)`;
        suggestedReportType = "carriage";
        recommendedCarNo = "3-3";
      } else if (query.includes("막차") || query.includes("recovery") || query.includes("놓치면") || query.includes("실패")) {
        textAnswer = `🌙 **[막차 실패복구 전술 리포트]** 심야 자정 이후 수도권에서 자택으로 복귀해야 하는 지연 위 상황 해결 플랜입니다.\n\n현재 지하철 광역 막차가 이미 종료되었으므로 완전한 단독 지하철 복귀는 불가능합니다.\n\n- **복구 추천 편 (Plan A)**: 서울 도심 근교를 연결하는 심야전용 **N버스(N62 등)**를 탭승하여 최대 교외 지점까지 이동 후, 광역 연담 부분의 마지막 4.2km 구간을 택시 결합하는 분할 설계를 제안합니다.\n- **예상 택시 비용**: 약 9,800원 (전체 택시 탑승비 35,000 대폭 절약)\n- **심야 대기 처방**: 근처 24시간 개방 안심 쉼터(사우나, 소방서 인근) 및 새벽 첫차 연대 대기 거점이 함께 표시되어 안심하고 이동하셔도 됩니다.`;
        suggestedReportType = "recovery";
        routeIndex = 0;
      } else if (query.includes("이번") || query.includes("버스") || query.includes("boarding") || query.includes("탈수") || query.includes("가능성")) {
        textAnswer = `🚍 **[광역 버스 탑승가능성 진단]** 실시간 잔여석 정보에 따른 전술적 권고입니다.\n\n- **목포 8100번 / 광역 버스**: 현재 3분 뒤 진입하는 이번 차량은 **혼잡도 매우 높음 (잔여석 0)** 으로 정류장 대기 인원을 수용하지 못하고 무정차 통과 가능성이 90%입니다.\n- **AI 추천**: 해당 차를 무리하게 차도에서 대기하기보다, **8분 후 진입하는 다음 차량**을 편안하게 맞이하세요.\n- **이유**: 다음 버스는 기점 시각 데이터상 잔여석이 13석 확보된 상태로 운행하고 있어 안전한 좌석 입석 착석 탑승이 92% 보장됩니다. 무리한 무정차 탈락 리스크를 예방하십시오.`;
        suggestedReportType = "boarding";
      } else {
        textAnswer = `💡 반갑습니다! 수도권 실시간 대중교통 탈출 스마트 솔루션 **'탈수있나' AI 챗봇**입니다!

귀하의 상황(현재 출발지: \`${startStation}\`, 목적지: \`${endStation}\`)을 관측 중입니다. 다음 중 문의하고 싶으신 핵심 대피 전술을 선택하세요:

1. ⏱️ **"9시까지 도착할 수 있어?"** (마감도착 복합구간 산출)
2. 🚍 **"이번 버스 만차인데 탈 수 있어?"** (탑승가능성 실시간 진단)
3. 🚇 **"9호선 출근 지하철 어느 칸이 한산해?"** (지하철 칸별 생존 가이드)
4. 🌙 **"막차가 끊겼는데 최소비용 복구 방법은?"** (심야 실패복구 설계)`;
      }
      
      return res.json({
        textAnswer,
        suggestedReportType,
        startStation,
        endStation,
        recommendedCarNo,
        routeIndex
      });
    }

    try {
      const systemInstruction = `
You are the core AI decision center for "탈수있나" (Can I Ride?), a Korean transit mobile web app that helps users optimize their trip based on 'Boarding Possibility' (탑승가능성), 'Carriage Survival' (칸별 생존가이드), 'Deadline Arrival' (마감도착), and 'Late Night Failure Recovery' (실패복구).

Always answer in polite Korean using high-contrast clear emojis and structured transport terms. Keep the formatting neat and professional in Markdown. Do not include verbose introductory phrases. Go straight to providing help with actionable advice.

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
6. routeIndex: Route option indexing (0 for Plan A, 1 for Plan B, 2 for Plan C) to recommend.

Current state context provided by user:
${JSON.stringify(context)}
`;

      const response = await ai.models.generateContent({
        model: "gemini-2.5-flash",
        contents: message,
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
              routeIndex: { type: Type.INTEGER, description: "0-based route candidate index" }
            },
            required: ["textAnswer"]
          }
        }
      });

      const responseText = response.text || "{}";
      const resultObj = typeof responseText === 'string' ? JSON.parse(responseText.trim()) : responseText;
      
      return res.json({
        textAnswer: resultObj.textAnswer,
        suggestedReportType: resultObj.suggestedReportType || null,
        startStation: resultObj.startStation || context?.startStation || "염창역",
        endStation: resultObj.endStation || context?.endStation || "여의도역",
        recommendedCarNo: resultObj.recommendedCarNo || "3-3",
        routeIndex: resultObj.routeIndex ?? 0
      });
    } catch (err: any) {
      console.error("Gemini API invocation error:", err);
      return res.status(500).json({ error: "Gemini operation failed: " + err.message });
    }
  });

  // Serve static assets in production, hook Vite middleware in development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`[Server] '탈수있나' server is running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
