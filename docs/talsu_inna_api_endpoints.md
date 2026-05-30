# 탈수있나 API Endpoints

> 목적: 현재 존재 endpoint와 예정 endpoint를 owner/method/path/request/response/cache/error 기준으로 정리한다.
> SSOT: `docs/deep-research-report.md`

## 1. 현재 존재 Endpoint

| Method | Path | Owner | 현재 구현 | Cache | Error |
|---|---|---|---|---|---|
| POST | `/api/chat` | Vercel Function + local Express | AI chat response 생성. Gemini key 없으면 heuristic fallback | `Cache-Control: no-store` in Vercel | 400/405/500 `{ error }` |

Local dev에서는 `server.ts`가 Express로 `/api/chat`을 Vite middleware보다 먼저 등록한다. Vercel에서는 `api/chat.ts`가 같은 `createAiChatResponse()`를 호출한다.

## 2. `/api/chat` 상세

| 항목 | 값 |
|---|---|
| Client caller | `src/features/send-ai-chat/api/sendAiChat.ts` |
| Request validator | `src/features/send-ai-chat/api/schema.ts` |
| Shared responder | `src/features/send-ai-chat/server/chatResponder.ts` |
| Env | `GEMINI_API_KEY`, optional `GEMINI_MODEL` |
| Default model | `gemini-2.5-flash` |
| Timeout | client `postJson` 기본 15000ms |
| Fallback | server heuristic fallback, client fallback |

Current copy/validation policy:

| 항목 | 정책 |
|---|---|
| 응답 schema | `textAnswer` 필수. `suggestedReportType`은 `boarding|carriage|deadline|recovery|null`만 허용 |
| 사용자 copy | 한국어 Markdown 설명. 현재 route/report evidence를 바로 설명 |
| 금지 copy | emoji prefix, 챗봇 자기소개, 제품 홍보, `반갑습니다`, `브리핑 종료` |
| 금지 raw 값 | `Plan A`, `plan_a`, raw enum `boarding/deadline/carriage/recovery`, `savedReportId`, `srpt_...`, `drpt_...` |
| 실패 UI | timeout/500/invalid schema는 client fallback warning/retry로 처리하고 report context를 유지 |

## 3. 예정 Endpoint Draft

아래는 현재 코드의 entity/state/mock에서 출발하되, 심층 리서치 결정에 따라 `/api/v1` 공개 API와 `/internal` AI API로 재정렬한 target endpoint다.

| Priority | Method | Path | Owner | Request | Response | Auth | Cache/Error |
|---|---|---|---|---|---|---|---|
| P0 | GET | `/api/v1/health` | Spring Boot | none | health payload | none | no-store |
| P0 | GET | `/api/v1/stations` | Spring Boot | query: region optional | station catalog DTO | optional | public short cache |
| P0 | GET | `/api/v1/stations/search` | Spring Boot | `q` | station search DTO[] | optional | public short cache |
| P0 | GET | `/api/v1/stations/{canonicalStationId}` | Spring Boot | path canonical station ID | station detail DTO | optional | public short cache + ETag |
| P0 | POST | `/api/v1/route-plans` | Spring Boot | canonical station IDs/preferences/deadline | `routePlanId` + option DTO[] | optional/member | private no-store |
| P0 | POST | `/api/v1/decision/route-report` | Spring Boot -> FastAPI | routePlanId/selectedOptionId/context | `decisionReportId` + decision/evidence/model metadata | optional/member | private no-store |
| P0 | POST | `/api/v1/decision/chat` | Spring Boot -> FastAPI/LLM | message/context | structured chat/explanation | optional/member | private no-store |
| P1 | GET | `/api/v1/reports` | Spring Boot | date range/type | `SavedReport[]` | member | user private no-store |
| P1 | GET | `/api/v1/reports/{savedReportId}` | Spring Boot | path savedReportId | saved report detail + snapshots | member | user private no-store |
| P1 | POST | `/api/v1/reports` | Spring Boot | selected route/report snapshot | `SavedReport` | member | validation error |
| P1 | DELETE | `/api/v1/reports/{savedReportId}` | Spring Boot | path savedReportId | success envelope | member | idempotent policy needed |
| P1 | GET | `/api/v1/preferences` | Spring Boot | none | `UserPreferences` | member | user private no-store |
| P1 | PUT | `/api/v1/preferences` | Spring Boot | `UserPreferences` | `UserPreferences` | member | validation error |
| P2 | POST | `/api/v1/maps/route` | Spring Boot | origin/destination/mode | geometry/eta/distance adapter | optional | provider fallback |
| P1 | POST | `/api/v1/feedback/model` | Spring Boot | report id/action/outcome | accepted | member/anonymous token | no-store |
| Internal | POST | `/internal/decision/route-report` | FastAPI | features/context | decision response | service auth | no-store |
| Internal | POST | `/internal/decision/chat` | FastAPI | decision/chat context | structured explanation | service auth | no-store |
| Internal | GET | `/internal/health` | FastAPI | none | health payload | service/internal | no-store |

## 3-0. Endpoint Detail Matrix

| Path | Request owner | Response owner | Error prefix | Notes |
|---|---|---|---|---|
| `/api/v1/health` | Spring `common` | Spring `common` | `TSL-COMMON` | Cloud Run probe 대상 |
| `/api/v1/stations` | Spring `station` | Spring `station` | `TSL-STATION` | catalog short cache |
| `/api/v1/stations/search` | Spring `station` | Spring `station` | `TSL-STATION` | query `q` required for search mode |
| `/api/v1/stations/{canonicalStationId}` | Spring `station` | Spring `station` | `TSL-STATION` | immutable public station ID lookup |
| `/api/v1/route-plans` | Spring `route` | Spring `route` | `TSL-ROUTE` | stores request row and route options; provider call is outside TX |
| `/api/v1/decision/route-report` | Spring `decision` | FastAPI internal + Spring wrapper | `TSL-DECISION` | stores decision report after FastAPI response; AI call is outside TX |
| `/api/v1/decision/chat` | Spring `decision` | FastAPI/LLM + Spring wrapper | `TSL-DECISION` | `/api/chat` legacy alias |
| `/api/v1/reports` | Spring `report` | Spring `report` | `TSL-REPORT` | save creates snapshots |
| `/api/v1/preferences` | Spring `preference` | Spring `preference` | `TSL-PREFERENCE` | P1 auth sync |
| `/api/v1/feedback/model` | Spring `feedback` | Spring `feedback` | `TSL-FEEDBACK` | model feedback event |

## 3-1. Spring Boot Skeleton 순서

| 순서 | Endpoint | 이유 |
|---:|---|---|
| 1 | `GET /api/v1/health` | Cloud Run probe, smoke 기준 |
| 2 | `GET /api/v1/stations`, `GET /api/v1/stations/search`, `GET /api/v1/stations/{canonicalStationId}` | station canonicalization과 FE select/search 전환 기준 |
| 3 | `POST /api/v1/route-plans` | route request/options 저장과 provider snapshot 확보 |
| 4 | `POST /api/v1/decision/route-report` | decision report/model evidence 저장 |
| 5 | `POST /api/v1/reports`, `GET /api/v1/reports` | immutable saved report snapshot 영속화 |
| 6 | `GET/PUT /api/v1/preferences` | guest/localStorage 이후 회원 preference 동기화 |
| 7 | `POST /api/v1/feedback/model` | 모델 평가/학습 피드백 확보 |

## 3-2. FastAPI Internal Skeleton

| Endpoint | Request | Response |
|---|---|---|
| `GET /internal/health` | none | service/model artifact readiness |
| `POST /internal/decision/route-report` | routePlanId, selectedOptionId, preferences, deadline, provider freshness, feature context | `decisionReportId`, `decisionCode`, `modelVersion`, `featureSchemaVersion`, `calibrationVersion`, `confidence`, `fallbackUsed`, `evidence[]` |
| `POST /internal/decision/chat` | decision result, user message, route/report context | structured explanation: `text`, `summary`, `sections`, `quickReplies` |

## 4. Migration Plan

1. Keep `/api/chat` stable as a legacy alias until FE migrates to `/api/v1/decision/chat`.
2. Move route/station/report/preferences from mock/localStorage to Spring Boot endpoints behind feature/entity API modules.
3. Let Spring Boot call FastAPI Decision API for model inference; do not expose FastAPI to browser.
4. Split LLM chat from deterministic decision endpoint: decision returns structured scores/evidence, chat summarizes/explains.
5. Retain frontend fallback during MVP migration.

## 6. Phase 7 Smoke Targets

| Smoke | Expected |
|---|---|
| `GET /api/v1/health` | 200 and requestId in meta |
| `GET /api/v1/stations/search?q=염창` | returns station result or empty data envelope |
| `POST /api/v1/route-plans` | returns `routePlanId` and option candidates; no saved report |
| `POST /api/v1/decision/route-report` | returns `decisionReportId`, decision/evidence/model metadata |
| `POST /api/v1/reports` | creates immutable saved report with route/provider/decision/model/evidence snapshot |
| `POST /api/v1/decision/chat` | returns structured explanation |
| Legacy `POST /api/chat` | still returns current response until migration complete |
| Legacy copy guard | no raw id/enum, no chatbot greeting, no emoji prefix |

## 7. Idempotency / Lock Policy

| Endpoint | Idempotency |
|---|---|
| `POST /api/v1/route-plans` | optional. Duplicate request may create a new `routePlanId` unless client supplies `Idempotency-Key`. |
| `POST /api/v1/decision/route-report` | optional. Same `routePlanId` + `selectedOptionId` + idempotency key should return existing `decisionReportId`. |
| `POST /api/v1/reports` | required. Duplicate save should return existing `savedReportId` or 409 with `TSL-REPORT-002`. |
| `POST /api/v1/feedback/model` | recommended. Duplicate feedback event should be ignored or return existing event. |

비관적 락은 quota 차감, 동일 saved report 중복 생성, payment-like accounting이 생길 때만 좁게 적용한다.

## 7-1. AI/Analytics Event Flow

| Event | Producer | Primary store | Async sink | Idempotency key |
|---|---|---|---|---|
| route plan created | Spring route | `route_plans`, `route_plan_options` | optional BigQuery route context | `Idempotency-Key` optional |
| decision generated | Spring decision after FastAPI | `decision_reports` | `ml_model_inference_log` | routePlanId + selectedOptionId + key |
| saved report created | Spring report | `saved_reports` | optional archive audit | `Idempotency-Key` required |
| feedback submitted | Spring feedback | `model_feedback` | Pub/Sub -> `ml_feedback_event` | `eventId` or `Idempotency-Key` |

BigQuery/PubSub 적재 실패가 public API success를 되돌리면 안 된다. 단, event publish 실패는 structured log와 retry queue에 남겨야 한다.

## 8. 상태 표시

| 구분 | 표시 |
|---|---|
| 현재 코드와 동기화됨 | `POST /api/chat`, local Express/Vercel Function split, AI copy guard, client fallback/retry QA |
| 계획성 | station/route/report/preferences/decision/maps endpoints |
| 미확정 | auth, pagination/filter detail, endpoint별 error code registry, rate limit |
