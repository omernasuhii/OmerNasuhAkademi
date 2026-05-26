import React, { useState } from 'react';
import { NavLink, Outlet, Link, useLocation } from 'react-router-dom';
import { 
  BarChart3, 
  Users, 
  Settings, 
  ShieldAlert, 
  FileText,
  UserCheck,
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
  PanelLeftOpen
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
  const [expandedGroups, setExpandedGroups] = useState<string[]>(['Randevu Takvimi']);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);

  const toggleGroup = (groupTitle: string) => {
    setExpandedGroups(prev => 
      prev.includes(groupTitle) 
        ? prev.filter(t => t !== groupTitle) 
        : [...prev, groupTitle]
    );
  };

  const menuGroups: MenuGroup[] = [
    {
      group: 'Ana Menü',
      items: [
        { title: 'Ana Sayfa', path: '', icon: BarChart3 },
        { title: 'Gelen Kutusu', path: 'gelen-kutusu', icon: Inbox, badge: '5' },
      ]
    },
    {
      group: 'Randevu & Planlama',
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
      ]
    },
    {
      group: 'Satış & Finans',
      items: [
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
      group: 'Ürün Kataloğu',
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
      ]
    },
    {
      group: 'Kurum Yönetimi',
      items: [
        { title: 'Kullanıcı Yönetimi', path: 'kullanicilar', icon: Users },
        { title: 'Koç Onayları', path: 'koc-onaylari', icon: UserCheck },
        { title: 'Masa Rezervasyonları', path: 'masa-rezervasyonlari', icon: LayoutGrid },
        { title: 'Oda Yönetimi', path: 'odalar', icon: Layers },
        { title: 'Personel Bordro', path: 'bordro', icon: CreditCard },
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
        { 
          title: 'Blog', 
          icon: FileText,
          subItems: [
            { title: 'Yazılar', path: 'blog' },
            { title: 'Yazarlar', path: 'yazarlar' },
            { title: 'Yorumlar', path: 'yorumlar' },
          ]
        },
        { title: 'Video Kütüphanesi', path: 'videolar', icon: Video },
        { title: 'Dosya Paylaşımı', path: 'dosyalar', icon: FolderOpen },
      ]
    },
    {
      group: 'Pazarlama & CRM',
      items: [
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
    <div className="flex flex-1 min-h-screen bg-[#070b14] font-sans relative">
      {/* Sidebar Toggle Trigger (Visible when collapsed) */}
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

      {/* Admin Sidebar */}
      <aside className={`
        bg-[#070b14] border-r border-white/5 flex flex-col shrink-0 z-40 transition-all duration-300 relative
        ${isSidebarCollapsed ? 'w-0 opacity-0 pointer-events-none' : 'w-80 opacity-100'}
      `}>
        {/* Toggle Button Inside Sidebar */}
        {!isSidebarCollapsed && (
          <button 
            onClick={() => setIsSidebarCollapsed(true)}
            className="absolute -right-3 top-1/2 -translate-y-1/2 w-6 h-12 bg-[#070b14] border border-white/5 rounded-full flex items-center justify-center text-slate-500 hover:text-white transition-colors hidden lg:flex z-50"
          >
            <ChevronLeft size={14} />
          </button>
        )}

        <div className="p-8 shrink-0">
          <Link to="/" className="flex items-center gap-4 group">
            <div className="bg-red-600 p-2.5 rounded-2xl shadow-[0_0_20px_rgba(220,38,38,0.4)] group-hover:scale-105 transition-all duration-500">
              <ShieldAlert size={24} className="text-white" />
            </div>
            <div className="overflow-hidden">
              <h1 className="text-lg font-black text-white tracking-widest uppercase leading-none mb-1">Admin</h1>
              <p className="text-[10px] text-slate-500 font-black uppercase tracking-[0.2em] whitespace-nowrap">FocusON Yönetim</p>
            </div>
          </Link>
          
          <div className="mt-8 relative group">
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

        <nav className="px-4 pb-10 space-y-8">
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
                              {item.subItems.map((sub) => (
                                <NavLink
                                  key={sub.path}
                                  to={sub.path}
                                  className={({ isActive }) => `
                                    flex items-center gap-4 px-6 py-2.5 text-xs font-bold transition-all
                                    ${isActive 
                                      ? 'text-red-500' 
                                      : 'text-slate-500 hover:text-slate-300'
                                    }
                                  `}
                                >
                                  {({ isActive }) => (
                                    <>
                                      <div className={`w-1.5 h-1.5 rounded-full transition-all ${isActive ? 'bg-red-600 scale-125 shadow-[0_0_8px_rgba(220,38,38,0.8)]' : 'bg-slate-800'}`} />
                                      {sub.title}
                                    </>
                                  )}
                                </NavLink>
                              ))}
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

        <div className="p-6 shrink-0 border-t border-white/5 bg-[#070b14]">
          <div className="flex items-center gap-4 mb-8 px-2">
            <div className="relative group">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-slate-900 to-slate-800 border border-white/10 overflow-hidden shrink-0 group-hover:scale-105 transition-transform duration-500">
                 {userData?.photoURL ? (
                    <img src={userData.photoURL} alt="Admin" className="w-full h-full object-cover" />
                 ) : (
                    <div className="w-full h-full flex items-center justify-center text-slate-400 font-bold text-lg">
                      {(userData?.firstName?.charAt(0) || user?.email?.charAt(0) || 'A').toUpperCase()}
                    </div>
                 )}
              </div>
              <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-emerald-500 border-2 border-[#070b14] rounded-full shadow-lg"></div>
            </div>
            <div className="overflow-hidden">
              <p className="text-sm font-black text-white truncate tracking-tight">
                {userData?.firstName 
                  ? `${userData.firstName} ${userData.lastName || ''}` 
                  : (user?.displayName || user?.email?.split('@')[0] || 'Yönetici')}
              </p>
              <p className="text-[10px] text-red-500 font-black uppercase tracking-widest">Süper Yetkili</p>
            </div>
          </div>
          <button 
            onClick={() => logout()}
            className="w-full flex items-center justify-center gap-3 bg-red-600/10 hover:bg-red-600 text-red-500 hover:text-white text-xs font-black uppercase tracking-widest py-4 rounded-2xl transition-all duration-300 border border-red-600/20 group"
          >
            <LogOut size={16} className="group-hover:rotate-12 transition-transform" /> 
            Güvenli Çıkış
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col bg-[#020617]">
        <div className={location.pathname.includes('/randevular') ? "flex-1 w-full relative min-h-[calc(100vh-96px)]" : "p-12 max-w-7xl mx-auto"}>
          <Outlet />
        </div>
      </main>
    </div>
  );
}
