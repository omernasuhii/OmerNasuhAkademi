export interface PageRagItem {
  id: string;
  category: 
    | 'kamu_ve_ziyaretci'    // Herkese açık sayfalar (Ziyaretçiler, Adaylar, Vitrin)
    | 'ogrenci_paneli'      // Öğrenci paneli ve özel araçları
    | 'veli_paneli'         // Veli paneli ve WhatsApp şeffaflık araçları
    | 'koc_paneli'          // Koç paneli ve 50+ öğrenci yönetim araçları
    | 'admin_paneli'        // Admin / Kurumsal yönetim araçları
    | 'topluluk_ve_sosyal'  // Topluluk, şampiyonlar ligi ve sosyal çalışma
    | 'analiz_ve_psikoloji' // 35+ psikolojik envanter ve teşhis araçları
    | 'akademik_ve_sinav'   // Sınav, soru dağılımı, metronom, YÖK atlas, MEB
    | 'finans_ve_magaza';   // Bursluluk, cüzdan, mağaza, abonelik

  title: string;
  urlPath: string;
  userRolesAllowed: ('public' | 'ogrenci' | 'veli' | 'koc' | 'admin')[];
  keywords: string[];
  
  // 1. Sayfada Neler Yapılıyor? (Eylemler & Fonksiyonlar)
  whatHappensOnPage: string[];
  
  // 2. Bağlantılı Olduğu Sayfalar & Entegrasyonlar
  connectedPages: {
    title: string;
    path: string;
    relationType: 'besler' | 'raporlar' | 'veri_aktarir' | 'yonlendirir' | 'otomasyon';
    description: string;
  }[];

  // 3. Bu Özelliğin / Sayfanın Somut Avantajları (Kullanıcıya ve Reklama Katkısı)
  keyBenefitsAndAdvantages: string[];

  // Hedef Kitle ve Psikolojik Çıkarımlar
  targetAudience: ('ogrenci' | 'veli' | 'koc' | 'sistem')[];
  painPointsSolved: string[];
  psychologicalTriggers: string[];
  callToActionButtons: string[];
  hookSuggestions: string[];
  technicalData: string;
}

export const COMPLETE_SITE_RAG_PAGES: PageRagItem[] = [
  // ==========================================
  // 1. HERKESE AÇIK / ZİYARETÇİ SAYFALARI (PUBLIC)
  // ==========================================
  {
    id: 'public_home',
    category: 'kamu_ve_ziyaretci',
    title: 'FocusON Akademi Ana Sayfa (Vitrin & 360° Ekosistem Tanıtımı)',
    urlPath: '/',
    userRolesAllowed: ['public', 'ogrenci', 'veli', 'koc', 'admin'],
    keywords: ['ana sayfa', 'focuson', 'ekosistem', 'vitrin', 'kayıt', 'tanıtım', 'yks', 'lgs', 'koçluk'],
    whatHappensOnPage: [
      'FocusON Akademi\'nin 360° ekosisteminin keşfi (Sınav Metronomu, 35+ Analiz, ÇABA Bursu, Veli WhatsApp Karnesi, Koç Paneli)',
      'Hızlı demo ve mini yetenek/potansiyel testlerine doğrudan erişim',
      'Öğrenci, veli ve koç kayıt akışlarının başlatılması',
      'YKS/LGS canlı sayaçları ve başarı hikayelerinin incelenmesi'
    ],
    connectedPages: [
      { title: 'ÇABA Potansiyel Testi', path: '/panel/ogrenci/caba-testi', relationType: 'yonlendirir', description: 'Ziyaretçiyi anında ücretsiz burs ve potansiyel testine sokar.' },
      { title: 'Sınav Metronomu & Süre Yönetimi', path: '/zaman-yonetimi', relationType: 'yonlendirir', description: 'Sınav süresi yönetimi demo aracına yönlendirir.' },
      { title: 'Kayıt Ol', path: '/kayit', relationType: 'yonlendirir', description: 'Öğrenci/Veli/Koç kayıt akışını başlatır.' }
    ],
    keyBenefitsAndAdvantages: [
      'Gelen ziyaretçiyi anında bir analizle (%100 ÇABA Bursu) yakalayıp sisteme kazandırır.',
      'Klasik dershane veya video platformu değil, bilimsel bir YKS/LGS yapay zeka ekosistemi olduğunu hissettirir.',
      'Veli ve öğrenciye ayrı ayrı güven ve somut çözüm vaat eder.'
    ],
    targetAudience: ['ogrenci', 'veli', 'koc', 'sistem'],
    painPointsSolved: ['Ezbere dershane kalıplarından bıkmış veliler ve öğrenciler', 'Güvenilir bir sınav rehberliği bulamama'],
    psychologicalTriggers: ['Merak', 'Yenilikçilik', 'Prestij', 'Bilimsel Güvenilirlik'],
    callToActionButtons: ['Hemen Keşfet', 'Ücretsiz Potansiyel Testi Yap', 'Kayıt Ol'],
    hookSuggestions: [
      'Sadece soru çözmek yetmez, YKS bir strateji ve ritim savaşıdır! FocusON ile tanış.',
      'Dershanelerin yapamadığını yapan Türkiye\'nin ilk YKS yapay zeka ekosistemi.'
    ],
    technicalData: 'Responsive Hero, Canlı Sayaçlar, İnteraktif Ekosistem Kartları, Hızlı Kayıt Modülü.'
  },
  {
    id: 'public_exam_metronome',
    category: 'akademik_ve_sinav',
    title: 'Sınav Metronomu & Süre Yönetimi (Landing & Canlı Demo)',
    urlPath: '/zaman-yonetimi',
    userRolesAllowed: ['public', 'ogrenci'],
    keywords: ['metronom', 'süre', 'zaman yönetimi', 'turlama', 'yetiştirememe', 'hız', 'ritim', 'tyt', 'panik'],
    whatHappensOnPage: [
      'TYT/AYT/LGS denemeleri çözerken soru başına ideal saniye ritmi (metronom) belirleme',
      'Turlama taktiğini sesli ve görsel vuruşlarla refleks haline getirme',
      'Bir soruya takılıp 5 dakika kaybetme krizini ortadan kaldıran canlı süre simulasyonu'
    ],
    connectedPages: [
      { title: 'Öğrenci Sınav Metronomu Paneli', path: '/panel/ogrenci/zaman-yonetimi', relationType: 'veri_aktarir', description: 'Kullanıcının antrenman verilerini öğrenci profiline kaydeder.' },
      { title: 'Derin Deneme Analizi', path: '/derin-deneme-analizi', relationType: 'besler', description: 'Hangi branşta süre kaybedildiğini analiz sayfasına raporlar.' }
    ],
    keyBenefitsAndAdvantages: [
      'Öğrencinin son 20 soruyu yetiştirememesi korkusunu yok eder.',
      'Soruya takılıp kalma huyunu sesli ritimle kırar (TYT\'de ortalama +15 net kazandırır).',
      'Sınav anındaki zaman stresini sıfıra indirir.'
    ],
    targetAudience: ['ogrenci'],
    painPointsSolved: ['TYT süresinin yetmemesi', 'Bir soruya 4-5 dakika harcayıp diğer soruları görememe', 'Sınav paniği'],
    psychologicalTriggers: ['Zaman Baskısı', 'Hız ve Refleks', 'Kriz Çözümü', 'Net Artışı'],
    callToActionButtons: ['Metronomu Başlat', 'TYT Ritim Modunu Seç', 'Süremi Yönet'],
    hookSuggestions: [
      'TYT\'de süren mi yetmiyor? Sorun bilginde değil, ritminde! Sınav Metronomu ile hızlan.',
      'Bir soruya takılıp 10 net kaybetmeye son: İşte derece öğrencilerinin turlama sırrı.'
    ],
    technicalData: 'Web Audio API sesli vuruşlar, soru başına tempo sayacı, turlama tetikleyici, tam ekran odak modu.'
  },
  {
    id: 'public_tercih_robotu',
    category: 'akademik_ve_sinav',
    title: 'YÖK Atlas Akıllı Tercih Robotu & Taban Puanları Simülatörü',
    urlPath: '/tercih-robotu',
    userRolesAllowed: ['public', 'ogrenci', 'veli'],
    keywords: ['tercih robotu', 'yök atlas', 'üniversite', 'taban puan', 'başarı sırası', 'kontenjan', 'sıralama simülatörü', 'hedef net'],
    whatHappensOnPage: [
      'Güncel YÖK Atlas taban puanları, başarı sıralamaları ve kontenjanları filtreleme',
      'Öğrencinin TYT/AYT netlerine göre gelebilecek üniversite ve bölümleri simüle etme',
      'Kişisel tercih listesi oluşturma ve risk analizini (güvenli/ideal/sürpriz) çıkarma'
    ],
    connectedPages: [
      { title: 'YÖK Atlas Detay Sayfası', path: '/yok-atlas', relationType: 'besler', description: 'Üniversite ve bölümün 5 yıllık geçmiş istatistiklerini getirir.' },
      { title: 'Öğrenci Hedefler Paneli', path: '/panel/ogrenci/hedefler', relationType: 'veri_aktarir', description: 'Seçilen bölümleri öğrencinin yıllık hedefi olarak kaydeder.' }
    ],
    keyBenefitsAndAdvantages: [
      'Gözü kapalı tercih yapma veya açıkta kalma riskini tamamen yok eder.',
      'Netlerin hangi üniversiteyi getireceğini saniyesinde göstererek çalışma motivasyonunu artırır.',
      'Velinin çocukla gerçekçi ve veriye dayalı gelecek planı yapmasını sağlar.'
    ],
    targetAudience: ['ogrenci', 'veli'],
    painPointsSolved: ['Sıralamayı yanlış tahmin etme', 'Hangi netin hangi üniversiteyi getireceğini bilememe', 'Açıkta kalma korkusu'],
    psychologicalTriggers: ['Gelecek Güvencesi', 'Hedef Netliği', 'Başarı Tutkusu'],
    callToActionButtons: ['Tercihini Simüle Et', 'Kazanabileceğin Üniversiteleri Gör', 'Hedefine Ekle'],
    hookSuggestions: [
      'Kaç netle hangi üniversiteye gidersin? YÖK Atlas Akıllı Tercih Robotu ile geleceğini simüle et!',
      'Tercih dönemi şansa bırakılmaz: 5 yıllık sıralama trendleriyle en doğru tercih listesi.'
    ],
    technicalData: 'YÖK Atlas API verisi, sıralama hesaplayıcı, çoklu filtreleme, PDF tercih listesi çıktısı.'
  },
  {
    id: 'public_for_coaches',
    category: 'koc_paneli',
    title: 'Koçlar İçin Başvuru & Ekosistem Katılım Sayfası',
    urlPath: '/koclar-icin',
    userRolesAllowed: ['public', 'koc'],
    keywords: ['koçluk', 'koç başvurusu', 'öğretmen', 'mentör', 'öğrenci takip', 'ek gelir', 'veli raporlama', 'dijital panel'],
    whatHappensOnPage: [
      'Koçluk yapmak isteyen öğretmen ve derece öğrencilerinin başvuru formunu doldurması',
      'FocusON Akademi\'nin koçlara sunduğu 50+ öğrenci yönetim panelleri, 35+ analiz araçları ve gelir modelinin incelenmesi',
      'Ön değerlendirme ve onay süreçlerinin aktarılması'
    ],
    connectedPages: [
      { title: 'Koç Başvuru & Kayıt', path: '/koc-basvuru', relationType: 'yonlendirir', description: 'Koçun sisteme evrak ve profil yüklemesini sağlar.' },
      { title: 'Admin Koç Onayları', path: '/panel/admin/koc-onaylari', relationType: 'besler', description: 'Başvuruyu admin onay havuzuna iletir.' },
      { title: 'Koç Yönetim Paneli', path: '/panel/koc', relationType: 'yonlendirir', description: 'Onaylanan koçun çalışma alanına yönlendirir.' }
    ],
    keyBenefitsAndAdvantages: [
      'Koçlara excel ve kağıtla uğraşmadan 50+ öğrenciyi profesyonelce yönetme imkanı verir.',
      'Otomatik veli raporlaması sayesinde koçun veliyle olan haftalık iletişim yükünü %80 azaltır.',
      'Yüksek ek gelir ve Türkiye çapında öğrenci portföyü sunar.'
    ],
    targetAudience: ['koc'],
    painPointsSolved: ['Öğrenci takibini excelde kaybetme', 'Velilere her hafta tek tek hesap verme yorgunluğu', 'Öğrenci bulamama'],
    psychologicalTriggers: ['Mesleki Prestij', 'Zaman Tasarrufu', 'Yüksek Gelir', 'Teknolojik Güç'],
    callToActionButtons: ['Koç Olarak Katıl', 'Başvuru Formunu Doldur', 'Sistemi İncele'],
    hookSuggestions: [
      'Koçluk yaparken excel tablolarında kaybolmayın! 35+ analiz ve otomatik veli raporuyla profesyonelleşin.',
      'Öğrencilerini yapay zeka destekli panellerle yönet, haftalık veli krizlerinden kurtul.'
    ],
    technicalData: 'Koç başvuru formu, CV/sertifika yükleme, onay akışı.'
  },
  {
    id: 'academic_yks_topics_and_distribution',
    category: 'akademik_ve_sinav',
    title: 'YKS Konuları & Son 10 Yılın Çıkmış Soru Dağılımı Haritası',
    urlPath: '/soru-dagilimi',
    userRolesAllowed: ['public', 'ogrenci', 'koc'],
    keywords: ['soru dağılımı', 'çıkmış sorular', 'ösym', 'garanti net', 'yks konuları', 'tyt matematik', 'ısı haritası', 'müfredat'],
    whatHappensOnPage: [
      'ÖSYM\'nin son 10 yılda TYT ve AYT\'de hangi konudan kaç soru sorduğunun interaktif ısı haritası',
      'Yüksek getiri sağlayan (Garanti Net) konuların filtrelenmesi',
      'Öğrencinin az vakti kaldığında en çok soru çıkan konulara öncelik vermesini sağlama'
    ],
    connectedPages: [
      { title: 'YKS Konuları Müfredat Listesi', path: '/yks-konulari', relationType: 'besler', description: 'Her konunun alt kazanımlarını detaylandırır.' },
      { title: 'Öğrenci Hedef Paneli', path: '/panel/ogrenci/hedefler', relationType: 'veri_aktarir', description: 'Garanti konuları öğrencinin öncelikli hedef listesine ekler.' }
    ],
    keyBenefitsAndAdvantages: [
      'Öğrencinin hiç soru çıkmayan gereksiz konularla haftalarca vakit kaybetmesini engeller.',
      'Sınava az süre kaldığında en hızlı net getiren konuları nokta atışı gösterir.',
      'Stratejik çalışma planı oluşturarak net artışını garantiye alır.'
    ],
    targetAudience: ['ogrenci', 'koc'],
    painPointsSolved: ['Hangi konudan soru çıkacağını bilememe', 'Zamanı yanlış konulara harcama stresi'],
    psychologicalTriggers: ['Stratejik Üstünlük', 'Hızlı Kazanç', 'Garanti Net'],
    callToActionButtons: ['Soru Dağılımını İncele', 'Garanti Konuları Gör', 'Planını Oluştur'],
    hookSuggestions: [
      'Tüm konulara aynı vakti ayırma! Son 10 yılın ÖSYM analizine göre en çok net getiren konuları gör.',
      '1 ayda +15 Net Stratejisi: ÖSYM\'nin her yıl kesin sorduğu garanti konular haritası.'
    ],
    technicalData: 'İnteraktif ısı haritaları, son 10 yıl ÖSYM soru matrisi, filtreleme motoru.'
  },
  {
    id: 'academic_channel_and_material',
    category: 'akademik_ve_sinav',
    title: 'YKS En İyi YouTube Kanal Önerileri & MEBİ / OGM Materyal Havuzu',
    urlPath: '/kanal-onerileri',
    userRolesAllowed: ['public', 'ogrenci'],
    keywords: ['youtube', 'kanal önerisi', 'hocalar', 'mebi', 'ogm materyal', 'eba', 'ders videosu', 'ücretsiz kaynak'],
    whatHappensOnPage: [
      'Matematik, Fizik, Kimya, Türkçe vb. tüm branşlarda Türkiye\'nin en verimli YouTube hocalarının seviye bazlı listesi (Başlangıç, Orta, Derece)',
      'MEBİ, OGM Materyal ve EBA Akademik Destek kaynaklarına tek tıkla doğrudan erişim'
    ],
    connectedPages: [
      { title: 'EBA & MEBİ Destek', path: '/mebi', relationType: 'yonlendirir', description: 'Resmi MEB platformlarına geçiş sağlar.' },
      { title: 'Öğrenci Programı', path: '/panel/ogrenci/program', relationType: 'besler', description: 'Seçilen kanal videolarını haftalık ders programına video ödevi olarak ekler.' }
    ],
    keyBenefitsAndAdvantages: [
      'Öğrencinin saatlerce YouTube\'da hoca arayarak vakit kaybetmesini önler.',
      'Kendi seviyesine (0-10 net vs 30+ net) en uygun anlatan hocayı hemen bulmasını sağlar.'
    ],
    targetAudience: ['ogrenci'],
    painPointsSolved: ['Hangi hocadan dinleyeceğini bilememe', 'Kötü anlatımla vakit kaybetme'],
    psychologicalTriggers: ['En İyisini Seçme', 'Vakit Tasarrufu', 'Doğru Rehberlik'],
    callToActionButtons: ['En İyi Kanalları Gör', 'Seviyene Göre Hoca Seç', 'Ücretsiz İzle'],
    hookSuggestions: [
      'Hangi YouTube hocasından çalışmalısın? Seviyene en uygun Türkiye\'nin en iyi YKS hocaları listesi.',
      'YouTube deryasında kaybolma! Derece yaptıran en iyi ders kanalları burada.'
    ],
    technicalData: 'Kategori ve seviye bazlı video içerik kürasyonu, MEBİ ve OGM Materyal API bağlantıları.'
  },
  {
    id: 'public_score_calculator',
    category: 'akademik_ve_sinav',
    title: 'YKS Puan ve Sıralama Hesaplama Motoru',
    urlPath: '/yks-puan-hesaplama',
    userRolesAllowed: ['public', 'ogrenci'],
    keywords: ['puan hesaplama', 'tyt puanı', 'ayt puanı', 'obp', 'sıralama', 'katsayı', 'öbyp'],
    whatHappensOnPage: [
      'TYT, AYT ve YDT netlerini ve OBP okul puanını girerek güncel ÖSYM katsayılarıyla ham ve yerleştirme puanlarını anında hesaplama',
      'Geçmiş yılların sıralama karşılıklarını görme'
    ],
    connectedPages: [
      { title: 'YÖK Atlas Tercih Robotu', path: '/tercih-robotu', relationType: 'yonlendirir', description: 'Hesaplanan puanı tercih robotuna aktarır.' }
    ],
    keyBenefitsAndAdvantages: ['Katsayı yanılmalarını önler, öğrenciye anlık hedef netliği verir.'],
    targetAudience: ['ogrenci'],
    painPointsSolved: ['Netlerin puana ve sıralamaya nasıl yansıyacağını bilememe'],
    psychologicalTriggers: ['Merak', 'Hedef', 'Hesap'],
    callToActionButtons: ['Puanını Hesapla', 'Sıralamanı Gör'],
    hookSuggestions: ['Bu netlerle kaç bininci olursun? Güncel katsayılarla YKS puanını hesapla.'],
    technicalData: 'ÖSYM katsayı motoru, OBP hesaplayıcı.'
  },
  {
    id: 'public_job_guide',
    category: 'kamu_ve_ziyaretci',
    title: 'Geleceğin Meslekleri & Kariyer Rehberi',
    urlPath: '/meslek-rehberi',
    userRolesAllowed: ['public', 'ogrenci', 'veli'],
    keywords: ['meslek rehberi', 'kariyer', 'maaş', 'iş imkanı', 'yazılım', 'tıp', 'hukuk', 'mühendislik'],
    whatHappensOnPage: [
      '200+ mesleğin gelecekteki geçerliliği, maaş skalaları, gereken YKS sıralamaları ve yetkinlikleri'
    ],
    connectedPages: [
      { title: 'Tercih Robotu', path: '/tercih-robotu', relationType: 'besler', description: 'Meslekten üniversite bölümlerine yönlendirir.' }
    ],
    keyBenefitsAndAdvantages: ['Öğrencinin bilinçli bölüm seçmesini ve meslek motivasyonu kazanmasını sağlar.'],
    targetAudience: ['ogrenci', 'veli'],
    painPointsSolved: ['Hangi mesleği seçeceğini bilememe'],
    psychologicalTriggers: ['Gelecek Güvencesi', 'Kariyer Vizyonu'],
    callToActionButtons: ['Meslekleri Keşfet', 'Maaş ve Şartları İncele'],
    hookSuggestions: ['Geleceğin mesleklerinde yerini al! 200+ mesleğin YKS sıralaması ve kariyer haritası.'],
    technicalData: 'Meslek veri tabanı, filtreleme ve detay kartları.'
  },

  // ==========================================
  // 2. ÖĞRENCİ PANELİ & DERİN ARAÇLAR (STUDENT)
  // ==========================================
  {
    id: 'student_caba_test',
    category: 'ogrenci_paneli',
    title: 'Öğrenci ÇABA Bursluluk & Potansiyel Testi Sayfası',
    urlPath: '/panel/ogrenci/caba-testi',
    userRolesAllowed: ['ogrenci', 'admin'],
    keywords: ['çaba testi', 'bursluluk', 'potansiyel', 'ücretsiz burs', 'öğrenci analizi', 'azim', 'öz-disiplin'],
    whatHappensOnPage: [
      'Öğrencinin 35 soruluk çok boyutlu ÇABA (Çalışma, Azim, Bilişsel Direnç, Analitik Güç) testini çözmesi',
      'Test sonucunda öğrencinin gerçek potansiyel puanının ve eksik yönlerinin hesaplanması',
      '%100\'e varan burs hakkı kazanması ve karne PDF\'inin üretilmesi'
    ],
    connectedPages: [
      { title: 'Öğrenci Özet Paneli', path: '/panel/ogrenci', relationType: 'besler', description: 'ÇABA puanını öğrenci dashboard\'una yerleştirir.' },
      { title: 'Koç Öğrenci Detayı', path: '/panel/koc/ogrenci', relationType: 'veri_aktarir', description: 'Koçun öğrencinin zihinsel dayanıklılığını görmesini sağlar.' },
      { title: 'Veli Raporları', path: '/panel/veli/raporlar', relationType: 'raporlar', description: 'Veliye çocuğunun potansiyel karnesini iletir.' }
    ],
    keyBenefitsAndAdvantages: [
      'Öğrenci sadece sınav netine bakılıp "başarısız" damgası yemekten kurtulur.',
      'Kendi potansiyelini görüp özgüvenini tazeler.',
      'Koçluk ve platform özelliklerine burslu/ücretsiz erişim hakkı kazanır.'
    ],
    targetAudience: ['ogrenci', 'veli'],
    painPointsSolved: ['Düşük netler yüzünden özgüven çöküşü', 'Maddi yetersizlikten koçluk alamama korkusu'],
    psychologicalTriggers: ['Hak Edilmiş Başarı', 'Burs Fırsatı', 'Özgüven', 'Kendini Kanıtlama'],
    callToActionButtons: ['Teste Başla', 'Potansiyelini Ölç', 'Burs Karneni Al'],
    hookSuggestions: [
      'Ezberciler değil, azmedenler kazanıyor! 15 dakikalık ÇABA Testi ile %100 burs fırsatını yakala.',
      'Netlerin düşük olabilir ama potansiyelin yüksek! ÇABA Testi ile gerçek gücünü gör.'
    ],
    technicalData: '35 Likert sorusu, otomatik algoritma skorlama, dinamik burs yüzdesi, anlık PDF üretimi.'
  },
  {
    id: 'student_deep_analyses',
    category: 'analiz_ve_psikoloji',
    title: '35+ Bilimsel Psikolojik & Akademik Teşhis Merkezi (DOPA, MERCEK, VAK-S, GTS-36...)',
    urlPath: '/panel/ogrenci/analizler',
    userRolesAllowed: ['ogrenci', 'admin'],
    keywords: ['35 analiz', 'dopa', 'mercek', 'vak-s', 'gts-36', 'çikolata', 'amid', 'dart', 'öz-af', 'abba', 'ag-mot', 'hirat', 'aid-y', 'adte-20', 'psikolojik teşhis', 'dikkat dağınıklığı', 'sınav kaygısı'],
    whatHappensOnPage: [
      'MERCEK (Odak), DOPA (Dopamin), VAK (Görsel/İşitsel/Kinestetik), GTS-36 (Sınav Kaygısı), ÇİKOLATA, AMİD gibi 35+ testin çözülmesi',
      'Öğrencinin dikkat süresi, erteleme alışkanlığı ve öğrenme kanalının bilimsel olarak teşhis edilmesi',
      'Her test için kişiselleştirilmiş rehberlik reçetesinin üretilmesi'
    ],
    connectedPages: [
      { title: 'Öğrenci Çalışma Programı', path: '/panel/ogrenci/program', relationType: 'besler', description: 'Ders programını öğrencinin odak süresine göre (örn: 25dk pomodoro vs 50dk blok) ayarlar.' },
      { title: 'Koç Derin Analiz Masası', path: '/panel/koc/ogrenci/derin-analiz', relationType: 'veri_aktarir', description: 'Koçun öğrenciye ezbere değil teşhise göre reçete yazmasını sağlar.' },
      { title: 'Veli Kişilik & Gelişim Analizi', path: '/panel/veli/kisilik-analizi', relationType: 'raporlar', description: 'Veliye çocuğunun dikkat ve öğrenme özelliklerini açıklar.' }
    ],
    keyBenefitsAndAdvantages: [
      'Öğrenciye "Neden ders çalışamıyorum?" sorusunun bilimsel cevabını verir (tembellik değil dikkat/öğrenme stili).',
      'Koça ezbere program yaptırmaz, kişiye özel ders reçetesi çıkarır.',
      'Sınav kaygısını ve telefon ertelemesini kökten çözer.'
    ],
    targetAudience: ['ogrenci', 'koc', 'veli'],
    painPointsSolved: ['Ders başına oturup 15 dakikada sıkılma', 'Sınav anında panikleme ve bildiğini unutma', 'Ezbere programların tutmaması'],
    psychologicalTriggers: ['Kendini Tanıma', 'Bilimsel Teşhis', 'Rahatlama', 'Çözüm Netliği'],
    callToActionButtons: ['Analiz Bataryasını Aç', 'Hemen Testi Çöz', 'Reçeteni İncele'],
    hookSuggestions: [
      'Ders çalışamamanın sebebi tembellik değil, beyninin öğrenme stili! 35 Bilimsel Testle kendini çöz.',
      'Koçun seni tanımadan program yazmasın: Türkiye\'nin en gelişmiş psikometrik analiz merkezi.'
    ],
    technicalData: '35 psikometrik envanter motoru, radar grafikleri, güçlü/zayıf yön analitiği, PDF karne.'
  },
  {
    id: 'student_ai_assistant',
    category: 'ogrenci_paneli',
    title: 'Öğrenci 7/24 Sesli & Görsel AI Soru Çözüm Asistanı',
    urlPath: '/panel/ogrenci/ai-asistan',
    userRolesAllowed: ['ogrenci', 'admin'],
    keywords: ['ai asistan', 'sesli soru çözüm', 'gece soru çözümü', 'fotoğraf yükleme', 'özel ders', 'yapay zeka', 'matematik', 'fizik'],
    whatHappensOnPage: [
      'Öğrencinin çözemediği sorunun fotoğrafını yüklemesi veya sesli olarak soru sorması',
      'Yapay zekanın soruyu sadece çözmekle kalmayıp hangi konudan olduğunu, püf noktasını ve mantığını sesli anlatması',
      'Eksik olan konu kazanımını anında öğrencinin çalışma listesine eklemesi'
    ],
    connectedPages: [
      { title: 'Deneme Takibi & Eksik Konular', path: '/panel/ogrenci/denemeler', relationType: 'besler', description: 'Yapılamayan soruları branş ve konu eksik havuzuna atar.' },
      { title: 'Koç AI Sohbetleri Takibi', path: '/panel/koc/ogrenci/ai-sohbetleri', relationType: 'veri_aktarir', description: 'Koçun öğrencinin gece hangi konularda takıldığını görmesini sağlar.' }
    ],
    keyBenefitsAndAdvantages: [
      'Gece saat 02:00\'de bile takıldığı sorunun cevabını bekletmeden, sesli ve adım adım öğrenir.',
      'Sadece şıkkı vermez; sorunun arkasındaki mantığı öğreterek benzer sorularda hata yapılmasını önler.',
      'Özel ders hocasına soru sorma çekingenliğini veya soru biriktirme sorununu bitirir.'
    ],
    targetAudience: ['ogrenci'],
    painPointsSolved: ['Gece çözülemeyen sorularda takılıp kalma', 'Hocalara soru sormak için sıra bekleme', 'Sorunun sadece cevabını öğrenip mantığını anlayamama'],
    psychologicalTriggers: ['Anında Rahatlama', '7/24 Kesintisiz Destek', 'Özgüven', 'Eksiksiz Öğrenme'],
    callToActionButtons: ['Sorunun Fotoğrafını Yükle', 'Sesli Soru Sor', 'Çözümü Dinle'],
    hookSuggestions: [
      'Gece 01:00\'de takıldığın matematik sorusunu kime soracaksın? 7/24 Sesli AI Asistanın yanında!',
      'Sadece cevabı değil, sorunun mantığını anlatan yapay zeka soru asistanı.'
    ],
    technicalData: 'Gemini 2.5 Flash Vision & Text-to-Speech sesli anlatım, OCR matematik formül ayrıştırıcı.'
  },
  {
    id: 'student_exams_and_analysis',
    category: 'akademik_ve_sinav',
    title: 'Öğrenci Deneme Takibi & Derin Hata Karnesi',
    urlPath: '/panel/ogrenci/denemeler',
    userRolesAllowed: ['ogrenci', 'admin'],
    keywords: ['deneme takibi', 'derin hata karnesi', 'net analizi', 'sıralama tahmini', 'dikkat hatası', 'bilgi eksiği', 'tyt deneme'],
    whatHappensOnPage: [
      'Çözülen tüm TYT, AYT ve branş denemelerinin net, süre ve konu bazlı girilmesi',
      'Hataların türlerine göre ayrıştırılması (Bilgi Eksikliği, Dikkat Hatası, Süre Yetişmeme, Yanlış Okuma)',
      'Grafiklerle net artış trendi ve tahmini YKS sıralamasının takip edilmesi'
    ],
    connectedPages: [
      { title: 'Koçluk Deneme Sonuçları', path: '/panel/koc/ogrenci/sonuclar', relationType: 'veri_aktarir', description: 'Koçun deneme analizini masaya yatırmasını sağlar.' },
      { title: 'Veli Deneme Sonuçları', path: '/panel/veli/deneme-sonuclari', relationType: 'raporlar', description: 'Veliye her deneme sonrası anlık karne sunar.' },
      { title: 'Haftalık WhatsApp Karnesi', path: '/v', relationType: 'otomasyon', description: 'Deneme sonuçlarını velinin WhatsApp\'ına otomatik PDF olarak gönderir.' }
    ],
    keyBenefitsAndAdvantages: [
      'Öğrenci "Çalışıyorum ama netlerim artmıyor" çıkmazından kurtulur, hangi hatanın net çaldığını görür.',
      'Sınav provası refleksini ve net disiplinini sağlar.',
      'Koç ile yapılan görüşmelerin 10 kat daha verimli geçmesini sağlar.'
    ],
    targetAudience: ['ogrenci', 'koc', 'veli'],
    painPointsSolved: ['Netlerin yerinde sayması', 'Dikkat hatalarının nedenini bulamama', 'Hangi konuya çalışacağını bilememe'],
    psychologicalTriggers: ['İlerleme Hissi', 'Net Kontrolü', 'Gelişim Motivasyonu'],
    callToActionButtons: ['Deneme Ekle', 'Hata Röntgenini İncele', 'Tahmini Sıralamanı Gör'],
    hookSuggestions: [
      'Çalışıyorsun ama netlerin artmıyor mu? Sorun bilmemen değil, hata türün! Deneme analiziyle netlerini uçur.',
      'Her deneme bir fırsat: Hangi soruda neden hata yaptığını gösteren derin analiz sistemi.'
    ],
    technicalData: 'Recharts net trend grafikleri, konu bazlı başarı matrisi, tahmini sıralama motoru.'
  },

  // ==========================================
  // 3. VELİ PANELİ & WHATSAPP OTOMASYONU (PARENT)
  // ==========================================
  {
    id: 'parent_whatsapp_weekly_report',
    category: 'veli_paneli',
    title: 'Haftalık Otomatik Veli WhatsApp Gelişim Karnesi (Pazar Raporu)',
    urlPath: '/v',
    userRolesAllowed: ['public', 'veli'],
    keywords: ['veli whatsapp karnesi', 'pazar raporu', 'veli takibi', 'otomatik bildirim', 'ders kavgası', 'anne baba', 'şeffaf karne'],
    whatHappensOnPage: [
      'Her pazar akşamı velinin WhatsApp hattına otomatik gelen güvenli tek tık linki',
      'Öğrencinin son 7 günlük çalışma süresi, soru hedefi başarısı, koç yorumu ve deneme netlerinin mobil karnesi',
      'Veliye özel rehberlik tavsiyesi (Örn: "Bu hafta çocuğunuz çok yoruldu, ona destek olun")'
    ],
    connectedPages: [
      { title: 'Veli Paneli', path: '/panel/veli', relationType: 'besler', description: 'Detaylı geçmiş raporlara yönlendirir.' },
      { title: 'Koç Değerlendirme Masası', path: '/panel/koc/degerlendirme', relationType: 'veri_aktarir', description: 'Koçun yazdığı haftalık veli notunu otomatik mesaja ekler.' }
    ],
    keyBenefitsAndAdvantages: [
      'Velinin hiçbir şifre veya uygulama açmadan doğrudan WhatsApp\'tan 10 saniyede çocuğunu takip etmesini sağlar.',
      'Eğitim kurumunun profesyonelliğini ve veliye verdiği değeri en üst düzeye çıkarır.',
      'Evdeki "Ders çalıştın mı?" kavgalarını tamamen bitirir.'
    ],
    targetAudience: ['veli'],
    painPointsSolved: ['Uygulama şifrelerini unutan veliler', 'Haftalarca rehberlik öğretmeninden haber alamama', 'Belirsizlik ve güvensizlik stresi'],
    psychologicalTriggers: ['Anında Erişim', 'Sıfır Çaba ile Takip', 'Şeffaflık', 'Huzur'],
    callToActionButtons: ['Karnemi WhatsApp\'tan Al', 'Örnek Raporu İncele', 'Bildirimleri Aç'],
    hookSuggestions: [
      'Her pazar akşamı WhatsApp\'ınıza gelen 1 sayfalık karneyle çocuğunuzun YKS maratonunu huzurla takip edin.',
      'Şifre yok, karmaşa yok: Tek tıkla WhatsApp üzerinden çocuğunuzun haftalık çalışma karnesi cebinizde.'
    ],
    technicalData: 'WhatsApp Cloud API / Webhook entegrasyonu, güvenli token linki, mobil uyumlu kart.'
  },
  {
    id: 'parent_dashboard_and_reports',
    category: 'veli_paneli',
    title: 'Veli Kontrol Paneli & Şeffaf Gelişim Masası',
    urlPath: '/panel/veli',
    userRolesAllowed: ['veli', 'admin'],
    keywords: ['veli paneli', 'şeffaf takip', 'koç görüşmesi', 'veli randevu', 'gelişim grafiği', 'huzur'],
    whatHappensOnPage: [
      'Öğrencinin haftalık kaç saat çalıştığını, kaç soru çözdüğünü ve deneme netlerini tek bakışta görme',
      'Koç ile yapılan görüşme notlarını ve öğrencinin psikolojik durumunu takip etme',
      'Gelişim karnelerini ve randevu durumlarını inceleme'
    ],
    connectedPages: [
      { title: 'Veli WhatsApp Karnesi', path: '/v', relationType: 'otomasyon', description: 'Her pazartesi velinin telefonuna gelen özet karne bağlantısı.' },
      { title: 'Veli Deneme Sonuçları', path: '/panel/veli/deneme-sonuclari', relationType: 'besler', description: 'Tüm denemelerin detaylı karnesini gösterir.' },
      { title: 'Veli Randevu Talebi', path: '/panel/veli/randevular', relationType: 'yonlendirir', description: 'Koç ile veli görüşmesi planlamayı sağlar.' }
    ],
    keyBenefitsAndAdvantages: [
      'Evdeki gerginliği ve belirsizliği tamamen bitirir.',
      'Veliye kuruşu kuruşuna, dakikası dakikasına şeffaf bir takip ve huzur sağlar.',
      'Öğrencinin gizli saklı kalmadan koç gözetiminde disiplinle çalıştığını kanıtlar.'
    ],
    targetAudience: ['veli'],
    painPointsSolved: ['Çocuğun ders çalışıp çalışmadığını bilememe', 'Evde sürekli ders kavgası çıkması', 'Dershanelerden geri bildirim alamama'],
    psychologicalTriggers: ['Huzur', 'Kontrol ve Güven', 'Aile İçi Barış', 'Şeffaflık'],
    callToActionButtons: ['Haftalık Raporu İncele', 'Gelişim Karnesini Gör', 'Koçla Görüşme Ayarla'],
    hookSuggestions: [
      'Çocuğunuzla "Ders çalıştın mı?" kavgasına son! Tüm süreç her pazar telefonunuzda.',
      'Sınav sürecinde evdeki huzuru geri getiren sistem: FocusON Veli Şeffaflık Paneli.'
    ],
    technicalData: 'Veli dashboard\'u, haftalık saat/soru sayaçları, koç görüşme özetleri.'
  },

  // ==========================================
  // 4. KOÇ PANELİ & MENTÖRLÜK (COACH)
  // ==========================================
  {
    id: 'coach_student_management',
    category: 'koc_paneli',
    title: 'Koç Öğrenci Masası, 50+ Öğrenci Takip Paneli & Birebir Program',
    urlPath: '/panel/koc/ogrenci',
    userRolesAllowed: ['koc', 'admin'],
    keywords: ['koç paneli', '50 öğrenci yönetimi', 'birebir program', 'veri girişi', 'ödev takibi', 'mentörlük', 'kanban'],
    whatHappensOnPage: [
      'Koçun sorumlu olduğu öğrencinin tüm analizlerini, hedeflerini ve haftalık ders programını yönetmesi',
      'Öğrencinin çözemediği soruları ve AI sohbet geçmişini inceleyip eksiklerine göre müfredat planlaması',
      'Haftalık görüşme notlarını girip veli raporunu tek tıkla onaylaması'
    ],
    connectedPages: [
      { title: 'Koç Asistanı & AI', path: '/panel/koc/asistan', relationType: 'besler', description: 'Yapay zeka koça öğrenci için en ideal çalışma programı taslağını önerir.' },
      { title: 'Öğrenci Çalışma Programı', path: '/panel/ogrenci/program', relationType: 'veri_aktarir', description: 'Koçun onayladığı programı anında öğrencinin ekranına yansıtır.' },
      { title: 'Veli Raporları', path: '/panel/veli/raporlar', relationType: 'otomasyon', description: 'Koçun notlarını otomatik veli bültenine dönüştürür.' }
    ],
    keyBenefitsAndAdvantages: [
      'Koça 10 kat daha hızlı ve bilimsel çalışma programı hazırlama gücü verir.',
      'Öğrencinin motivasyon düşüşünü grafiklerden anında fark edip erken müdahale etmesini sağlar.',
      'Öğrencinin gerçek bir mentörle hedefe kilitlenmesini sağlar.'
    ],
    targetAudience: ['koc', 'ogrenci'],
    painPointsSolved: ['Öğrenciye her hafta aynı ezbere programı yazma tıkanıklığı', 'Öğrencinin takibini kaçırma'],
    psychologicalTriggers: ['Profesyonel Ustalık', 'Kişiye Özel İlgi', 'Başarı Garantisi'],
    callToActionButtons: ['Öğrenci Masasını Aç', 'Programı Onayla', 'Gelişimi İncele'],
    hookSuggestions: [
      'Ezbere koçluk değil, veri odaklı mentörlük! Türkiye\'nin derece koçları FocusON panelleriyle çalışıyor.',
      'Öğrencini sadece dinleme, 35 analizle beyninin çalışma haritasını çıkararak yönlendir.'
    ],
    technicalData: 'Kanban ders programı yöneticisi, takvim entegrasyonu, veri girişi motoru.'
  },
  {
    id: 'coach_ai_assistant_panel',
    category: 'koc_paneli',
    title: 'Koçun Yapay Zeka Süpervizör & Program Taslak Asistanı',
    urlPath: '/panel/koc/asistan',
    userRolesAllowed: ['koc', 'admin'],
    keywords: ['koç ai asistan', 'süpervizör', 'program hazırlama', 'meb müfredat dengesi', 'koçluk stratejisi'],
    whatHappensOnPage: [
      'Koçun öğrencinin deneme netlerini ve eksik konularını yapay zekaya analiz ettirmesi',
      'AI Asistanın koça özel strateji, konu dağılımı ve haftalık soru hedefi reçetesi önermesi',
      'Zorlu veli görüşmeleri veya motivasyonu düşen öğrenciler için rehberlik tavsiyeleri alması'
    ],
    connectedPages: [
      { title: 'Koç Öğrenci Programı', path: '/panel/koc/ogrenci/program', relationType: 'besler', description: 'Önerilen programı tek tıkla öğrencinin takvimine aktarır.' },
      { title: 'Öğrenci Derin Analizi', path: '/panel/koc/ogrenci/derin-analiz', relationType: 'veri_aktarir', description: 'Psikolojik test verilerini yapay zekanın süpervizyonuna sokar.' }
    ],
    keyBenefitsAndAdvantages: [
      'Koçun program hazırlama süresini 1 saatten 2 dakikaya indirir.',
      'Hatasız ve MEB müfredatına %100 uyumlu soru/konu dengesi kurar.',
      'Koçun profesyonel kalitesini ve öğrenci başarı oranını katlar.'
    ],
    targetAudience: ['koc'],
    painPointsSolved: ['Saatlerce ders programı hazırlamakla vakit kaybetme', 'Öğrencinin hangi konudan soru çözmesi gerektiğini kaçırma'],
    psychologicalTriggers: ['Zaman Tasarrufu', 'Yüksek Verim', 'Hatasız Planlama'],
    callToActionButtons: ['AI Asistanı Başlat', 'Öğrenci Analizini İste', 'Programı Oluştur'],
    hookSuggestions: [
      'Koçlar için yapay zeka devrimi: 2 dakikada öğrencinin eksiklerine tam oturan haftalık çalışma programı.',
      'Süpervizör AI Asistanı ile koçluk kalitenizi zirveye taşıyın.'
    ],
    technicalData: 'Gemini 2.5 Flash koçluk süpervizör prompt zinciri, otomatik takvim şablonlayıcı.'
  },

  // ==========================================
  // 5. TOPLULUK & SOSYAL SAYFALAR
  // ==========================================
  {
    id: 'community_feed_and_champions',
    category: 'topluluk_ve_sosyal',
    title: 'FocusON Öğrenci Topluluğu, Şampiyonlar Ligi & Pomodoro Odaları',
    urlPath: '/topluluk',
    userRolesAllowed: ['ogrenci', 'koc', 'admin'],
    keywords: ['topluluk', 'şampiyonlar ligi', 'liderlik tablosu', 'pomodoro odaları', 'study with me', 'rozetler', 'tatlı rekabet'],
    whatHappensOnPage: [
      'YKS/LGS öğrencilerinin ders çalışma sürelerini, pomodoro sayaçlarını ve soru hedeflerini paylaşması',
      'Şampiyonlar Liginde haftalık ve aylık çalışma liderlik tablosunda yarışma',
      'Birlikte çalışma odaları (Study with me) ve motivasyon paylaşımları'
    ],
    connectedPages: [
      { title: 'Öğrenci Profil & Rozetler', path: '/profil', relationType: 'besler', description: 'Kazanılan rozetleri ve çalışma seviyesini gösterir.' },
      { title: 'Öğrenci Cüzdan & Ödüller', path: '/panel/ogrenci/cuzdan', relationType: 'veri_aktarir', description: 'Toplulukta dereceye girenlere puan ve indirim kuponu kazandırır.' }
    ],
    keyBenefitsAndAdvantages: [
      'Öğrencinin evde tek başına çalışırken yaşadığı yalnızlık ve motivasyon kaybını yok eder.',
      'Akran öğrenmesi ve tatlı bir rekabetle günlük çalışma süresini ortalama 2.5 saat artırır.',
      'Sosyal medyada vakit kaybetmek yerine odaklanan bir toplulukta motive olmasını sağlar.'
    ],
    targetAudience: ['ogrenci'],
    painPointsSolved: ['Yalnız ders çalışırken çabuk sıkılma', 'Masa başına oturacak motivasyon bulamama'],
    psychologicalTriggers: ['Sosyal Kanıt', 'Rekabet ve Oyunlaştırma', 'Ait Olma Hissi', 'Başarı Rozetleri'],
    callToActionButtons: ['Topluluğa Katıl', 'Şampiyonlar Ligine Gir', 'Bugün Kaç Saat Çalıştın?'],
    hookSuggestions: [
      'Tek başına ders çalışırken sıkılıyor musun? Türkiye\'nin en hırslı YKS topluluğunda yerini al!',
      'Şampiyonlar Liginde yarış, ders çalıştıkça rozetleri ve burs puanlarını topla.'
    ],
    technicalData: 'Canlı akış, liderlik sıralaması, etkileşim ve rozetleme mekanizması.'
  },

  // ==========================================
  // 6. FİNANS, MAĞAZA & CÜZDAN
  // ==========================================
  {
    id: 'finance_wallet_and_store',
    category: 'finans_ve_magaza',
    title: 'Öğrenci Cüzdan, Burs Bakiyesi & Mağaza',
    urlPath: '/panel/ogrenci/magaza',
    userRolesAllowed: ['ogrenci', 'admin'],
    keywords: ['cüzdan', 'mağaza', 'burs bakiyesi', 'kupon', 'indirim', 'koçluk paketi', 'deneme seti'],
    whatHappensOnPage: [
      'ÇABA testi burslarının, kazanılan rozet puanlarının cüzdanda nakit veya indirim kuponuna dönüşmesi',
      'Birebir koçluk paketleri, basılı deneme setleri ve analiz raporlarının satın alınması'
    ],
    connectedPages: [
      { title: 'ÇABA Bursluluk Testi', path: '/panel/ogrenci/caba-testi', relationType: 'besler', description: 'Kazanılan burs indirimini cüzdana tanımlar.' },
      { title: 'Öğrenci Cüzdanı', path: '/panel/ogrenci/cuzdan', relationType: 'veri_aktarir', description: 'Bakiye ve işlem geçmişini yönetir.' }
    ],
    keyBenefitsAndAdvantages: [
      'Çalışan ve çaba gösteren her öğrenciye kendi eğitim bütçesini kazanma fırsatı verir.',
      'Güvenli ve şeffaf ödeme altyapısı sunar.'
    ],
    targetAudience: ['ogrenci', 'veli'],
    painPointsSolved: ['Eğitim masraflarının yüksekliği', 'Bursların sadece okul birincilerine verilmesi adaletsizliği'],
    psychologicalTriggers: ['Kazanılmış Ödül', 'Maddi Rahatlama', 'Fırsat'],
    callToActionButtons: ['Burs Bakiyeni Kullan', 'Mağazayı İncele', 'Koçluk Paketi Al'],
    hookSuggestions: [
      'Ders çalıştıkça cüzdanın dolsun! FocusON ÇABA burs puanlarınla koçluk ve kaynaklara ücretsiz ulaş.',
      'Eğitimde fırsat eşitliği: Çaba gösteren herkese anında burs indirimi.'
    ],
    technicalData: 'Cüzdan bakiye motoru, kupon kodu yöneticisi, sepet ve ödeme akışı.'
  }
];

export const ROLE_PROFILES = {
  ogrenci: {
    label: 'YKS / LGS Öğrencisi',
    tone: 'Dinamik, empatik, cesaretlendirici, jargonsuz, anında sonuç odaklı, sınav stresini yok eden samimi dil.',
    keyInterests: ['Net artırma', 'Süre yetiştirme', 'Gece soru çözümü', 'Burs kazanma', 'Motivasyon', 'Kişiye özel program']
  },
  veli: {
    label: 'YKS / LGS Velisi',
    tone: 'Güven veren, saygılı, şeffaf, huzur ve kontrol vadeden, aile içi çatışmayı bitiren kurumsal ve şefkatli dil.',
    keyInterests: ['Haftalık WhatsApp karnesi', 'Şeffaf deneme takibi', 'Evdeki ders kavgasının bitmesi', 'Çocuğun güvenilir ellerde olması']
  },
  koc: {
    label: 'Eğitim Koçu / Rehber Öğretmen',
    tone: 'Prestijli, profesyonel, teknolojik güç ve zaman tasarrufu vurgulayan, verimlilik odaklı uzman dili.',
    keyInterests: ['Öğrenci yönetim paneli', 'Otomatik veli raporu', '35 psikolojik teşhis reçetesi', 'AI süpervizör desteği', 'Yüksek ek gelir']
  },
  sistem: {
    label: 'FocusON Genel Ekosistem',
    tone: 'Vizyoner, devrimci, Türkiye\'nin ilk tam kapsamlı YKS/LGS yapay zeka eğitim ekosistemi lansman dili.',
    keyInterests: ['360 derece bütünsel çözüm', 'Eğitimde yapay zeka devrimi', 'Bilimsel başarı metodu']
  }
};

/**
 * Akıllı Semantik Tüm Site İndeksi Tarayıcısı (Full-Site Index Scanner)
 * Kullanıcının sorduğu veya girdiği herhangi bir konuyu tüm site haritasıyla karşılaştırır.
 */
export function searchCompleteSiteIndex(query: string = ""): {
  matchedPages: PageRagItem[];
  primaryPage: PageRagItem;
  strictGroundingSummary: string;
} {
  const qLower = (query || "").toLowerCase().trim();
  
  if (!qLower) {
    return {
      matchedPages: COMPLETE_SITE_RAG_PAGES.slice(0, 3),
      primaryPage: COMPLETE_SITE_RAG_PAGES[0],
      strictGroundingSummary: "FocusON Akademi Bütünleşik 360° Site İndeksi (Tüm Sayfalar Aktif)"
    };
  }

  // Puanlama motoru: Başlık, anahtar kelimeler, acı noktaları ve işlevler taranır
  const scored = COMPLETE_SITE_RAG_PAGES.map(page => {
    let score = 0;
    const titleMatch = page.title.toLowerCase().includes(qLower);
    if (titleMatch) score += 15;

    const kwMatches = page.keywords.filter(kw => qLower.includes(kw.toLowerCase()) || kw.toLowerCase().includes(qLower));
    score += kwMatches.length * 8;

    const painMatches = page.painPointsSolved.filter(pp => qLower.includes(pp.toLowerCase()) || pp.toLowerCase().includes(qLower));
    score += painMatches.length * 5;

    const benefitMatches = page.keyBenefitsAndAdvantages.filter(b => b.toLowerCase().includes(qLower));
    score += benefitMatches.length * 4;

    const actionMatches = page.whatHappensOnPage.filter(a => a.toLowerCase().includes(qLower));
    score += actionMatches.length * 3;

    return { page, score };
  });

  scored.sort((a, b) => b.score - a.score);

  const matched = scored.filter(s => s.score > 0).map(s => s.page);
  const matchedPages = matched.length > 0 ? matched : [COMPLETE_SITE_RAG_PAGES[0], COMPLETE_SITE_RAG_PAGES[1]];
  const primaryPage = matchedPages[0];

  const strictGroundingSummary = matchedPages.slice(0, 3).map(p => 
    `• [${p.title}] (${p.urlPath}) -> ${p.whatHappensOnPage.join(", ")}`
  ).join("\n");

  return {
    matchedPages,
    primaryPage,
    strictGroundingSummary
  };
}
