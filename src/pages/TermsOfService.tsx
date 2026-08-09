import React from 'react';
import { FileText, BookOpen, UserCheck, AlertTriangle } from 'lucide-react';
import { motion } from 'motion/react';

export default function TermsOfService() {
  return (
    <div className="w-full min-h-screen pt-24 pb-16 bg-[#0B0F19] relative overflow-hidden">
      {/* Background Elements */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none -z-10">
        <div className="absolute top-[-10%] right-[-10%] w-[40%] h-[40%] bg-indigo-500/10 blur-[120px] rounded-full" />
        <div className="absolute bottom-[-10%] left-[-10%] w-[40%] h-[40%] bg-purple-500/10 blur-[120px] rounded-full" />
      </div>

      <div className="max-w-4xl mx-auto px-6">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-16"
        >
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-indigo-500/10 text-indigo-400 mb-6">
            <FileText size={32} />
          </div>
          <h1 className="text-4xl md:text-5xl font-black text-white tracking-tight mb-6">
            Kullanım <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-indigo-200">Koşulları</span>
          </h1>
          <p className="text-lg text-slate-400 max-w-2xl mx-auto leading-relaxed">
            Platformumuzu kullanırken tabi olduğunuz kurallar ve hizmet şartlarımız hakkında 
            detaylı bilgilere buradan ulaşabilirsiniz.
          </p>
        </motion.div>

        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-slate-900/50 border border-white/5 rounded-3xl p-8 md:p-12 prose prose-invert max-w-none prose-indigo"
        >
          <div className="space-y-12 text-slate-300">
            <section className="space-y-4">
              <h2 className="text-2xl font-bold text-white flex items-center gap-3 border-b border-white/10 pb-4">
                <BookOpen className="text-indigo-400" /> 1. Genel Şartlar
              </h2>
              <p className="leading-relaxed">
                Bu web sitesini (FocusON Akademi) kullanarak bu kullanım şartlarını ve hizmet koşullarını kabul etmiş sayılırsınız. Sitemizi kullanmaya devam etmeniz, bu şartları onayladığınız anlamına gelir. Eğer bu şartları kabul etmiyorsanız lütfen servisimizi kullanmayınız.
              </p>
            </section>

            <section className="space-y-4">
              <h2 className="text-2xl font-bold text-white flex items-center gap-3 border-b border-white/10 pb-4">
                <UserCheck className="text-indigo-400" /> 2. Kullanıcı Yükümlülükleri
              </h2>
              <p className="leading-relaxed">
                Kullanıcı, site üzerinde yapacağı tüm işlemlerde, siteye girerken veya üye olurken verdiği bilgilerin eksiksiz ve doğru olduğunu taahhüt eder. Yanlış, yanıltıcı veya eksik bilgi verilmesinden doğacak her türlü hukuki ve cezai sorumluluk kullanıcıya aittir.
              </p>
              <ul className="space-y-2 mt-4 list-disc pl-6">
                <li>Hesap güvenliğini sağlamak ve şifrenizi gizli tutmak</li>
                <li>Başka kullanıcıların hesaplarına yetkisiz erişim sağlamamak</li>
                <li>Platformun düzenini bozacak davranışlardan kaçınmak</li>
              </ul>
            </section>

            <section className="space-y-4">
              <h2 className="text-2xl font-bold text-white flex items-center gap-3 border-b border-white/10 pb-4">
                <AlertTriangle className="text-indigo-400" /> 3. İptal ve İade Koşulları
              </h2>
              <p className="leading-relaxed">
                Satın alınan abonelik ve paketlerin iadesi, servis sağlayıcıları (entegre ödeme kuruluşları) politikaları çerçevesinde değerlendirilmektedir. İhtilaf durumlarında FocusON Akademi kuralları ve Tüketici Hakları göz önünde bulundurulur.
              </p>
            </section>

            <section className="space-y-4">
              <h2 className="text-2xl font-bold text-white flex items-center gap-3 border-b border-white/10 pb-4">
                <FileText className="text-indigo-400" /> 4. Fikri Mülkiyet Hakları
              </h2>
              <p className="leading-relaxed">
                Sitede yer alan tüm tasarım, metin, grafik ve arayüz içeriklerinin fikri mülkiyet hakları FocusON Akademi'ye aittir. İzinsiz olarak kopyalanamaz, çoğaltılamaz ve kullanılamaz.
              </p>
            </section>
          </div>
          
          <div className="mt-16 pt-8 border-t border-white/10 text-sm text-slate-500 text-center">
            Son Güncelleme Tarihi: 11 Haziran 2026
          </div>
        </motion.div>
      </div>
    </div>
  );
}
