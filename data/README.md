# Umoja Chama — Data Directory

Sample data for the Chama Dispute Arbitrator RAG pipeline. All names, ID numbers, phone numbers, and financial figures are fictional.

## Files

| File | Type | Description |
|------|------|-------------|
| `bylaws_umoja_chama.md` | Constitution | 12-article chama constitution covering membership, contributions, loans, welfare, and dispute resolution. Primary source for arbitration rulings. |
| `mpesa_statement_umoja_paybill.csv` | Transaction log | Jan–May 2024 M-Pesa paybill statement (Paybill 522533). Contains receipts, timestamps, amounts, and account IDs. |
| `contribution_ledger_2024.csv` | Financial ledger | Per-member contribution status Jan–May 2024 with late fees, loan balances, guarantor links, and inline dispute flags. |
| `loan_register_2024.csv` | Financial ledger | Active and cleared loans with disbursement dates, repayment schedules, guarantors, and balances. |
| `welfare_fund_register_2024.csv` | Financial ledger | Welfare claims (disbursed, pending, rejected) with event types, amounts, and supporting document references. |
| `dispute_log_2024.csv` | Dispute records | All 2024 disputes with bilingual descriptions (English + Kiswahili), bylaw citations, evidence refs, panel decisions, and resolutions. |
| `rotation_schedule_2024.csv` | Schedule | 2024 merry-go-round draw order, payout status, amounts, and notes per member. |
| `investment_register_2024.csv` | Financial ledger | Active and historical chama investments with governance documentation (votes, co-signatures, certificate refs). |
| `member_profiles.csv` | Member data | 18 members with contact info, preferred languages, contribution history, loan/welfare history, and standing notes. |
| `meeting_minutes_2024.md` | Meeting records | Jan AGM through May 2024 minutes with financial reports, dispute discussions, votes, and panel decisions. |
| `sample_disputes_multilingual.md` | Test cases | 6 dispute scenarios in Sheng, Kiswahili, and English — for testing arbitrator RAG retrieval and multilingual understanding. |

## Disputes in the Data

| ID | Short description | Status |
|----|-------------------|--------|
| DIS-2024-001 | Mwangi (009) — Jan late fee, Safaricom delay | Resolved: fee waived |
| DIS-2024-002 | Awino (012) — payment sent to Treasurer's personal number | Resolved: fee waived, funds transferred |
| DIS-2024-003 | Ombogo (017) — Apr late fee, paybill maintenance downtime | Resolved: fee waived |
| DIS-2024-004 | Kamande (011) — welfare claim appeal, child hospitalisation | Pending: June meeting |
| DIS-2024-005 | Muthoni/Chebet — merry-go-round swap dispute | Resolved: swap upheld |

## Languages Represented
- English
- Kiswahili (Swahili)
- Sheng (Nairobi urban creole, Kiswahili/English mix)
- Dholuo, Kalenjin, Kamba, Luhya, Arabic — noted as member preferred languages (not in text data)
