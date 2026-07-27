import React, { useState, useEffect } from "react";
import {
  TrendingUp,
  Calendar,
  Award,
  BookOpen,
  Sparkles,
  Clock,
  Lock,
  CheckCircle,
  AlertTriangle,
  Printer,
  ChevronLeft,
  ChevronRight,
  TrendingDown,
  Percent,
  Check,
  Zap,
  Info,
  CalendarDays,
  Trophy,
  LineChart,
} from "lucide-react";
import { useStudent } from "../../lib/StudentContext";
import { studentDataService } from "../../services/studentDataService";
import { doc, getDoc } from "firebase/firestore";
import { db } from "../../lib/firebase";

interface WeekOption {
  label: string;
  startDate: string; // YYYY-MM-DD
  endDate: string; // YYYY-MM-DD
  dates: string[]; // List of YYYY-MM-DD dates
}

export default function ParentReports() {
  const { selectedStudent } = useStudent();
  const [activeTab, setActiveTab] = useState<"weekly" | "monthly" | "comprehensive">("weekly");
  const [loading, setLoading] = useState(false);
  const [weeks, setWeeks] = useState<WeekOption[]>([]);
  const [selectedWeekIndex, setSelectedWeekIndex] = useState(0);

  // Stats
  const [dailyPrograms, setDailyPrograms] = useState<any[]>([]);
  const [exams, setExams] = useState<any[]>([]);
  const [studentProfile, setStudentProfile] = useState<any>(null);
  const [aiReport, setAiReport] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);

  // Generate recent 4 weeks (Monday to Sunday)
  useEffect(() => {
    const generateWeeks = () => {
      const result: WeekOption[] = [];
      const now = new Date();
      
      // Find current Monday
      const dayOfWeek = now.getDay(); // 0 is Sunday, 1 is Monday, etc.
      const currentMondayOffset = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
      const currentMonday = new Date(now);
      currentMonday.setDate(now.getDate() + currentMondayOffset);
      currentMonday.setHours(0, 0, 0, 0);

      // We will generate the current week and 3 past weeks
      for (let i = 0; i < 4; i++) {
        const monday = new Date(currentMonday);
        monday.setDate(currentMonday.getDate() - i * 7);

        const sunday = new Date(monday);
        sunday.setDate(monday.getDate() + 6);

        const dates: string[] = [];
        for (let d = 0; d < 7; d++) {
          const dayDate = new Date(monday);
          dayDate.setDate(monday.getDate() + d);
          dates.push(dayDate.toISOString().split("T")[0]);
        }

        const formatOptions: Intl.DateTimeFormatOptions = { day: "numeric", month: "long" };
        const label = `${monday.toLocaleDateString("tr-TR", formatOptions)} - ${sunday.toLocaleDateString("tr-TR", formatOptions)} ${monday.getFullYear()}`;

        result.push({
          label: i === 0 ? `Bu Hafta (${label})` : `${i} Hafta Önce (${label})`,
          startDate: monday.toISOString().split("T")[0],
          endDate: sunday.toISOString().split("T")[0],
          dates,
        });
      }
      setWeeks(result);
    };

    generateWeeks();
  }, []);

  // Fetch student data and profile
  useEffect(() => {
    const fetchStudentProfile = async () => {
      if (!selectedStudent?.uid) return;
      try {
        const docRef = doc(db, "users", selectedStudent.uid);
        const snap = await getDoc(docRef);
        if (snap.exists()) {
          setStudentProfile(snap.data());
        } else {
          setStudentProfile(selectedStudent);
        }
      } catch (err) {
        console.error("Öğrenci profili çekilirken hata:", err);
        setStudentProfile(selectedStudent);
      }
    };

    fetchStudentProfile();
  }, [selectedStudent]);

  // Fetch stats for the selected week
  useEffect(() => {
    const fetchWeekData = async () => {
      if (!selectedStudent?.uid || weeks.length === 0) return;
      try {
        setLoading(true);
        const activeWeek = weeks[selectedWeekIndex];
        
        // Fetch programs for these specific 7 dates
        const programsData = await studentDataService.getDailyPrograms(
          selectedStudent.uid,
          activeWeek.dates
        );
        setDailyPrograms(programsData || []);

        // Fetch exam results
        const examsData = await studentDataService.getExamResults(selectedStudent.uid);
        // Filter exams that are taken during this week
        const start = new Date(activeWeek.startDate);
        const end = new Date(activeWeek.endDate);
        end.setHours(23, 59, 59, 999);

        const filteredExams = (examsData || []).filter((exam: any) => {
          if (!exam.date) return false;
          const examDate = new Date(exam.date);
          return examDate >= start && examDate <= end;
        });
        setExams(filteredExams);

        // Fetch AI evaluation
        const evaluation = await studentDataService.getWeeklyEvaluation(selectedStudent.uid, activeWeek.startDate);
        if (evaluation) {
          setAiReport(evaluation.evaluation);
        } else {
          setAiReport(null);
        }

      } catch (err) {
        console.error("Haftalık veriler çekilirken hata:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchWeekData();
  }, [selectedStudent, weeks, selectedWeekIndex]);

  // Check subscription requirements
  // Weekly reports are only available for Silver and Gold subscriptions
  const plan = studentProfile?.subscriptionPlan || selectedStudent?.subscriptionPlan || "";
  const isBronze = plan.toLowerCase().includes("bronz") || plan === "";
  const hasPremiumReports = !isBronze;

  // Statistics calculation
  let totalTasks = 0;
  let completedTasks = 0;
  let totalTargetSoru = 0;
  let totalCozulenSoru = 0;
  let totalStudyPages = 0;
  let totalWatchVideos = 0;

  dailyPrograms.forEach((program: any) => {
    const tasks = program.tasks || [];
    tasks.forEach((task: any) => {
      totalTasks++;
      if (task.isDone) {
        completedTasks++;
        
        if (task.type === "Soru Çözümü") {
          totalTargetSoru += Number(task.targetCount) || 0;
          totalCozulenSoru += Number(task.completedCount) || Number(task.targetCount) || 0;
        } else if (task.type === "Kitap Okuma" || task.type === "Konu Çalışması") {
          totalStudyPages += Number(task.completedCount) || Number(task.targetCount) || 0;
        } else if (task.type === "YouTube Video") {
          totalWatchVideos += Number(task.completedCount) || Number(task.targetCount) || 0;
        }
      } else {
        if (task.type === "Soru Çözümü") {
          totalTargetSoru += Number(task.targetCount) || 0;
          // Completed is 0 if not done
        }
      }
    });
  });

  const taskSuccessRate = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;
  const questionSuccessRate = totalTargetSoru > 0 ? Math.round((totalCozulenSoru / totalTargetSoru) * 100) : 0;

  // Exam Averages Classification
  const examCategories = {
    genel: {
      TYT: [] as any[],
      AYT: [] as any[],
      YDT: [] as any[],
      YKS: [] as any[],
    },
    brans: {
      TYT: [] as any[],
      AYT: [] as any[],
      YDT: [] as any[],
    }
  };

  exams.forEach((exam) => {
    const type = (exam.examType || "").toUpperCase();
    const name = (exam.examName || "").toUpperCase();
    const net = Number(exam.totalNet) || 0;

    const isBrans = type === "BRANŞ" || type === "DERS";

    if (isBrans) {
      if (name.includes("TYT")) {
        examCategories.brans.TYT.push({ exam, net });
      } else if (name.includes("AYT")) {
        examCategories.brans.AYT.push({ exam, net });
      } else if (name.includes("YDT")) {
        examCategories.brans.YDT.push({ exam, net });
      } else {
        examCategories.brans.TYT.push({ exam, net });
      }
    } else {
      if (type === "TYT") {
        examCategories.genel.TYT.push({ exam, net });
      } else if (type === "AYT") {
        examCategories.genel.AYT.push({ exam, net });
      } else if (type === "YDT") {
        examCategories.genel.YDT.push({ exam, net });
      } else if (type === "YKS") {
        let tytNet = 0;
        let aytNet = 0;
        if (exam.scores) {
          Object.entries(exam.scores).forEach(([fieldName, scoreObj]: [string, any]) => {
            const netVal = parseFloat(scoreObj?.n) || 0;
            if (fieldName.startsWith("TYT")) {
              tytNet += netVal;
            } else if (fieldName.startsWith("AYT")) {
              aytNet += netVal;
            }
          });
        }
        examCategories.genel.YKS.push({ exam, net, tytNet, aytNet });
        if (tytNet > 0) {
          examCategories.genel.TYT.push({ exam, net: parseFloat(tytNet.toFixed(2)), isFromYks: true });
        }
        if (aytNet > 0) {
          examCategories.genel.AYT.push({ exam, net: parseFloat(aytNet.toFixed(2)), isFromYks: true });
        }
      } else {
        examCategories.genel.TYT.push({ exam, net });
      }
    }
  });

  const getAvg = (list: any[]) => {
    if (list.length === 0) return null;
    const sum = list.reduce((acc, curr) => acc + curr.net, 0);
    return parseFloat((sum / list.length).toFixed(2));
  };

  const avgGenelTyt = getAvg(examCategories.genel.TYT);
  const avgGenelAyt = getAvg(examCategories.genel.AYT);
  const avgGenelYdt = getAvg(examCategories.genel.YDT);
  const avgGenelYks = examCategories.genel.YKS.length > 0 ? getAvg(examCategories.genel.YKS) : null;

  const avgBransTyt = getAvg(examCategories.brans.TYT);
  const avgBransAyt = getAvg(examCategories.brans.AYT);
  const avgBransYdt = getAvg(examCategories.brans.YDT);

  // AI-powered dynamically calculated educational recommendations in Turkish
  const handleGenerateAIReport = async () => {
    if (!selectedStudent?.uid || weeks.length === 0) return;
    setIsGenerating(true);
    try {
      const activeWeek = weeks[selectedWeekIndex];
      const draft = generateAIEvaluationDraft();
      let previousEvaluation = null;
      if (selectedWeekIndex < weeks.length - 1) {
        const prevWeek = weeks[selectedWeekIndex + 1];
        const prev = await studentDataService.getWeeklyEvaluation(selectedStudent.uid, prevWeek.startDate);
        if (prev) previousEvaluation = prev.evaluation;
      }
      const response = await fetch("/api/weekly-evaluation-generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt: draft, previousEvaluation, studentName: studentProfile?.firstName || selectedStudent?.displayName })
      });
      const data = await response.json();
      if (data.text) {
        await studentDataService.saveWeeklyEvaluation(selectedStudent.uid, activeWeek.startDate, data.text);
        setAiReport(data.text);
      } else {
        alert("Yapay zeka raporu oluşturulamadı.");
      }
    } catch (err) {
      console.error(err);
      alert("Yapay zeka raporu oluşturulurken bir hata oluştu.");
    } finally {
      setIsGenerating(false);
    }
  };

  const generateAIEvaluationDraft = () => {
    const studentName = studentProfile?.firstName || selectedStudent?.displayName || "Öğrencimiz";
    
    if (totalTasks === 0) {
      return `Sayın Velimiz, bu hafta içerisinde ${studentName} için sisteme tanımlanmış herhangi bir çalışma programı veya günlük görev verisi bulunmamaktadır. Sağlıklı bir gelişim raporu üretebilmemiz için lütfen öğrencimizin koçu ile iletişime geçerek haftalık çalışma planını eksiksiz doldurmasını sağlayınız.`;
    }

    // 1. Subject Stats (Yaptığı ve Yapmadığı Dersler)
    const subjectStats: Record<string, { total: number; completed: number }> = {};
    const taskTypeStats: Record<string, { total: number; completed: number }> = {};
    const dailyStats: Record<string, { total: number; completed: number; questions: number }> = {};

    dailyPrograms.forEach((program: any) => {
      const dateStr = program.date;
      const dayName = new Date(dateStr).toLocaleDateString("tr-TR", { weekday: "long" });
      if (!dailyStats[dayName]) {
        dailyStats[dayName] = { total: 0, completed: 0, questions: 0 };
      }
      
      const tasks = program.tasks || [];
      tasks.forEach((task: any) => {
        const subject = task.subject || "Belirtilmemiş";
        const type = task.type || "Diğer";
        const normalizedType = type === "Kitap Okuma" ? "Konu Çalışması" : type;

        if (!subjectStats[subject]) {
          subjectStats[subject] = { total: 0, completed: 0 };
        }
        if (!taskTypeStats[normalizedType]) {
          taskTypeStats[normalizedType] = { total: 0, completed: 0 };
        }

        subjectStats[subject].total++;
        taskTypeStats[normalizedType].total++;
        dailyStats[dayName].total++;

        if (task.isDone) {
          subjectStats[subject].completed++;
          taskTypeStats[normalizedType].completed++;
          dailyStats[dayName].completed++;
          
          if (task.type === "Soru Çözümü") {
            const solved = Number(task.completedCount) || Number(task.targetCount) || 0;
            dailyStats[dayName].questions += solved;
          }
        }
      });
    });

    const doneSubjectsList: string[] = [];
    const partialSubjectsList: string[] = [];
    const undoneSubjectsList: string[] = [];

    Object.entries(subjectStats).forEach(([subject, stats]) => {
      const pct = Math.round((stats.completed / stats.total) * 100);
      const text = `${subject} (${stats.completed}/${stats.total} görev)`;
      if (stats.completed === stats.total) {
        doneSubjectsList.push(text);
      } else if (stats.completed > 0) {
        partialSubjectsList.push(`${subject} (%${pct} tamamlandı, ${stats.completed}/${stats.total} görev)`);
      } else {
        undoneSubjectsList.push(text);
      }
    });

    const completedTaskTypesText = Object.entries(taskTypeStats)
      .map(([type, stats]) => {
        const pct = Math.round((stats.completed / stats.total) * 100);
        return `${type}: %${pct} (${stats.completed}/${stats.total} görev)`;
      })
      .join(", ");

    // Best performing days
    const sortedDaysBySuccess = Object.entries(dailyStats)
      .filter(([_, stats]) => stats.total > 0)
      .map(([day, stats]) => ({
        day,
        successRate: Math.round((stats.completed / stats.total) * 100),
        questions: stats.questions,
        completed: stats.completed
      }))
      .sort((a, b) => {
        if (b.successRate !== a.successRate) return b.successRate - a.successRate;
        return b.questions - a.questions;
      });

    const bestDaysText = sortedDaysBySuccess.slice(0, 2)
      .map(d => `${d.day} (%${d.successRate} görev sadakati, ${d.questions} soru)`)
      .join(" ve ");

    let reportText = `Sayın Velimiz,\n\n${studentName} isimli öğrencimizin bu haftaki (Pazartesi - Pazar) akademik performansını detaylı olarak analiz ettik. Haftalık karnemiz şu şekildedir:\n\n`;

    reportText += `📊 ÇALIŞMA VE PROGRAM SADAKATİ:\n`;
    reportText += `- Tamamlanan Görev Sayısı: ${completedTasks} / ${totalTasks} (%${taskSuccessRate} görev sadakat oranı)\n`;
    reportText += `- Toplam Çözülen Soru Sayısı: ${totalCozulenSoru} / ${totalTargetSoru} planlanan soru (%${questionSuccessRate} hedefe ulaşma)\n`;
    reportText += `- Konu Çalışması Sayfa Sayısı: ${totalStudyPages} Sayfa\n`;
    reportText += `- İzlenen Konu Anlatım Videosu: ${totalWatchVideos} Ders\n\n`;

    reportText += `📚 DERS BAZLI GÖREV ANALİZİ:\n`;
    if (doneSubjectsList.length > 0) {
      reportText += `- Tamamen Yapılan Dersler: ${doneSubjectsList.join(", ")}\n`;
    }
    if (partialSubjectsList.length > 0) {
      reportText += `- Kısmen Yapılan Dersler: ${partialSubjectsList.join(", ")}\n`;
    }
    if (undoneSubjectsList.length > 0) {
      reportText += `- Eksik / Yapılmayan Dersler: ${undoneSubjectsList.join(", ")}\n`;
    }
    if (doneSubjectsList.length === 0 && partialSubjectsList.length === 0 && undoneSubjectsList.length === 0) {
      reportText += `- Ders bazlı görev planı bulunmamaktadır.\n`;
    }
    reportText += `\n`;

    reportText += `🎯 GÖREV TİPİ VE SÜREÇ DETAYLARI:\n`;
    reportText += `- Görev Tiplerine Göre Başarı: ${completedTaskTypesText || "Görev tipi verisi bulunmuyor"}\n`;
    if (bestDaysText) {
      reportText += `- En Verimli Çalışılan Günler (En yüksek görev sadakati ve soru adedi sergilediği günler): ${bestDaysText}\n`;
    }
    reportText += `\n`;

    reportText += `📝 DENEME SINAVLARI NET ORTALAMALARI VE ANALİZİ:\n`;
    let hasExams = false;
    
    if (avgGenelTyt !== null || avgGenelAyt !== null || avgGenelYdt !== null || avgGenelYks !== null) {
      hasExams = true;
      reportText += `[GENEL DENEME SINAVLARI ORTALAMALARI (Öğrencinin tüm konulardan girdiği büyük denemeler)]:\n`;
      if (avgGenelTyt !== null) reportText += `  * TYT Genel Deneme Net Ortalaması: ${avgGenelTyt} Net\n`;
      if (avgGenelAyt !== null) reportText += `  * AYT Genel Deneme Net Ortalaması: ${avgGenelAyt} Net\n`;
      if (avgGenelYdt !== null) reportText += `  * YDT Genel Deneme Net Ortalaması: ${avgGenelYdt} Net\n`;
      if (avgGenelYks !== null) reportText += `  * YKS Karma Deneme Net Ortalaması: ${avgGenelYks} Net\n`;
    }

    if (avgBransTyt !== null || avgBransAyt !== null || avgBransYdt !== null) {
      hasExams = true;
      reportText += `[DERS DENEMELERİ / BRANŞ DENEMELERİ ORTALAMALARI (Tek bir derse veya konuya yönelik denemeler)]:\n`;
      if (avgBransTyt !== null) reportText += `  * TYT Branş/Ders Deneme Net Ortalaması: ${avgBransTyt} Net\n`;
      if (avgBransAyt !== null) reportText += `  * AYT Branş/Ders Deneme Net Ortalaması: ${avgBransAyt} Net\n`;
      if (avgBransYdt !== null) reportText += `  * YDT Branş/Ders Deneme Net Ortalaması: ${avgBransYdt} Net\n`;
    }

    if (!hasExams) {
      reportText += `Öğrencimizin bu hafta girilmiş deneme sınavı sonucu bulunmamaktadır. Bir sonraki hafta sınav kondisyonunu artırmak için planlanan deneme sınavlarına girmesini tavsiye ederiz.\n`;
    } else {
      const highestNetExam = [...exams].sort((a, b) => (b.totalNet || 0) - (a.totalNet || 0))[0];
      reportText += `\n- Haftanın En Yüksek Deneme Neti: ${highestNetExam.totalNet} net ile "${highestNetExam.examName}" denemesidir.\n`;
    }

    reportText += `\n🎯 FocusOn Akademi Rehberlik Önerisi: `;
    if (taskSuccessRate >= 80) {
      reportText += `Öğrencimizin mevcut plan disiplini mükemmel seviyededir. Gösterdiği istikrarlı çalışma için kendisini tebrik ediyor, motivasyonunu yüksek tutmak adına veli olarak olumlu geri bildirimlerinizi rica ediyoruz.`;
    } else if (taskSuccessRate >= 50) {
      reportText += `Öğrencimiz sınav hazırlık sürecinde istikrarlı bir tempo sergilese de bazı derslerde eksikler bulunmaktadır. Tamamlanmayan konuları koçuyla değerlendirecektir. Evde kaygıyı tetiklemeden desteğinizi sürdürmeniz kritiktir.`;
    } else {
      reportText += `Bu hafta program sadakatinde düşüş gözlemlenmiştir. Derslerdeki eksiklerin birikmemesi için çalışma sürelerini artırması ve odaklanmasını zorlaştıran dış etkenleri (teknoloji vb.) azaltması gerekmektedir. Koçumuz bu konuda ek tedbirler alacaktır.`;
    }

    return reportText;
  };

  // Helper for printing
  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-8 animate-fade-in text-white print:p-0 print:bg-white print:text-black">
      
      {/* Header Banner */}
      <div className="relative bg-gradient-to-r from-slate-900 via-emerald-950 to-slate-900 rounded-3xl p-6 md:p-8 text-white overflow-hidden shadow-xl border border-white/5 print:hidden">
        <div className="absolute top-0 right-0 w-80 h-80 bg-emerald-500/10 blur-3xl rounded-full pointer-events-none" />
        <div className="absolute bottom-0 left-1/3 w-64 h-64 bg-indigo-500/5 blur-3xl rounded-full pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/10 border border-white/10 text-xs font-semibold text-emerald-300 backdrop-blur-md">
              <Sparkles className="w-3.5 h-3.5" />
              Gelişim & Analiz Raporları
            </span>
            <h1 className="text-3xl font-bold tracking-tight text-white">Öğrenci Performans Raporları</h1>
            <p className="text-slate-300 text-sm max-w-2xl leading-relaxed">
              Öğrencimizin haftalık çalışma disiplinini, soru hedeflerini, ders bazlı ilerleme karnesini ve koç değerlendirmelerini buradan izleyebilirsiniz.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <div className="bg-white/5 border border-white/10 rounded-2xl p-4 text-center min-w-28 backdrop-blur-md">
              <p className="text-emerald-300 text-xs font-semibold uppercase tracking-wider">
                {activeTab === "weekly" ? "Haftalık Net" : activeTab === "monthly" ? "Aylık Net" : "Genel Net"}
              </p>
              <p className="text-2xl font-black text-white mt-1">
                {(() => {
                  const genelExams = exams.filter(e => {
                    const type = (e.examType || "").toUpperCase();
                    return type !== "BRANŞ" && type !== "DERS";
                  });
                  return genelExams.length > 0 
                    ? (genelExams.reduce((acc, curr) => acc + (curr.totalNet || 0), 0) / genelExams.length).toFixed(1) 
                    : "-";
                })()}
              </p>
            </div>
            <div className="bg-white/5 border border-white/10 rounded-2xl p-4 text-center min-w-28 backdrop-blur-md">
              <p className="text-indigo-300 text-xs font-semibold uppercase tracking-wider">
                {activeTab === "weekly" ? "Haftalık Görev" : activeTab === "monthly" ? "Aylık Görev" : "Görev Sadakati"}
              </p>
              <p className="text-2xl font-black text-white mt-1">%{taskSuccessRate}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs Menu */}
      <div className="flex border-b border-white/10 gap-2 print:hidden overflow-x-auto pb-1">
        <button
          onClick={() => setActiveTab("weekly")}
          className={`flex items-center gap-2 px-6 py-3.5 text-sm font-black tracking-wide uppercase transition-all shrink-0 rounded-t-2xl ${
            activeTab === "weekly"
              ? "border-b-2 border-emerald-500 text-emerald-400 bg-emerald-500/5"
              : "text-slate-400 hover:text-white"
          }`}
        >
          <Calendar className="w-4 h-4" />
          Haftalık Performans Raporu
        </button>
        <button
          onClick={() => setActiveTab("monthly")}
          className={`flex items-center gap-2 px-6 py-3.5 text-sm font-black tracking-wide uppercase transition-all shrink-0 rounded-t-2xl ${
            activeTab === "monthly"
              ? "border-b-2 border-emerald-500 text-emerald-400 bg-emerald-500/5"
              : "text-slate-400 hover:text-white"
          }`}
        >
          <CalendarDays className="w-4 h-4" />
          Aylık Değerlendirme Raporu
          <span className="text-[9px] bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 px-1.5 py-0.5 rounded-full font-bold">YAKINDA</span>
        </button>
        <button
          onClick={() => setActiveTab("comprehensive")}
          className={`flex items-center gap-2 px-6 py-3.5 text-sm font-black tracking-wide uppercase transition-all shrink-0 rounded-t-2xl ${
            activeTab === "comprehensive"
              ? "border-b-2 border-emerald-500 text-emerald-400 bg-emerald-500/5"
              : "text-slate-400 hover:text-white"
          }`}
        >
          <Award className="w-4 h-4" />
          Veli Bilgilendirme Raporu
          <span className="text-[9px] bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 px-1.5 py-0.5 rounded-full font-bold">YAKINDA</span>
        </button>
      </div>

      {/* 1. WEEKLY REPORT TAB */}
      {activeTab === "weekly" && (
        <div className="space-y-6">
          {/* Subscription Check Overlay */}
          {!hasPremiumReports ? (
            <div className="relative bg-slate-900/60 p-8 md:p-12 rounded-3xl border border-white/5 text-center max-w-2xl mx-auto space-y-6 shadow-2xl overflow-hidden print:hidden">
              <div className="absolute top-0 right-0 w-48 h-48 bg-amber-500/10 blur-3xl rounded-full" />
              <div className="w-16 h-16 bg-gradient-to-tr from-amber-500 to-yellow-400 rounded-2xl flex items-center justify-center text-slate-950 mx-auto shadow-lg shadow-amber-500/20">
                <Lock className="w-8 h-8" />
              </div>
              <div className="space-y-2">
                <h3 className="text-2xl font-bold text-white tracking-tight">Haftalık Performans Raporu Kısıtlı</h3>
                <p className="text-slate-400 text-sm leading-relaxed max-w-md mx-auto">
                  Haftalık detaylı performans analizi, çözülen soru karnesi, deneme sonuçları analizi ve eğitim koçu değerlendirme raporları sadece <span className="text-emerald-400 font-bold">Gümüş ve Altın</span> abonelik paketlerine özeldir.
                </p>
              </div>

              {/* Benefits list */}
              <div className="bg-slate-950/40 border border-white/5 p-4 rounded-2xl text-left max-w-md mx-auto space-y-2 text-xs text-slate-300">
                <div className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-emerald-500 shrink-0" />
                  <span>Pazartesi-Pazar arası tüm çözülen sorular ve hedeflere ulaşma oranı</span>
                </div>
                <div className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-emerald-500 shrink-0" />
                  <span>O hafta girilen tüm deneme sınavları ve net değişimleri</span>
                </div>
                <div className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-emerald-500 shrink-0" />
                  <span>Yapay Zeka destekli haftalık veli gelişim özeti</span>
                </div>
                <div className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-emerald-500 shrink-0" />
                  <span>Tek tıkla PDF olarak çıktı alma veya indirme</span>
                </div>
              </div>

              <div className="pt-2">
                <a
                  href="/panel/veli/abonelikler"
                  className="inline-flex items-center gap-2 bg-gradient-to-r from-emerald-600 to-teal-500 hover:from-emerald-500 hover:to-teal-400 text-white font-black text-xs uppercase tracking-wider py-3.5 px-8 rounded-2xl transition-all shadow-lg shadow-emerald-500/20"
                >
                  <Zap className="w-4 h-4" />
                  Paketi Gümüş veya Altın Yap
                </a>
              </div>
            </div>
          ) : (
            <div className="space-y-6">
              
              {/* Selector and Actions Bar */}
              <div className="flex flex-col md:flex-row items-center justify-between gap-4 bg-slate-900/40 p-4 rounded-2xl border border-white/5 print:hidden">
                <div className="flex items-center gap-3 w-full md:w-auto">
                  <span className="text-xs font-semibold text-slate-400 shrink-0">Rapor Haftası:</span>
                  <select
                    value={selectedWeekIndex}
                    onChange={(e) => setSelectedWeekIndex(Number(e.target.value))}
                    className="bg-slate-950/80 border border-white/10 rounded-xl px-4 py-2 text-xs font-bold text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20 w-full md:w-72"
                  >
                    {weeks.map((wk, idx) => (
                      <option key={idx} value={idx}>
                        {wk.label}
                      </option>
                    ))}
                  </select>
                </div>

                <button
                  onClick={handlePrint}
                  className="w-full md:w-auto inline-flex items-center justify-center gap-2 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/20 px-4 py-2 rounded-xl text-xs font-black transition-all"
                >
                  <Printer className="w-4 h-4" />
                  PDF / RAPOR ÇIKTISI AL
                </button>
              </div>

              {/* Printable Area Wrapper */}
              <div className="space-y-6 print:text-black">
                
                {/* Print Only Header (Hidden on UI) */}
                <div className="hidden print:block border-b-2 border-slate-900 pb-4 mb-6">
                  <div className="flex justify-between items-center">
                    <div>
                      <h1 className="text-2xl font-black tracking-tight text-slate-900 uppercase">FocusON Akademi</h1>
                      <p className="text-xs text-slate-500 font-bold uppercase">Kişiselleştirilmiş Eğitim Koçluğu Portal Raporu</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-bold text-slate-900">Haftalık Öğrenci Gelişim Raporu</p>
                      <p className="text-xs text-slate-500">{weeks[selectedWeekIndex]?.label}</p>
                    </div>
                  </div>
                </div>

                {loading ? (
                  <div className="p-20 text-center text-slate-400 flex flex-col items-center justify-center gap-3">
                    <div className="w-10 h-10 border-4 border-emerald-500/20 border-t-emerald-500 rounded-full animate-spin"></div>
                    <span className="text-xs font-semibold">Performans verileri ve analizler hesaplanıyor...</span>
                  </div>
                ) : (
                  <>
                    {/* Student Info Card (Print Friendly) */}
                    <div className="bg-slate-900/30 p-6 rounded-3xl border border-white/5 flex flex-col md:flex-row md:items-center justify-between gap-4 print:border-slate-200 print:bg-slate-50 print:p-4">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-emerald-500/10 border border-emerald-500/20 rounded-2xl flex items-center justify-center text-emerald-400 font-black text-xl">
                          {studentProfile?.firstName?.charAt(0) || selectedStudent?.displayName?.charAt(0) || "Ö"}
                        </div>
                        <div>
                          <h3 className="font-bold text-white text-base print:text-black">
                            {studentProfile?.firstName} {studentProfile?.lastName}
                          </h3>
                          <div className="flex flex-wrap items-center gap-3 text-xs text-slate-400 mt-1 print:text-slate-600">
                            <span>Sınıf: {studentProfile?.grade || "Girilmemiş"}</span>
                            <span>•</span>
                            <span>Alan: {studentProfile?.branch || "Girilmemiş"}</span>
                            {studentProfile?.targetUniversity && (
                              <>
                                <span>•</span>
                                <span className="text-emerald-400 font-medium">Hedef: {studentProfile.targetUniversity} - {studentProfile.targetDepartment}</span>
                              </>
                            )}
                          </div>
                        </div>
                      </div>

                      <div className="text-xs text-slate-400 space-y-1 md:text-right print:text-slate-600">
                        <p className="font-semibold">Abonelik Paketi: <span className="text-emerald-400 font-bold">{plan}</span></p>
                        <p>Rapor Dönemi: {weeks[selectedWeekIndex]?.label}</p>
                      </div>
                    </div>

                    {/* Stats Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                      
                      {/* Solved Question Widget */}
                      <div className="bg-slate-900/20 p-5 rounded-3xl border border-white/5 space-y-4 print:border-slate-200 print:bg-slate-50">
                        <div className="flex justify-between items-start">
                          <p className="text-xs text-slate-400 font-bold uppercase tracking-wider print:text-slate-600">Soru Çözümü</p>
                          <div className="bg-emerald-500/10 p-2 rounded-xl text-emerald-400">
                            <TrendingUp className="w-4 h-4" />
                          </div>
                        </div>
                        <div className="space-y-1">
                          <h4 className="text-2xl font-black text-white print:text-black">
                            {totalCozulenSoru} / {totalTargetSoru} <span className="text-xs font-normal text-slate-500">Soru</span>
                          </h4>
                          <p className="text-[11px] text-slate-400 print:text-slate-600">
                            Haftalık soru hedefine ulaşma oranı %{questionSuccessRate}
                          </p>
                        </div>
                        {totalTargetSoru > 0 && (
                          <div className="w-full bg-slate-950 h-2 rounded-full overflow-hidden print:bg-slate-200">
                            <div
                              className="h-full bg-emerald-500 rounded-full"
                              style={{ width: `${Math.min(questionSuccessRate, 100)}%` }}
                            />
                          </div>
                        )}
                      </div>

                      {/* Task Accomplishment Widget */}
                      <div className="bg-slate-900/20 p-5 rounded-3xl border border-white/5 space-y-4 print:border-slate-200 print:bg-slate-50">
                        <div className="flex justify-between items-start">
                          <p className="text-xs text-slate-400 font-bold uppercase tracking-wider print:text-slate-600">Görev Sadakati</p>
                          <div className="bg-indigo-500/10 p-2 rounded-xl text-indigo-400">
                            <CheckCircle className="w-4 h-4" />
                          </div>
                        </div>
                        <div className="space-y-1">
                          <h4 className="text-2xl font-black text-white print:text-black">
                            {completedTasks} / {totalTasks} <span className="text-xs font-normal text-slate-500">Görev</span>
                          </h4>
                          <p className="text-[11px] text-slate-400 print:text-slate-600">
                            Günlük program sadakat oranı %{taskSuccessRate}
                          </p>
                        </div>
                        {totalTasks > 0 && (
                          <div className="w-full bg-slate-950 h-2 rounded-full overflow-hidden print:bg-slate-200">
                            <div
                              className="h-full bg-indigo-500 rounded-full"
                              style={{ width: `${Math.min(taskSuccessRate, 100)}%` }}
                            />
                          </div>
                        )}
                      </div>

                      {/* Subject Study Widget */}
                      <div className="bg-slate-900/20 p-5 rounded-3xl border border-white/5 space-y-4 print:border-slate-200 print:bg-slate-50">
                        <div className="flex justify-between items-start">
                          <p className="text-xs text-slate-400 font-bold uppercase tracking-wider print:text-slate-600">Konu Çalışması</p>
                          <div className="bg-amber-500/10 p-2 rounded-xl text-amber-400">
                            <BookOpen className="w-4 h-4" />
                          </div>
                        </div>
                        <div className="space-y-1">
                          <h4 className="text-2xl font-black text-white print:text-black">
                            {totalStudyPages} <span className="text-xs font-normal text-slate-500">Sayfa</span>
                          </h4>
                          <p className="text-[11px] text-slate-400 print:text-slate-600">
                            Tamamlanan konu çalışması hacmi
                          </p>
                        </div>
                        <div className="flex items-center gap-1.5 text-[10px] text-slate-500">
                          <Info className="w-3 h-3 text-amber-400" />
                          <span>Haftalık konu pekiştirme süreci</span>
                        </div>
                      </div>

                      {/* Video Tracker Widget */}
                      <div className="bg-slate-900/20 p-5 rounded-3xl border border-white/5 space-y-4 print:border-slate-200 print:bg-slate-50">
                        <div className="flex justify-between items-start">
                          <p className="text-xs text-slate-400 font-bold uppercase tracking-wider print:text-slate-600">Konu Takibi</p>
                          <div className="bg-teal-500/10 p-2 rounded-xl text-teal-400">
                            <Clock className="w-4 h-4" />
                          </div>
                        </div>
                        <div className="space-y-1">
                          <h4 className="text-2xl font-black text-white print:text-black">
                            {totalWatchVideos} <span className="text-xs font-normal text-slate-500">Video/Ders</span>
                          </h4>
                          <p className="text-[11px] text-slate-400 print:text-slate-600">
                            İzlenen konu anlatım ve video analizleri
                          </p>
                        </div>
                        <div className="flex items-center gap-1.5 text-[10px] text-slate-500">
                          <Info className="w-3 h-3 text-teal-400" />
                          <span>Müfredat uyumlu konu kavrama</span>
                        </div>
                      </div>

                    </div>

                    {/* AI Powered Summary */}
                    <div className="bg-gradient-to-r from-emerald-950/40 via-slate-900/60 to-emerald-950/40 p-6 md:p-8 rounded-3xl border border-emerald-500/10 space-y-4 print:border-slate-300 print:bg-slate-100 print:p-6">
                      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                        <h3 className="font-bold text-white text-base flex items-center gap-2 print:text-slate-900">
                          <Sparkles className="w-5 h-5 text-emerald-400 shrink-0" />
                          ON Asistan Yapay Zeka Haftalık Analiz & Yorumu
                        </h3>
                        <div className="print:hidden">
                          <button
                            onClick={handleGenerateAIReport}
                            disabled={isGenerating}
                            className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                              isGenerating 
                                ? "bg-emerald-500/10 text-emerald-500/50 cursor-not-allowed" 
                                : "bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/20"
                            }`}
                          >
                            {isGenerating ? (
                              <>
                                <div className="w-3.5 h-3.5 border-2 border-emerald-500/20 border-t-emerald-500 rounded-full animate-spin"></div>
                                Analiz Üretiliyor...
                              </>
                            ) : (
                              <>
                                <Zap className="w-3.5 h-3.5" />
                                {aiReport ? "Analizi Yeniden Oluştur" : "Yapay Zeka Analizi Oluştur"}
                              </>
                            )}
                          </button>
                        </div>
                      </div>
                      <div className="text-slate-300 text-xs md:text-sm leading-relaxed whitespace-pre-wrap print:text-slate-800">
                        {aiReport ? aiReport : "Bu hafta için henüz yapay zeka analizi oluşturulmamış. Yukarıdaki butona tıklayarak öğrencimizin haftalık verileri ışığında detaylı bir gelişim raporu alabilirsiniz."}
                      </div>
                    </div>

                    {/* Deneme Ortalamaları Ayrımı */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      {/* Genel Deneme Ortalamaları */}
                      <div className="bg-slate-900/20 p-5 rounded-3xl border border-white/5 space-y-4 print:border-slate-200 print:bg-slate-50">
                        <div className="flex items-center gap-2 border-b border-white/5 pb-2 print:border-slate-200">
                          <Trophy className="w-4 h-4 text-emerald-400" />
                          <h4 className="font-bold text-white text-sm print:text-black">Genel Deneme Ortalamaları</h4>
                        </div>
                        <div className="grid grid-cols-3 gap-3">
                          <div className="bg-white/5 p-3 rounded-2xl text-center print:bg-slate-100">
                            <p className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider print:text-slate-600">TYT Genel</p>
                            <p className="text-base font-black text-white mt-1 print:text-black">
                              {avgGenelTyt !== null ? `${avgGenelTyt} Net` : "-"}
                            </p>
                          </div>
                          <div className="bg-white/5 p-3 rounded-2xl text-center print:bg-slate-100">
                            <p className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider print:text-slate-600">AYT Genel</p>
                            <p className="text-base font-black text-white mt-1 print:text-black">
                              {avgGenelAyt !== null ? `${avgGenelAyt} Net` : "-"}
                            </p>
                          </div>
                          <div className="bg-white/5 p-3 rounded-2xl text-center print:bg-slate-100">
                            <p className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider print:text-slate-600">YDT Genel</p>
                            <p className="text-base font-black text-white mt-1 print:text-black">
                              {avgGenelYdt !== null ? `${avgGenelYdt} Net` : "-"}
                            </p>
                          </div>
                        </div>
                      </div>

                      {/* Branş / Ders Deneme Ortalamaları */}
                      <div className="bg-slate-900/20 p-5 rounded-3xl border border-white/5 space-y-4 print:border-slate-200 print:bg-slate-50">
                        <div className="flex items-center gap-2 border-b border-white/5 pb-2 print:border-slate-200">
                          <LineChart className="w-4 h-4 text-indigo-400" />
                          <h4 className="font-bold text-white text-sm print:text-black">Branş / Ders Deneme Ortalamaları</h4>
                        </div>
                        <div className="grid grid-cols-3 gap-3">
                          <div className="bg-white/5 p-3 rounded-2xl text-center print:bg-slate-100">
                            <p className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider print:text-slate-600">TYT Branş</p>
                            <p className="text-base font-black text-white mt-1 print:text-black">
                              {avgBransTyt !== null ? `${avgBransTyt} Net` : "-"}
                            </p>
                          </div>
                          <div className="bg-white/5 p-3 rounded-2xl text-center print:bg-slate-100">
                            <p className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider print:text-slate-600">AYT Branş</p>
                            <p className="text-base font-black text-white mt-1 print:text-black">
                              {avgBransAyt !== null ? `${avgBransAyt} Net` : "-"}
                            </p>
                          </div>
                          <div className="bg-white/5 p-3 rounded-2xl text-center print:bg-slate-100">
                            <p className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider print:text-slate-600">YDT Branş</p>
                            <p className="text-base font-black text-white mt-1 print:text-black">
                              {avgBransYdt !== null ? `${avgBransYdt} Net` : "-"}
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Weekly Exams Taken */}
                    <div className="bg-slate-800/20 rounded-3xl border border-white/5 overflow-hidden print:border-slate-200 print:bg-slate-50">
                      <div className="p-5 border-b border-white/5 print:border-slate-200">
                        <h4 className="font-bold text-white text-base print:text-black">Bu Hafta Girilen Deneme Sınavları</h4>
                        <p className="text-slate-400 text-xs mt-1 print:text-slate-600">Öğrencimizin bu hafta sisteme işlenen deneme ve tarama sonuçları.</p>
                      </div>

                      {exams.length === 0 ? (
                        <div className="p-10 text-center text-slate-500">
                          <p className="text-xs">Bu hafta içerisinde girilmiş herhangi bir deneme sınavı verisi bulunmamaktadır.</p>
                        </div>
                      ) : (
                        <div className="overflow-x-auto">
                          <table className="w-full text-left border-collapse">
                            <thead>
                              <tr className="bg-slate-900/60 text-slate-400 text-[10px] font-bold uppercase tracking-wider print:bg-slate-100 print:text-slate-700">
                                <th className="px-5 py-3">Sınav Adı</th>
                                <th className="px-5 py-3">Tür</th>
                                <th className="px-5 py-3">Tarih</th>
                                <th className="px-5 py-3">Toplam Net</th>
                                <th className="px-5 py-3">Derece / Sıra</th>
                                <th className="px-5 py-3">Yüzdelik Dilim</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-white/5 text-xs text-slate-300 print:divide-slate-200 print:text-slate-800">
                              {exams.map((exam, idx) => (
                                <tr key={exam.id || idx} className="hover:bg-white/5 print:hover:bg-transparent">
                                  <td className="px-5 py-3.5 font-bold text-white print:text-black">{exam.examName}</td>
                                  <td className="px-5 py-3.5">
                                    <span className="px-2 py-0.5 bg-slate-900 border border-white/10 rounded-md text-[10px] font-semibold print:bg-slate-200 print:border-slate-300">
                                      {exam.examType}
                                    </span>
                                  </td>
                                  <td className="px-5 py-3.5">
                                    {new Date(exam.date).toLocaleDateString("tr-TR", {
                                      year: "numeric",
                                      month: "short",
                                      day: "numeric",
                                    })}
                                  </td>
                                  <td className="px-5 py-3.5 font-black text-emerald-400 print:text-emerald-700">{exam.totalNet || 0} Net</td>
                                  <td className="px-5 py-3.5">
                                    {exam.rank ? `${exam.rank} / ${exam.participantCount || "-"}` : "-"}
                                  </td>
                                  <td className="px-5 py-3.5">
                                    {exam.percentile ? `%${exam.percentile}` : "-"}
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      )}
                    </div>

                    {/* Detailed Day-by-Day performance analysis */}
                    <div className="bg-slate-800/20 rounded-3xl border border-white/5 overflow-hidden print:border-slate-200 print:bg-slate-50">
                      <div className="p-5 border-b border-white/5 print:border-slate-200">
                        <h4 className="font-bold text-white text-base print:text-black">Günlük Görev ve Çalışma Raporu Detayları</h4>
                        <p className="text-slate-400 text-xs mt-1 print:text-slate-600">Pazartesi - Pazar aralığında koç tarafından planlanıp tamamlanan görev listesi.</p>
                      </div>

                      {dailyPrograms.length === 0 ? (
                        <div className="p-10 text-center text-slate-500">
                          <p className="text-xs">Bu hafta içerisinde girilmiş çalışma programı verisi bulunmamaktadır.</p>
                        </div>
                      ) : (
                        <div className="divide-y divide-white/5 print:divide-slate-200">
                          {weeks[selectedWeekIndex]?.dates.map((dateStr) => {
                            const prog = dailyPrograms.find((p) => p.date === dateStr);
                            const tasks = prog?.tasks || [];
                            const formattedDate = new Date(dateStr).toLocaleDateString("tr-TR", {
                              weekday: "long",
                              day: "numeric",
                              month: "long",
                            });

                            if (tasks.length === 0) return null;

                            return (
                              <div key={dateStr} className="p-5 flex flex-col md:flex-row gap-4 items-start justify-between">
                                <div className="w-48 shrink-0">
                                  <span className="text-xs font-bold text-emerald-400 block">{formattedDate}</span>
                                  <span className="text-[10px] text-slate-500">
                                    {tasks.filter((t: any) => t.isDone).length} / {tasks.length} Görev Yapıldı
                                  </span>
                                </div>
                                <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-3 w-full">
                                  {tasks.map((task: any, tIdx: number) => {
                                    const isWaitingExpired = (() => {
                                      if (!task.isWaitingResult || !dateStr) return false;
                                      const parts = (dateStr || '').split('-');
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
                                      className={`p-3 rounded-2xl border flex items-center justify-between text-xs ${
                                        task.isWaitingResult
                                          ? (isWaitingExpired ? "bg-red-500/10 border-red-500/30 text-red-300" : "bg-amber-500/5 border-amber-500/10 text-amber-300")
                                          : task.isDone
                                            ? "bg-emerald-500/5 border-emerald-500/10 text-emerald-300"
                                            : "bg-slate-900/50 border-white/5 text-slate-400"
                                      }`}
                                    >

                                      <div>
                                        <p className="font-bold uppercase text-[10px] text-indigo-300">{task.subject}</p>
                                        <p className="text-white mt-0.5 print:text-black font-semibold">{task.topic || "Konu belirtilmemiş"}</p>
                                        {task.targetCount > 0 && (
                                          <p className="text-[10px] text-slate-500 mt-1">
                                            Hedef: {task.targetCount} {task.type === "Soru Çözümü" ? "Soru" : "Birim"} 
                                            {task.isDone && ` | Yapılan: ${task.completedCount || task.targetCount}`}
                                          </p>
                                        )}
                                        {task.isWaitingResult && (
                                          <p className={`text-[10px] font-bold mt-1 uppercase tracking-wider ${isWaitingExpired ? 'text-red-400' : 'text-amber-500'}`}>
                                            {isWaitingExpired ? 'Yapılmadı (5+ Gün Geçti)' : 'Sonuç Bekleniyor'}
                                          </p>
                                        )}
                                      </div>
                                      <div className={`w-5 h-5 rounded-full flex items-center justify-center shrink-0 border ${
                                        task.isDone && !isWaitingExpired
                                          ? "bg-emerald-500 border-emerald-500 text-slate-950"
                                          : isWaitingExpired
                                            ? "bg-red-500/20 border-red-500 text-red-400"
                                            : "border-slate-700 text-transparent"
                                      }`}>
                                        <Check className="w-3 h-3" strokeWidth={3} />
                                      </div>
                                    </div>
                                  ); })}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>

                    {/* Veli İmza & Bilgilendirme Notu */}
                    <div className="hidden print:block pt-12">
                      <div className="grid grid-cols-2 gap-12 text-xs text-center">
                        <div className="space-y-12">
                          <p className="font-bold text-slate-800">Eğitim Koçu Değerlendirmesi & İmza</p>
                          <div className="border-t border-slate-300 w-48 mx-auto pt-2">
                            <span>ON Akademi Eğitim Koçu</span>
                          </div>
                        </div>
                        <div className="space-y-12">
                          <p className="font-bold text-slate-800">Sayın Velimizin İmzası & Görüşü</p>
                          <div className="border-t border-slate-300 w-48 mx-auto pt-2">
                            <span>Öğrenci Velisi</span>
                          </div>
                        </div>
                      </div>
                    </div>

                  </>
                )}
              </div>
            </div>
          )}
        </div>
      )}

      {/* 2. MONTHLY REPORT TAB */}
      {activeTab === "monthly" && (
        <div className="bg-slate-900/40 p-8 rounded-3xl border border-white/5 text-center max-w-xl mx-auto space-y-4 print:hidden">
          <div className="w-16 h-16 bg-indigo-500/10 text-indigo-400 rounded-full flex items-center justify-center mx-auto">
            <CalendarDays className="w-8 h-8" />
          </div>
          <h3 className="text-xl font-bold text-white">Aylık Değerlendirme Raporu</h3>
          <p className="text-slate-400 text-xs leading-relaxed">
            Aylık değerlendirme raporu, öğrencimizin 4 haftalık periyotlar boyunca sergilediği gelişim ivmesini, konu eksikliklerini ve hedef üniversite kazanım yüzdesini ölçer.
          </p>
          <div className="bg-white/5 p-4 rounded-2xl text-left text-xs text-slate-300 space-y-1">
            <p>📋 <span className="font-semibold">Müfredat Kazanım Oranı:</span> Bitirilen konuların sınav konularına oranı.</p>
            <p>📈 <span className="font-semibold">Aylık Net Değişim Grafiği:</span> Son 1 ayda girilen denemelerin ders bazlı net analizi.</p>
            <p>🏆 <span className="font-semibold">Özel Başarı Rozetleri:</span> Öğrencimizin gösterdiği üstün disiplin ve başarı sertifikaları.</p>
          </div>
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/20 text-xs font-semibold">
            Çok Yakında Entegre Edilecektir
          </span>
        </div>
      )}

      {/* 3. COMPREHENSIVE REPORT TAB */}
      {activeTab === "comprehensive" && (
        <div className="bg-slate-900/40 p-8 rounded-3xl border border-white/5 text-center max-w-xl mx-auto space-y-4 print:hidden">
          <div className="w-16 h-16 bg-indigo-500/10 text-indigo-400 rounded-full flex items-center justify-center mx-auto">
            <Award className="w-8 h-8" />
          </div>
          <h3 className="text-xl font-bold text-white">Kapsamlı Veli Bilgilendirme Raporu</h3>
          <p className="text-slate-400 text-xs leading-relaxed">
            Akademik gelişimlerin yanında öğrencimizin motivasyon düzeyini, sınav stresi yönetimi analizi, rehberlik anket sonuçlarını ve koçunun özel yazılı raporlarını içeren geniş kapsamlı akademik karne.
          </p>
          <div className="bg-white/5 p-4 rounded-2xl text-left text-xs text-slate-300 space-y-1">
            <p>🧠 <span className="font-semibold">Psikolojik Motivasyon Seviyesi:</span> Sınav kaygısı ve duygu durum takipleri.</p>
            <p>👥 <span className="font-semibold">Birebir Koç Değerlendirmeleri:</span> Koçumuzun veliye özel tavsiye ve geribildirimleri.</p>
            <p>🎯 <span className="font-semibold">Bilişsel Haritalandırma:</span> Öğrenme tarzı ve dikkat düzeyinin dönemsel haritası.</p>
          </div>
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/20 text-xs font-semibold">
            Çok Yakında Entegre Edilecektir
          </span>
        </div>
      )}

    </div>
  );
}
