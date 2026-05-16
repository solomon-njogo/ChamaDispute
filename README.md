# Msuluhishi - Umoja Chama AI Arbitrator

**Msuluhishi** (The Arbitrator) is a professional AI mediation platform designed to resolve disputes within "Chamas" (informal savings and credit groups) in East Africa. By combining real-time financial records with a group's specific bylaws, it provides neutral, evidence-based advisory rulings.

## ⚖️ The Problem
Chamas are essential financial vehicles for millions, yet they are often plagued by internal friction. Lack of transparency in records, complex bylaw interpretations, and perceived bias in leadership decisions can lead to "drama" and group dissolution. Members need a neutral third party that "knows the rules" and "sees the books" to provide instant clarity during heated meetings.

## 🏗️ Agent Architecture

### The Core Agent: Msuluhishi Adjudicator
The system is powered by a high-reasoning Gemini 1.5 Flash agent configured as a **Neutral Arbitrator and Treasurer's Assistant**. 

### Tools & Capabilities
*   **Knowledge Base Integration**: Automatically parses and contextualizes multiple data sources:
    *   `bylaws_umoja_chama.md`: The governing "Constitution" of the group.
    *   `contribution_ledger_2024.csv`: Real-time payment tracking.
    *   `loan_register_2024.csv`: Historical and current debt status.
    *   `dispute_log_2024.csv`: Case history for legal precedent.
*   **Linguistic Fluidity**: A multi-lingual prompt engine that handles inputs in **English**, **Kiswahili**, and **Sheng**, ensuring inclusivity for all members.
*   **Contextual Streaming**: A custom Express middleware that streams Adjudication reports token-by-token, providing a responsive "live reasoning" experience.

### Communication Flow
1.  **Selection**: Member selects an "Active Case" from the Dashboard.
2.  **Context Assembly**: The server reads the entire `/data` directory, caches the records, and injects relevant CSV/MD snippets into the prompt.
3.  **Adjudication**: Gemini analyzes the dispute against the specific Article numbers in the bylaws.
4.  **Verdict**: A formatted report is returned with a "Final Verdict" and "Digital Certificate" of arbitration.

## 🚀 How to Run Locally

### Prerequisites
- Node.js 18+
- A Google Gemini API Key

### Setup
1. Clone the repository to your local machine.
2. Install dependencies:
   ```bash
   npm install
   ```
3. Create a `.env` file in the root directory and add your API key:
   ```env
   GEMINI_API_KEY=your_api_key_here
   ```
4. Start the development server:
   ```bash
   npm run dev
   ```
5. Open your browser to `http://localhost:3000`.

## 📱 Interaction Guide

### Deployed Version
Interaction is designed to be mobile-first and intuitive for group members:
1.  **Review Records**: Check the "Chama Records" tab to verify the current ledger and bylaws.
2.  **Dashboard Hub**: View the "Active Cases" section for disputes requiring immediate action.
3.  **Arbitrate**: Click **"Resolve with Msuluhishi"** on any active case.
4.  **Chat Interface**: Ask follow-up questions like "Why was my loan denied?" in Kiswahili (*"Kwanini mkopo wangu ulikataliwa?"*) and receive a detailed explanation based on your specific contribution history.

## 📸 Screenshots

![Chama Hub Dashboard](./Screenshots/dash.png)
*The Chama Hub showing real-time stats and the Action Queue for pending disputes.*

![AI Arbitration Chat](./Screenshots/arbi.png)
*Msuluhishi providing a multilingual advisory ruling based on Article 7.4 of the group bylaws.*

---
*Built for the Google AI Studio Global Hackathon.*
