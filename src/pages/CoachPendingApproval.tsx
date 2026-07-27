import React from "react";
import { UserCheck } from "lucide-react";
import { useAuth } from "../lib/AuthContext";

export default function CoachPendingApproval() {
  const { logout, userData } = useAuth();

  const isRejected = userData?.approved === "rejected";

  return (
    <div className="flex-1 flex items-center justify-center p-6 min-h-[80vh]">
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
    </div>
  );
}
