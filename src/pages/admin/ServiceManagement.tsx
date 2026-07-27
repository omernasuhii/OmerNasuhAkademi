import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Settings, 
  Plus, 
  Trash2, 
  Edit3, 
  Users, 
  Clock, 
  CreditCard, 
  Video, 
  Repeat, 
  MapPin, 
  DoorOpen,
  Filter,
  CheckCircle2,
  CheckCircle,
  XCircle,
  Loader2,
  ChevronDown,
  Check,
  Search,
  Info
} from 'lucide-react';
import { appointmentService, Service, Room } from '../../services/appointmentService';

export default function ServiceManagement() {
  const [services, setServices] = useState<Service[]>([]);
  const [rooms, setRooms] = useState<Room[]>([]);
  const [coaches, setCoaches] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [activeTab, setActiveTab] = useState('details');
  const [editingService, setEditingService] = useState<Service | null>(null);
  const [saving, setSaving] = useState(false);

  // Form State
  const [formData, setFormData] = useState<Partial<Service>>({
    title: '',
    type: 'one-on-one',
    description: '',
    basePrice: 0,
    paymentTypes: ['cash'],
    isOnlineAvailable: true,
    allowOnlineRequest: true,
    isActive: true,
    assignedCoachIds: [],
    assignedRoomIds: [],
    cancellationPolicy: 'Randevuya 24 saat kala yapılan iptallerde ücret iadesi yapılmaz.',
    locationType: 'default',
    customLocation: '',
    // Birebir
    duration: 45,
    bufferTime: 15,
    approvalType: 'automatic',
    variablePricingEnabled: false,
    pricingVariations: [],
    multipleRequestsPerSession: false,
    // Ders/Kurs
    maxParticipants: 10,
    allowCoachSubstitution: false,
    isRecurring: false,
    recurringDays: [],
    enableWaitingList: false,
    maxPeoplePerRequest: 1
  });

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    if (editingService) {
      setFormData(editingService);
    } else {
      setFormData({
        title: '',
        type: 'one-on-one',
        description: '',
        basePrice: 0,
        paymentTypes: ['cash'],
        isOnlineAvailable: true,
        allowOnlineRequest: true,
        isActive: true,
        assignedCoachIds: [],
        assignedRoomIds: [],
        cancellationPolicy: 'Randevuya 24 saat kala yapılan iptallerde ücret iadesi yapılmaz.',
        locationType: 'default',
        customLocation: '',
        duration: 45,
        bufferTime: 15,
        approvalType: 'automatic',
        variablePricingEnabled: false,
        pricingVariations: [],
        multipleRequestsPerSession: false,
        maxParticipants: 10,
        allowCoachSubstitution: false,
        isRecurring: false,
        recurringDays: [],
        enableWaitingList: false,
        maxPeoplePerRequest: 1
      });
    }
  }, [editingService, showModal]);

  const loadData = async () => {
    try {
      const [sData, rData, cData] = await Promise.all([
        appointmentService.getServices(),
        appointmentService.getRooms(),
        appointmentService.getCoaches()
      ]);
      setServices(sData);
      setRooms(rData);
      setCoaches(cData as any[]);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      if (editingService?.id) {
        await appointmentService.updateService(editingService.id, formData);
      } else {
        await appointmentService.createService(formData as any);
      }
      setShowModal(false);
      loadData();
    } catch (err) {
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    // Iframe içinde window.confirm sorun yaratabileceği için direkt siliyor
    // (veya onay mantığı farklı bir state ile yönetilebilir)
    try {
      await appointmentService.deleteService(id);
      loadData();
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-700">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-3xl font-black text-white tracking-tight uppercase">Servis & Hizmet Ayarları</h1>
          <p className="text-slate-500 mt-2 font-medium">Birebir koçluk ve danışmanlık standartlarını buradan yönetin.</p>
        </div>

        <button 
          onClick={() => {
            setEditingService(null);
            setShowModal(true);
          }}
          className="bg-blue-600 hover:bg-blue-500 text-white px-6 py-3 rounded-2xl font-bold flex items-center gap-2 shadow-lg shadow-blue-600/20 transition-all"
        >
          <Plus size={20} /> Yeni Hizmet Ekle
        </button>
      </header>

      {/* Services Tabs/List */}
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-bold text-white">Hizmet Listesi</h2>
          <div className="flex gap-2">
            {['one-on-one'].map(t => (
              <span key={t} className="text-[10px] font-black uppercase tracking-widest px-3 py-1 bg-slate-900 text-slate-500 rounded-full border border-white/5">
                {t === 'one-on-one' ? 'Birebir' : t === 'lesson' ? 'Ders' : 'Kurs'}
              </span>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4">
          {services.map((service) => (
            <div key={service.id} className="group bg-slate-900/20 hover:bg-slate-900/40 border border-white/5 p-6 rounded-[32px] transition-all flex flex-col md:flex-row md:items-center justify-between gap-6">
              <div className="flex items-center gap-6">
                <div className={`w-14 h-14 rounded-2xl flex items-center justify-center ${
                  service.type === 'one-on-one' ? 'bg-blue-500/10 text-blue-400' :
                  service.type === 'lesson' ? 'bg-amber-500/10 text-amber-400' :
                  'bg-purple-500/10 text-purple-400'
                }`}>
                  {service.type === 'one-on-one' ? <Users size={24} /> : service.type === 'lesson' ? <Clock size={24} /> : <Repeat size={24} />}
                </div>
                <div>
                  <div className="flex items-center gap-3 flex-wrap">
                    <h3 className="text-lg font-bold text-white">{service.title}</h3>
                    <span className="text-[10px] font-black uppercase tracking-widest px-2 py-0.5 bg-white/5 text-slate-400 rounded-md">
                       {service.duration} DK {service.bufferTime ? `(+${service.bufferTime} DK)` : ''}
                    </span>
                    {service.locationType === 'student_address' && (
                      <span className="text-[10px] font-black uppercase tracking-widest px-2 py-0.5 bg-emerald-500/10 text-emerald-400 rounded-md flex items-center gap-1">
                        <MapPin size={10} /> Öğrenci Adresinde
                      </span>
                    )}
                    {service.variablePricingEnabled && (
                      <span className="text-[10px] font-black uppercase tracking-widest px-2 py-0.5 bg-blue-500/10 text-blue-400 rounded-md">
                        Değişken Ücret
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-slate-500 mt-1 line-clamp-1">{service.description}</p>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-3">
                <div className="flex -space-x-2">
                    {service.assignedCoachIds.slice(0, 3).map(id => (
                      <div key={id} className="w-8 h-8 rounded-full border-2 border-slate-950 bg-slate-800 flex items-center justify-center text-[8px] font-bold text-slate-400">
                        {id.slice(0, 1).toUpperCase()}
                      </div>
                    ))}
                    {service.assignedCoachIds.length > 3 && (
                      <div className="w-8 h-8 rounded-full border-2 border-slate-950 bg-slate-900 flex items-center justify-center text-[8px] font-bold text-white">
                        +{service.assignedCoachIds.length - 3}
                      </div>
                    )}
                </div>

                <div className="h-8 w-px bg-white/10 mx-2 hidden md:block"></div>

                <div className="flex items-center gap-4">
                  <div className="text-right luxury-text">
                    <p className="text-[10px] font-black text-slate-600 uppercase tracking-widest">Temel Ücret</p>
                    <p className="text-sm font-bold text-white font-mono">{service.basePrice} ₺</p>
                  </div>
                  <button 
                    onClick={() => {
                      setEditingService(service);
                      setShowModal(true);
                    }}
                    className="p-3 bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white rounded-xl transition-all"
                  >
                    <Edit3 size={18} />
                  </button>
                  <button 
                    onClick={() => handleDelete(service.id!)}
                    className="p-3 bg-red-500/10 hover:bg-red-500/20 text-red-500 rounded-xl transition-all"
                  >
                    <Trash2 size={18} />
                  </button>
                </div>
              </div>
            </div>
          ))}

          {services.length === 0 && !loading && (
            <div className="text-center py-20 bg-slate-900/10 border border-dashed border-white/5 rounded-[40px]">
               <Settings className="mx-auto text-slate-700 mb-4" size={48} />
               <h3 className="text-xl font-bold text-white">Henüz Hizmet Eklenmemiş</h3>
               <p className="text-slate-500 mt-2">Birebir, Ders veya Kurs ekleyerek başlayın.</p>
            </div>
          )}
        </div>
      </div>

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4">
          <div className="absolute inset-0 bg-slate-950/80 backdrop-blur-sm" onClick={() => setShowModal(false)}></div>
          <motion.div 
            initial={{ opacity: 0, scale: 0.98, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            className="bg-[#f0f2f5] w-full h-full md:w-[95%] md:h-[95vh] rounded-[32px] shadow-2xl overflow-hidden z-10 flex flex-col font-sans"
          >
            {/* Top Bar */}
            <div className="flex flex-col sm:flex-row items-center justify-between px-8 py-6 border-b border-slate-200 bg-white shrink-0">
              <div className="mb-4 sm:mb-0">
                <div className="text-[10px] text-slate-400 mb-1 flex items-center gap-2 font-black uppercase tracking-widest">
                  <span className="hover:text-blue-500 cursor-pointer transition-colors" onClick={() => setShowModal(false)}>Randevulu Hizmetler</span> 
                  <span className="text-slate-300">/</span> 
                  <span className="text-slate-800">{formData.title || 'Yeni Hizmet'}</span>
                </div>
                <div className="flex items-center gap-4">
                  <h2 className="text-2xl font-black text-slate-900 tracking-tight">{formData.title || 'Yeni Hizmet Oluştur'}</h2>
                  <div className="bg-blue-50 text-blue-600 text-[10px] font-black uppercase tracking-widest px-3 py-1 rounded-lg border border-blue-100 flex items-center gap-1 shadow-sm">
                    Birebir Koçluk <ChevronDown size={14} className="opacity-50" />
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <button 
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-6 py-3 rounded-2xl border border-slate-200 text-slate-600 font-bold hover:bg-slate-50 transition-all text-sm"
                >
                  İptal
                </button>
                <button 
                  type="button"
                  onClick={handleSave}
                  disabled={saving}
                  className="px-8 py-3 rounded-2xl bg-blue-600 text-white font-bold hover:bg-blue-700 hover:shadow-xl hover:shadow-blue-600/30 transition-all flex items-center gap-2 text-sm"
                >
                  {saving && <Loader2 className="animate-spin" size={16} />}
                  Kaydet
                </button>
              </div>
            </div>

            {/* Content Area */}
            <div className="flex flex-1 overflow-hidden h-full"> 
              {/* Sidebar */}
              <div className="hidden md:flex flex-col w-72 bg-white border-r border-slate-100 py-8 shrink-0 z-20">
                <nav className="flex flex-col gap-1 px-4">
                  {[
                    { id: 'details', label: 'Hizmet Detayları' },
                    { id: 'pricing', label: 'Fiyatlandırma ve Ödeme' },
                    { id: 'staff', label: 'Personel Atama' },
                    { id: 'resources', label: 'Oda ve Kaynaklar' },
                    { id: 'location', label: 'Konum Ayarları' },
                    { id: 'preferences', label: 'Randevu Tercihleri' }
                  ].map(tab => (
                    <button
                      key={tab.id}
                      onClick={(e) => { e.preventDefault(); setActiveTab(tab.id); }}
                      className={`text-left px-6 py-4 rounded-2xl transition-all text-sm font-bold ${activeTab === tab.id ? 'bg-blue-50 text-blue-700 shadow-sm border-l-4 border-blue-600' : 'text-slate-500 hover:bg-slate-50 hover:text-slate-800'}`}
                    >
                      {tab.label}
                    </button>
                  ))}
                </nav>
                <div className="mt-auto px-10 pt-8 border-t border-slate-50">
                  <div className="flex items-center justify-between">
                     <span className="text-[11px] font-black uppercase tracking-widest text-slate-400">Aktif Durum</span>
                     <div 
                        onClick={() => setFormData({...formData, isActive: !formData.isActive})}
                        className={`w-12 h-6 rounded-full relative p-1 cursor-pointer transition-all shadow-inner ${formData.isActive ? 'bg-blue-600' : 'bg-slate-200'}`}
                     >
                        <div className={`w-4 h-4 bg-white rounded-full shadow-md transition-all ${formData.isActive ? 'translate-x-6' : 'translate-x-0'}`}></div>
                     </div>
                  </div>
                </div>
              </div>

              {/* Main Content Scroll Area */}
              <div className="flex-1 overflow-y-auto bg-slate-50/50 p-6 sm:p-12 shrink-0 pb-40">
                <div className="max-w-3xl mx-auto space-y-8">
                  {/* DETAIL TAB */}
                  {activeTab === 'details' && (
                    <div className="bg-white rounded-[32px] border border-slate-200 p-10 shadow-sm animate-in fade-in slide-in-from-bottom-2 duration-300">
                       <div className="flex items-center gap-3 mb-1">
                          <div className="w-10 h-10 rounded-xl bg-blue-100 flex items-center justify-center text-blue-600">
                             <Users size={20} />
                          </div>
                          <h3 className="text-2xl font-black text-slate-900">Hizmet Detayları</h3>
                       </div>
                       <p className="text-sm text-slate-500 mb-8 font-medium">Birebir randevu için gerekli temel bilgileri buraya girin.</p>

                       <div className="space-y-8">
                         <div>
                            <label className="block text-[11px] font-black uppercase tracking-widest text-slate-400 mb-2 px-1">Kategori (Sadece Birebir)</label>
                            <div className="grid grid-cols-1 gap-3">
                              <button 
                                type="button"
                                onClick={() => setFormData({...formData, type: 'one-on-one', isRecurring: false})}
                                className={`p-6 rounded-2xl border-2 flex flex-col items-center justify-center gap-3 transition-all ${formData.type === 'one-on-one' ? 'bg-blue-600 border-blue-600 text-white shadow-xl shadow-blue-600/30' : 'border-slate-200 text-slate-400'}`}
                              >
                                <Users size={32} />
                                <span className="font-black text-lg uppercase tracking-tight">Birebir Koçluk / Seans</span>
                                <p className="text-xs opacity-70 font-medium max-w-sm text-center">Öğrencilerle yapılan özel görüşmeler, deneme sınavı analizleri veya rehberlik seansları.</p>
                              </button>
                            </div>
                         </div>

                         <div className="grid grid-cols-1 gap-6">
                            <div>
                              <label className="block text-[11px] font-black uppercase tracking-widest text-slate-400 mb-2 px-1">Hizmet Adı</label>
                              <input 
                                type="text" 
                                value={formData.title}
                                onChange={e => setFormData({...formData, title: e.target.value})}
                                className="w-full bg-white border border-slate-200 rounded-2xl p-4 text-slate-900 outline-none focus:ring-4 focus:ring-blue-100 focus:border-blue-500 transition-all font-bold text-lg shadow-sm" 
                                placeholder="Örn: YKS Rehberlik Görüşmesi"
                              />
                            </div>
                            <div>
                               <label className="block text-[11px] font-black uppercase tracking-widest text-slate-400 mb-2 px-1">Açıklama (Web Sitenizde Gözükür)</label>
                               <textarea 
                                 value={formData.description}
                                 onChange={e => setFormData({...formData, description: e.target.value})}
                                 className="w-full bg-white border border-slate-200 rounded-2xl p-4 text-slate-900 outline-none focus:ring-4 focus:ring-blue-100 focus:border-blue-500 transition-all min-h-[140px] font-medium shadow-sm" 
                                 placeholder="Bu seansın içeriği hakkında kısa bir bilgi verin..."
                               />
                            </div>
                         </div>

                         <div className="bg-blue-50/50 p-8 rounded-[32px] border border-blue-200/50 relative overflow-hidden group">
                           <div className="absolute top-0 right-0 p-8 opacity-10 group-hover:opacity-20 transition-opacity">
                              <Clock size={80} className="text-blue-600" />
                           </div>
                           <h4 className="text-sm font-black text-blue-900 uppercase tracking-widest mb-6">Planlama & Süre</h4>
                           <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
                             <div>
                               <label className="block text-[11px] font-black uppercase tracking-widest text-blue-800 mb-2">Seans Süresi (Dakika)</label>
                               <div className="flex items-center gap-4 bg-white p-2 rounded-2xl border border-blue-200 shadow-sm">
                                  <input 
                                    type="number" 
                                    step="5"
                                    value={formData.duration}
                                    onChange={e => setFormData({...formData, duration: parseInt(e.target.value)})}
                                    className="flex-1 bg-transparent border-none text-blue-600 font-black text-2xl outline-none p-3" 
                                  />
                                  <div className="bg-blue-50 px-4 py-2 rounded-xl text-blue-600 font-black text-xs">DK</div>
                               </div>
                             </div>
                             <div>
                               <label className="block text-[11px] font-black uppercase tracking-widest text-slate-500 mb-2">Dinlenme Arası (DK)</label>
                               <div className="flex items-center gap-4 bg-white p-2 rounded-2xl border border-slate-200 shadow-sm">
                                  <input 
                                    type="number" 
                                    step="5"
                                    value={formData.bufferTime}
                                    onChange={e => setFormData({...formData, bufferTime: parseInt(e.target.value)})}
                                    className="flex-1 bg-transparent border-none text-slate-500 font-black text-2xl outline-none p-3" 
                                  />
                                  <div className="bg-slate-50 px-4 py-2 rounded-xl text-slate-400 font-black text-xs">DK</div>
                               </div>
                             </div>
                           </div>
                           <div className="mt-6 flex items-start gap-3">
                              <div className="bg-blue-600 text-white p-1 rounded-md shrink-0">
                                 <Check size={12} />
                              </div>
                              <p className="text-xs text-blue-700 font-bold leading-relaxed">
                                 Otomatik Planlama: Çalışma saatleriniz (örn: 09:00-20:00) içinde bu süreler ve molalara göre randevu slotları otomatik oluşturulacaktır.
                              </p>
                           </div>
                         </div>
                       </div>
                    </div>
                  )}

                  {/* PRICING TAB */}
                  {activeTab === 'pricing' && (
                    <div className="bg-white rounded-[32px] border border-slate-200 p-10 shadow-sm animate-in fade-in slide-in-from-bottom-2 duration-300">
                       <div className="flex items-center gap-3 mb-1">
                          <div className="w-10 h-10 rounded-xl bg-emerald-100 flex items-center justify-center text-emerald-600">
                             <CreditCard size={20} />
                          </div>
                          <h3 className="text-2xl font-black text-slate-900">Ücret ve Ödeme</h3>
                       </div>
                       <p className="text-sm text-slate-500 mb-8 font-medium">Bu hizmet için geçerli ücretlendirme modelini seçin.</p>
                       
                       <div className="space-y-10">
                         <div>
                            <label className="block text-[11px] font-black uppercase tracking-widest text-slate-400 mb-4 px-1">Ödeme Senaryosu</label>
                            
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                               <div className="p-6 rounded-[24px] border-2 border-slate-100 flex items-center gap-4 group cursor-pointer hover:border-slate-200 transition-all grayscale opacity-50">
                                 <div className="w-12 h-12 rounded-2xl bg-slate-100 flex items-center justify-center text-slate-400">
                                    <Clock size={24} />
                                 </div>
                                 <div>
                                   <h4 className="font-black text-slate-800 uppercase tracking-tight text-sm">Seans Başına</h4>
                                   <p className="text-[11px] text-slate-400 font-medium">Bireysel ve anlık görüşmeler için</p>
                                 </div>
                               </div>
                               <div className="p-6 rounded-[24px] border-2 border-blue-600 bg-blue-50/50 flex items-center gap-4 group relative shadow-md">
                                 <div className="absolute -top-3 -right-3 bg-blue-600 text-white rounded-full p-1 shadow-lg">
                                    <CheckCircle size={18} />
                                 </div>
                                 <div className="w-12 h-12 rounded-2xl bg-blue-600 flex items-center justify-center text-white">
                                    <Repeat size={24} />
                                 </div>
                                 <div>
                                   <h4 className="font-black text-blue-900 uppercase tracking-tight text-sm">Karma Model</h4>
                                   <p className="text-[11px] text-blue-700 font-medium">Hem paket hem tekil ödeme</p>
                                 </div>
                               </div>
                            </div>
                         </div>

                         <div className="bg-slate-50/80 p-8 rounded-[32px] border border-slate-200">
                           <h4 className="font-black text-slate-900 mb-6 text-sm uppercase tracking-widest">Birim Ücret Ayarları</h4>
                           <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
                             <div>
                                <label className="block text-[11px] font-black uppercase tracking-widest text-slate-400 mb-2 px-1">Ücretlendirme Türü</label>
                                <select 
                                   value={formData.variablePricingEnabled ? 'variable' : 'fixed'}
                                   onChange={e => setFormData({...formData, variablePricingEnabled: e.target.value === 'variable'})}
                                   className="w-full bg-white border border-slate-200 rounded-2xl p-4 text-slate-900 outline-none focus:ring-4 focus:ring-blue-100 transition-all appearance-none font-bold shadow-sm"
                                >
                                   <option value="fixed">Sabit Birim Fiyat</option>
                                   <option value="variable">Eğitmene Göre Özelleştir</option>
                                </select>
                             </div>
                             <div>
                                <label className="block text-[11px] font-black uppercase tracking-widest text-slate-400 mb-2 px-1">Temel Ücret (Seans Başı)</label>
                                <div className="relative">
                                   <span className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400 font-black text-lg">₺</span>
                                   <input 
                                     type="number" 
                                     value={formData.basePrice}
                                     onChange={e => setFormData({...formData, basePrice: parseInt(e.target.value)})}
                                     className="w-full bg-white border border-slate-200 rounded-2xl p-4 pl-10 text-slate-900 outline-none focus:ring-4 focus:ring-blue-100 transition-all font-black text-xl shadow-sm"
                                   />
                                </div>
                             </div>
                           </div>
                         </div>

                         {formData.variablePricingEnabled && (
                           <div className="bg-blue-600 rounded-[32px] p-8 shadow-xl shadow-blue-600/20 text-white animate-in slide-in-from-top-4 duration-500">
                             <div className="flex items-center justify-between mb-8">
                                <div className="flex items-center gap-3">
                                   <div className="bg-white/20 p-2 rounded-xl backdrop-blur-md">
                                      <Users size={20} />
                                   </div>
                                   <span className="font-black uppercase tracking-widest text-sm">Eğitmen Bazlı Ücretler</span>
                                </div>
                                <button
                                  type="button"
                                  onClick={() => {
                                    const newVariation = { criteria: 'coach', targetId: '', price: formData.basePrice || 0 };
                                    setFormData({...formData, pricingVariations: [...(formData.pricingVariations || []), newVariation]});
                                  }}
                                  className="text-[10px] uppercase tracking-widest font-black text-blue-600 bg-white hover:bg-slate-50 px-5 py-2.5 rounded-full transition-all shadow-lg active:scale-95"
                                >
                                  PERSONEL EKLE
                                </button>
                             </div>

                             <div className="space-y-3">
                                {(formData.pricingVariations || []).map((variation: any, idx: number) => (
                                  <div key={idx} className="flex flex-col sm:flex-row items-center gap-4 bg-white/10 p-4 rounded-2xl backdrop-blur-sm border border-white/10">
                                     <div className="flex-1 flex items-center gap-3 w-full">
                                        <select
                                          value={variation.targetId}
                                          onChange={e => {
                                            const updated = [...(formData.pricingVariations || [])];
                                            updated[idx].targetId = e.target.value;
                                            updated[idx].criteria = 'coach';
                                            setFormData({...formData, pricingVariations: updated});
                                          }}
                                          className="bg-white/10 text-white font-bold text-sm outline-none w-full p-2.5 rounded-xl border border-white/10 focus:bg-white focus:text-blue-900 transition-all [&>option]:text-slate-900"
                                        >
                                          <option value="">Eğitmen Seçin</option>
                                          {coaches.map(c => <option key={c.uid} value={c.uid}>{c.firstName ? c.firstName + ' ' + c.lastName : (c.displayName || 'İsimsiz Personel')}</option>)}
                                        </select>
                                     </div>
                                     <div className="flex items-center gap-4 w-full sm:w-auto">
                                        <div className="relative flex-1 sm:w-32">
                                          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-white/50 font-black">₺</span>
                                          <input 
                                            type="number" 
                                            value={variation.price}
                                            onChange={e => {
                                              const updated = [...(formData.pricingVariations || [])];
                                              updated[idx].price = parseInt(e.target.value) || 0;
                                              setFormData({...formData, pricingVariations: updated});
                                            }}
                                            className="bg-white/10 text-white font-black outline-none w-full p-2.5 pl-7 border border-white/10 rounded-xl focus:bg-white focus:text-blue-900 transition-all"
                                          />
                                        </div>
                                        <button 
                                          type="button" 
                                          onClick={() => {
                                            const updated = [...(formData.pricingVariations || [])];
                                            updated.splice(idx, 1);
                                            setFormData({...formData, pricingVariations: updated});
                                          }}
                                          className="bg-red-500 hover:bg-red-600 p-2.5 rounded-xl transition-all shadow-lg active:scale-95"
                                        >
                                          <Trash2 size={16} />
                                        </button>
                                     </div>
                                  </div>
                                ))}
                                {(formData.pricingVariations?.length === 0) && (
                                   <div className="py-10 text-center text-sm font-bold text-white/50 border-2 border-dashed border-white/20 rounded-[24px]">Varyasyon bulunamadı.</div>
                                )}
                             </div>
                           </div>
                         )}

                         <div>
                            <label className="block text-[11px] font-black uppercase tracking-widest text-slate-400 mb-4 px-1">Ödeme Yöntemi</label>
                            <select 
                               value={formData.paymentTypes?.includes('cash') ? 'all' : 'online'}
                               onChange={(e) => {
                                  if (e.target.value === 'all') setFormData({...formData, paymentTypes: ['cash', 'subscription']});
                                  else setFormData({...formData, paymentTypes: ['subscription']});
                               }}
                               className="w-full sm:w-1/2 bg-white border border-slate-200 rounded-2xl p-4 text-slate-900 outline-none focus:ring-4 focus:ring-blue-100 transition-all font-bold shadow-sm"
                            >
                               <option value="all">Elden (Nakit) veya Online Ödeme</option>
                               <option value="online">Sadece Online Ödeme (Kredi Kartı)</option>
                            </select>
                         </div>
                       </div>
                    </div>
                  )}

                  {/* STAFF TAB */}
                  {activeTab === 'staff' && (
                    <div className="bg-white rounded-[32px] border border-slate-200 p-10 shadow-sm animate-in fade-in slide-in-from-bottom-2 duration-300">
                        <div className="flex items-center gap-3 mb-1">
                          <div className="w-10 h-10 rounded-xl bg-orange-100 flex items-center justify-center text-orange-600">
                             <Users size={20} />
                          </div>
                          <h3 className="text-2xl font-black text-slate-900">Atanan Personel</h3>
                        </div>
                        <p className="text-sm text-slate-500 mb-10 font-medium">Bu birebir hizmeti hangi koçlarımızın verebileceğini seçin.</p>

                        <div className="space-y-8">
                           <div className="flex flex-wrap gap-3">
                              {formData.assignedCoachIds?.map(id => {
                                const c = coaches.find(c => c.uid === id);
                                if (!c) return null;
                                return (
                                  <div key={id} className="flex items-center gap-3 bg-slate-50 p-2 pr-4 rounded-2xl border border-slate-200 group hover:border-red-200 transition-colors">
                                    <div className="w-10 h-10 rounded-xl bg-blue-600 flex items-center justify-center text-white font-black text-sm shadow-sm capitalize">
                                       {c.firstName ? c.firstName.charAt(0) : (c.displayName ? c.displayName.charAt(0) : '?')}
                                    </div>
                                    <span className="font-bold text-slate-700 text-sm">{c.firstName ? c.firstName + ' ' + c.lastName : (c.displayName || 'İsimsiz Personel')}</span>
                                    <button 
                                      onClick={() => {
                                         const updated = formData.assignedCoachIds?.filter(x => x !== id);
                                         setFormData({...formData, assignedCoachIds: updated});
                                      }}
                                      className="w-6 h-6 rounded-lg bg-slate-200 flex items-center justify-center text-slate-400 group-hover:bg-red-100 group-hover:text-red-600 transition-all"
                                    >
                                      <Trash2 size={12} />
                                    </button>
                                  </div>
                                )
                              })}
                              {formData.assignedCoachIds?.length === 0 && (
                                <div className="text-sm font-bold text-slate-400 p-8 border-2 border-dashed border-slate-100 rounded-3xl w-full text-center">Henüz personel atanmadı.</div>
                              )}
                           </div>

                           <div className="pt-8 border-t border-slate-100">
                              <label className="block text-[11px] font-black uppercase tracking-widest text-slate-400 mb-4 px-1">Personel Ekle</label>
                              <div className="relative group">
                                <div className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400 transition-colors group-focus-within:text-blue-500">
                                   <Search size={20} />
                                </div>
                                <select 
                                  onChange={e => {
                                    if(!e.target.value) return;
                                    const current = formData.assignedCoachIds || [];
                                    if(!current.includes(e.target.value)) {
                                      setFormData({...formData, assignedCoachIds: [...current, e.target.value]});
                                    }
                                    e.target.value = "";
                                  }}
                                  className="w-full bg-white border border-slate-200 pl-14 pr-8 p-5 rounded-2xl outline-none focus:ring-4 focus:ring-blue-100 focus:border-blue-500 transition-all font-bold text-slate-700 shadow-sm appearance-none"
                                >
                                  <option value="">Mevcut personellerden seçim yapın...</option>
                                  {coaches.map(c => (
                                    <option key={c.uid} value={c.uid}>
                                      {c.firstName ? c.firstName + ' ' + c.lastName : (c.displayName || 'İsimsiz Personel')}
                                    </option>
                                  ))}
                                </select>
                                <div className="absolute right-5 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400">
                                   <ChevronDown size={20} />
                                </div>
                              </div>
                           </div>

                           <div className="bg-orange-50 p-6 rounded-3xl border border-orange-100 flex items-start gap-4">
                              <div className="bg-white p-2 rounded-xl shadow-sm text-orange-500">
                                 <Info size={20} />
                              </div>
                              <p className="text-xs text-orange-800 font-bold leading-relaxed">
                                 Önemli: Müşterileriniz sadece burada atadığınız ve çalışma saatleri o saat dilimine uygun olan personellerden randevu alabilir.
                              </p>
                           </div>
                        </div>
                    </div>
                  )}

                  {/* RESOURCES TAB */}
                  {activeTab === 'resources' && (
                    <div className="bg-white rounded-[32px] border border-slate-200 p-10 shadow-sm animate-in fade-in slide-in-from-bottom-2 duration-300">
                        <div className="flex items-center gap-3 mb-1">
                          <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center text-slate-600">
                             <DoorOpen size={20} />
                          </div>
                          <h3 className="text-2xl font-black text-slate-900">Oda ve Kaynaklar</h3>
                        </div>
                        <p className="text-sm text-slate-500 mb-10 font-medium">Bu hizmetin gerçekleşmesi için bir oda veya özel ekipman gerekiyorsa seçin.</p>

                        <div className="space-y-6">
                           <div className="flex flex-col gap-3">
                              {rooms.map((room, idx) => (
                                 <label key={room.id} className={`flex items-center gap-4 p-6 rounded-2xl border-2 transition-all cursor-pointer group ${formData.assignedRoomIds?.includes(room.id!) ? 'border-blue-600 bg-blue-50/30' : 'border-slate-100 bg-white hover:border-slate-200'}`}>
                                    <div className={`w-6 h-6 rounded-lg border-2 flex items-center justify-center transition-all ${formData.assignedRoomIds?.includes(room.id!) ? 'bg-blue-600 border-blue-600 text-white' : 'border-slate-200 bg-white group-hover:border-slate-300'}`}>
                                       {formData.assignedRoomIds?.includes(room.id!) && <Check size={14} strokeWidth={4} />}
                                    </div>
                                    <input 
                                      type="checkbox"
                                      className="hidden"
                                      checked={formData.assignedRoomIds?.includes(room.id!)}
                                      onChange={() => {
                                        const current = formData.assignedRoomIds || [];
                                        const updated = current.includes(room.id!) ? current.filter(id => id !== room.id) : [...current, room.id!];
                                        setFormData({...formData, assignedRoomIds: updated});
                                      }}
                                    />
                                    <div className="flex-1">
                                       <span className={`font-black text-sm uppercase tracking-tight ${formData.assignedRoomIds?.includes(room.id!) ? 'text-blue-900' : 'text-slate-700'}`}>{room.name}</span>
                                       <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-0.5">{room.capacity} Öğrenci Kapasitesi</p>
                                    </div>
                                 </label>
                              ))}
                              {rooms.length === 0 && (
                                 <div className="p-12 text-center text-sm font-bold text-slate-400 border-2 border-dashed border-slate-100 rounded-[32px]">Henüz tanımlı oda bulunamadı.</div>
                              )}
                           </div>
                        </div>
                    </div>
                  )}

                  {/* LOCATION TAB */}
                  {activeTab === 'location' && (
                    <div className="bg-white rounded-[32px] border border-slate-200 p-10 shadow-sm animate-in fade-in slide-in-from-bottom-2 duration-300">
                        <div className="flex items-center gap-3 mb-1">
                          <div className="w-10 h-10 rounded-xl bg-blue-100 flex items-center justify-center text-blue-600">
                             <MapPin size={20} />
                          </div>
                          <h3 className="text-2xl font-black text-slate-900">Konum Ayarları</h3>
                        </div>
                        <p className="text-sm text-slate-500 mb-10 font-medium">Birebir görüşmenin nerede gerçekleşeceğini belirleyin.</p>

                        <div className="space-y-8">
                           <div className="grid grid-cols-1 gap-4">
                              {[
                                { id: 'default', label: 'Merkez Kurum', desc: 'Akademi ana merkez şubesi' },
                                { id: 'custom', label: 'Özel Adres', desc: 'Dışarıda bir kafe veya kütüphane' },
                                { id: 'student_address', label: 'Öğrenci Adresi', desc: 'Hoca öğrencinin evine gider' }
                              ].map(loc => (
                                <label key={loc.id} className={`flex items-start gap-4 p-6 rounded-[24px] border-2 cursor-pointer transition-all ${formData.locationType === loc.id ? 'border-blue-600 bg-blue-50/50 shadow-md' : 'border-slate-100 hover:bg-slate-50'}`}>
                                   <input 
                                     type="radio"
                                     name="location"
                                     checked={formData.locationType === loc.id}
                                     onChange={() => setFormData({...formData, locationType: loc.id as any})}
                                     className="mt-1 w-5 h-5 text-blue-600 focus:ring-blue-500 border-slate-300"
                                   />
                                   <div>
                                      <div className={`font-black uppercase tracking-tight ${formData.locationType === loc.id ? 'text-blue-900' : 'text-slate-800'}`}>{loc.label}</div>
                                      <p className="text-xs text-slate-500 font-medium mt-1">{loc.desc}</p>
                                   </div>
                                </label>
                              ))}
                           </div>

                           {formData.locationType === 'custom' && (
                              <div className="p-8 bg-slate-50 rounded-3xl border border-slate-200 animate-in fade-in zoom-in-95 duration-300">
                                <label className="block text-[11px] font-black uppercase tracking-widest text-slate-400 mb-3 px-1">Görüşme Adresi Detayı</label>
                                <input 
                                  type="text"
                                  value={formData.customLocation}
                                  onChange={e => setFormData({...formData, customLocation: e.target.value})}
                                  placeholder="Örn: Starbucks Bebek / 2. Kat"
                                  className="w-full bg-white border border-slate-200 rounded-2xl p-4 text-slate-900 outline-none focus:ring-4 focus:ring-blue-100 font-bold shadow-sm"
                                />
                              </div>
                           )}

                           {/* Online Option */}
                           <div className="pt-10 border-t border-slate-100">
                             <div className="flex items-center justify-between bg-purple-50/50 p-6 rounded-[32px] border border-purple-100 hover:shadow-lg transition-all cursor-pointer group" onClick={() => setFormData({...formData, isOnlineAvailable: !formData.isOnlineAvailable})}>
                               <div className="flex items-center gap-6">
                                 <div className={`w-16 h-16 rounded-2xl flex items-center justify-center transition-all ${formData.isOnlineAvailable ? 'bg-purple-600 text-white shadow-xl shadow-purple-600/30' : 'bg-white text-slate-300 border border-slate-100'}`}>
                                    <Video size={32} />
                                 </div>
                                 <div className="text-left">
                                   <h4 className={`font-black uppercase tracking-tight text-lg ${formData.isOnlineAvailable ? 'text-purple-950' : 'text-slate-400'}`}>Online Seans Desteği</h4>
                                   <p className="text-xs text-slate-500 font-medium">Bu hizmet video konferans ile verilebilir.</p>
                                 </div>
                               </div>
                               <div 
                                  className={`w-14 h-7 rounded-full relative p-1 transition-all ${formData.isOnlineAvailable ? 'bg-purple-600' : 'bg-slate-200'}`}
                                >
                                  <div className={`w-5 h-5 bg-white rounded-full shadow-md transition-all ${formData.isOnlineAvailable ? 'translate-x-7' : 'translate-x-0'}`}></div>
                                </div>
                             </div>
                           </div>
                        </div>
                    </div>
                  )}

                  {/* PREFERENCES TAB */}
                  {activeTab === 'preferences' && (
                    <div className="bg-white rounded-[32px] border border-slate-200 p-10 shadow-sm animate-in fade-in slide-in-from-bottom-2 duration-300">
                        <div className="flex items-center gap-3 mb-1">
                          <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center text-slate-600">
                             <Settings size={20} />
                          </div>
                          <h3 className="text-2xl font-black text-slate-900">Randevu Tercihleri</h3>
                        </div>
                        <p className="text-sm text-slate-500 mb-10 font-medium">İptal politikaları ve onay mekanizması ayarları.</p>

                        <div className="space-y-8">
                           {/* Policy */}
                           <div className="bg-slate-50 p-8 rounded-[32px] border border-slate-200">
                              <h4 className="font-black text-slate-900 mb-1 flex items-center gap-2 text-sm uppercase tracking-tight">İptal & İade Politikası ⓘ</h4>
                              <p className="text-xs text-slate-400 mb-6 font-medium">Müşterilerin randevu öncesi iptal kurallarını buradan bağlayın.</p>
                              <div className="flex flex-col gap-4">
                                 <select className="w-full bg-white border border-slate-200 text-slate-900 text-sm font-bold rounded-2xl p-4 outline-none focus:ring-4 focus:ring-blue-100 transition-all appearance-none shadow-sm">
                                    <option>Standart Kurumsal Politika (24 Saat)</option>
                                    <option>Katı Politika (48 Saat)</option>
                                    <option>Esnek (Seansa Kadar)</option>
                                 </select>
                              </div>
                           </div>

                           <div className="flex items-center justify-between p-8 border-2 border-slate-100 rounded-[32px] hover:bg-blue-50/30 hover:border-blue-200 cursor-pointer transition-all group" onClick={() => setFormData({...formData, allowOnlineRequest: !formData.allowOnlineRequest})}>
                               <div className="flex items-center gap-5">
                                 <div className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-all ${formData.allowOnlineRequest ? 'bg-blue-600 text-white shadow-lg' : 'bg-slate-100 text-slate-400'}`}>
                                    <CheckCircle size={24} />
                                 </div>
                                 <div>
                                   <h4 className="font-black text-slate-900 uppercase tracking-tight text-sm">İnternetten Randevu</h4>
                                   <p className="text-xs text-slate-400 font-medium mt-1">Öğrenciler kendi panellerinden bu hizmeti görebilir ve talep edebilir.</p>
                                 </div>
                               </div>
                               <div 
                                  className={`w-12 h-6 rounded-full relative p-1 transition-all ${formData.allowOnlineRequest ? 'bg-blue-600' : 'bg-slate-200'}`}
                                >
                                  <div className={`w-4 h-4 bg-white rounded-full shadow-md transition-all ${formData.allowOnlineRequest ? 'translate-x-6' : 'translate-x-0'}`}></div>
                                </div>
                             </div>

                           {/* Online Appr */}
                           <div className="pt-4">
                              <h4 className="font-black text-slate-900 mb-6 text-sm uppercase tracking-widest px-1">Onay Mekanizması</h4>
                              <div className="grid grid-cols-1 gap-4">
                                <label className={`flex items-center gap-5 px-8 py-6 rounded-[28px] border-2 cursor-pointer transition-all ${formData.approvalType === 'automatic' ? 'border-emerald-500 bg-emerald-50/50 shadow-md' : 'border-slate-100 bg-white hover:bg-slate-50'}`}>
                                   <input 
                                      type="radio" 
                                      checked={formData.approvalType === 'automatic'}
                                      onChange={() => setFormData({...formData, approvalType: 'automatic'})}
                                      className="w-6 h-6 text-emerald-600 focus:ring-emerald-500 border-slate-300"
                                   />
                                   <div>
                                      <span className={`font-black text-sm uppercase tracking-tight ${formData.approvalType === 'automatic' ? 'text-emerald-900' : 'text-slate-800'}`}>Tam Otomatik Onay</span>
                                      <p className="text-[11px] text-slate-400 font-bold mt-1">Sistem takvime bakar, uygunsa direkt onaylar.</p>
                                   </div>
                                </label>
                                <label className={`flex items-center gap-5 px-8 py-6 rounded-[28px] border-2 cursor-pointer transition-all ${formData.approvalType === 'manual' ? 'border-orange-500 bg-orange-50/50 shadow-md' : 'border-slate-100 bg-white hover:bg-slate-50'}`}>
                                   <input 
                                      type="radio" 
                                      checked={formData.approvalType === 'manual'}
                                      onChange={() => setFormData({...formData, approvalType: 'manual'})}
                                      className="w-6 h-6 text-orange-600 focus:ring-orange-500 border-slate-300"
                                   />
                                   <div>
                                      <span className={`font-black text-sm uppercase tracking-tight ${formData.approvalType === 'manual' ? 'text-orange-900' : 'text-slate-800'}`}>Manuel Kontrol</span>
                                      <p className="text-[11px] text-slate-400 font-bold mt-1">Her talep admin/hoca paneline "Bekleyen" olarak düşer.</p>
                                   </div>
                                </label>
                              </div>
                           </div>
                        </div>
                    </div>
                  )}

                </div>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
}