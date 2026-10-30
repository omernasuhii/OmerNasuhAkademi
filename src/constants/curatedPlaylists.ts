export interface CuratedPlaylistResource {
  id: string;
  bookName: string;
  channelTitle: string;
  subject: string;
  type: string;
  resourceType: 'youtube';
  totalVideos: number;
  totalDurationFormatted: string;
  totalDurationMinutes: number;
  videos: Array<{
    order: number;
    title: string;
    durationMinutes: number;
    durationFormatted: string;
    videoId?: string;
    url?: string;
  }>;
  isStudentBook: false;
}

export const CURATED_PLAYLIST_CHANNELS: CuratedPlaylistResource[] = [
  {
    id: 'curated_yt_mert_hoca_tyt_mat',
    bookName: 'Mert Hoca - 70 Günde TYT Matematik Kampı',
    channelTitle: 'Mert Hoca',
    subject: 'Matematik',
    type: 'TYT',
    resourceType: 'youtube',
    totalVideos: 25,
    totalDurationFormatted: '18 sa 45 dk',
    totalDurationMinutes: 1125,
    isStudentBook: false,
    videos: [
      { order: 1, title: '01 - Temel Kavramlar & Sayı Kümeleri', durationMinutes: 45, durationFormatted: '45 dk' },
      { order: 2, title: '02 - Tek ve Çift Sayılar & Pozitif-Negatif Sayılar', durationMinutes: 40, durationFormatted: '40 dk' },
      { order: 3, title: '03 - Ardışık Sayılar & Terim Sayısı', durationMinutes: 50, durationFormatted: '50 dk' },
      { order: 4, title: '04 - Asal Sayılar & Aralarında Asallık', durationMinutes: 38, durationFormatted: '38 dk' },
      { order: 5, title: '05 - Faktöriyel Kavramı ve Özellikleri', durationMinutes: 42, durationFormatted: '42 dk' },
      { order: 6, title: '06 - Basamak Kavramı ve Çözümleme', durationMinutes: 48, durationFormatted: '48 dk' },
      { order: 7, title: '07 - Bölme ve Bölünebilme Kuralları', durationMinutes: 52, durationFormatted: '52 dk' },
      { order: 8, title: '08 - Asal Çarpanlara Ayırma & Bölen Sayısı', durationMinutes: 44, durationFormatted: '44 dk' },
      { order: 9, title: '09 - EBOB - EKOK Kuralları ve Taktikleri', durationMinutes: 55, durationFormatted: '55 dk' },
      { order: 10, title: '10 - EBOB - EKOK Problemleri', durationMinutes: 50, durationFormatted: '50 dk' },
      { order: 11, title: '11 - Rasyonel Sayılar ve Ondalık Gösterim', durationMinutes: 42, durationFormatted: '42 dk' },
      { order: 12, title: '12 - Basit Eşitsizlikler ve Aralık Kavramı', durationMinutes: 46, durationFormatted: '46 dk' },
      { order: 13, title: '13 - Mutlak Değer Tanımı ve Özellikleri', durationMinutes: 48, durationFormatted: '48 dk' },
      { order: 14, title: '14 - Mutlak Değerli Denklemler ve Eşitsizlikler', durationMinutes: 52, durationFormatted: '52 dk' },
      { order: 15, title: '15 - Üslü Sayılar ve Üslü İfadeler', durationMinutes: 50, durationFormatted: '50 dk' },
      { order: 16, title: '16 - Köklü Sayılar ve Eşlenik Durumlar', durationMinutes: 54, durationFormatted: '54 dk' },
      { order: 17, title: '17 - Çarpanlara Ayırma & Özdeşlikler', durationMinutes: 52, durationFormatted: '52 dk' },
      { order: 18, title: '18 - Oran ve Orantı Özellikleri', durationMinutes: 40, durationFormatted: '40 dk' },
      { order: 19, title: '19 - Sayı ve Kesir Problemleri 1', durationMinutes: 55, durationFormatted: '55 dk' },
      { order: 20, title: '20 - Sayı ve Kesir Problemleri 2', durationMinutes: 50, durationFormatted: '50 dk' },
      { order: 21, title: '21 - Yaş Problemleri ve Çözüm Yolları', durationMinutes: 42, durationFormatted: '42 dk' },
      { order: 22, title: '22 - Yüzde, Kâr ve Zarar Problemleri', durationMinutes: 55, durationFormatted: '55 dk' },
      { order: 23, title: '23 - Karışım Problemleri', durationMinutes: 38, durationFormatted: '38 dk' },
      { order: 24, title: '24 - Hareket ve Hız Problemleri', durationMinutes: 48, durationFormatted: '48 dk' },
      { order: 25, title: '25 - Kümeler & Kartezyen Çarpım', durationMinutes: 40, durationFormatted: '40 dk' }
    ]
  },
  {
    id: 'curated_yt_eyup_b_ayt_mat',
    bookName: 'Eyüp B. - AYT Matematik Konu Anlatım Kampı',
    channelTitle: 'Eyüp B. Matematik',
    subject: 'AYT Matematik',
    type: 'AYT',
    resourceType: 'youtube',
    totalVideos: 20,
    totalDurationFormatted: '16 sa 30 dk',
    totalDurationMinutes: 990,
    isStudentBook: false,
    videos: [
      { order: 1, title: '01 - Fonksiyon Grafikleri ve Dönüşümler', durationMinutes: 55, durationFormatted: '55 dk' },
      { order: 2, title: '02 - Polinomlar ve Kök İlişkileri', durationMinutes: 50, durationFormatted: '50 dk' },
      { order: 3, title: '03 - 2. Dereceden Denklemler & Kök-Katsayı', durationMinutes: 45, durationFormatted: '45 dk' },
      { order: 4, title: '04 - Parabol Grafiği ve Tepe Noktası', durationMinutes: 52, durationFormatted: '52 dk' },
      { order: 5, title: '05 - 2. Dereceden Eşitsizlikler ve Tablo Yöntemi', durationMinutes: 48, durationFormatted: '48 dk' },
      { order: 6, title: '06 - Trigonometri 1: Birim Çember ve Esas Ölçü', durationMinutes: 45, durationFormatted: '45 dk' },
      { order: 7, title: '07 - Trigonometri 2: Toplam-Fark ve Yarım Açı', durationMinutes: 58, durationFormatted: '58 dk' },
      { order: 8, title: '08 - Trigonometrik Denklemler', durationMinutes: 45, durationFormatted: '45 dk' },
      { order: 9, title: '09 - Logaritma Tanımı ve Kuralları', durationMinutes: 50, durationFormatted: '50 dk' },
      { order: 10, title: '10 - Logaritmik Denklemler ve Eşitsizlikler', durationMinutes: 44, durationFormatted: '44 dk' },
      { order: 11, title: '11 - Diziler: Aritmetik ve Geometrik Dizi', durationMinutes: 52, durationFormatted: '52 dk' },
      { order: 12, title: '12 - Limit Kavramı ve Sağdan-Soldan Limit', durationMinutes: 46, durationFormatted: '46 dk' },
      { order: 13, title: '13 - Belirsizlikler (0/0) ve Süreklilik', durationMinutes: 54, durationFormatted: '54 dk' },
      { order: 14, title: '14 - Türev Tanımı ve Türev Alma Kuralları', durationMinutes: 56, durationFormatted: '56 dk' },
      { order: 15, title: '15 - Zincir Kuralı ve Bileşke Fonksiyonun Türevi', durationMinutes: 48, durationFormatted: '48 dk' },
      { order: 16, title: '16 - Türevin Geometrik Yorumu ve Teğet Denklemi', durationMinutes: 55, durationFormatted: '55 dk' },
      { order: 17, title: '17 - Artan-Azalan Fonksiyonlar & Ekstremum Noktalar', durationMinutes: 52, durationFormatted: '52 dk' },
      { order: 18, title: '18 - Maksimum-Minimum Problemleri', durationMinutes: 50, durationFormatted: '50 dk' },
      { order: 19, title: '19 - Belirsiz İntegral & Değişken Değiştirme', durationMinutes: 58, durationFormatted: '58 dk' },
      { order: 20, title: '20 - Belirli İntegral ve Alan Hesabı', durationMinutes: 62, durationFormatted: '62 dk' }
    ]
  },
  {
    id: 'curated_yt_vip_fizik_tyt',
    bookName: 'VIP Fizik - TYT Fizik Check-Up Kampı',
    channelTitle: 'VIP Fizik',
    subject: 'Fizik',
    type: 'TYT',
    resourceType: 'youtube',
    totalVideos: 18,
    totalDurationFormatted: '13 sa 20 dk',
    totalDurationMinutes: 800,
    isStudentBook: false,
    videos: [
      { order: 1, title: '01 - Fizik Bilimine Giriş & Büyüklükler', durationMinutes: 40, durationFormatted: '40 dk' },
      { order: 2, title: '02 - Madde ve Özellikleri (Kütle, Hacim, Özkütle)', durationMinutes: 45, durationFormatted: '45 dk' },
      { order: 3, title: '03 - Dayanıklılık, Adezyon, Kohezyon & Yüzey Gerilimi', durationMinutes: 38, durationFormatted: '38 dk' },
      { order: 4, title: '04 - Sıvıların Kaldırma Kuvveti', durationMinutes: 50, durationFormatted: '50 dk' },
      { order: 5, title: '05 - Katı, Sıvı ve Gaz Basıncı', durationMinutes: 52, durationFormatted: '52 dk' },
      { order: 6, title: '06 - Isı, Sıcaklık ve İç Enerji Kavramları', durationMinutes: 46, durationFormatted: '46 dk' },
      { order: 7, title: '07 - Isı Alışverişi & Hal Değişimi', durationMinutes: 48, durationFormatted: '48 dk' },
      { order: 8, title: '08 - Katı ve Sıvılarda Genleşme', durationMinutes: 36, durationFormatted: '36 dk' },
      { order: 9, title: '09 - Düzgün Doğrusal Hareket & Hız Grafikleri', durationMinutes: 50, durationFormatted: '50 dk' },
      { order: 10, title: '10 - Newton\'ın Hareket Yasaları', durationMinutes: 45, durationFormatted: '45 dk' },
      { order: 11, title: '11 - Sürtünme Kuvveti ve Uygulamaları', durationMinutes: 40, durationFormatted: '40 dk' },
      { order: 12, title: '12 - İş, Güç ve Mekanik Enerji', durationMinutes: 45, durationFormatted: '45 dk' },
      { order: 13, title: '13 - Elektrostatik: Yükler ve Elektriklenme', durationMinutes: 42, durationFormatted: '42 dk' },
      { order: 14, title: '14 - Elektrik Akımı, Potansiyel Fark & Direnç', durationMinutes: 48, durationFormatted: '48 dk' },
      { order: 15, title: '15 - Seri-Paralel Bağlama ve Devre Analizi', durationMinutes: 50, durationFormatted: '50 dk' },
      { order: 16, title: '16 - Mıknatıslar ve Manyetik Alan', durationMinutes: 38, durationFormatted: '38 dk' },
      { order: 17, title: '17 - Dalgalar: Yay, Su ve Ses Dalgaları', durationMinutes: 47, durationFormatted: '47 dk' },
      { order: 18, title: '18 - Optik: Yansıma, Aynalar ve Kırılma', durationMinutes: 55, durationFormatted: '55 dk' }
    ]
  },
  {
    id: 'curated_yt_gorkem_sahin_tyt_kimya',
    bookName: 'Görkem Şahin - TYT Kimya Video Kampı',
    channelTitle: 'Görkem Şahin',
    subject: 'Kimya',
    type: 'TYT',
    resourceType: 'youtube',
    totalVideos: 16,
    totalDurationFormatted: '11 sa 40 dk',
    totalDurationMinutes: 700,
    isStudentBook: false,
    videos: [
      { order: 1, title: '01 - Kimya Disiplinleri ve Güvenlik Uyarıları', durationMinutes: 35, durationFormatted: '35 dk' },
      { order: 2, title: '02 - Atom Modelleri & Atomun Yapısı', durationMinutes: 45, durationFormatted: '45 dk' },
      { order: 3, title: '03 - Periyodik Sistem ve Periyodik Özellikler', durationMinutes: 50, durationFormatted: '50 dk' },
      { order: 4, title: '04 - Güçlü Etkileşimler: İyonik & Kovalent Bağ', durationMinutes: 48, durationFormatted: '48 dk' },
      { order: 5, title: '05 - Zayıf Etkileşimler: Van der Waals & Hidrojen Bağı', durationMinutes: 42, durationFormatted: '42 dk' },
      { order: 6, title: '06 - Maddenin Halleri: Katılar ve Sıvılar', durationMinutes: 44, durationFormatted: '44 dk' },
      { order: 7, title: '07 - Maddenin Halleri: Gazlar ve Plazma', durationMinutes: 40, durationFormatted: '40 dk' },
      { order: 8, title: '08 - Kimyanın Temel Kanunları', durationMinutes: 46, durationFormatted: '46 dk' },
      { order: 9, title: '09 - Mol Kavramı ve Hesaplamalar', durationMinutes: 55, durationFormatted: '55 dk' },
      { order: 10, title: '10 - Kimyasal Tepkime Türleri & Denkleştirme', durationMinutes: 42, durationFormatted: '42 dk' },
      { order: 11, title: '11 - Kimyasal Hesaplamalar ve Sınırlayıcı Bileşen', durationMinutes: 48, durationFormatted: '48 dk' },
      { order: 12, title: '12 - Karışım Türleri & Çözünme Olayı', durationMinutes: 40, durationFormatted: '40 dk' },
      { order: 13, title: '13 - Kütlece ve Hacimce Yüzde Derişim', durationMinutes: 45, durationFormatted: '45 dk' },
      { order: 14, title: '14 - Karışımları Ayırma Yöntemleri', durationMinutes: 38, durationFormatted: '38 dk' },
      { order: 15, title: '15 - Asitler, Bazlar ve Özellikleri', durationMinutes: 45, durationFormatted: '45 dk' },
      { order: 16, title: '16 - Tuzlar ve Kimya Her Yerde', durationMinutes: 37, durationFormatted: '37 dk' }
    ]
  },
  {
    id: 'curated_yt_dr_biyoloji_tyt',
    bookName: 'Dr. Biyoloji - TYT Biyoloji Kampı',
    channelTitle: 'Dr. Biyoloji',
    subject: 'Biyoloji',
    type: 'TYT',
    resourceType: 'youtube',
    totalVideos: 15,
    totalDurationFormatted: '10 sa 15 dk',
    totalDurationMinutes: 615,
    isStudentBook: false,
    videos: [
      { order: 1, title: '01 - Canlıların Ortak Özellikleri', durationMinutes: 40, durationFormatted: '40 dk' },
      { order: 2, title: '02 - İnorganik Bileşikler (Su, Asit-Baz, Tuz, Mineraller)', durationMinutes: 38, durationFormatted: '38 dk' },
      { order: 3, title: '03 - Karbonhidratlar ve Lipitler', durationMinutes: 42, durationFormatted: '42 dk' },
      { order: 4, title: '04 - Proteinler ve Enzimler', durationMinutes: 48, durationFormatted: '48 dk' },
      { order: 5, title: '05 - Nükleik Asitler, ATP ve Vitaminler', durationMinutes: 44, durationFormatted: '44 dk' },
      { order: 6, title: '06 - Hücre Teorisi ve Hücre Zarı Yapısı', durationMinutes: 42, durationFormatted: '42 dk' },
      { order: 7, title: '07 - Hücre Zarı Madde Geçişleri (Difüzyon, Osmoz, Aktif Taşıma)', durationMinutes: 46, durationFormatted: '46 dk' },
      { order: 8, title: '08 - Sitoplazma ve Hücre Organelleri', durationMinutes: 45, durationFormatted: '45 dk' },
      { order: 9, title: '09 - Canlıların Çeşitliliği ve Sınıflandırma Kuralları', durationMinutes: 40, durationFormatted: '40 dk' },
      { order: 10, title: '10 - Bakteriler, Arkeler ve Protistalar', durationMinutes: 38, durationFormatted: '38 dk' },
      { order: 11, title: '11 - Bitkiler, Mantarlar ve Hayvanlar Âlemi', durationMinutes: 45, durationFormatted: '45 dk' },
      { order: 12, title: '12 - Mitoz Bölünme ve Eşeysiz Üreme', durationMinutes: 42, durationFormatted: '42 dk' },
      { order: 13, title: '13 - Mayoz Bölünme ve Eşeyli Üreme', durationMinutes: 45, durationFormatted: '45 dk' },
      { order: 14, title: '14 - Kalıtımın Genel İlkeleri ve Çaprazlamalar', durationMinutes: 50, durationFormatted: '50 dk' },
      { order: 15, title: '15 - Ekosistem Ekolojisi & Madde Döngüleri', durationMinutes: 40, durationFormatted: '40 dk' }
    ]
  },
  {
    id: 'curated_yt_rustu_hoca_turkce',
    bookName: 'Rüştü Hoca - TYT Türkçe & Paragraf Taktikleri Kampı',
    channelTitle: 'Rüştü Hoca',
    subject: 'Türkçe',
    type: 'TYT',
    resourceType: 'youtube',
    totalVideos: 14,
    totalDurationFormatted: '9 sa 20 dk',
    totalDurationMinutes: 560,
    isStudentBook: false,
    videos: [
      { order: 1, title: '01 - Sözcükte Anlam ve Söz Öbekleri', durationMinutes: 38, durationFormatted: '38 dk' },
      { order: 2, title: '02 - Cümlede Anlam ve İlişkiler', durationMinutes: 40, durationFormatted: '40 dk' },
      { order: 3, title: '03 - Paragrafta Ana Fikir & Konu Bulma Taktikleri', durationMinutes: 45, durationFormatted: '45 dk' },
      { order: 4, title: '04 - Paragrafta Yardımcı Düşünceler', durationMinutes: 40, durationFormatted: '40 dk' },
      { order: 5, title: '05 - Paragrafta Yapı ve Akışı Bozan Cümle', durationMinutes: 42, durationFormatted: '42 dk' },
      { order: 6, title: '06 - Ses Bilgisi: Ünlü ve Ünsüz Olayları', durationMinutes: 40, durationFormatted: '40 dk' },
      { order: 7, title: '07 - Yazım Kuralları: Büyük Harfler & Bitişik-Ayrı Kelimeler', durationMinutes: 45, durationFormatted: '45 dk' },
      { order: 8, title: '08 - Noktalama İşaretleri Taktik Çözümleri', durationMinutes: 40, durationFormatted: '40 dk' },
      { order: 9, title: '09 - Sözcükte Yapı: Kök, Gövde ve Ekler', durationMinutes: 44, durationFormatted: '44 dk' },
      { order: 10, title: '10 - İsimler, Sıfatlar ve Zamirler', durationMinutes: 42, durationFormatted: '42 dk' },
      { order: 11, title: '11 - Zarflar, Edat, Bağlaç ve Ünlemler', durationMinutes: 38, durationFormatted: '38 dk' },
      { order: 12, title: '12 - Fiiller, Ek Fiil ve Fiilde Anlam Kayması', durationMinutes: 40, durationFormatted: '40 dk' },
      { order: 13, title: '13 - Fiilimsiler (Eylemsiler) & Fiilde Çatı', durationMinutes: 44, durationFormatted: '44 dk' },
      { order: 14, title: '14 - Cümlenin Ögeleri & Cümle Türleri', durationMinutes: 42, durationFormatted: '42 dk' }
    ]
  },
  {
    id: 'curated_yt_kenan_kara_geometri',
    bookName: 'Kenan Kara - TYT-AYT Sıfırdan Zirveye Geometri',
    channelTitle: 'Kenan Kara ile Geometri',
    subject: 'Geometri',
    type: 'TYT',
    resourceType: 'youtube',
    totalVideos: 16,
    totalDurationFormatted: '12 sa 10 dk',
    totalDurationMinutes: 730,
    isStudentBook: false,
    videos: [
      { order: 1, title: '01 - Doğruda Açılar ve Paralel Açılar', durationMinutes: 42, durationFormatted: '42 dk' },
      { order: 2, title: '02 - Üçgende Açılar ve Temel Özellikler', durationMinutes: 45, durationFormatted: '45 dk' },
      { order: 3, title: '03 - Dik Üçgen ve Pisagor Bağıntısı', durationMinutes: 48, durationFormatted: '48 dk' },
      { order: 4, title: '04 - İkizkenar ve Eşkenar Üçgen', durationMinutes: 46, durationFormatted: '46 dk' },
      { order: 5, title: '05 - Üçgende Açıortay Bağıntıları', durationMinutes: 44, durationFormatted: '44 dk' },
      { order: 6, title: '06 - Üçgende Kenarortay & Ağırlık Merkezi', durationMinutes: 46, durationFormatted: '46 dk' },
      { order: 7, title: '07 - Üçgende Benzerlik Kuralları 1', durationMinutes: 50, durationFormatted: '50 dk' },
      { order: 8, title: '08 - Üçgende Benzerlik Kuralları 2', durationMinutes: 45, durationFormatted: '45 dk' },
      { order: 9, title: '09 - Üçgende Alan Hesabı ve Parçalama', durationMinutes: 52, durationFormatted: '52 dk' },
      { order: 10, title: '10 - Çokgenler ve Düzgün Çokgen Özellikleri', durationMinutes: 40, durationFormatted: '40 dk' },
      { order: 11, title: '11 - Dörtgenler ve Yamuk', durationMinutes: 48, durationFormatted: '48 dk' },
      { order: 12, title: '12 - Paralelkenar ve Eşkenar Dörtgen', durationMinutes: 45, durationFormatted: '45 dk' },
      { order: 13, title: '13 - Dikdörtgen ve Kare', durationMinutes: 46, durationFormatted: '46 dk' },
      { order: 14, title: '14 - Çemberde Açılar', durationMinutes: 48, durationFormatted: '48 dk' },
      { order: 15, title: '15 - Çemberde Uzunluk & Dairede Alan', durationMinutes: 52, durationFormatted: '52 dk' },
      { order: 16, title: '16 - Katı Cisimler (Prizmalar ve Piramitler)', durationMinutes: 44, durationFormatted: '44 dk' }
    ]
  }
];
