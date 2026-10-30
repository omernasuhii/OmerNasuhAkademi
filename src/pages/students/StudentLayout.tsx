import { NavLink, Outlet, useLocation, Link } from 'react-router-dom';
import { safeStorage } from '../../lib/localStorage';
import { isSubscriptionActive } from '../../services/subscriptionService';
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
  PanelLeftOpen,
  Clock,
  Lock,
  X,
  Shield
} from 'lucide-react';
import { useAuth } from '../../lib/AuthContext';
import NotificationBell from '../../components/layout/NotificationBell';
import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { appointmentService } from '../../services/appointmentService';
import { notificationService } from '../../services/notificationService';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import AdminStudentBar from '../../components/admin/AdminStudentBar';
import AdminStudentSelectorEmptyState from '../../components/admin/AdminStudentSelectorEmptyState';

export default function StudentLayout() {
  const { userData, realUserData, isAdmin, impersonatedStudent } = useAuth();
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [isMobileDrawerOpen, setIsMobileDrawerOpen] = useState(false);
  const [isCabaCompleted, setIsCabaCompleted] = useState<boolean>(false);
  
  useEffect(() => {
    if (userData?.uid) {
      const checkCaba = async () => {
        try {
          const docRef = doc(db, 'caba_tests', userData.uid);
          const docSnap = await getDoc(docRef);
          setIsCabaCompleted(docSnap.exists());
        } catch (e) {
          console.error(e);
        }
      };
      checkCaba();

      const handleCompleted = () => setIsCabaCompleted(true);
      window.addEventListener('caba_test_completed', handleCompleted);
      return () => {
        window.removeEventListener('caba_test_completed', handleCompleted);
      };
    }
  }, [userData]);
  const location = useLocation();const isSummaryPage = location.pathname === '/panel/ogrenci' || location.pathname === '/panel/ogrenci/';

  useEffect(() => {
    setIsMobileDrawerOpen(false);
  }, [location.pathname]);

  useEffect(() => {
     if (userData?.uid && userData.role === 'student') {
        async function checkUpcomingAppointments() {
          try {
              const appointments = await appointmentService.getAppointments(userData.uid, 'student');
              const studentAppointments = appointments.filter(app => app.requesterRole !== 'parent');
              const now = new Date();
              
              for (const app of studentAppointments) {
                  if (app.status === 'confirmed') {
                      const [year, month, day] = app.date.split('-');
                      const [hours, minutes] = app.startTime.split(':');
                      const appDateTime = new Date(parseInt(year), parseInt(month) - 1, parseInt(day), parseInt(hours), parseInt(minutes));
                      
                      const diffMs = appDateTime.getTime() - now.getTime();
                      if (diffMs > 0) {
                          const diffHours = diffMs / (1000 * 60 * 60);
                          
                          // 24 Hour reminder
                          if (diffHours <= 24 && diffHours > 23) {
                              const key = `student_app_24h_${app.id}`;
                              if (!safeStorage.getItem(key)) {
                                  safeStorage.setItem(key, 'true');
                                  await notificationService.addNotification(userData.uid, {
                                      title: 'Yaklaşan Randevu',
                                      message: `Hatırlatma: Yarın saat ${app.startTime}'da '${app.coachName}' ile görüşmeniz var.`,
                                      type: 'appointment',
                                      link: '/panel/ogrenci/randevular'
                                  });
                              }
                          }
                          
                          // 1 Hour reminder
                          if (diffHours <= 1 && diffHours > 0) {
                              const key = `student_app_1h_${app.id}`;
                              if (!safeStorage.getItem(key)) {
                                  safeStorage.setItem(key, 'true');
                                  await notificationService.addNotification(userData.uid, {
                                      title: 'Randevuya Son 1 Saat',
                                      message: `Hatırlatma: '${app.coachName}' ile olan randevunuzun başlamasına sadece 1 saat kaldı.`,
                                      type: 'appointment',
                                      link: '/panel/ogrenci/randevular'
                                  });
                              }
                          }
                      }
                  }
              }
          } catch (e) {}
        }
        
        checkUpcomingAppointments();
     }
  }, [userData]);

  const menuSections = [
    {
      items: [
        { title: 'Özet', path: '', icon: LayoutDashboard },
        ...(!isCabaCompleted ? [{ title: 'ÇABA Testi', path: 'caba-testi', icon: Brain }] : [])
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
        { title: 'Zaman Yönetimi', path: 'zaman-yonetimi', icon: Clock },
        { title: 'Yapay Zeka Asistan', path: 'ai-asistan', icon: Brain },
        { title: 'Kişilik Analizleri', path: 'analizler', icon: TrendingUp },
      ]
    },
    {
      title: 'Hesap & Finans',
      items: [
        { title: 'Mağaza', path: 'magaza', icon: ShoppingBag },
        { title: 'Abonelikler', path: 'abonelik', icon: Star },
        { title: 'Profilim', path: 'profil', icon: User },
      ]
    }
  ];

  const isAdminUser = isAdmin || realUserData?.role === 'admin';

  return (
    <div className="flex flex-col flex-1 min-h-screen">
      {/* Admin Diagnostic & Student Switcher Bar */}
      {isAdminUser && <AdminStudentBar />}

      <div className="flex flex-1 mt-0 relative min-w-0">
        {/* Sidebar Toggle Trigger (Visible when collapsed on desktop) */}
        <AnimatePresence>
          {isSidebarCollapsed && (
            <motion.button
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              onClick={() => setIsSidebarCollapsed(false)}
              className="fixed left-4 top-1/2 -translate-y-1/2 z-[60] w-10 h-10 bg-blue-600 rounded-xl items-center justify-center text-white shadow-lg shadow-blue-500/20 hover:scale-110 transition-transform hidden md:flex"
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
              className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 md:hidden"
            />
          )}
        </AnimatePresence>

        {/* Sidebar */}
        <aside className={`
          fixed inset-y-0 left-0 z-50 w-72 bg-slate-900/95 md:bg-slate-900/40 backdrop-blur-3xl border-r border-white/5 flex flex-col transition-all duration-300 print:hidden
          ${isMobileDrawerOpen ? 'translate-x-0' : '-translate-x-full'}
          md:translate-x-0 md:static md:h-auto md:min-h-full
          ${isSidebarCollapsed ? 'md:w-20' : 'md:w-64'}
        `}>
          {/* Toggle Button Inside Sidebar (Desktop only) */}
          {!isSidebarCollapsed && (
            <button 
              onClick={() => setIsSidebarCollapsed(true)}
              className="absolute -right-3 top-1/2 -translate-y-1/2 w-6 h-12 bg-slate-900 border border-white/5 rounded-full flex items-center justify-center text-slate-500 hover:text-white transition-colors hidden md:flex z-50"
            >
              <ChevronLeft size={14} />
            </button>
          )}

          {/* Sidebar Header */}
          <div className="p-6 flex items-center justify-between border-b border-white/5 md:border-none">
            <div>
              <p className="text-[10px] text-blue-400 font-bold uppercase tracking-widest mb-1">
                {isAdminUser ? 'Yönetici Önizlemesi' : 'Hesap Türü'}
              </p>
              <p className="text-sm text-white font-bold flex items-center gap-2">
                <span className={`w-2 h-2 rounded-full ${isAdminUser ? 'bg-red-500 animate-pulse' : 'bg-amber-500'}`}></span>
                <span className={`${isSidebarCollapsed ? 'md:hidden' : ''}`}>
                  {isAdminUser ? (
                    impersonatedStudent ? `${impersonatedStudent.firstName} (Öğrenci)` : 'Öğrenci Seçilmedi'
                  ) : (
                    'Öğrenci Hesabı'
                  )}
                </span>
              </p>
            </div>
            <button 
              onClick={() => setIsMobileDrawerOpen(false)}
              className="p-2 text-slate-400 hover:text-white bg-white/5 rounded-xl md:hidden"
            >
              <X size={16} />
            </button>
          </div>

          <nav className="flex-1 md:flex-none px-3 py-4 space-y-6 overflow-y-auto md:overflow-y-visible md:h-auto no-scrollbar [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            {menuSections.map((section, idx) => (
              <div key={idx} className="space-y-1">
                {section.title && (
                  <p className={`px-4 text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2 ${isSidebarCollapsed ? 'md:hidden' : ''}`}>
                    {section.title}
                  </p>
                )}
                {section.items.map((item) => {
                  const isAlwaysOpen = ['magaza', 'abonelik', 'profil', 'sepet', 'online-egitimler', 'etkinlikler'].includes(item.path);
                  const hasCoach = !!(userData?.coachId || userData?.assignedCoachId);
                  const hasActiveSub = isSubscriptionActive(userData);
                  
                  let isDisabled = false;
                  // If admin is inspecting, never disable items so they can diagnose and test freely!
                  if (!isAdminUser) {
                    if (!hasCoach) {
                      isDisabled = item.path !== '' && item.path !== 'caba-testi';
                    } else if (!hasActiveSub) {
                      isDisabled = !isAlwaysOpen && item.path !== 'caba-testi';
                    } else {
                      const plan = userData?.subscriptionPlan || '';
                      const isBronze = plan.includes('Bronz');
                      const isSilver = plan.includes('Gümüş');
                      
                      if (item.path === 'zaman-yonetimi' && isBronze) {
                        isDisabled = true;
                      } else if (item.path === 'ai-asistan' && (isBronze || isSilver)) {
                        isDisabled = true;
                      } else if (item.path === 'analizler' && isBronze) {
                        isDisabled = true;
                      }
                    }
                  }
                  
                  return (
                    <NavLink
                      key={item.title}
                      to={isDisabled ? '#' : item.path}
                      end
                      onClick={(e) => {
                        if (isDisabled) e.preventDefault();
                      }}
                      className={({ isActive }) => `
                        flex items-center gap-3 px-4 py-2.5 rounded-xl transition-all duration-300 group
                        ${isActive && !isDisabled
                          ? 'bg-blue-600/10 text-blue-400 border border-blue-500/20' 
                          : 'text-slate-400 hover:text-white hover:bg-white/5'
                        }
                        ${isDisabled ? 'opacity-50 cursor-not-allowed' : ''}
                      `}
                    >
                      <item.icon size={18} className="shrink-0" />
                      <span className={`${isSidebarCollapsed ? 'md:hidden' : ''} text-sm font-semibold tracking-wide flex-1`}>{item.title}</span>
                      {isDisabled && (
                        <Lock size={14} className={`text-slate-500 ${isSidebarCollapsed ? 'md:hidden' : ''}`} />
                      )}
                    </NavLink>
                  );
                })}
              </div>
            ))}
          </nav>
        </aside>

        {/* Main Content Area */}
        <main className="flex-1 flex flex-col bg-slate-950/20 min-w-0">
          {/* Mobile Sub-Header */}
          <div className="flex md:hidden items-center gap-3 p-4 bg-slate-900/40 backdrop-blur-xl border-b border-white/5 sticky top-[72px] z-20 shrink-0">
            <button
              onClick={() => setIsMobileDrawerOpen(true)}
              className="p-2 bg-blue-600/10 border border-blue-500/20 rounded-xl text-blue-400"
            >
              <PanelLeftOpen size={18} />
            </button>
            <div>
              <p className="text-[9px] text-blue-400 font-bold uppercase tracking-widest leading-none mb-1">Öğrenci Paneli</p>
              <h2 className="text-xs font-bold text-white leading-none">
                {menuSections.flatMap(s => s.items).find(item => {
                  const currentPath = location.pathname.replace('/panel/ogrenci', '').replace(/^\//, '');
                  return item.path === currentPath;
                })?.title || 'Özet'}
              </h2>
            </div>
          </div>

          <div className="flex-1 px-4 md:px-10 pb-4 md:pb-10 pt-2 md:pt-4 flex flex-col">
            <div className="w-full max-w-full mx-auto flex flex-col flex-1">
              {(() => {
                const searchParams = new URLSearchParams(location.search);
                const isDiagnosisMode = searchParams.get('teshis') === 'true';

                // If user is admin and explicitly opened Teşhis mode without selecting a student yet, show the launcher
                if (isAdminUser && !impersonatedStudent && isDiagnosisMode) {
                  return <AdminStudentSelectorEmptyState />;
                }

                // If user is admin (with or without selected student), allow full access to student panel
                if (isAdminUser) {
                  return <Outlet />;
                }

                const currentPath = location.pathname.replace('/panel/ogrenci', '').replace(/^\//, '');
                const isAlwaysOpen = ['magaza', 'abonelik', 'profil', 'sepet', 'online-egitimler', 'etkinlikler'].includes(currentPath);
                const hasCoach = !!(userData?.coachId || userData?.assignedCoachId);
                const hasActiveSub = isSubscriptionActive(userData);
                
                let isAllowed = false;
                let restrictionMessage = '';
                if (!hasCoach) {
                  isAllowed = currentPath === '' || currentPath === 'caba-testi';
                  restrictionMessage = 'Sistemin tüm özelliklerini kullanabilmek için bir eğitim koçu tarafından hesabınızın aktifleştirilmesi gerekmektedir.';
                } else if (!hasActiveSub) {
                  isAllowed = isAlwaysOpen || currentPath === 'caba-testi';
                  restrictionMessage = 'Sistemin bu bölümüne erişebilmek için aktif bir abonelik paketinizin bulunması gerekmektedir.';
                } else {
                  const plan = userData?.subscriptionPlan || '';
                  const isBronze = plan.includes('Bronz');
                  const isSilver = plan.includes('Gümüş');
                  
                  if (currentPath === 'zaman-yonetimi' && isBronze) {
                    isAllowed = false;
                    restrictionMessage = 'Zaman Yönetimi asistanlarına erişmek için lütfen abonelik paketinizi Gümüş veya Altın pakete yükseltin.';
                  } else if (currentPath === 'ai-asistan' && (isBronze || isSilver)) {
                    isAllowed = false;
                    restrictionMessage = 'Yapay Zeka Asistan özelliğine erişmek için lütfen abonelik paketinizi Altın pakete yükseltin.';
                  } else if (currentPath === 'analizler' && isBronze) {
                    isAllowed = false;
                    restrictionMessage = 'Kişilik Analizleri laboratuvarına erişmek için lütfen abonelik paketinizi Gümüş veya Altın pakete yükseltin.';
                  } else {
                    isAllowed = true;
                  }
                }

                if (!isAllowed) {
                  return (
                    <div className="h-full flex flex-col items-center justify-center text-center max-w-md mx-auto mt-20">
                      <div className="w-24 h-24 bg-slate-900 border border-white/10 rounded-3xl flex items-center justify-center mb-6 shadow-2xl">
                        <Lock size={40} className="text-slate-500" />
                      </div>
                      <h2 className="text-2xl font-bold text-white mb-3 tracking-tight">Erişim Kısıtlaması</h2>
                      <p className="text-slate-400 mb-8 leading-relaxed text-sm">
                        {restrictionMessage}
                      </p>
                      {hasCoach && (
                        <Link
                          to="/panel/ogrenci/abonelik"
                          className="bg-blue-600 hover:bg-blue-500 text-white font-bold py-3 px-8 rounded-xl transition-all shadow-lg shadow-blue-500/20"
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
                      <div className="w-24 h-24 bg-slate-900 border border-blue-500/20 rounded-3xl flex items-center justify-center mb-6 shadow-2xl shadow-blue-500/10">
                        <Clock size={40} className="text-blue-500" />
                      </div>
                      <h2 className="text-2xl font-bold text-white mb-3 tracking-tight">Koç Ataması Bekleniyor</h2>
                      <p className="text-slate-400 mb-6 leading-relaxed text-sm">
                        Hesabınız başarıyla oluşturuldu. Sistemi kullanmaya başlamak için kurumunuz veya bir eğitim koçu tarafından hesabınızın onaylanması ve atama yapılması beklenmektedir.
                      </p>
                      {!isCabaCompleted && (
                        <Link
                          to="/panel/ogrenci/caba-testi"
                          className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-3 px-6 rounded-xl transition-all shadow-lg shadow-emerald-500/20 flex items-center gap-2 hover:scale-105"
                        >
                          <Brain size={18} />
                          ÇABA Testi'ni Doldur
                        </Link>
                      )}
                    </div>
                  );
                }

                return <Outlet />;
              })()}
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
