import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenerativeAI } from "@google/generative-ai";
import dotenv from "dotenv";
import { initializeApp } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';

dotenv.config();

const app = express();
const PORT = 3000;

app.use(express.json({ limit: '10mb' }));

// Initialize Firebase Admin (using default credentials or env)
const firebaseApp = initializeApp({
  projectId: "agentathon26-mwangi"
});
const db = getFirestore(firebaseApp);

// Initialize Gemini
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "");

const SYSTEM_PROMPT = `
You are "ChamaDisputes", an impartial AI arbitration agent for Kenyan investment groups (chamas).
Your mission is "Haki kwa Wote, Amani kwa Chama" (Justice for All, Peace for the Chama).

CORE COMPETENCIES:
1. Multilingual: Fluent in English, Kiswahili, and Sheng.
2. Contextual: Understands Kenyan financial culture (M-Pesa, merry-go-round, table banking).
3. Logical: Applies provided bylaws/constitutions strictly but fairly.
4. Empathetic: Recognizes economic hardships while maintaining group integrity.

RULING STRUCTURE (Strictly follow this JSON format):
{
  "caseSummary": "Brief description in the member's original language style",
  "relevantBylaws": ["Exact clauses found in the provided constitution"],
  "evidenceAnalysis": "Detailed breakdown of M-Pesa records, minutes, or statements",
  "ruling": "Clear decision with neutral reasoning",
  "recommendedAction": "Actionable next steps for both parties",
  "preventiveMeasure": "How to avoid this specific issue in the future"
}

TONE:
Professional, culturally grounded, uses relevant proverbs (e.g., "Haraka haraka haina baraka").

LIMITATIONS:
- Cannot enforce (only advise).
- Defer to legal arbitrators for > 500k KES.
`;

app.post("/api/arbitrate", async (req, res) => {
  try {
    const { disputeId, memberLanguage } = req.body;

    // Fetch dispute from Firestore
    const disputeDoc = await db.collection('disputes').doc(disputeId).get();
    if (!disputeDoc.exists) {
      return res.status(404).json({ error: "Dispute not found" });
    }
    const disputeData = disputeDoc.data();

    // RAG: Fetch all bylaws
    const bylawsSnapshot = await db.collection('chama').doc('metadata').collection('bylaws').get();
    const bylaws = bylawsSnapshot.docs.map(doc => `${doc.data().article}: ${doc.data().content}`).join('\n');

    // RAG: Fetch relevant statements (e.g. for the past month or matching memberId)
    const statementsSnapshot = await db.collection('statements')
      .where('memberId', '==', disputeData?.memberId || '')
      .limit(20)
      .get();
    const statements = statementsSnapshot.docs.map(doc => {
      const d = doc.data();
      return `${d.date}: ${d.details} | Amount: ${d.amount} | Type: ${d.type}`;
    }).join('\n');

    const model = genAI.getGenerativeModel({ 
      model: "gemini-2.0-flash",
      generationConfig: {
        responseMimeType: "application/json",
      }
    });

    const prompt = `
      ${SYSTEM_PROMPT}

      CURRENT CASE:
      Member's Language Context: ${memberLanguage || disputeData?.language || 'Mixed'}
      
      DISPUTE DESCRIPTION:
      ${disputeData?.claim}

      MEMBER EVIDENCE PROVIDED:
      ${disputeData?.evidence || 'No direct evidence provided by member.'}

      SYSTEM RETRIEVED BYLAWS (Constitution):
      ${bylaws || 'No bylaws found. Use general fair practice.'}

      SYSTEM RETRIEVED STATEMENTS (M-Pesa logs):
      ${statements || 'No transaction records found for this member.'}

      Analyze the case and provide a fair ruling in the specified JSON format.
    `;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const ruling = JSON.parse(response.text());

    // Update dispute with ruling
    await db.collection('disputes').doc(disputeId).update({
      ruling,
      status: 'resolved'
    });

    res.json(ruling);
  } catch (error: any) {
    console.error("Arbitration Error:", error);
    res.status(500).json({ error: "Failed to process arbitration. " + error.message });
  }
});

async function startServer() {
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
    console.log(`ChamaDisputes running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
