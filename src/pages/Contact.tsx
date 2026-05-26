import { Mail, Phone, MapPin, Send, MessageSquare, Clock, Globe } from 'lucide-react';
import { motion } from 'motion/react';

export default function Contact() {
  const contactInfo = [
    {
      icon: <Phone className="text-blue-400" />,
      title: "Telefon",
      details: ["0500 000 00 00", "0500 000 00 01"],
      link: "tel:+905000000000"
    },
    {
      icon: <Mail className="text-emerald-400" />,
      title: "E-Posta",
      details: ["destek@omernasuhakademi.com", "bilgi@omernasuhakademi.com"],
      link: "mailto:destek@omernasuhakademi.com"
    },
    {
      icon: <MapPin className="text-rose-400" />,
      title: "Adres",
      details: ["Bahçelievler, İstanbul, Türkiye"],
      link: "https://maps.google.com"
    },
    {
      icon: <Clock className="text-amber-400" />,
      title: "Çalışma Saatleri",
      details: ["Hafta İçi: 09:00 - 19:00", "Hafta Sonu: 10:00 - 17:00"],
      link: "#"
    }
  ];

  return (
    <div className="min-h-screen bg-slate-950 pb-20">
      {/* Header */}
      <section className="relative py-24 overflow-hidden border-b border-white/5">
        <div className="absolute inset-0">
          <div className="absolute top-0 right-1/4 w-96 h-96 bg-blue-500/10 blur-[120px] rounded-full"></div>
          <div className="absolute bottom-0 left-1/4 w-96 h-96 bg-emerald-500/10 blur-[120px] rounded-full"></div>
        </div>

        <div className="container mx-auto px-4 relative z-10 text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-blue-500/10 border border-blue-500/20 rounded-full text-blue-400 text-sm font-semibold tracking-wide mb-6 uppercase">
              <Globe size={16} />
              Bize Ulaşın
            </div>
            <h1 className="text-4xl md:text-6xl font-extrabold text-white mb-6">
              Sorularınız İçin <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-emerald-300">
                Biz Buradayız
              </span>
            </h1>
            <p className="text-slate-400 text-lg max-w-2xl mx-auto leading-relaxed">
              Eğitim sürecinizle ilgili her türlü soru, görüş ve öneriniz için 
              bizimle aşağıdaki kanallardan iletişime geçebilirsiniz.
            </p>
          </motion.div>
        </div>
      </section>

      {/* Contact Content */}
      <section className="py-20">
        <div className="container mx-auto px-4 max-w-7xl">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
            {/* Contact Info Cards */}
            <div className="lg:col-span-1 space-y-6">
              {contactInfo.map((item, idx) => (
                <motion.a
                  key={idx}
                  href={item.link}
                  initial={{ opacity: 0, x: -20 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: idx * 0.1 }}
                  className="block p-8 bg-slate-900/40 border border-white/5 rounded-[2rem] hover:border-blue-500/30 transition-all group"
                >
                  <div className="w-12 h-12 bg-slate-800 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                    {item.icon}
                  </div>
                  <h3 className="text-xl font-bold text-white mb-3 tracking-tight">{item.title}</h3>
                  <div className="space-y-1">
                    {item.details.map((detail, dIdx) => (
                      <p key={dIdx} className="text-slate-400 group-hover:text-slate-300 transition-colors uppercase tracking-widest text-[10px] font-bold">
                        {detail}
                      </p>
                    ))}
                  </div>
                </motion.a>
              ))}
            </div>

            {/* Contact Form */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="lg:col-span-2 bg-slate-900/40 border border-white/5 rounded-[2.5rem] p-10 relative overflow-hidden"
            >
              <div className="absolute top-0 right-0 p-10 opacity-5">
                <MessageSquare size={200} />
              </div>

              <div className="relative z-10">
                <h2 className="text-3xl font-bold text-white mb-8 italic">Bize Mesaj Gönderin</h2>
                
                <form className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <label className="text-xs text-slate-500 font-bold uppercase tracking-widest ml-1">Ad Soyad</label>
                      <input 
                        type="text" 
                        placeholder="Örn: Ahmet Yılmaz"
                        className="w-full bg-slate-950 border border-white/10 rounded-2xl p-4 text-white focus:border-blue-500/50 focus:ring-0 transition-all"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-xs text-slate-500 font-bold uppercase tracking-widest ml-1">E-Posta</label>
                      <input 
                        type="email" 
                        placeholder="Örn: ahmet@mail.com"
                        className="w-full bg-slate-950 border border-white/10 rounded-2xl p-4 text-white focus:border-blue-500/50 focus:ring-0 transition-all"
                      />
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <label className="text-xs text-slate-500 font-bold uppercase tracking-widest ml-1">Konu</label>
                    <input 
                      type="text" 
                      placeholder="Mesajınızın konusu"
                      className="w-full bg-slate-950 border border-white/10 rounded-2xl p-4 text-white focus:border-blue-500/50 focus:ring-0 transition-all"
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-xs text-slate-500 font-bold uppercase tracking-widest ml-1">Mesajınız</label>
                    <textarea 
                      rows={5}
                      placeholder="Detaylı mesajınız..."
                      className="w-full bg-slate-950 border border-white/10 rounded-2xl p-4 text-white focus:border-blue-500/50 focus:ring-0 transition-all resize-none"
                    ></textarea>
                  </div>

                  <button className="w-full flex items-center justify-center gap-2 py-5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold rounded-2xl transition-all shadow-lg shadow-blue-900/20 group">
                    <Send size={18} className="group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform" />
                    Mesajı Gönder
                  </button>
                </form>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Map Placeholder */}
      <section className="container mx-auto px-4 max-w-7xl mt-10">
        <div className="h-[400px] bg-slate-900/60 border border-white/5 rounded-[3rem] p-4 group">
          <div className="w-full h-full rounded-[2.5rem] bg-slate-950 border border-white/10 flex flex-col items-center justify-center relative overflow-hidden">
            <div className="absolute inset-0 opacity-20 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-blue-500/20 via-transparent to-transparent"></div>
            <MapPin size={48} className="text-slate-700 mb-4 group-hover:text-blue-500 transition-colors duration-500" />
            <h4 className="text-slate-500 font-bold uppercase tracking-widest text-sm">İnteraktif Harita Yakında</h4>
            <div className="mt-2 text-slate-600 text-xs text-center px-10">
              Bahçelievler Mah. Atatürk Cad. No:123<br />Bakırköy / İSTANBUL
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
