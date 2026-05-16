/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect, useRef } from "react";
import { 
  Scale, 
  MessageSquare, 
  FileText, 
  Users, 
  CreditCard, 
  ChevronRight, 
  Send, 
  Bot, 
  User,
  AlertCircle,
  Clock,
  CheckCircle2,
  BookOpen,
  Upload,
  FileIcon
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import Markdown from "react-markdown";

interface Message {
  role: "user" | "bot";
  content: string;
}

export default function App() {
  const [activeTab, setActiveTab] = useState<"arbitrate" | "records">("arbitrate");
  const [messages, setMessages] = useState<Message[]>([
    { 
      role: "bot", 
      content: "Hujambo! Mimi ni Msuluhishi. I am here to assist the Treasurer of Umoja Chama with dispute resolutions. How can I help today?" 
    }
  ]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [files, setFiles] = useState<string[]>([]);
  const [ledger, setLedger] = useState<any[]>([]);
  const [disputes, setDisputes] = useState<any[]>([]);
  const [stats, setStats] = useState({ members: "0", funds: "KES 0K", activeLoans: "0" });
  const [isUploading, setIsUploading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetchStats();
  }, []);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const fetchStats = async () => {
    try {
      const res = await fetch("/api/stats");
      const data = await res.json();
      if (data.members !== undefined) setStats(data);
    } catch (err) {
      console.error("Failed to fetch stats", err);
    }
  };

  const fetchLedger = async () => {
    try {
      const res = await fetch("/api/ledger");
      const data = await res.json();
      if (data.ledger) setLedger(data.ledger);
    } catch (err) {
      console.error("Failed to fetch ledger", err);
    }
  };

  const fetchDisputes = async () => {
    try {
      const res = await fetch("/api/disputes");
      const data = await res.json();
      if (data.disputes) setDisputes(data.disputes);
    } catch (err) {
      console.error("Failed to fetch disputes", err);
    }
  };

  const fetchFiles = async () => {
    try {
      const res = await fetch("/api/files");
      const data = await res.json();
      if (data.files) setFiles(data.files);
    } catch (err) {
      console.error("Failed to fetch files", err);
    }
  };

  useEffect(() => {
    if (activeTab === "records") {
      fetchFiles();
      fetchLedger();
      fetchDisputes();
    }
  }, [activeTab]);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return;
    
    setIsUploading(true);
    const formData = new FormData();
    for (let i = 0; i < e.target.files.length; i++) {
      formData.append("files", e.target.files[i]);
    }

    try {
      const res = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });
      if (res.ok) {
        fetchFiles();
      }
    } catch (err) {
      console.error("Upload failed", err);
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const handleSend = async (msgOverride?: string) => {
    const messageContent = msgOverride || input;
    if (!messageContent.trim() || isLoading) return;

    setMessages(prev => [...prev, { role: "user", content: messageContent }]);
    setInput("");
    setIsLoading(true);

    try {
      const response = await fetch("/api/resolve", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ dispute: messageContent, stream: true }),
      });

      if (!response.ok) throw new Error("Failed to connect to arbitrator");

      const reader = response.body?.getReader();
      const decoder = new TextDecoder();
      let botMessage = "";
      let buffer = "";
      
      // Add initial empty bot message
      setMessages(prev => [...prev, { role: "bot", content: "" }]);

      while (true) {
        const { done, value } = await reader!.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n");
        buffer = lines.pop() || ""; // Keep the partial line in buffer

        for (const line of lines) {
          const trimmedLine = line.trim();
          if (!trimmedLine || !trimmedLine.startsWith("data: ")) continue;
          
          const dataStr = trimmedLine.slice(6);
          if (dataStr === "[DONE]") continue;

          try {
            const data = JSON.parse(dataStr);
            if (data.text) {
              botMessage += data.text;
              setMessages(prev => {
                const newMessages = [...prev];
                newMessages[newMessages.length - 1].content = botMessage;
                return newMessages;
              });
            } else if (data.error) {
              throw new Error(data.error);
            }
          } catch (e) {
            console.error("Error parsing stream chunk", e, dataStr);
          }
        }
      }
    } catch (err: any) {
      setMessages(prev => [...prev, { role: "bot", content: "Samahani, technical error occurred: " + err.message }]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans flex flex-col md:flex-row">
      {/* Sidebar */}
      <aside className="w-full md:w-64 bg-slate-900 text-white p-6 flex flex-col border-r border-slate-800">
        <div className="flex items-center gap-3 mb-8">
          <div className="bg-emerald-600 w-10 h-10 rounded-xl flex items-center justify-center font-bold text-xl shadow-lg shadow-emerald-900/20">
            M
          </div>
          <div>
            <h1 className="font-bold text-lg tracking-tight">Msuluhishi</h1>
            <p className="text-[10px] text-emerald-500 uppercase tracking-widest font-bold">AI Arbitrator</p>
          </div>
        </div>

        <nav className="space-y-1.5 flex-1">
          <button 
            onClick={() => setActiveTab("arbitrate")}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-2xl transition-all ${activeTab === 'arbitrate' ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-900/20' : 'hover:bg-white/5 text-slate-400'}`}
          >
            <MessageSquare size={18} />
            <span className="font-medium">Arbitration</span>
          </button>
          <button 
            onClick={() => setActiveTab("records")}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-2xl transition-all ${activeTab === 'records' ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-900/20' : 'hover:bg-white/5 text-slate-400'}`}
          >
            <BookOpen size={18} />
            <span className="font-medium">Chama Records</span>
          </button>
        </nav>

        <div className="mt-auto pt-6 border-t border-slate-800">
          <p className="text-[9px] uppercase tracking-widest text-slate-500 font-bold mb-2">Chama Registration</p>
          <div className="bg-slate-950 px-3 py-2 rounded-lg border border-slate-800">
            <p className="text-[10px] text-emerald-500 font-mono">CHAMA/NRB/2021/0847</p>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col h-screen overflow-hidden">
        {activeTab === "arbitrate" ? (
          <div className="flex-1 flex flex-col h-full bg-slate-950">
            {/* Chat Header */}
            <header className="bg-slate-900/50 backdrop-blur-md px-8 py-5 border-b border-slate-800 flex items-center justify-between">
              <div>
                <h2 className="text-lg font-bold tracking-tight text-white flex items-center gap-2">
                  Dispute Resolver
                  <span className="text-[9px] px-2 py-0.5 rounded bg-emerald-900/30 text-emerald-400 border border-emerald-800/50 font-bold uppercase tracking-wider">Session Active</span>
                </h2>
                <p className="text-xs text-slate-500 font-medium">Umoja Chama Advisory • Article 9.3</p>
              </div>
              <div className="flex -space-x-2">
                {[1, 2, 3].map(i => (
                  <div key={i} className="w-8 h-8 rounded-full border-2 border-slate-900 bg-slate-800 flex items-center justify-center text-[10px] font-bold text-slate-400">
                    U{i}
                  </div>
                ))}
                <div className="w-8 h-8 rounded-full border-2 border-slate-900 bg-slate-800 flex items-center justify-center text-[10px] font-bold text-emerald-500">
                  +15
                </div>
              </div>
            </header>

            {/* Messages Area */}
            <div 
              ref={scrollRef}
              className="flex-1 overflow-y-auto p-8 space-y-6 scroll-smooth"
            >
              <AnimatePresence initial={false}>
                {messages.map((msg, idx) => (
                  <motion.div
                    key={idx}
                    initial={{ opacity: 0, scale: 0.98 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                  >
                    <div className={`max-w-[85%] flex gap-4 ${msg.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}>
                      <div className={`w-10 h-10 rounded-2xl flex items-center justify-center shrink-0 border ${msg.role === 'user' ? 'bg-emerald-600 border-emerald-500 text-white shadow-lg shadow-emerald-900/20' : 'bg-slate-900 border-slate-800 text-emerald-400 shadow-sm'}`}>
                        {msg.role === 'user' ? <User size={20} /> : <Bot size={20} />}
                      </div>
                      <div className={`p-5 rounded-3xl border shadow-xl ${
                        msg.role === 'user' 
                          ? 'bg-emerald-600 text-white border-emerald-500 rounded-tr-none' 
                          : msg.content.includes("### Advisory Ruling") || msg.content.includes("**Final Verdict:**")
                            ? "bg-slate-900 border-2 border-emerald-500/20 text-slate-100 rounded-tl-none shadow-[0_0_20px_rgba(16,185,129,0.05)] relative overflow-hidden"
                            : 'bg-slate-900 border-slate-800 text-slate-100 rounded-tl-none'
                      }`}>
                        {msg.role === "bot" && (msg.content.includes("### Advisory Ruling") || msg.content.includes("**Final Verdict:**")) && (
                          <div className="flex items-center gap-3 mb-5 pb-5 border-b border-white/5">
                            <div className="w-10 h-10 rounded-xl bg-emerald-600/10 text-emerald-500 flex items-center justify-center border border-emerald-500/20">
                              <Scale size={20} />
                            </div>
                            <div>
                              <p className="text-[10px] font-bold text-emerald-400 uppercase tracking-widest leading-tight">Official Advisory</p>
                              <p className="text-sm font-bold text-white tracking-tight">AI Arbitration Verdict</p>
                            </div>
                          </div>
                        )}
                        <div className="markdown-body text-sm leading-relaxed max-w-none">
                          <Markdown>{msg.content}</Markdown>
                        </div>
                        {msg.role === "bot" && (msg.content.includes("### Advisory Ruling") || msg.content.includes("**Final Verdict:**")) && (
                          <div className="mt-8 pt-4 border-t border-white/5 flex items-center justify-between">
                            <p className="text-[9px] text-slate-600 font-bold uppercase tracking-widest">Digital Certificate: MS-24.1-Umoja</p>
                            <div className="flex items-center gap-1.5 grayscale opacity-50">
                              <CheckCircle2 size={12} className="text-emerald-500" />
                              <span className="text-[9px] text-slate-500 font-bold uppercase italic">Bylaw Verified</span>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
              {isLoading && (
                <div className="flex justify-start">
                  <div className="flex gap-4">
                    <div className="w-10 h-10 rounded-2xl flex items-center justify-center bg-slate-900 border border-slate-800 text-emerald-400">
                      <Bot size={20} className="animate-pulse" />
                    </div>
                    <div className="bg-slate-900 p-4 rounded-3xl rounded-tl-none border border-slate-800 shadow-sm flex gap-1.5 items-center">
                      <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-bounce [animation-delay:-0.3s]"></span>
                      <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-bounce [animation-delay:-0.15s]"></span>
                      <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-bounce"></span>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Input Area */}
            <div className="p-8 bg-slate-950 border-t border-slate-900">
              <div className="relative max-w-4xl mx-auto flex gap-4">
                <input
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                  placeholder="Describe a dispute (e.g., Member UMOJA009 late fee...)"
                  className="flex-1 bg-slate-900 border border-slate-800 rounded-2xl px-6 py-4 focus:outline-none focus:ring-2 focus:ring-emerald-600/30 text-white placeholder-slate-500 transition-all shadow-inner"
                />
                <button 
                  onClick={() => handleSend()}
                  disabled={!input.trim() || isLoading}
                  className="bg-emerald-600 text-white p-4 rounded-2xl hover:bg-emerald-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg shadow-emerald-900/20 active:scale-95"
                >
                  <Send size={24} />
                </button>
              </div>
              <div className="flex justify-center items-center gap-4 mt-6">
                <p className="text-[9px] text-slate-500 font-bold uppercase tracking-[0.2em] flex items-center gap-2">
                  <span className="w-1 h-1 bg-emerald-500 rounded-full"></span>
                  Engine v2.4.1 
                  <span className="w-1 h-1 bg-emerald-500 rounded-full"></span>
                  Confidential Advisory System
                </p>
              </div>
            </div>
          </div>
        ) : (
          <div className="flex-1 overflow-y-auto p-12 bg-slate-950">
            <div className="max-w-7xl mx-auto space-y-8">
              <header className="flex justify-between items-end border-b border-slate-900 pb-8">
                <div>
                  <h2 className="text-5xl font-bold tracking-tight text-white mb-2">Chama Hub</h2>
                  <p className="text-slate-500 font-medium">Real-time Umoja administration & financial oversight.</p>
                </div>
                <div className="text-right">
                  <p className="text-xs text-slate-500 uppercase tracking-widest font-bold">Last Updated</p>
                  <p className="text-sm font-mono text-emerald-500">2024-05-16 10:10</p>
                </div>
              </header>

              <div className="grid grid-cols-12 gap-8">
                {/* Stats row */}
                <div className="col-span-12 md:col-span-8 grid grid-cols-3 gap-6">
                  {[
                    { label: "Members", value: stats.members, color: "text-emerald-400" },
                    { label: "Funds", value: stats.funds, color: "text-white" },
                    { label: "Active Loans", value: stats.activeLoans, color: "text-amber-400" }
                  ].map((stat, i) => (
                    <div key={i} className="bg-slate-900 p-6 rounded-3xl border border-slate-800 shadow-sm hover:border-slate-700 transition-all group">
                      <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mb-1">{stat.label}</p>
                      <p className={`text-3xl font-bold ${stat.color} group-hover:scale-105 transition-transform origin-left`}>{stat.value}</p>
                    </div>
                  ))}
                </div>

                <div className="col-span-12 md:col-span-4 bg-emerald-600 rounded-3xl p-6 text-white flex flex-col justify-between shadow-xl shadow-emerald-900/20">
                  <div>
                    <h3 className="font-bold text-emerald-950 uppercase text-xs tracking-widest mb-1">Financial Health</h3>
                    <p className="text-2xl font-bold">Solid Standing</p>
                  </div>
                  <div className="flex justify-between items-center mt-4">
                    <p className="text-sm font-medium">94% Contribution Rate</p>
                    <CheckCircle2 size={24} className="text-emerald-950" />
                  </div>
                </div>

                {/* Main Content Column */}
                <div className="col-span-12 md:col-span-9 space-y-8">
                  {/* Active Disputes Section (Action Queue) */}
                  <div className="bg-slate-900 border-2 border-emerald-500/10 rounded-[2rem] overflow-hidden shadow-2xl">
                    <div className="px-8 py-6 border-b border-slate-800 flex items-center justify-between bg-emerald-500/[0.02]">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-500 flex items-center justify-center border border-emerald-500/20">
                          <AlertCircle size={20} />
                        </div>
                        <div>
                          <h3 className="text-xl font-bold text-white tracking-tight">Active Cases</h3>
                          <p className="text-xs text-slate-500 font-medium">Require immediate arbitration</p>
                        </div>
                      </div>
                      <div className="px-4 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-[10px] font-bold text-emerald-400 uppercase tracking-widest animate-pulse">
                        {disputes.filter(d => d.status.includes('PENDING')).length} Pending
                      </div>
                    </div>
                    <div className="p-4 grid grid-cols-1 md:grid-cols-2 gap-4">
                      {disputes.filter(d => d.status.includes('PENDING')).map((d, i) => (
                        <div key={i} className="bg-slate-950 border border-slate-800 p-6 rounded-3xl group hover:border-emerald-500/30 transition-all">
                          <div className="flex justify-between items-start mb-4">
                            <div>
                              <p className="text-[10px] font-mono text-emerald-500 mb-1">{d.id}</p>
                              <h4 className="font-bold text-white text-base leading-tight group-hover:text-emerald-400 transition-colors">{d.category}</h4>
                            </div>
                            <span className="text-[10px] text-slate-600 font-bold uppercase">{d.date}</span>
                          </div>
                          <p className="text-sm text-slate-400 font-medium mb-6 line-clamp-2">{d.member} vs Chama</p>
                          <button 
                            onClick={() => {
                              setActiveTab("arbitrate");
                              handleSend(`Resolve the following active dispute for ${d.member}: ${d.category}. Check the bylaws and ledger records.`);
                            }}
                            className="w-full py-3 bg-emerald-600 hover:bg-emerald-500 text-white rounded-2xl text-xs font-bold transition-all flex items-center justify-center gap-2 shadow-lg shadow-emerald-900/20"
                          >
                            <Scale size={14} />
                            Resolve with Msuluhishi
                          </button>
                        </div>
                      ))}
                      {disputes.filter(d => d.status.includes('PENDING')).length === 0 && (
                        <div className="col-span-full py-12 text-center">
                          <CheckCircle2 size={32} className="mx-auto text-slate-800 mb-3" />
                          <p className="text-slate-600 font-medium text-sm">All clear! No active disputes found.</p>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Member Ledger */}
                  <div className="bg-slate-900 rounded-[2rem] border border-slate-800 shadow-sm overflow-hidden flex flex-col">
                    <div className="p-8 border-b border-slate-800 flex items-center justify-between bg-white/[0.01]">
                      <div className="flex items-center gap-3">
                        <div className="bg-emerald-600/10 p-2 rounded-lg border border-emerald-500/20 text-emerald-500">
                          <FileText size={20} />
                        </div>
                        <h3 className="font-bold text-white text-xl">Member Ledger</h3>
                      </div>
                      <button className="text-xs font-bold text-emerald-500 px-4 py-2 bg-emerald-500/5 rounded-xl border border-emerald-500/10 hover:bg-emerald-500/10 transition-all">Export Report</button>
                    </div>
                    <div className="overflow-x-auto max-h-[500px] overflow-y-auto custom-scrollbar">
                      <table className="w-full text-left">
                        <thead className="sticky top-0 bg-slate-900 z-20">
                          <tr className="bg-slate-950/50">
                            <th className="px-8 py-5 text-[10px] font-bold text-slate-500 uppercase tracking-widest border-b border-slate-800">Identifier</th>
                            <th className="px-8 py-5 text-[10px] font-bold text-slate-500 uppercase tracking-widest border-b border-slate-800">Member Name</th>
                            <th className="px-8 py-5 text-[10px] font-bold text-slate-500 uppercase tracking-widest border-b border-slate-800">Standing</th>
                            <th className="px-8 py-5 text-[10px] font-bold text-slate-500 uppercase tracking-widest border-b border-slate-800">Status</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-800">
                          {ledger.map((member, i) => (
                            <tr key={i} className="hover:bg-white/[0.02] transition-colors group">
                              <td className="px-8 py-6">
                                <span className="font-mono text-xs text-emerald-500 bg-emerald-500/5 px-2 py-1 rounded-md border border-emerald-500/10">
                                  {member.id}
                                </span>
                              </td>
                              <td className="px-8 py-6 font-bold text-white">{member.name}</td>
                              <td className="px-8 py-6">
                                <div className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-bold border ${member.standing === 'GOOD' ? 'bg-emerald-500/5 text-emerald-400 border-emerald-500/20' : 'bg-rose-500/5 text-rose-400 border-rose-500/20'}`}>
                                  <span className={`w-1 h-1 rounded-full ${member.standing === 'GOOD' ? 'bg-emerald-400' : 'bg-rose-400'}`}></span>
                                  {member.standing}
                                </div>
                              </td>
                              <td className="px-8 py-6">
                                <div className="flex items-center gap-3">
                                  <div className={`w-2 h-2 rounded-full ${member.status === 'PAID' ? 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]' : 'bg-rose-500 shadow-[0_0_8px_rgba(244,63,94,0.5)]'}`}></div>
                                  <span className={`text-sm font-medium ${member.status === 'PAID' ? 'text-slate-300' : 'text-rose-400'}`}>{member.status}</span>
                                </div>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>

                  {/* Resolution Archive */}
                  <div className="bg-slate-900 border border-slate-800 rounded-3xl overflow-hidden shadow-xl">
                    <div className="px-8 py-6 border-b border-slate-800 flex items-center justify-between bg-white/[0.01]">
                      <div>
                        <h3 className="text-lg font-bold text-white tracking-tight">Resolution Archive</h3>
                        <p className="text-xs text-slate-500 font-medium">Bylaw precedents and past rulings</p>
                      </div>
                      <div className="px-3 py-1 rounded-full bg-slate-950 border border-slate-800 text-[10px] font-bold text-slate-500 uppercase tracking-widest">
                        {disputes.filter(d => !d.status.includes('PENDING')).length} Closed
                      </div>
                    </div>
                    <div className="overflow-x-auto max-h-[400px] overflow-y-auto custom-scrollbar">
                      <table className="w-full text-left">
                        <thead className="sticky top-0 bg-slate-900 border-b border-slate-800 z-10">
                          <tr className="bg-slate-950/50">
                            <th className="px-8 py-4 text-[10px] font-bold text-slate-500 uppercase tracking-widest">Case ID</th>
                            <th className="px-8 py-4 text-[10px] font-bold text-slate-500 uppercase tracking-widest">Member</th>
                            <th className="px-8 py-4 text-[10px] font-bold text-slate-500 uppercase tracking-widest">Category</th>
                            <th className="px-8 py-4 text-[10px] font-bold text-slate-500 uppercase tracking-widest">Verdict</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-800">
                          {disputes.filter(d => !d.status.includes('PENDING')).map((d, i) => (
                            <tr key={i} className="hover:bg-white/[0.02] transition-colors group">
                              <td className="px-8 py-6">
                                <p className="text-xs font-mono text-emerald-500">{d.id}</p>
                                <p className="text-[10px] text-slate-600 font-bold">{d.date}</p>
                              </td>
                              <td className="px-8 py-6 font-bold text-white text-sm">{d.member}</td>
                              <td className="px-8 py-6">
                                <span className="text-xs text-slate-400">{d.category}</span>
                              </td>
                              <td className="px-8 py-6">
                                <div className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-[10px] font-bold border ${d.status.includes('MEMBER') ? 'bg-emerald-500/5 text-emerald-400 border-emerald-500/20' : d.status.includes('CHAMA') ? 'bg-rose-500/5 text-rose-400 border-rose-500/20' : 'bg-amber-500/5 text-amber-400 border-amber-500/20'}`}>
                                  {d.status.includes('MEMBER') ? <CheckCircle2 size={12} /> : d.status.includes('CHAMA') ? <AlertCircle size={12} /> : <Clock size={12} />}
                                  {d.status}
                                </div>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>

                {/* Sidebar Column */}
                <div className="col-span-12 md:col-span-3 space-y-6">
                    <div className="flex items-center justify-between">
                      <h4 className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Knowledge Base</h4>
                      <button 
                        onClick={() => fileInputRef.current?.click()}
                        disabled={isUploading}
                        className="bg-emerald-600/10 text-emerald-500 hover:bg-emerald-600/20 p-2 rounded-lg border border-emerald-500/20 transition-all disabled:opacity-50"
                        title="Upload Document"
                      >
                        <Upload size={16} className={isUploading ? "animate-bounce" : ""} />
                      </button>
                      <input 
                        type="file" 
                        ref={fileInputRef} 
                        onChange={handleFileUpload} 
                        multiple 
                        className="hidden" 
                        accept=".md,.csv,.txt"
                      />
                    </div>
                    <div className="space-y-2 max-h-[300px] overflow-y-auto pr-1 custom-scrollbar">
                      {files.map((file, i) => (
                        <div key={i} className="group w-full text-left p-3 rounded-2xl bg-white/5 border border-white/5 hover:border-emerald-500/20 hover:bg-emerald-500/5 transition-all flex items-center gap-3">
                          <div className="w-8 h-8 rounded-lg bg-slate-950 flex items-center justify-center text-slate-500 group-hover:text-emerald-500 transition-colors">
                            <FileIcon size={14} />
                          </div>
                          <div className="overflow-hidden">
                            <p className="text-xs font-medium text-slate-300 truncate group-hover:text-white transition-colors">{file}</p>
                            <p className="text-[9px] text-slate-600 font-bold uppercase tracking-wider">{file.split('.').pop()} document</p>
                          </div>
                        </div>
                      ))}
                      {files.length === 0 && <p className="text-[10px] text-slate-600 text-center py-4 italic">No documents found.</p>}
                    </div>
                  
                    <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 mt-6">
                      <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-3">System Identity</p>
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-emerald-600/20 text-emerald-500 flex items-center justify-center border border-emerald-500/20">
                          <Scale size={20} />
                        </div>
                        <div className="overflow-hidden">
                          <p className="text-xs font-bold text-white truncate">Msuluhishi v2.4.1</p>
                          <p className="text-[10px] text-slate-500 font-mono">ID: 847-AI-UMOJA</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

              <footer className="pt-8 border-t border-slate-900 flex justify-between items-center text-[10px] text-slate-600 uppercase tracking-widest font-bold">
                <p>© 2024 Umoja Technology Solutions • Nairobi, Kenya</p>
                <div className="flex gap-4">
                  <span className="flex items-center gap-1.5"><span className="w-1 h-1 bg-emerald-500 rounded-full animate-pulse"></span>Secure</span>
                  <span>Legal Database Last Sync: 2H Ago</span>
                </div>
              </footer>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

