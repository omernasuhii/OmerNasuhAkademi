import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'motion/react';
import { Bot, Send, User, MessageCircle, Sparkles, AlertCircle, Loader2, Users } from 'lucide-react';
import { useAuth } from '../../lib/AuthContext';
import { collection, query, where, getDocs, doc, getDoc, setDoc } from 'firebase/firestore';
import { db } from '../../lib/firebase';

import { studentDataService } from '../../services/studentDataService';
import { analysisService } from '../../services/analysisService';
import { appointmentService } from '../../services/appointmentService';

export default function CoachAssistant() {
  const { user, userData } = useAuth();
  const [students, setStudents] = useState<any[]>([]);
  const [messages, setMessages] = useState<{role: 'user' | 'assistant', content: string}[]>([
    {
      role: 'assistant',
      content: `Merhaba ${userData?.firstName}! Ben ON Asistan. Öğrencilerinizin durumları, gelişimleri ve koçluk süreçleri hakkında fikir alışverişi yapabiliriz. Size nasıl yardımcı olabilirim?`
    }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [studentsLoaded, setStudentsLoaded] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (user) {
      loadStudents();
      loadChatHistory();
    }
  }, [user]);

  const loadChatHistory = async () => {
    if (!user) return;
    try {
      const chatDoc = await getDoc(doc(db, 'coach_chats', user.uid));
      if (chatDoc.exists()) {
        const data = chatDoc.data();
        if (data.messages && data.messages.length > 0) {
          setMessages(data.messages);
        }
      }
    } catch (error) {
      console.error("Geçmiş sohbetler yüklenirken hata:", error);
    }
  };

  const saveChatHistory = async (newMessages: {role: 'user' | 'assistant', content: string}[]) => {
    if (!user) return;
    try {
      await setDoc(doc(db, 'coach_chats', user.uid), { messages: newMessages }, { merge: true });
    } catch (error) {
      console.error("Sohbet kaydedilirken hata:", error);
    }
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const loadStudents = async () => {
    try {
      const q = query(collection(db, 'users'), where('coachId', '==', user!.uid));
      const snap = await getDocs(q);
      const studentDocs = await Promise.all(snap.docs.map(async (doc) => {
        const studentData = doc.data();
        const uid = doc.id;
        const displayName = studentData.displayName || `${studentData.firstName} ${studentData.lastName}`;
        
        // Fetch ALL requested context data
        const [
          books, 
          exams, 
          analyses, 
          appointments, 
          goals, 
          programs, 
          weeklyPrograms,
          coachReports
        ] = await Promise.all([
          studentDataService.getBookTracking(uid),
          studentDataService.getExamResults(uid),
          studentDataService.getStudentAnalyses(uid),
          appointmentService.getAppointments(uid, 'student'),
          studentDataService.getMonthlyGoal(uid, new Date().toISOString().substring(0, 7)),
          studentDataService.getAllDailyPrograms(uid),
          studentDataService.getWeeklyPrograms(uid),
          analysisService.getResults(uid, 'COACH_REPORT')
        ]);

        return { 
          uid, 
          ...studentData,
          displayName,
          summaryData: {
            books: books,
            exams: exams,
            examAnalyses: analyses,
            appointments: appointments,
            currentGoal: goals,
            walletBalance: studentData.walletBalance || 0,
            subscriptionPlan: studentData.subscriptionPlan || 'Standart',
            dailyPrograms: programs,
            weeklyPrograms: weeklyPrograms,
            coachReport: coachReports && coachReports.length > 0 ? coachReports[0].data.reportText : null
          }
        };
      }));
      
      setStudents(studentDocs);
      setStudentsLoaded(true);
    } catch (err) {
      console.error("Öğrenciler ve verileri yüklenirken hata:", err);
    }
  };

  const generateContext = () => {
    if (students.length === 0) {
      return "Kullanıcının henüz öğrencisi bulunmamaktadır.";
    }

    let context = "Koçun Yetkisi Altındaki Öğrenciler ve Tüm Detaylı Verileri (Genel Durum, Kitap Takibi, Randevular, Haftalık Program ve Notlar, Sınav Sonuçları, Deneme/Derin Analizleri, Öğrenci Profili, Koç Kişilik Raporları, Hedefler, Ödeme ve Abonelikler):\n\n";
    students.forEach((s, idx) => {
      const data = s.summaryData;
      context += `${idx + 1}. ${s.displayName} (UID: ${s.uid}):\n`;
      
      // 1 & 8. Öğrenci Profili ve Genel Durum
      context += `   --- PROFİL VE GENEL DURUM ---\n`;
      context += `   - Sınıf/Alan: ${s.grade || 'Belirtilmemiş'} / ${s.branch || 'Belirtilmemiş'}\n`;
      context += `   - İletişim: ${s.email} | Tel: ${s.phone || 'Yok'}\n`;
      context += `   - Abonelik Paketi: ${data.subscriptionPlan}\n`;
      context += `   - Cüzdan Bakiyesi / Koça Ödemeler: ₺${data.walletBalance}\n`;
      
      // 9. Koç Kişilik Raporları
      if (data.coachReport) {
         context += `   - Koç İçin Kişilik/Rehberlik Raporu: ${data.coachReport.substring(0, 300)}... (Özet)\n`;
      } else {
         context += `   - Koç İçin Kişilik/Rehberlik Raporu: Henüz oluşturulmamış.\n`;
      }

      // 10. Hedefler ve Takip
      context += `   --- HEDEFLER VE TAKİP ---\n`;
      context += `   - Aylık Hedef: ${data.currentGoal?.title || 'Belirlenmemiş'} (${data.currentGoal?.description || ''})\n`;

      // 2. Kitap Takibi
      context += `   --- KİTAP VE KANAL TAKİBİ ---\n`;
      if (data.books && data.books.length > 0) {
        context += `   - Toplam ${data.books.length} kaynak/kitap/kanal kayıtlı.\n`;
        data.books.slice(0, 5).forEach((b: any) => {
          const totalProgress = b.progress || 0;
          context += `       * ${b.title} (${b.subject || ''}): %${totalProgress} tamamlandı.\n`;
        });
        if (data.books.length > 5) context += `       * (ve ${data.books.length - 5} kaynak daha...)\n`;
      } else {
        context += `   - Kayıtlı kaynak bulunmuyor.\n`;
      }

      // 3. Randevular
      context += `   --- RANDEVULAR ---\n`;
      const activeAppointments = data.appointments.filter((a:any) => ['pending', 'confirmed'].includes(a.status));
      if (activeAppointments.length > 0) {
         context += `   - Yaklaşan ${activeAppointments.length} randevu var:\n`;
         activeAppointments.slice(0,3).forEach((a:any) => {
           context += `       * Tarih: ${a.date} ${a.time} - Durum: ${a.status}\n`;
         });
      } else {
         context += `   - Yaklaşan randevu yok.\n`;
      }

      // 4. Haftalık Programlar, Tamamlanma Oranları, Koç ve Öğrenci Notları
      context += `   --- HAFTALIK PROGRAMLAR VE NOTLAR ---\n`;
      if (data.weeklyPrograms && data.weeklyPrograms.length > 0) {
         const recentWeeks = data.weeklyPrograms.slice(0, 2);
         recentWeeks.forEach((wp:any) => {
           context += `       * Hafta: ${wp.weekStartDate}\n`;
           if (wp.coachNotes) context += `         - Koç Notu: ${wp.coachNotes}\n`;
           if (wp.studentNotes) context += `         - Öğrenci Notu: ${wp.studentNotes}\n`;
         });
      }
      if (data.dailyPrograms && data.dailyPrograms.length > 0) {
         const recentDays = data.dailyPrograms.slice(0, 5); // last 5 days
         let totalTasks = 0;
         let completedTasks = 0;
         data.dailyPrograms.forEach((p:any) => {
            totalTasks += p.tasks?.length || 0;
            completedTasks += p.tasks?.filter((t:any) => t.isDone).length || 0;
         });
         const completionRate = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;
         context += `       * Genel Program Tamamlanma Oranı: %${completionRate} (${completedTasks}/${totalTasks} görev)\n`;
      } else {
         context += `   - Henüz program verisi yok.\n`;
      }

      // 5, 6, 7. Sınav Sonuçları, Sınav Analizleri ve Derin Analiz
      context += `   --- SINAV SONUÇLARI VE DERİN ANALİZ ---\n`;
      if (data.exams && data.exams.length > 0) {
         context += `   - Toplam ${data.exams.length} sınav sonucu kayıtlı.\n`;
         data.exams.slice(0, 3).forEach((e:any) => {
            context += `       * ${e.examName || e.title}: ${e.totalNet || e.net || 0} Net (${e.date || ''})\n`;
         });
      } else {
         context += `   - Kayıtlı sınav sonucu yok.\n`;
      }

      if (data.examAnalyses && data.examAnalyses.length > 0) {
         context += `   - Sınav Hata Analizleri (Derin Analiz Verisi):\n`;
         data.examAnalyses.slice(0, 3).forEach((a: any) => {
           if (a.data && Object.keys(a.data).length > 0) {
              const errorsByTopic: Record<string, string[]> = {};
              Object.values(a.data).forEach((questions: any) => {
                  if (Array.isArray(questions)) {
                      questions.forEach(q => {
                           if (q.errorType && q.errorType !== 'none') {
                               const topicName = q.topic || 'Bilinmeyen Konu';
                               if (!errorsByTopic[topicName]) { errorsByTopic[topicName] = []; }
                               errorsByTopic[topicName].push(q.errorType);
                           }
                      });
                  }
              });
              if (Object.keys(errorsByTopic).length > 0) {
                  context += `       * ${a.examTitle || 'Sınav'}: Hatalı Konular -> ${Object.keys(errorsByTopic).join(', ')}\n`;
              }
           }
         });
      }
      
      context += '\n';
    });
    
    context += "\nYukarıdaki verilere dayanarak koça, öğrencilerinin genel durumu, sınav sonuçları, kitap tamamlama oranları, program sadakati, derin analizleri ve koça olan ödemeleri dâhil tüm verileri hakkında kapsamlı bir öneri ve rehberlik sunabilirsin. Tüm bu verileri akıcı, anlaşılır ve eyleme geçirilebilir (actionable) şekilde yorumla.";
    return context;
  };

  const handleSendMessage = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!input.trim() || loading || !studentsLoaded) return;

    const userMessage = input.trim();
    setInput('');
    
    const newMessagesForUser = [...messages, { role: 'user' as const, content: userMessage }];
    setMessages(newMessagesForUser);
    saveChatHistory(newMessagesForUser);
    
    setLoading(true);

    try {
      const systemInstruction = `Sen "ON Asistan" adlı yapay zeka eğitim ve koçluk asistanısın. 
Bir koçla konuşuyorsun. 
Koçun adı: ${userData?.firstName || 'Koç'}.
${generateContext()}
Sen profesyonel, yapıcı ve koça destek olan bir karaktersin. Analizlerini yaparken öğrenci bazlı verileri (Kitap Takibi, Randevular, Haftalık Program, Sınav Sonuçları, Deneme Sınavı Analizleri, Derin Analiz, Öğrenci Profili, Hedefler & Takip, Öğrencinin Koça Olan Cüzdan Ödemeleri vb.) mutlaka göz önünde bulundur ve detaylandır.`;

      const res = await fetch('/api/coach-assistant', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          systemInstruction,
          messages: newMessagesForUser.map(m => ({
            role: m.role,
            content: m.content
          }))
        })
      });

      if (!res.ok) {
        throw new Error(await res.text() || 'Asistan yanıt veremedi.');
      }

      const resJson = await res.json();
      const responseText = resJson.text;
      
      if (responseText) {
          const newMessagesForAssistant = [...newMessagesForUser, { role: 'assistant' as const, content: responseText }];
          setMessages(newMessagesForAssistant);
          saveChatHistory(newMessagesForAssistant);
      } else {
         throw new Error("Empty response");
      }

    } catch (error) {
      console.error("AI Error:", error);
      setMessages(prev => [
        ...prev, 
        { role: 'assistant', content: "Üzgünüm, şu anda yanıt veremiyorum. Lütfen teknik ekiple iletişime geçin veya API anahtarınızı kontrol edin." }
      ]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full max-w-6xl mx-auto flex flex-col h-[calc(100vh-64px)] animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 pb-6 shrink-0">
        <motion.div 
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className="space-y-2"
        >
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-[10px] font-black uppercase tracking-widest mb-1">
            <Sparkles size={12} />
            Yapay Zeka Asistanı
          </div>
          <h1 className="text-3xl md:text-4xl font-black tracking-tight text-white">
            ON Asistan
          </h1>
          <p className="text-slate-400 font-medium max-w-xl text-sm">
            Tüm sınıf ve öğrenci verilerinizle desteklenen yapay zeka asistanınız. İleride sistem içi bildirimler ve hatırlatmalar planlayabileceksiniz.
          </p>
        </motion.div>
        
        {studentsLoaded && (
            <div className="flex items-center gap-2 px-4 py-2 rounded-2xl bg-white/5 border border-white/10 text-xs font-bold text-slate-300">
              <Users size={16} className="text-indigo-400" />
              {students.length} Öğrenci Bağlı
            </div>
        )}
      </div>

      <div className="flex-1 min-h-0 bg-slate-900/50 backdrop-blur-md border border-white/5 rounded-[32px] overflow-hidden flex flex-col shadow-2xl shadow-indigo-500/5">
        {/* Chat Messages */}
        <div className="flex-1 overflow-y-auto p-4 md:p-8 space-y-6 custom-scrollbar">
          {messages.map((message, index) => (
            <div 
              key={index} 
              className={`flex gap-4 ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              {message.role === 'assistant' && (
                <div className="w-10 h-10 rounded-2xl bg-indigo-500/20 border border-indigo-500/30 flex items-center justify-center text-indigo-400 shrink-0">
                  <Bot size={20} />
                </div>
              )}
              
              <div 
                className={`max-w-[80%] rounded-2xl p-4 md:p-5 ${
                  message.role === 'user' 
                    ? 'bg-indigo-600 text-white rounded-tr-none' 
                    : 'bg-white/5 border border-white/10 text-slate-300 rounded-tl-none'
                }`}
              >
                <div className="whitespace-pre-wrap text-sm leading-relaxed">
                  {message.content}
                </div>
              </div>

              {message.role === 'user' && (
                <div className="w-10 h-10 rounded-2xl bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center text-emerald-400 shrink-0">
                  <User size={20} />
                </div>
              )}
            </div>
          ))}
          {loading && (
            <div className="flex gap-4 justify-start">
               <div className="w-10 h-10 rounded-2xl bg-indigo-500/20 border border-indigo-500/30 flex items-center justify-center text-indigo-400 shrink-0">
                  <Bot size={20} />
                </div>
                <div className="max-w-[80%] rounded-2xl p-4 md:p-5 bg-white/5 border border-white/10 text-slate-300 rounded-tl-none flex items-center gap-2">
                   <div className="w-2 h-2 bg-indigo-500 rounded-full animate-bounce [animation-delay:-0.3s]"></div>
                   <div className="w-2 h-2 bg-indigo-500 rounded-full animate-bounce [animation-delay:-0.15s]"></div>
                   <div className="w-2 h-2 bg-indigo-500 rounded-full animate-bounce"></div>
                </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input Area */}
        <div className="p-4 md:p-6 bg-slate-950/50 border-t border-white/5 backdrop-blur-xl shrink-0">
          <div className="mb-4 flex items-center gap-2 text-[10px] uppercase font-black tracking-widest text-emerald-400 bg-emerald-500/10 w-fit px-3 py-1 rounded-full border border-emerald-500/20">
             <MessageCircle size={12} />
             Sistem İçi Bildirim ve Mesajlaşma
          </div>
          <form onSubmit={handleSendMessage} className="relative flex items-center">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Asistana bir soru sorun veya talimat verin..."
              disabled={loading || !studentsLoaded}
              className="w-full bg-white/5 border border-white/10 rounded-2xl pl-5 pr-14 py-4 text-white placeholder:text-slate-500 focus:outline-none focus:border-indigo-500/50 focus:ring-1 focus:ring-indigo-500/50 transition-all disabled:opacity-50"
            />
            <button
              type="submit"
              disabled={!input.trim() || loading || !studentsLoaded}
              className="absolute right-2 p-2.5 bg-indigo-600 hover:bg-indigo-500 disabled:bg-slate-800 disabled:text-slate-500 text-white rounded-xl transition-colors"
            >
              {loading ? <Loader2 size={18} className="animate-spin" /> : <Send size={18} />}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
