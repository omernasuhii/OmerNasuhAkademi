import { Check, Shield, Diamond, Medal } from 'lucide-react';
import { motion } from 'motion/react';
import { useNavigate } from 'react-router-dom';
import GoldenStrip from './GoldenStrip';

export default function Pricing() {
  const navigate = useNavigate();
  const plans = [
    {
      name: "Akademik Kıvılcım (Bronz Paket)",
      image: "https://drive.google.com/thumbnail?id=11GU6GF_X4FCgsiD3bY51VuLPhyuDHDab&sz=q80&w500",
      badgeText: "En Uygun Fiyat",
      badgeBg: "bg-orange-600/90 text-white",
      borderColor: "border-orange-500/40",
      shadowColor: "shadow-orange-500/10",
      stripColor: "from-orange-400 to-orange-600",
      buttonClass: "bg-orange-600/20 hover:bg-orange-600 border border-orange-500/50 text-orange-100 hover:text-white shadow-orange-500/20",
      iconColor: "text-orange-400",
      features: [
        "Haftalık Ders Çalışma Programı",
        "Haftalık Soru Takibi",
        "Haftalık Kitap Takibi",
        "Haftalık Konu Takibi",
        "Aylık Konu Hedefi ve Takibi",
        "Aylık Kitap Bitirme Programı",
        "Temel Deneme Takibi",
        "Veli Bilgilendirme Sistemi (aylık rapor)"
      ]
    },
    {
      name: "Akademik Momentum (Gümüş Paket)",
      image: "https://drive.google.com/thumbnail?id=1JNToCLAubXGCaCG0aVDVrnAWfeqveb6L&sz=q80&w500",
      badgeText: "En Çok Tercih Edilen",
      badgeBg: "bg-slate-300 text-slate-900 border-b border-slate-400",
      borderColor: "border-slate-300/40",
      shadowColor: "shadow-slate-300/20",
      stripColor: "from-slate-200 to-slate-400",
      buttonClass: "bg-slate-200 hover:bg-white text-slate-900 shadow-slate-300/30",
      iconColor: "text-slate-300",
      features: [
        "Haftalık Ders Çalışma Programı",
        "Haftalık Soru Takibi",
        "Haftalık Kitap Takibi",
        "Haftalık Konu Takibi",
        "Aylık Konu Hedefi ve Takibi",
        "Aylık Kitap Bitirme Programı",
        "Temel ve Kurumsal Deneme Takibi",
        "Veli Bilgilendirme Sistemi (Haftalık + Aylık rapor)",
        "Ayrıntılı Deneme Analizi",
        "Öğrenci Analizleri (10 Farklı Kişilik Analizi)",
        "Zaman Yönetim Asistanları (2 Adet)",
        "Destekleyici Online Programlar (9 Adet)"
      ]
    },
    {
      name: "Sınırsız Zirve VIP (Altın Paket)",
      image: "https://drive.google.com/thumbnail?id=1cnmbj2QLHjOBFNO2qjr7ASLEXzMTocrX&sz=q80&w500",
      badgeText: "En Kapsamlı",
      badgeBg: "bg-yellow-500 text-yellow-950",
      borderColor: "border-yellow-400/50",
      shadowColor: "shadow-yellow-500/20",
      stripColor: "from-yellow-300 to-amber-500",
      buttonClass: "bg-yellow-500/20 hover:bg-yellow-500 border border-yellow-400/50 text-yellow-100 hover:text-yellow-950 shadow-yellow-500/20",
      iconColor: "text-yellow-400",
      features: [
        "Haftalık Ders Çalışma Programı",
        "Haftalık Soru Takibi",
        "Haftalık Kitap Takibi",
        "Haftalık Konu Takibi",
        "Aylık Konu Hedefi ve Takibi",
        "Aylık Kitap Bitirme Programı",
        "Temel ve Kurumsal Deneme Takibi",
        "Veli Bilgilendirme Sistemi (Haftalık + Aylık rapor)",
        "Kurumsal ve Ayrıntılı Deneme Analizi",
        "Öğrenci Analizleri (45 Farklı Kişilik Analizi)",
        "Zaman Yönetim Asistanları (3 Adet)",
        "Destekleyici Online Programlar (18 Adet)",
        "Otomatik Hata Telafi Testi",
        "Veliler için Kapsamlı Bilgilendirme Raporları",
        "Öğrenci ve Veliler için Yapay Zekâ Asistan",
        "140 Soruluk Yapay Zekâ Soru Çözümü"
      ]
    }
  ];

  return (
    <section>
      <GoldenStrip>
        <div className="max-w-7xl mx-auto px-2 md:px-6 flex flex-row justify-center items-center divide-x divide-yellow-500/20 gap-0 w-full">
          <div className="flex flex-col md:flex-row items-center justify-center gap-1.5 md:gap-3 flex-1 w-full text-center">
            <Diamond className="text-yellow-400 w-5 h-5 md:w-7 md:h-7" />
            <span className="font-medium text-[10px] sm:text-xs md:text-sm text-yellow-100/90 uppercase tracking-wider">Değer</span>
          </div>
          <div className="flex flex-col md:flex-row items-center justify-center gap-1.5 md:gap-3 flex-1 w-full text-center">
            <Shield className="text-yellow-400 w-5 h-5 md:w-7 md:h-7" />
            <span className="font-medium text-[10px] sm:text-xs md:text-sm text-yellow-100/90 uppercase tracking-wider">Güven</span>
          </div>
          <div className="flex flex-col md:flex-row items-center justify-center gap-1.5 md:gap-3 flex-1 w-full text-center">
            <Medal className="text-yellow-400 w-5 h-5 md:w-7 md:h-7" />
            <span className="font-medium text-[10px] sm:text-xs md:text-sm text-yellow-100/90 uppercase tracking-wider">Kalite</span>
          </div>
        </div>
      </GoldenStrip>

      <div className="py-12 md:py-24 px-4 md:px-6 relative">
        <div className="absolute inset-0 bg-indigo-600/10 blur-[150px] z-0 rounded-full w-[60%] h-[70%] right-[-20%] bottom-[-10%] pointer-events-none"></div>
      
      <div className="max-w-7xl mx-auto relative z-10">
        <div className="text-center mb-10 md:mb-16">
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-yellow-500/10 border border-yellow-500/20 rounded-full mb-3 md:mb-4">
            <span className="text-[9px] md:text-[10px] font-bold text-yellow-400 uppercase tracking-widest">Planlar</span>
          </div>
          <h2 className="text-2xl md:text-5xl font-extrabold mb-3 md:mb-6 tracking-tight">Aboneliklerimiz</h2>
          <p className="text-slate-400 mb-8 md:mb-10 text-sm md:text-lg max-w-2xl mx-auto">
            Eğitimden kişisel gelişime, teknolojiden sosyal aktivitelere kadar geniş yelpazede hizmet sunuyoruz
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-8 items-stretch">
          {plans.map((plan, idx) => (
            <motion.div 
              key={idx}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: idx * 0.1 }}
              className={`bg-slate-900/40 backdrop-blur-xl rounded-[24px] md:rounded-[32px] overflow-hidden border shadow-2xl relative z-10 flex flex-col h-full ${plan.borderColor} ${plan.shadowColor}`}
            >
              {/* Thin Stripe */}
              <div className={`absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r ${plan.stripColor}`}></div>

              {/* Badges */}
              {plan.badgeText && (
                <div className={`${plan.badgeBg} text-center py-1.5 md:py-2 px-4 text-[9px] md:text-[10px] font-extrabold uppercase tracking-widest shadow-lg mx-auto w-full backdrop-blur-md`}>
                  {plan.badgeText}
                </div>
              )}
              
              <div className="p-6 md:p-8 pb-0 pt-6 md:pt-8">
                <div className="w-full h-40 md:h-48 mb-6 overflow-hidden rounded-2xl border border-white/10 relative group shadow-2xl">
                  <div className="absolute inset-0 bg-slate-900/20 group-hover:bg-transparent transition-colors z-10 duration-500"></div>
                  <img src={plan.image} alt={plan.name} className="w-full h-full object-cover transform group-hover:scale-105 transition-transform duration-700" />
                </div>

                <h3 className="text-center font-bold text-xl md:text-2xl tracking-tight mb-2 flex flex-col items-center">
                  {(() => {
                    const match = plan.name.match(/^(.*?)\s*(\(.*?\))$/);
                    if (match) {
                      return (
                        <>
                          <span>{match[1]}</span>
                          <span className="block text-sm md:text-base opacity-85 font-semibold text-slate-300 mt-1">{match[2]}</span>
                        </>
                      );
                    }
                    return plan.name;
                  })()}
                </h3>
                <div className="text-center mb-6 text-sm text-slate-400 font-medium tracking-wide">
                  4 hafta için geçerli
                </div>
                
                <button 
                  onClick={() => navigate('/panel/ogrenci/abonelik')}
                  className={`w-full font-bold text-sm md:text-base py-3 md:py-4 rounded-xl transition-all shadow-lg mb-6 md:mb-8 ${plan.buttonClass}`}
                >
                  Seç
                </button>
              </div>
              
              <div className="p-6 md:p-8 pt-0 flex-1">
                <ul className="space-y-3 md:space-y-4">
                  {plan.features.map((feature, fIdx) => {
                    const isBronzeWrap = feature === "Bronz paket içeriklerinin tamamı";
                    const isSilverWrap = feature === "Gümüş paket içeriklerinin tamamı";
                    const isWrapItem = isBronzeWrap || isSilverWrap;

                    return (
                      <li key={fIdx} className={
                        isBronzeWrap ? "flex items-center gap-3 text-sm bg-gradient-to-r from-orange-600/20 to-orange-500/10 border border-orange-500/30 p-3 rounded-xl mb-6 shadow-inner shadow-orange-500/10" :
                        isSilverWrap ? "flex items-center gap-3 text-sm bg-gradient-to-r from-slate-300/20 to-slate-400/10 border border-slate-300/30 p-3 rounded-xl mb-6 shadow-inner shadow-slate-300/10" :
                        "flex items-start gap-4 text-sm"
                      }>
                        <div className={
                          isBronzeWrap ? "p-1.5 rounded-full shrink-0 border bg-orange-500/20 border-orange-500/40 text-orange-400" :
                          isSilverWrap ? "p-1.5 rounded-full shrink-0 border bg-slate-300/20 border-slate-400/40 text-slate-300" :
                          `p-1 rounded-full shrink-0 mt-0.5 border bg-white/5 border-white/10 ${plan.iconColor}`
                        }>
                          <Check size={isWrapItem ? 16 : 14} strokeWidth={isWrapItem ? 4 : 3} />
                        </div>
                        <span className={
                          isBronzeWrap ? "text-orange-200 font-bold uppercase tracking-wide text-xs" :
                          isSilverWrap ? "text-slate-200 font-bold uppercase tracking-wide text-xs" :
                          "text-slate-300 leading-snug"
                        }>
                          {feature}
                          {isWrapItem && <span className="block text-[10px] opacity-70 font-medium normal-case tracking-normal mt-0.5">+ Tüm Ek Ayrıcalıklar</span>}
                        </span>
                      </li>
                    );
                  })}
                </ul>
              </div>
            </motion.div>
          ))}
        </div>
        
        <div className="text-center mt-16 text-sm">
          <a href="#" className="font-semibold text-slate-500 hover:text-white transition-colors underline decoration-slate-700 underline-offset-4">Şartlar ve Koşullar</a>
        </div>
      </div>
      </div>
    </section>
  );
}
