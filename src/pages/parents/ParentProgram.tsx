import React, { useState, useEffect } from 'react';
import { useAuth } from '../../lib/AuthContext';
import { useStudent } from '../../lib/StudentContext';
import { studentDataService } from '../../services/studentDataService';
import { Calendar, CheckCircle2, Target, ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight, Check } from 'lucide-react';

export default function ParentProgram() {
  const { userData } = useAuth();
  const { selectedStudent } = useStudent();
  const [centerDate, setCenterDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [dailyPrograms, setDailyPrograms] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const centerDateObj = new Date(centerDate);
  const currentDay = centerDateObj.getDay();
  const diffToMonday = currentDay === 0 ? -6 : 1 - currentDay;

  const days = [];
  for (let i = 0; i < 7; i++) {
      const d = new Date(centerDateObj);
      d.setDate(d.getDate() + diffToMonday + i);
      days.push({
          date: d.toISOString().split('T')[0],
          label: d.toLocaleDateString('tr-TR', { weekday: 'long' }),
          shortLabel: d.toLocaleDateString('tr-TR', { day: 'numeric', month: 'short' }),
          isToday: d.toISOString().split('T')[0] === new Date().toISOString().split('T')[0]
      });
  }

  useEffect(() => {
    fetchData();
  }, [centerDate, userData, selectedStudent]);

  const fetchData = async () => {
    if (!selectedStudent?.uid) {
      setLoading(false);
      return;
    }
    setLoading(true);

    const dateStrs = days.map(d => d.date);
    const programsArray = await studentDataService.getDailyPrograms(selectedStudent.uid, dateStrs);
    
    setDailyPrograms(programsArray);
    setLoading(false);
  };

  const shiftDays = (offset: number) => {
    const d = new Date(centerDate);
    d.setDate(d.getDate() + offset);
    setCenterDate(d.toISOString().split('T')[0]);
  };

  const getProgramForDate = (dateStr: string) => {
    return dailyPrograms.find(p => p.date === dateStr);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64 text-slate-500">
        Yükleniyor...
      </div>
    );
  }

  if (!selectedStudent?.uid) {
    return (
      <div className="flex items-center justify-center h-64 text-slate-500">
        Öğrenci bilgisi bulunamadı. Lütfen öğrencinizle eşleştiğinizden emin olun.
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-700">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-black text-white tracking-tight uppercase">Çalışma Programı</h2>
          <p className="text-slate-500 text-sm mt-1 font-medium italic">{userData?.studentName} isimli öğrencinin haftalık çalışma programı.</p>
        </div>
        
        <div className="flex items-center gap-2 bg-slate-900/50 p-1.5 rounded-2xl border border-white/5">
          <button 
            onClick={() => shiftDays(-7)}
            className="p-2 hover:bg-white/5 rounded-xl transition-colors text-slate-400 hover:text-white"
            title="Önceki Hafta"
          >
            <ChevronsLeft size={20} />
          </button>
          
          <button 
            onClick={() => shiftDays(-1)}
            className="p-2 hover:bg-white/5 rounded-xl transition-colors text-slate-400 hover:text-white"
            title="Önceki Gün"
          >
            <ChevronLeft size={20} />
          </button>
          
          <button 
            onClick={() => setCenterDate(new Date().toISOString().split('T')[0])}
            className="px-4 py-2 text-sm font-semibold bg-white/5 text-white rounded-xl hover:bg-white/10 transition-colors"
          >
            Bugün
          </button>

          <button 
            onClick={() => shiftDays(1)}
            className="p-2 hover:bg-white/5 rounded-xl transition-colors text-slate-400 hover:text-white"
            title="Sonraki Gün"
          >
            <ChevronRight size={20} />
          </button>
          
          <button 
            onClick={() => shiftDays(7)}
            className="p-2 hover:bg-white/5 rounded-xl transition-colors text-slate-400 hover:text-white"
            title="Sonraki Hafta"
          >
            <ChevronsRight size={20} />
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-7 gap-4">
        {days.map((day, index) => {
          const program = getProgramForDate(day.date);
          const tasks = program?.tasks || [];
          
          const sortedTasks = [...tasks].sort((a: any, b: any) => {
            if (a.isDone === b.isDone) return 0;
            return a.isDone ? 1 : -1;
          });

          const doneTasks = tasks.filter((t: any) => t.isDone);
          const progress = tasks.length > 0 ? Math.round((doneTasks.length / tasks.length) * 100) : 0;
          
          return (
            <div 
              key={day.date} 
              className={`flex flex-col h-full bg-slate-900/50 border rounded-3xl overflow-hidden transition-all duration-300 ${
                day.isToday ? 'border-blue-500/50 shadow-[0_0_20px_-10px_rgba(59,130,246,0.3)]' : 'border-white/5 hover:border-white/10'
              }`}
            >
              {/* Day Header */}
              <div className={`p-4 text-center border-b ${day.isToday ? 'border-blue-500/20 bg-blue-500/5' : 'border-white/5 bg-slate-900/50'}`}>
                <div className={`text-xs font-black uppercase tracking-widest ${day.isToday ? 'text-blue-400' : 'text-slate-500'}`}>
                  {day.label}
                </div>
                <div className={`text-lg font-bold mt-1 ${day.isToday ? 'text-blue-100' : 'text-slate-300'}`}>
                  {day.shortLabel}
                </div>
                {tasks.length > 0 && (
                  <div className="mt-3 bg-slate-950 rounded-full h-1.5 overflow-hidden">
                    <div 
                      className={`h-full rounded-full transition-all duration-1000 ${
                        progress === 100 ? 'bg-emerald-500' : 
                        progress > 0 ? 'bg-blue-500' : 'bg-slate-800'
                      }`}
                      style={{ width: `${progress}%` }}
                    />
                  </div>
                )}
              </div>

              {/* Day Content */}
              <div className="flex-1 p-3 space-y-2 min-h-[200px] bg-slate-950/30">
                {tasks.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-full text-center space-y-2 opacity-30 p-4">
                    <Calendar size={24} className="text-slate-400" />
                    <p className="text-xs font-medium text-slate-400">Program Yok</p>
                  </div>
                ) : (
                  sortedTasks.map((task: any, tIdx: number) => {
                    const isWaitingExpired = (() => {
                      if (!task.isWaitingResult || !day.date) return false;
                      const parts = (day.date || '').split('-');
                      if (parts.length !== 3) return false;
                      const tDateObj = new Date(Number(parts[0]), Number(parts[1]) - 1, Number(parts[2]));
                      const todayObj = new Date();
                      const todayZero = new Date(todayObj.getFullYear(), todayObj.getMonth(), todayObj.getDate());
                      const diffDays = Math.floor((todayZero.getTime() - tDateObj.getTime()) / (1000 * 3600 * 24));
                      return diffDays >= 5;
                    })();

                    return (
                    <div 
                      key={tIdx} 
                      className={`p-3 rounded-2xl border transition-all ${task.isWaitingResult ? (isWaitingExpired ? 'bg-red-500/10 border-red-500/30' : 'bg-amber-500/5 border-amber-500/20') : task.isDone ? 'bg-emerald-500/5 border-emerald-500/20' : 'bg-slate-900 border-white/5'}`}
                    >
                      <div className="flex items-start gap-3">
                        <div className={`mt-0.5 w-4 h-4 rounded-full flex items-center justify-center shrink-0 border ${
                          task.isDone && !isWaitingExpired
                            ? 'bg-emerald-500 border-emerald-500 text-white' 
                            : isWaitingExpired
                              ? 'bg-red-500/20 border-red-500 text-red-400'
                              : 'border-slate-700 text-transparent'
                        }`}>
                          <Check size={10} strokeWidth={4} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <span className={`text-xs font-black uppercase tracking-wider ${
                              task.isDone && !task.isWaitingResult ? 'text-emerald-400' : task.isWaitingResult ? (isWaitingExpired ? 'text-red-400' : 'text-amber-400') : 'text-blue-400'
                            }`}>
                              {task.subject}
                            </span>
                            {task.isWaitingResult && (
                              <span className={`text-[9px] px-1.5 py-0.5 rounded font-black tracking-widest uppercase ${isWaitingExpired ? 'bg-red-500/20 text-red-400 border border-red-500/30' : 'bg-amber-500/20 text-amber-500'}`}>
                                {isWaitingExpired ? 'Yapılmadı (5+ Gün Geçti)' : 'Sonuç Bekleniyor'}
                              </span>
                            )}
                          </div>
                          
                          {task.topic && (
                            <p className={`text-sm mt-1 font-medium ${
                              task.isDone ? 'text-slate-300' : 'text-slate-200'
                            }`}>
                              {task.topic}
                            </p>
                          )}
                          
                          {(task.targetCount > 0 || task.completedCount > 0) && (
                            <div className="mt-2 flex flex-col gap-1.5 text-xs font-medium text-slate-500">
                              <div className="flex items-center gap-1.5">
                                <Target size={12} />
                                <span>
                                  Hedef: {task.targetCount || '-'} {task.type === 'Soru Çözümü' ? 'Soru' : task.type === 'YouTube Video' ? 'Video' : (task.type === 'Kitap Okuma' || task.type === 'Konu Çalışması') ? 'Sayfa' : ''}
                                </span>
                              </div>
                              {task.isDone && (
                                <div className="flex items-center gap-1.5 text-emerald-500">
                                  <CheckCircle2 size={12} />
                                  <span>
                                    Yapılan: {task.completedCount || task.targetCount} {task.type === 'Soru Çözümü' ? 'Soru' : task.type === 'YouTube Video' ? 'Video' : (task.type === 'Kitap Okuma' || task.type === 'Konu Çalışması') ? 'Sayfa' : ''}
                                  </span>
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  ); })
                )}
                
                {program?.studentNote && (
                  <div className="mt-4 p-3 rounded-2xl bg-amber-500/5 border border-amber-500/20">
                    <p className="text-[10px] font-black uppercase tracking-widest text-amber-500 mb-1">
                      Öğrenci Notu
                    </p>
                    <p className="text-sm text-slate-300">
                      {program.studentNote}
                    </p>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
