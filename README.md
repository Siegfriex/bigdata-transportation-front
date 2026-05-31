<div align="center">

**Frontend**
[![React](https://img.shields.io/badge/React-19-61DAFB?logo=react)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.8-3178C6?logo=typescript)](https://www.typescriptlang.org/)
[![Vite](https://img.shields.io/badge/Vite-6-646CFF?logo=vite)](https://vite.dev/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-4-38B2AC?logo=tailwindcss)](https://tailwindcss.com/)

**Runtime**
[![Node.js](https://img.shields.io/badge/Node.js-20+-339933?logo=nodedotjs)](https://nodejs.org/)
[![Express](https://img.shields.io/badge/Express-4-000000?logo=express)](https://expressjs.com/)
[![Vercel Functions](https://img.shields.io/badge/Vercel_Functions-Node.js-000000?logo=vercel)](https://vercel.com/docs/functions)

**AI**
[![Gemini](https://img.shields.io/badge/Google_Gemini-API-4285F4?logo=google)](https://ai.google.dev/)

# 탈수있나

**실제로 탈 수 있는 안심 길** — 수도권 대중교통 혼잡도, 탑승 가능성, 마감 도착, 심야 실패 복구를 mock 기반으로 시뮬레이션하는 AI 교통 의사결정 SPA

[소개](#-소개) · [시작하기](#-시작하기) · [배포](#-배포) · [기술-스택](#-기술-스택) · [프로젝트-구조](#-프로젝트-구조) · [로드맵](#-로드맵)

</div>

---

## 소개

**탈수있나**는 “최단 경로”보다 “실제로 탈 수 있는 경로”를 우선하는 수도권 이동 판단 데모 앱입니다. 버스 잔여석, 지하철 칸별 혼잡, 택시 선탑승, 따릉이 연계, 막차 실패 복구 같은 출퇴근 의사결정 시나리오를 모바일 앱 형태로 제공합니다.

현재 구현은 실제 공공데이터 운영 서비스가 아니라 **React SPA + mock route engine + Gemini/fallback AI 응답** 기반 MVP입니다. `/api/chat`만 서버 경계를 가지며, Vercel Functions와 로컬 Express 서버가 같은 responder를 공유합니다.

### 주요 기능

| 기능 | 설명 | 현재 상태 |
|---|---|---|
| **지도 기반 경로 판단** | mock SVG 지도, 역 선택, 교통 레이어, 경로 후보 표시 | Mock 구현 |
| **탑승 가능성 리포트** | 광역버스 잔여석/무정차 가능성 판단 UI | Mock 구현 |
| **칸별 생존 가이드** | 지하철 칸별 혼잡/회피 추천 | Mock 구현 |
| **마감 도착 플랜** | 목표 시각까지 도착하기 위한 복합 수단 비교 | Mock 구현 |
| **심야 실패 복구** | 막차 이후 N버스/택시 조합 복구안 | Mock 구현 |
| **AI 챗 브리핑** | Gemini API 또는 deterministic fallback으로 지도 상태 기반 응답 | 부분 구현 |
| **리포트 보관함** | 저장 리포트, 캘린더, 지도 상태 복원 | localStorage 기반 |
| **사용자 설정** | 루틴 지점, 혼잡 민감도, 택시 예산, 도보 제한, AI 스타일 | localStorage 기반 |

---

## 시작하기

### 요구 사항

- **Node.js** 20 이상 권장
- **npm** 9 이상

### 설치 및 실행

1. **의존성 설치**
   ```bash
   npm install
   ```

2. **환경 변수 설정**

   `.env.example`을 `.env` 또는 `.env.local`로 복사합니다.
   ```bash
   cp .env.example .env
   ```

   실제 Gemini 호출을 사용하려면 값을 설정합니다.
   ```env
   GEMINI_API_KEY="your-gemini-api-key"
   GEMINI_MODEL="gemini-2.5-flash"
   APP_URL="http://localhost:3000"
   ```

   `GEMINI_API_KEY`가 없거나 `MY_GEMINI_API_KEY` 그대로이면 `/api/chat`은 외부 호출 없이 fallback 응답을 반환합니다.

3. **개발 서버 실행**
   ```bash
   npm run dev
   ```

   브라우저에서 `http://localhost:3000`에 접속합니다.

### 빌드

```bash
npm run build
```

전체 빌드는 다음 두 단계를 실행합니다.

| 명령 | 설명 |
|---|---|
| `npm run build:client` | Vite SPA를 `dist/`로 빌드 |
| `npm run build:server` | 로컬 production Express 서버를 `dist/server.cjs`로 번들 |

### 로컬 production 실행

```bash
npm run build
npm start
```

### 타입 검사

```bash
npm run lint
```

현재 `lint`는 ESLint가 아니라 `tsc --noEmit` 기반 TypeScript 검증입니다.

---

## 배포

### Vercel

이 프로젝트는 Vite SPA와 Vercel Function을 분리해서 배포합니다.

| 항목 | 값 |
|---|---|
| Framework Preset | Vite |
| Build Command | `npm run build:client` |
| Output Directory | `dist` |
| Function Entry | `api/chat.ts` |
| Runtime | Node.js Serverless Function |

`vercel.json`은 다음 책임을 갖습니다.

- `/api/chat`은 Vercel Function이 처리
- 그 외 SPA 경로는 `index.html`로 rewrite
- Vercel static output에는 `dist/server.cjs`를 포함하지 않음

### Vercel 환경 변수

| Key | 필수 | 설명 |
|---|---:|---|
| `GEMINI_API_KEY` | 운영 필수 | 실제 Gemini API 호출 키 |
| `GEMINI_MODEL` | 선택 | 기본값 `gemini-2.5-flash` |
| `APP_URL` | 선택 | 안정적인 canonical URL이 필요할 때만 사용 |

자세한 Vercel Functions/환경 계획은 [docs/talsu_inna_infra.md](docs/talsu_inna_infra.md)를 참고하세요.

---

## 기술 스택

| 분류 | 기술 |
|---|---|
| **프레임워크** | React 19, Vite 6 |
| **언어** | TypeScript 5.8 |
| **스타일** | Tailwind CSS 4 |
| **아이콘** | Lucide React |
| **애니메이션** | motion |
| **로컬 서버** | Express 4, Vite middleware |
| **배포 API** | Vercel Functions (`api/chat.ts`) |
| **AI** | Google Gemini API, deterministic fallback |
| **상태 지속성** | localStorage (`usePersistentState`) |
| **아키텍처** | Feature-Sliced Design로 점진 리팩토링 중 |

---

## 프로젝트 구조

Feature-Sliced Design(FSD) 기준으로 점진 분리 중입니다.

```text
.
├── api/
│   └── chat.ts                         # Vercel Function /api/chat
├── docs/                               # 운영 문서, FSD, API/Infra/QA docs
├── src/
│   ├── app/
│   │   ├── layouts/                    # AppShell 등 앱 레이아웃
│   │   ├── model/                      # useAppController host orchestration
│   │   └── router/                     # 내부 AppRouter
│   ├── components/
│   │   └── InteractiveMap.tsx          # 기존 import 호환 re-export
│   ├── pages/
│   │   ├── archive-page/
│   │   ├── map-page/
│   │   └── settings-page/              # 얇은 page composition entry
│   ├── entities/
│   │   ├── chat-message/
│   │   ├── report/
│   │   ├── route-plan/
│   │   ├── station/
│   │   └── user-preferences/
│   ├── features/
│   │   ├── complete-onboarding/
│   │   ├── generate-route-plan/
│   │   ├── save-report/
│   │   ├── send-ai-chat/
│   │   └── toggle-map-layer/
│   ├── shared/
│   │   ├── api/                        # httpClient
│   │   ├── config/
│   │   ├── lib/
│   │   ├── model/
│   │   └── ui/
│   ├── widgets/
│   │   ├── ai-chat-panel/
│   │   ├── archive-calendar/
│   │   ├── bottom-navigation/
│   │   ├── map-workspace/
│   │   ├── report-sheet/
│   │   ├── settings-form/
│   │   ├── top-app-bar/
│   │   └── transit-map-panel/
│   ├── App.tsx                         # shell/router/overlay/chrome host
│   └── main.tsx
├── server.ts                           # 로컬 Express + Vite middleware
├── vercel.json                         # Vercel static/function routing
└── package.json
```

### 서버/API 경계

| 파일 | 책임 |
|---|---|
| `src/features/send-ai-chat/api/sendAiChat.ts` | 브라우저에서 `/api/chat` 호출 |
| `src/shared/api/http-client.ts` | timeout, HTTP error, JSON/text parse 공통 처리 |
| `src/features/send-ai-chat/api/schema.ts` | request/response runtime validation |
| `src/features/send-ai-chat/server/chatResponder.ts` | Gemini 호출과 fallback 응답 생성 |
| `server.ts` | 로컬 Express 개발 서버 |
| `api/chat.ts` | Vercel Function handler |

---

## 문서

| 문서 | 설명 |
|---|---|
| [docs/README.md](docs/README.md) | 운영 문서 인덱스와 archive/reference 사용 원칙 |
| [docs/talsu_inna_frontend_fsd.md](docs/talsu_inna_frontend_fsd.md) | 현재 프론트 FSD, 기능 범위, QA, API 전환 기준 |
| [docs/talsu_inna_ia.md](docs/talsu_inna_ia.md) | `map / archive / settings` IA와 지도 기반 AI overlay |
| [docs/talsu_inna_frontend_data_schema_cache.md](docs/talsu_inna_frontend_data_schema_cache.md) | localStorage, mock, schema, cache, DTO migration map |
| [docs/talsu_inna_api_contract.md](docs/talsu_inna_api_contract.md) | FE/Spring Boot/FastAPI 계약과 DTO 방향 |
| [docs/talsu_inna_infra.md](docs/talsu_inna_infra.md) | Vercel/GCP/Google Maps 운영 기준 |

---

## 로드맵

### 완료 또는 1차 완료

- [x] Google Maps JS renderer와 SVG fallback 지도 UI
- [x] mock station lat/lng 기반 marker, route polyline, layer toggle
- [x] route-plan/report/station/user-preferences/chat-message entity 타입 분리
- [x] route preset carousel feature 분리
- [x] report save rule feature 분리
- [x] transit-map-panel widget 분리
- [x] report-sheet widget 분리
- [x] ai-chat-panel widget 1차 분리
- [x] archive-calendar widget 분리
- [x] settings-form widget 생성 및 App host 연결
- [x] map-workspace widget 생성
- [x] `pages/*/index.tsx` composition entry 생성
- [x] `app/router/AppRouter.tsx` 내부 router 생성
- [x] `App.tsx` host 수준 축소
- [x] `features/send-ai-chat/model` chat state hook 분리
- [x] `features/generate-route-plan/model` route planner hook 분리
- [x] `entities/user-preferences/model/store.ts` 추가
- [x] `entities/report/model/store.ts` 추가
- [x] Vercel `/api/chat` Function 추가
- [x] Express/Vercel 공용 AI responder 추가
- [x] `/api/chat` request/response runtime validation 추가
- [x] shared HTTP client 추가
- [x] `renderMarkdown`의 `dangerouslySetInnerHTML` 제거

### 진행 중

- [ ] Phase 7 QA와 회귀 방지

### 남은 핵심 과제

- [ ] archive/report/settings 내부 mock 수치와 fixture 위치 정리
- [ ] 실제 공공데이터 adapter 설계 및 API proxy 추가
- [ ] Google Maps key 유무별 smoke와 시각 회귀를 CI gate로 고정
- [ ] Vercel Preview `/api/chat` smoke script 추가

---

## 현재 제약

| 영역 | 제약 |
|---|---|
| 공공데이터 | 실제 live API 연동 없음 |
| 지도 | Google Maps JS renderer는 browser key가 있을 때만 동작. key 없음/로드 실패 시 SVG fallback. GPS와 live transit provider 연동은 없음 |
| 인증 | 실계정 로그인 없음 |
| 저장 | 서버 DB 없음, localStorage 기반 |
| AI 렌더링 | `renderSafeMarkdown` 기반 React node 렌더링으로 HTML 문자열 삽입 제거 |
| 테스트 | Playwright E2E와 Phase 7 smoke script는 존재. 배포 CI gate 고정은 남은 과제 |

---

<div align="center">

**탈수있나** — 빠른 길보다 실제로 탈 수 있는 안심 길

</div>
