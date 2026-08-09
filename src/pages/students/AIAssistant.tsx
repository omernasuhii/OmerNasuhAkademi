import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Send, Brain, User, Loader2, Sparkles, Check, HelpCircle, Upload, Image, X, Volume2, VolumeX, Play, Pause, RotateCcw, BookOpen, CheckCircle2 } from 'lucide-react';
import { useAuth } from '../../lib/AuthContext';
import ReactMarkdown from 'react-markdown';
import { appointmentService, Service } from '../../services/appointmentService';
import { studentDataService } from '../../services/studentDataService';
import { analysisService } from '../../services/analysisService';
import { safeStorage } from '../../lib/localStorage';

interface Message {
  id: string;
  role: 'user' | 'model' | 'function';
  content?: string;
  functionCalls?: any[];
  functionResponse?: any;
  name?: string;
  // Custom interactive fields
  interactiveOptions?: { label: string; value: any }[];
  interactiveAnswered?: boolean;
}

type WizardState = {
  isActive: boolean;
  step: number;
  type?: string;
  service?: Service;
  coachId?: string;
  date?: string;
  hour?: string;
  availableServices: Service[];
  availableCoaches: any[];
  schedule?: any;
  appointments?: any[];
  isLoadingData?: boolean;
};

export default function AIAssistant() {
  const { user, userData } = useAuth();
  const [activeTab, setActiveTab] = useState<'chat' | 'solver'>('chat');

  // Existing Chat States
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 'greeting',
      role: 'model',
      content: 'Merhaba! Ben Ömer Nasuh Akademi AI Asistanı. Çalışma programın, deneme netlerin, konu eksiklerin veya rehberlik ihtiyacın olan herhangi bir konuda sana yardımcı olmak için buradayım. Özellikle randevularını yönetmek istersen bana söyleyebilirsin.'
    }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const chatContainerRef = useRef<HTMLDivElement>(null);

  // Question Solver States
  const [qText, setQText] = useState('');
  const [qImagePreview, setQImagePreview] = useState<string | null>(null);
  const [qImageMime, setQImageMime] = useState<string>('image/jpeg');
  const [selectedVoice, setSelectedVoice] = useState<string>('Puck');
  const [isSolving, setIsSolving] = useState(false);
  const [solverResult, setSolverResult] = useState<{
    text: string;
    audioDataUrl: string | null;
  } | null>(null);
  const [solverError, setSolverError] = useState<string | null>(null);
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const generateId = () => Date.now().toString() + Math.random().toString(36).substring(2, 9);

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 12 * 1024 * 1024) {
      setSolverError("Görsel boyutu 12MB'dan küçük olmalıdır.");
      return;
    }
    setSolverError(null);
    const reader = new FileReader();
    reader.onload = (evt) => {
      const resStr = evt.target?.result as string;
      setQImagePreview(resStr);
      setQImageMime(file.type || 'image/jpeg');
    };
    reader.readAsDataURL(file);
  };

  const handleRemoveImage = () => {
    setQImagePreview(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleSolveQuestion = async () => {
    if (!qText.trim() && !qImagePreview) {
      setSolverError("Lütfen bir soru metni yazın veya soru görseli yükleyin.");
      return;
    }

    setIsSolving(true);
    setSolverError(null);
    setSolverResult(null);
    setIsPlayingAudio(false);

    try {
      const studentName = userData?.displayName || userData?.name || "Öğrenci";
      const res = await fetch("/api/student-question-assistant", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          questionText: qText.trim(),
          imageBase64: qImagePreview,
          imageMimeType: qImageMime,
          studentName,
          voiceName: selectedVoice
        })
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Soru çözümü sırasında bir hata oluştu.");
      }

      let audioUrl: string | null = null;
      if (data.audioBase64) {
        audioUrl = `data:${data.audioMimeType || 'audio/wav'};base64,${data.audioBase64}`;
      }

      setSolverResult({
        text: data.text,
        audioDataUrl: audioUrl
      });

      if (userData?.uid) {
        studentDataService.awardXP(userData.uid, 5, 'AI Soru Çözümü').catch(console.error);
      }

    } catch (err: any) {
      setSolverError(err.message || "Bağlantı hatası oluştu.");
    } finally {
      setIsSolving(false);
    }
  };

  const toggleAudioPlay = () => {
    if (!audioRef.current) return;
    if (isPlayingAudio) {
      audioRef.current.pause();
      setIsPlayingAudio(false);
    } else {
      audioRef.current.play().then(() => {
        setIsPlayingAudio(true);
      }).catch(err => {
        console.error("Audio play error:", err);
      });
    }
  };

  const [wizardState, setWizardState] = useState<WizardState>({
    isActive: false, step: 0, availableServices: [], availableCoaches: []
  });

  useEffect(() => {
    // Load history
    if (user?.uid) {
        studentDataService.getAIAssistantChatHistory(user.uid).then(history => {
            if (Array.isArray(history) && history.length > 0) {
                setMessages(history);
            }
        }).catch(err => console.error("Failed to load chat history", err));
    }
  }, [user?.uid]);

  // Save history whenever messages change and are interesting enough
  useEffect(() => {
    if (user?.uid && messages.length > 1) {
        const cleanMessages = JSON.parse(JSON.stringify(messages));
        studentDataService.saveAIAssistantChatHistory(user.uid, cleanMessages);
    }
  }, [messages, user?.uid]);

  useEffect(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
    }
  }, [messages, isLoading, wizardState.isActive]);

  const startWizardFlow = async (currentHistory: Message[]) => {
    if (wizardState.isActive) return; // Prevent double trigger
    setWizardState(s => ({ ...s, isActive: true, step: 1, isLoadingData: true }));
    setMessages([...currentHistory]); // Commit history so far
    try {
      const [svcs, coaches] = await Promise.all([
        appointmentService.getServices(),
        appointmentService.getCoaches()
      ]);
      setWizardState(s => ({ ...s, availableServices: svcs, availableCoaches: coaches, isLoadingData: false }));
      
      setMessages(prev => [...prev, {
          id: generateId(),
          role: 'model',
          content: "Harika, randevu işlemini başlattım! Lütfen hangi tür randevu almak istediğini seç:",
          interactiveOptions: [
              { label: 'Birebir Görüşme', value: 'one-on-one' },
              { label: 'Ders', value: 'lesson' },
              { label: '❌ İptal Et', value: 'cancel' }
          ]
      }]);
    } catch(e) {
      console.error(e);
      setWizardState(s => ({ ...s, isActive: false, isLoadingData: false }));
      setMessages(prev => [...prev, {
          id: generateId(),
          role: 'model',
          content: "Randevu seçenekleri yüklenirken bir hata oluştu."
      }]);
    }
  };

  const handleWizardChoice = async (msgId: string, option: {label: string, value: any}) => {
    // Mark answered
    setMessages(prev => prev.map(m => m.id === msgId ? { ...m, interactiveAnswered: true } : m));
    
    // Add user response
    setMessages(prev => [...prev, { id: generateId(), role: 'user', content: option.label }]);

    if (option.value === 'cancel') {
      setWizardState(prev => ({ ...prev, isActive: false }));
      setMessages(prev => [...prev, { id: generateId(), role: 'model', content: "Randevu işlemi iptal edildi." }]);
      return;
    }

    const s = wizardState;
    if (s.step === 1) {
      setWizardState(prev => ({ ...prev, type: option.value, step: 2 }));
      const filtered = s.availableServices.filter(srv => srv.type === option.value);
      const nextOptions: { label: string; value: any }[] = filtered.map(srv => ({ label: srv.title, value: srv }));
      
      if (nextOptions.length > 0) nextOptions.push({ label: '❌ İptal Et', value: 'cancel' });

      setMessages(prev => [...prev, {
          id: generateId(),
          role: 'model',
          content: nextOptions.length > 0 ? "Hangi hizmeti almak istersin?" : "Bu kategoride hizmet bulunamadı. Lütfen daha sonra tekrar dene.",
          interactiveOptions: nextOptions.length > 0 ? nextOptions : undefined
      }]);
      if(nextOptions.length === 0) setWizardState(prev => ({ ...prev, isActive: false }));
    } 
    else if (s.step === 2) {
      const srv = option.value as Service;
      setWizardState(prev => ({ ...prev, service: srv, step: 3 }));
      
      const filtered = srv.assignedCoachIds?.length 
        ? s.availableCoaches.filter(c => srv.assignedCoachIds!.includes(c.uid))
        : s.availableCoaches;
        
      const nextOptions = filtered.map(c => ({ label: c.displayName || c.email, value: c.uid }));
      if (nextOptions.length > 0) nextOptions.push({ label: '❌ İptal Et', value: 'cancel' });
      
      setMessages(prev => [...prev, {
          id: generateId(),
          role: 'model',
          content: nextOptions.length > 0 ? "Hangi eğitmenle görüşmek istersin?" : "Erişilebilir eğitmen bulunamadı.",
          interactiveOptions: nextOptions.length > 0 ? nextOptions : undefined
      }]);
      if(nextOptions.length === 0) setWizardState(prev => ({ ...prev, isActive: false }));
    }
    else if (s.step === 3) {
      const coachId = option.value;
      setWizardState(prev => ({ ...prev, coachId, step: 4, isLoadingData: true }));
      
      const [schedule, appointments] = await Promise.all([
         appointmentService.getCoachSchedule(coachId),
         appointmentService.getAppointments(coachId, 'coach')
      ]);
      setWizardState(prev => ({ ...prev, schedule, appointments, isLoadingData: false }));

      const days = [];
      const today = new Date();
      for(let i=0; i<7; i++) {
          const d = new Date(today);
          d.setDate(today.getDate() + i);
          days.push({ 
              label: d.toLocaleDateString('tr-TR', { weekday: 'short', day: 'numeric', month: 'short' }), 
              value: d.toISOString().split('T')[0] 
          });
      }
      days.push({ label: '❌ İptal Et', value: 'cancel' });
      
      setMessages(prev => [...prev, {
          id: generateId(),
          role: 'model',
          content: "Lütfen bir tarih seç:",
          interactiveOptions: days
      }]);
    }
    else if (s.step === 4) {
      const dateStr = option.value;
      setWizardState(prev => ({ ...prev, date: dateStr, step: 5 }));
      
      const dur = 60; // Birer saatlik randevular
      
      const getSlotsForDate = (checkDateStr: string) => {
          const dateObj = new Date(checkDateStr);
          
          // Check Blocked Dates (Kapalı Günler)
          const blockedDates = s.schedule?.blockedDates || [];
          for (const bd of blockedDates) {
             if (checkDateStr >= bd.startDate && checkDateStr <= bd.endDate) {
                 if (bd.isAllDay !== false) return []; // Just return empty slots, it's kapalı gün
             }
          }

          const daysMap = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
          const dayName = daysMap[dateObj.getDay()];
          const daySchedule = s.schedule?.weeklyHours?.[dayName] || [];
          
          const manualBusy = (s.schedule?.manualBusySlots || [])
            .filter((b: any) => b.date === checkDateStr)
            .map((b: any) => ({ start: b.start, end: b.end }));
            
          const bookedTimes = (s.appointments || [])
            .filter((a: any) => a.date === checkDateStr && a.status !== 'cancelled')
            .map((a: any) => a.startTime);
            
          let slots: string[] = [];
          daySchedule.forEach((slot: any) => {
             let startMins = parseInt(slot.start.split(':')[0]) * 60 + parseInt(slot.start.split(':')[1]);
             let endMins = parseInt(slot.end.split(':')[0]) * 60 + parseInt(slot.end.split(':')[1]);
             while (startMins + dur <= endMins) {
               const h = Math.floor(startMins / 60).toString().padStart(2, '0');
               const m = (startMins % 60).toString().padStart(2, '0');
               const timeStr = `${h}:${m}`;
               
               const slotEndMins = startMins + dur;
               
               let isBusy = false;
               if (bookedTimes.includes(timeStr)) isBusy = true;
               
               // manual busy check
               for (const busy of manualBusy) {
                  const busyStart = parseInt(busy.start.split(':')[0]) * 60 + parseInt(busy.start.split(':')[1]);
                  const busyEnd = parseInt(busy.end.split(':')[0]) * 60 + parseInt(busy.end.split(':')[1]);
                  // overlap logic: startMins < busyEnd && slotEndMins > busyStart
                  if (startMins < busyEnd && slotEndMins > busyStart) {
                     isBusy = true;
                  }
               }
               
               if (!isBusy) {
                   slots.push(timeStr);
               }
               startMins += 60; // 1 saatlik aralıklar (10:00, 11:00, 12:00)
             }
          });
          return slots;
      };

      let slots = getSlotsForDate(dateStr);
      let nextAvailableSlotInfo = null;

      if (slots.length === 0) {
        // Fallback or nearest date logic
        // Find next available date in the upcoming 30 days
        let foundDate = null;
        let foundSlots = [];
        const iterDate = new Date(dateStr);
        for(let offset=1; offset<=30; offset++) {
            iterDate.setDate(iterDate.getDate() + 1);
            const checkStr = iterDate.toISOString().split('T')[0];
            const checkSlots = getSlotsForDate(checkStr);
            if (checkSlots.length > 0) {
                foundDate = checkStr;
                foundSlots = checkSlots;
                break;
            }
        }
        
        if (foundDate) {
           nextAvailableSlotInfo = {
               date: foundDate,
               slots: foundSlots,
               label: iterDate.toLocaleDateString('tr-TR', { weekday: 'short', day: 'numeric', month: 'short' })
           };
        }
      }

      if (slots.length > 0) {
          const nextOptions = slots.map(h => ({ label: h, value: h }));
          nextOptions.push({ label: '❌ İptal Et', value: 'cancel' });
          setMessages(prev => [...prev, {
              id: generateId(),
              role: 'model',
              content: "Müsait saatlerden sana uygun olanı seç:",
              interactiveOptions: nextOptions
          }]);
      } else if (nextAvailableSlotInfo) {
          // Present the the next available slots directly
          setWizardState(prev => ({ ...prev, date: nextAvailableSlotInfo.date })); // update the date implicitly
          
          const nextOptions = nextAvailableSlotInfo.slots.map((h: string) => ({ label: `${nextAvailableSlotInfo.label} - ${h}`, value: h }));
          nextOptions.push({ label: '❌ İptal Et', value: 'cancel' });
          setMessages(prev => [...prev, {
              id: generateId(),
              role: 'model',
              content: `Bu tarihte uygun saat bulunamadı. En yakın müsait tarih olan ${nextAvailableSlotInfo.label} günü için şu saatleri önerebilirim:`,
              interactiveOptions: nextOptions
          }]);
      } else {
          setMessages(prev => [...prev, {
              id: generateId(),
              role: 'model',
              content: "Bu tarihte uygun saat bulunamadı ve yakın zamanda da müsaitlik görünmüyor. Lütfen başka bir eğitmen dene.",
              interactiveOptions: [{ label: '❌ İptal Et', value: 'cancel' }]
          }]);
          setWizardState(prev => ({ ...prev, isActive: false }));
      }
    }
    else if (s.step === 5) {
      const hourStr = option.value;
      setWizardState(prev => ({ ...prev, hour: hourStr, isActive: false, isLoadingData: true }));
      
      try {
        await appointmentService.bookAppointment({
            studentId: user!.uid,
            studentName: `${userData?.firstName || ''} ${userData?.lastName || ''}`,
            serviceId: s.service?.id || 'wizard-booked',
            serviceType: s.type! as any,
            coachId: s.coachId!,
            date: s.date!,
            startTime: hourStr,
            status: 'pending',
            paymentStatus: 'unpaid',
            isOnline: true,
            participantCount: 1,
            location: s.service?.title
        });
        
        setMessages(prev => [...prev, {
            id: generateId(),
            role: 'model',
            content: `🎉 **Randevun başarıyla oluşturuldu!**\n\n**Hizmet:** ${s.service?.title}\n**Tarih:** ${s.date} \n**Saat:** ${hourStr}\n\nBaşka bir konuda yardıma ihtiyacın var mı?`
        }]);
      } catch(e) {
        setMessages(prev => [...prev, {
            id: generateId(),
            role: 'model',
            content: "Randevu kaydedilirken bir hata oluştu."
        }]);
      } finally {
        setWizardState(prev => ({ ...prev, isLoadingData: false }));
      }
    }
  };

  const executeFunction = async (name: string, args: any, currentHistory?: Message[]) => {
    try {
      if (name === 'get_appointments') {
        const apps = await appointmentService.getAppointments(user!.uid, 'student');
        const studentApps = apps.filter(app => app.requesterRole !== 'parent');
        return { success: true, appointments: studentApps };
      }
      if (name === 'get_coach_schedule') {
        const coachIdToUse = args.coachId || userData?.coachId || userData?.assignedCoachId;
        if (!coachIdToUse) return { success: false, error: "Koç ataması bulunamadı." };
        const schedule = await appointmentService.getCoachSchedule(coachIdToUse);
        return { success: true, coachId: coachIdToUse, schedule };
      }
      if (name === 'start_booking_wizard') {
        if (currentHistory) startWizardFlow(currentHistory);
        // Return a silent success to the model so it stops answering and lets the UI takeover
        return { success: true, message: "Sihirbaz UI başlatıldı, işlem sonucunu bekleme." };
      }
      if (name === 'book_appointment') {
        const coachIdToUse = userData?.coachId || userData?.assignedCoachId;
        if (!coachIdToUse) return { success: false, error: "Koç ataması bulunamadı, randevu alınamaz." };
        
        await appointmentService.bookAppointment({
          studentId: user!.uid,
          studentName: `${userData?.firstName} ${userData?.lastName}`,
          serviceId: 'ai-booked',
          serviceType: 'one-on-one',
          coachId: coachIdToUse,
          date: args.date,
          startTime: args.startTime,
          status: 'pending',
          paymentStatus: 'unpaid',
          isOnline: true,
          participantCount: 1,
          location: args.topic || 'Rehberlik Görüşmesi'
        });
        return { success: true, message: "Randevu başarıyla oluşturuldu.", date: args.date, startTime: args.startTime };
      }
      if (name === 'cancel_appointment') {
        await appointmentService.updateAppointmentStatus(args.appointmentId, 'cancelled');
        return { success: true, message: "Randevu iptal edildi." };
      }
      if (name === 'get_student_academic_data') {
        const uid = user!.uid;
        const dataTypes = (args?.dataTypes || []) as string[];
        const timeRangeDays = args?.timeRangeDays ? Number(args.timeRangeDays) : null;
        const limitCount = args?.limit ? Number(args.limit) : null;

        // Determine which types we should fetch (if dataTypes is provided, otherwise fetch all)
        const fetchAll = dataTypes.length === 0;
        const shouldFetchPrograms = fetchAll || dataTypes.includes('programs');
        const shouldFetchBooks = fetchAll || dataTypes.includes('books');
        const shouldFetchExams = fetchAll || dataTypes.includes('exams');
        const shouldFetchPersonality = fetchAll || dataTypes.includes('personality');
        const shouldFetchCaba = fetchAll || dataTypes.includes('caba');

        // Setup filter by date helper
        const cutoffDate = timeRangeDays ? new Date() : null;
        if (cutoffDate && timeRangeDays) {
          cutoffDate.setDate(cutoffDate.getDate() - timeRangeDays);
        }

        const isWithinTimeRange = (dateStr: any) => {
          if (!cutoffDate || !dateStr) return true;
          try {
            const date = new Date(dateStr);
            return date >= cutoffDate;
          } catch {
            return true;
          }
        };

        // Fetch concurrently, only fetching what is requested
        const [dailyProgramsRaw, routinesRaw, bookTrackingRaw, examResultsRaw, personalityAnalysesRaw, cabaTestResultRaw] = await Promise.all([
          shouldFetchPrograms ? studentDataService.getAllDailyPrograms(uid) : Promise.resolve([]),
          shouldFetchPrograms ? studentDataService.getRoutines(uid) : Promise.resolve(null),
          shouldFetchBooks ? studentDataService.getBookTracking(uid) : Promise.resolve([]),
          shouldFetchExams ? studentDataService.getExamResults(uid) : Promise.resolve([]),
          shouldFetchPersonality ? analysisService.getResults(uid).then(res => res.filter((r: any) => !['PARENT_REPORT', 'COACH_REPORT'].includes(r.analysisType))) : Promise.resolve([]),
          shouldFetchCaba ? studentDataService.getCabaTestResult(uid) : Promise.resolve(null)
        ]);

        // 1. Filter and Limit dailyPrograms
        let dailyPrograms = dailyProgramsRaw || [];
        if (cutoffDate) {
          dailyPrograms = dailyPrograms.filter((p: any) => isWithinTimeRange(p.date || p.createdAt));
        }
        if (limitCount !== null) {
          dailyPrograms = dailyPrograms.slice(0, limitCount);
        }

        // 2. Filter and Limit bookTracking
        let bookTracking = bookTrackingRaw || [];
        if (cutoffDate) {
          bookTracking = bookTracking.filter((b: any) => isWithinTimeRange(b.updatedAt || b.createdAt));
        }
        if (limitCount !== null) {
          bookTracking = bookTracking.slice(0, limitCount);
        }

        // 3. Filter and Limit examResults & Fetch their analyses
        let examResults = examResultsRaw || [];
        if (cutoffDate) {
          examResults = examResults.filter((e: any) => isWithinTimeRange(e.date));
        }
        if (limitCount !== null) {
          examResults = examResults.slice(0, limitCount);
        }

        const examAnalyses = shouldFetchExams ? await Promise.all(
          examResults.map((exam: any) => studentDataService.getExamAnalysis(exam.id))
        ) : [];

        // 4. Limit personalityAnalyses
        let personalityAnalyses = personalityAnalysesRaw || [];
        if (limitCount !== null) {
          personalityAnalyses = personalityAnalyses.slice(0, limitCount);
        }

        return {
          success: true,
          dailyPrograms: shouldFetchPrograms ? dailyPrograms : undefined,
          routines: shouldFetchPrograms ? routinesRaw : undefined,
          bookTracking: shouldFetchBooks ? bookTracking : undefined,
          examResults: shouldFetchExams ? examResults : undefined,
          examAnalyses: shouldFetchExams ? examAnalyses.filter(Boolean) : undefined,
          personalityAnalyses: shouldFetchPersonality ? personalityAnalyses : undefined,
          cabaTestResult: shouldFetchCaba ? cabaTestResultRaw : undefined
        };
      }
      return { success: false, error: "Bilinmeyen fonksiyon: " + name };
    } catch (e: any) {
      return { success: false, error: e.message };
    }
  };

  const processResponse = async (historyToProcess: Message[]) => {
    try {
      const contextData = {
        firstName: userData?.firstName,
        lastName: userData?.lastName,
        goal: userData?.goal || 'Belirtilmemiş',
        class: userData?.class || 'Belirtilmemiş',
        assignedCoachId: userData?.assignedCoachId || userData?.coachId
      };

      const response = await fetch('/api/student-assistant', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          history: historyToProcess.map(m => ({
             role: m.role, 
             content: m.content || '',
             functionCalls: m.functionCalls,
             functionResponse: m.functionResponse,
             name: m.name,
             id: m.id
          })),
          userContext: contextData
        })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Server error');
      }

      if (data.functionCalls && data.functionCalls.length > 0) {
        let hasWizard = data.functionCalls.some(fc => fc.name === 'start_booking_wizard');
        
        // Temizlenmiş text - gereksiz sistem loglarını gizle
        let cleanText = data.text;
        if (cleanText) {
           cleanText = cleanText.split('\n').filter(line => !line.toLowerCase().includes('sistem:')).join('\n').trim();
        }

        const modelMessageId = generateId();
        const updatedHistory = [...historyToProcess];
        
        // Eğer sadece wizard yoksa mesaj ekle; wizard varsa tek açılış mesajını startWizardFlow yönetir
        if (!hasWizard && cleanText) {
          updatedHistory.push({
            id: modelMessageId,
            role: 'model' as const,
            functionCalls: data.functionCalls,
            content: cleanText
          });
        }

        if (!hasWizard) {
          setMessages([...updatedHistory]);
        }
        
        let wizardTriggered = false;
        for (const fc of data.functionCalls) {
          if (fc.name === 'start_booking_wizard') {
             if (wizardTriggered) continue;
             wizardTriggered = true;
          }
          const result = await executeFunction(fc.name, fc.args, hasWizard ? historyToProcess : updatedHistory);
          if (!hasWizard) {
              updatedHistory.push({
                id: fc.id || generateId(),
                role: 'function' as const,
                name: fc.name,
                functionResponse: result
              });
          }
        }
        
        if (!hasWizard) {
            setMessages([...updatedHistory]);
            await processResponse(updatedHistory);
        }
        return;
      }

      let fallbackContent = data.text || '';
      const lowerContent = fallbackContent.toLowerCase();
      if (lowerContent.includes('start_booking_wizard') || lowerContent.includes('aracı çağrılıyor')) {
         // Model metin olarak fonksiyon adını yazdıysa doğrudan wizard'ı tek mesaj olarak başlat
         setTimeout(() => {
            startWizardFlow(historyToProcess);
         }, 50);
         return;
      }

      setMessages(prev => [...prev, {
        id: generateId(),
        role: 'model',
        content: fallbackContent || 'Bir hata oluştu.'
      }]);

    } catch (error: any) {
      console.error('Error:', error);
      setMessages(prev => [...prev, {
        id: generateId(),
        role: 'model',
        content: `Üzgünüm, bir hata oluştu: ${error.message}`
      }]);
    }
  };

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;

    if (wizardState.isActive) {
        setMessages(prev => [...prev, {
            id: generateId(),
            role: 'model',
            content: "Lütfen yukarıdaki menüden bir seçenek işaretleyerek devam et."
        }]);
        setInput('');
        return;
    }

    const currentInput = input;
    const newMessages = [...messages, { id: generateId(), role: 'user' as const, content: currentInput }];
    setMessages(newMessages);
    setInput('');
    setIsLoading(true);

    if (userData?.uid) {
        const todayStr = new Date().toISOString().split('T')[0];
        const updatePayload: any = {};
        if (userData.streakInfo?.lastAssistantDate !== todayStr) {
            updatePayload['streakInfo.lastAssistantDate'] = todayStr;
        }
        if (Object.keys(updatePayload).length > 0) {
            studentDataService.updateStudentProfile(userData.uid, updatePayload).catch(console.error);
        }
        
        studentDataService.awardXP(userData.uid, 2, 'Yapay Zeka Asistanı Kullanımı').catch(console.error);
    }

    try {
      await processResponse(newMessages);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="flex flex-col flex-1 h-[calc(100vh-130px)] min-h-[550px] max-h-[850px] w-full max-w-5xl mx-auto rounded-3xl overflow-hidden bg-slate-900/50 border border-white/10 shadow-2xl relative">
      <div className="absolute inset-0 bg-slate-950/40 -z-10" />
      {/* Header */}
      <div className="p-4 md:p-6 bg-slate-900/80 backdrop-blur-md border-b border-white/5 shrink-0 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
         <div>
            <h1 className="text-xl md:text-2xl font-black text-white flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white shadow-lg shadow-indigo-500/20">
                <Brain size={20} />
              </div>
              Yapay Zeka Asistanı
            </h1>
            <p className="text-slate-400 text-sm mt-1">Senin verilerinle güçlendirilmiş akademik ve soru çözüm desteği</p>
         </div>

         {/* Tab Switcher */}
         <div className="flex bg-slate-950/80 p-1 rounded-2xl border border-white/10 self-start sm:self-auto">
            <button
              onClick={() => setActiveTab('chat')}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs md:text-sm font-bold transition-all cursor-pointer ${
                activeTab === 'chat'
                  ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-md'
                  : 'text-slate-400 hover:text-white hover:bg-white/5'
              }`}
            >
              <Brain size={16} />
              <span>Genel Asistan</span>
            </button>

            <button
              onClick={() => setActiveTab('solver')}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs md:text-sm font-bold transition-all cursor-pointer ${
                activeTab === 'solver'
                  ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-md'
                  : 'text-slate-400 hover:text-white hover:bg-white/5'
              }`}
            >
              <HelpCircle size={16} />
              <span>Soru Çözüm Asistanı</span>
            </button>
         </div>
      </div>

      {activeTab === 'solver' ? (
        <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-6 custom-scrollbar relative">
          <div className="max-w-4xl mx-auto space-y-6">
            
            {/* Top Info Banner */}
            <div className="bg-gradient-to-r from-indigo-950/60 via-slate-900 to-purple-950/60 border border-indigo-500/20 rounded-3xl p-5 md:p-6 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-2xl bg-indigo-500/20 text-indigo-400 border border-indigo-500/30 flex items-center justify-center shrink-0">
                  <HelpCircle className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-lg font-black text-white flex items-center gap-2">
                    Soru Çözüm Asistanı
                    <span className="text-[10px] px-2.5 py-0.5 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-bold rounded-full">
                      Gemini Sesli Çözüm
                    </span>
                  </h3>
                  <p className="text-slate-400 text-xs mt-1">
                    Çözemediğin sorunun fotoğrafını yükle veya metnini yaz; yapay zeka hem adım adım çözsün hem de sesli olarak anlatsın.
                  </p>
                </div>
              </div>

              {solverResult && (
                <button
                  onClick={() => {
                    setSolverResult(null);
                    setQText('');
                    setQImagePreview(null);
                    setSolverError(null);
                    setIsPlayingAudio(false);
                  }}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-bold border border-white/10 flex items-center gap-2 shrink-0 transition-colors cursor-pointer"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Yeni Soru Çöz</span>
                </button>
              )}
            </div>

            {/* Error Message Alert */}
            {solverError && (
              <div className="p-4 bg-rose-500/10 border border-rose-500/20 text-rose-300 rounded-2xl text-xs font-semibold flex items-center gap-3">
                <X className="w-4 h-4 text-rose-400 shrink-0" />
                <span>{solverError}</span>
              </div>
            )}

            {/* Main Form & Output Area */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              
              {/* Left Column: Inputs */}
              <div className="lg:col-span-5 space-y-4">
                <div className="bg-slate-900/90 border border-white/10 rounded-3xl p-5 space-y-4">
                  
                  {/* Image Upload Box */}
                  <div>
                    <label className="block text-xs font-bold text-slate-300 mb-2 flex items-center justify-between">
                      <span>Soru Görseli (İsteğe Bağlı)</span>
                      <span className="text-[10px] text-slate-500">Maks. 12MB</span>
                    </label>

                    {qImagePreview ? (
                      <div className="relative rounded-2xl overflow-hidden border border-indigo-500/30 bg-slate-950 p-2 group">
                        <img src={qImagePreview} alt="Soru Önizleme" className="w-full h-48 object-contain rounded-xl" />
                        <button
                          onClick={handleRemoveImage}
                          className="absolute top-3 right-3 w-8 h-8 rounded-full bg-rose-600/90 hover:bg-rose-500 text-white flex items-center justify-center shadow-lg transition-transform hover:scale-105 cursor-pointer"
                          title="Görseli Kaldır"
                        >
                          <X size={16} />
                        </button>
                      </div>
                    ) : (
                      <div
                        onClick={() => fileInputRef.current?.click()}
                        className="border-2 border-dashed border-white/10 hover:border-indigo-500/50 bg-slate-950/40 hover:bg-slate-950/80 rounded-2xl p-6 text-center cursor-pointer transition-all flex flex-col items-center justify-center gap-2 group"
                      >
                        <div className="w-10 h-10 rounded-full bg-slate-800 group-hover:bg-indigo-600/20 text-slate-400 group-hover:text-indigo-400 flex items-center justify-center transition-colors">
                          <Upload className="w-5 h-5" />
                        </div>
                        <span className="text-xs font-semibold text-slate-300 group-hover:text-indigo-300">
                          Fotoğraf Yükle veya Sürükle
                        </span>
                        <span className="text-[10px] text-slate-500">PNG, JPG, WEBP desteklenir</span>
                      </div>
                    )}

                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      onChange={handleImageSelect}
                      className="hidden"
                    />
                  </div>

                  {/* Question Text Area */}
                  <div>
                    <label className="block text-xs font-bold text-slate-300 mb-2">
                      Soru Metni veya Ek Notlar
                    </label>
                    <textarea
                      value={qText}
                      onChange={(e) => setQText(e.target.value)}
                      placeholder="Soruyu buraya yazabilir veya görsel hakkında ekstra not belirtebilirsin..."
                      rows={4}
                      className="w-full bg-slate-950 border border-white/10 rounded-2xl p-3 text-slate-200 text-xs placeholder:text-slate-600 outline-none focus:border-indigo-500/50 transition-colors custom-scrollbar resize-none"
                    />
                  </div>

                  {/* Voice Selector */}
                  <div>
                    <label className="block text-xs font-bold text-slate-300 mb-2 flex items-center gap-1.5">
                      <Volume2 className="w-3.5 h-3.5 text-indigo-400" />
                      <span>Seslendirme Sesi (Gemini Voice)</span>
                    </label>
                    <select
                      value={selectedVoice}
                      onChange={(e) => setSelectedVoice(e.target.value)}
                      className="w-full bg-slate-950 border border-white/10 rounded-2xl p-3 text-slate-200 text-xs outline-none focus:border-indigo-500/50 transition-colors cursor-pointer"
                    >
                      <option value="Puck">Puck (Erkek - Doğal & Enerjik)</option>
                      <option value="Charon">Charon (Erkek - Tok & Derin)</option>
                      <option value="Aoede">Aoede (Kadın - Akıcı & Eğitici)</option>
                      <option value="Fenrir">Fenrir (Erkek - Tempolu)</option>
                      <option value="Kore">Kore (Kadın - Yumuşak & Anlaşılır)</option>
                    </select>
                  </div>

                  {/* Submit Button */}
                  <button
                    onClick={handleSolveQuestion}
                    disabled={isSolving || (!qText.trim() && !qImagePreview)}
                    className="w-full py-3.5 px-4 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 disabled:opacity-50 text-white font-bold text-xs rounded-2xl shadow-lg shadow-indigo-500/20 flex items-center justify-center gap-2 transition-all cursor-pointer disabled:cursor-not-allowed"
                  >
                    {isSolving ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin text-white" />
                        <span>Sorun İnceleniyor ve Çözülüyor...</span>
                      </>
                    ) : (
                      <>
                        <Sparkles className="w-4 h-4 text-amber-300" />
                        <span>Soruyu Çöz ve Seslendir</span>
                      </>
                    )}
                  </button>

                </div>
              </div>

              {/* Right Column: Results & Solution */}
              <div className="lg:col-span-7 space-y-4">
                
                {isSolving && (
                  <div className="bg-slate-900/90 border border-white/10 rounded-3xl p-8 text-center space-y-4 flex flex-col items-center justify-center min-h-[350px]">
                    <div className="relative">
                      <div className="w-16 h-16 rounded-3xl bg-indigo-500/20 text-indigo-400 border border-indigo-500/30 flex items-center justify-center animate-pulse">
                        <Brain className="w-8 h-8" />
                      </div>
                      <div className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-purple-600 text-white flex items-center justify-center text-[10px] animate-spin">
                        <Sparkles className="w-3.5 h-3.5" />
                      </div>
                    </div>
                    <div>
                      <h4 className="font-extrabold text-white text-base">Gemini Soru Çözüm Asistanı Çalışıyor</h4>
                      <p className="text-slate-400 text-xs mt-1 max-w-sm">
                        Sorudaki veriler taranıyor, adım adım çözüm hazırlanıyor ve seçilen seste seslendirme oluşturuluyor...
                      </p>
                    </div>
                  </div>
                )}

                {!isSolving && !solverResult && (
                  <div className="bg-slate-900/50 border border-white/5 rounded-3xl p-8 text-center space-y-3 flex flex-col items-center justify-center min-h-[350px]">
                    <div className="w-12 h-12 rounded-2xl bg-slate-800 text-slate-500 flex items-center justify-center">
                      <BookOpen className="w-6 h-6" />
                    </div>
                    <h4 className="font-bold text-slate-300 text-sm">Henüz Bir Soru Yüklenmedi</h4>
                    <p className="text-slate-500 text-xs max-w-xs">
                      Sol taraftan sorunun fotoğrafını yükleyebilir veya soruyu yazarak anında sesli çözüme ulaşabilirsin.
                    </p>
                  </div>
                )}

                {!isSolving && solverResult && (
                  <div className="space-y-4">
                    
                    {/* Audio Player Component */}
                    {solverResult.audioDataUrl && (
                      <div className="bg-gradient-to-r from-emerald-950/40 via-slate-900 to-indigo-950/40 border border-emerald-500/30 rounded-3xl p-5 space-y-3">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2.5">
                            <div className="w-9 h-9 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center border border-emerald-500/30">
                              <Volume2 className="w-5 h-5" />
                            </div>
                            <div>
                              <h5 className="font-extrabold text-white text-xs">Sesli Çözümlü Anlatım</h5>
                              <p className="text-[11px] text-emerald-400/80 font-medium">Gemini Voice • {selectedVoice}</p>
                            </div>
                          </div>

                          <button
                            onClick={toggleAudioPlay}
                            className="px-4 py-2 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black rounded-xl text-xs flex items-center gap-2 shadow-lg shadow-emerald-500/20 transition-transform active:scale-95 cursor-pointer"
                          >
                            {isPlayingAudio ? (
                              <>
                                <Pause className="w-4 h-4 fill-current" />
                                <span>Durdur</span>
                              </>
                            ) : (
                              <>
                                <Play className="w-4 h-4 fill-current ml-0.5" />
                                <span>Çözümü Dinle</span>
                              </>
                            )}
                          </button>
                        </div>

                        {/* Hidden Audio element */}
                        <audio
                          ref={audioRef}
                          src={solverResult.audioDataUrl}
                          onEnded={() => setIsPlayingAudio(false)}
                          onPause={() => setIsPlayingAudio(false)}
                          onPlay={() => setIsPlayingAudio(true)}
                          className="hidden"
                        />
                      </div>
                    )}

                    {/* Text Solution Display */}
                    <div className="bg-slate-900/90 border border-white/10 rounded-3xl p-6 space-y-4">
                      <div className="flex items-center gap-2 text-indigo-400 font-extrabold text-xs uppercase tracking-wider pb-3 border-b border-white/10">
                        <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                        <span>Adım Adım Çözüm Metni</span>
                      </div>

                      <div className="prose prose-invert prose-p:leading-relaxed prose-pre:bg-slate-950 prose-pre:border prose-pre:border-white/10 prose-sm max-w-none text-slate-200 text-xs md:text-sm">
                        <ReactMarkdown>{solverResult.text}</ReactMarkdown>
                      </div>
                    </div>

                  </div>
                )}

              </div>

            </div>

          </div>
        </div>
      ) : (
        <>
          {/* Chat Area */}
      <div 
        ref={chatContainerRef}
        data-no-auto-scroll-top="true"
        className="flex-1 overflow-y-auto p-4 md:p-6 space-y-6 custom-scrollbar relative"
      >
        {messages.filter(m => m.role !== 'function' && (m.content || m.interactiveOptions)).map((message, idx) => (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            key={message.id ? `${message.id}-${idx}` : `msg-${idx}`}
            className={`flex gap-4 max-w-4xl mx-auto ${message.role === 'user' ? 'flex-row-reverse' : ''}`}
          >
            {/* Avatar */}
            <div className={`w-10 h-10 shrink-0 rounded-full flex items-center justify-center border shadow-sm ${
              message.role === 'model' 
                ? 'bg-gradient-to-br from-indigo-500 to-purple-600 border-white/10 text-white'
                : 'bg-slate-800 border-white/10 text-slate-300'
            }`}>
              {message.role === 'model' ? <Sparkles size={18} /> : <User size={18} />}
            </div>

            {/* Bubble */}
            <div className={`p-4 rounded-2xl md:text-sm text-base leading-relaxed overflow-hidden ${
              message.role === 'model'
                ? 'bg-slate-800/80 text-slate-200 border border-white/5 rounded-tl-sm'
                : 'bg-indigo-600 text-white rounded-tr-sm shadow-md'
            }`}>
              {message.role === 'model' ? (
                 <div className="prose prose-invert prose-p:leading-relaxed prose-pre:bg-slate-900 prose-pre:border prose-pre:border-white/10 prose-sm max-w-none">
                   {message.content && <ReactMarkdown>{message.content}</ReactMarkdown>}
                   

                   {/* Interactive Options */}
                   {message.interactiveOptions && message.interactiveOptions.length > 0 && (
                     <div className="mt-4 flex flex-col gap-2 border-t border-white/10 pt-4">
                       {message.interactiveAnswered ? (
                          <div className="flex items-center gap-2 text-indigo-400 font-medium bg-indigo-500/10 px-3 py-2 rounded-lg text-sm border border-indigo-500/20">
                            <Check size={16} /> Seçim yapıldı.
                          </div>
                       ) : (
                          <div className="flex flex-wrap gap-2">
                            {message.interactiveOptions.map((opt, i) => (
                              <button
                                key={i}
                                onClick={() => handleWizardChoice(message.id, opt)}
                                className="px-4 py-2 bg-slate-700/50 hover:bg-indigo-600 hover:text-white text-slate-300 border border-white/10 rounded-xl transition-all font-medium text-sm text-left shadow-sm hover:shadow-md hover:shadow-indigo-500/20"
                              >
                                {opt.label}
                              </button>
                            ))}
                          </div>
                       )}
                     </div>
                   )}
                 </div>
              ) : (
                <div className="whitespace-pre-wrap">{message.content}</div>
              )}
            </div>
          </motion.div>
        ))}
        {(isLoading || wizardState.isLoadingData) && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex gap-4 max-w-4xl mx-auto"
          >
            <div className="w-10 h-10 shrink-0 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 border border-white/10 text-white flex items-center justify-center">
              <Sparkles size={18} />
            </div>
            <div className="p-4 rounded-2xl bg-slate-800 border border-white/5 rounded-tl-sm flex items-center gap-3">
               <Loader2 className="animate-spin text-indigo-400" size={16} />
               <span className="text-slate-400 text-sm">Düşünüyor...</span>
            </div>
          </motion.div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div className="p-4 md:p-6 bg-slate-900 border-t border-white/5 shrink-0">
        <div className="max-w-4xl mx-auto relative flex items-end gap-3 bg-slate-800/50 backdrop-blur-sm p-2 rounded-3xl border border-white/10 focus-within:border-indigo-500/50 transition-colors shadow-lg">
          <textarea
             value={input}
             onChange={(e) => setInput(e.target.value)}
             onKeyDown={handleKeyDown}
             placeholder={wizardState.isActive ? "Lütfen yukarıdaki menüden seçim yap..." : "Asistana mesaj gönder..."}
             className="w-full bg-transparent border-none text-white resize-none outline-none max-h-32 min-h-[44px] py-3 px-4 placeholder:text-slate-500 rounded-3xl custom-scrollbar text-sm disabled:opacity-50"
             rows={1}
             disabled={wizardState.isActive || isLoading}
             style={{ 
               height: input ? 'auto' : '44px'
             }}
          />
          <button 
             onClick={handleSend}
             disabled={!input.trim() || isLoading || wizardState.isActive}
             className="w-11 h-11 shrink-0 bg-indigo-600 hover:bg-indigo-500 disabled:bg-slate-700 disabled:text-slate-500 text-white rounded-full flex items-center justify-center transition-all shadow-md mt-auto mb-0.5 mr-0.5"
          >
             <Send size={18} className={input.trim() ? 'ml-0.5' : ''} />
          </button>
        </div>
        <div className="max-w-4xl mx-auto mt-3 flex justify-center text-xs text-slate-500 font-medium tracking-wide">
           Yapay Zeka Asistanı senin akademik gelişimini desteklemek için burada.
        </div>
      </div>
      </>
      )}
    </div>
  );
}

