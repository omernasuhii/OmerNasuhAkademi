import React, { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { applyActionCode, verifyPasswordResetCode, confirmPasswordReset } from 'firebase/auth';
import { auth } from '../lib/firebase';
import { CheckCircle, AlertCircle, Loader2 } from 'lucide-react';

export default function AuthAction() {
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [message, setMessage] = useState('İşleminiz gerçekleştiriliyor, lütfen bekleyin...');
  const [password, setPassword] = useState('');
  const [mode, setMode] = useState<string | null>(null);
  const [actionCode, setActionCode] = useState<string | null>(null);
  
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const queryParams = new URLSearchParams(location.search);
    const modeParam = queryParams.get('mode');
    const oobCode = queryParams.get('oobCode');
    const continueUrl = queryParams.get('continueUrl');

    if (!modeParam || !oobCode) {
      setStatus('error');
      setMessage('Geçersiz bağlantı. Eksik parametreler.');
      return;
    }

    setMode(modeParam);
    setActionCode(oobCode);

    if (modeParam === 'verifyEmail') {
      handleVerifyEmail(oobCode, continueUrl);
    } else if (modeParam === 'resetPassword') {
      handleVerifyPasswordReset(oobCode);
    } else {
      setStatus('error');
      setMessage('Bilinmeyen işlem türü.');
    }
  }, [location]);

  const handleVerifyEmail = async (oobCode: string, continueUrl: string | null) => {
    try {
      await applyActionCode(auth, oobCode);
      setStatus('success');
      setMessage('E-posta adresiniz başarıyla doğrulandı!');
      
      // 3 saniye sonra yönlendir
      setTimeout(() => {
        if (continueUrl) {
          window.location.href = continueUrl;
        } else {
          navigate('/giris', { replace: true });
        }
      }, 3000);
    } catch (error: any) {
      console.error('Email doğrulama hatası:', error);
      setStatus('error');
      if (error.code === 'auth/invalid-action-code') {
        setMessage('Bu doğrulama bağlantısı geçersiz veya daha önce kullanılmış.');
      } else {
        setMessage('E-posta doğrulanırken bir hata oluştu: ' + error.message);
      }
    }
  };

  const handleVerifyPasswordReset = async (oobCode: string) => {
    try {
      // Şifre sıfırlama kodunun geçerli olup olmadığını kontrol et
      await verifyPasswordResetCode(auth, oobCode);
      setStatus('success');
      setMessage('Şifrenizi sıfırlayabilirsiniz. Lütfen yeni şifrenizi girin.');
    } catch (error: any) {
      console.error('Şifre sıfırlama doğrulama hatası:', error);
      setStatus('error');
      if (error.code === 'auth/invalid-action-code') {
        setMessage('Bu şifre sıfırlama bağlantısı geçersiz veya süresi dolmuş. Lütfen yeni bir sıfırlama isteği gönderin.');
      } else {
        setMessage('Bağlantı doğrulanırken bir hata oluştu.');
      }
    }
  };

  const handleApplyNewPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!actionCode) return;
    
    if (password.length < 6) {
      setStatus('error');
      setMessage('Şifreniz en az 6 karakter olmalıdır.');
      return;
    }

    setStatus('loading');
    setMessage('Şifreniz güncelleniyor...');

    try {
      await confirmPasswordReset(auth, actionCode, password);
      setStatus('success');
      setMessage('Şifreniz başarıyla değiştirildi! Giriş yapabilirsiniz.');
      setTimeout(() => {
        navigate('/giris', { replace: true });
      }, 3000);
    } catch (error: any) {
      console.error('Şifre güncelleme hatası:', error);
      setStatus('error');
      setMessage('Şifreniz güncellenirken bir hata oluştu. Lütfen tekrar deneyin.');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#0B0F19] px-4 pt-20">
      <div className="bg-slate-900/50 border border-white/10 rounded-3xl p-8 max-w-md w-full shadow-2xl backdrop-blur-xl relative overflow-hidden">
        
        {/* Dekoratif Arka Plan Işıkları */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-32 bg-blue-500/20 blur-[80px] -z-10" />

        <div className="text-center mb-8">
          <div className={`w-16 h-16 rounded-2xl mx-auto flex items-center justify-center mb-6 shadow-lg backdrop-blur-sm
            ${status === 'loading' ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30' : 
              status === 'success' ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' : 
              'bg-red-500/20 text-red-500 border border-red-500/30'}`}>
            {status === 'loading' && <Loader2 size={32} className="animate-spin" />}
            {status === 'success' && <CheckCircle size={32} />}
            {status === 'error' && <AlertCircle size={32} />}
          </div>
          
          <h2 className="text-2xl font-black text-white mb-2">
            {mode === 'verifyEmail' ? 'E-posta Doğrulama' : 
             mode === 'resetPassword' ? 'Şifre Sıfırlama' : 'İşlem Durumu'}
          </h2>
          <p className={`text-sm ${status === 'error' ? 'text-red-400' : 'text-slate-400'}`}>
            {message}
          </p>
        </div>

        {mode === 'resetPassword' && status === 'success' && message.includes('yeni şifrenizi girin') && (
          <form className="space-y-4" onSubmit={handleApplyNewPassword}>
            <div>
              <label className="text-xs font-bold text-slate-400 uppercase tracking-widest pl-1 mb-2 block">Yeni Şifre</label>
              <input 
                type="password" 
                required
                minLength={6}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-slate-950 border border-white/5 rounded-2xl py-3.5 px-4 text-white text-sm outline-none focus:border-blue-500/50 transition-all"
                placeholder="En az 6 karakter"
              />
            </div>
            <button 
              type="submit"
              className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-bold py-4 rounded-xl shadow-lg hover:shadow-blue-500/25 border border-white/10 hover:border-white/20 transition-all text-sm uppercase tracking-wide"
            >
              Şifreyi Güncelle
            </button>
          </form>
        )}

        {status !== 'loading' && (!mode || mode === 'verifyEmail' || message.includes('başarıyla değiştirildi')) && (
          <button 
            onClick={() => navigate('/giris')}
            className="w-full mt-6 bg-slate-800 text-white font-bold py-3.5 rounded-xl hover:bg-slate-700 transition-colors border border-white/5 text-sm uppercase tracking-wider"
          >
            Giriş Sayfasına Dön
          </button>
        )}
      </div>
    </div>
  );
}
