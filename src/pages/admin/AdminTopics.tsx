import React, { useState } from "react";
import { useCurriculum } from "../../lib/CurriculumContext";
import { Layers, Search, Plus, Trash2, Edit2, Save, X } from "lucide-react";
import { studentDataService } from "../../services/studentDataService";

export default function AdminTopics() {
  const { curriculum, refreshCurriculum } = useCurriculum();
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedSubject, setSelectedSubject] = useState<string | null>(null);

  const [editingSubject, setEditingSubject] = useState<string | null>(null);
  const [editingTopics, setEditingTopics] = useState<string[]>([]);
  const [newTopic, setNewTopic] = useState("");

  const allSubjects = Object.keys(curriculum).sort();

  const filteredSubjects = allSubjects.filter((subject) => {
    if (selectedSubject && subject !== selectedSubject) return false;
    return true;
  });

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

  const getCategorized = (subjects: string[]) => {
    const map: Record<string, string[]> = {};
    CATEGORY_ORDER.forEach((c) => (map[c] = []));
    subjects.forEach((s) => {
      const cat = classifySubject(s);
      if (!map[cat]) map[cat] = [];
      map[cat].push(s);
    });
    return map;
  };

  const categorizedAll = getCategorized(allSubjects);
  const categorizedFiltered = getCategorized(filteredSubjects);

  const handleEditSubject = (subject: string) => {
    setEditingSubject(subject);
    setEditingTopics([...(curriculum[subject] || [])]);
  };

  const handleSaveSubject = async (subject: string) => {
    try {
      await studentDataService.saveCurriculumSubject(subject, editingTopics);
      await refreshCurriculum();
      setEditingSubject(null);
    } catch (error) {
      alert("Kaydedilirken hata oluştu.");
    }
  };

  const handleDeleteSubject = async (subject: string) => {
    if (
      !window.confirm(
        `${subject} dersini ve tüm konularını silmek istediğinize emin misiniz?`,
      )
    )
      return;
    try {
      await studentDataService.deleteCurriculumSubject(subject);
      await refreshCurriculum();
      setEditingSubject(null);
    } catch (error) {
      alert("Silinirken hata oluştu.");
    }
  };

  const handleAddTopic = () => {
    if (!newTopic.trim()) return;
    setEditingTopics([...editingTopics, newTopic.trim()]);
    setNewTopic("");
  };

  const handleRemoveTopic = (index: number) => {
    setEditingTopics(editingTopics.filter((_, i) => i !== index));
  };

  const handleTopicNameChange = (index: number, val: string) => {
    const updated = [...editingTopics];
    updated[index] = val;
    setEditingTopics(updated);
  };

  const handleMoveTopic = (index: number, direction: "up" | "down") => {
    if (direction === "up" && index > 0) {
      const updated = [...editingTopics];
      [updated[index], updated[index - 1]] = [
        updated[index - 1],
        updated[index],
      ];
      setEditingTopics(updated);
    } else if (direction === "down" && index < editingTopics.length - 1) {
      const updated = [...editingTopics];
      [updated[index], updated[index + 1]] = [
        updated[index + 1],
        updated[index],
      ];
      setEditingTopics(updated);
    }
  };

  const [newSubjectName, setNewSubjectName] = useState("");
  const [isAddingSubject, setIsAddingSubject] = useState(false);

  const handleAddSubject = async () => {
    if (!newSubjectName.trim()) return;
    const subject = newSubjectName.trim();
    if (Object.keys(curriculum).includes(subject)) {
      alert("Bu ders zaten var.");
      return;
    }
    try {
      await studentDataService.saveCurriculumSubject(subject, []);
      await refreshCurriculum();
      setNewSubjectName("");
      setIsAddingSubject(false);
      handleEditSubject(subject);
    } catch (error) {
      alert("Kaydedilirken hata oluştu.");
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-white tracking-tight uppercase">
            Konu Listesi
          </h1>
          <p className="text-slate-400 text-sm">
            Sistemde tanımlı tüm ders ve konuların listesini dinamik olarak
            yönetin.
          </p>
        </div>
        <button
          onClick={() => setIsAddingSubject(true)}
          className="flex items-center gap-2 bg-emerald-500 hover:bg-emerald-600 text-white px-4 py-2 rounded-lg font-bold transition-colors"
        >
          <Plus size={20} />
          Yeni Ders Ekle
        </button>
      </div>

      {isAddingSubject && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-white/10 sm:rounded-2xl p-6 w-full max-w-md h-full sm:h-auto max-h-screen sm:max-h-[90vh] overflow-y-auto">
            <h2 className="text-xl font-black text-white mb-6 uppercase tracking-tight">
              Yeni Ders Ekle
            </h2>
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">
                  Ders Adı
                </label>
                <input
                  type="text"
                  value={newSubjectName}
                  onChange={(e) => setNewSubjectName(e.target.value)}
                  className="w-full bg-black/20 border border-white/10 rounded-lg p-3 text-sm text-white outline-none focus:border-emerald-500/50"
                  placeholder="Örn: Biyoloji (AYT)"
                />
              </div>
              <div className="flex items-center justify-end gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => {
                    setIsAddingSubject(false);
                    setNewSubjectName("");
                  }}
                  className="px-6 py-2 text-sm font-bold text-slate-400 hover:text-white transition-colors"
                >
                  İptal
                </button>
                <button
                  onClick={handleAddSubject}
                  className="px-6 py-2 bg-emerald-500 hover:bg-emerald-600 text-white text-sm font-bold rounded-lg transition-colors"
                >
                  Ekle
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="flex flex-col md:flex-row gap-4">
        <div className="flex-1 relative">
          <Search
            className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
            size={20}
          />
          <input
            type="text"
            placeholder="Konu ara..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-slate-800 border border-white/10 rounded-lg pl-10 pr-4 py-2 text-sm text-white placeholder-slate-500 outline-none focus:border-emerald-500/50"
          />
        </div>
        <div className="flex items-center gap-2">
          <select
            value={selectedSubject || ""}
            onChange={(e) => setSelectedSubject(e.target.value || null)}
            className="bg-slate-800 border border-white/10 rounded-lg px-3 py-2 text-sm text-white outline-none focus:border-emerald-500/50"
          >
            <option value="">Tüm Dersler</option>
            {Object.entries(categorizedAll).map(
              ([category, subjects]) =>
                subjects.length > 0 && (
                  <optgroup key={category} label={category}>
                    {subjects.map((sub) => (
                      <option key={sub} value={sub}>
                        {sub}
                      </option>
                    ))}
                  </optgroup>
                ),
            )}
          </select>
        </div>
      </div>

      <div className="space-y-10">
        {CATEGORY_ORDER.map((category) => {
          const rawSubjects = categorizedFiltered[category] || [];

          const subjectsToRender = rawSubjects.filter((subject) => {
            const isEditing = editingSubject === subject;
            const topics = isEditing
              ? editingTopics
              : curriculum[subject] || [];
            const filteredTopics = isEditing
              ? topics
              : topics.filter((t: string) =>
                  t.toLowerCase().includes(searchTerm.toLowerCase()),
                );
            if (searchTerm && filteredTopics.length === 0 && !isEditing)
              return false;
            return true;
          });

          if (subjectsToRender.length === 0) return null;

          return (
            <div key={category} className="space-y-4">
              <h2 className="text-xl font-bold text-white border-b border-white/10 pb-2 flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-emerald-500"></div>
                {category} Dersleri
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {subjectsToRender.map((subject) => {
                  const isEditing = editingSubject === subject;
                  const topics = isEditing
                    ? editingTopics
                    : curriculum[subject] || [];
                  const filteredTopics = isEditing
                    ? topics
                    : topics.filter((t: string) =>
                        t.toLowerCase().includes(searchTerm.toLowerCase()),
                      );

                  if (searchTerm && filteredTopics.length === 0 && !isEditing)
                    return null;

                  return (
                    <div
                      key={subject}
                      className="bg-slate-800/50 border border-white/10 rounded-xl overflow-hidden flex flex-col"
                    >
                      <div className="flex items-center justify-between p-4 border-b border-white/10 bg-slate-800">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-lg bg-emerald-500/20 flex items-center justify-center text-emerald-400">
                            <Layers size={20} />
                          </div>
                          <div>
                            <h3 className="text-white font-bold">{subject}</h3>
                            <div className="text-xs text-slate-400">
                              {topics.length} Konu
                            </div>
                          </div>
                        </div>
                        <div>
                          {isEditing ? (
                            <div className="flex items-center gap-2">
                              <button
                                onClick={() => handleDeleteSubject(subject)}
                                className="p-1.5 text-red-400 hover:text-red-300 bg-red-500/10 hover:bg-red-500/20 rounded"
                              >
                                <Trash2 size={16} />
                              </button>
                              <button
                                onClick={() => setEditingSubject(null)}
                                className="p-1.5 text-slate-400 hover:text-white bg-white/5 hover:bg-white/10 rounded"
                              >
                                <X size={16} />
                              </button>
                              <button
                                onClick={() => handleSaveSubject(subject)}
                                className="p-1.5 text-emerald-400 hover:text-emerald-300 bg-emerald-500/10 hover:bg-emerald-500/20 rounded"
                              >
                                <Save size={16} />
                              </button>
                            </div>
                          ) : (
                            <button
                              onClick={() => handleEditSubject(subject)}
                              className="p-1.5 text-slate-400 hover:text-white bg-white/5 hover:bg-white/10 rounded"
                            >
                              <Edit2 size={16} />
                            </button>
                          )}
                        </div>
                      </div>

                      <div className="p-4 flex-1 flex flex-col gap-2 max-h-96 overflow-y-auto">
                        {filteredTopics.length > 0 ? (
                          filteredTopics.map((topic: string, idx: number) => (
                            <div
                              key={idx}
                              className="flex items-center justify-between p-2 rounded hover:bg-white/5 transition-colors group"
                            >
                              <div className="flex items-center gap-3 flex-1 overflow-hidden">
                                <div className="text-emerald-500/50 text-xs font-bold w-4 shrink-0">
                                  {idx + 1}.
                                </div>
                                {isEditing ? (
                                  <input
                                    type="text"
                                    value={topic}
                                    onChange={(e) =>
                                      handleTopicNameChange(idx, e.target.value)
                                    }
                                    className="flex-1 bg-black/20 border border-white/10 rounded p-1 text-sm text-white outline-none focus:border-emerald-500"
                                  />
                                ) : (
                                  <div className="text-sm text-slate-300 truncate">
                                    {topic}
                                  </div>
                                )}
                              </div>
                              {isEditing && (
                                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity ml-2 shrink-0">
                                  <button
                                    onClick={() => handleMoveTopic(idx, "up")}
                                    disabled={idx === 0}
                                    className="p-1 text-slate-400 hover:text-white disabled:opacity-30"
                                  >
                                    ▲
                                  </button>
                                  <button
                                    onClick={() => handleMoveTopic(idx, "down")}
                                    disabled={idx === filteredTopics.length - 1}
                                    className="p-1 text-slate-400 hover:text-white disabled:opacity-30"
                                  >
                                    ▼
                                  </button>
                                  <button
                                    onClick={() => handleRemoveTopic(idx)}
                                    className="p-1 text-red-400 hover:text-red-300 ml-1"
                                  >
                                    <Trash2 size={14} />
                                  </button>
                                </div>
                              )}
                            </div>
                          ))
                        ) : (
                          <div className="text-center text-slate-500 text-sm py-8">
                            Konu bulunamadı.
                          </div>
                        )}

                        {isEditing && (
                          <div className="flex items-center gap-2 mt-2 pt-2 border-t border-white/10">
                            <input
                              type="text"
                              value={newTopic}
                              onChange={(e) => setNewTopic(e.target.value)}
                              onKeyDown={(e) =>
                                e.key === "Enter" && handleAddTopic()
                              }
                              placeholder="Yeni konu ekle..."
                              className="flex-1 bg-black/20 border border-white/10 rounded p-1.5 text-sm text-white outline-none focus:border-emerald-500"
                            />
                            <button
                              onClick={handleAddTopic}
                              className="p-1.5 bg-emerald-500 text-white rounded hover:bg-emerald-600"
                            >
                              <Plus size={16} />
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
