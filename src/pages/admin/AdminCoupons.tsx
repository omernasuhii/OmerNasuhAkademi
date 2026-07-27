import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { Ticket, Plus, Search, Trash2, Calendar, Users, X, Percent, BadgeDollarSign, Loader2 } from 'lucide-react';
import { collection, query, getDocs, addDoc, deleteDoc, doc, serverTimestamp, updateDoc } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { useAuth } from '../../lib/AuthContext';

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
  limitPerUser?: boolean;
  maxUsagePerUser?: number;
  userApplicability?: string;
  targetUserEmails?: string;
  targetCoachId?: string;
  ownerId?: string;
  status?: string;
  generatedFrom?: string;
  refereeId?: string;
  createdAt: any;
}

export default function AdminCoupons() {
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [userMap, setUserMap] = useState<Record<string, any>>({});
  const [coaches, setCoaches] = useState<{id: string, name: string}[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [selectedCouponForEdit, setSelectedCouponForEdit] = useState<Coupon | null>(null);

  const [couponType, setCouponType] = useState<'amount' | 'percentage'>('amount');
  const [formData, setFormData] = useState({
    code: '',
    name: '',
    discount: '',
    validity: '',
    noEndDate: true,
    endDate: '',
    limitUsage: false,
    maxUsage: '',
    limitPerUser: false,
    maxUsagePerUser: '',
    userApplicability: 'all',
    targetUserEmails: '',
    targetCoachId: ''
  });

  useEffect(() => {
    loadCoupons();
  }, []);

  const openModal = (coupon?: Coupon) => {
    if (coupon) {
      setSelectedCouponForEdit(coupon);
      setCouponType(coupon.type);
      setFormData({
        code: coupon.code,
        name: coupon.name,
        discount: coupon.discount.toString(),
        validity: coupon.validity || 'all',
        noEndDate: coupon.noEndDate,
        endDate: coupon.endDate || '',
        limitUsage: coupon.limitUsage,
        maxUsage: coupon.maxUsage ? coupon.maxUsage.toString() : '',
        limitPerUser: !!coupon.limitPerUser,
        maxUsagePerUser: coupon.maxUsagePerUser ? coupon.maxUsagePerUser.toString() : '',
        userApplicability: coupon.userApplicability || 'all',
        targetUserEmails: coupon.targetUserEmails || '',
        targetCoachId: coupon.targetCoachId || ''
      });
    } else {
      setSelectedCouponForEdit(null);
      setCouponType('amount');
      setFormData({
        code: '', name: '', discount: '', validity: '', noEndDate: true, endDate: '', limitUsage: false, maxUsage: '',
        limitPerUser: false, maxUsagePerUser: '', userApplicability: 'all', targetUserEmails: '', targetCoachId: ''
      });
    }
    setIsModalOpen(true);
  };

  const loadCoupons = async () => {
    setLoading(true);
    try {
      const usersSnap = await getDocs(collection(db, 'users'));
      const umap: Record<string, any> = {};
      const coachList: {id: string, name: string}[] = [];
      usersSnap.docs.forEach(d => {
        const data = d.data();
        umap[d.id] = data;
        if (data.role === 'coach') {
          coachList.push({ id: d.id, name: `${data.firstName || ''} ${data.lastName || ''}` });
        }
      });
      setUserMap(umap);
      setCoaches(coachList);

      const q = query(collection(db, 'coupons'));
      const snap = await getDocs(q);
      const data = snap.docs.map(d => ({ id: d.id, ...d.data() })) as Coupon[];
      const manualCoupons = data.filter(c => c.generatedFrom !== 'referral');
      setCoupons(manualCoupons.sort((a, b) => {
        // Safe sort assuming createdAt could be string or timestamp
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

  const handleSave = async () => {
    if (!formData.code || !formData.name || !formData.discount) return;
    
    setSaving(true);
    try {
      const couponData = {
        code: formData.code.toUpperCase(),
        name: formData.name,
        type: couponType,
        discount: Number(formData.discount),
        validity: formData.validity || 'all',
        noEndDate: formData.noEndDate,
        endDate: formData.noEndDate ? null : formData.endDate,
        limitUsage: formData.limitUsage,
        maxUsage: formData.limitUsage ? Number(formData.maxUsage) : null,
        limitPerUser: formData.limitPerUser,
        maxUsagePerUser: formData.limitPerUser ? Number(formData.maxUsagePerUser) : null,
        userApplicability: formData.userApplicability,
        targetUserEmails: formData.userApplicability === 'specific_users' ? formData.targetUserEmails : null,
        targetCoachId: formData.userApplicability === 'coach_users' ? formData.targetCoachId : null,
      };

      if (selectedCouponForEdit) {
        await updateDoc(doc(db, 'coupons', selectedCouponForEdit.id), couponData);
      } else {
        await addDoc(collection(db, 'coupons'), {
          ...couponData,
          currentUsage: 0,
          status: 'active',
          createdAt: serverTimestamp()
        });
      }

      setIsModalOpen(false);
      setFormData({
        code: '', name: '', discount: '', validity: '', noEndDate: true, endDate: '', limitUsage: false, maxUsage: '',
        limitPerUser: false, maxUsagePerUser: '', userApplicability: 'all', targetUserEmails: '', targetCoachId: ''
      });
      loadCoupons();
    } catch (e) {
      console.error("Kupon kaydedilirken hata:", e);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (confirm('Bu kuponu silmek istediğinize emin misiniz?')) {
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
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-[10px] font-black uppercase tracking-widest mb-2">
            <Ticket size={12} />
            Müşteri İndirimleri
          </div>
          <h1 className="text-3xl md:text-5xl font-black tracking-tight text-white">
            Kuponlar
          </h1>
          <p className="text-slate-400 font-medium max-w-xl">
            Müşterilerinize özel teklifler ve indirimler sunarak satışlarınızı artırın.
          </p>
        </motion.div>
        
        <button
          onClick={() => openModal()}
          className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-xl font-bold transition-all shadow-lg shadow-blue-500/20"
        >
          <Plus size={20} />
          Yeni Kupon
        </button>
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
           <h3 className="text-xl font-bold text-white mb-2">Kupon Bulunamadı</h3>
           <p className="text-slate-500 mb-6 max-w-sm">Şu an için oluşturulmuş bir kuponunuz bulunmuyor.</p>
           <button
             onClick={() => openModal()}
             className="px-6 py-2 bg-white/5 hover:bg-white/10 text-white rounded-xl font-bold transition-colors"
           >
             Hemen Oluştur
           </button>
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
                onClick={() => openModal(coupon)}
                className="bg-white/[0.02] border border-white/5 rounded-3xl p-6 relative overflow-hidden cursor-pointer hover:bg-white/[0.04] transition-colors"
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
                    <button onClick={(e) => { e.stopPropagation(); handleDelete(coupon.id); }} className="text-slate-500 hover:text-red-400 transition-colors z-10">
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
                                  onClick={async (e) => {
                                     e.stopPropagation();
                                     if(confirm('Kullanıcının görevleri tamamladığını onaylayıp kuponu aktifleştirmek istiyor musunuz?')) {
                                        await updateDoc(doc(db, 'coupons', coupon.id), { status: 'active' });
                                        loadCoupons();
                                     }
                                  }}
                                  className="px-2 py-1 bg-amber-500 hover:bg-amber-600 text-white text-[10px] rounded font-bold uppercase transition relative z-10"
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

      {/* NEW COUPON MODAL */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
              className="bg-[#0f172a] sm:rounded-3xl border border-white/10 w-full max-w-2xl overflow-hidden shadow-2xl relative flex flex-col h-full sm:h-auto sm:max-h-[90vh]"
          >
            <div className="p-6 border-b border-white/5 flex justify-between items-center bg-slate-900/50 shrink-0">
              <h2 className="text-xl font-black text-white">{selectedCouponForEdit ? 'Kupon Detayları / Düzenle' : 'Yeni Kupon Oluştur'}</h2>
              <button 
                onClick={() => setIsModalOpen(false)}
                className="w-8 h-8 rounded-full bg-white/5 hover:bg-white/10 flex items-center justify-center transition-colors text-slate-400"
              >
                <X size={16} />
              </button>
            </div>

            <div className="p-6 overflow-y-auto flex-1 space-y-6">
              <div>
                 <label className="text-sm font-medium text-slate-400 block mb-3">Sunmak istediğiniz kupon türünü seçin:</label>
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <button 
                      onClick={() => setCouponType('amount')}
                      className={`p-4 rounded-2xl flex flex-col items-center justify-center gap-2 border-2 transition-all ${couponType === 'amount' ? 'bg-orange-500 text-white border-orange-500 shadow-lg shadow-orange-500/20' : 'bg-slate-800 text-slate-300 border-transparent hover:border-slate-700'}`}
                    >
                       <BadgeDollarSign size={24} />
                       <span className="font-bold">₺ İndirim</span>
                    </button>
                    <button 
                      onClick={() => setCouponType('percentage')}
                      className={`p-4 rounded-2xl flex flex-col items-center justify-center gap-2 border-2 transition-all ${couponType === 'percentage' ? 'bg-blue-500 text-white border-blue-500 shadow-lg shadow-blue-500/20' : 'bg-slate-800 text-slate-300 border-transparent hover:border-slate-700'}`}
                    >
                       <Percent size={24} />
                       <span className="font-bold">% İndirim</span>
                    </button>
                 </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                 <div>
                   <label className="text-sm font-medium text-slate-400 block mb-2">Kupon kodu <span className="text-red-400">*</span></label>
                   <input 
                     type="text" 
                     className="w-full bg-[#070b14] border border-white/10 rounded-xl px-4 py-3 text-white outline-none focus:border-blue-500 font-mono uppercase"
                     placeholder="Ör. YAZINIDIRIMI20"
                     value={formData.code}
                     onChange={(e) => setFormData({...formData, code: e.target.value})}
                   />
                 </div>
                 <div>
                   <label className="text-sm font-medium text-slate-400 block mb-2">Kupon adı <span className="text-red-400">*</span></label>
                   <input 
                     type="text" 
                     className="w-full bg-[#070b14] border border-white/10 rounded-xl px-4 py-3 text-white outline-none focus:border-blue-500"
                     placeholder="Ör. Yaz indirimi"
                     value={formData.name}
                     onChange={(e) => setFormData({...formData, name: e.target.value})}
                   />
                 </div>
              </div>

              <div>
                 <label className="text-sm font-medium text-slate-400 block mb-2">İndirim Miktarı ({couponType === 'amount' ? '₺' : '%'}) <span className="text-red-400">*</span></label>
                 <input 
                   type="number" 
                   className="w-full bg-[#070b14] border border-white/10 rounded-xl px-4 py-3 text-white outline-none focus:border-blue-500"
                   placeholder="Ör. 100"
                   value={formData.discount}
                   onChange={(e) => setFormData({...formData, discount: e.target.value})}
                 />
              </div>

              <div className="border-t border-white/5 pt-6">
                 <label className="text-sm font-medium text-slate-400 block mb-2">Geçerlilik <span className="text-red-400">*</span></label>
                 <select 
                   className="w-full bg-[#070b14] border border-white/10 rounded-xl px-4 py-3 text-white outline-none focus:border-blue-500"
                   value={formData.validity}
                   onChange={(e) => setFormData({...formData, validity: e.target.value})}
                 >
                   <option value="" disabled>Birini seçin</option>
                   <option value="all">Tüm Alışverişler</option>
                   <option value="all_subscriptions">Tüm ücretli abonelikler</option>
                   <option value="specific_subscription">Belirli bir abonelik</option>
                   <option value="all_programs">Tüm programlar</option>
                   <option value="specific_program">Belirli bir program</option>
                   <option value="specific_ticket">Belirli bir bilet</option>
                   <option value="specific_event">Belirli bir etkinlik</option>
                   <option value="all_products">Tüm ürünler</option>
                   <option value="specific_products">Belirli ürünler</option>
                   <option value="specific_category">Belirli kategori</option>
                   <option value="all_services">Tüm hizmetler</option>
                   <option value="specific_service">Belirli bir hizmet</option>
                   <option value="minimum_order">Minimum sipariş toplamı</option>
                 </select>
              </div>

              <div className="border-t border-white/5 pt-6">
                 <label className="text-sm font-medium text-slate-400 block mb-4">Geçerlilik süresi</label>
                 <div className="flex flex-col gap-4">
                   <label className="flex items-center gap-3 cursor-pointer">
                     <input 
                       type="checkbox" 
                       checked={formData.noEndDate}
                       onChange={(e) => setFormData({...formData, noEndDate: e.target.checked})}
                       className="w-5 h-5 rounded border-white/20 bg-transparent text-blue-500 focus:ring-blue-500" 
                     />
                     <span className="text-slate-300 font-medium">Bir bitiş tarihi belirleme</span>
                   </label>
                   
                   {!formData.noEndDate && (
                     <input 
                       type="date"
                       className="w-full bg-[#070b14] border border-white/10 rounded-xl px-4 py-3 text-white outline-none focus:border-blue-500"
                       value={formData.endDate}
                       onChange={(e) => setFormData({...formData, endDate: e.target.value})}
                     />
                   )}
                 </div>
              </div>

              <div className="border-t border-white/5 pt-6">
                 <label className="text-sm font-medium text-slate-400 block mb-4">Kullanım Sınırları</label>
                 <div className="flex flex-col gap-4">
                   <label className="flex items-center gap-3 cursor-pointer">
                     <input 
                       type="checkbox" 
                       checked={formData.limitUsage}
                       onChange={(e) => setFormData({...formData, limitUsage: e.target.checked})}
                       className="w-5 h-5 rounded border-white/20 bg-transparent text-blue-500 focus:ring-blue-500" 
                     />
                     <span className="text-slate-300 font-medium">Toplam kullanım sayısını sınırla</span>
                   </label>
                   
                   {formData.limitUsage && (
                     <input 
                       type="number"
                       className="w-full bg-[#070b14] border border-white/10 rounded-xl px-4 py-3 text-white outline-none focus:border-blue-500 mb-4"
                       placeholder="Maksimum kullanım sayısı (Ör. 100)"
                       value={formData.maxUsage}
                       onChange={(e) => setFormData({...formData, maxUsage: e.target.value})}
                     />
                   )}

                   <label className="flex items-center gap-3 cursor-pointer">
                     <input 
                       type="checkbox" 
                       checked={formData.limitPerUser}
                       onChange={(e) => setFormData({...formData, limitPerUser: e.target.checked})}
                       className="w-5 h-5 rounded border-white/20 bg-transparent text-blue-500 focus:ring-blue-500" 
                     />
                     <span className="text-slate-300 font-medium">Öğrenci başına kullanım sayısını sınırla</span>
                   </label>
                   
                   {formData.limitPerUser && (
                     <input 
                       type="number"
                       className="w-full bg-[#070b14] border border-white/10 rounded-xl px-4 py-3 text-white outline-none focus:border-blue-500"
                       placeholder="Kişi başı maksimum kullanım sayısı (Ör. 1)"
                       value={formData.maxUsagePerUser}
                       onChange={(e) => setFormData({...formData, maxUsagePerUser: e.target.value})}
                     />
                   )}
                 </div>
              </div>

              <div className="border-t border-white/5 pt-6">
                 <label className="text-sm font-medium text-slate-400 block mb-2">Hedef Kitle <span className="text-red-400">*</span></label>
                 <select 
                   className="w-full bg-[#070b14] border border-white/10 rounded-xl px-4 py-3 text-white outline-none focus:border-blue-500 mb-4"
                   value={formData.userApplicability}
                   onChange={(e) => setFormData({...formData, userApplicability: e.target.value})}
                 >
                   <option value="all">Tüm Kullanıcılar</option>
                   <option value="specific_users">Belirli Öğrenciler</option>
                   <option value="coach_users">Belirli Bir Koçun Öğrencileri</option>
                 </select>

                 {formData.userApplicability === 'specific_users' && (
                   <div className="animate-in fade-in slide-in-from-top-2">
                     <label className="text-sm font-medium text-slate-400 block mb-2">Öğrenci E-posta Adresleri (Virgülle ayırın)</label>
                     <textarea 
                       className="w-full bg-[#070b14] border border-white/10 rounded-xl px-4 py-3 text-white outline-none focus:border-blue-500 h-24"
                       placeholder="ornek@email.com, test@email.com"
                       value={formData.targetUserEmails}
                       onChange={(e) => setFormData({...formData, targetUserEmails: e.target.value})}
                     ></textarea>
                   </div>
                 )}

                 {formData.userApplicability === 'coach_users' && (
                   <div className="animate-in fade-in slide-in-from-top-2">
                     <label className="text-sm font-medium text-slate-400 block mb-2">Koç Seçimi</label>
                     <select 
                       className="w-full bg-[#070b14] border border-white/10 rounded-xl px-4 py-3 text-white outline-none focus:border-blue-500"
                       value={formData.targetCoachId}
                       onChange={(e) => setFormData({...formData, targetCoachId: e.target.value})}
                     >
                       <option value="">Koç Seçin</option>
                       {coaches.map(c => (
                         <option key={c.id} value={c.id}>{c.name}</option>
                       ))}
                     </select>
                   </div>
                 )}
              </div>

              {selectedCouponForEdit && (selectedCouponForEdit as any).usedBy && Object.keys((selectedCouponForEdit as any).usedBy).length > 0 && (
                <div className="border-t border-white/5 pt-6">
                  <label className="text-sm font-medium text-slate-400 block mb-4">Kullanım Geçmişi</label>
                  <div className="bg-slate-900/50 rounded-xl max-h-48 overflow-auto border border-white/5">
                     <table className="w-full text-left text-sm text-slate-300">
                        <thead className="bg-white/5 font-medium text-slate-400 sticky top-0">
                           <tr>
                              <th className="px-4 py-2">Kullanıcı</th>
                              <th className="px-4 py-2">Kullanım Miktarı</th>
                           </tr>
                        </thead>
                        <tbody className="divide-y divide-white/5">
                           {Object.entries((selectedCouponForEdit as any).usedBy).map(([uid, count]) => {
                             const user = userMap[uid];
                             const userLabel = user ? `${user.firstName} ${user.lastName}` : 'Bilinmeyen / Silinmiş Kullanıcı';
                             return (
                               <tr key={uid}>
                                  <td className="px-4 py-3">{userLabel}</td>
                                  <td className="px-4 py-3">{String(count)}</td>
                               </tr>
                             )
                           })}
                        </tbody>
                     </table>
                  </div>
                </div>
              )}

            </div>

            <div className="p-6 border-t border-white/5 flex justify-end gap-3 bg-slate-900/50 shrink-0">
               <button 
                 onClick={() => setIsModalOpen(false)}
                 className="px-6 py-2.5 rounded-xl font-bold bg-white/5 text-white hover:bg-white/10 transition-colors"
               >
                 İptal
               </button>
               <button 
                 onClick={handleSave}
                 disabled={saving || !formData.code || !formData.name || !formData.discount || !formData.validity || (!formData.noEndDate && !formData.endDate) || (formData.limitUsage && !formData.maxUsage)}
                 className="px-6 py-2.5 rounded-xl font-bold bg-blue-600 text-white hover:bg-blue-700 transition-colors disabled:opacity-50 flex items-center gap-2 shadow-lg shadow-blue-500/20"
               >
                 {saving ? <Loader2 className="w-5 h-5 animate-spin"/> : null}
                 {selectedCouponForEdit ? 'Değişiklikleri Kaydet' : 'Kupon Oluştur'}
               </button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
}
