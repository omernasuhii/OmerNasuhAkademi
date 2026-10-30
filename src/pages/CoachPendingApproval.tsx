import React, { useState } from "react";
import { UserCheck, Copy, Check, Info, Gift, Sparkles } from "lucide-react";
import { useAuth } from "../lib/AuthContext";

export default function CoachPendingApproval() {
  const { logout, user, userData } = useAuth();
  const [copied, setCopied] = useState(false);

  const isRejected = userData?.approved === "rejected";
  const refCode = userData?.referralCode || (user?.uid ? ("KOC" + user.uid.substring(0, 4).toUpperCase()) : "KOC");
  const usedReferralCode = userData?.referredByCode;

  const handleCopy = () => {
    navigator.clipboard.writeText(refCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  return (
    <div className="flex-1 flex flex-col items-center justify-center p-6 min-h-[85vh] gap-6">
      <div className="w-full max-w-lg bg-slate-900/60 backdrop-blur-xl border border-white/10 rounded-3xl p-8 shadow-2xl relative overflow-hidden text-center">
        {/* Decorative blur */}
        <div
          className={`absolute top-0 left-0 w-64 h-64 ${isRejected ? "bg-red-500/20" : "bg-emerald-500/20"} rounded-full blur-3xl -translate-y-1/2 -translate-x-1/3 pointer-events-none`}
        ></div>

        <div
          className={`w-16 h-16 ${isRejected ? "bg-red-500/20 border-red-500/30" : "bg-emerald-500/20 border-emerald-500/30"} border rounded-2xl flex items-center justify-center mx-auto mb-6 relative z-10`}
        >
          <UserCheck
            className={`w-8 h-8 ${isRejected ? "text-red-400" : "text-emerald-400"}`}
          />
        </div>

        <h1 className="text-2xl font-bold text-white mb-4 relative z-10">
          {isRejected ? "Başvurunuz Reddedildi" : "Hesabınız Onay Bekliyor"}
        </h1>

        <p className="text-slate-400 mb-8 relative z-10 leading-relaxed">
          {isRejected
            ? "Koçluk başvurunuz yöneticilerimiz tarafından incelendi ancak şu an için kabul edilmedi. Daha fazla bilgi için bizimle iletişime geçebilirsiniz."
            : "Kaydınız başarıyla tamamlandı. Ancak koç olarak sisteme giriş yapabilmeniz için hesabınızın yöneticiler tarafından onaylanması gerekmektedir. Onay süreci tamamlandığında bilgi alacaksınız."}
        </p>

        <button
          onClick={logout}
          className="relative z-10 font-semibold px-6 py-3 rounded-xl bg-slate-800 text-white hover:bg-slate-700 transition-colors w-full border border-white/5"
        >
          Çıkış Yap
        </button>
      </div>

      {/* 1500 TL Hoş Geldin Hediyesi Bilgilendirme Kartı */}
      {!isRejected && (
        <div className="w-full max-w-lg bg-gradient-to-br from-emerald-500/15 via-teal-500/10 to-slate-900 border border-emerald-500/30 rounded-3xl p-6 shadow-xl space-y-3 text-left relative overflow-hidden">
          <div className="flex items-center gap-3.5 border-b border-emerald-500/20 pb-3">
            <div className="w-11 h-11 rounded-xl bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center text-emerald-300 shrink-0">
              <Gift size={22} />
            </div>
            <div className="flex-1">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold text-emerald-300 flex items-center gap-2">
                  1.500 TL Hoş Geldin Hediyeniz Tanımlandı
                </h3>
                <span className="px-2.5 py-0.5 rounded-full text-xs font-mono font-black bg-emerald-400 text-slate-950 shadow-sm">
                  ₺1.500
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">FocusOn Akademi koçlarına özel başlangıç desteği</p>
            </div>
          </div>
          <p className="text-xs text-slate-300 leading-relaxed">
            FocusOn Akademi ailesine katıldığınız için teşekkür ederiz! <strong className="text-white">₺1.500 tutarındaki sistem başlangıç hediyeniz</strong> hesabınıza tanımlandı. Yöneticilerimiz başvurunuzu onayladığında cüzdanınızda hazır olacak ve koçluk faaliyetlerinizde doğrudan kullanabileceksiniz.
          </p>
        </div>
      )}

      {/* Sadece davet kodu başarıyla tanımlandıysa gösterilen avantaj bilgilendirme alanı */}
      {usedReferralCode && (
        <div className="w-full max-w-lg bg-emerald-500/10 backdrop-blur-xl border border-emerald-500/30 rounded-3xl p-6 shadow-xl space-y-3 text-left">
          <div className="flex items-center gap-3 border-b border-emerald-500/20 pb-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center text-emerald-300 shrink-0">
              <Gift size={20} />
            </div>
            <div>
              <h3 className="text-sm font-bold text-emerald-300 flex items-center gap-2">
                Referans Kodu Avantajı Etkin
                <span className="px-2 py-0.5 rounded text-[10px] font-mono font-extrabold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                  {usedReferralCode}
                </span>
              </h3>
              <p className="text-xs text-slate-400">Davet kodu kaydınıza başarıyla işlendi</p>
            </div>
          </div>

          <div className="space-y-2 text-xs text-slate-300 leading-relaxed">
            <p>
              Sisteme bir meslektaşınızın davet koduyla (<strong className="text-emerald-300 font-mono">{usedReferralCode}</strong>) kaydolduğunuz için referans avantajlarınız tanımlanmıştır:
            </p>
            <ul className="space-y-1.5 pl-1 text-slate-300">
              <li className="flex items-start gap-2">
                <Sparkles size={14} className="text-emerald-400 shrink-0 mt-0.5" />
                <span><strong>İlk Bakiye Yükleme Bonusu:</strong> Hesabınız onaylandıktan sonra yapacağınız ilk bakiye yüklemesinde hediye bakiye kazanırsınız.</span>
              </li>
              <li className="flex items-start gap-2">
                <Sparkles size={14} className="text-emerald-400 shrink-0 mt-0.5" />
                <span><strong>Koçluk Ağı Eşleşmesi:</strong> Sizi davet eden koç ile referans ağında başarıyla eşleştiniz.</span>
              </li>
            </ul>
          </div>
        </div>
      )}

      {/* Referans & Koç Kodu Bilgilendirme Alanı */}
      <div className="w-full max-w-lg bg-slate-900/50 backdrop-blur-xl border border-emerald-500/20 rounded-3xl p-6 shadow-xl space-y-4">
        <div className="flex items-center gap-3 border-b border-white/10 pb-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 shrink-0">
            <Info size={20} />
          </div>
          <div className="text-left">
            <h3 className="text-base font-bold text-white">Koç Kodunuz & Referans Bilgilendirmesi</h3>
            <p className="text-xs text-slate-400">Sistemdeki benzersiz kodunuz ve kullanım bilgileri</p>
          </div>
        </div>

        <div className="bg-slate-950/60 border border-white/10 rounded-2xl p-4 flex items-center justify-between gap-4">
          <div className="text-left">
            <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest block mb-0.5">SİZİN KODUNUZ</span>
            <span className="text-xl font-mono font-black text-emerald-400 tracking-wider">{refCode}</span>
          </div>
          <button
            onClick={handleCopy}
            className="bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-300 border border-emerald-500/30 px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer"
          >
            {copied ? (
              <>
                <Check size={14} /> Kopyalandı
              </>
            ) : (
              <>
                <Copy size={14} /> Kopyala
              </>
            )}
          </button>
        </div>

        <div className="space-y-2.5 text-xs text-slate-300 text-left leading-relaxed bg-white/5 p-4 rounded-2xl border border-white/5">
          <div className="flex items-start gap-2">
            <span className="text-emerald-400 font-bold">•</span>
            <p><strong>Koç Referans Kodu:</strong> Yukarıdaki kod sizin davet kodunuzdur. Diğer koçları platforma davet ettiğinizde onların bakiye yüklemelerinden hediye bakiye kazanırsınız.</p>
          </div>
          <div className="flex items-start gap-2">
            <span className="text-emerald-400 font-bold">•</span>
            <p><strong>Öğrenci Eşleşme (Koç Kodu):</strong> Öğrencilerinizin sizinle eşleşmesi için kullanılan <em>Koç Kodu</em>, hesabınız onaylandıktan sonra <strong>Profil Ayarları</strong> sayfasından belirlenmektedir.</p>
          </div>
        </div>
      </div>
    </div>
  );
}
