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

## 3. 예정 Endpoint Draft

아래는 현재 코드의 entity/state/mock에서 출발하되, 심층 리서치 결정에 따라 `/api/v1` 공개 API와 `/internal` AI API로 재정렬한 target endpoint다.

| Priority | Method | Path | Owner | Request | Response | Auth | Cache/Error |
|---|---|---|---|---|---|---|---|
| P0 | GET | `/api/v1/health` | Spring Boot | none | health payload | none | no-store |
| P0 | GET | `/api/v1/stations` | Spring Boot | query: region optional | station catalog DTO | optional | public short cache |
| P0 | GET | `/api/v1/stations/search` | Spring Boot | `q` | station search DTO[] | optional | public short cache |
| P0 | POST | `/api/v1/route-plans` | Spring Boot | start/end/preferences/deadline | route preview DTO[] | optional/member | private no-store |
| P0 | POST | `/api/v1/decision/route-report` | Spring Boot -> FastAPI | route candidates/context | decision scores/evidence/report type | optional/member | private no-store |
| P0 | POST | `/api/v1/decision/chat` | Spring Boot -> FastAPI/LLM | message/context | structured chat/explanation | optional/member | private no-store |
| P1 | GET | `/api/v1/reports` | Spring Boot | date range/type | `SavedReport[]` | member | user private no-store |
| P1 | GET | `/api/v1/reports/{id}` | Spring Boot | path id | saved report detail + snapshots | member | user private no-store |
| P1 | POST | `/api/v1/reports` | Spring Boot | selected route/report snapshot | `SavedReport` | member | validation error |
| P1 | DELETE | `/api/v1/reports/{id}` | Spring Boot | path id | success envelope | member | idempotent policy needed |
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
| `/api/v1/route-plans` | Spring `route` | Spring `route` | `TSL-ROUTE` | no DB write |
| `/api/v1/decision/route-report` | Spring `decision` | FastAPI internal + Spring wrapper | `TSL-DECISION` | no DB write |
| `/api/v1/decision/chat` | Spring `decision` | FastAPI/LLM + Spring wrapper | `TSL-DECISION` | `/api/chat` legacy alias |
| `/api/v1/reports` | Spring `report` | Spring `report` | `TSL-REPORT` | save creates snapshots |
| `/api/v1/preferences` | Spring `preference` | Spring `preference` | `TSL-PREFERENCE` | P1 auth sync |
| `/api/v1/feedback/model` | Spring `feedback` | Spring `feedback` | `TSL-FEEDBACK` | model feedback event |

## 3-1. Spring Boot Skeleton 순서

| 순서 | Endpoint | 이유 |
|---:|---|---|
| 1 | `GET /api/v1/health` | Cloud Run probe, smoke 기준 |
| 2 | `GET /api/v1/stations`, `GET /api/v1/stations/search` | station canonicalization과 FE select/search 전환 기준 |
| 3 | `POST /api/v1/route-plans` | 현재 mock route planner를 BE preview로 대체 |
| 4 | `POST /api/v1/decision/route-report` | route preview를 decision preview로 연결 |
| 5 | `POST /api/v1/reports`, `GET /api/v1/reports` | 저장 시점 snapshot 영속화 |
| 6 | `GET/PUT /api/v1/preferences` | guest/localStorage 이후 회원 preference 동기화 |
| 7 | `POST /api/v1/feedback/model` | 모델 평가/학습 피드백 확보 |

## 3-2. FastAPI Internal Skeleton

| Endpoint | Request | Response |
|---|---|---|
| `GET /internal/health` | none | service/model artifact readiness |
| `POST /internal/decision/route-report` | normalized route candidates, preferences, deadline, provider freshness | `modelVersion`, `featureSchemaVersion`, `confidence`, `fallbackUsed`, `decision`, `evidence`, `alternatives` |
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
| `POST /api/v1/route-plans` | returns route preview candidates, no persisted report |
| `POST /api/v1/decision/route-report` | returns decision/evidence with `fallbackUsed` |
| `POST /api/v1/reports` | creates report, route snapshot, decision snapshot |
| `POST /api/v1/decision/chat` | returns structured explanation |
| Legacy `POST /api/chat` | still returns current response until migration complete |

## 5. 상태 표시

| 구분 | 표시 |
|---|---|
| 현재 코드와 동기화됨 | `POST /api/chat`, local Express/Vercel Function split |
| 계획성 | station/route/report/preferences/decision/maps endpoints |
| 미확정 | auth, pagination/filter detail, endpoint별 error code registry, rate limit |
