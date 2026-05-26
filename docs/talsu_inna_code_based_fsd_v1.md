# 탈수있나 Code-Based FSD v1.0

> 목적: 현재 `data_insight` 프론트엔드 코드베이스를 기준으로 기능을 전수 분해하고, 이후 리팩토링/연동/QA의 기준이 되는 Functional Specification Document를 정의한다.  
> 작성일: 2026-05-26  
> 기준 커밋: `d928788` (`frontend/main`) + 로컬 안정화 패치  
> 메인 레퍼런스: `/home/sieg/projects-wsl/miriart_docs/fsd/MiriArt_FSD_v2.md`  
> 도메인 참고: `docs/talsu_inna_prd.md`, `docs/talsu_inna_mobile_fsd.md`

## 0. 문서 원칙

본 문서는 기획 이상형이 아니라 **현재 코드 기준 구현 사실**을 우선한다. 따라서 기능 상태는 다음 네 단계로 구분한다.

| 상태 | 의미 |
|---|---|
| 구현됨 | 현재 UI/상태/서버 코드에서 직접 동작한다. |
| Mock 구현 | 실제 API/DB 없이 프론트 로컬 데이터 또는 서버 fallback으로 동작한다. |
| 부분 구현 | UI는 있으나 저장/인증/실시간 데이터 등 일부 축이 빠져 있다. |
| 미구현 | PRD/FSD 문서에는 있으나 현재 코드에 없다. |

## 1. 기능 범위 요약

| ID | 기능명 | Phase | 우선순위 | 주요 코드 | 구현 상태 |
|---|---|---:|---:|---|---|
| F0 | 앱 셸, 온보딩, 기본 사용자 상태 | P1 | P0 | `src/App.tsx` | 구현됨 |
| F1 | 지도 메인 및 역 선택 | P1 | P0 | `src/App.tsx`, `src/components/InteractiveMap.tsx` | Mock 구현 |
| F2 | 교통 레이어/지도 인터랙션 | P1 | P0 | `src/components/InteractiveMap.tsx` | Mock 구현 |
| F3 | 경로 플랜 계산 및 선택 | P1 | P0 | `src/data.ts`, `src/App.tsx` | Mock 구현 |
| F4 | 이동 판단 리포트 4종 | P1 | P0 | `src/App.tsx`, `src/data.ts` | Mock 구현 |
| F5 | AI 챗 오버레이 및 추천 반영 | P1 | P0 | `src/App.tsx`, `server.ts` | 부분 구현 |
| F6 | 리포트 저장/기록/캘린더 | P1 | P1 | `src/App.tsx`, `src/data.ts` | Mock 구현 |
| F7 | 사용자 설정/선호값 | P1 | P1 | `src/App.tsx`, `src/data.ts` | 부분 구현 |
| F8 | Express 서버 및 `/api/chat` | P1 | P0 | `server.ts` | 부분 구현 |
| F9 | 실제 공공데이터/API/계정 영속화 | P2 | P0 | 없음 | 미구현 |

### 1.1 최신 원격 반영 사항

2026-05-26 현재 원격 최신 `d928788`은 직전 `bbc9125` 대비 다음을 변경했다.

| 영역 | 변경점 | 영향 |
|---|---|---|
| 프리셋 카드 | 프리셋 title/summary/tag 문구를 더 긴급 상황 중심으로 조정. 태그에 혼잡/만차/심야 상태를 직접 표시. | 지도 첫 화면에서 사용자가 세 가지 핵심 시나리오를 더 빨리 구분한다. |
| 프리셋 UI | 카드 내부 제목/요약 타이포를 키우고, 긴급도 progress bar를 추가. | 단순 칩에서 상황 카드에 가까운 UI로 발전. |
| 지도 핸들러 | `handleResetLayers`, `handleZoomIn`, `handleZoomOut`, `handleLayerClick`, `getPathSegments`, 역 선택 핸들러를 `useCallback`으로 최적화. | `InteractiveMap`의 불필요한 함수 재생성을 줄이는 방향. |
| 지도 렌더링 | SVG overlay 일부를 `useMemo`로 묶어 재렌더 비용을 줄이려는 변경. | 지도 노드/레이어 렌더링 최적화 의도. 로컬 안정화에서 Hook 호출 위치를 top-level로 보정. |
| 타입 안정성 | 원격 코드에는 `preset.time` optional 필드 타입이 빠져 `tsc --noEmit` 실패. | 로컬 안정화에서 `presets` 명시 타입과 `time?: string`을 추가. |

## 2. 코드베이스 구조

| 파일 | 역할 |
|---|---|
| `src/main.tsx` | React 앱 엔트리. `StrictMode`로 `App` 렌더링. |
| `src/App.tsx` | 앱 전체 상태, 온보딩, 탭, 지도 시트, 리포트, AI 챗, 아카이브, 설정을 포함한 단일 컨테이너. |
| `src/components/InteractiveMap.tsx` | 지도 SVG/레이어/역 노드/줌/팬/역 선택 컨텍스트 메뉴를 담당하는 메모이즈드 컴포넌트. |
| `src/data.ts` | 기본 선호값, 저장 리포트 mock, 경로 플랜 mock, 지하철 칸별 mock 데이터 제공. |
| `src/types.ts` | 탭, 지도 레이어, 리포트, 경로, 저장 리포트, 사용자 선호, 채팅 메시지 타입. |
| `src/index.css` | Tailwind v4 import, 글꼴, glass 스타일, 애니메이션, 스크롤바 유틸리티. |
| `server.ts` | Express 서버, Vite middleware, `/api/chat` Gemini 연동 및 fallback 응답. |
| `vite.config.ts` | React/Tailwind Vite 플러그인, alias, HMR 설정. |

## 3. 현재 런타임/인프라 의존

| 영역 | 값/방식 | 비고 |
|---|---|---|
| 프론트엔드 | React 19, Vite 6, Tailwind v4, lucide-react, motion | SPA 형태 |
| 서버 | Express + Vite middleware | `npm run dev`는 `tsx server.ts` |
| 포트 | `3000` | `server.ts`에 하드코딩 |
| AI API | `GEMINI_API_KEY` | 없으면 서버 mock fallback 사용 |
| 실제 DB | 없음 | 모든 앱 데이터는 React state/mock |
| 실제 공공데이터 | 없음 | UI에는 출처가 표시되지만 연동 코드는 없음 |

## 4. 용어 및 타입

| 타입/용어 | 현재 정의 |
|---|---|
| `TabId` | `"map" \| "archive" \| "settings"` |
| `MapLayerState` | `types.ts`에는 `default`, `ai_overlay`, `ai_result`, `report_mini`, `report_summary`, `report_detail`, `evidence`, `map_peek`; `App.tsx` 내부에는 `ai_peek`이 추가되고 일부 이름이 다름. |
| `ReportType` | `"boarding" \| "carriage" \| "deadline" \| "recovery"` |
| `RoutePlan` | 경로명, 수단, ETA, 추가 비용, 위험도, 혼잡도, 설명, 타임라인, 신뢰도. |
| `SavedReport` | 저장 리포트 id/date/type/from/to/status/summary/cost. |
| `UserPreferences` | 집/회사, 혼잡 민감도, 택시비 상한, 도보 제한, 따릉이 허용, AI 스타일, 즐겨찾기. |
| `ChatMessage` | sender, text, timestamp, AI 추천 리포트/역/칸/routeIndex. |

## 5. 기능별 화면/상태 매핑

| 화면/레이어 | 진입 조건 | 핵심 상태 |
|---|---|---|
| 온보딩 Step 1 | `showOnboarding === true`, `onboardingStep === 1` | `showOnboarding`, `onboardingStep` |
| 온보딩 Step 2 | `showOnboarding === true`, `onboardingStep === 2` | `user`, `preferences` |
| 지도 기본 | `activeTab === "map"`, `mapLayer === "default"` | `startStation`, `endStation`, `selectedPlan` |
| 리포트 상세 | `activeTab === "map"`, `mapLayer === "report_detail"` | `selectedReportType`, `plans`, `selectedPlan` |
| AI 오버레이 | `mapLayer === "ai_overlay"` | `chatMessages`, `chatInput`, `chatbotLoading` |
| AI 피크 | `mapLayer === "ai_peek"` | `mapLayer` |
| AI 결과 | `mapLayer === "ai_result"` | 마지막 AI 메시지, `plans`, `selectedPlan` |
| 기록/아카이브 | `activeTab === "archive"` | `savedReports`, `selectedCalendarDay` |
| 설정 | `activeTab === "settings"` | `preferences`, `startStation`, `endStation` |

## 6. 기능 상세

### F0. 앱 셸, 온보딩, 기본 사용자 상태

**Trigger**: 앱 최초 진입.

| 구분 | 내용 |
|---|---|
| Input | 사용자가 온보딩 시작, 비회원 체험, 선호값, 닉네임을 입력한다. |
| Process | `showOnboarding`이 true이면 전체 화면 온보딩 레이어를 표시한다. Step 1은 가치 제안, Step 2는 혼잡 민감도/택시 상한/따릉이/닉네임을 설정한다. 완료 시 `showOnboarding=false`, `user.isLoggedIn=true`. |
| Output | 지도 메인 화면으로 진입하고 상단 바에 사용자명이 표시된다. |
| Exception | 별도 검증/서버 저장 없음. 닉네임 빈 값도 허용된다. |

**인수 조건**

- 시작하기 클릭 시 Step 2로 이동한다.
- 비회원으로 바로 둘러보기 클릭 시 온보딩을 닫고 지도 화면에 진입한다.
- 개인 플랜 분석 시작 클릭 시 설정값이 React state에 반영되고 온보딩이 닫힌다.

### F1. 지도 메인 및 역 선택

**Trigger**: 지도 탭 진입, 역 select 변경, 지도 노드 클릭 후 출발/도착 지정.

| 구분 | 내용 |
|---|---|
| Input | 출발역/목적역 select 값 또는 `InteractiveMap`의 역 컨텍스트 메뉴 선택. |
| Process | `startStation`, `endStation`을 갱신하고 `updateRoutePlans()`가 `getRoutePlans()`를 호출한다. 지도 컴포넌트는 선택된 출발/도착 노드와 경로를 다시 렌더링한다. |
| Output | 지도 경로, 리포트 카드, 경로 후보가 갱신된다. |
| Exception | 현재 지원 역 목록 밖의 값은 UI에서 입력 불가. 실제 위치/GPS 없음. |

**인수 조건**

- 출발/도착 변경 시 경로 후보가 재계산된다.
- 지도 노드를 출발 또는 도착으로 지정할 수 있다.
- 선택된 출발/도착 노드는 지도상 강조 표시된다.

### F2. 교통 레이어/지도 인터랙션

**Trigger**: 지도 레이어 버튼, 줌 버튼, 드래그, 역 hover/click.

| 구분 | 내용 |
|---|---|
| Input | 레이어 토글: `subway`, `bus`, `bike`, `crowd`; 지도 포인터 이벤트; 줌 +/- 버튼. |
| Process | `visibleLayers`가 갱신되고, `InteractiveMap`이 혼잡/버스/따릉이/지하철 레이어 표시 여부를 반영한다. selectedPlan이 있으면 경로 bounds 기반으로 pan/zoom을 조정한다. |
| Output | SVG 지도, 경로 라인, 혼잡 배지, 레이어 툴팁, 역 컨텍스트 메뉴가 표시된다. |
| Exception | 실제 지도 타일/좌표계/GPS 없음. `stations` 배열 기반 mock 지도다. |

**인수 조건**

- 각 레이어 버튼 클릭 시 해당 레이어가 on/off 된다.
- reset 클릭 시 활성 레이어가 모두 꺼진다.
- 경로 선택 시 지도 중심과 zoom이 선택 경로에 맞춰 변한다.

### F3. 경로 플랜 계산 및 선택

**Trigger**: 출발/도착/선호값 변경, 프리셋 클릭, AI 추천 routeIndex 수신.

| 구분 | 내용 |
|---|---|
| Input | `startStation`, `endStation`, `preferences.useBike`, `preferences.maxTaxiFee`. |
| Process | `getRoutePlans(start, end, opts)`가 시나리오별 mock 플랜을 생성한다. 기존 선택 플랜 id가 새 후보에 있으면 유지하고, 없으면 첫 번째 플랜을 선택한다. |
| Output | `plans`, `selectedPlan` 갱신. 리포트 상세의 후보 리스트와 지도 경로가 동기화된다. |
| Exception | 실제 길찾기 엔진 없음. `walkLimitMin`, `crowdSensitivity`는 현재 플랜 계산에 직접 반영되지 않는다. |

**인수 조건**

- `염창역 -> 여의도역`은 지하철/따릉이/택시 결합 후보를 표시한다.
- `사당역 -> 강남역`은 지하철 우회/버스 대기 후보를 표시한다.
- `홍대입구역 -> 남양주시`는 심야 복구 후보를 표시한다.
- 지원하지 않는 조합은 dynamic fallback 후보를 표시한다.

### F4. 이동 판단 리포트 4종

**Trigger**: 리포트 상세 진입 후 리포트 탭 선택.

| ReportType | 화면 | 현재 동작 |
|---|---|---|
| `boarding` | 탑승가능성 | 이번 차량/다음 차량 비교, 잔여석 mock, 다음 차량 권고. |
| `carriage` | 칸별 생존 | `getCarSurvivalDetails()` 기반 칸별 혼잡/등급/이유 표시. |
| `deadline` | 마감도착 | `plans` 비교, 선택 플랜 상세 타임라인, 클립보드 복사. |
| `recovery` | 실패복구 | N버스+택시 분할 복구, 비용 절감, 24시 대기 거점 mock 표시. |

| 구분 | 내용 |
|---|---|
| Input | `selectedReportType`, `startStation`, `endStation`, `deadlineTime`, `selectedPlan`, `carDetails`. |
| Process | 리포트 탭 변경 시 해당 리포트 UI를 조건부 렌더링한다. 저장 CTA는 현재 선택 플랜과 리포트 타입으로 `SavedReport`를 만든다. AI 브리핑 CTA는 `/api/chat`으로 요약 요청을 보낸다. |
| Output | 리포트 카드, 비교표, 타임라인, 저장 리포트. |
| Exception | 리포트 수치 대부분은 mock. 클립보드 복사는 브라우저 권한/환경에 따라 실패할 수 있으나 에러 처리는 없다. |

**인수 조건**

- 리포트 타입 탭 클릭 시 활성 리포트가 바뀐다.
- deadline 리포트에서 후보 선택 시 지도 경로와 타임라인이 바뀐다.
- 저장 클릭 시 중복이 아니면 아카이브에 새 리포트가 추가된다.

### F5. AI 챗 오버레이 및 추천 반영

**Trigger**: 지도 기본 검색 바 클릭, 추천 질문 클릭, 채팅 입력 후 전송, 리포트 AI 원인 브리핑 클릭.

| 구분 | 내용 |
|---|---|
| Input | 사용자 메시지, 현재 지도 context(`startStation`, `endStation`, `deadlineTime`, `preferences`). |
| Process | 클라이언트가 `POST /api/chat` 호출. 성공 시 AI 응답을 `chatMessages`에 추가하고, 응답의 `startStation`, `endStation`, `suggestedReportType`, `recommendedCarNo`, `routeIndex`를 현재 지도 상태에 반영한다. 실패 시 클라이언트 fallback 규칙으로 응답을 생성한다. |
| Output | AI 메시지, 지도/리포트/경로 선택 자동 갱신, `mapLayer="ai_result"`. |
| Exception | 서버 실패 시 700ms 후 로컬 fallback. Markdown 렌더링에 `dangerouslySetInnerHTML`을 사용하므로 현재는 서버 응답 신뢰 전제가 있다. |

**인수 조건**

- 메시지 전송 시 사용자 메시지와 AI 메시지가 순서대로 추가된다.
- AI가 리포트 타입을 반환하면 해당 리포트가 활성화된다.
- AI가 routeIndex를 반환하면 해당 후보 플랜이 선택된다.
- 서버 장애 시에도 fallback 응답이 표시된다.

### F6. 리포트 저장/기록/캘린더

**Trigger**: 리포트 저장, AI 결과의 전술 리포트 생성, 기록 탭 진입, 날짜 선택, 저장 리포트 지도 이동.

| 구분 | 내용 |
|---|---|
| Input | `selectedPlan`, `selectedReportType`, `startStation`, `endStation`, 기존 `savedReports`. |
| Process | 중복 조건을 검사한 뒤 새 `SavedReport`를 state 앞에 추가한다. 기록 탭은 날짜별 저장 리포트를 필터링하고, 캘린더 dot/status를 표시한다. |
| Output | 저장 리포트 목록, 월간 캘린더, 선택 날짜 피드백. |
| Exception | 브라우저 새로고침 시 저장 내용 소실. localStorage/DB 없음. 모두 지우기는 confirm 없이 즉시 실행. |

**인수 조건**

- 저장된 리포트가 기록 탭 목록에 표시된다.
- 날짜 선택 시 해당 날짜의 리포트 요약이 표시된다.
- 지도 이동 클릭 시 출발/도착/리포트 타입을 복원하고 지도 탭으로 이동한다.

### F7. 사용자 설정/선호값

**Trigger**: 설정 탭 진입, 루틴 지점/조건/AI 스타일 변경.

| 구분 | 내용 |
|---|---|
| Input | home, work, maxTaxiFee, walkLimitMin, crowdSensitivity, useBike, aiStyle. |
| Process | 각 select/toggle이 `preferences` state를 갱신한다. 루틴 동기화 버튼은 home/work를 현재 지도 출발/도착으로 적용한다. |
| Output | 경로 재계산, AI context 반영, UI 선호값 표시. |
| Exception | 서버 저장 없음. `aiStyle`, `walkLimitMin`, `crowdSensitivity`는 현재 AI context에는 전달되지만 서버 prompt/fallback 또는 경로 계산에는 제한적으로만 반영된다. |

**인수 조건**

- home/work 변경 후 루틴 동기화 클릭 시 지도 출발/도착이 변경된다.
- maxTaxiFee/useBike 변경 시 경로 후보가 재계산된다.
- AI 스타일 클릭 시 상태와 toast가 갱신된다.

### F8. Express 서버 및 `/api/chat`

**Trigger**: 클라이언트 `fetch("/api/chat")`.

| 구분 | 내용 |
|---|---|
| Input | JSON body: `message`, `context`. |
| Process | `GEMINI_API_KEY`가 있으면 `@google/genai`의 `gemini-2.5-flash`를 JSON schema로 호출한다. 키가 없으면 서버 fallback 규칙으로 `textAnswer`, `suggestedReportType`, `startStation`, `endStation`, `recommendedCarNo`, `routeIndex`를 반환한다. |
| Output | AI 추천 JSON. 개발 모드에서는 Vite middleware로 SPA도 함께 제공한다. 프로덕션에서는 `dist` 정적 파일을 제공한다. |
| Exception | Gemini 호출 실패 시 500 `{ error }` 반환. 클라이언트는 이 경우 로컬 fallback으로 복구한다. |

**인수 조건**

- `GEMINI_API_KEY`가 없어도 `/api/chat`은 mock JSON을 반환해야 한다.
- `npm run dev`는 `http://0.0.0.0:3000`에서 앱을 제공해야 한다.
- `npm run build`는 Vite 클라이언트 번들과 `dist/server.cjs`를 생성해야 한다.

## 7. 현재 PRD/FSD 대비 구현 갭

| 항목 | 기존 문서/PRD | 현재 코드 | 조치 |
|---|---|---|---|
| 하단 탭 | `지도 / AI 챗 / 리포트 / 설정` | `지도 / 기록 / 설정` | 문서 최신화 필요. AI는 지도 오버레이로 정의. |
| 실제 공공데이터 | GBIS, 서울 열린데이터, 따릉이 등 | 연동 없음, mock 문구만 표시 | API adapter 슬라이스 필요. |
| 사용자/계정 | 로그인/비회원/설정 저장 | React state only | Auth/storage 정책 결정 필요. |
| 저장 리포트 | 아카이브 저장/재사용 | 메모리 state | localStorage 또는 서버 저장 필요. |
| 경로 계산 | 실시간/패턴/복합수단 계산 | `getRoutePlans()` mock 분기 | routing engine 분리 필요. |
| 지도 | 지도 기반 앱 | SVG mock map | 실제 지도 SDK 또는 현 SVG 고도화 결정 필요. |
| 타입 정합성 | `MapLayerState` 단일 정의 | `types.ts`와 `App.tsx` 내부 타입 불일치 | 타입 단일화 필요. |
| 보안 | AI 응답 렌더링 | `dangerouslySetInnerHTML` | Markdown sanitizer 도입 필요. |

## 8. 리팩토링 슬라이스 제안

현재 가장 큰 리스크는 `App.tsx`가 화면/상태/업무 로직/API 호출/렌더링을 모두 가진다는 점이다. 이후 구현은 다음 단위로 자르는 것이 적절하다.

| Slice | 목표 파일/폴더 | 내용 |
|---|---|---|
| S1. Types 정리 | `src/types.ts` | `MapLayerState` 불일치 제거, `Preset`, `VisibleLayers`, `StationNode` 타입 공개 여부 결정. |
| S2. Data engine 분리 | `src/domain/routes.ts`, `src/domain/reports.ts` | `getRoutePlans`, 리포트 생성, 중복 저장 규칙 분리. |
| S3. App state hook | `src/hooks/useTransitPlanner.ts` | 출발/도착/선호/플랜/리포트 상태와 이벤트 핸들러 이동. |
| S4. Chat hook/API | `src/api/chat.ts`, `src/hooks/useAiChat.ts` | fetch, fallback, AI 응답 반영 규칙 분리. |
| S5. UI 컴포넌트화 | `src/components/*` | Onboarding, ReportSheet, ArchiveView, SettingsView, AiChatLayer 분리. |
| S6. Persistence | `src/storage/reports.ts` | savedReports/preferences localStorage 저장 또는 서버 연동. |
| S7. Public data adapter | `src/api/transit/*` | GBIS/서울 열린데이터/따릉이 adapter와 mock provider 인터페이스 분리. |

### 8.1 구체 실행 플랜

원격 최신 반영 후 기준으로는 최적화보다 먼저 타입/상태 경계를 고정해야 한다. 다음 순서로 진행한다.

| 순서 | 작업 | 산출물 | 완료 기준 |
|---:|---|---|---|
| 1 | 상태/타입 단일화 | `src/types.ts` 확장 | `MapLayerState`, `PresetScenario`, `VisibleLayers`, `StationNode` 타입이 중복 없이 한 곳에서 관리된다. |
| 2 | 프리셋/시나리오 데이터 분리 | `src/data.ts` 또는 `src/domain/scenarios.ts` | `App.tsx` 내부 `presets` 제거, 긴급도/태그/progress bar 값이 데이터로 이동한다. |
| 3 | 경로 계산 엔진 분리 | `src/domain/routes.ts` | `getRoutePlans()`가 UI와 무관한 순수 함수로 유지되고, 선호값 반영 여부가 테스트 가능해진다. |
| 4 | 리포트 생성 규칙 분리 | `src/domain/reports.ts` | 저장 리포트 중복 판정, status 계산, summary 생성이 UI 밖에서 수행된다. |
| 5 | AI 챗 API 분리 | `src/api/chat.ts`, `src/hooks/useAiChat.ts` | `/api/chat` 호출, 서버 fallback, UI 상태 반영 규칙이 `App.tsx`에서 빠진다. |
| 6 | 지도 컴포넌트 안정화 | `src/components/InteractiveMap.tsx` | Hook은 top-level에서만 호출되고, SVG overlay 렌더링은 memoized child 또는 top-level `useMemo`로 유지된다. |
| 7 | 화면 컴포넌트 분리 | `src/components/onboarding`, `report`, `archive`, `settings`, `chat` | `App.tsx`는 라우팅/상위 state 조립만 담당한다. |
| 8 | 영속성 1차 도입 | `src/storage/preferences.ts`, `src/storage/reports.ts` | 새로고침 후 preferences/savedReports가 유지된다. |
| 9 | 공공데이터 adapter 설계 | `src/api/transit/providers/*` | mock provider와 실제 provider 인터페이스가 동일해진다. |
| 10 | QA 자동화 | TypeScript, build, 핵심 interaction smoke | `npm run lint`, `npm run build`가 통과하고 주요 시나리오가 수동/자동 체크된다. |

### 8.2 우선순위 기준

| 우선순위 | 대상 | 이유 |
|---|---|---|
| P0 | 타입 단일화, `App.tsx` 과밀 해소, AI/route/report domain 분리 | 이후 기능 추가 때 회귀 위험이 가장 크다. |
| P1 | localStorage 영속화, 지도 렌더링 안정화, 리포트 저장 규칙 테스트 | 데모 품질과 사용자 체감에 직접 영향. |
| P2 | 실제 공공데이터 adapter, 계정/DB 저장 | 외부 API 키/정책/백엔드 설계가 필요하다. |

## 9. QA 체크리스트

| 영역 | 체크 |
|---|---|
| Build | `npm run build` 성공. |
| Dev | `npm run dev` 후 `http://localhost:3000` 200 응답. |
| 온보딩 | Step 이동, 비회원 진입, 설정 완료. |
| 지도 | 역 선택, 레이어 토글, 줌/팬, 컨텍스트 메뉴. |
| 경로 | 프리셋 3종, fallback 경로, 후보 선택. |
| 리포트 | 4개 리포트 탭, 저장, 클립보드 복사. |
| AI | 추천 질문, 직접 입력, 서버 fallback, 로컬 fallback. |
| 아카이브 | 저장 목록, 날짜별 표시, 모두 지우기, 지도 이동. |
| 설정 | 루틴 동기화, 택시비/도보/혼잡/따릉이/AI 스타일 변경. |

## 10. 최종 반영 기준

이 문서를 기준으로 다음 작업부터는 신규 기능을 추가하기 전에 해당 기능이 어느 F ID에 속하는지 먼저 지정한다. 코드 변경 후에는 이 문서의 기능 상태, I-P-O-E, 갭 테이블 중 영향을 받는 항목을 같이 갱신한다.
