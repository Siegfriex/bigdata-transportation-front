# 탈수있나 인터랙션 상태 정책

탈수있나의 인터랙션은 화려함보다 판단 신뢰를 우선한다. 로딩은 불안 감소형 skeleton 중심, 짧은 처리에는 inline spinner, hover는 절제된 affordance, 모션은 빠르고 기능적으로만 사용한다.

## 상태 원칙

모든 interactive element는 rest, hover, active, focus, disabled 상태를 분리한다.

- rest: 기본 정보 밀도와 대비를 유지한다.
- hover: 클릭 가능성만 알린다. 색상, border, shadow 중 최대 2가지만 바꾼다.
- active: 입력이 수락됐다는 pressed 느낌을 짧게 준다.
- focus: 키보드 접근성을 위해 focus ring을 반드시 제공한다.
- disabled: hover, active 효과를 제거하고 opacity와 cursor로 비활성 상태를 명확히 한다.

## Loading Policy

- 300ms 이내 응답은 별도 로딩 UI를 노출하지 않는다.
- 300ms~1.5초 응답은 inline spinner 또는 button spinner를 사용한다.
- 1.5초 이상 소요되며 결과 레이아웃이 예측 가능한 경우 skeleton을 사용한다.
- 기존 콘텐츠를 유지할 수 있는 갱신은 full-screen spinner를 금지하고 inline progress로 처리한다.
- AI 응답 생성, 경로 재탐색, 리포트 생성은 단계형 상태 문구를 함께 표시한다.

## Skeleton Policy

- skeleton은 실제 레이아웃과 유사해야 한다.
- shimmer는 저대비, 저속도로 사용한다.
- fake data처럼 보이는 텍스트 표시를 금지한다.
- 이미지, 차트, 지도는 block skeleton으로, 텍스트는 line skeleton으로 구분한다.

## Motion Policy

- hover: 80~120ms
- active press: 50~90ms
- sheet open/close: 180~240ms
- toast enter: 160~220ms
- shimmer skeleton: 느리게, 과하지 않게
- loading spinner: 1초 linear infinite
- reduced motion: shimmer와 slide를 최소화한다.

## 서비스별 상태 매핑

| 상황 | 권장 상태 |
| --- | --- |
| 지도 카드 목록 로딩 | skeleton |
| 리포트 카드 본문 로딩 | skeleton |
| 버튼 클릭 후 짧은 처리 | button spinner |
| AI 답변 생성 중 | 말풍선 skeleton + 상태 문구 |
| 경로 재탐색 중 | 기존 결과 유지 + 상단 slim progress |
| 저장/제출 | spinner 또는 progress + 명확한 처리 문구 |

## 시스템 상태 라벨

- live data unavailable
- fallback estimate
- cached result used
- partial data
- stale data
- retryable error
