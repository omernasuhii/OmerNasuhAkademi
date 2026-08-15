import React, { useState, useEffect } from "react";
import { MessageCircle, QrCode, Send, RefreshCw, ChevronDown, ChevronUp, Copy, Check, ShieldCheck } from "lucide-react";

interface WhatsAppFallbackHelpProps {
  phone: string;
  onCodeSent?: (resData: any) => void;
}

export const WhatsAppFallbackHelp: React.FC<WhatsAppFallbackHelpProps> = ({ phone, onCodeSent }) => {
  const [expanded, setExpanded] = useState(false);
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);
  const [statusMsg, setStatusMsg] = useState<string | null>(null);
  const [targetWaNumber, setTargetWaNumber] = useState<string>("14155238886");

  useEffect(() => {
    fetch("/api/whatsapp-status")
      .then((res) => res.json())
      .then((data) => {
        if (data && data.whatsappNumber) {
          const cleaned = data.whatsappNumber.replace(/\D/g, "");
          if (cleaned) setTargetWaNumber(cleaned);
        }
      })
      .catch((err) => console.log("Failed to fetch WhatsApp status in fallback help:", err));
  }, []);

  // Format clean phone for identifier
  const cleanPhone = phone.replace(/\D/g, "");
  const formattedPhoneForId = cleanPhone.length >= 10 ? cleanPhone : phone;
  const uniqueUserCode = `FO-${formattedPhoneForId.slice(-8)}`;

  const destinationNumber = targetWaNumber;
  const displayDestination = destinationNumber.startsWith("+") ? destinationNumber : `+${destinationNumber}`;

  const prefilledMessage = `FocusON Akademi Doğrulama Kodu İsteği: ${uniqueUserCode}`;
  const whatsappUrl = `https://wa.me/${destinationNumber}?text=${encodeURIComponent(prefilledMessage)}`;
  const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=180x180&margin=10&data=${encodeURIComponent(whatsappUrl)}`;

  const handleCopyMessage = () => {
    navigator.clipboard.writeText(prefilledMessage);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleRequestNewCode = async () => {
    setLoading(true);
    setStatusMsg(null);
    try {
      const res = await fetch("/api/twilio-verify-send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setStatusMsg("Yeni doğrulama kodunuz WhatsApp üzerinden tekrar iletildi!");
        if (onCodeSent) {
          onCodeSent(data);
        }
      } else {
        setStatusMsg(data.error || "Yeni kod gönderilirken bir hata oluştu.");
      }
    } catch (err: any) {
      setStatusMsg("Bağlantı hatası: " + (err.message || err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mt-4 border border-white/10 rounded-2xl bg-slate-950/60 overflow-hidden transition-all text-left">
      <button
        type="button"
        onClick={() => setExpanded(!expanded)}
        className="w-full px-4 py-3 flex items-center justify-between text-xs font-bold text-slate-300 hover:text-white bg-slate-900/60 hover:bg-slate-900 transition-colors"
      >
        <span className="flex items-center gap-2">
          <MessageCircle size={15} className="text-emerald-400" />
          <span>Kodu almadınız mı? Hızlı WhatsApp Kanal Onayı</span>
        </span>
        {expanded ? <ChevronUp size={16} className="text-slate-400" /> : <ChevronDown size={16} className="text-slate-400" />}
      </button>

      {expanded && (
        <div className="p-4 space-y-4 border-t border-white/5 animate-in fade-in duration-200">
          <p className="text-[11px] text-slate-400 leading-relaxed">
            WhatsApp mesajı alamıyorsanız, aşağıdaki butona tıklayarak veya karekodu taratarak <strong className="text-emerald-400">{displayDestination}</strong> hattımıza özel kodunuzla mesaj gönderebilirsiniz. Mesaj ulaştığında doğrulama kodu otomatik tanımlanacaktır.
          </p>

          <div className="flex flex-col sm:flex-row items-center gap-4 bg-slate-900/80 p-3.5 rounded-xl border border-white/5">
            {/* QR Code */}
            <div className="flex flex-col items-center shrink-0">
              <div className="p-1.5 bg-white rounded-xl shadow-lg border border-white/20">
                <img
                  src={qrCodeUrl}
                  alt="WhatsApp Karekod"
                  className="w-28 h-28 object-contain rounded-lg"
                />
              </div>
              <span className="text-[9px] text-slate-400 mt-1 flex items-center gap-1 font-mono">
                <QrCode size={10} /> Kamera ile Taratın
              </span>
            </div>

            {/* Direct Link & Copy */}
            <div className="flex-1 space-y-2.5 w-full text-center sm:text-left">
              <div className="bg-slate-950 px-3 py-2 rounded-lg border border-white/5 text-[11px] font-mono text-slate-300 flex items-center justify-between gap-2">
                <span className="truncate text-emerald-400 font-semibold">{uniqueUserCode}</span>
                <button
                  type="button"
                  onClick={handleCopyMessage}
                  className="p-1 hover:bg-slate-800 text-slate-400 hover:text-white rounded transition-colors shrink-0"
                  title="Kodu Kopyala"
                >
                  {copied ? <Check size={13} className="text-emerald-400" /> : <Copy size={13} />}
                </button>
              </div>

              <a
                href={whatsappUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs py-2.5 px-4 rounded-xl transition-all shadow-md shadow-emerald-600/20 flex items-center justify-center gap-2"
              >
                <Send size={14} />
                WhatsApp'ta Mesaj Gönder
              </a>
            </div>
          </div>

          {/* Trigger Send Fresh Code */}
          <div className="pt-2 border-t border-white/5">
            <button
              type="button"
              onClick={handleRequestNewCode}
              disabled={loading}
              className="w-full py-2.5 px-4 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold rounded-xl border border-white/10 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {loading ? (
                <>
                  <RefreshCw size={14} className="animate-spin text-emerald-400" />
                  Kod İletiliyor...
                </>
              ) : (
                <>
                  <ShieldCheck size={14} className="text-emerald-400" />
                  Mesajı Gönderdim, Yeni Kodu İlet
                </>
              )}
            </button>

            {statusMsg && (
              <p className="mt-2 text-[11px] font-medium text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-3 py-1.5 rounded-lg text-center animate-in fade-in">
                {statusMsg}
              </p>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
