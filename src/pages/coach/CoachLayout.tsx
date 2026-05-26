import React, { useState, useEffect } from 'react';
import { NavLink, Outlet, Link, useNavigate } from 'react-router-dom';
import { 
  Users, 
  LayoutDashboard, 
  Calendar, 
  BarChart3, 
  Search,
  ChevronDown,
  LogOut,
  Sparkles,
  ClipboardCheck,
  BrainCircuit,
  Target,
  FileEdit,
  ChevronLeft,
  ChevronRight,
  PanelLeftClose,
  PanelLeftOpen,
  Wallet
} from 'lucide-react';
import { useAuth } from '../../lib/AuthContext';
import { useStudent } from '../../lib/StudentContext';
import { appointmentService } from '../../services/appointmentService';
import { motion, AnimatePresence } from 'motion/react';

interface Student {
  uid: string;
  displayName: string;
  firstName?: string;
  lastName?: string;
  email?: string;
  photoURL?: string;
}

export default function CoachLayout() {
  const { user, userData, logout } = useAuth();
  const { selectedStudent, setSelectedStudent } = useStudent();
  const [students, setStudents] = useState<Student[]>([]);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isHeaderDropdownOpen, setIsHeaderDropdownOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    if (user && userData) {
      const fetchPromise = userData.role === 'admin' 
        ? appointmentService.getAllStudents()
        : appointmentService.getCoachStudents(user.uid);

      fetchPromise.then(data => {
        const formatted = data.map(s => ({
          ...s,
          displayName: s.displayName || (s.firstName && s.lastName ? `${s.firstName} ${s.lastName}` : s.email?.split('@')[0] || 'İsimsiz Öğrenci')
        }));
        setStudents(formatted);
      });
    }
  }, [user, userData]);

  const filteredStudents = students.filter(s => 
    s.displayName.toLowerCase().includes(searchTerm.toLowerCase()) || 
    s.email?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const StudentListDropdown = ({ isOpen, onClose }: { isOpen: boolean, onClose: () => void }) => (
    <AnimatePresence>
      {isOpen && (
        <>
          <div className="fixed inset-0 z-10" onClick={onClose} />
          <motion.div 
            initial={{ opacity: 0, y: 10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.95 }}
            className="absolute top-full right-0 mt-2 w-64 bg-[#0f172a] border border-white/10 rounded-2xl shadow-2xl z-20 overflow-hidden"
          >
            <div className="p-3 border-b border-white/5">
              <div className="relative">
                <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
                <input 
                  type="text" 
                  placeholder="Öğrenci ara..."
                  className="w-full bg-white/5 rounded-xl py-2 pl-9 pr-3 text-xs text-white placeholder:text-slate-600 outline-none focus:bg-white/10 transition-all font-bold"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  autoFocus
                />
              </div>
            </div>
            <div className="max-h-60 overflow-y-auto">
              {filteredStudents.length > 0 ? (
                filteredStudents.map(student => (
                  <button
                    key={student.uid}
                    onClick={() => {
                      setSelectedStudent(student);
                      onClose();
                    }}
                    className={`w-full p-3 flex items-center gap-3 hover:bg-emerald-600/10 transition-all text-left ${selectedStudent?.uid === student.uid ? 'bg-emerald-600/20' : ''}`}
                  >
                    <div className="w-8 h-8 rounded-lg bg-slate-800 flex items-center justify-center text-[10px] text-slate-400 font-bold border border-white/5">
                      {student.displayName.charAt(0)}
                    </div>
                    <span className="text-xs font-bold text-slate-200">{student.displayName}</span>
                  </button>
                ))
              ) : (
                <div className="p-4 text-center text-[10px] text-slate-500 italic">Öğrenci bulunamadı.</div>
              )}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );

  const studentMenuItems = [
    { title: 'Genel Özet', path: '', icon: LayoutDashboard },
    { title: 'Kitap Takibi', path: 'veri-girisi', icon: FileEdit },
    { title: 'Randevular', path: 'randevular', icon: Calendar },
    { title: 'Haftalık Program', path: 'program', icon: Sparkles },
    { title: 'Sınav Sonuçları', path: 'sonuclar', icon: ClipboardCheck },
    { title: 'Sınav Analizleri', path: 'analizler', icon: BarChart3 },
    { title: 'Derin Analiz', path: 'derin-analiz', icon: Search },
    { title: 'Öğrenci Profili', path: 'profil', icon: BrainCircuit },
    { title: 'Hedefler & Takip', path: 'hedefler', icon: Target },
    { title: 'Ön Ödemeli Cüzdan', path: 'cuzdan', icon: Wallet },
  ];

  return (
    <div className="flex flex-1 min-h-screen bg-[#070b14] relative">
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
      <aside className={`print:hidden
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

        {/* Back to Dashboard Link */}
        <div className="pt-6 px-8 flex">
          <Link 
            to="/panel/koc"
            className="flex items-center gap-2 text-[10px] font-black text-slate-500 hover:text-white uppercase tracking-widest transition-colors group"
          >
            <ChevronDown size={12} className="rotate-90 group-hover:-translate-x-1 transition-transform" /> Kişisel Panele Dön
          </Link>
        </div>

        {/* Logo Section */}
        <div className="p-8 shrink-0">
          <Link to="/" className="flex items-center gap-3 group">
            <div className="bg-emerald-600 p-2 rounded-xl shadow-[0_0_15px_rgba(16,185,129,0.3)] group-hover:scale-105 transition-all">
              <Users size={20} className="text-white" />
            </div>
            <h1 className="text-lg font-black text-white tracking-widest uppercase truncate">Koç Paneli</h1>
          </Link>
        </div>

        {/* Search in Sidebar */}
        <div className="px-6 mb-4">
          <div className="flex items-center gap-3 bg-white/5 border border-white/5 rounded-2xl px-4 py-3 group focus-within:border-emerald-500/30 transition-all">
             <Search size={16} className="text-slate-500 group-focus-within:text-emerald-400 transition-colors" />
             <input 
               type="text" 
               placeholder="Öğrenci ara..." 
               className="bg-transparent border-none outline-none text-xs text-white placeholder:text-slate-600 w-full font-bold" 
               value={searchTerm}
               onChange={(e) => setSearchTerm(e.target.value)}
             />
          </div>
        </div>

        {/* Student Selector Section */}
        <div className="px-6 mb-8">
          <div className="relative">
            <button 
              onClick={() => setIsDropdownOpen(!isDropdownOpen)}
              className="w-full bg-white/5 border border-white/10 rounded-2xl p-4 flex items-center gap-3 hover:bg-white/10 transition-all text-left group"
            >
              <div className="w-10 h-10 rounded-xl bg-slate-800 flex items-center justify-center text-slate-400 font-bold shrink-0 overflow-hidden border border-white/5">
                {selectedStudent?.photoURL ? (
                  <img src={selectedStudent.photoURL} alt="" className="w-full h-full object-cover" />
                ) : (
                  <span>{selectedStudent?.displayName?.charAt(0) || '?'}</span>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-[10px] text-slate-500 font-black uppercase tracking-widest mb-0.5">Aktif Öğrenci</p>
                <h3 className="text-sm font-bold text-white truncate">
                  {selectedStudent?.displayName || 'Öğrenci Seçin'}
                </h3>
              </div>
              <ChevronDown size={16} className={`text-slate-500 transition-transform ${isDropdownOpen ? 'rotate-180' : ''}`} />
            </button>

            <StudentListDropdown isOpen={isDropdownOpen} onClose={() => setIsDropdownOpen(false)} />
          </div>
        </div>

        {/* Navigation Menu */}
        <nav className="flex-1 px-4 space-y-8 overflow-y-auto custom-scrollbar pb-10">
          <div>
            <p className="px-4 text-[10px] font-black uppercase tracking-[0.2em] text-slate-600 mb-2">Öğrenci Yönetimi</p>
            <div className="space-y-1">
              {studentMenuItems.map((item) => (
                <NavLink
                  key={item.path}
                  to={item.path}
                  end
                  className={({ isActive }) => `
                    flex items-center gap-3 px-4 py-3.5 rounded-2xl transition-all group
                    ${isActive 
                      ? 'bg-emerald-600/10 text-emerald-400 border border-emerald-600/20' 
                      : 'text-slate-500 hover:text-slate-200 hover:bg-white/5'
                    }
                  `}
                >
                  <item.icon size={18} className="shrink-0" />
                  <span className="text-sm font-bold tracking-tight">{item.title}</span>
                </NavLink>
              ))}
            </div>
          </div>
        </nav>

        {/* User Section at bottom of Sidebar (Optionally move student list here too if needed) */}
        <div className="p-6 shrink-0 border-t border-white/5">
          <button 
            onClick={() => logout()}
            className="w-full flex items-center justify-center gap-3 text-slate-500 hover:text-red-500 hover:bg-red-500/10 py-3 rounded-xl transition-all text-xs font-black uppercase tracking-widest"
          >
            <LogOut size={16} /> Güvenli Çıkış
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col min-w-0">
        {/* Route Content */}
        <div className="flex-1 p-8">
          {!selectedStudent && !window.location.pathname.includes('/musaitlik') ? (
            <div className="h-full flex flex-col items-center justify-center text-center max-w-lg mx-auto">
              <div className="w-20 h-20 bg-emerald-500/10 rounded-3xl flex items-center justify-center text-emerald-500 mb-6 border border-emerald-500/20">
                <Users size={40} />
              </div>
              <h2 className="text-2xl font-bold text-white mb-2">Bir Öğrenci Seçin</h2>
              <p className="text-slate-500">
                Öğrenci bazlı özellikleri kullanabilmek için lütfen soldaki panelden takip etmek istediğiniz öğrenciyi seçin.
              </p>
            </div>
          ) : (
            <Outlet />
          )}
        </div>
      </main>
    </div>
  );
}
