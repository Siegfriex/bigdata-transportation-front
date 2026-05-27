# data_insight 현시점 context update raw report

조사 기준: 2026-05-27, branch `publish-initial-main`, commit `fefac21`.
이 보고서는 `docs/raw_inventory_network_cloud_routing_ux_2026-05-27.md` 작성 이후 현시점 worktree 기준 변경분을 반영한 raw inventory다.

## 1. 코드베이스 현황 요약

| 항목 | 값/설명 | 근거 파일 | 확실도 |
|---|---|---|---|
| git 상태 | tracked modified: `.gitignore`, `README.md`, `docs/talsu_inna_architecture_rules.md`, `docs/talsu_inna_fsd_current.md`, `docs/talsu_inna_refactor_plan.md`, `src/App.tsx`, 여러 index/render 파일 | `git status --short` | 높음 |
| 신규 app model | `src/app/model/useAppController.ts`, `src/app/model/index.ts` 추가 | `src/app/model/useAppController.ts:1-255`, `src/app/model/index.ts:1` | 높음 |
| 신규 entity store | `useSavedReportsStore`, `useUserPreferencesStore` 추가 | `src/entities/report/model/store.ts:1-8`, `src/entities/user-preferences/model/store.ts:1-8` | 높음 |
| 신규 feature hook | `useRoutePlanner`, `useAiChatController` 추가 | `src/features/generate-route-plan/model/useRoutePlanner.ts:1-85`, `src/features/send-ai-chat/model/useAiChatController.ts:1-92` | 높음 |
| 신규 shared markdown | `renderSafeMarkdown` 추가. 기존 `renderMarkdown`는 wrapper로 변경 | `src/shared/lib/markdown/renderSafeMarkdown.tsx:1-65`, `src/features/send-ai-chat/lib/renderMarkdown.tsx:1-6` | 높음 |
| App.tsx 축소 | `App.tsx`는 `useAppController()` 호출 후 shell/widget props spread 중심 | `src/App.tsx:11-47` | 높음 |
| 라우팅 방식 | 여전히 `react-router` 없음. `activeTab` 기반 `AppRouter` 유지 | `rg "react-router..."`, `src/app/router/AppRouter.tsx` | 높음 |
| API endpoint | 여전히 구현 endpoint는 `/api/chat` 중심 | `server.ts`, `api/chat.ts`, `src/features/send-ai-chat/api/sendAiChat.ts` | 높음 |

## 2. 기존 보고 대비 변경 요약

| 영역 | 이전 raw inventory 기준 | 현시점 기준 | 근거 |
|---|---|---|---|
| App 책임 | `App.tsx`가 state/handler/API orchestration/page props 대부분 직접 소유 | `App.tsx`는 shell composition. 상태/핸들러는 `useAppController`로 이동 | `src/App.tsx:11-47`, `src/app/model/useAppController.ts:16-255` |
| route planning | `App.tsx` 내부 `updateRoutePlans`, plans/selectedPlan/carDetails 상태 | `useRoutePlanner(preferences)`가 station/time/report/plans/car state와 route recalculation 소유 | `useRoutePlanner.ts:7-85` |
| chat state | `App.tsx` 내부 `chatInput/chatbotLoading/chatMessages/chatEndRef/handleSendMessage` | `useAiChatController`가 chat state, scroll, send/fallback timing 소유. app model이 response 적용 callback 소유 | `useAiChatController.ts:22-92`, `useAppController.ts:54-99` |
| persistence | `App.tsx`에서 `usePersistentState(STORAGE_KEYS.*, ...)` 직접 호출 | entity store hook으로 감싼 뒤 app model에서 호출 | `report/model/store.ts:6-8`, `user-preferences/model/store.ts:6-8`, `useAppController.ts:25-26` |
| markdown rendering | `features/send-ai-chat/lib/renderMarkdown.tsx` 내부 regex + `dangerouslySetInnerHTML` | `shared/lib/markdown/renderSafeMarkdown.tsx`가 ReactNode 생성. `dangerouslySetInnerHTML` grep 결과 없음 | `renderSafeMarkdown.tsx:35-65`, `renderMarkdown.tsx:4-6` |
| public API | feature/entity index에 hook/store export 추가 | `useRoutePlanner`, `useAiChatController`, `useSavedReportsStore`, `useUserPreferencesStore` export | `features/generate-route-plan/index.ts:3`, `features/send-ai-chat/index.ts:7`, `entities/report/index.ts:3`, `entities/user-preferences/index.ts:3` |

## 3. 현재 전역 책임 인벤토리 업데이트

| 책임 항목 | 현재 소유 파일 | 세부 상태/함수/상수 | FSD 후보/현재 레이어 | 근거 파일 |
|---|---|---|---|---|
| shell composition | `src/App.tsx` | `AppShell`, `ToastOverlay`, phone chassis, notch, map slot, `TopAppBar`, `AppRouter`, `AiChatLayer`, `BottomNavigation` | app | `src/App.tsx:14-45` |
| top-level controller | `src/app/model/useAppController.ts` | app 전체 props assembly, onboarding/nav/map/chat/report/archive/settings handlers | app model 후보 | `useAppController.ts:16-255` |
| onboarding state | `src/app/model/useAppController.ts` | `showOnboarding`, `onboardingStep`, `user`, `onboardingOverlayProps` | app/feature 경계 후보 | `useAppController.ts:17-22`, `:124-144` |
| tab navigation | `src/app/model/useAppController.ts`, `src/app/router/AppRouter.tsx` | `activeTab`, `setActiveTab`, `routerProps`, bottom nav tab change | app/router | `useAppController.ts:23`, `:158-219`, `:245-253` |
| overlay/map layer | `src/app/model/useAppController.ts`, `features/toggle-map-layer` | `mapLayer`, `setMapLayer`, `visibleLayers`, `handleToggleLayer`, `DEFAULT_VISIBLE_LAYERS` | feature/app shared boundary 후보 | `useAppController.ts:24`, `:28`, `:39-41` |
| route planning state | `src/features/generate-route-plan/model/useRoutePlanner.ts` | `startStation`, `endStation`, `deadlineTime`, `selectedReportType`, `plans`, `selectedPlan`, `activeCarNo`, `carDetails` | feature 후보, entity data 의존 | `useRoutePlanner.ts:7-15` |
| route recalculation | `src/features/generate-route-plan/model/useRoutePlanner.ts` | `getPlansForStations`, `updateRoutePlans`, auto report type by `startStation` | feature 후보 | `useRoutePlanner.ts:17-48` |
| carriage data load | `src/features/generate-route-plan/model/useRoutePlanner.ts` | `setCarDetails(getCarSurvivalDetails("9호선"))` | feature/entity 경계 후보 | `useRoutePlanner.ts:50-52` |
| user preference persistence | `src/entities/user-preferences/model/store.ts` | `useUserPreferencesStore() -> usePersistentState(STORAGE_KEYS.preferences, getDefaultPreferences())` | entity store 후보 | `user-preferences/model/store.ts:1-8` |
| saved report persistence | `src/entities/report/model/store.ts` | `useSavedReportsStore() -> usePersistentState(STORAGE_KEYS.savedReports, getSavedReportsMock())` | entity store 후보 | `report/model/store.ts:1-8` |
| save report orchestration | `src/app/model/useAppController.ts`, `features/save-report` | `handleSaveReport`, `isDuplicateSavedReport`, `createSavedReport`, `setSavedReports` | app orchestration + feature logic | `useAppController.ts:101-122` |
| AI chat state | `src/features/send-ai-chat/model/useAiChatController.ts` | `chatInput`, `chatbotLoading`, `chatMessages`, `chatEndRef`, `sendMessage` | feature model 후보 | `useAiChatController.ts:22-92` |
| AI response application | `src/app/model/useAppController.ts` | `applyAiResponse`, `applyFallbackResponse`, route/report/map mutation | app orchestration 후보 | `useAppController.ts:54-83` |
| toast state | `src/app/model/useAppController.ts`, `shared/ui/toast` | `toastMessage`, `showToast`, `setTimeout(...2500)` | app/shared boundary 후보 | `useAppController.ts:30-37`, `ToastOverlay.tsx` |
| markdown rendering | `src/shared/lib/markdown/renderSafeMarkdown.tsx` | `renderInline`, `renderLines`, `renderSafeMarkdown` | shared lib 후보 | `renderSafeMarkdown.tsx:3-65` |

## 4. App.tsx 현시점 집중 책임

| 책임 | 현재 세부 내용 | 근거 |
|---|---|---|
| root controller 호출 | `const app = useAppController();` | `src/App.tsx:11-12` |
| outer shell | `<AppShell>`와 phone chassis class 유지 | `src/App.tsx:14-19` |
| overlay/widget composition | `ToastOverlay`, `OnboardingOverlay`, `InteractiveMap`, `TopAppBar`, `AppRouter`, `AiChatLayer`, `BottomNavigation` 배치 | `src/App.tsx:16-42` |
| z-index/layout literal 유지 | `z-40`, `z-0`, `z-10`, `max-w-[412px]`, `md:h-[844px]`, `pt-[52px]`, `pb-[64px]` | `src/App.tsx:19-37` |
| 상태 직접 소유 감소 | `useState`, `useEffect`, `useCallback`, domain imports 제거. 직접 state 없음 | `src/App.tsx:1-9`, `:11-47` |

## 5. routing/app shell 업데이트

| 항목 | 현재 방식 | 코드 근거 | 특징 |
|---|---|---|---|
| route library | `react-router` 미사용 | grep 결과 없음 | 이전과 동일 |
| route selector | `activeTab`은 `useAppController` 내부 state | `useAppController.ts:23` | `App.tsx`에서 제거됨 |
| router props | `routerProps` 객체로 `AppRouter`에 전달 | `useAppController.ts:158-219`, `App.tsx:37-39` | app model이 page props composition 소유 |
| pages | `MapPage`, `ArchivePage`, `SettingsPage` pass-through 구조 유지 | `src/pages/*/index.tsx` | 이전과 동일 |
| app shell | visual shell은 여전히 `App.tsx`; outer background는 `AppShell` | `App.tsx:14-45`, `AppShell.tsx` | shell 책임은 아직 두 곳 |

## 6. feature/entity 후보 업데이트

### entity 후보

| 엔티티명 | 현시점 관련 타입/상태/데이터 | 현재 위치 | 분리 상태/필요성 | 근거 |
|---|---|---|---|---|
| UserPreferences | 타입/default/store 모두 entity에 존재 | `entities/user-preferences/model/{types,defaults,store}.ts` | store hook까지 entity로 이동 완료 후보 | `user-preferences/index.ts:1-3` |
| SavedReport/ReportType | 타입/mock/store entity, 생성/중복은 feature | `entities/report/*`, `features/save-report` | persistence store는 entity, command는 feature로 분리됨 | `report/index.ts:1-3`, `createSavedReport.ts` |
| RoutePlan | 타입/mock route engine entity, hook은 feature | `entities/route-plan/*`, `features/generate-route-plan/model/useRoutePlanner.ts` | route state orchestration은 feature hook | `route-plan/index.ts`, `useRoutePlanner.ts` |
| ChatMessage/AiChatResponse | 타입 entity, controller/API는 feature | `entities/chat-message/*`, `features/send-ai-chat/*` | 타입과 feature logic 분리 유지 | `chat-message/model/types.ts`, `useAiChatController.ts` |
| Station | 타입/mock entity, UI는 widgets | `entities/station/*`, `RouteConditionCard`, `SettingsForm`, map | 이전과 동일 | `station/index.ts`, `stations.ts` |

### feature 후보

| feature명 | 현재 트리거/UI | 현재 로직 위치 | 관련 상태 | 근거 |
|---|---|---|---|---|
| generate-route-plan | preset carousel, route condition changes, AI response | `useRoutePlanner`, `routePresets`, route mock engine | route/station/report plan/car state | `useRoutePlanner.ts:7-85` |
| send-ai-chat | AI layer prompt/input/send, report AI briefing | `useAiChatController`, `sendAiChat`, server responder, fallback | chat state + app callbacks | `useAiChatController.ts:36-82`, `useAppController.ts:95-99` |
| save-report | report action bar, AI result save | `handleSaveReport` in app model + `createSavedReport`/`isDuplicateSavedReport` in feature | savedReports persistence | `useAppController.ts:101-122`, `createSavedReport.ts` |
| toggle-map-layer | map layer buttons | app model `visibleLayers`, map local tooltip | `visibleLayers`, `legendTooltip` | `useAppController.ts:28`, `:39-41`, `InteractiveMap.tsx` |
| complete-onboarding | onboarding overlay | app model owns state, feature owns UI | user/preferences/onboarding step | `useAppController.ts:124-144`, `OnboardingOverlay.tsx` |

## 7. 하드코딩/전역 규칙 업데이트

| 종류 | 현시점 발견 위치 | 예시 | 근거 파일 |
|---|---|---|---|
| storage key 직접 사용 | entity store가 `STORAGE_KEYS.*` 사용, localStorage 접근은 shared hook 내부 | `STORAGE_KEYS.savedReports`, `STORAGE_KEYS.preferences` | `report/model/store.ts:7`, `user-preferences/model/store.ts:7`, `usePersistentState.ts` |
| query key | config 존재, 실사용 검색 결과 없음 | `queryKeys.routePlans`, `queryKeys.aiChat`, `queryKeys.stationContext` | `shared/config/query-keys.ts` |
| endpoint | 동일하게 `/api/chat` | `postJson("/api/chat", input)` | `sendAiChat.ts:17` |
| z-index literal | 여전히 JSX에 직접 사용 | `z-40`, `z-0`, `z-10`, `z-[100]`, `z-20`, `z-30` | `App.tsx`, `ToastOverlay.tsx`, widgets |
| color/spacing magic | 여전히 다수 존재, 일부 신규 shared markdown에도 색상 literal | `text-[#0A84FF]`, `text-[#E3E5DD]`, `px-1 py-0.5` | `renderSafeMarkdown.tsx:10-17`, grep color 결과 |
| markdown HTML injection | 현시점 grep에서 `dangerouslySetInnerHTML` 없음 | `renderMarkdown` -> `renderSafeMarkdown` | `features/send-ai-chat/lib/renderMarkdown.tsx:1-6`, `shared/lib/markdown/renderSafeMarkdown.tsx` |
| duplicate facade | root `src/types.ts`, `src/data.ts`는 유지 | re-export facade | `src/types.ts`, `src/data.ts` |
| public API | 신규 hooks/stores가 index에서 export됨 | `useRoutePlanner`, `useAiChatController`, entity stores | 각 `index.ts` |

## 8. 네트워크/클라우드 현시점

| 항목 | 현시점 값/설명 | 근거 | 확실도 |
|---|---|---|---|
| client API | `useAiChatController` -> `sendAiChat` -> `postJson("/api/chat", input)` | `useAiChatController.ts:52-55`, `sendAiChat.ts:16-18` | 높음 |
| shared HTTP | `requestJson` fetch 공통 처리 유지 | `shared/api/http-client.ts` | 높음 |
| server API | Express `/api/chat`, Vercel `api/chat.ts` 유지 | `server.ts`, `api/chat.ts` | 높음 |
| schema | 직접 validation 유지, zod 없음 | `features/send-ai-chat/api/schema.ts`, grep `zod` | 높음 |
| markdown safety | HTML 문자열 삽입 방식 제거됨 | grep `dangerouslySetInnerHTML` 결과 없음 | 높음 |
| package/cloud config | 이번 재조사에서 package/vercel/vite 변경 여부는 직접 diff 미확인. 이전 보고 기준 유지 필요 | `package.json`, `vite.config.ts`, `vercel.json` | 중간 |

## 9. UX / 플로팅 / 시나리오 현시점

| 항목 | 현시점 값/설명 | 근거 |
|---|---|---|
| mobile shell | visual structure 유지 | `App.tsx:14-45` |
| map always mounted | `InteractiveMap {...app.transitMapProps}`가 absolute z-0에 유지 | `App.tsx:29-32` |
| AI layer | props는 app controller에서 조립, UI 컴포넌트는 기존 구조 유지 | `App.tsx:41`, `useAppController.ts:220-244`, `AiChatLayer.tsx` |
| report/detail flow | `MapWorkspace`와 report sheet 유지 | `MapWorkspace.tsx` |
| scenario route state | `useRoutePlanner`가 preset/station/preferences 기반 route update 담당 | `useRoutePlanner.ts:26-59` |
| archive/settings flow | props assembly가 `useAppController`로 이동 | `useAppController.ts:193-218` |

## 10. 핵심 grep/find 결과

```text
find src -maxdepth 5 -type f | sort
src/app/model/index.ts
src/app/model/useAppController.ts
src/entities/report/model/store.ts
src/entities/user-preferences/model/store.ts
src/features/generate-route-plan/model/useRoutePlanner.ts
src/features/send-ai-chat/model/useAiChatController.ts
src/shared/lib/markdown/index.ts
src/shared/lib/markdown/renderSafeMarkdown.tsx
...
```

```text
rg "react-router|BrowserRouter|Routes|Route|useNavigate|useLocation" src package.json
# react-router 관련 사용 없음
```

```text
rg "localStorage|queryKey|queryKeys|storage|zod|schema|dangerouslySetInnerHTML|marked|sanitize|markdown" src server.ts api package.json
src/shared/model/usePersistentState.ts: window.localStorage.getItem/setItem
src/shared/config/query-keys.ts: export const queryKeys
src/features/send-ai-chat/lib/renderMarkdown.tsx: import { renderSafeMarkdown } from "../../../shared/lib/markdown";
```

## 11. 상위 분석 에이전트 주의사항

### 확실한 사실

| 사실 | 근거 |
|---|---|
| `App.tsx` 책임은 크게 줄었고 `useAppController`가 전역 orchestration 중심이 됐다. | `App.tsx:11-47`, `useAppController.ts:16-255` |
| route planning 상태/효과는 `useRoutePlanner`로 이동했다. | `useRoutePlanner.ts:7-85` |
| AI chat 상태/전송 로직은 `useAiChatController`로 이동했다. | `useAiChatController.ts:22-92` |
| preferences/reports persistence는 entity store hook으로 감쌌다. | `report/model/store.ts`, `user-preferences/model/store.ts` |
| `dangerouslySetInnerHTML` 사용은 현 grep 기준 제거됐다. | grep 결과, `renderSafeMarkdown.tsx` |
| routing은 여전히 URL path가 아니라 tab state다. | `useAppController.ts:23`, `AppRouter.tsx` |

### 추정이 필요한 항목

| 항목 | 이유 |
|---|---|
| `useAppController`가 app layer에 남는 것이 목표 구조인지 임시 중간 단계인지 | docs도 동시에 modified 상태라 최종 의도 확인 필요 |
| `useRoutePlanner`가 feature에 위치하는 것이 최종인지 entity route-plan model로 내려갈지 | route calculation + UI state + report type 자동 선택이 섞여 있음 |
| entity store hook이 entity layer 규칙에 맞는지 | `usePersistentState`와 storage key를 entity가 직접 import |
| markdown shared lib의 색상/Tailwind literal 허용 여부 | shared lib가 app-specific color class 보유 |

### 추가로 확인할 파일

| 파일/명령 | 목적 |
|---|---|
| `git diff -- src/App.tsx src/app/model src/features src/entities src/shared/lib/markdown` | 정확한 변경 의도와 이전 대비 diff 확인 |
| `docs/talsu_inna_architecture_rules.md` | 현재 수정된 규칙과 신규 hook/store 위치의 일치 여부 |
| `docs/talsu_inna_fsd_current.md` | current FSD 문서가 신규 구조를 반영했는지 확인 |
| `npm run lint` | 신규 hook 의존성/타입/미사용 import 확인 |
| `/api/chat` smoke | controller 분리 후 AI flow 동작 확인 |

