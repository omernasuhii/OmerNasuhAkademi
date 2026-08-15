import React, { useState, useEffect } from 'react';
import { doc, getDoc, setDoc, collection, query, orderBy, limit, getDocs } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { Settings, Save, Shield, MessageSquare, Send, Smartphone, Clock, User, RefreshCw, CreditCard, Sparkles, Check, Activity, Terminal, AlertTriangle, CheckCircle2, XCircle, Play, ChevronDown, ChevronUp, FileText, Bell } from 'lucide-react';
import { paytrService } from '../../services/paytrService';

export default function SystemSettings() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [bypassVerification, setBypassVerification] = useState(false);
  const [subscriptionRemindersEnabled, setSubscriptionRemindersEnabled] = useState(true);
  const [message, setMessage] = useState('');
  
  // PayTR Sanal POS States
  const [merchantId, setMerchantId] = useState('342819');
  const [merchantKey, setMerchantKey] = useState('MOCK_KEY_123');
  const [merchantSalt, setMerchantSalt] = useState('MOCK_SALT_123');
  const [isTestMode, setIsTestMode] = useState(true);
  const [isPaytraActive, setIsPaytraActive] = useState(true);
  const [savingPaytr, setSavingPaytr] = useState(false);

  // WhatsApp Messages & Simulation states
  const [messagesList, setMessagesList] = useState<any[]>([]);
  const [simPhone, setSimPhone] = useState('+905450000000');
  const [simBody, setSimBody] = useState('onaylıyorum');
  const [simName, setSimName] = useState('Örnek Kullanıcı');
  const [simLoading, setSimLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  // Verification Log System & Live Diagnostics States
  const [verificationLogs, setVerificationLogs] = useState<any[]>([]);
  const [logsLoading, setLogsLoading] = useState(false);
  const [testPhone, setTestPhone] = useState('+905432073748');
  const [testRunning, setTestRunning] = useState(false);
  const [testOutput, setTestOutput] = useState<any>(null);
  const [expandedLogId, setExpandedLogId] = useState<string | null>(null);

  const fetchVerificationLogs = async () => {
    try {
      setLogsLoading(true);
      const res = await fetch('/api/admin/verification-logs');
      if (res.ok) {
        const data = await res.json();
        setVerificationLogs(data.logs || []);
      }
    } catch (err) {
      console.error("Error fetching verification logs:", err);
    } finally {
      setLogsLoading(false);
    }
  };

  const handleRunLiveWhatsAppTest = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!testPhone) return;
    setTestRunning(true);
    setTestOutput(null);
    try {
      const res = await fetch('/api/admin/test-twilio-whatsapp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone: testPhone })
      });
      const data = await res.json();
      setTestOutput(data);
      await fetchVerificationLogs();
    } catch (err: any) {
      setTestOutput({
        success: false,
        logs: [`[Kritik Bağlantı Hatası] ${err.message}`]
      });
    } finally {
      setTestRunning(false);
    }
  };

  const fetchSettings = async () => {
    try {
      const snap = await getDoc(doc(db, 'settings', 'system'));
      if (snap.exists()) {
        const data = snap.data();
        setBypassVerification(data.bypassVerification || data.bypassInternalVerification || false);
        setSubscriptionRemindersEnabled(data.subscriptionRemindersEnabled ?? true);
      }
      
      const paytr = await paytrService.getSettings();
      if (paytr) {
        if (paytr.merchantId) setMerchantId(paytr.merchantId);
        if (paytr.merchantKey) setMerchantKey(paytr.merchantKey);
        if (paytr.merchantSalt) setMerchantSalt(paytr.merchantSalt);
        setIsTestMode(paytr.isTestMode !== false);
        setIsPaytraActive(paytr.isActive !== false);
      }
    } catch (err) {
      console.error("Error fetching settings:", err);
    }
  };

  const fetchMessages = async () => {
    try {
      setRefreshing(true);
      const q = query(collection(db, 'whatsapp_messages'), orderBy('timestamp', 'desc'), limit(50));
      const snap = await getDocs(q);
      const list = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setMessagesList(list);
    } catch (err) {
      console.error("Error fetching whatsapp messages:", err);
    } finally {
      setRefreshing(false);
    }
  };

  useEffect(() => {
    const initData = async () => {
      setLoading(true);
      await Promise.all([fetchSettings(), fetchMessages(), fetchVerificationLogs()]);
      setLoading(false);
    };
    initData();
  }, []);

  const handleSave = async () => {
    setSaving(true);
    setMessage('');
    try {
      await setDoc(doc(db, 'settings', 'system'), {
        bypassVerification,
        subscriptionRemindersEnabled
      }, { merge: true });
      setMessage('Ayarlar başarıyla kaydedildi.');
      setTimeout(() => setMessage(''), 3000);
    } catch (err) {
      console.error(err);
      setMessage('Hata oluştu.');
    } finally {
      setSaving(false);
    }
  };

  const handleSimulateWebhook = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!simPhone || !simBody) return;
    setSimLoading(true);
    setMessage('');
    try {
      const res = await fetch('/api/whatsapp-webhook', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          From: simPhone,
          Body: simBody,
          ProfileName: simName || 'Test User',
          MessageSid: 'SIM-' + Math.random().toString(36).substring(2, 9).toUpperCase()
        })
      });
      if (res.ok) {
        setMessage('WhatsApp mesajı başarıyla simüle edildi ve toplandı!');
        setTimeout(() => setMessage(''), 3000);
        await fetchMessages();
      } else {
        setMessage('Simülasyon başarısız oldu.');
      }
    } catch (err) {
      console.error(err);
      setMessage('Simülasyon sırasında hata oluştu.');
    } finally {
      setSimLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="w-8 h-8 rounded-full border-2 border-red-500 border-t-transparent animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto space-y-8 pb-12">
      <div>
        <h1 className="text-2xl font-bold text-white mb-2 flex items-center gap-3">
          <Settings className="text-red-500" />
          Sistem Ayarları
        </h1>
        <p className="text-slate-400">Genel sistem konfigürasyonunu ve güvenlik parametrelerini yönetin.</p>
      </div>

      <div className="bg-slate-900 border border-white/5 rounded-3xl p-6 md:p-8">
        <h2 className="text-lg font-bold text-white mb-6 flex items-center gap-2 border-b border-white/5 pb-4">
          <Shield size={20} className="text-blue-500" />
          Güvenlik & Doğrulama
        </h2>

        <div className="space-y-6">
          <div className="flex items-center justify-between p-4 bg-slate-800/50 rounded-2xl">
            <div>
              <p className="font-bold text-white mb-1">Kayıt Doğrulamalarını Devre Dışı Bırak (Test Modu)</p>
              <p className="text-sm text-slate-400">
                Açıldığında, yeni kayıt olan kullanıcılar e-posta ve telefon doğrulaması adımlarını atlar. Test aşaması için uygundur.
              </p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer ml-4 shrink-0">
              <input 
                type="checkbox" 
                className="sr-only peer"
                checked={bypassVerification}
                onChange={e => setBypassVerification(e.target.checked)}
              />
              <div className="w-14 h-7 bg-slate-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-6 after:w-6 after:transition-all peer-checked:bg-blue-500"></div>
            </label>
          </div>
          
          <div className="flex flex-col sm:flex-row sm:items-center justify-between p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-xl gap-4">
            <div>
              <h3 className="text-white font-bold text-sm mb-1 flex items-center gap-2">
                <Bell size={16} className="text-emerald-400" />
                Abonelik Yenileme Hatırlatmaları (WhatsApp)
              </h3>
              <p className="text-slate-400 text-xs">
                Öğrencilerin abonelik bitişine 5 ve 1 gün kala bakiyesi yetersizse veliye (WhatsApp üzerinden) otomatik hatırlatma mesajı gönderilir.
              </p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer ml-4 shrink-0">
              <input 
                type="checkbox" 
                className="sr-only peer"
                checked={subscriptionRemindersEnabled}
                onChange={e => setSubscriptionRemindersEnabled(e.target.checked)}
              />
              <div className="w-14 h-7 bg-slate-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-6 after:w-6 after:transition-all peer-checked:bg-emerald-500"></div>
            </label>
          </div>
        </div>

        <div className="mt-8 pt-6 border-t border-white/5 flex flex-wrap items-center justify-between gap-4">
          {message && !message.includes('simüle') && !message.includes('PayTR') && (
            <p className={`text-sm font-bold ${message.includes('Hata') ? 'text-red-400' : 'text-emerald-400'}`}>
              {message}
            </p>
          )}
          <button
            onClick={handleSave}
            disabled={saving}
            className="flex items-center gap-2 bg-red-600 hover:bg-red-500 text-white px-8 py-3 rounded-xl font-bold transition-all ml-auto shadow-lg shadow-red-600/10"
          >
            <Save size={20} />
            {saving ? 'Kaydediliyor...' : 'Ayarları Kaydet'}
          </button>
        </div>
      </div>

      {/* PayTR Sanal POS Payment Settings */}
      <div className="bg-slate-900 border border-white/5 rounded-3xl p-6 md:p-8">
        <div className="flex items-center justify-between border-b border-white/5 pb-4 mb-6">
          <div>
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              <CreditCard size={20} className="text-emerald-500" />
              PayTR Sanal POS Altyapısı
              <span className="bg-amber-500/20 text-amber-300 border border-amber-500/30 px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-widest flex items-center gap-1 ml-2">
                <Sparkles size={11} />
                Yakında
              </span>
            </h2>
            <p className="text-xs text-slate-400 mt-1">Koçların kredi kartı ve taksit seçenekleri ile sistem bakiyesi yüklemesi için PayTR API parametreleri.</p>
          </div>
        </div>

        <div className="space-y-5">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="text-xs font-bold text-slate-400 uppercase tracking-widest block mb-2">Merchant ID (Mağaza No)</label>
              <input
                type="text"
                value={merchantId}
                onChange={e => setMerchantId(e.target.value)}
                placeholder="Örn: 342819"
                className="w-full bg-slate-950 border border-white/10 rounded-xl px-4 py-2.5 text-xs text-white outline-none focus:border-emerald-500 font-mono"
              />
            </div>
            <div>
              <label className="text-xs font-bold text-slate-400 uppercase tracking-widest block mb-2">Merchant Key (Gizli Anahtar)</label>
              <input
                type="password"
                value={merchantKey}
                onChange={e => setMerchantKey(e.target.value)}
                placeholder="Mağaza gizli anahtarı"
                className="w-full bg-slate-950 border border-white/10 rounded-xl px-4 py-2.5 text-xs text-white outline-none focus:border-emerald-500 font-mono"
              />
            </div>
            <div>
              <label className="text-xs font-bold text-slate-400 uppercase tracking-widest block mb-2">Merchant Salt (Gizli Tuz)</label>
              <input
                type="password"
                value={merchantSalt}
                onChange={e => setMerchantSalt(e.target.value)}
                placeholder="Mağaza gizli tuz"
                className="w-full bg-slate-950 border border-white/10 rounded-xl px-4 py-2.5 text-xs text-white outline-none focus:border-emerald-500 font-mono"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
            <div className="flex items-center justify-between p-4 bg-slate-800/40 border border-white/5 rounded-2xl">
              <div>
                <p className="font-bold text-white text-sm">PayTR Test Modu (Sandbox)</p>
                <p className="text-xs text-slate-400">Aktif olduğunda gerçek kart çekimi yapılmaz, test kartları kabul edilir.</p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer ml-4 shrink-0">
                <input
                  type="checkbox"
                  className="sr-only peer"
                  checked={isTestMode}
                  onChange={e => setIsTestMode(e.target.checked)}
                />
                <div className="w-12 h-6 bg-slate-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-500"></div>
              </label>
            </div>

            <div className="flex items-center justify-between p-4 bg-slate-800/40 border border-white/5 rounded-2xl">
              <div>
                <p className="font-bold text-white text-sm">Sanal POS Ödeme Kanalı</p>
                <p className="text-xs text-slate-400">Koç cüzdanında Kredi Kartı ile yükleme seçeneğini aktif/pasif edin.</p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer ml-4 shrink-0">
                <input
                  type="checkbox"
                  className="sr-only peer"
                  checked={isPaytraActive}
                  onChange={e => setIsPaytraActive(e.target.checked)}
                />
                <div className="w-12 h-6 bg-slate-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-500"></div>
              </label>
            </div>
          </div>

          <div className="pt-4 border-t border-white/5 flex items-center justify-between">
            {message && message.includes('PayTR') && (
              <p className="text-xs font-bold text-emerald-400">{message}</p>
            )}
            <button
              onClick={async () => {
                setSavingPaytr(true);
                const ok = await paytrService.saveSettings({
                  merchantId,
                  merchantKey,
                  merchantSalt,
                  isTestMode,
                  isActive: isPaytraActive
                });
                setSavingPaytr(false);
                if (ok) {
                  setMessage('PayTR ayarları başarıyla kaydedildi.');
                  setTimeout(() => setMessage(''), 3000);
                }
              }}
              disabled={savingPaytr}
              className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-500 text-white px-6 py-2.5 rounded-xl text-xs font-bold transition-all ml-auto shadow-lg shadow-emerald-600/20"
            >
              <Save size={16} />
              {savingPaytr ? 'Kaydediliyor...' : 'PayTR Ayarlarını Kaydet'}
            </button>
          </div>
        </div>
      </div>

      {/* WhatsApp Message Collection & Webhook Simulation Section */}
      <div className="bg-slate-900 border border-white/5 rounded-3xl p-6 md:p-8">
        <div className="flex items-center justify-between border-b border-white/5 pb-4 mb-6">
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            <MessageSquare size={20} className="text-emerald-500" />
            WhatsApp Gelen Kutusu (Webhook Entegrasyonu)
          </h2>
          <button
            onClick={fetchMessages}
            disabled={refreshing}
            className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-xl transition-all flex items-center gap-1.5 text-xs font-semibold"
            title="Mesajları Yenile"
          >
            <RefreshCw size={14} className={refreshing ? 'animate-spin' : ''} />
            Yenile
          </button>
        </div>

        {message && message.includes('simüle') && (
          <div className="mb-6 p-3 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-sm rounded-xl font-medium animate-pulse">
            {message}
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Simulation Panel */}
          <div className="lg:col-span-5 bg-slate-950/40 border border-white/5 p-5 rounded-2xl space-y-4">
            <h3 className="font-bold text-white text-sm flex items-center gap-2 border-b border-white/5 pb-2">
              <Send size={15} className="text-emerald-500" />
              Webhook Test Paneli (Mesaj Simüle Et)
            </h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Bu form yardımıyla Twilio'dan geliyormuş gibi bir WhatsApp mesajını simüle edebilirsiniz. Gönderilen mesaj "onay" içeriyorsa, o numaralı kayıtlı kullanıcı anında onaylanacaktır.
            </p>
            <form onSubmit={handleSimulateWebhook} className="space-y-3">
              <div>
                <label className="block text-[10px] text-slate-400 font-bold uppercase mb-1">Gönderen Telefon</label>
                <div className="relative">
                  <span className="absolute left-3 top-2.5 text-xs text-slate-500"><Smartphone size={13} /></span>
                  <input
                    type="text"
                    value={simPhone}
                    onChange={e => setSimPhone(e.target.value)}
                    placeholder="+905450000000"
                    className="w-full bg-slate-900 border border-white/5 text-xs rounded-lg py-2 pl-8 pr-3 text-white focus:outline-none focus:border-emerald-500"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-[10px] text-slate-400 font-bold uppercase mb-1">Profil Adı (Opsiyonel)</label>
                <div className="relative">
                  <span className="absolute left-3 top-2.5 text-xs text-slate-500"><User size={13} /></span>
                  <input
                    type="text"
                    value={simName}
                    onChange={e => setSimName(e.target.value)}
                    placeholder="Örnek Kullanıcı"
                    className="w-full bg-slate-900 border border-white/5 text-xs rounded-lg py-2 pl-8 pr-3 text-white focus:outline-none focus:border-emerald-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[10px] text-slate-400 font-bold uppercase mb-1">Mesaj İçeriği</label>
                <textarea
                  value={simBody}
                  onChange={e => setSimBody(e.target.value)}
                  placeholder="FocusON Akademi doğrulaması için onaylıyorum."
                  className="w-full bg-slate-900 border border-white/5 text-xs rounded-lg p-2 text-white h-20 focus:outline-none focus:border-emerald-500 resize-none"
                  required
                />
              </div>

              <button
                type="submit"
                disabled={simLoading}
                className="w-full bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold py-2 px-4 rounded-xl transition-all flex items-center justify-center gap-1.5 shadow"
              >
                <Send size={12} />
                {simLoading ? 'Simüle Ediliyor...' : 'Simüle Et & Gönder'}
              </button>
            </form>
          </div>

          {/* Received Messages List */}
          <div className="lg:col-span-7 space-y-3">
            <h3 className="font-bold text-white text-sm border-b border-white/5 pb-2">
              Toplanan Son WhatsApp Mesajları ({messagesList.length})
            </h3>

            {messagesList.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-48 bg-slate-950/10 border border-dashed border-white/5 rounded-2xl text-slate-500">
                <MessageSquare size={32} className="text-slate-600 mb-2" />
                <p className="text-xs">Henüz toplanmış bir WhatsApp mesajı bulunmuyor.</p>
                <p className="text-[10px] text-slate-600 mt-1">Simüle ederek ilk mesajınızı ekleyebilirsiniz.</p>
              </div>
            ) : (
              <div className="max-h-80 overflow-y-auto space-y-2 pr-1 custom-scrollbar">
                {messagesList.map((msg) => {
                  const lowerBody = (msg.body || '').toLowerCase();
                  const isApproval = lowerBody.includes('onay') || lowerBody.includes('onayli') || lowerBody.includes('politik') || lowerBody.includes('onaylıyorum') || lowerBody.includes('confirm') || lowerBody.includes('merhaba');
                  
                  return (
                    <div key={msg.id} className="bg-slate-950/30 border border-white/5 p-3 rounded-xl flex flex-col gap-1 hover:border-white/10 transition-colors">
                      <div className="flex items-center justify-between text-[10px] text-slate-400">
                        <span className="font-bold text-slate-300 flex items-center gap-1">
                          <Smartphone size={10} className="text-slate-500" /> {msg.phone}
                          {msg.senderName && <span className="text-slate-500">({msg.senderName})</span>}
                        </span>
                        <span className="flex items-center gap-1">
                          <Clock size={10} />
                          {msg.timestamp?.toDate ? msg.timestamp.toDate().toLocaleString('tr-TR') : 'Şimdi'}
                        </span>
                      </div>
                      <p className="text-xs text-slate-200 mt-1 whitespace-pre-wrap">{msg.body}</p>
                      {isApproval && (
                        <div className="mt-1.5 self-start bg-emerald-500/10 text-emerald-400 text-[8px] font-bold px-1.5 py-0.5 rounded-full uppercase tracking-wider">
                          Politika Onay Mesajı
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* WhatsApp & Twilio Verification Logs & Live Diagnostic Panel */}
      <div className="bg-slate-900 border border-white/5 rounded-3xl p-6 md:p-8 space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-white/5 pb-4">
          <div>
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              <Activity size={20} className="text-blue-400" />
              WhatsApp & Twilio Doğrulama Logları ve Canlı Teşhis Paneli
            </h2>
            <p className="text-xs text-slate-400 mt-1">
              WhatsApp şablon mesajları, Twilio Verify API çağrıları ve simülasyon düşüş nedenlerinin anlık adımlı izleme sistemi.
            </p>
          </div>
          <button
            onClick={fetchVerificationLogs}
            disabled={logsLoading}
            className="p-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white rounded-xl transition-all flex items-center gap-2 text-xs font-semibold"
          >
            <RefreshCw size={14} className={logsLoading ? 'animate-spin text-blue-400' : ''} />
            Logları Yenile
          </button>
        </div>

        {/* Live Test Console */}
        <div className="bg-slate-950/60 border border-white/10 rounded-2xl p-5 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-white text-sm flex items-center gap-2">
              <Terminal size={16} className="text-emerald-400" />
              Canlı WhatsApp Doğrulama Testi
            </h3>
            <span className="text-[10px] text-slate-400 bg-slate-800 px-2.5 py-1 rounded-full font-mono">
              Şablon SID: HX885e9543b48e8a4cb1b577c825a9afb7
            </span>
          </div>

          <form onSubmit={handleRunLiveWhatsAppTest} className="flex flex-wrap sm:flex-nowrap gap-3">
            <div className="relative flex-1">
              <Smartphone size={14} className="absolute left-3.5 top-3 text-slate-500" />
              <input
                type="text"
                value={testPhone}
                onChange={e => setTestPhone(e.target.value)}
                placeholder="+905XXXXXXXXX"
                className="w-full bg-slate-900 border border-white/10 rounded-xl py-2.5 pl-10 pr-4 text-xs text-white font-mono outline-none focus:border-blue-500 transition-colors"
                required
              />
            </div>
            <button
              type="submit"
              disabled={testRunning}
              className="bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold px-6 py-2.5 rounded-xl transition-all flex items-center gap-2 shrink-0 shadow-lg shadow-blue-600/20 disabled:opacity-50"
            >
              <Play size={14} className={testRunning ? 'animate-spin' : ''} />
              {testRunning ? 'Test Ediliyor...' : 'WhatsApp Testi Başlat'}
            </button>
          </form>

          {/* Test Output Terminal */}
          {testOutput && (
            <div className="mt-4 bg-slate-900 border border-white/10 rounded-xl p-4 font-mono text-xs space-y-2">
              <div className="flex items-center justify-between border-b border-white/5 pb-2">
                <span className="font-bold text-slate-300 flex items-center gap-2">
                  {testOutput.success ? (
                    <CheckCircle2 size={15} className="text-emerald-400" />
                  ) : (
                    <XCircle size={15} className="text-red-400" />
                  )}
                  {testOutput.success ? 'Canlı Test Başarılı!' : 'Canlı Test Başarısız / Hata Saptandı'}
                </span>
                <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase ${testOutput.success ? 'bg-emerald-500/20 text-emerald-400' : 'bg-red-500/20 text-red-400'}`}>
                  {testOutput.method || 'Hata'}
                </span>
              </div>

              <div className="space-y-1.5 pt-1 text-[11px] leading-relaxed">
                {testOutput.logs?.map((logLine: string, idx: number) => (
                  <p
                    key={idx}
                    className={`
                      ${logLine.includes('BAŞARILI') ? 'text-emerald-400 font-bold' : ''}
                      ${logLine.includes('HATA') || logLine.includes('Hatası') ? 'text-red-400 font-bold' : ''}
                      ${logLine.includes('CANLI TEST') ? 'text-blue-300 font-bold' : ''}
                      ${!logLine.includes('BAŞARILI') && !logLine.includes('HATA') && !logLine.includes('CANLI TEST') ? 'text-slate-300' : ''}
                    `}
                  >
                    {logLine}
                  </p>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Verification Logs Table */}
        <div className="space-y-3">
          <h3 className="font-bold text-white text-sm flex items-center justify-between border-b border-white/5 pb-2">
            <span className="flex items-center gap-2">
              <FileText size={16} className="text-slate-400" />
              Doğrulama Geçmişi ({verificationLogs.length})
            </span>
            <span className="text-slate-500 font-normal text-xs">Son 50 işlem kaydı</span>
          </h3>

          {logsLoading ? (
            <div className="flex items-center justify-center py-12 text-slate-500 text-xs gap-2">
              <RefreshCw size={16} className="animate-spin text-blue-400" />
              Loglar yükleniyor...
            </div>
          ) : verificationLogs.length === 0 ? (
            <div className="text-center py-10 text-slate-500 text-xs border border-dashed border-white/5 rounded-2xl">
              Henüz kaydedilmiş bir doğrulama logu bulunmuyor. Test butonunu kullanarak ilk doğrulama denemesini gerçekleştirebilirsiniz.
            </div>
          ) : (
            <div className="space-y-2">
              {verificationLogs.map((log) => {
                const isExpanded = expandedLogId === log.id;
                const isSuccess = log.status === 'SUCCESS';
                const isSim = log.status === 'SIMULATED';

                return (
                  <div key={log.id} className="bg-slate-950/40 border border-white/5 rounded-2xl p-4 space-y-3 hover:border-white/10 transition-colors">
                    <div className="flex flex-wrap items-center justify-between gap-3 text-xs">
                      <div className="flex items-center gap-3">
                        <span className={`w-2.5 h-2.5 rounded-full shrink-0 ${isSuccess ? 'bg-emerald-400 shadow-lg shadow-emerald-500/50' : isSim ? 'bg-amber-400 shadow-lg shadow-amber-500/50' : 'bg-red-500 shadow-lg shadow-red-500/50'}`} />
                        <span className="font-bold font-mono text-white text-sm">{log.phone}</span>
                        <span className="text-[10px] text-slate-400 bg-slate-800/80 border border-white/5 px-2.5 py-0.5 rounded-full font-semibold">
                          {log.action === 'send_code' ? 'Kod Gönderimi' : log.action === 'check_code' ? 'Kod Onayı' : 'Canlı Test'}
                        </span>
                      </div>

                      <div className="flex items-center gap-3">
                        <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                          isSuccess ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' :
                          isSim ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20' :
                          'bg-red-500/10 text-red-400 border border-red-500/20'
                        }`}>
                          {isSuccess ? 'Başarılı' : isSim ? 'Simülasyon' : 'Hata'}
                        </span>

                        <span className="text-slate-500 text-[11px] flex items-center gap-1">
                          <Clock size={11} />
                          {log.timestamp ? new Date(log.timestamp).toLocaleString('tr-TR') : 'Şimdi'}
                        </span>

                        <button
                          onClick={() => setExpandedLogId(isExpanded ? null : log.id)}
                          className="p-1.5 hover:bg-slate-800 text-slate-400 hover:text-white rounded-lg transition-colors flex items-center gap-1 text-[11px]"
                        >
                          {isExpanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                          <span className="hidden sm:inline">{isExpanded ? 'Kapat' : 'İzleme'}</span>
                        </button>
                      </div>
                    </div>

                    <p className="text-xs text-slate-300 pl-5 border-l-2 border-white/10">
                      {log.details}
                    </p>

                    {/* Step Trace Accordion */}
                    {isExpanded && log.logs && (
                      <div className="mt-3 bg-slate-900 border border-white/5 rounded-xl p-3 font-mono text-[11px] text-slate-300 space-y-1">
                        <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-2 border-b border-white/5 pb-1">
                          Adım Adım Sistem İzleme Kaydı (Trace Logs):
                        </p>
                        {log.logs.map((step: string, sIdx: number) => (
                          <div key={sIdx} className={`
                            py-0.5
                            ${step.includes('Başarılı') || step.includes('BAŞARILI') ? 'text-emerald-400 font-semibold' : ''}
                            ${step.includes('Hata') || step.includes('HATASI') || step.includes('Eksik') ? 'text-red-400 font-semibold' : ''}
                            ${step.includes('Simülasyon') ? 'text-amber-300' : ''}
                          `}>
                            {step}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

