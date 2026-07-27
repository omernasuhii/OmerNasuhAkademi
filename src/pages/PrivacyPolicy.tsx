import React from 'react';
import { Shield, Lock, Eye, FileText, CheckCircle } from 'lucide-react';
import { motion } from 'motion/react';

export default function PrivacyPolicy() {
  return (
    <div className="w-full min-h-screen pt-24 pb-16 bg-[#0B0F19] relative overflow-hidden">
      {/* Background Elements */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none -z-10">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-blue-500/10 blur-[120px] rounded-full" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-emerald-500/10 blur-[120px] rounded-full" />
      </div>

      <div className="max-w-4xl mx-auto px-6">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-16"
        >
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-blue-500/10 text-blue-400 mb-6">
            <Shield size={32} />
          </div>
          <h1 className="text-4xl md:text-5xl font-black text-white tracking-tight mb-6">
            Gizlilik <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-blue-200">Politikası</span>
          </h1>
          <p className="text-lg text-slate-400 max-w-2xl mx-auto leading-relaxed">
            Kişisel verilerinizin güvenliği ve gizliliği bizim için en yüksek önceliktir. 
            Bilgilerinizi nasıl topladığımızı ve koruduğumuzu buradan inceleyebilirsiniz.
          </p>
        </motion.div>

        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-slate-900/50 border border-white/5 rounded-3xl p-8 md:p-12 prose prose-invert max-w-none prose-blue"
        >
          <div className="space-y-12 text-slate-300">
            <section className="space-y-4">
              <h2 className="text-2xl font-bold text-white flex items-center gap-3 border-b border-white/10 pb-4">
                <Lock className="text-blue-400" /> 1. Toplanan Bilgiler
              </h2>
              <p className="leading-relaxed">
                FocusON Akademi olarak, sizlere daha iyi hizmet verebilmek amacıyla bazı kişisel bilgilerinizi (isim, soyisim, e-posta adresi, telefon numarası vb.) talep etmekteyiz. Bu bilgiler, sadece platformumuzun hizmetlerini sunmak için kullanılır.
              </p>
              <ul className="space-y-2 mt-4 list-disc pl-6">
                <li>Hesap oluşturma ve giriş işlemleri</li>
                <li>Randevu ve takvim yönlendirmeleri</li>
                <li>SMS doğrulama işlemleri</li>
                <li>Hizmet kalitesinin artırılması için istatistiksel veriler</li>
              </ul>
            </section>

            <section className="space-y-4">
              <h2 className="text-2xl font-bold text-white flex items-center gap-3 border-b border-white/10 pb-4">
                <Eye className="text-blue-400" /> 2. Bilgilerin Kullanımı
              </h2>
              <p className="leading-relaxed">
                Toplanan bilgileriniz aşağıdaki amaçlar doğrultusunda kullanılmaktadır:
              </p>
              <ul className="space-y-2 mt-4 list-disc pl-6">
                <li>Sisteme güvenli erişiminizin sağlanması</li>
                <li>Koçluk ve eğitim hizmetlerimizin kişiselleştirilmesi</li>
                <li>Bilgilendirme ve hatırlatma mesajlarının iletilmesi</li>
                <li>Yasal yükümlülüklerin yerine getirilmesi</li>
              </ul>
            </section>

            <section className="space-y-4">
              <h2 className="text-2xl font-bold text-white flex items-center gap-3 border-b border-white/10 pb-4">
                <FileText className="text-blue-400" /> 3. Bilgilerin Paylaşımı
              </h2>
              <p className="leading-relaxed">
                Kişisel bilgileriniz, yasal zorunluluklar hariç olmak üzere, kesinlikle üçüncü şahıslarla veya kurumlarla satılamaz, kiralanamaz veya paylaşılamaz. Firebase altyapısı kullanılarak verileriniz global güvenlik standartlarında korunmaktadır.
              </p>
            </section>

            <section className="space-y-4">
              <h2 className="text-2xl font-bold text-white flex items-center gap-3 border-b border-white/10 pb-4">
                <CheckCircle className="text-blue-400" /> 4. Kullanıcı Hakları
              </h2>
              <p className="leading-relaxed">
                Kullanıcılarımız sistemde kayıtlı olan bilgilerini her zaman görüntüleme ve silme hakkına sahiptir. Verilerinizin tamamen silinmesini talep edebilir, hesap ayarları menüsünden kontrollerinizi sağlayabilirsiniz.
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
