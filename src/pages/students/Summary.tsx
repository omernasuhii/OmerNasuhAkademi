import { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { 
  AlertTriangle, BookOpen, 
  Target, 
  CheckCircle2,
  Zap,
  Flame,
  Crown,
  Wallet,
  Activity,
  TrendingUp,
  CalendarDays,
  Info,
  Brain
} from 'lucide-react';
import { useAuth } from '../../lib/AuthContext';
import { studentDataService } from '../../services/studentDataService';
import { programService } from '../../services/programService';
import { eventService } from '../../services/eventService';
import { safeStorage } from '../../lib/localStorage';
import { Link } from 'react-router-dom';
import { NotificationPrompt } from '../../components/NotificationPrompt';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { SUBSCRIPTION_PACKAGES } from './Subscription';
import { isSubscriptionActive, syncExpiredSubscriptionStatus } from '../../services/subscriptionService';

import { notificationService } from '../../services/notificationService';
import { fcmService } from '../../services/fcmService';

export default function Summary() {
  const { userData, user } = useAuth();

  
  const [books, setBooks] = useState<any[]>([]);
  const [exams, setExams] = useState<any[]>([]);
  const [dailyTasks, setDailyTasks] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeExamTab, setActiveExamTab] = useState<'TYT' | 'AYT'>('TYT');
  const [showStreakInfo, setShowStreakInfo] = useState(false);
  const [showXpInfo, setShowXpInfo] = useState(false);
  const [showContributionGraph, setShowContributionGraph] = useState(false);
  const [contributionData, setContributionData] = useState<Record<string, number>>({});
  const [contributionLoading, setContributionLoading] = useState(false);
  const [activeStreakCount, setActiveStreakCount] = useState(0);
  const [secretStreakActive, setSecretStreakActive] = useState(false);
  const [freezeRights, setFreezeRights] = useState(0);
  const [isCabaCompleted, setIsCabaCompleted] = useState<boolean>(false);
  const [pendingResultsCount, setPendingResultsCount] = useState(0);
  const [expiredWaitingCount, setExpiredWaitingCount] = useState(0);

  const loadContributionGraph = async () => {
    setShowContributionGraph(true);
    if (Object.keys(contributionData).length > 0) return;
    setContributionLoading(true);
    try {
      const data = await studentDataService.getAllDailyPrograms(userData.uid);
      const mappedData = data.reduce((acc, prog) => {
        const taskCount = (prog.tasks || []).length;
        const completedCount = (prog.tasks || []).filter((t: any) => t.isDone).length;
        const pct = taskCount > 0 ? completedCount / Math.max(1, taskCount) : 0;
        let level = 0;
        if (taskCount > 0) {
          if (pct === 1) level = 4;
          else if (pct >= 0.85) level = 3;
          else if (pct >= 0.5) level = 2;
          else if (pct > 0) level = 1;
        }
        acc[prog.date] = level;
        return acc;
      }, {} as Record<string, number>);
      setContributionData(mappedData);
    } catch(e) {
      console.error(e);
    } finally {
      setContributionLoading(false);
    }
  };

  const getAcademicYearDays = () => {
    const today = new Date();
    const currentYear = today.getFullYear();
    const startYear = today.getMonth() >= 6 ? currentYear : currentYear - 1;
    
    const startDate = new Date(startYear, 6, 1); // July 1st
    const endDate = new Date(startYear + 1, 5, 30); // June 30th
    
    // adjust start date to the nearest Monday
    const startDay = startDate.getDay();
    const diff = startDate.getDate() - startDay + (startDay === 0 ? -6 : 1); 
    const gridStart = new Date(startDate.setDate(diff));
    
    const days = [];
    let current = new Date(gridStart);
    while (current <= endDate) {
      const y = current.getFullYear();
      const m = String(current.getMonth() + 1).padStart(2, '0');
      const d = String(current.getDate()).padStart(2, '0');
      days.push(`${y}-${m}-${d}`);
      current.setDate(current.getDate() + 1);
    }
    while (days.length % 7 !== 0) {
      const y = current.getFullYear();
      const m = String(current.getMonth() + 1).padStart(2, '0');
      const d = String(current.getDate()).padStart(2, '0');
      days.push(`${y}-${m}-${d}`);
      current.setDate(current.getDate() + 1);
    }
    return days;
  };

  useEffect(() => {
    async function loadData() {
      if (userData?.uid) {
        setLoading(true);
        const today = new Date().toISOString().split('T')[0];
        
        // Tomorrow for checking empty day warning
        const tomorrowDate = new Date();
        tomorrowDate.setDate(tomorrowDate.getDate() + 1);
        const tomorrow = tomorrowDate.toISOString().split('T')[0];

        try {
          const docRef = doc(db, 'caba_tests', userData.uid);
          const docSnap = await getDoc(docRef);
          setIsCabaCompleted(docSnap.exists());
        } catch (e) {
          console.error("Caba check error:", e);
        }
        
        const [booksRes, examsRes, dailyRes, tomorrowRes, enrollmentsRes, rsvpsRes] = await Promise.all([
          studentDataService.getBookTracking(userData.uid),
          studentDataService.getExamResults(userData.uid),
          studentDataService.getDailyPrograms(userData.uid, [today]),
          studentDataService.getDailyPrograms(userData.uid, [tomorrow]),
          programService.getStudentEnrollments(userData.uid),
          eventService.getStudentRSVPs(userData.uid)
        ]);
        
        const todayTasks = dailyRes[0]?.tasks || [];
        setBooks(booksRes || []);
        setExams(examsRes || []);
        setDailyTasks(todayTasks);
        
        // Client-side automatic checks (simulate cron for now)
        try {
            const now = new Date();

            // --- Analyze Streaks ---
            // 1. Secret Streak Check (Weekly)
            const currentWeekStart = new Date();
            currentWeekStart.setDate(currentWeekStart.getDate() - (currentWeekStart.getDay() === 0 ? 6 : currentWeekStart.getDay() - 1));
            currentWeekStart.setHours(0,0,0,0);
            
            let hasExamThisWeek = false;
            examsRes?.forEach((exam: any) => {
                if (exam.date && new Date(exam.date) >= currentWeekStart) {
                    hasExamThisWeek = true;
                }
            });
            const hasAssistantThisWeek = userData?.streakInfo?.lastAssistantDate && new Date(userData.streakInfo.lastAssistantDate) >= currentWeekStart;
            const isSecretActive = hasExamThisWeek && hasAssistantThisWeek;
            setSecretStreakActive(!!isSecretActive);

            // 2. Daily Streak Catch-up (Up to yesterday)
            let sCount = userData?.streakInfo?.count ?? userData?.streak ?? 0;
            let fRights = userData?.streakInfo?.freezeRights ?? 0;
            const lastCalc = userData?.streakInfo?.lastCalculateDate;
            
            const yesterdayDate = new Date();
            yesterdayDate.setDate(yesterdayDate.getDate() - 1);
            const yesterdayStr = yesterdayDate.toISOString().split('T')[0];
            
            if (!lastCalc || lastCalc < yesterdayStr) {
                 let current = lastCalc ? new Date(lastCalc) : new Date(yesterdayStr);
                 if (lastCalc) current.setDate(current.getDate() + 1);
                 
                 const missingDates = [];
                 while (current <= yesterdayDate) {
                     missingDates.push(current.toISOString().split('T')[0]);
                     current.setDate(current.getDate() + 1);
                 }
                 
                 if (missingDates.length > 0) {
                     const missingProgs = await studentDataService.getDailyPrograms(userData.uid, missingDates);
                     missingDates.forEach(date => {
                         const prog = missingProgs.find(p => p.date === date);
                         const pTasks = prog?.tasks || [];
                         const pComps = pTasks.filter((t:any) => t.isDone).length;
                         const pct = pTasks.length > 0 ? (pComps / pTasks.length) * 100 : 0;
                         
                         if (pct >= 85) {
                             sCount++;
                             if (sCount % 7 === 0) fRights = Math.min(3, fRights + 1);
                         } else if (pTasks.length > 0 || (pTasks.length === 0 && sCount > 0)) {
                             // Break streak or use freeze
                             if (fRights > 0) {
                                 fRights--;
                             } else {
                                 sCount = 0;
                             }
                         }
                     });
                     
                     await studentDataService.updateStudentProfile(userData.uid, {
                         'streakInfo.count': sCount,
                         'streakInfo.freezeRights': fRights,
                         'streakInfo.lastCalculateDate': yesterdayStr,
                         streak: sCount // Backwards compatibility for coach view
                     });
                 }
            }
            
            // 2.5 Expired "Sonuç Bekleniyor" check
            const pastDates = [];
            for (let i = 1; i <= 14; i++) {
                const d = new Date();
                d.setDate(d.getDate() - i);
                pastDates.push(d.toISOString().split('T')[0]);
            }
            const pastProgs = await studentDataService.getDailyPrograms(userData.uid, pastDates);
            let hasExpiredWaiting = false;
            const nowTimeStr = new Date().toISOString().split('T')[0];
            const nowTime = new Date(nowTimeStr);
            
            pastProgs.forEach(prog => {
                const progDate = new Date(prog.date);
                const diffDays = Math.floor((nowTime.getTime() - progDate.getTime()) / (1000 * 3600 * 24));
                if (diffDays >= 2) { // 2 days or more (if it was day before yesterday, it's 2 days ago. We'll give them 2 days)
                    if (prog.tasks?.some((t:any) => t.isWaitingResult)) {
                        hasExpiredWaiting = true;
                    }
                }
            });

            let currentPending = 0;
            let currentExpired = 0;
            pastProgs.forEach(prog => {
                const progDate = new Date(prog.date);
                const diffDays = Math.floor((nowTime.getTime() - progDate.getTime()) / (1000 * 3600 * 24));
                (prog.tasks || []).forEach((t: any) => {
                    if (t.isWaitingResult) {
                        if (diffDays >= 5) {
                            currentExpired++;
                        } else {
                            currentPending++;
                        }
                    }
                });
            });
            setPendingResultsCount(currentPending);
            setExpiredWaitingCount(currentExpired);

            if (hasExpiredWaiting && sCount > 0) {
                sCount = 0;
                await studentDataService.updateStudentProfile(userData.uid, {
                    'streakInfo.count': 0,
                    streak: 0
                });
                // Also add a notification?
                await notificationService.addNotification(userData.uid, {
                    title: 'Seriniz Sıfırlandı',
                    message: '2 günden fazla süredir sonuç bekleyen denemeleriniz olduğu için çalışma seriniz sıfırlandı.',
                    type: 'system',
                });
            }

            // 3. Today's immediate visual contribution
            const tTotal = todayTasks.length;
            const tComp = todayTasks.filter((t:any) => t.isDone).length;
            const tPct = tTotal > 0 ? (tComp / tTotal) * 100 : 0;
            
            setActiveStreakCount(tPct >= 85 ? sCount + 1 : sCount);
            setFreezeRights(fRights);
            // -----------------------
            
            // Subscription expiry warnings
            if (userData?.subscriptionStatus === 'active' && userData?.subscriptionEndDate && userData?.subscriptionPlan) {
               const subEnd = new Date(userData.subscriptionEndDate);
               const daysToSubEnd = Math.max(0, Math.ceil((subEnd.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)));
               
               const subWarnKey = `sub_warn_${userData.uid}_${daysToSubEnd}`;
               if (!safeStorage.getItem(subWarnKey)) {
                  if (daysToSubEnd <= 3 && daysToSubEnd > 0) {
                     if (userData.autoRenew === false) {
                        safeStorage.setItem(subWarnKey, 'true');
                        await notificationService.addNotification(userData.uid, {
                           title: 'Abonelik Sona Eriyor',
                           message: `Dikkat! ${userData.subscriptionPlan} aboneliğinin süresinin dolmasına son ${daysToSubEnd} gün kaldı. Yenilemeyi unutma!`,
                           type: 'system',
                           link: '/panel/ogrenci/abonelik'
                        });
                     } else {
                        // Check if balance is enough
                        const currentPkg = SUBSCRIPTION_PACKAGES.find((p: any) => p.name === userData.subscriptionPlan);
                        if (currentPkg && (userData.walletBalance || 0) < currentPkg.price) {
                           safeStorage.setItem(subWarnKey, 'true');
                           await notificationService.addNotification(userData.uid, {
                              title: 'Bakiye Yetersiz Uyarısı',
                              message: `${userData.subscriptionPlan} aboneliğin ${daysToSubEnd} gün sonra otomatik olarak güncellenecek ancak cüzdanında yeterli bakiyen bulunmuyor.`,
                              type: 'payment',
                              link: '/panel/ogrenci/cuzdan'
                           });
                        }
                     }
                  }
               }
            }

            // Event reminders (Approaching 24 hours)
            try {
               for (const rsvp of rsvpsRes) {
                  if (rsvp.status !== 'attending') continue;
                  
                  const eventSnap = await getDoc(doc(db, 'events', rsvp.eventId));
                  if (eventSnap.exists()) {
                     const evData = eventSnap.data();
                     const eventDate = new Date(evData.date);
                     const diffHours = (eventDate.getTime() - now.getTime()) / (1000 * 60 * 60);
                     
                     if (diffHours > 0 && diffHours <= 24) {
                        const eventReminderKey = `event_reminder_${rsvp.id}`;
                        if (!safeStorage.getItem(eventReminderKey)) {
                           safeStorage.setItem(eventReminderKey, 'true');
                           await notificationService.addNotification(userData.uid, {
                              title: 'Etkinlik Hatırlatıcısı',
                              message: `Hatırlatma: Katılacağın "${evData.title}" etkinliği yaklaşıyor. Etkinlik saati: ${new Date(evData.date).toLocaleTimeString('tr-TR', {hour: '2-digit', minute:'2-digit'})}`,
                              type: 'system',
                              link: '/panel/ogrenci/etkinlikler'
                           });
                        }
                     }
                  }
               }
            } catch(e) {}
            
            // Check for inactive online programs (No activity for 3 days) and time limits
            for (const enr of enrollmentsRes) {
              if (!enr.completed) {
                const checkDate = enr.updatedAt || enr.enrolledAt;
                const d = new Date(checkDate);
                const diffDays = Math.floor((now.getTime() - d.getTime()) / (1000 * 60 * 60 * 24));
                if (diffDays >= 3) {
                  const inactiveKey = `inactive_warn_${enr.id}_${now.toISOString().split('T')[0]}`;
                  if (!safeStorage.getItem(inactiveKey)) {
                     safeStorage.setItem(inactiveKey, 'true');
                     await notificationService.addNotification(userData.uid, {
                        title: 'Eğitim Seni Özledi',
                        message: 'Bir eğitim programına kayıtlısın ama uzun süredir adım tamamlamadın. Kaldığın yerden devam etmeye ne dersin?',
                        type: 'system',
                        link: '/panel/ogrenci/online-egitimler'
                     });
                  }
                }
                
                // Fetch program to check time limit
                try {
                   const progSnap = await getDoc(doc(db, 'programs', enr.programId));
                   if (progSnap.exists()) {
                      const prog = progSnap.data();
                      if (prog.timeLimitDays) {
                         const enrolledD = new Date(enr.enrolledAt);
                         const deadlineDays = Math.floor((now.getTime() - enrolledD.getTime()) / (1000 * 60 * 60 * 24));
                         const remainingDays = prog.timeLimitDays - deadlineDays;
                         
                         if (remainingDays <= 2 && remainingDays > 0) {
                            const timeLimitKey = `timelimit_warn_${enr.id}_${remainingDays}`;
                            if (!safeStorage.getItem(timeLimitKey)) {
                               safeStorage.setItem(timeLimitKey, 'true');
                               await notificationService.addNotification(userData.uid, {
                                  title: 'Eğitim Süresi Bitiyor',
                                  message: `Dikkat! "${prog.title}" programının süresinin dolmasına son ${remainingDays} gün kaldı.`,
                                  type: 'system',
                                  link: '/panel/ogrenci/online-egitimler'
                               });
                            }
                         }
                      }
                   }
                } catch(e) {}
              }
            }
            // Ask for a reminder only if it's past 20:00 (8 PM) locally
            if (now.getHours() >= 20) {
               const uncompletedTasks = todayTasks.filter((t: any) => !t.isDone);
               if (uncompletedTasks.length > 0) {
                  const lastRemindedDate = safeStorage.getItem(`lastDailyReminder_${userData.uid}`);
                  if (lastRemindedDate !== today) {
                     safeStorage.setItem(`lastDailyReminder_${userData.uid}`, today);
                     await notificationService.addNotification(userData.uid, {
                        title: 'Gün Sonu Hatırlatması',
                        message: `Bugün tamamlaman gereken ${uncompletedTasks.length} görevin daha var. Haydi masaya!`,
                        type: 'system',
                        link: '/panel/ogrenci/kocluk'
                     });
                  }
               }
            }

            // check for tomorrow empty program
            const tomorrowTasks = tomorrowRes[0]?.tasks || [];
            if (tomorrowTasks.length === 0) {
                const lastEmptyWarningDate = safeStorage.getItem(`lastEmptyWarning_${userData.uid}`);
                if (lastEmptyWarningDate !== tomorrow) {
                     safeStorage.setItem(`lastEmptyWarning_${userData.uid}`, tomorrow);
                     await notificationService.addNotification(userData.uid, {
                        title: 'Program Boş',
                        message: 'Yarın için programda görev bulunmuyor. Koçundan yeni program talep edebilirsin.',
                        type: 'system',
                        link: '/panel/ogrenci/kocluk'
                     });
                }
            }
        } catch (e: any) {
           if (e?.code !== "permission-denied" && !e?.message?.toLowerCase().includes("permission")) {
              console.error("Otomatik bildirimler yüklenirken hata oluştu.", e);
           }
        }

        setLoading(false);
      }
    }
    loadData();
  }, [userData]);

  if (loading) {
    return (
      <div className="flex items-center justify-center p-12 w-full h-64">
        <div className="w-10 h-10 border-4 border-indigo-500/20 border-t-indigo-500 rounded-full animate-spin"></div>
      </div>
    );
  }

  // Calculate some real stats from the available data
  const totalBooks = books.length;
  const getExamNetForTab = (exam: any, tab: 'TYT' | 'AYT') => {
    let scoresObj = exam.scores || {};
    
    if (tab === 'TYT') {
        if (exam.examType === 'TYT') return parseFloat(exam.totalNet) || 0;
        if (exam.examType === 'YKS') {
            let net = 0;
            Object.keys(scoresObj).forEach(key => {
                if (key.startsWith(`TYT `)) {
                    net += parseFloat(scoresObj[key].n) || 0;
                }
            });
            return parseFloat(net.toFixed(2));
        }
        return 0;
    } else {
        const activeBranch = ['9. Sınıf', '10. Sınıf', '11. Sınıf'].includes(userData?.grade || '')
          ? userData?.grade as string
          : (userData?.branch === 'SAYISAL' ? 'SAY' : 
             userData?.branch === 'EŞİT AĞIRLIK' ? 'EA' : 
             userData?.branch === 'SÖZEL' ? 'SÖZ' : 
             userData?.branch === 'DİL' ? 'DİL' : 'SAY');
            
        let prefix = exam.examType === 'YKS' ? 'AYT ' : '';
        if (exam.examType === 'AYT' || exam.examType === 'YKS') {
            const getScore = (subj: string) => parseFloat(scoresObj[`${prefix}${subj}`]?.n) || 0;
            
            let aytSay = getScore('Matematik') + getScore('Geometri') + getScore('Fizik') + getScore('Kimya') + getScore('Biyoloji');
            let aytEa = getScore('Matematik') + getScore('Geometri') + getScore('Edebiyat') + getScore('Tarih-1') + getScore('Coğrafya-1');
            let aytSoz = getScore('Edebiyat') + getScore('Tarih-1') + getScore('Coğrafya-1') + getScore('Tarih-2') + getScore('Coğrafya-2') + getScore('Felsefe Grubu') + getScore('Din (Seçmeli)');
            
            if (activeBranch === 'SAY') return parseFloat(aytSay.toFixed(2)) || (exam.examType === 'AYT' ? parseFloat(exam.totalNet) : 0);
            if (activeBranch === 'EA') return parseFloat(aytEa.toFixed(2)) || (exam.examType === 'AYT' ? parseFloat(exam.totalNet) : 0);
            if (activeBranch === 'SÖZ') return parseFloat(aytSoz.toFixed(2)) || (exam.examType === 'AYT' ? parseFloat(exam.totalNet) : 0);
            return parseFloat(aytSay.toFixed(2)) || (exam.examType === 'AYT' ? parseFloat(exam.totalNet) : 0);
        }
        return 0;
    }
  };

  const completedBooks = books.filter(b => b.completionPercentage === 100).length;
  const totalExams = exams.length;
  const filteredExams = exams.filter(e => e.examType === activeExamTab || e.examType === 'YKS').map(e => ({
      ...e,
      calculatedNet: getExamNetForTab(e, activeExamTab)
  }));
  const examAvg = filteredExams.length > 0 
    ? (filteredExams.reduce((acc, curr) => acc + curr.calculatedNet, 0) / filteredExams.length).toFixed(1) 
    : '0';
  
  const dailyTotalTasks = dailyTasks.length;
  const dailyCompletedTasks = dailyTasks.filter(t => t.isDone).length;

  const calculateSubscriptionTime = () => {
    if (!userData?.subscriptionStartDate || !userData?.subscriptionEndDate || !userData?.subscriptionPlan) {
      return { remainingDays: 0, remainingHours: 0, remainingMinutes: 0, totalDays: 0, percentage: 0, percentageFormatted: "0.00", daysExpired: -1, isActive: false };
    }
    
    const start = new Date(userData.subscriptionStartDate).getTime();
    const end = new Date(userData.subscriptionEndDate).getTime();
    const now = new Date().getTime();
    
    const totalMinutes = Math.max(1, (end - start) / (1000 * 60));
    const remainingMinutesTotal = Math.max(0, (end - now) / (1000 * 60));
    const remainingHoursTotal = Math.max(0, (end - now) / (1000 * 60 * 60));
    
    const daysExpired = now > end ? Math.floor((now - end) / (1000 * 60 * 60 * 24)) : 0;
    
    const usedMinutes = totalMinutes - remainingMinutesTotal;
    let percentage = (usedMinutes / totalMinutes) * 100;
    percentage = Math.max(0, Math.min(100, percentage));
    const percentageFormatted = percentage.toFixed(2);
    
    const remainingDays = Math.floor(remainingHoursTotal / 24);
    const remainingHrs = Math.floor(remainingHoursTotal % 24);
    const remainingMins = Math.floor(remainingMinutesTotal % 60);
    const totalDays = Math.ceil(totalMinutes / (60 * 24));
    const isActive = isSubscriptionActive(userData);

    if (!isActive && userData.subscriptionStatus !== 'expired' && user?.uid) {
      syncExpiredSubscriptionStatus(userData, user.uid);
    }
    
    return { remainingDays, remainingHours: remainingHrs, remainingMinutes: remainingMins, totalDays, percentage, percentageFormatted, daysExpired, isActive };
  };

  const subStats = calculateSubscriptionTime();
  const showSubscription = Boolean(userData?.subscriptionPlan);return (
    <div className="w-full max-w-7xl mx-auto space-y-8">
      <NotificationPrompt />
      {(pendingResultsCount > 0 || expiredWaitingCount > 0) && (
        <div className="space-y-2">
          {pendingResultsCount > 0 && (
            <div className="bg-amber-500/10 border border-amber-500/20 rounded-2xl p-3 flex items-center gap-3">
              <AlertTriangle className="text-amber-400 shrink-0" size={18} />
              <div className="text-xs">
                <span className="font-bold text-amber-400 uppercase tracking-wide mr-2">Sonuç Bekleyen Denemeler ({pendingResultsCount}):</span>
                <span className="text-slate-300">Sonucunuz açıklandıysa lütfen "Denemelerim" sayfasından giriniz.</span>
              </div>
            </div>
          )}
          {expiredWaitingCount > 0 && (
            <div className="bg-red-500/10 border border-red-500/20 rounded-2xl p-3 flex items-center gap-3">
              <AlertTriangle className="text-red-400 shrink-0" size={18} />
              <div className="text-xs">
                <span className="font-bold text-red-400 uppercase tracking-wide mr-2">5 Günü Geçen Bekleyen Görevler ({expiredWaitingCount}):</span>
                <span className="text-slate-300">5 gün içerisinde sonucu girilmeyen deneme görevleriniz yapılmadı sayılmıştır.</span>
              </div>
            </div>
          )}
        </div>
      )}
      

      {/* Dynamic Header */}
      <motion.header 
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-slate-900 border border-white/5 rounded-3xl p-6 md:p-8 space-y-8"
      >
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl md:text-3xl font-black text-white uppercase flex items-center gap-2">
              MERHABA, {userData?.firstName?.toUpperCase() || 'ÖĞRENCİ'}! <span className="text-2xl">👋</span>
            </h1>
            <p className="text-slate-400 mt-2 font-medium">
              Öğrenci Paneline hoş geldin. Bugün hedeflerine bir adım daha yaklaşmak için harika bir gün.
            </p>
          </div>
        </div>

        {/* 4 Cards for Hedef, Bakiye, XP, Seri */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          {/* Hedef */}
          <div className="bg-indigo-500/10 border border-indigo-500/20 p-3 sm:p-4 rounded-2xl flex items-center gap-3 sm:gap-4 hover:bg-indigo-500/20 transition-colors">
            <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-indigo-500/20 flex items-center justify-center shrink-0">
              <Target className="text-indigo-400" size={20} />
            </div>
            <div className="overflow-hidden">
              <p className="text-[9px] sm:text-[10px] font-black text-indigo-400 uppercase tracking-widest mb-0.5">Hedefler</p>
              <p className="text-xs sm:text-sm font-bold text-white uppercase truncate" title={userData?.targetUniversity || 'Üni Belirtilmedi'}>
                {userData?.targetUniversity || 'ÜNİ BELİRTİLMEDİ'}
              </p>
              <p className="text-[10px] sm:text-[11px] font-medium text-slate-300 uppercase truncate" title={userData?.targetDepartment || 'Bölüm Belirtilmedi'}>
                {userData?.targetDepartment || 'BÖLÜM BELİRTİLMEDİ'}
              </p>
            </div>
          </div>
          {/* Bakiye */}
          <div className="bg-emerald-500/10 border border-emerald-500/20 p-3 sm:p-4 rounded-2xl flex items-center gap-3 sm:gap-4 hover:bg-emerald-500/20 transition-colors">
            <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-emerald-500/20 flex items-center justify-center shrink-0">
              <Wallet className="text-emerald-400" size={20} />
            </div>
            <div>
              <p className="text-[9px] sm:text-[10px] font-black text-emerald-400 uppercase tracking-widest mb-0.5">Bakiye</p>
              <p className="text-xs sm:text-sm font-bold text-white uppercase">{(userData?.walletBalance || 0).toLocaleString('tr-TR')} <span className="text-emerald-400 text-[10px]">TL</span></p>
            </div>
          </div>
          {/* XP */}
          <div className="bg-blue-500/10 border border-blue-500/20 p-3 sm:p-4 rounded-2xl flex items-center justify-between gap-3 sm:gap-4 hover:bg-blue-500/20 transition-colors group">
            <div className="flex items-center gap-3 sm:gap-4 min-w-0">
              <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-blue-500/20 flex items-center justify-center shrink-0">
                <Zap className="text-blue-400" size={20} />
              </div>
              <div className="overflow-hidden">
                <p className="text-[9px] sm:text-[10px] font-black text-blue-400 uppercase tracking-widest mb-0.5">Kazanılan XP</p>
                <p className="text-xs sm:text-sm font-bold text-white uppercase truncate">{(userData?.xp || 0).toLocaleString('tr-TR')} <span className="text-blue-400 text-[10px]">XP</span></p>
              </div>
            </div>
            <button onClick={() => setShowXpInfo(true)} className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-slate-800/50 flex items-center justify-center text-slate-400 hover:text-white hover:bg-slate-700 transition-colors shrink-0">
               <Info size={14} />
            </button>
          </div>
          {/* Seri */}
          <div 
            onClick={loadContributionGraph}
            className="cursor-pointer bg-amber-500/10 border border-amber-500/20 p-3 sm:p-4 rounded-2xl flex items-center justify-between gap-3 sm:gap-4 hover:bg-amber-500/20 transition-colors group relative"
          >
            <div className="flex items-center gap-3 sm:gap-4 pointer-events-none min-w-0">
              <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-amber-500/20 flex items-center justify-center shrink-0">
                <Flame className="text-amber-400" size={20} />
              </div>
              <div className="overflow-hidden">
                <p className="text-[9px] sm:text-[10px] font-black text-amber-400 uppercase tracking-widest mb-0.5">Aktif Seri</p>
                <p className="text-xs sm:text-sm font-bold text-white uppercase truncate">{activeStreakCount} <span className="text-amber-400 text-[10px]">GÜN</span></p>
              </div>
            </div>
            <button 
              onClick={(e) => { e.stopPropagation(); setShowStreakInfo(true); }} 
              className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-slate-800/50 flex items-center justify-center text-slate-400 hover:text-white hover:bg-slate-700 transition-colors z-10 shrink-0"
            >
               <Info size={14} />
            </button>
            {secretStreakActive && (
              <div className="absolute -top-2 -right-2 bg-purple-500 text-white text-[8px] sm:text-[9px] font-black uppercase px-2 py-1 rounded-full shadow-lg shadow-purple-500/20 pointer-events-none">
                Gizli Seri Aktif
              </div>
            )}
          </div>
        </div>

        {/* Abonelik Durumu & Çubuk */}
        {showSubscription ? (
          <div className={`p-5 md:p-6 rounded-2xl mt-4 border transition-all ${
            subStats.isActive 
              ? 'bg-gradient-to-r from-yellow-500/10 via-amber-500/5 to-transparent border-yellow-500/20' 
              : 'bg-gradient-to-r from-rose-500/10 via-red-500/5 to-transparent border-rose-500/20'
          }`}>
            <div className="flex flex-col md:flex-row md:items-center justify-between mb-4 gap-4">
              <div className="flex items-center gap-4">
                <div className={`w-12 h-12 rounded-full flex items-center justify-center border shrink-0 ${
                  subStats.isActive 
                    ? 'bg-yellow-500/20 border-yellow-500/30 text-yellow-400' 
                    : 'bg-rose-500/20 border-rose-500/30 text-rose-400'
                }`}>
                  <Crown size={24} />
                </div>
                <div>
                  <h3 className="text-white font-bold text-base flex items-center gap-2 mb-1">
                    {userData.subscriptionPlan} Abonelik 
                    <span className={`px-2 py-0.5 rounded-md text-[10px] uppercase tracking-widest font-black ${
                      subStats.isActive 
                        ? 'bg-yellow-500/20 text-yellow-400' 
                        : 'bg-rose-500/20 text-rose-400'
                    }`}>
                      {subStats.isActive ? 'Aktif' : 'Süresi Doldu'}
                    </span>
                  </h3>
                  <p className="text-slate-400 text-xs">
                    {subStats.isActive 
                      ? 'Sana özel eğitim imkanlarından faydalanmaya devam ediyorsun.' 
                      : 'Abonelik süreniz sona ermiştir. Özellikleri kullanmaya devam etmek için paketinizi yenileyin.'}
                  </p>
                </div>
              </div>
              <div className="text-left md:text-right">
                {subStats.isActive ? (
                  <p className="text-3xl font-black text-yellow-400">
                    {subStats.remainingDays}<span className="text-sm font-bold text-yellow-500/70 ml-1">GÜN KALDI</span>
                  </p>
                ) : (
                  <Link 
                    to="/panel/ogrenci/abonelik"
                    className="inline-flex items-center gap-2 px-4 py-2 bg-yellow-500 hover:bg-yellow-400 text-slate-950 font-bold text-xs uppercase tracking-wider rounded-xl transition-all shadow-lg shadow-yellow-500/20"
                  >
                    Paketi Yenile
                  </Link>
                )}
              </div>
            </div>
            <div className="w-full h-2.5 bg-slate-800 rounded-full overflow-hidden shadow-inner">
              <div className={`h-full rounded-full relative transition-all duration-1000 ${
                subStats.isActive 
                  ? 'bg-gradient-to-r from-yellow-500 to-amber-500' 
                  : 'bg-gradient-to-r from-rose-500 to-red-500'
              }`} style={{ width: `${subStats.percentage}%` }}>
                <div className="absolute inset-0 bg-white/20 w-full h-full" style={{ backgroundImage: 'linear-gradient(45deg,rgba(255,255,255,.15) 25%,transparent 25%,transparent 50%,rgba(255,255,255,.15) 50%,rgba(255,255,255,.15) 75%,transparent 75%,transparent)', backgroundSize: '1rem 1rem' }}></div>
              </div>
            </div>
            <div className="flex justify-between mt-3 text-[10px] font-bold text-slate-500 uppercase tracking-widest">
              <span>{subStats.isActive ? `Kullanılan %${subStats.percentageFormatted}` : 'Abonelik Tamamlandı'}</span>
              <span className="text-slate-400">Toplam: {subStats.totalDays} Gün</span>
            </div>
          </div>
        ) : null}
      </motion.header>

      {/* ÇABA Testi Banner */}
      {!isCabaCompleted && (
        <motion.div
          initial={{ opacity: 0, scale: 0.98 }}
          animate={{ opacity: 1, scale: 1 }}
          className="relative overflow-hidden bg-gradient-to-r from-emerald-600/20 via-teal-500/10 to-transparent border border-emerald-500/30 rounded-3xl p-6 md:p-8 flex flex-col md:flex-row items-center justify-between gap-6"
        >
          <div className="absolute top-0 right-0 -mr-16 -mt-16 w-64 h-64 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none"></div>
          <div className="flex items-start gap-4 z-10">
            <div className="w-12 h-12 rounded-2xl bg-emerald-500/20 flex items-center justify-center border border-emerald-500/30 shrink-0 shadow-lg shadow-emerald-500/10">
              <Brain className="text-emerald-400" size={24} />
            </div>
            <div>
              <h3 className="text-lg font-black text-white uppercase tracking-wide flex items-center gap-2 mb-2">
                ÇALIŞMA ALIŞKANLIKLARI VE BAŞARI ANALİZİ (ÇABA) TESTİ
                <span className="px-2 py-0.5 rounded-md bg-emerald-500/20 text-emerald-400 text-[10px] uppercase tracking-widest font-black animate-pulse">
                  Yeni
                </span>
              </h3>
              <p className="text-slate-300 text-sm max-w-2xl leading-relaxed">
                Çalışma alışkanlıklarınızı ve koçluk uyumluluğunuzu ölçen, başarı analizine yönelik özel ÇABA Testi'ni hemen doldurun. Bu test koçluğa uygunluk skorunuzu belirleyerek kişiselleştirilmiş sürecinizi başlatacaktır.
              </p>
            </div>
          </div>
          <Link
            to="/panel/ogrenci/caba-testi"
            className="w-full md:w-auto px-8 py-3.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl text-center transition-all shadow-lg shadow-emerald-500/20 shrink-0 hover:scale-105 active:scale-95"
          >
            Testi Başlat
          </Link>
        </motion.div>
      )}

      {/* Akademik Durum Section */}
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
        <div className="flex items-center justify-between mb-6 px-2">
          <div className="flex items-center gap-3">
            <Activity className="text-indigo-400" size={24} />
            <h2 className="text-xl font-bold text-white uppercase tracking-tight">Akademik Durum</h2>
          </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
          
          {/* Net Gelişimi Chart */}
          <div className="bg-slate-900 border border-white/5 rounded-3xl p-6 md:col-span-12 lg:col-span-8 flex flex-col relative overflow-hidden">
            <div className="absolute top-0 right-0 w-64 h-64 bg-rose-500/5 blur-[80px] pointer-events-none rounded-full"></div>
            
            <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-8 relative z-10 gap-4">
              <div>
                <h3 className="text-base font-bold text-white uppercase tracking-tight flex items-center gap-2">
                  <TrendingUp size={18} className="text-rose-400" /> Net Gelişimi
                </h3>
                <p className="text-xs text-slate-400 mt-1">Son denemelerindeki genel performans grafiği</p>
              </div>
              <div className="flex items-center gap-4 text-right">
                <div className="flex bg-slate-900/60 p-1 rounded-xl border border-white/5 mr-2">
                   {['TYT', 'AYT'].map(tab => (
                      <button
                         key={tab}
                         onClick={() => setActiveExamTab(tab as 'TYT' | 'AYT')}
                         className={`px-3 py-1 rounded-lg text-xs font-bold uppercase tracking-widest transition-all ${activeExamTab === tab ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white hover:bg-white/5'}`}
                      >
                         {tab}
                      </button>
                   ))}
                </div>
                <div>
                  <span className="text-2xl font-black text-rose-400">{examAvg}</span>
                  <span className="text-[10px] text-slate-500 font-bold ml-1 uppercase block text-left">Ort. Net</span>
                </div>
                <Link to="/panel/ogrenci/denemeler" className="hidden sm:block text-[10px] font-bold bg-white/5 hover:bg-white/10 px-3 py-1.5 rounded-lg text-white uppercase tracking-widest transition-colors border border-white/5">
                  Tümü
                </Link>
              </div>
            </div>

            <div className="flex-1 flex items-end gap-2 sm:gap-4 h-48 sm:h-56 mt-4 relative z-10">
              <div className="absolute inset-0 flex flex-col justify-between pointer-events-none pb-6">
                {(activeExamTab === 'TYT' ? [120, 90, 60, 30, 0] : [80, 60, 40, 20, 0]).map(val => (
                  <div key={val} className="w-full flex items-center opacity-30">
                    <span className="text-[8px] font-mono text-slate-400 w-6">{val}</span>
                    <div className="flex-1 border-b border-dashed border-white/10"></div>
                  </div>
                ))}
              </div>

              <div className="flex-1 flex items-end gap-2 sm:gap-4 h-full relative z-10 pl-8 pb-6 group">
                {filteredExams.length > 0 ? (
                  [...filteredExams]
                    .sort((a,b) => {
                      const isAytYdt = (activeExamTab as string) === 'AYT' || (activeExamTab as string) === 'YDT';
                      const dateA = isAytYdt && a.examType === 'YKS' ? (a.aytDate || a.date) : a.date;
                      const dateB = isAytYdt && b.examType === 'YKS' ? (b.aytDate || b.date) : b.date;
                      return new Date(dateA || 0).getTime() - new Date(dateB || 0).getTime();
                    })
                    .slice(-8)
                    .map((exam, idx) => {
                      const net = Number(exam.calculatedNet || 0);
                      const height = Math.max(5, Math.min(100, (net / (activeExamTab === 'TYT' ? 120 : 80)) * 100));
                      return (
                        <div key={idx} className="flex-1 flex flex-col items-center justify-end h-full relative cursor-pointer">
                          <div className="opacity-0 group-hover:opacity-100 transition-opacity absolute -top-8 bg-slate-800 border border-white/10 px-2 py-1 rounded-lg text-center z-20 pointer-events-none shadow-xl">
                            <p className="text-[10px] font-black text-white whitespace-nowrap">{net} Net</p>
                            <p className="text-[8px] font-medium text-slate-400 whitespace-nowrap truncate max-w-[80px]">{exam.title || 'Deneme'}</p>
                          </div>
                          <div 
                            className="w-full bg-gradient-to-t from-rose-500/20 to-rose-400/40 hover:to-rose-400/60 border-t-2 border-rose-400 rounded-t-md transition-all duration-300 relative group-hover:shadow-[0_0_15px_rgba(244,63,94,0.3)]"
                            style={{ height: `${height}%` }}
                          ></div>
                          <span className="absolute -bottom-6 text-[9px] font-bold text-slate-500 uppercase truncate w-full text-center">
                            {(() => {
                              const isAytYdt = (activeExamTab as string) === 'AYT' || (activeExamTab as string) === 'YDT';
                              const d = isAytYdt && exam.examType === 'YKS' ? (exam.aytDate || exam.date) : exam.date;
                              return d ? new Date(d).toLocaleDateString('tr-TR', {day: 'numeric', month: 'short'}) : 'Tarih Yok';
                            })()}
                          </span>
                        </div>
                      )
                    })
                ) : (
                  <div className="w-full h-full flex flex-col items-center justify-center border-2 border-dashed border-white/5 rounded-2xl bg-white/5">
                    <TrendingUp size={32} className="text-slate-600 mb-2" />
                    <p className="text-slate-400 text-sm">Grafik oluşturmak için deneme sonucu ekle.</p>
                  </div>
                )}
              </div>
            </div>
            {filteredExams.length > 0 && <p className="text-center text-[10px] text-slate-500 font-medium uppercase tracking-widest mt-6 sm:hidden">Son 8 Deneme</p>}
          </div>

          {/* Daily Tasks Panel */}
          <div className="bg-slate-900 border border-white/5 rounded-3xl p-6 md:col-span-12 lg:col-span-4 flex flex-col relative overflow-hidden">
            <div className="absolute top-0 right-0 w-48 h-48 bg-emerald-500/5 blur-[60px] pointer-events-none rounded-full"></div>
            
            <div className="flex items-center justify-between mb-6 relative z-10">
              <h3 className="text-base font-bold text-white uppercase tracking-tight flex items-center gap-2">
                <CalendarDays size={18} className="text-emerald-400" /> Bugünün Görevleri
              </h3>
              <span className="text-xs font-bold px-2 py-1 bg-emerald-500/10 text-emerald-400 rounded-lg">{dailyCompletedTasks} / {dailyTotalTasks}</span>
            </div>

            <div className="space-y-3 flex-1 relative z-10">
              {dailyTasks.length > 0 ? (
                dailyTasks.map((task, idx) => (
                  <div key={idx} className={`border rounded-2xl p-4 flex items-center justify-between gap-4 transition-all group ${task.isWaitingResult ? 'bg-amber-500/10 border-amber-500/20 hover:border-amber-500/30' : task.isDone ? 'bg-emerald-500/10 border-emerald-500/20 hover:border-emerald-500/30' : 'bg-white/5 border-white/10 hover:bg-white/10'}`}>
                    <div className="flex items-center gap-4 min-w-0">
                      <div className={`w-8 h-8 rounded-xl border flex items-center justify-center shrink-0 transition-colors shadow-sm ${task.isWaitingResult ? 'bg-amber-500 border-amber-500 text-white shadow-amber-500/20' : task.isDone ? 'bg-emerald-500 border-emerald-500 text-white shadow-emerald-500/20' : 'border-slate-500/50 text-transparent bg-black/20 group-hover:border-slate-400'}`}>
                        <CheckCircle2 size={16} />
                      </div>
                      <div className="overflow-hidden">
                        
<div className="flex items-center gap-2">
  <h4 className={`text-sm font-bold truncate transition-colors ${task.isWaitingResult ? 'text-amber-400' : task.isDone ? 'text-emerald-400' : 'text-white'}`}>{task.subject}</h4>
  {task.isWaitingResult && <span className="text-[8px] bg-amber-500/20 text-amber-500 px-1.5 py-0.5 rounded font-black tracking-widest uppercase">Sonuç Bekleniyor</span>}
</div>

                        <p className={`text-xs truncate ${task.isWaitingResult ? 'text-amber-500/70' : task.isDone ? 'text-emerald-500/70' : 'text-slate-400'}`}>{task.topic}</p>
                      </div>
                    </div>
                    {task.targetCount > 0 && (
                      <div className="shrink-0 flex items-center gap-1.5 bg-black/30 px-3 py-1.5 rounded-lg border border-white/5">
                        <span className={`font-black text-sm ${task.isWaitingResult ? 'text-amber-400' : task.isDone ? 'text-emerald-400' : 'text-white'}`}>{task.targetCount}</span>
                        <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">{task.type === 'Soru Çözümü' ? 'Soru' : task.type === 'YouTube Video' ? 'Video' : 'Dk'}</span>
                      </div>
                    )}
                  </div>
                ))
              ) : (
                <div className="h-full flex flex-col justify-center items-center text-center border-2 border-dashed border-white/5 rounded-2xl p-8 bg-white/5">
                  <CheckCircle2 size={40} className="text-slate-600 mb-3" />
                  <p className="text-slate-400 font-bold">Bugün için görev bulunmuyor.</p>
                  <p className="text-xs text-slate-500 mt-1">Harika bir dinlenme günü!</p>
                </div>
              )}
            </div>
          </div>

          {/* Book Progress Panel */}
          <div className="bg-slate-900 border border-white/5 rounded-3xl p-6 md:col-span-12 lg:col-span-6 flex flex-col relative overflow-hidden">
            <div className="absolute top-0 right-0 w-64 h-64 bg-blue-500/5 blur-[80px] pointer-events-none rounded-full"></div>
            
            <div className="flex items-center justify-between mb-6 relative z-10">
              <h3 className="text-base font-bold text-white uppercase tracking-tight flex items-center gap-2">
                <BookOpen size={18} className="text-blue-400" /> Kitap Takibi
              </h3>
              <span className="text-xs font-bold px-2 py-1 bg-blue-500/10 text-blue-400 rounded-lg">{completedBooks} Biten</span>
            </div>

            <div className="space-y-4 flex-1 relative z-10">
              {books.length > 0 ? (
                books.slice(0, 4).map((book, idx) => (
                  <div key={idx} className="group bg-white/5 border border-white/5 rounded-2xl p-4 hover:bg-white/10 transition-colors">
                    <div className="flex items-center justify-between mb-3">
                      <div className="overflow-hidden pr-4">
                        <span className="text-[10px] text-slate-400 uppercase tracking-widest block mb-0.5">{book.subject}</span>
                        <span className="text-sm font-bold text-white truncate block">{book.bookName}</span>
                      </div>
                      <span className="text-sm font-black text-blue-400 shrink-0">%{book.completionPercentage || 0}</span>
                    </div>
                    <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-gradient-to-r from-blue-500 to-indigo-400 rounded-full transition-all duration-1000 relative" 
                        style={{ width: `${book.completionPercentage || 0}%` }}
                      >
                        <div className="absolute inset-0 bg-white/20 w-full h-full" style={{ backgroundImage: 'linear-gradient(45deg,rgba(255,255,255,.15) 25%,transparent 25%,transparent 50%,rgba(255,255,255,.15) 50%,rgba(255,255,255,.15) 75%,transparent 75%,transparent)', backgroundSize: '1rem 1rem' }}></div>
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="h-full flex flex-col justify-center items-center text-center border-2 border-dashed border-white/5 rounded-2xl p-6 bg-white/5 min-h-[160px]">
                  <BookOpen size={32} className="text-slate-600 mb-2" />
                  <p className="text-slate-400 text-sm">Henüz kitap eklenmemiş.</p>
                </div>
              )}
            </div>
            {books.length > 4 && (
              <Link to="/panel/ogrenci/konu-takibi" className="mt-4 block text-center text-[10px] font-bold text-slate-400 hover:text-white uppercase tracking-widest transition-colors relative z-10 py-2 border border-white/5 rounded-xl bg-white/5 hover:bg-white/10">
                Tümünü Gör ({totalBooks})
              </Link>
            )}
          </div>

          {/* Genel İstatistikler */}
          <div className="bg-slate-900 border border-white/5 rounded-3xl p-6 md:col-span-12 lg:col-span-6 grid grid-cols-2 gap-4 relative overflow-hidden">
            <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-indigo-500/5 blur-[80px] pointer-events-none rounded-full"></div>
            
            <div className="bg-white/5 border border-white/5 rounded-2xl p-5 flex flex-col justify-center items-start hover:bg-white/10 transition-colors relative z-10 group">
              <div className="w-10 h-10 rounded-xl bg-blue-500/10 flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                <BookOpen size={18} className="text-blue-400" />
              </div>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Biten Kitap</p>
              <p className="text-2xl font-black text-white">{completedBooks}</p>
            </div>
            
            <div className="bg-white/5 border border-white/5 rounded-2xl p-5 flex flex-col justify-center items-start hover:bg-white/10 transition-colors relative z-10 group">
              <div className="w-10 h-10 rounded-xl bg-rose-500/10 flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                <Target size={18} className="text-rose-400" />
              </div>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Çözülen Deneme</p>
              <p className="text-2xl font-black text-white">{totalExams}</p>
            </div>
            
            <div className="bg-white/5 border border-white/5 rounded-2xl p-5 flex flex-col justify-center items-start hover:bg-white/10 transition-colors relative z-10 group">
              <div className="w-10 h-10 rounded-xl bg-emerald-500/10 flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                <CalendarDays size={18} className="text-emerald-400" />
              </div>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Biten Görev</p>
              <p className="text-2xl font-black text-white">{dailyCompletedTasks} <span className="text-base font-medium text-slate-500">/ {dailyTotalTasks}</span></p>
            </div>
            
            <div className="bg-white/5 border border-white/5 rounded-2xl p-5 flex flex-col justify-center items-start hover:bg-white/10 transition-colors relative z-10 group">
              <div className="w-10 h-10 rounded-xl bg-amber-500/10 flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                <Activity size={18} className="text-amber-400" />
              </div>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Bugün Başarı Oranı</p>
              <p className="text-2xl font-black text-white">
                {dailyTotalTasks > 0 ? Math.round((dailyCompletedTasks / dailyTotalTasks) * 100) : 0}<span className="text-base font-medium text-slate-500">%</span>
              </p>
            </div>
          </div>
          
        </div>
      </motion.div>

      {/* Contribution Graph Modal */}
      {showContributionGraph && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setShowContributionGraph(false)}></div>
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-slate-900 border border-slate-800 sm:rounded-3xl p-6 md:p-8 max-w-4xl w-full relative z-10 shadow-2xl h-full sm:h-auto overflow-y-auto sm:max-h-[90vh]"
          >
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-black text-white flex items-center gap-2">
                <CalendarDays className="text-amber-400" /> ÇALIŞMA TAKVİMİ
              </h3>
              <button 
                onClick={() => setShowContributionGraph(false)}
                className="w-8 h-8 flex items-center justify-center rounded-full bg-slate-800 text-slate-400 hover:text-white transition-colors"
              >
                ✕
              </button>
            </div>

            {contributionLoading ? (
              <div className="flex flex-col justify-center items-center py-20 gap-4">
                 <div className="w-8 h-8 border-4 border-amber-500/30 border-t-amber-500 rounded-full animate-spin"></div>
                 <p className="text-slate-500 text-sm font-medium animate-pulse">Takvim oluşturuluyor...</p>
              </div>
            ) : (
              <div className="w-full relative">
                 <p className="text-slate-400 text-sm mb-6">
                   Renkler eforuna göre değişir. Günlük görevlerinin %85 ve fazlasını tamamlayarak <strong>serini koruduğun günler alev renginde görünür.</strong> Hiç efor sarf etmediğin veya çok düşük efor gösterdiğin günler ise sönük kalır.
                 </p>
                 <div className="w-full overflow-x-auto pb-6 custom-scrollbar">
                    <div className="flex gap-2 min-w-max">
                      <div className="flex flex-col gap-1 text-[9px] font-bold text-slate-500 justify-around pt-7 mr-2">
                         <span className="h-[12px] flex items-center">Pzt</span>
                         <span className="h-[12px]"></span>
                         <span className="h-[12px] flex items-center">Çar</span>
                         <span className="h-[12px]"></span>
                         <span className="h-[12px] flex items-center">Cum</span>
                         <span className="h-[12px]"></span>
                         <span className="h-[12px]"></span>
                      </div>
                      <div className="flex flex-col flex-1">
                        <div className="flex relative h-6 w-full text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1">
                          {getAcademicYearDays().reduce((acc: any[], day, idx) => {
                            if (idx % 7 === 0) {
                              const d = new Date(day);
                              if (d.getDate() <= 7 && !acc.some((x: any) => x.month === d.getMonth() && x.year === d.getFullYear())) {
                                acc.push({ 
                                  name: d.toLocaleString('tr-TR', { month: 'short' }), 
                                  col: Math.floor(idx / 7), 
                                  month: d.getMonth(),
                                  year: d.getFullYear()
                                });
                              }
                            }
                            return acc;
                          }, []).map((lbl: any, i: number) => (
                            <span key={`${lbl.col}-${i}`} className="absolute truncate" style={{ left: `${lbl.col * 16}px` }}>
                              {lbl.name}
                            </span>
                          ))}
                        </div>
                        <div 
                          className="grid gap-1 min-w-max" 
                          style={{ 
                            gridTemplateRows: 'repeat(7, 12px)',
                            gridAutoFlow: 'column', 
                            gridAutoColumns: '12px' 
                          }}
                        >
                            {getAcademicYearDays().map((day) => {
                               const level = contributionData[day] || 0;
                               let bgColor = 'bg-white/5';
                               if (level === 1) bgColor = 'bg-orange-500/20';
                               else if (level === 2) bgColor = 'bg-orange-500/50';
                               else if (level === 3) bgColor = 'bg-amber-500/80';
                               else if (level === 4) bgColor = 'bg-amber-500 shadow-[0_0_5px_rgba(245,158,11,0.8)]';
    
                               // Format day string to DD.MM.YYYY
                               const parts = day.split('-');
                               const cleanDate = parts.length === 3 ? `${parts[2]}.${parts[1]}.${parts[0]}` : day;
    
                               return (
                                   <div 
                                     key={day} 
                                     title={`${cleanDate} - Efor Seviyesi: ${level}`} 
                                     className={`w-[12px] h-[12px] rounded-sm ${bgColor} hover:ring-2 ring-white/50 transition-all cursor-crosshair`}
                                   ></div>
                               );
                            })}
                        </div>
                      </div>
                    </div>
                 </div>
                 
                 <div className="flex items-center justify-end gap-2 text-xs text-slate-400 font-medium mt-4">
                    <span>Az Efor</span>
                    <div className="flex items-center gap-1">
                      <div className="w-3 h-3 rounded-sm bg-white/5"></div>
                      <div className="w-3 h-3 rounded-sm bg-orange-500/20"></div>
                      <div className="w-3 h-3 rounded-sm bg-orange-500/50"></div>
                      <div className="w-3 h-3 rounded-sm bg-amber-500/80"></div>
                      <div className="w-3 h-3 rounded-sm bg-amber-500 shadow-[0_0_5px_rgba(245,158,11,0.8)]"></div>
                    </div>
                    <span>Yüksek Efor (Seri Korundu)</span>
                 </div>
              </div>
            )}
          </motion.div>
        </div>
      )}

      {/* XP Info Modal */}
      {showXpInfo && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setShowXpInfo(false)}></div>
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-slate-900 border border-slate-800 sm:rounded-3xl p-6 md:p-8 max-w-md w-full relative z-10 shadow-2xl h-full sm:h-auto overflow-y-auto sm:max-h-[90vh]"
          >
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-black text-white flex items-center gap-2">
                <Zap className="text-blue-400" /> XP SİSTEMİ
              </h3>
              <button 
                onClick={() => setShowXpInfo(false)}
                className="w-8 h-8 flex items-center justify-center rounded-full bg-slate-800 text-slate-400 hover:text-white transition-colors"
              >
                ✕
              </button>
            </div>
            
            <div className="space-y-4">
              <p className="text-slate-400 text-sm leading-relaxed mb-4">
                XP (Deneyim Puanı), sistemdeki faydalı faaliyetlerini ödüllendirmek için kullanılır. İleride bu XP'ler ile belirli özel bölümleri açabileceksin.
              </p>
              
              <div className="bg-white/5 border border-white/5 rounded-2xl p-4">
                <h4 className="text-sm font-bold text-white uppercase tracking-widest mb-3">XP Kazanma Yolları</h4>
                <ul className="space-y-3">
                  <li className="flex items-center justify-between text-sm">
                    <span className="text-slate-300">YKS Deneme Analizi</span>
                    <span className="text-blue-400 font-bold uppercase tracking-widest">+150 XP</span>
                  </li>
                  <li className="flex items-center justify-between text-sm">
                    <span className="text-slate-300">Branş / Ders Deneme Analizi</span>
                    <span className="text-blue-400 font-bold uppercase tracking-widest">+40 XP</span>
                  </li>
                  <li className="flex items-center justify-between text-sm">
                    <span className="text-slate-300">YKS Deneme Sınavı Ekleme</span>
                    <span className="text-blue-400 font-bold uppercase tracking-widest">+50 XP</span>
                  </li>
                  <li className="flex items-center justify-between text-sm">
                    <span className="text-slate-300">Branş / Ders Denemesi</span>
                    <span className="text-blue-400 font-bold uppercase tracking-widest">+20 XP</span>
                  </li>
                  <li className="flex items-center justify-between text-sm">
                    <span className="text-slate-300">Soru Bankası Konusu / Günlük Soru</span>
                    <span className="text-blue-400 font-bold uppercase tracking-widest">+10-20 XP</span>
                  </li>
                  <li className="flex items-center justify-between text-sm">
                    <span className="text-slate-300">Konu Çalışması (Kitap/Görev)</span>
                    <span className="text-blue-400 font-bold uppercase tracking-widest">+3-6 XP</span>
                  </li>
                  <li className="flex items-center justify-between text-sm">
                    <span className="text-slate-300">YouTube Videosu (Kitap/Görev)</span>
                    <span className="text-blue-400 font-bold uppercase tracking-widest">+2-4 XP</span>
                  </li>
                  <li className="flex items-center justify-between text-sm">
                    <span className="text-slate-300">Asistan İle Chat</span>
                    <span className="text-blue-400 font-bold uppercase tracking-widest">+2 XP</span>
                  </li>
                </ul>
              </div>
            </div>
          </motion.div>
        </div>
      )}

      {/* Streak Info Modal */}
      {showStreakInfo && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setShowStreakInfo(false)}></div>
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-slate-900 border border-slate-800 sm:rounded-3xl p-6 md:p-8 max-w-md w-full relative z-10 shadow-2xl h-full sm:h-auto overflow-y-auto sm:max-h-[90vh]"
          >
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-black text-white flex items-center gap-2">
                <Flame className="text-amber-400" /> SERİ BİLGİSİ
              </h3>
              <button 
                onClick={() => setShowStreakInfo(false)}
                className="w-8 h-8 flex items-center justify-center rounded-full bg-slate-800 text-slate-400 hover:text-white transition-colors"
              >
                ✕
              </button>
            </div>
            
            <div className="space-y-6">
              <div>
                <h4 className="text-sm font-bold text-white mb-2 uppercase tracking-widest text-amber-400">🔥 Günlük Seri</h4>
                <p className="text-sm text-slate-400 leading-relaxed mb-2">
                  Günlük koçluk programının <span className="font-bold text-white">%85'ini veya daha fazlasını</span> tamamladığında serin o gün için korunur ve 1 gün artar. Eğer limitin altında kalırsan serin sıfırlanır.
                </p>
                <div className="bg-slate-800/50 rounded-xl p-3 flex justify-between items-center border border-slate-700/50">
                  <span className="text-xs font-bold text-slate-300">Dondurma Hakkı:</span>
                  <span className="text-sm font-black text-amber-500">{freezeRights} Adet</span>
                </div>
                <p className="text-[10px] text-slate-500 mt-2">
                  * Her 7 günlük kesintisiz seri sana 1 adet (maksimum 3) dondurma hakkı kazandırır. Programı tamamlayamadığın bir günde, serinin sıfırlanmasını önlemek için otomatik olarak 1 hakkın harcanır.
                </p>
              </div>

              <div className="h-px w-full bg-slate-800"></div>

              <div>
                <h4 className="text-sm font-bold text-white mb-2 uppercase tracking-widest text-purple-400">✨ Gizli Seri (Haftalık)</h4>
                <p className="text-sm text-slate-400 leading-relaxed mb-3">
                  Eğer bulunduğun hafta içinde en az 1 kez deneme sınavına girip (TYT, AYT veya YDT) ve yapay zeka asistanımıza en az 1 soru sorarsan, <strong className="text-purple-400">Gizli Seri</strong> rozeti o hafta boyunca aktif olur!
                </p>
                <div className="flex gap-2">
                  <span className={`px-3 py-1.5 rounded-lg text-xs font-bold ${secretStreakActive ? 'bg-purple-500/20 text-purple-400 border border-purple-500/30' : 'bg-slate-800 text-slate-500 border border-slate-700'}`}>
                    {secretStreakActive ? 'Aktif Durumda' : 'Şu an pasif'}
                  </span>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
}