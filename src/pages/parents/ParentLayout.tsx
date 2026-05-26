import React from 'react';
import { NavLink, Outlet, Link } from 'react-router-dom';
import { 
  LayoutDashboard, 
  User, 
  Settings, 
  LogOut,
  ChevronRight,
  TrendingUp,
  Clock,
  Calendar,
  Wallet,
  CreditCard,
  Star,
  MessageSquare,
  Video,
  FileText,
  Users,
  Search
} from 'lucide-react';
import { useAuth } from '../../lib/AuthContext';
import NotificationBell from '../../components/layout/NotificationBell';

export default function ParentLayout() {
  const { userData, logout } = useAuth();

  const menuSections = [
    {
      items: [
        { title: 'Özet', path: '', icon: LayoutDashboard },
      ]
    },
    {
      title: 'Öğrenci Takibi',
      items: [
        { title: 'Ders Takvimi', path: 'takvim', icon: Calendar },
        { title: 'Devamsızlık', path: 'devamsizlik', icon: Clock },
        { title: 'Akademik Gelişim', path: 'gelisim', icon: TrendingUp },
      ]
    },
    {
      title: 'Finansal İşlemler',
      items: [
        { title: 'Ödemeler & Faturalar', path: 'odemeler', icon: CreditCard },
        { title: 'Abonelik Detayları', path: 'abonelik', icon: Star },
      ]
    },
    {
      title: 'İletişim & Raporlar',
      items: [
        { title: 'Eğitmen Görüşmeleri', path: 'gorusmeler', icon: Video },
        { title: 'Karneler & Raporlar', path: 'raporlar', icon: FileText },
        { title: 'Destek Talebi', path: 'destek', icon: MessageSquare },
      ]
    },
    {
      title: 'Hesap Ayarları',
      items: [
        { title: 'Profilim', path: 'profil', icon: User },
        { title: 'Şifre İşlemleri', path: 'sifre', icon: Settings },
      ]
    }
  ];

  return (
    <div className="flex flex-1 min-h-screen bg-slate-950 font-sans">
      {/* Sidebar */}
      <aside className="w-64 bg-slate-900 border-r border-white/5 flex flex-col sticky top-0 h-screen z-40 overflow-y-auto custom-scrollbar">
        <div className="p-6">
          <Link to="/" className="flex items-center gap-3 group">
            <div className="bg-emerald-600 p-2 rounded-xl shadow-[0_0_15px_rgba(16,185,129,0.4)] group-hover:scale-110 transition-transform text-white">
              <Users size={20} />
            </div>
            <div>
              <h1 className="text-sm font-black text-white tracking-widest uppercase">Veli</h1>
              <p className="text-[10px] text-slate-500 font-bold uppercase">FocusON Portal</p>
            </div>
          </Link>
        </div>

        <div className="px-6 mb-4">
          <div className="flex items-center gap-3 bg-white/5 border border-white/5 rounded-2xl px-4 py-3 group focus-within:border-emerald-500/30 transition-all text-white">
             <Search size={16} className="text-slate-500 group-focus-within:text-emerald-400 transition-colors" />
             <input 
               type="text" 
               placeholder="Öğrenci veya ders ara..." 
               className="bg-transparent border-none outline-none text-xs placeholder:text-slate-600 w-full font-bold" 
             />
          </div>
        </div>

        <nav className="flex-1 px-4 py-6 space-y-6">
          {menuSections.map((section, idx) => (
            <div key={idx} className="space-y-1">
              {section.title && (
                <p className="px-4 text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2">
                  {section.title}
                </p>
              )}
              {section.items.map((item) => (
                <NavLink
                  key={item.path}
                  to={item.path}
                  end
                  className={({ isActive }) => `
                    flex items-center gap-3 px-4 py-2.5 rounded-xl transition-all duration-300 group
                    ${isActive 
                      ? 'bg-emerald-600/10 text-emerald-500 border border-emerald-600/20' 
                      : 'text-slate-400 hover:text-white hover:bg-white/5'
                    }
                  `}
                >
                  <item.icon size={18} className="shrink-0" />
                  <span className="text-sm font-bold tracking-wide">{item.title}</span>
                </NavLink>
              ))}
            </div>
          ))}
        </nav>

        <div className="p-6 mt-auto border-t border-white/5">
          <div className="flex items-center gap-3 mb-6 px-2">
            <div className="w-10 h-10 rounded-full bg-slate-800 border border-white/10 overflow-hidden shrink-0 flex items-center justify-center">
               {userData?.photoURL ? (
                  <img src={userData.photoURL} alt="Admin" className="w-full h-full object-cover" />
               ) : (
                  <div className="text-slate-400 font-bold uppercase">{userData?.firstName?.[0]}</div>
               )}
            </div>
            <div className="overflow-hidden">
              <p className="text-xs font-bold text-white truncate">{userData?.firstName} {userData?.lastName}</p>
              <p className="text-[10px] text-emerald-500 font-black uppercase tracking-tighter">Veli / İzleyici</p>
            </div>
          </div>
          <button 
            onClick={() => logout()}
            className="w-full flex items-center justify-center gap-2 bg-slate-800 hover:bg-red-900/40 text-slate-400 hover:text-red-400 text-xs font-bold py-3 rounded-xl transition-all border border-white/5"
          >
            <LogOut size={14} /> Oturumu Kapat
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1">
        <div className="p-10">
          <div className="max-w-7xl mx-auto">
            <Outlet />
          </div>
        </div>
      </main>
    </div>
  );
}
