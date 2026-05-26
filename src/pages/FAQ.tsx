import { useState } from 'react';
import { HelpCircle, ChevronDown, MessageCircle, Phone, Mail, Sparkles } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

const faqs = [
  {
    question: "FocusON Akademi tam olarak ne yapar?",
    answer: "FocusON Akademi, özellikle YKS hazırlık sürecindeki öğrencilere yönelik profesyonel eğitim koçluğu, kişiselleştirilmiş ders çalışma programları ve psikolojik danışmanlık hizmeti sunan dijital bir eğitim platformudur."
  },
  {
    question: "Eğitim koçluğu süreci nasıl işler?",
    answer: "Öğrencimiz platforma katıldıktan sonra uzman bir koç ile eşleştirilir. Haftalık görüntülü görüşmeler yapılır, öğrencinin seviyesine uygun günlük programlar hazırlanır ve deneme sınavı analizleri üzerinden gelişim takibi yapılır."
  },
  {
    question: "Hangi sınıflara hizmet veriyorsunuz?",
    answer: "Ağırlıklı olarak 11. ve 12. sınıf öğrencileri ile lise mezunu (mezun grubu) öğrencilere hizmet veriyoruz. Ancak LGS hazırlık ve ara sınıflar için de özel rehberlik programlarımız mevcuttur."
  },
  {
    question: "Ücretlendirme ve üyelik paketleri nelerdir?",
    answer: "Farklı ihtiyaçlara yönelik Standart, Premium ve VIP paketlerimiz bulunmaktadır. Güncel fiyat ve detaylar için 'Paketler' sayfamızı inceleyebilir veya bizimle iletişime geçebilirsiniz."
  },
  {
    question: "YKS puan hesaplama aracınız ne kadar güncel?",
    answer: "Puan hesaplama aracımız, ÖSYM'nin en son yayınladığı katsayılar ve veriler ışığında her yıl güncellenmektedir. En doğruya yakın sonuçları vermeyi hedefler."
  },
  {
    question: "Koçumu beğenmezsem değiştirebilir miyim?",
    answer: "Elbette. Öğrenci-koç uyumuna çok önem veriyoruz. Herhangi bir aşamada kan uyuşmazlığı hissederseniz, yönetim birimimize başvurarak koç değişikliği talep edebilirsiniz."
  }
];

function FAQItem({ question, answer, isOpen, onClick, index }: { question: string, answer: string, isOpen: boolean, onClick: () => void, index: number, key?: any }) {
  return (
    <motion.div 
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05 }}
      className="mb-4"
    >
      <button
        onClick={onClick}
        className={`w-full flex items-center justify-between p-6 rounded-2xl text-left transition-all duration-300 border ${
          isOpen 
            ? 'bg-blue-600/10 border-blue-500/30 text-white shadow-lg shadow-blue-500/5' 
            : 'bg-slate-900/40 border-white/5 text-slate-300 hover:bg-slate-900/60 hover:border-white/10'
        }`}
      >
        <span className="text-lg font-semibold pr-8">{question}</span>
        <ChevronDown 
          className={`shrink-0 transition-transform duration-300 ${isOpen ? 'rotate-180 text-blue-400' : 'text-slate-500'}`} 
          size={20} 
        />
      </button>
      
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3, ease: 'easeInOut' }}
            className="overflow-hidden"
          >
            <div className="p-6 text-slate-400 leading-relaxed bg-slate-900/20 rounded-b-2xl border-x border-b border-white/5 -mt-px">
              {answer}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

export default function FAQ() {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  return (
    <div className="min-h-screen bg-slate-950 pb-20">
      {/* Header */}
      <section className="relative py-24 overflow-hidden border-b border-white/5">
        <div className="absolute inset-0">
          <div className="absolute top-0 left-1/4 w-96 h-96 bg-blue-500/10 blur-[120px] rounded-full"></div>
          <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-purple-500/10 blur-[120px] rounded-full"></div>
        </div>

        <div className="container mx-auto px-4 relative z-10 text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-blue-500/10 border border-blue-500/20 rounded-full text-blue-400 text-sm font-semibold tracking-wide mb-6 uppercase">
              <HelpCircle size={16} />
              Yardım Merkezi
            </div>
            <h1 className="text-4xl md:text-6xl font-extrabold text-white mb-6">
              Sıkça Sorulan <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-300">
                Sorular
              </span>
            </h1>
            <p className="text-slate-400 text-lg max-w-2xl mx-auto leading-relaxed">
              Merak ettiğiniz tüm konuları burada topladık. Aradığınız cevabı bulamazsanız 
              bizimle iletişime geçmekten çekinmeyin.
            </p>
          </motion.div>
        </div>
      </section>

      {/* Accordion Section */}
      <section className="py-20">
        <div className="container mx-auto px-4 max-w-3xl">
          <div className="space-y-4">
            {faqs.map((faq, idx) => (
              <FAQItem
                key={idx}
                index={idx}
                question={faq.question}
                answer={faq.answer}
                isOpen={openIndex === idx}
                onClick={() => setOpenIndex(openIndex === idx ? null : idx)}
              />
            ))}
          </div>

          {/* Contact Support CTA */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            className="mt-16 p-10 bg-gradient-to-br from-slate-900 to-slate-950 border border-white/10 rounded-[2.5rem] relative overflow-hidden group"
          >
            <div className="absolute top-0 right-0 p-8 opacity-5">
               <Sparkles size={120} />
            </div>
            <div className="relative z-10 grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
              <div>
                <h3 className="text-2xl font-bold text-white mb-4 italic">Hala sorunuz mu var?</h3>
                <p className="text-slate-400 text-sm leading-relaxed mb-6">
                  Ekibimiz size yardımcı olmak için burada. Haftanın 7 günü canlı destek hattımızdan bize ulaşabilirsiniz.
                </p>
                <button className="flex items-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-xl transition-all group/btn">
                  <MessageCircle size={18} className="group-hover/btn:rotate-12 transition-transform" />
                  Canlı Destek
                </button>
              </div>
              <div className="grid grid-cols-1 gap-4">
                <a href="tel:+905000000000" className="flex items-center gap-4 p-4 bg-slate-800/50 rounded-2xl border border-white/5 hover:border-white/10 transition-all">
                  <div className="w-10 h-10 bg-emerald-500/20 rounded-lg flex items-center justify-center text-emerald-400">
                    <Phone size={18} />
                  </div>
                  <div className="text-left">
                    <div className="text-xs text-slate-500 uppercase font-bold tracking-widest">Bizi Arayın</div>
                    <div className="text-white font-bold tracking-tight">0500 000 00 00</div>
                  </div>
                </a>
                <a href="mailto:destek@focuson.com" className="flex items-center gap-4 p-4 bg-slate-800/50 rounded-2xl border border-white/5 hover:border-white/10 transition-all">
                  <div className="w-10 h-10 bg-indigo-500/20 rounded-lg flex items-center justify-center text-indigo-400">
                    <Mail size={18} />
                  </div>
                  <div className="text-left">
                    <div className="text-xs text-slate-500 uppercase font-bold tracking-widest">E-posta Gönderin</div>
                    <div className="text-white font-bold tracking-tight">destek@focuson.com</div>
                  </div>
                </a>
              </div>
            </div>
          </motion.div>
        </div>
      </section>
    </div>
  );
}
