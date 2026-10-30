import React, { useState, useEffect, useMemo } from 'react';
import { 
  BookOpen, 
  Plus, 
  Search, 
  Edit2, 
  Trash2, 
  Filter, 
  Youtube, 
  Clock, 
  Loader2, 
  Play, 
  ExternalLink, 
  Video, 
  CheckCircle2, 
  AlertCircle,
  AlertTriangle,
  Eye,
  Key,
  Layers,
  FileText,
  Camera,
  BookmarkCheck,
  Check,
  Target,
  Book,
  RefreshCw,
  Sparkles
} from 'lucide-react';
import { studentDataService } from '../../services/studentDataService';
import { BRANCH_CONFIG } from '../../constants/branchConfig';
import { CURRICULUM } from '../../constants/curriculum';
import { getCurriculumTopicsForBook } from '../../utils/bookProgress';
import { getYoutubeChannelsForSubject } from '../../constants/youtubeChannels';
import { BarcodeScannerModal } from '../../components/BarcodeScannerModal';

const cleanIsbn = (s: string) => (s || '').replace(/[^a-zA-Z0-9]/g, '').toLowerCase();

export default function AdminResources() {
  const [books, setBooks] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [resourceTypeFilter, setResourceTypeFilter] = useState('Hepsi');
  const [examTypeFilter, setExamTypeFilter] = useState('Hepsi');
  const [subjectFilter, setSubjectFilter] = useState('Hepsi');

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isScannerOpen, setIsScannerOpen] = useState(false);
  const [editingBook, setEditingBook] = useState<any>(null);

  // Video viewer modal state
  const [viewingVideoBook, setViewingVideoBook] = useState<any>(null);

  // Custom topic input for fasikül
  const [customFasikulTopic, setCustomFasikulTopic] = useState('');

  // Form State
  const [formData, setFormData] = useState({
    name: '',
    type: 'TYT',
    subject: 'Türkçe',
    resourceType: 'soru',
    coveredTopics: [] as string[],
    isbn: '',
    order: '',
    playlistUrl: '',
    playlistId: '',
    channelTitle: '',
    totalVideos: 0,
    totalDurationFormatted: '',
    totalDurationMinutes: 0,
    videos: [] as any[],
    totalExamCount: 10,
    denemeCategory: 'branch'
  });

  // YouTube Fetch State
  const [fetchingYoutube, setFetchingYoutube] = useState(false);
  const [youtubeError, setYoutubeError] = useState<string | null>(null);
  const [customApiKey, setCustomApiKey] = useState('');
  const [showApiKeyInput, setShowApiKeyInput] = useState(false);
  const [newVideoTitle, setNewVideoTitle] = useState('');
  const [newVideoDuration, setNewVideoDuration] = useState('');
  const [newVideoUrl, setNewVideoUrl] = useState('');

  // Bulk YouTube Sync State
  const [isSyncingYouTube, setIsSyncingYouTube] = useState(false);
  const [syncFeedback, setSyncFeedback] = useState<{ type: 'success' | 'error' | 'info'; message: string } | null>(null);

  useEffect(() => {
    loadBooks();
  }, []);

  const loadBooks = async () => {
    setLoading(true);
    const data = await studentDataService.getGlobalBooks();
    setBooks(data);
    setLoading(false);
  };

  const handleSyncAllYouTube = async () => {
    if (isSyncingYouTube) return;
    setIsSyncingYouTube(true);
    setSyncFeedback({
      type: 'info',
      message: 'Tüm YouTube oynatma listeleri taranıyor ve yeni videolar çekiliyor...'
    });

    try {
      const res = await fetch('/api/youtube/sync-all', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      });
      const data = await res.json();

      if (data.success) {
        setSyncFeedback({
          type: 'success',
          message: data.message || `Senkronizasyon tamamlandı: ${data.totalChecked} liste tarandı, ${data.updatedCount} liste güncellendi (+${data.newVideosTotal} yeni video).`
        });
        await loadBooks();
      } else {
        setSyncFeedback({
          type: 'error',
          message: data.error || data.message || 'Senkronizasyon işlemi gerçekleştirilemedi.'
        });
      }
    } catch (err: any) {
      setSyncFeedback({
        type: 'error',
        message: 'Senkronizasyon sırasında bağlantı hatası oluştu: ' + (err.message || 'Bilinmeyen hata')
      });
    } finally {
      setIsSyncingYouTube(false);
      setTimeout(() => {
        setSyncFeedback(null);
      }, 7000);
    }
  };

  // Find duplicate ISBNs across all books (excluding YouTube)
  const duplicateIsbnGroups = useMemo(() => {
    const isbnMap = new Map<string, any[]>();
    books.forEach(book => {
      if (book.resourceType !== 'youtube' && book.isbn && book.isbn.trim()) {
        const norm = cleanIsbn(book.isbn);
        if (norm) {
          if (!isbnMap.has(norm)) {
            isbnMap.set(norm, []);
          }
          isbnMap.get(norm)!.push(book);
        }
      }
    });

    const duplicates: { normIsbn: string; displayIsbn: string; books: any[] }[] = [];
    isbnMap.forEach((matchedBooks, norm) => {
      if (matchedBooks.length > 1) {
        duplicates.push({
          normIsbn: norm,
          displayIsbn: matchedBooks[0].isbn,
          books: matchedBooks
        });
      }
    });

    return duplicates;
  }, [books]);

  const duplicateIsbnSet = useMemo(() => {
    return new Set(duplicateIsbnGroups.map(d => d.normIsbn));
  }, [duplicateIsbnGroups]);

  const handleOpenModal = (book: any = null) => {
    setYoutubeError(null);
    if (book) {
      setEditingBook(book);
      setFormData({
        name: book.name || '',
        type: book.type || 'TYT',
        subject: book.subject || 'Türkçe',
        resourceType: book.resourceType || 'soru',
        coveredTopics: Array.isArray(book.coveredTopics) ? [...book.coveredTopics] : [],
        isbn: book.resourceType === 'youtube' ? '' : (book.isbn || ''),
        order: book.order || '',
        playlistUrl: book.playlistUrl || (book.playlistId ? `https://www.youtube.com/playlist?list=${book.playlistId}` : ''),
        playlistId: book.playlistId || '',
        channelTitle: book.channelTitle || '',
        totalVideos: book.totalVideos || (book.videos?.length || 0),
        totalDurationFormatted: book.totalDurationFormatted || '',
        totalDurationMinutes: book.totalDurationMinutes || 0,
        videos: Array.isArray(book.videos) ? [...book.videos] : [],
        totalExamCount: book.totalExamCount || 10,
        denemeCategory: book.denemeCategory || 'branch'
      });
    } else {
      setEditingBook(null);
      setFormData({
        name: '',
        type: 'TYT',
        subject: 'Türkçe',
        resourceType: 'soru',
        coveredTopics: [],
        isbn: '',
        order: '',
        playlistUrl: '',
        playlistId: '',
        channelTitle: '',
        totalVideos: 0,
        totalDurationFormatted: '',
        totalDurationMinutes: 0,
        videos: [],
        totalExamCount: 10,
        denemeCategory: 'branch'
      });
    }
    setCustomFasikulTopic('');
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingBook(null);
    setYoutubeError(null);
  };

  const handleFetchYoutubePlaylist = async () => {
    if (!formData.playlistUrl) {
      setYoutubeError('Lütfen bir YouTube oynatma listesi (playlist) linki veya ID girin.');
      return;
    }

    setFetchingYoutube(true);
    setYoutubeError(null);

    try {
      const res = await fetch('/api/youtube/fetch-playlist', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          playlistUrl: formData.playlistUrl,
          apiKey: customApiKey || undefined
        })
      });

      let data: any = {};
      const contentType = res.headers.get('content-type') || '';
      if (contentType.includes('application/json')) {
        data = await res.json();
      } else {
        const text = await res.text();
        throw new Error(text || 'Sunucudan beklenmeyen bir yanıt alındı.');
      }

      if (!res.ok || !data.success) {
        throw new Error(data.error || 'YouTube oynatma listesi çekilemedi.');
      }

      // Populate form data
      setFormData(prev => ({
        ...prev,
        name: prev.name ? prev.name : (data.channelTitle ? `${data.channelTitle} - ${data.title}` : data.title),
        playlistId: data.playlistId,
        channelTitle: data.channelTitle,
        totalVideos: data.totalVideos,
        totalDurationFormatted: data.totalDurationFormatted,
        totalDurationMinutes: data.totalDurationMinutes,
        videos: data.videos || []
      }));
    } catch (err: any) {
      console.error('YouTube Fetch Error:', err);
      setYoutubeError(err.message || 'Oynatma listesi yüklenirken bir hata oluştu. Linki kontrol edin.');
    } finally {
      setFetchingYoutube(false);
    }
  };

  const handleDeleteVideoFromList = (index: number) => {
    const updated = formData.videos.filter((_, idx) => idx !== index).map((v, idx) => ({
      ...v,
      order: idx + 1
    }));
    
    // Recalculate total duration
    let totalSecs = 0;
    updated.forEach(v => {
      totalSecs += (v.durationSeconds || (v.durationMinutes * 60) || 0);
    });
    const hours = Math.floor(totalSecs / 3600);
    const mins = Math.floor((totalSecs % 3600) / 60);
    const formatted = `${hours > 0 ? `${hours} sa ` : ''}${mins} dk`.trim();

    setFormData(prev => ({
      ...prev,
      videos: updated,
      totalVideos: updated.length,
      totalDurationMinutes: Math.ceil(totalSecs / 60),
      totalDurationFormatted: formatted
    }));
  };

  const handleAddManualVideo = () => {
    if (!newVideoTitle.trim()) {
      alert('Lütfen video başlığı girin.');
      return;
    }
    const mins = parseInt(newVideoDuration) || 30;
    const currentVideos = Array.isArray(formData.videos) ? formData.videos : [];
    const newVid = {
      order: currentVideos.length + 1,
      videoId: '',
      title: newVideoTitle.trim(),
      durationFormatted: `${mins} dk`,
      durationMinutes: mins,
      durationSeconds: mins * 60,
      url: newVideoUrl.trim() || ''
    };

    const updated = [...currentVideos, newVid];
    setFormData(prev => ({
      ...prev,
      videos: updated,
      totalVideos: updated.length
    }));
    setNewVideoTitle('');
    setNewVideoDuration('');
    setNewVideoUrl('');
  };

  const handleSaveBook = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      alert('Lütfen kaynak adını girin.');
      return;
    }

    // For YouTube resources, always clear ISBN
    const finalIsbn = formData.resourceType === 'youtube' ? '' : formData.isbn.trim();

    // Check unique ISBN constraint for non-youtube resources
    if (formData.resourceType !== 'youtube' && finalIsbn) {
      const normIsbn = cleanIsbn(finalIsbn);
      const duplicateBook = books.find(b => {
        if (b.resourceType === 'youtube') return false;
        if (editingBook && b.id === editingBook.id) return false;
        return b.isbn && cleanIsbn(b.isbn) === normIsbn;
      });

      if (duplicateBook) {
        alert(`UYARI: Bu ISBN numarası (${finalIsbn}) zaten "${duplicateBook.name}" (${duplicateBook.subject} - ${duplicateBook.type}) kaynağında kayıtlı!\n\nHer ISBN numarası sistemde eşsiz olmalıdır. Lütfen farklı bir ISBN giriniz veya mevcut kaynağı düzenleyiniz.`);
        return;
      }
    }

    const bookToSave: any = {
      ...(editingBook || {}),
      ...formData,
      coveredTopics: formData.resourceType === 'fasikul' ? (formData.coveredTopics || []) : [],
      isbn: finalIsbn,
      order: formData.order ? parseInt(formData.order.toString()) : null
    };

    if (formData.resourceType === 'deneme') {
      bookToSave.totalExamCount = Number(formData.totalExamCount) || 10;
      bookToSave.denemeCategory = formData.denemeCategory || 'branch';
    }

    try {
      await studentDataService.saveGlobalBook(bookToSave);
      await loadBooks();
      handleCloseModal();
    } catch (error) {
      console.error(error);
      alert('Kaynak kaydedilirken bir hata oluştu');
    }
  };

  const handleDeleteBook = async (id: string) => {
    if (window.confirm('Bu kaynağı silmek istediğinize emin misiniz?')) {
      try {
        await studentDataService.deleteGlobalBook(id);
        await loadBooks();
      } catch (error) {
        alert('Kaynak silinirken bir hata oluştu');
      }
    }
  };

  const filteredBooks = books.filter(book => {
    const query = searchTerm.toLowerCase().trim();
    const matchesSearch = 
      !query ||
      book.name?.toLowerCase().includes(query) || 
      book.isbn?.toLowerCase().includes(query) ||
      book.channelTitle?.toLowerCase().includes(query) ||
      book.subject?.toLowerCase().includes(query);
      
    const bookResType = book.resourceType || 'soru';
    const matchesResourceType = 
      resourceTypeFilter === 'Hepsi' || 
      bookResType === resourceTypeFilter ||
      (resourceTypeFilter === 'soru' && (book.resourceType === 'soru' || !book.resourceType));
      
    const matchesExamType = examTypeFilter === 'Hepsi' || book.type === examTypeFilter;
    const matchesSubject = subjectFilter === 'Hepsi' || book.subject === subjectFilter;
    
    return matchesSearch && matchesResourceType && matchesExamType && matchesSubject;
  });

  const allSubjects = Array.from(new Set(Object.values(BRANCH_CONFIG).flatMap((b: any) => [...b.subjects, ...b.aytSubjects])));

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-white tracking-tight uppercase">Sistem Kaynakları</h1>
          <p className="text-slate-400 text-sm">Global kaynakları (Soru bankası, konu anlatımı ve YouTube video kampları) yönetin.</p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={handleSyncAllYouTube}
            disabled={isSyncingYouTube}
            className="flex items-center gap-2 bg-red-600/90 hover:bg-red-600 disabled:opacity-50 text-white px-4 py-2.5 rounded-xl font-bold transition-all shadow-lg shadow-red-600/20 text-sm cursor-pointer"
            title="Sistemdeki tüm YouTube oynatma listelerini şimdi tara ve yeni videoları çek"
          >
            {isSyncingYouTube ? (
              <Loader2 size={18} className="animate-spin text-white" />
            ) : (
              <RefreshCw size={18} />
            )}
            <span>{isSyncingYouTube ? 'Senkronize Ediliyor...' : 'YouTube Videolarını Çek'}</span>
          </button>

          <button
            onClick={() => handleOpenModal()}
            className="flex items-center gap-2 bg-emerald-500 hover:bg-emerald-600 text-white px-4 py-2.5 rounded-xl font-bold transition-all shadow-lg shadow-emerald-500/20 text-sm cursor-pointer"
          >
            <Plus size={20} />
            Yeni Kaynak Ekle
          </button>
        </div>
      </div>

      {/* Sync Feedback Toast Banner */}
      {syncFeedback && (
        <div className={`p-4 rounded-2xl border transition-all flex items-center justify-between gap-3 shadow-xl ${
          syncFeedback.type === 'success' 
            ? 'bg-emerald-950/80 border-emerald-500/40 text-emerald-200'
            : syncFeedback.type === 'error'
            ? 'bg-red-950/80 border-red-500/40 text-red-200'
            : 'bg-blue-950/80 border-blue-500/40 text-blue-200'
        }`}>
          <div className="flex items-center gap-3">
            {syncFeedback.type === 'success' ? (
              <CheckCircle2 size={22} className="text-emerald-400 shrink-0" />
            ) : syncFeedback.type === 'error' ? (
              <AlertCircle size={22} className="text-red-400 shrink-0" />
            ) : (
              <Loader2 size={22} className="animate-spin text-blue-400 shrink-0" />
            )}
            <div className="text-sm font-semibold">{syncFeedback.message}</div>
          </div>
          <button
            onClick={() => setSyncFeedback(null)}
            className="text-xs px-2.5 py-1 rounded-lg bg-white/10 hover:bg-white/20 transition-colors"
          >
            Kapat
          </button>
        </div>
      )}

      {/* Automated YouTube Sync Information Card */}
      <div className="p-4 rounded-2xl bg-gradient-to-r from-slate-900 via-red-950/30 to-slate-900 border border-red-500/20 shadow-lg flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-red-500/10 text-red-400 shrink-0 border border-red-500/20">
            <Clock size={20} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-black text-red-400 uppercase tracking-wide">Otomatik Günlük Senkronizasyon</span>
              <span className="px-2 py-0.5 rounded-full bg-red-500/20 text-red-300 text-[10px] font-bold">Her gün 23:00'te Aktif</span>
            </div>
            <p className="text-xs text-slate-300 mt-0.5">
              Tüm YouTube ders kampları her gece saat <strong>23:00</strong>'te sunucu tarafından taranır; kanallara yüklenen yeni videolar sisteme otomatik olarak eklenir.
            </p>
          </div>
        </div>
        <button
          onClick={handleSyncAllYouTube}
          disabled={isSyncingYouTube}
          className="shrink-0 text-xs px-3 py-1.5 rounded-lg bg-red-500/10 hover:bg-red-500/20 text-red-300 border border-red-500/30 font-bold transition-colors flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
        >
          <RefreshCw size={12} className={isSyncingYouTube ? "animate-spin" : ""} />
          <span>Şimdi Tara</span>
        </button>
      </div>

      {/* Duplicate ISBN Warning Banner */}
      {duplicateIsbnGroups.length > 0 && (
        <div className="p-4 rounded-2xl bg-gradient-to-r from-red-950/80 via-red-900/40 to-slate-900 border-2 border-red-500/40 shadow-xl space-y-3">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-red-500/20 text-red-400">
              <AlertTriangle size={24} />
            </div>
            <div>
              <h3 className="text-sm font-black text-red-300 uppercase tracking-wide">
                Mükerrer (Çift) ISBN Uyarısı! ({duplicateIsbnGroups.length} Farklı Çakışma Tespit Edildi)
              </h3>
              <p className="text-xs text-slate-300 mt-0.5">
                Aşağıdaki kaynaklar aynı ISBN kodunu paylaşmaktadır. Sistem stabilitesi ve doğru kitap takibi için her ISBN eşsiz olmalıdır.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-2">
            {duplicateIsbnGroups.map((group, idx) => (
              <div key={idx} className="p-3 rounded-xl bg-black/40 border border-red-500/30 flex flex-col justify-between space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-mono text-xs font-bold text-red-400 bg-red-500/10 px-2 py-0.5 rounded">
                    ISBN: {group.displayIsbn}
                  </span>
                  <span className="text-[11px] font-bold text-slate-400">
                    {(group.books || []).length} Kaynakta Ortak
                  </span>
                </div>
                <div className="space-y-1.5 divide-y divide-white/5">
                  {(group.books || []).map(b => (
                    <div key={b.id} className="pt-1.5 first:pt-0 flex items-center justify-between gap-2 text-xs">
                      <div className="truncate">
                        <span className="font-semibold text-white">{b.name}</span>
                        <span className="text-[10px] text-slate-400 ml-1.5">({b.subject} - {b.type})</span>
                      </div>
                      <div className="flex items-center gap-1 shrink-0">
                        <button
                          onClick={() => handleOpenModal(b)}
                          className="px-2 py-1 text-[11px] bg-slate-800 hover:bg-slate-700 text-slate-200 rounded font-semibold transition-colors"
                        >
                          Düzenle
                        </button>
                        <button
                          onClick={() => handleDeleteBook(b.id)}
                          className="p-1 text-red-400 hover:bg-red-500/20 rounded transition-colors"
                          title="Sil"
                        >
                          <Trash2 size={13} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Quick Filter Tabs */}
      <div className="flex flex-wrap items-center gap-2">
        <button
          type="button"
          onClick={() => setResourceTypeFilter('Hepsi')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
            resourceTypeFilter === 'Hepsi'
              ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-500/20'
              : 'bg-slate-800/80 hover:bg-slate-700 text-slate-300 border border-white/5'
          }`}
        >
          <span>Tümü</span>
          <span className={`px-1.5 py-0.5 rounded-full text-[10px] ${
            resourceTypeFilter === 'Hepsi' ? 'bg-white/20 text-white' : 'bg-slate-700 text-slate-300'
          }`}>
            {books.length}
          </span>
        </button>

        <button
          type="button"
          onClick={() => setResourceTypeFilter('soru')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
            resourceTypeFilter === 'soru'
              ? 'bg-amber-500 text-white shadow-lg shadow-amber-500/20'
              : 'bg-slate-800/80 hover:bg-slate-700 text-slate-300 border border-white/5'
          }`}
        >
          <BookOpen size={14} />
          <span>Soru Bankası</span>
          <span className={`px-1.5 py-0.5 rounded-full text-[10px] ${
            resourceTypeFilter === 'soru' ? 'bg-white/20 text-white' : 'bg-slate-700 text-slate-300'
          }`}>
            {books.filter(b => (b.resourceType || 'soru') === 'soru').length}
          </span>
        </button>

        <button
          type="button"
          onClick={() => setResourceTypeFilter('fasikul')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
            resourceTypeFilter === 'fasikul'
              ? 'bg-purple-600 text-white shadow-lg shadow-purple-600/20'
              : 'bg-slate-800/80 hover:bg-slate-700 text-slate-300 border border-white/5'
          }`}
        >
          <BookmarkCheck size={14} />
          <span>Konu Fasikülleri</span>
          <span className={`px-1.5 py-0.5 rounded-full text-[10px] ${
            resourceTypeFilter === 'fasikul' ? 'bg-white/20 text-white' : 'bg-slate-700 text-slate-300'
          }`}>
            {books.filter(b => b.resourceType === 'fasikul').length}
          </span>
        </button>

        <button
          type="button"
          onClick={() => setResourceTypeFilter('deneme')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
            resourceTypeFilter === 'deneme'
              ? 'bg-rose-600 text-white shadow-lg shadow-rose-600/20'
              : 'bg-slate-800/80 hover:bg-slate-700 text-slate-300 border border-white/5'
          }`}
        >
          <Target size={14} />
          <span>Denemeler</span>
          <span className={`px-1.5 py-0.5 rounded-full text-[10px] ${
            resourceTypeFilter === 'deneme' ? 'bg-white/20 text-white' : 'bg-slate-700 text-slate-300'
          }`}>
            {books.filter(b => b.resourceType === 'deneme').length}
          </span>
        </button>

        <button
          type="button"
          onClick={() => setResourceTypeFilter('konu')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
            resourceTypeFilter === 'konu'
              ? 'bg-blue-500 text-white shadow-lg shadow-blue-500/20'
              : 'bg-slate-800/80 hover:bg-slate-700 text-slate-300 border border-white/5'
          }`}
        >
          <FileText size={14} />
          <span>Konu Anlatımı</span>
          <span className={`px-1.5 py-0.5 rounded-full text-[10px] ${
            resourceTypeFilter === 'konu' ? 'bg-white/20 text-white' : 'bg-slate-700 text-slate-300'
          }`}>
            {books.filter(b => b.resourceType === 'konu').length}
          </span>
        </button>

        <button
          type="button"
          onClick={() => setResourceTypeFilter('youtube')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
            resourceTypeFilter === 'youtube'
              ? 'bg-red-500 text-white shadow-lg shadow-red-500/20'
              : 'bg-slate-800/80 hover:bg-slate-700 text-slate-300 border border-white/5'
          }`}
        >
          <Youtube size={14} />
          <span>YouTube</span>
          <span className={`px-1.5 py-0.5 rounded-full text-[10px] ${
            resourceTypeFilter === 'youtube' ? 'bg-white/20 text-white' : 'bg-slate-700 text-slate-300'
          }`}>
            {books.filter(b => b.resourceType === 'youtube').length}
          </span>
        </button>
      </div>

      {/* Search and Filters Bar */}
      <div className="flex flex-col md:flex-row gap-4">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
          <input
            type="text"
            placeholder="Kaynak adı, kanal veya ISBN ara..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-slate-800/80 border border-white/10 rounded-xl pl-10 pr-4 py-2.5 text-sm text-white placeholder-slate-500 outline-none focus:border-emerald-500/50"
          />
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center gap-1.5">
            <Filter size={18} className="text-slate-400" />
            <select
              value={resourceTypeFilter}
              onChange={(e) => setResourceTypeFilter(e.target.value)}
              className="bg-slate-800 border border-white/10 rounded-xl px-3 py-2.5 text-sm text-white outline-none focus:border-emerald-500/50 cursor-pointer font-medium"
            >
              <option value="Hepsi">Tüm Türler</option>
              <option value="soru">Soru Bankası</option>
              <option value="fasikul">Konu Fasikülü</option>
              <option value="deneme">Deneme</option>
              <option value="konu">Konu Anlatımı</option>
              <option value="youtube">YouTube</option>
            </select>
          </div>

          <select
            value={examTypeFilter}
            onChange={(e) => setExamTypeFilter(e.target.value)}
            className="bg-slate-800 border border-white/10 rounded-xl px-3 py-2.5 text-sm text-white outline-none focus:border-emerald-500/50 cursor-pointer font-medium"
          >
            <option value="Hepsi">Tüm Alanlar</option>
            <option value="TYT">TYT</option>
            <option value="AYT">AYT</option>
            <option value="9. Sınıf">9. Sınıf</option>
            <option value="10. Sınıf">10. Sınıf</option>
            <option value="11. Sınıf">11. Sınıf</option>
            <option value="Ortak">Ortak</option>
          </select>

          <select
            value={subjectFilter}
            onChange={(e) => setSubjectFilter(e.target.value)}
            className="bg-slate-800 border border-white/10 rounded-xl px-3 py-2.5 text-sm text-white outline-none focus:border-emerald-500/50 cursor-pointer font-medium"
          >
            <option value="Hepsi">Tüm Dersler</option>
            {allSubjects.map((sub: any) => (
              <option key={sub} value={sub}>{sub}</option>
            ))}
          </select>
        </div>
      </div>

      <div className="bg-slate-900/60 rounded-2xl border border-white/10 overflow-hidden shadow-xl">
        <div className="grid grid-cols-12 gap-4 p-4 text-xs font-bold text-slate-400 border-b border-white/10 uppercase tracking-wider bg-slate-800/40">
          <div className="col-span-1 text-center">Sıra</div>
          <div className="col-span-4">Kaynak Adı</div>
          <div className="col-span-2">Ders & Tür</div>
          <div className="col-span-3">Materyal & Detay</div>
          <div className="col-span-2 text-right">İşlemler</div>
        </div>

        {loading ? (
          <div className="p-12 text-center text-slate-400 flex items-center justify-center gap-3">
            <Loader2 className="animate-spin text-emerald-400" size={24} />
            <span>Kaynaklar yükleniyor...</span>
          </div>
        ) : filteredBooks.length === 0 ? (
          <div className="p-12 text-center text-slate-400">Kaynak bulunamadı.</div>
        ) : (
          <div className="divide-y divide-white/5 max-h-[600px] overflow-y-auto">
            {filteredBooks.sort((a,b) => (a.order || 999) - (b.order || 999)).map((book: any) => {
              const isDuplicate = book.isbn && duplicateIsbnSet.has(cleanIsbn(book.isbn));
              return (
                <div key={book.id} className="grid grid-cols-12 gap-4 p-4 text-sm items-center hover:bg-white/5 transition-colors">
                  <div className="col-span-1 text-center text-slate-400 font-bold">{book.order || '-'}</div>
                  <div className="col-span-4 text-white font-medium break-words">
                    <div className="flex items-center gap-2">
                      {book.resourceType === 'youtube' ? (
                        <Youtube size={18} className="text-red-400 shrink-0" />
                      ) : book.resourceType === 'fasikul' ? (
                        <BookmarkCheck size={18} className="text-purple-400 shrink-0" />
                      ) : book.resourceType === 'deneme' ? (
                        <Target size={18} className="text-rose-400 shrink-0" />
                      ) : book.resourceType === 'konu' ? (
                        <Layers size={18} className="text-blue-400 shrink-0" />
                      ) : (
                        <BookOpen size={18} className="text-emerald-400 shrink-0" />
                      )}
                      <span className="font-semibold text-slate-100">{book.name}</span>
                    </div>
                    {book.channelTitle && (
                      <div className="text-[11px] text-red-400/90 font-medium mt-0.5 ml-6 flex items-center gap-1">
                        <span>Kanal: {book.channelTitle}</span>
                      </div>
                    )}
                    {book.resourceType === 'fasikul' && Array.isArray(book.coveredTopics) && book.coveredTopics.length > 0 && (
                      <div className="text-[11px] text-purple-300 font-medium mt-1 ml-6 flex flex-wrap items-center gap-1">
                        <span className="text-slate-400">Kapsam:</span>
                        {book.coveredTopics.map((ct: string, i: number) => (
                          <span key={i} className="bg-purple-500/15 border border-purple-500/30 text-purple-200 px-1.5 py-0.2 rounded text-[10px]">
                            {ct}
                          </span>
                        ))}
                      </div>
                    )}
                    {book.resourceType !== 'youtube' && book.isbn && (
                      <div className="text-[10px] text-slate-400 mt-0.5 ml-6 flex items-center gap-1.5">
                        <span>ISBN: {book.isbn}</span>
                        {isDuplicate && (
                          <span className="px-1.5 py-0.2 rounded bg-red-500/20 text-red-400 border border-red-500/30 text-[9px] font-bold">
                            ⚠️ Çift ISBN
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                  <div className="col-span-2">
                    <div className="text-white font-medium">{book.subject}</div>
                    <div className="text-[10px] text-emerald-400 font-bold tracking-wider">{book.type}</div>
                  </div>
                  <div className="col-span-3">
                    <div className="flex flex-wrap items-center gap-1.5">
                      <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider ${
                        book.resourceType === 'youtube' ? 'bg-red-500/20 text-red-400 border border-red-500/30' :
                        book.resourceType === 'fasikul' ? 'bg-purple-500/20 text-purple-400 border border-purple-500/30' :
                        book.resourceType === 'deneme' ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30' :
                        book.resourceType === 'konu' ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30' :
                        'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                      }`}>
                        {book.resourceType === 'youtube' ? 'YouTube Kampı' : 
                         book.resourceType === 'fasikul' ? 'Konu Fasikülü' : 
                         book.resourceType === 'deneme' ? 'Deneme Paketi' : 
                         book.resourceType === 'konu' ? 'Konu Anlatımı' : 'Soru Bankası'}
                      </span>

                      {book.resourceType === 'deneme' && (
                        <div className="flex items-center gap-1">
                          <span className="bg-rose-500/10 border border-rose-500/20 text-rose-300 px-2 py-0.5 rounded-full text-[10px] font-bold">
                            {book.totalExamCount || 10} Deneme
                          </span>
                          {book.denemeCategory === 'general' ? (
                            <span className="bg-rose-500/20 border border-rose-500/30 text-rose-200 px-1.5 py-0.5 rounded-full text-[10px] font-bold">
                              Genel
                            </span>
                          ) : (
                            <span className="bg-slate-800 text-slate-300 border border-white/5 px-1.5 py-0.5 rounded-full text-[10px]">
                              Branş
                            </span>
                          )}
                        </div>
                      )}

                      {book.resourceType === 'youtube' && Array.isArray(book.videos) && book.videos.length > 0 && (
                        <div className="flex flex-col gap-1 items-start">
                          <button
                            onClick={() => setViewingVideoBook(book)}
                            className="flex items-center gap-1 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-white/10 px-2 py-0.5 rounded-full text-[10px] font-bold transition-colors cursor-pointer"
                            title="Videoları Görüntüle"
                          >
                            <Video size={11} className="text-red-400" />
                            <span>{(book.videos || []).length} Video</span>
                            {book.totalDurationFormatted && (
                              <span className="text-slate-400">({book.totalDurationFormatted})</span>
                            )}
                            <Eye size={10} className="ml-0.5 text-slate-400" />
                          </button>
                          {book.lastSyncedAt && (
                            <span className="text-[9px] text-slate-500 font-medium flex items-center gap-1">
                              <Clock size={9} className="text-red-400/70" />
                              <span>Son Senk: {new Date(book.lastSyncedAt).toLocaleDateString('tr-TR', { day: '2-digit', month: '2-digit' })} {new Date(book.lastSyncedAt).toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' })}</span>
                            </span>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="col-span-2 flex items-center justify-end gap-2">
                    {book.resourceType === 'youtube' && Array.isArray(book.videos) && book.videos.length > 0 && (
                      <button 
                        onClick={() => setViewingVideoBook(book)} 
                        className="p-2 text-slate-400 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors"
                        title="Videoları Listele"
                      >
                        <Eye size={16} />
                      </button>
                    )}
                    <button onClick={() => handleOpenModal(book)} className="p-2 text-slate-400 hover:text-white hover:bg-white/10 rounded-lg transition-colors" title="Düzenle">
                      <Edit2 size={16} />
                    </button>
                    <button onClick={() => handleDeleteBook(book.id)} className="p-2 text-red-400 hover:text-red-300 hover:bg-red-500/20 rounded-lg transition-colors" title="Sil">
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Video List Preview Modal */}
      {viewingVideoBook && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-white/10 rounded-2xl p-6 w-full max-w-2xl max-h-[85vh] flex flex-col shadow-2xl">
            <div className="flex items-center justify-between border-b border-white/10 pb-4 mb-4">
              <div>
                <h3 className="text-lg font-black text-white flex items-center gap-2">
                  <Youtube className="text-red-400" size={20} />
                  <span>{viewingVideoBook.name}</span>
                </h3>
                <p className="text-xs text-slate-400 mt-1">
                  {viewingVideoBook.channelTitle ? `Kanal: ${viewingVideoBook.channelTitle} • ` : ''}
                  Toplam {viewingVideoBook.videos?.length || 0} Video 
                  {viewingVideoBook.totalDurationFormatted ? ` (${viewingVideoBook.totalDurationFormatted})` : ''}
                </p>
              </div>
              <button 
                onClick={() => setViewingVideoBook(null)}
                className="text-slate-400 hover:text-white p-2 text-lg"
              >
                ✕
              </button>
            </div>

            <div className="flex-1 overflow-y-auto space-y-2 pr-1">
              {viewingVideoBook.videos?.map((video: any, idx: number) => (
                <div 
                  key={idx} 
                  className="flex items-center justify-between p-3 rounded-xl bg-slate-800/60 border border-white/5 hover:border-red-500/30 transition-colors"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <span className="font-mono text-xs font-bold text-slate-500 w-6 text-right">
                      {video.order || idx + 1}.
                    </span>
                    <div className="min-w-0">
                      <div className="text-sm font-semibold text-slate-200 truncate">
                        {video.title}
                      </div>
                      <div className="flex items-center gap-2 mt-0.5 text-[11px] text-slate-400">
                        <span className="flex items-center gap-1 text-red-400/90 font-medium">
                          <Clock size={11} /> {video.durationFormatted || `${video.durationMinutes} dk`}
                        </span>
                      </div>
                    </div>
                  </div>

                  {video.url && (
                    <a 
                      href={video.url} 
                      target="_blank" 
                      rel="noreferrer" 
                      className="flex items-center gap-1.5 bg-red-600 hover:bg-red-500 text-white text-xs font-bold px-3 py-1.5 rounded-lg transition-all shrink-0 ml-3"
                    >
                      <Play size={12} fill="white" /> İzle
                    </a>
                  )}
                </div>
              ))}
            </div>

            <div className="pt-4 border-t border-white/10 flex justify-end">
              <button 
                onClick={() => setViewingVideoBook(null)}
                className="px-5 py-2 bg-slate-800 hover:bg-slate-700 text-white text-sm font-bold rounded-xl transition-colors"
              >
                Kapat
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Resource Add/Edit Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-white/10 rounded-2xl p-6 w-full max-w-2xl max-h-[92vh] overflow-y-auto shadow-2xl">
            <div className="flex items-center justify-between border-b border-white/10 pb-4 mb-6">
              <h2 className="text-xl font-black text-white uppercase tracking-tight flex items-center gap-2">
                {formData.resourceType === 'youtube' ? (
                  <Youtube className="text-red-400" size={24} />
                ) : formData.resourceType === 'fasikul' ? (
                  <BookmarkCheck className="text-purple-400" size={24} />
                ) : formData.resourceType === 'deneme' ? (
                  <Target className="text-rose-400" size={24} />
                ) : (
                  <BookOpen className="text-emerald-400" size={24} />
                )}
                <span>{editingBook ? 'Kaynağı Düzenle' : 'Yeni Kaynak Ekle'}</span>
              </h2>
              <button onClick={handleCloseModal} className="text-slate-400 hover:text-white p-2">✕</button>
            </div>
            
            <form onSubmit={handleSaveBook} className="space-y-5">
              {/* Material Type Selector */}
              <div className="bg-slate-800/50 p-3.5 rounded-xl border border-white/5">
                <label className="block text-xs font-black text-slate-300 uppercase tracking-wider mb-2">Materyal Tipi</label>
                <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
                  <button
                    type="button"
                    onClick={() => setFormData({ ...formData, resourceType: 'soru' })}
                    className={`py-2 px-3 rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 transition-all ${
                      formData.resourceType === 'soru'
                        ? 'bg-amber-500 text-white shadow-lg shadow-amber-500/20'
                        : 'bg-slate-800 text-slate-400 hover:text-white'
                    }`}
                  >
                    <BookOpen size={14} /> Soru Bankası
                  </button>
                  <button
                    type="button"
                    onClick={() => setFormData({ ...formData, resourceType: 'fasikul' })}
                    className={`py-2 px-3 rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 transition-all ${
                      formData.resourceType === 'fasikul'
                        ? 'bg-purple-600 text-white shadow-lg shadow-purple-600/20'
                        : 'bg-slate-800 text-slate-400 hover:text-white'
                    }`}
                  >
                    <BookmarkCheck size={14} /> Konu Fasikülü
                  </button>
                  <button
                    type="button"
                    onClick={() => setFormData({ ...formData, resourceType: 'deneme' })}
                    className={`py-2 px-3 rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 transition-all ${
                      formData.resourceType === 'deneme'
                        ? 'bg-rose-600 text-white shadow-lg shadow-rose-600/20'
                        : 'bg-slate-800 text-slate-400 hover:text-white'
                    }`}
                  >
                    <Target size={14} /> Deneme
                  </button>
                  <button
                    type="button"
                    onClick={() => setFormData({ ...formData, resourceType: 'konu' })}
                    className={`py-2 px-3 rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 transition-all ${
                      formData.resourceType === 'konu'
                        ? 'bg-blue-500 text-white shadow-lg shadow-blue-500/20'
                        : 'bg-slate-800 text-slate-400 hover:text-white'
                    }`}
                  >
                    <Layers size={14} /> Konu Anlatımı
                  </button>
                  <button
                    type="button"
                    onClick={() => setFormData({ ...formData, resourceType: 'youtube', isbn: '' })}
                    className={`py-2 px-3 rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 transition-all ${
                      formData.resourceType === 'youtube'
                        ? 'bg-red-600 text-white shadow-lg shadow-red-600/20'
                        : 'bg-slate-800 text-slate-400 hover:text-white'
                    }`}
                  >
                    <Youtube size={14} /> YouTube Video
                  </button>
                </div>
              </div>

              {/* Deneme Specific Configuration Box */}
              {formData.resourceType === 'deneme' && (
                <div className="bg-gradient-to-br from-rose-950/30 to-slate-900 p-4 rounded-xl border border-rose-500/30 space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-black text-rose-300 uppercase tracking-wider flex items-center gap-2">
                      <Target size={16} className="text-rose-400" />
                      Deneme Paketi Yapılandırması
                    </span>
                    <span className="text-[10px] font-bold text-rose-300 bg-rose-500/20 px-2 py-0.5 rounded-full border border-rose-500/30">
                      Fiziksel Deneme Paketi
                    </span>
                  </div>

                  {/* Deneme Kategori Seçimi (Branş vs Genel) */}
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-slate-300 uppercase tracking-wider block">
                      Deneme Kapsamı:
                    </label>
                    <div className="grid grid-cols-2 gap-2 bg-black/30 p-1.5 rounded-xl border border-rose-500/20">
                      <button
                        type="button"
                        onClick={() => setFormData({
                          ...formData,
                          denemeCategory: 'branch',
                          subject: formData.subject === 'Genel Deneme' ? (allSubjects[0] || 'Türkçe') : formData.subject
                        })}
                        className={`py-2 px-3 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-2 ${
                          (formData.denemeCategory || 'branch') === 'branch'
                            ? 'bg-rose-600 text-white shadow-md shadow-rose-600/30 border border-rose-400/50'
                            : 'text-slate-400 hover:text-slate-200 hover:bg-white/5'
                        }`}
                      >
                        <Book size={13} />
                        <span>Branş Denemesi (Ders Odaklı)</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => setFormData({
                          ...formData,
                          denemeCategory: 'general',
                          subject: 'Genel Deneme'
                        })}
                        className={`py-2 px-3 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-2 ${
                          formData.denemeCategory === 'general'
                            ? 'bg-rose-600 text-white shadow-md shadow-rose-600/30 border border-rose-400/50'
                            : 'text-slate-400 hover:text-slate-200 hover:bg-white/5'
                        }`}
                      >
                        <Target size={13} />
                        <span>Genel Deneme Paketi</span>
                      </button>
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-slate-300 uppercase tracking-wider block">
                      Paketteki Toplam Deneme Sayısı:
                    </label>
                    <div className="flex items-center gap-2">
                      <input
                        type="number"
                        min="1"
                        max="100"
                        value={formData.totalExamCount || 10}
                        onChange={(e) => setFormData({ ...formData, totalExamCount: Math.max(1, parseInt(e.target.value) || 1) })}
                        className="w-24 bg-black/40 border border-rose-500/30 text-rose-300 font-bold text-center rounded-lg py-2 text-sm outline-none focus:border-rose-400"
                      />
                      <span className="text-xs text-slate-400">Adet Deneme Sınavı</span>
                    </div>
                  </div>
                </div>
              )}

              {/* YouTube Specific Playlist Fetching Box */}
              {formData.resourceType === 'youtube' && (
                <div className="bg-gradient-to-br from-red-950/30 to-slate-900 p-4 rounded-xl border border-red-500/20 space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-black text-red-400 uppercase tracking-wider flex items-center gap-1.5">
                      <Youtube size={16} /> YouTube Oynatma Listesi Entegrasyonu
                    </span>
                    <button
                      type="button"
                      onClick={() => setShowApiKeyInput(!showApiKeyInput)}
                      className="text-[11px] text-slate-400 hover:text-red-300 flex items-center gap-1 transition-colors"
                    >
                      <Key size={12} /> {showApiKeyInput ? 'Özel API Key Gizle' : 'Özel API Key Gir'}
                    </button>
                  </div>

                  {showApiKeyInput && (
                    <div>
                      <label className="block text-[11px] font-bold text-slate-400 mb-1">
                        YouTube Data API Key (Opsiyonel - Boş bırakılırsa sistem varsayılanı veya otomatik çekici kullanılır)
                      </label>
                      <input
                        type="text"
                        value={customApiKey}
                        onChange={(e) => setCustomApiKey(e.target.value)}
                        placeholder="AIzaSy..."
                        className="w-full bg-black/40 border border-white/10 rounded-lg px-3 py-2 text-xs text-white placeholder-slate-600 outline-none focus:border-red-500"
                      />
                    </div>
                  )}

                  <div>
                    <label className="block text-xs font-bold text-slate-300 mb-1.5">
                      YouTube Playlist Linki veya ID'si
                    </label>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={formData.playlistUrl}
                        onChange={(e) => setFormData({ ...formData, playlistUrl: e.target.value })}
                        className="flex-1 bg-black/30 border border-white/10 rounded-xl px-3 py-2.5 text-sm text-white placeholder-slate-500 outline-none focus:border-red-500"
                        placeholder="https://www.youtube.com/playlist?list=PL..."
                      />
                      <button
                        type="button"
                        onClick={handleFetchYoutubePlaylist}
                        disabled={fetchingYoutube || !formData.playlistUrl}
                        className="flex items-center gap-2 bg-red-600 hover:bg-red-500 disabled:opacity-50 text-white font-bold px-4 py-2.5 rounded-xl transition-all shadow-lg shadow-red-600/20 shrink-0"
                      >
                        {fetchingYoutube ? (
                          <>
                            <Loader2 className="animate-spin" size={16} />
                            <span>Çekiliyor...</span>
                          </>
                        ) : (
                          <>
                            <Youtube size={16} />
                            <span>Videoları Çek</span>
                          </>
                        )}
                      </button>
                    </div>
                  </div>

                  {youtubeError && (
                    <div className="flex items-center gap-2 p-3 bg-red-500/10 border border-red-500/30 rounded-lg text-xs text-red-300">
                      <AlertCircle size={16} className="shrink-0" />
                      <span>{youtubeError}</span>
                    </div>
                  )}

                  {/* Fetched Playlist Preview Card */}
                  {formData.videos && formData.videos.length > 0 && (
                    <div className="space-y-3">
                      <div className="flex items-center justify-between p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/30">
                        <div className="flex items-center gap-2 text-emerald-400">
                          <CheckCircle2 size={16} />
                          <span className="text-xs font-bold">
                            {formData.totalVideos} Video Başarıyla Yüklendi ({formData.totalDurationFormatted || `${formData.totalDurationMinutes} dk`})
                          </span>
                        </div>
                        {formData.channelTitle && (
                          <span className="text-xs font-bold text-slate-300">Kanal: {formData.channelTitle}</span>
                        )}
                      </div>

                      {/* Video List Accordion/Preview */}
                      <div className="max-h-48 overflow-y-auto space-y-1.5 bg-black/40 p-2.5 rounded-xl border border-white/5">
                        {formData.videos.map((vid: any, idx: number) => (
                          <div key={idx} className="flex items-center justify-between p-2 rounded-lg bg-white/5 text-xs text-slate-200 group">
                            <div className="flex items-center gap-2 min-w-0">
                              <span className="font-mono text-slate-500 w-5">{vid.order || idx + 1}.</span>
                              <span className="truncate max-w-[280px] font-medium">{vid.title}</span>
                            </div>
                            <div className="flex items-center gap-2 shrink-0">
                              <span className="text-[10px] text-red-400 font-bold bg-red-500/10 px-1.5 py-0.5 rounded">
                                {vid.durationFormatted || `${vid.durationMinutes} dk`}
                              </span>
                              <button
                                type="button"
                                onClick={() => handleDeleteVideoFromList(idx)}
                                className="text-slate-500 hover:text-red-400 p-1"
                                title="Listeden Çıkar"
                              >
                                <Trash2 size={12} />
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>

                      {/* Manual Add Extra Video */}
                      <div className="pt-2 border-t border-white/5 flex gap-2 items-center">
                        <input
                          type="text"
                          value={newVideoTitle}
                          onChange={(e) => setNewVideoTitle(e.target.value)}
                          placeholder="Manuel Video Başlığı Ekle..."
                          className="flex-1 bg-black/20 border border-white/10 rounded-lg px-2.5 py-1.5 text-xs text-white outline-none focus:border-red-500"
                        />
                        <input
                          type="number"
                          value={newVideoDuration}
                          onChange={(e) => setNewVideoDuration(e.target.value)}
                          placeholder="Dk"
                          className="w-14 bg-black/20 border border-white/10 rounded-lg px-2 py-1.5 text-xs text-white text-center outline-none focus:border-red-500"
                        />
                        <button
                          type="button"
                          onClick={handleAddManualVideo}
                          className="bg-slate-800 hover:bg-slate-700 text-slate-200 px-3 py-1.5 rounded-lg text-xs font-bold"
                        >
                          + Ekle
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Resource Name */}
              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Kaynak Adı</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full bg-black/20 border border-white/10 rounded-xl p-3 text-sm text-white outline-none focus:border-emerald-500/50"
                  placeholder={
                    formData.resourceType === 'youtube' ? 'Örn: Eyüp B. TYT Matematik Kampı 2025' :
                    formData.resourceType === 'deneme' ? 'Örn: 3D TYT Matematik 10\'lu Branş Denemesi' :
                    formData.resourceType === 'fasikul' ? 'Örn: Çap Yayınları Trigonometri Fasikülü' :
                    formData.resourceType === 'konu' ? 'Örn: Palme TYT Biyoloji Konu Anlatımı' :
                    'Örn: 3D TYT Matematik Soru Bankası'
                  }
                  required
                />
              </div>

              {/* Exam Type & Subject */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Sınav Türü</label>
                  <select
                    value={formData.type}
                    onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                    className="w-full bg-slate-800 border border-white/10 rounded-xl p-3 text-sm text-white outline-none focus:border-emerald-500/50"
                  >
                    <option value="TYT">TYT</option>
                    <option value="AYT">AYT</option>
                    <option value="9. Sınıf">9. Sınıf</option>
                    <option value="10. Sınıf">10. Sınıf</option>
                    <option value="11. Sınıf">11. Sınıf</option>
                    <option value="Ortak">Ortak</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Ders</label>
                  <select
                    value={formData.subject}
                    onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                    className="w-full bg-slate-800 border border-white/10 rounded-xl p-3 text-sm text-white outline-none focus:border-emerald-500/50"
                  >
                    {allSubjects.map((sub: any) => (
                      <option key={sub} value={sub}>{sub}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Fasikül Scope Selection (Only for Fasikül) */}
              {formData.resourceType === 'fasikul' && (
                <div className="bg-purple-950/30 border border-purple-500/30 p-4 rounded-xl space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <BookmarkCheck size={18} className="text-purple-400" />
                      <span className="text-xs font-black text-purple-200 uppercase tracking-wider">
                        Fasikül Kapsamı ({formData.coveredTopics.length} Konu Seçili)
                      </span>
                    </div>
                    {formData.coveredTopics.length > 0 && (
                      <button
                        type="button"
                        onClick={() => setFormData({ ...formData, coveredTopics: [] })}
                        className="text-[11px] text-purple-400 hover:text-purple-300 underline font-medium"
                      >
                        Seçimleri Temizle
                      </button>
                    )}
                  </div>
                  <p className="text-[11px] text-purple-300/80 leading-relaxed">
                    Bu fasikül öğrenciye eklendiğinde tüm ders müfredatı yerine yalnızca burada seçilen konu(lar) listelenir ve takip edilir.
                  </p>

                  {/* Selected Topic Badges */}
                  {formData.coveredTopics.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 p-2.5 bg-black/30 rounded-lg border border-purple-500/20">
                      {formData.coveredTopics.map((topic, idx) => (
                        <span
                          key={idx}
                          className="inline-flex items-center gap-1.5 bg-purple-600/30 border border-purple-500/40 text-purple-200 text-xs px-2.5 py-1 rounded-lg font-medium"
                        >
                          <Check size={12} className="text-purple-400" />
                          <span>{topic}</span>
                          <button
                            type="button"
                            onClick={() => setFormData({
                              ...formData,
                              coveredTopics: formData.coveredTopics.filter(t => t !== topic)
                            })}
                            className="text-purple-300 hover:text-white ml-0.5"
                          >
                            ✕
                          </button>
                        </span>
                      ))}
                    </div>
                  )}

                  {/* Available Topics from Curriculum */}
                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">
                      {formData.subject} ({formData.type}) Müfredatından Konu Seçin:
                    </label>
                    <div className="flex flex-wrap gap-1.5 max-h-36 overflow-y-auto p-2 bg-black/20 rounded-lg border border-white/5">
                      {getCurriculumTopicsForBook({ subject: formData.subject, type: formData.type }, CURRICULUM).map((top: string) => {
                        const isSelected = formData.coveredTopics.includes(top);
                        return (
                          <button
                            key={top}
                            type="button"
                            onClick={() => {
                              if (isSelected) {
                                setFormData({
                                  ...formData,
                                  coveredTopics: formData.coveredTopics.filter(t => t !== top)
                                });
                              } else {
                                setFormData({
                                  ...formData,
                                  coveredTopics: [...formData.coveredTopics, top]
                                });
                              }
                            }}
                            className={`text-xs px-2.5 py-1 rounded-lg font-medium transition-all text-left flex items-center gap-1.5 ${
                              isSelected
                                ? 'bg-purple-600 text-white shadow-sm'
                                : 'bg-white/5 hover:bg-white/10 text-slate-300 hover:text-white border border-white/5'
                            }`}
                          >
                            {isSelected ? <Check size={12} /> : <Plus size={12} />}
                            <span>{top}</span>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Manual / Custom Topic Add */}
                  <div className="flex gap-2 pt-1">
                    <input
                      type="text"
                      value={customFasikulTopic}
                      onChange={(e) => setCustomFasikulTopic(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          if (customFasikulTopic.trim() && !formData.coveredTopics.includes(customFasikulTopic.trim())) {
                            setFormData({
                              ...formData,
                              coveredTopics: [...formData.coveredTopics, customFasikulTopic.trim()]
                            });
                            setCustomFasikulTopic('');
                          }
                        }
                      }}
                      placeholder="Müfredat dışı özel konu veya fasikül başlığı ekle..."
                      className="flex-1 bg-black/40 border border-purple-500/30 rounded-lg px-3 py-1.5 text-xs text-white outline-none focus:border-purple-400 placeholder-purple-300/40"
                    />
                    <button
                      type="button"
                      onClick={() => {
                        if (customFasikulTopic.trim() && !formData.coveredTopics.includes(customFasikulTopic.trim())) {
                          setFormData({
                            ...formData,
                            coveredTopics: [...formData.coveredTopics, customFasikulTopic.trim()]
                          });
                          setCustomFasikulTopic('');
                        }
                      }}
                      className="px-3 py-1.5 bg-purple-600 hover:bg-purple-500 text-white rounded-lg text-xs font-bold transition-colors"
                    >
                      Ekle
                    </button>
                  </div>
                </div>
              )}

              {/* Order & ISBN / Details */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Sıra (Opsiyonel)</label>
                  <input
                    type="number"
                    value={formData.order}
                    onChange={(e) => setFormData({ ...formData, order: e.target.value })}
                    className="w-full bg-black/20 border border-white/10 rounded-xl p-3 text-sm text-white outline-none focus:border-emerald-500/50"
                    placeholder="Sıralama (1, 2, 3...)"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">
                    {formData.resourceType === 'youtube' ? 'Kanal / Eğitmen Adı' : 'ISBN (Opsiyonel)'}
                  </label>
                  {formData.resourceType === 'youtube' ? (
                    <div className="space-y-2">
                      <select
                        value={getYoutubeChannelsForSubject(formData.subject).includes(formData.channelTitle) ? formData.channelTitle : (formData.channelTitle ? 'custom' : '')}
                        onChange={(e) => {
                          if (e.target.value === 'custom') {
                            // User wants custom input
                          } else if (e.target.value) {
                            const ch = e.target.value;
                            setFormData({
                              ...formData,
                              channelTitle: ch,
                              name: formData.name ? formData.name : `${ch} - ${formData.subject} Video Serisi`
                            });
                          }
                        }}
                        className="w-full bg-slate-800 border border-white/10 rounded-xl p-2.5 text-xs text-white outline-none focus:border-red-500/50 mb-1.5"
                      >
                        <option value="">-- Önerilen Kanallardan Seçin --</option>
                        {getYoutubeChannelsForSubject(formData.subject).map(ch => (
                          <option key={ch} value={ch}>{ch}</option>
                        ))}
                        <option value="custom">Diğer / Özel Kanal Girişi</option>
                      </select>
                      <input
                        type="text"
                        value={formData.channelTitle}
                        onChange={(e) => setFormData({ ...formData, channelTitle: e.target.value })}
                        className="w-full bg-black/20 border border-white/10 rounded-xl p-3 text-sm text-white outline-none focus:border-emerald-500/50"
                        placeholder="Kanal / Eğitmen Adı (Örn: Eyüp B. Matematik)"
                      />
                    </div>
                  ) : (
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={formData.isbn}
                        onChange={(e) => setFormData({ ...formData, isbn: e.target.value })}
                        className="flex-1 bg-black/20 border border-white/10 rounded-xl p-3 text-sm text-white outline-none focus:border-emerald-500/50"
                        placeholder="ISBN No (Örn: 9786058116221)"
                      />
                      <button
                        type="button"
                        onClick={() => setIsScannerOpen(true)}
                        className="px-4 py-2.5 bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 border border-emerald-500/30 hover:border-emerald-500/60 rounded-xl text-xs font-bold transition-all flex items-center gap-2 shrink-0 shadow-sm"
                        title="Kamerayla Barkod Tara"
                      >
                        <Camera size={16} />
                        <span className="hidden sm:inline">Kamera ile Tara</span>
                      </button>
                    </div>
                  )}
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-6 border-t border-white/10">
                <button
                  type="button"
                  onClick={handleCloseModal}
                  className="px-6 py-2.5 text-sm font-bold text-slate-400 hover:text-white transition-colors"
                >
                  İptal
                </button>
                <button
                  type="submit"
                  className="px-6 py-2.5 bg-emerald-500 hover:bg-emerald-600 text-white text-sm font-bold rounded-xl transition-all shadow-lg shadow-emerald-500/20"
                >
                  {editingBook ? 'Güncelle' : 'Kaydet'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <BarcodeScannerModal
        isOpen={isScannerOpen}
        onClose={() => setIsScannerOpen(false)}
        onScanSuccess={(scannedIsbn) => {
          setFormData(prev => ({ ...prev, isbn: scannedIsbn }));
        }}
      />
    </div>
  );
}

