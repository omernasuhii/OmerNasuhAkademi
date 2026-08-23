import React, { useState, useEffect, useMemo } from 'react';
import { 
  Shield, 
  Users, 
  Search, 
  Check, 
  ChevronDown, 
  ArrowRight, 
  Copy, 
  CheckCircle2, 
  AlertCircle, 
  Sparkles, 
  LogOut, 
  ExternalLink, 
  RefreshCw, 
  UserCheck, 
  GraduationCap, 
  CreditCard, 
  Wallet, 
  BookOpen, 
  X,
  Phone,
  Clock
} from 'lucide-react';
import { collection, query, where, onSnapshot, getDocs } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { useAuth } from '../../lib/AuthContext';
import { useNavigate, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import { presenceService } from '../../services/presenceService';
import { isSubscriptionActive, syncExpiredSubscriptionStatus } from '../../services/subscriptionService';

interface AdminStudentBarProps {
  onSelectStudent?: (student: any) => void;
}

export default function AdminStudentBar({ onSelectStudent }: AdminStudentBarProps) {
  const { realUserData, impersonatedStudent, setImpersonatedStudent, clearImpersonation } = useAuth();
  const navigate = useNavigate();

  const [students, setStudents] = useState<any[]>([]);
  const [coaches, setCoaches] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<'all' | 'no_coach' | 'active_sub' | 'online' | 'no_caba'>('all');
  const [copiedUid, setCopiedUid] = useState(false);

  // Fetch all students and coaches
  useEffect(() => {
    // 1. Fetch Students
    const qStudents = query(collection(db, 'users'), where('role', '==', 'student'));
    const unsubStudents = onSnapshot(qStudents, (snap) => {
      const studentList = snap.docs.map(doc => ({ id: doc.id, uid: doc.id, ...doc.data() }));
      setStudents(studentList);
      setLoading(false);
    }, (err) => {
      console.error("AdminStudentBar students fetch error:", err);
      setLoading(false);
    });

    // 2. Fetch Coaches for name mapping
    const qCoaches = query(collection(db, 'users'), where('role', '==', 'coach'));
    const unsubCoaches = onSnapshot(qCoaches, (snap) => {
      const coachMap: Record<string, string> = {};
      snap.docs.forEach(doc => {
        const d = doc.data();
        coachMap[doc.id] = `${d.firstName || ''} ${d.lastName || ''}`.trim() || d.displayName || 'İsimsiz Koç';
      });
      setCoaches(coachMap);
    }, (err) => {
      console.error("AdminStudentBar coaches fetch error:", err);
    });

    return () => {
      unsubStudents();
      unsubCoaches();
    };
  }, []);

  const handleCopyUid = (uid: string, e: React.MouseEvent) => {
    e.stopPropagation();
    navigator.clipboard.writeText(uid);
    setCopiedUid(true);
    setTimeout(() => setCopiedUid(false), 2000);
  };

  const handleSelect = (student: any) => {
    setImpersonatedStudent(student);
    if (onSelectStudent) onSelectStudent(student);
    setIsModalOpen(false);
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

  if (realUserData?.role !== 'admin') {
    return null;
  }

  return (
    <>
      {/* Top Banner / Diagnostic Bar */}
      <div className="bg-gradient-to-r from-red-950/80 via-slate-900/90 to-blue-950/80 border-b border-red-500/30 px-4 py-2.5 text-xs text-white sticky top-0 z-40 backdrop-blur-xl shadow-lg shadow-black/40">
        <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-3">
          
          {/* Left: Mode Badge & Active Student Info */}
          <div className="flex items-center gap-3 flex-wrap">
            <div className="flex items-center gap-1.5 bg-red-600/30 text-red-400 border border-red-500/40 px-2.5 py-1 rounded-lg font-black uppercase text-[10px] tracking-wider shrink-0 shadow-sm shadow-red-600/20">
              <Shield size={13} className="text-red-400 animate-pulse" />
              <span>Yönetici Teşhis Modu</span>
            </div>

            {impersonatedStudent ? (
              <div className="flex items-center gap-2 flex-wrap">
                <div className="flex items-center gap-2 bg-slate-900/80 border border-white/10 px-3 py-1 rounded-xl">
                  <div className="w-5 h-5 rounded-full bg-blue-600/30 border border-blue-500/40 text-[10px] font-bold flex items-center justify-center text-blue-300 uppercase">
                    {impersonatedStudent.photoURL ? (
                      <img src={impersonatedStudent.photoURL} alt="" className="w-full h-full rounded-full object-cover" />
                    ) : (
                      impersonatedStudent.firstName?.[0] || 'Ö'
                    )}
                  </div>
                  <span className="font-bold text-white text-xs">
                    {impersonatedStudent.firstName} {impersonatedStudent.lastName}
                  </span>
                  <span className="text-[10px] text-slate-400 font-mono hidden sm:inline">
                    ({impersonatedStudent.email})
                  </span>

                  {/* Sınıf / Alan Badge */}
                  {impersonatedStudent.grade && (
                    <span className="bg-blue-500/20 text-blue-300 border border-blue-500/30 px-1.5 py-0.5 rounded text-[9px] font-bold">
                      {impersonatedStudent.grade} {impersonatedStudent.branch ? `• ${impersonatedStudent.branch}` : ''}
                    </span>
                  )}

                  {/* Koç Badge */}
                  <span className={`px-1.5 py-0.5 rounded text-[9px] font-bold border ${
                    (impersonatedStudent.coachId || impersonatedStudent.assignedCoachId)
                      ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30'
                      : 'bg-amber-500/20 text-amber-300 border-amber-500/30'
                  }`}>
                    {(impersonatedStudent.coachId || impersonatedStudent.assignedCoachId)
                      ? `Koç: ${coaches[impersonatedStudent.coachId || impersonatedStudent.assignedCoachId] || 'Atanmış'}`
                      : 'Koçsuz'}
                  </span>

                  {/* Paket Badge */}
                  <span className={`border px-1.5 py-0.5 rounded text-[9px] font-bold hidden md:inline ${
                    isSubscriptionActive(impersonatedStudent)
                      ? 'bg-purple-500/20 text-purple-300 border-purple-500/30'
                      : 'bg-rose-500/20 text-rose-300 border-rose-500/30'
                  }`}>
                    {isSubscriptionActive(impersonatedStudent)
                      ? (impersonatedStudent.subscriptionPlan || 'Abonelik Yok')
                      : (impersonatedStudent.subscriptionPlan ? `${impersonatedStudent.subscriptionPlan} (Süresi Doldu)` : 'Abonelik Yok')}
                  </span>

                  {/* Copy UID */}
                  <button
                    onClick={(e) => handleCopyUid(impersonatedStudent.uid, e)}
                    className="text-slate-400 hover:text-white p-1 rounded hover:bg-white/5 transition-colors"
                    title="Öğrenci UID Kopyala"
                  >
                    {copiedUid ? <CheckCircle2 size={12} className="text-emerald-400" /> : <Copy size={12} />}
                  </button>
                </div>
              </div>
            ) : (
              <div className="flex items-center gap-2 text-amber-300 bg-amber-500/10 border border-amber-500/30 px-3 py-1 rounded-xl text-xs font-semibold">
                <AlertCircle size={14} className="shrink-0" />
                <span>Henüz bir öğrenci seçilmedi. İncelemek istediğiniz öğrenciyi seçin.</span>
              </div>
            )}
          </div>

          {/* Right: Actions */}
          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={() => setIsModalOpen(true)}
              className="bg-blue-600 hover:bg-blue-500 text-white font-bold px-3 py-1.5 rounded-xl text-xs flex items-center gap-1.5 shadow-md shadow-blue-600/20 transition-all hover:scale-105 active:scale-95"
            >
              <Users size={14} />
              <span>{impersonatedStudent ? 'Öğrenci Değiştir' : 'Öğrenci Seç'}</span>
              <ChevronDown size={13} />
            </button>

            {impersonatedStudent && (
              <button
                onClick={clearImpersonation}
                className="bg-slate-800/80 hover:bg-slate-700 text-slate-300 hover:text-white font-semibold px-2.5 py-1.5 rounded-xl text-xs flex items-center gap-1 border border-white/10 transition-colors"
                title="Seçili öğrenciyi temizle ve seçim ekranına dön"
              >
                <X size={13} />
                <span className="hidden sm:inline">Temizle</span>
              </button>
            )}

            <Link
              to="/panel/admin"
              className="bg-red-600/20 hover:bg-red-600/30 text-red-300 hover:text-white border border-red-500/30 font-bold px-2.5 py-1.5 rounded-xl text-xs flex items-center gap-1 transition-colors"
              title="Yönetici Paneline Geri Dön"
            >
              <Shield size={13} />
              <span className="hidden md:inline">Yönetici Paneli</span>
            </Link>
          </div>
        </div>
      </div>

      {/* Student Selection Modal */}
      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsModalOpen(false)}
              className="fixed inset-0 bg-black/80 backdrop-blur-md"
            />

            {/* Modal Container */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              className="relative w-full max-w-4xl bg-slate-950 border border-white/10 rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[85vh] z-10"
            >
              {/* Header */}
              <div className="p-6 border-b border-white/10 flex items-center justify-between bg-slate-900/40">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-red-600/20 border border-red-500/30 flex items-center justify-center text-red-400">
                    <Shield size={20} />
                  </div>
                  <div>
                    <h3 className="text-lg font-black text-white tracking-tight flex items-center gap-2">
                      Öğrenci Paneli İnceleme & Teşhis
                      <span className="text-[10px] bg-red-600/20 text-red-400 border border-red-500/30 px-2 py-0.5 rounded-full font-bold uppercase">
                        Admin Modu
                      </span>
                    </h3>
                    <p className="text-xs text-slate-400 mt-0.5">
                      İncelemek, teknik hataları gidermek veya hesabını test etmek istediğiniz öğrenciyi seçin.
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setIsModalOpen(false)}
                  className="p-2 text-slate-400 hover:text-white rounded-xl hover:bg-white/5 transition-colors"
                >
                  <X size={18} />
                </button>
              </div>

              {/* Search & Filter Bar */}
              <div className="p-4 border-b border-white/5 bg-slate-900/20 flex flex-col sm:flex-row gap-3">
                <div className="flex-1 relative">
                  <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" size={16} />
                  <input
                    type="text"
                    placeholder="İsim, soyisim, e-posta, telefon, sınıf veya UID ile arayın..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    autoFocus
                    className="w-full bg-slate-900/80 border border-white/10 rounded-xl py-2.5 pl-10 pr-4 text-xs text-white placeholder:text-slate-500 focus:outline-none focus:ring-1 focus:ring-red-500 transition-all"
                  />
                  {search && (
                    <button
                      onClick={() => setSearch('')}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-white"
                    >
                      <X size={14} />
                    </button>
                  )}
                </div>

                {/* Filter Tabs */}
                <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pb-1 sm:pb-0">
                  {[
                    { id: 'all', label: `Tümü (${students.length})` },
                    { id: 'no_coach', label: 'Koçsuzlar' },
                    { id: 'active_sub', label: 'Aktif Aboneler' },
                    { id: 'online', label: 'Çevrimiçi' },
                    { id: 'no_caba', label: 'ÇABA Yok' },
                  ].map(tab => (
                    <button
                      key={tab.id}
                      onClick={() => setFilter(tab.id as any)}
                      className={`px-3 py-2 rounded-xl text-[10px] font-bold uppercase tracking-wider transition-all shrink-0 ${
                        filter === tab.id
                          ? 'bg-red-600 text-white shadow-md shadow-red-600/20'
                          : 'bg-slate-900/60 border border-white/5 text-slate-400 hover:text-white hover:bg-slate-800'
                      }`}
                    >
                      {tab.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Student List */}
              <div className="flex-1 overflow-y-auto p-4 space-y-2.5 custom-scrollbar">
                {loading ? (
                  <div className="py-16 text-center">
                    <RefreshCw className="animate-spin text-red-500 mx-auto mb-3" size={28} />
                    <p className="text-slate-400 text-xs font-semibold">Öğrenciler yükleniyor...</p>
                  </div>
                ) : filteredStudents.length === 0 ? (
                  <div className="py-16 text-center bg-slate-900/20 rounded-2xl border border-white/5">
                    <AlertCircle className="text-slate-600 mx-auto mb-3" size={32} />
                    <p className="text-slate-300 font-bold text-sm">Öğrenci bulunamadı</p>
                    <p className="text-slate-500 text-xs mt-1">Arama kriterlerinize uygun öğrenci kaydı bulunamadı.</p>
                  </div>
                ) : (
                  filteredStudents.map((student) => {
                    const isSelected = impersonatedStudent?.uid === student.uid;
                    const coachName = coaches[student.coachId || student.assignedCoachId];
                    const isOnline = presenceService.isOnline(student);

                    return (
                      <div
                        key={student.uid || student.id}
                        onClick={() => handleSelect(student)}
                        className={`group p-4 rounded-2xl border transition-all cursor-pointer flex flex-col sm:flex-row sm:items-center justify-between gap-4 ${
                          isSelected
                            ? 'bg-red-600/10 border-red-500/50 shadow-lg shadow-red-600/10 ring-1 ring-red-500/30'
                            : 'bg-slate-900/40 hover:bg-slate-900/80 border-white/5 hover:border-white/20'
                        }`}
                      >
                        {/* Student Primary Info */}
                        <div className="flex items-center gap-3.5 min-w-0">
                          <div className="relative shrink-0">
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

                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-2 flex-wrap">
                              <h4 className="text-sm font-black text-white group-hover:text-red-400 transition-colors truncate">
                                {student.firstName} {student.lastName}
                              </h4>
                              {isSelected && (
                                <span className="bg-red-600 text-white text-[9px] font-black px-2 py-0.5 rounded-full uppercase tracking-wider">
                                  Aktif Seçili
                                </span>
                              )}
                            </div>

                            <p className="text-[11px] text-slate-400 font-medium truncate mt-0.5">
                              {student.email}
                              {student.phone && <span className="text-slate-500 ml-2 font-mono">({student.phone})</span>}
                            </p>

                            <div className="flex items-center gap-2 mt-2 flex-wrap text-[10px]">
                              <span className="bg-slate-800 text-slate-300 px-2 py-0.5 rounded-md font-semibold border border-white/5">
                                {student.grade || 'Sınıf Girilmedi'} {student.branch ? `• ${student.branch}` : ''}
                              </span>

                              <span className={`px-2 py-0.5 rounded-md font-semibold border ${
                                coachName 
                                  ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' 
                                  : 'bg-amber-500/10 text-amber-400 border-amber-500/20'
                              }`}>
                                {coachName ? `Koç: ${coachName}` : 'Koç Atanmamış'}
                              </span>

                              <span className={`border px-2 py-0.5 rounded-md font-semibold ${
                                isSubscriptionActive(student)
                                  ? 'bg-purple-500/10 text-purple-400 border-purple-500/20'
                                  : 'bg-rose-500/10 text-rose-400 border-rose-500/20'
                              }`}>
                                {isSubscriptionActive(student)
                                  ? (student.subscriptionPlan || 'Abonelik Yok')
                                  : (student.subscriptionPlan ? `${student.subscriptionPlan} (Süresi Doldu)` : 'Abonelik Yok')}
                              </span>

                              {student.walletBalance !== undefined && (
                                <span className="bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-2 py-0.5 rounded-md font-mono font-bold">
                                  ₺{Number(student.walletBalance).toFixed(2)}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>

                        {/* Action Buttons */}
                        <div className="flex items-center gap-2 self-end sm:self-center shrink-0">
                          <button
                            onClick={(e) => handleCopyUid(student.uid, e)}
                            className="p-2 text-slate-500 hover:text-slate-300 rounded-xl hover:bg-white/5 transition-colors border border-white/5"
                            title="UID Kopyala"
                          >
                            <Copy size={14} />
                          </button>

                          <button
                            onClick={() => handleSelect(student)}
                            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
                              isSelected
                                ? 'bg-red-600 text-white shadow-lg shadow-red-600/30'
                                : 'bg-slate-800 hover:bg-red-600 text-slate-300 hover:text-white border border-white/10 group-hover:border-red-500/30'
                            }`}
                          >
                            <span>{isSelected ? 'Seçildi' : 'Bu Paneli Aç'}</span>
                            <ArrowRight size={13} />
                          </button>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>

              {/* Footer */}
              <div className="p-4 border-t border-white/10 bg-slate-900/40 flex items-center justify-between text-xs text-slate-500">
                <div className="flex items-center gap-2 font-medium">
                  <span>Toplam <strong>{students.length}</strong> kayıtlı öğrenci</span>
                </div>
                <div className="flex items-center gap-3">
                  <Link
                    to="/panel/admin/kullanicilar"
                    className="text-red-400 hover:text-red-300 font-bold flex items-center gap-1 hover:underline"
                  >
                    <span>Kullanıcı Yönetimine Git</span>
                    <ExternalLink size={12} />
                  </Link>
                  <button
                    onClick={() => setIsModalOpen(false)}
                    className="bg-slate-800 hover:bg-slate-700 text-white px-4 py-1.5 rounded-xl font-bold transition-colors"
                  >
                    Kapat
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
}
