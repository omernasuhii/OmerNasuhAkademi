import React, { useEffect, useState } from 'react';
import { 
  Users, 
  Search, 
  Filter, 
  MoreVertical, 
  Mail, 
  User as UserIcon, 
  Shield, 
  Trash2, 
  Edit2,
  Download,
  AlertCircle,
  Loader2,
  CheckCircle,
  XCircle,
  Clock,
  X,
  LogOut,
  LogIn
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { collection, getDocs, doc, updateDoc, deleteDoc, query, orderBy, where, onSnapshot } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { useAuth } from '../../lib/AuthContext';
import { presenceService } from '../../services/presenceService';

export default function UserManagement() {
  const { user: currentUser } = useAuth();
  const [users, setUsers] = useState<any[]>([]);
  const [coaches, setCoaches] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');

  const [isActivityModalOpen, setIsActivityModalOpen] = useState(false);
  const [selectedActivityUser, setSelectedActivityUser] = useState<any>(null);
  const [userSessions, setUserSessions] = useState<any[]>([]);
  const [sessionsLoading, setSessionsLoading] = useState(false);

  useEffect(() => {
    if (isActivityModalOpen && selectedActivityUser) {
       setSessionsLoading(true);
       const fetchSessions = async () => {
          try {
             const sq = query(collection(db, 'user_sessions'), where('userId', '==', selectedActivityUser.id), orderBy('timestamp', 'desc'));
             const snap = await getDocs(sq);
             setUserSessions(snap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
          } catch(e) {
             console.error('Sessions fetch err', e);
          } finally {
             setSessionsLoading(false);
          }
       };
       fetchSessions();
    }
  }, [isActivityModalOpen, selectedActivityUser]);

  useEffect(() => {
    const q = query(collection(db, 'users'), orderBy('createdAt', 'desc'));
    const unsubscribe = onSnapshot(q, (snap) => {
      const allUsers = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setUsers(allUsers);
      setCoaches(allUsers.filter((u: any) => u.role === 'coach'));
      setLoading(false);
    }, (err) => {
      console.error("Users onSnapshot error:", err);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const handleAssignCoach = async (studentId: string, coachId: string) => {
    try {
      await updateDoc(doc(db, 'users', studentId), { coachId });
      setUsers(prev => prev.map(u => u.id === studentId ? { ...u, coachId } : u));
      
      // Google Chat entegrasyonu - Otomatik sohbet odası açılışı
      const student = users.find(u => u.id === studentId);
      const coach = users.find(u => u.id === coachId);
      
      if (student && coach) {
        import('../../lib/workspaceAuth').then(async ({ getAccessToken }) => {
          const token = await getAccessToken();
          if (token) {
            try {
              await fetch('https://chat.googleapis.com/v1/spaces:setup', {
                method: 'POST',
                headers: {
                  Authorization: `Bearer ${token}`,
                  'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                  space: {
                    spaceType: 'SPACE',
                    displayName: `Koçluk: ${student.firstName} & ${coach.firstName}`
                  },
                  memberships: [
                    { member: { name: `users/${student.email}`, type: 'HUMAN' } },
                    { member: { name: `users/${coach.email}`, type: 'HUMAN' } }
                  ]
                })
              });
              console.log('Google Chat odası oluşturuldu.');
            } catch (e) {
              console.error('Chat odası oluşturulamadı:', e);
            }
          }
        });
      }
      
    } catch (err) {
      alert('Koç atanırken bir hata oluştu.');
    }
  };

  const filteredUsers = users.filter(user => {
    const matchesSearch = 
      (user.firstName + ' ' + user.lastName).toLowerCase().includes(search.toLowerCase()) ||
      user.email.toLowerCase().includes(search.toLowerCase());
    const matchesRole = roleFilter === 'all' || user.role === roleFilter;
    return matchesSearch && matchesRole;
  });

  const handleDeleteUser = async (id: string) => {
    if (id === currentUser?.uid) {
      alert('Kendi hesabınızı silemezsiniz.');
      return;
    }
    if (!window.confirm('Bu kullanıcıyı silmek istediğinize emin misiniz? Bu işlem geri alınamaz.')) return;
    try {
      await deleteDoc(doc(db, 'users', id));
      setUsers(prev => prev.filter(u => u.id !== id));
    } catch (err) {
      alert('Kullanıcı silinirken bir hata oluştu.');
    }
  };

  const handleToggleRole = async (id: string, currentRole: string) => {
    if (id === currentUser?.uid) {
      alert('Kendi rolünüzü değiştiremezsiniz.');
      return;
    }
    if (currentRole === 'parent') {
      alert('Veli rolleri değiştirilemez.');
      return;
    }
    if (currentRole === 'admin') {
      alert('Yönetici rolleri buradan değiştirilemez.');
      return;
    }

    const newRole = currentRole === 'student' ? 'coach' : 'student';
    try {
      await updateDoc(doc(db, 'users', id), { role: newRole });
      setUsers(prev => prev.map(u => u.id === id ? { ...u, role: newRole } : u));
    } catch (err) {
      alert('Rol güncellenirken bir hata oluştu.');
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h2 className="text-2xl font-black text-white tracking-tight uppercase">Kullanıcı Yönetimi</h2>
          <p className="text-slate-500 text-sm mt-1 font-medium italic">Tüm öğrenci, koç ve velilerin listesi ve hesap yönetimi.</p>
        </div>
        <div className="flex items-center gap-3">
          <button className="bg-slate-900 border border-white/10 text-white px-5 py-2.5 rounded-xl text-xs font-bold hover:bg-slate-800 transition-all flex items-center gap-2">
             <Download size={16} /> Listeyi Dışa Aktar
          </button>
        </div>
      </div>

      {/* Filters Bar */}
      <div className="bg-slate-900/40 border border-white/5 p-4 rounded-2xl flex flex-col md:flex-row gap-4">
        <div className="flex-1 relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
          <input 
            type="text" 
            placeholder="İsim veya e-posta ile ara..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-slate-950/50 border border-white/5 rounded-xl py-3 pl-12 pr-4 text-sm text-white focus:outline-none focus:ring-1 focus:ring-red-500 transition-all"
          />
        </div>
        <div className="flex items-center gap-4">
          <div className="flex bg-slate-950 p-1 rounded-xl border border-white/5 overflow-x-auto no-scrollbar">
            {['all', 'student', 'coach', 'parent', 'admin'].map(role => (
              <button
                key={role}
                onClick={() => setRoleFilter(role)}
                className={`px-4 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all shrink-0 ${
                  roleFilter === role ? 'bg-red-600 text-white shadow-lg shadow-red-600/20' : 'text-slate-500 hover:text-slate-300'
                }`}
              >
                {role === 'all' ? 'HEPSİ' : role === 'student' ? 'ÖĞRENCİ' : role === 'coach' ? 'KOÇ' : role === 'parent' ? 'VELİ' : 'ADMİN'}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Users Table */}
      <div className="bg-slate-900/40 border border-white/5 rounded-3xl overflow-hidden">
        {/* Desktop Table View */}
        <div className="hidden md:block overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-950/50 border-b border-white/5">
                <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-slate-500">Kullanıcı</th>
                <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-slate-500">Rol</th>
                <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-slate-500">Sorumlu Koç</th>
                <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-slate-500">Bağlantı / Detay</th>
                <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-slate-500">Son Giriş</th>
                <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-slate-500">Kayıt Tarihi</th>
                <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-slate-500 text-right">İşlemler</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {loading ? (
                <tr>
                  <td colSpan={7} className="px-6 py-20 text-center">
                    <Loader2 className="animate-spin mx-auto text-red-500 mb-4" size={32} />
                    <p className="text-slate-500 text-sm font-medium animate-pulse">Kullanıcılar yükleniyor...</p>
                  </td>
                </tr>
              ) : filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-20 text-center">
                    <div className="bg-slate-950 w-16 h-16 rounded-3xl flex items-center justify-center mx-auto mb-4 border border-white/5">
                       <AlertCircle className="text-slate-700" size={32} />
                    </div>
                    <p className="text-slate-500 text-sm font-medium">Aradığınız kriterlere uygun kullanıcı bulunamadı.</p>
                  </td>
                </tr>
              ) : (
                filteredUsers.map((user) => (
                  <tr key={user.id} className="hover:bg-white/[0.02] transition-colors group">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="relative">
                          <div className={`w-10 h-10 rounded-full bg-slate-800 border border-white/10 overflow-hidden flex items-center justify-center text-slate-400 font-bold uppercase ring-2 ring-white/0 group-hover:ring-red-500/20 transition-all ${user.role === 'parent' ? 'opacity-70' : ''}`}>
                            {user.photoURL ? (
                              <img src={user.photoURL} alt={user.firstName} className="w-full h-full object-cover" />
                            ) : (
                              user.firstName?.[0] || 'U'
                            )}
                          </div>
                          {presenceService.isOnline(user) && (
                             <div className="absolute bottom-0 right-0 w-3 h-3 bg-emerald-500 border-2 border-slate-900 rounded-full shadow-[0_0_8px_rgba(16,185,129,0.8)]"></div>
                          )}
                        </div>
                        <div>
                          <p className="text-sm font-bold text-white leading-none mb-1">{user.firstName} {user.lastName}</p>
                          <p className="text-[10px] text-slate-500 group-hover:text-slate-400 transition-colors uppercase tracking-widest font-black">{user.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest border ${
                        user.role === 'admin' ? 'bg-red-500/10 text-red-500 border-red-500/20 shadow-[0_0_10px_rgba(239,68,68,0.1)]' :
                        user.role === 'coach' ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20' :
                        user.role === 'parent' ? 'bg-purple-500/10 text-purple-400 border-purple-500/20' :
                        'bg-blue-500/10 text-blue-400 border-blue-500/20'
                      }`}>
                        {user.role === 'admin' ? 'Yönetici' : user.role === 'coach' ? 'Koç' : user.role === 'parent' ? 'Veli' : 'Öğrenci'}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      {user.role === 'student' ? (
                        <select
                          value={user.coachId || ''}
                          onChange={(e) => handleAssignCoach(user.id, e.target.value)}
                          className="bg-slate-950 border border-white/10 rounded-lg py-1 px-2 text-[10px] font-bold text-slate-300 focus:outline-none focus:ring-1 focus:ring-red-500 transition-all max-w-[150px]"
                        >
                          <option value="">Koç Seçilmedi</option>
                          {coaches.map(coach => (
                            <option key={coach.id} value={coach.id}>
                              {coach.firstName} {coach.lastName}
                            </option>
                          ))}
                        </select>
                      ) : (
                        <span className="text-[10px] text-slate-700 italic">Uygulanamaz</span>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-[11px] text-slate-400 space-y-1 font-medium">
                        {user.role === 'student' ? (
                          <>
                            <div className="flex flex-col gap-0.5">
                              <span className="text-white font-bold">{user.grade || 'Sınıf Girilmedi'}</span>
                              <span className="text-blue-400/80 uppercase font-black tracking-widest text-[9px]">{user.branch || 'Alan Yok'}</span>
                              {user.parentFirstName && (
                                <span className="text-[9px] text-slate-500 italic mt-1 bg-white/5 px-2 py-0.5 rounded w-fit capitalize">Veli: {user.parentFirstName} {user.parentLastName}</span>
                              )}
                            </div>
                          </>
                        ) : user.role === 'parent' ? (
                          <div className="flex flex-col gap-0.5">
                            <span className="text-purple-400/80 font-black text-[9px] uppercase tracking-widest">Öğrenci Bağlantısı:</span>
                            <span className="text-white font-bold">{user.studentName || 'Bilinmiyor'}</span>
                          </div>
                        ) : (
                          <p className="italic text-slate-600">Sistem Üyesi</p>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-[11px] text-slate-500 font-bold tabular-nums">
                       {presenceService.isOnline(user) ? (
                          <span className="text-emerald-400 flex items-center gap-1.5 font-bold">
                            <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse shadow-[0_0_8px_rgba(16,185,129,0.8)]"></div> Çevrimiçi
                          </span>
                       ) : (
                          <span className="text-slate-400 font-medium">
                            {presenceService.formatLastSeen(user)}
                          </span>
                       )}
                    </td>
                    <td className="px-6 py-4 text-[11px] text-slate-500 font-bold tabular-nums">
                      {user.createdAt?.seconds ? new Date(user.createdAt.seconds * 1000).toLocaleDateString('tr-TR') : 'Bilinmiyor'}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        {user.role !== 'parent' && user.role !== 'admin' && (
                          <button 
                            onClick={() => handleToggleRole(user.id, user.role)}
                            disabled={user.id === currentUser?.uid}
                            className={`bg-slate-950 p-2 rounded-lg transition-all border border-white/5 ${
                              user.id === currentUser?.uid 
                                ? 'opacity-20 cursor-not-allowed text-slate-700' 
                                : 'text-slate-500 hover:text-white hover:bg-slate-800 hover:border-red-500/30'
                            }`}
                            title={user.id === currentUser?.uid ? "Kendi rolünüzü değiştiremezsiniz" : "Rolü Değiştir (Koç/Öğrenci)"}
                          >
                            <Shield size={16} />
                          </button>
                        )}
                        <button 
                          onClick={() => {
                            setSelectedActivityUser(user);
                            setIsActivityModalOpen(true);
                          }}
                          className="bg-slate-950 p-2 rounded-lg transition-all border border-white/5 text-slate-500 hover:text-fuchsia-400 hover:bg-fuchsia-400/10 hover:border-fuchsia-400/30"
                          title="İşlem Geçmişi (Giriş/Çıkış)"
                        >
                          <Clock size={16} />
                        </button>
                        <button 
                          className={`bg-slate-950 p-2 rounded-lg transition-all border border-white/5 ${
                            user.id === currentUser?.uid 
                              ? 'opacity-20 cursor-not-allowed text-slate-700' 
                              : 'text-slate-500 hover:text-sky-400 hover:bg-sky-400/10 hover:border-sky-400/30'
                          }`}
                        >
                          <Edit2 size={16} />
                        </button>
                        <button 
                          onClick={() => handleDeleteUser(user.id)}
                          disabled={user.id === currentUser?.uid}
                          className={`bg-slate-950 p-2 rounded-lg transition-all border border-white/5 ${
                            user.id === currentUser?.uid 
                              ? 'opacity-20 cursor-not-allowed text-slate-700' 
                              : 'text-slate-500 hover:text-red-400 hover:bg-red-400/10 hover:border-red-400/30'
                          }`}
                          title={user.id === currentUser?.uid ? "Kendi hesabınızı silemezsiniz" : "Kullanıcıyı Sil"}
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Mobile View Card List */}
        <div className="md:hidden divide-y divide-white/5 bg-slate-950/20">
          {loading ? (
            <div className="px-6 py-20 text-center">
              <Loader2 className="animate-spin mx-auto text-red-500 mb-4" size={32} />
              <p className="text-slate-500 text-sm font-medium animate-pulse">Kullanıcılar yükleniyor...</p>
            </div>
          ) : filteredUsers.length === 0 ? (
            <div className="px-6 py-20 text-center">
              <div className="bg-slate-950 w-16 h-16 rounded-3xl flex items-center justify-center mx-auto mb-4 border border-white/5">
                 <AlertCircle className="text-slate-700" size={32} />
              </div>
              <p className="text-slate-500 text-sm font-medium">Aradığınız kriterlere uygun kullanıcı bulunamadı.</p>
            </div>
          ) : (
            filteredUsers.map((user) => (
              <div key={user.id} className="p-4 space-y-4 hover:bg-white/[0.01] transition-colors group">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="relative">
                      <div className={`w-10 h-10 rounded-full bg-slate-800 border border-white/10 overflow-hidden flex items-center justify-center text-slate-400 font-bold uppercase ring-2 ring-white/0 group-hover:ring-red-500/20 transition-all ${user.role === 'parent' ? 'opacity-70' : ''}`}>
                        {user.photoURL ? (
                          <img src={user.photoURL} alt={user.firstName} className="w-full h-full object-cover" />
                        ) : (
                          user.firstName?.[0] || 'U'
                        )}
                      </div>
                      {presenceService.isOnline(user) && (
                         <div className="absolute bottom-0 right-0 w-3 h-3 bg-emerald-500 border-2 border-slate-900 rounded-full shadow-[0_0_8px_rgba(16,185,129,0.8)]"></div>
                      )}
                    </div>
                    <div>
                      <p className="text-sm font-bold text-white leading-none mb-1">{user.firstName} {user.lastName}</p>
                      <p className="text-[10px] text-slate-500 uppercase tracking-widest font-black truncate max-w-[180px]">{user.email}</p>
                    </div>
                  </div>
                  
                  <span className={`px-2.5 py-0.5 rounded-full text-[8px] font-black uppercase tracking-widest border shrink-0 ${
                    user.role === 'admin' ? 'bg-red-500/10 text-red-500 border-red-500/20 shadow-[0_0_10px_rgba(239,68,68,0.1)]' :
                    user.role === 'coach' ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20' :
                    user.role === 'parent' ? 'bg-purple-500/10 text-purple-400 border-purple-500/20' :
                    'bg-blue-500/10 text-blue-400 border-blue-500/20'
                  }`}>
                    {user.role === 'admin' ? 'Yönetici' : user.role === 'coach' ? 'Koç' : user.role === 'parent' ? 'Veli' : 'Öğrenci'}
                  </span>
                </div>

                {user.role === 'student' && (
                  <div className="flex items-center justify-between text-xs border-t border-white/5 pt-3">
                    <span className="text-slate-500 font-medium">Sorumlu Koç:</span>
                    <select
                      value={user.coachId || ''}
                      onChange={(e) => handleAssignCoach(user.id, e.target.value)}
                      className="bg-slate-950 border border-white/10 rounded-lg py-1 px-2 text-[10px] font-bold text-slate-300 focus:outline-none focus:ring-1 focus:ring-red-500 transition-all max-w-[150px]"
                    >
                      <option value="">Koç Seçilmedi</option>
                      {coaches.map(coach => (
                        <option key={coach.id} value={coach.id}>
                          {coach.firstName} {coach.lastName}
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                <div className="grid grid-cols-2 gap-2 text-[11px] border-t border-white/5 pt-3">
                  <div>
                    <span className="text-slate-500 block mb-0.5 text-[9px] uppercase tracking-wider font-bold">Detaylar / Bağlantı</span>
                    <div className="text-slate-300 font-medium leading-relaxed">
                      {user.role === 'student' ? (
                        <>
                          <div className="flex flex-col">
                            <span className="text-white font-bold">{user.grade || 'Sınıf Girilmedi'}</span>
                            <span className="text-blue-400/80 uppercase font-black tracking-widest text-[9px]">{user.branch || 'Alan Yok'}</span>
                            {user.parentFirstName && (
                              <span className="text-[9px] text-slate-500 italic mt-0.5 bg-white/5 px-2 py-0.5 rounded w-fit capitalize">Veli: {user.parentFirstName} {user.parentLastName}</span>
                            )}
                          </div>
                        </>
                      ) : user.role === 'parent' ? (
                        <div className="flex flex-col">
                          <span className="text-purple-400/80 font-black text-[9px] uppercase tracking-widest">Öğrenci Bağlantısı:</span>
                          <span className="text-white font-bold">{user.studentName || 'Bilinmiyor'}</span>
                        </div>
                      ) : (
                        <p className="italic text-slate-600">Sistem Üyesi</p>
                      )}
                    </div>
                  </div>
                  <div className="space-y-1">
                    <div>
                      <span className="text-slate-500 block text-[9px] uppercase tracking-wider font-bold">Son Görülme / Durum</span>
                      <span className="text-slate-300 font-bold tabular-nums">
                        {presenceService.isOnline(user) ? (
                          <span className="text-emerald-400 flex items-center gap-1.5 font-bold"><div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse shadow-[0_0_8px_rgba(16,185,129,0.8)]"></div> Çevrimiçi</span>
                        ) : (
                          <span className="text-slate-400 font-medium">
                            {presenceService.formatLastSeen(user)}
                          </span>
                        )}
                      </span>
                    </div>
                    <div>
                      <span className="text-slate-500 block text-[9px] uppercase tracking-wider font-bold">Kayıt Tarihi</span>
                      <span className="text-slate-300 font-bold tabular-nums">
                        {user.createdAt?.seconds ? new Date(user.createdAt.seconds * 1000).toLocaleDateString('tr-TR') : 'Bilinmiyor'}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-end gap-2 border-t border-white/5 pt-3">
                  {user.role !== 'parent' && user.role !== 'admin' && (
                    <button 
                      onClick={() => handleToggleRole(user.id, user.role)}
                      disabled={user.id === currentUser?.uid}
                      className={`bg-slate-950 p-2 rounded-lg transition-all border border-white/5 ${
                        user.id === currentUser?.uid 
                          ? 'opacity-20 cursor-not-allowed text-slate-700' 
                          : 'text-slate-500 hover:text-white hover:bg-slate-800 hover:border-red-500/30'
                      }`}
                      title={user.id === currentUser?.uid ? "Kendi rolünüzü değiştiremezsiniz" : "Rolü Değiştir (Koç/Öğrenci)"}
                    >
                      <Shield size={14} />
                    </button>
                  )}
                  <button 
                    onClick={() => {
                      setSelectedActivityUser(user);
                      setIsActivityModalOpen(true);
                    }}
                    className="bg-slate-950 p-2 rounded-lg transition-all border border-white/5 text-slate-500 hover:text-fuchsia-400 hover:bg-fuchsia-400/10 hover:border-fuchsia-400/30"
                    title="İşlem Geçmişi (Giriş/Çıkış)"
                  >
                    <Clock size={14} />
                  </button>
                  <button 
                    className={`bg-slate-950 p-2 rounded-lg transition-all border border-white/5 ${
                      user.id === currentUser?.uid 
                        ? 'opacity-20 cursor-not-allowed text-slate-700' 
                        : 'text-slate-500 hover:text-sky-400 hover:bg-sky-400/10 hover:border-sky-400/30'
                    }`}
                  >
                    <Edit2 size={14} />
                  </button>
                  <button 
                    onClick={() => handleDeleteUser(user.id)}
                    disabled={user.id === currentUser?.uid}
                    className={`bg-slate-950 p-2 rounded-lg transition-all border border-white/5 ${
                      user.id === currentUser?.uid 
                        ? 'opacity-20 cursor-not-allowed text-slate-700' 
                        : 'text-slate-500 hover:text-red-400 hover:bg-red-400/10 hover:border-red-400/30'
                    }`}
                    title={user.id === currentUser?.uid ? "Kendi hesabınızı silemezsiniz" : "Kullanıcıyı Sil"}
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      <AnimatePresence>
        {isActivityModalOpen && selectedActivityUser && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-slate-950/80 backdrop-blur-sm"
              onClick={() => setIsActivityModalOpen(false)}
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="relative bg-slate-900 border border-white/10 sm:rounded-3xl w-full max-w-xl h-full sm:h-auto sm:max-h-[80vh] flex flex-col shadow-2xl"
            >
              <div className="p-6 border-b border-white/5 flex items-center justify-between shrink-0 bg-slate-800/50 rounded-t-3xl">
                <div>
                  <h3 className="text-xl font-black text-white">{selectedActivityUser.firstName} {selectedActivityUser.lastName}</h3>
                  <p className="text-xs text-slate-400 font-medium uppercase tracking-widest mt-1">İşlem ve Oturum Geçmişi</p>
                </div>
                <button 
                  onClick={() => setIsActivityModalOpen(false)}
                  className="w-10 h-10 rounded-full bg-white/5 hover:bg-white/10 flex items-center justify-center transition-colors text-slate-400"
                >
                  <X size={20} />
                </button>
              </div>

              <div className="p-6 overflow-y-auto flex-1 bg-slate-900/50">
                {sessionsLoading ? (
                  <div className="py-12 flex flex-col items-center justify-center text-slate-500">
                    <Loader2 className="animate-spin text-fuchsia-500 mb-4" size={32} />
                    <p className="text-sm font-medium animate-pulse">Oturum kayıtları yükleniyor...</p>
                  </div>
                ) : userSessions.length === 0 ? (
                  <div className="py-12 flex flex-col items-center justify-center text-slate-500">
                    <div className="w-16 h-16 bg-white/5 border border-white/10 rounded-full flex items-center justify-center mb-4">
                       <Clock size={24} className="text-slate-600" />
                    </div>
                    <p className="text-sm font-medium">Bu kullanıcıya ait herhangi bir oturum kaydı bulunamadı.</p>
                  </div>
                ) : (
                  <div className="space-y-4 relative before:absolute before:inset-0 before:ml-5 before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-0.5 before:bg-gradient-to-b before:from-transparent before:via-slate-800 before:to-transparent">
                    {userSessions.map((session, i) => (
                      <div key={session.id} className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group is-active">
                        <div className="flex items-center justify-center w-10 h-10 rounded-full border-4 border-slate-900 bg-slate-800 shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2 shadow-xl z-10 transition-colors">
                           {session.type === 'login' ? (
                             <LogIn size={16} className="text-emerald-400" />
                           ) : (
                             <LogOut size={16} className="text-slate-400" />
                           )}
                        </div>
                        <div className="w-[calc(100%-4rem)] md:w-[calc(50%-2.5rem)] p-4 rounded-xl border border-white/5 bg-slate-950/50 shadow-lg">
                           <div className="flex items-center justify-between mb-1">
                              <span className={`text-sm font-bold ${session.type === 'login' ? 'text-emerald-400' : 'text-slate-400'}`}>
                                 {session.type === 'login' ? 'Oturum Açıldı' : 'Çıkış Yapıldı'}
                              </span>
                              <span className="text-[10px] text-slate-500 font-bold tabular-nums bg-white/5 px-2 py-0.5 rounded">
                                 {session.timestamp?.seconds ? new Date(session.timestamp.seconds * 1000).toLocaleString('tr-TR', { dateStyle: 'short', timeStyle: 'short' }) : 'Bilinmiyor'}
                              </span>
                           </div>
                           {session.type === 'login' && session.email && (
                              <p className="text-[10px] text-slate-500 mt-2 font-medium">
                                Giriş Yöntemi: <span className="text-slate-300 font-bold">{session.email}</span>
                              </p>
                           )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
