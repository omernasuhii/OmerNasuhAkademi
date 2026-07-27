import React from 'react';
import { X } from 'lucide-react';

interface KVKKModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function KVKKModal({ isOpen, onClose }: KVKKModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div 
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />
      
      <div className="bg-slate-900 border border-white/10 sm:rounded-2xl w-full max-w-3xl h-full sm:h-auto sm:max-h-[85vh] flex flex-col shadow-2xl relative z-10 overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/5 bg-slate-800/50">
          <h2 className="text-xl font-bold text-white">
            Kişisel Verilerin Korunması ve İşlenmesi Aydınlatma Metni
          </h2>
          <button 
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-white hover:bg-white/5 rounded-lg transition-colors shrink-0"
          >
            <X size={20} />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto text-sm text-slate-300 space-y-6 custom-scrollbar text-left">
          
          <section>
            <h3 className="text-lg font-bold text-white mb-2">1. Veri Sorumlusunun Kimliği</h3>
            <p>
              6698 sayılı Kişisel Verilerin Korunması Kanunu ("KVKK") uyarınca, kişisel verileriniz veri sorumlusu sıfatıyla <strong>Ömer Nasuh Akademi</strong> tarafından aşağıda açıklanan kapsamda toplanacak ve işlenebilecektir.
            </p>
          </section>

          <section>
            <h3 className="text-lg font-bold text-white mb-2">2. İşlenen Kişisel Verileriniz</h3>
            <p className="mb-2">Tarafımızca, uygulamamıza kayıt olan öğrencilerden ve koçlardan / velilerden aşağıdaki kişisel veriler toplanmaktadır:</p>
            <ul className="list-disc pl-5 space-y-1 text-slate-400">
              <li><strong>Kimlik Verisi:</strong> Adınız, soyadınız, veli ad-soyad bilgisi.</li>
              <li><strong>İletişim Verisi:</strong> E-posta adresi, telefon numarası (hem öğrenci hem veli için).</li>
              <li><strong>Eğitim / Akademik Veri:</strong> Sınıf seviyesi, okul bölümü, YDT dil bilgisi, deneme ve sınav analiz verileri, kitap bitirme durumları, çalışma programları.</li>
              <li><strong>İşlem Güvenliği Verisi:</strong> Şifreleme/parola bilgileri, IP adresi, sistem erişim zamanları.</li>
              <li><strong>Finansal Veriler:</strong> Sistem üzerinden herhangi bir ödeme işlemi gerçekleştirilmesi halinde fatura ve cüzdan hareketlerine ilişkin veriler.</li>
            </ul>
          </section>

          <section>
            <h3 className="text-lg font-bold text-white mb-2">3. Kişisel Verilerin İşlenme Amacı</h3>
            <p className="mb-2">Toplanan kişisel verileriniz, aşağıda yer alan amaçlarla işlenmektedir:</p>
            <ul className="list-disc pl-5 space-y-1 text-slate-400">
              <li>Ömer Nasuh Akademi web/mobil platformunda kullanıcı kayıtlarının (öğrenci, koç) gerçekleştirilmesi ve hesap aktivasyonlarının yapılması,</li>
              <li>Platformun ana kullanım amacı olan ders planlaması, ilerleme takibi, koçluk süreçlerinin yönetimi ve sınav analizlerinin sunulması,</li>
              <li>Güvenliğinizi sağlamak amacıyla e-posta, SMS (telefon doğrulama) işlemleri üzerinden üyelik doğrulamalarının yapılması,</li>
              <li>Bilgilendirme, platform bildirimleri, ve randevu hatırlatmalarının yapılması,</li>
              <li>Olası sorunlarda teknik destek hizmetlerinin sunulması,</li>
              <li>Hizmetlerimizin iyileştirilmesi, analiz ve raporlama süreçlerinin yürütülmesi,</li>
              <li>Yürürlükteki yasal mevzuattan doğan yükümlülüklerimizin yerine getirilmesi.</li>
            </ul>
          </section>

          <section>
            <h3 className="text-lg font-bold text-white mb-2">4. Kişisel Verilerin Aktarılması</h3>
            <p>
              Kişisel verileriniz, yukarıda sayılan amaçların gerçekleştirilmesi doğrultusunda; veri tabanı yönetimi, sunucu hizmetleri (Firebase vd.), bulut sistemleri ve kullanıcı doğrulama (SMS gönderimi) alanında destek aldığımız sözleşmeli ve KVKK uyumlu yurtiçi ve/veya yurtdışı merkezli teknoloji tedarikçilerine, kanunen yetkili kamu kurum ve kuruluşları ile adli makamlara aktarılabilecektir. Veri aktarımı süreçlerinde veri güvenliğine ilişkin her türlü teknik ve idari tedbir alınmaktadır.
            </p>
          </section>

          <section>
            <h3 className="text-lg font-bold text-white mb-2">5. Kişisel Veri Toplamanın Yöntemi ve Hukuki Sebebi</h3>
            <p>
              Kişisel verileriniz, Ömer Nasuh Akademi dijital platformları, kayıt formları vasıtasıyla tamamen veya kısmen otomatik yollarla toplanmaktadır. Verileriniz, KVKK'nın 5. maddesinde yer alan;
            </p>
            <ul className="list-disc pl-5 my-2 space-y-1 text-slate-400">
              <li>Bir sözleşmenin kurulması veya ifasıyla doğrudan doğruya ilgili olması (Kullanıcı sözleşmesinin şartlarının yerine getirilmesi),</li>
              <li>Veri sorumlusunun hukuki yükümlülüğünü yerine getirebilmesi için zorunlu olması,</li>
              <li>İlgili kişinin temel hak ve özgürlüklerine zarar vermemek kaydıyla, veri sorumlusunun meşru menfaatleri için veri işlenmesinin zorunlu olması,</li>
              <li>Özel nitelikli veriler ve rızaya tabi işlemler kapsamında durumun gerektirdiği hallerde "Açık Rıza"nıza dayanılarak işlenmektedir.</li>
            </ul>
          </section>

          <section>
            <h3 className="text-lg font-bold text-white mb-2">6. Kişisel Veri Sahibinin Hakları</h3>
            <p className="mb-2">KVKK'nın 11. maddesi kapsamındaki haklarınız şunlardır:</p>
            <ul className="list-disc pl-5 space-y-1 text-slate-400">
              <li>Kişisel veri işlenip işlenmediğini öğrenme,</li>
              <li>İşlenmişse buna ilişkin bilgi talep etme,</li>
              <li>İşlenme amacını ve amacına uygun kullanılıp kullanılmadığını öğrenme,</li>
              <li>Yurt içinde veya yurt dışında aktarıldığı üçüncü kişileri bilme,</li>
              <li>Eksik veya yanlış işlenmişse düzeltilmesini isteme,</li>
              <li>KVKK ve ilgili mevzuat şartları çerçevesinde silinmesini veya yok edilmesini isteme,</li>
              <li>Aktarıldığı üçüncü kişilere yapılacak işlemlerin bildirilmesini isteme,</li>
              <li>Münhasıran otomatik sistemler vasıtasıyla analiz edilmesi halinde aleyhe bir sonucun çıkmasına itiraz etme,</li>
              <li>Kanuna aykırı olarak işlenmesi sebebiyle zarara uğraması halinde zararın giderilmesini talep etme.</li>
            </ul>
            <p className="mt-4">
              Bu haklarınızı kullanmak için destek@omernasuhakademi.com adresine kimliğinizi tespit edici belgeler ile yazılı olarak başvurabilirsiniz. Talebiniz en kısa sürede ve yasal süre olan en geç otuz (30) gün içinde ücretsiz olarak sonuçlandırılacaktır.
            </p>
          </section>

        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-white/5 bg-slate-800/50 flex justify-end">
          <button
            onClick={onClose}
            className="bg-blue-600 hover:bg-blue-500 text-white px-6 py-2 rounded-xl font-bold transition-all text-sm"
          >
            Anladım ve Kapat
          </button>
        </div>
      </div>
    </div>
  );
}
