import React, { useState, useEffect, useMemo } from 'react';
import { 
  collection, 
  query, 
  orderBy, 
  onSnapshot, 
  doc, 
  updateDoc, 
  deleteDoc, 
  writeBatch,
  getDocs
} from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { 
  ShieldAlert, 
  Search, 
  Filter, 
  Trash2, 
  CheckCircle2, 
  Clock, 
  AlertTriangle, 
  Info, 
  User, 
  ExternalLink, 
  Copy, 
  Check, 
  RefreshCw, 
  Download, 
  Monitor, 
  Globe, 
  Laptop, 
  ChevronRight, 
  X, 
  FileText, 
  Sparkles, 
  CheckCheck,
  Eye,
  AlertCircle
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { systemLogger, SystemErrorLog, ErrorSeverity, ErrorStatus } from '../../services/systemLogger';
import { useAuth } from '../../lib/AuthContext';

export default function AdminErrorLogs() {
  const { userData } = useAuth();
  const [logs, setLogs] = useState<SystemErrorLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedLog, setSelectedLog] = useState<SystemErrorLog | null>(null);
  
  // Search & Filter state
  const [searchTerm, setSearchTerm] = useState('');
  const [severityFilter, setSeverityFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [roleFilter, setRoleFilter] = useState<string>('all');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [dateRangeFilter, setDateRangeFilter] = useState<'all' | 'today' | '3days' | '7days'>('all');

  // Copy feedback state
  const [copiedCode, setCopiedCode] = useState<string | null>(null);
  const [isTestCreating, setIsTestCreating] = useState(false);
  const [actionSuccessMsg, setActionSuccessMsg] = useState<string | null>(null);
  const [adminNoteInput, setAdminNoteInput] = useState('');

  const fetchServerLogs = async () => {
    try {
      const res = await fetch('/api/admin/system-error-logs');
      const data = await res.json();
      if (data?.logs && Array.isArray(data.logs)) {
        setLogs(data.logs);
      }
    } catch {
      // silently handle
    } finally {
      setLoading(false);
    }
  };

  // Real-time listener for system error logs with resilient fallback
  useEffect(() => {
    if (!db) {
      fetchServerLogs();
      return;
    }

    setLoading(true);
    let isSubscribed = true;
    const logsRef = collection(db, 'system_error_logs');
    const q = query(logsRef, orderBy('timestamp', 'desc'));

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        if (!isSubscribed) return;
        const items: SystemErrorLog[] = [];
        snapshot.forEach((docSnap) => {
          items.push({
            id: docSnap.id,
            ...(docSnap.data() as Omit<SystemErrorLog, 'id'>)
          });
        });
        setLogs(items);
        setLoading(false);
      },
      () => {
        // Fallback: load directly via server endpoint with admin privileges
        if (isSubscribed) {
          fetchServerLogs();
        }
      }
    );

    return () => {
      isSubscribed = false;
      unsubscribe();
    };
  }, []);

  // Update note input when selected log changes
  useEffect(() => {
    if (selectedLog) {
      setAdminNoteInput(selectedLog.adminNotes || '');
    }
  }, [selectedLog]);

  // Statistics calculation
  const stats = useMemo(() => {
    const total = logs.length;
    const now = Date.now();
    const oneDayAgo = now - 24 * 60 * 60 * 1000;

    const last24h = logs.filter(l => new Date(l.timestamp).getTime() >= oneDayAgo).length;
    const criticalCount = logs.filter(l => l.severity === 'critical').length;
    const newPendingCount = logs.filter(l => l.status === 'new').length;
    const resolvedCount = logs.filter(l => l.status === 'resolved').length;

    // Top failing page
    const pageCounts: Record<string, number> = {};
    logs.forEach(l => {
      const p = l.pathname || 'Bilinmiyor';
      pageCounts[p] = (pageCounts[p] || 0) + 1;
    });
    let topPage = '-';
    let maxPageCount = 0;
    Object.entries(pageCounts).forEach(([page, cnt]) => {
      if (cnt > maxPageCount) {
        maxPageCount = cnt;
        topPage = page;
      }
    });

    return {
      total,
      last24h,
      criticalCount,
      newPendingCount,
      resolvedCount,
      topPage: maxPageCount > 0 ? `${topPage} (${maxPageCount})` : 'Henüz Yok'
    };
  }, [logs]);

  // Filtered logs
  const filteredLogs = useMemo(() => {
    return logs.filter((log) => {
      // Search term
      if (searchTerm.trim()) {
        const queryLower = searchTerm.toLowerCase();
        const matchesMsg = log.errorMessage?.toLowerCase().includes(queryLower);
        const matchesCode = log.errorCode?.toLowerCase().includes(queryLower);
        const matchesPath = log.pathname?.toLowerCase().includes(queryLower);
        const matchesUser = log.userName?.toLowerCase().includes(queryLower) || log.userEmail?.toLowerCase().includes(queryLower);
        const matchesSource = log.source?.toLowerCase().includes(queryLower);
        if (!matchesMsg && !matchesCode && !matchesPath && !matchesUser && !matchesSource) {
          return false;
        }
      }

      // Severity filter
      if (severityFilter !== 'all' && log.severity !== severityFilter) {
        return false;
      }

      // Status filter
      if (statusFilter !== 'all' && log.status !== statusFilter) {
        return false;
      }

      // Role filter
      if (roleFilter !== 'all') {
        if (roleFilter === 'anonymous' && log.userId !== 'anonymous') return false;
        if (roleFilter !== 'anonymous' && log.userRole !== roleFilter) return false;
      }

      // Category filter
      if (categoryFilter !== 'all' && log.category !== categoryFilter) {
        return false;
      }

      // Date range filter
      if (dateRangeFilter !== 'all') {
        const logTime = new Date(log.timestamp).getTime();
        const now = Date.now();
        if (dateRangeFilter === 'today' && logTime < now - 24 * 60 * 60 * 1000) return false;
        if (dateRangeFilter === '3days' && logTime < now - 3 * 24 * 60 * 60 * 1000) return false;
        if (dateRangeFilter === '7days' && logTime < now - 7 * 24 * 60 * 60 * 1000) return false;
      }

      return true;
    });
  }, [logs, searchTerm, severityFilter, statusFilter, roleFilter, categoryFilter, dateRangeFilter]);

  // Copy helper
  const handleCopy = (text: string, code: string) => {
    navigator.clipboard.writeText(text);
    setCopiedCode(code);
    setTimeout(() => setCopiedCode(null), 2000);
  };

  // Change log status
  const handleStatusChange = async (logId: string, newStatus: ErrorStatus) => {
    try {
      const adminName = `${userData?.firstName || ''} ${userData?.lastName || ''}`.trim() || 'Yönetici';
      await systemLogger.updateErrorStatus(logId, newStatus, undefined, adminName);
      
      // update local selected if open
      if (selectedLog && selectedLog.id === logId) {
        setSelectedLog(prev => prev ? { ...prev, status: newStatus } : null);
      }

      setActionSuccessMsg(`Kayıt durumu "${getStatusLabel(newStatus)}" olarak güncellendi.`);
      setTimeout(() => setActionSuccessMsg(null), 3000);
    } catch (err: any) {
      alert('Durum güncellenirken hata oluştu: ' + err.message);
    }
  };

  // Save admin note
  const handleSaveAdminNote = async () => {
    if (!selectedLog?.id) return;
    try {
      const adminName = `${userData?.firstName || ''} ${userData?.lastName || ''}`.trim() || 'Yönetici';
      await systemLogger.updateErrorStatus(selectedLog.id, selectedLog.status, adminNoteInput, adminName);
      setSelectedLog(prev => prev ? { ...prev, adminNotes: adminNoteInput } : null);
      setActionSuccessMsg('Yönetici notu başarıyla kaydedildi.');
      setTimeout(() => setActionSuccessMsg(null), 3000);
    } catch (err: any) {
      alert('Not kaydedilirken hata oluştu: ' + err.message);
    }
  };

  // Delete single log
  const handleDeleteLog = async (logId: string) => {
    if (!window.confirm('Bu hata kaydını silmek istediğinize emin misiniz?')) return;
    try {
      await systemLogger.deleteLog(logId);
      if (selectedLog?.id === logId) {
        setSelectedLog(null);
      }
      setActionSuccessMsg('Hata kaydı başarıyla silindi.');
      setTimeout(() => setActionSuccessMsg(null), 3000);
    } catch (err: any) {
      alert('Hata kaydı silinirken sorun oluştu: ' + err.message);
    }
  };

  // Clean all resolved logs
  const handleCleanResolved = async () => {
    const resolvedLogs = logs.filter(l => l.status === 'resolved' && l.id);
    if (resolvedLogs.length === 0) {
      alert('Silinecek çözülmüş kayıt bulunamadı.');
      return;
    }

    if (!window.confirm(`${resolvedLogs.length} adet çözülmüş hata kaydı kalıcı olarak silinecek. Onaylıyor musunuz?`)) {
      return;
    }

    try {
      if (db) {
        try {
          const batch = writeBatch(db);
          resolvedLogs.forEach(l => {
            if (l.id) {
              batch.delete(doc(db, 'system_error_logs', l.id));
            }
          });
          await batch.commit();
          setActionSuccessMsg(`${resolvedLogs.length} adet çözülmüş kayıt temizlendi.`);
          setTimeout(() => setActionSuccessMsg(null), 3000);
          return;
        } catch {
          // fallback to server endpoint
        }
      }

      const res = await fetch('/api/admin/system-error-logs/delete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ deleteResolved: true })
      });
      const data = await res.json();
      if (data?.success) {
        setLogs(prev => prev.filter(l => l.status !== 'resolved'));
        setActionSuccessMsg(`${resolvedLogs.length} adet çözülmüş kayıt temizlendi.`);
        setTimeout(() => setActionSuccessMsg(null), 3000);
      } else {
        alert('Toplu silme sırasında hata: ' + (data?.error || 'Bilinmeyen hata'));
      }
    } catch (err: any) {
      alert('Toplu silme sırasında hata: ' + err.message);
    }
  };

  // Create test error log
  const handleCreateTestError = async () => {
    setIsTestCreating(true);
    try {
      const code = await systemLogger.logError({
        source: 'AdminDiagnosticsPanel',
        message: 'Yönetici teşhis test hatası: Sistemsel izleme ve altyapı doğrulama simülasyonu.',
        category: 'system',
        severity: 'warning',
        metadata: {
          simulatedBy: `${userData?.firstName || ''} ${userData?.lastName || ''}`.trim() || 'Admin',
          testPurpose: 'Altyapı çalışabilirlik ve gerçek zamanlı log doğrulaması'
        }
      });
      setActionSuccessMsg(`Test hata kaydı oluşturuldu: ${code}`);
      setTimeout(() => setActionSuccessMsg(null), 4000);
    } catch (err: any) {
      alert('Test kaydı oluşturulurken hata: ' + err.message);
    } finally {
      setIsTestCreating(false);
    }
  };

  // Export to JSON
  const handleExportJson = () => {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(filteredLogs, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute("href", dataStr);
    downloadAnchor.setAttribute("download", `hata_loglari_${new Date().toISOString().slice(0, 10)}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  // Format date helper
  const formatDate = (isoString?: string) => {
    if (!isoString) return 'Bilinmiyor';
    try {
      const date = new Date(isoString);
      return new Intl.DateTimeFormat('tr-TR', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit'
      }).format(date);
    } catch {
      return isoString;
    }
  };

  const getRelativeTime = (isoString?: string) => {
    if (!isoString) return '';
    try {
      const diffMs = Date.now() - new Date(isoString).getTime();
      const diffMins = Math.floor(diffMs / (1000 * 60));
      if (diffMins < 1) return 'Az önce';
      if (diffMins < 60) return `${diffMins} dk önce`;
      const diffHours = Math.floor(diffMins / 60);
      if (diffHours < 24) return `${diffHours} sa önce`;
      const diffDays = Math.floor(diffHours / 24);
      return `${diffDays} gün önce`;
    } catch {
      return '';
    }
  };

  const getSeverityBadge = (severity: ErrorSeverity) => {
    switch (severity) {
      case 'critical':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-rose-500/20 text-rose-300 border border-rose-500/40">
            <ShieldAlert className="w-3 h-3 text-rose-400" />
            Kritik
          </span>
        );
      case 'error':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-500/20 text-amber-300 border border-amber-500/30">
            <AlertTriangle className="w-3 h-3 text-amber-400" />
            Hata
          </span>
        );
      case 'warning':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-yellow-500/20 text-yellow-300 border border-yellow-500/30">
            <AlertCircle className="w-3 h-3 text-yellow-400" />
            Uyarı
          </span>
        );
      case 'info':
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-blue-500/20 text-blue-300 border border-blue-500/30">
            <Info className="w-3 h-3 text-blue-400" />
            Bilgi
          </span>
        );
    }
  };

  const getStatusBadge = (status: ErrorStatus) => {
    switch (status) {
      case 'new':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-semibold bg-rose-500/15 text-rose-400 border border-rose-500/30">
            <span className="w-1.5 h-1.5 rounded-full bg-rose-400 animate-pulse"></span>
            Yeni
          </span>
        );
      case 'investigating':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-semibold bg-amber-500/15 text-amber-300 border border-amber-500/30">
            <Clock className="w-3 h-3" />
            İnceleniyor
          </span>
        );
      case 'resolved':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-semibold bg-emerald-500/15 text-emerald-300 border border-emerald-500/30">
            <CheckCircle2 className="w-3 h-3 text-emerald-400" />
            Çözüldü
          </span>
        );
      case 'ignored':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-semibold bg-slate-500/20 text-slate-400 border border-slate-500/30">
            Yok Sayıldı
          </span>
        );
    }
  };

  const getStatusLabel = (s: ErrorStatus) => {
    switch (s) {
      case 'new': return 'Yeni';
      case 'investigating': return 'İnceleniyor';
      case 'resolved': return 'Çözüldü';
      case 'ignored': return 'Yok Sayıldı';
    }
  };

  const getRoleLabel = (role?: string) => {
    switch (role) {
      case 'student': return 'Öğrenci';
      case 'coach': return 'Koç';
      case 'parent': return 'Veli';
      case 'admin': return 'Yönetici';
      case 'guest': return 'Misafir';
      default: return role || 'Bilinmiyor';
    }
  };

  const getCategoryLabel = (category?: string) => {
    switch (category) {
      case 'ai': return 'Yapay Zeka';
      case 'network': return 'Ağ / API';
      case 'auth': return 'Giriş / Oturum';
      case 'ui': return 'Arayüz / Çökme';
      case 'payment': return 'Ödeme / Cüzdan';
      case 'database': return 'Veritabanı';
      case 'system': return 'Sistem';
      default: return 'Genel';
    }
  };

  return (
    <div className="min-h-screen bg-[#070b14] text-slate-100 p-4 md:p-8 font-sans">
      {/* Toast Notification */}
      <AnimatePresence>
        {actionSuccessMsg && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="fixed top-6 right-6 z-50 bg-emerald-500/20 border border-emerald-500/40 text-emerald-200 px-4 py-3 rounded-xl shadow-2xl backdrop-blur-md flex items-center gap-2 text-sm font-medium"
          >
            <CheckCheck className="w-4 h-4 text-emerald-400" />
            <span>{actionSuccessMsg}</span>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="max-w-7xl mx-auto space-y-6">
        {/* Top Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-white/5 pb-6">
          <div>
            <div className="flex items-center gap-2.5">
              <div className="p-2.5 bg-rose-500/10 border border-rose-500/20 rounded-xl text-rose-400 shadow-sm">
                <ShieldAlert className="w-6 h-6" />
              </div>
              <div>
                <h1 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2">
                  Sistem Hata & Teşhis Logları
                  <span className="text-xs px-2.5 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 font-mono font-normal">
                    Canlı Telemetri
                  </span>
                </h1>
                <p className="text-sm text-slate-400 mt-0.5">
                  Tüm kullanıcıların aldığı hataları tarih-saat, sayfa, kullanıcı ve teknik hata nedenleriyle izleyin.
                </p>
              </div>
            </div>
          </div>

          {/* Quick Action Buttons */}
          <div className="flex flex-wrap items-center gap-2.5">
            <button
              onClick={() => {
                setLoading(true);
                fetchServerLogs();
              }}
              disabled={loading}
              className="px-3.5 py-2 rounded-xl text-xs font-semibold bg-slate-800/80 hover:bg-slate-700/80 border border-white/10 text-slate-300 transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-50 shadow-sm"
              title="Kayıtları yeniden sorgula"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
              <span>Yenile</span>
            </button>

            <button
              onClick={handleCreateTestError}
              disabled={isTestCreating}
              className="px-3.5 py-2 rounded-xl text-xs font-semibold bg-slate-800/80 hover:bg-slate-700/80 border border-white/10 text-slate-300 transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-50 shadow-sm"
              title="Sistemin hata yakalama mekanizmasını test etmek için test kaydı üretir"
            >
              <Sparkles className="w-3.5 h-3.5 text-amber-400" />
              <span>Test Hatası Oluştur</span>
            </button>

            <button
              onClick={handleExportJson}
              className="px-3.5 py-2 rounded-xl text-xs font-semibold bg-slate-800/80 hover:bg-slate-700/80 border border-white/10 text-slate-300 transition-all flex items-center gap-1.5 cursor-pointer shadow-sm"
              title="Filtrelenmiş kayıtları JSON olarak indirir"
            >
              <Download className="w-3.5 h-3.5" />
              <span>JSON İndir</span>
            </button>

            <button
              onClick={handleCleanResolved}
              className="px-3.5 py-2 rounded-xl text-xs font-semibold bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/30 text-rose-300 transition-all flex items-center gap-1.5 cursor-pointer shadow-sm"
              title="Çözülmüş durumdaki tüm logları temizler"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Çözülenleri Temizle</span>
            </button>
          </div>
        </div>

        {/* 5 Key Metric Cards */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3.5">
          <div className="bg-slate-900/60 border border-white/5 rounded-2xl p-4 shadow-sm">
            <div className="text-xs font-medium text-slate-400">Toplam Hata Kaydı</div>
            <div className="text-2xl font-bold text-white mt-1.5">{stats.total}</div>
            <div className="text-[11px] text-slate-500 mt-1">Sistem geneli toplam</div>
          </div>

          <div className="bg-slate-900/60 border border-white/5 rounded-2xl p-4 shadow-sm">
            <div className="text-xs font-medium text-slate-400">Son 24 Saat</div>
            <div className="text-2xl font-bold text-indigo-400 mt-1.5">{stats.last24h}</div>
            <div className="text-[11px] text-slate-500 mt-1">Son gün aktiviteleri</div>
          </div>

          <div className="bg-slate-900/60 border border-rose-500/20 rounded-2xl p-4 shadow-sm">
            <div className="text-xs font-medium text-rose-300 flex items-center justify-between">
              <span>Kritik Hatalar</span>
              {stats.criticalCount > 0 && <span className="w-2 h-2 rounded-full bg-rose-400 animate-ping"></span>}
            </div>
            <div className="text-2xl font-bold text-rose-400 mt-1.5">{stats.criticalCount}</div>
            <div className="text-[11px] text-rose-300/60 mt-1">Acil müdahale gerektiren</div>
          </div>

          <div className="bg-slate-900/60 border border-amber-500/20 rounded-2xl p-4 shadow-sm">
            <div className="text-xs font-medium text-amber-300">İnceleme Bekleyen</div>
            <div className="text-2xl font-bold text-amber-400 mt-1.5">{stats.newPendingCount}</div>
            <div className="text-[11px] text-amber-300/60 mt-1">Yeni bildirimler</div>
          </div>

          <div className="col-span-2 md:col-span-1 bg-slate-900/60 border border-white/5 rounded-2xl p-4 shadow-sm">
            <div className="text-xs font-medium text-slate-400">En Çok Hata Veren Sayfa</div>
            <div className="text-sm font-semibold text-slate-200 mt-1.5 truncate" title={stats.topPage}>
              {stats.topPage}
            </div>
            <div className="text-[11px] text-slate-500 mt-1">Hata yoğunluğu yüksek</div>
          </div>
        </div>

        {/* Filter & Search Bar */}
        <div className="bg-slate-900/70 border border-white/10 rounded-2xl p-4 space-y-3.5 shadow-md">
          <div className="flex flex-col md:flex-row gap-3">
            {/* Search input */}
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="text"
                placeholder="Hata mesajı, kullanıcı adı, e-posta, sayfa URL veya kod ara..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 bg-slate-950/70 border border-white/10 rounded-xl text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:border-indigo-500/60 focus:ring-1 focus:ring-indigo-500/40 transition-all"
              />
              {searchTerm && (
                <button
                  onClick={() => setSearchTerm('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-200"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>

            {/* Severity Filter */}
            <select
              value={severityFilter}
              onChange={(e) => setSeverityFilter(e.target.value)}
              aria-label="Önem Derecesi Filtresi"
              className="px-3.5 py-2.5 bg-slate-950/70 border border-white/10 rounded-xl text-xs font-medium text-slate-300 focus:outline-none focus:border-indigo-500/60 cursor-pointer"
            >
              <option value="all">Önem: Tümü</option>
              <option value="critical">Kritik</option>
              <option value="error">Hata</option>
              <option value="warning">Uyarı</option>
              <option value="info">Bilgi</option>
            </select>

            {/* Status Filter */}
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              aria-label="Durum Filtresi"
              className="px-3.5 py-2.5 bg-slate-950/70 border border-white/10 rounded-xl text-xs font-medium text-slate-300 focus:outline-none focus:border-indigo-500/60 cursor-pointer"
            >
              <option value="all">Durum: Tümü</option>
              <option value="new">Yeni</option>
              <option value="investigating">İnceleniyor</option>
              <option value="resolved">Çözüldü</option>
              <option value="ignored">Yok Sayıldı</option>
            </select>

            {/* Role Filter */}
            <select
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value)}
              aria-label="Kullanıcı Rolü Filtresi"
              className="px-3.5 py-2.5 bg-slate-950/70 border border-white/10 rounded-xl text-xs font-medium text-slate-300 focus:outline-none focus:border-indigo-500/60 cursor-pointer"
            >
              <option value="all">Rol: Tümü</option>
              <option value="student">Öğrenci</option>
              <option value="coach">Koç</option>
              <option value="parent">Veli</option>
              <option value="admin">Yönetici</option>
              <option value="anonymous">Misafir / Anonim</option>
            </select>

            {/* Category Filter */}
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              aria-label="Kategori Filtresi"
              className="px-3.5 py-2.5 bg-slate-950/70 border border-white/10 rounded-xl text-xs font-medium text-slate-300 focus:outline-none focus:border-indigo-500/60 cursor-pointer"
            >
              <option value="all">Kategori: Tümü</option>
              <option value="ai">Yapay Zeka</option>
              <option value="network">Ağ / API</option>
              <option value="auth">Giriş / Oturum</option>
              <option value="ui">Arayüz / Çökme</option>
              <option value="payment">Ödeme / Cüzdan</option>
              <option value="system">Sistem</option>
            </select>

            {/* Date Range Filter */}
            <select
              value={dateRangeFilter}
              onChange={(e) => setDateRangeFilter(e.target.value as any)}
              aria-label="Tarih Aralığı Filtresi"
              className="px-3.5 py-2.5 bg-slate-950/70 border border-white/10 rounded-xl text-xs font-medium text-slate-300 focus:outline-none focus:border-indigo-500/60 cursor-pointer"
            >
              <option value="all">Tarih: Tümü</option>
              <option value="today">Bugün</option>
              <option value="3days">Son 3 Gün</option>
              <option value="7days">Son 7 Gün</option>
            </select>
          </div>

          {/* Filter summary tags */}
          <div className="flex items-center justify-between text-xs text-slate-400 pt-1">
            <span>
              Listelenen: <strong className="text-white font-semibold">{filteredLogs.length}</strong> / {logs.length} kayıt
            </span>
            {(searchTerm || severityFilter !== 'all' || statusFilter !== 'all' || roleFilter !== 'all' || categoryFilter !== 'all' || dateRangeFilter !== 'all') && (
              <button
                onClick={() => {
                  setSearchTerm('');
                  setSeverityFilter('all');
                  setStatusFilter('all');
                  setRoleFilter('all');
                  setCategoryFilter('all');
                  setDateRangeFilter('all');
                }}
                className="text-indigo-400 hover:text-indigo-300 underline cursor-pointer"
              >
                Filtreleri Temizle
              </button>
            )}
          </div>
        </div>

        {/* Logs Table / Card List */}
        <div className="bg-slate-900/60 border border-white/10 rounded-2xl overflow-hidden shadow-xl">
          {loading ? (
            <div className="p-16 flex flex-col items-center justify-center gap-3 text-slate-400">
              <RefreshCw className="w-8 h-8 animate-spin text-indigo-500" />
              <p className="text-sm">Hata logları yükleniyor...</p>
            </div>
          ) : filteredLogs.length === 0 ? (
            <div className="p-16 flex flex-col items-center justify-center gap-3 text-center">
              <div className="w-12 h-12 rounded-full bg-slate-800/80 border border-white/10 flex items-center justify-center text-slate-400">
                <CheckCircle2 className="w-6 h-6 text-emerald-400" />
              </div>
              <h3 className="text-base font-semibold text-slate-200">Kayıt Bulunamadı</h3>
              <p className="text-xs text-slate-400 max-w-sm">
                Seçilen kriterlere uygun hata kaydı bulunmuyor veya sistem şu an kusursuz çalışıyor.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-950/80 border-b border-white/10 text-slate-400 font-medium tracking-wide">
                    <th className="py-3.5 px-4">Tarih & Saat</th>
                    <th className="py-3.5 px-4">Önem & Durum</th>
                    <th className="py-3.5 px-4">Kullanıcı</th>
                    <th className="py-3.5 px-4">Bulunduğu Sayfa</th>
                    <th className="py-3.5 px-4">Hata ve Sebebi</th>
                    <th className="py-3.5 px-4 text-right">İşlemler</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {filteredLogs.map((log) => {
                    const isSelected = selectedLog?.id === log.id;
                    return (
                      <tr
                        key={log.id || log.errorCode}
                        className={`hover:bg-slate-800/50 transition-colors group cursor-pointer ${
                          isSelected ? 'bg-indigo-950/30' : ''
                        }`}
                        onClick={() => setSelectedLog(log)}
                      >
                        {/* Tarih & Saat */}
                        <td className="py-4 px-4 whitespace-nowrap">
                          <div className="font-medium text-slate-200">{formatDate(log.timestamp)}</div>
                          <div className="text-[11px] text-slate-400 flex items-center gap-1 mt-0.5">
                            <Clock className="w-3 h-3 text-slate-500" />
                            <span>{getRelativeTime(log.timestamp)}</span>
                          </div>
                        </td>

                        {/* Önem & Durum */}
                        <td className="py-4 px-4 whitespace-nowrap">
                          <div className="flex flex-col gap-1.5 items-start">
                            {getSeverityBadge(log.severity)}
                            {getStatusBadge(log.status)}
                          </div>
                        </td>

                        {/* Kullanıcı */}
                        <td className="py-4 px-4">
                          <div className="flex items-center gap-2 max-w-[200px]">
                            <div className="w-7 h-7 rounded-full bg-slate-800 border border-white/10 flex items-center justify-center text-slate-300 shrink-0">
                              <User className="w-3.5 h-3.5" />
                            </div>
                            <div className="truncate">
                              <div className="font-medium text-slate-200 truncate">{log.userName || 'Bilinmiyor'}</div>
                              <div className="text-[11px] text-slate-400 flex items-center gap-1">
                                <span className="px-1.5 py-0.2 rounded bg-slate-800 text-[10px] text-slate-300">
                                  {getRoleLabel(log.userRole)}
                                </span>
                              </div>
                            </div>
                          </div>
                        </td>

                        {/* Sayfa */}
                        <td className="py-4 px-4 max-w-[180px]">
                          <div className="font-mono text-[11px] text-indigo-300 truncate bg-slate-950/60 px-2 py-1 rounded border border-white/5" title={log.pageUrl || log.pathname}>
                            {log.pathname || '/'}
                          </div>
                          <div className="text-[10px] text-slate-500 mt-1 flex items-center gap-1">
                            <Laptop className="w-2.5 h-2.5" />
                            <span>{log.browser || 'Tarayıcı'} • {log.os || 'OS'}</span>
                          </div>
                        </td>

                        {/* Hata & Sebebi */}
                        <td className="py-4 px-4 max-w-[320px]">
                          <div className="flex items-center gap-1.5 mb-1">
                            <span className="font-mono text-[10px] px-1.5 py-0.5 rounded bg-slate-800 text-slate-300 border border-white/5">
                              {log.errorCode}
                            </span>
                            <span className="text-[10px] text-slate-400">
                              [{getCategoryLabel(log.category)}] {log.source}
                            </span>
                          </div>
                          <div className="text-xs font-semibold text-slate-200 line-clamp-2" title={log.errorMessage}>
                            {log.errorMessage}
                          </div>
                        </td>

                        {/* İşlemler */}
                        <td className="py-4 px-4 text-right whitespace-nowrap" onClick={(e) => e.stopPropagation()}>
                          <div className="flex items-center justify-end gap-1.5">
                            {/* Quick status dropdown */}
                            <select
                              value={log.status}
                              onChange={(e) => handleStatusChange(log.id!, e.target.value as ErrorStatus)}
                              aria-label={`Durum Değiştir (${log.errorCode})`}
                              className="px-2 py-1 bg-slate-950 border border-white/10 rounded-lg text-[11px] text-slate-300 focus:outline-none cursor-pointer"
                            >
                              <option value="new">Yeni</option>
                              <option value="investigating">İnceleniyor</option>
                              <option value="resolved">Çözüldü</option>
                              <option value="ignored">Yok Say</option>
                            </select>

                            <button
                              onClick={() => setSelectedLog(log)}
                              className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 border border-white/10 cursor-pointer"
                              title="Detaylı Teşhis Penceresini Aç"
                            >
                              <Eye className="w-3.5 h-3.5" />
                            </button>

                            <button
                              onClick={() => handleDeleteLog(log.id!)}
                              className="p-1.5 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-rose-300 border border-rose-500/20 cursor-pointer"
                              title="Kaydı Kalıcı Olarak Sil"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Deep Diagnostic Detail Modal / Drawer */}
      <AnimatePresence>
        {selectedLog && (
          <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex justify-end">
            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="w-full max-w-2xl bg-[#090e1a] border-l border-white/10 h-full overflow-y-auto p-6 flex flex-col justify-between shadow-2xl"
            >
              {/* Drawer Header */}
              <div>
                <div className="flex items-center justify-between border-b border-white/10 pb-4">
                  <div className="flex items-center gap-2.5">
                    <div className="p-2 rounded-xl bg-rose-500/20 border border-rose-500/40 text-rose-300">
                      <ShieldAlert className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-xs text-indigo-400 font-bold tracking-wider">
                          {selectedLog.errorCode}
                        </span>
                        {getSeverityBadge(selectedLog.severity)}
                      </div>
                      <h2 className="text-base font-bold text-white mt-0.5">
                        Hata Teşhis & İnceleme Dosyası
                      </h2>
                    </div>
                  </div>

                  <button
                    onClick={() => setSelectedLog(null)}
                    className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition-colors cursor-pointer"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                {/* Status Bar */}
                <div className="mt-4 p-3.5 bg-slate-900/90 border border-white/10 rounded-xl flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-slate-400">Durum:</span>
                    {getStatusBadge(selectedLog.status)}
                  </div>

                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => handleStatusChange(selectedLog.id!, 'investigating')}
                      className="px-2.5 py-1 rounded-lg text-xs bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 border border-amber-500/30 font-medium cursor-pointer"
                    >
                      İncelemeye Al
                    </button>
                    <button
                      onClick={() => handleStatusChange(selectedLog.id!, 'resolved')}
                      className="px-2.5 py-1 rounded-lg text-xs bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 font-medium cursor-pointer"
                    >
                      Çözüldü Olarak İşaretle
                    </button>
                  </div>
                </div>

                {/* Diagnostic Details Grid */}
                <div className="mt-6 space-y-5">
                  {/* Error Message & Cause */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                      Neyden Dolayı Hata Aldı? (Hata Mesajı)
                    </label>
                    <div className="p-3.5 bg-rose-950/30 border border-rose-500/30 rounded-xl text-slate-100 font-medium text-sm leading-relaxed">
                      {selectedLog.errorMessage}
                    </div>
                  </div>

                  {/* Occurrence Time & Location */}
                  <div className="grid grid-cols-2 gap-3">
                    <div className="p-3 bg-slate-900/60 border border-white/5 rounded-xl">
                      <div className="text-[11px] text-slate-400">Oluşma Tarih & Saati</div>
                      <div className="text-xs font-semibold text-slate-200 mt-1">
                        {formatDate(selectedLog.timestamp)}
                      </div>
                      <div className="text-[10px] text-slate-500 mt-0.5">
                        {getRelativeTime(selectedLog.timestamp)}
                      </div>
                    </div>

                    <div className="p-3 bg-slate-900/60 border border-white/5 rounded-xl">
                      <div className="text-[11px] text-slate-400">Hata Kaynağı & Modülü</div>
                      <div className="text-xs font-semibold text-slate-200 mt-1">
                        {selectedLog.source}
                      </div>
                      <div className="text-[10px] text-slate-500 mt-0.5">
                        Kategori: {getCategoryLabel(selectedLog.category)}
                      </div>
                    </div>
                  </div>

                  {/* Page & URL */}
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between">
                      <label className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                        Hangi Sayfada Karşılaştı?
                      </label>
                      <button
                        onClick={() => handleCopy(selectedLog.pageUrl || selectedLog.pathname, 'url')}
                        className="text-[11px] text-indigo-400 hover:text-indigo-300 flex items-center gap-1"
                      >
                        {copiedCode === 'url' ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                        <span>Kopyala</span>
                      </button>
                    </div>
                    <div className="p-3 bg-slate-950 border border-white/10 rounded-xl font-mono text-xs text-indigo-300 break-all flex items-center justify-between">
                      <span>{selectedLog.pageUrl || selectedLog.pathname || 'Bilinmiyor'}</span>
                    </div>
                  </div>

                  {/* User Profile */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                      Kullanıcı Bilgileri
                    </label>
                    <div className="p-3.5 bg-slate-900/70 border border-white/10 rounded-xl space-y-2">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 rounded-full bg-slate-800 border border-white/10 flex items-center justify-center text-slate-300">
                            <User className="w-4 h-4" />
                          </div>
                          <div>
                            <div className="text-xs font-semibold text-white">
                              {selectedLog.userName || 'Bilinmiyor'}
                            </div>
                            <div className="text-[11px] text-slate-400">
                              {selectedLog.userEmail || 'E-posta kaydı yok'}
                            </div>
                          </div>
                        </div>
                        <span className="px-2.5 py-1 rounded-md bg-indigo-500/20 text-indigo-300 text-xs font-medium border border-indigo-500/30">
                          {getRoleLabel(selectedLog.userRole)}
                        </span>
                      </div>

                      <div className="pt-2 border-t border-white/5 flex items-center justify-between text-[11px] text-slate-400 font-mono">
                        <span>User UID:</span>
                        <span className="text-slate-300 truncate max-w-[280px]" title={selectedLog.userId}>
                          {selectedLog.userId || 'anonymous'}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Device & Client Environment */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                      Cihaz ve Tarayıcı Ortamı
                    </label>
                    <div className="grid grid-cols-3 gap-2.5">
                      <div className="p-2.5 bg-slate-950 border border-white/5 rounded-lg text-center">
                        <div className="text-[10px] text-slate-500">Tarayıcı</div>
                        <div className="text-xs font-semibold text-slate-200 mt-0.5">{selectedLog.browser || '-'}</div>
                      </div>
                      <div className="p-2.5 bg-slate-950 border border-white/5 rounded-lg text-center">
                        <div className="text-[10px] text-slate-500">İşletim Sistemi</div>
                        <div className="text-xs font-semibold text-slate-200 mt-0.5">{selectedLog.os || '-'}</div>
                      </div>
                      <div className="p-2.5 bg-slate-950 border border-white/5 rounded-lg text-center">
                        <div className="text-[10px] text-slate-500">Çözünürlük</div>
                        <div className="text-xs font-semibold text-slate-200 mt-0.5">{selectedLog.screenSize || '-'}</div>
                      </div>
                    </div>
                  </div>

                  {/* Stack Trace / Technical Error Body */}
                  {selectedLog.errorStack && (
                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between">
                        <label className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                          Teknik Stack Trace
                        </label>
                        <button
                          onClick={() => handleCopy(selectedLog.errorStack!, 'stack')}
                          className="text-[11px] text-indigo-400 hover:text-indigo-300 flex items-center gap-1"
                        >
                          {copiedCode === 'stack' ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                          <span>Kopyala</span>
                        </button>
                      </div>
                      <pre className="p-3 bg-slate-950 border border-white/10 rounded-xl font-mono text-[11px] text-rose-300/90 overflow-x-auto max-h-44 scrollbar-thin">
                        {selectedLog.errorStack}
                      </pre>
                    </div>
                  )}

                  {/* Metadata / Additional Details */}
                  {selectedLog.metadata && Object.keys(selectedLog.metadata).length > 0 && (
                    <div className="space-y-1.5">
                      <label className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                        Ek Bağlam & Parametreler (Metadata)
                      </label>
                      <pre className="p-3 bg-slate-950 border border-white/10 rounded-xl font-mono text-[11px] text-amber-300/90 overflow-x-auto max-h-40">
                        {JSON.stringify(selectedLog.metadata, null, 2)}
                      </pre>
                    </div>
                  )}

                  {/* Admin Notes */}
                  <div className="space-y-1.5 pt-2">
                    <label className="text-xs font-semibold uppercase tracking-wider text-slate-400 flex items-center justify-between">
                      <span>Yönetici Teşhis & Çözüm Notu</span>
                      {selectedLog.resolvedBy && (
                        <span className="text-[10px] text-emerald-400 font-normal">
                          Çözen: {selectedLog.resolvedBy}
                        </span>
                      )}
                    </label>
                    <textarea
                      rows={3}
                      placeholder="Bu hata hakkında alınan aksiyonları, uygulanan düzeltmeleri veya teknik notu yazın..."
                      value={adminNoteInput}
                      onChange={(e) => setAdminNoteInput(e.target.value)}
                      className="w-full p-3 bg-slate-950 border border-white/10 rounded-xl text-xs text-slate-200 placeholder-slate-600 focus:outline-none focus:border-indigo-500/60 focus:ring-1 focus:ring-indigo-500/40 transition-all"
                    />
                    <div className="flex justify-end">
                      <button
                        onClick={handleSaveAdminNote}
                        className="px-3.5 py-1.5 rounded-lg text-xs font-semibold bg-indigo-600 hover:bg-indigo-500 text-white transition-all cursor-pointer shadow-md shadow-indigo-600/20"
                      >
                        Notu Kaydet
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              {/* Drawer Footer Actions */}
              <div className="pt-6 mt-6 border-t border-white/10 flex items-center justify-between">
                <button
                  onClick={() => handleDeleteLog(selectedLog.id!)}
                  className="px-3 py-2 rounded-xl text-xs font-semibold bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/30 text-rose-300 transition-all flex items-center gap-1.5 cursor-pointer"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Bu Kaydı Sil</span>
                </button>

                <button
                  onClick={() => setSelectedLog(null)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-300 border border-white/10 cursor-pointer"
                >
                  Kapat
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
