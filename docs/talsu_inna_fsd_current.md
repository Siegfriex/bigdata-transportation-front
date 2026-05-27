# 탈수있나 Current-State Functional Specification v1.0

> 목적: 현재 `data_insight` 프론트엔드가 실제로 무엇을 구현하고 있는지 기능, 입출력, 상태, 비즈니스 규칙, 갭, QA 기준으로 고정한다.  
> 작성일: 2026-05-27  
> 기준 커밋: 현 로컬 작업트리 기준. 직전 원격 커밋 `a2cedcc` 이후 `widgets/map-workspace` 추출 반영.
> 관련 문서: `docs/talsu_inna_architecture_rules.md`, `docs/talsu_inna_refactor_plan.md`

## 1. 문서 범위

본 문서는 목표 아키텍처 문서가 아니라 **현재 구현 사실 기준 기능 명세**다. 미래 구조, FSD 레이어 규칙, MiriArt 레퍼런스 분석은 `docs/talsu_inna_architecture_rules.md`에서 관리한다. 리팩토링 순서와 단계별 완료 기준은 `docs/talsu_inna_refactor_plan.md`에서 관리한다.

| 상태 | 의미 |
|---|---|
| 구현됨 | 현재 UI/상태/서버 코드에서 직접 동작한다. |
| Mock 구현 | 실제 API/DB 없이 프론트 로컬 데이터 또는 서버 fallback으로 동작한다. |
| 부분 구현 | UI는 있으나 저장/인증/실시간 데이터 등 일부 축이 빠져 있다. |
| 미구현 | PRD/FSD 문서에는 있으나 현재 코드에 없다. |

## 2. 시스템 경계

본 앱은 현재 프론트엔드 단일 상태 기반 SPA이며, 실시간 대중교통 데이터, 계정 인증, 서버 저장은 시스템 경계 밖에 있다. `/api/chat`만 서버 경로를 가지며, 나머지 교통/경로/리포트/설정 기능은 mock 또는 React local state 기반이다.

| 포함 | 현재 방식 |
|---|---|
| SPA UI | React 19, Vite 6, Tailwind v4 |
| 지도/교통 표현 | SVG mock map, local station data |
| 경로 후보 | `src/data.ts` mock route planner |
| 리포트 | local state와 mock 수치 |
| AI 챗 | Express/Vercel `/api/chat`, Gemini key 없으면 server fallback |
| 저장 리포트 | localStorage-backed client state |

| 시스템 밖 | 현재 상태 |
|---|---|
| GPS 실시간 추적 | 없음 |
| 실제 지도 SDK | 없음 |
| 실계정 로그인 | 없음 |
| 서버 DB 저장 | 없음 |
| 공공데이터 live 연동 | 없음 |
| 시각 회귀 자동화 | 없음 |

## 3. 현재 코드 구조

| 파일 | 현재 역할 |
|---|---|
| `src/main.tsx` | React 앱 엔트리. `StrictMode`로 `App` 렌더링. |
| `src/App.tsx` | 앱 shell/router/overlay/chrome host. 현재 50줄. |
| `src/app/model/useAppController.ts` | app host가 필요한 전역 UI 상태, route/chat controller 연결, page props assembly를 담당한다. |
| `src/app/router/AppRouter.tsx` | URL router가 아닌 내부 route boundary. `activeTab` 기준으로 map/archive/settings page entry를 선택한다. |
| `src/pages/*/index.tsx` | map/archive/settings page composition entry. 자체 `ui/model/api/mock/styles` 없이 widget props forwarding만 담당. |
| `src/app/layouts/*` | `AppShell` 등 앱 레이아웃 기반. |
| `src/components/InteractiveMap.tsx` | 호환 re-export. 실제 구현은 `widgets/transit-map-panel`로 이동. |
| `src/data.ts` | FSD entity mock/default public facade. |
| `src/types.ts` | FSD entity/feature/shared 타입 public facade. |
| `src/entities/*` | route-plan, report, station, user-preferences, chat-message 도메인 타입/mock/default. |
| `src/features/*` | onboarding, route preset carousel, report save rule, AI chat API/schema/fallback/markdown/server responder, map layer type. |
| `src/widgets/*` | 지도 패널, map workspace, 리포트 시트 하위 view, AI 채팅 레이어, 아카이브 캘린더, 설정 폼, 상단 앱바, 하단 내비게이션. |
| `src/shared/*` | storage/query/z-index/routes config, shared HTTP client, time util, persistent state hook, toast/page-container UI. |
| `src/index.css` | Tailwind import, 글꼴, glass 스타일, 애니메이션, 스크롤바 유틸리티. |
| `server.ts` | Express 서버, Vite middleware, `/api/chat` 라우팅. AI responder는 `features/send-ai-chat/server`와 공유. |
| `api/chat.ts` | Vercel Function `/api/chat` 엔트리. |
| `vercel.json` | Vercel build/function routing 설정. |
| `vite.config.ts` | React/Tailwind Vite 플러그인, alias, HMR 설정. |

## 4. 현재 런타임 의존

| 영역 | 값/방식 | 비고 |
|---|---|---|
| 프론트엔드 | React 19, Vite 6, Tailwind v4, lucide-react, motion | SPA |
| 서버 | Express + Vite middleware + Vercel Function | `npm run dev`는 `tsx server.ts`, Vercel은 `api/chat.ts` |
| 포트 | `3000` | `server.ts`에 하드코딩 |
| AI API | `GEMINI_API_KEY` | 없으면 서버 mock fallback |
| DB | 없음 | 저장 리포트와 선호값은 localStorage, 나머지는 React state/mock |
| 공공데이터 | 없음 | UI 문구만 존재 |

## 5. 기능 범위 요약

| ID | 기능명 | Phase | 우선순위 | 주요 코드 | 구현 상태 |
|---|---|---:|---:|---|---|
| F0 | 앱 셸, 온보딩, 기본 사용자 상태 | P1 | P0 | `src/App.tsx`, `app/model`, `app/router`, `features/complete-onboarding`, `app/layouts` | 구현됨 |
| F1 | 지도 메인 및 역 선택 | P1 | P0 | `widgets/map-workspace`, `widgets/transit-map-panel` | Mock 구현 |
| F2 | 교통 레이어/지도 인터랙션 | P1 | P0 | `widgets/transit-map-panel`, `features/toggle-map-layer` | Mock 구현 |
| F3 | 경로 플랜 계산 및 선택 | P1 | P0 | `entities/route-plan`, `features/generate-route-plan`, `widgets/map-workspace`, `app/model` | Mock 구현 |
| F4 | 이동 판단 리포트 4종 | P1 | P0 | `widgets/report-sheet`, `entities/route-plan`, `entities/report` | Mock 구현 |
| F5 | AI 챗 오버레이 및 추천 반영 | P1 | P0 | `widgets/ai-chat-panel`, `features/send-ai-chat`, `server.ts`, `api/chat.ts` | 부분 구현. 현재 IA 구현은 독립 하단 탭이 아니라 지도 컨텍스트 overlay를 기준으로 한다. |
| F6 | 리포트 저장/기록/캘린더 | P1 | P1 | `widgets/archive-calendar`, `entities/report`, `app/model` | Mock 구현 |
| F7 | 사용자 설정/선호값 | P1 | P1 | `widgets/settings-form`, `entities/user-preferences`, `app/model` | 부분 구현 |
| F8 | Express/Vercel 서버 및 `/api/chat` | P1 | P0 | `server.ts`, `api/chat.ts`, `features/send-ai-chat/server` | 부분 구현 |
| F9 | 실제 공공데이터/API/계정 영속화 | P2 | P0 | 없음 | 미구현 |

## 6. 하위 기능 ID

| 상위 ID | 하위 ID | 기능 |
|---|---|---|
| F0 | F0.1 | 온보딩 Step 1 표시 |
| F0 | F0.2 | 온보딩 Step 2 선호값 입력 |
| F0 | F0.3 | 비회원 체험 진입 |
| F1 | F1.1 | select 기반 출발/도착역 변경 |
| F1 | F1.2 | 지도 노드 컨텍스트 메뉴로 출발/도착 지정 |
| F1 | F1.3 | 선택 역 지도 강조 |
| F2 | F2.1 | 지도 레이어 토글 |
| F2 | F2.2 | 지도 줌/팬 |
| F2 | F2.3 | 선택 플랜 경로 bounds 반영 |
| F3 | F3.1 | 출발/도착 변경 시 경로 후보 재계산 |
| F3 | F3.2 | 프리셋 시나리오 적용 |
| F3 | F3.3 | 기존 selectedPlan 유지 또는 첫 후보 선택 |
| F4 | F4.1 | 탑승가능성 리포트 |
| F4 | F4.2 | 칸별 생존 리포트 |
| F4 | F4.3 | 마감도착 리포트 |
| F4 | F4.4 | 실패복구 리포트 |
| F5 | F5.1 | AI 챗 요청 전송 |
| F5 | F5.2 | 서버 실패 시 클라이언트 fallback |
| F5 | F5.3 | AI 추천을 planner 상태에 반영 |
| F5 | F5.4 | AI 응답 렌더링 |
| F6 | F6.1 | 리포트 저장 |
| F6 | F6.2 | 날짜별 저장 리포트 표시 |
| F6 | F6.3 | 저장 리포트에서 지도 상태 복원 |
| F7 | F7.1 | 루틴 지점 설정 |
| F7 | F7.2 | 이동 조건 설정 |
| F7 | F7.3 | AI 스타일 설정 |
| F8 | F8.1 | `/api/chat` Gemini 호출 |
| F8 | F8.2 | Gemini key 부재 fallback |
| F8 | F8.3 | Vite middleware 제공 |

## 7. 사용자 플로우 요약

| 플로우 | 순서 |
|---|---|
| 최초 진입 | 온보딩 Step 1 → Step 2 또는 비회원 체험 → 지도 화면 |
| 경로 확인 | 출발/도착 선택 → 경로 후보 재계산 → 지도 경로와 리포트 카드 갱신 |
| 리포트 확인 | 리포트 상세 진입 → 리포트 타입 선택 → 후보/타임라인/칸별 정보 확인 |
| AI 추천 | 지도 컨텍스트에서 AI 오버레이 열기 → 메시지 전송 → AI 응답 또는 fallback → 지도/리포트/경로 반영 |
| 기록 재사용 | 리포트 저장 → 기록 탭 → 날짜 선택 → 지도 이동으로 상태 복원 |
| 설정 변경 | 설정 탭 → 루틴/조건/AI 스타일 변경 → 경로/AI context에 일부 반영 |

## 8. 현재 상태 모델

| 상태 | 현재 소유자 | 현재 지속성 | 목표 소유자 |
|---|---|---|---|
| `showOnboarding`, `onboardingStep` | `app/model/useAppController.ts` + `features/complete-onboarding/ui` | memory | `features/complete-onboarding/model` |
| `activeTab`, `mapLayer` | `app/model/useAppController.ts` + `app/router/AppRouter.tsx` 선택 경계 | memory | router + `features/toggle-map-layer` |
| `startStation`, `endStation` | `features/generate-route-plan/model/useRoutePlanner.ts` | memory | `features/select-station` 또는 route planner model |
| `plans`, `selectedPlan` | `features/generate-route-plan/model/useRoutePlanner.ts` | memory | `features/generate-route-plan` |
| `selectedReportType` | `features/generate-route-plan/model/useRoutePlanner.ts` + `widgets/report-sheet` UI props | memory | `widgets/report-sheet` model 또는 route state |
| `savedReports` | `entities/report/model/store.ts` | localStorage | `entities/report/model/store` |
| `preferences` | `entities/user-preferences/model/store.ts` | localStorage | `entities/user-preferences/model/store` |
| `chatMessages`, `chatInput`, `chatbotLoading` | `features/send-ai-chat/model/useAiChatController.ts` + `widgets/ai-chat-panel` props | memory | `features/send-ai-chat/model` |
| `visibleLayers` | `app/model/useAppController.ts` + `widgets/transit-map-panel` props | memory | `features/toggle-map-layer` |

## 9. 타입 정합성 현황

| 타입/용어 | 현재 정의 | 사용 위치 | 이슈 | 목표 SSOT |
|---|---|---|---|---|
| `TabId` | `"map" \| "archive" \| "settings"` | `types.ts`, `app/model`, `AppRouter` | URL router 도입 시 역할 축소 | `shared/config/routes.ts` 또는 router |
| `MapLayerState` | `features/toggle-map-layer/model/types.ts` | `types.ts`, `app/model` | facade 경유 안정화됨 | `features/toggle-map-layer/model/types.ts` |
| `ReportType` | `"boarding" \| "carriage" \| "deadline" \| "recovery"` | `types.ts`, route/report/chat model | 안정적 | `entities/report/model/types.ts` |
| `RoutePlan` | 경로명, ETA, 비용, 위험도, 타임라인 | `types.ts`, `data.ts`, route planner model | mock generator와 UI 결합 축소됨 | `entities/route-plan/model/types.ts` |
| `SavedReport` | id/date/type/from/to/status/summary/cost | `types.ts`, `data.ts`, report store | localStorage persistence가 entity store로 이동됨 | `entities/report/model/types.ts` |
| `UserPreferences` | 루틴/혼잡/택시/도보/따릉이/AI 스타일 | `types.ts`, `data.ts`, preferences store | 일부 값만 실제 계산 반영 | `entities/user-preferences/model/types.ts` |
| `ChatMessage` | sender, text, timestamp, AI 추천 필드 | `entities/chat-message`, `features/send-ai-chat` | client markdown renderer는 유지, API schema는 추가됨 | `entities/chat-message/model/types.ts` |

## 10. 기능 상세

### F0. 앱 셸, 온보딩, 기본 사용자 상태

| 구분 | 내용 |
|---|---|
| Trigger | 앱 최초 진입 |
| Input | 온보딩 시작, 비회원 체험, 선호값, 닉네임 |
| Process | `showOnboarding`이 true이면 전체 화면 온보딩 레이어 표시. 완료 시 `showOnboarding=false`, `user.isLoggedIn=true`. |
| Output | 지도 메인 화면 진입, 상단 바 사용자명 표시 |
| Exception | 별도 검증/서버 저장 없음. 닉네임 빈 값 허용 |

**수용 기준**

| Given | When | Then |
|---|---|---|
| 온보딩 Step 1이 표시된 상태 | 사용자가 시작하기를 클릭한다 | Step 2가 표시된다 |
| 온보딩 Step 1이 표시된 상태 | 사용자가 비회원으로 바로 둘러보기를 클릭한다 | 온보딩이 닫히고 지도 화면에 진입한다 |
| 온보딩 Step 2가 표시된 상태 | 사용자가 개인 플랜 분석 시작을 클릭한다 | 선호값이 state에 반영되고 온보딩이 닫힌다 |

### F1. 지도 메인 및 역 선택

| 구분 | 내용 |
|---|---|
| Trigger | 지도 탭 진입, 역 select 변경, 지도 노드 출발/도착 지정 |
| Input | 출발역/목적역 select 값 또는 지도 노드 컨텍스트 메뉴 |
| Process | `startStation`, `endStation` 갱신 후 `updateRoutePlans()` 호출 |
| Output | 지도 경로, 리포트 카드, 경로 후보 갱신 |
| Exception | 지원 역 목록 밖의 값 입력 불가. 실제 위치/GPS 없음 |

**수용 기준**

| Given | When | Then |
|---|---|---|
| 지도 화면에 진입한 상태 | 출발역 또는 도착역을 변경한다 | 경로 후보가 재계산된다 |
| 지도 노드가 표시된 상태 | 노드 컨텍스트 메뉴에서 출발 또는 도착을 선택한다 | 해당 역이 출발/도착 상태에 반영된다 |
| 출발/도착역이 선택된 상태 | 지도가 렌더링된다 | 선택된 노드가 강조 표시된다 |

### F2. 교통 레이어/지도 인터랙션

| 구분 | 내용 |
|---|---|
| Trigger | 레이어 버튼, 줌 버튼, 드래그, 역 hover/click |
| Input | `subway`, `bus`, `bike`, `crowd` 토글, 포인터 이벤트, 줌 +/- |
| Process | `visibleLayers` 갱신, selectedPlan이 있으면 bounds 기반 pan/zoom 조정 |
| Output | SVG 지도, 경로 라인, 혼잡 배지, 레이어 툴팁, 역 컨텍스트 메뉴 |
| Exception | 실제 지도 타일/좌표계/GPS 없음 |

**수용 기준**

| Given | When | Then |
|---|---|---|
| 지도 레이어 버튼이 보이는 상태 | 특정 레이어를 클릭한다 | 해당 레이어가 on/off 된다 |
| 하나 이상의 레이어가 활성화된 상태 | reset을 클릭한다 | 활성 레이어가 모두 꺼진다 |
| 경로 후보를 선택한 상태 | 지도가 업데이트된다 | 지도 중심과 zoom이 선택 경로에 맞춰 변한다 |

### F3. 경로 플랜 계산 및 선택

| 구분 | 내용 |
|---|---|
| Trigger | 출발/도착/선호값 변경, 프리셋 클릭, AI routeIndex 수신 |
| Input | `startStation`, `endStation`, `preferences.useBike`, `preferences.maxTaxiFee` |
| Process | `getRoutePlans(start, end, opts)`가 mock 플랜 생성. 기존 선택 플랜 id가 새 후보에 있으면 유지, 없으면 첫 후보 선택 |
| Output | `plans`, `selectedPlan` 갱신 |
| Exception | 실제 길찾기 엔진 없음. `walkLimitMin`, `crowdSensitivity`는 제한적으로만 반영 |

**수용 기준**

| Given | When | Then |
|---|---|---|
| 지도 화면에 진입한 상태 | `염창역 -> 여의도역` 프리셋을 적용한다 | 지하철/따릉이/택시 결합 후보가 표시된다 |
| 지도 화면에 진입한 상태 | `사당역 -> 강남역` 프리셋을 적용한다 | 지하철 우회/버스 대기 후보가 표시된다 |
| 지원하지 않는 조합이 선택된 상태 | 경로 계산이 실행된다 | dynamic fallback 후보가 표시된다 |

### F4. 이동 판단 리포트 4종

| ReportType | 화면 | 현재 동작 |
|---|---|---|
| `boarding` | 탑승가능성 | 이번 차량/다음 차량 비교, 잔여석 mock, 다음 차량 권고 |
| `carriage` | 칸별 생존 | `getCarSurvivalDetails()` 기반 칸별 혼잡/등급/이유 표시 |
| `deadline` | 마감도착 | `plans` 비교, 선택 플랜 상세 타임라인, 클립보드 복사 |
| `recovery` | 실패복구 | N버스+택시 분할 복구, 비용 절감, 24시 대기 거점 mock |

**수용 기준**

| Given | When | Then |
|---|---|---|
| 리포트 상세가 열린 상태 | 리포트 타입 탭을 클릭한다 | 활성 리포트가 바뀐다 |
| deadline 리포트가 열린 상태 | 후보 플랜을 선택한다 | 지도 경로와 타임라인이 바뀐다 |
| 선택 플랜이 있는 상태 | 저장을 클릭한다 | 중복이 아니면 아카이브에 새 리포트가 추가된다 |

### F5. AI 챗 오버레이 및 추천 반영

| 구분 | 내용 |
|---|---|
| Trigger | 검색 바 클릭, 추천 질문 클릭, 채팅 입력 후 전송, 리포트 AI 브리핑 |
| Input | 사용자 메시지, 지도 context |
| Process | `POST /api/chat` 호출. 성공 시 AI 응답 추가 및 추천 필드를 지도 상태에 반영. 실패 시 클라이언트 fallback |
| Output | AI 메시지, 지도/리포트/경로 선택 자동 갱신, `mapLayer="ai_result"` |
| Exception | 서버 실패 시 700ms 후 fallback. 현재 markdown 렌더링은 서버 응답 신뢰 전제 |

**수용 기준**

| Given | When | Then |
|---|---|---|
| AI 오버레이가 열린 상태 | 메시지를 전송한다 | 사용자 메시지와 AI 메시지가 순서대로 추가된다 |
| AI 응답에 리포트 타입이 있는 상태 | 응답 반영이 완료된다 | 해당 리포트가 활성화된다 |
| AI 응답에 routeIndex가 있는 상태 | 응답 반영이 완료된다 | 해당 후보 플랜이 선택된다 |
| 서버 호출이 실패한 상태 | fallback 타이머가 끝난다 | fallback 응답이 표시된다 |

### F6. 리포트 저장/기록/캘린더

| 구분 | 내용 |
|---|---|
| Trigger | 리포트 저장, AI 결과 전술 리포트 생성, 기록 탭 진입, 날짜 선택, 지도 이동 |
| Input | `selectedPlan`, `selectedReportType`, `startStation`, `endStation`, 기존 `savedReports` |
| Process | 중복 조건 검사 후 새 `SavedReport`를 state 앞에 추가 |
| Output | 저장 리포트 목록, 월간 캘린더, 선택 날짜 피드백 |
| Exception | 저장 리포트는 localStorage에 유지된다. 모두 지우기는 confirm 없이 즉시 실행 |

**수용 기준**

| Given | When | Then |
|---|---|---|
| 리포트가 저장된 상태 | 기록 탭으로 이동한다 | 저장된 리포트가 목록에 표시된다 |
| 기록 탭이 열린 상태 | 날짜를 선택한다 | 해당 날짜 리포트 요약이 표시된다 |
| 저장 리포트가 표시된 상태 | 지도 이동을 클릭한다 | 출발/도착/리포트 타입이 복원되고 지도 탭으로 이동한다 |

### F7. 사용자 설정/선호값

| 구분 | 내용 |
|---|---|
| Trigger | 설정 탭 진입, 루틴 지점/조건/AI 스타일 변경 |
| Input | home, work, maxTaxiFee, walkLimitMin, crowdSensitivity, useBike, aiStyle |
| Process | select/toggle이 `preferences` state 갱신. 루틴 동기화는 home/work를 지도 출발/도착으로 적용 |
| Output | 경로 재계산, AI context 반영, UI 선호값 표시 |
| Exception | 서버 저장 없음. 일부 값은 계산에 제한적으로만 반영 |

**수용 기준**

| Given | When | Then |
|---|---|---|
| 설정 탭이 열린 상태 | home/work 변경 후 루틴 동기화를 클릭한다 | 지도 출발/도착이 변경된다 |
| 설정 탭이 열린 상태 | maxTaxiFee/useBike를 변경한다 | 경로 후보가 재계산된다 |
| 설정 탭이 열린 상태 | AI 스타일을 클릭한다 | 상태와 toast가 갱신된다 |

### F8. Express/Vercel 서버 및 `/api/chat`

| 구분 | 내용 |
|---|---|
| Trigger | 클라이언트 `fetch("/api/chat")` |
| Input | JSON body: `message`, `context` |
| Process | request schema 검증 후 `GEMINI_API_KEY`가 있으면 Gemini 호출. 키가 없으면 서버 fallback JSON 반환 |
| Output | AI 추천 JSON. 개발 모드에서는 Vite middleware로 SPA 제공, Vercel에서는 `api/chat.ts` Function으로 제공 |
| Exception | schema 오류는 400, Gemini/서버 실패는 500. 클라이언트가 로컬 fallback으로 복구 |

**수용 기준**

| Given | When | Then |
|---|---|---|
| `GEMINI_API_KEY`가 없는 상태 | `/api/chat`을 호출한다 | server fallback JSON을 반환한다 |
| 개발 서버를 실행한 상태 | `http://0.0.0.0:3000`에 접근한다 | 앱이 제공된다 |
| build를 실행한 상태 | build가 완료된다 | Vite client bundle과 `dist/server.cjs`가 생성된다 |

## 10-1. 현재 FSD 슬라이싱 반영 상태

| 영역 | 현재 위치 | 남은 점 |
|---|---|---|
| App shell/router | `src/App.tsx`, `src/app/model/useAppController.ts`, `src/app/layouts/AppShell.tsx`, `src/app/router/AppRouter.tsx` | provider 분리와 URL router 도입 여부 결정 필요 |
| 온보딩 | `features/complete-onboarding/ui/OnboardingOverlay.tsx` | step state/model 분리 필요 |
| 지도 | `widgets/transit-map-panel/ui/InteractiveMap.tsx` | 기존 `components` re-export 제거 시점 결정 필요 |
| 리포트 시트 | `widgets/report-sheet/ui/*` | 리포트 상세 panel/CTA 분리 완료, 상위 sheet shell 정리 필요 |
| AI API/UI | `features/send-ai-chat/api`, `features/send-ai-chat/model/useAiChatController.ts`, `features/send-ai-chat/server`, `widgets/ai-chat-panel`, `api/chat.ts` | 후속으로 session/history persistence 검토 |
| 저장/아카이브 | `entities/report/model/store.ts`, `widgets/archive-calendar` | archive fixture/config 분리 필요 |
| 설정 | `entities/user-preferences/model/store.ts`, `widgets/settings-form` | settings content config 분리 필요 |

## 10-2. Dev 라우팅/어댑터 점검

| 항목 | 현 상태 |
|---|---|
| `npm run dev` 엔트리 | `tsx server.ts` |
| 내부 UI 라우팅 | `AppRouter`가 `activeTab` 기준으로 `MapPage`, `ArchivePage`, `SettingsPage`를 선택한다. 실제 URL 라우터는 아직 없다. |
| 로컬 API 라우팅 | `server.ts`가 `app.post("/api/chat")`를 Vite middleware보다 먼저 등록한다. |
| SPA fallback | development에서는 Vite middleware, production에서는 `dist/index.html` fallback을 사용한다. |
| Vercel API 라우팅 | `api/chat.ts`가 같은 `createAiChatResponse` responder를 공유한다. |
| 점검 결과 | 기존 3000번 프로세스 점유로 새 dev 서버 실행은 실패했다. 루트 HTML 응답은 확인됐으나 `/api/chat` POST는 포트 점유/프로세스 불안정으로 재검증 필요. |

## 10-3. Mock/Model 하드코딩 감사

| 위치 | 판정 | 조치 |
|---|---|---|
| `entities/station/mock/stations.ts` | 정상 mock 위치 | 유지 |
| `entities/route-plan/mock/*` | 정상 mock 위치 | 유지 |
| `entities/report/mock/savedReports.ts` | 정상 mock 위치 | 유지 |
| `features/generate-route-plan/model/presets.ts` | feature preset fixture로 허용 | 향후 API 연동 시 fixture 명명 검토 |
| `features/send-ai-chat/model/fallback.ts` | fallback model로 허용 | 문구/시나리오 fixture 분리 가능 |
| `features/send-ai-chat/server/chatResponder.ts` | 서버 fallback과 prompt에 도메인 문구가 많음 | Gemini mock responder와 prompt template 분리 후보 |
| `widgets/report-sheet/ui/BoardingReportView.tsx` | UI 안에 버스 잔여석/시간 mock 문구가 남아 있음 | 다음 report model fixture로 이동 후보 |
| `widgets/report-sheet/ui/RecoveryReportView.tsx` | UI 안에 N버스/거점/금액 mock 문구가 남아 있음 | report recovery fixture로 이동 후보 |
| `widgets/report-sheet/ui/CarriageReportView.tsx` | 일부 제목에 고정 출발/도착 문구가 남아 있음 | props 또는 route context 기반으로 교체 필요 |
| `widgets/ai-chat-panel/ui/AiChatLayer.tsx` | 추천 질문 배열과 chat state hook은 feature model로 이동됨 | session/history persistence 후보 |
| `App.tsx` | host 수준으로 축소됨 | 추가 상태 이동은 `app/model` 또는 feature model에서 진행 |
| `widgets/settings-form/ui/SettingsForm.tsx` | 공공데이터 출처 문구/옵션 배열이 widget 내부에 있음 | settings config 또는 shared content 분리 후보 |
| `widgets/archive-calendar/ui/ArchiveCalendar.tsx` | 2026년 5월/31일/92.8% mock 수치가 widget 내부에 있음 | archive fixture/config 분리 후보 |

## 11. 비즈니스 규칙

| ID | 규칙 |
|---|---|
| BR-01 | 저장 리포트는 같은 날짜, 출발역, 도착역, 리포트 타입, 선택 플랜 기준으로 중복 저장을 피한다. |
| BR-02 | 경로 후보 재계산 시 기존 `selectedPlan.id`가 새 후보에 있으면 유지하고, 없으면 첫 번째 후보를 선택한다. |
| BR-03 | `/api/chat` 실패 시 클라이언트는 700ms 후 로컬 fallback 응답을 생성한다. |
| BR-04 | AI 응답에 `startStation` 또는 `endStation`이 있으면 현재 지도 상태에 반영한다. |
| BR-05 | AI 응답에 `suggestedReportType`이 있으면 해당 리포트 타입을 활성화한다. |
| BR-06 | AI 응답에 `routeIndex`가 있고 후보 범위 안이면 해당 플랜을 선택한다. |
| BR-07 | 온보딩 완료 시 `showOnboarding=false`와 사용자 로그인 상태 mock 값을 설정한다. |
| BR-08 | 설정의 home/work 루틴 동기화는 현재 지도 출발/도착 값을 덮어쓴다. |
| BR-09 | `GEMINI_API_KEY`가 없으면 서버는 외부 호출 없이 fallback JSON을 반환한다. |
| BR-10 | preferences와 savedReports는 localStorage에 저장되며 parse 실패 시 기본값으로 복구한다. |

## 12. 현재 구현 갭

| 항목 | 기존 문서/PRD | 현재 코드 | 조치 문서 |
|---|---|---|---|
| 하단 탭 | `지도 / AI 챗 / 리포트 / 설정` | `지도 / 기록 / 설정`. AI 챗은 독립 탭 대신 지도 컨텍스트 overlay로 인정 | IA/PRD 후속 정합화 |
| 실제 공공데이터 | GBIS, 서울 열린데이터, 따릉이 등 | 연동 없음 | refactor plan |
| 사용자/계정 | 로그인/비회원/설정 저장 | React state only | architecture rules, refactor plan |
| 저장 리포트 | 아카이브 저장/재사용 | localStorage-backed client state | refactor plan |
| 경로 계산 | 실시간/패턴/복합수단 계산 | mock 분기 | refactor plan |
| 지도 | 지도 기반 앱 | SVG mock map | architecture rules |
| 타입 정합성 | `MapLayerState` 단일 정의 | facade 안정화 완료, 사용처 추가 축소 필요 | refactor plan |
| 보안 | AI 응답 렌더링 | `shared/lib/markdown/renderSafeMarkdown.tsx`로 React node 렌더링 | architecture rules |

## 13. Out of Scope v1

| 제외 범위 | 이유 |
|---|---|
| GPS 실시간 추적 | 위치 권한, 지도 SDK, 백엔드 정책 필요 |
| 실제 지도 SDK | 현재는 SVG mock map으로 데모 가능 |
| 실계정 로그인 | 인증/세션/DB 설계 필요 |
| 서버 저장 | API/DB 스키마 설계 필요 |
| 공공데이터 live 연동 | API key, rate limit, adapter 설계 필요 |
| 시각 회귀 자동화 | Playwright/스냅샷 기준 수립 필요 |
| 결제/구독 | 현재 제품 범위 밖 |

## 14. QA 기준

| 기능 ID | 체크 |
|---|---|
| F0 | 온보딩 Step 이동, 비회원 진입, 설정 완료 |
| F1 | 역 선택, 지도 노드 출발/도착 지정 |
| F2 | 레이어 토글, 줌/팬, 컨텍스트 메뉴 |
| F3 | 프리셋 3종, fallback 경로, 후보 선택 |
| F4 | 4개 리포트 탭, 저장, 클립보드 복사 |
| F5 | 추천 질문, 직접 입력, 서버 fallback, 로컬 fallback |
| F6 | 저장 목록, 날짜별 표시, 모두 지우기, 지도 이동 |
| F7 | 루틴 동기화, 택시비/도보/혼잡/따릉이/AI 스타일 변경 |
| F8 | `npm run dev`, `/api/chat`, `npm run build` |

## 15. 부록 링크

| 문서 | 역할 |
|---|---|
| `docs/talsu_inna_architecture_rules.md` | 앞으로 코드를 어디에 둘지 정하는 FSD-style FE rulebook |
| `docs/talsu_inna_refactor_plan.md` | 현재 코드에서 목표 구조로 옮기는 단계별 실행 계획 |
| `docs/talsu_inna_code_based_fsd_v1.md` | 문서 허브와 변경 이력용 인덱스 |
