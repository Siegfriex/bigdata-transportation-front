# Visual Design QA Report

## 1. Overall Visual Verdict
- PARTIAL PASS
- 가장 큰 시각 리스크: 전략리포트의 핵심 4대 지표보다 route/editor와 carousel이 먼저 커 보이고, 하단 CTA가 첫 화면에서 보이지 않아 AI 근거 질문과 저장 행동이 묻힌다.

## 2. Screenshot Inventory
| 화면 | viewport | screenshot path | 판정 |
|---|---:|---|---|
| 지도 기본 화면 | 320 | test-results/visual-polish-before/visual-map-default-320.png | PASS |
| 지도 + 경로 후보 carousel | 390 | test-results/visual-polish-before/visual-route-carousel-390.png | PASS |
| full strategic report | 320 | test-results/visual-polish-before/visual-strategic-report-320.png | PARTIAL |
| full strategic report | 390 | test-results/visual-polish-before/visual-strategic-report-390.png | PARTIAL |
| evidence expanded | 390 | test-results/visual-polish-before/visual-evidence-expanded-390.png | PARTIAL |
| AI 근거 loading/answer | 390 | test-results/visual-polish-before/visual-ai-evidence-loading-390.png | PARTIAL |
| AI 근거 answer | 390 | test-results/visual-polish-before/visual-ai-evidence-answer-390.png | PARTIAL |

## 3. Visual Hierarchy Audit
| 화면 | 문제 | 사용자 영향 | 수정 제안 | 우선순위 |
|---|---|---|---|---|
| Strategic report | 4대 지표 value가 14px 수준이라 결론 카드가 강하게 읽히지 않음 | 첫 3초 안에 탈 수 있는지 판단이 늦음 | metric value를 키우고 카드 최소 높이/대비를 정리 | P0 |
| Strategic report | 저장/AI CTA가 스크롤 하단에 있어 첫 화면에 없음 | 핵심 행동을 발견하기 어려움 | sheet 내부 sticky CTA로 고정하고 safe-area padding 적용 | P0 |
| AI restored context | saved report id가 snapshot label 옆에 노출될 수 있음 | 사용자가 내부 id를 의미 있는 정보로 오해 | id 렌더링 제거, 사람용 label만 표시 | P0 |
| AI overlay | 닫기 버튼이 24px로 작음 | 모바일 터치 실패 가능 | 44px touch target 적용 | P0 |

## 4. Layout / Spacing Audit
| 위치 | 현재 문제 | 권장 spacing/grid | 우선순위 |
|---|---|---|---|
| Summary grid | 2x2 grid 자체는 유지되나 카드 높이와 value baseline이 약함 | 2x2, gap 8px, min-height 92px | P0 |
| Report CTA | border-top only, sticky 아님, safe area 없음 | sticky bottom, px 16px, pb safe-area | P0 |
| AI context | restored badge 안에서 id가 긴 문자열이면 줄흐름 저하 | label only, no id | P0 |

## 5. Typography Audit
| 위치 | 현재 문제 | 권장 type token | 우선순위 |
|---|---|---|---|
| SummaryMetric value | 핵심 판단값이 body 크기와 유사 | metricValue: 18-20px bold leading-tight | P0 |
| CTA labels | 40px 이하 버튼에서 시각/터치 우선순위 부족 | min 44px, text-sm/semibold | P0 |
| AI close | icon-only target이 너무 작음 | 44px icon button | P0 |

## 6. Color / Contrast / WCAG Audit
| 위치 | 문제 | contrast 추정/측정 | 수정 제안 | 우선순위 |
|---|---|---:|---|---|
| Summary detail | text-white/55가 tinted card 위에서 약함 | 낮음 추정 | text-white/70 이상 | P0 |
| Warning/danger cards | 색상만으로 의미가 전달되는 경향 | 보통 | 텍스트 label 유지, 배경/테두리 강화 | P0 |
| Focus ring | 기본 token은 존재하지만 작은 버튼에서 확인 어려움 | 보통 | 버튼 target 확대 | P0 |

## 7. Interaction Audit
| 컴포넌트 | 문제 | 테스트 방법 | 수정 제안 | 우선순위 |
|---|---|---|---|---|
| Report CTA | 첫 화면에서 접근 불가 | 390px report screenshot | sticky CTA | P0 |
| AI close | 24px hit target | DOM/class audit | 44px target | P0 |
| Car/route cards | carousel drag/click 기본 구현 있음 | e2e drag test | 유지 | PASS |

## 8. Design Token Recommendations
- color: 기존 semantic CSS 변수 유지, card text contrast만 상향
- typography: metric value와 CTA label만 우선 조정
- spacing: grid gap 8px, card padding 12px, sticky CTA padding 16px
- radius: report metric/card는 14px 계열로 통일
- shadow: CTA sticky bar에 상단 shadow 추가
- z-index: sheet 50, bottom nav 30, toast 100 유지
- motion: 기존 200-300ms 범위 유지

## 9. P0 Patch Plan
| 파일 | 수정 내용 | 이유 |
|---|---|---|
| src/widgets/report-sheet/ui/ReportDetailPanel.tsx | SummaryMetric value/detail 위계 및 radius/min-height 조정 | 4대 지표 판독성 |
| src/widgets/report-sheet/ui/ReportActionBar.tsx | sticky CTA, safe-area padding, 44px touch target | CTA 노출/터치 |
| src/widgets/ai-chat-panel/ui/AiChatLayer.tsx | savedReportId 표시 제거, close button 44px | raw id 노출 제거/터치 접근성 |
