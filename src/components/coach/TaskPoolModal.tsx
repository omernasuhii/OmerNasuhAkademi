import React, { useState, useMemo } from 'react';
import { 
  ShoppingBag, 
  Sparkles, 
  Trash2, 
  Plus, 
  Calendar, 
  Clock, 
  Check, 
  CheckCircle2, 
  X, 
  ChevronRight, 
  AlertCircle, 
  BookOpen, 
  Layers, 
  RotateCcw, 
  Youtube, 
  FileText, 
  Search, 
  Zap, 
  Loader2,
  SlidersHorizontal,
  ArrowRight,
  Info,
  Bookmark,
  BookmarkCheck,
  History,
  Settings2
} from 'lucide-react';
import { getTaskSubjectMultiplier } from '../../lib/programCalculations';

export interface PoolTaskItem {
  id: string;
  title: string;
  topic: string;
  subject: string;
  branch?: string;
  type: string;
  bookId?: string | null;
  bookTitle?: string;
  targetCount?: number;
  durationMinutes?: number;
  durationFormatted?: string;
  splitDays?: number;
  autoSplit?: boolean;
  videoId?: string;
  videoUrl?: string;
  channelTitle?: string;
  addedAt?: number;
}

export interface DayInfo {
  date: string;
  label: string;
  shortLabel: string;
  isToday?: boolean;
}

export interface TaskPoolModalProps {
  isOpen: boolean;
  onClose: () => void;
  poolTasks: PoolTaskItem[];
  onUpdatePoolTasks: (newTasks: PoolTaskItem[]) => void;
  onClearPool: () => void;
  days: DayInfo[];
  multipliers: Record<string, number>;
  studentInfo?: {
    name?: string;
    branch?: string;
    grade?: string;
  };
  onApplySchedule: (distributedTasks: any[], replaceMode: boolean) => void;
}

export const TaskPoolModal: React.FC<TaskPoolModalProps> = ({
  isOpen,
  onClose,
  poolTasks = [],
  onUpdatePoolTasks,
  onClearPool,
  days = [],
  multipliers = {},
  studentInfo,
  onApplySchedule
}) => {
  // State for AI Distribution & Settings
  const [selectedDates, setSelectedDates] = useState<string[]>(() => days.map(d => d.date));
  const [prioritizeWeakSubjects, setPrioritizeWeakSubjects] = useState<boolean>(true);
  const [preserveVideoOrder, setPreserveVideoOrder] = useState<boolean>(true);
  const [maxTasksPerDay, setMaxTasksPerDay] = useState<number>(4);
  const [coachPrompt, setCoachPrompt] = useState<string>(() => {
    return localStorage.getItem('coach_last_distribution_prompt') || '';
  });
  const [savedCoachPrompts, setSavedCoachPrompts] = useState<string[]>(() => {
    try {
      const raw = localStorage.getItem('coach_saved_distribution_prompts');
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch (e) {
      console.error(e);
    }
    return [
      "Salı günü dershanesi var o yüzden hafif olsun, Cuma gününe deneme yerleştir.",
      "Hafta sonuna deneme sınavı ve genel tekrar görevleri yerleştir.",
      "Matematik ve Fizik aynı güne denk gelmesin, dengeli dağıtılsın.",
      "Hafta içi her güne en fazla 1 video görevi ata, soru çözümüne ağırlık ver."
    ];
  });
  const [showSavedPrompts, setShowSavedPrompts] = useState(false);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [activeTab, setActiveTab] = useState<'pool' | 'preview'>('pool');

  // Loading & Result States
  const [isDistributing, setIsDistributing] = useState<boolean>(false);
  const [distributionResult, setDistributionResult] = useState<{
    reasoning: string;
    dailySchedule: Array<{
      date: string;
      dayLabel: string;
      focus: string;
      assignedTaskIds: string[];
    }>;
    assignedTasks: any[];
    unassignedTasks: any[];
  } | null>(null);

  // Manual Task Creation Modal inside Pool
  const [isManualTaskModalOpen, setIsManualTaskModalOpen] = useState(false);
  const [manualSubject, setManualSubject] = useState('Matematik');
  const [manualTopic, setManualTopic] = useState('');
  const [manualType, setManualType] = useState('Soru Çözümü');
  const [manualTarget, setManualTarget] = useState('40');
  const [manualSplitDays, setManualSplitDays] = useState(1);
  const [manualAutoSplit, setManualAutoSplit] = useState(true);

  // Update selected dates when days change
  React.useEffect(() => {
    if (days && days.length > 0 && selectedDates.length === 0) {
      setSelectedDates(days.map(d => d.date));
    }
  }, [days]);

  // Calculations
  const poolStats = useMemo(() => {
    let totalQuestions = 0;
    let totalVideoMinutes = 0;
    let weakSubjectTasks = 0;

    poolTasks.forEach(t => {
      if (t.type === 'YouTube Video') {
        totalVideoMinutes += Number(t.durationMinutes) || 0;
      } else {
        totalQuestions += Number(t.targetCount) || 0;
      }

      const mult = getTaskSubjectMultiplier(multipliers, t.subject, t.branch, t.type);
      if (mult > 1.05) {
        weakSubjectTasks++;
      }
    });

    return {
      totalTasks: poolTasks.length,
      totalQuestions,
      totalVideoMinutes,
      weakSubjectTasks
    };
  }, [poolTasks, multipliers]);

  const filteredPool = useMemo(() => {
    if (!searchQuery) return poolTasks;
    const q = searchQuery.toLowerCase();
    return poolTasks.filter(t => 
      (t.topic || t.title || '').toLowerCase().includes(q) ||
      (t.subject || '').toLowerCase().includes(q) ||
      (t.type || '').toLowerCase().includes(q)
    );
  }, [poolTasks, searchQuery]);

  const toggleDateSelection = (date: string) => {
    setSelectedDates(prev => 
      prev.includes(date) ? prev.filter(d => d !== date) : [...prev, date]
    );
  };

  const handleRemoveTask = (taskId: string) => {
    onUpdatePoolTasks(poolTasks.filter(t => t.id !== taskId));
  };

  const handleUpdateTaskCount = (taskId: string, newCount: number) => {
    onUpdatePoolTasks(poolTasks.map(t => {
      if (t.id !== taskId) return t;
      if (t.type === 'YouTube Video') {
        return { ...t, durationMinutes: newCount };
      }
      return { ...t, targetCount: newCount };
    }));
  };

  const handleToggleAutoSplit = (taskId: string, currentAutoSplit?: boolean) => {
    const isAuto = currentAutoSplit !== false;
    onUpdatePoolTasks(poolTasks.map(t => {
      if (t.id !== taskId) return t;
      return {
        ...t,
        autoSplit: !isAuto,
        splitDays: isAuto ? 2 : 1
      };
    }));
  };

  const handleUpdateTaskSplitDays = (taskId: string, newSplitDays: number | string) => {
    if (newSplitDays === 'auto') {
      onUpdatePoolTasks(poolTasks.map(t => {
        if (t.id !== taskId) return t;
        return { ...t, autoSplit: true };
      }));
      return;
    }
    const val = typeof newSplitDays === 'string' ? parseInt(newSplitDays) : newSplitDays;
    const clamped = Math.max(1, Math.min(7, val || 1));
    onUpdatePoolTasks(poolTasks.map(t => {
      if (t.id !== taskId) return t;
      return { ...t, splitDays: clamped, autoSplit: false };
    }));
  };

  const handleSaveCurrentPrompt = () => {
    if (!coachPrompt.trim()) return;
    const trimmed = coachPrompt.trim();
    const updated = [trimmed, ...savedCoachPrompts.filter(p => p !== trimmed)].slice(0, 12);
    setSavedCoachPrompts(updated);
    localStorage.setItem('coach_saved_distribution_prompts', JSON.stringify(updated));
    localStorage.setItem('coach_last_distribution_prompt', trimmed);
  };

  const handleDeleteSavedPrompt = (promptToDelete: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const updated = savedCoachPrompts.filter(p => p !== promptToDelete);
    setSavedCoachPrompts(updated);
    localStorage.setItem('coach_saved_distribution_prompts', JSON.stringify(updated));
  };

  const handleAddManualTask = (e: React.FormEvent) => {
    e.preventDefault();
    if (!manualTopic.trim()) return;

    const newTask: PoolTaskItem = {
      id: `pool-manual-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      title: manualTopic.trim(),
      topic: manualTopic.trim(),
      subject: manualSubject,
      type: manualType,
      targetCount: manualType === 'YouTube Video' ? 30 : (parseInt(manualTarget) || 40),
      durationMinutes: manualType === 'YouTube Video' ? (parseInt(manualTarget) || 30) : 0,
      autoSplit: manualAutoSplit,
      splitDays: manualAutoSplit ? 1 : (manualSplitDays > 1 ? manualSplitDays : 1),
      addedAt: Date.now()
    };

    onUpdatePoolTasks([...poolTasks, newTask]);
    setManualTopic('');
    setManualSplitDays(1);
    setManualAutoSplit(true);
    setIsManualTaskModalOpen(false);
  };

  // Trigger Gemini AI Distribution
  const handleStartDistribution = async () => {
    if (poolTasks.length === 0) {
      alert("Havuzda dağıtılacak en az bir görev olmalıdır.");
      return;
    }

    if (selectedDates.length === 0) {
      alert("Lütfen görevlerin atanacağı en az bir gün seçin.");
      return;
    }

    // Persist coach note for future use
    if (coachPrompt.trim()) {
      const trimmed = coachPrompt.trim();
      localStorage.setItem('coach_last_distribution_prompt', trimmed);
      const updated = [trimmed, ...savedCoachPrompts.filter(p => p !== trimmed)].slice(0, 12);
      setSavedCoachPrompts(updated);
      localStorage.setItem('coach_saved_distribution_prompts', JSON.stringify(updated));
    }

    setIsDistributing(true);
    try {
      const activeDays = days.filter(d => selectedDates.includes(d.date));

      const res = await fetch("/api/ai-distribute-tasks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          poolTasks,
          availableDays: activeDays,
          multipliers,
          studentInfo,
          coachPrompt,
          settings: {
            prioritizeWeakSubjects,
            preserveVideoOrder,
            maxTasksPerDay
          }
        })
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || "Yapay zeka dağıtımı başarısız oldu.");
      }

      setDistributionResult({
        reasoning: data.reasoning,
        dailySchedule: data.dailySchedule,
        assignedTasks: data.assignedTasks,
        unassignedTasks: data.unassignedTasks || []
      });

      setActiveTab('preview');
    } catch (err: any) {
      console.error("AI Distribution failed:", err);
      alert(`Dağıtım sırasında bir hata oluştu: ${err?.message || 'Lütfen tekrar deneyin.'}`);
    } finally {
      setIsDistributing(false);
    }
  };

  const handleApplyToSchedule = (replaceMode: boolean) => {
    if (!distributionResult || distributionResult.assignedTasks.length === 0) return;

    onApplySchedule(distributionResult.assignedTasks, replaceMode);
    
    // Clear the pool tasks since they are now scheduled
    onClearPool();
    setDistributionResult(null);
    setActiveTab('pool');
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-50 flex items-center justify-center p-3 sm:p-5 overflow-y-auto">
      <div className="bg-slate-900 border border-purple-500/30 rounded-3xl w-full max-w-5xl max-h-[92vh] flex flex-col shadow-2xl shadow-purple-950/40 overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        
        {/* Modal Top Header */}
        <div className="p-5 sm:p-6 bg-gradient-to-r from-purple-950/60 via-slate-900 to-indigo-950/60 border-b border-purple-500/20 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3.5 min-w-0">
            <div className="w-11 h-11 rounded-2xl bg-purple-600/20 border border-purple-500/40 flex items-center justify-center shrink-0 shadow-inner">
              <ShoppingBag className="text-purple-400" size={22} />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <h2 className="text-lg sm:text-xl font-black text-white uppercase tracking-tight truncate">
                  Haftalık Görev Havuzu
                </h2>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-purple-500/20 text-purple-300 border border-purple-500/30">
                  {poolTasks.length} Görev
                </span>
              </div>
              <p className="text-xs text-slate-400 truncate mt-0.5">
                Toplanan görevleri deneme zorluk çarpanları ve video sürelerine göre yapay zeka ile haftaya dağıtın.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            {distributionResult && (
              <div className="flex bg-slate-800/80 p-1 rounded-xl border border-slate-700/60 text-xs font-bold">
                <button
                  type="button"
                  onClick={() => setActiveTab('pool')}
                  className={`px-3 py-1.5 rounded-lg transition-all ${
                    activeTab === 'pool' 
                      ? 'bg-purple-600 text-white shadow-sm' 
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  Havuz Listesi
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab('preview')}
                  className={`px-3 py-1.5 rounded-lg transition-all flex items-center gap-1.5 ${
                    activeTab === 'preview' 
                      ? 'bg-purple-600 text-white shadow-sm' 
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  <Sparkles size={12} className="text-purple-300" />
                  <span>Dağıtım Önizlemesi</span>
                </button>
              </div>
            )}

            <button 
              type="button"
              onClick={onClose} 
              className="p-2 rounded-xl bg-slate-800/60 hover:bg-slate-800 text-slate-400 hover:text-white transition-colors"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6">
          
          {/* Summary Metric Stats Bar */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="bg-slate-800/40 border border-slate-700/50 rounded-2xl p-3.5 flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center shrink-0">
                <Layers className="text-indigo-400" size={17} />
              </div>
              <div className="min-w-0">
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Toplam Görev</p>
                <p className="text-base font-black text-white">{poolStats.totalTasks} Adet</p>
              </div>
            </div>

            <div className="bg-slate-800/40 border border-slate-700/50 rounded-2xl p-3.5 flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center shrink-0">
                <FileText className="text-blue-400" size={17} />
              </div>
              <div className="min-w-0">
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Hedef Soru</p>
                <p className="text-base font-black text-white">{poolStats.totalQuestions} Soru</p>
              </div>
            </div>

            <div className="bg-slate-800/40 border border-slate-700/50 rounded-2xl p-3.5 flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-red-500/10 border border-red-500/20 flex items-center justify-center shrink-0">
                <Youtube className="text-red-400" size={17} />
              </div>
              <div className="min-w-0">
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Video Süresi</p>
                <p className="text-base font-black text-white">
                  {poolStats.totalVideoMinutes > 60 
                    ? `${Math.floor(poolStats.totalVideoMinutes / 60)} sa ${poolStats.totalVideoMinutes % 60} dk` 
                    : `${poolStats.totalVideoMinutes} dk`}
                </p>
              </div>
            </div>

            <div className="bg-slate-800/40 border border-slate-700/50 rounded-2xl p-3.5 flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center shrink-0">
                <Zap className="text-amber-400" size={17} />
              </div>
              <div className="min-w-0">
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Zorlu Ders Görevi</p>
                <p className="text-base font-black text-amber-300">{poolStats.weakSubjectTasks} Görev</p>
              </div>
            </div>
          </div>

          {/* Student Profile Multipliers Bar */}
          {multipliers && Object.keys(multipliers).length > 0 && (
            <div className="bg-slate-800/30 border border-slate-700/40 rounded-2xl p-3">
              <div className="flex items-center justify-between gap-2 mb-2">
                <div className="flex items-center gap-1.5 text-xs font-black text-slate-300">
                  <SlidersHorizontal size={13} className="text-purple-400" />
                  <span>Öğrenci Ders Çarpanları (Son 4 Genel Deneme Başarısına Göre)</span>
                </div>
                <span className="text-[10px] text-slate-400 font-medium">
                  {Object.keys(multipliers).length} Ders Hesaplanmış
                </span>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {Object.entries(multipliers).map(([sub, mult]) => {
                  const val = Number(mult);
                  const isWeak = val > 1.05;
                  return (
                    <span 
                      key={sub}
                      className={`px-2 py-0.5 rounded-lg text-[10px] font-bold flex items-center gap-1 border ${
                        isWeak 
                          ? 'bg-rose-500/10 text-rose-300 border-rose-500/25' 
                          : 'bg-emerald-500/10 text-emerald-300 border-emerald-500/25'
                      }`}
                      title={`${sub}: Çarpan x${val.toFixed(2)} (${isWeak ? 'Gelişim Alanı / Zorlandığı Ders' : 'Tam Başarı'})`}
                    >
                      <span className="text-slate-300 font-medium">{sub}:</span>
                      <span>x{val.toFixed(2)}</span>
                    </span>
                  );
                })}
              </div>
            </div>
          )}

          {activeTab === 'pool' ? (
            /* TAB 1: POOL LIST & DISTRIBUTION CONTROLS */
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              
              {/* Left: Task Pool List (7 cols) */}
              <div className="lg:col-span-7 space-y-4">
                <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5">
                  <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={14} />
                    <input 
                      type="text"
                      value={searchQuery}
                      onChange={e => setSearchQuery(e.target.value)}
                      placeholder="Havuzda ara (ders, konu, tür)..."
                      className="w-full bg-slate-800/70 border border-slate-700/70 rounded-xl pl-9 pr-3 py-2 text-xs text-white placeholder-slate-500 outline-none focus:border-purple-500"
                    />
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setIsManualTaskModalOpen(true)}
                      className="px-3 py-2 bg-indigo-600/20 hover:bg-indigo-600 text-indigo-300 hover:text-white border border-indigo-500/30 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer"
                    >
                      <Plus size={13} />
                      <span>Hızlı Ekle</span>
                    </button>

                    {poolTasks.length > 0 && (
                      <button
                        type="button"
                        onClick={() => {
                          if (confirm("Havuzdaki tüm görevler silinecek. Emin misiniz?")) {
                            onClearPool();
                          }
                        }}
                        className="px-3 py-2 bg-rose-500/10 hover:bg-rose-500/20 text-rose-300 border border-rose-500/20 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer"
                      >
                        <Trash2 size={13} />
                        <span>Temizle</span>
                      </button>
                    )}
                  </div>
                </div>

                {poolTasks.length > 0 && (
                  <div className="bg-purple-950/20 border border-purple-500/20 rounded-xl px-3 py-2 flex items-center justify-between text-[11px] text-purple-200">
                    <div className="flex items-center gap-1.5">
                      <Sparkles size={13} className="text-purple-400 shrink-0" />
                      <span>
                        <strong>Otomatik Bölme:</strong> Görevler varsayılan olarak yapay zekâ tarafından soru sayısına/video süresine göre ideal gün sayısına otomatik bölünür. Manuel gün sayısı belirlemek için görevdeki <strong>"Otomatik Böl"</strong> butonuna tıklayabilirsiniz.
                      </span>
                    </div>
                  </div>
                )}

                {/* Pool Items List - Single scrollbar on modal body, no nested overflow */}
                <div className="space-y-2.5">
                  {poolTasks.length === 0 ? (
                    <div className="p-8 text-center bg-slate-800/20 border border-dashed border-slate-700/60 rounded-3xl space-y-3">
                      <div className="w-12 h-12 rounded-2xl bg-purple-600/10 border border-purple-500/20 mx-auto flex items-center justify-center">
                        <ShoppingBag className="text-purple-400" size={24} />
                      </div>
                      <div className="space-y-1">
                        <h4 className="text-sm font-black text-white">Görev Havuzunuz Henüz Boş</h4>
                        <p className="text-xs text-slate-400 max-w-sm mx-auto">
                          Program hazırlama alanındaki ders listesinde yer alan konu ve videoların yanındaki <strong>sepet butonuna</strong> basarak görevleri buraya toplayabilirsiniz.
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => setIsManualTaskModalOpen(true)}
                        className="px-4 py-2 bg-purple-600 hover:bg-purple-500 text-white text-xs font-black rounded-xl inline-flex items-center gap-2 shadow-lg shadow-purple-600/20 transition-all cursor-pointer"
                      >
                        <Plus size={14} />
                        <span>Manuel Görev Ekle</span>
                      </button>
                    </div>
                  ) : filteredPool.length === 0 ? (
                    <div className="p-6 text-center text-xs text-slate-400 bg-slate-800/20 rounded-2xl">
                      Aramanıza uygun görev bulunamadı.
                    </div>
                  ) : (
                    filteredPool.map((task, idx) => {
                      const mult = getTaskSubjectMultiplier(multipliers, task.subject, task.branch, task.type);
                      const isWeak = mult > 1.05;
                      const isVideo = task.type === 'YouTube Video';
                      const isAutoSplit = task.autoSplit !== false;

                      return (
                        <div 
                          key={task.id || idx}
                          className="bg-slate-800/40 hover:bg-slate-800/70 border border-slate-700/50 rounded-2xl p-3 flex items-center justify-between gap-3 transition-all group"
                        >
                          <div className="flex items-center gap-3 min-w-0">
                            <span className="text-[11px] font-mono text-slate-500 w-4 text-center shrink-0">
                              {idx + 1}
                            </span>

                            <div className="min-w-0">
                              <div className="flex items-center gap-2 flex-wrap mb-1">
                                <span className="px-2 py-0.5 rounded-md text-[9px] font-black uppercase tracking-wider bg-slate-700/80 text-slate-200">
                                  {task.subject || 'Ders'}
                                </span>

                                <span className={`px-2 py-0.5 rounded-md text-[9px] font-bold flex items-center gap-1 ${
                                  isVideo 
                                    ? 'bg-red-500/10 text-red-300 border border-red-500/20' 
                                    : task.type === 'Deneme Sınavı' || task.type === 'Deneme'
                                    ? 'bg-amber-500/10 text-amber-300 border border-amber-500/20'
                                    : task.type === 'Konu Çalışması'
                                    ? 'bg-emerald-500/10 text-emerald-300 border border-emerald-500/20'
                                    : 'bg-blue-500/10 text-blue-300 border border-blue-500/20'
                                }`}>
                                  {isVideo && <Youtube size={10} />}
                                  {task.type}
                                </span>

                                {isWeak ? (
                                  <span className="px-1.5 py-0.5 rounded-md text-[8.5px] font-extrabold bg-rose-500/10 text-rose-300 border border-rose-500/20 flex items-center gap-0.5">
                                    <Zap size={8} /> x{mult.toFixed(2)} Gelişim Alanı
                                  </span>
                                ) : (
                                  <span className="px-1.5 py-0.5 rounded-md text-[8.5px] font-bold bg-emerald-500/10 text-emerald-300 border border-emerald-500/20">
                                    x{mult.toFixed(2)} Tam Başarı
                                  </span>
                                )}

                                {isAutoSplit ? (
                                  <span className="px-1.5 py-0.5 rounded-md text-[8.5px] font-extrabold bg-gradient-to-r from-purple-500/20 to-indigo-500/20 text-purple-300 border border-purple-500/30 flex items-center gap-1">
                                    <Sparkles size={9} className="text-purple-400 animate-pulse" />
                                    Otomatik Bölünecek (AI)
                                  </span>
                                ) : (task.splitDays || 1) > 1 ? (
                                  <span className="px-1.5 py-0.5 rounded-md text-[8.5px] font-extrabold bg-purple-500/20 text-purple-300 border border-purple-500/30 flex items-center gap-1">
                                    <Layers size={9} />
                                    {task.splitDays} Güne Bölünecek (~{Math.ceil((isVideo ? (task.durationMinutes || 30) : (task.targetCount || 40)) / (task.splitDays || 1))} {isVideo ? 'dk' : 'soru'}/gün)
                                  </span>
                                ) : null}
                              </div>

                              <h5 className="text-xs font-bold text-white truncate group-hover:text-purple-200 transition-colors">
                                {task.topic || task.title}
                              </h5>

                              <div className="flex items-center gap-2 mt-0.5 text-[10px] text-slate-400">
                                {(task.bookTitle || task.channelTitle) && (
                                  <span className="truncate max-w-[200px]">
                                    {task.bookTitle || task.channelTitle}
                                  </span>
                                )}
                                {isAutoSplit ? (
                                  <span className="text-purple-300/80 font-medium">
                                    • Yapay zekâ hedef sayısına göre gün sayısını otomatik belirleyecek
                                  </span>
                                ) : (task.splitDays || 1) > 1 ? (
                                  <span className="text-purple-300/80 font-medium">
                                    • Her gün ~{Math.ceil((isVideo ? (task.durationMinutes || 30) : (task.targetCount || 40)) / (task.splitDays || 1))} {isVideo ? 'dk' : 'soru'}
                                  </span>
                                ) : null}
                              </div>
                            </div>
                          </div>

                          <div className="flex items-center gap-2 shrink-0">
                            {/* Target count / duration control */}
                            <div className="flex items-center gap-1 bg-slate-900/80 border border-slate-700/60 rounded-xl px-2 py-1" title={isVideo ? 'Video Süresi (Dakika)' : 'Toplam Soru / Hedef Sayısı'}>
                              <input 
                                type="number"
                                min="1"
                                max="1000"
                                value={isVideo ? (task.durationMinutes || 30) : (task.targetCount || 40)}
                                onChange={e => handleUpdateTaskCount(task.id, parseInt(e.target.value) || 0)}
                                className="w-12 bg-transparent text-center text-xs font-black text-white outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                              />
                              <span className="text-[10px] font-bold text-slate-400">
                                {isVideo ? 'dk' : 'soru'}
                              </span>
                            </div>

                            {/* Split Days Control: Otomatik Bölünme seçiliyken günler alanı açılmaz */}
                            {isAutoSplit ? (
                              <button
                                type="button"
                                onClick={() => handleToggleAutoSplit(task.id, true)}
                                className="flex items-center gap-1.5 bg-gradient-to-r from-purple-950/70 to-indigo-950/70 hover:from-purple-900/80 hover:to-indigo-900/80 border border-purple-500/40 hover:border-purple-400/60 rounded-xl px-2.5 py-1.5 text-purple-200 text-xs font-bold transition-all shadow-sm cursor-pointer"
                                title="Otomatik bölme açık: Günler alanı kapalıdır, AI hesaplar. Manuel gün belirlemek için tıklayın."
                              >
                                <Sparkles size={11} className="text-purple-400 animate-pulse" />
                                <span className="text-[11px] whitespace-nowrap">Otomatik Böl</span>
                                <Settings2 size={11} className="text-purple-400/80 ml-0.5" />
                              </button>
                            ) : (
                              <div 
                                className={`flex items-center gap-1 border rounded-xl px-2 py-1 transition-all ${
                                  (task.splitDays || 1) > 1 
                                    ? 'bg-purple-950/40 border-purple-500/50 shadow-sm shadow-purple-900/20' 
                                    : 'bg-slate-900/80 border-slate-700/60'
                                }`}
                                title={`Bu görevi ${task.splitDays || 1} güne parçala`}
                              >
                                <Calendar size={11} className={(task.splitDays || 1) > 1 ? 'text-purple-400' : 'text-slate-400'} />
                                <select
                                  value={task.splitDays || 1}
                                  onChange={e => handleUpdateTaskSplitDays(task.id, e.target.value)}
                                  className="bg-transparent text-xs font-black text-purple-200 outline-none cursor-pointer pr-0.5"
                                >
                                  <option value="auto" className="bg-slate-900 text-purple-400 font-bold">✨ Otomatik (AI)</option>
                                  <option value={1} className="bg-slate-900 text-white">1 günde</option>
                                  <option value={2} className="bg-slate-900 text-white">2 güne böl</option>
                                  <option value={3} className="bg-slate-900 text-white">3 güne böl</option>
                                  <option value={4} className="bg-slate-900 text-white">4 güne böl</option>
                                  <option value={5} className="bg-slate-900 text-white">5 güne böl</option>
                                  <option value={6} className="bg-slate-900 text-white">6 güne böl</option>
                                  <option value={7} className="bg-slate-900 text-white">7 güne böl</option>
                                </select>
                              </div>
                            )}

                            <button
                              type="button"
                              onClick={() => handleRemoveTask(task.id)}
                              className="p-1.5 rounded-lg bg-slate-800 hover:bg-rose-500/20 text-slate-400 hover:text-rose-300 transition-colors cursor-pointer"
                              title="Havuzdan Çıkar"
                            >
                              <Trash2 size={13} />
                            </button>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>

              {/* Right: AI Smart Settings & Action (5 cols) */}
              <div className="lg:col-span-5 bg-gradient-to-b from-slate-800/40 to-slate-900/80 border border-purple-500/20 rounded-3xl p-5 flex flex-col justify-between space-y-5">
                <div className="space-y-4">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-xl bg-purple-500/20 border border-purple-500/30 flex items-center justify-center">
                      <Sparkles className="text-purple-400" size={16} />
                    </div>
                    <div>
                      <h4 className="text-sm font-black text-white uppercase tracking-tight">
                        Akıllı Dağıtım Ayarları
                      </h4>
                      <p className="text-[11px] text-slate-400">
                        Yapay zekanın dağıtımı optimize edeceği kurallar
                      </p>
                    </div>
                  </div>

                  {/* 1. Day Selection Chips */}
                  <div className="space-y-2">
                    <label className="text-[11px] font-bold text-slate-300 flex items-center justify-between">
                      <span>Dağıtım Günleri</span>
                      <span className="text-[10px] text-purple-400 font-extrabold">{selectedDates.length} Gün Seçili</span>
                    </label>
                    <div className="grid grid-cols-4 sm:grid-cols-7 gap-1.5">
                      {days.map(d => {
                        const isSelected = selectedDates.includes(d.date);
                        return (
                          <button
                            key={d.date}
                            type="button"
                            onClick={() => toggleDateSelection(d.date)}
                            className={`py-2 px-1 text-center rounded-xl border text-[10px] font-black transition-all cursor-pointer ${
                              isSelected 
                                ? 'bg-purple-600 text-white border-purple-500 shadow-sm shadow-purple-600/30' 
                                : 'bg-slate-800/60 text-slate-400 border-slate-700/60 hover:border-slate-600'
                            }`}
                          >
                            <div>{d.shortLabel || d.label.substring(0, 3)}</div>
                            <div className="text-[8px] opacity-75">{d.date.substring(8)}</div>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* 2. Options Checklist */}
                  <div className="space-y-2.5 pt-2 border-t border-slate-800">
                    <label className="flex items-center justify-between p-2.5 bg-slate-800/40 rounded-xl border border-slate-700/50 cursor-pointer hover:bg-slate-800/60 transition-colors">
                      <div className="flex items-center gap-2">
                        <Zap size={15} className="text-amber-400" />
                        <span className="text-xs font-bold text-white">Çarpan Bazlı Önceliklendirme</span>
                      </div>
                      <input 
                        type="checkbox"
                        checked={prioritizeWeakSubjects}
                        onChange={e => setPrioritizeWeakSubjects(e.target.checked)}
                        className="w-4 h-4 rounded text-purple-600 accent-purple-600"
                      />
                    </label>

                    <label className="flex items-center justify-between p-2.5 bg-slate-800/40 rounded-xl border border-slate-700/50 cursor-pointer hover:bg-slate-800/60 transition-colors">
                      <div className="flex items-center gap-2">
                        <Youtube size={15} className="text-red-400" />
                        <span className="text-xs font-bold text-white">Video Sıralamasını Koru</span>
                      </div>
                      <input 
                        type="checkbox"
                        checked={preserveVideoOrder}
                        onChange={e => setPreserveVideoOrder(e.target.checked)}
                        className="w-4 h-4 rounded text-purple-600 accent-purple-600"
                      />
                    </label>

                    <div className="p-2.5 bg-slate-800/40 rounded-xl border border-slate-700/50 space-y-1.5">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-white">Günlük İdeal Görev Sayısı</span>
                        <span className="text-xs font-black text-purple-400">{maxTasksPerDay} Görev</span>
                      </div>
                      <input 
                        type="range"
                        min="2"
                        max="7"
                        value={maxTasksPerDay}
                        onChange={e => setMaxTasksPerDay(parseInt(e.target.value))}
                        className="w-full accent-purple-500 cursor-pointer"
                      />
                    </div>
                  </div>

                  {/* 3. Coach Directives & Note Persistence */}
                  <div className="space-y-2 pt-2 border-t border-slate-800">
                    <div className="flex items-center justify-between">
                      <label className="text-[11px] font-bold text-slate-300 flex items-center gap-1.5">
                        <span>Koç Notu & Özel İstekler</span>
                      </label>

                      <div className="flex items-center gap-1.5">
                        {coachPrompt.trim() && (
                          <button
                            type="button"
                            onClick={handleSaveCurrentPrompt}
                            className="px-2 py-0.5 rounded-lg bg-purple-950/60 hover:bg-purple-900/80 border border-purple-500/30 text-purple-300 hover:text-white text-[10px] font-bold flex items-center gap-1 transition-all cursor-pointer"
                            title="Bu notu sonra da kullanmak üzere kaydet"
                          >
                            <Bookmark size={10} />
                            <span>Kaydet</span>
                          </button>
                        )}
                        {savedCoachPrompts.length > 0 && (
                          <button
                            type="button"
                            onClick={() => setShowSavedPrompts(!showSavedPrompts)}
                            className="px-2 py-0.5 rounded-lg bg-slate-800 hover:bg-slate-750 border border-slate-700 text-slate-300 hover:text-white text-[10px] font-bold flex items-center gap-1 transition-all cursor-pointer"
                            title="Kayıtlı notları göster / gizle"
                          >
                            <History size={10} />
                            <span>Kayıtlı ({savedCoachPrompts.length})</span>
                          </button>
                        )}
                      </div>
                    </div>

                    <textarea 
                      rows={2}
                      value={coachPrompt}
                      onChange={e => setCoachPrompt(e.target.value)}
                      placeholder="Örn: Salı günü dershanesi var o yüzden hafif olsun, Cuma gününe deneme yerleştir..."
                      className="w-full bg-slate-900/80 border border-slate-700/70 rounded-xl p-2.5 text-xs text-white placeholder-slate-500 outline-none focus:border-purple-500 resize-none transition-all"
                    />

                    {/* Saved Coach Notes Chip Selector */}
                    {savedCoachPrompts.length > 0 && (showSavedPrompts || !coachPrompt.trim()) && (
                      <div className="space-y-1.5 pt-1">
                        <div className="flex items-center justify-between text-[10px] text-slate-400">
                          <span className="font-bold">Kayıtlı Şablon / Notlar:</span>
                          <span className="text-[9px] text-purple-400">Tıklayarak nota aktar</span>
                        </div>
                        <div className="flex flex-wrap gap-1.5 max-h-32 overflow-y-auto pr-1">
                          {savedCoachPrompts.map((savedNote, nIdx) => (
                            <div
                              key={nIdx}
                              onClick={() => setCoachPrompt(savedNote)}
                              className="group flex items-center gap-1.5 px-2 py-1 rounded-lg bg-slate-800/80 hover:bg-purple-950/60 border border-slate-700/70 hover:border-purple-500/40 text-[10px] text-slate-300 hover:text-purple-200 transition-all cursor-pointer max-w-full"
                              title={savedNote}
                            >
                              <BookmarkCheck size={10} className="text-purple-400 shrink-0" />
                              <span className="truncate max-w-[220px]">{savedNote}</span>
                              <button
                                type="button"
                                onClick={(e) => handleDeleteSavedPrompt(savedNote, e)}
                                className="opacity-0 group-hover:opacity-100 p-0.5 hover:text-rose-400 text-slate-500 transition-opacity ml-0.5"
                                title="Kayıtlı notu sil"
                              >
                                ×
                              </button>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Primary Action Button */}
                <div className="pt-3">
                  <button
                    type="button"
                    onClick={handleStartDistribution}
                    disabled={isDistributing || poolTasks.length === 0}
                    className={`w-full py-3.5 px-5 rounded-2xl font-black text-xs uppercase tracking-wider flex items-center justify-center gap-2 shadow-xl transition-all cursor-pointer ${
                      isDistributing || poolTasks.length === 0
                        ? 'bg-slate-800 text-slate-500 border border-slate-700 cursor-not-allowed'
                        : 'bg-gradient-to-r from-purple-600 via-indigo-600 to-purple-600 hover:from-purple-500 hover:to-indigo-500 text-white shadow-purple-600/30 active:scale-[0.98]'
                    }`}
                  >
                    {isDistributing ? (
                      <>
                        <Loader2 size={16} className="animate-spin text-white" />
                        <span>Yapay Zeka Dağıtıyor...</span>
                      </>
                    ) : (
                      <>
                        <Sparkles size={16} />
                        <span>Yapay Zeka ile Günlere Dağıt</span>
                      </>
                    )}
                  </button>
                </div>

              </div>

            </div>
          ) : (
            /* TAB 2: DISTRIBUTION PREVIEW */
            <div className="space-y-5">
              {distributionResult && (
                <>
                  {/* AI Reasoning Banner */}
                  <div className="bg-gradient-to-r from-purple-950/40 via-indigo-950/30 to-purple-950/40 border border-purple-500/30 rounded-2xl p-4 space-y-2">
                    <div className="flex items-center gap-2">
                      <Sparkles className="text-purple-400 shrink-0" size={18} />
                      <h4 className="text-sm font-black text-white tracking-tight">
                        Yapay Zeka Koçluk Stratejisi
                      </h4>
                    </div>
                    <p className="text-xs text-slate-300 leading-relaxed">
                      {distributionResult.reasoning}
                    </p>
                  </div>

                  {/* Day-by-Day Result Columns */}
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <h4 className="text-xs font-black text-slate-300 uppercase tracking-wider">
                        Haftalık Dağıtım Planı ({distributionResult.assignedTasks.length} Görev Yerleştirildi)
                      </h4>
                      <button
                        type="button"
                        onClick={() => setActiveTab('pool')}
                        className="text-xs text-purple-400 hover:text-purple-300 font-bold flex items-center gap-1 cursor-pointer"
                      >
                        <RotateCcw size={12} />
                        <span>Ayarları Değiştir</span>
                      </button>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-7 gap-3">
                      {days.filter(d => selectedDates.includes(d.date)).map(day => {
                        const dayTasks = distributionResult.assignedTasks.filter(t => t.date === day.date);
                        const totalDayQ = dayTasks.reduce((acc, t) => acc + (t.type !== 'YouTube Video' ? (t.targetCount || 0) : 0), 0);
                        const totalDayMins = dayTasks.reduce((acc, t) => acc + (t.type === 'YouTube Video' ? (t.durationMinutes || 0) : 0), 0);

                        return (
                          <div 
                            key={day.date}
                            className="bg-slate-800/40 border border-slate-700/60 rounded-2xl p-3 flex flex-col justify-between space-y-2.5 min-h-[160px]"
                          >
                            <div className="space-y-2">
                              <div className="border-b border-slate-700/50 pb-2">
                                <p className="text-xs font-black text-white">{day.label}</p>
                                <p className="text-[10px] text-slate-400">{day.date}</p>
                              </div>

                              <div className="space-y-1.5">
                                {dayTasks.length === 0 ? (
                                  <p className="text-[10px] text-slate-500 italic py-4 text-center">Bu güne görev atanmadı</p>
                                ) : (
                                  dayTasks.map((t, idx) => {
                                    const tMult = getTaskSubjectMultiplier(multipliers, t.subject, t.branch, t.type);
                                    const isWeak = tMult > 1.05;
                                    return (
                                      <div 
                                        key={t.id || idx}
                                        className="p-2 rounded-xl bg-slate-900/80 border border-slate-700/40 text-[10px] space-y-1"
                                      >
                                        <div className="flex items-center justify-between gap-1">
                                          <div className="flex items-center gap-1 min-w-0">
                                            <span className="font-extrabold text-purple-300 uppercase truncate">
                                              {t.subject}
                                            </span>
                                            {isWeak && (
                                              <span className="px-1 py-0.2 rounded text-[8px] font-black bg-rose-500/20 text-rose-300 shrink-0">
                                                x{tMult.toFixed(2)}
                                              </span>
                                            )}
                                          </div>
                                          <span className="text-slate-400 font-bold shrink-0">
                                            {t.type === 'YouTube Video' ? `${t.durationMinutes || 30} dk` : `${t.targetCount || 40} s`}
                                          </span>
                                        </div>
                                        <p className="text-white font-medium truncate flex items-center justify-between gap-1" title={t.topic || t.title}>
                                          <span className="truncate">{t.topic || t.title}</span>
                                          {t.totalSplits > 1 && (
                                            <span className="px-1 py-0.2 rounded text-[8px] font-extrabold bg-purple-500/30 text-purple-300 border border-purple-500/40 shrink-0">
                                              {t.splitIndex}/{t.totalSplits}
                                            </span>
                                          )}
                                        </p>
                                      </div>
                                    );
                                  })
                                )}
                              </div>
                            </div>

                            <div className="pt-2 border-t border-slate-700/50 text-[9.5px] font-bold text-slate-400 flex items-center justify-between">
                              <span>{dayTasks.length} Görev</span>
                              <span>{totalDayQ > 0 ? `${totalDayQ} Soru` : `${totalDayMins} Dk`}</span>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Apply Actions Bar */}
                  <div className="bg-slate-800/60 border border-purple-500/20 rounded-2xl p-4 flex flex-col sm:flex-row items-center justify-between gap-3">
                    <div>
                      <h5 className="text-xs font-black text-white">
                        Bu Dağıtımı Haftalık Programa Uygula
                      </h5>
                      <p className="text-[11px] text-slate-400">
                        Seçtiğiniz plana göre öğrencinin çalışma takvimine eklenecektir.
                      </p>
                    </div>

                    <div className="flex items-center gap-2.5 w-full sm:w-auto">
                      <button
                        type="button"
                        onClick={() => handleApplyToSchedule(false)}
                        className="flex-1 sm:flex-none px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-black transition-all shadow-md shadow-indigo-600/20 cursor-pointer"
                        title="Haftadaki mevcut görevlerin arkasına ekler."
                      >
                        Mevcutların Üzerine Ekle
                      </button>

                      <button
                        type="button"
                        onClick={() => handleApplyToSchedule(true)}
                        className="flex-1 sm:flex-none px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-black transition-all shadow-md shadow-emerald-600/20 cursor-pointer"
                        title="Seçilen günlerdeki mevcut görevleri silip bu yeni dağıtımı yerleştirir."
                      >
                        Seçili Günleri Temizleyip Değiştir
                      </button>
                    </div>
                  </div>
                </>
              )}
            </div>
          )}

        </div>

      </div>

      {/* Manual Task Drawer / Mini Modal */}
      {isManualTaskModalOpen && (
        <div className="fixed inset-0 bg-black/60 z-60 flex items-center justify-center p-4">
          <form 
            onSubmit={handleAddManualTask}
            className="bg-slate-900 border border-indigo-500/40 rounded-2xl p-5 w-full max-w-md space-y-4 shadow-2xl"
          >
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h4 className="text-sm font-black text-white uppercase tracking-tight">Havuza Manuel Görev Ekle</h4>
              <button 
                type="button" 
                onClick={() => setIsManualTaskModalOpen(false)}
                className="text-slate-400 hover:text-white"
              >
                <X size={16} />
              </button>
            </div>

            <div className="space-y-3">
              <div>
                <label className="text-[11px] font-bold text-slate-300 block mb-1">Ders</label>
                <input 
                  type="text" 
                  value={manualSubject} 
                  onChange={e => setManualSubject(e.target.value)}
                  placeholder="Örn: Matematik, Fizik, Türkçe..."
                  required
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl p-2.5 text-xs text-white outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="text-[11px] font-bold text-slate-300 block mb-1">Konu Başlığı</label>
                <input 
                  type="text" 
                  value={manualTopic} 
                  onChange={e => setManualTopic(e.target.value)}
                  placeholder="Örn: Fonksiyonlar Soru Çözümü veya Kamp 1. Gün"
                  required
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl p-2.5 text-xs text-white outline-none focus:border-indigo-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[11px] font-bold text-slate-300 block mb-1">Görev Türü</label>
                  <select 
                    value={manualType} 
                    onChange={e => setManualType(e.target.value)}
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl p-2.5 text-xs text-white outline-none focus:border-indigo-500"
                  >
                    <option value="Soru Çözümü">Soru Çözümü</option>
                    <option value="Konu Çalışması">Konu Çalışması</option>
                    <option value="YouTube Video">YouTube Video</option>
                    <option value="Deneme Sınavı">Deneme Sınavı</option>
                  </select>
                </div>

                <div>
                  <label className="text-[11px] font-bold text-slate-300 block mb-1">
                    {manualType === 'YouTube Video' ? 'Süre (Dk)' : 'Hedef Soru/Sayfa'}
                  </label>
                  <input 
                    type="number" 
                    value={manualTarget} 
                    onChange={e => setManualTarget(e.target.value)}
                    min="1"
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl p-2.5 text-xs text-white outline-none focus:border-indigo-500"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-[11px] font-bold text-slate-300">
                    Kaç Güne Dağıtılsın / Parçalansın?
                  </label>
                  <label className="flex items-center gap-1.5 cursor-pointer text-xs font-bold text-purple-300 hover:text-purple-200">
                    <input 
                      type="checkbox"
                      checked={manualAutoSplit}
                      onChange={e => setManualAutoSplit(e.target.checked)}
                      className="accent-purple-600 rounded w-3.5 h-3.5 cursor-pointer"
                    />
                    <span>Otomatik Bölünsün (Yapay Zekâ)</span>
                  </label>
                </div>

                {manualAutoSplit ? (
                  <div className="p-3 bg-purple-950/30 border border-purple-500/30 rounded-xl flex items-center gap-2.5 text-xs text-purple-200">
                    <Sparkles size={16} className="text-purple-400 shrink-0 animate-pulse" />
                    <span>
                      <strong>Otomatik Bölme Seçildi:</strong> Günler alanı kapatıldı. Yapay zekâ hedef soru sayısına veya video süresine göre gün sayısını kendisi hesaplayacaktır.
                    </span>
                  </div>
                ) : (
                  <div>
                    <div className="grid grid-cols-4 gap-1.5">
                      {[1, 2, 3, 4, 5, 6, 7].map(num => (
                        <button
                          key={num}
                          type="button"
                          onClick={() => setManualSplitDays(num)}
                          className={`py-2 px-1 text-center rounded-xl border text-xs font-black transition-all ${
                            manualSplitDays === num
                              ? 'bg-purple-600 text-white border-purple-500 shadow-sm'
                              : 'bg-slate-800 text-slate-300 border-slate-700 hover:border-slate-600'
                          }`}
                        >
                          {num === 1 ? '1 Gün' : `${num} Güne Böl`}
                        </button>
                      ))}
                    </div>
                    {manualSplitDays > 1 && (
                      <p className="text-[10px] text-purple-300 mt-1 font-medium">
                        Toplam {manualTarget || 40} {manualType === 'YouTube Video' ? 'dakika' : 'soru'} her gün yaklaşık ~{Math.ceil((parseInt(manualTarget) || 40) / manualSplitDays)} adet olarak {manualSplitDays} farklı güne atanacaktır.
                      </p>
                    )}
                  </div>
                )}
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-800">
              <button
                type="button"
                onClick={() => setIsManualTaskModalOpen(false)}
                className="px-3.5 py-2 text-xs font-bold text-slate-400 hover:text-white"
              >
                İptal
              </button>
              <button
                type="submit"
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-black transition-all"
              >
                Havuza Ekle
              </button>
            </div>
          </form>
        </div>
      )}

    </div>
  );
};
