<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://ai.google.dev/static/site-assets/images/share-ais-513315318.png" />
</div>

# Run and deploy 탈수있나

This contains everything you need to run your app locally.

View your app in AI Studio: https://ai.studio/apps/101c6464-87bf-4567-8371-ceaa9a216677

## Run Locally

**Prerequisites:**  Node.js

1. Install dependencies:
   `npm install`
2. Copy [.env.example](.env.example) to `.env` or `.env.local` and set `GEMINI_API_KEY`.
3. Run the app:
   `npm run dev`

## Vercel Runtime

The Vercel deployment path is split from the local Express dev server:

- Static app: Vercel runs `npm run build:client` and outputs the Vite SPA to `dist`.
- Local production server: `npm run build` still creates `dist/server.cjs` for `npm start`.
- Function API: [api/chat.ts](api/chat.ts) serves `POST /api/chat`.
- Shared server logic: [chatResponder.ts](src/features/send-ai-chat/server/chatResponder.ts) is used by both Vercel and local Express.
- Required Vercel env: `GEMINI_API_KEY`.
- Optional Vercel env: `GEMINI_MODEL`, defaults to `gemini-2.5-flash`.

If `GEMINI_API_KEY` is not configured, `/api/chat` returns deterministic fallback responses so the UI remains usable.
