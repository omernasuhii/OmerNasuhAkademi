import { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { 
  BookOpen, 
  Target, 
  CheckCircle2,
  Zap,
  Flame,
  Crown,
  Wallet,
  Activity,
  TrendingUp,
  CalendarDays
} from 'lucide-react';
import { useAuth } from '../../lib/AuthContext';
import { studentDataService } from '../../services/studentDataService';
import { Link } from 'react-router-dom';

export default function Summary() {
  const { userData } = useAuth();
  const [books, setBooks] = useState<any[]>([]);
  const [exams, setExams] = useState<any[]>([]);
  const [dailyTasks, setDailyTasks] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      if (userData?.uid) {
        setLoading(true);
        const today = new Date().toISOString().split('T')[0];
        
        const [booksRes, examsRes, dailyRes] = await Promise.all([
          studentDataService.getBookTracking(userData.uid),
          studentDataService.getExamResults(userData.uid),
          studentDataService.getDailyPrograms(userData.uid, [today])
        ]);
        
        setBooks(booksRes || []);
        setExams(examsRes || []);
        setDailyTasks(dailyRes[0]?.tasks || []);
        setLoading(false);
      }
    }
    loadData();
  }, [userData]);

  if (loading) {
    return (
      <div className="flex items-center justify-center p-12 w-full h-64">
        <div className="w-10 h-10 border-4 border-indigo-500/20 border-t-indigo-500 rounded-full animate-spin"></div>
      </div>
    );
  }

  // Calculate some real stats from the available data
  const totalBooks = books.length;
  const completedBooks = books.filter(b => b.completionPercentage === 100).length;
  const totalExams = exams.length;
  const examAvg = exams.length > 0 
    ? (exams.reduce((acc, curr) => acc + (curr.totalNet || 0), 0) / exams.length).toFixed(1) 
    : '0';
  
  const dailyTotalTasks = dailyTasks.length;
  const dailyCompletedTasks = dailyTasks.filter(t => t.isCompleted).length;

  // Calculate subscription remaining days
  const calculateSubscriptionDays = () => {
    if (!userData?.subscriptionStartDate || !userData?.subscriptionEndDate) return { remaining: 0, total: 0, percentage: 0 };
    const start = new Date(userData.subscriptionStartDate).getTime();
    const end = new Date(userData.subscriptionEndDate).getTime();
    const now = new Date().getTime();
    
    const totalDays = Math.max(1, Math.ceil((end - start) / (1000 * 60 * 60 * 24)));
    const remainingDays = Math.max(0, Math.ceil((end - now) / (1000 * 60 * 60 * 24)));
    const usedDays = totalDays - remainingDays;
    const percentage = Math.round((usedDays / totalDays) * 100);
    
    return { remaining: remainingDays, total: totalDays, percentage: percentage > 100 ? 100 : percentage < 0 ? 0 : percentage };
  };

  const subStats = calculateSubscriptionDays();

  return (
    <div className="w-full max-w-7xl mx-auto space-y-8">
      {/* Dynamic Header */}
      <motion.header 
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-slate-900 border border-white/5 rounded-3xl p-6 md:p-8 space-y-8"
      >
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl md:text-3xl font-black text-white uppercase flex items-center gap-2">
              MERHABA, {userData?.firstName?.toUpperCase() || 'ÖĞRENCİ'}! <span className="text-2xl">👋</span>
            </h1>
            <p className="text-slate-400 mt-2 font-medium">
              Öğrenci Paneline hoş geldin. Bugün hedeflerine bir adım daha yaklaşmak için harika bir gün.
            </p>
          </div>
        </div>

        {/* 4 Cards for Hedef, Bakiye, XP, Seri */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Hedef */}
          <div className="bg-indigo-500/10 border border-indigo-500/20 p-4 rounded-2xl flex items-center gap-4 hover:bg-indigo-500/20 transition-colors">
            <div className="w-12 h-12 rounded-xl bg-indigo-500/20 flex items-center justify-center shrink-0">
              <Target className="text-indigo-400" size={24} />
            </div>
            <div className="overflow-hidden">
              <p className="text-[10px] font-black text-indigo-400 uppercase tracking-widest mb-0.5">Hedef Bölüm</p>
              <p className="text-sm font-bold text-white uppercase truncate" title={userData?.targetDepartment || 'BELİRTİLMEDİ'}>
                {userData?.targetDepartment || 'BELİRTİLMEDİ'}
              </p>
            </div>
          </div>
          {/* Bakiye */}
          <div className="bg-emerald-500/10 border border-emerald-500/20 p-4 rounded-2xl flex items-center gap-4 hover:bg-emerald-500/20 transition-colors">
            <div className="w-12 h-12 rounded-xl bg-emerald-500/20 flex items-center justify-center shrink-0">
              <Wallet className="text-emerald-400" size={24} />
            </div>
            <div>
              <p className="text-[10px] font-black text-emerald-400 uppercase tracking-widest mb-0.5">Bakiye</p>
              <p className="text-sm font-bold text-white uppercase">{(userData?.walletBalance || 0).toLocaleString('tr-TR')} <span className="text-emerald-400 text-[10px]">TL</span></p>
            </div>
          </div>
          {/* XP */}
          <div className="bg-blue-500/10 border border-blue-500/20 p-4 rounded-2xl flex items-center gap-4 hover:bg-blue-500/20 transition-colors">
            <div className="w-12 h-12 rounded-xl bg-blue-500/20 flex items-center justify-center shrink-0">
              <Zap className="text-blue-400" size={24} />
            </div>
            <div>
              <p className="text-[10px] font-black text-blue-400 uppercase tracking-widest mb-0.5">Kazanılan XP</p>
              <p className="text-sm font-bold text-white uppercase">{(userData?.xp || 0).toLocaleString('tr-TR')} <span className="text-blue-400 text-[10px]">XP</span></p>
            </div>
          </div>
          {/* Seri */}
          <div className="bg-amber-500/10 border border-amber-500/20 p-4 rounded-2xl flex items-center gap-4 hover:bg-amber-500/20 transition-colors">
            <div className="w-12 h-12 rounded-xl bg-amber-500/20 flex items-center justify-center shrink-0">
              <Flame className="text-amber-400" size={24} />
            </div>
            <div>
              <p className="text-[10px] font-black text-amber-400 uppercase tracking-widest mb-0.5">Aktif Seri</p>
              <p className="text-sm font-bold text-white uppercase">{userData?.streak || 0} <span className="text-amber-400 text-[10px]">GÜN</span></p>
            </div>
          </div>
        </div>

        {/* Abonelik Durumu & Çubuk */}
        {userData?.subscriptionPlan ? (
          <div className="bg-gradient-to-r from-yellow-500/10 via-amber-500/5 to-transparent border border-yellow-500/20 p-5 md:p-6 rounded-2xl mt-4">
            <div className="flex flex-col md:flex-row md:items-center justify-between mb-4 gap-4">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-full bg-yellow-500/20 flex items-center justify-center border border-yellow-500/30 shrink-0">
                  <Crown className="text-yellow-400" size={24} />
                </div>
                <div>
                  <h3 className="text-white font-bold text-base flex items-center gap-2 mb-1">
                    {userData.subscriptionPlan} Abonelik 
                    <span className="px-2 py-0.5 rounded-md bg-yellow-500/20 text-yellow-400 text-[10px] uppercase tracking-widest font-black">
                      {subStats.remaining > 0 ? 'Aktif' : 'Süresi Doldu'}
                    </span>
                  </h3>
                  <p className="text-slate-400 text-xs">Sana özel eğitim imkanlarından faydalanmaya devam ediyorsun.</p>
                </div>
              </div>
              <div className="text-left md:text-right">
                <p className="text-3xl font-black text-yellow-400">{subStats.remaining}<span className="text-sm font-bold text-yellow-500/70 ml-1">GÜN KALDI</span></p>
              </div>
            </div>
            <div className="w-full h-2.5 bg-slate-800 rounded-full overflow-hidden shadow-inner">
              <div className="h-full bg-gradient-to-r from-yellow-500 to-amber-500 rounded-full relative transition-all duration-1000" style={{ width: `${subStats.percentage}%` }}>
                <div className="absolute inset-0 bg-white/20 w-full h-full" style={{ backgroundImage: 'linear-gradient(45deg,rgba(255,255,255,.15) 25%,transparent 25%,transparent 50%,rgba(255,255,255,.15) 50%,rgba(255,255,255,.15) 75%,transparent 75%,transparent)', backgroundSize: '1rem 1rem' }}></div>
              </div>
            </div>
            <div className="flex justify-between mt-3 text-[10px] font-bold text-slate-500 uppercase tracking-widest">
              <span>Kullanılan %{subStats.percentage}</span>
              <span className="text-slate-400">Toplam: {subStats.total} Gün</span>
            </div>
          </div>
        ) : null}
      </motion.header>

      {/* Akademik Durum Section */}
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
        <div className="flex items-center justify-between mb-6 px-2">
          <div className="flex items-center gap-3">
            <Activity className="text-indigo-400" size={24} />
            <h2 className="text-xl font-bold text-white uppercase tracking-tight">Akademik Durum</h2>
          </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
          
          {/* Net Gelişimi Chart */}
          <div className="bg-slate-900 border border-white/5 rounded-3xl p-6 md:col-span-12 lg:col-span-8 flex flex-col relative overflow-hidden">
            <div className="absolute top-0 right-0 w-64 h-64 bg-rose-500/5 blur-[80px] pointer-events-none rounded-full"></div>
            
            <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-8 relative z-10 gap-4">
              <div>
                <h3 className="text-base font-bold text-white uppercase tracking-tight flex items-center gap-2">
                  <TrendingUp size={18} className="text-rose-400" /> Net Gelişimi
                </h3>
                <p className="text-xs text-slate-400 mt-1">Son denemelerindeki genel performans grafiği</p>
              </div>
              <div className="flex items-center gap-4 text-right">
                <div>
                  <span className="text-2xl font-black text-rose-400">{examAvg}</span>
                  <span className="text-[10px] text-slate-500 font-bold ml-1 uppercase block text-left">Ort. Net</span>
                </div>
                <Link to="/panel/ogrenci/denemeler" className="hidden sm:block text-[10px] font-bold bg-white/5 hover:bg-white/10 px-3 py-1.5 rounded-lg text-white uppercase tracking-widest transition-colors border border-white/5">
                  Tümü
                </Link>
              </div>
            </div>

            <div className="flex-1 flex items-end gap-2 sm:gap-4 h-48 sm:h-56 mt-4 relative z-10">
              <div className="absolute inset-0 flex flex-col justify-between pointer-events-none pb-6">
                {[120, 90, 60, 30, 0].map(val => (
                  <div key={val} className="w-full flex items-center opacity-30">
                    <span className="text-[8px] font-mono text-slate-400 w-6">{val}</span>
                    <div className="flex-1 border-b border-dashed border-white/10"></div>
                  </div>
                ))}
              </div>

              <div className="flex-1 flex items-end gap-2 sm:gap-4 h-full relative z-10 pl-8 pb-6 group">
                {exams.length > 0 ? (
                  [...exams]
                    .sort((a,b) => new Date(a.date || 0).getTime() - new Date(b.date || 0).getTime())
                    .slice(-8)
                    .map((exam, idx) => {
                      const net = Number(exam.totalNet || 0);
                      const height = Math.max(5, Math.min(100, (net / 120) * 100));
                      return (
                        <div key={idx} className="flex-1 flex flex-col items-center justify-end h-full relative cursor-pointer">
                          <div className="opacity-0 group-hover:opacity-100 transition-opacity absolute -top-8 bg-slate-800 border border-white/10 px-2 py-1 rounded-lg text-center z-20 pointer-events-none shadow-xl">
                            <p className="text-[10px] font-black text-white whitespace-nowrap">{net} Net</p>
                            <p className="text-[8px] font-medium text-slate-400 whitespace-nowrap truncate max-w-[80px]">{exam.title || 'Deneme'}</p>
                          </div>
                          <div 
                            className="w-full bg-gradient-to-t from-rose-500/20 to-rose-400/40 hover:to-rose-400/60 border-t-2 border-rose-400 rounded-t-md transition-all duration-300 relative group-hover:shadow-[0_0_15px_rgba(244,63,94,0.3)]"
                            style={{ height: `${height}%` }}
                          ></div>
                          <span className="absolute -bottom-6 text-[9px] font-bold text-slate-500 uppercase truncate w-full text-center">
                            {exam.date ? new Date(exam.date).toLocaleDateString('tr-TR', {day: 'numeric', month: 'short'}) : 'Tarih Yok'}
                          </span>
                        </div>
                      )
                    })
                ) : (
                  <div className="w-full h-full flex flex-col items-center justify-center border-2 border-dashed border-white/5 rounded-2xl bg-white/5">
                    <TrendingUp size={32} className="text-slate-600 mb-2" />
                    <p className="text-slate-400 text-sm">Grafik oluşturmak için deneme sonucu ekle.</p>
                  </div>
                )}
              </div>
            </div>
            {exams.length > 0 && <p className="text-center text-[10px] text-slate-500 font-medium uppercase tracking-widest mt-6 sm:hidden">Son 8 Deneme</p>}
          </div>

          {/* Daily Tasks Panel */}
          <div className="bg-slate-900 border border-white/5 rounded-3xl p-6 md:col-span-12 lg:col-span-4 flex flex-col relative overflow-hidden">
            <div className="absolute top-0 right-0 w-48 h-48 bg-emerald-500/5 blur-[60px] pointer-events-none rounded-full"></div>
            
            <div className="flex items-center justify-between mb-6 relative z-10">
              <h3 className="text-base font-bold text-white uppercase tracking-tight flex items-center gap-2">
                <CalendarDays size={18} className="text-emerald-400" /> Bugünün Görevleri
              </h3>
              <span className="text-xs font-bold px-2 py-1 bg-emerald-500/10 text-emerald-400 rounded-lg">{dailyCompletedTasks} / {dailyTotalTasks}</span>
            </div>

            <div className="space-y-3 flex-1 overflow-y-auto pr-1 relative z-10 min-h-[200px] max-h-[300px] custom-scrollbar">
              {dailyTasks.length > 0 ? (
                dailyTasks.map((task, idx) => (
                  <div key={idx} className="bg-white/5 border border-white/5 rounded-2xl p-4 flex items-center gap-4 hover:bg-white/10 transition-colors">
                    <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center shrink-0 ${task.isCompleted ? 'bg-emerald-500 border-emerald-500 text-white' : 'border-slate-600'}`}>
                      {task.isCompleted && <CheckCircle2 size={14} />}
                    </div>
                    <div className="overflow-hidden">
                      <h4 className="text-sm font-bold text-white truncate">{task.subject}</h4>
                      <p className="text-xs text-slate-400 truncate">{task.topic} - {task.targetCount || 0} {task.type === 'Soru Çözümü' ? 'Soru' : 'Dk'}</p>
                    </div>
                  </div>
                ))
              ) : (
                <div className="h-full flex flex-col justify-center text-center border-2 border-dashed border-white/5 rounded-2xl p-6 bg-white/5">
                  <CheckCircle2 size={32} className="text-slate-600 mx-auto mb-2" />
                  <p className="text-slate-400 text-sm">Bugün için görev bulunmuyor.</p>
                </div>
              )}
            </div>
          </div>

          {/* Book Progress Panel */}
          <div className="bg-slate-900 border border-white/5 rounded-3xl p-6 md:col-span-12 lg:col-span-6 flex flex-col relative overflow-hidden">
            <div className="absolute top-0 right-0 w-64 h-64 bg-blue-500/5 blur-[80px] pointer-events-none rounded-full"></div>
            
            <div className="flex items-center justify-between mb-6 relative z-10">
              <h3 className="text-base font-bold text-white uppercase tracking-tight flex items-center gap-2">
                <BookOpen size={18} className="text-blue-400" /> Kitap Takibi
              </h3>
              <span className="text-xs font-bold px-2 py-1 bg-blue-500/10 text-blue-400 rounded-lg">{completedBooks} Biten</span>
            </div>

            <div className="space-y-4 flex-1 relative z-10">
              {books.length > 0 ? (
                books.slice(0, 4).map((book, idx) => (
                  <div key={idx} className="group bg-white/5 border border-white/5 rounded-2xl p-4 hover:bg-white/10 transition-colors">
                    <div className="flex items-center justify-between mb-3">
                      <div className="overflow-hidden pr-4">
                        <span className="text-[10px] text-slate-400 uppercase tracking-widest block mb-0.5">{book.subject}</span>
                        <span className="text-sm font-bold text-white truncate block">{book.bookName}</span>
                      </div>
                      <span className="text-sm font-black text-blue-400 shrink-0">%{book.completionPercentage || 0}</span>
                    </div>
                    <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-gradient-to-r from-blue-500 to-indigo-400 rounded-full transition-all duration-1000 relative" 
                        style={{ width: `${book.completionPercentage || 0}%` }}
                      >
                        <div className="absolute inset-0 bg-white/20 w-full h-full" style={{ backgroundImage: 'linear-gradient(45deg,rgba(255,255,255,.15) 25%,transparent 25%,transparent 50%,rgba(255,255,255,.15) 50%,rgba(255,255,255,.15) 75%,transparent 75%,transparent)', backgroundSize: '1rem 1rem' }}></div>
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="h-full flex flex-col justify-center items-center text-center border-2 border-dashed border-white/5 rounded-2xl p-6 bg-white/5 min-h-[160px]">
                  <BookOpen size={32} className="text-slate-600 mb-2" />
                  <p className="text-slate-400 text-sm">Henüz kitap eklenmemiş.</p>
                </div>
              )}
            </div>
            {books.length > 4 && (
              <Link to="/panel/ogrenci/konu-takibi" className="mt-4 block text-center text-[10px] font-bold text-slate-400 hover:text-white uppercase tracking-widest transition-colors relative z-10 py-2 border border-white/5 rounded-xl bg-white/5 hover:bg-white/10">
                Tümünü Gör ({totalBooks})
              </Link>
            )}
          </div>

          {/* Genel İstatistikler */}
          <div className="bg-slate-900 border border-white/5 rounded-3xl p-6 md:col-span-12 lg:col-span-6 grid grid-cols-2 gap-4 relative overflow-hidden">
            <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-indigo-500/5 blur-[80px] pointer-events-none rounded-full"></div>
            
            <div className="bg-white/5 border border-white/5 rounded-2xl p-5 flex flex-col justify-center items-start hover:bg-white/10 transition-colors relative z-10 group">
              <div className="w-10 h-10 rounded-xl bg-blue-500/10 flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                <BookOpen size={18} className="text-blue-400" />
              </div>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Biten Kitap</p>
              <p className="text-2xl font-black text-white">{completedBooks}</p>
            </div>
            
            <div className="bg-white/5 border border-white/5 rounded-2xl p-5 flex flex-col justify-center items-start hover:bg-white/10 transition-colors relative z-10 group">
              <div className="w-10 h-10 rounded-xl bg-rose-500/10 flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                <Target size={18} className="text-rose-400" />
              </div>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Çözülen Deneme</p>
              <p className="text-2xl font-black text-white">{totalExams}</p>
            </div>
            
            <div className="bg-white/5 border border-white/5 rounded-2xl p-5 flex flex-col justify-center items-start hover:bg-white/10 transition-colors relative z-10 group">
              <div className="w-10 h-10 rounded-xl bg-emerald-500/10 flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                <CalendarDays size={18} className="text-emerald-400" />
              </div>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Biten Görev</p>
              <p className="text-2xl font-black text-white">{dailyCompletedTasks} <span className="text-base font-medium text-slate-500">/ {dailyTotalTasks}</span></p>
            </div>
            
            <div className="bg-white/5 border border-white/5 rounded-2xl p-5 flex flex-col justify-center items-start hover:bg-white/10 transition-colors relative z-10 group">
              <div className="w-10 h-10 rounded-xl bg-amber-500/10 flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                <Activity size={18} className="text-amber-400" />
              </div>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Bugün Başarı Oranı</p>
              <p className="text-2xl font-black text-white">
                {dailyTotalTasks > 0 ? Math.round((dailyCompletedTasks / dailyTotalTasks) * 100) : 0}<span className="text-base font-medium text-slate-500">%</span>
              </p>
            </div>
          </div>
          
        </div>
      </motion.div>
    </div>
  );
}