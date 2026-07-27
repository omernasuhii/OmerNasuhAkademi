import React from 'react';
import { X } from 'lucide-react';

interface AgreementModalProps {
  isOpen: boolean;
  onClose: () => void;
  type: 'student' | 'coach';
}

export default function AgreementModal({ isOpen, onClose, type }: AgreementModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div 
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />
      
      <div className="bg-slate-900 border border-white/10 sm:rounded-2xl w-full max-w-4xl h-full sm:h-auto sm:max-h-[85vh] flex flex-col shadow-2xl relative z-10 overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/5 bg-slate-800/50">
          <h2 className="text-xl font-bold text-white">
            {type === 'coach' ? 'Koç Üyelik ve Bağımsız Hizmet Sözleşmesi' : 'Öğrenci / Veli Üyelik Sözleşmesi'}
          </h2>
          <button 
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-white hover:bg-white/5 rounded-lg transition-colors shrink-0"
          >
            <X size={20} />
          </button>
        </div>

        <div className="p-6 overflow-y-auto text-sm text-slate-300 space-y-6 custom-scrollbar text-left leading-relaxed">
          
          {type === 'student' ? (
            <>
              <section>
                <h3 className="text-lg font-bold text-white mb-2">1. Taraflar</h3>
                <p>
                  İşbu Üyelik Sözleşmesi ("Sözleşme"), <strong>Ömer Nasuh Akademi</strong> ("Platform") ile Platform'a üye olan öğrenci ve/veya velisi ("Kullanıcı") arasında, Kullanıcı'nın Platform üzerinden alacağı hizmetlere ilişkin şartları belirlemek amacıyla akdedilmiştir.
                </p>
              </section>

              <section>
                <h3 className="text-lg font-bold text-white mb-2">2. Sözleşmenin Konusu</h3>
                <p>
                  Bu sözleşmenin konusu, Kullanıcı'nın Platform üzerinden sunulan eğitim, koçluk, rehberlik, deneme analizi, randevu yönetimi ve cüzdan bakiyesi gibi hizmetleri kullanımına ilişkin koşulların, tarafların hak ve yükümlülüklerinin belirlenmesidir.
                </p>
              </section>

              <section>
                <h3 className="text-lg font-bold text-white mb-2">3. Hizmetin Niteliği ve Platformun Rolü</h3>
                <p className="mb-2">
                  <strong className="text-red-400">ÖNEMLİ UYARI:</strong> Platformumuz, eğitim koçlarına yönelik bir yönetim, takip ve muhasebe (SaaS) altyapısı sunmaktadır.
                </p>
                <ul className="list-decimal pl-5 space-y-2">
                  <li>Platform, sizinle (Öğrenci/Veli) eğitim koçunuz arasındaki idari, eğitsel ve finansal süreçlerin dijital ortamda şeffafça takip edilebilmesini sağlayan bir altyapı sağlayıcısıdır.</li>
                  <li>Platform (Ömer Nasuh Akademi), eğitim süreci, koçluk tavsiyeleri veya sınav başarısı konusunda hukuki bir taahhüt vermez. Alınan danışmanlığın içeriği ve niteliği doğrudan siz ve koçunuz arasındadır.</li>
                </ul>
              </section>

              <section>
                <h3 className="text-lg font-bold text-white mb-2">4. Cüzdan Takip Sistemi ve Finansal Sorumluluk</h3>
                <ul className="list-decimal pl-5 space-y-2">
                  <li><strong>Muhasebesel Takip Uygulaması:</strong> Platform üzerinde yer alan "Cüzdan" bakiyesi, abonelik ve paket işlemlerine ait veriler, yalnızca sizin ve eğitim koçunuzun aranızdaki finansal durumu takip edebilmeniz için sunulan bir muhasebe aracıdır.</li>
                  <li><strong>Ödemelerin Gerçekleştirilmesi:</strong> Öğrenci, hizmet bedellerini doğrudan çalıştığı eğitim koçuna öder. Eğitim koçu, aldığı ödemeleri Platform üzerindeki Öğrenci Cüzdanı'na bakiye olarak yansıtarak muhasebesel süreçleri yönetir.</li>
                  <li><strong>Platformun Finansal Sorumsuzluğu:</strong> Ömer Nasuh Akademi, öğrenci ile koç arasındaki para transferlerinin, bakiye hareketlerinin veya ödeme yöntemlerinin bir tarafı (ödeme alma/gönderme mercii) <strong>değildir.</strong> Yanlış ücret yansıtılması, eksik bakiye çalışması, ödeme ihtilafları veya iade taleplerinde Platform hiçbir sorumluluk kabul etmez; tüm bu taleplerin muhatabı bizzat çalışılan eğitim koçudur.</li>
                  <li><strong>Randevu Planlaması ve Kesintiler:</strong> Randevuların yapılması, mazeretsiz iptallerde uygulanacak cüzdan kesintileri ve kullanım haklarının düşülmesi, Platform altyapısı üzerinden eğitim koçunuzun inisiyatifi ve belirlediği çalışma kuralları çerçevesinde otomatik olarak işletilir.</li>
                </ul>
              </section>

              <section>
                <h3 className="text-lg font-bold text-white mb-2">5. Fikri Mülkiyet ve Kullanım Hakları</h3>
                <p>
                  Platformdaki tüm yazılımlar, tasarımlar, kitap analiz programları, rutin sistemleri, logolar ve diğer materyallerin fikri mülkiyet hakkı Ömer Nasuh Akademi'ye aittir. Kullanıcı, bu materyalleri kopyalayamaz, çoğaltamaz, üçüncü kişilerle paylaşamaz. İhlal halinde yasal süreç başlatılır.
                </p>
              </section>

              <section>
                <h3 className="text-lg font-bold text-white mb-2">6. Sorumluluk Reddi (Disclaimer)</h3>
                <p>
                  Ömer Nasuh Akademi, Platform'un kesintisiz ve hatasız çalışacağını garanti etmez. Sistem bakımları, güncellemeler veya üçüncü taraf (sunucu vb.) altyapı çökmelerinden doğan kesintilerden dolayı Kullanıcı maddi/manevi zarar talep edemez. Platform, hiçbir öğrenciye spesifik bir sınavı (YKS vb.) kazanma veya belli bir puan alma garantisi sunmaz. Eğitim ve koçluk, bir 'gayret ve rehberlik' hizmetidir.
                </p>
              </section>

              <section>
                <h3 className="text-lg font-bold text-white mb-2">7. Taraf Olma ve Sözleşmenin Kabulü</h3>
                <p>
                  Reşit olmayan (18 yaşından küçük) öğrencilerin Platform'a üye olması, velilerinin bilgi ve onayı dâhilinde gerçekleşmektedir. Kayıt aşamasında bu sözleşme onaylandığında, Kullanıcı (ve yasal temsilcisi velisi) sözleşmenin tüm maddelerini kabul ve beyan etmiş sayılır.
                </p>
              </section>

              <section>
                <h3 className="text-lg font-bold text-white mb-2">8. Kullanıcı Yükümlülükleri ve Hesap Güvenliği</h3>
                <ul className="list-decimal pl-5 space-y-2">
                  <li>Üye, kayıt sırasında verdiği bilgilerin kanunlar önünde doğru olduğunu ve gerçeğe aykırı bilgilerden doğacak tüm zararları tazmin edeceğini beyan ve taahhüt eder.</li>
                  <li>Kullanıcının şifresini gizli tutma ve izinsiz kullanımı engelleme sorumluluğu tamamen kendisine aittir. Hesabın yetkisiz kullanımı sebebiyle doğacak doğrudan veya dolaylı zararlardan Ömer Nasuh Akademi hukuken sorumlu tutulamaz.</li>
                </ul>
              </section>

              <section>
                <h3 className="text-lg font-bold text-white mb-2">9. Hukuka Aykırı Kullanım ve Platform İletişim Kuralları</h3>
                <ul className="list-decimal pl-5 space-y-2">
                  <li>Platform; kamu düzenini bozucu, genel ahlaka aykırı, yasadışı veya başkalarını taciz/tehdit edici işlemler ile spam, virüs, truva atı gibi altyapıyı zorlayıcı amaçlar için kullanılamaz.</li>
                  <li>Kullanıcılar iletişim kurarken argo, hakaret, nefret söylemi veya müstehcen içerik kullanamaz. Böyle bir durum tespit edildiğinde ilgili üyenin hesabı derhal askıya alınır veya tamamen kapatılır. Platform, içeriği kaldırma hakkını saklı tutar.</li>
                </ul>
              </section>

              <section>
                <h3 className="text-lg font-bold text-white mb-2">10. Aracı Hizmet Sağlayıcı Statüsü (5580 Sayılı Kanun İstisnası)</h3>
                <p>
                  Ömer Nasuh Akademi, eğitim koçları ile eğitim hizmeti/danışmanlığı talebinde bulunan kullanıcıları bir araya getiren bir yazılım (SaaS) sistemidir. 5580 sayılı Özel Öğretim Kurumları Kanunu kapsamında bir eğitim veya öğretim kurumu (dershane, okul, etüt merkezi vb.) <strong>değildir.</strong> Platform, içerik sağlayıcı değil; 6563 sayılı Kanun ve ilgili yönetmelikler kapsamında "Aracı Hizmet Sağlayıcı" konumundadır ve taraflar (öğrenci-koç) arasındaki ilişkinin ifasından/kalitesinden bizzat sorumlu değildir.
                </p>
              </section>

              <section>
                <h3 className="text-lg font-bold text-white mb-2">11. Sisteme Müdahale, Değişiklik ve Tek Taraflı Fesih Hakkı</h3>
                <ul className="list-decimal pl-5 space-y-2">
                  <li>Platform; hizmetlerini, uygulama arayüzünü, ücretlendirme politikalarını veya bu sözleşmedeki şartları dilediği zaman, ön ihbara gerek kalmaksızın değiştirme hakkını saklı tutar. Değişiklikler yayın tarihinde geçerli olur.</li>
                  <li>Ömer Nasuh Akademi, sözleşme maddelerinden bir veya birkaçını ihlal eden üyenin dosyalarını, aboneliğini veya üyeliğini ön ihtar gerekmeksizin tek taraflı olarak feshedebilir. Üye bu tasarrufu önceden kabul etmiş sayılır.</li>
                </ul>
              </section>

              <section>
                <h3 className="text-lg font-bold text-white mb-2">12. İhtilafların Halli ve Yetkili Mahkeme</h3>
                <p>
                  İşbu sözleşmenin uygulanmasından veya platformun kullanımından doğabilecek her türlü şikayet ve ihtilafın çözümünde Aksaray Mahkemeleri ve İcra Daireleri kesin olarak yetkilidir. Uyuşmazlıklarda, Platform'un sunucu (log) kayıtları ve veri tabanı, HUMK madde 287 uyarınca kesin ve tek delil teşkil eder.
                </p>
              </section>
            </>
          ) : (
            <>
              <section>
                <h3 className="text-lg font-bold text-white mb-2">1. Taraflar ve Tanımlar</h3>
                <p>
                  İşbu Koç Üyelik ve Bağımsız Hizmet Sözleşmesi ("Sözleşme"), <strong>Ömer Nasuh Akademi</strong> ("Platform") ile Platform üzerinden öğrencilere eğitim koçluğu hizmeti verecek olan "Koç" ("Bağımsız Yüklenici") arasında kabul edilmiştir.
                </p>
              </section>

              <section>
                <h3 className="text-lg font-bold text-white mb-2">2. Sözleşmenin Hukuki Niteliği ve Bağımsız Statü</h3>
                <ul className="list-decimal pl-5 space-y-2">
                  <li>Koç, Platform'un kadrolu bir çalışanı veya işçisi <strong>değildir.</strong> Koç, kendi uzmanlık ve becerilerini sergileyen "Bağımsız Yüklenici" (Freelancer) statüsündedir.</li>
                  <li>Bu Sözleşme, taraflar arasında 4857 Sayılı İş Kanunu kapsamında bir işçi-işveren ilişkisi kurmaz. Koç, kendi çalışma saatlerini ve kapasitesini Platform kuralları çerçevesinde kendi belirler.</li>
                </ul>
              </section>

              <section>
                <h3 className="text-lg font-bold text-white mb-2">3. Platformun İşlevi ve Finansal Sınırları</h3>
                <p className="mb-2">Koç'un, Platform sadakatini ve amacını zedeletici işlemler kapsamında aşağıdaki esaslara uyması zorunludur:</p>
                <ul className="list-disc pl-5 space-y-2 font-medium text-slate-300">
                  <li>Platform, temelde Koç'un öğrencilerinin ilerleyişini, randevularını, bakiye/cüzdan ve abonelik durumlarını yönettiği bir SaaS (Hizmet olarak Yazılım) altyapısıdır.</li>
                  <li>Koç, kendi öğrencilerinden hizmet bedelini kendi belirlediği ticari şartlar veya yollarla dışarıdan / harici tahsil eder. Ömer Nasuh Akademi, öğrenci ile koç arasındaki tahsilat / ödeme sürecinin bir parçası <strong>değildir.</strong></li>
                  <li>Platformun öğrenciye sunduğu Cüzdan ekranı, koç tarafından öğrenci adına işlenen ve yönetilen bir muhasebesel vizeden ibarettir. Koç, bu alana dürüst ve gerçeği yansıtan kayıtlar girmekle, öğrencisiyle oluşabilecek mali uyuşmazlıkları kendi yönetmekle mükelleftir. Hatalı, eksik veya yanıltıcı bakiye işlemlerine ilişkin yasal ve mali tüm muhataplık bizzat Koç'a aittir.</li>
                </ul>
              </section>

              <section>
                <h3 className="text-lg font-bold text-white mb-2">4. Platform Ücretlendirmesi ve Kullanım Bedelleri</h3>
                <ul className="list-decimal pl-5 space-y-2">
                  <li><strong>Hizmet Bedelinin Tahsili:</strong> Platform, sağladığı sunucu, CRM altyapısı, otomasyon araçları ve yazılım özellikleri karşılığında doğrudan Koç'tan önceden belirlenmiş bir "Kullanım Bedeli" (Abonelik, Öğrenci Başı Ücretlendirme veya ek modül lisans ücreti vb.) tahsil eder.</li>
                  <li><strong>Koç'un Ödeme Yükümlülüğü:</strong> Koç, Platform'un fatura ettiği kullanım bedellerini belirtilen ödeme periyotlarında aksatmadan ödemekle yükümlüdür. Ödemesi yapılmamış lisansların / hesapların kullanımının durdurulması hakkı Platforma aittir.</li>
                  <li><strong>Gelir Vergisi ve Mali Yükümlülükler:</strong> Koç, elde ettiği kendi gelirlerinin beyanından ve öğrencisine fatura / hizmet fişi kesmekten bizzat kendisi sorumludur. Platform, Koç'un ticari faaliyetlerine veya yasal defter işlemlerine iştirak etmez; oluşabilecek vergisel veya hukuki mevzuat uyuşmazlıklarında (Maliye, SGK vb. makamlarca) sorumluluk, hizmeti bedel karşılığı doğrudan sunan bağımsız Koç'un üzerindedir.</li>
                </ul>
              </section>

              <section>
                <h3 className="text-lg font-bold text-white mb-2">5. Fikri Mülkiyet ve Yazılım Kullanım Kuralları</h3>
                <p>
                  Platform bünyesinde yer alan programlama araçları, kitaplar, tasarımlar ve formlar Ömer Nasuh Akademi'nin fikri mülkiyeti altındadır. Koç bu araçları sadece aktif aboneliği süresince kendi kayıtlı öğrencileri için idari işlemlerde kullanabilir. Sistemin herhangi bir kod ya da analiz altyapısını kopyalayamaz, kiralayamaz.
                </p>
              </section>

              <section>
                <h3 className="text-lg font-bold text-white mb-2">6. Hizmet Kalitesi ve Devamsızlık</h3>
                <ul className="list-decimal pl-5 space-y-2">
                  <li>Koç, randevu planlamalarına (%95 oranında) tam riayet etmek zorundadır.</li>
                  <li>Öğrenci randevusuna mazeretsiz katılmamak, geç katılmak veya seans süresini gereksiz yere kısa/uzun tutarak verimsizleştirmek, Disiplin Yaptırımı sebebidir. Mazeretsiz olarak randevuya girilmeyen durumlar için Koç'un cüzdanından "Telafi Kesintisi" yapılabilir.</li>
                  <li>Koç, öğrenci ile profesyonel, saygılı ve argo içermeyen bir iletişim dili kurmak zorundadır.</li>
                </ul>
              </section>

              <section>
                <h3 className="text-lg font-bold text-white mb-2">7. Veri Gizliliği (KVKK)</h3>
                <p>
                  Koç, Platform üzerinden eriştiği öğrenciye ait (adres, telefon, akademik durum, sınav notu vb.) hiçbir bilgiyi üçüncü şahıslarla paylaşamaz, kendi kişisel cihazlarına indiremez veya başka bir ticari maksatla (pazarlama, reklam vb.) kullanamaz.
                </p>
              </section>

              <section>
                <h3 className="text-lg font-bold text-white mb-2">8. Koç Yükümlülükleri ve Hesap Güvenliği</h3>
                <ul className="list-decimal pl-5 space-y-2">
                  <li>Koç, kayıt sırasında verdiği profil (mezuniyet, tecrübe, unvan) bilgilerinin kanunlar önünde doğru olduğunu ve gerçeğe aykırı beyanlardan doğacak tüm zararları tazmin edeceğini kabul eder.</li>
                  <li>Şifresini gizli tutma ve hesabını üçüncü şahıslara kullandırmama sorumluluğu tamamen Koç'a aittir.</li>
                </ul>
              </section>

              <section>
                <h3 className="text-lg font-bold text-white mb-2">9. Hukuka Aykırı Kullanım ve İletişim Kuralları</h3>
                <ul className="list-decimal pl-5 space-y-2">
                  <li>Platform; yasadışı, genel ahlaka aykırı veya spam/reklam amaçlı kullanılamaz.</li>
                  <li>Koç, iletişim kurduğu kullanıcılara (öğrenci/veli) karşı argo, hakaret, tehdit, ırkçı veya nefret içerikli söylem kullanamaz. İhlal durumunda üyelik derhal silinerek yasal işlem başlatılır.</li>
                </ul>
              </section>

              <section>
                <h3 className="text-lg font-bold text-white mb-2">10. Aracı Hizmet Sağlayıcı Statüsü (5580 Sayılı Kanun İstisnası)</h3>
                <p>
                  Ömer Nasuh Akademi, 5580 sayılı Özel Öğretim Kurumları Kanunu kapsamında bir "Kurum" <strong>değildir.</strong> Koç ile öğrenciyi bir araya getiren ve idari takibi kolaylaştıran bir "Aracı Hizmet Sağlayıcı" yazılım (SaaS) platformudur. Eğitimin niteliğinden, vergi doğurucu olayından ve hukuki sorumluluğundan tamamen hizmeti doğrudan sunan Koç sorumludur. Platform, taraflar arasındaki hizmet alım-satım ifasında garantör değildir.
                </p>
              </section>

              <section>
                <h3 className="text-lg font-bold text-white mb-2">11. Sisteme Müdahale, Değişiklik ve Tek Taraflı Fesih Hakkı</h3>
                <ul className="list-decimal pl-5 space-y-2">
                  <li>Platform; altyapıyı, kullanım sözleşmesini, hizmetlerini veya özelliklerini ön ihbara gerek kalmaksızın güncelleyebilir veya geçici/kalıcı olarak durdurabilir.</li>
                  <li>Ömer Nasuh Akademi, bu sözleşmedeki kural veya yasalara uymadığı tespit edilen Koç'un üyeliğini, içindeki bakiye ve öğrencilerini de kapsayacak şekilde ön ihtar gerekmeksizin tek taraflı olarak feshetme hakkına sahiptir. Koç, bu tasarrufu gayrikabili rücu kabul eder.</li>
                </ul>
              </section>

              <section>
                <h3 className="text-lg font-bold text-white mb-2">12. İhtilafların Halli ve Yetkili Mahkeme</h3>
                <p>
                  İşbu sözleşmenin yorumlanması, ifası veya platformun kullanımı nedeniyle taraflar (Platform ve Koç) arasında çıkacak her türlü uyuşmazlığın çözümünde <strong>Aksaray Mahkemeleri ve İcra Daireleri</strong> kesin olarak yetkilidir. Platforma ait tüm dijital (sunucu, veri tabanı, log) kayıtlar, HUMK madde 287'ye uygun şekilde tek ve kesin delil sözleşmesi niteliğindedir.
                </p>
              </section>
            </>
          )}

        </div>

        <div className="px-6 py-4 border-t border-white/5 bg-slate-800/50 flex justify-end">
          <button
            onClick={onClose}
            className="bg-blue-600 hover:bg-blue-500 text-white px-6 py-2 rounded-xl font-bold transition-all text-sm"
          >
            Okudum, Anladım ve Kabul Ediyorum
          </button>
        </div>
      </div>
    </div>
  );
}
