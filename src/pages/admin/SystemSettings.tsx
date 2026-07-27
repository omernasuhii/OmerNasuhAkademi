import React, { useState, useEffect } from 'react';
import { doc, getDoc, setDoc, collection, query, orderBy, limit, getDocs } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { Settings, Save, Shield, MessageSquare, Send, Smartphone, Clock, User, RefreshCw } from 'lucide-react';

export default function SystemSettings() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [bypassVerification, setBypassVerification] = useState(false);
  const [message, setMessage] = useState('');
  
  // WhatsApp Messages & Simulation states
  const [messagesList, setMessagesList] = useState<any[]>([]);
  const [simPhone, setSimPhone] = useState('+905450000000');
  const [simBody, setSimBody] = useState('onaylıyorum');
  const [simName, setSimName] = useState('Örnek Kullanıcı');
  const [simLoading, setSimLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const fetchSettings = async () => {
    try {
      const snap = await getDoc(doc(db, 'settings', 'system'));
      if (snap.exists()) {
        setBypassVerification(snap.data().bypassVerification || snap.data().bypassInternalVerification || false);
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
      await Promise.all([fetchSettings(), fetchMessages()]);
      setLoading(false);
    };
    initData();
  }, []);

  const handleSave = async () => {
    setSaving(true);
    setMessage('');
    try {
      await setDoc(doc(db, 'settings', 'system'), {
        bypassVerification
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
        </div>

        <div className="mt-8 pt-6 border-t border-white/5 flex flex-wrap items-center justify-between gap-4">
          {message && !message.includes('simüle') && (
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
    </div>
  );
}
