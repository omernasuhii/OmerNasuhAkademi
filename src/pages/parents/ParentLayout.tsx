import React, { useState, useEffect } from 'react';
import { NavLink, Outlet, Link, useNavigate, useLocation } from 'react-router-dom';
import { doc, getDoc, collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { 
  LayoutDashboard, 
  User, 
  Settings, 
  LogOut,
  TrendingUp,
  CalendarDays,
  Wallet,
  MessageSquare,
  FileText,
  Users,
  Search,
  Target,
  BarChart2,
  Video,
  BookOpen,
  Calendar,
  HelpCircle,
  MonitorPlay,
  Bot,
  Brain,
  Star,
  ChevronDown,
  X,
  PanelLeftOpen
} from 'lucide-react';
import { useAuth } from '../../lib/AuthContext';
import { isSubscriptionActive } from '../../services/subscriptionService';
import { useStudent } from '../../lib/StudentContext';
import NotificationBell from '../../components/layout/NotificationBell';
import { motion, AnimatePresence } from 'motion/react';

export default function ParentLayout() {
  const { userData, logout } = useAuth();
  const { selectedStudent, setSelectedStudent } = useStudent();
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isMobileDrawerOpen, setIsMobileDrawerOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    setIsMobileDrawerOpen(false);
  }, [location.pathname]);

  const [parentStudents, setParentStudents] = useState<any[]>([]);
  const [activeStudentData, setActiveStudentData] = useState<any>(null);

  useEffect(() => {
    const fetchActiveStudentData = async () => {
      if (selectedStudent?.uid) {
        try {
          const studentDoc = await getDoc(doc(db, 'users', selectedStudent.uid));
          if (studentDoc.exists()) {
            setActiveStudentData(studentDoc.data());
          } else {
            setActiveStudentData(null);
          }
        } catch (error) {
          console.error("Error fetching active student data:", error);
        }
      } else {
        setActiveStudentData(null);
      }
    };
    fetchActiveStudentData();
  }, [selectedStudent?.uid]);

  useEffect(() => {
    const fetchStudents = async () => {
      if (userData?.role === 'admin') {
        try {
          const q = query(collection(db, 'users'), where('role', '==', 'student'));
          const snap = await getDocs(q);
          const list = snap.docs.map(doc => ({
            uid: doc.id,
            displayName: doc.data().displayName || `${doc.data().firstName} ${doc.data().lastName}`
          }));
          setParentStudents(list);
        } catch (error) {
          console.error("Error fetching students:", error);
        }
      } else {
        let list: any[] = [];
        if (userData?.students && Array.isArray(userData.students)) {
          list = userData.students.map((s: any) => ({
            uid: s.id,
            displayName: s.name,
          }));
        } else if (userData?.studentUid) {
          list = [{
            uid: userData.studentUid,
            displayName: userData.studentName || 'Öğrenci'
          }];
        }
        setParentStudents(list);
      }
    };

    fetchStudents();
  }, [userData]);

  useEffect(() => {
    if (parentStudents.length > 0) {
      if (!selectedStudent || !parentStudents.some(s => s.uid === selectedStudent.uid)) {
        setSelectedStudent(parentStudents[0]);
      }
    }
  }, [parentStudents, selectedStudent, setSelectedStudent]);

  const filteredStudents = parentStudents.filter(student => 
    student.displayName.toLowerCase().includes(searchTerm.toLowerCase())
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
            className="absolute top-full left-0 right-0 mt-2 w-full bg-[#0f172a] border border-white/10 rounded-2xl shadow-2xl z-20 overflow-hidden"
          >
            {parentStudents.length > 5 && (
              <div className="p-2 border-b border-white/10">
                <div className="relative">
                  <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="text"
                    placeholder="Öğrenci Ara..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full bg-slate-900 border border-white/10 rounded-xl py-2 pl-9 pr-3 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500/50"
                  />
                </div>
              </div>
            )}
            <div className="max-h-60 overflow-y-auto p-1">
              {filteredStudents.length > 0 ? (
                filteredStudents.map(student => (
                  <button
                    key={student.uid}
                    onClick={() => {
                      setSelectedStudent(student);
                      setSearchTerm('');
                      onClose();
                    }}
                    className={`w-full p-2.5 flex items-center gap-3 hover:bg-emerald-600/10 rounded-xl transition-all text-left ${selectedStudent?.uid === student.uid ? 'bg-emerald-600/20' : ''}`}
                  >
                    <div className="w-8 h-8 rounded-lg bg-slate-800 flex items-center justify-center text-[10px] text-slate-400 font-bold border border-white/5 shrink-0">
                      {student.displayName.charAt(0)}
                    </div>
                    <span className="text-xs font-bold text-slate-200 truncate">{student.displayName}</span>
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

  const menuSections = [
    {
      items: [
        { title: 'Genel Bakış', path: '', icon: LayoutDashboard },
      ]
    },
    {
      title: 'Akademik & Eğitim',
      items: [
        { title: 'Randevular', path: 'randevular', icon: Calendar },
        { title: 'Çalışma Programları', path: 'program', icon: CalendarDays },
        { title: 'Hedefler ve İlerleme', path: 'hedefler', icon: Target },
        { title: 'Akademik Takvim', path: 'akademik-takvim', icon: BookOpen },
      ]
    },
    {
      title: 'Gelişim & Analiz',
      items: [
        { title: 'Deneme Sonuçları', path: 'deneme-sonuclari', icon: BarChart2 },
        { title: 'Kişilik Analizi', path: 'kisilik-analizi', icon: Brain },
        { title: 'Veli Asistanı', path: 'asistan', icon: Bot },
        { title: 'Öğrenci Raporları', path: 'raporlar', icon: TrendingUp },
      ]
    },
    {
      title: 'Kurumsal & Finans',
      items: [
        { title: 'Abonelikler', path: 'abonelikler', icon: Star },
        { title: 'Cüzdan & Ödemeler', path: 'cuzdan', icon: Wallet },
        { title: 'Profil & Ayarlar', path: '/profil', icon: Settings },
      ]
    }
  ];

  const isValidStudentSelected = selectedStudent && parentStudents.some(s => s.uid === selectedStudent.uid);

  return (
    <div className="flex flex-1 h-full bg-slate-950 font-sans relative min-w-0 print:bg-white print:block print:h-auto">
      {/* Mobile Drawer Backdrop */}
      <AnimatePresence>
        {isMobileDrawerOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setIsMobileDrawerOpen(false)}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 lg:hidden print:hidden"
          />
        )}
      </AnimatePresence>

      {/* Sidebar */}
      <aside className={`
        fixed inset-y-0 left-0 z-50 w-72 bg-slate-900 border-r border-white/5 flex flex-col transition-all duration-300 print:hidden
        ${isMobileDrawerOpen ? 'translate-x-0' : '-translate-x-full'}
        lg:translate-x-0 lg:static lg:w-64
      `}>
        <div className="p-6 flex items-center justify-between border-b border-white/5 lg:border-none shrink-0">
          <Link to="/" className="flex items-center gap-3 group">
            <div className="bg-emerald-600 p-2 rounded-xl shadow-[0_0_15px_rgba(16,185,129,0.4)] group-hover:scale-110 transition-transform text-white">
              <Users size={20} />
            </div>
            <div>
              <h1 className="text-sm font-black text-white tracking-widest uppercase">Veli</h1>
              <p className="text-[10px] text-slate-500 font-bold uppercase">FocusON Portal</p>
            </div>
          </Link>
          <button 
            onClick={() => setIsMobileDrawerOpen(false)}
            className="p-2 text-slate-400 hover:text-white bg-white/5 rounded-xl lg:hidden"
          >
            <X size={16} />
          </button>
        </div>

        {/* Student Selector Section */}
        <div className="px-6 mb-4">
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
                  {isValidStudentSelected ? selectedStudent.displayName : 'Öğrenci Seçin'}
                </h3>
              </div>
              <ChevronDown size={16} className={`text-slate-500 transition-transform ${isDropdownOpen ? 'rotate-180' : ''}`} />
            </button>
            <StudentListDropdown isOpen={isDropdownOpen} onClose={() => setIsDropdownOpen(false)} />
          </div>
        </div>

        <nav className="flex-1 px-4 py-6 space-y-6 overflow-y-auto custom-scrollbar">
          {menuSections.map((section, idx) => (
            <div key={idx} className="space-y-1">
              {section.title && (
                <p className="px-4 text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2">
                  {section.title}
                </p>
              )}
              {section.items.map((item) => {
                const isAlwaysOpen = ['abonelikler', 'cuzdan', '/profil', 'sepet'].includes(item.path);
                const hasCoach = !!(activeStudentData?.coachId || activeStudentData?.assignedCoachId);
                const hasActiveSub = isSubscriptionActive(activeStudentData);
                
                let isDisabled = false;
                if (!hasCoach) {
                  isDisabled = item.path !== '';
                } else if (!hasActiveSub) {
                  isDisabled = !isAlwaysOpen;
                } else {
                  const plan = activeStudentData?.subscriptionPlan || '';
                  const isBronze = plan.includes('Bronz');
                  const isSilver = plan.includes('Gümüş');
                  
                  if (item.path === 'kisilik-analizi' && isBronze) {
                    isDisabled = true;
                  } else if (item.path === 'asistan' && (isBronze || isSilver)) {
                    isDisabled = true;
                  }
                }

                return (
                <NavLink
                  key={item.path}
                  to={isDisabled ? '#' : item.path}
                  end
                  onClick={(e) => {
                    if (isDisabled) e.preventDefault();
                  }}
                  className={({ isActive }) => `
                    flex items-center gap-3 px-4 py-2.5 rounded-xl transition-all duration-300 group
                    ${isActive && !isDisabled
                       ? 'bg-emerald-600/10 text-emerald-500 border border-emerald-600/20' 
                       : 'text-slate-400 hover:text-white hover:bg-white/5'
                    }
                    ${isDisabled ? 'opacity-50 cursor-not-allowed' : ''}
                  `}
                >
                  <item.icon size={18} className="shrink-0" />
                  <span className="text-sm font-bold tracking-wide flex-1">{item.title}</span>
                  {isDisabled && (
                    <div className="shrink-0">
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-slate-500">
                        <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
                        <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
                      </svg>
                    </div>
                  )}
                </NavLink>
              )})}
            </div>
          ))}
        </nav>

        <div className="p-6 mt-auto border-t border-white/5 shrink-0">
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
      <main className="flex-1 flex flex-col min-w-0 print:block print:w-full print:p-0 print:m-0">
        {/* Mobile Sub-Header */}
        <div className="flex lg:hidden items-center gap-3 p-4 bg-slate-900/40 backdrop-blur-xl border-b border-white/10 sticky top-[72px] z-20 shrink-0 print:hidden">
          <button
            onClick={() => setIsMobileDrawerOpen(true)}
            className="p-2 bg-emerald-600/10 border border-emerald-500/20 rounded-xl text-emerald-500"
          >
            <PanelLeftOpen size={18} />
          </button>
          <div>
            <p className="text-[9px] text-emerald-500 font-bold uppercase tracking-widest leading-none mb-1">Veli Paneli</p>
            <h2 className="text-xs font-bold text-white leading-none">
              {menuSections.flatMap(s => s.items).find(item => {
                const currentPath = location.pathname.replace('/panel/veli', '').replace(/^\//, '');
                return item.path === currentPath;
              })?.title || 'Genel Bakış'}
            </h2>
          </div>
        </div>

        <div className="flex-1 px-4 md:px-10 pb-4 md:pb-10 pt-2 md:pt-4 print:p-0 print:m-0 print:w-full">
          {!isValidStudentSelected ? (
            <div className="h-full flex flex-col items-center justify-center text-center max-w-lg mx-auto mt-20">
              <div className="w-20 h-20 bg-emerald-500/10 rounded-3xl flex items-center justify-center text-emerald-500 mb-6 border border-emerald-500/20">
                <Users size={40} />
              </div>
              <h2 className="text-2xl font-bold text-white mb-2">Bir Öğrenci Seçin</h2>
              <p className="text-slate-500">
                Öğrenci detaylarını görebilmek için lütfen soldaki menüden bir öğrenci seçin.
              </p>
            </div>
          ) : (
            <div className="w-full max-w-full mx-auto">
              {(() => {
                const currentPath = location.pathname.replace('/panel/veli', '').replace(/^\//, '');
                const isAlwaysOpen = ['abonelikler', 'cuzdan', 'profil', '/profil', 'sepet'].includes(currentPath);
                const hasCoach = !!(activeStudentData?.coachId || activeStudentData?.assignedCoachId);
                const hasActiveSub = isSubscriptionActive(activeStudentData);
                
                let isAllowed = false;
                let restrictionMessage = '';
                if (!hasCoach) {
                  isAllowed = currentPath === '';
                  restrictionMessage = 'Öğrencinizin sistemin tüm özelliklerini kullanabilmesi için bir eğitim koçu tarafından hesabının aktifleştirilmesi gerekmektedir.';
                } else if (!hasActiveSub) {
                  isAllowed = isAlwaysOpen;
                  restrictionMessage = 'Sistemin bu bölümüne erişebilmek için öğrencinizin aktif bir abonelik paketinin bulunması gerekmektedir.';
                } else {
                  const plan = activeStudentData?.subscriptionPlan || '';
                  const isBronze = plan.includes('Bronz');
                  const isSilver = plan.includes('Gümüş');
                  
                  if (currentPath === 'kisilik-analizi' && isBronze) {
                    isAllowed = false;
                    restrictionMessage = 'Kişilik Analizi raporlarına erişmek için lütfen öğrencinizin abonelik paketini Gümüş veya Altın pakete yükseltin.';
                  } else if (currentPath === 'asistan' && (isBronze || isSilver)) {
                    isAllowed = false;
                    restrictionMessage = 'Yapay Zeka destekli Veli Asistanı özelliğine erişmek için lütfen öğrencinizin abonelik paketini Altın pakete yükseltin.';
                  } else {
                    isAllowed = true;
                  }
                }

                if (!isAllowed) {
                  return (
                    <div className="h-full flex flex-col items-center justify-center text-center max-w-md mx-auto mt-20">
                      <div className="w-24 h-24 bg-slate-900 border border-white/10 rounded-3xl flex items-center justify-center mb-6 shadow-2xl">
                        <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-slate-500">
                          <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
                          <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
                        </svg>
                      </div>
                      <h2 className="text-2xl font-bold text-white mb-3 tracking-tight">Erişim Kısıtlaması</h2>
                      <p className="text-slate-400 mb-8 leading-relaxed text-sm">
                        {restrictionMessage}
                      </p>
                      {hasCoach && (
                        <Link
                          to="/panel/veli/abonelikler"
                          className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-3 px-8 rounded-xl transition-all shadow-lg shadow-emerald-500/20"
                        >
                          Paketleri İncele
                        </Link>
                      )}
                    </div>
                  );
                }

                if (!hasCoach && currentPath === '') {
                  return (
                    <div className="h-full flex flex-col items-center justify-center text-center max-w-md mx-auto mt-20">
                      <div className="w-24 h-24 bg-slate-900 border border-emerald-500/20 rounded-3xl flex items-center justify-center mb-6 shadow-2xl shadow-emerald-500/10">
                        <Calendar size={40} className="text-emerald-500" />
                      </div>
                      <h2 className="text-2xl font-bold text-white mb-3 tracking-tight">Koç Ataması Bekleniyor</h2>
                      <p className="text-slate-400 mb-8 leading-relaxed text-sm">
                        Öğrencinizin hesabı başarıyla oluşturuldu. Sistemi kullanmaya başlamak için kurum veya bir eğitim koçu tarafından hesabının onaylanması ve atama yapılması beklenmektedir.
                      </p>
                    </div>
                  );
                }

                return <Outlet />;
              })()}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
