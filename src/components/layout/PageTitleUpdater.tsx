import React, { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

const TITLE_MAP: Record<string, string> = {
  '/': 'YKS Koçluğu ve Dijital Eğitim Platformu',
  '/giris': 'Giriş Yap',
  '/sifremi-unuttum': 'Şifremi Unuttum',
  '/kayit': 'Öğrenci Kaydı',
  '/koc-basvuru': 'Koç Kaydı',
  '/kayit-tamamla': 'Kayıt Tamamlama',
  '/koc-onay-bekliyor': 'Koç Onay Süreci',
  '/dogrulama': 'SMS & E-posta Doğrulama',
  '/hakkimizda': 'Hakkımızda',
  '/vizyon-misyon': 'Vizyon & Misyon',
  '/egitim-kadromuz': 'Eğitim Kadromuz',
  '/basarilarimiz': 'Başarılarımız',
  '/sss': 'Sıkça Sorulan Sorular (SSS)',
  '/iletisim': 'İletişim',
  '/gizlilik-politikasi': 'Gizlilik Politikası',
  '/kullanim-kosullari': 'Kullanım Koşulları',

  // Tools & Analysis
  '/sinav-geri-sayimi': 'YKS Sayaç & Geri Sayım',
  '/deneme-takibi': 'Deneme Takibi & İstatistikler',
  '/derin-deneme-analizi': 'Derin Deneme Analizi',
  '/kisilik-analizleri': 'Kişilik & Öğrenme Analizleri',
  '/zaman-yonetimi': 'Zaman Yönetimi Metronomu',
  '/sinav-surec-takibi': 'Sınav Süreç Takibi',
  '/yks-konulari': 'YKS Müfredat & Konuları',
  '/soru-dagilimi': 'YKS Soru Dağılımları',
  '/yks-puan-hesaplama': 'YKS Puan Hesaplama Engine',
  '/meslek-rehberi': 'Meslek Rehberi & Geleceğin Meslekleri',
  '/yok-atlas': 'YÖK Atlas Tercih Rehberi',
  '/tercih-robotu': 'YKS Tercih Robotu',
  '/pomodoro': 'Pomodoro Zamanlayıcı & Odaklanma',
  '/topluluk': 'Öğrenci Topluluğu & Forum',
  '/magaza': 'Focuson Mağaza & Paketler',
  '/sepet': 'Alışveriş Sepeti',
  '/etkinlikler': 'Etkinlikler & Seminerler',
  '/online-programlar': 'Online Eğitim Programları',
  '/topluluk-profili': 'Topluluk Profili',

  // Dashboards
  '/panel/admin': 'Yönetici Genel İstatistikler',
  '/panel/admin/koclar': 'Koç Yönetimi',
  '/panel/admin/ogrenciler': 'Öğrenci Yönetimi',
  '/panel/admin/koc-onaylari': 'Koç Başvuru Onayları',
  '/panel/admin/ucretli-abonelikler': 'Finans & Kesinti Ayarları',
  '/panel/admin/ayarlar': 'Sistem Ayarları',
  '/panel/admin/sistem-ayarlari': 'Sistem Ayarları',
  '/panel/admin/hata-loglari': 'Sistem Hata Logları & Teşhis',
  '/panel/admin/duyurular': 'Duyuru Yönetimi',
  '/panel/admin/etkinlikler': 'Etkinlik Yönetimi',
  '/panel/admin/programlar': 'Program Yönetimi',
  '/panel/admin/mufredat': 'Müfredat Yönetimi',
  '/panel/admin/sorular': 'Soru Havuzu Yönetimi',
  '/panel/admin/akademik-sinavlar': 'Akademik Sınav Yönetimi',
  '/panel/admin/ogrenci-hedefleri': 'Öğrenci Hedefleri',
  '/panel/admin/konular': 'Konu Yönetimi',
  '/panel/admin/kaynaklar': 'Kaynak Yönetimi',

  // Coach Dashboard
  '/panel/koc': 'Koç Paneli',
  '/panel/koc/ogrenciler': 'Öğrencilerim',
  '/panel/koc/randevular': 'Randevu Takvimi',
  '/panel/koc/genel-degerlendirme': 'Genel Değerlendirmeler',
  '/panel/koc/profil': 'Koç Profili & Ücretler',
  '/panel/koc/cuzdan': 'Koç Cüzdanı',
  '/panel/koc/asistan': 'Koç AI Asistanı',

  // Student Dashboard
  '/panel/ogrenci': 'Öğrenci Paneli',
  '/panel/ogrenci/programim': 'Çalışma Programım',
  '/panel/ogrenci/kocum': 'Koçum & İletişim',
  '/panel/ogrenci/denemelerim': 'Deneme Sonuçlarım',
  '/panel/ogrenci/analizler': 'Gelişim Analizleri',
  '/panel/ogrenci/randevularim': 'Randevularım',
  '/panel/ogrenci/caba-testi': 'ÇABA Performans Testi',
  '/panel/ogrenci/asistan': 'AI Eğitim Asistanı',
  '/panel/ogrenci/cuzdan': 'Cüzdanım & İşlem Geçmişi',
  '/panel/ogrenci/abonelik': 'Abonelik & Paket Yükseltme',
  '/panel/ogrenci/profil': 'Öğrenci Profil Ayarları',

  // Parent Dashboard
  '/panel/veli': 'Veli Takip Paneli',
  '/panel/veli/asistan': 'Veli Danışma Asistanı',
};

export const PageTitleUpdater: React.FC = () => {
  const location = useLocation();

  useEffect(() => {
    const pathname = location.pathname;

    let pageTitle = TITLE_MAP[pathname];

    if (!pageTitle) {
      if (pathname.startsWith('/panel/koc/ogrenci/')) {
        pageTitle = 'Öğrenci Detayı & Takibi';
      } else if (pathname.startsWith('/panel/admin')) {
        pageTitle = 'Yönetici Paneli';
      } else if (pathname.startsWith('/panel/koc')) {
        pageTitle = 'Koç Paneli';
      } else if (pathname.startsWith('/panel/ogrenci')) {
        pageTitle = 'Öğrenci Paneli';
      } else if (pathname.startsWith('/panel/veli')) {
        pageTitle = 'Veli Paneli';
      } else {
        pageTitle = 'Focuson Akademi';
      }
    }

    if (pathname === '/') {
      document.title = 'Focuson Akademi | YKS Koçluğu ve Dijital Eğitim Platformu';
    } else {
      document.title = `${pageTitle} | Focuson Akademi`;
    }

    // Always scroll window and layout containers to top on route change
    window.scrollTo(0, 0);
    document.documentElement.scrollTop = 0;
    document.body.scrollTop = 0;

    const scrollables = document.querySelectorAll('main, .overflow-y-auto, .overflow-auto');
    scrollables.forEach(el => {
      if (!el.hasAttribute('data-no-auto-scroll-top')) {
        el.scrollTop = 0;
      }
    });
  }, [location]);

  useEffect(() => {
    const handleTabClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (!target) return;
      const tabBtn = target.closest('[role="tab"], [data-tab], button');
      if (!tabBtn) return;

      const isTabBar = tabBtn.closest('[role="tablist"], .tabs, [class*="tab-"]');
      const isTabAttr = tabBtn.hasAttribute('data-tab') || tabBtn.getAttribute('role') === 'tab';

      if (isTabBar || isTabAttr) {
        setTimeout(() => {
          window.scrollTo(0, 0);
          document.documentElement.scrollTop = 0;
          document.body.scrollTop = 0;
          const scrollables = document.querySelectorAll('main, .overflow-y-auto, .overflow-auto');
          scrollables.forEach(el => {
            if (!el.hasAttribute('data-no-auto-scroll-top')) {
              el.scrollTop = 0;
            }
          });
        }, 30);
      }
    };

    document.addEventListener('click', handleTabClick);
    return () => document.removeEventListener('click', handleTabClick);
  }, []);

  return null;
};
