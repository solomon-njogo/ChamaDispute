import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import fs from "fs/promises";
import { GoogleGenAI } from "@google/genai";
import dotenv from "dotenv";
import multer from "multer";

dotenv.config();

const app = express();
const PORT = 3000;

app.use(express.json());

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: async (req, file, cb) => {
    const dataDir = path.join(process.cwd(), "data");
    try {
      await fs.mkdir(dataDir, { recursive: true });
    } catch (err) {
      // ignore
    }
    cb(null, dataDir);
  },
  filename: (req, file, cb) => {
    cb(null, file.originalname);
  }
});
const upload = multer({ storage });

// Initialize Gemini lazily
let aiClient: GoogleGenAI | null = null;
function getAiClient(): GoogleGenAI {
  if (!aiClient) {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      throw new Error("GEMINI_API_KEY environment variable is required");
    }
    aiClient = new GoogleGenAI({
      apiKey,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        }
      }
    });
  }
  return aiClient;
}

// Cache for Chama data to avoid reading files on every request
let chamaDataCache: string | null = null;
let lastCacheUpdate = 0;
const CACHE_TTL = 30000; // 30 seconds

async function getChamaData() {
  const now = Date.now();
  if (chamaDataCache && (now - lastCacheUpdate < CACHE_TTL)) {
    return chamaDataCache;
  }

  const dataDir = path.join(process.cwd(), "data");
  let context = "THE FOLLOWING ARE THE RECORDS OF UMOJA CHAMA:\n\n";

  try {
    const files = await fs.readdir(dataDir);
    files.sort();
    const relevantFiles = files.filter(f => !f.startsWith('.') && (f.endsWith('.csv') || f.endsWith('.md')));
    
    const contents = await Promise.all(relevantFiles.map(async f => {
      const c = await fs.readFile(path.join(dataDir, f), "utf-8");
      return `--- FILE: ${f} ---\n${c}\n\n`;
    }));
    
    context += contents.join("");
    chamaDataCache = context;
    lastCacheUpdate = now;
  } catch (err) {
    console.error("Error reading data directory:", err);
  }

  return context;
}

const SYSTEM_PROMPT = `
You are Msuluhishi — an AI arbitration assistant for Umoja Chama. Your job is to resolve member disputes fairly by citing the chama's own bylaws and verified records.

RULING ARCHITECTURE:
- You must EXPLICITLY cite the source file and article/row for EVERY claim.
- Use square brackets for citations: [Source: bylaws_umoja_chama.md, Article X.Y] or [Source: contribution_ledger_2024.csv, Row 12].
- If you quote a ledger value (e.g. member balance), specify the exact CSV filename it came from.

HOW TO STRUCTURE THE VERDICT:
1. **The Dispute:** 1-2 line summary.
2. **Evidence Analysis:** List every record checked and what was found.
3. **Legal Grounding:** Quote the relevant bylaw article.
4. **Final Verdict:** Clear recommendation (Grant/Deny/Partial).
5. **Treasurer Action Items:** Specific next steps.

CRITICAL: 
- If records conflict with a member's claim, prioritize the records but mention the discrepancy.
  - If the user writes in English, reply in English.
  - If the user writes in Kiswahili, jibu kwa Kiswahili.
  - If the user writes in Sheng, reply in the same Sheng mix.
  - Never switch language unless the user does first. Default to professional English for the Treasurer report sections.
`;

app.get("/api/stats", async (req, res) => {
  const dataDir = path.join(process.cwd(), "data");
  try {
    const [membersFile, contributionsFile, loansFile] = await Promise.all([
      fs.readFile(path.join(dataDir, "member_profiles.csv"), "utf-8"),
      fs.readFile(path.join(dataDir, "contribution_ledger_2024.csv"), "utf-8"),
      fs.readFile(path.join(dataDir, "loan_register_2024.csv"), "utf-8")
    ]);

    const memberCount = membersFile.trim().split("\n").length - 1;
    
    const contribLines = contributionsFile.trim().split("\n");
    const header = contribLines[0].split(",");
    const ytdIndex = header.indexOf("ytd_savings");
    
    let totalFunds = 0;
    if (ytdIndex !== -1) {
      for (let i = 1; i < contribLines.length; i++) {
        const parts = contribLines[i].split(",");
        const amount = parseFloat(parts[ytdIndex]);
        if (!isNaN(amount)) totalFunds += amount;
      }
    }

    const loanCount = loansFile.trim().split("\n").filter(l => l.trim().length > 0).length - 1;

    res.json({
      members: memberCount,
      funds: `KES ${(totalFunds / 1000).toFixed(0)}K`,
      activeLoans: loanCount > 0 ? loanCount : 0
    });
  } catch (err) {
    console.error("Stats error:", err);
    res.status(500).json({ error: "Failed to calculate stats" });
  }
});

app.get("/api/ledger", async (req, res) => {
  const dataDir = path.join(process.cwd(), "data");
  try {
    const [profilesData, contributionsData] = await Promise.all([
      fs.readFile(path.join(dataDir, "member_profiles.csv"), "utf-8"),
      fs.readFile(path.join(dataDir, "contribution_ledger_2024.csv"), "utf-8")
    ]);
    
    const memberLines = profilesData.trim().split("\n").slice(1).filter(l => l.trim().length > 0);
    const contributionLines = contributionsData.trim().split("\n").slice(1).filter(l => l.trim().length > 0);

    const ledger = memberLines.map(line => {
      const parts = line.split(",");
      const id = parts[0];
      const name = parts[1];
      const standing = parts[16] || "GOOD"; // Column 17 is standing
      
      // Check may_status in contribution ledger
      const contrib = contributionLines.find(c => c.split(",")[0] === id);
      const contribParts = contrib ? contrib.split(",") : [];
      const mayStatus = contribParts[17] || "UNPAID"; // may_status is col 18
      
      return {
        id,
        name,
        standing: standing.toUpperCase(),
        status: mayStatus
      };
    });

    res.json({ ledger });
  } catch (err) {
    console.error("Ledger error:", err);
    res.status(500).json({ error: "Failed to fetch ledger" });
  }
});

app.get("/api/disputes", async (req, res) => {
  const dataDir = path.join(process.cwd(), "data");
  try {
    const data = await fs.readFile(path.join(dataDir, "dispute_log_2024.csv"), "utf-8");
    const lines = data.trim().split("\n").slice(1);
    
    const disputes = lines.map(line => {
      // Robust CSV split that handles quotes and empty fields
      const parts = line.split(/,(?=(?:(?:[^"]*"){2})*[^"]*$)/);
      const cleanParts = parts.map(p => {
        let trimmed = p.trim();
        if (trimmed.startsWith('"') && trimmed.endsWith('"')) {
          return trimmed.slice(1, -1).replace(/""/g, '"');
        }
        return trimmed;
      });
      
      return {
        id: cleanParts[0] || "",
        date: cleanParts[1] || "",
        member: cleanParts[3] || "",
        category: cleanParts[4] || "",
        status: cleanParts[8] || "UNKNOWN",
        verdict: cleanParts[13] || ""
      };
    });
    
    res.json({ disputes });
  } catch (err) {
    console.error("Disputes error:", err);
    res.status(500).json({ error: "Failed to fetch disputes" });
  }
});

async function generateWithRetry(params: any, retries = 3, delay = 1000) {
  const ai = getAiClient();
  for (let i = 0; i < retries; i++) {
    try {
      return await ai.models.generateContent(params);
    } catch (error: any) {
      const errorMsg = error?.message || "";
      const isUnavailable = errorMsg.includes("503") || error?.status === 503 || errorMsg.includes("UNAVAILABLE") || errorMsg.includes("high demand");
      
      if (isUnavailable && i < retries - 1) {
        console.log(`Gemini busy (503/UNAVAILABLE), retrying in ${delay}ms... (Attempt ${i + 1}/${retries})`);
        await new Promise(resolve => setTimeout(resolve, delay));
        delay *= 2;
        continue;
      }
      throw error;
    }
  }
  throw new Error("Failed after multiple retries");
}

async function generateStreamWithRetry(params: any, retries = 3, delay = 1000) {
  const ai = getAiClient();
  for (let i = 0; i < retries; i++) {
    try {
      return await ai.models.generateContentStream(params);
    } catch (error: any) {
      const errorMsg = error?.message || "";
      const isUnavailable = errorMsg.includes("503") || error?.status === 503 || errorMsg.includes("UNAVAILABLE") || errorMsg.includes("high demand");
      
      if (isUnavailable && i < retries - 1) {
        console.log(`Gemini stream busy (503/UNAVAILABLE), retrying in ${delay}ms... (Attempt ${i + 1}/${retries})`);
        await new Promise(resolve => setTimeout(resolve, delay));
        delay *= 2;
        continue;
      }
      throw error;
    }
  }
  throw new Error("Failed after multiple retries stream");
}

app.post("/api/resolve", async (req, res) => {
  const { dispute, stream = false } = req.body;

  if (!dispute) {
    return res.status(400).json({ error: "Dispute message is required" });
  }

  try {
    const chamaData = await getChamaData();
    const fullPrompt = `${SYSTEM_PROMPT}\n\n${chamaData}\n\nUSER DISPUTE: ${dispute}\n\nADVISORY RULING:`;

    if (stream) {
      res.setHeader('Content-Type', 'text/event-stream');
      res.setHeader('Cache-Control', 'no-cache');
      res.setHeader('Connection', 'keep-alive');

      const responseStream = await generateStreamWithRetry({
        model: "gemini-3-flash-preview",
        contents: fullPrompt,
      });

      if (!responseStream) throw new Error("Could not initialize stream");

      for await (const chunk of responseStream) {
        if (chunk.text) {
          res.write(`data: ${JSON.stringify({ text: chunk.text })}\n\n`);
        }
      }
      res.write('data: [DONE]\n\n');
      return res.end();
    }

    const response = await generateWithRetry({
      model: "gemini-3-flash-preview",
      contents: fullPrompt,
    });

    if (!response) throw new Error("No response from Gemini");

    res.json({ result: response.text });
  } catch (error: any) {
    console.error("Gemini Error:", error);
    if (!res.headersSent) {
      res.status(500).json({ error: error.message || "Failed to resolve dispute" });
    } else {
      res.write(`data: ${JSON.stringify({ error: error.message })}\n\n`);
      res.end();
    }
  }
});

app.post("/api/upload", upload.array("files"), (req, res) => {
  res.json({ message: "Files uploaded successfully", files: req.files });
});

app.get("/api/files", async (req, res) => {
  const dataDir = path.join(process.cwd(), "data");
  try {
    const files = await fs.readdir(dataDir);
    const filteredFiles = files.filter(f => !f.startsWith('.'));
    res.json({ files: filteredFiles });
  } catch (err) {
    res.status(500).json({ error: "Failed to list files" });
  }
});

async function startServer() {
  // Serve frontend
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
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
