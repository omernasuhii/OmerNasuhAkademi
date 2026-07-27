import fs from 'fs';

const p1 = fs.readFileSync('src/pages/student/Coaching.tsx', 'utf8').split('const toggleTaskDone =')[0];

const theRest = `const toggleTaskDone = async (date: string, taskId: string, currentDone: boolean) => {
    const dayProgram = dailyPrograms.find(p => p.date === date);
    if (!dayProgram) return;
    const targetTask = dayProgram.tasks.find((t: any) => t.id === taskId);
    
    // Deneme Kontrolü: Deneme sonucu girilmeden tamamlandı işaretlenmesin
    if (!currentDone && targetTask) {
        const isDeneme = targetTask.topic?.includes('Deneme') || targetTask.subject?.includes('Genel') || targetTask.subject?.includes('YDT') || targetTask.branch === 'Denemeler' || targetTask.type === 'Deneme';
        if (isDeneme) {
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

                                            let bookName = '';
                                            if (task.bookId) {
                                                const resolved = resolveVirtualBook(task.bookId, task.subject);
                                                if (resolved) bookName = resolved.bookName;
                                                else if (task.bookId.startsWith('virtual-')) {
                                                    bookName = task.bookId.endsWith('-2') ? '2. Kitap (Planlanan)' : '3. Kitap (Planlanan)';
                                                }
                                            }

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
                                                                    </div>
                                                                ) : task.isWaitingResult ? (
                                                                    <div className={\`w-10 h-10 rounded-xl flex flex-col items-center justify-center cursor-pointer shadow-lg transition-all \${isWaitingExpired ? 'bg-red-500/20 border border-red-500 text-red-400 shadow-red-500/10' : 'bg-amber-500/20 border border-amber-500 text-amber-400 shadow-amber-500/10'}\`} onClick={() => toggleTaskWaitingResult(day.date, task.id, task.isWaitingResult)} title={isWaitingExpired ? '5 gün içerisinde sonuç girilmediği için yapılmadı sayıldı.' : 'Sonuç bekleniyor. İptal etmek için tıklayın.'}>
                                                                        <span className="text-[7px] font-black uppercase leading-tight text-center">{isWaitingExpired ? 'Yapılmadı' : 'Sonuç'}</span>
                                                                        <span className="text-[7px] font-bold leading-tight text-center">{isWaitingExpired ? '(5+ Gün)' : 'Bekleniyor'}</span>
                                                                    </div>
                                                                ) : (
                                                                    <div className="flex items-center gap-1">
                                                                        <div className="group relative">
                                                                            <div className="w-10 h-10 rounded-xl flex items-center justify-center border border-white/20 text-slate-400 bg-white/5 cursor-help">
                                                                                <Info size={20} />
                                                                            </div>
                                                                            <div className="absolute right-0 top-full mt-2 w-48 p-2 bg-slate-800 text-white text-xs rounded shadow-xl opacity-0 group-hover:opacity-100 transition-opacity z-50 pointer-events-none z-[100]">
                                                                                Bu denemeyi tamamlandı olarak işaretlemek için lütfen önce 'Denemelerim' sayfasından deneme sonucunuzu giriniz.{isGenelDeneme ? " Veya henüz sonuç açıklanmadıysa 'Sonuç Bekleniyor' olarak işaretleyebilirsiniz." : ""}
                                                                            </div>
                                                                        </div>
                                                                        {isGenelDeneme && (
                                                                            <button
                                                                                onClick={() => toggleTaskWaitingResult(day.date, task.id, false)}
                                                                                className="h-10 px-1.5 rounded-xl border border-amber-500/30 text-amber-500 hover:bg-amber-500 hover:text-white transition-colors text-[8px] font-bold leading-tight flex flex-col items-center justify-center text-center"
                                                                                title="Cevap anahtarı açıklanmadığı için sonucu bekliyorsanız işaretleyin."
                                                                            >
                                                                                <span>Sonuç</span>
                                                                                <span>Bekleniyor</span>
                                                                            </button>
                                                                        )}
                                                                    </div>
                                                                )}
                                                            </div>
                                                        );
                                                    }

                                                    if (task.type === 'Soru Çözümü' || task.type === 'Konu Çalışması' || task.type === 'YouTube Video') {
                                                        return (
                                                            <div className="flex items-center gap-2 shrink-0">
                                                                <input
                                                                  type="number"
                                                                  value={task.completedCount ?? ''}
                                                                  onChange={(e) => handleCompletedCountChange(day.date, task.id, e.target.value)}
                                                                  onBlur={() => saveTaskUpdate(day.date, task.id)}
                                                                  placeholder={task.type === 'YouTube Video' ? 'Video' : task.type === 'Konu Çalışması' ? 'Sayfa' : 'Soru'}
                                                                  className="w-16 h-10 bg-black/20 border border-white/10 rounded-xl text-center text-white text-xs font-bold focus:outline-none focus:border-emerald-500 transition-colors"
                                                                />
                                                            </div>
                                                        );
                                                    }

                                                    return (
                                                        <button 
                                                            onClick={() => toggleTaskDone(day.date, task.id, task.isDone)}
                                                            className={\`w-10 h-10 rounded-xl flex items-center justify-center border transition-all shrink-0 \${task.isDone ? 'bg-emerald-500 border-emerald-500 text-white shadow-lg shadow-emerald-500/20' : 'border-white/20 text-transparent hover:border-white/40'}\`}
                                                        >
                                                            <CheckCircle2 size={20} />
                                                        </button>
                                                    );
                                                })()}
                                             </div>
                                             
                                             {openNotes[\`task-\${task.id}\`] && (
                                                 <div className="mt-3 space-y-2">
                                                     {(task.coachNote || task.note) && (
                                                         <div>
                                                             <p className="text-[9px] font-black tracking-widest text-amber-500 uppercase mb-1">Koç Notu</p>
                                                             <div className="w-full text-xs bg-black/20 text-amber-300 rounded p-2 border border-white/5">
                                                                 {task.coachNote || task.note}
                                                             </div>
                                                         </div>
                                                     )}
                                                     <div>
                                                         <p className="text-[9px] font-black tracking-widest text-emerald-500 uppercase mb-1">Senin Notun</p>
                                                         <textarea
                                                              value={task.studentNote || ''}
                                                              onChange={(e) => handleTaskNoteChange(day.date, task.id, e.target.value)}
                                                             onBlur={() => saveDayProgramOnly(day.date)}
                                                             placeholder="Görev için not yaz..."
                                                              className="w-full text-xs bg-black/20 text-emerald-300 placeholder-slate-500 rounded p-2 outline-none border border-white/5 focus:border-emerald-500/50 transition-colors resize-none"
                                                             rows={2}
                                                         />
                                                     </div>
                                                 </div>
                                             )}
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
           
        {showExtraModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-slate-900 border border-white/10 rounded-2xl p-6 w-full max-w-md shadow-2xl">
            <div className="flex items-center justify-between mb-6">
               <h3 className="text-lg font-black text-white">Ek Görev Ekle</h3>
               <button onClick={() => setShowExtraModal(false)} className="text-slate-400 hover:text-white transition-colors">
                 <X size={24} />
               </button>
            </div>
            
            <form onSubmit={(e) => { e.preventDefault(); handleAddExtraTask(); }} className="space-y-4">
               <div>
                  <label className="block text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1.5 ml-1">Ders Adı *</label>
                  <input
                    type="text"
                    required
                    placeholder="Örn: Matematik"
                    value={extraTask.subject}
                    onChange={e => setExtraTask(prev => ({ ...prev, subject: e.target.value }))}
                    className="w-full bg-slate-800/50 border border-white/10 rounded-lg p-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500/50"
                  />
               </div>
               <div>
                  <label className="block text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1.5 ml-1">Konu Adı</label>
                  <input
                    type="text"
                    placeholder="Örn: Kümeler"
                    value={extraTask.topic}
                    onChange={e => setExtraTask(prev => ({ ...prev, topic: e.target.value }))}
                    className="w-full bg-slate-800/50 border border-white/10 rounded-lg p-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500/50"
                  />
               </div>
               <div>
                  <label className="block text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1.5 ml-1">Görev Türü *</label>
                  <select
                    value={extraTask.type}
                    onChange={e => setExtraTask(prev => ({ ...prev, type: e.target.value }))}
                    className="w-full bg-slate-800/50 border border-white/10 rounded-lg p-2.5 text-sm text-white focus:outline-none focus:border-emerald-500/50"
                  >
                     <option value="Soru Çözümü">Soru Çözümü</option>
                     <option value="Konu Çalışması">Konu Çalışması</option>
                     <option value="YouTube Video">YouTube Video</option>
                     <option value="Deneme">Deneme</option>
                  </select>
               </div>
               {extraTask.type !== 'Deneme' && (
               <div>
                  <label className="block text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1.5 ml-1">
                     Hedef {extraTask.type === 'YouTube Video' ? 'Video' : extraTask.type === 'Konu Çalışması' ? 'Sayfa' : 'Soru'} *
                  </label>
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
`;

fs.writeFileSync('src/pages/student/Coaching.tsx', p1 + theRest);
console.log("Written!");
