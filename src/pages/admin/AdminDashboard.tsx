import React, { useEffect, useState } from 'react';
import { 
  Users, 
  GraduationCap, 
  Briefcase, 
  CheckCircle, 
  TrendingUp, 
  ArrowUpRight, 
  ArrowDownRight,
  Clock,
  DollarSign,
  Ticket,
  Calendar,
  Layers,
  Inbox,
  UserCheck,
  Zap,
  Globe,
  Eye,
  EyeOff,
  RefreshCw,
  AlertCircle,
  ShieldCheck,
  Activity,
  CheckCircle2,
  XCircle,
  HeartHandshake,
  Settings,
  Bell,
  ChevronRight,
  Sparkles,
  BarChart3,
  Award
} from 'lucide-react';
import { 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  BarChart,
  Bar
} from 'recharts';
import { collection, query, where, getDocs, orderBy, limit, doc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { referralService } from '../../services/referralService';
import { NotificationPrompt } from '../../components/NotificationPrompt';
import { Link, useNavigate } from 'react-router-dom';

export default function AdminDashboard() {
  const navigate = useNavigate();
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalStudents: 0,
    totalCoaches: 0,
    totalParents: 0,
    pendingCoaches: 0,
    usersTrend: 0,
    studentsTrend: 0,
    coachesTrend: 0,
    activeCoupons: 0,
    totalRevenue: 0,
    revenueTrend: 0,
    unreadMessages: 0,
    totalAppointments: 0,
    completedAppointments: 0,
    pendingAppointments: 0
  });

  const [chartData, setChartData] = useState<any[]>([]);
  const [revenueChartData, setRevenueChartData] = useState<any[]>([]);
  const [recentActivities, setRecentActivities] = useState<any[]>([]);
  const [pendingCoachList, setPendingCoachList] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [showRevenue, setShowRevenue] = useState(false);
  const [activeChartTab, setActiveChartTab] = useState<'growth' | 'revenue'>('growth');
  const [approvingId, setApprovingId] = useState<string | null>(null);

  const fetchStats = async (isManualRefresh = false) => {
    if (isManualRefresh) setRefreshing(true);
    else setLoading(true);

    try {
      // 1. Fetch Users Data
      const usersSnap = await getDocs(collection(db, 'users'));
      const allUsers = usersSnap.docs.map(doc => ({ id: doc.id, ...doc.data() as any }));
      
      let pendingC = 0;
      let tUsers = allUsers.length;
      let tStudents = 0;
      let tCoaches = 0;
      let tParents = 0;
      const pendingCoachesArray: any[] = [];

      const now = new Date();
      const thisMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);
      const lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);

      let usersThisMonth = 0;
      let usersLastMonth = 0;
      let studentsThisMonth = 0;
      let studentsLastMonth = 0;
      let coachesThisMonth = 0;
      let coachesLastMonth = 0;

      allUsers.forEach(u => {
        if (u.role === 'student') tStudents++;
        else if (u.role === 'coach') {
           tCoaches++;
           if (u.approved === false) {
             pendingC++;
             pendingCoachesArray.push(u);
           }
        } else if (u.role === 'parent') {
           tParents++;
        }

        let createdAt: Date | null = null;
        if (u.createdAt) {
           createdAt = u.createdAt?.toDate ? u.createdAt.toDate() : new Date(u.createdAt);
        }

        if (createdAt && !isNaN(createdAt.getTime())) {
           if (createdAt >= thisMonthStart) {
              usersThisMonth++;
              if (u.role === 'student') studentsThisMonth++;
              if (u.role === 'coach') coachesThisMonth++;
           } else if (createdAt >= lastMonthStart && createdAt < thisMonthStart) {
              usersLastMonth++;
              if (u.role === 'student') studentsLastMonth++;
              if (u.role === 'coach') coachesLastMonth++;
           }
        }
      });

      setPendingCoachList(pendingCoachesArray.slice(0, 4));

      // 2. Fetch Revenue Stats
      // revTotal: Platform Toplam Ciro (Includes ALL deposit volume: coach transfers, system loadings, gifts/promotions, admin additions)
      // revThisMonth / revLastMonth / monthlyRevenueMap: Monthly System Revenue Trend (Filtered for system net payments & admin additions)
      let revTotal = 0;
      let revThisMonth = 0;
      let revLastMonth = 0;
      const monthlyRevenueMap: { [key: string]: number } = {};

      try {
        const transSnap = await getDocs(query(collection(db, 'wallet_transactions'), where('type', '==', 'DEPOSIT')));
        transSnap.forEach(t => {
          const data = t.data();
          const amount = Number(data.amount) || 0;

          // Always add to total platform volume ("Platform Toplam Ciro")
          revTotal += amount;
          
          // Exclude transactions where coachId is a coach's UID (i.e. loadings/transfers from coach to student)
          if (data.coachId && data.coachId !== 'SYSTEM') {
            return;
          }

          // Exclude explicit coach transfer or coach loading flags
          if (data.isCoachTransfer === true || data.isCoachLoading === true) {
            return;
          }

          // Check if transaction is gift / bonus / referral reward
          const isGiftFlag = data.isGift === true || data.isBonus === true;
          const isPaidFlag = data.isPaid === true || data.paymentProvider === 'PayTR' || !!data.merchantOid;
          const desc = (data.description || '').toLowerCase();
          
          // Admin additions should be included in system revenue
          const isAdminAddition = desc.includes('yönetici') || desc.includes('yonetici') || desc.includes('admin') || data.isAdminAddition === true;

          const giftKeywords = [
            'hediye', 'ödül', 'odul', 'davet', 'bonus', 
            'promosyon', 'kupon', 'sistem hediyesi'
          ];
          const hasGiftKeyword = giftKeywords.some(kw => desc.includes(kw));

          // Exclude gift/bonus deposit UNLESS it's an admin addition or real paid system transaction
          if (!isAdminAddition && (isGiftFlag || (hasGiftKeyword && !isPaidFlag))) {
            return;
          }
          
          let tDate: Date | null = null;
          if (data.createdAt) {
             tDate = data.createdAt?.toDate ? data.createdAt.toDate() : new Date(data.createdAt);
          } else if (data.date) {
             tDate = new Date(data.date);
          }
          if (tDate && !isNaN(tDate.getTime())) {
             if (tDate >= thisMonthStart) revThisMonth += amount;
             else if (tDate >= lastMonthStart && tDate < thisMonthStart) revLastMonth += amount;

             const monthKey = `${tDate.getFullYear()}-${tDate.getMonth()}`;
             monthlyRevenueMap[monthKey] = (monthlyRevenueMap[monthKey] || 0) + amount;
          }
        });
      } catch(e) {
        console.warn("Wallet transactions fetch warning:", e);
      }

      // 3. Fetch Coupons Stats
      let couponsActive = 0;
      try {
         const couponSnap = await getDocs(collection(db, 'coupons'));
         couponSnap.forEach(c => {
            if (c.data().status === 'active') couponsActive++;
         });
      } catch(e) {}

      // 4. Fetch Unread Messages
      let unread = 0;
      try {
         const mailSnap = await getDocs(query(collection(db, 'inbox_messages'), where('status', '==', 'new')));
         unread = mailSnap.docs.length;
      } catch(e) {}

      // 5. Fetch Appointments Stats
      let totalAppts = 0;
      let completedAppts = 0;
      let pendingAppts = 0;
      try {
        const apptSnap = await getDocs(collection(db, 'appointments'));
        totalAppts = apptSnap.docs.length;
        apptSnap.forEach(doc => {
          const status = doc.data().status;
          if (status === 'completed' || status === 'approved') completedAppts++;
          if (status === 'pending') pendingAppts++;
        });
      } catch(e) {}

      const calcTrend = (thisM: number, lastM: number) => {
         if (lastM === 0) return thisM > 0 ? 100 : 0;
         return Math.round(((thisM - lastM) / lastM) * 100);
      };

      setStats({
        totalUsers: tUsers,
        totalStudents: tStudents,
        totalCoaches: tCoaches,
        totalParents: tParents,
        pendingCoaches: pendingC,
        usersTrend: calcTrend(usersThisMonth, usersLastMonth),
        studentsTrend: calcTrend(studentsThisMonth, studentsLastMonth),
        coachesTrend: calcTrend(coachesThisMonth, coachesLastMonth),
        activeCoupons: couponsActive,
        totalRevenue: revTotal,
        revenueTrend: calcTrend(revThisMonth, revLastMonth),
        unreadMessages: unread,
        totalAppointments: totalAppts,
        completedAppointments: completedAppts,
        pendingAppointments: pendingAppts
      });

      // 6. Build User Growth Chart Data (Last 6 Months)
      const months = [];
      const revMonths = [];
      for(let i=5; i>=0; i--) {
         const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
         const mKey = `${d.getFullYear()}-${d.getMonth()}`;
         const monthName = d.toLocaleString('tr-TR', { month: 'short' }) + " '" + d.getFullYear().toString().substring(2);
         
         months.push({
            year: d.getFullYear(),
            month: d.getMonth(),
            name: monthName,
            usersNew: 0
         });

         revMonths.push({
            name: monthName,
            gelir: monthlyRevenueMap[mKey] || 0
         });
      }

      let baseUsers = 0;
      allUsers.forEach(u => {
          let createdAt: Date | null = null;
          if (u.createdAt) {
            createdAt = u.createdAt?.toDate ? u.createdAt.toDate() : new Date(u.createdAt);
          }
          if (createdAt && !isNaN(createdAt.getTime())) {
             if (createdAt < new Date(now.getFullYear(), now.getMonth() - 5, 1)) {
                 baseUsers++;
             } else {
                 const uYear = createdAt.getFullYear();
                 const uMonth = createdAt.getMonth();
                 const bucket = months.find(m => m.year === uYear && m.month === uMonth);
                 if (bucket) {
                    bucket.usersNew++;
                 }
             }
          } else {
             baseUsers++;
          }
      });

      months.forEach(m => {
         baseUsers += m.usersNew;
         (m as any).users = baseUsers;
      });

      setChartData(months);
      setRevenueChartData(revMonths);

      // 7. Recent User Activities
      const sortedUsers = allUsers
          .filter(u => u.createdAt)
          .sort((a, b) => {
             const da = a.createdAt?.toDate ? a.createdAt.toDate() : new Date(a.createdAt);
             const dbDate = b.createdAt?.toDate ? b.createdAt.toDate() : new Date(b.createdAt);
             return dbDate.getTime() - da.getTime();
          })
          .slice(0, 6);

      const activities = sortedUsers.map(u => {
          const d = u.createdAt?.toDate ? u.createdAt.toDate() : new Date(u.createdAt);
          const nowTime = new Date().getTime();
          const diffMin = Math.round((nowTime - d.getTime()) / 60000);
          
          let timeStr = '';
          if (diffMin < 1) timeStr = 'Az önce';
          else if (diffMin < 60) timeStr = `${diffMin} dk önce`;
          else if (diffMin < 1440) timeStr = `${Math.floor(diffMin/60)} saat önce`;
          else timeStr = `${Math.floor(diffMin/1440)} gün önce`;

          let roleLabel = 'Öğrenci Kaydı';
          let roleColor = 'text-blue-400 bg-blue-500/10 border-blue-500/20';
          let roleIcon = GraduationCap;

          if (u.role === 'coach') {
            roleLabel = u.approved ? 'Eğitmen Koç Kaydı' : 'Koç Başvurusu';
            roleColor = 'text-amber-400 bg-amber-500/10 border-amber-500/20';
            roleIcon = Briefcase;
          } else if (u.role === 'parent') {
            roleLabel = 'Veli Kaydı';
            roleColor = 'text-purple-400 bg-purple-500/10 border-purple-500/20';
            roleIcon = HeartHandshake;
          } else if (u.role === 'admin') {
            roleLabel = 'Yönetici Hesabı';
            roleColor = 'text-red-400 bg-red-500/10 border-red-500/20';
            roleIcon = ShieldCheck;
          }

          return {
             id: u.id,
             user: `${u.firstName || u.name || ''} ${u.lastName || ''}`.trim() || u.email || 'İsimsiz Kullanıcı',
             action: roleLabel,
             time: timeStr,
             icon: roleIcon,
             color: roleColor,
             email: u.email || ''
          };
      });

      setRecentActivities(activities);

    } catch (err) {
      console.error("Admin stats fetch error:", err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, []);

  // Quick Coach Approval handler
  const handleQuickApproveCoach = async (coachId: string) => {
    try {
      setApprovingId(coachId);
      await updateDoc(doc(db, 'users', coachId), {
        approved: true,
        approvedAt: serverTimestamp()
      });
      await referralService.grantCoachWelcomeGift(coachId, 1500);
      // Refresh list
      await fetchStats(true);
    } catch (err) {
      console.error("Coach approval error:", err);
    } finally {
      setApprovingId(null);
    }
  };

  const statCards = [
    { 
      label: 'Platform Toplam Ciro', 
      value: `₺${stats.totalRevenue.toLocaleString('tr-TR', { minimumFractionDigits: 2 })}`, 
      icon: DollarSign, 
      color: 'text-emerald-400',
      bgColor: 'from-emerald-500/10 to-teal-500/5 border-emerald-500/20',
      trend: `${stats.revenueTrend > 0 ? '+' : ''}${stats.revenueTrend}%`, 
      up: stats.revenueTrend >= 0,
      isRevenueCard: true
    },
    { 
      label: 'Toplam Ekosistem', 
      value: stats.totalUsers, 
      subText: `${stats.totalStudents} Öğrenci • ${stats.totalCoaches} Koç • ${stats.totalParents} Veli`,
      icon: Users, 
      color: 'text-blue-400',
      bgColor: 'from-blue-500/10 to-indigo-500/5 border-blue-500/20',
      trend: `${stats.usersTrend > 0 ? '+' : ''}${stats.usersTrend}%`, 
      up: stats.usersTrend >= 0 
    },
    { 
      label: 'Koçluk Seansları', 
      value: stats.totalAppointments, 
      subText: `${stats.completedAppointments} Tamamlanan / ${stats.pendingAppointments} Bekleyen`,
      icon: Calendar, 
      color: 'text-amber-400',
      bgColor: 'from-amber-500/10 to-orange-500/5 border-amber-500/20',
      trend: 'Aktif', 
      up: true 
    },
    { 
      label: 'Onay & Mesaj Bekleyenler', 
      value: stats.pendingCoaches + stats.unreadMessages, 
      subText: `${stats.pendingCoaches} Koç Onayı • ${stats.unreadMessages} Yeni Mesaj`,
      icon: AlertCircle, 
      color: stats.pendingCoaches > 0 ? 'text-red-400' : 'text-fuchsia-400',
      bgColor: stats.pendingCoaches > 0 ? 'from-red-500/15 to-pink-500/5 border-red-500/30' : 'from-fuchsia-500/10 to-purple-500/5 border-fuchsia-500/20',
      trend: stats.pendingCoaches > 0 ? 'Dikkat' : 'Normal', 
      up: stats.pendingCoaches === 0 
    },
  ];

  const quickLinks = [
    { 
      label: 'Gelen Kutusu', 
      path: 'gelen-kutusu', 
      description: 'WhatsApp & Destek',
      icon: Inbox, 
      color: 'bg-blue-500/10 text-blue-400 border-blue-500/20', 
      badge: stats.unreadMessages 
    },
    { 
      label: 'Koç Onayları', 
      path: 'koc-onaylari', 
      description: 'Başvuru Değerlendirme',
      icon: UserCheck, 
      color: 'bg-amber-500/10 text-amber-400 border-amber-500/20', 
      badge: stats.pendingCoaches 
    },
    { 
      label: 'Kullanıcılar', 
      path: 'kullanicilar', 
      description: 'Öğrenci, Koç, Veli',
      icon: Users, 
      color: 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20'
    },
    { 
      label: 'Seans & Randevular', 
      path: 'randevular', 
      description: 'Takvim & Randevular',
      icon: Calendar, 
      color: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
    },
    { 
      label: 'Mali Durum & Cüzdan', 
      path: 'mali-durum', 
      description: 'Kesintiler & Ödemeler',
      icon: DollarSign, 
      color: 'bg-teal-500/10 text-teal-400 border-teal-500/20'
    },
    { 
      label: 'Sistem Ayarları', 
      path: 'ayarlar', 
      description: 'Twilio, PayTR & Loglar',
      icon: Settings, 
      color: 'bg-rose-500/10 text-rose-400 border-rose-500/20'
    },
    { 
      label: 'Duyurular', 
      path: 'duyurular', 
      description: 'Platform Bildirimleri',
      icon: Bell, 
      color: 'bg-purple-500/10 text-purple-400 border-purple-500/20'
    },
    { 
      label: 'Etkinlik Yönetimi', 
      path: 'etkinlikler', 
      description: 'Webinar & Seminerler',
      icon: Layers, 
      color: 'bg-fuchsia-500/10 text-fuchsia-400 border-fuchsia-500/20'
    },
  ];

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <NotificationPrompt />

      {/* Header Banner */}
      <div className="relative overflow-hidden bg-gradient-to-r from-slate-900 via-slate-900/90 to-indigo-950/40 border border-white/10 rounded-3xl p-6 md:p-8 shadow-2xl">
        <div className="absolute top-0 right-0 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl -mr-20 -mt-20 pointer-events-none" />
        <div className="absolute bottom-0 left-1/3 w-64 h-64 bg-emerald-500/5 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div>
            <div className="flex items-center gap-3 mb-2 flex-wrap">
              <span className="px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-xs font-black uppercase tracking-wider flex items-center gap-1.5">
                <ShieldCheck size={14} /> Yönetici Kontrol Merkezi
              </span>
              <span className="px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-bold flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" /> Sistem Aktif
              </span>
            </div>
            <h1 className="text-2xl md:text-3xl font-black text-white tracking-tight uppercase">
              FocusON Akademi Yönetim Paneli
            </h1>
            <p className="text-slate-400 text-sm mt-1 font-medium max-w-2xl">
              Platform genelindeki finansal akış, kullanıcı kayıtları, seans verileri ve WhatsApp iletişim durumunu canlı olarak izleyebilirsiniz.
            </p>
          </div>

          <div className="flex items-center gap-3 shrink-0 flex-wrap">
            <button
              onClick={() => fetchStats(true)}
              disabled={refreshing}
              className="bg-slate-950 hover:bg-slate-800 border border-white/10 text-white px-4 py-2.5 rounded-2xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer shadow-lg active:scale-95 disabled:opacity-50"
            >
              <RefreshCw size={15} className={refreshing ? "animate-spin text-indigo-400" : "text-slate-400"} />
              <span>{refreshing ? "Yenileniyor..." : "Verileri Güncelle"}</span>
            </button>
            <Link
              to="kullanicilar"
              className="bg-indigo-600 hover:bg-indigo-500 text-white px-5 py-2.5 rounded-2xl text-xs font-black transition-all flex items-center gap-2 shadow-lg shadow-indigo-600/20 active:scale-95 cursor-pointer"
            >
              <Users size={15} />
              <span>Kullanıcı Ekle</span>
            </Link>
          </div>
        </div>
      </div>

      {/* Primary KPI Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {statCards.map((stat, idx) => (
          <div 
            key={idx} 
            className={`bg-gradient-to-br ${stat.bgColor} bg-slate-900/60 border p-6 rounded-3xl relative overflow-hidden group hover:border-white/20 transition-all duration-300 shadow-xl`}
          >
            <div className="flex justify-between items-start mb-4 relative z-10">
              <div className={`p-3.5 rounded-2xl bg-white/5 border border-white/10 ${stat.color} group-hover:scale-110 transition-transform`}>
                <stat.icon size={22} />
              </div>
              <div className={`flex items-center gap-1 text-[10px] font-black px-2.5 py-1 rounded-full ${stat.up ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-red-500/10 text-red-400 border border-red-500/20'}`}>
                {stat.up ? <ArrowUpRight size={12} /> : <ArrowDownRight size={12} />}
                {stat.trend}
              </div>
            </div>

            <p className="text-slate-400 text-xs font-bold uppercase tracking-wider">{stat.label}</p>
            
            <div className="flex items-center justify-between mt-1.5 relative z-10">
              <h3 className="text-2xl md:text-3xl font-black text-white tabular-nums tracking-tight">
                {loading ? (
                  <span className="text-slate-600 animate-pulse">...</span>
                ) : (
                  stat.isRevenueCard && !showRevenue ? '₺***,***.**' : stat.value
                )}
              </h3>
              {stat.isRevenueCard && (
                <button
                  onClick={() => setShowRevenue(!showRevenue)}
                  className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white border border-white/10 transition-all cursor-pointer"
                  title={showRevenue ? "Tutarı Gizle" : "Tutarı Göster"}
                >
                  {showRevenue ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              )}
            </div>

            {stat.subText && (
              <p className="text-[11px] text-slate-400 mt-2 font-medium border-t border-white/5 pt-2">
                {stat.subText}
              </p>
            )}
          </div>
        ))}
      </div>

      {/* Quick Action Bento Grid */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-sm font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
            <Sparkles size={16} className="text-amber-400" /> Hızlı Yönetim Modülleri
          </h2>
          <span className="text-xs text-slate-500 font-medium">8 Temel Modül</span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-3.5">
          {quickLinks.map((link) => (
            <Link 
              key={link.path}
              to={link.path}
              className="flex flex-col items-center justify-between p-4 rounded-2xl border border-white/5 bg-slate-900/50 hover:bg-slate-800/80 hover:border-white/20 transition-all duration-300 group text-center relative overflow-hidden cursor-pointer shadow-lg"
            >
              <div className={`p-3 rounded-2xl border transition-transform group-hover:scale-110 mb-2.5 relative ${link.color}`}>
                <link.icon size={22} />
                {link.badge !== undefined && link.badge > 0 && (
                  <span className="absolute -top-1.5 -right-1.5 bg-red-600 text-white text-[10px] font-black w-5 h-5 flex items-center justify-center rounded-full shadow-[0_0_12px_rgba(239,68,68,0.6)] animate-pulse">
                    {link.badge}
                  </span>
                )}
              </div>
              <div>
                <span className="text-xs font-bold text-slate-200 group-hover:text-white block leading-tight">
                  {link.label}
                </span>
                <span className="text-[10px] text-slate-500 font-medium block mt-0.5 group-hover:text-slate-400">
                  {link.description}
                </span>
              </div>
            </Link>
          ))}
        </div>
      </div>

      {/* Main Analytics Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Chart Card */}
        <div className="lg:col-span-2 bg-slate-900/60 border border-white/10 rounded-3xl p-6 md:p-8 shadow-xl">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 pb-4 border-b border-white/5">
            <div>
              <h3 className="text-base font-bold text-white flex items-center gap-2 uppercase tracking-wide">
                <BarChart3 size={18} className="text-indigo-400" /> 
                {activeChartTab === 'growth' ? 'Kullanıcı Büyüme Analizi' : 'Finansal Gelir Trendi'}
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                {activeChartTab === 'growth' 
                  ? 'Son 6 aylık akış ve değişim grafiği' 
                  : 'Sadece sistem bakiyesi ödemeleri ve yönetici yüklemeleri (Hediye/Bonus ve koç-öğrenci transferleri hariç)'}
              </p>
            </div>

            <div className="flex items-center gap-2 bg-slate-950 p-1 rounded-2xl border border-white/10">
              <button
                onClick={() => setActiveChartTab('growth')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  activeChartTab === 'growth' 
                    ? 'bg-indigo-600 text-white shadow-md' 
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                Kullanıcı Büyümesi
              </button>
              <button
                onClick={() => setActiveChartTab('revenue')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  activeChartTab === 'revenue' 
                    ? 'bg-emerald-600 text-white shadow-md' 
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                Aylık Bakiye Geliri (₺)
              </button>
            </div>
          </div>

          <div className="h-[280px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              {activeChartTab === 'growth' ? (
                <AreaChart data={chartData}>
                  <defs>
                    <linearGradient id="colorUsers" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#6366f1" stopOpacity={0.4}/>
                      <stop offset="95%" stopColor="#6366f1" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#ffffff08" vertical={false} />
                  <XAxis 
                    dataKey="name" 
                    stroke="#64748b" 
                    fontSize={11} 
                    fontWeight="bold" 
                    axisLine={false} 
                    tickLine={false}
                    dy={10}
                  />
                  <YAxis 
                    stroke="#64748b" 
                    fontSize={11} 
                    fontWeight="bold" 
                    axisLine={false} 
                    tickLine={false}
                  />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: '#0f172a', 
                      borderColor: 'rgba(255,255,255,0.1)',
                      borderRadius: '16px',
                      fontSize: '12px',
                      fontWeight: 'bold',
                      boxShadow: '0 10px 30px -5px rgba(0,0,0,0.5)'
                    }}
                    itemStyle={{ color: '#818cf8' }}
                  />
                  <Area 
                    type="monotone" 
                    dataKey="users" 
                    name="Toplam Kullanıcı"
                    stroke="#6366f1" 
                    strokeWidth={3}
                    fillOpacity={1} 
                    fill="url(#colorUsers)" 
                  />
                </AreaChart>
              ) : (
                <BarChart data={revenueChartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#ffffff08" vertical={false} />
                  <XAxis 
                    dataKey="name" 
                    stroke="#64748b" 
                    fontSize={11} 
                    fontWeight="bold" 
                    axisLine={false} 
                    tickLine={false}
                    dy={10}
                  />
                  <YAxis 
                    stroke="#64748b" 
                    fontSize={11} 
                    fontWeight="bold" 
                    axisLine={false} 
                    tickLine={false}
                  />
                  <Tooltip 
                    formatter={(val: any) => [`₺${Number(val).toLocaleString('tr-TR')}`, 'Gelir']}
                    contentStyle={{ 
                      backgroundColor: '#0f172a', 
                      borderColor: 'rgba(255,255,255,0.1)',
                      borderRadius: '16px',
                      fontSize: '12px',
                      fontWeight: 'bold',
                      boxShadow: '0 10px 30px -5px rgba(0,0,0,0.5)'
                    }}
                  />
                  <Bar dataKey="gelir" fill="#10b981" radius={[8, 8, 0, 0]} name="Aylık Ciro (₺)" />
                </BarChart>
              )}
            </ResponsiveContainer>
          </div>

          <div className="grid grid-cols-3 gap-4 mt-6 pt-6 border-t border-white/5 text-center">
            <div className="bg-slate-950/50 p-3 rounded-2xl border border-white/5">
              <span className="text-[10px] text-slate-500 font-bold uppercase block">Öğrenci Sayısı</span>
              <span className="text-lg font-black text-indigo-400 mt-0.5 block">{stats.totalStudents}</span>
            </div>
            <div className="bg-slate-950/50 p-3 rounded-2xl border border-white/5">
              <span className="text-[10px] text-slate-500 font-bold uppercase block">Koç Sayısı</span>
              <span className="text-lg font-black text-amber-400 mt-0.5 block">{stats.totalCoaches}</span>
            </div>
            <div className="bg-slate-950/50 p-3 rounded-2xl border border-white/5">
              <span className="text-[10px] text-slate-500 font-bold uppercase block">Veli Sayısı</span>
              <span className="text-lg font-black text-purple-400 mt-0.5 block">{stats.totalParents}</span>
            </div>
          </div>
        </div>

        {/* Pending Approvals & Quick Action Panel */}
        <div className="space-y-6">
          {/* Pending Coach Approvals Widget */}
          <div className="bg-slate-900/60 border border-white/10 rounded-3xl p-6 shadow-xl">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-bold text-white flex items-center gap-2 uppercase tracking-wide">
                <UserCheck size={18} className="text-amber-400" /> Bekleyen Koç Başvuruları
              </h3>
              {stats.pendingCoaches > 0 && (
                <span className="bg-amber-500/20 text-amber-300 text-[10px] font-black px-2.5 py-0.5 rounded-full border border-amber-500/30">
                  {stats.pendingCoaches} Bekliyor
                </span>
              )}
            </div>

            {pendingCoachList.length > 0 ? (
              <div className="space-y-3">
                {pendingCoachList.map((coach) => (
                  <div key={coach.id} className="bg-slate-950/70 border border-white/5 p-3.5 rounded-2xl flex items-center justify-between gap-3">
                    <div className="min-w-0">
                      <h4 className="text-xs font-bold text-white truncate">
                        {coach.firstName ? `${coach.firstName} ${coach.lastName || ''}` : coach.email}
                      </h4>
                      <p className="text-[11px] text-slate-400 truncate mt-0.5">
                        {coach.branch || coach.expertise || 'Eğitim Koçu'}
                      </p>
                    </div>
                    <button
                      onClick={() => handleQuickApproveCoach(coach.id)}
                      disabled={approvingId === coach.id}
                      className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold transition-all shrink-0 cursor-pointer disabled:opacity-50 flex items-center gap-1 shadow-md shadow-emerald-600/20"
                    >
                      {approvingId === coach.id ? (
                        <RefreshCw size={12} className="animate-spin" />
                      ) : (
                        <CheckCircle size={12} />
                      )}
                      <span>Onayla</span>
                    </button>
                  </div>
                ))}
                <Link
                  to="koc-onaylari"
                  className="block text-center text-xs font-bold text-amber-400 hover:text-amber-300 pt-2 transition-colors"
                >
                  Tüm Başvuruları İncele ({stats.pendingCoaches}) &rarr;
                </Link>
              </div>
            ) : (
              <div className="text-center py-6 bg-slate-950/40 rounded-2xl border border-dashed border-white/5">
                <CheckCircle2 size={32} className="mx-auto text-emerald-400 mb-2 opacity-80" />
                <p className="text-xs font-bold text-slate-300">Onay Bekleyen Koç Yok</p>
                <p className="text-[11px] text-slate-500 mt-0.5">Tüm başvurular değerlendirildi.</p>
              </div>
            )}
          </div>

          {/* System Health Indicators Widget */}
          <div className="bg-slate-900/60 border border-white/10 rounded-3xl p-6 shadow-xl">
            <h3 className="text-sm font-bold text-white mb-4 flex items-center gap-2 uppercase tracking-wide">
              <Activity size={18} className="text-emerald-400" /> Sistem Sağlık Teşhisi
            </h3>
            
            <div className="space-y-3">
              <div className="flex items-center justify-between p-3 rounded-2xl bg-slate-950/60 border border-white/5">
                <div className="flex items-center gap-2.5 text-xs text-slate-300 font-medium">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.8)]" />
                  <span>Firestore Veritabanı</span>
                </div>
                <span className="text-[10px] font-black uppercase tracking-wider text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-md">
                  Aktif
                </span>
              </div>

              <div className="flex items-center justify-between p-3 rounded-2xl bg-slate-950/60 border border-white/5">
                <div className="flex items-center gap-2.5 text-xs text-slate-300 font-medium">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.8)]" />
                  <span>WhatsApp Twilio Webhook</span>
                </div>
                <span className="text-[10px] font-black uppercase tracking-wider text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-md">
                  Bağlı
                </span>
              </div>

              <div className="flex items-center justify-between p-3 rounded-2xl bg-slate-950/60 border border-white/5">
                <div className="flex items-center gap-2.5 text-xs text-slate-300 font-medium">
                  <span className="w-2.5 h-2.5 rounded-full bg-blue-400 shadow-[0_0_8px_rgba(96,165,250,0.8)]" />
                  <span>PayTR Ödeme Entegrasyonu</span>
                </div>
                <span className="text-[10px] font-black uppercase tracking-wider text-blue-400 bg-blue-500/10 px-2 py-0.5 rounded-md">
                  Hazır
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Recent Activity Stream */}
      <div className="bg-slate-900/60 border border-white/10 rounded-3xl p-6 md:p-8 shadow-xl">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="text-base font-bold text-white flex items-center gap-2 uppercase tracking-wide">
              <Clock size={18} className="text-blue-400" /> Son Kayıtlar ve Sistem İşlemleri
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">Sisteme en son katılan kullanıcılar</p>
          </div>
          <Link 
            to="kullanicilar"
            className="text-xs font-bold text-indigo-400 hover:text-indigo-300 transition-colors flex items-center gap-1"
          >
            <span>Tüm Kullanıcıları Gör</span>
            <ChevronRight size={14} />
          </Link>
        </div>

        {recentActivities.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {recentActivities.map((act) => (
              <div 
                key={act.id} 
                className="bg-slate-950/70 border border-white/5 p-4 rounded-2xl flex items-center gap-3.5 hover:border-white/10 transition-all"
              >
                <div className={`p-3 rounded-2xl border shrink-0 ${act.color}`}>
                  <act.icon size={20} />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between gap-2">
                    <h4 className="text-xs font-bold text-white truncate">{act.user}</h4>
                    <span className="text-[10px] text-slate-500 font-medium shrink-0">{act.time}</span>
                  </div>
                  <p className="text-[11px] text-slate-400 truncate mt-0.5">{act.action}</p>
                  {act.email && (
                    <p className="text-[10px] text-slate-600 truncate mt-0.5">{act.email}</p>
                  )}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-slate-500 text-xs italic text-center py-8 bg-slate-950/30 rounded-2xl border border-dashed border-white/5">
            Henüz görüntülenecek son bir kayıt bulunmuyor.
          </div>
        )}
      </div>
    </div>
  );
}
