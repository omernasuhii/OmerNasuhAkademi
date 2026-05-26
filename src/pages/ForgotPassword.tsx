import React, { useState } from 'react';
import { Mail, ChevronLeft, Loader2, AlertCircle, CheckCircle2 } from 'lucide-react';
import { Link } from 'react-router-dom';
import { sendPasswordResetEmail } from 'firebase/auth';
import { auth } from '../lib/firebase';

export default function ForgotPassword() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(false);

    try {
      await sendPasswordResetEmail(auth, email);
      setSuccess(true);
    } catch (err: any) {
      console.error("Password reset error:", err);
      let message = "Sıfırlama e-postası gönderilirken bir hata oluştu.";
      if (err.code === 'auth/user-not-found') {
        message = "Bu e-posta adresiyle kayıtlı bir kullanıcı bulunamadı.";
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
        <div className="absolute top-0 right-0 w-64 h-64 bg-blue-500/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/3 pointer-events-none"></div>
        
        <div className="mb-6 relative z-10">
          <Link to="/giris" className="text-slate-400 hover:text-white transition-colors flex items-center gap-1 text-sm font-medium">
            <ChevronLeft size={16} /> Giriş Sayfasına Dön
          </Link>
        </div>

        <div className="text-center mb-8 relative z-10">
          <h1 className="text-3xl font-extrabold tracking-tight text-white mb-3">Şifremi Unuttum</h1>
          <p className="text-slate-400 text-sm">
            E-posta adresinizi girin, size şifre sıfırlama bağlantısı gönderelim.
          </p>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-500/10 border border-red-500/30 rounded-xl flex items-center gap-3 text-red-400 text-sm animate-in fade-in slide-in-from-top-2 duration-300">
            <AlertCircle size={18} className="shrink-0" />
            <p>{error}</p>
          </div>
        )}

        {success ? (
          <div className="text-center space-y-6 relative z-10 animate-in fade-in scale-in duration-500">
            <div className="bg-emerald-500/20 text-emerald-400 w-20 h-20 rounded-full flex items-center justify-center mx-auto border border-emerald-500/30 shadow-lg mb-4">
              <CheckCircle2 size={40} />
            </div>
            <div className="space-y-2">
              <h2 className="text-xl font-bold text-white">E-posta Gönderildi!</h2>
              <p className="text-slate-400 text-sm leading-relaxed">
                <span className="text-blue-400 font-semibold">{email}</span> adresine bir bağlantı gönderdik. Lütfen gelen kutunuzu (ve gereksiz klasörünü) kontrol edin.
              </p>
            </div>
            <Link 
              to="/giris" 
              className="block w-full bg-slate-800 hover:bg-slate-700 text-white font-bold py-3.5 rounded-xl transition-all border border-white/5 shadow-xl mt-4"
            >
              Giriş Ekranına Git
            </Link>
          </div>
        ) : (
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

            <button 
              type="submit" 
              disabled={loading}
              className="w-full bg-blue-600 hover:bg-blue-500 text-white font-bold py-3.5 rounded-xl transition-all shadow-[0_0_20px_rgba(59,130,246,0.3)] flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed uppercase tracking-wider text-sm"
            >
              {loading ? (
                <>
                  <Loader2 size={20} className="animate-spin" />
                  Gönderiliyor...
                </>
              ) : (
                'Sıfırlama Bağlantısı Gönder'
              )}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
