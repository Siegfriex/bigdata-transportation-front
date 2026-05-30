# 탈수있나 프론트엔드 QA 시나리오

## 핵심 원칙

지도는 항상 사용자의 현재 판단 맥락이다. 리포트, AI, 기록은 지도 맥락을 잃지 않게 열리고 닫혀야 한다.

자동화 기준 파일:

| 파일 | 범위 |
|---|---|
| `tests/e2e/talsu-p0-flow.spec.ts` | v2 happy path: full report, evidence, carousel, AI, 저장/복원 |
| `tests/e2e/talsu-p0-flow-v3-deep.spec.ts` | v3 deep QA: AI 실패/지연, raw id 금지, carousel edge, snapshot, 접근성/visual |

## V2-01. 경로 후보 선택 후 full strategic report

1. 온보딩에서 비회원 둘러보기를 누른다.
2. 지도 하단 프리셋 캐러셀을 좌우로 스와이프한다.
3. 프리셋 카드를 선택한다.

기대 결과:
- 캐러셀은 터치와 마우스 드래그 모두 동작한다.
- 선택 직후 지도 경로가 해당 start/end/selectedPlan 기준으로 갱신된다.
- 리포트는 compact modal이 아니라 지도 위 full strategic report sheet로 열린다.
- 첫 화면에 마감도착, 탑승가능성, 추천칸/생존칸, 복구전략 summary가 모두 보인다.
- 하단 탭이나 AI 패널 아래에 깔리지 않는다.

## V2-02. 전략 근거 sheet

1. 리포트 sheet에서 전략 후보를 좌우로 스와이프한다.
2. 다른 전략을 선택한다.

기대 결과:
- 선택 전략 제목, 지연 위험, 혼잡 압력, 근거 신뢰 bar가 즉시 갱신된다.
- 지도 위 경로도 선택한 전략 기준으로 갱신된다.
- sheet 내부 스크롤과 후보 carousel 스와이프가 충돌하지 않는다.

## V2-03. 근거보기 expand/collapse

1. full strategic report에서 `근거보기`를 누른다.
2. 다시 `근거 접기`를 누른다.

기대 결과:
- `evidence-detail-section`이 열리고 닫힌다.
- evidence item은 최소 3개 이상이며 label/value/detail을 가진다.
- 버튼의 active/expanded 상태가 사용자가 볼 수 있게 바뀐다.

## V2-04. 저장 플로우

1. 리포트 sheet에서 전략 저장을 누른다.

기대 결과:
- 사용자를 기록 탭으로 강제 이동시키지 않는다.
- 현재 sheet와 지도 맥락을 유지한다.
- 저장 완료 toast만 표시한다.
- 사용자가 직접 기록 탭을 눌렀을 때 저장된 리포트가 보인다.
- 동일 리포트를 다시 저장하면 중복 저장 toast 또는 기존 저장 안내가 나온다.

## V2-05. AI 근거 질문

1. 리포트 sheet에서 AI 근거 질문을 누른다.

기대 결과:
- 리포트 sheet는 닫히고 AI sheet가 열린다.
- AI context summary는 출발/도착과 사람용 전략/report label을 표시한다.
- `plan_a`, `boarding`, `srpt_...` 같은 raw id/enum은 노출하지 않는다.
- AI 답변 생성 중에는 말풍선 skeleton과 상태 문구가 표시된다.
- 실패 시 fallback estimate warning이 표시된다.

## V2-06. 기록 복원

1. 기록 탭에서 저장된 리포트를 선택한다.

기대 결과:
- 지도 탭으로 돌아온다.
- 출발/도착/선택 경로/전략/리포트 타입이 저장 snapshot 기준으로 복원된다.
- `snapshot-badge` 또는 저장 시점 label이 보인다.
- 복원 상태에서 AI 근거 질문을 누르면 저장 리포트 기준 context가 유지된다.

## V3 Deep QA Matrix

| ID | 검증 |
|---|---|
| V3-01 | `/api/chat` 2초 지연 시 overlay, skeleton, 상태 문구가 보인다. |
| V3-02 | timeout/500 실패 시 fallback warning과 retry가 보이고 report context는 유지된다. |
| V3-03 | invalid schema 응답이 raw JSON/white screen 없이 fallback된다. |
| V3-04 | AI 근거 질문 5회 연속 클릭이 overlay/message/request를 중복 생성하지 않는다. |
| V3-05 | AI context와 body에 raw id/enum, 챗봇 자기소개, emoji prefix가 없다. |
| V3-06 | carousel 첫/마지막 boundary swipe가 깨지지 않는다. |
| V3-07 | drag threshold 미만은 tap, threshold 이상은 drag로 처리된다. |
| V3-08 | 전략 선택 시 summary/evidence/map/tactical/AI context가 함께 갱신된다. |
| V3-09 | 저장 in-flight 중 탭 전환 후에도 저장 결과와 context가 유지된다. |
| V3-10 | 저장 실패는 retry 가능하고 selected plan/strategy를 잃지 않는다. |
| V3-11 | 중복 저장은 idempotent하게 처리된다. |
| V3-12 | 복원 snapshot 상태에서 새 route card 선택 시 live preview로 명확히 전환된다. |
| V3-13 | 복원 snapshot 상태에서 전략 변경 정책이 명확히 처리된다. |
| V3-14 | 삭제된 saved report는 복원되지 않고 not found/refresh 안내로 처리된다. |
| V3-15 | 손상된 localStorage로 새로고침해도 앱이 crash하지 않는다. |
| V3-16 | 320px 모바일에서 AI input/send button이 safe area 안에 보인다. |
| V3-17 | 키보드 navigation, ESC close, focus restore가 동작한다. |
| V3-18 | 장시간 상호작용 중 console/page error와 overlay 누적이 없다. |
| V3-P1 | archive weekday label은 읽을 수 있는 글자와 `aria-label`을 가진다. |

## 회귀 체크

- bottom nav는 리포트 sheet 위로 올라오면 안 된다.
- 프리셋 선택 후 report type이 자동 effect로 엉뚱하게 바뀌면 안 된다.
- 저장은 navigation action이 아니라 persistence action이다.
- hover 없는 모바일에서도 모든 정보 접근이 가능해야 한다.
- AI 실패는 decision failure가 아니며, report state를 바꾸지 않는다.
- compact route summary와 full strategic report는 역할을 섞지 않는다.

## 실행 명령

| 목적 | 명령 |
|---|---|
| lint | `npm run lint` |
| build | `npm run build` |
| e2e | `npm run e2e` |
| e2e screenshot update | `npm run e2e:update` |
