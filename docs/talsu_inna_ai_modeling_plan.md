# 탈수있나 AI Modeling Plan

> 목적: `docs/reference/talsu_inna_ai_python_modeling_v5.md`의 모델링 전략을 `deep-research-report.md` 결정에 맞춰 운영 계획으로 정리한다. 이 문서는 public API contract 확정 문서가 아니다.
> SSOT: `docs/deep-research-report.md`

## 1. 범위

대상은 Python/FastAPI Decision API 내부 모델링 계획이다. 프론트/백엔드 endpoint 계약은 `talsu_inna_api_contract.md`, `talsu_inna_api_endpoints.md`에서 관리한다.

## 2. 핵심 전략

공공 데이터로 저비용 baseline과 feature engineering을 먼저 만들고, SK API 데이터는 고품질 target, hold-out test, calibration, fine-tuning에 사용한다. 운영에서는 공공 실시간값과 SK pattern/cache를 결합하고, SK 장애나 비용 제한 시 public baseline fallback을 유지한다.

## 3. 모델 후보

| 모델 | Public baseline | SK 필요성 | 목적 |
|---|---|---|---|
| Boarding Risk | 가능 | 고도화 필요 | 이번 차/다음 차 탑승 가능성 |
| Transfer Failure | 가능 | 고도화 필요 | 환승 실패/지연 위험 |
| Deadline Success | 가능 | 고도화 필요 | 마감 시간 도착 가능성 |
| ETA Error Regressor | 일부 가능 | 운영 로그/SK 필요 | ETA 보정 |
| Train Congestion | 불가 | 필수 | 열차 혼잡 예측 |
| Car Congestion | 불가 | 필수 | 칸별 혼잡 예측 |
| Car Guide Ranker | 불가 | 필수 + user feedback | 생존 칸 추천 ranking |

우선순위는 `Deadline Success`를 P0로 둔다. 제품 데모에서 "정해진 시간까지 도착 가능한가"가 가장 직접적인 가치이고, 현재 FE도 deadline/report 중심 UX를 이미 갖고 있기 때문이다. 그 다음은 `Boarding Risk`, `Transfer Failure`, `ETA Error`, `Car Guide Ranker` 순서로 확장한다.

## 4. Feature 전략

Public feature 후보: route id, station id, day/time bucket, headway, scheduled ETA, transfer count, walk time, buffer minutes, public delay/crowding proxy.

SK-enhanced feature 후보: train congestion, car congestion, car alighting rate, rolling congestion, station/time pattern, missing flag. SK feature가 없으면 0으로 채우지 않고 missing flag를 둔다.

## 5. Target 정책

| target | source | 비고 |
|---|---|---|
| public proxy labels | public schedule/API + rules | baseline용 |
| train congestion pct | SK train congestion | direct/high-quality |
| car congestion score/level | SK car-level data | 칸별 모델 |
| car alighting rate | SK alighting stats | 환승/하차 보정 |
| user feedback labels | saved report/action feedback | ranker/evaluation 후보 |

## 6. Pipeline

1. Public baseline: public data ingestion, feature build, baseline model, feature importance.
2. SK hold-out test: SK target 생성, baseline 성능 측정.
3. Calibration: public prediction을 SK true/proxy label로 보정.
4. Fine-tuning: public + SK combined dataset, hold-out 평가.
5. Production: public realtime + cached SK pattern enrichment, fallback/evidence 제공.

## 7. Promotion / Evaluation

Promotion은 모델별 threshold를 별도 관리한다. 공통 원칙은 fallback engine보다 나빠지지 않아야 하며, calibration set과 test set은 분리한다. model version과 feature schema version을 기록한다.

## 8. FastAPI Decision API 내부 책임

FastAPI는 feature builder, inference wrapper, model registry lookup, fallback decision, evidence generation, model log/feedback hook을 소유한다. 사용자 계정/저장 리포트 canonical DB는 Spring Boot 소유로 둔다.

## 8-1. Inference Response 원칙

모든 inference 응답에는 최소한 `modelVersion`, `featureSchemaVersion`, `confidence`, `fallbackUsed`, `decision`, `evidence`를 포함한다. LLM은 numeric decision을 직접 만들지 않고, decision/evidence를 설명하는 explanation layer로 제한한다.

```json
{
  "requestId": "req_01J...",
  "reportId": "rpt_preview_01J...",
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
  },
  "alternatives": [
    {
      "routeOptionId": "opt_2",
      "deadlineSuccessProbability": 0.91,
      "tradeoff": "도보 4분 증가"
    }
  ]
}
```

## 8-2. Internal Endpoint Boundary

| Endpoint | 역할 |
|---|---|
| `GET /internal/health` | FastAPI service/model readiness |
| `POST /internal/decision/route-report` | numeric/probabilistic decision + evidence |
| `POST /internal/decision/chat` | decision/evidence를 바탕으로 structured explanation 생성 |

FastAPI는 canonical DB write를 하지 않는다. 필요한 inference log나 model feedback event는 Spring Boot가 별도 저장하거나, ML 전용 로그/feature store로 분리한다.

## 9. 상태 표시

| 구분 | 표시 |
|---|---|
| 현재 코드와 동기화됨 | 프론트 report type과 decision target 방향 |
| 계획성 | Deadline Success public baseline, SK calibration/fine-tuning, FastAPI inference |
| 미확정 | 실제 데이터 접근권, 모델 종류, feature store, promotion threshold, 비용 정책 |
