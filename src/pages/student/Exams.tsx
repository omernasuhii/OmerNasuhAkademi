import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { auth } from "../../lib/firebase";
import { useAuth } from "../../lib/AuthContext";
import { studentDataService } from "../../services/studentDataService";
import {
  Trophy,
  Plus,
  X,
  ChevronRight,
  ChevronDown,
  Save,
  Trash2,
  LineChart,
  MoreHorizontal,
  Edit2,
  Lock,
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

export default function Exams() {
  const navigate = useNavigate();
  const { user, userData } = useAuth();
  const currentUid = userData?.uid || user?.uid;
  const plan = userData?.subscriptionPlan || "";
  const isBronze = plan.includes("Bronz");
  const isSilver = plan.includes("Gümüş");

  const [exams, setExams] = useState<any[]>([]);
  const [globalExams, setGlobalExams] = useState<any[]>([]);
  const [studentProfile, setStudentProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [examToDelete, setExamToDelete] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState("YKS");
  const isAraSinif = ["9. Sınıf", "10. Sınıf", "11. Sınıf"].includes(studentProfile?.grade || "");
  const studentGrade = studentProfile?.grade || "9. Sınıf";
  useEffect(() => {
    if (isAraSinif && ["YKS", "AYT", "YDT"].includes(activeTab)) {
      setActiveTab(studentGrade);
    }
  }, [isAraSinif, studentGrade, activeTab]);
  const [expandedExamId, setExpandedExamId] = useState<string | null>(null);
  const [editingExamId, setEditingExamId] = useState<string | null>(null);
  const [showActionsFor, setShowActionsFor] = useState<string | null>(null);

  const [newResultMode, setNewResultMode] = useState<"individual" | "global">(
    "individual",
  );
  const [selectedGlobalExamId, setSelectedGlobalExamId] = useState("");

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
      category: "9. Sınıf Denemeleri",
      exams: [
        { name: "Türk Dili ve Edebiyatı (9. Sınıf)", max: 30 },
        { name: "Tarih (9. Sınıf)", max: 15 },
        { name: "Coğrafya (9. Sınıf)", max: 15 },
        { name: "Din Kültürü (9. Sınıf)", max: 10 },
        { name: "Matematik (9. Sınıf)", max: 30 },
        { name: "Fizik (9. Sınıf)", max: 10 },
        { name: "Kimya (9. Sınıf)", max: 10 },
        { name: "Biyoloji (9. Sınıf)", max: 10 },
      ],
    },
    {
      category: "10. Sınıf Denemeleri",
      exams: [
        { name: "Türk Dili ve Edebiyatı (10. Sınıf)", max: 30 },
        { name: "Tarih (10. Sınıf)", max: 15 },
        { name: "Coğrafya (10. Sınıf)", max: 15 },
        { name: "Din Kültürü (10. Sınıf)", max: 10 },
        { name: "Matematik (10. Sınıf)", max: 30 },
        { name: "Fizik (10. Sınıf)", max: 10 },
        { name: "Kimya (10. Sınıf)", max: 10 },
        { name: "Biyoloji (10. Sınıf)", max: 10 },
      ],
    },
    {
      category: "11. Sınıf Denemeleri",
      exams: [
        { name: "Türk Dili ve Edebiyatı (11. Sınıf)", max: 30 },
        { name: "Tarih (11. Sınıf)", max: 15 },
        { name: "Coğrafya (11. Sınıf)", max: 15 },
        { name: "Din Kültürü (11. Sınıf)", max: 10 },
        { name: "Matematik (11. Sınıf)", max: 30 },
        { name: "Fizik (11. Sınıf)", max: 10 },
        { name: "Kimya (11. Sınıf)", max: 10 },
        { name: "Biyoloji (11. Sınıf)", max: 10 },
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
    
    "9. Sınıf": [
      { category: "Türk Dili ve Edebiyatı", fields: [{ name: "Türk Dili ve Edebiyatı (9. Sınıf)", max: 30 }] },
      { category: "Sosyal Bilimler", fields: [{ name: "Tarih (9. Sınıf)", max: 15 }, { name: "Coğrafya (9. Sınıf)", max: 15 }, { name: "Din Kültürü (9. Sınıf)", max: 10 }] },
      { category: "Matematik", fields: [{ name: "Matematik (9. Sınıf)", max: 30 }] },
      { category: "Fen Bilimleri", fields: [{ name: "Fizik (9. Sınıf)", max: 10 }, { name: "Kimya (9. Sınıf)", max: 10 }, { name: "Biyoloji (9. Sınıf)", max: 10 }] }
    ],
    "10. Sınıf": [
      { category: "Türk Dili ve Edebiyatı", fields: [{ name: "Türk Dili ve Edebiyatı (10. Sınıf)", max: 30 }] },
      { category: "Sosyal Bilimler", fields: [{ name: "Tarih (10. Sınıf)", max: 15 }, { name: "Coğrafya (10. Sınıf)", max: 15 }, { name: "Din Kültürü (10. Sınıf)", max: 10 }] },
      { category: "Matematik", fields: [{ name: "Matematik (10. Sınıf)", max: 30 }] },
      { category: "Fen Bilimleri", fields: [{ name: "Fizik (10. Sınıf)", max: 10 }, { name: "Kimya (10. Sınıf)", max: 10 }, { name: "Biyoloji (10. Sınıf)", max: 10 }] }
    ],
    "11. Sınıf": [
      { category: "Türk Dili ve Edebiyatı", fields: [{ name: "Türk Dili ve Edebiyatı (11. Sınıf)", max: 30 }] },
      { category: "Sosyal Bilimler", fields: [{ name: "Tarih (11. Sınıf)", max: 15 }, { name: "Coğrafya (11. Sınıf)", max: 15 }, { name: "Din Kültürü (11. Sınıf)", max: 10 }] },
      { category: "Matematik", fields: [{ name: "Matematik (11. Sınıf)", max: 30 }] },
      { category: "Fen Bilimleri", fields: [{ name: "Fizik (11. Sınıf)", max: 10 }, { name: "Kimya (11. Sınıf)", max: 10 }, { name: "Biyoloji (11. Sınıf)", max: 10 }] }
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
    return (exams || [])
      .filter((e) => {
        if (!e) return false;
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

  const [newResult, setNewResult] = useState<any>({
    examName: "",
    examType: "TYT",
    date: new Date().toISOString().split("T")[0],
    rank: "",
    participantCount: "",
    scores: {},
  });

  useEffect(() => {
    if (currentUid) {
      fetchExams();
    }
  }, [currentUid]);

  const [analyses, setAnalyses] = useState<any[]>([]);

  const fetchExams = async () => {
    if (!currentUid) return;
    setLoading(true);
    try {
      const [data, profile, studentAnalyses, gExams] = await Promise.all([
        studentDataService.getExamResults(currentUid),
        studentDataService.getStudentProfile(currentUid),
        studentDataService.getStudentAnalyses(currentUid),
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

      return (branches || []).filter((b: string) => (analyzedBranches || []).includes(b));
    };

    const targetBranches = getTargetBranches();
    if (!targetBranches || targetBranches.length === 0) return "none"; // No expected fields are touched

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

  const calculatePercentile = (rank: number, participants: number) => {
    if (!rank || !participants || participants <= 0) return 0;
    return ((rank / participants) * 100).toFixed(2);
  };

  const handleScoreChange = (
    field: string,
    defaultMax: number,
    type: "c" | "i" | "m",
    value: string,
  ) => {
    setNewResult((prev: any) => {
      const current = prev.scores[field] || { c: "", i: "", n: 0, m: defaultMax };

      let val = parseInt(value);
      if (isNaN(val)) val = 0;
      if (val < 0) val = 0;

      let newM = type === "m" ? (value === "" ? defaultMax : val) : (current.m !== undefined ? current.m : defaultMax);
      let newC = type === "c" ? val : parseInt(current.c) || 0;
      let newI = type === "i" ? val : parseInt(current.i) || 0;

      if (newC + newI > newM) {
        if (type === "c") {
          newC = newM - newI;
        } else if (type === "i") {
          newI = newM - newC;
        } else {
          newC = Math.min(newC, newM);
          newI = Math.min(newI, newM - newC);
        }
      }

      const newN = newC - newI * 0.25;

      return {
        ...prev,
        scores: {
          ...prev.scores,
          [field]: {
            ...current,
            c: newC === 0 && type === "c" && value === "" ? "" : newC.toString(),
            i: newI === 0 && type === "i" && value === "" ? "" : newI.toString(),
            n: parseFloat(newN.toFixed(2)),
            m: newM,
          },
        },
      };
    });
  };

  const calculateTotalNet = (scores: any, type: string) => {
    let total = 0;
    if (!scores) return 0;
    if (type === "BRANŞ") {
      Object.values(scores).forEach((score: any) => {
        total += parseFloat(score.n) || 0;
      });
      return parseFloat(total.toFixed(2));
    }
    const structure = EXAM_STRUCTURE[type];
    if (!structure) return 0;

    structure.forEach((cat: any) => {
      cat.fields.forEach((fieldItem: any) => {
        if (scores[fieldItem.name]) {
          total += parseFloat(scores[fieldItem.name].n) || 0;
        }
      });
    });
    return parseFloat(total.toFixed(2));
  };

  const handleAddSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUid) return;

    const rank = parseInt(newResult.rank) || 0;
    const participants = parseInt(newResult.participantCount) || 0;

    if (rank > 0) {
      if (!participants) {
        setFormError(
          "Sıralama girdiyseniz, katılımcı sayısını da girmelisiniz.",
        );
        return;
      }
      if (participants < rank) {
        setFormError("Katılımcı sayısı, sıralama değerinden az olamaz.");
        return;
      }
    }
    setFormError(null);

    const percentile = calculatePercentile(rank, participants);
    const totalNet = calculateTotalNet(newResult.scores, newResult.examType);

      const payload: any = {
      studentId: currentUid,
      examName: newResult.examName,
      examType: newResult.examType,
      date: newResult.date,
      rank: rank,
      participantCount: participants,
      percentile: parseFloat(percentile as string) || 0,
      totalNet: totalNet,
      scores: newResult.scores,
    };

    if (!editingExamId && newResultMode === "global" && selectedGlobalExamId) {
      payload.globalExamId = selectedGlobalExamId;
    }

    if (newResult.examType === "YKS" && newResult.aytDate) {
      payload.aytDate = newResult.aytDate;
    }

    if (editingExamId) {
      await studentDataService.updateExamResult(editingExamId, payload);
    } else {
      await studentDataService.addExamResult(payload);
    }
    
    // Otomatik olarak Haftalık Programda Deneme'yi "yapıldı" olarak işaretle
    
      // Calculate total solved (Doğru + Yanlış)
      const totalSolved = Object.values(newResult.scores || {}).reduce((acc: number, curr: any) => {
        const correct = Number((curr as any).c) || Number((curr as any).correct) || 0;
        const incorrect = Number((curr as any).i) || Number((curr as any).incorrect) || 0;
        return acc + correct + incorrect;
      }, 0);

      // Calculate total questions (Doğru + Yanlış + Boş)
      const totalQuestions = Object.values(newResult.scores || {}).reduce((acc: number, curr: any) => {
        const correct = Number((curr as any).c) || Number((curr as any).correct) || 0;
        const incorrect = Number((curr as any).i) || Number((curr as any).incorrect) || 0;
        const blank = Number((curr as any).b) || Number((curr as any).blank) || 0;
        return acc + correct + incorrect + blank;
      }, 0);

      // If analyzed, use total questions (Doğru+Yanlış+Boş). Otherwise use total solved (Doğru+Yanlış).
      const finalCount = newResult.analyzed ? totalQuestions : totalSolved;
  
      try {
        if (currentUid) {
            const datesToUpdate = [newResult.date];
            if (newResult.examType === 'YKS' && newResult.aytDate && newResult.aytDate !== newResult.date) {
                datesToUpdate.push(newResult.aytDate);
            }

            await studentDataService.syncDailyProgramsWithExams(currentUid, datesToUpdate, userData);
        }
    } catch (e) {
        console.error('Haftalık program güncellenirken hata:', e);
    }

    setShowAddModal(false);
    setNewResult({
      examName: "",
      examType: "TYT",
      date: new Date().toISOString().split("T")[0],
      rank: "",
      participantCount: "",
      scores: {},
    });
    setEditingExamId(null);
    fetchExams();
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
          {((["9. Sınıf", "10. Sınıf", "11. Sınıf"].includes(studentProfile?.grade)) ? [studentProfile?.grade, "TYT", "BRANŞ"] : ["YKS", "TYT", "AYT", "YDT", "BRANŞ"]).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-6 py-2.5 rounded-lg text-sm font-bold uppercase tracking-widest transition-all whitespace-nowrap ${activeTab === tab ? "bg-indigo-600 text-white shadow-lg" : "text-slate-400 hover:text-white hover:bg-white/5"}`}
            >
              {tab}
            </button>
          ))}
        </div>

        <button
          onClick={() => {
            setEditingExamId(null);
            setNewResultMode("individual");
            setSelectedGlobalExamId("");
            setNewResult({
              examName: "",
              examType: activeTab,
              date: new Date().toISOString().split("T")[0],
              rank: "",
              participantCount: "",
              scores: {},
            });
            setShowAddModal(true);
          }}
          className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-2.5 px-6 rounded-xl transition-all flex items-center gap-2 shadow-lg shadow-emerald-600/20 whitespace-nowrap"
        >
          <Plus size={18} /> Yeni Deneme Ekle
        </button>
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
                  <th className="px-6 py-4">Durum</th>
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
                          setShowActionsFor(null);
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
                          {(() => {
                            const status = getAnalysisStatus(exam, activeTab);
                            if (activeTab === "YKS") {
                              if (status === "complete")
                                return (
                                  <span className="text-[10px] font-black uppercase text-emerald-400 bg-emerald-500/10 px-2 py-1 rounded border border-emerald-500/20">
                                    Analiz Tamamlandı
                                  </span>
                                );
                              if (status === "incomplete")
                                return (
                                  <span className="text-[10px] font-black uppercase text-amber-400 bg-amber-500/10 px-2 py-1 rounded border border-amber-500/20">
                                    Eksik Analiz
                                  </span>
                                );
                              return (
                                <span className="text-[10px] font-black uppercase text-slate-400 bg-slate-500/10 px-2 py-1 rounded border border-slate-500/20">
                                  Analiz Girilmedi
                                </span>
                              );
                            }

                            if (status === "complete") {
                              return (
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    navigate(
                                      `/panel/ogrenci/denemeler/${exam.id}/analiz?type=${activeTab}`,
                                    );
                                  }}
                                  className="text-[10px] font-black uppercase text-emerald-400 bg-emerald-500/10 hover:bg-emerald-500/20 px-2 py-1 rounded border border-emerald-500/20 transition-colors"
                                >
                                  Analiz Tamamlandı
                                </button>
                              );
                            }

                            if (status === "incomplete") {
                              return (
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    navigate(
                                      `/panel/ogrenci/denemeler/${exam.id}/analiz?type=${activeTab}`,
                                    );
                                  }}
                                  className="text-[10px] font-black uppercase text-amber-400 bg-amber-500/10 hover:bg-amber-500/20 px-2 py-1 rounded border border-amber-500/20 transition-colors"
                                >
                                  Eksik Analiz
                                </button>
                              );
                            }

                            return (
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  if (isBronze) {
                                    alert("Detaylı Deneme Analizi özelliği Gümüş ve Altın paket üyelerine özeldir. Lütfen paketinizi yükseltin!");
                                    return;
                                  }
                                  if (isSilver && exam.globalExamId) {
                                    alert("Kurumsal Deneme Analizi sadece Altın paket (Sınırsız Zirve VIP) üyelerine özeldir. Lütfen paketinizi yükseltin!");
                                    return;
                                  }
                                  navigate(
                                    `/panel/ogrenci/denemeler/${exam.id}/analiz?type=${activeTab}`,
                                  );
                                }}
                                className="text-[10px] font-black uppercase text-indigo-400 bg-indigo-500/10 hover:bg-indigo-500/20 px-2 py-1 rounded border border-indigo-500/20 transition-colors flex items-center gap-1"
                              >
                                {isBronze || (isSilver && exam.globalExamId) ? <Lock size={10} className="text-amber-500" /> : null}
                                Analiz Et
                              </button>
                            );
                          })()}
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
                              colSpan={6}
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

                                  <div className="relative">
                                    <button
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        setShowActionsFor(
                                          showActionsFor === exam.id
                                            ? null
                                            : exam.id,
                                        );
                                      }}
                                      className="p-2 hover:bg-white/10 text-slate-400 hover:text-white rounded-lg transition-colors"
                                    >
                                      <MoreHorizontal size={20} />
                                    </button>

                                    <AnimatePresence>
                                      {showActionsFor === exam.id && (
                                        <motion.div
                                          initial={{ opacity: 0, y: -10 }}
                                          animate={{ opacity: 1, y: 0 }}
                                          exit={{ opacity: 0, y: -10 }}
                                          className="absolute right-0 mt-2 w-48 bg-slate-800 border border-slate-700/50 rounded-xl shadow-2xl py-2 z-10"
                                        >
                                          <button
                                            onClick={(e) => {
                                              e.stopPropagation();
                                              setEditingExamId(exam.id);
                                              setNewResultMode(exam.globalExamId ? "global" : "individual");
                                              setSelectedGlobalExamId(exam.globalExamId || "");
                                              setNewResult({
                                                ...exam,
                                                date: formatDateForInput(
                                                  exam.date,
                                                ),
                                              });
                                              setShowAddModal(true);
                                              setShowActionsFor(null);
                                            }}
                                            className="w-full text-left px-4 py-2 hover:bg-white/5 text-sm text-slate-300 flex items-center gap-2"
                                          >
                                            <Edit2 size={16} /> Düzenle
                                          </button>
                                          <button
                                            onClick={(e) => {
                                              e.stopPropagation();
                                              if (isBronze) {
                                                alert("Detaylı Deneme Analizi özelliği Gümüş ve Altın paket üyelerine özeldir. Lütfen paketinizi yükseltin!");
                                                return;
                                              }
                                              if (isSilver && exam.globalExamId) {
                                                alert("Kurumsal Deneme Analizi sadece Altın paket (Sınırsız Zirve VIP) üyelerine özeldir. Lütfen paketinizi yükseltin!");
                                                return;
                                              }
                                              navigate(
                                                `/panel/ogrenci/denemeler/${exam.id}/analiz`,
                                              );
                                              setShowActionsFor(null);
                                            }}
                                            className="w-full text-left px-4 py-2 hover:bg-white/5 text-sm text-indigo-400 flex items-center gap-2"
                                          >
                                            {isBronze || (isSilver && exam.globalExamId) ? <Lock size={14} className="text-amber-500" /> : <LineChart size={16} />} Analiz Et
                                          </button>
                                          {exam.examType === "TYT" && (
                                            <button
                                              onClick={() => {
                                                setEditingExamId(exam.id);
                                                setNewResultMode(exam.globalExamId ? "global" : "individual");
                                                setSelectedGlobalExamId(exam.globalExamId || "");
                                                // Map TYT to YKS prefixed logic
                                                const mappedScores: any = {};
                                                if (exam.scores) {
                                                  Object.keys(
                                                    exam.scores,
                                                  ).forEach((k) => {
                                                    mappedScores[`TYT ${k}`] =
                                                      exam.scores[k];
                                                  });
                                                }
                                                setNewResult({
                                                  ...exam,
                                                  examType: "YKS",
                                                  scores: mappedScores,
                                                  date: formatDateForInput(
                                                    exam.date,
                                                  ),
                                                  aytDate: (() => {
                                                    if (exam.globalExamId) {
                                                      const mainGlobal =
                                                        globalExams.find(
                                                          (g) =>
                                                            g.id ===
                                                            exam.globalExamId,
                                                        );
                                                      const linkedGlobal =
                                                        mainGlobal?.linkedExamId
                                                          ? globalExams.find(
                                                              (g) =>
                                                                g.id ===
                                                                mainGlobal.linkedExamId,
                                                            )
                                                          : null;
                                                      if (linkedGlobal?.date)
                                                        return formatDateForInput(
                                                          linkedGlobal.date,
                                                        );
                                                    }
                                                    return undefined;
                                                  })(),
                                                });
                                                setShowAddModal(true);
                                                setShowActionsFor(null);
                                              }}
                                              className="w-full text-left px-4 py-2 hover:bg-white/5 text-sm text-indigo-400 flex items-center gap-2"
                                            >
                                              <Plus size={16} /> AYT Ekle (YKS)
                                            </button>
                                          )}
                                          <button
                                            onClick={async (e) => {
                                              e.stopPropagation();
                                              setExamToDelete(exam.id);
                                              setShowActionsFor(null);
                                            }}
                                            className="w-full text-left px-4 py-2 hover:bg-red-500/10 text-sm text-red-500 flex items-center gap-2"
                                          >
                                            <Trash2 size={16} /> Sil
                                          </button>
                                        </motion.div>
                                      )}
                                    </AnimatePresence>
                                  </div>
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

      {showAddModal && (
        <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-700/50 sm:rounded-2xl w-full max-w-4xl h-full sm:h-auto max-h-screen sm:max-h-[90vh] overflow-hidden shadow-2xl flex flex-col">
            <div className="p-6 border-b border-slate-800 flex justify-between items-center bg-slate-900/50 shrink-0">
              <h2 className="text-xl font-bold text-white flex items-center gap-2">
                <Trophy className="text-indigo-400" />
                {editingExamId
                  ? "Deneme Sonucunu Düzenle"
                  : "Yeni Deneme Sonucu"}
              </h2>
              <button
                type="button"
                onClick={() => setShowAddModal(false)}
                className="text-slate-500 hover:text-white p-2 rounded-xl hover:bg-white/5 transition-colors"
              >
                <X size={20} />
              </button>
            </div>

            <form
              onSubmit={handleAddSubmit}
              className="overflow-y-auto p-6 space-y-8 custom-scrollbar"
            >
              {!editingExamId && (
                <div className="flex gap-2 p-1 bg-slate-800/50 rounded-xl mb-4 w-fit border border-slate-700/50">
                  <button
                    type="button"
                    onClick={() => {
                      setNewResultMode("individual");
                      setSelectedGlobalExamId("");
                      setNewResult({ ...newResult, examName: "" });
                    }}
                    className={`px-4 py-2 rounded-lg text-sm font-bold transition-all ${newResultMode === "individual" ? "bg-indigo-600 text-white" : "text-slate-400 hover:text-white"}`}
                  >
                    Bireysel Deneme Girişi
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      if (isBronze) {
                        alert("Kurumsal Deneme Girişi özelliği Gümüş ve Altın paket üyelerine özeldir. Lütfen paketinizi yükseltin!");
                        return;
                      }
                      setNewResultMode("global");
                    }}
                    className={`px-4 py-2 rounded-lg text-sm font-bold transition-all ${newResultMode === "global" ? "bg-indigo-600 text-white" : "text-slate-400 hover:text-white"} ${isBronze ? "opacity-50" : ""}`}
                  >
                    Kurumsal Deneme Seç {isBronze && <Lock size={12} className="inline ml-1 text-amber-500" />}
                  </button>
                </div>
              )}

              {newResultMode === "global" && !editingExamId ? (
                <div className="space-y-4">
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-400 uppercase">
                      Kurumsal Deneme Seçin
                    </label>
                    <select
                      required
                      value={selectedGlobalExamId}
                      onChange={(e) => {
                        const val = e.target.value;
                        setSelectedGlobalExamId(val);
                        const selExam = globalExams.find((g) => g.id === val);
                        if (selExam) {
                          const autoDate = formatDateForInput(selExam.date || selExam.createdAt) || new Date().toISOString().split("T")[0];
                          setNewResult({
                            ...newResult,
                            examName:
                              selExam.title +
                              (selExam.publisher
                                ? ` (${selExam.publisher})`
                                : ""),
                            examType: selExam.type,
                            date: autoDate,
                            aytDate: autoDate,
                            scores: {},
                          });
                        }
                      }}
                      className="w-full bg-slate-800/50 border border-slate-700 rounded-xl p-3 text-sm text-white outline-none focus:border-indigo-500 appearance-none"
                    >
                      <option value="">Seçiniz...</option>
                      {globalExams.map((g) => (
                        <option key={g.id} value={g.id}>
                          {g.title} {g.publisher ? `(${g.publisher})` : ""} -{" "}
                          {g.type}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    <div className="space-y-1">
                      <label className="text-xs font-bold text-slate-400 uppercase">
                        Sınav Adı (Otomatik)
                      </label>
                      <input
                        type="text"
                        value={newResult.examName}
                        disabled
                        className="w-full bg-slate-800/20 border border-slate-700/50 rounded-xl p-3 text-sm text-slate-400 cursor-not-allowed"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-xs font-bold text-slate-400 uppercase">
                        Sınav Türü (Otomatik)
                      </label>
                      <input
                        type="text"
                        value={newResult.examType}
                        disabled
                        className="w-full bg-slate-800/20 border border-slate-700/50 rounded-xl p-3 text-sm text-slate-400 cursor-not-allowed"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-xs font-bold text-slate-400 uppercase">
                        {newResult.examType === "YKS" ? "TYT Tarihi" : "Sınav Tarihi"}
                      </label>
                      <input
                        required
                        type="date"
                        value={newResult.date}
                        onChange={(e) =>
                          setNewResult({ ...newResult, date: e.target.value })
                        }
                        className="w-full bg-slate-800/50 border border-slate-700 rounded-xl p-3 text-sm text-white outline-none focus:border-indigo-500"
                      />
                    </div>
                    {newResult.examType === "YKS" && (
                      <div className="space-y-1">
                        <label className="text-xs font-bold text-slate-400 uppercase">
                          AYT Tarihi
                        </label>
                        <input
                          required
                          type="date"
                          value={newResult.aytDate || ""}
                          onChange={(e) =>
                            setNewResult({ ...newResult, aytDate: e.target.value })
                          }
                          className="w-full bg-slate-800/50 border border-slate-700 rounded-xl p-3 text-sm text-white outline-none focus:border-indigo-500"
                        />
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-400 uppercase">
                      Sınav Adı
                    </label>
                    <input
                      required
                      type="text"
                      value={newResult.examName}
                      disabled={!!newResult.globalExamId}
                      onChange={(e) =>
                        setNewResult({ ...newResult, examName: e.target.value })
                      }
                      placeholder="Örn: 3D Türkiye Geneli"
                      className={`w-full border rounded-xl p-3 text-sm outline-none ${newResult.globalExamId ? "bg-slate-800/20 text-slate-400 border-slate-700/50 cursor-not-allowed" : "bg-slate-800/50 text-white border-slate-700 focus:border-indigo-500 placeholder-slate-600"}`}
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-400 uppercase">
                      Sınav Türü
                    </label>
                    <select
                      value={newResult.examType}
                      disabled={!!newResult.globalExamId}
                      onChange={(e) =>
                        setNewResult({
                          ...newResult,
                          examType: e.target.value,
                          scores: {},
                        })
                      }
                      className={`w-full border rounded-xl p-3 text-sm outline-none appearance-none ${newResult.globalExamId ? "bg-slate-800/20 text-slate-400 border-slate-700/50 cursor-not-allowed" : "bg-slate-800/50 text-white border-slate-700 focus:border-indigo-500"}`}
                    >
                      {isAraSinif && <option value={studentGrade}>{studentGrade}</option>}
                      <option value="TYT">TYT</option>
                      {!isAraSinif && <option value="AYT">AYT</option>}
                      {!isAraSinif && <option value="YDT">YDT</option>}
                      {!isAraSinif && <option value="YKS">YKS (TYT + AYT)</option>}
                      <option value="BRANŞ">Branş Denemesi</option>
                    </select>
                  </div>
                  {newResult.examType === "BRANŞ" && (
                    <div className="space-y-1">
                      <label className="text-xs font-bold text-slate-400 uppercase">
                        Branş Seçiniz
                      </label>
                      <select
                        onChange={(e) => {
                          const branchName = e.target.value;
                          const branch = getBranchByName(branchName);
                          if (branch) {
                            let initialScores: any = {};
                            const subBranches = BRANCH_COMPOSITES[branchName];
                            if (subBranches) {
                              subBranches.forEach((sb) => {
                                initialScores[sb] = { c: "", i: "", n: 0 };
                              });
                            } else {
                              initialScores[branch.name] = {
                                c: "",
                                i: "",
                                n: 0,
                              };
                            }
                            setNewResult({
                              ...newResult,
                              examName: branch.name + " Denemesi",
                              scores: initialScores,
                            });
                          }
                        }}
                        className="w-full bg-slate-800/50 border border-slate-700 rounded-xl p-3 text-sm text-white outline-none focus:border-indigo-500 appearance-none"
                      >
                        <option value="">Branş Seç...</option>
                        {BRANCH_CATEGORIES.map((category) => (
                          <optgroup
                            key={category.category}
                            label={category.category}
                            className="bg-slate-900 border-none text-indigo-400 font-bold"
                          >
                            {category.exams.map((b) => (
                              <option
                                key={b.name}
                                value={b.name}
                                className="text-white bg-slate-800 font-normal"
                              >
                                {b.name}
                              </option>
                            ))}
                          </optgroup>
                        ))}
                      </select>
                    </div>
                  )}
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-400 uppercase">
                      {newResult.examType === "YKS" ? "TYT Tarihi" : "Tarih"}
                    </label>
                    <input
                      required
                      type="date"
                      value={newResult.date}
                      onChange={(e) =>
                        setNewResult({ ...newResult, date: e.target.value })
                      }
                      className="w-full bg-slate-800/50 border border-slate-700 rounded-xl p-3 text-sm text-white outline-none focus:border-indigo-500"
                    />
                  </div>
                  {newResult.examType === "YKS" && (
                    <div className="space-y-1">
                      <label className="text-xs font-bold text-slate-400 uppercase">
                        AYT Tarihi
                      </label>
                      <input
                        required
                        type="date"
                        value={newResult.aytDate || ""}
                        onChange={(e) =>
                          setNewResult({
                            ...newResult,
                            aytDate: e.target.value,
                          })
                        }
                        className="w-full bg-slate-800/50 border border-slate-700 rounded-xl p-3 text-sm text-white outline-none focus:border-indigo-500"
                      />
                    </div>
                  )}
                </div>
              )}

              <div className="border-t border-slate-800 pt-6 grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-400 uppercase">
                    Sıralama (Opsiyonel)
                  </label>
                  <input
                    type="number"
                    value={newResult.rank}
                    onChange={(e) =>
                      setNewResult({ ...newResult, rank: e.target.value })
                    }
                    placeholder="Örn: 15400"
                    className="w-full bg-slate-800/50 border border-slate-700 rounded-xl p-3 text-sm text-white placeholder-slate-600 outline-none focus:border-indigo-500 appearance-none m-0"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-400 uppercase">
                    Katılımcı Sayısı (Opsiyonel)
                  </label>
                  <input
                    type="number"
                    value={newResult.participantCount}
                    onChange={(e) =>
                      setNewResult({
                        ...newResult,
                        participantCount: e.target.value,
                      })
                    }
                    placeholder="Örn: 100000"
                    className="w-full bg-slate-800/50 border border-slate-700 rounded-xl p-3 text-sm text-white placeholder-slate-600 outline-none focus:border-indigo-500 appearance-none m-0"
                  />
                </div>
                <div className="space-y-1 flex flex-col justify-end p-3 rounded-xl bg-slate-800/20 border border-slate-700/50">
                  <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">
                    Hesaplanan Yüzdelik
                  </p>
                  <p className="text-xl font-black text-emerald-400">
                    %
                    {calculatePercentile(
                      parseInt(newResult.rank),
                      parseInt(newResult.participantCount),
                    )}
                  </p>
                </div>
              </div>

              <div className="space-y-6 pt-6 border-t border-white/5">
                <h3 className="text-sm font-black text-white uppercase tracking-widest bg-white/5 inline-block px-3 py-1.5 rounded-lg border border-white/10">
                  Sınav Netleri: {newResult.examType}
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {newResult.examType === "BRANŞ"
                    ? Object.keys(newResult.scores).map((branchName) => {
                        const max = getBranchMax(branchName);
                        return (
                          <div
                            key={branchName}
                            className="bg-slate-800/20 border border-slate-700 rounded-2xl overflow-hidden p-1 shadow-lg h-fit"
                          >
                            <div className="px-4 py-3 bg-slate-800/50 border-b border-slate-700 flex justify-between items-center rounded-xl mb-2">
                              <span className="text-xs font-black text-indigo-300 uppercase tracking-widest">
                                {branchName}
                              </span>
                            </div>
                            <div className="grid grid-cols-12 gap-2 items-center p-2 mx-1">
                              <div className="col-span-4">
                                <input
                                  type="number"
                                  value={newResult.scores[branchName]?.c || ""}
                                  onChange={(e) =>
                                    handleScoreChange(
                                      branchName,
                                      max,
                                      "c",
                                      e.target.value,
                                    )
                                  }
                                  placeholder="D"
                                  className="w-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-center rounded text-xs p-1.5 outline-none focus:border-emerald-500"
                                />
                              </div>
                              <div className="col-span-4">
                                <input
                                  type="number"
                                  value={newResult.scores[branchName]?.i || ""}
                                  onChange={(e) =>
                                    handleScoreChange(
                                      branchName,
                                      max,
                                      "i",
                                      e.target.value,
                                    )
                                  }
                                  placeholder="Y"
                                  className="w-full bg-red-500/10 border border-red-500/20 text-red-400 text-center rounded text-xs p-1.5 outline-none focus:border-red-500"
                                />
                              </div>
                              <div className="col-span-4 text-right">
                                <span className="text-xs font-black text-white bg-slate-700/50 px-2 py-1.5 rounded inline-block min-w-[3rem]">
                                  {newResult.scores[branchName]?.n || 0} Net
                                </span>
                              </div>
                            </div>
                          </div>
                        );
                      })
                    : (EXAM_STRUCTURE[newResult.examType] || []).map(
                        (categoryGroup: any, idx: number) => {
                          let groupNet = 0;
                          categoryGroup.fields.forEach((f: any) => {
                            if (newResult.scores[f.name])
                              groupNet += newResult.scores[f.name].n || 0;
                          });

                          return (
                            <div
                              key={idx}
                              className="bg-slate-800/20 border border-slate-700 rounded-2xl overflow-hidden p-1 shadow-lg h-fit"
                            >
                              <div className="px-4 py-3 bg-slate-800/50 border-b border-slate-700 flex justify-between items-center rounded-xl mb-2">
                                <span className="text-xs font-black text-indigo-300 uppercase tracking-widest">
                                  {categoryGroup.category}
                                </span>
                                <span className="text-xs font-black text-white bg-indigo-500/20 border border-indigo-500/30 px-2 py-0.5 rounded">
                                  {groupNet.toFixed(2)} Net
                                </span>
                              </div>

                              <div className="space-y-1">
                                {categoryGroup.fields.map((fieldItem: any) => (
                                  <div
                                    key={fieldItem.name}
                                    className="grid grid-cols-12 gap-2 items-center bg-transparent p-2 rounded-lg hover:bg-white/5 transition-colors mx-1"
                                  >
                                    <div className={["9. Sınıf", "10. Sınıf", "11. Sınıf"].includes(newResult.examType) ? "col-span-4 flex-1 min-w-0" : "col-span-5 flex-1 min-w-0"}>
                                      <p
                                        className="text-[11px] font-bold text-slate-300 truncate"
                                        title={fieldItem.name}
                                      >
                                        {fieldItem.name}
                                      </p>
                                    </div>
                                    {["9. Sınıf", "10. Sınıf", "11. Sınıf"].includes(newResult.examType) && (
                                      <div className="col-span-2">
                                        <input
                                          type="number"
                                          value={
                                            newResult.scores[fieldItem.name]?.m !== undefined ? newResult.scores[fieldItem.name].m : fieldItem.max
                                          }
                                          onChange={(e) =>
                                            handleScoreChange(
                                              fieldItem.name,
                                              fieldItem.max,
                                              "m",
                                              e.target.value,
                                            )
                                          }
                                          placeholder="Soru"
                                          min="1"
                                          className="w-full bg-slate-700/30 border border-slate-600/50 text-slate-300 text-center rounded text-xs p-1.5 outline-none focus:border-indigo-500 appearance-none m-0"
                                        />
                                      </div>
                                    )}
                                    <div className="col-span-2">
                                      <input
                                        type="number"
                                        value={
                                          newResult.scores[fieldItem.name]?.c ||
                                          ""
                                        }
                                        onChange={(e) =>
                                          handleScoreChange(
                                            fieldItem.name,
                                            fieldItem.max,
                                            "c",
                                            e.target.value,
                                          )
                                        }
                                        placeholder="D"
                                        min="0"
                                        max={newResult.scores[fieldItem.name]?.m ?? fieldItem.max}
                                        className="w-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-center rounded text-xs p-1.5 outline-none focus:border-emerald-500 appearance-none m-0"
                                      />
                                    </div>
                                    <div className="col-span-2">
                                      <input
                                        type="number"
                                        value={
                                          newResult.scores[fieldItem.name]?.i ||
                                          ""
                                        }
                                        onChange={(e) =>
                                          handleScoreChange(
                                            fieldItem.name,
                                            fieldItem.max,
                                            "i",
                                            e.target.value,
                                          )
                                        }
                                        placeholder="Y"
                                        min="0"
                                        max={newResult.scores[fieldItem.name]?.m ?? fieldItem.max}
                                        className="w-full bg-red-500/10 border border-red-500/20 text-red-400 text-center rounded text-xs p-1.5 outline-none focus:border-red-500 appearance-none m-0"
                                      />
                                    </div>
                                    <div className={["9. Sınıf", "10. Sınıf", "11. Sınıf"].includes(newResult.examType) ? "col-span-2 text-right" : "col-span-3 text-right"}>
                                      <span className="text-xs font-black text-white bg-slate-700/50 px-2 py-1.5 rounded inline-block min-w-[2.5rem] text-center">
                                        {newResult.scores[fieldItem.name]?.n ||
                                          0}
                                      </span>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </div>
                          );
                        },
                      )}
                </div>
              </div>

              {/* Total Summary */}
              <div className="bg-indigo-600/10 border border-indigo-500/30 p-6 rounded-2xl flex items-center justify-between mt-8 sticky bottom-0 backdrop-blur-xl">
                <div>
                  <p className="text-[10px] font-black text-indigo-400 uppercase tracking-widest">
                    Hesaplanan Toplam
                  </p>
                  <p className="text-3xl font-black text-white mt-1">
                    {calculateTotalNet(newResult.scores, newResult.examType)}{" "}
                    <span className="text-sm font-bold text-indigo-300">
                      Net
                    </span>
                  </p>
                </div>
                <button
                  type="submit"
                  className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-3 px-8 rounded-xl transition-all shadow-[0_0_20px_rgba(5,150,105,0.4)] flex items-center gap-2"
                >
                  <Save size={18} /> Kaydet
                </button>
              </div>
              {formError && (
                <div className="bg-red-500/10 border border-red-500/50 text-red-400 p-4 rounded-xl text-sm mt-4">
                  {formError}
                </div>
              )}
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {examToDelete && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-slate-900 border border-slate-800 rounded-2xl p-6 max-w-sm w-full shadow-2xl"
          >
            <h3 className="text-xl font-bold text-white mb-2">Sınavı Sil</h3>
            <p className="text-slate-400 mb-6">
              Bu sınav sonucunu silmek istediğinize emin misiniz? Bu işlem geri
              alınamaz.
            </p>
            <div className="flex gap-3 justify-end">
              <button
                onClick={() => setExamToDelete(null)}
                className="px-4 py-2 text-slate-300 hover:text-white transition-colors"
              >
                İptal
              </button>
              <button
                onClick={async () => {
                  try {
                    const deletedExam = exams.find(e => e.id === examToDelete);
                    await studentDataService.deleteExamResult(examToDelete);
                    
                    if (currentUid && deletedExam) {
                        const datesToUpdate = [deletedExam.date];
                        if (deletedExam.examType === 'YKS' && deletedExam.aytDate && deletedExam.aytDate !== deletedExam.date) {
                            datesToUpdate.push(deletedExam.aytDate);
                        }
                        await studentDataService.syncDailyProgramsWithExams(currentUid, datesToUpdate, userData);
                    }

                    setExamToDelete(null);
                    fetchExams();
                  } catch (err) {
                    console.error("Silme hatası:", err);
                  }
                }}
                className="px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded-lg transition-colors"
              >
                Evet, Sil
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
}
