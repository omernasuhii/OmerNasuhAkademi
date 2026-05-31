import React, { useState, useEffect } from 'react';
import { Mail, Lock, User, Phone, LogIn, ChevronLeft, Loader2, AlertCircle } from 'lucide-react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { createUserWithEmailAndPassword, signInWithEmailAndPassword, signOut } from 'firebase/auth';
import { initializeApp, getApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { doc, setDoc, serverTimestamp, getFirestore } from 'firebase/firestore';
import { auth, db } from '../lib/firebase';
import firebaseConfig from '../../firebase-applet-config.json';
import { referralService, ReferralSettings } from '../services/referralService';

export default function Register() {
  const location = useLocation();
  const navigate = useNavigate();
  const isCoach = location.pathname.includes('koc');
  const roleTitle = isCoach ? 'Koç' : 'Öğrenci';

  const [settings, setSettings] = useState<ReferralSettings | null>(null);

  useEffect(() => {
    if (!isCoach) {
      referralService.getSettings().then(data => {
        if (data) setSettings(data);
      });
    }
  }, [isCoach]);

  // Tailwind static class extraction for dynamic colors
  const roleColors = {
    emerald: {
      bg: 'bg-emerald-500/20',
      icon: 'bg-emerald-600/20 text-emerald-400 border-emerald-500/30',
      outline: 'focus:ring-emerald-500/50 focus:border-emerald-500',
      button: 'bg-emerald-600 hover:bg-emerald-500 shadow-emerald-500/30'
    },
    amber: {
      bg: 'bg-amber-500/20',
      icon: 'bg-amber-600/20 text-amber-400 border-amber-500/30',
      outline: 'focus:ring-amber-500/50 focus:border-amber-500',
      button: 'bg-amber-600 hover:bg-amber-500 shadow-amber-500/30'
    }
  };

  const theme = isCoach ? roleColors.emerald : roleColors.amber;

  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [phone, setPhone] = useState('');
  
  // Student specific fields
  const [grade, setGrade] = useState('');
  const [branch, setBranch] = useState('');
  const [parentFirstName, setParentFirstName] = useState('');
  const [parentLastName, setParentLastName] = useState('');
  const [parentEmail, setParentEmail] = useState('');
  const [parentPhone, setParentPhone] = useState('');
  const [ydtLanguage, setYdtLanguage] = useState('');
  const [referralCode, setReferralCode] = useState('');

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      // 1. Create Main User Profile Data
      const userData: any = {
        email: email,
        role: isCoach ? 'coach' : 'student',
        firstName,
        lastName,
        phone,
        createdAt: serverTimestamp(),
      };

      if (!isCoach) {
        userData.grade = grade;
        userData.branch = branch;
        if (branch === 'DİL') {
          userData.ydtLanguage = ydtLanguage;
        }
        userData.parentFirstName = parentFirstName;
        userData.parentLastName = parentLastName;
        userData.parentEmail = parentEmail;
        userData.parentPhone = parentPhone;
        userData.referredByCode = referralCode;
      }


      // 2. Auth Creation for Main User
      let user;
      try {
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        user = userCredential.user;
        console.log("New Auth user created:", user.uid);
      } catch (authErr: any) {
        if (authErr.code === 'auth/email-already-in-use') {
          console.log("Main email already in use, attempting sign-in as recovery...");
          try {
            const userCredential = await signInWithEmailAndPassword(auth, email, password);
            user = userCredential.user;
            console.log("Auth user recovered via sign-in:", user.uid);
          } catch (loginErr: any) {
            throw authErr; // Re-throw original "already in use" if login fails (likely wrong password)
          }
        } else {
          throw authErr;
        }
      }
      userData.uid = user.uid;

      // 3. Parent Account Creation (if student)
      if (!isCoach && parentEmail) {
        try {
          // Initialize/Get secondary app to create parent auth without logging out student
          let secondaryApp;
          try {
            secondaryApp = getApp('SecondaryApp');
          } catch {
            secondaryApp = initializeApp(firebaseConfig, 'SecondaryApp');
          }
          
          const secondaryAuth = getAuth(secondaryApp);
          const secondaryDb = getFirestore(secondaryApp, (firebaseConfig as any).firestoreDatabaseId);

          // Create/Recover parent Auth user
          let parentUser;
          try {
            const parentCredential = await createUserWithEmailAndPassword(secondaryAuth, parentEmail, password);
            parentUser = parentCredential.user;
          } catch (pAuthErr: any) {
            if (pAuthErr.code === 'auth/email-already-in-use') {
              try {
                const parentCredential = await signInWithEmailAndPassword(secondaryAuth, parentEmail, password);
                parentUser = parentCredential.user;
              } catch {
                throw pAuthErr;
              }
            } else {
              throw pAuthErr;
            }
          }

          // Create parent document
          const parentData = {
            uid: parentUser.uid,
            email: parentEmail,
            role: 'parent',
            firstName: parentFirstName,
            lastName: parentLastName,
            phone: parentPhone,
            studentUid: user.uid,
            studentName: `${firstName} ${lastName}`,
            createdAt: serverTimestamp()
          };

          await setDoc(doc(secondaryDb, 'users', parentUser.uid), parentData);
          
          // Sign out the secondary app session immediately so it doesn't conflict
          await signOut(secondaryAuth);
          console.log("Parent account created or recovered successfully:", parentUser.uid);
        } catch (parentErr: any) {
          console.error("Parent creation/recovery failed (skipping):", parentErr);
          // We don't block student registration if parent creation fails
        }
      }

      // 4. Save Main User doc
      await setDoc(doc(db, 'users', user.uid), userData);
      
      navigate(isCoach ? '/panel/koc' : '/panel/ogrenci');
    } catch (err: any) {
      console.error("Registration error:", err);
      let message = "Kayıt işlemi sırasında bir hata oluştu.";
      if (err.code === 'auth/email-already-in-use') {
        message = "Bu e-posta adresi zaten kullanımda.";
      } else if (err.code === 'auth/weak-password') {
        message = "Şifre çok zayıf (en az 6 karakter olmalı).";
      } else if (err.code === 'auth/invalid-email') {
        message = "Geçersiz e-posta adresi.";
      } else if (err.code === 'auth/operation-not-allowed') {
        message = "E-posta/Şifre girişi henüz Firebase panelinden etkinleştirilmemiş. Lütfen Authentication > Sign-in method panelinden aktif edin.";
      }
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex-1 flex items-center justify-center p-6 mt-16 min-h-[80vh]">
      <div className="w-full max-w-lg bg-slate-900/60 backdrop-blur-xl border border-white/10 rounded-3xl p-8 shadow-2xl relative overflow-hidden">
        {/* Decorative blur */}
        <div className={`absolute top-0 left-0 w-64 h-64 ${theme.bg} rounded-full blur-3xl -translate-y-1/2 -translate-x-1/3 pointer-events-none`}></div>
        
        <div className="mb-2 relative z-10 flex items-center">
            <Link to="/giris" className="text-slate-400 hover:text-white transition-colors flex items-center gap-1 text-sm font-medium">
              <ChevronLeft size={16} /> Geri
            </Link>
        </div>

        <div className="text-center mb-8 relative z-10">
          <div className={`${theme.icon} w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4 border shadow-inner`}>
            <User size={32} />
          </div>
          <h1 className="text-3xl font-extrabold tracking-tight text-white mb-2">{roleTitle} Kaydı</h1>
          <p className="text-slate-400 text-sm">Aramıza katılmak için formu doldurun</p>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-500/10 border border-red-500/30 rounded-xl flex items-center gap-3 text-red-400 text-sm animate-in fade-in slide-in-from-top-2 duration-300">
            <AlertCircle size={18} className="shrink-0" />
            <p>{error}</p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5 relative z-10">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold tracking-wide text-slate-300 mb-2">Ad</label>
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
              <label className="block text-sm font-semibold tracking-wide text-slate-300 mb-2">Soyad</label>
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
              <label className="block text-sm font-semibold tracking-wide text-slate-300 mb-2">E-Posta Adresi</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <Mail size={18} className="text-slate-500" />
                </div>
                <input 
                  type="email" 
                  required
                  disabled={loading}
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className={`w-full bg-slate-950/50 border border-white/10 text-white rounded-xl py-3 pl-11 pr-4 focus:outline-none focus:ring-2 ${theme.outline} transition-all placeholder:text-slate-600 disabled:opacity-50`}
                  placeholder="ornek@mail.com"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-semibold tracking-wide text-slate-300 mb-2">Telefon Numarası</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <Phone size={18} className="text-slate-500" />
                </div>
                <input 
                  type="tel" 
                  required
                  disabled={loading}
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className={`w-full bg-slate-950/50 border border-white/10 text-white rounded-xl py-3 pl-11 pr-4 focus:outline-none focus:ring-2 ${theme.outline} transition-all placeholder:text-slate-600 disabled:opacity-50`}
                  placeholder="05XX XXX XX XX"
                />
              </div>
            </div>
          </div>

          {!isCoach && (
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold tracking-wide text-slate-300 mb-2">Sınıf Seviyesi</label>
                <select 
                  required
                  disabled={loading}
                  value={grade}
                  onChange={(e) => setGrade(e.target.value)}
                  className="w-full bg-slate-950/50 border border-white/10 text-white rounded-xl py-3 px-4 focus:outline-none focus:ring-2 focus:ring-amber-500/50 focus:border-amber-500 transition-all appearance-none cursor-pointer disabled:opacity-50"
                >
                  <option value="" disabled className="bg-slate-900 text-slate-500">Seçiniz</option>
                  <option value="10. Sınıf" className="bg-slate-900">10. Sınıf</option>
                  <option value="11. Sınıf" className="bg-slate-900">11. Sınıf</option>
                  <option value="12. Sınıf" className="bg-slate-900">12. Sınıf</option>
                  <option value="Mezun" className="bg-slate-900">Mezun</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-semibold tracking-wide text-slate-300 mb-2">Alan</label>
                <select 
                  required
                  disabled={loading}
                  value={branch}
                  onChange={(e) => setBranch(e.target.value)}
                  className="w-full bg-slate-950/50 border border-white/10 text-white rounded-xl py-3 px-4 focus:outline-none focus:ring-2 focus:ring-amber-500/50 focus:border-amber-500 transition-all appearance-none cursor-pointer disabled:opacity-50"
                >
                  <option value="" disabled className="bg-slate-900 text-slate-500">Seçiniz</option>
                  <option value="TYT" className="bg-slate-900">TYT (9-10)</option>
                  <option value="SAY" className="bg-slate-900">Sayısal (SAY)</option>
                  <option value="EA" className="bg-slate-900">Eşit Ağırlık (EA)</option>
                  <option value="SÖZ" className="bg-slate-900">Sözel (SÖZ)</option>
                  <option value="DİL" className="bg-slate-900">Dil (DİL)</option>
                </select>
              </div>
              {branch === 'DİL' && (
               <div className="col-span-2">
                 <label className="block text-sm font-semibold tracking-wide text-slate-300 mb-2">Çalışılan Yabancı Dil</label>
                 <select 
                   required
                   disabled={loading}
                   value={ydtLanguage}
                   onChange={(e) => setYdtLanguage(e.target.value)}
                   className="w-full bg-slate-950/50 border border-white/10 text-white rounded-xl py-3 px-4 focus:outline-none focus:ring-2 focus:ring-amber-500/50 focus:border-amber-500 transition-all appearance-none cursor-pointer disabled:opacity-50"
                 >
                   <option value="" disabled className="bg-slate-900 text-slate-500">Seçiniz</option>
                   <option value="İngilizce" className="bg-slate-900">İngilizce</option>
                   <option value="Almanca" className="bg-slate-900">Almanca</option>
                   <option value="Fransızca" className="bg-slate-900">Fransızca</option>
                   <option value="Arapça" className="bg-slate-900">Arapça</option>
                   <option value="Rusça" className="bg-slate-900">Rusça</option>
                 </select>
               </div>
              )}
            </div>
          )}

          {!isCoach && (
            <div className="space-y-5 p-4 bg-white/5 rounded-2xl border border-white/5">
              <p className="text-xs font-bold text-amber-500 uppercase tracking-widest flex items-center gap-2">
                <User size={14} /> Veli Bilgileri
              </p>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold tracking-wide text-slate-300 mb-2">Veli Adı</label>
                  <input 
                    type="text" 
                    required
                    disabled={loading}
                    value={parentFirstName}
                    onChange={(e) => setParentFirstName(e.target.value)}
                    className="w-full bg-slate-950/50 border border-white/10 text-white rounded-xl py-3 px-4 focus:outline-none focus:ring-2 focus:ring-amber-500/50 focus:border-amber-500 transition-all placeholder:text-slate-600 disabled:opacity-50"
                    placeholder="Ad"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold tracking-wide text-slate-300 mb-2">Veli Soyadı</label>
                  <input 
                    type="text" 
                    required
                    disabled={loading}
                    value={parentLastName}
                    onChange={(e) => setParentLastName(e.target.value)}
                    className="w-full bg-slate-950/50 border border-white/10 text-white rounded-xl py-3 px-4 focus:outline-none focus:ring-2 focus:ring-amber-500/50 focus:border-amber-500 transition-all placeholder:text-slate-600 disabled:opacity-50"
                    placeholder="Soyad"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold tracking-wide text-slate-300 mb-2">Veli E-Posta</label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                      <Mail size={18} className="text-slate-500" />
                    </div>
                    <input 
                      type="email" 
                      required
                      disabled={loading}
                      value={parentEmail}
                      onChange={(e) => setParentEmail(e.target.value)}
                      className="w-full bg-slate-950/50 border border-white/10 text-white rounded-xl py-3 pl-11 pr-4 focus:outline-none focus:ring-2 focus:ring-amber-500/50 focus:border-amber-500 transition-all placeholder:text-slate-600 disabled:opacity-50"
                      placeholder="veli@mail.com"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-semibold tracking-wide text-slate-300 mb-2">Veli Telefon</label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                      <Phone size={18} className="text-slate-500" />
                    </div>
                    <input 
                      type="tel" 
                      required
                      disabled={loading}
                      value={parentPhone}
                      onChange={(e) => setParentPhone(e.target.value)}
                      className="w-full bg-slate-950/50 border border-white/10 text-white rounded-xl py-3 pl-11 pr-4 focus:outline-none focus:ring-2 focus:ring-amber-500/50 focus:border-amber-500 transition-all placeholder:text-slate-600 disabled:opacity-50"
                      placeholder="05XX XXX XX XX"
                    />
                  </div>
                </div>
              </div>
              <p className="text-[10px] text-slate-500 italic">* Veliler bu e-posta ve öğrenci şifresi ile sisteme "İzleyici" olarak giriş yapabilecektir.</p>
            </div>
          )}

          <div>
            <label className="block text-sm font-semibold tracking-wide text-slate-300 mb-2">Şifre</label>
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


          {!isCoach && (
            <div className="mt-4">
              <label className="block text-sm font-semibold tracking-wide text-slate-300 mb-2">Davet Kodu (Opsiyonel)</label>
              <div className="relative">
                <input 
                  type="text" 
                  disabled={loading}
                  value={referralCode}
                  onChange={(e) => setReferralCode(e.target.value.toUpperCase())}
                  className={`w-full bg-slate-950/50 border border-white/10 text-white rounded-xl py-3 px-4 focus:outline-none focus:ring-2 ${theme.outline} transition-all placeholder:text-slate-600 disabled:opacity-50 font-mono`}
                  placeholder="FOCUS2026"
                />
              </div>
              <p className="text-[10px] text-slate-500 mt-1 italic">
                {settings ? (
                  <>
                    Arkadaşının davet kodunu girerek ilk alışverişinde anında <strong className="text-white">{settings.rewardType === 'percent' ? `%${settings.refereeReward}` : `${settings.refereeReward} TL`} İndirim</strong> kazanabilirsin.
                  </>
                ) : (
                  "Arkadaşının davet kodunu girerek indirim kazanabilirsin."
                )}
              </p>
            </div>
          )}

          <button 
            type="submit" 
            disabled={loading}
            className={`w-full mt-2 ${theme.button} text-white font-bold py-3.5 rounded-xl transition-all shadow-[0_0_20px_rgba(0,0,0,0.15)] flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed`}
          >
            {loading ? (
              <>
                <Loader2 size={20} className="animate-spin" />
                Kaydediliyor...
              </>
            ) : (
              'Kayıt Ol'
            )}
          </button>
        </form>

        <div className="mt-8 text-center border-t border-white/10 pt-6 relative z-10">
          <p className="text-sm text-slate-400">
            Zaten hesabınız var mı? 
            <Link to="/giris" className="text-blue-400 hover:text-blue-300 font-bold ml-2 transition-colors inline-flex items-center gap-1">
              Sisteme Giriş Yap
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
