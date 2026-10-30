import React, { useState, useEffect } from 'react';
import { NavLink, Outlet, Link, useNavigate, useLocation } from 'react-router-dom';
import { safeStorage } from '../../lib/localStorage';
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
  Bot,
  X
} from 'lucide-react';
import { useAuth } from '../../lib/AuthContext';
import { motion, AnimatePresence } from 'motion/react';
import { appointmentService } from '../../services/appointmentService';
import { studentDataService } from '../../services/studentDataService';
import { notificationService } from '../../services/notificationService';

export default function PersonalCoachLayout() {
  const { userData, logout } = useAuth();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    setIsMobileMenuOpen(false);
  }, [location.pathname]);

  useEffect(() => {
    if (userData?.uid && userData.role === 'coach') {
       async function checkStudentStatus() {
         try {
             const students = await appointmentService.getCoachStudents(userData.uid);
             const now = new Date();
             const today = now.toISOString().split('T')[0];
             const tomorrowDate = new Date();
             tomorrowDate.setDate(tomorrowDate.getDate() + 1);
             const tomorrow = tomorrowDate.toISOString().split('T')[0];

             // New student tracking
             const cachedStudentsJson = safeStorage.getItem(`coach_students_data_${userData.uid}`);
             const cachedStudentsData = cachedStudentsJson ? JSON.parse(cachedStudentsJson) : {};
             const oldStudentsUids = Object.keys(cachedStudentsData);
             
             const newStudentsData: Record<string, any> = {};

             if (cachedStudentsJson !== null) {
                 const newStudents = students.filter(s => !oldStudentsUids.includes(s.uid) && !s.isArchived && !s.archived);
                 for (const newStudent of newStudents) {
                     const newStudentKey = `coach_new_student_${userData.uid}_${newStudent.uid}`;
                     if (!safeStorage.getItem(newStudentKey)) {
                          safeStorage.setItem(newStudentKey, 'true');
                          await notificationService.addNotification(userData.uid, {
                              title: 'Yeni Öğrenci!',
                              message: `Aramıza yeni biri katıldı: '${newStudent.firstName || ''} ${newStudent.lastName || ''}' öğrencilerinize eklendi. Hemen bir tanışma mesajı gönderin! 👋`,
                              type: 'success',
                              link: '/panel/koc/ogrenciler',
                              studentId: newStudent.uid
                          });
                     }
                 }
             }

             for (const student of students) {
                // Skip notification generation for archived students on coach side
                if (student.isArchived || student.archived) continue;

                newStudentsData[student.uid] = {
                    subscriptionStatus: student.subscriptionStatus,
                    streak: student.streak || 0
                };

                // Subscription Status Changed to Expired
                const oldData = cachedStudentsData[student.uid];
                if (oldData && oldData.subscriptionStatus === 'active' && student.subscriptionStatus === 'expired') {
                     const expWarnKey = `coach_sub_expired_${student.uid}_${now.getTime()}`;
                     if (!safeStorage.getItem(expWarnKey)) {
                         safeStorage.setItem(expWarnKey, 'true');
                         await notificationService.addNotification(userData.uid, {
                             title: 'Abonelik İptali/Güncellemesi',
                             message: `'${student.firstName || ''} ${student.lastName || ''}' adlı öğrencinin koçluk aboneliği sona erdi, artık aktif öğrencileriniz arasında değil.`,
                             type: 'system',
                             link: '/panel/koc/ogrenciler'
                         });
                     }
                }

                // Check Subscription Expiration (Ends Soon)
                if (student.subscriptionStatus === 'active' && student.subscriptionEndDate) {
                   const subEnd = new Date(student.subscriptionEndDate);
                   const daysToSubEnd = Math.max(0, Math.ceil((subEnd.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)));
                   
                   if (daysToSubEnd <= 3 && daysToSubEnd > 0) {
                       const subWarnKey = `coach_sub_warn_${student.uid}_${daysToSubEnd}`;
                       if (!safeStorage.getItem(subWarnKey)) {
                           safeStorage.setItem(subWarnKey, 'true');
                           await notificationService.addNotification(userData.uid, {
                               title: 'Abonelik Bitişi Yaklaşıyor',
                               message: `Dikkat: '${student.firstName || ''} ${student.lastName || ''}' adlı öğrencinizin aboneliğinin bitmesine son ${daysToSubEnd} gün kaldı.`,
                               type: 'system',
                               link: '/panel/koc/ogrenciler'
                           });
                       }
                   }
                }

                // Streak Success (Motivasyon)
                if (student.streak && (student.streak === 7 || student.streak === 14 || student.streak === 30)) {
                     const streakKey = `coach_streak_${student.uid}_${student.streak}`;
                     if (!safeStorage.getItem(streakKey)) {
                         safeStorage.setItem(streakKey, 'true');
                         await notificationService.addNotification(userData.uid, {
                             title: 'Motivasyon Zamanı!',
                             message: `Harika haber! Öğrenciniz '${student.firstName || ''} ${student.lastName || ''}' ${student.streak} günlük çalışma serisine ulaştı. Onu tebrik ederek motivasyonunu artırın! 🌟`,
                             type: 'success',
                             link: '/panel/koc/ogrenciler'
                         });
                     }
                }

                // Inactivity (Pasiflik) Check & Low Completion Check
                try {
                     const pastDates = [
                        today,
                        new Date(now.getTime() - 86400000).toISOString().split('T')[0],
                        new Date(now.getTime() - 86400000 * 2).toISOString().split('T')[0],
                        new Date(now.getTime() - 86400000 * 3).toISOString().split('T')[0]
                     ];
                     const pastProgramsRes = await studentDataService.getDailyPrograms(student.uid, pastDates);
                     
                     let totalPastTasks = 0;
                     let completedPastTasks = 0;
                     let todayTotal = 0;
                     let todayCompleted = 0;

                     for (const d of (pastProgramsRes || [])) {
                         if (d && Array.isArray(d.tasks)) {
                             totalPastTasks += d.tasks.length;
                             completedPastTasks += d.tasks.filter((t: any) => t && t.isDone).length;
                             
                             if (d.id === today) {
                                todayTotal = d.tasks.length;
                                todayCompleted = d.tasks.filter((t: any) => t && t.isDone).length;
                             }
                         }
                     }

                     // Inactivity Warning
                     if (totalPastTasks > 0 && completedPastTasks === 0) {
                         const inactiveKey = `coach_inactive_${student.uid}_${today}`;
                         if (!safeStorage.getItem(inactiveKey)) {
                             safeStorage.setItem(inactiveKey, 'true');
                             await notificationService.addNotification(userData.uid, {
                                 title: 'Pasiflik Uyarısı (Erken Müdahale)',
                                 message: `Uyarı: '${student.firstName || ''} ${student.lastName || ''}' 3 gündür platformda hiçbir görev tamamlamadı veya giriş yapmadı. Desteğinize ihtiyacı olabilir.`,
                                 type: 'appointment',
                                 link: '/panel/koc/ogrenciler'
                             });
                         }
                     }
                     
                     // Low Completion Today
                     if (now.getHours() >= 20 && todayTotal > 0) {
                         const progress = (todayCompleted / todayTotal) * 100;
                         if (progress < 50) {
                             const lowPerfKey = `coach_low_perf_${student.uid}_${today}`;
                             if (!safeStorage.getItem(lowPerfKey)) {
                                  safeStorage.setItem(lowPerfKey, 'true');
                                  await notificationService.addNotification(userData.uid, {
                                      title: 'Düşük Görev Tamamlama',
                                      message: `'${student.firstName || ''} ${student.lastName || ''}'nın bugün görev tamamlama oranı çok düşük (%${Math.round(progress)}). Programını gözden geçirmek isteyebilirsiniz.`,
                                      type: 'appointment',
                                      link: '/panel/koc/ogrenciler'
                                  });
                             }
                         }
                     }
                } catch(e) {}
             }
             
             safeStorage.setItem(`coach_students_data_${userData.uid}`, JSON.stringify(newStudentsData));
         } catch (e) { console.error('Coach checks failed', e) }
       }
       
       async function checkCoachBalance() {
           // Client-side auto balance checking is disabled to prevent duplicate or false notifications.
           // Balance notifications are now triggered authoritatively on the server/admin action.
        }
        
        async function checkUpcomingAppointments() {
         try {
             const appointments = await appointmentService.getAppointments(userData!.uid, 'coach');
             const now = new Date();
             
             for (const app of appointments) {
                 if (app.status === 'confirmed') {
                     const [year, month, day] = app.date.split('-');
                     const [hours, minutes] = app.startTime.split(':');
                     const appDateTime = new Date(parseInt(year), parseInt(month) - 1, parseInt(day), parseInt(hours), parseInt(minutes));
                     
                     const diffMs = appDateTime.getTime() - now.getTime();
                     if (diffMs > 0) {
                         const diffHours = diffMs / (1000 * 60 * 60);
                         
                         // 24 Hour reminder
                         if (diffHours <= 24 && diffHours > 23) {
                             const key = `coach_app_24h_${app.id}`;
                             if (!safeStorage.getItem(key)) {
                                 safeStorage.setItem(key, 'true');
                                 await notificationService.addNotification(userData!.uid, {
                                     title: 'Yaklaşan Randevu',
                                     message: `Hatırlatma: Yarın saat ${app.startTime}'da '${app.studentName}' ile görüşmeniz var.`,
                                     type: 'appointment',
                                     link: '/panel/koc/randevular'
                                 });
                             }
                         }
                         
                         // 1 Hour reminder
                         if (diffHours <= 1 && diffHours > 0) {
                             const key = `coach_app_1h_${app.id}`;
                             if (!safeStorage.getItem(key)) {
                                 safeStorage.setItem(key, 'true');
                                 await notificationService.addNotification(userData!.uid, {
                                     title: 'Randevuya Son 1 Saat',
                                     message: `Hatırlatma: '${app.studentName}' ile olan randevunuzun başlamasına sadece 1 saat kaldı.`,
                                     type: 'appointment',
                                     link: '/panel/koc/randevular'
                                 });
                             }
                         }
                     }
                 }
             }
         } catch (e) {}
       }
       
       checkStudentStatus();
       checkUpcomingAppointments();
       checkCoachBalance();
    }
  }, [userData]);

  const menuItems = [
    { title: 'Genel Özet', path: '/panel/koc', icon: LayoutDashboard, end: true },
    { title: 'Öğrencilerim', path: '/panel/koc/ogrenciler', icon: Users },
    { title: 'ON Asistan', path: '/panel/koc/asistan', icon: Bot },
    { title: 'Randevular', path: '/panel/koc/randevular', icon: Calendar },
    { title: 'Genel Değerlendirme', path: '/panel/koc/degerlendirme', icon: BarChart3 },
    { title: 'Profil Ayarları', path: '/panel/koc/profil', icon: UserCircle },
    { title: 'Cüzdan ve Kazanç', path: '/panel/koc/cuzdan', icon: Wallet },
  ];

  return (
    <div className="flex h-full bg-[#070b14] relative overflow-x-hidden min-w-0">
      {/* Mesh Gradients */}
      <div className="fixed top-0 right-0 w-[500px] h-[500px] bg-emerald-500/5 blur-[120px] rounded-full pointer-events-none" />
      <div className="fixed bottom-0 left-0 w-[500px] h-[500px] bg-blue-500/5 blur-[120px] rounded-full pointer-events-none" />

      {/* Sidebar Toggle Trigger (Visible when collapsed on desktop) */}
      <AnimatePresence>
        {isSidebarCollapsed && (
          <motion.button
            id="tour-coach-sidebar-open"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            onClick={() => setIsSidebarCollapsed(false)}
            className="fixed left-4 top-1/2 -translate-y-1/2 z-[70] w-10 h-10 bg-emerald-600 rounded-xl flex items-center justify-center text-white shadow-lg shadow-emerald-500/20 hover:scale-110 transition-transform hidden lg:flex cursor-pointer"
            title="Yan Paneli Aç"
          >
            <PanelLeftOpen size={20} />
          </motion.button>
        )}
      </AnimatePresence>

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

      {/* Sidebar */}
      <aside className={`
        fixed inset-y-0 left-0 z-50 w-72 bg-[#070b14]/95 border-r border-white/5 flex flex-col transition-all duration-300 lg:static lg:h-auto lg:min-h-full
        ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
        ${isSidebarCollapsed ? 'lg:w-0 lg:opacity-0 lg:pointer-events-none' : 'lg:w-72 lg:opacity-100'}
      `}>
        {/* Logo Section */}
        <div className="p-8 shrink-0 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-3 group">
            <div className="w-10 h-10 bg-emerald-600 rounded-xl flex items-center justify-center shadow-lg shadow-emerald-900/20 group-hover:scale-110 transition-transform">
              <span className="text-white font-black text-xl italic leading-none">N</span>
            </div>
            <div>
              <span className="text-white font-black text-lg tracking-tighter italic leading-none block">ÖMER NASUH</span>
              <span className="text-emerald-500 font-bold text-[10px] tracking-[0.3em] uppercase leading-none block mt-1">Akademi</span>
            </div>
          </Link>
          <button 
            onClick={() => setIsMobileMenuOpen(false)}
            className="p-2 text-slate-400 hover:text-white bg-white/5 rounded-xl lg:hidden"
          >
            <X size={16} />
          </button>
        </div>

        {/* Search in Sidebar - Removed */}

        {/* Navigation */}
        <nav className="flex-1 lg:flex-none px-4 space-y-1 overflow-y-auto lg:overflow-y-visible lg:h-auto no-scrollbar [scrollbar-width:none] [&::-webkit-scrollbar]:hidden pb-10">
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
        <div className="p-4 border-t border-white/5 space-y-2 shrink-0">
           <button 
             onClick={logout}
             className="w-full flex items-center gap-3 px-4 py-3.5 rounded-2xl text-red-500 hover:bg-red-500/10 transition-all font-bold text-sm"
           >
             <LogOut size={18} />
             Çıkış Yap
           </button>
        </div>
      </aside>

      {/* Sidebar Toggle Close Trigger (Fixed on border in the exact vertical center of the viewport, rendered on top of sidebar with z-[70]) */}
      {!isSidebarCollapsed && (
        <button 
          id="tour-coach-sidebar-collapse"
          onClick={() => setIsSidebarCollapsed(true)}
          className="fixed left-[288px] -translate-x-1/2 top-1/2 -translate-y-1/2 w-6 h-12 bg-[#0b1324] border border-slate-700 hover:border-emerald-500 rounded-full flex items-center justify-center text-slate-300 hover:text-white shadow-2xl hover:scale-105 transition-all hidden lg:flex z-[70] cursor-pointer group"
          title="Yan Menüyü Gizle"
        >
          <ChevronLeft size={14} className="group-hover:-translate-x-0.5 transition-transform text-slate-400 group-hover:text-emerald-400" />
        </button>
      )}

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Mobile Sub-Header */}
        <div className="flex lg:hidden items-center gap-3 p-4 bg-[#070b14]/40 backdrop-blur-xl border-b border-white/5 sticky top-0 z-20 shrink-0">
          <button
            onClick={() => setIsMobileMenuOpen(true)}
            className="p-2 bg-emerald-600/10 border border-emerald-500/20 rounded-xl text-emerald-400"
          >
            <PanelLeftOpen size={18} />
          </button>
          <div className="flex-1">
            <p className="text-[9px] text-emerald-400 font-bold uppercase tracking-widest leading-none mb-1">Koç Paneli</p>
            <h2 className="text-xs font-bold text-white leading-none">
              {menuItems.find(item => {
                const currentPath = location.pathname;
                return item.path === currentPath;
              })?.title || 'Genel Özet'}
            </h2>
          </div>
        </div>

        {/* Content View */}
        <main className="flex-1 px-4 md:px-8 pb-4 md:pb-8 pt-2 md:pt-4">
          <div className="w-full mx-auto">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
}
