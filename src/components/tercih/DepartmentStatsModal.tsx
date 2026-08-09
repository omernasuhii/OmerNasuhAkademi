import React, { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  X, 
  Search, 
  Check, 
  Layers, 
  Plus, 
  FilterX, 
  RotateCcw, 
  CheckCircle2, 
  XCircle,
  Building2,
  FolderTree,
  SlidersHorizontal
} from "lucide-react";
import { Department } from "../../pages/students/TercihRobotu";

interface DepartmentStatsModalProps {
  isOpen: boolean;
  onClose: () => void;
  // ExcludedDepartments uygulanmamış filtrelenmiş veriler
  unfilteredData?: Department[];
  allFilteredData?: Department[];
  excludedDepartments: string[];
  onToggleExcludeDepartment?: (deptName: string) => void;
  onToggleDepartmentExclusion?: (deptName: string) => void;
  onClearExcludedDepartments?: () => void;
  onResetExclusions?: () => void;
  onExcludeAllDepartments?: (deptNames: string[]) => void;
}

export const DepartmentStatsModal: React.FC<DepartmentStatsModalProps> = ({
  isOpen,
  onClose,
  unfilteredData,
  allFilteredData,
  excludedDepartments,
  onToggleExcludeDepartment,
  onToggleDepartmentExclusion,
  onClearExcludedDepartments,
  onResetExclusions,
  onExcludeAllDepartments,
}) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [activeTab, setActiveTab] = useState<"all" | "included" | "excluded">("all");

  const dataToUse = unfilteredData || allFilteredData || [];
  const handleToggle = onToggleExcludeDepartment || onToggleDepartmentExclusion || (() => {});
  const handleReset = onClearExcludedDepartments || onResetExclusions || (() => {});

  // Bölüm bazlı program dağılımı haritası
  const deptStats = useMemo(() => {
    const map: Record<string, number> = {};
    
    dataToUse.forEach((item) => {
      const name = item.name?.trim();
      if (name) {
        map[name] = (map[name] || 0) + 1;
      }
    });

    // Tüm bölüm isimlerini birleştir (Mevcut filtrelere uyanlar + manuel çıkarılanlar)
    const allDeptNames = Array.from(new Set([
      ...Object.keys(map),
      ...excludedDepartments
    ]));

    const list = allDeptNames.map((name) => ({
      name,
      count: map[name] || 0,
      isExcluded: excludedDepartments.includes(name),
    }));

    list.sort((a, b) => {
      if (a.isExcluded !== b.isExcluded) {
        return a.isExcluded ? 1 : -1;
      }
      if (b.count !== a.count) {
        return b.count - a.count;
      }
      return a.name.localeCompare(b.name, 'tr');
    });

    return list;
  }, [dataToUse, excludedDepartments]);

  // Dahil edilenler ve Çıkarılanlar grupları
  const includedDepts = useMemo(() => {
    return deptStats.filter((d) => !d.isExcluded);
  }, [deptStats]);

  const excludedDepts = useMemo(() => {
    return deptStats.filter((d) => d.isExcluded);
  }, [deptStats]);

  // Arama filtresi uygulanmış olanlar
  const filteredIncluded = useMemo(() => {
    if (!searchTerm.trim()) return includedDepts;
    const term = searchTerm.toLowerCase();
    return includedDepts.filter((d) => d.name.toLowerCase().includes(term));
  }, [includedDepts, searchTerm]);

  const filteredExcluded = useMemo(() => {
    if (!searchTerm.trim()) return excludedDepts;
    const term = searchTerm.toLowerCase();
    return excludedDepts.filter((d) => d.name.toLowerCase().includes(term));
  }, [excludedDepts, searchTerm]);

  if (!isOpen) return null;

  const totalIncludedPrograms = includedDepts.reduce((acc, curr) => acc + curr.count, 0);
  const totalExcludedPrograms = excludedDepts.reduce((acc, curr) => acc + curr.count, 0);

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          className="bg-slate-900 border border-white/10 rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden text-slate-100"
        >
          {/* Header */}
          <div className="p-5 border-b border-white/10 flex items-center justify-between bg-slate-950/50">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-blue-500/10 border border-blue-500/20 rounded-xl text-blue-400">
                <FolderTree className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-white flex items-center gap-2">
                  Bölüm Dağılımı ve Filtreleme
                </h3>
                <p className="text-xs text-slate-400">
                  Filtrelere uyan tüm programların bölüm dağılımlarını inceleyin ve istemediğiniz bölümleri listeden çıkarın.
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-white hover:bg-white/10 rounded-xl transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Controls Bar */}
          <div className="p-4 border-b border-white/5 bg-slate-900/60 flex flex-col sm:flex-row items-center justify-between gap-3">
            {/* Search Input */}
            <div className="relative w-full sm:w-72">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Bölüm ismi ara..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full bg-slate-950/60 border border-white/10 rounded-xl pl-9 pr-4 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-blue-500/50"
              />
              {searchTerm && (
                <button
                  onClick={() => setSearchTerm("")}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {/* Quick Action Buttons */}
            <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
              {excludedDepartments.length > 0 && (
                <button
                  onClick={handleReset}
                  className="px-3 py-1.5 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/20 rounded-xl text-xs font-medium flex items-center gap-1.5 transition-colors cursor-pointer"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  Tümünü Dahil Et ({excludedDepartments.length})
                </button>
              )}
              
              {onExcludeAllDepartments && (
                <button
                  onClick={() => onExcludeAllDepartments(includedDepts.map(d => d.name))}
                  className="px-3 py-1.5 bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/20 rounded-xl text-xs font-medium flex items-center gap-1.5 transition-colors cursor-pointer"
                >
                  <FilterX className="w-3.5 h-3.5" />
                  Listelenenleri Temizle
                </button>
              )}
            </div>
          </div>

          {/* Stats Bar / Overview */}
          <div className="px-5 py-3 bg-slate-950/40 border-b border-white/5 flex items-center justify-between text-xs">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-1.5 text-blue-400 font-semibold">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                Dahil Edilen: <span className="text-white">{includedDepts.length} Bölüm ({totalIncludedPrograms} Program)</span>
              </div>
              <div className="flex items-center gap-1.5 text-rose-400 font-semibold">
                <XCircle className="w-4 h-4 text-rose-400" />
                Çıkarılan: <span className="text-white">{excludedDepts.length} Bölüm ({totalExcludedPrograms} Program)</span>
              </div>
            </div>
          </div>

          {/* Modal Content - Dual Lists / Groups */}
          <div className="p-5 flex-1 overflow-y-auto custom-scrollbar space-y-6">
            
            {/* GRUP 1: DAHİL EDİLEN BÖLÜMLER */}
            <div className="space-y-3">
              <div className="flex items-center justify-between pb-2 border-b border-emerald-500/20">
                <div className="flex items-center gap-2">
                  <div className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
                  <h4 className="text-xs font-bold text-emerald-400 uppercase tracking-wider flex items-center gap-2">
                    Dahil Edilen Bölümler ({filteredIncluded.length})
                  </h4>
                </div>
                <span className="text-[11px] text-slate-400">
                  Sonuçlarda listelenen programlar
                </span>
              </div>

              {filteredIncluded.length === 0 ? (
                <div className="p-4 bg-slate-950/30 rounded-xl border border-white/5 text-center text-xs text-slate-500">
                  {searchTerm ? "Aramanıza uygun dahil edilen bölüm bulunamadı." : "Hiç dahil edilen bölüm bulunmuyor."}
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2.5">
                  {filteredIncluded.map((dept) => (
                    <div
                      key={`inc-${dept.name}`}
                      className="p-3 bg-slate-950/50 hover:bg-slate-800/50 border border-emerald-500/20 rounded-xl flex items-center justify-between gap-2 transition-all group"
                    >
                      <div className="min-w-0 flex-1">
                        <p className="text-xs font-semibold text-slate-200 truncate group-hover:text-white">
                          {dept.name}
                        </p>
                        <p className="text-[10px] text-emerald-400/80 font-medium">
                          {dept.count} Program Geliyor
                        </p>
                      </div>
                      <button
                        onClick={() => handleToggle(dept.name)}
                        className="px-2.5 py-1 bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/30 text-rose-400 hover:text-rose-300 rounded-lg text-[11px] font-medium flex items-center gap-1 transition-all cursor-pointer whitespace-nowrap"
                        title="Bu bölümü sonuçlardan çıkar"
                      >
                        <X className="w-3 h-3" />
                        Çıkar
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* GRUP 2: ÇIKARILAN BÖLÜMLER */}
            <div className="space-y-3 pt-2">
              <div className="flex items-center justify-between pb-2 border-b border-rose-500/20">
                <div className="flex items-center gap-2">
                  <div className="w-2.5 h-2.5 rounded-full bg-rose-400" />
                  <h4 className="text-xs font-bold text-rose-400 uppercase tracking-wider flex items-center gap-2">
                    Çıkarılan / Hariç Tutulan Bölümler ({filteredExcluded.length})
                  </h4>
                </div>
                <span className="text-[11px] text-slate-400">
                  Sonuçlardan gizlenen bölümler
                </span>
              </div>

              {filteredExcluded.length === 0 ? (
                <div className="p-4 bg-slate-950/30 rounded-xl border border-white/5 text-center text-xs text-slate-500">
                  {searchTerm ? "Aramanıza uygun çıkarılan bölüm bulunamadı." : "Henüz sonuçlardan çıkarılan hiçbir bölüm yok."}
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2.5">
                  {filteredExcluded.map((dept) => (
                    <div
                      key={`exc-${dept.name}`}
                      className="p-3 bg-rose-950/10 hover:bg-rose-950/20 border border-rose-500/30 rounded-xl flex items-center justify-between gap-2 transition-all opacity-85 hover:opacity-100"
                    >
                      <div className="min-w-0 flex-1">
                        <p className="text-xs font-semibold text-rose-200 line-through truncate">
                          {dept.name}
                        </p>
                        <p className="text-[10px] text-rose-400/80 font-medium">
                          {dept.count} Program Hariç Tutuldu
                        </p>
                      </div>
                      <button
                        onClick={() => handleToggle(dept.name)}
                        className="px-2.5 py-1 bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/30 text-emerald-400 hover:text-emerald-300 rounded-lg text-[11px] font-medium flex items-center gap-1 transition-all cursor-pointer whitespace-nowrap"
                        title="Bu bölümü tekrar sonuçlara ekle"
                      >
                        <Plus className="w-3 h-3" />
                        Geri Dahil Et
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

          </div>

          {/* Footer */}
          <div className="p-4 border-t border-white/10 bg-slate-950/60 flex items-center justify-between">
            <span className="text-xs text-slate-400">
              Değişiklikler arama sonuçlarını anında etkiler.
            </span>
            <button
              onClick={onClose}
              className="px-5 py-2 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-xl text-xs transition-colors cursor-pointer shadow-lg shadow-blue-600/20"
            >
              Tamam / Uygula
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
