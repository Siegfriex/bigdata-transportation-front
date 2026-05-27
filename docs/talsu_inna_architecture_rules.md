# 탈수있나 Frontend Architecture Rules v1.0

> 목적: `data_insight` 프론트엔드의 UI, 상태, 도메인, 스타일, 설정값, schema, mock, caching 위치를 FSD 기준으로 고정한다.  
> 작성일: 2026-05-27  
> 레퍼런스: `/home/sieg/projects-wsl/MiriArt/src` 현 코드 176개 파일 전수 조사  
> 관련 문서: `docs/talsu_inna_fsd_current.md`, `docs/talsu_inna_refactor_plan.md`

## 1. 결정 요약

이 프로젝트는 FSD의 `app / pages / widgets / features / entities / shared` 레이어를 사용한다. 단, MiriArt의 실무 패턴을 참고하되 `pages/*/ui/Page.tsx` 관성은 따르지 않는다. data_insight에서 page는 UI 소유자가 아니라 라우트 composition boundary다.

| 결정 | 내용 |
|---|---|
| page는 조합만 한다 | `pages/*/index.tsx` 수준에서 route param, redirect, widget/feature 배치만 수행한다. |
| widget은 큰 화면 블록이다 | 지도 패널, 리포트 시트, AI 챗 패널, 아카이브 캘린더, 설정 폼을 담당한다. |
| feature는 사용자 행동이다 | `select-station`, `save-report`, `send-ai-chat`처럼 사용자 액션 기준으로 만든다. |
| entity는 도메인 명사다 | `station`, `route-plan`, `report`, `user-preferences`, `chat-message`가 타입/schema/mock/model을 소유한다. |
| shared는 비즈니스 독립 기반이다 | primitive UI, token, API client, config, lib, global UI store만 둔다. |

## 1-1. 현재 적용 상태

| 영역 | 현재 상태 | 다음 규칙 |
|---|---|---|
| `app` | `AppShell`, `AppRouter`, `useAppController` public boundary 생성. `src/App.tsx`는 shell/router/overlay/chrome host만 담당한다. | 다음 phase에서 provider 분리와 URL router 도입 여부를 결정한다. |
| `pages` | `map-page`, `archive-page`, `settings-page`의 `index.tsx`만 생성됐다. | 계속 `pages/*/ui` 없이 widget composition entry로 유지한다. |
| `widgets/transit-map-panel` | `InteractiveMap` 실제 구현이 이동했고 `components/InteractiveMap.tsx`는 호환 re-export다. | 신규 import는 반드시 `widgets/transit-map-panel` public API를 사용한다. |
| `widgets/map-workspace` | map 탭의 프리셋, AI 검색 진입, 리포트 상세 composition이 분리됐다. | page/router 생성 전까지 임시 map tab composition boundary로 사용한다. |
| `widgets/report-sheet` | 조건 카드, 리포트 탭, 4개 리포트 view, `ReportActionBar`, `ReportDetailPanel`이 분리됐다. | report 문구/수치 mock은 entity/report fixture로 이동한다. |
| `widgets/ai-chat-panel` | `AiChatLayer`가 분리됐고 추천 질문/welcome message/chat state hook은 feature model로 이동했다. 현재 구현에서 AI 챗은 하단 독립 탭이 아니라 지도 컨텍스트 overlay다. | session/history persistence가 필요해질 때 feature/entity store를 추가한다. |
| `widgets/archive-calendar` | 저장 리포트 달력/목록/복원 UI가 분리됐고 report localStorage store는 entity/model로 이동했다. | 월/통계 mock config를 entity/report fixture로 이동한다. |
| `widgets/settings-form` | preferences form, 루틴 동기화 UI, 데이터 출처 안내가 분리됐고 preference store는 entity/model로 이동했다. | settings content config를 분리한다. |
| `features` | onboarding, route preset carousel, route planner hook, save-report, send-ai-chat controller, toggle-map-layer가 생성됐다. | 남은 feature 상태는 select-station/onboarding model로 단계적으로 이동한다. |
| `entities` | station/route-plan/report/user-preferences/chat-message 타입과 mock/default/store가 이동됐다. | 추가 schema가 필요해지면 entity/model에 둔다. |
| `shared` | config, `cn`, markdown safe renderer, `usePersistentState`, toast/page-container UI, http client가 생성됐다. | token/style primitive를 추가한다. |

## 2. MiriArt 레퍼런스에서 가져올 것

| MiriArt 패턴 | data_insight 적용 |
|---|---|
| `app/App.tsx`가 `BrowserRouter`, provider, nav, toast를 조립 | `src/App.tsx`는 host 역할만 유지하고 state orchestration은 `src/app/model/useAppController.ts`가 담당한다. |
| `app/routers/AppRouter.tsx`가 route를 소유 | `src/app/router/AppRouter.tsx`에서 page entry를 연결한다. 현재는 URL router가 아닌 `activeTab` 기반 내부 router다. |
| `MainLayout.tsx`가 hydration/auth gate를 소유 | `AppShell` 또는 route layout이 온보딩/향후 auth gate를 담당한다. |
| React Query hook과 query key factory | `/api/chat`과 향후 교통 API는 feature/entity hook으로 감싼다. |
| zustand store 분리 | toast, modal/bottom-sheet, preferences, savedReports 등 역할별 store를 둔다. |
| API client + schema parse | `shared/api/http-client.ts`와 slice별 schema로 응답 경계를 만든다. |
| token + primitive UI | 색상, spacing, z-index, layout, Button/Tab/Sheet를 중앙화한다. |

## 3. MiriArt에서 버릴 것

| 버릴 패턴 | 이유 | data_insight 규칙 |
|---|---|---|
| `pages/*/ui/Page.tsx` | page가 UI 소유자로 오해될 수 있다. | page는 `index.tsx` 또는 route/meta 파일만 허용한다. |
| page 직접 query | page가 data policy를 알게 된다. | page는 feature/widget entry만 배치한다. |
| 거대 단일 API client | 도메인이 늘면 병목이 된다. | 공통 client와 slice endpoint를 분리한다. |
| slice root와 `ui` 중복 파일 | public API 경계가 흐려진다. | `index.ts` public export를 명시한다. |
| API 파일 내부 storage string | 설정값 위치가 분산된다. | storage/query/route/z-index는 config로 중앙화한다. |

## 4. 목표 디렉터리

```text
src/
├─ app/
│  ├─ App.tsx
│  ├─ router/AppRouter.tsx
│  ├─ providers/
│  ├─ layouts/
│  └─ styles/
├─ pages/
│  ├─ map-page/index.tsx
│  ├─ archive-page/index.tsx
│  └─ settings-page/index.tsx
├─ widgets/
│  ├─ transit-map-panel/
│  ├─ map-workspace/
│  ├─ report-sheet/
│  ├─ ai-chat-panel/
│  ├─ archive-calendar/
│  ├─ settings-form/
│  ├─ top-app-bar/
│  └─ bottom-navigation/
├─ features/
│  ├─ complete-onboarding/
│  ├─ select-station/
│  ├─ toggle-map-layer/
│  ├─ generate-route-plan/
│  ├─ save-report/
│  ├─ send-ai-chat/
│  └─ sync-preferences/
├─ entities/
│  ├─ station/
│  ├─ route-plan/
│  ├─ report/
│  ├─ user-preferences/
│  └─ chat-message/
└─ shared/
   ├─ api/
   ├─ config/
   ├─ lib/
   ├─ model/
   ├─ schemas/
   ├─ styles/
   ├─ types/
   └─ ui/
```

## 5. Page Composition Contract

페이지는 “화면을 만드는 곳”이 아니라 “라우트가 어떤 조합을 보여줄지 선언하는 곳”이다.

| 항목 | 규칙 |
|---|---|
| 허용 파일 | `pages/<page-name>/index.tsx`, 필요한 경우 `route.ts`, `meta.ts` |
| 금지 파일 | `pages/<page-name>/ui/*`, `model/*`, `api/*`, `lib/*`, `config/*`, `mock/*`, `styles.*` |
| 허용 코드 | route/search param 읽기, redirect, page meta, widget/feature 배치 |
| 금지 코드 | 상태 생성, query/mutation 직접 호출, endpoint 문자열, storage key, query key, schema literal, mock 배열, style object, 긴 Tailwind class |

권장 예시는 다음 수준이다.

```tsx
import { TransitMapPanel } from '@/widgets/transit-map-panel';
import { ReportSheet } from '@/widgets/report-sheet';
import { AiChatPanel } from '@/widgets/ai-chat-panel';
import { PageContainer } from '@/shared/ui/page-container';

export default function MapPage() {
  return (
    <PageContainer>
      <TransitMapPanel />
      <ReportSheet />
      <AiChatPanel />
    </PageContainer>
  );
}
```

## 6. 레이어 책임과 금지사항

| 레이어 | 허용 | 금지 |
|---|---|---|
| `app` | provider, router, layout gate, global css import, dev-only guard | 지도 SVG, 리포트 카드, mock 배열, API response parsing |
| `pages` | route param, redirect, widget/feature 배치, page meta | `ui/`, `model/`, `api/`, `mock/`, style class 조합, business rule |
| `widgets` | 큰 화면 블록 조립, 여러 feature/entity UI 합성 | endpoint 직접 호출, 전역 mock 생성, shared config 우회 |
| `features` | 사용자 액션, mutation/query hook, 액션 UI, optimistic update | 다른 feature 내부 import, page 전용 layout 강제 |
| `entities` | 도메인 타입, schema, normalize, mock fixture, query option | React page layout, app store 직접 조작 |
| `shared` | primitive UI, token, config, api client, 범용 util/store | `RoutePlan`, `ReportType` 같은 제품 도메인 의미 |

## 7. 하드코딩 금지표

| 금지 대상 | 금지 위치 | 허용 위치 |
|---|---|---|
| 색상 hex, spacing px, max-width, radius, shadow | page, widget JSX inline | `shared/styles/tokens.css`, `shared/config/tokens.ts`, shared UI variant |
| z-index 숫자 | 모든 컴포넌트 inline style/class | `shared/config/z-index.ts`, `shared/styles/z-index.css` |
| storage key 문자열 | page, widget, feature UI | `shared/config/storage-keys.ts` |
| query key 배열 literal | component, page | `shared/config/query-keys.ts` 또는 `entities/*/api/*Queries.ts` |
| API endpoint 문자열 | page, widget UI | `shared/config/api-routes.ts`, `features/*/api`, `entities/*/api` |
| zod schema literal | component, page, widget | `shared/schemas`, `entities/*/model/schema.ts`, `features/*/api/schema.ts` |
| mock 배열 | page, widget | `entities/*/mock`, `shared/mocks`, `features/*/fixtures` |
| 긴 variant class 분기 | page, widget | shared UI primitive variant, widget style module, tokenized component |

## 8. 전역 기반

| 기반 | 위치 | 포함 |
|---|---|---|
| design token | `shared/styles/tokens.css`, `shared/config/tokens.ts` | color, spacing, radius, shadow, typography, motion, layout width |
| z-index | `shared/config/z-index.ts`, `shared/styles/z-index.css` | base, dropdown, sticky, overlay, bottomSheet, modal, toast |
| layout primitive | `app/layouts`, `shared/ui/layout` | `AppShell`, `BottomTabLayout`, `PageContainer`, `PanelSection`, `ScrollableArea` |
| overlay primitive | `shared/ui` | `BottomSheet`, `Modal`, `Toast`, `Tooltip` |
| form primitive | `shared/ui` | `Button`, `IconButton`, `Input`, `Select`, `Tabs`, `Badge`, `Switch`, `Slider` |

## 8-1. Widget 분리 규칙

| Widget | 허용 책임 | 금지 책임 |
|---|---|---|
| `transit-map-panel` | SVG 지도, 지도 조작, 역 노드 UI, 레이어 시각화 | route 계산, saved report 생성, AI fetch |
| `map-workspace` | map 탭의 preset/search/report-detail widget composition | 전역 app state 소유, API 호출, mock 생성, page 전용 라우팅 |
| `report-sheet` | route/report/entity를 받아 리포트 시트 UI 조합 | storage 직접 접근, `/api/chat` 직접 fetch, station mock 배열 직접 선언 |
| `ai-chat-panel` | 채팅 목록, 입력, 추천 질문, loading/empty UI | 서버 schema 정의, Gemini fallback 생성 |
| `archive-calendar` | saved report 목록/달력/복원 액션 UI | saved report factory, localStorage key 직접 사용 |
| `settings-form` | preferences 입력 UI, 루틴 동기화 버튼 | route planner 직접 구현, storage key 직접 사용 |
| `top-app-bar`, `bottom-navigation` | 전역 app chrome UI | 도메인 상태 변경 로직 직접 소유 |

## 9. 상태관리 기준

| 상태 종류 | 위치 | 원칙 |
|---|---|---|
| 서버 상태 | `features/*/model`, `entities/*/api` | React Query 도입 시 query option/key factory를 사용한다. page에서 `useQuery` 직접 호출 금지. |
| 영속 클라이언트 상태 | `entities/user-preferences/model`, `entities/report/model` | preferences, savedReports, onboarding 완료 여부는 localStorage store와 hydration gate를 둔다. |
| 전역 UI 상태 | `shared/model` | toast, modal/bottom-sheet open state, navigation visibility만 둔다. |
| feature 임시 상태 | `features/*/model` | chat input, selected station action, optimistic saving처럼 특정 행동에 종속된 상태만 둔다. |
| 컴포넌트 local state | widget/feature UI 내부 | hover, expanded, focused, uncontrolled input draft처럼 렌더링 국소 상태만 허용한다. |

## 10. API와 캐싱 계약

| 항목 | 지시 |
|---|---|
| API client | `shared/api/http-client.ts`에서 timeout, error shape, JSON/text parse를 통일한다. base URL이 필요해지면 이 계층에서만 추가한다. |
| endpoint module | `/api/chat`은 `features/send-ai-chat/api`가 소유한다. 교통/경로 데이터는 `entities/route-plan/api` 또는 `entities/station/api`가 소유한다. |
| response schema | 서버 응답은 zod schema 또는 동등한 runtime parser를 통과한 뒤 UI로 들어온다. |
| fallback | Gemini key 부재, 서버 실패, schema mismatch fallback은 feature model에 둔다. page/widget에서 분기하지 않는다. |
| cache key | `queryKeys.routePlans(params)`, `queryKeys.aiChat(sessionId)`, `queryKeys.stationContext(stationId)`처럼 factory로만 만든다. |
| markdown | AI 응답 markdown은 `shared/lib/markdown/renderSafeMarkdown.tsx`처럼 React node로 렌더링한다. `dangerouslySetInnerHTML`는 사용하지 않는다. |
| stale policy | 실시간 교통성 데이터는 짧은 stale time, 저장 리포트/설정은 long stale 또는 local persistence를 쓴다. |
| server reuse | 로컬 Express와 Vercel Function은 `features/send-ai-chat/server/chatResponder.ts` 같은 단일 responder를 공유한다. |

## 11. Public API 규칙

| 규칙 | 설명 |
|---|---|
| slice 외부 import | `slice/index.ts` 또는 명시 public export만 사용한다. |
| shared import | 어떤 상위 레이어도 import하지 않는다. |
| entity import | `features/widgets/pages/app`을 import하지 않는다. |
| feature import | 다른 feature 내부 segment를 직접 import하지 않는다. |
| widget import | feature/entity/shared public API만 사용한다. |
| page import | widget/feature public API와 app/shared layout만 사용한다. |

## 12. 최종 구현 규칙

| 규칙 | 설명 |
|---|---|
| 페이지 UI 소유 금지 | `pages/*/ui`, `pages/*/model`, `pages/*/api`, `pages/*/mock`, `pages/*/styles`를 만들지 않는다. |
| 페이지 하드코딩 금지 | page 안에 색상 hex, spacing px, z-index 숫자, endpoint, storage key, query key, mock 배열, schema literal을 두지 않는다. |
| feature는 사용자 행동 기준 | `button`, `card` 같은 UI 종류가 아니라 `save-report`, `send-ai-chat` 같은 행동으로 feature를 만든다. |
| entity는 도메인 명사 기준 | `station`, `route-plan`, `report`, `user-preferences`, `chat-message`처럼 비즈니스 객체 기준으로 만든다. |
| shared는 비즈니스 의미 금지 | `Button`, `Tabs`, `httpClient`, `cn`, `date`, `zIndex`는 가능하지만 `RoutePlanCard`는 shared가 아니다. |
| mock 위치 고정 | 전역 mock은 `entities/*/mock`, feature 테스트용 fixture는 `features/*/fixtures`에 둔다. page/widget mock 금지. |
| CSS token 우선 | 반복되는 class 조합은 primitive variant 또는 CSS token으로 승격한다. |
| 서버 계약 명시 | `/api/chat`처럼 서버와 맞물리는 기능은 request/response schema와 fallback 정책을 같이 둔다. |

## 13. 다음 Phase 진입 게이트

| 진입 대상 | 진입 전 조건 |
|---|---|
| `ReportDetailPanel` | 완료. `ReportActionBar`와 함께 public API로 export되고 `npm run build` 통과 |
| `ai-chat-panel` | 1차 진입 완료. 다음은 추천 질문 fixture와 chat state model 분리 |
| `archive-calendar` | savedReports는 props/store 경계로만 주입하고 widget 내부에서 storage key를 import하지 않음 |
| `settings-form` | preferences update handler는 props 또는 feature hook으로 주입하고 widget 내부에서 route 계산을 수행하지 않음 |
| `pages/*` | `App.tsx`에서 map/archive/settings 탭 body가 widget 단위로 충분히 축소된 뒤 생성 |
| `app/router` | 완료. `AppRouter`는 URL 상태를 만들지 않고 현재 `activeTab`으로 page entry만 선택한다. |
| `app/model` | 완료. `useAppController`가 host props assembly와 app-level orchestration을 소유하고 `App.tsx`는 50줄 host로 유지된다. |
