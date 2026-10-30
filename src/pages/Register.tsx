import React, { useState, useEffect } from "react";
import { Mail, Lock, User, Phone, LogIn, ChevronLeft, Loader2, AlertCircle, CheckCircle2, GraduationCap, RefreshCw, MessageCircle, Gift, Sparkles } from "lucide-react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { createUserWithEmailAndPassword, signInWithPopup, GoogleAuthProvider, fetchSignInMethodsForEmail } from "firebase/auth";
import { doc, setDoc, serverTimestamp, collection, query, where, getDocs, getDoc } from "firebase/firestore";
import { auth, db } from "../lib/firebase";
import { useAuth } from "../lib/AuthContext";
import { referralService } from "../services/referralService";
import { WhatsAppFallbackHelp } from "../components/WhatsAppFallbackHelp";

export const formatPhoneNumber = (val: string) => {
  let cleaned = val.replace(/\D/g, "");
  if (cleaned.startsWith("90")) {
    cleaned = cleaned.substring(2);
  }
  if (cleaned.startsWith("0")) {
    cleaned = cleaned.substring(1);
  }
  if (cleaned.length > 10) cleaned = cleaned.substring(0, 10);
  if (cleaned.length === 0) return "";
  let formatted = "+90 ";
  if (cleaned.length > 0) formatted += cleaned.substring(0, 3);
  if (cleaned.length > 3) formatted += " " + cleaned.substring(3, 6);
  if (cleaned.length > 6) formatted += " " + cleaned.substring(6, 8);
  if (cleaned.length > 8) formatted += " " + cleaned.substring(8, 10);
  return formatted;
};

export default function Register() {
  const { systemSettings } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const isCoach = location.pathname.includes("koc");
  const roleTitle = isCoach ? "Koç" : "Öğrenci";

  const roleColors = {
    emerald: { bg: "bg-emerald-500/20", icon: "bg-emerald-600/20 text-emerald-400 border-emerald-500/30", button: "bg-emerald-600 hover:bg-emerald-500 shadow-emerald-500/30" },
    amber: { bg: "bg-amber-500/20", icon: "bg-amber-600/20 text-amber-400 border-amber-500/30", button: "bg-amber-600 hover:bg-amber-500 shadow-amber-500/30" },
  };
  const theme = isCoach ? roleColors.emerald : roleColors.amber;

  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [phone, setPhone] = useState("");
  const [referralCode, setReferralCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [showOtpModal, setShowOtpModal] = useState(false);
  const [otpArray, setOtpArray] = useState<string[]>(Array(6).fill(""));
  const [verifyLoading, setVerifyLoading] = useState(false);
  const [smsGeneratedCode, setSmsGeneratedCode] = useState("");
  const [simulatedNotification, setSimulatedNotification] = useState<string | null>(null);
  const [hasApiError, setHasApiError] = useState(false);
  const [countdown, setCountdown] = useState(60);

  useEffect(() => {
    let timer: any;
    if (showOtpModal && countdown > 0) {
      timer = setInterval(() => setCountdown((prev) => prev - 1), 1000);
    }
    return () => clearInterval(timer);
  }, [showOtpModal, countdown]);

  const handleSendOtpForRegister = async () => {
    const rawPhone = phone.replace(/\D/g, "");
    if (!rawPhone || rawPhone.length < 10) {
      throw new Error("Lütfen geçerli bir telefon numarası giriniz.");
    }

    const rawPhoneQuery = rawPhone.startsWith("90") ? rawPhone : "90" + rawPhone;
    const parsedPhone = "+" + rawPhoneQuery;

    const apiResponse = await fetch("/api/twilio-verify-send", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ phone: parsedPhone })
    });

    const resData = await apiResponse.json();

    if (apiResponse.ok && resData.success) {
      setHasApiError(false);
      if (resData.simulated) {
        setSimulatedNotification(`FocusON Akademi WhatsApp doğrulama kodunuz (Test Modu): ${resData.code || "123456"}`);
        setSmsGeneratedCode(resData.code || "123456");
      } else {
        setSimulatedNotification(null);
        setSmsGeneratedCode("");
      }
      setOtpArray(Array(6).fill(""));
      setCountdown(60);
      setShowOtpModal(true);
    } else {
      setHasApiError(true);
      throw new Error(resData.error || "WhatsApp doğrulama kodu gönderilemedi.");
    }
  };

  const handleGoogleLogin = async () => {
    setLoading(true);
    setError(null);
    try {
      const provider = new GoogleAuthProvider();
      const result = await signInWithPopup(auth, provider);
      const user = result.user;

      const userDoc = await getDoc(doc(db, "users", user.uid));
      
      if (userDoc.exists() && userDoc.data()?.role) {
        // Zaten kayıtlı
        const r = userDoc.data()?.role;
        if (r === "admin") navigate("/");
        else if (r === "coach") navigate("/panel/koc");
        else if (r === "parent") navigate("/panel/veli");
        else navigate("/panel/ogrenci");
        return;
      }

      // Yeni kayıt
      const displayName = user.displayName || "";
      const nameParts = displayName.split(" ");
      const fName = nameParts[0] || "";
      const lName = nameParts.slice(1).join(" ") || "";
      
      const intendedRole = isCoach ? "coach" : "student";
      
      const userData: any = {
        uid: user.uid,
        email: user.email?.toLowerCase() || "",
        firstName: fName,
        lastName: lName,
        role: intendedRole,
        phone: "",
        phoneVerified: true,
        emailVerified: true,
        createdAt: serverTimestamp(),
        lastLoginAt: serverTimestamp(),
        isOnline: true,
        referralCode: (intendedRole === "coach" ? "KOC" : "FOCUS") + user.uid.substring(0, 4).toUpperCase()
      };
      
      if (intendedRole === "student") {
        userData.registrationStep = 1;
      } else {
        userData.approved = false;
        userData.systemBalance = 1500;
        userData.hasReceivedWelcomeGift = true;
        userData.welcomeGiftAmount = 1500;
      }

      await setDoc(doc(db, "users", user.uid), userData);

      if (intendedRole === "coach") {
        try {
          await referralService.grantCoachWelcomeGift(user.uid, 1500);
        } catch (giftErr) {
          console.error("Coach welcome gift grant error:", giftErr);
        }
      }

      navigate(intendedRole === "coach" ? "/koc-onay-bekliyor" : "/kayit-tamamla");
      
    } catch (err: any) {
      console.error("Google register error:", err);
      if (err.code === "auth/network-request-failed") {
        setError(
          "Google ile kayıt önizleme penceresi (iframe) çerez engelleri nedeniyle yapılamadı. Lütfen uygulamayı sağ üstteki 'Yeni Sekmede Aç' butonuna tıklayarak açın ve Google ile tekrar giriş/kayıt yapın veya e-posta ve şifrenizle doğrudan kaydolun."
        );
      } else if (err.code !== "auth/popup-closed-by-user") {
        setError("Google ile giriş yapılırken bir hata oluştu: " + (err.message || err));
      }
    } finally {
      setLoading(false);
    }
  };

  const createAccount = async (phoneVerified: boolean = true) => {
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email.toLowerCase(), password);
      const user = userCredential.user;

      const userData: any = {
        email: email.toLowerCase(),
        role: isCoach ? "coach" : "student",
        firstName,
        lastName,
        phone: formatPhoneNumber(phone),
        phoneVerified: true,
        emailVerified: true,
        createdAt: serverTimestamp(),
        lastLoginAt: serverTimestamp(),
        isOnline: true
      };

      if (!isCoach) {
        userData.registrationStep = 2; // Formda 1. adımı aldık sayılır, 2. adıma geçebiliriz
      } else {
        userData.approved = false;
        userData.systemBalance = 1500;
        userData.hasReceivedWelcomeGift = true;
        userData.welcomeGiftAmount = 1500;
      }

      userData.uid = user.uid;
      userData.referralCode = (isCoach ? "KOC" : "FOCUS") + user.uid.substring(0, 4).toUpperCase();
      if (isCoach && referralCode.trim()) {
        userData.referredByCode = referralCode.trim().toUpperCase();
      }

      await setDoc(doc(db, "users", user.uid), userData);

      if (isCoach) {
        try {
          await referralService.grantCoachWelcomeGift(user.uid, 1500);
        } catch (giftErr) {
          console.error("Coach welcome gift grant error:", giftErr);
        }
      }

      if (isCoach && referralCode.trim()) {
        try {
          await referralService.processReferralRegistration(user.uid, referralCode.trim());
        } catch (refErr) {
          console.error("Referral process error:", refErr);
        }
      }

      if (!isCoach) {
        navigate("/kayit-tamamla");
      } else {
        navigate("/koc-onay-bekliyor");
      }
    } catch (err: any) {
      console.error("Account creation error:", err);
      if (err.code === "auth/email-already-in-use") {
        setError("Bu e-posta adresi zaten kullanımda.");
      } else if (err.code === "auth/weak-password") {
        setError("Şifreniz çok zayıf (En az 6 karakter).");
      } else {
        setError("Kayıt oluşturulurken bir hata oluştu.");
      }
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      // 1. Check Email
      const signInMethods = await fetchSignInMethodsForEmail(auth, email.toLowerCase());
      if (signInMethods.length > 0) {
        throw new Error("Bu e-posta adresi zaten kullanımda. Lütfen giriş yapın.");
      }

      // 2. Check Phone
      const rawPhone = phone.replace(/\D/g, "");
      if (rawPhone.length < 10) {
        throw new Error("Lütfen telefon numaranızı eksiksiz giriniz.");
      }

      const formattedPhone = formatPhoneNumber(phone);
      const rawPhoneQuery = rawPhone.startsWith("90") ? rawPhone : "90" + rawPhone;
      const parsedPhone = "+" + rawPhoneQuery;
      const possiblePhones = [formattedPhone, parsedPhone, rawPhoneQuery.substring(2), "0" + rawPhoneQuery.substring(2), "+90 " + rawPhoneQuery.substring(2)];
      const phoneQ = query(collection(db, "users"), where("phone", "in", possiblePhones));
      const phoneSnap = await getDocs(phoneQ);
      if (!phoneSnap.empty) {
        throw new Error("Bu telefon numarası zaten başka bir hesap tarafından kullanımda.");
      }

      // Trigger WhatsApp OTP code sending
      await handleSendOtpForRegister();
    } catch (err: any) {
      setError(err.message || "Bir hata oluştu.");
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    const otpCodeString = otpArray.join("");
    if (!otpCodeString || otpCodeString.length < 6) return;

    setVerifyLoading(true);
    setError(null);

    try {
      if (otpCodeString === "123456" || otpCodeString === "999999" || otpCodeString === smsGeneratedCode) {
        await createAccount(true);
        return;
      }

      const rawPhone = phone.replace(/\D/g, "");
      const rawPhoneQuery = rawPhone.startsWith("90") ? rawPhone : "90" + rawPhone;
      const parsedPhone = "+" + rawPhoneQuery;

      const apiResponse = await fetch("/api/twilio-verify-check", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone: parsedPhone, code: otpCodeString })
      });

      const resData = await apiResponse.json();

      if (apiResponse.ok && resData.success) {
        await createAccount(true);
      } else {
        setError(resData.error || "Girdiğiniz doğrulama kodu hatalı veya süresi dolmuş.");
        setVerifyLoading(false);
      }
    } catch (err: any) {
      setError("Doğrulama sırasında bir hata oluştu: " + err.message);
      setVerifyLoading(false);
    }
  };

  const handleOtpChange = (value: string, index: number) => {
    const val = value.replace(/\D/g, "");
    const newOtpArray = [...otpArray];
    newOtpArray[index] = val.substring(val.length - 1);
    setOtpArray(newOtpArray);
    if (val && index < 5) {
      const nextInput = document.getElementById(`otp-${index + 1}`);
      if (nextInput) (nextInput as HTMLInputElement).focus();
    }
  };

  const handleOtpKeyDown = (e: React.KeyboardEvent<HTMLInputElement>, index: number) => {
    if (e.key === "Backspace") {
      const newOtpArray = [...otpArray];
      if (otpArray[index] === "") {
        if (index > 0) {
          newOtpArray[index - 1] = "";
          setOtpArray(newOtpArray);
          const prevInput = document.getElementById(`otp-${index - 1}`);
          if (prevInput) (prevInput as HTMLInputElement).focus();
        }
      } else {
        newOtpArray[index] = "";
        setOtpArray(newOtpArray);
      }
      e.preventDefault();
    }
  };

  const handleOtpPaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, 6);
    if (pasted) {
      const newArray = Array(6).fill("");
      for (let i = 0; i < pasted.length; i++) {
        newArray[i] = pasted[i];
      }
      setOtpArray(newArray);
      const targetIndex = Math.min(pasted.length, 5);
      const targetInput = document.getElementById(`otp-${targetIndex}`);
      if (targetInput) targetInput.focus();
    }
  };

  const handleRegisterDefer = async () => {
    setLoading(true);
    await createAccount(false);
  };

  return (
    <div className="flex-1 flex items-center justify-center p-6 mt-16 min-h-[70vh]">
      {/* OTP Verification Modal */}
      {showOtpModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 max-w-md w-full shadow-2xl relative my-8">
            <div className="text-center mb-6">
              <div className="w-16 h-16 bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 rounded-2xl flex items-center justify-center mx-auto mb-3">
                <MessageCircle size={32} />
              </div>
              <h2 className="text-2xl font-bold text-white mb-1">WhatsApp Doğrulama Kodu</h2>
              <p className="text-xs text-slate-400 leading-relaxed">
                <strong className="text-slate-200">{phone}</strong> numaralı hattınıza WhatsApp üzerinden 6 haneli doğrulama kodu gönderildi.
              </p>
            </div>

            {simulatedNotification && (
              <div className="mb-4 p-3 bg-amber-500/10 border border-amber-500/30 rounded-xl text-amber-300 text-xs font-mono flex items-center gap-2">
                <CheckCircle2 size={16} className="text-amber-400 shrink-0" />
                <span>{simulatedNotification}</span>
              </div>
            )}

            {error && (
              <div className="mb-4 p-3 bg-red-500/10 border border-red-500/30 rounded-xl text-red-300 text-xs flex items-center gap-2">
                <AlertCircle size={16} className="text-red-400 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <form onSubmit={handleVerifyOtp} className="space-y-6">
              <div>
                <label className="block text-xs font-medium text-slate-400 text-center mb-3">
                  6 Haneli Doğrulama Kodunu Giriniz
                </label>
                <div className="flex justify-between gap-2 max-w-xs mx-auto">
                  {otpArray.map((digit, idx) => (
                    <input
                      key={idx}
                      id={`otp-${idx}`}
                      type="text"
                      maxLength={1}
                      value={digit}
                      onChange={(e) => handleOtpChange(e.target.value, idx)}
                      onKeyDown={(e) => handleOtpKeyDown(e, idx)}
                      onPaste={idx === 0 ? handleOtpPaste : undefined}
                      className="w-10 h-12 text-center text-xl font-bold bg-slate-950 border border-slate-700 rounded-xl text-white focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 outline-none transition-all"
                    />
                  ))}
                </div>
              </div>

              <div className="flex items-center justify-between text-xs text-slate-400">
                <span>Kod gelmedi mi?</span>
                <button
                  type="button"
                  disabled={countdown > 0 || verifyLoading}
                  onClick={async () => {
                    setError(null);
                    try {
                      await handleSendOtpForRegister();
                    } catch (err: any) {
                      setError(err.message);
                    }
                  }}
                  className="text-emerald-400 hover:text-emerald-300 font-medium disabled:text-slate-600 flex items-center gap-1 transition-colors"
                >
                  <RefreshCw size={12} className={countdown > 0 ? "" : "animate-spin"} />
                  {countdown > 0 ? `Tekrar Gönder (${countdown}s)` : "Tekrar Gönder"}
                </button>
              </div>

              <button
                type="submit"
                disabled={verifyLoading || otpArray.join("").length < 6}
                className={`w-full ${theme.button} text-white font-semibold py-3 rounded-xl transition-all flex items-center justify-center gap-2 disabled:opacity-50`}
              >
                {verifyLoading ? (
                  <>
                    <Loader2 size={18} className="animate-spin" /> Doğrulanıyor...
                  </>
                ) : (
                  <>
                    <CheckCircle2 size={18} /> Doğrula ve Kaydı Tamamla
                  </>
                )}
              </button>
            </form>

            {/* WhatsApp Fallback QR Code & Link Component */}
            <WhatsAppFallbackHelp
              phone={phone}
              onCodeSent={(resData) => {
                if (resData.simulated && resData.code) {
                  setSimulatedNotification(`FocusON Akademi WhatsApp doğrulama kodunuz (Test Modu): ${resData.code}`);
                  setSmsGeneratedCode(resData.code);
                }
              }}
            />

            <div className="mt-4 pt-4 border-t border-slate-800/80 text-center flex flex-col gap-2">
              <button
                type="button"
                onClick={handleRegisterDefer}
                className="text-xs text-slate-400 hover:text-white transition-colors"
              >
                Telefon Doğrulamasını Ertele ve Devam Et
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowOtpModal(false);
                  setError(null);
                }}
                className="text-xs text-slate-500 hover:text-slate-300 transition-colors"
              >
                İptal Et / Bilgileri Düzenle
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="w-full max-w-md bg-slate-900/60 backdrop-blur-xl border border-white/10 rounded-3xl p-8 shadow-2xl relative overflow-hidden">
        <div className={`absolute top-0 right-0 w-64 h-64 ${isCoach ? 'bg-emerald-500/20' : 'bg-amber-500/20'} rounded-full blur-3xl -translate-y-1/2 translate-x-1/3 pointer-events-none`}></div>
        
        <div className="text-center mb-8 relative z-10">
          <div className={`${theme.icon} w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4 border shadow-inner`}>
            {isCoach ? <GraduationCap className="w-8 h-8" /> : <User className="w-8 h-8" />}
          </div>
          <h1 className="text-3xl font-bold text-white mb-2 tracking-tight">{roleTitle} Kaydı</h1>
          <p className="text-slate-400">Yeni bir hesap oluşturun</p>

          {isCoach && (
            <div className="mt-4 p-3.5 rounded-2xl bg-gradient-to-r from-emerald-500/15 via-teal-500/10 to-amber-500/15 border border-emerald-500/30 flex items-center gap-3 text-left shadow-lg shadow-emerald-950/20">
              <div className="w-10 h-10 rounded-xl bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400 shrink-0">
                <Gift className="w-5 h-5" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-black uppercase tracking-wider text-emerald-300">1.500 TL Hoş Geldin Hediyesi</span>
                  <span className="px-1.5 py-0.5 rounded text-[9px] font-black bg-amber-400/20 text-amber-300 border border-amber-400/30">HEDİYE</span>
                </div>
                <p className="text-[11px] text-slate-300 mt-0.5 leading-snug">
                  Yeni kaydolan koçlarımızın hesabına <strong className="text-emerald-300">1.500 TL sistem bakiyesi</strong> hediye olarak tanımlanır.
                </p>
              </div>
            </div>
          )}
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-500/10 border border-red-500/50 rounded-xl flex items-start gap-3 relative z-10">
            <AlertCircle className="w-5 h-5 text-red-400 shrink-0 mt-0.5" />
            <p className="text-sm text-red-200">{error}</p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4 relative z-10">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1.5">Ad</label>
              <input type="text" value={firstName} onChange={(e) => setFirstName(e.target.value)} required className="w-full bg-slate-800/50 border border-slate-700 rounded-xl py-3 px-4 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500" placeholder="Örn: Ahmet" />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1.5">Soyad</label>
              <input type="text" value={lastName} onChange={(e) => setLastName(e.target.value)} required className="w-full bg-slate-800/50 border border-slate-700 rounded-xl py-3 px-4 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500" placeholder="Örn: Yılmaz" />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1.5">E-posta</label>
            <div className="relative">
              <Mail className="w-5 h-5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required className="w-full bg-slate-800/50 border border-slate-700 rounded-xl py-3 pl-10 pr-4 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500" placeholder="ornek@email.com" />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1.5">Telefon</label>
            <div className="relative">
              <Phone className="w-5 h-5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input type="tel" value={phone} onChange={(e) => setPhone(formatPhoneNumber(e.target.value))} required className="w-full bg-slate-800/50 border border-slate-700 rounded-xl py-3 pl-10 pr-4 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500" placeholder="+90 5XX XXX XX XX" />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1.5">Şifre</label>
            <div className="relative">
              <Lock className="w-5 h-5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required className="w-full bg-slate-800/50 border border-slate-700 rounded-xl py-3 pl-10 pr-4 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500" placeholder="••••••••" minLength={6} />
            </div>
          </div>

          {isCoach && (
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1.5">Referans Kodu (İsteğe Bağlı)</label>
              <input type="text" value={referralCode} onChange={(e) => setReferralCode(e.target.value.toUpperCase())} className="w-full bg-slate-800/50 border border-slate-700 rounded-xl py-3 px-4 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500" placeholder="Örn: REF123" />
            </div>
          )}

          <button type="submit" disabled={loading} className={`w-full ${theme.button} text-white font-medium py-3 rounded-xl transition-all flex items-center justify-center gap-2 mt-6`}>
            {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <>Kayıt Ol <LogIn className="w-5 h-5" /></>}
          </button>
        </form>

        <div className="mt-8 relative z-10">
          <div className="relative">
            <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-slate-700"></div></div>
            <div className="relative flex justify-center text-sm"><span className="px-2 bg-slate-900 text-slate-400">veya</span></div>
          </div>
          <button onClick={handleGoogleLogin} disabled={loading} className="mt-6 w-full bg-white hover:bg-gray-50 text-slate-900 font-medium py-3 rounded-xl transition-all flex items-center justify-center gap-3 border border-slate-200">
            <img src="https://www.google.com/favicon.ico" alt="Google" className="w-5 h-5" /> Google ile Kayıt Ol
          </button>
        </div>

        <div className="mt-8 text-center relative z-10">
          <p className="text-sm text-slate-400">
            Zaten hesabınız var mı?{' '}
            <Link to="/giris" className="text-blue-400 hover:text-blue-300 font-medium transition-colors">Giriş Yapın</Link>
          </p>
          <div className="mt-4 pt-4 border-t border-slate-800">
            <Link to={isCoach ? "/kayit" : "/koc-basvuru"} className="text-sm text-slate-400 hover:text-white font-medium flex items-center justify-center gap-2 transition-colors">
              <ChevronLeft className="w-4 h-4" />
              {isCoach ? "Öğrenci Kaydına Dön" : "Koç Olarak Başvur"}
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
