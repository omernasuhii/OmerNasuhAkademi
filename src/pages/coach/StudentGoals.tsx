import React, { useState, useEffect, useMemo } from 'react';
import { useStudent } from '../../lib/StudentContext';
import { studentDataService } from '../../services/studentDataService';
import { 
  Target, 
  Flag, 
  CheckCircle2, 
  Circle, 
  Trophy, 
  Plus, 
  Trash2, 
  BookOpen, 
  Calendar,
  Loader2,
  ChevronLeft,
  ChevronRight,
  Save,
  AlertCircle
} from 'lucide-react';
import { CURRICULUM } from '../../constants/curriculum';

interface TopicGoal {
  subject: string;
  topic: string;
  isCompleted: boolean;
}

interface BookGoal {
  bookId: string;
  bookName: string;
  targetDescription: string;
  progress: number;
  isCompleted: boolean;
}

export default function StudentGoals() {
  const { selectedStudent } = useStudent();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [currentMonth, setCurrentMonth] = useState(() => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
  });

  const [topicGoals, setTopicGoals] = useState<TopicGoal[]>([]);
  const [bookGoals, setBookGoals] = useState<BookGoal[]>([]);
  const [coachNote, setCoachNote] = useState('');
  const [studentBooks, setStudentBooks] = useState<any[]>([]);

  // Form states
  const [newTopicSubject, setNewTopicSubject] = useState('');
  const [newTopicName, setNewTopicName] = useState('');
  const [newBookId, setNewBookId] = useState('');
  const [newBookTarget, setNewBookTarget] = useState('');

  useEffect(() => {
    if (selectedStudent) {
      loadGoals();
      loadStudentBooks();
    }
  }, [selectedStudent, currentMonth]);

  const loadGoals = async () => {
    setLoading(true);
    try {
      const goalData = await studentDataService.getMonthlyGoal(selectedStudent!.uid, currentMonth);
      if (goalData) {
        setTopicGoals(goalData.topicGoals || []);
        setBookGoals(goalData.bookGoals || []);
        setCoachNote(goalData.coachNote || '');
      } else {
        setTopicGoals([]);
        setBookGoals([]);
        setCoachNote('');
      }
    } catch (error) {
      console.error('Error loading goals:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadStudentBooks = async () => {
    try {
      const books = await studentDataService.getBookTracking(selectedStudent!.uid);
      setStudentBooks(books);
    } catch (error) {
      console.error('Error loading books:', error);
    }
  };

  const handleSave = async () => {
    if (!selectedStudent) return;
    setSaving(true);
    try {
      await studentDataService.saveMonthlyGoal({
        studentId: selectedStudent.uid,
        month: currentMonth,
        topicGoals,
        bookGoals,
        coachNote
      });
      alert('Hedefler başarıyla kaydedildi!');
    } catch (error) {
      console.error('Error saving goals:', error);
      alert('Hedefler kaydedilirken bir hata oluştu.');
    } finally {
      setSaving(false);
    }
  };

  const addTopicGoal = () => {
    if (!newTopicSubject || !newTopicName) return;
    if (topicGoals.some(g => g.subject === newTopicSubject && g.topic === newTopicName)) {
      alert('Bu konu zaten hedeflerde var.');
      return;
    }
    setTopicGoals([...topicGoals, { subject: newTopicSubject, topic: newTopicName, isCompleted: false }]);
    setNewTopicName('');
  };

  const addBookGoal = () => {
    if (!newBookId || !newBookTarget) return;
    const book = studentBooks.find(b => b.id === newBookId);
    setBookGoals([...bookGoals, { 
      bookId: newBookId, 
      bookName: book?.bookName || 'Bilinmeyen Kitap', 
      targetDescription: newBookTarget, 
      progress: 0, 
      isCompleted: false 
    }]);
    setNewBookId('');
    setNewBookTarget('');
  };

  const toggleTopic = (index: number) => {
    const newGoals = [...topicGoals];
    newGoals[index].isCompleted = !newGoals[index].isCompleted;
    setTopicGoals(newGoals);
  };

  const removeTopic = (index: number) => {
    setTopicGoals(topicGoals.filter((_, i) => i !== index));
  };

  const removeBook = (index: number) => {
    setBookGoals(bookGoals.filter((_, i) => i !== index));
  };

  const updateBookProgress = (index: number, val: number) => {
    const newGoals = [...bookGoals];
    newGoals[index].progress = Math.min(100, Math.max(0, val));
    newGoals[index].isCompleted = newGoals[index].progress === 100;
    setBookGoals(newGoals);
  };

  const navigateMonth = (direction: number) => {
    const [year, month] = currentMonth.split('-').map(Number);
    const date = new Date(year, month - 1 + direction);
    setCurrentMonth(`${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`);
  };

  const sortedTopicGoals = useMemo(() => {
    return [...topicGoals].sort((a, b) => (a.isCompleted === b.isCompleted ? 0 : a.isCompleted ? 1 : -1));
  }, [topicGoals]);

  const sortedBookGoals = useMemo(() => {
    return [...bookGoals].sort((a, b) => (a.isCompleted === b.isCompleted ? 0 : a.isCompleted ? 1 : -1));
  }, [bookGoals]);

  const monthLabel = useMemo(() => {
    const [year, month] = currentMonth.split('-').map(Number);
    const date = new Date(year, month - 1);
    return date.toLocaleDateString('tr-TR', { month: 'long', year: 'numeric' });
  }, [currentMonth]);

  if (!selectedStudent) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] text-slate-500">
        <AlertCircle size={48} className="mb-4 opacity-20" />
        <p>Lütfen bir öğrenci seçin.</p>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-3xl font-bold italic text-white uppercase tracking-tight">
             AYLIK HEDEFLER & TAKİP
          </h1>
          <p className="text-slate-500 mt-1">{selectedStudent.displayName} için {monthLabel} dönemi planı.</p>
        </div>
        
        <div className="flex items-center gap-4 bg-slate-900/40 p-2 rounded-2xl border border-white/5">
          <button 
            onClick={() => navigateMonth(-1)}
            className="p-2 hover:bg-white/10 rounded-xl transition-all text-slate-400 hover:text-white"
          >
            <ChevronLeft size={20} />
          </button>
          <div className="flex items-center gap-2 px-2 min-w-[140px] justify-center">
            <Calendar size={16} className="text-blue-500" />
            <span className="text-sm font-bold text-white uppercase tracking-wider">{monthLabel}</span>
          </div>
          <button 
            onClick={() => navigateMonth(1)}
            className="p-2 hover:bg-white/10 rounded-xl transition-all text-slate-400 hover:text-white"
          >
            <ChevronRight size={20} />
          </button>
        </div>

        <button 
          onClick={handleSave}
          disabled={saving}
          className="bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white font-bold py-3 px-8 rounded-2xl transition-all flex items-center justify-center gap-2 min-w-[160px] shadow-lg shadow-blue-900/20"
        >
          {saving ? <Loader2 size={18} className="animate-spin" /> : <Save size={18} />}
          {saving ? 'Kaydediliyor...' : 'DEĞİŞİKLİKLERİ KAYDET'}
        </button>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 size={40} className="animate-spin text-blue-500" />
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          
          {/* Section 1: Monthly Topic Goals */}
          <div className="space-y-6">
            <div className="bg-slate-900/40 border border-white/5 rounded-3xl p-8 h-full flex flex-col">
              <div className="flex items-center justify-between mb-8">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-blue-500/10 rounded-lg text-blue-500">
                    <Flag size={20} />
                  </div>
                  <h3 className="text-xl font-bold">Aylık Konu Hedefleri</h3>
                </div>
                <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest bg-white/5 px-2 py-1 rounded">
                   {topicGoals.filter(t => t.isCompleted).length} / {topicGoals.length} TAMAMLANDI
                </span>
              </div>

              {/* Add Topic Form */}
              <div className="bg-white/5 p-4 rounded-2xl border border-white/5 mb-6 space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <select 
                    value={newTopicSubject}
                    onChange={(e) => {
                      setNewTopicSubject(e.target.value);
                      setNewTopicName('');
                    }}
                    className="bg-slate-950 border border-white/10 rounded-xl px-3 py-2 text-xs text-white outline-none focus:border-blue-500/50"
                  >
                    <option value="">Ders Seç...</option>
                    {Object.keys(CURRICULUM).map(s => (
                      <option key={s} value={s}>{s}</option>
                    ))}
                  </select>
                  <select 
                    value={newTopicName}
                    onChange={(e) => setNewTopicName(e.target.value)}
                    disabled={!newTopicSubject}
                    className="bg-slate-950 border border-white/10 rounded-xl px-3 py-2 text-xs text-white outline-none focus:border-blue-500/50 disabled:opacity-30"
                  >
                    <option value="">Konu Seç...</option>
                    {(CURRICULUM[newTopicSubject as keyof typeof CURRICULUM] || []).map((t: string) => (
                      <option key={t} value={t}>{t}</option>
                    ))}
                  </select>
                </div>
                <button 
                  onClick={addTopicGoal}
                  disabled={!newTopicName}
                  className="w-full bg-slate-800 hover:bg-slate-700 disabled:opacity-30 text-white font-bold py-2 rounded-xl transition-all flex items-center justify-center gap-2 text-xs"
                >
                  <Plus size={14} /> HEDEFE EKLE
                </button>
              </div>
              
              <div className="space-y-3 flex-1">
                {sortedTopicGoals.length === 0 ? (
                  <div className="text-center py-12 text-slate-500 border-2 border-dashed border-white/5 rounded-2xl italic text-sm">
                    Bu ay için henüz konu hedefi eklenmemiş.
                  </div>
                ) : (
                  sortedTopicGoals.map((goal, i) => {
                    const originalIndex = topicGoals.findIndex(tg => tg.topic === goal.topic && tg.subject === goal.subject);
                    return (
                      <div key={i} className="flex items-center gap-4 p-4 rounded-2xl bg-white/5 border border-white/5 hover:bg-white/10 transition-all group">
                        <button 
                          onClick={() => toggleTopic(originalIndex)}
                          className={`transition-all ${goal.isCompleted ? 'text-emerald-500' : 'text-slate-600 hover:text-blue-400'}`}
                        >
                          {goal.isCompleted ? <CheckCircle2 size={24} /> : <Circle size={24} />}
                        </button>
                        
                        <div className="flex-1 min-w-0">
                          <p className="text-[10px] font-black text-blue-400 uppercase tracking-widest">{goal.subject}</p>
                          <p className={`text-sm font-bold truncate ${goal.isCompleted ? 'text-slate-500 line-through' : 'text-slate-200'}`}>
                            {goal.topic}
                          </p>
                        </div>

                        <button 
                          onClick={() => removeTopic(originalIndex)}
                          className="p-2 opacity-0 group-hover:opacity-100 text-slate-500 hover:text-red-500 transition-all"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          </div>

          {/* Section 2: Book Completion Program */}
          <div className="space-y-6">
            <div className="bg-slate-900/40 border border-white/5 rounded-3xl p-8 h-full flex flex-col">
              <div className="flex items-center gap-3 mb-8">
                <div className="p-2 bg-amber-500/10 rounded-lg text-amber-500">
                  <BookOpen size={20} />
                </div>
                <h3 className="text-xl font-bold">Aylık Kitap Bitirme Programı</h3>
              </div>

              {/* Add Book Goal Form */}
              <div className="bg-white/5 p-4 rounded-2xl border border-white/5 mb-6 space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <select 
                    value={newBookId}
                    onChange={(e) => setNewBookId(e.target.value)}
                    className="bg-slate-950 border border-white/10 rounded-xl px-3 py-2 text-xs text-white outline-none focus:border-amber-500/50"
                  >
                    <option value="">Kitap Seç...</option>
                    {studentBooks.map(b => (
                      <option key={b.id} value={b.id}>{b.bookName} ({b.subject})</option>
                    ))}
                  </select>
                  <input 
                    type="text"
                    value={newBookTarget}
                    onChange={(e) => setNewBookTarget(e.target.value)}
                    placeholder="Hedef (örn: Sayfa 40-120)"
                    className="bg-slate-950 border border-white/10 rounded-xl px-3 py-2 text-xs text-white outline-none focus:border-amber-500/50"
                  />
                </div>
                <button 
                  onClick={addBookGoal}
                  disabled={!newBookId || !newBookTarget}
                  className="w-full bg-slate-800 hover:bg-slate-700 disabled:opacity-30 text-white font-bold py-2 rounded-xl transition-all flex items-center justify-center gap-2 text-xs"
                >
                  <Plus size={14} /> PROGRAMA EKLE
                </button>
              </div>
              
              <div className="space-y-6 flex-1">
                {sortedBookGoals.length === 0 ? (
                  <div className="text-center py-12 text-slate-500 border-2 border-dashed border-white/5 rounded-2xl italic text-sm">
                    Bu ay için henüz kitap bitirme hedefi eklenmemiş.
                  </div>
                ) : (
                  sortedBookGoals.map((goal, i) => {
                    const originalIndex = bookGoals.findIndex(bg => bg.bookId === goal.bookId && bg.targetDescription === goal.targetDescription);
                    return (
                      <div key={i} className="space-y-4 p-5 rounded-3xl bg-white/5 border border-white/5 relative group">
                        <button 
                          onClick={() => removeBook(originalIndex)}
                          className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 text-slate-600 hover:text-red-500 transition-all"
                        >
                          <Trash2 size={16} />
                        </button>

                        <div className="flex justify-between items-start">
                          <div>
                            <h4 className="text-sm font-bold text-slate-200">{goal.bookName}</h4>
                            <p className="text-xs text-slate-500 mt-1">Hedef: {goal.targetDescription}</p>
                          </div>
                          <div className="flex flex-col items-end gap-1">
                            <span className={`text-[10px] font-black uppercase tracking-widest px-2 py-0.5 rounded ${goal.isCompleted ? 'bg-emerald-500/20 text-emerald-400' : 'bg-amber-500/20 text-amber-400'}`}>
                              {goal.isCompleted ? 'BİTTİ' : `%${goal.progress} TAMAM`}
                            </span>
                          </div>
                        </div>

                        <div className="space-y-2">
                          <div className="h-2 bg-slate-950 rounded-full overflow-hidden border border-white/5 p-px">
                            <div 
                              className={`h-full rounded-full transition-all duration-1000 ${goal.isCompleted ? 'bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.3)]' : 'bg-gradient-to-r from-amber-600 to-amber-400 shadow-[0_0_10px_rgba(245,158,11,0.2)]'}`}
                              style={{ width: `${goal.progress}%` }} 
                            />
                          </div>
                          <input 
                            type="range" 
                            min="0" 
                            max="100" 
                            step="5"
                            value={goal.progress}
                            onChange={(e) => updateBookProgress(originalIndex, parseInt(e.target.value))}
                            className="w-full accent-amber-500 opacity-30 hover:opacity-100 transition-opacity cursor-pointer"
                          />
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Coach's Monthly Assessment */}
      <div className="bg-slate-900/40 border border-white/5 rounded-3xl p-8">
         <div className="flex items-center gap-3 mb-6">
            <div className="p-2 bg-purple-500/10 rounded-lg text-purple-500">
               <Trophy size={20} />
            </div>
            <h3 className="text-xl font-bold">Koçun Aylık Değerlendirmesi & Notu</h3>
         </div>
         <textarea 
            value={coachNote}
            onChange={(e) => setCoachNote(e.target.value)}
            placeholder="Öğrencinin bu ayki hedefleriyle ilgili genel strateji, motivasyon notu veya beklentilerinizi buraya yazabilirsiniz..."
            className="w-full h-32 bg-white/5 border border-white/10 rounded-2xl p-4 text-sm text-slate-200 outline-none focus:border-purple-500/50 transition-all placeholder:text-slate-600 resize-none"
         />
      </div>
    </div>
  );
}
