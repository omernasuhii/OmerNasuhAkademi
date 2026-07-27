import React, { useState, useEffect } from 'react';
import { BookOpen, Plus, Search, Edit2, Trash2, Filter } from 'lucide-react';
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

  const [formData, setFormData] = useState({
    name: '',
    type: 'TYT',
    subject: 'Türkçe',
    resourceType: 'soru',
    isbn: '',
    order: ''
  });

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
    if (book) {
      setEditingBook(book);
      setFormData({
        name: book.name || '',
        type: book.type || 'TYT',
        subject: book.subject || 'Türkçe',
        resourceType: book.resourceType || 'soru',
        isbn: book.isbn || '',
        order: book.order || ''
      });
    } else {
      setEditingBook(null);
      setFormData({
        name: '',
        type: 'TYT',
        subject: 'Türkçe',
        resourceType: 'soru',
        isbn: '',
        order: ''
      });
    }
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingBook(null);
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
    const matchesSearch = book.name?.toLowerCase().includes(searchTerm.toLowerCase()) || book.isbn?.toLowerCase().includes(searchTerm.toLowerCase());
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
          <p className="text-slate-400 text-sm">Global kaynakları (Soru bankası, konu anlatımı, video) yönetin.</p>
        </div>
        <button
          onClick={() => handleOpenModal()}
          className="flex items-center gap-2 bg-emerald-500 hover:bg-emerald-600 text-white px-4 py-2 rounded-lg font-bold transition-colors"
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
            placeholder="Kaynak adı veya ISBN ara..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-slate-800 border border-white/10 rounded-lg pl-10 pr-4 py-2 text-sm text-white placeholder-slate-500 outline-none focus:border-emerald-500/50"
          />
        </div>
        <div className="flex items-center gap-2">
          <Filter size={20} className="text-slate-400" />
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="bg-slate-800 border border-white/10 rounded-lg px-3 py-2 text-sm text-white outline-none focus:border-emerald-500/50"
          >
            <option value="Hepsi">Tüm Türler</option>
            <option value="TYT">TYT</option>
            <option value="AYT">AYT</option>
            <option value="10. Sınıf">10. Sınıf</option>
          </select>
          <select
            value={subjectFilter}
            onChange={(e) => setSubjectFilter(e.target.value)}
            className="bg-slate-800 border border-white/10 rounded-lg px-3 py-2 text-sm text-white outline-none focus:border-emerald-500/50"
          >
            <option value="Hepsi">Tüm Dersler</option>
            {allSubjects.map((sub: any) => (
              <option key={sub} value={sub}>{sub}</option>
            ))}
          </select>
        </div>
      </div>

      <div className="bg-slate-800/50 rounded-xl border border-white/10 overflow-hidden">
        <div className="grid grid-cols-12 gap-4 p-4 text-xs font-bold text-slate-400 border-b border-white/10 uppercase tracking-wider">
          <div className="col-span-1 text-center">Sıra</div>
          <div className="col-span-5">Kaynak Adı</div>
          <div className="col-span-2">Ders & Tür</div>
          <div className="col-span-2">Materyal</div>
          <div className="col-span-2 text-right">İşlemler</div>
        </div>

        {loading ? (
          <div className="p-8 text-center text-slate-400">Yükleniyor...</div>
        ) : filteredBooks.length === 0 ? (
          <div className="p-8 text-center text-slate-400">Kaynak bulunamadı.</div>
        ) : (
          <div className="divide-y divide-white/5 max-h-[600px] overflow-y-auto">
            {filteredBooks.sort((a,b) => (a.order || 999) - (b.order || 999)).map((book: any, idx) => (
              <div key={book.id} className="grid grid-cols-12 gap-4 p-4 text-sm items-center hover:bg-white/5 transition-colors">
                <div className="col-span-1 text-center text-slate-400 font-bold">{book.order || '-'}</div>
                <div className="col-span-5 text-white font-medium break-words">
                  <div className="flex items-center gap-2">
                    <BookOpen size={16} className="text-emerald-400 shrink-0" />
                    <span>{book.name}</span>
                  </div>
                  {book.isbn && <div className="text-[10px] text-slate-500 mt-0.5 ml-6">ISBN: {book.isbn}</div>}
                </div>
                <div className="col-span-2">
                  <div className="text-white">{book.subject}</div>
                  <div className="text-[10px] text-emerald-400 font-bold">{book.type}</div>
                </div>
                <div className="col-span-2">
                  <span className={`px-2 py-1 rounded text-[10px] font-bold uppercase tracking-wider ${
                    book.resourceType === 'youtube' ? 'bg-red-500/20 text-red-400' :
                    book.resourceType === 'konu' ? 'bg-blue-500/20 text-blue-400' :
                    'bg-amber-500/20 text-amber-400'
                  }`}>
                    {book.resourceType === 'youtube' ? 'Video' : book.resourceType === 'konu' ? 'Konu Anlatımı' : 'Soru Bankası'}
                  </span>
                </div>
                <div className="col-span-2 flex items-center justify-end gap-2">
                  <button onClick={() => handleOpenModal(book)} className="p-2 text-slate-400 hover:text-white hover:bg-white/10 rounded-lg transition-colors">
                    <Edit2 size={16} />
                  </button>
                  <button onClick={() => handleDeleteBook(book.id)} className="p-2 text-red-400 hover:text-red-300 hover:bg-red-500/20 rounded-lg transition-colors">
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-white/10 sm:rounded-2xl p-6 w-full max-w-xl h-full sm:h-auto max-h-screen sm:max-h-[90vh] overflow-y-auto">
            <h2 className="text-xl font-black text-white mb-6 uppercase tracking-tight">
              {editingBook ? 'Kaynağı Düzenle' : 'Yeni Kaynak Ekle'}
            </h2>
            
            <form onSubmit={handleSaveBook} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Kaynak Adı</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full bg-black/20 border border-white/10 rounded-lg p-3 text-sm text-white outline-none focus:border-emerald-500/50"
                  placeholder="Örn: 3D TYT Matematik Soru Bankası"
                  required
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Sınav Türü</label>
                  <select
                    value={formData.type}
                    onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                    className="w-full bg-black/20 border border-white/10 rounded-lg p-3 text-sm text-white outline-none focus:border-emerald-500/50"
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
                    className="w-full bg-black/20 border border-white/10 rounded-lg p-3 text-sm text-white outline-none focus:border-emerald-500/50"
                  >
                    {allSubjects.map((sub: any) => (
                      <option key={sub} value={sub}>{sub}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                 <div className="col-span-1">
                  <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Materyal Tipi</label>
                  <select
                    value={formData.resourceType}
                    onChange={(e) => setFormData({ ...formData, resourceType: e.target.value })}
                    className="w-full bg-black/20 border border-white/10 rounded-lg p-3 text-sm text-white outline-none focus:border-emerald-500/50"
                  >
                    <option value="soru">Soru Bankası</option>
                    <option value="konu">Konu Anlatımı</option>
                    <option value="youtube">YouTube Video</option>
                  </select>
                </div>
                <div className="col-span-1">
                  <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Sıra (Opsiyonel)</label>
                  <input
                    type="number"
                    value={formData.order}
                    onChange={(e) => setFormData({ ...formData, order: e.target.value })}
                    className="w-full bg-black/20 border border-white/10 rounded-lg p-3 text-sm text-white outline-none focus:border-emerald-500/50"
                    placeholder="Sıralama"
                  />
                </div>
                <div className="col-span-1">
                  <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">ISBN</label>
                  <input
                    type="text"
                    value={formData.isbn}
                    onChange={(e) => setFormData({ ...formData, isbn: e.target.value })}
                    className="w-full bg-black/20 border border-white/10 rounded-lg p-3 text-sm text-white outline-none focus:border-emerald-500/50"
                    placeholder="Opsiyonel"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-6 border-t border-white/10">
                <button
                  type="button"
                  onClick={handleCloseModal}
                  className="px-6 py-2 text-sm font-bold text-slate-400 hover:text-white transition-colors"
                >
                  İptal
                </button>
                <button
                  type="submit"
                  className="px-6 py-2 bg-emerald-500 hover:bg-emerald-600 text-white text-sm font-bold rounded-lg transition-colors"
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
