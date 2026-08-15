import React, { useState, useEffect } from 'react';
import { 
  Bell, 
  Plus, 
  Search, 
  Filter, 
  Trash2, 
  Edit3, 
  Eye, 
  Pin, 
  Send, 
  CheckCircle2, 
  AlertTriangle, 
  Tag, 
  Users, 
  GraduationCap, 
  Briefcase, 
  HeartHandshake, 
  Clock, 
  ExternalLink, 
  X, 
  Megaphone,
  Sparkles,
  Info,
  Calendar,
  Check,
  RefreshCw,
  BarChart2,
  FileText
} from 'lucide-react';
import { 
  collection, 
  query, 
  orderBy, 
  getDocs, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  doc, 
  where, 
  serverTimestamp,
  writeBatch
} from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { notificationService } from '../../services/notificationService';
import { motion, AnimatePresence } from 'motion/react';

export interface Announcement {
  id: string;
  title: string;
  summary: string;
  content: string;
  category: 'Önemli Duyuru' | 'Sistem Güncellemesi' | 'Seminer & Etkinlik' | 'Kampanya & İndirim' | 'Akademik Bilgilendirme' | 'Genel';
  priority: 'low' | 'normal' | 'high' | 'critical';
  targetAudience: 'all' | 'student' | 'coach' | 'parent' | 'gold_students';
  status: 'published' | 'draft' | 'archived';
  isPinned: boolean;
  bannerUrl?: string;
  actionUrl?: string;
  actionLabel?: string;
  viewsCount?: number;
  sentNotificationCount?: number;
  createdBy?: string;
  createdAt: any;
  updatedAt: any;
}

export default function AdminAnnouncements() {
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedTarget, setSelectedTarget] = useState<string>('all');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');

  // Modal State
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  // Form State
  const [formData, setFormData] = useState({
    title: '',
    summary: '',
    content: '',
    category: 'Önemli Duyuru' as Announcement['category'],
    priority: 'normal' as Announcement['priority'],
    targetAudience: 'all' as Announcement['targetAudience'],
    status: 'published' as Announcement['status'],
    isPinned: false,
    bannerUrl: '',
    actionUrl: '',
    actionLabel: 'Detayları Gör',
    sendPushNotification: true
  });

  const [saving, setSaving] = useState(false);
  const [previewItem, setPreviewItem] = useState<Announcement | null>(null);

  const fetchAnnouncements = async () => {
    try {
      setLoading(true);
      let list: Announcement[] = [];
      try {
        const q = query(collection(db, 'announcements'), orderBy('createdAt', 'desc'));
        const snap = await getDocs(q);
        list = snap.docs.map(docSnap => ({
          id: docSnap.id,
          ...docSnap.data()
        })) as Announcement[];
      } catch (queryErr) {
        // Fallback to simple query if composite index is missing or query fails
        const snap = await getDocs(collection(db, 'announcements'));
        list = snap.docs.map(docSnap => ({
          id: docSnap.id,
          ...docSnap.data()
        })) as Announcement[];
        list.sort((a, b) => {
          const tA = a.createdAt?.toDate ? a.createdAt.toDate().getTime() : 0;
          const tB = b.createdAt?.toDate ? b.createdAt.toDate().getTime() : 0;
          return tB - tA;
        });
      }
      setAnnouncements(list);
    } catch (err) {
      console.error("Duyurular çekilirken hata:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAnnouncements();
  }, []);

  const resetForm = () => {
    setFormData({
      title: '',
      summary: '',
      content: '',
      category: 'Önemli Duyuru',
      priority: 'normal',
      targetAudience: 'all',
      status: 'published',
      isPinned: false,
      bannerUrl: '',
      actionUrl: '',
      actionLabel: 'Detayları Gör',
      sendPushNotification: true
    });
    setEditingId(null);
  };

  const handleOpenCreate = () => {
    resetForm();
    setShowModal(true);
  };

  const handleOpenEdit = (item: Announcement) => {
    setEditingId(item.id);
    setFormData({
      title: item.title || '',
      summary: item.summary || '',
      content: item.content || '',
      category: item.category || 'Önemli Duyuru',
      priority: item.priority || 'normal',
      targetAudience: item.targetAudience || 'all',
      status: item.status || 'published',
      isPinned: item.isPinned || false,
      bannerUrl: item.bannerUrl || '',
      actionUrl: item.actionUrl || '',
      actionLabel: item.actionLabel || 'Detayları Gör',
      sendPushNotification: false
    });
    setShowModal(true);
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm("Bu duyuruyu silmek istediğinize emin misiniz?")) return;
    try {
      await deleteDoc(doc(db, 'announcements', id));
      setAnnouncements(prev => prev.filter(a => a.id !== id));
    } catch (err) {
      console.error("Silme hatası:", err);
      alert("Duyuru silinirken bir hata oluştu.");
    }
  };

  const handleTogglePin = async (item: Announcement) => {
    try {
      const newPinState = !item.isPinned;
      await updateDoc(doc(db, 'announcements', item.id), {
        isPinned: newPinState,
        updatedAt: serverTimestamp()
      });
      setAnnouncements(prev => prev.map(a => a.id === item.id ? { ...a, isPinned: newPinState } : a));
    } catch (err) {
      console.error("Pin değiştirme hatası:", err);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title.trim() || !formData.content.trim()) {
      alert("Lütfen başlık ve içerik alanlarını doldurun.");
      return;
    }

    try {
      setSaving(true);
      let notifCount = 0;

      if (editingId) {
        // Update
        const ref = doc(db, 'announcements', editingId);
        await updateDoc(ref, {
          title: formData.title.trim(),
          summary: formData.summary.trim(),
          content: formData.content.trim(),
          category: formData.category,
          priority: formData.priority,
          targetAudience: formData.targetAudience,
          status: formData.status,
          isPinned: formData.isPinned,
          bannerUrl: formData.bannerUrl.trim(),
          actionUrl: formData.actionUrl.trim(),
          actionLabel: formData.actionLabel.trim(),
          updatedAt: serverTimestamp()
        });

        // Sync existing notifications for this announcement live
        try {
          const qNotifs = query(collection(db, 'notifications'), where('announcementId', '==', editingId));
          const notifSnap = await getDocs(qNotifs);
          if (!notifSnap.empty) {
            const batch = writeBatch(db);
            notifSnap.docs.forEach((nDoc) => {
              batch.update(nDoc.ref, {
                title: `📢 ${formData.title.trim()}`,
                message: formData.summary.trim() || formData.content.trim().substring(0, 100),
                category: formData.category,
                priority: formData.priority,
                summary: formData.summary.trim(),
                content: formData.content.trim(),
                bannerUrl: formData.bannerUrl.trim(),
                actionUrl: formData.actionUrl.trim(),
                actionLabel: formData.actionLabel.trim(),
                link: formData.actionUrl.trim()
              });
            });
            await batch.commit();
          }
        } catch (syncErr) {
          console.warn("Mevcut bildirimleri güncelleme uyarısı:", syncErr);
        }
      } else {
        // Create new
        const newAnnounce = {
          title: formData.title.trim(),
          summary: formData.summary.trim(),
          content: formData.content.trim(),
          category: formData.category,
          priority: formData.priority,
          targetAudience: formData.targetAudience,
          status: formData.status,
          isPinned: formData.isPinned,
          bannerUrl: formData.bannerUrl.trim(),
          actionUrl: formData.actionUrl.trim(),
          actionLabel: formData.actionLabel.trim(),
          viewsCount: 0,
          sentNotificationCount: 0,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp()
        };

        const docRef = await addDoc(collection(db, 'announcements'), newAnnounce);

        // Send notifications if published and sendPushNotification checked
        if (formData.status === 'published' && formData.sendPushNotification) {
          try {
            let usersQuery;
            if (formData.targetAudience === 'student') {
              usersQuery = query(collection(db, 'users'), where('role', '==', 'student'));
            } else if (formData.targetAudience === 'coach') {
              usersQuery = query(collection(db, 'users'), where('role', '==', 'coach'));
            } else if (formData.targetAudience === 'parent') {
              usersQuery = query(collection(db, 'users'), where('role', '==', 'parent'));
            } else {
              usersQuery = collection(db, 'users');
            }

            const usersSnap = await getDocs(usersQuery);
            const userDocs = usersSnap.docs;

            for (const uDoc of userDocs) {
              const uData = uDoc.data() as Record<string, any>;
              // If gold_students, filter locally
              if (formData.targetAudience === 'gold_students') {
                const pkg = (uData.subscriptionPlan || uData.package || uData.plan || '').toString().toLowerCase();
                if (!pkg.includes('altın') && !pkg.includes('altin') && !pkg.includes('gold') && !pkg.includes('vip')) {
                  continue;
                }
              }

              await notificationService.addNotification(uDoc.id, {
                title: `📢 ${formData.title.trim()}`,
                message: formData.summary.trim() || formData.content.trim().substring(0, 100),
                type: 'system',
                link: formData.actionUrl.trim(),
                announcementId: docRef.id,
                category: formData.category,
                priority: formData.priority,
                summary: formData.summary.trim(),
                content: formData.content.trim(),
                bannerUrl: formData.bannerUrl.trim(),
                actionUrl: formData.actionUrl.trim(),
                actionLabel: formData.actionLabel.trim()
              }).catch(e => console.warn("Notif error for user", uDoc.id, e));

              notifCount++;
            }

            await updateDoc(doc(db, 'announcements', docRef.id), {
              sentNotificationCount: notifCount
            });
          } catch (notifErr) {
            console.warn("Toplu bildirim gönderimi kısmi hata:", notifErr);
          }
        }
      }

      setShowModal(false);
      resetForm();
      fetchAnnouncements();
    } catch (err: any) {
      console.error("Duyuru kaydetme hatası:", err);
      alert("Duyuru kaydedilirken bir hata oluştu: " + (err?.message || ""));
    } finally {
      setSaving(false);
    }
  };

  const filteredAnnouncements = announcements.filter(item => {
    const matchesSearch = item.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          item.summary?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          item.content?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesCategory = selectedCategory === 'all' || item.category === selectedCategory;
    const matchesTarget = selectedTarget === 'all' || item.targetAudience === selectedTarget;
    const matchesStatus = selectedStatus === 'all' || item.status === selectedStatus;

    return matchesSearch && matchesCategory && matchesTarget && matchesStatus;
  });

  // Calculate statistics
  const totalCount = announcements.length;
  const publishedCount = announcements.filter(a => a.status === 'published').length;
  const pinnedCount = announcements.filter(a => a.isPinned).length;
  const draftCount = announcements.filter(a => a.status === 'draft').length;

  const getPriorityBadge = (priority: Announcement['priority']) => {
    switch (priority) {
      case 'critical':
        return <span className="bg-red-500/10 text-red-400 border border-red-500/20 px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider flex items-center gap-1"><AlertTriangle size={11} /> Kritik</span>;
      case 'high':
        return <span className="bg-amber-500/10 text-amber-400 border border-amber-500/20 px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider flex items-center gap-1"><Sparkles size={11} /> Yüksek</span>;
      case 'normal':
        return <span className="bg-blue-500/10 text-blue-400 border border-blue-500/20 px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider">Normal</span>;
      default:
        return <span className="bg-slate-500/10 text-slate-400 border border-slate-500/20 px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider">Düşük</span>;
    }
  };

  const getTargetBadge = (target: Announcement['targetAudience']) => {
    switch (target) {
      case 'student':
        return <span className="text-blue-400 bg-blue-500/10 border border-blue-500/20 px-2 py-0.5 rounded-md text-[10px] font-bold flex items-center gap-1"><GraduationCap size={12} /> Öğrenciler</span>;
      case 'coach':
        return <span className="text-amber-400 bg-amber-500/10 border border-amber-500/20 px-2 py-0.5 rounded-md text-[10px] font-bold flex items-center gap-1"><Briefcase size={12} /> Koçlar</span>;
      case 'parent':
        return <span className="text-purple-400 bg-purple-500/10 border border-purple-500/20 px-2 py-0.5 rounded-md text-[10px] font-bold flex items-center gap-1"><HeartHandshake size={12} /> Veliler</span>;
      case 'gold_students':
        return <span className="text-yellow-400 bg-yellow-500/10 border border-yellow-500/20 px-2 py-0.5 rounded-md text-[10px] font-bold flex items-center gap-1"><Sparkles size={12} /> Altın Paket Öğrencileri</span>;
      default:
        return <span className="text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded-md text-[10px] font-bold flex items-center gap-1"><Users size={12} /> Tüm Ekosistem</span>;
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-900/90 to-purple-950/40 border border-white/10 rounded-3xl p-6 md:p-8 shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-80 h-80 bg-purple-500/10 rounded-full blur-3xl -mr-20 -mt-20 pointer-events-none" />
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="bg-purple-500/10 border border-purple-500/20 text-purple-400 text-[10px] font-black uppercase tracking-wider px-3 py-1 rounded-full flex items-center gap-1.5">
                <Megaphone size={14} /> Bilgilendirme & Duyuru Portalı
              </span>
            </div>
            <h1 className="text-2xl md:text-3xl font-black text-white tracking-tight uppercase">
              Duyuru Yönetimi
            </h1>
            <p className="text-slate-400 text-xs md:text-sm mt-1 font-medium max-w-xl">
              Öğrencilere, koçlara, velilere veya tüm ekosisteme yönelik duyuru yayınlayın, öne çıkarın ve anlık sistem bildirimleri gönderin.
            </p>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            <button
              onClick={fetchAnnouncements}
              disabled={loading}
              className="px-4 py-2.5 bg-slate-950 hover:bg-slate-800 border border-white/10 text-white rounded-2xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer shadow-md disabled:opacity-50"
            >
              <RefreshCw size={14} className={loading ? "animate-spin text-purple-400" : "text-slate-400"} />
              <span>Yenile</span>
            </button>
            <button
              onClick={handleOpenCreate}
              className="px-5 py-2.5 bg-purple-600 hover:bg-purple-500 text-white rounded-2xl text-xs font-black transition-all flex items-center gap-2 shadow-lg shadow-purple-600/20 cursor-pointer active:scale-95"
            >
              <Plus size={16} />
              <span>Yeni Duyuru Oluştur</span>
            </button>
          </div>
        </div>
      </div>

      {/* KPI Stat Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-slate-900/60 border border-white/10 p-5 rounded-3xl relative overflow-hidden shadow-lg">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Toplam Duyuru</span>
            <div className="p-2 bg-purple-500/10 text-purple-400 rounded-xl border border-purple-500/20">
              <Megaphone size={18} />
            </div>
          </div>
          <h3 className="text-2xl font-black text-white">{totalCount}</h3>
          <p className="text-[10px] text-slate-500 mt-1">Sistemdeki tüm kayıtlar</p>
        </div>

        <div className="bg-slate-900/60 border border-white/10 p-5 rounded-3xl relative overflow-hidden shadow-lg">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Yayında</span>
            <div className="p-2 bg-emerald-500/10 text-emerald-400 rounded-xl border border-emerald-500/20">
              <CheckCircle2 size={18} />
            </div>
          </div>
          <h3 className="text-2xl font-black text-emerald-400">{publishedCount}</h3>
          <p className="text-[10px] text-slate-500 mt-1">Kullanıcılara görünür duyurular</p>
        </div>

        <div className="bg-slate-900/60 border border-white/10 p-5 rounded-3xl relative overflow-hidden shadow-lg">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Öne Çıkarılan</span>
            <div className="p-2 bg-amber-500/10 text-amber-400 rounded-xl border border-amber-500/20">
              <Pin size={18} />
            </div>
          </div>
          <h3 className="text-2xl font-black text-amber-400">{pinnedCount}</h3>
          <p className="text-[10px] text-slate-500 mt-1">Sabitlenmiş ana duyurular</p>
        </div>

        <div className="bg-slate-900/60 border border-white/10 p-5 rounded-3xl relative overflow-hidden shadow-lg">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Taslak / Bekleyen</span>
            <div className="p-2 bg-blue-500/10 text-blue-400 rounded-xl border border-blue-500/20">
              <FileText size={18} />
            </div>
          </div>
          <h3 className="text-2xl font-black text-slate-300">{draftCount}</h3>
          <p className="text-[10px] text-slate-500 mt-1">Henüz yayınlanmamış taslaklar</p>
        </div>
      </div>

      {/* Filter and Search Toolbar */}
      <div className="bg-slate-900/60 border border-white/10 p-4 md:p-6 rounded-3xl shadow-xl space-y-4">
        <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-4">
          {/* Search Box */}
          <div className="relative flex-1 min-w-[240px]">
            <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" />
            <input
              type="text"
              placeholder="Duyuru başlığı veya içerik ara..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-slate-950 border border-white/10 rounded-2xl py-2.5 pl-11 pr-4 text-xs font-medium text-white placeholder-slate-500 focus:outline-none focus:border-purple-500/50 transition-colors"
            />
          </div>

          {/* Filters */}
          <div className="flex items-center gap-2 overflow-x-auto pb-2 lg:pb-0 custom-scrollbar">
            {/* Category Filter */}
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="bg-slate-950 border border-white/10 rounded-2xl px-3 py-2 text-xs font-bold text-slate-300 focus:outline-none focus:border-purple-500/50 cursor-pointer"
            >
              <option value="all">Tüm Kategoriler</option>
              <option value="Önemli Duyuru">Önemli Duyuru</option>
              <option value="Sistem Güncellemesi">Sistem Güncellemesi</option>
              <option value="Seminer & Etkinlik">Seminer & Etkinlik</option>
              <option value="Kampanya & İndirim">Kampanya & İndirim</option>
              <option value="Akademik Bilgilendirme">Akademik Bilgilendirme</option>
              <option value="Genel">Genel</option>
            </select>

            {/* Target Audience Filter */}
            <select
              value={selectedTarget}
              onChange={(e) => setSelectedTarget(e.target.value)}
              className="bg-slate-950 border border-white/10 rounded-2xl px-3 py-2 text-xs font-bold text-slate-300 focus:outline-none focus:border-purple-500/50 cursor-pointer"
            >
              <option value="all">Tüm Hedef Kitleler</option>
              <option value="student">Öğrenciler</option>
              <option value="coach">Koçlar</option>
              <option value="parent">Veliler</option>
              <option value="gold_students">Altın Paket Öğrencileri</option>
            </select>

            {/* Status Filter */}
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="bg-slate-950 border border-white/10 rounded-2xl px-3 py-2 text-xs font-bold text-slate-300 focus:outline-none focus:border-purple-500/50 cursor-pointer"
            >
              <option value="all">Tüm Durumlar</option>
              <option value="published">Yayında</option>
              <option value="draft">Taslak</option>
              <option value="archived">Arşivlendi</option>
            </select>
          </div>
        </div>
      </div>

      {/* Announcements List / Grid */}
      <div className="space-y-4">
        {loading ? (
          <div className="text-center py-12 bg-slate-900/40 rounded-3xl border border-white/5">
            <RefreshCw size={24} className="animate-spin mx-auto text-purple-400 mb-2" />
            <p className="text-xs font-bold text-slate-400">Duyurular yükleniyor...</p>
          </div>
        ) : filteredAnnouncements.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {filteredAnnouncements.map((item) => (
              <div 
                key={item.id}
                className={`bg-slate-900/70 border rounded-3xl p-6 flex flex-col justify-between relative transition-all duration-300 hover:border-white/20 shadow-xl group ${
                  item.isPinned ? 'border-amber-500/40 bg-gradient-to-b from-amber-500/5 to-slate-900/80' : 'border-white/10'
                }`}
              >
                {/* Pin Ribbon */}
                {item.isPinned && (
                  <div className="absolute top-4 right-4 text-amber-400 bg-amber-500/10 border border-amber-500/20 p-1.5 rounded-xl text-xs font-bold flex items-center gap-1">
                    <Pin size={13} className="rotate-45" />
                    <span>Öne Çıkarıldı</span>
                  </div>
                )}

                <div>
                  {/* Category & Status Tags */}
                  <div className="flex items-center gap-2 mb-3 flex-wrap pr-24">
                    <span className="bg-purple-500/10 text-purple-300 border border-purple-500/20 px-2.5 py-0.5 rounded-full text-[10px] font-bold">
                      {item.category}
                    </span>
                    {getPriorityBadge(item.priority)}
                  </div>

                  {/* Title */}
                  <h3 className="text-base font-bold text-white mb-2 line-clamp-2 group-hover:text-purple-300 transition-colors">
                    {item.title}
                  </h3>

                  {/* Summary */}
                  {item.summary && (
                    <p className="text-xs text-slate-400 line-clamp-2 mb-4 font-medium leading-relaxed">
                      {item.summary}
                    </p>
                  )}

                  {/* Banner Image Preview */}
                  {item.bannerUrl && (
                    <div className="mb-4 rounded-2xl overflow-hidden border border-white/10 h-32 bg-slate-950">
                      <img src={item.bannerUrl} alt={item.title} className="w-full h-full object-cover" />
                    </div>
                  )}

                  {/* Target Audience Badge */}
                  <div className="mb-4">
                    {getTargetBadge(item.targetAudience)}
                  </div>
                </div>

                {/* Footer Metadata & Actions */}
                <div className="pt-4 border-t border-white/5 space-y-3">
                  <div className="flex items-center justify-between text-[11px] text-slate-500 font-medium">
                    <span className="flex items-center gap-1">
                      <Clock size={12} />
                      {item.createdAt?.toDate ? new Date(item.createdAt.toDate()).toLocaleDateString('tr-TR') : 'Bugün'}
                    </span>
                    {item.sentNotificationCount !== undefined && item.sentNotificationCount > 0 && (
                      <span className="text-emerald-400 flex items-center gap-1 font-bold">
                        <Send size={11} /> {item.sentNotificationCount} Bildirim
                      </span>
                    )}
                  </div>

                  <div className="flex items-center justify-between gap-2 pt-1">
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => setPreviewItem(item)}
                        className="p-2 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white rounded-xl transition-colors cursor-pointer"
                        title="Önizle"
                      >
                        <Eye size={14} />
                      </button>
                      <button
                        onClick={() => handleTogglePin(item)}
                        className={`p-2 rounded-xl transition-colors cursor-pointer ${
                          item.isPinned ? 'bg-amber-500/20 text-amber-400' : 'bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white'
                        }`}
                        title={item.isPinned ? "Sabitlemeyi Kaldır" : "Öne Çıkar"}
                      >
                        <Pin size={14} />
                      </button>
                    </div>

                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => handleOpenEdit(item)}
                        className="px-3 py-1.5 bg-purple-600/20 hover:bg-purple-600 text-purple-300 hover:text-white rounded-xl text-xs font-bold transition-all flex items-center gap-1 cursor-pointer"
                      >
                        <Edit3 size={13} />
                        <span>Düzenle</span>
                      </button>
                      <button
                        onClick={() => handleDelete(item.id)}
                        className="p-1.5 bg-red-500/10 hover:bg-red-500/20 text-red-400 rounded-xl transition-colors cursor-pointer"
                        title="Sil"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-16 bg-slate-900/40 rounded-3xl border border-dashed border-white/10 p-8">
            <Megaphone size={40} className="mx-auto text-slate-600 mb-3" />
            <h3 className="text-sm font-bold text-slate-300">Henüz Duyuru Bulunmuyor</h3>
            <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
              Arama kriterlerinize uygun duyuru bulunamadı veya henüz hiç duyuru eklenmedi.
            </p>
            <button
              onClick={handleOpenCreate}
              className="mt-4 px-4 py-2 bg-purple-600 hover:bg-purple-500 text-white rounded-2xl text-xs font-bold transition-all inline-flex items-center gap-1.5 cursor-pointer"
            >
              <Plus size={15} />
              <span>İlk Duyuruyu Oluştur</span>
            </button>
          </div>
        )}
      </div>

      {/* Create / Edit Modal */}
      <AnimatePresence>
        {showModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-md overflow-y-auto">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-slate-900 border border-white/10 rounded-3xl max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl p-6 md:p-8 space-y-6 my-auto"
            >
              <div className="flex items-center justify-between pb-4 border-b border-white/10">
                <div className="flex items-center gap-3">
                  <div className="p-3 bg-purple-500/10 text-purple-400 rounded-2xl border border-purple-500/20">
                    <Megaphone size={20} />
                  </div>
                  <div>
                    <h2 className="text-lg font-bold text-white">
                      {editingId ? "Duyuruyu Düzenle" : "Yeni Duyuru Yayınla"}
                    </h2>
                    <p className="text-xs text-slate-400">Sistem kullanıcıları için bilgilendirme mesajı</p>
                  </div>
                </div>
                <button
                  onClick={() => setShowModal(false)}
                  className="p-2 text-slate-400 hover:text-white bg-white/5 rounded-xl cursor-pointer"
                >
                  <X size={18} />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                {/* Title */}
                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1.5">
                    Duyuru Başlığı <span className="text-red-400">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Örn: YKS Deneme Sınavı Takvimi Güncellendi"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    className="w-full bg-slate-950 border border-white/10 rounded-2xl px-4 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-purple-500/50"
                  />
                </div>

                {/* Summary */}
                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1.5">
                    Kısa Özet (Bildirim Metni)
                  </label>
                  <input
                    type="text"
                    placeholder="Anlık bildirimlerde ve kart özetinde görünecek kısa cümle..."
                    value={formData.summary}
                    onChange={(e) => setFormData({ ...formData, summary: e.target.value })}
                    className="w-full bg-slate-950 border border-white/10 rounded-2xl px-4 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-purple-500/50"
                  />
                </div>

                {/* Category & Target Audience Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-300 mb-1.5">Kategori</label>
                    <select
                      value={formData.category}
                      onChange={(e) => setFormData({ ...formData, category: e.target.value as any })}
                      className="w-full bg-slate-950 border border-white/10 rounded-2xl px-3 py-2.5 text-xs font-bold text-white focus:outline-none focus:border-purple-500/50 cursor-pointer"
                    >
                      <option value="Önemli Duyuru">Önemli Duyuru</option>
                      <option value="Sistem Güncellemesi">Sistem Güncellemesi</option>
                      <option value="Seminer & Etkinlik">Seminer & Etkinlik</option>
                      <option value="Kampanya & İndirim">Kampanya & İndirim</option>
                      <option value="Akademik Bilgilendirme">Akademik Bilgilendirme</option>
                      <option value="Genel">Genel</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-300 mb-1.5">Hedef Kitle</label>
                    <select
                      value={formData.targetAudience}
                      onChange={(e) => setFormData({ ...formData, targetAudience: e.target.value as any })}
                      className="w-full bg-slate-950 border border-white/10 rounded-2xl px-3 py-2.5 text-xs font-bold text-white focus:outline-none focus:border-purple-500/50 cursor-pointer"
                    >
                      <option value="all">Tüm Ekosistem (Öğrenci, Koç, Veli)</option>
                      <option value="student">Sadece Öğrenciler</option>
                      <option value="coach">Sadece Koçlar</option>
                      <option value="parent">Sadece Veliler</option>
                      <option value="gold_students">Sadece Altın Paket Öğrencileri</option>
                    </select>
                  </div>
                </div>

                {/* Priority & Status Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-300 mb-1.5">Önem Derecesi</label>
                    <select
                      value={formData.priority}
                      onChange={(e) => setFormData({ ...formData, priority: e.target.value as any })}
                      className="w-full bg-slate-950 border border-white/10 rounded-2xl px-3 py-2.5 text-xs font-bold text-white focus:outline-none focus:border-purple-500/50 cursor-pointer"
                    >
                      <option value="low">Düşük</option>
                      <option value="normal">Normal</option>
                      <option value="high">Yüksek</option>
                      <option value="critical">Kritik (Kırmızı Vurgulu)</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-300 mb-1.5">Yayın Durumu</label>
                    <select
                      value={formData.status}
                      onChange={(e) => setFormData({ ...formData, status: e.target.value as any })}
                      className="w-full bg-slate-950 border border-white/10 rounded-2xl px-3 py-2.5 text-xs font-bold text-white focus:outline-none focus:border-purple-500/50 cursor-pointer"
                    >
                      <option value="published">Yayında (Aktif)</option>
                      <option value="draft">Taslak (Aşama Aşama)</option>
                      <option value="archived">Arşivlendi</option>
                    </select>
                  </div>
                </div>

                {/* Content */}
                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1.5">
                    Duyuru Detay İçeriği <span className="text-red-400">*</span>
                  </label>
                  <textarea
                    required
                    rows={5}
                    placeholder="Duyuru detay metnini yazın..."
                    value={formData.content}
                    onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                    className="w-full bg-slate-950 border border-white/10 rounded-2xl p-4 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-purple-500/50 leading-relaxed"
                  />
                </div>

                {/* Banner URL & Action Link */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-300 mb-1.5">Görsel / Banner URL (Opsiyonel)</label>
                    <input
                      type="url"
                      placeholder="https://..."
                      value={formData.bannerUrl}
                      onChange={(e) => setFormData({ ...formData, bannerUrl: e.target.value })}
                      className="w-full bg-slate-950 border border-white/10 rounded-2xl px-4 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-purple-500/50"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-300 mb-1.5">Yönlendirme Linki (Opsiyonel)</label>
                    <input
                      type="text"
                      placeholder="Örn: /panel/ogrenci/caba-testi veya https://..."
                      value={formData.actionUrl}
                      onChange={(e) => setFormData({ ...formData, actionUrl: e.target.value })}
                      className="w-full bg-slate-950 border border-white/10 rounded-2xl px-4 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-purple-500/50"
                    />
                  </div>
                </div>

                {/* Checkboxes */}
                <div className="space-y-3 pt-2">
                  <label className="flex items-center gap-2.5 text-xs font-medium text-slate-300 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.isPinned}
                      onChange={(e) => setFormData({ ...formData, isPinned: e.target.checked })}
                      className="rounded bg-slate-950 border-white/10 text-purple-600 focus:ring-purple-500 w-4 h-4"
                    />
                    <span>Bu duyuruyu panonun en üstüne sabitle (Öne Çıkar)</span>
                  </label>

                  {!editingId && (
                    <label className="flex items-center gap-2.5 text-xs font-medium text-purple-300 bg-purple-500/10 p-3 rounded-2xl border border-purple-500/20 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={formData.sendPushNotification}
                        onChange={(e) => setFormData({ ...formData, sendPushNotification: e.target.checked })}
                        className="rounded bg-slate-950 border-white/10 text-purple-600 focus:ring-purple-500 w-4 h-4"
                      />
                      <span>Hedef kitledeki tüm kullanıcılara anlık uygulama içi bildirim (Push Notification) gönder</span>
                    </label>
                  )}
                </div>

                {/* Modal Buttons */}
                <div className="flex items-center justify-end gap-3 pt-4 border-t border-white/10">
                  <button
                    type="button"
                    onClick={() => setShowModal(false)}
                    className="px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-2xl text-xs font-bold transition-all cursor-pointer"
                  >
                    İptal
                  </button>
                  <button
                    type="submit"
                    disabled={saving}
                    className="px-6 py-2.5 bg-purple-600 hover:bg-purple-500 text-white rounded-2xl text-xs font-black transition-all shadow-lg shadow-purple-600/20 flex items-center gap-2 cursor-pointer disabled:opacity-50"
                  >
                    {saving ? <RefreshCw size={14} className="animate-spin" /> : <Send size={14} />}
                    <span>{saving ? "Kaydediliyor..." : editingId ? "Güncelle" : "Yayınla & Gönder"}</span>
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Preview Modal */}
      <AnimatePresence>
        {previewItem && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-md">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-slate-900 border border-white/10 rounded-3xl max-w-xl w-full p-6 md:p-8 space-y-5 shadow-2xl relative my-auto"
            >
              <button
                onClick={() => setPreviewItem(null)}
                className="absolute top-6 right-6 p-2 text-slate-400 hover:text-white bg-white/5 rounded-xl cursor-pointer"
              >
                <X size={18} />
              </button>

              <div className="flex items-center gap-2 flex-wrap">
                <span className="bg-purple-500/10 text-purple-300 border border-purple-500/20 px-3 py-1 rounded-full text-xs font-bold">
                  {previewItem.category}
                </span>
                {getPriorityBadge(previewItem.priority)}
                {getTargetBadge(previewItem.targetAudience)}
              </div>

              <h2 className="text-xl font-black text-white">{previewItem.title}</h2>

              {previewItem.bannerUrl && (
                <div className="rounded-2xl overflow-hidden border border-white/10 max-h-56 bg-slate-950">
                  <img src={previewItem.bannerUrl} alt={previewItem.title} className="w-full h-full object-cover" />
                </div>
              )}

              <div className="bg-slate-950 p-4 rounded-2xl border border-white/5 text-xs text-slate-300 leading-relaxed whitespace-pre-wrap">
                {previewItem.content}
              </div>

              {previewItem.actionUrl && (
                <a
                  href={previewItem.actionUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-2 px-5 py-2.5 bg-purple-600 hover:bg-purple-500 text-white rounded-2xl text-xs font-bold transition-all shadow-lg"
                >
                  <span>{previewItem.actionLabel || 'Detayları Gör'}</span>
                  <ExternalLink size={14} />
                </a>
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
