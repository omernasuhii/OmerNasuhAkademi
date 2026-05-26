import React, { useState } from 'react';
import { Mail, Lock, LogIn, User, Loader2, AlertCircle } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { auth, db } from '../lib/firebase';

export default function Login() {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      // 2. Fetch user profile to check role and if it exists
      const userDoc = await getDoc(doc(db, 'users', user.uid));
      
      if (!userDoc.exists()) {
        console.error("Firestore user profile not found for UID:", user.uid);
        setError("Hesabınız doğrulandı ancak profil bilgileriniz bulunamadı. Lütfen koçunuzla iletişime geçin.");
        setLoading(false);
        return;
      }

      const userData = userDoc.data();
      
      // 3. Redirect to appropriate dashboard
      if (userData.role === 'admin') {
        navigate('/panel/admin');
      } else if (userData.role === 'coach') {
        navigate('/panel/koc');
      } else if (userData.role === 'parent') {
        navigate('/panel/veli');
      } else {
        navigate('/panel/ogrenci');
      }
    } catch (err: any) {
      console.error("Login error:", err);
      let message = "Giriş yapılırken bir hata oluştu.";
      if (err.code === 'auth/user-not-found' || err.code === 'auth/wrong-password' || err.code === 'auth/invalid-credential') {
        message = "E-posta veya şifre hatalı.";
      } else if (err.code === 'auth/invalid-email') {
        message = "Geçersiz e-posta adresi.";
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
          <h1 className="text-3xl font-extrabold tracking-tight text-white">Sisteme Giriş</h1>
          <p className="text-slate-400 mt-2 text-sm">Öğrenci veya Koç olarak giriş yapabilirsiniz</p>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-500/10 border border-red-500/30 rounded-xl flex items-center gap-3 text-red-400 text-sm animate-in fade-in slide-in-from-top-2 duration-300">
            <AlertCircle size={18} className="shrink-0" />
            <p>{error}</p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6 relative z-10">
          <div>
            <label className="block text-sm font-semibold tracking-wide text-slate-300 mb-2">E-Posta Adresi</label>
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
              <label className="block text-sm font-semibold tracking-wide text-slate-300">Şifre</label>
              <Link to="/sifremi-unuttum" className="text-xs text-blue-400 hover:text-blue-300 font-medium transition-colors">Şifremi Unuttum?</Link>
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
              'Giriş Yap'
            )}
          </button>
        </form>

        <div className="mt-8 text-center border-t border-white/10 pt-6 relative z-10">
          <p className="text-sm text-slate-400">
            Hesabınız yok mu? 
          </p>
          <div className="flex items-center justify-center gap-4 mt-3">
            <Link to="/kayit/ogrenci" className="text-sm font-bold text-amber-500 hover:text-amber-400 transition-colors uppercase tracking-widest flex items-center gap-1">
              <User size={14} /> Öğrenci Kaydı
            </Link>
            <span className="text-white/20">|</span>
            <Link to="/kayit/koc" className="text-sm font-bold text-emerald-500 hover:text-emerald-400 transition-colors uppercase tracking-widest flex items-center gap-1">
              <User size={14} /> Koç Kaydı
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
