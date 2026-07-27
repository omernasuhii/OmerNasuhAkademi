import React, { useState, useEffect } from "react";
import {
  Target,
  Plus,
  Search,
  Edit2,
  Trash2,
  Filter,
  LayoutList,
  CheckCircle2,
  ChevronRight,
  Save,
} from "lucide-react";
import { studentDataService } from "../../services/studentDataService";
import { useCurriculum } from "../../lib/CurriculumContext";
import { formatDriveUrl } from "../../lib/formatDriveUrl";

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

export default function AdminAcademicExams() {
  const { curriculum } = useCurriculum();
  const [exams, setExams] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [typeFilter, setTypeFilter] = useState("Hepsi");

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingExam, setEditingExam] = useState<any>(null);

  const [isQuestionModalOpen, setIsQuestionModalOpen] = useState(false);
  const [selectedExam, setSelectedExam] = useState<any>(null);
  const [activeSection, setActiveSection] = useState<string>("");
  const [examQuestions, setExamQuestions] = useState<any[]>([]);
  const [savingQuestions, setSavingQuestions] = useState(false);

  const [formData, setFormData] = useState({
    title: "",
    type: "TYT",
    date: "",
    publisher: "",
    linkedExamIds: [] as string[],
    sections: [] as { name: string; maxQuestion: number; maxScore: number }[],
  });

  const defaultTemplates = {
    TYT: [
      { name: "Türkçe", maxQuestion: 40, maxScore: 40 },
      { name: "Sosyal Bilimler", maxQuestion: 20, maxScore: 20 },
      { name: "Temel Matematik", maxQuestion: 40, maxScore: 40 },
      { name: "Fen Bilimleri", maxQuestion: 20, maxScore: 20 },
    ],
    AYT: [
      { name: "Türk Dili ve Edebiyatı", maxQuestion: 24, maxScore: 24 },
      { name: "Tarih-1", maxQuestion: 10, maxScore: 10 },
      { name: "Coğrafya-1", maxQuestion: 6, maxScore: 6 },
      { name: "Tarih-2", maxQuestion: 11, maxScore: 11 },
      { name: "Coğrafya-2", maxQuestion: 11, maxScore: 11 },
      { name: "Felsefe Grubu", maxQuestion: 12, maxScore: 12 },
      { name: "Din Kültürü", maxQuestion: 6, maxScore: 6 },
      { name: "Matematik", maxQuestion: 40, maxScore: 40 },
      { name: "Fizik", maxQuestion: 14, maxScore: 14 },
      { name: "Kimya", maxQuestion: 13, maxScore: 13 },
      { name: "Biyoloji", maxQuestion: 13, maxScore: 13 },
    ],
    "AYT+YDT": [
      { name: "Türk Dili ve Edebiyatı", maxQuestion: 24, maxScore: 24 },
      { name: "Tarih-1", maxQuestion: 10, maxScore: 10 },
      { name: "Coğrafya-1", maxQuestion: 6, maxScore: 6 },
      { name: "Tarih-2", maxQuestion: 11, maxScore: 11 },
      { name: "Coğrafya-2", maxQuestion: 11, maxScore: 11 },
      { name: "Felsefe Grubu", maxQuestion: 12, maxScore: 12 },
      { name: "Din Kültürü", maxQuestion: 6, maxScore: 6 },
      { name: "Matematik", maxQuestion: 40, maxScore: 40 },
      { name: "Fizik", maxQuestion: 14, maxScore: 14 },
      { name: "Kimya", maxQuestion: 13, maxScore: 13 },
      { name: "Biyoloji", maxQuestion: 13, maxScore: 13 },
      { name: "Yabancı Dil", maxQuestion: 80, maxScore: 80 },
    ],
    YDT: [{ name: "Yabancı Dil", maxQuestion: 80, maxScore: 80 }],
    "9. Sınıf": [
      { name: "Türk Dili ve Edebiyatı", maxQuestion: 30, maxScore: 30 },
      { name: "Tarih", maxQuestion: 15, maxScore: 15 },
      { name: "Coğrafya", maxQuestion: 15, maxScore: 15 },
      { name: "Din Kültürü", maxQuestion: 10, maxScore: 10 },
      { name: "Matematik", maxQuestion: 30, maxScore: 30 },
      { name: "Fizik", maxQuestion: 10, maxScore: 10 },
      { name: "Kimya", maxQuestion: 10, maxScore: 10 },
      { name: "Biyoloji", maxQuestion: 10, maxScore: 10 },
    ],
    "10. Sınıf": [
      { name: "Türk Dili ve Edebiyatı", maxQuestion: 30, maxScore: 30 },
      { name: "Tarih", maxQuestion: 15, maxScore: 15 },
      { name: "Coğrafya", maxQuestion: 15, maxScore: 15 },
      { name: "Din Kültürü", maxQuestion: 10, maxScore: 10 },
      { name: "Matematik", maxQuestion: 30, maxScore: 30 },
      { name: "Fizik", maxQuestion: 10, maxScore: 10 },
      { name: "Kimya", maxQuestion: 10, maxScore: 10 },
      { name: "Biyoloji", maxQuestion: 10, maxScore: 10 },
    ],
    "11. Sınıf": [
      { name: "Türk Dili ve Edebiyatı", maxQuestion: 30, maxScore: 30 },
      { name: "Tarih", maxQuestion: 15, maxScore: 15 },
      { name: "Coğrafya", maxQuestion: 15, maxScore: 15 },
      { name: "Din Kültürü", maxQuestion: 10, maxScore: 10 },
      { name: "Matematik", maxQuestion: 30, maxScore: 30 },
      { name: "Fizik", maxQuestion: 10, maxScore: 10 },
      { name: "Kimya", maxQuestion: 10, maxScore: 10 },
      { name: "Biyoloji", maxQuestion: 10, maxScore: 10 },
    ],
  };

  useEffect(() => {
    loadExams();
  }, []);

  const loadExams = async () => {
    setLoading(true);
    const data = await studentDataService.getGlobalAcademicExams();
    setExams(data);
    setLoading(false);
  };

  const getTopicsForSection = (
    examType: string,
    sectionName: string,
    questionNo: number,
  ): string[] => {
    if (examType === "TYT") {
      if (sectionName === "Türkçe")
        return [
          ...(curriculum["Türkçe"] || []),
          ...(curriculum["Paragraf"] || []),
        ];
      if (sectionName === "Sosyal Bilimler") {
        if (questionNo <= 5)
          return curriculum["TYT Tarih"] || curriculum["Tarih"] || [];
        if (questionNo <= 10)
          return curriculum["TYT Coğrafya"] || curriculum["Coğrafya"] || [];
        if (questionNo <= 15) return curriculum["Felsefe"] || [];
        return curriculum["Din"] || [];
      }
      if (sectionName === "Temel Matematik") {
        return [
          ...(curriculum["TYT Matematik"] || curriculum["Matematik"] || []),
          ...(curriculum["Problem"] || []),
          ...(curriculum["Geometri"] || []),
        ];
      }
      if (sectionName === "Fen Bilimleri") {
        if (questionNo <= 7)
          return curriculum["TYT Fizik"] || curriculum["Fizik"] || [];
        if (questionNo <= 14)
          return curriculum["TYT Kimya"] || curriculum["Kimya"] || [];
        return curriculum["TYT Biyoloji"] || curriculum["Biyoloji"] || [];
      }
    } else if (examType === "AYT" || examType === "AYT+YDT" || examType === "AYT + YDT") {
      if (sectionName === "Türk Dili ve Edebiyatı")
        return curriculum["Edebiyat"] || [];
      if (sectionName === "Tarih-1" || sectionName === "Tarih-2")
        return curriculum["AYT Tarih"] || [];
      if (sectionName === "Coğrafya-1" || sectionName === "Coğrafya-2")
        return curriculum["AYT Coğrafya"] || [];
      if (sectionName === "Felsefe Grubu")
        return curriculum["Felsefe Grubu"] || [];
      if (sectionName === "Din Kültürü") return curriculum["AYT Din"] || [];
      if (sectionName === "Matematik") {
        return [
          ...(curriculum["AYT Matematik"] || curriculum["Matematik"] || []),
          ...(curriculum["Geometri"] || []),
        ];
      }
      if (sectionName === "Fizik")
        return curriculum["AYT Fizik"] || curriculum["Fizik"] || [];
      if (sectionName === "Kimya")
        return curriculum["AYT Kimya"] || curriculum["Kimya"] || [];
      if (sectionName === "Biyoloji")
        return curriculum["AYT Biyoloji"] || curriculum["Biyoloji"] || [];
      if (sectionName === "Yabancı Dil")
        return [
          ...(curriculum["Yabancı Dil"] || []),
          ...(curriculum["İngilizce"] || []),
          ...(curriculum["Grammar"] || []),
          ...(curriculum["Vocabulary"] || []),
          ...(curriculum["Reading"] || []),
          ...(curriculum["Skills Questions"] || []),
        ];
    } else if (examType === "YDT") {
      if (sectionName === "Yabancı Dil")
        return [
          ...(curriculum["Yabancı Dil"] || []),
          ...(curriculum["İngilizce"] || []),
          ...(curriculum["Grammar"] || []),
          ...(curriculum["Vocabulary"] || []),
          ...(curriculum["Reading"] || []),
          ...(curriculum["Skills Questions"] || []),
        ];
    } else if (examType === "9. Sınıf") {
      if (sectionName === "Türk Dili ve Edebiyatı")
        return curriculum["9. Sınıf Edebiyat"] || curriculum["Edebiyat"] || [];
      if (sectionName === "Tarih")
        return curriculum["9. Sınıf Tarih"] || curriculum["Tarih"] || [];
      if (sectionName === "Coğrafya")
        return curriculum["9. Sınıf Coğrafya"] || curriculum["Coğrafya"] || [];
      if (sectionName === "Matematik")
        return (
          curriculum["9. Sınıf Matematik"] || curriculum["Matematik"] || []
        );
      if (sectionName === "Fizik")
        return curriculum["9. Sınıf Fizik"] || curriculum["Fizik"] || [];
      if (sectionName === "Kimya")
        return curriculum["9. Sınıf Kimya"] || curriculum["Kimya"] || [];
      if (sectionName === "Biyoloji")
        return curriculum["9. Sınıf Biyoloji"] || curriculum["Biyoloji"] || [];
      if (sectionName === "Din Kültürü")
        return curriculum["9. Sınıf Din"] || curriculum["Din"] || [];
    } else if (examType === "10. Sınıf") {
      if (sectionName === "Türk Dili ve Edebiyatı")
        return curriculum["10. Sınıf Edebiyat"] || curriculum["Edebiyat"] || [];
      if (sectionName === "Tarih")
        return curriculum["10. Sınıf Tarih"] || curriculum["Tarih"] || [];
      if (sectionName === "Coğrafya")
        return curriculum["10. Sınıf Coğrafya"] || curriculum["Coğrafya"] || [];
      if (sectionName === "Matematik")
        return (
          curriculum["10. Sınıf Matematik"] || curriculum["Matematik"] || []
        );
      if (sectionName === "Fizik")
        return curriculum["10. Sınıf Fizik"] || curriculum["Fizik"] || [];
      if (sectionName === "Kimya")
        return curriculum["10. Sınıf Kimya"] || curriculum["Kimya"] || [];
      if (sectionName === "Biyoloji")
        return curriculum["10. Sınıf Biyoloji"] || curriculum["Biyoloji"] || [];
      if (sectionName === "Din Kültürü")
        return curriculum["10. Sınıf Din"] || curriculum["Din"] || [];
    } else if (examType === "11. Sınıf") {
      if (sectionName === "Türk Dili ve Edebiyatı")
        return curriculum["11. Sınıf Edebiyat"] || curriculum["Edebiyat"] || [];
      if (sectionName === "Tarih")
        return curriculum["11. Sınıf Tarih"] || curriculum["Tarih"] || [];
      if (sectionName === "Coğrafya")
        return curriculum["11. Sınıf Coğrafya"] || curriculum["Coğrafya"] || [];
      if (sectionName === "Matematik")
        return (
          curriculum["11. Sınıf Matematik"] || curriculum["Matematik"] || []
        );
      if (sectionName === "Fizik")
        return curriculum["11. Sınıf Fizik"] || curriculum["Fizik"] || [];
      if (sectionName === "Kimya")
        return curriculum["11. Sınıf Kimya"] || curriculum["Kimya"] || [];
      if (sectionName === "Biyoloji")
        return curriculum["11. Sınıf Biyoloji"] || curriculum["Biyoloji"] || [];
      if (sectionName === "Din Kültürü")
        return curriculum["11. Sınıf Din"] || curriculum["Din"] || [];
    }

    // Fallback flatten all
    return Object.values(curriculum).flat();
  };

  const handleOpenModal = (exam: any = null) => {
    if (exam) {
      setEditingExam(exam);
      const sections = exam.sections || defaultTemplates[exam.type as keyof typeof defaultTemplates] || defaultTemplates["TYT"];
      setFormData({
        title: exam.title || "",
        type: exam.type || "TYT",
        date: exam.date || "",
        publisher: exam.publisher || "",
        linkedExamIds: exam.linkedExamIds || (exam.linkedExamId ? [exam.linkedExamId] : []),
        sections: sections,
      });
    } else {
      setEditingExam(null);
      setFormData({
        title: "",
        type: "TYT",
        date: "",
        publisher: "",
        linkedExamIds: [],
        sections: defaultTemplates["TYT"],
      });
    }
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingExam(null);
  };

  const handleSaveExam = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title) {
      alert("Lütfen deneme adını girin.");
      return;
    }

    const examToSave = {
      ...(editingExam || {}),
      ...formData,
    };

    try {
      await studentDataService.saveGlobalAcademicExam(examToSave);
      await loadExams();
      handleCloseModal();
    } catch (error) {
      alert("Deneme kaydedilirken bir hata oluştu");
    }
  };

  const handleOpenQuestionModal = (exam: any) => {
    const examSections = exam.sections || defaultTemplates[exam.type as keyof typeof defaultTemplates] || [];
    const examWithSections = { ...exam, sections: examSections };
    setSelectedExam(examWithSections);

    let initialQuestions = exam.questions || [];
    const newQs: any[] = [...initialQuestions];
    examSections.forEach((sec: any) => {
      const existingSecQs = newQs.filter((q) => q.sectionName === sec.name);
      if (existingSecQs.length === 0) {
        for (let i = 1; i <= sec.maxQuestion; i++) {
          newQs.push({
            id: `${sec.name}-${i}`,
            sectionName: sec.name,
            number: i,
            subject: "",
            answer: "",
            imageUrl: "",
          });
        }
      }
    });

    setExamQuestions(newQs);
    if (examSections && examSections.length > 0) {
      setActiveSection(examSections[0].name);
    }
    setIsQuestionModalOpen(true);
  };

  const handleSaveQuestions = async () => {
    if (!selectedExam) return;
    setSavingQuestions(true);
    try {
      const examSections = selectedExam.sections || defaultTemplates[selectedExam.type as keyof typeof defaultTemplates] || [];
      const updatedExam = { ...selectedExam, sections: examSections, questions: examQuestions };
      await studentDataService.saveGlobalAcademicExam(updatedExam);
      alert("Soru havuzu başarıyla güncellendi.");
      await loadExams();
      setIsQuestionModalOpen(false);
    } catch (err) {
      alert("Kaydedilirken hata oluştu.");
    }
    setSavingQuestions(false);
  };

  const handleDeleteExam = async (id: string) => {
    if (window.confirm("Bu denemeyi silmek istediğinize emin misiniz?")) {
      try {
        await studentDataService.deleteGlobalAcademicExam(id);
        await loadExams();
      } catch (error) {
        alert("Deneme silinirken bir hata oluştu");
      }
    }
  };

  const filteredExams = exams.filter((e) => {
    const matchesSearch =
      e.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      e.publisher?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = typeFilter === "Hepsi" || e.type === typeFilter;
    return matchesSearch && matchesType;
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-white tracking-tight uppercase">
            Deneme Sınavları
          </h1>
          <p className="text-slate-400 text-sm">
            Merkezi Türkiye geneli ve kurumsal denemeleri yönetin.
          </p>
        </div>
        <button
          onClick={() => handleOpenModal()}
          className="flex items-center gap-2 bg-emerald-500 hover:bg-emerald-600 text-white px-4 py-2 rounded-lg font-bold transition-colors"
        >
          <Plus size={20} />
          Yeni Deneme Ekle
        </button>
      </div>

      <div className="flex flex-col md:flex-row gap-4">
        <div className="flex-1 relative">
          <Search
            className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
            size={20}
          />
          <input
            type="text"
            placeholder="Deneme adı veya yayın adı ara..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-slate-800 border border-white/10 rounded-lg pl-10 pr-4 py-2 text-sm text-white placeholder-slate-500 outline-none focus:border-emerald-500/50"
          />
        </div>
        <div className="flex items-center gap-2">
          <Filter size={20} className="text-slate-400" />
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="bg-slate-800 border border-white/10 rounded-lg px-3 py-2 text-sm text-white outline-none focus:border-emerald-500/50"
          >
            <option value="Hepsi">Tüm Türler</option>
            <optgroup label="YKS">
              <option value="TYT">TYT</option>
              <option value="AYT">AYT</option>
              <option value="AYT+YDT">AYT+YDT</option>
              <option value="YDT">YDT</option>
            </optgroup>
            <optgroup label="Ara Sınıflar">
              <option value="9. Sınıf">9. Sınıf</option>
              <option value="10. Sınıf">10. Sınıf</option>
              <option value="11. Sınıf">11. Sınıf</option>
            </optgroup>
            <optgroup label="Diğer">
              <option value="DİĞER">DİĞER</option>
            </optgroup>
          </select>
        </div>
      </div>

      <div className="bg-slate-800/50 rounded-xl border border-white/10 overflow-hidden">
        <div className="grid grid-cols-12 gap-4 p-4 text-xs font-bold text-slate-400 border-b border-white/10 uppercase tracking-wider">
          <div className="col-span-5">Deneme Adı & Yayın</div>
          <div className="col-span-2">Sınav Türü</div>
          <div className="col-span-2">Tarih</div>
          <div className="col-span-3 text-right">İşlemler</div>
        </div>

        {loading ? (
          <div className="p-8 text-center text-slate-400">Yükleniyor...</div>
        ) : filteredExams.length === 0 ? (
          <div className="p-8 text-center text-slate-400">
            Deneme bulunamadı.
          </div>
        ) : (
          <div className="divide-y divide-white/5 max-h-[600px] overflow-y-auto">
            {filteredExams.map((exam: any) => (
              <div
                key={exam.id}
                className="grid grid-cols-12 gap-4 p-4 text-sm items-center hover:bg-white/5 transition-colors"
              >
                <div className="col-span-5 text-white font-medium break-words">
                  <div className="flex items-center gap-2">
                    <Target size={16} className="text-emerald-400 shrink-0" />
                    <span className="truncate">
                      {exam.title || "İsimsiz Deneme"}
                    </span>
                  </div>
                  <div className="text-[11px] text-slate-500 mt-0.5 ml-6 line-clamp-1">
                    {exam.publisher || "Yayın belirtilmemiş"}
                    {(() => {
                      const linkedIds = exam.linkedExamIds || (exam.linkedExamId ? [exam.linkedExamId] : []);
                      const linkedExams = exams.filter(e => linkedIds.includes(e.id) || e.linkedExamIds?.includes(exam.id) || e.linkedExamId === exam.id);
                      if (linkedExams.length > 0) {
                        return linkedExams.map(linked => (
                          <span key={linked.id} className="ml-2 text-indigo-400 border border-indigo-500/30 bg-indigo-500/10 px-1.5 py-0.5 rounded text-[10px]">
                            🔗 Bağlantılı: {linked.title || "Bilinmiyor"}
                          </span>
                        ));
                      }
                      return null;
                    })()}
                  </div>
                </div>
                <div className="col-span-2">
                  <span
                    className={`px-2 py-1 rounded-full text-[10px] font-bold ${
                      exam.type === "AYT"
                        ? "bg-blue-500/20 text-blue-400"
                        : exam.type === "AYT+YDT"
                          ? "bg-indigo-500/20 text-indigo-400"
                          : exam.type === "YDT"
                            ? "bg-purple-500/20 text-purple-400"
                            : "bg-amber-500/20 text-amber-400"
                    }`}
                  >
                    {exam.type}
                  </span>
                </div>
                <div className="col-span-2 text-slate-400 text-xs">
                  {safeFormatDate(exam.date) || "Tarih Belirtilmemiş"}
                </div>
                <div className="col-span-3 flex items-center justify-end gap-2">
                  <button
                    onClick={() => handleOpenQuestionModal(exam)}
                    className="px-3 py-1.5 flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest bg-blue-500/10 text-blue-400 hover:bg-blue-500/20 rounded-lg border border-blue-500/20 transition-all"
                  >
                    <LayoutList size={14} /> Sorular
                  </button>
                  <button
                    onClick={() => handleOpenModal(exam)}
                    className="p-2 text-slate-400 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
                    title="Deneme Bilgilerini Düzenle"
                  >
                    <Edit2 size={16} />
                  </button>
                  <button
                    onClick={() => handleDeleteExam(exam.id)}
                    className="p-2 text-red-400 hover:text-red-300 hover:bg-red-500/20 rounded-lg transition-colors"
                    title="Sil"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-white/10 sm:rounded-2xl p-6 w-full max-w-2xl h-full sm:h-auto max-h-screen sm:max-h-[90vh] overflow-y-auto">
            <h2 className="text-xl font-black text-white mb-6 uppercase tracking-tight">
              {editingExam ? "Denemeyi Düzenle" : "Yeni Deneme Ekle"}
            </h2>

            <form onSubmit={handleSaveExam} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="col-span-2">
                  <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">
                    Deneme Adı
                  </label>
                  <input
                    type="text"
                    value={formData.title}
                    onChange={(e) =>
                      setFormData({ ...formData, title: e.target.value })
                    }
                    className="w-full bg-black/20 border border-white/10 rounded-lg p-3 text-sm text-white outline-none focus:border-emerald-500/50"
                    placeholder="Örn: 3D Türkiye Geneli TYT Denemesi"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">
                    Sınav Türü
                  </label>
                  <select
                    value={formData.type}
                    onChange={(e) => {
                      const newType = e.target.value;
                      setFormData({
                        ...formData,
                        type: newType,
                        sections:
                          defaultTemplates[
                            newType as keyof typeof defaultTemplates
                          ] || [],
                      });
                    }}
                    className="w-full bg-black/20 border border-white/10 rounded-lg p-3 text-sm text-white outline-none focus:border-emerald-500/50"
                  >
                    <optgroup label="YKS">
                      <option value="TYT">TYT</option>
                      <option value="AYT">AYT</option>
                      <option value="AYT+YDT">AYT+YDT</option>
                      <option value="YDT">YDT</option>
                    </optgroup>
                    <optgroup label="Ara Sınıflar">
                      <option value="9. Sınıf">9. Sınıf</option>
                      <option value="10. Sınıf">10. Sınıf</option>
                      <option value="11. Sınıf">11. Sınıf</option>
                    </optgroup>
                    <optgroup label="Diğer">
                      <option value="DİĞER">DİĞER</option>
                    </optgroup>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">
                    Yayın Evi
                  </label>
                  <input
                    type="text"
                    value={formData.publisher}
                    onChange={(e) =>
                      setFormData({ ...formData, publisher: e.target.value })
                    }
                    className="w-full bg-black/20 border border-white/10 rounded-lg p-3 text-sm text-white outline-none focus:border-emerald-500/50"
                    placeholder="Örn: 3D Yayınları"
                  />
                </div>

                {formData.type === "TYT" && (
                <div className="col-span-2">
                  <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">
                    Bağlantılı AYT Denemesi (İsteğe Bağlı)
                  </label>
                  <select
                    value={formData.linkedExamIds?.find(id => {
                      const t = exams.find(e => e.id === id)?.type;
                      return t === 'AYT' || t === 'AYT+YDT';
                    }) || ""}
                    onChange={(e) => {
                      const otherIds = formData.linkedExamIds?.filter(id => {
                        const t = exams.find(ex => ex.id === id)?.type;
                        return t !== 'AYT' && t !== 'AYT+YDT';
                      }) || [];
                      const newIds = e.target.value ? [...otherIds, e.target.value] : otherIds;
                      setFormData({ ...formData, linkedExamIds: newIds });
                    }}
                    className="w-full bg-black/20 border border-white/10 rounded-lg p-3 text-sm text-white outline-none focus:border-emerald-500/50 mb-4"
                  >
                    <option value="">Bağlantılı AYT / AYT+YDT sınavı yok</option>
                    {exams
                      .filter((e) => e.id !== editingExam?.id && (e.type === 'AYT' || e.type === 'AYT+YDT'))
                      .map((exam) => (
                        <option key={exam.id} value={exam.id}>
                          {exam.type} - {exam.title} ({safeFormatDate(exam.createdAt || exam.date)})
                        </option>
                      ))}
                  </select>

                  <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 mt-4">
                    Bağlantılı YDT Denemesi (İsteğe Bağlı)
                  </label>
                  <select
                    value={formData.linkedExamIds?.find(id => exams.find(e => e.id === id)?.type === 'YDT') || ""}
                    onChange={(e) => {
                      const otherIds = formData.linkedExamIds?.filter(id => exams.find(ex => ex.id === id)?.type !== 'YDT') || [];
                      const newIds = e.target.value ? [...otherIds, e.target.value] : otherIds;
                      setFormData({ ...formData, linkedExamIds: newIds });
                    }}
                    className="w-full bg-black/20 border border-white/10 rounded-lg p-3 text-sm text-white outline-none focus:border-emerald-500/50"
                  >
                    <option value="">Bağlantılı YDT sınavı yok</option>
                    {exams
                      .filter((e) => e.id !== editingExam?.id && e.type === 'YDT')
                      .map((exam) => (
                        <option key={exam.id} value={exam.id}>
                          {exam.type} - {exam.title} ({safeFormatDate(exam.createdAt || exam.date)})
                        </option>
                      ))}
                  </select>
                  <p className="text-xs text-slate-500 mt-2">
                    Bu TYT denemesini hem AYT hem de YDT denemeleri ile ilişkilendirebilirsiniz.
                  </p>
                </div>
                )}

                <div className="col-span-2">
                  <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">
                    Uygulama Tarihi
                  </label>
                  <input
                    type="date"
                    value={formData.date}
                    onChange={(e) =>
                      setFormData({ ...formData, date: e.target.value })
                    }
                    className="w-full bg-black/20 border border-white/10 rounded-lg p-3 text-sm text-white outline-none focus:border-emerald-500/50 [color-scheme:dark]"
                  />
                </div>
              </div>

              {formData.sections && formData.sections.length > 0 && (
                <div className="mt-6">
                  <h3 className="text-sm font-bold text-white mb-4">
                    Sınav Bölümleri
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {formData.sections.map((section, idx) => (
                      <div
                        key={idx}
                        className="bg-white/5 border border-white/10 rounded-lg p-3"
                      >
                        <div className="text-sm font-bold text-emerald-400 mb-2">
                          {section.name}
                        </div>
                        <div className="flex items-center gap-4 text-xs text-slate-300">
                          <div>Soru Sayısı: {section.maxQuestion}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                  <p className="text-xs text-slate-500 mt-2">
                    Bölüm şablonları şu an {formData.type} için otomatiktir.
                  </p>
                </div>
              )}

              <div className="flex items-center justify-end gap-3 pt-6 border-t border-white/10">
                <button
                  type="button"
                  onClick={handleCloseModal}
                  className="px-6 py-2 text-sm font-bold text-slate-400 hover:text-white transition-colors"
                >
                  İptal
                </button>
                <button
                  type="submit"
                  className="px-6 py-2 bg-emerald-500 hover:bg-emerald-600 text-white text-sm font-bold rounded-lg transition-colors"
                >
                  {editingExam ? "Güncelle" : "Kaydet"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {isQuestionModalOpen && selectedExam && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-white/10 sm:rounded-2xl w-full max-w-6xl h-full sm:h-auto max-h-screen sm:max-h-[95vh] overflow-hidden flex flex-col">
            <div className="p-6 border-b border-white/10 flex items-center justify-between shrink-0">
              <div>
                <h2 className="text-xl font-black text-white uppercase tracking-tight flex items-center gap-2">
                  <LayoutList className="text-emerald-400" />
                  Soru Havuzu: {selectedExam.title}
                </h2>
                <p className="text-sm text-slate-400 mt-1">
                  Bu denemenin konu analizi, cevap anahtarı ve soru görsellerini
                  tanımlayın.
                </p>
              </div>
              <button
                onClick={() => setIsQuestionModalOpen(false)}
                className="text-slate-500 hover:text-white transition-colors"
              >
                ✕
              </button>
            </div>

            <div className="flex flex-1 overflow-hidden">
              {/* Sidebar: Sections */}
              <div className="w-1/4 bg-black/20 border-r border-white/10 p-4 overflow-y-auto">
                <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-4">
                  Bölümler
                </h3>
                <div className="space-y-2">
                  {selectedExam.sections?.map((sec: any) => {
                    const secQuestions = examQuestions.filter(
                      (q) => q.sectionName === sec.name,
                    );
                    const filledCount = secQuestions.filter(
                      (q) => q.subject || q.answer || q.imageUrl,
                    ).length;
                    const isActive = activeSection === sec.name;

                    return (
                      <button
                        key={sec.name}
                        onClick={() => setActiveSection(sec.name)}
                        className={`w-full flex items-center justify-between p-3 rounded-xl border transition-all ${
                          isActive
                            ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-400"
                            : "bg-white/5 border-white/5 text-slate-300 hover:bg-white/10 hover:border-white/10"
                        }`}
                      >
                        <span className="font-bold text-sm truncate">
                          {sec.name}
                        </span>
                        <span
                          className={`text-[10px] px-2 py-0.5 rounded-full ${filledCount === sec.maxQuestion ? "bg-emerald-500/20 text-emerald-400" : "bg-slate-800 text-slate-400"}`}
                        >
                          {filledCount}/{sec.maxQuestion}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Main Area: Questions list for Active Section */}
              <div className="w-3/4 p-6 overflow-y-auto bg-slate-900/50">
                <div className="space-y-4">
                  {examQuestions
                    .filter((q) => q.sectionName === activeSection)
                    .map((qInfo, idx) => (
                      <div
                        key={qInfo.id}
                        className="bg-white/5 border border-white/10 rounded-xl p-4 flex gap-4 items-start"
                      >
                        <div className="w-12 h-12 rounded-full bg-slate-800 flex items-center justify-center font-black text-lg text-slate-400 shrink-0 border border-white/5">
                          {qInfo.number}
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 flex-1">
                          <div>
                            <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">
                              Konu Seçiniz
                            </label>
                            <select
                              value={qInfo.subject || ""}
                              onChange={(e) => {
                                const newQs = [...examQuestions];
                                const targetIndex = newQs.findIndex(
                                  (x) => x.id === qInfo.id,
                                );
                                if (targetIndex > -1)
                                  newQs[targetIndex].subject = e.target.value;
                                setExamQuestions(newQs);
                              }}
                              className="w-full bg-black/40 border border-white/10 rounded-lg px-3 py-2 text-sm text-white outline-none focus:border-emerald-500/50"
                            >
                              <option value="">Seçiniz</option>
                              {Array.from(
                                new Set(
                                  getTopicsForSection(
                                    selectedExam.type,
                                    activeSection,
                                    qInfo.number,
                                  ),
                                ),
                              ).map((t) => (
                                <option key={t} value={t}>
                                  {t}
                                </option>
                              ))}
                            </select>
                          </div>
                          <div>
                            <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">
                              Cevap Anahtarı
                            </label>
                            <select
                              value={qInfo.answer || ""}
                              onChange={(e) => {
                                const newQs = [...examQuestions];
                                const targetIndex = newQs.findIndex(
                                  (x) => x.id === qInfo.id,
                                );
                                if (targetIndex > -1)
                                  newQs[targetIndex].answer = e.target.value;
                                setExamQuestions(newQs);
                              }}
                              className="w-full bg-black/40 border border-white/10 rounded-lg px-3 py-2 text-sm text-white outline-none focus:border-emerald-500/50"
                            >
                              <option value="">Seçiniz</option>
                              <option value="A">A</option>
                              <option value="B">B</option>
                              <option value="C">C</option>
                              <option value="D">D</option>
                              <option value="E">E</option>
                              <option value="İPTAL">İptal</option>
                            </select>
                          </div>
                          <div>
                            <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">
                              Soru Görsel Linki (Opsiyonel)
                            </label>
                            <input
                              type="text"
                              value={qInfo.imageUrl || ""}
                              onChange={(e) => {
                                const newQs = [...examQuestions];
                                const targetIndex = newQs.findIndex(
                                  (x) => x.id === qInfo.id,
                                );
                                if (targetIndex > -1) {
                                  newQs[targetIndex].imageUrl = formatDriveUrl(e.target.value);
                                }
                                setExamQuestions(newQs);
                              }}
                              className="w-full bg-black/40 border border-white/10 rounded-lg px-3 py-2 text-sm text-white outline-none focus:border-emerald-500/50"
                              placeholder="https://drive.google.com/..."
                            />
                          </div>
                        </div>
                      </div>
                    ))}

                  {examQuestions.filter((q) => q.sectionName === activeSection)
                    .length === 0 && (
                    <div className="p-8 text-center text-slate-500 border border-dashed border-white/10 rounded-2xl">
                      Bu bölüm için soru bulunamadı. Şablon güncellenmemiş
                      olabilir.
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className="p-6 border-t border-white/10 bg-black/20 flex justify-end gap-3 shrink-0">
              <button
                onClick={() => setIsQuestionModalOpen(false)}
                className="px-6 py-2.5 rounded-xl font-bold text-slate-400 hover:text-white hover:bg-white/5 transition-all"
              >
                Vazgeç
              </button>
              <button
                onClick={handleSaveQuestions}
                disabled={savingQuestions}
                className="px-6 py-2.5 bg-emerald-500 hover:bg-emerald-400 text-white rounded-xl font-black uppercase tracking-widest text-sm transition-all shadow-lg shadow-emerald-500/20 flex items-center gap-2 disabled:opacity-50"
              >
                {savingQuestions ? "Kaydediliyor..." : "Değişiklikleri Kaydet"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
