export interface FeatureKnowledgeItem {
  id: string;
  category: 
    | 'analizler_ve_psikoloji'
    | 'sinav_ve_zaman_yonetimi'
    | 'ai_teknoloji'
    | 'veli_sistemi'
    | 'koc_ekosistemi'
    | 'tercih_ve_kariyer'
    | 'meb_yok_entegrasyon'
    | 'topluluk_ve_sosyal'
    | 'finans_ve_burs'
    | 'magaza_ve_etkinlik'
    | 'genel_platform';
  title: string;
  shortDesc: string;
  targetAudience: ('ogrenci' | 'veli' | 'koc' | 'sistem')[];
  painPoints: string[];
  keyBenefits: string[];
  uiButtonsAndPath: string[];
  hookSuggestions: string[];
  technicalDetails: string;
}

export const FOCUSON_KNOWLEDGE_BASE: FeatureKnowledgeItem[] = [
  // 1. ANALİZLER & PSİKOLOJİ
  {
    id: 'caba_testi',
    category: 'analizler_ve_psikoloji',
    title: 'ÇABA Bursluluk & Potansiyel Testi',
    shortDesc: 'Öğrencinin ezberini değil, azmini, zihinsel dayanıklılığını ve akademik potansiyelini ölçen çok boyutlu değerlendirme.',
    targetAudience: ['ogrenci', 'veli'],
    painPoints: [
      'Sadece test netlerine bakılarak öğrencinin zekasının ve çabasının yok sayılması',
      'Öğrencinin potansiyelinin farkında olmaması ve özgüven kaybı',
      'Maddi kaygılarla kaliteli koçluk ve eğitime erişememe korkusu'
    ],
    keyBenefits: [
      'Ezbere dayalı değil, çaba ve analitik yeteneğe göre %100\'e varan burs imkanı',
      '15 dakikalık test sonrası anında detaylı potansiyel gelişim karnesi',
      'Eksik yönleri net tespit edip koçlukla telafi etme planı'
    ],
    uiButtonsAndPath: [
      'Rota: /panel/ogrenci/caba-testi',
      'Butonlar: "Teste Başla", "Potansiyelini Keşfet", "Burs Başvurusu Yap", "Detaylı Raporu İndir"'
    ],
    hookSuggestions: [
      'Netlerin değil, ÇABAN seni dereceye sokacak! Gerçek potansiyelini 15 dakikada gör.',
      'Sadece derece yapanlar değil, azmedenler kazanıyor: ÇABA Bursluluk Testi Başladı!'
    ],
    technicalDetails: '35 soru, Likert ölçekli davranış ve odaklanma analizi, anlık PDF karne üretimi.'
  },
  {
    id: 'derin_analiz_35',
    category: 'analizler_ve_psikoloji',
    title: '35+ Bilimsel Psikolojik & Akademik Teşhis Envanteri',
    shortDesc: 'MERCEK, DOPA, VAK, GTS-36, ÇİKOLATA, AMİD gibi 35+ özgün analiz ile öğrenme stili, dikkat süresi ve erteleme teşhisi.',
    targetAudience: ['ogrenci', 'veli', 'koc'],
    painPoints: [
      'Öğrencinin neden ders çalışamadığını veya neden odaklanamadığını kimsenin tam bilememesi',
      'Standart ders programlarının her öğrenciye uymaması ve başarısızlık hissi',
      'Dopamin bağımlılığı, telefon dikkat dağınıklığı ve sınav kaygısı'
    ],
    keyBenefits: [
      'Öğrencinin görsel mi, işitsel mi, kinestetik mi olduğunu saptayan profil',
      'Dopamin ve odaklanma haritası çıkaran bilimsel teşhis bataryası',
      'Koça ve veliye özel kişiselleştirilmiş reçete ve çalışma takvimi çıktısı'
    ],
    uiButtonsAndPath: [
      'Rota: /panel/ogrenci/analizler & /panel/ogrenci/analiz-detay',
      'Butonlar: "Analiz Bataryasını Aç", "Raporu İncele", "Kişisel Gelişim Reçetem", "Koça Raporu Gönder"'
    ],
    hookSuggestions: [
      'Ders çalışamamanın sebebi tembellik değil, beyninin öğrenme stili olabilir! 35 Analizle kendini keşfet.',
      'Ezbere programlar bitti. Çocuğunuzun odak haritasını çıkaran Türkiye\'nin en kapsamlı analiz sistemi.'
    ],
    technicalDetails: '35 ayrı psikometrik envanter, radar grafikleri, güçlü ve zayıf yönler matrisi, PDF raporlayıcı.'
  },
  {
    id: 'kisilik_analizi',
    category: 'analizler_ve_psikoloji',
    title: 'Kişilik & Mizaç Odaklı Çalışma Analizi',
    shortDesc: 'Öğrencinin mizaç tipine (içedönük/dışadönük, analitik/duygusal) göre çalışma ortamı, saatleri ve mola stratejisi belirleme.',
    targetAudience: ['ogrenci', 'koc', 'veli'],
    painPoints: [
      'Başkasına yarayan çalışma metodunun öğrencide işe yaramaması ve hayal kırıklığı',
      'Koçun öğrenciyi tanımadan ezbere yönlendirme yapması'
    ],
    keyBenefits: [
      'Mizaca özel ders çalışma ritmi ve motivasyon kaynakları',
      'Sınav stresini azaltan kişiselleştirilmiş rehberlik reçetesi'
    ],
    uiButtonsAndPath: [
      'Rota: /panel/ogrenci/kisilik-analizi',
      'Butonlar: "Kişilik Testini Başlat", "Mizaç Raporum", "Kişisel Tavsiyeler"'
    ],
    hookSuggestions: [
      'Herkes günde 8 saat çalışamaz! Kendi mizacına göre en verimli çalışma ritmini keşfet.',
      'Mizaç analizine göre ders çalışan öğrenci 2 kat daha az yorulur.'
    ],
    technicalDetails: 'Enneagram ve MBTI tabanlı hibrit mizaç algoritması, koç panelinde öğrenci profilleme entegrasyonu.'
  },

  // 2. SINAV & ZAMAN YÖNETİMİ
  {
    id: 'sinav_metronomu',
    category: 'sinav_ve_zaman_yonetimi',
    title: 'Sınav Süre Metronomu (Exam Metronome)',
    shortDesc: 'Sınav anında süre paniğini, turlama taktiğini ve soru başına harcanan saniyeleri optimize eden ritmik prova aracı.',
    targetAudience: ['ogrenci', 'koc'],
    painPoints: [
      'TYT\'de sürenin asla yetmemesi ve son 20 soruyu yetiştiremeyip boş bırakmak',
      'Bir zor matematik sorusunda 7 dakika takılıp moral bozukluğu yaşamak',
      'Sınav heyecanıyla ritmi kaybedip telaşla hata yapmak'
    ],
    keyBenefits: [
      'Sorulara harcanan süreyi milisaniyelik ritimle takip etme alışkanlığı',
      'Turlama stratejisini refleks haline getiren canlı sınav simülatörü',
      'Hangi ders ve branşta süre kaybedildiğini gösteren sıcaklık haritası'
    ],
    uiButtonsAndPath: [
      'Rota: /panel/ogrenci/sinav-metronomu',
      'Butonlar: "Metronomu Başlat", "Tur Taktiğini Seç", "Soru Başı Süre (Sn)", "Canlı Ritim Modu"'
    ],
    hookSuggestions: [
      'TYT\'de süren yetmiyor mu? Sorun bilginde değil, ritminde! Sınav Metronomu ile tanış.',
      'Bir soruya 6 dakika gömmeyi bırak: Turlama taktiğini refleks yapan yapay zeka aracı.'
    ],
    technicalDetails: 'Web Audio API ve hassas zamanlayıcı ile sesli/titreşimli ritim kılavuzu, dinamik TYT/AYT/LGS süre modülleri.'
  },
  {
    id: 'deneme_takip_ve_analiz',
    category: 'sinav_ve_zaman_yonetimi',
    title: 'Deneme Süreç Takibi & Soru/Kazanım Analiz Radarı',
    shortDesc: 'Çözülen tüm denemelerin net değişimlerini, ders bazlı eksik konuları ve kazanım açıklarını saptayan analitik gösterge.',
    targetAudience: ['ogrenci', 'koc', 'veli'],
    painPoints: [
      'Deneme çözüp netlerin neden artmadığını anlayamamak',
      'Sürekli aynı konulardan soru kaçırdığını fark edememek',
      'Haftalık net takibinin kağıtlarda kaybolması'
    ],
    keyBenefits: [
      'Hangi derste hangi kazanımın eksik olduğunu kırmızı alarm ile gösteren radar',
      'TYT & AYT net trendi grafik çizelgesi ve hedef net simülatörü',
      'Koçun anında eksik konuya yönelik ödev ataması'
    ],
    uiButtonsAndPath: [
      'Rota: /panel/ogrenci/deneme-takibi & /panel/ogrenci/soru-analizi',
      'Butonlar: "Deneme Sonucu Ekle", "Net Trendini Gör", "Kazanım Analizi Yap", "Eksik Konu Raporu"'
    ],
    hookSuggestions: [
      'Deneme çözmek yetmez! Hangi soruyu neden kaçırdığını gösteren Kazanım Radarı ile netlerini uçur.',
      'Netleriniz yerinde mi sayıyor? İşte kaçırdığınız gizli açıklar.'
    ],
    technicalDetails: 'D3/Recharts interaktif net eğrileri, kazanım bazlı etiketleme, PDF karne indirme.'
  },
  {
    id: 'kitap_ve_soru_takibi',
    category: 'sinav_ve_zaman_yonetimi',
    title: 'Kaynak Kitap Bitirme & Soru Çözüm Takibi',
    shortDesc: 'Öğrencinin çözdüğü soru bankalarını, test tamamlama yüzdelerini ve günlük soru hedeflerini yöneten modül.',
    targetAudience: ['ogrenci', 'koc'],
    painPoints: [
      'Başlanan soru bankalarının yarım kalması ve kütüphanede tozlanması',
      'Hangi kaynaktan kaç soru çözüldüğünün takip edilememesi'
    ],
    keyBenefits: [
      'Kitap bitirme yüzdesi ve ilerleme barları',
      'Günlük hedeflenen ve çözülen soru sayılarının koçla anlık senkronizasyonu'
    ],
    uiButtonsAndPath: [
      'Rota: /panel/ogrenci/kitap-takip',
      'Butonlar: "Kitap Ekle", "Testi Tamamla", "Günlük Soru Sayısı Gir", "İlerleme Durumu"'
    ],
    hookSuggestions: [
      'Yarım kalan test kitaplarına son! Kitap bitirme takipçisi ile hedeflerini tamamla.',
      'Günde kaç soru çözdün, kitapların ne kadarı bitti? Tek ekranda kontrol sende.'
    ],
    technicalDetails: 'Firestore real-time sync, kitap ve ünite bazlı hiyerarşik ilerleme barları.'
  },
  {
    id: 'sinav_sayaci_ve_akademik_takvim',
    category: 'sinav_ve_zaman_yonetimi',
    title: 'Sınav Geri Sayımı & Akademik Süreç Takvimi',
    shortDesc: 'YKS, LGS, MSÜ sınavlarına kalan gün/saat/saniye sayacı ve kritik MEB/ÖSYM başvuru tarihlerini hatırlatan takvim.',
    targetAudience: ['ogrenci', 'veli'],
    painPoints: [
      'Sınav başvuru, geç başvuru ve sonuç tarihlerini kaçırma riski',
      'Zamanın nasıl akıp gittiğini fark edemeyip rehavete kapılmak'
    ],
    keyBenefits: [
      'Canlı saniyelik sınav sayacı ve günlük motivasyon kartı',
      'Resmi ÖSYM/MEB sınav takvimi ile tam entegre bildirimler'
    ],
    uiButtonsAndPath: [
      'Rota: /sinav-sayaci & /panel/ogrenci/akademik-takvim',
      'Butonlar: "Geri Sayımı Başlat", "Takvime Ekle", "Bildirimleri Aç"'
    ],
    hookSuggestions: [
      'YKS 2026 için geri sayım başladı! Her saniyenin hesabını yapacak mısın?',
      'Başvuru tarihlerini kaçırma, sınav gününe kadar ritmini koru.'
    ],
    technicalDetails: 'Client-side hassas countdown motoru, iCal / Google Calendar senkronizasyonu.'
  },

  // 3. AI & TEKNOLOJİ
  {
    id: 'ai_soru_cozucu_asistan',
    category: 'ai_teknoloji',
    title: 'Yapay Zeka Sesli Soru Çözücü & Takip Öğretmeni',
    shortDesc: 'Fotoğrafı çekilen soruyu anında adım adım çözen ve öğrencinin "burayı anlamadım" dediği her adımı sesli anlatan AI asistan.',
    targetAudience: ['ogrenci'],
    painPoints: [
      'Gece 23:00\'te soru çözerken takılmak ve soracak hoca bulamamak',
      'Video çözümlerde hocanın hızlı geçip mantığını açıklamadığı adımlarda tıkanmak',
      'Özel ders hocasına sürekli soru sormaktan çekinmek veya yüksek ders ücretleri'
    ],
    keyBenefits: [
      '7/24 fotoğraf yükle 3 saniyede adım adım çözümü al',
      'Anlamadığın satıra tıkla, yapay zeka özel ders hocası gibi sesli anlatsın',
      'Soru hakkından düşmeyen tamamen ücretsiz takip ve pekiştirme sohbeti'
    ],
    uiButtonsAndPath: [
      'Rota: /panel/ogrenci/ai-asistan & /panel/ogrenci/ai-soru-cozucu',
      'Butonlar: "Soru Fotoğrafı Yükle", "Sesli Çözümü Dinle", "Hocaya Sor (Takip)", "Benzer Soru Üret"'
    ],
    hookSuggestions: [
      'Gece 01:00\'de takıldığın soru için hoca arama! Fotoğrafını çek, yapay zeka sesli olarak kulağına anlatsın.',
      'Sadece cevabı değil, mantığını öğreten 7/24 cebindeki özel ders öğretmeni.'
    ],
    technicalDetails: 'Gemini 2.5 Flash Vision & Text-to-Speech (TTS) pipeline, PCM-to-WAV dönüştürücü, bağlamsal takip mimarisi.'
  },
  {
    id: 'ogrenci_hedef_ai_radari',
    category: 'ai_teknoloji',
    title: 'Yapay Zeka Hedef Radarı & Net Tahmin Motoru',
    shortDesc: 'Öğrencinin çözdüğü sorular ve deneme netlerine göre hedef üniversite ve bölüme yerleşme olasılığını hesaplayan yapay zeka motoru.',
    targetAudience: ['ogrenci', 'veli', 'koc'],
    painPoints: [
      'Şu anki netlerle nereyi kazanabileceğini kestirememek',
      'Eksik kalan netleri hangi dersten kapatması gerektiğini bilememek'
    ],
    keyBenefits: [
      'Kazanma ihtimali yüzdesi ve hedef net simülasyonu',
      'En hızlı net artışı sağlayacak ders ve konu önerileri'
    ],
    uiButtonsAndPath: [
      'Rota: /panel/ogrenci/hedefler',
      'Butonlar: "Hedef Üniversite Seç", "Net Tahminini Gör", "Eksik Net Reçetesi"'
    ],
    hookSuggestions: [
      'Hedeflediğin üniversiteye ne kadar yakınsın? AI Hedef Radarı ile kazanma olasılığını hesapla.',
      '10 net artırmak için hangi konulara odaklanmalısın? Yapay zeka senin yerine hesaplasın.'
    ],
    technicalDetails: 'Geçmiş 5 yıllık ÖSYM yerleştirme verileriyle eğitilmiş makine öğrenimi modeli.'
  },

  // 4. VELİ SİSTEMİ
  {
    id: 'veli_whatsapp_karnesi',
    category: 'veli_sistemi',
    title: 'Veli Şeffaf Takip Portalı & Otomatik WhatsApp Karnesi',
    shortDesc: 'Veliyi sürekli soru sormaktan kurtaran, her pazartesi 10:00\'da çocuğun tüm haftalık gelişimini WhatsApp\'tan ileten sistem.',
    targetAudience: ['veli'],
    painPoints: [
      'Velinin "Bugün ders çalıştın mı?", "Deneme netin kaç?" diye sorup çocukla çatışması',
      'Dershanelerin ve okulların veliye zamanında ve net geri bildirim vermemesi',
      'Öğrencinin deneme netlerini veya çalışma eksiklerini veliden gizlemesi'
    ],
    keyBenefits: [
      'Her Pazartesi 10:00\'da velinin telefonuna gelen özet grafikli WhatsApp gelişim raporu',
      'Koçun haftalık değerlendirme notları ve öğrencinin soru çözüm hedefleri',
      'Aile içi sınav stresini ve çatışmaları sıfıra indiren şeffaf iletişim'
    ],
    uiButtonsAndPath: [
      'Rota: /panel/veli/raporlar & /panel/veli/dashboard',
      'Butonlar: "Haftalık Karnemi İncele", "Koç Notunu Oku", "WhatsApp Bildirim Ayarları", "Canlı Gelişim Grafiği"'
    ],
    hookSuggestions: [
      'Çocuğunuzla "Ders çalıştın mı?" kavgasına son! Tüm haftalık ilerleme her pazartesi WhatsApp\'ınızda.',
      'Sınav sürecinde bir velinin en çok ihtiyaç duyduğu şey: Şeffaf, profesyonel ve anlık takip.'
    ],
    technicalDetails: 'Twilio WhatsApp API & Cron job otomatik gönderim altyapısı, interaktif veli portalı, koç onaylı raporlar.'
  },
  {
    id: 'veli_randevu_ve_koc_gorusmesi',
    category: 'veli_sistemi',
    title: 'Veli - Derece Koçu Canlı Randevu & Değerlendirme',
    shortDesc: 'Velinin dilediği zaman sistem üzerinden çocuğun özel derece koçuyla görüntülü/sesli randevu alıp süreci değerlendirmesi.',
    targetAudience: ['veli'],
    painPoints: [
      'Dershanelerde rehberlik hocasına ulaşılamaması veya 5 dakikalık geçiştirici konuşmalar',
      'Çocuğun psikolojik durumunu uzman biriyle istişare edememek'
    ],
    keyBenefits: [
      'Tek tıkla müsait zaman diliminde koç randevusu oluşturma',
      'Görüşme öncesi ve sonrası detaylı toplantı notlarının veli paneline işlenmesi'
    ],
    uiButtonsAndPath: [
      'Rota: /panel/veli/randevular',
      'Butonlar: "Koçtan Randevu Al", "Görüşme Notları", "Görüntülü Odaya Katıl"'
    ],
    hookSuggestions: [
      'Rehber öğretmene ulaşmak için günlerce beklemeyin! FocusON Veli Portalı ile koçunuz bir tık uzağınızda.',
      'Çocuğunuzun geleceğini tesadüfe bırakmayın, uzman koçuyla birebir planlayın.'
    ],
    technicalDetails: 'Google Meet / Jitsi entegrasyonu, takvim çakışma önleyici slot motoru.'
  },

  // 5. KOÇ EKOSİSTEMİ
  {
    id: 'koc_birebir_mentörlük',
    category: 'koc_ekosistemi',
    title: 'Derece Koçlarıyla Birebir Canlı Takip & Haftalık Strateji',
    shortDesc: 'Türkiye derecesi yapmış uzman koçlarla haftalık görüntülü görüşme, kişiye özel çalışma programı ve hedef takibi.',
    targetAudience: ['ogrenci', 'veli'],
    painPoints: [
      'Plansız çalışıp hangi konuyu ne zaman bitireceğini kestirememek',
      'Motivasyon kaybında yalnız kalmak ve pes etmek',
      'Hangi kaynakları çözeceğini bilmeyip yanlış kitaplarda vakit kaybetmek'
    ],
    keyBenefits: [
      'Haftalık birebir strateji ve analiz randevusu',
      'Öğrencinin netlerine göre dinamik güncellenen hedef tamamlama radarı',
      'Sınav stresini yöneten bireysel rehberlik desteği'
    ],
    uiButtonsAndPath: [
      'Rota: /panel/ogrenci/randevular & /panel/ogrenci/kocluk',
      'Butonlar: "Koçumla Görüş", "Haftalık Programım", "Hedef Belirle", "Canlı Randevu Al"'
    ],
    hookSuggestions: [
      'YKS tek başına hazırlanmak için çok uzun bir maraton. Derece yapmış koçunla adımlarını planla.',
      'Hedefine giden yolu şansa bırakma! Kişiselleştirilmiş koçlukla her hafta netlerini artır.'
    ],
    technicalDetails: 'WebRTC & Google Meet entegrasyonu, Firestore takvim motoru, anlık randevu slot yönetimi.'
  },
  {
    id: 'koc_profesyonel_yonetim_paneli',
    category: 'koc_ekosistemi',
    title: 'Koçlar İçin 360° Öğrenci Yönetim & AI Asistan Masası',
    shortDesc: 'Eğitim koçlarının onlarca öğrenciyi tek ekranda yönetmesini, yapay zeka ile otomatik program hazırlamasını sağlayan B2B panel.',
    targetAudience: ['koc'],
    painPoints: [
      'Excel veya kağıt üzerinde öğrenci takip etmenin getirdiği büyük zaman kaybı',
      'Her öğrenciye sıfırdan program yazarken saatler harcamak'
    ],
    keyBenefits: [
      'Yapay zeka destekli tek tıkla haftalık ders programı oluşturma',
      'Öğrencinin çözdüğü soruları ve analiz sonuçlarını tek bakışta görme'
    ],
    uiButtonsAndPath: [
      'Rota: /panel/koc/ogrenciler & /panel/koc/program',
      'Butonlar: "Öğrenci Özeti", "AI Program Oluştur", "Toplu Mesaj Gönder", "Cüzdan & Kazanç"'
    ],
    hookSuggestions: [
      'Öğrenci takibini Excel karmaşasından kurtarın! FocusON Koç Paneli ile profesyonelleşin.',
      'Daha az zamanda daha fazla öğrenciye kaliteli koçluk verin.'
    ],
    technicalDetails: 'Coach-Student RBAC yetkilendirmesi, otomatik bildirim kuyruğu, kazanç ve cüzdan yönetimi.'
  },

  // 6. TERCİH & KARİYER
  {
    id: 'yok_atlas_tercih_robotu',
    category: 'tercih_ve_kariyer',
    title: 'Akıllı Tercih Robotu & YÖK Atlas Entegrasyonu',
    shortDesc: 'YÖK Atlas verileriyle entegre, taban sıralamaları, burs oranları, üniversite imkanları ve kariyer simülasyonu sunan tercih motoru.',
    targetAudience: ['ogrenci', 'veli'],
    painPoints: [
      'Tercih döneminde yanlış kılavuz inceleyip sıralamasının çok altında yerlere yerleşmek',
      'Üniversitelerin gizli ücret, akreditasyon veya burs kesilme şartlarını bilmemek',
      'Geleceğin meslekleri hakkında güncel bilgi sahibi olamamak'
    ],
    keyBenefits: [
      'Son 5 yılın tüm taban sıralama, net ortalamaları ve kontenjan değişimleri',
      'Öğrencinin ilgi alanına göre riskli, ideal ve garanti tercih listesi oluşturan AI',
      'Kariyer rehberi ve mezun istihdam oranları simülatörü'
    ],
    uiButtonsAndPath: [
      'Rota: /panel/ogrenci/tercih-robotu & /panel/ogrenci/yok-atlas',
      'Butonlar: "Tercih Listemi Oluştur", "Sıralama Filtrele", "Risk Analizi Yap", "PDF Tercih Listesi İndir"'
    ],
    hookSuggestions: [
      '1 yıllık emeğini yanlış tercihle yakma! YÖK Atlas verileriyle çalışan Akıllı Tercih Robotu devrede.',
      'Sıralamana en uygun üniversiteleri risk puanlarına göre ayıran yapay zeka tercih kılavuzu.'
    ],
    technicalDetails: 'Supabase PostgreSQL veritabanı, 10.000+ program, anlık net-sıralama korelasyon motoru.'
  },
  {
    id: 'meslek_ve_kariyer_rehberi',
    category: 'tercih_ve_kariyer',
    title: 'Geleceğin Meslekleri & Kariyer Rehberi',
    shortDesc: 'Yapay zeka çağında öne çıkan meslekler, maaş skalaları, yurt dışı imkanları ve mezun başarı profillerini içeren rehber.',
    targetAudience: ['ogrenci', 'veli'],
    painPoints: [
      'Hangi mesleği seçeceğini bilememek ve kararsızlık yaşamak',
      'Seçtiği bölümün işsizlik oranını ve gelecek potansiyelini öngörememek'
    ],
    keyBenefits: [
      '500+ mesleğin detaylı yetkinlik analizi ve geleceğin becerileri',
      'Öğrencinin mizaç testine göre en uygun kariyer eşleştirmesi'
    ],
    uiButtonsAndPath: [
      'Rota: /panel/ogrenci/meslek-rehberi',
      'Butonlar: "Meslekleri Filtrele", "Maaş Skalası", "Kariyer Haritası"'
    ],
    hookSuggestions: [
      'Geleceğin meslekleri hangileri? Üniversite seçmeden önce kariyer haritanı çiz.',
      'Hangi bölüm sana uygun? Yapay zeka destekli kariyer rehberi ile geleceğini planla.'
    ],
    technicalDetails: 'İşgücü piyasası veritabanı, maaş ve istihdam indeksleri.'
  },
  {
    id: 'kyk_yurt_ve_kampus_rehberi',
    category: 'tercih_ve_kariyer',
    title: 'KYK Yurtları & Şehir/Kampüs Yaşam Rehberi',
    shortDesc: 'Üniversite tercihi yaparken şehirdeki KYK yurt kapasiteleri, kira fiyatları ve kampüs yaşamını inceleme imkanı.',
    targetAudience: ['ogrenci', 'veli'],
    painPoints: [
      'Farklı bir şehir yazarken barınma ve yurt kaygısı yaşamak',
      'Şehrin öğrenci bütçesine uygun olup olmadığını bilememek'
    ],
    keyBenefits: [
      '81 ildeki devlet ve özel yurt bilgileri, ulaşım hatları ve maliyet hesaplayıcı',
      'Velinin güvenle tercih yapmasını sağlayan şehir güvenlik indeksleri'
    ],
    uiButtonsAndPath: [
      'Rota: /panel/ogrenci/kyk-yurtlari',
      'Butonlar: "Yurtları İncele", "Maliyet Hesapla", "Şehir Rehberi"'
    ],
    hookSuggestions: [
      'Tercih yaparken sadece üniversiteyi değil, kalacağın şehri ve yurdu da bil!',
      'KYK yurtları ve öğrenci yaşam maliyetleri rehberi ile sürpriz yaşamayın.'
    ],
    technicalDetails: 'Coğrafi bilgi sistemi ve il bazlı barınma veri tabanı.'
  },

  // 7. MEB & YÖK ENTEGRASYONU
  {
    id: 'meb_mufredat_ve_mebi_entegrasyon',
    category: 'meb_yok_entegrasyon',
    title: 'MEB Resmi Müfredat, MEBİ & EBA Akademik Destek',
    shortDesc: 'MEB\'in güncel kazanımları, OGM Materyal soruları ve MEBİ platformuyla %100 uyumlu konu çalışma planı.',
    targetAudience: ['ogrenci', 'koc'],
    painPoints: [
      'Müfredat dışı gereksiz konulara çalışarak zaman kaybetmek',
      'MEB\'in yeni nesil soru tarzından haberdar olmamak'
    ],
    keyBenefits: [
      'ÖSYM\'nin baz aldığı güncel MEB kazanım listesi',
      'OGM ve MEBİ testleriyle doğrudan bağlantılı konu tamamlama'
    ],
    uiButtonsAndPath: [
      'Rota: /panel/ogrenci/meb-mufredat & /panel/ogrenci/mebi',
      'Butonlar: "Kazanımları İncele", "OGM Soruları", "MEBİ Girişi"'
    ],
    hookSuggestions: [
      'Müfredatta olmayan konulara vakit kaybetme! %100 MEB ve ÖSYM uyumlu çalışma planı.',
      'Yeni nesil soruların kaynağı MEBİ ve OGM Materyal şimdi tek panelde.'
    ],
    technicalDetails: 'MEB Talim Terbiye Kurulu güncel müfredat senkronizasyonu.'
  },
  {
    id: 'youtube_ve_kanal_onerileri',
    category: 'meb_yok_entegrasyon',
    title: 'Ders Bazlı En İyi YouTube Hoca & Kanal Tavsiyeleri',
    shortDesc: 'Öğrencinin seviyesine ve öğrenme stiline göre (sıfırdan başlayan / derece hedefleyen) en iyi hoca video eşleştirmesi.',
    targetAudience: ['ogrenci'],
    painPoints: [
      'YouTube\'da onlarca video arasında kaybolup yanlış hocayla vakit kaybetmek',
      'Seviyesine ağır gelen veya çok basit kalan anlatımlarla sıkılmak'
    ],
    keyBenefits: [
      'Temel, orta ve ileri seviyeye göre filtrelenmiş ders anlatım listeleri',
      'Konuyu en iyi anlatan kanallarla organize oynatma listeleri'
    ],
    uiButtonsAndPath: [
      'Rota: /panel/ogrenci/kanal-onerileri',
      'Butonlar: "Ders Seç", "Seviyeme Göre Hoca Bul", "Listeyi Aç"'
    ],
    hookSuggestions: [
      'YouTube deryasında kaybolma! Seviyene en uygun hocayı ve video serisini tek tıkla bul.',
      'Sıfırdan mı başlıyorsun, derece mi istiyorsun? İşte sana özel hoca listesi.'
    ],
    technicalDetails: 'Küratörlü YouTube API oynatma listeleri ve seviye etiketleri.'
  },

  // 8. TOPLULUK & SOSYAL
  {
    id: 'focuson_ogrenci_toplulugu',
    category: 'topluluk_ve_sosyal',
    title: 'FocusON Öğrenci Topluluğu & Akran Dayanışması',
    shortDesc: 'YKS/LGS maratonundaki binlerce öğrencinin soru paylaştığı, deneme netlerini tartıştığı ve birbirini motive ettiği güvenli sosyal alan.',
    targetAudience: ['ogrenci'],
    painPoints: [
      'Sınava hazırlanırken eve kapanıp yalnızlaşmak ve motivasyonunu kaybetmek',
      'Sosyal medyada (Instagram/TikTok) ders çalışmak yerine dikkatini dağıtmak'
    ],
    keyBenefits: [
      'Sadece sınav odaklı, toksik olmayan, moderatör denetimli akran topluluğu',
      'Yapamadığın soruyu anında binlerce arkadaşınla paylaşma'
    ],
    uiButtonsAndPath: [
      'Rota: /topluluk & /panel/ogrenci/topluluk-profili',
      'Butonlar: "Topluluğa Katıl", "Gönderi Paylaş", "Soru Sor", "Günün Motivasyonu"'
    ],
    hookSuggestions: [
      'Bu maratonda yalnız değilsin! Binlerce YKS öğrencisiyle aynı hedefte buluş.',
      'Dikkatini dağıtan sosyal medyayı bırak, hedefine odaklanan öğrenci topluluğuna katıl.'
    ],
    technicalDetails: 'Firestore real-time feed, beğeni, yorum ve rozetleme altyapısı.'
  },

  // 9. FİNANS, BURS & MAĞAZA
  {
    id: 'ogrenci_ve_veli_cuzdani',
    category: 'finans_ve_burs',
    title: 'Akıllı Öğrenci & Veli Cüzdanı (Burs ve Bakiye Takibi)',
    shortDesc: 'Öğrencinin kazandığı başarı burslarını, koçluk paketlerini ve harcamalarını şeffaf yönettiği dijital cüzdan.',
    targetAudience: ['ogrenci', 'veli'],
    painPoints: [
      'Ödemelerin ve ders saatlerinin takibinde karışıklık yaşanması',
      'Kazanılan burs ve indirimlerin net takip edilememesi'
    ],
    keyBenefits: [
      'Kazanılan ÇABA burs bakiyesini anında görüntüleme',
      'Veli onaylı güvenli paket yükleme ve şeffaf faturalandırma'
    ],
    uiButtonsAndPath: [
      'Rota: /panel/ogrenci/cuzdan & /panel/veli/cuzdan',
      'Butonlar: "Bakiye Yükle", "Burs Durumum", "Harcama Geçmişi"'
    ],
    hookSuggestions: [
      'Başarın bursla ödüllensin! Şeffaf cüzdan sistemi ile koçluk ve eğitim fırsatları parmaklarının ucunda.'
    ],
    technicalDetails: 'İyzico / PayTR altyapısı, sanal cüzdan ve burs bakiye motoru.'
  },
  {
    id: 'magaza_ve_online_programlar',
    category: 'magaza_ve_etkinlik',
    title: 'FocusON Akademi Mağazası & Online Gelişim Kampları',
    shortDesc: 'Derece koçluğu paketleri, 21 günlük odaklanma kampları, deneme setleri ve canlı seminer biletleri.',
    targetAudience: ['ogrenci', 'veli'],
    painPoints: [
      'Pahalı ve verimsiz özel ders paketlerine mahkum olmak',
      'Hangi eğitim paketinin çocuğa uygun olduğunu kestirememek'
    ],
    keyBenefits: [
      'İhtiyaca özel modüler koçluk ve analiz paketleri',
      'Uzman psikolog ve derece öğrencileriyle canlı online kamplar'
    ],
    uiButtonsAndPath: [
      'Rota: /panel/ogrenci/magaza & /panel/ogrenci/online-programlar',
      'Butonlar: "Paketleri İncele", "Sepete Ekle", "Kampa Katıl"'
    ],
    hookSuggestions: [
      'Sınav maratonunda ihtiyacın olan her şey tek bir mağazada! Derece kamplarını kaçırma.'
    ],
    technicalDetails: 'Kupon, otomatik indirim ve sepet sistemi entegrasyonu.'
  },

  // 10. GENEL SİSTEM & LANSMAN
  {
    id: 'genel_focuson_ekosistemi',
    category: 'genel_platform',
    title: 'FocusON Akademi: Türkiye\'nin 1 Numaralı Hibrit Sınav Ekosistemi',
    shortDesc: 'Yapay zeka teknolojisi, bilimsel teşhis testleri ve Türkiye derecesi yapmış koçları tek bir çatı altında birleştiren yeni nesil sınav hazırlık platformu.',
    targetAudience: ['ogrenci', 'veli', 'koc', 'sistem'],
    painPoints: [
      'Geleneksel dershanelerin tek tip ve yetersiz kalması',
      'Öğrencinin sınav maratonunda tek başına ne yapacağını bilememesi',
      'Velinin hem zaman hem para harcayıp karşılığını görememesi'
    ],
    keyBenefits: [
      'Öğrenci, veli ve koçu tek bir canlı platformda buluşturan şeffaf mimari',
      'Yapay zeka sesli soru çözümü + 35 teşhis testi + Sınav metronomu + Haftalık WhatsApp karnesi',
      'Sıfır kayıp, maksimum net artışı ve derece garantili rehberlik'
    ],
    uiButtonsAndPath: [
      'Rota: / (Ana Sayfa) & /kayit-ol',
      'Butonlar: "Ücretsiz Başla", "Potansiyelini Keşfet", "Sistemi İncele"'
    ],
    hookSuggestions: [
      'Eski nesil dershane kalıplarını unutun! Türkiye\'nin en kapsamlı sınav teknolojisi ile tanışın.',
      'YKS ve LGS\'de derece tesadüf değildir: Yapay zeka ve uzman koçluk FocusON Akademi\'de buluştu.'
    ],
    technicalDetails: 'React + Node.js + Firebase + Gemini AI + Twilio + Supabase tam entegre mimari.'
  }
];

export const AUDIENCE_PROFILES = {
  ogrenci: {
    label: 'Öğrenci (YKS / LGS / Lise)',
    tone: 'Dinamik, cesaretlendirici, enerjik, samimi, genç ve sonuç odaklı',
    psychology: 'Zaman darlığı, net artırma hırsı, odaklanma zorluğu, yalnızlık hissi, sınav stresi ve gelecek hayali.',
    visualStyle: 'Modern çalışma odası, laptop/tablet ekranları, FocusON arayüzü, sıcak loş çalışma ışığı, odaklanmış bakışlar, canlı renk vurguları (Neon kırmızı/mavi tonlar).',
    videoFormat: 'Reels/TikTok (9:16), ilk 3 saniyede güçlü acı noktası kancası (Hook), hızlı sahne geçişleri (maks 8-10 sn), ritmik arka plan beat.',
    colorPalette: '#E11D48 (Kırmızı) / #3B82F6 (Elektrik Mavi) / #0F172A (Derin Gece Mavisi)'
  },
  veli: {
    label: 'Veli (Anne & Baba)',
    tone: 'Güven veren, saygılı, kurumsal, şeffaf, huzur verici ve sonuç garantili',
    psychology: 'Çocuğun geleceği için endişe, kontrol kaybı korkusu, maddi/manevi emeğin boşa gitmemesi isteği, şeffaf bilgi ihtiyacı.',
    visualStyle: 'Aydınlık, ferah, sıcak aile ortamı, akıllı telefonunda WhatsApp raporunu gülümseyerek inceleyen anne/baba, profesyonel grafikler.',
    videoFormat: 'Instagram/Facebook Feed (1:1 veya 9:16), sakin ve profesyonel ses tonu, güven verici müzik, net veri grafikleri.',
    colorPalette: '#0284C7 (Güven Mavisi) / #10B981 (Huzur Yeşili) / #F8FAFC (Temiz Beyaz)'
  },
  koc: {
    label: 'Koç / Rehber Öğretmen',
    tone: 'Profesyonel, B2B, prestijli, verimlilik ve uzmanlık odaklı',
    psychology: 'Öğrenci takip yükünden kurtulma, prestij kazanma, bilimsel teşhis araçlarıyla otorite olma isteği.',
    visualStyle: 'Modern ofis veya eğitim stüdyosu, tablet üzerinden öğrenci analizini inceleyen şık koç, analitik dashboard ekranları.',
    videoFormat: 'LinkedIn / Instagram (1:1 veya 16:9), uzman anlatımı, vaka analizleri.',
    colorPalette: '#6366F1 (İndigo) / #8B5CF6 (Mor) / #1E293B (Koyu Slate)'
  },
  sistem: {
    label: 'Sistem Lansmanı / AI Ürün Tanıtımı',
    tone: 'Fütüristik, teknolojik, devrimsel, net ve premium',
    psychology: 'Yeni nesil eğitim teknolojisini ilk kullanan olma heyecanı, akıllı araçların sağladığı hız ve üstünlük.',
    visualStyle: 'Sinematik 3D arayüz mockup\'ları, cam yansımaları, pürüzsüz kamera kaymaları, holografik analiz grafikleri.',
    videoFormat: 'Hero Video / Tanıtım Klibi (16:9 ve 9:16), yüksek prodüksiyon sinematik akış.',
    colorPalette: '#F43F5E (Neon Gül) / #06B6D4 (Siyan) / #030712 (Saf Siyah)'
  }
};
