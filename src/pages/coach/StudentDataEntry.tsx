import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useStudent } from '../../lib/StudentContext';
import { useAuth } from '../../lib/AuthContext';
import { tourService } from '../../services/tourService';
import { studentDataService } from '../../services/studentDataService';
import { useCurriculum } from '../../lib/CurriculumContext';
import { OnboardingTour, TourStep } from '../../components/OnboardingTour';
import { 
  ClipboardCheck, 
  BookOpen, 
  Book,
  Trophy, 
  Save,
  Plus,
  Trash2,
  TrendingUp,
  AlertCircle,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Youtube,
  FileText,
  ArrowUp,
  ArrowDown,
  Sparkles,
  ExternalLink,
  Layers,
  ChevronRight,
  Camera,
  BookmarkCheck,
  Check,
  Target
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

import { BRANCH_CONFIG } from '../../constants/branchConfig';
import { getYoutubeChannelsForSubject } from '../../constants/youtubeChannels';
import { formatSubjectName } from './StudentProgram';
import { calculateBookProgress as calculateBookProgressUtil, getSafePercentage, getCurriculumTopicsForBook } from '../../utils/bookProgress';
import { SAMPLE_DEMO_STUDENT } from './CoachStudents';
import NoStudentSelected from '../../components/NoStudentSelected';
import { BarcodeScannerModal } from '../../components/BarcodeScannerModal';
import DenemeResultModal from '../../components/DenemeResultModal';

export default function StudentDataEntry() {
  const { user, userData } = useAuth();
  const { curriculum: CURRICULUM, subtopics: SUBTOPICS_MAP } = useCurriculum();
  const { selectedStudent, setSelectedStudent } = useStudent();
  const location = useLocation();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [expandedBook, setExpandedBook] = useState<string | null>(null);
  const [expandedSubtopics, setExpandedSubtopics] = useState<Record<string, boolean>>({});
  const [isTourOpen, setIsTourOpen] = useState(false);
  const [showCoachDenemeModal, setShowCoachDenemeModal] = useState(false);
  const [coachDenemeData, setCoachDenemeData] = useState<any>(null);

  useEffect(() => {
    if (tourService.shouldAutoStartTour('student_data_entry', userData, location.state?.startTour)) {
      if (!selectedStudent) {
        setSelectedStudent(SAMPLE_DEMO_STUDENT);
      }
      const timer = setTimeout(() => {
        setIsTourOpen(true);
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [selectedStudent, setSelectedStudent, location.state, userData]);

  const handleEndTour = () => {
    setIsTourOpen(false);
    tourService.markTourCompleted('student_data_entry', user?.uid);
    if (selectedStudent?.isDemo) {
      setSelectedStudent(null);
      navigate('/panel/koc');
    }
  };

  const tourSteps: TourStep[] = [
    {
      targetId: 'tour-data-entry-header',
      title: 'Kaynak & Kitap Takibi',
      description: 'Öğrencinizin soru bankası, fasikül veya YouTube kanalı takibini buradan kolayca ekleyebilirsiniz.',
      position: 'bottom',
      badge: 'Kaynak Yönetimi'
    },
    {
      targetId: 'tour-data-entry-list',
      title: 'Konu İlerleme Durumu',
      description: 'Eklenen her kaynak, müfredat konularıyla eşleşir. Konular bittikçe işaretleyebilirsiniz.',
      position: 'top',
      badge: 'Gelişim Takibi'
    }
  ];

  // Book Tracking State
  const [books, setBooks] = useState<any[]>([]);
  const [globalBooks, setGlobalBooks] = useState<any[]>([]);
  const [newBook, setNewBook] = useState<{
    resourceType: string;
    type: string;
    subject: string;
    name: string;
    globalBookId: string;
    isbn: string;
    coveredTopics: string[];
    totalExamCount?: number;
    initialPastSolvedCount?: number;
    denemeCategory?: 'branch' | 'general';
  }>({
    resourceType: 'soru',
    type: 'TYT',
    subject: 'Türkçe',
    name: '',
    globalBookId: '',
    isbn: '',
    coveredTopics: [],
    totalExamCount: 10,
    initialPastSolvedCount: 0,
    denemeCategory: 'branch'
  });
  const [customFasikulTopic, setCustomFasikulTopic] = useState('');
  const [isManualEntry, setIsManualEntry] = useState(false);
  const [isScannerOpen, setIsScannerOpen] = useState(false);
  const [bookSearchTerm, setBookSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState('soru');
  const [subjectFilter, setSubjectFilter] = useState('Hepsi');
  const [selectedYoutubeChannel, setSelectedYoutubeChannel] = useState('');
  const [customYoutubeChannel, setCustomYoutubeChannel] = useState('');

  const normalizeIsbn = (s: string) => (s || '').replace(/[^a-zA-Z0-9]/g, '').toLowerCase();

  const getYoutubeChannels = (subject: string) => {
    const staticChannels = getYoutubeChannelsForSubject(subject);
    const key = (subject || '').toLowerCase().trim();
    const cleanKey = key.replace(/^ayt\s+/, '').replace(/^tyt\s+/, '');
    const dynamicChannels = globalBooks
      .filter(b => b.resourceType === 'youtube' && (
        (b.subject || '').toLowerCase() === key ||
        (b.subject || '').toLowerCase().includes(key) ||
        (b.subject || '').toLowerCase().includes(cleanKey) ||
        key.includes((b.subject || '').toLowerCase())
      ))
      .map(b => b.channelTitle || b.name);
    return Array.from(new Set([...staticChannels, ...dynamicChannels])).filter(Boolean);
  };

  const mergeBookData = (trackerList: any[] = [], globalList: any[] = []) => {
    const safeTracker = Array.isArray(trackerList) ? trackerList : [];
    const safeGlobal = Array.isArray(globalList) ? globalList : [];
    return safeTracker.map((tb: any) => {
      let extraInfo: any = {};
      const tbIsbnNorm = normalizeIsbn(tb.isbn);

      const gb = safeGlobal.find((g: any) => {
        if (tb.globalBookId && g.id === tb.globalBookId) return true;
        if (tbIsbnNorm && g.isbn && normalizeIsbn(g.isbn) === tbIsbnNorm) return true;
        if ((g.name || '').trim().toLowerCase() === (tb.bookName || '').trim().toLowerCase() && (g.subject || '').trim().toLowerCase() === (tb.subject || '').trim().toLowerCase()) return true;
        if (tb.resourceType === 'youtube' && g.resourceType === 'youtube' && (
          (g.channelTitle && tb.bookName && g.channelTitle.toLowerCase().includes(tb.bookName.toLowerCase())) ||
          (g.name && tb.bookName && g.name.toLowerCase().includes(tb.bookName.toLowerCase()))
        ) && (g.subject || '').toLowerCase() === (tb.subject || '').toLowerCase()) return true;
        return false;
      });

      if (gb) {
        extraInfo = {
          videos: (Array.isArray(tb.videos) && tb.videos.length > 0) ? tb.videos : (Array.isArray(gb.videos) ? gb.videos : []),
          channelTitle: gb.channelTitle || tb.channelTitle || '',
          totalVideos: gb.totalVideos || (Array.isArray(gb.videos) ? gb.videos.length : 0) || tb.totalVideos || 0,
          totalDurationFormatted: gb.totalDurationFormatted || tb.totalDurationFormatted || '',
          totalDurationMinutes: gb.totalDurationMinutes || tb.totalDurationMinutes || 0,
          topicQuestionCounts: (gb as any).topicQuestionCounts || tb.topicQuestionCounts || {},
          resourceType: tb.resourceType || gb.resourceType || 'soru',
          type: tb.type || gb.type || 'TYT',
          coveredTopics: (Array.isArray(tb.coveredTopics) && tb.coveredTopics.length > 0)
            ? tb.coveredTopics
            : (Array.isArray(gb.coveredTopics) ? gb.coveredTopics : []),
          ...(gb.totalExamCount || tb.totalExamCount ? { totalExamCount: gb.totalExamCount || tb.totalExamCount } : ((tb.resourceType || gb.resourceType) === 'deneme' ? { totalExamCount: 10 } : {}))
        };
      }
      return {
        ...tb,
        resourceType: tb.resourceType || extraInfo.resourceType || 'soru',
        ...(tb.totalExamCount || extraInfo.totalExamCount ? { totalExamCount: tb.totalExamCount || extraInfo.totalExamCount } : (tb.resourceType === 'deneme' ? { totalExamCount: 10 } : {})),
        ...extraInfo
      };
    });
  };

  const getBookItems = (book: any) => {
    if (book.resourceType === 'youtube' || (Array.isArray(book.videos) && book.videos.length > 0)) {
      const vids = Array.isArray(book.videos) ? book.videos : [];
      if (vids.length > 0) {
        return vids.map((v: any, idx: number) => ({
          id: v.videoId || `vid-${idx}`,
          title: typeof v === 'string' ? v : (v.title || `Video ${idx + 1}`),
          duration: typeof v === 'object' ? (v.durationFormatted || (v.durationMinutes ? `${v.durationMinutes} dk` : '')) : '',
          url: typeof v === 'object' ? (v.url || (v.videoId ? `https://www.youtube.com/watch?v=${v.videoId}` : '')) : '',
          order: typeof v === 'object' && v.order ? v.order : idx + 1,
          isVideo: true
        }));
      }
    }
    const curriculumTopics = getCurriculumTopicsForBook(book, CURRICULUM) || [];
    return curriculumTopics.map((topic: string, idx: number) => ({
      id: `topic-${idx}`,
      title: topic,
      duration: '',
      url: '',
      order: idx + 1,
      isVideo: false
    }));
  };

  useEffect(() => {
    if (newBook.resourceType === 'youtube') {
      const channels = getYoutubeChannels(newBook.subject);
      setSelectedYoutubeChannel(channels[0] || 'Diğer (Manuel Giriş)');
      setCustomYoutubeChannel('');
    }
  }, [newBook.subject, newBook.resourceType, globalBooks]);

  useEffect(() => {
    if (selectedStudent) {
      if (selectedStudent.isDemo) {
        const demoBooks = [
          { id: 'demo1', name: 'Palme Biyoloji Soru Bankası', subject: 'Biyoloji', resourceType: 'soru', type: 'TYT', completedTopics: ['Canlıların Ortak Özellikleri', 'Canlıların Temel Bileşenleri - 1 (İnorganikler, Karbonhidratlar)', 'Hücre - 1 (Zar, Madde Geçişleri)'], completionPercentage: 75, order: 0 },
          { id: 'demo2', name: 'Biyotik Biyoloji Soru Bankası', subject: 'Biyoloji', resourceType: 'soru', type: 'AYT', completedTopics: ['Canlıların Ortak Özellikleri', 'Hücre - 1 (Zar, Madde Geçişleri)'], completionPercentage: 60, order: 1 },
          { id: 'demo3', name: 'Bilgi Sarmal Fizik Soru Bankası', subject: 'Fizik', resourceType: 'soru', type: 'AYT', completedTopics: ['Vektörler'], completionPercentage: 70, order: 2 },
          { id: 'demo4', name: 'VIP Fizik', subject: 'Fizik', resourceType: 'youtube', type: 'TYT', completedTopics: ['Fizik Bilimine Giriş'], completionPercentage: 30, order: 3 },
        ];
        setBooks(demoBooks);
        setExpandedBook(demoBooks[0].id);
        setGlobalBooks([]);
      } else {
        Promise.all([
          studentDataService.getBookTracking(selectedStudent.uid),
          studentDataService.getGlobalBooks()
        ]).then(([trackingData, globalsData]) => {
          setGlobalBooks(globalsData);
          const merged = mergeBookData(trackingData, globalsData);
          const normalized = merged.map((b: any) => {
            const safePct = calculateBookProgressUtil(b, b.completedTopics || [], CURRICULUM, SUBTOPICS_MAP);
            if ((b.completionPercentage || 0) > 100 || (b.completionPercentage || 0) !== safePct) {
              studentDataService.updateBookProgress(b.id, {
                ...b,
                completionPercentage: safePct
              }).catch(console.error);
            }
            return {
              ...b,
              completionPercentage: safePct
            };
          });
          setBooks(normalized);
          if (normalized && normalized.length > 0) {
            setExpandedBook(normalized[0].id);
          }
        });
      }
    }
  }, [selectedStudent, CURRICULUM, SUBTOPICS_MAP]);

  const ALL_AYT_SUBJECTS = ['AYT Matematik', 'AYT Fizik', 'AYT Kimya', 'AYT Biyoloji', 'Edebiyat', 'AYT Tarih', 'AYT Coğrafya', 'AYT Felsefe', 'AYT Din', 'Yabancı Dil'];

  const getBranchKey = (rawBranch?: string): keyof typeof BRANCH_CONFIG => {
    if (!rawBranch) return 'TYT';
    const b = rawBranch.toUpperCase().trim();
    if (b.includes('SAY')) return 'SAY';
    if (b.includes('EA') || b.includes('EŞİT') || b.includes('ESIT')) return 'EA';
    if (b.includes('SÖZ') || b.includes('SOZ')) return 'SÖZ';
    if (b.includes('DİL') || b.includes('DIL') || b.includes('YDT') || b.includes('İNG') || b.includes('ING')) return 'DİL';
    return 'TYT';
  };

  const isAraSinif = ['9. Sınıf', '10. Sınıf', '11. Sınıf'].includes(selectedStudent?.grade || '');
  const activeBranchKey = isAraSinif 
    ? (selectedStudent?.grade as string)
    : getBranchKey(selectedStudent?.branch);
  const currentBranchInfo = BRANCH_CONFIG[activeBranchKey] || { subjects: [], aytSubjects: [] };
  const subjectOptions = newBook.type === 'TYT' 
    ? BRANCH_CONFIG['TYT'].subjects 
    : newBook.type === 'AYT' 
      ? (currentBranchInfo.aytSubjects && currentBranchInfo.aytSubjects.length > 0 ? currentBranchInfo.aytSubjects : ALL_AYT_SUBJECTS)
      : BRANCH_CONFIG[newBook.type]?.subjects || [];

  // Auto-select first subject when type changes to prevent invalid subject selection
  useEffect(() => {
    if (subjectOptions.length > 0 && !subjectOptions.includes(newBook.subject)) {
      setNewBook(prev => ({ ...prev, subject: subjectOptions[0] }));
    }
  }, [newBook.type, subjectOptions]);

  const calculateBookProgress = (book: any, completedTopics: string[]) => {
    return calculateBookProgressUtil(book, completedTopics, CURRICULUM, SUBTOPICS_MAP);
  };

  const toggleTopic = async (book: any, topic: string) => {
    if (selectedStudent?.isDemo) return;
    const currentTopics = book.completedTopics || [];
    let updatedTopics;
    if (currentTopics.includes(topic)) {
      updatedTopics = currentTopics.filter((t: string) => t !== topic);
    } else {
      updatedTopics = [...currentTopics, topic];
    }

    const percentage = calculateBookProgress(book, updatedTopics);

    await studentDataService.updateBookProgress(book.id, {
      ...book,
      completedTopics: updatedTopics,
      completionPercentage: percentage
    });
    
    const [updatedTracking, globals] = await Promise.all([
      studentDataService.getBookTracking(selectedStudent!.uid),
      studentDataService.getGlobalBooks()
    ]);
    setBooks(mergeBookData(updatedTracking, globals));
  };

  const toggleMainTopic = async (book: any, topic: string, subtopics: string[]) => {
    if (selectedStudent?.isDemo) return;
    const currentTopics = book.completedTopics || [];
    const isTopicCompleted = currentTopics.includes(topic) || (subtopics.length > 0 && subtopics.every(s => currentTopics.includes(s)));
    
    let updatedTopics: string[];
    if (isTopicCompleted) {
      const toRemove = new Set([topic, ...subtopics]);
      updatedTopics = currentTopics.filter(t => !toRemove.has(t));
    } else {
      const toAdd = [topic, ...subtopics];
      updatedTopics = Array.from(new Set([...currentTopics, ...toAdd]));
    }

    const percentage = calculateBookProgress(book, updatedTopics);

    await studentDataService.updateBookProgress(book.id, {
      ...book,
      completedTopics: updatedTopics,
      completionPercentage: percentage
    });

    const [updatedTracking, globals] = await Promise.all([
      studentDataService.getBookTracking(selectedStudent!.uid),
      studentDataService.getGlobalBooks()
    ]);
    setBooks(mergeBookData(updatedTracking, globals));
  };

  const toggleSubtopic = async (book: any, mainTopic: string, subtopic: string, allSubtopics: string[]) => {
    if (selectedStudent?.isDemo) return;
    const currentTopics = book.completedTopics || [];
    const isSubCompleted = currentTopics.includes(subtopic);
    
    let updatedTopics: string[];
    if (isSubCompleted) {
      updatedTopics = currentTopics.filter(t => t !== subtopic && t !== mainTopic);
    } else {
      const newSubs = [...currentTopics, subtopic];
      const allDone = allSubtopics.every(s => s === subtopic || newSubs.includes(s));
      if (allDone) {
        updatedTopics = Array.from(new Set([...newSubs, mainTopic]));
      } else {
        updatedTopics = newSubs;
      }
    }

    const percentage = calculateBookProgress(book, updatedTopics);

    await studentDataService.updateBookProgress(book.id, {
      ...book,
      completedTopics: updatedTopics,
      completionPercentage: percentage
    });

    const [updatedTracking, globals] = await Promise.all([
      studentDataService.getBookTracking(selectedStudent!.uid),
      studentDataService.getGlobalBooks()
    ]);
    setBooks(mergeBookData(updatedTracking, globals));
  };

  const toggleSubtopicsExpand = (bookId: string, topic: string) => {
    const key = `${bookId}-${topic}`;
    setExpandedSubtopics(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const toggleAllSubtopicsExpand = (book: any, expand: boolean) => {
    const curriculumTopics = getCurriculumTopicsForBook(book, CURRICULUM) || [];
    const updates: Record<string, boolean> = {};
    curriculumTopics.forEach((t: string) => {
      updates[`${book.id}-${t}`] = expand;
    });
    setExpandedSubtopics(prev => ({ ...prev, ...updates }));
  };

  const handleBatchMarkPastDenemeler = async (book: any, count: number) => {
    if (selectedStudent?.isDemo) return;
    const total = Number(book.totalExamCount) || 10;
    const safeCount = Math.min(Math.max(0, count), total);
    const newCompleted: string[] = [];
    for (let i = 1; i <= safeCount; i++) {
      newCompleted.push(`Deneme ${i}`);
    }
    const percentage = Math.round((safeCount / total) * 100);
    const updatedBook = {
      ...book,
      completedTopics: newCompleted,
      completionPercentage: percentage
    };
    await studentDataService.updateBookProgress(book.id, updatedBook);
    setBooks(prev => prev.map(b => b.id === book.id ? updatedBook : b));
  };

  const handleOpenCoachDenemeModal = (book: any, topicName: string) => {
    setCoachDenemeData({
      studentUid: selectedStudent?.uid,
      studentName: selectedStudent?.displayName || selectedStudent?.firstName || '',
      bookId: book.id,
      bookName: book.bookName,
      denemeTopic: topicName,
      subject: book.subject,
      branch: book.type || 'TYT',
      examType: book.type || 'TYT',
      date: new Date().toISOString().split('T')[0]
    });
    setShowCoachDenemeModal(true);
  };

  const liveMatchedBook = React.useMemo(() => {
    if (!newBook.isbn || newBook.isbn.trim().length < 3 || newBook.resourceType === 'youtube') return null;
    const targetNorm = normalizeIsbn(newBook.isbn);
    return globalBooks.find(b => {
      // Must NOT be a youtube resource
      if (b.resourceType === 'youtube' || Boolean(b.channelTitle) || (Array.isArray(b.videos) && b.videos.length > 0)) {
        return false;
      }
      if (!b.isbn) return false;
      return normalizeIsbn(b.isbn) === targetNorm || b.isbn.trim().toLowerCase() === newBook.isbn.trim().toLowerCase();
    });
  }, [newBook.isbn, newBook.resourceType, globalBooks]);

  const handleAddBook = async () => {
    if (selectedStudent?.isDemo) return;
    let finalBookName = '';
    let finalIsbn = '';

    if (newBook.resourceType === 'youtube') {
      if (selectedYoutubeChannel === 'Diğer (Manuel Giriş)') {
        if (!customYoutubeChannel.trim()) {
          alert("Lütfen kanal adını giriniz.");
          return;
        }
        finalBookName = customYoutubeChannel.trim();
      } else {
        finalBookName = selectedYoutubeChannel;
      }
      if (!finalBookName || !finalBookName.trim()) {
        const available = getYoutubeChannels(newBook.subject);
        finalBookName = available[0] || 'Rehber Matematik';
      }
      finalIsbn = '';
    } else {
      if (!newBook.isbn || !newBook.isbn.trim()) {
        alert("Lütfen ISBN numarası / Barkod giriniz.");
        return;
      }
      finalIsbn = newBook.isbn.trim();
    }

    let globalId = newBook.globalBookId;
    let finalSubject = newBook.subject;
    let finalResourceType = newBook.resourceType || 'soru';
    let finalType = newBook.type || 'TYT';
    let extraBookData: any = {};

    const targetIsbnNorm = finalIsbn ? normalizeIsbn(finalIsbn) : '';

    if (newBook.resourceType === 'youtube') {
      const searchSubject = (newBook.subject || '').toLowerCase().trim();
      const cleanSubject = searchSubject.replace(/^ayt\s+/, '').replace(/^tyt\s+/, '');

      const existingYoutube = globalBooks.find(b => {
        if (b.resourceType !== 'youtube' && !b.channelTitle) return false;
        const bChannel = (b.channelTitle || '').toLowerCase().trim();
        const bName = (b.name || '').toLowerCase().trim();
        const targetName = finalBookName.toLowerCase().trim();
        const nameMatches = bChannel === targetName || bName.includes(targetName) || targetName.includes(bChannel);
        if (!nameMatches) return false;

        const bSubject = (b.subject || '').toLowerCase().trim();
        const bCleanSubject = bSubject.replace(/^ayt\s+/, '').replace(/^tyt\s+/, '');
        const bType = (b.type || '').toUpperCase().trim();
        const targetType = (newBook.type || 'TYT').toUpperCase().trim();

        const subjectMatches = bSubject === searchSubject || 
                               bCleanSubject === cleanSubject || 
                               bSubject.includes(searchSubject) || 
                               searchSubject.includes(bSubject);
        const typeMatches = !bType || bType === targetType || (targetType === 'AYT' && bSubject.startsWith('ayt'));

        return subjectMatches && typeMatches;
      });

      if (existingYoutube) {
        globalId = existingYoutube.id;
        finalBookName = existingYoutube.name;
        finalSubject = existingYoutube.subject || finalSubject;
        finalType = existingYoutube.type || finalType;
        finalResourceType = 'youtube';
        extraBookData = {
          videos: existingYoutube.videos || [],
          channelTitle: existingYoutube.channelTitle || finalBookName,
          totalVideos: existingYoutube.totalVideos || existingYoutube.videos?.length || 0,
          totalDurationFormatted: existingYoutube.totalDurationFormatted || '',
          totalDurationMinutes: existingYoutube.totalDurationMinutes || 0,
          topicQuestionCounts: existingYoutube.topicQuestionCounts || {}
        };
      } else {
        const generatedName = `${finalBookName} - ${newBook.subject} Video Serisi`;
        globalId = await studentDataService.saveGlobalBook({
          name: generatedName,
          subject: newBook.subject,
          type: newBook.type,
          resourceType: 'youtube',
          channelTitle: finalBookName,
          isbn: '',
          videos: [],
          totalVideos: 0,
          totalDurationMinutes: 0,
          topicQuestionCounts: {}
        });
        finalBookName = generatedName;
        finalResourceType = 'youtube';
      }
    } else {
      // Physical Book (Soru Bankası / Konu Fasikülü) by strictly searching ISBN in global_books
      const existingGlobal = globalBooks.find(b => {
        if (b.resourceType === 'youtube' || Boolean(b.channelTitle) || (Array.isArray(b.videos) && b.videos.length > 0)) {
          return false;
        }
        if (!b.isbn) return false;
        return normalizeIsbn(b.isbn) === targetIsbnNorm || b.isbn.trim().toLowerCase() === finalIsbn.toLowerCase();
      });

      if (existingGlobal) {
        globalId = existingGlobal.id;
        finalBookName = existingGlobal.name;
        finalSubject = existingGlobal.subject || finalSubject;
        finalType = existingGlobal.type || finalType;
        finalResourceType = existingGlobal.resourceType || 'soru';
        finalIsbn = existingGlobal.isbn || finalIsbn;
        extraBookData = {
          topicQuestionCounts: existingGlobal.topicQuestionCounts || {},
          coveredTopics: existingGlobal.coveredTopics || [],
          ...(existingGlobal.totalExamCount ? { totalExamCount: existingGlobal.totalExamCount } : {}),
          ...(existingGlobal.denemeCategory ? { denemeCategory: existingGlobal.denemeCategory } : {})
        };
      } else {
        if (!isManualEntry) {
          setIsManualEntry(true);
          return;
        }
        if (!newBook.name || !newBook.name.trim()) {
          alert("Lütfen kaynak adını giriniz.");
          return;
        }

        finalBookName = newBook.name.trim();
        finalSubject = newBook.subject;
        finalType = newBook.type;
        finalResourceType = newBook.resourceType || 'soru';

        const fasikulTopics = finalResourceType === 'fasikul' ? (newBook.coveredTopics || []) : [];
        const denemeTotalCount = finalResourceType === 'deneme' ? (Number(newBook.totalExamCount) || 10) : undefined;
        const denemeCat = finalResourceType === 'deneme' ? (newBook.denemeCategory || 'branch') : undefined;

        if (finalResourceType === 'deneme' && denemeCat === 'general') {
          finalSubject = 'Genel Deneme';
        }

        const globalBookPayload: any = {
          name: finalBookName,
          subject: finalSubject,
          type: finalType,
          resourceType: finalResourceType,
          isbn: finalIsbn,
          topicQuestionCounts: {},
          coveredTopics: fasikulTopics
        };

        if (finalResourceType === 'deneme') {
          globalBookPayload.totalExamCount = denemeTotalCount || 10;
          globalBookPayload.denemeCategory = denemeCat || 'branch';
        }

        globalId = await studentDataService.saveGlobalBook(globalBookPayload);

        extraBookData = {
          ...extraBookData,
          coveredTopics: fasikulTopics,
          ...(finalResourceType === 'deneme' ? {
            totalExamCount: denemeTotalCount || 10,
            denemeCategory: denemeCat || 'branch'
          } : {})
        };
      }
    }

    // Check if student already has this book
    const alreadyTracked = books.find(b => {
      if (finalResourceType === 'youtube') {
        if (globalId && b.globalBookId === globalId) return true;
        const bName = (b.bookName || b.name || '').trim().toLowerCase();
        const tName = finalBookName.trim().toLowerCase();
        const bSubject = (b.subject || '').trim().toLowerCase();
        const tSubject = finalSubject.trim().toLowerCase();
        const bType = (b.type || 'TYT').toUpperCase();
        const tType = (finalType || 'TYT').toUpperCase();
        return (b.resourceType === 'youtube') && 
               (bName === tName || bName.includes(tName) || tName.includes(bName)) && 
               (bSubject === tSubject) && 
               (bType === tType);
      }
      if (globalId && b.globalBookId === globalId) return true;
      if (finalIsbn && b.isbn && normalizeIsbn(b.isbn) === targetIsbnNorm) return true;
      if (b.resourceType === finalResourceType && 
          (b.bookName || '').trim().toLowerCase() === finalBookName.toLowerCase() && 
          (b.subject || '').trim().toLowerCase() === finalSubject.toLowerCase()) {
        return true;
      }
      return false;
    });

    if (alreadyTracked) {
      const trackedTab = alreadyTracked.resourceType || 'soru';
      setActiveTab(trackedTab);
      setSubjectFilter('Hepsi');
      setExpandedBook(alreadyTracked.id);
      alert(`Bu kaynak ("${alreadyTracked.bookName || finalBookName}") zaten öğrencinin listesinde kayıtlı. İlgili sekmeye yönlendirildiniz.`);
      setNewBook({ resourceType: newBook.resourceType, type: newBook.type, subject: newBook.subject, name: '', globalBookId: '', isbn: '', coveredTopics: [], totalExamCount: 10, initialPastSolvedCount: 0 });
      setCustomFasikulTopic('');
      setIsManualEntry(false);
      return;
    }

    // Determine order
    const existingBooksInTab = books.filter(b => (b.resourceType || 'soru') === finalResourceType);
    const maxOrder = existingBooksInTab.reduce((max, b) => Math.max(max, b.order || 0), -1);
    const newOrder = maxOrder + 1;

    // Initial completion setup for deneme if coach marked past solved denemes
    let initialCompletedTopics: string[] = [];
    let initialCompletionPercentage = 0;
    if (finalResourceType === 'deneme') {
      const totalCount = extraBookData.totalExamCount || newBook.totalExamCount || 10;
      const pastCount = Math.min(totalCount, Math.max(0, newBook.initialPastSolvedCount || 0));
      for (let i = 1; i <= pastCount; i++) {
        initialCompletedTopics.push(`Deneme ${i}`);
      }
      initialCompletionPercentage = Math.round((initialCompletedTopics.length / totalCount) * 100);
    }

    const newTrackId = await studentDataService.updateBookProgress(null, {
      studentId: selectedStudent!.uid,
      subject: finalSubject,
      bookName: finalBookName,
      type: finalType,
      globalBookId: globalId,
      resourceType: finalResourceType,
      isbn: finalIsbn,
      completedTopics: initialCompletedTopics,
      completionPercentage: initialCompletionPercentage,
      order: newOrder,
      ...extraBookData
    });

    setNewBook({ resourceType: newBook.resourceType, type: newBook.type, subject: newBook.subject, name: '', globalBookId: '', isbn: '', coveredTopics: [], totalExamCount: 10, initialPastSolvedCount: 0 });
    setCustomFasikulTopic('');
    setIsManualEntry(false);
    setBookSearchTerm('');
    setCustomYoutubeChannel('');
    
    // Automatically switch active tab to where the book is, and reset filter
    setActiveTab(finalResourceType);
    setSubjectFilter('Hepsi');

    const [updatedTracking, updatedGlobals] = await Promise.all([
      studentDataService.getBookTracking(selectedStudent!.uid),
      studentDataService.getGlobalBooks()
    ]);
    setGlobalBooks(updatedGlobals);
    const merged = mergeBookData(updatedTracking, updatedGlobals);
    setBooks(merged);
    
    if (newTrackId) {
      setExpandedBook(newTrackId);
    }
  };

  const handleDeleteBook = async (bookId: string) => {
    if (!window.confirm("Bu kaynağı silmek istediğinize emin misiniz?")) return;
    
    await studentDataService.deleteBookTracking(bookId);
    if (selectedStudent) {
       const [updatedTracking, updatedGlobals] = await Promise.all([
         studentDataService.getBookTracking(selectedStudent.uid),
         studentDataService.getGlobalBooks()
       ]);
       setBooks(mergeBookData(updatedTracking, updatedGlobals));
    }
  };

  const handleMoveBook = async (e: React.MouseEvent, book: any, direction: 'up' | 'down') => {
    e.stopPropagation();
    if (selectedStudent?.isDemo) return;
    if (subjectFilter === 'Hepsi') {
       alert("Sıralama değiştirmek için önce belirli bir branş seçmelisiniz.");
       return;
    }
    
    // Yalnızca ekrana yansıyan sırayı alıyoruz. 
    // Öncesinde order değeri undefined olanları en sona atmak için MAX_SAFE_INTEGER diyoruz
    const filteredBooks = books
      .filter(b => (b.resourceType || 'soru') === activeTab)
      .filter(b => subjectFilter === 'Hepsi' || b.subject === subjectFilter)
      .sort((a, b) => {
         const orderA = a.order !== undefined ? a.order : Number.MAX_SAFE_INTEGER;
         const orderB = b.order !== undefined ? b.order : Number.MAX_SAFE_INTEGER;
         return orderA - orderB;
      });

    const currentIndex = filteredBooks.findIndex(b => b.id === book.id);
    if (currentIndex === -1) return;
    
    const targetIndex = direction === 'up' ? currentIndex - 1 : currentIndex + 1;
    if (targetIndex < 0 || targetIndex >= filteredBooks.length) return;
    
    // İşlem yapılacak hedefi belirliyoruz
    const targetBook = filteredBooks[targetIndex];
    
    // Birbirleriyle yer değişecek olan index değerleri
    const newOrderForCurrent = targetIndex;
    const newOrderForTarget = currentIndex;
    
    // Tüm listeyi ekrandaki haliyle numaralandırıyoruz ki birden fazla undefined varsa çakışma olmasın
    const updates = filteredBooks.map((b, idx) => {
        let newOrder = idx;
        if (idx === currentIndex) newOrder = newOrderForCurrent;
        if (idx === targetIndex) newOrder = newOrderForTarget;
        return { ...b, order: newOrder };
    });

    setBooks(prev => prev.map(pb => {
        const u = updates.find(ub => ub.id === pb.id);
        return u ? u : pb;
    }));
    
    // Değişen her öğeyi arka planda da güncelliyoruz
    await Promise.all(updates.map(ub => 
        studentDataService.updateBookProgress(ub.id, { ...ub })
    ));
  };

  if (!selectedStudent) {
    return <NoStudentSelected />;
  }

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-20">
      <OnboardingTour
        steps={tourSteps}
        isOpen={isTourOpen}
        onClose={handleEndTour}
        onComplete={handleEndTour}
        onNextTour={() => {
          setIsTourOpen(false);
          tourService.markTourCompleted('student_data_entry', user?.uid);
          navigate('/panel/koc/ogrenci/randevular', { state: { startTour: true, isDemo: true } });
        }}
        nextTourLabel="Öğrenci Randevuları Turu"
        tourKey="student_data_entry"
      />

      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold italic text-white uppercase tracking-tight">KAYNAK TAKİBİ</h1>
        <p className="text-slate-500 mt-1">{selectedStudent?.displayName} akademik ilerleme ve kaynak bitirme raporu.</p>
      </div>

      <div className="space-y-8">
        {/* Add Book Form */}
        <div id="tour-data-entry-header" className="bg-white/5 border border-white/5 rounded-3xl p-8">
           <h3 className="text-lg font-bold mb-6 italic uppercase tracking-tighter">Yeni Kaynak Ekle</h3>
           
           <div className="mb-6 flex flex-wrap gap-4">
              <label className="flex items-center gap-2 cursor-pointer">
                 <input type="radio" name="rType" value="soru" checked={newBook.resourceType === 'soru'} onChange={() => { setNewBook({...newBook, resourceType: 'soru', globalBookId: '', name: '', coveredTopics: []}); setIsManualEntry(false); }} className="text-indigo-500" />
                 <span className="text-sm text-slate-300">Soru Bankası</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                 <input type="radio" name="rType" value="fasikul" checked={newBook.resourceType === 'fasikul'} onChange={() => { setNewBook({...newBook, resourceType: 'fasikul', globalBookId: '', name: ''}); setIsManualEntry(false); }} className="text-purple-500" />
                 <span className="text-sm text-purple-300 font-semibold flex items-center gap-1.5">
                   <BookmarkCheck size={15} className="text-purple-400" />
                   Soru Fasikülü
                 </span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                 <input type="radio" name="rType" value="konu" checked={newBook.resourceType === 'konu'} onChange={() => { setNewBook({...newBook, resourceType: 'konu', globalBookId: '', name: '', coveredTopics: []}); setIsManualEntry(false); }} className="text-indigo-500" />
                 <span className="text-sm text-slate-300">Konu Anlatımı</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                 <input type="radio" name="rType" value="deneme" checked={newBook.resourceType === 'deneme'} onChange={() => { setNewBook({...newBook, resourceType: 'deneme', globalBookId: '', name: '', coveredTopics: []}); setIsManualEntry(false); }} className="text-rose-500" />
                 <span className="text-sm text-rose-300 font-semibold flex items-center gap-1.5">
                   <Target size={15} className="text-rose-400" />
                   Deneme Sınavı
                 </span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                 <input type="radio" name="rType" value="youtube" checked={newBook.resourceType === 'youtube'} onChange={() => { setNewBook({...newBook, resourceType: 'youtube', globalBookId: '', name: '', coveredTopics: []}); setIsManualEntry(false); }} className="text-indigo-500" />
                 <span className="text-sm text-slate-300">YouTube Kanalı / Video</span>
              </label>
           </div>

           <div className="grid grid-cols-1 md:grid-cols-5 gap-6 items-end">
                {/* YouTube selects are always shown if youtube */}
                {newBook.resourceType === 'youtube' ? (
                  <>
                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest pl-1">Alan türü</label>
                      <select 
                        value={newBook.type}
                        onChange={(e) => setNewBook({...newBook, type: e.target.value as any})}
                        className="w-full bg-slate-900 border border-white/10 rounded-xl py-3 px-4 text-xs text-white outline-none"
                      >
                        <option value="TYT">TYT</option>
                        {(!isAraSinif) && <option value="AYT">AYT</option>}
                        <option value="9. Sınıf">9. Sınıf</option>
                        <option value="10. Sınıf">10. Sınıf</option>
                        <option value="11. Sınıf">11. Sınıf</option>
                      </select>
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest pl-1">Ders</label>
                      <select 
                        value={newBook.subject}
                        onChange={(e) => setNewBook({...newBook, subject: e.target.value})}
                        className="w-full bg-slate-900 border border-white/10 rounded-xl py-3 px-4 text-xs text-white outline-none"
                      >
                        {subjectOptions.map((s: string) => (
                          <option key={s} value={s}>{formatSubjectName(s, newBook.type)}</option>
                        ))}
                      </select>
                    </div>
                    <div className="md:col-span-2 space-y-2">
                      <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest pl-1">
                        YouTube Kanalı Seçin
                      </label>
                      <div className="flex flex-col sm:flex-row gap-2">
                        <select
                          value={selectedYoutubeChannel}
                          onChange={(e) => setSelectedYoutubeChannel(e.target.value)}
                          className="flex-1 bg-slate-900 border border-white/10 rounded-xl py-3 px-4 text-xs text-white outline-none focus:border-indigo-500/50 cursor-pointer"
                        >
                          {getYoutubeChannels(newBook.subject).map(channel => (
                            <option key={channel} value={channel}>{channel}</option>
                          ))}
                          <option value="Diğer (Manuel Giriş)">Diğer (Manuel Giriş)</option>
                        </select>
                        {selectedYoutubeChannel === 'Diğer (Manuel Giriş)' && (
                          <input 
                            type="text"
                            placeholder="Kanal adını giriniz..."
                            value={customYoutubeChannel}
                            onChange={e => setCustomYoutubeChannel(e.target.value)}
                            className="flex-1 bg-slate-900 border border-white/10 rounded-xl py-3 px-4 text-xs text-white outline-none focus:border-indigo-500/50"
                            autoFocus
                          />
                        )}
                      </div>
                    </div>
                    <button 
                      onClick={handleAddBook}
                      className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-3 px-6 rounded-xl transition-all flex items-center justify-center gap-2"
                    >
                      <Plus size={16} /> Kanal Ekle
                    </button>
                  </>
                ) : (
                  <>
                    {!isManualEntry ? (
                      // Only show ISBN input
                      <>
                        <div className="md:col-span-4 space-y-2">
                          <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest pl-1 flex items-center justify-between">
                            <span>ISBN Numarası (Barkod)</span>
                            <span className="text-slate-400 font-normal lowercase text-[11px]">13 haneli barkod numarasını giriniz veya kamerayla okutunuz</span>
                          </label>
                          <div className="flex gap-2">
                            <input 
                              type="text"
                              placeholder="ISBN / Barkod giriniz (Örn: 978605...)"
                              value={newBook.isbn}
                              onChange={e => setNewBook({...newBook, isbn: e.target.value})}
                              onKeyDown={e => {
                                 if (e.key === 'Enter') handleAddBook();
                              }}
                              className="flex-1 bg-slate-900 border border-white/10 rounded-xl py-3 px-4 text-xs text-white outline-none focus:border-indigo-500/50"
                              autoFocus
                            />
                            <button
                              type="button"
                              onClick={() => setIsScannerOpen(true)}
                              className="px-4 py-3 bg-indigo-600/20 hover:bg-indigo-600/30 text-indigo-300 border border-indigo-500/30 hover:border-indigo-500/60 rounded-xl text-xs font-bold transition-all flex items-center gap-2 shrink-0 shadow-sm"
                              title="Kamerayla Barkod Tara"
                            >
                              <Camera size={16} className="text-indigo-400" />
                              <span className="hidden sm:inline">Kamera ile Tara</span>
                              <span className="sm:hidden">Barkod</span>
                            </button>
                          </div>
                          {liveMatchedBook && (
                            <div className="mt-2 p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-xl flex items-center justify-between text-xs text-emerald-400">
                              <div className="flex items-center gap-2.5">
                                <CheckCircle2 size={18} className="shrink-0 text-emerald-400" />
                                <div>
                                  <span className="font-bold text-white block text-sm">{liveMatchedBook.name}</span>
                                  <span className="text-[11px] text-emerald-300">
                                    {liveMatchedBook.subject} • {liveMatchedBook.type} • {
                                      liveMatchedBook.resourceType === 'fasikul' 
                                        ? 'Soru Fasikülü' 
                                        : liveMatchedBook.resourceType === 'deneme'
                                          ? 'Deneme Sınavı'
                                          : liveMatchedBook.resourceType === 'konu' 
                                            ? 'Konu Anlatımı' 
                                            : 'Soru Bankası'
                                    }
                                  </span>
                                  {liveMatchedBook.resourceType === 'fasikul' && Array.isArray(liveMatchedBook.coveredTopics) && liveMatchedBook.coveredTopics.length > 0 && (
                                    <div className="text-[11px] text-purple-300 mt-1 flex items-center gap-1.5 font-medium">
                                      <BookmarkCheck size={13} className="text-purple-400 shrink-0" />
                                      <span>Kapsam: {liveMatchedBook.coveredTopics.join(', ')}</span>
                                    </div>
                                  )}
                                </div>
                              </div>
                              <span className="text-[10px] uppercase font-black bg-emerald-500/20 px-2.5 py-1 rounded-lg">Veritabanında Kayıtlı</span>
                            </div>
                          )}
                        </div>
                        <button 
                          onClick={handleAddBook}
                          className={`font-bold py-3 px-6 rounded-xl transition-all flex items-center justify-center gap-2 text-white shadow-lg ${
                            liveMatchedBook 
                              ? 'bg-emerald-600 hover:bg-emerald-500 shadow-emerald-600/20' 
                              : 'bg-indigo-600 hover:bg-indigo-500 shadow-indigo-600/20'
                          }`}
                        >
                          {liveMatchedBook ? (
                            <>
                              <Plus size={16} /> Öğrenciye Ekle
                            </>
                          ) : (
                            <>
                              <Plus size={16} /> Sorgula / Ekle
                            </>
                          )}
                        </button>
                      </>
                    ) : (
                      // Manual Entry Fields
                      <div className="md:col-span-5 bg-slate-900/80 border border-amber-500/30 p-5 rounded-2xl space-y-4">
                        <div className="flex items-center justify-between border-b border-white/5 pb-3">
                          <div className="flex items-center gap-2 text-amber-400 text-xs font-bold">
                            <Sparkles size={16} />
                            <span>Barkod sistemde bulunamadı. Yeni kaynak kaydı oluşturun ve öğrenciye ekleyin:</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-mono font-bold bg-black/40 text-slate-300 px-2.5 py-1 rounded-lg border border-white/10">
                              ISBN: {newBook.isbn}
                            </span>
                            <button
                              type="button"
                              onClick={() => setIsScannerOpen(true)}
                              className="p-1.5 bg-indigo-500/20 text-indigo-300 rounded-lg hover:bg-indigo-500/30 transition-colors"
                              title="Yeniden Barkod Tara"
                            >
                              <Camera size={14} />
                            </button>
                          </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
                          <div className="space-y-1.5">
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Materyal Tipi</label>
                            <select 
                              value={newBook.resourceType || 'soru'}
                              onChange={(e) => {
                                const rt = e.target.value;
                                setNewBook({
                                  ...newBook, 
                                  resourceType: rt as any,
                                  subject: (rt === 'deneme' && newBook.denemeCategory === 'general') ? 'Genel Deneme' : (newBook.subject === 'Genel Deneme' ? subjectOptions[0] || 'Türkçe' : newBook.subject)
                                });
                              }}
                              className="w-full bg-slate-800 border border-white/10 rounded-xl py-2.5 px-3 text-xs text-white outline-none focus:border-amber-500/50"
                            >
                              <option value="soru">Soru Bankası</option>
                              <option value="fasikul">Soru Fasikülü</option>
                              <option value="deneme">Deneme Sınavı</option>
                              <option value="konu">Konu Anlatımı</option>
                            </select>
                          </div>
                          <div className="space-y-1.5">
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Alan Türü</label>
                            <select 
                              value={newBook.type}
                              onChange={(e) => setNewBook({...newBook, type: e.target.value as any})}
                              className="w-full bg-slate-800 border border-white/10 rounded-xl py-2.5 px-3 text-xs text-white outline-none focus:border-amber-500/50"
                            >
                              <option value="TYT">TYT</option>
                              {(!isAraSinif) && <option value="AYT">AYT</option>}
                              <option value="9. Sınıf">9. Sınıf</option>
                              <option value="10. Sınıf">10. Sınıf</option>
                              <option value="11. Sınıf">11. Sınıf</option>
                            </select>
                          </div>
                          <div className="space-y-1.5">
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                              {newBook.resourceType === 'deneme' && newBook.denemeCategory === 'general' ? 'Kapsam' : 'Ders'}
                            </label>
                            {newBook.resourceType === 'deneme' && newBook.denemeCategory === 'general' ? (
                              <div className="w-full bg-slate-800/80 border border-white/10 rounded-xl py-2.5 px-3 text-xs text-rose-300 font-bold flex items-center gap-1.5">
                                <Target size={13} className="text-rose-400" />
                                <span>Tüm Branşlar (Genel Deneme)</span>
                              </div>
                            ) : (
                              <select 
                                value={newBook.subject}
                                onChange={(e) => setNewBook({...newBook, subject: e.target.value})}
                                className="w-full bg-slate-800 border border-white/10 rounded-xl py-2.5 px-3 text-xs text-white outline-none focus:border-amber-500/50"
                              >
                                {subjectOptions.map((s: string) => (
                                  <option key={s} value={s}>{formatSubjectName(s, newBook.type)}</option>
                                ))}
                              </select>
                            )}
                          </div>
                          <div className="space-y-1.5">
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Kaynak / Kitap Adı</label>
                            <input 
                              type="text"
                              placeholder={newBook.resourceType === 'deneme' ? 'Örn: 3D TYT Matematik 10\'lu Deneme' : 'Örn: Apotemi Trigonometri Fasikülü'}
                              value={newBook.name}
                              onChange={(e) => setNewBook({...newBook, name: e.target.value})}
                              onKeyDown={e => {
                                 if (e.key === 'Enter') handleAddBook();
                              }}
                              className="w-full bg-slate-800 border border-white/10 rounded-xl py-2.5 px-3 text-xs text-white outline-none focus:border-amber-500/50"
                              autoFocus
                            />
                          </div>
                        </div>

                        {/* Fasikül Scope Selection in Manual Entry */}
                        {newBook.resourceType === 'fasikul' && (
                          <div className="bg-purple-950/40 border border-purple-500/30 p-4 rounded-xl space-y-3">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-2">
                                <BookmarkCheck size={16} className="text-purple-400" />
                                <span className="text-xs font-black text-purple-200 uppercase tracking-wider">
                                  Fasikül Kapsamı ({newBook.coveredTopics.length} Konu Seçili)
                                </span>
                              </div>
                              {newBook.coveredTopics.length > 0 && (
                                <button
                                  type="button"
                                  onClick={() => setNewBook({ ...newBook, coveredTopics: [] })}
                                  className="text-[11px] text-purple-400 hover:text-purple-300 underline font-medium"
                                >
                                  Temizle
                                </button>
                              )}
                            </div>
                            <p className="text-[11px] text-purple-300/80">
                              Bu fasikülde yer alan konu(ları) seçiniz. Bu barkod sisteme kaydedildiğinde diğer tüm koçlar için de bu kapsam otomatik olarak geçerli olacaktır.
                            </p>

                            {/* Selected Topics Badges */}
                            {newBook.coveredTopics.length > 0 && (
                              <div className="flex flex-wrap gap-1.5 p-2 bg-black/40 rounded-lg border border-purple-500/20">
                                {newBook.coveredTopics.map((topic, idx) => (
                                  <span
                                    key={idx}
                                    className="inline-flex items-center gap-1.5 bg-purple-600/30 border border-purple-500/40 text-purple-200 text-xs px-2.5 py-1 rounded-lg font-medium"
                                  >
                                    <Check size={12} className="text-purple-400" />
                                    <span>{topic}</span>
                                    <button
                                      type="button"
                                      onClick={() => setNewBook({
                                        ...newBook,
                                        coveredTopics: newBook.coveredTopics.filter(t => t !== topic)
                                      })}
                                      className="text-purple-300 hover:text-white ml-0.5"
                                    >
                                      ✕
                                    </button>
                                  </span>
                                ))}
                              </div>
                            )}

                            {/* Curriculum Topics */}
                            <div>
                              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">
                                {newBook.subject} ({newBook.type}) Müfredatından Konu Seçin:
                              </label>
                              <div className="flex flex-wrap gap-1.5 max-h-32 overflow-y-auto p-2 bg-black/20 rounded-lg border border-white/5">
                                {getCurriculumTopicsForBook({ subject: newBook.subject, type: newBook.type }, CURRICULUM).map((top: string) => {
                                  const isSelected = newBook.coveredTopics.includes(top);
                                  return (
                                    <button
                                      key={top}
                                      type="button"
                                      onClick={() => {
                                        if (isSelected) {
                                          setNewBook({
                                            ...newBook,
                                            coveredTopics: newBook.coveredTopics.filter(t => t !== top)
                                          });
                                        } else {
                                          setNewBook({
                                            ...newBook,
                                            coveredTopics: [...newBook.coveredTopics, top]
                                          });
                                        }
                                      }}
                                      className={`text-xs px-2.5 py-1 rounded-lg font-medium transition-all text-left flex items-center gap-1.5 ${
                                        isSelected
                                          ? 'bg-purple-600 text-white shadow-sm'
                                          : 'bg-white/5 hover:bg-white/10 text-slate-300 hover:text-white border border-white/5'
                                      }`}
                                    >
                                      {isSelected ? <Check size={12} /> : <Plus size={12} />}
                                      <span>{top}</span>
                                    </button>
                                  );
                                })}
                              </div>
                            </div>

                            {/* Custom topic add */}
                            <div className="flex gap-2 pt-1">
                              <input
                                type="text"
                                value={customFasikulTopic}
                                onChange={(e) => setCustomFasikulTopic(e.target.value)}
                                onKeyDown={(e) => {
                                  if (e.key === 'Enter') {
                                    e.preventDefault();
                                    if (customFasikulTopic.trim() && !newBook.coveredTopics.includes(customFasikulTopic.trim())) {
                                      setNewBook({
                                        ...newBook,
                                        coveredTopics: [...newBook.coveredTopics, customFasikulTopic.trim()]
                                      });
                                      setCustomFasikulTopic('');
                                    }
                                  }
                                }}
                                placeholder="Özel konu / fasikül başlığı ekle..."
                                className="flex-1 bg-black/40 border border-purple-500/30 rounded-lg px-3 py-1.5 text-xs text-white outline-none focus:border-purple-400 placeholder-purple-300/40"
                              />
                              <button
                                type="button"
                                onClick={() => {
                                  if (customFasikulTopic.trim() && !newBook.coveredTopics.includes(customFasikulTopic.trim())) {
                                    setNewBook({
                                      ...newBook,
                                      coveredTopics: [...newBook.coveredTopics, customFasikulTopic.trim()]
                                    });
                                    setCustomFasikulTopic('');
                                  }
                                }}
                                className="px-3 py-1.5 bg-purple-600 hover:bg-purple-500 text-white rounded-lg text-xs font-bold transition-colors"
                              >
                                Ekle
                              </button>
                            </div>
                          </div>
                        )}

                        {/* Deneme Scope & Past Setting Selection in Manual Entry */}
                        {newBook.resourceType === 'deneme' && (
                          <div className="bg-rose-950/40 border border-rose-500/30 p-4 rounded-xl space-y-4">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-2">
                                <Target size={16} className="text-rose-400" />
                                <span className="text-xs font-black text-rose-200 uppercase tracking-wider">
                                  Deneme Paketi Yapılandırması & Başlangıç Ayarı
                                </span>
                              </div>
                              <span className="text-[10px] font-bold text-rose-300 bg-rose-500/20 px-2 py-0.5 rounded-full border border-rose-500/30">
                                Fiziksel Deneme Paketi
                              </span>
                            </div>

                            {/* Deneme Kategori Seçimi (Branş vs Genel) */}
                            <div className="space-y-1.5">
                              <label className="text-[10px] font-bold text-slate-300 uppercase tracking-wider block">
                                Deneme Sınavı Kapsamı:
                              </label>
                              <div className="grid grid-cols-2 gap-2 bg-black/30 p-1.5 rounded-xl border border-rose-500/20">
                                <button
                                  type="button"
                                  onClick={() => setNewBook({
                                    ...newBook,
                                    denemeCategory: 'branch',
                                    subject: newBook.subject === 'Genel Deneme' ? (subjectOptions[0] || 'Türkçe') : newBook.subject
                                  })}
                                  className={`py-2 px-3 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-2 ${
                                    (newBook.denemeCategory || 'branch') === 'branch'
                                      ? 'bg-rose-600 text-white shadow-md shadow-rose-600/30 border border-rose-400/50'
                                      : 'text-slate-400 hover:text-slate-200 hover:bg-white/5'
                                  }`}
                                >
                                  <Book size={13} />
                                  <span>Branş Denemesi (Ders Odaklı)</span>
                                </button>
                                <button
                                  type="button"
                                  onClick={() => setNewBook({
                                    ...newBook,
                                    denemeCategory: 'general',
                                    subject: 'Genel Deneme'
                                  })}
                                  className={`py-2 px-3 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-2 ${
                                    newBook.denemeCategory === 'general'
                                      ? 'bg-rose-600 text-white shadow-md shadow-rose-600/30 border border-rose-400/50'
                                      : 'text-slate-400 hover:text-slate-200 hover:bg-white/5'
                                  }`}
                                >
                                  <Target size={13} />
                                  <span>Genel Deneme Paketi (Tüm Branşlar)</span>
                                </button>
                              </div>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                              <div className="space-y-1.5">
                                <label className="text-[10px] font-bold text-slate-300 uppercase tracking-wider block">
                                  Paketteki Toplam Deneme Adedi:
                                </label>
                                <div className="flex items-center gap-2">
                                  <input 
                                    type="number"
                                    min="1"
                                    max="100"
                                    value={newBook.totalExamCount || 10}
                                    onChange={(e) => setNewBook({ ...newBook, totalExamCount: Math.max(1, parseInt(e.target.value) || 1) })}
                                    className="w-20 bg-black/40 border border-rose-500/30 text-rose-300 font-bold text-center rounded-lg py-1.5 text-xs outline-none focus:border-rose-400"
                                  />
                                  <span className="text-xs text-slate-400">Adet Deneme Sınavı</span>
                                </div>
                              </div>

                              <div className="space-y-1.5">
                                <label className="text-[10px] font-bold text-slate-300 uppercase tracking-wider block">
                                  Önceden Çözülen Deneme Sayısı:
                                </label>
                                <div className="flex items-center gap-2">
                                  <input 
                                    type="number"
                                    min="0"
                                    max={newBook.totalExamCount || 10}
                                    value={newBook.initialPastSolvedCount || 0}
                                    onChange={(e) => setNewBook({ ...newBook, initialPastSolvedCount: Math.min(newBook.totalExamCount || 10, Math.max(0, parseInt(e.target.value) || 0)) })}
                                    className="w-20 bg-black/40 border border-rose-500/30 text-emerald-400 font-bold text-center rounded-lg py-1.5 text-xs outline-none focus:border-emerald-400"
                                  />
                                  <span className="text-xs text-slate-400">
                                    {(newBook.initialPastSolvedCount || 0) > 0 
                                      ? `(Deneme 1 - ${newBook.initialPastSolvedCount} çözüldü)` 
                                      : 'Yeni başlanıyor'}
                                  </span>
                                </div>
                              </div>
                            </div>

                            {/* Fast Pill Selector for Past Solved Denemes */}
                            <div className="space-y-1.5 pt-1">
                              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                                Hızlı Başlangıç Seçimi (İlk X Deneme Önceden Çözüldü):
                              </label>
                              <div className="flex flex-wrap gap-1.5">
                                {[0, 1, 2, 3, 4, 5, 6, 7, 8, 10, 15, 20].filter(n => n <= (newBook.totalExamCount || 10)).map(n => (
                                  <button
                                    key={n}
                                    type="button"
                                    onClick={() => setNewBook({ ...newBook, initialPastSolvedCount: n })}
                                    className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all border cursor-pointer ${
                                      (newBook.initialPastSolvedCount || 0) === n
                                        ? 'bg-rose-500 text-white border-rose-400 shadow-sm'
                                        : 'bg-black/30 hover:bg-white/10 text-slate-400 border-white/5'
                                    }`}
                                  >
                                    {n === 0 ? '0 (Yeni)' : `İlk ${n} Deneme`}
                                  </button>
                                ))}
                              </div>
                            </div>

                            <div className="p-3 bg-rose-500/10 border border-rose-500/20 rounded-xl flex items-start gap-2.5 text-xs text-rose-300">
                              <Sparkles size={16} className="text-rose-400 shrink-0 mt-0.5" />
                              <div>
                                <strong className="text-white block">Koç Bilgilendirmesi:</strong>
                                Öğrenci bu kaynağa başlamadan önce ilk {(newBook.initialPastSolvedCount || 0)} denemeyi çözmüşse, başlangıç ilerlemesi doğrudan %{Math.round(((newBook.initialPastSolvedCount || 0) / (newBook.totalExamCount || 10)) * 100)} olarak ayarlanır ve öğrencinin programına zorunlu net girişi baskısı oluşturmaz.
                              </div>
                            </div>
                          </div>
                        )}

                        <div className="flex items-center justify-end gap-3 pt-2">
                          <button
                            type="button"
                            onClick={() => {
                              setIsManualEntry(false);
                              setNewBook({ ...newBook, name: '' });
                            }}
                            className="bg-white/5 hover:bg-white/10 text-slate-300 rounded-xl py-2.5 px-4 text-xs font-bold transition-colors"
                          >
                            Geri / Farklı Barkod Gir
                          </button>
                          <button 
                            type="button"
                            onClick={handleAddBook}
                            className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-2.5 px-6 rounded-xl transition-all shadow-lg shadow-emerald-600/20 flex items-center justify-center gap-2 text-xs"
                          >
                            <Save size={15} /> Kaydet ve Öğrenciye Ekle
                          </button>
                        </div>
                      </div>
                    )}
                  </>
                )}
              </div>
            </div>

            {/* Book List Tabs */}
            {(() => {
              const soruCount = books.filter(b => (b.resourceType || 'soru') === 'soru').length;
              const fasikulCount = books.filter(b => b.resourceType === 'fasikul').length;
              const denemeCount = books.filter(b => b.resourceType === 'deneme').length;
              const konuCount = books.filter(b => b.resourceType === 'konu').length;
              const youtubeCount = books.filter(b => b.resourceType === 'youtube').length;
              const totalCount = books.length;
              const displayedBooks = books
                .filter(b => activeTab === 'all' || (b.resourceType || 'soru') === activeTab)
                .filter(b => subjectFilter === 'Hepsi' || b.subject === subjectFilter)
                .sort((a, b) => (a.order || 0) - (b.order || 0));

              return (
                <>
                  <div className="flex flex-wrap bg-slate-900 border border-white/5 rounded-xl p-1 mb-6 gap-1">
                    <button 
                      onClick={() => { setActiveTab('soru'); setSubjectFilter('Hepsi'); }}
                      className={`flex-1 min-w-[120px] flex items-center justify-center gap-2 py-2 text-xs font-bold rounded-lg transition-all ${activeTab === 'soru' ? 'bg-indigo-500 text-white shadow' : 'text-slate-400 hover:text-white hover:bg-white/5'}`}
                    >
                      Soru Bankası ({soruCount})
                    </button>
                    <button 
                      onClick={() => { setActiveTab('fasikul'); setSubjectFilter('Hepsi'); }}
                      className={`flex-1 min-w-[120px] flex items-center justify-center gap-2 py-2 text-xs font-bold rounded-lg transition-all ${activeTab === 'fasikul' ? 'bg-purple-600 text-white shadow' : 'text-slate-400 hover:text-white hover:bg-white/5'}`}
                    >
                      Soru Fasikülü ({fasikulCount})
                    </button>
                    <button 
                      onClick={() => { setActiveTab('deneme'); setSubjectFilter('Hepsi'); }}
                      className={`flex-1 min-w-[120px] flex items-center justify-center gap-2 py-2 text-xs font-bold rounded-lg transition-all ${activeTab === 'deneme' ? 'bg-rose-600 text-white shadow' : 'text-slate-400 hover:text-white hover:bg-white/5'}`}
                    >
                      Deneme Sınavı ({denemeCount})
                    </button>
                    <button 
                      onClick={() => { setActiveTab('konu'); setSubjectFilter('Hepsi'); }}
                      className={`flex-1 min-w-[120px] flex items-center justify-center gap-2 py-2 text-xs font-bold rounded-lg transition-all ${activeTab === 'konu' ? 'bg-orange-500 text-white shadow' : 'text-slate-400 hover:text-white hover:bg-white/5'}`}
                    >
                      Konu Anlatımı ({konuCount})
                    </button>
                    <button 
                      onClick={() => { setActiveTab('youtube'); setSubjectFilter('Hepsi'); }}
                      className={`flex-1 min-w-[120px] flex items-center justify-center gap-2 py-2 text-xs font-bold rounded-lg transition-all ${activeTab === 'youtube' ? 'bg-red-500 text-white shadow' : 'text-slate-400 hover:text-white hover:bg-white/5'}`}
                    >
                      YouTube Kanalı ({youtubeCount})
                    </button>
                    <button 
                      onClick={() => { setActiveTab('all'); setSubjectFilter('Hepsi'); }}
                      className={`flex-1 min-w-[120px] flex items-center justify-center gap-2 py-2 text-xs font-bold rounded-lg transition-all ${activeTab === 'all' ? 'bg-slate-700 text-white shadow' : 'text-slate-400 hover:text-white hover:bg-white/5'}`}
                    >
                      Tüm Kaynaklar ({totalCount})
                    </button>
                  </div>

                  {/* Subject Filter */}
                  {books.filter(b => activeTab === 'all' || (b.resourceType || 'soru') === activeTab).length > 0 && (
                    <div className="mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-900/20 p-4 rounded-xl border border-white/5">
                      <div className="flex items-center gap-2 text-slate-300">
                        <BookOpen size={18} className="text-indigo-400" />
                        <span className="font-bold text-sm tracking-wide">
                          {activeTab === 'soru' ? 'Soru Bankaları' : activeTab === 'fasikul' ? 'Soru Fasikülleri' : activeTab === 'deneme' ? 'Deneme Sınavları' : activeTab === 'youtube' ? 'YouTube Kanalları' : activeTab === 'konu' ? 'Konu Anlatımları' : 'Tüm Kaynaklar'}
                        </span>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Branş Filtresi</span>
                        <select 
                          value={subjectFilter}
                          onChange={(e) => setSubjectFilter(e.target.value)}
                          className="bg-slate-800 border border-slate-700 rounded-lg py-2 px-3 text-sm text-white font-medium outline-none focus:border-indigo-500 cursor-pointer min-w-[140px]"
                        >
                          <option value="Hepsi">Tüm Branşlar</option>
                          {Array.from(new Set(books.filter(b => activeTab === 'all' || (b.resourceType || 'soru') === activeTab).map(b => b.subject))).sort().map(subj => {
                            const sampleBook = books.find(b => b.subject === subj);
                            return (
                              <option key={subj as string} value={subj as string}>
                                {formatSubjectName(subj as string, sampleBook?.type || 'TYT')}
                              </option>
                            );
                          })}
                        </select>
                      </div>
                    </div>
                  )}

                  {/* Auto Sync Info Banner */}
                  <div className="mb-6 p-4 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 flex items-center gap-3 text-xs text-indigo-300">
                    <Sparkles size={20} className="text-indigo-400 shrink-0 animate-pulse" />
                    <div>
                      <span className="font-bold text-white block">Otomatik Konu Takibi Entegrasyonu</span>
                      <span className="text-slate-300">Öğrenci haftalık ders programında bu kitaptan bir konuyu/görevi tamamladığında, buradaki konu işaretlemesi <strong>otomatik olarak</strong> gerçekleşir.</span>
                    </div>
                  </div>

                  {/* Book List */}
                  <div id="tour-data-entry-list" className="grid grid-cols-1 gap-6">
                    {displayedBooks.length === 0 ? (
                      <div className="bg-slate-900/40 border border-white/5 rounded-3xl p-12 text-center">
                        <BookOpen className="mx-auto text-slate-600 mb-4" size={48} />
                        <h4 className="text-lg font-bold text-white mb-2">Bu sekmede/filtrede gösterilecek kaynak yok</h4>
                        <p className="text-sm text-slate-400 max-w-md mx-auto mb-6">
                          {books.length > 0 
                            ? `Öğrencinin kayıtlı toplam ${books.length} adet kaynağı bulunmaktadır.`
                            : 'Yukarıdaki alandan ISBN girerek veya arama yaparak öğrenciye yeni kaynak ekleyebilirsiniz.'}
                        </p>
                        {books.length > 0 && activeTab !== 'all' && (
                          <button
                            onClick={() => { setActiveTab('all'); setSubjectFilter('Hepsi'); }}
                            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold rounded-xl transition-all inline-block"
                          >
                            Tüm Kaynakları Göster ({books.length})
                          </button>
                        )}
                      </div>
                    ) : (
                      displayedBooks.map((book) => {
                        const isYoutube = book.resourceType === 'youtube' || (Array.isArray(book.videos) && book.videos.length > 0);
                        const videos = isYoutube ? (getBookItems(book) || []) : [];
                        const curriculumTopics = !isYoutube ? (getCurriculumTopicsForBook(book, CURRICULUM) || []) : [];
                        const completedTopicsList = Array.isArray(book.completedTopics) ? book.completedTopics : [];

                        let completedMainCount = 0;
                        if (!isYoutube) {
                          curriculumTopics.forEach((t: string) => {
                            const subs = Array.isArray(SUBTOPICS_MAP?.[t]) ? SUBTOPICS_MAP[t] : [];
                            if (completedTopicsList.includes(t) || (subs.length > 0 && subs.every(s => completedTopicsList.includes(s)))) {
                              completedMainCount++;
                            }
                          });
                        } else {
                          completedMainCount = (videos || []).filter((v: any) => completedTopicsList.includes(v?.title)).length;
                        }

                        const totalItemsCount = isYoutube ? (videos?.length || 0) : (curriculumTopics?.length || 0);
                        const safeMainCount = Math.min(totalItemsCount, Math.max(0, completedMainCount));
                        
                        return (
                          <div key={book.id} className="bg-slate-900/40 border border-white/5 rounded-3xl overflow-hidden group">
                            <div 
                              className="p-6 flex items-center justify-between cursor-pointer hover:bg-white/5 transition-all"
                              onClick={() => setExpandedBook(expandedBook === book.id ? null : book.id)}
                            >
                              <div className="flex items-center gap-6">
                                <div className={`p-3 rounded-2xl flex-shrink-0 ${
                                  isYoutube 
                                    ? 'bg-red-500/10 text-red-500' 
                                    : book.resourceType === 'fasikul'
                                      ? 'bg-purple-500/10 text-purple-400'
                                      : book.resourceType === 'deneme'
                                        ? 'bg-rose-500/10 text-rose-400'
                                        : book.resourceType === 'konu' 
                                          ? 'bg-orange-500/10 text-orange-400' 
                                          : 'bg-indigo-500/10 text-indigo-400'
                                }`}>
                                  {isYoutube ? <Youtube size={24} /> : book.resourceType === 'fasikul' ? <BookmarkCheck size={24} /> : book.resourceType === 'deneme' ? <Target size={24} /> : book.resourceType === 'konu' ? <FileText size={24} /> : <BookOpen size={24} />}
                                </div>
                                <div>
                                  <div className="flex items-center gap-1.5 flex-wrap">
                                    <span className="text-[10px] font-black text-emerald-400 uppercase tracking-widest">{formatSubjectName(book.subject, book.type)}</span>
                                    <span className="text-[10px] font-bold text-slate-600">•</span>
                                    <span className={`text-[10px] font-black uppercase tracking-widest px-1.5 py-0.5 rounded ${
                                      isYoutube 
                                        ? 'bg-red-500/10 text-red-500' 
                                        : book.resourceType === 'fasikul'
                                          ? 'bg-purple-500/15 text-purple-300 border border-purple-500/30'
                                          : book.resourceType === 'deneme'
                                            ? 'bg-rose-500/15 text-rose-300 border border-rose-500/30'
                                            : book.resourceType === 'konu' 
                                              ? 'bg-orange-500/10 text-orange-500' 
                                              : 'bg-slate-500/10 text-slate-400'
                                    }`}>
                                       {isYoutube ? 'YOUTUBE' : book.resourceType === 'fasikul' ? 'FASİKÜL' : book.resourceType === 'deneme' ? 'DENEME' : book.resourceType === 'konu' ? 'KONU' : 'SORU'}
                                    </span>
                                    <span className="text-[10px] font-bold text-slate-600">•</span>
                                    <span className="text-[10px] font-bold text-slate-500 uppercase">{safeMainCount} / {totalItemsCount} {isYoutube ? 'Video' : 'Ana Konu'}</span>
                                    {isYoutube && book.totalDurationFormatted && (
                                      <>
                                        <span className="text-[10px] font-bold text-slate-600">•</span>
                                        <span className="text-[10px] font-semibold text-slate-400">{book.totalDurationFormatted}</span>
                                      </>
                                    )}
                                  </div>
                                  <h4 className="text-lg font-bold text-white mt-1 uppercase">{book.bookName}</h4>
                                  {book.resourceType === 'fasikul' && Array.isArray(book.coveredTopics) && book.coveredTopics.length > 0 && (
                                    <p className="text-xs font-semibold text-purple-300 mt-1 flex items-center gap-1.5">
                                      <BookmarkCheck size={13} className="text-purple-400 shrink-0" />
                                      <span>Kapsam: {book.coveredTopics.join(', ')}</span>
                                    </p>
                                  )}
                                  {isYoutube && book.channelTitle && book.channelTitle !== book.bookName && (
                                    <p className="text-xs font-semibold text-red-400/80 mt-0.5">{book.channelTitle}</p>
                                  )}
                                  {book.isbn && !book.isbn.startsWith('youtube_') && <p className="text-xs font-medium text-slate-500 mt-0.5">ISBN: {book.isbn}</p>}
                                </div>
                              </div>
                              
                              <div className="flex items-center gap-8">
                                <div className="text-right hidden sm:block">
                                  <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">Tamamlanma</p>
                                  <div className="flex items-center gap-3">
                                    <div className="w-32 h-1.5 bg-white/5 rounded-full overflow-hidden">
                                      <div 
                                        className="h-full bg-emerald-500 transition-all duration-500"
                                        style={{ width: `${getSafePercentage(book.completionPercentage)}%` }}
                                      />
                                    </div>
                                    <span className="text-xl font-black text-white">%{getSafePercentage(book.completionPercentage)}</span>
                                  </div>
                                </div>
                                <div className="flex items-center gap-4">
                                    {subjectFilter !== 'Hepsi' && (
                                        <div className="flex flex-col gap-1 mr-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                            <button 
                                                onClick={(e) => handleMoveBook(e, book, 'up')}
                                                className="text-slate-500 hover:text-indigo-400 transition-colors p-1"
                                                title="Yukarı Taşı"
                                            >
                                                <ArrowUp size={14} />
                                            </button>
                                            <button 
                                                onClick={(e) => handleMoveBook(e, book, 'down')}
                                                className="text-slate-500 hover:text-indigo-400 transition-colors p-1"
                                                title="Aşağı Taşı"
                                            >
                                                <ArrowDown size={14} />
                                            </button>
                                        </div>
                                    )}
                                    <button 
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        handleDeleteBook(book.id);
                                      }}
                                      className="p-2 text-slate-500 hover:text-red-400 transition-colors opacity-0 group-hover:opacity-100"
                                      title="Kaynağı Sil"
                                    >
                                      <Trash2 size={18} />
                                    </button>
                                    <div className="text-slate-500 group-hover:text-white transition-colors">
                                      {expandedBook === book.id ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
                                    </div>
                                </div>
                              </div>
                            </div>

                            {/* Topics List with Custom Checkbox */}
                            <AnimatePresence>
                              {expandedBook === book.id && (
                                <motion.div 
                                  initial={{ height: 0, opacity: 0 }}
                                  animate={{ height: 'auto', opacity: 1 }}
                                  exit={{ height: 0, opacity: 0 }}
                                  className="border-t border-white/5 bg-slate-900/60 p-6"
                                >
                                  {isYoutube && book.channelTitle && (
                                    <div className="mb-4 flex items-center justify-between text-xs text-slate-400 bg-red-500/5 border border-red-500/10 rounded-xl p-3">
                                      <div className="flex items-center gap-2">
                                        <Youtube size={16} className="text-red-400" />
                                        <span>Kanal: <strong className="text-white">{book.channelTitle}</strong></span>
                                        {book.totalVideos && <span>• {book.totalVideos} Video</span>}
                                        {book.totalDurationFormatted && <span>• {book.totalDurationFormatted}</span>}
                                      </div>
                                    </div>
                                  )}

                                  {book.resourceType === 'deneme' ? (
                                    <div className="mb-4 p-4 rounded-2xl bg-rose-950/20 border border-rose-500/20">
                                      <div className="flex flex-wrap items-center justify-between gap-3 mb-2">
                                        <div className="flex items-center gap-2">
                                          <Trophy size={16} className="text-rose-400" />
                                          <span className="text-xs font-bold text-rose-200">
                                            Deneme Paketi İlerlemesi ({book.completedTopics?.length || 0} / {book.totalExamCount || 10} Çözüldü)
                                          </span>
                                        </div>
                                        <div className="flex items-center gap-1.5 flex-wrap">
                                          <span className="text-[10px] font-bold text-slate-400 mr-1">Geçmiş Denemeleri İşaretle:</span>
                                          <button
                                            type="button"
                                            onClick={(e) => {
                                              e.stopPropagation();
                                              handleBatchMarkPastDenemeler(book, 3);
                                            }}
                                            className="text-[10px] font-bold px-2.5 py-1 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-rose-300 border border-rose-500/20 transition-all cursor-pointer"
                                          >
                                            İlk 3
                                          </button>
                                          <button
                                            type="button"
                                            onClick={(e) => {
                                              e.stopPropagation();
                                              handleBatchMarkPastDenemeler(book, 5);
                                            }}
                                            className="text-[10px] font-bold px-2.5 py-1 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-rose-300 border border-rose-500/20 transition-all cursor-pointer"
                                          >
                                            İlk 5
                                          </button>
                                          <button
                                            type="button"
                                            onClick={(e) => {
                                              e.stopPropagation();
                                              handleBatchMarkPastDenemeler(book, book.totalExamCount || 10);
                                            }}
                                            className="text-[10px] font-bold px-2.5 py-1 rounded-lg bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-300 border border-emerald-500/20 transition-all cursor-pointer"
                                          >
                                            Tümü
                                          </button>
                                          <button
                                            type="button"
                                            onClick={(e) => {
                                              e.stopPropagation();
                                              handleBatchMarkPastDenemeler(book, 0);
                                            }}
                                            className="text-[10px] font-bold px-2.5 py-1 rounded-lg bg-white/5 hover:bg-white/10 text-slate-400 transition-all cursor-pointer"
                                          >
                                            Sıfırla
                                          </button>
                                        </div>
                                      </div>
                                      <p className="text-[11px] text-slate-400">
                                        Öğrencinin bu pakete başlamadan önce çözdüğü denemeleri yukarıdan tek tıkla işaretleyebilirsiniz. Öğrenciye net girme zorunluluğu yaratmaz, başlangıç ilerlemesini günceller.
                                      </p>
                                    </div>
                                  ) : !isYoutube ? (
                                    <div className="flex items-center justify-between mb-4">
                                      <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">
                                        Konu ve Alt Konu Listesi
                                      </span>
                                      <div className="flex items-center gap-2">
                                        <button
                                          onClick={(e) => {
                                            e.stopPropagation();
                                            toggleAllSubtopicsExpand(book, true);
                                          }}
                                          className="text-[10px] font-bold text-indigo-400 hover:text-indigo-300 bg-indigo-500/10 hover:bg-indigo-500/20 px-2.5 py-1 rounded-lg transition-colors"
                                        >
                                          Tümünü Genişlet
                                        </button>
                                        <button
                                          onClick={(e) => {
                                            e.stopPropagation();
                                            toggleAllSubtopicsExpand(book, false);
                                          }}
                                          className="text-[10px] font-bold text-slate-400 hover:text-slate-300 bg-white/5 hover:bg-white/10 px-2.5 py-1 rounded-lg transition-colors"
                                        >
                                          Tümünü Daralt
                                        </button>
                                      </div>
                                    </div>
                                  ) : null}

                                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                    {(!isYoutube ? getCurriculumTopicsForBook(book, CURRICULUM) : getBookItems(book)).map((item: any, idx: number) => {
                                      if (isYoutube) {
                                        const isCompleted = (book.completedTopics || []).includes(item.title);
                                        return (
                                          <div 
                                            key={item.id || idx}
                                            className={`p-3 rounded-2xl border transition-all flex items-center justify-between gap-3 ${
                                              isCompleted ? 'bg-emerald-500/10 border-emerald-500/20' : 'bg-slate-800/40 border-white/5'
                                            }`}
                                          >
                                            <div 
                                              onClick={() => toggleTopic(book, item.title)}
                                              className="flex items-center gap-3 cursor-pointer flex-1 min-w-0"
                                            >
                                              <div className={`w-5 h-5 rounded-lg flex items-center justify-center border transition-all flex-shrink-0 ${
                                                isCompleted ? 'bg-emerald-500 border-emerald-500 text-slate-950 font-bold' : 'border-slate-700 bg-slate-900'
                                              }`}>
                                                {isCompleted && <ClipboardCheck size={12} strokeWidth={3} />}
                                              </div>
                                              <div className="min-w-0 flex-1">
                                                <span className={`text-xs block truncate ${isCompleted ? 'text-emerald-300 font-semibold' : 'text-slate-300'}`}>
                                                  {item.order ? `${item.order}. ` : ''}{item.title}
                                                </span>
                                                {item.duration && (
                                                  <span className="text-[10px] text-slate-500">{item.duration}</span>
                                                )}
                                              </div>
                                            </div>
                                            {item.url && (
                                              <a 
                                                href={item.url} 
                                                target="_blank" 
                                                rel="noreferrer" 
                                                onClick={(e) => e.stopPropagation()}
                                                className="text-red-400 hover:text-red-300 p-1.5 rounded-lg bg-red-500/10 hover:bg-red-500/20 transition-colors flex-shrink-0"
                                                title="YouTube'da İzle"
                                              >
                                                <ExternalLink size={14} />
                                              </a>
                                            )}
                                          </div>
                                        );
                                      }

                                      if (book.resourceType === 'deneme') {
                                        const isCompleted = (book.completedTopics || []).includes(item);
                                        return (
                                          <div 
                                            key={item || idx}
                                            className={`p-3 rounded-2xl border transition-all flex items-center justify-between gap-3 ${
                                              isCompleted ? 'bg-rose-500/10 border-rose-500/30' : 'bg-slate-800/40 border-white/5'
                                            }`}
                                          >
                                            <div 
                                              onClick={() => toggleTopic(book, item)}
                                              className="flex items-center gap-3 cursor-pointer flex-1 min-w-0"
                                            >
                                              <div className={`w-5 h-5 rounded-lg flex items-center justify-center border transition-all flex-shrink-0 ${
                                                isCompleted ? 'bg-rose-500 border-rose-500 text-white font-bold' : 'border-slate-700 bg-slate-900'
                                              }`}>
                                                {isCompleted && <ClipboardCheck size={12} strokeWidth={3} />}
                                              </div>
                                              <div className="min-w-0 flex-1">
                                                <span className={`text-xs block truncate ${isCompleted ? 'text-rose-200 font-semibold' : 'text-slate-300'}`}>
                                                  {item}
                                                </span>
                                                <span className="text-[10px] text-slate-500">
                                                  {isCompleted ? 'Tamamlandı / Önceden Çözüldü' : 'Henüz Çözülmedi'}
                                                </span>
                                              </div>
                                            </div>
                                            <button
                                              type="button"
                                              onClick={(e) => {
                                                e.stopPropagation();
                                                handleOpenCoachDenemeModal(book, item);
                                              }}
                                              className="text-[10px] font-bold text-rose-400 hover:text-rose-300 px-2.5 py-1 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/20 transition-colors flex items-center gap-1 shrink-0 cursor-pointer"
                                              title="Bu deneme için net / puan gir"
                                            >
                                              <Target size={12} />
                                              <span>Net Gir</span>
                                            </button>
                                          </div>
                                        );
                                      }

                                      const topic = item;
                                      const subtopics = Array.isArray(SUBTOPICS_MAP?.[topic]) ? SUBTOPICS_MAP[topic] : [];
                                      const hasSubtopics = subtopics.length > 0;
                                      const isSubExpanded = expandedSubtopics[`${book.id}-${topic}`] || false;

                                      let isCompleted = false;
                                      let completedSubCount = 0;
                                      if (hasSubtopics) {
                                        completedSubCount = subtopics.filter((sub: string) => (Array.isArray(book.completedTopics) ? book.completedTopics : []).includes(sub)).length;
                                        isCompleted = completedSubCount === subtopics.length && subtopics.length > 0;
                                      } else {
                                        isCompleted = (Array.isArray(book.completedTopics) ? book.completedTopics : []).includes(topic);
                                      }

                                      return (
                                        <div 
                                          key={topic}
                                          className={`rounded-2xl border transition-all overflow-hidden ${
                                            isCompleted ? 'bg-emerald-500/10 border-emerald-500/20' : 'bg-slate-800/40 border-white/5'
                                          }`}
                                        >
                                          <div className="p-3 flex items-center justify-between gap-2">
                                            <div 
                                              onClick={() => toggleMainTopic(book, topic, subtopics)}
                                              className="flex items-center gap-3 cursor-pointer flex-1 min-w-0"
                                            >
                                              <div className={`w-5 h-5 rounded-lg flex items-center justify-center border transition-all flex-shrink-0 ${
                                                isCompleted ? 'bg-emerald-500 border-emerald-500 text-slate-950 font-bold' : hasSubtopics && completedSubCount > 0 ? 'border-amber-500/50 bg-amber-500/20 text-amber-300 text-[10px] font-bold' : 'border-slate-700 bg-slate-900'
                                              }`}>
                                                {isCompleted ? (
                                                  <ClipboardCheck size={12} strokeWidth={3} />
                                                ) : hasSubtopics && completedSubCount > 0 ? (
                                                  <span>{completedSubCount}</span>
                                                ) : null}
                                              </div>
                                              <div className="min-w-0 flex-1">
                                                <span className={`text-xs block truncate ${isCompleted ? 'text-emerald-300 font-semibold' : 'text-slate-300'}`}>
                                                  {topic}
                                                </span>
                                                {hasSubtopics && (
                                                  <span className="text-[10px] text-slate-500">
                                                    {completedSubCount}/{subtopics.length} Alt Başlık
                                                  </span>
                                                )}
                                              </div>
                                            </div>

                                            {hasSubtopics && (
                                              <button
                                                onClick={(e) => {
                                                  e.stopPropagation();
                                                  toggleSubtopicsExpand(book.id, topic);
                                                }}
                                                className={`p-1.5 rounded-lg text-xs transition-colors flex items-center gap-1 ${
                                                  isSubExpanded ? 'bg-indigo-500/20 text-indigo-300' : 'bg-white/5 text-slate-400 hover:text-white hover:bg-white/10'
                                                }`}
                                                title={isSubExpanded ? 'Alt başlıkları gizle' : 'Alt başlıkları göster'}
                                              >
                                                <Layers size={12} />
                                                <span className="text-[10px] font-semibold">{subtopics.length}</span>
                                                {isSubExpanded ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
                                              </button>
                                            )}
                                          </div>

                                          {hasSubtopics && isSubExpanded && (
                                            <div className="border-t border-white/5 bg-slate-950/40 p-2.5 space-y-1">
                                              <div className="text-[9px] font-bold text-slate-500 uppercase tracking-wider px-2 py-0.5">
                                                Alt Başlıklar
                                              </div>
                                              {subtopics.map((sub: string) => {
                                                const isSubDone = (Array.isArray(book?.completedTopics) ? book.completedTopics : []).includes(sub);
                                                return (
                                                  <div
                                                    key={sub}
                                                    onClick={() => toggleSubtopic(book, topic, sub, subtopics)}
                                                    className={`px-2.5 py-1.5 rounded-lg text-xs flex items-center gap-2.5 cursor-pointer transition-colors ${
                                                      isSubDone ? 'bg-emerald-500/15 text-emerald-300' : 'hover:bg-white/5 text-slate-400 hover:text-slate-200'
                                                    }`}
                                                  >
                                                    <div className={`w-3.5 h-3.5 rounded flex items-center justify-center border transition-all flex-shrink-0 ${
                                                      isSubDone ? 'bg-emerald-500 border-emerald-500 text-slate-950 font-bold' : 'border-slate-700 bg-slate-900'
                                                    }`}>
                                                      {isSubDone && <ClipboardCheck size={9} strokeWidth={3} />}
                                                    </div>
                                                    <span className="truncate text-[11px]">{sub}</span>
                                                  </div>
                                                );
                                              })}
                                            </div>
                                          )}
                                        </div>
                                      );
                                    })}
                                  </div>
                                </motion.div>
                              )}
                            </AnimatePresence>
                          </div>
                        );
                      })
                    )}
                  </div>
                </>
              );
            })()}
      </div>

      <BarcodeScannerModal
        isOpen={isScannerOpen}
        onClose={() => setIsScannerOpen(false)}
        onScanSuccess={(scannedIsbn) => {
          setNewBook(prev => ({ ...prev, isbn: scannedIsbn }));
          setIsManualEntry(false);
        }}
      />

      <DenemeResultModal
        isOpen={showCoachDenemeModal}
        studentId={selectedStudent?.uid || ''}
        onClose={() => {
          setShowCoachDenemeModal(false);
          setCoachDenemeData(null);
        }}
        initialData={coachDenemeData}
        onSuccess={async () => {
          if (selectedStudent?.uid) {
            const [updatedTracking, globals] = await Promise.all([
              studentDataService.getBookTracking(selectedStudent.uid),
              studentDataService.getGlobalBooks()
            ]);
            setBooks(mergeBookData(updatedTracking, globals));
          }
        }}
      />
    </div>
  );
}
