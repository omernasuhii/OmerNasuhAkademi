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
  EyeOff
} from 'lucide-react';
import { 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer 
} from 'recharts';
import { collection, query, where, getDocs, orderBy, limit } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { NotificationPrompt } from '../../components/NotificationPrompt';
import { Link } from 'react-router-dom';

export default function AdminDashboard() {
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalStudents: 0,
    totalCoaches: 0,
    pendingCoaches: 0,
    usersTrend: 0,
    studentsTrend: 0,
    coachesTrend: 0,
    activeCoupons: 0,
    totalRevenue: 0,
    revenueTrend: 0,
    unreadMessages: 0
  });
  const [chartData, setChartData] = useState<any[]>([]);
  const [recentActivities, setRecentActivities] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showRevenue, setShowRevenue] = useState(false);

  useEffect(() => {
    async function fetchStats() {
      try {
        // Users stats
        const usersSnap = await getDocs(collection(db, 'users'));
        const allUsers = usersSnap.docs.map(doc => doc.data());
        
        let pendingC = 0;
        let tUsers = allUsers.length;
        let tStudents = 0;
        let tCoaches = 0;

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
          if (u.role === 'coach') {
             tCoaches++;
             if (u.approved === false) pendingC++;
          }

          let createdAt = null;
          if (u.createdAt) {
             createdAt = u.createdAt.toDate ? u.createdAt.toDate() : new Date(u.createdAt);
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

        // Revenue Stats
        let revTotal = 0;
        let revThisMonth = 0;
        let revLastMonth = 0;
        try {
          const transSnap = await getDocs(query(collection(db, 'wallet_transactions'), where('type', '==', 'DEPOSIT')));
          transSnap.forEach(t => {
            const data = t.data();
            const amount = Number(data.amount) || 0;
            revTotal += amount;
            
            let tDate = null;
            if (data.createdAt) {
               tDate = data.createdAt.toDate ? data.createdAt.toDate() : new Date(data.createdAt);
            }
            if (tDate) {
               if (tDate >= thisMonthStart) revThisMonth += amount;
               else if (tDate >= lastMonthStart && tDate < thisMonthStart) revLastMonth += amount;
            }
          });
        } catch(e) {}

        // Coupons Stats
        let couponsActive = 0;
        try {
           const couponSnap = await getDocs(collection(db, 'coupons'));
           couponSnap.forEach(c => {
              if (c.data().status === 'active') couponsActive++;
           });
        } catch(e) {}

        // Messages Stats
        let unread = 0;
        try {
           const mailSnap = await getDocs(query(collection(db, 'inbox_messages'), where('status', '==', 'new')));
           unread = mailSnap.docs.length;
        } catch(e) {}

        const calcTrend = (thisM: number, lastM: number) => {
           if (lastM === 0) return thisM > 0 ? 100 : 0;
           return Math.round(((thisM - lastM) / lastM) * 100);
        };

        setStats({
          totalUsers: tUsers,
          totalStudents: tStudents,
          totalCoaches: tCoaches,
          pendingCoaches: pendingC,
          usersTrend: calcTrend(usersThisMonth, usersLastMonth),
          studentsTrend: calcTrend(studentsThisMonth, studentsLastMonth),
          coachesTrend: calcTrend(coachesThisMonth, coachesLastMonth),
          activeCoupons: couponsActive,
          totalRevenue: revTotal,
          revenueTrend: calcTrend(revThisMonth, revLastMonth),
          unreadMessages: unread
        });

        // Chart Data (Last 6 Months accumulated)
        const months = [];
        for(let i=5; i>=0; i--) {
           const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
           months.push({
              year: d.getFullYear(),
              month: d.getMonth(),
              name: d.toLocaleString('tr-TR', { month: 'short' }) + " '" + d.getFullYear().toString().substring(2),
              usersNew: 0,
              coachesNew: 0
           });
        }

        let baseUsers = 0;

        allUsers.forEach(u => {
            let createdAt = null;
            if (u.createdAt) {
              createdAt = u.createdAt.toDate ? u.createdAt.toDate() : new Date(u.createdAt);
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

        // Recent users
        const sortedUsers = allUsers
            .filter(u => u.createdAt)
            .sort((a, b) => {
               const da = a.createdAt.toDate ? a.createdAt.toDate() : new Date(a.createdAt);
               const db = b.createdAt.toDate ? b.createdAt.toDate() : new Date(b.createdAt);
               return db.getTime() - da.getTime();
            })
            .slice(0, 5);

        const activities = sortedUsers.map(u => {
            const d = u.createdAt.toDate ? u.createdAt.toDate() : new Date(u.createdAt);
            const nowTime = new Date().getTime();
            const diffMin = Math.round((nowTime - d.getTime()) / 60000);
            
            let timeStr = '';
            if (diffMin < 60) timeStr = `${diffMin} dk önce`;
            else if (diffMin < 1440) timeStr = `${Math.floor(diffMin/60)} saat önce`;
            else timeStr = `${Math.floor(diffMin/1440)} gün önce`;

            return {
               user: `${u.firstName || ''} ${u.lastName || ''}`.trim() || 'İsimsiz Kullanıcı',
               action: u.role === 'coach' ? (u.approved ? 'Yeni Koç Kaydı' : 'Koç Başvurusu') : 'Yeni Öğrenci Kaydı',
               time: timeStr,
               icon: u.role === 'coach' ? Briefcase : Users,
               color: u.role === 'coach' ? 'text-emerald-400' : 'text-blue-400'
            }
        });

        setRecentActivities(activities);

      } catch (err) {
        console.error("Stats fetch error:", err);
      } finally {
        setLoading(false);
      }
    }
    fetchStats();
  }, []);

  const statCards = [
    { label: 'Platform Geliri', value: `₺${stats.totalRevenue.toLocaleString('tr-TR')}`, icon: DollarSign, color: 'text-emerald-400', trend: `${stats.revenueTrend > 0 ? '+' : ''}${stats.revenueTrend}%`, up: stats.revenueTrend >= 0 },
    { label: 'Aktif Öğrenciler', value: stats.totalStudents, icon: GraduationCap, color: 'text-indigo-400', trend: `${stats.studentsTrend > 0 ? '+' : ''}${stats.studentsTrend}%`, up: stats.studentsTrend >= 0 },
    { label: 'Eğitmen Koçlar', value: stats.totalCoaches, icon: Briefcase, color: 'text-amber-400', trend: `${stats.coachesTrend > 0 ? '+' : ''}${stats.coachesTrend}%`, up: stats.coachesTrend >= 0 },
    { label: 'Aktif Kuponlar', value: stats.activeCoupons, icon: Ticket, color: 'text-fuchsia-400', trend: 'Sabit', up: true },
  ];

  const quickLinks = [
    { label: 'Gelen Kutusu', path: 'gelen-kutusu', icon: Inbox, color: 'bg-blue-500/10 text-blue-500', hoverColor: 'hover:bg-blue-500 hover:text-white', badge: stats.unreadMessages },
    { label: 'Koç Onayları', path: 'koc-onaylari', icon: UserCheck, color: 'bg-amber-500/10 text-amber-500', hoverColor: 'hover:bg-amber-500 hover:text-white', badge: stats.pendingCoaches },
    { label: 'Takvim', path: 'randevular', icon: Calendar, color: 'bg-emerald-500/10 text-emerald-500', hoverColor: 'hover:bg-emerald-500 hover:text-white' },
    { label: 'Mali Durum', path: 'mali-durum', icon: DollarSign, color: 'bg-indigo-500/10 text-indigo-500', hoverColor: 'hover:bg-indigo-500 hover:text-white' },
    { label: 'Kullanıcılar', path: 'kullanicilar', icon: Users, color: 'bg-red-500/10 text-red-500', hoverColor: 'hover:bg-red-500 hover:text-white' },
    { label: 'CMS', path: 'cms', icon: Globe, color: 'bg-fuchsia-500/10 text-fuchsia-500', hoverColor: 'hover:bg-fuchsia-500 hover:text-white' },
  ];

  return (
    <div className="space-y-8 animate-in fade-in duration-700">
      <NotificationPrompt />
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-black text-white tracking-tight uppercase">Yönetici Paneli</h2>
          <p className="text-slate-500 text-sm mt-1 font-medium italic">Akademi genelindeki finansal durum ve sistem verileri.</p>
        </div>
        <button className="bg-slate-900 border border-white/10 text-white px-5 py-2.5 rounded-xl text-sm font-bold hover:bg-slate-800 transition-all flex items-center gap-2">
           Raporu İndir
        </button>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {statCards.map((stat) => (
          <div key={stat.label} className="bg-slate-900/50 border border-white/5 p-6 rounded-3xl group hover:border-white/10 transition-all relative overflow-hidden">
            <div className={`absolute top-0 right-0 w-32 h-32 opacity-10 rounded-full blur-3xl -mr-10 -mt-10 bg-current ${stat.color}`}></div>
            <div className="flex justify-between items-start mb-4 relative">
              <div className={`p-3 rounded-2xl bg-white/5 ${stat.color} group-hover:scale-110 transition-transform`}>
                <stat.icon size={24} />
              </div>
              {stat.trend !== 'Sabit' && (
                <div className={`flex items-center gap-1 text-[10px] font-black px-2 py-1 rounded-full ${stat.up ? 'bg-emerald-500/10 text-emerald-500' : 'bg-red-500/10 text-red-500'}`}>
                  {stat.up ? <ArrowUpRight size={12} /> : <ArrowDownRight size={12} />}
                  {stat.trend}
                </div>
              )}
            </div>
            <p className="text-slate-500 text-xs font-bold uppercase tracking-widest relative">{stat.label}</p>
            <div className="flex items-center justify-between mt-1 relative">
              <h3 className="text-3xl font-black text-white tabular-nums">
                {loading ? '...' : (stat.label === 'Platform Geliri' && !showRevenue ? '₺***,***.**' : stat.value)}
              </h3>
              {stat.label === 'Platform Geliri' && (
                <button
                  onClick={() => setShowRevenue(!showRevenue)}
                  className="p-1.5 rounded-xl bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white transition-all cursor-pointer flex items-center justify-center"
                  title={showRevenue ? "Gizle" : "Göster"}
                >
                  {showRevenue ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Quick Action Bento Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-6 gap-4">
         {quickLinks.map((link) => (
            <Link 
              key={link.path}
              to={link.path}
              className={`flex flex-col items-center justify-center gap-3 p-6 rounded-3xl border border-white/5 bg-slate-900/30 transition-all duration-300 group ${link.hoverColor}`}
            >
              <div className={`p-4 rounded-2xl transition-colors ${link.color} group-hover:bg-white/20 group-hover:text-white relative`}>
                 <link.icon size={28} />
                 {link.badge !== undefined && link.badge > 0 && (
                   <span className="absolute -top-2 -right-2 bg-red-500 text-white text-[10px] font-black w-6 h-6 flex items-center justify-center rounded-full shadow-[0_0_10px_rgba(239,68,68,0.5)]">
                      {link.badge}
                   </span>
                 )}
              </div>
              <span className="text-xs font-bold uppercase tracking-tight text-slate-300 group-hover:text-white">{link.label}</span>
            </Link>
         ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Chart Column */}
        <div className="lg:col-span-2 bg-slate-900/40 border border-white/5 rounded-3xl p-8">
          <div className="flex items-center justify-between mb-8">
             <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <TrendingUp size={20} className="text-blue-500" /> Kullanıcı Büyüme Analizi
             </h3>
             <select className="bg-slate-950 border border-white/10 text-slate-400 text-xs font-bold rounded-lg px-3 py-1.5 focus:outline-none focus:ring-1 focus:ring-blue-500">
                <option>Son 6 Ay</option>
                <option>Son 1 Yıl</option>
             </select>
          </div>
          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData}>
                <defs>
                  <linearGradient id="colorUsers" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.2}/>
                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#ffffff05" vertical={false} />
                <XAxis 
                  dataKey="name" 
                  stroke="#475569" 
                  fontSize={10} 
                  fontWeight="bold" 
                  axisLine={false} 
                  tickLine={false}
                  dy={10}
                />
                <YAxis 
                  stroke="#475569" 
                  fontSize={10} 
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
                  itemStyle={{ color: '#fff' }}
                />
                <Area 
                  type="monotone" 
                  dataKey="users" 
                  stroke="#3b82f6" 
                  strokeWidth={3}
                  fillOpacity={1} 
                  fill="url(#colorUsers)" 
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Recent Activity */}
        <div className="bg-slate-900/40 border border-white/5 rounded-3xl p-8">
           <h3 className="text-lg font-bold text-white mb-6">Son İşlemler</h3>
           <div className="space-y-6">
              {recentActivities.length > 0 ? recentActivities.map((activity, i) => (
                <div key={i} className="flex gap-4 group">
                   <div className={`w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center shrink-0 ${activity.color}`}>
                      <activity.icon size={18} />
                   </div>
                   <div className="flex-1 border-b border-white/5 pb-4 last:border-0 group-hover:translate-x-1 transition-transform">
                      <div className="flex justify-between items-start">
                         <h4 className="text-xs font-bold text-white uppercase tracking-tight">{activity.user}</h4>
                         <span className="text-[10px] text-slate-500 font-medium tabular-nums">{activity.time}</span>
                      </div>
                      <p className="text-[11px] text-slate-400 mt-0.5">{activity.action}</p>
                   </div>
                </div>
              )) : (
                <div className="text-slate-500 text-sm italic">Henüz bir işlem yok.</div>
              )}
           </div>
           <button className="w-full mt-6 py-3 bg-slate-950 border border-white/5 rounded-xl text-[10px] font-black uppercase text-slate-500 hover:text-white hover:border-white/20 transition-all">
              Tüm İşlemleri Gör
           </button>
        </div>
      </div>
    </div>
  );
}

