import React, { useState, useEffect } from 'react';
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
  Eye,
  Key,
  Layers
} from 'lucide-react';
import { studentDataService } from '../../services/studentDataService';
import { BRANCH_CONFIG } from '../../constants/branchConfig';

export default function AdminResources() {
  const [books, setBooks] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState('Hepsi');
  const [subjectFilter, setSubjectFilter] = useState('Hepsi');

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingBook, setEditingBook] = useState<any>(null);

  // Video viewer modal state
  const [viewingVideoBook, setViewingVideoBook] = useState<any>(null);

  // Form State
  const [formData, setFormData] = useState({
    name: '',
    type: 'TYT',
    subject: 'Türkçe',
    resourceType: 'soru',
    isbn: '',
    order: '',
    playlistUrl: '',
    playlistId: '',
    channelTitle: '',
    totalVideos: 0,
    totalDurationFormatted: '',
    totalDurationMinutes: 0,
    videos: [] as any[]
  });

  // YouTube Fetch State
  const [fetchingYoutube, setFetchingYoutube] = useState(false);
  const [youtubeError, setYoutubeError] = useState<string | null>(null);
  const [customApiKey, setCustomApiKey] = useState('');
  const [showApiKeyInput, setShowApiKeyInput] = useState(false);
  const [newVideoTitle, setNewVideoTitle] = useState('');
  const [newVideoDuration, setNewVideoDuration] = useState('');
  const [newVideoUrl, setNewVideoUrl] = useState('');

  useEffect(() => {
    loadBooks();
  }, []);

  const loadBooks = async () => {
    setLoading(true);
    const data = await studentDataService.getGlobalBooks();
    setBooks(data);
    setLoading(false);
  };

  const handleOpenModal = (book: any = null) => {
    setYoutubeError(null);
    if (book) {
      setEditingBook(book);
      setFormData({
        name: book.name || '',
        type: book.type || 'TYT',
        subject: book.subject || 'Türkçe',
        resourceType: book.resourceType || 'soru',
        isbn: book.isbn || '',
        order: book.order || '',
        playlistUrl: book.playlistUrl || (book.playlistId ? `https://www.youtube.com/playlist?list=${book.playlistId}` : ''),
        playlistId: book.playlistId || '',
        channelTitle: book.channelTitle || '',
        totalVideos: book.totalVideos || (book.videos?.length || 0),
        totalDurationFormatted: book.totalDurationFormatted || '',
        totalDurationMinutes: book.totalDurationMinutes || 0,
        videos: Array.isArray(book.videos) ? [...book.videos] : []
      });
    } else {
      setEditingBook(null);
      setFormData({
        name: '',
        type: 'TYT',
        subject: 'Türkçe',
        resourceType: 'soru',
        isbn: '',
        order: '',
        playlistUrl: '',
        playlistId: '',
        channelTitle: '',
        totalVideos: 0,
        totalDurationFormatted: '',
        totalDurationMinutes: 0,
        videos: []
      });
    }
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

      const data = await res.json();

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
    const newVid = {
      order: formData.videos.length + 1,
      videoId: '',
      title: newVideoTitle.trim(),
      durationFormatted: `${mins} dk`,
      durationMinutes: mins,
      durationSeconds: mins * 60,
      url: newVideoUrl.trim() || ''
    };

    const updated = [...formData.videos, newVid];
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
    if (!formData.name) {
      alert('Lütfen kaynak adını girin.');
      return;
    }

    const bookToSave = {
      ...(editingBook || {}),
      ...formData,
      order: formData.order ? parseInt(formData.order.toString()) : null
    };

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
    const matchesSearch = book.name?.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          book.isbn?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          book.channelTitle?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = typeFilter === 'Hepsi' || book.type === typeFilter;
    const matchesSubject = subjectFilter === 'Hepsi' || book.subject === subjectFilter;
    return matchesSearch && matchesType && matchesSubject;
  });

  const allSubjects = Array.from(new Set(Object.values(BRANCH_CONFIG).flatMap((b: any) => [...b.subjects, ...b.aytSubjects])));

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-white tracking-tight uppercase">Sistem Kaynakları</h1>
          <p className="text-slate-400 text-sm">Global kaynakları (Soru bankası, konu anlatımı ve YouTube video kampları) yönetin.</p>
        </div>
        <button
          onClick={() => handleOpenModal()}
          className="flex items-center gap-2 bg-emerald-500 hover:bg-emerald-600 text-white px-4 py-2.5 rounded-xl font-bold transition-all shadow-lg shadow-emerald-500/20"
        >
          <Plus size={20} />
          Yeni Kaynak Ekle
        </button>
      </div>

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
        <div className="flex items-center gap-2">
          <Filter size={20} className="text-slate-400" />
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="bg-slate-800 border border-white/10 rounded-xl px-3 py-2.5 text-sm text-white outline-none focus:border-emerald-500/50"
          >
            <option value="Hepsi">Tüm Türler</option>
            <option value="TYT">TYT</option>
            <option value="AYT">AYT</option>
            <option value="10. Sınıf">10. Sınıf</option>
          </select>
          <select
            value={subjectFilter}
            onChange={(e) => setSubjectFilter(e.target.value)}
            className="bg-slate-800 border border-white/10 rounded-xl px-3 py-2.5 text-sm text-white outline-none focus:border-emerald-500/50"
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
            {filteredBooks.sort((a,b) => (a.order || 999) - (b.order || 999)).map((book: any) => (
              <div key={book.id} className="grid grid-cols-12 gap-4 p-4 text-sm items-center hover:bg-white/5 transition-colors">
                <div className="col-span-1 text-center text-slate-400 font-bold">{book.order || '-'}</div>
                <div className="col-span-4 text-white font-medium break-words">
                  <div className="flex items-center gap-2">
                    {book.resourceType === 'youtube' ? (
                      <Youtube size={18} className="text-red-400 shrink-0" />
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
                  {book.isbn && <div className="text-[10px] text-slate-500 mt-0.5 ml-6">ISBN: {book.isbn}</div>}
                </div>
                <div className="col-span-2">
                  <div className="text-white font-medium">{book.subject}</div>
                  <div className="text-[10px] text-emerald-400 font-bold tracking-wider">{book.type}</div>
                </div>
                <div className="col-span-3">
                  <div className="flex flex-wrap items-center gap-1.5">
                    <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider ${
                      book.resourceType === 'youtube' ? 'bg-red-500/20 text-red-400 border border-red-500/30' :
                      book.resourceType === 'konu' ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30' :
                      'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                    }`}>
                      {book.resourceType === 'youtube' ? 'YouTube Kampı' : book.resourceType === 'konu' ? 'Konu Anlatımı' : 'Soru Bankası'}
                    </span>

                    {book.resourceType === 'youtube' && book.videos && book.videos.length > 0 && (
                      <button
                        onClick={() => setViewingVideoBook(book)}
                        className="flex items-center gap-1 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-white/10 px-2 py-0.5 rounded-full text-[10px] font-bold transition-colors cursor-pointer"
                        title="Videoları Görüntüle"
                      >
                        <Video size={11} className="text-red-400" />
                        <span>{book.videos.length} Video</span>
                        {book.totalDurationFormatted && (
                          <span className="text-slate-400">({book.totalDurationFormatted})</span>
                        )}
                        <Eye size={10} className="ml-0.5 text-slate-400" />
                      </button>
                    )}
                  </div>
                </div>
                <div className="col-span-2 flex items-center justify-end gap-2">
                  {book.resourceType === 'youtube' && book.videos && book.videos.length > 0 && (
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
            ))}
          </div>
        )}
      </div>

      {/* Video List Preview Modal */}
      {viewingVideoBook && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-white/10 rounded-2xl p-6 w-full max-w-2xl max-h-[85vh] flex flex-col shadow-2xl">
            <div className="flex items-center justify-between border-b border-white/10 pb-4 mb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-red-500/20 border border-red-500/30 flex items-center justify-center text-red-400">
                  <Youtube size={22} />
                </div>
                <div>
                  <h3 className="text-lg font-black text-white">{viewingVideoBook.name}</h3>
                  <p className="text-xs text-slate-400">
                    {viewingVideoBook.channelTitle && <span className="text-red-400 font-bold mr-2">Kanal: {viewingVideoBook.channelTitle}</span>}
                    {viewingVideoBook.videos?.length || 0} Video • Toplam Süre: {viewingVideoBook.totalDurationFormatted || `${viewingVideoBook.totalDurationMinutes || 0} dk`}
                  </p>
                </div>
              </div>
              <button 
                onClick={() => setViewingVideoBook(null)}
                className="text-slate-400 hover:text-white p-2 rounded-lg hover:bg-white/5"
              >
                ✕
              </button>
            </div>

            <div className="flex-1 overflow-y-auto space-y-2 pr-1">
              {(viewingVideoBook.videos || []).map((video: any, idx: number) => (
                <div key={idx} className="flex items-center justify-between p-3 rounded-xl bg-slate-800/60 border border-white/5 hover:border-white/10 transition-colors">
                  <div className="flex items-center gap-3 min-w-0">
                    <span className="w-6 text-center text-xs font-black text-slate-500">{video.order || idx + 1}</span>
                    <div className="min-w-0">
                      <p className="text-sm font-bold text-slate-200 truncate">{video.title}</p>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span className="text-[11px] font-bold text-red-400 flex items-center gap-1">
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
                <div className="grid grid-cols-3 gap-2">
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
                    onClick={() => setFormData({ ...formData, resourceType: 'youtube' })}
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
                              <span className="font-mono text-[10px] text-slate-500 w-5">{vid.order || idx + 1}.</span>
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
                  placeholder={formData.resourceType === 'youtube' ? 'Örn: Eyüp B. TYT Matematik Kampı 2025' : 'Örn: 3D TYT Matematik Soru Bankası'}
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
                    <option value="10. Sınıf">10. Sınıf</option>
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
                  <input
                    type="text"
                    value={formData.resourceType === 'youtube' ? formData.channelTitle : formData.isbn}
                    onChange={(e) => {
                      if (formData.resourceType === 'youtube') {
                        setFormData({ ...formData, channelTitle: e.target.value });
                      } else {
                        setFormData({ ...formData, isbn: e.target.value });
                      }
                    }}
                    className="w-full bg-black/20 border border-white/10 rounded-xl p-3 text-sm text-white outline-none focus:border-emerald-500/50"
                    placeholder={formData.resourceType === 'youtube' ? 'Kanal / Eğitmen' : 'ISBN No'}
                  />
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
    </div>
  );
}

