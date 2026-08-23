import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { auth } from "../../lib/firebase";
import { studentDataService } from "../../services/studentDataService";
import {
  Trophy,
  X,
  ChevronRight,
  ChevronDown,
  LineChart,
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

const formatDateForInput = (dateVal: any): string => {
  if (!dateVal) return "";
  if (typeof dateVal === "string") return dateVal.split("T")[0];
  if (dateVal.toDate && typeof dateVal.toDate === "function")
    return dateVal.toDate().toISOString().split("T")[0];
  if (dateVal instanceof Date) return dateVal.toISOString().split("T")[0];
  return String(dateVal).split("T")[0];
};

const safeFormatDate = (dateVal: any) => {
  if (!dateVal) return "";
  let d: Date;
  if (dateVal.toDate && typeof dateVal.toDate === 'function') {
    d = dateVal.toDate();
  } else {
    d = new Date(dateVal);
  }
  return isNaN(d.getTime()) ? "" : d.toLocaleDateString("tr-TR");
};

import { useStudent } from "../../lib/StudentContext";
export default function ParentExams() {
  const navigate = useNavigate();
  const { selectedStudent } = useStudent();
  const [exams, setExams] = useState<any[]>([]);
  const [globalExams, setGlobalExams] = useState<any[]>([]);
  const [studentProfile, setStudentProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("YKS");
  const [expandedExamId, setExpandedExamId] = useState<string | null>(null);


  const BRANCH_CATEGORIES = [
    {
      category: "TYT Denemeleri",
      exams: [
        { name: "Türkçe (TYT)", max: 40 },
        { name: "Temel Matematik (TYT)", max: 40 },
        { name: "Sosyal Bilimler (TYT)", max: 20 },
        { name: "Fen Bilimleri (TYT)", max: 20 },
        { name: "Tarih (TYT)", max: 5 },
        { name: "Coğrafya (TYT)", max: 5 },
        { name: "Felsefe (TYT)", max: 5 },
        { name: "Din (TYT)", max: 5 },
        { name: "Fizik (TYT)", max: 7 },
        { name: "Kimya (TYT)", max: 7 },
        { name: "Biyoloji (TYT)", max: 6 },
        { name: "Geometri (TYT)", max: 10 },
      ],
    },
    {
      category: "AYT Denemeleri",
      exams: [
        { name: "Matematik (AYT)", max: 30 },
        { name: "Edebiyat-Sosyal-1 (AYT)", max: 40 },
        { name: "Sosyal-2 (AYT)", max: 40 },
        { name: "Fen Bilimleri (AYT)", max: 40 },
        { name: "Edebiyat (AYT)", max: 24 },
        { name: "Tarih-1 (AYT)", max: 10 },
        { name: "Coğrafya-1 (AYT)", max: 6 },
        { name: "Tarih-2 (AYT)", max: 11 },
        { name: "Coğrafya-2 (AYT)", max: 11 },
        { name: "Felsefe Grubu (AYT)", max: 12 },
        { name: "Din (Seçmeli) (AYT)", max: 6 },
        { name: "Fizik (AYT)", max: 14 },
        { name: "Kimya (AYT)", max: 13 },
        { name: "Biyoloji (AYT)", max: 13 },
        { name: "Geometri (AYT)", max: 10 },
      ],
    },
    {
      category: "YDT Denemeleri",
      exams: [
        { name: "İngilizce (YDT)", max: 80 },
        { name: "Almanca (YDT)", max: 80 },
        { name: "Fransızca (YDT)", max: 80 },
        { name: "Arapça (YDT)", max: 80 },
        { name: "Rusça (YDT)", max: 80 },
      ],
    },
  ];

  const BRANCH_COMPOSITES: Record<string, string[]> = {
    "Temel Matematik (TYT)": ["Matematik (TYT)", "Geometri (TYT)"],
    "Sosyal Bilimler (TYT)": [
      "Tarih (TYT)",
      "Coğrafya (TYT)",
      "Felsefe (TYT)",
      "Din (TYT)",
    ],
    "Fen Bilimleri (TYT)": ["Fizik (TYT)", "Kimya (TYT)", "Biyoloji (TYT)"],
    "Edebiyat-Sosyal-1 (AYT)": [
      "Edebiyat (AYT)",
      "Tarih-1 (AYT)",
      "Coğrafya-1 (AYT)",
    ],
    "Sosyal-2 (AYT)": [
      "Tarih-2 (AYT)",
      "Coğrafya-2 (AYT)",
      "Felsefe Grubu (AYT)",
      "Din (Seçmeli) (AYT)",
    ],
    "Fen Bilimleri (AYT)": ["Fizik (AYT)", "Kimya (AYT)", "Biyoloji (AYT)"],
  };

  const getBranchMax = (branchName: string) => {
    for (const cat of BRANCH_CATEGORIES) {
      const exam = cat.exams.find((e) => e.name === branchName);
      if (exam) return exam.max;
    }
    return 40;
  };

  const getBranchByName = (branchName: string) => {
    for (const cat of BRANCH_CATEGORIES) {
      const exam = cat.exams.find((e) => e.name === branchName);
      if (exam) return exam;
    }
    return null;
  };

  const EXAM_STRUCTURE: any = {
    TYT: [
      { category: "Türkçe", fields: [{ name: "Türkçe", max: 40 }] },
      {
        category: "Sosyal Bilimler",
        fields: [
          { name: "Tarih", max: 5 },
          { name: "Coğrafya", max: 5 },
          { name: "Felsefe", max: 5 },
          { name: "Din", max: 5 },
        ],
      },
      {
        category: "Temel Matematik",
        fields: [
          { name: "Matematik", max: 30 },
          { name: "Geometri", max: 10 },
        ],
      },
      {
        category: "Fen Bilimleri",
        fields: [
          { name: "Fizik", max: 7 },
          { name: "Kimya", max: 7 },
          { name: "Biyoloji", max: 6 },
        ],
      },
    ],
    AYT: [
      {
        category: "Ed-Sos-1",
        fields: [
          { name: "Edebiyat", max: 24 },
          { name: "Tarih-1", max: 10 },
          { name: "Coğrafya-1", max: 6 },
        ],
      },
      {
        category: "Sosyal-2",
        fields: [
          { name: "Tarih-2", max: 11 },
          { name: "Coğrafya-2", max: 11 },
          { name: "Felsefe Grubu", max: 12 },
          { name: "Din (Seçmeli)", max: 6 },
        ],
      },
      {
        category: "Matematik",
        fields: [
          { name: "Matematik", max: 30 },
          { name: "Geometri", max: 10 },
        ],
      },
      {
        category: "Fen Bilimleri",
        fields: [
          { name: "Fizik", max: 14 },
          { name: "Kimya", max: 13 },
          { name: "Biyoloji", max: 13 },
        ],
      },
    ],
    YDT: [
      { category: "İngilizce", fields: [{ name: "İngilizce", max: 80 }] },
      { category: "Almanca", fields: [{ name: "Almanca", max: 80 }] },
      { category: "Fransızca", fields: [{ name: "Fransızca", max: 80 }] },
      { category: "Arapça", fields: [{ name: "Arapça", max: 80 }] },
      { category: "Rusça", fields: [{ name: "Rusça", max: 80 }] },
      { category: "Yabancı Dil", fields: [{ name: "Yabancı Dil", max: 80 }] }, // Keep for backward compatibility
    ],
    YKS: [
      { category: "TYT Türkçe", fields: [{ name: "TYT Türkçe", max: 40 }] },
      {
        category: "TYT Sosyal",
        fields: [
          { name: "TYT Tarih", max: 5 },
          { name: "TYT Coğrafya", max: 5 },
          { name: "TYT Felsefe", max: 5 },
          { name: "TYT Din", max: 5 },
        ],
      },
      {
        category: "TYT Matematik",
        fields: [
          { name: "TYT Matematik", max: 30 },
          { name: "TYT Geometri", max: 10 },
        ],
      },
      {
        category: "TYT Fen",
        fields: [
          { name: "TYT Fizik", max: 7 },
          { name: "TYT Kimya", max: 7 },
          { name: "TYT Biyoloji", max: 6 },
        ],
      },
      {
        category: "AYT Ed-Sos-1",
        fields: [
          { name: "AYT Edebiyat", max: 24 },
          { name: "AYT Tarih-1", max: 10 },
          { name: "AYT Coğrafya-1", max: 6 },
        ],
      },
      {
        category: "AYT Sosyal-2",
        fields: [
          { name: "AYT Tarih-2", max: 11 },
          { name: "AYT Coğrafya-2", max: 11 },
          { name: "AYT Felsefe Grubu", max: 12 },
          { name: "AYT Din (Seçmeli)", max: 6 },
        ],
      },
      {
        category: "AYT Matematik",
        fields: [{ name: "AYT Matematik", max: 40 }],
      },
      {
        category: "AYT Fen",
        fields: [
          { name: "AYT Fizik", max: 14 },
          { name: "AYT Kimya", max: 13 },
          { name: "AYT Biyoloji", max: 13 },
        ],
      },
      {
        category: "YDT İngilizce",
        fields: [{ name: "YDT İngilizce", max: 80 }],
      },
      { category: "YDT Almanca", fields: [{ name: "YDT Almanca", max: 80 }] },
      {
        category: "YDT Fransızca",
        fields: [{ name: "YDT Fransızca", max: 80 }],
      },
      { category: "YDT Arapça", fields: [{ name: "YDT Arapça", max: 80 }] },
      { category: "YDT Rusça", fields: [{ name: "YDT Rusça", max: 80 }] },
      {
        category: "YDT Yabancı Dil",
        fields: [{ name: "YDT Yabancı Dil", max: 80 }],
      }, // Keep for backward compatibility
    ],
  };

  const getMappedScores = (exam: any, tab: string) => {
    if (tab === "BRANŞ") return exam.scores || {};
    if (exam.examType === tab) return exam.scores || {};
    if (exam.examType === "YKS") {
      const mapped: any = {};
      if (tab === "TYT") {
        mapped["Türkçe"] = exam.scores["TYT Türkçe"];
        mapped["Tarih"] = exam.scores["TYT Tarih"];
        mapped["Coğrafya"] = exam.scores["TYT Coğrafya"];
        mapped["Felsefe"] = exam.scores["TYT Felsefe"];
        mapped["Din"] = exam.scores["TYT Din"];
        mapped["Matematik"] = exam.scores["TYT Matematik"];
        mapped["Geometri"] = exam.scores["TYT Geometri"];
        mapped["Fizik"] = exam.scores["TYT Fizik"];
        mapped["Kimya"] = exam.scores["TYT Kimya"];
        mapped["Biyoloji"] = exam.scores["TYT Biyoloji"];
      } else if (tab === "AYT") {
        mapped["Edebiyat"] = exam.scores["AYT Edebiyat"];
        mapped["Tarih-1"] = exam.scores["AYT Tarih-1"];
        mapped["Coğrafya-1"] = exam.scores["AYT Coğrafya-1"];
        mapped["Tarih-2"] = exam.scores["AYT Tarih-2"];
        mapped["Coğrafya-2"] = exam.scores["AYT Coğrafya-2"];
        mapped["Felsefe Grubu"] = exam.scores["AYT Felsefe Grubu"];
        mapped["Din (Seçmeli)"] = exam.scores["AYT Din (Seçmeli)"];
        mapped["Matematik"] = exam.scores["AYT Matematik"];
        mapped["Fizik"] = exam.scores["AYT Fizik"];
        mapped["Kimya"] = exam.scores["AYT Kimya"];
        mapped["Biyoloji"] = exam.scores["AYT Biyoloji"];
      } else if (tab === "YDT") {
        mapped["İngilizce"] = exam.scores["YDT İngilizce"];
        mapped["Almanca"] = exam.scores["YDT Almanca"];
        mapped["Fransızca"] = exam.scores["YDT Fransızca"];
        mapped["Arapça"] = exam.scores["YDT Arapça"];
        mapped["Rusça"] = exam.scores["YDT Rusça"];
        mapped["Yabancı Dil"] = exam.scores["YDT Yabancı Dil"];
      }
      return mapped;
    }
    return exam.scores || {};
  };

  const getNetForTab = (exam: any, tab: string) => {
    if (exam.examType === tab) return exam.totalNet || 0;
    if (exam.examType === "YKS") {
      let total = 0;
      const mapped = getMappedScores(exam, tab);
      const struct = EXAM_STRUCTURE[tab] || [];
      struct.forEach((cat: any) => {
        cat.fields.forEach((f: any) => {
          if (mapped[f.name]) total += parseFloat(mapped[f.name].n) || 0;
        });
      });
      return parseFloat(total.toFixed(2));
    }
    return exam.totalNet || 0;
  };

  const calculateAYTBranchScores = (mappedScores: any) => {
    const getNet = (name: string) => {
      // Handle both YKS prefixed and normal AYT names
      const score = mappedScores[name] || mappedScores[`AYT ${name}`];
      return parseFloat(score?.n || 0);
    };

    const mat = getNet("Matematik");
    const geo = getNet("Geometri");
    const fizik = getNet("Fizik");
    const kimya = getNet("Kimya");
    const biyo = getNet("Biyoloji");
    const edb = getNet("Edebiyat");
    const tar1 = getNet("Tarih-1");
    const cog1 = getNet("Coğrafya-1");
    const tar2 = getNet("Tarih-2");
    const cog2 = getNet("Coğrafya-2");
    const fel = getNet("Felsefe Grubu");
    const din = getNet("Din (Seçmeli)");

    return {
      say: (mat + geo + fizik + kimya + biyo).toFixed(2),
      ea: (mat + geo + edb + tar1 + cog1).toFixed(2),
      soz: (edb + tar1 + cog1 + tar2 + cog2 + fel + din).toFixed(2),
    };
  };

  const getDisplayExams = () => {
    return exams
      .filter((e) => {
        if (activeTab === "BRANŞ") return e.examType === "BRANŞ";
        return (
          e.examType === activeTab ||
          (e.examType === "YKS" && activeTab !== "YKS")
        );
      })
      .sort((a, b) => {
        const dateA = (activeTab === 'AYT' || activeTab === 'YDT') && a.examType === 'YKS' ? (a.aytDate || a.date) : a.date;
        const dateB = (activeTab === 'AYT' || activeTab === 'YDT') && b.examType === 'YKS' ? (b.aytDate || b.date) : b.date;
        const timeA = new Date(dateA).getTime();
        const timeB = new Date(dateB).getTime();
        return (isNaN(timeB) ? 0 : timeB) - (isNaN(timeA) ? 0 : timeA);
      });
  };


  useEffect(() => {
    fetchExams();
  }, [selectedStudent]);

  const [analyses, setAnalyses] = useState<any[]>([]);

  const fetchExams = async () => {
    const user = selectedStudent;
    if (!user) return;
    setLoading(true);
    try {
      const [data, profile, studentAnalyses, gExams] = await Promise.all([
        studentDataService.getExamResults(selectedStudent?.uid),
        studentDataService.getStudentProfile(selectedStudent?.uid),
        studentDataService.getStudentAnalyses(selectedStudent?.uid),
        studentDataService.getGlobalAcademicExams(),
      ]);
      setExams(data || []);
      setStudentProfile(profile);
      setAnalyses(studentAnalyses || []);
      setGlobalExams(gExams || []);
    } catch (err) {
      console.error("Veri çekme hatası:", err);
    } finally {
      setLoading(false);
    }
  };

  const getAnalysisStatus = (exam: any, tab: string) => {
    const analysis = analyses.find((a) => a.examId === exam.id);
    if (!analysis) return "none";

    const analyzedBranches = Object.keys(analysis.data || {});
    if (analyzedBranches.length === 0) return "none";

    const branchToFieldsMap: Record<string, string[]> = {
      Türkçe: ["Türkçe", "TYT Türkçe"],
      "Sosyal Bilimler": [
        "Tarih",
        "TYT Tarih",
        "Coğrafya",
        "TYT Coğrafya",
        "Felsefe",
        "TYT Felsefe",
        "Din",
        "TYT Din",
      ],
      "Temel Matematik": [
        "Matematik",
        "TYT Matematik",
        "Geometri",
        "TYT Geometri",
      ],
      "Fen Bilimleri": [
        "Fizik",
        "TYT Fizik",
        "Kimya",
        "TYT Kimya",
        "Biyoloji",
        "TYT Biyoloji",
      ],
      Edebiyat: ["Edebiyat", "AYT Edebiyat"],
      "Ed-Sos-1": [
        "Edebiyat",
        "AYT Edebiyat",
        "Tarih-1",
        "AYT Tarih-1",
        "Coğrafya-1",
        "AYT Coğrafya-1",
      ],
      "Sosyal-2": [
        "Tarih-2",
        "AYT Tarih-2",
        "Coğrafya-2",
        "AYT Coğrafya-2",
        "Felsefe Grubu",
        "AYT Felsefe Grubu",
        "Din (Seçmeli)",
        "AYT Din (Seçmeli)",
      ],
      Matematik: ["Matematik", "AYT Matematik", "Geometri", "AYT Geometri"],
      "Fen Bilimleri (AYT)": [
        "Fizik",
        "AYT Fizik",
        "Kimya",
        "AYT Kimya",
        "Biyoloji",
        "AYT Biyoloji",
      ],
      "Yabancı Dil": ["Yabancı Dil", "YDT Yabancı Dil"],
      İngilizce: ["İngilizce", "YDT İngilizce"],
      Almanca: ["Almanca", "YDT Almanca"],
      Fransızca: ["Fransızca", "YDT Fransızca"],
      Arapça: ["Arapça", "YDT Arapça"],
      Rusça: ["Rusça", "YDT Rusça"],
    };

    const getTargetBranches = () => {
      if (exam.examType === "BRANŞ") {
        return Object.keys(exam.scores || {});
      }

      let targetArea = tab === "YKS" ? exam.examType : tab;

      const EXAM_TYPE_BRANCHES: Record<string, string[]> = {
        TYT: ["Türkçe", "Sosyal Bilimler", "Temel Matematik", "Fen Bilimleri"],
        AYT: ["Matematik", "Ed-Sos-1", "Sosyal-2", "Fen Bilimleri (AYT)"],
        YDT: ["İngilizce", "Almanca", "Fransızca", "Arapça", "Rusça"],
      };

      const FIELD_AYT_BRANCHES: Record<string, string[]> = {
        SAYISAL: ["Matematik", "Fen Bilimleri (AYT)"],
        "EŞİT AĞIRLIK": ["Matematik", "Ed-Sos-1"],
        SÖZEL: ["Ed-Sos-1", "Sosyal-2"],
      };

      if (targetArea === "BRANŞ") return Object.keys(exam.scores || {});

      let branches: string[] = [];
      if (targetArea === "TYT") branches = EXAM_TYPE_BRANCHES["TYT"];
      if (targetArea === "AYT") {
        let allowedAyt = FIELD_AYT_BRANCHES[studentProfile?.branch] ||
          FIELD_AYT_BRANCHES[studentProfile?.branch?.toUpperCase()] || [
            "Matematik",
            "Ed-Sos-1",
            "Sosyal-2",
            "Fen Bilimleri (AYT)",
          ];
        if (studentProfile?.branch === "DİL" && studentProfile?.ydtLanguage) {
          allowedAyt = [studentProfile.ydtLanguage];
        }
        branches = allowedAyt;
      }
      if (targetArea === "YDT") {
        if (studentProfile?.branch === "DİL" && studentProfile?.ydtLanguage) {
          branches = [studentProfile.ydtLanguage];
        } else {
          branches = EXAM_TYPE_BRANCHES["YDT"];
        }
      }
      if (targetArea === "YKS") {
        let allowedAyt = FIELD_AYT_BRANCHES[studentProfile?.branch] ||
          FIELD_AYT_BRANCHES[studentProfile?.branch?.toUpperCase()] || [
            "Matematik",
            "Ed-Sos-1",
            "Sosyal-2",
            "Fen Bilimleri (AYT)",
          ];
        if (studentProfile?.branch === "DİL" && studentProfile?.ydtLanguage) {
          allowedAyt = [studentProfile.ydtLanguage];
        }
        branches = [...EXAM_TYPE_BRANCHES["TYT"], ...allowedAyt];
      }

      return branches.filter((b: string) => analyzedBranches.includes(b));
    };

    const targetBranches = getTargetBranches();
    if (targetBranches.length === 0) return "none"; // No expected fields are touched

    let allComplete = true;
    let anyCompleteOrTouched = false;

    for (const branch of targetBranches) {
      let totalCorrect = 0;
      if (exam.examType === "BRANŞ") {
        totalCorrect += parseInt(exam.scores?.[branch]?.c) || 0;
      } else {
        let expectedFields = branchToFieldsMap[branch] || [branch];
        if (exam.examType === "YKS") {
          if (branch === "Matematik") expectedFields = ["AYT Matematik"];
          if (branch === "Fen Bilimleri (AYT)")
            expectedFields = ["AYT Fizik", "AYT Kimya", "AYT Biyoloji"];
        } else if (exam.examType === "AYT") {
          if (branch === "Matematik") expectedFields = ["Matematik", "Geometri"];
          if (branch === "Fen Bilimleri (AYT)")
            expectedFields = ["Fizik", "Kimya", "Biyoloji"];
        }

        expectedFields.forEach((field) => {
          if (exam.scores?.[field]) {
            totalCorrect += parseInt(exam.scores[field].c) || 0;
          }
        });
      }

      const branchData = (analysis?.data && analysis.data[branch]) || [];
      const noneCount = branchData.filter(
        (q: any) => q && q.errorType === "none",
      ).length;

      if (branchData.length > 0) anyCompleteOrTouched = true;
      if (noneCount !== totalCorrect) {
        allComplete = false;
      }
    }

    if (!anyCompleteOrTouched) return "none";
    if (allComplete) return "complete";
    return "incomplete";
  };

  return (
    <div className="space-y-8 pb-20 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div>
        <h1 className="text-3xl font-bold italic text-white uppercase tracking-tight">
          Denemelerim
        </h1>
        <p className="text-slate-500 mt-1">
          TYT, AYT, YDT ve Branş deneme sonuçlarını buradan takip edebilirsin.
        </p>
      </div>

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex bg-slate-900/60 p-1 rounded-xl border border-white/5 overflow-x-auto custom-scrollbar">
          {["YKS", "TYT", "AYT", "YDT", "BRANŞ"].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-6 py-2.5 rounded-lg text-sm font-bold uppercase tracking-widest transition-all whitespace-nowrap ${activeTab === tab ? "bg-indigo-600 text-white shadow-lg" : "text-slate-400 hover:text-white hover:bg-white/5"}`}
            >
              {tab}
            </button>
          ))}
        </div>
      </div>

      <div className="bg-slate-900/40 border border-white/5 rounded-3xl overflow-hidden">
        {loading ? (
          <div className="text-center py-20 text-slate-500 font-bold italic animate-pulse">
            Sonuçlar Yükleniyor...
          </div>
        ) : getDisplayExams().length === 0 ? (
          <div className="text-center py-20 border border-dashed border-white/10 rounded-2xl m-6">
            <LineChart size={48} className="mx-auto text-slate-700 mb-4" />
            <p className="text-slate-400 font-bold text-sm">
              Henüz {activeTab} denemesi girmedin.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="bg-white/5 border-b border-white/5 text-[10px] font-black uppercase tracking-widest text-slate-400">
                  <th className="px-6 py-4">Deneme Adı / Tarih</th>
                  <th className="px-6 py-4">Net</th>
                  <th className="px-6 py-4">Sıralama / Katılımcı</th>
                  <th className="px-6 py-4">Yüzdelik Dilim</th>
                  <th className="px-6 py-4">Detaylar</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {getDisplayExams().map((exam) => {
                  const mappedScores = getMappedScores(exam, activeTab);
                  return (
                    <React.Fragment key={exam.id}>
                      <tr
                        onClick={() => {
                          setExpandedExamId(
                            expandedExamId === exam.id ? null : exam.id,
                          );
                        }}
                        className="hover:bg-white/5 transition-colors group cursor-pointer"
                      >
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-2">
                            {exam.examType === "BRANŞ" && (
                              <div className="w-2 h-2 rounded-full bg-indigo-500 shadow-[0_0_8px_rgba(99,102,241,0.6)]" />
                            )}
                            <div>
                              <p className="font-bold text-white text-sm">
                                {exam.examName}
                              </p>
                              <div className="flex flex-col">
                                <p className="text-xs text-slate-500">
                                  {exam.examType === "YKS" ? "TYT: " : ""}
                                  {safeFormatDate(exam.date)}
                                </p>
                                {exam.aytDate && (
                                  <p className="text-xs text-slate-500">
                                    AYT: {safeFormatDate(exam.aytDate)}
                                  </p>
                                )}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          {activeTab === "AYT" || activeTab === "YKS" ? (
                            <div className="flex flex-col gap-1 min-w-[120px]">
                              {activeTab === "YKS" && (
                                <div className="flex justify-between items-center text-[10px] font-bold text-slate-500 border-b border-white/5 pb-1 mb-1">
                                  <span>TYT NET</span>
                                  <span className="text-indigo-300">
                                    {getNetForTab(exam, "TYT")}
                                  </span>
                                </div>
                              )}
                              <div className="flex flex-col gap-0.5">
                                {(!studentProfile?.branch ||
                                  studentProfile.branch.toUpperCase() ===
                                    "SAYISAL") && (
                                  <div className="flex justify-between items-center text-[10px] font-black">
                                    <span className="text-emerald-400">
                                      AYT SAY
                                    </span>
                                    <span className="text-white bg-emerald-500/10 px-1 rounded">
                                      {
                                        calculateAYTBranchScores(mappedScores)
                                          .say
                                      }
                                    </span>
                                  </div>
                                )}
                                {(!studentProfile?.branch ||
                                  studentProfile.branch.toUpperCase() ===
                                    "EŞİT AĞIRLIK") && (
                                  <div className="flex justify-between items-center text-[10px] font-black">
                                    <span className="text-blue-400">
                                      AYT EA
                                    </span>
                                    <span className="text-white bg-blue-500/10 px-1 rounded">
                                      {
                                        calculateAYTBranchScores(mappedScores)
                                          .ea
                                      }
                                    </span>
                                  </div>
                                )}
                                {(!studentProfile?.branch ||
                                  studentProfile.branch.toUpperCase() ===
                                    "SÖZEL") && (
                                  <div className="flex justify-between items-center text-[10px] font-black">
                                    <span className="text-orange-400">
                                      AYT SÖZ
                                    </span>
                                    <span className="text-white bg-orange-500/10 px-1 rounded">
                                      {
                                        calculateAYTBranchScores(mappedScores)
                                          .soz
                                      }
                                    </span>
                                  </div>
                                )}
                                {studentProfile?.branch?.toUpperCase() ===
                                  "DİL" && (
                                  <div className="flex justify-between items-center text-[10px] font-black">
                                    <span className="text-pink-400">
                                      YDT NET
                                    </span>
                                    <span className="text-white bg-pink-500/10 px-1 rounded">
                                      {getNetForTab(exam, "YDT")}
                                    </span>
                                  </div>
                                )}
                              </div>
                            </div>
                          ) : (
                            <span className="inline-block bg-indigo-500/20 text-indigo-300 px-3 py-1 rounded-lg text-sm font-black border border-indigo-500/30 shadow-[0_0_15px_rgba(99,102,241,0.2)]">
                              {getNetForTab(exam, activeTab)} Net
                            </span>
                          )}
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex flex-col">
                            <span className="text-sm font-bold text-slate-300">
                              {exam.rank ? exam.rank.toLocaleString() : "-"}
                            </span>
                            <span className="text-[10px] text-slate-500">
                              /
                              {exam.participantCount
                                ? exam.participantCount.toLocaleString()
                                : "-"}
                            </span>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          {exam.percentile > 0 ? (
                            <span className="text-emerald-400 font-bold text-sm bg-emerald-500/10 px-2 py-1 rounded-md border border-emerald-500/20">
                              %{exam.percentile}
                            </span>
                          ) : (
                            "-"
                          )}
                        </td>
                        <td className="px-6 py-4">
                          <button
                            className="text-slate-400 hover:text-white transition-colors p-2 rounded-lg hover:bg-white/10"
                            title="Detaylı İncele"
                          >
                            {expandedExamId === exam.id ? (
                              <ChevronDown size={18} />
                            ) : (
                              <ChevronRight size={18} />
                            )}
                          </button>
                        </td>
                      </tr>
                      <AnimatePresence>
                        {expandedExamId === exam.id && (
                          <motion.tr
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: "auto" }}
                            exit={{ opacity: 0, height: 0 }}
                          >
                            <td
                              colSpan={5}
                              className="p-0 border-b border-white/5"
                            >
                              <div className="bg-slate-950/50 p-6 space-y-6 m-2 md:mx-4 md:mb-4 rounded-xl border border-white/5 shadow-inner">
                                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                                  <h4 className="text-sm font-black text-white uppercase tracking-widest bg-white/5 inline-block px-3 py-1.5 rounded-lg border border-white/10">
                                    Sınav Netleri: {activeTab}{" "}
                                    {exam.examType === "YKS" &&
                                    activeTab !== "YKS"
                                      ? "(YKS'den)"
                                      : ""}
                                  </h4>

                                  {(activeTab === "AYT" ||
                                    activeTab === "YKS") && (
                                    <div className="flex gap-4">
                                      <div className="bg-emerald-500/10 border border-emerald-500/20 px-3 py-1.5 rounded-xl">
                                        <p className="text-[10px] font-black text-emerald-400 uppercase">
                                          AYT SAY
                                        </p>
                                        <p className="text-sm font-black text-white">
                                          {
                                            calculateAYTBranchScores(
                                              mappedScores,
                                            ).say
                                          }
                                        </p>
                                      </div>
                                      <div className="bg-blue-500/10 border border-blue-500/20 px-3 py-1.5 rounded-xl">
                                        <p className="text-[10px] font-black text-blue-400 uppercase">
                                          AYT EA
                                        </p>
                                        <p className="text-sm font-black text-white">
                                          {
                                            calculateAYTBranchScores(
                                              mappedScores,
                                            ).ea
                                          }
                                        </p>
                                      </div>
                                      <div className="bg-orange-500/10 border border-orange-500/20 px-3 py-1.5 rounded-xl">
                                        <p className="text-[10px] font-black text-orange-400 uppercase">
                                          AYT SÖZ
                                        </p>
                                        <p className="text-sm font-black text-white">
                                          {
                                            calculateAYTBranchScores(
                                              mappedScores,
                                            ).soz
                                          }
                                        </p>
                                      </div>
                                    </div>
                                  )}
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                                  {activeTab === "BRANŞ"
                                    ? Object.keys(mappedScores || {}).map(
                                        (branchName) => {
                                          const score =
                                            mappedScores[branchName];
                                          return (
                                            <div
                                              key={branchName}
                                              className="bg-slate-800/40 border border-slate-700/50 rounded-2xl overflow-hidden p-1 shadow-lg h-fit col-span-1 md:col-span-2 lg:col-span-1"
                                            >
                                              <div className="px-4 py-3 bg-slate-800/50 border-b border-slate-700/50 flex justify-between items-center rounded-xl mb-2">
                                                <span className="text-xs font-black text-indigo-300 uppercase tracking-widest">
                                                  {branchName}
                                                </span>
                                                <span className="text-xs font-black text-white bg-indigo-500/20 border border-indigo-500/30 px-2 py-0.5 rounded">
                                                  {score?.n || 0} Net
                                                </span>
                                              </div>
                                              <div className="flex justify-around items-center p-4">
                                                <div className="text-center">
                                                  <p className="text-[10px] font-black text-emerald-400 uppercase">
                                                    Doğru
                                                  </p>
                                                  <p className="text-xl font-black text-white">
                                                    {score?.c || "0"}
                                                  </p>
                                                </div>
                                                <div className="text-center">
                                                  <p className="text-[10px] font-black text-red-500 uppercase">
                                                    Yanlış
                                                  </p>
                                                  <p className="text-xl font-black text-white">
                                                    {score?.i || "0"}
                                                  </p>
                                                </div>
                                                <div className="text-center">
                                                  <p className="text-[10px] font-black text-indigo-400 uppercase">
                                                    Net
                                                  </p>
                                                  <p className="text-xl font-black text-white">
                                                    {score?.n || "0"}
                                                  </p>
                                                </div>
                                              </div>
                                            </div>
                                          );
                                        },
                                      )
                                    : (EXAM_STRUCTURE[activeTab] || []).map(
                                        (categoryGroup: any, idx: number) => {
                                          let groupNet = 0;
                                          categoryGroup.fields.forEach(
                                            (f: any) => {
                                              if (mappedScores?.[f.name])
                                                groupNet +=
                                                  parseFloat(
                                                    mappedScores[f.name].n,
                                                  ) || 0;
                                            },
                                          );

                                          return (
                                            <div
                                              key={idx}
                                              className="bg-slate-800/40 border border-slate-700/50 rounded-2xl overflow-hidden p-1 shadow-lg h-fit"
                                            >
                                              <div className="px-4 py-3 bg-slate-800/50 border-b border-slate-700/50 flex justify-between items-center rounded-xl mb-2">
                                                <span className="text-xs font-black text-indigo-300 uppercase tracking-widest">
                                                  {categoryGroup.category}
                                                </span>
                                                <span className="text-xs font-black text-white bg-indigo-500/20 border border-indigo-500/30 px-2 py-0.5 rounded">
                                                  {groupNet.toFixed(2)} Net
                                                </span>
                                              </div>

                                              <div className="space-y-1">
                                                {categoryGroup.fields.map(
                                                  (fieldItem: any) => (
                                                    <div
                                                      key={fieldItem.name}
                                                      className="grid grid-cols-12 gap-2 items-center bg-transparent p-2 rounded-lg hover:bg-white/5 transition-colors mx-1"
                                                    >
                                                      <div className="col-span-5 flex-1 min-w-0">
                                                        <p
                                                          className="text-[11px] font-bold text-slate-300 truncate"
                                                          title={fieldItem.name}
                                                        >
                                                          {fieldItem.name}
                                                        </p>
                                                      </div>
                                                      <div className="col-span-2 text-center text-[10px] font-bold text-emerald-500/70">
                                                        {mappedScores?.[
                                                          fieldItem.name
                                                        ]?.c || "0"}{" "}
                                                        D
                                                      </div>
                                                      <div className="col-span-2 text-center text-[10px] font-bold text-red-500/70">
                                                        {mappedScores?.[
                                                          fieldItem.name
                                                        ]?.i || "0"}{" "}
                                                        Y
                                                      </div>
                                                      <div className="col-span-3 text-right">
                                                        <span className="text-xs font-black text-white bg-slate-700/50 px-2 py-1.5 rounded inline-block min-w-[3rem] text-center">
                                                          {mappedScores?.[
                                                            fieldItem.name
                                                          ]?.n || 0}
                                                        </span>
                                                      </div>
                                                    </div>
                                                  ),
                                                )}
                                              </div>
                                            </div>
                                          );
                                        },
                                      )}
                                </div>
                              </div>
                            </td>
                          </motion.tr>
                        )}
                      </AnimatePresence>
                    </React.Fragment>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
