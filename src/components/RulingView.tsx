import React from 'react';
import { Gavel, CheckCircle, AlertCircle, Quote, MoveRight, ShieldCheck } from 'lucide-react';
import { motion } from 'motion/react';
import { Ruling } from '../types';

interface RulingViewProps {
  ruling: Ruling;
}

export const RulingView: React.FC<RulingViewProps> = ({ ruling }) => {
  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6"
    >
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        {/* Header */}
        <div className="bg-chama-primary p-6 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Gavel size={28} className="text-chama-secondary" />
            <div>
              <h3 className="text-xl font-bold">Official Arbitration Ruling</h3>
              <p className="text-sm opacity-80">ChamaDisputes Evidence-Based Decision</p>
            </div>
          </div>
          <div className="bg-white/10 px-3 py-1 rounded-full text-xs font-mono border border-white/20">
            Case ID: #{Math.floor(Math.random() * 9000) + 1000}
          </div>
        </div>

        <div className="p-8 space-y-8">
          {/* Summary Section */}
          <section className="relative">
            <Quote className="absolute -top-4 -left-4 text-gray-100" size={64} />
            <div className="relative z-10">
              <h4 className="text-xs uppercase tracking-widest text-chama-accent font-bold mb-2">Case Summary</h4>
              <p className="text-lg italic text-gray-700 leading-relaxed">
                "{ruling.caseSummary}"
              </p>
            </div>
          </section>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 border-t border-gray-100 pt-8">
            {/* Bylaws */}
            <section>
              <div className="flex items-center gap-2 mb-4">
                <ShieldCheck size={20} className="text-chama-primary" />
                <h4 className="font-bold text-gray-800">Relevant Bylaws</h4>
              </div>
              <ul className="space-y-3">
                {ruling.relevantBylaws.map((law, idx) => (
                  <li key={idx} className="bg-gray-50 p-4 rounded-xl border-l-4 border-chama-primary text-sm text-gray-600">
                    {law}
                  </li>
                ))}
              </ul>
            </section>

            {/* Evidence Analysis */}
            <section>
              <div className="flex items-center gap-2 mb-4">
                <AlertCircle size={20} className="text-chama-accent" />
                <h4 className="font-bold text-gray-800">Evidence Analysis</h4>
              </div>
              <div className="bg-amber-50/30 p-4 rounded-xl border border-amber-100 text-sm text-gray-700 leading-relaxed">
                {ruling.evidenceAnalysis}
              </div>
            </section>
          </div>

          <div className="bg-chama-primary/5 p-8 rounded-3xl border border-chama-primary/10">
            <div className="flex items-center gap-3 mb-4">
              <CheckCircle size={24} className="text-chama-primary" />
              <h4 className="text-xl font-bold text-chama-primary">Final Ruling</h4>
            </div>
            <p className="text-lg font-medium text-gray-800 mb-6">
              {ruling.ruling}
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100">
                <div className="flex items-center gap-2 mb-2 text-chama-primary">
                  <MoveRight size={16} />
                  <span className="text-xs font-bold uppercase tracking-wider">Recommended Action</span>
                </div>
                <p className="text-sm text-gray-600">{ruling.recommendedAction}</p>
              </div>
              <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100">
                <div className="flex items-center gap-2 mb-2 text-chama-accent">
                  <ShieldCheck size={16} />
                  <span className="text-xs font-bold uppercase tracking-wider">Preventive Measure</span>
                </div>
                <p className="text-sm text-gray-600">{ruling.preventiveMeasure}</p>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-gray-50 p-6 border-t border-gray-100 flex items-center justify-between">
          <p className="text-xs text-gray-400 italic">
            "Haki kwa Wote, Amani kwa Chama" — ChamaDisputes AI Arbitrator
          </p>
          <div className="flex gap-2">
            <button className="px-4 py-2 border border-gray-200 rounded-lg text-sm font-medium hover:bg-gray-100 transition-colors">
              Download PDF
            </button>
            <button className="px-4 py-2 bg-chama-primary text-white rounded-lg text-sm font-medium hover:bg-opacity-90 transition-all">
              Share to WhatsApp
            </button>
          </div>
        </div>
      </div>
    </motion.div>
  );
};
