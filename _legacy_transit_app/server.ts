import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import dotenv from "dotenv";
import { createAiChatResponse } from "./src/features/send-ai-chat/server/chatResponder";
import { AiChatValidationError } from "./src/features/send-ai-chat/api/schema";

dotenv.config();

async function startServer() {
  const app = express();
  app.use(express.json());
  const PORT = 3000;
  
  // API route first
  app.post("/api/chat", async (req, res) => {
    try {
      return res.json(await createAiChatResponse(req.body));
    } catch (err: any) {
      if (err instanceof AiChatValidationError) {
        return res.status(400).json({ error: err.message });
      }
      console.error("Gemini API invocation error:", err);
      return res.status(500).json({ error: "Gemini operation failed: " + err.message });
    }
  });

  // Serve static assets in production, hook Vite middleware in development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`[Server] '탈수있나' server is running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
