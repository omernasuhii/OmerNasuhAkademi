import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  X, 
  ShoppingBag, 
  ListOrdered, 
  Trash2, 
  ChevronUp, 
  ChevronDown, 
  Printer, 
  Check, 
  Plus, 
  ArrowUp, 
  ArrowDown, 
  MapPin, 
  GraduationCap, 
  School, 
  Info,
  Sparkles,
  ArrowRightLeft,
  RotateCcw
} from "lucide-react";
import { Department } from "../../pages/students/TercihRobotu";

interface PreferenceBasketModalProps {
  isOpen: boolean;
  onClose: () => void;
  // Sepet Listesi
  basketList: Department[];
  onRemoveFromBasket: (id: string) => void;
  onClearBasket: () => void;

  // 24 Sıralı Tercih Listesi (Array of 24 items, null means empty slot)
  preferenceList: (Department | null)[];
  onAddToPreferenceSlot: (department: Department, targetSlotIndex?: number) => void;
  onRemoveFromPreferenceSlot: (slotIndex: number) => void;
  onMovePreferenceSlot: (fromIndex: number, toIndex: number) => void;
  onClearPreferenceList: () => void;
  onSortPreferenceListByRank: (ascending?: boolean) => void;
  onAddAllBasketToPreferenceList?: () => void;

  // Print modal trigger
  onOpenPrintView: (source: "list" | "basket") => void;
  
  // Active Tab
  initialTab?: "basket" | "list";
  activeTab?: "basket" | "list";
  onTabChange?: (tab: "basket" | "list") => void;
}

export const PreferenceBasketModal: React.FC<PreferenceBasketModalProps> = ({
  isOpen,
  onClose,
  basketList,
  onRemoveFromBasket,
  onClearBasket,
  preferenceList,
  onAddToPreferenceSlot,
  onRemoveFromPreferenceSlot,
  onMovePreferenceSlot,
  onClearPreferenceList,
  onSortPreferenceListByRank,
  onAddAllBasketToPreferenceList,
  onOpenPrintView,
  initialTab = "list",
  activeTab,
  onTabChange
}) => {
  const [internalTab, setInternalTab] = useState<"list" | "basket">(initialTab);
  const currentTab = activeTab || internalTab;

  const handleTabChange = (tab: "list" | "basket") => {
    setInternalTab(tab);
    if (onTabChange) onTabChange(tab);
  };
  const [showSlotSelectorForDept, setShowSlotSelectorForDept] = useState<Department | null>(null);

  const getQuotaInfo = (item: Department) => {
    let q2026: number | null = null;
    let q2025: number | null = null;
    if (Array.isArray(item.departmentPoints) && item.departmentPoints.length > 0) {
      const p2026 = item.departmentPoints.find((p) => String(p.year) === "2026");
      const p2025 = item.departmentPoints.find((p) => String(p.year) === "2025");
      if (p2026 && p2026.quota != null) q2026 = Number(p2026.quota);
      if (p2025 && p2025.quota != null) q2025 = Number(p2025.quota);
    }
    if (q2026 === null && item.quota != null) q2026 = Number(item.quota);

    let diff: number | null = null;
    let percent: number | null = null;
    if (q2026 !== null && q2025 !== null) {
      diff = q2026 - q2025;
      percent = q2025 > 0 ? Number(((diff / q2025) * 100).toFixed(1)) : 0;
    }
    return { q2026, q2025, diff, percent };
  };

  if (!isOpen) return null;

  // Dolu slot sayısı
  const filledSlotsCount = preferenceList.filter(Boolean).length;

  // Sepette olup 24 kişilik tercih listesine henüz EKLENMEMİŞ bölümler (atlayarak sıradan devam etmesi için)
  const availableBasketItems = basketList.filter(
    (b) => !preferenceList.some((p) => p !== null && (p.id === b.id || (p.departmentCode && p.departmentCode === b.departmentCode)))
  );

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/80 backdrop-blur-md">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          className="bg-slate-900 border border-white/10 rounded-2xl shadow-2xl w-full max-w-5xl max-h-[92vh] flex flex-col overflow-hidden text-slate-100"
        >
          {/* Header */}
          <div className="p-4 sm:p-5 border-b border-white/10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 bg-slate-950/60">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-gradient-to-br from-blue-500/20 to-indigo-500/20 border border-blue-500/30 rounded-xl text-blue-400">
                <ListOrdered className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-white flex items-center gap-2">
                  Tercih Listesi & Sepeti
                </h3>
                <p className="text-xs text-slate-400">
                  24 Haklı YKS Tercih Listenizi oluşturun, sıralamanızı belirleyin ve yazdırmaya hazır hale getirin.
                </p>
              </div>
            </div>

            {/* Quick Actions & Close */}
            <div className="flex items-center gap-2 w-full sm:w-auto justify-between sm:justify-end">
              <button
                onClick={() => onOpenPrintView(currentTab)}
                className="px-3.5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold rounded-xl text-xs flex items-center gap-2 shadow-lg shadow-indigo-600/20 transition-all cursor-pointer"
              >
                <Printer className="w-4 h-4" />
                Yazdır / PDF Kaydet
              </button>

              <button
                onClick={onClose}
                className="p-2 text-slate-400 hover:text-white hover:bg-white/10 rounded-xl transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Navigation Tabs Bar */}
          <div className="px-4 py-2.5 bg-slate-950/40 border-b border-white/5 flex items-center justify-between gap-2 overflow-x-auto">
            <div className="flex items-center gap-2">
              <button
                onClick={() => handleTabChange("list")}
                className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 transition-all cursor-pointer ${
                  currentTab === "list"
                    ? "bg-blue-600 text-white shadow-lg shadow-blue-600/20"
                    : "bg-slate-800/50 text-slate-400 hover:text-white hover:bg-slate-800"
                }`}
              >
                <ListOrdered className="w-4 h-4" />
                Tercih Listem (24 Sıralı Slot)
                <span className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold ${
                  currentTab === "list" ? "bg-white/20 text-white" : "bg-slate-700 text-slate-300"
                }`}>
                  {filledSlotsCount} / 24
                </span>
              </button>

              <button
                onClick={() => handleTabChange("basket")}
                className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 transition-all cursor-pointer ${
                  currentTab === "basket"
                    ? "bg-blue-600 text-white shadow-lg shadow-blue-600/20"
                    : "bg-slate-800/50 text-slate-400 hover:text-white hover:bg-slate-800"
                }`}
              >
                <ShoppingBag className="w-4 h-4" />
                Tercih Sepetim (Havuz)
                <span className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold ${
                  currentTab === "basket" ? "bg-white/20 text-white" : "bg-slate-700 text-slate-300"
                }`}>
                  {basketList.length}
                </span>
              </button>
            </div>

            {/* Quick List Info Bar */}
            {currentTab === "list" && (
              <div className="hidden md:flex items-center gap-2">
                {availableBasketItems.length > 0 && (
                  <button
                    onClick={() => {
                      if (onAddAllBasketToPreferenceList) {
                        onAddAllBasketToPreferenceList();
                      } else {
                        availableBasketItems.forEach((bItem) => {
                          onAddToPreferenceSlot(bItem);
                        });
                      }
                    }}
                    className="px-2.5 py-1.5 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/20 rounded-lg text-[11px] font-semibold flex items-center gap-1 transition-colors cursor-pointer"
                    title="Sepetteki henüz eklenmemiş tüm bölümleri sırayla boş slotlara yerleştir"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    Tüm Sepeti Listeye Dök ({availableBasketItems.length})
                  </button>
                )}

                <button
                  onClick={() => onSortPreferenceListByRank(true)}
                  className="px-2.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 border border-white/5 rounded-lg text-[11px] font-medium flex items-center gap-1 transition-colors cursor-pointer"
                  title="Sıralamaları Başarı Sırasına göre Yüksekten Düşüğe doğru diz"
                >
                  <ArrowUp className="w-3 h-3 text-blue-400" />
                  Sıralamaya Göre Diz
                </button>
                {filledSlotsCount > 0 && (
                  <button
                    onClick={onClearPreferenceList}
                    className="px-2.5 py-1.5 bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/20 rounded-lg text-[11px] font-medium flex items-center gap-1 transition-colors cursor-pointer"
                  >
                    <Trash2 className="w-3 h-3" />
                    Listeyi Temizle
                  </button>
                )}
              </div>
            )}
            
            {currentTab === "basket" && basketList.length > 0 && (
              <button
                onClick={onClearBasket}
                className="px-2.5 py-1.5 bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/20 rounded-lg text-[11px] font-medium flex items-center gap-1 transition-colors cursor-pointer"
              >
                <Trash2 className="w-3 h-3" />
                Sepeti Temizle
              </button>
            )}
          </div>

          {/* Progress Bar for Preference List */}
          {currentTab === "list" && (
            <div className="px-5 py-2.5 bg-slate-950/60 border-b border-white/5 flex items-center gap-4">
              <span className="text-xs font-semibold text-slate-300 whitespace-nowrap">
                Doluluk Durumu:
              </span>
              <div className="flex-1 bg-slate-800 h-2.5 rounded-full overflow-hidden p-0.5 border border-white/5">
                <div
                  className="bg-gradient-to-r from-blue-500 to-indigo-500 h-full rounded-full transition-all duration-300"
                  style={{ width: `${(filledSlotsCount / 24) * 100}%` }}
                />
              </div>
              <span className="text-xs font-bold text-blue-400">
                %{Math.round((filledSlotsCount / 24) * 100)} ({filledSlotsCount}/24)
              </span>
            </div>
          )}

          {/* Modal Main Content Area */}
          <div className="p-4 sm:p-5 flex-1 overflow-y-auto custom-scrollbar">
            
            {/* TAB 1: TERCİH LİSTEM (24 SLOT) */}
            {currentTab === "list" && (
              <div className="space-y-3">
                {preferenceList.map((item, index) => {
                  const slotNum = index + 1;
                  return (
                    <div
                      key={`slot-${index}`}
                      className={`p-3 sm:p-4 rounded-xl border transition-all ${
                        item
                          ? "bg-slate-950/70 border-blue-500/30 hover:border-blue-500/50 shadow-md"
                          : "bg-slate-950/30 border-white/5 border-dashed hover:border-white/20"
                      }`}
                    >
                      <div className="flex items-start sm:items-center justify-between gap-3 flex-col sm:flex-row">
                        
                        {/* Slot Badge & Program Details */}
                        <div className="flex items-start sm:items-center gap-3.5 flex-1 min-w-0 w-full">
                          <div className={`w-9 h-9 rounded-xl flex items-center justify-center font-extrabold text-sm shrink-0 ${
                            item ? "bg-blue-600 text-white shadow-md shadow-blue-600/30" : "bg-slate-800 text-slate-500"
                          }`}>
                            {slotNum}
                          </div>

                          {item ? (
                            <div className="min-w-0 flex-1 space-y-1">
                              <div className="flex flex-wrap items-center gap-2">
                                <span className="text-xs font-bold text-white truncate">
                                  {item.universityName || item.university?.name}
                                </span>
                                {item.pointName && (
                                  <span className="px-2 py-0.5 bg-blue-500/10 border border-blue-500/20 text-blue-400 rounded text-[10px] font-bold">
                                    {item.pointName}
                                  </span>
                                )}
                                {item.feeType && (
                                  <span className="px-2 py-0.5 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 rounded text-[10px] font-medium">
                                    {item.feeType}
                                  </span>
                                )}
                              </div>

                              <p className="text-xs text-blue-300 font-semibold truncate">
                                {item.name}
                              </p>

                              {(() => {
                                const qInfo = getQuotaInfo(item);
                                return (
                                  <div className="flex flex-wrap items-center gap-3 text-[11px] text-slate-400">
                                    <span className="flex items-center gap-1">
                                      <MapPin className="w-3 h-3 text-slate-500" />
                                      {item.university?.city?.name || item.city?.name || "Şehir Belirtilmemiş"}
                                    </span>
                                    <span>•</span>
                                    <span>
                                      Sıralama: <strong className="text-slate-200">{item.lastBasePointOrder ? item.lastBasePointOrder.toLocaleString("tr-TR") : "Dolmadı"}</strong>
                                    </span>
                                    <span>•</span>
                                    <span>
                                      Puan: <strong className="text-slate-200">{item.lastBasePoint ? item.lastBasePoint : "-"}</strong>
                                    </span>
                                    <span>•</span>
                                    <span className="flex items-center gap-1">
                                      Kontenjan: <strong className="text-slate-200">{qInfo.q2026 ?? item.quota ?? "-"}</strong>
                                      {qInfo.diff !== null && (
                                        <span className={`ml-0.5 px-1.5 py-0.5 rounded text-[10px] font-bold ${
                                          qInfo.diff > 0 
                                            ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/30" 
                                            : qInfo.diff < 0 
                                            ? "bg-rose-500/20 text-rose-300 border border-rose-500/30" 
                                            : "bg-slate-800 text-slate-400 border border-white/10"
                                        }`} title={`2025 Kontenjanı: ${qInfo.q2025}`}>
                                          {qInfo.diff > 0 ? `+${qInfo.diff}` : qInfo.diff} {qInfo.percent !== null ? `(%${qInfo.percent > 0 ? '+' : ''}${qInfo.percent})` : ''}
                                        </span>
                                      )}
                                    </span>
                                  </div>
                                );
                              })()}
                            </div>
                          ) : (
                            <div className="flex-1 flex items-center justify-between text-xs text-slate-500">
                              <span>Boş Tercih Yuvası #{slotNum}</span>
                            </div>
                          )}
                        </div>

                        {/* Actions for Slot */}
                        <div className="flex items-center gap-1.5 self-end sm:self-center shrink-0 w-full sm:w-auto justify-end pt-2 sm:pt-0 border-t sm:border-t-0 border-white/5">
                          {item ? (
                            <>
                              <button
                                disabled={index === 0}
                                onClick={() => onMovePreferenceSlot(index, index - 1)}
                                className="p-1.5 bg-slate-800 hover:bg-slate-700 disabled:opacity-30 disabled:hover:bg-slate-800 text-slate-300 rounded-lg transition-colors cursor-pointer"
                                title="Yukarı Taşı"
                              >
                                <ChevronUp className="w-4 h-4" />
                              </button>

                              <button
                                disabled={index === 23}
                                onClick={() => onMovePreferenceSlot(index, index + 1)}
                                className="p-1.5 bg-slate-800 hover:bg-slate-700 disabled:opacity-30 disabled:hover:bg-slate-800 text-slate-300 rounded-lg transition-colors cursor-pointer"
                                title="Aşağı Taşı"
                              >
                                <ChevronDown className="w-4 h-4" />
                              </button>

                              <button
                                onClick={() => onRemoveFromPreferenceSlot(index)}
                                className="p-1.5 bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/20 rounded-lg transition-colors cursor-pointer"
                                title="Listeden Çıkar"
                              >
                                <X className="w-4 h-4" />
                              </button>
                            </>
                          ) : (
                            basketList.length > 0 && (
                              availableBasketItems.length > 0 ? (
                                <button
                                  onClick={() => {
                                    // Sepetten ekle butonunda ekli olanı atlayıp sıradaki ilk eklenmemiş elemanı koyar
                                    onAddToPreferenceSlot(availableBasketItems[0], index);
                                  }}
                                  className="px-3 py-1.5 bg-blue-600/20 hover:bg-blue-600/30 text-blue-400 border border-blue-500/30 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer hover:scale-105 active:scale-95 shadow-sm"
                                  title={`Sıradaki eklenmemiş sepet elemanını ekle: ${availableBasketItems[0].universityName || availableBasketItems[0].university?.name} - ${availableBasketItems[0].name}`}
                                >
                                  <Plus className="w-3.5 h-3.5" />
                                  Sepetten Ekle
                                </button>
                              ) : (
                                <span className="px-2.5 py-1 bg-slate-800/80 text-slate-400 border border-white/10 rounded-lg text-[11px] font-semibold flex items-center gap-1 select-none">
                                  <Check className="w-3.5 h-3.5 text-emerald-400" />
                                  Tüm Sepet Ekli
                                </span>
                              )
                            )
                          )}
                        </div>

                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {/* TAB 2: TERCİH SEPETİM (HAVUZ) */}
            {currentTab === "basket" && (
              <div className="space-y-4">
                {basketList.length === 0 ? (
                  <div className="p-10 border border-white/5 bg-slate-950/40 rounded-2xl text-center space-y-3">
                    <div className="w-12 h-12 rounded-2xl bg-blue-500/10 text-blue-400 flex items-center justify-center mx-auto">
                      <ShoppingBag className="w-6 h-6" />
                    </div>
                    <h4 className="text-base font-bold text-white">
                      Tercih Sepetiniz Henüz Boş
                    </h4>
                    <p className="text-xs text-slate-400 max-w-md mx-auto">
                      Arama sonuçlarında beğendiğiniz üniversite bölümlerini "+ Sepete Ekle" butonuna basarak bu havuzda toplayabilir, ardından 24 sıralı listenize yerleştirebilirsiniz.
                    </p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {basketList.map((item) => {
                      const isInPreferenceList = preferenceList.some((p) => p?.id === item.id);
                      return (
                        <div
                          key={`basket-${item.id}`}
                          className="p-4 bg-slate-950/60 border border-white/10 rounded-2xl hover:border-blue-500/40 transition-all flex flex-col justify-between gap-3 group"
                        >
                          <div className="space-y-2">
                            <div className="flex items-start justify-between gap-2">
                              <span className="text-xs font-bold text-slate-300">
                                {item.universityName || item.university?.name}
                              </span>
                              {item.pointName && (
                                <span className="px-2 py-0.5 bg-blue-500/10 border border-blue-500/20 text-blue-400 rounded text-[10px] font-bold">
                                  {item.pointName}
                                </span>
                              )}
                            </div>

                            <h4 className="text-sm font-bold text-white group-hover:text-blue-300 transition-colors">
                              {item.name}
                            </h4>

                            {(() => {
                              const qInfo = getQuotaInfo(item);
                              return (
                                <div className="flex flex-wrap items-center gap-2 text-[11px] text-slate-400">
                                  <span>Şehir: <strong className="text-slate-300">{item.university?.city?.name || item.city?.name || "-"}</strong></span>
                                  <span>•</span>
                                  <span>Sıra: <strong className="text-slate-300">{item.lastBasePointOrder ? item.lastBasePointOrder.toLocaleString("tr-TR") : "-"}</strong></span>
                                  <span>•</span>
                                  <span>Kontenjan: <strong className="text-slate-300">{qInfo.q2026 ?? item.quota ?? "-"}</strong></span>
                                  {qInfo.diff !== null && (
                                    <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                                      qInfo.diff > 0 
                                        ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/30" 
                                        : qInfo.diff < 0 
                                        ? "bg-rose-500/20 text-rose-300 border border-rose-500/30" 
                                        : "bg-slate-800 text-slate-400 border border-white/10"
                                    }`} title={`2025 Kontenjanı: ${qInfo.q2025}`}>
                                      Değişim: {qInfo.diff > 0 ? `+${qInfo.diff}` : qInfo.diff} {qInfo.percent !== null ? `(%${qInfo.percent > 0 ? '+' : ''}${qInfo.percent})` : ''}
                                    </span>
                                  )}
                                </div>
                              );
                            })()}
                          </div>

                          {/* Basket Item Actions */}
                          <div className="pt-2 border-t border-white/5 flex items-center justify-between gap-2">
                            <button
                              onClick={() => onRemoveFromBasket(item.id)}
                              className="px-2.5 py-1.5 text-rose-400 hover:text-rose-300 hover:bg-rose-500/10 rounded-xl text-xs font-medium flex items-center gap-1 transition-colors cursor-pointer"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                              Kaldır
                            </button>

                            {isInPreferenceList ? (
                              <span className="px-3 py-1.5 bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 rounded-xl text-xs font-bold flex items-center gap-1">
                                <Check className="w-3.5 h-3.5" />
                                Listede Eklendi
                              </span>
                            ) : (
                              <button
                                onClick={() => onAddToPreferenceSlot(item)}
                                className="px-3.5 py-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all shadow-md shadow-blue-600/20 cursor-pointer"
                              >
                                <Plus className="w-3.5 h-3.5" />
                                Tercih Listesine Ekle
                              </button>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}

          </div>

          {/* Footer */}
          <div className="p-4 border-t border-white/10 bg-slate-950/60 flex items-center justify-between">
            <div className="text-xs text-slate-400">
              {activeTab === "list" ? (
                <span>Kalan Tercih Hakkınız: <strong className="text-blue-400">{24 - filledSlotsCount} slot</strong></span>
              ) : (
                <span>Sepetinizde Toplam <strong className="text-blue-400">{basketList.length} program</strong> kayıtlı.</span>
              )}
            </div>

            <button
              onClick={onClose}
              className="px-5 py-2 bg-slate-800 hover:bg-slate-700 text-white font-bold rounded-xl text-xs transition-colors cursor-pointer"
            >
              Kapat
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
