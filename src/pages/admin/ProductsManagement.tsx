import React, { useState, useEffect } from 'react';
import { Package, Plus, Pencil, Trash2, Tag, Image as ImageIcon } from 'lucide-react';
import { storeService, Product } from '../../services/storeService';

export default function ProductsManagement() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState<'list' | 'add' | 'edit'>('list');
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    price: 0,
    category: '',
    examType: '',
    difficulty: 5,
    subject: '',
    publicationType: '',
    publisher: '',
    bookstore: '',
    type: 'physical' as 'physical' | 'digital',
    stock: '',
    isActive: true,
    image: ''
  });

  const [customPublisher, setCustomPublisher] = useState('');
  const [customBookstore, setCustomBookstore] = useState('');

  const DEFAULT_PUBLISHERS = ['3D', 'ÜçDörtBeş', 'Bilgi Sarmal', 'Karekök', 'Limit', 'Orijinal', 'Apotemi', 'Hız ve Renk', 'Endemik', 'Çap', 'Diğer (Manuel Ekle)'];
  const uniquePublishers = Array.from(new Set([...DEFAULT_PUBLISHERS, ...products.map(p => p.publisher).filter(Boolean)]));

  const DEFAULT_BOOKSTORES = ['İşler', 'Beren', 'Başarı', 'Kariyer','Haluk', 'Işık', 'Anadolu', 'Kitapçım', 'Diğer (Manuel Ekle)'];
  const uniqueBookstores = Array.from(new Set([...DEFAULT_BOOKSTORES, ...products.map(p => p.bookstore).filter(Boolean)]));

  const SUBJECTS = ['Türkçe', 'Matematik', 'Geometri', 'Fizik', 'Kimya', 'Biyoloji', 'Tarih', 'Coğrafya', 'Felsefe', 'Din Kültürü', 'Edebiyat', 'İngilizce', 'Tümü'];
  const PUBLICATION_TYPES = ['Soru Bankası', 'Konu Anlatımı', 'Fasikül', 'Branş Denemesi', 'Genel Deneme', 'Çıkmış Sorular', 'Diğer'];

  useEffect(() => {
    loadProducts();
  }, []);

  const loadProducts = async () => {
    try {
      setLoading(true);
      const data = await storeService.getProducts('admin');
      setProducts(data);
    } catch (error) {
      console.error('Failed to load products', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const productData = {
        ...formData,
        publisher: formData.publisher === 'Diğer (Manuel Ekle)' ? customPublisher : formData.publisher,
        bookstore: formData.bookstore === 'Diğer (Manuel Ekle)' ? customBookstore : formData.bookstore,
        stock: formData.stock ? parseInt(formData.stock.toString()) : null
      };

      if (editingProduct?.id) {
        await storeService.updateProduct(editingProduct.id, productData);
      } else {
        await storeService.createProduct(productData);
      }
      setView('list');
      resetForm();
      loadProducts();
    } catch (error) {
      console.error('Error saving product', error);
    }
  };

  const handleDelete = async (id: string) => {
    if (window.confirm('Bu ürünü silmek istediğinize emin misiniz?')) {
      try {
        await storeService.deleteProduct(id);
        loadProducts();
      } catch (error) {
        console.error('Error deleting product', error);
      }
    }
  };

  const handleEdit = (product: Product) => {
    setEditingProduct(product);
    setFormData({
      title: product.title,
      description: product.description,
      price: product.price,
      category: product.category,
      examType: product.examType || '',
      difficulty: product.difficulty || 5,
      subject: product.subject || '',
      publicationType: product.publicationType || '',
      publisher: product.publisher || '',
      bookstore: product.bookstore || '',
      type: product.type,
      stock: product.stock?.toString() || '',
      isActive: product.isActive,
      image: product.image || ''
    });
    setView('edit');
  };

  const resetForm = () => {
    setEditingProduct(null);
    setFormData({
      title: '',
      description: '',
      price: 0,
      category: '',
      examType: '',
      difficulty: 5,
      subject: '',
      publicationType: '',
      publisher: '',
      bookstore: '',
      type: 'physical',
      stock: '',
      isActive: true,
      image: ''
    });
  };

  if (view === 'add' || view === 'edit') {
    return (
      <div className="p-6">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-bold text-white">
            {view === 'edit' ? 'Ürünü Düzenle' : 'Yeni Ürün Ekle'}
          </h2>
          <button 
            onClick={() => setView('list')}
            className="text-slate-400 hover:text-white transition"
          >
            Listeye Dön
          </button>
        </div>
        
        <form onSubmit={handleSubmit} className="bg-slate-800 rounded-xl p-6 border border-slate-700">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1">Ürün Adı</label>
              <input
                type="text"
                required
                value={formData.title}
                onChange={e => setFormData({...formData, title: e.target.value})}
                className="w-full bg-slate-900 border border-slate-700 rounded-lg py-2 px-3 text-white focus:outline-none focus:border-indigo-500"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1">Fiyat (₺)</label>
              <input
                type="number"
                min="0"
                required
                value={formData.price}
                onChange={e => setFormData({...formData, price: parseInt(e.target.value) || 0})}
                className="w-full bg-slate-900 border border-slate-700 rounded-lg py-2 px-3 text-white focus:outline-none focus:border-indigo-500"
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-slate-300 mb-1">Açıklama</label>
              <textarea
                required
                rows={3}
                value={formData.description}
                onChange={e => setFormData({...formData, description: e.target.value})}
                className="w-full bg-slate-900 border border-slate-700 rounded-lg py-2 px-3 text-white focus:outline-none focus:border-indigo-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1">Etiket (Örn: Editörün Seçimi, En Çok Çözülen)</label>
              <input
                type="text"
                required
                placeholder="Etiket adı"
                value={formData.category}
                onChange={e => setFormData({...formData, category: e.target.value})}
                className="w-full bg-slate-900 border border-slate-700 rounded-lg py-2 px-3 text-white focus:outline-none focus:border-indigo-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1">Sınav Tipi</label>
              <select
                value={formData.examType}
                onChange={e => setFormData({...formData, examType: e.target.value})}
                className="w-full bg-slate-900 border border-slate-700 rounded-lg py-2 px-3 text-white focus:outline-none focus:border-indigo-500"
              >
                <option value="">Seçiniz / Yok</option>
                <option value="TYT">TYT</option>
                <option value="AYT">AYT</option>
                <option value="YDT">YDT</option>
                <option value="TYT-AYT">TYT-AYT</option>
                <option value="LGS">LGS</option>
                <option value="KPSS">KPSS</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1">Zorluk Derecesi (1-10)</label>
              <input
                type="number"
                min="1"
                max="10"
                value={formData.difficulty}
                onChange={e => setFormData({...formData, difficulty: parseInt(e.target.value) || 5})}
                className="w-full bg-slate-900 border border-slate-700 rounded-lg py-2 px-3 text-white focus:outline-none focus:border-indigo-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1">Ders Adı</label>
              <select
                value={formData.subject}
                onChange={e => setFormData({...formData, subject: e.target.value})}
                className="w-full bg-slate-900 border border-slate-700 rounded-lg py-2 px-3 text-white focus:outline-none focus:border-indigo-500"
              >
                <option value="">Seçiniz</option>
                {SUBJECTS.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1">Yayın Tipi</label>
              <select
                value={formData.publicationType}
                onChange={e => setFormData({...formData, publicationType: e.target.value})}
                className="w-full bg-slate-900 border border-slate-700 rounded-lg py-2 px-3 text-white focus:outline-none focus:border-indigo-500"
              >
                <option value="">Seçiniz</option>
                {PUBLICATION_TYPES.map(pt => <option key={pt} value={pt}>{pt}</option>)}
              </select>
            </div>

            <div className="flex flex-col gap-2">
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1">Yayınevi</label>
                <select
                  value={formData.publisher}
                  onChange={e => {
                    setFormData({...formData, publisher: e.target.value});
                    if (e.target.value !== 'Diğer (Manuel Ekle)') {
                      setCustomPublisher('');
                    }
                  }}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg py-2 px-3 text-white focus:outline-none focus:border-indigo-500"
                >
                  <option value="">Seçiniz</option>
                  {uniquePublishers.map((p, i) => <option key={i} value={p}>{p}</option>)}
                </select>
              </div>
              {formData.publisher === 'Diğer (Manuel Ekle)' && (
                <input
                  type="text"
                  placeholder="Yayınevi adı giriniz..."
                  value={customPublisher}
                  onChange={e => setCustomPublisher(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg py-2 px-3 text-white focus:outline-none focus:border-indigo-500 mt-1"
                />
              )}
            </div>

            <div className="flex flex-col gap-2">
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1">Kitapevi</label>
                <select
                  value={formData.bookstore}
                  onChange={e => {
                    setFormData({...formData, bookstore: e.target.value});
                    if (e.target.value !== 'Diğer (Manuel Ekle)') {
                      setCustomBookstore('');
                    }
                  }}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg py-2 px-3 text-white focus:outline-none focus:border-indigo-500"
                >
                  <option value="">Seçiniz / Yok</option>
                  {uniqueBookstores.map((b, i) => <option key={i} value={b}>{b}</option>)}
                </select>
              </div>
              {formData.bookstore === 'Diğer (Manuel Ekle)' && (
                <input
                  type="text"
                  placeholder="Kitapevi adı giriniz..."
                  value={customBookstore}
                  onChange={e => setCustomBookstore(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg py-2 px-3 text-white focus:outline-none focus:border-indigo-500 mt-1"
                />
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1">Tip</label>
              <select
                value={formData.type}
                onChange={e => setFormData({...formData, type: e.target.value as any})}
                className="w-full bg-slate-900 border border-slate-700 rounded-lg py-2 px-3 text-white focus:outline-none focus:border-indigo-500"
              >
                <option value="physical">Fiziksel Ürün</option>
                <option value="digital">Dijital İçerik</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1">Stok (Opsiyonel)</label>
              <input
                type="number"
                min="0"
                placeholder="Sınırsız ise boş bırakın"
                value={formData.stock}
                onChange={e => setFormData({...formData, stock: e.target.value})}
                className="w-full bg-slate-900 border border-slate-700 rounded-lg py-2 px-3 text-white focus:outline-none focus:border-indigo-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1">Resim URL (Opsiyonel)</label>
              <input
                type="url"
                placeholder="https://..."
                value={formData.image}
                onChange={e => setFormData({...formData, image: e.target.value})}
                className="w-full bg-slate-900 border border-slate-700 rounded-lg py-2 px-3 text-white focus:outline-none focus:border-indigo-500"
              />
            </div>

            <div className="md:col-span-2">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.isActive}
                  onChange={e => setFormData({...formData, isActive: e.target.checked})}
                  className="w-4 h-4 text-indigo-600 bg-slate-900 border-slate-700 rounded focus:ring-indigo-500"
                />
                <span className="text-sm font-medium text-slate-300">Bu ürün satışa açık</span>
              </label>
            </div>
          </div>

          <div className="mt-8 flex justify-end gap-3 pt-6 border-t border-slate-700">
            <button
              type="button"
              onClick={() => setView('list')}
              className="px-4 py-2 text-slate-300 hover:text-white transition bg-slate-800 hover:bg-slate-700 rounded-lg flex items-center justify-center"
            >
              İptal
            </button>
            <button
              type="submit"
              className="px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition"
            >
              {view === 'edit' ? 'Güncelle' : 'Ekle'}
            </button>
          </div>
        </form>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            <Package className="w-6 h-6 text-indigo-400" />
            Mağaza ve Ürün Yönetimi
          </h1>
          <p className="text-slate-400 mt-1">Öğrencilerin mağazada göreceği ürünleri yönetin.</p>
        </div>
        <button
          onClick={() => { resetForm(); setView('add'); }}
          className="flex items-center gap-2 bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 transition"
        >
          <Plus className="w-4 h-4" />
          Yeni Ürün Ekle
        </button>
      </div>

      {loading ? (
        <div className="flex justify-center p-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
        </div>
      ) : (
        <div className="bg-slate-800 rounded-xl border border-slate-700 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-900/50 border-b border-slate-700 text-slate-300 text-sm">
                  <th className="p-4 font-medium">Görsel</th>
                  <th className="p-4 font-medium">Ürün Adı</th>
                  <th className="p-4 font-medium">Fiyat</th>
                  <th className="p-4 font-medium">Kategori</th>
                  <th className="p-4 font-medium">Stok</th>
                  <th className="p-4 font-medium">Durum</th>
                  <th className="p-4 font-medium">İşlemler</th>
                </tr>
              </thead>
              <tbody>
                {products.map(product => (
                  <tr key={product.id} className="border-b border-slate-700/50 hover:bg-slate-700/20 transition group">
                    <td className="p-4">
                      {product.image ? (
                        <img src={product.image} alt={product.title} className="w-16 h-16 object-cover rounded-lg" />
                      ) : (
                        <div className="w-16 h-16 bg-slate-700 rounded-lg flex items-center justify-center">
                          <ImageIcon className="w-8 h-8 text-slate-500" />
                        </div>
                      )}
                    </td>
                    <td className="p-4">
                      <h3 className="font-medium text-white">{product.title}</h3>
                      <p className="text-sm text-slate-400 line-clamp-1">{product.description}</p>
                    </td>
                    <td className="p-4">
                      <span className="font-semibold text-emerald-400">{product.price} ₺</span>
                    </td>
                    <td className="p-4">
                      <span className="inline-block bg-slate-800 border border-slate-600 text-slate-300 px-2 py-1 rounded-full text-xs">
                        {product.category}
                      </span>
                    </td>
                    <td className="p-4">
                      {product.stock !== undefined && product.stock !== null ? (
                        <span className="text-slate-300">{product.stock} adet</span>
                      ) : (
                        <span className="text-slate-500 italic">Sınırsız</span>
                      )}
                    </td>
                    <td className="p-4">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${product.isActive ? 'bg-green-500/10 text-green-400 border border-green-500/20' : 'bg-red-500/10 text-red-400 border border-red-500/20'}`}>
                        {product.isActive ? 'Aktif' : 'Pasif'}
                      </span>
                    </td>
                    <td className="p-4">
                      <div className="flex items-center gap-2">
                        <button 
                          onClick={() => handleEdit(product)}
                          className="p-2 text-slate-400 hover:text-indigo-400 hover:bg-indigo-500/10 rounded-lg transition"
                          title="Düzenle"
                        >
                          <Pencil className="w-4 h-4" />
                        </button>
                        <button 
                          onClick={() => product.id && handleDelete(product.id)}
                          className="p-2 text-slate-400 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition"
                          title="Sil"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
                {products.length === 0 && (
                  <tr>
                    <td colSpan={7} className="text-center py-12 text-slate-400">
                      Henüz hiç ürün eklenmemiş.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
