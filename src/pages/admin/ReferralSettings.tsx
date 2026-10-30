import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Share2, Users, Gift, Save, GiftIcon, Bell, Settings, ArrowUpRight, GraduationCap, BarChart3, TrendingUp, TrendingDown, Info } from 'lucide-react';
import { referralService, ReferralSettings as IReferralSettings } from '../../services/referralService';

export default function ReferralSettings() {
  const [settings, setSettings] = useState<IReferralSettings>({
    isActive: true,
    referrerReward: 10, 
    refereeReward: 10, 
    minUsageThreshold: 1, 
    rewardType: 'percent', 
    expirationDays: 30, 
    notifyOnSuccess: true,
    coachReferralActive: true,
    coachDepositGiftType: 'percent',
    coachDepositGiftValue: 5,
    coachReferrerRewardValue: 5,
    coachWelcomeGiftAmount: 1500,
    discountPayer: 'system'
  });
  
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState<'student' | 'coach' | 'general' | 'stats'>('student');
  
  const [stats, setStats] = useState({
    totalStudentDiscounts: 0,
    totalCoachGifts: 0,
    totalReferrerRewards: 0,
    totalGivenAmount: 0
  });

  useEffect(() => {
    Promise.all([
      referralService.getSettings(),
      referralService.getReferralStats?.()
    ]).then(([settingsData, statsData]) => {
      if (settingsData) setSettings({ ...settings, ...settingsData });
      if (statsData) setStats(statsData);
      setLoading(false);
    });
  }, []);

  const handleSave = async () => {
    setSaving(true);
    await referralService.updateSettings(settings);
    setSaving(false);
    alert('Ayarlar başarıyla kaydedildi!');
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-red-500"></div>
      </div>
    );
  }

  return (
    <div className="p-6 md:p-8 space-y-8 max-w-6xl mx-auto">
      {/* Header */}
      <motion.div 
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-[#0f172a] p-6 sm:p-8 rounded-3xl border border-white/5 relative overflow-hidden"
      >
        <div className="absolute top-0 right-0 w-96 h-96 bg-red-500/5 blur-[100px] pointer-events-none rounded-full"></div>
        <div className="relative z-10">
          <h1 className="text-2xl md:text-3xl font-black text-white uppercase tracking-tight flex items-center gap-3">
            <Share2 className="text-red-500" size={32} />
            Referans Sistemi Ayarları
          </h1>
          <p className="text-slate-400 mt-2 font-medium">Öğrencilerin ve Koçların referans sistemi üzerinden kazanç ve ödül dağıtımını yapılandırın.</p>
        </div>
        <div className="relative z-10 shrink-0">
          <button 
            onClick={handleSave}
            disabled={saving}
            className="flex items-center gap-2 bg-red-600 hover:bg-red-500 text-white px-8 py-4 rounded-2xl font-black uppercase tracking-widest transition-all shadow-lg shadow-red-600/20 disabled:opacity-50"
          >
            <Save size={18} />
            {saving ? 'KAYDEDİLİYOR...' : 'DEĞİŞİKLİKLERİ KAYDET'}
          </button>
        </div>
      </motion.div>

      {/* Tabs Layout */}
      <div className="flex flex-col lg:flex-row gap-8">
        
        {/* Navigation Tabs */}
        <div className="w-full lg:w-72 shrink-0 space-y-2">
          <button
            onClick={() => setActiveTab('student')}
            className={`w-full flex items-center gap-3 px-5 py-4 rounded-2xl font-black uppercase tracking-widest text-xs transition-all ${activeTab === 'student' ? 'bg-red-600 text-white shadow-lg shadow-red-600/20' : 'bg-[#0f172a] text-slate-400 border border-white/5 hover:bg-slate-800 hover:text-white'}`}
          >
            <GraduationCap size={18} />
            Öğrenci Referans Sistemi
          </button>
          
          <button
            onClick={() => setActiveTab('coach')}
            className={`w-full flex items-center gap-3 px-5 py-4 rounded-2xl font-black uppercase tracking-widest text-xs transition-all ${activeTab === 'coach' ? 'bg-amber-500 text-white shadow-lg shadow-amber-500/20' : 'bg-[#0f172a] text-slate-400 border border-white/5 hover:bg-slate-800 hover:text-white'}`}
          >
            <Users size={18} />
            Koç Referans Sistemi
          </button>
          
          <button
            onClick={() => setActiveTab('general')}
            className={`w-full flex items-center gap-3 px-5 py-4 rounded-2xl font-black uppercase tracking-widest text-xs transition-all ${activeTab === 'general' ? 'bg-indigo-500 text-white shadow-lg shadow-indigo-500/20' : 'bg-[#0f172a] text-slate-400 border border-white/5 hover:bg-slate-800 hover:text-white'}`}
          >
            <Settings size={18} />
            Genel Ayarlar
          </button>
          
          <button
            onClick={() => setActiveTab('stats')}
            className={`w-full flex items-center gap-3 px-5 py-4 rounded-2xl font-black uppercase tracking-widest text-xs transition-all ${activeTab === 'stats' ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-500/20' : 'bg-[#0f172a] text-slate-400 border border-white/5 hover:bg-slate-800 hover:text-white'}`}
          >
            <BarChart3 size={18} />
            Analiz & Raporlar
          </button>
        </div>

        {/* Tab Contents */}
        <div className="flex-1">
          <AnimatePresence mode="wait">
            {/* STUDENT TAB */}
            {activeTab === 'student' && (
              <motion.div
                key="student"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.2 }}
                className="space-y-6"
              >
                <div className="bg-[#0f172a] border border-white/5 rounded-3xl p-6 md:p-8">
                  <div className="flex items-center gap-3 mb-8 pb-4 border-b border-white/5">
                    <div className="w-10 h-10 rounded-2xl bg-red-500/10 flex items-center justify-center text-red-500">
                      <GiftIcon size={20} />
                    </div>
                    <div>
                      <h2 className="text-lg font-black text-white uppercase tracking-widest">Öğrenci Ödül Yapılandırması</h2>
                      <p className="text-xs font-bold text-slate-500">Öğrencilerin arkadaşlarını davet etmesi durumunda uygulanacak ödüller.</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div className="space-y-3">
                      <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Ödül Türü</label>
                      <div className="grid grid-cols-2 gap-2">
                        <button 
                          onClick={() => setSettings({...settings, rewardType: 'percent'})}
                          className={`px-4 py-3.5 rounded-xl border text-xs font-black uppercase tracking-widest transition-all ${settings.rewardType === 'percent' ? 'bg-indigo-500/20 border-indigo-500 text-indigo-400' : 'bg-slate-900 border-white/5 text-slate-400 hover:bg-slate-800 hover:text-white'}`}
                        >
                          Yüzde (%)
                        </button>
                        <button 
                          onClick={() => setSettings({...settings, rewardType: 'balance'})}
                          className={`px-4 py-3.5 rounded-xl border text-xs font-black uppercase tracking-widest transition-all ${settings.rewardType === 'balance' ? 'bg-emerald-500/20 border-emerald-500 text-emerald-400' : 'bg-slate-900 border-white/5 text-slate-400 hover:bg-slate-800 hover:text-white'}`}
                        >
                          Bakiye (TL)
                        </button>
                      </div>
                    </div>

                    <div className="space-y-3">
                      <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest flex items-center gap-2">
                        Ödül Tetikleyicisi (Gerekli İşlem)
                      </label>
                      <select 
                        className="w-full bg-slate-900 border border-white/10 rounded-xl px-4 py-3 text-sm font-bold text-white outline-none focus:border-red-500/50 appearance-none cursor-pointer"
                        value={settings.minUsageThreshold}
                        onChange={(e) => setSettings({...settings, minUsageThreshold: Number(e.target.value)})}
                      >
                        <option value={0}>Sadece Hesap Açması Yeterli</option>
                        <option value={1}>En Az 1 Kez Abonelik Almalı</option>
                        <option value={2}>En Az 2 Kez Abonelik Almalı</option>
                      </select>
                      <p className="text-[10px] text-slate-500 font-bold">Davet edilenin kayıt sonrası ödülü tetiklemesi için gereken eylem.</p>
                    </div>

                    <div className="space-y-3 pt-4 border-t border-white/5 md:col-span-2"></div>

                    <div className="space-y-3">
                      <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest flex items-center justify-between">
                        <span>Davet Eden Ödülü</span>
                        <span className="bg-slate-800 text-slate-400 px-2.5 py-1 rounded-lg text-[9px]">KAZANÇ</span>
                      </label>
                      <div className="relative">
                        <input 
                          type="number" 
                          value={settings.referrerReward}
                          onChange={(e) => setSettings({...settings, referrerReward: Number(e.target.value)})}
                          className="w-full bg-slate-900 border border-white/10 rounded-xl pl-5 pr-14 py-4 text-white font-mono text-xl focus:border-red-500/50 outline-none transition-all"
                        />
                        <span className="absolute right-5 top-1/2 -translate-y-1/2 text-sm font-black text-slate-500">{settings.rewardType === 'percent' ? '%' : 'TL'}</span>
                      </div>
                      <p className="text-[10px] text-slate-500 font-bold">Kodu paylaşan kişinin kazanacağı miktar.</p>
                    </div>

                    <div className="space-y-3">
                      <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest flex items-center justify-between">
                        <span>Davet Edilen Ödülü</span>
                        <span className="bg-slate-800 text-slate-400 px-2.5 py-1 rounded-lg text-[9px]">İNDİRİM</span>
                      </label>
                      <div className="relative">
                        <input 
                          type="number" 
                          value={settings.refereeReward}
                          onChange={(e) => setSettings({...settings, refereeReward: Number(e.target.value)})}
                          className="w-full bg-slate-900 border border-white/10 rounded-xl pl-5 pr-14 py-4 text-white font-mono text-xl focus:border-red-500/50 outline-none transition-all"
                        />
                        <span className="absolute right-5 top-1/2 -translate-y-1/2 text-sm font-black text-slate-500">{settings.rewardType === 'percent' ? '%' : 'TL'}</span>
                      </div>
                      <p className="text-[10px] text-slate-500 font-bold">Kayıt olan kişinin kazanacağı hoşgeldin miktarı.</p>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}

            {/* COACH TAB */}
            {activeTab === 'coach' && (
              <motion.div
                key="coach"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.2 }}
                className="space-y-6"
              >
                <div className="bg-[#0f172a] border border-white/5 rounded-3xl p-6 md:p-8">
                  <div className="flex items-center justify-between mb-8 pb-4 border-b border-white/5">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-2xl bg-amber-500/10 flex items-center justify-center text-amber-500">
                        <Users size={20} />
                      </div>
                      <div>
                        <h2 className="text-lg font-black text-white uppercase tracking-widest">Koç Referans Sistemi</h2>
                        <p className="text-xs font-bold text-slate-500">Koçların sisteme yeni koçlar davet etmesine yönelik ödüllendirmeler.</p>
                      </div>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input 
                        type="checkbox" 
                        className="sr-only peer" 
                        checked={settings.coachReferralActive !== false}
                        onChange={(e) => setSettings({...settings, coachReferralActive: e.target.checked})}
                      />
                      <div className="w-14 h-7 bg-slate-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-6 after:w-6 after:transition-all peer-checked:bg-amber-500"></div>
                    </label>
                  </div>
                  
                  {settings.coachReferralActive !== false ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                      <div className="space-y-3 md:col-span-2">
                        <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Ödül (Hediye Bakiye) Türü</label>
                        <div className="grid grid-cols-2 gap-2 max-w-sm">
                          <button 
                            type="button"
                            onClick={() => setSettings({...settings, coachDepositGiftType: 'percent'})}
                            className={`px-4 py-3.5 rounded-xl border text-xs font-black uppercase tracking-widest transition-all ${settings.coachDepositGiftType === 'percent' ? 'bg-amber-500/20 border-amber-500 text-amber-400' : 'bg-slate-900 border-white/5 text-slate-400 hover:bg-slate-800 hover:text-white'}`}
                          >
                            Yüzde (%)
                          </button>
                          <button 
                            type="button"
                            onClick={() => setSettings({...settings, coachDepositGiftType: 'amount'})}
                            className={`px-4 py-3.5 rounded-xl border text-xs font-black uppercase tracking-widest transition-all ${settings.coachDepositGiftType === 'amount' ? 'bg-emerald-500/20 border-emerald-500 text-emerald-400' : 'bg-slate-900 border-white/5 text-slate-400 hover:bg-slate-800 hover:text-white'}`}
                          >
                            Sabit (TL)
                          </button>
                        </div>
                      </div>

                      <div className="space-y-3">
                        <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest flex items-center justify-between">
                          <span>Davet Edilen Koç Ödülü</span>
                          <span className="bg-amber-500/20 text-amber-300 px-2.5 py-1 rounded-lg text-[9px] font-bold">İLK YÜKLEMEDE</span>
                        </label>
                        <div className="relative">
                          <input 
                            type="number" 
                            value={settings.coachDepositGiftValue ?? 5}
                            onChange={(e) => setSettings({...settings, coachDepositGiftValue: Number(e.target.value)})}
                            className="w-full bg-slate-900 border border-white/10 rounded-xl pl-5 pr-14 py-4 text-white font-mono text-xl focus:border-amber-500/50 outline-none transition-all"
                          />
                          <span className="absolute right-5 top-1/2 -translate-y-1/2 text-sm font-black text-slate-500">
                            {settings.coachDepositGiftType === 'amount' ? 'TL' : '%'}
                          </span>
                        </div>
                        <p className="text-[10px] text-slate-500 font-bold">Davet koduyla katılan koçun ilk bakiye yüklemesinde kazanacağı hediye bakiyesi.</p>
                      </div>

                      <div className="space-y-3">
                        <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest flex items-center justify-between">
                          <span>Davet Eden Koç Primi</span>
                          <span className="bg-indigo-500/20 text-indigo-300 px-2.5 py-1 rounded-lg text-[9px] font-bold">HER YÜKLEMEDE</span>
                        </label>
                        <div className="relative">
                          <input 
                            type="number" 
                            value={settings.coachReferrerRewardValue ?? 5}
                            onChange={(e) => setSettings({...settings, coachReferrerRewardValue: Number(e.target.value)})}
                            className="w-full bg-slate-900 border border-white/10 rounded-xl pl-5 pr-14 py-4 text-white font-mono text-xl focus:border-amber-500/50 outline-none transition-all"
                          />
                          <span className="absolute right-5 top-1/2 -translate-y-1/2 text-sm font-black text-slate-500">
                            {settings.coachDepositGiftType === 'amount' ? 'TL' : '%'}
                          </span>
                        </div>
                        <p className="text-[10px] text-slate-500 font-bold">Davet eden koçun, davet ettiği koçun her bakiye yüklemesinde kazanacağı prim/hediye.</p>
                      </div>

                      <div className="space-y-3 md:col-span-2 pt-4 border-t border-white/5">
                        <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest flex items-center justify-between">
                          <span className="flex items-center gap-2 text-emerald-400">
                            <Gift size={14} /> Yeni Kaydolan Koç Hoş Geldin Hediyesi
                          </span>
                          <span className="bg-emerald-500/20 text-emerald-300 px-2.5 py-1 rounded-lg text-[9px] font-bold">KAYIT ANINDA</span>
                        </label>
                        <div className="relative">
                          <input 
                            type="number" 
                            value={settings.coachWelcomeGiftAmount ?? 1500}
                            onChange={(e) => setSettings({...settings, coachWelcomeGiftAmount: Number(e.target.value)})}
                            className="w-full bg-slate-900 border border-emerald-500/30 rounded-xl pl-5 pr-14 py-4 text-emerald-400 font-mono text-xl focus:border-emerald-500 outline-none transition-all"
                          />
                          <span className="absolute right-5 top-1/2 -translate-y-1/2 text-sm font-black text-slate-500">
                            TL
                          </span>
                        </div>
                        <p className="text-[10px] text-slate-500 font-bold">Platforma yeni kaydolan koçların cüzdanına hediye olarak tanımlanacak sistem başlangıç bakiyesi (Varsayılan: 1.500 TL).</p>
                      </div>
                    </div>
                  ) : (
                    <div className="py-12 text-center bg-slate-900/50 rounded-2xl border border-white/5">
                      <p className="text-sm font-bold text-slate-400">Koç referans sistemi şu anda kapalı.</p>
                    </div>
                  )}
                </div>
              </motion.div>
            )}

            {/* GENERAL TAB */}
            {activeTab === 'general' && (
              <motion.div
                key="general"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.2 }}
                className="space-y-6"
              >
                <div className="bg-[#0f172a] border border-white/5 rounded-3xl p-6 md:p-8">
                  <div className="flex items-center justify-between mb-8 pb-4 border-b border-white/5">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-2xl bg-indigo-500/10 flex items-center justify-center text-indigo-500">
                        <Settings size={20} />
                      </div>
                      <div>
                        <h2 className="text-lg font-black text-white uppercase tracking-widest">Genel Sistem Ayarları</h2>
                        <p className="text-xs font-bold text-slate-500">Referans sisteminin ana durumunu ve temel maliyet kurallarını belirleyin.</p>
                      </div>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input 
                        type="checkbox" 
                        className="sr-only peer" 
                        checked={settings.isActive}
                        onChange={(e) => setSettings({...settings, isActive: e.target.checked})}
                      />
                      <div className="w-14 h-7 bg-slate-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-6 after:w-6 after:transition-all peer-checked:bg-indigo-500"></div>
                    </label>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div className="space-y-3">
                      <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Ödül Geçerlilik Süresi (Gün)</label>
                      <input 
                        type="number" 
                        value={settings.expirationDays}
                        onChange={(e) => setSettings({...settings, expirationDays: Number(e.target.value)})}
                        className="w-full bg-slate-900 border border-white/10 rounded-xl px-5 py-4 text-white font-mono text-xl focus:border-indigo-500/50 outline-none transition-all"
                        min="0"
                      />
                      <p className="text-[10px] text-slate-500 font-bold">Kazanılan ödül bakiyesi veya kuponun ne kadar süre geçerli olacağı.</p>
                    </div>

                    <div className="space-y-3">
                      <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Öğrenci İndirimi Karşılama (Maliyet)</label>
                      <select
                        value={settings.discountPayer || 'system'}
                        onChange={(e) => setSettings({...settings, discountPayer: e.target.value as any})}
                        className="w-full bg-slate-900 border border-white/10 rounded-xl px-5 py-4 text-sm font-bold text-white outline-none focus:border-indigo-500/50 appearance-none cursor-pointer"
                      >
                        <option value="system">Sistem Karşılar (Koçtan kesilmez)</option>
                        <option value="proportional">Orantılı (Sistem ve Koç paylaşır)</option>
                        <option value="coach">Koç Karşılar (Koç kazancından düşülür)</option>
                      </select>
                      <p className="text-[10px] text-slate-500 font-bold">Öğrenci referans kodunda davet edilenin indirim maliyetini kimin üstleneceği.</p>
                    </div>

                    <div className="space-y-3 md:col-span-2 pt-4 border-t border-white/5">
                      <label className="flex items-center gap-4 cursor-pointer group p-4 bg-slate-900/50 border border-white/5 rounded-2xl">
                        <div className="relative">
                          <input 
                            type="checkbox" 
                            className="sr-only" 
                            checked={settings.notifyOnSuccess}
                            onChange={(e) => setSettings({...settings, notifyOnSuccess: e.target.checked})}
                          />
                          <div className={`w-6 h-6 rounded border flex items-center justify-center transition-colors ${settings.notifyOnSuccess ? 'bg-indigo-600 border-indigo-600' : 'bg-transparent border-slate-600 group-hover:border-slate-400'}`}>
                            {settings.notifyOnSuccess && <Bell size={14} className="text-white" />}
                          </div>
                        </div>
                        <div>
                          <span className="text-sm font-bold text-white block">Sistem Bildirimleri</span>
                          <span className="text-[10px] font-bold text-slate-400">Kullanıcılara ödül kazanıldığında veya kullanıldığında uygulama içi bildirim gönderilir.</span>
                        </div>
                      </label>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}

            {/* STATS TAB */}
            {activeTab === 'stats' && (
              <motion.div
                key="stats"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.2 }}
                className="space-y-6"
              >
                <div className="bg-[#0f172a] border border-white/5 rounded-3xl p-6 md:p-8">
                  <div className="flex items-center gap-3 mb-8 pb-4 border-b border-white/5">
                    <div className="w-10 h-10 rounded-2xl bg-emerald-500/10 flex items-center justify-center text-emerald-500">
                      <BarChart3 size={20} />
                    </div>
                    <div>
                      <h2 className="text-lg font-black text-white uppercase tracking-widest">Finansal Analiz & Raporlar</h2>
                      <p className="text-xs font-bold text-slate-500">Referans sistemi sayesinde platformda dağıtılan ödüllerin bilançosu.</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {/* Stat Card 1 */}
                    <div className="bg-slate-900/50 border border-white/5 rounded-2xl p-6 relative overflow-hidden">
                      <div className="absolute top-0 right-0 w-32 h-32 bg-red-500/5 blur-[50px] rounded-full"></div>
                      <div className="flex items-center gap-3 mb-4">
                        <div className="p-2 bg-red-500/10 rounded-xl">
                          <GiftIcon size={16} className="text-red-500" />
                        </div>
                        <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">Öğrenci İndirimleri</span>
                      </div>
                      <div className="text-3xl font-black text-white">₺{stats.totalStudentDiscounts.toLocaleString('tr-TR')}</div>
                      <div className="mt-2 text-[10px] font-bold text-slate-500 uppercase tracking-widest">Öğrencilerin Kullandığı Hediye Kodları</div>
                    </div>

                    {/* Stat Card 2 */}
                    <div className="bg-slate-900/50 border border-white/5 rounded-2xl p-6 relative overflow-hidden">
                      <div className="absolute top-0 right-0 w-32 h-32 bg-amber-500/5 blur-[50px] rounded-full"></div>
                      <div className="flex items-center gap-3 mb-4">
                        <div className="p-2 bg-amber-500/10 rounded-xl">
                          <Users size={16} className="text-amber-500" />
                        </div>
                        <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">Koç Katılım Hediyeleri</span>
                      </div>
                      <div className="text-3xl font-black text-white">₺{stats.totalCoachGifts.toLocaleString('tr-TR')}</div>
                      <div className="mt-2 text-[10px] font-bold text-slate-500 uppercase tracking-widest">İlk Bakiye Yüklemelerine Verilen</div>
                    </div>

                    {/* Stat Card 3 */}
                    <div className="bg-slate-900/50 border border-white/5 rounded-2xl p-6 relative overflow-hidden">
                      <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/5 blur-[50px] rounded-full"></div>
                      <div className="flex items-center gap-3 mb-4">
                        <div className="p-2 bg-indigo-500/10 rounded-xl">
                          <TrendingUp size={16} className="text-indigo-500" />
                        </div>
                        <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">Koç Prim (Referans)</span>
                      </div>
                      <div className="text-3xl font-black text-white">₺{stats.totalReferrerRewards.toLocaleString('tr-TR')}</div>
                      <div className="mt-2 text-[10px] font-bold text-slate-500 uppercase tracking-widest">Davet Edenlere Dağıtılan Prim</div>
                    </div>
                  </div>

                  <div className="mt-8 bg-gradient-to-br from-emerald-500/10 to-transparent border border-emerald-500/20 rounded-3xl p-6 md:p-8 flex flex-col md:flex-row items-center justify-between gap-6">
                    <div>
                      <h3 className="text-sm font-black text-emerald-400 uppercase tracking-widest mb-2 flex items-center gap-2">
                        <TrendingDown size={18} />
                        Toplam Sistem Maliyeti
                      </h3>
                      <p className="text-xs font-bold text-slate-400">Tüm referans ve davet sistemi kampanyalarından dolayı sisteme yansıyan toplam hediye (maliyet) tutarı.</p>
                    </div>
                    <div className="text-4xl md:text-5xl font-black text-white tracking-tighter">
                      ₺{stats.totalGivenAmount.toLocaleString('tr-TR')}
                    </div>
                  </div>

                  <div className="mt-6 p-4 rounded-2xl bg-slate-900 border border-white/5 flex items-start gap-3">
                    <Info size={16} className="text-slate-500 shrink-0 mt-0.5" />
                    <p className="text-xs text-slate-400 font-medium leading-relaxed">
                      Referans sisteminin amacı platforma yeni öğrenci ve koç kazandırarak toplam hacmi büyütmektir. Yukarıdaki hediye maliyetleri, doğrudan sisteme kazandırılan yeni aktif üyelerin yaratacağı organik gelirin bir "pazarlama/büyüme" yatırımı olarak değerlendirilmelidir.
                    </p>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
        
      </div>
    </div>
  );
}
