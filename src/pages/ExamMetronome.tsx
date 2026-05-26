import React from 'react';
import { motion } from 'motion/react';
import { 
  Clock, 
  Brain, 
  Volume2, 
  EyeOff, 
  Activity, 
  Timer, 
  Target,
  Waves,
  Zap,
  Play,
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

export default function ExamMetronome() {
  return (
    <div className="min-h-screen bg-[#0f172a] text-white pt-24 pb-20 relative overflow-hidden">
      {/* Background Effects */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
        <div className="absolute top-[-10%] left-[-5%] w-[400px] h-[400px] bg-indigo-600/20 blur-[120px] rounded-full"></div>
        <div className="absolute top-[40%] right-[-10%] w-[500px] h-[500px] bg-cyan-600/20 blur-[150px] rounded-full"></div>
        <div className="absolute bottom-[-10%] left-[20%] w-[600px] h-[600px] bg-blue-600/10 blur-[150px] rounded-full"></div>
      </div>

      <div className="max-w-7xl mx-auto px-6 relative z-10 space-y-32">
        
        {/* BÖLÜM 1: Çarpıcı Kahraman (Hero) Bölümü */}
        <div className="text-center max-w-4xl mx-auto space-y-8 mt-12">
          <motion.div 
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="inline-flex items-center gap-2 bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 px-5 py-2.5 rounded-full text-sm font-bold uppercase tracking-widest"
          >
            <Clock size={18} />
            <span>Sınav Zaman Asistanı</span>
          </motion.div>
          
          <motion.h1 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-5xl md:text-7xl font-black text-white tracking-tighter leading-tight"
          >
            Zamanla Savaşmayı Bırak, <br/>
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-blue-500 to-indigo-500">Ritmi Yakala.</span>
          </motion.h1>
          
          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="text-lg md:text-xl text-slate-400 leading-relaxed font-medium"
          >
            Saate bakma kaygısına son veren "Duyuşsal Zaman Yönetimi" sistemimiz ile sınavı yöneten değil, <strong>sınavın ritmini belirleyen</strong> sen ol.
          </motion.p>
        </div>

        {/* BÖLÜM 2: Problemin Tespiti (Neden Kaybediyoruz?) */}
        <motion.div 
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          className="relative max-w-5xl mx-auto"
        >
          <div className="absolute inset-0 bg-rose-500/5 blur-[100px] rounded-full"></div>
          <div className="bg-slate-900/80 backdrop-blur-2xl border border-rose-500/20 rounded-[3rem] p-10 md:p-16 text-center relative overflow-hidden">
             <div className="w-20 h-20 bg-rose-500/10 rounded-full flex items-center justify-center mx-auto mb-8">
                 <AlertCircle size={36} className="text-rose-400" />
             </div>
             <h2 className="text-3xl md:text-4xl font-black text-white mb-6">Neden Kaybediyoruz?</h2>
             <p className="text-xl text-slate-300 leading-relaxed max-w-3xl mx-auto font-light">
               Gerçek sınavda veya denemelerde en çok düştüğümüz tuzak bilgi eksikliği değildir; <strong className="text-white font-semibold">saate bakma paniği ve zamanı yetiştirememe</strong> hissidir. Her saate bakışınız odaklanmanızı böler, stresi körükler ve beyninizi "Acaba yetişecek mi?" sorusuyla meşgul eder. Dakikalar azaldıkça panik artar, okuduğunu anlama hızı düşer ve bir soruda takılıp kalma hastalığı başarınızı sinsice eritir.
             </p>
          </div>
        </motion.div>

        {/* BÖLÜM 3: Çözüm ve Felsefemiz (Duyuşsal Zaman Yönetimi Nedir?) */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
            <motion.div 
                initial={{ opacity: 0, x: -30 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                className="space-y-8"
            >
                <div className="inline-flex items-center gap-2 bg-blue-500/10 border border-blue-500/20 text-blue-400 px-4 py-2 rounded-full text-xs font-bold uppercase tracking-widest">
                    <Brain size={16} />
                    <span>Çözüm Felsefemiz</span>
                </div>
                <h2 className="text-4xl md:text-5xl font-black text-white leading-tight">Duyuşsal Zaman Yönetimi <span className="text-blue-400">Nedir?</span></h2>
                <div className="space-y-6 text-slate-300 text-lg leading-relaxed font-light">
                    <p>
                        Biz bu sorunu çözmek için dijital bir saatten çok daha fazlasını, bir <strong>"Sınav Simülatörü"</strong> geliştirdik. Sistemimiz "Duyuşsal Zaman Yönetimi" felsefesine dayanır.
                    </p>
                    <p>
                        Öğrenci ekrana, saate veya kol saatine bakmak zorunda kalmaz; <span className="text-white font-semibold">zamanı "duyar" ve ritmi içselleştirir.</span> Saat sesini bir stres unsurundan, başarının ritmine dönüştürüyoruz. Sen sadece sorulara odaklanıyorsun, zaman kontrolünü tamamen arka planda çalışan sistemimize bırakıyorsun.
                    </p>
                </div>
            </motion.div>

            <motion.div 
                initial={{ opacity: 0, x: 30 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                className="relative"
            >
                <div className="absolute inset-0 bg-blue-500/20 blur-[80px] rounded-full"></div>
                <div className="bg-slate-800/50 backdrop-blur-xl border border-slate-700/50 rounded-3xl p-8 relative">
                    <div className="aspect-square rounded-full border-[12px] border-slate-900 shadow-inner flex items-center justify-center relative overflow-hidden bg-slate-900/80">
                        {/* Radar sweep effect */}
                        <div className="absolute inset-0 border-4 border-blue-500/20 rounded-full animate-[spin_4s_linear_infinite] border-t-blue-500"></div>
                        <div className="absolute inset-4 border border-slate-700 rounded-full"></div>
                        <div className="absolute inset-12 border border-slate-700/50 rounded-full"></div>
                        <div className="absolute inset-20 border border-slate-800 rounded-full"></div>
                        
                        <div className="text-center z-10">
                            <span className="block text-blue-400 font-medium mb-2 tracking-widest text-sm">TYT TÜRKÇE</span>
                            <span className="block text-6xl font-black text-white tracking-tighter">40:00</span>
                            <span className="block text-slate-500 mt-2 text-sm">Hedeflenen Süre</span>
                        </div>
                    </div>
                </div>
            </motion.div>
        </div>

        {/* BÖLÜM 4: Sistemin Temel Özellikleri (Nasıl Çalışır?) */}
        <div className="space-y-16">
            <div className="text-center max-w-3xl mx-auto space-y-4">
               <h2 className="text-3xl md:text-5xl font-black text-white">Nasıl Çalışır?</h2>
               <p className="text-slate-400 text-lg">Zihninizi sınavın devasa boyutundan kurtaran, sizi an'a odaklayan özellikler.</p>
            </div>

            <motion.div 
                variants={containerVariants}
                initial="hidden"
                whileInView="show"
                viewport={{ once: true }}
                className="grid grid-cols-1 md:grid-cols-2 gap-8"
            >
                {/* Özellik 1 */}
                <motion.div variants={itemVariants} className="bg-gradient-to-br from-slate-900/80 to-slate-900/40 backdrop-blur-xl border border-slate-800 hover:border-cyan-500/30 transition-colors rounded-3xl p-8 lg:p-10 group relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-cyan-500/10 blur-[40px] rounded-full group-hover:bg-cyan-500/20 transition-colors"></div>
                    <div className="w-14 h-14 bg-cyan-500/10 text-cyan-400 rounded-2xl flex items-center justify-center mb-6">
                        <Activity size={28} />
                    </div>
                    <h3 className="text-2xl font-bold text-white mb-4">Soru Ritmi <span className="text-cyan-400 text-sm font-medium ml-2 px-2 py-1 rounded bg-cyan-500/10">(Mikro Ritim)</span></h3>
                    <p className="text-slate-400 leading-relaxed font-light">
                        Sistem, sınav türüne göre ideal soru çözme süresini hesaplar ve arka planda hafif bir metronom gibi çalışır. Her "tık" veya "bip" sesi bilinçaltınıza <strong className="text-slate-200 font-medium">"yeni soruya geçme vaktin geldi"</strong> mesajı gönderir. Bir soruda takılı kalma hastalığını tedavi eder ve kas hafızasıyla soru çözme ritmi kazandırır.
                    </p>
                </motion.div>

                {/* Özellik 2 */}
                <motion.div variants={itemVariants} className="bg-gradient-to-br from-slate-900/80 to-slate-900/40 backdrop-blur-xl border border-slate-800 hover:border-emerald-500/30 transition-colors rounded-3xl p-8 lg:p-10 group relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/10 blur-[40px] rounded-full group-hover:bg-emerald-500/20 transition-colors"></div>
                    <div className="w-14 h-14 bg-emerald-500/10 text-emerald-400 rounded-2xl flex items-center justify-center mb-6">
                        <Timer size={28} />
                    </div>
                    <h3 className="text-2xl font-bold text-white mb-4">20 Dakikalık Bloklar <span className="text-emerald-400 text-sm font-medium ml-2 px-2 py-1 rounded bg-emerald-500/10">(Makro Ritim)</span></h3>
                    <p className="text-slate-400 leading-relaxed font-light">
                        165 dakikalık devasa sınav süresi beyni yorar. Psikolojideki "Chunking" (parçalara bölme) tekniğiyle sistem her 20 dakikada yumuşak bir "çan/ding" sesi verir. Öğrenci, <strong className="text-slate-200 font-medium">"İlk 20 dakika bitti, şu an testin neresindeyim?"</strong> diyerek saate bakmadan genel stratejisini gözden geçirir.
                    </p>
                </motion.div>

                {/* Özellik 3 */}
                <motion.div variants={itemVariants} className="bg-gradient-to-br from-slate-900/80 to-slate-900/40 backdrop-blur-xl border border-slate-800 hover:border-indigo-500/30 transition-colors rounded-3xl p-8 lg:p-10 group relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/10 blur-[40px] rounded-full group-hover:bg-indigo-500/20 transition-colors"></div>
                    <div className="w-14 h-14 bg-indigo-500/10 text-indigo-400 rounded-2xl flex items-center justify-center mb-6">
                        <EyeOff size={28} />
                    </div>
                    <h3 className="text-2xl font-bold text-white mb-4">Tam Odak Modu</h3>
                    <p className="text-slate-400 leading-relaxed font-light">
                        Sınav başladığında ekrandaki tüm dikkat dağıtıcı unsurlar silinir. Geriye sadece gerçek sınav saatiyle (Örn: 10:15 - 13:00) senkronize ilerleyen dev bir saat ve ilerleme barı kalır. Zihin tamamen masadaki sınava kilitlenir.
                    </p>
                </motion.div>

                {/* Özellik 4 */}
                <motion.div variants={itemVariants} className="bg-gradient-to-br from-slate-900/80 to-slate-900/40 backdrop-blur-xl border border-slate-800 hover:border-amber-500/30 transition-colors rounded-3xl p-8 lg:p-10 group relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-amber-500/10 blur-[40px] rounded-full group-hover:bg-amber-500/20 transition-colors"></div>
                    <div className="w-14 h-14 bg-amber-500/10 text-amber-400 rounded-2xl flex items-center justify-center mb-6">
                        <Volume2 size={28} />
                    </div>
                    <h3 className="text-2xl font-bold text-white mb-4">Çevresel Uyum</h3>
                    <p className="text-slate-400 leading-relaxed font-light">
                        Sistem, içindeki zengin ses arşiviyle her ortama adapte olur. Evdeki sessiz odanız için yumuşak bir <strong className="text-slate-200 font-medium">"tok bir tık"</strong> veya kalabalık kütüphane simülasyonları için daha belirgin, delici <strong className="text-slate-200 font-medium">"bip"</strong> sesleri seçebilirsiniz.
                    </p>
                </motion.div>
            </motion.div>
        </div>

        {/* BÖLÜM 5: Psikolojik Etkiler ve Kazanımlar */}
        <div className="bg-gradient-to-b from-indigo-900/40 to-slate-900/80 backdrop-blur-2xl border border-indigo-500/20 rounded-[3rem] p-10 md:p-16 relative overflow-hidden mt-16">
            <div className="absolute top-0 right-0 w-full h-1 bg-gradient-to-r from-transparent via-indigo-500 to-transparent opacity-50"></div>
            
            <div className="text-center max-w-3xl mx-auto space-y-6 mb-16">
               <h2 className="text-3xl md:text-5xl font-black text-white">Performansınıza Psikolojik Etkileri</h2>
               <p className="text-indigo-200/80 text-lg font-light">Sadece zamanı değil, zihninizi de yönetirsiniz. Sınav Metronomu ile kazancınız dakikalar değil, dingin bir akıl olacak.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
               <div className="space-y-4 text-center md:text-left">
                  <div className="mx-auto md:mx-0 w-12 h-12 bg-white/5 border border-white/10 rounded-2xl flex items-center justify-center text-white">
                     <Target size={24} />
                  </div>
                  <h4 className="text-lg font-bold text-white">Kırılmaz Odaklanma</h4>
                  <p className="text-sm text-indigo-200/70 leading-relaxed font-light">Gözleriniz sadece kağıtta kalır. Saate bakmak için başınızı kaldırmadığınız için "akış (flow)" hali bozulmaz.</p>
               </div>

               <div className="space-y-4 text-center md:text-left">
                  <div className="mx-auto md:mx-0 w-12 h-12 bg-white/5 border border-white/10 rounded-2xl flex items-center justify-center text-white">
                     <Waves size={24} />
                  </div>
                  <h4 className="text-lg font-bold text-white">Sabit Soru Ritmi</h4>
                  <p className="text-sm text-indigo-200/70 leading-relaxed font-light">Öğrendiğiniz tempoyla sorular arasında sörf yapar, zor bir soruya takılıp kalsanız bile metronomun uyarısıyla inatlaşmadan geçersiniz.</p>
               </div>

               <div className="space-y-4 text-center md:text-left">
                  <div className="mx-auto md:mx-0 w-12 h-12 bg-white/5 border border-white/10 rounded-2xl flex items-center justify-center text-white">
                     <Brain size={24} />
                  </div>
                  <h4 className="text-lg font-bold text-white">Stres Eliminasyonu</h4>
                  <p className="text-sm text-indigo-200/70 leading-relaxed font-light">"Yetişmeyecek" korkusuyla gelen kalp çarpıntısı biter. Çünkü bilirsiniz ki zamanın kontrolü sizde değil, arka planda güvenle işleyen sistemdedir.</p>
               </div>

               <div className="space-y-4 text-center md:text-left">
                  <div className="mx-auto md:mx-0 w-12 h-12 bg-white/5 border border-white/10 rounded-2xl flex items-center justify-center text-white">
                     <Zap size={24} />
                  </div>
                  <h4 className="text-lg font-bold text-white">Üstbilişsel Kontrol</h4>
                  <p className="text-sm text-indigo-200/70 leading-relaxed font-light">20 dakikalık makro bloklar sayesinde, paniğe kapılmadan tüm sınav stratejinizi sessizce gözden geçirir, mantıklı manevralar yaparsınız.</p>
               </div>
            </div>

            <div className="mt-16 flex justify-center">
                <Link to="/kayit/ogrenci" className="inline-flex items-center justify-center gap-3 bg-white text-slate-900 px-8 py-4 rounded-2xl font-black text-lg hover:bg-indigo-50 transition-all hover:scale-105 shadow-xl shadow-white/10">
                    <Play fill="currentColor" size={20} /> Metronomu Başlat
                </Link>
            </div>
        </div>

      </div>
    </div>
  );
}

const AlertCircleIcon = ({ size, className }: { size?: number, className?: string }) => (
    <svg xmlns="http://www.w3.org/2000/svg" width={size || 24} height={size || 24} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
        <circle cx="12" cy="12" r="10"/>
        <line x1="12" x2="12" y1="8" y2="12"/>
        <line x1="12" x2="12.01" y1="16" y2="16"/>
    </svg>
);
