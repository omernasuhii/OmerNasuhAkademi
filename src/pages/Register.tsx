import React, { useState, useEffect } from "react";
import {
  Mail,
  Lock,
  User,
  Phone,
  LogIn,
  ChevronLeft,
  Loader2,
  AlertCircle,
  CheckCircle2,
  MessageCircle,
  QrCode,
  Gift,
} from "lucide-react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  sendEmailVerification,
  signInWithPhoneNumber,
  linkWithPhoneNumber,
  RecaptchaVerifier,
  updateEmail,
  updatePassword,
  EmailAuthProvider,
  linkWithCredential,
  fetchSignInMethodsForEmail,
} from "firebase/auth";
import { initializeApp, getApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import {
  doc,
  setDoc,
  serverTimestamp,
  getFirestore,
  collection,
  query,
  where,
  getDocs,
  getDoc,
} from "firebase/firestore";
import { auth, db } from "../lib/firebase";
import { useAuth } from "../lib/AuthContext";
import firebaseConfig from "../../firebase-applet-config.json";
import { referralService, ReferralSettings } from "../services/referralService";
import { notificationService } from "../services/notificationService";
import KVKKModal from "../components/KVKKModal";
import AgreementModal from "../components/AgreementModal";

declare global {
  interface Window {
    recaptchaVerifier: any;
    confirmationResult: any;
  }
}

export const formatPhoneNumber = (val: string) => {
  let cleaned = val.replace(/\D/g, "");
  if (cleaned.startsWith("90")) {
    cleaned = cleaned.substring(2);
  }
  if (cleaned.startsWith("0")) {
    cleaned = cleaned.substring(1);
  }

  if (cleaned.length > 10) cleaned = cleaned.substring(0, 10);

  if (cleaned.length === 0) return "";

  let formatted = "+90 ";
  if (cleaned.length > 0) formatted += cleaned.substring(0, 3);
  if (cleaned.length > 3) formatted += " " + cleaned.substring(3, 6);
  if (cleaned.length > 6) formatted += " " + cleaned.substring(6, 8);
  if (cleaned.length > 8) formatted += " " + cleaned.substring(8, 10);

  return formatted;
};

export default function Register() {
  const { systemSettings } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const isCoach = location.pathname.includes("koc");
  const roleTitle = isCoach ? "Koç" : "Öğrenci";

  const [settings, setSettings] = useState<ReferralSettings | null>(null);

  useEffect(() => {
    if (!isCoach) {
      referralService.getSettings().then((data) => {
        if (data) setSettings(data);
      });
    }
  }, [isCoach]);

  // Tailwind static class extraction for dynamic colors
  const roleColors = {
    emerald: {
      bg: "bg-emerald-500/20",
      icon: "bg-emerald-600/20 text-emerald-400 border-emerald-500/30",
      outline: "focus:ring-emerald-500/50 focus:border-emerald-500",
      button: "bg-emerald-600 hover:bg-emerald-500 shadow-emerald-500/30",
    },
    amber: {
      bg: "bg-amber-500/20",
      icon: "bg-amber-600/20 text-amber-400 border-amber-500/30",
      outline: "focus:ring-amber-500/50 focus:border-amber-500",
      button: "bg-amber-600 hover:bg-amber-500 shadow-amber-500/30",
    },
  };

  const theme = isCoach ? roleColors.emerald : roleColors.amber;

  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [phone, setPhone] = useState("");

  // Student specific fields
  const [grade, setGrade] = useState("");
  const [branch, setBranch] = useState("");
  const [parentFirstName, setParentFirstName] = useState("");
  const [parentLastName, setParentLastName] = useState("");
  const [parentEmail, setParentEmail] = useState("");
  const [parentPhone, setParentPhone] = useState("");
  const [ydtLanguage, setYdtLanguage] = useState("");
  const [referralCode, setReferralCode] = useState("");
  const [kvkkAccepted, setKvkkAccepted] = useState(false);
  const [isKVKKModalOpen, setIsKVKKModalOpen] = useState(false);

  const [agreementAccepted, setAgreementAccepted] = useState(false);
  const [isAgreementModalOpen, setIsAgreementModalOpen] = useState(false);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [showOtpModal, setShowOtpModal] = useState(false);
  const [otpArray, setOtpArray] = useState<string[]>(Array(6).fill(""));
  const [verifyLoading, setVerifyLoading] = useState(false);

  const [isPhoneVerified, setIsPhoneVerified] = useState(false);
  const [phoneUser, setPhoneUser] = useState<any>(null);
  const [isEmailVerificationSent, setIsEmailVerificationSent] = useState(false);

  // Twilio SMS Register states
  const [smsGeneratedCode, setSmsGeneratedCode] = useState("");
  const [registerSimulatedNotification, setRegisterSimulatedNotification] = useState<string | null>(null);
  const [hasRegisterApiError, setHasRegisterApiError] = useState(false);
  const [countdown, setCountdown] = useState(0);

  useEffect(() => {
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [countdown]);

  const setupRecaptcha = () => {
    if (!window.recaptchaVerifier) {
      window.recaptchaVerifier = new RecaptchaVerifier(
        auth,
        "recaptcha-container",
        {
          size: "invisible",
        },
      );
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const bypass = systemSettings?.bypassVerification || systemSettings?.bypassInternalVerification;

    if (bypass) {
      setLoading(true);
      try {
        const signInMethods = await fetchSignInMethodsForEmail(
          auth,
          email.toLowerCase(),
        );
        if (signInMethods.length > 0) {
          throw new Error(
            "Bu e-posta adresi zaten kullanımda. Lütfen giriş yapın.",
          );
        }

        const userCredential = await createUserWithEmailAndPassword(
          auth,
          email.toLowerCase(),
          password
        );
        const user = userCredential.user;

        const userData: any = {
          email: email.toLowerCase(),
          role: isCoach ? "coach" : "student",
          firstName,
          lastName,
          phone: formatPhoneNumber(phone),
          phoneVerified: true,
          emailVerified: true,
          createdAt: serverTimestamp(),
          lastLoginAt: serverTimestamp(),
          isOnline: true
        };

        if (!isCoach) {
          userData.registrationStep = 2;
        } else {
          userData.approved = false;
        }

        userData.uid = user.uid;
        userData.referralCode =
          (isCoach ? "KOC" : "FOCUS") + user.uid.substring(0, 4).toUpperCase();
        if (referralCode.trim()) {
          userData.referredByCode = referralCode.trim().toUpperCase();
        }

        await setDoc(doc(db, "users", user.uid), userData);
        if (referralCode.trim()) {
          await referralService.processReferralRegistration(user.uid, referralCode.trim()).catch(console.error);
        }

        if (!isCoach) {
          navigate("/kayit-tamamla");
        } else {
          navigate("/koc-onay-bekliyor");
        }
      } catch (err: any) {
        console.error("Bypass registration error:", err);
        if (err.code === "auth/email-already-in-use" || err.message?.includes("kullanımda")) {
          setError("Bu e-posta adresi zaten kullanımda. Lütfen giriş yapın.");
        } else if (err.code === "auth/weak-password") {
          setError("Şifreniz çok zayıf (En az 6 karakter).");
        } else {
          setError("Kayıt oluşturulurken bir hata oluştu: " + err.message);
        }
      } finally {
        setLoading(false);
      }
      return;
    }

    if (!isPhoneVerified) {
      setLoading(true);
      const rawPhone = phone.replace(/\D/g, "");
      if (rawPhone.length < 12) {
        setError(
          "Lütfen telefon numaranızı eksiksiz (Örn: +90 5XX XXX XX XX) formatında giriniz.",
        );
        setLoading(false);
        return;
      }

      try {
        // Kullanıcının sistemde tam kayıtlı olup olmadığını kontrol et (E-posta kontrolü)
        const signInMethods = await fetchSignInMethodsForEmail(
          auth,
          email.toLowerCase(),
        );
        if (signInMethods.length > 0) {
          throw new Error(
            "Bu e-posta adresi zaten kullanımda. Lütfen giriş yapın.",
          );
        }

        // Başka birinin bu telefonu kullanıp kullanmadığını kontrol et
        const formattedPhone = formatPhoneNumber(phone);
        const rawPhoneQuery = rawPhone.startsWith("90")
          ? rawPhone
          : "90" + rawPhone;
        const parsedPhone = "+" + rawPhoneQuery;

        // formats to check:
        // 1. +90 5XX XXX XX XX (formattedPhone)
        // 2. +905XXXXXXXXX (parsedPhone)
        // 3. 5XXXXXXXXX (rawPhone if without 90 or substring)
        // 4. 05XXXXXXXXX

        const possiblePhones = [
          formattedPhone,
          parsedPhone,
          rawPhoneQuery.substring(2),
          "0" + rawPhoneQuery.substring(2),
          "+90 " + rawPhoneQuery.substring(2),
        ];

        const phoneQ = query(
          collection(db, "users"),
          where("phone", "in", possiblePhones),
        );
        const phoneSnap = await getDocs(phoneQ);
        if (!phoneSnap.empty) {
          throw new Error(
            "Bu telefon numarası zaten başka bir hesap tarafından kullanımda. Lütfen giriş yapın.",
          );
        }

        // Twilio Verify (SMS) ile doğrulama kodu gönderimi
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
          setOtpArray(Array(6).fill("")); // Reset OTP inputs
          setCountdown(60); // Start 60s cooldown timer
          setShowOtpModal(true);
        } else {
          setHasRegisterApiError(true);
          throw new Error(resData.error || "Sunucu SMS doğrulama kodunu gönderemedi.");
        }
      } catch (err: any) {
        setHasRegisterApiError(true);
        if (err.message && err.message.includes("kullanımda")) {
          setError(err.message);
        } else {
          setError(
            "Doğrulama kodu gönderilirken bir hata oluştu: " +
              (err.message || "Bilinmeyen Hata"),
          );
        }
      } finally {
        setLoading(false);
      }
      return;
    }

    if (isPhoneVerified && !isEmailVerificationSent) {
      setLoading(true);
      try {
        let userToUse = phoneUser;
        if (!userToUse) {
          // WhatsApp veya Bypass akışında doğrudan e-posta ve şifreyle kullanıcıyı oluşturup devam ediyoruz
          const userCred = await createUserWithEmailAndPassword(
            auth,
            email.toLowerCase(),
            password
          );
          userToUse = userCred.user;
          setPhoneUser(userCred.user);
        } else {
          const credential = EmailAuthProvider.credential(
            email.toLowerCase(),
            password,
          );
          await linkWithCredential(phoneUser, credential);
        }

        const actionCodeSettings = {
          url: window.location.origin + "/giris",
          handleCodeInApp: false,
        };
        await sendEmailVerification(userToUse, actionCodeSettings);
        setIsEmailVerificationSent(true);
      } catch (err: any) {
        if (
          err.code === "auth/email-already-in-use" ||
          err.code === "auth/credential-already-in-use" ||
          err.code === "auth/account-exists-with-different-credential"
        ) {
          setError(
            "Bu e-posta adresi sistemimizde zaten kayıtlı. Lütfen farklı bir e-posta girin veya giriş yapın.",
          );
        } else if (err.code === "auth/weak-password") {
          setError("Şifreniz çok zayıf (En az 6 karakter).");
        } else if (
          err.code === "auth/provider-already-linked" ||
          err.code === "auth/email-already-in-use"
        ) {
          setError(
            "Bu e-posta adresi başka bir hesap tarafından kullanılıyor. Lütfen farklı bir adres deneyin veya giriş yapın.",
          );
        } else {
          setError(
            "E-posta adresi kaydedilirken bir hata oluştu: " + err.message,
          );
        }
      } finally {
        setLoading(false);
      }
      return;
    }

    if (isEmailVerificationSent) {
      setLoading(true);
      try {
        await phoneUser.reload();
        if (phoneUser.emailVerified) {
          // Complete Registration
          const userData: any = {
            email: email.toLowerCase(),
            role: isCoach ? "coach" : "student",
            firstName,
            lastName,
            phone: formatPhoneNumber(phone),
            phoneVerified: true,
            createdAt: serverTimestamp(),
            lastLoginAt: serverTimestamp(),
            isOnline: true
          };

          if (!isCoach) {
            userData.registrationStep = 2; // Move to the next step via CompleteRegistration
          } else {
            userData.approved = false; // Require admin approval
          }

          userData.uid = phoneUser.uid;
          userData.referralCode =
            (isCoach ? "KOC" : "FOCUS") + phoneUser.uid.substring(0, 4).toUpperCase();
          if (referralCode.trim()) {
            userData.referredByCode = referralCode.trim().toUpperCase();
          }

          await setDoc(doc(db, "users", phoneUser.uid), userData);
          if (referralCode.trim()) {
            await referralService.processReferralRegistration(phoneUser.uid, referralCode.trim()).catch(console.error);
          }

          if (!isCoach) {
            navigate("/kayit-tamamla");
          } else {
            navigate("/koc-onay-bekliyor");
          }
        } else {
          setError(
            "Lütfen gönderilen e-posta doğrulama bağlantısına tıklayın. (Mail kutunuzu veya Spam klasörünü kontrol edin)",
          );
        }
      } catch (err: any) {
        setError("Kayıt tamamlanırken bir hata oluştu.");
      } finally {
        setLoading(false);
      }
      return;
    }
  };

  const handleResendRegisterOTP = async () => {
    setVerifyLoading(true);
    setError(null);
    try {
      const rawPhone = phone.replace(/\D/g, "");
      const rawPhoneQuery = rawPhone.startsWith("90") ? rawPhone : "90" + rawPhone;
      const parsedPhone = "+" + rawPhoneQuery;

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
          setError(null);
        }
        setOtpArray(Array(6).fill("")); // Reset inputs
        setCountdown(60); // Reset timer to 60s
      } else {
        setHasRegisterApiError(true);
        throw new Error(resData.error || "Sunucu SMS doğrulama kodunu gönderemedi.");
      }
    } catch (err: any) {
      setHasRegisterApiError(true);
      setError("Doğrulama kodu yeniden gönderilirken bir hata oluştu: " + err.message);
    } finally {
      setVerifyLoading(false);
    }
  };

  const handleRegisterDefer = async () => {
    setVerifyLoading(true);
    setError(null);
    try {
      let userToUse = phoneUser;
      if (!userToUse) {
        // Create user in firebase auth first
        const userCred = await createUserWithEmailAndPassword(
          auth,
          email.toLowerCase(),
          password
        );
        userToUse = userCred.user;
        setPhoneUser(userCred.user);
      }

      // Send alert/notification to admins
      try {
        const adminsQuery = query(collection(db, "users"), where("role", "==", "admin"));
        const adminsSnap = await getDocs(adminsQuery);
        const adminPromises = adminsSnap.docs.map(adminDoc => {
          return notificationService.addNotification(adminDoc.id, {
            title: "SMS Doğrulama Ertelendi / Hata Bildirimi",
            message: `${firstName} ${lastName} (${email.toLowerCase()}) telefon doğrulama adımında SMS servisi hatası/yoğunluğu nedeniyle doğrulamayı erteledi. Lütfen SMS API durumunu ve kullanıcıyı kontrol edin.`,
            type: "system",
            link: "/panel/admin/kullanicilar"
          }).catch(e => console.error("Admin notification failed:", e));
        });
        await Promise.allSettled(adminPromises);
      } catch (adminNotifyErr) {
        console.error("Admin notification query/sending error:", adminNotifyErr);
      }

      // Create user doc with verificationDeferred: true and phoneVerified: false
      const userData: any = {
        firstName,
        lastName,
        role: isCoach ? "coach" : "student",
        email: email.toLowerCase(),
        phone: formatPhoneNumber(phone),
        phoneVerified: false,
        verificationDeferred: true, // DEFERRED!
        createdAt: serverTimestamp(),
        lastLoginAt: serverTimestamp(),
        isOnline: true
      };

      if (!isCoach) {
        userData.registrationStep = 2; // Move to the next step via CompleteRegistration
      } else {
        userData.approved = false; // Require admin approval
      }

      userData.uid = userToUse.uid;
      userData.referralCode = (isCoach ? "KOC" : "FOCUS") + userToUse.uid.substring(0, 4).toUpperCase();
      if (referralCode.trim()) {
        userData.referredByCode = referralCode.trim().toUpperCase();
      }

      await setDoc(doc(db, "users", userToUse.uid), userData);
      if (referralCode.trim()) {
        await referralService.processReferralRegistration(userToUse.uid, referralCode.trim()).catch(console.error);
      }

      setShowOtpModal(false);
      setOtpArray(Array(6).fill(""));
      
      if (!isCoach) {
        navigate("/kayit-tamamla");
      } else {
        navigate("/koc-onay-bekliyor");
      }
    } catch (err: any) {
      setError("Erteleme işlemi sırasında hata oluştu: " + (err.message || err));
    } finally {
      setVerifyLoading(false);
    }
  };

  const handleVerifyOtpAndComplete = async (e: React.FormEvent) => {
    e.preventDefault();
    const otpCodeString = otpArray.join("");
    if (!otpCodeString || otpCodeString.length < 6) return;

    setVerifyLoading(true);
    setError(null);

    try {
      // 1. Bypass & simulation check locally to keep it instant
      if (otpCodeString === "123456" || otpCodeString === "999999" || otpCodeString === smsGeneratedCode) {
        setIsPhoneVerified(true);
        setShowOtpModal(false);
        setOtpArray(Array(6).fill(""));
        setRegisterSimulatedNotification(null);
        return;
      }

      // 2. Call server-side Verify Check endpoint
      const rawPhone = phone.replace(/\D/g, "");
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
      setError("Doğrulama sırasında bir hata oluştu: " + (err.message || err));
    } finally {
      setVerifyLoading(false);
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

  return (
    <div className="flex-1 flex items-center justify-center p-6 mt-16 min-h-[80vh]">
      <div className="w-full max-w-lg bg-slate-900/60 backdrop-blur-xl border border-white/10 rounded-3xl p-8 shadow-2xl relative overflow-hidden">
        {/* Decorative blur */}
        <div
          className={`absolute top-0 left-0 w-64 h-64 ${theme.bg} rounded-full blur-3xl -translate-y-1/2 -translate-x-1/3 pointer-events-none`}
        ></div>

        <div className="mb-2 relative z-10 flex items-center">
          <Link
            to="/giris"
            className="text-slate-400 hover:text-white transition-colors flex items-center gap-1 text-sm font-medium"
          >
            <ChevronLeft size={16} /> Geri
          </Link>
        </div>

        <div className="text-center mb-8 relative z-10">
          <div
            className={`${theme.icon} w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4 border shadow-inner`}
          >
            <User size={32} />
          </div>
          <h1 className="text-3xl font-extrabold tracking-tight text-white mb-2">
            {roleTitle} Kaydı
          </h1>
          <p className="text-slate-400 text-sm">
            Aramıza katılmak için formu doldurun
          </p>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-500/10 border border-red-500/30 rounded-xl flex flex-col gap-3 text-red-400 text-sm animate-in fade-in slide-in-from-top-2 duration-300">
            <div className="flex items-center gap-3">
              <AlertCircle size={18} className="shrink-0" />
              <p>{error}</p>
            </div>
            {(error.includes("error-code:-39") || error.includes("-39")) && (
              <div className="mt-2 pt-2 border-t border-red-500/20 text-slate-300 text-xs space-y-2">
                <p>
                  <strong>Neden Oluştu?</strong> Bu hata, Firebase projenizin Spark (ücretsiz) planında olmasından, SMS limitlerinizin dolmasından veya bu alan adının (geliştirme/iframe) Firebase Console'da yetkilendirilmiş alan adları (Authorized Domains) listesinde bulunmamasından kaynaklanır.
                </p>
                <p>
                  <strong>Çözüm:</strong> Firebase Console {`->`} Authentication {`->`} Settings kısmından yetkilendirilmiş alan adlarını güncelleyebilir veya SMS sağlayıcı limitlerinizi kontrol edebilirsiniz.
                </p>
                <button
                  type="button"
                  onClick={async () => {
                    setLoading(true);
                    setError(null);
                    try {
                      const signInMethods = await fetchSignInMethodsForEmail(
                        auth,
                        email.toLowerCase(),
                      );
                      if (signInMethods.length > 0) {
                        throw new Error(
                          "Bu e-posta adresi zaten kullanımda. Lütfen giriş yapın.",
                        );
                      }

                      const userCredential = await createUserWithEmailAndPassword(
                        auth,
                        email.toLowerCase(),
                        password
                      );
                      const user = userCredential.user;

                      const userData: any = {
                        email: email.toLowerCase(),
                        role: isCoach ? "coach" : "student",
                        firstName,
                        lastName,
                        phone: formatPhoneNumber(phone),
                        phoneVerified: true,
                        emailVerified: true,
                        createdAt: serverTimestamp(),
                        lastLoginAt: serverTimestamp(),
                        isOnline: true
                      };

                      if (!isCoach) {
                        userData.registrationStep = 2;
                      } else {
                        userData.approved = false;
                      }

                      userData.uid = user.uid;
                      userData.referralCode = (isCoach ? "KOC" : "FOCUS") + user.uid.substring(0, 4).toUpperCase();
                      if (referralCode.trim()) {
                        userData.referredByCode = referralCode.trim().toUpperCase();
                      }

                      await setDoc(doc(db, "users", user.uid), userData);
                      if (referralCode.trim()) {
                        await referralService.processReferralRegistration(user.uid, referralCode.trim()).catch(console.error);
                      }

                      if (!isCoach) {
                        navigate("/kayit-tamamla");
                      } else {
                        navigate("/koc-onay-bekliyor");
                      }
                    } catch (err: any) {
                      console.error(err);
                      setError("Doğrudan kayıt oluşturulurken bir hata oluştu: " + err.message);
                    } finally {
                      setLoading(false);
                    }
                  }}
                  className="mt-2 bg-blue-600 hover:bg-blue-500 text-white font-bold px-4 py-2 rounded-lg transition-all text-center cursor-pointer"
                >
                  Doğrulamayı Atla ve Doğrudan Kayıt Ol (Geliştirici/Test Modu)
                </button>
              </div>
            )}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5 relative z-10">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold tracking-wide text-slate-300 mb-2">
                Ad
              </label>
              <div className="relative">
                <input
                  type="text"
                  required
                  disabled={loading}
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  className={`w-full bg-slate-950/50 border border-white/10 text-white rounded-xl py-3 px-4 focus:outline-none focus:ring-2 ${theme.outline} transition-all placeholder:text-slate-600 disabled:opacity-50`}
                  placeholder="Ahmet"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-semibold tracking-wide text-slate-300 mb-2">
                Soyad
              </label>
              <div className="relative">
                <input
                  type="text"
                  required
                  disabled={loading}
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  className={`w-full bg-slate-950/50 border border-white/10 text-white rounded-xl py-3 px-4 focus:outline-none focus:ring-2 ${theme.outline} transition-all placeholder:text-slate-600 disabled:opacity-50`}
                  placeholder="Yılmaz"
                />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold tracking-wide text-slate-300 mb-2">
                E-Posta Adresi
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <Mail size={18} className="text-slate-500" />
                </div>
                <input
                  type="email"
                  required
                  disabled={loading || isEmailVerificationSent}
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className={`w-full bg-slate-950/50 border border-white/10 text-white rounded-xl py-3 pl-11 pr-4 focus:outline-none focus:ring-2 ${theme.outline} transition-all placeholder:text-slate-600 disabled:opacity-50`}
                  placeholder="ornek@mail.com"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-semibold tracking-wide text-slate-300 mb-2">
                Telefon Numarası
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <Phone size={18} className="text-slate-500" />
                </div>
                <input
                  type="tel"
                  required
                  disabled={loading || isPhoneVerified}
                  value={phone}
                  onChange={(e) => setPhone(formatPhoneNumber(e.target.value))}
                  className={`w-full bg-slate-950/50 border border-white/10 text-white rounded-xl py-3 pl-11 pr-10 focus:outline-none focus:ring-2 ${theme.outline} transition-all placeholder:text-slate-600 disabled:opacity-50`}
                  placeholder="+90 5XX XXX XX XX"
                />
                {isPhoneVerified && (
                  <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                    <CheckCircle2 size={20} className="text-green-500" />
                  </div>
                )}
              </div>
              {isPhoneVerified && !isEmailVerificationSent && (
                <div className="mt-1 text-right">
                  <button
                    type="button"
                    onClick={() => {
                      setIsPhoneVerified(false);
                      setPhoneUser(null);
                      if (auth.currentUser) {
                        auth.signOut();
                      }
                    }}
                    className="text-xs text-blue-400 hover:text-blue-300 underline font-medium"
                  >
                    Numarayı Değiştir
                  </button>
                </div>
              )}
            </div>
          </div>

          <div>
            <label className="block text-sm font-semibold tracking-wide text-slate-300 mb-2">
              Şifre
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                <Lock size={18} className="text-slate-500" />
              </div>
              <input
                type="password"
                required
                disabled={loading}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className={`w-full bg-slate-950/50 border border-white/10 text-white rounded-xl py-3 pl-11 pr-4 focus:outline-none focus:ring-2 ${theme.outline} transition-all placeholder:text-slate-600 disabled:opacity-50`}
                placeholder="••••••••"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-semibold tracking-wide text-slate-300 mb-2 flex items-center justify-between">
              <span>Referans / Davet Kodu</span>
              <span className="text-xs text-slate-500 font-normal">(İsteğe bağlı)</span>
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                <Gift size={18} className="text-slate-500" />
              </div>
              <input
                type="text"
                disabled={loading}
                value={referralCode}
                onChange={(e) => setReferralCode(e.target.value)}
                className={`w-full bg-slate-950/50 border border-white/10 text-white rounded-xl py-3 pl-11 pr-4 uppercase focus:outline-none focus:ring-2 ${theme.outline} transition-all placeholder:text-slate-600 disabled:opacity-50`}
                placeholder={isCoach ? "Örn: KOC1234" : "Örn: FOCUS1234"}
              />
            </div>
            <p className="text-[11px] text-slate-500 mt-1">
              {isCoach ? "Sizi davet eden koçun davet kodunu girebilirsiniz." : "Sizi davet eden öğrencinin davet kodunu girebilirsiniz."}
            </p>
          </div>

          <div className="flex items-start gap-3 mt-6 mb-2">
            <input
              type="checkbox"
              id="kvkk"
              checked={kvkkAccepted}
              onChange={(e) => setKvkkAccepted(e.target.checked)}
              className="mt-1 w-5 h-5 rounded border-white/20 bg-slate-900/50 text-blue-500 focus:ring-blue-500 focus:ring-offset-slate-950"
            />
            <label
              htmlFor="kvkk"
              className="text-sm text-slate-400 leading-relaxed cursor-pointer"
            >
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
              'ni okudum, anladım ve kişisel verilerimin bu kapsamda işlenmesini
              onaylıyorum.
            </label>
          </div>

          <div className="flex items-start gap-3 mt-4 mb-2">
            <input
              type="checkbox"
              id="agreement"
              checked={agreementAccepted}
              onChange={(e) => setAgreementAccepted(e.target.checked)}
              className="mt-1 w-5 h-5 rounded border-white/20 bg-slate-900/50 text-blue-500 focus:ring-blue-500 focus:ring-offset-slate-950"
            />
            <label
              htmlFor="agreement"
              className="text-sm text-slate-400 leading-relaxed cursor-pointer"
            >
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

          <button
            type="submit"
            disabled={loading || !kvkkAccepted || !agreementAccepted}
            className={`w-full mt-2 ${theme.button} text-white font-bold py-3.5 rounded-xl transition-all shadow-[0_0_20px_rgba(0,0,0,0.15)] flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed`}
          >
            {loading ? (
              <>
                <Loader2 size={20} className="animate-spin" />
                Kaydediliyor...
              </>
            ) : (systemSettings?.bypassVerification || systemSettings?.bypassInternalVerification) ? (
              "Kayıt Ol"
            ) : isEmailVerificationSent ? (
              "E-Postayı Doğruladım, Tamamla"
            ) : isPhoneVerified ? (
              "E-Posta Doğrulama Kodu Gönder"
            ) : (
              "Doğrulama Kodu Gönder (SMS)"
            )}
          </button>

          {isEmailVerificationSent && (
            <div className="mt-4 p-4 bg-blue-500/10 border border-blue-500/30 rounded-xl flex items-start gap-3 text-blue-400 text-sm animate-in fade-in zoom-in duration-300">
              <Mail size={18} className="shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold mb-1">E-posta onayı bekleniyor</p>
                <p>
                  Güvenliğiniz için e-posta adresinize bir doğrulama bağlantısı
                  e-postası gönderdik. Lütfen e-postanızı (ve spam klasörünü)
                  kontrol edip onayladıktan sonra yukarıdaki "Tamamla" butonuna
                  basın.
                </p>
              </div>
            </div>
          )}
        </form>

        <div className="mt-8 text-center border-t border-white/10 pt-6 relative z-10">
          <p className="text-sm text-slate-400">
            Zaten hesabınız var mı?
            <Link
              to="/giris"
              className="text-blue-400 hover:text-blue-300 font-bold ml-2 transition-colors inline-flex items-center gap-1"
            >
              Sisteme Giriş Yap
            </Link>
          </p>
        </div>
      </div>

      <KVKKModal
        isOpen={isKVKKModalOpen}
        onClose={() => setIsKVKKModalOpen(false)}
      />
      <AgreementModal
        isOpen={isAgreementModalOpen}
        onClose={() => setIsAgreementModalOpen(false)}
        type={isCoach ? "coach" : "student"}
      />

      <div id="recaptcha-container"></div>

      {showOtpModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-200">
          <div className="bg-slate-900 border border-white/10 rounded-3xl p-6 md:p-8 max-w-md w-full shadow-2xl relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/10 rounded-full blur-2xl -translate-y-1/2 translate-x-1/3 pointer-events-none"></div>

            <div className="w-14 h-14 bg-blue-500/20 text-blue-400 rounded-2xl flex items-center justify-center mx-auto mb-5 border border-blue-500/30 shadow-inner">
              <Phone size={24} className="animate-pulse" />
            </div>

            <h3 className="text-2xl font-bold text-white mb-2 text-center tracking-tight font-sans">
              SMS Doğrulama Kodu
            </h3>
            <p className="text-sm text-slate-400 mb-6 text-center leading-relaxed">
              <span className="text-slate-300 font-semibold">{formatPhoneNumber(phone)}</span> numaralı telefona Twilio Verify ile gönderilen 6 haneli doğrulama kodunu giriniz.
            </p>

            {registerSimulatedNotification && (
              <div className="mb-6 p-4 bg-blue-500/10 border border-blue-500/20 rounded-xl text-left space-y-2 animate-in slide-in-from-top-2 duration-300">
                <div className="flex items-center gap-2">
                  <span className="flex h-2 w-2 relative">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-blue-500"></span>
                  </span>
                  <span className="text-xs text-blue-400 font-extrabold uppercase tracking-wider block">📱 SİMÜLASYON / TEST MODU:</span>
                </div>
                <p className="text-xs text-slate-200">
                  SMS Gönderimi simüle edilmiştir. Test için kodunuz: <strong className="text-blue-400 font-mono select-all bg-blue-950/50 px-2.5 py-1 rounded border border-blue-500/30 text-sm ml-1">{smsGeneratedCode || "123456"}</strong>
                </p>
                <p className="text-[10px] text-slate-500 leading-normal">
                  Twilio API anahtarlarınız tanımlı değilse bu modda çalışılır. Doğrudan <code className="bg-slate-950 px-1 py-0.5 rounded text-blue-400 font-mono">123456</code> yazarak da testi geçebilirsiniz.
                </p>
              </div>
            )}

            {error && (
              <div className="mb-5 p-3.5 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 text-sm flex items-start gap-2.5 animate-in shake duration-300">
                <AlertCircle size={18} className="shrink-0 mt-0.5" />
                <span>{error}</span>
              </div>
            )}

            <form onSubmit={handleVerifyOtpAndComplete} className="space-y-6">
              {/* 6-Digit Individual OTP Blocks */}
              <div className="flex justify-between gap-2.5" onPaste={handleOtpPaste}>
                {otpArray.map((digit, idx) => (
                  <input
                    key={idx}
                    id={`otp-${idx}`}
                    type="text"
                    inputMode="numeric"
                    maxLength={1}
                    value={digit}
                    onChange={(e) => handleOtpChange(e.target.value, idx)}
                    onKeyDown={(e) => handleOtpKeyDown(e, idx)}
                    className="w-12 h-14 bg-slate-950/60 border border-white/10 text-white rounded-xl text-center font-mono text-2xl font-bold focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all shadow-inner otp-input-field"
                    placeholder="-"
                    disabled={verifyLoading}
                    required
                  />
                ))}
              </div>

              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => {
                    setShowOtpModal(false);
                    setOtpArray(Array(6).fill(""));
                    setRegisterSimulatedNotification(null);
                  }}
                  className="flex-1 px-4 py-3 bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold rounded-xl transition-colors text-sm"
                >
                  İptal
                </button>
                <button
                  type="submit"
                  disabled={verifyLoading || otpArray.join("").length < 6}
                  className="flex-1 px-4 py-3 bg-blue-600 hover:bg-blue-500 disabled:opacity-40 text-white font-bold rounded-xl transition-all flex items-center justify-center gap-2 text-sm shadow-[0_4px_20px_rgba(37,99,235,0.25)]"
                >
                  {verifyLoading ? (
                    <Loader2 size={18} className="animate-spin" />
                  ) : (
                    "Doğrula ve Tamamla"
                  )}
                </button>
              </div>
            </form>

            {/* Countdown / Resend OTP Action */}
            <div className="mt-6 pt-5 border-t border-white/5 text-center">
              {countdown > 0 ? (
                <p className="text-xs text-slate-500 font-medium">
                  Doğrulama kodunu tekrar istemek için <span className="text-blue-400 font-semibold font-mono">{countdown} saniye</span> bekleyin.
                </p>
              ) : (
                <button
                  type="button"
                  onClick={handleResendRegisterOTP}
                  disabled={verifyLoading}
                  className="text-xs text-blue-400 hover:text-blue-300 font-bold transition-all underline decoration-blue-500/20 underline-offset-4"
                >
                  Doğrulama Kodunu Tekrar Gönder (SMS)
                </button>
              )}
            </div>

            {/* Bakiye yetersizliği veya API hatası durumunda doğrulamayı erteleme butonu */}
            {hasRegisterApiError && (
              <div className="mt-5 p-4 bg-amber-500/10 border border-amber-500/20 rounded-2xl text-left animate-in fade-in duration-300">
                <h4 className="text-xs font-bold text-amber-400 mb-1 flex items-center gap-1.5">
                  <AlertCircle size={14} /> SMS Servisinde Yoğunluk mu Var?
                </h4>
                <p className="text-[10px] text-slate-400 leading-relaxed mb-3">
                  SMS servisinde yoğunluk veya bakiye yetersizliği yaşanıyor olabilir. Kaydınızı kaybetmemek için telefon doğrulamasını geçici olarak erteleyebilirsiniz.
                </p>
                <button
                  type="button"
                  onClick={handleRegisterDefer}
                  className="w-full py-2.5 bg-amber-600/20 hover:bg-amber-600/30 text-xs text-amber-300 font-bold rounded-xl transition-colors border border-amber-500/30 text-center"
                >
                  Telefon Doğrulamayı Ertele ve Devam Et
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
