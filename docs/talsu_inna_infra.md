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

현재 배포 시도 관련 주의: 이전 Vercel deploy는 로컬 lint/build/API smoke가 아니라 Vercel 계정 billing/scope 문제로 막혔다. live URL은 실제 deploy 성공 전까지 확정하지 않는다.

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
  -> Vercel /api/chat remains adapter or migrates behind Core API
```

Google Maps 도입 시 browser key와 server key를 분리한다. browser key는 referrer/API 제한을 걸고, server key는 저장소와 브라우저 번들에 노출하지 않는다.

## 6-1. 심층 리서치 반영 Target Infra

| 영역 | 결정 |
|---|---|
| Front | Vercel static frontend. target hostname은 `https://bigdata-transportation-front.vercel.app/`이며 실제 live 여부는 deploy 성공 후 확인한다. |
| Core API | Spring Boot Cloud Run service |
| AI API | FastAPI Cloud Run private/internal service |
| DB | Cloud SQL 우선. 기본안은 MySQL 8, 공간 질의가 커지면 PostgreSQL/PostGIS 재검토 |
| Secret | server secret은 GCP Secret Manager. Vercel에는 browser 공개값만 둔다. |
| Internal auth | Spring service account만 FastAPI `run.invoker` 권한을 가진다. |
| Health | public `GET /api/v1/health`, internal Spring Actuator `/actuator/health`, FastAPI `/internal/health` |
| Correlation | requestId를 FE -> Spring -> FastAPI까지 전파한다. |

## 6-2. Env Matrix

| 환경 | FE/Vercel | Spring Boot Cloud Run | FastAPI Cloud Run |
|---|---|---|---|
| Local | `GEMINI_API_KEY`, `GEMINI_MODEL`, future `VITE_API_BASE_URL` | local DB/provider mock, FastAPI local URL | local model artifact path, fallback mode |
| Preview | browser 공개값만 Vercel env | DB connection, provider keys via Secret Manager, FastAPI internal URL | model artifact, LLM/SK credentials via Secret Manager |
| Production | browser 공개값만 Vercel env | Cloud SQL, provider, Secret Manager, service account | internal-only service, Secret Manager, model registry/artifacts |

## 6-3. Health / OpenAPI / Probe

| Component | Public/Internal | Endpoint |
|---|---|---|
| Spring app health | public app health | `GET /api/v1/health` |
| Spring actuator | internal/deeper health | `/actuator/health` |
| Spring OpenAPI | internal/team docs | `/v3/api-docs` |
| FastAPI health | internal service health | `GET /internal/health` |
| FastAPI OpenAPI | internal/team docs | `/openapi.json` |

## 7. Preview/Prod 구분

| 환경 | 기준 |
|---|---|
| Local | `.env` 또는 `.env.local`, fallback 허용 |
| Preview | Vercel Preview env vars, `/api/chat` smoke 필수 |
| Production | Production env vars, billing/quota/secret 제한 확인 |

## 8. 기록 금지 값

실제 API key, Vercel token, billing 세부정보, GCP project secret, 사용자 개인정보, 운영 DB credential은 문서에 기록하지 않는다.

## 9. 상태 표시

| 구분 | 표시 |
|---|---|
| 현재 코드와 동기화됨 | Vite build, Express dev, Vercel Function, env vars, rewrites |
| 계획성 | Java BE/FastAPI/GCP/Google Maps 구조 |
| 미확정 | 실제 Vercel production deploy 상태, auth 도입 시점, observability stack, CI smoke |
