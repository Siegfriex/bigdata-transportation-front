# 탈수있나 API Contract

> 목적: React frontend가 기대하는 API contract를 현재 상태 모델에서 출발해 고정한다. 이 문서는 FastAPI 모델링 계획이 아니라 FE/BE/AI 정합성 계약이다.
> SSOT: `docs/deep-research-report.md`

## 1. 확정 시스템 경계

| 영역 | 현재 책임 |
|---|---|
| React frontend | 화면, 상태, mock route/report/station, localStorage, `/api/chat` client |
| Vercel Function/Express | 현재 `POST /api/chat` adapter, Gemini/fallback responder |
| Java/Spring Boot Core API | 공개 API, 사용자, preferences, station, route preview orchestration, report snapshot 저장, feedback, auth, provider proxy |
| Python/FastAPI Decision API | internal-only 모델 추론, decision score, evidence, fallback metadata, explanation용 structured response |

## 2. Contract 원칙

1. 현재 프론트 entity/view model을 출발점으로 삼되 DB schema로 확정하지 않는다.
2. Spring Boot는 제품 데이터와 영속성의 기본 소유자가 된다.
3. FastAPI는 모델 inference와 decision evidence를 소유하고 사용자 계정/리포트 영속성은 소유하지 않는다.
4. `/api/chat`은 현재 FE 배포용 adapter이며, `/api/v1/decision/chat`으로 이전 후 legacy alias로만 유지한다.
5. 모든 server response는 runtime validation을 통과한 뒤 UI에 들어간다.
6. Browser는 Spring Boot만 호출한다. FastAPI와 외부 provider API는 browser에 노출하지 않는다.

## 2-1. API Version / Envelope 결정

공개 API는 `/api/v1/...`로 시작한다. 성공/실패 응답은 다음 envelope를 기본으로 한다.

```json
{
  "data": {},
  "meta": {
    "requestId": "req_01J...",
    "servedAt": "2026-05-30T19:00:00+09:00"
  }
}
```

```json
{
  "code": "TSL-ROUTE-002",
  "message": "출발역과 도착역이 필요합니다.",
  "status": 400,
  "details": [
    { "field": "originStationId", "message": "required" }
  ],
  "requestId": "req_01J..."
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
| `TSL-DECISION-002` | 504 | decision timeout | fallbackUsed 표시 |
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
| Report | `SavedReport`, `ReportType` | report save/list/detail |
| Preferences | `UserPreferences` | user defaults and routing preferences |
| Chat | `ChatMessage`, `AiChatResponse` | chat/session and decision action result |

## 4-0. Public DTO Draft

### Station DTO

```json
{
  "id": "st_yeomchang",
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

### Route Preview Request

```json
{
  "originStationId": "st_yeomchang",
  "destinationStationId": "st_yeouido",
  "deadlineTime": "09:00",
  "preferences": {
    "crowdSensitivity": "normal",
    "maxTaxiFee": 10000,
    "walkLimitMin": 15,
    "useBike": true
  }
}
```

### Route Preview Response Item

```json
{
  "routeOptionId": "opt_01",
  "name": "추천: 급행 지하철 안심 결합",
  "modes": ["subway", "walk"],
  "eta": "08:57",
  "expectedTotalMinutes": 17,
  "extraCost": 1400,
  "risk": "MEDIUM",
  "crowd": "CROWDED",
  "confidence": "REALTIME",
  "description": "3-3번, 6-1번 생존 칸을 선택합니다.",
  "timeline": [
    {
      "legOrder": 1,
      "mode": "walk",
      "detail": "염창역 승강장 이동",
      "durationMinutes": 3,
      "cost": 0
    }
  ],
  "providerPayloadRef": null
}
```

### Report Save Request

```json
{
  "reportType": "deadline",
  "title": "9시 마감 출근 리포트",
  "routePreview": {},
  "decisionPreview": {},
  "clientContext": {
    "source": "map_overlay",
    "savedAtClient": "2026-05-30T19:00:00+09:00"
  }
}
```

`routePreview`와 `decisionPreview`는 직전 preview response의 snapshot이다. 서버는 이를 그대로 신뢰하지 않고, 필요한 최소 validation과 user/context 검증을 수행한 뒤 canonical snapshot으로 저장한다.

## 4-1. Target Decision Response Contract

FastAPI internal decision response는 Spring Boot가 받아 공개 API response로 재포장한다. 최소 필드는 다음과 같다.

```json
{
  "requestId": "req_01J...",
  "modelVersion": "deadline-success-public-v1",
  "featureSchemaVersion": "route-report-v1",
  "confidence": 0.84,
  "fallbackUsed": "PUBLIC_BASELINE",
  "decision": {
    "deadlineSuccessProbability": 0.87,
    "boardingRiskProbability": 0.23,
    "transferFailureProbability": 0.15,
    "recommendedBoardingStrategy": "WAIT_NEXT_TRAIN",
    "recommendedCarIndex": 4,
    "expectedArrivalMinutes": 36
  },
  "evidence": {
    "topFactors": ["환승 버퍼 2분 미만"],
    "missingSignals": ["실시간 칸별 혼잡도 없음"],
    "providerFreshnessSec": 41,
    "providerSnapshotAt": "2026-05-30T19:00:00+09:00"
  }
}
```

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

Spring Boot 후보 책임: user/preferences, station catalog, saved report CRUD, route-plan request aggregation, API auth, public transport API proxy, FastAPI 호출 orchestration, audit/error envelope.

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

FastAPI 후보 책임: boarding risk, deadline success, transfer/carriage guidance, recovery decision, model evidence, fallback decision, model version metadata.

FastAPI가 기본 저장하지 않아야 할 것: 사용자 계정, preferences 원본, saved report canonical record. 저장 가능성이 있는 것: inference log, model feedback label, anonymized evaluation event.

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
| OAuth 도입 시 | redirect URL에는 token을 싣지 않고 one-time code 교환 API 사용 |
| Preview transaction | route/decision/chat preview는 DB write transaction을 잡지 않음 |
| Save transaction | `POST /api/v1/reports`, `POST /api/v1/feedback/model`만 영속 transaction |
| Secret | server secret은 GCP Secret Manager, FE 공개값만 Vercel env |

## 7-2. Contract Freeze Checklist

| Check | 기준 |
|---|---|
| OpenAPI tag | Spring Boot module boundary와 동일 |
| Envelope | 모든 신규 `/api/v1` response는 `data/meta` 또는 error envelope 사용 |
| Legacy alias | `/api/chat`은 `/api/v1/decision/chat` migration 전까지만 유지 |
| Preview/save split | `route-plans`, `decision/route-report`에서 DB write 금지 |
| Snapshot save | `POST /api/v1/reports`에서 route/decision snapshot 생성 |
| Internal AI | `/internal/decision/*`은 browser route table에 노출 금지 |

## 8. 상태 표시

| 구분 | 표시 |
|---|---|
| 현재 코드와 동기화됨 | `/api/chat` request/response/error/fallback, FE view model |
| 계획성 | `/api/v1` Spring Boot Core API, internal FastAPI Decision API, model evidence |
| 미확정 | auth go-live 시점, BE-to-AI ID token 구현 세부, endpoint별 pagination/filter |
