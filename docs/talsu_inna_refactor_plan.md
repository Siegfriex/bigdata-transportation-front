# 탈수있나 FSD Refactor Execution Plan v1.0

> 목적: 현재 `data_insight` 구현을 `docs/talsu_inna_architecture_rules.md`의 FSD 규칙에 맞게 단계적으로 옮기는 실행 계획을 정의한다.  
> 작성일: 2026-05-27  
> 기준 문서: `docs/talsu_inna_fsd_current.md`, `docs/talsu_inna_architecture_rules.md`

## 1. 실행 원칙

| 원칙 | 내용 |
|---|---|
| build 우선 | 각 phase 종료마다 `npm run build`가 통과해야 다음 단계로 간다. |
| 동작 유지 | 리팩토링 중 현재 F0~F8 기능은 깨지면 안 된다. |
| page 얇게 유지 | 신규 page는 `pages/*/index.tsx`만 만들고 `ui/model/api/mock/styles` segment는 만들지 않는다. |
| 하드코딩 확산 금지 | 새 파일에는 token/config/schema/mock 위치 규칙을 적용한다. |
| 큰 이동 전 SSOT | 타입, key, token, mock 위치를 먼저 정한 뒤 UI를 이동한다. |

## 2. 우선순위

| 우선순위 | 대상 | 이유 |
|---|---|---|
| P0 | 타입 단일화, `App.tsx` 과밀 해소, AI/route/report domain 분리 | 이후 기능 추가 때 회귀 위험이 가장 크다. |
| P1 | localStorage 영속화, 지도 렌더링 안정화, 리포트 저장 규칙 테스트 | 데모 품질과 사용자 체감에 직접 영향. |
| P2 | 실제 공공데이터 adapter, 계정/DB 저장 | 외부 API 키/정책/백엔드 설계가 필요하다. |

## 3. Slice 전략 요약

| Slice | 목표 위치 | 내용 |
|---|---|---|
| S1. Types/Config SSOT | `entities/*/model`, `shared/config` | 타입 불일치 제거, key/token/z-index 중앙화 |
| S2. Shared foundation | `shared/ui`, `shared/styles`, `shared/api`, `shared/lib` | primitive UI, tokens, http client, util 구축 |
| S3. Entities | `entities/station`, `route-plan`, `report`, `user-preferences`, `chat-message` | 도메인 타입, mock, schema, pure logic 이동 |
| S4. Features | `features/*` | 사용자 액션별 hook/model/api/ui 이동 |
| S5. Widgets | `widgets/*` | 지도 패널, 리포트 시트, AI 챗, 아카이브, 설정 폼 조립 |
| S6. Pages/App | `pages/*/index.tsx`, `app/*` | 얇은 page와 app provider/router/layout 정리 |
| S7. Persistence/API | `entities/*/model/store`, `features/*/api` | localStorage, schema, fallback, query key 정리 |

## 4. Phase 0. 기준선 고정

| 작업 | 산출물 | 완료 기준 |
|---|---|---|
| 현재 build/lint 기록 | 작업 로그 | `npm run build` 성공 상태를 baseline으로 남긴다. |
| 기능 smoke 목록 확정 | F0~F8 QA 표 | 리팩토링 중 회귀 체크 기준을 고정한다. |
| import alias 정책 결정 | `tsconfig.json`, `vite.config.ts` | `@/` alias 사용 여부를 확정한다. |
| 의존성 결정 | `package.json` | React Query/zustand/zod 도입 여부를 확정한다. |

**현재 반영 상태**: `npm run lint`, `npm run build` 통과. React Query/zustand/zod는 아직 도입하지 않고, 현재 의존성 안에서 FSD public module과 localStorage hook을 먼저 적용했다.

## 5. Phase 1. 타입과 상수 SSOT

| 작업 | 이동 대상 | 완료 기준 |
|---|---|---|
| `MapLayerState` 불일치 제거 | `features/toggle-map-layer/model/types.ts` | `ai_peek` 포함 여부가 한 타입에서 결정된다. |
| `ReportType`, `SavedReport` 이동 | `entities/report/model/types.ts` | report 관련 타입이 `types.ts`에서 빠진다. |
| `RoutePlan` 이동 | `entities/route-plan/model/types.ts` | route 관련 타입이 UI와 분리된다. |
| `UserPreferences` 이동 | `entities/user-preferences/model/types.ts` | preference 타입과 default가 같은 entity로 모인다. |
| storage/query/route key 중앙화 | `shared/config/*` | 문자열 key를 page/widget에서 직접 쓰지 않는다. |
| z-index/layout token 중앙화 | `shared/config/z-index.ts`, `shared/styles/tokens.css` | `9999`, 임의 px, 반복 max-width를 제거하기 시작한다. |

**현재 반영 상태**: `entities/*/model/types.ts`, `features/toggle-map-layer/model/types.ts`, `shared/config/*` public module을 생성했고 `src/types.ts`는 호환 facade로 축소했다.

## 6. Phase 2. Shared 기반 구축

| 작업 | 대상 | 완료 기준 |
|---|---|---|
| `cn` 유틸 생성 | `shared/lib/cn.ts` | className join 반복 제거 가능 |
| primitive UI 생성 | `shared/ui/button`, `tabs`, `bottom-sheet`, `badge`, `toast` | App/page/widget에서 variant/size만 사용 |
| layout primitive 생성 | `shared/ui/layout`, `app/layouts` | `PageContainer`, `PanelSection`, `ScrollableArea`, `AppShell` 사용 가능 |
| 스타일 분리 | `shared/styles/tokens.css`, `globals.css`, `motion.css` | `index.css`가 import 허브에 가까워짐 |
| Toast store/host 추가 | `shared/model/toastStore.ts`, `shared/ui/toast` | toast 피드백이 공통화됨 |

**현재 반영 상태**: `shared/model/usePersistentState.ts`, `shared/config/storage-keys.ts`, `shared/config/query-keys.ts`, `shared/config/z-index.ts`, `shared/config/routes.ts`를 생성했다. Toast store와 UI primitive 추출은 다음 작업으로 남아 있다.

## 7. Phase 3. Entity 추출

| Entity | 포함할 것 | 현재 출처 | 완료 기준 |
|---|---|---|---|
| `station` | station id/name/position/line/crowd, fixtures, helper | `InteractiveMap.tsx`, `data.ts` | 지도 데이터가 widget 밖 entity로 이동 |
| `route-plan` | `RoutePlan`, timeline, route generator input/output, mock scenarios | `types.ts`, `data.ts`, `App.tsx` | route generator가 UI와 무관한 순수 함수 |
| `report` | `ReportType`, saved report, summary/status factory | `types.ts`, `App.tsx`, `data.ts` | 저장/중복 규칙이 UI 밖으로 이동 |
| `user-preferences` | preference type, default, persistence schema | `types.ts`, `data.ts`, `App.tsx` | 설정 기본값이 entity에서 관리 |
| `chat-message` | message type, AI response schema, markdown contract | `types.ts`, `App.tsx`, `server.ts` | AI 응답 경계가 명시됨 |

**현재 반영 상태**: route-plan/report/user-preferences/chat-message/station entity 타입과 mock/default를 분리했고 `src/data.ts`는 호환 facade로 축소했다.

## 8. Phase 4. Feature 추출

| Feature | 책임 | 완료 기준 |
|---|---|---|
| `complete-onboarding` | 온보딩 step, preference 초기값 반영, 체험 시작 | 온보딩 완료 로직이 page/App에서 사라짐 |
| `select-station` | 출발/도착 선택, 지도 노드 context action | station 변경 이벤트가 독립 hook/action으로 이동 |
| `toggle-map-layer` | subway/bus/bike/crowd 토글, reset | 지도 레이어 상태가 widget 내부 하드코딩에서 빠짐 |
| `generate-route-plan` | route 계산/선택/프리셋 적용 | `getRoutePlans` 호출과 selectedPlan 유지 규칙이 hook으로 이동 |
| `save-report` | saved report 생성, 중복 판정, 삭제 | archive와 report sheet가 같은 저장 규칙 사용 |
| `send-ai-chat` | `/api/chat` 호출, fallback, AI 추천 반영 | AI fetch와 response mapping이 `App.tsx`에서 사라짐 |
| `sync-preferences` | 설정 저장, 루틴 동기화, localStorage 복원 | 설정 page가 form 배치만 담당 |

**현재 반영 상태**: `generate-route-plan` preset, `save-report` 생성/중복 규칙, `send-ai-chat` API/fallback/markdown, `toggle-map-layer` 타입을 feature로 분리했다.

## 9. Phase 5. Widget/Page 재조립

| 단계 | 작업 | 완료 기준 |
|---|---|---|
| 5-1 | `widgets/transit-map-panel` 생성 | 지도, 검색, 레이어, selected route 표시가 하나의 widget으로 묶임 |
| 5-2 | `widgets/report-sheet` 생성 | 4종 리포트 탭과 CTA가 feature/entity를 조합 |
| 5-3 | `widgets/ai-chat-panel` 생성 | 채팅 목록/입력/추천 질문이 send-ai-chat feature만 호출 |
| 5-4 | `widgets/archive-calendar` 생성 | saved report 목록과 날짜 필터가 report entity 사용 |
| 5-5 | `widgets/settings-form` 생성 | preference entity와 sync-preferences feature만 사용 |
| 5-6 | `pages/*/index.tsx` 생성 | page는 widget/feature 배치와 route 이동만 담당. `pages/*/ui` 금지 |
| 5-7 | `app/router/AppRouter.tsx` 생성 | map/archive/settings route 연결 |
| 5-8 | `app/App.tsx` 축소 | provider/router/layout/global host만 남김 |

**현재 반영 상태**: `App.tsx`에서 프리셋, 저장 리포트 생성 규칙, AI fetch/fallback, markdown 렌더링, layer 타입/default를 분리했다. JSX 화면 분해와 router/page/widget 재조립은 다음 작업이다.

## 10. Phase 6. Persistence/API 정리

| 작업 | 대상 | 완료 기준 |
|---|---|---|
| `httpClient` 추가 | `shared/api/http-client.ts` | timeout/error/fallback 계약이 한 곳에서 처리됨 |
| AI response schema 추가 | `features/send-ai-chat/api/schema.ts` 또는 `entities/chat-message/model/schema.ts` | 응답 parse 경계 생성 |
| preferences localStorage | `entities/user-preferences/model/store.ts` | 새로고침 후 설정 유지 |
| report localStorage | `entities/report/model/store.ts` | 새로고침 후 저장 리포트 유지 |
| query key factory | `shared/config/query-keys.ts` | query key 중복 방지 |
| markdown sanitizer | `shared/lib/markdown` | AI 응답 렌더링 보안 경계 생성 |

**현재 반영 상태**: `usePersistentState`로 preferences/savedReports localStorage persistence를 적용했다. 전용 entity store와 sanitizer 강화는 후속 작업이다.

## 11. Phase 7. QA와 회귀 방지

| 체크 | 기준 |
|---|---|
| Build | 모든 phase 종료마다 `npm run build` 통과 |
| Dev | `npm run dev`로 `http://127.0.0.1:3000` 응답 확인 |
| Smoke F0 | 온보딩 완료, 비회원 진입 |
| Smoke F1~F3 | 프리셋 적용, 역 변경, 레이어 토글, 후보 선택 |
| Smoke F4~F6 | 리포트 탭, 리포트 저장, 아카이브 복원 |
| Smoke F5/F8 | AI 질문, 서버 fallback, 로컬 fallback |
| Smoke F7 | 설정 저장, 루틴 동기화 |
| 구조 검사 | `App.tsx` 150줄 이하 목표, page 파일 fetch/mock/schema/storage key 직접 선언 금지 |

## 12. 완료 정의

| 범주 | 완료 기준 |
|---|---|
| Current FSD | `docs/talsu_inna_fsd_current.md`의 기능 상태와 QA 표가 최신 코드와 일치 |
| Architecture rules | 신규 코드가 `docs/talsu_inna_architecture_rules.md`의 page/layer/hardcoding 규칙을 위반하지 않음 |
| Refactor plan | 각 phase별 산출물이 생성되고 build/smoke 기준을 통과 |
| 코드 구조 | `src/App.tsx`가 조립만 담당하고, 도메인/mock/API/schema가 slice로 이동 |
| 사용자 기능 | F0~F8 현재 기능이 리팩토링 후에도 유지 |
