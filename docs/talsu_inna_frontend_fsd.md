# 탈수있나 Frontend FSD

> 목적: 현재 React 프론트엔드 구현을 기준으로 FSD 레이어, 화면, 상태, mock/API 전환 지점, QA 기준, 다음 작업 순서를 한 문서에서 이어갈 수 있게 고정한다.
> SSOT: `docs/deep-research-report.md`
> 기준: 2026-05-31 `qa-policy` 브랜치 로컬 코드. `docs/archive/talsu_inna_fsd_current.md`, `docs/archive/talsu_inna_architecture_rules.md`, `docs/archive/talsu_inna_refactor_plan.md`의 살아있는 내용을 통합했다.

## 1. 현재 기능 범위

현재 앱은 React 19 + Vite 6 + Tailwind v4 기반 모바일 웹 SPA다. 실제 교통/계정/DB 연동은 없고, `/api/chat`만 서버 경계를 가진다. 지도는 Google Maps JavaScript API 키가 있으면 Google renderer를 사용하고, 키가 없거나 로드 실패 시 SVG fallback으로 동작한다. 경로, 리포트, 기록, 설정은 frontend mock/entity/localStorage 상태에서 동작한다.

| 기능 | 현재 상태 | 기준 코드 |
|---|---|---|
| 앱 셸/온보딩 | 구현됨. 온보딩 완료/비회원 진입은 memory state | `src/App.tsx`, `src/features/complete-onboarding` |
| 하단 탭 | 구현됨. `map`, `archive`, `settings` 3개 | `src/shared/config/routes.ts`, `src/widgets/bottom-navigation` |
| 지도 | Google Maps JS renderer + SVG fallback. local station lat/lng 기반 marker, route polyline, 역 선택, 레이어 토글, bounds fit | `src/widgets/transit-map-panel` |
| 경로 후보 | mock planner 기반 2~3개 후보 생성 | `src/entities/route-plan/mock/routePlans.ts`, `src/features/generate-route-plan` |
| 리포트 | full strategic report 중심. 4대 summary metric, decision banner, evidence toggle, 전략 후보 carousel, sticky action bar | `src/widgets/report-sheet` |
| AI chat | 하단 탭이 아니라 현재 전략 근거 설명 overlay. raw id/enum 노출 금지, skeleton/retry/fallback | `src/widgets/ai-chat-panel`, `src/features/send-ai-chat` |
| 기록 | savedReports localStorage 기반 | `src/entities/report/model/store.ts` |
| 설정 | preferences localStorage 기반 | `src/entities/user-preferences/model/store.ts` |
| 서버 API | `POST /api/chat`만 구현 | `server.ts`, `api/chat.ts` |
| 지도 환경변수 | browser key 기반 Google Maps JS 선택 렌더링. 키 없음/로드 실패 시 SVG fallback | `.env.example`, `src/widgets/transit-map-panel/model/googleMapsLoader.ts` |

## 2. FSD 레이어 구조

| 레이어 | 현재 책임 | 금지 |
|---|---|---|
| `app` | shell, 내부 router, app-level orchestration, page props assembly | 지도 SVG, schema parsing, mock 배열 생성 |
| `pages` | `index.tsx`만 두고 widget props forwarding | `ui/model/api/mock/styles` segment 생성 |
| `widgets` | 화면 블록 조립. 지도, AI layer, archive, settings, report sheet | endpoint 직접 호출, storage key 직접 사용 |
| `features` | 사용자 행동. route preset, route planner, save report, send chat, onboarding | 다른 feature 내부 import |
| `entities` | station, route-plan, report, user-preferences, chat-message 타입/mock/store | React page layout |
| `shared` | http client, storage/query key, markdown renderer, persistent hook, shared UI/config | 제품 도메인 타입 |

현재 `src/App.tsx`는 host 역할이고, 상태 조립은 `src/app/model/useAppController.ts`가 담당한다. `src/app/router/AppRouter.tsx`는 URL router가 아니라 `activeTab` 기반 내부 route boundary다. `widgets/transit-map-panel`은 public entry에서 `InteractiveMap`을 내보내고, 내부에서 `GoogleTransitMap`과 `SvgTransitMapFallback`을 환경/로드 상태에 따라 선택한다.

## 3. 현재 화면/상태

| 상태 | 현재 소유자 | 지속성 |
|---|---|---|
| `showOnboarding`, `onboardingStep`, `user` | `useAppController` | memory |
| `activeTab` | `useAppController`, `AppRouter` | memory |
| `mapLayer` | `useAppController`, `AiChatLayer`, `MapWorkspace` | memory |
| `aiReturnLayer` | `mapDecisionReducer` | memory |
| `startStation`, `endStation`, `plans`, `selectedPlan` | `useRoutePlanner` | memory |
| `selectedReportType`, `deadlineTime`, `activeCarNo` | `useRoutePlanner` | memory |
| `restoredReport` | `useAppController` | memory |
| `preferences` | `useUserPreferencesStore` | `localStorage` |
| `savedReports` | `useSavedReportsStore` | `localStorage` |
| `chatMessages`, `chatInput`, `chatbotLoading` | `useAiChatController` | memory |
| `visibleLayers` | `useAppController` | memory |
| `googleMapFailed` | `InteractiveMap` | memory |

`MapLayerState`의 현재 값은 `default | report_detail | ai_overlay | ai_peek`다. `ai_result`, `report_mini`, `report_summary`, `evidence`, `map_peek`는 현재 코드 기준 상태가 아니다.

`mapDecisionReducer`는 탭 전환, report open/close, AI evidence open/close를 한 곳에서 처리한다. AI evidence overlay는 `aiReturnLayer`를 유지해 닫을 때 `report_detail` 또는 `default`로 되돌아간다.

## 4. Mock/API 전환 지점

| 현재 mock/local | 실제 전환 후보 | 전환 규칙 |
|---|---|---|
| `entities/station/mock/stations.ts` | Spring Boot station/area API 또는 map provider adapter | UI는 raw API를 직접 읽지 않고 entity adapter를 통과 |
| `entities/route-plan/mock/routePlans.ts` | Spring Boot route-plan API + FastAPI decision score | 현재 `RoutePlan` view contract를 먼저 보존 |
| `entities/report/mock/savedReports.ts` | Spring Boot saved report archive | `SavedReport` UI model은 `saved_reports` immutable snapshot의 card/detail view로 adapter한다. |
| `features/send-ai-chat/server/chatResponder.ts` heuristic fallback | FastAPI Decision API 또는 LLM orchestration | `/api/chat`은 `/api/v1/decision/chat` 전환 전 legacy alias로만 유지 |
| `GoogleTransitMap`의 Google Maps JS renderer | Spring Boot map/provider adapter 또는 server-side route geometry | browser key는 Maps JS 렌더링용으로만 사용한다. Places/Routes/Distance 같은 provider API는 FE가 직접 호출하지 않는다. |
| `SvgTransitMapFallback` | Google Maps 로드 실패/키 미설정 fallback | fallback은 P0 데모 경로로 유지하되, 운영 기준 데이터는 provider/API adapter에서 만든 view model로 통일한다. |
| widget 내부 리포트 문구/수치 | entity fixture 또는 API evidence | 다음 FE 작업에서 widget 하드코딩 축소 |

## 5. QA 기준

| 범위 | 체크 |
|---|---|
| 구조 | `pages/*/index.tsx`만 유지, page에서 fetch/mock/schema/storage key 직접 선언 금지 |
| 빌드 | `npm run lint`, `npm run build` 통과 |
| API | `POST /api/chat` 200 fallback/Gemini 응답, invalid body 400 |
| 지도 | Google Maps key 없음 또는 load error 시 SVG fallback, key 있음 시 `google-transit-map` 렌더링과 station marker/select/polyline/bounds fit 확인 |
| UI smoke | 온보딩, 탭 전환, 역 변경, 레이어 토글, 프리셋, 리포트 탭, 저장, 아카이브 복원, 설정 저장, AI overlay |
| 보안 | AI markdown은 `renderSafeMarkdown` 경유. `dangerouslySetInnerHTML` 사용 금지 |
| v2/v3 QA | `npm run e2e` 기준 full report happy path와 AI failure/raw id/snapshot/접근성 deep QA 통과 |

## 5-1. Target Feature Acceptance Criteria

| 기능 | Trigger | Target API | Acceptance Criteria |
|---|---|---|---|
| Station Search | 출발/도착 검색 또는 select | `GET /api/v1/stations/search` | FE는 Spring Boot만 호출하고, station DTO를 FE view model로 adapter한다. |
| Route Preview | 출발/도착/선호/마감 시간 변경 | `POST /api/v1/route-plans` | 서버는 `routePlanId`와 options를 만들고, FE는 route 후보와 selectedPlan을 갱신한다. saved report는 생성하지 않는다. |
| Decision Preview | 리포트 상세 진입 또는 report type 변경 | `POST /api/v1/decision/route-report` | 서버는 `decisionReportId`와 model/evidence를 만들고, FE는 판단 결과를 표시한다. saved report는 생성하지 않는다. |
| Decision Chat | AI overlay 메시지 전송 | `POST /api/v1/decision/chat` | chat은 지도 컨텍스트 overlay에서만 열리고, structured explanation을 렌더링한다. |
| Report Save | 저장 버튼 | `POST /api/v1/reports` | 저장 시 route/provider/decision/model/evidence snapshot이 함께 생성된다. |
| Archive Restore | 저장 리포트 선택 | `GET /api/v1/reports/{savedReportId}` | 저장 snapshot 기준으로 지도/리포트 상태를 복원한다. |
| Preferences Edit | 설정 변경 | `PUT /api/v1/preferences` | P0 guest는 localStorage, P1 auth 이후 서버 sync를 수행한다. |

## 5-2. Feature I-P-O-E

| Feature | Input | Process | Output | Error/Fallback |
|---|---|---|---|---|
| Station Search | query, selected station | Spring station search -> FE adapter. 현재는 local station mock의 name/lat/lng/x/y를 사용 | station option list | empty result, local station mock fallback |
| Route Preview | origin, destination, deadline, preferences | Spring route orchestration and route option persistence | routePlanId, route candidates | dynamic mock route fallback |
| Decision Preview | routePlanId, selectedOptionId, report type, context | Spring -> FastAPI decision then decision report persistence | decisionReportId, probabilities, evidence, report recommendation | public baseline/mock fallback |
| Decision Chat | user message, current route/report/snapshot context | Spring -> FastAPI/LLM explanation | structured chat response with human labels | current `/api/chat` heuristic/client fallback |
| Report Save | selected preview + decision | Spring validates and persists snapshot | saved report id/detail | duplicate save warning |
| Archive Restore | saved report id | fetch snapshot and hydrate page state | map/report state restored | report not found -> archive refresh |
| Preference Edit | form values | local update, P1 server sync | stored preferences | localStorage fallback |

## 5-3. Current Strategic Report UX Contract

| 영역 | 현재 기준 |
|---|---|
| Entry | 경로 후보/프리셋 카드 선택 시 full strategic report가 열린다. |
| Summary | 첫 화면에 마감도착, 탑승가능성, 추천칸/생존칸, 복구전략 4대 metric이 보인다. |
| Decision banner | `decision-banner`가 현재 경로 판단과 예상 도착을 먼저 요약한다. |
| Evidence | `evidence-toggle-button`이 `evidence-detail-section`을 expand/collapse하고 evidence item label/value/detail을 표시한다. |
| Strategy carousel | pointer drag/click threshold와 boundary swipe를 e2e로 검증한다. |
| Action bar | `report-action-bar`는 sticky/safe-area/44px target으로 저장과 AI 질문을 유지한다. |
| AI evidence | `ai-chat-overlay`는 현재 전략 또는 saved snapshot context를 설명하고 raw id/enum을 숨긴다. |
| Archive restore | `selectedPlanSnapshot`, `selectedStrategyId`, `snapshotLabel`을 사용해 저장 당시 상태를 hydrate한다. |

## 6. 다음 프론트 작업 순서

1. Phase 7 QA: `npm run lint`, `npm run build`, `npm run smoke:phase7`, `npm run e2e`를 release gate로 고정한다.
2. Google Maps key 유무별 smoke를 분리한다. key 없음은 SVG fallback, key 있음은 `google-transit-map`과 marker/polyline 상호작용을 검증한다.
3. `GoogleTransitMap`의 InfoWindow HTML 문자열 생성은 station/provider 데이터가 외부 입력으로 바뀌기 전에 escaping 또는 React-rendered DOM 생성으로 바꾼다.
4. `showOnboarding`은 이미 선언된 `STORAGE_KEYS.onboarding`을 실제로 사용해 최초 진입 UX를 persistence한다.
5. widget 내부 하드코딩 mock을 entity/feature fixture로 이동한다.
6. FE network target은 Spring Boot Core API로 고정한다. Browser에서 FastAPI 또는 외부 교통 provider REST API를 직접 호출하지 않는다.
7. 실제 API 전환 전 `talsu_inna_api_contract.md`, `talsu_inna_api_endpoints.md`의 `/api/v1` request/response를 백엔드와 합의한다.
8. React Query/Zod 도입 여부를 결정한 뒤 query key와 runtime schema 위치를 확장한다.

## 6-1. 심층 리서치 반영 결정

| 항목 | 결정 |
|---|---|
| 하단 IA | `map / archive / settings` activeTab 구조를 유지한다. URL router는 deep-link 요구가 생길 때 도입한다. |
| AI chat | 독립 탭이 아니라 지도 컨텍스트 overlay로 유지한다. |
| 지도 렌더링 | Google Maps JS는 browser renderer로만 허용한다. 교통 판단/경로 생성/provider REST 호출은 Spring Boot 경계 뒤로 둔다. |
| 공개 API 호출 | FE는 Spring Boot Core API만 호출한다. FastAPI는 internal Decision API로 숨긴다. |
| preview/save | route plan과 decision report는 서버 resource지만 archive가 아니다. 저장 버튼을 누른 saved report만 immutable snapshot archive다. |
| legacy `/api/chat` | `/api/v1/decision/chat` 전환 전까지 임시 alias로만 본다. |

## 7. 상태 표시

| 구분 | 표시 |
|---|---|
| 현재 코드와 동기화됨 | FSD 레이어, 현재 기능 범위, 상태 소유자, narrowed mapLayer, Google Maps JS + SVG fallback, full strategic report, `/api/chat`, localStorage store, v3 QA |
| 계획성 | 실제 교통 API/provider adapter, URL routing, React Query/Zod, 공통 UI primitive 확대 |
| 미확정 | 인증 도입 시점, Google Maps key 운영 정책의 배포 환경별 세부값, 시각 회귀 CI gate |
