import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import { fileURLToPath } from "url";
import Anthropic from "@anthropic-ai/sdk";
import dotenv from "dotenv";

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // Anthropic Client
  const anthropic = new Anthropic({
    apiKey: process.env.ANTHROPIC_API_KEY,
  });

  // API Route for Claude Critique
  app.post("/api/critique", async (req, res) => {
    try {
      const { geminiOutput } = req.body;

      if (!geminiOutput) {
        return res.status(400).json({ error: "geminiOutput is required" });
      }

      if (!process.env.ANTHROPIC_API_KEY) {
        return res.status(500).json({ error: "ANTHROPIC_API_KEY is not configured on the server." });
      }

      const response = await anthropic.messages.create({
        model: "claude-3-opus-20240229", 
        max_tokens: 2048,
        system: `You are a critical evaluator of AI welfare systems for India. 
        When given outputs from an eligibility matching engine, you must:
        1. Check for hallucinated or incorrect eligibility criteria
        2. Flag any silent failures or false confidence
        3. Identify missing edge cases
        4. Assess explainability of confidence scores
        5. Point out Hinglish/language handling gaps
        Be harsh. Real people depend on this system.`,
        messages: [{
          role: "user",
          content: `Critique this output from my welfare eligibility engine:\n\n${geminiOutput}`
        }]
      });

      const message = response.content[0];
      if (message.type === 'text') {
        res.json({ critique: message.text });
      } else {
        res.status(500).json({ error: "Unexpected response format from Anthropic" });
      }
    } catch (error: any) {
      console.error("Anthropic API Error:", error);
      res.status(500).json({ error: error.message || "Failed to get critique from Claude" });
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running at http://localhost:${PORT}`);
  });
}

startServer();
