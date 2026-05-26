import React from 'react';
import { motion } from 'motion/react';
import { 
  Brain, 
  Target, 
  Activity, 
  ShieldCheck, 
  Sparkles,
  Microscope,
  Dna,
  Compass,
  LineChart,
  CheckCircle2,
  ArrowRight,
  Fingerprint,
  Lightbulb,
  Workflow
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

export default function PersonalityAnalysis() {
  return (
    <div className="min-h-screen bg-[#0f172a] text-white pt-24 pb-20 relative overflow-hidden">
      {/* Background Effects */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
        <div className="absolute top-[-10%] left-[-5%] w-[400px] h-[400px] bg-indigo-600/20 blur-[120px] rounded-full"></div>
        <div className="absolute top-[40%] right-[-10%] w-[500px] h-[500px] bg-blue-600/20 blur-[150px] rounded-full"></div>
        <div className="absolute bottom-[-10%] left-[20%] w-[600px] h-[600px] bg-emerald-600/10 blur-[150px] rounded-full"></div>
      </div>

      <div className="max-w-7xl mx-auto px-6 relative z-10 space-y-24">
        
        {/* HERO SECTION */}
        <div className="text-center max-w-4xl mx-auto space-y-8 mt-8">
          <motion.div 
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="inline-flex items-center gap-2 bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 px-5 py-2.5 rounded-full text-sm font-bold uppercase tracking-widest"
          >
            <Microscope size={18} />
            <span>Bilimsel Temelli Gelişim</span>
          </motion.div>
          
          <motion.h1 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-5xl md:text-7xl font-black text-white tracking-tighter leading-tight"
          >
            Öğrencinin <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-indigo-400 to-purple-500">Zihinsel Röntgenini</span> Çekiyoruz
          </motion.h1>
          
          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="text-lg md:text-xl text-slate-400 leading-relaxed"
          >
            Sadece doğru/yanlış sayılarına bakan klasik sistemlerin ötesine geçin. Psikolojik dayanıklılık, stratejik zeka, odaklanma gücü ve öğrenme modelini <strong>45 farklı bilimsel ölçekle</strong> analiz ederek başarıyı tasarlıyoruz.
          </motion.p>
        </div>

        {/* STATS MATRIX */}
        <motion.div 
          variants={containerVariants}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true }}
          className="grid grid-cols-1 md:grid-cols-3 gap-6"
        >
           <motion.div variants={itemVariants} className="bg-slate-900/50 backdrop-blur-xl border border-slate-800 rounded-3xl p-8 flex flex-col items-center text-center group hover:border-blue-500/30 transition-colors">
              <div className="w-16 h-16 bg-blue-500/10 text-blue-400 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                 <Fingerprint size={32} />
              </div>
              <h3 className="text-4xl font-black text-white mb-2">360°</h3>
              <p className="text-sm text-slate-400 font-medium">Bütüncül Öğrenci Profili</p>
           </motion.div>

           <motion.div variants={itemVariants} className="bg-slate-900/50 backdrop-blur-xl border border-slate-800 rounded-3xl p-8 flex flex-col items-center text-center group hover:border-indigo-500/30 transition-colors">
              <div className="w-16 h-16 bg-indigo-500/10 text-indigo-400 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                 <Workflow size={32} />
              </div>
              <h3 className="text-4xl font-black text-white mb-2">45</h3>
              <p className="text-sm text-slate-400 font-medium">Farklı Tanı ve Analiz Aracı</p>
           </motion.div>

           <motion.div variants={itemVariants} className="bg-slate-900/50 backdrop-blur-xl border border-slate-800 rounded-3xl p-8 flex flex-col items-center text-center group hover:border-emerald-500/30 transition-colors">
              <div className="w-16 h-16 bg-emerald-500/10 text-emerald-400 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                 <Dna size={32} />
              </div>
              <h3 className="text-4xl font-black text-white mb-2">%100</h3>
              <p className="text-sm text-slate-400 font-medium">Bilimsel Kuramlara Dayalı</p>
           </motion.div>
        </motion.div>

        {/* 4 PILLARS (BÖLÜMLER) */}
        <div className="space-y-12">
           <div className="text-center max-w-3xl mx-auto space-y-4">
              <h2 className="text-3xl md:text-5xl font-black text-white">4 Boyutlu Analiz Mimarisi</h2>
              <p className="text-slate-400">Öğrenciyi sadece akademik verilerle değil, onu o yapan tüm psikolojik ve bilişsel yapıtaşlarıyla inceliyoruz.</p>
           </div>

           <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              
              {/* Pillar 1 */}
              <motion.div 
                initial={{ opacity: 0, x: -20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                className="bg-gradient-to-br from-slate-900/80 to-slate-900/40 backdrop-blur-xl border border-slate-800 rounded-3xl p-8 lg:p-10 relative overflow-hidden group"
              >
                  <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/10 blur-[50px] rounded-full pointer-events-none group-hover:bg-blue-500/20 transition-colors"></div>
                  <div className="flex items-start gap-6">
                      <div className="w-14 h-14 bg-blue-500/20 rounded-2xl flex items-center justify-center text-blue-400 shrink-0">
                         <Brain size={28} />
                      </div>
                      <div>
                         <h3 className="text-2xl font-bold text-white mb-3">Temel Analiz ve Tanı</h3>
                         <p className="text-slate-400 text-sm leading-relaxed mb-6">Öğrencinin zihinsel, akademik ve duygusal röntgenini çektiğimiz diagnostik araçlar. Hangi öğrenme stiline yatkın? Dikkat sürdürülebilirliği ne durumda? Aile ve kendilik algısı nerede eksik?</p>
                         <ul className="space-y-3">
                            <li className="flex items-center gap-3 text-sm text-slate-300">
                                <CheckCircle2 size={16} className="text-blue-400" /> Çoklu Zeka ve Öğrenme Stilleri Analizi
                            </li>
                            <li className="flex items-center gap-3 text-sm text-slate-300">
                                <CheckCircle2 size={16} className="text-blue-400" /> Odaklanma ve Dikkat Performans Ölçümü
                            </li>
                            <li className="flex items-center gap-3 text-sm text-slate-300">
                                <CheckCircle2 size={16} className="text-blue-400" /> Tutum ve Duygusal Zeka Envanteri
                            </li>
                         </ul>
                      </div>
                  </div>
              </motion.div>

              {/* Pillar 2 */}
              <motion.div 
                initial={{ opacity: 0, x: 20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                className="bg-gradient-to-br from-slate-900/80 to-slate-900/40 backdrop-blur-xl border border-slate-800 rounded-3xl p-8 lg:p-10 relative overflow-hidden group"
              >
                  <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/10 blur-[50px] rounded-full pointer-events-none group-hover:bg-emerald-500/20 transition-colors"></div>
                  <div className="flex items-start gap-6">
                      <div className="w-14 h-14 bg-emerald-500/20 rounded-2xl flex items-center justify-center text-emerald-400 shrink-0">
                         <Compass size={28} />
                      </div>
                      <div>
                         <h3 className="text-2xl font-bold text-white mb-3">Strateji ve Planlama</h3>
                         <p className="text-slate-400 text-sm leading-relaxed mb-6">Teşhis edilen sorunlara göre rota çizdiğimiz, alışkanlık inşa eden modüller. Anlık hazları nasıl erteleyebilir? Karar alırken hangi filtreleri kullanıyor?</p>
                         <ul className="space-y-3">
                            <li className="flex items-center gap-3 text-sm text-slate-300">
                                <CheckCircle2 size={16} className="text-emerald-400" /> Haz Erteleme ve Ödül Yönetimi
                            </li>
                            <li className="flex items-center gap-3 text-sm text-slate-300">
                                <CheckCircle2 size={16} className="text-emerald-400" /> Yaratıcı Planlama ve Karar Alma Modeli
                            </li>
                            <li className="flex items-center gap-3 text-sm text-slate-300">
                                <CheckCircle2 size={16} className="text-emerald-400" /> Hedef Yönetimi ve Alışkanlık Mimarisi
                            </li>
                         </ul>
                      </div>
                  </div>
              </motion.div>

              {/* Pillar 3 */}
              <motion.div 
                initial={{ opacity: 0, x: -20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                className="bg-gradient-to-br from-slate-900/80 to-slate-900/40 backdrop-blur-xl border border-slate-800 rounded-3xl p-8 lg:p-10 relative overflow-hidden group"
              >
                  <div className="absolute top-0 right-0 w-32 h-32 bg-rose-500/10 blur-[50px] rounded-full pointer-events-none group-hover:bg-rose-500/20 transition-colors"></div>
                  <div className="flex items-start gap-6">
                      <div className="w-14 h-14 bg-rose-500/20 rounded-2xl flex items-center justify-center text-rose-400 shrink-0">
                         <ShieldCheck size={28} />
                      </div>
                      <div>
                         <h3 className="text-2xl font-bold text-white mb-3">Psikoloji ve Zihinsel Dönüşüm</h3>
                         <p className="text-slate-400 text-sm leading-relaxed mb-6">Süreci sabote eden korku, kaygı ve negatif inançları temizleyen bilişsel ameliyatlar. "Yapamam" düşüncesi nasıl nötralize edilir?</p>
                         <ul className="space-y-3">
                            <li className="flex items-center gap-3 text-sm text-slate-300">
                                <CheckCircle2 size={16} className="text-rose-400" /> Bilişsel Çarpıtma ve Sabotaj Ölçümü
                            </li>
                            <li className="flex items-center gap-3 text-sm text-slate-300">
                                <CheckCircle2 size={16} className="text-rose-400" /> Sınav Stresi ve Performans Kaygısı Durumu
                            </li>
                            <li className="flex items-center gap-3 text-sm text-slate-300">
                                <CheckCircle2 size={16} className="text-rose-400" /> Zihinsel Yeniden Yapılandırma Modülleri
                            </li>
                         </ul>
                      </div>
                  </div>
              </motion.div>

              {/* Pillar 4 */}
              <motion.div 
                initial={{ opacity: 0, x: 20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                className="bg-gradient-to-br from-slate-900/80 to-slate-900/40 backdrop-blur-xl border border-slate-800 rounded-3xl p-8 lg:p-10 relative overflow-hidden group"
              >
                  <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/10 blur-[50px] rounded-full pointer-events-none group-hover:bg-indigo-500/20 transition-colors"></div>
                  <div className="flex items-start gap-6">
                      <div className="w-14 h-14 bg-indigo-500/20 rounded-2xl flex items-center justify-center text-indigo-400 shrink-0">
                         <LineChart size={28} />
                      </div>
                      <div>
                         <h3 className="text-2xl font-bold text-white mb-3">Performans ve Takip</h3>
                         <p className="text-slate-400 text-sm leading-relaxed mb-6">Masa başı çalışma verimini, sınav anı stratejisini ve sonuçları denetleyen eylem modülleri. Hatalar nasıl analiz edilir, kriz anı nasıl yönetilir?</p>
                         <ul className="space-y-3">
                            <li className="flex items-center gap-3 text-sm text-slate-300">
                                <CheckCircle2 size={16} className="text-indigo-400" /> Soru Çözme ve Tekrar Stratejileri Analizi
                            </li>
                            <li className="flex items-center gap-3 text-sm text-slate-300">
                                <CheckCircle2 size={16} className="text-indigo-400" /> Zirve Performans ve Kriz Yönetimi
                            </li>
                            <li className="flex items-center gap-3 text-sm text-slate-300">
                                <CheckCircle2 size={16} className="text-indigo-400" /> 360° Deneme ve Performans Karnesi
                            </li>
                         </ul>
                      </div>
                  </div>
              </motion.div>

           </div>
        </div>

        {/* SCIENTIFIC ROOTS */}
        <div className="bg-slate-900/50 backdrop-blur-xl border border-slate-800 rounded-[3rem] p-10 md:p-16 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-64 h-64 bg-slate-800/50 blur-[80px] rounded-full pointer-events-none"></div>
            
            <div className="text-center max-w-3xl mx-auto space-y-4 mb-16 relative z-10">
               <h2 className="text-3xl md:text-5xl font-black text-white">Bilimin Işığında İlerliyoruz</h2>
               <p className="text-slate-400">Analizlerimizin her biri dünya çapında kabul görmüş psikolojik ve pedagojik kuramların teknolojiyle entegre edilmiş halidir.</p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 relative z-10">
               
               <div className="space-y-4">
                  <div className="w-12 h-12 bg-white/5 border border-white/10 rounded-2xl flex items-center justify-center text-white">
                     <Lightbulb size={24} />
                  </div>
                  <h4 className="text-lg font-bold text-white">Bilişsel Davranışçı Terapi (BDT)</h4>
                  <p className="text-sm text-slate-400 leading-relaxed">Öğrencinin potansiyelini engelleyen "yapamam" düşüncelerini yıkar, gerçeğe dayalı pozitif inanç kodları inşa ederiz.</p>
               </div>

               <div className="space-y-4">
                  <div className="w-12 h-12 bg-white/5 border border-white/10 rounded-2xl flex items-center justify-center text-white">
                     <Sparkles size={24} />
                  </div>
                  <h4 className="text-lg font-bold text-white">Nöro-Linguistik Programlama (NLP)</h4>
                  <p className="text-sm text-slate-400 leading-relaxed">Zihinsel imgeleri dönüştürmek, odaklanmayı artırmak ve sınav anında doğru zihinsel çapaları kullanmak için NLP tekniklerini entegre ederiz.</p>
               </div>

               <div className="space-y-4">
                  <div className="w-12 h-12 bg-white/5 border border-white/10 rounded-2xl flex items-center justify-center text-white">
                     <Fingerprint size={24} />
                  </div>
                  <h4 className="text-lg font-bold text-white">Davranışçı Öğrenme Kuramları</h4>
                  <p className="text-sm text-slate-400 leading-relaxed">Haz erteleme, alışkanlık inşa etme ve çalışma rutini oluşturmada ödül-ceza ve otokontrol mekanizmalarını bilimsel şeklide yönetiriz.</p>
               </div>

               <div className="space-y-4">
                  <div className="w-12 h-12 bg-white/5 border border-white/10 rounded-2xl flex items-center justify-center text-white">
                     <Target size={24} />
                  </div>
                  <h4 className="text-lg font-bold text-white">Üstbilişsel (Metakognitif) İzleme</h4>
                  <p className="text-sm text-slate-400 leading-relaxed">Öğrencinin sadece ne öğrendiğini değil, "nasıl öğrendiğini" fark etmesini sağlar, otonom çalışma iradesi kazandırırız.</p>
               </div>

            </div>
        </div>

      </div>
    </div>
  );
}
