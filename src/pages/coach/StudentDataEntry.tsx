import React, { useState, useEffect } from 'react';
import { useStudent } from '../../lib/StudentContext';
import { studentDataService } from '../../services/studentDataService';
import { CURRICULUM } from '../../constants/curriculum';
import { 
  ClipboardCheck, 
  BookOpen, 
  Trophy, 
  Save,
  Plus,
  Trash2,
  TrendingUp,
  AlertCircle,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Youtube,
  FileText
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

import { BRANCH_CONFIG } from '../../constants/branchConfig';

export default function StudentDataEntry() {
  const { selectedStudent } = useStudent();
  const [loading, setLoading] = useState(false);
  const [expandedBook, setExpandedBook] = useState<string | null>(null);

  // Book Tracking State
  const [books, setBooks] = useState<any[]>([]);
  const [globalBooks, setGlobalBooks] = useState<any[]>([]);
  const [newBook, setNewBook] = useState({ resourceType: 'soru', type: 'TYT', subject: 'Türkçe', name: '', globalBookId: '' });
  const [isManualEntry, setIsManualEntry] = useState(false);

  useEffect(() => {
    if (selectedStudent) {
      studentDataService.getBookTracking(selectedStudent.uid).then(setBooks);
      studentDataService.getGlobalBooks().then(setGlobalBooks);
    }
  }, [selectedStudent]);

  const branchMap: Record<string, keyof typeof BRANCH_CONFIG> = {
    'SAYISAL': 'SAY',
    'EŞİT AĞIRLIK': 'EA',
    'SÖZEL': 'SÖZ',
    'DİL': 'DİL'
  };
  const activeBranchKey = selectedStudent?.branch ? (branchMap[selectedStudent.branch as string] || 'TYT') : 'TYT';
  const currentBranchInfo = BRANCH_CONFIG[activeBranchKey];
  const subjectOptions = newBook.type === 'TYT' 
    ? BRANCH_CONFIG['TYT'].subjects 
    : newBook.type === '10. Sınıf' ? BRANCH_CONFIG['10. Sınıf'].subjects 
    : currentBranchInfo.aytSubjects;

  // Auto-select first subject when type changes to prevent invalid subject selection
  useEffect(() => {
    if (subjectOptions.length > 0 && !subjectOptions.includes(newBook.subject)) {
      setNewBook(prev => ({ ...prev, subject: subjectOptions[0] }));
    }
  }, [newBook.type, subjectOptions]);

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
    
    const updated = await studentDataService.getBookTracking(selectedStudent!.uid);
    setBooks(updated);
  };

  const handleAddBook = async () => {
    if (!newBook.name && !newBook.globalBookId) return;

    let globalId = newBook.globalBookId;
    let finalBookName = newBook.name;

    if (isManualEntry || !globalId) {
      // Check if it already exists globally
      const existingGlobal = globalBooks.find(b => b.name === newBook.name && b.subject === newBook.subject && b.type === newBook.type && (b.resourceType === newBook.resourceType || (!b.resourceType && newBook.resourceType === 'soru')));
      if (existingGlobal) {
        globalId = existingGlobal.id;
        finalBookName = existingGlobal.name;
      } else {
        // Create new global book
        globalId = await studentDataService.saveGlobalBook({
          name: newBook.name,
          subject: newBook.subject,
          type: newBook.type,
          resourceType: newBook.resourceType,
          topicQuestionCounts: {}
        });
      }
    } else {
      const selectedGlobal = globalBooks.find(b => b.id === globalId);
      if (selectedGlobal) {
        finalBookName = selectedGlobal.name;
      }
    }

    await studentDataService.updateBookProgress(null, {
      studentId: selectedStudent!.uid,
      subject: newBook.subject,
      bookName: finalBookName,
      globalBookId: globalId,
      resourceType: newBook.resourceType,
      completedTopics: [],
      completionPercentage: 0
    });
    setNewBook({ resourceType: newBook.resourceType, type: newBook.type, subject: newBook.subject, name: '', globalBookId: '' });
    setIsManualEntry(false);
    
    const [updatedTracking, updatedGlobals] = await Promise.all([
      studentDataService.getBookTracking(selectedStudent!.uid),
      studentDataService.getGlobalBooks()
    ]);
    setBooks(updatedTracking);
    setGlobalBooks(updatedGlobals);
  };

  if (!selectedStudent) return null;

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-20">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold italic text-white uppercase tracking-tight">KAYNAK TAKİBİ</h1>
        <p className="text-slate-500 mt-1">{selectedStudent.displayName} akademik ilerleme ve kaynak bitirme raporu.</p>
      </div>

      <div className="space-y-8">
        {/* Add Book Form */}
        <div className="bg-white/5 border border-white/5 rounded-3xl p-8">
           <h3 className="text-lg font-bold mb-6 italic uppercase tracking-tighter">Yeni Kaynak Ekle</h3>
           
           <div className="mb-6 flex gap-4">
              <label className="flex items-center gap-2 cursor-pointer">
                 <input type="radio" name="rType" value="soru" checked={newBook.resourceType === 'soru'} onChange={() => setNewBook({...newBook, resourceType: 'soru', globalBookId: '', name: ''})} className="text-indigo-500" />
                 <span className="text-sm text-slate-300">Soru Bankası</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                 <input type="radio" name="rType" value="konu" checked={newBook.resourceType === 'konu'} onChange={() => setNewBook({...newBook, resourceType: 'konu', globalBookId: '', name: ''})} className="text-indigo-500" />
                 <span className="text-sm text-slate-300">Konu Çalışması / Fasikül</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                 <input type="radio" name="rType" value="youtube" checked={newBook.resourceType === 'youtube'} onChange={() => setNewBook({...newBook, resourceType: 'youtube', globalBookId: '', name: ''})} className="text-indigo-500" />
                 <span className="text-sm text-slate-300">YouTube Kanalı / Video</span>
              </label>
           </div>

           <div className="grid grid-cols-1 md:grid-cols-5 gap-6 items-end">
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest pl-1">Alan türü</label>
                  <select 
                    value={newBook.type}
                    onChange={(e) => setNewBook({...newBook, type: e.target.value as 'TYT' | 'AYT' | '10. Sınıf'})}
                    className="w-full bg-slate-900 border border-white/10 rounded-xl py-3 px-4 text-xs text-white outline-none"
                  >
                    <option value="TYT">TYT</option>
                    {activeBranchKey !== 'TYT' && <option value="AYT">AYT</option>}
                    <option value="10. Sınıf">10. Sınıf</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest pl-1">Ders</label>
                  <select 
                    value={newBook.subject}
                    onChange={(e) => setNewBook({...newBook, subject: e.target.value})}
                    className="w-full bg-slate-900 border border-white/10 rounded-xl py-3 px-4 text-xs text-white outline-none"
                  >
                    {subjectOptions.map((s: string) => (
                      <option key={s} value={s}>{s}</option>
                    ))}
                  </select>
                </div>
                <div className="md:col-span-2 space-y-2">
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest pl-1">Kaynak Adı</label>
                  {!isManualEntry ? (
                    <select
                      value={newBook.globalBookId}
                      onChange={(e) => {
                        if (e.target.value === 'manual') {
                          setIsManualEntry(true);
                          setNewBook({ ...newBook, globalBookId: '', name: '' });
                        } else {
                          setNewBook({ ...newBook, globalBookId: e.target.value, name: '' });
                        }
                      }}
                      className="w-full bg-slate-900 border border-white/10 rounded-xl py-3 px-4 text-xs text-white outline-none"
                    >
                      <option value="">Seçiniz...</option>
                      {globalBooks.filter(b => b.subject === newBook.subject && b.type === newBook.type && (b.resourceType === newBook.resourceType || (!b.resourceType && newBook.resourceType === 'soru'))).map(b => (
                        <option key={b.id} value={b.id}>{b.name}</option>
                      ))}
                      <option value="manual">+ Yeni Kaynak Ekle (Listede Yok)</option>
                    </select>
                  ) : (
                    <div className="flex gap-2">
                      <input 
                        type="text"
                        placeholder="Örn: 3D Yayınları TYT Matematik"
                        value={newBook.name}
                        onChange={(e) => setNewBook({...newBook, name: e.target.value})}
                        className="w-full bg-slate-900 border border-white/10 rounded-xl py-3 px-4 text-xs text-white outline-none"
                        autoFocus
                      />
                      <button
                        onClick={() => setIsManualEntry(false)}
                        className="bg-white/5 hover:bg-white/10 text-white rounded-xl px-4 text-xs transition-colors"
                      >
                        İptal
                      </button>
                    </div>
                  )}
                </div>
                <button 
                  onClick={handleAddBook}
                  className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-3 px-6 rounded-xl transition-all flex items-center justify-center gap-2"
                >
                  <Plus size={16} /> Kaynak Ekle
                </button>
              </div>
            </div>

            {/* Book List */}
            <div className="grid grid-cols-1 gap-6">
              {books.map((book) => {
                const allTopics = CURRICULUM[book.subject as keyof typeof CURRICULUM] || [];
                const completedCount = (book.completedTopics || []).length;
                
                return (
                  <div key={book.id} className="bg-slate-900/40 border border-white/5 rounded-3xl overflow-hidden group">
                    <div 
                      className="p-6 flex items-center justify-between cursor-pointer hover:bg-white/5 transition-all"
                      onClick={() => setExpandedBook(expandedBook === book.id ? null : book.id)}
                    >
                      <div className="flex items-center gap-6">
                        <div className="bg-indigo-500/10 text-indigo-400 p-3 rounded-2xl flex-shrink-0">
                          {book.resourceType === 'youtube' ? <Youtube size={24} /> : book.resourceType === 'konu' ? <FileText size={24} /> : <BookOpen size={24} />}
                        </div>
                        <div>
                          <div className="flex items-center gap-1.5 flex-wrap">
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
                        <div className="text-right">
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
            </div>
      </div>
    </div>
  );
}
