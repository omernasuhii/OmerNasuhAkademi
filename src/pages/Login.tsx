import React, { useState, useEffect } from "react";
import { Mail, Lock, LogIn, User, Loader2, AlertCircle } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { signInWithEmailAndPassword, setPersistence, browserLocalPersistence, GoogleAuthProvider, signInWithPopup } from "firebase/auth";
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

  const handleGoogleLogin = async () => {
    setLoading(true);
    setError(null);
    try {
      await setPersistence(auth, browserLocalPersistence);
      const provider = new GoogleAuthProvider();
      const result = await signInWithPopup(auth, provider);
      const user = result.user;

      // Check if user profile exists in Firestore
      const userDoc = await getDoc(doc(db, "users", user.uid));

      if (userDoc.exists()) {
        const userData = userDoc.data();
        const role = userData.role || "student";
        
        if (role === "admin") {
          navigate("/panel/admin");
        } else if (role === "coach") {
          if (userData.approved === false || userData.approved === "rejected") {
            navigate("/koc-onay-bekliyor");
          } else {
            navigate("/panel/koc");
          }
        } else if (role === "parent") {
          navigate("/panel/veli");
        } else {
          if (!userData.registrationStep || userData.registrationStep < 4 || !userData.phone) {
            navigate("/kayit-tamamla");
          } else {
            navigate("/panel/ogrenci");
          }
        }
      } else {
        // Check if a user with this email already exists but with a different UID
        const usersRef = collection(db, "users");
        const emailQuery = query(usersRef, where("email", "==", user.email?.toLowerCase()));
        const emailQuerySnapshot = await getDocs(emailQuery);
        
        if (!emailQuerySnapshot.empty) {
          const existingUser = emailQuerySnapshot.docs[0].data();
          if (existingUser.role === "coach") {
            setError("Bu e-posta adresi ile kayıtlı bir koç hesabınız bulunmaktadır. Lütfen e-posta ve şifrenizle giriş yapınız.");
            await auth.signOut();
            setLoading(false);
            return;
          } else if (existingUser.role === "admin") {
            setError("Yönetici hesapları Google ile giriş yapamaz. Lütfen e-posta ve şifrenizle giriş yapınız.");
            await auth.signOut();
            setLoading(false);
            return;
          } else {
            setError("Bu e-posta adresi ile zaten bir hesabınız bulunmaktadır. Lütfen e-posta ve şifrenizle giriş yapınız.");
            await auth.signOut();
            setLoading(false);
            return;
          }
        }

        // Quick sign up with Google (default role is student)
        const displayName = user.displayName || "";
        const nameParts = displayName.split(" ");
        const firstName = nameParts[0] || "";
        const lastName = nameParts.slice(1).join(" ") || "";

        const userData = {
          uid: user.uid,
          email: user.email?.toLowerCase() || "",
          firstName,
          lastName,
          role: "student",
          phone: "",
          phoneVerified: false,
          emailVerified: true,
          createdAt: serverTimestamp(),
          lastLoginAt: serverTimestamp(),
          isOnline: true,
          registrationStep: 1,
          referralCode: "FOCUS" + user.uid.substring(0, 4).toUpperCase()
        };

        await setDoc(doc(db, "users", user.uid), userData);
        navigate("/kayit-tamamla");
      }
    } catch (err: any) {
      console.error("Google login error:", err);
      if (err.code === "auth/network-request-failed") {
        setError(
          "Google ile giriş, tarayıcı güvenlik politikası (iframe / üçüncü taraf çerez engellemesi) nedeniyle engellendi. " +
          "Lütfen sağ üstteki 'Yeni Sekmede Aç' butonuna tıklayarak uygulamayı yeni sekmede açın ve Google Giriş'i tekrar deneyin ya da e-posta/şifre ile giriş yapın."
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
      const userCredential = await signInWithEmailAndPassword(
        auth,
        email,
        password,
      );
      const user = userCredential.user;

      // 2. Fetch user profile to check role and if it exists
      const userDoc = await getDoc(doc(db, "users", user.uid));

      if (!userDoc.exists()) {
        console.error("Firestore user profile not found for UID:", user.uid);
        setError(
          "Hesabınız doğrulandı ancak profil bilgileriniz bulunamadı. Lütfen koçunuzla iletişime geçin.",
        );
        setLoading(false);
        return;
      }

      const userData = userDoc.data();

      // 3. Redirect to appropriate dashboard
      if (userData.role === "admin") {
        navigate("/panel/admin");
      } else if (userData.role === "coach") {
        if (userData.approved === false || userData.approved === "rejected") {
          navigate("/koc-onay-bekliyor");
        } else {
          navigate("/panel/koc");
        }
      } else if (userData.role === "parent") {
        navigate("/panel/veli");
      } else {
        navigate("/panel/ogrenci");
      }
    } catch (err: any) {
      console.error("Login error:", err);
      let message = "Giriş yapılırken bir hata oluştu.";
      if (
        err.code === "auth/user-not-found" ||
        err.code === "auth/wrong-password" ||
        err.code === "auth/invalid-credential"
      ) {
        message = "E-posta veya şifre hatalı.";
      } else if (err.code === "auth/invalid-email") {
        message = "Geçersiz e-posta adresi.";
      } else if (err.code === "auth/account-exists-with-different-credential") {
        message =
          "Bu e-posta adresi farklı bir giriş yöntemi (Telefon vb.) ile kaydedilmiş. Lütfen uygun yöntemle giriş yapın.";
      }
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex-1 flex items-center justify-center p-6 mt-16 min-h-[70vh]">
      <div className="w-full max-w-md bg-slate-900/60 backdrop-blur-xl border border-white/10 rounded-3xl p-8 shadow-2xl relative overflow-hidden">
        {/* Decorative blur */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-blue-500/20 rounded-full blur-3xl -translate-y-1/2 translate-x-1/3 pointer-events-none"></div>

        <div className="text-center mb-10 relative z-10">
          <div className="bg-blue-600/20 text-blue-400 w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4 border border-blue-500/30 shadow-inner">
            <LogIn size={32} />
          </div>
          <h1 className="text-3xl font-extrabold tracking-tight text-white">
            Sisteme Giriş
          </h1>
          <p className="text-slate-400 mt-2 text-sm">
            Öğrenci veya Koç olarak giriş yapabilirsiniz
          </p>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-500/10 border border-red-500/30 rounded-xl flex items-center gap-3 text-red-400 text-sm animate-in fade-in slide-in-from-top-2 duration-300">
            <AlertCircle size={18} className="shrink-0" />
            <p>{error}</p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6 relative z-10">
          <div>
            <label className="block text-sm font-semibold tracking-wide text-slate-300 mb-2">
              E-Posta Adresi
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                <Mail size={18} className="text-slate-500" />
              </div>
              <input
                type="email"
                required
                disabled={loading}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-slate-950/50 border border-white/10 text-white rounded-xl py-3 pl-11 pr-4 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition-all placeholder:text-slate-600 disabled:opacity-50"
                placeholder="ornek@mail.com"
              />
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="block text-sm font-semibold tracking-wide text-slate-300">
                Şifre
              </label>
              <Link
                to="/sifremi-unuttum"
                className="text-xs text-blue-400 hover:text-blue-300 font-medium transition-colors"
              >
                Şifremi Unuttum?
              </Link>
            </div>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                <Lock size={18} className="text-slate-500" />
              </div>
              <input
                type="password"
                required
                disabled={loading}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-slate-950/50 border border-white/10 text-white rounded-xl py-3 pl-11 pr-4 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition-all placeholder:text-slate-600 disabled:opacity-50"
                placeholder="••••••••"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-600 hover:bg-blue-500 text-white font-bold py-3.5 rounded-xl transition-all shadow-[0_0_20px_rgba(37,99,235,0.3)] shadow-blue-500/30 flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed"
          >
            {loading ? (
              <>
                <Loader2 size={20} className="animate-spin" />
                Giriş Yapılıyor...
              </>
            ) : (
              "Giriş Yap"
            )}
          </button>

          <div className="relative flex items-center justify-center my-5">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-white/10"></div>
            </div>
            <span className="relative px-3 bg-[#0d1527] text-xs text-slate-500 uppercase tracking-widest font-semibold">
              veya
            </span>
          </div>

          <button
            type="button"
            onClick={handleGoogleLogin}
            disabled={loading}
            className="w-full bg-white hover:bg-slate-100 text-slate-900 font-bold py-3.5 rounded-xl transition-all flex items-center justify-center gap-3 disabled:opacity-70 disabled:cursor-not-allowed shadow-[0_4px_12px_rgba(255,255,255,0.1)] font-sans"
          >
            <svg className="w-5 h-5 shrink-0" viewBox="0 0 24 24">
              <path
                fill="#4285F4"
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              />
              <path
                fill="#34A853"
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              />
              <path
                fill="#FBBC05"
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
              />
              <path
                fill="#EA4335"
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
              />
            </svg>
            Google ile Giriş Yap
          </button>
        </form>

        <div className="mt-8 text-center border-t border-white/10 pt-6 relative z-10">
          <p className="text-sm text-slate-400">Hesabınız yok mu?</p>
          <div className="flex items-center justify-center gap-4 mt-3">
            <Link
              to="/kayit/ogrenci"
              className="text-sm font-bold text-amber-500 hover:text-amber-400 transition-colors uppercase tracking-widest flex items-center gap-1"
            >
              <User size={14} /> Öğrenci Kaydı
            </Link>
            <span className="text-white/20">|</span>
            <Link
              to="/kayit/koc"
              className="text-sm font-bold text-emerald-500 hover:text-emerald-400 transition-colors uppercase tracking-widest flex items-center gap-1"
            >
              <User size={14} /> Koç Kaydı
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
