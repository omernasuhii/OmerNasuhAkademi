import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useStudent } from '../../lib/StudentContext';
import { useAuth } from '../../lib/AuthContext';
import { tourService } from '../../services/tourService';
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
  AlertCircle,
  Search
} from 'lucide-react';
import { useCurriculum } from '../../lib/CurriculumContext';
import { OnboardingTour, TourStep } from '../../components/OnboardingTour';
import NoStudentSelected from '../../components/NoStudentSelected';
import { SAMPLE_DEMO_STUDENT } from './CoachStudents';

interface TopicGoal {
  subject: string;
  topic: string;
  isCompleted: boolean;
}

interface BookGoal {
  bookId: string;
  bookName: string;
  subject?: string;
  targetDescription: string;
  progress: number;
  isCompleted: boolean;
  startPage?: number;
  endPage?: number;
  currentPage?: number;
}

const DEMO_TOPIC_GOALS: TopicGoal[] = [
  { subject: 'Temel Matematik', topic: 'Fonksiyonlar & Grafikler', isCompleted: true },
  { subject: 'Fizik', topic: 'Elektrik ve Manyetizma', isCompleted: false },
  { subject: 'Kimya', topic: 'Kimyasal Tepkimelerde Denge', isCompleted: false },
  { subject: 'Geometri', topic: 'Üçgende Açılar ve Kenarlar', isCompleted: true }
];

const DEMO_BOOK_GOALS: BookGoal[] = [
  { bookId: 'b1', bookName: '3D TYT Matematik Soru Bankası', subject: 'Temel Matematik', targetDescription: 'Sayfa 100 - 180', progress: 75, isCompleted: false, startPage: 100, endPage: 180, currentPage: 160 },
  { bookId: 'b2', bookName: 'Apotemi Fizik Fasikülü', subject: 'Fizik', targetDescription: 'Elektrik Ünitesi', progress: 100, isCompleted: true }
];

const DEMO_COACH_NOTE = "Öğrencinin bu ay Matematik ve Fizik konularına öncelik vermesi kararlaştırıldı. Sayfa takipli soru bankası ödevlerinin haftalık takibi yapılacaktır.";

export default function StudentGoals() {
  const { user, userData } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const { curriculum: CURRICULUM } = useCurriculum();
  const { selectedStudent, setSelectedStudent } = useStudent();

  const activeStudent = selectedStudent || (location.state?.startTour || location.state?.isDemo ? SAMPLE_DEMO_STUDENT : null);

  useEffect(() => {
    if (!selectedStudent && (location.state?.startTour || location.state?.isDemo)) {
      setSelectedStudent(SAMPLE_DEMO_STUDENT);
    }
  }, [selectedStudent, setSelectedStudent, location.state]);

  const [isTourOpen, setIsTourOpen] = useState(false);

  useEffect(() => {
    if (tourService.shouldAutoStartTour('student_goals', userData, location.state?.startTour)) {
      const timer = setTimeout(() => {
        setIsTourOpen(true);
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [location.state, userData]);

  const handleEndTour = () => {
    setIsTourOpen(false);
    tourService.markTourCompleted('student_goals', user?.uid);
  };

  const tourSteps: TourStep[] = [
    {
      targetId: 'tour-goals-header',
      title: 'Aylık Hedefler & Takip Paneli',
      description: `${activeStudent?.displayName || 'Seçili öğrenci'} için aylık konu ve kitap bitirme hedeflerinin planlandığı ve anlık takibinin yapıldığı yönetim merkezidir.`,
      position: 'bottom'
    },
    {
      targetId: 'tour-topic-goals',
      title: 'Aylık Konu Hedefleri',
      description: 'Müfredata uygun ders ve konular seçilerek öğrencinin o ay tamamlaması gereken kritik konular hedeflere eklenir ve tamamlanma durumu takip edilir.',
      position: 'top'
    },
    {
      targetId: 'tour-book-goals',
      title: 'Kitap & Sayfa Bitirme Hedefleri',
      description: 'Öğrencinin kaynak kitaplarından belirli sayfa aralıkları veya üniteler hedef gösterilir. Sayfa ilerleme çubuğu ile anlık sayfa takibi yapılır.',
      position: 'top'
    },
    {
      targetId: 'tour-coach-note',
      title: 'Koçun Aylık Değerlendirmesi & Strateji Notu',
      description: 'Koç, öğrencinin aylık genel stratejisini, çalışma taktiğini ve motivasyon notunu bu alana kaydederek öğrenciye rehberlik eder.',
      position: 'top'
    }
  ];

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
  
  // Kitap sayfa hedefleri için yeni state'ler
  const [newBookStartPage, setNewBookStartPage] = useState<string>('');
  const [newBookEndPage, setNewBookEndPage] = useState<string>('');

  // Hızlı konu seçimi için yeni state'ler
  const [topicSearchQuery, setTopicSearchQuery] = useState('');
  const [selectedTopicsToAdd, setSelectedTopicsToAdd] = useState<string[]>([]);

  useEffect(() => {
    if (activeStudent) {
      loadGoals();
      loadStudentBooks();
    } else {
      setLoading(false);
    }
  }, [activeStudent, currentMonth]);

  const loadGoals = async () => {
    if (!activeStudent) return;
    setLoading(true);
    try {
      const goalData = await studentDataService.getMonthlyGoal(activeStudent.uid, currentMonth);
      if (goalData && (goalData.topicGoals?.length > 0 || goalData.bookGoals?.length > 0 || goalData.coachNote)) {
        setTopicGoals(goalData.topicGoals || []);
        setBookGoals(goalData.bookGoals || []);
        setCoachNote(goalData.coachNote || '');
      } else if (location.state?.startTour || location.state?.isDemo) {
        setTopicGoals(DEMO_TOPIC_GOALS);
        setBookGoals(DEMO_BOOK_GOALS);
        setCoachNote(DEMO_COACH_NOTE);
      } else {
        setTopicGoals([]);
        setBookGoals([]);
        setCoachNote('');
      }
    } catch (error) {
      console.error('Error loading goals:', error);
      if (location.state?.startTour || location.state?.isDemo) {
        setTopicGoals(DEMO_TOPIC_GOALS);
        setBookGoals(DEMO_BOOK_GOALS);
        setCoachNote(DEMO_COACH_NOTE);
      }
    } finally {
      setLoading(false);
    }
  };

  const loadStudentBooks = async () => {
    if (!activeStudent) return;
    try {
      const books = await studentDataService.getBookTracking(activeStudent.uid);
      setStudentBooks(books);
    } catch (error) {
      console.error('Error loading books:', error);
    }
  };

  const handleSave = async () => {
    if (!activeStudent) return;
    setSaving(true);
    try {
      await studentDataService.saveMonthlyGoal({
        studentId: activeStudent.uid,
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

  const addMultipleTopicGoals = () => {
    if (!newTopicSubject || selectedTopicsToAdd.length === 0) return;
    
    const existingGoals = new Set(topicGoals.map(g => `${g.subject.trim().toLowerCase()}_${g.topic.trim().toLowerCase()}`));
    const newGoalsToAdd: TopicGoal[] = [];
    
    selectedTopicsToAdd.forEach(topic => {
      const key = `${newTopicSubject.trim().toLowerCase()}_${topic.trim().toLowerCase()}`;
      if (!existingGoals.has(key)) {
        newGoalsToAdd.push({ subject: newTopicSubject, topic, isCompleted: false });
      }
    });
    
    if (newGoalsToAdd.length > 0) {
      setTopicGoals([...topicGoals, ...newGoalsToAdd]);
    }
    
    setSelectedTopicsToAdd([]);
    setTopicSearchQuery('');
  };

  const toggleTopicSelection = (topic: string) => {
    setSelectedTopicsToAdd(prev => 
      prev.includes(topic) ? prev.filter(t => t !== topic) : [...prev, topic]
    );
  };

  const handleSelectAllTopics = () => {
    const topics = CURRICULUM[newTopicSubject as keyof typeof CURRICULUM] || [];
    setSelectedTopicsToAdd(topics);
  };

  const handleClearAllTopics = () => {
    setSelectedTopicsToAdd([]);
  };

  const filteredTopics = useMemo(() => {
    if (!newTopicSubject) return [];
    const topics = CURRICULUM[newTopicSubject as keyof typeof CURRICULUM] || [];
    if (!topicSearchQuery) return topics;
    return topics.filter((t: string) => t.toLowerCase().includes(topicSearchQuery.toLowerCase()));
  }, [newTopicSubject, topicSearchQuery]);

  const addBookGoal = () => {
    if (!newBookId) return;
    const book = studentBooks.find(b => b.id === newBookId);
    
    const sPage = newBookStartPage ? parseInt(newBookStartPage, 10) : undefined;
    const ePage = newBookEndPage ? parseInt(newBookEndPage, 10) : undefined;
    
    let targetDesc = newBookTarget;
    if (sPage !== undefined && ePage !== undefined) {
      targetDesc = `Sayfa ${sPage} - ${ePage}`;
    }

    if (!targetDesc) {
      alert('Lütfen bir hedef tanımı girin veya başlangıç/bitiş sayfalarını belirtin.');
      return;
    }

    setBookGoals([...bookGoals, { 
      bookId: newBookId, 
      bookName: book?.bookName || 'Bilinmeyen Kitap', 
      subject: book?.subject,
      targetDescription: targetDesc, 
      progress: 0, 
      isCompleted: false,
      startPage: sPage,
      endPage: ePage,
      currentPage: sPage !== undefined ? sPage : undefined
    }]);
    setNewBookId('');
    setNewBookTarget('');
    setNewBookStartPage('');
    setNewBookEndPage('');
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

  const updateBookCurrentPage = (index: number, pageVal: number) => {
    const newGoals = [...bookGoals];
    const goal = newGoals[index];
    if (goal.startPage !== undefined && goal.endPage !== undefined) {
      const sp = goal.startPage;
      const ep = goal.endPage;
      const cp = Math.min(ep, Math.max(sp, pageVal));
      goal.currentPage = cp;
      
      const totalPages = ep - sp;
      if (totalPages > 0) {
        goal.progress = Math.min(100, Math.max(0, Math.round(((cp - sp) / totalPages) * 100)));
      } else {
        goal.progress = 100;
      }
      goal.isCompleted = cp === ep;
    }
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

  if (!activeStudent) {
    return <NoStudentSelected />;
  }

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <OnboardingTour
        steps={tourSteps}
        isOpen={isTourOpen}
        onClose={handleEndTour}
        onComplete={handleEndTour}
        onNextTour={() => {
          setIsTourOpen(false);
          tourService.markTourCompleted('student_goals', user?.uid);
          navigate('/panel/koc/ogrenci/cuzdan', { state: { startTour: true, isDemo: true } });
        }}
        nextTourLabel="Ön Ödemeli Cüzdan Turu"
        tourKey="student_goals"
      />

      {/* Header */}
      <div id="tour-goals-header" className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-3xl font-bold italic text-white uppercase tracking-tight">
             AYLIK HEDEFLER & TAKİP
          </h1>
          <p className="text-slate-500 mt-1">{activeStudent.displayName} için {monthLabel} dönemi planı.</p>
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
          <div id="tour-topic-goals" className="space-y-6">
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
                      setSelectedTopicsToAdd([]);
                      setTopicSearchQuery('');
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
                    <option value="">Tek Konu Seç...</option>
                    {(CURRICULUM[newTopicSubject as keyof typeof CURRICULUM] || []).map((t: string) => (
                      <option key={t} value={t}>{t}</option>
                    ))}
                  </select>
                </div>
                
                {newTopicName && (
                  <button 
                    onClick={addTopicGoal}
                    className="w-full bg-slate-800 hover:bg-slate-700 text-white font-bold py-2 rounded-xl transition-all flex items-center justify-center gap-2 text-xs"
                  >
                    <Plus size={14} /> BU KONUYU TEK OLARAK EKLE
                  </button>
                )}

                {/* Hızlı Toplu Konu Seçim Sistemi */}
                {newTopicSubject && (
                  <div className="bg-slate-950/40 p-3 rounded-xl border border-white/5 space-y-3 mt-3">
                    <div className="flex items-center justify-between text-[11px] text-slate-400 font-bold">
                      <span>Hızlı Konu Seçimi ({filteredTopics.length} Konu)</span>
                      <div className="flex gap-2">
                        <button 
                          onClick={handleSelectAllTopics}
                          className="text-blue-400 hover:underline"
                        >
                          Hepsini Seç
                        </button>
                        <span>•</span>
                        <button 
                          onClick={handleClearAllTopics}
                          className="text-slate-500 hover:underline"
                        >
                          Seçimi Temizle
                        </button>
                      </div>
                    </div>
                    
                    <div className="relative">
                      <Search className="absolute left-3 top-2 text-slate-500" size={14} />
                      <input 
                        type="text"
                        value={topicSearchQuery}
                        onChange={(e) => setTopicSearchQuery(e.target.value)}
                        placeholder="Konu Ara..."
                        className="w-full bg-slate-950 border border-white/10 rounded-lg pl-9 pr-3 py-1.5 text-xs text-white outline-none focus:border-blue-500/50"
                      />
                    </div>
                    
                    <div className="max-h-48 overflow-y-auto space-y-1 p-2 bg-slate-950/50 rounded-lg border border-white/5 scrollbar-thin scrollbar-thumb-white/10">
                      {filteredTopics.length === 0 ? (
                        <div className="text-center py-4 text-slate-600 text-xs italic">
                          Aranan konu bulunamadı.
                        </div>
                      ) : (
                        filteredTopics.map((topic: string) => {
                          const isChecked = selectedTopicsToAdd.includes(topic);
                          const isAlreadyAdded = topicGoals.some(tg => tg.subject === newTopicSubject && tg.topic === topic);
                          return (
                            <label 
                              key={topic} 
                              className={`flex items-center justify-between p-2 rounded-md text-xs cursor-pointer transition-all ${
                                isAlreadyAdded 
                                  ? 'bg-emerald-500/5 text-emerald-400/60 cursor-not-allowed' 
                                  : isChecked 
                                    ? 'bg-blue-500/10 text-white font-semibold' 
                                    : 'hover:bg-white/5 text-slate-300'
                              }`}
                            >
                              <span className="truncate pr-2">{topic}</span>
                              <div className="flex items-center gap-1.5">
                                {isAlreadyAdded ? (
                                  <span className="text-[9px] bg-emerald-500/10 text-emerald-500 px-1 py-0.5 rounded">Zaten Ekli</span>
                                ) : (
                                  <input 
                                    type="checkbox"
                                    checked={isChecked}
                                    disabled={isAlreadyAdded}
                                    onChange={() => toggleTopicSelection(topic)}
                                    className="accent-blue-500 rounded cursor-pointer"
                                  />
                                )}
                              </div>
                            </label>
                          );
                        })
                      )}
                    </div>
                    
                    <button 
                      onClick={addMultipleTopicGoals}
                      disabled={selectedTopicsToAdd.length === 0}
                      className="w-full bg-blue-600 hover:bg-blue-500 disabled:opacity-30 text-white font-bold py-2 rounded-lg transition-all flex items-center justify-center gap-2 text-xs"
                    >
                      <Plus size={14} /> SEÇİLEN KONULARI HEDEFE EKLE ({selectedTopicsToAdd.length})
                    </button>
                  </div>
                )}
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
          <div id="tour-book-goals" className="space-y-6">
            <div className="bg-slate-900/40 border border-white/5 rounded-3xl p-8 h-full flex flex-col">
              <div className="flex items-center gap-3 mb-8">
                <div className="p-2 bg-amber-500/10 rounded-lg text-amber-500">
                  <BookOpen size={20} />
                </div>
                <h3 className="text-xl font-bold">Aylık Kitap Bitirme Programı</h3>
              </div>

              {/* Add Book Goal Form */}
              <div className="bg-white/5 p-4 rounded-2xl border border-white/5 mb-6 space-y-3">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
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
                  
                  <div className="grid grid-cols-2 gap-2">
                    <input 
                      type="number"
                      value={newBookStartPage}
                      onChange={(e) => setNewBookStartPage(e.target.value)}
                      placeholder="Başlangıç Sayfası"
                      className="bg-slate-950 border border-white/10 rounded-xl px-3 py-2 text-xs text-white outline-none focus:border-amber-500/50"
                    />
                    <input 
                      type="number"
                      value={newBookEndPage}
                      onChange={(e) => setNewBookEndPage(e.target.value)}
                      placeholder="Bitiş Sayfası"
                      className="bg-slate-950 border border-white/10 rounded-xl px-3 py-2 text-xs text-white outline-none focus:border-amber-500/50"
                    />
                  </div>
                </div>

                <div className="text-slate-500 text-[10px] italic">
                  Veya sayfalar yerine özel bir hedef tanımı girmek isterseniz aşağıdaki alanı kullanın:
                </div>

                <input 
                  type="text"
                  value={newBookTarget}
                  onChange={(e) => setNewBookTarget(e.target.value)}
                  placeholder="Özel Hedef Tanımı (örn: İlk 5 Ünite)"
                  className="w-full bg-slate-950 border border-white/10 rounded-xl px-3 py-2 text-xs text-white outline-none focus:border-amber-500/50"
                />

                <button 
                  onClick={addBookGoal}
                  disabled={!newBookId || (!newBookTarget && (!newBookStartPage || !newBookEndPage))}
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
                    const hasPageTracking = goal.startPage !== undefined && goal.endPage !== undefined;
                    const bookInfo = studentBooks.find(b => b.id === goal.bookId);
                    const subjectToShow = goal.subject || bookInfo?.subject;
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
                            {subjectToShow && (
                              <span className="text-[10px] font-black text-amber-500 uppercase tracking-widest block mb-1">
                                {subjectToShow}
                              </span>
                            )}
                            <h4 className="text-sm font-bold text-slate-200">{goal.bookName}</h4>
                            {hasPageTracking ? (
                              <div className="text-xs text-slate-400 mt-1 flex flex-col gap-0.5">
                                <span>Hedef: Sayfa {goal.startPage} - {goal.endPage}</span>
                                <span className="text-amber-500 font-semibold">Mevcut Sayfa: {goal.currentPage ?? goal.startPage} / {goal.endPage}</span>
                              </div>
                            ) : (
                              <p className="text-xs text-slate-500 mt-1">Hedef: {goal.targetDescription}</p>
                            )}
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
                          
                          {hasPageTracking ? (
                            <div className="flex items-center gap-3 mt-1">
                              <span className="text-[10px] text-slate-500 font-mono">Sf {goal.startPage}</span>
                              <input 
                                type="range" 
                                min={goal.startPage} 
                                max={goal.endPage} 
                                step="1"
                                value={goal.currentPage ?? goal.startPage}
                                onChange={(e) => updateBookCurrentPage(originalIndex, parseInt(e.target.value, 10))}
                                className="flex-1 accent-amber-500 opacity-70 hover:opacity-100 transition-opacity cursor-pointer"
                              />
                              <span className="text-[10px] text-slate-500 font-mono">Sf {goal.endPage}</span>
                            </div>
                          ) : (
                            <input 
                              type="range" 
                              min="0" 
                              max="100" 
                              step="5"
                              value={goal.progress}
                              onChange={(e) => updateBookProgress(originalIndex, parseInt(e.target.value))}
                              className="w-full accent-amber-500 opacity-30 hover:opacity-100 transition-opacity cursor-pointer"
                            />
                          )}
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
      <div id="tour-coach-note" className="bg-slate-900/40 border border-white/5 rounded-3xl p-8">
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
