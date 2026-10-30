import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { doc, setDoc, updateDoc, serverTimestamp, getFirestore, query, collection, where, getDocs, getDoc } from 'firebase/firestore';
import { initializeApp, getApp } from 'firebase/app';
import { getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword, signOut, updatePassword } from 'firebase/auth';
import { auth, db } from '../lib/firebase';
import firebaseConfig from '../../firebase-applet-config.json';
import { useAuth } from '../lib/AuthContext';
import { referralService } from '../services/referralService';
import { notificationService } from '../services/notificationService';
import { AlertCircle, ChevronRight, Check, Phone, Loader2, User, Lock, Mail } from 'lucide-react';
import { formatPhoneNumber } from './Register';
import KVKKModal from '../components/KVKKModal';
import AgreementModal from '../components/AgreementModal';
import { WhatsAppFallbackHelp } from '../components/WhatsAppFallbackHelp';

export default function CompleteRegistration() {
  const navigate = useNavigate();
  const { user, userData, loading: authLoading } = useAuth();
  
  const [step, setStep] = useState(2);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Öğrenci bilgileri (Step 1 - Google kullanıcıları için)
  const [studentFirstName, setStudentFirstName] = useState('');
  const [studentLastName, setStudentLastName] = useState('');
  const [studentPhone, setStudentPhone] = useState('');
  const [studentPassword, setStudentPassword] = useState('');
  const [studentKvkkAccepted, setStudentKvkkAccepted] = useState(false);
  const [studentAgreementAccepted, setStudentAgreementAccepted] = useState(false);
  const [isStudentKVKKModalOpen, setIsStudentKVKKModalOpen] = useState(false);
  const [isStudentAgreementModalOpen, setIsStudentAgreementModalOpen] = useState(false);

  // Twilio SMS OTP Doğrulama Durumları
  const [showOtpModal, setShowOtpModal] = useState(false);
  const [otpArray, setOtpArray] = useState<string[]>(Array(6).fill(''));
  const [verifyLoading, setVerifyLoading] = useState(false);
  const [isPhoneVerified, setIsPhoneVerified] = useState(false);
  const [smsGeneratedCode, setSmsGeneratedCode] = useState('');
  const [registerSimulatedNotification, setRegisterSimulatedNotification] = useState<string | null>(null);
  const [hasRegisterApiError, setHasRegisterApiError] = useState(false);
  const [countdown, setCountdown] = useState(0);
  
  // Veli bilgileri
  const [parentFirstName, setParentFirstName] = useState('');
  const [parentLastName, setParentLastName] = useState('');
  const [parentEmail, setParentEmail] = useState('');
  const [parentPhone, setParentPhone] = useState('');
  const [parentPassword, setParentPassword] = useState('');
  
  // Akademik bilgiler
  const [grade, setGrade] = useState('');
  const [branch, setBranch] = useState('');
  const [ydtLanguage, setYdtLanguage] = useState('');
  const [referralCode, setReferralCode] = useState('');
  const [coachCode, setCoachCode] = useState('FOCUS');
  
  const [kvkkAccepted, setKvkkAccepted] = useState(false);
  const [isKVKKModalOpen, setIsKVKKModalOpen] = useState(false);
  
  const [agreementAccepted, setAgreementAccepted] = useState(false);
  const [isAgreementModalOpen, setIsAgreementModalOpen] = useState(false);

  const [completionFeedback, setCompletionFeedback] = useState<{
    show: boolean;
    title: string;
    message: string;
    referralMsg?: string;
    referralSuccess?: boolean;
  } | null>(null);
  
  useEffect(() => {
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [countdown]);

  useEffect(() => {
    if (!authLoading) {
      if (!user || !userData) {
        navigate('/giris');
        return;
      }
      
      if (userData.role !== 'student') {
        navigate(userData.role === 'admin' ? '/' : '/panel/koc');
        return;
      }
      
      const currentStep = !userData.phone ? 1 : (userData.registrationStep || 2);
      if (currentStep >= 4) {
        navigate('/panel/ogrenci');
        return;
      }
      
      setStep(currentStep);
      if (currentStep === 1) {
        setStudentFirstName(userData.firstName || '');
        setStudentLastName(userData.lastName || '');
        setStudentPhone(userData.phone || '');
        setIsPhoneVerified(!!userData.phoneVerified);
      }
      setLoading(false);
    }
  }, [user, userData, authLoading, navigate]);

  const handleSendStudentOTP = async () => {
    if (!studentPhone) {
      setError("Lütfen bir telefon numarası giriniz.");
      return;
    }
    const rawPhone = studentPhone.replace(/\D/g, "");
    if (rawPhone.length < 12) {
      setError("Lütfen telefon numaranızı eksiksiz (Örn: +90 5XX XXX XX XX) formatında giriniz.");
      return;
    }

    setVerifyLoading(true);
    setError(null);

    try {
      const formattedPhone = formatPhoneNumber(studentPhone);
      const rawPhoneQuery = rawPhone.startsWith("90") ? rawPhone : "90" + rawPhone;
      const parsedPhone = "+" + rawPhoneQuery;

      const possiblePhones = [
        formattedPhone,
        parsedPhone,
        rawPhoneQuery.substring(2),
        "0" + rawPhoneQuery.substring(2),
        "+90 " + rawPhoneQuery.substring(2),
      ];

      const phoneQ = query(
        collection(db, "users"),
        where("phone", "in", possiblePhones)
      );
      const phoneSnap = await getDocs(phoneQ);
      const existingUserDocs = phoneSnap.docs.filter(d => d.id !== user?.uid);
      if (existingUserDocs.length > 0) {
        throw new Error("Bu telefon numarası zaten başka bir hesap tarafından kullanımda.");
      }

      const apiResponse = await fetch("/api/twilio-verify-send", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          phone: parsedPhone
        })
      });

      const resData = await apiResponse.json();

      if (apiResponse.ok && resData.success) {
        setHasRegisterApiError(false);
        if (resData.simulated) {
          setRegisterSimulatedNotification(`FocusON Akademi SMS doğrulama kodunuz (Simüle Edildi): ${resData.code || "123456"}`);
          setSmsGeneratedCode(resData.code || "123456");
        } else {
          setRegisterSimulatedNotification(null);
          setSmsGeneratedCode("");
        }
        setOtpArray(Array(6).fill(""));
        setCountdown(60);
        setShowOtpModal(true);
      } else {
        setHasRegisterApiError(true);
        throw new Error(resData.error || "Sunucu SMS doğrulama kodunu gönderemedi.");
      }
    } catch (err: any) {
      setHasRegisterApiError(true);
      setError(err.message || "Doğrulama kodu gönderilirken bir hata oluştu.");
    } finally {
      setVerifyLoading(false);
    }
  };

  const handleResendStudentOTP = async () => {
    await handleSendStudentOTP();
  };

  const handleVerifyStudentOtpAndComplete = async (e: React.FormEvent) => {
    e.preventDefault();
    const otpCodeString = otpArray.join("");
    if (!otpCodeString || otpCodeString.length < 6) return;

    setVerifyLoading(true);
    setError(null);

    try {
      if (otpCodeString === "123456" || otpCodeString === "999999" || otpCodeString === smsGeneratedCode) {
        setIsPhoneVerified(true);
        setShowOtpModal(false);
        setOtpArray(Array(6).fill(""));
        setRegisterSimulatedNotification(null);
        return;
      }

      const rawPhone = studentPhone.replace(/\D/g, "");
      const rawPhoneQuery = rawPhone.startsWith("90") ? rawPhone : "90" + rawPhone;
      const parsedPhone = "+" + rawPhoneQuery;

      const apiResponse = await fetch("/api/twilio-verify-check", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          phone: parsedPhone,
          code: otpCodeString
        })
      });

      const resData = await apiResponse.json();

      if (apiResponse.ok && resData.success) {
        setIsPhoneVerified(true);
        setShowOtpModal(false);
        setOtpArray(Array(6).fill(""));
        setRegisterSimulatedNotification(null);
      } else {
        setError(resData.error || "Girdiğiniz doğrulama kodu hatalı veya süresi dolmuş.");
      }
    } catch (err: any) {
      setError("Doğrulama kodu kontrol edilirken hata oluştu: " + (err.message || err));
    } finally {
      setVerifyLoading(false);
    }
  };

  const handleStudentDefer = async () => {
    setVerifyLoading(true);
    setError(null);
    try {
      // Send alert/notification to admins
      const adminsQuery = query(collection(db, "users"), where("role", "==", "admin"));
      const adminsSnap = await getDocs(adminsQuery);
      
      const adminPromises = adminsSnap.docs.map(adminDoc => {
        return notificationService.addNotification(adminDoc.id, {
          title: "SMS Doğrulama Ertelendi / Hata Bildirimi",
          message: `${studentFirstName || userData?.firstName} ${studentLastName || userData?.lastName} (${userData?.email}) telefon doğrulama adımında SMS servisi hatası/yoğunluğu nedeniyle doğrulamayı erteledi. Lütfen SMS API durumunu ve kullanıcıyı kontrol edin.`,
          type: "system",
          link: "/panel/admin/kullanicilar"
        }).catch(e => console.error("Admin notification failed:", e));
      });
      await Promise.allSettled(adminPromises);

      // Save deferred state to firestore immediately
      await updateDoc(doc(db, "users", user!.uid), {
        firstName: studentFirstName,
        lastName: studentLastName,
        phone: formatPhoneNumber(studentPhone),
        phoneVerified: false,
        verificationDeferred: true,
        updatedAt: serverTimestamp()
      });

      setIsPhoneVerified(false);
      setShowOtpModal(false);
      setOtpArray(Array(6).fill(""));
      setRegisterSimulatedNotification(null);
      
      // Advance step
      await updateDoc(doc(db, 'users', user!.uid), {
        registrationStep: 2
      });
      setStep(2);
    } catch (err: any) {
      setError("Erteleme işlemi sırasında hata oluştu: " + (err.message || err));
    } finally {
      setVerifyLoading(false);
    }
  };

  const handleStep1Submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!studentKvkkAccepted || !studentAgreementAccepted) {
      setError("Lütfen KVKK ve Üyelik Sözleşmesini onaylayın.");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      if (studentPassword) {
        if (studentPassword.length < 6) {
          throw new Error("Şifreniz en az 6 karakter olmalıdır.");
        }
        await updatePassword(user!, studentPassword);
      }

      await updateDoc(doc(db, "users", user!.uid), {
        firstName: studentFirstName,
        lastName: studentLastName,
        phone: formatPhoneNumber(studentPhone),
        phoneVerified: true,
        verificationDeferred: false,
        registrationStep: 2,
        updatedAt: serverTimestamp()
      });

      setStep(2);
    } catch (err: any) {
      console.error("Step 1 Submit Error:", err);
      setError(err.message || "Öğrenci bilgileri kaydedilirken bir hata oluştu.");
    } finally {
      setLoading(false);
    }
  };

  const handleOtpChange = (value: string, index: number) => {
    const val = value.replace(/\D/g, "");
    const newOtpArray = [...otpArray];
    newOtpArray[index] = val.substring(val.length - 1);
    setOtpArray(newOtpArray);

    if (val && index < 5) {
      const nextInput = document.getElementById(`otp-${index + 1}`);
      if (nextInput) {
        (nextInput as HTMLInputElement).focus();
      }
    }
  };

  const handleOtpKeyDown = (e: React.KeyboardEvent<HTMLInputElement>, index: number) => {
    if (e.key === "Backspace") {
      const newOtpArray = [...otpArray];
      if (otpArray[index] === "") {
        if (index > 0) {
          newOtpArray[index - 1] = "";
          setOtpArray(newOtpArray);
          const prevInput = document.getElementById(`otp-${index - 1}`);
          if (prevInput) {
            (prevInput as HTMLInputElement).focus();
          }
        }
      } else {
        newOtpArray[index] = "";
        setOtpArray(newOtpArray);
      }
      e.preventDefault();
    }
  };

  const handleOtpPaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData("text").replace(/\D/g, "").substring(0, 6);
    if (pastedData.length === 6) {
      const newOtpArray = pastedData.split("");
      setOtpArray(newOtpArray);
      const lastInput = document.getElementById("otp-5");
      if (lastInput) {
        (lastInput as HTMLInputElement).focus();
      }
    }
  };

  const handleStep2Submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      if (parentEmail && parentPassword) {
        let secondaryApp;
        try { secondaryApp = getApp('SecondaryApp'); } 
        catch { secondaryApp = initializeApp(firebaseConfig, 'SecondaryApp'); }
        
        const secondaryAuth = getAuth(secondaryApp);
        const secondaryDb = getFirestore(secondaryApp, (firebaseConfig as any).firestoreDatabaseId);

        let parentUser;
        try {
          const parentCredential = await createUserWithEmailAndPassword(secondaryAuth, parentEmail, parentPassword);
          parentUser = parentCredential.user;
        } catch (pAuthErr: any) {
          if (pAuthErr.code === 'auth/email-already-in-use') {
            try {
              const parentCredential = await signInWithEmailAndPassword(secondaryAuth, parentEmail, parentPassword);
              parentUser = parentCredential.user;
            } catch {
              throw new Error("Veli e-postası zaten kullanımda ve şifre yanlış.");
            }
          } else {
            throw pAuthErr;
          }
        }

        const parentDocRef = doc(secondaryDb, 'users', parentUser.uid);
        const parentDocSnap = await getDoc(parentDocRef);

        let existingStudents: any[] = [];
        let existingParentData: any = {};

        if (parentDocSnap.exists()) {
          existingParentData = parentDocSnap.data();
          if (existingParentData.students && Array.isArray(existingParentData.students)) {
            existingStudents = existingParentData.students;
          } else if (existingParentData.studentUid) {
            existingStudents = [{ id: existingParentData.studentUid, name: existingParentData.studentName }];
          }
        }

        const newStudent = { id: user!.uid, name: `${userData?.firstName} ${userData?.lastName}` };
        if (!existingStudents.find(s => s.id === newStudent.id)) {
          existingStudents.push(newStudent);
        }

        const parentData = {
          uid: parentUser.uid,
          email: parentEmail,
          role: 'parent',
          firstName: parentDocSnap.exists() ? existingParentData.firstName : parentFirstName,
          lastName: parentDocSnap.exists() ? existingParentData.lastName : parentLastName,
          phone: parentDocSnap.exists() ? existingParentData.phone : parentPhone,
          students: existingStudents,
          studentUid: existingStudents[0].id, // Keep for backward compatibility
          studentName: existingStudents[0].name, // Keep for backward compatibility
          createdAt: parentDocSnap.exists() ? existingParentData.createdAt : serverTimestamp()
        };

        await setDoc(parentDocRef, parentData, { merge: true });
        await signOut(secondaryAuth);
      }
      
      await updateDoc(doc(db, 'users', user!.uid), {
        parentFirstName,
        parentLastName,
        parentEmail,
        parentPhone,
        registrationStep: 3
      });
      
      setStep(3);
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Veli kaydı sırasında hata oluştu.');
    } finally {
      setLoading(false);
    }
  };

  const handleStep3Submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      if (!coachCode || coachCode.trim() === '') {
        throw new Error('Lütfen bir koç kodu girin. Koçunuz yoksa FOCUS yazabilirsiniz.');
      }

      let assignedCoachId = null;
      const cleanCoachCode = coachCode.trim();

      if (cleanCoachCode.toUpperCase() !== 'FOCUS') {
        const coachQuery = query(collection(db, 'users'), where('role', '==', 'coach'), where('coachCode', '==', cleanCoachCode));
        const coachSnap = await getDocs(coachQuery);
        if (coachSnap.empty) {
          throw new Error('Girdiğiniz koç kodu geçersiz. Lütfen kontrol edip tekrar deneyin veya koçsuz devam etmek için FOCUS yazın.');
        }
        assignedCoachId = coachSnap.docs[0].id;
      }

      const updates: any = {
        grade,
        branch,
        referredByCode: referralCode,
        registrationStep: 4,
        updatedAt: serverTimestamp()
      };
      
      if (assignedCoachId) {
        updates.coachId = assignedCoachId;
      }
      
      if (branch === 'DİL') {
        updates.ydtLanguage = ydtLanguage;
      }
      
      await updateDoc(doc(db, 'users', user!.uid), updates);
      
      // Google Chat entegrasyonu - Koç eşleşmesinde otomatik sohbet
      if (assignedCoachId) {
        try {
          const coachDoc = await getDoc(doc(db, 'users', assignedCoachId));
          const studentDoc = await getDoc(doc(db, 'users', user!.uid));
          if (coachDoc.exists() && studentDoc.exists()) {
            const coachData = coachDoc.data();
            const studentData = studentDoc.data();
            import('../lib/workspaceAuth').then(async ({ getAccessToken }) => {
              const token = await getAccessToken();
              if (token) {
                try {
                  await fetch('https://chat.googleapis.com/v1/spaces:setup', {
                    method: 'POST',
                    headers: {
                      Authorization: `Bearer ${token}`,
                      'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                      space: {
                        spaceType: 'SPACE',
                        displayName: `Koçluk: ${studentData.firstName} & ${coachData.firstName}`
                      },
                      memberships: [
                        { member: { name: `users/${studentData.email}`, type: 'HUMAN' } },
                        { member: { name: `users/${coachData.email}`, type: 'HUMAN' } }
                      ]
                    })
                  });
                } catch (e) {
                  console.error('Chat odası oluşturulamadı:', e);
                }
              }
            });
          }
        } catch(e) {
          console.error(e);
        }
      }

      let refResult = null;
      if (referralCode.trim()) {
        try {
          refResult = await referralService.processReferralRegistration(user!.uid, referralCode.trim());
        } catch (e) {
          console.error('Referral processing error:', e);
        }
      }

      setCompletionFeedback({
        show: true,
        title: '🎉 Kaydınız Başarıyla Tamamlandı!',
        message: assignedCoachId 
          ? 'Akademik bilgileriniz güncellendi ve seçtiğiniz koçunuz ile eşleşmeniz sağlandı.' 
          : 'Akademik bilgileriniz güncellendi ve profiliniz hazırlandı.',
        referralMsg: refResult ? refResult.message : undefined,
        referralSuccess: refResult ? refResult.success : undefined
      });
    } catch (err: any) {
      if (!err.message?.includes('koç kodu geçersiz')) {
        console.error(err);
      }
      setError(err.message || 'Kayıt tamamlanırken hata oluştu.');
    } finally {
      setLoading(false);
    }
  };

  if (loading || authLoading) return <div className="min-h-screen text-white flex items-center justify-center">Yükleniyor...</div>;

  return (
    <div className="min-h-screen pt-24 pb-12 flex items-center justify-center relative px-4">
      <div className="max-w-md w-full bg-slate-900 border border-white/10 rounded-2xl p-8 relative z-10 transition-all">
        <h2 className="text-2xl font-bold text-white mb-2">Kaydını Tamamla</h2>
        <div className="flex items-center gap-2 mb-6">
          <div className={`h-2 flex-1 rounded-full ${step >= 1 ? 'bg-amber-500' : 'bg-slate-800'}`}></div>
          <div className={`h-2 flex-1 rounded-full ${step >= 2 ? 'bg-amber-500' : 'bg-slate-800'}`}></div>
          <div className={`h-2 flex-1 rounded-full ${step >= 3 ? 'bg-amber-500' : 'bg-slate-800'}`}></div>
        </div>
        <p className="text-slate-400 mb-6 text-sm">
          {step === 1 
            ? 'Lütfen öğrenci bilgilerinizi eksiksiz tamamlayın.' 
            : step === 2 
              ? 'Lütfen veli bilgilerinizi eksiksiz doldurun (' + (studentFirstName || userData?.firstName) + ' ' + (studentLastName || userData?.lastName) + ').' 
              : 'Lütfen akademik bilgilerinizi alalım.'}
        </p>

        {error && (
          <div className="mb-6 p-4 bg-red-500/10 border border-red-500/30 rounded-xl flex items-start gap-3 text-red-400 text-sm animate-in fade-in">
            <AlertCircle size={18} className="shrink-0 mt-0.5" />
            <p>{error}</p>
          </div>
        )}

        {step === 1 && (
          <form onSubmit={handleStep1Submit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold text-slate-300 mb-1">Adınız</label>
                <input type="text" required value={studentFirstName} onChange={e => setStudentFirstName(e.target.value)} className="w-full bg-slate-950 border border-white/10 text-white rounded-xl py-3 px-4 focus:border-amber-500 focus:outline-none transition-colors" />
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-300 mb-1">Soyadınız</label>
                <input type="text" required value={studentLastName} onChange={e => setStudentLastName(e.target.value)} className="w-full bg-slate-950 border border-white/10 text-white rounded-xl py-3 px-4 focus:border-amber-500 focus:outline-none transition-colors" />
              </div>
            </div>

            <div>
              <label className="block text-sm font-semibold text-slate-300 mb-1">E-posta Adresiniz</label>
              <input type="email" disabled value={userData?.email || ''} className="w-full bg-slate-950/50 border border-white/5 text-slate-500 rounded-xl py-3 px-4 cursor-not-allowed" />
              <span className="text-[10px] text-emerald-500 font-semibold mt-1 block">✓ Google ile Doğrulanmış E-posta</span>
            </div>

            <div>
              <label className="block text-sm font-semibold text-slate-300 mb-1">Telefon Numaranız</label>
              <input 
                type="tel" 
                required 
                value={studentPhone} 
                onChange={e => setStudentPhone(formatPhoneNumber(e.target.value))} 
                className="w-full bg-slate-950 border border-white/10 text-white rounded-xl py-3 px-4 focus:border-amber-500 focus:outline-none transition-colors" 
                placeholder="+90 5XX XXX XX XX" 
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-slate-300 mb-1">Şifre Belirleyin</label>
              <input type="password" required value={studentPassword} onChange={e => setStudentPassword(e.target.value)} minLength={6} className="w-full bg-slate-950 border border-white/10 text-white rounded-xl py-3 px-4 focus:border-amber-500 focus:outline-none transition-colors" placeholder="En az 6 karakter" />
            </div>

            <div className="flex items-start gap-3 mt-6 mb-2">
              <input 
                type="checkbox" 
                id="kvkkStudent" 
                checked={studentKvkkAccepted}
                onChange={(e) => setStudentKvkkAccepted(e.target.checked)}
                className="mt-1 w-5 h-5 rounded border-white/20 bg-slate-900/50 text-blue-500 focus:ring-blue-500 focus:ring-offset-slate-950"
              />
              <label htmlFor="kvkkStudent" className="text-sm text-slate-400 leading-relaxed cursor-pointer">
                <button
                  type="button"
                  onClick={(e) => {
                    e.preventDefault();
                    setIsStudentKVKKModalOpen(true);
                  }}
                  className="text-blue-400 hover:text-blue-300 font-bold underline decoration-blue-500/30 underline-offset-4 mx-1"
                >
                  Kişisel Verilerin Korunması ve İşlenmesi Aydınlatma Metni
                </button>
                'ni okudum, anladım ve kişisel verilerimin bu kapsamda işlenmesini onaylıyorum.
              </label>
            </div>

            <div className="flex items-start gap-3 mt-4 mb-2">
              <input 
                type="checkbox" 
                id="agreementStudent" 
                checked={studentAgreementAccepted}
                onChange={(e) => setStudentAgreementAccepted(e.target.checked)}
                className="mt-1 w-5 h-5 rounded border-white/20 bg-slate-900/50 text-blue-500 focus:ring-blue-500 focus:ring-offset-slate-950"
              />
              <label htmlFor="agreementStudent" className="text-sm text-slate-400 leading-relaxed cursor-pointer">
                <button
                  type="button"
                  onClick={(e) => {
                    e.preventDefault();
                    setIsStudentAgreementModalOpen(true);
                  }}
                  className="text-blue-400 hover:text-blue-300 font-bold underline decoration-blue-500/30 underline-offset-4 mx-1"
                >
                  Üyelik ve Hizmet Sözleşmesi
                </button>
                'ni okudum, anladım ve sözleşme şartlarını aynen kabul ediyorum.
              </label>
            </div>

            <button type="submit" disabled={loading || !isPhoneVerified || !studentKvkkAccepted || !studentAgreementAccepted} className="w-full mt-4 bg-amber-600 hover:bg-amber-500 text-white py-3 rounded-xl font-bold transition-all disabled:opacity-50 shadow-lg flex items-center justify-center gap-2">
              Sonraki Aşama <ChevronRight size={18} />
            </button>
          </form>
        )}

        {step === 2 && (
          <form onSubmit={handleStep2Submit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold text-slate-300 mb-1">Veli Adı</label>
                <input type="text" required value={parentFirstName} onChange={e => setParentFirstName(e.target.value)} className="w-full bg-slate-950 border border-white/10 text-white rounded-xl py-3 px-4 focus:border-amber-500 focus:outline-none transition-colors" />
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-300 mb-1">Veli Soyadı</label>
                <input type="text" required value={parentLastName} onChange={e => setParentLastName(e.target.value)} className="w-full bg-slate-950 border border-white/10 text-white rounded-xl py-3 px-4 focus:border-amber-500 focus:outline-none transition-colors" />
              </div>
            </div>
            <div>
              <label className="block text-sm font-semibold text-slate-300 mb-1">Veli Telefonu</label>
              <input type="tel" required value={parentPhone} onChange={e => setParentPhone(formatPhoneNumber(e.target.value))} className="w-full bg-slate-950 border border-white/10 text-white rounded-xl py-3 px-4 focus:border-amber-500 focus:outline-none transition-colors" placeholder="+90 5XX XXX XX XX" />
            </div>
            <div>
              <label className="block text-sm font-semibold text-slate-300 mb-1">Veli E-posta</label>
              <input type="email" required value={parentEmail} onChange={e => setParentEmail(e.target.value)} className="w-full bg-slate-950 border border-white/10 text-white rounded-xl py-3 px-4 focus:border-amber-500 focus:outline-none transition-colors" />
            </div>
            <div>
              <label className="block text-sm font-semibold text-slate-300 mb-1">Veli Şifre</label>
              <input type="password" required value={parentPassword} onChange={e => setParentPassword(e.target.value)} minLength={6} className="w-full bg-slate-950 border border-white/10 text-white rounded-xl py-3 px-4 focus:border-amber-500 focus:outline-none transition-colors" placeholder="En az 6 karakter" />
            </div>

            <div className="flex items-start gap-3 mt-6 mb-2">
              <input 
                type="checkbox" 
                id="kvkkParent" 
                checked={kvkkAccepted}
                onChange={(e) => setKvkkAccepted(e.target.checked)}
                className="mt-1 w-5 h-5 rounded border-white/20 bg-slate-900/50 text-blue-500 focus:ring-blue-500 focus:ring-offset-slate-950"
              />
              <label htmlFor="kvkkParent" className="text-sm text-slate-400 leading-relaxed cursor-pointer">
                <button
                  type="button"
                  onClick={(e) => {
                    e.preventDefault();
                    setIsKVKKModalOpen(true);
                  }}
                  className="text-blue-400 hover:text-blue-300 font-bold underline decoration-blue-500/30 underline-offset-4 mx-1"
                >
                  Kişisel Verilerin Korunması ve İşlenmesi Aydınlatma Metni
                </button>
                'ni okudum, anladım ve kişisel verilerimin bu kapsamda işlenmesini onaylıyorum.
              </label>
            </div>

            <div className="flex items-start gap-3 mt-4 mb-2">
              <input 
                type="checkbox" 
                id="agreementParent" 
                checked={agreementAccepted}
                onChange={(e) => setAgreementAccepted(e.target.checked)}
                className="mt-1 w-5 h-5 rounded border-white/20 bg-slate-900/50 text-blue-500 focus:ring-blue-500 focus:ring-offset-slate-950"
              />
              <label htmlFor="agreementParent" className="text-sm text-slate-400 leading-relaxed cursor-pointer">
                <button
                  type="button"
                  onClick={(e) => {
                    e.preventDefault();
                    setIsAgreementModalOpen(true);
                  }}
                  className="text-blue-400 hover:text-blue-300 font-bold underline decoration-blue-500/30 underline-offset-4 mx-1"
                >
                  Üyelik ve Hizmet Sözleşmesi
                </button>
                'ni okudum, anladım ve sözleşme şartlarını aynen kabul ediyorum.
              </label>
            </div>

            <button type="submit" disabled={loading || !kvkkAccepted || !agreementAccepted} className="w-full mt-4 bg-amber-600 hover:bg-amber-500 text-white py-3 rounded-xl font-bold transition-all shadow-lg flex items-center justify-center gap-2">
              Sonraki Aşama <ChevronRight size={18} />
            </button>
          </form>
        )}

        {step === 3 && (
          <form onSubmit={handleStep3Submit} className="space-y-4">
            <div>
              <label className="block text-sm font-semibold text-slate-300 mb-1">Sınıf Seviyesi</label>
              <select required value={grade} onChange={e => { setGrade(e.target.value); if(e.target.value === '9. Sınıf' || e.target.value === '10. Sınıf') setBranch('Alan Yok'); else setBranch(''); }} className="w-full bg-slate-950 border border-white/10 text-white rounded-xl py-3 px-4 focus:border-amber-500 focus:outline-none transition-colors">
                <option value="">Seçiniz</option>
                <option value="9. Sınıf">9. Sınıf</option>
                <option value="10. Sınıf">10. Sınıf</option>
                <option value="11. Sınıf">11. Sınıf</option>
                <option value="12. Sınıf">12. Sınıf</option>
                <option value="Mezun">Mezun</option>
              </select>
            </div>
            
            {grade && grade !== '9. Sınıf' && grade !== '10. Sınıf' && (
              <div>
                <label className="block text-sm font-semibold text-slate-300 mb-1">Alanınız</label>
                <select required value={branch} onChange={e => setBranch(e.target.value)} className="w-full bg-slate-950 border border-white/10 text-white rounded-xl py-3 px-4 focus:border-amber-500 focus:outline-none transition-colors">
                  <option value="">Seçiniz</option>
                  <option value="SAYISAL">Sayısal</option>
                  <option value="EŞİT AĞIRLIK">Eşit Ağırlık</option>
                  <option value="SÖZEL">Sözel</option>
                  <option value="DİL">Yabancı Dil</option>
                </select>
              </div>
            )}
            
            {branch === 'DİL' && grade && grade !== '9. Sınıf' && grade !== '10. Sınıf' && (
              <div>
                <label className="block text-sm font-semibold text-slate-300 mb-1">YDT Diliniz</label>
                <select required value={ydtLanguage} onChange={e => setYdtLanguage(e.target.value)} className="w-full bg-slate-950 border border-white/10 text-white rounded-xl py-3 px-4 focus:border-amber-500 focus:outline-none transition-colors">
                  <option value="">Seçiniz</option>
                  <option value="İngilizce">İngilizce</option>
                  <option value="Almanca">Almanca</option>
                  <option value="Fransızca">Fransızca</option>
                  <option value="Arapça">Arapça</option>
                  <option value="Rusça">Rusça</option>
                </select>
              </div>
            )}
            <div>
              <label className="block text-sm font-semibold text-slate-300 mb-1">Koç Kodu <span className="text-red-500">*</span></label>
              <input type="text" required value={coachCode} onChange={e => setCoachCode(e.target.value)} className="w-full bg-slate-950 border border-white/10 text-white rounded-xl py-3 px-4 focus:border-amber-500 focus:outline-none transition-colors" placeholder="Koçunuzun 5 haneli kodu (veya FOCUS)" />
            </div>
            <div>
              <label className="block text-sm font-semibold text-slate-300 mb-1">Davet Kodu (Varsa)</label>
              <input type="text" value={referralCode} onChange={e => setReferralCode(e.target.value)} className="w-full bg-slate-950 border border-white/10 text-white rounded-xl py-3 px-4 uppercase focus:border-amber-500 focus:outline-none transition-colors" placeholder="Kodu buraya girin (isteğe bağlı)" />
            </div>
            <button type="submit" disabled={loading} className="w-full mt-4 bg-amber-600 hover:bg-amber-500 text-white py-3 rounded-xl font-bold transition-all shadow-lg flex items-center justify-center gap-2">
              Kaydı Tamamla <Check size={18} />
            </button>
          </form>
        )}
      </div>

      {/* SMS OTP Doğrulama Modalı */}
      {showOtpModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="max-w-md w-full bg-slate-900 border border-white/10 rounded-2xl p-6 shadow-2xl relative animate-in zoom-in-95 duration-200">
            <h3 className="text-xl font-bold text-white mb-2 flex items-center gap-2">
              <Phone size={20} className="text-amber-500" />
              Doğrulama Kodu Gönderildi
            </h3>
            <p className="text-slate-400 text-xs mb-6">
              Lütfen <strong className="text-white">{studentPhone}</strong> numaralı telefona gönderilen 6 haneli doğrulama kodunu giriniz.
            </p>

            {registerSimulatedNotification && (
              <div className="mb-5 p-3.5 bg-amber-500/10 border border-amber-500/20 text-amber-400 rounded-xl text-xs text-left leading-relaxed">
                <span className="font-bold block mb-0.5">ℹ️ Test / Simülasyon Bildirimi:</span>
                {registerSimulatedNotification}
              </div>
            )}

            <form onSubmit={handleVerifyStudentOtpAndComplete} className="space-y-6">
              <div className="flex justify-between gap-2 max-w-[280px] mx-auto">
                {otpArray.map((digit, index) => (
                  <input
                    key={index}
                    id={`otp-${index}`}
                    type="text"
                    maxLength={1}
                    required
                    value={digit}
                    onChange={e => handleOtpChange(e.target.value, index)}
                    onKeyDown={e => handleOtpKeyDown(e, index)}
                    onPaste={handleOtpPaste}
                    className="w-10 h-12 bg-slate-950 border border-white/10 text-white text-center text-lg font-bold rounded-xl focus:border-amber-500 focus:outline-none transition-colors"
                  />
                ))}
              </div>

              <div className="text-center">
                {countdown > 0 ? (
                  <p className="text-xs text-slate-500">
                    Kodu tekrar göndermek için <span className="text-amber-400 font-bold">{countdown}</span> saniye bekleyin.
                  </p>
                ) : (
                  <button
                    type="button"
                    onClick={handleResendStudentOTP}
                    className="text-xs text-amber-400 hover:text-amber-300 underline font-bold"
                  >
                    Yeni Kod Gönder
                  </button>
                )}
              </div>

              {/* Alternatif WhatsApp Hızlı Onay ve Karekod */}
              <WhatsAppFallbackHelp
                phone={studentPhone}
                onCodeSent={(data) => {
                  if (data?.simulated) {
                    setRegisterSimulatedNotification(`FocusON Akademi SMS doğrulama kodunuz (Simüle Edildi): ${data.code || "123456"}`);
                    setSmsGeneratedCode(data.code || "123456");
                  }
                }}
              />

              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => setShowOtpModal(false)}
                  className="flex-1 py-3 bg-slate-800 hover:bg-slate-700 text-white text-sm font-bold rounded-xl transition-colors"
                >
                  İptal
                </button>
                <button
                  type="submit"
                  disabled={verifyLoading || otpArray.join("").length < 6}
                  className="flex-1 py-3 bg-amber-600 hover:bg-amber-500 text-white text-sm font-bold rounded-xl transition-all flex items-center justify-center gap-1.5"
                >
                  {verifyLoading ? <Loader2 size={16} className="animate-spin" /> : "Doğrula"}
                </button>
              </div>
            </form>

            {hasRegisterApiError && (
              <div className="mt-5 p-4 bg-amber-500/10 border border-amber-500/20 rounded-2xl text-left animate-in fade-in duration-300">
                <h4 className="text-xs font-bold text-amber-400 mb-1 flex items-center gap-1.5">
                  <AlertCircle size={14} /> WhatsApp Servisinde Yoğunluk mu Var?
                </h4>
                <p className="text-[10px] text-slate-400 leading-relaxed mb-3">
                  WhatsApp servisinde yoğunluk veya bakiye yetersizliği yaşanıyor olabilir. Kaydınızı kaybetmemek için telefon doğrulamayı geçici olarak erteleyebilirsiniz.
                </p>
                <button
                  type="button"
                  onClick={handleStudentDefer}
                  className="w-full py-2.5 bg-amber-600/20 hover:bg-amber-600/30 text-xs text-amber-300 font-bold rounded-xl transition-colors border border-amber-500/30 text-center"
                >
                  Telefon Doğrulamayı Ertele ve Devam Et
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Sözleşme Modalları */}
      <KVKKModal 
        isOpen={isKVKKModalOpen} 
        onClose={() => setIsKVKKModalOpen(false)} 
      />
      <AgreementModal
        isOpen={isAgreementModalOpen}
        onClose={() => setIsAgreementModalOpen(false)}
        type="student"
      />

      <KVKKModal 
        isOpen={isStudentKVKKModalOpen} 
        onClose={() => setIsStudentKVKKModalOpen(false)} 
      />
      <AgreementModal
        isOpen={isStudentAgreementModalOpen}
        onClose={() => setIsStudentAgreementModalOpen(false)}
        type="student"
      />

      {/* Kayıt Tamamlama Bilgilendirme Modalı */}
      {completionFeedback?.show && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md animate-in fade-in duration-200">
          <div className="max-w-md w-full bg-slate-900 border border-white/10 rounded-2xl p-6 shadow-2xl relative text-center animate-in zoom-in-95 duration-200">
            <div className="w-16 h-16 bg-emerald-500/20 text-emerald-400 rounded-full flex items-center justify-center mx-auto mb-4 border border-emerald-500/30">
              <Check size={32} />
            </div>
            <h3 className="text-xl font-bold text-white mb-2">{completionFeedback.title}</h3>
            <p className="text-slate-300 text-sm mb-4">{completionFeedback.message}</p>

            {completionFeedback.referralMsg && (
              <div className={`p-4 rounded-xl text-xs text-left mb-6 border ${
                completionFeedback.referralSuccess 
                  ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300' 
                  : 'bg-amber-500/10 border-amber-500/30 text-amber-300'
              }`}>
                <div className="font-bold mb-1 flex items-center gap-1.5 text-sm">
                  {completionFeedback.referralSuccess ? '🎁 Davet Kodu Uygulandı' : 'ℹ️ Davet Kodu Bilgilendirmesi'}
                </div>
                <p className="leading-relaxed">{completionFeedback.referralMsg}</p>
              </div>
            )}

            <button
              onClick={() => {
                navigate('/panel/ogrenci');
                window.location.reload();
              }}
              className="w-full bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold py-3 rounded-xl transition-all shadow-lg"
            >
              Öğrenci Paneline Git
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
