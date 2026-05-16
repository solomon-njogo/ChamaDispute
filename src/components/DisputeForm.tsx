import React, { useState } from 'react';
import { Send, Image, Languages, Info, Loader2, User } from 'lucide-react';
import { motion } from 'motion/react';
import { cn } from '../lib/utils';

interface DisputeFormProps {
  onSubmit: (claim: string, evidence: string, language: string, memberId: string) => void;
  isLoading: boolean;
}

export const DisputeForm: React.FC<DisputeFormProps> = ({ onSubmit, isLoading }) => {
  const [claim, setClaim] = useState('');
  const [evidence, setEvidence] = useState('');
  const [memberId, setMemberId] = useState('');
  const [language, setLanguage] = useState('English');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!claim.trim() || !memberId.trim()) return;
    onSubmit(claim, evidence, language, memberId);
    setClaim('');
    setEvidence('');
    setMemberId('');
  };

  return (
    <div className="glass-card rounded-2xl p-6 mb-8 border-l-4 border-l-chama-accent overflow-hidden relative">
      <div className="absolute top-0 right-0 p-4 opacity-5 pointer-events-none">
        <Languages size={120} />
      </div>

      <div className="flex items-center gap-2 mb-4">
        <Info size={18} className="text-chama-accent" />
        <h3 className="text-lg font-bold text-gray-800">New Dispute Arbitration</h3>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="mb-4">
          <label className="block text-xs font-bold text-gray-400 uppercase mb-1">Involved Member ID</label>
          <div className="relative">
            <User className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
            <input
              type="text"
              value={memberId}
              onChange={(e) => setMemberId(e.target.value)}
              className="w-full pl-10 pr-4 py-2 rounded-xl border border-gray-100 bg-gray-50/50 focus:outline-none focus:ring-2 focus:ring-chama-accent/20"
              placeholder="e.g. UMOJA009"
              required
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-gray-400 uppercase mb-1">What's the issue? (Member's claim)</label>
              <div className="relative">
                <textarea
                  value={claim}
                  onChange={(e) => setClaim(e.target.value)}
                  className="w-full h-32 px-4 py-3 rounded-xl border border-gray-100 bg-gray-50/50 focus:outline-none focus:ring-2 focus:ring-chama-accent/20 text-sm resize-none"
                  placeholder="e.g. Treasurer amekataa kurecord contribution yangu ya jana..."
                  required
                />
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-gray-400 uppercase mb-1">Supporting Evidence (Optional)</label>
              <textarea
                value={evidence}
                onChange={(e) => setEvidence(e.target.value)}
                className="w-full h-32 px-4 py-3 rounded-xl border border-gray-100 bg-gray-50/50 focus:outline-none focus:ring-2 focus:ring-chama-accent/20 text-sm font-mono resize-none"
                placeholder="Paste specific M-Pesa codes or notes..."
              />
            </div>
          </div>
        </div>

        <div className="flex items-center justify-between gap-4 py-2 border-t border-gray-100 mt-2">
          <div className="flex gap-2">
            {['English', 'Kiswahili', 'Sheng', 'Mixed'].map((lang) => (
              <button
                key={lang}
                type="button"
                onClick={() => setLanguage(lang)}
                className={cn(
                  "px-3 py-1 rounded-full text-xs font-semibold transition-all border",
                  language === lang 
                    ? "bg-chama-accent text-white border-chama-accent shadow-sm" 
                    : "bg-white text-gray-500 border-gray-200 hover:border-chama-accent"
                )}
              >
                {lang}
              </button>
            ))}
          </div>
          
          <button
            type="submit"
            disabled={isLoading || !claim.trim() || !memberId.trim()}
            className="px-8 py-3 bg-chama-primary text-white rounded-xl font-bold flex items-center gap-2 hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed transition-all"
          >
            {isLoading ? (
              <>
                <Loader2 size={18} className="animate-spin" />
                Arbitrating...
              </>
            ) : (
              <>
                <Send size={18} />
                Get Ruling
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
};
