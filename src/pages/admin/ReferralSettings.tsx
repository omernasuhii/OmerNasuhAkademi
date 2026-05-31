import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { Share2, Users, Gift, Save, GiftIcon, Bell, Settings, ArrowUpRight } from 'lucide-react';
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
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    referralService.getSettings().then(data => {
      if (data) setSettings(data);
      setLoading(false);
    });
  }, []);

  const handleSave = async () => {
    setSaving(true);
    await referralService.updateSettings(settings);
    setSaving(false);
    alert('Ayarlar başarıyla kaydedildi!');
  };

  if (loading) return <div className="p-8 text-slate-400">Yükleniyor...</div>;

  return (
    <div className="p-6 md:p-8 space-y-8">
      {/* Header */}
      <motion.div 
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col md:flex-row md:items-center justify-between gap-4"
      >
        <div>
          <h1 className="text-2xl md:text-3xl font-black text-white uppercase tracking-tight flex items-center gap-3">
            <Share2 className="text-red-500" size={32} />
            Referans Sistemi Ayarları
          </h1>
          <p className="text-slate-400 mt-2 font-medium">Öğrencilerin arkadaşlarını davet ederek ödül kazanmasını sağlayan sistemi yönetin.</p>
        </div>
        <div className="flex items-center gap-4">
          <button 
            onClick={handleSave}
            disabled={saving}
            className="flex items-center gap-2 bg-red-600 hover:bg-red-700 text-white px-6 py-3 rounded-xl font-bold uppercase tracking-widest transition-colors shadow-lg shadow-red-600/20 disabled:opacity-50"
          >
            <Save size={18} />
            {saving ? 'Kaydediliyor...' : 'Değişiklikleri Kaydet'}
          </button>
        </div>
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Main Settings Panel */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="lg:col-span-2 space-y-8"
        >
          {/* General Enable Switch */}
          <div className="bg-[#0f172a] border border-white/5 rounded-3xl p-8 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-64 h-64 bg-red-500/5 blur-[80px] pointer-events-none rounded-full"></div>
            
            <div className="flex items-center justify-between mb-2">
              <h2 className="text-lg font-bold text-white uppercase tracking-widest flex items-center gap-2">
                <Settings className="text-slate-400" size={20} />
                Genel Durum
              </h2>
              <label className="relative inline-flex items-center cursor-pointer">
                <input 
                  type="checkbox" 
                  className="sr-only peer" 
                  checked={settings.isActive}
                  onChange={(e) => setSettings({...settings, isActive: e.target.checked})}
                />
                <div className="w-14 h-7 bg-slate-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-6 after:w-6 after:transition-all peer-checked:bg-red-600"></div>
              </label>
            </div>
            <p className="text-sm text-slate-400 mb-6">Referans sistemini tamamen açıp kapatın. Kapalı olduğunda, öğrenciler kod paylaşamaz ve eskiden paylaşılan kodlar yeni kayıtlar için çalışmaz.</p>
          </div>

          {/* Reward Configuration */}
          <div className="bg-[#0f172a] border border-white/5 rounded-3xl p-8">
            <h2 className="text-lg font-bold text-white uppercase tracking-widest mb-6 flex items-center gap-2 border-b border-white/5 pb-4">
              <GiftIcon className="text-red-500" size={20} />
              Ödül Yapılandırması
            </h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-3 relative group">
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Ödül Türü</label>
                <div className="grid grid-cols-2 gap-2">
                  <button 
                    onClick={() => setSettings({...settings, rewardType: 'percent'})}
                    className={`px-4 py-3 rounded-xl border text-sm font-bold uppercase tracking-widest transition-all ${settings.rewardType === 'percent' ? 'bg-indigo-500/20 border-indigo-500 text-indigo-400' : 'bg-slate-900 border-white/5 text-slate-400 hover:bg-slate-800'}`}
                  >
                    Yüzde (%)
                  </button>
                  <button 
                    onClick={() => setSettings({...settings, rewardType: 'balance'})}
                    className={`px-4 py-3 rounded-xl border text-sm font-bold uppercase tracking-widest transition-all ${settings.rewardType === 'balance' ? 'bg-emerald-500/20 border-emerald-500 text-emerald-400' : 'bg-slate-900 border-white/5 text-slate-400 hover:bg-slate-800'}`}
                  >
                    Bakiye (TL)
                  </button>
                </div>
              </div>
              
              <div className="space-y-3">
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Ödül Geçerlilik Süresi (Gün)</label>
                <input 
                  type="number" 
                  value={settings.expirationDays}
                  onChange={(e) => setSettings({...settings, expirationDays: Number(e.target.value)})}
                  className="w-full bg-slate-900 border border-white/5 rounded-xl px-4 py-3 text-white font-mono text-lg focus:border-red-500/50 outline-none transition-all"
                  min="0"
                />
              </div>

              <div className="space-y-3 md:pt-4 border-t border-white/5 md:col-span-2"></div>

              <div className="space-y-3">
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest flex items-center justify-between">
                  <span>Davet Eden Ödülü</span>
                  <span className="bg-slate-800 text-slate-400 px-2 py-0.5 rounded text-[8px]">KAZANÇ</span>
                </label>
                <div className="relative">
                  <input 
                    type="number" 
                    value={settings.referrerReward}
                    onChange={(e) => setSettings({...settings, referrerReward: Number(e.target.value)})}
                    className="w-full bg-slate-900 border border-white/5 rounded-xl pl-4 pr-12 py-3 text-white font-mono text-xl focus:border-red-500/50 outline-none transition-all"
                  />
                  <span className="absolute right-4 top-1/2 -translate-y-1/2 text-sm font-bold text-slate-500">{settings.rewardType === 'percent' ? '%' : 'TL'}</span>
                </div>
                <p className="text-xs text-slate-500">Kodu paylaşan kişinin kazanacağı miktar.</p>
              </div>

              <div className="space-y-3">
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest flex items-center justify-between">
                  <span>Davet Edilen Ödülü</span>
                  <span className="bg-slate-800 text-slate-400 px-2 py-0.5 rounded text-[8px]">İNDİRİM</span>
                </label>
                <div className="relative">
                  <input 
                    type="number" 
                    value={settings.refereeReward}
                    onChange={(e) => setSettings({...settings, refereeReward: Number(e.target.value)})}
                    className="w-full bg-slate-900 border border-white/5 rounded-xl pl-4 pr-12 py-3 text-white font-mono text-xl focus:border-red-500/50 outline-none transition-all"
                  />
                  <span className="absolute right-4 top-1/2 -translate-y-1/2 text-sm font-bold text-slate-500">{settings.rewardType === 'percent' ? '%' : 'TL'}</span>
                </div>
                <p className="text-xs text-slate-500">Kayıt olan kişinin kazanacağı hoşgeldin miktarı.</p>
              </div>
            </div>
          </div>
          
          {/* Rules & Triggers */}
          <div className="bg-[#0f172a] border border-white/5 rounded-3xl p-8">
            <h2 className="text-lg font-bold text-white uppercase tracking-widest mb-6 flex items-center gap-2 border-b border-white/5 pb-4">
              <ArrowUpRight className="text-blue-500" size={20} />
              Ödül Tetikleyicileri
            </h2>
            
            <div className="space-y-4">
              <div className="bg-slate-900 border border-white/5 rounded-2xl p-4 flex items-start gap-4">
                <div className="mt-1">
                  <div className="w-10 h-10 rounded-full bg-blue-500/20 flex items-center justify-center border border-blue-500/30">
                    <span className="text-blue-400 font-bold">1</span>
                  </div>
                </div>
                <div className="flex-1">
                  <h3 className="text-sm font-bold text-white uppercase mb-1">Yeni Kayıt Olma</h3>
                  <p className="text-xs text-slate-400 mb-2">Davet edilen kişi sisteme kayıt olduğunda kayıt olan kişiye ödül verilir, ancak davet eden kişi hedefe ulaşıldığında ödül alır.</p>
                </div>
              </div>
              
              <div className="bg-slate-900 border border-white/5 rounded-2xl p-4 flex items-start gap-4 ring-1 ring-red-500/30 bg-gradient-to-r from-red-500/5 to-transparent">
                <div className="mt-1">
                  <div className="w-10 h-10 rounded-full bg-red-500/20 flex items-center justify-center border border-red-500/30">
                    <span className="text-red-400 font-bold">2</span>
                  </div>
                </div>
                <div className="flex-1">
                  <h3 className="text-sm font-bold text-white uppercase mb-2">Gerekli Abonelik/Hizmet Alımı <span className="text-red-400">*</span></h3>
                  <p className="text-xs text-slate-400 mb-3">Davet eden kişinin ödülü alabilmesi için davet edilen kişinin sistemde gerçekleştirmesi gereken minimum harcama/işlem sayısı.</p>
                  
                  <select 
                    className="bg-black/50 border border-white/10 rounded-xl px-4 py-2 text-sm text-white outline-none focus:border-red-500/50 w-full"
                    value={settings.minUsageThreshold}
                    onChange={(e) => setSettings({...settings, minUsageThreshold: Number(e.target.value)})}
                  >
                    <option value={0}>Sadece Hesap Açması Yeterli</option>
                    <option value={1}>1 Kez Abonelik Almalı</option>
                    <option value={2}>2 Kez Abonelik Almalı</option>
                  </select>
                </div>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Sidebar Summary Widget */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="space-y-6"
        >
          {/* Live Preview / Summary */}
          <div className="bg-gradient-to-br from-slate-800 to-[#0f172a] border border-white/10 rounded-3xl p-6 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-full h-full bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-[0.03] pointer-events-none"></div>
            
            <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-6">Temsili Görüntü (Öğrenci Paneli)</h3>
            
            <div className="bg-slate-900 border border-white/5 rounded-2xl p-4 mb-4">
              <div className="flex items-center gap-3 mb-2">
                <Gift className="text-emerald-400" size={20} />
                <span className="text-xs font-bold text-white">Arkadaşını Davet Et!</span>
              </div>
              <p className="text-[10px] text-slate-400 leading-relaxed mb-3">
                Arkadaşını davet et, arkadaşın {settings.minUsageThreshold > 0 ? "kaydolup abonelik aldığında" : "sisteme katıldığında"} sen <strong className="text-white">{settings.referrerReward} {settings.rewardType === 'percent' ? '%' : 'TL'}</strong> kazan, o da anında <strong className="text-white">{settings.refereeReward} {settings.rewardType === 'percent' ? '%' : 'TL'}</strong> kazansın!
              </p>
              <div className="flex items-center gap-2">
                <div className="flex-1 bg-black/50 border border-white/10 rounded-lg py-2 px-3 text-center">
                  <span className="text-sm font-mono font-bold text-white tracking-[0.2em]">FOCUS2026</span>
                </div>
                <button className="bg-indigo-500 hover:bg-indigo-600 text-white p-2 rounded-lg transition-colors">
                  <Share2 size={16} />
                </button>
              </div>
            </div>
            
            {/* Stats */}
            <div className="mt-6 pt-6 border-t border-white/5 space-y-4">
              <div>
                <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest block mb-1">Toplam Yönlendirme</span>
                <span className="text-2xl font-black text-white">1,248</span>
              </div>
              <div>
                <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest block mb-1">Dağıtılan Toplam Ödül</span>
                <span className="text-2xl font-black text-emerald-400">62.400 <span className="text-sm text-emerald-500 font-bold uppercase">{settings.rewardType === 'percent' ? '%' : 'TL'}</span></span>
              </div>
            </div>
          </div>
          
          <div className="bg-[#0f172a] border border-white/5 rounded-3xl p-6">
            <h3 className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-4">Bildirimler</h3>
            <label className="flex items-center gap-3 cursor-pointer group">
              <div className="relative">
                <input 
                  type="checkbox" 
                  className="sr-only" 
                  checked={settings.notifyOnSuccess}
                  onChange={(e) => setSettings({...settings, notifyOnSuccess: e.target.checked})}
                />
                <div className={`w-5 h-5 rounded border flex items-center justify-center transition-colors ${settings.notifyOnSuccess ? 'bg-red-600 border-red-600' : 'bg-transparent border-slate-600 group-hover:border-slate-400'}`}>
                  {settings.notifyOnSuccess && <Bell size={12} className="text-white" />}
                </div>
              </div>
              <span className="text-xs font-semibold text-slate-300">Ödül kazanıldığında uygulamaiçi bildirim gönder</span>
            </label>
          </div>
        </motion.div>
        
      </div>
    </div>
  );
}
