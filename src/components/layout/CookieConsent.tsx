import React, { useState, useEffect } from 'react';
import { Cookie, ShieldCheck, ChevronDown, ChevronUp, Check, X, Lock } from 'lucide-react';
import { Link } from 'react-router-dom';

export interface CookiePreferences {
  essential: boolean; // Always true
  analytics: boolean; // Google Tag Manager / Analytics
  functional: boolean; // Site preferences
}

export const CookieConsent: React.FC = () => {
  const [isVisible, setIsVisible] = useState(false);
  const [showDetails, setShowDetails] = useState(false);
  const [preferences, setPreferences] = useState<CookiePreferences>({
    essential: true,
    analytics: true,
    functional: true,
  });

  useEffect(() => {
    const savedConsent = localStorage.getItem('focuson_cookie_consent');
    if (!savedConsent) {
      // Small delay for smooth entry animation
      const timer = setTimeout(() => {
        setIsVisible(true);
      }, 800);
      return () => clearTimeout(timer);
    } else {
      try {
        const parsed = JSON.parse(savedConsent);
        if (parsed && typeof parsed === 'object') {
          setPreferences({
            essential: true,
            analytics: parsed.analytics ?? true,
            functional: parsed.functional ?? true,
          });
        }
      } catch (e) {
        // Ignore parse error
      }
    }
  }, []);

  const saveConsent = (prefs: CookiePreferences) => {
    localStorage.setItem('focuson_cookie_consent', JSON.stringify({
      ...prefs,
      essential: true,
      timestamp: new Date().toISOString()
    }));

    // Update gtag analytics consent if available
    if (typeof window !== 'undefined' && (window as any).gtag) {
      (window as any).gtag('consent', 'update', {
        analytics_storage: prefs.analytics ? 'granted' : 'denied'
      });
    }

    setIsVisible(false);
  };

  const handleAcceptAll = () => {
    const allAccepted: CookiePreferences = { essential: true, analytics: true, functional: true };
    setPreferences(allAccepted);
    saveConsent(allAccepted);
  };

  const handleAcceptEssential = () => {
    const essentialOnly: CookiePreferences = { essential: true, analytics: false, functional: false };
    setPreferences(essentialOnly);
    saveConsent(essentialOnly);
  };

  const handleSaveCustom = () => {
    saveConsent(preferences);
  };

  if (!isVisible) return null;

  return (
    <div className="fixed bottom-4 left-4 right-4 md:left-6 md:right-auto md:max-w-xl z-50 animate-in fade-in slide-in-from-bottom-5 duration-300">
      <div className="bg-slate-900/95 backdrop-blur-md border border-slate-700/80 rounded-2xl p-5 shadow-2xl text-slate-100 relative overflow-hidden">
        {/* Decorative Top Accent Line */}
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-blue-500 via-emerald-400 to-indigo-500" />

        <div className="flex items-start justify-between gap-3 mb-3">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center shrink-0">
              <Cookie className="w-5 h-5 text-blue-400" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                Çerez ve Gizlilik Bildirimi
              </h3>
              <p className="text-xs text-slate-400">
                Deneyiminizi iyileştirmek ve analitik hizmetler sunmak için çerezler kullanıyoruz.
              </p>
            </div>
          </div>
          <button
            onClick={handleAcceptEssential}
            className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition-colors shrink-0"
            title="Kapat ve Yalnızca Gerekli Çerezleri Kabul Et"
          >
            <X size={18} />
          </button>
        </div>

        <p className="text-xs text-slate-300 leading-relaxed mb-4">
          Focuson Akademi platformunda güvenli oturum yönetimi, performans analizi ve ziyaret istatistikleri (Google Tag Manager) için çerezler kullanılmaktadır.{' '}
          <Link to="/gizlilik-politikasi" className="text-blue-400 underline underline-offset-2 hover:text-blue-300 transition-colors">
            Gizlilik Politikamızı
          </Link>{' '}
          inceleyebilirsiniz.
        </p>

        {/* Custom Details Accordion */}
        {showDetails && (
          <div className="mb-4 bg-slate-950/80 border border-slate-800 rounded-xl p-3.5 space-y-3">
            <div className="flex items-center justify-between text-xs">
              <div className="flex items-center gap-2">
                <Lock size={14} className="text-slate-400" />
                <span className="font-semibold text-slate-200">Zorunlu Çerezler</span>
              </div>
              <span className="text-[11px] bg-slate-800 text-slate-400 font-medium px-2 py-0.5 rounded-md">
                Her Zaman Etkin
              </span>
            </div>
            <p className="text-[11px] text-slate-400 pl-5">
              Oturum açma, güvenlik ve temel platform işlevleri için gereklidir. Devre dışı bırakılamaz.
            </p>

            <div className="border-t border-slate-800/80 pt-2.5 flex items-center justify-between text-xs">
              <div className="flex items-center gap-2">
                <ShieldCheck size={14} className="text-blue-400" />
                <span className="font-semibold text-slate-200">Analiz ve Performans Çerezleri</span>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={preferences.analytics}
                  onChange={(e) => setPreferences({ ...preferences, analytics: e.target.checked })}
                  className="sr-only peer"
                />
                <div className="w-8 h-4 bg-slate-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-3 after:w-3 after:transition-all peer-checked:bg-blue-600"></div>
              </label>
            </div>
            <p className="text-[11px] text-slate-400 pl-5">
              Google Analytics (gtag.js) ile ziyaretçi trafiğini anonim olarak analiz etmemize yardımcı olur.
            </p>

            <div className="border-t border-slate-800/80 pt-2.5 flex items-center justify-between text-xs">
              <div className="flex items-center gap-2">
                <Cookie size={14} className="text-emerald-400" />
                <span className="font-semibold text-slate-200">İşlevsel Çerezler</span>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={preferences.functional}
                  onChange={(e) => setPreferences({ ...preferences, functional: e.target.checked })}
                  className="sr-only peer"
                />
                <div className="w-8 h-4 bg-slate-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-3 after:w-3 after:transition-all peer-checked:bg-emerald-600"></div>
              </label>
            </div>
            <p className="text-[11px] text-slate-400 pl-5">
              Kullanıcı tercihlerini (tema, dil, filtre tercihleri) hatırlamamızı sağlar.
            </p>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex flex-wrap items-center justify-between gap-2 pt-1 border-t border-slate-800/80">
          <button
            onClick={() => setShowDetails(!showDetails)}
            className="text-xs text-slate-400 hover:text-slate-200 font-medium flex items-center gap-1 transition-colors px-1 py-1"
          >
            {showDetails ? (
              <>
                Detayları Gizle <ChevronUp size={14} />
              </>
            ) : (
              <>
                Tercihleri Özelleştir <ChevronDown size={14} />
              </>
            )}
          </button>

          <div className="flex items-center gap-2 w-full sm:w-auto justify-end ml-auto">
            {showDetails ? (
              <button
                onClick={handleSaveCustom}
                className="px-3.5 py-1.5 text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-white rounded-xl border border-slate-700 transition-colors"
              >
                Seçimlerimi Kaydet
              </button>
            ) : (
              <button
                onClick={handleAcceptEssential}
                className="px-3.5 py-1.5 text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl border border-slate-700 transition-colors"
              >
                Yalnızca Gerekli
              </button>
            )}

            <button
              onClick={handleAcceptAll}
              className="px-4 py-1.5 text-xs font-bold bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white rounded-xl shadow-md transition-all flex items-center gap-1.5"
            >
              <Check size={14} /> Tümünü Kabul Et
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
