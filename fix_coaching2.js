import fs from 'fs';
let code = fs.readFileSync('src/pages/student/Coaching.tsx', 'utf8');

const brokenPart = `        if (isDeneme) {
                                                        return (
                                                            <div className="flex items-center gap-2 shrink-0">
                                                                {task.isDone && !task.isWaitingResult ? (
                                                                    <div className="h-10 px-3 rounded-xl flex items-center justify-center bg-emerald-500 border border-emerald-500 text-white shadow-lg shadow-emerald-500/20 gap-2" title="Deneme sonucu girildi.">`;

const fixedPart = `        if (isDeneme) {
            try {
                const user = auth.currentUser;
                if (user) {
                    const exams = await studentDataService.getExamResults(user.uid);
                    // Check if there is an exam result on this day
                    const hasExam = exams.some((e: any) => e.date === date);
                    if (!hasExam) {
                        alert("Bu denemeyi tamamlandı olarak işaretlemek için lütfen önce 'Denemelerim' sayfasından deneme sonucunuzu giriniz.");
                        return; // Prevent marking as done
                    }
                }
            } catch (e) {
                console.error("Deneme kontrolü başarısız:", e);
            }
        }
    }

    const updatedTasks = dayProgram.tasks.map((t: any) => {
      if (t.id === taskId) {
        return { ...t, isDone: !currentDone };
      }
      return t;
    });
    const updatedProgram = { ...dayProgram, tasks: updatedTasks };
    
    setDailyPrograms(prev => prev.map(p => p.date === date ? updatedProgram : p));
    await studentDataService.saveDailyProgram(updatedProgram);
    
    // Give or remove XP based on new isDone state
    const getTaskXP = (type: string) => {
        if (type === 'Deneme' || type === 'Soru Çözümü') return 20;
        if (type === 'Konu Çalışması') return 15;
        if (type === 'YouTube Video') return 10;
        return 5;
    };
    
    const user = auth.currentUser;
    if (user && userData?.coachId) {
        try {
            const xp = getTaskXP(targetTask?.type || 'Soru Çözümü');
            if (!currentDone) {
                // Giving XP
                await studentDataService.updateStudentPoints(user.uid, userData.coachId, xp);
                
                // Add notification
                if (userData?.coachId) {
                  await notificationService.addNotification({
                    userId: userData.coachId,
                    title: 'Görev Tamamlandı',
                    message: \`Öğrenci bir görevi tamamladı: \${targetTask.subject}\`,
                    type: 'success',
                    link: '/panel/ogrenci/kocluk'
                  });
                }
            } else {
                // Removing XP
                await studentDataService.updateStudentPoints(user.uid, userData.coachId, -xp);
            }
        } catch(e) {
            console.error("XP güncelleme hatası:", e);
        }
    }
  };

  const toggleTaskWaitingResult = async (date: string, taskId: string, currentWaiting: boolean) => {
    const dayProgram = dailyPrograms.find(p => p.date === date);
    if (!dayProgram) return;
    const targetTask = dayProgram.tasks.find((t: any) => t.id === taskId);
    if (!targetTask) return;
    const updatedTasks = dayProgram.tasks.map((t: any) => {
      if (t.id === taskId) {
        return { ...t, isWaitingResult: !currentWaiting, isDone: !currentWaiting };
      }
      return t;
    });
    const updatedProgram = { ...dayProgram, tasks: updatedTasks };
    
    setDailyPrograms(prev => prev.map(p => p.date === date ? updatedProgram : p));
    await studentDataService.saveDailyProgram(updatedProgram);
  };

  const handleCompletedCountChange = (date: string, taskId: string, countStr: string) => {
    setDailyPrograms(prev => prev.map(p => {
      if (p.date !== date) return p;
      return {
        ...p,
        tasks: p.tasks.map((t: any) => {
          if (t.id === taskId) {
             const val = countStr === '' ? null : Number(countStr);
             return { ...t, completedCount: val };
          }
          return t;
        })
      };
    }));
  };

  const saveTaskUpdate = async (date: string, taskId: string) => {
    const dayProgram = dailyPrograms.find(p => p.date === date);
    if (dayProgram) {
        await studentDataService.saveDailyProgram(dayProgram);
    }
  };

  const handleAddExtraTask = async () => {
     if (!extraTask.subject || !extraTask.type || extraTask.targetCount <= 0) {
         alert("Lütfen ders, tür ve hedef soru/sayfa sayısını giriniz.");
         return;
     }
     
     const user = auth.currentUser;
     if (!user) return;
     
     const dayProgram = dailyPrograms.find(p => p.date === selectedExtraDate) || {
         studentId: user.uid,
         date: selectedExtraDate,
         tasks: []
     };
     
     const newTask = {
         id: Math.random().toString(36).substr(2, 9),
         subject: extraTask.subject,
         topic: extraTask.topic || '',
         type: extraTask.type,
         targetCount: Number(extraTask.targetCount),
         isDone: false,
         isExtra: true
     };
     
     const updatedProgram = {
         ...dayProgram,
         tasks: [...(dayProgram.tasks || []), newTask]
     };
     
     setDailyPrograms(prev => {
         let found = false;
         const mapped = prev.map(p => {
             if (p.date === selectedExtraDate) {
                 found = true;
                 return updatedProgram;
             }
             return p;
         });
         if (!found) mapped.push(updatedProgram);
         return mapped;
     });
     
     await studentDataService.saveDailyProgram(updatedProgram);
     setShowExtraModal(false);
     setExtraTask({ subject: '', topic: '', type: 'Soru Çözümü', targetCount: 0 });
  };

  if (loading) {
    return <div className="flex justify-center items-center h-64 text-slate-400">Yükleniyor...</div>;
  }

  return (
    <div className="space-y-6">
        <div className="flex flex-col md:flex-row items-center justify-between gap-4 bg-slate-900 p-4 rounded-2xl border border-white/5">
            <h2 className="text-xl font-black text-white">Koçluk</h2>
            
            <div className="flex items-center gap-2">
                <button
                    onClick={() => setActiveTab('program')}
                    className={\`px-4 py-2 rounded-xl text-sm font-bold transition-all \${activeTab === 'program' ? 'bg-amber-500 text-white shadow-lg shadow-amber-500/20' : 'bg-white/5 text-slate-400 hover:text-white'}\`}
                >
                    Haftalık Program
                </button>
                <button
                    onClick={() => setActiveTab('kitaplar')}
                    className={\`px-4 py-2 rounded-xl text-sm font-bold transition-all \${activeTab === 'kitaplar' ? 'bg-amber-500 text-white shadow-lg shadow-amber-500/20' : 'bg-white/5 text-slate-400 hover:text-white'}\`}
                >
                    Kitap Takipleri
                </button>
            </div>
        </div>
        
        {activeTab === 'kitaplar' ? (
            <BookTrackingDetail studentId={auth.currentUser?.uid || ''} />
        ) : (
            <div className="space-y-6">
                <div className="flex flex-wrap items-center justify-between gap-4">
                    <div className="flex items-center gap-1.5 p-1 bg-white/5 rounded-2xl border border-white/10 w-full md:w-auto">
                        <button onClick={() => navigateDay(-7)} className="w-8 h-8 rounded-xl flex items-center justify-center hover:bg-white/10 text-slate-400 hover:text-white transition-colors"><ChevronsLeft size={16} /></button>
                        <button onClick={() => navigateDay(-1)} className="w-8 h-8 rounded-xl flex items-center justify-center hover:bg-white/10 text-slate-400 hover:text-white transition-colors"><ChevronLeft size={16} /></button>
                        <button onClick={() => setCenterDate(new Date().toISOString().split('T')[0])} className="px-3 h-8 rounded-xl font-bold text-xs bg-amber-500 text-white shadow-lg shadow-amber-500/20">BUGÜN</button>
                        <button onClick={() => navigateDay(1)} className="w-8 h-8 rounded-xl flex items-center justify-center hover:bg-white/10 text-slate-400 hover:text-white transition-colors"><ChevronRight size={16} /></button>
                        <button onClick={() => navigateDay(7)} className="w-8 h-8 rounded-xl flex items-center justify-center hover:bg-white/10 text-slate-400 hover:text-white transition-colors"><ChevronsRight size={16} /></button>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-7 gap-4">
                    {days.map(day => {
                        const dayProgram = dailyPrograms.find(p => p.date === day.date) || { tasks: [] };
                        const sortedTasks = sortTasks(dayProgram.tasks || []);
                        const isPast = new Date(day.date) < new Date(new Date().toISOString().split('T')[0]);
                        
                        return (
                            <div key={day.date} className={\`flex flex-col gap-3 p-4 rounded-3xl border transition-colors \${day.isToday ? 'bg-amber-500/5 border-amber-500/20' : 'bg-slate-900 border-white/5'}\`}>
                                <div className="flex flex-row md:flex-col items-center md:items-start justify-between md:justify-start gap-1 mb-2">
                                    <div className="flex flex-col">
                                        <span className={\`text-[10px] font-black uppercase tracking-widest \${day.isToday ? 'text-amber-500' : 'text-slate-500'}\`}>{day.label}</span>
                                        <span className={\`text-sm font-bold \${day.isToday ? 'text-amber-400' : 'text-white'}\`}>{day.shortLabel}</span>
                                    </div>
                                    
                                    <button 
                                        onClick={() => {
                                            setSelectedExtraDate(day.date);
                                            setShowExtraModal(true);
                                        }}
                                        className="w-8 h-8 rounded-xl bg-white/5 border border-white/10 text-slate-400 hover:text-white hover:bg-white/10 flex items-center justify-center transition-colors md:self-end mt-0 md:-mt-8"
                                        title="Ek Görev Ekle"
                                    >
                                        <Plus size={14} />
                                    </button>
                                </div>
                                
                                <div className="flex flex-col gap-3">
                                    {sortedTasks.length === 0 ? (
                                        <div className="text-center py-6 text-slate-600">
                                            <span className="text-[10px] font-bold uppercase tracking-widest">Görev Yok</span>
                                        </div>
                                    ) : (
                                        sortedTasks.map((task: any) => {
                                            const bgClasses = task.isExtra ? 'bg-emerald-500/5 border-emerald-500/20 hover:border-emerald-500/40 text-emerald-400' : 'bg-white/5 border-white/10 hover:bg-white/10 hover:border-white/20 text-white';
                                            const tDateObj = new Date(day.date);
                                            const todayObj = new Date(new Date().toISOString().split('T')[0]);
                                            const diffDays = Math.floor((todayObj.getTime() - tDateObj.getTime()) / (1000 * 3600 * 24));
                                            const isWaitingExpired = task.isWaitingResult && diffDays >= 5;

                                            const isDeneme = task.topic?.includes('Deneme') || task.subject?.includes('Genel') || task.subject?.includes('YDT') || task.branch === 'Denemeler' || task.type === 'Deneme';
                                            const isGenelDeneme = task.subject?.includes('Genel') || task.subject?.includes('YDT') || task.topic?.includes('Genel');

                                            return (
                                                <div key={task.id} className={\`p-4 rounded-xl border transition-all \${task.isWaitingResult ? (isWaitingExpired ? 'bg-red-500/10 border-red-500/30 text-red-300' : 'bg-amber-500/10 border-amber-500/30 text-amber-400') : (task.isDone ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400' : bgClasses)}\`}>
                                                    <div className="flex items-start justify-between gap-2 mb-2">
                                                        <div className="flex items-center gap-2">
                                                            {task.isExtra && <span className="px-1.5 py-0.5 rounded text-[8px] font-black tracking-widest uppercase bg-emerald-500 text-white">Ek</span>}
                                                            <span className="text-[10px] font-bold opacity-70 uppercase tracking-wider">{task.type || 'Soru Çözümü'}</span>
                                                        </div>
                                                        <button 
                                                           onClick={() => toggleNote(\`task-\${task.id}\`)}
                                                           className={\`p-1 rounded transition-colors \${openNotes[\`task-\${task.id}\`] || task.coachNote || task.studentNote || task.note ? 'text-amber-400 bg-amber-400/10' : 'text-slate-500 hover:text-amber-400 hover:bg-white/5'}\`}
                                                           title="Görev Notu"
                                                       >
                                                           <StickyNote size={12} />
                                                       </button>
                                                    </div>
                                                    <p className="text-sm font-black leading-tight mb-1">{task.subject}</p>
                                                    {task.topic && <p className="text-xs font-medium opacity-80 mt-1 max-w-[200px] truncate">{task.topic}</p>}
                                                </div>
                                                {(() => {
                                                    if (isDeneme) {
                                                        return (
                                                            <div className="flex items-center gap-2 shrink-0">
                                                                {task.isDone && !task.isWaitingResult ? (
                                                                    <div className="h-10 px-3 rounded-xl flex items-center justify-center bg-emerald-500 border border-emerald-500 text-white shadow-lg shadow-emerald-500/20 gap-2" title="Deneme sonucu girildi.">
                                                                        {task.completedCount !== undefined && task.completedCount > 0 && (
                                                                            <div className="flex flex-col items-center border-r border-white/20 pr-2">
                                                                                <span className="text-xs font-black leading-none">{task.completedCount}</span>
                                                                                <span className="text-[7px] font-bold uppercase tracking-wider opacity-90">Soru</span>
                                                                            </div>
                                                                        )}
                                                                        <CheckCircle2 size={16} />
                                                                    </div>`;

code = code.replace(brokenPart, fixedPart);
fs.writeFileSync('src/pages/student/Coaching.tsx', code);
console.log("Restored Coaching.tsx");
