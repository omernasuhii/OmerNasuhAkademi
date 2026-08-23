import React, { useState, useEffect } from 'react';
import { NavLink, Outlet, Link, useLocation } from 'react-router-dom';
import { collection, query, where, onSnapshot } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { 
  BarChart3, 
  Users, 
  Settings, 
  ShieldAlert, 
  FileText,
  UserCheck,
  GraduationCap,
  LayoutGrid,
  ChevronRight,
  LogOut,
  Calendar,
  DollarSign,
  Ticket,
  ShoppingBag,
  CreditCard,
  Hash,
  Video,
  Layers,
  Search,
  ChevronDown,
  Inbox,
  Zap,
  Box,
  Globe,
  Star,
  Activity,
  MessageSquare,
  MoreVertical,
  BookOpen,
  FolderOpen,
  ChevronLeft,
  PanelLeftOpen,
  Target,
  Megaphone,
  Sparkles,
  Share2,
  X
} from 'lucide-react';
import { useAuth } from '../../lib/AuthContext';
import { motion, AnimatePresence } from 'motion/react';
import NotificationBell from '../../components/layout/NotificationBell';

interface SubItem {
  title: string;
  path: string;
}

interface MenuItem {
  title: string;
  path?: string;
  icon: React.ElementType;
  subItems?: SubItem[];
  badge?: string;
}

interface MenuGroup {
  group: string;
  items: MenuItem[];
}

export default function AdminLayout() {
  const { user, userData, logout } = useAuth();
  const location = useLocation();
  const [expandedGroups, setExpandedGroups] = useState<string[]>([]);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [isMobileDrawerOpen, setIsMobileDrawerOpen] = useState(false);
  const [unreadMessages, setUnreadMessages] = useState<number>(0);

  useEffect(() => {
    setIsMobileDrawerOpen(false);
  }, [location.pathname]);

  useEffect(() => {
    if (!user) return;
    const q = query(collection(db, 'inbox_messages'), where('status', '==', 'new'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      setUnreadMessages(snapshot.docs.length);
    });
    return () => unsubscribe();
  }, [user]);

  // Auto-expand accordion categories containing an active sub-item on route or search-param change
  useEffect(() => {
    menuGroups.forEach(group => {
      group.items.forEach(item => {
        if (item.subItems) {
          const hasActiveSub = item.subItems.some(sub => {
            const fullSubPath = `/panel/admin/${sub.path}`;
            const currentFull = `${location.pathname}${location.search}`;
            return sub.path.includes('?')
              ? (currentFull === fullSubPath || currentFull.endsWith(sub.path))
              : location.pathname.endsWith(sub.path);
          });
          if (hasActiveSub && !expandedGroups.includes(item.title)) {
            setExpandedGroups(prev => [...prev, item.title]);
          }
        }
      });
    });
  }, [location.pathname, location.search]);

  const toggleGroup = (groupTitle: string) => {
    setExpandedGroups(prev => 
      prev.includes(groupTitle) 
        ? prev.filter(t => t !== groupTitle) 
        : [...prev, groupTitle]
    );
  };

  const menuGroups: MenuGroup[] = [
    {
      group: 'Genel Bakış',
      items: [
        { title: 'Ana Sayfa', path: '', icon: BarChart3 },
        { title: 'Duyurular', path: 'duyurular', icon: Megaphone },
        { 
          title: 'Gelen Kutusu', 
          icon: Inbox, 
          badge: unreadMessages > 0 ? unreadMessages.toString() : undefined,
          subItems: [
            { title: 'WhatsApp', path: 'gelen-kutusu?tab=whatsapp' },
            { title: 'Randevu Talepleri', path: 'gelen-kutusu?tab=forms' },
            { title: 'İK Başvuruları', path: 'gelen-kutusu?tab=hr' },
            { title: 'İletişim Mesajları', path: 'gelen-kutusu?tab=contact' },
          ]
        },
      ]
    },
    {
      group: 'Akademi & Eğitim',
      items: [
        {
          title: 'İçerik & Müfredat',
          icon: BookOpen,
          subItems: [
            { title: 'Kaynak Takibi', path: 'kaynaklar' },
            { title: 'Konu Listesi', path: 'konular' },
            { title: 'Soru Havuzu', path: 'sorular' },
            { title: 'Deneme Sınavları', path: 'akademik-denemeler' },
          ]
        },
        { title: 'Öğrenci Hedefleri', path: 'ogrenci-hedefleri', icon: Target },
        { title: 'Müfredat Yönetimi', path: 'mufredat', icon: Layers },
        { title: 'Akademik Takvim', path: 'akademik-takvim', icon: Calendar },
      ]
    },
    {
      group: 'Kullanıcılar & Personel',
      items: [
        { title: 'Kullanıcı Yönetimi', path: 'kullanicilar', icon: Users },
        { title: 'Öğrenci Paneli İnceleme', path: '/panel/ogrenci?teshis=true', icon: Sparkles, badge: 'Teşhis' },
        { title: 'Koç Onayları', path: 'koc-onaylari', icon: UserCheck },
        { title: 'Bursluluk (ÇABA)', path: 'bursluluk', icon: GraduationCap },
      ]
    },
    {
      group: 'Planlama & Tesis',
      items: [
        { 
          title: 'Randevu Takvimi', 
          icon: Calendar,
          subItems: [
            { title: 'Takvim', path: 'randevular' },
            { title: 'Randevu Listesi', path: 'randevu-listesi' },
            { title: 'Çalışma Programı', path: 'calisma-programi' },
            { title: 'Randevu Analizleri', path: 'randevu-analizi' },
          ]
        },
        { 
          title: 'Etkinlikler', 
          icon: Activity,
          subItems: [
            { title: 'Yayınlananlar', path: 'etkinlikler' },
            { title: 'Taslaklar', path: 'etkinlikler/taslak' },
            { title: 'Kategoriler', path: 'etkinlikler/kategoriler' },
          ]
        },
        { title: 'Masa Rezervasyonları', path: 'masa-rezervasyonlari', icon: LayoutGrid },
        { title: 'Oda Yönetimi', path: 'odalar', icon: Layers },
      ]
    },
    {
      group: 'Dijital İçerik',
      items: [
        { 
          title: 'Online Programlar', 
          icon: Box,
          subItems: [
            { title: 'Programlar', path: 'programlar' },
            { title: 'Kategoriler', path: 'program-kategorileri' },
          ]
        },
        { title: 'Video Kütüphanesi', path: 'videolar', icon: Video },
        { title: 'Dosya Paylaşımı', path: 'dosyalar', icon: FolderOpen },
        { 
          title: 'Blog', 
          icon: FileText,
          subItems: [
            { title: 'Yazılar', path: 'blog' },
            { title: 'Yazarlar', path: 'yazarlar' },
            { title: 'Yorumlar', path: 'yorumlar' },
          ]
        },
      ]
    },
    {
      group: 'Ticaret & Finans',
      items: [
        { 
          title: 'Mağaza Ürünleri', 
          icon: ShoppingBag,
          subItems: [
            { title: 'Ürünler', path: 'urunler' },
            { title: 'Stok Durumu', path: 'stok' },
            { title: 'Kategoriler', path: 'urun-kategorileri' },
          ]
        },
        { title: 'Randevulu Hizmetler', path: 'hizmetler', icon: Settings },
        { title: 'Ücretli Abonelikler', path: 'ucretli-abonelikler', icon: CreditCard },
        { 
          title: 'Satış ve Muhasebe', 
          icon: DollarSign,
          subItems: [
            { title: 'Siparişler', path: 'siparisler' },
            { title: 'Abonelikler', path: 'abonelikler' },
            { title: 'Ödemeler & Mali Durum', path: 'mali-durum' },
            { title: 'Analizler', path: 'satis-analizleri' },
            { title: 'Terk Edilmiş Sepetler', path: 'sepetler' },
          ]
        },
        { 
          title: 'İndirimler', 
          icon: Ticket,
          subItems: [
            { title: 'Kuponlar', path: 'kuponlar' },
            { title: 'Otomatik İndirimler', path: 'indirimler' },
          ]
        },
      ]
    },
    {
      group: 'Pazarlama & CRM',
      items: [
        { title: 'AI Reklam & Medya Ajansı', path: 'sosyal-medya-ajansi', icon: Sparkles, badge: 'Flow AI' },
        { 
          title: 'CRM', 
          icon: Star,
          subItems: [
            { title: 'Kişiler', path: 'crm/kisiler' },
            { title: 'Formlar', path: 'crm/formlar' },
            { title: 'Toplantılar', path: 'crm/toplantilar' },
            { title: 'Takip Hatları', path: 'crm/takip' },
            { title: 'Sadakat Programı', path: 'crm/sadakat' },
          ]
        },
        { title: 'Referans Sistemi', path: 'referans', icon: Users },
        { title: 'Analizler', path: 'analizler', icon: Activity },
        { title: 'Otomasyonlar', path: 'otomasyonlar', icon: Zap },
      ]
    },
    {
      group: 'Sistem',
      items: [
        { title: 'Sistem Ayarları', path: 'ayarlar', icon: Settings },
        { title: 'CMS', path: 'cms', icon: Globe },
      ]
    }
  ];

  return (
    <div className="flex flex-1 h-full bg-[#070b14] font-sans relative min-w-0">
      {/* Sidebar Toggle Trigger (Visible when collapsed on desktop) */}
      <AnimatePresence>
        {isSidebarCollapsed && (
          <motion.button
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            onClick={() => setIsSidebarCollapsed(false)}
            className="fixed left-4 top-1/2 -translate-y-1/2 z-[60] w-10 h-10 bg-red-600 rounded-xl flex items-center justify-center text-white shadow-lg shadow-red-500/20 hover:scale-110 transition-transform hidden lg:flex"
          >
            <PanelLeftOpen size={20} />
          </motion.button>
        )}
      </AnimatePresence>

      {/* Mobile Drawer Backdrop */}
      <AnimatePresence>
        {isMobileDrawerOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setIsMobileDrawerOpen(false)}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 lg:hidden"
          />
        )}
      </AnimatePresence>

      {/* Admin Sidebar */}
      <aside className={`
        bg-[#070b14]/95 border-r border-white/5 flex flex-col shrink-0 z-50 transition-all duration-300 print:hidden
        fixed inset-y-0 left-0 w-80 max-w-[calc(100vw-3rem)]
        ${isMobileDrawerOpen ? 'translate-x-0' : '-translate-x-full'}
        lg:translate-x-0 lg:static
        ${isSidebarCollapsed ? 'lg:w-0 lg:opacity-0 lg:pointer-events-none' : 'lg:w-80 lg:opacity-100'}
      `}>
        {/* Toggle Button Inside Sidebar (Desktop only) */}
        {!isSidebarCollapsed && (
          <button 
            onClick={() => setIsSidebarCollapsed(true)}
            className="absolute -right-3 top-1/2 -translate-y-1/2 w-6 h-12 bg-[#070b14] border border-white/5 rounded-full flex items-center justify-center text-slate-500 hover:text-white transition-colors hidden lg:flex z-50"
          >
            <ChevronLeft size={14} />
          </button>
        )}

        <div className="p-8 shrink-0 flex items-center justify-between border-b border-white/5 lg:border-none">
          <Link to="/" className="flex items-center gap-4 group">
            <div className="bg-red-600 p-2.5 rounded-2xl shadow-[0_0_20px_rgba(220,38,38,0.4)] group-hover:scale-105 transition-all duration-500 text-white">
              <ShieldAlert size={24} />
            </div>
            <div className="overflow-hidden">
              <h1 className="text-lg font-black text-white tracking-widest uppercase leading-none mb-1">Admin</h1>
              <p className="text-[10px] text-slate-500 font-black uppercase tracking-[0.2em] whitespace-nowrap">FocusON Yönetim</p>
            </div>
          </Link>
          <button 
            onClick={() => setIsMobileDrawerOpen(false)}
            className="p-2 text-slate-400 hover:text-white bg-white/5 rounded-xl lg:hidden"
          >
            <X size={16} />
          </button>
        </div>

        <div className="px-8 mb-4">
          <div className="relative group">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-red-500 transition-colors" size={16} />
            <input 
              type="text" 
              placeholder="Ara..."
              className="w-full bg-white/5 border border-white/10 rounded-2xl py-3 pl-12 pr-4 text-sm text-slate-300 outline-none focus:border-red-600/50 focus:bg-red-600/[0.02] transition-all font-bold tracking-tight"
            />
            <div className="absolute right-4 top-1/2 -translate-y-1/2 flex items-center gap-1">
               <span className="text-[10px] bg-white/10 text-slate-500 px-1.5 py-0.5 rounded-md font-black">⌘</span>
               <span className="text-[10px] bg-white/10 text-slate-500 px-1.5 py-0.5 rounded-md font-black">K</span>
            </div>
          </div>
        </div>

        <nav className="px-4 pb-10 space-y-8 overflow-y-auto custom-scrollbar flex-1">
          {menuGroups.map((group) => (
            <div key={group.group}>
              <h3 className="px-4 text-[11px] font-black uppercase tracking-[0.2em] text-slate-600 mb-4 flex items-center justify-between">
                {group.group}
                <MoreVertical size={12} className="opacity-30" />
              </h3>
              <div className="space-y-1.5">
                {group.items.map((item) => (
                  <div key={item.title}>
                  {item.subItems ? (
                    <div>
                      <button
                        onClick={() => toggleGroup(item.title)}
                        className={`w-full flex items-center gap-3 px-4 py-3.5 rounded-2xl transition-all duration-300 group
                          ${expandedGroups.includes(item.title) ? 'text-white' : 'text-slate-500 hover:text-white hover:bg-white/5'}
                        `}
                      >
                        <item.icon size={20} className={`${expandedGroups.includes(item.title) ? 'text-red-500' : 'text-slate-500'} group-hover:text-red-500 transition-colors`} />
                        <span className="text-[13px] font-bold tracking-tight">{item.title}</span>
                        {item.badge && (
                          <span className="bg-red-600 text-white text-[10px] px-2 py-0.5 rounded-full font-black">
                            {item.badge}
                          </span>
                        )}
                        <ChevronDown 
                          size={16} 
                          className={`ml-auto transition-transform duration-500 ${expandedGroups.includes(item.title) ? 'rotate-180 text-red-500' : 'text-slate-600'}`} 
                        />
                      </button>
                      <AnimatePresence>
                        {expandedGroups.includes(item.title) && (
                          <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: 'auto', opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            className="overflow-hidden bg-white/[0.02] mx-2 rounded-2xl mt-1"
                          >
                            <div className="py-2 space-y-1">
                              {item.subItems.map((sub) => {
                                const fullSubPath = `/panel/admin/${sub.path}`;
                                const currentFull = `${location.pathname}${location.search}`;
                                const isSubActive = sub.path.includes('?')
                                  ? (currentFull === fullSubPath || currentFull.endsWith(sub.path))
                                  : location.pathname.endsWith(sub.path);

                                return (
                                  <NavLink
                                    key={sub.path}
                                    to={sub.path}
                                    className={`
                                      flex items-center gap-4 px-6 py-2.5 text-xs font-bold transition-all
                                      ${isSubActive 
                                        ? 'text-red-500' 
                                        : 'text-slate-500 hover:text-slate-300'
                                      }
                                    `}
                                  >
                                    <div className={`w-1.5 h-1.5 rounded-full transition-all ${isSubActive ? 'bg-red-600 scale-125 shadow-[0_0_8px_rgba(220,38,38,0.8)]' : 'bg-slate-800'}`} />
                                    <span>{sub.title}</span>
                                  </NavLink>
                                );
                              })}
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  ) : (
                    <NavLink
                      to={item.path || ''}
                      end
                      className={({ isActive }) => `
                        flex items-center gap-3 px-4 py-3.5 rounded-2xl transition-all duration-300 group
                        ${isActive 
                          ? 'bg-red-600/10 text-red-500 border border-red-600/20' 
                          : 'text-slate-500 hover:text-white hover:bg-white/5'
                        }
                      `}
                    >
                      <item.icon size={20} className="shrink-0" />
                      <span className="text-[13px] font-bold tracking-tight">{item.title}</span>
                      {item.badge && (
                        <span className="ml-auto bg-red-600 text-white text-[10px] px-2 py-0.5 rounded-full font-black">
                          {item.badge}
                        </span>
                      )}
                    </NavLink>
                  )}
                  </div>
                ))}
              </div>
            </div>
          ))}
        </nav>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col min-w-0 bg-[#020617]">
        {/* Mobile Sub-Header */}
        <div className="flex lg:hidden items-center gap-3 p-4 bg-[#070b14]/40 backdrop-blur-xl border-b border-white/5 sticky top-[72px] z-20 shrink-0">
          <button
            onClick={() => setIsMobileDrawerOpen(true)}
            className="p-2 bg-red-600/10 border border-red-500/20 rounded-xl text-red-500"
          >
            <PanelLeftOpen size={18} />
          </button>
          <div>
            <p className="text-[9px] text-red-500 font-bold uppercase tracking-widest leading-none mb-1">Admin Paneli</p>
            <h2 className="text-xs font-bold text-white leading-none">
              {menuGroups.flatMap(g => g.items).find(item => {
                const currentPath = location.pathname.split('/').pop() || '';
                return item.path === currentPath;
              })?.title || 'Ana Sayfa'}
            </h2>
          </div>
        </div>

        <div className={location.pathname.includes('/randevular') ? "flex-1 w-full relative min-h-[calc(100vh-96px)]" : "px-4 md:px-8 lg:px-12 w-full pb-8 pt-2 md:pt-4"}>
          <Outlet />
        </div>
      </main>
    </div>
  );
}
