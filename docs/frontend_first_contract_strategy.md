# Frontend-first contract strategy

작성 기준: 2026-05-27

목적: API/ERD가 아직 확정되지 않은 상태에서 프론트엔드를 어디까지 선개발해도 되는지, 이후 Java 백엔드와 FastAPI AI 서비스가 붙을 때 흔들리지 않도록 어떤 문서를 먼저 고정해야 하는지 정의한다.

## 1. 기본 판단

현재 단계에서는 최종 API 명세와 ERD를 먼저 확정하지 않는다.

대신 프론트엔드는 다음 두 계약을 먼저 고정한다.

| 계약 | 의미 | 현재 단계 목적 |
|---|---|---|
| mock contract | 실제 서버 없이 feature가 기대하는 request/response shape | FE MVP 병렬 개발 기준 |
| view contract | 각 화면/widget/feature가 필요로 하는 데이터 shape와 상태 | API 변경에도 화면 구조가 흔들리지 않게 하는 기준 |

이 전략은 프론트 MVP를 먼저 올린 뒤, 그 결과물을 기준선으로 Java 백엔드와 Python AI 서비스를 순차 연동하는 방식이다.

## 2. 프론트를 어디까지 맞출 것인가

프론트는 현 단계에서 "실서버 직전 MVP" 수준까지 개발해도 된다.

단, 백엔드 구현 세부사항을 추정해 UI나 feature 내부에 박아 넣지 않는다. 지금 확정할 것은 화면, 상태, mock 계약, adapter 경계다.

### 지금 확정해야 하는 것

| 항목 | 확정 이유 | 문서/코드 후보 |
|---|---|---|
| IA | 페이지, 탭, 사용자 이동 경로는 API보다 먼저 안정화 가능 | `frontend-ia.md` |
| UX 상태 | loading, empty, error, partial, retry, disabled, permission denied는 FE가 먼저 정의 가능 | `frontend-state-flow.md`, `frontend-error-handling.md` |
| FSD 구조 | app/pages/widgets/features/entities/shared 책임 경계를 고정해야 이후 mock 제거가 쉬움 | `frontend-fsd-architecture.md` |
| view model | 화면이 실제로 필요로 하는 데이터 shape | `frontend-mock-contract.md` |
| mock contract | Java/Python 없이 FE feature 개발을 가능하게 하는 임시 계약 | `frontend-mock-contract.md` |
| auth placeholder | 로그인 전/후, 토큰 만료, 세션 복구, 권한 없음 흐름 | `auth-session-flow.md` |
| design token | spacing, z-index, color, typography, layout primitive | `frontend-design-system-spec.md` |
| feature state machine | 온보딩, 리포트 생성, AI 질의, 저장, 복원 흐름 | `frontend-state-flow.md` |
| adapter 경계 | mock/live 전환 위치 | `frontend-env-config.md`, feature/entity api layer |

### 지금 확정하지 않아도 되는 것

| 항목 | 이유 |
|---|---|
| 실제 ERD 정규화 수준 | Java 영속 레이어 설계와 함께 확정 |
| JPA aggregate/relationship 전략 | Java 백엔드 설계 단계에서 확정 |
| Python 내부 모델 파이프라인 | AI service spec 이후 확정 |
| 최종 OpenAPI 필드명 100% | mock contract를 기반으로 draft 후 조정 |
| BigQuery 테이블 설계 | Python AI data contract 단계에서 확정 |
| OAuth provider 세부 구현 | auth/session flow를 먼저 고정하고 구현은 후속 |

## 3. 문서 우선순위

| 우선순위 | 문서 | 목적 |
|---:|---|---|
| 1 | `PRD.md` | 제품 목표, 범위, 비목표 정의 |
| 2 | `frontend-ia.md` | 화면 구조, 사용자 이동, 정보 우선순위 고정 |
| 3 | `frontend-fsd-architecture.md` | FSD 레이어, import rule, public API rule 고정 |
| 4 | `frontend-mock-contract.md` | 백엔드 없이 FE 개발 가능한 request/response/view model 정의 |
| 5 | `domain-glossary.md` | Java/Python/FE 공통 용어 고정 |
| 6 | `auth-session-flow.md` | 로그인, 토큰, 만료, 재발급, 권한 흐름 정의 |
| 7 | `integration-roadmap.md` | FE -> Java -> Python 연결 순서 정의 |
| 8 | `api-contract-draft.md` | 실제 OpenAPI/JSON Schema 초안 |
| 9 | `erd-draft.md` | Java 영속 레이어 설계 시작점 |
| 10 | `backend-python-ai-service-spec.md` | Python AI 서비스 입력/출력/비동기 작업 규격 |

## 4. 권장 문서 스위트

### 제품 기준 문서

| 문서 | 내용 |
|---|---|
| `PRD.md` | 문제 정의, 사용자, 핵심 가치, MVP 범위, 비목표 |
| `scope-mvp.md` | 이번 버전에서 하는 것과 하지 않는 것 |
| `domain-glossary.md` | report, route, recommendation, session, archive, routine 등 공통 용어 |

### 프론트 기준 문서

| 문서 | 내용 |
|---|---|
| `frontend-ia.md` | 페이지 맵, 탭, 진입점, CTA, 내비게이션 규칙 |
| `frontend-fsd-architecture.md` | app/pages/widgets/features/entities/shared 책임, import rule, public API rule |
| `frontend-design-system-spec.md` | color, spacing, z-index, typography, layout primitive |
| `frontend-state-flow.md` | feature별 상태 전이 |
| `frontend-mock-contract.md` | mock API/view model schema |
| `frontend-error-handling.md` | loading, empty, error, timeout, auth-expired 처리 |
| `frontend-env-config.md` | env key, endpoint base, mock/live switch |

### Java 백엔드 준비 문서

| 문서 | 내용 |
|---|---|
| `backend-java-prd.md` | Java BE 범위, 인증/인가/영속/트랜잭션 책임 |
| `backend-java-domain-model-draft.md` | entity 후보와 aggregate 경계 |
| `backend-java-api-draft.md` | auth, user, report, archive, preferences API 초안 |
| `backend-java-erd-draft.md` | ERD v0 |
| `backend-java-auth-jwt-spec.md` | access/refresh, rotation, expiry, revoke 정책 |
| `backend-java-transaction-policy.md` | transactional use case 정의 |

### Python AI 준비 문서

| 문서 | 내용 |
|---|---|
| `backend-python-ai-prd.md` | AI 서비스 범위와 비범위 |
| `backend-python-inference-contract.md` | 입력/출력 schema, sync/async 여부 |
| `backend-python-feature-schema.md` | 모델 입력 feature 정의 |
| `backend-python-job-lifecycle.md` | 요청, 큐, 처리, 완료, 실패, 재시도 |
| `backend-python-modeling-plan.md` | 분류, 회귀, 데이터마이닝, 규칙기반 모듈 구조 |
| `backend-python-data-contract.md` | BigQuery 연동, 학습/추론 데이터 필드 계약 |

## 5. 레포 분리 전제

본 프로젝트는 다음 분산 구조를 전제로 한다.

| 영역 | 책임 | 계약 기준 |
|---|---|---|
| Frontend | 제품 구조, IA, UX 상태, view contract, mock contract, adapter | `frontend-*` 문서 |
| Java backend | 인증, 권한, 사용자, 영속 데이터, 트랜잭션, 기본 비즈니스 로직 | `backend-java-*`, `api-contract-draft.md`, `erd-draft.md` |
| Python FastAPI AI | 분류, 회귀, 데이터마이닝, 판단 로직, 추천/추론, 비동기 작업 | `backend-python-*`, AI inference contract |
| BigQuery/data | 학습/추론 데이터, 분석 테이블, feature schema | `backend-python-data-contract.md` |

## 6. 프론트 구현 기준

### 허용

| 항목 | 기준 |
|---|---|
| mock data | entity/feature mock boundary에 둔다 |
| mock API | feature/entity api adapter 뒤에 둔다 |
| view model | 화면 단위로 명시하되 server DTO로 확정하지 않는다 |
| 상태 전이 | feature state machine으로 먼저 고정한다 |
| error/loading UI | 실제 API 전에도 구현한다 |
| auth placeholder | 실제 provider 없이 상태와 화면 흐름을 먼저 만든다 |

### 금지

| 항목 | 이유 |
|---|---|
| widget/page에서 endpoint 문자열 직접 사용 | API 교체 시 blast radius 증가 |
| widget/page에서 storage key 직접 사용 | persistence 경계 분산 |
| 실제 DB schema를 FE 타입에 강결합 | ERD 변경 시 FE 대규모 수정 |
| Java/Python 내부 필드 추정 | 서버 구현 전 가정 누적 |
| mock data를 UI JSX 안에 직접 선언 | contract와 view가 섞임 |
| API 실패/권한/빈 상태를 나중으로 미룸 | 실제 연동 단계에서 UX 붕괴 |

## 7. 현재 data_insight 적용 메모

| 현재 파일/구조 | 전략상 의미 | 후속 작업 |
|---|---|---|
| `src/app/model/useAppController.ts` | app orchestration boundary가 생김 | app model 책임과 feature hook 책임을 문서화 |
| `src/features/generate-route-plan/model/useRoutePlanner.ts` | route planning feature state boundary 후보 | mock contract와 route view model 분리 |
| `src/features/send-ai-chat/model/useAiChatController.ts` | AI chat feature controller 후보 | AI request/response mock contract 작성 |
| `src/entities/*/model/store.ts` | entity persistence adapter 후보 | storage key/migration/error policy 문서화 |
| `src/shared/lib/markdown/renderSafeMarkdown.tsx` | shared rendering util 후보 | shared가 app-specific color token을 가져도 되는지 규칙화 |
| `src/shared/config/{storage-keys,query-keys,z-index}.ts` | 전역 key/token 후보 | 실제 사용 강제 규칙과 lint/check 필요 |
| `server.ts`, `api/chat.ts` | 현재 유일한 실 API boundary | `/api/chat` draft contract 먼저 고정 |

## 8. 기준 문장

본 프로젝트는 프론트엔드, Java 전용 백엔드, FastAPI 기반 Python AI 서비스를 각각 별도 폴더 또는 별도 Git 저장소로 운영하는 분산 구조를 전제로 한다. 현재 시점에서는 공통 PRD와 IA, 프론트엔드 FSD 및 공간/레이아웃 정책을 우선 정리하고, 최종 ERD와 API 계약은 아직 확정하지 않는다. 1차 목표는 프론트엔드를 mock 기반 MVP 수준까지 선제 개발하여 정보구조, 사용자 흐름, 상태 전이, view contract, 전역 UI 규칙을 안정화하는 것이다. 이후 해당 프론트 코드를 기준선으로 삼아 Java 백엔드와 Python AI 서비스를 순차적으로 설계하고 연동한다.

Java 백엔드는 인증, 권한, 사용자, 영속 데이터, 트랜잭션, 기본 비즈니스 로직을 담당하는 운영 백엔드로 설계한다. Python AI 서비스는 분류, 회귀, 데이터마이닝, 판단 로직, 알고리즘 기반 추천과 추론을 담당하며, 필요 시 BigQuery와 비동기 작업 흐름을 포함하는 독립 서비스로 설계한다. 프론트엔드는 이들 백엔드 구현보다 먼저 완성하되, 실제 서버 구현에 종속되지 않도록 mock contract, adapter 계층, env 기반 mock/live switch, feature state machine을 먼저 고정한다.

