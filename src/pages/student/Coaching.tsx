import React, { useState, useEffect } from 'react';
import { auth } from '../../lib/firebase';
import { studentDataService } from '../../services/studentDataService';
import BookTrackingDetail from './BookTrackingDetail';
import { CheckCircle2, ChevronLeft, ChevronRight, Target, Flame, Sparkles, Plus, X } from 'lucide-react';

export default function Coaching() {
  const [centerDate, setCenterDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [dailyPrograms, setDailyPrograms] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [books, setBooks] = useState<any[]>([]);
  const [showExtraModal, setShowExtraModal] = useState(false);
  const [activeTab, setActiveTab] = useState<'program' | 'kitaplar'>('program');
  const [selectedExtraDate, setSelectedExtraDate] = useState('');
  const [extraTask, setExtraTask] = useState({
     subject: '',
     topic: '',
     type: 'Soru Çözümü',
     targetCount: 0
  });

  const centerDateObj = new Date(centerDate);
  const days = [];
  for (let i = -3; i <= 3; i++) {
      const d = new Date(centerDateObj);
      d.setDate(d.getDate() + i);
      days.push({
          date: d.toISOString().split('T')[0],
          label: d.toLocaleDateString('tr-TR', { weekday: 'long' }),
          shortLabel: d.toLocaleDateString('tr-TR', { day: 'numeric', month: 'short' }),
          isToday: d.toISOString().split('T')[0] === new Date().toISOString().split('T')[0]
      });
  }

  useEffect(() => {
    fetchData();
  }, [centerDate]);

  const fetchData = async () => {
    const user = auth.currentUser;
    if (!user) return;
    setLoading(true);

    const dateStrs = days.map(d => d.date);

    const [programsArray, trackerData, globalBooksData, routinesData] = await Promise.all([
      studentDataService.getDailyPrograms(user.uid, dateStrs),
      studentDataService.getBookTracking(user.uid),
      studentDataService.getGlobalBooks(),
      studentDataService.getRoutines(user.uid)
    ]);
    
    const mergedBooks = trackerData.map((tb: any) => {
        if (tb.globalBookId) {
            const gb = globalBooksData.find((g: any) => g.id === tb.globalBookId);
            if (gb) {
                 return { ...tb, topicQuestionCounts: (gb as any).topicQuestionCounts || {} };
            }
        }
        return tb;
    });
    setBooks(mergedBooks);

    const updatedProgramsArray = [...programsArray];
    const todayStr = new Date().toISOString().split('T')[0];
    
    dateStrs.forEach(dateStr => {
        let dp = updatedProgramsArray.find(p => p.date === dateStr);
        if (!dp) {
             dp = {
                 studentId: user.uid,
                 date: dateStr,
                 tasks: []
             };
             updatedProgramsArray.push(dp);
        }
    });

    setDailyPrograms(updatedProgramsArray);
    setLoading(false);
  };

  const sortTasks = (tasks: any[]) => {
    return [...(tasks || [])].sort((a, b) => {
      const getOrder = (t: any) => {
        if (t.subject === 'Paragraf' || t.topic === 'Paragraf') return 1;
        if (t.subject === 'Problem' || t.topic === 'Problem' || t.subject === 'Problemler' || t.topic === 'Problemler') return 2;
        if (t.type === 'Konu Çalışması') return 3;
        if (t.type === 'YouTube Video') return 4;
        if (t.type === 'Soru Çözümü') return 5;
        return 6;
      };
      const orderA = getOrder(a);
      const orderB = getOrder(b);
      if (orderA !== orderB) return orderA - orderB;
      return a.subject.localeCompare(b.subject);
    });
  };

  const navigateDay = (daysCount: number) => {
    const d = new Date(centerDate);
    d.setDate(d.getDate() + daysCount);
    setCenterDate(d.toISOString().split('T')[0]);
  };

  const toggleTaskDone = async (date: string, taskId: string, currentDone: boolean) => {
    const dayProgram = dailyPrograms.find(p => p.date === date);
    if (!dayProgram) return;

    const updatedTasks = dayProgram.tasks.map((t: any) => {
      if (t.id === taskId) {
        return { ...t, isDone: !currentDone };
      }
      return t;
    });

    const updatedProgram = { ...dayProgram, tasks: updatedTasks };
    
    setDailyPrograms(prev => prev.map(p => p.date === date ? updatedProgram : p));
    await studentDataService.saveDailyProgram(updatedProgram);
  };

  const handleCompletedCountChange = (date: string, taskId: string, value: string) => {
    const count = parseInt(value, 10);
    setDailyPrograms(prev => prev.map(p => {
       if (p.date !== date) return p;
       return {
          ...p,
          tasks: p.tasks.map((t: any) => {
             if (t.id !== taskId) return t;
             return { ...t, completedCount: isNaN(count) ? '' : count, isDone: !isNaN(count) && count >= (Number(t.targetCount) || 1) };
          })
       };
    }));
  };

  const saveTaskUpdate = async (date: string) => {
    const dayProgram = dailyPrograms.find(p => p.date === date);
    if (dayProgram) {
         await studentDataService.saveDailyProgram(dayProgram);
    }
  };

  const handleAddExtraTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!extraTask.subject || !extraTask.topic) return;

    const dayProgram = dailyPrograms.find(p => p.date === selectedExtraDate);
    if (!dayProgram) return;

    const newTask = {
      id: Math.random().toString(36).substr(2, 9),
      subject: extraTask.subject,
      topic: extraTask.topic,
      type: extraTask.type,
      targetCount: Number(extraTask.targetCount) || (extraTask.type === 'Soru Çözümü' ? 50 : 0),
      completedCount: Number(extraTask.targetCount) || (extraTask.type === 'Soru Çözümü' ? 50 : 0),
      isDone: true,
      isExtra: true
    };

    const updatedProgram = { ...dayProgram, tasks: [...(dayProgram.tasks || []), newTask] };
    
    setDailyPrograms(prev => prev.map(p => p.date === selectedExtraDate ? updatedProgram : p));
    await studentDataService.saveDailyProgram(updatedProgram);
    
    setShowExtraModal(false);
    setExtraTask({ subject: '', topic: '', type: 'Soru Çözümü', targetCount: 0 });
  };

  const openExtraModal = (date: string) => {
    setSelectedExtraDate(date);
    setShowExtraModal(true);
  };

  const allVisibleTasks = dailyPrograms.reduce((acc, p) => [...acc, ...(p.tasks || [])], []);
  const totalWeeklyQuestions = allVisibleTasks.reduce((sum: number, t: any) => sum + ((t.type !== 'Konu Çalışması' && t.type !== 'YouTube Video') ? (Number(t.targetCount) || 0) : 0), 0);


  return (
    <div className="space-y-8 pb-20 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div>
        <h1 className="text-3xl font-bold italic text-white uppercase tracking-tight">Koçluk Sayfası</h1>
        <p className="text-slate-500 mt-1">Haftalık çalışma programını ve konu takiplerini buradan yönetebilirsin.</p>
      </div>

      <div className="flex items-center gap-2 bg-slate-900/50 p-1.5 rounded-xl border border-white/5 w-full md:w-fit overflow-x-auto">
        <button 
          onClick={() => setActiveTab('program')}
          className={`shrink-0 px-6 py-2.5 rounded-lg text-sm font-bold transition-all ${activeTab === 'program' ? 'bg-indigo-500 text-white shadow-lg' : 'text-slate-400 hover:text-white hover:bg-white/5'}`}
        >
          HAFTALIK PROGRAM
        </button>
        <button 
          onClick={() => setActiveTab('kitaplar')}
          className={`shrink-0 px-6 py-2.5 rounded-lg text-sm font-bold transition-all ${activeTab === 'kitaplar' ? 'bg-indigo-500 text-white shadow-lg' : 'text-slate-400 hover:text-white hover:bg-white/5'}`}
        >
          KİTAP VE KONU TAKİBİ
        </button>
      </div>

      {loading ? (
        <div className="text-center py-20 text-slate-500 font-bold italic animate-pulse">Program Yükleniyor...</div>
      ) : activeTab === 'program' ? (
        <div className="bg-slate-900/40 border border-white/5 rounded-3xl p-6">
           <div className="flex items-center justify-between mb-8">
              <h2 className="text-xl font-bold text-white uppercase">Haftalık Program</h2>
              <div className="flex items-center gap-4 bg-white/5 p-1 rounded-xl border border-white/10">
                <button onClick={() => navigateDay(-1)} className="p-2 hover:bg-white/10 rounded-lg text-slate-400 transition-colors"><ChevronLeft size={18} /></button>
                <div className="min-w-[140px] text-center">
                   <p className="text-emerald-400 font-bold text-xs uppercase tracking-widest leading-none mb-1">Odak Tarih</p>
                   <p className="text-white font-bold text-sm tracking-tight leading-none">
                     {new Date(centerDate).toLocaleDateString('tr-TR', { day: 'numeric', month: 'long', year: 'numeric' })}
                   </p>
                </div>
                <button onClick={() => navigateDay(1)} className="p-2 hover:bg-white/10 rounded-lg text-slate-400 transition-colors"><ChevronRight size={18} /></button>
              </div>
           </div>

           {allVisibleTasks.length === 0 ? (
               <div className="text-center py-10 border border-dashed border-white/10 rounded-2xl">
                   <p className="text-slate-400 font-bold text-sm">Bu tarih aralığı için planlanmış bir programın bulunmuyor.</p>
               </div>
           ) : (
               <div className="grid grid-cols-1 gap-6">
                 {/* Haftanın Özeti - Student View */}
                 <div className="bg-indigo-900/20 border border-indigo-500/20 rounded-2xl p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-6 mb-4">
                    <div>
                        <p className="text-xs font-black text-indigo-400 uppercase tracking-widest">Haftanın Özeti</p>
                        <p className="text-3xl font-black text-white mt-2">{totalWeeklyQuestions} <span className="text-base text-indigo-400">Soru Hedefi</span></p>
                    </div>
                    <div className="flex items-center gap-6">
                        <div className="bg-slate-900/50 rounded-xl p-4 border border-white/5 min-w-[140px]">
                            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">Görev Sayısı</p>
                            <p className="text-lg font-black text-emerald-400">
                                {allVisibleTasks.length} <span className="text-xs text-slate-500">adet/hafta</span>
                            </p>
                        </div>
                    </div>
                 </div>

                 <div className="bg-indigo-900/20 border border-indigo-500/20 rounded-2xl p-6 mb-4">
                    <p className="text-xs font-black text-indigo-400 uppercase tracking-widest mb-4 border-b border-white/5 pb-2">Haftalık Günlük Dağılım</p>
                    <div className="grid grid-cols-2 lg:grid-cols-4 xl:grid-cols-7 gap-4">
                       {days.map(day => {
                           const dayProgram = dailyPrograms.find((p: any) => p.date === day.date);
                           const dayTasks = dayProgram?.tasks || [];
                           const qCount = dayTasks.reduce((sum: number, t: any) => sum + ((t.type !== 'Konu Çalışması' && t.type !== 'YouTube Video') ? (Number(t.targetCount) || 0) : 0), 0);
                           const tCount = dayTasks.length;
                           return (
                               <div key={day.date} className={`p-3 rounded-xl border flex flex-col items-center text-center ${day.isToday ? 'bg-indigo-500/20 border-indigo-500/50' : 'bg-slate-950/40 border-white/5'}`}>
                                   <p className={`text-[10px] font-black uppercase mb-1 ${day.isToday ? 'text-indigo-400' : 'text-slate-500'}`}>{day.label.substring(0, 3)}</p>
                                   <p className={`text-xl font-black ${day.isToday ? 'text-white' : 'text-white'}`}>{qCount}</p>
                                   <p className="text-[10px] font-bold text-indigo-400 uppercase tracking-widest">Soru</p>
                                   <div className="mt-2 pt-1 border-t border-white/5 w-full">
                                       <p className="text-[10px] font-bold text-slate-400 whitespace-nowrap">{tCount} Görev</p>
                                   </div>
                               </div>
                           );
                       })}
                    </div>
                 </div>

                 <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
                 {days.map((day) => {
                     const dayProgram = dailyPrograms.find((p: any) => p.date === day.date);
                     const dayTasks = sortTasks(dayProgram?.tasks || []);
                     const dayTotalQuestions = dayTasks.reduce((sum: number, t: any) => sum + ((t.type !== 'Konu Çalışması' && t.type !== 'YouTube Video') ? (Number(t.targetCount) || 0) : 0), 0);

                     return (
                     <div key={day.date} className={`border rounded-2xl p-4 flex flex-col gap-3 transition-colors ${day.isToday ? 'bg-indigo-900/10 border-indigo-500/30 shadow-[0_0_15px_rgba(99,102,241,0.1)]' : 'bg-white/5 border-white/5'}`}>
                        <div className="flex items-center justify-between border-b border-white/5 pb-2">
                             <div>
                                 <p className={`text-xs font-black tracking-widest uppercase ${day.isToday ? 'text-indigo-400' : 'text-emerald-400'}`}>
                                    {day.isToday ? 'BUGÜN' : day.label}
                                 </p>
                                 <p className="text-sm font-bold text-slate-200 mt-1">{day.shortLabel}</p>
                             </div>
                             <div className="flex items-center gap-3">
                               {dayTotalQuestions > 0 && (
                                  <div className="text-right">
                                      <p className="text-lg font-black text-white">{dayTotalQuestions}</p>
                                      <p className="text-[10px] font-bold tracking-widest text-slate-400 uppercase">Soru</p>
                                  </div>
                               )}
                               <button 
                                 onClick={() => openExtraModal(day.date)}
                                 className="w-8 h-8 rounded-lg bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center transition-colors shadow-lg"
                                 title="Fazladan Çalışma Ekle"
                               >
                                 <Plus size={16} />
                               </button>
                             </div>
                        </div>

                        {dayTasks.length > 0 ? (
                             <div className="space-y-2">
                                 {dayTasks.map((task: any) => {
                                      const bookName = task.bookId ? (books.find((b: any) => b.id === task.bookId)?.bookName || 'Genel Kaynak') : 'Genel Görev';
                                      const tColor = task.type === 'YouTube Video' ? 'red' : task.type === 'Konu Çalışması' ? 'orange' : 'indigo';
                                      const bgClasses = {
                                          indigo: 'bg-indigo-500/10 text-white border-transparent hover:border-indigo-500/30',
                                          orange: 'bg-orange-500/10 text-orange-100 border-orange-500/30 hover:border-orange-500/50',
                                          red: 'bg-red-500/10 text-red-100 border-red-500/30 hover:border-red-500/50'
                                      }[tColor] || 'bg-indigo-500/10 text-white border-transparent hover:border-indigo-500/30';

                                      return (
                                          <div key={task.id} className={`p-4 rounded-xl border transition-all ${task.isDone ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400' : bgClasses}`}>
                                             <div className="flex items-start justify-between gap-2">
                                                <div>
                                                    <div className="flex items-center gap-2 mb-2">
                                                       <p className={`text-xs font-black uppercase opacity-80 ${task.isDone ? 'text-emerald-400' : ''}`}>{task.type || 'Soru Çözümü'}</p>
                                                       {task.isExtra && (
                                                          <span className="text-[8px] bg-emerald-500 text-white px-1.5 py-0.5 rounded uppercase font-black tracking-widest flex items-center gap-0.5 mt-[-2px]">
                                                             <Sparkles size={8}/> EKSTRA
                                                          </span>
                                                       )}
                                                    </div>
                                                    <p className="text-sm font-black leading-tight mb-1">{task.subject}</p>
                                                    {task.topic && <p className="text-xs font-medium opacity-80 mt-1 max-w-[200px] truncate">{task.topic}</p>}
                                                </div>
                                                {task.type === 'Soru Çözümü' || task.type === 'Konu Çalışması' || task.type === 'YouTube Video' ? (
                                                    <div className="flex items-center gap-2 shrink-0">
                                                        <input
                                                          type="number"
                                                          value={task.completedCount ?? ''}
                                                          onChange={(e) => handleCompletedCountChange(day.date, task.id, e.target.value)}
                                                          onBlur={() => saveTaskUpdate(day.date)}
                                                          placeholder={task.type === 'YouTube Video' ? 'Video' : task.type === 'Konu Çalışması' ? 'Sayfa' : 'Soru'}
                                                          className="w-16 h-10 bg-black/20 border border-white/10 rounded-xl text-center text-white text-xs font-bold focus:outline-none focus:border-emerald-500 transition-colors"
                                                        />
                                                    </div>
                                                ) : (
                                                    <button 
                                                        onClick={() => toggleTaskDone(day.date, task.id, task.isDone)}
                                                        className={`w-10 h-10 rounded-xl flex items-center justify-center border transition-all shrink-0 ${task.isDone ? 'bg-emerald-500 border-emerald-500 text-white shadow-lg shadow-emerald-500/20' : 'border-white/20 text-transparent hover:border-white/40'}`}
                                                    >
                                                        <CheckCircle2 size={20} />
                                                    </button>
                                                )}
                                             </div>
                                             {(task.targetCount > 0 || task.bookId) && (
                                                <div className="mt-4 pt-3 border-t border-white/10 flex items-center justify-between gap-2 text-xs opacity-80">
                                                    <span className="truncate font-semibold">{bookName}</span>
                                                    {task.targetCount > 0 && <span className="font-black shrink-0 bg-black/30 px-2 py-1 rounded-lg text-emerald-400">{task.targetCount} {task.type === 'YouTube Video' ? 'Video' : task.type === 'Konu Çalışması' ? 'Sayfa' : 'Soru'}</span>}
                                                </div>
                                             )}
                                          </div>
                                      );
                                 })}
                             </div>
                        ) : (
                             <div className="h-20 flex items-center justify-center text-slate-500 text-[10px] font-bold uppercase tracking-widest border border-dashed border-white/5 rounded-xl">
                                 Boş Gün
                             </div>
                        )}
                     </div>
                     );
                 })}
                 </div>
               </div>
           )}
        </div>
      ) : (
        <div className="pt-2">
            <BookTrackingDetail />
        </div>
      )}

      {showExtraModal && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-white/10 rounded-2xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="flex justify-between items-center p-4 border-b border-white/5">
              <h3 className="font-bold flex items-center gap-2">
                <Sparkles className="text-emerald-400" size={18} /> 
                <span className="text-white">Kendim Çalıştım</span> 
              </h3>
              <button onClick={() => setShowExtraModal(false)} className="text-slate-400 hover:text-white transition-colors">
                <X size={20} />
              </button>
            </div>
            <form onSubmit={handleAddExtraTask} className="p-4 space-y-4">
               <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">Görev Tipi</label>
                  <select 
                    value={extraTask.type} 
                    onChange={e => setExtraTask(prev => ({ ...prev, type: e.target.value }))}
                    className="w-full bg-slate-800/50 border border-white/10 rounded-lg p-2.5 text-sm text-white focus:outline-none focus:border-emerald-500/50"
                  >
                     <option value="Soru Çözümü">Soru Çözümü</option>
                     <option value="Konu Çalışması">Konu Çalışması</option>
                     <option value="YouTube Video">YouTube Video</option>
                  </select>
               </div>
               <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">Ders Seç</label>
                  <select 
                    required
                    value={extraTask.subject} 
                    onChange={e => setExtraTask(prev => ({ ...prev, subject: e.target.value }))}
                    className="w-full bg-slate-800/50 border border-white/10 rounded-lg p-2.5 text-sm text-white focus:outline-none focus:border-emerald-500/50"
                  >
                     <option value="">Ders Seçiniz...</option>
                     <optgroup label="TYT">
                        <option value="Matematik (TYT)">Matematik (TYT)</option>
                        <option value="Türkçe">Türkçe</option>
                        <option value="Fizik (TYT)">Fizik (TYT)</option>
                        <option value="Kimya (TYT)">Kimya (TYT)</option>
                        <option value="Biyoloji (TYT)">Biyoloji (TYT)</option>
                        <option value="Tarih">Tarih</option>
                        <option value="Coğrafya">Coğrafya</option>
                        <option value="Felsefe">Felsefe</option>
                        <option value="Din Kültürü">Din Kültürü</option>
                     </optgroup>
                     <optgroup label="AYT">
                        <option value="Matematik (AYT)">Matematik (AYT)</option>
                        <option value="Fizik (AYT)">Fizik (AYT)</option>
                        <option value="Kimya (AYT)">Kimya (AYT)</option>
                        <option value="Biyoloji (AYT)">Biyoloji (AYT)</option>
                        <option value="Edebiyat">Edebiyat</option>
                        <option value="Tarih-1">Tarih-1</option>
                        <option value="Coğrafya-1">Coğrafya-1</option>
                        <option value="Tarih-2">Tarih-2</option>
                        <option value="Coğrafya-2">Coğrafya-2</option>
                        <option value="Felsefe Grubu">Felsefe Grubu</option>
                     </optgroup>
                  </select>
               </div>
               <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">Konu veya Kaynak Adı</label>
                  <input 
                    type="text" 
                    required
                    placeholder="Örn: 3D Yayınları veya Türev"
                    value={extraTask.topic} 
                    onChange={e => setExtraTask(prev => ({ ...prev, topic: e.target.value }))}
                    className="w-full bg-slate-800/50 border border-white/10 rounded-lg p-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500/50"
                  />
               </div>
               {extraTask.type === 'Soru Çözümü' && (
               <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">Soru Sayısı</label>
                  <input 
                    type="number" 
                    min="1"
                    required
                    placeholder="Çözülen Soru Sayısı"
                    value={extraTask.targetCount || ''} 
                    onChange={e => setExtraTask(prev => ({ ...prev, targetCount: Number(e.target.value) }))}
                    className="w-full bg-slate-800/50 border border-white/10 rounded-lg p-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500/50"
                  />
               </div>
               )}
               <button type="submit" className="w-full bg-emerald-500 hover:bg-emerald-600 text-white font-bold py-3 px-4 rounded-xl shadow-lg transition-all mt-4">
                  Sisteme Ekle ve Başarımı Artır
               </button>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
