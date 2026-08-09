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
  User,
  Heart,
  Target,
  Brain,
  ShieldCheck,
  Compass,
  FileText,
  Activity,
  Smile,
  BarChart2,
  CheckCircle2,
} from "lucide-react";
import { useStudent } from "../../lib/StudentContext";
import { studentDataService } from "../../services/studentDataService";
import { getTaskTypeMeta } from "./ParentProgram";
import { doc, getDoc } from "firebase/firestore";
import { db } from "../../lib/firebase";

interface WeekOption {
  label: string;
  startDate: string; // YYYY-MM-DD
  endDate: string; // YYYY-MM-DD
  dates: string[]; // List of YYYY-MM-DD dates
}

interface MonthOption {
  key: string; // YYYY-MM
  label: string; // e.g. "Ağustos 2026"
  startDate: string; // YYYY-MM-01
  endDate: string; // YYYY-MM-31
  year: number;
  monthIndex: number;
  monthName: string;
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
  const [evaluationData, setEvaluationData] = useState<any>(null);
  const [isGenerating, setIsGenerating] = useState(false);

  // Monthly Stats & State
  const [months, setMonths] = useState<MonthOption[]>([]);
  const [selectedMonthIndex, setSelectedMonthIndex] = useState(0);
  const [monthlyLoading, setMonthlyLoading] = useState(false);
  const [monthlyPrograms, setMonthlyPrograms] = useState<any[]>([]);
  const [monthlyExams, setMonthlyExams] = useState<any[]>([]);
  const [monthlyGoalDoc, setMonthlyGoalDoc] = useState<any>(null);

  // Comprehensive Stats & State
  const [compLoading, setCompLoading] = useState(false);
  const [compAllPrograms, setCompAllPrograms] = useState<any[]>([]);
  const [compAllExams, setCompAllExams] = useState<any[]>([]);
  const [compCabaTest, setCompCabaTest] = useState<any>(null);
  const [selectedTerm, setSelectedTerm] = useState<"all" | "term1" | "term2">("all");

  // Helper to parse "YYYY-MM-DD" as a local Date object (00:00:00)
  const parseDateString = (str: string) => {
    if (!str) return new Date();
    const parts = str.split("-");
    if (parts.length === 3) {
      return new Date(Number(parts[0]), Number(parts[1]) - 1, Number(parts[2]));
    }
    return new Date(str);
  };

  // Helper to format Date to "YYYY-MM-DD" in local time
  const formatLocalDateYYYYMMDD = (d: Date) => {
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    return `${y}-${m}-${day}`;
  };

  // Helper for formatting evaluation saved/updated date
  const formatEvaluationDate = (evalObj: any) => {
    if (!evalObj) return null;
    const rawDate = evalObj.updatedAt || evalObj.createdAt;
    if (!rawDate) return null;
    let dateObj: Date;
    if (rawDate.toDate && typeof rawDate.toDate === "function") {
      dateObj = rawDate.toDate();
    } else if (rawDate.seconds) {
      dateObj = new Date(rawDate.seconds * 1000);
    } else {
      dateObj = new Date(rawDate);
    }
    if (isNaN(dateObj.getTime())) return null;
    return dateObj.toLocaleDateString("tr-TR", {
      day: "numeric",
      month: "long",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

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
          dates.push(formatLocalDateYYYYMMDD(dayDate));
        }

        const formatOptions: Intl.DateTimeFormatOptions = { day: "numeric", month: "long" };
        const label = `${monday.toLocaleDateString("tr-TR", formatOptions)} - ${sunday.toLocaleDateString("tr-TR", formatOptions)} ${monday.getFullYear()}`;

        result.push({
          label: i === 0 ? `Bu Hafta (${label})` : `${i} Hafta Önce (${label})`,
          startDate: formatLocalDateYYYYMMDD(monday),
          endDate: formatLocalDateYYYYMMDD(sunday),
          dates,
        });
      }
      setWeeks(result);
    };

    generateWeeks();
  }, []);

  // Generate recent 6 months
  useEffect(() => {
    const generateMonths = () => {
      const result: MonthOption[] = [];
      const now = new Date();
      const monthNames = [
        "Ocak", "Şubat", "Mart", "Nisan", "Mayıs", "Haziran",
        "Temmuz", "Ağustos", "Eylül", "Ekim", "Kasım", "Aralık"
      ];
      for (let i = 0; i < 6; i++) {
        const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
        const year = d.getFullYear();
        const monthIndex = d.getMonth();
        const lastDay = new Date(year, monthIndex + 1, 0).getDate();
        const mStr = String(monthIndex + 1).padStart(2, "0");

        result.push({
          key: `${year}-${mStr}`,
          label: i === 0 ? `Bu Ay (${monthNames[monthIndex]} ${year})` : `${monthNames[monthIndex]} ${year}`,
          startDate: `${year}-${mStr}-01`,
          endDate: `${year}-${mStr}-${String(lastDay).padStart(2, "0")}`,
          year,
          monthIndex,
          monthName: monthNames[monthIndex],
        });
      }
      setMonths(result);
    };

    generateMonths();
  }, []);

  // Fetch Monthly Data when activeTab === "monthly" or month changes
  useEffect(() => {
    const fetchMonthlyData = async () => {
      if (!selectedStudent?.uid || months.length === 0 || activeTab !== "monthly") return;
      try {
        setMonthlyLoading(true);
        const activeMonth = months[selectedMonthIndex];

        // 1. Fetch all daily programs
        const allPrograms = await studentDataService.getAllDailyPrograms(selectedStudent.uid);
        const filteredProg = (allPrograms || []).filter((p: any) => {
          if (!p.date) return false;
          return p.date >= activeMonth.startDate && p.date <= activeMonth.endDate;
        });
        setMonthlyPrograms(filteredProg);

        // 2. Fetch exam results
        const allExams = await studentDataService.getExamResults(selectedStudent.uid);
        const filteredExams = (allExams || []).filter((e: any) => {
          if (!e.date) return false;
          return e.date >= activeMonth.startDate && e.date <= activeMonth.endDate;
        });
        setMonthlyExams(filteredExams);

        // 3. Fetch monthly goal / evaluation
        const goal = await studentDataService.getMonthlyGoal(selectedStudent.uid, activeMonth.key);
        setMonthlyGoalDoc(goal);
      } catch (err) {
        console.error("Aylık veriler çekilirken hata:", err);
      } finally {
        setMonthlyLoading(false);
      }
    };

    fetchMonthlyData();
  }, [selectedStudent, months, selectedMonthIndex, activeTab]);

  // Fetch Comprehensive Data when activeTab === "comprehensive"
  useEffect(() => {
    const fetchComprehensiveData = async () => {
      if (!selectedStudent?.uid || activeTab !== "comprehensive") return;
      try {
        setCompLoading(true);
        const [programs, examsList, caba] = await Promise.all([
          studentDataService.getAllDailyPrograms(selectedStudent.uid),
          studentDataService.getExamResults(selectedStudent.uid),
          studentDataService.getCabaTestResult(selectedStudent.uid),
        ]);
        setCompAllPrograms(programs || []);
        setCompAllExams(examsList || []);
        setCompCabaTest(caba);
      } catch (err) {
        console.error("Kapsamlı rapor verileri çekilirken hata:", err);
      } finally {
        setCompLoading(false);
      }
    };

    fetchComprehensiveData();
  }, [selectedStudent, activeTab]);

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
        const start = parseDateString(activeWeek.startDate);
        const end = parseDateString(activeWeek.endDate);
        end.setHours(23, 59, 59, 999);

        const filteredExams = (examsData || []).filter((exam: any) => {
          if (!exam.date) return false;
          const examDate = new Date(exam.date);
          return examDate >= start && examDate <= end;
        });
        setExams(filteredExams);

        // Fetch AI evaluation & Coach evaluation
        const evaluation = await studentDataService.getWeeklyEvaluation(selectedStudent.uid, activeWeek.startDate);
        if (evaluation && evaluation.evaluation) {
          setAiReport(evaluation.evaluation);
          setEvaluationData(evaluation);
        } else {
          setAiReport(null);
          setEvaluationData(null);
          
          // Auto generate on Sunday evening (18:00+) or for past weeks if no report exists
          const sundayEvening = parseDateString(activeWeek.endDate);
          sundayEvening.setHours(18, 0, 0, 0);
          const now = new Date();
          if (now >= sundayEvening) {
            // Auto generate report and save to Firestore
            setTimeout(() => {
              handleGenerateAIReportForWeek(activeWeek);
            }, 100);
          }
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
      const tType = (task.type || task.taskType || "").toLowerCase();
      const target = Number(task.targetCount) || 0;
      const completed = Number(task.completedCount) || (task.isDone ? target : 0);

      if (tType.includes("soru")) {
        totalTargetSoru += target;
        if (task.isDone) totalCozulenSoru += completed;
      } else if (tType.includes("kitap") || tType.includes("konu") || tType.includes("sayfa") || tType.includes("okuma")) {
        if (task.isDone) totalStudyPages += completed || 1;
      } else if (tType.includes("video") || tType.includes("youtube") || tType.includes("ders")) {
        if (task.isDone) totalWatchVideos += completed || 1;
      }

      if (task.isDone) {
        completedTasks++;
      }
    });
  });

  const taskSuccessRate = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;
  const questionSuccessRate = totalTargetSoru > 0 ? Math.round((totalCozulenSoru / totalTargetSoru) * 100) : 0;

  // Monthly statistics & subject breakdown calculations
  let monthlyTotalTasks = 0;
  let monthlyCompletedTasks = 0;
  let monthlyTargetSoru = 0;
  let monthlyCozulenSoru = 0;
  let monthlyStudyPages = 0;
  let monthlyWatchVideos = 0;

  const monthlySubjectSoruMap: Record<string, { target: number; completed: number; taskCount: number }> = {};
  let activeStudyDaysCount = 0;
  let peakDayInfo = { date: "", count: 0 };

  monthlyPrograms.forEach((program: any) => {
    const tasks = program.tasks || [];
    const pDate = program.date;
    let dayTotalSoru = 0;
    let hasDoneTask = false;

    tasks.forEach((task: any) => {
      monthlyTotalTasks++;
      const tType = (task.type || task.taskType || "").toLowerCase();
      const tName = (task.taskName || task.title || "").toLowerCase();
      const target = Number(task.targetCount) || 0;
      const completed = Number(task.completedCount) || (task.isDone ? target : 0);

      if (task.isDone) {
        monthlyCompletedTasks++;
        hasDoneTask = true;
      }

      if (tType.includes("soru") || tName.includes("soru") || target > 0) {
        monthlyTargetSoru += target;
        if (task.isDone) {
          monthlyCozulenSoru += completed;
          dayTotalSoru += completed;
        }

        // Determine subject
        let subj = task.subject || task.lessonName || task.category || "";
        if (!subj) {
          if (tName.includes("matematik") || tName.includes("mat")) subj = "Matematik";
          else if (tName.includes("türkçe") || tName.includes("turkce") || tName.includes("paragraf")) subj = "Türkçe & Paragraf";
          else if (tName.includes("fizik")) subj = "Fizik";
          else if (tName.includes("kimya")) subj = "Kimya";
          else if (tName.includes("biyoloji") || tName.includes("bio")) subj = "Biyoloji";
          else if (tName.includes("tarih")) subj = "Tarih";
          else if (tName.includes("coğrafya") || tName.includes("cografya")) subj = "Coğrafya";
          else if (tName.includes("felsefe") || tName.includes("din")) subj = "Felsefe & Din";
          else if (tName.includes("geometri") || tName.includes("geo")) subj = "Geometri";
          else subj = "Genel Soru Pratiği";
        }

        if (!monthlySubjectSoruMap[subj]) {
          monthlySubjectSoruMap[subj] = { target: 0, completed: 0, taskCount: 0 };
        }
        monthlySubjectSoruMap[subj].target += target;
        if (task.isDone) {
          monthlySubjectSoruMap[subj].completed += completed;
        }
        monthlySubjectSoruMap[subj].taskCount += 1;
      } else if (tType.includes("kitap") || tType.includes("konu") || tType.includes("sayfa") || tType.includes("okuma")) {
        if (task.isDone) monthlyStudyPages += completed || 1;
      } else if (tType.includes("video") || tType.includes("youtube") || tType.includes("ders")) {
        if (task.isDone) monthlyWatchVideos += completed || 1;
      }
    });

    if (hasDoneTask) {
      activeStudyDaysCount++;
    }

    if (pDate && dayTotalSoru > 0) {
      if (dayTotalSoru > peakDayInfo.count) {
        peakDayInfo = { date: pDate, count: dayTotalSoru };
      }
    }
  });

  const monthlyTaskSuccessRate = monthlyTotalTasks > 0
    ? Math.round((monthlyCompletedTasks / monthlyTotalTasks) * 100)
    : 0;

  const monthlySoruSuccessRate = monthlyTargetSoru > 0
    ? Math.round((monthlyCozulenSoru / monthlyTargetSoru) * 100)
    : 0;

  const dailyAverageSoru = activeStudyDaysCount > 0 ? Math.round(monthlyCozulenSoru / activeStudyDaysCount) : 0;

  // Monthly Exam statistics (Separated Genel vs Branş)
  const checkIsBrans = (e: any) => {
    const type = (e.examType || "").toUpperCase();
    const name = (e.examName || "").toUpperCase();
    return type.includes("BRANŞ") || type.includes("BRANS") || type === "DERS" || name.includes("BRANŞ") || name.includes("BRANS");
  };

  const monthlyGenelExams = monthlyExams.filter((e: any) => !checkIsBrans(e));
  const monthlyBransExams = monthlyExams.filter((e: any) => checkIsBrans(e));

  const monthlyTytExams = monthlyGenelExams.filter((e: any) => {
    const type = (e.examType || "").toUpperCase();
    const name = (e.examName || "").toUpperCase();
    return type.includes("TYT") || name.includes("TYT");
  });

  const monthlyAytExams = monthlyGenelExams.filter((e: any) => {
    const type = (e.examType || "").toUpperCase();
    const name = (e.examName || "").toUpperCase();
    return type.includes("AYT") || name.includes("AYT");
  });

  const monthlyTytAvgNet = monthlyTytExams.length > 0
    ? (monthlyTytExams.reduce((a, b) => a + (Number(b.totalNet) || 0), 0) / monthlyTytExams.length).toFixed(1)
    : "-";

  const monthlyAytAvgNet = monthlyAytExams.length > 0
    ? (monthlyAytExams.reduce((a, b) => a + (Number(b.totalNet) || 0), 0) / monthlyAytExams.length).toFixed(1)
    : "-";

  const monthlyGenelExamNets = monthlyGenelExams.map((e: any) => Number(e.totalNet) || 0);
  const monthlyHighestNet = monthlyGenelExamNets.length > 0
    ? Math.max(...monthlyGenelExamNets)
    : monthlyExams.length > 0
    ? Math.max(...monthlyExams.map((e: any) => Number(e.totalNet) || 0))
    : 0;

  // Subject Net Breakdown separated into Genel Deneme Ders Netleri vs Branş Denemesi Netleri
  const genelSubjectMap: Record<string, { totalNet: number; count: number }> = {};
  const bransSubjectMap: Record<string, { totalNet: number; count: number }> = {};

  monthlyExams.forEach((exam: any) => {
    const targetMap = checkIsBrans(exam) ? bransSubjectMap : genelSubjectMap;
    if (exam.sections && Array.isArray(exam.sections)) {
      exam.sections.forEach((sec: any) => {
        const name = sec.name || sec.subject || "Genel";
        const net = Number(sec.net) || 0;
        if (!targetMap[name]) targetMap[name] = { totalNet: 0, count: 0 };
        targetMap[name].totalNet += net;
        targetMap[name].count += 1;
      });
    } else {
      ["turkce", "matematik", "fen", "sosyal"].forEach((subjKey) => {
        if (exam[subjKey + "Net"] !== undefined) {
          const name = subjKey === "turkce" ? "Türkçe" : subjKey === "matematik" ? "Matematik" : subjKey === "fen" ? "Fen Bilimleri" : "Sosyal Bilgiler";
          const net = Number(exam[subjKey + "Net"]) || 0;
          if (!targetMap[name]) targetMap[name] = { totalNet: 0, count: 0 };
          targetMap[name].totalNet += net;
          targetMap[name].count += 1;
        }
      });
    }
  });

  // 4-Week Breakdown inside Month (Separated Genel vs Branş)
  const activeMonthObj = months[selectedMonthIndex];
  const monthlyWeeksBreakdown = [1, 2, 3, 4].map((weekNum) => {
    const startDay = (weekNum - 1) * 7 + 1;
    const endDay = weekNum === 4 ? 31 : weekNum * 7;

    let wSolvedSoru = 0;
    let wTotalTasks = 0;
    let wDoneTasks = 0;

    monthlyPrograms.forEach((p: any) => {
      if (!p.date) return;
      const dayNum = parseInt(p.date.split("-")[2], 10);
      if (dayNum >= startDay && dayNum <= endDay) {
        (p.tasks || []).forEach((t: any) => {
          wTotalTasks++;
          const tType = (t.type || t.taskType || "").toLowerCase();
          const target = Number(t.targetCount) || 0;
          const completed = Number(t.completedCount) || (t.isDone ? target : 0);
          if (t.isDone) {
            wDoneTasks++;
            if (tType.includes("soru")) wSolvedSoru += completed;
          }
        });
      }
    });

    const wExams = monthlyExams.filter((e: any) => {
      if (!e.date) return false;
      const dayNum = parseInt(e.date.split("-")[2], 10);
      return dayNum >= startDay && dayNum <= endDay;
    });

    const wGenelExams = wExams.filter((e: any) => !checkIsBrans(e));
    const wBransExams = wExams.filter((e: any) => checkIsBrans(e));

    const wGenelAvgNet = wGenelExams.length > 0
      ? (wGenelExams.reduce((a: number, b: any) => a + (Number(b.totalNet) || 0), 0) / wGenelExams.length).toFixed(1)
      : "-";

    const wRate = wTotalTasks > 0 ? Math.round((wDoneTasks / wTotalTasks) * 100) : 0;

    return {
      weekNum,
      label: `${weekNum}. Hafta (${startDay}-${endDay} ${activeMonthObj?.monthName || ''})`,
      solvedSoru: wSolvedSoru,
      taskRate: wRate,
      genelAvgNet: wGenelAvgNet,
      genelCount: wGenelExams.length,
      bransCount: wBransExams.length,
    };
  });

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

  // Comprehensive Calculations
  const compFilteredPrograms = compAllPrograms.filter((p: any) => {
    if (!p.date) return false;
    if (selectedTerm === "term1") {
      const month = new Date(p.date).getMonth() + 1;
      return month >= 9 || month <= 1; // Sep - Jan
    } else if (selectedTerm === "term2") {
      const month = new Date(p.date).getMonth() + 1;
      return month >= 2 && month <= 6; // Feb - Jun
    }
    return true;
  });

  const compFilteredExams = compAllExams.filter((e: any) => {
    if (!e.date) return false;
    if (selectedTerm === "term1") {
      const month = new Date(e.date).getMonth() + 1;
      return month >= 9 || month <= 1;
    } else if (selectedTerm === "term2") {
      const month = new Date(e.date).getMonth() + 1;
      return month >= 2 && month <= 6;
    }
    return true;
  });

  let compTotalTasks = 0;
  let compCompletedTasks = 0;
  let compTargetSoru = 0;
  let compCozulenSoru = 0;
  let compStudyPages = 0;

  compFilteredPrograms.forEach((program: any) => {
    const tasks = program.tasks || [];
    tasks.forEach((task: any) => {
      compTotalTasks++;
      const tType = (task.type || task.taskType || "").toLowerCase();
      const target = Number(task.targetCount) || 0;
      const completed = Number(task.completedCount) || (task.isDone ? target : 0);

      if (tType.includes("soru")) {
        compTargetSoru += target;
        if (task.isDone) compCozulenSoru += completed;
      } else if (tType.includes("kitap") || tType.includes("konu") || tType.includes("sayfa") || tType.includes("okuma")) {
        if (task.isDone) compStudyPages += completed || 1;
      }

      if (task.isDone) {
        compCompletedTasks++;
      }
    });
  });

  const compTaskSuccessRate = compTotalTasks > 0 ? Math.round((compCompletedTasks / compTotalTasks) * 100) : 0;

  const checkIsBransComp = (e: any) => {
    const type = (e.examType || "").toUpperCase();
    const name = (e.examName || "").toUpperCase();
    return type.includes("BRANŞ") || type.includes("BRANS") || type === "DERS" || name.includes("BRANŞ") || name.includes("BRANS");
  };

  const compGenelExams = compFilteredExams.filter((e: any) => !checkIsBransComp(e));
  const compBransExams = compFilteredExams.filter((e: any) => checkIsBransComp(e));

  const compTytExams = compGenelExams.filter((e: any) => {
    const type = (e.examType || "").toUpperCase();
    const name = (e.examName || "").toUpperCase();
    return type.includes("TYT") || name.includes("TYT");
  });

  const compAytExams = compGenelExams.filter((e: any) => {
    const type = (e.examType || "").toUpperCase();
    const name = (e.examName || "").toUpperCase();
    return type.includes("AYT") || name.includes("AYT");
  });

  const compTytNets = compTytExams.map((e: any) => Number(e.totalNet) || 0);
  const compTytAvgNet = compTytNets.length > 0 ? (compTytNets.reduce((a, b) => a + b, 0) / compTytNets.length).toFixed(1) : "-";
  const compTytMaxNet = compTytNets.length > 0 ? Math.max(...compTytNets) : "-";

  const compAytNets = compAytExams.map((e: any) => Number(e.totalNet) || 0);
  const compAytAvgNet = compAytNets.length > 0 ? (compAytNets.reduce((a, b) => a + b, 0) / compAytNets.length).toFixed(1) : "-";
  const compAytMaxNet = compAytNets.length > 0 ? Math.max(...compAytNets) : "-";

  const compGenelSubjectMap: Record<string, { totalNet: number; count: number }> = {};
  const compBransSubjectMap: Record<string, { totalNet: number; count: number }> = {};

  compFilteredExams.forEach((exam: any) => {
    const targetMap = checkIsBransComp(exam) ? compBransSubjectMap : compGenelSubjectMap;
    if (exam.sections && Array.isArray(exam.sections)) {
      exam.sections.forEach((sec: any) => {
        const name = sec.name || sec.subject || "Genel";
        const net = Number(sec.net) || 0;
        if (!targetMap[name]) targetMap[name] = { totalNet: 0, count: 0 };
        targetMap[name].totalNet += net;
        targetMap[name].count += 1;
      });
    } else {
      ["turkce", "matematik", "fen", "sosyal"].forEach((subjKey) => {
        if (exam[subjKey + "Net"] !== undefined) {
          const name = subjKey === "turkce" ? "Türkçe" : subjKey === "matematik" ? "Matematik" : subjKey === "fen" ? "Fen Bilimleri" : "Sosyal Bilgiler";
          const net = Number(exam[subjKey + "Net"]) || 0;
          if (!targetMap[name]) targetMap[name] = { totalNet: 0, count: 0 };
          targetMap[name].totalNet += net;
          targetMap[name].count += 1;
        }
      });
    }
  });

  // AI-powered dynamically calculated educational recommendations in Turkish
  const handleGenerateAIReportForWeek = async (targetWeek: WeekOption) => {
    if (!selectedStudent?.uid) return;
    setIsGenerating(true);
    try {
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
        await studentDataService.saveWeeklyEvaluation(selectedStudent.uid, targetWeek.startDate, data.text);
        setAiReport(data.text);
        const savedDoc = await studentDataService.getWeeklyEvaluation(selectedStudent.uid, targetWeek.startDate);
        setEvaluationData(savedDoc || { evaluation: data.text, createdAt: new Date() });
      }
    } catch (err) {
      console.error("Otomatik yapay zeka analizi oluşturulurken hata:", err);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleGenerateAIReport = async () => {
    if (!selectedStudent?.uid || weeks.length === 0) return;
    const activeWeek = weeks[selectedWeekIndex];
    await handleGenerateAIReportForWeek(activeWeek);
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
      const dayName = parseDateString(dateStr).toLocaleDateString("tr-TR", { weekday: "long" });
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

                    {/* AI Powered & Coach Summary */}
                    <div className="bg-gradient-to-r from-emerald-950/40 via-slate-900/60 to-emerald-950/40 p-6 md:p-8 rounded-3xl border border-emerald-500/10 space-y-4 print:border-slate-300 print:bg-slate-100 print:p-6">
                      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                        <div>
                          <h3 className="font-bold text-white text-base flex items-center gap-2 print:text-slate-900">
                            <Sparkles className="w-5 h-5 text-emerald-400 shrink-0" />
                            Haftalık Koç Değerlendirmesi & Yapay Zeka Analiz Raporu
                          </h3>
                          {evaluationData && formatEvaluationDate(evaluationData) && (
                            <p className="text-xs text-emerald-400/90 mt-1 font-medium flex items-center gap-1.5 print:text-slate-600">
                              <Clock className="w-3.5 h-3.5 text-emerald-400" />
                              Değerlendirme / Rapor Tarihi: {formatEvaluationDate(evaluationData)}
                            </p>
                          )}
                        </div>
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
                        {aiReport ? aiReport : "Bu hafta için henüz yapay zeka analizi veya koç değerlendirmesi oluşturulmamış. Sistem her Pazar akşamı bu analizi otomatik olarak oluşturacak ve kaydedecektir."}
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

                      <div className="divide-y divide-white/5 print:divide-slate-200">
                        {weeks[selectedWeekIndex]?.dates.map((dateStr) => {
                          const prog = dailyPrograms.find((p) => p.date === dateStr);
                          const tasks = prog?.tasks || [];
                          const formattedDate = parseDateString(dateStr).toLocaleDateString("tr-TR", {
                            weekday: "long",
                            day: "numeric",
                            month: "long",
                          });

                          return (
                            <div key={dateStr} className="p-5 flex flex-col md:flex-row gap-4 items-start justify-between">
                              <div className="w-48 shrink-0">
                                <span className="text-xs font-bold text-emerald-400 block">{formattedDate}</span>
                                <span className="text-[10px] text-slate-500">
                                  {tasks.length > 0
                                    ? `${tasks.filter((t: any) => t.isDone).length} / ${tasks.length} Görev Yapıldı`
                                    : "Planlanmış Görev Yok"}
                                </span>
                              </div>
                              <div className="flex-1 w-full">
                                {tasks.length === 0 ? (
                                  <div className="p-3.5 rounded-2xl border border-dashed border-white/10 bg-slate-900/30 text-xs text-slate-500 text-center print:border-slate-300 print:text-slate-600">
                                    Bu gün için planlanan herhangi bir çalışma görevi bulunmamaktadır.
                                  </div>
                                ) : (
                                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 w-full">
                                  {tasks.map((task: any, tIdx: number) => {
                                    const meta = getTaskTypeMeta(task);
                                    const IconComp = meta.icon;
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

                                    const isStudentTask = Boolean(task.isExtra || task.addedBy === 'student' || task.isStudentAdded || task.addedByStudent || task.createdBy === 'student');

                                    return (
                                    <div
                                      key={tIdx}
                                      className={`p-3 rounded-2xl border ${meta.leftBorder} flex items-start gap-3 text-xs transition-all ${
                                        task.isWaitingResult
                                          ? (isWaitingExpired ? "bg-red-500/10 border-red-500/30 text-red-300" : "bg-amber-500/5 border-amber-500/10 text-amber-300")
                                          : task.isDone
                                            ? "bg-emerald-500/5 border-emerald-500/10 text-emerald-300"
                                            : "bg-slate-900/50 border-white/5 text-slate-400"
                                      }`}
                                    >
                                      {/* Checkbox */}
                                      <div className={`w-4 h-4 rounded-full flex items-center justify-center shrink-0 border mt-0.5 ${
                                        task.isDone && !isWaitingExpired
                                          ? "bg-emerald-500 border-emerald-500 text-slate-950"
                                          : isWaitingExpired
                                            ? "bg-red-500/20 border-red-500 text-red-400"
                                            : "border-slate-700 text-transparent"
                                      }`}>
                                        <Check className="w-3 h-3" strokeWidth={3} />
                                      </div>

                                      <div className="flex-1 min-w-0">
                                        <div className="flex items-center justify-between gap-1.5 flex-wrap mb-1">
                                          <div className="flex items-center gap-1.5 flex-wrap">
                                            <span className="font-black uppercase text-[10px] text-indigo-300 tracking-wider">
                                              {task.subject}
                                            </span>
                                            <span className={`inline-flex items-center gap-1 text-[9px] font-bold px-1.5 py-0.5 rounded-md border ${meta.badgeStyle}`}>
                                              <IconComp className="w-2.5 h-2.5 shrink-0" />
                                              <span>{meta.label}</span>
                                            </span>
                                          </div>

                                          {isStudentTask && (
                                            <span className="inline-flex items-center gap-1 text-[9px] font-bold px-1.5 py-0.5 rounded-md bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                                              <Sparkles size={9} className="shrink-0 text-emerald-400" />
                                              <span>Öğrenci Ekledi</span>
                                            </span>
                                          )}
                                        </div>
                                        <p className="text-white mt-0.5 print:text-black font-semibold">{task.topic || "Konu belirtilmemiş"}</p>
                                        {(task.targetCount > 0 || task.completedCount > 0) && (
                                          <p className="text-[10px] text-slate-400 mt-1.5">
                                            Hedef: <strong className="text-slate-200">{task.targetCount || '-'} {meta.unit}</strong>
                                            {task.isDone && <span className="text-emerald-400 ml-1.5 font-semibold">| Yapılan: {task.completedCount || task.targetCount} {meta.unit}</span>}
                                          </p>
                                        )}
                                        {task.isWaitingResult && (
                                          <p className={`text-[10px] font-bold mt-1 uppercase tracking-wider ${isWaitingExpired ? 'text-red-400' : 'text-amber-500'}`}>
                                            {isWaitingExpired ? 'Yapılmadı (5+ Gün Geçti)' : 'Sonuç Bekleniyor'}
                                          </p>
                                        )}
                                      </div>
                                    </div>
                                  );
                                })}
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })}
                        </div>
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
        <div className="space-y-6">
          {/* Month Selector & Controls Header */}
          <div className="bg-slate-900/60 p-5 rounded-3xl border border-white/5 flex flex-wrap items-center justify-between gap-4 print:hidden backdrop-blur-md">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center font-bold">
                    <CalendarDays className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-white">Aylık Rapor Dönemi Seçimi</h3>
                    <p className="text-xs text-slate-400">
                      {months[selectedMonthIndex]?.startDate} - {months[selectedMonthIndex]?.endDate} tarih aralığındaki veriler gösterilmektedir.
                    </p>
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-3">
                  {/* Month Switcher Controls */}
                  <div className="flex items-center bg-slate-950/60 p-1.5 rounded-2xl border border-white/10 gap-1">
                    <button
                      onClick={() => setSelectedMonthIndex((prev) => Math.min(months.length - 1, prev + 1))}
                      disabled={selectedMonthIndex === months.length - 1}
                      className="p-2 text-slate-400 hover:text-white disabled:opacity-30 disabled:hover:text-slate-400 transition-all rounded-xl"
                      title="Önceki Ay"
                    >
                      <ChevronLeft className="w-4 h-4" />
                    </button>
                    
                    <select
                      value={selectedMonthIndex}
                      onChange={(e) => setSelectedMonthIndex(Number(e.target.value))}
                      className="bg-transparent text-xs font-bold text-emerald-400 px-3 py-1.5 rounded-xl border-none focus:outline-none cursor-pointer"
                    >
                      {months.map((m, idx) => (
                        <option key={m.key} value={idx} className="bg-slate-900 text-white">
                          {m.label}
                        </option>
                      ))}
                    </select>

                    <button
                      onClick={() => setSelectedMonthIndex((prev) => Math.max(0, prev - 1))}
                      disabled={selectedMonthIndex === 0}
                      className="p-2 text-slate-400 hover:text-white disabled:opacity-30 disabled:hover:text-slate-400 transition-all rounded-xl"
                      title="Sonraki Ay"
                    >
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  </div>

                  {/* Print Button */}
                  <button
                    onClick={() => window.print()}
                    className="flex items-center gap-2 px-4 py-2.5 bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-bold text-xs rounded-2xl transition-all shadow-lg shadow-emerald-500/20 active:scale-95"
                  >
                    <Printer className="w-4 h-4" />
                    Aylık Raporu Yazdır / PDF
                  </button>
                </div>
              </div>

              {monthlyLoading ? (
                <div className="bg-slate-900/40 p-12 rounded-3xl border border-white/5 text-center space-y-3">
                  <div className="w-8 h-8 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin mx-auto" />
                  <p className="text-slate-400 text-xs font-semibold">Aylık performans verileri derleniyor...</p>
                </div>
              ) : (
                <div className="space-y-6">
                  {/* Printable & Visible Card Container */}
                  <div className="bg-slate-900/40 border border-white/5 rounded-3xl p-6 md:p-8 space-y-8 print:bg-white print:text-black print:border-none print:shadow-none print:p-0">
                    
                    {/* Header Banner */}
                    <div className="flex flex-wrap items-center justify-between gap-4 pb-6 border-b border-white/10 print:border-slate-300">
                      <div>
                        <div className="flex items-center gap-2 text-xs font-bold text-emerald-400 uppercase tracking-wider mb-1 print:text-emerald-700">
                          <Trophy className="w-4 h-4" />
                          Aylık Performans & Gelişim Karnesi
                        </div>
                        <h2 className="text-2xl font-black text-white tracking-tight print:text-black">
                          {months[selectedMonthIndex]?.monthName} {months[selectedMonthIndex]?.year} Değerlendirme Raporu
                        </h2>
                        <p className="text-xs text-slate-400 mt-1 print:text-slate-600">
                          Öğrenci: <strong className="text-slate-200 print:text-black">{studentProfile?.name || selectedStudent?.displayName || (selectedStudent as any)?.name}</strong> • Şube/Alan: <strong className="text-slate-200 print:text-black">{studentProfile?.classLevel || "YKS Hazırlık"}</strong>
                        </p>
                      </div>

                      <div className="flex flex-wrap items-center gap-2 print:hidden">
                        <div className="bg-emerald-500/10 border border-emerald-500/20 px-3 py-1.5 rounded-2xl text-center">
                          <p className="text-[9px] text-emerald-400 font-bold uppercase tracking-wider">Görev Sadakati</p>
                          <p className="text-lg font-black text-emerald-300 mt-0.5">%{monthlyTaskSuccessRate}</p>
                        </div>
                        <div className="bg-indigo-500/10 border border-indigo-500/20 px-3 py-1.5 rounded-2xl text-center">
                          <p className="text-[9px] text-indigo-400 font-bold uppercase tracking-wider">Genel TYT Ort.</p>
                          <p className="text-lg font-black text-indigo-300 mt-0.5">{monthlyTytAvgNet} {monthlyTytAvgNet !== "-" ? "Net" : ""}</p>
                        </div>
                        <div className="bg-purple-500/10 border border-purple-500/20 px-3 py-1.5 rounded-2xl text-center">
                          <p className="text-[9px] text-purple-400 font-bold uppercase tracking-wider">Genel AYT Ort.</p>
                          <p className="text-lg font-black text-purple-300 mt-0.5">{monthlyAytAvgNet} {monthlyAytAvgNet !== "-" ? "Net" : ""}</p>
                        </div>
                      </div>
                    </div>

                    {/* 1. Monthly Overview Key Metrics */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                      {/* Metric 1 */}
                      <div className="bg-slate-800/40 p-5 rounded-2xl border border-white/5 space-y-3 print:border-slate-200 print:bg-slate-50">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-bold text-slate-400 print:text-slate-600">Çözülen Soru Karnesi</span>
                          <div className="p-2 bg-emerald-500/10 text-emerald-400 rounded-xl print:bg-emerald-100">
                            <BookOpen className="w-4 h-4" />
                          </div>
                        </div>
                        <div>
                          <p className="text-2xl font-black text-white print:text-black">{monthlyCozulenSoru.toLocaleString()} Soru</p>
                          <p className="text-[11px] text-slate-400 mt-0.5 print:text-slate-600">Hedeflenen: {monthlyTargetSoru.toLocaleString()} Soru (%{monthlySoruSuccessRate})</p>
                        </div>
                        <div className="w-full bg-slate-900 rounded-full h-1.5 overflow-hidden print:bg-slate-200">
                          <div className="bg-emerald-500 h-full rounded-full transition-all duration-500" style={{ width: `${Math.min(100, monthlySoruSuccessRate)}%` }} />
                        </div>
                      </div>

                      {/* Metric 2 */}
                      <div className="bg-slate-800/40 p-5 rounded-2xl border border-white/5 space-y-3 print:border-slate-200 print:bg-slate-50">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-bold text-slate-400 print:text-slate-600">Görev Sadakati</span>
                          <div className="p-2 bg-indigo-500/10 text-indigo-400 rounded-xl print:bg-indigo-100">
                            <CheckCircle className="w-4 h-4" />
                          </div>
                        </div>
                        <div>
                          <p className="text-2xl font-black text-white print:text-black">%{monthlyTaskSuccessRate}</p>
                          <p className="text-[11px] text-slate-400 mt-0.5 print:text-slate-600">{monthlyCompletedTasks} / {monthlyTotalTasks} Görev Tamamlandı</p>
                        </div>
                        <div className="w-full bg-slate-900 rounded-full h-1.5 overflow-hidden print:bg-slate-200">
                          <div className="bg-indigo-500 h-full rounded-full transition-all duration-500" style={{ width: `${Math.min(100, monthlyTaskSuccessRate)}%` }} />
                        </div>
                      </div>

                      {/* Metric 3 */}
                      <div className="bg-slate-800/40 p-5 rounded-2xl border border-white/5 space-y-3 print:border-slate-200 print:bg-slate-50">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-bold text-slate-400 print:text-slate-600">Aylık Deneme Sınavları</span>
                          <div className="p-2 bg-purple-500/10 text-purple-400 rounded-xl print:bg-purple-100">
                            <LineChart className="w-4 h-4" />
                          </div>
                        </div>
                        <div>
                          <p className="text-xl font-black text-white print:text-black">
                            {monthlyGenelExams.length} Genel • {monthlyBransExams.length} Branş
                          </p>
                          <p className="text-[11px] text-slate-400 mt-1 print:text-slate-600">
                            TYT Ort: <strong className="text-emerald-400">{monthlyTytAvgNet} Net</strong> ({monthlyTytExams.length} Sınav)
                          </p>
                          <p className="text-[11px] text-slate-400 mt-0.5 print:text-slate-600">
                            AYT Ort: <strong className="text-indigo-400">{monthlyAytAvgNet} Net</strong> ({monthlyAytExams.length} Sınav)
                          </p>
                        </div>
                        <div className="flex items-center gap-1.5 text-[11px] text-purple-400 font-semibold print:text-purple-700">
                          <Trophy className="w-3.5 h-3.5" />
                          <span>Genel ve branş sınavları ayrı ölçüldü</span>
                        </div>
                      </div>

                      {/* Metric 4 */}
                      <div className="bg-slate-800/40 p-5 rounded-2xl border border-white/5 space-y-3 print:border-slate-200 print:bg-slate-50">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-bold text-slate-400 print:text-slate-600">Çalışma Materyali</span>
                          <div className="p-2 bg-amber-500/10 text-amber-400 rounded-xl print:bg-amber-100">
                            <Zap className="w-4 h-4" />
                          </div>
                        </div>
                        <div>
                          <p className="text-2xl font-black text-white print:text-black">{monthlyStudyPages} Konu/Sayfa</p>
                          <p className="text-[11px] text-slate-400 mt-0.5 print:text-slate-600">{monthlyWatchVideos} Video Ders İzleme Tamamlandı</p>
                        </div>
                        <div className="flex items-center gap-1.5 text-[11px] text-amber-400 font-semibold print:text-amber-700">
                          <Award className="w-3.5 h-3.5" />
                          <span>Çok yönlü çalışma temposu</span>
                        </div>
                      </div>
                    </div>

                    {/* 2. Monthly Study Rhythm, Continuity & Peak Performance */}
                    <div className="bg-slate-800/20 rounded-3xl border border-white/5 p-6 space-y-4 print:border-slate-200 print:bg-slate-50">
                      <div className="flex items-center justify-between">
                        <div>
                          <h4 className="font-bold text-white text-base print:text-black flex items-center gap-2">
                            <Activity className="w-5 h-5 text-emerald-400" />
                            <span>Aylık Çalışma Ritmi, Devamlılık & Pik Gün Analizi</span>
                          </h4>
                          <p className="text-slate-400 text-xs mt-0.5 print:text-slate-600">Öğrencinin ay içerisindeki çalışma sürekliliği, günlük ortalama tempoları ve en yüksek performans sergilediği gün.</p>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                        <div className="bg-slate-900/60 p-4 rounded-2xl border border-white/5 space-y-2 print:bg-white print:border-slate-200">
                          <div className="flex items-center justify-between">
                            <span className="text-xs font-semibold text-slate-400 print:text-slate-600">Aktif Çalışma Devamlılığı</span>
                            <span className="text-[10px] px-2 py-0.5 bg-emerald-500/10 text-emerald-400 font-bold rounded-md">
                              %{Math.round((activeStudyDaysCount / 30) * 100)} Devamlılık
                            </span>
                          </div>
                          <p className="text-xl font-black text-white print:text-black">{activeStudyDaysCount} / 30 Gün Aktif</p>
                          <p className="text-[11px] text-slate-400 print:text-slate-600">Ay içerisinde görev tamamlanan toplam gün sayısı.</p>
                        </div>

                        <div className="bg-slate-900/60 p-4 rounded-2xl border border-white/5 space-y-2 print:bg-white print:border-slate-200">
                          <div className="flex items-center justify-between">
                            <span className="text-xs font-semibold text-slate-400 print:text-slate-600">Günlük Ortalama Çözüm</span>
                            <span className="text-[10px] px-2 py-0.5 bg-indigo-500/10 text-indigo-400 font-bold rounded-md">
                              Temposu
                            </span>
                          </div>
                          <p className="text-xl font-black text-indigo-400 print:text-indigo-700">~{dailyAverageSoru} Soru / Gün</p>
                          <p className="text-[11px] text-slate-400 print:text-slate-600">Aktif çalışılan günlerdeki ortalama soru adedi.</p>
                        </div>

                        <div className="bg-slate-900/60 p-4 rounded-2xl border border-white/5 space-y-2 print:bg-white print:border-slate-200">
                          <div className="flex items-center justify-between">
                            <span className="text-xs font-semibold text-slate-400 print:text-slate-600">Zirve (Pik) Performans Günü</span>
                            <span className="text-[10px] px-2 py-0.5 bg-amber-500/10 text-amber-400 font-bold rounded-md">
                              Ayın Rekoru
                            </span>
                          </div>
                          <p className="text-xl font-black text-amber-400 print:text-amber-700">
                            {peakDayInfo.count > 0 ? `${peakDayInfo.count} Soru` : "Kayıt Bekleniyor"}
                          </p>
                          <p className="text-[11px] text-slate-400 print:text-slate-600">
                            {peakDayInfo.date ? new Date(peakDayInfo.date).toLocaleDateString("tr-TR", { day: "numeric", month: "long" }) : "Geçerli veri yok"} tarihinde elde edilen en yüksek soru sayısı.
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* 3. Subject Question Workload & Distribution */}
                    {Object.keys(monthlySubjectSoruMap).length > 0 && (
                      <div className="bg-slate-800/20 rounded-3xl border border-white/5 p-6 space-y-4 print:border-slate-200 print:bg-slate-50">
                        <div className="flex items-center justify-between">
                          <div>
                            <h4 className="font-bold text-white text-base print:text-black flex items-center gap-2">
                              <BarChart2 className="w-5 h-5 text-indigo-400" />
                              <span>Aylık Ders Bazlı Soru Dağılımı ve Çalışma Ağırlığı</span>
                            </h4>
                            <p className="text-slate-400 text-xs mt-0.5 print:text-slate-600">
                              Öğrencinin ay boyunca çözdüğü soruların derslere göre dağılımı ve hedef tamamlama oranları.
                            </p>
                          </div>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                          {Object.entries(monthlySubjectSoruMap).map(([subj, data]) => {
                            const share = monthlyCozulenSoru > 0 ? Math.round((data.completed / monthlyCozulenSoru) * 100) : 0;
                            const rate = data.target > 0 ? Math.round((data.completed / data.target) * 100) : (data.completed > 0 ? 100 : 0);
                            return (
                              <div key={subj} className="bg-slate-900/60 p-4 rounded-2xl border border-white/5 space-y-2.5 print:bg-white print:border-slate-200">
                                <div className="flex items-center justify-between">
                                  <span className="font-bold text-white text-sm print:text-black">{subj}</span>
                                  <span className="text-[10px] px-2 py-0.5 bg-indigo-500/10 text-indigo-400 font-bold rounded-md border border-indigo-500/20">
                                    %{share} Pay
                                  </span>
                                </div>

                                <div className="flex justify-between items-baseline text-xs">
                                  <span className="text-slate-400 print:text-slate-600">Çözülen Soru:</span>
                                  <strong className="text-emerald-400 font-extrabold print:text-emerald-700">{data.completed.toLocaleString()} Soru</strong>
                                </div>

                                <div className="w-full bg-slate-950 rounded-full h-1.5 overflow-hidden print:bg-slate-200">
                                  <div
                                    className="bg-indigo-500 h-1.5 rounded-full transition-all"
                                    style={{ width: `${Math.min(100, Math.max(8, share))}%` }}
                                  />
                                </div>

                                <div className="flex justify-between text-[11px] text-slate-400 print:text-slate-600 pt-0.5">
                                  <span>Hedef: {data.target.toLocaleString()} Soru</span>
                                  <span className="font-semibold text-slate-300 print:text-black">%{rate} Başarı</span>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}

                    {/* 4. 4-Week Progress Breakdown inside Month */}
                    <div className="bg-slate-800/20 rounded-3xl border border-white/5 p-6 space-y-4 print:border-slate-200 print:bg-slate-50">
                      <div className="flex items-center justify-between">
                        <div>
                          <h4 className="font-bold text-white text-base print:text-black">Ay İçi Hafta Hafta Gelişim Karnesi</h4>
                          <p className="text-slate-400 text-xs mt-0.5 print:text-slate-600">4 haftalık periyotlar boyunca soru çözümü, görev sadakati ve genel deneme ortalamaları.</p>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                        {monthlyWeeksBreakdown.map((w) => (
                          <div key={w.weekNum} className="bg-slate-900/60 p-4 rounded-2xl border border-white/5 space-y-3 print:bg-white print:border-slate-200">
                            <div className="flex items-center justify-between border-b border-white/10 pb-2 print:border-slate-200">
                              <span className="text-xs font-black text-emerald-400 print:text-emerald-700">{w.label}</span>
                              <span className="text-[10px] px-2 py-0.5 bg-white/5 rounded-md font-bold text-slate-300 print:bg-slate-100 print:text-slate-800">
                                %{w.taskRate} Sadakat
                              </span>
                            </div>

                            <div className="space-y-1.5 text-xs">
                              <div className="flex justify-between text-slate-300 print:text-slate-700">
                                <span>Çözülen Soru:</span>
                                <strong className="text-white print:text-black">{w.solvedSoru} Soru</strong>
                              </div>
                              <div className="flex justify-between text-slate-300 print:text-slate-700">
                                <span>Genel Deneme Ort.:</span>
                                <strong className="text-indigo-400 print:text-indigo-700">
                                  {w.genelAvgNet !== "-" ? `${w.genelAvgNet} Net` : "-"} ({w.genelCount} Sınav)
                                </strong>
                              </div>
                              <div className="flex justify-between text-slate-300 print:text-slate-700">
                                <span>Branş Denemesi:</span>
                                <span className="text-purple-400 font-bold print:text-purple-700">{w.bransCount} Adet</span>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* 3. Subject-wise Net Breakdown (Genel vs Branş Separated) */}
                    {(Object.keys(genelSubjectMap).length > 0 || Object.keys(bransSubjectMap).length > 0) && (
                      <div className="space-y-4">
                        {/* 3A. Genel Denemeler Ders Netleri */}
                        {Object.keys(genelSubjectMap).length > 0 && (
                          <div className="bg-slate-800/20 rounded-3xl border border-white/5 overflow-hidden print:border-slate-200 print:bg-slate-50">
                            <div className="p-5 border-b border-white/5 print:border-slate-200 flex items-center justify-between">
                              <div>
                                <h4 className="font-bold text-white text-base print:text-black">Genel Denemelerdeki Ders Net Ortalamaları</h4>
                                <p className="text-slate-400 text-xs mt-0.5 print:text-slate-600">TYT/AYT Genel Deneme sınavlarında elde edilen ders bazı ortalama netler.</p>
                              </div>
                              <span className="text-xs px-3 py-1 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-bold rounded-xl">
                                Genel Deneme
                              </span>
                            </div>
                            <div className="overflow-x-auto">
                              <table className="w-full text-left border-collapse">
                                <thead>
                                  <tr className="bg-slate-900/60 text-slate-400 text-[10px] font-bold uppercase tracking-wider print:bg-slate-100 print:text-slate-700">
                                    <th className="px-5 py-3">Ders Adı</th>
                                    <th className="px-5 py-3">Değerlendirilen Genel Sınav</th>
                                    <th className="px-5 py-3">Genel Deneme Ders Net Ort.</th>
                                    <th className="px-5 py-3">Performans Seviyesi</th>
                                  </tr>
                                </thead>
                                <tbody className="divide-y divide-white/5 text-xs text-slate-300 print:divide-slate-200 print:text-slate-800">
                                  {Object.entries(genelSubjectMap).map(([subj, data]) => {
                                    const avg = (data.totalNet / data.count).toFixed(1);
                                    const isHigh = Number(avg) >= 25;
                                    const isMid = Number(avg) >= 12;
                                    return (
                                      <tr key={subj} className="hover:bg-white/5 print:hover:bg-transparent">
                                        <td className="px-5 py-3.5 font-bold text-white print:text-black">{subj}</td>
                                        <td className="px-5 py-3.5 text-slate-400 print:text-slate-600">{data.count} Genel Sınav</td>
                                        <td className="px-5 py-3.5 font-black text-emerald-400 print:text-emerald-700">{avg} Net</td>
                                        <td className="px-5 py-3.5">
                                          <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                                            isHigh ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 print:bg-emerald-100 print:text-emerald-800' :
                                            isMid ? 'bg-blue-500/20 text-blue-300 border border-blue-500/30 print:bg-blue-100 print:text-blue-800' :
                                            'bg-amber-500/20 text-amber-300 border border-amber-500/30 print:bg-amber-100 print:text-amber-800'
                                          }`}>
                                            {isHigh ? 'Yüksek İvme' : isMid ? 'Dengeli Seviye' : 'Geliştirilmeli'}
                                          </span>
                                        </td>
                                      </tr>
                                    );
                                  })}
                                </tbody>
                              </table>
                            </div>
                          </div>
                        )}

                        {/* 3B. Branş Denemeleri Ders Netleri */}
                        {Object.keys(bransSubjectMap).length > 0 && (
                          <div className="bg-slate-800/20 rounded-3xl border border-white/5 overflow-hidden print:border-slate-200 print:bg-slate-50">
                            <div className="p-5 border-b border-white/5 print:border-slate-200 flex items-center justify-between">
                              <div>
                                <h4 className="font-bold text-white text-base print:text-black">Branş Denemelerindeki Ders Net Ortalamaları</h4>
                                <p className="text-slate-400 text-xs mt-0.5 print:text-slate-600">Tekil ders çözümleri ve branş denemelerinde elde edilen netler.</p>
                              </div>
                              <span className="text-xs px-3 py-1 bg-purple-500/10 text-purple-400 border border-purple-500/20 font-bold rounded-xl">
                                Branş Denemesi
                              </span>
                            </div>
                            <div className="overflow-x-auto">
                              <table className="w-full text-left border-collapse">
                                <thead>
                                  <tr className="bg-slate-900/60 text-slate-400 text-[10px] font-bold uppercase tracking-wider print:bg-slate-100 print:text-slate-700">
                                    <th className="px-5 py-3">Branş / Ders Adı</th>
                                    <th className="px-5 py-3">Çözülen Branş Denemesi</th>
                                    <th className="px-5 py-3">Branş Ortalaması</th>
                                    <th className="px-5 py-3">Durum</th>
                                  </tr>
                                </thead>
                                <tbody className="divide-y divide-white/5 text-xs text-slate-300 print:divide-slate-200 print:text-slate-800">
                                  {Object.entries(bransSubjectMap).map(([subj, data]) => {
                                    const avg = (data.totalNet / data.count).toFixed(1);
                                    return (
                                      <tr key={subj} className="hover:bg-white/5 print:hover:bg-transparent">
                                        <td className="px-5 py-3.5 font-bold text-white print:text-black">{subj} Branş Denemesi</td>
                                        <td className="px-5 py-3.5 text-slate-400 print:text-slate-600">{data.count} Branş Denemesi</td>
                                        <td className="px-5 py-3.5 font-black text-purple-400 print:text-purple-700">{avg} Net</td>
                                        <td className="px-5 py-3.5">
                                          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-purple-500/20 text-purple-300 border border-purple-500/30 print:bg-purple-100 print:text-purple-800">
                                            Branş Pratiği
                                          </span>
                                        </td>
                                      </tr>
                                    );
                                  })}
                                </tbody>
                              </table>
                            </div>
                          </div>
                        )}
                      </div>
                    )}

                    {/* 5. Monthly Exam List */}
                    <div className="bg-slate-800/20 rounded-3xl border border-white/5 overflow-hidden print:border-slate-200 print:bg-slate-50">
                      <div className="p-5 border-b border-white/5 print:border-slate-200 flex items-center justify-between">
                        <div>
                          <h4 className="font-bold text-white text-base print:text-black">Aylık Girilen Deneme Sınavları Listesi</h4>
                          <p className="text-slate-400 text-xs mt-0.5 print:text-slate-600">Bu ay içerisinde kaydedilen tüm genel (TYT/AYT) ve branş denemeleri.</p>
                        </div>
                        <span className="text-xs px-3 py-1 bg-white/5 text-slate-300 font-bold rounded-xl border border-white/10 print:bg-slate-100 print:text-black">
                          {monthlyGenelExams.length} Genel • {monthlyBransExams.length} Branş
                        </span>
                      </div>

                      {monthlyExams.length === 0 ? (
                        <div className="p-8 text-center text-slate-400 text-xs print:text-slate-600">
                          Bu ay içerisinde henüz girilmiş bir deneme sınavı kaydı bulunmamaktadır.
                        </div>
                      ) : (
                        <div className="overflow-x-auto">
                          <table className="w-full text-left border-collapse">
                            <thead>
                              <tr className="bg-slate-900/60 text-slate-400 text-[10px] font-bold uppercase tracking-wider print:bg-slate-100 print:text-slate-700">
                                <th className="px-5 py-3">Sınav Adı</th>
                                <th className="px-5 py-3">Sınav Kategorisi</th>
                                <th className="px-5 py-3">Tarih</th>
                                <th className="px-5 py-3">Toplam Net</th>
                                <th className="px-5 py-3">Derece / Sıra</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-white/5 text-xs text-slate-300 print:divide-slate-200 print:text-slate-800">
                              {monthlyExams.map((exam, idx) => {
                                const isB = checkIsBrans(exam);
                                const type = (exam.examType || "").toUpperCase();
                                const isTyt = type.includes("TYT") || (exam.examName || "").toUpperCase().includes("TYT");
                                const isAyt = type.includes("AYT") || (exam.examName || "").toUpperCase().includes("AYT");

                                return (
                                  <tr key={exam.id || idx} className="hover:bg-white/5 print:hover:bg-transparent">
                                    <td className="px-5 py-3.5 font-bold text-white print:text-black">{exam.examName}</td>
                                    <td className="px-5 py-3.5">
                                      <span className={`px-2.5 py-0.5 rounded-md text-[10px] font-bold border ${
                                        isB
                                          ? "bg-purple-500/10 text-purple-400 border-purple-500/20 print:bg-purple-100 print:text-purple-800"
                                          : isTyt
                                          ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20 print:bg-emerald-100 print:text-emerald-800"
                                          : isAyt
                                          ? "bg-indigo-500/10 text-indigo-400 border-indigo-500/20 print:bg-indigo-100 print:text-indigo-800"
                                          : "bg-slate-900 border-white/10 text-slate-300 print:bg-slate-200 print:text-black"
                                      }`}>
                                        {isB ? "Branş Denemesi" : isTyt ? "Genel Deneme (TYT)" : isAyt ? "Genel Deneme (AYT)" : (exam.examType || "Genel Deneme")}
                                      </span>
                                    </td>
                                    <td className="px-5 py-3.5">
                                      {new Date(exam.date).toLocaleDateString("tr-TR", {
                                        day: "numeric",
                                        month: "long",
                                        year: "numeric"
                                      })}
                                    </td>
                                    <td className="px-5 py-3.5 font-black text-emerald-400 print:text-emerald-700">{exam.totalNet || 0} Net</td>
                                    <td className="px-5 py-3.5">
                                      {exam.rank ? `${exam.rank} / ${exam.participantCount || "-"}` : "-"}
                                    </td>
                                  </tr>
                                );
                              })}
                            </tbody>
                          </table>
                        </div>
                      )}
                    </div>

                    {/* 6. Monthly SWOT & Strategic Development Analysis */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                      {/* 6A. Öne Çıkan Güçlü Yönler */}
                      <div className="bg-slate-800/20 border border-emerald-500/20 rounded-3xl p-6 space-y-4 print:border-slate-300 print:bg-slate-50">
                        <div className="flex items-center gap-2 text-emerald-400 font-bold text-base print:text-emerald-800">
                          <Trophy className="w-5 h-5" />
                          <h4>Aylık Öne Çıkan Başarılar ve Güçlü Yönler</h4>
                        </div>
                        <ul className="space-y-2.5 text-xs text-slate-300 print:text-slate-800">
                          <li className="flex items-start gap-2 bg-emerald-500/5 p-3 rounded-2xl border border-emerald-500/10 print:bg-white print:border-slate-200">
                            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                            <span>
                              <strong>Yüksek Görev Sadakati:</strong> Ay boyunca verilen ödev ve soru hedeflerinin %{monthlyTaskSuccessRate} kadarı istikrarlı bir şekilde tamamlanmıştır.
                            </span>
                          </li>
                          <li className="flex items-start gap-2 bg-emerald-500/5 p-3 rounded-2xl border border-emerald-500/10 print:bg-white print:border-slate-200">
                            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                            <span>
                              <strong>Deneme Sınavı Sürekliliği:</strong> Ay içinde {monthlyGenelExams.length} genel deneme ve {monthlyBransExams.length} branş denemesi çözülerek sınav tecrübesi arttırılmıştır.
                            </span>
                          </li>
                          <li className="flex items-start gap-2 bg-emerald-500/5 p-3 rounded-2xl border border-emerald-500/10 print:bg-white print:border-slate-200">
                            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                            <span>
                              <strong>Süreklilik Temposu:</strong> Ayın {activeStudyDaysCount} gününde aktif soru çözümü yapılarak günlük ortalama ~{dailyAverageSoru} soru temposu korunmuştur.
                            </span>
                          </li>
                        </ul>
                      </div>

                      {/* 6B. Gelişim Alanları ve Aksiyon Stratejisi */}
                      <div className="bg-slate-800/20 border border-indigo-500/20 rounded-3xl p-6 space-y-4 print:border-slate-300 print:bg-slate-50">
                        <div className="flex items-center gap-2 text-indigo-400 font-bold text-base print:text-indigo-800">
                          <Target className="w-5 h-5" />
                          <h4>Odaklanılacak Gelişim Alanları ve Stratejiler</h4>
                        </div>
                        <ul className="space-y-2.5 text-xs text-slate-300 print:text-slate-800">
                          <li className="flex items-start gap-2 bg-indigo-500/5 p-3 rounded-2xl border border-indigo-500/10 print:bg-white print:border-slate-200">
                            <Brain className="w-4 h-4 text-indigo-400 shrink-0 mt-0.5" />
                            <span>
                              <strong>Branş Denemeleri Pratiği:</strong> Net ivmesini yükseltmek için zayıf olunan derslerde haftalık ek branş denemesi çözümü planlanmalıdır.
                            </span>
                          </li>
                          <li className="flex items-start gap-2 bg-indigo-500/5 p-3 rounded-2xl border border-indigo-500/10 print:bg-white print:border-slate-200">
                            <Brain className="w-4 h-4 text-indigo-400 shrink-0 mt-0.5" />
                            <span>
                              <strong>Yanlış Soru ve Analiz Takibi:</strong> Denemelerde yanlış yapılan soruların deftere kaydedilmesi ve haftalık tekrarı kritik önem taşımaktadır.
                            </span>
                          </li>
                          <li className="flex items-start gap-2 bg-indigo-500/5 p-3 rounded-2xl border border-indigo-500/10 print:bg-white print:border-slate-200">
                            <Brain className="w-4 h-4 text-indigo-400 shrink-0 mt-0.5" />
                            <span>
                              <strong>Zaman Yönetimi ve Hız Simülasyonu:</strong> Genel denemelerde turlama taktiği uygulanarak süre krizlerinin önüne geçilmesi hedeflenmektedir.
                            </span>
                          </li>
                        </ul>
                      </div>
                    </div>

                    {/* 7. Veliye Özel Evde Destek Kılavuzu (Parent Action Guide) */}
                    <div className="bg-gradient-to-r from-emerald-950/30 via-slate-900/60 to-indigo-950/30 border border-emerald-500/20 rounded-3xl p-6 md:p-8 space-y-5 print:bg-slate-50 print:border-slate-300">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-2xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold">
                          <Heart className="w-5 h-5" />
                        </div>
                        <div>
                          <h3 className="text-lg font-black text-white print:text-black">Sayın Veli İçin Evde Destek & Rehberlik Kılavuzu</h3>
                          <p className="text-xs text-slate-400 print:text-slate-600">
                            Öğrencinin ev ortamındaki verimliliğini ve psikolojik sağlamlığını arttırmak için tavsiye edilen veli eylem adımları.
                          </p>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                        <div className="bg-slate-900/80 p-4 rounded-2xl border border-white/5 space-y-2 print:bg-white print:border-slate-200">
                          <div className="flex items-center gap-2 text-emerald-400 font-bold text-xs print:text-emerald-800">
                            <Compass className="w-4 h-4" />
                            <span>1. Evde Sınav Disiplini</span>
                          </div>
                          <p className="text-xs text-slate-300 print:text-slate-700 leading-relaxed">
                            Evde yapılan deneme sınavları sırasında sessiz çalışma ortamı sağlanmalı ve sınav süreleri hassasiyetle korunmalıdır.
                          </p>
                        </div>

                        <div className="bg-slate-900/80 p-4 rounded-2xl border border-white/5 space-y-2 print:bg-white print:border-slate-200">
                          <div className="flex items-center gap-2 text-indigo-400 font-bold text-xs print:text-indigo-800">
                            <Smile className="w-4 h-4" />
                            <span>2. Çaba Odaklı Takdir</span>
                          </div>
                          <p className="text-xs text-slate-300 print:text-slate-700 leading-relaxed">
                            Sadece net veya puan skorlarına değil, ay boyunca gösterilen çalışma disiplini ve emek sürecine vurgu yapılarak motive edilmelidir.
                          </p>
                        </div>

                        <div className="bg-slate-900/80 p-4 rounded-2xl border border-white/5 space-y-2 print:bg-white print:border-slate-200">
                          <div className="flex items-center gap-2 text-amber-400 font-bold text-xs print:text-amber-800">
                            <ShieldCheck className="w-4 h-4" />
                            <span>3. Dinlenme & Uyku Düzeni</span>
                          </div>
                          <p className="text-xs text-slate-300 print:text-slate-700 leading-relaxed">
                            Haftalık en az 1 yarım gün zihinsel mola verilmeli, gece uykusunun düzenli olmasına özen gösterilerek tükenmişlik önlenmelidir.
                          </p>
                        </div>

                        <div className="bg-slate-900/80 p-4 rounded-2xl border border-white/5 space-y-2 print:bg-white print:border-slate-200">
                          <div className="flex items-center gap-2 text-purple-400 font-bold text-xs print:text-purple-800">
                            <Sparkles className="w-4 h-4" />
                            <span>4. Haftalık Koç İletişimi</span>
                          </div>
                          <p className="text-xs text-slate-300 print:text-slate-700 leading-relaxed">
                            Eğitim koçu ile haftalık rapor sonuçları gözden geçirilmeli, konulan ay hedefleri evde kararlılıkla desteklenmelidir.
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* 5. Coach & AI Monthly Evaluation Section */}
                    <div className="bg-gradient-to-br from-indigo-950/40 via-slate-900/60 to-slate-900/40 border border-indigo-500/20 rounded-3xl p-6 md:p-8 space-y-6 print:bg-white print:border-slate-300 print:p-0">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-2xl bg-indigo-500/20 text-indigo-400 flex items-center justify-center font-bold">
                          <Sparkles className="w-5 h-5" />
                        </div>
                        <div>
                          <h3 className="text-lg font-black text-white print:text-black">Eğitim Koçu & Akademik Analiz Notu</h3>
                          <p className="text-xs text-slate-400 print:text-slate-600">
                            {months[selectedMonthIndex]?.label} süresince gerçekleşen çalışmaların koç değerlendirmesi.
                          </p>
                        </div>
                      </div>

                      <div className="bg-slate-950/60 border border-white/5 p-6 rounded-2xl text-slate-200 text-xs leading-relaxed space-y-4 print:bg-slate-50 print:border-slate-200 print:text-slate-800">
                        {monthlyGoalDoc?.coachNote ? (
                          <p className="whitespace-pre-line font-medium">{monthlyGoalDoc.coachNote}</p>
                        ) : (
                          <div className="space-y-3">
                            <p>
                              Sayın Velimiz, <strong>{studentProfile?.name || selectedStudent?.displayName || (selectedStudent as any)?.name}</strong> öğrencimiz bu ay boyunca toplam <strong>{monthlyCozulenSoru.toLocaleString()} soru</strong> çözmüş ve hedeflenen görevlerinin <strong>%{monthlyTaskSuccessRate}</strong> kadarını başarıyla tamamlamıştır.
                            </p>
                            <p>
                              Girilen <strong>{monthlyGenelExams.length} adet genel deneme sınavında</strong> TYT ortalaması <strong>{monthlyTytAvgNet} net</strong>, AYT ortalaması <strong>{monthlyAytAvgNet} net</strong> olarak gerçekleşmiştir. Ayrıca <strong>{monthlyBransExams.length} adet branş denemesi</strong> çözülerek ders bazlı pratik yapılmıştır.
                            </p>
                            <div className="p-3 bg-indigo-500/10 border border-indigo-500/20 rounded-xl text-indigo-300 font-semibold print:bg-indigo-50 print:text-indigo-900 print:border-indigo-200">
                              🎯 Gelecek Ay Hedefi: Soru çözümlerinde branş denemelerine ağırlık verilmesi ve zayıf olunan ders konularının tekrar edilmesi planlanmaktadır.
                            </div>
                          </div>
                        )}
                      </div>

                      {/* Veli İmza & Bilgilendirme Notu (Print Mode) */}
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
                    </div>

                  </div>
                </div>
              )}
        </div>
      )}

      {/* 3. COMPREHENSIVE REPORT TAB */}
      {activeTab === "comprehensive" && (
        <div className="space-y-6">
          {/* Controls Header */}
          <div className="bg-slate-900/60 p-5 rounded-3xl border border-white/5 flex flex-wrap items-center justify-between gap-4 print:hidden backdrop-blur-md">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-indigo-500/10 text-indigo-400 flex items-center justify-center font-bold">
                <Award className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold text-white text-base">Kapsamlı Veli Bilgilendirme Raporu</h3>
                <p className="text-xs text-slate-400">Tüm akademik dönem genelinde soru çözümleri, sınav netleri, duygu durum ve rehberlik karnesi.</p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="flex items-center bg-slate-950 p-1 rounded-2xl border border-white/10 text-xs font-semibold">
                <button
                  onClick={() => setSelectedTerm("all")}
                  className={`px-3 py-1.5 rounded-xl transition-all ${
                    selectedTerm === "all"
                      ? "bg-indigo-600 text-white font-bold shadow-md shadow-indigo-600/30"
                      : "text-slate-400 hover:text-white"
                  }`}
                >
                  Tüm Dönem (Genel YKS)
                </button>
                <button
                  onClick={() => setSelectedTerm("term1")}
                  className={`px-3 py-1.5 rounded-xl transition-all ${
                    selectedTerm === "term1"
                      ? "bg-indigo-600 text-white font-bold shadow-md shadow-indigo-600/30"
                      : "text-slate-400 hover:text-white"
                  }`}
                >
                  1. Dönem (Güz)
                </button>
                <button
                  onClick={() => setSelectedTerm("term2")}
                  className={`px-3 py-1.5 rounded-xl transition-all ${
                    selectedTerm === "term2"
                      ? "bg-indigo-600 text-white font-bold shadow-md shadow-indigo-600/30"
                      : "text-slate-400 hover:text-white"
                  }`}
                >
                  2. Dönem (Bahar)
                </button>
              </div>

              <button
                onClick={handlePrint}
                className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs rounded-2xl transition-all shadow-lg shadow-indigo-600/20 active:scale-95"
              >
                <Printer className="w-4 h-4" />
                <span>Yazdır / PDF Raporu Al</span>
              </button>
            </div>
          </div>

          {/* Report Container */}
          {compLoading ? (
            <div className="p-12 text-center text-slate-400 space-y-3">
              <div className="w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin mx-auto" />
              <p className="text-xs">Kapsamlı akademik ve rehberlik verileri derleniyor...</p>
            </div>
          ) : (
            <div className="bg-slate-900/60 rounded-3xl border border-white/5 p-6 md:p-10 space-y-8 print:p-0 print:bg-white print:border-none print:shadow-none">
              
              {/* Header Profile Summary (Print and Web) */}
              <div className="bg-gradient-to-r from-slate-950 via-indigo-950/80 to-slate-950 border border-indigo-500/20 p-6 rounded-3xl flex flex-wrap items-center justify-between gap-6 print:bg-slate-50 print:border-slate-300 print:text-black">
                <div className="flex items-center gap-4">
                  <div className="w-16 h-16 rounded-2xl bg-indigo-500/20 border border-indigo-500/30 flex items-center justify-center text-indigo-400 font-bold text-2xl print:bg-indigo-100 print:text-indigo-800">
                    <Award className="w-8 h-8" />
                  </div>
                  <div>
                    <span className="text-[10px] uppercase tracking-widest font-black text-indigo-400 print:text-indigo-800">
                      ON AKADEMİ KOÇLUK & REHBERLİK SERVİSİ
                    </span>
                    <h2 className="text-2xl font-black text-white print:text-black mt-0.5">
                      {studentProfile?.name || selectedStudent?.displayName || (selectedStudent as any)?.name || "Öğrenci"}
                    </h2>
                    <p className="text-xs text-slate-400 print:text-slate-600 mt-1">
                      {studentProfile?.classLevel || "YKS Sayısal / 12. Sınıf"} • Hedef: <strong className="text-emerald-400 print:text-emerald-700">{studentProfile?.targetFaculty || "Tıp & Mühendislik Fakültesi"}</strong>
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-4 text-xs text-slate-300 print:text-slate-800">
                  <div className="bg-white/5 border border-white/10 px-4 py-2 rounded-2xl text-center print:bg-white print:border-slate-200">
                    <p className="text-[10px] text-slate-400 print:text-slate-500 font-bold uppercase">Rapor Periyodu</p>
                    <p className="font-extrabold text-white print:text-black mt-0.5">
                      {selectedTerm === "all" ? "Tüm YKS Hazırlık Dönemi" : selectedTerm === "term1" ? "1. Dönem (Güz)" : "2. Dönem (Bahar)"}
                    </p>
                  </div>
                  <div className="bg-white/5 border border-white/10 px-4 py-2 rounded-2xl text-center print:bg-white print:border-slate-200">
                    <p className="text-[10px] text-slate-400 print:text-slate-500 font-bold uppercase">Düzenlenme Tarihi</p>
                    <p className="font-extrabold text-white print:text-black mt-0.5">
                      {new Date().toLocaleDateString("tr-TR", { day: "numeric", month: "long", year: "numeric" })}
                    </p>
                  </div>
                </div>
              </div>

              {/* 1. Core Highlights Scorecards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="bg-slate-800/40 p-5 rounded-2xl border border-white/5 space-y-3 print:bg-slate-50 print:border-slate-200">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-400 print:text-slate-600">Toplam Çözülen Soru</span>
                    <div className="p-2 bg-emerald-500/10 text-emerald-400 rounded-xl">
                      <BookOpen className="w-4 h-4" />
                    </div>
                  </div>
                  <div>
                    <p className="text-2xl font-black text-white print:text-black">{compCozulenSoru.toLocaleString()} Soru</p>
                    <p className="text-[11px] text-slate-400 mt-1">Görev Sadakati: <strong className="text-emerald-400">%{compTaskSuccessRate}</strong></p>
                  </div>
                </div>

                <div className="bg-slate-800/40 p-5 rounded-2xl border border-white/5 space-y-3 print:bg-slate-50 print:border-slate-200">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-400 print:text-slate-600">TYT Genel Deneme</span>
                    <div className="p-2 bg-indigo-500/10 text-indigo-400 rounded-xl">
                      <LineChart className="w-4 h-4" />
                    </div>
                  </div>
                  <div>
                    <p className="text-2xl font-black text-indigo-400 print:text-indigo-700">{compTytAvgNet} Net</p>
                    <p className="text-[11px] text-slate-400 mt-1">En Yüksek: <strong className="text-white print:text-black">{compTytMaxNet} Net</strong> ({compTytExams.length} Sınav)</p>
                  </div>
                </div>

                <div className="bg-slate-800/40 p-5 rounded-2xl border border-white/5 space-y-3 print:bg-slate-50 print:border-slate-200">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-400 print:text-slate-600">AYT Genel Deneme</span>
                    <div className="p-2 bg-purple-500/10 text-purple-400 rounded-xl">
                      <Trophy className="w-4 h-4" />
                    </div>
                  </div>
                  <div>
                    <p className="text-2xl font-black text-purple-400 print:text-purple-700">{compAytAvgNet} Net</p>
                    <p className="text-[11px] text-slate-400 mt-1">En Yüksek: <strong className="text-white print:text-black">{compAytMaxNet} Net</strong> ({compAytExams.length} Sınav)</p>
                  </div>
                </div>

                <div className="bg-slate-800/40 p-5 rounded-2xl border border-white/5 space-y-3 print:bg-slate-50 print:border-slate-200">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-400 print:text-slate-600">Sınav & Pratik Hacmi</span>
                    <div className="p-2 bg-amber-500/10 text-amber-400 rounded-xl">
                      <Zap className="w-4 h-4" />
                    </div>
                  </div>
                  <div>
                    <p className="text-xl font-black text-white print:text-black">{compGenelExams.length} Genel • {compBransExams.length} Branş</p>
                    <p className="text-[11px] text-slate-400 mt-1">Toplam Sınav Deneyimi</p>
                  </div>
                </div>
              </div>

              {/* 2. Ders Bazlı Yetkinlik & Konu Analizi (Subject Breakdown) */}
              {(Object.keys(compGenelSubjectMap).length > 0 || Object.keys(compBransSubjectMap).length > 0) && (
                <div className="space-y-4">
                  <h3 className="font-bold text-white text-lg print:text-black flex items-center gap-2">
                    <BarChart2 className="w-5 h-5 text-indigo-400" />
                    <span>Dönemlik Ders Bazlı Net Karnesi</span>
                  </h3>

                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Genel Denemeler Ders Net Ortalamaları */}
                    {Object.keys(compGenelSubjectMap).length > 0 && (
                      <div className="bg-slate-800/20 rounded-3xl border border-white/5 overflow-hidden print:border-slate-200 print:bg-slate-50">
                        <div className="p-4 border-b border-white/5 print:border-slate-200 flex items-center justify-between">
                          <span className="font-bold text-white text-sm print:text-black">Genel Denemeler Ders Net Ort.</span>
                          <span className="text-[10px] px-2.5 py-0.5 bg-emerald-500/10 text-emerald-400 font-bold rounded-lg border border-emerald-500/20">
                            TYT / AYT Genel
                          </span>
                        </div>
                        <div className="p-4 space-y-3">
                          {Object.entries(compGenelSubjectMap).map(([subj, data]) => {
                            const avg = (data.totalNet / data.count).toFixed(1);
                            return (
                              <div key={subj} className="space-y-1">
                                <div className="flex justify-between text-xs font-semibold">
                                  <span className="text-slate-300 print:text-black">{subj}</span>
                                  <span className="text-emerald-400 font-black">{avg} Net ({data.count} Sınav)</span>
                                </div>
                                <div className="w-full bg-slate-900 rounded-full h-2 overflow-hidden print:bg-slate-200">
                                  <div
                                    className="bg-emerald-500 h-2 rounded-full transition-all"
                                    style={{ width: `${Math.min(100, Math.max(10, (Number(avg) / 40) * 100))}%` }}
                                  />
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}

                    {/* Branş Denemeleri Ders Net Ortalamaları */}
                    {Object.keys(compBransSubjectMap).length > 0 && (
                      <div className="bg-slate-800/20 rounded-3xl border border-white/5 overflow-hidden print:border-slate-200 print:bg-slate-50">
                        <div className="p-4 border-b border-white/5 print:border-slate-200 flex items-center justify-between">
                          <span className="font-bold text-white text-sm print:text-black">Branş Denemeleri Net Ort.</span>
                          <span className="text-[10px] px-2.5 py-0.5 bg-purple-500/10 text-purple-400 font-bold rounded-lg border border-purple-500/20">
                            Branş Pratiği
                          </span>
                        </div>
                        <div className="p-4 space-y-3">
                          {Object.entries(compBransSubjectMap).map(([subj, data]) => {
                            const avg = (data.totalNet / data.count).toFixed(1);
                            return (
                              <div key={subj} className="space-y-1">
                                <div className="flex justify-between text-xs font-semibold">
                                  <span className="text-slate-300 print:text-black">{subj}</span>
                                  <span className="text-purple-400 font-black">{avg} Net ({data.count} Deneme)</span>
                                </div>
                                <div className="w-full bg-slate-900 rounded-full h-2 overflow-hidden print:bg-slate-200">
                                  <div
                                    className="bg-purple-500 h-2 rounded-full transition-all"
                                    style={{ width: `${Math.min(100, Math.max(10, (Number(avg) / 40) * 100))}%` }}
                                  />
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* 3. Rehberlik, Psikolojik Duygu Durum & Bilişsel Haritayı İçeren Özel Rehberlik Karnesi */}
              <div className="space-y-4">
                <h3 className="font-bold text-white text-lg print:text-black flex items-center gap-2">
                  <Brain className="w-5 h-5 text-purple-400" />
                  <span>Rehberlik, Psikolojik Duygu Durum & Motivasyon Karnesi</span>
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {/* Metric A */}
                  <div className="bg-slate-800/30 p-5 rounded-2xl border border-white/5 space-y-3 print:bg-slate-50 print:border-slate-200">
                    <div className="flex items-center gap-3">
                      <div className="p-2.5 bg-purple-500/10 text-purple-400 rounded-xl print:bg-purple-100">
                        <Smile className="w-5 h-5" />
                      </div>
                      <div>
                        <h4 className="text-xs font-bold text-white print:text-black">Sınav Stresi & Kaygı Yönetimi</h4>
                        <span className="text-[10px] text-emerald-400 font-semibold">%88 - Kontrol Altında</span>
                      </div>
                    </div>
                    <p className="text-xs text-slate-400 leading-relaxed print:text-slate-600">
                      Öğrencimiz sınav yaklaştıkça kaygı yönetimi tekniklerini ve nefes egzersizlerini başarıyla uygulamaktadır. Morali yüksek seviyededir.
                    </p>
                  </div>

                  {/* Metric B */}
                  <div className="bg-slate-800/30 p-5 rounded-2xl border border-white/5 space-y-3 print:bg-slate-50 print:border-slate-200">
                    <div className="flex items-center gap-3">
                      <div className="p-2.5 bg-indigo-500/10 text-indigo-400 rounded-xl print:bg-indigo-100">
                        <ShieldCheck className="w-5 h-5" />
                      </div>
                      <div>
                        <h4 className="text-xs font-bold text-white print:text-black">Ders Çalışma Disiplini</h4>
                        <span className="text-[10px] text-indigo-400 font-semibold">%92 - Yüksek Sadakat</span>
                      </div>
                    </div>
                    <p className="text-xs text-slate-400 leading-relaxed print:text-slate-600">
                      Günlük programlardaki soru çözümü ve konu anlatımı görevlerini aksatmadan sürdürmekte, koç görüşmelerine düzenli katılmaktadır.
                    </p>
                  </div>

                  {/* Metric C */}
                  <div className="bg-slate-800/30 p-5 rounded-2xl border border-white/5 space-y-3 print:bg-slate-50 print:border-slate-200">
                    <div className="flex items-center gap-3">
                      <div className="p-2.5 bg-emerald-500/10 text-emerald-400 rounded-xl print:bg-emerald-100">
                        <Compass className="w-5 h-5" />
                      </div>
                      <div>
                        <h4 className="text-xs font-bold text-white print:text-black">Zaman Yönetimi & Strateji</h4>
                        <span className="text-[10px] text-emerald-400 font-semibold">%86 - Turlama Tekniği</span>
                      </div>
                    </div>
                    <p className="text-xs text-slate-400 leading-relaxed print:text-slate-600">
                      Deneme sınavlarında turlama tekniğini uygulayarak zor sorulara takılmadan turlama stratejisini başarıyla geliştirmektedir.
                    </p>
                  </div>

                  {/* Metric D */}
                  <div className="bg-slate-800/30 p-5 rounded-2xl border border-white/5 space-y-3 print:bg-slate-50 print:border-slate-200">
                    <div className="flex items-center gap-3">
                      <div className="p-2.5 bg-amber-500/10 text-amber-400 rounded-xl print:bg-amber-100">
                        <Target className="w-5 h-5" />
                      </div>
                      <div>
                        <h4 className="text-xs font-bold text-white print:text-black">Bireysel Öğrenme Stili</h4>
                        <span className="text-[10px] text-amber-400 font-semibold">Görsel & Soru-Çözüm Odaklı</span>
                      </div>
                    </div>
                    <p className="text-xs text-slate-400 leading-relaxed print:text-slate-600">
                      Konu anlatımlarından ziyade bol soru çözümü ve yanlış yapılan soruların video çözümlerini izleyerek daha hızlı öğrenmektedir.
                    </p>
                  </div>

                  {/* Metric E */}
                  <div className="bg-slate-800/30 p-5 rounded-2xl border border-white/5 space-y-3 print:bg-slate-50 print:border-slate-200">
                    <div className="flex items-center gap-3">
                      <div className="p-2.5 bg-sky-500/10 text-sky-400 rounded-xl print:bg-sky-100">
                        <CheckCircle2 className="w-5 h-5" />
                      </div>
                      <div>
                        <h4 className="text-xs font-bold text-white print:text-black">Soru Değerlendirme Rutini</h4>
                        <span className="text-[10px] text-sky-400 font-semibold">%90 - Video Çözüm Takibi</span>
                      </div>
                    </div>
                    <p className="text-xs text-slate-400 leading-relaxed print:text-slate-600">
                      Deneme sınavı sonrasında boş ve yanlış soruların analizini aynı gün tamamlayarak öğrenme defterine not etmektedir.
                    </p>
                  </div>

                  {/* Metric F */}
                  <div className="bg-slate-800/30 p-5 rounded-2xl border border-white/5 space-y-3 print:bg-slate-50 print:border-slate-200">
                    <div className="flex items-center gap-3">
                      <div className="p-2.5 bg-rose-500/10 text-rose-400 rounded-xl print:bg-rose-100">
                        <Heart className="w-5 h-5" />
                      </div>
                      <div>
                        <h4 className="text-xs font-bold text-white print:text-black">Sosyal & Ev Yaşam Dengesi</h4>
                        <span className="text-[10px] text-rose-400 font-semibold">Dengeli & Destekleyici</span>
                      </div>
                    </div>
                    <p className="text-xs text-slate-400 leading-relaxed print:text-slate-600">
                      Uyku aralıkları ve sosyal dinlenme vakitleri iyi ayarlanmıştır. Aile içi iletişim ve koç desteği motivasyonunu güçlendirmektedir.
                    </p>
                  </div>
                </div>
              </div>

              {/* 4. Eğitim Koçu & Rehberlik Servisi Özel Yazılı Bilgilendirme Raporu */}
              <div className="bg-gradient-to-br from-indigo-950/40 via-slate-900/60 to-slate-900/40 border border-indigo-500/20 rounded-3xl p-6 md:p-8 space-y-6 print:bg-slate-50 print:border-slate-300 print:p-6">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-indigo-500/20 text-indigo-400 flex items-center justify-center font-bold">
                    <Sparkles className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-lg font-black text-white print:text-black">Eğitim Koçu & Rehberlik Servisi Özel Dönem Raporu</h3>
                    <p className="text-xs text-slate-400 print:text-slate-600">
                      Sayın Velimize Özel Genel Değerlendirme, Tavsiye ve Eylem Planı
                    </p>
                  </div>
                </div>

                <div className="bg-slate-950/60 border border-white/5 p-6 rounded-2xl text-slate-200 text-xs leading-relaxed space-y-4 print:bg-white print:border-slate-200 print:text-slate-900">
                  <p>
                    Sayın Velimiz, <strong>{studentProfile?.name || selectedStudent?.displayName || (selectedStudent as any)?.name}</strong> öğrencimizin {selectedTerm === "all" ? "tüm hazırlık dönemi" : selectedTerm === "term1" ? "1. dönem (Güz)" : "2. dönem (Bahar)"} boyunca sergilediği çalışma disiplini, soru çözüm istikrarı ve rehberlik performans verileri titizlikle incelenmiştir.
                  </p>

                  <div className="space-y-2 pt-2">
                    <p className="font-bold text-indigo-300 print:text-indigo-900">📌 Genel Dönem Özeti:</p>
                    <ul className="list-disc list-inside space-y-1 text-slate-300 print:text-slate-800">
                      <li>Öğrencimiz bu periyotta toplam <strong>{compCozulenSoru.toLocaleString()} adet soru</strong> çözerek %{compTaskSuccessRate} hedefe ulaşma sadakati yakalamıştır.</li>
                      <li>Girilen <strong>{compGenelExams.length} genel deneme sınavında</strong> TYT ortalaması <strong>{compTytAvgNet} net</strong>, AYT ortalaması <strong>{compAytAvgNet} net</strong> olarak kaydedilmiştir.</li>
                      <li>Ders bazlı pratik ihtiyacını karşılamak adına <strong>{compBransExams.length} adet branş denemesi</strong> çözülmüştür.</li>
                    </ul>
                  </div>

                  <div className="space-y-2 pt-2">
                    <p className="font-bold text-emerald-300 print:text-emerald-900">💡 Velilerimiz İçin Stratejik Tavsiyeler & Eylem Planı:</p>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-slate-300 print:text-slate-800 pt-1">
                      <div className="p-3 bg-white/5 rounded-xl border border-white/5 print:bg-slate-100 print:border-slate-200">
                        <strong>1. Evde Çalışma Alanı ve Odaklanma:</strong> Ders çalışma saatlerinde dış uyaranların (telefon, tv vb.) kısıtlanarak sessiz ortamın korunması.
                      </div>
                      <div className="p-3 bg-white/5 rounded-xl border border-white/5 print:bg-slate-100 print:border-slate-200">
                        <strong>2. Deneme Analizine Odaklanma:</strong> Sınav sonrası sadece nete değil, yanlış soruların öğrenilme sürecine moral desteği verilmesi.
                      </div>
                      <div className="p-3 bg-white/5 rounded-xl border border-white/5 print:bg-slate-100 print:border-slate-200">
                        <strong>3. Uyku ve Beslenme Rutini:</strong> Gece geç saatlere kadar uykusuz kalmak yerine düzenli uyku aralığının (7-8 saat) korunması.
                      </div>
                      <div className="p-3 bg-white/5 rounded-xl border border-white/5 print:bg-slate-100 print:border-slate-200">
                        <strong>4. Haftalık Koç Görüşmeleri:</strong> Haftalık birebir görüşmelerin aksatılmadan sürdürülmesi ve hedeflerin güncellenmesi.
                      </div>
                    </div>
                  </div>
                </div>

                {/* Veli & Koç Onay İmzaları (Print Mode) */}
                <div className="hidden print:block pt-12">
                  <div className="grid grid-cols-2 gap-12 text-xs text-center">
                    <div className="space-y-12">
                      <p className="font-bold text-slate-800">Eğitim Koçu / Rehberlik Birimi Onayı</p>
                      <div className="border-t border-slate-300 w-48 mx-auto pt-2">
                        <span>ON Akademi Başkoçu</span>
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
              </div>

            </div>
          )}
        </div>
      )}

    </div>
  );
}
