import React, { useState, useRef, useEffect } from 'react';
import { useAuth } from '../lib/AuthContext';
import { auth, db } from '../lib/firebase';
import { sendPasswordResetEmail, RecaptchaVerifier, linkWithPhoneNumber } from 'firebase/auth';
import { doc, updateDoc, collection, query, where, getDocs } from 'firebase/firestore';
import { Camera, Save, User, UserCircle, Globe, Shield, Lock, Bell, Loader2, CheckCircle2, Copy, ChevronDown, Star, Package, Calendar, BookOpen, Gift, Info } from 'lucide-react';
import Wallet from './students/Wallet';
import { ResponsiveTabs } from '../components/ui/ResponsiveTabs';
import NotificationsList from '../components/notifications/NotificationsList';
import { studentDataService } from '../services/studentDataService';
import { storeService, Purchase } from '../services/storeService';
import AppointmentList from '../components/appointments/AppointmentList';
import { eventService, EventData, TicketOrder, EventRSVP } from '../services/eventService';
import { programService, Program, ProgramEnrollment } from '../services/programService';
import { isSubscriptionActive } from '../services/subscriptionService';

import { useLocation, useNavigate } from 'react-router-dom';

export default function CommunityProfile() {
  const { userData, user } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState(location.state?.activeTab || 'Profil');
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [userCoupons, setUserCoupons] = useState<any[]>([]);

  // Phone verification states
  const [phoneOtpSent, setPhoneOtpSent] = useState(false);
  const [phoneOtpCode, setPhoneOtpCode] = useState('');
  const [phoneSending, setPhoneSending] = useState(false);
  const [phoneError, setPhoneError] = useState<string | null>(null);
  const [phoneSuccess, setPhoneSuccess] = useState<string | null>(null);
  const [phoneVerificationResult, setPhoneVerificationResult] = useState<any>(null);
  const [phoneVerifiedState, setPhoneVerifiedState] = useState(false);

  useEffect(() => {
    if (location.state?.activeTab) {
      setActiveTab(location.state.activeTab);
    }
  }, [location.state]);

  useEffect(() => {
    if (user && activeTab === 'Ödüllerim') {
      import('firebase/firestore').then(async ({ collection, query, where, getDocs }) => {
        const { db } = await import('../lib/firebase');
        const q = query(collection(db, 'coupons'), where('ownerId', '==', user!.uid));
        const snap = await getDocs(q);
        setUserCoupons(snap.docs.map(d => ({ id: d.id, ...d.data() })));
      }).catch(err => {
        console.error("Kuponlar yüklenirken hata:", err);
      });
    }
  }, [user, activeTab]);
  const [showMoreTabs, setShowMoreTabs] = useState(false);
  const [purchases, setPurchases] = useState<Purchase[]>([]);
  const [ticketOrders, setTicketOrders] = useState<TicketOrder[]>([]);
  const [rsvps, setRsvps] = useState<EventRSVP[]>([]);
  const [events, setEvents] = useState<Record<string, EventData>>({});
  const [enrollments, setEnrollments] = useState<ProgramEnrollment[]>([]);
  const [programs, setPrograms] = useState<Record<string, Program>>({});
  const [walletTransactions, setWalletTransactions] = useState<any[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [formData, setFormData] = useState({
    nickname: '',
    title: '',
    firstName: '',
    lastName: '',
    phone: '',
    username: '',
    isPrivate: false
  });

  const [copied, setCopied] = useState(false);
  const [resetLoading, setResetLoading] = useState(false);
  const [resetSuccess, setResetSuccess] = useState(false);

  const handleCancel = () => {
    if (userData) {
      setFormData({
        nickname: userData.nickname || userData.firstName || '',
        title: userData.title || '',
        firstName: userData.firstName || '',
        lastName: userData.lastName || '',
        phone: userData.phone || '',
        username: userData.username || '',
        isPrivate: userData.isPrivate || false
      });
    }
  };

  const handlePasswordReset = async () => {
    if (!userData?.email) return;
    setResetLoading(true);
    setError(null);
    try {
      await sendPasswordResetEmail(auth, userData.email);
      setResetSuccess(true);
      setTimeout(() => setResetSuccess(false), 5000);
    } catch (err: any) {
      console.error(err);
      setError(err.message || "Şifre sıfırlama e-postası gönderilemedi.");
    } finally {
      setResetLoading(false);
    }
  };

  const handleCopyUrl = () => {
    const profileUrl = `https://omernasuhakademi.com/topluluk/us/${formData.username || user?.uid}`;
    navigator.clipboard.writeText(profileUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 3000);
  };

  const setupProfileRecaptcha = () => {
    if (!window.recaptchaVerifier) {
      window.recaptchaVerifier = new RecaptchaVerifier(auth, 'recaptcha-container-profile', {
        'size': 'invisible',
        'callback': () => {}
      });
    }
  };

  const handleSendProfileOTP = async () => {
    if (!formData.phone) {
      setPhoneError('Lütfen geçerli bir telefon numarası giriniz.');
      return;
    }
    
    setPhoneSending(true);
    setPhoneError(null);
    setPhoneSuccess(null);

    try {
      setupProfileRecaptcha();
      const appVerifier = window.recaptchaVerifier;
      const rawPhone = formData.phone.replace(/\D/g, ''); // Remove non-numeric
      if (rawPhone.length < 10) {
        setPhoneError('Telefon numarası en az 10 haneli olmalıdır.');
        setPhoneSending(false);
        return;
      }
      const formattedPhone = rawPhone.startsWith('90') ? `+${rawPhone}` : `+90${rawPhone.replace(/^0+/, '')}`;

      const confirmationResult = await linkWithPhoneNumber(user!, formattedPhone, appVerifier);
      setPhoneVerificationResult(confirmationResult);
      setPhoneOtpSent(true);
      setPhoneSuccess(`Doğrulama kodu ${formattedPhone} numaralı telefona gönderildi.`);
    } catch (err: any) {
      console.error(err);
      if (err.code === 'auth/credential-already-in-use') {
        setPhoneError('Bu telefon numarası başka bir hesaba zaten bağlanmış.');
      } else if (err.code === 'auth/invalid-phone-number') {
        setPhoneError('Geçersiz telefon numarası formatı. Lütfen numaranızı kontrol edin.');
      } else if (err.code === 'auth/too-many-requests') {
        setPhoneError('Çok fazla SMS gönderildi. Lütfen daha sonra tekrar deneyiniz.');
      } else {
        setPhoneError('SMS gönderilemedi. Lütfen daha sonra tekrar deneyiniz: ' + (err.message || ''));
      }
    } finally {
      setPhoneSending(false);
    }
  };

  const handleVerifyProfileOTP = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!phoneOtpCode || phoneOtpCode.length < 6) return;
    
    setPhoneSending(true);
    setPhoneError(null);
    
    try {
      await phoneVerificationResult.confirm(phoneOtpCode);
      setPhoneVerifiedState(true);
      setPhoneOtpSent(false);
      setPhoneSuccess('Telefon numaranız başarıyla doğrulandı!');
    } catch (err: any) {
      console.error(err);
      setPhoneError('Hatalı veya süresi dolmuş doğrulama kodu girdiniz.');
    } finally {
      setPhoneSending(false);
    }
  };

  useEffect(() => {
    if (userData) {
      setFormData({
        nickname: userData.nickname || userData.firstName || '',
        title: userData.title || '',
        firstName: userData.firstName || '',
        lastName: userData.lastName || '',
        phone: userData.phone || '',
        username: userData.username || '',
        isPrivate: userData.isPrivate || false
      });
    }
  }, [userData]);

  useEffect(() => {
    if (user?.uid) {
      storeService.getPurchases(user.uid).then(setPurchases).catch(console.error);
      studentDataService.getWalletTransactions(user.uid).then(setWalletTransactions).catch(console.error);
      
      const loadData = async () => {
        try {
          const [tickets, userRsvps, allEvents, userEnrollments, allPrograms] = await Promise.all([
            eventService.getStudentTicketOrders(user.uid),
            eventService.getStudentRSVPs(user.uid),
            eventService.getEvents('student'),
            programService.getStudentEnrollments(user.uid),
            programService.getPrograms('student')
          ]);
          setTicketOrders(tickets);
          setRsvps(userRsvps);
          setEnrollments(userEnrollments);
          
          const eventMap = allEvents.reduce((acc, ev) => {
            if (ev.id) acc[ev.id] = ev;
            return acc;
          }, {} as Record<string, EventData>);
          setEvents(eventMap);
          
          const progMap = allPrograms.reduce((acc, prog) => {
            if (prog.id) acc[prog.id] = prog;
            return acc;
          }, {} as Record<string, Program>);
          setPrograms(progMap);
          
        } catch (e) {
          console.error("Bilgiler yüklenemedi:", e);
        }
      };
      
      loadData();
    }
  }, [user]);

  if (!userData) return null;

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError(null);
    try {
      const rawCurrentPhone = (userData.phone || '').replace(/\D/g, '');
      const rawNewPhone = formData.phone.replace(/\D/g, '');
      
      let cleanUsername = formData.username.trim().toLowerCase().replace(/[^a-z0-9_.-]/g, '');
      if (cleanUsername && cleanUsername !== (userData.username || '')) {
        if (cleanUsername.length < 3) {
          setError("Kullanıcı adı en az 3 karakter olmalıdır.");
          setSaving(false);
          return;
        }
        if (cleanUsername.length > 25) {
          setError("Kullanıcı adı en fazla 25 karakter olmalıdır.");
          setSaving(false);
          return;
        }
        const qUsername = query(collection(db, 'users'), where('username', '==', cleanUsername));
        const querySnapshot = await getDocs(qUsername);
        if (!querySnapshot.empty) {
          setError("Bu kullanıcı adı başka bir üye tarafından kullanılmaktadır. Lütfen farklı bir kullanıcı adı seçin.");
          setSaving(false);
          return;
        }
      }

      const updateData: any = {
        nickname: formData.nickname,
        title: formData.title,
        firstName: formData.firstName,
        lastName: formData.lastName,
        phone: formData.phone,
        phoneVerified: true,
        username: cleanUsername,
        isPrivate: formData.isPrivate,
        updatedAt: new Date()
      };

      await updateDoc(doc(db, 'users', user!.uid), updateData);
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

    setLoading(true);
    setError(null);
    
    try {
      let finalBase64 = "";

      if (file.size > 200 * 1024) {
        // Otomatik küçültme
        finalBase64 = await new Promise<string>((resolve, reject) => {
          const reader = new FileReader();
          reader.readAsDataURL(file);
          reader.onload = (event) => {
            const img = new Image();
            img.src = event.target?.result as string;
            img.onload = () => {
              let width = img.width;
              let height = img.height;
              const maxDimension = 500; // Profil için yeterli

              if (width > maxDimension || height > maxDimension) {
                if (width > height) {
                  height = Math.round((height * maxDimension) / width);
                  width = maxDimension;
                } else {
                  width = Math.round((width * maxDimension) / height);
                  height = maxDimension;
                }
              }

              const canvas = document.createElement('canvas');
              canvas.width = width;
              canvas.height = height;
              const ctx = canvas.getContext('2d');
              if (!ctx) return reject("Canvas ctx error");
              
              ctx.drawImage(img, 0, 0, width, height);
              
              let quality = 0.9;
              let dataUrl = canvas.toDataURL('image/jpeg', quality);
              
              const getB64Size = (b64: string) => b64.length * (3/4) - (b64.indexOf('=') > 0 ? (b64.length - b64.indexOf('=')) : 0);

              while (getB64Size(dataUrl) > 200 * 1024 && quality > 0.1) {
                quality -= 0.1;
                dataUrl = canvas.toDataURL('image/jpeg', quality);
              }
              resolve(dataUrl);
            };
            img.onerror = (err) => reject(err);
          };
          reader.onerror = (err) => reject(err);
        });
      } else {
        finalBase64 = await new Promise<string>((resolve, reject) => {
          const reader = new FileReader();
          reader.readAsDataURL(file);
          reader.onload = () => resolve(reader.result as string);
          reader.onerror = (err) => reject(err);
        });
      }

      await updateDoc(doc(db, 'users', user!.uid), {
        photoURL: finalBase64
      });
      setLoading(false);
    } catch (err) {
      console.error(err);
      setError("Fotoğraf yüklenemedi veya küçültülemedi.");
      setLoading(false);
    }
  };

  return (
    <div className="w-full max-w-5xl mx-auto px-4 py-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      
      {/* Profile Header (Banner & Avatar) */}
      <div className="bg-slate-900 rounded-3xl border border-slate-800 shadow-2xl relative mb-8">
        <div className="h-48 rounded-t-3xl overflow-hidden bg-gradient-to-r from-blue-900 via-indigo-900 to-slate-900 relative">
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
          </div>
        </div>

        <div className="px-8 border-t border-slate-800 py-3 relative z-30">
          <ResponsiveTabs 
            tabs={userData?.role === 'student' 
              ? ['Profil', 'Aboneliklerim', 'Siparişlerim', 'Randevularım', 'Etkinlikler', 'Programlarım', 'Ödüllerim', 'Cüzdanım', 'Bildirimler']
              : ['Profil', 'Bildirimler']
            }
            activeTab={activeTab}
            onChange={setActiveTab}
          />
        </div>
      </div>

      {activeTab === 'Profil' && (
        <div className="bg-slate-900/50 backdrop-blur-xl rounded-3xl border border-slate-800 p-8 shadow-xl">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 pb-6 border-b border-slate-800">
            <div>
            <h2 className="text-2xl font-bold text-white tracking-tight">Hesap Ayarları</h2>
            <p className="text-slate-400 text-sm mt-1">Kişisel bilgilerinizi aşağıda görüntüleyin ve düzenleyin.</p>
          </div>
          <div className="mt-4 md:mt-0 flex gap-3">
            <button 
              onClick={handleCancel}
              className="bg-slate-800 hover:bg-slate-700 text-white px-5 py-2.5 rounded-lg text-sm font-semibold transition-colors border border-slate-700"
            >
              İptal
            </button>
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

        {resetSuccess && (
          <div className="mb-6 p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-xl flex items-center gap-3 text-emerald-400">
            <CheckCircle2 size={20} />
            <p className="text-sm font-medium">Şifre sıfırlama e-postası başarıyla gönderildi ({userData.email}).</p>
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
                    <label className="block text-sm font-medium text-slate-300 mb-2">Benzersiz Kullanıcı Adı <span className="text-red-400">*</span></label>
                    <div className="relative flex items-center">
                      <span className="absolute left-4 text-slate-500 text-sm select-none font-bold">@</span>
                      <input 
                        type="text" 
                        value={formData.username}
                        onChange={(e) => {
                          const val = e.target.value.toLowerCase().replace(/[^a-z0-9_.-]/g, '');
                          setFormData({...formData, username: val});
                        }}
                        placeholder="kullanici_adi"
                        className="w-full bg-slate-950 border border-slate-700/50 rounded-xl pl-9 pr-4 py-3 text-white focus:border-blue-500 outline-none transition-colors"
                      />
                    </div>
                    <p className="text-slate-500 text-[11px] mt-1 mb-3">Sadece küçük harfler, sayılar, alt çizgi (_), tire (-) ve nokta (.) içerebilir.</p>
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
                <label className="block text-sm font-medium text-slate-300 mb-2 flex items-center justify-between">
                  <span className="flex items-center gap-2">Telefon <Lock size={12} className="text-slate-500" /></span>
                  {(() => {
                    const isChanged = formData.phone.replace(/\D/g, '') !== (userData?.phone || '').replace(/\D/g, '');
                    if (!isChanged) {
                      return userData?.phoneVerified ? (
                        <span className="text-xs text-emerald-400 font-semibold flex items-center gap-1">
                          <CheckCircle2 size={12} /> Doğrulanmış
                        </span>
                      ) : (
                        <span className="text-xs text-amber-400 font-semibold flex items-center gap-1">
                          ⚠️ Doğrulanmamış
                        </span>
                      );
                    } else {
                      return phoneVerifiedState ? (
                        <span className="text-xs text-emerald-400 font-semibold flex items-center gap-1">
                          <CheckCircle2 size={12} /> Yeni Numara Doğrulandı
                        </span>
                      ) : (
                        <span className="text-xs text-amber-400 font-semibold flex items-center gap-1">
                          ⚠️ Doğrulama Bekliyor
                        </span>
                      );
                    }
                  })()}
                </label>
                <div className="relative">
                  <input 
                    type="tel" 
                    value={formData.phone}
                    onChange={(e) => {
                      setFormData({...formData, phone: e.target.value});
                      if (e.target.value.replace(/\D/g, '') === (userData?.phone || '').replace(/\D/g, '')) {
                        setPhoneVerifiedState(false);
                      }
                    }}
                    disabled={phoneOtpSent}
                    className="w-full bg-slate-950 border border-slate-700/50 rounded-xl px-4 py-3 text-white focus:border-blue-500 outline-none transition-colors disabled:opacity-60"
                    placeholder="5XX XXX XX XX"
                  />
                </div>

                {/* Verification UI */}
                {(() => {
                  const isChanged = formData.phone.replace(/\D/g, '') !== (userData?.phone || '').replace(/\D/g, '');
                  if (isChanged && !phoneVerifiedState) {
                    return (
                      <div className="mt-3 p-4 bg-slate-900/50 border border-amber-500/20 rounded-xl space-y-3">
                        <p className="text-xs text-slate-400">
                          Telefon numaranızı değiştirdiniz. Profilinizi kaydedebilmek için lütfen yeni numaranızı doğrulayın.
                        </p>
                        
                        {phoneError && (
                          <p className="text-xs text-red-400 font-medium">{phoneError}</p>
                        )}
                        {phoneSuccess && (
                          <p className="text-xs text-emerald-400 font-medium">{phoneSuccess}</p>
                        )}

                        <div id="recaptcha-container-profile" className="hidden"></div>

                        {!phoneOtpSent ? (
                          <button
                            type="button"
                            onClick={handleSendProfileOTP}
                            disabled={phoneSending}
                            className="w-full px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-xs font-semibold flex items-center justify-center gap-2 transition-colors disabled:opacity-50"
                          >
                            {phoneSending && <Loader2 size={12} className="animate-spin" />}
                            <span>Kodu Gönder (SMS)</span>
                          </button>
                        ) : (
                          <div className="space-y-3">
                            <input
                              type="text"
                              value={phoneOtpCode}
                              onChange={(e) => setPhoneOtpCode(e.target.value.replace(/\D/g, ''))}
                              maxLength={6}
                              placeholder="6 Haneli Doğrulama Kodu"
                              className="w-full bg-slate-950 border border-slate-700/50 rounded-lg px-3 py-2 text-white text-center text-sm tracking-widest outline-none focus:border-blue-500"
                            />
                            <div className="flex gap-2">
                              <button
                                type="button"
                                onClick={() => setPhoneOtpSent(false)}
                                className="flex-1 px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-xs font-medium transition-colors"
                              >
                                Vazgeç
                              </button>
                              <button
                                type="button"
                                onClick={handleVerifyProfileOTP}
                                disabled={phoneSending || phoneOtpCode.length < 6}
                                className="flex-1 px-3 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-semibold flex items-center justify-center gap-1 transition-colors disabled:opacity-50"
                              >
                                {phoneSending && <Loader2 size={12} className="animate-spin" />}
                                <span>Kodu Doğrula</span>
                              </button>
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  }
                  return null;
                })()}
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
                <button 
                  type="button"
                  onClick={handlePasswordReset}
                  disabled={resetLoading}
                  className="text-blue-400 text-sm font-medium hover:text-blue-300 underline disabled:opacity-50 flex items-center gap-1"
                >
                  {resetLoading && <Loader2 size={12} className="animate-spin" />}
                  <span>{resetLoading ? 'Gönderiliyor...' : 'Şifremi Sıfırla'}</span>
                </button>
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
                   <p className="text-slate-500 text-xs mt-1">https://omernasuhakademi.com/topluluk/us/{formData.username || user.uid}</p>
                 </div>
                 <button 
                   onClick={handleCopyUrl}
                   className="mt-3 md:mt-0 px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-lg text-sm flex items-center justify-center gap-2 transition-colors min-w-[120px]"
                 >
                   {copied ? (
                     <>
                       <CheckCircle2 size={14} className="text-emerald-400" /> Kopyalandı!
                     </>
                   ) : (
                     <>
                       <Copy size={14} /> Kopyala
                     </>
                   )}
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
      )}

      {activeTab === 'Cüzdanım' && (
        <Wallet />
      )}

      {activeTab === 'Bildirimler' && (
        <NotificationsList />
      )}

      {activeTab === 'Aboneliklerim' && (
        <div className="bg-slate-900/50 backdrop-blur-xl rounded-3xl border border-slate-800 p-8 shadow-xl space-y-6">
           <h2 className="text-2xl font-bold text-white tracking-tight mb-6">Aboneliklerim</h2>
           
           {userData?.subscriptionPlan && (
             <div className="bg-slate-800 border border-slate-700/50 relative overflow-hidden rounded-2xl p-6 flex flex-col md:flex-row items-center justify-between gap-6 mb-6">
               <div className="absolute top-0 right-0 w-32 h-32 bg-amber-500/5 rounded-full blur-3xl pointer-events-none" />
               <div className="flex items-center gap-6 relative">
                 <div className="w-16 h-16 bg-amber-500/20 text-amber-400 rounded-xl flex items-center justify-center border border-amber-500/30">
                   <Star className="w-8 h-8" />
                 </div>
                 <div>
                   <h4 className="text-xl text-white font-bold mb-1">{userData.subscriptionPlan} Paketi Aboneliği</h4>
                   <div className="text-sm text-slate-400">
                     Başlangıç: {userData.subscriptionStartDate ? new Date(userData.subscriptionStartDate).toLocaleDateString('tr-TR') : '-'}
                   </div>
                   <div className="text-sm text-slate-400">
                     Bitiş: {userData.subscriptionEndDate ? new Date(userData.subscriptionEndDate).toLocaleDateString('tr-TR') : '-'}
                   </div>
                 </div>
               </div>
               
               <div className="flex items-center gap-4 relative">
                 <span className={`px-6 py-2 rounded-full text-sm font-bold uppercase tracking-widest border ${
                   isSubscriptionActive(userData)
                     ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                     : 'bg-red-500/10 text-red-400 border-red-500/20'
                 }`}>
                   {isSubscriptionActive(userData) ? 'Aktif' : 'Bitti'}
                 </span>
               </div>
            </div>
           )}

           <h3 className="text-lg font-bold text-white mb-4 mt-8">Abonelik Geçmişi</h3>
           <div className="space-y-4">
              {walletTransactions
                .filter(tx => tx.type === 'WITHDRAWAL' && (
                  (tx.items && tx.items.some((i: any) => i.type === 'subscription')) ||
                  (tx.description && tx.description.toLowerCase().includes('abonelik'))
                ))
                .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
                .length > 0 ? (
                  walletTransactions
                    .filter(tx => tx.type === 'WITHDRAWAL' && (
                      (tx.items && tx.items.some((i: any) => i.type === 'subscription')) ||
                      (tx.description && tx.description.toLowerCase().includes('abonelik'))
                    ))
                    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
                    .map((tx, idx) => (
                      <div key={idx} className="bg-slate-800/40 p-4 rounded-xl border border-slate-700/50 flex flex-col md:flex-row justify-between md:items-center gap-4 hover:bg-slate-800/60 transition-colors">
                        <div className="flex items-center gap-4">
                           <div className="w-12 h-12 bg-slate-800 text-slate-400 rounded-lg flex items-center justify-center border border-slate-700">
                              <Calendar className="w-6 h-6" />
                           </div>
                           <div>
                              <div className="text-white font-bold">{tx.description}</div>
                              <div className="text-xs text-slate-500">İşlem Tarihi: {new Date(tx.date).toLocaleDateString('tr-TR', { day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute:'2-digit' })}</div>
                           </div>
                        </div>
                        <div className="text-left md:text-right flex items-center justify-between md:justify-end gap-6">
                           <div className="font-bold text-slate-300">{tx.amount.toFixed(2)} ₺</div>
                           <span className="bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs px-3 py-1 rounded-full font-bold">Tamamlandı</span>
                        </div>
                      </div>
                    ))
                ) : (
                  !userData?.subscriptionPlan && (
                     <div className="text-center py-16 bg-slate-800/50 border border-slate-700/50 rounded-2xl">
                       <div className="w-20 h-20 bg-slate-800 rounded-full flex items-center justify-center mx-auto mb-4 border border-slate-700">
                         <Star className="w-10 h-10 text-slate-500" />
                       </div>
                       <p className="text-slate-400 mb-4">Mevcut veya geçmiş bir aboneliğiniz bulunmamaktadır.</p>
                       <button onClick={() => navigate('/abonelik')} className="px-6 py-3 bg-indigo-600/20 text-indigo-400 hover:bg-indigo-600 hover:text-white rounded-xl font-medium transition">
                         Paketleri İncele
                       </button>
                     </div>
                  )
                )}
           </div>
        </div>
      )}

      {activeTab === 'Siparişlerim' && (
        <div className="bg-slate-900/50 backdrop-blur-xl rounded-3xl border border-slate-800 p-8 shadow-xl space-y-6">
           <h2 className="text-2xl font-bold text-white tracking-tight mb-6">Siparişlerim</h2>
           
           <div className="space-y-4">
             {purchases.map(purchase => (
               <div key={purchase.id} className="bg-slate-800 border border-slate-700 rounded-xl p-5 flex flex-col md:flex-row items-center justify-between gap-4">
                 <div className="flex items-center gap-4">
                   <div className="w-12 h-12 bg-indigo-500/20 text-indigo-400 rounded-lg flex items-center justify-center">
                     <Package className="w-6 h-6" />
                   </div>
                   <div>
                     <h4 className="text-white font-medium">{purchase.productTitle}</h4>
                     <div className="text-sm text-slate-400 mt-1">
                       {new Date(purchase.purchasedAt).toLocaleDateString('tr-TR', {
                         year: 'numeric', month: 'long', day: 'numeric',
                         hour: '2-digit', minute: '2-digit'
                       })}
                     </div>
                   </div>
                 </div>
                 
                 <div className="flex items-center gap-4">
                   <div className="text-right">
                     <div className="text-lg font-bold text-indigo-400">{purchase.totalCost || purchase.cost || 0} ₺</div>
                   </div>
                   <span className={`px-3 py-1 text-xs font-bold uppercase tracking-wider rounded-full border ${
                     purchase.status === 'completed' || purchase.status === 'delivered'
                       ? 'bg-green-500/10 text-green-400 border-green-500/20'
                       : 'bg-amber-500/10 text-amber-400 border-amber-500/20'
                   }`}>
                     {purchase.status === 'completed' ? 'Tamamlandı' : 
                      purchase.status === 'delivered' ? 'Teslim Edildi' : 'Bekliyor'}
                   </span>
                 </div>
               </div>
             ))}
             {purchases.length === 0 && (
                <div className="text-center py-16 bg-slate-800 border border-slate-700 rounded-xl">
                  <p className="text-slate-400">Henüz hiçbir ürün satın almadınız.</p>
                  <button 
                    onClick={() => navigate('/panel/ogrenci/magaza')}
                    className="mt-4 text-indigo-400 hover:text-indigo-300 font-medium"
                  >
                    Mağazaya Göz At
                  </button>
                </div>
             )}
           </div>
        </div>
      )}

      {activeTab === 'Randevularım' && (
        <div className="bg-slate-900/50 backdrop-blur-xl rounded-3xl border border-slate-800 p-8 shadow-xl space-y-6">
           <h2 className="text-2xl font-bold text-white tracking-tight mb-6">Randevularım</h2>
           <AppointmentList role="student" />
        </div>
      )}

      {activeTab === 'Etkinlikler' && (
        <div className="bg-slate-900/50 backdrop-blur-xl rounded-3xl border border-slate-800 p-8 shadow-xl space-y-6">
           <h2 className="text-2xl font-bold text-white tracking-tight mb-6">Etkinlikler</h2>
           
           <div className="space-y-6">
             {ticketOrders.length > 0 || rsvps.length > 0 ? (
               <>
                 {ticketOrders.length > 0 && (
                   <div className="space-y-4">
                     <h3 className="text-lg font-semibold text-white">Etkinlik Biletlerim</h3>
                     {ticketOrders.map(order => {
                       const event = events[order.eventId];
                       return (
                         <div key={order.id} className="bg-slate-800 border border-slate-700 rounded-xl p-5 flex flex-col md:flex-row items-center justify-between gap-4">
                           <div className="flex items-center gap-4">
                             <div className="w-12 h-12 bg-blue-500/20 text-blue-400 rounded-lg flex items-center justify-center">
                               <Calendar className="w-6 h-6" />
                             </div>
                             <div>
                               <h4 className="text-white font-medium">{event ? event.title : 'Bilinmeyen Etkinlik'}</h4>
                               <div className="text-sm text-slate-400 mt-1">
                                 Bilet X {order.quantity} • {order.totalPrice} ₺
                               </div>
                               {event?.startDate && (
                                 <div className="text-xs text-slate-500 mt-1">
                                   Tarih: {new Date(event.startDate).toLocaleDateString('tr-TR', { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                                 </div>
                               )}
                             </div>
                           </div>
                           
                           <div className="flex items-center gap-4">
                             <span className="px-3 py-1 text-xs font-bold uppercase tracking-wider rounded-full border bg-blue-500/10 text-blue-400 border-blue-500/20">
                               Kayıtlı
                             </span>
                           </div>
                         </div>
                       );
                     })}
                   </div>
                 )}

                 {rsvps.length > 0 && (
                   <div className="space-y-4">
                     <h3 className="text-lg font-semibold text-white">Katılım Durumlarım (RSVP)</h3>
                     {rsvps.map(rsvp => {
                       const event = events[rsvp.eventId];
                       return (
                         <div key={rsvp.id} className="bg-slate-800 border border-slate-700 rounded-xl p-5 flex flex-col md:flex-row items-center justify-between gap-4">
                           <div className="flex items-center gap-4">
                             <div className="w-12 h-12 bg-indigo-500/20 text-indigo-400 rounded-lg flex items-center justify-center">
                               <Calendar className="w-6 h-6" />
                             </div>
                             <div>
                               <h4 className="text-white font-medium">{event ? event.title : 'Bilinmeyen Etkinlik'}</h4>
                               {event?.startDate && (
                                 <div className="text-xs text-slate-500 mt-1">
                                   Tarih: {new Date(event.startDate).toLocaleDateString('tr-TR', { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                                 </div>
                               )}
                             </div>
                           </div>
                           
                           <div className="flex items-center gap-4">
                             <span className={`px-3 py-1 text-xs font-bold uppercase tracking-wider rounded-full border ${
                               rsvp.status === 'attending' 
                                 ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                                 : 'bg-red-500/10 text-red-400 border-red-500/20'
                             }`}>
                               {rsvp.status === 'attending' ? 'Katılıyorum' : 'Katılmıyorum'}
                             </span>
                           </div>
                         </div>
                       );
                     })}
                   </div>
                 )}
               </>
             ) : (
                <div className="text-center py-16 bg-slate-800 border border-slate-700 rounded-xl">
                  <p className="text-slate-400">Henüz hiçbir etkinliğe katılmadınız veya bilet almadınız.</p>
                </div>
             )}
           </div>
        </div>
      )}

      {activeTab === 'Programlarım' && (
        <div className="bg-slate-900/50 backdrop-blur-xl rounded-3xl border border-slate-800 p-8 shadow-xl space-y-6">
           <h2 className="text-2xl font-bold text-white tracking-tight mb-6">Programlarım</h2>
           
           <div className="space-y-4">
             {enrollments.length > 0 ? (
               enrollments.map(enrollment => {
                 const program = programs[enrollment.programId];
                 return (
                   <div key={enrollment.id} className="bg-slate-800 border border-slate-700 rounded-xl p-5 flex flex-col md:flex-row items-center justify-between gap-4">
                     <div className="flex items-center gap-4 w-full md:w-auto">
                       <div className="w-12 h-12 bg-amber-500/20 text-amber-400 rounded-lg flex items-center justify-center shrink-0">
                         <BookOpen className="w-6 h-6" />
                       </div>
                       <div className="flex-1 min-w-0">
                         <h4 className="text-white font-medium truncate">{program ? program.title : 'Bilinmeyen Program'}</h4>
                         <div className="text-sm text-slate-400 mt-1">
                           Kayıt: {new Date(enrollment.enrolledAt).toLocaleDateString('tr-TR')}
                         </div>
                       </div>
                     </div>
                     
                     <div className="flex items-center gap-4 w-full md:w-auto justify-between md:justify-end">
                       <div className="flex flex-col items-end">
                         <span className="text-sm text-slate-400 mb-1">İlerleme: %{enrollment.progress}</span>
                         <div className="w-32 h-2 bg-slate-700 rounded-full overflow-hidden">
                           <div 
                             className={`h-full rounded-full ${enrollment.progress === 100 ? 'bg-emerald-500' : 'bg-amber-500'}`}
                             style={{ width: `${enrollment.progress}%` }}
                           />
                         </div>
                       </div>
                       <span className={`px-3 py-1 text-xs font-bold uppercase tracking-wider rounded-full border ${
                         enrollment.completed
                           ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                           : 'bg-amber-500/10 text-amber-400 border-amber-500/20'
                       }`}>
                         {enrollment.completed ? 'Tamamlandı' : 'Devam Ediyor'}
                       </span>
                     </div>
                   </div>
                 );
               })
             ) : (
                <div className="text-center py-16 bg-slate-800 border border-slate-700 rounded-xl">
                  <p className="text-slate-400">Henüz hiçbir online eğitime kayıt olmadınız.</p>
                </div>
             )}
           </div>
        </div>
      )}

      {activeTab === 'Ödüllerim' && (
        <div className="bg-slate-900/50 backdrop-blur-xl rounded-3xl border border-slate-800 p-8 shadow-xl space-y-6">
           <h2 className="text-2xl font-bold text-white tracking-tight mb-6">Ödüllerim ve Kuponlarım</h2>
           
           <div className="max-w-2xl mx-auto space-y-6">
             {userCoupons.length === 0 ? (
               <div className="text-center py-16 bg-slate-800 border border-slate-700 rounded-xl">
                  <div className="w-20 h-20 bg-slate-700/50 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Gift className="w-10 h-10 text-slate-400" />
                  </div>
                  <h3 className="text-xl font-medium text-white mb-2">Henüz Kuponunuz Yok</h3>
                  <p className="text-slate-400 mb-6 max-w-sm mx-auto">Şu anda hesabınıza tanımlanmış aktif bir indirim kuponu bulunmuyor. Arkadaşlarınızı davet ederek kupon kazanabilirsiniz.</p>
                  <button 
                    onClick={() => navigate('/panel/ogrenci/magaza')}
                    className="px-6 py-3 bg-indigo-600/20 text-indigo-400 hover:bg-indigo-600 hover:text-white rounded-xl font-medium transition"
                  >
                    Mağazaya Göz At
                  </button>
               </div>
             ) : (
               <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {userCoupons.map((coupon, idx) => {
                    const isExpired = coupon.endDate && new Date(coupon.endDate) < new Date();
                    const isDepleted = coupon.limitUsage && coupon.currentUsage >= coupon.maxUsage;
                    const isPending = coupon.status === 'pending';
                    const isUsed = coupon.status === 'used' || isDepleted;
                    const active = !isExpired && !isUsed && !isPending && coupon.status !== 'expired';
                    
                    return (
                      <div key={coupon.id || idx} className={`flex items-center justify-between p-5 bg-white/[0.02] border rounded-2xl transition-all ${active ? 'border-indigo-500/20 shadow-[0_4px_24px_rgba(99,102,241,0.05)]' : 'border-white/5 opacity-60'}`}>
                         <div className="flex items-center gap-4">
                            <div className={`w-14 h-14 rounded-2xl flex items-center justify-center border ${active ? 'bg-indigo-500/10 border-indigo-500/20 text-indigo-400' : isPending ? 'bg-amber-500/10 border-amber-500/20 text-amber-400' : 'bg-slate-800 border-slate-700 text-slate-500'}`}>
                               <Gift size={24} />
                            </div>
                            <div>
                              <h4 className="text-base font-bold text-white mb-1 flex items-center gap-2">
                                 {coupon.name}
                                 {isPending && <span className="text-[10px] bg-amber-500/10 text-amber-400 px-2 py-0.5 rounded uppercase tracking-widest leading-none">Bekliyor</span>}
                                 {isUsed && <span className="text-[10px] bg-red-500/10 text-red-400 px-2 py-0.5 rounded uppercase tracking-widest leading-none">Kullanıldı</span>}
                                 {!active && !isUsed && !isPending && <span className="text-[10px] bg-slate-500/10 text-slate-400 px-2 py-0.5 rounded uppercase tracking-widest leading-none">Geçersiz</span>}
                              </h4>
                              {coupon.onlyForSubscriptions && (
                                <p className="text-[11px] text-indigo-400 mb-2 font-medium">Sadece abonelik alımlarında geçerlidir</p>
                              )}
                              <div className="flex gap-4 items-center">
                                 <div className="bg-slate-900 border border-slate-700 px-2 py-0.5 rounded text-xs font-mono font-medium text-slate-300 select-all cursor-text py-1 border-dashed">
                                   {coupon.code}
                                 </div>
                                 {coupon.endDate && (
                                   <span className="text-[11px] font-medium text-slate-500">
                                     S.K.T: {new Date(coupon.endDate).toLocaleDateString('tr-TR')}
                                   </span>
                                 )}
                              </div>
                            </div>
                         </div>
                         <div className="text-right shrink-0">
                            <p className={`text-2xl font-black ${active ? 'text-indigo-400' : isPending ? 'text-amber-400' : 'text-slate-500'}`}>
                               {coupon.type === 'percentage' ? `%${coupon.discount}` : `${coupon.discount} ₺`}
                            </p>
                            <span className="text-[10px] text-slate-400 font-medium">İndirim</span>
                         </div>
                      </div>
                    );
                  })}
               </div>
             )}
             
             <div className="bg-slate-800/50 border border-white/5 rounded-2xl p-6">
                <div className="flex items-center gap-2 mb-4 text-slate-300">
                  <Info size={18} className="text-indigo-400" />
                  <h4 className="font-bold">Kuponlar Nasıl Kullanılır?</h4>
                </div>
                <ul className="text-sm text-slate-400 space-y-2 list-disc list-inside ml-2">
                   <li>Aktif kuponlarınızı sepet ödeme ekranında bulunan "İndirim / Davet Kuponu" alanına girerek kullanabilirsiniz.</li>
                   <li>Davet kodları veya özel gün indirim kodları alışveriş toplamında anında indirim sağlar.</li>
                   <li>Hediye çeki/kampanyalı kupon kodları da aynı alandan kullanılabilir.</li>
                </ul>
             </div>
           </div>
        </div>
      )}

      {activeTab !== 'Profil' && activeTab !== 'Cüzdanım' && activeTab !== 'Bildirimler' && activeTab !== 'Aboneliklerim' && activeTab !== 'Siparişlerim' && activeTab !== 'Randevularım' && activeTab !== 'Etkinlikler' && activeTab !== 'Programlarım' && activeTab !== 'Ödüllerim' && (
        <div className="bg-slate-900/50 backdrop-blur-xl rounded-3xl border border-slate-800 p-16 text-center shadow-xl">
           <h2 className="text-xl font-bold text-white mb-2">{activeTab}</h2>
           <p className="text-slate-400">Bu bölüm çok yakında hizmetinize açılacak.</p>
        </div>
      )}
    </div>
  );
}
