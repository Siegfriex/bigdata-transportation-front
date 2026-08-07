# data_insight raw inventory: network/cloud/routing/UX

조사 기준: 2026-05-27, branch `publish-initial-main`, commit `fefac21`.
목적: 상위 분석 에이전트가 FSD 문서/리팩토링 계획을 만들기 위한 로데이터 보존.
주의: 아래 내용은 코드/설정/문서에서 직접 확인한 현재 구현 사실이다. `.env.local` 실제 값은 보고서에 보존하지 않고 key 존재만 기록한다.

## 1. 코드베이스 개요

| 항목 | 값/설명 | 근거 파일 | 확실도 |
|---|---|---|---|
| 앱 엔트리 | `src/main.tsx`가 `createRoot(...).render(<StrictMode><App /></StrictMode>)` 실행 | `src/main.tsx:1-10` | 높음 |
| 루트 컴포넌트 | `App` default export | `src/App.tsx:21` | 높음 |
| app shell 후보 | `AppShell`이 전체 배경/폰 컨테이너 외부 정렬을 담당, `App.tsx`가 실제 device shell, notch, map, top/bottom nav, overlay 조합 | `src/app/layouts/AppShell.tsx:9-14`, `src/App.tsx:315-414` | 높음 |
| 현재 라우팅 방식 | `react-router` 검색 결과 없음. `activeTab: TabId` 상태 기반 조건부 렌더링 | `src/app/router/AppRouter.tsx:12-27`, `src/App.tsx:30-31`, grep `rg "react-router|BrowserRouter|Routes|Route|useNavigate|useLocation" src` | 높음 |
| FSD 디렉터리 | `app/pages/widgets/features/entities/shared` 존재 | `find src -maxdepth 4 -type f` 결과 | 높음 |
| legacy facade | `src/types.ts`, `src/data.ts`, `src/components/InteractiveMap.tsx`가 FSD 모듈 재수출 | `src/types.ts:1-6`, `src/data.ts:1-4`, `src/components/InteractiveMap.tsx:1` | 높음 |
| public API index | 다수 slice에 `index.ts` 존재 | `find src -name 'index.ts' -o -name 'index.tsx'` | 높음 |
| alias 설정 | `@/* -> ./*`, Vite alias `@ -> path.resolve(__dirname, ".")`; 실제 import는 상대경로 중심 | `tsconfig.json:18-22`, `vite.config.ts:9-12`, grep `from "@/` 결과 없음 | 높음 |
| public 디렉터리 | `public` 디렉터리 없음 | `find public -maxdepth 4 -type f` -> `No such file or directory` | 높음 |
| git 상태 | `.gitignore` modified, `.env.local` untracked | `git status --short` | 높음 |

핵심 파일 구조:

```text
src/App.tsx
src/app/layouts/AppShell.tsx
src/app/router/AppRouter.tsx
src/pages/{map-page,archive-page,settings-page}/index.tsx
src/widgets/{transit-map-panel,map-workspace,report-sheet,ai-chat-panel,...}
src/features/{send-ai-chat,save-report,generate-route-plan,toggle-map-layer,complete-onboarding}
src/entities/{route-plan,station,report,user-preferences,chat-message}
src/shared/{api,config,model,lib,ui}
server.ts
api/chat.ts
vercel.json
```

## 2. 범주 1 raw data: 네트워크 4계층

### 조사 범주 요약

| 항목 | 값/설명 | 근거 파일 | 확실도 |
|---|---|---|---|
| 브라우저 API client | `sendAiChat(input)` -> `postJson("/api/chat", input)` -> `validateAiChatResponse(...)` | `src/features/send-ai-chat/api/sendAiChat.ts:16-18` | 높음 |
| 공통 HTTP client | `requestJson<T>`, `postJson<T>`, `HttpError`, `HttpTimeoutError`, 기본 `timeoutMs = 15000`, `fetch(url, ...)` | `src/shared/api/http-client.ts:1-91` | 높음 |
| API endpoint 문자열 | 클라이언트 `/api/chat`는 `sendAiChat.ts`에 직접 문자열 1회, 서버는 `server.ts`에 `app.post("/api/chat")` | `src/features/send-ai-chat/api/sendAiChat.ts:17`, `server.ts:16` | 높음 |
| 로컬 서버 | Express + Vite middleware, `PORT = 3000`, `0.0.0.0` listen | `server.ts:10-45` | 높음 |
| 로컬 API 라우트 | `app.post("/api/chat", async (req, res) => ...)`가 Vite middleware보다 먼저 등록 | `server.ts:15-34` | 높음 |
| Vercel Function | `api/chat.ts` default handler, POST만 허용, `Cache-Control: no-store`, 같은 `createAiChatResponse` 사용 | `api/chat.ts:20-37` | 높음 |
| request validation | `validateAiChatRequest`, message required, length <= 2000, context/preferences runtime check | `src/features/send-ai-chat/api/schema.ts:87-117` | 높음 |
| response validation | `validateAiChatResponse`, `textAnswer` required, `suggestedReportType` enum check | `src/features/send-ai-chat/api/schema.ts:119-141` | 높음 |
| schema 라이브러리 | `zod` 사용 없음. 직접 타입 가드/validation 함수 사용 | `rg "zod|schema" src server.ts`, `src/features/send-ai-chat/api/schema.ts` | 높음 |
| AI provider | `@google/genai`, `GoogleGenAI`, `env.GEMINI_API_KEY`, `env.GEMINI_MODEL || "gemini-2.5-flash"` | `src/features/send-ai-chat/server/chatResponder.ts:1`, `:18-29`, `:126-128` | 높음 |
| AI fallback | `GEMINI_API_KEY` 없거나 `MY_GEMINI_API_KEY`면 `createHeuristicResponse` 반환 | `src/features/send-ai-chat/server/chatResponder.ts:18-34`, `:96-103` | 높음 |
| 클라이언트 fallback | `handleSendMessage` catch에서 `setTimeout(..., 700)` 후 `createFallbackChatMessage(text)` | `src/App.tsx:212-225` | 높음 |
| 교통/지도 외부 API | 현재 구현된 fetch endpoint는 `/api/chat`뿐. 문서에는 Google Maps/공공데이터 계획 존재 | grep endpoint 결과, `docs/talsu_inna_google_maps_platform_plan.md` | 높음 |

### 네트워크 계층 후보 분해

| 계층 후보 | 현재 파일 | 현재 역할 | 근거 |
|---|---|---|---|
| UI trigger | `src/widgets/ai-chat-panel/ui/AiChatLayer.tsx` | input/button/prompt에서 `onSendMessage` 호출 | `AiChatLayer.tsx:205-236` |
| app orchestration | `src/App.tsx` | `handleSendMessage`: 사용자 메시지 append, loading, API 호출, 응답으로 지도/리포트 상태 변경 | `src/App.tsx:142-226` |
| feature API client | `src/features/send-ai-chat/api/sendAiChat.ts` | `/api/chat` POST, response validation | `sendAiChat.ts:16-18` |
| shared transport | `src/shared/api/http-client.ts` | fetch, timeout, JSON/text parse, HTTP error shape | `http-client.ts:44-91` |
| server route | `server.ts`, `api/chat.ts` | Express/Vercel handler | `server.ts:16-26`, `api/chat.ts:20-37` |
| server domain responder | `src/features/send-ai-chat/server/chatResponder.ts` | Gemini/fallback, response schema, prompt | `chatResponder.ts:96-157` |

### 핵심 grep/find 결과

```text
rg '"/api/|`/api/|postJson\(|requestJson\(|fetch\(' src server.ts api
server.ts:  app.post("/api/chat", async (req, res) => {
src/shared/api/http-client.ts:    const response = await fetch(url, {
src/features/send-ai-chat/api/sendAiChat.ts:  return validateAiChatResponse(await postJson("/api/chat", input));
```

```text
rg "localStorage|queryKey|queryKeys|storage|zod|schema|dangerouslySetInnerHTML" src server.ts
src/shared/model/usePersistentState.ts: window.localStorage.getItem(key)
src/shared/model/usePersistentState.ts: window.localStorage.setItem(key, JSON.stringify(value))
src/shared/config/query-keys.ts:export const queryKeys = { ... }
src/features/send-ai-chat/lib/renderMarkdown.tsx:dangerouslySetInnerHTML ...
```

### 아직 확인 필요

| 항목 | 이유 | 근거 |
|---|---|---|
| 실제 Vercel 배포 동작 | `vercel.json`과 `api/chat.ts`는 존재하지만 라이브 배포 검증은 이번 조사에서 실행하지 않음 | `vercel.json:1-15`, `api/chat.ts:20-37` |
| `/api/chat` runtime smoke | dev server 실행/POST 검증은 이번 작업 범위에서 수행하지 않음 | `server.ts:43-45` |
| `.env.local` secret 관리 | key 값이 실제로 존재. 보고서에는 key 이름만 보존 | `.env.local:1-3` |

## 3. 범주 2 raw data: 퍼블리시 및 프론트엔드 클라우드

### 조사 범주 요약

| 항목 | 값/설명 | 근거 파일 | 확실도 |
|---|---|---|---|
| package type | ESM: `"type": "module"` | `package.json:5` | 높음 |
| dev script | `"dev": "tsx server.ts"` | `package.json:7` | 높음 |
| build script | `"build": "npm run build:client && npm run build:server"` | `package.json:8` | 높음 |
| client build | `"build:client": "vite build"` | `package.json:9` | 높음 |
| server build | `esbuild server.ts --bundle --platform=node --format=cjs --packages=external --sourcemap --outfile=dist/server.cjs` | `package.json:10` | 높음 |
| start script | `"start": "node dist/server.cjs"` | `package.json:11` | 높음 |
| lint script | `"lint": "tsc --noEmit"` | `package.json:13` | 높음 |
| Vite plugins | `react()`, `tailwindcss()` | `vite.config.ts:1-8` | 높음 |
| Vite server flags | `DISABLE_HMR`로 `hmr`/`watch` 제어 | `vite.config.ts:14-20` | 높음 |
| Vercel build | `buildCommand: npm run build:client`, `outputDirectory: dist` | `vercel.json:1-3` | 높음 |
| Vercel Function duration | `api/chat.ts` maxDuration `300` | `vercel.json:4-8` | 높음 |
| Vercel rewrite | non-API를 `/index.html`로 rewrite | `vercel.json:9-14` | 높음 |
| env example | `GEMINI_API_KEY`, `GEMINI_MODEL`, `APP_URL` | `.env.example:1-12` | 높음 |
| local env keys | `AGENT_PLATFORM_API_KEY`, `Maps_Platform_API_Key`, `GEMINI_API_KEY` 존재. 값은 보고서에 미기재 | `.env.local:1-3` | 높음 |
| cloud 관련 문서 | Vercel Functions/env 문서, Google Maps plan 문서 존재 | `docs/talsu_inna_vercel_functions_env.md`, `docs/talsu_inna_google_maps_platform_plan.md` | 높음 |
| Vercel 문서-코드 일치 후보 | 문서가 `api/chat.ts`, `vercel.json`, `/api/chat`, `GEMINI_*`를 명시 | `docs/talsu_inna_vercel_functions_env.md` grep 결과 | 중간 |

### 핵심 설정 스니펫 목록

| 스니펫 | 보존 가치 | 근거 |
|---|---|---|
| `package.json` scripts 전체 | local/prod/Vercel build 경계 | `package.json:6-14` |
| `vercel.json` 전체 | Vercel publish 규칙 | `vercel.json:1-15` |
| `vite.config.ts` alias/HMR/watch | dev 환경 규칙 | `vite.config.ts:6-21` |
| `.env.example` key/comment | 운영 env 계약 | `.env.example:1-12` |

## 4. 범주 3 raw data: 라우팅 및 전역 규칙

### A. 현재 전역 책임 인벤토리

| 책임 항목 | 현재 소유 파일 | 세부 상태/함수/상수 | FSD 후보 레이어 | 근거 파일 |
|---|---|---|---|---|
| 앱 루트 조합 | `src/App.tsx` | `AppShell`, `ToastOverlay`, device shell, map, `TopAppBar`, `AppRouter`, `AiChatLayer`, `BottomNavigation` 조합 | app 확정/후보 혼재 | `src/App.tsx:314-414` |
| 온보딩 상태 | `src/App.tsx` | `showOnboarding`, `onboardingStep`, `user`, `setShowOnboarding`, `setOnboardingStep`, `setUser` | feature `complete-onboarding` 후보 | `src/App.tsx:22-28`, `:327-345` |
| 탭 라우팅 상태 | `src/App.tsx`, `src/app/router/AppRouter.tsx` | `activeTab`, `setActiveTab`, `TabId = "map"|"archive"|"settings"` | app/router 확정 후보 | `src/App.tsx:30-31`, `AppRouter.tsx:12-27`, `routes.ts:1-7` |
| 지도 layer 상태 | `src/App.tsx` | `mapLayer`, `setMapLayer`, `MapLayerState`, `DEFAULT_VISIBLE_LAYERS`, `visibleLayers` | feature `toggle-map-layer` 후보 | `src/App.tsx:32`, `:50-51`, `toggle-map-layer/model/types.ts:1-21` |
| 경로 조건 상태 | `src/App.tsx` | `startStation`, `endStation`, `deadlineTime`, `selectedReportType` | entities/feature 후보 | `src/App.tsx:34-38` |
| 사용자 선호 persistence | `src/App.tsx`, `shared/model/usePersistentState.ts` | `preferences`, `setPreferences`, `STORAGE_KEYS.preferences`, `getDefaultPreferences()` | entity `user-preferences` + shared storage 후보 | `src/App.tsx:40-44`, `usePersistentState.ts:15-29` |
| 저장 리포트 persistence | `src/App.tsx`, `shared/model/usePersistentState.ts` | `savedReports`, `setSavedReports`, `STORAGE_KEYS.savedReports`, `getSavedReportsMock()` | entity `report` + feature `save-report` 후보 | `src/App.tsx:45-48`, `storage-keys.ts:1-5` |
| 경로 계산 | `src/App.tsx`, `entities/route-plan/mock/routePlans.ts` | `plans`, `selectedPlan`, `updateRoutePlans`, `getRoutePlans(start,end,opts)` | entity `route-plan` 후보 | `src/App.tsx:53-106`, `routePlans.ts:3-180` |
| 칸 생존 데이터 | `src/App.tsx`, `entities/route-plan/mock/carSurvival.ts` | `activeCarNo`, `carDetails`, `getCarSurvivalDetails("9호선")` | entity `route-plan` 또는 `carriage` 후보 | `src/App.tsx:57-60`, `:113-116`, `carSurvival.ts:1-18` |
| 캘린더 선택 | `src/App.tsx` | `selectedCalendarDay`, `setSelectedCalendarDay` | page/widget state 후보 | `src/App.tsx:61-62`, `ArchiveCalendar.tsx:4-10` |
| AI chat 상태/오케스트레이션 | `src/App.tsx` | `chatInput`, `chatbotLoading`, `chatMessages`, `chatEndRef`, `handleSendMessage` | feature `send-ai-chat` 후보 | `src/App.tsx:64-69`, `:142-226` |
| toast 상태 | `src/App.tsx`, `shared/ui/toast` | `toastMessage`, `showToast`, `ToastOverlay` | shared UI + app store 후보 | `src/App.tsx:71-79`, `ToastOverlay.tsx:7-16` |
| 저장 리포트 생성/중복체크 | `src/App.tsx`, `features/save-report` | `handleSaveReport`, `createSavedReport`, `isDuplicateSavedReport` | feature `save-report` 확정 후보 | `src/App.tsx:228-250`, `createSavedReport.ts:11-39` |

### App.tsx 집중 책임 목록

| 책임 | 세부 항목 | 근거 |
|---|---|---|
| imports 집중 | React hooks, lucide 일부 미사용 import 후보(`MessageSquare`, `Navigation`, `RotateCw`, `ExternalLink`, `Layers`), domain types/data/features/widgets/shared/app | `src/App.tsx:1-19` |
| state owner | 총 19개 상태/참조: onboarding/user/nav/route/preferences/reports/layers/plans/car/calendar/chat/toast | `src/App.tsx:21-72` |
| derived route sync | station/preference 변경 시 `updateRoutePlans` 실행, `selectedReportType` 자동 변경 | `src/App.tsx:81-111` |
| domain decision inline | `startStation === "사당역" -> "boarding"`, `홍대입구역 -> "recovery"`, else `"deadline"` | `src/App.tsx:98-105` |
| map layer toggle | `handleToggleLayer`, `handleSelectStation` | `src/App.tsx:123-130` |
| preset trigger | preset으로 출발/도착/report/time/toast/mapLayer 변경 | `src/App.tsx:132-140` |
| AI submit orchestration | message 생성, API 호출, response mapping, route recalculation, selectedPlan, fallback, toast/layer 변경 | `src/App.tsx:142-226` |
| save report orchestration | selectedPlan guard, duplicate guard, create, persist, toast | `src/App.tsx:228-250` |
| page props assembly | `mapPageProps`, `archivePageProps`, `settingsPageProps`를 객체 literal로 구성 | `src/App.tsx:252-312` |
| shell/presentation | physical phone chassis class, notch/camera mock, absolute map/content/overlay/nav layering | `src/App.tsx:318-413` |

### B. 도메인 엔티티 후보 표

| 엔티티명 | 관련 타입/상태/데이터 | 현재 위치 | 분리 필요성 | 근거 파일 |
|---|---|---|---|---|
| Station | `StationNode`, `stations`, `stationNames`, `startStation`, `endStation` | `entities/station/*`, `App.tsx` state, map/settings/condition UI | 후보. mock 좌표/혼잡/가용대수와 selection state가 여러 UI에 전달됨 | `StationNode` `stations.ts:3-13`, `App.tsx:35-36` |
| RoutePlan | `TransitMode`, `TimelineStep`, `RoutePlan`, `RoutePlanOptions`, `getRoutePlans`, `plans`, `selectedPlan` | `entities/route-plan/*`, `App.tsx` | 후보. route calculation/mock + selected state + report rendering에 광범위 사용 | `route-plan/model/types.ts:1-26`, `App.tsx:53-55` |
| Report/SavedReport | `ReportType`, `SavedReport`, `getSavedReportsMock`, `selectedReportType`, `savedReports` | `entities/report/*`, `features/save-report`, `App.tsx` | 후보. report type이 tabs/save/archive/AI schema에 걸침 | `report/model/types.ts:1-12`, `App.tsx:38`, `:45-48` |
| UserPreferences | `UserPreferences`, `getDefaultPreferences`, `preferences` | `entities/user-preferences/*`, `SettingsForm`, `OnboardingOverlay` | 후보. persistent state와 route calc 옵션에 사용 | `user-preferences/model/types.ts:1-10`, `defaults.ts:3-14` |
| ChatMessage | `ChatMessage`, `AiChatResponse`, `chatMessages` | `entities/chat-message/*`, `features/send-ai-chat`, `AiChatLayer`, `App.tsx` | 후보. 서버/클라이언트 response와 UI 상태가 함께 사용 | `chat-message/model/types.ts:3-21`, `App.tsx:67` |
| CarDetail | `CarDetail`, `carDetails`, `activeCarNo` | `entities/route-plan/mock/carSurvival.ts`, `CarriageReportView`, `App.tsx` | 후보. 현재 route-plan mock 안에 있지만 report type `carriage`와 강하게 결합 | `carSurvival.ts:1-18`, `App.tsx:57-60` |
| TransitLayer/MapLayerState | `TransitLayer`, `VisibleLayers`, `MapLayerState` | `features/toggle-map-layer/model/types.ts` | feature/shared 경계 후보. 지도 UI 상태와 app overlay 상태가 섞임 | `toggle-map-layer/model/types.ts:1-21` |

### C. feature 후보 표

| feature명(행동 기준) | 현재 트리거 UI | 현재 로직 위치 | 관련 상태 | 근거 파일 |
|---|---|---|---|---|
| complete-onboarding | `OnboardingOverlay` next/bypass/finish/input/toggle | 대부분 `App.tsx` handler, UI는 feature 내부 | `showOnboarding`, `onboardingStep`, `user`, `preferences` | `App.tsx:327-345`, `OnboardingOverlay.tsx:30-191` |
| toggle-map-layer | map layer buttons `toggle-subway/bus/bike/crowd`, reset | `App.handleToggleLayer`, `InteractiveMap.handleLayerClick/reset` | `visibleLayers`, `legendTooltip` | `App.tsx:123-125`, `InteractiveMap.tsx:68-85`, `:238-356` |
| generate-route-plan/select-preset | `RoutePresetCarousel` cards | `triggerPreset`, `routePresets`, `getRoutePlans` | `startStation`, `endStation`, `selectedReportType`, `deadlineTime`, `plans` | `App.tsx:132-140`, `presets.ts:14-42` |
| select station | SVG station context popup, selects in route condition/settings | `InteractiveMap.selectAs`, `RouteConditionCard`, `SettingsForm` handlers via props | `startStation`, `endStation`, `preferences.home/work` | `InteractiveMap.tsx:164-171`, `RouteConditionCard.tsx:27-69`, `SettingsForm.tsx:40-61` |
| send-ai-chat | prompt buttons, input Enter, send button, AI briefing button | `App.handleSendMessage`, `sendAiChat`, server responder, fallback | `chatInput`, `chatbotLoading`, `chatMessages`, route/report/map states | `AiChatLayer.tsx:205-236`, `App.tsx:142-226` |
| show-report-from-ai | AI message button `지도에서 보기` | `AiChatLayer.onShowReport` -> `App` sets report/layer/tab | `selectedReportType`, `mapLayer`, `activeTab` | `AiChatLayer.tsx:175-182`, `App.tsx:393-397` |
| save-report | `save-report-action`, `전술 리포트 생성` | `App.handleSaveReport`, `createSavedReport`, `isDuplicateSavedReport` | `selectedPlan`, `selectedReportType`, `savedReports` | `ReportActionBar.tsx:11-18`, `AiChatLayer.tsx:97-101`, `App.tsx:228-250` |
| restore-report | Archive card `지도 이동` | `archivePageProps.onRestoreReport` | `startStation`, `endStation`, `selectedReportType`, `activeTab` | `ArchiveCalendar.tsx:153-159`, `App.tsx:294-300` |
| clear-reports | Archive `모두 지우기` | `archivePageProps.onClearReports` | `savedReports` | `ArchiveCalendar.tsx:122-128`, `App.tsx:290-293` |
| sync-routine | Settings `기본 루틴으로 지도 동기화` | `settingsPageProps.onSyncRoutine` | `preferences.home`, `preferences.work`, station states | `SettingsForm.tsx:64-69`, `App.tsx:306-310` |
| change-preferences | Settings selects/toggles, onboarding controls | `SettingsForm`, `OnboardingOverlay`, `setPreferences` | `preferences` persistent state | `SettingsForm.tsx:27-189`, `OnboardingOverlay.tsx:100-167` |
| copy-route-summary | Deadline report `경로 복사` | `DeadlineReportView.handleCopySummary` via `onCopySummary` toast only; clipboard API 사용 없음 | `selectedPlan`, toast | `DeadlineReportView` grep result, `App.tsx:276` |

### D. routing/app shell 표

| 항목 | 현재 방식 | 코드 근거 | 문제 또는 특징 |
|---|---|---|---|
| route library | `react-router` 미사용 | grep 결과 없음 | URL path 기반 routing 없음 |
| route state | `activeTab: TabId` local state | `src/App.tsx:30-31` | 새로고침/URL 공유 불가 |
| route enum | `TabId = "map" | "archive" | "settings"` | `src/shared/config/routes.ts:1` | label은 `APP_TABS`와 BottomNavigation `tabs`에 중복 후보 |
| router component | `AppRouter` if문으로 page 선택 | `src/app/router/AppRouter.tsx:18-27` | tabs 외 nested route 없음 |
| pages | `MapPage`, `ArchivePage`, `SettingsPage`는 widget pass-through | `pages/*/index.tsx` | page UI ownership 없음, composition boundary 역할 |
| shell | `AppShell` outer background + `App.tsx` device shell | `AppShell.tsx:11`, `App.tsx:318-413` | shell 책임이 두 파일에 분산 |
| map always mounted | map layer는 `absolute inset-0 z-0`, tab body 위에 항상 활성 | `App.tsx:348-358` | archive/settings도 map 위 overlay 형태 |
| content body | `<main ... z-10 ... pointer-events-none>` 내부에 `AppRouter` | `App.tsx:366-374` | page/widget가 `pointer-events-auto`로 상호작용 복구 |
| top/bottom nav | `TopAppBar` z-20, `BottomNavigation` z-30 | `TopAppBar.tsx`, `BottomNavigation.tsx` | `shared/config/z-index.ts` 값 미사용 |

### E. 하드코딩 인벤토리 표

| 종류 | 발견 위치 | 예시 | 근거 파일 |
|---|---|---|---|
| storage key | 중앙 config | `talsu.preferences.v1`, `talsu.savedReports.v1`, `talsu.onboarding.v1` | `src/shared/config/storage-keys.ts:1-5` |
| storage 직접 사용 | shared hook 내부 | `window.localStorage.getItem(key)`, `setItem(key, JSON.stringify(value))` | `src/shared/model/usePersistentState.ts:7`, `:23` |
| query key | 중앙 config, 사용처 미확인 | `routePlans`, `aiChat`, `stationContext` | `src/shared/config/query-keys.ts:3-8` |
| query key 직접 사용 | 사용 없음 | `rg "queryKey|queryKeys"` 결과 config export만 확인 | `src/shared/config/query-keys.ts` |
| API path | feature API/server/function | `"/api/chat"` | `sendAiChat.ts:17`, `server.ts:16`, `api/chat.ts` |
| env key | server/env files | `GEMINI_API_KEY`, `GEMINI_MODEL`, `APP_URL`, `DISABLE_HMR` | `.env.example:1-12`, `chatResponder.ts:20`, `vite.config.ts:17-19` |
| z-index config 미사용 | config 존재, JSX 숫자 직접 사용 다수 | `zIndex = { base,map,content,topBar,onboarding,overlay,toast }`; JSX `z-40`, `z-[100]` | `z-index.ts:1-9`, `App.tsx:322`, `ToastOverlay.tsx:11` |
| color magic number | 컴포넌트/글로벌 CSS 다수 | `#0A84FF`, `#FF3B30`, `#FF9500`, `#A6D600`, `#141618`, `#1E1E1E` | grep color 결과, `index.css:9-13`, `InteractiveMap.tsx`, `AiChatLayer.tsx` |
| spacing/size literal | Tailwind arbitrary values 다수 | `max-w-[412px]`, `md:h-[844px]`, `pt-[52px]`, `bottom-[64px]` | `src/App.tsx:319`, `:367`, `AiChatLayer.tsx:47-50` |
| mock data | entity mock/model files | stations, routePlans, carSurvival, savedReports | `entities/*/mock/*.ts` |
| type duplicate/alias facade | root `types.ts` 재수출 + local UI prop types | `export type { RoutePlan... }`, many `*Props` local types | `src/types.ts:1-6`, grep `interface |type` |
| markdown HTML injection | renderMarkdown | `dangerouslySetInnerHTML` after regex replace | `src/features/send-ai-chat/lib/renderMarkdown.tsx:14`, `:26`, `:36` |
| route labels duplicate 후보 | routes config vs bottom nav | `APP_TABS`, local `tabs` array | `src/shared/config/routes.ts:3-7`, `BottomNavigation.tsx:9-13` |

### global css와 component style 경계

| 항목 | 현재 위치 | 내용 | 근거 |
|---|---|---|---|
| 글로벌 font import | `src/index.css` | Google Fonts `Inter`, `JetBrains Mono`, `Space Grotesk` | `src/index.css:1` |
| Tailwind import | `src/index.css` | `@import "tailwindcss";` | `src/index.css:2` |
| theme token | `src/index.css` | `--font-*`, `--color-apple-*` | `src/index.css:4-14` |
| body reset | `src/index.css` | margin/padding/background | `src/index.css:16-20` |
| reusable classes | `src/index.css` | `.apple-mesh-bg`, `.apple-glass`, `.apple-glass-light`, `.stroke-dash-animated`, `.scrollbar-none`, `.animate-spin-slow` | `src/index.css:22-88` |
| component style | TSX className | layout, z-index, colors, shadows, spacing 대부분 inline Tailwind | grep magic result | 

### public API(index.ts) 존재 여부

| 레이어 | index/public API 확인 | 근거 |
|---|---|---|
| app | `src/app/layouts/index.ts`, `src/app/router/index.ts` | find index 결과 |
| pages | `src/pages/index.ts`, page별 `index.tsx` | find index 결과 |
| widgets | `ai-chat-panel`, `archive-calendar`, `bottom-navigation`, `map-workspace`, `report-sheet`, `settings-form`, `top-app-bar`, `transit-map-panel` | find index 결과 |
| features | `complete-onboarding`, `generate-route-plan`, `save-report`, `send-ai-chat`, `toggle-map-layer` | find index 결과 |
| entities | `chat-message`, `report`, `route-plan`, `station`, `user-preferences` | find index 결과 |
| shared | `api`, `config`, `ui/page-container`, `ui/toast` | find index 결과 |

## 5. 범주 4 raw data: UX / 플로팅 / 시나리오

### 조사 범주 요약

| 항목 | 값/설명 | 근거 파일 | 확실도 |
|---|---|---|---|
| primary UX | 모바일 phone chassis 안에서 map-first overlay UI | `src/App.tsx:318-413` | 높음 |
| 화면 전환 | bottom navigation 3 tabs: 지도/기록/설정 | `src/widgets/bottom-navigation/BottomNavigation.tsx:9-13` | 높음 |
| map UX | SVG mock map, pan/zoom, station click context menu, layer toggles, tooltip | `src/widgets/transit-map-panel/ui/InteractiveMap.tsx:17-625` | 높음 |
| floating AI UX | `mapLayer`가 `ai_overlay`, `ai_peek`, `ai_result`일 때 absolute overlay | `AiChatLayer.tsx:44-52`, `:107-241` | 높음 |
| report sheet UX | `mapLayer === "report_detail"`일 때 route condition + report detail panel | `MapWorkspace.tsx:77-110` | 높음 |
| onboarding UX | absolute full overlay, 2-step onboarding/profile preferences | `OnboardingOverlay.tsx:40-191` | 높음 |
| archive UX | calendar + saved report list + restore/clear actions | `ArchiveCalendar.tsx:32-167` | 높음 |
| settings UX | home/work station, taxi/walk/crowd/bike, AI style, data source text | `SettingsForm.tsx:27-189` | 높음 |
| toast UX | fixed top overlay, 2500ms hide in `showToast` | `ToastOverlay.tsx:7-16`, `App.tsx:74-79` | 높음 |
| mock scenario presets | `9호선 급행 출근`, `퇴근길 광역 버스`, `막차 탈출 플랜` | `features/generate-route-plan/model/presets.ts:14-42` | 높음 |
| report types | `deadline`, `boarding`, `carriage`, `recovery` | `entities/report/model/types.ts:1`, `ReportTypeTabs.tsx:14-19` | 높음 |
| AI suggested prompts | 4 prompts | `features/send-ai-chat/model/suggestedPrompts.ts:1-6` | 높음 |

### widget으로 분리 가능한 화면 블록 목록

| widget 후보 | 현재 파일 | 현재 역할 | 근거 |
|---|---|---|---|
| TransitMapPanel | `src/widgets/transit-map-panel/ui/InteractiveMap.tsx` | 배경 지도/SVG/레이어/줌/역 컨텍스트 | `InteractiveMap.tsx:193-623` |
| MapWorkspace | `src/widgets/map-workspace/ui/MapWorkspace.tsx` | 지도 위 preset/search/report sheet body | `MapWorkspace.tsx:53-114` |
| AiChatLayer | `src/widgets/ai-chat-panel/ui/AiChatLayer.tsx` | AI overlay/peek/result/input/messages | `AiChatLayer.tsx:27-244` |
| ReportSheet | `src/widgets/report-sheet/ui/*` | report tabs/detail/action/views/route condition | `report-sheet/index.ts:1-8` |
| ArchiveCalendar | `src/widgets/archive-calendar/ui/ArchiveCalendar.tsx` | 통근 캘린더 + 저장 리포트 목록 | `ArchiveCalendar.tsx:32-167` |
| SettingsForm | `src/widgets/settings-form/ui/SettingsForm.tsx` | 선호/루틴 설정 폼 | `SettingsForm.tsx:27-189` |
| BottomNavigation | `src/widgets/bottom-navigation/BottomNavigation.tsx` | tab switch nav | `BottomNavigation.tsx:9-13` |
| TopAppBar | `src/widgets/top-app-bar/TopAppBar.tsx` | 앱 상단 바/user/reset | grep export/props 결과 |
| ToastOverlay | `src/shared/ui/toast/ToastOverlay.tsx` | global toast overlay | `ToastOverlay.tsx:7-16` |

### 사용자 시나리오 raw 목록

| 시나리오 | 현재 구현 데이터/트리거 | 관련 파일 |
|---|---|---|
| 9호선 급행 출근 | preset `염창역 -> 여의도역`, report `carriage`; routePlans에 3개 plan | `presets.ts:15-23`, `routePlans.ts:6-55` |
| 퇴근길 광역 버스 | preset `사당역 -> 강남역`, report `boarding`; routePlans에 2개 plan | `presets.ts:24-32`, `routePlans.ts:56-89` |
| 막차 탈출 플랜 | preset `홍대입구역 -> 남양주시`, report `recovery`; routePlans에 2개 plan | `presets.ts:33-41`, `routePlans.ts:90-122` |
| 임의 경로 | `plans.length === 0` fallback dynamic route, `opts.useBike`, `opts.maxTaxiFee`로 추가 plan | `routePlans.ts:124-179` |
| AI 지각 질문 | query includes `9시/deadline/마감` -> deadline response | `chatResponder.ts:42-51`, `fallback.ts:10-12` |
| AI 칸 질문 | query includes `칸/car/몇번/생존` -> carriage response | `chatResponder.ts:53-62`, `fallback.ts:13-15` |
| AI 막차 질문 | query includes `막차/recovery/놓치면/실패` -> recovery response | `chatResponder.ts:64-73`, `fallback.ts:16-18` |
| AI 버스 질문 | query includes `이번/버스/boarding/탈수/가능성` -> boarding response | `chatResponder.ts:75-84` |

## 6. 교차 연결 맵

| 현재 파일 | 관련 범주 | 왜 중요한지 |
|---|---|---|
| `src/App.tsx` | 네트워크, 라우팅, UX, 상태 | API 호출 orchestration, tab routing, shell composition, persistent state owner가 집중 |
| `src/features/send-ai-chat/*` | 네트워크, UX, entity, server | `/api/chat` client/server/schema/fallback/rendering이 한 feature에 존재 |
| `server.ts` | 네트워크, 클라우드 | 로컬 Express API와 Vite middleware 경계 |
| `api/chat.ts` | 네트워크, 클라우드 | Vercel serverless entry, same responder reuse |
| `vercel.json` | 클라우드, routing | static rewrite와 Function duration 설정 |
| `src/shared/api/http-client.ts` | 네트워크, shared rule | fetch 공통 경계. endpoint 문자열은 받는 쪽이 소유 |
| `src/shared/config/*` | 라우팅, storage/query/z-index 규칙 | central config는 있으나 `zIndex`/`queryKeys` 실사용은 제한적 |
| `src/entities/route-plan/*` | 네트워크 후보, entity, UX scenario | mock route engine이 report/map/AI와 연결 |
| `src/entities/station/*` | entity, UX map/settings | map 좌표/혼잡/가용대수 mock + stationNames UI source |
| `src/widgets/transit-map-panel/ui/InteractiveMap.tsx` | UX, entity, style magic | local pan/zoom state, SVG mock, hardcoded styles 집중 |
| `src/widgets/report-sheet/*` | UX, feature/entity | report type UI, route timeline, save/AI actions |
| `src/index.css` | global style | global token/class와 component style 경계 판단 근거 |
| `.env.example`, `.env.local` | 클라우드, 네트워크 | env key 계약과 실제 local key 존재 |

## 7. 상위 분석 에이전트에게 넘길 주의사항

### 확실한 사실

| 사실 | 근거 |
|---|---|
| `react-router`는 현재 사용되지 않는다. | grep 결과 없음 |
| routing은 `activeTab` 기반이다. | `App.tsx:30-31`, `AppRouter.tsx:18-27` |
| `/api/chat`만 구현된 API endpoint로 확인된다. | endpoint grep 결과 |
| localStorage 직접 접근은 `usePersistentState` 내부에만 있다. | `usePersistentState.ts:7`, `:23` |
| storage key는 `shared/config/storage-keys.ts`에 중앙화되어 `App.tsx`에서 import한다. | `storage-keys.ts:1-5`, `App.tsx:10`, `:41-48` |
| query key factory는 존재하지만 실제 query client/react-query 사용은 확인되지 않는다. | `query-keys.ts:3-8`, package dependencies에 react-query 없음 |
| `zIndex` config는 존재하지만 JSX에서는 Tailwind z 클래스가 직접 쓰인다. | `z-index.ts:1-9`, grep z 결과 |
| `src/types.ts`, `src/data.ts`는 root facade로 남아 있다. | `src/types.ts:1-6`, `src/data.ts:1-4` |
| mock data는 entities mock/model과 feature model에 다수 존재한다. | `entities/*/mock/*.ts`, `features/generate-route-plan/model/presets.ts` |
| `dangerouslySetInnerHTML`가 AI markdown 렌더링에 사용된다. | `renderMarkdown.tsx:14`, `:26`, `:36` |

### 추정이 필요한 항목

| 항목 | 왜 추정 필요 |
|---|---|
| `MapLayerState`의 미사용 값(`report_mini`, `report_summary`, `evidence`, `map_peek`) | 타입에는 있으나 현재 grep상 분기 UI가 제한적 |
| `src/components/InteractiveMap.tsx` 유지 이유 | 현재 re-export facade로 보이나 외부 import 호환 목적 여부는 문서/히스토리 확인 필요 |
| `src/shared/ui/page-container/PageContainer.tsx` 사용 여부 | 존재하지만 현재 App main이 직접 class 사용 |
| `queryKeys` 향후 역할 | config는 있으나 현재 runtime use 없음 |
| `Maps_Platform_API_Key` local env | `.env.local`에는 key가 있으나 현재 코드에서 사용처 없음 |

### 추가로 열어봐야 할 파일/명령

| 항목 | 목적 |
|---|---|
| `git log --oneline -- src/App.tsx src/app src/features src/entities` | 최근 FSD 리팩토링 순서/의도 확인 |
| `npm run lint` | 현재 타입 오류/미사용 import 확인 |
| `npm run build` | Vite/Vercel build output 확인 |
| dev server + `POST /api/chat` smoke | Express route 및 fallback/Gemini path 검증 |
| `docs/talsu_inna_fsd_current.md` 전체 | 이미 문서화된 현재 상태와 이 raw inventory 차이 비교 |
| `docs/talsu_inna_architecture_rules.md` 전체 | 목표 규칙과 현재 hardcoding/ownership gap 비교 |

## 8. 원문 그대로 보존할 가치가 있는 코드/설정 스니펫 목록

| 파일 | 라인 | 이유 |
|---|---:|---|
| `src/App.tsx` | `21-416` | 현재 전역 책임이 집중된 루트 구현 전체 |
| `src/app/router/AppRouter.tsx` | `12-27` | tab 기반 routing 핵심 |
| `src/shared/config/routes.ts` | `1-7` | route/tab id와 label |
| `src/shared/config/storage-keys.ts` | `1-5` | storage key 계약 |
| `src/shared/config/query-keys.ts` | `3-8` | query key factory 계약 |
| `src/shared/config/z-index.ts` | `1-9` | z-index token 후보 |
| `src/shared/api/http-client.ts` | `44-91` | HTTP transport 공통 처리 |
| `src/features/send-ai-chat/api/schema.ts` | `87-141` | runtime request/response validation |
| `src/features/send-ai-chat/server/chatResponder.ts` | `18-34`, `96-157` | Gemini env/fallback/server responder |
| `server.ts` | `10-45` | local Express/Vite API hosting |
| `api/chat.ts` | `20-37` | Vercel function handler |
| `vercel.json` | `1-15` | cloud publish/routing |
| `src/widgets/transit-map-panel/ui/InteractiveMap.tsx` | `17-625` | SVG mock map, local interaction state, hardcoded style concentration |
| `src/widgets/ai-chat-panel/ui/AiChatLayer.tsx` | `44-241` | floating AI UX states |
| `src/widgets/report-sheet/ui/ReportDetailPanel.tsx` | `43-85` | report widget composition |
| `src/entities/route-plan/mock/routePlans.ts` | `3-180` | scenario mock route engine |
| `src/entities/station/mock/stations.ts` | `3-13` | station/domain mock source |
| `src/index.css` | `1-88` | global CSS boundary |
