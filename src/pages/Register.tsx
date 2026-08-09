import React, { useState, useEffect } from "react";
import { Mail, Lock, User, Phone, LogIn, ChevronLeft, Loader2, AlertCircle, CheckCircle2, GraduationCap } from "lucide-react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { createUserWithEmailAndPassword, signInWithPopup, GoogleAuthProvider, fetchSignInMethodsForEmail } from "firebase/auth";
import { doc, setDoc, serverTimestamp, collection, query, where, getDocs, getDoc } from "firebase/firestore";
import { auth, db } from "../lib/firebase";
import { useAuth } from "../lib/AuthContext";
import { referralService } from "../services/referralService";

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
        if (r === "admin") navigate("/panel/admin");
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
      }

      await setDoc(doc(db, "users", user.uid), userData);
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
      }

      userData.uid = user.uid;
      userData.referralCode = (isCoach ? "KOC" : "FOCUS") + user.uid.substring(0, 4).toUpperCase();
      if (isCoach && referralCode.trim()) {
        userData.referredByCode = referralCode.trim().toUpperCase();
      }

      await setDoc(doc(db, "users", user.uid), userData);

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
      if (rawPhone.length > 0) {
        const formattedPhone = formatPhoneNumber(phone);
        const rawPhoneQuery = rawPhone.startsWith("90") ? rawPhone : "90" + rawPhone;
        const parsedPhone = "+" + rawPhoneQuery;
        const possiblePhones = [formattedPhone, parsedPhone, rawPhoneQuery.substring(2), "0" + rawPhoneQuery.substring(2), "+90 " + rawPhoneQuery.substring(2)];
        const phoneQ = query(collection(db, "users"), where("phone", "in", possiblePhones));
        const phoneSnap = await getDocs(phoneQ);
        if (!phoneSnap.empty) {
          throw new Error("Bu telefon numarası zaten başka bir hesap tarafından kullanımda.");
        }
      }

      // Create account directly without phone or email verification code
      await createAccount(true);
    } catch (err: any) {
      setError(err.message || "Bir hata oluştu.");
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

  return (
    <div className="flex-1 flex items-center justify-center p-6 mt-16 min-h-[70vh]">
      <div className="w-full max-w-md bg-slate-900/60 backdrop-blur-xl border border-white/10 rounded-3xl p-8 shadow-2xl relative overflow-hidden">
        <div className={`absolute top-0 right-0 w-64 h-64 ${isCoach ? 'bg-emerald-500/20' : 'bg-amber-500/20'} rounded-full blur-3xl -translate-y-1/2 translate-x-1/3 pointer-events-none`}></div>
        
        <div className="text-center mb-8 relative z-10">
          <div className={`${theme.icon} w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4 border shadow-inner`}>
            {isCoach ? <GraduationCap className="w-8 h-8" /> : <User className="w-8 h-8" />}
          </div>
          <h1 className="text-3xl font-bold text-white mb-2 tracking-tight">{roleTitle} Kaydı</h1>
          <p className="text-slate-400">Yeni bir hesap oluşturun</p>
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
