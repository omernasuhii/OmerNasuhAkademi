import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  ChevronRight, 
  ChevronLeft, 
  Save, 
  Info, 
  ShieldCheck, 
  Brain,
  CheckCircle2,
  Loader2,
  Target,
  Flag,
  CalendarDays,
  CalendarSync,
  Calendar,
  AlertTriangle,
  Lightbulb
} from 'lucide-react';
import { useAuth } from '../../../lib/AuthContext';
import { analysisService } from '../../../services/analysisService';
import { useNavigate } from 'react-router-dom';
import Markdown from 'react-markdown';

export default function DartAnaliz() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [showIntro, setShowIntro] = useState(true);
  const [loading, setLoading] = useState(false);
  const [completed, setCompleted] = useState(false);

  const [formData, setFormData] = useState({
    makro: '',
    mezo: '',
    aylik: '',
    haftalik: '',
    mikro: '',
    engel: '',
    bPlan: ''
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSave = async () => {
    if (!user) return;
    
    if (!formData.makro || !formData.mezo || !formData.aylik || !formData.haftalik || !formData.mikro || !formData.engel || !formData.bPlan) {
        alert("Lütfen tüm alanları doldurun.");
        return;
    }

    setLoading(true);
    try {
      const payload = {
        answers: formData
      };

      const docId = await analysisService.saveResult(user.uid, 'DART', payload);
      navigate(`/panel/ogrenci/analizler/sonuc/${docId}`);
    } catch (error: any) {
      console.error("Kayıt hatası:", error);
      alert(error.message || "Analiz oluşturulurken hata oluştu.");
    } finally {
      setLoading(false);
    }
  };

  if (showIntro) {
    return (
      <div className="max-w-4xl mx-auto space-y-8 pb-20 pt-8 animate-in fade-in duration-700 px-4">
        <header className="space-y-4">
          <button 
            onClick={() => navigate('/panel/ogrenci/analizler')}
            className="flex items-center gap-2 text-slate-500 hover:text-white transition-colors text-xs font-bold uppercase tracking-widest"
          >
            <ChevronLeft size={16} />
            Analizlere Dön
          </button>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-rose-500/10 border border-rose-500/20 text-rose-400 text-[10px] font-black uppercase tracking-widest">
            <Target size={12} />
            HEDEF VE ODAKLANMA
          </div>
          <h1 className="text-4xl font-black text-white leading-tight">DART Hedef Yönetimi ve Eylem Planı Modülü</h1>
          <p className="text-slate-400 font-medium text-lg max-w-2xl">
            Öğrencinin "Kazanmak istiyorum" şeklindeki belirsiz isteğini; ölçülebilir, zamanlı ve parçalanmış (step-by-step) bir eylem planına dönüştürmektir. Büyük hedefin (Makro) altında ezilmeni önleyip, bugünkü küçük hedefine (Mikro) odaklanmanı sağlar.
          </p>
        </header>

        <div className="bg-slate-900/50 border border-white/5 rounded-[32px] p-8 space-y-6">
          <div className="flex items-center gap-4 text-rose-400">
            <ShieldCheck size={24} />
            <span className="font-bold text-lg">Kuramsal Dayanak</span>
          </div>
          <p className="text-slate-300 font-medium leading-relaxed">
            <strong>D.A.R.T:</strong> Durumu Analiz et - Amacı Netleştir - Rotayı Böl - Takip Et. <br />
            Bu modül; Locke’un Hedef Belirleme Kuramı (Zorlayıcı ama ulaşılabilir hedefler performansı artırır) ve Bilişsel Yük Kuramı (Büyük görevleri parçalara bölmek zihinsel yorgunluğu azaltır) temeline dayanır.
          </p>
          <div className="flex items-start gap-4 p-4 bg-rose-500/5 border border-rose-500/10 rounded-2xl">
            <Info className="text-rose-500 shrink-0 mt-0.5" size={20} />
            <p className="text-xs text-slate-400 font-medium">
              <strong>Nasıl Uygulanır?</strong> Bir 'Dart Tahtası' düşüneceğiz. En dış halkadan (Uzak hedef) en iç halkaya (Bugün) doğru ilerleyeceğiz. Hedefleri Reverse Engineering (Sondan Başa Mühendislik) ile böleceğiz. Hedeflerin SMART kuralına (Spesifik, Ölçülebilir vb.) uygun olmasına dikkat et.
            </p>
          </div>
        </div>

        <div className="flex justify-center pt-4">
          <button
            onClick={() => setShowIntro(false)}
            className="px-12 py-5 bg-rose-600 hover:bg-rose-500 text-white rounded-3xl font-black text-xl transition-all hover:scale-105 shadow-xl shadow-rose-600/20 flex items-center gap-3"
          >
            DART Hedefini Belirle
            <ChevronRight size={24} />
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-8 pb-20 pt-8 animate-in fade-in duration-500 px-4">
      <div className="flex justify-between items-center mb-4">
        <button 
          onClick={() => setShowIntro(true)}
          className="p-2 hover:bg-white/5 rounded-full text-slate-500 hover:text-white transition-colors flex items-center gap-2 text-sm font-bold"
        >
          <ChevronLeft size={20} />
          Girişe Dön
        </button>
      </div>

      <div className="bg-slate-900/50 backdrop-blur-xl border border-white/5 rounded-[40px] p-8 md:p-12 space-y-12 shadow-2xl">
        <div className="space-y-4 text-center">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-rose-500/10 text-rose-400 text-[10px] font-black uppercase tracking-widest">
              DART TAHTASI VE REVERSE ENGINEERING
            </div>
            <h2 className="text-2xl md:text-3xl font-bold text-white leading-tight">
            Hedef Kırılım Tablosunu Doldur
            </h2>
            <p className="text-slate-400 text-sm max-w-2xl mx-auto">
                Büyük hedefini adım adım bugüne kadar indirge ve önüne çıkabilecek engeller için bir B Planı oluştur.
            </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="space-y-6">
                <div className="space-y-2">
                    <label className="text-sm font-bold tracking-widest text-slate-300 uppercase flex items-center gap-2">
                        <Flag size={16} className="text-rose-400" />
                        1. Dış Halka: Makro Hedef (Yıl Sonu)
                    </label>
                    <p className="text-[10px] text-slate-500">Hangi Üniversite / Lise? Hangi Bölüm? Gereken Net/Sıralama kaç? (Örn: ODTÜ Endüstri Müh. - İlk 3.000)</p>
                    <input
                        type="text"
                        name="makro"
                        value={formData.makro}
                        onChange={handleChange}
                        className="w-full bg-slate-800/50 border border-slate-700 rounded-2xl px-4 py-3 text-white placeholder:text-slate-600 focus:outline-none focus:border-rose-500 focus:ring-1 focus:ring-rose-500 transition-all font-medium"
                        placeholder="YKS'de İlk 5.000, Tüm AYT konularını Mart'ta bitir..."
                    />
                </div>

                <div className="space-y-2">
                    <label className="text-sm font-bold tracking-widest text-slate-300 uppercase flex items-center gap-2">
                        <CalendarDays size={16} className="text-orange-400" />
                        2. Orta Halka: Mezo Hedef (3 Ay Sonra)
                    </label>
                    <p className="text-[10px] text-slate-500">Sınava 6/3 ay kala nerede olmalıyım? Hangi konular bitmiş olmalı? (Örn: TYT 85 Net Sabitleme)</p>
                    <input
                        type="text"
                        name="mezo"
                        value={formData.mezo}
                        onChange={handleChange}
                        className="w-full bg-slate-800/50 border border-slate-700 rounded-2xl px-4 py-3 text-white placeholder:text-slate-600 focus:outline-none focus:border-rose-500 focus:ring-1 focus:ring-rose-500 transition-all font-medium"
                        placeholder="TYT Fen eksiklerini kapat, haftada 2 branş denemesi..."
                    />
                </div>

                <div className="space-y-2">
                    <label className="text-sm font-bold tracking-widest text-slate-300 uppercase flex items-center gap-2">
                        <CalendarSync size={16} className="text-yellow-400" />
                        3. İç Grup: Aylık Hedef (Bu Ay)
                    </label>
                    <p className="text-[10px] text-slate-500">Hedef türü: Aylık. Odak nedir? (Örn: Limit-Türev Fasikülü Bitir)</p>
                    <input
                        type="text"
                        name="aylik"
                        value={formData.aylik}
                        onChange={handleChange}
                        className="w-full bg-slate-800/50 border border-slate-700 rounded-2xl px-4 py-3 text-white placeholder:text-slate-600 focus:outline-none focus:border-rose-500 focus:ring-1 focus:ring-rose-500 transition-all font-medium"
                        placeholder="Her gün 40 dk video, 60 dk soru çözümü..."
                    />
                </div>
            </div>

            <div className="space-y-6">
                <div className="space-y-2">
                    <label className="text-sm font-bold tracking-widest text-slate-300 uppercase flex items-center gap-2">
                        <Calendar size={16} className="text-emerald-400" />
                        4. İç Grup: Haftalık Hedef (Bu Hafta)
                    </label>
                    <p className="text-[10px] text-slate-500">Bu hafta hangi konu bitecek? (Örn: Türev Alma Kuralları)</p>
                    <input
                        type="text"
                        name="haftalik"
                        value={formData.haftalik}
                        onChange={handleChange}
                        className="w-full bg-slate-800/50 border border-slate-700 rounded-2xl px-4 py-3 text-white placeholder:text-slate-600 focus:outline-none focus:border-rose-500 focus:ring-1 focus:ring-rose-500 transition-all font-medium"
                        placeholder="3 kaynaktan tarama yap, çıkmış soruları çöz."
                    />
                </div>

                <div className="space-y-2">
                    <label className="text-sm font-bold tracking-widest text-slate-300 uppercase flex items-center gap-2">
                        <Target size={16} className="text-indigo-400" />
                        5. Merkez (Bullseye): Mikro Hedef (Bugün)
                    </label>
                    <p className="text-[10px] text-slate-500">Bugün 12'den vurman için gereken tek atış nedir? (Örn: 50 Türev Sorusu)</p>
                    <input
                        type="text"
                        name="mikro"
                        value={formData.mikro}
                        onChange={handleChange}
                        className="w-full bg-slate-800/50 border border-slate-700 rounded-2xl px-4 py-3 text-white placeholder:text-slate-600 focus:outline-none focus:border-rose-500 focus:ring-1 focus:ring-rose-500 transition-all font-medium"
                        placeholder="Okuldan gelince 16.00-18.00 arası masaya otur."
                    />
                </div>
            </div>

            <div className="md:col-span-2 pt-6 border-t border-white/5 space-y-6">
                 <div className="space-y-4 text-center">
                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/10 text-amber-400 text-[10px] font-black uppercase tracking-widest">
                    WOOP TEKNİĞİ: ENGEL VE STRATEJİ ANALİZİ
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div className="space-y-2">
                        <label className="text-sm font-bold tracking-widest text-slate-300 uppercase flex items-center gap-2">
                            <AlertTriangle size={16} className="text-amber-400" />
                            En Büyük Engel (Obstacle)
                        </label>
                        <p className="text-[10px] text-slate-500">Telefon, arkadaş ısrarı veya zorlanınca bırakma isteği gibi hedeflerine ulaşmanı engelleyecek en olası durum nedir?</p>
                        <textarea
                            name="engel"
                            value={formData.engel}
                            onChange={handleChange}
                            rows={3}
                            className="w-full bg-slate-800/50 border border-slate-700 rounded-2xl px-4 py-3 text-white placeholder:text-slate-600 focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500 transition-all font-medium"
                            placeholder="Örneğin: Masaya oturduğumda sürekli telefona bakma isteği..."
                        />
                    </div>
                    
                    <div className="space-y-2">
                        <label className="text-sm font-bold tracking-widest text-slate-300 uppercase flex items-center gap-2">
                            <Lightbulb size={16} className="text-emerald-400" />
                            B Planım / Stratejim (Plan)
                        </label>
                        <p className="text-[10px] text-slate-500">"Eğer zorlanırsam/engel çıkarsa ... yapacağım" (Örn: Eğer zorlanırsam YouTube'dan farklı hoca izleyeceğim.)</p>
                        <textarea
                            name="bPlan"
                            value={formData.bPlan}
                            onChange={handleChange}
                            rows={3}
                            className="w-full bg-slate-800/50 border border-slate-700 rounded-2xl px-4 py-3 text-white placeholder:text-slate-600 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-all font-medium"
                            placeholder="Örneğin: Telefonu salonda bırakıp odaya öyle geçeceğim."
                        />
                    </div>
                </div>
            </div>
        </div>

        <div className="flex justify-center pt-8">
          <button
            onClick={handleSave}
            disabled={loading}
            className="px-8 md:px-12 py-5 bg-rose-600 hover:bg-rose-500 text-white rounded-3xl font-black text-lg md:text-xl transition-all hover:scale-105 shadow-xl shadow-rose-600/20 flex items-center justify-center gap-3 disabled:opacity-50 w-full md:w-auto"
          >
            {loading ? (
              <>
                 <Loader2 className="animate-spin" size={24} />
                 DART Planı Kaydediliyor...
              </>
            ) : (
              <>
                 DART Hedef Planını Onayla
                 <Save size={24} />
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
