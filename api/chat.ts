import { createAiChatResponse } from "../src/features/send-ai-chat/server/chatResponder";
import { AiChatValidationError } from "../src/features/send-ai-chat/api/schema";

interface VercelRequest {
  method?: string;
  body?: unknown;
}

interface VercelResponse {
  status(code: number): VercelResponse;
  json(body: unknown): void;
  setHeader(name: string, value: string): void;
}

function parseBody(body: unknown) {
  if (typeof body !== "string") return body;
  return JSON.parse(body);
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader("Cache-Control", "no-store");

  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const body = parseBody(req.body);
    return res.status(200).json(await createAiChatResponse(body));
  } catch (err: any) {
    if (err instanceof AiChatValidationError || err instanceof SyntaxError) {
      return res.status(400).json({ error: err.message });
    }
    console.error("Vercel /api/chat invocation error:", err);
    return res.status(500).json({ error: "Gemini operation failed: " + err.message });
  }
}
