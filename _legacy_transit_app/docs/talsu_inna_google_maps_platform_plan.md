# 탈수있나 Google Maps Platform 도입 개발계획 v1.0

> 목적: 현 `data_insight` 코드베이스를 기준으로 Google Maps Platform을 안전하게 도입하기 위한 범위, 아키텍처 경계, 단계별 실행 순서, 보안/검증 기준을 정의한다.  
> 작성일: 2026-05-27  
> 기준 코드: React 19 + Vite 6 + Express, `InteractiveMap.tsx` SVG mock map, `entities/*` 일부 분리 상태  
> 관련 문서: `docs/talsu_inna_fsd_current.md`, `docs/talsu_inna_architecture_rules.md`, `docs/talsu_inna_refactor_plan.md`

## 1. 결정 요약

Google Maps Platform은 탈수있나의 핵심 판단 엔진을 대체하지 않는다. Google Maps는 지도, 장소 검색, 경로 좌표, ETA를 제공하는 기반 레이어로 사용하고, 탈수있나의 제품 가치는 탑승가능성, 혼잡 위험, 생존 칸 추천, 실패복구 플랜에서 유지한다.

| 구분 | 책임 |
|---|---|
| Google Maps Platform | base map, place search, geocoding, route geometry, distance, ETA |
| 탈수있나 엔진 | boarding probability, crowd risk, route plan ranking, survival carriage, recovery plan |
| 공공/Mock 교통 데이터 | subway/bus/bike/crowd layer, route confidence, report evidence |

## 2. 현 코드베이스 기준 진단

| 영역 | 현재 상태 | Google Maps 도입 영향 |
|---|---|---|
| 지도 렌더링 | `src/components/InteractiveMap.tsx`의 SVG mock map | Google Maps JS map container로 교체 필요 |
| 역 데이터 | `StationNode`가 `x`, `y` SVG 좌표 보유 | `lat`, `lng`, `placeId?` 추가 필요 |
| 경로 계산 | `getRoutePlans()` mock route planner | Google Routes API 결과를 보강 데이터로 결합 |
| 지도 레이어 | subway/bus/bike/crowd 토글 mock | custom marker/overlay로 유지 |
| 서버 | Express + Vite middleware, `/api/chat`만 존재 | `/api/maps/*` 서버 endpoint 추가 가능 |
| FSD 구조 | `entities`, `features`, `shared` 일부 생성됨 | 지도 API 경계를 entity/feature/server로 분리해야 함 |

## 3. 사용 API 범위

| API | 용도 | 호출 위치 | 키 |
|---|---|---|---|
| Maps JavaScript API | 지도 표시, marker/polyline/overlay 렌더링 | Browser | `VITE_GOOGLE_MAPS_API_KEY` |
| Places API | 출발지/도착지 검색, 자동완성 | Browser 우선, 필요 시 Server | browser key 또는 server key |
| Routes API | 거리, ETA, route polyline, 구간별 경로 계산 | Server | `GOOGLE_MAPS_SERVER_API_KEY` |
| Geocoding API | 주소/장소명 좌표 변환 fallback | Server | `GOOGLE_MAPS_SERVER_API_KEY` |

## 4. 보안 원칙

| 항목 | 규칙 |
|---|---|
| 브라우저 키 | 지도 렌더링 전용. HTTP referrer 제한과 API 제한을 반드시 적용한다. |
| 서버 키 | `.env`에만 보관하고 브라우저 번들에 노출하지 않는다. |
| API 제한 | browser key는 Maps JavaScript API, Places API 중심. server key는 Routes API, Geocoding API 중심. |
| 과금 방어 | GCP 예산 알림, 일일 quota, API별 제한을 설정한다. |
| 저장소 | 실제 key는 git에 커밋하지 않는다. `.env.example`에는 변수명만 둔다. |

## 5. 환경변수 계획

```env
VITE_GOOGLE_MAPS_API_KEY=
GOOGLE_MAPS_SERVER_API_KEY=
```

`VITE_` prefix가 붙은 값은 브라우저 번들에 노출될 수 있으므로 지도 표시 외 목적에 사용하지 않는다.

## 6. 데이터 모델 변경

### 6.1 StationNode

현재:

```ts
export interface StationNode {
  name: string;
  x: number;
  y: number;
  type: "metro" | "bus" | "bike" | "district";
  id: string;
  bikesAvailable?: number;
  busesAvailable?: number;
  crowdLevel: "empty" | "normal" | "crowded" | "danger";
}
```

목표:

```ts
export interface StationNode {
  id: string;
  name: string;
  type: "metro" | "bus" | "bike" | "district";
  lat: number;
  lng: number;
  placeId?: string;
  x?: number;
  y?: number;
  bikesAvailable?: number;
  busesAvailable?: number;
  crowdLevel: "empty" | "normal" | "crowded" | "danger";
}
```

`x`, `y`는 Google Maps 전환 중 호환 필드로만 유지하고, 신규 지도 로직은 `lat`, `lng`를 기준으로 한다.

### 6.2 RoutePlan

기존 `RoutePlan`은 유지하되, Google route 결과를 담는 선택 필드를 추가한다.

```ts
export interface RoutePlan {
  id: string;
  name: string;
  modes: TransitMode[];
  eta: string;
  extraCost: number;
  risk: "low" | "medium" | "high";
  crowd: "empty" | "normal" | "crowded" | "very_crowded";
  description: string;
  timeline: TimelineStep[];
  confidence: "realtime" | "estimated" | "pattern";
  geometry?: RouteGeometry;
}

export interface RouteGeometry {
  encodedPolyline?: string;
  bounds?: {
    northeast: { lat: number; lng: number };
    southwest: { lat: number; lng: number };
  };
}
```

## 7. 파일별 적용 계획

| 파일/영역 | 작업 |
|---|---|
| `src/entities/station/model/types.ts` | `lat`, `lng`, `placeId?` 추가 |
| `src/entities/station/mock/stations.ts` | 서울 주요 mock station 좌표 입력 |
| `src/entities/route-plan/model/types.ts` | route geometry 타입 추가 |
| `src/components/InteractiveMap.tsx` | SVG map을 Google Map container + overlay로 점진 교체 |
| `src/features/generate-route-plan/model` | Google route 결과와 기존 mock planner 결합 위치로 확장 |
| `server.ts` | `/api/maps/route`, `/api/maps/geocode` 추가 후보 |
| `.env.example` | Google Maps 관련 환경변수명 추가 |
| `docs/talsu_inna_fsd_current.md` | 실제 지도 SDK 도입 후 F1/F2/F3 상태 갱신 |

## 8. 단계별 개발계획

### Phase A. 기준선 고정

| 작업 | 완료 기준 |
|---|---|
| 현재 build/lint 실행 | `npm run build`, `npm run lint` 결과 기록 |
| F0~F8 smoke 체크 | 온보딩, 역 변경, 레이어 토글, 경로 후보, 리포트, AI fallback 확인 |
| API 키 정책 확정 | browser/server key 분리와 제한 방식 문서화 |
| rollback 기준 확정 | Google Map 로딩 실패 시 mock/SVG fallback 여부 결정 |

### Phase B. 지도 도메인 모델 전환

| 작업 | 완료 기준 |
|---|---|
| `StationNode` 좌표 모델 확장 | 기존 UI compile 유지 |
| station mock에 실제 좌표 추가 | 기존 `x`, `y` 기반 지도도 동작 |
| route geometry 타입 추가 | `RoutePlan` 기존 사용처 회귀 없음 |
| 좌표 helper 추가 | marker/polyline 계산이 컴포넌트 내부에 과밀하지 않음 |

### Phase C. Google Maps 기반 지도 MVP

| 작업 | 완료 기준 |
|---|---|
| Maps JavaScript API 로더 추가 | 키가 있으면 Google Map 표시 |
| Google Map container 적용 | 기존 화면 레이아웃과 하단 sheet가 유지 |
| station marker 표시 | 출발/도착/hover/선택 상태가 지도 위에 표현 |
| custom overlay 유지 | subway/bus/bike/crowd 토글 UX 유지 |
| bounds fit 구현 | 선택 경로 또는 출발/도착이 화면에 맞게 보임 |

### Phase D. Places 검색 연동

| 작업 | 완료 기준 |
|---|---|
| Places autocomplete 도입 | 출발지/도착지 검색 가능 |
| 내부 endpoint normalize | place 결과가 `StationNode` 또는 `RouteEndpoint`로 변환 |
| 기존 station select 호환 | mock 시나리오와 검색 입력이 함께 동작 |
| 실패 fallback | Places 실패 시 기존 station 목록 사용 가능 |

### Phase E. Routes API 서버 연동

| 작업 | 완료 기준 |
|---|---|
| `/api/maps/route` 추가 | server key로 Routes API 호출 |
| request/response schema 정의 | UI가 외부 응답 shape에 직접 묶이지 않음 |
| walking/bike/driving 구간 계산 | timeline 보강 가능 |
| route geometry 저장 | 지도 polyline이 Google route 기반으로 표시 |
| error fallback | Routes API 실패 시 기존 mock planner 유지 |

### Phase F. 탈수있나 판단 엔진 결합

| 작업 | 완료 기준 |
|---|---|
| Google ETA와 기존 route plan 결합 | ETA/거리만 외부 계산값으로 보강 |
| risk/crowd ranking 유지 | Google result가 제품 판단을 덮어쓰지 않음 |
| report evidence 강화 | 리포트에 시간/거리/혼잡 근거가 함께 표시 |
| AI context 보강 | chat context에 route geometry/ETA 요약 포함 |

### Phase G. 운영/QA

| 작업 | 완료 기준 |
|---|---|
| GCP quota/예산 알림 설정 | 과금 리스크 제한 |
| 키 제한 점검 | browser key/server key 용도 분리 확인 |
| dev/prod env 분리 | 로컬과 배포 도메인 referrer 분리 |
| browser smoke | 지도 로딩, marker, layer, route, search 확인 |
| build smoke | `npm run build` 통과 |

## 9. FSD 경계 규칙

| 규칙 | 설명 |
|---|---|
| page는 Google API를 직접 호출하지 않는다 | page는 widget/feature 배치만 담당한다. |
| `App.tsx`에 지도 SDK 세부 구현을 넣지 않는다 | 지도 구현은 `InteractiveMap` 또는 향후 `widgets/transit-map-panel`로 격리한다. |
| API endpoint 문자열은 config/API module에 둔다 | widget JSX에 `/api/maps/route` 문자열을 직접 두지 않는다. |
| Google 응답은 schema/adapter를 통과한다 | UI가 Routes API raw response에 직접 의존하지 않는다. |
| mock 교통 데이터는 entity mock에 둔다 | 지도 widget 내부에 station/route mock 배열을 만들지 않는다. |

## 10. MVP 완료 정의

| 범주 | 완료 기준 |
|---|---|
| 지도 | Google Map이 로드되고 주요 station marker가 표시된다. |
| 선택 | 지도 marker 또는 검색으로 출발/도착이 변경된다. |
| 레이어 | subway/bus/bike/crowd 토글이 Google Map 위에서도 유지된다. |
| 경로 | 선택된 `RoutePlan`이 polyline 또는 segment overlay로 표시된다. |
| 리포트 | deadline/boarding/recovery 리포트가 기존 기능을 유지한다. |
| fallback | API key 없음 또는 Google API 실패 시 데모가 완전히 막히지 않는다. |
| 보안 | 실제 key가 저장소에 없고, GCP 제한 설정이 완료되어 있다. |

## 11. 승인 범위와 보류 범위

| 승인 범위 | 보류 범위 |
|---|---|
| Google Maps base map 도입 | 완전한 범용 지도앱 구현 |
| Places 기반 출발/도착 검색 | 사용자 계정 기반 장소 저장 |
| Routes API 기반 ETA/geometry 보강 | 실시간 전체 대중교통 운행 보장 |
| custom crowd/bike/bus overlay 유지 | Google 기본 transit layer에 제품 판단 의존 |
| 서버 proxy endpoint 추가 | 결제/택시 호출/실시간 위치 추적 |

## 12. 구현 시작 전 체크리스트

| 체크 | 상태 |
|---|---|
| GCP project 생성 | 대기 |
| billing 연결 및 budget alert 설정 | 대기 |
| Maps JavaScript API 활성화 | 대기 |
| Places API 활성화 | 대기 |
| Routes API 활성화 | 대기 |
| browser key 생성 및 referrer 제한 | 대기 |
| server key 생성 및 API 제한 | 대기 |
| `.env` 로컬 설정 | 대기 |
| `.env.example` 변수명 반영 | 대기 |
