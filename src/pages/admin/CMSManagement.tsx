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
  Plus,
  Trash2,
  Edit3,
  Eye,
  AlertTriangle,
  Check,
  X,
  Code,
  FileText,
  MessageSquare,
  ShoppingBag,
  Award,
  Clock,
  ShieldAlert,
  HelpCircle,
  Tag
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { cmsService, collectionMetadata, RelationshipResult } from '../../services/cmsService';

// Category icons map
const categoryIcons: Record<string, any> = {
  'Tümü': Database,
  'Kullanıcı & Üyelik': Users,
  'Eğitim & Akademik': BookOpen,
  'Koçluk & Görüşme': Calendar,
  'Etkinlik & Mağaza': ShoppingBag,
  'İletişim & Finans': Wallet,
  'Sistem & Ayarlar': Settings
};

// Collection specific icons map
const collectionIconMap: Record<string, any> = {
  users: Users,
  global_books: BookOpen,
  daily_programs: Calendar,
  routines: Activity,
  weekly_reports: ClipboardList,
  exam_results: Target,
  exam_analyses: Activity,
  book_tracking: Layers,
  weekly_programs: Calendar,
  monthly_goals: Target,
  appointments: Calendar,
  coach_schedules: Settings,
  services: Layout,
  rooms: Layout,
  wallet_transactions: Wallet,
  user_analyses: Search,
  chocolate_bank_status: Award,
  chocolate_bank_transactions: Award,
  notifications: MessageSquare,
  userTokens: Settings,
  coupons: Tag,
  referral_history: Users,
  products: ShoppingBag,
  purchases: ShoppingBag,
  programs: BookOpen,
  program_enrollments: Users,
  events: Calendar,
  event_rsvps: Users,
  ticket_orders: ShoppingBag,
  user_sessions: Clock,
  study_sessions: Clock,
  weeklyEvaluations: ClipboardList,
  academic_calendar: Calendar,
  caba_tests: Target,
  chats: MessageSquare,
  inbox_messages: MessageSquare,
  whatsapp_messages: MessageSquare,
  whatsapp_templates: Settings,
  settings: Settings
};

const columnTranslations: Record<string, string> = {
  id: 'ID',
  uid: 'Kullanıcı ID',
  email: 'E-Posta',
  displayName: 'Ad Soyad',
  firstName: 'Ad',
  lastName: 'Soyad',
  name: 'İsim / Ad',
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
  userId: 'Kullanıcı ID',
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
  description: 'Açıklama',
  code: 'Kod',
  title: 'Başlık'
};

const preferredOrder = [
  'id', 'displayName', 'name', 'title', 'email', 'role', 'status', 'type', 'subject', 'date', 'amount', 'studentId', 'coachId', 'userId', 'bookName', 'examName', 'code'
];

export default function CMSManagement() {
  const [selectedCategory, setSelectedCategory] = useState('Tümü');
  const [collectionSearch, setCollectionSearch] = useState('');
  const [activeCollectionId, setActiveCollectionId] = useState<string | null>(null);
  
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortField, setSortField] = useState('updatedAt');

  // Modals state
  const [inspectItem, setInspectItem] = useState<any | null>(null);
  const [editItem, setEditItem] = useState<any | null>(null);
  const [isNewRecord, setIsNewRecord] = useState(false);
  const [editJsonMode, setEditJsonMode] = useState(false);
  const [editJsonString, setEditJsonString] = useState('');
  const [editFields, setEditFields] = useState<Record<string, string>>({});
  const [newFieldName, setNewFieldName] = useState('');
  const [newFieldValue, setNewFieldValue] = useState('');
  const [actionLoading, setActionLoading] = useState(false);

  // Delete relationship check state
  const [deleteItem, setDeleteItem] = useState<any | null>(null);
  const [checkingRelations, setCheckingRelations] = useState(false);
  const [relatedRecords, setRelatedRecords] = useState<RelationshipResult[]>([]);
  const [deleting, setDeleting] = useState(false);

  const categories = ['Tümü', 'Kullanıcı & Üyelik', 'Eğitim & Akademik', 'Koçluk & Görüşme', 'Etkinlik & Mağaza', 'İletişim & Finans', 'Sistem & Ayarlar'];

  // All collections entries
  const allCollectionKeys = Object.keys(collectionMetadata);

  const filteredCollections = allCollectionKeys.filter(key => {
    const meta = collectionMetadata[key];
    const matchCat = selectedCategory === 'Tümü' || meta.category === selectedCategory;
    const matchSearch = meta.name.toLowerCase().includes(collectionSearch.toLowerCase()) || 
                        key.toLowerCase().includes(collectionSearch.toLowerCase()) ||
                        meta.description.toLowerCase().includes(collectionSearch.toLowerCase());
    return matchCat && matchSearch;
  });

  const activeMeta = activeCollectionId ? collectionMetadata[activeCollectionId] : null;

  const fetchData = async () => {
    if (!activeCollectionId) return;
    setLoading(true);
    try {
      const results = await cmsService.getCollectionData(activeCollectionId, sortField, 250);
      setData(results);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [activeCollectionId, sortField]);

  const filteredData = data.filter(item => {
    const searchString = JSON.stringify(item).toLowerCase();
    return searchString.includes(searchTerm.toLowerCase());
  });

  const getKeys = () => {
    if (data.length === 0) return [];
    const allKeys = new Set<string>();
    data.slice(0, 30).forEach(item => {
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
    if (typeof value === 'object') {
       return JSON.stringify(value);
    }
    return String(value);
  };

  // Open Edit Modal
  const handleOpenEdit = (item: any = null) => {
    setIsNewRecord(!item);
    if (item) {
      setEditItem(item);
      const fieldsObj: Record<string, string> = {};
      Object.keys(item).forEach(k => {
        if (k !== 'id') {
          const val = item[k];
          if (val && typeof val === 'object' && val.seconds) {
            fieldsObj[k] = new Date(val.seconds * 1000).toISOString();
          } else if (typeof val === 'object') {
            fieldsObj[k] = JSON.stringify(val, null, 2);
          } else {
            fieldsObj[k] = String(val ?? '');
          }
        }
      });
      setEditFields(fieldsObj);
      setEditJsonString(JSON.stringify(item, null, 2));
    } else {
      setEditItem(null);
      setEditFields({
        name: '',
        status: 'active'
      });
      setEditJsonString(JSON.stringify({ name: 'Yeni Kayıt', status: 'active' }, null, 2));
    }
    setEditJsonMode(false);
    setNewFieldName('');
    setNewFieldValue('');
  };

  const handleAddField = () => {
    if (!newFieldName.trim()) return;
    setEditFields(prev => ({
      ...prev,
      [newFieldName.trim()]: newFieldValue
    }));
    setNewFieldName('');
    setNewFieldValue('');
  };

  const handleRemoveField = (fieldKey: string) => {
    setEditFields(prev => {
      const next = { ...prev };
      delete next[fieldKey];
      return next;
    });
  };

  const handleSaveDoc = async () => {
    if (!activeCollectionId) return;
    setActionLoading(true);
    try {
      let finalData: Record<string, any> = {};

      if (editJsonMode) {
        try {
          finalData = JSON.parse(editJsonString);
        } catch (e: any) {
          alert('Geçersiz JSON formatı! Lütfen kontrol ediniz: ' + e.message);
          setActionLoading(false);
          return;
        }
      } else {
        Object.keys(editFields).forEach(k => {
          const rawVal = editFields[k];
          if (rawVal === 'true') finalData[k] = true;
          else if (rawVal === 'false') finalData[k] = false;
          else if (!isNaN(Number(rawVal)) && rawVal.trim() !== '') finalData[k] = Number(rawVal);
          else if (rawVal.startsWith('{') || rawVal.startsWith('[')) {
            try {
              finalData[k] = JSON.parse(rawVal);
            } catch {
              finalData[k] = rawVal;
            }
          } else {
            finalData[k] = rawVal;
          }
        });
      }

      const docId = isNewRecord ? (finalData.id || null) : editItem?.id;
      await cmsService.saveDocument(activeCollectionId, docId, finalData);

      setEditItem(null);
      setIsNewRecord(false);
      await fetchData();
    } catch (err: any) {
      console.error('Error saving document:', err);
      alert('Kayıt sırasında bir hata oluştu: ' + (err.message || 'Bilinmeyen hata'));
    } finally {
      setActionLoading(false);
    }
  };

  // Open Delete Check Modal
  const handleOpenDelete = async (item: any) => {
    if (!activeCollectionId) return;
    setDeleteItem(item);
    setCheckingRelations(true);
    setRelatedRecords([]);

    try {
      const relations = await cmsService.checkRelatedRecords(activeCollectionId, item.id, item);
      setRelatedRecords(relations);
    } catch (e) {
      console.error('Error checking relations:', e);
    } finally {
      setCheckingRelations(false);
    }
  };

  // Confirm Single Delete
  const handleConfirmSingleDelete = async () => {
    if (!activeCollectionId || !deleteItem) return;
    setDeleting(true);
    try {
      await cmsService.deleteDocument(activeCollectionId, deleteItem.id);
      setDeleteItem(null);
      setRelatedRecords([]);
      await fetchData();
    } catch (e: any) {
      console.error('Error deleting document:', e);
      alert('Silme işlemi sırasında hata oluştu: ' + e.message);
    } finally {
      setDeleting(false);
    }
  };

  // Confirm Cascade Delete
  const handleConfirmCascadeDelete = async () => {
    if (!activeCollectionId || !deleteItem) return;
    setDeleting(true);
    try {
      await cmsService.cascadeDelete(activeCollectionId, deleteItem.id, relatedRecords);
      setDeleteItem(null);
      setRelatedRecords([]);
      await fetchData();
    } catch (e: any) {
      console.error('Error during cascade delete:', e);
      alert('İlişkili veriler silinirken hata oluştu: ' + e.message);
    } finally {
      setDeleting(false);
    }
  };

  const totalRelatedCount = relatedRecords.reduce((acc, r) => acc + r.count, 0);

  return (
    <div className="space-y-8 animate-in fade-in duration-700 pb-20">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div onClick={() => setActiveCollectionId(null)} className="cursor-pointer group">
          <h1 className="text-3xl font-black text-white tracking-widest uppercase flex items-center gap-4">
            <Database className="text-red-600 w-8 h-8 group-hover:scale-110 transition-transform" />
            CMS <span className="text-red-600">VERİTABANI PANELİ</span>
          </h1>
          <p className="text-slate-500 mt-2 font-bold tracking-tight text-sm">
            {activeMeta ? `Şu an yönetilen tablo: ${activeMeta.name} (${activeCollectionId})` : 'Tüm Firestore koleksiyonlarını görüntüleyin, düzenleyin veya güvenle silin.'}
          </p>
        </div>
        
        {activeCollectionId ? (
          <div className="flex items-center gap-3">
            <button 
              onClick={() => handleOpenEdit(null)}
              className="px-6 py-4 bg-red-600 hover:bg-red-500 text-white rounded-2xl transition-all font-black text-xs uppercase tracking-widest flex items-center gap-2 shadow-lg shadow-red-600/20"
            >
              <Plus size={16} /> Yeni Kayıt Ekle
            </button>
            <button 
              onClick={() => setActiveCollectionId(null)}
              className="px-6 py-4 bg-white/5 border border-white/10 rounded-2xl text-slate-400 hover:text-white hover:bg-white/10 transition-all font-black text-xs uppercase tracking-widest"
            >
              Koleksiyonlara Dön
            </button>
            <button 
              onClick={fetchData}
              className="p-4 bg-white/5 border border-white/10 rounded-2xl text-slate-400 hover:text-white transition-all"
              title="Yenile"
            >
              <RefreshCw size={20} className={loading ? "animate-spin" : ""} />
            </button>
          </div>
        ) : (
          <div className="flex items-center gap-3">
            <span className="text-xs font-black text-slate-500 uppercase tracking-widest bg-white/5 px-4 py-2.5 rounded-2xl border border-white/10">
              Koleksiyon Sayısı: <span className="text-white">{allCollectionKeys.length}</span>
            </span>
          </div>
        )}
      </div>

      <AnimatePresence mode="wait">
        {!activeCollectionId ? (
          <motion.div 
            key="grid-view"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="space-y-6"
          >
            {/* Filters Bar */}
            <div className="bg-[#070b14] border border-white/5 rounded-[32px] p-6 space-y-4">
              <div className="flex flex-col lg:flex-row gap-4 items-center justify-between">
                <div className="relative w-full lg:w-96 group">
                  <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-red-500 transition-colors" size={18} />
                  <input 
                    type="text" 
                    placeholder="Koleksiyon ismi veya açıklama ara..."
                    value={collectionSearch}
                    onChange={(e) => setCollectionSearch(e.target.value)}
                    className="w-full bg-white/5 border border-white/10 rounded-2xl py-3.5 pl-14 pr-6 text-xs text-slate-300 outline-none focus:border-red-600/50 focus:bg-red-600/[0.02] transition-all font-bold"
                  />
                </div>

                {/* Category Pills */}
                <div className="flex items-center gap-2 overflow-x-auto w-full lg:w-auto pb-2 lg:pb-0">
                  {categories.map((cat) => {
                    const CatIcon = categoryIcons[cat] || Database;
                    const isActive = selectedCategory === cat;
                    return (
                      <button
                        key={cat}
                        onClick={() => setSelectedCategory(cat)}
                        className={`px-4 py-2.5 rounded-2xl text-[11px] font-black uppercase tracking-wider transition-all flex items-center gap-2 whitespace-nowrap
                          ${isActive ? 'bg-red-600 text-white shadow-lg shadow-red-600/20' : 'bg-white/5 text-slate-400 hover:text-white hover:bg-white/10'}
                        `}
                      >
                        <CatIcon size={14} />
                        {cat}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Collection Cards Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
              {filteredCollections.map((key) => {
                const meta = collectionMetadata[key];
                const CollIcon = collectionIconMap[key] || Database;
                return (
                  <button
                    key={key}
                    onClick={() => setActiveCollectionId(key)}
                    className="group relative bg-[#0a0f1a] border border-white/5 rounded-[32px] p-6 text-left hover:border-red-600/30 hover:bg-[#0f172a]/60 transition-all duration-300 overflow-hidden flex flex-col justify-between"
                  >
                    <div className="absolute top-0 right-0 p-6 opacity-[0.03] group-hover:opacity-[0.08] transition-opacity">
                      <CollIcon size={100} />
                    </div>
                    
                    <div>
                      <div className="flex items-center justify-between mb-4">
                        <div className="bg-red-600/10 text-red-500 w-12 h-12 rounded-2xl flex items-center justify-center group-hover:scale-110 group-hover:bg-red-600 group-hover:text-white transition-all duration-300">
                          <CollIcon size={24} />
                        </div>
                        <span className="text-[9px] font-black uppercase tracking-widest text-slate-500 bg-white/5 px-2.5 py-1 rounded-full border border-white/5">
                          {meta.category}
                        </span>
                      </div>
                      
                      <h3 className="text-lg font-black text-white uppercase tracking-tight mb-1 group-hover:text-red-500 transition-colors">{meta.name}</h3>
                      <p className="text-slate-500 font-bold text-xs leading-relaxed line-clamp-2">{meta.description}</p>
                    </div>
                    
                    <div className="mt-6 pt-4 border-t border-white/5 flex items-center justify-between text-slate-500 group-hover:text-red-500 font-black text-[10px] uppercase tracking-widest transition-colors">
                      <span className="font-mono text-[9px] text-slate-600">{key}</span>
                      <div className="flex items-center gap-1">
                        İncele <ChevronRight size={12} />
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          </motion.div>
        ) : (
          <motion.div 
            key="table-view"
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.98 }}
            className="space-y-6"
          >
            {/* Table Controls */}
            <div className="bg-[#070b14] border border-white/5 rounded-[32px] p-5">
              <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
                 <div className="relative flex-1 w-full group">
                    <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-red-500 transition-colors" size={18} />
                    <input 
                      type="text" 
                      placeholder={`${activeMeta?.name} tablosunda ara...`}
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="w-full bg-white/5 border border-white/10 rounded-2xl py-3.5 pl-14 pr-6 text-xs text-slate-300 outline-none focus:border-red-600/50 focus:bg-red-600/[0.02] transition-all font-bold"
                    />
                 </div>
                 
                 <div className="flex items-center gap-3 w-full md:w-auto justify-end">
                    <div className="bg-white/5 border border-white/10 rounded-2xl p-1 flex items-center gap-1">
                       <button 
                         onClick={() => setSortField('updatedAt')}
                         className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all
                           ${sortField === 'updatedAt' ? 'bg-red-600 text-white shadow-lg shadow-red-600/20' : 'text-slate-500 hover:text-white'}
                         `}
                       >
                         En Güncel
                       </button>
                       <button 
                         onClick={() => setSortField('createdAt')}
                         className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all
                           ${sortField === 'createdAt' ? 'bg-red-600 text-white shadow-lg shadow-red-600/20' : 'text-slate-500 hover:text-white'}
                         `}
                       >
                         En Yeni
                       </button>
                       <button 
                         onClick={() => setSortField('')}
                         className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all
                           ${sortField === '' ? 'bg-red-600 text-white shadow-lg shadow-red-600/20' : 'text-slate-500 hover:text-white'}
                         `}
                       >
                         Varsayılan
                       </button>
                    </div>
                 </div>
              </div>
            </div>

            {/* Table Detail */}
            <div className="bg-[#070b14] border border-white/5 rounded-[32px] overflow-hidden shadow-2xl">
              <div className="overflow-x-auto">
                 <table className="w-full border-collapse">
                    <thead>
                       <tr className="border-b border-white/5 bg-white/[0.02]">
                          <th className="px-6 py-5 text-left text-[10px] font-black uppercase tracking-[0.2em] text-slate-600 w-12">#</th>
                          {keys.map((key) => (
                            <th key={key} className="px-5 py-5 text-left text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">
                               {columnTranslations[key] || key.toUpperCase()}
                            </th>
                          ))}
                          <th className="px-6 py-5 text-right text-[10px] font-black uppercase tracking-[0.2em] text-slate-600">İŞLEMLER</th>
                       </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5">
                       {loading ? (
                         Array.from({ length: 6 }).map((_, i) => (
                           <tr key={i} className="animate-pulse">
                              <td colSpan={keys.length + 2} className="px-8 py-6">
                                 <div className="h-4 bg-white/5 rounded-full w-full"></div>
                              </td>
                           </tr>
                         ))
                       ) : filteredData.length === 0 ? (
                         <tr>
                            <td colSpan={keys.length + 2} className="px-8 py-28 text-center">
                               <div className="flex flex-col items-center gap-4">
                                  <div className="w-20 h-20 bg-white/5 rounded-full flex items-center justify-center">
                                     <TableIcon size={36} className="text-slate-700" />
                                  </div>
                                  <div>
                                     <h3 className="text-xl font-black text-white uppercase">Kayıt Bulunamadı</h3>
                                     <p className="text-slate-500 font-bold text-xs mt-1">Bu koleksiyonda henüz veri yok veya arama sonucuna uymuyor.</p>
                                  </div>
                                  <button
                                    onClick={() => handleOpenEdit(null)}
                                    className="mt-2 px-5 py-2.5 bg-red-600 hover:bg-red-500 text-white rounded-xl text-xs font-black uppercase tracking-wider flex items-center gap-2"
                                  >
                                    <Plus size={14} /> İlk Kaydı Ekle
                                  </button>
                               </div>
                            </td>
                         </tr>
                       ) : (
                         filteredData.map((item, index) => (
                           <tr key={item.id} className="hover:bg-white/[0.02] transition-colors group border-white/5">
                              <td className="px-6 py-4 text-xs font-bold text-slate-700">{index + 1}</td>
                              {keys.map((key) => (
                                <td key={key} className="px-5 py-4">
                                   <div className={`text-xs font-bold truncate max-w-[220px] 
                                      ${key === 'id' ? 'font-mono text-[10px] text-slate-500 opacity-70' : 'text-slate-300'}
                                      ${(key === 'email' || key === 'displayName' || key === 'name' || key === 'title') ? 'text-white' : ''}
                                   `}>
                                      {formatValue(item[key])}
                                   </div>
                                </td>
                              ))}
                              <td className="px-6 py-4 text-right">
                                 <div className="flex items-center justify-end gap-1">
                                    <button 
                                      onClick={() => setInspectItem(item)}
                                      className="p-2 text-slate-400 hover:text-cyan-400 hover:bg-cyan-500/10 rounded-xl transition-all"
                                      title="İncele / Detay"
                                    >
                                       <Eye size={16} />
                                    </button>
                                    <button 
                                      onClick={() => handleOpenEdit(item)}
                                      className="p-2 text-slate-400 hover:text-amber-400 hover:bg-amber-500/10 rounded-xl transition-all"
                                      title="Düzenle"
                                    >
                                       <Edit3 size={16} />
                                    </button>
                                    <button 
                                      onClick={() => handleOpenDelete(item)}
                                      className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-500/10 rounded-xl transition-all"
                                      title="Sil"
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
              
              <div className="px-8 py-5 border-t border-white/5 bg-white/[0.01] flex items-center justify-between text-xs">
                 <div className="text-[10px] font-black text-slate-500 uppercase tracking-widest">
                    Toplam <span className="text-white">{filteredData.length}</span> Kayıt Listelendi
                 </div>
                 <div className="text-[10px] text-slate-600 font-mono">
                    Tablo: {activeCollectionId}
                 </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Inspect Detail Modal */}
      <AnimatePresence>
        {inspectItem && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-[#0b0f19] border border-white/10 rounded-[32px] max-w-3xl w-full max-h-[85vh] flex flex-col shadow-2xl overflow-hidden"
            >
              <div className="px-8 py-6 border-b border-white/10 flex items-center justify-between bg-white/[0.02]">
                <div className="flex items-center gap-3">
                  <div className="p-3 bg-cyan-500/10 text-cyan-400 rounded-2xl">
                    <Eye size={20} />
                  </div>
                  <div>
                    <h3 className="text-lg font-black text-white uppercase tracking-tight">Kayıt Detayı</h3>
                    <p className="text-slate-500 text-xs font-mono">{activeCollectionId} / {inspectItem.id}</p>
                  </div>
                </div>
                <button 
                  onClick={() => setInspectItem(null)}
                  className="p-2 text-slate-400 hover:text-white bg-white/5 rounded-xl transition-colors"
                >
                  <X size={20} />
                </button>
              </div>

              <div className="p-8 overflow-y-auto space-y-4 text-xs font-mono">
                {Object.keys(inspectItem).map((k) => (
                  <div key={k} className="p-4 bg-white/5 border border-white/5 rounded-2xl flex flex-col gap-1">
                    <div className="text-[10px] font-black text-cyan-400 uppercase tracking-widest">{columnTranslations[k] || k} ({k})</div>
                    <div className="text-slate-200 font-sans text-sm break-all font-semibold">
                      {typeof inspectItem[k] === 'object' ? JSON.stringify(inspectItem[k], null, 2) : String(inspectItem[k] ?? '-')}
                    </div>
                  </div>
                ))}
              </div>

              <div className="px-8 py-5 border-t border-white/10 bg-white/[0.02] flex items-center justify-end gap-3">
                <button
                  onClick={() => {
                    const item = inspectItem;
                    setInspectItem(null);
                    handleOpenEdit(item);
                  }}
                  className="px-5 py-2.5 bg-amber-600 hover:bg-amber-500 text-white rounded-xl text-xs font-black uppercase tracking-wider flex items-center gap-2"
                >
                  <Edit3 size={14} /> Düzenle
                </button>
                <button
                  onClick={() => setInspectItem(null)}
                  className="px-5 py-2.5 bg-white/10 hover:bg-white/20 text-white rounded-xl text-xs font-black uppercase tracking-wider"
                >
                  Kapat
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Edit / New Modal */}
      <AnimatePresence>
        {(editItem !== null || isNewRecord) && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-[#0b0f19] border border-white/10 rounded-[32px] max-w-3xl w-full max-h-[90vh] flex flex-col shadow-2xl overflow-hidden"
            >
              <div className="px-8 py-6 border-b border-white/10 flex items-center justify-between bg-white/[0.02]">
                <div className="flex items-center gap-3">
                  <div className="p-3 bg-amber-500/10 text-amber-400 rounded-2xl">
                    <Edit3 size={20} />
                  </div>
                  <div>
                    <h3 className="text-lg font-black text-white uppercase tracking-tight">
                      {isNewRecord ? 'Yeni Kayıt Ekle' : 'Kaydı Düzenle'}
                    </h3>
                    <p className="text-slate-500 text-xs font-mono">{activeCollectionId} {editItem?.id ? `/ ${editItem.id}` : ''}</p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <div className="bg-white/5 border border-white/10 rounded-xl p-1 flex items-center">
                    <button
                      onClick={() => setEditJsonMode(false)}
                      className={`px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-wider transition-all ${!editJsonMode ? 'bg-amber-500 text-white' : 'text-slate-400 hover:text-white'}`}
                    >
                      Form
                    </button>
                    <button
                      onClick={() => setEditJsonMode(true)}
                      className={`px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-wider transition-all ${editJsonMode ? 'bg-amber-500 text-white' : 'text-slate-400 hover:text-white'}`}
                    >
                      JSON
                    </button>
                  </div>
                  <button 
                    onClick={() => { setEditItem(null); setIsNewRecord(false); }}
                    className="p-2 text-slate-400 hover:text-white bg-white/5 rounded-xl transition-colors"
                  >
                    <X size={20} />
                  </button>
                </div>
              </div>

              <div className="p-8 overflow-y-auto space-y-6">
                {editJsonMode ? (
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">Ham JSON Verisi</label>
                    <textarea 
                      value={editJsonString}
                      onChange={(e) => setEditJsonString(e.target.value)}
                      rows={16}
                      className="w-full bg-slate-950 border border-white/10 rounded-2xl p-4 font-mono text-xs text-amber-300 focus:outline-none focus:border-amber-500 transition-colors leading-relaxed"
                    />
                  </div>
                ) : (
                  <div className="space-y-4">
                    {Object.keys(editFields).map((fieldKey) => (
                      <div key={fieldKey} className="p-4 bg-white/5 border border-white/5 rounded-2xl space-y-1.5 relative group">
                        <div className="flex items-center justify-between">
                          <label className="text-[10px] font-black text-amber-400 uppercase tracking-widest">
                            {columnTranslations[fieldKey] || fieldKey} <span className="text-slate-600 font-mono">({fieldKey})</span>
                          </label>
                          <button
                            onClick={() => handleRemoveField(fieldKey)}
                            className="text-slate-600 hover:text-red-500 transition-colors p-1"
                            title="Alanı Kaldır"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>

                        {editFields[fieldKey].length > 60 || editFields[fieldKey].includes('\n') ? (
                          <textarea
                            value={editFields[fieldKey]}
                            onChange={(e) => setEditFields({ ...editFields, [fieldKey]: e.target.value })}
                            rows={3}
                            className="w-full bg-slate-950 border border-white/10 rounded-xl p-3 text-xs text-white outline-none focus:border-amber-500 font-medium"
                          />
                        ) : (
                          <input
                            type="text"
                            value={editFields[fieldKey]}
                            onChange={(e) => setEditFields({ ...editFields, [fieldKey]: e.target.value })}
                            className="w-full bg-slate-950 border border-white/10 rounded-xl p-3 text-xs text-white outline-none focus:border-amber-500 font-medium"
                          />
                        )}
                      </div>
                    ))}

                    {/* Add Custom Field row */}
                    <div className="p-4 border border-dashed border-white/10 rounded-2xl space-y-3 bg-white/[0.01]">
                      <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest block">+ Yeni Alan Ekle</span>
                      <div className="flex flex-col sm:flex-row gap-2">
                        <input
                          type="text"
                          placeholder="Alan Adı (örn: role, grade)"
                          value={newFieldName}
                          onChange={(e) => setNewFieldName(e.target.value)}
                          className="flex-1 bg-slate-950 border border-white/10 rounded-xl p-3 text-xs text-white outline-none focus:border-amber-500"
                        />
                        <input
                          type="text"
                          placeholder="Alan Değeri"
                          value={newFieldValue}
                          onChange={(e) => setNewFieldValue(e.target.value)}
                          className="flex-1 bg-slate-950 border border-white/10 rounded-xl p-3 text-xs text-white outline-none focus:border-amber-500"
                        />
                        <button
                          type="button"
                          onClick={handleAddField}
                          className="px-4 py-3 bg-white/10 hover:bg-white/20 text-white rounded-xl text-xs font-black uppercase tracking-wider whitespace-nowrap"
                        >
                          Ekle
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              <div className="px-8 py-5 border-t border-white/10 bg-white/[0.02] flex items-center justify-end gap-3">
                <button
                  onClick={() => { setEditItem(null); setIsNewRecord(false); }}
                  className="px-5 py-2.5 bg-white/10 hover:bg-white/20 text-slate-300 rounded-xl text-xs font-black uppercase tracking-wider"
                >
                  İptal
                </button>
                <button
                  onClick={handleSaveDoc}
                  disabled={actionLoading}
                  className="px-6 py-2.5 bg-amber-600 hover:bg-amber-500 text-white rounded-xl text-xs font-black uppercase tracking-wider flex items-center gap-2 shadow-lg shadow-amber-600/20 disabled:opacity-50"
                >
                  {actionLoading ? <RefreshCw size={14} className="animate-spin" /> : <Check size={14} />} Kaydet
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Delete / Relationship Warning Modal */}
      <AnimatePresence>
        {deleteItem && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-[#0b0f19] border border-red-600/30 rounded-[32px] max-w-2xl w-full flex flex-col shadow-2xl overflow-hidden"
            >
              <div className="px-8 py-6 border-b border-red-600/20 bg-red-600/10 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-3 bg-red-600 text-white rounded-2xl shadow-lg shadow-red-600/30">
                    <ShieldAlert size={22} />
                  </div>
                  <div>
                    <h3 className="text-lg font-black text-white uppercase tracking-tight">Kayıt Silme İşlemi</h3>
                    <p className="text-red-400/80 text-xs font-mono">{activeCollectionId} / {deleteItem.id}</p>
                  </div>
                </div>
                <button 
                  onClick={() => { setDeleteItem(null); setRelatedRecords([]); }}
                  className="p-2 text-slate-400 hover:text-white bg-white/5 rounded-xl transition-colors"
                >
                  <X size={20} />
                </button>
              </div>

              <div className="p-8 space-y-6">
                {checkingRelations ? (
                  <div className="py-12 flex flex-col items-center justify-center gap-4 text-center">
                    <RefreshCw size={32} className="animate-spin text-red-500" />
                    <p className="text-slate-300 font-bold text-sm">Diğer tablolardaki bağlantılı veriler taranıyor...</p>
                  </div>
                ) : relatedRecords.length > 0 ? (
                  <div className="space-y-4">
                    <div className="p-5 bg-red-500/10 border border-red-500/20 rounded-2xl space-y-2">
                      <div className="flex items-center gap-2 text-red-500 font-black text-xs uppercase tracking-wider">
                        <AlertTriangle size={16} /> BİRBİRİNE BAĞLI VERİLER TESPİT EDİLDİ
                      </div>
                      <p className="text-slate-300 font-medium text-xs leading-relaxed">
                        Bu kaydı (<span className="text-white font-mono">{deleteItem.id}</span>) sildiğinizde diğer koleksiyonlarda bulunan aşağıdaki ilişkili veriler de etkilenecektir:
                      </p>
                    </div>

                    <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
                      {relatedRecords.map((rel) => (
                        <div key={rel.collectionId} className="p-3.5 bg-white/5 border border-white/5 rounded-xl flex items-center justify-between">
                          <div>
                            <span className="text-xs font-black text-white">{rel.collectionName}</span>
                            <span className="text-[10px] text-slate-500 font-mono ml-2">({rel.collectionId})</span>
                          </div>
                          <span className="px-3 py-1 bg-red-500/20 text-red-400 border border-red-500/30 rounded-lg text-xs font-black">
                            {rel.count} kayıt
                          </span>
                        </div>
                      ))}
                    </div>

                    <p className="text-[11px] text-slate-400 italic">
                      Lütfen silme tercihini yapınız. Tüm ilişkili verileri otomatik temizleyebilir veya yalnızca ana kaydı silebilirsiniz.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    <p className="text-slate-300 font-medium text-sm">
                      Bu kaydı (<span className="text-white font-mono">{deleteItem.id}</span>) silmek istediğinize emin misiniz?
                    </p>
                    <p className="text-slate-500 text-xs">Bu işlem geri alınamaz.</p>
                  </div>
                )}
              </div>

              <div className="px-8 py-5 border-t border-white/10 bg-white/[0.02] flex flex-col sm:flex-row items-center justify-end gap-3">
                <button
                  onClick={() => { setDeleteItem(null); setRelatedRecords([]); }}
                  className="w-full sm:w-auto px-5 py-2.5 bg-white/10 hover:bg-white/20 text-slate-300 rounded-xl text-xs font-black uppercase tracking-wider"
                >
                  İptal
                </button>

                {!checkingRelations && relatedRecords.length > 0 && (
                  <button
                    onClick={handleConfirmCascadeDelete}
                    disabled={deleting}
                    className="w-full sm:w-auto px-5 py-2.5 bg-red-600 hover:bg-red-500 text-white rounded-xl text-xs font-black uppercase tracking-wider flex items-center justify-center gap-2 shadow-lg shadow-red-600/30 disabled:opacity-50"
                  >
                    {deleting ? <RefreshCw size={14} className="animate-spin" /> : <Trash2 size={14} />}
                    Tüm İlişkili Verilerle Sil ({totalRelatedCount + 1} Kayıt)
                  </button>
                )}

                {!checkingRelations && (
                  <button
                    onClick={handleConfirmSingleDelete}
                    disabled={deleting}
                    className={`w-full sm:w-auto px-5 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider flex items-center justify-center gap-2 transition-all disabled:opacity-50
                      ${relatedRecords.length > 0 ? 'bg-amber-600/20 text-amber-400 border border-amber-500/30 hover:bg-amber-600/30' : 'bg-red-600 text-white hover:bg-red-500 shadow-lg shadow-red-600/20'}
                    `}
                  >
                    {deleting ? <RefreshCw size={14} className="animate-spin" /> : <Trash2 size={14} />}
                    {relatedRecords.length > 0 ? 'Yalnızca Bu Kaydı Sil' : 'Evet, Sil'}
                  </button>
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
