import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Send, Brain, User, Loader2, Sparkles, AlertCircle } from 'lucide-react';
import { useAuth } from '../../lib/AuthContext';
import { useStudent } from '../../lib/StudentContext';
import ReactMarkdown from 'react-markdown';
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
}

export default function ParentAssistant() {
  const { user, userData } = useAuth();
  const { selectedStudent } = useStudent();
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 'greeting',
      role: 'model',
      content: 'Merhaba! Ben FocusON Akademi Veli Asistanı. Öğrencinizin gelişimi, çalışma programı, deneme sınavı sonuçları ve kişilik analizleri hakkında sorularınızı yanıtlamak, size tavsiyelerde bulunmak için buradayım.'
    }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const chatContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
    }
  }, [messages, isLoading]);

  const generateId = () => Date.now().toString() + Math.random().toString(36).substring(2, 9);

  useEffect(() => {
    const fetchHistory = async () => {
      if (user?.uid) {
        try {
          const history = await studentDataService.getParentAIAssistantChatHistory(user.uid);
          if (history && history.length > 0) {
            setMessages(history);
          }
        } catch (e) {
          console.error("Geçmiş sohbetler yüklenirken hata oluştu");
        }
      }
    };
    fetchHistory();
  }, [user?.uid, selectedStudent]);

  useEffect(() => {
    if (user?.uid && messages.length > 1) {
        const cleanMessages = JSON.parse(JSON.stringify(messages));
        studentDataService.saveParentAIAssistantChatHistory(user.uid, cleanMessages);
    }
  }, [messages, user?.uid]);

  const fetchStudentData = async (studentId: string, args?: any) => {
    try {
      const dataTypes = (args?.dataTypes || []) as string[];
      const timeRangeDays = args?.timeRangeDays ? Number(args.timeRangeDays) : null;
      const limitCount = args?.limit ? Number(args.limit) : null;

      const fetchAll = dataTypes.length === 0;
      const shouldFetchPrograms = fetchAll || dataTypes.includes('programs');
      const shouldFetchBooks = fetchAll || dataTypes.includes('books');
      const shouldFetchExams = fetchAll || dataTypes.includes('exams');
      const shouldFetchPersonality = fetchAll || dataTypes.includes('personality');
      const shouldFetchCaba = fetchAll || dataTypes.includes('caba');

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

      const [programsRaw, tasksRaw, booksRaw, examsRaw, profilesRaw, analysesRaw, cabaTestResultRaw] = await Promise.all([
        shouldFetchPrograms ? studentDataService.getWeeklyPrograms(studentId) : Promise.resolve([]),
        shouldFetchPrograms ? studentDataService.getAllDailyPrograms(studentId) : Promise.resolve([]),
        shouldFetchBooks ? studentDataService.getBookTracking(studentId) : Promise.resolve([]),
        shouldFetchExams ? studentDataService.getExamResults(studentId) : Promise.resolve([]),
        studentDataService.getStudentProfile(studentId), // Profile is always useful for basic context
        shouldFetchPersonality ? analysisService.getResults(studentId).then(res => res.filter((r: any) => !['PARENT_REPORT', 'COACH_REPORT'].includes(r.analysisType))) : Promise.resolve([]),
        shouldFetchCaba ? studentDataService.getCabaTestResult(studentId) : Promise.resolve(null)
      ]);

      // Filter and limit collections
      let programs = programsRaw || [];
      if (cutoffDate) {
        programs = programs.filter((p: any) => isWithinTimeRange(p.weekStartDate || p.createdAt));
      }
      if (limitCount !== null) {
        programs = programs.slice(0, limitCount);
      }

      let tasks = tasksRaw || [];
      if (cutoffDate) {
        tasks = tasks.filter((t: any) => isWithinTimeRange(t.date || t.createdAt));
      }
      if (limitCount !== null) {
        tasks = tasks.slice(0, limitCount);
      }

      let books = booksRaw || [];
      if (cutoffDate) {
        books = books.filter((b: any) => isWithinTimeRange(b.updatedAt || b.createdAt));
      }
      if (limitCount !== null) {
        books = books.slice(0, limitCount);
      }

      let exams = examsRaw || [];
      if (cutoffDate) {
        exams = exams.filter((e: any) => isWithinTimeRange(e.date));
      }
      if (limitCount !== null) {
        exams = exams.slice(0, limitCount);
      }

      let analyses = analysesRaw || [];
      if (limitCount !== null) {
        analyses = analyses.slice(0, limitCount);
      }

      return {
        programs: shouldFetchPrograms ? programs : undefined,
        tasks: shouldFetchPrograms ? tasks : undefined,
        books: shouldFetchBooks ? books : undefined,
        exams: shouldFetchExams ? exams : undefined,
        profiles: profilesRaw,
        analyses: shouldFetchPersonality ? analyses : undefined,
        cabaTestResult: shouldFetchCaba ? cabaTestResultRaw : undefined
      };
    } catch (e) {
      console.error(e);
      return { error: 'Öğrenci verileri çekilirken bir hata oluştu.' };
    }
  };

  const executeFunction = async (name: string, args: any) => {
    if (name === 'get_student_academic_data') {
      const studentId = selectedStudent?.uid;
      if (!studentId) {
        return { error: "Sisteme tanımlı bir öğrenciniz bulunmuyor." };
      }
      return await fetchStudentData(studentId, args);
    }
    return { error: `Bilinmeyen fonksiyon: ${name}` };
  };

  const handleSubmit = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!input.trim() || isLoading) return;

    const userMessage: Message = {
      id: generateId(),
      role: 'user',
      content: input.trim()
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    try {
      let currentHistory = [...messages, userMessage];
      let done = false;

      while (!done) {
        const response = await fetch('/api/parent-assistant', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            history: currentHistory.map(m => ({
              role: m.role,
              content: m.content,
              functionCalls: m.functionCalls,
              functionResponse: m.functionResponse,
              name: m.name
            })),
            userContext: {
              firstName: userData?.studentName?.split(' ')[0] || '',
              lastName: userData?.studentName?.split(' ').slice(1).join(' ') || '',
            }
          })
        });

        if (!response.ok) throw new Error('API yanıt vermedi');
        
        const data = await response.json();

        if (data.functionCalls && data.functionCalls.length > 0) {
          const functionCallsMessage: Message = {
            id: generateId(),
            role: 'model',
            functionCalls: data.functionCalls
          };
          currentHistory = [...currentHistory, functionCallsMessage];
          setMessages(prev => [...prev, functionCallsMessage]);

          const results = [];
          for (const fc of data.functionCalls) {
             const res = await executeFunction(fc.name, fc.args);
             results.push({ name: fc.name, response: res, id: fc.id });
          }
          
          for (const res of results) {
            const funcResMsg: Message = {
              id: generateId(),
              role: 'function',
              name: res.name,
              functionResponse: res.response
            };
            currentHistory = [...currentHistory, funcResMsg];
            setMessages(prev => [...prev, funcResMsg]);
          }
        } else if (data.text) {
          const modelMessage: Message = {
            id: generateId(),
            role: 'model',
            content: data.text
          };
          setMessages(prev => [...prev, modelMessage]);
          done = true;
        } else {
          done = true;
        }
      }
    } catch (error) {
      console.error("Assistant Error:", error);
      setMessages(prev => [...prev, {
        id: generateId(),
        role: 'model',
        content: 'Üzgünüm, şu an yanıt veremiyorum. Lütfen daha sonra tekrar deneyin.'
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-[calc(100vh-140px)] animate-in fade-in slide-in-from-bottom-4 duration-500 max-w-4xl mx-auto w-full">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
            <div className="bg-indigo-500/20 p-2 rounded-xl border border-indigo-500/30">
            <Sparkles className="text-indigo-400" size={24} />
            </div>
            <div>
            <h1 className="text-2xl font-bold text-white">Veli Asistanı</h1>
            <p className="text-sm text-slate-400">Yapay zeka destekli eğitim asistanınız</p>
            </div>
        </div>
      </div>

      <div className="flex-1 bg-slate-900 border border-slate-700/50 rounded-2xl overflow-hidden flex flex-col shadow-xl">
        <div 
          ref={chatContainerRef}
          data-no-auto-scroll-top="true"
          className="flex-1 overflow-y-auto p-4 md:p-6 space-y-6"
        >
          <AnimatePresence>
            {messages.map((message, idx) => {
              if (message.role === 'function') return null;
              if (message.functionCalls) return null; // We can hide internal function calls from UI

              const isModel = message.role === 'model';

              return (
                <motion.div
                  key={message.id ? `${message.id}-${idx}` : `msg-${idx}`}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={`flex items-start gap-3 md:gap-4 max-w-[85%] ${isModel ? 'mr-auto' : 'ml-auto flex-row-reverse'}`}
                >
                  <div className={`shrink-0 w-8 h-8 rounded-full flex items-center justify-center shadow-lg ${
                    isModel ? 'bg-indigo-500/20 text-indigo-400 border border-indigo-500/30' : 'bg-slate-700 text-slate-300'
                  }`}>
                    {isModel ? <Brain size={18} /> : <User size={18} />}
                  </div>

                  <div className={`p-3 md:p-4 rounded-2xl ${
                    isModel 
                      ? 'bg-slate-800/80 text-slate-300 border border-slate-700/50 rounded-tl-none' 
                      : 'bg-indigo-600 text-white rounded-tr-none shadow-[0_0_15px_rgba(79,70,229,0.2)]'
                  }`}>
                    {message.content && (
                      <div className={`prose ${isModel ? 'prose-invert prose-indigo' : 'prose-invert'} max-w-none text-sm md:text-base`}>
                        <ReactMarkdown>{message.content}</ReactMarkdown>
                      </div>
                    )}
                  </div>
                </motion.div>
              );
            })}
            
            {isLoading && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex items-start gap-4 max-w-[80%]"
              >
                <div className="shrink-0 w-8 h-8 rounded-full bg-indigo-500/20 text-indigo-400 border border-indigo-500/30 flex items-center justify-center">
                  <Brain size={18} />
                </div>
                <div className="bg-slate-800/80 p-4 rounded-2xl rounded-tl-none border border-slate-700/50 flex items-center gap-2 text-slate-400">
                  <Loader2 className="animate-spin" size={16} />
                  <span className="text-sm">Düşünüyor...</span>
                </div>
              </motion.div>
            )}
            <div ref={messagesEndRef} />
          </AnimatePresence>
        </div>

        <div className="p-4 bg-slate-900 border-t border-slate-800">
          <form onSubmit={handleSubmit} className="relative">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Öğrencim hakkında bir şeyler sorun..."
              className="w-full bg-slate-800 text-white placeholder-slate-500 rounded-xl py-4 pl-4 pr-12 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 border border-slate-700/50 transition-all"
              disabled={isLoading}
            />
            <button
              type="submit"
              disabled={!input.trim() || isLoading}
              className="absolute right-2 top-1/2 -translate-y-1/2 p-2 bg-indigo-500 text-white rounded-lg hover:bg-indigo-400 disabled:opacity-50 disabled:hover:bg-indigo-500 transition-colors"
            >
              <Send size={18} />
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
