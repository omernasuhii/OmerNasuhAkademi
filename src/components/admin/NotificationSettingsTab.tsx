import React, { useState, useEffect } from 'react';
import { 
  Bell, 
  Clock, 
  Calendar, 
  CheckCircle2, 
  AlertTriangle, 
  RefreshCw, 
  Save, 
  Play, 
  ShieldCheck, 
  Smartphone, 
  Users, 
  GraduationCap, 
  Briefcase, 
  Sparkles, 
  Flame, 
  Info, 
  Check, 
  Zap, 
  Terminal, 
  Layers, 
  Settings, 
  ChevronRight,
  Send,
  Sliders,
  Timer
} from 'lucide-react';
import { doc, getDoc, setDoc, serverTimestamp, collection, getDocs, query, orderBy, limit } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { motion, AnimatePresence } from 'motion/react';
import NotificationTesterModal from '../notifications/NotificationTesterModal';

export interface NotificationRuleSettings {
  // Global Engine Master Switch
  engineActive: boolean;

  // 1. Randevu Hatırlatıcıları
  appointmentsEnabled: boolean;
  appointment24hEnabled: boolean;
  appointment1hEnabled: boolean;
  appointmentLeadMinutes: number; // varsayılan 60 dk
  appointmentStudentTemplate: string;
  appointmentCoachTemplate: string;

  // 2. Sabah Günlük Plan & Görev Hatırlatıcısı
  morningReminderEnabled: boolean;
  morningReminderTime: string; // "09:00"
  morningTitle: string;
  morningMessage: string;

  // 3. Akşam Tamamlanmamış Görev Uyarısı
  eveningReminderEnabled: boolean;
  eveningReminderTime: string; // "20:00"
  eveningTitle: string;
  eveningMessage: string;

  // 4. Pasiflik & Koç Erken Müdahale Uyarısı
  inactivityAlertEnabled: boolean;
  inactivityDaysThreshold: number; // 3 gün
  inactivityCheckTime: string; // "21:00"
  inactivityCoachTitle: string;
  inactivityCoachMessage: string;
  inactivityStudentTitle: string;
  inactivityStudentMessage: string;

  // 5. Abonelik & Bakiye Uyarısı
  subscriptionReminderEnabled: boolean;
  subscriptionDaysBefore: number; // 3 gün
  subscriptionReminderTime: string; // "19:00"
  subscriptionTitle: string;
  subscriptionMessage: string;

  // 6. Etkinlik & Seminer Hatırlatıcıları
  eventReminderEnabled: boolean;
  event24hEnabled: boolean;
  event1hEnabled: boolean;
  eventTitle: string;
  eventMessage: string;

  // 7. Çalışma Serisi & Başarı Motivasyonu
  streakMilestoneEnabled: boolean;
  streakWarningEnabled: boolean;

  // Metadata
  updatedAt?: any;
  updatedBy?: string;
}

export const defaultNotificationSettings: NotificationRuleSettings = {
  engineActive: true,

  appointmentsEnabled: true,
  appointment24hEnabled: true,
  appointment1hEnabled: true,
  appointmentLeadMinutes: 60,
  appointmentStudentTemplate: "Hatırlatma: '{coachName}' ile olan randevunuz {timeLeft} sonra başlayacak. Hazır mısınız? 🚀",
  appointmentCoachTemplate: "Hatırlatma: '{studentName}' ile olan randevunuza {timeLeft} kaldı.",

  morningReminderEnabled: true,
  morningReminderTime: "09:00",
  morningTitle: "Günaydın! Bugünkü Görevlerin Hazır ☀️",
  morningMessage: "Bugün hedeflerine bir adım daha yaklaşma vakti! Günlük çalışma planını incelemeyi unutma.",

  eveningReminderEnabled: true,
  eveningReminderTime: "20:00",
  eveningTitle: "Gün Sonu Çalışma Hatırlatması 🌙",
  eveningMessage: "Bugün henüz tamamlanmamış görevlerin bulunuyor. Haydi masaya, hedeflerini tamamla!",

  inactivityAlertEnabled: true,
  inactivityDaysThreshold: 3,
  inactivityCheckTime: "21:00",
  inactivityCoachTitle: "Öğrenci Pasiflik Uyarısı 🚨",
  inactivityCoachMessage: "'{studentName}' adlı öğrenciniz son {days} gündür sisteme çalışma girişi yapmadı. Erken müdahale için iletişime geçebilirsiniz.",
  inactivityStudentTitle: "FocusON Seni Özledi! 🎯",
  inactivityStudentMessage: "Birkaç gündür çalışma girişi yapmadığını fark ettik. Hedeflerine odaklanmak için bugün küçük bir adımla başla!",

  subscriptionReminderEnabled: true,
  subscriptionDaysBefore: 3,
  subscriptionReminderTime: "19:00",
  subscriptionTitle: "Abonelik Bitişi Yaklaşıyor ⏳",
  subscriptionMessage: "Koçluk aboneliğinizin yenilenmesine son {days} gün kaldı.",

  eventReminderEnabled: true,
  event24hEnabled: true,
  event1hEnabled: true,
  eventTitle: "Etkinlik Hatırlatıcısı 🎟️",
  eventMessage: "Kayıt olduğunuz '{eventTitle}' etkinliği yaklaşıyor. Başlama saati: {eventTime}",

  streakMilestoneEnabled: true,
  streakWarningEnabled: true
};

export default function NotificationSettingsTab() {
  const [settings, setSettings] = useState<NotificationRuleSettings>(defaultNotificationSettings);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  
  // Execution & Engine State
  const [triggeringEngine, setTriggeringEngine] = useState(false);
  const [triggerResult, setTriggerResult] = useState<any>(null);
  const [activeSubTab, setActiveSubTab] = useState<'rules' | 'logs' | 'tester'>('rules');
  const [serverStatus, setServerStatus] = useState<any>(null);
  const [showTesterModal, setShowTesterModal] = useState(false);
  const [recentLogs, setRecentLogs] = useState<any[]>([]);

  const fetchSettings = async () => {
    try {
      setLoading(true);
      const docRef = doc(db, 'settings', 'notifications');
      const snap = await getDoc(docRef);
      if (snap.exists()) {
        setSettings({ ...defaultNotificationSettings, ...snap.data() });
      } else {
        // Create initial default document
        await setDoc(docRef, { ...defaultNotificationSettings, updatedAt: serverTimestamp() });
        setSettings(defaultNotificationSettings);
      }
    } catch (err) {
      console.error("Bildirim ayarları alınırken hata:", err);
    } finally {
      setLoading(false);
    }
  };

  const fetchServerStatus = async () => {
    try {
      const res = await fetch('/api/push-status');
      if (res.ok) {
        const data = await res.json();
        setServerStatus(data);
      }
    } catch (e) {
      console.warn("Push sunucu durumu alınamadı:", e);
    }
  };

  const fetchRecentLogs = async () => {
    try {
      const q = query(collection(db, 'notification_engine_logs'), orderBy('timestamp', 'desc'), limit(15));
      const snap = await getDocs(q);
      const list = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      setRecentLogs(list);
    } catch (err) {
      // If collection doesn't exist yet or index is missing, fail silently
    }
  };

  useEffect(() => {
    fetchSettings();
    fetchServerStatus();
    fetchRecentLogs();
  }, []);

  const handleSaveSettings = async () => {
    try {
      setSaving(true);
      const docRef = doc(db, 'settings', 'notifications');
      await setDoc(docRef, {
        ...settings,
        updatedAt: serverTimestamp()
      }, { merge: true });

      // Also notify server endpoint if available
      try {
        await fetch('/api/notifications/settings', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(settings)
        });
      } catch (e) {
        // Firestore save is primary
      }

      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3500);
    } catch (err) {
      console.error("Ayarlar kaydedilemedi:", err);
      alert("Ayarlar kaydedilirken bir hata oluştu.");
    } finally {
      setSaving(false);
    }
  };

  const handleTriggerEngine = async (forceAll: boolean = true) => {
    try {
      setTriggeringEngine(true);
      setTriggerResult(null);

      const res = await fetch('/api/notifications/trigger-engine', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ forceAll })
      });

      const data = await res.json();
      setTriggerResult(data);
      fetchRecentLogs();
    } catch (err: any) {
      setTriggerResult({
        success: false,
        error: err?.message || "Sunucu ile bağlantı kurulamadı."
      });
    } finally {
      setTriggeringEngine(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center p-16 space-y-4">
        <div className="w-10 h-10 border-4 border-purple-500/20 border-t-purple-500 rounded-full animate-spin"></div>
        <p className="text-slate-400 text-xs font-medium">Bildirim sistemi ayarları yükleniyor...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Top Action Bar & Engine Status Card */}
      <div className="bg-gradient-to-br from-slate-900 via-slate-900/90 to-purple-950/40 border border-white/10 rounded-3xl p-6 relative overflow-hidden shadow-2xl">
        <div className="absolute top-0 right-0 w-80 h-80 bg-purple-500/10 rounded-full blur-3xl -mr-20 -mt-20 pointer-events-none" />

        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="flex flex-wrap items-center gap-2">
              <span className="bg-purple-500/10 border border-purple-500/20 text-purple-400 text-[10px] font-black uppercase tracking-wider px-3 py-1 rounded-full flex items-center gap-1.5">
                <Zap size={14} /> Otomatik Zamanlayıcı Motoru (Cron & Push)
              </span>

              {serverStatus?.adminInitialized ? (
                <span className="bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-[10px] font-bold px-2.5 py-0.5 rounded-full flex items-center gap-1">
                  <ShieldCheck size={12} /> FCM Push Servisi Aktif
                </span>
              ) : (
                <span className="bg-yellow-500/10 border border-yellow-500/20 text-yellow-400 text-[10px] font-bold px-2.5 py-0.5 rounded-full flex items-center gap-1">
                  <AlertTriangle size={12} /> FCM Hazırlanıyor
                </span>
              )}

              <span className="bg-blue-500/10 border border-blue-500/20 text-blue-400 text-[10px] font-bold px-2.5 py-0.5 rounded-full flex items-center gap-1">
                <Clock size={12} /> Periyot: Her 10 Dk
              </span>
            </div>

            <h2 className="text-xl md:text-2xl font-black text-white tracking-tight">
              Otomatik Bildirim Sistemi & Zamanlayıcı
            </h2>
            <p className="text-slate-400 text-xs md:text-sm font-medium max-w-2xl leading-relaxed">
              Kullanıcılar uygulamada olmasa dahi, randevular, günlük görevler, akşam hatırlatmaları ve koç erken müdahale uyarıları sunucu tarafından tam vaktinde doğrudan telefonlarına (Push) iletilir.
            </p>
          </div>

          {/* Quick Actions */}
          <div className="flex flex-wrap items-center gap-3 shrink-0">
            <button
              onClick={() => setShowTesterModal(true)}
              className="px-4 py-2.5 bg-slate-800/80 hover:bg-slate-700 border border-white/10 text-slate-200 rounded-2xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer shadow-md active:scale-95"
            >
              <Smartphone size={14} className="text-purple-400" />
              <span>Cihaz Test Modalı</span>
            </button>

            <button
              onClick={() => handleTriggerEngine(true)}
              disabled={triggeringEngine}
              className="px-4 py-2.5 bg-purple-600/20 hover:bg-purple-600/30 border border-purple-500/30 text-purple-300 rounded-2xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer shadow-md disabled:opacity-50 active:scale-95"
            >
              <Play size={14} className={triggeringEngine ? "animate-spin" : "fill-purple-400 text-purple-400"} />
              <span>{triggeringEngine ? "Taranıyor..." : "Tüm Kuralları Şimdi Tara"}</span>
            </button>

            <button
              onClick={handleSaveSettings}
              disabled={saving}
              className="px-5 py-2.5 bg-purple-600 hover:bg-purple-500 text-white rounded-2xl text-xs font-black transition-all flex items-center gap-2 shadow-lg shadow-purple-600/20 cursor-pointer disabled:opacity-50 active:scale-95"
            >
              {saving ? <RefreshCw size={14} className="animate-spin" /> : <Save size={14} />}
              <span>{saving ? "Kaydediliyor..." : "Ayarları Kaydet"}</span>
            </button>
          </div>
        </div>

        {/* Save Success Alert Banner */}
        <AnimatePresence>
          {saveSuccess && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="mt-4 p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-2xl flex items-center gap-2.5 text-emerald-400 text-xs font-bold"
            >
              <CheckCircle2 size={16} />
              <span>Tüm bildirim kuralları ve zamanlama ayarları başarıyla kaydedildi ve anında yürürlüğe girdi!</span>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Engine Run Results Banner */}
        <AnimatePresence>
          {triggerResult && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className={`mt-4 p-4 rounded-2xl border text-xs font-medium ${
                triggerResult.success
                  ? "bg-purple-500/10 border-purple-500/30 text-purple-200"
                  : "bg-red-500/10 border-red-500/30 text-red-300"
              }`}
            >
              <div className="flex items-center justify-between gap-2 mb-2">
                <div className="flex items-center gap-2 font-bold">
                  {triggerResult.success ? <CheckCircle2 size={16} className="text-emerald-400" /> : <AlertTriangle size={16} className="text-red-400" />}
                  <span>{triggerResult.message || (triggerResult.success ? "Zamanlayıcı taraması tamamlandı" : "Tarama sırasında hata")}</span>
                </div>
                <button
                  onClick={() => setTriggerResult(null)}
                  className="text-slate-400 hover:text-white text-[11px] font-bold underline cursor-pointer"
                >
                  Kapat
                </button>
              </div>

              {triggerResult.stats && (
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mt-2 pt-2 border-t border-white/10 text-[11px]">
                  <div>📅 Randevu Bildirimleri: <span className="font-bold text-white">{triggerResult.stats.appointmentsSent || 0}</span></div>
                  <div>🌅 Sabah Görevleri: <span className="font-bold text-white">{triggerResult.stats.morningSent || 0}</span></div>
                  <div>🌙 Akşam Görevleri: <span className="font-bold text-white">{triggerResult.stats.eveningSent || 0}</span></div>
                  <div>🚨 Pasiflik Uyarıları: <span className="font-bold text-white">{triggerResult.stats.inactivitySent || 0}</span></div>
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Sub Tab Navigation */}
      <div className="flex items-center gap-2 border-b border-white/10 pb-3">
        <button
          onClick={() => setActiveSubTab('rules')}
          className={`px-4 py-2 rounded-xl text-xs font-black transition-all flex items-center gap-2 cursor-pointer ${
            activeSubTab === 'rules'
              ? "bg-purple-600 text-white shadow-md shadow-purple-600/20"
              : "bg-slate-900/60 text-slate-400 hover:text-white border border-white/5"
          }`}
        >
          <Sliders size={14} />
          <span>Bildirim Kuralları & Şablonlar</span>
        </button>

        <button
          onClick={() => setActiveSubTab('logs')}
          className={`px-4 py-2 rounded-xl text-xs font-black transition-all flex items-center gap-2 cursor-pointer ${
            activeSubTab === 'logs'
              ? "bg-purple-600 text-white shadow-md shadow-purple-600/20"
              : "bg-slate-900/60 text-slate-400 hover:text-white border border-white/5"
          }`}
        >
          <Terminal size={14} />
          <span>Canlı Zamanlayıcı Logları ({recentLogs.length})</span>
        </button>
      </div>

      {/* SUBTAB 1: NOTIFICATION RULES & SCHEDULING SETTINGS */}
      {activeSubTab === 'rules' && (
        <div className="space-y-6">
          {/* Master Switch Card */}
          <div className="bg-slate-900/70 border border-white/10 rounded-3xl p-5 flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className={`p-3 rounded-2xl ${settings.engineActive ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20" : "bg-slate-800 text-slate-500"}`}>
                <Zap size={22} />
              </div>
              <div>
                <h3 className="text-sm font-black text-white">Ana Bildirim Motoru Durumu</h3>
                <p className="text-xs text-slate-400">
                  {settings.engineActive 
                    ? "Arka plan zamanlayıcısı devrede. Tüm aktif kurallar belirlenen saatlerde çalıştırılacaktır." 
                    : "Zamanlayıcı duraklatıldı. Otomatik arka plan kontrolleri yapılmayacaktır."}
                </p>
              </div>
            </div>

            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={settings.engineActive}
                onChange={(e) => setSettings({ ...settings, engineActive: e.target.checked })}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-slate-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-purple-600"></div>
            </label>
          </div>

          {/* Rules Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            
            {/* 1. RANDEVU HATIRLATICI KARTI */}
            <div className="bg-slate-900/60 border border-white/10 rounded-3xl p-6 space-y-5 relative overflow-hidden">
              <div className="flex items-center justify-between pb-4 border-b border-white/5">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 bg-blue-500/10 text-blue-400 rounded-2xl border border-blue-500/20">
                    <Calendar size={18} />
                  </div>
                  <div>
                    <h3 className="text-sm font-black text-white">1. Randevu Hatırlatıcıları</h3>
                    <p className="text-[11px] text-slate-400">Koç ve öğrenciye yaklaşan randevu uyarıları</p>
                  </div>
                </div>

                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={settings.appointmentsEnabled}
                    onChange={(e) => setSettings({ ...settings, appointmentsEnabled: e.target.checked })}
                    className="sr-only peer"
                  />
                  <div className="w-9 h-5 bg-slate-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-blue-600"></div>
                </label>
              </div>

              {settings.appointmentsEnabled && (
                <div className="space-y-4 text-xs">
                  {/* Lead Time & Checkboxes */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <label className="flex items-center gap-2 p-3 bg-slate-950/60 border border-white/5 rounded-2xl cursor-pointer">
                      <input
                        type="checkbox"
                        checked={settings.appointment24hEnabled}
                        onChange={(e) => setSettings({ ...settings, appointment24hEnabled: e.target.checked })}
                        className="rounded border-slate-700 text-purple-600 focus:ring-purple-500"
                      />
                      <span className="text-slate-300 font-bold">24 Saat Önce Hatırlat</span>
                    </label>

                    <label className="flex items-center gap-2 p-3 bg-slate-950/60 border border-white/5 rounded-2xl cursor-pointer">
                      <input
                        type="checkbox"
                        checked={settings.appointment1hEnabled}
                        onChange={(e) => setSettings({ ...settings, appointment1hEnabled: e.target.checked })}
                        className="rounded border-slate-700 text-purple-600 focus:ring-purple-500"
                      />
                      <span className="text-slate-300 font-bold">Kısa Süre Önce Hatırlat</span>
                    </label>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[11px] font-bold text-slate-400">Kısa Süreli Hatırlatma Öncesi (Dakika):</label>
                    <div className="flex items-center gap-3">
                      <input
                        type="number"
                        min="15"
                        max="180"
                        value={settings.appointmentLeadMinutes}
                        onChange={(e) => setSettings({ ...settings, appointmentLeadMinutes: parseInt(e.target.value) || 60 })}
                        className="w-24 bg-slate-950 border border-white/10 rounded-xl px-3 py-2 text-white font-bold text-xs"
                      />
                      <span className="text-slate-500 text-[11px]">Önerilen: 60 dakika (1 saat)</span>
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[11px] font-bold text-slate-400">Öğrenci Bildirim Şablonu:</label>
                    <textarea
                      rows={2}
                      value={settings.appointmentStudentTemplate}
                      onChange={(e) => setSettings({ ...settings, appointmentStudentTemplate: e.target.value })}
                      className="w-full bg-slate-950 border border-white/10 rounded-xl p-2.5 text-white font-medium text-xs focus:border-purple-500 focus:outline-none"
                    />
                    <p className="text-[10px] text-slate-500">Değişkenler: <code>{'{coachName}'}</code>, <code>{'{timeLeft}'}</code>, <code>{'{time}'}</code></p>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[11px] font-bold text-slate-400">Koç Bildirim Şablonu:</label>
                    <textarea
                      rows={2}
                      value={settings.appointmentCoachTemplate}
                      onChange={(e) => setSettings({ ...settings, appointmentCoachTemplate: e.target.value })}
                      className="w-full bg-slate-950 border border-white/10 rounded-xl p-2.5 text-white font-medium text-xs focus:border-purple-500 focus:outline-none"
                    />
                    <p className="text-[10px] text-slate-500">Değişkenler: <code>{'{studentName}'}</code>, <code>{'{timeLeft}'}</code>, <code>{'{time}'}</code></p>
                  </div>
                </div>
              )}
            </div>

            {/* 2. SABAH GÜNLÜK PLAN KARTI */}
            <div className="bg-slate-900/60 border border-white/10 rounded-3xl p-6 space-y-5 relative overflow-hidden">
              <div className="flex items-center justify-between pb-4 border-b border-white/5">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 bg-amber-500/10 text-amber-400 rounded-2xl border border-amber-500/20">
                    <Sparkles size={18} />
                  </div>
                  <div>
                    <h3 className="text-sm font-black text-white">2. Sabah Günlük Plan & Görev</h3>
                    <p className="text-[11px] text-slate-400">Güne başlarken çalışma planı ve motivasyon bildirimi</p>
                  </div>
                </div>

                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={settings.morningReminderEnabled}
                    onChange={(e) => setSettings({ ...settings, morningReminderEnabled: e.target.checked })}
                    className="sr-only peer"
                  />
                  <div className="w-9 h-5 bg-slate-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-amber-500"></div>
                </label>
              </div>

              {settings.morningReminderEnabled && (
                <div className="space-y-4 text-xs">
                  <div className="space-y-1.5">
                    <label className="text-[11px] font-bold text-slate-400">Gönderim Saati (Türkiye Saati):</label>
                    <div className="flex items-center gap-3">
                      <input
                        type="time"
                        value={settings.morningReminderTime}
                        onChange={(e) => setSettings({ ...settings, morningReminderTime: e.target.value })}
                        className="bg-slate-950 border border-white/10 rounded-xl px-3 py-2 text-white font-bold text-xs"
                      />
                      <span className="text-slate-500 text-[11px]">Her gün bu saatte aktif öğrencilere tetiklenir</span>
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[11px] font-bold text-slate-400">Bildirim Başlığı:</label>
                    <input
                      type="text"
                      value={settings.morningTitle}
                      onChange={(e) => setSettings({ ...settings, morningTitle: e.target.value })}
                      className="w-full bg-slate-950 border border-white/10 rounded-xl px-3 py-2 text-white font-bold text-xs focus:border-purple-500 focus:outline-none"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[11px] font-bold text-slate-400">Bildirim Mesajı:</label>
                    <textarea
                      rows={2}
                      value={settings.morningMessage}
                      onChange={(e) => setSettings({ ...settings, morningMessage: e.target.value })}
                      className="w-full bg-slate-950 border border-white/10 rounded-xl p-2.5 text-white font-medium text-xs focus:border-purple-500 focus:outline-none"
                    />
                  </div>
                </div>
              )}
            </div>

            {/* 3. AKŞAM TAMAMLANMAMIŞ GÖREVLER */}
            <div className="bg-slate-900/60 border border-white/10 rounded-3xl p-6 space-y-5 relative overflow-hidden">
              <div className="flex items-center justify-between pb-4 border-b border-white/5">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 bg-purple-500/10 text-purple-400 rounded-2xl border border-purple-500/20">
                    <Clock size={18} />
                  </div>
                  <div>
                    <h3 className="text-sm font-black text-white">3. Akşam Görev Hatırlatıcısı</h3>
                    <p className="text-[11px] text-slate-400">O gün bitmemiş görevi kalan öğrencilere kilit ekranı uyarısı</p>
                  </div>
                </div>

                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={settings.eveningReminderEnabled}
                    onChange={(e) => setSettings({ ...settings, eveningReminderEnabled: e.target.checked })}
                    className="sr-only peer"
                  />
                  <div className="w-9 h-5 bg-slate-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-purple-600"></div>
                </label>
              </div>

              {settings.eveningReminderEnabled && (
                <div className="space-y-4 text-xs">
                  <div className="space-y-1.5">
                    <label className="text-[11px] font-bold text-slate-400">Gönderim Saati (Türkiye Saati):</label>
                    <div className="flex items-center gap-3">
                      <input
                        type="time"
                        value={settings.eveningReminderTime}
                        onChange={(e) => setSettings({ ...settings, eveningReminderTime: e.target.value })}
                        className="bg-slate-950 border border-white/10 rounded-xl px-3 py-2 text-white font-bold text-xs"
                      />
                      <span className="text-slate-500 text-[11px]">Sadece tamamlanmamış görevi olanlara gider</span>
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[11px] font-bold text-slate-400">Bildirim Başlığı:</label>
                    <input
                      type="text"
                      value={settings.eveningTitle}
                      onChange={(e) => setSettings({ ...settings, eveningTitle: e.target.value })}
                      className="w-full bg-slate-950 border border-white/10 rounded-xl px-3 py-2 text-white font-bold text-xs focus:border-purple-500 focus:outline-none"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[11px] font-bold text-slate-400">Bildirim Mesajı:</label>
                    <textarea
                      rows={2}
                      value={settings.eveningMessage}
                      onChange={(e) => setSettings({ ...settings, eveningMessage: e.target.value })}
                      className="w-full bg-slate-950 border border-white/10 rounded-xl p-2.5 text-white font-medium text-xs focus:border-purple-500 focus:outline-none"
                    />
                  </div>
                </div>
              )}
            </div>

            {/* 4. PASİFLİK & KOÇ ERKEN MÜDAHALE */}
            <div className="bg-slate-900/60 border border-white/10 rounded-3xl p-6 space-y-5 relative overflow-hidden">
              <div className="flex items-center justify-between pb-4 border-b border-white/5">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 bg-rose-500/10 text-rose-400 rounded-2xl border border-rose-500/20">
                    <AlertTriangle size={18} />
                  </div>
                  <div>
                    <h3 className="text-sm font-black text-white">4. Pasiflik & Koç Erken Müdahale</h3>
                    <p className="text-[11px] text-slate-400">3 gündür veri girmeyen öğrenciyi tespit edip koçuna bildirir</p>
                  </div>
                </div>

                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={settings.inactivityAlertEnabled}
                    onChange={(e) => setSettings({ ...settings, inactivityAlertEnabled: e.target.checked })}
                    className="sr-only peer"
                  />
                  <div className="w-9 h-5 bg-slate-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-rose-500"></div>
                </label>
              </div>

              {settings.inactivityAlertEnabled && (
                <div className="space-y-4 text-xs">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="space-y-1.5">
                      <label className="text-[11px] font-bold text-slate-400">Pasiflik Eşiği (Gün):</label>
                      <input
                        type="number"
                        min="1"
                        max="14"
                        value={settings.inactivityDaysThreshold}
                        onChange={(e) => setSettings({ ...settings, inactivityDaysThreshold: parseInt(e.target.value) || 3 })}
                        className="w-full bg-slate-950 border border-white/10 rounded-xl px-3 py-2 text-white font-bold text-xs"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-[11px] font-bold text-slate-400">Kontrol Saati:</label>
                      <input
                        type="time"
                        value={settings.inactivityCheckTime}
                        onChange={(e) => setSettings({ ...settings, inactivityCheckTime: e.target.value })}
                        className="w-full bg-slate-950 border border-white/10 rounded-xl px-3 py-2 text-white font-bold text-xs"
                      />
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[11px] font-bold text-slate-400">Koça Gönderilecek Mesaj:</label>
                    <textarea
                      rows={2}
                      value={settings.inactivityCoachMessage}
                      onChange={(e) => setSettings({ ...settings, inactivityCoachMessage: e.target.value })}
                      className="w-full bg-slate-950 border border-white/10 rounded-xl p-2.5 text-white font-medium text-xs focus:border-purple-500 focus:outline-none"
                    />
                    <p className="text-[10px] text-slate-500">Değişkenler: <code>{'{studentName}'}</code>, <code>{'{days}'}</code></p>
                  </div>
                </div>
              )}
            </div>

            {/* 5. ABONELİK VE BAKİYE HATIRLATICI */}
            <div className="bg-slate-900/60 border border-white/10 rounded-3xl p-6 space-y-5 relative overflow-hidden">
              <div className="flex items-center justify-between pb-4 border-b border-white/5">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 bg-emerald-500/10 text-emerald-400 rounded-2xl border border-emerald-500/20">
                    <Timer size={18} />
                  </div>
                  <div>
                    <h3 className="text-sm font-black text-white">5. Abonelik Bitiş & Bakiye Uyarısı</h3>
                    <p className="text-[11px] text-slate-400">Süresi dolmak üzere olan paketler için otomatik WhatsApp (Sadece otomatik yenilemesi açık olanlar)</p>
                  </div>
                </div>

                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={settings.subscriptionReminderEnabled}
                    onChange={(e) => setSettings({ ...settings, subscriptionReminderEnabled: e.target.checked })}
                    className="sr-only peer"
                  />
                  <div className="w-9 h-5 bg-slate-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-emerald-500"></div>
                </label>
              </div>

              {settings.subscriptionReminderEnabled && (
                <div className="space-y-4 text-xs">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="space-y-1.5">
                      <label className="text-[11px] font-bold text-slate-400">Kaç Gün Kala Hatırlatılsın:</label>
                      <input
                        type="number"
                        min="1"
                        max="7"
                        value={settings.subscriptionDaysBefore}
                        onChange={(e) => setSettings({ ...settings, subscriptionDaysBefore: parseInt(e.target.value) || 3 })}
                        className="w-full bg-slate-950 border border-white/10 rounded-xl px-3 py-2 text-white font-bold text-xs"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-[11px] font-bold text-slate-400">Gönderim Saati:</label>
                      <input
                        type="time"
                        value={settings.subscriptionReminderTime}
                        onChange={(e) => setSettings({ ...settings, subscriptionReminderTime: e.target.value })}
                        className="w-full bg-slate-950 border border-white/10 rounded-xl px-3 py-2 text-white font-bold text-xs"
                      />
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[11px] font-bold text-slate-400">Bildirim Mesajı:</label>
                    <textarea
                      rows={2}
                      value={settings.subscriptionMessage}
                      onChange={(e) => setSettings({ ...settings, subscriptionMessage: e.target.value })}
                      className="w-full bg-slate-950 border border-white/10 rounded-xl p-2.5 text-white font-medium text-xs focus:border-purple-500 focus:outline-none"
                    />
                    <p className="text-[10px] text-slate-500">Değişkenler: <code>{'{days}'}</code>, <code>{'{planName}'}</code></p>
                  </div>
                </div>
              )}
            </div>

            {/* 6. ETKİNLİK & SERİ MOTİVASYONLARI */}
            <div className="bg-slate-900/60 border border-white/10 rounded-3xl p-6 space-y-5 relative overflow-hidden">
              <div className="flex items-center justify-between pb-4 border-b border-white/5">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 bg-yellow-500/10 text-yellow-400 rounded-2xl border border-yellow-500/20">
                    <Flame size={18} />
                  </div>
                  <div>
                    <h3 className="text-sm font-black text-white">6. Etkinlik & Seri Motivasyonları</h3>
                    <p className="text-[11px] text-slate-400">Seminerler, 7-14-30 günlük seriler ve başarı kutlamaları</p>
                  </div>
                </div>

                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={settings.eventReminderEnabled}
                    onChange={(e) => setSettings({ ...settings, eventReminderEnabled: e.target.checked })}
                    className="sr-only peer"
                  />
                  <div className="w-9 h-5 bg-slate-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-yellow-500"></div>
                </label>
              </div>

              {settings.eventReminderEnabled && (
                <div className="space-y-4 text-xs">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <label className="flex items-center gap-2 p-3 bg-slate-950/60 border border-white/5 rounded-2xl cursor-pointer">
                      <input
                        type="checkbox"
                        checked={settings.streakMilestoneEnabled}
                        onChange={(e) => setSettings({ ...settings, streakMilestoneEnabled: e.target.checked })}
                        className="rounded border-slate-700 text-purple-600 focus:ring-purple-500"
                      />
                      <span className="text-slate-300 font-bold">Seri Tebriği (7, 14, 30 Gün)</span>
                    </label>

                    <label className="flex items-center gap-2 p-3 bg-slate-950/60 border border-white/5 rounded-2xl cursor-pointer">
                      <input
                        type="checkbox"
                        checked={settings.event24hEnabled}
                        onChange={(e) => setSettings({ ...settings, event24hEnabled: e.target.checked })}
                        className="rounded border-slate-700 text-purple-600 focus:ring-purple-500"
                      />
                      <span className="text-slate-300 font-bold">Etkinliğe 24 Saat Kala</span>
                    </label>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[11px] font-bold text-slate-400">Etkinlik Mesaj Şablonu:</label>
                    <textarea
                      rows={2}
                      value={settings.eventMessage}
                      onChange={(e) => setSettings({ ...settings, eventMessage: e.target.value })}
                      className="w-full bg-slate-950 border border-white/10 rounded-xl p-2.5 text-white font-medium text-xs focus:border-purple-500 focus:outline-none"
                    />
                    <p className="text-[10px] text-slate-500">Değişkenler: <code>{'{eventTitle}'}</code>, <code>{'{eventTime}'}</code></p>
                  </div>
                </div>
              )}
            </div>

          </div>

          {/* Bottom Save Bar */}
          <div className="p-5 bg-slate-900/80 border border-white/10 rounded-3xl flex items-center justify-between">
            <p className="text-xs text-slate-400 font-medium">
              Yapılan tüm değişiklikler anında kaydedilir ve sunucu cron döngüsüne aktarılır.
            </p>
            <button
              onClick={handleSaveSettings}
              disabled={saving}
              className="px-6 py-3 bg-purple-600 hover:bg-purple-500 text-white rounded-2xl text-xs font-black transition-all flex items-center gap-2 shadow-lg shadow-purple-600/20 cursor-pointer disabled:opacity-50 active:scale-95"
            >
              {saving ? <RefreshCw size={15} className="animate-spin" /> : <Save size={15} />}
              <span>{saving ? "Kaydediliyor..." : "Ayarları Kaydet"}</span>
            </button>
          </div>
        </div>
      )}

      {/* SUBTAB 2: ENGINE LOGS & HISTORY */}
      {activeSubTab === 'logs' && (
        <div className="bg-slate-900/60 border border-white/10 rounded-3xl p-6 space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-white/10">
            <div>
              <h3 className="text-sm font-black text-white flex items-center gap-2">
                <Terminal size={16} className="text-purple-400" />
                <span>Otomatik Motor Çalışma Geçmişi</span>
              </h3>
              <p className="text-xs text-slate-400">Sunucu tarafından periyodik olarak veya manuel tetiklenen taramalar</p>
            </div>
            <button
              onClick={fetchRecentLogs}
              className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5"
            >
              <RefreshCw size={12} />
              <span>Yenile</span>
            </button>
          </div>

          {recentLogs.length === 0 ? (
            <div className="p-12 text-center text-slate-500 text-xs font-medium">
              Henüz kayıtlı bir zamanlayıcı tarama logu bulunmuyor. "Tüm Kuralları Şimdi Tara" butonuna tıklayarak ilk taramayı başlatabilirsiniz.
            </div>
          ) : (
            <div className="space-y-2 max-h-[500px] overflow-y-auto pr-1">
              {recentLogs.map((log) => (
                <div
                  key={log.id}
                  className="p-3.5 bg-slate-950/60 border border-white/5 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className={`px-2 py-0.5 rounded-md text-[10px] font-black uppercase ${
                        log.success ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20" : "bg-red-500/10 text-red-400 border border-red-500/20"
                      }`}>
                        {log.triggerSource || "Zamanlanmış"}
                      </span>
                      <span className="font-bold text-white">{log.message || "Bildirim motoru çalıştı"}</span>
                    </div>
                    {log.stats && (
                      <div className="text-[11px] text-slate-400 flex flex-wrap gap-x-3 gap-y-1">
                        <span>Randevu: <strong className="text-slate-200">{log.stats.appointmentsSent || 0}</strong></span>
                        <span>Sabah: <strong className="text-slate-200">{log.stats.morningSent || 0}</strong></span>
                        <span>Akşam: <strong className="text-slate-200">{log.stats.eveningSent || 0}</strong></span>
                        <span>Pasiflik: <strong className="text-slate-200">{log.stats.inactivitySent || 0}</strong></span>
                        <span>Toplam İletilen Push: <strong className="text-purple-400">{log.stats.totalPushSent || 0}</strong></span>
                      </div>
                    )}
                  </div>
                  <div className="text-[11px] text-slate-500 font-mono shrink-0">
                    {log.timestamp?.toDate ? log.timestamp.toDate().toLocaleString('tr-TR') : (log.time || 'Yeni')}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Tester Modal Component */}
      <NotificationTesterModal
        isOpen={showTesterModal}
        onClose={() => setShowTesterModal(false)}
      />
    </div>
  );
}
