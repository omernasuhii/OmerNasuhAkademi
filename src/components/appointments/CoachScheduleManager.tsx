import React, { useState, useEffect } from 'react';
import { Clock, Plus, Trash2, Save, Loader2, CheckCircle, Calendar, Link2, Copy, Check, ExternalLink, Sparkles, Smartphone, HelpCircle } from 'lucide-react';
import { appointmentService, WeeklySchedule, TimeSlot, BlockedDate } from '../../services/appointmentService';
import { useAuth } from '../../lib/AuthContext';

const DAYS = [
  { id: 'monday', label: 'Pazartesi' },
  { id: 'tuesday', label: 'Salı' },
  { id: 'wednesday', label: 'Çarşamba' },
  { id: 'thursday', label: 'Perşembe' },
  { id: 'friday', label: 'Cuma' },
  { id: 'saturday', label: 'Cumartesi' },
  { id: 'sunday', label: 'Pazar' },
];

interface CoachScheduleManagerProps {
  coachId?: string;
  coachName?: string;
}

export default function CoachScheduleManager({ coachId: propCoachId, coachName }: CoachScheduleManagerProps = {}) {
  const { user } = useAuth();
  const targetCoachId = propCoachId || user?.uid;
  const [schedule, setSchedule] = useState<WeeklySchedule>({});
  const [blockedDates, setBlockedDates] = useState<BlockedDate[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [status, setStatus] = useState<'idle' | 'success' | 'error'>('idle');

  // iCal Sync State
  const [copiedIcal, setCopiedIcal] = useState(false);
  const [selectedGuide, setSelectedGuide] = useState<'google' | 'apple' | 'outlook'>('google');

  const icalUrl = typeof window !== 'undefined' && targetCoachId 
    ? `${window.location.origin}/api/calendar/coach/${targetCoachId}.ics` 
    : '';

  const copyIcalLink = () => {
    if (!icalUrl) return;
    navigator.clipboard.writeText(icalUrl);
    setCopiedIcal(true);
    setTimeout(() => setCopiedIcal(false), 2000);
  };

  useEffect(() => {
    if (!targetCoachId) return;
    async function load() {
      setLoading(true);
      try {
        const data = await appointmentService.getCoachSchedule(targetCoachId!);
        if (data && data.weeklyHours) {
          setSchedule(data.weeklyHours);
        } else {
          setSchedule({});
        }
        if (data && data.blockedDates) {
           setBlockedDates(data.blockedDates);
        } else {
           setBlockedDates([]);
        }
      } catch (err) {
        console.error("Load schedule error:", err);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [targetCoachId]);

  const addSlot = (dayId: string) => {
    const newSchedule = { ...schedule };
    if (!newSchedule[dayId]) newSchedule[dayId] = [];
    newSchedule[dayId].push({ start: '09:00', end: '10:00' });
    setSchedule(newSchedule);
  };

  const removeSlot = (dayId: string, idx: number) => {
    const newSchedule = { ...schedule };
    newSchedule[dayId].splice(idx, 1);
    setSchedule(newSchedule);
  };

  const updateSlot = (dayId: string, idx: number, field: keyof TimeSlot, value: string) => {
    const newSchedule = { ...schedule };
    newSchedule[dayId][idx][field] = value;
    setSchedule(newSchedule);
  };

  const addBlockedDate = () => {
    setBlockedDates([
      ...blockedDates, 
      { id: Date.now().toString(), startDate: new Date().toISOString().split('T')[0], endDate: new Date().toISOString().split('T')[0], isAllDay: true, startTime: '09:00', endTime: '18:00', reason: '' }
    ]);
  };

  const updateBlockedDate = (id: string, field: keyof BlockedDate, value: string | boolean) => {
    setBlockedDates(blockedDates.map(bd => bd.id === id ? { ...bd, [field]: value } : bd));
  };

  const removeBlockedDate = (id: string) => {
    setBlockedDates(blockedDates.filter(bd => bd.id !== id));
  };

  const save = async () => {
    if (!targetCoachId) return;
    setSaving(true);
    setStatus('idle');
    try {
      await appointmentService.updateCoachSchedule(targetCoachId, { weeklyHours: schedule, blockedDates });
      setStatus('success');
      setTimeout(() => setStatus('idle'), 3000);
    } catch (err) {
      console.error("Save schedule error:", err);
      setStatus('error');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center p-12">
        <div className="w-12 h-12 border-4 border-blue-500/20 border-t-blue-500 rounded-full animate-spin mb-4" />
        <p className="text-slate-500 font-medium">Çalışma saatleri yükleniyor...</p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* 1. iCal Live Sync & Setup Instructions (Top Section) */}
      {targetCoachId && (
        <div className="bg-gradient-to-br from-slate-900/90 via-slate-900/60 to-blue-950/20 border border-blue-500/20 rounded-3xl p-6 md:p-8 shadow-xl shadow-blue-950/10">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-6 border-b border-white/10">
            <div className="flex items-start sm:items-center gap-3.5">
              <div className="w-12 h-12 rounded-2xl bg-blue-500/10 border border-blue-500/30 flex items-center justify-center text-blue-400 shrink-0 shadow-inner">
                <Calendar size={24} />
              </div>
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <h3 className="text-xl font-bold text-white tracking-tight">
                    iCal Canlı Takvim Senkronizasyonu
                  </h3>
                  <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2.5 py-0.5 rounded-full">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                    Canlı Abonelik
                  </span>
                </div>
                <p className="text-xs sm:text-sm text-slate-400 mt-1">
                  FocusON randevularınızı telefon ve bilgisayarınızdaki kişisel takviminizle anında eşitleyin.
                </p>
              </div>
            </div>

            <a
              href={icalUrl.replace(/^https?:\/\//, 'webcal://')}
              className="inline-flex items-center justify-center gap-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold px-4 py-2.5 rounded-xl border border-white/10 transition-all shrink-0"
              target="_blank"
              rel="noreferrer"
            >
              <ExternalLink size={14} />
              Webcal ile Doğrudan Aç
            </a>
          </div>

          {/* Link Box */}
          <div className="mt-6">
            <label className="text-xs font-bold text-slate-300 uppercase tracking-wider block mb-2">
              Kişisel Canlı Takvim Linkiniz
            </label>
            <div className="bg-slate-950/80 border border-white/10 p-3 sm:p-3.5 rounded-2xl flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
              <div className="flex items-center gap-2 overflow-hidden flex-1">
                <Link2 size={16} className="text-blue-400 shrink-0" />
                <span className="text-xs font-mono text-blue-200/90 truncate select-all">
                  {icalUrl}
                </span>
              </div>
              <button 
                onClick={copyIcalLink}
                className="bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold px-4 py-2.5 rounded-xl transition-all flex items-center justify-center gap-2 shrink-0 shadow-lg shadow-blue-600/20"
              >
                {copiedIcal ? (
                  <>
                    <Check size={14} className="text-white" />
                    Kopyalandı!
                  </>
                ) : (
                  <>
                    <Copy size={14} />
                    Linki Kopyala
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Step-by-Step Setup Guide / Yönerge */}
          <div className="mt-6 pt-6 border-t border-white/10">
            <div className="flex items-center gap-2 mb-4">
              <HelpCircle size={18} className="text-blue-400" />
              <h4 className="text-sm font-bold text-white uppercase tracking-wider">
                Nasıl Kurulur? (Adım Adım Kurulum Yönergesi)
              </h4>
            </div>

            {/* Platform Selector Tabs */}
            <div className="flex flex-wrap gap-2 mb-4">
              <button
                type="button"
                onClick={() => setSelectedGuide('google')}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
                  selectedGuide === 'google'
                    ? 'bg-blue-600 text-white shadow-md shadow-blue-600/20'
                    : 'bg-white/5 text-slate-400 hover:text-white hover:bg-white/10 border border-white/5'
                }`}
              >
                <span>📅 Google Takvim</span>
              </button>
              <button
                type="button"
                onClick={() => setSelectedGuide('apple')}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
                  selectedGuide === 'apple'
                    ? 'bg-blue-600 text-white shadow-md shadow-blue-600/20'
                    : 'bg-white/5 text-slate-400 hover:text-white hover:bg-white/10 border border-white/5'
                }`}
              >
                <span>🍏 Apple Takvim (iPhone / Mac)</span>
              </button>
              <button
                type="button"
                onClick={() => setSelectedGuide('outlook')}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
                  selectedGuide === 'outlook'
                    ? 'bg-blue-600 text-white shadow-md shadow-blue-600/20'
                    : 'bg-white/5 text-slate-400 hover:text-white hover:bg-white/10 border border-white/5'
                }`}
              >
                <span>📫 Microsoft Outlook</span>
              </button>
            </div>

            {/* Platform Guide Content */}
            <div className="bg-slate-950/60 border border-white/5 rounded-2xl p-4 sm:p-5">
              {selectedGuide === 'google' && (
                <div className="space-y-2.5 text-xs text-slate-300">
                  <div className="flex items-start gap-2.5">
                    <span className="w-5 h-5 rounded-full bg-blue-600/20 text-blue-400 font-bold flex items-center justify-center shrink-0 text-[11px]">1</span>
                    <p>Bilgisayarınızdan <a href="https://calendar.google.com" target="_blank" rel="noreferrer" className="text-blue-400 underline font-bold hover:text-blue-300">calendar.google.com</a> adresini açın.</p>
                  </div>
                  <div className="flex items-start gap-2.5">
                    <span className="w-5 h-5 rounded-full bg-blue-600/20 text-blue-400 font-bold flex items-center justify-center shrink-0 text-[11px]">2</span>
                    <p>Sol taraftaki menüde <strong>"Diğer takvimler"</strong> başlığının yanındaki <strong>"+"</strong> (Ekle) butonuna tıklayın.</p>
                  </div>
                  <div className="flex items-start gap-2.5">
                    <span className="w-5 h-5 rounded-full bg-blue-600/20 text-blue-400 font-bold flex items-center justify-center shrink-0 text-[11px]">3</span>
                    <p>Açılan menüden <strong>"URL ile ekle"</strong> seçeneğini seçin.</p>
                  </div>
                  <div className="flex items-start gap-2.5">
                    <span className="w-5 h-5 rounded-full bg-blue-600/20 text-blue-400 font-bold flex items-center justify-center shrink-0 text-[11px]">4</span>
                    <p>Yukarıdan kopyaladığınız canlı abonelik bağlantısını yapıştırın ve <strong>"Takvim Ekle"</strong> butonuna basın.</p>
                  </div>
                  <div className="flex items-start gap-2.5 text-slate-400 pt-1">
                    <span className="w-5 h-5 rounded-full bg-slate-800 text-slate-400 font-bold flex items-center justify-center shrink-0 text-[11px]">💡</span>
                    <p><em>İpucu:</em> Android veya iOS Google Takvim uygulamasında randevuları görmek için telefonunuzun Google Takvim uygulamasında <em>Ayarlar &gt; [Hesabınız] &gt; Senkronize Et</em> seçeneğini açmanız yeterlidir.</p>
                  </div>
                </div>
              )}

              {selectedGuide === 'apple' && (
                <div className="space-y-2.5 text-xs text-slate-300">
                  <div className="border-b border-white/5 pb-2.5 mb-2.5">
                    <p className="font-bold text-white mb-1.5">📱 iPhone / iPad İçin:</p>
                    <ol className="space-y-1.5 list-decimal list-inside text-slate-300">
                      <li>Cihazınızda <strong>Ayarlar &gt; Takvim &gt; Hesaplar &gt; Hesap Ekle</strong> bölümüne gidin.</li>
                      <li><strong>"Diğer"</strong> seçeneğini ve ardından <strong>"Abone Olunan Takvim Ekle"</strong>yi seçin.</li>
                      <li>Sunucu kısmına yukarıdaki linki yapıştırıp <strong>İleri</strong> &gt; <strong>Kaydet</strong> deyin.</li>
                    </ol>
                  </div>
                  <div>
                    <p className="font-bold text-white mb-1.5">💻 Mac Bilgisayar İçin:</p>
                    <ol className="space-y-1.5 list-decimal list-inside text-slate-300">
                      <li><strong>Takvim</strong> uygulamasını açın.</li>
                      <li>Üst menü çubuğundan <strong>Dosya &gt; Yeni Takvim Aboneliği...</strong> seçeneğine tıklayın.</li>
                      <li>Kopyaladığınız bağlantıyı yapıştırın, yenileme sıklığını (örn: 15 dakikada bir) belirleyip onaylayın.</li>
                    </ol>
                  </div>
                </div>
              )}

              {selectedGuide === 'outlook' && (
                <div className="space-y-2.5 text-xs text-slate-300">
                  <div className="flex items-start gap-2.5">
                    <span className="w-5 h-5 rounded-full bg-blue-600/20 text-blue-400 font-bold flex items-center justify-center shrink-0 text-[11px]">1</span>
                    <p>Outlook web veya masaüstü uygulamasında <strong>Takvim</strong> görünümüne geçin.</p>
                  </div>
                  <div className="flex items-start gap-2.5">
                    <span className="w-5 h-5 rounded-full bg-blue-600/20 text-blue-400 font-bold flex items-center justify-center shrink-0 text-[11px]">2</span>
                    <p><strong>"Takvim Ekle"</strong> (Add Calendar) butonuna tıklayın.</p>
                  </div>
                  <div className="flex items-start gap-2.5">
                    <span className="w-5 h-5 rounded-full bg-blue-600/20 text-blue-400 font-bold flex items-center justify-center shrink-0 text-[11px]">3</span>
                    <p>Sol menüden <strong>"Web'den Abone Ol"</strong> (Subscribe from web) sekmesini seçin.</p>
                  </div>
                  <div className="flex items-start gap-2.5">
                    <span className="w-5 h-5 rounded-full bg-blue-600/20 text-blue-400 font-bold flex items-center justify-center shrink-0 text-[11px]">4</span>
                    <p>Bağlantıyı yapıştırın, takvim için bir isim ve renk seçerek <strong>"İçe Aktar"</strong> butonuna basın.</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* 2. Working Hours & Settings Section */}
      <div className="flex items-center justify-between pt-2">
        <div>
          <h3 className="text-xl font-bold text-white">
            {coachName ? `${coachName} - Çalışma Saatleri` : 'Haftalık Çalışma Saatlerim'}
          </h3>
          <p className="text-sm text-slate-400 mt-1">
            {coachName 
              ? `Öğrencilerin bu personelden randevu alabileceği haftalık saat dilimlerini belirleyin.`
              : 'Öğrencilerin sizden randevu alabileceği haftalık saat dilimlerini belirleyin.'}
          </p>
        </div>
        <button 
          onClick={save}
          disabled={saving}
          className="flex items-center gap-2 bg-blue-600 hover:bg-blue-500 text-white px-6 py-2.5 rounded-xl font-bold transition-all shadow-lg shadow-blue-600/20 disabled:opacity-50"
        >
          {saving ? <Loader2 className="animate-spin" size={18} /> : (status === 'success' ? <CheckCircle size={18} /> : <Save size={18} />)}
          {saving ? 'Kaydediliyor...' : (status === 'success' ? 'Kaydedildi' : 'Ayarları Kaydet')}
        </button>
      </div>

      <div className="grid grid-cols-1 gap-4">
        {DAYS.map((day) => (
          <div key={day.id} className="bg-slate-900/40 border border-white/5 rounded-2xl p-6 flex flex-col md:flex-row md:items-center gap-6">
            <div className="md:w-32 shrink-0">
              <span className="font-bold text-white tracking-wide uppercase text-sm">{day.label}</span>
            </div>

            <div className="flex-1 flex flex-wrap gap-3">
              {(schedule[day.id] || []).map((slot, idx) => (
                <div key={idx} className="flex items-center gap-2 bg-slate-950/50 p-2 rounded-lg border border-white/10 group">
                  <Clock size={14} className="text-slate-500" />
                  <input 
                    type="time" 
                    value={slot.start}
                    onChange={(e) => updateSlot(day.id, idx, 'start', e.target.value)}
                    className="bg-transparent text-xs text-white border-none focus:ring-0 p-0 w-16"
                  />
                  <span className="text-slate-600 text-xs">-</span>
                  <input 
                    type="time" 
                    value={slot.end}
                    onChange={(e) => updateSlot(day.id, idx, 'end', e.target.value)}
                    className="bg-transparent text-xs text-white border-none focus:ring-0 p-0 w-16"
                  />
                  <button 
                    onClick={() => removeSlot(day.id, idx)}
                    className="text-slate-500 hover:text-red-400 ml-1 transition-colors"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              ))}
              
              <button 
                onClick={() => addSlot(day.id)}
                className="flex items-center gap-1.5 text-xs font-bold text-blue-400 hover:text-blue-300 bg-blue-500/10 border border-blue-500/20 px-3 py-2 rounded-lg transition-all"
              >
                <Plus size={14} /> Saat Ekle
              </button>
            </div>
          </div>
        ))}
      </div>

      <div className="mt-12 space-y-4">
         <div>
           <h3 className="text-xl font-bold">Kapalı Günler / Tatiller</h3>
           <p className="text-sm text-slate-400 mt-1">Öğrencilerin randevu alamayacağı özel tarihleri veya tatil aralıklarını belirleyin.</p>
         </div>
         
         <div className="bg-slate-900/40 border border-white/5 rounded-2xl p-6">
            <div className="space-y-4">
              {blockedDates.map(bd => (
                <div key={bd.id} className="flex flex-col gap-4 bg-slate-950/50 p-4 border border-red-500/10 rounded-xl relative">
                  <div className="flex items-center gap-3">
                      <label className="flex items-center gap-2 cursor-pointer">
                         <input 
                            type="checkbox" 
                            checked={bd.isAllDay !== false} 
                            onChange={(e) => updateBlockedDate(bd.id, 'isAllDay', e.target.checked)}
                            className="rounded border-none bg-slate-800 text-red-500 focus:ring-red-500 focus:ring-offset-slate-900 w-4 h-4 cursor-pointer"
                         />
                         <span className="text-sm font-bold text-slate-300">Tüm Gün Kapalı</span>
                      </label>
                  </div>
                  
                  <div className="flex flex-col xl:flex-row xl:items-end gap-4 w-full">
                    <div className="flex flex-1 gap-4">
                      <div className="flex-1 space-y-2">
                        <label className="text-xs font-bold text-slate-500 uppercase tracking-widest">Başlangıç</label>
                        <input 
                          type="date"
                          value={bd.startDate}
                          onChange={e => updateBlockedDate(bd.id, 'startDate', e.target.value)}
                          className="w-full bg-slate-900 border border-white/10 rounded-lg p-2.5 text-sm font-bold text-white focus:ring-red-500 focus:border-red-500"
                        />
                      </div>
                      <div className="flex-1 space-y-2">
                        <label className="text-xs font-bold text-slate-500 uppercase tracking-widest">Bitiş</label>
                        <input 
                          type="date"
                          value={bd.endDate}
                          min={bd.startDate}
                          onChange={e => updateBlockedDate(bd.id, 'endDate', e.target.value)}
                          className="w-full bg-slate-900 border border-white/10 rounded-lg p-2.5 text-sm font-bold text-white focus:ring-red-500 focus:border-red-500"
                        />
                      </div>
                    </div>
                    
                    {bd.isAllDay === false && (
                      <div className="flex gap-4">
                        <div className="flex-1 space-y-2">
                          <label className="text-xs font-bold text-slate-500 uppercase tracking-widest">Saat Başı</label>
                          <input 
                            type="time"
                            value={bd.startTime || ''}
                            onChange={e => updateBlockedDate(bd.id, 'startTime', e.target.value)}
                            className="w-full bg-slate-900 border border-white/10 rounded-lg p-2.5 text-sm font-bold text-white focus:ring-red-500 focus:border-red-500"
                          />
                        </div>
                        <div className="flex-1 space-y-2">
                          <label className="text-xs font-bold text-slate-500 uppercase tracking-widest">Saat Sonu</label>
                          <input 
                            type="time"
                            value={bd.endTime || ''}
                            onChange={e => updateBlockedDate(bd.id, 'endTime', e.target.value)}
                            className="w-full bg-slate-900 border border-white/10 rounded-lg p-2.5 text-sm font-bold text-white focus:ring-red-500 focus:border-red-500"
                          />
                        </div>
                      </div>
                    )}
                    
                    <div className="flex-[2] flex gap-2 w-full mt-2 xl:mt-0 items-end">
                      <div className="flex-1 space-y-2">
                        <label className="text-xs font-bold text-slate-500 uppercase tracking-widest">Neden / Açıklama (İsteğe Bağlı)</label>
                        <input 
                          type="text"
                          placeholder="Örn: Yıllık İzin, Resmi Tatil..."
                          value={bd.reason || ''}
                          onChange={e => updateBlockedDate(bd.id, 'reason', e.target.value)}
                          className="w-full bg-slate-900 border border-white/10 rounded-lg p-2.5 text-sm text-white focus:ring-red-500 focus:border-red-500"
                        />
                      </div>
                      <button 
                        onClick={() => removeBlockedDate(bd.id)}
                        className="bg-red-500/10 text-red-400 hover:bg-red-500/20 p-2.5 rounded-lg transition-colors border border-red-500/20 shrink-0 h-[42px] mt-auto"
                        title="Sil"
                      >
                        <Trash2 size={18} />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
              
              <button 
                onClick={addBlockedDate}
                className="flex items-center gap-2 text-sm font-bold text-red-400 hover:text-red-300 bg-red-500/10 border border-red-500/20 px-4 py-3 rounded-xl transition-all"
              >
                <Plus size={16} /> Kapalı Gün Ekle
              </button>
            </div>
         </div>
      </div>
    </div>
  );
}
