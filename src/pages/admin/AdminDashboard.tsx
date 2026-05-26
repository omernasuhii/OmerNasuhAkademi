import React, { useEffect, useState } from 'react';
import { 
  Users, 
  GraduationCap, 
  Briefcase, 
  CheckCircle, 
  TrendingUp, 
  ArrowUpRight, 
  ArrowDownRight,
  Clock
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
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '../../lib/firebase';

const data = [
  { name: 'Ocak', users: 400, coaches: 24 },
  { name: 'Şubat', users: 700, coaches: 45 },
  { name: 'Mart', users: 1200, coaches: 68 },
  { name: 'Nisan', users: 1540, coaches: 92 },
];

export default function AdminDashboard() {
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalStudents: 0,
    totalCoaches: 0,
    pendingCoaches: 0
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchStats() {
      try {
        const usersSnap = await getDocs(collection(db, 'users'));
        const allUsers = usersSnap.docs.map(doc => doc.data());
        
        setStats({
          totalUsers: allUsers.length,
          totalStudents: allUsers.filter(u => u.role === 'student').length,
          totalCoaches: allUsers.filter(u => u.role === 'coach').length,
          pendingCoaches: 2 // Static for now
        });
      } catch (err) {
        console.error("Stats fetch error:", err);
      } finally {
        setLoading(false);
      }
    }
    fetchStats();
  }, []);

  const statCards = [
    { label: 'Toplam Kullanıcı', value: stats.totalUsers, icon: Users, color: 'text-blue-400', trend: '+12%', up: true },
    { label: 'Aktif Öğrenciler', value: stats.totalStudents, icon: GraduationCap, color: 'text-indigo-400', trend: '+18%', up: true },
    { label: 'Eğitmen Koçlar', value: stats.totalCoaches, icon: Briefcase, color: 'text-emerald-400', trend: '+5%', up: true },
    { label: 'Bekleyen Onaylar', value: stats.pendingCoaches, icon: Clock, color: 'text-amber-400', trend: '-2%', up: false },
  ];

  return (
    <div className="space-y-8 animate-in fade-in duration-700">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-black text-white tracking-tight uppercase">Yönetim Özeti</h2>
          <p className="text-slate-500 text-sm mt-1 font-medium italic">Akademi genelindeki son durum ve veriler.</p>
        </div>
        <button className="bg-slate-900 border border-white/10 text-white px-5 py-2.5 rounded-xl text-sm font-bold hover:bg-slate-800 transition-all flex items-center gap-2">
           Raporu İndir
        </button>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {statCards.map((stat) => (
          <div key={stat.label} className="bg-slate-900/50 border border-white/5 p-6 rounded-3xl group hover:border-white/10 transition-all">
            <div className="flex justify-between items-start mb-4">
              <div className={`p-3 rounded-2xl bg-white/5 ${stat.color} group-hover:scale-110 transition-transform`}>
                <stat.icon size={24} />
              </div>
              <div className={`flex items-center gap-1 text-[10px] font-black px-2 py-1 rounded-full ${stat.up ? 'bg-emerald-500/10 text-emerald-500' : 'bg-red-500/10 text-red-500'}`}>
                {stat.up ? <ArrowUpRight size={12} /> : <ArrowDownRight size={12} />}
                {stat.trend}
              </div>
            </div>
            <p className="text-slate-500 text-xs font-bold uppercase tracking-widest">{stat.label}</p>
            <h3 className="text-3xl font-black text-white mt-1 tabular-nums">
              {loading ? '...' : stat.value}
            </h3>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Chart Column */}
        <div className="lg:col-span-2 bg-slate-900/40 border border-white/5 rounded-3xl p-8">
          <div className="flex items-center justify-between mb-8">
             <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <TrendingUp size={20} className="text-red-500" /> Büyüme Analizi
             </h3>
             <select className="bg-slate-950 border border-white/10 text-slate-400 text-xs font-bold rounded-lg px-3 py-1.5 focus:outline-none focus:ring-1 focus:ring-red-500">
                <option>Son 6 Ay</option>
                <option>Son 1 Yıl</option>
             </select>
          </div>
          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={data}>
                <defs>
                  <linearGradient id="colorUsers" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#ef4444" stopOpacity={0.1}/>
                    <stop offset="95%" stopColor="#ef4444" stopOpacity={0}/>
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
                  stroke="#ef4444" 
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
              {[
                { user: 'Ahmet Y.', action: 'Yeni Kayıt', time: '5 dk önce', icon: Users, color: 'text-blue-400' },
                { user: 'Zeynep K.', action: 'Koç Başvurusu', time: '12 dk önce', icon: Briefcase, color: 'text-emerald-400' },
                { user: 'Sistem', action: 'Yedekleme Tamam', time: '1 saat önce', icon: CheckCircle, color: 'text-amber-400' },
                { user: 'Can D.', action: 'Profil Güncellendi', time: '2 saat önce', icon: Users, color: 'text-slate-400' },
              ].map((activity, i) => (
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
              ))}
           </div>
           <button className="w-full mt-6 py-3 bg-slate-950 border border-white/5 rounded-xl text-[10px] font-black uppercase text-slate-500 hover:text-white hover:border-white/20 transition-all">
              Tüm Günlüğü Gör
           </button>
        </div>
      </div>
    </div>
  );
}
