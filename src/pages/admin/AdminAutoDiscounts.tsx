import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { Ticket, Search, Trash2, Calendar, Users, Percent, BadgeDollarSign, Loader2 } from 'lucide-react';
import { collection, query, getDocs, deleteDoc, doc, updateDoc } from 'firebase/firestore';
import { db } from '../../lib/firebase';

interface Coupon {
  id: string;
  code: string;
  name: string;
  type: 'amount' | 'percentage';
  discount: number;
  validity?: string;
  noEndDate: boolean;
  endDate: string;
  limitUsage: boolean;
  maxUsage: number;
  currentUsage: number;
  ownerId?: string;
  status?: string;
  generatedFrom?: string;
  refereeId?: string;
  createdAt: any;
}

export default function AdminAutoDiscounts() {
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [userMap, setUserMap] = useState<Record<string, any>>({});
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');

  useEffect(() => {
    loadCoupons();
  }, []);

  const loadCoupons = async () => {
    setLoading(true);
    try {
      const usersSnap = await getDocs(collection(db, 'users'));
      const umap: Record<string, any> = {};
      usersSnap.docs.forEach(d => {
        umap[d.id] = d.data();
      });
      setUserMap(umap);

      const q = query(collection(db, 'coupons'));
      const snap = await getDocs(q);
      const data = snap.docs.map(d => ({ id: d.id, ...d.data() })) as Coupon[];
      const autoCoupons = data.filter(c => c.generatedFrom === 'referral');
      setCoupons(autoCoupons.sort((a, b) => {
        const dateA = a.createdAt?.seconds ? a.createdAt.seconds * 1000 : new Date(a.createdAt).getTime();
        const dateB = b.createdAt?.seconds ? b.createdAt.seconds * 1000 : new Date(b.createdAt).getTime();
        return (dateB || 0) - (dateA || 0);
      }));
    } catch (error) {
      console.error("Kuponlar yüklenirken hata:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (confirm('Bu indirimi silmek istediğinize emin misiniz?')) {
      await deleteDoc(doc(db, 'coupons', id));
      loadCoupons();
    }
  };

  const getCouponStatus = (coupon: Coupon) => {
    const isExpired = !coupon.noEndDate && coupon.endDate && new Date(coupon.endDate) < new Date();
    const isDepleted = coupon.limitUsage && coupon.currentUsage >= coupon.maxUsage;
    let status = isExpired ? 'expired' : isDepleted ? 'depleted' : 'active';
    if (coupon.status === 'pending') status = 'pending';
    if (coupon.status === 'used') status = 'used';
    return status;
  };

  const filteredCoupons = coupons.filter(c => {
    const matchesSearch = c.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          c.code.toLowerCase().includes(searchTerm.toLowerCase());
    
    if (!matchesSearch) return false;
    
    if (filterStatus === 'all') return true;
    const currentStatus = getCouponStatus(c);
    
    return currentStatus === filterStatus;
  });

  return (
    <div className="max-w-7xl mx-auto space-y-8 animate-in fade-in duration-500 pb-20">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 pb-6 border-b border-white/5">
        <motion.div 
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className="space-y-2"
        >
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 text-[10px] font-black uppercase tracking-widest mb-2">
            <Ticket size={12} />
            Sistem Otomasyonları
          </div>
          <h1 className="text-3xl md:text-5xl font-black tracking-tight text-white">
            Otomatik İndirimler
          </h1>
          <p className="text-slate-400 font-medium max-w-xl">
            Sistem tarafından oluşturulan davet ödülleri ve otomatik kazanılmış indirimler bu sayfada listelenir.
          </p>
        </motion.div>
      </div>

      <div className="flex flex-col md:flex-row gap-4">
        <div className="bg-[#070b14] border border-white/5 rounded-[32px] p-4 flex items-center flex-1">
           <Search className="text-slate-500 ml-4 mr-3" size={20} />
           <input 
             type="text" 
             placeholder="Kupon adı veya kodu ile ara..."
             value={searchTerm}
             onChange={(e) => setSearchTerm(e.target.value)}
             className="flex-1 bg-transparent border-none text-white outline-none placeholder:text-slate-500 font-medium text-sm"
           />
        </div>
        <div className="bg-[#070b14] border border-white/5 rounded-[32px] px-6 py-4 flex items-center md:w-64">
           <select 
             value={filterStatus}
             onChange={(e) => setFilterStatus(e.target.value)}
             className="w-full bg-transparent border-none text-white outline-none font-medium text-sm cursor-pointer"
           >
             <option value="all" className="bg-slate-900">Tüm Durumlar</option>
             <option value="active" className="bg-slate-900">Aktif</option>
             <option value="expired" className="bg-slate-900">Süresi Doldu</option>
             <option value="depleted" className="bg-slate-900">Tükendi</option>
             <option value="pending" className="bg-slate-900">Bekliyor</option>
             <option value="used" className="bg-slate-900">Kullanıldı</option>
           </select>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center p-20">
          <Loader2 className="animate-spin text-blue-500" size={32} />
        </div>
      ) : filteredCoupons.length === 0 ? (
        <div className="bg-slate-900/50 border border-white/5 rounded-[32px] p-12 text-center flex flex-col items-center">
           <div className="w-16 h-16 bg-blue-500/10 rounded-2xl flex items-center justify-center mb-6 text-blue-400">
             <Ticket size={32} strokeWidth={1.5} />
           </div>
           <h3 className="text-xl font-bold text-white mb-2">İndirim Bulunamadı</h3>
           <p className="text-slate-500 mb-6 max-w-sm">Sistem tarafından otomatik oluşturulmuş veya davet üzerinden kazanılmış bir indirim kuponu bulunmuyor.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredCoupons.map(coupon => {
            const status = getCouponStatus(coupon);

            const ownerName = coupon.ownerId && userMap[coupon.ownerId] 
              ? `${userMap[coupon.ownerId].firstName} ${userMap[coupon.ownerId].lastName}` 
              : 'Bilinmeyen Kullanıcı';
            
            const refereeName = coupon.refereeId && userMap[coupon.refereeId]
              ? `${userMap[coupon.refereeId].firstName} ${userMap[coupon.refereeId].lastName}`
              : 'Bilinmeyen Kullanıcı';

            return (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                key={coupon.id}
                className="bg-white/[0.02] border border-white/5 rounded-3xl p-6 relative overflow-hidden"
              >
                 <div className="flex justify-between items-start mb-4">
                    <div className={`px-2 py-1 rounded text-[10px] font-bold uppercase ${
                      status === 'active' ? 'bg-emerald-500/10 text-emerald-400' : 
                      status === 'pending' ? 'bg-amber-500/10 text-amber-400' :
                      status === 'used' || status === 'depleted' ? 'bg-slate-500/10 text-slate-400' :
                      'bg-red-500/10 text-red-400'
                    }`}>
                       {status === 'active' ? 'Aktif' : 
                        status === 'expired' ? 'Süresi Doldu' : 
                        status === 'pending' ? 'Bekliyor' :
                        status === 'used' ? 'Kullanıldı' : 'Tükendi'}
                    </div>
                    <button onClick={() => handleDelete(coupon.id)} className="text-slate-500 hover:text-red-400 transition-colors">
                      <Trash2 size={16} />
                    </button>
                 </div>
                 
                 <div className="mb-4">
                   <h3 className="text-xl font-black text-white">{coupon.name}</h3>
                   <div className="inline-flex items-center gap-2 mt-2 bg-blue-500/10 px-3 py-1.5 rounded-lg border border-blue-500/20">
                     <Ticket size={14} className="text-blue-400" />
                     <span className="font-mono text-sm font-bold text-blue-300">{coupon.code}</span>
                   </div>
                 </div>

                 <div className="text-3xl font-black text-emerald-400 mb-6">
                    {coupon.type === 'amount' ? `₺${coupon.discount}` : `%${coupon.discount}`}
                    <span className="text-sm font-medium text-slate-500 ml-2">İndirim</span>
                 </div>

                 <div className="space-y-2 text-sm text-slate-400">
                    <div className="flex items-center gap-2">
                       <Calendar size={14} />
                       {coupon.noEndDate ? 'Süresiz' : `Bitiş: ${new Date(coupon.endDate).toLocaleDateString()}`}
                    </div>
                    <div className="flex items-center gap-2">
                       <Users size={14} />
                       {coupon.limitUsage ? `${coupon.currentUsage} / ${coupon.maxUsage} Kullanım` : `${coupon.currentUsage} Kez kullanıldı (Sınırsız)`}
                    </div>
                    {coupon.ownerId && (
                      <div className="mt-4 p-3 bg-slate-900/50 rounded-xl space-y-2 border border-slate-800">
                         <div className="flex justify-between items-center">
                            <div className="flex items-center gap-2 text-indigo-400">
                               <Ticket size={14} />
                               Kişiye Özel ({coupon.generatedFrom === 'referral' ? 'Davet Ödülü' : 'Sistem'})
                            </div>
                            {status === 'pending' && (
                               <button
                                  onClick={async () => {
                                     if(confirm('Kullanıcının görevleri tamamladığını onaylayıp kuponu aktifleştirmek istiyor musunuz?')) {
                                        await updateDoc(doc(db, 'coupons', coupon.id), { status: 'active' });
                                        loadCoupons();
                                     }
                                  }}
                                  className="px-2 py-1 bg-amber-500 hover:bg-amber-600 text-white text-[10px] rounded font-bold uppercase transition"
                               >
                                 Aktifleştir
                               </button>
                            )}
                         </div>
                         <div className="text-white font-medium">Sahibi: {ownerName}</div>
                         {coupon.status === 'pending' && coupon.refereeId && (
                           <div className="text-amber-400 text-xs mt-1">
                             "{refereeName}" adlı kişinin görevini tamamlaması bekleniyor.
                           </div>
                         )}
                      </div>
                    )}
                 </div>
                 
                 <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/5 rounded-bl-[100px] -z-10" />
              </motion.div>
            )
          })}
        </div>
      )}
    </div>
  );
}
