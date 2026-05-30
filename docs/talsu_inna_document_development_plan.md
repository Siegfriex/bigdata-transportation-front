# 탈수있나 Document Development Plan

> 목적: `deep-research-report.md`의 결정사항을 운영 문서 8개에 반영하고, 이후 BE/AI/Infra 개발자가 바로 구현에 들어갈 수 있도록 문서 성숙도를 단계별로 끌어올린다.

## 1. Senior Dev 판단 요약

현재 가장 큰 리스크는 코드가 아니라 계약 부재다. 프론트는 이미 IA와 상태 모델이 충분히 진행됐고, 이제 문서는 "아이디어 모음"이 아니라 Spring Boot/FastAPI/DB/Infra 구현자가 그대로 따를 기준이어야 한다.

우선 고정할 결정은 다음이다.

| 범주 | 결정 |
|---|---|
| Public API | `/api/v1/...`로 버전 prefix를 도입한다. 기존 `/api/chat`은 legacy alias다. |
| BE 경계 | Browser는 Spring Boot Core API만 호출한다. |
| AI 경계 | FastAPI는 `/internal/decision/*` internal-only stateless service다. |
| DB | `route_plans`/`route_plan_options`는 요청·옵션 resource로 저장하고, `saved_reports`는 immutable snapshot archive로 저장한다. |
| FE IA | `activeTab`과 AI map overlay를 유지한다. URL router는 후순위다. |
| AI | Deadline Success와 ETA public baseline을 P0로 두고 SK calibration/fine-tuning은 후행한다. |
| AI data | BigQuery/Cloud Storage/PubSub/Vertex AI로 offline training path를 분리한다. |
| Infra | Vercel FE, Cloud Run Spring/FastAPI, Cloud SQL, Secret Manager, BigQuery, Vertex AI를 target으로 둔다. |

## 2. 문서별 발전 목표

| 문서 | 현재 역할 | 다음 발전 목표 |
|---|---|---|
| `talsu_inna_frontend_fsd.md` | 현재 FE FSD 운영 기준 | 기능별 Trigger/Input/Process/Output/Error/Acceptance Criteria까지 확장 |
| `talsu_inna_ia.md` | 현재 탭/overlay IA | 화면 ID와 기능 ID를 `/api/v1` endpoint, QA scenario와 연결 |
| `talsu_inna_frontend_data_schema_cache.md` | FE data/cache/schema inventory | FE view model과 server DTO mapping table 추가 |
| `talsu_inna_api_contract.md` | FE/BE/AI contract 기준 | OpenAPI 작성 전 request/response DTO를 endpoint별로 완성 |
| `talsu_inna_api_endpoints.md` | endpoint inventory | Spring Boot OpenAPI tag, owner, auth, cache, error code까지 확장 |
| `talsu_inna_erd.md` | frontend-derived draft ERD | canonical DB schema, migration batch, FK/index 정책으로 확장 |
| `talsu_inna_infra.md` | Vercel/local/target infra | Cloud Run/Cloud SQL/Secret Manager/BigQuery/PubSub/Vertex deploy checklist와 env matrix 추가 |
| `talsu_inna_ai_modeling_plan.md` | AI modeling 계획 | FastAPI request/response, feature schema, BigQuery schema, model promotion gate 추가 |

현재 코드 실측으로 추가 반영된 문서 범위:

| 범위 | 반영 기준 |
|---|---|
| FSD/IA | `mapDecisionReducer`, narrowed `MapLayerState`, full strategic report, AI return layer |
| Data/cache | saved report snapshot 필드, `usePersistentState` fallback, AI raw id 금지 |
| QA | v2 happy path + v3 deep QA, 54 e2e cases, visual polish screenshot matrix |
| Infra | Vercel URL은 목표 후보로만 표기하고 live URL은 smoke 성공 후 확정 |

## 3. Phase Plan

### Phase D0. 문서 체계 동결

목표: `deep-research-report.md`를 최상위 SSOT로 두고, 운영 문서와 archive/reference를 분리한다.

작업:
- `deep-research-report.md`를 root SSOT로 유지한다.
- target 8문서를 운영 기준으로 승인한다.
- 구버전 PRD/FSD/IA/v1/v2 문서는 `docs/archive/`로 이동한다.
- raw inventory와 AI Python modeling v5는 `docs/reference/`로 이동한다.
- `*.md:Zone.Identifier`, `docs/.md`는 삭제한다.

완료 기준:
- `docs/` root에는 운영 문서와 현재 reference만 남는다.
- 어떤 문서를 읽어야 하는지 README 또는 docs index에서 명확하다.

### Phase D1. Contract Freeze

목표: BE skeleton이 흔들리지 않도록 API/ERD/AI response를 먼저 고정한다.

작업:
- `talsu_inna_api_contract.md`에 공통 success/error envelope와 error code registry 초안을 추가한다.
- `talsu_inna_api_endpoints.md`에 `/api/v1` endpoint별 request/response/auth/cache/error를 완성한다.
- `talsu_inna_erd.md`에 canonical table별 field, FK, index, nullable policy를 추가한다.
- `talsu_inna_ai_modeling_plan.md`에 FastAPI internal request/response model을 추가한다.

완료 기준:
- Spring Boot skeleton을 OpenAPI tag 단위로 바로 만들 수 있다.
- FastAPI skeleton을 Pydantic model 단위로 바로 만들 수 있다.

### Phase D2. Implementation Guide

목표: 문서가 구현 순서와 QA를 직접 지시하게 만든다.

작업:
- `talsu_inna_frontend_fsd.md`에 feature별 acceptance criteria를 추가한다.
- `talsu_inna_ia.md`에 사용자 플로우별 QA scenario를 추가한다.
- `talsu_inna_frontend_data_schema_cache.md`에 mock -> `/api/v1` migration map을 추가한다.
- `talsu_inna_infra.md`에 local/preview/prod env matrix와 smoke commands를 추가한다.

완료 기준:
- 프론트 개발자는 mock에서 API 전환 범위를 안다.
- 백엔드 개발자는 어떤 endpoint부터 만들지 안다.
- QA는 Phase 7 smoke 기준을 문서에서 바로 읽을 수 있다.

### Phase D2.1. Frontend Measured-Code Sync

목표: v2/v3 QA와 현재 frontend diff를 운영 문서에 반영해 문서가 구현보다 낙후되지 않게 한다.

작업:
- full strategic report의 entry, summary grid, evidence toggle, sticky action bar를 FSD/IA/QA에 반영한다.
- `MapLayerState`를 `default | report_detail | ai_overlay | ai_peek`로 고정하고 과거 상태명을 제거한다.
- AI evidence overlay의 context 유지, raw id/enum 금지, skeleton/retry/fallback 정책을 API/QA/interaction 문서에 반영한다.
- saved report snapshot restore와 snapshot -> live preview 전환 정책을 data/IA/QA 문서에 반영한다.
- Vercel URL은 smoke 완료 전 확정 live URL로 쓰지 않도록 infra 문구를 정정한다.

완료 기준:
- `docs/` 운영 문서가 현재 frontend code/test locator와 같은 상태명을 사용한다.
- v3 e2e의 P0/P1 항목이 QA 문서에서 추적 가능하다.

### Phase D3. OpenAPI/Schema Sync

목표: 문서와 실제 OpenAPI/schema drift를 줄인다.

작업:
- Spring Boot `/v3/api-docs`가 나오면 endpoint 문서와 대조한다.
- FastAPI `/openapi.json`이 나오면 AI modeling/contract 문서와 대조한다.
- FE schema validator와 server DTO 이름을 mapping한다.
- drift check script 또는 PR checklist를 추가한다.

완료 기준:
- 문서에 적힌 endpoint/schema와 실제 OpenAPI가 불일치하면 PR에서 잡힌다.

### Phase D4. AI/Data Platform Readiness

목표: AI 모델링 심층연구설계를 실제 실험/배포 운영 체계로 전환한다.

작업:
- `talsu_inna_ai_modeling_plan.md`의 BigQuery table draft를 실제 DDL/migration 문서로 분리한다.
- Vertex AI Experiments/Pipelines/Model Registry naming rule을 확정한다.
- Pub/Sub feedback topic과 idempotent consumer 계약을 endpoint 문서와 맞춘다.
- `modelVersion`, `featureSchemaVersion`, `calibrationVersion`, `fallbackUsed`가 Spring/FastAPI/FE adapter/BigQuery에 모두 남는지 체크한다.
- SK API schema/terms/quota/storage rights를 계약 검토 후 plan의 `미확정`에서 `결정됨`으로 승격한다.

완료 기준:
- Deadline/ETA public baseline 실험을 재현할 수 있다.
- feedback event가 OLTP와 BigQuery label store에 중복 없이 적재된다.
- shadow/canary/prod model alias 운영 기준이 문서화된다.

## 4. 구체 제언

| 영역 | 제언 |
|---|---|
| API | `/api/v1/route-plans`와 `/api/v1/decision/route-report`를 절대 합치지 않는다. 전자는 route request/options, 후자는 판단 report다. |
| DB | `route_plans`, `route_plan_options`, `decision_reports`, `saved_reports`를 분리한다. `saved_reports`는 immutable snapshot archive다. |
| AI | LLM에게 판단을 맡기지 않는다. 모델/룰이 decision을 만들고 LLM은 설명한다. |
| FE | React Router 도입보다 onboarding persistence와 API boundary 정리가 먼저다. |
| Infra | `https://bigdata-transportation-front.vercel.app/`는 목표 URL 후보로만 기록한다. 실제 live URL은 배포와 health smoke가 통과한 뒤 확정한다. |
| Analytics | BigQuery는 ML/분석 저장소이지 OLTP source of truth가 아니다. |
| Feedback | `requestId`, `routeOptionId`, served model/feature/calibration version을 빼면 label reconstruction이 불가능하므로 API 초기에 고정한다. |
| Docs | 문서 삭제는 바로 하지 말고 archive/reference 이동 후 1회 리뷰한다. metadata 파일만 즉시 삭제 가능하다. |

## 5. 다음 실행 체크리스트

1. 운영 문서 8개를 승인한다.
2. archive/reference 정책을 정한다.
3. API contract에 endpoint별 DTO를 채운다.
4. ERD에 table field/FK/index를 채운다.
5. FastAPI internal response model을 Pydantic 기준으로 고정한다.
6. Infra 문서에 GCP/Vercel env matrix를 채운다.
7. Phase 7 smoke script와 문서 QA 기준을 연결한다.
8. BigQuery/Vertex/PubSub 운영 스키마를 AI modeling plan과 infra 문서에 동기화한다.
9. SK API 계약 검토 전까지 SK 필드는 residual teacher signal 가정으로만 유지한다.

## 6. 상태 표시

| 구분 | 표시 |
|---|---|
| 현재 코드와 동기화됨 | FE IA, current `/api/chat`, localStorage, entity/view model |
| 결정됨 | Spring Boot public API, FastAPI internal-only, `/api/v1`, canonical station ID, route plan storage, immutable saved report snapshot, AI baseline/calibration/residual 전략 |
| 미확정 | auth go-live 시점, DB engine 최종 선택, CI drift check 방식, SK API schema/terms/quota/storage rights |
