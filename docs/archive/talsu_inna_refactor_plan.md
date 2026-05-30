# 탈수있나 FSD Refactor Execution Plan v1.0

> 목적: 현재 `data_insight` 구현을 `docs/talsu_inna_architecture_rules.md`의 FSD 규칙에 맞게 단계적으로 옮기는 실행 계획을 정의한다.
> 작성일: 2026-05-27
> 기준 문서: `docs/talsu_inna_fsd_current.md`, `docs/talsu_inna_architecture_rules.md`

## 1. 실행 원칙

| 원칙 | 내용 |
|---|---|
| build 우선 | 각 phase 종료마다 `npm run build`가 통과해야 다음 단계로 간다. |
| 동작 유지 | 리팩토링 중 현재 F0~F8 기능은 깨지면 안 된다. |
| page 얇게 유지 | 신규 page는 `pages/*/index.tsx`만 만들고 `ui/model/api/mock/styles` segment는 만들지 않는다. |
| 하드코딩 확산 금지 | 새 파일에는 token/config/schema/mock 위치 규칙을 적용한다. |
| 큰 이동 전 SSOT | 타입, key, token, mock 위치를 먼저 정한 뒤 UI를 이동한다. |

## 1-1. 현재 위치와 남은 턴

| 항목 | 현재 상태 |
|---|---|
| 현재 phase | `Phase 6. Persistence/API 정리` 완료, `Phase 7. QA와 회귀 방지` 진입 준비 |
| 마지막 검증 | `npm run lint`, `npm run build` 통과 |
| 마지막 원격 반영 | `14b2feb Extract map workspace widget` → `publish/main` |
| 마지막 로컬 커밋 | `fefac21 Add internal app router` |
| 현재 `App.tsx` | 50줄. `useAppController`가 state orchestration과 props assembly를 소유하고, `App.tsx`는 shell/router/overlay/chrome host만 담당한다. |
| 다음 진입 준비 | Phase 7에서 dev/API smoke, 수동 UI 회귀, 필요 시 Vercel preview smoke script를 추가한다. |

| 남은 턴 | 목표 | 완료 기준 |
|---|---|---|
| T1 | `ReportActionBar`, `ReportDetailPanel` 생성 | 완료 |
| T2 | `widgets/ai-chat-panel` 생성 | 완료. `AiChatLayer`로 result card/chat sheet를 이동 |
| T3 | AI chat model 정리 | 완료. suggested prompts, welcome message, chat input/loading/messages hook 이동 |
| T4 | `widgets/archive-calendar` 생성 | 완료. saved report 달력/목록/복원 UI가 App에서 제거 |
| T5 | `widgets/settings-form` 생성 | 완료. preferences form과 루틴 동기화 UI가 App에서 제거 |
| T6 | map workspace/page composition 정리 | 완료. `widgets/map-workspace`가 map tab의 search/report/detail composition을 소유 |
| T7 | `pages/*/index.tsx` 생성 | 완료. page는 widget prop forwarding만 수행, `pages/*/ui` 미생성 |
| T8 | `app/router` 및 host 정리 | 완료. 내부 `AppRouter`가 map/archive/settings page entry 선택을 담당 |
| T9 | entity store/http client/token 보강 | 완료. localStorage store, `/api/chat` client/schema, shared safe markdown 경계 추가 |

## 2. 우선순위

| 우선순위 | 대상 | 이유 |
|---|---|---|
| P0 | 타입 단일화, `App.tsx` 과밀 해소, AI/route/report domain 분리 | 이후 기능 추가 때 회귀 위험이 가장 크다. |
| P1 | localStorage 영속화, 지도 렌더링 안정화, 리포트 저장 규칙 테스트 | 데모 품질과 사용자 체감에 직접 영향. |
| P2 | 실제 공공데이터 adapter, 계정/DB 저장 | 외부 API 키/정책/백엔드 설계가 필요하다. |

## 3. Slice 전략 요약

| Slice | 목표 위치 | 내용 |
|---|---|---|
| S1. Types/Config SSOT | `entities/*/model`, `shared/config` | 타입 불일치 제거, key/token/z-index 중앙화 |
| S2. Shared foundation | `shared/ui`, `shared/styles`, `shared/api`, `shared/lib` | primitive UI, tokens, http client, util 구축 |
| S3. Entities | `entities/station`, `route-plan`, `report`, `user-preferences`, `chat-message` | 도메인 타입, mock, schema, pure logic 이동 |
| S4. Features | `features/*` | 사용자 액션별 hook/model/api/ui 이동 |
| S5. Widgets | `widgets/*` | 지도 패널, 리포트 시트, AI 챗, 아카이브, 설정 폼 조립 |
| S6. Pages/App | `pages/*/index.tsx`, `app/*` | 얇은 page와 app provider/router/layout 정리 |
| S7. Persistence/API | `entities/*/model/store`, `features/*/api` | localStorage, schema, fallback, query key 정리 |

## 4. Phase 0. 기준선 고정

| 작업 | 산출물 | 완료 기준 |
|---|---|---|
| 현재 build/lint 기록 | 작업 로그 | `npm run build` 성공 상태를 baseline으로 남긴다. |
| 기능 smoke 목록 확정 | F0~F8 QA 표 | 리팩토링 중 회귀 체크 기준을 고정한다. |
| import alias 정책 결정 | `tsconfig.json`, `vite.config.ts` | `@/` alias 사용 여부를 확정한다. |
| 의존성 결정 | `package.json` | React Query/zustand/zod 도입 여부를 확정한다. |

**현재 반영 상태**: `npm run lint`, `npm run build` 통과. React Query/zustand/zod는 아직 도입하지 않고, 현재 의존성 안에서 FSD public module과 localStorage hook을 먼저 적용했다.

## 5. Phase 1. 타입과 상수 SSOT

| 작업 | 이동 대상 | 완료 기준 |
|---|---|---|
| `MapLayerState` 불일치 제거 | `features/toggle-map-layer/model/types.ts` | `ai_peek` 포함 여부가 한 타입에서 결정된다. |
| `ReportType`, `SavedReport` 이동 | `entities/report/model/types.ts` | report 관련 타입이 `types.ts`에서 빠진다. |
| `RoutePlan` 이동 | `entities/route-plan/model/types.ts` | route 관련 타입이 UI와 분리된다. |
| `UserPreferences` 이동 | `entities/user-preferences/model/types.ts` | preference 타입과 default가 같은 entity로 모인다. |
| storage/query/route key 중앙화 | `shared/config/*` | 문자열 key를 page/widget에서 직접 쓰지 않는다. |
| z-index/layout token 중앙화 | `shared/config/z-index.ts`, `shared/styles/tokens.css` | `9999`, 임의 px, 반복 max-width를 제거하기 시작한다. |

**현재 반영 상태**: `entities/*/model/types.ts`, `features/toggle-map-layer/model/types.ts`, `shared/config/*` public module을 생성했고 `src/types.ts`는 호환 facade로 축소했다.

## 6. Phase 2. Shared 기반 구축

| 작업 | 대상 | 완료 기준 |
|---|---|---|
| `cn` 유틸 생성 | `shared/lib/cn.ts` | className join 반복 제거 가능 |
| primitive UI 생성 | `shared/ui/button`, `tabs`, `bottom-sheet`, `badge`, `toast` | App/page/widget에서 variant/size만 사용 |
| layout primitive 생성 | `shared/ui/layout`, `app/layouts` | `PageContainer`, `PanelSection`, `ScrollableArea`, `AppShell` 사용 가능 |
| 스타일 분리 | `shared/styles/tokens.css`, `globals.css`, `motion.css` | `index.css`가 import 허브에 가까워짐 |
| Toast store/host 추가 | `shared/model/toastStore.ts`, `shared/ui/toast` | toast 피드백이 공통화됨 |

**현재 반영 상태**: `shared/model/usePersistentState.ts`, `shared/config/storage-keys.ts`, `shared/config/query-keys.ts`, `shared/config/z-index.ts`, `shared/config/routes.ts`, `shared/lib/cn.ts`, `shared/ui/toast`, `shared/ui/page-container`, `app/layouts/AppShell.tsx`를 생성했다. Toast store, tokenized primitive UI, http client는 다음 작업으로 남아 있다.

## 7. Phase 3. Entity 추출

| Entity | 포함할 것 | 현재 출처 | 완료 기준 |
|---|---|---|---|
| `station` | station id/name/position/line/crowd, fixtures, helper | `InteractiveMap.tsx`, `data.ts` | 지도 데이터가 widget 밖 entity로 이동 |
| `route-plan` | `RoutePlan`, timeline, route generator input/output, mock scenarios | `types.ts`, `data.ts`, `App.tsx` | route generator가 UI와 무관한 순수 함수 |
| `report` | `ReportType`, saved report, summary/status factory | `types.ts`, `App.tsx`, `data.ts` | 저장/중복 규칙이 UI 밖으로 이동 |
| `user-preferences` | preference type, default, persistence schema | `types.ts`, `data.ts`, `App.tsx` | 설정 기본값이 entity에서 관리 |
| `chat-message` | message type, AI response schema, markdown contract | `types.ts`, `App.tsx`, `server.ts` | AI 응답 경계가 명시됨 |

**현재 반영 상태**: route-plan/report/user-preferences/chat-message/station entity 타입과 mock/default를 분리했고 `src/data.ts`는 호환 facade로 축소했다.

## 8. Phase 4. Feature 추출

| Feature | 책임 | 완료 기준 |
|---|---|---|
| `complete-onboarding` | 온보딩 step, preference 초기값 반영, 체험 시작 | 온보딩 완료 로직이 page/App에서 사라짐 |
| `select-station` | 출발/도착 선택, 지도 노드 context action | station 변경 이벤트가 독립 hook/action으로 이동 |
| `toggle-map-layer` | subway/bus/bike/crowd 토글, reset | 지도 레이어 상태가 widget 내부 하드코딩에서 빠짐 |
| `generate-route-plan` | route 계산/선택/프리셋 적용 | `getRoutePlans` 호출과 selectedPlan 유지 규칙이 hook으로 이동 |
| `save-report` | saved report 생성, 중복 판정, 삭제 | archive와 report sheet가 같은 저장 규칙 사용 |
| `send-ai-chat` | `/api/chat` 호출, fallback, AI 추천 반영 | AI fetch와 response mapping이 `App.tsx`에서 사라짐 |
| `sync-preferences` | 설정 저장, 루틴 동기화, localStorage 복원 | 설정 page가 form 배치만 담당 |

**현재 반영 상태**: `generate-route-plan` preset, preset carousel UI, `save-report` 생성/중복 규칙, `send-ai-chat` API/fallback/markdown, `toggle-map-layer` 타입을 feature로 분리했다. 추가로 `complete-onboarding` UI를 feature slice로 분리해 온보딩 overlay JSX와 `as any` 타입 캐스팅을 `App.tsx`에서 제거했다.

## 9. Phase 5. Widget/Page 재조립

| 단계 | 작업 | 완료 기준 | 상태 |
|---|---|---|---|
| 5-1 | `widgets/transit-map-panel` 생성 | 지도, 검색, 레이어, selected route 표시가 하나의 widget으로 묶임 | 완료 |
| 5-2 | `widgets/report-sheet` 생성 | 4종 리포트 탭과 CTA가 feature/entity를 조합 | 완료 |
| 5-3 | `widgets/ai-chat-panel` 생성 | 채팅 목록/입력/추천 질문이 send-ai-chat feature만 호출 | 1차 완료 |
| 5-4 | `widgets/archive-calendar` 생성 | saved report 목록과 날짜 필터가 report entity 사용 | 완료 |
| 5-5 | `widgets/settings-form` 생성 | preference entity와 sync-preferences feature만 사용 | 완료 |
| 5-6 | map workspace/page composition 정리 | map tab의 remaining JSX가 widget/page composition으로 이동 | 완료 |
| 5-7 | `pages/*/index.tsx` 생성 | page는 widget/feature 배치와 route 이동만 담당. `pages/*/ui` 금지 | 완료 |
| 5-8 | `app/router/AppRouter.tsx` 생성 | map/archive/settings route 연결 | 완료 |
| 5-9 | `app/App.tsx` 축소 | provider/router/layout/global host만 남김 | 완료 |

**현재 반영 상태**: `App.tsx`에서 프리셋, 저장 리포트 생성 규칙, AI fetch/fallback, markdown 렌더링, layer 타입/default를 분리했다. `InteractiveMap`을 `src/widgets/transit-map-panel/ui/InteractiveMap.tsx`로 이동하고 `src/widgets/transit-map-panel/index.ts` public API를 만들었다. 기존 `src/components/InteractiveMap.tsx`는 호환 re-export로 남겼다. `AppShell`, `PageContainer`, `cn` 기반도 추가했다. 이후 `ToastOverlay`, `TopAppBar`, `BottomNavigation`을 각각 `shared/ui/toast`, `widgets/top-app-bar`, `widgets/bottom-navigation`으로 분리했다. `complete-onboarding` feature와 `RoutePresetCarousel`도 분리했다. `widgets/report-sheet`에는 `ReportTypeTabs`, `RouteConditionCard`, `BoardingReportView`, `CarriageReportView`, `DeadlineReportView`, `ReportActionBar`, `ReportDetailPanel`을 추가했고, 역 목록 하드코딩은 `entities/station`의 `stationNames`로 대체했다. `widgets/ai-chat-panel/AiChatLayer`도 추가해 AI result card, chat sheet, 추천 질문 UI를 이동했다. 이 프로젝트의 현재 IA 구현에서는 AI를 하단 탭이 아니라 지도 컨텍스트 위에 뜨는 overlay로 인정한다. `features/send-ai-chat/model`에는 suggested prompts, initial messages, `useAiChatController`를 추가했다. `features/generate-route-plan/model/useRoutePlanner`가 route state와 route recalculation을 소유한다. `widgets/archive-calendar/ArchiveCalendar`도 추가해 archive tab 달력/목록/복원 UI를 이동했다. `widgets/settings-form/SettingsForm`도 추가해 settings tab과 station select 하드코딩을 이동했다. `widgets/map-workspace/MapWorkspace`도 추가해 map tab의 preset/search/report-detail composition을 이동했다. `pages/*/index.tsx`와 `app/router/AppRouter.tsx`를 추가해 tab body 선택을 내부 route boundary로 이동했다. `app/model/useAppController`가 page props assembly를 소유해 `App.tsx`는 50줄 host로 축소됐다.

**다음 단계 진입 준비**: Phase 5는 5-9까지 완료됐다. `pages/map-page`, `pages/archive-page`, `pages/settings-page`는 `index.tsx`만 가진 얇은 composition entry이고, `app/router/AppRouter.tsx`는 현재 `activeTab` 기반으로 page entry를 선택한다. `App.tsx`는 `AppShell`, global overlay, map background, router, AI overlay, bottom navigation host만 담당한다. 이 단계에서도 `pages/*/ui`는 만들지 않는다.

## 9-1. 현시점 감사

| 영역 | 판정 | 근거/조치 |
|---|---|---|
| dev routing | 구조는 정상, 런타임 검증은 부분 실패 | `server.ts`는 `/api/chat`을 Vite middleware보다 먼저 등록한다. 다만 현재 3000번 포트가 다른 프로세스로 점유되어 새 `npm run dev` 실행은 실패했다. |
| Vercel adapter | 정상 방향 | `api/chat.ts`와 `server.ts`가 같은 `createAiChatResponse`를 공유한다. |
| API client | 개선됨 | `shared/api/http-client.ts`와 `postJson`이 추가되어 `sendAiChat`의 raw fetch는 제거됐다. |
| mock 위치 | 절반 이상 적정 | station/route/report mock은 entity에 있다. route preset은 feature model에 있다. |
| 남은 UI mock | 일부 축소 | report-sheet의 버스 잔여석/recovery 거점·금액은 `entities/report/model/insights.ts`로, archive/settings 표시 config는 각 widget model로 이동했다. carriage 제목의 출발/도착역은 props 기반으로 교체됐다. 남은 mock은 실제 API/schema 연동 전 display fixture 성격이다. |
| 위험 지점 | markdown renderer | `shared/lib/markdown/renderSafeMarkdown.tsx`로 `dangerouslySetInnerHTML` 제거 완료. |

## 10. Phase 6. Persistence/API 정리

| 작업 | 대상 | 완료 기준 | 상태 |
|---|---|---|---|
| `httpClient` 추가 | `shared/api/http-client.ts` | timeout/error/fallback 계약이 한 곳에서 처리됨 | 완료 |
| AI request/response schema 추가 | `features/send-ai-chat/api/schema.ts` | 요청 400 처리와 응답 parse 경계 생성 | 완료 |
| Vercel Function 엔트리 추가 | `api/chat.ts`, `vercel.json` | Vercel에서 `/api/chat`이 Express 없이 실행됨 | 완료 |
| 서버 responder 공용화 | `features/send-ai-chat/server/chatResponder.ts` | 로컬 Express와 Vercel Function이 같은 Gemini/fallback 로직 사용 | 완료 |
| preferences localStorage | `entities/user-preferences/model/store.ts` | 새로고침 후 설정 유지 | 완료 |
| report localStorage | `entities/report/model/store.ts` | 새로고침 후 저장 리포트 유지 | 완료 |
| query key factory | `shared/config/query-keys.ts` | query key 중복 방지 | 완료 |
| markdown sanitizer | `shared/lib/markdown` | AI 응답 렌더링 보안 경계 생성 | 완료 |

**현재 반영 상태**: `entities/user-preferences/model/store.ts`와 `entities/report/model/store.ts`가 `usePersistentState`와 `STORAGE_KEYS`를 감싸며 preferences/savedReports localStorage persistence를 소유한다. `features/send-ai-chat/model/useAiChatController.ts`가 chat input/loading/messages와 `/api/chat` 응답 적용 경계를 소유한다. `features/generate-route-plan/model/useRoutePlanner.ts`가 route 후보 계산과 선택 유지 규칙을 소유한다. `shared/lib/markdown/renderSafeMarkdown.tsx`가 AI 응답 markdown을 React node로 안전하게 렌더링하며 `dangerouslySetInnerHTML`는 제거됐다. Phase 6 범위는 완료됐다.

**Vercel/API 반영 상태**: `api/chat.ts` Vercel Function과 `vercel.json`을 추가했고, `server.ts`와 Function이 `src/features/send-ai-chat/server/chatResponder.ts`를 공유하도록 분리했다. `features/send-ai-chat/api/schema.ts`로 request/response runtime validation을 추가해 잘못된 요청은 400, 서버/Gemini 실패는 500으로 분리했다. `shared/api/http-client.ts`를 추가하고 `sendAiChat`이 timeout/error/JSON-text parse 공통 경계를 통과하도록 변경했다. 자세한 환경 변수와 배포 책임은 `docs/talsu_inna_vercel_functions_env.md`에서 관리한다.

## 11. Phase 7. QA와 회귀 방지

| 체크 | 기준 |
|---|---|
| Build | 모든 phase 종료마다 `npm run build` 통과 |
| Dev | `npm run dev`로 `http://127.0.0.1:3000` 응답 확인 |
| Smoke F0 | 온보딩 완료, 비회원 진입 |
| Smoke F1~F3 | 프리셋 적용, 역 변경, 레이어 토글, 후보 선택 |
| Smoke F4~F6 | 리포트 탭, 리포트 저장, 아카이브 복원 |
| Smoke F5/F8 | AI 질문, 서버 fallback, 로컬 fallback |
| Smoke F7 | 설정 저장, 루틴 동기화 |
| 구조 검사 | `App.tsx` 150줄 이하 목표, page 파일 fetch/mock/schema/storage key 직접 선언 금지 |

## 11-1. 다음 작업 전 체크리스트

| 체크 | 현재 판단 |
|---|---|
| 워크트리 | `.gitignore`, `.env.local` 변경은 별도 로컬 변경으로 유지한다. Phase 6 변경과 분리한다. |
| 병렬 작업 충돌 | `.env.example`, `README.md`, `server.ts`, Vercel 코드 파일은 이미 원격 반영되었고 다음 UI refactor에서는 건드리지 않는다. |
| 다음 코드 터치 범위 | `src/app/**`, `src/features/*/model`, `src/entities/*/model/store`, `src/widgets/**`, `docs/*` |
| 검증 | Phase 7에서 `npm run lint`, `npm run build`, dev/API smoke, UI smoke를 반복한다. 1차 hardcoding cleanup 후 `npm run lint`, `npm run build` 통과. 2차로 `npm run smoke:phase7`을 추가해 App/page 구조, route/report contract, AI fallback contract를 자동 점검한다. dev server HTTP 200과 `/api/chat` fallback JSON은 curl smoke 통과. `agent-browser` CLI는 현재 PATH에 없어 브라우저 자동 검증은 미수행. |

## 12. 완료 정의

| 범주 | 완료 기준 |
|---|---|
| Current FSD | `docs/talsu_inna_fsd_current.md`의 기능 상태와 QA 표가 최신 코드와 일치 |
| Architecture rules | 신규 코드가 `docs/talsu_inna_architecture_rules.md`의 page/layer/hardcoding 규칙을 위반하지 않음 |
| Refactor plan | 각 phase별 산출물이 생성되고 build/smoke 기준을 통과 |
| 코드 구조 | `src/App.tsx`가 조립만 담당하고, 도메인/mock/API/schema가 slice로 이동 |
| 사용자 기능 | F0~F8 현재 기능이 리팩토링 후에도 유지 |
