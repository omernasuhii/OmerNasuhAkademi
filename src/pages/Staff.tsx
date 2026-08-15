import { useState } from 'react';
import { Mail, Linkedin, Twitter, GraduationCap, Award, BookOpen, X, Send, Briefcase, Calendar, Phone, FileText, CheckCircle2 } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { db } from '../lib/firebase';
import { collection, doc, setDoc } from 'firebase/firestore';

const staffMembers = [
  {
    name: "Ömer Nasuh AĞIR",
    role: "Kurucu & Baş Danışman",
    specialty: "Uzman Eğitim Koçu & Psikolojik Danışman",
    bio: "Eğitim bilimleri alanında 6 yıllık tecrübe. Binlerce öğrencinin kariyer planlamasına rehberlik etti.",
    avatar: "https://drive.google.com/thumbnail?id=1BQqADIxhN7h0vRrPFrAcvIHTG6LGpIMx&sz=w500",
    social: { linkedin: "#", twitter: "#", mail: "mailto:destek@omernasuhakademi.com" }
  },
  {
    name: "Esma Nur DAĞ",
    role: "Psikolog & Koç",
    specialty: "Sınav Kaygısı & Stres Yönetimi",
    bio: "Öğrencilerin bilişsel süreçlerini ve stres faktörlerini analiz eder. Sınav kaygısını yönetme ve motivasyon artırma konularında kişiye özgü gelişim stratejileri tasarlar.",
    avatar: "https://images.unsplash.com/photo-1574701148212-8518049c7b2c?q=80&w=300&h=300&auto=format&fit=crop",
    social: { linkedin: "#", twitter: "#", mail: "mailto:destek@omernasuhakademi.com" }
  },
  {
    name: "Alperen BOZKURT",
    role: "Online Eğitim Tasarımcısı",
    specialty: "Dijital Müfredat & Etkileşimli İçerik",
    bio: "Sistemde yer alan online eğitim modüllerini tasarlar. Öğrencilerin eksiklerini hızla kapatacak, hedef odaklı video içerikler ve dökümanlar oluşturur.",
    avatar: "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?q=80&w=300&h=300&auto=format&fit=crop",
    social: { linkedin: "#", twitter: "#", mail: "mailto:destek@omernasuhakademi.com" }
  },
  {
    name: "Gülşah TEKİN",
    role: "Öğrenci Veri & Gelişim Analisti",
    specialty: "Derin Deneme & Hata Analizi",
    bio: "Deneme sınavlarındaki verileri ve psikolojik testleri harmanlayarak öğrencilerin en gizli eksiklerini, zaman yönetimi hatalarını tespit eder.",
    avatar: "https://images.unsplash.com/photo-1580489944761-15a19d654956?q=80&w=300&h=300&auto=format&fit=crop",
    social: { linkedin: "#", twitter: "#", mail: "mailto:destek@omernasuhakademi.com" }
  },
  {
    name: "Celal Çağlar ÖZTÜRK",
    role: "Eğitim Teknolojileri Uzmanı",
    specialty: "Dijital Öğrenme Platformları",
    bio: "FocusON platformunun teknik altyapısı ve yapay zeka destekli analiz sistemlerinden sorumlu.",
    avatar: "https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?q=80&w=300&h=300&auto=format&fit=crop",
    social: { linkedin: "#", twitter: "#", mail: "mailto:destek@omernasuhakademi.com" }
  },
  {
    name: "Emre GÜNDÜZ",
    role: "Topluluk & Dijital Medya Yöneticisi",
    specialty: "Sosyal Medya, Forum & İçerik Üretimi",
    bio: "FocusON'un dijital topluluklarını, sosyal medya hesaplarını, forum ve öğrenci gruplarını yönetir. Blog içerikleri ve aktif dijital etkileşimlerle öğrencilerin her an motivasyon bulabileceği online alanlar yaratır.",
    avatar: "https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?q=80&w=300&h=300&auto=format&fit=crop",
    social: { linkedin: "#", twitter: "#", mail: "mailto:destek@omernasuhakademi.com" }
  }
];

export default function Staff() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [position, setPosition] = useState('Eğitim Koçu');
  const [experience, setExperience] = useState('1-3 Yıl');
  const [message, setMessage] = useState('');
  const [cvLink, setCvLink] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!firstName || !lastName || !email || !phone || !message) {
      setError('Lütfen zorunlu alanları doldurunuz.');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const messageId = `hr_${Date.now()}`;
      await setDoc(doc(db, 'inbox_messages', messageId), {
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        email: email.trim(),
        phone: phone.trim(),
        topic: `İK Başvurusu - ${position}`,
        message: `Pozisyon: ${position}\nDeneyim: ${experience}\n\nÖn Yazı:\n${message}\n\nCV Linki: ${cvLink.trim() || 'Belirtilmedi'}`,
        status: 'new',
        type: 'hr_application',
        createdAt: new Date()
      });

      setSuccess(true);
      // Reset form
      setFirstName('');
      setLastName('');
      setEmail('');
      setPhone('');
      setMessage('');
      setCvLink('');
      setTimeout(() => {
        setIsModalOpen(false);
        setSuccess(false);
      }, 3000);
    } catch (err: any) {
      console.error('Error submitting HR application:', err);
      setError('Başvuru gönderilirken bir sorun oluştu. Lütfen tekrar deneyin.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 pb-20">
      {/* Header */}
      <section className="relative py-24 overflow-hidden border-b border-white/5">
        <div className="absolute inset-0">
          <div className="absolute top-0 left-1/4 w-96 h-96 bg-blue-500/10 blur-[120px] rounded-full"></div>
          <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-indigo-500/10 blur-[120px] rounded-full"></div>
        </div>

        <div className="container mx-auto px-4 relative z-10 text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-blue-500/10 border border-blue-500/20 rounded-full text-blue-400 text-sm font-semibold tracking-wide mb-6 uppercase">
              <Award size={16} />
              Uzman Kadromuz
            </div>
            <h1 className="text-4xl md:text-6xl font-extrabold text-white mb-6">
              Başarınızın Arkasındaki <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-indigo-300">
                Profesyonel Ekip
              </span>
            </h1>
            <p className="text-slate-400 text-lg max-w-2xl mx-auto leading-relaxed">
              Her biri kendi alanında uzman, tecrübeli ve dinamik ekibimizle, 
              geleceğe emin adımlarla ilerlemenizi sağlıyoruz.
            </p>
          </motion.div>
        </div>
      </section>

      {/* Staff Grid */}
      <section className="py-20">
        <div className="container mx-auto px-4 max-w-7xl">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {staffMembers.map((member, idx) => (
              <motion.div
                key={idx}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: idx * 0.1 }}
                className="group relative bg-slate-900/40 border border-slate-800 rounded-[2.5rem] p-8 hover:border-blue-500/30 transition-all duration-300"
              >
                <div className="flex items-start justify-between mb-8">
                  <div className="relative">
                    <div className="absolute inset-0 bg-blue-500/20 blur-xl rounded-full scale-0 group-hover:scale-100 transition-transform duration-500"></div>
                    <div className="relative w-24 h-24 rounded-3xl bg-slate-800 border border-white/5 overflow-hidden flex items-center justify-center transform group-hover:-translate-y-2 transition-transform duration-300">
                       <img src={member.avatar} alt={member.name} className="w-full h-full object-cover" />
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <a href={member.social.mail} className="p-2.5 bg-slate-800/50 rounded-xl text-slate-400 hover:text-white hover:bg-blue-500/20 transition-all">
                      <Mail size={18} />
                    </a>
                    <a href={member.social.linkedin} className="p-2.5 bg-slate-800/50 rounded-xl text-slate-400 hover:text-[#0077b5] hover:bg-blue-500/20 transition-all">
                      <Linkedin size={18} />
                    </a>
                  </div>
                </div>

                <div className="space-y-4">
                  <div>
                    <h3 className="text-2xl font-bold text-white group-hover:text-blue-400 transition-colors uppercase tracking-tight">{member.name}</h3>
                    <p className="text-blue-500 font-medium text-sm mt-1">{member.role}</p>
                  </div>
                  
                  <div className="flex items-center gap-2 py-1 px-3 bg-slate-800/50 rounded-lg w-fit border border-white/5">
                    <BookOpen size={14} className="text-slate-400" />
                    <span className="text-xs text-slate-300 font-medium">{member.specialty}</span>
                  </div>

                  <p className="text-slate-400 text-sm leading-relaxed border-t border-white/5 pt-4">
                    {member.bio}
                  </p>

                  <div className="pt-4 flex items-center gap-2 text-xs text-slate-500 font-semibold tracking-widest uppercase">
                    <GraduationCap size={14} />
                    <span>Onaylı FocusON Eğitmeni</span>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Join the team banner */}
      <section className="container mx-auto px-4 max-w-5xl mt-10">
        <div className="bg-gradient-to-r from-blue-600/20 via-indigo-600/20 to-purple-600/20 border border-white/10 rounded-[2.5rem] p-10 text-center relative overflow-hidden group">
           <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 blur-3xl -translate-y-1/2 translate-x-1/2 rounded-full"></div>
           <div className="relative z-10">
              <h2 className="text-3xl font-bold text-white mb-4">FocusON Ekibine Katılmak İster Misiniz?</h2>
              <p className="text-slate-400 max-w-2xl mx-auto mb-8">
                Eğitim vizyonumuzun bir parçası olmak ve öğrencilerin hayatlarına dokunmak istiyorsanız 
                bizimle iletişime geçin.
              </p>
              <button 
                onClick={() => setIsModalOpen(true)}
                className="px-8 py-4 bg-white text-slate-900 font-bold rounded-2xl hover:bg-blue-50 transition-colors shadow-xl"
              >
                 Başvuru Yap
              </button>
           </div>
        </div>
      </section>

      {/* HR Application Modal */}
      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsModalOpen(false)}
              className="absolute inset-0 bg-slate-950/80 backdrop-blur-md"
            />

            {/* Content */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative w-full max-w-2xl bg-slate-900 border border-white/10 rounded-[2.5rem] shadow-2xl p-6 md:p-10 max-h-[90vh] overflow-y-auto"
            >
              {/* Close button */}
              <button
                onClick={() => setIsModalOpen(false)}
                className="absolute top-6 right-6 p-2 text-slate-400 hover:text-white bg-slate-850 rounded-full border border-white/5 hover:border-white/10 transition-colors"
              >
                <X size={18} />
              </button>

              <div className="mb-8 flex items-center gap-4">
                <div className="w-12 h-12 bg-blue-500/10 border border-blue-500/20 rounded-2xl flex items-center justify-center text-blue-400">
                  <Briefcase size={22} />
                </div>
                <div>
                  <h3 className="text-2xl font-bold text-white italic">FocusON Ekibine Katıl</h3>
                  <p className="text-sm text-slate-400">Gelişim ve eğitim odaklı ekibimize katılmak için bilgilerinizi girin.</p>
                </div>
              </div>

              {success ? (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="p-8 text-center"
                >
                  <div className="w-16 h-16 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 rounded-full flex items-center justify-center mx-auto mb-6">
                    <CheckCircle2 size={32} />
                  </div>
                  <h4 className="text-xl font-bold text-white mb-2">Başvurunuz Alındı!</h4>
                  <p className="text-slate-400">
                    İş başvurunuz ve ön yazınız başarıyla ekibimize ulaştı. 
                    İK ekibimiz en kısa sürede sizinle iletişime geçecektir. Teşekkür ederiz!
                  </p>
                </motion.div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-6">
                  {error && (
                     <div className="p-4 bg-rose-500/10 border border-rose-500/20 rounded-2xl text-rose-400 text-sm">
                       {error}
                     </div>
                  )}

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <label className="text-xs text-slate-500 font-bold uppercase tracking-widest ml-1">Adınız</label>
                      <input
                        type="text"
                        required
                        placeholder="Örn: Ahmet"
                        value={firstName}
                        onChange={(e) => setFirstName(e.target.value)}
                        className="w-full bg-slate-950 border border-white/10 rounded-2xl p-4 text-white focus:border-blue-500/50 focus:ring-0 transition-all outline-none text-sm"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-xs text-slate-500 font-bold uppercase tracking-widest ml-1">Soyadınız</label>
                      <input
                        type="text"
                        required
                        placeholder="Örn: Yılmaz"
                        value={lastName}
                        onChange={(e) => setLastName(e.target.value)}
                        className="w-full bg-slate-950 border border-white/10 rounded-2xl p-4 text-white focus:border-blue-500/50 focus:ring-0 transition-all outline-none text-sm"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <label className="text-xs text-slate-500 font-bold uppercase tracking-widest ml-1">E-Posta Adresi</label>
                      <input
                        type="email"
                        required
                        placeholder="Örn: ahmet@mail.com"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="w-full bg-slate-950 border border-white/10 rounded-2xl p-4 text-white focus:border-blue-500/50 focus:ring-0 transition-all outline-none text-sm"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-xs text-slate-500 font-bold uppercase tracking-widest ml-1">Telefon Numarası</label>
                      <div className="relative">
                        <Phone size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" />
                        <input
                          type="tel"
                          required
                          placeholder="Örn: +90 5XX XXX XX XX"
                          value={phone}
                          onChange={(e) => setPhone(e.target.value)}
                          className="w-full bg-slate-950 border border-white/10 rounded-2xl pl-12 pr-4 py-4 text-white focus:border-blue-500/50 focus:ring-0 transition-all outline-none text-sm"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <label className="text-xs text-slate-500 font-bold uppercase tracking-widest ml-1">Başvurulan Pozisyon</label>
                      <select
                        value={position}
                        onChange={(e) => setPosition(e.target.value)}
                        className="w-full bg-slate-950 border border-white/10 rounded-2xl p-4 text-white focus:border-blue-500/50 focus:ring-0 transition-all outline-none text-sm"
                      >
                        <option value="Eğitim Koçu">Eğitim Koçu</option>
                        <option value="Branş Öğretmeni">Branş Öğretmeni</option>
                        <option value="Yazılım & Altyapı">Yazılım & Altyapı</option>
                        <option value="Satış & Pazarlama">Satış & Pazarlama</option>
                        <option value="Diğer">Diğer</option>
                      </select>
                    </div>
                    <div className="space-y-2">
                      <label className="text-xs text-slate-500 font-bold uppercase tracking-widest ml-1">Mesleki Deneyim</label>
                      <select
                        value={experience}
                        onChange={(e) => setExperience(e.target.value)}
                        className="w-full bg-slate-950 border border-white/10 rounded-2xl p-4 text-white focus:border-blue-500/50 focus:ring-0 transition-all outline-none text-sm"
                      >
                        <option value="1 Yıldan Az">1 Yıldan Az</option>
                        <option value="1-3 Yıl">1-3 Yıl</option>
                        <option value="3-5 Yıl">3-5 Yıl</option>
                        <option value="5+ Yıl">5+ Yıl</option>
                      </select>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-xs text-slate-500 font-bold uppercase tracking-widest ml-1">CV Linki (LinkedIn, Drive vb.)</label>
                    <div className="relative">
                      <FileText size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" />
                      <input
                        type="url"
                        placeholder="Örn: https://linkedin.com/in/username"
                        value={cvLink}
                        onChange={(e) => setCvLink(e.target.value)}
                        className="w-full bg-slate-950 border border-white/10 rounded-2xl pl-12 pr-4 py-4 text-white focus:border-blue-500/50 focus:ring-0 transition-all outline-none text-sm"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-xs text-slate-500 font-bold uppercase tracking-widest ml-1">Ön Yazı / Kendinizi Tanıtın</label>
                    <textarea
                      rows={4}
                      required
                      placeholder="Sizi neden seçmeliyiz? Deneyimlerinizden ve vizyonunuzdan bahsedin..."
                      value={message}
                      onChange={(e) => setMessage(e.target.value)}
                      className="w-full bg-slate-950 border border-white/10 rounded-2xl p-4 text-white focus:border-blue-500/50 focus:ring-0 transition-all resize-none text-sm outline-none"
                    ></textarea>
                  </div>

                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full flex items-center justify-center gap-2 py-4 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold rounded-2xl transition-all shadow-lg shadow-blue-900/20 group disabled:opacity-50 text-sm"
                  >
                    {loading ? (
                      <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                    ) : (
                      <>
                        <Send size={16} className="group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform" />
                        Başvuruyu Tamamla
                      </>
                    )}
                  </button>
                </form>
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
