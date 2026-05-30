# 탈수있나 Docs Index

> 최상위 SSOT: `docs/deep-research-report.md`
> 이 디렉터리의 운영 문서는 모두 위 보고서의 결정을 구현 가능한 기준으로 풀어 쓴 하위 문서다.

## 운영 문서

| 문서 | 역할 |
|---|---|
| `talsu_inna_frontend_fsd.md` | 현재 프론트 FSD, 기능, QA, API 전환 기준 |
| `talsu_inna_ia.md` | `activeTab` 3탭과 지도 기반 AI overlay IA |
| `talsu_inna_frontend_data_schema_cache.md` | localStorage, mock, schema, cache, DTO migration map |
| `talsu_inna_api_contract.md` | FE/Spring Boot/FastAPI 계약, envelope, DTO 방향 |
| `talsu_inna_api_endpoints.md` | `/api/v1` 공개 API와 `/internal/decision/*` internal API 목록 |
| `talsu_inna_erd.md` | canonical DB schema, report snapshot, migration batch |
| `talsu_inna_infra.md` | Vercel/GCP Cloud Run/Cloud SQL/Secret Manager 운영 기준 |
| `talsu_inna_ai_modeling_plan.md` | FastAPI 모델링, feature/target, inference response, promotion |
| `talsu_inna_document_development_plan.md` | 문서 동결 이후 OpenAPI/schema sync까지의 개발 계획 |

## Reference / Archive

| 위치 | 내용 |
|---|---|
| `docs/reference/` | raw inventory, AI Python modeling v5 같은 원천 연구 자료 |
| `docs/archive/` | 이전 PRD/FSD/IA/v1/v2 계획서와 흡수 완료된 문서 |

## 운영 원칙

1. `deep-research-report.md`와 운영 문서가 충돌하면 `deep-research-report.md`가 우선이다.
2. 신규 API/DB/AI/Infra 결정은 먼저 운영 문서에 반영한 뒤 구현한다.
3. `docs/archive/` 문서는 구현 기준으로 인용하지 않는다.
4. Windows metadata 파일과 비정상 파일명은 docs root에 두지 않는다.
