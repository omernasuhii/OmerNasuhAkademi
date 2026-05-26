import React, { useState, useEffect } from 'react';
import { User, Menu, ChevronDown, LogOut, LayoutDashboard, Shield, Clock, ExternalLink, X, Bell, Check, Trash2, Users } from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../../lib/AuthContext';
import NotificationBell, { Notification } from './NotificationBell';

export default function Navbar() {
  const { user, userData, logout } = useAuth();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [openMobileSubmenu, setOpenMobileSubmenu] = useState<string | null>(null);
  const [mobileDrawerView, setMobileDrawerView] = useState<'menu' | 'notifications'>('menu');
  
  // Notification State
  const [notifications, setNotifications] = useState<Notification[]>([
    {
      id: '1',
      title: 'Yeni Randevu',
      message: 'Yarın saat 14:00\'de Matematik seansınız var.',
      time: '5 dk önce',
      read: false,
      type: 'info'
    },
    {
      id: '2',
      title: 'Ödev Tamamlandı',
      message: 'Trigonometri I ödevi başarıyla sisteme yüklendi.',
      time: '2 saat önce',
      read: true,
      type: 'success'
    },
    {
      id: '3',
      title: 'Deneme Analizi Hazır',
      message: 'Son girdiğiniz sınavın detaylı analizi koçunuz tarafından onaylandı.',
      time: '1 gün önce',
      read: true,
      type: 'info'
    }
  ]);

  const unreadCount = notifications.filter(n => !n.read).length;

  const location = useLocation();

  // Close mobile menu on route change
  useEffect(() => {
    setIsMobileMenuOpen(false);
    setOpenMobileSubmenu(null);
    setTimeout(() => setMobileDrawerView('menu'), 300); // reset after animation
  }, [location.pathname]);

  // Disable body scroll when mobile menu is open
  useEffect(() => {
    if (isMobileMenuOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
      setTimeout(() => setMobileDrawerView('menu'), 300); // reset after animation
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isMobileMenuOpen]);

  const toggleSubmenu = (menu: string) => {
    setOpenMobileSubmenu(openMobileSubmenu === menu ? null : menu);
  };

  const markAllAsRead = () => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
  };

  const toggleRead = (id: string) => {
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: !n.read } : n));
  };
  
  const deleteNotification = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setNotifications(prev => prev.filter(n => n.id !== id));
  };

  return (
    <header className="bg-transparent border-b border-white/10 text-white py-4 px-4 md:px-12 flex items-center justify-between sticky top-0 z-50 backdrop-blur-xl relative">
      <div className="flex items-center gap-2">
        <Link to="/">
          <img src="/images/logo.png" alt="FocusON Akademi Logo" width="450" height="175" className="h-10 md:h-14 w-auto object-contain" />
        </Link>
      </div>
      
      <nav className="hidden lg:flex items-center gap-8 text-sm font-medium text-slate-300">
        <Link to="/" className="hover:text-white transition-colors">Ana Sayfa</Link>
        
        <div className="relative group">
          <button className="flex items-center gap-1 hover:text-white transition-colors py-2 relative">
            YKS <ChevronDown size={14} className="group-hover:rotate-180 transition-transform duration-300" />
            <span className="absolute bottom-0 left-0 w-full h-8 translate-y-full"></span> {/* Invisible hover bridge */}
          </button>
          
          <div className="absolute top-full left-0 mt-0 w-56 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-300 translate-y-2 group-hover:translate-y-0 z-50">
            <div className="bg-slate-900/95 backdrop-blur-xl border border-white/10 rounded-2xl shadow-[0_10px_40px_rgba(0,0,0,0.5)] py-3 flex flex-col mt-2">
              <Link to="/sinav-geri-sayimi" className="px-5 py-2.5 hover:bg-white/5 hover:text-blue-400 transition-colors">Sınav Geri Sayımı</Link>
              <Link to="/kanal-onerileri" className="px-5 py-2.5 hover:bg-white/5 hover:text-blue-400 transition-colors">Kanal Önerileri</Link>
              <Link to="/yks-konulari" className="px-5 py-2.5 hover:bg-white/5 hover:text-blue-400 transition-colors">YKS Konuları</Link>
              <Link to="/soru-dagilimi" className="px-5 py-2.5 hover:bg-white/5 hover:text-blue-400 transition-colors">Hangi Konu Kaç Soru?</Link>
              <Link to="/yks-puan-hesaplama" className="px-5 py-2.5 hover:bg-white/5 hover:text-blue-400 transition-colors">YKS Puan Hesaplama</Link>
              <Link to="/meslek-rehberi" className="px-5 py-2.5 hover:bg-white/5 hover:text-blue-400 transition-colors">Meslek Rehberi</Link>
              <Link to="/yok-atlas" className="px-5 py-2.5 hover:bg-white/5 hover:text-blue-400 transition-colors">YÖK Atlas</Link>
              <a href="#" className="px-5 py-2.5 hover:bg-white/5 hover:text-blue-400 transition-colors">Tercih Robotu</a>
              <Link to="/kyk-yurtlari" className="px-5 py-2.5 hover:bg-white/5 hover:text-blue-400 transition-colors">KYK Yurtları</Link>
            </div>
          </div>
        </div>

        <div className="relative group">
          <button className="flex items-center gap-1 hover:text-white transition-colors py-2 relative">
            MEB <ChevronDown size={14} className="group-hover:rotate-180 transition-transform duration-300" />
            <span className="absolute bottom-0 left-0 w-full h-8 translate-y-full"></span> {/* Invisible hover bridge */}
          </button>
          
          <div className="absolute top-full left-0 mt-0 w-64 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-300 translate-y-2 group-hover:translate-y-0 z-50">
            <div className="bg-slate-900/95 backdrop-blur-xl border border-white/10 rounded-2xl shadow-[0_10px_40px_rgba(0,0,0,0.5)] py-3 flex flex-col mt-2">
              <Link to="/eba-akademik-destek" className="px-5 py-2.5 hover:bg-white/5 hover:text-blue-400 transition-colors">EBA Akademik Destek</Link>
              <Link to="/mebi" className="px-5 py-2.5 hover:bg-white/5 hover:text-blue-400 transition-colors">Bireysel Öğrenme Platformu (MEBİ)</Link>
              <Link to="/ogm-materyal" className="px-5 py-2.5 hover:bg-white/5 hover:text-blue-400 transition-colors">OGM Materyal</Link>
              <a href="https://tymm.meb.gov.tr/ders-kitaplari/ortaogretim" target="_blank" rel="noopener noreferrer" className="px-5 py-2.5 hover:bg-white/5 hover:text-blue-400 transition-colors flex items-center justify-between gap-2">Lise MEB Kitapları PDF <ExternalLink size={14} className="opacity-50" /></a>
              <Link to="/meb-mufredat" className="px-5 py-2.5 hover:bg-white/5 hover:text-blue-400 transition-colors">MEB Müfredatı</Link>
            </div>
          </div>
        </div>

        <div className="relative group">
          <button className="flex items-center gap-1 hover:text-white transition-colors py-2 relative">
            Faaliyetlerimiz <ChevronDown size={14} className="group-hover:rotate-180 transition-transform duration-300" />
            <span className="absolute bottom-0 left-0 w-full h-8 translate-y-full"></span> {/* Invisible hover bridge */}
          </button>
          
          <div className="absolute top-full left-1/2 -translate-x-1/2 mt-0 w-56 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-300 translate-y-2 group-hover:translate-y-0 z-50">
            <div className="bg-slate-900/95 backdrop-blur-xl border border-white/10 rounded-2xl shadow-[0_10px_40px_rgba(0,0,0,0.5)] py-3 flex flex-col mt-2">
              <Link to="/deneme-takibi" className="px-5 py-2.5 hover:bg-white/5 hover:text-blue-400 transition-colors">Deneme Takibi</Link>
              <Link to="/derin-deneme-analizi" className="px-5 py-2.5 hover:bg-white/5 hover:text-blue-400 transition-colors">Derin Deneme Analizi</Link>
              <Link to="/kisilik-analizleri" className="px-5 py-2.5 hover:bg-white/5 hover:text-blue-400 transition-colors">Kişilik Analizleri</Link>
              <Link to="/sinav-metronomu" className="px-5 py-2.5 hover:bg-white/5 hover:text-blue-400 transition-colors">Sınav Metronomu</Link>
              <Link to="/sinav-surec-takibi" className="px-5 py-2.5 hover:bg-white/5 hover:text-blue-400 transition-colors">Sınav Süreç Takibi</Link>
            </div>
          </div>
        </div>

        <div className="relative group">
          <button className="flex items-center gap-1 hover:text-white transition-colors py-2 relative">
            Hakkımızda <ChevronDown size={14} className="group-hover:rotate-180 transition-transform duration-300" />
            <span className="absolute bottom-0 left-0 w-full h-8 translate-y-full"></span> {/* Invisible hover bridge */}
          </button>
          
          <div className="absolute top-full left-1/2 -translate-x-1/2 mt-0 w-60 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-300 translate-y-2 group-hover:translate-y-0 z-50">
            <div className="bg-slate-900/95 backdrop-blur-xl border border-white/10 rounded-2xl shadow-[0_10px_40px_rgba(0,0,0,0.5)] py-3 flex flex-col mt-2">
              <Link to="/hakkimizda" className="px-5 py-2.5 hover:bg-white/5 hover:text-blue-400 transition-colors">Biz Kimiz?</Link>
              <Link to="/vizyon-misyon" className="px-5 py-2.5 hover:bg-white/5 hover:text-blue-400 transition-colors">Vizyon & Misyon</Link>
              <Link to="/egitim-kadromuz" className="px-5 py-2.5 hover:bg-white/5 hover:text-blue-400 transition-colors">Eğitim Kadromuz</Link>
              <Link to="/basarilarimiz" className="px-5 py-2.5 hover:bg-white/5 hover:text-blue-400 transition-colors">Başarılarımız</Link>
              <Link to="/sss" className="px-5 py-2.5 hover:bg-white/5 hover:text-blue-400 transition-colors">Sıkça Sorulan Sorular</Link>
            </div>
          </div>
        </div>

        <Link to="/iletisim" className="hover:text-white transition-colors">İletişim</Link>
      </nav>

      <div className="flex items-center gap-3">
        {user && (
          <div className="hidden lg:block">
            <NotificationBell notifications={notifications} setNotifications={setNotifications} />
          </div>
        )}
        {user ? (
          <div className="relative group hidden lg:block">
            <button className="flex items-center gap-2 px-4 py-2 rounded-full bg-blue-600/10 border border-blue-500/30 text-sm font-semibold text-blue-400 hover:bg-blue-600/20 transition-all">
              <div className="w-6 h-6 rounded-full bg-blue-500 flex items-center justify-center text-white text-[10px] overflow-hidden">
                {userData?.photoURL ? (
                  <img src={userData.photoURL} alt="Avatar" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                ) : (
                  `${userData?.firstName?.[0] || ''}${userData?.lastName?.[0] || ''}` || 'U'
                )}
              </div>
              <span className="hidden sm:inline">{userData?.firstName}</span>
              <ChevronDown size={14} className="group-hover:rotate-180 transition-transform duration-300" />
            </button>
            
            <div className="absolute top-full right-0 mt-2 w-48 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-300 translate-y-2 group-hover:translate-y-0 z-50">
              <div className="bg-slate-900/95 backdrop-blur-xl border border-white/10 rounded-2xl shadow-[0_10px_40px_rgba(0,0,0,0.5)] py-2 flex flex-col overflow-hidden">
                <div className="px-4 py-3 border-b border-white/5 mb-1">
                  <p className="text-xs text-slate-500 font-medium uppercase tracking-wider">Kullanıcı Hesabı</p>
                  <p className="text-sm text-white font-semibold truncate">
                    {userData ? `${userData.firstName} ${userData.lastName}` : (user.displayName || user.email?.split('@')[0])}
                  </p>
                  <p className="text-[10px] text-blue-400 font-bold uppercase tracking-widest mt-0.5">
                    {!userData ? 'Profil Yükleniyor...' : 
                     userData.role === 'student' ? 'Öğrenci' : 
                     userData.role === 'coach' ? 'Koç' : 
                     userData.role === 'admin' ? 'Yönetici' : 
                     userData.role === 'parent' ? 'Veli' : 'Kullanıcı'}
                  </p>
                </div>

                <Link to="/profil" className="px-4 py-2.5 hover:bg-white/5 text-slate-300 hover:text-white transition-colors flex items-center gap-3 text-sm">
                  <User size={16} className="text-blue-400" />
                  Profil Ayarları
                </Link>
                
                {userData?.role === 'student' && (
                  <Link to="/panel/ogrenci" className="px-4 py-2.5 hover:bg-white/5 text-slate-300 hover:text-white transition-colors flex items-center gap-3 text-sm">
                    <LayoutDashboard size={16} className="text-blue-400" />
                    Öğrenci Paneli
                  </Link>
                )}
                
                {userData?.role === 'coach' && (
                  <>
                    <Link to="/panel/koc" className="px-4 py-2.5 hover:bg-white/5 text-slate-300 hover:text-white transition-colors flex items-center gap-3 text-sm">
                      <LayoutDashboard size={16} className="text-emerald-400" />
                      Koç Paneli
                    </Link>
                    <Link to="/panel/koc/musaitlik" className="px-4 py-2.5 hover:bg-white/5 text-slate-300 hover:text-white transition-colors flex items-center gap-3 text-sm">
                      <Clock size={16} className="text-emerald-400" />
                      Müsaitlik Ayarları
                    </Link>
                  </>
                )}

                {userData?.role === 'parent' && (
                  <Link to="/panel/veli" className="px-4 py-2.5 hover:bg-white/5 text-slate-300 hover:text-white transition-colors flex items-center gap-3 text-sm">
                    <LayoutDashboard size={16} className="text-emerald-500" />
                    Veli Paneli
                  </Link>
                )}

                {userData?.role === 'admin' && (
                  <>
                    <Link to="/panel/admin" className="px-4 py-2.5 hover:bg-white/5 text-slate-300 hover:text-white transition-colors flex items-center gap-3 text-sm">
                      <Shield size={16} className="text-red-500" />
                      Yönetici Paneli
                    </Link>
                    <Link to="/panel/koc" className="px-4 py-2.5 hover:bg-white/5 text-slate-300 hover:text-white transition-colors flex items-center gap-3 text-sm">
                      <LayoutDashboard size={16} className="text-emerald-400" />
                      Koç Paneli
                    </Link>
                    <Link to="/panel/veli" className="px-4 py-2.5 hover:bg-white/5 text-slate-300 hover:text-white transition-colors flex items-center gap-3 text-sm">
                      <LayoutDashboard size={16} className="text-emerald-500" />
                      Veli Paneli
                    </Link>
                    <Link to="/panel/ogrenci" className="px-4 py-2.5 hover:bg-white/5 text-slate-300 hover:text-white transition-colors flex items-center gap-3 text-sm">
                      <LayoutDashboard size={16} className="text-blue-400" />
                      Öğrenci Paneli
                    </Link>
                    <div className="h-px bg-white/5 my-1 mx-4" />
                  </>
                )}

                <Link to="/topluluk" className="px-4 py-2.5 hover:bg-white/5 text-slate-300 hover:text-white transition-colors flex items-center gap-3 text-sm">
                  <Users size={16} className="text-purple-400" />
                  Topluluk
                </Link>

                <button 
                  onClick={() => logout()}
                  className="px-4 py-2.5 hover:bg-red-500/10 text-slate-300 hover:text-red-400 transition-colors flex items-center gap-3 text-sm text-left w-full"
                >
                  <LogOut size={16} />
                  Çıkış Yap
                </button>
              </div>
            </div>
          </div>
        ) : (
          <Link to="/giris" className="hidden lg:flex px-5 py-2 rounded-full border border-slate-700 hover:bg-slate-800 transition-colors text-sm font-medium gap-2 items-center">
            <User size={18} />
            Giriş Yap
          </Link>
        )}
        
        {/* Mobile Menu Toggle button */}
        <button 
          className="lg:hidden text-slate-300 hover:text-white p-2 relative"
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          aria-label="Toggle Menu"
        >
          {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
          {!isMobileMenuOpen && unreadCount > 0 && (
            <span className="absolute top-1 right-1 w-4 h-4 bg-emerald-500 text-[10px] font-black text-white rounded-full flex items-center justify-center border border-[#070b14] animate-pulse">
              {unreadCount}
            </span>
          )}
        </button>
      </div>

      {/* Mobile Menu Backdrop */}
      <div 
        className={`fixed inset-0 bg-slate-900/80 backdrop-blur-sm z-40 transition-opacity duration-300 lg:hidden ${isMobileMenuOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`} 
        onClick={() => setIsMobileMenuOpen(false)}
      />

      {/* Mobile Menu Drawer */}
      <div className={`fixed top-0 right-0 h-[100dvh] w-[85vw] max-w-sm bg-slate-900 border-l border-white/10 z-50 lg:hidden transform transition-transform duration-300 ease-in-out flex flex-col ${isMobileMenuOpen ? 'translate-x-0' : 'translate-x-full'}`}>
        <div className="flex items-center justify-between p-4 border-b border-white/10 shrink-0">
          <div className="flex items-center gap-2">
            <img src="/images/logo.png" alt="FocusON Akademi Logo" className="h-8 w-auto object-contain" />
          </div>
          <button 
            className="p-2 text-slate-400 hover:text-white bg-white/5 rounded-full"
            onClick={() => setIsMobileMenuOpen(false)}
          >
            <X size={20} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto custom-scrollbar p-4 space-y-1">
          {mobileDrawerView === 'menu' ? (
            <>
              {user && (
                <button 
                  onClick={() => setMobileDrawerView('notifications')}
                  className="w-full mb-4 flex items-center justify-between py-3 px-4 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 rounded-xl"
                >
                  <div className="flex items-center gap-3">
                    <Bell size={18} />
                    <span className="font-semibold">Bildirimler</span>
                  </div>
                  {unreadCount > 0 && (
                    <span className="bg-emerald-500 text-white text-xs font-black px-2 py-0.5 rounded-full">
                      {unreadCount} Yeni
                    </span>
                  )}
                </button>
              )}
              
              <Link to="/" className="py-3 px-4 text-base font-medium text-white hover:bg-white/5 rounded-xl transition-colors block">Ana Sayfa</Link>
            
            {/* Mobile YKS Dropdown */}
            <div className="flex flex-col">
              <button 
                onClick={() => toggleSubmenu('yks')}
                className="py-3 flex items-center justify-between px-4 text-base font-medium text-white hover:bg-white/5 rounded-xl transition-colors"
              >
                <span>YKS</span>
                <ChevronDown size={16} className={`transition-transform ${openMobileSubmenu === 'yks' ? 'rotate-180' : ''}`} />
              </button>
              {openMobileSubmenu === 'yks' && (
                <div className="bg-white/5 rounded-xl mt-1 py-2 px-3 flex flex-col space-y-1">
                  <Link to="/sinav-geri-sayimi" className="py-2 px-3 text-sm text-slate-300 hover:text-white hover:bg-white/5 rounded-lg">Sınav Geri Sayımı</Link>
                  <Link to="/kanal-onerileri" className="py-2 px-3 text-sm text-slate-300 hover:text-white hover:bg-white/5 rounded-lg">Kanal Önerileri</Link>
                  <Link to="/yks-konulari" className="py-2 px-3 text-sm text-slate-300 hover:text-white hover:bg-white/5 rounded-lg">YKS Konuları</Link>
                  <Link to="/soru-dagilimi" className="py-2 px-3 text-sm text-slate-300 hover:text-white hover:bg-white/5 rounded-lg">Hangi Konu Kaç Soru?</Link>
                  <Link to="/yks-puan-hesaplama" className="py-2 px-3 text-sm text-slate-300 hover:text-white hover:bg-white/5 rounded-lg">YKS Puan Hesaplama</Link>
                  <Link to="/meslek-rehberi" className="py-2 px-3 text-sm text-slate-300 hover:text-white hover:bg-white/5 rounded-lg">Meslek Rehberi</Link>
                  <Link to="/yok-atlas" className="py-2 px-3 text-sm text-slate-300 hover:text-white hover:bg-white/5 rounded-lg">YÖK Atlas</Link>
                  <Link to="/kyk-yurtlari" className="py-2 px-3 text-sm text-slate-300 hover:text-white hover:bg-white/5 rounded-lg">KYK Yurtları</Link>
                </div>
              )}
            </div>

            {/* Mobile MEB Dropdown */}
            <div className="flex flex-col">
              <button 
                onClick={() => toggleSubmenu('meb')}
                className="py-3 flex items-center justify-between px-4 text-base font-medium text-white hover:bg-white/5 rounded-xl transition-colors"
              >
                <span>MEB</span>
                <ChevronDown size={16} className={`transition-transform ${openMobileSubmenu === 'meb' ? 'rotate-180' : ''}`} />
              </button>
              {openMobileSubmenu === 'meb' && (
                <div className="bg-white/5 rounded-xl mt-1 py-2 px-3 flex flex-col space-y-1">
                  <Link to="/eba-akademik-destek" className="py-2 px-3 text-sm text-slate-300 hover:text-white hover:bg-white/5 rounded-lg">EBA Akademik Destek</Link>
                  <Link to="/mebi" className="py-2 px-3 text-sm text-slate-300 hover:text-white hover:bg-white/5 rounded-lg">MEBİ</Link>
                  <Link to="/ogm-materyal" className="py-2 px-3 text-sm text-slate-300 hover:text-white hover:bg-white/5 rounded-lg">OGM Materyal</Link>
                  <a href="https://tymm.meb.gov.tr/ders-kitaplari/ortaogretim" target="_blank" rel="noopener noreferrer" className="py-2 px-3 text-sm text-slate-300 hover:text-white hover:bg-white/5 rounded-lg flex items-center gap-2">Lise MEB Kitapları PDF <ExternalLink size={14} className="opacity-50" /></a>
                  <Link to="/meb-mufredat" className="py-2 px-3 text-sm text-slate-300 hover:text-white hover:bg-white/5 rounded-lg">MEB Müfredatı</Link>
                </div>
              )}
            </div>

            {/* Mobile Sınav Hakkında Dropdown */}
            <div className="flex flex-col">
              <button 
                onClick={() => toggleSubmenu('sinav')}
                className="py-3 flex items-center justify-between px-4 text-base font-medium text-white hover:bg-white/5 rounded-xl transition-colors"
              >
                <span>Sınav Hakkında</span>
                <ChevronDown size={16} className={`transition-transform ${openMobileSubmenu === 'sinav' ? 'rotate-180' : ''}`} />
              </button>
              {openMobileSubmenu === 'sinav' && (
                <div className="bg-white/5 rounded-xl mt-1 py-2 px-3 flex flex-col space-y-1">
                  <Link to="/deneme-takibi" className="py-2 px-3 text-sm text-slate-300 hover:text-white hover:bg-white/5 rounded-lg">Deneme Takibi</Link>
                  <Link to="/derin-deneme-analizi" className="py-2 px-3 text-sm text-slate-300 hover:text-white hover:bg-white/5 rounded-lg">Derin Deneme Analizi</Link>
                  <Link to="/kisilik-analizleri" className="py-2 px-3 text-sm text-slate-300 hover:text-white hover:bg-white/5 rounded-lg">Kişilik Analizleri</Link>
                  <Link to="/sinav-metronomu" className="py-2 px-3 text-sm text-slate-300 hover:text-white hover:bg-white/5 rounded-lg">Sınav Metronomu</Link>
                  <Link to="/sinav-surec-takibi" className="py-2 px-3 text-sm text-slate-300 hover:text-white hover:bg-white/5 rounded-lg">Sınav Süreç Takibi</Link>
                </div>
              )}
            </div>

            {/* Mobile Hakkımızda Dropdown */}
            <div className="flex flex-col">
              <button 
                onClick={() => toggleSubmenu('hakkimizda')}
                className="py-3 flex items-center justify-between px-4 text-base font-medium text-white hover:bg-white/5 rounded-xl transition-colors"
              >
                <span>Hakkımızda</span>
                <ChevronDown size={16} className={`transition-transform ${openMobileSubmenu === 'hakkimizda' ? 'rotate-180' : ''}`} />
              </button>
              {openMobileSubmenu === 'hakkimizda' && (
                <div className="bg-white/5 rounded-xl mt-1 py-2 px-3 flex flex-col space-y-1">
                  <Link to="/hakkimizda" className="py-2 px-3 text-sm text-slate-300 hover:text-white hover:bg-white/5 rounded-lg">Biz Kimiz?</Link>
                  <Link to="/vizyon-misyon" className="py-2 px-3 text-sm text-slate-300 hover:text-white hover:bg-white/5 rounded-lg">Vizyon & Misyon</Link>
                  <Link to="/egitim-kadromuz" className="py-2 px-3 text-sm text-slate-300 hover:text-white hover:bg-white/5 rounded-lg">Eğitim Kadromuz</Link>
                  <Link to="/basarilarimiz" className="py-2 px-3 text-sm text-slate-300 hover:text-white hover:bg-white/5 rounded-lg">Başarılarımız</Link>
                  <Link to="/sss" className="py-2 px-3 text-sm text-slate-300 hover:text-white hover:bg-white/5 rounded-lg">Sıkça Sorulan Sorular</Link>
                </div>
              )}
            </div>

            <Link to="/iletisim" className="py-3 px-4 text-base font-medium text-white hover:bg-white/5 rounded-xl transition-colors">İletişim</Link>
            
            {/* User mobile actions */}
            {!user && (
              <div className="pt-4 mt-2 border-t border-white/10 px-4">
                <Link to="/giris" className="flex justify-center items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white py-3 rounded-xl font-medium transition-colors">
                  <User size={18} />
                  Giriş Yap / Üye Ol
                </Link>
              </div>
            )}
            
            {user && (
              <div className="pt-4 mt-2 border-t border-white/10 flex flex-col space-y-1">
                <div className="px-4 py-2 opacity-60 text-xs uppercase tracking-widest font-semibold">Profil İşlemleri</div>
                <Link to="/profil" className="py-3 px-4 text-base font-medium text-white hover:bg-white/5 rounded-xl transition-colors flex gap-3 items-center">
                   <User size={18} /> Profil Ayarları
                </Link>
                {userData?.role === 'student' && (
                  <Link to="/panel/ogrenci" className="py-3 px-4 text-base font-medium text-white hover:bg-white/5 rounded-xl transition-colors flex gap-3 items-center">
                    <LayoutDashboard size={18} /> Öğrenci Paneli
                  </Link>
                )}
                {userData?.role === 'coach' && (
                  <>
                    <Link to="/panel/koc" className="py-3 px-4 text-base font-medium text-white hover:bg-white/5 rounded-xl transition-colors flex gap-3 items-center">
                      <LayoutDashboard size={18} /> Koç Paneli
                    </Link>
                    <Link to="/panel/koc/musaitlik" className="py-3 px-4 text-base font-medium text-white hover:bg-white/5 rounded-xl transition-colors flex gap-3 items-center">
                      <Clock size={18} /> Müsaitlik Ayarları
                    </Link>
                  </>
                )}
                {userData?.role === 'admin' && (
                  <>
                    <Link to="/panel/admin" className="py-3 px-4 text-base font-medium text-white hover:bg-white/5 rounded-xl transition-colors flex gap-3 items-center">
                      <Shield size={18} /> Yönetici Paneli
                    </Link>
                    <Link to="/panel/koc" className="py-3 px-4 text-base font-medium text-white hover:bg-white/5 rounded-xl transition-colors flex gap-3 items-center">
                      <LayoutDashboard size={18} /> Koç Paneli
                    </Link>
                    <Link to="/panel/ogrenci" className="py-3 px-4 text-base font-medium text-white hover:bg-white/5 rounded-xl transition-colors flex gap-3 items-center">
                      <LayoutDashboard size={18} /> Öğrenci Paneli
                    </Link>
                  </>
                )}
                
                <Link to="/topluluk" className="py-3 px-4 text-base font-medium text-white hover:bg-white/5 rounded-xl transition-colors flex gap-3 items-center">
                  <Users size={18} className="text-purple-400" /> Topluluk
                </Link>

                <button 
                  onClick={() => logout()}
                  className="py-3 px-4 text-base font-medium text-red-400 hover:bg-red-500/10 rounded-xl transition-colors flex gap-3 items-center text-left"
                >
                  <LogOut size={18} /> Çıkış Yap
                </button>
              </div>
            )}
            </>
          ) : (
            <div className="flex flex-col h-full">
              <div className="flex items-center justify-between mb-4 px-2">
                <button 
                  onClick={() => setMobileDrawerView('menu')}
                  className="text-slate-400 hover:text-white flex items-center gap-2 text-sm font-medium"
                >
                  <span>&larr; Menüye Dön</span>
                </button>
                {unreadCount > 0 && (
                  <button onClick={markAllAsRead} className="text-xs text-emerald-400 hover:text-emerald-300 font-bold">
                    Hepsini Oku
                  </button>
                )}
              </div>
              
              <div className="flex-1 overflow-y-auto space-y-2">
                {notifications.length > 0 ? (
                  notifications.map(n => (
                    <div 
                      key={n.id} 
                      onClick={() => toggleRead(n.id)}
                      className={`p-4 rounded-xl border relative ${n.read ? 'bg-white/5 border-white/5' : 'bg-emerald-500/5 border-emerald-500/20'}`}
                    >
                      {!n.read && <div className="absolute left-0 top-3 bottom-3 w-1 bg-emerald-500 rounded-r-md" />}
                      <div className="flex justify-between items-start gap-3">
                        <div className="flex-1">
                          <h4 className={`text-sm font-bold mb-1 ${!n.read ? 'text-white' : 'text-slate-300'}`}>{n.title}</h4>
                          <p className="text-xs text-slate-400 leading-relaxed">{n.message}</p>
                          <div className="text-[10px] text-slate-500 mt-2 font-medium">{n.time}</div>
                        </div>
                        <button 
                          onClick={(e) => deleteNotification(n.id, e)}
                          className="text-slate-500 hover:text-red-400 p-1"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-10 opacity-50">
                    <Bell size={24} className="mx-auto mb-3" />
                    <p className="text-sm">Hiç bildirim yok.</p>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
