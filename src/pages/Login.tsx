import React, { useState, useEffect } from "react";
import { Mail, Lock, LogIn, User, Loader2, AlertCircle, Users, GraduationCap } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { signInWithEmailAndPassword, setPersistence, browserLocalPersistence, GoogleAuthProvider, signInWithPopup, signOut } from "firebase/auth";
import { doc, getDoc, setDoc, serverTimestamp, collection, query, where, getDocs } from "firebase/firestore";
import { auth, db } from "../lib/firebase";
import { useAuth } from "../lib/AuthContext";

export default function Login() {
  const navigate = useNavigate();
  const { user, userData, loading: authLoading } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Zaten giriş yapmış ve verisi olan kullanıcıyı yönlendir
  useEffect(() => {
    if (!authLoading && user && userData) {
      const role = userData.role || "student";
      if (role === "admin") {
        navigate("/panel/admin", { replace: true });
      } else if (role === "coach") {
        if (userData.approved === false || userData.approved === "rejected") {
          navigate("/koc-onay-bekliyor", { replace: true });
        } else {
          navigate("/panel/koc", { replace: true });
        }
      } else if (role === "parent") {
        navigate("/panel/veli", { replace: true });
      } else {
        if (!userData.registrationStep || userData.registrationStep < 4 || !userData.phone) {
          navigate("/kayit-tamamla", { replace: true });
        } else {
          navigate("/panel/ogrenci", { replace: true });
        }
      }
    }
  }, [user, userData, authLoading, navigate]);

  const fetchUserProfileWithRetry = async (uid: string, userEmail?: string) => {
    for (let attempt = 1; attempt <= 3; attempt++) {
      try {
        const userDoc = await getDoc(doc(db, "users", uid));
        if (userDoc.exists() && userDoc.data()?.role) {
          return userDoc.data();
        }
      } catch (e) {
        console.warn(`[Login] Attempt ${attempt} fetching user doc failed:`, e);
      }
      if (attempt < 3) {
        await new Promise((res) => setTimeout(res, 350 * attempt));
      }
    }

    if (userEmail) {
      try {
        const q = query(collection(db, "users"), where("email", "==", userEmail.toLowerCase()));
        const querySnap = await getDocs(q);
        if (!querySnap.empty) {
          const firstDoc = querySnap.docs[0];
          if (firstDoc.exists() && firstDoc.data()?.role) {
            return { uid: firstDoc.id, ...firstDoc.data() };
          }
        }
      } catch (e) {
        console.warn("[Login] Email fallback search error:", e);
      }
    }

    return null;
  };

  const handleGoogleLogin = async () => {
    setLoading(true);
    setError(null);
    try {
      await setPersistence(auth, browserLocalPersistence);
      const provider = new GoogleAuthProvider();
      const result = await signInWithPopup(auth, provider);
      const gUser = result.user;

      // Firestore'da profili var mı kontrol et (yeniden deneme ve e-posta yedeklemesi ile)
      const profile = await fetchUserProfileWithRetry(gUser.uid, gUser.email || undefined);
      
      if (profile && profile.role) {
        // Profili var, yönlendirme AuthContext useEffect tarafından halledilecek
        return;
      } else {
        // Profili yok, demek ki kayıt formunu doldurmamış.
        await signOut(auth);
        setError("Hesabınız bulunamadı. Lütfen önce kayıt olun.");
      }
    } catch (err: any) {
      console.error("Google login error:", err);
      if (err.code === "auth/network-request-failed") {
        setError(
          "Google ile giriş engellendi. Lütfen 'Yeni Sekmede Aç' butonuna tıklayarak uygulamayı yeni sekmede açın ve tekrar deneyin."
        );
      } else if (err.code !== "auth/popup-closed-by-user") {
        setError("Google ile giriş yapılırken bir hata oluştu: " + (err.message || err));
      }
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      await setPersistence(auth, browserLocalPersistence);
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const u = userCredential.user;

      const profile = await fetchUserProfileWithRetry(u.uid, u.email || email);

      if (!profile || !profile.role) {
        await signOut(auth);
        setError("Hesabınız bulunamadı veya kurulumu eksik. Lütfen önce kayıt olun.");
        return;
      }
      
      // Yönlendirme AuthContext useEffect'i tarafından yapılacaktır.
    } catch (err: any) {
      console.error("Login error:", err);
      let message = "Giriş yapılırken bir hata oluştu.";
      const errCode = err?.code || "";
      const errMsg = err?.message || "";

      if (
        errCode === "auth/user-not-found" ||
        errCode === "auth/wrong-password" ||
        errCode === "auth/invalid-credential" ||
        errMsg.includes("invalid-credential") ||
        errMsg.includes("wrong-password") ||
        errMsg.includes("user-not-found")
      ) {
        message = "E-posta veya şifre hatalı. Lütfen bilgilerinizi kontrol edip tekrar deneyin.";
      } else if (errCode === "auth/invalid-email" || errMsg.includes("invalid-email")) {
        message = "Geçersiz e-posta adresi formatı.";
      } else if (errCode === "auth/too-many-requests" || errMsg.includes("too-many-requests")) {
        message = "Çok fazla başarısız giriş denemesi. Lütfen birkaç dakika sonra tekrar deneyin.";
      } else if (errCode === "auth/account-exists-with-different-credential") {
        message = "Bu e-posta adresi farklı bir yöntemle kaydedilmiş. Lütfen Google ile giriş yapmayı deneyin.";
      }
      setError(message);
      setLoading(false); // AuthContext redirect yapmayacağı için loading'i kapat
    }
  };

  return (
    <div className="flex-1 flex items-center justify-center p-6 mt-16 min-h-[70vh]">
      <div className="w-full max-w-md bg-slate-900/60 backdrop-blur-xl border border-white/10 rounded-3xl p-8 shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-blue-500/20 rounded-full blur-3xl -translate-y-1/2 translate-x-1/3 pointer-events-none"></div>
        <div className="absolute bottom-0 left-0 w-64 h-64 bg-purple-500/20 rounded-full blur-3xl translate-y-1/2 -translate-x-1/3 pointer-events-none"></div>
        
        <div className="text-center mb-8 relative z-10">
          <div className="bg-blue-600/20 text-blue-400 w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4 border border-blue-500/30 shadow-inner">
            <LogIn className="w-8 h-8" />
          </div>
          <h1 className="text-3xl font-bold text-white mb-2 tracking-tight">Tekrar Hoş Geldiniz</h1>
          <p className="text-slate-400">Öğrenme yolculuğunuza devam edin</p>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-500/10 border border-red-500/50 rounded-xl flex items-start gap-3 relative z-10">
            <AlertCircle className="w-5 h-5 text-red-400 shrink-0 mt-0.5" />
            <p className="text-sm text-red-200">{error}</p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5 relative z-10">
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1.5">
              E-posta Adresi
            </label>
            <div className="relative">
              <Mail className="w-5 h-5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-slate-800/50 border border-slate-700 rounded-xl py-3 pl-10 pr-4 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition-all"
                placeholder="ornek@email.com"
                required
              />
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="block text-sm font-medium text-slate-300">
                Şifre
              </label>
              <Link to="/sifremi-unuttum" className="text-xs text-blue-400 hover:text-blue-300 transition-colors">
                Şifremi Unuttum
              </Link>
            </div>
            <div className="relative">
              <Lock className="w-5 h-5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-slate-800/50 border border-slate-700 rounded-xl py-3 pl-10 pr-4 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition-all"
                placeholder="••••••••"
                required
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-600 hover:bg-blue-500 text-white font-medium py-3 rounded-xl transition-all shadow-lg shadow-blue-500/30 flex items-center justify-center gap-2 group relative overflow-hidden"
          >
            <div className="absolute inset-0 bg-gradient-to-r from-blue-400/0 via-white/20 to-blue-400/0 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700"></div>
            {loading ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <>
                Giriş Yap
                <LogIn className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </>
            )}
          </button>
        </form>

        <div className="mt-8 relative z-10">
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-slate-700"></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-2 bg-slate-900 text-slate-400">veya</span>
            </div>
          </div>

          <button
            onClick={handleGoogleLogin}
            disabled={loading}
            className="mt-6 w-full bg-white hover:bg-gray-50 text-slate-900 font-medium py-3 rounded-xl transition-all flex items-center justify-center gap-3 border border-slate-200"
          >
            <img src="https://www.google.com/favicon.ico" alt="Google" className="w-5 h-5" />
            Google ile Giriş Yap
          </button>
        </div>

        <div className="mt-8 text-center relative z-10">
          <p className="text-sm text-slate-400">
            Hesabınız yok mu?{' '}
            <Link to="/kayit" className="text-blue-400 hover:text-blue-300 font-medium transition-colors">
              Hemen Kayıt Olun
            </Link>
          </p>
          <div className="mt-4 pt-4 border-t border-slate-800">
            <Link to="/koc-basvuru" className="text-sm text-emerald-400 hover:text-emerald-300 font-medium flex items-center justify-center gap-2 transition-colors">
              <GraduationCap className="w-4 h-4" />
              Koç Olarak Başvur
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
