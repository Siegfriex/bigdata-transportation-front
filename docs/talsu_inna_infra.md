# 탈수있나 Infra

> 목적: 현재 Vite/Vercel/Express/API runtime과 향후 Java BE/FastAPI/GCP 연동 구조를 정리한다.
> SSOT: `docs/deep-research-report.md`

## 1. 현재 Runtime

| 영역 | 현재 구현 |
|---|---|
| Frontend build | Vite static build, `npm run build:client` |
| Local dev | `npm run dev` -> `tsx server.ts` -> Express + Vite middleware |
| Local prod server | `npm run build` 후 `npm run start` -> `dist/server.cjs` |
| Vercel frontend | `dist` static output |
| Vercel API | `api/chat.ts` Node.js Serverless Function |
| API rewrite | non-API path -> `/index.html` |

## 2. Env Vars

| 변수 | 필요성 | 범위 | 설명 |
|---|---|---|---|
| `GEMINI_API_KEY` | 운영 필수 | Local, Vercel | 실제 Gemini API 호출 키 |
| `GEMINI_MODEL` | 선택 | Local, Vercel | 기본값 `gemini-2.5-flash` |
| `APP_URL` | 선택 | Local, Vercel | canonical URL 필요 시 |
| `VERCEL_URL` | 자동 | Vercel | 코드 직접 의존 없음 |
| `VITE_GOOGLE_MAPS_API_KEY` | 계획 | Browser | 지도 표시 전용. 노출 가능성 전제 |
| `GOOGLE_MAPS_SERVER_API_KEY` | 계획 | Server | Routes/Geocoding server call 전용 |

문서에 실제 secret 값을 기록하지 않는다. `.env.example`에는 변수명만 둔다.

## 3. `/api/chat` Runtime

| 환경 | 엔트리 | 공용 로직 |
|---|---|---|
| Local dev | `server.ts` `app.post("/api/chat")` | `createAiChatResponse` |
| Vercel | `api/chat.ts` default handler | `createAiChatResponse` |

Vercel Function은 POST 외 method에 405를 반환하고 `Cache-Control: no-store`를 설정한다. Express local route는 API를 Vite middleware보다 먼저 등록한다.

## 4. Deployment

`vercel.json` 기준:

| 설정 | 값 |
|---|---|
| buildCommand | `npm run build:client` |
| outputDirectory | `dist` |
| function | `api/chat.ts`, `maxDuration: 300` |
| rewrites | non-API route to `/index.html` |

현재 배포 시도 관련 주의: 이전 Vercel deploy는 로컬 lint/build/API smoke가 아니라 Vercel 계정 billing/scope 문제로 막혔다. 최종 SSOT의 frontend URL은 `https://bigdata-transportation-front.vercel.app/`이며, 배포 health는 별도 smoke로 검증한다.

## 5. Local Dev / Smoke

| 목적 | 명령 |
|---|---|
| type check | `npm run lint` |
| full build | `npm run build` |
| dev server | `npm run dev` |
| chat smoke | `POST http://127.0.0.1:3000/api/chat` |

## 6. 향후 구조

```text
React/Vercel static
  -> Spring Boot Core API
       -> public transport APIs / DB
       -> FastAPI Decision API
            -> model inference / evidence / fallback
  -> Vercel /api/chat remains legacy adapter until /api/v1/decision/chat migration
```

Google Maps 도입 시 browser key와 server key를 분리한다. browser key는 referrer/API 제한을 걸고, server key는 저장소와 브라우저 번들에 노출하지 않는다.

## 6-1. 심층 리서치 반영 Target Infra

| 영역 | 결정 |
|---|---|
| Front | Vercel static frontend. SSOT frontend URL은 `https://bigdata-transportation-front.vercel.app/` |
| Core API | Spring Boot Cloud Run service |
| AI API | FastAPI Cloud Run private/internal service |
| GCP Project | `bigdata-transportation` (`583933438413`) |
| DB | Cloud SQL for MySQL 8.0. 공간 질의가 커지면 PostgreSQL/PostGIS 재검토 |
| Analytics | BigQuery dataset for raw events, feature snapshots, inference logs, labels, offline eval |
| Artifact | Cloud Storage for raw files, feature export, model artifacts |
| Event bus | Pub/Sub for feedback/retraining events. Eventarc for Cloud Storage -> Cloud Run/Functions triggers |
| ML platform | Vertex AI Experiments, Pipelines, Model Registry |
| Secret | server secret은 GCP Secret Manager. Vercel에는 browser 공개값만 둔다. |
| Internal auth | Spring service account만 FastAPI `run.invoker` 권한을 가진다. |
| Health | public `GET /api/v1/health`, internal Spring Actuator `/actuator/health`, FastAPI `/internal/health` |
| Correlation | requestId를 FE -> Spring -> FastAPI까지 전파한다. |
| Observability | Cloud Logging/Trace, JSON structured logs |
| Region | `asia-northeast3` 우선 권고 |

## 6-2. Env Matrix

| 환경 | FE/Vercel | Spring Boot Cloud Run | FastAPI Cloud Run |
|---|---|---|---|
| Local | `GEMINI_API_KEY`, `GEMINI_MODEL`, future `VITE_API_BASE_URL` | local DB/provider mock, FastAPI local URL | local model artifact path, fallback mode |
| Preview | browser 공개값만 Vercel env | DB connection, provider keys via Secret Manager, FastAPI internal URL | model artifact, LLM/SK credentials via Secret Manager |
| Production | browser 공개값만 Vercel env | Cloud SQL, provider, Secret Manager, service account | internal-only service, Secret Manager, model registry/artifacts |

## 6-2-1. Environment Variables

| Variable | Owner | Secret? | Environment | Note |
|---|---|---|---|---|
| `VITE_API_BASE_URL` | FE/Vercel | no | Preview/Prod | Spring Boot public base URL |
| `VITE_GOOGLE_MAPS_API_KEY` | FE/Vercel | no/public-restricted | Preview/Prod if maps enabled | browser key only with referrer/API restrictions |
| `GEMINI_API_KEY` | Legacy Vercel Function | yes | Local/Preview until migration | `/api/chat` legacy only |
| `GEMINI_MODEL` | Legacy Vercel Function | no | Local/Preview until migration | default fallback possible |
| `SPRING_PROFILES_ACTIVE` | Spring | no | Cloud Run | `preview`, `prod` |
| `FASTAPI_INTERNAL_URL` | Spring | no | Cloud Run | internal Cloud Run URL |
| `DB_CONNECTION_NAME` | Spring | no | Cloud Run | Cloud SQL connection |
| `DB_NAME` | Spring | no | Cloud Run | |
| `DB_USER_SECRET` | Spring | yes | Secret Manager ref | never plain docs |
| `DB_PASSWORD_SECRET` | Spring | yes | Secret Manager ref | never plain docs |
| `PUBLIC_TRANSIT_API_KEY_SECRET` | Spring | yes | Secret Manager ref | provider key |
| `SK_API_KEY_SECRET` | Spring/FastAPI | yes | Secret Manager ref | calibration/feature enrichment |
| `MODEL_ARTIFACT_URI` | FastAPI | no/controlled | Cloud Run | model registry/artifact path |
| `MODEL_ALIAS` | FastAPI | no | Cloud Run | `shadow`, `canary`, `prod` |
| `FEATURE_SCHEMA_VERSION` | FastAPI | no | Cloud Run | deployed feature compatibility |
| `BQ_DATASET` | Spring/FastAPI/ETL | no | Cloud Run | analytics dataset |
| `PUBSUB_FEEDBACK_TOPIC` | Spring | no | Cloud Run | feedback event publish target |
| `LLM_API_KEY_SECRET` | FastAPI | yes | Secret Manager ref | explanation layer |
| `JWT_SIGNING_KEY_SECRET` | Spring | yes | Secret Manager ref | auth go-live |
| `AI_INTERNAL_AUDIENCE` | Spring/FastAPI | no | Cloud Run | internal ID token audience |

## 6-3. Health / OpenAPI / Probe

| Component | Public/Internal | Endpoint |
|---|---|---|
| Spring app health | public app health | `GET /api/v1/health` |
| Spring actuator | internal/deeper health | `/actuator/health` |
| Spring OpenAPI | internal/team docs | `/v3/api-docs` |
| FastAPI health | internal service health | `GET /internal/health` |
| FastAPI OpenAPI | internal/team docs | `/openapi.json` |

## 6-4. Deployment Checklist

| Step | Check |
|---|---|
| Vercel FE | `npm run build:client` succeeds, `VITE_API_BASE_URL` points to Spring API |
| Spring Cloud Run | `/api/v1/health` returns 200, `/v3/api-docs` generated |
| FastAPI Cloud Run | `/internal/health` returns 200 from Spring service account path |
| IAM | Spring service account has FastAPI `roles/run.invoker`; public unauthenticated access disabled for FastAPI |
| Cloud SQL | Spring can connect; FastAPI does not own canonical DB connection |
| Secret Manager | server secrets referenced by service account, not copied into docs |
| Logging | requestId/correlationId appears across FE/Spring/FastAPI logs |
| Rollback | modelVersion and calibrationVersion can be pinned or rolled back |
| BigQuery | partitioned tables exist; sample query uses partition filter |
| Pub/Sub | feedback topic/subscription exists; consumer is idempotent |
| Vertex AI | model artifacts have registry aliases `shadow`, `canary`, `prod` |
| Eventarc | Cloud Storage ingest trigger is scoped to allowed bucket/prefix |

## 6-4-1. Security Checklist

| Area | Decision |
|---|---|
| FE secrets | Vercel에는 공개 가능한 `VITE_*` 값만 둔다. |
| Server secrets | DB/provider/JWT/LLM/SK secret은 GCP Secret Manager에 둔다. |
| Service accounts | default service account 대신 Spring/FastAPI/ETL/Vertex 용 전용 service account를 쓴다. |
| Service account keys | long-lived key file 생성/업로드 금지. CI는 Workload Identity Federation을 우선한다. |
| FastAPI exposure | public unauthenticated access 금지. Spring service account만 invoker. |
| Internal auth header | 사용자 `Authorization`과 내부 Cloud Run auth가 충돌하면 `X-Serverless-Authorization` 사용을 검토한다. |
| OAuth | Authorization Code + PKCE + state/nonce. Implicit grant 사용 금지. |
| Refresh/logout | refresh rotation, logout 시 server-side refresh invalidation. |
| JWT | expected algorithm 명시 검증. |
| Rate limit | station search, maps/route, route-plans, decision, feedback에 per-IP/per-device/per-user 제한. |

## 6-4-2. Observability Fields

| Field | Source |
|---|---|
| `requestId` | API gateway/Spring generated |
| `traceId`, `spanId` | Spring/FastAPI tracing |
| `routePlanId` | route service |
| `decisionReportId` | decision service |
| `savedReportId` | report service |
| `userId` | nullable auth principal |
| `modelVersion` | FastAPI decision |
| `featureSchemaVersion` | FastAPI feature schema |
| `calibrationVersion` | FastAPI decision |
| `fallback.used` | decision/explanation fallback |
| `dataFreshnessSeconds` | provider/feature freshness |

## 6-5. Smoke Commands

| Target | Command shape |
|---|---|
| FE build | `npm run build:client` |
| Current local API | `POST http://127.0.0.1:3000/api/chat` |
| Spring health | `GET $API_BASE_URL/api/v1/health` |
| Route preview | `POST $API_BASE_URL/api/v1/route-plans` |
| Decision preview | `POST $API_BASE_URL/api/v1/decision/route-report` |
| Report save | `POST $API_BASE_URL/api/v1/reports` |
| Report cycle | save -> read -> delete saved report |
| FastAPI outage | decision endpoint returns fallback/degraded response, not raw 500 to FE |
| Trace log | Spring and FastAPI logs share requestId/traceId |
| Feedback ingest | duplicate eventId is ignored or returns existing event |
| BigQuery cost | large query includes partition filter |
| Model rollback | `MODEL_ALIAS=canary` -> `prod` or pinned `modelVersion` rollback is documented |

## 6-6. AI/Data Platform

AI 모델링 운영은 online inference path와 offline training path를 분리한다.

```text
Online:
React/Vercel -> Spring Boot -> FastAPI Cloud Run -> model artifact/registry

Offline:
GTFS/public/SK/weather -> ingest jobs -> BigQuery raw -> feature snapshots
  -> Vertex AI Pipelines/Experiments -> Model Registry
  -> FastAPI deploy alias or pinned artifact

Feedback:
Spring Boot -> Pub/Sub -> BigQuery labels/monitoring -> retraining pipeline
```

| Component | Role |
|---|---|
| BigQuery | raw transit events, feature snapshots, inference logs, feedback labels, offline evaluation |
| Cloud Storage | raw file landing, feature export, model artifact backup |
| Pub/Sub | feedback/retraining event bus |
| Eventarc | Cloud Storage object events to Cloud Run/Functions |
| Vertex AI Experiments | run params/metrics/artifacts |
| Vertex AI Pipelines | feature build -> train -> evaluate -> register |
| Vertex AI Model Registry | model version lifecycle and aliases |
| Cloud Run FastAPI | lightweight online inference wrapper |

Pub/Sub exactly-once는 pull subscription 조건에서만 기대한다. push subscription, Eventarc, Cloud Run consumer는 반드시 `eventId` 또는 `Idempotency-Key`로 중복 처리를 막는다.

Cloud Run concurrency는 모델 성격별로 조정한다. 기본값 80을 그대로 믿지 않고, CPU-bound tree model은 8-32, CPU deep model은 1-8, GPU/대형 모델은 Vertex AI endpoint 또는 별도 serving tier로 분리한다.

## 6-7. CI/CD Target

| Flow | Target |
|---|---|
| FE | Git push -> Vercel Preview, production branch -> production domain |
| Spring/FastAPI | GitHub/Cloud Build trigger -> Artifact Registry -> Cloud Run deploy |
| AI experiment | GitHub Actions or Cloud Build -> Vertex AI Pipeline run |
| Cloud auth | Workload Identity Federation. service account key file 금지 |
| Promotion | Model Registry alias `shadow` -> `canary` -> `prod` |

## 6-8. Cost / Retention Guardrails

비용 수치는 provider 정책 변경 가능성이 있으므로 문서에는 운영 guardrail만 고정한다.

| Area | Guardrail |
|---|---|
| BigQuery | partition filter required for scheduled/large queries; scanned bytes monitored |
| Cloud Run | request count, active instance time, cold start, timeout monitored |
| Vertex AI | training job budget and max runtime configured |
| SK/provider API | per-user/per-IP/per-device rate limit and provider spend cap |

| Data | Retention recommendation |
|---|---|
| station metadata/provider mapping | long-term |
| route provider short cache | seconds to minutes |
| unsaved route plans | 7 days or less |
| saved reports | until user deletion |
| raw model feedback | 180 days then aggregate |
| refresh token state | TTL-based deletion |
| audit/security logs | about 1 year |

## 7. Preview/Prod 구분

| 환경 | 기준 |
|---|---|
| Local | `.env` 또는 `.env.local`, fallback 허용 |
| Preview | Vercel Preview env vars, legacy `/api/chat` smoke 또는 target `/api/v1/decision/chat` smoke 필수 |
| Production | Production env vars, billing/quota/secret/rate-limit 제한 확인 |

## 8. 기록 금지 값

실제 API key, Vercel token, billing 세부정보, GCP project secret, 사용자 개인정보, 운영 DB credential은 문서에 기록하지 않는다.

## 9. 상태 표시

| 구분 | 표시 |
|---|---|
| 현재 코드와 동기화됨 | Vite build, Express dev, Vercel Function, env vars, rewrites |
| 계획성 | Java BE/FastAPI/GCP/Google Maps, BigQuery/PubSub/Vertex AI 구조 |
| 미확정 | auth 도입 시점, Redis 사용 여부, CI smoke, SK API quota/terms/storage rights |
