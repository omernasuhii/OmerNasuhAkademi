import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { auth } from '../../lib/firebase';
import { useAuth } from '../../lib/AuthContext';
import { studentDataService } from '../../services/studentDataService';
import { useCurriculum } from '../../lib/CurriculumContext';
import { notificationService } from '../../services/notificationService';
import { calculateBookProgress, getSafePercentage } from '../../utils/bookProgress';
import BookTrackingDetail from './BookTrackingDetail';
import DenemeResultModal from '../../components/DenemeResultModal';
import { CheckCircle2, ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight, Target, Flame, Sparkles, Plus, X, StickyNote, Info, Youtube, Play, Trophy, Trash2, ArrowRight } from 'lucide-react';

export default function Coaching() {
  const { user, userData } = useAuth();
  const currentUid = userData?.uid || user?.uid;
  const [centerDate, setCenterDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [dailyPrograms, setDailyPrograms] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [books, setBooks] = useState<any[]>([]);
  const [showExtraModal, setShowExtraModal] = useState(false);
  const [showDenemeInfoModal, setShowDenemeInfoModal] = useState(false);
  const [activeTab, setActiveTab] = useState<'program' | 'kitaplar'>('program');
  const [selectedExtraDate, setSelectedExtraDate] = useState('');
  const [openNotes, setOpenNotes] = useState<Record<string, boolean>>({});
  const [showDenemeModal, setShowDenemeModal] = useState(false);
  const [selectedDenemeTaskData, setSelectedDenemeTaskData] = useState<any>(null);
  const [taskToDelete, setTaskToDelete] = useState<{ date: string; taskId: string; title: string } | null>(null);
  const [isDeletingTask, setIsDeletingTask] = useState(false);
  const [extraTask, setExtraTask] = useState({
     subject: '',
     topic: '',
     type: 'Soru Çözümü',
     targetCount: 0
  });

  const resolveVirtualBook = (bookId: string, subject: string) => {
    if (!bookId) return null;
    if (bookId.startsWith('virtual-')) {
      const isSecond = bookId.endsWith('-2');
      const index = isSecond ? 1 : 2;
      const subjectBooks = (books || [])
        .filter(b => b.subject === subject && (b.resourceType === 'soru' || b.resourceType === 'fasikul' || !b.resourceType))
        .sort((a,b) => {
            const orderA = a.order !== undefined ? a.order : Number.MAX_SAFE_INTEGER;
            const orderB = b.order !== undefined ? b.order : Number.MAX_SAFE_INTEGER;
            return orderA - orderB;
        });
      return subjectBooks[index] || null;
    }
    return (books || []).find(b => b.id === bookId) || null;
  };

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
  }, [centerDate, currentUid]);

  const fetchData = async () => {
    if (!currentUid) return;
    setLoading(true);

    const dateStrs = days.map(d => d.date);

    const [programsArray, trackerData, globalBooksData, routinesData, userExams] = await Promise.all([
      studentDataService.getDailyPrograms(currentUid, dateStrs),
      studentDataService.getBookTracking(currentUid),
      studentDataService.getGlobalBooks(),
      studentDataService.getRoutines(currentUid),
      studentDataService.getExamResults(currentUid)
    ]);
    
    const mergedBooks = trackerData.map((tb: any) => {
        let extraInfo = {};
        if (tb.globalBookId) {
            const gb = globalBooksData.find((g: any) => g.id === tb.globalBookId);
            if (gb) {
                 extraInfo = { topicQuestionCounts: (gb as any).topicQuestionCounts || {} };
            }
        }
        return {
          ...tb,
          ...extraInfo,
          completionPercentage: getSafePercentage(tb.completionPercentage)
        };
    });
    setBooks(mergedBooks);

    const updatedProgramsArray = [...programsArray];
    const todayStr = new Date().toISOString().split('T')[0];
    
    dateStrs.forEach(dateStr => {
        let dp = updatedProgramsArray.find(p => p.date === dateStr);
        if (!dp) {
             dp = {
                 studentId: currentUid,
                 date: dateStr,
                 tasks: []
             };
             updatedProgramsArray.push(dp);
        } else if (!dp.tasks) {
             dp.tasks = [];
        }

        // Sync deneme results with tasks on dateStr sequentially
        if (userExams && Array.isArray(userExams)) {
            const dateExams = userExams.filter((e: any) => e && (e.date === dateStr || (e.examType === 'YKS' && e.aytDate === dateStr)));

            const isDenemeTask = (t: any) => 
                t.topic?.includes('Deneme') || t.subject?.includes('Genel') || t.subject?.includes('YDT') || t.branch === 'Denemeler' || t.type === 'Deneme';

            const assignedDenemeTasks = (dp.tasks || []).filter((t: any) => isDenemeTask(t) && !t.id?.startsWith('exam-sync-'));
            const nonDenemeTasks = (dp.tasks || []).filter((t: any) => !isDenemeTask(t));

            const updatedDenemeTasks: any[] = [];

            for (let i = 0; i < dateExams.length; i++) {
                const exam: any = dateExams[i];
                const totalSolved = Object.values(exam.scores || {}).reduce((acc: number, curr: any) => {
                    const c = Number((curr as any).c) || Number((curr as any).correct) || 0;
                    const i = Number((curr as any).i) || Number((curr as any).incorrect) || 0;
                    return acc + c + i;
                }, 0);
                const totalQuestions = Object.values(exam.scores || {}).reduce((acc: number, curr: any) => {
                    const c = Number((curr as any).c) || Number((curr as any).correct) || 0;
                    const i = Number((curr as any).i) || Number((curr as any).incorrect) || 0;
                    const b = Number((curr as any).b) || Number((curr as any).blank) || 0;
                    return acc + c + i + b;
                }, 0);

                const countToUse = exam.analyzed ? totalQuestions : totalSolved;

                if (i < assignedDenemeTasks.length) {
                    updatedDenemeTasks.push({
                        ...assignedDenemeTasks[i],
                        isDone: true,
                        isWaitingResult: false,
                        completedCount: countToUse || assignedDenemeTasks[i].completedCount || 1,
                        targetCount: countToUse || assignedDenemeTasks[i].targetCount || 1,
                        examId: exam.id
                    });
                } else {
                    const subjectName = exam.examName || (dateStr === exam.aytDate ? (userData?.branch === 'DİL' ? 'YDT Genel Deneme' : 'AYT Genel Deneme') : (exam.examType === 'TYT' || exam.examType === 'YKS' ? 'TYT Genel Deneme' : exam.examType === 'YDT' ? 'YDT Genel Deneme' : 'Genel Deneme'));
                    updatedDenemeTasks.push({
                        id: 'exam-sync-' + exam.id,
                        examId: exam.id,
                        subject: subjectName,
                        topic: 'Deneme Çözümü',
                        type: 'Deneme',
                        isDone: true,
                        isExtra: true,
                        targetCount: countToUse || 1,
                        completedCount: countToUse || 1
                    });
                }
            }

            for (let j = dateExams.length; j < assignedDenemeTasks.length; j++) {
                const taskToUpdate = { ...assignedDenemeTasks[j] };
                delete taskToUpdate.examId;
                const isWaiting = !!taskToUpdate.isWaitingResult;
                updatedDenemeTasks.push({
                    ...taskToUpdate,
                    isDone: isWaiting ? true : false,
                    isWaitingResult: isWaiting,
                    completedCount: isWaiting ? (taskToUpdate.completedCount || 0) : 0
                });
            }

            dp.tasks = [...nonDenemeTasks, ...updatedDenemeTasks];
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

  const toggleNote = (id: string) => {
       setOpenNotes(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const handleTaskNoteChange = (date: string, taskId: string, studentNote: string) => {
    setDailyPrograms(prev => prev.map(p => {
        if (p.date !== date) return p;
        return {
            ...p,
            tasks: (p.tasks || []).map((t: any) => t.id === taskId ? { ...t, studentNote } : t)
        };
    }));
  };

  const handleDayNoteChange = (date: string, studentNote: string) => {
    setDailyPrograms(prev => {
        let found = false;
        const mapped = prev.map(p => {
            if (p.date !== date) return p;
            found = true;
            return { ...p, studentNote };
        });
        if (!found) {
            mapped.push({ date, studentId: currentUid!, tasks: [], studentNote });
        }
        return mapped;
    });
  };

  const saveDayProgramOnly = async (date: string) => {
      const p = dailyPrograms.find(dp => dp.date === date);
      if (p) {
          await studentDataService.saveDailyProgram(p);
      }
  };

  const { curriculum: CURRICULUM, subtopics: SUBTOPICS } = useCurriculum();

  const openDenemeModalForTask = (task: any, date: string) => {
    const resolvedB = resolveVirtualBook(task.bookId, task.subject);
    setSelectedDenemeTaskData({
      taskId: task.id,
      date: date,
      subject: task.subject,
      denemeTopic: task.topic,
      bookId: task.bookId,
      bookName: resolvedB?.bookName || task.bookName,
      branch: task.branch,
      examType: task.branch === 'Denemeler' ? task.subject : task.branch,
      questionCount: task.targetCount
    });
    setShowDenemeModal(true);
  };

  const toggleTaskDone = async (date: string, taskId: string, currentDone: boolean) => {
    const dayProgram = dailyPrograms.find(p => p.date === date);
    if (!dayProgram) return;

    const targetTask = dayProgram.tasks.find((t: any) => t.id === taskId);
    
    // Deneme Kontrolü: Deneme sonucu girilmeden tamamlandı işaretlenmesin, doğrudan modal açılsın
    if (!currentDone && targetTask) {
        const isDeneme = targetTask.topic?.includes('Deneme') || targetTask.subject?.includes('Genel') || targetTask.subject?.includes('YDT') || targetTask.branch === 'Denemeler' || targetTask.type === 'Deneme';
        if (isDeneme) {
            try {
                if (currentUid) {
                    const exams = await studentDataService.getExamResults(currentUid);
                    // Check if there is an exam result on this day
                    const hasExam = exams.some((e: any) => e.date === date || e.id === targetTask.examId);
                    if (!hasExam) {
                        openDenemeModalForTask(targetTask, date);
                        return; // Prevent marking as done without result
                    }
                }
            } catch (e) {
                console.error("Deneme kontrolü:", e);
                openDenemeModalForTask(targetTask, date);
                return;
            }
        }
    }
    const updatedTasks = dayProgram.tasks.map((t: any) => {
      if (t.id === taskId) {
        return { ...t, isDone: !currentDone };
      }
      return t;
    });

    // Otomatik Kitap Takibi İşaretleme
    if (!currentDone && targetTask && targetTask.bookId && targetTask.topic) {
        const book = books.find(b => b.id === targetTask.bookId);
        const cleanTopic = targetTask.topic.replace(/\s*\((?:Bölüm\s*\d+\/\d+|\d+\.\s*Bölüm)\)\s*$/i, '').trim();
        if (book) {
            const currentTopics = book.completedTopics || [];
            if (!currentTopics.includes(cleanTopic)) {
                const updatedTopics = [...currentTopics, cleanTopic];
                const percentage = calculateBookProgress(book, updatedTopics, CURRICULUM, SUBTOPICS);
                
                await studentDataService.updateBookProgress(book.id, {
                    ...book,
                    completedTopics: updatedTopics,
                    completionPercentage: percentage
                });
                
                // Update local state
                setBooks(prev => prev.map(b => b.id === book.id ? { ...b, completedTopics: updatedTopics, completionPercentage: percentage } : b));
            }
        }
    }

    // Otomatik Aylık Konu Hedefi İşaretleme
    if (currentUid && targetTask && targetTask.subject && targetTask.topic) {
        const cleanTopic = targetTask.topic.replace(/\s*\((?:Bölüm\s*\d+\/\d+|\d+\.\s*Bölüm)\)\s*$/i, '').trim();
        await studentDataService.autoCompleteMonthlyTopicGoal(
            currentUid, 
            targetTask.subject, 
            cleanTopic, 
            date, 
            !currentDone
        ).catch(console.error);
    }

    const updatedProgram = { ...dayProgram, tasks: updatedTasks };
    
    setDailyPrograms(prev => prev.map(p => p.date === date ? updatedProgram : p));
    await studentDataService.saveDailyProgram(updatedProgram);

    const getTaskXP = (type: string) => {
      switch (type) {
        case 'YouTube Video': return 2;
        case 'Konu Çalışması': return 3;
        case 'Soru Çözümü':
        default:
          return 10;
      }
    };

    if (!currentDone) {
      if (currentUid) {
        await studentDataService.awardXP(currentUid, getTaskXP(updatedTasks.find((t:any) => t.id === taskId)?.type), 'Görev Tamamlandı');
      }
    } else {
      if (currentUid) {
        await studentDataService.awardXP(currentUid, -getTaskXP(updatedTasks.find((t:any) => t.id === taskId)?.type), 'Görev İptal Edildi');
      }
    }

    // If we just marked a task as done, check if ALL tasks are now done
    if (!currentDone && updatedTasks.length > 0 && updatedTasks.every((t: any) => t.isDone)) {
      try {
        if (currentUid) {
          await notificationService.addNotification(currentUid, {
            title: 'Günlük Hedef Tamamlandı',
            message: 'Harika! Bugünkü tüm görevlerini başarıyla tamamladın. 🚀',
            type: 'success',
            link: '/panel/ogrenci/kocluk'
          });
        }
      } catch (e) {
        console.error("Bildirim hatası", e);
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

    // Give or remove XP based on new isDone state
    const getTaskXP = (type: string) => {
      switch (type) {
        case 'YouTube Video': return 2;
        case 'Konu Çalışması': return 3;
        case 'Soru Çözümü':
        default:
          return 10;
      }
    };
    if (!currentWaiting) {
      if (currentUid) {
        await studentDataService.awardXP(currentUid, getTaskXP(targetTask.type), 'Görev Tamamlandı');
      }
    } else {
      if (currentUid) {
        await studentDataService.awardXP(currentUid, -getTaskXP(targetTask.type), 'Görev İptal Edildi');
      }
    }
  };

  const handleCompletedCountChange = (date: string, taskId: string, value: string) => {
    const count = parseInt(value, 10);
    setDailyPrograms(prev => prev.map(p => {
       if (p.date !== date) return p;
       return {
          ...p,
          tasks: p.tasks.map((t: any) => {
             if (t.id !== taskId) return t;
             const wasDone = t.isDone;
             const isNowDone = !isNaN(count) && count >= (Number(t.targetCount) || 1);
             return { ...t, completedCount: isNaN(count) ? '' : count, isDone: isNowDone, _wasDone: wasDone };
          })
       };
    }));
  };

  const saveTaskUpdate = async (date: string, taskId: string) => {
    const dayProgram = dailyPrograms.find(p => p.date === date);
    if (dayProgram) {
         const t = dayProgram.tasks.find((task: any) => task.id === taskId);
         if (t && t.isDone !== t._wasDone) {
             const getTaskXP = (type: string) => {
               switch (type) {
                 case 'YouTube Video': return 2;
                 case 'Konu Çalışması': return 3;
                 case 'Soru Çözümü':
                 default:
                   return 10;
               }
             };
             if (currentUid) {
                 await studentDataService.awardXP(currentUid, t.isDone ? getTaskXP(t.type) : -getTaskXP(t.type), t.isDone ? 'Görev Tamamlandı' : 'Görev İptal Edildi');
             }
             
             // Otomatik Kitap Takibi İşaretleme
             if (t.isDone && t.bookId && t.topic) {
                 const book = resolveVirtualBook(t.bookId, t.subject);

                 // Otomatik Aylık Konu Hedefi İşaretleme
                 if (currentUid && t.subject && t.topic) {
                     studentDataService.autoCompleteMonthlyTopicGoal(
                         currentUid,
                         t.subject,
                         t.topic,
                         date,
                         t.isDone
                     ).catch(console.error);
                 }
                 if (book) {
                     const cleanTopic = (t.topic || '').replace(/\s*\((?:Bölüm\s*\d+\/\d+|\d+\.\s*Bölüm)\)\s*$/i, '').trim();
                     const currentTopics = book.completedTopics || [];
                     if (!currentTopics.includes(cleanTopic)) {
                         const updatedTopics = [...currentTopics, cleanTopic];
                         const percentage = calculateBookProgress(book, updatedTopics, CURRICULUM, SUBTOPICS);
                         
                         await studentDataService.updateBookProgress(book.id, {
                             ...book,
                             completedTopics: updatedTopics,
                             completionPercentage: percentage
                         }).catch(console.error);
                         
                         // Update local state
                         setBooks(prev => prev.map(b => b.id === book.id ? { ...b, completedTopics: updatedTopics, completionPercentage: percentage } : b));
                     }
                 }
             }
             
             // check if all are done to send notification
             if (t.isDone && dayProgram.tasks.every((task:any) => task.isDone)) {
                 if (currentUid) {
                     notificationService.addNotification(currentUid, {
                         title: 'Günlük Hedef Tamamlandı',
                         message: 'Harika! Bugünkü tüm görevlerini başarıyla tamamladın. 🚀',
                         type: 'success',
                         link: '/panel/ogrenci/kocluk'
                     }).catch(console.error);
                 }
             }
         }
         
         // clean up temporary temp flag
         const payload = {
             ...dayProgram,
             tasks: dayProgram.tasks.map((task: any) => {
                 const { _wasDone, ...rest } = task;
                 return rest;
             })
         };
         await studentDataService.saveDailyProgram(payload);
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
      isExtra: true,
      addedBy: 'student',
      isStudentAdded: true
    };

    const updatedProgram = { ...dayProgram, tasks: [...(dayProgram.tasks || []), newTask] };
    
    setDailyPrograms(prev => prev.map(p => p.date === selectedExtraDate ? updatedProgram : p));
    await studentDataService.saveDailyProgram(updatedProgram);
    
    if (currentUid) {
        const getTaskXP = (type: string) => {
          switch (type) {
            case 'YouTube Video': return 2;
            case 'Konu Çalışması': return 3;
            case 'Soru Çözümü':
            default:
              return 10;
          }
        };
        await studentDataService.awardXP(currentUid, getTaskXP(newTask.type), 'Ekstra Görev Tamamlandı');
    }
    
    try {
      if (currentUid) {
        await notificationService.addNotification(currentUid, {
          title: 'Ekstra Efor Tebriği',
          message: 'Harika bir çaba! Kendim Çalıştım diyerek ekstra görev ekledin ve çözdün. 🌟',
          type: 'success',
          link: '/panel/ogrenci/kocluk'
        });
      }
    } catch (e) {
      console.error("Bildirim hatası", e);
    }

    setShowExtraModal(false);
    setExtraTask({ subject: '', topic: '', type: 'Soru Çözümü', targetCount: 0 });
  };

  const openExtraModal = (date: string) => {
    setSelectedExtraDate(date);
    setShowExtraModal(true);
  };

  const isStudentExtraTask = (task: any): boolean => {
    if (!task) return false;
    if (task.id && String(task.id).startsWith('exam-sync-')) return false;
    return Boolean(
      task.isStudentAdded ||
      task.addedBy === 'student' ||
      task.addedByStudent ||
      task.createdBy === 'student' ||
      task.isExtra
    );
  };

  const handleDeleteExtraTask = async () => {
    if (!taskToDelete) return;
    const { date, taskId } = taskToDelete;
    const dayProgram = dailyPrograms.find(p => p.date === date);
    if (!dayProgram) {
      setTaskToDelete(null);
      return;
    }

    const targetTask = dayProgram.tasks?.find((t: any) => t.id === taskId);
    if (!targetTask || !isStudentExtraTask(targetTask)) {
      console.warn("Sadece kendi eklediğiniz ekstra çalışmaları silebilirsiniz.");
      setTaskToDelete(null);
      return;
    }

    setIsDeletingTask(true);
    try {
      const updatedTasks = (dayProgram.tasks || []).filter((t: any) => t.id !== taskId);
      const updatedProgram = { ...dayProgram, tasks: updatedTasks };

      setDailyPrograms(prev => prev.map(p => p.date === date ? updatedProgram : p));
      await studentDataService.saveDailyProgram(updatedProgram);

      // If task was marked as done, deduct the awarded XP
      if (currentUid && targetTask.isDone) {
        const getTaskXP = (type: string) => {
          switch (type) {
            case 'YouTube Video': return 2;
            case 'Konu Çalışması': return 3;
            case 'Soru Çözümü':
            default:
              return 10;
          }
        };
        await studentDataService.awardXP(currentUid, -getTaskXP(targetTask.type), 'Ekstra Görev Silindi');
      }
    } catch (error) {
      console.error("Ekstra görev silinirken hata:", error);
    } finally {
      setIsDeletingTask(false);
      setTaskToDelete(null);
    }
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
                <button onClick={() => navigateDay(-7)} className="p-2 hover:bg-white/10 rounded-lg text-slate-400 transition-colors" title="Önceki Hafta"><ChevronsLeft size={18} /></button>
                <button onClick={() => navigateDay(-1)} className="p-2 hover:bg-white/10 rounded-lg text-slate-400 transition-colors" title="Önceki Gün"><ChevronLeft size={18} /></button>
                <div className="min-w-[140px] text-center">
                   <p className="text-emerald-400 font-bold text-xs uppercase tracking-widest leading-none mb-1">Odak Tarih</p>
                   <p className="text-white font-bold text-sm tracking-tight leading-none">
                     {new Date(centerDate).toLocaleDateString('tr-TR', { day: 'numeric', month: 'long', year: 'numeric' })}
                   </p>
                </div>
                <button onClick={() => navigateDay(1)} className="p-2 hover:bg-white/10 rounded-lg text-slate-400 transition-colors" title="Sonraki Gün"><ChevronRight size={18} /></button>
                <button onClick={() => navigateDay(7)} className="p-2 hover:bg-white/10 rounded-lg text-slate-400 transition-colors" title="Sonraki Hafta"><ChevronsRight size={18} /></button>
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

                 <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-6">
                 {days.map((day) => {
                     const dayProgram = dailyPrograms.find((p: any) => p.date === day.date);
                     const dayTasks = sortTasks(dayProgram?.tasks || []);
                     const dayTotalQuestions = dayTasks.reduce((sum: number, t: any) => sum + ((t.type !== 'Konu Çalışması' && t.type !== 'YouTube Video') ? (Number(t.targetCount) || 0) : 0), 0);

                     return (
                     <div key={day.date} className={`border rounded-2xl p-4 flex flex-col gap-3 transition-colors ${day.isToday ? 'bg-indigo-900/10 border-indigo-500/30 shadow-[0_0_15px_rgba(99,102,241,0.1)]' : 'bg-white/5 border-white/5'}`}>
                        <div className="flex items-center justify-between border-b border-white/5 pb-2">
                             <div>
                               <div className="flex items-center gap-2">
                                 <p className={`text-xs font-black tracking-widest uppercase ${day.isToday ? 'text-indigo-400' : 'text-emerald-400'}`}>
                                    {day.isToday ? 'BUGÜN' : day.label}
                                 </p>
                                 <button 
                                     onClick={() => toggleNote(`day-${day.date}`)}
                                     className={`p-1 rounded transition-colors ${openNotes[`day-${day.date}`] || dayProgram?.coachNote || dayProgram?.studentNote || dayProgram?.note ? 'text-amber-400 bg-amber-400/10' : 'text-slate-500 hover:text-amber-400 hover:bg-white/5'}`}
                                     title="Günlük Not"
                                 >
                                     <StickyNote size={14} />
                                 </button>
                               </div>
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

                        {openNotes[`day-${day.date}`] && (
                            <div className="mt-1 space-y-2">
                                {(dayProgram?.coachNote || dayProgram?.note) && (
                                    <div>
                                        <p className="text-[10px] font-black tracking-widest text-amber-500 uppercase mb-1">Koç Notu</p>
                                        <div className="w-full bg-slate-800/50 border border-white/5 rounded-lg p-2 text-xs text-amber-300">
                                            {dayProgram.coachNote || dayProgram.note}
                                        </div>
                                    </div>
                                )}
                                <div>
                                    <p className="text-[10px] font-black tracking-widest text-emerald-500 uppercase mb-1">Öğrenci Notu (Senin Notun)</p>
                                    <textarea 
                                        value={dayProgram?.studentNote || ''}
                                        onChange={(e) => handleDayNoteChange(day.date, e.target.value)}
                                        onBlur={() => saveDayProgramOnly(day.date)}
                                        placeholder="Koça ve kendine not bırak..."
                                        className="w-full bg-black/20 border border-white/5 rounded-lg p-2 text-xs text-emerald-300 placeholder-slate-500 outline-none focus:border-emerald-500/50 resize-none"
                                        rows={2}
                                    />
                                </div>
                            </div>
                        )}

                        {dayTasks.length > 0 ? (
                             <div className="space-y-2">
                                 {dayTasks.map((task: any) => {
                                      const resolvedB = resolveVirtualBook(task.bookId, task.subject);
                                      const bookName = task.bookId 
                                          ? (resolvedB 
                                              ? resolvedB.bookName 
                                              : (task.bookId.startsWith('virtual-') 
                                                  ? (task.bookId.endsWith('-2') ? '2. Kitap (Planlanan)' : '3. Kitap (Planlanan)') 
                                                  : 'Genel Kaynak')) 
                                          : 'Genel Görev';
                                      const tColor = task.type === 'YouTube Video' ? 'red' : task.type === 'Konu Çalışması' ? 'orange' : 'indigo';
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
                                      const bgClasses = {
                                          indigo: 'bg-indigo-500/10 text-white border-transparent hover:border-indigo-500/30',
                                          orange: 'bg-orange-500/10 text-orange-100 border-orange-500/30 hover:border-orange-500/50',
                                          red: 'bg-red-500/10 text-red-100 border-red-500/30 hover:border-red-500/50'
                                      }[tColor] || 'bg-indigo-500/10 text-white border-transparent hover:border-indigo-500/30';

                                      return (
                                          <div key={task.id} className={`p-3.5 sm:p-4 rounded-xl border transition-all overflow-hidden ${task.isWaitingResult ? (isWaitingExpired ? 'bg-red-500/10 border-red-500/30 text-red-300' : 'bg-amber-500/10 border-amber-500/30 text-amber-400') : (task.isDone ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400' : bgClasses)}`}>
                                              <div className="flex items-start justify-between gap-2 min-w-0">
                                                 <div className="flex-1 min-w-0 pr-1">
                                                    <div className="flex items-center gap-2 mb-2 flex-wrap">
                                                       <span className={`text-xs font-black uppercase opacity-80 flex items-center gap-1 ${task.type === 'YouTube Video' ? 'text-red-400' : task.isDone && !isWaitingExpired ? 'text-emerald-400' : isWaitingExpired ? 'text-red-400' : ''}`}>
                                                          {task.type === 'YouTube Video' && <Youtube size={12} className="text-red-400" />}
                                                          {task.type || 'Soru Çözümü'}
                                                       </span>
                                                       {task.type === 'YouTube Video' && (task.durationFormatted || (task.durationMinutes && task.durationMinutes > 0)) && (
                                                          <span className="text-[9px] font-black text-red-400 bg-red-500/10 px-1.5 py-0.5 rounded border border-red-500/20 lowercase tracking-normal">
                                                             {task.durationFormatted || `${task.durationMinutes} dk`}
                                                          </span>
                                                       )}
                                                        {task.isWaitingResult && (
                                                           <span className={`text-[8px] px-1.5 py-0.5 rounded font-black tracking-widest uppercase ${isWaitingExpired ? 'bg-red-500/20 border border-red-500/40 text-red-400' : 'bg-amber-500/20 text-amber-500'}`}>
                                                              {isWaitingExpired ? 'Yapılmadı (5+ Gün Geçti)' : 'Sonuç Bekleniyor'}
                                                           </span>
                                                        )}
                                                       {task.isExtra && (
                                                          <span className="text-[8px] bg-emerald-500 text-white px-1.5 py-0.5 rounded uppercase font-black tracking-widest flex items-center gap-0.5 mt-[-2px]">
                                                             <Sparkles size={8}/> EKSTRA
                                                          </span>
                                                       )}
                                                       <button 
                                                           onClick={() => toggleNote(`task-${task.id}`)}
                                                           className={`p-1 rounded transition-colors ${openNotes[`task-${task.id}`] || task.coachNote || task.studentNote || task.note ? 'text-amber-400 bg-amber-400/10' : 'text-slate-500 hover:text-amber-400 hover:bg-white/5'}`}
                                                           title="Görev Notu"
                                                       >
                                                           <StickyNote size={12} />
                                                       </button>
                                                       {isStudentExtraTask(task) && (
                                                           <button 
                                                               onClick={(e) => {
                                                                   e.stopPropagation();
                                                                   setTaskToDelete({
                                                                       date: day.date,
                                                                       taskId: task.id,
                                                                       title: `${task.subject}${task.topic ? ` (${task.topic})` : ''}`
                                                                   });
                                                               }}
                                                               className="p-1 rounded text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 transition-colors cursor-pointer"
                                                               title="Kendi Eklediğin Ekstra Görevi Sil"
                                                           >
                                                               <Trash2 size={12} />
                                                           </button>
                                                       )}
                                                    </div>
                                                   <p className="text-xs sm:text-sm font-black leading-snug break-words">{task.subject}</p>
                                                </div>
                                                {(() => {
                                                    const isDeneme = task.topic?.includes('Deneme') || task.subject?.includes('Genel') || task.subject?.includes('YDT') || task.branch === 'Denemeler' || task.type === 'Deneme';
                                                    const isGenelDeneme = isDeneme && (
                                                        task.isGenelDeneme ||
                                                        task.subject?.includes('Genel') ||
                                                        task.topic?.includes('Genel') ||
                                                        task.subject === 'TYT Genel' ||
                                                        task.subject === 'AYT Genel' ||
                                                        task.subject === 'YDT Genel' ||
                                                        task.subject?.includes('YKS') ||
                                                        task.subject?.includes('9. Sınıf Genel') ||
                                                        task.subject?.includes('10. Sınıf Genel') ||
                                                        task.subject?.includes('11. Sınıf Genel') ||
                                                        (task.type === 'Deneme' && !task.subject?.includes('Branş') && (task.subject?.includes('TYT') || task.subject?.includes('AYT') || task.subject?.includes('YDT') || task.subject?.includes('Sınıf')))
                                                    );

                                                    if (isGenelDeneme) {
                                                        return (
                                                            <div className="flex items-center gap-2 shrink-0">
                                                                {task.isDone && !task.isWaitingResult ? (
                                                                    <div className="flex items-center gap-2">
                                                                        {(task.completedCount !== undefined && task.completedCount !== null && Number(task.completedCount) > 0) ? (
                                                                            <span className="text-xs font-bold text-emerald-400 bg-emerald-500/10 px-2.5 py-1 rounded-lg border border-emerald-500/20 shadow-sm">
                                                                                {task.completedCount} Soru
                                                                            </span>
                                                                        ) : (task.targetCount !== undefined && task.targetCount !== null && Number(task.targetCount) > 0) ? (
                                                                            <span className="text-xs font-bold text-emerald-400 bg-emerald-500/10 px-2.5 py-1 rounded-lg border border-emerald-500/20 shadow-sm">
                                                                                {task.targetCount} Soru
                                                                            </span>
                                                                        ) : null}
                                                                        <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-emerald-500 border border-emerald-500 text-white shadow-lg shadow-emerald-500/20" title="Deneme sonucu girildi.">
                                                                            <CheckCircle2 size={20} />
                                                                        </div>
                                                                    </div>
                                                                 ) : task.isWaitingResult ? (
                                                                    <div className="flex items-center gap-1.5">
                                                                        <div className={`h-10 px-2.5 rounded-xl flex flex-col items-center justify-center cursor-pointer shadow-lg transition-all ${isWaitingExpired ? 'bg-red-500/20 border border-red-500 text-red-400 shadow-red-500/10' : 'bg-amber-500/20 border border-amber-500 text-amber-400 shadow-amber-500/10'}`} onClick={() => toggleTaskWaitingResult(day.date, task.id, task.isWaitingResult)} title={isWaitingExpired ? '5 gün içerisinde sonuç girilmediği için yapılmadı sayıldı. İptal etmek için tıklayın.' : 'Sonuç bekleniyor. İptal etmek için tıklayın.'}>
                                                                            <span className="text-[8px] font-black uppercase leading-tight text-center">{isWaitingExpired ? 'Yapılmadı' : 'Sonuç'}</span>
                                                                            <span className="text-[8px] font-bold leading-tight text-center">{isWaitingExpired ? '(5+ Gün)' : 'Bekleniyor'}</span>
                                                                        </div>
                                                                        <button
                                                                            type="button"
                                                                            onClick={(e) => {
                                                                                e.stopPropagation();
                                                                                setShowDenemeInfoModal(true);
                                                                            }}
                                                                            className="w-10 h-10 rounded-xl bg-slate-800/80 hover:bg-slate-700/80 border border-white/10 hover:border-amber-500/30 text-slate-300 hover:text-amber-400 flex items-center justify-center transition-colors cursor-pointer shrink-0 shadow-sm"
                                                                            title="Deneme süreci hakkında bilgi"
                                                                        >
                                                                            <Info size={16} />
                                                                        </button>
                                                                    </div>
                                                                 ) : (
                                                                    <div className="flex items-center gap-1.5">
                                                                        <button 
                                                                            onClick={() => toggleTaskWaitingResult(day.date, task.id, false)}
                                                                            className="h-10 px-3 rounded-xl border border-amber-500/30 text-amber-500 hover:bg-amber-500 hover:text-white transition-colors text-[9px] font-bold leading-tight flex flex-col items-center justify-center text-center cursor-pointer shrink-0"
                                                                            title="Cevap anahtarı henüz açıklanmadıysa sonuç bekleniyor olarak işaretleyin."
                                                                        >
                                                                            <span>Sonuç</span>
                                                                            <span>Bekleniyor</span>
                                                                        </button>
                                                                        <button
                                                                            type="button"
                                                                            onClick={(e) => {
                                                                                e.stopPropagation();
                                                                                setShowDenemeInfoModal(true);
                                                                            }}
                                                                            className="w-10 h-10 rounded-xl bg-slate-800/80 hover:bg-slate-700/80 border border-white/10 hover:border-amber-500/30 text-slate-300 hover:text-amber-400 flex items-center justify-center transition-colors cursor-pointer shrink-0 shadow-sm"
                                                                            title="Deneme süreci hakkında bilgi"
                                                                        >
                                                                            <Info size={16} />
                                                                        </button>
                                                                    </div>
                                                                 )}
                                                             </div>
                                                         );
                                                     }
                                                     
                                                     if (isDeneme) {
                                                         return (
                                                             <div className="flex items-center gap-2 shrink-0">
                                                                 {task.isDone ? (
                                                                     <div className="flex items-center gap-2">
                                                                         {(task.completedCount !== undefined && task.completedCount !== null && Number(task.completedCount) > 0) ? (
                                                                             <span className="text-xs font-bold text-emerald-400 bg-emerald-500/10 px-2.5 py-1 rounded-lg border border-emerald-500/20 shadow-sm">
                                                                                 {task.completedCount} Soru
                                                                             </span>
                                                                         ) : (task.targetCount !== undefined && task.targetCount !== null && Number(task.targetCount) > 0) ? (
                                                                             <span className="text-xs font-bold text-emerald-400 bg-emerald-500/10 px-2.5 py-1 rounded-lg border border-emerald-500/20 shadow-sm">
                                                                                 {task.targetCount} Soru
                                                                             </span>
                                                                         ) : null}
                                                                         <button
                                                                             onClick={() => toggleTaskDone(day.date, task.id, true)}
                                                                             className="w-10 h-10 rounded-xl flex items-center justify-center bg-emerald-500 border border-emerald-500 text-white shadow-lg shadow-emerald-500/20 cursor-pointer"
                                                                             title="Tamamlandı işaretini kaldır"
                                                                         >
                                                                             <CheckCircle2 size={20} />
                                                                         </button>
                                                                     </div>
                                                                 ) : task.isWaitingResult ? (
                                                                     <div className="flex items-center gap-1.5">
                                                                         <div className={`h-10 px-2.5 rounded-xl flex flex-col items-center justify-center cursor-pointer shadow-lg transition-all ${isWaitingExpired ? 'bg-red-500/20 border border-red-500 text-red-400 shadow-red-500/10' : 'bg-amber-500/20 border border-amber-500 text-amber-400 shadow-amber-500/10'}`} onClick={() => toggleTaskWaitingResult(day.date, task.id, task.isWaitingResult)} title={isWaitingExpired ? '5 gün içerisinde sonuç girilmediği için yapılmadı sayıldı. İptal etmek için tıklayın.' : 'Sonuç bekleniyor. İptal etmek için tıklayın.'}>
                                                                             <span className="text-[8px] font-black uppercase leading-tight text-center">{isWaitingExpired ? 'Yapılmadı' : 'Sonuç'}</span>
                                                                             <span className="text-[8px] font-bold leading-tight text-center">{isWaitingExpired ? '(5+ Gün)' : 'Bekleniyor'}</span>
                                                                         </div>
                                                                         <button
                                                                             type="button"
                                                                             onClick={(e) => {
                                                                                 e.stopPropagation();
                                                                                 setShowDenemeInfoModal(true);
                                                                             }}
                                                                             className="w-10 h-10 rounded-xl bg-slate-800/80 hover:bg-slate-700/80 border border-white/10 hover:border-amber-500/30 text-slate-300 hover:text-amber-400 flex items-center justify-center transition-colors cursor-pointer shrink-0 shadow-sm"
                                                                             title="Deneme süreci hakkında bilgi"
                                                                         >
                                                                             <Info size={16} />
                                                                         </button>
                                                                     </div>
                                                                 ) : (
                                                                     <div className="flex items-center gap-1.5">
                                                                         <button 
                                                                             onClick={() => toggleTaskWaitingResult(day.date, task.id, false)}
                                                                             className="h-10 px-3 rounded-xl border border-amber-500/30 text-amber-500 hover:bg-amber-500 hover:text-white transition-colors text-[9px] font-bold leading-tight flex flex-col items-center justify-center text-center cursor-pointer shrink-0"
                                                                             title="Cevap anahtarı henüz açıklanmadıysa sonuç bekleniyor olarak işaretleyin."
                                                                         >
                                                                             <span>Sonuç</span>
                                                                             <span>Bekleniyor</span>
                                                                         </button>
                                                                         <button
                                                                             type="button"
                                                                             onClick={(e) => {
                                                                                 e.stopPropagation();
                                                                                 setShowDenemeInfoModal(true);
                                                                             }}
                                                                             className="w-10 h-10 rounded-xl bg-slate-800/80 hover:bg-slate-700/80 border border-white/10 hover:border-amber-500/30 text-slate-300 hover:text-amber-400 flex items-center justify-center transition-colors cursor-pointer shrink-0 shadow-sm"
                                                                             title="Deneme süreci hakkında bilgi"
                                                                         >
                                                                             <Info size={16} />
                                                                         </button>
                                                                     </div>
                                                                 )}
                                                             </div>
                                                         );
                                                     }
                                                    
                                                    if (task.type === 'Soru Çözümü' || task.type === 'Konu Çalışması' || task.type === 'YouTube Video') {
                                                        return (
                                                            <div className="flex flex-col items-center gap-1.5 shrink-0 ml-auto self-start">
                                                                <input
                                                                  type="number"
                                                                  value={task.completedCount ?? ''}
                                                                  onChange={(e) => handleCompletedCountChange(day.date, task.id, e.target.value)}
                                                                  onBlur={() => saveTaskUpdate(day.date, task.id)}
                                                                  placeholder={task.type === 'YouTube Video' ? 'Video' : task.type === 'Konu Çalışması' ? 'Sayfa' : 'Soru'}
                                                                  className="w-14 sm:w-16 h-9 sm:h-10 bg-black/20 border border-white/10 rounded-xl text-center text-white text-xs font-black focus:outline-none focus:border-emerald-500 transition-colors shrink-0 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                                                                />
                                                                {task.type === 'YouTube Video' && task.videoUrl && (
                                                                    <a 
                                                                       href={task.videoUrl} 
                                                                       target="_blank" 
                                                                       rel="noreferrer" 
                                                                       className="w-full text-[10px] text-red-400 hover:text-red-300 bg-red-500/10 hover:bg-red-500/20 py-1 px-1.5 rounded-lg flex items-center justify-center gap-1 font-bold transition-colors border border-red-500/20 shadow-sm"
                                                                       title="YouTube'da İzle"
                                                                    >
                                                                       <Play size={10} fill="currentColor" /> İzle
                                                                    </a>
                                                                )}
                                                            </div>
                                                        );
                                                    }
                                                    
                                                    return (
                                                        <button 
                                                            onClick={() => toggleTaskDone(day.date, task.id, task.isDone)}
                                                            className={`w-10 h-10 rounded-xl flex items-center justify-center border transition-all shrink-0 ${task.isDone ? 'bg-emerald-500 border-emerald-500 text-white shadow-lg shadow-emerald-500/20' : 'border-white/20 text-transparent hover:border-white/40'}`}
                                                        >
                                                            <CheckCircle2 size={20} />
                                                        </button>
                                                    );
                                                })()}
                                             </div>
                                             
                                             {task.topic && (
                                                 <div className="mt-2 pt-2 border-t border-white/5 w-full">
                                                     <p className="text-xs font-medium opacity-85 leading-snug break-words" title={task.topic}>
                                                         {task.topic}
                                                     </p>
                                                 </div>
                                             )}

                                             {openNotes[`task-${task.id}`] && (
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

            {/* Bilgilendirme Notu */}
            <div className="mx-4 mt-4 p-3 bg-indigo-500/10 border border-indigo-500/20 rounded-xl flex items-start gap-2.5">
              <Info className="text-indigo-400 shrink-0 mt-0.5" size={16} />
              <p className="text-xs text-indigo-200/90 leading-relaxed">
                <strong>Bilgi:</strong> Kendi başına bir deneme sınavı çözdüysen sonucunu <strong className="text-indigo-300">Deneme Girişi</strong> menüsünden sisteme kaydedebilirsin. Buradan ise ekstra soru çözümü, konu çalışması veya video izleme görevlerini ekleyebilirsin.
              </p>
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
                        <option value="Türkçe">Türkçe</option>
                        <option value="Matematik (TYT)">Matematik (TYT)</option>
                        <option value="Geometri (TYT)">Geometri (TYT)</option>
                        <option value="Fizik (TYT)">Fizik (TYT)</option>
                        <option value="Kimya (TYT)">Kimya (TYT)</option>
                        <option value="Biyoloji (TYT)">Biyoloji (TYT)</option>
                        <option value="Tarih">Tarih</option>
                        <option value="Coğrafya">Coğrafya</option>
                        <option value="Felsefe">Felsefe</option>
                        <option value="Din Kültürü">Din Kültürü</option>
                        <option value="Paragraf">Paragraf</option>
                        <option value="Problem">Problem</option>
                     </optgroup>
                     {userData?.grade === '9. Sınıf' && (
                       <optgroup label="9. Sınıf">
                          <option value="Türk Dili ve Edebiyatı (9. Sınıf)">Türk Dili ve Edebiyatı</option>
                          <option value="Tarih (9. Sınıf)">Tarih</option>
                          <option value="Coğrafya (9. Sınıf)">Coğrafya</option>
                          <option value="Din Kültürü (9. Sınıf)">Din Kültürü</option>
                          <option value="Matematik (9. Sınıf)">Matematik</option>
                          <option value="Fizik (9. Sınıf)">Fizik</option>
                          <option value="Kimya (9. Sınıf)">Kimya</option>
                          <option value="Biyoloji (9. Sınıf)">Biyoloji</option>
                       </optgroup>
                     )}
                     {userData?.grade === '10. Sınıf' && (
                       <optgroup label="10. Sınıf">
                          <option value="Türk Dili ve Edebiyatı (10. Sınıf)">Türk Dili ve Edebiyatı</option>
                          <option value="Tarih (10. Sınıf)">Tarih</option>
                          <option value="Coğrafya (10. Sınıf)">Coğrafya</option>
                          <option value="Din Kültürü (10. Sınıf)">Din Kültürü</option>
                          <option value="Matematik (10. Sınıf)">Matematik</option>
                          <option value="Fizik (10. Sınıf)">Fizik</option>
                          <option value="Kimya (10. Sınıf)">Kimya</option>
                          <option value="Biyoloji (10. Sınıf)">Biyoloji</option>
                       </optgroup>
                     )}
                     {userData?.grade === '11. Sınıf' && (
                       <optgroup label="11. Sınıf">
                          <option value="Türk Dili ve Edebiyatı (11. Sınıf)">Türk Dili ve Edebiyatı</option>
                          <option value="Tarih (11. Sınıf)">Tarih</option>
                          <option value="Coğrafya (11. Sınıf)">Coğrafya</option>
                          <option value="Din Kültürü (11. Sınıf)">Din Kültürü</option>
                          <option value="Matematik (11. Sınıf)">Matematik</option>
                          <option value="Fizik (11. Sınıf)">Fizik</option>
                          <option value="Kimya (11. Sınıf)">Kimya</option>
                          <option value="Biyoloji (11. Sınıf)">Biyoloji</option>
                       </optgroup>
                     )}
                     <optgroup label="AYT">
                        <option value="Matematik (AYT)">Matematik (AYT)</option>
                        <option value="Geometri (AYT)">Geometri (AYT)</option>
                        <option value="Fizik (AYT)">Fizik (AYT)</option>
                        <option value="Kimya (AYT)">Kimya (AYT)</option>
                        <option value="Biyoloji (AYT)">Biyoloji (AYT)</option>
                        <option value="Edebiyat">Edebiyat</option>
                        <option value="Tarih-1">Tarih-1</option>
                        <option value="Coğrafya-1">Coğrafya-1</option>
                        <option value="Tarih-2">Tarih-2</option>
                        <option value="Coğrafya-2">Coğrafya-2</option>
                        <option value="Felsefe Grubu">Felsefe Grubu (Psikoloji/Sosyoloji/Mantık)</option>
                     </optgroup>
                     <optgroup label="YDT">
                        <option value="İngilizce (YDT)">İngilizce (YDT)</option>
                        <option value="Almanca (YDT)">Almanca (YDT)</option>
                        <option value="Fransızca (YDT)">Fransızca (YDT)</option>
                        <option value="Arapça (YDT)">Arapça (YDT)</option>
                        <option value="Rusça (YDT)">Rusça (YDT)</option>
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

      {/* Deneme Sonuç Giriş Modalı */}
      <DenemeResultModal
        isOpen={showDenemeModal}
        studentId={user?.uid || ''}
        onClose={() => {
          setShowDenemeModal(false);
          setSelectedDenemeTaskData(null);
        }}
        initialData={selectedDenemeTaskData}
        onSuccess={() => {
          fetchData();
        }}
      />

      {taskToDelete && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-white/10 rounded-2xl w-full max-w-sm overflow-hidden animate-in fade-in zoom-in-95 duration-200 p-5 shadow-2xl">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 flex items-center justify-center shrink-0">
                <Trash2 size={20} />
              </div>
              <div>
                <h3 className="font-bold text-white text-base">Ekstra Çalışmayı Sil</h3>
                <p className="text-slate-400 text-xs mt-0.5">Sadece kendi eklediğiniz çalışma kaldırılır</p>
              </div>
            </div>

            <div className="p-3 bg-slate-800/60 border border-white/5 rounded-xl mb-5 text-xs text-slate-300">
              <p className="font-semibold text-white mb-1">{taskToDelete.title}</p>
              <p className="text-slate-400 text-[11px] leading-relaxed">
                Bu ekstra çalışmayı programdan kaldırmak istediğinize emin misiniz? Koçunuzun atadığı görevler korunur.
              </p>
            </div>

            <div className="flex items-center justify-end gap-2.5">
              <button
                type="button"
                disabled={isDeletingTask}
                onClick={() => setTaskToDelete(null)}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold rounded-xl text-xs transition-colors cursor-pointer"
              >
                Vazgeç
              </button>
              <button
                type="button"
                disabled={isDeletingTask}
                onClick={handleDeleteExtraTask}
                className="px-4 py-2 bg-rose-600 hover:bg-rose-500 text-white font-bold rounded-xl text-xs flex items-center gap-1.5 transition-colors shadow-lg shadow-rose-600/20 cursor-pointer disabled:opacity-50"
              >
                {isDeletingTask ? (
                  <span>Siliniyor...</span>
                ) : (
                  <>
                    <Trash2 size={14} />
                    <span>Evet, Sil</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Deneme Bilgilendirme ve Yönlendirme Modalı */}
      {showDenemeInfoModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fadeIn">
          <div className="bg-slate-900 border border-slate-700/80 rounded-2xl w-full max-w-md p-6 shadow-2xl relative">
            <button
              onClick={() => setShowDenemeInfoModal(false)}
              className="absolute top-4 right-4 p-2 text-slate-400 hover:text-white rounded-xl bg-slate-800 hover:bg-slate-700 transition-colors cursor-pointer"
            >
              <X size={18} />
            </button>

            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400 shrink-0">
                <Info size={22} />
              </div>
              <div>
                <h3 className="text-base font-bold text-white">Deneme Süreci & Sonuç Girişi</h3>
                <p className="text-xs text-slate-400">Koçluk programı deneme takibi</p>
              </div>
            </div>

            <div className="space-y-3.5 text-xs text-slate-300 leading-relaxed">
              <div className="p-3 bg-amber-500/10 border border-amber-500/20 rounded-xl">
                <div className="font-bold text-amber-400 mb-1 flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-amber-400"></span>
                  <span>"Sonuç Bekleniyor" Nedir?</span>
                </div>
                <p className="text-slate-300/90 text-[11px]">
                  Denemeyi çözdüyseniz ancak cevap anahtarı henüz yayınlanmadıysa veya optik kontrolü bekliyorsanız, görevi <strong>Sonuç Bekleniyor</strong> olarak işaretleyebilirsiniz. Sonuç girmeniz için 5 gün süreniz bulunur.
                </p>
              </div>

              <div className="p-3 bg-indigo-500/10 border border-indigo-500/20 rounded-xl">
                <div className="font-bold text-indigo-400 mb-1 flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-indigo-400"></span>
                  <span>Deneme Sonuçları Nereden Girilir?</span>
                </div>
                <p className="text-slate-300/90 text-[11px]">
                  Deneme netleri, ders bazlı analizler ve sıralama detayları doğrudan <strong>Denemeler (Deneme Girişi)</strong> sayfasından girilir. Sonucu kaydettiğinizde o güne ait deneme görevi otomatik olarak tamamlandı sayılır.
                </p>
              </div>
            </div>

            <div className="mt-6 flex items-center justify-end gap-2.5">
              <button
                type="button"
                onClick={() => setShowDenemeInfoModal(false)}
                className="px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold rounded-xl text-xs transition-colors cursor-pointer"
              >
                Anladım
              </button>
              <Link
                to="/panel/ogrenci/denemeler"
                onClick={() => setShowDenemeInfoModal(false)}
                className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-xl text-xs flex items-center gap-1.5 transition-colors shadow-lg shadow-indigo-600/20 cursor-pointer"
              >
                <span>Deneme Girişine Git</span>
                <ArrowRight size={14} />
              </Link>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
