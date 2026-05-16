import React, { useState } from 'react';
import { Upload, FileUp, CheckCircle, AlertCircle, Loader2 } from 'lucide-react';
import Papa from 'papaparse';
import { chamaService } from '../services/chamaService';

export const StatementManager: React.FC = () => {
  const [isUploading, setIsUploading] = useState(false);
  const [status, setStatus] = useState<{ type: 'success' | 'error', message: string } | null>(null);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    setStatus(null);

    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: async (results) => {
        try {
          const entries = results.data.map((row: any) => ({
            receiptNo: row['Receipt No'] || row['receipt_no'] || Math.random().toString(36).substr(2, 9),
            date: row['Date'] || row['date'],
            details: row['Details'] || row['details'],
            amount: parseFloat(row['Amount'] || row['Paid In (KES)'] || '0'),
            type: (row['Transaction Type'] || row['type'] || '').toLowerCase().includes('withdraw') ? 'debit' : 'credit',
            memberId: row['Account'] || row['member_id'] || 'UNKNOWN'
          }));

          await chamaService.uploadStatementEntries(entries);
          setStatus({ type: 'success', message: `Successfully uploaded ${entries.length} transactions.` });
        } catch (err: any) {
          setStatus({ type: 'error', message: "Failed to parse or upload statement. Check your CSV format." });
        } finally {
          setIsUploading(false);
        }
      },
      error: (err) => {
        setStatus({ type: 'error', message: "Error reading file: " + err.message });
        setIsUploading(false);
      }
    });
  };

  return (
    <div className="glass-card rounded-2xl p-6 border-l-4 border-l-chama-secondary">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-chama-secondary/10 rounded-full text-chama-secondary">
            <Upload size={24} />
          </div>
          <div>
            <h3 className="text-lg font-bold text-gray-800">M-Pesa Statement Manager</h3>
            <p className="text-sm text-gray-500">Upload CSV to provide RAG context for disputes</p>
          </div>
        </div>
        
        <label className="relative cursor-pointer bg-chama-secondary text-chama-primary px-4 py-2 rounded-lg font-bold hover:bg-opacity-90 transition-all flex items-center gap-2">
          {isUploading ? <Loader2 size={18} className="animate-spin" /> : <FileUp size={18} />}
          <span>Upload CSV</span>
          <input 
            type="file" 
            accept=".csv" 
            className="hidden" 
            onChange={handleFileUpload}
            disabled={isUploading}
          />
        </label>
      </div>

      {status && (
        <div className={`mt-4 p-4 rounded-xl flex items-center gap-3 ${
          status.type === 'success' ? 'bg-green-50 text-green-700 border border-green-100' : 'bg-red-50 text-red-700 border border-red-100'
        }`}>
          {status.type === 'success' ? <CheckCircle size={18} /> : <AlertCircle size={18} />}
          <p className="text-sm font-medium">{status.message}</p>
        </div>
      )}

      <div className="mt-4 bg-gray-50 rounded-xl p-4 border border-gray-100">
        <h4 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">Expected Columns</h4>
        <div className="flex flex-wrap gap-2 mb-4">
          {['Receipt No', 'Date', 'Details', 'Amount', 'Account'].map(col => (
            <span key={col} className="bg-white border border-gray-200 px-2 py-1 rounded text-[10px] text-gray-600 font-mono">
              {col}
            </span>
          ))}
        </div>
        
        <button 
          onClick={async () => {
            setIsUploading(true);
            const sample = [
              { receiptNo: 'RKT991', date: '2024-05-01', details: 'May Contribution', amount: 5000, type: 'credit', memberId: 'UMOJA009' },
              { receiptNo: 'RKT992', date: '2024-05-06', details: 'Late Fee', amount: 200, type: 'credit', memberId: 'UMOJA009' }
            ];
            await chamaService.uploadStatementEntries(sample);
            setStatus({ type: 'success', message: "Loaded sample data for UMOJA009" });
            setIsUploading(false);
          }}
          className="text-[10px] text-chama-primary font-bold hover:underline"
        >
          Load Sample Data (for UMOJA009)
        </button>
      </div>
    </div>
  );
};
