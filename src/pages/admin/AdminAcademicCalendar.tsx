import React, { useState, useEffect } from "react";
import {
  Calendar,
  Plus,
  Search,
  Edit2,
  Trash2,
  Filter,
  Save,
  X,
  FileText,
  Users,
  Clock,
  AlertCircle,
  CheckCircle,
} from "lucide-react";
import { db } from "../../lib/firebase";
import {
  collection,
  getDocs,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  query,
  orderBy,
} from "firebase/firestore";

interface AcademicEvent {
  id?: string;
  title: string;
  description: string;
  startDate: string;
  endDate: string;
  category: "Sınav" | "Tatil" | "Seminer" | "Ödev/Görev" | "Duyuru" | "Diğer";
  targetAudience: "Tüm Öğrenciler" | "YKS (12. Sınıf & Mezun)" | "LGS (8. Sınıf)" | "Ara Sınıflar" | "Veliler";
  createdAt?: any;
}

export default function AdminAcademicCalendar() {
  const [events, setEvents] = useState<AcademicEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("Hepsi");
  const [audienceFilter, setAudienceFilter] = useState("Hepsi");

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingEvent, setEditingEvent] = useState<AcademicEvent | null>(null);

  const [formData, setFormData] = useState<Omit<AcademicEvent, "id" | "createdAt">>({
    title: "",
    description: "",
    startDate: "",
    endDate: "",
    category: "Sınav",
    targetAudience: "Tüm Öğrenciler",
  });

  const [notification, setNotification] = useState<{
    type: "success" | "error";
    message: string;
  } | null>(null);

  // Fetch all events
  const fetchEvents = async () => {
    try {
      setLoading(true);
      const q = query(collection(db, "academic_calendar"), orderBy("startDate", "asc"));
      const querySnapshot = await getDocs(q);
      const eventsData: AcademicEvent[] = [];
      querySnapshot.forEach((doc) => {
        eventsData.push({ id: doc.id, ...doc.data() } as AcademicEvent);
      });
      setEvents(eventsData);
    } catch (error) {
      console.error("Error fetching academic calendar events:", error);
      showNotification("error", "Akademik takvim verileri yüklenirken bir hata oluştu.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEvents();
  }, []);

  const showNotification = (type: "success" | "error", message: string) => {
    setNotification({ type, message });
    setTimeout(() => setNotification(null), 4000);
  };

  const handleOpenAddModal = () => {
    setEditingEvent(null);
    setFormData({
      title: "",
      description: "",
      startDate: new Date().toISOString().split("T")[0],
      endDate: new Date().toISOString().split("T")[0],
      category: "Sınav",
      targetAudience: "Tüm Öğrenciler",
    });
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (event: AcademicEvent) => {
    setEditingEvent(event);
    setFormData({
      title: event.title,
      description: event.description,
      startDate: event.startDate,
      endDate: event.endDate,
      category: event.category,
      targetAudience: event.targetAudience,
    });
    setIsModalOpen(true);
  };

  const handleDeleteEvent = async (id: string) => {
    if (!window.confirm("Bu akademik takvim etkinliğini silmek istediğinize emin misiniz?")) {
      return;
    }

    try {
      await deleteDoc(doc(db, "academic_calendar", id));
      showNotification("success", "Etkinlik başarıyla silindi.");
      fetchEvents();
    } catch (error) {
      console.error("Error deleting event:", error);
      showNotification("error", "Etkinlik silinirken bir hata oluştu.");
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title || !formData.startDate) {
      showNotification("error", "Lütfen başlık ve başlangıç tarihini doldurun.");
      return;
    }

    try {
      const payload = {
        ...formData,
        endDate: formData.endDate || formData.startDate,
        createdAt: new Date().toISOString(),
      };

      if (editingEvent?.id) {
        // Update
        await updateDoc(doc(db, "academic_calendar", editingEvent.id), payload);
        showNotification("success", "Etkinlik başarıyla güncellendi.");
      } else {
        // Create
        await addDoc(collection(db, "academic_calendar"), payload);
        showNotification("success", "Yeni etkinlik başarıyla eklendi.");
      }

      setIsModalOpen(false);
      fetchEvents();
    } catch (error) {
      console.error("Error saving event:", error);
      showNotification("error", "Etkinlik kaydedilirken bir hata oluştu.");
    }
  };

  const filteredEvents = events.filter((event) => {
    const matchesSearch =
      event.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      event.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory =
      categoryFilter === "Hepsi" || event.category === categoryFilter;
    const matchesAudience =
      audienceFilter === "Hepsi" || event.targetAudience === audienceFilter;
    return matchesSearch && matchesCategory && matchesAudience;
  });

  const getCategoryColor = (category: string) => {
    switch (category) {
      case "Sınav":
        return "bg-rose-500/10 text-rose-400 border border-rose-500/20";
      case "Tatil":
        return "bg-sky-500/10 text-sky-400 border border-sky-500/20";
      case "Seminer":
        return "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20";
      case "Ödev/Görev":
        return "bg-purple-500/10 text-purple-400 border border-purple-500/20";
      case "Duyuru":
        return "bg-amber-500/10 text-amber-400 border border-amber-500/20";
      default:
        return "bg-slate-500/10 text-slate-400 border border-slate-500/20";
    }
  };

  const getAudienceColor = (audience: string) => {
    switch (audience) {
      case "Tüm Öğrenciler":
        return "bg-indigo-500/10 text-indigo-400 border border-indigo-500/20";
      case "YKS (12. Sınıf & Mezun)":
        return "bg-violet-500/10 text-violet-400 border border-violet-500/20";
      case "LGS (8. Sınıf)":
        return "bg-orange-500/10 text-orange-400 border border-orange-500/20";
      case "Ara Sınıflar":
        return "bg-teal-500/10 text-teal-400 border border-teal-500/20";
      case "Veliler":
        return "bg-pink-500/10 text-pink-400 border border-pink-500/20";
      default:
        return "bg-slate-500/10 text-slate-400 border border-slate-500/20";
    }
  };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-8 animate-fade-in text-white">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 bg-slate-900/40 p-6 rounded-2xl border border-white/5 shadow-lg">
        <div>
          <h1 className="text-2xl font-semibold text-white tracking-tight flex items-center gap-2">
            <Calendar className="w-6 h-6 text-indigo-400" />
            Akademik Takvim Yönetimi
          </h1>
          <p className="text-slate-400 text-sm mt-1">
            Öğrenciler ve veliler için önemli sınav, seminer, tatil ve ödev tarihlerini planlayın.
          </p>
        </div>
        <button
          onClick={handleOpenAddModal}
          className="inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-medium text-sm rounded-xl transition-all shadow-sm hover:shadow-indigo-500/20"
        >
          <Plus className="w-4 h-4" />
          Yeni Etkinlik Ekle
        </button>
      </div>

      {/* Notifications */}
      {notification && (
        <div
          className={`p-4 rounded-xl flex items-center gap-3 border text-sm ${
            notification.type === "success"
              ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
              : "bg-rose-500/10 text-rose-400 border-rose-500/20"
          }`}
        >
          {notification.type === "success" ? (
            <CheckCircle className="w-5 h-5 text-emerald-400 shrink-0" />
          ) : (
            <AlertCircle className="w-5 h-5 text-rose-400 shrink-0" />
          )}
          <span>{notification.message}</span>
        </div>
      )}

      {/* Search and Filters */}
      <div className="bg-slate-900/40 p-5 rounded-2xl border border-white/5 shadow-lg flex flex-col md:flex-row gap-4 items-center justify-between">
        <div className="relative w-full md:w-80">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 w-4.5 h-4.5" />
          <input
            type="text"
            placeholder="Etkinliklerde ara..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-white/10 bg-slate-950/40 rounded-xl text-sm text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 placeholder:text-slate-500"
          />
        </div>

        <div className="flex flex-wrap items-center gap-4 w-full md:w-auto">
          {/* Category Filter */}
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-slate-400" />
            <span className="text-xs font-medium text-slate-400">Kategori:</span>
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="border border-white/10 rounded-lg text-xs py-1.5 px-3 bg-slate-950 text-white focus:outline-none focus:ring-1 focus:ring-indigo-500"
            >
              <option value="Hepsi">Tüm Kategoriler</option>
              <option value="Sınav">Sınav</option>
              <option value="Tatil">Tatil</option>
              <option value="Seminer">Seminer</option>
              <option value="Ödev/Görev">Ödev/Görev</option>
              <option value="Duyuru">Duyuru</option>
              <option value="Diğer">Diğer</option>
            </select>
          </div>

          {/* Audience Filter */}
          <div className="flex items-center gap-2">
            <span className="text-xs font-medium text-slate-400">Hedef Kitle:</span>
            <select
              value={audienceFilter}
              onChange={(e) => setAudienceFilter(e.target.value)}
              className="border border-white/10 rounded-lg text-xs py-1.5 px-3 bg-slate-950 text-white focus:outline-none focus:ring-1 focus:ring-indigo-500"
            >
              <option value="Hepsi">Herkes</option>
              <option value="Tüm Öğrenciler">Tüm Öğrenciler</option>
              <option value="YKS (12. Sınıf & Mezun)">YKS</option>
              <option value="LGS (8. Sınıf)">LGS</option>
              <option value="Ara Sınıflar">Ara Sınıflar</option>
              <option value="Veliler">Veliler</option>
            </select>
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="bg-slate-800/50 rounded-2xl border border-white/10 shadow-lg overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-slate-400 flex flex-col items-center justify-center gap-2">
            <div className="w-8 h-8 border-4 border-indigo-500/30 border-t-indigo-500 rounded-full animate-spin"></div>
            <span className="text-sm">Takvim yükleniyor...</span>
          </div>
        ) : filteredEvents.length === 0 ? (
          <div className="p-16 text-center text-slate-400 flex flex-col items-center justify-center gap-3">
            <div className="w-12 h-12 bg-slate-900/50 rounded-xl flex items-center justify-center border border-white/5">
              <Calendar className="w-6 h-6 text-slate-500" />
            </div>
            <div className="max-w-xs">
              <h3 className="font-semibold text-slate-200 text-sm">Etkinlik Bulunamadı</h3>
              <p className="text-slate-500 text-xs mt-1">
                Arama kriterlerinize veya filtrelere uyan bir akademik takvim kaydı bulunmamaktadır.
              </p>
            </div>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-900/80 border-b border-white/10 text-slate-400 text-xs font-semibold uppercase tracking-wider">
                  <th className="px-6 py-4">Etkinlik Başlığı</th>
                  <th className="px-6 py-4">Kategori</th>
                  <th className="px-6 py-4">Hedef Kitle</th>
                  <th className="px-6 py-4">Başlangıç Tarihi</th>
                  <th className="px-6 py-4">Bitiş Tarihi</th>
                  <th className="px-6 py-4">Açıklama</th>
                  <th className="px-6 py-4 text-right">Aksiyonlar</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5 text-slate-200 text-sm">
                {filteredEvents.map((event) => (
                  <tr key={event.id} className="hover:bg-white/5 transition-colors">
                    <td className="px-6 py-4 font-medium text-white">{event.title}</td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex px-2 py-1 rounded-md text-xs font-medium ${getCategoryColor(event.category)}`}>
                        {event.category}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex px-2 py-1 rounded-md text-xs font-medium ${getAudienceColor(event.targetAudience)}`}>
                        {event.targetAudience}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className="flex items-center gap-1.5 text-slate-300 font-medium">
                        <Clock className="w-3.5 h-3.5 text-slate-500" />
                        {new Date(event.startDate).toLocaleDateString("tr-TR")}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className="flex items-center gap-1.5 text-slate-300 font-medium">
                        <Clock className="w-3.5 h-3.5 text-slate-500" />
                        {new Date(event.endDate).toLocaleDateString("tr-TR")}
                      </span>
                    </td>
                    <td className="px-6 py-4 max-w-xs truncate text-slate-400 text-xs">
                      {event.description || "-"}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => handleOpenEditModal(event)}
                          className="p-1.5 text-slate-400 hover:text-indigo-400 hover:bg-white/5 rounded-lg transition-colors"
                          title="Düzenle"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => event.id && handleDeleteEvent(event.id)}
                          className="p-1.5 text-slate-400 hover:text-rose-400 hover:bg-white/5 rounded-lg transition-colors"
                          title="Sil"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal - Add / Edit Event */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fade-in">
          <div className="bg-slate-900 rounded-2xl w-full max-w-lg border border-white/10 shadow-2xl overflow-hidden">
            <div className="px-6 py-4 border-b border-white/10 flex items-center justify-between">
              <h3 className="font-semibold text-white text-lg">
                {editingEvent ? "Takvimi Düzenle" : "Yeni Akademik Etkinlik Ekle"}
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1 text-slate-400 hover:text-white rounded-lg hover:bg-white/5 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">
                  Etkinlik Başlığı *
                </label>
                <input
                  type="text"
                  required
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder="YKS Başvuruları, Sınıf Sınavı vb."
                  className="w-full px-4 py-2 border border-white/10 bg-slate-950 text-white rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">
                    Kategori
                  </label>
                  <select
                    value={formData.category}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        category: e.target.value as AcademicEvent["category"],
                      })
                    }
                    className="w-full px-4 py-2 border border-white/10 bg-slate-950 text-white rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                  >
                    <option value="Sınav">Sınav</option>
                    <option value="Tatil">Tatil</option>
                    <option value="Seminer">Seminer</option>
                    <option value="Ödev/Görev">Ödev/Görev</option>
                    <option value="Duyuru">Duyuru</option>
                    <option value="Diğer">Diğer</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">
                    Hedef Kitle
                  </label>
                  <select
                    value={formData.targetAudience}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        targetAudience: e.target.value as AcademicEvent["targetAudience"],
                      })
                    }
                    className="w-full px-4 py-2 border border-white/10 bg-slate-950 text-white rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                  >
                    <option value="Tüm Öğrenciler">Tüm Öğrenciler</option>
                    <option value="YKS (12. Sınıf & Mezun)">YKS (12. Sınıf & Mezun)</option>
                    <option value="LGS (8. Sınıf)">LGS (8. Sınıf)</option>
                    <option value="Ara Sınıflar">Ara Sınıflar</option>
                    <option value="Veliler">Veliler</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">
                    Başlangıç Tarihi *
                  </label>
                  <input
                    type="date"
                    required
                    value={formData.startDate}
                    onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                    className="w-full px-4 py-2 border border-white/10 bg-slate-950 text-white rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">
                    Bitiş Tarihi
                  </label>
                  <input
                    type="date"
                    value={formData.endDate}
                    onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                    className="w-full px-4 py-2 border border-white/10 bg-slate-950 text-white rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">
                  Etkinlik Açıklaması
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Etkinlik veya plan hakkında detaylı açıklamalar..."
                  rows={3}
                  className="w-full px-4 py-2 border border-white/10 bg-slate-950 text-white rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                />
              </div>

              <div className="pt-4 border-t border-white/10 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 text-sm font-medium text-slate-400 hover:text-white hover:bg-white/5 rounded-xl transition-all"
                >
                  İptal
                </button>
                <button
                  type="submit"
                  className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-medium text-sm rounded-xl transition-all shadow-sm"
                >
                  <Save className="w-4 h-4" />
                  {editingEvent ? "Güncelle" : "Kaydet"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
