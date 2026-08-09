import React from 'react';
import { motion } from 'motion/react';
import { 
  ScanLine,
  PenTool,
  Clock,
  BookOpen,
  User,
  Activity,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';
import { Link } from 'react-router-dom';

const containerVariants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.1 }
  }
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0, transition: { type: "spring" as const, stiffness: 300, damping: 24 } }
};

export default function ExamProcessTracking() {
  return (
    <div className="min-h-screen bg-[#0f172a] text-white pt-24 pb-20 relative overflow-hidden">
      {/* Background Effects */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
        <div className="absolute top-[10%] left-[-5%] w-[400px] h-[400px] bg-purple-600/20 blur-[120px] rounded-full"></div>
        <div className="absolute top-[30%] right-[-10%] w-[500px] h-[500px] bg-orange-600/10 blur-[150px] rounded-full"></div>
        <div className="absolute bottom-[10%] left-[20%] w-[400px] h-[400px] bg-indigo-600/10 blur-[150px] rounded-full"></div>
      </div>

      <div className="max-w-7xl mx-auto px-6 relative z-10 space-y-32">
        
        {/* HERO SECTION */}
        <div className="text-center max-w-4xl mx-auto space-y-8 mt-12">
          <motion.div 
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="inline-flex items-center gap-2 bg-purple-500/10 border border-purple-500/20 text-purple-400 px-5 py-2.5 rounded-full text-sm font-bold uppercase tracking-widest"
          >
            <Activity size={18} />
            <span>Fiziksel Perfromans Analizi</span>
          </motion.div>
          
          <motion.h1 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-5xl md:text-7xl font-black text-white tracking-tighter leading-tight"
          >
            Masadaki Gizli Zaman Hırsızlarını <br/>
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-400 via-fuchsia-500 to-orange-500">Tespit Ediyoruz.</span>
          </motion.h1>
          
          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="text-lg md:text-xl text-slate-400 leading-relaxed font-medium"
          >
            Doğru şıkkı bulmak kadar, o şıkkı optiğe ne zaman ve nasıl işaretlediğiniz, soruyu okurken kalemi nasıl tuttuğunuz ve oturma şekliniz de sınav sonucunu belirler. Sınav Süreç Takibi ile <strong>165 dakikalık fiziksel performansınızı</strong> analiz ediyoruz.
          </motion.p>
        </div>

        {/* DETAILED FEATURES */}
        <div className="space-y-16">
            <div className="text-center max-w-3xl mx-auto space-y-4">
               <h2 className="text-3xl md:text-5xl font-black text-white">Akademik Beden Dili & Süreç Yönetimi</h2>
               <p className="text-slate-400 text-lg">Sınav esnasındaki mikro-alışkanlıklarınız toplamda size dakikalar kazandırabilir veya kaybettirebilir.</p>
            </div>

            <motion.div 
                variants={containerVariants}
                initial="hidden"
                whileInView="show"
                viewport={{ once: true }}
                className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8"
            >
                {/* Dakika-Soru Eşleşmesi */}
                <motion.div variants={itemVariants} className="bg-slate-900/80 backdrop-blur-xl border border-slate-800 hover:border-blue-500/30 transition-colors rounded-3xl p-8 group relative overflow-hidden flex flex-col">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/5 blur-[40px] rounded-full group-hover:bg-blue-500/10 transition-colors"></div>
                    <div className="w-14 h-14 bg-blue-500/10 text-blue-400 rounded-2xl flex items-center justify-center mb-6">
                        <Clock size={28} />
                    </div>
                    <h3 className="text-xl font-bold text-white mb-4">Senkronizasyon (Dakika/Soru)</h3>
                    <p className="text-slate-400 leading-relaxed font-light text-sm flex-1">
                        Deneme esnasında örneğin 45. dakikada kaçıncı soruda olmanız gerektiğiyle, gerçekte nerede olduğunuzu eşleştiriyoruz. İdeal tempo ile mevcut hızınız arasındaki farkları bölüm bölüm raporlayıp, sınav içi hızlanma ve yavaşlama krizlerini önlüyoruz.
                    </p>
                </motion.div>

                {/* Optik Kodlama */}
                <motion.div variants={itemVariants} className="bg-slate-900/80 backdrop-blur-xl border border-slate-800 hover:border-purple-500/30 transition-colors rounded-3xl p-8 group relative overflow-hidden flex flex-col">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-purple-500/5 blur-[40px] rounded-full group-hover:bg-purple-500/10 transition-colors"></div>
                    <div className="w-14 h-14 bg-purple-500/10 text-purple-400 rounded-2xl flex items-center justify-center mb-6">
                        <ScanLine size={28} />
                    </div>
                    <h3 className="text-xl font-bold text-white mb-4">Optik Form Kodlama Stratejisi</h3>
                    <ul className="text-slate-400 leading-relaxed font-light text-sm flex-1 space-y-3">
                        <li className="flex items-start gap-2">
                            <CheckCircle2 size={16} className="text-purple-400 shrink-0 mt-0.5" />
                            <span><strong>Zamanlama:</strong> Soru soru mu kodluyorsunuz, sayfa sayfa mı, yoksa bölüm sonu mu? Kaydırma riskini sıfıra indirip hız kazandıran ideal kodlama ritminizi tespit ediyoruz.</span>
                        </li>
                        <li className="flex items-start gap-2">
                            <CheckCircle2 size={16} className="text-purple-400 shrink-0 mt-0.5" />
                            <span><strong>Şekil:</strong> Yuvarlağı doldururken taşırma takıntısı, sil-yaz işlemleri nedeniyle kaybettiğiniz saniyeler.</span>
                        </li>
                    </ul>
                </motion.div>

                {/* Kalem Tutuş */}
                <motion.div variants={itemVariants} className="bg-slate-900/80 backdrop-blur-xl border border-slate-800 hover:border-orange-500/30 transition-colors rounded-3xl p-8 group relative overflow-hidden flex flex-col">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-orange-500/5 blur-[40px] rounded-full group-hover:bg-orange-500/10 transition-colors"></div>
                    <div className="w-14 h-14 bg-orange-500/10 text-orange-400 rounded-2xl flex items-center justify-center mb-6">
                        <PenTool size={28} />
                    </div>
                    <h3 className="text-xl font-bold text-white mb-4">Kalem Becerisi & Soru Çizme</h3>
                    <p className="text-slate-400 leading-relaxed font-light text-sm flex-1">
                        Sorunun altını tamamen çizerek okuyan öğrencilerin 1 saatte yaşadığı bilek yorgunluğu, dikkat dağınıklığına eşittir. Sadece anahtar kelimeleri çizmeyi, kurşun kalemi ergonomik kullanmayı ve göz ucunu kalemin gerisinde tutmayı analizleyip öğretiyoruz.
                    </p>
                </motion.div>

                {/* Sayfa Değiştirme */}
                <motion.div variants={itemVariants} className="bg-slate-900/80 backdrop-blur-xl border border-slate-800 hover:border-emerald-500/30 transition-colors rounded-3xl p-8 group relative overflow-hidden flex flex-col">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/5 blur-[40px] rounded-full group-hover:bg-emerald-500/10 transition-colors"></div>
                    <div className="w-14 h-14 bg-emerald-500/10 text-emerald-400 rounded-2xl flex items-center justify-center mb-6">
                        <BookOpen size={28} />
                    </div>
                    <h3 className="text-xl font-bold text-white mb-4">Fiziksel Alan Yönetimi</h3>
                    <p className="text-slate-400 leading-relaxed font-light text-sm flex-1">
                        Sayfa çevirirken deneme kitapçığına hakimiyet, boşluklara yapılan işlemlerin (karalama) düzeni. Dar bir okul masasında 16 sayfalık matematik alanını yönetme ve kağıtla boğuşmamayı sağlayan mekanik alışkanlıkların tespiti.
                    </p>
                </motion.div>

                {/* Oturma Tarzı */}
                <motion.div variants={itemVariants} className="bg-slate-900/80 backdrop-blur-xl border border-slate-800 hover:border-rose-500/30 transition-colors rounded-3xl p-8 group relative overflow-hidden flex flex-col md:col-span-2 lg:col-span-2">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-rose-500/5 blur-[40px] rounded-full group-hover:bg-rose-500/10 transition-colors"></div>
                    <div className="flex flex-col md:flex-row gap-6 h-full items-center">
                        <div className="w-14 h-14 bg-rose-500/10 text-rose-400 rounded-2xl flex items-center justify-center shrink-0">
                            <User size={28} />
                        </div>
                        <div>
                            <h3 className="text-xl font-bold text-white mb-2">Postür ve Oturma Tarzı (Oksijen Yönetimi)</h3>
                            <p className="text-slate-400 leading-relaxed font-light text-sm">
                                Sınav esnasında göğüs kafesini sıkıştıracak kadar masaya kapanmak, beyne giden oksijeni %20 oranında azaltarak uyku hali ve odak kaybı yaratır. Göz-kitapçık mesafenizi, nefes alanınızı ve omurga dikliğinizi gözlemliyor, sınav yorgunluğunuza sebep olan bedensel sabotajları ortadan kaldırıyoruz.
                            </p>
                        </div>
                    </div>
                </motion.div>
            </motion.div>
        </div>

        {/* WHY IT MATTERS */}
        <div className="bg-gradient-to-r from-purple-900/30 to-slate-900/80 backdrop-blur-2xl border border-purple-500/20 rounded-[3rem] p-10 md:p-16 relative overflow-hidden">
            <div className="text-center max-w-3xl mx-auto space-y-6">
                <div className="w-16 h-16 bg-white/5 border border-white/10 rounded-full flex items-center justify-center text-white mx-auto">
                     <AlertCircle size={32} />
                </div>
               <h2 className="text-3xl font-black text-white">Küçük Şeyler, Büyük Sonuçlar Doğurur</h2>
               <p className="text-slate-300 text-lg font-light leading-relaxed">
                   Gereksiz her bilek hareketi, her fazladan sayfa çevirişi, dikkati dağıtan her kodlama gecikmesi sadece saniyelerinizi almaz; <strong>odaklanma enerjinizi</strong> tüketir. Sınav Süreç Takibi analizimizle, masadaki operasyonel performansınızı kusursuz bir makine tutarlılığına ulaştırıyoruz.
               </p>
               <div className="pt-6">
                    <Link to="/kayit" className="inline-flex items-center justify-center gap-3 bg-white text-slate-900 px-8 py-4 rounded-2xl font-black text-lg hover:bg-slate-100 transition-all hover:scale-105 shadow-xl shadow-white/10">
                        Değerlendirmeye Katıl
                    </Link>
               </div>
            </div>
        </div>

      </div>
    </div>
  );
}
