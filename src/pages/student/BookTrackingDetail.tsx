import React, { useState, useEffect } from 'react';
import { auth } from '../../lib/firebase';
import { studentDataService } from '../../services/studentDataService';
import { CURRICULUM } from '../../constants/curriculum';
import { BookOpen, CheckCircle2, ChevronDown, ChevronUp, Search, Filter, Youtube, FileText } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

export default function BookTrackingDetail() {
  const [books, setBooks] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedBook, setExpandedBook] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterSubject, setFilterSubject] = useState('Hepsi');

  useEffect(() => {
    const user = auth.currentUser;
    if (user) {
      studentDataService.getBookTracking(user.uid).then(data => {
        setBooks(data);
        setLoading(false);
      });
    }
  }, []);

  const toggleTopic = async (book: any, topic: string) => {
    const currentTopics = book.completedTopics || [];
    let updatedTopics;
    if (currentTopics.includes(topic)) {
      updatedTopics = currentTopics.filter((t: string) => t !== topic);
    } else {
      updatedTopics = [...currentTopics, topic];
    }

    const allTopics = CURRICULUM[book.subject as keyof typeof CURRICULUM] || [];
    const percentage = allTopics.length > 0 ? Math.round((updatedTopics.length / allTopics.length) * 100) : 0;

    await studentDataService.updateBookProgress(book.id, {
      ...book,
      completedTopics: updatedTopics,
      completionPercentage: percentage
    });
    
    // Refresh local state
    setBooks(prev => prev.map(b => b.id === book.id ? { ...b, completedTopics: updatedTopics, completionPercentage: percentage } : b));
  };

  const filteredBooks = books.filter(book => {
    const matchesSearch = book.bookName.toLowerCase().includes(searchTerm.toLowerCase()) || 
                         book.subject.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesFilter = filterSubject === 'Hepsi' || book.subject === filterSubject;
    return matchesSearch && matchesFilter;
  });

  const subjects = ['Hepsi', ...new Set(books.map(b => b.subject))];

  if (loading) return <div className="text-center py-20 animate-pulse text-slate-500 italic">Konular Yükleniyor...</div>;

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-20">
      <div>
        <h1 className="text-3xl font-bold italic text-white uppercase tracking-tight">KİTAP VE KONU TAKİBİ</h1>
        <p className="text-slate-500 mt-1">Tüm derslerinizdeki ilerlemenizi buradan detaylı olarak takip edebilirsiniz.</p>
      </div>

      <div className="flex flex-col md:flex-row gap-4 bg-white/5 p-4 rounded-2xl border border-white/5">
        <div className="flex-1 relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
          <input 
            type="text"
            placeholder="Kitap veya ders ara..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-slate-900 border border-white/10 rounded-xl py-3 pl-12 pr-4 text-xs text-white outline-none focus:border-indigo-500/50 transition-all"
          />
        </div>
        <div className="flex items-center gap-2">
          <Filter className="text-slate-500" size={18} />
          <select 
            value={filterSubject}
            onChange={(e) => setFilterSubject(e.target.value)}
            className="bg-slate-900 border border-white/10 rounded-xl py-3 px-4 text-xs text-white outline-none focus:border-indigo-500/50 transition-all"
          >
            {subjects.map(s => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6">
        {filteredBooks.map((book) => {
          const allTopics = CURRICULUM[book.subject as keyof typeof CURRICULUM] || [];
          const completedCount = (book.completedTopics || []).length;
          
          return (
            <div key={book.id} className="bg-slate-900/40 border border-white/5 rounded-3xl overflow-hidden group">
              <div 
                className="p-6 flex items-center justify-between cursor-pointer hover:bg-white/5 transition-all"
                onClick={() => setExpandedBook(expandedBook === book.id ? null : book.id)}
              >
                <div className="flex items-center gap-6">
                  <div className={`flex items-center justify-center p-3 rounded-2xl w-12 h-12 ${book.resourceType === 'youtube' ? 'bg-red-500/10 text-red-500' : book.resourceType === 'konu' ? 'bg-orange-500/10 text-orange-500' : 'bg-indigo-500/10 text-indigo-400'}`}>
                    {book.resourceType === 'youtube' ? <Youtube size={24} /> : book.resourceType === 'konu' ? <FileText size={24} /> : <BookOpen size={24} />}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-black text-emerald-400 uppercase tracking-widest">{book.subject}</span>
                      <span className="text-[10px] font-bold text-slate-600">•</span>
                      <span className={`text-[10px] font-black uppercase tracking-widest px-1.5 py-0.5 rounded ${book.resourceType === 'youtube' ? 'bg-red-500/10 text-red-500' : book.resourceType === 'konu' ? 'bg-orange-500/10 text-orange-500' : 'bg-slate-500/10 text-slate-400'}`}>
                         {book.resourceType === 'youtube' ? 'YOUTUBE' : book.resourceType === 'konu' ? 'KONU' : 'SORU'}
                      </span>
                      <span className="text-[10px] font-bold text-slate-600">•</span>
                      <span className="text-[10px] font-bold text-slate-500 uppercase">{completedCount} / {allTopics.length} Konu</span>
                    </div>
                    <h4 className="text-lg font-bold text-white mt-1 uppercase">{book.bookName}</h4>
                  </div>
                </div>
                
                <div className="flex items-center gap-8">
                  <div className="hidden sm:block text-right">
                    <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">Tamamlanma</p>
                    <div className="flex items-center gap-3">
                      <div className="w-32 h-1.5 bg-white/5 rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-emerald-500 transition-all duration-500"
                          style={{ width: `${book.completionPercentage || 0}%` }}
                        />
                      </div>
                      <span className="text-xl font-black text-white">%{book.completionPercentage || 0}</span>
                    </div>
                  </div>
                  {expandedBook === book.id ? <ChevronUp className="text-slate-500" /> : <ChevronDown className="text-slate-500" />}
                </div>
              </div>

              <AnimatePresence>
                {expandedBook === book.id && (
                  <motion.div 
                    initial={{ height: 0 }}
                    animate={{ height: 'auto' }}
                    exit={{ height: 0 }}
                    className="overflow-hidden bg-black/20"
                  >
                    <div className="p-8 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {allTopics.map((topic: string) => {
                        const isCompleted = (book.completedTopics || []).includes(topic);
                        return (
                          <button
                            key={topic}
                            onClick={() => toggleTopic(book, topic)}
                            className={`
                              flex items-center gap-3 p-4 rounded-2xl border transition-all text-left
                              ${isCompleted 
                                ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400' 
                                : 'bg-white/5 border-white/5 text-slate-500 hover:border-white/20'
                              }
                            `}
                          >
                            <div className={`
                              w-5 h-5 rounded-md border flex items-center justify-center transition-all
                              ${isCompleted ? 'bg-emerald-500 border-emerald-500 text-white' : 'border-white/20'}
                            `}>
                              {isCompleted && <CheckCircle2 size={14} />}
                            </div>
                            <span className="text-xs font-bold leading-tight">{topic}</span>
                          </button>
                        );
                      })}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          );
        })}

        {filteredBooks.length === 0 && (
          <div className="bg-white/5 border border-white/5 border-dashed rounded-3xl p-20 text-center">
            <BookOpen className="mx-auto text-slate-700 mb-4" size={48} />
            <p className="text-slate-500 font-bold italic uppercase tracking-widest text-sm">Takip edilen kitap bulunamadı</p>
          </div>
        )}
      </div>
    </div>
  );
}
