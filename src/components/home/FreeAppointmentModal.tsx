import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Calendar, Clock, Phone, User, MessageCircle, AlertCircle, CheckCircle2 } from 'lucide-react';
import { db, auth } from '../../lib/firebase';
import { collection, query, where, getDocs, doc, setDoc } from 'firebase/firestore';
import { RecaptchaVerifier, signInWithPhoneNumber } from 'firebase/auth';

interface FreeAppointmentModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function FreeAppointmentModal({ isOpen, onClose }: FreeAppointmentModalProps) {
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [phone, setPhone] = useState('');
  const [topic, setTopic] = useState('');
  
  const [otpCode, setOtpCode] = useState('');
  const [verificationId, setVerificationId] = useState<any>(null);

  const [coachId, setCoachId] = useState<string | null>(null);
  const [coachName, setCoachName] = useState('Ömer Nasuh AĞIR');

  useEffect(() => {
    if (isOpen) {
      // Find coach
      const findCoach = async () => {
        try {
          const q = query(collection(db, 'users'), where('email', '==', 'omernasuhagir2@gmail.com'));
          const snap = await getDocs(q);
          if (!snap.empty) {
            setCoachId(snap.docs[0].id);
            const data = snap.docs[0].data();
            setCoachName(`${data.firstName} ${data.lastName}`);
          }
        } catch (err) {
          console.error('Error finding coach:', err);
        }
      };
      findCoach();
    }
  }, [isOpen]);

  const setupRecaptcha = () => {
    if (!window.recaptchaVerifier) {
      window.recaptchaVerifier = new RecaptchaVerifier(auth, 'recaptcha-container', {
        size: 'invisible',
      });
    }
  };

  const handleNextStep = async () => {
    if (step === 1) {
      if (!firstName || !lastName || !topic) {
        setError('Lütfen ad, soyad ve konu alanlarını doldurun.');
        return;
      }
      if (!phone || phone.replace(/\D/g, "").length < 10) {
        setError('Geçerli bir telefon numarası giriniz.');
        return;
      }
      setLoading(true);
      setError(null);
      
      try {
        setupRecaptcha();
        let cleanedPhone = phone.replace(/\D/g, "");
        if (cleanedPhone.startsWith("0")) cleanedPhone = cleanedPhone.substring(1);
        if (!cleanedPhone.startsWith("90")) cleanedPhone = "90" + cleanedPhone;
        const formattedPhone = "+" + cleanedPhone;

        const confirmation = await signInWithPhoneNumber(auth, formattedPhone, window.recaptchaVerifier);
        setVerificationId(confirmation);
        setStep(2);
      } catch (err: any) {
        console.error(err);
        setError('Doğrulama kodu gönderilirken hata oluştu: ' + (err.message || ''));
        if (window.recaptchaVerifier) {
          window.recaptchaVerifier.clear();
          window.recaptchaVerifier = null;
        }
      } finally {
        setLoading(false);
      }
    } else if (step === 2) {
      if (!otpCode || otpCode.length < 6) return;
      setLoading(true);
      setError(null);

      try {
        const result = await verificationId.confirm(otpCode);
        
        const user = result.user;
        const messageId = `req_${Date.now()}`;
        await setDoc(doc(db, 'inbox_messages', messageId), {
          studentId: user.uid,
          firstName,
          lastName,
          phone,
          topic,
          status: 'new',
          type: 'free_appointment_request',
          coachId: coachId || 'admin',
          coachName: coachName,
          createdAt: new Date(),
          assignedDate: 'En kısa sürede',
          assignedTime: 'Belirlenecek'
        });

        // Skip to success step
        setStep(3);
      } catch (err: any) {
        console.error(err);
        if (err.code === 'auth/invalid-verification-code') {
          setError('Girdiğiniz kod hatalı. Lütfen kontrol edip tekrar deneyin.');
        } else if (err.code === 'auth/code-expired') {
          setError('Doğrulama kodunun süresi dolmuş.');
        } else {
          setError('Kod doğrulanamadı. Lütfen tekrar deneyin.');
        }
      } finally {
        setLoading(false);
      }
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div className="absolute inset-0 bg-slate-950/80 backdrop-blur-sm" onClick={onClose}></div>
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          className="bg-slate-900 w-full max-w-2xl sm:rounded-3xl border border-white/10 shadow-2xl overflow-y-auto z-10 h-full sm:h-auto sm:max-h-[90vh] flex flex-col"
        >
          <div className="p-6 border-b border-white/5 flex items-center justify-between">
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
              <Calendar className="text-blue-500" />
              Ücretsiz Randevu Al
            </h2>
            <button onClick={onClose} className="p-2 hover:bg-white/5 rounded-full text-slate-400">
              <X size={20} />
            </button>
          </div>

          <div className="p-6 overflow-y-auto flex-1">
            {error && (
              <div className="mb-6 p-4 bg-red-500/10 border border-red-500/20 rounded-xl flex items-start gap-3">
                <AlertCircle className="text-red-500 shrink-0 mt-0.5" size={18} />
                <p className="text-sm text-red-200">{error}</p>
              </div>
            )}

            {step === 1 && (
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Adınız</label>
                    <div className="relative">
                      <User className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
                      <input 
                        type="text" 
                        className="w-full bg-slate-950 border border-white/10 rounded-xl pl-10 pr-4 py-3 text-sm text-white focus:ring-2 focus:ring-blue-500 outline-none"
                        placeholder="Adınız"
                        value={firstName}
                        onChange={(e) => setFirstName(e.target.value)}
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Soyadınız</label>
                    <div className="relative">
                      <User className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
                      <input 
                        type="text" 
                        className="w-full bg-slate-950 border border-white/10 rounded-xl pl-10 pr-4 py-3 text-sm text-white focus:ring-2 focus:ring-blue-500 outline-none"
                        placeholder="Soyadınız"
                        value={lastName}
                        onChange={(e) => setLastName(e.target.value)}
                      />
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Görüşme Konusu</label>
                  <div className="relative">
                    <MessageCircle className="absolute left-3 top-4 text-slate-500" size={18} />
                    <textarea 
                      className="w-full bg-slate-950 border border-white/10 rounded-xl pl-10 pr-4 py-3 text-sm text-white focus:ring-2 focus:ring-blue-500 outline-none min-h-[100px] resize-none"
                      placeholder="Hangi konuda bilgi almak istiyorsunuz?"
                      value={topic}
                      onChange={(e) => setTopic(e.target.value)}
                    ></textarea>
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Telefon Numarası</label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
                    <span className="absolute left-10 top-1/2 -translate-y-1/2 text-slate-400 font-medium">+90</span>
                    <input 
                      type="tel" 
                      className="w-full bg-slate-950 border border-white/10 rounded-xl pl-20 pr-4 py-3 text-sm text-white focus:ring-2 focus:ring-blue-500 outline-none"
                      placeholder="5XX XXX XX XX"
                      value={phone}
                      maxLength={14}
                      onChange={(e) => {
                        let val = e.target.value.replace(/\D/g, "");
                        if (val.startsWith("90")) val = val.substring(2);
                        if (val.startsWith("0")) val = val.substring(1);
                        
                        let formatted = "";
                        if (val.length > 0) formatted += val.substring(0, 3);
                        if (val.length > 3) formatted += " " + val.substring(3, 6);
                        if (val.length > 6) formatted += " " + val.substring(6, 8);
                        if (val.length > 8) formatted += " " + val.substring(8, 10);
                        setPhone(formatted);
                      }}
                    />
                  </div>
                </div>
              </div>
            )}

            {step === 2 && (
              <div className="space-y-6 text-center py-6">
                <div className="w-16 h-16 bg-blue-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Clock className="text-blue-400" size={32} />
                </div>
                <h3 className="text-xl font-bold text-white">SMS Doğrulaması</h3>
                <p className="text-slate-400 text-sm max-w-sm mx-auto">
                  {phone} numarasına gönderilen 6 haneli doğrulama kodunu giriniz.
                </p>
                <div className="max-w-xs mx-auto">
                  <input 
                    type="text" 
                    className="w-full bg-slate-950 border border-white/10 rounded-xl px-4 py-3 text-center tracking-[0.5em] text-xl font-bold text-white focus:ring-2 focus:ring-blue-500 outline-none"
                    placeholder="XXXXXX"
                    maxLength={6}
                    value={otpCode}
                    onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, ""))}
                  />
                </div>
              </div>
            )}

            {step === 3 && (
              <div className="space-y-6 text-center py-10">
                <div className="w-20 h-20 bg-emerald-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                  <CheckCircle2 className="text-emerald-500" size={40} />
                </div>
                <h3 className="text-2xl font-bold text-white">Talebiniz Alındı!</h3>
                <p className="text-slate-300 max-w-md mx-auto">
                  Ücretsiz görüşme talebiniz başarıyla oluşturuldu. Görevlilerimiz en kısa sürede sizinle iletişime geçecektir.
                </p>
                <button 
                  onClick={onClose}
                  className="px-8 py-3 bg-white/10 hover:bg-white/20 text-white rounded-xl transition-colors font-semibold"
                >
                  Kapat
                </button>
              </div>
            )}
          </div>

          <div id="recaptcha-container"></div>

          {step < 3 && (
            <div className="p-6 border-t border-white/5 flex justify-end gap-3">
              <button 
                onClick={onClose}
                className="px-6 py-2.5 text-slate-400 hover:text-white transition-colors text-sm font-semibold"
              >
                İptal
              </button>
              <button 
                onClick={handleNextStep}
                disabled={loading || (step === 2 && otpCode.length < 6)}
                className="px-6 py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl transition-colors text-sm font-semibold disabled:opacity-50 flex items-center gap-2"
              >
                {loading && <div className="w-4 h-4 rounded-full border-2 border-white/30 border-t-white animate-spin"></div>}
                {step === 1 ? 'Devam Et' : 'Doğrula'}
              </button>
            </div>
          )}
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
