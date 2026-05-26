import React, { useState } from 'react';
import { NavLink, Outlet, Link, useNavigate } from 'react-router-dom';
import { 
  LayoutDashboard, 
  Users, 
  Calendar, 
  Clock, 
  UserCircle, 
  BarChart3, 
  LogOut, 
  Search,
  ChevronLeft,
  PanelLeftOpen,
  Wallet,
  Bot
} from 'lucide-react';
import { useAuth } from '../../lib/AuthContext';
import { motion, AnimatePresence } from 'motion/react';

export default function PersonalCoachLayout() {
  const { userData, logout } = useAuth();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const navigate = useNavigate();

  const menuItems = [
    { title: 'Genel Özet', path: '/panel/koc', icon: LayoutDashboard, end: true },
    { title: 'Öğrencilerim', path: '/panel/koc/ogrenciler', icon: Users },
    { title: 'ON Asistan', path: '/panel/koc/asistan', icon: Bot },
    { title: 'Randevular', path: '/panel/koc/randevular', icon: Calendar },
    { title: 'Müsaitlik Ayarları', path: '/panel/koc/musaitlik', icon: Clock },
    { title: 'Genel Değerlendirme', path: '/panel/koc/degerlendirme', icon: BarChart3 },
    { title: 'Profil Ayarları', path: '/panel/koc/profil', icon: UserCircle },
    { title: 'Cüzdan ve Kazanç', path: '/panel/koc/cuzdan', icon: Wallet },
  ];

  return (
    <div className="flex min-h-screen bg-[#070b14] relative overflow-x-hidden">
      {/* Mesh Gradients */}
      <div className="fixed top-0 right-0 w-[500px] h-[500px] bg-emerald-500/5 blur-[120px] rounded-full pointer-events-none" />
      <div className="fixed bottom-0 left-0 w-[500px] h-[500px] bg-blue-500/5 blur-[120px] rounded-full pointer-events-none" />

      {/* Sidebar Toggle Trigger (Visible when collapsed) */}
      <AnimatePresence>
        {isSidebarCollapsed && (
          <motion.button
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            onClick={() => setIsSidebarCollapsed(false)}
            className="fixed left-4 top-1/2 -translate-y-1/2 z-[60] w-10 h-10 bg-emerald-600 rounded-xl flex items-center justify-center text-white shadow-lg shadow-emerald-500/20 hover:scale-110 transition-transform hidden lg:flex"
          >
            <PanelLeftOpen size={20} />
          </motion.button>
        )}
      </AnimatePresence>

      {/* Sidebar */}
      <aside className={`
        fixed inset-y-0 left-0 z-50 w-72 bg-[#070b14] border-r border-white/5 flex flex-col transition-all duration-300 lg:static 
        ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
        ${isSidebarCollapsed ? 'lg:w-0 lg:opacity-0 lg:pointer-events-none' : 'lg:w-72 lg:opacity-100'}
      `}>
        {/* Toggle Button Inside Sidebar */}
        <button 
          onClick={() => setIsSidebarCollapsed(true)}
          className="absolute -right-3 top-1/2 -translate-y-1/2 w-6 h-12 bg-[#070b14] border border-white/5 rounded-full flex items-center justify-center text-slate-500 hover:text-white transition-colors hidden lg:flex z-10"
        >
          <ChevronLeft size={14} />
        </button>

        {/* Logo Section */}
        <div className="p-8 shrink-0">
          <Link to="/" className="flex items-center gap-3 group">
            <div className="w-10 h-10 bg-emerald-600 rounded-xl flex items-center justify-center shadow-lg shadow-emerald-900/20 group-hover:scale-110 transition-transform">
              <span className="text-white font-black text-xl italic leading-none">N</span>
            </div>
            <div>
              <span className="text-white font-black text-lg tracking-tighter italic leading-none block">ÖMER NASUH</span>
              <span className="text-emerald-500 font-bold text-[10px] tracking-[0.3em] uppercase leading-none block mt-1">Akademi</span>
            </div>
          </Link>
        </div>

        {/* Search in Sidebar */}
        <div className="px-6 mb-6">
          <div className="flex items-center gap-3 bg-white/5 border border-white/5 rounded-2xl px-4 py-3 group focus-within:border-emerald-500/30 transition-all">
             <Search size={16} className="text-slate-500 group-focus-within:text-emerald-400 transition-colors" />
             <input 
               type="text" 
               placeholder="Öğrenci veya ders ara..." 
               className="bg-transparent border-none outline-none text-xs text-white placeholder:text-slate-600 w-full font-bold" 
             />
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-4 space-y-1 overflow-y-auto custom-scrollbar pb-10">
          <p className="px-4 text-[10px] font-black uppercase tracking-[0.2em] text-slate-600 mb-4">Ana Menü</p>
          {menuItems.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              end={item.end}
              className={({ isActive }) => `
                flex items-center gap-3 px-4 py-3.5 rounded-2xl transition-all group
                ${isActive 
                  ? 'bg-emerald-600/10 text-emerald-400 border border-emerald-600/20' 
                  : 'text-slate-500 hover:text-slate-200 hover:bg-white/5 border border-transparent'
                }
              `}
            >
              <item.icon size={18} className="shrink-0" />
              <span className="text-sm font-bold tracking-tight">{item.title}</span>
            </NavLink>
          ))}
        </nav>

        {/* Sidebar Footer */}
        <div className="p-4 border-t border-white/5 space-y-2">
           <button 
             onClick={logout}
             className="w-full flex items-center gap-3 px-4 py-3.5 rounded-2xl text-red-500 hover:bg-red-500/10 transition-all font-bold text-sm"
           >
             <LogOut size={18} />
             Çıkış Yap
           </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Content View */}
        <main className="flex-1 p-8">
          <div className="max-w-7xl mx-auto">
            <Outlet />
          </div>
        </main>
      </div>

      {/* Mobile Sidebar Overlay */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[45] lg:hidden"
            onClick={() => setIsMobileMenuOpen(false)}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
