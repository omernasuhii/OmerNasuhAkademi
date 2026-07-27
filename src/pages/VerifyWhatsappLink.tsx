import React, { useEffect, useState } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { CheckCircle, Loader2, AlertCircle, MessageSquare } from "lucide-react";

export default function VerifyWhatsappLink() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const uid = searchParams.get("u");
  const code = searchParams.get("c");

  const [status, setStatus] = useState<"loading" | "success" | "error">("loading");
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    const performDirectVerification = async () => {
      if (!uid || !code) {
        setStatus("error");
        setErrorMessage("Geçersiz veya eksik doğrulama bağlantısı.");
        return;
      }

      try {
        const response = await fetch("/api/verify-whatsapp-direct", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ uid, code }),
        });

        const data = await response.json();

        if (response.ok && data.success) {
          setStatus("success");
          setTimeout(() => {
            navigate("/");
          }, 3000);
        } else {
          setStatus("error");
          setErrorMessage(data.error || "Doğrulama işlemi başarısız oldu.");
        }
      } catch (err: any) {
        console.error("Direct verification error:", err);
        setStatus("error");
        setErrorMessage("Sunucu ile bağlantı kurulamadı.");
      }
    };

    performDirectVerification();
  }, [uid, code, navigate]);

  return (
    <div className="min-h-screen flex items-center justify-center px-4 bg-[#0f172a] text-white">
      <div className="max-w-md w-full bg-slate-900 border border-white/10 rounded-3xl p-8 text-center shadow-2xl relative overflow-hidden">
        {/* Decorative background gradients */}
        <div className="absolute top-0 left-0 w-32 h-32 bg-emerald-500/10 rounded-full blur-2xl -translate-y-1/2 -translate-x-1/2 pointer-events-none"></div>
        <div className="absolute bottom-0 right-0 w-32 h-32 bg-blue-500/10 rounded-full blur-2xl translate-y-1/2 translate-x-1/2 pointer-events-none"></div>

        {status === "loading" && (
          <div className="space-y-6">
            <div className="w-20 h-20 bg-emerald-500/10 text-emerald-400 rounded-full flex items-center justify-center mx-auto animate-pulse">
              <Loader2 size={40} className="animate-spin text-emerald-500" />
            </div>
            <h2 className="text-2xl font-bold">WhatsApp Doğrulaması</h2>
            <p className="text-slate-400 text-sm">
              Telefon numaranız doğrulanıyor, lütfen bekleyin...
            </p>
          </div>
        )}

        {status === "success" && (
          <div className="space-y-6 animate-in fade-in zoom-in duration-300">
            <div className="w-20 h-20 bg-emerald-500/20 text-emerald-400 rounded-full flex items-center justify-center mx-auto">
              <CheckCircle size={44} className="text-emerald-400" />
            </div>
            <h2 className="text-2xl font-bold text-white">Doğrulama Başarılı!</h2>
            <p className="text-slate-300 text-sm">
              Tebrikler! Telefon numaranız WhatsApp üzerinden tek tıkla başarıyla doğrulandı.
            </p>
            <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-xl text-emerald-400 text-xs">
              Ana sayfaya yönlendiriliyorsunuz...
            </div>
          </div>
        )}

        {status === "error" && (
          <div className="space-y-6 animate-in fade-in zoom-in duration-300">
            <div className="w-20 h-20 bg-red-500/10 text-red-500 rounded-full flex items-center justify-center mx-auto">
              <AlertCircle size={44} />
            </div>
            <h2 className="text-2xl font-bold text-white">Doğrulama Başarısız</h2>
            <p className="text-red-400 text-sm font-medium">{errorMessage}</p>
            <p className="text-slate-400 text-xs">
              Lütfen tarayıcıyı kapatıp tekrar deneyin veya destek ekibiyle iletişime geçin.
            </p>
            <button
              onClick={() => navigate("/")}
              className="w-full py-3 bg-slate-800 hover:bg-slate-700 text-white font-semibold rounded-xl transition-colors text-sm"
            >
              Ana Sayfaya Git
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
