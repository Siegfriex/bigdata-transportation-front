# 탈수있나 Code-Based FSD 문서 허브 v1.0

> 목적: 기존 단일 FSD 초안을 역할별 문서 체계로 분리한 뒤, 어떤 문서를 언제 읽어야 하는지 안내한다.
> 작성일: 2026-05-27
> 기준 커밋: `d928788` (`frontend/main`) + 로컬 안정화 패치

## 1. 최종 문서 체계

기존 초안은 “현재 코드 전수조사 보고서 + 리팩토링 가이드 + 아키텍처 규약”이 한 파일에 함께 들어가 있었다. 최종 체계에서는 문서 목적을 다음 세 가지로 분리한다.

| 문서 | 목적 | 독자 |
|---|---|---|
| `docs/talsu_inna_fsd_current.md` | 현재 구현 사실 기준 기능 명세 | PM, 디자이너, QA, 프론트 개발자 |
| `docs/talsu_inna_architecture_rules.md` | FSD-style 프론트엔드 구조 규약 | 프론트 개발자, 리뷰어, AI coding agent |
| `docs/talsu_inna_refactor_plan.md` | 단계별 리팩토링 실행 로드맵 | 작업 담당자, 리뷰어 |
| `docs/talsu_inna_agent_doc_prompts.md` | 세 문서를 코드 근거 기반으로 갱신하기 위한 에이전트 프롬프트 세트 | AI coding agent, 문서 관리자 |
| `docs/talsu_inna_google_maps_platform_plan.md` | Google Maps Platform 도입 개발계획, API 경계, 보안/QA 기준 | 프론트 개발자, 백엔드 개발자, PM |

## 2. 문서별 책임

| 문서 | 포함 | 제외 |
|---|---|---|
| Current FSD | 현재 기능, 기능 ID, 하위 기능, 사용자 플로우, 상태 모델, 비즈니스 규칙, Out of Scope, QA 기준 | 목표 디렉터리, FSD 의존 규칙, 세부 refactor phase |
| Architecture Rules | MiriArt 레퍼런스에서 가져올 패턴, 버릴 패턴, 레이어 책임, page contract, 하드코딩 금지, token/state/API/cache 규칙 | 현재 기능의 세부 수용 기준 |
| Refactor Plan | phase별 작업, 산출물, 완료 기준, smoke 기준 | 기능 설명 본문, 아키텍처 결정의 상세 근거 |
| Agent Prompt Set | 문서별 조사 범위, 출력 포맷, 수정 제약, 완료 보고 형식 | 실제 기능/아키텍처/phase 본문 |
| Google Maps Platform Plan | 지도 SDK/API 도입 범위, 키 보안, 서버 proxy, 단계별 지도 전환 계획 | 현재 기능 상세, 일반 리팩토링 전체 phase |

## 3. 주요 결정

| 결정 | 내용 |
|---|---|
| 제목 변경 | 기능 명세 성격은 `Current-State Functional Specification`으로 명확히 분리했다. |
| page 규칙 강화 | `pages/*/ui/Page.tsx`는 data_insight에서 금지한다. page는 `pages/*/index.tsx` 수준의 조합 파일이다. |
| MiriArt 적용 방식 | MiriArt 현 코드 176개 파일에서 패턴을 추출하되, page 직접 UI 소유와 거대 API client 관성은 버린다. |
| 현재/목표 시점 분리 | 현재 구현 사실은 current FSD, 목표 구조는 architecture rules, 이동 순서는 refactor plan으로 나눈다. |
| 추적성 강화 | 기능 ID를 F5.1 같은 하위 기능으로 확장하고 QA 기준에 기능 ID를 연결했다. |
| 비즈니스 규칙 분리 | 저장 중복, selectedPlan 유지, AI fallback 등은 `BR-*`로 관리한다. |
| 제외 범위 명시 | GPS, 실제 지도 SDK, 실계정 로그인, 서버 저장, 공공데이터 live 연동은 v1 범위 밖으로 고정했다. |
| Google Maps 도입 방향 | Google Maps는 base map/search/route geometry로 사용하고, 탈수있나의 탑승가능성/혼잡/실패복구 판단 엔진은 독립 유지한다. |

## 4. 바로 읽을 순서

1. 현재 동작을 확인할 때: `docs/talsu_inna_fsd_current.md`
2. 새 코드를 어디에 둘지 판단할 때: `docs/talsu_inna_architecture_rules.md`
3. 리팩토링 작업 순서를 잡을 때: `docs/talsu_inna_refactor_plan.md`
4. Google Maps Platform 도입 작업을 할 때: `docs/talsu_inna_google_maps_platform_plan.md`
5. 에이전트에게 문서 갱신 작업을 맡길 때: `docs/talsu_inna_agent_doc_prompts.md`

## 5. 변경 관리 규칙

| 상황 | 수정할 문서 |
|---|---|
| 현재 기능 동작, 상태, 수용 기준이 바뀜 | `talsu_inna_fsd_current.md` |
| 레이어 책임, page contract, 금지사항이 바뀜 | `talsu_inna_architecture_rules.md` |
| 작업 순서, phase, 완료 기준이 바뀜 | `talsu_inna_refactor_plan.md` |
| Google Maps API, 키 정책, 지도 전환 단계가 바뀜 | `talsu_inna_google_maps_platform_plan.md` |
| 문서 체계나 링크가 바뀜 | `talsu_inna_code_based_fsd_v1.md` |
| 에이전트 문서화 작업 방식, 조사 범위, 출력 포맷이 바뀜 | `talsu_inna_agent_doc_prompts.md` |

## 6. 최종 기준

신규 기능 또는 리팩토링 PR은 다음 세 가지 질문에 답해야 한다.

| 질문 | 기준 문서 |
|---|---|
| 이 기능은 현재 F ID 또는 새 F ID 중 어디에 속하는가? | `talsu_inna_fsd_current.md` |
| 새 파일은 FSD 레이어와 page contract를 지키는가? | `talsu_inna_architecture_rules.md` |
| 이 변경은 어떤 phase의 어떤 완료 기준을 만족시키는가? | `talsu_inna_refactor_plan.md` |
