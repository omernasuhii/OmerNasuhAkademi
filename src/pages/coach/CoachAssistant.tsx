import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'motion/react';
import { Bot, Send, User, MessageCircle, Sparkles, AlertCircle, Loader2, Users } from 'lucide-react';
import { useAuth } from '../../lib/AuthContext';
import { collection, query, where, getDocs, doc, getDoc, setDoc } from 'firebase/firestore';
import { db } from '../../lib/firebase';

import { studentDataService } from '../../services/studentDataService';
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
        
        // Fetch additional data for context
        const [books, exams, analyses, appointments, goals, programs] = await Promise.all([
          studentDataService.getBookTracking(uid),
          studentDataService.getExamResults(uid),
          studentDataService.getStudentAnalyses(uid),
          appointmentService.getAppointments(uid, 'student'),
          studentDataService.getMonthlyGoal(uid, new Date().toISOString().substring(0, 7)),
          studentDataService.getAllDailyPrograms(uid)
        ]);

        return { 
          uid, 
          ...studentData,
          displayName,
          summaryData: {
            bookCount: books.length,
            recentExams: exams.slice(0, 3),
            examAnalyses: analyses,
            upcomingAppointments: appointments.filter(a => a.status === 'confirmed').slice(0, 3),
            currentGoal: goals,
            walletBalance: studentData.walletBalance || 0,
            allPrograms: programs, // All programs for context
            todayProgram: programs.find(p => p.date === new Date().toISOString().split('T')[0])
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

    let context = "Koçun Yetkisi Altındaki Öğrenciler ve Detaylı Durumları (Kitap Takibi, Randevular, Tüm Günlerin Programı, Deneme Analizleri, Hedefler ve Öğrencinin Koça Olan Cüzdan Ödemeleri):\n\n";
    students.forEach((s, idx) => {
      const data = s.summaryData;
      context += `${idx + 1}. ${s.displayName}:\n`;
      context += `   - Profil: ${s.grade || 'Belirtilmemiş'} / ${s.branch || 'Belirtilmemiş'}\n`;
      context += `   - Kitap Takibi: ${data.bookCount} kitap sistemde kayıtlı.\n`;
      context += `   - Sınav Sonuçları & Detaylı Deneme Analizi: ${data.recentExams.map((e: any) => `${e.examName || e.title || 'İsimsiz Sınav'}: ${e.totalNet || e.net || 0} Toplam Net` + (e.scores ? " [Detaylar: " + Object.entries(e.scores).map(([subj, val]: any) => `${subj}= D:${val.c || 0} Y:${val.i || 0} N:${val.n || 0}`).join(' | ') + "]" : "")).join(' || ') || 'Henüz sınav verisi yok'}\n`;
      
      if (data.examAnalyses && data.examAnalyses.length > 0) {
        context += `   - Konu Bazlı Hata Analizleri:\n`;
        const recentAnalyses = data.examAnalyses.slice(0, 3);
        recentAnalyses.forEach((a: any) => {
           context += `       * Sınav: ${a.examTitle || 'Belirtilmemiş'} (${a.examDate || ''})\n`;
           if (a.data && Object.keys(a.data).length > 0) {
              const errorsByTopic: Record<string, string[]> = {};
              Object.values(a.data).forEach((questions: any) => {
                  if (Array.isArray(questions)) {
                      questions.forEach(q => {
                           if (q.errorType && q.errorType !== 'none') {
                               const topicName = q.topic || 'Bilinmeyen Konu';
                               if (!errorsByTopic[topicName]) {
                                   errorsByTopic[topicName] = [];
                               }
                               errorsByTopic[topicName].push(q.errorType);
                           }
                      });
                  }
              });
              
              if (Object.keys(errorsByTopic).length > 0) {
                  context += `         [Hatalar: ${Object.entries(errorsByTopic).map(([topic, errs]) => {
                      let errStr = topic + " -> ";
                      errStr += errs.map(err => {
                          if (err === 'bilgi') return 'Bilgi Eksikliği';
                          if (err === 'kalip') return 'Soru Kalıp Eksikliği';
                          if (err === 'dikkat') return 'Dikkat Hatası';
                          if (err === 'zaman') return 'Zaman Hatası/Turlama';
                          return err;
                      }).join(', ');
                      return errStr;
                  }).join(' | ')}]\n`;
              } else {
                 context += `         [Bu sınavda kayıtlı hata bulunamadı (Tüm sorular doğru veya boş bırakılmış, ya da hata analizi yapılmamış)]\n`;
              }
           } else {
              context += `         [Kayıtlı veri bulunamadı]\n`;
           }
        });
      } else {
        context += `   - Konu Bazlı Hata Analizleri: Henüz veri yok.\n`;
      }

      context += `   - Koça Olan Ödemeler (Cüzdan): ₺${data.walletBalance} koça ait bakiye/ödeme durumu bulunuyor. (Bu kısım öğrencinin koça olan ödemelerini ifade eder).\n`;
      context += `   - Hedefler & Takip: Aylık Hedef: ${data.currentGoal?.title || 'Belirlenmemiş'}\n`;
      if (data.allPrograms && data.allPrograms.length > 0) {
        context += `   - Tüm Günlerin Programları (Öğrenciye atanan görevler ve tamamlanma durumları):\n`;
        data.allPrograms.forEach((p: any) => {
           const completedAtCount = p.tasks?.filter((t:any) => t.isDone).length || 0;
           const taskCount = p.tasks?.length || 0;
           context += `       * Tarih: ${p.date || p.weekStartDate} -> Görev Sayısı: ${taskCount}, Tamamlanan: ${completedAtCount}\n`;
           
           if (p.tasks && p.tasks.length > 0) {
              context += `         [Görevlerin Detayları: ${p.tasks.map((t:any) => `${t.subject || ''} - ${t.topic || ''} (${t.type || ''}): ${t.isDone ? 'Tamamlandı' : 'Bekliyor'} (Hedef:${t.targetCount||0}, Çözülen/İzlenen:${t.completedCount||0})`).join(', ')}]\n`;
           }
        });
      } else {
        context += `   - Tüm Günlerin Programları: Henüz öğrenciye atanmış bir program bulunmuyor.\n`;
      }
      context += `   - Randevular: Yakın zamanda planlanan görüşme sayısı: ${data.upcomingAppointments?.length || 0}\n`;
      context += '\n';
    });
    
    context += "\nYukarıdaki verilere dayanarak koça öğrencileri hakkında derin analizler (Derin Analiz) sunabilir, deneme analizlerini kıyaslayabilir, tüm günlerin programını değerlendirebilir ve öğrencinin koça olan ödemeleri dâhil tüm verileri hakkında koça rehberlik yapabilirsin. Gerekirse RAG destekli bilgi çıkarımı yaparak tüm bu verileri akıcı ve yönlendirici bir şekilde sunmalısın.";
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
        { role: 'assistant', content: "Üzgünüm, şu anda yanıt veremiyorum. Lütfen teknik ekiple iletişime geçin veya API anahtarınızı kontrol edin. (İleride WhatsApp entegrasyonu sağlandığında daha kesintisiz hizmet alabileceksiniz.)" }
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
            Tüm sınıf ve öğrenci verilerinizle desteklenen yapay zeka asistanınız. İleride WhatsApp üzerinden bildirimler ve hatırlatmalar planlayabileceksiniz.
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
             WhatsApp Entegrasyonu (Yakında)
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
