import React, { useState, useRef, useEffect } from 'react';
import { useAuth } from '../lib/AuthContext';
import { db } from '../lib/firebase';
import { doc, updateDoc } from 'firebase/firestore';
import { Camera, Save, User, UserCircle, Globe, Shield, Lock, Bell, Loader2, CheckCircle2, Copy } from 'lucide-react';

export default function CommunityProfile() {
  const { userData, user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [formData, setFormData] = useState({
    nickname: '',
    title: '',
    firstName: '',
    lastName: '',
    phone: '',
    isPrivate: false
  });

  useEffect(() => {
    if (userData) {
      setFormData({
        nickname: userData.nickname || userData.firstName || '',
        title: userData.title || '',
        firstName: userData.firstName || '',
        lastName: userData.lastName || '',
        phone: userData.phone || '',
        isPrivate: userData.isPrivate || false
      });
    }
  }, [userData]);

  if (!userData) return null;

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError(null);
    try {
      await updateDoc(doc(db, 'users', user!.uid), {
        nickname: formData.nickname,
        title: formData.title,
        firstName: formData.firstName,
        lastName: formData.lastName,
        phone: formData.phone,
        isPrivate: formData.isPrivate,
        updatedAt: new Date()
      });
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch (err) {
      console.error(err);
      setError("Profil güncellenirken bir hata oluştu.");
    }
    setSaving(false);
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 200 * 1024) {
      setError("Profil fotoğrafı çok büyük. (Maksimum 200KB)");
      return;
    }

    setLoading(true);
    setError(null);
    
    try {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = async () => {
        const base64 = reader.result as string;
        await updateDoc(doc(db, 'users', user!.uid), {
          photoURL: base64
        });
        setLoading(false);
      };
    } catch (err) {
      console.error(err);
      setError("Fotoğraf yüklenemedi.");
      setLoading(false);
    }
  };

  return (
    <div className="w-full max-w-5xl mx-auto px-4 py-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      
      {/* Profile Header (Banner & Avatar) */}
      <div className="bg-slate-900 rounded-3xl overflow-hidden border border-slate-800 shadow-2xl relative mb-8">
        <div className="h-48 bg-gradient-to-r from-blue-900 via-indigo-900 to-slate-900 relative">
          <div className="absolute top-4 right-4 bg-black/30 backdrop-blur-md px-3 py-1.5 rounded-full flex items-center gap-2 cursor-pointer hover:bg-black/50 transition-colors border border-white/10">
            <Camera size={14} className="text-white" />
            <span className="text-xs text-white font-medium">Kapak Fotoğrafı Ekle</span>
          </div>
        </div>
        
        <div className="px-8 pb-8 pt-0 relative flex flex-col md:flex-row items-center md:items-end gap-6 -mt-16">
          <div className="relative group">
            <div className="w-32 h-32 rounded-full overflow-hidden border-4 border-slate-900 bg-slate-800 flex items-center justify-center relative shadow-xl">
              {userData.photoURL ? (
                <img src={userData.photoURL} alt="Profile" className="w-full h-full object-cover" />
              ) : (
                <User size={48} className="text-slate-500" />
              )}
              {loading && (
                <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center">
                  <Loader2 size={24} className="text-blue-400 animate-spin" />
                </div>
              )}
            </div>
            <button 
              onClick={() => fileInputRef.current?.click()}
              className="absolute bottom-0 right-0 bg-blue-600 hover:bg-blue-500 text-white p-2 rounded-full shadow-lg border-2 border-slate-900 transition-all z-10"
            >
              <Camera size={16} />
            </button>
            <input type="file" ref={fileInputRef} onChange={handleFileChange} accept="image/*" className="hidden" />
          </div>

          <div className="flex-1 text-center md:text-left mb-2 md:mb-0">
            <h1 className="text-2xl font-bold text-white flex items-center justify-center md:justify-start gap-3">
              {formData.nickname || `${userData.firstName} ${userData.lastName}`}
              {userData.role === 'admin' && <span className="bg-indigo-500 text-[10px] px-2 py-0.5 rounded text-white font-bold uppercase tracking-wider">Admin</span>}
            </h1>
            <p className="text-slate-400 text-sm mt-1">0 Takipçiler • 0 Takip Edilen</p>
          </div>
        </div>

        {/* Action Tabs Mock */}
        <div className="flex items-center gap-6 px-8 border-t border-slate-800 overflow-x-auto scrollbar-hide py-3">
          <button className="text-sm font-semibold text-white border-b-2 border-blue-500 pb-3 -mb-3 whitespace-nowrap">Profil</button>
          <button className="text-sm font-medium text-slate-400 hover:text-slate-300 transition-colors whitespace-nowrap">Aboneliklerim</button>
          <button className="text-sm font-medium text-slate-400 hover:text-slate-300 transition-colors whitespace-nowrap">Siparişlerim</button>
          <button className="text-sm font-medium text-slate-400 hover:text-slate-300 transition-colors whitespace-nowrap">Etkinlikler</button>
          <button className="text-sm font-medium text-slate-400 hover:text-slate-300 transition-colors whitespace-nowrap">Programlarım</button>
        </div>
      </div>

      <div className="bg-slate-900/50 backdrop-blur-xl rounded-3xl border border-slate-800 p-8 shadow-xl">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 pb-6 border-b border-slate-800">
          <div>
            <h2 className="text-2xl font-bold text-white tracking-tight">Hesap Ayarları</h2>
            <p className="text-slate-400 text-sm mt-1">Kişisel bilgilerinizi aşağıda görüntüleyin ve düzenleyin.</p>
          </div>
          <div className="mt-4 md:mt-0 flex gap-3">
            <button className="bg-slate-800 hover:bg-slate-700 text-white px-5 py-2.5 rounded-lg text-sm font-semibold transition-colors border border-slate-700">İptal</button>
            <button 
              onClick={handleUpdate}
              disabled={saving}
              className="bg-blue-600 hover:bg-blue-500 text-white px-5 py-2.5 rounded-lg text-sm font-semibold transition-colors flex items-center gap-2 shadow-lg shadow-blue-500/20 disabled:opacity-50"
            >
              {saving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
              Bilgileri Güncelle
            </button>
          </div>
        </div>

        {success && (
          <div className="mb-6 p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-xl flex items-center gap-3 text-emerald-400">
            <CheckCircle2 size={20} />
            <p className="text-sm font-medium">Profiliniz başarıyla güncellendi.</p>
          </div>
        )}

        {error && (
          <div className="mb-6 p-4 bg-red-500/10 border border-red-500/20 rounded-xl flex items-center gap-3 text-red-400">
            <Loader2 size={20} className="animate-spin" />
            <p className="text-sm font-medium">{error}</p>
          </div>
        )}

        <div className="space-y-12">
          {/* Gösterilen Bilgiler */}
          <section>
            <div className="mb-6">
              <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                <Globe size={18} className="text-blue-400" />
                Topluluk Profiliniz
              </h3>
              <p className="text-slate-400 text-sm mt-1">Bu bilgiler, sitenin tüm üyeleri tarafından (forum, blog vb.) görülebilir.</p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
               <div className="space-y-5">
                 <div>
                   <label className="block text-sm font-medium text-slate-300 mb-2">Görünen Ad (Takma Ad) <span className="text-red-400">*</span></label>
                   <input 
                     type="text" 
                     value={formData.nickname}
                     onChange={(e) => setFormData({...formData, nickname: e.target.value})}
                     className="w-full bg-slate-950 border border-slate-700/50 rounded-xl px-4 py-3 text-white focus:border-blue-500 outline-none transition-colors"
                   />
                 </div>
                 <div>
                   <label className="block text-sm font-medium text-slate-300 mb-2">Başlık / Unvan</label>
                   <input 
                     type="text" 
                     value={formData.title}
                     onChange={(e) => setFormData({...formData, title: e.target.value})}
                     className="w-full bg-slate-950 border border-slate-700/50 rounded-xl px-4 py-3 text-white focus:border-blue-500 outline-none transition-colors"
                     placeholder="Örn. YKS Adayı"
                   />
                 </div>
               </div>
               
               <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">Profil Resmi (Topluluk)</label>
                  <div className="flex items-center gap-4">
                    <div className="w-16 h-16 rounded-full overflow-hidden bg-slate-800 border border-slate-700 flex-shrink-0">
                      {userData.photoURL ? (
                        <img src={userData.photoURL} alt="Profile" className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <User size={24} className="text-slate-500" />
                        </div>
                      )}
                    </div>
                    <button 
                      onClick={() => fileInputRef.current?.click()}
                      className="px-4 py-2 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-lg text-sm font-medium text-white transition-colors"
                    >
                      Değiştir
                    </button>
                  </div>
               </div>
            </div>
          </section>

          <hr className="border-slate-800" />

          {/* Kişisel Bilgiler */}
          <section>
            <div className="mb-6">
              <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                <UserCircle size={18} className="text-indigo-400" />
                Resmi Kişisel Bilgiler
              </h3>
              <p className="text-slate-400 text-sm mt-1">Bu bilgiler sistem yöneticileri ve koçlarınız tarafından görülür.</p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2 flex items-center gap-2">Ad <Lock size={12} className="text-slate-500" /></label>
                <input 
                  type="text" 
                  value={formData.firstName}
                  onChange={(e) => setFormData({...formData, firstName: e.target.value})}
                  className="w-full bg-slate-950 border border-slate-700/50 rounded-xl px-4 py-3 text-white focus:border-blue-500 outline-none transition-colors"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2 flex items-center gap-2">Soyad <Lock size={12} className="text-slate-500" /></label>
                <input 
                  type="text" 
                  value={formData.lastName}
                  onChange={(e) => setFormData({...formData, lastName: e.target.value})}
                  className="w-full bg-slate-950 border border-slate-700/50 rounded-xl px-4 py-3 text-white focus:border-blue-500 outline-none transition-colors"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2 flex items-center gap-2">Telefon <Lock size={12} className="text-slate-500" /></label>
                <input 
                  type="tel" 
                  value={formData.phone}
                  onChange={(e) => setFormData({...formData, phone: e.target.value})}
                  className="w-full bg-slate-950 border border-slate-700/50 rounded-xl px-4 py-3 text-white focus:border-blue-500 outline-none transition-colors"
                  placeholder="5XX XXX XX XX"
                />
              </div>
            </div>
          </section>

          <hr className="border-slate-800" />

          {/* Giriş Bilgileri */}
          <section>
            <div className="mb-6">
              <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                <Shield size={18} className="text-emerald-400" />
                Giriş Bilgileri
              </h3>
              <p className="text-slate-400 text-sm mt-1">Giriş e-postanızı ve şifrenizi görüntüleyin ve güncelleyin.</p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div>
                <p className="text-sm font-medium text-slate-300 mb-1">Giriş e-postası:</p>
                <p className="text-white font-medium">{userData.email}</p>
                <p className="text-xs text-slate-500 mt-1">E-posta adresinizi değiştirmek için sistem yöneticisine başvurun.</p>
              </div>
              <div>
                <p className="text-sm font-medium text-slate-300 mb-1">Şifre:</p>
                <p className="text-white font-medium tracking-widest">••••••••</p>
                <p className="text-xs text-slate-500 mt-1 mb-2">Hesap güvenliğiniz için şifrelerinizi düzenli olarak değiştirin.</p>
                <button className="text-blue-400 text-sm font-medium hover:text-blue-300 underline">Şifremi Sıfırla</button>
              </div>
            </div>
          </section>

          <hr className="border-slate-800" />

          {/* Görünürlük ve Gizlilik */}
          <section>
            <div className="mb-6">
              <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                <Bell size={18} className="text-orange-400" />
                Görünürlük ve Gizlilik
              </h3>
              <p className="text-slate-400 text-sm mt-1">Kişisel bilgilerinizi kimlerin görebileceğini kontrol edin.</p>
            </div>
            
            <div className="space-y-6">
              <div className="flex flex-col md:flex-row md:items-center justify-between p-4 bg-slate-950 rounded-xl border border-slate-800">
                 <div>
                   <p className="text-white font-medium text-sm">Profil URL'si</p>
                   <p className="text-slate-500 text-xs mt-1">https://app.omernasuhakademi.com/topluluk/us/{user.uid.substring(0, 8)}</p>
                 </div>
                 <button className="mt-3 md:mt-0 px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-lg text-sm flex items-center justify-center gap-2 transition-colors">
                   <Copy size={14} /> Kopyala
                 </button>
              </div>

              <div className="flex flex-col md:flex-row md:items-center justify-between p-4 bg-slate-950 rounded-xl border border-slate-800">
                 <div>
                   <p className="text-white font-medium text-sm">Profil Gizliliği</p>
                   <p className="text-slate-500 text-xs mt-1">Profil sayfanızı ve hesabınızın sosyal özelliklerini gizleyin.</p>
                 </div>
                 <div className="mt-3 md:mt-0 flex items-center">
                   <label className="relative inline-flex items-center cursor-pointer">
                     <input 
                       type="checkbox" 
                       className="sr-only peer"
                       checked={formData.isPrivate}
                       onChange={(e) => setFormData({...formData, isPrivate: e.target.checked})}
                     />
                     <div className="w-11 h-6 bg-slate-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                     <span className="ml-3 text-sm font-medium text-slate-300">Gizli Profil</span>
                   </label>
                 </div>
              </div>
            </div>
          </section>

        </div>
      </div>
    </div>
  );
}
