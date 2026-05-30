# 탈수있나 Refactor & Development Plan v1.0

> 목적: `docs/talsu_inna_code_based_fsd_v1.md`의 기능 분해와 리팩토링 슬라이스를 실제 개발 가능한 단계로 심층화한다.
> 기준 코드: `cf6365e` (`publish/main`)
> 작성일: 2026-05-26
> 원칙: 현 기능을 깨지 않고, `App.tsx` 과밀 구조를 점진적으로 해체하며, mock 기반 MVP를 실제 데이터/영속성/테스트 가능한 구조로 전환한다.

## 1. 현재 상태 진단

### 1.1 구조적 병목

| 병목 | 현재 상태 | 리스크 |
|---|---|---|
| `App.tsx` 과밀 | 온보딩, 지도 시트, 리포트, AI 챗, 아카이브, 설정, API 호출, 저장 규칙이 한 파일에 공존 | 기능 추가 시 회귀 범위가 전체 앱으로 번짐 |
| 타입 중복 | `MapLayerState`가 `types.ts`와 `App.tsx` 내부에서 다르게 정의됨 | 상태값 추가/삭제 시 타입 불일치 발생 |
| mock 데이터와 UI 결합 | 프리셋, 경로, 리포트 저장 문구가 UI 코드에 섞임 | 실제 API 연동 시 교체 비용 증가 |
| 지도 컴포넌트 취약 | SVG 렌더링, 줌/팬, 레이어, 컨텍스트 메뉴가 단일 컴포넌트에 집중 | 최적화 시 화면 깨짐 가능성 높음 |
| AI 응답 렌더링 | `dangerouslySetInnerHTML`로 Markdown-like 텍스트 렌더링 | 서버 응답 신뢰 전제가 깨지면 XSS 위험 |
| 영속성 부재 | preferences/savedReports가 React state에만 존재 | 새로고침 시 사용자 데이터 소실 |
| 검증 한계 | `lint/build`는 통과하지만 시각 회귀 검증은 없음 | “빌드는 되지만 화면이 깨지는” 케이스 발생 |

### 1.2 개발 방향

1. 타입과 domain model을 먼저 고정한다.
2. 순수 로직을 UI 밖으로 빼서 테스트 가능하게 만든다.
3. 화면 컴포넌트 분리는 상태/도메인 분리 후에 진행한다.
4. 실제 공공데이터 연동은 mock provider와 동일한 인터페이스를 먼저 만든 뒤 교체한다.
5. 매 단계마다 `npm run lint`, `npm run build`, 핵심 플로우 smoke check를 통과시킨다.

## 2. 목표 아키텍처

```text
src/
├─ api/
│  ├─ chat.ts
│  └─ transit/
│     ├─ types.ts
│     ├─ mockProvider.ts
│     ├─ gbisProvider.ts
│     ├─ seoulMetroProvider.ts
│     └─ bikeProvider.ts
├─ components/
│  ├─ map/
│  │  ├─ InteractiveMap.tsx
│  │  ├─ MapLayerControls.tsx
│  │  ├─ MapSvgOverlay.tsx
│  │  └─ StationContextMenu.tsx
│  ├─ onboarding/
│  ├─ report/
│  ├─ chat/
│  ├─ archive/
│  └─ settings/
├─ domain/
│  ├─ scenarios.ts
│  ├─ routes.ts
│  ├─ reports.ts
│  └─ markdown.ts
├─ hooks/
│  ├─ useTransitPlanner.ts
│  ├─ useAiChat.ts
│  └─ usePersistentState.ts
├─ storage/
│  ├─ preferencesStorage.ts
│  └─ reportsStorage.ts
├─ types.ts
├─ App.tsx
└─ main.tsx
```

### 2.1 최종 책임 분리

| 계층 | 책임 | 금지 |
|---|---|---|
| `api/*` | 서버/외부 API 호출, request/response mapping | React state 직접 변경 |
| `domain/*` | 경로 계산, 리포트 생성, 시나리오 정의, Markdown 안전 변환 | DOM/React 의존 |
| `hooks/*` | 상태 조립, 이벤트 핸들러 제공, domain/api 연결 | 대형 JSX 반환 |
| `components/*` | 화면 렌더링, props 기반 interaction | API fetch 직접 호출 |
| `storage/*` | localStorage serialize/deserialize, migration | UI toast 처리 |

## 3. 단계별 실행 계획

## Phase 0. 안정화 기준선 고정

**목표**: 현재 publish된 버전이 재현 가능하게 빌드되고, 어떤 파일이 추적/무시되는지 명확히 한다.

| 작업 | 상세 | 완료 기준 |
|---|---|---|
| P0-1. Git 기준선 확인 | `publish/main`의 `cf6365e`를 기준으로 작업 브랜치 생성 | `git status` clean |
| P0-2. Build baseline | `npm run lint`, `npm run build` 실행 | 둘 다 성공 |
| P0-3. Ignore 정책 고정 | `.gitignore`에 `node_modules`, `dist`, `.vite`, `local.env*`, `*:Zone.Identifier` 유지 | `git status --ignored`에서 제외 확인 |
| P0-4. Smoke checklist 수동화 초안 | 온보딩, 지도, 리포트, AI, 아카이브, 설정 체크 항목 정리 | 본 문서 §8 체크리스트 사용 |

**주의**: 이 단계에서는 UI/기능 코드를 변경하지 않는다.

## Phase 1. 타입/도메인 모델 단일화

**목표**: 모든 기능이 공유하는 타입을 `src/types.ts`로 모으고, `App.tsx` 내부 임시 타입을 제거한다.

### 1.1 변경 대상

| 파일 | 변경 |
|---|---|
| `src/types.ts` | `MapLayerState`, `VisibleLayers`, `PresetScenario`, `UrgencyLevel`, `StationNode`, `LayerId` 추가 |
| `src/App.tsx` | 내부 `type MapLayerState = ...` 제거, `PresetScenario[]` 사용 |
| `src/components/InteractiveMap.tsx` | 내부 `StationNode`, layer literal union을 공용 타입으로 전환 |

### 1.2 제안 타입

```ts
export type LayerId = "subway" | "bus" | "bike" | "crowd";

export interface VisibleLayers {
  subway: boolean;
  bus: boolean;
  bike: boolean;
  crowd: boolean;
}

export type MapLayerState =
  | "default"
  | "ai_overlay"
  | "ai_peek"
  | "ai_result"
  | "report_detail";

export type UrgencyLevel = "high" | "warn" | "medium" | "low";

export interface PresetScenario {
  id: string;
  title: string;
  summary: string;
  start: string;
  end: string;
  report: ReportType;
  tag: string;
  urgency: UrgencyLevel;
  progress: number;
  time?: string;
}
```

### 1.3 완료 기준

- `rg "type MapLayerState|StationNode|subway\" \\| \"bus"`에서 중복 정의가 사라진다.
- `npm run lint` 통과.
- 기능 동작은 기존과 동일하다.

## Phase 2. 시나리오/프리셋 데이터 분리

**목표**: UI 내부에 박힌 프리셋 데이터를 domain data로 이동한다.

### 2.1 신규 파일

| 파일 | 역할 |
|---|---|
| `src/domain/scenarios.ts` | 프리셋 시나리오, 역 목록, urgency 색상/진행률 mapping |

### 2.2 분리 대상

`App.tsx` 내부:

- `const presets = [...]`
- 역 select option 배열 반복
- urgency별 색상/width 계산

### 2.3 설계

```ts
export const STATION_NAMES = [
  "염창역",
  "여의도역",
  "사당역",
  "강남역",
  "구리역",
  "홍대입구역",
  "남양주시",
] as const;

export const PRESET_SCENARIOS: PresetScenario[] = [...];

export function getUrgencyView(level: UrgencyLevel) {
  return { className, progressClassName, label };
}
```

### 2.4 완료 기준

- `App.tsx`에서 프리셋 데이터 literal 제거.
- 프리셋 카드 UI는 `PresetScenario` props만 사용.
- 시나리오 추가 시 `domain/scenarios.ts`만 변경하면 된다.

## Phase 3. 경로 계산 엔진 분리

**목표**: `getRoutePlans()`를 “mock이지만 교체 가능한 routing engine”으로 재정의한다.

### 3.1 신규/변경 파일

| 파일 | 변경 |
|---|---|
| `src/domain/routes.ts` | `getRoutePlans`, route helpers 이동 |
| `src/data.ts` | mock seed data만 남기거나 제거 |
| `src/types.ts` | `RouteQuery`, `RouteEngineResult` 타입 추가 |

### 3.2 제안 인터페이스

```ts
export interface RouteQuery {
  start: string;
  end: string;
  preferences: Pick<UserPreferences, "useBike" | "maxTaxiFee" | "walkLimitMin" | "crowdSensitivity">;
  deadlineTime?: string;
}

export interface RouteEngine {
  getPlans(query: RouteQuery): RoutePlan[];
}
```

### 3.3 단계

1. 기존 `getRoutePlans(start, end, opts)`를 wrapper로 유지한다.
2. 내부 구현을 `mockRouteEngine.getPlans(query)`로 옮긴다.
3. `walkLimitMin`, `crowdSensitivity` 반영 규칙을 최소라도 추가한다.
4. fallback dynamic plan 생성 규칙을 별도 함수로 분리한다.

### 3.4 완료 기준

- `App.tsx`는 `getRoutePlans()` 세부 분기를 알지 않는다.
- fallback 경로/3개 주요 시나리오가 그대로 동작한다.
- 경로 생성 로직은 React 없이 단독 테스트 가능하다.

## Phase 4. 리포트 생성/저장 규칙 분리

**목표**: 저장 리포트 생성, 중복 판정, 상태 계산을 UI 밖으로 이동한다.

### 4.1 신규 파일

| 파일 | 역할 |
|---|---|
| `src/domain/reports.ts` | `createSavedReport`, `isDuplicateReport`, `getReportStatus`, `getReportLabel` |

### 4.2 현재 문제

`handleSaveReport()` 안에 다음이 섞여 있다.

- 중복 검사
- 리포트 라벨 매핑
- status 계산
- summary 문자열 생성
- state 갱신
- toast 처리

### 4.3 분리 후 구조

```ts
const result = createSavedReport({
  existingReports: savedReports,
  selectedPlan,
  reportType: selectedReportType,
  startStation,
  endStation,
});

if (result.type === "duplicate") showToast(...);
else setSavedReports((prev) => [result.report, ...prev]);
```

### 4.4 완료 기준

- report domain 함수는 pure function.
- 리포트 저장 UI와 AI 결과 저장 UI가 같은 domain 함수를 사용.
- 중복 판정 규칙이 문서화된다.

## Phase 5. AI 챗 API 및 상태 hook 분리

**목표**: `/api/chat` 호출과 fallback, AI 응답이 지도 상태에 미치는 영향을 명시적으로 분리한다.

### 5.1 신규 파일

| 파일 | 역할 |
|---|---|
| `src/api/chat.ts` | `sendChatMessage(request)` |
| `src/domain/chatFallback.ts` | 클라이언트 fallback 응답 생성 |
| `src/hooks/useAiChat.ts` | chatMessages/chatInput/loading 관리 |
| `src/domain/aiRecommendation.ts` | AI 응답을 planner action으로 변환 |

### 5.2 데이터 흐름

```text
AiChatLayer
  -> useAiChat.send(text, context)
  -> api/chat.sendChatMessage()
  -> success/fallback normalized response
  -> onRecommendation(recommendation)
  -> useTransitPlanner.applyAiRecommendation()
```

### 5.3 보안 개선

현재 `renderMarkdown()`는 HTML 문자열과 `dangerouslySetInnerHTML`을 사용한다. 개선안:

1. Markdown subset parser를 직접 React node로 변환한다.
2. HTML tag insertion을 금지한다.
3. `**bold**`, backtick code, list 정도만 허용한다.

### 5.4 완료 기준

- `App.tsx`에서 `fetch("/api/chat")` 제거.
- AI fallback은 서버 fallback과 클라이언트 fallback을 구분해서 문서화.
- AI 메시지 렌더링에서 `dangerouslySetInnerHTML` 제거 또는 sanitizer 적용.

## Phase 6. Planner 상태 hook 분리

**목표**: 지도/경로/리포트 핵심 상태를 `useTransitPlanner`로 이동한다.

### 6.1 Hook 책임

```ts
const planner = useTransitPlanner({
  initialPreferences,
  initialReports,
});
```

반환:

- state: `startStation`, `endStation`, `deadlineTime`, `selectedReportType`, `plans`, `selectedPlan`, `preferences`, `savedReports`
- actions: `selectStation`, `selectPlan`, `triggerPreset`, `saveReport`, `syncRoutine`, `applyAiRecommendation`

### 6.2 App 역할 변화

변경 전:

- 모든 상태와 JSX를 직접 소유

변경 후:

- top-level shell
- `planner`와 `aiChat` hook 조립
- 화면 컴포넌트에 props 전달

### 6.3 완료 기준

- `App.tsx`의 `useState` 수가 절반 이하로 감소.
- planner 관련 handler가 hook으로 이동.
- 기존 UI 동작 유지.

## Phase 7. 화면 컴포넌트 분리

**목표**: 큰 JSX 블록을 feature component로 분리한다.

### 7.1 분리 순서

| 순서 | 컴포넌트 | 이유 |
|---:|---|---|
| 1 | `OnboardingOverlay` | 상태 경계가 단순하고 독립적 |
| 2 | `BottomNavigation` | props가 작고 회귀 위험 낮음 |
| 3 | `ArchiveView` | `savedReports`, `selectedCalendarDay` 중심으로 독립 가능 |
| 4 | `SettingsView` | `preferences` update props로 분리 가능 |
| 5 | `ReportSheet` | 경로/리포트 의존이 많아 planner hook 이후 분리 |
| 6 | `AiChatLayer` | chat hook 분리 이후 분리 |
| 7 | `InteractiveMap` 하위 분리 | 지도 안정화 이후 MapLayerControls/SvgOverlay/Menu 분리 |

### 7.2 컴포넌트 props 원칙

- props는 domain type을 사용한다.
- state setter를 직접 넘기기보다 action 함수를 넘긴다.
- UI 컴포넌트 내부에서 API 호출 금지.
- toast는 상위에서 전달한 `onToast(message)`만 사용.

### 7.3 완료 기준

- `App.tsx` 500줄 이하.
- 각 컴포넌트가 250줄 이하를 목표로 한다.
- import cycle 없음.

## Phase 8. 영속성 도입

**목표**: 새로고침 후에도 선호값과 저장 리포트가 유지되게 한다.

### 8.1 저장 대상

| Key | 데이터 | 저장소 |
|---|---|---|
| `talsu.preferences.v1` | `UserPreferences` | localStorage |
| `talsu.savedReports.v1` | `SavedReport[]` | localStorage |
| `talsu.onboarding.v1` | 온보딩 완료 여부, 사용자 이름 | localStorage |

### 8.2 신규 파일

| 파일 | 역할 |
|---|---|
| `src/storage/preferencesStorage.ts` | preference load/save/default merge |
| `src/storage/reportsStorage.ts` | reports load/save/migration |
| `src/hooks/usePersistentState.ts` | generic localStorage hook |

### 8.3 migration 정책

- parse 실패 시 default로 복구한다.
- unknown field는 무시하되 저장 시 최신 schema로 normalize한다.
- schema version을 key에 포함한다.

### 8.4 완료 기준

- preferences 수정 후 새로고침해도 값 유지.
- savedReports 저장 후 새로고침해도 목록 유지.
- localStorage가 깨져 있어도 앱이 white screen이 되지 않는다.

## Phase 9. 공공데이터 adapter 설계

**목표**: 현재 mock을 유지하면서 실제 데이터 provider를 끼울 수 있는 인터페이스를 만든다.

### 9.1 Provider 구분

| Provider | 데이터 | 현재 대체값 |
|---|---|---|
| `MockTransitProvider` | 모든 데이터 | `src/data.ts` |
| `GBISProvider` | 버스 위치/잔여석/만차 위험 | 미구현 |
| `SeoulMetroProvider` | 지하철 혼잡/역 정보 | 미구현 |
| `BikeProvider` | 따릉이 대여소/잔여 대수 | 미구현 |

### 9.2 공통 인터페이스

```ts
export interface TransitProvider {
  getStationContext(stationName: string): Promise<StationContext>;
  getBusBoardingStatus(routeId: string, stopId: string): Promise<BoardingStatus>;
  getMetroCrowding(lineId: string, stationId: string): Promise<CrowdingStatus>;
  getBikeAvailability(bounds: MapBounds): Promise<BikeStationStatus[]>;
}
```

### 9.3 API key 정책

- 프론트에 공공 API 키를 직접 노출하지 않는 방향을 기본으로 한다.
- Express 서버에 `/api/transit/*` proxy endpoint를 만든다.
- dev mock mode와 live mode를 env로 전환한다.

### 9.4 완료 기준

- mock provider와 live provider가 같은 response type을 반환한다.
- UI는 provider 종류를 알지 않는다.
- API 장애 시 stale/mock fallback 가능.

## Phase 10. QA 자동화 및 배포 준비

**목표**: “빌드 성공”을 넘어 핵심 UX가 깨지지 않았음을 검증한다.

### 10.1 npm script 제안

```json
{
  "scripts": {
    "typecheck": "tsc --noEmit",
    "lint": "tsc --noEmit",
    "build": "vite build && esbuild server.ts --bundle --platform=node --format=cjs --packages=external --sourcemap --outfile=dist/server.cjs",
    "check": "npm run lint && npm run build"
  }
}
```

### 10.2 Smoke 시나리오

| ID | 시나리오 | 기대 결과 |
|---|---|---|
| SM-01 | 앱 진입 | 온보딩 Step 1 표시 |
| SM-02 | 비회원 진입 | 지도 메인 표시 |
| SM-03 | 프리셋 클릭 | 리포트 상세 진입, 출발/도착 변경 |
| SM-04 | 리포트 탭 전환 | 4개 리포트가 각각 렌더링 |
| SM-05 | 경로 후보 선택 | 지도 경로/타임라인 변경 |
| SM-06 | AI 질문 전송 | AI 결과 레이어 표시 |
| SM-07 | 리포트 저장 | 아카이브 목록/캘린더 반영 |
| SM-08 | 설정 변경 | preferences 반영, 경로 재계산 |

### 10.3 브라우저 검증

가능하면 Playwright 또는 agent-browser를 도입한다. 최소 검증:

- body text length > 0
- Vite error overlay 없음
- 주요 버튼 존재
- 온보딩 완료 후 `tab-map`, `tab-archive`, `tab-settings` 존재
- console error 없음

### 10.4 완료 기준

- `npm run check` 통과.
- smoke 시나리오 통과.
- dist는 커밋하지 않는다.

## 4. 실제 작업 브랜치/커밋 전략

| 단계 | 브랜치 예시 | 커밋 메시지 |
|---|---|---|
| Phase 1~2 | `refactor/types-scenarios` | `refactor: centralize planner types and scenarios` |
| Phase 3~4 | `refactor/domain-engines` | `refactor: extract route and report domain logic` |
| Phase 5~6 | `refactor/chat-planner-hooks` | `refactor: extract chat and planner hooks` |
| Phase 7 | `refactor/ui-components` | `refactor: split app views into feature components` |
| Phase 8 | `feat/local-persistence` | `feat: persist preferences and saved reports locally` |
| Phase 9 | `feat/transit-provider-adapter` | `feat: add transit provider adapter layer` |
| Phase 10 | `test/smoke-checks` | `test: add frontend smoke checks` |

## 5. 리스크와 대응

| 리스크 | 발생 시점 | 대응 |
|---|---|---|
| 지도 화면 깨짐 | 지도 컴포넌트 분리/최적화 | SVG overlay는 snapshot/smoke 확인 후 변경. 한 번에 memoization하지 않는다. |
| 타입 정리 중 기능 회귀 | Phase 1 | 타입 변경과 로직 변경을 같은 커밋에 섞지 않는다. |
| AI 응답 파싱 실패 | Phase 5 | API response normalizer를 두고 unknown field fallback 처리. |
| localStorage schema 오류 | Phase 8 | versioned key와 safe parse 사용. |
| 실제 API 장애 | Phase 9 | provider fallback과 timeout 설정. |
| 문서와 코드 불일치 | 전 단계 | 기능 ID 기준으로 PR/커밋마다 FSD 업데이트. |

## 6. Definition of Done

각 phase는 다음을 만족해야 완료로 본다.

- `npm run lint` 성공.
- `npm run build` 성공.
- 변경된 기능의 FSD/계획 문서 갱신.
- smoke checklist 중 영향받는 항목 확인.
- `.gitignore` 제외 대상이 스테이징되지 않음.
- UI 변경은 최소 한 번 실제 브라우저 또는 수동 실행으로 확인.

## 7. 즉시 다음 작업 제안

가장 먼저 할 작업은 **Phase 1 + Phase 2**를 한 번에 너무 크게 하지 않고, 다음 두 커밋으로 나누는 것이다.

### Commit 1

```text
refactor: centralize shared planner types
```

범위:

- `LayerId`, `VisibleLayers`, `MapLayerState`, `PresetScenario`, `StationNode` 추가
- `App.tsx` 내부 타입 제거
- `InteractiveMap.tsx` 타입 import

### Commit 2

```text
refactor: extract preset scenarios
```

범위:

- `src/domain/scenarios.ts` 생성
- `PRESET_SCENARIOS`, `STATION_NAMES`, `getUrgencyView()` 이동
- `App.tsx` 프리셋 literal 제거

이 두 커밋 이후에야 route/report/chat hook 분리로 들어간다.
