# 탈수있나 IA

> 목적: 현재 구현된 탭/화면/overlay 구조와 사용자 플로우를 코드 기준으로 고정한다. 기존 IA/모바일 FSD/PRD의 화면 성격 내용은 이 문서로 흡수한다.
> SSOT: `docs/deep-research-report.md`

## 1. 현재 IA 결정

현재 IA는 하단 탭 3개와 지도 컨텍스트 overlay로 구성된다. AI chat은 독립 하단 탭이 아니다.

| Depth | ID | 이름 | 현재 구현 |
|---|---|---|---|
| 1 | `TAB_MAP` | 지도 | `activeTab === "map"`일 때 `MapPage` |
| 1 | `TAB_ARCHIVE` | 기록 | `activeTab === "archive"`일 때 `ArchivePage` |
| 1 | `TAB_SETTINGS` | 설정 | `activeTab === "settings"`일 때 `SettingsPage` |
| Overlay | `OV_AI_CHAT` | AI chat overlay | `mapLayer === "ai_overlay" 또는 "ai_peek"` |
| Overlay | `OV_AI_RESULT` | AI result card | `mapLayer === "ai_result"` |
| Overlay | `OV_REPORT_DETAIL` | 리포트 상세 | `mapLayer === "report_detail"` |

## 2. 화면 ID

| 화면 ID | 경로/컴포넌트 | 책임 |
|---|---|---|
| `SCR_MAP` | `src/pages/map-page/index.tsx`, `MapWorkspace` | 프리셋, AI 진입, 리포트 상세 composition |
| `SCR_ARCHIVE` | `src/pages/archive-page/index.tsx`, `ArchiveCalendar` | 저장 리포트 캘린더, 목록, 복원 |
| `SCR_SETTINGS` | `src/pages/settings-page/index.tsx`, `SettingsForm` | 루틴 지점, 이동 조건, AI 스타일 |
| `SCR_MAP_CANVAS` | `TransitMapPanel` | SVG map, 역 노드, 레이어, 선택 경로 |
| `SCR_AI_CHAT` | `AiChatLayer` | 채팅 메시지, 추천 질문, 결과 반영 |

## 3. 기능 ID

| 기능 ID | 기능 | 현재 기준 |
|---|---|---|
| `F0` | 온보딩/사용자 기본 상태 | memory state |
| `F1` | 지도와 역 선택 | station mock |
| `F2` | 교통 레이어/지도 인터랙션 | `visibleLayers`, SVG |
| `F3` | 경로 후보 생성/선택 | mock route planner |
| `F4` | 리포트 4종 | report sheet |
| `F5` | AI chat overlay | current `/api/chat` legacy alias + client fallback; target `/api/v1/decision/chat` |
| `F6` | 기록/저장 리포트 | localStorage |
| `F7` | 설정/선호값 | localStorage |
| `F8` | Express/Vercel `/api/chat` | server boundary |

## 4. 사용자 플로우

| 플로우 | 순서 |
|---|---|
| 최초 진입 | 온보딩 Step 1 -> Step 2 또는 비회원 체험 -> 지도 |
| 경로 탐색 | 지도 탭 -> 프리셋 또는 출발/도착 변경 -> route planner 재계산 -> selected plan 갱신 |
| 리포트 확인 | 지도 탭 -> 리포트 상세 -> report type 선택 -> report view 표시 |
| AI 추천 | 지도 검색 card 또는 AI 원인 브리핑 -> AI overlay -> 메시지 전송 -> current `/api/chat` legacy alias 또는 target `/api/v1/decision/chat` -> fallback -> `ai_result` |
| 저장/복원 | 리포트 저장 -> 기록 탭 -> 날짜/리포트 선택 -> 지도 탭으로 복원 |
| 설정 반영 | 설정 탭 -> preferences 변경 -> localStorage 저장 -> 루틴 동기화로 지도 출발/도착 반영 |

## 4-1. Target Flow With `/api/v1`

| 플로우 | Target API | 저장 여부 |
|---|---|---|
| station lookup | `GET /api/v1/stations/search` | 저장 없음 |
| route preview | `POST /api/v1/route-plans` | `routePlanId`/options 생성. archive 저장은 아님 |
| decision preview | `POST /api/v1/decision/route-report` | `decisionReportId`/evidence 생성. archive 저장은 아님 |
| report save | `POST /api/v1/reports` | route/provider/decision/model/evidence snapshot 저장 |
| decision chat | `POST /api/v1/decision/chat` | 기본 no-store, 필요 시 P1 session |
| report archive | `GET /api/v1/reports`, `GET /api/v1/reports/{savedReportId}` | 저장 snapshot 조회 |

## 4-2. QA Scenario Map

| Scenario | Given | When | Then |
|---|---|---|---|
| Onboarding persistence | first visit | onboarding completed | next visit should skip onboarding via `talsu.onboarding.v1` |
| Route preview no-archive | map has origin/destination | route preview requested | routePlanId/options exist but report archive count does not change |
| Decision preview no-archive | routePlanId/options exist | decision preview requested | decisionReportId/evidence appears without saved report |
| Save snapshot | decision preview exists | user saves report | archive contains report with route/decision snapshot |
| Restore snapshot | saved report exists | user opens report | map/report state restores from snapshot, not current preview |
| AI overlay context | map route selected | user opens AI overlay | overlay keeps current route/report context |
| Tab preservation | AI result visible | user navigates archive/settings/map | map tab resets only by defined navigation rules |

## 5. URL Routing

현재 URL routing은 없다. `AppRouter`는 `activeTab` 값으로 page entry를 선택한다. URL routing 도입 여부는 별도 결정 사항이다. 도입 시에도 `pages/*/index.tsx`는 composition boundary로 유지한다.

## 6. 상태 표시

| 구분 | 표시 |
|---|---|
| 현재 코드와 동기화됨 | 하단 탭 3개, AI overlay, activeTab router, 화면/기능 ID |
| 계획성 | URL routing, deep link, auth gate, map provider route |
| 미확정 | 관리자/PC IA, 알림 화면, 로그인/회원 화면 |
