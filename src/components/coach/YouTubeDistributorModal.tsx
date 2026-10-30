import React, { useState, useMemo, useEffect } from 'react';
import { 
  Youtube, 
  Sparkles, 
  Calendar, 
  Clock, 
  CheckCircle2, 
  ChevronRight, 
  X, 
  Layers, 
  Play, 
  Check, 
  AlertCircle, 
  Filter, 
  Flame, 
  Settings2,
  Trash2,
  Plus
} from 'lucide-react';
import { CURATED_PLAYLIST_CHANNELS } from '../../constants/curatedPlaylists';

export interface DayInfo {
  date: string;
  label: string;
  shortLabel: string;
  isToday?: boolean;
}

export interface YouTubeDistributorModalProps {
  isOpen: boolean;
  onClose: () => void;
  books?: any[];
  days?: DayInfo[];
  existingTasks?: any[];
  initialBookId?: string | null;
  onDistribute: (newTasks: any[], replaceExisting: boolean) => void;
  studentName?: string;
}

export const YouTubeDistributorModal: React.FC<YouTubeDistributorModalProps> = ({
  isOpen,
  onClose,
  books = [],
  days = [],
  existingTasks = [],
  initialBookId,
  onDistribute,
  studentName
}) => {
  const safeBooks = Array.isArray(books) ? books : [];
  const safeDays = Array.isArray(days) ? days : [];
  const safeExistingTasks = Array.isArray(existingTasks) ? existingTasks : [];

  // 1. Filter YouTube resources registered in student's personal resources
  const studentYouTubeBooks = useMemo(() => {
    return safeBooks
      .filter(b => Boolean(b && b.isStudentBook) && (b.resourceType === 'youtube' || (Array.isArray(b.videos) && b.videos.length > 0)))
      .sort((a, b) => (a.subject || '').localeCompare(b.subject || ''));
  }, [safeBooks]);

  // 2. Filter other channels & camps that have a registered playlist
  const otherPlaylistBooks = useMemo(() => {
    const studentBookIds = new Set(studentYouTubeBooks.map(b => b.id));
    const studentGlobalIds = new Set(studentYouTubeBooks.map(b => b.globalBookId).filter(Boolean));

    // Existing other books from database that have playlist videos
    const fromProps = safeBooks.filter(b => 
      b &&
      !b.isStudentBook && 
      !studentBookIds.has(b.id) && 
      (!b.globalBookId || !studentGlobalIds.has(b.globalBookId)) &&
      Array.isArray(b.videos) && 
      b.videos.length > 0
    );

    // Merge with curated default channels if not already present
    const existingTitles = new Set([
      ...studentYouTubeBooks.map(b => (b.bookName || '').trim().toLowerCase()),
      ...fromProps.map(b => (b.bookName || '').trim().toLowerCase())
    ]);

    const additionalCurated = (CURATED_PLAYLIST_CHANNELS || []).filter(c => {
      const titleKey = (c.bookName || '').trim().toLowerCase();
      return !existingTitles.has(titleKey);
    });

    return [...fromProps, ...additionalCurated].sort((a, b) => {
      const subjCompare = (a.subject || '').localeCompare(b.subject || '');
      if (subjCompare !== 0) return subjCompare;
      return (a.channelTitle || a.bookName || '').localeCompare(b.channelTitle || b.bookName || '');
    });
  }, [safeBooks, studentYouTubeBooks]);

  // Group other channels by subject for the dropdown menu
  const groupedOtherBooks = useMemo(() => {
    const map: Record<string, typeof otherPlaylistBooks> = {};
    (otherPlaylistBooks || []).forEach(b => {
      const subj = b.subject || 'Diğer Dersler';
      if (!map[subj]) map[subj] = [];
      map[subj].push(b);
    });
    return Object.keys(map).sort().map(subject => ({
      subject,
      books: (map[subject] || []).sort((a, b) => (a.bookName || '').localeCompare(b.bookName || ''))
    }));
  }, [otherPlaylistBooks]);

  // All eligible books (Student's books + other registered playlist channels)
  const allEligibleBooks = useMemo(() => {
    return [...(studentYouTubeBooks || []), ...(otherPlaylistBooks || [])];
  }, [studentYouTubeBooks, otherPlaylistBooks]);

  // Selected YouTube Resource
  const [selectedBookId, setSelectedBookId] = useState<string>('');

  // Sync initial selection when modal opens or initialBookId changes
  useEffect(() => {
    if (!isOpen) return;

    if (initialBookId && allEligibleBooks.some(b => b.id === initialBookId)) {
      setSelectedBookId(initialBookId);
    } else {
      setSelectedBookId(prev => {
        if (prev && allEligibleBooks.some(b => b.id === prev)) {
          return prev;
        }
        if (studentYouTubeBooks.length > 0) {
          return studentYouTubeBooks[0].id;
        }
        return otherPlaylistBooks.length > 0 ? otherPlaylistBooks[0].id : '';
      });
    }
  }, [isOpen, initialBookId, allEligibleBooks, studentYouTubeBooks, otherPlaylistBooks]);

  const selectedBook = useMemo(() => {
    return allEligibleBooks.find(b => b.id === selectedBookId) || null;
  }, [allEligibleBooks, selectedBookId]);

  const allVideos = useMemo(() => {
    if (!selectedBook || !Array.isArray(selectedBook.videos)) return [];
    return selectedBook.videos;
  }, [selectedBook]);

  // Auto-detect completed topics (from book.completedTopics or existing completed tasks)
  const completedVideoTitles = useMemo(() => {
    const titles = new Set<string>();
    if (selectedBook?.completedTopics && Array.isArray(selectedBook.completedTopics)) {
      selectedBook.completedTopics.forEach((t: string) => titles.add(t));
    }
    safeExistingTasks.forEach((t: any) => {
      if (t && t.bookId === selectedBookId && t.isDone && t.topic) {
        titles.add(t.topic);
      }
    });
    return titles;
  }, [selectedBook, safeExistingTasks, selectedBookId]);

  // Videos already planned in the current weekly schedule
  const currentWeekPlannedTitles = useMemo(() => {
    const titles = new Set<string>();
    safeExistingTasks.forEach((t: any) => {
      if (t && t.bookId === selectedBookId && t.topic) {
        titles.add(t.topic);
      }
    });
    return titles;
  }, [safeExistingTasks, selectedBookId]);

  // Settings
  const [skipCompleted, setSkipCompleted] = useState(true);
  const [startIndex, setStartIndex] = useState<number>(0);
  const [selectedDays, setSelectedDays] = useState<string[]>([]);
  const [videosPerDay, setVideosPerDay] = useState<number>(2);
  const [replaceExisting, setReplaceExisting] = useState<boolean>(false);
  const [customCoachNote, setCustomCoachNote] = useState<string>('');

  // When book changes, auto-detect the smart first uncompleted video
  useEffect(() => {
    if (!selectedBook || !allVideos || allVideos.length === 0) {
      setStartIndex(0);
      return;
    }

    // Find the first video that is NOT completed and NOT already planned this week
    const firstUnfinishedIdx = allVideos.findIndex((v: any) => {
      if (!v || !v.title) return false;
      const isDone = completedVideoTitles.has(v.title);
      const isPlanned = currentWeekPlannedTitles.has(v.title);
      return !isDone && !isPlanned;
    });

    if (firstUnfinishedIdx !== -1) {
      setStartIndex(firstUnfinishedIdx);
    } else {
      // If all are planned/done, find first not done, or 0
      const firstNotDone = allVideos.findIndex((v: any) => v && v.title && !completedVideoTitles.has(v.title));
      setStartIndex(firstNotDone !== -1 ? firstNotDone : 0);
    }
  }, [selectedBookId, allVideos, completedVideoTitles, currentWeekPlannedTitles]);

  // Default selected days (e.g. Mon, Wed, Fri or all weekdays)
  useEffect(() => {
    if (safeDays && safeDays.length > 0 && selectedDays.length === 0) {
      // Default: Mon, Wed, Fri (index 0, 2, 4) or all 7 days
      const defaultDates = safeDays.slice(0, 5).map(d => d.date);
      setSelectedDays(defaultDates);
    }
  }, [safeDays]);

  // Day Preset Handlers
  const handleSelectPreset = (preset: 'all' | 'weekdays' | 'odd' | 'even' | 'weekend') => {
    if (!safeDays || safeDays.length === 0) return;
    if (preset === 'all') {
      setSelectedDays(safeDays.map(d => d.date));
    } else if (preset === 'weekdays') {
      // First 5 days (Mon-Fri)
      setSelectedDays(safeDays.slice(0, 5).map(d => d.date));
    } else if (preset === 'odd') {
      // Mon (0), Wed (2), Fri (4)
      setSelectedDays([safeDays[0]?.date, safeDays[2]?.date, safeDays[4]?.date].filter(Boolean) as string[]);
    } else if (preset === 'even') {
      // Tue (1), Thu (3), Sat (5)
      setSelectedDays([safeDays[1]?.date, safeDays[3]?.date, safeDays[5]?.date].filter(Boolean) as string[]);
    } else if (preset === 'weekend') {
      // Sat (5), Sun (6)
      setSelectedDays(safeDays.slice(5, 7).map(d => d.date));
    }
  };

  const toggleDay = (date: string) => {
    if (selectedDays.includes(date)) {
      setSelectedDays(selectedDays.filter(d => d !== date));
    } else {
      // Keep sorted by days array order
      const newSelected = [...selectedDays, date];
      setSelectedDays(safeDays.filter(d => newSelected.includes(d.date)).map(d => d.date));
    }
  };

  // Video Queue Calculation based on start index & skip completed
  const candidateVideos = useMemo(() => {
    if (!allVideos || allVideos.length === 0) return [];
    
    // Slice from starting index
    const fromStart = allVideos.slice(startIndex);
    if (!skipCompleted) return fromStart;

    // Filter out completed ones
    return fromStart.filter((v: any) => v && v.title && !completedVideoTitles.has(v.title));
  }, [allVideos, startIndex, skipCompleted, completedVideoTitles]);

  // Distribution Plan Calculation
  const distributionPlan = useMemo(() => {
    if (!selectedBook || !candidateVideos || candidateVideos.length === 0 || !selectedDays || selectedDays.length === 0 || videosPerDay <= 0) {
      return [];
    }

    const plan: Array<{
      date: string;
      dayInfo: DayInfo;
      videos: any[];
      totalMinutes: number;
    }> = [];

    let videoPointer = 0;

    // Iterate through selected days in chronological order
    for (const date of selectedDays) {
      if (videoPointer >= candidateVideos.length) break;

      const dayInfo = safeDays.find(d => d.date === date) || {
        date,
        label: '',
        shortLabel: date
      };

      const dayVideos = [];
      for (let i = 0; i < videosPerDay; i++) {
        if (videoPointer < candidateVideos.length) {
          dayVideos.push(candidateVideos[videoPointer]);
          videoPointer++;
        }
      }

      if (dayVideos.length > 0) {
        const totalMinutes = dayVideos.reduce((sum, v) => sum + (Number(v?.durationMinutes) || 0), 0);
        plan.push({
          date,
          dayInfo,
          videos: dayVideos,
          totalMinutes
        });
      }
    }

    return plan;
  }, [selectedBook, candidateVideos, selectedDays, videosPerDay, safeDays]);

  const totalVideosDistributed = useMemo(() => {
    return (distributionPlan || []).reduce((sum, item) => sum + (item.videos?.length || 0), 0);
  }, [distributionPlan]);

  const totalMinutesDistributed = useMemo(() => {
    return (distributionPlan || []).reduce((sum, item) => sum + (item.totalMinutes || 0), 0);
  }, [distributionPlan]);

  // Execute Distribution
  const handleApply = () => {
    if (!distributionPlan || distributionPlan.length === 0 || !selectedBook) return;

    const newTasks: any[] = [];

    distributionPlan.forEach(planItem => {
      (planItem.videos || []).forEach(vid => {
        newTasks.push({
          id: Math.random().toString(36).substring(2, 11),
          date: planItem.date,
          subject: selectedBook.subject || 'Matematik',
          branch: selectedBook.type || selectedBook.branch || 'TYT',
          bookId: selectedBook.id,
          topic: vid.title,
          targetCount: vid.durationMinutes || 1,
          type: 'YouTube Video',
          completedCount: 0,
          isDone: false,
          coachNote: customCoachNote.trim() || '',
          durationMinutes: vid.durationMinutes || 0,
          durationFormatted: vid.durationFormatted || '',
          videoId: vid.videoId || '',
          videoUrl: vid.url || (vid.videoId ? `https://www.youtube.com/watch?v=${vid.videoId}` : ''),
          channelTitle: selectedBook.channelTitle || selectedBook.bookName || ''
        });
      });
    });

    onDistribute(newTasks, replaceExisting);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-3 sm:p-5 overflow-y-auto animate-in fade-in duration-200">
      <div 
        className="bg-slate-900 border border-purple-500/30 rounded-2xl w-full max-w-4xl max-h-[92vh] flex flex-col shadow-2xl shadow-purple-950/40 overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-6 py-4.5 border-b border-white/10 bg-slate-950/60 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-red-600/15 border border-red-500/30 flex items-center justify-center shadow-inner">
              <Youtube className="text-red-500" size={22} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-black text-white tracking-tight flex items-center gap-1.5">
                  YouTube Kamp Dağıtım Sihirbazı
                </h2>
                <span className="text-[10px] uppercase font-bold tracking-widest bg-purple-500/20 text-purple-300 border border-purple-500/40 px-2 py-0.5 rounded-md flex items-center gap-1">
                  <Sparkles size={11} className="text-purple-400" />
                  Toplu Dağıtıcı
                </span>
              </div>
              <p className="text-xs text-slate-400">
                {studentName ? `${studentName} için ` : ''}video serisini haftalık çalışma programına gün gün eşit ve otomatik yerleştirin.
              </p>
            </div>
          </div>
          <button 
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-lg bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white flex items-center justify-center transition-colors cursor-pointer"
          >
            <X size={18} />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto flex-1 space-y-6 custom-scrollbar">
          {(allEligibleBooks?.length || 0) === 0 ? (
            <div className="text-center py-12 px-4 bg-slate-950/40 border border-dashed border-white/10 rounded-xl space-y-3">
              <Youtube className="mx-auto text-slate-600" size={40} />
              <h3 className="text-base font-bold text-white">Kayıtlı YouTube Kaynağı Bulunamadı</h3>
              <p className="text-xs text-slate-400 max-w-md mx-auto">
                Sistemde veya {studentName ? `${studentName} adlı ` : ''}öğrencinin kütüphanesinde henüz bir YouTube video kampı veya playlist bulunmuyor.
              </p>
            </div>
          ) : (
            <>
              {/* Step 1: Kaynak Seçimi */}
              <div className="space-y-4">
                {/* 1A. Öğrencinin Kayıtlı YouTube Kaynakları */}
                <div className="space-y-2">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1.5">
                    <label className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center gap-2">
                      <span>1. Öğrencinin Kayıtlı YouTube Kaynakları ({(studentYouTubeBooks?.length || 0)})</span>
                    </label>
                    {selectedBook && selectedBook.isStudentBook && (
                      <span className="text-[11px] text-purple-400 font-semibold">
                        {selectedBook.bookName} • {(allVideos?.length || 0)} video ({selectedBook.totalDurationFormatted || `${selectedBook.totalDurationMinutes || 0} dk`})
                      </span>
                    )}
                  </div>

                  {(studentYouTubeBooks?.length || 0) > 0 ? (
                    <>
                      {/* Hızlı Açılır Menü (Öğrenci Kaynakları) */}
                      <div className="w-full">
                        <select
                          id="student-youtube-dropdown-select"
                          value={selectedBook && selectedBook.isStudentBook ? selectedBookId : ''}
                          onChange={(e) => {
                            if (e.target.value) setSelectedBookId(e.target.value);
                          }}
                          className="w-full bg-slate-900 border border-purple-500/40 focus:border-purple-400 rounded-xl px-3 py-2.5 text-xs font-bold text-white shadow-sm focus:outline-none focus:ring-1 focus:ring-purple-500 cursor-pointer"
                        >
                          <option value="" disabled={Boolean(selectedBook?.isStudentBook)}>
                            {selectedBook && selectedBook.isStudentBook 
                              ? `✓ [${selectedBook.subject || 'Ders'}] ${selectedBook.bookName}`
                              : '-- Öğrencinin Kayıtlı Kaynaklarından Seçin --'}
                          </option>
                          {studentYouTubeBooks.map(book => {
                            const vCount = Array.isArray(book.videos) ? book.videos.length : 0;
                            return (
                              <option key={book.id} value={book.id}>
                                [{book.subject || 'Ders'}] {book.bookName} {book.channelTitle ? `(${book.channelTitle})` : ''} - {vCount} Video
                              </option>
                            );
                          })}
                        </select>
                      </div>

                      {/* Görsel Kart Seçici (Öğrenci Kaynakları) */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5 pt-1">
                        {studentYouTubeBooks.map(book => {
                          const isSelected = book.id === selectedBookId;
                          const vCount = Array.isArray(book.videos) ? book.videos.length : 0;
                          const completedCount = (book.completedTopics || []).length;
                          const pct = vCount > 0 ? Math.min(100, Math.max(0, Math.round((completedCount / vCount) * 100))) : 0;

                          return (
                            <button
                              key={book.id}
                              type="button"
                              onClick={() => setSelectedBookId(book.id)}
                              className={`p-3 rounded-xl text-left border transition-all relative flex flex-col justify-between cursor-pointer ${
                                isSelected 
                                  ? 'bg-purple-950/50 border-purple-500 shadow-md shadow-purple-950/30 ring-2 ring-purple-500/70' 
                                  : 'bg-slate-950/50 border-white/10 hover:border-white/25 hover:bg-slate-800/40'
                              }`}
                            >
                              <div className="space-y-1">
                                <div className="flex items-center justify-between gap-1">
                                  <span className="text-[10px] font-black uppercase tracking-wider px-1.5 py-0.5 rounded bg-white/5 text-slate-300 border border-white/10">
                                    {book.subject || 'Ders'}
                                  </span>
                                  {isSelected && (
                                    <span className="w-4 h-4 rounded-full bg-purple-500 text-white flex items-center justify-center text-[10px]">
                                      <Check size={10} strokeWidth={3} />
                                    </span>
                                  )}
                                </div>
                                <div className="text-sm font-bold text-white truncate" title={book.bookName}>
                                  {book.bookName}
                                </div>
                                {book.channelTitle && (
                                  <div className="text-[11px] text-slate-400 truncate flex items-center gap-1">
                                    <Youtube size={12} className="text-red-400 shrink-0" />
                                    <span className="truncate">{book.channelTitle}</span>
                                  </div>
                                )}
                              </div>

                              <div className="mt-3 pt-2 border-t border-white/5 flex items-center justify-between text-[11px] text-slate-400">
                                <span>{vCount} Video</span>
                                {completedCount > 0 && (
                                  <span className="text-emerald-400 font-semibold text-[10px]">
                                    %{pct} Bitti ({completedCount}/{vCount})
                                  </span>
                                )}
                              </div>
                            </button>
                          );
                        })}
                      </div>
                    </>
                  ) : (
                    <div className="p-3 bg-slate-900/60 border border-dashed border-white/10 rounded-xl flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center shrink-0">
                        <Youtube size={16} className="text-slate-500" />
                      </div>
                      <p className="text-xs text-slate-400">
                        Öğrencinin kütüphanesine henüz kayıtlı bir YouTube kaynağı atanmamış. Aşağıdaki açılır menüden diğer tüm playlisti kayıtlı olan kanallardan birini seçebilirsiniz.
                      </p>
                    </div>
                  )}
                </div>

                {/* 1B. Diğer Tüm Playlisti Kayıtlı Olan Kanallar (Açılır Menü) */}
                <div className="space-y-2 pt-3 border-t border-white/10">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1.5">
                    <label htmlFor="other-playlist-channels-select" className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center gap-2">
                      <Sparkles className="text-amber-400" size={14} />
                      <span>Diğer Tüm Playlisti Kayıtlı Olan Kanallar ({(otherPlaylistBooks?.length || 0)})</span>
                    </label>
                    {selectedBook && !selectedBook.isStudentBook && (
                      <span className="text-[11px] text-amber-400 font-semibold flex items-center gap-1.5">
                        <span className="inline-block w-2 h-2 rounded-full bg-amber-400 animate-pulse"></span>
                        Açılır Menüden Kanal Seçildi
                      </span>
                    )}
                  </div>

                  {/* Açılır Menü */}
                  <div className="w-full">
                    <select
                      id="other-playlist-channels-select"
                      value={selectedBook && !selectedBook.isStudentBook ? selectedBookId : ''}
                      onChange={(e) => {
                        if (e.target.value) {
                          setSelectedBookId(e.target.value);
                        }
                      }}
                      className="w-full bg-slate-900 border border-white/20 hover:border-amber-500/60 focus:border-amber-400 rounded-xl px-3.5 py-2.5 text-xs font-bold text-white shadow-sm focus:outline-none focus:ring-2 focus:ring-amber-500/50 cursor-pointer transition-all"
                    >
                      <option value="">
                        {(otherPlaylistBooks?.length || 0) > 0 
                          ? `-- Diğer Playlisti Kayıtlı Kanallardan / Kamplardan Seçin (${otherPlaylistBooks?.length || 0} kanal) --`
                          : '-- Sistemde Başka Kayıtlı Playlist Bulunmuyor --'}
                      </option>
                      {groupedOtherBooks.map(group => (
                        <optgroup key={group.subject} label={`📚 ${group.subject} (${group.books?.length || 0})`}>
                          {group.books.map(b => {
                            const vCount = Array.isArray(b.videos) ? b.videos.length : 0;
                            const dur = b.totalDurationFormatted || (b.totalDurationMinutes ? `${b.totalDurationMinutes} dk` : '');
                            return (
                              <option key={b.id} value={b.id}>
                                {b.channelTitle ? `${b.channelTitle} • ` : ''}{b.bookName} ({vCount} Video{dur ? ` - ${dur}` : ''})
                              </option>
                            );
                          })}
                        </optgroup>
                      ))}
                    </select>
                  </div>

                  {/* Seçili Sistem Kanalı Bilgi Çubuğu */}
                  {selectedBook && !selectedBook.isStudentBook && (
                    <div className="p-3 bg-gradient-to-r from-amber-950/40 via-slate-900/60 to-purple-950/40 border border-amber-500/40 rounded-xl flex items-center justify-between gap-3 text-xs shadow-sm">
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div className="w-8 h-8 rounded-lg bg-red-600/20 border border-red-500/40 flex items-center justify-center shrink-0">
                          <Youtube className="text-red-400" size={16} />
                        </div>
                        <div className="min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="text-[10px] uppercase font-black text-amber-300 px-1.5 py-0.5 rounded bg-amber-500/20 border border-amber-500/30">
                              {selectedBook.subject || 'Ders'}
                            </span>
                            <span className="text-[10px] text-amber-400 font-bold">
                              ✓ Aktif Seçim (Açılır Menü)
                            </span>
                          </div>
                          <p className="text-xs font-bold text-white truncate mt-0.5">{selectedBook.bookName}</p>
                          {selectedBook.channelTitle && (
                            <p className="text-[10px] text-slate-400 truncate">{selectedBook.channelTitle}</p>
                          )}
                        </div>
                      </div>
                      <div className="text-right shrink-0">
                        <p className="text-xs font-mono font-bold text-amber-300">{(allVideos?.length || 0)} Video</p>
                        <p className="text-[10px] text-slate-400">{selectedBook.totalDurationFormatted || `${selectedBook.totalDurationMinutes || 0} dk`}</p>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Step 2 & 3: Başlangıç Videosu ve Dağıtım Parametreleri */}
              {selectedBook && (allVideos?.length || 0) > 0 && (
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 pt-2">
                  {/* Left Column: Başlangıç ve Seçenekler */}
                  <div className="lg:col-span-5 space-y-4 bg-slate-950/50 p-4 rounded-xl border border-white/10">
                    {/* Başlangıç Videosu */}
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <label className="text-xs font-bold uppercase tracking-wider text-slate-300">
                          2. Başlangıç Videosu
                        </label>
                        <span className="text-[10px] text-emerald-400 font-bold bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
                          Kaldığı Yer Tespiti Aktif
                        </span>
                      </div>
                      <select
                        value={startIndex}
                        onChange={(e) => setStartIndex(Number(e.target.value))}
                        className="w-full bg-slate-900 border border-white/10 rounded-xl px-3 py-2.5 text-xs text-white focus:outline-none focus:border-purple-500 transition-colors"
                      >
                        {allVideos.map((vid: any, idx: number) => {
                          const isDone = completedVideoTitles.has(vid.title);
                          const isPlanned = currentWeekPlannedTitles.has(vid.title);
                          return (
                            <option key={vid.videoId || idx} value={idx}>
                              #{idx + 1} - {vid.title.slice(0, 50)} {vid.durationMinutes ? `(${vid.durationMinutes} dk)` : ''} {isDone ? '✓ [Bitti]' : isPlanned ? '📅 [Bu Hafta Var]' : ''}
                            </option>
                          );
                        })}
                      </select>
                      <div className="flex items-center justify-between text-[11px] text-slate-400 pt-1">
                        <span>Listede kalan: <strong className="text-white">{(allVideos?.length || 0) - startIndex} video</strong></span>
                        <label className="flex items-center gap-1.5 cursor-pointer select-none text-slate-300 hover:text-white">
                          <input 
                            type="checkbox"
                            checked={skipCompleted}
                            onChange={(e) => setSkipCompleted(e.target.checked)}
                            className="rounded border-slate-700 text-purple-600 focus:ring-purple-500 bg-slate-900"
                          />
                          <span>Bitenleri atla</span>
                        </label>
                      </div>
                    </div>

                    {/* Günlük Video Sayısı */}
                    <div className="space-y-2 pt-2 border-t border-white/5">
                      <label className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center justify-between">
                        <span>3. Günde Kaç Video?</span>
                        <span className="text-purple-400 font-bold">{videosPerDay} Video / Gün</span>
                      </label>
                      <div className="grid grid-cols-4 gap-2">
                        {[1, 2, 3, 4].map(num => (
                          <button
                            key={num}
                            type="button"
                            onClick={() => setVideosPerDay(num)}
                            className={`py-2 rounded-xl text-xs font-black transition-all cursor-pointer ${
                              videosPerDay === num
                                ? 'bg-purple-600 text-white shadow-lg shadow-purple-600/30'
                                : 'bg-slate-900 text-slate-400 hover:bg-slate-800 hover:text-white border border-white/5'
                            }`}
                          >
                            {num} Video
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Koç Notu & Değiştirme Tercihi */}
                    <div className="space-y-2 pt-2 border-t border-white/5">
                      <label className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                        Görevlere Eklenecek Not (Opsiyonel)
                      </label>
                      <input 
                        type="text"
                        value={customCoachNote}
                        onChange={(e) => setCustomCoachNote(e.target.value)}
                        placeholder="Örn: Soruları durdurup önce kendin dene..."
                        className="w-full bg-slate-900 border border-white/10 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-purple-500"
                      />

                      <div className="pt-2">
                        <label className="flex items-center gap-2 cursor-pointer text-xs text-slate-300 hover:text-white select-none">
                          <input 
                            type="checkbox"
                            checked={replaceExisting}
                            onChange={(e) => setReplaceExisting(e.target.checked)}
                            className="rounded border-slate-700 text-purple-600 focus:ring-purple-500 bg-slate-900"
                          />
                          <span>Seçili günlerdeki bu kaynağa ait eski videoları temizle</span>
                        </label>
                      </div>
                    </div>
                  </div>

                  {/* Right Column: Dağıtılacak Günler ve Canlı Önizleme */}
                  <div className="lg:col-span-7 space-y-4">
                    {/* Gün Seçimi */}
                    <div className="space-y-2">
                      <div className="flex items-center justify-between flex-wrap gap-1">
                        <label className="text-xs font-bold uppercase tracking-wider text-slate-300">
                          4. Dağıtılacak Günler ({(selectedDays?.length || 0)} Gün Seçili)
                        </label>
                        <div className="flex items-center gap-1 text-[10px]">
                          <button
                            type="button"
                            onClick={() => handleSelectPreset('weekdays')}
                            className="px-2 py-0.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 cursor-pointer"
                          >
                            Hafta İçi
                          </button>
                          <button
                            type="button"
                            onClick={() => handleSelectPreset('odd')}
                            className="px-2 py-0.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 cursor-pointer"
                          >
                            Pzt-Çar-Cum
                          </button>
                          <button
                            type="button"
                            onClick={() => handleSelectPreset('even')}
                            className="px-2 py-0.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 cursor-pointer"
                          >
                            Sal-Per-Cmt
                          </button>
                          <button
                            type="button"
                            onClick={() => handleSelectPreset('all')}
                            className="px-2 py-0.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 cursor-pointer"
                          >
                            Tümü
                          </button>
                        </div>
                      </div>

                      {/* Day Buttons Grid */}
                      <div className="grid grid-cols-7 gap-1.5">
                        {safeDays.map((day) => {
                          const isSelected = selectedDays.includes(day.date);
                          return (
                            <button
                              key={day.date}
                              type="button"
                              onClick={() => toggleDay(day.date)}
                              className={`p-2 rounded-xl text-center border transition-all cursor-pointer flex flex-col items-center justify-center ${
                                isSelected
                                  ? 'bg-purple-600 text-white border-purple-500 shadow-md shadow-purple-600/30'
                                  : 'bg-slate-950/60 text-slate-400 border-white/5 hover:bg-slate-800 hover:text-white'
                              }`}
                            >
                              <span className="text-[11px] font-black uppercase">
                                {day.label.slice(0, 3)}
                              </span>
                              <span className="text-[9px] opacity-80 font-mono mt-0.5">
                                {day.shortLabel}
                              </span>
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    {/* Canlı Dağıtım Önizlemesi */}
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <label className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center gap-1.5">
                          <span>Dağıtım Önizlemesi</span>
                          <span className="text-[10px] text-purple-400 font-mono">
                            ({totalVideosDistributed} Video • {Math.floor(totalMinutesDistributed / 60)} sa {totalMinutesDistributed % 60} dk)
                          </span>
                        </label>
                      </div>

                      {(!distributionPlan || distributionPlan.length === 0) ? (
                        <div className="p-8 text-center bg-slate-950/40 border border-dashed border-white/10 rounded-xl text-xs text-slate-500">
                          Lütfen en az bir gün seçin ve dağıtılacak videoların mevcut olduğundan emin olun.
                        </div>
                      ) : (
                        <div className="space-y-2 max-h-[300px] overflow-y-auto custom-scrollbar pr-1">
                          {distributionPlan.map(planItem => (
                            <div 
                              key={planItem.date}
                              className="bg-slate-950/70 border border-white/10 rounded-xl p-3 space-y-2"
                            >
                              <div className="flex items-center justify-between border-b border-white/5 pb-1.5">
                                <div className="flex items-center gap-2">
                                  <Calendar size={13} className="text-purple-400" />
                                  <span className="text-xs font-black text-white">
                                    {planItem.dayInfo.label}
                                  </span>
                                  <span className="text-[10px] text-slate-400 font-mono">
                                    ({planItem.dayInfo.shortLabel})
                                  </span>
                                </div>
                                <span className="text-[10px] font-bold text-slate-300 bg-white/5 px-2 py-0.5 rounded border border-white/5">
                                  {planItem.videos?.length || 0} Video • {planItem.totalMinutes} dk
                                </span>
                              </div>

                              <div className="space-y-1">
                                {(planItem.videos || []).map((v: any, vIdx: number) => (
                                  <div 
                                    key={v.videoId || vIdx}
                                    className="flex items-center justify-between gap-2 p-1.5 bg-slate-900/80 rounded-lg text-xs"
                                  >
                                    <div className="flex items-center gap-2 truncate min-w-0">
                                      <Youtube size={13} className="text-red-400 shrink-0" />
                                      <span className="text-slate-200 truncate font-medium">
                                        {v.title}
                                      </span>
                                    </div>
                                    <span className="text-[10px] text-slate-400 font-mono shrink-0 bg-white/5 px-1.5 py-0.5 rounded">
                                      {v.durationFormatted || `${v.durationMinutes || 0} dk`}
                                    </span>
                                  </div>
                                ))}
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-white/10 bg-slate-950/80 flex items-center justify-between shrink-0">
          <div className="text-xs text-slate-400 hidden sm:block">
            {totalVideosDistributed > 0 ? (
              <span>
                Toplam <strong className="text-purple-300 font-bold">{(selectedDays?.length || 0)} güne</strong>{' '}
                <strong className="text-white font-bold">{totalVideosDistributed} adet video</strong> dağıtılacak.
              </span>
            ) : (
              <span>Dağıtım için gün ve video seçimi yapın.</span>
            )}
          </div>
          <div className="flex items-center gap-3 w-full sm:w-auto justify-end">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl text-xs font-bold text-slate-400 hover:text-white transition-colors cursor-pointer"
            >
              Vazgeç
            </button>
            <button
              type="button"
              onClick={handleApply}
              disabled={!distributionPlan || distributionPlan.length === 0}
              className={`px-5 py-2.5 rounded-xl text-xs font-black tracking-wide flex items-center justify-center gap-2 transition-all cursor-pointer ${
                distributionPlan && distributionPlan.length > 0
                  ? 'bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white shadow-lg shadow-purple-600/30'
                  : 'bg-slate-800 text-slate-500 cursor-not-allowed border border-white/5'
              }`}
            >
              <Sparkles size={14} />
              <span>Videoları Programa Dağıt</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
export default YouTubeDistributorModal;
