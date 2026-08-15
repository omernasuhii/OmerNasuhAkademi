import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useStudent } from '../../lib/StudentContext';
import { useAuth } from '../../lib/AuthContext';
import { tourService } from '../../services/tourService';
import { studentDataService } from '../../services/studentDataService';
import { useCurriculum } from '../../lib/CurriculumContext';
import { OnboardingTour, TourStep } from '../../components/OnboardingTour';
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
  FileText,
  ArrowUp,
  ArrowDown,
  Sparkles
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

import { BRANCH_CONFIG } from '../../constants/branchConfig';
import { formatSubjectName } from './StudentProgram';
import { SAMPLE_DEMO_STUDENT } from './CoachStudents';
import NoStudentSelected from '../../components/NoStudentSelected';

export default function StudentDataEntry() {
  const { user, userData } = useAuth();
  const { curriculum: CURRICULUM } = useCurriculum();
  const { selectedStudent, setSelectedStudent } = useStudent();
  const location = useLocation();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [expandedBook, setExpandedBook] = useState<string | null>(null);
  const [isTourOpen, setIsTourOpen] = useState(false);

  useEffect(() => {
    if (tourService.shouldAutoStartTour('student_data_entry', userData, location.state?.startTour)) {
      if (!selectedStudent) {
        setSelectedStudent(SAMPLE_DEMO_STUDENT);
      }
      const timer = setTimeout(() => {
        setIsTourOpen(true);
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [selectedStudent, setSelectedStudent, location.state, userData]);

  const handleEndTour = () => {
    setIsTourOpen(false);
    tourService.markTourCompleted('student_data_entry', user?.uid);
    if (selectedStudent?.isDemo) {
      setSelectedStudent(null);
      navigate('/panel/koc');
    }
  };

  const tourSteps: TourStep[] = [
    {
      targetId: 'tour-data-entry-header',
      title: 'Kaynak & Kitap Takibi',
      description: 'Öğrencinizin soru bankası, fasikül veya YouTube kanalı takibini buradan kolayca ekleyebilirsiniz.',
      position: 'bottom',
      badge: 'Kaynak Yönetimi'
    },
    {
      targetId: 'tour-data-entry-list',
      title: 'Konu İlerleme Durumu',
      description: 'Eklenen her kaynak, müfredat konularıyla eşleşir. Konular bittikçe işaretleyebilirsiniz.',
      position: 'top',
      badge: 'Gelişim Takibi'
    }
  ];

  // Book Tracking State
  const [books, setBooks] = useState<any[]>([]);
  const [globalBooks, setGlobalBooks] = useState<any[]>([]);
  const [newBook, setNewBook] = useState({ resourceType: 'soru', type: 'TYT', subject: 'Türkçe', name: '', globalBookId: '', isbn: '' });
  const [isManualEntry, setIsManualEntry] = useState(false);
  const [bookSearchTerm, setBookSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState('soru');
  const [subjectFilter, setSubjectFilter] = useState('Hepsi');
  const [selectedYoutubeChannel, setSelectedYoutubeChannel] = useState('');
  const [customYoutubeChannel, setCustomYoutubeChannel] = useState('');

  const YOUTUBE_CHANNELS_MAP: Record<string, string[]> = {
    'matematik': ['Rehber Matematik', 'Mert Hoca', 'Eyüp B. Matematik', 'Bıyıklı Matematik', 'Benim Hocam (İlyas Güneş)', 'Şenol Hoca', 'Matematiğin Güler Yüzü'],
    'ayt matematik': ['Rehber Matematik', 'Mert Hoca', 'Eyüp B. Matematik', 'Bıyıklı Matematik', 'Benim Hocam (İlyas Güneş)', 'Şenol Hoca', 'Matematiğin Güler Yüzü'],
    '10. sınıf matematik': ['Rehber Matematik', 'Mert Hoca', 'Eyüp B. Matematik', 'Bıyıklı Matematik', 'Benim Hocam (İlyas Güneş)', 'Şenol Hoca', 'Matematiğin Güler Yüzü'],
    'geometri': ['Kenan Kara ile Geometri', 'Mert Hoca Geometri', 'Rehber Matematik', 'Eyüp B. Geometri'],
    'fizik': ['VIP Fizik', 'Fizikle Barış', 'Özcan Aykın', 'Altuğ Güneş', 'Fizik Evreni'],
    'ayt fizik': ['VIP Fizik', 'Fizikle Barış', 'Özcan Aykın', 'Altuğ Güneş', 'Fizik Evreni'],
    '10. sınıf fizik': ['VIP Fizik', 'Fizikle Barış', 'Özcan Aykın', 'Altuğ Güneş', 'Fizik Evreni'],
    'kimya': ['Görkem Şahin (Benim Hocam)', 'Kimya Adası', 'Ferrum Kimya', 'Paraksilen Kimya', 'Kimya Özel'],
    'ayt kimya': ['Görkem Şahin (Benim Hocam)', 'Kimya Adası', 'Ferrum Kimya', 'Paraksilen Kimya', 'Kimya Özel'],
    '10. sınıf kimya': ['Görkem Şahin (Benim Hocam)', 'Kimya Adası', 'Ferrum Kimya', 'Paraksilen Kimya', 'Kimya Özel'],
    'biyoloji': ['Selin Hoca', 'Fundamentals Biyoloji', 'Dr. Biyoloji', 'Biyosem', 'Senel Hoca'],
    'ayt biyoloji': ['Selin Hoca', 'Fundamentals Biyoloji', 'Dr. Biyoloji', 'Biyosem', 'Senel Hoca'],
    '10. sınıf biyoloji': ['Selin Hoca', 'Fundamentals Biyoloji', 'Dr. Biyoloji', 'Biyosem', 'Senel Hoca'],
    'türkçe': ['Rüştü Hoca (Rüştü Bayındır)', 'Kadir Gümüş (Benim Hocam)', 'Aker Kartal', 'Türkçenin Matematiği'],
    'paragraf': ['Rüştü Hoca (Rüştü Bayındır)', 'Kadir Gümüş (Benim Hocam)', 'Aker Kartal', 'Türkçenin Matematiği'],
    'edebiyat': ['Kadir Gümüş (Benim Hocam)', 'Rüştü Hoca', 'Edebiyat Semineri'],
    '10. sınıf edebiyat': ['Kadir Gümüş (Benim Hocam)', 'Rüştü Hoca', 'Edebiyat Semineri'],
    'tarih': ['Ramazan Yetgin (Benim Hocam)', 'Sosyal Kale', 'Sadettin Akyay', 'Tarih Portalı'],
    'ayt tarih': ['Ramazan Yetgin (Benim Hocam)', 'Sosyal Kale', 'Sadettin Akyay', 'Tarih Portalı'],
    '10. sınıf tarih': ['Ramazan Yetgin (Benim Hocam)', 'Sosyal Kale', 'Sadettin Akyay', 'Tarih Portalı'],
    'coğrafya': ['Bayram Meral (Benim Hocam)', 'Yavuz Tuna', 'Coğrafyanın Kodları'],
    'ayt coğrafya': ['Bayram Meral (Benim Hocam)', 'Yavuz Tuna', 'Coğrafyanın Kodları'],
    '10. sınıf coğrafya': ['Bayram Meral (Benim Hocam)', 'Yavuz Tuna', 'Coğrafyanın Kodları'],
    'felsefe': ['Felsefe Atölyesi', 'Benim Hocam Felsefe'],
    'ayt felsefe': ['Felsefe Atölyesi', 'Benim Hocam Felsefe'],
    'din kültürü': ['Benim Hocam Din Kültürü', 'Din Kültürü Portalı']
  };

  const getYoutubeChannels = (subject: string) => {
    const key = (subject || '').toLowerCase();
    const staticChannels = YOUTUBE_CHANNELS_MAP[key] || ['Rehber Matematik', 'Mert Hoca', 'Rüştü Hoca (Rüştü Bayındır)', 'VIP Fizik', 'Görkem Şahin (Benim Hocam)', 'Selin Hoca'];
    const dynamicChannels = globalBooks
      .filter(b => b.resourceType === 'youtube' && (b.subject || '').toLowerCase() === key)
      .map(b => b.name);
    return Array.from(new Set([...staticChannels, ...dynamicChannels])).filter(Boolean);
  };

  useEffect(() => {
    if (newBook.resourceType === 'youtube') {
      const channels = getYoutubeChannels(newBook.subject);
      setSelectedYoutubeChannel(channels[0] || 'Diğer (Manuel Giriş)');
      setCustomYoutubeChannel('');
    }
  }, [newBook.subject, newBook.resourceType, globalBooks]);

  useEffect(() => {
    if (selectedStudent) {
      if (selectedStudent.isDemo) {
        const demoBooks = [
          { id: 'demo1', name: 'Palme Biyoloji Soru Bankası', subject: 'Biyoloji', resourceType: 'soru', type: 'TYT', completedTopics: ['Canlıların Ortak Özellikleri', 'Canlıların Temel Bileşenleri - 1 (İnorganikler, Karbonhidratlar)', 'Hücre - 1 (Zar, Madde Geçişleri)'], completionPercentage: 75, order: 0 },
          { id: 'demo2', name: 'Biyotik Biyoloji Soru Bankası', subject: 'Biyoloji', resourceType: 'soru', type: 'AYT', completedTopics: ['Canlıların Ortak Özellikleri', 'Hücre - 1 (Zar, Madde Geçişleri)'], completionPercentage: 60, order: 1 },
          { id: 'demo3', name: 'Bilgi Sarmal Fizik Soru Bankası', subject: 'Fizik', resourceType: 'soru', type: 'AYT', completedTopics: ['Vektörler'], completionPercentage: 70, order: 2 },
          { id: 'demo4', name: 'VIP Fizik', subject: 'Fizik', resourceType: 'youtube', type: 'TYT', completedTopics: ['Fizik Bilimine Giriş'], completionPercentage: 30, order: 3 },
        ];
        setBooks(demoBooks);
        setExpandedBook(demoBooks[0].id);
        setGlobalBooks([]);
      } else {
        studentDataService.getBookTracking(selectedStudent.uid).then(data => {
          setBooks(data);
          if (data && data.length > 0) {
            setExpandedBook(data[0].id);
          }
        });
        studentDataService.getGlobalBooks().then(setGlobalBooks);
      }
    }
  }, [selectedStudent]);

  const branchMap: Record<string, keyof typeof BRANCH_CONFIG> = {
    'SAYISAL': 'SAY',
    'EŞİT AĞIRLIK': 'EA',
    'SÖZEL': 'SÖZ',
    'DİL': 'DİL'
  };
  const isAraSinif = ['9. Sınıf', '10. Sınıf', '11. Sınıf'].includes(selectedStudent?.grade || '');
  const activeBranchKey = isAraSinif 
    ? selectedStudent?.grade as string
    : (selectedStudent?.branch ? (branchMap[selectedStudent.branch as string] || 'TYT') : 'TYT');
  const currentBranchInfo = BRANCH_CONFIG[activeBranchKey] || { subjects: [], aytSubjects: [] };
  const subjectOptions = newBook.type === 'TYT' 
    ? BRANCH_CONFIG['TYT'].subjects 
    : newBook.type === 'AYT' 
      ? currentBranchInfo.aytSubjects 
      : BRANCH_CONFIG[newBook.type]?.subjects || [];

  // Auto-select first subject when type changes to prevent invalid subject selection
  useEffect(() => {
    if (subjectOptions.length > 0 && !subjectOptions.includes(newBook.subject)) {
      setNewBook(prev => ({ ...prev, subject: subjectOptions[0] }));
    }
  }, [newBook.type, subjectOptions]);

  const toggleTopic = async (book: any, topic: string) => {
    if (selectedStudent?.isDemo) return;
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
    if (selectedStudent?.isDemo) return;
    let finalBookName = '';
    let finalIsbn = '';

    if (newBook.resourceType === 'youtube') {
      if (selectedYoutubeChannel === 'Diğer (Manuel Giriş)') {
        if (!customYoutubeChannel.trim()) {
          alert("Lütfen kanal adını giriniz.");
          return;
        }
        finalBookName = customYoutubeChannel.trim();
      } else {
        finalBookName = selectedYoutubeChannel;
      }
      finalIsbn = "youtube_" + finalBookName.toLowerCase().replace(/[^a-z0-9_]/g, '_');
    } else {
      if (!newBook.isbn) {
          alert("Lütfen ISBN numarası giriniz.");
          return;
      }
      finalBookName = newBook.name;
      finalIsbn = newBook.isbn;
    }

    let globalId = newBook.globalBookId;
    let finalSubject = newBook.subject;
    let finalResourceType = newBook.resourceType;

    const existingGlobal = globalBooks.find(b => b.isbn && b.isbn.trim() === finalIsbn.trim());

    if (existingGlobal) {
        globalId = existingGlobal.id;
        finalBookName = existingGlobal.name;
        finalIsbn = existingGlobal.isbn || finalIsbn;
        finalSubject = existingGlobal.subject || finalSubject;
        finalResourceType = existingGlobal.resourceType || finalResourceType;
    } else {
        if (newBook.resourceType !== 'youtube' && !isManualEntry) {
            setIsManualEntry(true);
            return;
        }
        if (newBook.resourceType !== 'youtube' && !newBook.name) {
            alert("Lütfen kaynak adını giriniz.");
            return;
        }

        globalId = await studentDataService.saveGlobalBook({
          name: finalBookName,
          subject: newBook.subject,
          type: newBook.type,
          resourceType: newBook.resourceType,
          isbn: finalIsbn,
          topicQuestionCounts: {}
        });
    }

    // Check if student already has this book
    const alreadyTracked = books.find(b => 
       b.globalBookId === globalId || 
       (b.isbn && b.isbn === finalIsbn) || 
       (b.bookName === finalBookName && b.subject === finalSubject)
    );

    if (alreadyTracked) {
        alert("Bu kaynak zaten öğrencinin listesinde bulunuyor.");
        setNewBook({ resourceType: newBook.resourceType, type: newBook.type, subject: newBook.subject, name: '', globalBookId: '', isbn: '' });
        setIsManualEntry(false);
        return;
    }

    // Determine order
    const existingBooksInTab = books.filter(b => (b.resourceType || 'soru') === finalResourceType);
    const maxOrder = existingBooksInTab.reduce((max, b) => Math.max(max, b.order || 0), -1);
    const newOrder = maxOrder + 1;

    await studentDataService.updateBookProgress(null, {
      studentId: selectedStudent!.uid,
      subject: finalSubject,
      bookName: finalBookName,
      globalBookId: globalId,
      resourceType: finalResourceType,
      isbn: finalIsbn,
      completedTopics: [],
      completionPercentage: 0,
      order: newOrder
    });
    setNewBook({ resourceType: newBook.resourceType, type: newBook.type, subject: newBook.subject, name: '', globalBookId: '', isbn: '' });
    setIsManualEntry(false);
    setBookSearchTerm('');
    setCustomYoutubeChannel('');
    
    const [updatedTracking, updatedGlobals] = await Promise.all([
      studentDataService.getBookTracking(selectedStudent!.uid),
      studentDataService.getGlobalBooks()
    ]);
    setBooks(updatedTracking);
    setGlobalBooks(updatedGlobals);
  };

  const handleDeleteBook = async (bookId: string) => {
    if (!window.confirm("Bu kaynağı silmek istediğinize emin misiniz?")) return;
    
    await studentDataService.deleteBookTracking(bookId);
    if (selectedStudent) {
       const updatedTracking = await studentDataService.getBookTracking(selectedStudent.uid);
       setBooks(updatedTracking);
    }
  };

  const handleMoveBook = async (e: React.MouseEvent, book: any, direction: 'up' | 'down') => {
    e.stopPropagation();
    if (selectedStudent?.isDemo) return;
    if (subjectFilter === 'Hepsi') {
       alert("Sıralama değiştirmek için önce belirli bir branş seçmelisiniz.");
       return;
    }
    
    // Yalnızca ekrana yansıyan sırayı alıyoruz. 
    // Öncesinde order değeri undefined olanları en sona atmak için MAX_SAFE_INTEGER diyoruz
    const filteredBooks = books
      .filter(b => (b.resourceType || 'soru') === activeTab)
      .filter(b => subjectFilter === 'Hepsi' || b.subject === subjectFilter)
      .sort((a, b) => {
         const orderA = a.order !== undefined ? a.order : Number.MAX_SAFE_INTEGER;
         const orderB = b.order !== undefined ? b.order : Number.MAX_SAFE_INTEGER;
         return orderA - orderB;
      });

    const currentIndex = filteredBooks.findIndex(b => b.id === book.id);
    if (currentIndex === -1) return;
    
    const targetIndex = direction === 'up' ? currentIndex - 1 : currentIndex + 1;
    if (targetIndex < 0 || targetIndex >= filteredBooks.length) return;
    
    // İşlem yapılacak hedefi belirliyoruz
    const targetBook = filteredBooks[targetIndex];
    
    // Birbirleriyle yer değişecek olan index değerleri
    const newOrderForCurrent = targetIndex;
    const newOrderForTarget = currentIndex;
    
    // Tüm listeyi ekrandaki haliyle numaralandırıyoruz ki birden fazla undefined varsa çakışma olmasın
    const updates = filteredBooks.map((b, idx) => {
        let newOrder = idx;
        if (idx === currentIndex) newOrder = newOrderForCurrent;
        if (idx === targetIndex) newOrder = newOrderForTarget;
        return { ...b, order: newOrder };
    });

    setBooks(prev => prev.map(pb => {
        const u = updates.find(ub => ub.id === pb.id);
        return u ? u : pb;
    }));
    
    // Değişen her öğeyi arka planda da güncelliyoruz
    await Promise.all(updates.map(ub => 
        studentDataService.updateBookProgress(ub.id, { ...ub })
    ));
  };

  if (!selectedStudent) {
    return <NoStudentSelected />;
  }

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-20">
      <OnboardingTour
        steps={tourSteps}
        isOpen={isTourOpen}
        onClose={handleEndTour}
        onComplete={handleEndTour}
        onNextTour={() => {
          setIsTourOpen(false);
          tourService.markTourCompleted('student_data_entry', user?.uid);
          navigate('/panel/koc/ogrenci/randevular', { state: { startTour: true, isDemo: true } });
        }}
        nextTourLabel="Öğrenci Randevuları Turu"
        tourKey="student_data_entry"
      />

      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold italic text-white uppercase tracking-tight">KAYNAK TAKİBİ</h1>
        <p className="text-slate-500 mt-1">{selectedStudent?.displayName} akademik ilerleme ve kaynak bitirme raporu.</p>
      </div>

      <div className="space-y-8">
        {/* Add Book Form */}
        <div id="tour-data-entry-header" className="bg-white/5 border border-white/5 rounded-3xl p-8">
           <h3 className="text-lg font-bold mb-6 italic uppercase tracking-tighter">Yeni Kaynak Ekle</h3>
           
           <div className="mb-6 flex gap-4">
              <label className="flex items-center gap-2 cursor-pointer">
                 <input type="radio" name="rType" value="soru" checked={newBook.resourceType === 'soru'} onChange={() => { setNewBook({...newBook, resourceType: 'soru', globalBookId: '', name: ''}); setIsManualEntry(false); }} className="text-indigo-500" />
                 <span className="text-sm text-slate-300">Soru Bankası</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                 <input type="radio" name="rType" value="konu" checked={newBook.resourceType === 'konu'} onChange={() => { setNewBook({...newBook, resourceType: 'konu', globalBookId: '', name: ''}); setIsManualEntry(false); }} className="text-indigo-500" />
                 <span className="text-sm text-slate-300">Konu Çalışması / Fasikül</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                 <input type="radio" name="rType" value="youtube" checked={newBook.resourceType === 'youtube'} onChange={() => { setNewBook({...newBook, resourceType: 'youtube', globalBookId: '', name: ''}); setIsManualEntry(false); }} className="text-indigo-500" />
                 <span className="text-sm text-slate-300">YouTube Kanalı / Video</span>
              </label>
           </div>

           <div className="grid grid-cols-1 md:grid-cols-5 gap-6 items-end">
                {/* YouTube selects are always shown if youtube */}
                {newBook.resourceType === 'youtube' ? (
                  <>
                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest pl-1">Alan türü</label>
                      <select 
                        value={newBook.type}
                        onChange={(e) => setNewBook({...newBook, type: e.target.value as any})}
                        className="w-full bg-slate-900 border border-white/10 rounded-xl py-3 px-4 text-xs text-white outline-none"
                      >
                        <option value="TYT">TYT</option>
                        {(!isAraSinif) && <option value="AYT">AYT</option>}
                        <option value="9. Sınıf">9. Sınıf</option>
                        <option value="10. Sınıf">10. Sınıf</option>
                        <option value="11. Sınıf">11. Sınıf</option>
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
                          <option key={s} value={s}>{formatSubjectName(s, newBook.type)}</option>
                        ))}
                      </select>
                    </div>
                    <div className="md:col-span-2 space-y-2">
                      <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest pl-1">
                        YouTube Kanalı Seçin
                      </label>
                      <div className="flex flex-col sm:flex-row gap-2">
                        <select
                          value={selectedYoutubeChannel}
                          onChange={(e) => setSelectedYoutubeChannel(e.target.value)}
                          className="flex-1 bg-slate-900 border border-white/10 rounded-xl py-3 px-4 text-xs text-white outline-none focus:border-indigo-500/50 cursor-pointer"
                        >
                          {getYoutubeChannels(newBook.subject).map(channel => (
                            <option key={channel} value={channel}>{channel}</option>
                          ))}
                          <option value="Diğer (Manuel Giriş)">Diğer (Manuel Giriş)</option>
                        </select>
                        {selectedYoutubeChannel === 'Diğer (Manuel Giriş)' && (
                          <input 
                            type="text"
                            placeholder="Kanal adını giriniz..."
                            value={customYoutubeChannel}
                            onChange={e => setCustomYoutubeChannel(e.target.value)}
                            className="flex-1 bg-slate-900 border border-white/10 rounded-xl py-3 px-4 text-xs text-white outline-none focus:border-indigo-500/50"
                            autoFocus
                          />
                        )}
                      </div>
                    </div>
                    <button 
                      onClick={handleAddBook}
                      className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-3 px-6 rounded-xl transition-all flex items-center justify-center gap-2"
                    >
                      <Plus size={16} /> Kanal Ekle
                    </button>
                  </>
                ) : (
                  <>
                    {!isManualEntry ? (
                      // Only show ISBN input
                      <>
                        <div className="md:col-span-4 space-y-2">
                          <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest pl-1">
                            ISBN Numarası (Barkod)
                          </label>
                          <input 
                            type="text"
                            placeholder="ISBN giriniz veya barkod okutunuz..."
                            value={newBook.isbn}
                            onChange={e => setNewBook({...newBook, isbn: e.target.value})}
                            onKeyDown={e => {
                               if (e.key === 'Enter') handleAddBook();
                            }}
                            className="w-full bg-slate-900 border border-white/10 rounded-xl py-3 px-4 text-xs text-white outline-none focus:border-indigo-500/50"
                            autoFocus
                          />
                        </div>
                        <button 
                          onClick={handleAddBook}
                          className="bg-indigo-600 hover:bg-indigo-500 text-white font-bold py-3 px-6 rounded-xl transition-all flex items-center justify-center gap-2"
                        >
                          Sorgula / Ekle
                        </button>
                      </>
                    ) : (
                      // Manual Entry Fields
                      <>
                        <div className="space-y-2">
                          <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest pl-1">Alan türü</label>
                          <select 
                            value={newBook.type}
                            onChange={(e) => setNewBook({...newBook, type: e.target.value as any})}
                            className="w-full bg-slate-900 border border-white/10 rounded-xl py-3 px-4 text-xs text-white outline-none"
                          >
                            <option value="TYT">TYT</option>
                            {(!isAraSinif) && <option value="AYT">AYT</option>}
                            <option value="9. Sınıf">9. Sınıf</option>
                            <option value="10. Sınıf">10. Sınıf</option>
                            <option value="11. Sınıf">11. Sınıf</option>
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
                              <option key={s} value={s}>{formatSubjectName(s, newBook.type)}</option>
                            ))}
                          </select>
                        </div>
                        <div className="md:col-span-2 space-y-2">
                          <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest pl-1">
                            Kaynak Adı (Sistemde Bulunamadı - ISBN: {newBook.isbn})
                          </label>
                          <div className="flex flex-col sm:flex-row gap-2">
                            <input 
                              type="text"
                              placeholder="Örn: 3D Yayınları TYT Matematik"
                              value={newBook.name}
                              onChange={(e) => setNewBook({...newBook, name: e.target.value})}
                              className="flex-1 bg-slate-900 border border-white/10 rounded-xl py-3 px-4 text-xs text-white outline-none focus:border-red-500/50 border-red-500/30"
                              autoFocus
                            />
                            <button
                              onClick={() => {
                                setIsManualEntry(false);
                                setNewBook({ ...newBook, name: '' });
                              }}
                              className="bg-white/5 hover:bg-white/10 text-white rounded-xl py-3 px-4 text-xs transition-colors whitespace-nowrap"
                            >
                              Geri
                            </button>
                          </div>
                        </div>
                        <button 
                          onClick={handleAddBook}
                          className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-3 px-6 rounded-xl transition-all flex items-center justify-center gap-2"
                        >
                          <Save size={16} /> Kaydet
                        </button>
                      </>
                    )}
                  </>
                )}
              </div>
            </div>

            {/* Book List Tabs */}
            <div className="flex bg-slate-900 border border-white/5 rounded-xl p-1 mb-6">
               <button 
                  onClick={() => { setActiveTab('soru'); setSubjectFilter('Hepsi'); }}
                  className={`flex-1 flex items-center justify-center gap-2 py-2 text-xs font-bold rounded-lg transition-all ${activeTab === 'soru' ? 'bg-indigo-500 text-white shadow' : 'text-slate-400 hover:text-white hover:bg-white/5'}`}
               >
                  Soru Bankası
               </button>
               <button 
                  onClick={() => { setActiveTab('youtube'); setSubjectFilter('Hepsi'); }}
                  className={`flex-1 flex items-center justify-center gap-2 py-2 text-xs font-bold rounded-lg transition-all ${activeTab === 'youtube' ? 'bg-red-500 text-white shadow' : 'text-slate-400 hover:text-white hover:bg-white/5'}`}
               >
                  YouTube Kanalı
               </button>
               <button 
                  onClick={() => { setActiveTab('konu'); setSubjectFilter('Hepsi'); }}
                  className={`flex-1 flex items-center justify-center gap-2 py-2 text-xs font-bold rounded-lg transition-all ${activeTab === 'konu' ? 'bg-orange-500 text-white shadow' : 'text-slate-400 hover:text-white hover:bg-white/5'}`}
               >
                  Konu Çalışması
               </button>
            </div>

            {/* Subject Filter */}
            {books.filter(b => (b.resourceType || 'soru') === activeTab).length > 0 && (
              <div className="mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-900/20 p-4 rounded-xl border border-white/5">
                <div className="flex items-center gap-2 text-slate-300">
                  <BookOpen size={18} className="text-indigo-400" />
                  <span className="font-bold text-sm tracking-wide">
                    {activeTab === 'soru' ? 'Soru Bankaları' : activeTab === 'youtube' ? 'YouTube Kanalları' : 'Konu Çalışmaları'}
                  </span>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Branş Filtresi</span>
                  <select 
                    value={subjectFilter}
                    onChange={(e) => setSubjectFilter(e.target.value)}
                    className="bg-slate-800 border border-slate-700 rounded-lg py-2 px-3 text-sm text-white font-medium outline-none focus:border-indigo-500 cursor-pointer min-w-[140px]"
                  >
                    <option value="Hepsi">Tüm Branşlar</option>
                    {Array.from(new Set(books.filter(b => (b.resourceType || 'soru') === activeTab).map(b => b.subject))).sort().map(subj => {
                      const sampleBook = books.find(b => b.subject === subj);
                      return (
                        <option key={subj as string} value={subj as string}>
                          {formatSubjectName(subj as string, sampleBook?.type || 'TYT')}
                        </option>
                      );
                    })}
                  </select>
                </div>
              </div>
            )}

            {/* Auto Sync Info Banner */}
            <div className="mb-6 p-4 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 flex items-center gap-3 text-xs text-indigo-300">
              <Sparkles size={20} className="text-indigo-400 shrink-0 animate-pulse" />
              <div>
                <span className="font-bold text-white block">Otomatik Konu Takibi Entegrasyonu</span>
                <span className="text-slate-300">Öğrenci haftalık ders programında bu kitaptan bir konuyu/görevi tamamladığında, buradaki konu işaretlemesi <strong>otomatik olarak</strong> gerçekleşir.</span>
              </div>
            </div>

            {/* Book List */}
            <div id="tour-data-entry-list" className="grid grid-cols-1 gap-6">
              {books
                .filter(b => (b.resourceType || 'soru') === activeTab)
                .filter(b => subjectFilter === 'Hepsi' || b.subject === subjectFilter)
                .sort((a, b) => (a.order || 0) - (b.order || 0))
                .map((book) => {
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
                            <span className="text-[10px] font-black text-emerald-400 uppercase tracking-widest">{formatSubjectName(book.subject, book.type)}</span>
                            <span className="text-[10px] font-bold text-slate-600">•</span>
                            <span className={`text-[10px] font-black uppercase tracking-widest px-1.5 py-0.5 rounded ${book.resourceType === 'youtube' ? 'bg-red-500/10 text-red-500' : book.resourceType === 'konu' ? 'bg-orange-500/10 text-orange-500' : 'bg-slate-500/10 text-slate-400'}`}>
                               {book.resourceType === 'youtube' ? 'YOUTUBE' : book.resourceType === 'konu' ? 'KONU' : 'SORU'}
                            </span>
                            <span className="text-[10px] font-bold text-slate-600">•</span>
                            <span className="text-[10px] font-bold text-slate-500 uppercase">{completedCount} / {allTopics.length} Konu</span>
                          </div>
                          <h4 className="text-lg font-bold text-white mt-1 uppercase">{book.bookName}</h4>
                          {book.isbn && <p className="text-xs font-medium text-slate-500 mt-0.5">ISBN: {book.isbn}</p>}
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-8">
                        <div className="text-right hidden sm:block">
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
                        <div className="flex items-center gap-4">
                            {subjectFilter !== 'Hepsi' && (
                                <div className="flex flex-col gap-1 mr-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                    <button 
                                        onClick={(e) => handleMoveBook(e, book, 'up')}
                                        className="text-slate-500 hover:text-indigo-400 transition-colors p-1"
                                        title="Yukarı Taşı"
                                    >
                                        <ArrowUp size={16} />
                                    </button>
                                    <button 
                                        onClick={(e) => handleMoveBook(e, book, 'down')}
                                        className="text-slate-500 hover:text-indigo-400 transition-colors p-1"
                                        title="Aşağı Taşı"
                                    >
                                        <ArrowDown size={16} />
                                    </button>
                                </div>
                            )}
                            <button 
                                onClick={(e) => { e.stopPropagation(); handleDeleteBook(book.id); }}
                                className="text-slate-500 hover:text-red-500 transition-colors p-2"
                                title="Kaynağı Sil"
                            >
                                <Trash2 size={20} />
                            </button>
                            {expandedBook === book.id ? <ChevronUp className="text-slate-500" /> : <ChevronDown className="text-slate-500" />}
                        </div>
                      </div>
                    </div>

                    <AnimatePresence>
                      {expandedBook === book.id && (
                        <motion.div 
                          initial={{ height: 0 }}
                          animate={{ height: 'auto' }}
                          exit={{ height: 0 }}
                          className="overflow-hidden bg-black/20 border-t border-white/5"
                        >
                          <div className="p-6">
                            <div className="flex items-center justify-between mb-4 pb-2 border-b border-white/5">
                              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-2">
                                <Sparkles size={14} className="text-emerald-400" />
                                Konu Takip Listesi ({completedCount} / {allTopics.length} Tamamlandı)
                              </span>
                              <span className="text-[10px] text-slate-500 italic">
                                Haftalık programda tamamlanan konular otomatik işaretlenir
                              </span>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                              {allTopics.map((topic: string) => {
                                const isCompleted = (book.completedTopics || []).includes(topic);
                                return (
                                  <button
                                    key={topic}
                                    onClick={() => toggleTopic(book, topic)}
                                    className={`
                                      flex items-center justify-between p-3.5 rounded-2xl border transition-all text-left group/topic
                                      ${isCompleted 
                                        ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400 shadow-sm' 
                                        : 'bg-white/5 border-white/5 text-slate-400 hover:border-white/20 hover:text-white'
                                      }
                                    `}
                                  >
                                    <div className="flex items-center gap-3">
                                      <div className={`
                                        w-5 h-5 rounded-md border flex items-center justify-center transition-all shrink-0
                                        ${isCompleted ? 'bg-emerald-500 border-emerald-500 text-slate-950' : 'border-white/20 group-hover/topic:border-white/40'}
                                      `}>
                                        {isCompleted && <CheckCircle2 size={14} className="stroke-[3]" />}
                                      </div>
                                      <span className="text-xs font-bold leading-tight">{topic}</span>
                                    </div>
                                    {isCompleted && (
                                      <span className="text-[9px] font-black uppercase tracking-widest px-2 py-0.5 rounded-md bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 shrink-0">
                                        Tamamlandı
                                      </span>
                                    )}
                                  </button>
                                );
                              })}
                            </div>
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
