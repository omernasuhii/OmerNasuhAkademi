import React, { useState, useEffect } from 'react';
import { useAuth } from '../../lib/AuthContext';
import { studentDataService } from '../../services/studentDataService';
import { useCurriculum } from '../../lib/CurriculumContext';
import { formatSubjectName } from '../coach/StudentProgram';
import { 
  BookOpen, 
  CheckCircle2, 
  ChevronDown, 
  ChevronUp, 
  Search, 
  Filter, 
  Youtube, 
  FileText, 
  Sparkles, 
  ExternalLink,
  Layers,
  ChevronRight
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

export default function BookTrackingDetail() {
  const { user, userData } = useAuth();
  const currentUid = userData?.uid || user?.uid;
  const { curriculum: CURRICULUM, subtopics: SUBTOPICS_MAP } = useCurriculum();
  const [books, setBooks] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedBook, setExpandedBook] = useState<string | null>(null);
  const [expandedSubtopics, setExpandedSubtopics] = useState<Record<string, boolean>>({});
  const [searchTerm, setSearchTerm] = useState('');
  const [filterSubject, setFilterSubject] = useState('Hepsi');
  const [activeTab, setActiveTab] = useState('soru');

  const mergeBookData = (trackerList: any[], globalList: any[]) => {
    return trackerList.map((tb: any) => {
      let extraInfo: any = {};
      const gb = globalList.find((g: any) => 
        (tb.globalBookId && g.id === tb.globalBookId) ||
        (tb.isbn && g.isbn && g.isbn.trim().toLowerCase() === tb.isbn.trim().toLowerCase()) ||
        ((g.name || '').trim().toLowerCase() === (tb.bookName || '').trim().toLowerCase() && (g.subject || '').trim().toLowerCase() === (tb.subject || '').trim().toLowerCase()) ||
        (tb.resourceType === 'youtube' && g.resourceType === 'youtube' && (
          (g.channelTitle && tb.bookName && g.channelTitle.toLowerCase().includes(tb.bookName.toLowerCase())) ||
          (g.name && tb.bookName && g.name.toLowerCase().includes(tb.bookName.toLowerCase()))
        ) && (g.subject || '').toLowerCase() === (tb.subject || '').toLowerCase())
      );
      if (gb) {
        extraInfo = {
          videos: (tb.videos && tb.videos.length > 0) ? tb.videos : (gb.videos || []),
          channelTitle: gb.channelTitle || tb.channelTitle || '',
          totalVideos: gb.totalVideos || (gb.videos?.length || 0) || tb.totalVideos || 0,
          totalDurationFormatted: gb.totalDurationFormatted || tb.totalDurationFormatted || '',
          totalDurationMinutes: gb.totalDurationMinutes || tb.totalDurationMinutes || 0,
          topicQuestionCounts: (gb as any).topicQuestionCounts || tb.topicQuestionCounts || {}
        };
      }
      return {
        ...tb,
        ...extraInfo
      };
    });
  };

  const getBookVideos = (book: any) => {
    if (book.resourceType === 'youtube' || (book.videos && book.videos.length > 0)) {
      const vids = book.videos || [];
      if (vids.length > 0) {
        return vids.map((v: any, idx: number) => ({
          id: v.videoId || `vid-${idx}`,
          title: typeof v === 'string' ? v : (v.title || `Video ${idx + 1}`),
          duration: typeof v === 'object' ? (v.durationFormatted || (v.durationMinutes ? `${v.durationMinutes} dk` : '')) : '',
          url: typeof v === 'object' ? (v.url || (v.videoId ? `https://www.youtube.com/watch?v=${v.videoId}` : '')) : '',
          order: typeof v === 'object' && v.order ? v.order : idx + 1,
          isVideo: true
        }));
      }
    }
    return [];
  };

  const calculateBookProgress = (book: any, completedTopics: string[] = []) => {
    const isYoutube = book.resourceType === 'youtube' || (book.videos && book.videos.length > 0);
    const validCompletedTopics = Array.isArray(completedTopics) ? completedTopics : [];

    if (isYoutube) {
      const vids = getBookVideos(book) || [];
      if (vids.length === 0) return 0;
      const doneCount = vids.filter(v => v && validCompletedTopics.includes(v.title)).length;
      return Math.min(100, Math.round((doneCount / vids.length) * 100));
    }

    const curriculumTopics = CURRICULUM[book.subject as keyof typeof CURRICULUM] || [];
    if (curriculumTopics.length === 0) return 0;

    let totalWeight = 0;
    curriculumTopics.forEach((topic: string) => {
      const subs = SUBTOPICS_MAP?.[topic] || [];
      if (subs.length > 0) {
        const doneSubs = subs.filter(s => validCompletedTopics.includes(s)).length;
        if (validCompletedTopics.includes(topic) || doneSubs === subs.length) {
          totalWeight += 1;
        } else {
          totalWeight += doneSubs / subs.length;
        }
      } else {
        if (validCompletedTopics.includes(topic)) {
          totalWeight += 1;
        }
      }
    });

    return Math.min(100, Math.round((totalWeight / curriculumTopics.length) * 100));
  };

  useEffect(() => {
    if (currentUid) {
      Promise.all([
        studentDataService.getBookTracking(currentUid),
        studentDataService.getGlobalBooks()
      ]).then(([trackerData, globalBooksData]) => {
        const merged = mergeBookData(trackerData, globalBooksData);
        setBooks(merged);
        if (merged && merged.length > 0) {
          setExpandedBook(merged[0].id);
        }
        setLoading(false);
      });
    }
  }, [currentUid]);

  const getTaskXP = (type: string) => {
    switch (type) {
      case 'youtube': return 4;
      case 'konu': return 6;
      default: return 20;
    }
  };

  // Toggle Video (for YouTube sources)
  const toggleVideo = async (book: any, videoTitle: string) => {
    const currentTopics = book.completedTopics || [];
    const isNowCompleted = !currentTopics.includes(videoTitle);
    const updatedTopics = isNowCompleted
      ? [...currentTopics, videoTitle]
      : currentTopics.filter((t: string) => t !== videoTitle);

    if (currentUid) {
      studentDataService.awardXP(
        currentUid,
        isNowCompleted ? getTaskXP(book.resourceType) : -getTaskXP(book.resourceType),
        isNowCompleted ? 'Video Tamamlandı' : 'Video İptal Edildi'
      );
    }

    const percentage = calculateBookProgress(book, updatedTopics);

    await studentDataService.updateBookProgress(book.id, {
      ...book,
      completedTopics: updatedTopics,
      completionPercentage: percentage
    });

    setBooks(prev => prev.map(b => b.id === book.id ? { ...b, completedTopics: updatedTopics, completionPercentage: percentage } : b));
  };

  // Toggle Main Topic and its subtopics
  const toggleMainTopic = async (book: any, topic: string, subtopics: string[]) => {
    const currentTopics = book.completedTopics || [];
    const isTopicCompleted = currentTopics.includes(topic) || (subtopics.length > 0 && subtopics.every(s => currentTopics.includes(s)));
    
    let updatedTopics: string[];
    if (isTopicCompleted) {
      // Unmark main topic and all its subtopics
      const toRemove = new Set([topic, ...subtopics]);
      updatedTopics = currentTopics.filter(t => !toRemove.has(t));
      if (currentUid) {
        studentDataService.awardXP(currentUid, -getTaskXP(book.resourceType), 'Konu İptal Edildi');
      }
    } else {
      // Mark main topic and all its subtopics
      const toAdd = [topic, ...subtopics];
      updatedTopics = Array.from(new Set([...currentTopics, ...toAdd]));
      if (currentUid) {
        studentDataService.awardXP(currentUid, getTaskXP(book.resourceType), 'Konu Tamamlandı');
      }
    }

    const percentage = calculateBookProgress(book, updatedTopics);

    await studentDataService.updateBookProgress(book.id, {
      ...book,
      completedTopics: updatedTopics,
      completionPercentage: percentage
    });

    setBooks(prev => prev.map(b => b.id === book.id ? { ...b, completedTopics: updatedTopics, completionPercentage: percentage } : b));
  };

  // Toggle Single Subtopic
  const toggleSubtopic = async (book: any, mainTopic: string, subtopic: string, allSubtopics: string[]) => {
    const currentTopics = book.completedTopics || [];
    const isSubCompleted = currentTopics.includes(subtopic);
    
    let updatedTopics: string[];
    if (isSubCompleted) {
      // Remove subtopic and also remove mainTopic flag
      updatedTopics = currentTopics.filter(t => t !== subtopic && t !== mainTopic);
    } else {
      // Add subtopic
      const newSubs = [...currentTopics, subtopic];
      // Check if all subtopics are now done
      const allDone = allSubtopics.every(s => s === subtopic || newSubs.includes(s));
      if (allDone) {
        updatedTopics = Array.from(new Set([...newSubs, mainTopic]));
      } else {
        updatedTopics = newSubs;
      }
    }

    const percentage = calculateBookProgress(book, updatedTopics);

    await studentDataService.updateBookProgress(book.id, {
      ...book,
      completedTopics: updatedTopics,
      completionPercentage: percentage
    });

    setBooks(prev => prev.map(b => b.id === book.id ? { ...b, completedTopics: updatedTopics, completionPercentage: percentage } : b));
  };

  // Toggle Expand Subtopics for a specific topic
  const toggleSubtopicsExpand = (bookId: string, topic: string) => {
    const key = `${bookId}-${topic}`;
    setExpandedSubtopics(prev => ({ ...prev, [key]: !prev[key] }));
  };

  // Toggle all subtopics expand for a book
  const toggleAllSubtopicsExpand = (book: any, expand: boolean) => {
    const curriculumTopics = CURRICULUM[book.subject as keyof typeof CURRICULUM] || [];
    const updates: Record<string, boolean> = {};
    curriculumTopics.forEach((t: string) => {
      updates[`${book.id}-${t}`] = expand;
    });
    setExpandedSubtopics(prev => ({ ...prev, ...updates }));
  };

  const filteredBooks = (books || []).filter(book => {
    if (!book) return false;
    const bookName = book.bookName || '';
    const subject = book.subject || '';
    const matchesSearch = bookName.toLowerCase().includes(searchTerm.toLowerCase()) || 
                         subject.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         (book.isbn && String(book.isbn).includes(searchTerm));
    const matchesFilter = filterSubject === 'Hepsi' || subject === filterSubject;
    const matchesTab = (book.resourceType || 'soru') === activeTab;
    return matchesSearch && matchesFilter && matchesTab;
  });

  const subjects = ['Hepsi', ...new Set((books || []).map(b => b?.subject).filter(Boolean))];

  if (loading) return <div className="text-center py-20 animate-pulse text-slate-500 italic">Konular Yükleniyor...</div>;

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-20">
      <div>
        <h1 className="text-3xl font-bold italic text-white uppercase tracking-tight">KİTAP VE KONU TAKİBİ</h1>
        <p className="text-slate-500 mt-1">Tüm derslerinizdeki ilerlemenizi ana konular ve detaylı alt başlıklar üzerinden takip edebilirsiniz.</p>
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
              <option key={s} value={s}>{s === 'Hepsi' ? s : formatSubjectName(s)}</option>
            ))}
          </select>
        </div>
      </div>

      <div className="flex bg-slate-900 border border-white/5 rounded-xl p-1 mb-6">
         <button 
            onClick={() => setActiveTab('soru')}
            className={`flex-1 flex items-center justify-center gap-2 py-3 text-sm font-bold rounded-lg transition-all ${activeTab === 'soru' ? 'bg-indigo-500 text-white shadow' : 'text-slate-400 hover:text-white hover:bg-white/5'}`}
         >
            Soru Bankası
         </button>
         <button 
            onClick={() => setActiveTab('youtube')}
            className={`flex-1 flex items-center justify-center gap-2 py-3 text-sm font-bold rounded-lg transition-all ${activeTab === 'youtube' ? 'bg-red-500 text-white shadow' : 'text-slate-400 hover:text-white hover:bg-white/5'}`}
         >
            YouTube Kanalı
         </button>
         <button 
            onClick={() => setActiveTab('konu')}
            className={`flex-1 flex items-center justify-center gap-2 py-3 text-sm font-bold rounded-lg transition-all ${activeTab === 'konu' ? 'bg-orange-500 text-white shadow' : 'text-slate-400 hover:text-white hover:bg-white/5'}`}
         >
            Konu Çalışması
         </button>
      </div>

      {/* Auto Sync Info Banner */}
      <div className="p-4 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 flex items-center gap-3 text-xs text-indigo-300">
        <Sparkles size={20} className="text-indigo-400 shrink-0 animate-pulse" />
        <div>
          <span className="font-bold text-white block">Ana Başlık & Alt Başlık Takip Sistemi</span>
          <span className="text-slate-300">
            Konuların önce ana başlıklarını görebilir, dilediğinizde alt başlıkları açarak detaylı takip yapabilirsiniz. Programda tamamlanan görevler buraya otomatik yansır.
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6">
        {filteredBooks.map((book) => {
          const isYoutube = book.resourceType === 'youtube' || (book.videos && book.videos.length > 0);
          const videos = isYoutube ? getBookVideos(book) : [];
          const curriculumTopics = !isYoutube ? (CURRICULUM[book.subject as keyof typeof CURRICULUM] || []) : [];
          const completedTopicsList = book.completedTopics || [];

          // Calculate completed main topics count
          let completedMainCount = 0;
          if (!isYoutube) {
            curriculumTopics.forEach((t: string) => {
              const subs = SUBTOPICS_MAP?.[t] || [];
              if (completedTopicsList.includes(t) || (subs.length > 0 && subs.every(s => completedTopicsList.includes(s)))) {
                completedMainCount++;
              }
            });
          } else {
            completedMainCount = videos.filter(v => completedTopicsList.includes(v.title)).length;
          }

          const totalItemsCount = isYoutube ? videos.length : curriculumTopics.length;
          
          return (
            <div key={book.id} className="bg-slate-900/40 border border-white/5 rounded-3xl overflow-hidden group">
              <div 
                className="p-6 flex items-center justify-between cursor-pointer hover:bg-white/5 transition-all"
                onClick={() => setExpandedBook(expandedBook === book.id ? null : book.id)}
              >
                <div className="flex items-center gap-6">
                  <div className={`flex items-center justify-center p-3 rounded-2xl w-12 h-12 ${isYoutube ? 'bg-red-500/10 text-red-500' : book.resourceType === 'konu' ? 'bg-orange-500/10 text-orange-400' : 'bg-indigo-500/10 text-indigo-400'}`}>
                    {isYoutube ? <Youtube size={24} /> : book.resourceType === 'konu' ? <FileText size={24} /> : <BookOpen size={24} />}
                  </div>
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-[10px] font-black text-emerald-400 uppercase tracking-widest">{formatSubjectName(book.subject, book.type)}</span>
                      <span className="text-[10px] font-bold text-slate-600">•</span>
                      <span className={`text-[10px] font-black uppercase tracking-widest px-1.5 py-0.5 rounded ${isYoutube ? 'bg-red-500/10 text-red-500' : book.resourceType === 'konu' ? 'bg-orange-500/10 text-orange-500' : 'bg-slate-500/10 text-slate-400'}`}>
                         {isYoutube ? 'YOUTUBE' : book.resourceType === 'konu' ? 'KONU' : 'SORU'}
                      </span>
                      <span className="text-[10px] font-bold text-slate-600">•</span>
                      <span className="text-[10px] font-bold text-slate-500 uppercase">{completedMainCount} / {totalItemsCount} {isYoutube ? 'Video' : 'Ana Konu'}</span>
                      {isYoutube && book.totalDurationFormatted && (
                        <>
                          <span className="text-[10px] font-bold text-slate-600">•</span>
                          <span className="text-[10px] font-semibold text-slate-400">{book.totalDurationFormatted}</span>
                        </>
                      )}
                    </div>
                    <h4 className="text-lg font-bold text-white mt-1 uppercase">{book.bookName}</h4>
                    {isYoutube && book.channelTitle && book.channelTitle !== book.bookName && (
                      <p className="text-xs font-semibold text-red-400/80 mt-0.5">{book.channelTitle}</p>
                    )}
                    {book.isbn && !book.isbn.startsWith('youtube_') && <p className="text-xs font-medium text-slate-500 mt-0.5">ISBN: {book.isbn}</p>}
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
                    className="overflow-hidden bg-black/20 border-t border-white/5"
                  >
                    <div className="p-6">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-5 pb-3 border-b border-white/5">
                        <div className="flex items-center gap-2">
                          <Sparkles size={16} className="text-emerald-400" />
                          <span className="text-xs font-bold text-slate-300 uppercase tracking-wider">
                            {isYoutube ? 'Video / Kamp Takip Listesi' : 'Ana Konu & Alt Başlık Takibi'}
                          </span>
                          <span className="text-[11px] font-semibold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
                            {completedMainCount} / {totalItemsCount} Tamamlandı
                          </span>
                        </div>

                        {!isYoutube && (
                          <div className="flex items-center gap-2">
                            <button
                              type="button"
                              onClick={(e) => { e.stopPropagation(); toggleAllSubtopicsExpand(book, true); }}
                              className="text-[11px] font-bold text-slate-400 hover:text-white px-2.5 py-1 rounded-lg bg-white/5 hover:bg-white/10 border border-white/5 transition-colors flex items-center gap-1"
                            >
                              <Layers size={13} className="text-indigo-400" /> Tüm Alt Başlıkları Aç
                            </button>
                            <button
                              type="button"
                              onClick={(e) => { e.stopPropagation(); toggleAllSubtopicsExpand(book, false); }}
                              className="text-[11px] font-bold text-slate-400 hover:text-white px-2.5 py-1 rounded-lg bg-white/5 hover:bg-white/10 border border-white/5 transition-colors"
                            >
                              Kapat
                            </button>
                          </div>
                        )}
                      </div>

                      {/* YouTube Video List */}
                      {isYoutube && (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                          {videos.map((vid: any) => {
                            const isCompleted = completedTopicsList.includes(vid.title);
                            return (
                              <div
                                key={vid.id}
                                onClick={() => toggleVideo(book, vid.title)}
                                className={`
                                  flex items-center justify-between p-3.5 rounded-2xl border transition-all text-left group/topic cursor-pointer
                                  ${isCompleted 
                                    ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400 shadow-sm' 
                                    : 'bg-white/5 border-white/5 text-slate-400 hover:border-white/20 hover:text-white'
                                  }
                                `}
                              >
                                <div className="flex items-center gap-3 min-w-0 pr-2">
                                  <div className={`
                                    w-5 h-5 rounded-md border flex items-center justify-center transition-all shrink-0
                                    ${isCompleted ? 'bg-emerald-500 border-emerald-500 text-slate-950' : 'border-white/20 group-hover/topic:border-white/40'}
                                  `}>
                                    {isCompleted && <CheckCircle2 size={14} className="stroke-[3]" />}
                                  </div>
                                  <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-white/5 text-slate-400 shrink-0">
                                    #{vid.order}
                                  </span>
                                  <span className="text-xs font-bold leading-tight truncate">{vid.title}</span>
                                </div>
                                <div className="flex items-center gap-2 shrink-0">
                                  {vid.duration && (
                                    <span className="text-[10px] font-semibold text-slate-500 bg-white/5 px-1.5 py-0.5 rounded">
                                      {vid.duration}
                                    </span>
                                  )}
                                  {vid.url && (
                                    <a 
                                      href={vid.url} 
                                      target="_blank" 
                                      rel="noopener noreferrer"
                                      onClick={(e) => e.stopPropagation()}
                                      className="text-slate-500 hover:text-red-400 p-1 transition-colors"
                                      title="YouTube'da Aç"
                                    >
                                      <ExternalLink size={13} />
                                    </a>
                                  )}
                                  {isCompleted && (
                                    <span className="text-[9px] font-black uppercase tracking-widest px-2 py-0.5 rounded-md bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                                      Tamamlandı
                                    </span>
                                  )}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      )}

                      {/* Standard Book Curriculum Topics with Subtopics */}
                      {!isYoutube && (
                        <div className="space-y-3">
                          {curriculumTopics.map((topic: string, idx: number) => {
                            const subtopics = SUBTOPICS_MAP?.[topic] || [];
                            const doneSubCount = subtopics.filter(s => completedTopicsList.includes(s)).length;
                            const isTopicCompleted = completedTopicsList.includes(topic) || (subtopics.length > 0 && doneSubCount === subtopics.length);
                            const isPartial = !isTopicCompleted && doneSubCount > 0;
                            const isExpanded = expandedSubtopics[`${book.id}-${topic}`] || false;

                            return (
                              <div 
                                key={`${book.id}-${topic}-${idx}`}
                                className={`
                                  rounded-2xl border transition-all overflow-hidden
                                  ${isTopicCompleted
                                    ? 'bg-emerald-500/5 border-emerald-500/20'
                                    : isPartial
                                      ? 'bg-amber-500/5 border-amber-500/20'
                                      : 'bg-white/5 border-white/5'
                                  }
                                `}
                              >
                                {/* Main Topic Header */}
                                <div className="p-3.5 flex items-center justify-between gap-3 select-none">
                                  <div 
                                    className="flex items-center gap-3 min-w-0 flex-1 cursor-pointer"
                                    onClick={() => toggleMainTopic(book, topic, subtopics)}
                                  >
                                    <div className={`
                                      w-5 h-5 rounded-md border flex items-center justify-center transition-all shrink-0
                                      ${isTopicCompleted 
                                        ? 'bg-emerald-500 border-emerald-500 text-slate-950' 
                                        : isPartial
                                          ? 'bg-amber-500/20 border-amber-500 text-amber-400'
                                          : 'border-white/20 hover:border-white/40'
                                      }
                                    `}>
                                      {isTopicCompleted && <CheckCircle2 size={14} className="stroke-[3]" />}
                                      {isPartial && <span className="text-[11px] font-black leading-none">•</span>}
                                    </div>
                                    <span className="text-[11px] font-mono text-slate-500 shrink-0">
                                      #{idx + 1}
                                    </span>
                                    <span className={`text-xs font-bold leading-tight truncate ${isTopicCompleted ? 'text-emerald-300' : 'text-white'}`}>
                                      {topic}
                                    </span>
                                  </div>

                                  {/* Right Action & Subtopic Expand Button */}
                                  <div className="flex items-center gap-2 shrink-0">
                                    {subtopics.length > 0 ? (
                                      <button
                                        type="button"
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          toggleSubtopicsExpand(book.id, topic);
                                        }}
                                        className={`
                                          flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all
                                          ${isTopicCompleted
                                            ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                                            : isPartial
                                              ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                                              : 'bg-white/5 hover:bg-white/10 text-slate-300 border border-white/10'
                                          }
                                        `}
                                      >
                                        <Layers size={12} className={isTopicCompleted ? 'text-emerald-400' : 'text-indigo-400'} />
                                        <span>
                                          {isTopicCompleted
                                            ? 'Tamamlandı'
                                            : isPartial
                                              ? `${doneSubCount}/${subtopics.length} Alt Başlık`
                                              : `${subtopics.length} Alt Başlık`
                                          }
                                        </span>
                                        {isExpanded ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
                                      </button>
                                    ) : (
                                      isTopicCompleted && (
                                        <span className="text-[9px] font-black uppercase tracking-widest px-2 py-0.5 rounded-md bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                                          Tamamlandı
                                        </span>
                                      )
                                    )}
                                  </div>
                                </div>

                                {/* Expanded Subtopics List */}
                                <AnimatePresence>
                                  {isExpanded && subtopics.length > 0 && (
                                    <motion.div
                                      initial={{ height: 0, opacity: 0 }}
                                      animate={{ height: 'auto', opacity: 1 }}
                                      exit={{ height: 0, opacity: 0 }}
                                      className="overflow-hidden border-t border-white/5 bg-black/40 px-4 py-3"
                                    >
                                      <div className="space-y-1.5 pl-3 border-l-2 border-indigo-500/30">
                                        <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                                          <ChevronRight size={12} className="text-indigo-400" />
                                          {topic} - Alt Başlıkları
                                        </div>
                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                                          {subtopics.map((sub: string, subIdx: number) => {
                                            const isSubDone = completedTopicsList.includes(sub) || isTopicCompleted;
                                            return (
                                              <div
                                                key={`${book.id}-${topic}-${sub}-${subIdx}`}
                                                onClick={() => toggleSubtopic(book, topic, sub, subtopics)}
                                                className={`
                                                  flex items-center justify-between p-2.5 rounded-xl border transition-all cursor-pointer text-left
                                                  ${isSubDone
                                                    ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-300'
                                                    : 'bg-white/5 border-white/5 text-slate-400 hover:border-white/20 hover:text-white'
                                                  }
                                                `}
                                              >
                                                <div className="flex items-center gap-2.5 min-w-0 pr-2">
                                                  <div className={`
                                                    w-4 h-4 rounded border flex items-center justify-center transition-all shrink-0
                                                    ${isSubDone ? 'bg-emerald-500 border-emerald-500 text-slate-950' : 'border-white/20'}
                                                  `}>
                                                    {isSubDone && <CheckCircle2 size={11} className="stroke-[3]" />}
                                                  </div>
                                                  <span className="text-[11px] font-medium leading-tight truncate">
                                                    {sub}
                                                  </span>
                                                </div>
                                                {isSubDone && (
                                                  <span className="text-[9px] font-bold text-emerald-400 shrink-0">
                                                    ✓
                                                  </span>
                                                )}
                                              </div>
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
                      )}
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
