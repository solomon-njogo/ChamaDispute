import React, { useState, useEffect } from 'react';
import { Plus, X, FileText, Trash2 } from 'lucide-react';
import { ChamaBylaws } from '../types';
import { chamaService } from '../services/chamaService';

interface BylawsManagerProps {
  bylaws: ChamaBylaws[];
  onRefresh: () => void;
}

export const BylawsManager: React.FC<BylawsManagerProps> = ({ bylaws, onRefresh }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [name, setName] = useState('Chama Constitution 2024');
  const [articles, setArticles] = useState<Partial<ChamaBylaws>[]>(
    bylaws.length > 0 ? bylaws : [{ id: '1', name: '', content: '' }]
  );

  useEffect(() => {
    if (bylaws.length > 0) setArticles(bylaws);
  }, [bylaws]);

  const handleAddArticle = () => {
    setArticles([...articles, { id: Date.now().toString(), name: '', content: '' }]);
  };

  const handleRemoveArticle = (index: number) => {
    setArticles(articles.filter((_, i) => i !== index));
  };

  const handleUpdateArticle = (index: number, field: keyof ChamaBylaws, value: string) => {
    const newArticles = [...articles];
    newArticles[index] = { ...newArticles[index], [field]: value };
    setArticles(newArticles);
  };

  const handleSave = async () => {
    const validArticles = articles.filter(a => a.name && a.content) as ChamaBylaws[];
    await chamaService.saveBylaws(validArticles);
    onRefresh();
    setIsOpen(false);
  };

  return (
    <div className="mb-8">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-chama-primary/10 rounded-full text-chama-primary">
            <FileText size={24} />
          </div>
          <div>
            <h2 className="text-xl font-bold text-chama-primary">Chama Bylaws (RAG Enabled)</h2>
            <p className="text-sm text-gray-500">
              {bylaws.length > 0 ? `${bylaws.length} Articles defined` : 'No constitution uploaded yet'}
            </p>
          </div>
        </div>
        <button
          onClick={() => setIsOpen(true)}
          className="px-4 py-2 bg-chama-primary text-white rounded-lg font-medium hover:bg-opacity-90 transition-all flex items-center gap-2"
        >
          <Plus size={18} />
          {bylaws.length > 0 ? 'Edit Bylaws' : 'Setup Constitution'}
        </button>
      </div>

      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
          <div className="bg-white rounded-2xl w-full max-w-4xl max-h-[90vh] shadow-2xl overflow-hidden flex flex-col">
            <div className="p-6 border-b border-gray-100 flex items-center justify-between bg-chama-primary text-white">
              <h3 className="text-lg font-bold">Configure Chama Articles</h3>
              <button 
                onClick={() => setIsOpen(false)}
                className="p-1 hover:bg-white/10 rounded-full transition-colors"
              >
                <X size={20} />
              </button>
            </div>
            
            <div className="p-6 space-y-6 overflow-y-auto flex-1">
              {articles.map((article, idx) => (
                <div key={idx} className="p-4 bg-gray-50 rounded-2xl border border-gray-100 space-y-3 relative group">
                  <button 
                    onClick={() => handleRemoveArticle(idx)}
                    className="absolute top-2 right-2 p-2 text-red-400 hover:text-red-600 opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <Trash2 size={16} />
                  </button>
                  <div className="grid grid-cols-4 gap-4">
                    <div className="col-span-1">
                      <label className="block text-xs font-bold text-gray-400 uppercase mb-1">Article ID/No</label>
                      <input
                        type="text"
                        value={article.name}
                        onChange={(e) => handleUpdateArticle(idx, 'name', e.target.value)}
                        className="w-full px-4 py-2 rounded-lg border border-gray-200 bg-white"
                        placeholder="e.g. Article 5.2"
                      />
                    </div>
                    <div className="col-span-3">
                      <label className="block text-xs font-bold text-gray-400 uppercase mb-1">Rule Content</label>
                      <textarea
                        value={article.content}
                        onChange={(e) => handleUpdateArticle(idx, 'content', e.target.value)}
                        className="w-full h-24 px-4 py-2 rounded-lg border border-gray-200 bg-white resize-none"
                        placeholder="Paste the specific rule text here..."
                      />
                    </div>
                  </div>
                </div>
              ))}
              
              <button 
                onClick={handleAddArticle}
                className="w-full py-4 border-2 border-dashed border-gray-200 rounded-2xl text-gray-400 font-bold hover:border-chama-primary hover:text-chama-primary transition-all flex items-center justify-center gap-2"
              >
                <Plus size={20} />
                Add Another Article
              </button>
            </div>

            <div className="p-6 bg-gray-50 border-t border-gray-100 flex justify-end gap-3">
              <button
                onClick={() => setIsOpen(false)}
                className="px-6 py-2 text-gray-600 font-medium hover:bg-gray-100 rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                className="px-6 py-2 bg-chama-primary text-white font-bold rounded-lg hover:shadow-lg transition-all"
              >
                Save All Bylaws
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
