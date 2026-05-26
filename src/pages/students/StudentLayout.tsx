import { NavLink, Outlet } from 'react-router-dom';
import { 
  LayoutDashboard, 
  BookOpen, 
  TrendingUp, 
  Settings, 
  User, 
  FileBox,
  Calendar,
  GraduationCap,
  Youtube,
  Trophy,
  PenTool,
  Users,
  MessageSquare,
  Share2,
  Brain,
  Video,
  Monitor,
  ShoppingBag,
  Wallet,
  Star,
  FileText,
  Search,
  ChevronLeft,
  PanelLeftOpen
} from 'lucide-react';
import { useAuth } from '../../lib/AuthContext';
import NotificationBell from '../../components/layout/NotificationBell';
import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';

export default function StudentLayout() {
  const { userData } = useAuth();
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);

  const menuSections = [
    {
      items: [
        { title: 'Özet', path: '', icon: LayoutDashboard },
      ]
    },
    {
      title: 'Akademik & Eğitim',
      items: [
        { title: 'Randevu Sistemi', path: 'randevular', icon: Calendar },
        { title: 'Koçluk Sayfası', path: 'kocluk', icon: GraduationCap },
        { title: 'Online Eğitimler', path: 'online-egitimler', icon: Monitor },
        { title: 'Etkinlikler', path: 'etkinlikler', icon: Trophy },
      ]
    },
    {
      title: 'Araçlar & Analiz',
      items: [
        { title: 'Denemeler', path: 'denemeler', icon: PenTool },
        { title: 'Yapay Zeka Asistan', path: 'ai-asistan', icon: Brain },
        { title: 'Kişilik Analizleri', path: 'analizler', icon: TrendingUp },
        { title: 'Masa Rezervasyonu', path: 'masa-rezervasyonu', icon: Monitor },
      ]
    },
    {
      title: 'Hesap & Finans',
      items: [
        { title: 'Mağaza & Sepet', path: 'magaza', icon: ShoppingBag },
        { title: 'Cüzdan & Ödüller', path: 'cuzdan', icon: Wallet },
        { title: 'Abonelikler', path: 'abonelik', icon: Star },
        { title: 'Profilim', path: 'profil', icon: User },
      ]
    }
  ];

  return (
    <div className="flex flex-1 mt-0 relative">
      {/* Sidebar Toggle Trigger (Visible when collapsed) */}
      <AnimatePresence>
        {isSidebarCollapsed && (
          <motion.button
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            onClick={() => setIsSidebarCollapsed(false)}
            className="fixed left-4 top-1/2 -translate-y-1/2 z-[60] w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center text-white shadow-lg shadow-blue-500/20 hover:scale-110 transition-transform hidden md:flex"
          >
            <PanelLeftOpen size={20} />
          </motion.button>
        )}
      </AnimatePresence>

      {/* Sidebar */}
      <aside className={`
        bg-slate-900/40 backdrop-blur-3xl border-r border-white/5 flex flex-col transition-all duration-300 relative
        ${isSidebarCollapsed ? 'w-0 opacity-0 pointer-events-none' : 'w-20 md:w-64 opacity-100'}
      `}>
        {/* Toggle Button Inside Sidebar */}
        {!isSidebarCollapsed && (
          <button 
            onClick={() => setIsSidebarCollapsed(true)}
            className="absolute -right-3 top-1/2 -translate-y-1/2 w-6 h-12 bg-slate-900 border border-white/5 rounded-full flex items-center justify-center text-slate-500 hover:text-white transition-colors hidden md:flex z-50"
          >
            <ChevronLeft size={14} />
          </button>
        )}

        <div className="p-6 hidden md:block">
          <p className="text-[10px] text-blue-400 font-bold uppercase tracking-widest mb-1">Hesap Türü</p>
          <p className="text-sm text-white font-bold flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-amber-500"></span>
            Öğrenci Hesabı
          </p>
        </div>

        {/* Search in Sidebar */}
        <div className="px-6 mb-4 hidden md:block">
          <div className="flex items-center gap-3 bg-white/5 border border-white/5 rounded-2xl px-4 py-3 group focus-within:border-blue-500/30 transition-all text-white">
             <Search size={16} className="text-slate-500 group-focus-within:text-blue-400 transition-colors" />
             <input 
               type="text" 
               placeholder="İçerik ara..." 
               className="bg-transparent border-none outline-none text-xs placeholder:text-slate-600 w-full font-bold" 
             />
          </div>
        </div>

        <nav className="flex-1 px-3 py-4 space-y-6">
          {menuSections.map((section, idx) => (
            <div key={idx} className="space-y-1">
              {section.title && (
                <p className="px-4 text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2 hidden md:block">
                  {section.title}
                </p>
              )}
              {section.items.map((item) => (
                <NavLink
                  key={item.title}
                  to={item.path}
                  end
                  className={({ isActive }) => `
                    flex items-center gap-3 px-4 py-2.5 rounded-xl transition-all duration-300 group
                    ${isActive 
                      ? 'bg-blue-600/10 text-blue-400 border border-blue-500/20' 
                      : 'text-slate-400 hover:text-white hover:bg-white/5'
                    }
                  `}
                >
                  <item.icon size={18} className="shrink-0" />
                  <span className="hidden md:block text-sm font-semibold tracking-wide">{item.title}</span>
                </NavLink>
              ))}
            </div>
          ))}
        </nav>

        <div className="p-6 mt-auto">
          <div className="bg-gradient-to-br from-blue-600/20 to-indigo-600/20 border border-blue-500/20 rounded-2xl p-4 hidden md:block">
            <p className="text-xs font-bold text-white mb-2">Desteğe mi ihtiyacın var?</p>
            <p className="text-[10px] text-slate-400 mb-3 leading-relaxed">Koçunla iletişime geçebilir veya destek ekibimize yazabilirsin.</p>
            <button className="w-full bg-blue-600 hover:bg-blue-500 text-white text-[10px] font-bold py-2 rounded-lg transition-all">
              Destek Al
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col bg-slate-950/20">
        <div className="flex-1 p-6 md:p-10 h-full flex flex-col">
          <div className="max-w-6xl mx-auto h-full flex flex-col flex-1 w-full">
            <Outlet />
          </div>
        </div>
      </main>
    </div>
  );
}
