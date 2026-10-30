import React, { useState, useEffect } from 'react';
import { 
  GraduationCap, 
  UserPlus, 
  UserMinus, 
  RefreshCw, 
  AlertTriangle, 
  ShieldAlert, 
  CheckCircle2, 
  X, 
  Search, 
  Sparkles, 
  Check, 
  ArrowRight,
  UserCheck,
  Phone,
  Mail,
  HelpCircle,
  Wallet
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { doc, getDoc, updateDoc, collection, query, where, getDocs, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { notificationService } from '../../services/notificationService';

interface CoachConnectionCardProps {
  user: any;
  userData: any;
  onRefreshUserData?: () => void;
}

interface CoachProfile {
  uid: string;
  name: string;
  photoURL?: string;
  title?: string;
  coachCode?: string;
  referralCode?: string;
  email?: string;
  phone?: string;
}

export default function CoachConnectionCard({ user, userData, onRefreshUserData }: CoachConnectionCardProps) {
  const [currentCoach, setCurrentCoach] = useState<CoachProfile | null>(null);
  const [loadingCoach, setLoadingCoach] = useState(true);

  // Link Coach Input State (when no coach)
  const [inputCode, setInputCode] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [foundCoachPreview, setFoundCoachPreview] = useState<CoachProfile | null>(null);
  const [searchError, setSearchError] = useState<string | null>(null);
  const [isLinking, setIsLinking] = useState(false);

  // 2-Step Confirmation Modal State
  const [modalOpen, setModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<'disconnect' | 'change'>('disconnect');
  const [modalStep, setModalStep] = useState<1 | 2>(1);
  const [agreedToTerms, setAgreedToTerms] = useState(false);
  const [isProcessingModal, setIsProcessingModal] = useState(false);

  // Change Coach State within Modal
  const [changeCode, setChangeCode] = useState('');
  const [isSearchingNewCoach, setIsSearchingNewCoach] = useState(false);
  const [newCoachPreview, setNewCoachPreview] = useState<CoachProfile | null>(null);
  const [changeError, setChangeError] = useState<string | null>(null);

  // Toast / Feedback message inside card
  const [feedbackMessage, setFeedbackMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const coachId = userData?.coachId || userData?.assignedCoachId;
  const currentBalance = Number(userData?.walletBalance || userData?.balance || 0);

  // Load current coach profile
  useEffect(() => {
    let isMounted = true;
    async function loadCoach() {
      if (!coachId) {
        if (isMounted) {
          setCurrentCoach(null);
          setLoadingCoach(false);
        }
        return;
      }

      setLoadingCoach(true);
      try {
        const coachDoc = await getDoc(doc(db, 'users', coachId));
        if (coachDoc.exists() && isMounted) {
          const d = coachDoc.data();
          const fullName = d.displayName || 
            (d.firstName || d.lastName ? `${d.firstName || ''} ${d.lastName || ''}`.trim() : 'Eğitim Koçu');
          setCurrentCoach({
            uid: coachDoc.id,
            name: fullName,
            photoURL: d.photoURL || d.avatarUrl || '',
            title: d.title || d.branch || 'FocusOn Eğitim Koçu',
            coachCode: d.coachCode || '',
            referralCode: d.referralCode || '',
            email: d.email || '',
            phone: d.phone || ''
          });
        } else if (isMounted) {
          setCurrentCoach(null);
        }
      } catch (err) {
        console.error('Error fetching coach details:', err);
      } finally {
        if (isMounted) setLoadingCoach(false);
      }
    }

    loadCoach();
    return () => { isMounted = false; };
  }, [coachId]);

  // Helper to find a coach by coachCode or referralCode
  const lookupCoachByCode = async (code: string): Promise<CoachProfile | null> => {
    const clean = code.trim().toUpperCase();
    if (!clean) return null;

    try {
      // 1. Try coachCode matching
      let q = query(collection(db, 'users'), where('role', '==', 'coach'), where('coachCode', '==', clean));
      let snap = await getDocs(q);
      if (snap.empty) {
        // Also check original case
        q = query(collection(db, 'users'), where('role', '==', 'coach'), where('coachCode', '==', code.trim()));
        snap = await getDocs(q);
      }

      // 2. Try referralCode matching
      if (snap.empty) {
        q = query(collection(db, 'users'), where('role', '==', 'coach'), where('referralCode', '==', clean));
        snap = await getDocs(q);
      }

      // 3. Fallback: check all coaches case-insensitively
      if (snap.empty) {
        const allCoaches = await getDocs(query(collection(db, 'users'), where('role', '==', 'coach')));
        const matched = allCoaches.docs.find(d => {
          const data = d.data();
          const cCode = (data.coachCode || '').trim().toUpperCase();
          const rCode = (data.referralCode || '').trim().toUpperCase();
          return cCode === clean || rCode === clean;
        });

        if (matched) {
          const d = matched.data();
          return {
            uid: matched.id,
            name: d.displayName || `${d.firstName || ''} ${d.lastName || ''}`.trim() || 'Eğitim Koçu',
            photoURL: d.photoURL || d.avatarUrl || '',
            title: d.title || d.branch || 'FocusOn Eğitim Koçu',
            coachCode: d.coachCode || '',
            referralCode: d.referralCode || '',
            email: d.email || '',
            phone: d.phone || ''
          };
        }
      } else {
        const d = snap.docs[0].data();
        return {
          uid: snap.docs[0].id,
          name: d.displayName || `${d.firstName || ''} ${d.lastName || ''}`.trim() || 'Eğitim Koçu',
          photoURL: d.photoURL || d.avatarUrl || '',
          title: d.title || d.branch || 'FocusOn Eğitim Koçu',
          coachCode: d.coachCode || '',
          referralCode: d.referralCode || '',
          email: d.email || '',
          phone: d.phone || ''
        };
      }
    } catch (e) {
      console.error('Coach lookup error:', e);
    }
    return null;
  };

  // Initial code verification (when user has no coach)
  const handleVerifyInitialCode = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setSearchError(null);
    setFoundCoachPreview(null);
    if (!inputCode.trim()) {
      setSearchError('Lütfen geçerli bir koç kodu girin.');
      return;
    }

    setIsSearching(true);
    try {
      const coach = await lookupCoachByCode(inputCode);
      if (coach) {
        setFoundCoachPreview(coach);
      } else {
        setSearchError('Bu koda ait onaylı bir eğitim koçu bulunamadı. Lütfen koçunuzdan kodu teyit edin.');
      }
    } catch (err) {
      setSearchError('Sorgulama sırasında bir hata oluştu. Lütfen tekrar deneyin.');
    } finally {
      setIsSearching(false);
    }
  };

  // Link to found coach
  const handleConfirmInitialLink = async () => {
    if (!foundCoachPreview || !user?.uid) return;
    setIsLinking(true);
    try {
      await updateDoc(doc(db, 'users', user.uid), {
        coachId: foundCoachPreview.uid,
        assignedCoachId: foundCoachPreview.uid,
        updatedAt: new Date().toISOString()
      });

      // Send notification to coach if student is not archived
      const isArchived = Boolean(userData?.isArchived || userData?.archived);
      if (!isArchived) {
        try {
          await notificationService.addNotification(foundCoachPreview.uid, {
            title: 'Yeni Öğrenci Eşleşti!',
            message: `${userData?.name || 'Yeni bir öğrenci'} koç kodunuz ile profilini eşleştirdi.`,
            type: 'success',
            link: '/panel/koc/ogrenciler',
            studentId: user.uid
          });
        } catch (notifErr) {
          console.warn('Could not notify coach:', notifErr);
        }
      }

      setFeedbackMessage({
        type: 'success',
        text: `Tebrikler! ${foundCoachPreview.name} başarıyla eğitim koçunuz olarak tanımlandı.`
      });
      setCurrentCoach(foundCoachPreview);
      setFoundCoachPreview(null);
      setInputCode('');
      if (onRefreshUserData) onRefreshUserData();
    } catch (err) {
      console.error('Error linking coach:', err);
      setFeedbackMessage({ type: 'error', text: 'Koç eşleştirilirken bir hata oluştu. Lütfen tekrar deneyin.' });
    } finally {
      setIsLinking(false);
    }
  };

  // Open 2-Step Modal
  const openModal = (mode: 'disconnect' | 'change') => {
    setModalMode(mode);
    setModalStep(1);
    setAgreedToTerms(false);
    setChangeCode('');
    setNewCoachPreview(null);
    setChangeError(null);
    setModalOpen(true);
  };

  // Search new coach inside Modal (for Change mode)
  const handleSearchNewCoach = async () => {
    setChangeError(null);
    setNewCoachPreview(null);
    if (!changeCode.trim()) {
      setChangeError('Lütfen yeni koçun kodunu girin.');
      return;
    }

    setIsSearchingNewCoach(true);
    try {
      const coach = await lookupCoachByCode(changeCode);
      if (!coach) {
        setChangeError('Bu koda ait aktif bir eğitim koçu bulunamadı.');
      } else if (coach.uid === currentCoach?.uid) {
        setChangeError('Girdiğiniz kod zaten şu anki aktif koçunuza aittir. Lütfen farklı bir koç kodu girin.');
      } else {
        setNewCoachPreview(coach);
      }
    } catch (err) {
      setChangeError('Koç sorgulanırken bir sorun oluştu.');
    } finally {
      setIsSearchingNewCoach(false);
    }
  };

  // Handle final confirmation of 2-Step Action
  const handleFinalConfirmAction = async () => {
    if (!user?.uid || !agreedToTerms) return;

    setIsProcessingModal(true);
    try {
      const isArchived = Boolean(userData?.isArchived || userData?.archived);
      const previousBalance = Number(userData?.walletBalance || userData?.balance || 0);

      if (modalMode === 'disconnect') {
        // Disconnect coach and reset wallet balance to 0
        await updateDoc(doc(db, 'users', user.uid), {
          coachId: '',
          assignedCoachId: '',
          walletBalance: 0,
          balance: 0,
          updatedAt: new Date().toISOString()
        });

        // Record balance reset in wallet_transactions if student had balance
        if (previousBalance > 0) {
          try {
            await addDoc(collection(db, 'wallet_transactions'), {
              studentId: user.uid,
              coachId: currentCoach?.uid || '',
              amount: previousBalance,
              type: 'WITHDRAWAL',
              description: 'Koç bağlantısının kesilmesi sebebiyle sistem bakiyesi sıfırlandı. Koça yapılan ödemeler ve bakiye talepleri için lütfen koçunuzla iletişime geçiniz. Sistem bu durumdan hiçbir şekilde sorumlu değildir.',
              date: new Date().toISOString(),
              createdAt: serverTimestamp()
            });
          } catch (e) {
            console.error('Bakiye sıfırlama işlemi kaydedilemedi:', e);
          }
        }

        // Sync local cache immediately so UI shows zero balance
        try {
          const cached = localStorage.getItem('focuson_cached_user_data');
          if (cached) {
            const parsed = JSON.parse(cached);
            parsed.walletBalance = 0;
            parsed.balance = 0;
            parsed.coachId = '';
            parsed.assignedCoachId = '';
            localStorage.setItem('focuson_cached_user_data', JSON.stringify(parsed));
          }
        } catch (e) {}

        // Notify previous coach if student is not archived
        if (currentCoach?.uid && !isArchived) {
          try {
            await notificationService.addNotification(currentCoach.uid, {
              title: 'Öğrenci Bağlantısı Kesildi',
              message: `${userData?.name || 'Bir öğrenci'} koçluk bağlantısını sonlandırdı. Öğrencinin sistem bakiyesi sıfırlandı.`,
              type: 'system',
              link: '/panel/koc/ogrenciler',
              studentId: user.uid
            });
          } catch (e) {}
        }

        setFeedbackMessage({
          type: 'success',
          text: 'Eğitim koçunuzla olan bağlantı kesildi ve sistem bakiyeniz sıfırlandı. Koç ödemeleri ve bakiye talepleri için lütfen koçunuzla iletişime geçiniz.'
        });
        setCurrentCoach(null);
      } else if (modalMode === 'change') {
        if (!newCoachPreview) {
          setChangeError('Lütfen önce geçerli bir yeni koç kodu sorgulayıp onaylayın.');
          setIsProcessingModal(false);
          return;
        }

        // Change coach to new one and reset wallet balance to 0
        await updateDoc(doc(db, 'users', user.uid), {
          coachId: newCoachPreview.uid,
          assignedCoachId: newCoachPreview.uid,
          walletBalance: 0,
          balance: 0,
          updatedAt: new Date().toISOString()
        });

        // Record balance reset in wallet_transactions if student had balance
        if (previousBalance > 0) {
          try {
            await addDoc(collection(db, 'wallet_transactions'), {
              studentId: user.uid,
              coachId: currentCoach?.uid || '',
              amount: previousBalance,
              type: 'WITHDRAWAL',
              description: 'Koç değişikliği sebebiyle önceki koça ait sistem bakiyesi sıfırlandı. Önceki koça yapılan ödemeler ve bakiye talepleri için lütfen koçunuzla iletişime geçiniz. Sistem bu durumdan hiçbir şekilde sorumlu değildir.',
              date: new Date().toISOString(),
              createdAt: serverTimestamp()
            });
          } catch (e) {
            console.error('Bakiye sıfırlama işlemi kaydedilemedi:', e);
          }
        }

        // Sync local cache immediately
        try {
          const cached = localStorage.getItem('focuson_cached_user_data');
          if (cached) {
            const parsed = JSON.parse(cached);
            parsed.walletBalance = 0;
            parsed.balance = 0;
            parsed.coachId = newCoachPreview.uid;
            parsed.assignedCoachId = newCoachPreview.uid;
            localStorage.setItem('focuson_cached_user_data', JSON.stringify(parsed));
          }
        } catch (e) {}

        // Notify both coaches if student is not archived
        if (!isArchived) {
          if (currentCoach?.uid) {
            try {
              await notificationService.addNotification(currentCoach.uid, {
                title: 'Öğrenci Koç Değiştirdi',
                message: `${userData?.name || 'Öğrenciniz'} başka bir koça geçiş yaptı. Sistem bakiyesi sıfırlandı.`,
                type: 'system',
                link: '/panel/koc/ogrenciler',
                studentId: user.uid
              });
            } catch (e) {}
          }

          try {
            await notificationService.addNotification(newCoachPreview.uid, {
              title: 'Yeni Öğrenci Katıldı!',
              message: `${userData?.name || 'Yeni bir öğrenci'} sizin koç kodunuzla eşleşti.`,
              type: 'success',
              link: '/panel/koc/ogrenciler',
              studentId: user.uid
            });
          } catch (e) {}
        }

        setFeedbackMessage({
          type: 'success',
          text: `Eğitim koçunuz başarıyla ${newCoachPreview.name} olarak güncellendi ve sistem bakiyeniz sıfırlandı.`
        });
        setCurrentCoach(newCoachPreview);
      }

      setModalOpen(false);
      if (onRefreshUserData) onRefreshUserData();
    } catch (err) {
      console.error('Error completing action:', err);
      alert('İşlem sırasında bir hata oluştu. Lütfen tekrar deneyiniz.');
    } finally {
      setIsProcessingModal(false);
    }
  };

  return (
    <>
      <div 
        id="student-coach-connection-card"
        className="bg-slate-900/60 backdrop-blur-xl border border-white/10 rounded-3xl p-6 shadow-xl relative overflow-hidden group transition-all duration-300"
      >
        {/* Glow ambient background */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/10 blur-[80px] rounded-full pointer-events-none group-hover:bg-indigo-500/15 transition-colors duration-700"></div>

        {/* Card Header */}
        <div className="flex items-center justify-between pb-4 mb-5 border-b border-white/5 relative z-10">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-indigo-500/20 border border-indigo-500/30 flex items-center justify-center text-indigo-400 shadow-inner">
              <GraduationCap size={22} />
            </div>
            <div>
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                Eğitim Koçum
                {currentCoach && (
                  <span className="flex items-center gap-1 text-[10px] text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded-full font-semibold">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                    Aktif
                  </span>
                )}
              </h3>
              <p className="text-[10px] text-slate-400 font-semibold tracking-wider uppercase">
                {currentCoach ? 'FocusOn Rehberlik Danışmanı' : 'Koç Kodu ile Eşleşme'}
              </p>
            </div>
          </div>
        </div>

        {/* Feedback Banner */}
        {feedbackMessage && (
          <div 
            className={`mb-4 p-3 rounded-2xl text-xs flex items-center justify-between gap-2 border relative z-10 ${
              feedbackMessage.type === 'success' 
                ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300' 
                : 'bg-red-500/10 border-red-500/30 text-red-300'
            }`}
          >
            <span className="flex items-center gap-2">
              {feedbackMessage.type === 'success' ? <CheckCircle2 size={16} /> : <AlertTriangle size={16} />}
              {feedbackMessage.text}
            </span>
            <button 
              onClick={() => setFeedbackMessage(null)}
              className="text-slate-400 hover:text-white transition-colors"
            >
              <X size={14} />
            </button>
          </div>
        )}

        {/* Loading Skeleton */}
        {loadingCoach ? (
          <div className="space-y-3 py-4 animate-pulse relative z-10">
            <div className="h-14 bg-white/5 rounded-2xl"></div>
            <div className="h-8 bg-white/5 rounded-xl w-3/4"></div>
          </div>
        ) : currentCoach ? (
          /* ========================================================================= */
          /* CASE 1: COACH IS CONNECTED (SHOWN ELEGANTLY WITH PHOTO & NAME & ACTIONS)   */
          /* ========================================================================= */
          <div className="space-y-5 relative z-10">
            {/* Elegant Coach Profile Section */}
            <div className="flex items-center gap-4 bg-slate-950/60 p-4 rounded-2xl border border-white/5 shadow-inner">
              {/* Profile Photo / Avatar */}
              <div className="relative shrink-0">
                {currentCoach.photoURL ? (
                  <img 
                    src={currentCoach.photoURL} 
                    alt={currentCoach.name}
                    referrerPolicy="no-referrer"
                    className="w-16 h-16 rounded-2xl object-cover border-2 border-indigo-500/30 shadow-lg shadow-indigo-500/20"
                  />
                ) : (
                  <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-indigo-600 to-violet-500 flex items-center justify-center text-white font-black text-xl shadow-lg shadow-indigo-500/20 border-2 border-indigo-400/30">
                    {currentCoach.name.charAt(0).toUpperCase()}
                  </div>
                )}
                <div className="absolute -bottom-1 -right-1 bg-emerald-500 text-white p-1 rounded-full border-2 border-slate-900 shadow" title="Onaylı Koç">
                  <UserCheck size={10} strokeWidth={3} />
                </div>
              </div>

              {/* Coach Details */}
              <div className="flex-1 min-w-0">
                <h4 className="text-white font-bold text-base sm:text-lg truncate tracking-tight">
                  {currentCoach.name}
                </h4>
                <p className="text-xs text-indigo-300 font-medium truncate mb-1.5">
                  {currentCoach.title}
                </p>
                
                {/* Monospace Code Pill */}
                <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-lg bg-white/5 border border-white/10 text-[11px] font-mono text-slate-300">
                  <span className="text-slate-500 font-sans text-[9px] font-black uppercase">Kod:</span>
                  <span className="font-bold text-white tracking-wide">
                    {currentCoach.coachCode || currentCoach.referralCode || 'ATANMIŞ'}
                  </span>
                </div>
              </div>
            </div>

            {/* Quick Info & Safety Notice */}
            <div className="p-3 bg-blue-500/5 border border-blue-500/10 rounded-2xl text-[11px] text-slate-400 flex items-start gap-2.5">
              <Sparkles size={16} className="text-blue-400 shrink-0 mt-0.5" />
              <p className="leading-relaxed">
                Haftalık çalışma planınız, sınav analizleriniz ve koçluk görüşmeleriniz <span className="text-white font-semibold">{currentCoach.name}</span> rehberliğinde yürütülmektedir.
              </p>
            </div>

            {/* Action Buttons: Koç Değiştir & Bağlantıyı Kes */}
            <div className="grid grid-cols-2 gap-3 pt-1">
              <button
                id="btn-change-coach"
                type="button"
                onClick={() => openModal('change')}
                className="flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-xs font-semibold text-slate-200 hover:text-white transition-all duration-200 active:scale-95"
              >
                <RefreshCw size={14} className="text-amber-400" />
                <span>Koç Değiştir</span>
              </button>

              <button
                id="btn-disconnect-coach"
                type="button"
                onClick={() => openModal('disconnect')}
                className="flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl bg-red-500/10 hover:bg-red-500/20 border border-red-500/20 text-xs font-semibold text-red-400 hover:text-red-300 transition-all duration-200 active:scale-95"
              >
                <UserMinus size={14} />
                <span>Bağlantıyı Kes</span>
              </button>
            </div>
          </div>
        ) : (
          /* ========================================================================= */
          /* CASE 2: NO COACH CONNECTED (INPUT FIELD TO ENTER COACH CODE)              */
          /* ========================================================================= */
          <div className="space-y-4 relative z-10">
            <div className="p-3.5 bg-slate-950/50 border border-white/5 rounded-2xl text-xs text-slate-400 leading-relaxed">
              Eğitim koçunuzun sizinle paylaştığı <span className="text-indigo-300 font-semibold">özel koç kodunu</span> girerek koçunuzla profilinizi anında eşleştirebilirsiniz.
            </div>

            {/* Input Form */}
            <form onSubmit={handleVerifyInitialCode} className="space-y-3">
              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-1 flex items-center justify-between">
                  <span>Koç Kodu</span>
                  <span className="text-[9px] text-slate-500 lowercase font-normal">(Büyük harfe duyarlı)</span>
                </label>
                <div className="relative">
                  <input
                    id="input-coach-code"
                    type="text"
                    value={inputCode}
                    onChange={(e) => {
                      setInputCode(e.target.value.toUpperCase());
                      setSearchError(null);
                    }}
                    placeholder="Örn: NASUH veya KOC1234"
                    className="w-full bg-slate-950/80 border border-white/10 rounded-xl px-4 py-3 text-sm text-white font-mono placeholder:text-slate-600 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 uppercase tracking-wider transition-all"
                  />
                  <button
                    id="btn-verify-coach-code"
                    type="submit"
                    disabled={isSearching || !inputCode.trim()}
                    className="absolute right-1.5 top-1.5 bottom-1.5 px-3.5 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 disabled:pointer-events-none text-white text-xs font-bold rounded-lg flex items-center gap-1.5 transition-all shadow-md shadow-indigo-600/30"
                  >
                    {isSearching ? (
                      <RefreshCw size={14} className="animate-spin" />
                    ) : (
                      <>
                        <Search size={14} />
                        <span>Sorgula</span>
                      </>
                    )}
                  </button>
                </div>
              </div>

              {searchError && (
                <p className="text-xs text-red-400 bg-red-500/10 border border-red-500/20 px-3 py-2 rounded-xl flex items-center gap-2">
                  <AlertTriangle size={14} className="shrink-0" />
                  {searchError}
                </p>
              )}
            </form>

            {/* Coach Preview Card when code verified */}
            <AnimatePresence>
              {foundCoachPreview && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="p-4 bg-indigo-950/30 border border-indigo-500/30 rounded-2xl space-y-3"
                >
                  <div className="flex items-center gap-3">
                    {foundCoachPreview.photoURL ? (
                      <img 
                        src={foundCoachPreview.photoURL} 
                        alt={foundCoachPreview.name}
                        referrerPolicy="no-referrer"
                        className="w-12 h-12 rounded-xl object-cover border border-indigo-400/40"
                      />
                    ) : (
                      <div className="w-12 h-12 rounded-xl bg-indigo-600 flex items-center justify-center text-white font-bold text-lg">
                        {foundCoachPreview.name.charAt(0)}
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <h4 className="text-sm font-bold text-white truncate">
                        {foundCoachPreview.name}
                      </h4>
                      <p className="text-[11px] text-indigo-300 truncate">
                        {foundCoachPreview.title}
                      </p>
                    </div>
                  </div>

                  <button
                    id="btn-confirm-initial-coach"
                    type="button"
                    onClick={handleConfirmInitialLink}
                    disabled={isLinking}
                    className="w-full py-2.5 px-4 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white text-xs font-bold rounded-xl flex items-center justify-center gap-2 shadow-lg shadow-emerald-600/20 transition-all active:scale-98"
                  >
                    {isLinking ? (
                      <RefreshCw size={14} className="animate-spin" />
                    ) : (
                      <>
                        <UserPlus size={15} />
                        <span>Koçu Tanımla ve Eşleş</span>
                      </>
                    )}
                  </button>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        )}
      </div>

      {/* ========================================================================= */}
      {/* 2-STEP CONFIRMATION MODAL FOR DISCONNECT / CHANGE COACH                   */}
      {/* Required: 2 kez uyarı göstererek (abonelikler dahil) onaylama             */}
      {/* ========================================================================= */}
      <AnimatePresence>
        {modalOpen && (
          <div 
            id="coach-management-modal-overlay"
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md overflow-y-auto animate-in fade-in duration-200"
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-slate-900 border border-white/10 rounded-3xl p-6 sm:p-8 max-w-lg w-full shadow-2xl relative overflow-hidden my-8"
            >
              {/* Modal Background Accents */}
              <div className={`absolute top-0 right-0 w-64 h-64 blur-[90px] rounded-full pointer-events-none ${
                modalStep === 2 ? 'bg-red-600/15' : 'bg-amber-600/15'
              }`} />

              {/* Close Button */}
              <button
                id="btn-modal-close"
                type="button"
                onClick={() => setModalOpen(false)}
                className="absolute top-5 right-5 w-8 h-8 rounded-full bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white flex items-center justify-center transition-colors z-20"
              >
                <X size={16} />
              </button>

              {/* Progress Indicator: Step 1 / 2 */}
              <div className="flex items-center gap-2 mb-6">
                <span className={`h-2 flex-1 rounded-full transition-all duration-300 ${
                  modalStep >= 1 ? (modalStep === 2 ? 'bg-amber-500' : 'bg-indigo-500') : 'bg-white/10'
                }`} />
                <span className={`h-2 flex-1 rounded-full transition-all duration-300 ${
                  modalStep === 2 ? 'bg-red-500' : 'bg-white/10'
                }`} />
                <span className="text-[11px] font-black uppercase tracking-wider text-slate-400 pl-2">
                  Adım {modalStep} / 2
                </span>
              </div>

              {/* ================================================================ */}
              {/* STEP 1: FIRST WARNING & DETAILED SUBSCRIPTION IMPACT              */}
              {/* ================================================================ */}
              {modalStep === 1 && (
                <div className="space-y-5">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-2xl bg-amber-500/20 border border-amber-500/30 flex items-center justify-center text-amber-400 shrink-0">
                      <AlertTriangle size={24} />
                    </div>
                    <div>
                      <h3 className="text-lg font-bold text-white">
                        {modalMode === 'disconnect' 
                          ? 'Koç Bağlantısını Kesmek İstiyor Musunuz?' 
                          : 'Eğitim Koçunuzu Değiştirmek Üzeresiniz'}
                      </h3>
                      <p className="text-xs text-amber-400/90 font-medium">
                        1. Aşama Uyarısı: Abonelikler ve Koçluk Süreci
                      </p>
                    </div>
                  </div>

                  {/* Current coach banner */}
                  {currentCoach && (
                    <div className="flex items-center gap-3 p-3 bg-white/5 rounded-2xl border border-white/5">
                      {currentCoach.photoURL ? (
                        <img 
                          src={currentCoach.photoURL} 
                          alt={currentCoach.name}
                          className="w-10 h-10 rounded-xl object-cover" 
                        />
                      ) : (
                        <div className="w-10 h-10 rounded-xl bg-indigo-600 flex items-center justify-center text-white font-bold">
                          {currentCoach.name.charAt(0)}
                        </div>
                      )}
                      <div>
                        <p className="text-[10px] text-slate-400 uppercase font-black">Mevcut Koçunuz</p>
                        <p className="text-sm font-bold text-white">{currentCoach.name}</p>
                      </div>
                    </div>
                  )}

                  {/* Explicit Warnings Container */}
                  <div className="space-y-3">
                    {/* CRITICAL SUBSCRIPTION WARNING */}
                    <div className="p-4 bg-amber-500/10 border border-amber-500/20 rounded-2xl space-y-1.5">
                      <h4 className="text-xs font-bold text-amber-300 flex items-center gap-2">
                        <AlertTriangle size={15} className="text-amber-400 shrink-0" />
                        Abonelikler ve Paketler Hakkında Bilgilendirme
                      </h4>
                      <p className="text-xs text-slate-300 leading-relaxed">
                        Mevcut koçunuza bağlı aktif bir <span className="text-amber-200 font-semibold">koçluk aboneliğiniz</span> veya <span className="text-amber-200 font-semibold">özel paketiniz</span> bulunuyorsa; 
                        bağlantıyı kesmeniz durumunda bu haklar dondurulabilir ve mevcut koçun sunduğu hizmet hakları sonlanır. 
                        {modalMode === 'change' && ' Yeni koçunuzun ücret tarifesi farklı olabilir ve mevcut abonelik paketiniz yeni koça otomatik devredilmeyebilir.'}
                      </p>
                    </div>

                    {/* APPOINTMENTS & SCHEDULE WARNING */}
                    <div className="p-3.5 bg-slate-950/60 border border-white/5 rounded-2xl text-xs text-slate-400 space-y-1">
                      <p className="font-semibold text-slate-300">Randevular ve Çalışma Takvimi:</p>
                      <p className="leading-relaxed">
                        Mevcut koçunuzla olan planlanmış gelecek randevularınız ve koçunuzun sizin için oluşturduğu özel çalışma takvimi geçersiz kılınacaktır.
                      </p>
                    </div>

                    {/* CRITICAL BALANCE & COACH PAYMENT DISCLAIMER (USER MANDATE) */}
                    <div className="p-4 bg-rose-500/10 border border-rose-500/30 rounded-2xl space-y-3 text-xs">
                      <div className="flex items-center justify-between">
                        <h4 className="text-xs font-bold text-rose-300 flex items-center gap-2">
                          <Wallet size={15} className="text-rose-400 shrink-0" />
                          Koç Ödemeleri, Bakiye Durumu ve Sorumluluk Reddi
                        </h4>
                        <span className="px-2 py-0.5 rounded-md bg-rose-500/20 text-rose-300 text-[10px] font-bold uppercase tracking-wider">
                          Kritik Hüküm
                        </span>
                      </div>

                      {/* Current Balance Status Visual */}
                      <div className="bg-slate-950/80 p-3 rounded-xl border border-rose-500/20 flex items-center justify-between text-xs">
                        <div>
                          <span className="text-slate-400 block text-[10px] uppercase font-bold tracking-wider">Mevcut Sistem Bakiyeniz</span>
                          <span className="font-bold text-amber-400 font-mono text-sm">₺{currentBalance.toLocaleString('tr-TR')}</span>
                        </div>
                        <div className="text-right">
                          <span className="text-rose-400 block text-[10px] uppercase font-bold tracking-wider">İşlem Sonrası Bakiye</span>
                          <span className="font-mono text-sm font-bold text-rose-400">₺0 (SIFIRLANACAK)</span>
                        </div>
                      </div>

                      <div className="space-y-2 text-xs text-slate-300 leading-relaxed">
                        <div className="flex items-start gap-2">
                          <span className="w-1.5 h-1.5 rounded-full bg-rose-400 shrink-0 mt-1.5" />
                          <p>
                            <strong className="text-white">Bakiyeniz Sıfırlanacaktır:</strong> Bu işlem tamamlandığında sistem içerisindeki mevcut cüzdan bakiyeniz <strong className="text-rose-400">tamamen sıfırlanacaktır</strong>.
                          </p>
                        </div>
                        <div className="flex items-start gap-2">
                          <span className="w-1.5 h-1.5 rounded-full bg-amber-400 shrink-0 mt-1.5" />
                          <p>
                            <strong className="text-white">Koç ile İletişim Zorunluluğu:</strong> Koçunuza daha önce yapmış olduğunuz tüm ödemeler, ücret iadesi talepleri, seans mahsuplaşmaları veya mevcut bakiye durumu için <strong className="text-amber-300 font-semibold">bizzat koçunuzla iletişime geçmeniz gerekmektedir</strong>.
                          </p>
                        </div>
                        <div className="flex items-start gap-2">
                          <span className="w-1.5 h-1.5 rounded-full bg-rose-400 shrink-0 mt-1.5" />
                          <p>
                            <strong className="text-white">Sistemin Sorumsuzluğu:</strong> FocusOn Akademi platformu (sistemimiz), koçunuza yapılan ödemelerden, aranızdaki finansal mutabakatlardan veya mevcut bakiye durumunuzdan <strong className="text-rose-300 underline font-semibold">hiçbir şekilde sorumlu değildir</strong>.
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Step 1 Actions */}
                  <div className="flex gap-3 pt-2">
                    <button
                      type="button"
                      onClick={() => setModalOpen(false)}
                      className="flex-1 py-3 px-4 rounded-xl bg-white/5 hover:bg-white/10 text-slate-300 text-xs font-semibold transition-colors"
                    >
                      Vazgeç
                    </button>
                    <button
                      id="btn-step1-proceed"
                      type="button"
                      onClick={() => setModalStep(2)}
                      className="flex-1 py-3 px-4 rounded-xl bg-amber-600 hover:bg-amber-500 text-white text-xs font-bold flex items-center justify-center gap-2 shadow-lg shadow-amber-600/30 transition-all"
                    >
                      <span>Riskleri ve Şartları Anladım, 2. Aşamaya Geç</span>
                      <ArrowRight size={14} />
                    </button>
                  </div>
                </div>
              )}

              {/* ================================================================ */}
              {/* STEP 2: SECOND WARNING & FINAL IRREVERSIBLE CONFIRMATION          */}
              {/* ================================================================ */}
              {modalStep === 2 && (
                <div className="space-y-5">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-2xl bg-red-500/20 border border-red-500/30 flex items-center justify-center text-red-400 shrink-0">
                      <ShieldAlert size={24} />
                    </div>
                    <div>
                      <h3 className="text-lg font-bold text-white">
                        {modalMode === 'disconnect' 
                          ? 'Son Onay: Koç Bağlantısını Tamamen Kes' 
                          : 'Son Onay: Yeni Koç Kodu ile Değiştir'}
                      </h3>
                      <p className="text-xs text-red-400 font-semibold">
                        2. Aşama: Bu işlem geri alınamaz!
                      </p>
                    </div>
                  </div>

                  {/* If Mode is Change: Input for the new coach code with validation */}
                  {modalMode === 'change' && (
                    <div className="space-y-3 p-4 bg-slate-950/80 border border-white/10 rounded-2xl">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">
                        Yeni Koçunuzun Kodunu Girin:
                      </label>
                      <div className="flex gap-2">
                        <input
                          id="input-new-coach-code"
                          type="text"
                          value={changeCode}
                          onChange={(e) => {
                            setChangeCode(e.target.value.toUpperCase());
                            setChangeError(null);
                          }}
                          placeholder="Yeni Koç Kodu (Örn: NASUH)"
                          className="flex-1 bg-slate-900 border border-white/10 rounded-xl px-3.5 py-2.5 text-sm text-white font-mono uppercase focus:outline-none focus:border-indigo-500"
                        />
                        <button
                          type="button"
                          onClick={handleSearchNewCoach}
                          disabled={isSearchingNewCoach || !changeCode.trim()}
                          className="px-4 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white text-xs font-bold rounded-xl flex items-center gap-1.5 transition-all"
                        >
                          {isSearchingNewCoach ? <RefreshCw size={14} className="animate-spin" /> : 'Doğrula'}
                        </button>
                      </div>

                      {changeError && (
                        <p className="text-xs text-red-400 flex items-center gap-1.5 pt-1">
                          <AlertTriangle size={13} /> {changeError}
                        </p>
                      )}

                      {/* New Coach Match Card */}
                      {newCoachPreview && (
                        <div className="p-3 bg-indigo-950/40 border border-indigo-500/30 rounded-xl flex items-center gap-3 mt-2">
                          {newCoachPreview.photoURL ? (
                            <img src={newCoachPreview.photoURL} alt={newCoachPreview.name} className="w-10 h-10 rounded-lg object-cover" />
                          ) : (
                            <div className="w-10 h-10 rounded-lg bg-indigo-600 flex items-center justify-center text-white font-bold text-sm">
                              {newCoachPreview.name.charAt(0)}
                            </div>
                          )}
                          <div>
                            <p className="text-[10px] text-emerald-400 font-bold uppercase">Yeni Koçunuz Olarak Atanacak</p>
                            <p className="text-sm font-bold text-white">{newCoachPreview.name}</p>
                            <p className="text-xs text-slate-400">{newCoachPreview.title}</p>
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Red Final Warning Box with explicit Balance Reset & Disclaimer */}
                  <div className="p-4 bg-red-950/60 border border-red-500/30 rounded-2xl text-xs text-slate-300 space-y-2.5">
                    <p className="font-bold text-red-300 flex items-center gap-1.5">
                      <ShieldAlert size={15} className="text-red-400 shrink-0" />
                      Son Hatırlatma: Bakiye Sıfırlama ve Yasal Sorumluluk Reddi
                    </p>
                    <p className="leading-relaxed text-[11px]">
                      Onayladığınız anda sistem içerisindeki <strong className="text-amber-300">₺{currentBalance.toLocaleString('tr-TR')}</strong> bakiyeniz derhal <strong className="text-rose-400">₺0 olarak sıfırlanacaktır</strong>. Mevcut koçunuz <span className="text-white font-semibold">{currentCoach?.name}</span> ile olan tüm yetki, randevu ve aktif koçluk takibiniz kalıcı olarak sonlandırılır.
                    </p>
                    <div className="p-2.5 bg-red-500/10 border border-red-500/20 rounded-xl text-[11px] text-red-200 leading-relaxed">
                      <strong>Zorunlu Bildirim:</strong> Koça yaptığınız ödemeler ve bakiye talepleri için doğrudan koçunuzla iletişime geçmeniz gerekmektedir. <strong>Sistem bu durumdan hiçbir şekilde sorumlu değildir.</strong>
                    </div>
                  </div>

                  {/* Mandatory Checkbox */}
                  <label className="flex items-start gap-3 p-3.5 bg-red-500/10 border border-red-500/30 rounded-2xl cursor-pointer hover:bg-red-500/15 transition-colors">
                    <input
                      id="checkbox-final-warning"
                      type="checkbox"
                      checked={agreedToTerms}
                      onChange={(e) => setAgreedToTerms(e.target.checked)}
                      className="mt-0.5 w-4 h-4 rounded text-red-600 focus:ring-red-500 focus:ring-offset-slate-900 bg-slate-950 border-white/20 shrink-0"
                    />
                    <span className="text-xs text-slate-200 font-medium leading-relaxed select-none">
                      Koça yaptığım ödemeler ve mevcut bakiye durumu için <strong className="text-amber-300">koçumla iletişime geçmem gerektiğini</strong>, sistemin bu durumdan <strong className="text-rose-300">hiçbir şekilde sorumlu olmadığını</strong>, sistem içerisindeki <strong className="text-rose-300">bakiyemin sıfırlanacağını</strong> ve tüm abonelik haklarımın etkileneceğini kabul ve beyan ediyorum.
                    </span>
                  </label>

                  {/* Step 2 Actions */}
                  <div className="flex gap-3 pt-2">
                    <button
                      type="button"
                      disabled={isProcessingModal}
                      onClick={() => setModalStep(1)}
                      className="flex-1 py-3 px-4 rounded-xl bg-white/5 hover:bg-white/10 text-slate-300 text-xs font-semibold transition-colors"
                    >
                      Geri Dön
                    </button>

                    <button
                      id="btn-final-confirm-submit"
                      type="button"
                      disabled={
                        !agreedToTerms || 
                        isProcessingModal || 
                        (modalMode === 'change' && !newCoachPreview)
                      }
                      onClick={handleFinalConfirmAction}
                      className={`flex-1 py-3 px-4 rounded-xl text-white text-xs font-bold flex items-center justify-center gap-2 shadow-lg transition-all active:scale-98 disabled:opacity-40 disabled:pointer-events-none ${
                        modalMode === 'disconnect'
                          ? 'bg-red-600 hover:bg-red-500 shadow-red-600/30'
                          : 'bg-emerald-600 hover:bg-emerald-500 shadow-emerald-600/30'
                      }`}
                    >
                      {isProcessingModal ? (
                        <RefreshCw size={15} className="animate-spin" />
                      ) : (
                        <>
                          <Check size={15} strokeWidth={2.5} />
                          <span>
                            {modalMode === 'disconnect' ? 'Evet, Bağlantıyı Kes' : 'Onayla ve Yeni Koça Geç'}
                          </span>
                        </>
                      )}
                    </button>
                  </div>
                </div>
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
}
