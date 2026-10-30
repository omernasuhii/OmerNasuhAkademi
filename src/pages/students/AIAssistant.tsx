import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import { Send, Brain, User, Loader2, Sparkles, Check, HelpCircle, Upload, Image, Camera, X, Volume2, VolumeX, Play, Pause, RotateCcw, BookOpen, CheckCircle2, MessageSquare, Gift, History, Filter, Search, Trash2, Calendar, FolderOpen, Tag, ChevronRight, FileText, Layers, Maximize2, AlertTriangle } from 'lucide-react';
import { useAuth } from '../../lib/AuthContext';
import { db } from '../../lib/firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import ReactMarkdown from 'react-markdown';
import { cleanMathText } from '../../utils/cleanMathText';
import { appointmentService, Service } from '../../services/appointmentService';
import { studentDataService } from '../../services/studentDataService';
import { analysisService } from '../../services/analysisService';
import { safeStorage } from '../../lib/localStorage';
import { systemLogger } from '../../services/systemLogger';

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
  // Error handling fields
  isError?: boolean;
  errorCode?: string;
  retryText?: string;
  reportedToSystem?: boolean;
}

async function parseResponseSafely<T = any>(res: Response): Promise<T> {
  const rawText = await res.text();
  try {
    return JSON.parse(rawText) as T;
  } catch (err) {
    console.error("Failed to parse JSON response:", rawText.slice(0, 300));
    const isHtml = rawText.trim().startsWith("<") || rawText.includes("<!DOCTYPE");
    throw new Error(
      isHtml
        ? "Sunucu geçici bir ağ veya ağ geçidi yanıtı döndürdü (HTML)."
        : "Sunucudan geçerli bir JSON yanıtı alınamadı."
    );
  }
}

interface FollowUpMessage {
  id: string;
  sender: 'user' | 'ai';
  text: string;
  timestamp: string;
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
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<'chat' | 'solver'>('chat');

  // Question Limit Calculations (140 per 4-week subscription, 21 questions during Gold Trial period)
  const isTrial = Boolean(userData?.isTrial || userData?.subscriptionStatus === 'trial');
  const planStr = (userData?.subscriptionPlan || userData?.package || '').toLowerCase();
  const isGoldPlan = planStr.includes('altın') || planStr.includes('gold') || planStr.includes('vip') || planStr.includes('zirve') || (!planStr && isTrial); // Default to Gold if in trial without explicit plan string

  // Altın paketin Deneme süresi içerisinde öğrencilerin yapay zeka soru çözüm asistanına sadece 21 soru sorma hakkı olsun.
  const MAX_QUESTIONS_PER_SUB = (isTrial && isGoldPlan) ? 21 : 140;
  const currentQuestionCount = userData?.askedAiQuestionsCount || 0;
  const remainingQuestions = Math.max(0, MAX_QUESTIONS_PER_SUB - currentQuestionCount);
  const isLimitReached = currentQuestionCount >= MAX_QUESTIONS_PER_SUB;

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
    hasValidSingleQuestion?: boolean;
    questionStatus?: 'SINGLE_QUESTION' | 'NO_QUESTION' | 'MULTIPLE_QUESTIONS';
  } | null>(null);
  const [isAudioGenerating, setIsAudioGenerating] = useState(false);
  const [solverError, setSolverError] = useState<string | null>(null);
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const cameraInputRef = useRef<HTMLInputElement | null>(null);

  // Camera Capture States
  const [isCameraModalOpen, setIsCameraModalOpen] = useState(false);
  const [cameraStream, setCameraStream] = useState<MediaStream | null>(null);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);

  // Interactive Follow-Up Chat States (0 Hak - Free Follow-up)
  const [followUpMessages, setFollowUpMessages] = useState<FollowUpMessage[]>([]);
  const [followUpInput, setFollowUpInput] = useState('');
  const [isFollowUpLoading, setIsFollowUpLoading] = useState(false);
  const followUpScrollRef = useRef<HTMLDivElement>(null);

  // Soru Çözüm Geçmişi & Veri Depolama States
  const [solverSubTab, setSolverSubTab] = useState<'solver' | 'history'>('solver');
  const [selectedSubject, setSelectedSubject] = useState<string>('Matematik');
  const [currentQuestionId, setCurrentQuestionId] = useState<string | null>(null);
  const [historyItems, setHistoryItems] = useState<any[]>([]);
  const [historySubjectFilter, setHistorySubjectFilter] = useState<string>('Tümü');
  const [historySearchQuery, setHistorySearchQuery] = useState<string>('');
  const [isHistoryLoading, setIsHistoryLoading] = useState<boolean>(false);

  // Dedicated Detail Modal State for Archived Questions
  const [selectedHistoryDetail, setSelectedHistoryDetail] = useState<any | null>(null);
  const [historyDetailAudioPlaying, setHistoryDetailAudioPlaying] = useState(false);
  const historyDetailAudioRef = useRef<HTMLAudioElement | null>(null);

  const [historyDetailFollowUpInput, setHistoryDetailFollowUpInput] = useState('');
  const [isHistoryDetailFollowUpLoading, setIsHistoryDetailFollowUpLoading] = useState(false);
  const [expandedImage, setExpandedImage] = useState<string | null>(null);

  const SUBJECTS = [
    'Matematik',
    'Geometri',
    'Fizik',
    'Kimya',
    'Biyoloji',
    'Türkçe',
    'Tarih',
    'Coğrafya',
    'Felsefe / Din',
    'Genel'
  ];

  const getSubjectColor = (subj: string) => {
    switch (subj) {
      case 'Matematik': return 'bg-indigo-500/20 text-indigo-300 border-indigo-500/30';
      case 'Geometri': return 'bg-cyan-500/20 text-cyan-300 border-cyan-500/30';
      case 'Fizik': return 'bg-purple-500/20 text-purple-300 border-purple-500/30';
      case 'Kimya': return 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30';
      case 'Biyoloji': return 'bg-teal-500/20 text-teal-300 border-teal-500/30';
      case 'Türkçe': return 'bg-amber-500/20 text-amber-300 border-amber-500/30';
      case 'Tarih': return 'bg-rose-500/20 text-rose-300 border-rose-500/30';
      case 'Coğrafya': return 'bg-yellow-500/20 text-yellow-300 border-yellow-500/30';
      case 'Felsefe / Din': return 'bg-fuchsia-500/20 text-fuchsia-300 border-fuchsia-500/30';
      default: return 'bg-slate-500/20 text-slate-300 border-slate-500/30';
    }
  };

  const loadHistoryItems = async () => {
    if (!user?.uid) return;
    setIsHistoryLoading(true);
    try {
      const items = await studentDataService.getSolvedQuestionHistory(user.uid);
      setHistoryItems(prev => {
        return items.map(newItem => {
          const existing = prev.find(p => p.id === newItem.id);
          if (existing?.solverResult?.audioDataUrl && !newItem.solverResult?.audioDataUrl) {
            return {
              ...newItem,
              solverResult: {
                ...newItem.solverResult,
                audioDataUrl: existing.solverResult.audioDataUrl
              }
            };
          }
          return newItem;
        });
      });
    } catch (err) {
      console.error("Geçmiş sorular yüklenirken hata:", err);
    } finally {
      setIsHistoryLoading(false);
    }
  };

  useEffect(() => {
    if (user?.uid) {
      loadHistoryItems();
    }
  }, [user?.uid]);

  const handleOpenHistoryItem = (item: any) => {
    setSelectedHistoryDetail(item);
    setHistoryDetailAudioPlaying(false);
    setHistoryDetailFollowUpInput('');
  };

  const handleLoadHistoryToSolver = (item: any) => {
    setCurrentQuestionId(item.id);
    setSelectedSubject(item.subject || 'Matematik');
    setQText(item.qText || '');
    setQImagePreview(item.qImagePreview || null);
    setSolverResult(item.solverResult || null);
    setFollowUpMessages(item.followUpMessages || []);
    setSelectedHistoryDetail(null);
    setSolverSubTab('solver');
  };

  const toggleHistoryDetailAudioPlay = () => {
    if (!historyDetailAudioRef.current) return;
    if (historyDetailAudioPlaying) {
      historyDetailAudioRef.current.pause();
      setHistoryDetailAudioPlaying(false);
    } else {
      historyDetailAudioRef.current.play().catch(console.error);
      setHistoryDetailAudioPlaying(true);
    }
  };

  const handleSendHistoryDetailFollowUp = async (textOverride?: string) => {
    if (!selectedHistoryDetail) return;
    if (selectedHistoryDetail.solverResult?.hasValidSingleQuestion === false) return;

    const query = (textOverride || historyDetailFollowUpInput).trim();
    if (!query || isHistoryDetailFollowUpLoading) return;

    const userMsg: FollowUpMessage = {
      id: Date.now().toString(),
      sender: 'user',
      text: query,
      timestamp: new Date().toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' })
    };

    const currentFollowUps = Array.isArray(selectedHistoryDetail.followUpMessages)
      ? selectedHistoryDetail.followUpMessages
      : [];

    const updated = [...currentFollowUps, userMsg];

    setSelectedHistoryDetail((prev: any) => ({
      ...prev,
      followUpMessages: updated
    }));
    setHistoryDetailFollowUpInput('');
    setIsHistoryDetailFollowUpLoading(true);

    try {
      const res = await fetch('/api/student-question-followup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          questionText: selectedHistoryDetail.qText || '',
          originalSolution: selectedHistoryDetail.solverResult?.text || '',
          chatHistory: currentFollowUps,
          userMessage: query,
          studentName: userData?.displayName || userData?.name || 'Öğrenci'
        })
      });

      const data = await parseResponseSafely(res);
      if (data && data.success && data.text) {
        const aiMsg: FollowUpMessage = {
          id: (Date.now() + 1).toString(),
          sender: 'ai',
          text: cleanMathText(data.text),
          timestamp: new Date().toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' })
        };
        const updatedMsgs = [...updated, aiMsg];

        setSelectedHistoryDetail((prev: any) => ({
          ...prev,
          followUpMessages: updatedMsgs
        }));

        if (userData?.uid && selectedHistoryDetail.id) {
          studentDataService.saveSolvedQuestionHistory(userData.uid, {
            ...selectedHistoryDetail,
            followUpMessages: updatedMsgs
          }).then(() => loadHistoryItems()).catch(console.error);
        }
      }
    } catch (err) {
      console.error("History detail followup error:", err);
    } finally {
      setIsHistoryDetailFollowUpLoading(false);
    }
  };

  const handleDeleteHistoryItem = async (e: React.MouseEvent, qId: string) => {
    e.stopPropagation();
    if (!user?.uid) return;
    if (window.confirm("Bu çözülmüş soruyu arşivinizden silmek istediğinize emin misiniz?")) {
      await studentDataService.deleteSolvedQuestionHistory(user.uid, qId);
      setHistoryItems(prev => prev.filter(i => i.id !== qId));
      if (currentQuestionId === qId) {
        handleResetQuestion();
      }
    }
  };

  const filteredHistoryItems = historyItems.filter(item => {
    const matchesSubject = historySubjectFilter === 'Tümü' || (item.subject || 'Genel') === historySubjectFilter;
    const qTextLower = (item.qText || '').toLowerCase();
    const solverTextLower = (item.solverResult?.text || '').toLowerCase();
    const searchLower = historySearchQuery.toLowerCase().trim();
    const matchesSearch = !searchLower || qTextLower.includes(searchLower) || solverTextLower.includes(searchLower);
    return matchesSubject && matchesSearch;
  });

  const generateId = () => Date.now().toString() + Math.random().toString(36).substring(2, 9);

  const compressImageDataUrl = (dataUrl: string, maxDimension = 900, quality = 0.7): Promise<string> => {
    return new Promise((resolve) => {
      if (!dataUrl || !dataUrl.startsWith('data:image')) {
        resolve(dataUrl);
        return;
      }
      const img = new window.Image();
      img.onload = () => {
        let width = img.width;
        let height = img.height;
        if (width > maxDimension || height > maxDimension) {
          if (width > height) {
            height = Math.round((height * maxDimension) / width);
            width = maxDimension;
          } else {
            width = Math.round((width * maxDimension) / height);
            height = maxDimension;
          }
        }
        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.imageSmoothingEnabled = true;
          ctx.imageSmoothingQuality = 'high';
          ctx.drawImage(img, 0, 0, width, height);
          resolve(canvas.toDataURL('image/jpeg', quality));
        } else {
          resolve(dataUrl);
        }
      };
      img.onerror = () => resolve(dataUrl);
      img.src = dataUrl;
    });
  };

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 15 * 1024 * 1024) {
      setSolverError("Görsel boyutu 15MB'dan küçük olmalıdır.");
      return;
    }
    setSolverError(null);
    const reader = new FileReader();
    reader.onload = async (evt) => {
      const resStr = evt.target?.result as string;
      try {
        const compressed = await compressImageDataUrl(resStr, 900, 0.7);
        setQImagePreview(compressed);
        setQImageMime('image/jpeg');
      } catch (err) {
        setQImagePreview(resStr);
        setQImageMime(file.type || 'image/jpeg');
      }
    };
    reader.readAsDataURL(file);
  };

  const handlePasteImage = async (e: React.ClipboardEvent) => {
    const items = e.clipboardData?.items;
    if (!items) return;
    for (let i = 0; i < items.length; i++) {
      if (items[i].type.indexOf('image') !== -1) {
        const file = items[i].getAsFile();
        if (file) {
          e.preventDefault();
          const reader = new FileReader();
          reader.onload = async (evt) => {
            const resStr = evt.target?.result as string;
            try {
              const compressed = await compressImageDataUrl(resStr, 900, 0.7);
              setQImagePreview(compressed);
              setQImageMime('image/jpeg');
            } catch (err) {
              setQImagePreview(resStr);
              setQImageMime('image/jpeg');
            }
          };
          reader.readAsDataURL(file);
          break;
        }
      }
    }
  };

  const handleRemoveImage = () => {
    setQImagePreview(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
    if (cameraInputRef.current) cameraInputRef.current.value = '';
  };

  const openCameraModal = async () => {
    setCameraError(null);
    if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: { ideal: 'environment' }, width: { ideal: 1280 }, height: { ideal: 720 } }
        });
        setCameraStream(stream);
        setIsCameraModalOpen(true);
      } catch (err: any) {
        console.warn("Kamera canlı akışı açılamadı, cihaz kamerası seçeneği tetikleniyor:", err);
        if (cameraInputRef.current) {
          cameraInputRef.current.click();
        } else {
          setSolverError("Kamera erişimi sağlanamadı. Lütfen tarayıcı izinlerini kontrol edin.");
        }
      }
    } else if (cameraInputRef.current) {
      cameraInputRef.current.click();
    } else {
      setSolverError("Cihazınızda kamera desteği bulunamadı.");
    }
  };

  useEffect(() => {
    if (isCameraModalOpen && cameraStream && videoRef.current) {
      videoRef.current.srcObject = cameraStream;
    }
  }, [isCameraModalOpen, cameraStream]);

  const handleCapturePhoto = () => {
    if (!videoRef.current) return;
    const video = videoRef.current;
    const canvas = document.createElement('canvas');
    canvas.width = video.videoWidth || 1280;
    canvas.height = video.videoHeight || 720;
    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
      const dataUrl = canvas.toDataURL('image/jpeg', 0.85);
      compressImageDataUrl(dataUrl, 900, 0.7).then((compressed) => {
        setQImagePreview(compressed);
        setQImageMime('image/jpeg');
        closeCameraModal();
      }).catch(() => {
        setQImagePreview(dataUrl);
        setQImageMime('image/jpeg');
        closeCameraModal();
      });
    }
  };

  const closeCameraModal = () => {
    if (cameraStream) {
      cameraStream.getTracks().forEach(track => track.stop());
      setCameraStream(null);
    }
    setIsCameraModalOpen(false);
    setCameraError(null);
  };

  const handleDropImage = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    const file = e.dataTransfer.files?.[0];
    if (file) {
      if (!file.type.startsWith('image/')) {
        setSolverError("Lütfen geçerli bir resim dosyası seçin.");
        return;
      }
      if (file.size > 12 * 1024 * 1024) {
        setSolverError("Görsel boyutu 12MB'dan küçük olmalıdır.");
        return;
      }
      setSolverError(null);
      const reader = new FileReader();
      reader.onload = async (evt) => {
        const resStr = evt.target?.result as string;
        try {
          const compressed = await compressImageDataUrl(resStr, 900, 0.7);
          setQImagePreview(compressed);
          setQImageMime('image/jpeg');
        } catch (err) {
          setQImagePreview(resStr);
          setQImageMime(file.type || 'image/jpeg');
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSolveQuestion = async () => {
    if (isLimitReached) {
      if (isTrial && isGoldPlan) {
        setSolverError("Altın Paket 7 günlük deneme süresinde tanımlanan 21 soru sorma hakkınızı tamamladınız. Soru sormaya devam edebilmek için lütfen aboneliğinizi başlatın.");
      } else {
        setSolverError(`Abonelik döneminiz boyunca tanımlanan ${MAX_QUESTIONS_PER_SUB} soru sorma hakkınızı tamamladınız. Soru sorabilmek için lütfen aboneliğinizi yenileyin veya paketinizi yükseltin.`);
      }
      return;
    }

    if (!qText.trim() && !qImagePreview) {
      setSolverError("Lütfen bir soru metni yazın veya soru görseli yükleyin.");
      return;
    }

    setIsSolving(true);
    setSolverError(null);
    setSolverResult(null);
    setFollowUpMessages([]);
    setIsPlayingAudio(false);

    try {
      const rawName = userData?.displayName || userData?.name || userData?.firstName || "";
      const studentName = rawName ? rawName.trim().split(' ')[0] : "Öğrenci";
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

      const data = await parseResponseSafely(res);
      if (!res.ok) {
        throw new Error(data.error || "Soru çözümü sırasında bir hata oluştu.");
      }

      const isValidSingleQ = data.hasValidSingleQuestion !== false;
      const formattedText = cleanMathText(data.text);

      setSolverResult({
        text: formattedText,
        audioDataUrl: null,
        hasValidSingleQuestion: isValidSingleQ,
        questionStatus: data.questionStatus || (isValidSingleQ ? 'SINGLE_QUESTION' : 'NO_QUESTION')
      });

      const newQId = Date.now().toString() + Math.random().toString(36).substring(2, 7);
      setCurrentQuestionId(newQId);

      if (userData?.uid) {
        const nextCount = (userData.askedAiQuestionsCount || 0) + 1;
        studentDataService.updateStudentProfile(userData.uid, { askedAiQuestionsCount: nextCount }).catch(console.error);
        studentDataService.awardXP(userData.uid, 5, 'AI Soru Çözümü').catch(console.error);

        studentDataService.saveSolvedQuestionHistory(userData.uid, {
          id: newQId,
          subject: selectedSubject,
          qText: qText.trim(),
          qImagePreview,
          solverResult: {
            text: formattedText,
            audioDataUrl: null,
            hasValidSingleQuestion: isValidSingleQ,
            questionStatus: data.questionStatus
          },
          followUpMessages: []
        }).then(() => loadHistoryItems()).catch(console.error);
      }

      // Sesli çözüm artık otomatik olarak oluşturulmaz. Sadece öğrenci 'Dinle' butonuna basınca talep edilir.

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

  const handlePlayOrGenerateAudio = async () => {
    if (!solverResult || !solverResult.text) return;
    if (solverResult.audioDataUrl) {
      toggleAudioPlay();
      return;
    }

    setIsAudioGenerating(true);
    try {
      const res = await fetch("/api/student-question-audio", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          text: solverResult.text,
          voiceName: selectedVoice
        })
      });
      if (res.ok) {
        const contentType = res.headers.get("content-type");
        if (contentType && contentType.includes("application/json")) {
          const audioData = await res.json();
          if (audioData.audioBase64) {
            const audioUrl = `data:${audioData.audioMimeType || 'audio/wav'};base64,${audioData.audioBase64}`;
            setSolverResult(prev => prev ? { ...prev, audioDataUrl: audioUrl } : null);
            if (userData?.uid && currentQuestionId) {
              studentDataService.saveSolvedQuestionHistory(userData.uid, {
                id: currentQuestionId,
                subject: selectedSubject,
                qText,
                qImagePreview,
                solverResult: {
                  ...solverResult,
                  audioDataUrl: audioUrl
                },
                followUpMessages
              }).catch(console.error);
            }
            setTimeout(() => {
              if (audioRef.current) {
                audioRef.current.play().then(() => setIsPlayingAudio(true)).catch(console.error);
              }
            }, 100);
          }
        }
      } else {
        console.warn("Ses oluşturma başarısız, HTTP status:", res.status);
      }
    } catch (err) {
      console.error("Audio generation failed:", err);
    } finally {
      setIsAudioGenerating(false);
    }
  };

  const handleSendFollowUp = async (textOverride?: string) => {
    if (solverResult?.hasValidSingleQuestion === false) {
      return;
    }
    const query = (textOverride || followUpInput).trim();
    if (!query || isFollowUpLoading) return;

    const userMsg: FollowUpMessage = {
      id: Date.now().toString(),
      sender: 'user',
      text: query,
      timestamp: new Date().toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' })
    };

    const updated = [...followUpMessages, userMsg];
    setFollowUpMessages(updated);
    setFollowUpInput('');
    setIsFollowUpLoading(true);

    try {
      const res = await fetch('/api/student-question-followup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          questionText: qText,
          originalSolution: solverResult?.text || '',
          chatHistory: followUpMessages,
          userMessage: query,
          studentName: (userData?.displayName || userData?.name || userData?.firstName || 'Öğrenci').trim().split(' ')[0]
        })
      });

      const data = await parseResponseSafely(res);
      if (data && data.success && data.text) {
        const aiMsg: FollowUpMessage = {
          id: (Date.now() + 1).toString(),
          sender: 'ai',
          text: cleanMathText(data.text),
          timestamp: new Date().toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' })
        };
        const updatedMsgs = [...updated, aiMsg];
        setFollowUpMessages(updatedMsgs);

        if (userData?.uid && currentQuestionId) {
          studentDataService.saveSolvedQuestionHistory(userData.uid, {
            id: currentQuestionId,
            subject: selectedSubject,
            qText,
            qImagePreview,
            solverResult,
            followUpMessages: updatedMsgs
          }).then(() => loadHistoryItems()).catch(console.error);
        }
      } else {
        const errMsg: FollowUpMessage = {
          id: (Date.now() + 1).toString(),
          sender: 'ai',
          text: 'Açıklama alınırken bir hata oluştu. Lütfen tekrar deneyin.',
          timestamp: new Date().toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' })
        };
        const updatedMsgs = [...updated, errMsg];
        setFollowUpMessages(updatedMsgs);

        if (userData?.uid && currentQuestionId) {
          studentDataService.saveSolvedQuestionHistory(userData.uid, {
            id: currentQuestionId,
            subject: selectedSubject,
            qText,
            qImagePreview,
            solverResult,
            followUpMessages: updatedMsgs
          }).then(() => loadHistoryItems()).catch(console.error);
        }
      }
    } catch (error) {
      console.error("Followup error:", error);
    } finally {
      setIsFollowUpLoading(false);
    }
  };

  const handleResetQuestion = () => {
    setSolverResult(null);
    setQText('');
    setQImagePreview(null);
    setSolverError(null);
    setFollowUpMessages([]);
    setIsPlayingAudio(false);
    if (user?.uid) {
      const localKey = `ai_solver_state_${user.uid}`;
      try { localStorage.removeItem(localKey); } catch (e) {}
      studentDataService.saveAIAssistantSolverState(user.uid, {
        qText: '',
        qImagePreview: null,
        solverResult: null,
        followUpMessages: []
      }).catch(console.error);
    }
  };

  useEffect(() => {
    if (followUpScrollRef.current) {
      followUpScrollRef.current.scrollTop = followUpScrollRef.current.scrollHeight;
    }
  }, [followUpMessages, isFollowUpLoading]);

  // Always start with a fresh new question form when visiting the page
  useEffect(() => {
    if (!user?.uid) return;

    // Reset active solver state for a clean new question input screen
    setQText('');
    setQImagePreview(null);
    setSolverResult(null);
    setFollowUpMessages([]);
    setSolverError(null);
    setCurrentQuestionId(null);
    setIsPlayingAudio(false);

    // Clean up any stale local cached solver state
    const localKey = `ai_solver_state_${user.uid}`;
    try {
      localStorage.removeItem(localKey);
    } catch (e) {}
  }, [user?.uid]);

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
      const availableServices = Array.isArray(s.availableServices) ? s.availableServices : [];
      const filtered = availableServices.filter(srv => srv.type === option.value);
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
      
      const availableCoaches = Array.isArray(s.availableCoaches) ? s.availableCoaches : [];
      const assignedIds = Array.isArray(srv.assignedCoachIds) ? srv.assignedCoachIds : [];
      const filtered = assignedIds.length > 0
        ? availableCoaches.filter(c => assignedIds.includes(c.uid))
        : availableCoaches;
        
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
          
          const safeSlots = Array.isArray(nextAvailableSlotInfo.slots) ? nextAvailableSlotInfo.slots : [];
          const nextOptions = safeSlots.map((h: string) => ({ label: `${nextAvailableSlotInfo.label} - ${h}`, value: h }));
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

  const reportSystemError = async (details: {
    errorCode: string;
    source: string;
    errorMessage: string;
    studentId: string;
    studentName: string;
    lastMessageText: string;
  }) => {
    try {
      await systemLogger.logError({
        source: details.source || 'AIAssistant',
        message: details.errorMessage,
        category: 'ai',
        severity: 'error',
        user: {
          uid: details.studentId,
          name: details.studentName,
          email: user?.email || '',
          role: 'student'
        },
        metadata: {
          errorCode: details.errorCode,
          lastMessageText: details.lastMessageText
        }
      });
    } catch (err) {
      console.warn('SystemLogger reporting caught error:', err);
    }
  };

  const processResponse = async (historyToProcess: Message[]) => {
    const lastUserMsg = [...historyToProcess].reverse().find(m => m.role === 'user');
    const lastUserText = lastUserMsg?.content || '';

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

      const data = await parseResponseSafely(response);

      if (!response.ok || (data && data.error)) {
        throw new Error(data?.error || `Sunucu yanıt veremedi (Durum kodu: ${response.status})`);
      }

      if (data.functionCalls && data.functionCalls.length > 0) {
        let hasWizard = data.functionCalls.some((fc: any) => fc.name === 'start_booking_wizard');
        
        // Temizlenmiş text - gereksiz sistem loglarını gizle
        let cleanText = data.text;
        if (cleanText) {
           cleanText = cleanText.split('\n').filter((line: string) => !line.toLowerCase().includes('sistem:')).join('\n').trim();
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
      console.error('Error in processResponse:', error);
      const errorCode = `ERR-${Date.now().toString(36).toUpperCase()}-${Math.random().toString(36).substring(2, 6).toUpperCase()}`;

      // Sisteme hatayla alakalı bilgi verelim:
      reportSystemError({
        errorCode,
        source: 'AIAssistant.processResponse',
        errorMessage: error?.message || String(error),
        studentId: user?.uid || '',
        studentName: `${userData?.firstName || ''} ${userData?.lastName || ''}`.trim() || 'Öğrenci',
        lastMessageText: lastUserText
      });

      // Kullanıcıdan mesajı tekrar yazmasını isteyelim:
      setMessages(prev => [...prev, {
        id: generateId(),
        role: 'model',
        content: `Üzgünüm, geçici bir bağlantı veya sistemsel yanıt gecikmesi nedeniyle bu mesajınızı işleyemedim.\n\n⚠️ **Lütfen mesajınızı tekrar yazarak gönderebilir misiniz?**`,
        isError: true,
        errorCode,
        retryText: lastUserText,
        reportedToSystem: true
      }]);
    }
  };

  const sendAssistantMessage = async (textToSend: string) => {
    if (!textToSend.trim() || isLoading) return;

    if (wizardState.isActive) {
        setMessages(prev => [...prev, {
            id: generateId(),
            role: 'model',
            content: "Lütfen yukarıdaki menüden bir seçenek işaretleyerek devam et."
        }]);
        setInput('');
        return;
    }

    const currentInput = textToSend.trim();
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

  const handleSend = async () => {
    sendAssistantMessage(input);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className={`flex flex-col w-full max-w-5xl mx-auto rounded-3xl bg-slate-900/50 border border-white/10 shadow-2xl relative ${
      activeTab === 'solver'
        ? 'min-h-[550px]'
        : 'flex-1 h-[calc(100vh-130px)] min-h-[550px] max-h-[850px] overflow-hidden'
    }`}>
      <div className="absolute inset-0 bg-slate-950/40 -z-10 rounded-3xl" />
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
        <div className="p-4 md:p-6 space-y-6 relative">
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
                  onClick={handleResetQuestion}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-bold border border-white/10 flex items-center gap-2 shrink-0 transition-colors cursor-pointer"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Yeni Soru Çöz</span>
                </button>
              )}
            </div>

            {/* Sub-Tab Selector: Soru Çözümü vs Soru Arşivi */}
            <div className="flex bg-slate-950 p-1.5 rounded-2xl border border-white/10 gap-1.5">
              <button
                onClick={() => setSolverSubTab('solver')}
                className={`flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-xl text-xs font-extrabold transition-all cursor-pointer ${
                  solverSubTab === 'solver'
                    ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-lg shadow-indigo-600/30 border border-indigo-400/30'
                    : 'text-slate-400 hover:text-white hover:bg-slate-900'
                }`}
              >
                <HelpCircle className="w-4 h-4" />
                <span>✍️ Yeni Soru Sor & Çöz</span>
              </button>

              <button
                onClick={() => setSolverSubTab('history')}
                className={`flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-xl text-xs font-extrabold transition-all cursor-pointer ${
                  solverSubTab === 'history'
                    ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-lg shadow-indigo-600/30 border border-indigo-400/30'
                    : 'text-slate-400 hover:text-white hover:bg-slate-900'
                }`}
              >
                <History className="w-4 h-4" />
                <span>📚 Soru Arşivi & Çözüm Geçmişi</span>
                <span className="bg-white/20 text-white text-[10px] px-2 py-0.5 rounded-full font-mono font-black">
                  {historyItems.length}
                </span>
              </button>
            </div>

            {solverSubTab === 'history' ? (
              /* HISTORY VIEW */
              <div className="space-y-6">
                {/* Search & Subject Filter Bar */}
                <div className="bg-slate-900/90 border border-white/10 rounded-3xl p-5 md:p-6 space-y-4 shadow-xl">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div>
                      <h4 className="text-sm font-extrabold text-white flex items-center gap-2">
                        <FolderOpen className="w-4 h-4 text-indigo-400" />
                        Çözülmüş Soru Veri Deposu
                      </h4>
                      <p className="text-xs text-slate-400 mt-0.5">
                        Geçmişte çözdürdüğünüz soruları ders bazlı filtreleyin, çözümleri tekrar dinleyin veya takip sohbetine devam edin.
                      </p>
                    </div>
                    <button
                      onClick={loadHistoryItems}
                      disabled={isHistoryLoading}
                      className="px-3.5 py-2 bg-slate-950 hover:bg-slate-800 text-slate-300 border border-white/10 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 self-start sm:self-auto cursor-pointer"
                    >
                      <RotateCcw className={`w-3.5 h-3.5 ${isHistoryLoading ? 'animate-spin' : ''}`} />
                      <span>Yenile</span>
                    </button>
                  </div>

                  {/* Search Input */}
                  <div className="relative">
                    <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      value={historySearchQuery}
                      onChange={(e) => setHistorySearchQuery(e.target.value)}
                      placeholder="Soru metni veya çözüm içerisinde ara..."
                      className="w-full bg-slate-950 border border-white/10 focus:border-indigo-500/50 rounded-2xl pl-10 pr-4 py-2.5 text-xs text-slate-200 placeholder:text-slate-500 outline-none transition-colors"
                    />
                    {historySearchQuery && (
                      <button
                        onClick={() => setHistorySearchQuery('')}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>

                  {/* Subject Filter Chips */}
                  <div className="flex flex-wrap gap-1.5 pt-1">
                    {['Tümü', ...SUBJECTS].map((subj) => {
                      const count = subj === 'Tümü' 
                        ? historyItems.length 
                        : historyItems.filter(i => (i.subject || 'Genel') === subj).length;

                      return (
                        <button
                          key={subj}
                          onClick={() => setHistorySubjectFilter(subj)}
                          className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                            historySubjectFilter === subj
                              ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30 border border-indigo-400'
                              : 'bg-slate-950 hover:bg-slate-800 text-slate-400 border border-white/5'
                          }`}
                        >
                          <span>{subj}</span>
                          <span className={`text-[10px] px-1.5 py-0.2 rounded-md font-mono ${
                            historySubjectFilter === subj ? 'bg-white/20 text-white' : 'bg-slate-900 text-slate-500'
                          }`}>
                            {count}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* History List Grid */}
                {isHistoryLoading ? (
                  <div className="p-12 text-center bg-slate-900/50 rounded-3xl border border-white/5 space-y-3">
                    <Loader2 className="w-8 h-8 animate-spin text-indigo-400 mx-auto" />
                    <p className="text-xs text-slate-400 font-bold">Çözüm arşiviniz yükleniyor...</p>
                  </div>
                ) : filteredHistoryItems.length === 0 ? (
                  <div className="p-12 text-center bg-slate-900/50 rounded-3xl border border-white/5 space-y-3">
                    <div className="w-12 h-12 rounded-2xl bg-slate-800 text-slate-400 flex items-center justify-center mx-auto border border-white/10">
                      <BookOpen className="w-6 h-6" />
                    </div>
                    <h4 className="text-sm font-bold text-white">
                      {historySearchQuery || historySubjectFilter !== 'Tümü' 
                        ? 'Aramanıza Uygun Soru Bulunamadı' 
                        : 'Henüz Kaydedilmiş Soru Yok'}
                    </h4>
                    <p className="text-xs text-slate-400 max-w-sm mx-auto">
                      {historySearchQuery || historySubjectFilter !== 'Tümü'
                        ? 'Filtreleri veya arama teriminizi değiştirerek tekrar deneyin.'
                        : 'Soru çözdürdüğünüzde tüm çözümleriniz otomatik olarak bu arşivde ders bazlı saklanır.'}
                    </p>
                    <button
                      onClick={() => setSolverSubTab('solver')}
                      className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold rounded-xl transition-all shadow-md shadow-indigo-600/20 cursor-pointer inline-flex items-center gap-1.5 mt-2"
                    >
                      <HelpCircle className="w-4 h-4" />
                      <span>Hemen Soru Çözdür</span>
                    </button>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {filteredHistoryItems.map((item) => {
                      const itemSubject = item.subject || 'Genel';
                      const badgeClass = getSubjectColor(itemSubject);
                      const formattedDate = item.createdAt 
                        ? new Date(item.createdAt).toLocaleDateString('tr-TR', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })
                        : 'Geçmiş Soru';

                      const followCount = Array.isArray(item.followUpMessages) ? item.followUpMessages.length : 0;
                      const hasAudio = !!item.solverResult?.audioDataUrl;

                      return (
                        <div
                          key={item.id}
                          onClick={() => handleOpenHistoryItem(item)}
                          className="bg-slate-900/90 hover:bg-slate-800/90 border border-white/10 hover:border-indigo-500/40 rounded-3xl p-5 space-y-3.5 transition-all cursor-pointer group shadow-lg relative flex flex-col justify-between"
                        >
                          <div className="space-y-3">
                            {/* Header Badge & Date */}
                            <div className="flex items-center justify-between gap-2">
                              <div className="flex items-center gap-2">
                                <span className={`text-[11px] font-extrabold px-2.5 py-0.5 rounded-lg border ${badgeClass}`}>
                                  {itemSubject}
                                </span>
                                <span className="text-[10px] text-slate-400 font-mono flex items-center gap-1">
                                  <Calendar className="w-3 h-3 text-slate-500" />
                                  {formattedDate}
                                </span>
                              </div>

                              <button
                                onClick={(e) => handleDeleteHistoryItem(e, item.id)}
                                title="Sil"
                                className="p-1.5 text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 rounded-lg transition-colors"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>

                            {/* Content Thumbnail / Text Preview */}
                            <div className="flex gap-3">
                              {item.qImagePreview && (
                                <div className="w-16 h-16 rounded-xl overflow-hidden bg-slate-950 border border-white/10 shrink-0">
                                  <img src={item.qImagePreview} alt="Soru" className="w-full h-full object-cover" />
                                </div>
                              )}

                              <div className="flex-1 min-w-0">
                                <p className="text-xs font-semibold text-slate-200 line-clamp-2">
                                  {item.qText || "Görsel Soru"}
                                </p>
                                <p className="text-[11px] text-slate-400 line-clamp-2 mt-1">
                                  {item.solverResult?.text ? item.solverResult.text.replace(/[*#_`]/g, '') : "Çözüm açıklaması..."}
                                </p>
                              </div>
                            </div>
                          </div>

                          {/* Card Footer Indicators & Open Button */}
                          <div className="pt-3 border-t border-white/5 flex items-center justify-between gap-2 text-[11px]">
                            <div className="flex items-center gap-2">
                              {followCount > 0 && (
                                <span className="bg-indigo-500/10 text-indigo-300 px-2 py-0.5 rounded-md font-bold flex items-center gap-1 border border-indigo-500/20">
                                  <MessageSquare className="w-3 h-3" />
                                  {followCount} Takip
                                </span>
                              )}
                              {hasAudio && (
                                <span className="bg-emerald-500/10 text-emerald-400 px-2 py-0.5 rounded-md font-bold flex items-center gap-1 border border-emerald-500/20">
                                  <Volume2 className="w-3 h-3" />
                                  Sesli
                                </span>
                              )}
                            </div>

                            <span className="text-indigo-400 font-bold group-hover:translate-x-0.5 transition-transform flex items-center gap-1">
                              Çözümü İncele <ChevronRight className="w-3.5 h-3.5" />
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            ) : (
              /* SOLVER VIEW */
              <>
                {/* Subject Selector Bar */}
                <div className="bg-slate-900/90 border border-white/10 rounded-3xl p-4 md:p-5 space-y-2.5">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-extrabold text-slate-200 flex items-center gap-2">
                      <Tag className="w-4 h-4 text-indigo-400" />
                      <span>Soru Ders Kategorisi:</span>
                    </label>
                    <span className="text-[10px] font-bold text-slate-400 bg-slate-950 px-2.5 py-1 rounded-lg border border-white/5">
                      Seçili: <strong className="text-indigo-400">{selectedSubject}</strong>
                    </span>
                  </div>
                  <div className="flex flex-wrap gap-1.5 pt-1">
                    {SUBJECTS.map((subj) => (
                      <button
                        key={subj}
                        type="button"
                        onClick={() => setSelectedSubject(subj)}
                        className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                          selectedSubject === subj
                            ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30 border border-indigo-400'
                            : 'bg-slate-950 hover:bg-slate-800 text-slate-400 border border-white/5 hover:border-white/20'
                        }`}
                      >
                        {subj}
                      </button>
                    ))}
                  </div>
                </div>

            {/* Question Right Counter & Status Card */}
            <div className="bg-slate-900/90 border border-white/10 rounded-3xl p-5 md:p-6 space-y-3">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-2xl flex items-center justify-center shrink-0 ${
                    isLimitReached 
                      ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30' 
                      : (isTrial && isGoldPlan)
                      ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                      : 'bg-indigo-500/20 text-indigo-400 border border-indigo-500/30'
                  }`}>
                    <Sparkles className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="text-sm font-extrabold text-white flex items-center gap-2">
                      Soru Sorma Hakkı
                      <span className={`text-[10px] px-2.5 py-0.5 rounded-full font-bold border ${
                        isLimitReached 
                          ? 'bg-rose-500/10 text-rose-400 border-rose-500/20' 
                          : (isTrial && isGoldPlan)
                          ? 'bg-amber-500/10 text-amber-300 border-amber-500/20'
                          : 'bg-indigo-500/10 text-indigo-300 border-indigo-500/20'
                      }`}>
                        {isTrial && isGoldPlan ? '7 Günlük Deneme Sürümü (Altın Paket)' : 'Abonelik Dönemi'}
                      </span>
                    </h4>
                    <p className="text-xs text-slate-400 mt-0.5">
                      {isLimitReached 
                        ? (isTrial && isGoldPlan ? 'Deneme sürümü 21 soru hakkınız dolmuştur.' : 'Abonelik soru hakkınız dolmuştur.')
                        : `${MAX_QUESTIONS_PER_SUB} soruluk ${isTrial && isGoldPlan ? 'deneme süresi' : 'abonelik'} hakkınızdan kalan: ${remainingQuestions} soru`}
                    </p>
                  </div>
                </div>

                <div className="text-left sm:text-right shrink-0">
                  <span className={`text-2xl font-black ${isLimitReached ? 'text-rose-400' : (isTrial && isGoldPlan) ? 'text-amber-400' : 'text-indigo-400'}`}>
                    {remainingQuestions}
                  </span>
                  <span className="text-xs text-slate-400 font-bold ml-1">/ {MAX_QUESTIONS_PER_SUB} Kalan Hak</span>
                </div>
              </div>

              {/* Progress Bar */}
              <div className="w-full bg-slate-950 rounded-full h-2.5 overflow-hidden border border-white/5 p-0.5">
                <div 
                  className={`h-full rounded-full transition-all duration-500 ${
                    isLimitReached 
                      ? 'bg-rose-500' 
                      : (isTrial && isGoldPlan ? remainingQuestions <= 5 : remainingQuestions <= 20)
                      ? 'bg-amber-500' 
                      : (isTrial && isGoldPlan)
                      ? 'bg-gradient-to-r from-amber-500 to-yellow-400'
                      : 'bg-gradient-to-r from-indigo-500 to-purple-500'
                  }`} 
                  style={{ width: `${Math.min(100, Math.max(0, (currentQuestionCount / MAX_QUESTIONS_PER_SUB) * 100))}%` }}
                />
              </div>

              {/* Renewal Action if limit reached */}
              {isLimitReached && (
                <div className="pt-2 flex flex-col sm:flex-row items-center justify-between gap-3 bg-rose-500/10 border border-rose-500/20 p-3.5 rounded-2xl">
                  <p className="text-xs font-semibold text-rose-200">
                    {isTrial && isGoldPlan 
                      ? '7 günlük deneme süresine özel 21 soru çözme hakkınızı doldurdunuz. Soru asistanını 140 soru hakkıyla kullanmaya devam etmek için aboneliğinizi başlatabilirsiniz.'
                      : `${MAX_QUESTIONS_PER_SUB} soru çözme hakkınızı doldurdunuz. Soru asistanını kullanmaya devam etmek için paketinizi yenileyebilir veya yükseltebilirsiniz.`}
                  </p>
                  <button
                    onClick={() => navigate('/panel/ogrenci/abonelik')}
                    className="px-4 py-2 bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs rounded-xl transition-all shadow-md shrink-0 cursor-pointer"
                  >
                    {isTrial ? 'Aboneliği Başlat' : 'Aboneliği Yenile / Paketi Yükselt'}
                  </button>
                </div>
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
                        onDragOver={(e) => { e.preventDefault(); e.stopPropagation(); }}
                        onDrop={handleDropImage}
                        className="border-2 border-dashed border-white/10 hover:border-indigo-500/40 bg-slate-950/40 hover:bg-slate-950/80 rounded-2xl p-5 text-center transition-all flex flex-col items-center justify-center gap-3"
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 flex items-center justify-center">
                            <Camera className="w-5 h-5" />
                          </div>
                          <div className="w-10 h-10 rounded-2xl bg-purple-500/10 border border-purple-500/20 text-purple-400 flex items-center justify-center">
                            <Upload className="w-5 h-5" />
                          </div>
                        </div>

                        <div>
                          <span className="text-xs font-bold text-slate-200 block">Soru Görseli Yükleyin</span>
                          <span className="text-[10px] text-slate-400">Fotoğraf çekin, galeriden seçin veya sürükleyin</span>
                        </div>

                        <div className="grid grid-cols-2 gap-2.5 w-full pt-1">
                          <button
                            type="button"
                            onClick={() => fileInputRef.current?.click()}
                            className="px-3 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs rounded-xl flex items-center justify-center gap-2 border border-white/10 transition-all cursor-pointer active:scale-95 shadow-sm"
                          >
                            <Image className="w-4 h-4 text-purple-400" />
                            <span>Galeriden Seç</span>
                          </button>

                          <button
                            type="button"
                            onClick={openCameraModal}
                            className="px-3 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs rounded-xl flex items-center justify-center gap-2 transition-all cursor-pointer active:scale-95 shadow-md shadow-indigo-600/20"
                          >
                            <Camera className="w-4 h-4" />
                            <span>Fotoğraf Çek</span>
                          </button>
                        </div>
                      </div>
                    )}

                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      onChange={handleImageSelect}
                      className="hidden"
                    />

                    <input
                      ref={cameraInputRef}
                      type="file"
                      accept="image/*"
                      capture="environment"
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
                      onPaste={handlePasteImage}
                      placeholder="Soruyu buraya yazabilir veya panodan görsel yapıştırabilirsiniz (Ctrl+V)..."
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
                      <option value="Puck">Ömer (Erkek - Doğal & Enerjik)</option>
                      <option value="Charon">Harun (Erkek - Tok & Derin)</option>
                      <option value="Aoede">Betül (Kadın - Akıcı & Eğitici)</option>
                      <option value="Fenrir">Hüseyin (Erkek - Tempolu)</option>
                      <option value="Kore">Zeynep (Kadın - Yumuşak & Anlaşılır)</option>
                    </select>
                  </div>

                  {/* Submit Button */}
                  <button
                    onClick={handleSolveQuestion}
                    disabled={isSolving || isLimitReached || (!qText.trim() && !qImagePreview)}
                    className="w-full py-3.5 px-4 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 disabled:opacity-50 text-white font-bold text-xs rounded-2xl shadow-lg shadow-indigo-500/20 flex items-center justify-center gap-2 transition-all cursor-pointer disabled:cursor-not-allowed"
                  >
                    {isSolving ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin text-white" />
                        <span>Sorun İnceleniyor ve Çözülüyor...</span>
                      </>
                    ) : isLimitReached ? (
                      <>
                        <X className="w-4 h-4 text-rose-300" />
                        <span>Soru Sorma Hakkınız Doldu ({currentQuestionCount}/{MAX_QUESTIONS_PER_SUB})</span>
                      </>
                    ) : (
                      <>
                        <Sparkles className="w-4 h-4 text-amber-300" />
                        <span>Yapay Zeka ile Soruyu Çöz</span>
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
                        Sorudaki veriler taranıyor, formüller ve adım adım çözüm hazırlanıyor...
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
                      Sol taraftan sorunun fotoğrafını yükleyebilir veya soruyu yazarak anında adımsal çözüme ulaşabilirsin.
                    </p>
                  </div>
                )}

                {!isSolving && solverResult && (
                  <div className="space-y-4">
                    
                    {/* Audio Player Component - Only if single valid question */}
                    {solverResult.hasValidSingleQuestion !== false && (
                      <>
                        {isAudioGenerating && !solverResult.audioDataUrl && (
                          <div className="bg-gradient-to-r from-emerald-950/20 via-slate-900 to-indigo-950/20 border border-emerald-500/20 rounded-3xl p-5 flex items-center justify-between">
                            <div className="flex items-center gap-3">
                              <div className="w-9 h-9 rounded-xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center border border-emerald-500/20">
                                <Volume2 className="w-5 h-5 animate-pulse" />
                              </div>
                              <div>
                                <h5 className="font-bold text-white text-xs">Sesli Çözüm Hazırlanıyor...</h5>
                                <p className="text-[11px] text-emerald-400/80">Gemini Voice • {selectedVoice}</p>
                              </div>
                            </div>
                            <Loader2 className="w-5 h-5 text-emerald-500 animate-spin" />
                          </div>
                        )}
                        
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

                        {!isAudioGenerating && !solverResult.audioDataUrl && (
                          <div className="bg-gradient-to-r from-emerald-950/20 via-slate-900 to-indigo-950/20 border border-white/10 hover:border-emerald-500/30 rounded-3xl p-5 flex items-center justify-between transition-all">
                            <div className="flex items-center gap-3">
                              <div className="w-9 h-9 rounded-xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center border border-emerald-500/20">
                                <Volume2 className="w-5 h-5" />
                              </div>
                              <div>
                                <h5 className="font-bold text-white text-xs">Sesli Çözümlü Anlatım</h5>
                                <p className="text-[11px] text-slate-400">Çözümü yapay zeka öğretmeninizden sesli dinlemek için tıklayın</p>
                              </div>
                            </div>
                            <button
                              onClick={handlePlayOrGenerateAudio}
                              className="px-3.5 py-1.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold rounded-xl text-xs flex items-center gap-1.5 transition-all active:scale-95 cursor-pointer shadow-md shadow-emerald-500/10"
                            >
                              <Play className="w-4 h-4 fill-current ml-0.5" />
                              <span>Sesli Dinle</span>
                            </button>
                          </div>
                        )}
                      </>
                    )}

                    {/* Text Solution Display */}
                    <div className="bg-slate-900/90 border border-white/10 rounded-3xl p-6 space-y-4">
                      <div className="flex items-center gap-2 text-indigo-400 font-extrabold text-xs uppercase tracking-wider pb-3 border-b border-white/10">
                        <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                        <span>Adım Adım Çözüm Metni</span>
                      </div>

                      <div className="prose prose-invert prose-p:leading-relaxed prose-pre:bg-slate-950/90 prose-pre:border prose-pre:border-white/10 prose-blockquote:border-l-4 prose-blockquote:border-indigo-500 prose-blockquote:bg-indigo-950/30 prose-blockquote:rounded-r-2xl prose-blockquote:py-2.5 prose-blockquote:px-4 prose-blockquote:my-3 prose-blockquote:text-indigo-200 prose-blockquote:not-italic prose-code:text-emerald-300 prose-code:bg-emerald-950/40 prose-code:border prose-code:border-emerald-500/20 prose-code:px-2 prose-code:py-0.5 prose-code:rounded-md prose-code:font-mono prose-code:text-[13px] prose-code:before:content-none prose-code:after:content-none prose-sm max-w-none text-slate-200 text-xs md:text-sm">
                        <ReactMarkdown>{cleanMathText(solverResult.text)}</ReactMarkdown>
                      </div>
                    </div>

                    {/* İnteraktif Takip Sohbeti (Soru Hakkından Düşmeyen Ücretsiz Takip) */}
                    {solverResult.hasValidSingleQuestion === false ? (
                      <div className="bg-slate-900/90 border border-amber-500/30 rounded-3xl p-5 md:p-6 space-y-2 shadow-xl">
                        <div className="flex items-center gap-2.5 text-amber-400 font-extrabold text-xs md:text-sm">
                          <div className="w-8 h-8 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center border border-amber-500/30 shrink-0">
                            <MessageSquare className="w-4 h-4" />
                          </div>
                          <span>Takip Sohbeti Devre Dışı</span>
                        </div>
                        <p className="text-xs text-slate-300 leading-relaxed pl-10">
                          Görselde geçerli tek bir soru bulunmadığı veya birden fazla soru tespit edildiği için bu yanıt üzerinde takip sohbeti başlatılamamaktadır. Lütfen yalnızca tek bir soru içeren net bir görsel yükleyerek tekrar deneyiniz.
                        </p>
                      </div>
                    ) : (
                      <div className="bg-slate-900/90 border border-indigo-500/30 rounded-3xl p-5 md:p-6 space-y-4 shadow-xl">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-white/10">
                          <div className="flex items-center gap-2.5">
                            <div className="w-8 h-8 rounded-xl bg-indigo-500/20 text-indigo-400 flex items-center justify-center border border-indigo-500/30">
                              <MessageSquare className="w-4 h-4" />
                            </div>
                            <div>
                              <h5 className="font-extrabold text-white text-xs md:text-sm flex items-center gap-2">
                                İnteraktif Takip Sohbeti
                                <span className="bg-emerald-500/10 text-emerald-400 text-[10px] font-black px-2.5 py-0.5 rounded-full border border-emerald-500/30 flex items-center gap-1">
                                  <Gift className="w-3 h-3" /> Soru Hakkınızdan Düşmez (Ücretsiz)
                                </span>
                              </h5>
                              <p className="text-[11px] text-slate-400 mt-0.5">
                                Çözümde takıldığınız veya anlamadığınız yerleri sorun, soru hakkınızdan düşmeden detaylandıralım!
                              </p>
                            </div>
                          </div>
                        </div>

                        {/* Quick prompt suggestions */}
                        <div className="flex flex-wrap gap-2 pt-1">
                          {[
                            "💡 3. Adımı daha detaylı açıklar mısın?",
                            "❓ Formül/Eşitlik nereden geliyor?",
                            "✏️ Farklı bir çözüm yöntemi var mı?",
                            "🎯 Benzer bir soru tipinde nelere dikkat etmeliyim?"
                          ].map((promptText, pIdx) => (
                            <button
                              key={pIdx}
                              onClick={() => handleSendFollowUp(promptText)}
                              disabled={isFollowUpLoading}
                              className="px-3 py-1.5 bg-slate-950 hover:bg-slate-800 text-indigo-300 hover:text-white border border-indigo-500/20 hover:border-indigo-500/40 rounded-xl text-[11px] font-semibold transition-all cursor-pointer disabled:opacity-50"
                            >
                              {promptText}
                            </button>
                          ))}
                        </div>

                        {/* Chat messages feed if any */}
                        {followUpMessages.length > 0 && (
                          <div 
                            ref={followUpScrollRef} 
                            className="space-y-3 p-3.5 bg-slate-950/80 rounded-2xl border border-white/5"
                          >
                            {followUpMessages.map((msg) => (
                              <div 
                                key={msg.id} 
                                className={`flex gap-3 text-xs ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}
                              >
                                {msg.sender === 'ai' && (
                                  <div className="w-7 h-7 rounded-xl bg-indigo-500/20 text-indigo-400 flex items-center justify-center border border-indigo-500/30 shrink-0 mt-1">
                                    <Sparkles className="w-3.5 h-3.5" />
                                  </div>
                                )}
                                <div className={`p-3 rounded-2xl max-w-[85%] ${
                                  msg.sender === 'user' 
                                    ? 'bg-indigo-600 text-white rounded-tr-none' 
                                    : 'bg-slate-900 border border-white/10 text-slate-200 rounded-tl-none'
                                }`}>
                                  <div className="prose prose-invert prose-xs max-w-none text-xs prose-blockquote:border-l-2 prose-blockquote:border-indigo-400 prose-blockquote:bg-indigo-950/30 prose-blockquote:py-1.5 prose-blockquote:px-3 prose-blockquote:rounded-r-xl prose-blockquote:not-italic prose-code:text-emerald-300 prose-code:bg-emerald-950/40 prose-code:px-1.5 prose-code:py-0.5 prose-code:rounded prose-code:font-mono prose-code:before:content-none prose-code:after:content-none">
                                    <ReactMarkdown>{cleanMathText(msg.text)}</ReactMarkdown>
                                  </div>
                                  <span className="block text-[9px] opacity-60 text-right mt-1 font-mono">
                                    {msg.timestamp}
                                  </span>
                                </div>
                              </div>
                            ))}

                            {isFollowUpLoading && (
                              <div className="flex items-center gap-2.5 p-3 bg-slate-900/60 rounded-2xl border border-white/5 text-xs text-indigo-300">
                                <Loader2 className="w-4 h-4 animate-spin text-indigo-400" />
                                <span>Takip sorunuz inceleniyor ve açıklanıyor...</span>
                              </div>
                            )}
                          </div>
                        )}

                        {/* Input box */}
                        <form 
                          onSubmit={(e) => {
                            e.preventDefault();
                            handleSendFollowUp();
                          }}
                          className="flex gap-2 pt-1"
                        >
                          <input
                            type="text"
                            value={followUpInput}
                            onChange={(e) => setFollowUpInput(e.target.value)}
                            placeholder="Çözümle ilgili anlamadığınız yeri sorun (ör: x nereden geldi?)"
                            disabled={isFollowUpLoading}
                            className="flex-1 bg-slate-950 border border-white/10 focus:border-indigo-500/50 rounded-2xl px-4 py-3 text-xs text-slate-200 placeholder:text-slate-500 outline-none transition-colors"
                          />
                          <button
                            type="submit"
                            disabled={isFollowUpLoading || !followUpInput.trim()}
                            className="px-4 py-3 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white font-bold text-xs rounded-2xl transition-all flex items-center gap-1.5 shadow-md shadow-indigo-600/20 cursor-pointer disabled:cursor-not-allowed shrink-0"
                          >
                            {isFollowUpLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                            <span className="hidden sm:inline">Sor</span>
                          </button>
                        </form>
                      </div>
                    )}

                  </div>
                )}

              </div>

            </div>
          </>
        )}

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
                ? message.isError
                  ? 'bg-rose-950/80 border-rose-500/40 text-rose-400'
                  : 'bg-gradient-to-br from-indigo-500 to-purple-600 border-white/10 text-white'
                : 'bg-slate-800 border-white/10 text-slate-300'
            }`}>
              {message.role === 'model' ? (
                message.isError ? <AlertTriangle size={18} /> : <Sparkles size={18} />
              ) : (
                <User size={18} />
              )}
            </div>

            {/* Bubble */}
            <div className={`p-4 rounded-2xl md:text-sm text-base leading-relaxed overflow-hidden ${
              message.role === 'model'
                ? message.isError
                  ? 'bg-gradient-to-br from-slate-900 via-rose-950/30 to-slate-900 text-slate-200 border border-rose-500/40 rounded-tl-sm shadow-xl'
                  : 'bg-slate-800/80 text-slate-200 border border-white/5 rounded-tl-sm'
                : 'bg-indigo-600 text-white rounded-tr-sm shadow-md'
            }`}>
              {message.role === 'model' ? (
                 <div className="prose prose-invert prose-p:leading-relaxed prose-pre:bg-slate-900 prose-pre:border prose-pre:border-white/10 prose-sm max-w-none">
                   {message.content && <ReactMarkdown>{cleanMathText(message.content)}</ReactMarkdown>}

                   {/* Error Actions & Information for User & System */}
                   {message.isError && (
                     <div className="mt-4 pt-3 border-t border-rose-500/20 flex flex-col gap-3 not-prose">
                       <div className="flex flex-wrap items-center gap-2">
                         {message.retryText && (
                           <button
                             type="button"
                             onClick={() => {
                               setInput(message.retryText || '');
                               const textarea = document.querySelector('textarea');
                               if (textarea) {
                                 textarea.focus();
                               }
                             }}
                             className="px-3.5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-semibold transition-all flex items-center gap-1.5 shadow-md shadow-indigo-600/20 cursor-pointer"
                           >
                             <RotateCcw className="w-3.5 h-3.5" />
                             <span>Mesajı Kutuya Yaz</span>
                           </button>
                         )}
                         {message.retryText && (
                           <button
                             type="button"
                             disabled={isLoading}
                             onClick={() => sendAssistantMessage(message.retryText || '')}
                             className="px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl text-xs font-semibold border border-white/10 transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                           >
                             <Send className="w-3.5 h-3.5" />
                             <span>Hemen Yeniden Gönder</span>
                           </button>
                         )}
                       </div>

                       <div className="flex items-center gap-2 text-[11px] text-amber-300/90 bg-amber-500/10 border border-amber-500/20 px-3 py-1.5 rounded-lg font-mono">
                         <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse shrink-0"></span>
                         <span>Sistem Bilgisi: Hata teşhis kaydı alındı ve teknik izleme merkezine iletildi {message.errorCode ? `(${message.errorCode})` : ''}</span>
                       </div>
                     </div>
                   )}

                   {/* Interactive Options */}
                   {Array.isArray(message.interactiveOptions) && message.interactiveOptions.length > 0 && (
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

      {/* Dedicated History Question Detail Modal */}
      <AnimatePresence>
        {selectedHistoryDetail && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/80 backdrop-blur-md overflow-hidden"
            onClick={() => {
              setSelectedHistoryDetail(null);
              setHistoryDetailAudioPlaying(false);
            }}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 20 }}
              onClick={(e) => e.stopPropagation()}
              className="relative w-full max-w-3xl max-h-[88vh] bg-slate-900 border border-indigo-500/30 rounded-3xl p-5 md:p-8 space-y-6 shadow-2xl overflow-y-auto custom-scrollbar"
            >
              {/* Modal Header */}
              <div className="flex items-start justify-between gap-4 pb-4 border-b border-white/10">
                <div className="space-y-1.5">
                  <div className="flex items-center gap-2.5 flex-wrap">
                    <span className={`text-xs font-extrabold px-3 py-1 rounded-xl border ${getSubjectColor(selectedHistoryDetail.subject || 'Genel')}`}>
                      {selectedHistoryDetail.subject || 'Genel'}
                    </span>
                    <span className="text-xs text-slate-400 font-mono flex items-center gap-1.5">
                      <Calendar className="w-3.5 h-3.5 text-slate-500" />
                      {selectedHistoryDetail.createdAt 
                        ? new Date(selectedHistoryDetail.createdAt).toLocaleDateString('tr-TR', { day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' })
                        : 'Geçmiş Soru'}
                    </span>
                  </div>
                  <h3 className="text-lg md:text-xl font-black text-white flex items-center gap-2">
                    <BookOpen className="w-5 h-5 text-indigo-400" />
                    Arşivlenmiş Soru ve Çözüm Detayı
                  </h3>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={(e) => {
                      handleDeleteHistoryItem(e, selectedHistoryDetail.id);
                      setSelectedHistoryDetail(null);
                    }}
                    title="Bu Soruyu Arşivden Sil"
                    className="p-2.5 text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 rounded-2xl transition-colors cursor-pointer border border-white/5"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => {
                      setSelectedHistoryDetail(null);
                      setHistoryDetailAudioPlaying(false);
                    }}
                    title="Kapat"
                    className="p-2.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-2xl transition-colors cursor-pointer border border-white/5"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
              </div>

              {/* SECTION 1: QUESTION (Soru Görseli veya Metni) */}
              <div className="bg-slate-950/80 border border-white/10 rounded-2xl p-5 space-y-3">
                <div className="flex items-center gap-2 text-xs font-extrabold text-indigo-400 uppercase tracking-wider">
                  <HelpCircle className="w-4 h-4" />
                  <span>Soru Detayı</span>
                </div>

                {selectedHistoryDetail.qImagePreview && (
                  <div className="relative group max-w-lg mx-auto overflow-hidden rounded-2xl border border-white/10 bg-slate-900">
                    <img 
                      src={selectedHistoryDetail.qImagePreview} 
                      alt="Soru Görseli" 
                      className="w-full h-auto max-h-[380px] object-contain rounded-2xl"
                    />
                    <button
                      onClick={() => setExpandedImage(selectedHistoryDetail.qImagePreview)}
                      className="absolute top-3 right-3 p-2 bg-slate-950/80 hover:bg-slate-900 text-white rounded-xl border border-white/20 text-xs font-bold flex items-center gap-1.5 backdrop-blur-sm opacity-90 group-hover:opacity-100 transition-opacity cursor-pointer"
                    >
                      <Maximize2 className="w-3.5 h-3.5" />
                      <span>Tam Ekran Gör</span>
                    </button>
                  </div>
                )}

                {selectedHistoryDetail.qText && (
                  <div className="p-4 bg-slate-900/90 rounded-xl border border-white/5 text-sm text-slate-200 font-medium whitespace-pre-wrap leading-relaxed">
                    {selectedHistoryDetail.qText}
                  </div>
                )}
              </div>

              {/* SECTION 2: SOLUTION (Çözüm ve Sesli Anlatım) */}
              <div className="bg-slate-950/80 border border-emerald-500/20 rounded-2xl p-5 md:p-6 space-y-4">
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2 text-xs font-extrabold text-emerald-400 uppercase tracking-wider">
                    <Sparkles className="w-4 h-4" />
                    <span>Adım Adım Yapay Zeka Çözümü</span>
                  </div>

                  {selectedHistoryDetail.solverResult?.audioDataUrl && (
                    <button
                      onClick={toggleHistoryDetailAudioPlay}
                      className="px-3.5 py-1.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black rounded-xl text-xs flex items-center gap-2 shadow-lg shadow-emerald-500/20 transition-transform active:scale-95 cursor-pointer"
                    >
                      {historyDetailAudioPlaying ? (
                        <>
                          <Pause className="w-3.5 h-3.5 fill-current" />
                          <span>Durdur</span>
                        </>
                      ) : (
                        <>
                          <Play className="w-3.5 h-3.5 fill-current ml-0.5" />
                          <span>Sesli Dinle</span>
                        </>
                      )}
                    </button>
                  )}
                </div>

                {selectedHistoryDetail.solverResult?.audioDataUrl && (
                  <audio
                    ref={historyDetailAudioRef}
                    src={selectedHistoryDetail.solverResult.audioDataUrl}
                    onEnded={() => setHistoryDetailAudioPlaying(false)}
                    onPause={() => setHistoryDetailAudioPlaying(false)}
                    onPlay={() => setHistoryDetailAudioPlaying(true)}
                    className="hidden"
                  />
                )}

                <div className="prose prose-invert prose-sm max-w-none text-slate-200 leading-relaxed bg-slate-900/90 p-5 rounded-2xl border border-white/5 prose-blockquote:border-l-4 prose-blockquote:border-indigo-500 prose-blockquote:bg-indigo-950/30 prose-blockquote:rounded-r-2xl prose-blockquote:py-2.5 prose-blockquote:px-4 prose-blockquote:my-3 prose-blockquote:text-indigo-200 prose-blockquote:not-italic prose-code:text-emerald-300 prose-code:bg-emerald-950/40 prose-code:border prose-code:border-emerald-500/20 prose-code:px-2 prose-code:py-0.5 prose-code:rounded-md prose-code:font-mono prose-code:text-[13px] prose-code:before:content-none prose-code:after:content-none">
                  <ReactMarkdown>{cleanMathText(selectedHistoryDetail.solverResult?.text || 'Çözüm yükleniyor...')}</ReactMarkdown>
                </div>
              </div>

              {/* SECTION 3: INTERACTIVE FOLLOW-UP CHAT */}
              {selectedHistoryDetail.solverResult?.hasValidSingleQuestion !== false ? (
                <div className="bg-slate-950/80 border border-indigo-500/20 rounded-2xl p-5 space-y-4">
                  <div className="flex items-center justify-between pb-2 border-b border-white/5">
                    <div className="flex items-center gap-2">
                      <MessageSquare className="w-4 h-4 text-indigo-400" />
                      <span className="text-xs font-extrabold text-white">İnteraktif Takip Sohbeti</span>
                      <span className="bg-emerald-500/10 text-emerald-400 text-[10px] font-black px-2 py-0.5 rounded-full border border-emerald-500/30">
                        Ücretsiz
                      </span>
                    </div>
                  </div>

                  {/* Previous follow up messages */}
                  {Array.isArray(selectedHistoryDetail.followUpMessages) && selectedHistoryDetail.followUpMessages.length > 0 && (
                    <div className="space-y-3 p-3.5 bg-slate-900/90 rounded-2xl border border-white/5">
                      {selectedHistoryDetail.followUpMessages.map((msg: any) => (
                        <div
                          key={msg.id}
                          className={`flex gap-3 text-xs ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}
                        >
                          {msg.sender === 'ai' && (
                            <div className="w-6 h-6 rounded-lg bg-indigo-500/20 text-indigo-400 flex items-center justify-center border border-indigo-500/30 shrink-0 mt-0.5">
                              <Sparkles className="w-3 h-3" />
                            </div>
                          )}
                          <div className={`p-3 rounded-2xl max-w-[85%] ${
                            msg.sender === 'user'
                              ? 'bg-indigo-600 text-white rounded-tr-none'
                              : 'bg-slate-950 border border-white/10 text-slate-200 rounded-tl-none'
                          }`}>
                            <div className="prose prose-invert prose-xs max-w-none text-xs">
                              <ReactMarkdown>{cleanMathText(msg.text)}</ReactMarkdown>
                            </div>
                            <span className="block text-[9px] opacity-60 text-right mt-1 font-mono">
                              {msg.timestamp}
                            </span>
                          </div>
                        </div>
                      ))}

                      {isHistoryDetailFollowUpLoading && (
                        <div className="flex items-center gap-2 p-3 bg-slate-950/60 rounded-2xl border border-white/5 text-xs text-indigo-300">
                          <Loader2 className="w-4 h-4 animate-spin text-indigo-400" />
                          <span>Cevap hazırlanıyor...</span>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Input form */}
                  <form
                    onSubmit={(e) => {
                      e.preventDefault();
                      handleSendHistoryDetailFollowUp();
                    }}
                    className="flex gap-2"
                  >
                    <input
                      type="text"
                      value={historyDetailFollowUpInput}
                      onChange={(e) => setHistoryDetailFollowUpInput(e.target.value)}
                      placeholder="Anlamadığınız yeri sorun..."
                      disabled={isHistoryDetailFollowUpLoading}
                      className="flex-1 bg-slate-900 border border-white/10 focus:border-indigo-500/50 rounded-2xl px-4 py-2.5 text-xs text-slate-200 placeholder:text-slate-500 outline-none transition-colors"
                    />
                    <button
                      type="submit"
                      disabled={isHistoryDetailFollowUpLoading || !historyDetailFollowUpInput.trim()}
                      className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white font-bold text-xs rounded-2xl transition-all flex items-center gap-1.5 shadow-md shadow-indigo-600/20 cursor-pointer shrink-0"
                    >
                      {isHistoryDetailFollowUpLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
                      <span>Sor</span>
                    </button>
                  </form>
                </div>
              ) : null}

              {/* Modal Action Buttons Footer */}
              <div className="pt-4 border-t border-white/10 flex justify-end gap-3">
                <button
                  onClick={() => {
                    setSelectedHistoryDetail(null);
                    setHistoryDetailAudioPlaying(false);
                  }}
                  className="w-full sm:w-auto px-5 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold rounded-2xl border border-white/10 transition-colors cursor-pointer"
                >
                  Pencereyi Kapat
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Expanded Full-Screen Image Lightbox */}
      <AnimatePresence>
        {expandedImage && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setExpandedImage(null)}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/90 backdrop-blur-lg cursor-zoom-out"
          >
            <div className="relative max-w-5xl max-h-[95vh]">
              <img
                src={expandedImage}
                alt="Tam Ekran Soru"
                className="w-auto h-auto max-w-full max-h-[90vh] object-contain rounded-2xl shadow-2xl border border-white/20"
              />
              <button
                onClick={() => setExpandedImage(null)}
                className="absolute -top-12 right-0 p-2 text-white bg-slate-800 hover:bg-slate-700 rounded-xl border border-white/10 text-xs font-bold flex items-center gap-1.5 cursor-pointer"
              >
                <X className="w-4 h-4" />
                <span>Kapat</span>
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
      {/* Live Camera Capture Modal */}
      <AnimatePresence>
        {isCameraModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-slate-900 border border-white/10 rounded-3xl p-5 md:p-6 max-w-lg w-full space-y-4 shadow-2xl relative overflow-hidden"
            >
              <div className="flex items-center justify-between border-b border-white/10 pb-3">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-xl bg-indigo-500/20 text-indigo-400 flex items-center justify-center border border-indigo-500/30">
                    <Camera className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-sm font-extrabold text-white">Soru Fotoğrafı Çek</h3>
                    <p className="text-[11px] text-slate-400">Canlı görünüm ile sorunuzu fotoğraflayın</p>
                  </div>
                </div>
                <button
                  onClick={closeCameraModal}
                  className="w-8 h-8 rounded-full bg-slate-800 hover:bg-slate-700 text-slate-300 flex items-center justify-center transition-colors cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="relative rounded-2xl overflow-hidden bg-black border border-white/10 aspect-video flex items-center justify-center shadow-inner">
                <video
                  ref={videoRef}
                  autoPlay
                  playsInline
                  muted
                  className="w-full h-full object-cover rounded-2xl"
                />
                <div className="absolute inset-0 border-2 border-dashed border-indigo-400/40 rounded-2xl pointer-events-none flex items-center justify-center p-4">
                  <span className="text-[11px] font-semibold text-white/80 bg-black/60 px-3 py-1.5 rounded-full backdrop-blur-md border border-white/10">
                    Soruyu hizada tutarak fotoğrafı çekin
                  </span>
                </div>
              </div>

              {cameraError && (
                <p className="text-xs text-rose-400 text-center font-medium">{cameraError}</p>
              )}

              <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2 border-t border-white/5">
                <button
                  type="button"
                  onClick={() => {
                    closeCameraModal();
                    cameraInputRef.current?.click();
                  }}
                  className="w-full sm:w-auto px-3.5 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold text-xs rounded-xl flex items-center justify-center gap-2 border border-white/10 transition-all cursor-pointer"
                >
                  <Camera className="w-3.5 h-3.5 text-indigo-400" />
                  <span>Cihaz Kamerasını Aç</span>
                </button>

                <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
                  <button
                    type="button"
                    onClick={closeCameraModal}
                    className="px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs rounded-xl transition-all cursor-pointer"
                  >
                    İptal
                  </button>
                  <button
                    type="button"
                    onClick={handleCapturePhoto}
                    className="px-5 py-2.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-extrabold text-xs rounded-xl flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/20 transition-all active:scale-95 cursor-pointer"
                  >
                    <Camera className="w-4 h-4" />
                    <span>Fotoğrafı Çek</span>
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}

