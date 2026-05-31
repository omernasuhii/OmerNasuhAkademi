import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Send, Brain, User, Loader2, Sparkles, Check } from 'lucide-react';
import { useAuth } from '../../lib/AuthContext';
import ReactMarkdown from 'react-markdown';
import { appointmentService, Service } from '../../services/appointmentService';
import { studentDataService } from '../../services/studentDataService';
import { analysisService } from '../../services/analysisService';

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

  const generateId = () => Date.now().toString() + Math.random().toString(36).substring(2, 9);

  const [wizardState, setWizardState] = useState<WizardState>({
    isActive: false, step: 0, availableServices: [], availableCoaches: []
  });

  useEffect(() => {
    // Scroll automatically feature disabled by user request
  }, [messages, isLoading, wizardState.isActive]);

  const startWizardFlow = async () => {
    setWizardState(s => ({ ...s, isActive: true, step: 1, isLoadingData: true }));
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
              { label: 'Ders', value: 'lesson' }
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

    const s = wizardState;
    if (s.step === 1) {
      setWizardState(prev => ({ ...prev, type: option.value, step: 2 }));
      const filtered = s.availableServices.filter(srv => srv.type === option.value);
      const nextOptions = filtered.map(srv => ({ label: srv.title, value: srv }));
      
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
      
      const dur = s.type === 'one-on-one' ? (s.service?.duration || 60) : 60;
      
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
               startMins += 30; // standard 30 min step
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

  const executeFunction = async (name: string, args: any) => {
    try {
      if (name === 'get_appointments') {
        const apps = await appointmentService.getAppointments(user!.uid, 'student');
        return { success: true, appointments: apps };
      }
      if (name === 'get_coach_schedule') {
        const coachIdToUse = args.coachId || userData?.coachId || userData?.assignedCoachId;
        if (!coachIdToUse) return { success: false, error: "Koç ataması bulunamadı." };
        const schedule = await appointmentService.getCoachSchedule(coachIdToUse);
        return { success: true, coachId: coachIdToUse, schedule };
      }
      if (name === 'start_booking_wizard') {
        startWizardFlow();
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
        // Fetch all possible data to analyze
        const [dailyPrograms, routines, bookTracking, examResults, personalityAnalyses] = await Promise.all([
          studentDataService.getAllDailyPrograms(uid),
          studentDataService.getRoutines(uid),
          studentDataService.getBookTracking(uid),
          studentDataService.getExamResults(uid),
          analysisService.getResults(uid)
        ]);

        // Fetch analyses for each exam to get subject-by-subject error types
        const examAnalyses = await Promise.all(
          examResults.map(exam => studentDataService.getExamAnalysis(exam.id))
        );

        return {
          success: true,
          dailyPrograms,
          routines,
          bookTracking,
          examResults,
          examAnalyses: examAnalyses.filter(Boolean), // Filter out nulls
          personalityAnalyses // Added cognitive and behavioural analyses (stress, form info etc.)
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
        const updatedHistory = [...historyToProcess, {
          id: generateId(),
          role: 'model' as const,
          functionCalls: data.functionCalls,
          content: data.text
        }];
        setMessages(updatedHistory);
        
        let hasWizard = false;
        for (const fc of data.functionCalls) {
          if (fc.name === 'start_booking_wizard') hasWizard = true;
          const result = await executeFunction(fc.name, fc.args);
          updatedHistory.push({
            id: fc.id,
            role: 'function' as const,
            name: fc.name,
            functionResponse: result
          });
        }
        
        setMessages([...updatedHistory]);
        
        // If wizard started, we don't need the AI to say more right now. The UI took over.
        if (!hasWizard) {
            await processResponse(updatedHistory);
        }
        return;
      }

      setMessages(prev => [...prev, {
        id: generateId(),
        role: 'model',
        content: data.text || 'Bir hata oluştu.'
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
    <div className="flex flex-col flex-1 h-full min-h-[600px] w-full max-w-4xl mx-auto rounded-3xl overflow-hidden bg-slate-900/50 border border-white/10 shadow-2xl relative">
      <div className="absolute inset-0 bg-slate-950/40 -z-10" />
      {/* Header */}
      <div className="p-4 md:p-6 bg-slate-900/80 backdrop-blur-md border-b border-white/5 shrink-0 flex items-center justify-between">
         <div>
            <h1 className="text-xl md:text-2xl font-black text-white flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white shadow-lg shadow-indigo-500/20">
                <Brain size={20} />
              </div>
              Yapay Zeka Asistanı
            </h1>
            <p className="text-slate-400 text-sm mt-1 ml-13">Senin verilerinle güçlendirilmiş destek</p>
         </div>
      </div>

      {/* Chat Area */}
      <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-6 custom-scrollbar relative">
        {messages.filter(m => m.role !== 'function' && (m.content || m.functionCalls || m.interactiveOptions)).map((message) => (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            key={message.id}
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
                   
                   {message.functionCalls && message.functionCalls.length > 0 && !message.content && (
                     <div className="text-xs text-indigo-300 flex items-center gap-2">
                       <Loader2 className="animate-spin" size={12} />
                       Sistem ile iletişim kuruluyor...
                     </div>
                   )}

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
    </div>
  );
}

