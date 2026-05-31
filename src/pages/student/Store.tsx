import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { ShoppingBag, Star, Tag, AlertCircle, CheckCircle2, ChevronRight, ChevronLeft, Package, Image as ImageIcon, Filter, Minus, Plus, Gift, Info } from 'lucide-react';
import { storeService, Product, Purchase } from '../../services/storeService';
import { chocolateBankService, BankState } from '../../services/chocolateBankService';
import { studentDataService } from '../../services/studentDataService';
import { referralService } from '../../services/referralService';
import { useAuth } from '../../lib/AuthContext';
import { useCart } from '../../lib/CartContext';
import { programService } from '../../services/programService';
import { eventService } from '../../services/eventService';
import { motion, AnimatePresence } from 'motion/react';

export default function Store() {
  const { user, userData } = useAuth();
  const { addToCart } = useCart();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'store'>('store');

  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [productToBuy, setProductToBuy] = useState<Product | null>(null);
  const [purchasing, setPurchasing] = useState<string | null>(null);

  const [filters, setFilters] = useState({
    examType: '',
    difficulty: '',
    subject: '',
    publicationType: '',
    publisher: '',
    bookstore: ''
  });

  const uniqueExamTypes = Array.from(new Set(products.map(p => p.examType).filter(Boolean)));
  const uniqueSubjects = Array.from(new Set(products.map(p => p.subject).filter(Boolean)));
  const uniquePublicationTypes = Array.from(new Set(products.map(p => p.publicationType).filter(Boolean)));
  const uniquePublishers = Array.from(new Set(products.map(p => p.publisher).filter(Boolean)));
  const uniqueBookstores = Array.from(new Set(products.map(p => p.bookstore).filter(Boolean)));
  const uniqueDifficulties = Array.from(new Set(products.map(p => p.difficulty).filter(Boolean))).sort((a: any, b: any) => a - b);

  const filteredProducts = products.filter(p => {
    if (filters.examType && p.examType !== filters.examType) return false;
    if (filters.difficulty && p.difficulty?.toString() !== filters.difficulty) return false;
    if (filters.subject && p.subject !== filters.subject) return false;
    if (filters.publicationType && p.publicationType !== filters.publicationType) return false;
    if (filters.publisher && p.publisher !== filters.publisher) return false;
    if (filters.bookstore && p.bookstore !== filters.bookstore) return false;
    return true;
  });

  useEffect(() => {
    if (user?.uid) {
      loadData();
    }
  }, [user]);

  const loadData = async () => {
    if (!user?.uid) return;
    try {
      setLoading(true);
      setError(null);
      const productsData = await storeService.getProducts('student');
      setProducts(productsData);
    } catch (err) {
      setError('Veriler yüklenirken bir sorun oluştu.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleAddToCart = (product: Product) => {
    if (!product.id) return;
    addToCart({
      itemId: product.id,
      type: 'product',
      title: product.title,
      price: product.price,
      image: product.image,
      quantity: 1
    });
    setSuccessMessage(`"${product.title}" sepete eklendi.`);
    setTimeout(() => setSuccessMessage(null), 3000);
  };

  const executePurchase = async () => {
    if (!user?.uid || !productToBuy?.id) return;
    const targetProduct = productToBuy;
    setProductToBuy(null);
    try {
      setPurchasing(targetProduct.id);
      setError(null);

      const amount = targetProduct.price || 0;

      // 1. Öğrenci Cüzdan kontrolü
      const walletBalance = userData?.walletBalance || 0;
      if (walletBalance < amount) {
        throw new Error('Bakiyeniz yetersiz. Koçunuz üzerinden bakiye yükleyebilirsiniz.');
      }

      // 2. İşlem için Cüzdandan + Koçtan düşüm
      if (amount > 0) {
         const res = await studentDataService.addWalletTransaction(user!.uid, {
            type: 'WITHDRAWAL',
            amount: amount,
            description: `Ürün Satın Alma: ${targetProduct.title}`,
            items: [{
               title: targetProduct.title,
               quantity: 1,
               price: amount,
               type: 'product'
            }]
         });
         
         if (!res.success) {
           const errMsg = res.error || '';
           if (errMsg.includes('Koç bulunamadı') || errMsg.includes('paket güncellemesi') || errMsg.includes('koçun') || errMsg.includes('Sistem yetersiz')) {
             throw new Error('Sistemsel limitler sebebiyle işlem yapılamıyor. Lütfen (Koçunuzun bakiyesi yetersiz) durumu için koçunuzla iletişime geçin.');
           } else {
             throw new Error('İşlem gerçekleştirilemedi: ' + errMsg);
           }
         }
      }

      // 3. Siparişi oluştur
      await storeService.purchaseProduct(user.uid, targetProduct.id);
      
      setSuccessMessage('Satın alma işlemi başarıyla tamamlandı!');
      await loadData(); // refresh data
      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (err: any) {
      setError(err.message || 'Satın alma işlemi sırasında bir hata oluştu.');
      setTimeout(() => setError(null), 5000);
    } finally {
      setPurchasing(null);
    }
  };

  const handlePurchase = (product: Product) => {
    if (!user?.uid || !product.id) return;
    setProductToBuy(product);
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  return (
    <div className="p-6 w-full">
      {/* Header section */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            <ShoppingBag className="w-6 h-6 text-indigo-400" />
            Mağaza
          </h1>
          <p className="text-slate-400 mt-1">Ürünleri inceleyebilir ve satın alabilirsiniz.</p>
        </div>
      </div>

      {/* Notifications */}
      <AnimatePresence>
        {error && (
          <motion.div 
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="bg-red-500/10 border border-red-500/20 text-red-400 p-4 rounded-xl flex items-center gap-3 mb-6"
          >
            <AlertCircle className="w-5 h-5" />
            <p>{error}</p>
          </motion.div>
        )}
        {successMessage && (
          <motion.div 
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="bg-green-500/10 border border-green-500/20 text-green-400 p-4 rounded-xl flex items-center gap-3 mb-6"
          >
            <CheckCircle2 className="w-5 h-5" />
            <p>{successMessage}</p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main Content Area */}
      {activeTab === 'store' && selectedProduct ? (
        <div className="bg-slate-800 rounded-xl border border-slate-700 overflow-hidden">
          <div className="p-4 border-b border-slate-700">
            <button 
              onClick={() => setSelectedProduct(null)}
              className="text-slate-400 hover:text-white transition flex items-center gap-2"
            >
              <div className="rotate-180"><ChevronRight className="w-5 h-5" /></div>
              Mağazaya Dön
            </button>
          </div>
          <div className="p-6 md:p-8 flex flex-col md:flex-row gap-8">
            <div className="w-full md:w-1/3">
              {selectedProduct.image ? (
                <img src={selectedProduct.image} alt={selectedProduct.title} className="w-full rounded-xl object-cover" />
              ) : (
                <div className="w-full aspect-[3/4] bg-slate-700/50 rounded-xl flex items-center justify-center">
                  <ImageIcon className="w-16 h-16 text-slate-500" />
                </div>
              )}
            </div>
            <div className="w-full md:w-2/3">
              <div className="flex flex-wrap gap-2 mb-4">
                <span className="flex items-center gap-1 text-sm bg-slate-900 border border-slate-700 text-slate-300 px-3 py-1.5 rounded-lg">
                  <Tag className="w-4 h-4" /> {selectedProduct.category}
                </span>
                {selectedProduct.type === 'digital' && (
                  <span className="flex items-center gap-1 text-sm bg-indigo-500/20 text-indigo-400 px-3 py-1.5 rounded-lg">
                    Dijital İçerik
                  </span>
                )}
              </div>
              <h2 className="text-3xl font-bold text-white mb-2">{selectedProduct.title}</h2>
              <div className="flex items-end gap-3 mb-6">
                <span className="text-4xl font-bold text-indigo-400">
                  {selectedProduct.price} <span className="text-xl text-indigo-500/70">₺</span>
                </span>
                {selectedProduct.stock !== undefined && selectedProduct.stock !== null && (
                  <span className={`text-sm mb-1 ${selectedProduct.stock <= 0 ? 'text-red-400' : 'text-slate-400'}`}>
                    {selectedProduct.stock <= 0 ? 'Tükendi' : `Stokta ${selectedProduct.stock} adet kaldı`}
                  </span>
                )}
              </div>

              <div className="bg-slate-900/50 rounded-xl p-5 mb-8 border border-slate-700">
                <h3 className="text-white font-medium mb-4">Ürün Detayları</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {selectedProduct.examType && (
                    <div><span className="text-slate-500 text-sm block">Sınav Tipi</span><span className="text-slate-200">{selectedProduct.examType}</span></div>
                  )}
                  {selectedProduct.subject && (
                    <div><span className="text-slate-500 text-sm block">Ders Adı</span><span className="text-slate-200">{selectedProduct.subject}</span></div>
                  )}
                  {selectedProduct.difficulty && (
                    <div><span className="text-slate-500 text-sm block">Zorluk</span><span className="text-slate-200">{selectedProduct.difficulty} / 10</span></div>
                  )}
                  {selectedProduct.publicationType && (
                    <div><span className="text-slate-500 text-sm block">Yayın Tipi</span><span className="text-slate-200">{selectedProduct.publicationType}</span></div>
                  )}
                  {selectedProduct.publisher && (
                    <div><span className="text-slate-500 text-sm block">Yayınevi</span><span className="text-slate-200">{selectedProduct.publisher}</span></div>
                  )}
                  {selectedProduct.bookstore && (
                    <div><span className="text-slate-500 text-sm block">Kitapevi</span><span className="text-slate-200">{selectedProduct.bookstore}</span></div>
                  )}
                </div>
              </div>
              
              <div className="mb-8">
                <h3 className="text-white font-medium mb-2">Açıklama</h3>
                <p className="text-slate-400 leading-relaxed whitespace-pre-wrap">{selectedProduct.description}</p>
              </div>

              <button
                disabled={selectedProduct.stock !== undefined && selectedProduct.stock !== null && selectedProduct.stock <= 0}
                onClick={() => handleAddToCart(selectedProduct)}
                className={`w-full md:w-auto px-8 py-4 rounded-xl flex items-center justify-center gap-2 font-bold text-lg transition ${
                  (selectedProduct.stock !== undefined && selectedProduct.stock !== null && selectedProduct.stock <= 0)
                    ? 'bg-slate-700 text-slate-500 cursor-not-allowed'
                    : 'bg-indigo-600 hover:bg-indigo-500 text-white shadow-lg shadow-indigo-500/25'
                }`}
              >
                {(selectedProduct.stock !== undefined && selectedProduct.stock !== null && selectedProduct.stock <= 0) ? (
                  'Tükendi'
                ) : (
                  <>Sepete Ekle <ShoppingBag className="w-5 h-5 ml-2" /></>
                )}
              </button>
            </div>
          </div>
        </div>
      ) : activeTab === 'store' && (
        <>
          {products.length > 0 && (
            <div className="bg-slate-800 p-4 rounded-xl border border-slate-700 mb-6 flex flex-wrap gap-3 items-center">
              <div className="flex items-center gap-2 text-slate-400 mr-2">
                <Filter className="w-5 h-5" />
                <span className="font-medium text-sm">Filtrele:</span>
              </div>
              
              {uniqueExamTypes.length > 0 && (
                <div className="w-full sm:w-auto flex-1 min-w-[130px]">
                  <select 
                    value={filters.examType}
                    onChange={e => setFilters({...filters, examType: e.target.value})}
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg py-2 px-3 text-sm text-white focus:outline-none focus:border-indigo-500"
                  >
                    <option value="">Sınav (Tümü)</option>
                    {uniqueExamTypes.map(t => <option key={t as string} value={t as string}>{t as string}</option>)}
                  </select>
                </div>
              )}

              {uniqueSubjects.length > 0 && (
                <div className="w-full sm:w-auto flex-1 min-w-[130px]">
                  <select 
                    value={filters.subject}
                    onChange={e => setFilters({...filters, subject: e.target.value})}
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg py-2 px-3 text-sm text-white focus:outline-none focus:border-indigo-500"
                  >
                    <option value="">Ders (Tümü)</option>
                    {uniqueSubjects.map(s => <option key={s as string} value={s as string}>{s as string}</option>)}
                  </select>
                </div>
              )}

              {uniquePublicationTypes.length > 0 && (
                <div className="w-full sm:w-auto flex-1 min-w-[130px]">
                  <select 
                    value={filters.publicationType}
                    onChange={e => setFilters({...filters, publicationType: e.target.value})}
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg py-2 px-3 text-sm text-white focus:outline-none focus:border-indigo-500"
                  >
                    <option value="">Yayın Tipi (Tümü)</option>
                    {uniquePublicationTypes.map(pt => <option key={pt as string} value={pt as string}>{pt as string}</option>)}
                  </select>
                </div>
              )}

              {uniquePublishers.length > 0 && (
                <div className="w-full sm:w-auto flex-1 min-w-[130px]">
                  <select 
                    value={filters.publisher}
                    onChange={e => setFilters({...filters, publisher: e.target.value})}
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg py-2 px-3 text-sm text-white focus:outline-none focus:border-indigo-500"
                  >
                    <option value="">Yayınevi (Tümü)</option>
                    {uniquePublishers.map(p => <option key={p as string} value={p as string}>{p as string}</option>)}
                  </select>
                </div>
              )}

              {uniqueBookstores.length > 0 && (
                <div className="w-full sm:w-auto flex-1 min-w-[130px]">
                  <select 
                    value={filters.bookstore}
                    onChange={e => setFilters({...filters, bookstore: e.target.value})}
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg py-2 px-3 text-sm text-white focus:outline-none focus:border-indigo-500"
                  >
                    <option value="">Kitapevi (Tümü)</option>
                    {uniqueBookstores.map(b => <option key={b as string} value={b as string}>{b as string}</option>)}
                  </select>
                </div>
              )}
              
              {uniqueDifficulties.length > 0 && (
                <div className="w-full sm:w-auto flex-1 min-w-[130px]">
                  <select 
                    value={filters.difficulty}
                    onChange={e => setFilters({...filters, difficulty: e.target.value})}
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg py-2 px-3 text-sm text-white focus:outline-none focus:border-indigo-500"
                  >
                    <option value="">Zorluk (Tümü)</option>
                    {uniqueDifficulties.map(d => <option key={d as number} value={String(d)}>{d}/10</option>)}
                  </select>
                </div>
              )}

              {(filters.examType || filters.difficulty || filters.subject || filters.publicationType || filters.publisher || filters.bookstore) && (
                <button
                  onClick={() => setFilters({ examType: '', difficulty: '', subject: '', publicationType: '', publisher: '', bookstore: '' })}
                  className="text-xs text-indigo-400 hover:text-indigo-300 ml-2"
                >
                  Temizle
                </button>
              )}
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-6">
            {filteredProducts.map(product => {
            const isOutOfStock = product.stock !== undefined && product.stock !== null && product.stock <= 0;
            const canAfford = true;

            return (
              <div 
                key={product.id} 
                onClick={() => setSelectedProduct(product)}
                className="bg-slate-800 rounded-xl overflow-hidden border border-slate-700 hover:border-slate-500 transition flex flex-col items-start group cursor-pointer"
              >
                 {product.image ? (
                  <img src={product.image} alt={product.title} className="w-full h-48 object-cover group-hover:scale-105 transition duration-500" />
                ) : (
                  <div className="w-full h-48 bg-slate-700/50 flex items-center justify-center">
                    <ImageIcon className="w-12 h-12 text-slate-500" />
                  </div>
                )}
                
                <div className="p-5 flex-1 flex flex-col w-full">
                  <div className="flex flex-wrap gap-2 mb-3">
                    <span className="flex items-center gap-1 text-xs bg-slate-900 border border-slate-700 text-slate-300 px-2 py-1 rounded">
                      <Tag className="w-3 h-3" /> {product.category}
                    </span>
                    {product.type === 'digital' && (
                      <span className="flex items-center gap-1 text-xs bg-indigo-500/20 text-indigo-400 px-2 py-1 rounded">
                        Dijital İçerik
                      </span>
                    )}
                  </div>

                  <h3 className="text-lg font-semibold text-white mb-2">{product.title}</h3>
                  <p className="text-slate-400 text-sm mb-4 line-clamp-2" title={product.description}>
                    {product.description}
                  </p>

                  <div className="mt-auto">
                    <div className="flex items-end justify-between mb-4">
                      <span className="text-2xl font-bold text-indigo-400 flex items-center gap-1">
                        {product.price} <span className="text-sm text-indigo-500/70">₺</span>
                      </span>
                      {product.stock !== undefined && product.stock !== null && (
                        <span className={`text-xs ${isOutOfStock ? 'text-red-400' : 'text-slate-400'}`}>
                          {isOutOfStock ? 'Tükendi' : `Son ${product.stock} adet`}
                        </span>
                      )}
                    </div>

                    <button
                      disabled={isOutOfStock || purchasing === product.id}
                      onClick={(e) => { e.stopPropagation(); handleAddToCart(product); }}
                      className={`w-full py-2.5 rounded-lg flex items-center justify-center gap-2 font-medium transition ${
                        isOutOfStock 
                          ? 'bg-slate-700 text-slate-500 cursor-not-allowed'
                          : canAfford 
                            ? 'bg-indigo-600 hover:bg-indigo-700 text-white' 
                            : 'bg-slate-700 text-slate-400 hover:bg-slate-600'
                      }`}
                    >
                      {purchasing === product.id ? (
                        <div className="flex items-center gap-2">
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                          İşleniyor...
                        </div>
                      ) : isOutOfStock ? (
                        'Tükendi'
                      ) : canAfford ? (
                        <>Sepete Ekle <ShoppingBag className="w-4 h-4 ml-1" /></>
                      ) : (
                        'Yetersiz Puan'
                      )}
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
          {filteredProducts.length === 0 && (
            <div className="col-span-full py-16 text-center">
              <Package className="w-16 h-16 text-slate-600 mx-auto mb-4" />
              <h3 className="text-xl font-medium text-white mb-2">
                {products.length === 0 ? 'Mağaza Çok Yakında!' : 'Ürün Bulunamadı'}
              </h3>
              <p className="text-slate-400">
                {products.length === 0 
                  ? 'Kaliteli kitaplar, deneme setleri ve öğrenim materyalleri çok yakında burada olacak.'
                  : 'Filtrelere uygun ürün bulunamadı. Lütfen filtreleri değiştirerek tekrar deneyin.'}
              </p>
            </div>
          )}
        </div>
        </>
      )}

      {/* Purchase Confirmation Modal */}
      <AnimatePresence>
        {productToBuy && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-slate-900 border border-slate-700/50 rounded-2xl p-6 w-full max-w-md shadow-2xl relative"
            >
              <div className="flex flex-col items-center mb-6">
                <div className="w-16 h-16 bg-indigo-500/10 text-indigo-400 rounded-full flex justify-center items-center mb-4">
                  <ShoppingBag className="w-8 h-8" />
                </div>
                <h3 className="text-xl font-bold text-white text-center">Satın Almayı Onayla</h3>
              </div>
              <p className="text-slate-300 text-center text-lg mb-8 break-words">
                <span className="font-medium text-white block mb-2 text-xl">{productToBuy.title}</span><br />
                ürününü <span className="font-bold text-emerald-400 text-xl">{productToBuy.price} ₺</span> karşılığında satın almak istediğinize emin misiniz?
              </p>
              <div className="flex justify-end gap-3">
                <button
                  type="button"
                  disabled={purchasing === productToBuy.id}
                  onClick={() => setProductToBuy(null)}
                  className="px-5 py-3 bg-slate-800 text-slate-300 font-medium rounded-xl hover:bg-slate-700 hover:text-white transition"
                >
                  İptal
                </button>
                <button
                  type="button"
                  onClick={executePurchase}
                  disabled={purchasing === productToBuy.id}
                  className="px-6 py-3 bg-indigo-600 text-white font-medium rounded-xl hover:bg-indigo-500 transition shadow-lg shadow-indigo-600/20 disabled:opacity-50 flex items-center gap-2"
                >
                  {purchasing === productToBuy.id ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      İşleniyor...
                    </>
                  ) : (
                    'Satın Al'
                  )}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
}
