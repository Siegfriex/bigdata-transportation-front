# 탈수있나 AI 측 Python/FastAPI 모델링 문서 v5
## 공공데이터 Baseline → SK API Calibration/Fine-tuning 전략 통합판

**문서 유형:** AI-side Python/FastAPI Modeling Blueprint + Public/SK Data Strategy + Regression/Classification Training Plan + Feature Contract
**서비스명:** 탈수있나
**대상 노드:** FastAPI Decision API + 내부 AI/ML 모델 레이어
**연동 대상:** Spring Boot Core API / React TypeScript Frontend / GCP Data & AI Infra
**작성 버전:** v5.0
**핵심 업데이트:** v4의 canonical ID, feature leakage, target label, engine/ranker 분리 구조를 유지하면서, **공공 데이터 기반 baseline 학습 → SK API 기반 test/target/calibration/fine-tuning → 운영 모델 배포**의 baseline-refinement 전략을 통합한다.
**모델링 초점:** 회귀·분류 모델을 “공공 데이터로 가능한 것”과 “SK 데이터가 있어야 가능한 것”으로 분리하고, 비용 효율성과 성능 고도화를 동시에 달성한다.

---

## 0. v5 핵심 결론

탈수있나의 모델링 전략은 다음 순서로 간다.

```text
[공공 데이터]
→ baseline 학습
→ 정규화 / feature engineering
→ Logistic Regression / Ridge / Rule baseline

[SK API 데이터]
→ high-quality target
→ hold-out test set
→ calibration
→ fine-tuning
→ model promotion

[최종 운영]
→ 공공 API 실시간값 + SK 패턴/혼잡값 캐시
→ 예측 모델 추론
→ evidence 기반 리포트
```

이 방식의 핵심은 다음이다.

1. **공공 데이터는 대량·저비용 baseline 학습과 feature engineering에 사용한다.**
2. **SK API 데이터는 고품질 target, 검증셋, calibration, fine-tuning에 사용한다.**
3. **혼잡도 자체가 target인 모델은 SK 데이터가 필수다.**
4. **탑승·환승·마감 성공 관련 모델은 공공 데이터 proxy baseline으로 시작할 수 있다.**
5. **최종 운영에서는 공공 실시간 API와 SK 패턴 데이터 캐시를 결합한다.**

---

## 1. v4에서 유지하는 기반 구조

v4에서 정의한 아래 설계는 그대로 유지한다.

| 항목 | 유지 여부 | 설명 |
|---|---:|---|
| Canonical Transit ID Policy | 유지 | API별 역/노선 ID 차이를 내부 표준 ID로 매핑 |
| InboundTrainKey | 유지 | 진입 열차 단위 pattern join key |
| Feature Leakage Rules | 유지 | target leakage 방지 |
| Target Label Policy | 유지 | direct/proxy/feedback/synthetic label 분리 |
| Engine vs Ranker Separation | 유지 | deterministic engine과 ML ranker 분리 |
| ETA Error Regressor | 유지 | 마감도착 ETA 보정 모델 |
| Evidence Policy | 유지 | dataLevel, confidence, sourceCode, modelVersion 포함 |
| Model Registry | 유지 | model version과 feature schema version 관리 |

v5는 이 구조 위에 **공공 데이터 baseline + SK 고품질 데이터 refinement** 전략을 추가한다.

---

## 2. 데이터 역할 분리

## 2.1 공공 데이터의 역할

공공 데이터는 아래 목적에 사용한다.

| 목적 | 설명 |
|---|---|
| Baseline 학습 | ETA, 배차, 시간대, 노선, 환승 buffer 기반 기본 모델 학습 |
| Proxy label 생성 | 직접 정답이 없는 경우 규칙 기반 proxy target 생성 |
| Feature engineering | headway, peak flag, route pattern, station pattern 생성 |
| 정규화 기준 | time bucket, route/station canonical mapping |
| 운영 fallback | SK API 장애·비용 제한 시 공공 데이터 기반 fallback |
| 대회 증빙 | 공공데이터 활용 근거 |

### 공공 데이터로 가능한 모델

| 모델 | 공공 데이터 기반 학습 가능성 | 이유 |
|---|---:|---|
| Boarding Risk | 가능 | ETA, 대기시간, 배차, 시간대, 정류장/역 패턴으로 proxy label 생성 가능 |
| Transfer Failure | 가능 | 환승 buffer, 도보거리, 시간표 기반 실패 확률 proxy 생성 가능 |
| Deadline Success | 가능 | 경로 기반 ETA와 deadline 비교로 proxy 생성 가능 |
| ETA Error | 제한적 가능 | 실제 도착 label이 부족하면 proxy 중심. 운영 로그 축적 후 강화 |
| Train Congestion | 제한적 | target 혼잡도가 없으므로 공공 데이터는 feature로만 사용 |
| Car Congestion | 불가 | 칸별 target이 공공 데이터에 없음 |
| Car Guide Ranker | 불가 | 칸별 혼잡/피드백 target이 필요 |

---

## 2.2 SK API 데이터의 역할

SK API 데이터는 아래 목적에 사용한다.

| 목적 | 설명 |
|---|---|
| High-quality target | train congestion, car congestion, car alighting target |
| Hold-out test | 공공 baseline이 실제 혼잡도 기준으로 얼마나 맞는지 검증 |
| Calibration | 공공 baseline 확률을 SK 기준으로 보정 |
| Fine-tuning | 공공 데이터 baseline에 SK target을 결합해 모델 재학습 |
| Car Guide 고도화 | 칸별 혼잡도 + 하차율 기반 ranker 학습 |
| 운영 캐시 | 패턴 데이터 캐싱 후 비용 절감 |

### SK 데이터가 필수인 모델

| 모델 | SK 데이터 필요성 | 이유 |
|---|---:|---|
| Train Congestion Predictor | 필수 | 열차 혼잡도 target 필요 |
| Car Congestion Predictor | 필수 | 칸별 혼잡도 target 필요 |
| Car Guide Ranker | 필수 | 칸별 혼잡·하차율·피드백 기반 ranking |
| Boarding Risk | 고도화에 필요 | 실제 혼잡 기반 board_fail target 생성 가능 |
| Transfer Failure | 고도화에 필요 | 칸별 하차율·혼잡으로 환승 지연 feature 개선 |
| Deadline Success | 고도화에 필요 | 혼잡 penalty와 ETA 보정 개선 |

---

## 3. 모델별 데이터 전략

| 모델 | Public Baseline | SK Test | SK Calibration | SK Fine-tuning | 최종 권장 |
|---|---:|---:|---:|---:|---|
| Boarding Risk | O | O | O | O | Public baseline → SK calibrated LightGBM |
| Transfer Failure | O | O | O | O | Buffer baseline → SK alighting/crowding feature 추가 |
| Deadline Success | O | O | O | O | Public route baseline → SK congestion penalty |
| ETA Error | △ | O | O | O | 운영 로그 + SK 혼잡 feature로 회귀 보정 |
| Train Congestion | X | O | 해당 없음 | O | SK target + public feature |
| Car Congestion | X | O | 해당 없음 | O | SK target 전용 |
| Car Guide Ranker | X | O | 해당 없음 | O | SK + user feedback 기반 ranker |
| Intent Classifier | O | 해당 없음 | 해당 없음 | O | synthetic + real chat log |

---

## 4. Public-only Feature Contract v1

공공 데이터만으로 생성 가능한 feature contract다.

### 4.1 공통 Feature

| Feature | dtype | source | 설명 | 모델 |
|---|---|---|---|---|
| `origin_lat` | float | user/map | 출발지 위도 | Deadline, Recovery |
| `origin_lng` | float | user/map | 출발지 경도 | Deadline, Recovery |
| `destination_lat` | float | user/map | 목적지 위도 | Deadline, Recovery |
| `destination_lng` | float | user/map | 목적지 경도 | Deadline, Recovery |
| `dow` | category | computed | 요일 | 전체 |
| `hh` | int | computed | 시간 | 전체 |
| `mm` | int | computed | 분 또는 time bucket | 전체 |
| `peak_hour_flag` | bool | computed | 출퇴근 피크 여부 | 전체 |
| `holiday_flag` | bool | calendar | 휴일 여부 | 전체 |
| `route_id` | category | transit API | 노선 ID | Boarding, Deadline |
| `canonical_station_id` | category | mapping | 표준 역 ID | Subway models |
| `canonical_stop_id` | category | mapping | 표준 정류장 ID | Bus models |
| `line_id` | category | mapping | 노선 ID | Subway models |
| `direction` | category | transit API | 상·하행/방향 | Subway models |

### 4.2 Public Boarding Features

| Feature | dtype | 설명 | 결측 처리 |
|---|---|---|---|
| `eta_minutes` | int | 이번 차 도착 예정 | null 허용, confidence 하향 |
| `next_eta_minutes` | int | 다음 차 도착 예정 | null 허용 |
| `wait_minutes` | int | 사용자 대기시간 | eta로 대체 |
| `headway_minutes` | float | 배차간격 | GTFS/과거 평균 |
| `headway_variance` | float | 배차 변동성 | route pattern 평균 |
| `route_frequency_index` | float | 노선 빈도 지수 | pattern |
| `stop_demand_proxy` | float | 정류장/역 수요 proxy | 교통카드/승하차 통계 |
| `route_peak_pattern` | float | 노선 피크 패턴 | public pattern |
| `public_delay_proxy` | float | 도착지연 추정 | 실시간 vs 시간표 |
| `user_congestion_sensitivity` | category | 사용자 혼잡 민감도 | 기본 MEDIUM |

### 4.3 Public Transfer Features

| Feature | dtype | 설명 |
|---|---|---|
| `transfer_buffer_min` | float | 환승 여유시간 |
| `scheduled_transfer_time_min` | float | 시간표상 환승 소요 |
| `walking_distance_m` | float | 환승 도보거리 |
| `station_complexity_proxy` | float | 역 복잡도 proxy |
| `num_transfer_edges` | int | 환승 경로 edge 수 |
| `fast_transfer_available` | bool | 빠른환승 데이터 존재 |
| `fast_exit_available` | bool | 빠른하차 데이터 존재 |
| `public_congestion_pattern` | float | 역/시간대 혼잡 패턴 |

### 4.4 Public Deadline Features

| Feature | dtype | 설명 |
|---|---|---|
| `raw_eta_min` | float | 원 경로 ETA |
| `deadline_buffer_min` | float | 마감시각 대비 여유 |
| `num_transfers` | int | 환승 수 |
| `walk_minutes` | float | 도보 총 시간 |
| `walk_segment_ratio` | float | 전체 이동 중 도보 비중 |
| `mode_sequence` | category | 수단 조합 |
| `taxi_distance_m` | float | 택시 구간 거리 |
| `estimated_taxi_cost` | int | 예상 택시비 |
| `bike_available_count` | int | 따릉이 가능 수 |
| `api_data_age_sec_max` | int | 사용 데이터 중 최대 age |

---

## 5. SK-enhanced Feature Contract v2

SK 데이터 결합 후 추가되는 feature contract다.

### 5.1 Train-level Features

| Feature | dtype | 설명 | 사용 모델 |
|---|---|---|---|
| `train_congestion_pct` | float | 열차 전체 혼잡도 % | Boarding, Deadline, ETA |
| `train_congestion_score` | float | 0~1 정규화 혼잡 score | Boarding, Deadline |
| `train_congestion_bucket` | category | LOW/MEDIUM/HIGH/VERY_HIGH | Boarding |
| `train_pattern_available` | bool | 패턴 존재 여부 | Boarding |
| `train_no_service_flag` | bool | 미운행/미관측 여부 | Boarding |
| `train_type` | category | LOCAL/EXPRESS | Train/Boarding |
| `canonical_start_station_id` | category | 시작역 | Train |
| `canonical_end_station_id` | category | 종착역 | Train |
| `canonical_prev_station_id` | category | 이전역 | Train |

### 5.2 Car-level Features

| Feature | dtype | 설명 | 사용 모델 |
|---|---|---|---|
| `car_no` | int | 칸 번호 | Car Guide |
| `car_congestion_score` | float | 칸별 혼잡 score | Car Congestion, Car Guide |
| `car_congestion_level` | category | SPARSE/NORMAL/CROWDED/VERY_CROWDED | Car Guide |
| `car_relative_to_train_lag` | float | 과거 기준 열차 평균 대비 상대 혼잡 | Car Congestion |
| `car_rank_within_train_lag` | int | 과거 기준 덜 붐비는 순위 | Car Congestion |
| `car_dispersion_score_lag` | float | 과거 기준 칸별 분산 | Boarding, Car Guide |

### 5.3 Car Alighting Features

| Feature | dtype | 설명 | 사용 모델 |
|---|---|---|---|
| `car_alighting_rate_pct` | float | 칸별 하차 비율 | Car Guide, Transfer |
| `alighting_rank` | int | 하차 비율 순위 | Car Guide |
| `alighting_avoidance_score` | float | 하차 쏠림 회피 점수 | Car Guide |
| `alighting_dispersion_score` | float | 하차 분산 점수 | Car Guide |
| `exit_alighting_conflict` | float | 빠른하차 칸과 하차 쏠림 충돌 정도 | Car Guide |

### 5.4 SK 결합 Feature 생성 규칙

```text
Public feature는 모든 모델의 기본 입력이다.
SK feature는 존재할 때만 enrich한다.
SK feature가 없으면 Public baseline output을 유지한다.
SK feature 결측은 0으로 채우지 않고 missing flag를 만든다.
혼잡도 0은 저혼잡이 아니라 NO_SERVICE_OR_UNOBSERVED 가능성을 우선 검토한다.
```

---

## 6. Target Label Policy v2

### 6.1 Public Proxy Labels

| Target | 생성 규칙 | Label Quality |
|---|---|---|
| `board_fail_proxy` | `eta_minutes < 2` 또는 `headway_minutes < 5` 또는 `public_delay_proxy` 높음 | C/D |
| `transfer_fail_proxy` | `transfer_buffer_min < required_buffer_min` | C |
| `deadline_success_proxy` | `raw_eta_min <= deadline_buffer_min` | C |
| `eta_error_proxy` | 실시간 ETA와 시간표 ETA 차이 | C/D |

### 6.2 SK Target Labels

| Target | 생성 규칙 | Label Quality |
|---|---|---|
| `train_congestion_pct` | SK train congestion 통계 | A |
| `train_congestion_bucket` | pct 기반 구간화 | A/B |
| `car_congestion_score` | SK car congestion 통계 | A |
| `car_congestion_level` | SK level 또는 score bucket | A/B |
| `car_alighting_rate_pct` | SK car alighting 통계 | A |
| `board_fail_true` | `train_congestion_pct >= threshold` 또는 `car_congestion_score >= threshold` + feedback | B |
| `transfer_fail_true` | 환승 buffer + car alighting/crowding delay + feedback | B/C |
| `on_time_success_true` | 실제 도착 로그 또는 high-quality ETA comparison | A/B |

### 6.3 Feedback Labels

| Label | Scale | 설명 |
|---|---:|---|
| `satisfaction_score` | 1~5 | 전체 추천 만족도 |
| `crowding_feedback` | 1~5 | 실제 덜 붐볐는지 |
| `alighting_feedback` | 1~5 | 빠르게 하차했는지 |
| `transfer_feedback` | 1~5 | 환승이 편했는지 |
| `recommended_car_used` | bool | 추천 칸을 실제 사용했는지 |
| `selected_plan_id` | string | 사용자가 선택한 플랜 |
| `arrived_on_time` | bool/null | 실제 정시 도착 여부 |

---

## 7. Baseline → SK Test → Calibration → Fine-tuning Pipeline

### 7.1 Phase 1 — Public Baseline

```text
public raw data
→ normalize
→ canonical mapping
→ feature build
→ proxy label build
→ Logistic/Ridge baseline
→ feature importance 분석
→ public validation
```

### 7.2 Phase 2 — SK Hold-out Test

```text
SK train/car/alighting patterns
→ canonical key join
→ high-quality target 생성
→ public baseline으로 예측
→ 성능 하락/오차 측정
→ public proxy의 한계 확인
```

### 7.3 Phase 3 — Calibration

```text
public baseline probability
+ SK true/proxy label
→ Platt scaling or Isotonic calibration
→ calibrated probability
→ Brier Score / Calibration curve 개선 확인
```

### 7.4 Phase 4 — Fine-tuning

```text
public dataset + SK dataset
→ sample weighting
→ model 재학습
→ SK hold-out 평가
→ model registry 등록
```

### 7.5 Phase 5 — Production

```text
online public API
+ cached SK pattern
→ feature enrichment
→ calibrated/fine-tuned model inference
→ evidence report
→ user feedback logging
```

---

## 8. 모델별 Public/SK 전략 상세

## 8.1 Boarding Risk

### Public Baseline

```text
features:
eta_minutes, wait_minutes, headway_minutes, peak_hour_flag, dow, hh, route_peak_pattern

target:
board_fail_proxy
```

### SK Refinement

```text
add features:
train_congestion_pct, train_congestion_bucket, car_dispersion_score_lag, train_no_service_flag

SK label:
board_fail_true = train_congestion_pct >= threshold OR car_congestion_score >= threshold
```

### 모델 단계

```text
MVP: rule score
v1: Logistic Regression on public proxy
v2: calibrated logistic on SK labels
v3: LightGBM with public + SK features
```

### 주요 평가

```text
Recall@HighRisk
PR-AUC
Brier Score
False Safe Rate
Calibration Curve
```

---

## 8.2 Transfer Failure

### Public Baseline

```text
features:
transfer_buffer_min, walking_distance_m, station_complexity_proxy, fast_transfer_available

target:
transfer_fail_proxy = transfer_buffer_min < required_buffer_min
```

### SK Refinement

```text
add features:
incoming_train_congestion_pct
outgoing_train_congestion_pct
car_alighting_rate_pct
crowding_delay_penalty
exit_alighting_conflict
```

### 모델 단계

```text
MVP: buffer rule
v1: Logistic Regression
v2: Bayesian calibration
v3: Monte Carlo simulation with delay distribution
```

---

## 8.3 Deadline Success

### Public Baseline

```text
features:
raw_eta_min, deadline_buffer_min, mode_sequence, num_transfers, walk_minutes, taxi_distance_m, bike_available_count

target:
deadline_success_proxy = raw_eta_min <= deadline_buffer_min
```

### SK Refinement

```text
add features:
boarding_risk_max
transfer_fail_risk_max
train_congestion_pct_max
eta_error_prediction
data_confidence_min
```

### 모델 단계

```text
MVP: deadline buffer rule
v1: Logistic Regression
v2: LightGBM classifier
v3: calibrated ensemble
```

---

## 8.4 ETA Error Regressor

### Public Baseline

```text
features:
raw_eta_min
realtime_vs_schedule_gap
num_transfers
walk_segment_ratio
headway_variance
route_headway_mean
bus_location_delay_min
transfer_buffer_min_min
peak_hour_flag
api_data_age_sec_max
```

### SK Refinement

```text
add features:
train_congestion_pct_max
boarding_risk_max
transfer_fail_risk_max
car_alighting_rate_pct_max
```

### Target

```text
eta_error_min = actual_arrival_time - raw_eta
expected_lateness_min = actual_arrival_time - deadline
```

### 모델 단계

```text
MVP: rule buffer
v1: Ridge Regression
v2: RandomForest Regressor
v3: LightGBM Regressor
v4: Quantile Regression for P90 ETA
```

---

## 8.5 Train Congestion Predictor

### 데이터 전략

공공 데이터에는 target이 없으므로 SK 데이터가 처음부터 target이다. 공공 데이터는 feature로만 사용한다.

```text
target:
train_congestion_pct
train_congestion_bucket

public features:
public_arrival_headway
public_peak_pattern
holiday_flag
route_station_peak_pattern

SK features:
line_id, canonical_station_id, start/end/prev, updn_line, train_type, dow, hh, mm
```

### 모델 단계

```text
v0: pattern lookup
v1: Ridge/Lasso
v2: LightGBM Regressor/Classifier
v3: LSTM/GRU with lag features
```

---

## 8.6 Car Congestion Predictor

### 데이터 전략

SK 데이터 전용 target 모델이다. 공공 데이터는 station demand나 peak pattern 보조 feature로만 쓴다.

```text
target:
car_congestion_score
car_congestion_level

features:
train_congestion_pct
car_no
car_relative_to_train_lag
car_rank_within_train_lag
car_dispersion_score_lag
alighting_rate_pct
station_boarding_pattern
```

### 모델 단계

```text
v0: car pattern lookup
v1: Ridge/Lasso
v2: RandomForest
v3: LightGBM/XGBoost
```

---

## 8.7 Car Guide Ranker

### 데이터 전략

Car Guide는 SK 데이터와 사용자 feedback이 핵심이다. 공공 데이터만으로는 학습형 ranker를 만들 수 없다.

```text
features:
car_congestion_score
car_relative_to_train
car_alighting_rate_pct
alighting_avoidance_score
exit_distance_score
transfer_distance_score
exit_alighting_conflict
user_preference_type

targets:
satisfaction_score
car_selected
recommended_rank
```

### 운영 구조

```text
MVP:
car_guide_engine.py rule-based score

v1:
feedback 기반 weight tuning

v2:
car_guide_ranker.py LightGBM Ranker shadow inference

v3:
ranker rerank production, engine fallback
```

---

## 9. Sample Weighting Policy

Public proxy와 SK high-quality target을 결합할 때는 sample weight를 다르게 준다.

| Dataset | Label Quality | Default Weight |
|---|---|---:|
| Public direct label | B | 0.7 |
| Public proxy label | C | 0.4 |
| Public weak proxy | D | 0.2 |
| SK direct target | A | 1.0 |
| SK derived target | B | 0.8 |
| Explicit feedback | A | 1.0 |
| Implicit feedback | B/C | 0.5 |

예시:

```python
sample_weight = df["label_quality"].map({
    "A": 1.0,
    "B": 0.8,
    "C": 0.4,
    "D": 0.2,
})
```

---

## 10. Calibration Policy

### 10.1 대상 모델

| 모델 | Calibration 필요성 |
|---|---:|
| Boarding Risk | 높음 |
| Transfer Failure | 높음 |
| Deadline Success | 높음 |
| Train Congestion bucket classifier | 중간 |
| Intent Classifier | 중간 |

### 10.2 방법

| 방법 | 사용 조건 |
|---|---|
| Platt Scaling | 데이터 적고 빠른 baseline 필요 |
| Isotonic Regression | SK calibration set이 충분할 때 |
| Temperature Scaling | neural model 확률 보정 |
| Quantile Calibration | ETA/P90 예측 보정 |

### 10.3 Calibration Dataset

```text
SK calibration set은 학습 set과 test set에서 분리한다.
같은 request_id, 같은 train_key의 중복 누수를 막는다.
calibration set은 model registry에 별도 기록한다.
```

---

## 11. Cost-aware SK API Usage Policy

### 11.1 원칙

1. SK API는 모든 운영 요청에 무제한 호출하지 않는다.
2. 패턴형 데이터는 배치로 수집해 BigQuery/Redis에 캐싱한다.
3. 운영 중에는 캐시 우선, API는 cache miss 또는 갱신 조건에서만 호출한다.
4. 비용 단가는 문서 내 하드코딩하지 않고 `SK_API_UNIT_COST_KRW` 설정값으로 관리한다.
5. 비용 수치는 실제 계약/요금 확인 전까지 `assumption`으로 표시한다.

### 11.2 비용 추적 테이블

```sql
CREATE TABLE IF NOT EXISTS `ops.sk_api_usage_logs` (
  request_id STRING,
  endpoint STRING,
  cache_hit BOOL,
  api_called BOOL,
  unit_cost_krw FLOAT64,
  estimated_cost_krw FLOAT64,
  called_at TIMESTAMP
)
PARTITION BY DATE(called_at)
CLUSTER BY endpoint, cache_hit;
```

### 11.3 운영 정책

| 상황 | 처리 |
|---|---|
| 캐시 존재 | 캐시 사용 |
| 캐시 만료 | API 호출 후 캐시 갱신 |
| 일일 비용 상한 도달 | 공공 데이터 fallback |
| SK API 장애 | 공공 pattern fallback |
| 대회 시연 | 사전 수집된 pattern snapshot 사용 |

---

## 12. Updated BigQuery Tables

### 12.1 Public Baseline Feature Table

```sql
CREATE TABLE IF NOT EXISTS `model_features.public_baseline_features` (
  request_id STRING,
  model_context STRING,
  canonical_route_id STRING,
  canonical_station_id STRING,
  canonical_stop_id STRING,
  dow STRING,
  hh INT64,
  mm INT64,
  peak_hour_flag BOOL,
  eta_minutes FLOAT64,
  wait_minutes FLOAT64,
  headway_minutes FLOAT64,
  headway_variance FLOAT64,
  route_frequency_index FLOAT64,
  stop_demand_proxy FLOAT64,
  route_peak_pattern FLOAT64,
  public_delay_proxy FLOAT64,
  transfer_buffer_min FLOAT64,
  walking_distance_m FLOAT64,
  raw_eta_min FLOAT64,
  deadline_buffer_min FLOAT64,
  num_transfers INT64,
  walk_minutes FLOAT64,
  mode_sequence STRING,
  created_at TIMESTAMP
)
PARTITION BY DATE(created_at)
CLUSTER BY model_context, canonical_route_id, canonical_station_id;
```

### 12.2 SK Enriched Feature Table

```sql
CREATE TABLE IF NOT EXISTS `model_features.sk_enriched_features` (
  request_id STRING,
  model_context STRING,
  line_id STRING,
  canonical_station_id STRING,
  canonical_start_station_id STRING,
  canonical_end_station_id STRING,
  canonical_prev_station_id STRING,
  updn_line STRING,
  train_type STRING,
  dow STRING,
  hh STRING,
  mm STRING,
  train_congestion_pct FLOAT64,
  train_congestion_score FLOAT64,
  train_congestion_bucket STRING,
  train_pattern_available BOOL,
  train_no_service_flag BOOL,
  car_no INT64,
  car_congestion_score FLOAT64,
  car_congestion_level STRING,
  car_relative_to_train_lag FLOAT64,
  car_rank_within_train_lag INT64,
  car_dispersion_score_lag FLOAT64,
  car_alighting_rate_pct FLOAT64,
  alighting_rank INT64,
  alighting_avoidance_score FLOAT64,
  exit_alighting_conflict FLOAT64,
  created_at TIMESTAMP
)
PARTITION BY DATE(created_at)
CLUSTER BY model_context, line_id, canonical_station_id, car_no;
```

### 12.3 Model Experiment Table

```sql
CREATE TABLE IF NOT EXISTS `model_evaluation.model_experiments` (
  experiment_id STRING,
  model_name STRING,
  model_version STRING,
  training_dataset STRING,
  test_dataset STRING,
  calibration_dataset STRING,
  algorithm STRING,
  feature_schema_version STRING,
  target_name STRING,
  metrics_json STRING,
  created_at TIMESTAMP
)
PARTITION BY DATE(created_at)
CLUSTER BY model_name, model_version;
```

---

## 13. 코드 골격

### 13.1 Public Baseline Trainer

```python
class PublicBaselineTrainer:
    def __init__(self, model_name: str, preprocessor, estimator):
        self.model_name = model_name
        self.preprocessor = preprocessor
        self.estimator = estimator

    def build_pipeline(self):
        return Pipeline([
            ("preprocessor", self.preprocessor),
            ("estimator", self.estimator),
        ])

    def train(self, X, y, sample_weight=None):
        pipeline = self.build_pipeline()
        pipeline.fit(X, y, estimator__sample_weight=sample_weight)
        return pipeline
```

### 13.2 SK Calibration Runner

```python
class SKCalibrationRunner:
    def __init__(self, base_model, method: str = "isotonic"):
        self.base_model = base_model
        self.method = method

    def calibrate(self, X_calib, y_calib):
        calibrator = CalibratedClassifierCV(
            estimator=self.base_model,
            cv="prefit",
            method=self.method,
        )
        calibrator.fit(X_calib, y_calib)
        return calibrator
```

### 13.3 Combined Fine-tuning

```python
def combine_public_sk_training_data(public_df, sk_df):
    df = pd.concat([public_df, sk_df], axis=0, ignore_index=True)

    df["sample_weight"] = df["label_quality"].map({
        "A": 1.0,
        "B": 0.8,
        "C": 0.4,
        "D": 0.2,
    }).fillna(0.3)

    return df
```

---

## 14. Model Promotion Rules

운영 모델로 승격하기 위한 기준을 정의한다.

### 14.1 Boarding Risk Promotion

| 기준 | 통과 조건 |
|---|---|
| PR-AUC | baseline 대비 +5% 이상 |
| Recall@HighRisk | 0.85 이상 |
| False Safe Rate | 기존 모델 이하 |
| Brier Score | calibration 후 개선 |
| p95 latency | 500ms 이하 |

### 14.2 Deadline Success Promotion

| 기준 | 통과 조건 |
|---|---|
| On-time Recall | baseline 대비 개선 |
| False Safe Rate | 기존 모델 이하 |
| Average Lateness | 감소 |
| Cost Regret | 증가하지 않음 |
| p95 latency | 700ms 이하 |

### 14.3 Car Guide Ranker Promotion

| 기준 | 통과 조건 |
|---|---|
| NDCG@3 | rule baseline 대비 개선 |
| Hit@1 | 개선 |
| Positive Feedback Rate | 개선 |
| No worse than engine fallback | 필수 |
| p95 latency | 400ms 이하 |

---

## 15. 최종 구현 우선순위 v5

### Phase A — Public Baseline

1. `public_baseline_features` 생성
2. public proxy label 생성 규칙 구현
3. Boarding Risk Logistic Regression baseline
4. Transfer Failure buffer baseline
5. Deadline Success logistic baseline
6. ETA Error ridge baseline
7. coefficient/feature importance 리포트

### Phase B — SK Validation

1. SK train/car/alighting pattern ingestion
2. `sk_enriched_features` 생성
3. SK hold-out test set 구성
4. public baseline의 SK test 성능 측정
5. proxy label 한계 분석

### Phase C — Calibration

1. calibration set 분리
2. Platt/Isotonic 비교
3. Brier score, calibration curve 산출
4. threshold 재설정
5. model registry에 calibrated model 등록

### Phase D — Fine-tuning

1. public + SK combined dataset 구성
2. sample_weight 적용
3. Logistic/Ridge 재학습
4. LightGBM 모델 학습
5. SK hold-out test에서 최종 평가
6. production candidate 선정

### Phase E — Operation

1. SK API 캐싱 정책 적용
2. cost tracking table 운영
3. online inference에 modelVersion 포함
4. evidence에 public/SK source 구분
5. feedback label 수집
6. 다음 학습 cycle 반영

---

## 16. 최종 판단

v5의 최종 방향은 다음이다.

```text
공공 데이터는 baseline과 feature engineering의 기반이다.
SK API 데이터는 고품질 target, test set, calibration, fine-tuning의 기반이다.
두 데이터의 역할을 섞지 않고 분리하면,
비용을 통제하면서도 모델 성능을 단계적으로 끌어올릴 수 있다.
```

모델별 최종 전략은 이렇게 정리한다.

| 모델 | 최종 전략 |
|---|---|
| Boarding Risk | 공공 baseline → SK test → calibration → LightGBM |
| Transfer Failure | 공공 buffer baseline → SK alighting/crowding feature 추가 |
| Deadline Success | 공공 ETA baseline → SK 혼잡 penalty + ETA error 보정 |
| ETA Error | public delay feature → 실제/운영 로그 + SK 혼잡 feature로 회귀 |
| Train Congestion | SK target 전용, 공공 feature 보조 |
| Car Congestion | SK target 전용 |
| Car Guide Ranker | rule engine → SK feature + user feedback ranker |
| Intent Classifier | synthetic/public query baseline → real chat log fine-tuning |

이제 다음 단계는 코드다.

```text
1. feature builder skeleton
2. public baseline notebook
3. SK ingestion script
4. calibration runner
5. model registry writer
6. FastAPI inference wrapper
```
