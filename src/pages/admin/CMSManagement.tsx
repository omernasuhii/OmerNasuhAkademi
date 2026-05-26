import React, { useState, useEffect } from 'react';
import { 
  Database, 
  Search, 
  Filter, 
  ChevronRight, 
  Download, 
  RefreshCw,
  Table as TableIcon,
  Users,
  BookOpen,
  Calendar,
  Layers,
  Activity,
  ClipboardList,
  Target,
  Layout,
  Wallet,
  Settings,
  MoreVertical,
  ArrowUpDown
} from 'lucide-react';
import { studentDataService } from '../../services/studentDataService';
import { motion, AnimatePresence } from 'motion/react';

const collections = [
  { id: 'users', name: 'Kullanıcılar', icon: Users, description: 'Öğrenci, Koç ve Yönetici profilleri' },
  { id: 'global_books', name: 'Global Kitaplar', icon: BookOpen, description: 'Sistemdeki kitap kütüphanesi' },
  { id: 'daily_programs', name: 'Günlük Programlar', icon: Calendar, description: 'Yeni nesil günlük ders planları' },
  { id: 'routines', name: 'Rutinler', icon: Activity, description: 'Öğrenci günlük alışkanlıkları' },
  { id: 'weekly_reports', name: 'Haftalık Raporlar', icon: ClipboardList, description: 'Soru çözüm istatistikleri' },
  { id: 'exam_results', name: 'Sınav Sonuçları', icon: Target, description: 'Deneme ve sınav skorları' },
  { id: 'exam_analyses', name: 'Sınav Analizleri', icon: Activity, description: 'Derin soru bazlı analizler' },
  { id: 'book_tracking', name: 'Kitap Takibi', icon: Layers, description: 'Kitap bitirme durumları' },
  { id: 'weekly_programs', name: 'Haftalık Programlar (Eski)', icon: Calendar, description: 'Eski tip haftalık planlar' },
  { id: 'monthly_goals', name: 'Aylık Hedefler', icon: Target, description: 'Öğrenci aylık planları' },
  { id: 'appointments', name: 'Randevular', icon: Calendar, description: 'Kocluk ve ders randevuları' },
  { id: 'coach_schedules', name: 'Koç Takvimleri', icon: Settings, description: 'Koç müsaitlik durumları' },
  { id: 'services', name: 'Hizmetler', icon: Settings, description: 'Sunulan hizmet tanımları' },
  { id: 'rooms', name: 'Odalar', icon: Layout, description: 'Masa ve oda tanımları' },
  { id: 'wallet_transactions', name: 'Cüzdan Hareketleri', icon: Wallet, description: 'Finansal işlemler' },
  { id: 'user_analyses', name: 'Üye Analizleri', icon: Search, description: 'VAK-S, ÇZ-8 vb. sonuçları' },
  { id: 'chocolate_bank_status', name: 'Çikolata Bakiyeleri', icon: Wallet, description: 'Ödül sistemi durumları' },
  { id: 'chocolate_bank_transactions', name: 'Çikolata Hareketleri', icon: Activity, description: 'Puan kazanım ve harcamalar' },
];

const columnTranslations: Record<string, string> = {
  id: 'ID',
  uid: 'Kullanıcı ID',
  email: 'E-Posta',
  displayName: 'Ad Soyad',
  name: 'İsim',
  role: 'Rol',
  createdAt: 'Oluşturulma',
  updatedAt: 'Son Güncelleme',
  status: 'Durum',
  type: 'Tür',
  subject: 'Branş/Ders',
  date: 'Tarih',
  amount: 'Tutar',
  studentId: 'Öğrenci ID',
  coachId: 'Koç ID',
  bookName: 'Kitap Adı',
  totalNet: 'Toplam Net',
  examName: 'Sınav Adı',
  branch: 'Bölüm',
  phone: 'Telefon',
  grade: 'Sınıf',
  resourceType: 'Kaynak Türü',
  topic: 'Konu',
  targetCount: 'Hedef',
  completedCount: 'Tamamlanan',
  isActive: 'Aktif mi?',
  capacity: 'Kapasite',
  price: 'Fiyat',
  description: 'Açıklama'
};

const preferredOrder = [
  'id', 'displayName', 'name', 'email', 'role', 'status', 'type', 'subject', 'date', 'amount', 'studentId', 'coachId', 'bookName', 'examName'
];

export default function CMSManagement() {
  const [activeCollection, setActiveCollection] = useState<any>(null);
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortField, setSortField] = useState('updatedAt');

  const fetchData = async () => {
    if (!activeCollection) return;
    setLoading(true);
    try {
      const results = await studentDataService.getAllCollectionData(activeCollection.id, sortField, 100);
      setData(results);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [activeCollection, sortField]);

  const filteredData = data.filter(item => {
    const searchString = JSON.stringify(item).toLowerCase();
    return searchString.includes(searchTerm.toLowerCase());
  });

  const getKeys = () => {
    if (data.length === 0) return [];
    const allKeys = new Set<string>();
    data.slice(0, 20).forEach(item => {
      Object.keys(item).forEach(key => {
        if (typeof item[key] !== 'object' || item[key] === null) {
          allKeys.add(key);
        }
      });
    });
    
    return Array.from(allKeys).sort((a, b) => {
      const indexA = preferredOrder.indexOf(a);
      const indexB = preferredOrder.indexOf(b);
      if (indexA !== -1 && indexB !== -1) return indexA - indexB;
      if (indexA !== -1) return -1;
      if (indexB !== -1) return 1;
      if (a === 'updatedAt' || a === 'createdAt') return 1;
      if (b === 'updatedAt' || b === 'createdAt') return -1;
      return a.localeCompare(b);
    });
  };

  const keys = getKeys();

  const formatValue = (value: any) => {
    if (value === null || value === undefined) return '-';
    if (typeof value === 'boolean') return value ? 'Evet' : 'Hayır';
    if (value && typeof value === 'object' && value.seconds) {
       return new Date(value.seconds * 1000).toLocaleString('tr-TR');
    }
    if (typeof value === 'string' && (value.includes('T') && !isNaN(Date.parse(value)))) {
       return new Date(value).toLocaleString('tr-TR');
    }
    return String(value);
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-700 pb-20">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div onClick={() => setActiveCollection(null)} className="cursor-pointer group">
          <h1 className="text-3xl font-black text-white tracking-widest uppercase flex items-center gap-4">
            <Database className="text-red-600 w-8 h-8 group-hover:scale-110 transition-transform" />
            CMS <span className="text-red-600">PANELİ</span>
          </h1>
          <p className="text-slate-500 mt-2 font-bold tracking-tight">
            {activeCollection ? `Şu an incelenen: ${activeCollection.name}` : 'Tüm veritabanı akışını buradan yönetin.'}
          </p>
        </div>
        
        {activeCollection && (
          <div className="flex items-center gap-3">
            <button 
              onClick={() => setActiveCollection(null)}
              className="px-6 py-4 bg-white/5 border border-white/10 rounded-2xl text-slate-400 hover:text-white hover:bg-white/10 transition-all font-black text-xs uppercase"
            >
              Geri Dön
            </button>
            <button 
              onClick={fetchData}
              className="p-4 bg-white/5 border border-white/10 rounded-2xl text-slate-400 hover:text-white transition-all"
            >
              <RefreshCw size={20} className={loading ? "animate-spin" : ""} />
            </button>
          </div>
        )}
      </div>

      <AnimatePresence mode="wait">
        {!activeCollection ? (
          <motion.div 
            key="cards"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6"
          >
            {collections.map((coll) => (
              <button
                key={coll.id}
                onClick={() => setActiveCollection(coll)}
                className="group relative bg-[#0a0f1a] border border-white/5 rounded-[40px] p-8 text-left hover:border-red-600/30 transition-all duration-500 overflow-hidden"
              >
                <div className="absolute top-0 right-0 p-8 opacity-[0.03] group-hover:opacity-[0.07] transition-opacity">
                  <coll.icon size={120} />
                </div>
                
                <div className="bg-red-600/10 text-red-500 w-16 h-16 rounded-3xl flex items-center justify-center mb-6 group-hover:scale-110 group-hover:bg-red-600 group-hover:text-white transition-all duration-500">
                  <coll.icon size={32} />
                </div>
                
                <h3 className="text-xl font-black text-white uppercase tracking-tight mb-2">{coll.name}</h3>
                <p className="text-slate-500 font-bold text-sm leading-relaxed">{coll.description}</p>
                
                <div className="mt-8 flex items-center gap-2 text-red-500 font-black text-[10px] uppercase tracking-widest opacity-0 group-hover:opacity-100 transition-all">
                  Tabloyu Aç <ChevronRight size={14} />
                </div>
              </button>
            ))}
          </motion.div>
        ) : (
          <motion.div 
            key="table"
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.98 }}
            className="space-y-6"
          >
            {/* Table Controls */}
            <div className="bg-[#070b14] border border-white/5 rounded-[40px] p-6">
              <div className="flex flex-col md:flex-row gap-4 items-center">
                 <div className="relative flex-1 group">
                    <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-red-500 transition-colors" size={20} />
                    <input 
                      type="text" 
                      placeholder={`${activeCollection.name} tablosunda ara...`}
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="w-full bg-white/5 border border-white/10 rounded-3xl py-5 pl-16 pr-8 text-sm text-slate-300 outline-none focus:border-red-600/50 focus:bg-red-600/[0.02] transition-all font-bold"
                    />
                 </div>
                 <div className="flex items-center gap-3">
                    <div className="bg-white/5 border border-white/10 rounded-3xl p-1.5 flex items-center gap-1">
                       <button 
                         onClick={() => setSortField('updatedAt')}
                         className={`px-6 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all
                           ${sortField === 'updatedAt' ? 'bg-red-600 text-white shadow-lg shadow-red-600/20' : 'text-slate-500 hover:text-white'}
                         `}
                       >
                         Güncel
                       </button>
                       <button 
                         onClick={() => setSortField('createdAt')}
                         className={`px-6 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all
                           ${sortField === 'createdAt' ? 'bg-red-600 text-white shadow-lg shadow-red-600/20' : 'text-slate-500 hover:text-white'}
                         `}
                       >
                         Yeni
                       </button>
                    </div>
                    <button className="p-5 bg-white/5 border border-white/10 rounded-3xl text-slate-400 hover:text-white hover:bg-white/10 transition-all">
                       <Filter size={20} />
                    </button>
                 </div>
              </div>
            </div>

            {/* Table Detail */}
            <div className="bg-[#070b14] border border-white/5 rounded-[40px] overflow-hidden shadow-2xl">
              <div className="overflow-x-auto">
                 <table className="w-full border-collapse">
                    <thead>
                       <tr className="border-b border-white/5 bg-white/[0.02]">
                          <th className="px-8 py-8 text-left text-[10px] font-black uppercase tracking-[0.2em] text-slate-600 w-12">#</th>
                          {keys.map((key) => (
                            <th key={key} className="px-6 py-8 text-left text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">
                               <div className="flex items-center gap-2">
                                  {columnTranslations[key] || key.toUpperCase()}
                               </div>
                            </th>
                          ))}
                          <th className="px-8 py-8 text-right text-[10px] font-black uppercase tracking-[0.2em] text-slate-600">İŞLEM</th>
                       </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5">
                       {loading ? (
                         Array.from({ length: 8 }).map((_, i) => (
                           <tr key={i} className="animate-pulse">
                              <td colSpan={keys.length + 2} className="px-8 py-8">
                                 <div className="h-4 bg-white/5 rounded-full w-full"></div>
                              </td>
                           </tr>
                         ))
                       ) : filteredData.length === 0 ? (
                         <tr>
                            <td colSpan={keys.length + 2} className="px-8 py-40 text-center">
                               <div className="flex flex-col items-center gap-6">
                                  <div className="w-24 h-24 bg-white/5 rounded-full flex items-center justify-center">
                                     <TableIcon size={40} className="text-slate-700" />
                                  </div>
                                  <div>
                                     <h3 className="text-2xl font-black text-white uppercase">Kayıt Bulunamadı</h3>
                                     <p className="text-slate-500 font-bold mt-2">Aradığınız kriterlerde veri mevcut değil.</p>
                                  </div>
                               </div>
                            </td>
                         </tr>
                       ) : (
                         filteredData.map((item, index) => (
                           <tr key={item.id} className="hover:bg-white/[0.02] transition-colors group border-white/5">
                              <td className="px-8 py-6 text-xs font-bold text-slate-700">{index + 1}</td>
                              {keys.map((key) => (
                                <td key={key} className="px-6 py-6">
                                   <div className={`text-xs font-bold truncate max-w-[250px] 
                                      ${key === 'id' ? 'font-mono text-[10px] text-slate-500 opacity-50' : 'text-slate-300'}
                                      ${(key === 'email' || key === 'displayName' || key === 'name') ? 'text-white' : ''}
                                   `}>
                                      {formatValue(item[key])}
                                   </div>
                                </td>
                              ))}
                              <td className="px-8 py-6 text-right">
                                 <button className="p-3 text-slate-600 hover:text-white transition-colors">
                                    <MoreVertical size={20} />
                                 </button>
                              </td>
                           </tr>
                         ))
                       )}
                    </tbody>
                 </table>
              </div>
              
              <div className="px-10 py-8 border-t border-white/5 bg-white/[0.01] flex items-center justify-between">
                 <div className="text-[10px] font-black text-slate-600 uppercase tracking-widest">
                    <span className="text-white">{filteredData.length}</span> KAYIT LİSTELENDİ
                 </div>
                 <div className="flex items-center gap-3">
                    <button className="p-3 bg-white/5 border border-white/10 rounded-2xl text-slate-500 hover:text-white hover:bg-white/10 transition-all font-black text-[10px] uppercase tracking-widest flex items-center gap-2">
                       <Download size={14} /> Dışa Aktar
                    </button>
                 </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
