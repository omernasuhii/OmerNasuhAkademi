import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Plus, Edit2, Trash2, X, Tag, Save, Loader2, ArrowRight } from 'lucide-react';
import { eventService, EventCategory } from '../../services/eventService';
import { useNavigate } from 'react-router-dom';

export default function AdminEventCategories() {
  const navigate = useNavigate();
  const [categories, setCategories] = useState<EventCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<EventCategory | null>(null);
  
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [color, setColor] = useState('#3b82f6');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    loadCategories();
  }, []);

  const loadCategories = async () => {
    setLoading(true);
    const data = await eventService.getCategories();
    setCategories(data);
    setLoading(false);
  };

  const handleOpenModal = (category?: EventCategory) => {
    if (category) {
      setEditingCategory(category);
      setName(category.name);
      setDescription(category.description || '');
      setColor(category.color || '#3b82f6');
    } else {
      setEditingCategory(null);
      setName('');
      setDescription('');
      setColor('#3b82f6');
    }
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingCategory(null);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    setSubmitting(true);
    try {
      const data = { name, description, color };
      if (editingCategory?.id) {
        await eventService.updateCategory(editingCategory.id, data);
      } else {
        await eventService.createCategory(data);
      }
      await loadCategories();
      handleCloseModal();
    } catch (err) {
      console.error(err);
      alert('Kaydedilirken bir hata oluştu');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (window.confirm('Bu kategoriyi silmek istediğinize emin misiniz?')) {
      try {
        await eventService.deleteCategory(id);
        await loadCategories();
      } catch (err) {
        console.error(err);
        alert('Silinirken hata oluştu');
      }
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 pb-6 border-b border-white/5">
        <div>
          <h1 className="text-3xl md:text-5xl font-black tracking-tight text-white mb-2">
            Etkinlik Kategorileri
          </h1>
          <p className="text-slate-500 max-w-xl">
             Etkinliklerinizi gruplandırmak için kategoriler oluşturun ve yönetin.
          </p>
        </div>
        <button 
          onClick={() => handleOpenModal()}
          className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-3 px-6 rounded-2xl transition-all shadow-lg shadow-emerald-600/20 flex items-center justify-center gap-2"
        >
          <Plus size={20} /> Yeni Kategori Ekle
        </button>
      </div>

      {loading ? (
        <div className="flex justify-center py-20">
          <Loader2 className="animate-spin text-blue-500" size={32} />
        </div>
      ) : categories.length === 0 ? (
        <div className="bg-slate-900/50 border border-white/5 rounded-[32px] p-12 text-center">
           <div className="w-20 h-20 bg-slate-800 rounded-full flex items-center justify-center mx-auto mb-6">
              <Tag className="text-slate-500" size={32} />
           </div>
           <h3 className="text-xl font-bold text-white mb-2">Henüz Kategori Bulunmuyor</h3>
           <p className="text-slate-500 mb-6 max-w-md mx-auto">
             Etkinlikleri gruplandırmak için bir kategori oluşturun.
           </p>
           <button 
             onClick={() => handleOpenModal()}
             className="bg-white/5 hover:bg-white/10 text-white font-bold py-3 px-6 rounded-2xl transition-all border border-white/5"
           >
             Kategori Ekle
           </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {categories.map((category) => (
            <div 
              key={category.id} 
              onClick={() => navigate(`/panel/admin/etkinlikler/kategori/${category.id}`)}
              className="bg-slate-900/60 backdrop-blur-xl border border-white/5 rounded-3xl p-6 hover:bg-white/[0.04] hover:border-white/10 transition-all relative group cursor-pointer"
            >
              <div className="flex items-start justify-between mb-4">
                <div 
                  className="w-12 h-12 rounded-2xl flex items-center justify-center shadow-inner"
                  style={{ backgroundColor: `${category.color || '#3b82f6'}20`, color: category.color || '#3b82f6' }}
                >
                  <Tag size={24} />
                </div>
                <div className="flex items-center gap-1 opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity">
                  <button 
                    onClick={(e) => { e.stopPropagation(); handleOpenModal(category); }}
                    className="p-2 bg-white/5 hover:bg-white/10 text-slate-400 hover:text-blue-400 rounded-xl transition-colors"
                  >
                    <Edit2 size={16} />
                  </button>
                  <button 
                    onClick={(e) => { e.stopPropagation(); category.id && handleDelete(category.id); }}
                    className="p-2 bg-white/5 hover:bg-white/10 text-slate-400 hover:text-red-400 rounded-xl transition-colors"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
              <h3 className="text-xl font-bold text-white mb-2 group-hover:text-blue-400 transition-colors flex items-center justify-between">
                {category.name}
              </h3>
              <p className="text-slate-500 text-sm line-clamp-2">
                {category.description || 'Açıklama bulunmuyor.'}
              </p>
            </div>
          ))}
        </div>
      )}

      {/* Modal */}
      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-slate-950/80 backdrop-blur-md" 
              onClick={handleCloseModal}
            />
            
            <motion.div 
              initial={{ scale: 0.95, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 20 }}
              className="bg-slate-900 border border-white/10 w-full max-w-md sm:rounded-[32px] shadow-2xl relative z-10 overflow-hidden flex flex-col h-full sm:h-auto sm:max-h-[90vh]"
            >
              <div className="p-8 border-b border-white/5 flex items-center justify-between shrink-0">
                <div>
                  <h2 className="text-xl font-black text-white tracking-tight uppercase">
                    {editingCategory ? 'Kategoriyi Düzenle' : 'Yeni Kategori Ekle'}
                  </h2>
                </div>
                <button onClick={handleCloseModal} className="bg-slate-950 p-2 rounded-xl text-slate-500 hover:text-white transition-all border border-white/5">
                  <X size={20} />
                </button>
              </div>

              <div className="p-8 overflow-y-auto custom-scrollbar">
                <form id="categoryForm" onSubmit={handleSave} className="space-y-6">
                  <div>
                    <label className="block text-xs font-black uppercase tracking-widest text-slate-500 mb-2 px-1">Kategori Adı</label>
                    <input 
                      type="text"
                      required
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="w-full bg-slate-950/50 border border-white/10 rounded-2xl py-3 px-4 text-white font-medium outline-none focus:ring-2 focus:ring-blue-500/50 transition-all"
                      placeholder="Örn: Yazılım Eğitimleri"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-black uppercase tracking-widest text-slate-500 mb-2 px-1">Açıklama</label>
                    <textarea 
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      rows={3}
                      className="w-full bg-slate-950/50 border border-white/10 rounded-2xl py-3 px-4 text-white font-medium outline-none focus:ring-2 focus:ring-blue-500/50 transition-all resize-none"
                      placeholder="Kısa bir açıklama..."
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-black uppercase tracking-widest text-slate-500 mb-2 px-1">Renk</label>
                    <div className="flex items-center gap-4">
                      <input 
                        type="color"
                        value={color}
                        onChange={(e) => setColor(e.target.value)}
                        className="w-12 h-12 rounded-xl border border-white/10 bg-slate-950/50 cursor-pointer"
                      />
                      <input 
                        type="text"
                        value={color}
                        onChange={(e) => setColor(e.target.value)}
                        pattern="^#[0-9A-Fa-f]{6}$"
                        className="flex-1 bg-slate-950/50 border border-white/10 rounded-2xl py-3 px-4 text-white font-mono outline-none focus:ring-2 focus:ring-blue-500/50 transition-all uppercase"
                        placeholder="#3B82F6"
                      />
                    </div>
                  </div>
                </form>
              </div>

              <div className="p-8 border-t border-white/5 bg-slate-900/50 shrink-0">
                <button 
                  type="submit"
                  form="categoryForm"
                  disabled={submitting}
                  className="w-full bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white font-black py-4 rounded-2xl transition-all shadow-xl shadow-blue-600/30 flex items-center justify-center gap-3"
                >
                  {submitting ? <Loader2 className="animate-spin" size={20} /> : <Save size={20} />}
                  Kategoriyi Kaydet
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
