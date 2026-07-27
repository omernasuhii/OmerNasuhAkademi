import React, { useState, useEffect } from "react";
import {
  Calendar,
  Search,
  Filter,
  Clock,
  BookOpen,
  HelpCircle,
  AlertCircle,
  Sparkles,
} from "lucide-react";
import { db } from "../../lib/firebase";
import {
  collection,
  getDocs,
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
}

export default function ParentAcademicCalendar() {
  const [events, setEvents] = useState<AcademicEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("Hepsi");

  // Fetch events
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
      console.error("Error fetching academic calendar:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEvents();
  }, []);

  const filteredEvents = events.filter((event) => {
    const matchesSearch =
      event.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      event.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory =
      categoryFilter === "Hepsi" || event.category === categoryFilter;
    return matchesSearch && matchesCategory;
  });

  // Category Colors (Translucent Dark style)
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

  // Audience Colors (Translucent Dark style)
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

  // Upcoming calculations
  const upcomingCount = filteredEvents.filter(ev => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const start = new Date(ev.startDate);
    return start >= today;
  }).length;

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-8 animate-fade-in text-white">
      {/* Top Banner / Header */}
      <div className="relative bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 rounded-3xl p-6 md:p-8 text-white overflow-hidden shadow-xl border border-white/5">
        <div className="absolute top-0 right-0 w-80 h-80 bg-indigo-500/10 blur-3xl rounded-full pointer-events-none" />
        <div className="absolute bottom-0 left-1/3 w-64 h-64 bg-emerald-500/5 blur-3xl rounded-full pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/10 border border-white/10 text-xs font-semibold text-indigo-200 backdrop-blur-md">
              <Sparkles className="w-3.5 h-3.5" />
              Akademi & Eğitim
            </span>
            <h1 className="text-3xl font-bold tracking-tight text-white">Akademik Takvim</h1>
            <p className="text-slate-300 text-sm max-w-2xl leading-relaxed">
              Öğrencimizin eğitim sürecindeki sınav, seminer, tatil ve önemli akademik gelişmeleri buradan takip edebilirsiniz.
            </p>
          </div>

          <div className="flex items-center gap-4">
            <div className="bg-white/5 border border-white/10 rounded-2xl p-4 text-center min-w-32 backdrop-blur-md">
              <p className="text-indigo-200 text-xs font-medium uppercase tracking-wider">Aktif Etkinlik</p>
              <p className="text-3xl font-bold text-white mt-1">{filteredEvents.length}</p>
            </div>
            <div className="bg-white/5 border border-white/10 rounded-2xl p-4 text-center min-w-32 backdrop-blur-md">
              <p className="text-emerald-300 text-xs font-medium uppercase tracking-wider">Yaklaşan</p>
              <p className="text-3xl font-bold text-white mt-1">{upcomingCount}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Filter Row */}
      <div className="bg-slate-900/40 p-5 rounded-2xl border border-white/5 shadow-lg flex flex-col md:flex-row gap-4 items-center justify-between">
        <div className="relative w-full md:w-80">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 w-4.5 h-4.5" />
          <input
            type="text"
            placeholder="Etkinlik başlığı veya detay..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-white/10 bg-slate-950/40 rounded-xl text-xs text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 placeholder:text-slate-500"
          />
        </div>

        <div className="flex items-center gap-3 w-full md:w-auto">
          <Filter className="w-4 h-4 text-slate-400 shrink-0" />
          <span className="text-xs font-medium text-slate-400 shrink-0">Kategori:</span>
          <div className="flex flex-wrap gap-1.5">
            {["Hepsi", "Sınav", "Tatil", "Seminer", "Duyuru"].map((cat) => (
              <button
                key={cat}
                onClick={() => setCategoryFilter(cat)}
                className={`px-3 py-1 rounded-lg text-xs font-medium transition-all ${
                  categoryFilter === cat
                    ? "bg-indigo-600 text-white shadow-sm"
                    : "bg-slate-950/40 text-slate-300 hover:bg-white/5 border border-white/10"
                }`}
              >
                {cat === "Hepsi" ? "Hepsi" : cat}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Table Section */}
      <div className="bg-slate-800/50 rounded-3xl border border-white/10 shadow-lg overflow-hidden">
        <div className="p-6 border-b border-white/10 flex items-center justify-between">
          <div>
            <h3 className="font-bold text-white text-base">Planlama & Zaman Çizelgesi</h3>
            <p className="text-slate-400 text-xs mt-1">
              Resmi MEB takvimi ve kurum içi özel programlar entegre edilmiştir.
            </p>
          </div>
          <div className="flex items-center gap-1.5 text-xs text-slate-400 bg-slate-950/40 px-3 py-1.5 rounded-lg border border-white/5">
            <Clock className="w-3.5 h-3.5 text-indigo-400" />
            <span>Güncel Dönem: 2026 - 2027</span>
          </div>
        </div>

        {loading ? (
          <div className="p-16 text-center text-slate-400 flex flex-col items-center justify-center gap-2">
            <div className="w-8 h-8 border-4 border-indigo-500/20 border-t-indigo-500 rounded-full animate-spin"></div>
            <span className="text-xs">Akademik veriler taranıyor...</span>
          </div>
        ) : filteredEvents.length === 0 ? (
          <div className="p-16 text-center">
            <p className="text-slate-400 text-sm">Hiçbir etkinlik kriterlere uymuyor.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-900/80 border-b border-white/10 text-slate-400 text-xs font-bold uppercase tracking-wider">
                  <th className="px-6 py-4">Süreç / Etkinlik</th>
                  <th className="px-6 py-4">Kategori</th>
                  <th className="px-6 py-4">Hedef Kitle</th>
                  <th className="px-6 py-4">Başlangıç Tarihi</th>
                  <th className="px-6 py-4">Bitiş Tarihi</th>
                  <th className="px-6 py-4">Bilgilendirme & Açıklama</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5 text-slate-200 text-sm">
                {filteredEvents.map((event, index) => {
                  const today = new Date();
                  today.setHours(0, 0, 0, 0);
                  const isUpcoming = new Date(event.startDate) >= today;

                  return (
                    <tr
                      key={event.id || index}
                      className={`hover:bg-white/5 transition-colors ${
                        !isUpcoming ? "opacity-50 bg-white/2" : ""
                      }`}
                    >
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div
                            className={`w-2.5 h-2.5 rounded-full shrink-0 ${
                              event.category === "Sınav"
                                ? "bg-rose-500"
                                : event.category === "Tatil"
                                ? "bg-sky-500"
                                : event.category === "Seminer"
                                ? "bg-emerald-500"
                                : "bg-indigo-500"
                            }`}
                          />
                          <div>
                            <span className="font-semibold text-white block text-sm">
                              {event.title}
                            </span>
                            {!isUpcoming && (
                              <span className="text-[10px] text-slate-500 font-medium">
                                Tamamlandı
                              </span>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex px-2 py-1 rounded-md text-[11px] font-semibold tracking-wide ${getCategoryColor(event.category)}`}>
                          {event.category}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex px-2 py-1 rounded-md text-[11px] font-semibold tracking-wide ${getAudienceColor(event.targetAudience)}`}>
                          {event.targetAudience}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-slate-300 font-medium">
                        {new Date(event.startDate).toLocaleDateString("tr-TR", {
                          year: "numeric",
                          month: "long",
                          day: "numeric",
                        })}
                      </td>
                      <td className="px-6 py-4 text-slate-300 font-medium">
                        {event.endDate ? (
                          new Date(event.endDate).toLocaleDateString("tr-TR", {
                            year: "numeric",
                            month: "long",
                            day: "numeric",
                          })
                        ) : (
                          "-"
                        )}
                      </td>
                      <td className="px-6 py-4 text-xs text-slate-400 max-w-sm leading-relaxed">
                        {event.description || "-"}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Info Card FAQ */}
      <div className="bg-slate-900/20 rounded-2xl p-6 border border-white/5 flex flex-col md:flex-row gap-6 items-start">
        <div className="bg-indigo-600 p-3 rounded-xl text-white shrink-0">
          <BookOpen className="w-6 h-6" />
        </div>
        <div className="space-y-2">
          <h4 className="font-bold text-white text-sm">Velilerimiz İçin Bilgilendirme Notu</h4>
          <p className="text-slate-400 text-xs leading-relaxed">
            Akademik takvimdeki tarihler resmi sınav kılavuzları ve kurum planlamalarına uygun olarak hazırlanmıştır. 
            Tarihlerde yaşanabilecek güncellemeler anlık olarak sisteme yansıtılarak bildirim yoluyla tarafınıza iletilecektir.
            Herhangi bir sorunuz olması durumunda lütfen öğrencimizin eğitim koçu ile iletişime geçiniz.
          </p>
        </div>
      </div>
    </div>
  );
}
