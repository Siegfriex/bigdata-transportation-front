# 탈수있나 Vercel Functions & Environment Plan

> 목적: 프론트 리팩토링과 겹치지 않게 Vercel 배포/환경 변수/API Function 경계를 고정한다.
> 작성일: 2026-05-27
> 범위: `/api/chat`, Vercel Functions, env, 정적 Vite 배포. UI widget/page 리팩토링은 `docs/talsu_inna_refactor_plan.md`에서 관리한다.

## 1. 현재 결정

| 항목 | 결정 |
|---|---|
| 정적 프론트 | Vite `dist`를 Vercel static output으로 배포 |
| API 런타임 | Vercel Node.js Serverless Function |
| Function 엔트리 | `api/chat.ts` |
| 로컬 개발 | 기존 `server.ts` Express + Vite middleware 유지 |
| 공용 서버 로직 | `src/features/send-ai-chat/server/chatResponder.ts` |
| Edge Function 사용 | 사용하지 않음. Gemini SDK와 Node 런타임 호환성을 우선 |
| Streaming | 현재 미사용. 장문 응답 UX가 필요해질 때 SSE로 별도 전환 |

## 2. 파일 책임

| 파일 | 책임 |
|---|---|
| `vercel.json` | Vercel build/output/function duration/rewrite 설정 |
| `api/chat.ts` | Vercel `POST /api/chat` Function handler |
| `server.ts` | 로컬 개발 서버. Vercel 배포용 서버가 아님 |
| `src/features/send-ai-chat/server/chatResponder.ts` | Gemini 호출, fallback 응답, model/env 선택 |
| `src/features/send-ai-chat/api/schema.ts` | `/api/chat` request/response runtime validation |
| `src/features/send-ai-chat/api/sendAiChat.ts` | 브라우저에서 `/api/chat` 호출, response schema 적용 |
| `src/shared/api/http-client.ts` | fetch timeout, HTTP error shape, JSON/text parse 공통 처리 |
| `package.json` | Vercel은 `build:client`, 로컬 production 서버는 `build:server` 사용 |

## 3. 환경 변수

| 변수 | 필수 | 환경 | 설명 |
|---|---:|---|---|
| `GEMINI_API_KEY` | 운영 필수 | Local, Vercel | 실제 Gemini API 호출 키 |
| `GEMINI_MODEL` | 선택 | Local, Vercel | 기본값 `gemini-2.5-flash` |
| `APP_URL` | 선택 | Local, Vercel | 안정적인 canonical URL이 필요할 때만 사용 |
| `VERCEL_URL` | 자동 | Vercel | Vercel이 자동 제공. 코드에서 직접 의존하지 않음 |

`GEMINI_API_KEY`가 없거나 `MY_GEMINI_API_KEY`이면 서버는 외부 호출 없이 fallback JSON을 반환한다. 이 정책은 로컬 Express와 Vercel Function에서 동일하다.

## 4. Vercel 설정

현재 `vercel.json`:

```json
{
  "buildCommand": "npm run build:client",
  "outputDirectory": "dist",
  "functions": {
    "api/chat.ts": {
      "maxDuration": 300
    }
  },
  "rewrites": [
    {
      "source": "/((?!api/.*).*)",
      "destination": "/index.html"
    }
  ]
}
```

의도:

- `/api/chat`은 Vercel Function이 처리한다.
- 그 외 SPA 경로는 `index.html`로 rewrite한다.
- AI 호출은 Node.js Function으로 두고 300초 한도를 명시한다.
- Vercel static output에는 `server.cjs`를 넣지 않는다. 로컬 production 서버가 필요할 때만 `npm run build:server`를 실행한다.

## 5. 검증 체크리스트

| 단계 | 명령/확인 | 기준 |
|---|---|---|
| 타입 | `npm run lint` | TypeScript 오류 없음 |
| 빌드 | `npm run build` | Vite `dist`와 로컬 `dist/server.cjs` 생성 |
| 클라이언트 API 경계 | `sendAiChat` 내부 | `shared/api/http-client.ts`와 response schema를 통과 |
| 로컬 API | `npm run dev` 후 `POST /api/chat` | fallback 또는 Gemini JSON 응답 |
| Vercel Preview | Vercel 배포 후 `POST /api/chat` | `GEMINI_API_KEY` 유무별 동작 확인 |
| 환경 | Vercel Project Settings | `GEMINI_API_KEY`가 Preview/Production 모두 설정됨 |

## 6. 후속 작업

| 우선순위 | 작업 | 이유 |
|---|---|---|
| P1 | Vercel preview smoke script 추가 | 배포 후 `/api/chat` 회귀를 자동 확인 |
| P1 | AI streaming 검토 | 긴 응답에서 perceived latency 개선 |
| P2 | 교통 공공데이터 API proxy를 별도 Function으로 추가 | 프론트에서 공공 API key 노출 방지 |
