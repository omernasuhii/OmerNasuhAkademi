import React, { useState, useEffect, useMemo } from 'react';
import { 
  Shield, 
  Users, 
  Search, 
  ArrowRight, 
  Sparkles, 
  AlertCircle, 
  CheckCircle2, 
  UserCheck, 
  GraduationCap, 
  Copy, 
  CreditCard, 
  RefreshCw,
  ExternalLink,
  ChevronRight,
  Zap,
  Clock
} from 'lucide-react';
import { collection, query, where, onSnapshot } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { useAuth } from '../../lib/AuthContext';
import { Link } from 'react-router-dom';
import { presenceService } from '../../services/presenceService';
import { isSubscriptionActive, syncExpiredSubscriptionStatus } from '../../services/subscriptionService';

export default function AdminStudentSelectorEmptyState() {
  const { setImpersonatedStudent } = useAuth();
  const [students, setStudents] = useState<any[]>([]);
  const [coaches, setCoaches] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<'all' | 'no_coach' | 'active_sub' | 'online' | 'no_caba'>('all');
  const [copiedUid, setCopiedUid] = useState<string | null>(null);

  useEffect(() => {
    // 1. Fetch Students
    const qStudents = query(collection(db, 'users'), where('role', '==', 'student'));
    const unsubStudents = onSnapshot(qStudents, (snap) => {
      const studentList = snap.docs.map(doc => ({ id: doc.id, uid: doc.id, ...doc.data() }));
      setStudents(studentList);
      setLoading(false);
    }, (err) => {
      console.error("AdminStudentSelectorEmptyState fetch error:", err);
      setLoading(false);
    });

    // 2. Fetch Coaches
    const qCoaches = query(collection(db, 'users'), where('role', '==', 'coach'));
    const unsubCoaches = onSnapshot(qCoaches, (snap) => {
      const coachMap: Record<string, string> = {};
      snap.docs.forEach(doc => {
        const d = doc.data();
        coachMap[doc.id] = `${d.firstName || ''} ${d.lastName || ''}`.trim() || d.displayName || 'İsimsiz Koç';
      });
      setCoaches(coachMap);
    }, (err) => {
      console.error("AdminStudentSelectorEmptyState coaches fetch error:", err);
    });

    return () => {
      unsubStudents();
      unsubCoaches();
    };
  }, []);

  const handleCopyUid = (uid: string, e: React.MouseEvent) => {
    e.stopPropagation();
    navigator.clipboard.writeText(uid);
    setCopiedUid(uid);
    setTimeout(() => setCopiedUid(null), 2000);
  };

  const filteredStudents = useMemo(() => {
    return (students || []).filter(student => {
      if (!student) return false;
      const fullName = `${student.firstName || ''} ${student.lastName || ''}`.toLowerCase();
      const email = (student.email || '').toLowerCase();
      const phone = (student.phone || '').toLowerCase();
      const grade = (student.grade || '').toLowerCase();
      const uid = (student.uid || student.id || '').toLowerCase();
      const q = search.toLowerCase().trim();

      const matchesSearch = !q || fullName.includes(q) || email.includes(q) || phone.includes(q) || grade.includes(q) || uid.includes(q);
      if (!matchesSearch) return false;

      if (filter === 'no_coach') {
        return !student.coachId && !student.assignedCoachId;
      }
      if (filter === 'active_sub') {
        return isSubscriptionActive(student);
      }
      if (filter === 'online') {
        return presenceService.isOnline(student);
      }
      if (filter === 'no_caba') {
        return !student.cabaCompleted;
      }

      return true;
    });
  }, [students, search, filter]);

  const stats = useMemo(() => {
    const safeStudents = students || [];
    const total = safeStudents.length;
    const noCoach = safeStudents.filter(s => s && !s.coachId && !s.assignedCoachId).length;
    const activeSub = safeStudents.filter(s => s && isSubscriptionActive(s)).length;
    const online = safeStudents.filter(s => s && presenceService.isOnline(s)).length;
    return { total, noCoach, activeSub, online };
  }, [students]);

  return (
    <div className="max-w-6xl mx-auto py-8 space-y-8 animate-in fade-in duration-500">
      {/* Hero Welcome Card */}
      <div className="relative overflow-hidden bg-gradient-to-br from-slate-900 via-slate-900/90 to-red-950/40 border border-red-500/20 rounded-3xl p-8 shadow-2xl">
        <div className="absolute top-0 right-0 -mr-16 -mt-16 w-64 h-64 bg-red-500/10 rounded-full blur-3xl pointer-events-none" />
        
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <span className="bg-red-500/20 text-red-400 border border-red-500/30 px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider flex items-center gap-1.5 shadow-sm">
                <Shield size={14} className="text-red-400" />
                Yönetici Teşhis & Önizleme Merkezi
              </span>
            </div>
            <h1 className="text-2xl md:text-3xl font-black text-white tracking-tight">
              Öğrenci Paneli İnceleme & Teknik Hata Giderme
            </h1>
            <p className="text-slate-400 text-sm max-w-2xl leading-relaxed">
              Öğrencilerin hesaplarında oluşabilecek teknik aksaklıkları incelemek, sınav/görev akışlarını doğrulamak veya paneli öğrenci gözünden test etmek için listeden bir öğrenci seçin.
            </p>
          </div>

          <Link
            to="/panel/admin"
            className="bg-slate-800/80 hover:bg-slate-700 text-slate-300 hover:text-white px-5 py-2.5 rounded-2xl text-xs font-bold border border-white/10 flex items-center gap-2 transition-all shrink-0 self-start md:self-center"
          >
            <Shield size={15} />
            <span>Yönetici Paneline Dön</span>
          </Link>
        </div>

        {/* Quick Diagnostic Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-8 pt-6 border-t border-white/5">
          <div className="bg-slate-950/50 border border-white/5 p-4 rounded-2xl">
            <p className="text-[10px] font-black uppercase tracking-widest text-slate-500">Toplam Öğrenci</p>
            <p className="text-2xl font-black text-white mt-1 tabular-nums">{stats.total}</p>
          </div>
          <div className="bg-slate-950/50 border border-amber-500/10 p-4 rounded-2xl">
            <p className="text-[10px] font-black uppercase tracking-widest text-amber-400">Koçsuz Öğrenci</p>
            <p className="text-2xl font-black text-amber-300 mt-1 tabular-nums">{stats.noCoach}</p>
          </div>
          <div className="bg-slate-950/50 border border-purple-500/10 p-4 rounded-2xl">
            <p className="text-[10px] font-black uppercase tracking-widest text-purple-400">Aktif Aboneler</p>
            <p className="text-2xl font-black text-purple-300 mt-1 tabular-nums">{stats.activeSub}</p>
          </div>
          <div className="bg-slate-950/50 border border-emerald-500/10 p-4 rounded-2xl">
            <p className="text-[10px] font-black uppercase tracking-widest text-emerald-400">Çevrimiçi</p>
            <p className="text-2xl font-black text-emerald-300 mt-1 tabular-nums">{stats.online}</p>
          </div>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="bg-slate-900/40 border border-white/5 p-4 rounded-2xl flex flex-col md:flex-row gap-4 items-center justify-between">
        <div className="w-full md:flex-1 relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
          <input
            type="text"
            placeholder="İsim, soyisim, e-posta, telefon veya UID ile öğrenci ara..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-slate-950 border border-white/10 rounded-xl py-3 pl-12 pr-4 text-sm text-white focus:outline-none focus:ring-1 focus:ring-red-500 transition-all placeholder:text-slate-500"
          />
        </div>

        <div className="flex items-center gap-2 overflow-x-auto no-scrollbar w-full md:w-auto">
          {[
            { id: 'all', label: `Tümü (${students.length})` },
            { id: 'no_coach', label: 'Koçsuzlar' },
            { id: 'active_sub', label: 'Aboneler' },
            { id: 'online', label: 'Çevrimiçi' },
            { id: 'no_caba', label: 'ÇABA Yok' },
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setFilter(tab.id as any)}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold uppercase tracking-wider transition-all shrink-0 ${
                filter === tab.id
                  ? 'bg-red-600 text-white shadow-lg shadow-red-600/20'
                  : 'bg-slate-950 border border-white/5 text-slate-400 hover:text-white hover:bg-slate-800'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Student Cards Grid */}
      {loading ? (
        <div className="py-20 text-center">
          <RefreshCw className="animate-spin text-red-500 mx-auto mb-3" size={32} />
          <p className="text-slate-400 text-sm font-semibold">Öğrenci listesi yükleniyor...</p>
        </div>
      ) : filteredStudents.length === 0 ? (
        <div className="py-20 text-center bg-slate-900/30 border border-white/5 rounded-3xl p-8">
          <AlertCircle className="text-slate-600 mx-auto mb-3" size={40} />
          <p className="text-lg font-bold text-white">Öğrenci Bulunamadı</p>
          <p className="text-sm text-slate-500 mt-1">Arama veya filtre kriterlerinize uygun öğrenci kaydı bulunamadı.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredStudents.map((student) => {
            const coachName = coaches[student.coachId || student.assignedCoachId];
            const isOnline = presenceService.isOnline(student);

            return (
              <div
                key={student.uid || student.id}
                onClick={() => setImpersonatedStudent(student)}
                className="bg-slate-900/40 hover:bg-slate-900 border border-white/5 hover:border-red-500/30 rounded-3xl p-5 transition-all cursor-pointer group flex flex-col justify-between gap-4 hover:shadow-xl hover:shadow-red-600/5 hover:-translate-y-0.5"
              >
                <div>
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div className="relative">
                        <div className="w-12 h-12 rounded-2xl bg-slate-800 border border-white/10 overflow-hidden flex items-center justify-center text-slate-300 font-black text-sm uppercase">
                          {student.photoURL ? (
                            <img src={student.photoURL} alt="" className="w-full h-full object-cover" />
                          ) : (
                            student.firstName?.[0] || 'Ö'
                          )}
                        </div>
                        {isOnline && (
                          <div className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 bg-emerald-500 border-2 border-slate-950 rounded-full shadow-[0_0_8px_rgba(16,185,129,0.8)]" />
                        )}
                      </div>

                      <div>
                        <h3 className="font-bold text-white text-base group-hover:text-red-400 transition-colors">
                          {student.firstName} {student.lastName}
                        </h3>
                        <p className="text-xs text-slate-500 truncate max-w-[180px]">
                          {student.email}
                        </p>
                      </div>
                    </div>

                    <button
                      onClick={(e) => handleCopyUid(student.uid, e)}
                      className="p-1.5 text-slate-500 hover:text-white rounded-lg hover:bg-white/5 transition-colors"
                      title="UID Kopyala"
                    >
                      {copiedUid === student.uid ? <CheckCircle2 size={15} className="text-emerald-400" /> : <Copy size={15} />}
                    </button>
                  </div>

                  <div className="mt-4 pt-4 border-t border-white/5 space-y-2">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-slate-500 font-medium">Sınıf & Alan:</span>
                      <span className="text-slate-300 font-bold">
                        {student.grade || 'Girilmedi'} {student.branch ? `(${student.branch})` : ''}
                      </span>
                    </div>

                    <div className="flex items-center justify-between text-xs">
                      <span className="text-slate-500 font-medium">Eğitim Koçu:</span>
                      <span className={`font-bold ${coachName ? 'text-emerald-400' : 'text-amber-400'}`}>
                        {coachName || 'Atanmamış'}
                      </span>
                    </div>

                    <div className="flex items-center justify-between text-xs">
                      <span className="text-slate-500 font-medium">Abonelik Durumu:</span>
                      <span className={`font-bold ${
                        isSubscriptionActive(student) 
                          ? 'text-purple-400' 
                          : 'text-rose-400'
                      }`}>
                        {isSubscriptionActive(student)
                          ? (student.subscriptionPlan || 'Abonelik Yok')
                          : (student.subscriptionPlan ? `${student.subscriptionPlan} (Süresi Doldu)` : 'Abonelik Yok')}
                      </span>
                    </div>

                    {student.phone && (
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-slate-500 font-medium">Telefon:</span>
                        <span className="text-slate-400 font-mono">
                          {student.phone}
                        </span>
                      </div>
                    )}
                  </div>
                </div>

                <div className="pt-3 border-t border-white/5 flex items-center justify-between">
                  <span className="text-[10px] text-slate-500 uppercase tracking-widest font-bold">
                    Paneli İncele
                  </span>
                  <div className="w-8 h-8 rounded-xl bg-red-600/10 group-hover:bg-red-600 text-red-400 group-hover:text-white flex items-center justify-center transition-all group-hover:translate-x-1">
                    <ArrowRight size={16} />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
