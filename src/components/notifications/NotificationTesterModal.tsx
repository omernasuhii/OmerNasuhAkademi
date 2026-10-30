import React, { useState, useEffect } from 'react';
import { 
  Bell, 
  CheckCircle2, 
  AlertTriangle, 
  XCircle, 
  Smartphone, 
  Send, 
  RefreshCw, 
  ShieldCheck, 
  Terminal, 
  Volume2, 
  Vibrate, 
  Copy, 
  Info,
  X,
  User,
  Users,
  Search,
  Check,
  Sparkles,
  ChevronDown,
  Filter,
  Clock,
  Server
} from 'lucide-react';
import { useAuth } from '../../lib/AuthContext';
import { fcmService } from '../../services/fcmService';
import { notificationService } from '../../services/notificationService';
import { doc, getDoc, collection, getDocs, query, limit } from 'firebase/firestore';
import { db } from '../../lib/firebase';

interface LogItem {
  id: string;
  time: string;
  type: 'info' | 'success' | 'warning' | 'error';
  message: string;
}

interface UserOption {
  uid: string;
  email?: string;
  firstName?: string;
  lastName?: string;
  displayName?: string;
  role?: string;
  photoURL?: string;
  phone?: string;
}

interface ServerPushStatus {
  adminInitialized: boolean;
  hasAdminCredentials: boolean;
  hasEnv: boolean;
  serviceAccountDetails?: {
    projectId?: string;
    clientEmail?: string;
    hasPrivateKey?: boolean;
    privateKeyValid?: boolean;
    error?: string;
  };
  projectId?: string;
}

interface NotificationTesterModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function NotificationTesterModal({ isOpen, onClose }: NotificationTesterModalProps) {
  const { user, userData, actualUserData, isAdmin } = useAuth();
  
  const isAdminUser = Boolean(isAdmin || userData?.role === 'admin' || actualUserData?.role === 'admin');

  // Aktif Sekme (Test & Gönderim vs Teşhis & Konsol)
  const [activeTab, setActiveTab] = useState<'send' | 'diagnostics'>('send');
  const [copiedToken, setCopiedToken] = useState<boolean>(false);

  // Cihaz ve Admin'in Kendi Durumu
  const [permissionStatus, setPermissionStatus] = useState<string>('default');
  const [isSupported, setIsSupported] = useState<boolean>(true);
  const [hasSW, setHasSW] = useState<boolean>(false);
  const [adminFcmToken, setAdminFcmToken] = useState<string | null>(null);
  const [isIos, setIsIos] = useState<boolean>(false);
  const [isStandalonePwa, setIsStandalonePwa] = useState<boolean>(false);

  // Sunucu Durumu
  const [serverStatus, setServerStatus] = useState<ServerPushStatus | null>(null);
  const [checkingServer, setCheckingServer] = useState<boolean>(false);

  // Kullanıcı Listesi ve Hedef Seçimi
  const [usersList, setUsersList] = useState<UserOption[]>([]);
  const [loadingUsers, setLoadingUsers] = useState<boolean>(false);
  const [selectedUser, setSelectedUser] = useState<UserOption | null>(null);
  const [targetFcmToken, setTargetFcmToken] = useState<string | null>(null);
  const [checkingTargetToken, setCheckingTargetToken] = useState<boolean>(false);

  // Arama & Filtre
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [roleFilter, setRoleFilter] = useState<'all' | 'student' | 'coach' | 'parent' | 'admin'>('all');
  const [isDropdownOpen, setIsDropdownOpen] = useState<boolean>(false);

  // Bildirim İçeriği
  const [loading, setLoading] = useState<boolean>(false);
  const [delayedCountdown, setDelayedCountdown] = useState<number | null>(null);
  const [testType, setTestType] = useState<'test' | 'appointment' | 'message' | 'task' | 'announcement'>('test');
  const [customTitle, setCustomTitle] = useState<string>('📲 Test Bildirimi');
  const [customBody, setCustomBody] = useState<string>('FocusON Akademi bildirim sistemi başarıyla çalışıyor!');
  
  // Canlı Loglar
  const [logs, setLogs] = useState<LogItem[]>([]);

  const addLog = (message: string, type: 'info' | 'success' | 'warning' | 'error' = 'info') => {
    const timeStr = new Date().toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
    setLogs(prev => [{ id: Math.random().toString(), time: timeStr, type, message }, ...prev.slice(0, 39)]);
  };

  // Mevcut admini varsayılan hedef kullanıcı yap
  const getAdminSelfOption = (): UserOption => {
    return {
      uid: user?.uid || '',
      email: user?.email || userData?.email || '',
      firstName: userData?.firstName || 'Yönetici',
      lastName: userData?.lastName || '(Kendim)',
      displayName: userData?.displayName || 'Yönetici (Kendim)',
      role: userData?.role || 'admin',
      photoURL: userData?.photoURL
    };
  };

  // Sunucu Push Durumunu Kontrol Et
  const checkServerStatus = async () => {
    setCheckingServer(true);
    try {
      const res = await fetch('/api/push-status');
      if (res.ok) {
        const data: ServerPushStatus = await res.json();
        setServerStatus(data);
        if (data.hasAdminCredentials && data.serviceAccountDetails?.clientEmail) {
          addLog(`Sunucu Durumu: Hizmet Hesabı Yüklü (${data.serviceAccountDetails.clientEmail})`, 'success');
        } else if (data.hasEnv && data.serviceAccountDetails?.error) {
          addLog(`Sunucu Durumu: FIREBASE_SERVICE_ACCOUNT JSON hatası: ${data.serviceAccountDetails.error}`, 'error');
        } else {
          addLog('Sunucu Durumu: FIREBASE_SERVICE_ACCOUNT tanımlı değil (Sunucu varsayılan modda çalışıyor).', 'warning');
        }
      }
    } catch (e: any) {
      addLog(`Sunucu kontrolü yapılamadı: ${e.message}`, 'warning');
    } finally {
      setCheckingServer(false);
    }
  };

  // 1. Cihaz Teşhisi Yap
  const checkDiagnostics = async () => {
    const ua = navigator.userAgent || '';
    const iosDevice = /iPad|iPhone|iPod/.test(ua) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
    setIsIos(iosDevice);

    const standalone = window.matchMedia('(display-mode: standalone)').matches || (window.navigator as any).standalone === true;
    setIsStandalonePwa(standalone);

    if (!('Notification' in window)) {
      setIsSupported(false);
      setPermissionStatus('unsupported');
      addLog('Bu tarayıcı Web Notification API desteklemiyor.', 'error');
    } else {
      setIsSupported(true);
      setPermissionStatus(Notification.permission);
      if (Notification.permission === 'granted') {
        addLog('Tarayıcı bildirim izni: Onaylı (Granted)', 'success');
      } else if (Notification.permission === 'denied') {
        addLog('Tarayıcı bildirim izni: Engellenmiş (Denied). Tarayıcı adres çubuğundaki kilit simgesinden izin veriniz.', 'error');
      } else {
        addLog('Tarayıcı bildirim izni: Henüz verilmemiş (Default).', 'warning');
      }
    }

    if ('serviceWorker' in navigator) {
      setHasSW(true);
      try {
        const reg = await navigator.serviceWorker.getRegistration();
        if (reg) {
          addLog(`Service Worker Kaydı Aktif (Scope: ${reg.scope})`, 'success');
        } else {
          addLog('Service Worker henüz kayıtlı değil, kayıt deneniyor...', 'warning');
        }
      } catch (e: any) {
        addLog(`Service Worker kontrolü: ${e.message}`, 'warning');
      }
    } else {
      setHasSW(false);
      addLog('Service Worker bu tarayıcıda desteklenmiyor.', 'error');
    }

    if (user?.uid) {
      try {
        const tokenSnap = await getDoc(doc(db, 'userTokens', user.uid));
        if (tokenSnap.exists() && tokenSnap.data()?.token) {
          const tok = tokenSnap.data().token;
          setAdminFcmToken(tok);
          addLog(`Cihazınızın kayıtlı FCM Push Token'ı mevcut (${tok.slice(0, 16)}...)`, 'success');
        } else {
          setAdminFcmToken(null);
          addLog('Cihazınız için henüz bir Push Token kaydı bulunamadı. "İzni Yenile & Token Al" butonuna basınız.', 'warning');
        }
      } catch (err: any) {}
    }

    checkServerStatus();
  };

  // 2. Tüm Kullanıcıları Firestore'dan Yükle
  const fetchAllUsers = async () => {
    setLoadingUsers(true);
    try {
      const q = query(collection(db, 'users'), limit(150));
      const snap = await getDocs(q);
      const list: UserOption[] = [];
      
      snap.forEach(d => {
        const data = d.data();
        list.push({
          uid: d.id,
          email: data.email || '',
          firstName: data.firstName || '',
          lastName: data.lastName || '',
          displayName: data.displayName || `${data.firstName || ''} ${data.lastName || ''}`.trim() || data.email,
          role: data.role || 'student',
          photoURL: data.photoURL,
          phone: data.phoneNumber || data.phone
        });
      });

      // İsme göre sırala
      list.sort((a, b) => (a.displayName || a.email || '').localeCompare(b.displayName || b.email || ''));
      setUsersList(list);
    } catch (err: any) {
      addLog(`Kullanıcılar yüklenirken hata: ${err.message}`, 'error');
    } finally {
      setLoadingUsers(false);
    }
  };

  // 3. Hedef Kullanıcı Değiştiğinde FCM Token Durumunu Kontrol Et
  const checkTargetUserToken = async (targetUid: string) => {
    setCheckingTargetToken(true);
    try {
      const tokenSnap = await getDoc(doc(db, 'userTokens', targetUid));
      if (tokenSnap.exists() && tokenSnap.data()?.token) {
        const tok = tokenSnap.data().token;
        setTargetFcmToken(tok);
        addLog(`Hedef kullanıcının kayıtlı Push Token'ı bulundu (${tok.slice(0, 16)}...)`, 'success');
      } else {
        setTargetFcmToken(null);
        addLog('Hedef kullanıcının henüz aktif bir Cihaz Push Token kaydı yok.', 'warning');
      }
    } catch (err: any) {
      setTargetFcmToken(null);
    } finally {
      setCheckingTargetToken(false);
    }
  };

  useEffect(() => {
    if (isOpen && isAdminUser) {
      setLogs([]);
      const self = getAdminSelfOption();
      setSelectedUser(self);
      addLog('Yönetici Bildirim Teşhis Paneli Açıldı.', 'info');
      checkDiagnostics();
      fetchAllUsers();
      if (user?.uid) {
        checkTargetUserToken(user.uid);
      }
    }
  }, [isOpen, isAdminUser, user?.uid]);

  // Seçilen kullanıcı değiştikçe token kontrolü
  const handleSelectUser = (target: UserOption) => {
    setSelectedUser(target);
    setIsDropdownOpen(false);
    const roleName = target.role === 'admin' ? 'Yönetici' : target.role === 'coach' ? 'Koç' : target.role === 'parent' ? 'Veli' : 'Öğrenci';
    addLog(`Hedef Kullanıcı Seçildi: ${target.displayName || target.email} (${roleName})`, 'info');
    checkTargetUserToken(target.uid);
  };

  // Şablon seçimi
  useEffect(() => {
    const targetName = selectedUser?.firstName || selectedUser?.displayName || 'Kullanıcı';
    switch (testType) {
      case 'appointment':
        setCustomTitle('📅 Görüşme Hatırlatması');
        setCustomBody(`Sayın ${targetName}, yarın saat 14:00 için planlanan koçluk seansınızı hatırlatırız.`);
        break;
      case 'message':
        setCustomTitle('💬 Yeni Koç Mesajı');
        setCustomBody(`Sayın ${targetName}, koçunuz çalışma programınıza yeni bir geri bildirim notu bıraktı.`);
        break;
      case 'task':
        setCustomTitle('🎯 Günlük Hedef Hatırlatması');
        setCustomBody(`Sayın ${targetName}, bugünkü çalışma hedeflerinizi tamamlamak için son saatler!`);
        break;
      case 'announcement':
        setCustomTitle('🚀 FocusON Akademi Duyurusu');
        setCustomBody('Sistemimize yeni video dersler ve deneme sınavları yüklendi. Hemen keşfet!');
        break;
      case 'test':
      default:
        setCustomTitle('📲 Test Bildirimi');
        setCustomBody(`Sayın ${targetName}, FocusON Akademi bildirim entegrasyon testi başarıyla iletildi.`);
        break;
    }
  }, [testType, selectedUser]);

  // Admin İzni İsteme ve Token Yenileme
  const handleRequestPermission = async () => {
    setLoading(true);
    addLog('Tarayıcıdan bildirim izni ve taze Push Token talep ediliyor...', 'info');
    try {
      if (!('Notification' in window)) {
        addLog('Tarayıcınız bildirim desteği sunmuyor.', 'error');
        setLoading(false);
        return;
      }

      const perm = await Notification.requestPermission();
      setPermissionStatus(perm);
      
      if (perm === 'granted') {
        addLog('Bildirim izni onaylandı.', 'success');
        const token = await fcmService.requestPermissionAndGetToken(user?.uid);
        if (token) {
          setAdminFcmToken(token);
          if (selectedUser?.uid === user?.uid) {
            setTargetFcmToken(token);
          }
          addLog(`✅ Yeni FCM Cihaz Tokenı başarıyla kaydedildi (${token.slice(0, 16)}...)`, 'success');
        } else {
          addLog('⚠️ Bildirim izni verildi ancak FCM Token alınamadı. İnternet bağlantınızı veya VAPID ayarını kontrol edin.', 'warning');
        }
      } else {
        addLog(`Bildirim izni: ${perm}`, 'warning');
      }
    } catch (err: any) {
      addLog(`İzin hatası: ${err.message}`, 'error');
    } finally {
      setLoading(false);
    }
  };

  // Bu Cihazda Yerel Olarak Tetikle
  const handleTriggerLocalNotification = async () => {
    addLog('Yönetici cihazında yerel bildirim/titreşim tetikleniyor...', 'info');
    if (navigator.vibrate) {
      try {
        navigator.vibrate([150, 75, 150]);
      } catch (e) {}
    }

    if (!('Notification' in window) || Notification.permission !== 'granted') {
      addLog('Yerel bildirim göstermek için önce "Bildirim İzni Ver" butonuna basınız.', 'warning');
      return;
    }

    try {
      if ('serviceWorker' in navigator) {
        const reg = await navigator.serviceWorker.ready;
        if (reg && reg.showNotification) {
          await reg.showNotification(customTitle, {
            body: customBody,
            icon: '/images/ON-Logo.png',
            badge: '/images/ON-Logo.png',
            tag: 'focuson-test-' + Date.now(),
            vibrate: [200, 100, 200] as any
          } as any);
          addLog('✅ Yönetici telefon/tarayıcı ekranına bildirim basıldı.', 'success');
          return;
        }
      }

      new Notification(customTitle, {
        body: customBody,
        icon: '/images/ON-Logo.png',
        badge: '/images/ON-Logo.png'
      });
      addLog('✅ Standart Notification nesnesiyle bildirim gösterildi.', 'success');
    } catch (err: any) {
      addLog(`Yerel bildirim hatası: ${err.message}`, 'error');
    }
  };

  // Hedef Kullanıcıya Bildirim Gönder (Firestore + Push)
  const handleSendNotificationToTarget = async () => {
    if (!selectedUser?.uid) {
      addLog('Lütfen önce bir hedef kullanıcı seçin.', 'error');
      return;
    }

    setLoading(true);
    const isSelf = selectedUser.uid === user?.uid;
    const targetName = selectedUser.displayName || selectedUser.email || selectedUser.uid;
    const targetRole = selectedUser.role === 'admin' ? 'Yönetici' : selectedUser.role === 'coach' ? 'Koç' : selectedUser.role === 'parent' ? 'Veli' : 'Öğrenci';

    addLog(`--------------------------------------------------`, 'info');
    addLog(`🚀 [BİLDİRİM GÖNDERİLİYOR]`, 'info');
    addLog(`Hedef: ${targetName} (${targetRole}) - UID: ${selectedUser.uid}`, 'info');

    try {
      // 1. Firestore Bildirim Koleksiyonuna Ekle (skipPush=true çünkü aşağıda doğrudan tekil push atıyoruz)
      const docRes = await notificationService.addNotification(selectedUser.uid, {
        title: customTitle,
        message: customBody,
        type: testType === 'appointment' ? 'appointment' : testType === 'message' ? 'message' : 'system',
        link: '/profil'
      }, true);

      addLog(`✔️ 1/2: Firestore bildirim kaydı oluşturuldu (ID: ${docRes?.id || 'kaydedildi'})`, 'success');

      // 2. Doğrudan Sunucu Üzerinden FCM Push Tetikle (Tekil)
      const targetTokenToSend = targetFcmToken || adminFcmToken;
      if (targetTokenToSend) {
        addLog(`📡 Sunucu üzerinden Google FCM Push tetikleniyor...`, 'info');
        const pushRes = await fetch('/api/send-push', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            token: targetTokenToSend,
            title: customTitle,
            body: customBody,
            link: '/profil'
          })
        });

        const pushData = await pushRes.json();
        if (pushData.success) {
          addLog(`✔️ 2/2: ✅ Google FCM Push Başarılı! İleti ID: ${pushData.response}`, 'success');
        } else {
          addLog(`⚠️ 2/2: Sunucu Push Hatası: ${pushData.error || 'Bilinmeyen hata'} (Kod: ${pushData.code || 'yok'})`, 'error');
          if (pushData.code === 'messaging/registration-token-not-registered') {
            addLog('ℹ️ Token süresi dolmuş veya geçersiz. Lütfen "İzni Yenile & Token Al" butonuna basarak yeni token üretin.', 'warning');
          } else if (pushData.code === 'messaging/mismatched-credential') {
            addLog('ℹ️ Token ile Hizmet Hesabı proje kimliği uyuşmuyor. Lütfen Firebase projesindeki Service Account ve VAPID anahtarlarının aynı projeye ait olduğundan emin olun.', 'error');
          }
        }
      } else {
        addLog(`ℹ️ 2/2: Hedef kullanıcının kayıtlı telefon Push token'ı yok. Bildirim uygulama içi çana iletildi.`, 'warning');
        if (isSelf) {
          await handleTriggerLocalNotification();
        }
      }

      addLog(`🎉 İşlem tamamlandı.`, 'success');
    } catch (err: any) {
      addLog(`Bildirim gönderme hatası: ${err.message}`, 'error');
    } finally {
      setLoading(false);
    }
  };

  // Zamanlı (10 Saniye Sonra) Arka Plan Testi
  const handleSendDelayedPush = async () => {
    const activeToken = targetFcmToken || adminFcmToken;
    if (!activeToken) {
      addLog('Zamanlı arka plan bildirimi için önce "İzni Yenile & Token Al" butonuna basarak token alınız.', 'error');
      return;
    }

    setLoading(true);
    addLog('--------------------------------------------------', 'info');
    addLog('⏱️ [10 SANİYE GECİKMELİ ARKA PLAN TESTİ BAŞLATILIYOR]', 'info');
    
    try {
      const res = await fetch('/api/send-delayed-push', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          token: activeToken,
          title: customTitle,
          body: customBody,
          delaySeconds: 10,
          link: '/profil'
        })
      });

      const data = await res.json();
      if (data.success) {
        addLog('✅ Sunucu zamanlayıcıyı kurdu! (10 saniye sonra gönderilecek)', 'success');
        addLog('👉 ŞİMDİ BU SEKMEYİ VEYA TELEFON EKRANINI KAPATIN VE BEKLEYİN!', 'warning');
        
        let count = 10;
        setDelayedCountdown(count);
        const timer = setInterval(() => {
          count -= 1;
          if (count <= 0) {
            clearInterval(timer);
            setDelayedCountdown(null);
            addLog('⏱️ 10 saniye doldu! Sunucu bildirimi cihazınıza ateşledi.', 'success');
          } else {
            setDelayedCountdown(count);
          }
        }, 1000);
      } else {
        addLog(`Sunucu hatası: ${data.error}`, 'error');
      }
    } catch (err: any) {
      addLog(`Zamanlı bildirim hatası: ${err.message}`, 'error');
    } finally {
      setLoading(false);
    }
  };

  // Filtrelenmiş Kullanıcı Listesi
  const filteredUsers = usersList.filter(u => {
    if (roleFilter !== 'all' && u.role !== roleFilter) return false;
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    const name = (u.displayName || `${u.firstName || ''} ${u.lastName || ''}`).toLowerCase();
    const email = (u.email || '').toLowerCase();
    const uid = (u.uid || '').toLowerCase();
    const phone = (u.phone || '').toLowerCase();
    return name.includes(q) || email.includes(q) || uid.includes(q) || phone.includes(q);
  });

  if (!isOpen || !isAdminUser) return null;

  const latestLog = logs[0];

  const handleCopyToken = (tokenToCopy: string) => {
    if (!tokenToCopy) return;
    navigator.clipboard.writeText(tokenToCopy);
    setCopiedToken(true);
    addLog('Cihaz FCM Tokenı panoya kopyalandı.', 'info');
    setTimeout(() => setCopiedToken(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-[150] flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-md overflow-hidden">
      <div className="bg-[#0c121e] border border-slate-800 w-full max-w-3xl rounded-3xl shadow-2xl overflow-hidden flex flex-col h-[90vh] max-h-[760px]">
        
        {/* Modal Header */}
        <div className="p-4 sm:p-5 border-b border-slate-800/80 bg-slate-900/70 shrink-0">
          <div className="flex items-center justify-between gap-3 mb-3">
            <div className="flex items-center gap-2.5 sm:gap-3">
              <div className="w-9 h-9 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400 shrink-0">
                <ShieldCheck size={20} />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-sm sm:text-base font-bold text-white">Yönetici Bildirim Test Merkezi</h3>
                  <span className="px-2 py-0.5 rounded-md bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-[10px] font-black uppercase tracking-wider hidden sm:inline-block">
                    Admin
                  </span>
                </div>
                <p className="text-[11px] sm:text-xs text-slate-400">Push bildirimlerini test edin ve sistem teşhisini görüntüleyin</p>
              </div>
            </div>
            
            <button 
              onClick={onClose}
              className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
            >
              <X size={18} />
            </button>
          </div>

          {/* Sekme Seçici (Tabs) */}
          <div className="flex items-center gap-1.5 p-1 bg-slate-950/80 border border-slate-800/80 rounded-2xl">
            <button
              onClick={() => setActiveTab('send')}
              className={`flex-1 py-2 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 ${
                activeTab === 'send'
                  ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/20'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/50'
              }`}
            >
              <Send size={14} />
              <span>1. Bildirim Gönder & Test Et</span>
            </button>

            <button
              onClick={() => setActiveTab('diagnostics')}
              className={`flex-1 py-2 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 ${
                activeTab === 'diagnostics'
                  ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/20'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/50'
              }`}
            >
              <Terminal size={14} />
              <span>2. Teşhis & Canlı Loglar</span>
              {logs.length > 0 && (
                <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-mono ${
                  activeTab === 'diagnostics' ? 'bg-white/20 text-white' : 'bg-slate-800 text-slate-400'
                }`}>
                  {logs.length}
                </span>
              )}
            </button>
          </div>
        </div>

        {/* Modal Scrollable Body (Tek Kaydırma Alanı) */}
        <div className="p-4 sm:p-6 overflow-y-auto space-y-4 custom-scrollbar flex-1 min-h-0">
          
          {/* TAB 1: BİLDİRİM GÖNDER & TEST ET */}
          {activeTab === 'send' && (
            <div className="space-y-4">
              
              {/* Mini Durum Özeti */}
              <div className="p-3 rounded-2xl bg-slate-900/80 border border-slate-800 flex flex-wrap items-center justify-between gap-2 text-xs">
                <div className="flex items-center gap-2">
                  <span className="text-slate-400">Sunucu:</span>
                  {serverStatus?.hasAdminCredentials ? (
                    <span className="text-emerald-400 font-semibold flex items-center gap-1">
                      <CheckCircle2 size={13} /> FCM Aktif
                    </span>
                  ) : (
                    <span className="text-amber-400 font-semibold flex items-center gap-1">
                      <AlertTriangle size={13} /> Hizmet Hesabı Eksik
                    </span>
                  )}
                  
                  <span className="text-slate-600">&bull;</span>
                  
                  <span className="text-slate-400">Cihazınız:</span>
                  {permissionStatus === 'granted' ? (
                    <span className="text-emerald-400 font-semibold flex items-center gap-1">
                      <CheckCircle2 size={13} /> İzin Onaylı
                    </span>
                  ) : (
                    <span className="text-amber-400 font-semibold flex items-center gap-1">
                      <AlertTriangle size={13} /> İzin Gerekli
                    </span>
                  )}
                </div>

                <button
                  onClick={() => setActiveTab('diagnostics')}
                  className="text-[11px] text-indigo-400 hover:text-indigo-300 font-semibold transition-colors"
                >
                  Detaylı Teşhis &rarr;
                </button>
              </div>

              {/* Geri Sayım Canlı Uyarısı */}
              {delayedCountdown !== null && (
                <div className="p-4 rounded-2xl bg-amber-500/15 border border-amber-500/40 text-amber-200 flex items-center justify-between animate-pulse">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-amber-500/20 flex items-center justify-center font-black text-lg text-amber-300">
                      {delayedCountdown}s
                    </div>
                    <div>
                      <p className="font-bold text-sm text-white">Tarayıcıyı veya Telefonunuzu Şimdi Kapatın!</p>
                      <p className="text-xs text-amber-300/90">{delayedCountdown} saniye sonra telefonunuza kilit ekranı bildirimi ateşlenecektir.</p>
                    </div>
                  </div>
                </div>
              )}

              {/* 1. ADIM: HEDEF KULLANICI SEÇİMİ */}
              <div className="space-y-3 bg-slate-900/60 p-4 sm:p-5 rounded-2xl border border-slate-800/90">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-black text-white uppercase tracking-wider flex items-center gap-2">
                    <Users size={15} className="text-indigo-400" />
                    1. Hedef Kullanıcıyı Seçin
                  </label>
                  
                  <button
                    onClick={() => handleSelectUser(getAdminSelfOption())}
                    className={`px-3 py-1 rounded-xl text-xs font-bold transition-all border ${
                      selectedUser?.uid === user?.uid
                        ? 'bg-indigo-600 border-indigo-500 text-white shadow-sm'
                        : 'bg-slate-800/80 border-slate-700 text-slate-300 hover:text-white'
                    }`}
                  >
                    👤 Kendim (Yönetici)
                  </button>
                </div>

                {/* Seçili Kullanıcı Bilgi Kartı */}
                {selectedUser && (
                  <div className="p-3 bg-slate-950/80 border border-slate-800 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-9 h-9 rounded-xl bg-slate-800 border border-slate-700 flex items-center justify-center text-slate-300 font-bold text-xs shrink-0">
                        {(selectedUser.firstName || selectedUser.displayName || selectedUser.email || 'U')[0].toUpperCase()}
                      </div>
                      <div className="truncate">
                        <div className="flex items-center gap-2 flex-wrap">
                          <p className="text-xs sm:text-sm font-bold text-white truncate">
                            {selectedUser.displayName || `${selectedUser.firstName || ''} ${selectedUser.lastName || ''}`.trim() || selectedUser.email}
                          </p>
                          <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded uppercase ${
                            selectedUser.role === 'admin' ? 'bg-rose-500/10 text-rose-400 border border-rose-500/20' :
                            selectedUser.role === 'coach' ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20' :
                            selectedUser.role === 'parent' ? 'bg-purple-500/10 text-purple-400 border border-purple-500/20' :
                            'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                          }`}>
                            {selectedUser.role === 'admin' ? 'Yönetici' : selectedUser.role === 'coach' ? 'Koç' : selectedUser.role === 'parent' ? 'Veli' : 'Öğrenci'}
                          </span>
                          {selectedUser.uid === user?.uid && (
                            <span className="text-[10px] font-bold bg-indigo-500/20 text-indigo-300 px-1.5 py-0.5 rounded border border-indigo-500/30">
                              Siz
                            </span>
                          )}
                        </div>
                        <p className="text-[11px] text-slate-400 font-mono mt-0.5 truncate">
                          {selectedUser.email}
                        </p>
                      </div>
                    </div>

                    {/* Hedef Kullanıcı FCM Durumu */}
                    <div className="flex items-center gap-2 text-xs font-semibold px-2.5 py-1.5 rounded-xl bg-slate-900 border border-slate-800/80 shrink-0 self-start sm:self-auto">
                      {checkingTargetToken ? (
                        <span className="text-slate-400 flex items-center gap-1.5">
                          <RefreshCw size={12} className="animate-spin" /> Aranıyor...
                        </span>
                      ) : targetFcmToken ? (
                        <span className="text-emerald-400 flex items-center gap-1.5 text-[11px]">
                          <CheckCircle2 size={13} /> Cihaz Kayıtlı
                        </span>
                      ) : (
                        <span className="text-amber-400 flex items-center gap-1.5 text-[11px]">
                          <AlertTriangle size={13} /> Token Yok (Uygulama İçi)
                        </span>
                      )}
                    </div>
                  </div>
                )}

                {/* Başka Kullanıcı Seçme Açılır Paneli */}
                <div className="relative">
                  <button
                    type="button"
                    onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                    className="w-full py-2.5 px-3.5 bg-slate-950 border border-slate-800 hover:border-slate-700 rounded-xl text-xs font-medium text-slate-300 flex items-center justify-between transition-colors"
                  >
                    <span className="flex items-center gap-2">
                      <Search size={14} className="text-slate-400" />
                      {isDropdownOpen ? 'Kullanıcı Listesini Kapat' : 'Sistemdeki Başka Bir Kullanıcıyı Ara / Seç...'}
                    </span>
                    <ChevronDown size={14} className={`text-slate-400 transition-transform ${isDropdownOpen ? 'rotate-180' : ''}`} />
                  </button>

                  {isDropdownOpen && (
                    <div className="mt-2 p-3 bg-slate-950 border border-slate-800 rounded-2xl shadow-2xl space-y-3">
                      <div className="flex flex-col sm:flex-row gap-2">
                        <div className="relative flex-1">
                          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
                          <input 
                            type="text" 
                            placeholder="İsim, e-posta veya ID ile ara..."
                            value={searchQuery}
                            onChange={e => setSearchQuery(e.target.value)}
                            className="w-full bg-slate-900 border border-slate-800 rounded-xl pl-9 pr-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
                            autoFocus
                          />
                        </div>
                        
                        <div className="flex items-center gap-1 overflow-x-auto pb-1 sm:pb-0">
                          {[
                            { id: 'all', label: 'Tümü' },
                            { id: 'student', label: 'Öğrenci' },
                            { id: 'coach', label: 'Koç' },
                            { id: 'parent', label: 'Veli' },
                            { id: 'admin', label: 'Yönetici' },
                          ].map(tab => (
                            <button
                              key={tab.id}
                              type="button"
                              onClick={() => setRoleFilter(tab.id as any)}
                              className={`px-2.5 py-1.5 rounded-lg text-[11px] font-bold whitespace-nowrap transition-colors ${
                                roleFilter === tab.id
                                  ? 'bg-indigo-600 text-white'
                                  : 'bg-slate-900 text-slate-400 hover:text-slate-200'
                              }`}
                            >
                              {tab.label}
                            </button>
                          ))}
                        </div>
                      </div>

                      <div className="max-h-48 overflow-y-auto divide-y divide-slate-900 custom-scrollbar border border-slate-800/80 rounded-xl">
                        {loadingUsers ? (
                          <div className="p-6 text-center text-xs text-slate-500 flex items-center justify-center gap-2">
                            <RefreshCw size={14} className="animate-spin" /> Kullanıcılar yükleniyor...
                          </div>
                        ) : filteredUsers.length === 0 ? (
                          <div className="p-6 text-center text-xs text-slate-500">
                            Aramanızla eşleşen kullanıcı bulunamadı.
                          </div>
                        ) : (
                          filteredUsers.map(u => {
                            const isCurrent = selectedUser?.uid === u.uid;
                            return (
                              <div
                                key={u.uid}
                                onClick={() => handleSelectUser(u)}
                                className={`p-2 flex items-center justify-between hover:bg-slate-900 cursor-pointer transition-colors ${
                                  isCurrent ? 'bg-indigo-600/10' : ''
                                }`}
                              >
                                <div className="flex items-center gap-2 truncate">
                                  <div className="w-6 h-6 rounded-lg bg-slate-800 text-slate-300 font-bold text-xs flex items-center justify-center shrink-0">
                                    {(u.firstName || u.displayName || u.email || 'U')[0].toUpperCase()}
                                  </div>
                                  <div className="truncate">
                                    <p className="text-xs font-bold text-white truncate">
                                      {u.displayName || `${u.firstName || ''} ${u.lastName || ''}`.trim() || u.email}
                                    </p>
                                    <p className="text-[10px] text-slate-400 truncate">{u.email}</p>
                                  </div>
                                </div>

                                <div className="flex items-center gap-2 shrink-0">
                                  <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded uppercase ${
                                    u.role === 'admin' ? 'bg-rose-500/10 text-rose-400' :
                                    u.role === 'coach' ? 'bg-amber-500/10 text-amber-400' :
                                    u.role === 'parent' ? 'bg-purple-500/10 text-purple-400' :
                                    'bg-emerald-500/10 text-emerald-400'
                                  }`}>
                                    {u.role === 'admin' ? 'Yönetici' : u.role === 'coach' ? 'Koç' : u.role === 'parent' ? 'Veli' : 'Öğrenci'}
                                  </span>
                                  {isCurrent && <Check size={14} className="text-indigo-400" />}
                                </div>
                              </div>
                            );
                          })
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* 2. ADIM: TEST ŞABLONU & BİLDİRİM İÇERİĞİ */}
              <div className="space-y-3 bg-slate-900/40 p-4 sm:p-5 rounded-2xl border border-slate-800/80">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-black text-white uppercase tracking-wider flex items-center gap-2">
                    <Sparkles size={15} className="text-amber-400" />
                    2. Bildirim Şablonu & Metni
                  </label>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
                  {[
                    { id: 'test', label: '📲 Genel Test' },
                    { id: 'appointment', label: '📅 Randevu' },
                    { id: 'message', label: '💬 Koç Mesajı' },
                    { id: 'task', label: '🎯 Görev' },
                    { id: 'announcement', label: '🚀 Duyuru' },
                  ].map(t => (
                    <button
                      key={t.id}
                      onClick={() => setTestType(t.id as any)}
                      className={`py-2 px-2 rounded-xl text-xs font-bold border transition-all text-center truncate ${
                        testType === t.id 
                          ? 'bg-indigo-600/20 border-indigo-500 text-indigo-300 shadow-sm' 
                          : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      {t.label}
                    </button>
                  ))}
                </div>

                <div className="space-y-2 pt-1">
                  <div>
                    <label className="text-[11px] font-bold text-slate-400 block mb-1">Bildirim Başlığı</label>
                    <input 
                      type="text" 
                      value={customTitle}
                      onChange={e => setCustomTitle(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500"
                    />
                  </div>
                  <div>
                    <label className="text-[11px] font-bold text-slate-400 block mb-1">Bildirim Mesajı</label>
                    <input 
                      type="text" 
                      value={customBody}
                      onChange={e => setCustomBody(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500"
                    />
                  </div>
                </div>
              </div>

              {/* 3. ADIM: AKSİYON BUTONLARI */}
              <div className="space-y-2.5">
                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5">
                  <button
                    onClick={handleRequestPermission}
                    disabled={loading}
                    className="py-3 px-3.5 bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold text-xs rounded-xl transition-colors flex items-center justify-center gap-2 shadow-lg shadow-amber-500/20"
                    title="Cihazınızın tarayıcı iznini yeniler ve en son FCM tokenını kaydeder"
                  >
                    <Bell size={15} />
                    İzni Yenile & Token Al
                  </button>

                  <button
                    onClick={handleSendNotificationToTarget}
                    disabled={loading || !selectedUser}
                    className="flex-1 py-3 px-4 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs rounded-xl transition-all flex items-center justify-center gap-2 shadow-lg shadow-indigo-600/20 active:scale-[0.98]"
                  >
                    {loading ? (
                      <RefreshCw size={15} className="animate-spin" />
                    ) : (
                      <Send size={15} />
                    )}
                    {selectedUser?.uid === user?.uid
                      ? '📲 Şimdi Test Bildirimi Gönder'
                      : `🚀 ${selectedUser?.displayName || selectedUser?.firstName || 'Kullanıcıya'} Bildirim Gönder`}
                  </button>

                  <button
                    onClick={handleTriggerLocalNotification}
                    disabled={loading}
                    className="py-3 px-3.5 bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs rounded-xl transition-colors flex items-center justify-center gap-1.5"
                    title="Yalnızca mevcut cihaz ekranında yerel bildirim ve titreşim tetikler"
                  >
                    <Volume2 size={15} className="text-emerald-400" />
                    Titret
                  </button>
                </div>

                {/* Arka Plan / Kapalıyken Özel Test Butonu */}
                <div className="p-3 bg-indigo-950/40 border border-indigo-500/30 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
                  <div className="flex items-center gap-2">
                    <Clock size={16} className="text-indigo-400 shrink-0" />
                    <p className="text-xs text-indigo-200 leading-snug">
                      <strong>Arka Plan Testi (10 sn Gecikmeli):</strong> Butona bastıktan sonra bu sekmeyi kapatın veya telefonunuzu kilitleyin.
                    </p>
                  </div>

                  <button
                    onClick={handleSendDelayedPush}
                    disabled={loading || delayedCountdown !== null}
                    className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold rounded-xl transition-all shadow-md flex items-center justify-center gap-2 shrink-0 active:scale-95"
                  >
                    {delayedCountdown !== null ? (
                      <>
                        <RefreshCw size={13} className="animate-spin" />
                        <span>Gönderiliyor ({delayedCountdown}s)...</span>
                      </>
                    ) : (
                      <>
                        <Clock size={13} />
                        <span>⏱️ Kapalıyken Test Et (10 sn)</span>
                      </>
                    )}
                  </button>
                </div>
              </div>

              {/* Son İşlem Logu Şeridi */}
              {latestLog && (
                <div 
                  onClick={() => setActiveTab('diagnostics')}
                  className="p-3 bg-slate-950 border border-slate-800/80 rounded-2xl flex items-center justify-between text-xs cursor-pointer hover:border-slate-700 transition-colors"
                >
                  <div className="flex items-center gap-2 truncate">
                    <span className="text-slate-500 font-mono text-[10px]">[{latestLog.time}]</span>
                    <span className={`truncate ${
                      latestLog.type === 'success' ? 'text-emerald-400' :
                      latestLog.type === 'error' ? 'text-rose-400' :
                      latestLog.type === 'warning' ? 'text-amber-400' : 'text-slate-300'
                    }`}>
                      {latestLog.message}
                    </span>
                  </div>
                  <span className="text-[11px] text-slate-500 shrink-0 ml-2">Tüm Loglar &rarr;</span>
                </div>
              )}

            </div>
          )}

          {/* TAB 2: TEŞHİS & CANLI LOGLAR */}
          {activeTab === 'diagnostics' && (
            <div className="space-y-4">
              
              {/* Sunucu Durum Bilgi Kartı */}
              <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 ${
                      serverStatus?.hasAdminCredentials ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                    }`}>
                      <Server size={16} />
                    </div>
                    <div>
                      <p className="font-bold text-xs text-white flex items-center gap-1.5">
                        Firebase Admin SDK & Hizmet Hesabı
                        {checkingServer && <RefreshCw size={11} className="animate-spin text-slate-400" />}
                      </p>
                      <p className="text-slate-400 text-[11px] font-mono">
                        {serverStatus?.hasAdminCredentials ? '✅ Yetkilendirilmiş ve Aktif' : '⚠️ Yapılandırma Gerekli'}
                      </p>
                    </div>
                  </div>

                  <button 
                    onClick={checkServerStatus}
                    className="px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white text-[11px] font-semibold transition-colors flex items-center gap-1 shrink-0"
                  >
                    <RefreshCw size={11} /> Yenile
                  </button>
                </div>

                <div className="p-3 bg-slate-950 rounded-xl font-mono text-[11px] space-y-1 text-slate-300">
                  <p><span className="text-slate-500">Proje ID:</span> {serverStatus?.projectId || 'Bilinmiyor'}</p>
                  <p><span className="text-slate-500">Hizmet E-Postası:</span> {serverStatus?.serviceAccountDetails?.clientEmail || 'Yüklenmedi'}</p>
                  <p><span className="text-slate-500">Private Key:</span> {serverStatus?.serviceAccountDetails?.hasPrivateKey ? 'Mevcut (Geçerli)' : 'Eksik'}</p>
                  {serverStatus?.serviceAccountDetails?.error && (
                    <p className="text-rose-400"><span className="text-slate-500">Hata:</span> {serverStatus.serviceAccountDetails.error}</p>
                  )}
                </div>
              </div>

              {/* Yerel Cihaz & Tarayıcı Teşhis Kartı */}
              <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Smartphone size={16} className="text-indigo-400" />
                    <p className="font-bold text-xs text-white">Bu Cihazın Bildirim Teşhisi</p>
                  </div>
                  <button
                    onClick={checkDiagnostics}
                    className="text-[11px] text-indigo-400 hover:text-indigo-300 font-semibold"
                  >
                    Tekrar Test Et
                  </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs">
                  <div className="p-2.5 bg-slate-950 rounded-xl">
                    <span className="text-slate-500 text-[10px] block">Tarayıcı Desteği</span>
                    <span className="font-semibold text-white">{isSupported ? 'Destekleniyor' : 'Desteklenmiyor'}</span>
                  </div>
                  <div className="p-2.5 bg-slate-950 rounded-xl">
                    <span className="text-slate-500 text-[10px] block">İzin Durumu</span>
                    <span className={`font-semibold ${permissionStatus === 'granted' ? 'text-emerald-400' : 'text-amber-400'}`}>
                      {permissionStatus === 'granted' ? 'Onaylı (Granted)' : permissionStatus === 'denied' ? 'Engelli (Denied)' : 'Varsayılan'}
                    </span>
                  </div>
                  <div className="p-2.5 bg-slate-950 rounded-xl">
                    <span className="text-slate-500 text-[10px] block">Service Worker</span>
                    <span className={`font-semibold ${hasSW ? 'text-emerald-400' : 'text-slate-300'}`}>
                      {hasSW ? 'Aktif Kayıtlı' : 'Kontrol Ediliyor'}
                    </span>
                  </div>
                </div>

                {/* FCM Token Kutusu */}
                {adminFcmToken && (
                  <div className="p-3 bg-slate-950 border border-slate-800 rounded-xl space-y-1.5">
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] font-bold text-slate-400">Aktif Cihaz Push Token (FCM):</span>
                      <button
                        onClick={() => handleCopyToken(adminFcmToken)}
                        className="text-[10px] text-indigo-400 hover:text-indigo-300 flex items-center gap-1 font-semibold"
                      >
                        {copiedToken ? <Check size={11} className="text-emerald-400" /> : <Copy size={11} />}
                        {copiedToken ? 'Kopyalandı!' : 'Kopyala'}
                      </button>
                    </div>
                    <p className="text-[10px] font-mono text-slate-400 break-all bg-slate-900/60 p-2 rounded-lg">
                      {adminFcmToken}
                    </p>
                  </div>
                )}
              </div>

              {/* iOS / iPhone Bilgilendirme */}
              {isIos && (
                <div className={`p-3.5 rounded-2xl border text-xs space-y-1.5 ${
                  isStandalonePwa ? 'bg-indigo-500/10 border-indigo-500/30 text-indigo-200' : 'bg-amber-500/10 border-amber-500/30 text-amber-200'
                }`}>
                  <div className="flex items-center gap-2 font-bold">
                    <Info size={15} />
                    <span>iPhone / iOS Web Push Kuralı</span>
                  </div>
                  <p className="text-slate-300 leading-relaxed text-[11px]">
                    {isStandalonePwa 
                      ? 'Uygulama Ana Ekrana Eklenmiş (PWA) modunda çalışıyor. Bildirimler iOS 16.4+ üzerinde tam desteklenir.'
                      : 'Apple kuralları gereği Safari\'de Web Push bildirimleri yalnızca site Safari\'de "Paylaş > Ana Ekrana Ekle" adımıyla ana ekrandan açıldığında alınabilir.'}
                  </p>
                </div>
              )}

              {/* Terminal Logları */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-slate-300 flex items-center gap-2">
                    <Terminal size={14} className="text-indigo-400" />
                    Canlı İşlem Logları
                  </label>
                  <button 
                    onClick={() => setLogs([])}
                    className="text-[11px] text-slate-400 hover:text-white transition-colors"
                  >
                    Logları Temizle
                  </button>
                </div>

                <div className="bg-slate-950 border border-slate-800/90 rounded-2xl p-3.5 font-mono text-[11px] space-y-1.5">
                  {logs.length === 0 ? (
                    <p className="text-slate-600 italic">Henüz işlem logu yok.</p>
                  ) : (
                    logs.map(log => (
                      <div key={log.id} className="flex items-start gap-2 leading-relaxed">
                        <span className="text-slate-600 shrink-0 select-none">[{log.time}]</span>
                        <span className={
                          log.type === 'success' ? 'text-emerald-400 font-medium' :
                          log.type === 'error' ? 'text-rose-400 font-medium' :
                          log.type === 'warning' ? 'text-amber-400' : 'text-slate-300'
                        }>
                          {log.message}
                        </span>
                      </div>
                    ))
                  )}
                </div>
              </div>

            </div>
          )}

        </div>

        {/* Modal Footer (Sabit Alt Bar) */}
        <div className="p-3.5 sm:p-4 border-t border-slate-800/80 bg-slate-900/40 flex items-center justify-between shrink-0">
          <p className="text-[11px] text-slate-500 truncate max-w-xs sm:max-w-md">
            Yönetici: <span className="text-slate-300 font-mono">{user?.email || user?.uid}</span>
          </p>
          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold rounded-xl transition-colors"
          >
            Kapat
          </button>
        </div>

      </div>
    </div>
  );
}
