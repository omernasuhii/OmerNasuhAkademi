import React, { useState, useEffect } from 'react';
import { useAuth } from '../lib/AuthContext';
import { sendEmailVerification, RecaptchaVerifier, linkWithPhoneNumber } from 'firebase/auth';
import { Mail, RefreshCw, LogOut, CheckCircle, Phone, Smartphone, AlertCircle, MessageCircle, QrCode, Loader2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { auth, db } from '../lib/firebase';
import { doc, updateDoc } from 'firebase/firestore';
import { WhatsAppFallbackHelp } from '../components/WhatsAppFallbackHelp';

declare global {
  interface Window {
    recaptchaVerifier: any;
    confirmationResult: any;
  }
}

export default function Verification() {
  const { user, userData, systemSettings, logout } = useAuth();
  const navigate = useNavigate();
  
  const [sending, setSending] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const [verificationStep, setVerificationStep] = useState<'email' | 'phone' | 'done'>('email');
  const [otpSent, setOtpSent] = useState(false);
  const [otpCode, setOtpCode] = useState('');

  // WhatsApp states
  const [generatedCode, setGeneratedCode] = useState('');
  const [showPolicyFallback, setShowPolicyFallback] = useState(false);
  const activeWhatsappNumber = systemSettings?.whatsappNumber || '905454487886';
  const [simulatedNotification, setSimulatedNotification] = useState<string | null>(null);
  const [hasApiError, setHasApiError] = useState(false);

  useEffect(() => {
    if (userData) {
      if (!userData.phoneVerified) {
        setVerificationStep('phone');
      } else if (user && !user.emailVerified) {
        setVerificationStep('email');
      } else {
        setVerificationStep('done');
        navigate('/');
      }
    }
  }, [userData, user, navigate]);

  const [emailCountdown, setEmailCountdown] = useState(60);

  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (verificationStep === 'email' && emailCountdown > 0) {
      timer = setTimeout(() => setEmailCountdown((prev) => prev - 1), 1000);
    }
    return () => clearTimeout(timer);
  }, [verificationStep, emailCountdown]);

  // Otomatik E-Posta Onay Dinleyicisi
  useEffect(() => {
    let intervalId: NodeJS.Timeout;
    if (user && verificationStep === 'email') {
      intervalId = setInterval(async () => {
        try {
          await user.reload();
          if (user.emailVerified) {
            clearInterval(intervalId);
            setMessage('');
            setError('');
            if (!user.phoneNumber && !userData?.phoneVerified && !userData?.verificationDeferred) {
              setVerificationStep('phone');
            } else {
              setVerificationStep('done');
              navigate('/');
            }
          }
        } catch (e) {
          console.error("Auto check email error:", e);
        }
      }, 2500);
    }
    return () => clearInterval(intervalId);
  }, [user, verificationStep, userData, navigate]);

  const handleResendEmail = async () => {
    if (!user || emailCountdown > 0) return;
    setSending(true);
    setMessage('');
    setError('');
    
    try {
      const actionCodeSettings = {
        url: window.location.origin + '/dogrulama',
        handleCodeInApp: false,
      };
      await sendEmailVerification(user, actionCodeSettings);
      setEmailCountdown(60);
      setMessage('Doğrulama e-postası tekrar gönderildi. Lütfen gelen kutunuzu kontrol edin.');
    } catch (err: any) {
      if (err.code === 'auth/too-many-requests') {
        setError('Çok fazla istek gönderdiniz. Lütfen biraz bekleyip tekrar deneyin.');
      } else {
        setError('E-posta gönderilirken bir hata oluştu: ' + err.message);
      }
    } finally {
      setSending(false);
    }
  };

  const handleCheckEmail = async () => {
    if (user) {
      await user.reload();
      if (user.emailVerified) {
        setMessage('');
        setError('');
        if (!user.phoneNumber && !userData?.phoneVerified) {
          setVerificationStep('phone');
        } else {
          setVerificationStep('done');
          navigate('/');
        }
      } else {
        setError('E-postanız henüz doğrulanmamış. Lütfen e-postanızı kontrol edin.');
      }
    }
  };

  const handleSendOTP = async () => {
    if (!user || !userData?.phone) {
      setError('Sistemde kayıtlı geçerli bir telefon numarası bulunamadı.');
      return;
    }
    
    setSending(true);
    setError('');
    setMessage('');
    setSimulatedNotification(null);
    setHasApiError(false);

    try {
      const apiResponse = await fetch("/api/twilio-verify-send", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          phone: userData.phone
        })
      });

      const resData = await apiResponse.json();

      if (apiResponse.ok && resData.success) {
        setOtpSent(true);
        if (resData.simulated) {
          setGeneratedCode(resData.code || "123456");
          setMessage(`[Simülasyon Modu] Kod ${resData.phone} numarasına simüle edildi.`);
          setSimulatedNotification(`FocusON Akademi SMS doğrulama kodunuz: ${resData.code || "123456"}`);
        } else {
          setMessage(`Doğrulama kodu ${resData.phone} numaralı telefona SMS ile başarıyla gönderildi.`);
        }
      } else {
        setHasApiError(true);
        throw new Error(resData.error || "Sunucu doğrulama kodunu gönderemedi.");
      }
    } catch (err: any) {
      console.error(err);
      setHasApiError(true);
      setError('Doğrulama kodu gönderilirken bir hata oluştu: ' + (err.message || 'Bilinmeyen Hata'));
    } finally {
      setSending(false);
    }
  };

  const handleDeferVerification = async () => {
    if (!user) return;
    setSending(true);
    setError('');
    try {
      await updateDoc(doc(db, 'users', user.uid), {
        verificationDeferred: true
      });
      setMessage('Doğrulama geçici olarak ertelendi. Yönlendiriliyorsunuz...');
      setTimeout(() => {
        navigate('/');
      }, 1500);
    } catch (err: any) {
      console.error(err);
      setError('Erteleme işlemi sırasında bir hata oluştu: ' + err.message);
    } finally {
      setSending(false);
    }
  };

  const handleVerifyOTP = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!otpCode || otpCode.length < 6) return;
    
    setSending(true);
    setError('');
    
    try {
      const apiResponse = await fetch("/api/twilio-verify-check", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          phone: userData?.phone,
          code: otpCode,
          uid: user?.uid
        })
      });

      const resData = await apiResponse.json();

      if (apiResponse.ok && resData.success) {
        if (user?.uid) {
          await updateDoc(doc(db, 'users', user.uid), {
            phoneVerified: true,
            verificationDeferred: false
          });
        }
        setMessage('Telefon numaranız başarıyla doğrulandı!');
        setSimulatedNotification(null);
        setTimeout(() => {
          navigate('/');
        }, 1500);
      } else {
        setError(resData.error || 'Girdiğiniz doğrulama kodu hatalı veya süresi dolmuş.');
      }
    } catch (err: any) {
      console.error(err);
      setError('Doğrulama sırasında bir hata oluştu: ' + err.message);
    } finally {
      setSending(false);
    }
  };

  const handleLogout = async () => {
    await logout();
    navigate('/giris');
  };

  return (
    <div className="min-h-screen pt-24 pb-12 flex items-center justify-center px-4">
      <div className="max-w-md w-full bg-slate-900 border border-white/10 rounded-2xl p-8 text-center relative z-10 transition-all">
        <div id="recaptcha-container"></div>
        
        {verificationStep === 'email' && (
          <>
            <div className="w-20 h-20 bg-amber-500/20 text-amber-500 rounded-full flex items-center justify-center mx-auto mb-6">
              <Mail size={40} />
            </div>
            
            <h2 className="text-2xl font-bold text-white mb-2">E-posta Doğrulaması</h2>
            <p className="text-slate-400 mb-6 text-sm">
              Hesabınızı güvene almak ve işlemlere devam edebilmek için <strong className="text-white">{user?.email}</strong> adresine gönderdiğimiz bağlantıya tıklayarak e-postanızı doğrulayın.
            </p>

            {message && (
              <div className="mb-6 p-4 bg-emerald-500/10 border border-emerald-500/30 rounded-xl flex items-start gap-3 text-emerald-400 text-sm md:text-left">
                <CheckCircle size={18} className="shrink-0 mt-0.5" />
                <p>{message}</p>
              </div>
            )}

            {error && (
              <div className="mb-6 p-4 bg-red-500/10 border border-red-500/30 rounded-xl flex items-start gap-3 text-red-400 text-sm md:text-left">
                 <AlertCircle size={18} className="shrink-0 mt-0.5" />
                 <p>{error}</p>
              </div>
            )}

            <div className="space-y-4">
              <div className="p-4 bg-amber-500/10 border border-amber-500/30 rounded-xl flex items-center justify-center gap-2 text-amber-400 font-semibold text-sm">
                <Loader2 size={18} className="animate-spin" />
                E-Posta Doğrulaması Bekleniyor...
              </div>
              
              <button 
                onClick={handleResendEmail}
                disabled={sending || emailCountdown > 0}
                className="w-full bg-slate-800 hover:bg-slate-700 disabled:bg-slate-800/40 text-slate-300 disabled:text-slate-500 py-3 rounded-xl font-medium transition-all flex items-center justify-center gap-2 text-sm"
              >
                {sending ? (
                  <>
                    <Loader2 size={16} className="animate-spin" />
                    Gönderiliyor...
                  </>
                ) : emailCountdown > 0 ? (
                  <>
                    <RefreshCw size={16} />
                    Tekrar E-Posta Gönder ({emailCountdown}s)
                  </>
                ) : (
                  <>
                    <RefreshCw size={16} />
                    Tekrar E-Posta Gönder
                  </>
                )}
              </button>
            </div>
          </>
        )}

        {verificationStep === 'phone' && (
          <>
            <div className="w-20 h-20 bg-emerald-500/20 text-emerald-400 rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg shadow-emerald-500/10">
              <Smartphone size={40} />
            </div>
            
            <h2 className="text-2xl font-bold text-white mb-2">Telefon / WhatsApp Doğrulama</h2>
            <p className="text-slate-400 mb-6 text-sm">
              Güvenliğiniz için lütfen sistemde kayıtlı <strong className="text-white">{userData?.phone}</strong> numaranıza göndereceğimiz WhatsApp doğrulama kodunu onaylayın.
            </p>

            {simulatedNotification && (
              <div className="mb-6 p-4 bg-emerald-500/10 border border-emerald-500/30 rounded-xl text-left space-y-1.5 animate-in fade-in duration-300">
                <span className="text-[10px] text-emerald-400 font-bold uppercase tracking-wider block">📱 SİMÜLASYON / TEST MODU (Twilio Verify):</span>
                <p className="text-xs text-slate-200">
                  Gönderilen Mesaj: <strong className="text-emerald-400 font-mono select-all bg-emerald-950/50 px-2 py-0.5 rounded block mt-1">{simulatedNotification}</strong>
                </p>
                <span className="text-[9px] text-slate-400 block mt-1">Gerçek doğrulama gönderimini etkinleştirmek için Twilio API anahtarlarınızı panel ayarlarından giriniz.</span>
              </div>
            )}

            {message && (
              <div className="mb-6 p-4 bg-emerald-500/10 border border-emerald-500/30 rounded-xl flex items-start gap-3 text-emerald-400 text-sm md:text-left">
                <CheckCircle size={18} className="shrink-0 mt-0.5" />
                <p>{message}</p>
              </div>
            )}

            {error && (
              <div className="mb-6 p-4 bg-red-500/10 border border-red-500/30 rounded-xl flex flex-col gap-3 text-red-400 text-sm md:text-left">
                 <div className="flex items-start gap-3">
                   <AlertCircle size={18} className="shrink-0 mt-0.5" />
                   <p>{error}</p>
                 </div>
              </div>
            )}

            {!otpSent ? (
               <button 
                  onClick={handleSendOTP}
                  disabled={sending}
                  className="w-full bg-emerald-600 hover:bg-emerald-500 text-white py-3.5 rounded-xl font-bold transition-all flex items-center justify-center gap-2 shadow-lg shadow-emerald-600/20 active:scale-[0.98]"
               >
                  <Smartphone size={18} />
                  {sending ? 'Gönderiliyor...' : 'WhatsApp ile Kod Gönder'}
               </button>
            ) : (
               <form onSubmit={handleVerifyOTP} className="space-y-4 animate-in fade-in duration-300">
                  <div>
                    <input 
                      type="text" 
                      value={otpCode}
                      onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, ''))}
                      maxLength={6}
                      placeholder="6 Haneli Kod"
                      className="w-full bg-slate-950 border border-white/10 text-white text-center text-xl tracking-[0.5em] rounded-xl py-4 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    />
                  </div>
                  <button 
                    type="submit"
                    disabled={sending || otpCode.length < 6}
                    className="w-full bg-emerald-600 hover:bg-emerald-500 text-white py-3 rounded-xl font-bold transition-all disabled:opacity-50"
                  >
                    {sending ? 'Doğrulanıyor...' : 'Onayla ve Tamamla'}
                  </button>
                  <p className="text-sm text-slate-500 mt-4 cursor-pointer hover:text-white transition-colors" onClick={() => { setOtpSent(false); setSimulatedNotification(null); }}>
                    Kodu alamadınız mı? Tekrar gönder
                  </p>
               </form>
            )}

            {otpSent && (
              <WhatsAppFallbackHelp
                phone={userData?.phone || ""}
                onCodeSent={(data) => {
                  if (data?.simulated) {
                    setSimulatedNotification(`FocusON Akademi SMS doğrulama kodunuz (Simüle Edildi): ${data.code || "123456"}`);
                  }
                }}
              />
            )}

            {/* Twilio Policy Fallback Section */}
            <div className="mt-8 pt-6 border-t border-white/10 text-left">
              <button
                type="button"
                onClick={() => setShowPolicyFallback(!showPolicyFallback)}
                className="w-full flex items-center justify-between text-slate-400 hover:text-white text-sm font-medium transition-colors"
              >
                <span>SMS Kodu Gelmiyor mu?</span>
                <span className="text-xs text-emerald-400 font-semibold">{showPolicyFallback ? 'Gizle' : 'Çözüm Göster'}</span>
              </button>
              
              {showPolicyFallback && (
                <div className="mt-4 p-4 bg-slate-950 border border-white/5 rounded-xl space-y-4 animate-in fade-in slide-in-from-top-2 duration-300">
                  <p className="text-xs text-slate-400 leading-relaxed leading-normal">
                    SMS teslimatlarında operatör kaynaklı gecikmeler yaşanabilir. Kodunuzu almadıysanız lütfen aşağıdaki adımları kontrol edin:
                  </p>
                  
                  <ul className="text-xs text-slate-400 list-disc pl-4 space-y-1.5">
                    <li>Telefon numaranızın doğru kaydedildiğinden emin olun (<strong className="text-white">{userData?.phone}</strong>).</li>
                    <li>Telefonunuzun şebeke çekim gücünün yerinde olduğunu doğrulayın.</li>
                    <li>Yurtdışı veya kurumsal SMS engelleme servislerinizin kapalı olduğundan emin olun.</li>
                  </ul>
                </div>
              )}
            </div>

            {/* Bakiye yetersizliği veya API hatası durumunda geçici erteleme seçeneği */}
            {hasApiError && (
              <div className="mt-4 border-t border-white/5 pt-4 animate-in fade-in duration-300">
                <button
                  type="button"
                  onClick={handleDeferVerification}
                  disabled={sending}
                  className="w-full bg-slate-800 hover:bg-slate-700/80 border border-white/10 text-slate-300 py-3 rounded-xl text-sm font-semibold transition-all flex items-center justify-center gap-2 shadow-inner"
                >
                  Doğrulamayı Geçici Olarak Ertele
                </button>
                <p className="text-[10px] text-slate-500 mt-1.5 leading-relaxed text-center">
                  Twilio Verify servislerindeki geçici bir bakiye yetersizliği veya kesintide sistemi kilitlememek adına doğrulamayı erteleyebilirsiniz. İlk başarılı doğrulamada sistem doğrulama durumunuzu kontrol edecektir.
                </p>
              </div>
            )}
          </>
        )}

        <button 
          onClick={handleLogout}
          className="w-full mt-6 text-red-400 hover:text-red-300 py-2.5 font-medium transition-all flex items-center justify-center gap-2 border-t border-white/5 pt-4"
        >
          <LogOut size={18} />
          Çıkış Yap
        </button>
      </div>
    </div>
  );
}
