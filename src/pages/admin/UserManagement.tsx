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
  XCircle
} from 'lucide-react';
import { collection, getDocs, doc, updateDoc, deleteDoc, query, orderBy } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { useAuth } from '../../lib/AuthContext';

export default function UserManagement() {
  const { user: currentUser } = useAuth();
  const [users, setUsers] = useState<any[]>([]);
  const [coaches, setCoaches] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');

  useEffect(() => {
    async function fetchData() {
      try {
        const q = query(collection(db, 'users'), orderBy('createdAt', 'desc'));
        const snap = await getDocs(q);
        const allUsers = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        setUsers(allUsers);
        setCoaches(allUsers.filter((u: any) => u.role === 'coach'));
      } catch (err) {
        console.error("Fetch data error:", err);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, []);

  const handleAssignCoach = async (studentId: string, coachId: string) => {
    try {
      await updateDoc(doc(db, 'users', studentId), { coachId });
      setUsers(prev => prev.map(u => u.id === studentId ? { ...u, coachId } : u));
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
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-950/50 border-b border-white/5">
                <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-slate-500">Kullanıcı</th>
                <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-slate-500">Rol</th>
                <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-slate-500">Sorumlu Koç</th>
                <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-slate-500">Bağlantı / Detay</th>
                <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-slate-500">Kayıt Tarihi</th>
                <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-slate-500 text-right">İşlemler</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {loading ? (
                <tr>
                  <td colSpan={5} className="px-6 py-20 text-center">
                    <Loader2 className="animate-spin mx-auto text-red-500 mb-4" size={32} />
                    <p className="text-slate-500 text-sm font-medium animate-pulse">Kullanıcılar yükleniyor...</p>
                  </td>
                </tr>
              ) : filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-20 text-center">
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
                        <div className={`w-10 h-10 rounded-full bg-slate-800 border border-white/10 overflow-hidden flex items-center justify-center text-slate-400 font-bold uppercase ring-2 ring-white/0 group-hover:ring-red-500/20 transition-all ${user.role === 'parent' ? 'opacity-70' : ''}`}>
                          {user.photoURL ? (
                            <img src={user.photoURL} alt={user.firstName} className="w-full h-full object-cover" />
                          ) : (
                            user.firstName?.[0] || 'U'
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
      </div>
    </div>
  );
}
