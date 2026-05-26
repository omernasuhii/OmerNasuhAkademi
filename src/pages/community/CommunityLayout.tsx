import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Link, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '../../lib/AuthContext';
import { Globe, FileText, Users, MessageSquare, Share2, Search, User, Trophy, Target, Info } from 'lucide-react';
import CommunityRulesModal from './CommunityRulesModal';

export default function CommunityLayout() {
  const { user, userData } = useAuth();
  const location = useLocation();
  const [isRulesModalOpen, setIsRulesModalOpen] = useState(false);

  const navigation = [
    { title: 'Akış (Ana Sayfa)', path: '/topluluk', icon: Globe },
    { title: 'Blog', path: '/topluluk/blog', icon: FileText },
    { title: 'Gruplar', path: '/topluluk/gruplar', icon: Users },
    { title: 'Forum', path: '/topluluk/forum', icon: MessageSquare },
    { title: 'Dosya Paylaşımı', path: '/topluluk/dosyalar', icon: Share2 },
    { title: 'Şampiyonlar Listesi', path: '/topluluk/sampiyonlar', icon: Trophy },
    { title: 'Deneme Listesi', path: '/topluluk/denemeler', icon: Target },
    { title: 'Profilim', path: '/topluluk/profil', icon: User },
  ];

  return (
    <div className="flex flex-1 mt-0 bg-[#070b14] min-h-screen">
      {/* Sidebar */}
      <aside className="hidden lg:flex w-72 flex-col bg-slate-900/40 backdrop-blur-3xl border-r border-white/5 sticky top-20 h-[calc(100vh-5rem)]">
        <div className="p-6 flex items-center justify-between">
           <h2 className="text-xl font-black text-white uppercase tracking-widest flex items-center gap-2">
             <Globe className="text-indigo-400" />
             Topluluk
           </h2>
           <button 
             onClick={() => setIsRulesModalOpen(true)}
             className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center border border-white/10 hover:bg-white/10 transition-colors text-slate-400 hover:text-white"
             title="Topluluk Kuralları"
           >
             <Info size={16} />
           </button>
        </div>
        
        <nav className="flex-1 px-4 space-y-2 overflow-y-auto custom-scrollbar">
          {navigation.map((item) => {
            const isActive = location.pathname === item.path || 
                             (item.path !== '/topluluk' && location.pathname.startsWith(item.path));
                             
            return (
              <Link 
                key={item.title}
                to={item.path}
                className={`flex items-center gap-3 px-4 py-3 rounded-2xl transition-all duration-300 font-bold text-sm
                  ${isActive ? 'bg-indigo-600/10 text-indigo-400 shadow-[inset_0_0_20px_rgba(79,70,229,0.1)] border border-indigo-500/20' 
                             : 'text-slate-400 hover:text-white hover:bg-white/5 border border-transparent'}
                `}
              >
                <item.icon size={18} />
                {item.title}
              </Link>
            )
          })}
        </nav>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Mobile Header (Visible only on smaller screens) */}
        <div className="lg:hidden flex items-center justify-between p-4 bg-slate-900/40 backdrop-blur-md border-b border-white/5 sticky top-16 z-20">
          <h2 className="text-lg font-black text-white uppercase tracking-widest flex items-center gap-2">
            <Globe className="text-indigo-400" />
            Topluluk
          </h2>
          <button 
             onClick={() => setIsRulesModalOpen(true)}
             className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center border border-white/10 hover:bg-white/10 transition-colors text-slate-400 hover:text-white"
             title="Topluluk Kuralları"
           >
             <Info size={16} />
           </button>
        </div>

        <Outlet />
      </div>

      <CommunityRulesModal 
        isOpen={isRulesModalOpen} 
        onClose={() => setIsRulesModalOpen(false)} 
      />
    </div>
  );
}
