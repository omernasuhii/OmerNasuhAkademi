import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useStudent } from '../../lib/StudentContext';
import { useAuth } from '../../lib/AuthContext';
import { tourService } from '../../services/tourService';
import { studentDataService } from '../../services/studentDataService';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { Bot, User, UserSquare2, MessageSquare, Loader2 } from 'lucide-react';
import { motion } from 'motion/react';
import ReactMarkdown from 'react-markdown';
import { OnboardingTour, TourStep } from '../../components/OnboardingTour';
import NoStudentSelected from '../../components/NoStudentSelected';
import { SAMPLE_DEMO_STUDENT } from './CoachStudents';

interface Message {
  role: 'user' | 'model' | 'system';
  content: string;
  timestamp?: number;
}

const DEMO_STUDENT_MESSAGES: Message[] = [
  {
    role: 'user',
    content: 'Merhaba! 12. Sınıf TYT Matematik problemlerinde zaman sorunu yaşıyorum. Süre tutarak çözmeme rağmen soru başına 3 dakikanın altına düşemiyorum. Nereden başlamalıyım?'
  },
  {
    role: 'model',
    content: 'Harika bir soru! TYT Problemlerde hız kazanmak için izlemen gereken 3 stratejik adım:\n\n1. **Günün İlk 30 Dakikası Problem Rutini:** Her gün 15-20 soru süre baskısı olmadan ama odaklı çözülmeli.\n2. **Kelimeleri Denkleme Hızlı Çevirme:** Metni baştan sona okumak yerine, okurken eşzamanlı değişken tanımla (ör. `Ahmet = x`, `Mehmet = x + 4`).\n3. **Seçeneklerden Gitme & Tahmin Etme:** Bazı yaş ve yüzde problemlerinde şıkları denemek denklem kurmaktan 2 kat hızlıdır.\n\nKoçunla haftalık programında bu stratejiyi detaylandırabilirsiniz!'
  },
  {
    role: 'user',
    content: 'Çok teşekkürler! Kimya dersinde "Kimyasal Türler Arası Etkileşimler" konusunu da haftalık programa ekleyebilir miyiz?'
  },
  {
    role: 'model',
    content: 'Kesinlikle! "Kimyasal Türler Arası Etkileşimler" konusunu haftalık çalışma rutininde soru çözümü ve özet tekrarı olarak planlamanı önemle tavsiye ederim. Birebir koçluk görüşmende bu tavsiyeyi rehber koçunla paylaşarak haftalık programına dahil ettirebilirsin.'
  }
];

const DEMO_PARENT_MESSAGES: Message[] = [
  {
    role: 'user',
    content: 'İyi günler, öğrencimin bu ayki deneme sınavı netleri ve çalışma disiplini hakkında özet bilgi alabilir miyim?'
  },
  {
    role: 'model',
    content: 'Sayın Velimiz, merhaba! Öğrencinizin son 1 aydaki gelişim özeti şu şekildedir:\n\n- **TYT Net Artışı:** Son 3 denemede ortalama +7.2 net artış kaydedilmiştir.\n- **Çalışma Programına Uyum:** Haftalık 28 saatlik hedefin %94\'ü başarıyla tamamlanmıştır.\n- **Güçlü Alanlar:** Türkçe ve Matematik netlerinde belirgin istikrar sağlanmıştır.\n- **Geliştirilecek Alan:** Fizik "Kuvvet ve Hareket" konusuna ek soru çözümü planlanmıştır.\n\nRehber koçunuz da bu verileri yakından takip etmekte ve haftalık görüşmelerde değerlendirmektedir.'
  }
];

const isValidDisplayMessage = (m: any): boolean => {
  if (!m) return false;
  if (m.role !== 'user' && m.role !== 'model') return false;
  if (m.functionCalls || m.functionCall || m.functionResponse || m.name) return false;
  if (typeof m.content !== 'string' || !m.content.trim()) return false;
  return true;
};

export default function StudentAIChats() {
  const navigate = useNavigate();
  const location = useLocation();
  const { selectedStudent, setSelectedStudent } = useStudent();
  const { user, userData } = useAuth();
  const [activeTab, setActiveTab] = useState<'student' | 'parent'>('student');
  const [studentMessages, setStudentMessages] = useState<Message[]>([]);
  const [parentMessages, setParentMessages] = useState<Message[]>([]);
  const [parentExists, setParentExists] = useState(false);
  const [parentId, setParentId] = useState<string | null>(null);
  
  const [studentLastViewedCount, setStudentLastViewedCount] = useState<number>(0);
  const [parentLastViewedCount, setParentLastViewedCount] = useState<number>(0);
  
  const [isLoading, setIsLoading] = useState(true);
  const [isTourOpen, setIsTourOpen] = useState(false);

  const activeStudent = selectedStudent || (location.state?.startTour || location.state?.isDemo ? SAMPLE_DEMO_STUDENT : null);

  useEffect(() => {
    if (!selectedStudent && (location.state?.startTour || location.state?.isDemo)) {
      setSelectedStudent(SAMPLE_DEMO_STUDENT);
    }
  }, [selectedStudent, setSelectedStudent, location.state]);

  useEffect(() => {
    if (tourService.shouldAutoStartTour('student_ai_chats', userData, location.state?.startTour)) {
      const timer = setTimeout(() => {
        setIsTourOpen(true);
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [location.state, userData]);

  const handleEndTour = () => {
    setIsTourOpen(false);
    tourService.markTourCompleted('student_ai_chats', user?.uid);
  };

  const tourSteps: TourStep[] = [
    {
      targetId: 'tour-ai-chats-header',
      title: 'Yapay Zeka Sohbet Takip Merkezi',
      description: `${activeStudent?.displayName || 'Seçili öğrenci'} ve velisinin yapay zeka asistanı ile gerçekleştirdiği tüm diyalogları ve rehberlik etkileşimlerini rehber koç olarak buradan anlık takip edebilirsiniz.`,
      position: 'bottom'
    },
    {
      targetId: 'tour-ai-chats-tabs',
      title: 'Öğrenci & Veli Sohbet Sekmeleri',
      description: 'Öğrencinin ders, soru çözümü ve rehberlik konularında yapay zekaya sorduğu soruları görmek için "Öğrenci Sohbeti"; velinin öğrenci gelişimi, deneme netleri ve tavsiyeler hakkında AI asistanı ile iletişimini görmek için "Veli Sohbeti" sekmesini kullanabilirsiniz.',
      position: 'bottom'
    },
    {
      targetId: 'tour-ai-chats-container',
      title: 'Diyalog Akışı & Rehberlik Girdileri',
      description: 'Yapılan sohbetler ve yapay zekanın sunduğu çalışma tavsiyeleri burada kronolojik olarak görüntülenir. Yeni mesajlar belirgin ayraçla vurgulanır. Birebir koçluk görüşmelerinizde bu verileri rehberlik girdisi olarak değerlendirebilirsiniz.',
      position: 'top'
    }
  ];

  const handleStepChange = (stepIndex: number, currentStep: TourStep) => {
    if (currentStep.title.includes('Öğrenci & Veli')) {
      setActiveTab('parent');
      setTimeout(() => scrollToBottom(true), 100);
    } else {
      setActiveTab('student');
      setTimeout(() => scrollToBottom(true), 100);
    }
  };

  const chatContainerRef = useRef<HTMLDivElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = (smooth = false) => {
    if (chatContainerRef.current) {
      if (smooth) {
        chatContainerRef.current.scrollTo({ top: chatContainerRef.current.scrollHeight, behavior: 'smooth' });
      } else {
        chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
      }
    }
  };

  useEffect(() => {
    const studentUid = activeStudent?.uid || 'demo-student-uid';

    const loadData = async () => {
      setIsLoading(true);
      try {
        let sMessages: Message[] = [];
        let sLastViewed = 0;

        if (activeStudent?.uid && user?.uid) {
          const sMessagesRaw = await studentDataService.getAIAssistantChatHistory(activeStudent.uid);
          sMessages = sMessagesRaw.filter(isValidDisplayMessage);
          sLastViewed = await studentDataService.getCoachAIChatViewCount(user.uid, activeStudent.uid);
        }

        if (sMessages.length === 0 && isTourOpen) {
          sMessages = DEMO_STUDENT_MESSAGES;
        }
        
        setStudentMessages(sMessages);
        setStudentLastViewedCount(sLastViewed);

        let pMessages: Message[] = [];
        let pLastViewed = 0;
        let hasParent = false;

        if (activeStudent?.uid) {
          const usersRef = collection(db, 'users');
          const qParent = query(usersRef, where('role', '==', 'parent'), where('studentUid', '==', activeStudent.uid));
          const parentSnap = await getDocs(qParent);
          
          if (!parentSnap.empty) {
            hasParent = true;
            const pId = parentSnap.docs[0].id;
            setParentId(pId);
            
            const pMessagesRaw = await studentDataService.getParentAIAssistantChatHistory(pId);
            pMessages = pMessagesRaw.filter(isValidDisplayMessage);
            if (user?.uid) {
              pLastViewed = await studentDataService.getCoachAIChatViewCount(user.uid, pId);
              if (pMessages.length > pLastViewed) {
                await studentDataService.updateCoachAIChatViewCount(user.uid, pId, pMessages.length);
              }
            }
          }
        }

        if (pMessages.length === 0 && isTourOpen) {
          pMessages = DEMO_PARENT_MESSAGES;
          hasParent = true;
        }

        setParentExists(hasParent);
        setParentMessages(pMessages);
        setParentLastViewedCount(pLastViewed);

        if (user?.uid && activeStudent?.uid && sMessages.length > sLastViewed) {
          await studentDataService.updateCoachAIChatViewCount(user.uid, activeStudent.uid, sMessages.length);
        }

      } catch (err) {
        console.error('Error loading AI chats:', err);
        if (isTourOpen) {
          setStudentMessages(DEMO_STUDENT_MESSAGES);
          setParentMessages(DEMO_PARENT_MESSAGES);
          setParentExists(true);
        }
      } finally {
        setIsLoading(false);
      }
    };

    loadData();
  }, [activeStudent?.uid, user?.uid]);

  const messagesToDisplay = activeTab === 'student' ? studentMessages : parentMessages;
  const lastViewedCount = activeTab === 'student' ? studentLastViewedCount : parentLastViewedCount;

  // Auto-scroll to bottom when messages load or active tab changes
  useEffect(() => {
    if (!isLoading) {
      const timer = setTimeout(() => {
        scrollToBottom(true);
      }, 50);
      return () => clearTimeout(timer);
    }
  }, [isLoading, activeTab, messagesToDisplay.length]);

  // Render a chat message
  const renderMessage = (msg: Message, isNewSession = false, idx: number) => {
    if (!msg || typeof msg.content !== 'string' || !msg.content.trim()) return null;
    const isModel = msg.role === 'model';
    return (
      <div key={`msg-${idx}`} className="w-full">
        {isNewSession && (
          <div className="flex items-center gap-4 my-6">
            <div className="flex-1 h-px bg-emerald-500/30"></div>
            <div className="text-xs font-bold text-emerald-400 bg-emerald-500/10 px-3 py-1 rounded-full border border-emerald-500/20">
              Yeni Mesajlar
            </div>
            <div className="flex-1 h-px bg-emerald-500/30"></div>
          </div>
        )}
        <div className={`flex w-full ${isModel ? 'justify-start' : 'justify-end'} mb-4`}>
          <div className={`flex gap-3 max-w-[85%] ${isModel ? 'flex-row' : 'flex-row-reverse'}`}>
            <div className={`w-8 h-8 rounded-xl shrink-0 flex items-center justify-center ${
              isModel ? 'bg-indigo-500/20 text-indigo-400' : 'bg-slate-700/50 text-slate-300'
            }`}>
              {isModel ? <Bot size={18} /> : (activeTab === 'student' ? <User size={18} /> : <UserSquare2 size={18} />)}
            </div>
            <div className={`p-4 rounded-2xl ${
              isModel ? 'bg-slate-800/80 text-slate-200 border border-white/5 rounded-tl-none' 
                      : 'bg-indigo-600 text-white rounded-tr-none'
            }`}>
              <div className="prose prose-invert prose-p:leading-relaxed prose-pre:bg-slate-900 prose-pre:border prose-pre:border-white/10 prose-sm max-w-none">
                <ReactMarkdown>
                  {msg.content || ''}
                </ReactMarkdown>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  // Process messages to inject "Yeni Mesajlar" divider
  const renderMessageList = () => {
    return messagesToDisplay.map((msg, idx) => {
      const isNewSession = idx === lastViewedCount && lastViewedCount > 0 && lastViewedCount < messagesToDisplay.length;
      return renderMessage(msg, isNewSession, idx);
    });
  };

  if (isLoading) {
    return (
      <div className="h-full flex items-center justify-center min-h-[300px]">
        <Loader2 className="w-8 h-8 animate-spin text-emerald-500" />
      </div>
    );
  }

  if (!activeStudent) {
    return <NoStudentSelected />;
  }

  return (
    <div className="flex-1 max-w-5xl mx-auto w-full flex flex-col h-[calc(100vh-6rem)] lg:h-[calc(100vh-3.5rem)] min-h-0">
      <OnboardingTour
        steps={tourSteps}
        isOpen={isTourOpen}
        onClose={handleEndTour}
        onComplete={handleEndTour}
        onNextTour={() => {
          setIsTourOpen(false);
          tourService.markTourCompleted('student_ai_chats', user?.uid);
          navigate('/panel/koc/ogrenci/profil', { state: { startTour: true, isDemo: true } });
        }}
        nextTourLabel="Öğrenci Profili Turu"
        tourKey="student_ai_chats"
        onStepChange={handleStepChange}
      />

      <header id="tour-ai-chats-header" className="mb-4 shrink-0">
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
          <div className="flex items-center gap-3 mb-1">
            <div className="bg-indigo-500/10 p-2 rounded-lg border border-indigo-500/20">
              <Bot className="text-indigo-400" size={22} />
            </div>
            <h1 className="text-xl lg:text-2xl font-bold text-white tracking-tight">Yapay Zeka Sohbetleri</h1>
          </div>
          <p className="text-slate-400 text-xs lg:text-sm">
            {activeStudent?.displayName || 'Seçili öğrenci'} kullanıcısının ve velisinin yapay zeka ile gerçekleştirdiği geçmiş sohbetleri inceleyin.
          </p>
        </motion.div>
      </header>

      {/* Tabs */}
      <div id="tour-ai-chats-tabs" className="flex bg-slate-900/50 p-1.5 rounded-xl border border-white/5 shrink-0 mb-4 w-fit">
        <button
          onClick={() => {
            setActiveTab('student');
            setTimeout(() => scrollToBottom(true), 50);
          }}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs lg:text-sm font-bold transition-all ${
            activeTab === 'student' ? 'bg-indigo-500 text-white shadow-lg' : 'text-slate-400 hover:text-white hover:bg-white/5'
          }`}
        >
          <User size={16} />
          Öğrenci Sohbeti
        </button>
        {parentExists && (
          <button
            onClick={() => {
              setActiveTab('parent');
              setTimeout(() => scrollToBottom(true), 50);
            }}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs lg:text-sm font-bold transition-all ${
              activeTab === 'parent' ? 'bg-indigo-500 text-white shadow-lg' : 'text-slate-400 hover:text-white hover:bg-white/5'
            }`}
          >
            <UserSquare2 size={16} />
            Veli Sohbeti
          </button>
        )}
      </div>

      {/* Chat Area */}
      <div 
        id="tour-ai-chats-container"
        ref={chatContainerRef}
        data-no-auto-scroll-top="true"
        className="flex-1 min-h-0 overflow-y-auto bg-slate-900/40 border border-white/5 rounded-3xl p-4 lg:p-6 custom-scrollbar relative"
      >
        {messagesToDisplay.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-slate-500 min-h-[200px]">
            <MessageSquare size={48} className="mb-4 opacity-50" />
            <p className="text-sm font-medium">Henüz bir sohbet geçmişi bulunmuyor.</p>
          </div>
        ) : (
          <div className="flex flex-col gap-2">
            {renderMessageList()}
            <div ref={messagesEndRef} />
          </div>
        )}
      </div>
    </div>
  );
}
