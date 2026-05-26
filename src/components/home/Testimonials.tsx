import { Quote, BarChart2, CheckCircle, TrendingUp } from 'lucide-react';
import { motion } from 'motion/react';
import GoldenStrip from './GoldenStrip';

export default function Testimonials() {
  const testimonials = [
    {
      text: "Haftalık çalışma programı ve deneme analizleriyle düzenli çalışmayı öğrendim, artık ne yapacağımı tam olarak biliyorum.",
      author: "Boğaziçi Üniversitesi Elektrik-Elektronik Müh.",
    },
    {
      text: "Soru ve konu takibi sayesinde eksiklerimi net bir şekilde gördüm, artık her denemede daha da güçleniyorum.",
      author: "İTÜ Endüstri Mühendisliği",
    },
    {
      text: "Aylık hedef planı ve rehberlik desteğiyle motivasyonumu hiç kaybetmeden sınava hazırlandım.",
      author: "Hacettepe Üniversitesi Tıp Fakültesi",
    },
    {
      text: "Deneme analizleri ve haftalık raporlar sayesinde çocuğumun ilerlemesini adım adım takip edebiliyorum.",
      author: "Fatih Ö. 'nün Velisi",
    },
    {
      text: "Günlük yaşam planı ve psikolojik destek sayesinde hem akademik hem mental olarak daha dengeli hissediyorum.",
      author: "Ankara Üniversitesi Hukuk Fakültesi",
    },
    {
      text: "Kitap ve deneme takip sistemiyle düzenli ilerlemek kolaylaştı, her hafta gelişimimi somut olarak görüyorum.",
      author: "Galatasaray Üniversitesi Uluslararası İlişkiler",
    },
    {
      text: "Mesleki rehberlik seminerleriyle hangi bölümü istediğimi gerçekten fark ettim, artık hedefim çok net.",
      author: "Marmara Üniversitesi İşletme (İngilizce)",
    },
    {
      text: "Rehberlik görüşmeleri ve aylık hedef planları sayesinde kızım artık ne istediğini çok iyi biliyor.",
      author: "Melisa K. 'nın Velisi",
    },
    {
      text: "Haftalık konu ve kitap takibiyle disiplin kazandım, zamanı verimli kullanmayı öğrendim.",
      author: "İstanbul Üniversitesi Psikoloji",
    },
    {
      text: "Veli bilgilendirme sistemi sayesinde ailem de sürecin içinde, bu destek beni her gün motive ediyor.",
      author: "Ege Üniversitesi Radyo, Tel. ve Sinema",
    },
    {
      text: "Öğrenciler için yapılan seminerlerde hem moral buldum hem de doğru çalışma yöntemlerini öğrendim.",
      author: "Anadolu Üniversitesi Türk Dili ve Edebiyatı",
    },
    {
      text: "Veli bilgilendirme sistemi ve psikolojik danışma desteğiyle süreci birlikte, güvenle yürütüyoruz.",
      author: "Buse D. 'nin Velisi",
    }
  ];

  return (
    <section className="relative">
      <div className="py-10 md:py-20 px-4 md:px-12 max-w-7xl mx-auto text-center">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="mb-10 md:mb-16"
        >
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-indigo-500/10 border border-indigo-500/20 rounded-full mb-3 md:mb-4">
            <span className="text-[9px] md:text-[10px] font-bold text-indigo-400 uppercase tracking-widest">Öğrenci Yorumları</span>
          </div>
          <h2 className="text-2xl md:text-5xl font-extrabold tracking-tight mb-3 md:mb-4">REFERANSLARIMIZ</h2>
          <p className="text-slate-400 max-w-2xl mx-auto text-sm md:text-lg">
            Sürecin başından sonuna kadar her alanda öğrencilerimizin yanındayız.
            Öğrencilerimizin başarısı bizim referansımızdır.
          </p>
        </motion.div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-6">
          {testimonials.map((test, idx) => (
            <motion.div 
              key={idx}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: (idx % 4) * 0.1 }}
              className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-[16px] md:rounded-[32px] p-3 sm:p-4 md:p-6 text-left flex flex-col relative shadow-xl hover:bg-white/10 transition-colors"
            >
              <Quote className="text-blue-500/40 mb-2 md:mb-4 w-5 h-5 sm:w-7 sm:h-7 md:w-9 md:h-9 mx-auto md:mx-0" />
              <p className="text-[10px] sm:text-xs md:text-sm font-medium mb-3 md:mb-6 leading-relaxed flex-grow text-slate-300 text-center md:text-left">
                "{test.text}"
              </p>
              <div className="mt-auto text-center md:text-left">
                <p className="text-blue-400 font-bold text-[9px] sm:text-xs md:text-sm tracking-wide">{test.author}</p>
              </div>
            </motion.div>
          ))}
        </div>
      </div>

      <GoldenStrip>
        <div className="max-w-7xl mx-auto px-2 md:px-6 flex flex-row justify-center items-center divide-x divide-yellow-500/20 gap-0 w-full">
          <div className="flex flex-col md:flex-row items-center justify-center gap-1.5 md:gap-3 flex-1 w-full text-center">
            <BarChart2 className="text-yellow-400 w-5 h-5 md:w-7 md:h-7" />
            <span className="font-medium text-[10px] sm:text-xs md:text-sm text-yellow-100/90 uppercase tracking-wider">Planlı İlerleme</span>
          </div>
          <div className="flex flex-col md:flex-row items-center justify-center gap-1.5 md:gap-3 flex-1 w-full text-center">
            <CheckCircle className="text-yellow-400 w-5 h-5 md:w-7 md:h-7" />
            <span className="font-medium text-[10px] sm:text-xs md:text-sm text-yellow-100/90 uppercase tracking-wider">Sıkı Takip</span>
          </div>
          <div className="flex flex-col md:flex-row items-center justify-center gap-1.5 md:gap-3 flex-1 w-full text-center">
            <TrendingUp className="text-yellow-400 w-5 h-5 md:w-7 md:h-7" />
            <span className="font-medium text-[10px] sm:text-xs md:text-sm text-yellow-100/90 uppercase tracking-wider">Net Sonuçlar</span>
          </div>
        </div>
      </GoldenStrip>
    </section>
  );
}
