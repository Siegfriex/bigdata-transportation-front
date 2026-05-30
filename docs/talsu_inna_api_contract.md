# 탈수있나 API Contract

> 목적: React frontend가 기대하는 API contract를 현재 상태 모델에서 출발해 고정한다. 이 문서는 FastAPI 모델링 계획이 아니라 FE/BE/AI 정합성 계약이다.
> SSOT: `docs/deep-research-report.md`

## 1. 확정 시스템 경계

| 영역 | 현재 책임 |
|---|---|
| React frontend | 화면, 상태, mock route/report/station, localStorage, `/api/chat` client |
| Vercel Function/Express | 현재 `POST /api/chat` adapter, Gemini/fallback responder |
| Java/Spring Boot Core API | `/api/v1` 공개 API, 사용자, preferences, station identity, route plan 저장, decision orchestration, immutable saved report, feedback, auth, provider proxy |
| Python/FastAPI Decision API | internal-only 모델 추론, decision score, evidence, fallback metadata, explanation용 structured response |

## 2. Contract 원칙

1. 현재 프론트 entity/view model을 출발점으로 삼되 DB schema로 그대로 복사하지 않는다.
2. Spring Boot는 제품 데이터와 영속성의 기본 소유자가 된다.
3. FastAPI는 모델 inference와 decision evidence를 소유하고 사용자 계정/리포트 영속성은 소유하지 않는다.
4. `/api/chat`은 현재 FE 배포용 adapter이며, `/api/v1/decision/chat`으로 이전 후 legacy alias로만 유지한다.
5. 모든 server response는 runtime validation을 통과한 뒤 UI에 들어간다.
6. Browser는 Spring Boot만 호출한다. FastAPI와 외부 provider API는 browser에 노출하지 않는다.

## 2-1. API Version / Envelope 결정

공개 API는 `/api/v1/...`로 시작한다. 성공 응답은 `data/meta` envelope를 기본으로 한다.

```json
{
  "data": {},
  "meta": {
    "requestId": "req_01J...",
    "servedAt": "2026-05-30T19:00:00+09:00"
  }
}
```

오류 응답은 Spring `ProblemDetail`/RFC 9457 계열과 Cariv식 `code/message/status`를 합친 hybrid envelope를 쓴다.

```json
{
  "type": "https://api.talsuinna.com/problems/route-plan-invalid",
  "title": "Route plan request is invalid",
  "status": 400,
  "detail": "출발역과 도착역이 필요합니다.",
  "instance": "/api/v1/route-plans",
  "code": "TSL-ROUTE-001",
  "message": "출발역과 도착역이 필요합니다.",
  "requestId": "req_01J...",
  "retryable": false,
  "details": [
    { "field": "originCanonicalStationId", "message": "required" }
  ]
}
```

### Error Code Registry 초안

| Prefix | Domain | 예시 |
|---|---|---|
| `TSL-COMMON` | 공통 validation, unknown error, rate limit | `TSL-COMMON-001` |
| `TSL-AUTH` | 인증, refresh, logout, token exchange | `TSL-AUTH-001` |
| `TSL-STATION` | station 검색, provider mapping, catalog | `TSL-STATION-001` |
| `TSL-ROUTE` | route preview request/adapter | `TSL-ROUTE-001` |
| `TSL-DECISION` | decision inference, FastAPI timeout/fallback | `TSL-DECISION-001` |
| `TSL-REPORT` | report 저장/조회/삭제/snapshot | `TSL-REPORT-001` |
| `TSL-PREFERENCE` | user preference validation/sync | `TSL-PREFERENCE-001` |
| `TSL-FEEDBACK` | model feedback event | `TSL-FEEDBACK-001` |

### Error Code Seed

| Code | HTTP | Meaning | Client action |
|---|---:|---|---|
| `TSL-COMMON-001` | 400 | request validation failed | field error 표시 |
| `TSL-COMMON-002` | 429 | rate limit exceeded | 잠시 후 재시도 |
| `TSL-AUTH-001` | 401 | access token missing/expired | P1 auth 도입 후 refresh 또는 로그인 |
| `TSL-STATION-001` | 404 | station not found | 검색어 수정 유도 |
| `TSL-ROUTE-001` | 400 | invalid route preview input | 출발/도착/시간 입력 확인 |
| `TSL-ROUTE-002` | 422 | no route candidate | fallback route 안내 |
| `TSL-DECISION-001` | 502 | FastAPI decision unavailable | public baseline/mock fallback |
| `TSL-DECISION-002` | 504 | decision timeout | `fallback.used`와 degraded state 표시 |
| `TSL-REPORT-001` | 404 | report not found | archive 목록 갱신 |
| `TSL-REPORT-002` | 409 | duplicate report save | 기존 저장 리포트 안내 |
| `TSL-PREFERENCE-001` | 400 | invalid preference value | 설정 form validation |
| `TSL-FEEDBACK-001` | 400 | invalid feedback event | 피드백 재입력 |

## 3. 현재 구현된 Contract: `POST /api/chat`

### Request

```json
{
  "message": "9시까지 도착 가능해?",
  "context": {
    "startStation": "염창역",
    "endStation": "여의도역",
    "deadlineTime": "09:00",
    "preferences": {
      "home": "염창역",
      "work": "여의도역",
      "crowdSensitivity": "normal",
      "maxTaxiFee": 10000,
      "walkLimitMin": 15,
      "useBike": true,
      "aiStyle": "detailed",
      "favoriteRoutes": ["염창역 → 여의도역"]
    }
  }
}
```

Rules: `message`는 필수 non-empty string이며 2000자 이하. `context`는 optional object다. preferences enum은 `crowdSensitivity: low|normal|high`, `aiStyle: brief|detailed|emergency`만 허용한다.

### Response

```json
{
  "textAnswer": "Korean markdown-like answer",
  "suggestedReportType": "deadline",
  "startStation": "염창역",
  "endStation": "여의도역",
  "recommendedCarNo": "3-3",
  "routeIndex": 0
}
```

Rules: `textAnswer`는 필수 non-empty string. `suggestedReportType`은 `boarding|carriage|deadline|recovery|null`. 나머지는 optional이며 frontend는 누락 시 현재 route context 또는 default를 사용한다.

User-facing copy rules:

| 금지 | 이유 |
|---|---|
| raw id: `srpt_...`, `drpt_...`, `rpln_...`, `plan_a`, `strategy_1` | 사용자에게 의미 없는 내부 식별자 |
| raw enum: `boarding`, `carriage`, `deadline`, `recovery` | 화면에는 `탑승가능성 리포트` 같은 사람용 label 사용 |
| `반갑습니다`, `챗봇입니다`, `브리핑 종료` | 현재 전략 근거 설명 layer의 목적과 맞지 않음 |
| emoji prefix, 제품 홍보성 자기소개 | 제품 톤과 QA 금지어 정책 위반 |

`/api/chat` 또는 target `/api/v1/decision/chat` 실패는 decision failure가 아니다. FE는 기존 `selectedPlanId`, `selectedStrategyId`, `decisionReportId`, saved snapshot context를 유지하고 fallback/retry만 표시해야 한다.

### Error

```json
{ "error": "message is required" }
```

400: request validation 또는 JSON parse 실패. 405: Vercel Function에서 POST 외 method. 500: Gemini/server 실패.

## 4. Frontend View Contracts

| Contract | 현재 frontend type | BE/AI 사용 |
|---|---|---|
| Station | `StationNode` | station catalog, live context, map adapter |
| Route plan | `RoutePlan` | route alternatives response |
| Report | `SavedReport`, `ReportType` | report save/list/detail, immutable snapshot restore |
| Preferences | `UserPreferences` | user defaults and routing preferences |
| Chat | `ChatMessage`, `AiChatResponse` | chat/session and decision action result |

## 4-0. Public DTO Draft

### Public ID Policy

Public DTO의 ID는 pure ULID가 아니라 domain prefix가 붙은 문자열이다. DB public ID 컬럼도 `VARCHAR(40)` 이상으로 맞춘다.

| DTO field | Example | DB field |
|---|---|---|
| `canonicalStationId` | `stn_01J...` | `stations.canonical_station_id` |
| `routePlanId` | `rpln_01J...` | `route_plans.route_plan_id` |
| `optionId`, `routeOptionId` | `ropt_01J...` | `route_plan_options.route_option_id` |
| `decisionReportId` | `drpt_01J...` | `decision_reports.decision_report_id` |
| `savedReportId` | `srpt_01J...` | `saved_reports.saved_report_id` |
| `eventId` | `fb_01J...` | `model_feedback.event_id` |

### Station DTO

```json
{
  "canonicalStationId": "stn_01J...",
  "canonicalName": "염창역",
  "displayName": "염창역",
  "lineCode": "9",
  "type": "METRO",
  "lat": 37.5469,
  "lng": 126.8747,
  "ui": {
    "mockX": 60,
    "mockY": 180
  },
  "availability": {
    "bikesAvailable": 15,
    "busesAvailable": 3,
    "crowdLevel": "DANGER",
    "observedAt": "2026-05-30T19:00:00+09:00",
    "source": "MOCK"
  }
}
```

### Route Plan Request

```json
{
  "originCanonicalStationId": "stn_01J...",
  "destinationCanonicalStationId": "stn_01K...",
  "requestedDepartureAt": "2026-05-30T20:10:00+09:00",
  "deadlineAt": "2026-05-30T21:00:00+09:00",
  "preferences": {
    "walkingSpeedMps": 1.2,
    "minTransferBufferSec": 180,
    "stairsAvoid": false,
    "allowTightTransfer": false
  }
}
```

### Route Plan Response

```json
{
  "routePlanId": "rpln_01J...",
  "origin": { "canonicalStationId": "stn_01J...", "displayName": "염창역" },
  "destination": { "canonicalStationId": "stn_01K...", "displayName": "여의도역" },
  "options": [
    {
      "optionId": "ropt_01J...",
      "rank": 1,
      "provider": "maps_primary",
      "durationSec": 1860,
      "walkSec": 420,
      "transferCount": 1,
      "fare": 1450,
      "providerOptionId": "ext_...",
      "providerSnapshotAt": "2026-05-30T20:10:05+09:00"
    }
  ]
}
```

### Report Save Request

```json
{
  "reportType": "deadline",
  "title": "9시 마감 출근 리포트",
  "decisionReportId": "drpt_01J...",
  "clientContext": {
    "source": "map_overlay",
    "savedAtClient": "2026-05-30T19:00:00+09:00"
  }
}
```

서버는 `decisionReportId`를 기준으로 route/provider/decision/model/evidence snapshot을 생성해 `saved_reports`에 immutable archive로 저장한다.

## 4-1. Target Decision Response Contract

FastAPI internal decision response는 Spring Boot가 받아 공개 API response로 재포장한다. 최소 필드는 다음과 같다. Public response에도 `modelVersion`, `featureSchemaVersion`, `calibrationVersion`, `confidence`, `fallback`, `evidence`를 유지한다.

```json
{
  "decisionReportId": "drpt_01J...",
  "decisionCode": "GO",
  "decisionLabel": "탈 수 있음",
  "confidence": 0.82,
  "confidenceBand": "MEDIUM",
  "modelVersion": "decision-public-v1.2.0",
  "featureSchemaVersion": "fsv_2026_06_01",
  "calibrationVersion": "temp-scale-2026-06-01",
  "dataFreshnessSeconds": 42,
  "fallback": {
    "used": false,
    "strategy": null,
    "reason": null
  },
  "summary": "환승 여유가 충분하고 마감 시각 이전 도착 가능성이 높습니다.",
  "recommendedActions": ["출발 3분 전까지 승강장 진입 권장"],
  "evidence": [
    {
      "evidenceId": "evd_01J...",
      "kind": "ROUTE_METRIC",
      "field": "transferSlackSeconds",
      "value": 240,
      "display": "환승 여유 4분",
      "provider": "maps_primary",
      "observedAt": "2026-05-30T20:10:05+09:00",
      "sourceSnapshotId": "snap_01J..."
    }
  ]
}
```

FastAPI 내부 Pydantic alias는 camelCase를 기준으로 한다. 내부 응답에서 `fallbackUsed: "none|public_baseline|heuristic|cached_last_good|explain_only"`를 쓰더라도 Spring public API에서는 위처럼 `fallback.used/strategy/reason` object로 정규화한다.

### Feedback Event Contract

`POST /api/v1/feedback/model`은 label reconstruction을 위해 served metadata를 보존한다.

```json
{
  "eventId": "fb_20260530_af21",
  "decisionReportId": "drpt_01J...",
  "routeOptionId": "ropt_01J...",
  "servedModelVersion": "ranker-2026-06-15.prod",
  "servedFeatureSchemaVersion": "fsv_2026_06_01",
  "servedCalibrationVersion": "temp-scale-2026-06-01",
  "fallbackUsed": "none",
  "selected": true,
  "completed": true,
  "arrivedBeforeDeadline": true,
  "observedEtaMinutes": 24.7,
  "transferFailed": false,
  "boardedFirstVehicle": true,
  "observedCongestionLevel": "MEDIUM",
  "userRating": 4,
  "feedbackType": "implicit_plus_explicit",
  "occurredAt": "2026-05-30T10:49:33+09:00"
}
```

Spring Boot는 feedback event를 OLTP `model_feedback`에 저장하고, ML 학습/모니터링용 event는 Pub/Sub/BigQuery로 비동기 적재한다.

### Structured Chat Response

`POST /api/v1/decision/chat`은 장기적으로 기존 `AiChatResponse`를 다음 shape로 확장한다.

```json
{
  "text": "요약 답변 본문",
  "summary": "9시 도착은 택시 선탑승 + 급행 조합이 가장 안전합니다.",
  "sections": [
    {
      "title": "추천 판단",
      "body": "Plan A의 deadline success가 가장 높습니다."
    }
  ],
  "groundingUrls": [],
  "quickReplies": ["리포트 저장", "다른 경로 보기"],
  "suggestedAction": {
    "type": "SHOW_REPORT",
    "reportType": "deadline",
    "routeOptionId": "opt_01"
  }
}
```

## 5. Spring Boot Core API 책임

Spring Boot 후보 책임: user/preferences, station catalog and canonical ID, route provider adapter orchestration, route candidate generation, route plan and option persistence, selected route option + feature context 구성, saved report CRUD, API auth, public transport API proxy, FastAPI 호출 orchestration, audit/error envelope, idempotency.

Spring Boot가 직접 소유하지 말아야 할 것: ML feature training, SK calibration, model registry, model promotion logic.

### Spring Boot Module Boundary

```text
com.talsuinna
  common
    api
    error
    security
    config
  station
  route
  decision
  report
  preference
  feedback
  auth
  provider
    publictransit
    maps
    sk
  infra
    fastapi
    cache
    persistence
```

Swagger/OpenAPI tag도 이 모듈 경계를 따른다. `station`, `route`, `decision`, `report`, `preference`, `feedback`, `auth`는 공개 `/api/v1` tag가 되고, `infra.fastapi`는 browser에 노출되지 않는 internal client 계층이다.

## 6. FastAPI Decision API 책임

FastAPI 후보 책임: Spring Boot가 넘긴 `routePlanId`, `routeOptionId`, selected route option, provider freshness, transfer slack, delay/crowding feature, user preference context를 기반으로 boarding risk, deadline success, transfer/carriage guidance, recovery decision, model evidence, fallback decision, `modelVersion`/`featureSchemaVersion`/`calibrationVersion` metadata를 계산한다.

FastAPI가 소유하지 않아야 할 것: OTP/GTFS/GTFS-RT/Maps/SK route provider orchestration, route candidate generation, route/provider snapshot 저장, 사용자 계정, preferences 원본, saved report canonical record, Spring 운영 DB의 canonical row. 필요한 inference log, model feedback, anonymized evaluation event는 Spring Boot가 저장하거나 ML 전용 로그/feature store로 분리한다.

## 7. Fallback 정책

| 장애 | 현재 동작 | 목표 |
|---|---|---|
| Gemini key 없음 | heuristic server fallback | demo availability 유지 |
| `/api/chat` 실패 | client fallback message 적용 | 사용자에게 최소 기능 제공 |
| schema mismatch | validation error로 실패 처리 | UI raw response 의존 금지 |
| FastAPI 장애 | 계획 | Spring Boot 또는 FE가 stale/mock/fallback decision 사용 |

## 7-1. 보안/트랜잭션 규칙

| 항목 | 결정 |
|---|---|
| Browser 호출 | Spring Boot Core API만 호출 |
| FastAPI 호출 | Spring Boot service account가 internal URL로 호출 |
| User ID | request body/query에서 신뢰하지 않고 Principal/JWT subject에서 해석 |
| OAuth 도입 시 | Authorization Code + PKCE + state/nonce. redirect URL에는 token을 싣지 않음 |
| Refresh/logout | refresh rotation, logout 시 server-side refresh state invalidation |
| JWT validation | expected algorithm을 명시적으로 검증 |
| Route transaction | request row 저장 TX -> provider call no TX -> option save TX |
| Decision transaction | FastAPI call no TX -> `decision_reports` save TX |
| Save transaction | `POST /api/v1/reports`, `POST /api/v1/feedback/model`는 idempotent write TX |
| Idempotency | 쓰기 endpoint는 `Idempotency-Key` 지원. 중복 저장은 409 또는 기존 resource 반환 |
| Secret | server secret은 GCP Secret Manager, FE 공개값만 Vercel env |
| Analytics | Pub/Sub/BigQuery 적재는 비동기이며 OLTP transaction과 분리 |

## 7-2. Contract Freeze Checklist

| Check | 기준 |
|---|---|
| OpenAPI tag | Spring Boot module boundary와 동일 |
| Envelope | 모든 신규 `/api/v1` response는 `data/meta` 또는 error envelope 사용 |
| Legacy alias | `/api/chat`은 `/api/v1/decision/chat` migration 전까지만 유지 |
| External-call split | provider/AI external call은 DB TX 밖에서 수행 |
| Route storage | `route-plans`는 request/options를 저장하되 provider/AI 호출은 TX 밖에서 수행 |
| Snapshot save | `POST /api/v1/reports`에서 route/provider/decision/model/evidence snapshot 생성 |
| Internal AI | `/internal/decision/*`은 browser route table에 노출 금지 |

## 8. 상태 표시

| 구분 | 표시 |
|---|---|
| 현재 코드와 동기화됨 | `/api/chat` request/response/error/fallback, FE view model |
| 계획성 | `/api/v1` Spring Boot Core API, internal FastAPI Decision API, model evidence |
| 미확정 | auth go-live 시점, BE-to-AI ID token 구현 세부, endpoint별 pagination/filter |
