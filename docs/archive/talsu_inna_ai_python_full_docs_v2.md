# 탈수있나 AI 측 Python/FastAPI 통합 문서 v2

**문서 유형:** AI-side Python/FastAPI Architecture + Model Engine Blueprint + API Contract + Feature Contract + Model Card + Evaluation/Fallback Policy
**서비스명:** 탈수있나
**대상 노드:** FastAPI Decision API + 내부 AI/ML 모델 레이어
**연동 대상:** Spring Boot Core API / React TypeScript Frontend / GCP Data & AI Infra
**작성 버전:** v2.0
**작성 목적:** 기존 AI 판단 서비스 블루프린트를 모델러·데이터사이언티스트 관점에서 재구조화하고, FastAPI/Python 계층이 단순 공공 API 호출 서버가 아니라 **데이터 기반 이동 판단 엔진**으로 작동하도록 전체 문서를 통합 업데이트한다.

---

## 0. 핵심 결론

탈수있나의 Python/FastAPI 계층은 단순히 서울버스, 경기버스, 지하철, 따릉이 API를 호출하는 서버가 아니다.
이 계층은 공공·민간 이동 데이터를 정규화하고, feature를 만들고, 규칙 기반 점수·ML 예측·제약 최적화·LLM 요약을 조합해 최종 이동 판단 리포트를 생성하는 **Decision / AI Engine Server**다.

최종 구조는 다음으로 고정한다.

```text
공공·민간 이동 데이터
→ Adapter
→ Normalizer
→ Feature Builder
→ Decision Engine
→ ML Model / Optimization
→ Evidence Builder
→ AI Narrative
→ 지도 위 리포트
```

FastAPI는 “AI 서버”라기보다 **이동 판단 엔진 서버**다.
내부 AI는 LLM 하나가 아니라 다음의 조합이다.

```text
규칙 기반 Score Engine
+ Supervised ML
+ Time-series Prediction
+ Graph / Constraint Optimization
+ LLM/NLP Report Narrative
```

---

## 1. FastAPI 측 역할 재정의

### 1.1 Spring / FastAPI / React 역할 분리

| 계층 | 기술 | 역할 |
|---|---|---|
| Frontend | TypeScript React | 지도, AI 오버레이, 리포트 레이어, 사용자 입력, 상태머신 |
| Core API | Java Spring Boot | 인증, 회원, 사용자 설정, 요청 이력, 리포트 저장, 알림, 정책 |
| Decision API | Python FastAPI | 외부 데이터 호출, 정규화, feature 생성, 모델 추론, 최적화, AI 리포트 |
| Data/AI Infra | GCP | Redis, BigQuery, Cloud Storage, Vertex AI, Pub/Sub, Cloud Run |

FastAPI는 Core DB를 직접 소유하지 않는다.
Spring이 사용자 식별, 권한, 저장 상태를 관리하고, FastAPI는 Spring으로부터 **비식별 조건 스냅샷**을 받아 계산한다.

---

## 2. FastAPI 8-Layer Architecture

FastAPI 내부는 아래 8개 층으로 고정한다.

| Layer | 역할 | 반드시 디벨롭할 항목 |
|---|---|---|
| 1. API Route Layer | Spring에서 호출하는 내부 endpoint | `/decision/boarding-report`, `/decision/car-guide`, `/decision/deadline-plan`, `/decision/recovery-plan`, `/chat/interpret`, `/report/summarize` |
| 2. Adapter Layer | 외부 공공·민간 API 호출 | 서울버스, 경기버스, 지하철, 따릉이, GTFS, 빠른하차, 빠른환승 adapter. 판단 로직 금지 |
| 3. Normalizer Layer | 외부 응답을 공통 schema로 변환 | `TransitArrival`, `BikeStation`, `GtfsStopTime`, `CongestionPattern` |
| 4. Feature Builder Layer | 모델·엔진 입력값 생성 | `eta_minutes`, `remaining_seats`, `congestion_rate`, `transfer_buffer_min`, `peak_hour_flag`, `data_confidence` |
| 5. Decision Engine Layer | 규칙 기반 판단·점수 계산 | Boarding, Car Guide, Deadline, Recovery별 score / objective / constraint |
| 6. ML Model Layer | 예측 모델 추론 | 탑승 실패위험, 환승 실패확률, 혼잡 예측, 칸별 쏠림 위험, 개인화 랭킹 |
| 7. Optimization Layer | 후보 경로 생성·제약 기반 랭킹 | NetworkX / OR-Tools 기반 그래프 탐색, deadline constraint, taxi tail 최적화 |
| 8. Evidence / Report Layer | 근거·신뢰도·자연어 리포트 | `dataLevel`, `confidence`, `sourceCode`, `modelVersion`, `warnings`를 모든 결과에 부착 |

---

## 3. 내부 AI 모델 문제 유형 분류

AI 모델을 모두 LLM으로 보지 않는다. 기능별 문제 유형을 다르게 정의한다.

| 모델/엔진 | 문제 유형 | MVP | 1차 고도화 | 최종 고도화 |
|---|---|---|---|---|
| Boarding Risk Model | 이진/순서형 분류 | 규칙 기반 score | Logistic Regression / RandomForest | LightGBM / XGBoost |
| Transfer Failure Model | 실패확률 예측 | 환승 여유시간 rule | Bayesian / Logistic | Monte Carlo simulation |
| Congestion Predictor | 회귀/순서형 분류/시계열 | 시간대별 패턴 테이블 | LightGBM | LSTM / GRU |
| Car Survival Score | 랭킹/스코어링 | 휴리스틱 점수 | Regression / Learning-to-rank | 민간 API·센서 결합 |
| Deadline Planner | 제약 최적화 | 후보 생성 + rule ranking | Multi-objective ranking | OR-Tools 최적화 |
| Recovery Planner | 그래프 탐색 + 비용 최적화 | GTFS 기반 막차/첫차 탐색 | 최소 택시 구간 산출 | 실시간 지연 반영 |
| Intent Classifier | NLP 분류 | LLM JSON 출력 | Rule + LLM hybrid | fine-tuned classifier |
| Report Narrative | 생성형 요약 | 템플릿 + LLM | RAG | 개인화 요약 |

---

## 4. Python 라이브러리 사용 기준

| 라이브러리 | 사용 여부 | 역할 | 온라인 요청 사용 |
|---|---:|---|---|
| Pydantic | 필수 | API schema, 정규화 DTO, 계약 검증 | 적극 사용 |
| NumPy | 필수 | 점수 계산, 비용함수, 벡터 연산 | 사용 |
| Pandas | 필수 | GTFS, 혼잡도, 승하차 패턴 전처리 | 온라인에서는 제한적 |
| Polars | 선택 | 대용량 CSV 처리 | 주로 배치 |
| GeoPandas / Shapely | 선택~권장 | 정류장·역·대여소 공간 매칭 | 주로 배치 |
| scikit-learn | 권장 | baseline 분류/회귀 | 추론 사용 |
| LightGBM / XGBoost | 권장 | tabular feature 기반 예측 | 추론 사용 |
| PyTorch / TensorFlow | 선택 | LSTM/GRU, 딥러닝 혼잡 예측 | 고도화 시 |
| NetworkX | 권장 | 대중교통 그래프 탐색 | MVP 가능 |
| OR-Tools | 권장 | 제약조건 최적화 | 고도화/핵심 플래너 |
| httpx / aiohttp | 필수 | 외부 API 비동기 호출 | 사용 |
| Redis client | 필수 | API 응답 캐싱 | 사용 |
| joblib | 권장 | 모델 artifact 로드 | 사용 |

핵심 원칙은 다음이다.

```text
Pydantic = 모든 입출력 계약
NumPy = 온라인 점수 계산
Pandas/Polars = 오프라인 전처리
scikit-learn/LightGBM = tabular 예측
NetworkX/OR-Tools = 경로·최적화
LLM = 판단이 아니라 설명
```

---

## 5. 기존 Python 호출 코드 처리 원칙

기존 공공 API 호출 Python 코드는 버리지 않는다.
다만 서비스 로직과 섞지 않고 `adapters/` 계층으로 격리한다.

### 5.1 나쁜 구조

```text
call_seoul_bus_api.py
→ raw JSON 받음
→ 임의 파싱
→ 바로 리포트 생성
```

### 5.2 좋은 구조

```text
adapters/seoul_bus_adapter.py
→ public API 호출

normalizers/bus_normalizer.py
→ 공통 TransitArrival schema로 변환

features/boarding_features.py
→ 탑승가능성 feature 생성

engines/boarding_engine.py
→ 탑승가능성 판단

report/report_builder.py
→ 리포트 JSON 생성
```

### 5.3 Adapter 예시

```python
class GyeonggiBusAdapter:
    async def get_arrivals(self, station_id: str, route_id: str) -> dict:
        # 기존 API 호출 코드 이관
        # 판단 로직 금지
        ...
```

### 5.4 Normalizer 예시

```python
class TransitArrival(BaseModel):
    provider: str
    mode: Literal["BUS", "SUBWAY"]
    route_id: str
    stop_id: str
    eta_minutes: int | None
    crowded_level: int | None
    remaining_seats: int | None
    data_level: Literal["REALTIME", "ESTIMATED", "PATTERN"]
```

### 5.5 Engine 예시

```python
def calculate_boarding_score(
    arrival: TransitArrival,
    user_pref: UserPreference,
) -> BoardingDecision:
    ...
```

---

## 6. FastAPI 디렉토리 구조

최종적으로 FastAPI 내부는 아래 구조로 관리한다.

```text
decision-api/
  app/
    main.py

    api/
      decision_routes.py
      chat_routes.py
      health_routes.py

    schemas/
      common.py
      decision_request.py
      decision_response.py
      feature_schema.py
      model_schema.py
      evidence_schema.py
      transit_schema.py
      report_schema.py

    adapters/
      seoul_bus_adapter.py
      gyeonggi_bus_adapter.py
      subway_arrival_adapter.py
      subway_congestion_adapter.py
      bike_adapter.py
      gtfs_adapter.py
      fast_exit_adapter.py
      fast_transfer_adapter.py
      map_adapter.py

    normalizers/
      bus_normalizer.py
      subway_normalizer.py
      bike_normalizer.py
      gtfs_normalizer.py
      congestion_normalizer.py
      evidence_normalizer.py

    features/
      common_features.py
      boarding_features.py
      car_guide_features.py
      deadline_features.py
      recovery_features.py
      intent_features.py

    engines/
      boarding_engine.py
      car_guide_engine.py
      deadline_planner.py
      recovery_planner.py

    models/
      boarding_risk_model.py
      transfer_failure_model.py
      congestion_predictor.py
      car_crowding_model.py
      intent_classifier.py
      model_registry.py
      evaluation.py
      calibration.py

    optimizers/
      route_candidate_generator.py
      multimodal_ranker.py
      taxi_tail_optimizer.py
      graph_search.py
      constraint_solver.py

    report/
      evidence_builder.py
      narrative_generator.py
      template_reporter.py
      followup_chip_builder.py

    infrastructure/
      redis_client.py
      bigquery_client.py
      gcs_model_store.py
      vertex_client.py
      cloud_logging.py
      settings.py

    exceptions/
      error_codes.py
      handlers.py
```

---

## 7. API Route Layer

### 7.1 Internal Endpoints

| # | Method | Path | Request Schema | Response Schema | Service |
|---:|---|---|---|---|---|
| 1 | POST | `/internal/v1/decision/boarding-report` | `BoardingReportRequest` | `DecisionReportResponse` | `boarding_engine.compute()` |
| 2 | POST | `/internal/v1/decision/car-guide` | `CarGuideRequest` | `DecisionReportResponse` | `car_guide_engine.compute()` |
| 3 | POST | `/internal/v1/decision/deadline-plan` | `DeadlinePlanRequest` | `DecisionReportResponse` | `deadline_planner.compute()` |
| 4 | POST | `/internal/v1/decision/recovery-plan` | `RecoveryPlanRequest` | `DecisionReportResponse` | `recovery_planner.compute()` |
| 5 | POST | `/internal/v1/chat/interpret` | `ChatInterpretRequest` | `ChatInterpretResponse` | `chat_orchestrator.interpret()` |
| 6 | POST | `/internal/v1/report/summarize` | `ReportSummarizeRequest` | `ReportNarrativeResponse` | `narrative_generator.summarize()` |
| 7 | GET | `/internal/v1/status` | — | `InternalStatusResponse` | `status_service` |
| 8 | GET | `/health` | — | `{"status": "ok"}` | `health` |

### 7.2 Route Layer 원칙

1. Spring만 호출한다.
2. userId, email, 실명 등 직접 식별정보를 받지 않는다.
3. 모든 요청에는 `request_id`를 포함한다.
4. 모든 응답에는 `dataLevel`, `confidence`, `evidence`가 포함된다.
5. HTTP 500을 남발하지 않고, no-solution은 가능하면 리포트 상태로 반환한다.

---

## 8. Common Schema Contract

### 8.1 Enum

```python
class DataLevel(str, Enum):
    REALTIME = "REALTIME"
    ESTIMATED = "ESTIMATED"
    PATTERN = "PATTERN"
    STATIC = "STATIC"
    CACHE = "CACHE"
    PREDICTED = "PREDICTED"
    AI_SUMMARY = "AI_SUMMARY"

class Confidence(str, Enum):
    HIGH = "HIGH"
    MEDIUM = "MEDIUM"
    LOW = "LOW"

class RiskLevel(str, Enum):
    LOW = "LOW"
    MEDIUM = "MEDIUM"
    HIGH = "HIGH"

class ReportType(str, Enum):
    BOARDING = "BOARDING"
    CAR_GUIDE = "CAR_GUIDE"
    DEADLINE_PLAN = "DEADLINE_PLAN"
    RECOVERY_PLAN = "RECOVERY_PLAN"
```

### 8.2 Common Data Structures

```python
class GeoPoint(BaseModel):
    lat: float
    lng: float
    label: str | None = None
    place_id: str | None = None

class UserContext(BaseModel):
    user_hash: str | None = None
    congestion_sensitivity: Literal["LOW", "MEDIUM", "HIGH"] = "MEDIUM"
    max_walk_minutes: int = 10
    max_taxi_fare: int = 0
    allow_bike: bool = False
    preference: Literal["FAST", "LOW_CROWD", "LOW_COST", "LOW_RISK", "DEADLINE"] = "FAST"

class BaseDecisionRequest(BaseModel):
    request_id: str
    user_context: UserContext
    origin: GeoPoint
    destination: GeoPoint
    requested_at: str
```

### 8.3 Evidence Schema

```python
class Evidence(BaseModel):
    source_code: str
    label: str
    data_level: DataLevel
    confidence: Confidence
    applied_to: str | None = None
    value_summary: str | None = None
    fetched_at: str | None = None
    model_version: str | None = None
    warnings: list[str] = []
```

### 8.4 Plan Schema

```python
class PlanStep(BaseModel):
    order: int
    mode: Literal["walk", "bus", "subway", "bike", "taxi", "wait"]
    from_label: str
    to_label: str
    duration_min: int | None = None
    cost: int | None = None
    data_level: DataLevel = DataLevel.ESTIMATED
    risk_level: RiskLevel | None = None
    action_hint: str | None = None
    evidence_refs: list[str] = []

class Plan(BaseModel):
    plan_id: str
    rank: int
    label: str
    eta: str | None
    extra_cost: int = 0
    risk_level: RiskLevel
    confidence: Confidence
    modes: list[str]
    steps: list[PlanStep]
```

### 8.5 Decision Report Response

```python
class Decision(BaseModel):
    code: str
    title: str
    summary: str

class DecisionReportResponse(BaseModel):
    request_id: str
    report_type: ReportType
    status: Literal["SUCCESS", "PARTIAL", "NO_SOLUTION", "FAILED"]
    decision: Decision
    plans: list[Plan] = []
    evidence: list[Evidence] = []
    follow_up_chips: list[str] = []
    warnings: list[str] = []
    feature_snapshot_id: str | None = None
    model_predictions: list["ModelPrediction"] = []
```

---

## 9. 추가해야 할 모델러용 공통 계약

기존 응답 구조에 아래 스키마를 추가한다.
이 스키마는 “왜 이 판단이 나왔는가?”를 나중에 추적하기 위한 핵심이다.

```python
class FeatureValue(BaseModel):
    name: str
    value: float | int | str | bool | None
    source_code: str
    data_level: DataLevel
    confidence: Confidence
    observed_at: str | None = None
    imputation: str | None = None
    unit: str | None = None
    allowed_range: str | None = None

class ModelPrediction(BaseModel):
    model_name: str
    model_version: str
    prediction_type: Literal["PROBABILITY", "SCORE", "RANK", "CLASS"]
    value: float | str | list
    confidence: Confidence
    risk_level: RiskLevel | None = None
    feature_snapshot_id: str | None = None
    explanation: list[str] = []

class DataQualityReport(BaseModel):
    source_code: str
    freshness_sec: int | None
    missing_fields: list[str] = []
    fallback_used: bool = False
    fallback_reason: str | None = None
    confidence: Confidence = Confidence.MEDIUM
```

---

## 10. Feature Contract

### 10.1 공통 Feature 명세

| Feature | dtype | 단위 | 허용범위 | 결측 처리 | sourceCode | 적용 |
|---|---|---|---|---|---|---|
| `eta_minutes` | int | min | 0~180 | API 없음 시 null | DS-BUS-ARR, DS-SUBWAY-ARR | 탑승/마감 |
| `wait_minutes` | int | min | 0~180 | eta로 대체 | 계산값 | 탑승/마감 |
| `remaining_seats` | int | count | -1~seat_capacity | 미제공 시 null | DS-GG-BUS-ARR | 탑승 |
| `crowded_level` | int | level | 1~4 | 미제공 시 추정 | DS-GG-BUS-ARR | 탑승 |
| `congestion_rate` | float | % | 0~250 | 시간대 평균 | DS-SUBWAY-CONG | 지하철/칸별 |
| `route_headway` | float | min | 0~120 | 시간표 평균 | GTFS/API | 탑승 |
| `peak_hour_flag` | bool | flag | true/false | 시간대 기준 | 계산값 | 전체 |
| `stop_congestion_pattern` | float | index | 0~1 | 정류장 평균 | 교통카드/승하차 | 버스 |
| `transfer_buffer_min` | float | min | -60~120 | null이면 보수 처리 | 계산값 | 환승 |
| `walking_distance_m` | float | meter | 0~5000 | 지도 API | DS-MAP | 마감/환승 |
| `taxi_cost_estimate` | int | KRW | 0~100000 | 추정 불가 시 null | DS-MAP/요금표 | 마감/복구 |
| `bike_available_count` | int | count | 0~200 | 0으로 처리 | DS-BIKE-RT | 마감 |
| `data_confidence` | category | enum | HIGH/MEDIUM/LOW | LOW | evidence | 전체 |
| `user_sensitivity` | category | enum | LOW/MEDIUM/HIGH | MEDIUM | userContext | 전체 |

### 10.2 Feature Snapshot

FastAPI는 리포트 생성 시 feature snapshot을 저장하거나 이벤트로 발행한다.

```json
{
  "featureSnapshotId": "fs_20260526_001",
  "requestId": "jr_001",
  "modelContext": "boarding_risk",
  "features": [
    {
      "name": "remaining_seats",
      "value": 0,
      "sourceCode": "DS-GG-BUS-ARR",
      "dataLevel": "REALTIME",
      "confidence": "HIGH",
      "observedAt": "2026-05-26T08:18:00+09:00"
    }
  ]
}
```

---

## 11. 모델별 설계

## 11.1 Boarding Risk Model — `boarding_risk_model.py`

### 정의

사용자가 이번 버스·지하철을 실제로 탈 수 있을지, 또는 탑승 실패 위험이 높은지를 예측한다.

### 문제 유형

Classification / Ordinal Risk Scoring.

### Target

| Target | 설명 |
|---|---|
| `board_success` | 실제 탑승 성공 여부 |
| `p_board_fail` | 탑승 실패 확률 |
| `risk_level` | LOW / MEDIUM / HIGH |

### 주요 Features

| Feature | 설명 |
|---|---|
| `eta_minutes` | 이번 차 도착 예정 |
| `wait_minutes` | 대기 시간 |
| `remaining_seats` | 잔여좌석 |
| `crowded_level` | 차내혼잡도 |
| `congestion_rate` | 지하철 혼잡률 |
| `route_headway` | 배차간격 |
| `peak_hour_flag` | 출근/퇴근 피크 |
| `stop_congestion_pattern` | 정류장 승차 수요 패턴 |
| `data_confidence` | 데이터 신뢰도 |
| `user_sensitivity` | 사용자 혼잡 민감도 |

### MVP Score

```text
boarding_score =
seat_bonus
- crowd_penalty
- wait_penalty
- uncertainty_penalty
- user_sensitivity_penalty
```

### 고도화 모델

| 단계 | 모델 |
|---|---|
| MVP | 규칙 기반 score |
| v1 | Logistic Regression |
| v2 | RandomForest |
| v3 | LightGBM / XGBoost |

### 평가 지표

| 지표 | 이유 |
|---|---|
| Recall@HighRisk | 위험한데 안전하다고 판단하는 오류를 줄이기 위함 |
| PR-AUC | 실패 사례가 적은 불균형 데이터 대응 |
| ROC-AUC | 분류 성능 |
| Brier Score | 확률 보정 |
| Calibration Curve | 확률값 신뢰성 |

### 출력

```json
{
  "pBoardFail": 0.72,
  "riskLevel": "HIGH",
  "confidence": "MEDIUM",
  "topRiskFactors": ["remaining_seats=0", "peak_hour=true", "crowded_level=4"],
  "evidenceRefs": ["ev_bus_seat_001", "ev_crowd_002"]
}
```

### 주의

Accuracy만 보지 않는다.
“탈 수 있다”고 했는데 못 타는 False Negative의 비용을 크게 둔다.

---

## 11.2 Transfer Failure Model — `transfer_failure_model.py`

### 정의

현재 플랜에서 사용자가 환승을 놓칠 확률을 계산한다.

### 문제 유형

Probability Prediction / Time-buffer Risk.

### Target

| Target | 설명 |
|---|---|
| `transfer_success` | 환승 성공 여부 |
| `p_transfer_fail` | 환승 실패 확률 |

### 주요 Features

| Feature | 설명 |
|---|---|
| `transfer_buffer_min` | 환승 여유 시간 |
| `walking_distance_m` | 환승 도보 거리 |
| `station_complexity` | 역 복잡도 |
| `line_id` | 노선 |
| `direction` | 방향 |
| `door_to_exit_distance` | 탑승 문에서 출구/환승통로 거리 |
| `fast_transfer_available` | 빠른환승 데이터 존재 여부 |
| `crowded_level` | 혼잡 수준 |
| `delay_variance` | 지연 변동성 |
| `user_walk_speed_profile` | 사용자 보행 속도 프로필 |

### MVP Rule

```text
if transfer_buffer_min < required_buffer_min:
    risk = HIGH
elif transfer_buffer_min < required_buffer_min + safety_margin:
    risk = MEDIUM
else:
    risk = LOW
```

### 고도화

| 단계 | 모델 |
|---|---|
| MVP | 환승 여유시간 rule |
| v1 | Logistic Regression / Bayesian |
| v2 | Monte Carlo simulation |

### 평가 지표

| 지표 | 이유 |
|---|---|
| Failure Recall | 실패 가능성 탐지 |
| Calibration | 확률값 보정 |
| Brier Score | 확률 예측 품질 |
| Expected Lateness | 실제 늦음 비용 반영 |

---

## 11.3 Congestion Predictor — `congestion_predictor.py`

### 정의

특정 노선·역·시간대·방향의 혼잡도를 예측한다.

### 문제 유형

Regression / Ordinal Classification / Time-series Forecasting.

### Target

| Target | 설명 |
|---|---|
| `congestion_rate` | 혼잡률 |
| `crowded_level` | 혼잡 등급 |

### 주요 Features

| Feature | 설명 |
|---|---|
| `line_id` | 노선 |
| `station_id` | 역 |
| `direction` | 상/하행 |
| `time_slot` | 30분 단위 |
| `day_of_week` | 요일 |
| `holiday_flag` | 휴일 여부 |
| `weather_optional` | 날씨 |
| `event_optional` | 행사 여부 |
| `previous_congestion` | 직전 혼잡 |
| `boarding_pattern` | 승하차 패턴 |
| `OD_pattern` | OD 패턴 |

### MVP

시간대 × 노선 × 역 × 방향별 평균/분위수 패턴 테이블.

### 고도화

| 단계 | 모델 |
|---|---|
| MVP | Pattern lookup |
| v1 | LightGBM regression/classification |
| v2 | LSTM / GRU / temporal model |

### 평가 지표

| 지표 | 이유 |
|---|---|
| MAE | 혼잡률 오차 |
| RMSE | 큰 오차 패널티 |
| Within-one-level Accuracy | 혼잡 등급 예측 |
| Peak-hour Error | 출근/퇴근 피크 성능 |

### 데이터 분할 원칙

랜덤 split 금지.
시간 데이터이므로 과거로 학습하고 미래를 검증하는 **time-based split**을 적용한다.

---

## 11.4 Car Survival Score — `car_guide_engine.py`

### 정의

어느 칸이 덜 붐비고, 빠른 하차/환승에 유리한지 점수화한다.

### 문제 유형

Ranking / Scoring.

### Score 구성

```text
car_survival_score =
exit_convenience_score
+ transfer_convenience_score
+ low_crowding_score
+ user_preference_score
- stair_concentration_penalty
- transfer_crowding_penalty
- peak_hour_penalty
```

### 구성 Feature

| Feature | 설명 |
|---|---|
| `exit_convenience_score` | 하차역 출구와 가까운 칸 점수 |
| `transfer_convenience_score` | 환승 동선에 유리한 칸 점수 |
| `low_crowding_score` | 혼잡 패턴이 낮은 칸 점수 |
| `user_preference_score` | 빠른환승/덜붐빔/교통약자 선호 반영 |
| `stair_concentration_penalty` | 계단 앞 쏠림 패널티 |
| `transfer_crowding_penalty` | 환승역 집중 혼잡 패널티 |
| `peak_hour_penalty` | 피크 시간대 패널티 |

### 고도화

| 단계 | 방식 |
|---|---|
| MVP | rule score로 추천 칸 1~3개 산출 |
| v1 | 사용자 피드백으로 score weight 조정 |
| v2 | Learning-to-rank |
| v3 | 민간 실시간 칸별 혼잡 API 또는 센서 데이터 결합 |

### 평가 지표

| 지표 | 이유 |
|---|---|
| NDCG@3 | 추천 순위 평가 |
| Hit@1 | 첫 번째 추천칸 적중 |
| User Feedback Positive Rate | 실제 만족도 |
| Avoidance Success Rate | 혼잡 회피 성공 |

---

## 11.5 Deadline Planner — `deadline_planner.py`

### 정의

마감시각 안에 도착 가능한 복합수단 후보를 만들고, 제약조건을 만족하는 플랜을 랭킹한다.

### 문제 유형

Constrained Optimization / Multi-objective Ranking.

### Objective

```text
arrival_time <= deadline
```

### Constraints

```text
taxi_cost <= maxTaxiFare
walk_minutes <= maxWalkMinutes
allowBike == user setting
risk_level <= user tolerance
```

### Candidate Generator

| 후보 | 설명 |
|---|---|
| Public Transit Only | 버스+지하철만 사용 |
| Taxi First-mile | 현재 위치에서 역/정류장까지 택시 |
| Taxi Last-mile | 하차 후 목적지까지 택시 |
| Bike First-mile | 따릉이로 역/정류장 접근 |
| Bike Last-mile | 하차 후 따릉이로 목적지 접근 |
| Walk Shortcut | 다른 역/정류장까지 도보 이동 |
| Hybrid | 택시 + 지하철 + 따릉이 등 혼합 |

### Ranking

```text
1. on-time success
2. lower failure risk
3. lower cost
4. lower walking burden
5. lower crowding
```

### 출력 플랜

| 플랜 | 역할 |
|---|---|
| Plan A | 성공확률 최우선 |
| Plan B | 비용 최소 |
| Plan C | 혼잡/리스크 최소 |

### 평가 지표

| 지표 | 이유 |
|---|---|
| On-time Success Rate | 마감 도착 성공률 |
| Average Lateness | 실패 시 지각 정도 |
| Cost Regret | 더 싼 성공 플랜 대비 비용 손실 |
| Computation Latency | 실시간 사용성 |

---

## 11.6 Recovery Planner — `recovery_planner.py`

### 정의

막차·환승·탑승 실패 이후에도 집/목적지까지 갈 수 있는 최대 대중교통 활용 플랜과 최소 택시 구간을 계산한다.

### 문제 유형

Graph Search + Fallback Optimization.

### 입력

| 입력 | 설명 |
|---|---|
| origin | 현재 위치 |
| destination | 목적지 |
| failure_type | 막차/환승/탑승/행사 종료 |
| current_time | 현재시각 |
| max_taxi_fare | 택시비 상한 |
| taxi_excluded | 택시 제외 여부 |
| max_walk_minutes | 도보 허용 |

### 핵심 알고리즘

```text
latest_connection_search
+ public_transit_max_reach_search
+ minimum_taxi_tail_optimization
+ first_train_wait_candidate
+ night_bus_candidate_generation
```

### 출력

| 출력 | 설명 |
|---|---|
| feasibility | 완전 가능 / 일부 가능 / 대기 필요 / 비추천 |
| plans | 플랜 A/B/C |
| max_reachable_point | 대중교통 최대 접근 지점 |
| taxi_tail_distance | 최소 택시 거리 |
| cost_saving | 전구간 택시 대비 절감액 |

### 평가 지표

| 지표 | 이유 |
|---|---|
| Recovery Feasibility Rate | 복구 가능 플랜 생성률 |
| Cost Saving | 택시비 절감 가치 |
| Route Realism | 실제 사용 가능한 경로 |
| Compute Latency | 위기상황 응답 속도 |

---

## 11.7 Intent / Slot Model — `chat_orchestrator.py`

### 정의

사용자의 자연어 질문을 어떤 decision engine으로 보낼지 결정하고 필요한 조건을 추출한다.

### 문제 유형

NLP Intent Classification + Slot Extraction.

### Intent

| Intent | 연결 엔진 |
|---|---|
| BOARDING | Boarding Engine |
| CAR_GUIDE | Car Guide Engine |
| DEADLINE | Deadline Planner |
| RECOVERY | Recovery Planner |
| GENERAL_QUERY | Clarification 또는 안내 |

### Slots

| Slot | 설명 |
|---|---|
| origin | 출발지 |
| destination | 목적지 |
| deadline | 도착 마감시각 |
| maxTaxiFare | 택시비 상한 |
| allowBike | 따릉이 허용 |
| routeId | 노선 |
| stationId | 역 |
| preference | 빠른/덜붐빔/비용/안정 |

### 예시 출력

```json
{
  "intent": "DEADLINE",
  "slots": {
    "destination": "홍대입구역",
    "deadline": "09:00",
    "preference": "LOW_RISK",
    "maxTaxiFare": 10000
  },
  "missingSlots": ["origin"]
}
```

### 평가 지표

| 지표 | 이유 |
|---|---|
| Intent Accuracy | 의도 분류 |
| Slot F1 | 조건 추출 |
| Clarification Rate | 보완 질문 비율 |
| JSON Parse Failure Rate | LLM 출력 안정성 |

---

## 12. 학습 데이터 설계

### 12.1 Label 확보 전략

| 모델 | 필요한 label | 확보 방법 |
|---|---|---|
| Boarding Risk | 실제 탑승 성공/실패 | 사용자 피드백, 리포트 후 행동 로그, 잔여좌석/혼잡 proxy |
| Transfer Failure | 환승 성공/실패 | 도착예정 대비 다음 수단 탑승 가능 여부, 사용자 피드백 |
| Congestion | 실제 혼잡도 | 공공 혼잡도, 시간대 패턴, 민간 API, 통계 데이터 |
| Deadline | 실제 도착 성공 여부 | ETA vs deadline, 사용자 확인, 지도 API 사후 추정 |
| Car Guide | 추천 칸 만족도 | “좋았음/혼잡했음/환승 편했음” 피드백 |
| Intent | intent label | 대화 로그 수동 라벨링, synthetic query 생성 후 검수 |
| Narrative | faithful summary 여부 | 리포트 근거 coverage 평가 |

### 12.2 Feature Dataset

| Dataset | 설명 | 저장 |
|---|---|---|
| `boarding_features` | 탑승가능성 feature | BigQuery |
| `transfer_features` | 환승 실패 feature | BigQuery |
| `congestion_features` | 혼잡 예측 feature | BigQuery |
| `car_guide_features` | 칸별 생존 feature | BigQuery / Cloud SQL |
| `deadline_plan_logs` | 마감도착 후보별 결과 | BigQuery |
| `recovery_plan_logs` | 실패복구 후보별 결과 | BigQuery |
| `chat_intent_logs` | AI 챗 intent/slot | BigQuery |
| `report_feedback` | 사용자 피드백 | Cloud SQL + BigQuery |

### 12.3 데이터 품질 검증

모든 패턴 데이터는 다음 EDA를 거친다.

| 검증 | 방법 |
|---|---|
| column 의미 확인 | schema catalog |
| 결측치 확인 | missing ratio |
| 이상치 확인 | min/max, percentile |
| 분포 확인 | describe, histogram |
| 시간 누락 확인 | time bucket coverage |
| ID 매칭 확인 | station/stop/route join rate |
| freshness 확인 | source updated_at |
| leakage 확인 | time-based split |

---

## 13. 모델 평가 정책

### 13.1 모델별 지표

| 모델 | 주요 지표 | 이유 |
|---|---|---|
| Boarding Risk | Recall@Fail, PR-AUC, Brier Score | 위험한 상황을 놓치면 안 됨 |
| Transfer Failure | Failure Recall, Calibration, Mean Buffer Error | 실패확률 보정 |
| Congestion | MAE, RMSE, Within-one-level Accuracy | 혼잡도는 연속/순서형 |
| Car Guide | NDCG@3, User Satisfaction, Avoid-crowd Success | 추천 순위 문제 |
| Deadline Planner | On-time Success Rate, Average Lateness, Cost Regret | 최적화 결과 현실성 |
| Recovery Planner | Feasibility Rate, Cost Saving, Fallback Success | 위기 복구 품질 |
| Intent / Slot | Intent Accuracy, Slot F1, Parse Failure Rate | 자연어 해석 안정성 |
| Narrative | Faithfulness, Evidence Coverage, Hallucination Rate | 근거 없는 설명 방지 |

### 13.2 비용 민감 평가

탑승가능성 모델은 Accuracy보다 False Negative를 더 비싸게 둔다.

| 오류 | 의미 | 비용 |
|---|---|---|
| False Negative | 위험한데 안전하다고 판단 | 매우 높음 |
| False Positive | 안전한데 위험하다고 판단 | 중간 |
| Over-cost | 필요 이상 택시비 높은 플랜 추천 | 중간 |
| Late Plan | 마감시각 초과 플랜 추천 | 매우 높음 |
| Hallucinated Explanation | 근거 없는 AI 설명 | 매우 높음 |

---

## 14. Offline Training Pipeline

### 14.1 배치 단계

```text
1. Raw data ingest
2. Schema validation
3. ID mapping
4. Feature build
5. Train/valid/test split
6. Model train
7. Model evaluation
8. Calibration
9. Artifact upload
10. Model registry update
```

### 14.2 Time-based Split

혼잡 예측 및 시간대 모델은 랜덤 split을 사용하지 않는다.

```text
train: 과거 N개월
valid: 최근 2~4주
test: 가장 최근 1~2주
```

### 14.3 Model Artifact Layout

```text
gs://talsu-model-artifacts/
├─ boarding_risk/
│  ├─ v0.1.0/
│  │  ├─ model.pkl
│  │  ├─ feature_schema.json
│  │  ├─ metrics.json
│  │  └─ calibration.json
├─ transfer_failure/
├─ congestion_predictor/
└─ car_guide_ranker/
```

### 14.4 BigQuery Tables

| Table | 설명 |
|---|---|
| `model_features.boarding_features` | 탑승 위험 모델 feature |
| `model_features.transfer_features` | 환승 실패 모델 feature |
| `model_features.congestion_features` | 혼잡 예측 feature |
| `model_features.car_guide_feedback` | 칸별 추천 피드백 |
| `model_evaluation.metrics` | 모델별 평가 지표 |
| `prediction_logs.online_predictions` | 온라인 예측 결과 |

---

## 15. Model Registry

### 15.1 Registry Schema

```python
class ModelRegistryRecord(BaseModel):
    model_name: str
    model_version: str
    artifact_uri: str
    feature_schema_version: str
    algorithm: str
    metrics: dict
    trained_at: str
    deployed_at: str | None = None
    status: Literal["CANDIDATE", "STAGING", "PRODUCTION", "ARCHIVED"]
```

### 15.2 Registry Table

| 컬럼 | 설명 |
|---|---|
| `model_name` | 모델명 |
| `model_version` | semantic version |
| `artifact_uri` | Cloud Storage URI |
| `feature_schema_version` | feature contract 버전 |
| `algorithm` | Logistic, LightGBM 등 |
| `metrics` | JSON |
| `trained_at` | 학습 시각 |
| `deployed_at` | 배포 시각 |
| `status` | CANDIDATE/STAGING/PRODUCTION/ARCHIVED |

### 15.3 배포 원칙

1. production 모델은 하나만 활성화한다.
2. feature schema version이 맞지 않으면 로드하지 않는다.
3. 모델 로드 실패 시 rule engine으로 fallback한다.
4. 모든 예측 응답에 `modelName`, `modelVersion`을 포함한다.

---

## 16. Evidence Policy

### 16.1 공통 Evidence 필수

| 리포트 | 필수 Evidence |
|---|---|
| Boarding | 버스/지하철 도착, 잔여좌석 또는 혼잡 추정, 패턴 근거 |
| Car Guide | 빠른하차, 빠른환승, 지하철 혼잡도 패턴 |
| Deadline | 실시간 도착, 따릉이 대여, 택시비 추정, 혼잡·위험 |
| Recovery | GTFS 막차/첫차, 실시간 도착, 최소 택시 구간 |
| AI Narrative | 참조한 decision/evidence ID |

### 16.2 Evidence Builder 규칙

1. 모든 판단에는 최소 1개 이상의 evidence가 필요하다.
2. 추정값은 sourceCode와 fallbackReason을 포함한다.
3. 모델 예측값은 modelVersion을 포함한다.
4. Evidence가 부족한 경우 리포트 status는 `PARTIAL`로 반환한다.
5. LLM 생성 문장은 evidence 없는 사실을 추가하면 안 된다.

---

## 17. Fallback Policy

### 17.1 상황별 Fallback

| 실패 상황 | fallback |
|---|---|
| 외부 API timeout | Redis cache 사용 |
| Redis cache 없음 | 패턴 데이터 사용 |
| 패턴 데이터 없음 | 기능 제한 리포트 |
| 모델 로드 실패 | rule engine 사용 |
| optimizer no-solution | 가장 덜 늦는 플랜 + 조건 수정 |
| LLM timeout | 템플릿 리포트 |
| LLM parsing 실패 | Pydantic validation 후 재시도, 실패 시 템플릿 |
| 지도 API 실패 | 좌표 기반 직선거리 추정 또는 조건 수정 |
| 따릉이 API 실패 | 자전거 후보 제외 |
| 지하철 혼잡도 없음 | 빠른하차/환승 중심 추천 |

### 17.2 Fallback 응답 규칙

1. fallback이 발생하면 `warnings`에 넣는다.
2. 해당 evidence의 `confidence`를 낮춘다.
3. UI에는 “일부 데이터 추정” 배지를 표시한다.
4. 사용자가 재탐색할 수 있는 follow-up chip을 제공한다.

---

## 18. Evaluation Dashboard

### 18.1 운영 지표

| 지표 | 설명 |
|---|---|
| request_latency_p50/p95 | 기능별 응답시간 |
| source_failure_rate | 데이터소스별 실패율 |
| cache_hit_rate | Redis cache hit |
| report_success_rate | 리포트 생성 성공률 |
| no_solution_rate | 플랜 생성 실패율 |
| fallback_rate | fallback 사용 비율 |
| llm_parse_failure_rate | LLM JSON 파싱 실패 |
| evidence_coverage_rate | 리포트별 evidence 충족률 |

### 18.2 모델 지표

| 지표 | 설명 |
|---|---|
| prediction_distribution | 위험 예측 분포 |
| confidence_distribution | 신뢰도 분포 |
| calibration_curve | 확률 보정 |
| feedback_positive_rate | 사용자 피드백 |
| false_safe_reports | 위험한데 안전하다고 판단한 사례 |
| cost_regret | 비용 과다 추천 |
| lateness_error | 지각 예측 오차 |

### 18.3 대회 증빙 지표

| 지표 | 설명 |
|---|---|
| AI 모델 입력/출력 로그 | AI 활용 증빙 |
| feature schema | 분석도구 활용 증빙 |
| model evaluation | 학습도구 활용 증빙 |
| evidence mapping | 공공데이터 활용 증빙 |
| data fusion report | 데이터융합 증빙 |
| fallback policy | 서비스 신뢰성 증빙 |

---

## 19. AI Report Narrative Policy

### 19.1 LLM 역할

LLM은 최종 판단을 내리지 않는다.
LLM은 구조화된 decision result를 사용자 언어로 설명한다.

| 허용 | 금지 |
|---|---|
| 의도 분류 | 경로 임의 생성 |
| 조건 보완 질문 | 실시간값 조작 |
| 리포트 요약 | evidence 없는 사실 추가 |
| 후속 질문 칩 생성 | 확정적 표현 남발 |
| 근거 설명 | 모델 결과 변경 |

### 19.2 Narrative Input

```json
{
  "decision": {},
  "plans": [],
  "evidence": [],
  "warnings": [],
  "userContext": {}
}
```

### 19.3 Narrative Output

```json
{
  "summary": "플랜 A를 추천합니다.",
  "sections": [
    {
      "type": "reason",
      "title": "추천 이유",
      "text": "마감시각 전 도착 가능성이 가장 높고 추가비용이 1만원 이하입니다."
    }
  ],
  "followUpChips": ["택시비 줄여줘", "덜 붐비게 바꿔줘"]
}
```

### 19.4 금지 표현

| 금지 | 대체 |
|---|---|
| 반드시 도착합니다 | 도착 가능성이 높습니다 |
| 현재 가장 한산합니다 | 상대적으로 덜 붐빌 가능성이 높습니다 |
| 정확한 택시비 | 예상 택시비 |
| 위험지역 | 안심 인프라가 적은 구간 |
| 무조건 이 칸을 타세요 | 이 칸을 우선 고려하세요 |

---

## 20. Error Codes

| code | HTTP | 설명 |
|---|---:|---|
| VALIDATION_ERROR | 400 | 요청 스키마 검증 실패 |
| TRANSIT_API_TIMEOUT | 504 | 외부 교통 API 타임아웃 |
| TRANSIT_API_RATE_LIMITED | 429 | 외부 API rate limit |
| TRANSIT_API_SERVICE_ERROR | 502 | 외부 API 장애 |
| DATA_NORMALIZATION_ERROR | 502 | 외부 데이터 정규화 실패 |
| DATA_SOURCE_UNAVAILABLE | 503 | 필수 데이터소스 사용 불가 |
| FEATURE_BUILD_ERROR | 502 | feature 생성 실패 |
| MODEL_LOAD_ERROR | 502 | 모델 로드 실패 |
| MODEL_INFERENCE_ERROR | 502 | 모델 추론 실패 |
| OPTIMIZATION_NO_SOLUTION | 200/422 | 성공 플랜 없음. 가능하면 report status로 처리 |
| LLM_TIMEOUT | 504 | LLM 응답 시간 초과 |
| LLM_SERVICE_ERROR | 502 | LLM 장애 |
| LLM_PARSING_ERROR | 502 | LLM JSON 파싱 실패 |
| INTERNAL_ERROR | 500 | 미처리 예외 |

---

## 21. 로깅 정책

### 21.1 공통 로그 필드

```json
{
  "requestId": "jr_001",
  "event": "decision_request_success",
  "reportType": "DEADLINE_PLAN",
  "latencyMs": 1840,
  "dataSources": ["DS-SUBWAY-ARR", "DS-BIKE-RT"],
  "modelVersions": ["boarding_risk:v0.1.0"],
  "status": "SUCCESS",
  "fallbackUsed": false
}
```

### 21.2 이벤트 목록

| 이벤트 | 레벨 | 설명 |
|---|---|---|
| `decision_request_start` | INFO | 판단 요청 시작 |
| `decision_request_success` | INFO | 판단 요청 성공 |
| `decision_request_failed` | ERROR | 판단 요청 실패 |
| `public_api_call_start` | INFO | 외부 API 호출 시작 |
| `public_api_call_success` | INFO | 외부 API 호출 성공 |
| `public_api_call_timeout` | WARNING | 외부 API timeout |
| `data_normalization_error` | ERROR | 정규화 실패 |
| `feature_build_success` | INFO | feature 생성 성공 |
| `model_inference_start` | INFO | 모델 추론 시작 |
| `model_inference_error` | ERROR | 모델 추론 실패 |
| `optimization_no_solution` | WARNING | 최적해 없음 |
| `report_generated` | INFO | 리포트 생성 완료 |
| `fallback_used` | WARNING | fallback 사용 |

---

## 22. 개발 우선순위

1순위는 LLM 챗봇이 아니라 Decision Engine MVP다.

| 우선순위 | 작업 | 이유 |
|---:|---|---|
| 1 | 공통 schema/contract 고정 | Spring ↔ FastAPI ↔ Front type mismatch 방지 |
| 2 | Adapter + Normalizer | 데이터 없으면 모델 없음 |
| 3 | Evidence / DataLevel 체계 | 서비스 신뢰성과 대회 증빙 핵심 |
| 4 | Boarding + Deadline rule engine | 사용자 가치가 가장 직접적 |
| 5 | Report JSON + template narrative | LLM 없이도 작동해야 함 |
| 6 | Logging + BigQuery feature snapshot | 이후 ML 학습 데이터 확보 |
| 7 | ML baseline 모델 | Logistic / RandomForest / LightGBM 순차 적용 |
| 8 | LLM intent/report | 구조화 판단 위에 얹는 층 |
| 9 | 개인화·feedback learning | 충분한 사용 로그 이후 |

---

## 23. 지금 당장 만들어야 할 산출물

| 문서 | 내용 |
|---|---|
| `talsu-ai-api.md` | 내부 endpoint별 request/response, error code, timeout, retry |
| `talsu-feature-contract.md` | feature 이름, dtype, 단위, 허용범위, 결측 처리, sourceCode, dataLevel |
| `talsu-model-card.md` | 모델별 target, feature, algorithm, training data, metric, limitation, fallback |
| `talsu-evidence-policy.md` | 판단별 필수 evidence, dataLevel, confidence |
| `talsu-offline-training-pipeline.md` | BigQuery feature table, split, leakage 방지, model artifact 저장 |
| `talsu-model-registry.md` | model name, version, artifact URI, feature schema version, metrics |
| `talsu-fallback-policy.md` | API timeout, 데이터 없음, LLM 실패, 모델 실패, optimizer no-solution 처리 |
| `talsu-evaluation-dashboard.md` | latency, source failure, prediction distribution, calibration, feedback |

---

## 24. MVP 구현 순서

### Phase 0. Contract

| 작업 | 산출물 |
|---|---|
| Pydantic schema 작성 | request/response |
| Java DTO 정합 | Spring client |
| TypeScript type 정합 | frontend |
| Contract diff | CI 검증 |

### Phase 1. Data Adapter

| 작업 | 산출물 |
|---|---|
| 서울 버스 adapter | `seoul_bus_adapter.py` |
| 경기 버스 adapter | `gyeonggi_bus_adapter.py` |
| 지하철 adapter | `subway_arrival_adapter.py` |
| 따릉이 adapter | `bike_adapter.py` |
| 빠른하차/환승 adapter | `fast_exit_adapter.py`, `fast_transfer_adapter.py` |
| GTFS loader | `gtfs_adapter.py` |

### Phase 2. Engine MVP

| 작업 | 산출물 |
|---|---|
| 탑승가능성 score | `boarding_engine.py` |
| 칸별 생존점수 | `car_guide_engine.py` |
| 마감도착 후보 생성 | `deadline_planner.py` |
| 실패복구 탐색 | `recovery_planner.py` |
| evidence builder | `evidence_builder.py` |

### Phase 3. Report + Front Integration

| 작업 | 산출물 |
|---|---|
| 공통 DecisionReportResponse | 리포트 JSON |
| template narrative | LLM 없이 작동 |
| AI intent MVP | JSON slot extraction |
| follow-up chips | 조건 수정 루프 |
| 프론트 리포트 | mini/summary/detail/evidence |

### Phase 4. ML Baseline

| 작업 | 산출물 |
|---|---|
| feature snapshot logging | BigQuery |
| boarding risk baseline | Logistic/RandomForest |
| congestion baseline | LightGBM |
| transfer risk baseline | Bayesian/Logistic |
| model registry | artifact + metrics |

### Phase 5. Productionization

| 작업 | 산출물 |
|---|---|
| Cloud Run deploy | decision-api |
| Redis cache | external API cache |
| BigQuery logs | evaluation dataset |
| fallback policy | resilience |
| dashboard | monitoring |
| contest evidence | AI/data fusion proof |

---

## 25. 최종 판단

이 문서의 최종 결론은 다음이다.

```text
FastAPI는 단순 API 호출 서버가 아니다.
FastAPI는 탈수있나의 이동 판단 엔진이다.

Adapter는 데이터를 가져오고,
Normalizer는 데이터를 통일하고,
Feature Builder는 판단 재료를 만들고,
Decision Engine은 규칙 기반 판단을 내리고,
ML Model은 실패위험과 혼잡을 예측하고,
Optimizer는 후보 플랜을 랭킹하고,
Evidence Builder는 근거를 붙이고,
AI Narrative는 이를 사용자 언어로 설명한다.
```

이 구조를 따르면 MVP에서도 빠르게 작동하고, 데이터가 축적될수록 자연스럽게 다음 단계로 진화할 수 있다.

```text
MVP = 규칙 기반 + 패턴 테이블 + 구조화 리포트
v1 = ML baseline + evidence 강화
v2 = 최적화 고도화 + 개인화
v3 = K-MaaS / 민간 혼잡 API / 안심구역 데이터 결합
```

