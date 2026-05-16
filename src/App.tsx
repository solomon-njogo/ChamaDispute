import React, { useState, useEffect } from 'react';
import { Gavel, History, LayoutDashboard, Settings, LogOut, AlertCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { BylawsManager } from './components/BylawsManager';
import { DisputeForm } from './components/DisputeForm';
import { RulingView } from './components/RulingView';
import { StatementManager } from './components/StatementManager';
import { ChamaBylaws, DisputeCase, Ruling } from './types';
import { cn } from './lib/utils';
import { chamaService } from './services/chamaService';

export default function App() {
  const [activeTab, setActiveTab] = useState<'dashboard' | 'history' | 'settings'>('dashboard');
  const [bylaws, setBylaws] = useState<ChamaBylaws[]>([]);
  const [cases, setCases] = useState<DisputeCase[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [currentRuling, setCurrentRuling] = useState<Ruling | null>(null);

  const refreshData = async () => {
    const [fetchedBylaws, fetchedCases] = await Promise.all([
      chamaService.getBylaws(),
      chamaService.getDisputes()
    ]);
    setBylaws(fetchedBylaws);
    setCases(fetchedCases);
  };

  useEffect(() => {
    refreshData();
  }, []);

  const handleArbitrate = async (claim: string, evidence: string, language: string, memberId: string) => {
    setIsLoading(true);
    setCurrentRuling(null);

    try {
      // 1. Create dispute record in Firestore
      const disputeId = await chamaService.createDispute(claim, evidence, language, memberId);
      
      // 2. Call API to run RAG arbitration
      const response = await fetch('/api/arbitrate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ disputeId, memberLanguage: language }),
      });

      if (!response.ok) throw new Error('Arbitration failed');

      const rulingData: Ruling = await response.json();
      setCurrentRuling(rulingData);
      
      // 3. Refresh list
      await refreshData();
    } catch (error) {
      console.error(error);
      alert('Arbitration failed. Ensure you have properly uploaded bylaws and statements for this member ID.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-chama-bg flex flex-col md:flex-row">
      {/* Sidebar */}
      <aside className="hidden md:flex w-64 bg-chama-primary text-white flex-col sticky top-0 h-screen">
        <div className="p-8">
          <div className="flex items-center gap-3 mb-2">
            <Gavel className="text-chama-secondary" size={32} />
            <h1 className="text-2xl font-display font-bold">ChamaDisputes</h1>
          </div>
          <p className="text-[10px] uppercase tracking-tighter opacity-60 font-bold">
            Haki kwa Wote, Amani kwa Chama
          </p>
        </div>

        <nav className="flex-1 px-4 space-y-2">
          <NavBtn 
            active={activeTab === 'dashboard'} 
            onClick={() => setActiveTab('dashboard')}
            icon={<LayoutDashboard size={20} />}
            label="Arbitration Hub"
          />
          <NavBtn 
            active={activeTab === 'history'} 
            onClick={() => setActiveTab('history')}
            icon={<History size={20} />}
            label="Dispute Ledger"
          />
          <NavBtn 
            active={activeTab === 'settings'} 
            onClick={() => setActiveTab('settings')}
            icon={<Settings size={20} />}
            label="Governance"
          />
        </nav>

        <div className="p-4 mt-auto">
          <div className="flex items-center gap-3 p-4 rounded-xl bg-white/5">
            <div className="w-10 h-10 rounded-full bg-chama-secondary flex items-center justify-center text-chama-primary font-bold">
              TJ
            </div>
            <div className="flex-1 min-w-0 text-left">
              <p className="text-sm font-bold truncate">Treasurer Rotich</p>
              <p className="text-[10px] opacity-50 truncate">Umoja Group</p>
            </div>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 p-4 md:p-8 lg:p-12 max-w-6xl mx-auto w-full overflow-y-auto">
        {activeTab === 'dashboard' && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="space-y-8"
          >
            <header className="flex flex-col md:flex-row md:items-end justify-between gap-4">
              <div>
                <h2 className="text-3xl text-chama-primary mb-1">Mediation Center</h2>
                <p className="text-gray-500">Impartial RAG-powered dispute resolution.</p>
              </div>
              <div className="flex gap-3">
                <StatCard label="Ledger Cases" value={cases.length} />
                <StatCard label="Bylaws" value={bylaws.length} color="chama-primary" />
              </div>
            </header>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2 space-y-6">
                <DisputeForm onSubmit={handleArbitrate} isLoading={isLoading} />
                <AnimatePresence mode="wait">
                  {currentRuling && <RulingView key="current" ruling={currentRuling} />}
                </AnimatePresence>
              </div>
              
              <div className="space-y-6">
                <BylawsManager bylaws={bylaws} onRefresh={refreshData} />
                <StatementManager />
                
                {bylaws.length === 0 && (
                  <div className="bg-amber-50 border border-amber-200 p-4 rounded-xl flex items-center gap-3 text-amber-800">
                    <AlertCircle size={20} />
                    <p className="text-xs font-medium">Warning: No bylaws configured. AI will use general justice principles.</p>
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        )}

        {activeTab === 'history' && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="space-y-6"
          >
            <h2 className="text-3xl text-chama-primary mb-6">Dispute Ledger</h2>
            {cases.length === 0 ? (
              <div className="text-center py-20 bg-white rounded-3xl border border-dashed border-gray-200">
                <History size={48} className="mx-auto text-gray-300 mb-4" />
                <p className="text-gray-500">No disputes recorded in Firebase yet.</p>
              </div>
            ) : (
              <div className="grid gap-4">
                {cases.map((c) => (
                  <div key={c.id} className="bg-white p-6 rounded-2xl border border-gray-100 flex items-start justify-between group hover:shadow-md transition-all">
                    <div className="flex-1">
                      <div className="flex items-center gap-4 mb-3">
                        <span className="text-[10px] font-bold uppercase tracking-widest text-gray-400">
                          {new Date(c.createdAt).toLocaleDateString('en-KE', { dateStyle: 'full' })}
                        </span>
                        <span className={cn(
                          "px-2 py-0.5 rounded text-[10px] font-bold uppercase",
                          c.status === 'resolved' ? "bg-green-100 text-green-700" : "bg-amber-100 text-amber-700"
                        )}>
                          {c.status}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 mb-2">
                        <span className="bg-chama-primary/10 text-chama-primary text-[10px] font-bold px-2 py-0.5 rounded">Member {c.memberId}</span>
                        <span className="text-gray-400">•</span>
                        <span className="sheng-badge">{c.language}</span>
                      </div>
                      <p className="font-medium text-gray-800 italic leading-relaxed">"{c.memberClaim}"</p>
                      
                      {c.ruling && (
                        <button 
                          onClick={() => { setActiveTab('dashboard'); setCurrentRuling(c.ruling || null); }}
                          className="mt-4 px-4 py-2 bg-gray-100 rounded-lg text-xs font-bold text-gray-600 hover:bg-chama-primary hover:text-white transition-all shadow-sm"
                        >
                          Show Full Ruling
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </motion.div>
        )}

        {activeTab === 'settings' && (
          <div className="bg-white rounded-3xl p-12 text-center border border-gray-100">
            <Settings size={64} className="mx-auto text-chama-secondary mb-6" />
            <h2 className="text-3xl font-display font-bold text-gray-800 mb-4">Chama Governance</h2>
            <p className="text-gray-500 max-w-md mx-auto mb-8">
              Configure system-wide parameters, manage member list, and review AI confidence scores.
            </p>
            <div className="flex justify-center gap-4">
              <button className="px-6 py-3 bg-chama-primary text-white rounded-xl font-bold shadow-lg shadow-chama-primary/20">
                Manage Members
              </button>
              <button className="px-6 py-3 border border-gray-200 rounded-xl font-bold">
                Export Ledger
              </button>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

function NavBtn({ active, onClick, icon, label }: { active: boolean, onClick: () => void, icon: React.ReactNode, label: string }) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all font-medium",
        active 
          ? "bg-white text-chama-primary shadow-lg shadow-black/10 scale-105" 
          : "text-white/70 hover:text-white hover:bg-white/5"
      )}
    >
      {icon}
      <span>{label}</span>
    </button>
  );
}

function StatCard({ label, value, color }: { label: string, value: number, color?: string }) {
  return (
    <div className="bg-white px-6 py-3 rounded-2xl border border-gray-100 shadow-sm min-w-32">
      <p className="text-[10px] uppercase tracking-widest text-gray-400 font-bold">{label}</p>
      <p className={cn("text-2xl font-display font-bold", color ? `text-${color}` : "text-gray-800")}>{value}</p>
    </div>
  );
}
