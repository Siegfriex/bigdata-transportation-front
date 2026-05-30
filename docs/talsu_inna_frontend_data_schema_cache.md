# 탈수있나 Frontend Data Schema Cache

> 목적: 현재 프론트 기준 데이터 모델, localStorage, schema validation, mock fixture, cache/query key, markdown 경계를 정리한다.
> SSOT: `docs/deep-research-report.md`

## 1. LocalStorage Keys

| key 상수 | 실제 문자열 | 현재 사용 |
|---|---|---|
| `STORAGE_KEYS.preferences` | `talsu.preferences.v1` | `useUserPreferencesStore` |
| `STORAGE_KEYS.savedReports` | `talsu.savedReports.v1` | `useSavedReportsStore` |
| `STORAGE_KEYS.onboarding` | `talsu.onboarding.v1` | 선언됨. 현재 미사용 |

`usePersistentState`는 JSON parse 실패나 storage 접근 실패 시 initial value로 fallback한다. runtime schema 검증은 아직 없다.

## 2. Entity Store

| store | 위치 | 초기값 | 지속성 |
|---|---|---|---|
| user preferences | `src/entities/user-preferences/model/store.ts` | `getDefaultPreferences()` | localStorage |
| saved reports | `src/entities/report/model/store.ts` | `getSavedReportsMock()` | localStorage |

## 3. 현재 Schema 위치

| schema/validator | 위치 | 역할 |
|---|---|---|
| AI request validator | `src/features/send-ai-chat/api/schema.ts` | `/api/chat` body validation |
| AI response validator | `src/features/send-ai-chat/api/schema.ts` | server/client response validation |
| TypeScript entity types | `src/entities/*/model/types.ts` | compile-time view contract |

현재 Zod는 도입되어 있지 않고, `schema.ts`는 수동 validator다.

## 4. Query Key / Cache 정책

| key factory | 현재 상태 | 계획 |
|---|---|---|
| `queryKeys.routePlans(params)` | 선언됨, React Query 미도입 | route-plan API 전환 시 사용 |
| `queryKeys.aiChat(sessionId)` | 선언됨, React Query 미도입 | chat session persistence/cache 도입 시 사용 |
| `queryKeys.stationContext(stationName)` | 선언됨, React Query 미도입 | station/live context API 전환 시 사용 |

현재 서버 상태 cache는 없다. 프론트 local state + localStorage가 전부다.

## 5. Mock Fixture 위치

| domain | 위치 | 내용 |
|---|---|---|
| station | `src/entities/station/mock/stations.ts` | 역/지역 노드, SVG 좌표, crowd/bike/bus mock |
| route-plan | `src/entities/route-plan/mock/routePlans.ts` | 경로 후보, ETA, cost, risk, timeline |
| carriage detail | `src/entities/route-plan/mock/carSurvival.ts` | 칸별 혼잡/등급/이유 |
| report | `src/entities/report/mock/savedReports.ts` | 초기 저장 리포트 |
| route presets | `src/features/generate-route-plan/model/presets.ts` | 사용자 시나리오 프리셋 |
| AI prompts/messages | `src/features/send-ai-chat/model/*` | 추천 질문, 초기 메시지, fallback |

남은 하드코딩 mock: archive 월 통계/캘린더 문구, report view 일부 수치/문구, settings 데이터 출처 안내.

## 6. API Response Validation

`sendAiChat()`은 `postJson("/api/chat", input)` 결과를 `validateAiChatResponse()`로 통과시킨 뒤 UI에 넘긴다. 서버 쪽 `createAiChatResponse()`도 request/response validator를 사용한다.

오류 shape는 현재 `{ error: string }`이다. 클라이언트 `HttpError`는 status와 payload를 보존하고, `error` 문자열이 있으면 message로 사용한다.

## 7. Markdown Rendering Boundary

AI 응답은 `src/shared/lib/markdown/renderSafeMarkdown.tsx`에서 React node로 렌더링한다. 지원 문법은 제한된 bold, inline code, bullet/numbered list, paragraph/line break다. HTML injection을 허용하지 않고 `dangerouslySetInnerHTML`를 사용하지 않는다.

## 8. Frontend 기준 데이터 모델

| 모델 | 필드 후보 |
|---|---|
| `StationNode` | `id`, `name`, `x`, `y`, `type`, `bikesAvailable`, `busesAvailable`, `crowdLevel` |
| `RoutePlan` | `id`, `name`, `modes`, `eta`, `extraCost`, `risk`, `crowd`, `description`, `timeline`, `confidence` |
| `SavedReport` | `id`, `date`, `type`, `from`, `to`, `status`, `summary`, `cost` |
| `UserPreferences` | `home`, `work`, `crowdSensitivity`, `maxTaxiFee`, `walkLimitMin`, `useBike`, `aiStyle`, `favoriteRoutes` |
| `ChatMessage` | `id`, `sender`, `text`, `timestamp`, AI suggestion fields |

## 9. 확장 계획

React Query 도입 시 page에서 `useQuery`를 직접 호출하지 않고 feature/entity hook이 query key를 소유한다. Zod 또는 동등한 runtime parser 도입 시 entity API response schema는 `entities/*/model` 또는 `entities/*/api`에 두고, `/api/chat` schema는 현재처럼 feature API 경계에 둔다.

## 9-1. Mock to `/api/v1` Migration Map

| 현재 FE source | Target API | Target ownership | Persistence |
|---|---|---|---|
| `entities/station/mock/stations.ts` | `GET /api/v1/stations`, `GET /api/v1/stations/search` | Spring Boot `station` | station master/cache |
| `entities/route-plan/mock/routePlans.ts` | `POST /api/v1/route-plans` | Spring Boot `route` | routePlan/options server resource, no saved archive |
| selected route + report type | `POST /api/v1/decision/route-report` | Spring Boot -> FastAPI | decisionReport/evidence server resource, no saved archive |
| `entities/report/mock/savedReports.ts` | `GET/POST /api/v1/reports` | Spring Boot `report` | immutable saved report + route/provider/decision/model/evidence snapshot |
| `entities/user-preferences/model/store.ts` | `GET/PUT /api/v1/preferences` | Spring Boot `preference` | P1 auth sync |
| `features/send-ai-chat/api/sendAiChat.ts` | `POST /api/v1/decision/chat` | Spring Boot -> FastAPI/LLM | no-store by default |

`route preview`와 `saved report`는 UI가 비슷해도 source가 다르다. route preview는 `route_plans`/`route_plan_options`, decision preview는 `decision_reports`, saved report detail은 immutable `saved_reports` snapshot에서 읽는다.

## 9-2. FE Adapter Policy

| Server DTO | FE model | Adapter owner |
|---|---|---|
| Station DTO | `StationNode` | `entities/station` |
| Route Preview Item | `RoutePlan` | `entities/route-plan` or `features/generate-route-plan/api` |
| Decision Response | report view model + AI action | `features/send-ai-chat` and future `features/generate-decision-report` |
| Saved Report Detail | `SavedReport` + snapshot view | `entities/report` |
| Preference DTO | `UserPreferences` | `entities/user-preferences` |

Adapters should normalize enum casing, preserve unknown provider payload only in snapshot fields, and keep UI-only fields out of persisted DTOs.

Decision/report adapters must preserve model metadata even if the first UI does not render every field.

| Field | Why FE keeps it |
|---|---|
| `modelVersion` | saved report reproducibility and support/debug |
| `featureSchemaVersion` | model/feature compatibility and feedback labels |
| `calibrationVersion` | confidence interpretation |
| `confidenceRaw` | optional debug/evaluation display, not primary UX |
| `confidence` | primary UI confidence |
| `fallback` or `fallbackUsed` | degraded state messaging and analytics |
| `dataFreshnessSeconds` | stale provider warning |
| `evidence[]` | structured report rendering and LLM grounding |

FE should not compute these values. It only renders or forwards server-provided metadata.

## 9-3. Cache Policy

| Data | FE cache | Server cache |
|---|---|---|
| station catalog/search | short client cache after React Query adoption | public short cache |
| route preview | memory/session cache only | private no-store |
| decision preview | memory/session cache only | private no-store |
| decision chat | memory only by default | private no-store |
| reports | user-private cache only after auth | private no-store |
| preferences | localStorage P0, server sync P1 | private no-store |

## 9-4. Feedback / Label Payload Boundary

P1 feedback UI can start small, but the API payload must carry enough metadata for AI label reconstruction.

| FE event source | Payload fields |
|---|---|
| report selected/saved | `decisionReportId`, `routeOptionId`, `servedModelVersion`, `servedFeatureSchemaVersion`, `servedCalibrationVersion`, `fallbackUsed` |
| user outcome prompt | `arrivedBeforeDeadline`, `observedEtaMinutes`, `transferFailed`, `boardedFirstVehicle`, `observedCongestionLevel` |
| rating/helpfulness | `userRating`, `helpful`, `feedbackType`, `comment` |

If FE does not know a field, it sends null or omits it according to server schema. FE must not invent observed outcomes.

## 10. 상태 표시

| 구분 | 표시 |
|---|---|
| 현재 코드와 동기화됨 | storage keys, stores, schema 위치, mock 위치, markdown 경계 |
| 계획성 | React Query, Zod, server-state cache, entity adapter, feedback label metadata |
| 미확정 | persistence migration versioning, FE runtime parser 도입 방식, savedReports schema validation |
