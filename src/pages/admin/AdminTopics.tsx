import React, { useState } from "react";
import { useCurriculum } from "../../lib/CurriculumContext";
import { 
  Layers, 
  Search, 
  Plus, 
  Trash2, 
  Edit2, 
  Save, 
  X, 
  ChevronDown, 
  ChevronRight, 
  RotateCcw, 
  ListTree, 
  Check, 
  ArrowUp, 
  ArrowDown,
  Sparkles,
  BookOpen
} from "lucide-react";

export default function AdminTopics() {
  const { 
    curriculum, 
    subtopics, 
    refreshCurriculum, 
    saveSubject, 
    saveAllSubtopics, 
    deleteSubject,
    resetToDefaults 
  } = useCurriculum();

  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("ALL");
  const [selectedSubject, setSelectedSubject] = useState<string | null>(null);

  // Edit State
  const [editingSubject, setEditingSubject] = useState<string | null>(null);
  const [editingTopics, setEditingTopics] = useState<string[]>([]);
  const [editingSubtopicsMap, setEditingSubtopicsMap] = useState<Record<string, string[]>>({});
  const [expandedTopics, setExpandedTopics] = useState<Record<string, boolean>>({});
  const [newTopicName, setNewTopicName] = useState("");
  const [newSubtopicInputs, setNewSubtopicInputs] = useState<Record<string, string>>({});
  const [isSaving, setIsSaving] = useState(false);

  // New Subject Modal
  const [isAddingSubject, setIsAddingSubject] = useState(false);
  const [newSubjectName, setNewSubjectName] = useState("");
  const [newSubjectCategory, setNewSubjectCategory] = useState("TYT");

  const allSubjects = Object.keys(curriculum).sort();

  const classifySubject = (subject: string) => {
    if (subject.startsWith("9. Sınıf")) return "9. Sınıf";
    if (subject.startsWith("10. Sınıf")) return "10. Sınıf";
    if (subject.startsWith("11. Sınıf")) return "11. Sınıf";
    if (
      subject.startsWith("AYT") ||
      subject === "Edebiyat" ||
      subject === "Felsefe Grubu"
    )
      return "AYT";
    if (
      [
        "Yabancı Dil",
        "İngilizce",
        "Almanca",
        "Fransızca",
        "Arapça",
        "Rusça",
        "Grammar",
        "Vocabulary",
        "Reading",
        "Skills Questions",
        "Word Memorize",
      ].includes(subject)
    )
      return "YDT";
    if (
      [
        "Türkçe",
        "Matematik",
        "Geometri",
        "Tarih",
        "Coğrafya",
        "Felsefe",
        "Din",
        "Din Kültürü",
        "Fizik",
        "Kimya",
        "Biyoloji",
        "Paragraf",
        "Problem",
      ].includes(subject)
    )
      return "TYT";
    return "Diğer";
  };

  const CATEGORY_ORDER = [
    "TYT",
    "AYT",
    "YDT",
    "9. Sınıf",
    "10. Sınıf",
    "11. Sınıf",
    "Diğer",
  ];

  const filteredSubjects = allSubjects.filter((subject) => {
    const cat = classifySubject(subject);
    if (selectedCategory !== "ALL" && cat !== selectedCategory) return false;
    if (selectedSubject && subject !== selectedSubject) return false;

    if (searchTerm) {
      const q = searchTerm.toLowerCase();
      const subjectMatch = subject.toLowerCase().includes(q);
      const topics = curriculum[subject] || [];
      const topicMatch = topics.some((t) => {
        if (t.toLowerCase().includes(q)) return true;
        const subs = subtopics[t] || [];
        return subs.some((s) => s.toLowerCase().includes(q));
      });
      return subjectMatch || topicMatch;
    }

    return true;
  });

  const handleStartEditSubject = (subject: string) => {
    setEditingSubject(subject);
    const topics = curriculum[subject] || [];
    setEditingTopics([...topics]);
    
    // Copy subtopics for this subject's topics
    const subsMap: Record<string, string[]> = {};
    topics.forEach((t) => {
      subsMap[t] = subtopics[t] ? [...subtopics[t]] : [];
    });
    setEditingSubtopicsMap(subsMap);
    
    // Auto-expand all topics with subtopics for convenience
    const exp: Record<string, boolean> = {};
    topics.forEach((t) => {
      if ((subtopics[t] || []).length > 0) {
        exp[t] = true;
      }
    });
    setExpandedTopics(exp);
    setNewTopicName("");
    setNewSubtopicInputs({});
  };

  const handleToggleExpandTopic = (topic: string) => {
    setExpandedTopics((prev) => ({ ...prev, [topic]: !prev[topic] }));
  };

  const handleSaveSubjectChanges = async () => {
    if (!editingSubject) return;
    setIsSaving(true);
    try {
      // 1. Save main topics of the subject
      await saveSubject(editingSubject, editingTopics);

      // 2. Merge and save subtopics
      const mergedSubtopics = { ...subtopics, ...editingSubtopicsMap };
      await saveAllSubtopics(mergedSubtopics);

      await refreshCurriculum();
      setEditingSubject(null);
    } catch (error) {
      console.error("Save error:", error);
      alert("Değişiklikler kaydedilirken bir hata oluştu.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteSubject = async (subject: string) => {
    if (
      !window.confirm(
        `"${subject}" dersini ve tüm konularını kalıcı olarak silmek istediğinize emin misiniz?`
      )
    )
      return;
    try {
      await deleteSubject(subject);
      await refreshCurriculum();
      if (editingSubject === subject) {
        setEditingSubject(null);
      }
    } catch (error) {
      alert("Silinirken hata oluştu.");
    }
  };

  const handleAddTopic = () => {
    if (!newTopicName.trim()) return;
    const name = newTopicName.trim();
    if (editingTopics.includes(name)) {
      alert("Bu ana konu zaten ekli.");
      return;
    }
    setEditingTopics([...editingTopics, name]);
    setEditingSubtopicsMap((prev) => ({ ...prev, [name]: [] }));
    setExpandedTopics((prev) => ({ ...prev, [name]: true }));
    setNewTopicName("");
  };

  const handleRemoveTopic = (index: number) => {
    const topicToRemove = editingTopics[index];
    setEditingTopics(editingTopics.filter((_, i) => i !== index));
    setEditingSubtopicsMap((prev) => {
      const next = { ...prev };
      delete next[topicToRemove];
      return next;
    });
  };

  const handleTopicNameChange = (index: number, newName: string) => {
    const oldName = editingTopics[index];
    const updated = [...editingTopics];
    updated[index] = newName;
    setEditingTopics(updated);

    if (oldName !== newName) {
      setEditingSubtopicsMap((prev) => {
        const next = { ...prev };
        next[newName] = next[oldName] || [];
        delete next[oldName];
        return next;
      });
      setExpandedTopics((prev) => {
        const next = { ...prev };
        next[newName] = next[oldName];
        delete next[oldName];
        return next;
      });
    }
  };

  const handleMoveTopic = (index: number, direction: "up" | "down") => {
    if (direction === "up" && index > 0) {
      const updated = [...editingTopics];
      [updated[index], updated[index - 1]] = [updated[index - 1], updated[index]];
      setEditingTopics(updated);
    } else if (direction === "down" && index < editingTopics.length - 1) {
      const updated = [...editingTopics];
      [updated[index], updated[index + 1]] = [updated[index + 1], updated[index]];
      setEditingTopics(updated);
    }
  };

  // Subtopic Actions
  const handleAddSubtopic = (topicName: string) => {
    const inputVal = newSubtopicInputs[topicName]?.trim();
    if (!inputVal) return;

    const currentSubs = editingSubtopicsMap[topicName] || [];
    if (currentSubs.includes(inputVal)) {
      alert("Bu alt başlık zaten ekli.");
      return;
    }

    setEditingSubtopicsMap((prev) => ({
      ...prev,
      [topicName]: [...currentSubs, inputVal],
    }));

    setNewSubtopicInputs((prev) => ({
      ...prev,
      [topicName]: "",
    }));
  };

  const handleRemoveSubtopic = (topicName: string, subIndex: number) => {
    const currentSubs = editingSubtopicsMap[topicName] || [];
    setEditingSubtopicsMap((prev) => ({
      ...prev,
      [topicName]: currentSubs.filter((_, i) => i !== subIndex),
    }));
  };

  const handleSubtopicNameChange = (
    topicName: string,
    subIndex: number,
    val: string
  ) => {
    const currentSubs = [...(editingSubtopicsMap[topicName] || [])];
    currentSubs[subIndex] = val;
    setEditingSubtopicsMap((prev) => ({
      ...prev,
      [topicName]: currentSubs,
    }));
  };

  const handleAddSubjectSubmit = async () => {
    if (!newSubjectName.trim()) return;
    const name = newSubjectName.trim();
    if (Object.keys(curriculum).includes(name)) {
      alert("Bu ders zaten mevcut.");
      return;
    }
    try {
      await saveSubject(name, []);
      await refreshCurriculum();
      setNewSubjectName("");
      setIsAddingSubject(false);
      handleStartEditSubject(name);
    } catch (error) {
      alert("Ders eklenirken hata oluştu.");
    }
  };

  const handleResetToDefault = async () => {
    if (
      !window.confirm(
        "Tüm müfredat ve alt başlıkları orijinal standart ayarlara sıfırlamak istediğinize emin misiniz? Yapılan özel düzenlemeler standart haline dönecektir."
      )
    )
      return;

    try {
      await resetToDefaults();
      await refreshCurriculum();
      setEditingSubject(null);
      alert("Müfredat ve alt başlıklar başarıyla standart haline getirildi.");
    } catch (e) {
      alert("Sıfırlanırken hata oluştu.");
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Layers className="text-emerald-400" size={24} />
            <h1 className="text-2xl font-black text-white tracking-tight uppercase">
              Müfredat & Alt Başlık Yönetimi
            </h1>
          </div>
          <p className="text-slate-400 text-sm">
            Derslerin ana konularını ve alt başlıklarını dinamik olarak yönetin. Alt başlık soru hedefleri otomatik olarak ana başlığa yansır.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={handleResetToDefault}
            className="flex items-center gap-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white px-3 py-2 rounded-xl text-xs font-bold border border-white/10 transition-colors"
            title="Müfredat ve alt başlıkları varsayılan temiz standart haline getirir"
          >
            <RotateCcw size={14} />
            Standarda Sıfırla
          </button>
          <button
            onClick={() => setIsAddingSubject(true)}
            className="flex items-center gap-2 bg-emerald-500 hover:bg-emerald-600 text-white px-4 py-2 rounded-xl text-sm font-bold shadow-lg shadow-emerald-500/20 transition-colors"
          >
            <Plus size={18} />
            Yeni Ders Ekle
          </button>
        </div>
      </div>

      {/* Category Tabs & Search Bar */}
      <div className="bg-slate-900/60 p-4 rounded-2xl border border-white/5 space-y-4">
        {/* Category Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 custom-scrollbar">
          <button
            onClick={() => setSelectedCategory("ALL")}
            className={`px-3 py-1.5 rounded-lg text-xs font-black uppercase tracking-wider transition-all whitespace-nowrap ${
              selectedCategory === "ALL"
                ? "bg-emerald-500 text-white shadow-sm"
                : "bg-slate-800/80 text-slate-400 hover:text-white hover:bg-slate-800"
            }`}
          >
            Tüm Kategoriler ({allSubjects.length})
          </button>
          {CATEGORY_ORDER.map((cat) => {
            const count = allSubjects.filter((s) => classifySubject(s) === cat).length;
            return (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-3 py-1.5 rounded-lg text-xs font-black uppercase tracking-wider transition-all whitespace-nowrap flex items-center gap-1.5 ${
                  selectedCategory === cat
                    ? "bg-emerald-500 text-white shadow-sm"
                    : "bg-slate-800/80 text-slate-400 hover:text-white hover:bg-slate-800"
                }`}
              >
                <span>{cat}</span>
                <span className="text-[10px] opacity-70">({count})</span>
              </button>
            );
          })}
        </div>

        {/* Search & Subject Filter */}
        <div className="flex flex-col md:flex-row gap-3">
          <div className="flex-1 relative">
            <Search
              className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
              size={18}
            />
            <input
              type="text"
              placeholder="Ders, ana konu veya alt başlık ara..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-slate-950/60 border border-white/10 rounded-xl pl-10 pr-4 py-2.5 text-sm text-white placeholder-slate-500 outline-none focus:border-emerald-500 transition-colors"
            />
            {searchTerm && (
              <button
                onClick={() => setSearchTerm("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
              >
                <X size={16} />
              </button>
            )}
          </div>
          <select
            value={selectedSubject || ""}
            onChange={(e) => setSelectedSubject(e.target.value || null)}
            className="bg-slate-950/60 border border-white/10 rounded-xl px-3 py-2 text-sm text-white outline-none focus:border-emerald-500"
          >
            <option value="">Tüm Dersler</option>
            {allSubjects.map((sub) => (
              <option key={sub} value={sub}>
                {sub}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Subject Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {filteredSubjects.map((subject) => {
          const isEditing = editingSubject === subject;
          const currentTopics = isEditing ? editingTopics : curriculum[subject] || [];
          const currentSubMap = isEditing ? editingSubtopicsMap : subtopics;
          
          let totalSubtopicsCount = 0;
          currentTopics.forEach((t) => {
            totalSubtopicsCount += (currentSubMap[t] || []).length;
          });

          const category = classifySubject(subject);

          return (
            <div
              key={subject}
              className={`bg-slate-900/80 border rounded-2xl overflow-hidden flex flex-col transition-all shadow-lg ${
                isEditing
                  ? "border-emerald-500 ring-2 ring-emerald-500/20 col-span-1 md:col-span-2 lg:col-span-3"
                  : "border-white/10 hover:border-white/20"
              }`}
            >
              {/* Card Header */}
              <div className="flex items-center justify-between p-4 border-b border-white/10 bg-slate-950/60">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 shrink-0">
                    <BookOpen size={20} />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="text-base font-black text-white tracking-tight">
                        {subject}
                      </h3>
                      <span className="px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-wider bg-white/5 text-slate-400 border border-white/10">
                        {category}
                      </span>
                    </div>
                    <div className="flex items-center gap-3 text-xs text-slate-400 mt-0.5 font-medium">
                      <span>{currentTopics.length} Ana Konu</span>
                      <span>•</span>
                      <span className="text-emerald-400/80 font-bold">{totalSubtopicsCount} Alt Başlık</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  {isEditing ? (
                    <>
                      <button
                        onClick={() => handleDeleteSubject(subject)}
                        className="p-2 text-red-400 hover:text-red-300 bg-red-500/10 hover:bg-red-500/20 rounded-xl transition-colors"
                        title="Dersi ve Konuları Sil"
                      >
                        <Trash2 size={16} />
                      </button>
                      <button
                        onClick={() => setEditingSubject(null)}
                        className="px-3 py-1.5 text-slate-400 hover:text-white bg-white/5 hover:bg-white/10 rounded-xl text-xs font-bold transition-colors"
                      >
                        İptal
                      </button>
                      <button
                        onClick={handleSaveSubjectChanges}
                        disabled={isSaving}
                        className="flex items-center gap-1.5 px-4 py-1.5 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl text-xs font-black uppercase tracking-wider transition-colors shadow-md shadow-emerald-500/20"
                      >
                        <Save size={14} />
                        {isSaving ? "Kaydediliyor..." : "Kaydet"}
                      </button>
                    </>
                  ) : (
                    <button
                      onClick={() => handleStartEditSubject(subject)}
                      className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-slate-300 hover:text-white bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl transition-colors"
                    >
                      <Edit2 size={13} />
                      Düzenle
                    </button>
                  )}
                </div>
              </div>

              {/* Topics List Body */}
              <div className={`p-4 flex-1 flex flex-col gap-2.5 overflow-y-auto ${isEditing ? 'max-h-[600px]' : 'max-h-80'}`}>
                {currentTopics.length > 0 ? (
                  currentTopics.map((topic: string, topicIdx: number) => {
                    const topicSubtopics = currentSubMap[topic] || [];
                    const isExpanded = isEditing ? expandedTopics[topic] : false;

                    return (
                      <div
                        key={topicIdx}
                        className={`rounded-xl border transition-all ${
                          isEditing
                            ? "bg-slate-950/40 border-white/10 p-3 space-y-3"
                            : "bg-white/[0.02] border-white/5 p-2.5 hover:bg-white/[0.04]"
                        }`}
                      >
                        {/* Topic Row */}
                        <div className="flex items-center justify-between gap-3">
                          <div className="flex items-center gap-2.5 flex-1 min-w-0">
                            <span className="text-emerald-400/60 text-xs font-black w-5 shrink-0 text-right">
                              {topicIdx + 1}.
                            </span>

                            {isEditing ? (
                              <input
                                type="text"
                                value={topic}
                                onChange={(e) =>
                                  handleTopicNameChange(topicIdx, e.target.value)
                                }
                                className="flex-1 bg-black/40 border border-white/10 rounded-lg px-2.5 py-1 text-sm font-semibold text-white outline-none focus:border-emerald-500"
                              />
                            ) : (
                              <div className="text-sm font-medium text-slate-200 truncate">
                                {topic}
                              </div>
                            )}
                          </div>

                          <div className="flex items-center gap-2 shrink-0">
                            {/* Subtopics count badge */}
                            <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider border ${
                              topicSubtopics.length > 0
                                ? 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20'
                                : 'bg-slate-800 text-slate-500 border-white/5'
                            }`}>
                              {topicSubtopics.length} Alt Başlık
                            </span>

                            {isEditing && (
                              <div className="flex items-center gap-1">
                                <button
                                  type="button"
                                  onClick={() => handleToggleExpandTopic(topic)}
                                  className={`p-1.5 rounded-lg border transition-colors ${
                                    isExpanded
                                      ? "bg-indigo-500/20 text-indigo-300 border-indigo-500/30"
                                      : "bg-white/5 text-slate-400 border-white/10 hover:text-white"
                                  }`}
                                  title="Alt Başlıkları Yönet"
                                >
                                  {isExpanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleMoveTopic(topicIdx, "up")}
                                  disabled={topicIdx === 0}
                                  className="p-1 text-slate-400 hover:text-white disabled:opacity-30"
                                  title="Yukarı Taşı"
                                >
                                  <ArrowUp size={14} />
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleMoveTopic(topicIdx, "down")}
                                  disabled={topicIdx === currentTopics.length - 1}
                                  className="p-1 text-slate-400 hover:text-white disabled:opacity-30"
                                  title="Aşağı Taşı"
                                >
                                  <ArrowDown size={14} />
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleRemoveTopic(topicIdx)}
                                  className="p-1 text-red-400 hover:text-red-300 ml-0.5"
                                  title="Ana Konuyu Sil"
                                >
                                  <Trash2 size={14} />
                                </button>
                              </div>
                            )}
                          </div>
                        </div>

                        {/* Read-Only Subtopics Pill Preview when not editing */}
                        {!isEditing && topicSubtopics.length > 0 && (
                          <div className="pl-7 pt-1 flex flex-wrap gap-1">
                            {topicSubtopics.slice(0, 4).map((sub, sIdx) => (
                              <span
                                key={sIdx}
                                className="inline-block bg-white/5 text-[10px] text-slate-400 px-2 py-0.5 rounded border border-white/5"
                              >
                                {sub}
                              </span>
                            ))}
                            {topicSubtopics.length > 4 && (
                              <span className="text-[10px] text-slate-500 font-bold self-center">
                                +{topicSubtopics.length - 4} daha
                              </span>
                            )}
                          </div>
                        )}

                        {/* Subtopics Detailed Editor when Editing & Expanded */}
                        {isEditing && isExpanded && (
                          <div className="pl-6 pt-2 border-t border-white/5 space-y-2">
                            <div className="flex items-center justify-between text-[11px] font-bold text-slate-400 uppercase tracking-widest">
                              <span className="flex items-center gap-1.5">
                                <ListTree size={13} className="text-indigo-400" />
                                Alt Başlıklar ({topicSubtopics.length})
                              </span>
                            </div>

                            {/* Subtopics List */}
                            <div className="space-y-1.5">
                              {topicSubtopics.map((sub, sIdx) => (
                                <div
                                  key={sIdx}
                                  className="flex items-center gap-2 bg-slate-900/60 p-1.5 rounded-lg border border-white/5 group/sub"
                                >
                                  <span className="text-[10px] text-indigo-400/80 font-bold w-4 text-center">
                                    {sIdx + 1}.
                                  </span>
                                  <input
                                    type="text"
                                    value={sub}
                                    onChange={(e) =>
                                      handleSubtopicNameChange(topic, sIdx, e.target.value)
                                    }
                                    className="flex-1 bg-transparent text-xs text-slate-200 outline-none focus:text-white"
                                  />
                                  <button
                                    type="button"
                                    onClick={() => handleRemoveSubtopic(topic, sIdx)}
                                    className="p-1 text-slate-500 hover:text-red-400 opacity-0 group-hover/sub:opacity-100 transition-opacity"
                                    title="Alt Başlığı Sil"
                                  >
                                    <Trash2 size={12} />
                                  </button>
                                </div>
                              ))}

                              {/* Add Subtopic Input */}
                              <div className="flex items-center gap-1.5 pt-1">
                                <input
                                  type="text"
                                  value={newSubtopicInputs[topic] || ""}
                                  onChange={(e) =>
                                    setNewSubtopicInputs((prev) => ({
                                      ...prev,
                                      [topic]: e.target.value,
                                    }))
                                  }
                                  onKeyDown={(e) => {
                                    if (e.key === "Enter") {
                                      e.preventDefault();
                                      handleAddSubtopic(topic);
                                    }
                                  }}
                                  placeholder="Yeni alt başlık yazın ve Enter'a basın..."
                                  className="flex-1 bg-black/30 border border-white/10 rounded-lg px-2.5 py-1 text-xs text-white placeholder-slate-500 outline-none focus:border-indigo-500"
                                />
                                <button
                                  type="button"
                                  onClick={() => handleAddSubtopic(topic)}
                                  className="p-1.5 bg-indigo-500 hover:bg-indigo-600 text-white rounded-lg text-xs font-bold transition-colors"
                                  title="Alt Başlık Ekle"
                                >
                                  <Plus size={13} />
                                </button>
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })
                ) : (
                  <div className="text-center text-slate-500 text-sm py-8">
                    Bu derse ait konu bulunmuyor.
                  </div>
                )}

                {/* Add New Topic Input when Editing */}
                {isEditing && (
                  <div className="flex items-center gap-2 mt-3 pt-3 border-t border-white/10">
                    <input
                      type="text"
                      value={newTopicName}
                      onChange={(e) => setNewTopicName(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          e.preventDefault();
                          handleAddTopic();
                        }
                      }}
                      placeholder="Yeni ana konu adı yazın..."
                      className="flex-1 bg-black/40 border border-white/10 rounded-xl px-3 py-2 text-sm text-white placeholder-slate-500 outline-none focus:border-emerald-500"
                    />
                    <button
                      type="button"
                      onClick={handleAddTopic}
                      className="flex items-center gap-1.5 px-4 py-2 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl text-xs font-black uppercase tracking-wider transition-colors shadow-sm"
                    >
                      <Plus size={16} />
                      Konu Ekle
                    </button>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Add New Subject Modal */}
      {isAddingSubject && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-white/10 rounded-2xl p-6 w-full max-w-md shadow-2xl">
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-lg font-black text-white uppercase tracking-tight flex items-center gap-2">
                <Plus className="text-emerald-400" size={20} />
                Yeni Ders Ekle
              </h2>
              <button
                onClick={() => {
                  setIsAddingSubject(false);
                  setNewSubjectName("");
                }}
                className="text-slate-400 hover:text-white"
              >
                <X size={18} />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">
                  Ders Adı
                </label>
                <input
                  type="text"
                  value={newSubjectName}
                  onChange={(e) => setNewSubjectName(e.target.value)}
                  className="w-full bg-slate-950/60 border border-white/10 rounded-xl p-3 text-sm text-white outline-none focus:border-emerald-500"
                  placeholder="Örn: Biyoloji (AYT) veya Sosyoloji"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-3">
                <button
                  type="button"
                  onClick={() => {
                    setIsAddingSubject(false);
                    setNewSubjectName("");
                  }}
                  className="px-4 py-2 text-sm font-bold text-slate-400 hover:text-white transition-colors"
                >
                  İptal
                </button>
                <button
                  onClick={handleAddSubjectSubmit}
                  className="px-5 py-2 bg-emerald-500 hover:bg-emerald-600 text-white text-sm font-black uppercase tracking-wider rounded-xl shadow-lg shadow-emerald-500/20 transition-colors"
                >
                  Ekle ve Düzenle
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
