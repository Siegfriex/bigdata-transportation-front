# Visual Polish Result

## 1. Overall Verdict
- PARTIAL PASS

## 2. What Changed
| 파일 | 변경 내용 | 이유 |
|---|---|---|
| src/widgets/report-sheet/ui/ReportDetailPanel.tsx | 4대 summary metric 카드의 value 크기, detail 대비, 카드 최소 높이와 radius 정리 | 사용자가 첫 화면에서 마감도착/탑승가능/생존칸/복구전략 결론을 더 빨리 읽도록 조정 |
| src/widgets/report-sheet/ui/ReportActionBar.tsx | 저장/AI CTA를 sheet 내부 sticky bar로 변경하고 44px touch target, safe-area padding, 상단 shadow 적용 | 핵심 CTA가 긴 report 하단에 묻히지 않고 모바일에서 누르기 쉬워지도록 조정 |
| src/widgets/ai-chat-panel/ui/AiChatLayer.tsx | 복원 snapshot badge에서 saved report id 표시 제거, 닫기 버튼을 44px target으로 확대 | internal id 노출 제거와 모바일 닫기 조작 안정화 |
| src/widgets/archive-calendar/ui/ArchiveCalendar.tsx | 요일 label의 font/`aria-label`/`data-testid` 보강 | 작은 viewport에서 weekday glyph와 screen reader label 회귀 방지 |
| src/features/toggle-map-layer/model/types.ts | `MapLayerState`를 현재 사용하는 4개 상태로 축소 | stale overlay state가 IA/테스트에 남지 않도록 정리 |
| src/app/model/mapDecisionReducer.ts | AI evidence close return layer를 `default`/`report_detail`로 제한 | AI overlay 종료 후 report context 복귀 안정화 |
| docs/visual_design_qa_report.md | 수정 전 시각 QA report 작성 | skill 요구사항에 맞춘 P0 근거 기록 |

## 3. Visual Improvements
- 시각위계: 4대 지표 value가 body text보다 분명히 커지고, CTA가 첫 report 화면 하단에 노출된다.
- 레이아웃/마진: report scroll area와 sticky CTA의 하단 여백을 분리했다.
- 타입 시스템: metric value를 18px bold 계열로 상향했다.
- 색대비/WCAG: metric detail을 `text-white/72`로 올려 tinted card 위 판독성을 개선했다.
- 인터랙션: AI 닫기 버튼과 report CTA가 44px 이상 touch target을 갖는다.
- 모바일 safe area: CTA bar에 `env(safe-area-inset-bottom)` padding을 적용했다.
- 접근성: archive weekday label과 AI close/report CTA test id를 고정했다.
- 디자인 토큰: 전체 토큰 대개편은 하지 않고 기존 CSS 변수/클래스 체계를 유지했다.

## 4. Screenshots
| 화면 | 경로 | 판정 |
|---|---|---|
| strategic report mobile 320 | test-results/visual-polish-after/visual-strategic-report-320.png | PASS |
| strategic report mobile 390 | test-results/visual-polish-after/visual-strategic-report-390.png | PASS |
| evidence expanded mobile | test-results/visual-polish-after/visual-evidence-expanded-390.png | PARTIAL |
| AI evidence answer mobile | test-results/visual-polish-after/visual-ai-evidence-answer-390.png | PARTIAL |
| archive list mobile | test-results/visual-polish-after/visual-archive-list-mobile.png | PASS |

## 5. Verification
- npm run lint: PASS
- npm run build: PASS
- npm run e2e: PASS, 60 passed
- screenshot comparison: manual before/after review completed for 320/360/390 report states and AI/archive states
- console/page errors: no console or page errors in the passing e2e long interaction soak

## 6. Remaining Visual Debt
| 항목 | 심각도 | 후속 작업 |
|---|---|---|
| Desktop 1280px full matrix | P1 | v3 e2e에 desktop screenshot 수집은 추가됐으나 CI baseline 비교 정책은 아직 없다. |
| Archive calendar weekday glyphs | P1 | weekday label test는 추가됐고, 실제 OS/font 조합별 시각 baseline은 추가 확인이 필요하다. |
| 전체 token 통합 | P1 | 임의 Tailwind color/class가 아직 남아 있다. 전체 semantic token migration은 별도 작업으로 분리한다. |
