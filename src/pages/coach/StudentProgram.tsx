import React, { useState, useEffect } from 'react';
import {
  DndContext, 
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  useDroppable,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  useSortable
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { useAuth } from '../../lib/AuthContext';
import { useStudent } from '../../lib/StudentContext';
import { tourService } from '../../services/tourService';
import { studentDataService } from '../../services/studentDataService';
import { safeStorage } from '../../lib/localStorage';
import { Sparkles, Calendar, Clock, CheckCircle2, Plus, Trash2, Save, Target, ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight, Printer, Loader2, Copy, Folder, FolderOpen, ChevronDown, Book, FileText, LayoutList, Youtube, StickyNote, Eye, EyeOff, RotateCcw, Play, Search, X, GripVertical, Check, Layers, ListFilter } from 'lucide-react';
import { useCurriculum } from '../../lib/CurriculumContext';
import { BRANCH_CONFIG } from '../../constants/branchConfig';
import { SUBTOPICS } from '../../constants/subtopics';
import { calculateSubjectMultipliers, calculateDailyCompletionWithMultipliers } from '../../lib/programCalculations';

import { useLocation, useNavigate } from 'react-router-dom';
import { OnboardingTour, TourStep } from "../../components/OnboardingTour";
import NoStudentSelected from "../../components/NoStudentSelected";
import { notificationService } from '../../services/notificationService';
import { SAMPLE_DEMO_STUDENT } from './CoachStudents';

const TASK_TYPES = ['Soru Çözümü', 'Konu Çalışması', 'YouTube Video'];
const BRANCHES = ['TYT', 'AYT', '10. Sınıf', 'Denemeler'];
export const DENEME_SUBJECTS = ['TYT Genel', 'AYT Genel', '9. Sınıf Genel', '10. Sınıf Genel', '11. Sınıf Genel', 'Türkçe', 'Paragraf', 'Matematik (TYT)', 'Problem', 'Geometri', 'Fen (TYT)', 'Sosyal (TYT)', 'Matematik (AYT)', 'Fen (AYT)', 'Sosyal-1', 'Sosyal-2', 'YDT'];

export const formatSubjectName = (sub: string, branch?: string) => {
    if (branch === 'Denemeler') {
        if (sub === 'Türkçe') return 'TYT Türkçe Denemesi';
        if (sub === 'Paragraf') return 'Paragraf Denemesi';
        if (sub === 'Matematik (TYT)') return 'TYT Matematik Denemesi';
        if (sub === 'Problem') return 'Problem Denemesi';
        if (sub === 'Geometri') return 'TYT Geometri Denemesi';
        if (sub === 'Fen (TYT)') return 'TYT Fen Denemesi';
        if (sub === 'Sosyal (TYT)') return 'TYT Sosyal Denemesi';
        if (sub === 'Matematik (AYT)') return 'AYT Matematik Denemesi';
        if (sub === 'Fen (AYT)') return 'AYT Fen Denemesi';
        if (sub === 'Sosyal-1') return 'AYT Sosyal-1 Denemesi';
        if (sub === 'Sosyal-2') return 'AYT Sosyal-2 Denemesi';
        if (sub === 'YDT') return 'YDT Denemesi';
    }
    if (sub === 'Matematik') return 'TYT Matematik';
    if (sub === 'Türkçe') return 'TYT Türkçe';
    if (sub === 'Geometri') return 'TYT Geometri';
    if (sub === 'Fizik') return 'TYT Fizik';
    if (sub === 'Kimya') return 'TYT Kimya';
    if (sub === 'Biyoloji') return 'TYT Biyoloji';
    if (sub === 'Tarih') return 'TYT Tarih';
    if (sub === 'Coğrafya') return 'TYT Coğrafya';
    if (sub === 'Paragraf') return 'TYT Paragraf';
    if (sub === 'Problem') return 'TYT Problem';
    
    if (sub === 'Matematik (TYT)') return 'TYT Matematik Denemesi';
    if (sub === 'Fen (TYT)') return 'TYT Fen Denemesi';
    if (sub === 'Sosyal (TYT)') return 'TYT Sosyal Denemesi';
    if (sub === 'Matematik (AYT)') return 'AYT Matematik Denemesi';
    if (sub === 'Fen (AYT)') return 'AYT Fen Denemesi';
    if (sub === 'Sosyal-1') return 'AYT Sosyal-1 Denemesi';
    if (sub === 'Sosyal-2') return 'AYT Sosyal-2 Denemesi';
    if (sub === 'YDT') return 'YDT Denemesi';
    return sub;
};

export const DENEME_TYPES = [
    { name: 'TYT Genel Denemesi', subject: 'TYT Genel', questionCount: 120 },
    { name: 'AYT Genel Denemesi', subject: 'AYT Genel', questionCount: 160 },
    { name: '9. Sınıf Genel Denemesi', subject: '9. Sınıf Genel', questionCount: 90 },
    { name: '10. Sınıf Genel Denemesi', subject: '10. Sınıf Genel', questionCount: 90 },
    { name: '11. Sınıf Genel Denemesi', subject: '11. Sınıf Genel', questionCount: 90 },
    
    { name: 'Türkçe Bölüm Denemesi', subject: 'Türkçe', questionCount: 40 },
    { name: 'Dilbilgisi Denemesi', subject: 'Türkçe', questionCount: 15 },
    { name: 'Paragraf Denemesi', subject: 'Paragraf', questionCount: 25 },
    
    { name: 'TYT Matematik Denemesi', subject: 'Matematik (TYT)', questionCount: 40 },
    { name: 'Problemler Denemesi', subject: 'Problem', questionCount: 15 },
    { name: 'TYT Geometri Denemesi', subject: 'Geometri', questionCount: 10 },
    
    { name: 'TYT Fen Bilimleri Denemesi', subject: 'Fen (TYT)', questionCount: 20 },
    { name: 'TYT Fizik Denemesi', subject: 'Fen (TYT)', questionCount: 7 },
    { name: 'TYT Kimya Denemesi', subject: 'Fen (TYT)', questionCount: 7 },
    { name: 'TYT Biyoloji Denemesi', subject: 'Fen (TYT)', questionCount: 6 },
    
    { name: 'TYT Sosyal Bilimler Denemesi', subject: 'Sosyal (TYT)', questionCount: 20 },
    { name: 'TYT Tarih Denemesi', subject: 'Sosyal (TYT)', questionCount: 5 },
    { name: 'TYT Coğrafya Denemesi', subject: 'Sosyal (TYT)', questionCount: 5 },
    { name: 'TYT Felsefe Denemesi', subject: 'Sosyal (TYT)', questionCount: 5 },
    { name: 'TYT Din Kültürü Denemesi', subject: 'Sosyal (TYT)', questionCount: 5 },
    
    { name: 'AYT Matematik Denemesi', subject: 'Matematik (AYT)', questionCount: 40 },
    { name: 'AYT Geometri Denemesi', subject: 'Matematik (AYT)', questionCount: 10 },
    
    { name: 'AYT Fen Bilimleri Denemesi', subject: 'Fen (AYT)', questionCount: 40 },
    { name: 'AYT Fizik Denemesi', subject: 'Fen (AYT)', questionCount: 14 },
    { name: 'AYT Kimya Denemesi', subject: 'Fen (AYT)', questionCount: 13 },
    { name: 'AYT Biyoloji Denemesi', subject: 'Fen (AYT)', questionCount: 13 },
    
    { name: 'AYT Sosyal-1 Denemesi', subject: 'Sosyal-1', questionCount: 40 },
    { name: 'AYT Edebiyat Denemesi', subject: 'Sosyal-1', questionCount: 24 },
    { name: 'AYT Tarih-1 Denemesi', subject: 'Sosyal-1', questionCount: 10 },
    { name: 'AYT Coğrafya-1 Denemesi', subject: 'Sosyal-1', questionCount: 6 },
    
    { name: 'AYT Sosyal-2 Denemesi', subject: 'Sosyal-2', questionCount: 40 },
    { name: 'AYT Tarih-2 Denemesi', subject: 'Sosyal-2', questionCount: 11 },
    { name: 'AYT Coğrafya-2 Denemesi', subject: 'Sosyal-2', questionCount: 11 },
    { name: 'AYT Felsefe Grubu Denemesi', subject: 'Sosyal-2', questionCount: 12 },
    { name: 'AYT Din Kültürü Denemesi', subject: 'Sosyal-2', questionCount: 6 },
    
    { name: 'YDT Denemesi', subject: 'YDT', questionCount: 80 }
];

const TopicDraggable = (props: any) => {
    const { 
      topic, 
      subject, 
      branch, 
      type, 
      bookId, 
      isCompleted, 
      targetCount, 
      bookData, 
      updateBookTopicCount, 
      isFirstTopic,
      videoInfo,
      subtopicsList
    } = props;
    
    // Alt başlıkların toplam hedef miktarını hesapla
    const subSum = React.useMemo(() => {
        if (!subtopicsList || subtopicsList.length === 0 || !bookData?.topicQuestionCounts) return 0;
        return subtopicsList.reduce((acc: number, sub: string) => acc + (Number(bookData.topicQuestionCounts[sub]) || 0), 0);
    }, [subtopicsList, bookData?.topicQuestionCounts]);

    const getCalculatedTopicCount = () => {
        if (videoInfo?.durationMinutes) return videoInfo.durationMinutes;
        let c = bookData?.topicQuestionCounts?.[topic];
        if (c === undefined) {
             c = targetCount;
        }
        if (c === undefined || c === '') {
            return subSum > 0 ? subSum : '';
        }
        const numC = Number(c);
        if (subSum > 0 && numC < subSum) return subSum;
        return numC;
    };

    const [topicCount, setTopicCount] = useState<string | number>(getCalculatedTopicCount());

    // Update state if bookData changes externally
    React.useEffect(() => {
        setTopicCount(getCalculatedTopicCount());
        
        // Eğer alt başlıkların toplamı, üst başlığın mevcut değerinden büyükse otomatik eşitle (sadece bookData üzerinden güncellenmişse)
        if (bookData && updateBookTopicCount && subSum > 0) {
            const currentSaved = Number(bookData.topicQuestionCounts?.[topic]) || 0;
            if (currentSaved < subSum) {
                updateBookTopicCount(bookData.id, topic, subSum);
            }
        }
    }, [bookData?.topicQuestionCounts, topic, targetCount, videoInfo, subSum]);

    const handleSaveTopicCount = () => {
        if(bookData && updateBookTopicCount) {
             let parsed = parseInt(String(topicCount));
             if (isNaN(parsed) || parsed < 0) parsed = 0;
             if (subSum > 0 && parsed < subSum) parsed = subSum; // Alt başlıklardan daha az olamaz
             
             setTopicCount(parsed === 0 ? '' : parsed);
             updateBookTopicCount(bookData.id, topic, parsed > 0 ? parsed : null);
        }
    };

    const finalTargetCount = videoInfo?.durationMinutes || bookData?.topicQuestionCounts?.[topic] || targetCount || (type === 'Konu Çalışması' || type === 'YouTube Video' ? 0 : 100);

    const { attributes, listeners, setNodeRef, isDragging } = useSortable({
        id: `template-${subject}-${topic}-${bookId || 'none'}-${videoInfo?.order || ''}`,
        data: { 
          type: 'template', 
          template: { 
            title: topic, 
            subject, 
            type, 
            bookId, 
            targetCount: finalTargetCount,
            durationMinutes: videoInfo?.durationMinutes || 0,
            durationFormatted: videoInfo?.durationFormatted || '',
            videoId: videoInfo?.videoId || '',
            videoUrl: videoInfo?.url || '',
            channelTitle: bookData?.channelTitle || ''
          } 
        }
    });

    const isVideo = type === 'YouTube Video';
    const isKonu = type === 'Konu Çalışması';

    return (
        <div 
          id={isFirstTopic ? "tour-program-draggable-topic" : undefined} 
          ref={setNodeRef} 
          {...attributes} 
          {...listeners} 
          className={`group relative p-2.5 rounded-xl cursor-grab transition-all select-none border ${
            isDragging ? 'opacity-40 scale-[0.98]' : 'hover:border-white/20 hover:shadow-md'
          } ${
            isCompleted 
              ? 'bg-emerald-950/30 text-emerald-200 border-emerald-500/40 shadow-sm shadow-emerald-500/5 hover:border-emerald-500/60 hover:bg-emerald-950/40' 
              : isVideo 
                ? 'bg-red-500/5 text-slate-200 border-red-500/20 hover:bg-red-500/10' 
                : isKonu 
                  ? 'bg-amber-500/5 text-slate-200 border-amber-500/20 hover:bg-amber-500/10' 
                  : 'bg-slate-800/60 text-slate-200 border-white/5 hover:bg-slate-800'
          }`}
        >
           {/* 1. Üst Satır: Tutma Kulpu + İkon / Sıra No + Konu Başlığı */}
           <div className="flex items-start gap-2">
               <GripVertical size={14} className={`shrink-0 mt-0.5 ${isCompleted ? 'text-emerald-500/70 group-hover:text-emerald-400' : 'text-slate-600 group-hover:text-slate-400'}`} />
               
               {isCompleted ? (
                  <CheckCircle2 size={14} className="text-emerald-400 shrink-0 mt-0.5" />
               ) : isVideo ? (
                  <Youtube size={14} className="text-red-400 shrink-0 mt-0.5" />
               ) : isKonu ? (
                  <FileText size={14} className="text-amber-400 shrink-0 mt-0.5" />
               ) : (
                  <Book size={14} className="text-indigo-400 shrink-0 mt-0.5" />
               )}

               {videoInfo?.order && (
                  <span className="font-mono text-[10px] font-bold text-slate-300 shrink-0 bg-slate-900 px-1 py-0.5 rounded border border-white/10">
                    {videoInfo.order}
                  </span>
               )}

               <span className={`text-xs font-bold leading-snug break-words flex-1 ${
                 isCompleted 
                   ? 'text-emerald-300 group-hover:text-emerald-200' 
                   : 'text-slate-200 group-hover:text-white'
               }`} title={topic}>
                 {topic}
               </span>
           </div>
           
           {/* 2. Alt Satır: Soru / Sayfa / Süre Sayısı & Tamamlanma Durumu */}
           <div className="flex items-center gap-2 mt-2 pl-5 flex-wrap" onPointerDown={e => e.stopPropagation()}>
               {isCompleted && (
                 <span className="inline-flex items-center gap-1 text-[9px] font-black text-emerald-300 bg-emerald-500/20 px-2 py-0.5 rounded-md border border-emerald-500/30 shrink-0">
                   <Check size={10} className="stroke-[3]" /> Tamamlandı
                 </span>
               )}

               {isVideo && videoInfo ? (
                   <div className="flex items-center gap-1.5 shrink-0">
                     <span className="inline-flex items-center gap-1 text-[10px] font-bold text-red-300 bg-red-500/15 px-2 py-0.5 rounded-md border border-red-500/30">
                        <Clock size={11} className="text-red-400" />
                        {videoInfo.durationFormatted || `${videoInfo.durationMinutes} dk`}
                     </span>
                     {bookData?.channelTitle && (
                        <span className="text-[9.5px] text-slate-500 truncate max-w-[120px]">{bookData.channelTitle}</span>
                     )}
                   </div>
               ) : (
                   <div className="flex items-center gap-1.5 shrink-0">
                     <span className={`text-[10px] font-bold ${isCompleted ? 'text-emerald-400/80' : 'text-slate-400'}`}>Hedef:</span>
                     <input 
                        id={isFirstTopic ? "tour-program-global-target" : undefined}
                        type="number"
                        value={topicCount}
                        onChange={e => setTopicCount(e.target.value)}
                        onBlur={handleSaveTopicCount}
                        onPointerDown={e => e.stopPropagation()}
                        onKeyDown={e => e.stopPropagation()}
                        className={`w-14 bg-slate-950 text-slate-100 border focus:border-indigo-500 rounded-md text-[10.5px] py-0.5 px-1.5 text-center font-extrabold outline-none ring-0 placeholder-slate-500 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none ${
                          isCompleted ? 'border-emerald-500/30 text-emerald-300' : 'border-slate-700/80'
                        }`}
                        placeholder={isKonu ? 'Sayfa' : 'Soru'} 
                        title={isKonu ? 'Varsayılan Sayfa Hedefi' : 'Varsayılan Soru Hedefi'}
                     />
                     <span className={`text-[10px] font-bold ${isCompleted ? 'text-emerald-400/80' : 'text-slate-400'}`}>
                       {isKonu ? 'sayfa' : 'soru'}
                     </span>
                   </div>
               )}
           </div>
        </div>
    );
};

const SHOW_TOPICS_TOUR_TARGETS = [
    'tour-program-draggable-topic',
    'tour-program-global-target',
    'tour-program-uncompleted-tasks',
    'tour-program-import'
];

const SidebarHierarchy = ({ 
    CURRICULUM, 
    tytSubjects, 
    aytSubjects, 
    books, 
    updateBookTopicCount, 
    studentBranch, 
    studentGrade,
    isTourOpen = false,
    currentTourTargetId = null
}: { 
    CURRICULUM: any, 
    tytSubjects: string[], 
    aytSubjects: string[], 
    books: any[], 
    updateBookTopicCount: (bookId: string, topic: string, count: number | null) => void, 
    studentBranch: string, 
    studentGrade: string,
    isTourOpen?: boolean,
    currentTourTargetId?: string | null
}) => {
    const { curriculum: contextCurriculum, subtopics: contextSubtopics } = useCurriculum();
    const activeCurriculum = contextCurriculum && Object.keys(contextCurriculum).length > 0 ? contextCurriculum : CURRICULUM;
    const activeSubtopics = contextSubtopics && Object.keys(contextSubtopics).length > 0 ? contextSubtopics : SUBTOPICS;

    const [selectedType, setSelectedType] = useState<string>('Soru Çözümü');
    const [selectedBranch, setSelectedBranch] = useState<string>('TYT');
    const [selectedSubject, setSelectedSubject] = useState<string>('Biyoloji');
    const [selectedBook, setSelectedBook] = useState<string>('demo-biyotik-1');
    const [searchQuery, setSearchQuery] = useState<string>('');
    const [showGlobalLibrary, setShowGlobalLibrary] = useState<boolean>(false);

    const isAraSinif = ['9. Sınıf', '10. Sınıf', '11. Sınıf'].includes(studentGrade);
    const dynamicBranches = isAraSinif 
        ? (studentGrade === '11. Sınıf' ? [studentGrade, 'Yeni Müfredat TYT', 'Denemeler'] : 
           (studentGrade === '10. Sınıf' ? ['9. Sınıf', '10. Sınıf', 'Denemeler'] : [studentGrade, 'Denemeler']))
        : ['TYT', studentBranch === 'DİL' ? 'YDT' : 'AYT', 'Denemeler'];

    const getAvailableSubjects = (branch: string) => {
        if (branch === 'TYT') return tytSubjects;
        if (branch === 'AYT' || branch === 'YDT') return aytSubjects;
        if (branch === '9. Sınıf') return BRANCH_CONFIG['9. Sınıf'].subjects;
        if (branch === '10. Sınıf') return BRANCH_CONFIG['10. Sınıf'].subjects;
        if (branch === '11. Sınıf') return BRANCH_CONFIG['11. Sınıf'].subjects;
        if (branch === 'Yeni Müfredat TYT') return BRANCH_CONFIG['Yeni Müfredat TYT']?.subjects || [];
        if (branch === 'Denemeler') {
            if (isAraSinif) {
                if (studentGrade === '9. Sınıf') return ['9. Sınıf Genel'];
                if (studentGrade === '10. Sınıf') return ['10. Sınıf Genel'];
                if (studentGrade === '11. Sınıf') return ['11. Sınıf Genel'];
            }
            return DENEME_SUBJECTS.filter(d => !['9. Sınıf Genel', '10. Sınıf Genel', '11. Sınıf Genel'].includes(d));
        }
        return [];
    };

    const availableSubjects = getAvailableSubjects(selectedBranch);

    // Auto-fix selectedSubject if not available in current branch
    useEffect(() => {
        if (availableSubjects.length > 0 && !availableSubjects.includes(selectedSubject)) {
            setSelectedSubject(availableSubjects[0]);
        }
    }, [selectedBranch, availableSubjects, selectedSubject]);

    // Student registered books for this subject and active task type
    const studentBooks = books.filter(b => {
        if (b.subject !== selectedSubject) return false;
        if (!b.isStudentBook) return false;
        const rt = b.resourceType || 'soru';
        if (selectedType === 'Soru Çözümü') return rt === 'soru';
        if (selectedType === 'Konu Çalışması') return rt === 'konu';
        if (selectedType === 'YouTube Video') return rt === 'youtube';
        return true;
    }).sort((a, b) => (a.order ?? 999) - (b.order ?? 999));

    // Global / system books for this subject that are NOT in student's personal list
    const globalOtherBooks = books.filter(b => {
        if (b.subject !== selectedSubject) return false;
        if (b.isStudentBook) return false;
        const rt = b.resourceType || 'soru';
        if (selectedType === 'Soru Çözümü') return rt === 'soru';
        if (selectedType === 'Konu Çalışması') return rt === 'konu';
        if (selectedType === 'YouTube Video') return rt === 'youtube';
        return true;
    }).sort((a, b) => (a.order ?? 999) - (b.order ?? 999));

    // When type, branch, or subject changes, ensure selectedBook aligns with student's resources
    useEffect(() => {
        if (selectedBranch === 'Denemeler') {
            setSelectedBook('none');
            return;
        }

        if (studentBooks.length > 0) {
            // If current selectedBook is not in student's books and not explicitly 'none', default to first student book
            if (!studentBooks.some(b => b.id === selectedBook) && selectedBook !== 'none') {
                setSelectedBook(studentBooks[0].id);
            }
        } else {
            // No student books for this subject/type, default to 'none' (Müfredat) unless coach selected a global book
            if (!globalOtherBooks.some(b => b.id === selectedBook)) {
                setSelectedBook('none');
            }
        }
    }, [selectedSubject, selectedType, selectedBranch, studentBooks, globalOtherBooks]);

    useEffect(() => {
        if (isTourOpen) {
            setSelectedType('Soru Çözümü');
            setSelectedBranch('TYT');
            setSelectedSubject('Biyoloji');
            const bioBook = books.find(b => b.subject === 'Biyoloji' && (b.resourceType || 'soru') === 'soru');
            if (bioBook) {
                setSelectedBook(bioBook.id);
            } else {
                setSelectedBook('demo-biyotik-1');
            }
        }
    }, [isTourOpen, books]);

    const activeBookData = selectedBook !== 'none' 
        ? (books.find(b => b.id === selectedBook) || (selectedBook === 'demo-biyotik-1' ? books.find(b => b.id === 'demo-biyotik-1') : null))
        : null;

    const q = searchQuery.trim().toLowerCase();

    // Filter curriculum topics based on search
    const rawCurriculumTopics: string[] = activeCurriculum[selectedSubject] || [];
    const filteredCurriculumTopics = rawCurriculumTopics.filter(topic => {
        if (!q) return true;
        if (topic.toLowerCase().includes(q)) return true;
        const subtopics = activeSubtopics[topic] || [];
        return subtopics.some(sub => sub.toLowerCase().includes(q));
    });

    return (
        <div id="tour-program-sidebar" className="space-y-3 bg-slate-900/60 p-3.5 rounded-2xl border border-white/5 shadow-inner">
            
            {/* Header & Quick Search */}
            <div className="space-y-2">
                <div className="flex items-center justify-between">
                    <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-1.5">
                        <Layers size={13} className="text-indigo-400" />
                        Görev Kütüphanesi
                    </h3>
                    <span className="text-[9px] font-semibold text-slate-500 bg-slate-800/80 px-2 py-0.5 rounded-full border border-white/5">
                        Sürükle & Bırak
                    </span>
                </div>

                {/* Instant Topic Search */}
                <div className="relative">
                    <Search size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input 
                        type="text"
                        value={searchQuery}
                        onChange={e => setSearchQuery(e.target.value)}
                        placeholder="Konu veya video ara..."
                        className="w-full bg-slate-950/80 text-xs text-slate-200 placeholder-slate-500 pl-8 pr-7 py-1.5 rounded-xl border border-white/10 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none transition-all"
                    />
                    {searchQuery && (
                        <button 
                            onClick={() => setSearchQuery('')}
                            className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white p-0.5"
                        >
                            <X size={12} />
                        </button>
                    )}
                </div>
            </div>

            {/* 1. Görev Türü Seçimi (Task Types) */}
            <div id="tour-program-task-types" className="space-y-1">
                <p className="text-[9px] font-black text-slate-500 uppercase tracking-wider pl-1">1. Çalışma Türü</p>
                <div className="grid grid-cols-3 gap-1 bg-slate-950/60 p-1 rounded-xl border border-white/5">
                    {TASK_TYPES.map((type) => {
                        const isSelected = selectedType === type;
                        const isVideo = type === 'YouTube Video';
                        const isKonu = type === 'Konu Çalışması';
                        return (
                            <button
                                key={type}
                                onClick={() => setSelectedType(type)}
                                className={`flex items-center justify-center gap-1.5 py-1.5 px-1 rounded-lg text-[10px] font-bold transition-all text-center ${
                                    isSelected
                                        ? isVideo 
                                            ? 'bg-red-500/20 text-red-300 border border-red-500/40 shadow-sm'
                                            : isKonu
                                                ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40 shadow-sm'
                                                : 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                                        : 'text-slate-400 hover:text-slate-200 hover:bg-white/5'
                                }`}
                            >
                                {isVideo ? <Youtube size={12} className={isSelected ? 'text-red-400' : 'text-slate-400'} /> :
                                 isKonu ? <FileText size={12} className={isSelected ? 'text-amber-400' : 'text-slate-400'} /> :
                                 <Book size={12} className={isSelected ? 'text-white' : 'text-slate-400'} />}
                                <span className="truncate">{type.replace(' Çalışması', '').replace(' Çözümü', '')}</span>
                            </button>
                        );
                    })}
                </div>
            </div>

            {/* 2. Sınav & Branş Seçimi (Branches) */}
            <div id="tour-program-branches" className="space-y-1">
                <p className="text-[9px] font-black text-slate-500 uppercase tracking-wider pl-1">2. Sınav / Kademe</p>
                <div className="flex flex-wrap gap-1 bg-slate-950/60 p-1 rounded-xl border border-white/5">
                    {dynamicBranches.map((branch) => {
                        const isSelected = selectedBranch === branch;
                        return (
                            <button
                                key={branch}
                                onClick={() => setSelectedBranch(branch)}
                                className={`flex-1 min-w-[60px] py-1 px-2 rounded-lg text-[10px] font-bold transition-all text-center ${
                                    isSelected
                                        ? 'bg-slate-800 text-indigo-400 border border-indigo-500/30 shadow-sm'
                                        : 'text-slate-400 hover:text-slate-200 hover:bg-white/5'
                                }`}
                            >
                                {branch}
                            </button>
                        );
                    })}
                </div>
            </div>

            {/* 3. Ders Seçimi (Subjects - Multi-Column Grid Layout: No Horizontal Scrolling!) */}
            <div id="tour-program-subjects" className="space-y-1.5">
                <div className="flex items-center justify-between pl-1">
                    <p className="text-[9px] font-black text-slate-500 uppercase tracking-wider">3. Ders Seçimi</p>
                    <span className="text-[9px] text-slate-500 font-medium">{availableSubjects.length} Ders</span>
                </div>
                
                {/* 3-Column Compact Grid for Instant One-Click Access */}
                <div className="grid grid-cols-3 gap-1 bg-slate-950/40 p-1.5 rounded-xl border border-white/5">
                    {availableSubjects.map((subject) => {
                        const isSelected = selectedSubject === subject;
                        const formattedName = formatSubjectName(subject, selectedBranch);
                        const studentSubjectBookCount = books.filter(b => b.isStudentBook && b.subject === subject && (b.resourceType || 'soru') === (selectedType === 'YouTube Video' ? 'youtube' : selectedType === 'Konu Çalışması' ? 'konu' : 'soru')).length;
                        
                        return (
                            <button
                                key={subject}
                                onClick={() => {
                                    setSelectedSubject(subject);
                                    setShowGlobalLibrary(false);
                                }}
                                className={`relative flex flex-col items-center justify-center p-1.5 rounded-lg text-center transition-all border ${
                                    isSelected
                                        ? 'bg-indigo-600 text-white font-black shadow-md shadow-indigo-600/30 border-indigo-400/50'
                                        : 'bg-slate-900/60 text-slate-300 font-medium border-white/5 hover:bg-slate-800/80 hover:text-white hover:border-white/10'
                                }`}
                                title={subject}
                            >
                                <span className="text-[10px] leading-tight truncate w-full px-0.5">{formattedName}</span>
                                {studentSubjectBookCount > 0 && (
                                    <span className={`text-[8px] font-black mt-0.5 px-1 py-0.2 rounded-full ${
                                        isSelected 
                                            ? 'bg-indigo-900/80 text-indigo-200 border border-indigo-400/40' 
                                            : 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                                    }`}>
                                        {studentSubjectBookCount} {selectedType === 'YouTube Video' ? 'video' : 'kaynak'}
                                    </span>
                                )}
                            </button>
                        );
                    })}
                </div>
            </div>

            {/* 4. Kaynak Seçimi (Öğrencinin Mevcut Kaynakları Odaklı) */}
            {selectedBranch !== 'Denemeler' && (
                <div className="space-y-1.5 bg-slate-950/50 p-2.5 rounded-xl border border-white/5">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-1.5">
                            <p className="text-[9px] font-black text-slate-400 uppercase tracking-wider">4. Kaynak Seçimi</p>
                            <span className="text-[8px] font-bold text-emerald-400 bg-emerald-500/10 px-1.5 py-0.2 rounded border border-emerald-500/20">
                                Öğrenci Kaynakları
                            </span>
                        </div>
                        {activeBookData?.channelTitle && (
                            <span className="text-[9px] text-red-400 font-bold truncate max-w-[120px]">{activeBookData.channelTitle}</span>
                        )}
                    </div>

                    <div className="space-y-1.5">
                        {/* Öğrencinin Kayıtlı Kaynakları */}
                        {studentBooks.length > 0 ? (
                            <div className="space-y-1">
                                {studentBooks.map((book) => {
                                    const isSelected = selectedBook === book.id;
                                    const isYt = book.resourceType === 'youtube';
                                    const isKonuBook = book.resourceType === 'konu';
                                    const isBookCompleted = (book.completionPercentage || 0) >= 100 || (book.completedTopics && book.completedTopics.length > 0 && book.totalTopics && book.completedTopics.length >= book.totalTopics);
                                    
                                    return (
                                        <button
                                            key={book.id}
                                            onClick={() => setSelectedBook(book.id)}
                                            className={`w-full flex items-center justify-between gap-2 p-2 rounded-xl text-left transition-all border ${
                                                isBookCompleted
                                                    ? isSelected
                                                        ? 'bg-emerald-500/25 text-white border-emerald-400 shadow-md shadow-emerald-500/20'
                                                        : 'bg-emerald-950/40 text-emerald-200 border-emerald-500/40 hover:bg-emerald-900/50 hover:border-emerald-400'
                                                    : isSelected
                                                        ? isYt 
                                                            ? 'bg-red-500/15 text-white border-red-500/40 shadow-sm shadow-red-500/10' 
                                                            : 'bg-indigo-500/20 text-white border-indigo-500/40 shadow-sm shadow-indigo-500/10'
                                                        : 'bg-slate-900/80 text-slate-300 border-white/5 hover:bg-slate-800 hover:text-white'
                                            }`}
                                        >
                                            <div className="flex items-center gap-2 min-w-0 flex-1">
                                                {isBookCompleted ? (
                                                    <CheckCircle2 size={14} className="text-emerald-400 shrink-0" />
                                                ) : isYt ? (
                                                    <Youtube size={14} className="text-red-400 shrink-0" />
                                                ) : isKonuBook ? (
                                                    <FileText size={14} className="text-amber-400 shrink-0" />
                                                ) : (
                                                    <Book size={14} className="text-indigo-400 shrink-0" />
                                                )}
                                                <div className="min-w-0 flex-1">
                                                    <p className={`text-[11px] font-bold truncate leading-tight ${isBookCompleted ? 'text-emerald-200' : ''}`}>
                                                        {book.bookName}
                                                    </p>
                                                    {book.channelTitle && (
                                                        <p className="text-[9px] text-slate-500 truncate leading-tight">{book.channelTitle}</p>
                                                    )}
                                                </div>
                                            </div>
                                            
                                            <div className="shrink-0 flex items-center gap-1.5">
                                                {isBookCompleted ? (
                                                    <span className="text-[9px] font-mono font-black px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 flex items-center gap-1">
                                                        <Check size={10} className="stroke-[3]" /> %100
                                                    </span>
                                                ) : (
                                                    <span className={`text-[9px] font-mono font-bold px-1.5 py-0.5 rounded ${
                                                        (book.completionPercentage || 0) > 0
                                                            ? 'bg-emerald-500/15 text-emerald-300 border border-emerald-500/30'
                                                            : isSelected 
                                                                ? 'bg-indigo-500/30 text-indigo-200' 
                                                                : 'bg-slate-800 text-slate-400'
                                                    }`}>
                                                        {isYt && book.videos?.length ? `${book.videos.length} Video` : `%${book.completionPercentage || 0}`}
                                                    </span>
                                                )}
                                            </div>
                                        </button>
                                    );
                                })}
                            </div>
                        ) : (
                            <div className="p-2 rounded-lg bg-slate-900/60 border border-dashed border-white/10 text-center">
                                <p className="text-[10px] text-slate-400 font-medium">
                                    Öğrencinin bu derste kayıtlı {selectedType === 'YouTube Video' ? 'video listesi' : selectedType === 'Konu Çalışması' ? 'konu kaynağı' : 'soru bankası'} yok.
                                </p>
                            </div>
                        )}

                        {/* Müfredat (Kaynaksız) Butonu */}
                        <div className="flex flex-wrap items-center gap-1 pt-0.5">
                            <button
                                onClick={() => setSelectedBook('none')}
                                className={`flex-1 flex items-center justify-center gap-1.5 py-1 px-2 rounded-lg text-[10px] font-bold transition-all border ${
                                    selectedBook === 'none'
                                        ? 'bg-slate-800 text-indigo-300 border-indigo-500/40 shadow-sm'
                                        : 'bg-slate-900/60 text-slate-400 border-white/5 hover:text-slate-200'
                                }`}
                            >
                                <FileText size={11} className={selectedBook === 'none' ? 'text-indigo-400' : 'text-slate-500'} />
                                <span>Müfredat (Kaynaksız)</span>
                            </button>

                            {/* Global Kütüphane Genişletici */}
                            {globalOtherBooks.length > 0 && (
                                <button
                                    type="button"
                                    onClick={() => setShowGlobalLibrary(!showGlobalLibrary)}
                                    className={`py-1 px-2 rounded-lg text-[9px] font-bold transition-all border flex items-center gap-1 ${
                                        showGlobalLibrary
                                            ? 'bg-indigo-500/20 text-indigo-300 border-indigo-500/30'
                                            : 'bg-slate-900/40 text-slate-500 border-white/5 hover:text-slate-400'
                                    }`}
                                >
                                    <span>{showGlobalLibrary ? 'Genel Gizle' : `+ Genel (${globalOtherBooks.length})`}</span>
                                </button>
                            )}
                        </div>

                        {/* Genel Kütüphane Kaynakları (İsteğe bağlı açılır) */}
                        {showGlobalLibrary && globalOtherBooks.length > 0 && (
                            <div className="pt-1.5 border-t border-white/5 space-y-1 animate-in fade-in duration-200">
                                <p className="text-[8px] font-black text-slate-500 uppercase tracking-widest pl-0.5">Sistemdeki Diğer Kaynaklar</p>
                                <div className="grid grid-cols-1 gap-1 max-h-32 overflow-y-auto custom-scrollbar">
                                    {globalOtherBooks.map(book => {
                                        const isSelected = selectedBook === book.id;
                                        return (
                                            <button
                                                key={book.id}
                                                onClick={() => setSelectedBook(book.id)}
                                                className={`flex items-center justify-between p-1.5 rounded-lg text-left text-[10px] transition-all border ${
                                                    isSelected
                                                        ? 'bg-indigo-600/30 text-indigo-200 border-indigo-500/40'
                                                        : 'bg-slate-900/50 text-slate-400 border-white/5 hover:bg-slate-800 hover:text-slate-200'
                                                }`}
                                            >
                                                <span className="truncate font-medium flex-1">{book.bookName}</span>
                                                <span className="text-[8px] text-slate-500 uppercase ml-1">Genel</span>
                                            </button>
                                        );
                                    })}
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* 5. Konu & Video Listesi (Clean, 100% Full-Width, Non-Cascading!) */}
            <div className="space-y-1 pt-1">
                <div className="flex items-center justify-between pl-1">
                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-wider">
                        {selectedBranch === 'Denemeler' ? 'Deneme Başlıkları' : selectedType === 'YouTube Video' && activeBookData?.videos?.length ? 'Video Listesi' : 'Konu Başlıkları'}
                    </p>
                    <span className="text-[9px] text-slate-500">
                        {selectedBranch === 'Denemeler' 
                            ? `${DENEME_TYPES.filter(d => d.subject === selectedSubject).length || 1} Deneme`
                            : selectedType === 'YouTube Video' && activeBookData?.videos?.length 
                                ? `${activeBookData.videos.length} Video (${activeBookData.totalDurationFormatted || `${activeBookData.totalDurationMinutes || 0} dk`})`
                                : `${filteredCurriculumTopics.length} Konu`}
                    </span>
                </div>

                <div className="space-y-1.5 max-h-[440px] overflow-y-auto custom-scrollbar pr-1">
                    {/* Denemeler List */}
                    {selectedBranch === 'Denemeler' && (
                        <div className="space-y-1">
                            {DENEME_TYPES.filter(d => d.subject === selectedSubject).map(d => (
                                <TopicDraggable 
                                    key={d.name} 
                                    topic={d.name} 
                                    subject={selectedSubject} 
                                    branch={selectedBranch} 
                                    type={selectedType} 
                                    bookId={null} 
                                    isCompleted={false} 
                                    targetCount={d.questionCount} 
                                    isFirstTopic={false}
                                />
                            ))}
                            {DENEME_TYPES.filter(d => d.subject === selectedSubject).length === 0 && (
                                <TopicDraggable 
                                    topic={`${selectedSubject} Denemesi`} 
                                    subject={selectedSubject} 
                                    branch={selectedBranch} 
                                    type={selectedType} 
                                    bookId={null} 
                                    isCompleted={false} 
                                    isFirstTopic={false}
                                />
                            )}
                        </div>
                    )}

                    {/* YouTube Playlist Videos */}
                    {selectedBranch !== 'Denemeler' && selectedType === 'YouTube Video' && activeBookData?.videos && activeBookData.videos.length > 0 && (
                        <div className="space-y-1">
                            {activeBookData.videos
                                .filter((vid: any) => !q || vid.title.toLowerCase().includes(q))
                                .map((vid: any, vidIdx: number) => {
                                    const isCompleted = (activeBookData?.completedTopics || []).includes(vid.title);
                                    return (
                                        <TopicDraggable 
                                            key={`${activeBookData.id}-video-${vid.videoId || vidIdx}`} 
                                            topic={vid.title} 
                                            subject={selectedSubject} 
                                            branch={selectedBranch} 
                                            type="YouTube Video" 
                                            bookId={activeBookData.id} 
                                            isCompleted={isCompleted} 
                                            targetCount={vid.durationMinutes || 1} 
                                            bookData={activeBookData} 
                                            updateBookTopicCount={updateBookTopicCount} 
                                            isFirstTopic={vidIdx === 0}
                                            videoInfo={vid}
                                        />
                                    );
                                })}
                        </div>
                    )}

                    {/* Standard Soru / Konu / Kaynaksız Curriculum Topics */}
                    {selectedBranch !== 'Denemeler' && !(selectedType === 'YouTube Video' && activeBookData?.videos?.length) && (
                        <div className="space-y-1.5">
                            {/* Quick General Review Card */}
                            {!q && (
                                <TopicDraggable 
                                    key={`${selectedBook}-Genel Tekrar`} 
                                    topic="Genel Tekrar / Çalışma" 
                                    subject={selectedSubject} 
                                    branch={selectedBranch} 
                                    type={selectedType} 
                                    bookId={selectedBook === 'none' ? null : selectedBook} 
                                    isCompleted={false} 
                                    bookData={activeBookData} 
                                    updateBookTopicCount={updateBookTopicCount} 
                                    isFirstTopic={false} 
                                />
                            )}

                            {filteredCurriculumTopics.map((topic: string, topicIdx: number) => {
                                let isCompleted = (activeBookData?.completedTopics || []).includes(topic);
                                const subtopics = activeSubtopics[topic] || [];
                                if (!isCompleted && subtopics.length > 0) {
                                    isCompleted = subtopics.every(sub => (activeBookData?.completedTopics || []).includes(sub));
                                }
                                const isTargetTopic = (selectedSubject === 'Biyoloji' && topicIdx === 0);
                                const matchingSubtopics = subtopics.filter(sub => !q || sub.toLowerCase().includes(q) || topic.toLowerCase().includes(q));

                                return (
                                    <div key={`${selectedBook}-${topic}`} className="space-y-1">
                                        <TopicDraggable 
                                            topic={topic} 
                                            subject={selectedSubject} 
                                            branch={selectedBranch} 
                                            type={selectedType} 
                                            bookId={selectedBook === 'none' ? null : selectedBook} 
                                            isCompleted={isCompleted} 
                                            bookData={activeBookData} 
                                            updateBookTopicCount={updateBookTopicCount} 
                                            isFirstTopic={isTargetTopic} 
                                            subtopicsList={subtopics}
                                        />
                                        
                                        {/* Subtopics directly underneath with clear 1-level accent border without sliding right */}
                                        {matchingSubtopics.length > 0 && (
                                            <div className="pl-3 ml-1 border-l-2 border-indigo-500/20 space-y-1">
                                                {matchingSubtopics.map(subtopic => {
                                                    const subIsCompleted = isCompleted || (activeBookData?.completedTopics || []).includes(subtopic);
                                                    return (
                                                        <TopicDraggable 
                                                            key={`${selectedBook}-${topic}-${subtopic}`} 
                                                            topic={subtopic} 
                                                            subject={selectedSubject} 
                                                            branch={selectedBranch} 
                                                            type={selectedType} 
                                                            bookId={selectedBook === 'none' ? null : selectedBook} 
                                                            isCompleted={subIsCompleted} 
                                                            bookData={activeBookData} 
                                                            updateBookTopicCount={updateBookTopicCount} 
                                                        />
                                                    );
                                                })}
                                            </div>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

const DroppableDay = (props: React.PropsWithChildren<{ id: string, label: string, shortLabel: string, tasks: any[], completionPercentage?: number, coachNote?: string, studentNote?: string, onCoachNoteChange?: (val: string) => void }>) => {
    const { id, label, shortLabel, tasks, children, completionPercentage, coachNote, studentNote, onCoachNoteChange } = props;
    const { setNodeRef } = useDroppable({ id });
    const dayTotalQuestions = tasks.reduce((sum: number, t: any) => sum + ((t.type !== 'Konu Çalışması' && t.type !== 'YouTube Video') ? (Number(t.targetCount) || 0) : 0), 0);
    const dayTotalTasks = tasks.length;
    const [showNote, setShowNote] = useState(!!coachNote || !!studentNote);

    return (
        <div ref={setNodeRef} className="relative bg-slate-900/40 border border-white/5 rounded-3xl p-5 flex flex-col gap-4 min-h-[400px] hover:border-indigo-500/20 transition-all group">
            <div className="flex items-center justify-between border-b border-white/5 pb-3">
                <div className="flex flex-col">
                   <div className="flex items-center gap-2">
                     <span className="text-sm font-black text-indigo-400 uppercase tracking-widest">{label}</span>
                     {onCoachNoteChange && (
                        <button 
                            onClick={() => setShowNote(!showNote)}
                            className={`p-1 rounded transition-colors ${showNote || coachNote || studentNote ? 'text-amber-400 bg-amber-400/10' : 'text-slate-500 hover:text-amber-400 hover:bg-white/5'}`}
                            title="Koç Notu"
                        >
                            <StickyNote size={14} />
                        </button>
                     )}
                   </div>
                    <span className="text-sm font-bold text-slate-200 mt-0.5">{shortLabel}</span>
                </div>
                <div className="flex flex-col items-end gap-1">
                    {dayTotalTasks > 0 && typeof completionPercentage === 'number' && (
                        <div className={`px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-widest border ${completionPercentage >= 80 ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30' : completionPercentage >= 50 ? 'bg-orange-500/20 text-orange-400 border-orange-500/30' : 'bg-red-500/20 text-red-400 border-red-500/30'}`}>
                            %{completionPercentage} BŞR
                        </div>
                    )}
                    {dayTotalQuestions > 0 && (
                        <div className="flex flex-col items-end">
                            <span className="text-lg font-black text-white">{dayTotalQuestions}</span>
                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Soru</span>
                        </div>
                    )}
                </div>
            </div>
            {showNote && (
                <div className="mt-1 space-y-2">
                    {onCoachNoteChange && (
                        <div>
                            <p className="text-[10px] font-black tracking-widest text-amber-500 uppercase mb-1">Koç Notu</p>
                            <textarea 
                                value={coachNote || ''}
                                onChange={(e) => onCoachNoteChange(e.target.value)}
                                onKeyDown={(e) => e.stopPropagation()}
                                placeholder="Bu gün için koç notu ekle..."
                                className="w-full bg-slate-800/50 border border-white/5 rounded-lg p-2 text-xs text-amber-300 placeholder-slate-500 outline-none focus:border-amber-500/50 resize-none"
                                rows={2}
                            />
                        </div>
                    )}
                    {studentNote && (
                        <div>
                            <p className="text-[10px] font-black tracking-widest text-emerald-500 uppercase mb-1">Öğrenci Notu</p>
                            <div className="w-full bg-black/20 border border-white/5 rounded-lg p-2 text-xs text-emerald-300">
                                {studentNote}
                            </div>
                        </div>
                    )}
                </div>
            )}
            {children}
        </div>
    );
};


const SortableTask = (props: any) => {
  const { task, updateTask, removeTask, duplicateTask, currentSubjects, subjects, CURRICULUM, books, isFirstTaskCard, isTourOpen } = props;
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
  } = useSortable({ id: task.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  const taskBooks = books.filter((b: any) => {
    if (b.subject !== task.subject) return false;
    if (task.type === 'YouTube Video') return b.resourceType === 'youtube';
    if (task.type === 'Konu Çalışması') return b.resourceType === 'konu';
    if (task.type === 'Soru Çözümü') return b.resourceType === 'soru' || !b.resourceType;
    return true;
  });

  const tColor = task.type === 'YouTube Video' ? 'red' : task.type === 'Konu Çalışması' ? 'orange' : 'emerald';
  const styles = {
    emerald: { text: 'text-emerald-400', icon: 'text-emerald-500', bg: 'bg-emerald-500', border: 'border-emerald-500', shadow: 'shadow-emerald-500/20' },
    orange: { text: 'text-orange-400', icon: 'text-orange-500', bg: 'bg-orange-500', border: 'border-orange-500', shadow: 'shadow-orange-500/20' },
    red: { text: 'text-red-400', icon: 'text-red-500', bg: 'bg-red-500', border: 'border-red-500', shadow: 'shadow-red-500/20' }
  }[tColor] || { text: 'text-emerald-400', icon: 'text-emerald-500', bg: 'bg-emerald-500', border: 'border-emerald-500', shadow: 'shadow-emerald-500/20' };

  const [showDistribute, setShowDistribute] = useState(false);
  const [distributeCount, setDistributeCount] = useState(task.targetCount || 100);
  const [selectedDays, setSelectedDays] = useState<string[]>([task.date]);
  const [showTaskNote, setShowTaskNote] = useState(!!task.coachNote || !!task.studentNote);

  const handleDistribute = (onDistribute: (taskId: string, count: number, days: string[]) => void) => {
    onDistribute(task.id, distributeCount, selectedDays);
    setShowDistribute(false);
  };

  const isWaitingExpired = (() => {
    if (!task.isWaitingResult || !task.date) return false;
    const parts = task.date.split('-');
    if (parts.length !== 3) return false;
    const tDateObj = new Date(Number(parts[0]), Number(parts[1]) - 1, Number(parts[2]));
    const todayObj = new Date();
    const todayZero = new Date(todayObj.getFullYear(), todayObj.getMonth(), todayObj.getDate());
    const diffDays = Math.floor((todayZero.getTime() - tDateObj.getTime()) / (1000 * 3600 * 24));
    return diffDays >= 5;
  })();

  const cardContainerClass = isWaitingExpired
    ? 'bg-red-500/10 border-red-500/50 shadow-lg shadow-red-500/10'
    : (task.isDone && !isWaitingExpired)
      ? `${styles.border} ${styles.bg}/10`
      : (task.isExtra ? 'bg-gradient-to-br from-emerald-500/10 to-transparent border-emerald-500/30' : 'bg-white/5 border-white/10');

  return (
    <div id={isFirstTaskCard ? "tour-sample-task-card" : undefined} ref={setNodeRef} style={style} {...attributes} {...listeners} className={`${cardContainerClass} border rounded-xl p-2 relative group/task cursor-grab active:cursor-grabbing`}>
      {task.isExtra && (
        <div className="absolute -top-2 -left-2 bg-emerald-500 text-white text-[8px] font-black uppercase tracking-widest px-1.5 py-0.5 rounded shadow-lg z-10 flex items-center gap-0.5">
           <Sparkles size={8} /> Öğrenci Ekledi
        </div>
      )}
      {task.isWaitingResult && (
        <div className={`absolute -bottom-2 -left-2 text-white text-[8px] font-black uppercase tracking-widest px-1.5 py-0.5 rounded shadow-lg z-10 flex items-center gap-0.5 ${
          isWaitingExpired ? 'bg-red-600 border border-red-400' : 'bg-amber-500'
        }`}>
           {isWaitingExpired ? 'Sonuç Bekleniyor (5+ Gün - Yapılmadı)' : 'Sonuç Bekleniyor'}
        </div>
      )}
      <div 
        id={isFirstTaskCard && isTourOpen ? "tour-task-actions" : undefined} 
        className={`absolute -top-2 -right-2 flex items-center gap-1 transition-all z-10 ${
          isFirstTaskCard && isTourOpen
            ? 'opacity-100 scale-100' 
            : 'opacity-90 sm:opacity-0 group-hover/task:opacity-100 scale-90 sm:scale-75 group-hover/task:scale-100'
        }`}
      >
        <button 
          id={isFirstTaskCard ? "tour-task-note" : undefined}
          onPointerDown={(e) => { e.stopPropagation(); e.preventDefault(); setShowTaskNote(!showTaskNote); }}
          className={`w-6 h-6 rounded-full ${showTaskNote || task.coachNote || task.studentNote ? 'bg-amber-500 text-white' : 'bg-slate-700 text-slate-300 hover:bg-amber-500 hover:text-white'} flex items-center justify-center shadow-lg transition-colors`}
          title="Koç Notu Ekle"
        >
          <StickyNote size={10} />
        </button>
        <button 
          id={isFirstTaskCard ? "tour-task-copy" : undefined}
          onPointerDown={(e) => { e.stopPropagation(); e.preventDefault(); duplicateTask?.(task); }}
          className="w-6 h-6 rounded-full bg-blue-500 hover:bg-blue-400 text-white flex items-center justify-center shadow-lg transition-colors"
          title="Görevi Kopyala"
        >
          <Copy size={10} />
        </button>
        {(task.type === 'Soru Çözümü' || task.type === 'Konu Çalışması' || task.type === 'YouTube Video' || task.branch === 'Denemeler') && (
           <button 
             id={isFirstTaskCard ? "tour-task-distribute" : undefined}
             onPointerDown={(e) => { 
                e.stopPropagation(); 
                e.preventDefault(); 
                if (!showDistribute) {
                   setDistributeCount(task.targetCount || 0);
                   setSelectedDays([task.date]);
                }
                setShowDistribute(!showDistribute); 
             }}
             className="w-6 h-6 rounded-full bg-indigo-500 hover:bg-indigo-400 text-white flex items-center justify-center shadow-lg transition-all"
             title="Günlere Dağıt"
           >
             <Sparkles size={10} />
           </button>
        )}
        <button 
          id={isFirstTaskCard ? "tour-task-delete" : undefined}
          onPointerDown={(e) => { e.stopPropagation(); e.preventDefault(); removeTask(task.id); }}
          className="w-6 h-6 rounded-full bg-red-500 hover:bg-red-400 text-white flex items-center justify-center shadow-lg transition-colors"
          title="Görevi Sil"
        >
          <Trash2 size={10} />
        </button>
      </div>

      <div className="space-y-1 select-none">
        <div className={`w-full text-[10px] font-bold ${styles.text} uppercase mb-1 opacity-80 flex items-center justify-between`}>
          <span className="flex items-center gap-1">
            {task.type === 'YouTube Video' && <Youtube size={11} className="text-red-400" />}
            {task.type || 'Soru Çözümü'}
          </span>
          {task.type === 'YouTube Video' && (task.durationFormatted || (task.durationMinutes && task.durationMinutes > 0)) && (
            <span className="text-[9px] font-black text-red-400 bg-red-500/10 px-1.5 py-0.5 rounded border border-red-500/20 lowercase tracking-normal">
              {task.durationFormatted || `${task.durationMinutes} dk`}
            </span>
          )}
        </div>
        <div className={`w-full text-sm font-black ${styles.text} uppercase truncate`}>
          {formatSubjectName(task.subject, task.branch)}
        </div>
        <div className="w-full text-xs text-slate-300 font-bold truncate py-0.5 flex items-center justify-between gap-1">
          <span className="truncate" title={task.topic}>{task.topic || 'KONU SEÇİLMEMİŞ'}</span>
          {task.videoUrl && (
            <a
              href={task.videoUrl}
              target="_blank"
              rel="noreferrer"
              onPointerDown={(e) => e.stopPropagation()}
              className="text-[10px] text-red-400 hover:text-red-300 bg-red-500/10 hover:bg-red-500/20 px-1.5 py-0.5 rounded flex items-center gap-0.5 shrink-0 transition-colors"
              title="YouTube'da Aç"
            >
              <Play size={8} fill="currentColor" /> İzle
            </a>
          )}
        </div>

        <select 
          value={task.bookId}
          onChange={(e) => {
            const val = e.target.value;
            updateTask(task.id, 'bookId', val);
            if (val && task.topic) {
              const bookData = books.find((b: any) => b.id === val);
              if (bookData?.topicQuestionCounts?.[task.topic]) {
                updateTask(task.id, 'targetCount', bookData.topicQuestionCounts[task.topic]);
              }
            }
          }}
          onPointerDown={(e) => e.stopPropagation()}
          className="w-full bg-transparent border-none text-[11px] text-slate-500 font-medium outline-none appearance-none cursor-pointer hover:bg-white/5 rounded py-0.5 truncate"
        >
          <option value="">KİTAP SEÇ...</option>
          {task.bookId && task.bookId.startsWith('virtual-') && (
            <option value={task.bookId} className="bg-slate-900">
              {task.bookId.endsWith('-2') ? '2. Kitap (Planlanan)' : '3. Kitap (Planlanan)'}
            </option>
          )}
          {taskBooks.map((b: any) => (
            <option key={b.id} value={b.id} className="bg-slate-900">{b.bookName}</option>
          ))}
        </select>

        <div className="flex items-center justify-between gap-2 mt-2 pt-2 border-t border-white/5">
           <div className="flex flex-col gap-1 w-full relative">
              <div className="flex items-center gap-1 w-full">
                  <Target size={14} className={styles.icon} />
                  <input 
                    type="number"
                    value={task.targetCount || ''}
                    placeholder={task.type === 'YouTube Video' ? 'Video Sayısı' : task.type === 'Konu Çalışması' ? 'Sayfa Sayısı' : 'Soru Sayısı'}
                    onChange={(e) => updateTask(task.id, 'targetCount', parseInt(e.target.value) || 0)}
                    onPointerDown={(e) => e.stopPropagation()}
                    onKeyDown={(e) => e.stopPropagation()}
                    className={`w-full bg-white/5 border border-white/10 rounded py-1 px-2 text-xs font-black text-white outline-none focus:${styles.border}/50 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none`}
                  />
                  {task.completedCount !== undefined && task.completedCount > 0 && (
                     <span className="text-[10px] font-bold text-emerald-400 whitespace-nowrap ml-1 shrink-0">
                        / {task.completedCount} {task.type === 'YouTube Video' ? 'İzlendi' : task.type === 'Konu Çalışması' ? 'Okundu' : 'Çözüldü'}
                     </span>
                  )}
              </div>
           </div>
           <button 
             onPointerDown={(e) => { e.stopPropagation(); e.preventDefault(); updateTask(task.id, 'isDone', !task.isDone); }}
             className={`w-8 h-8 rounded-lg border flex items-center justify-center transition-all flex-shrink-0 z-10 ${
               (task.isDone && !isWaitingExpired) 
                 ? `${styles.bg} ${styles.border} text-white shadow-lg ${styles.shadow}` 
                 : isWaitingExpired 
                 ? 'border-red-500/60 bg-red-500/20 text-red-400' 
                 : 'border-white/10 text-transparent'
             }`}
             title={isWaitingExpired ? 'Sonuç 5 gün içerisinde girilmediği için yapılmadı sayıldı.' : undefined}
           >
             <CheckCircle2 size={16} />
           </button>
        </div>
        
        {showTaskNote && (
            <div className="mt-2 space-y-2">
                <div>
                    <p className="text-[9px] font-black tracking-widest text-amber-500 uppercase mb-1">Koç Notu</p>
                    <textarea
                        value={task.coachNote || ''}
                        onChange={(e) => updateTask(task.id, 'coachNote', e.target.value)}
                        onPointerDown={(e) => e.stopPropagation()}
                        onKeyDown={(e) => e.stopPropagation()}
                        placeholder="Görev için koç notu ekle..."
                        className="w-full bg-slate-800/50 border border-white/10 rounded pt-1 pb-1 px-2 text-[10px] text-amber-300 placeholder-slate-500 outline-none focus:border-amber-500/50 resize-none h-12"
                    />
                </div>
                {task.studentNote && (
                    <div>
                        <p className="text-[9px] font-black tracking-widest text-emerald-500 uppercase mb-1">Öğrenci Notu</p>
                        <div className="w-full bg-black/20 border border-white/10 rounded pt-1 pb-1 px-2 text-[10px] text-emerald-300">
                            {task.studentNote}
                        </div>
                    </div>
                )}
            </div>
        )}

        {showDistribute && (
          <div className="mt-2 p-2 bg-slate-900/90 rounded-lg border border-indigo-500/30 space-y-2 z-20" onPointerDown={e => e.stopPropagation()} onKeyDown={e => e.stopPropagation()}>
            <p className="text-[9px] font-black text-indigo-400 uppercase">Soru Sayısını Dağıt</p>
            <div className="flex items-center gap-2">
              <input 
                type="number" 
                value={distributeCount}
                onChange={e => setDistributeCount(parseInt(e.target.value) || 0)}
                className="w-full bg-slate-800 text-white rounded p-1 text-[10px] font-bold outline-none"
                placeholder={task.type === 'YouTube Video' ? 'Toplam Video' : task.type === 'Konu Çalışması' ? 'Toplam Sayfa' : 'Toplam Soru'}
              />
            </div>
            <div className="flex flex-wrap gap-1">
              {props.allDays.map((d: any) => (
                <button
                  key={d.date}
                  onClick={() => {
                    setSelectedDays(prev => 
                      prev.includes(d.date) ? prev.filter(x => x !== d.date) : [...prev, d.date]
                    );
                  }}
                  className={`text-[8px] px-1.5 py-0.5 rounded font-bold transition-all ${selectedDays.includes(d.date) ? 'bg-indigo-500 text-white' : 'bg-slate-800 text-slate-500'}`}
                >
                  {d.label.substring(0, 3)}
                </button>
              ))}
            </div>
            <div className="flex gap-1 pt-1 border-t border-white/5">
              <button 
                onClick={() => handleDistribute(props.onDistribute)}
                className="flex-1 bg-emerald-600 hover:bg-emerald-500 text-white text-[9px] font-black py-1 rounded"
              >
                DAĞIT
              </button>
              <button 
                onClick={() => setShowDistribute(false)}
                className="bg-slate-700 hover:bg-slate-600 text-white px-2 text-[9px] font-black rounded"
              >
                İPTAL
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default function StudentProgram() {
  const { curriculum: CURRICULUM } = useCurriculum();
  const { selectedStudent, setSelectedStudent } = useStudent();
  const { user, userData } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);
  const [isTourOpen, setIsTourOpen] = useState(false);
  const [currentTourTargetId, setCurrentTourTargetId] = useState<string | null>(null);

  useEffect(() => {
    if (tourService.shouldAutoStartTour('student_program', userData, location.state?.startTour)) {
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
    setCurrentTourTargetId(null);
    tourService.markTourCompleted('student_program', user?.uid);
    if (selectedStudent?.isDemo) {
      setSelectedStudent(null);
      navigate('/panel/koc');
    }
  };

  const tourSteps: TourStep[] = [
    {
      targetId: 'tour-program-header',
      title: 'Haftalık Çalışma Programı',
      description: 'Öğrencinizin haftalık ders ve görev programını sürükle-bırak yöntemiyle hazırlayabileceğiniz ana yönetim alanıdır. Tarih butonları ve ok tuşları ile geçmiş ve gelecek haftalar arasında kolayca geçiş yapabilirsiniz.',
      position: 'bottom',
      badge: 'Program Yapıcı'
    },
    {
      targetId: 'tour-program-pdf',
      title: 'PDF Formatında İndirme',
      description: 'Hazırladığınız haftalık çalışma programını şık ve basılabilir bir PDF dosyası olarak tek tıkla indirebilir, doğrudan öğrencinize veya velisine iletebilirsiniz.',
      position: 'bottom',
      badge: 'Çıktı & Paylaşım'
    },
    {
      targetId: 'tour-program-template',
      title: 'Hazır Akademik Şablonlar',
      description: 'Müfredata uygun hazırlanmış hazır ders şablonlarından istediğiniz haftayı seçerek tek hamlede tüm haftalık görevleri öğrenciye atayabilirsiniz.',
      position: 'bottom',
      badge: 'Hızlı Planlama'
    },
    {
      targetId: 'tour-program-save',
      title: 'Programı Kaydetme & Canlı Senkronizasyon',
      description: 'Yaptığınız tüm düzenlemeleri veritabanına kaydeder. Kaydedilen program anında öğrenci ve velinin mobil/web panelinde canlı olarak görünür.',
      position: 'bottom',
      badge: 'Veritabanı Kayıt'
    },
    {
      targetId: 'tour-program-summary',
      title: 'Haftalık Soru & Başarı Metrikleri',
      description: 'O haftaya tanımlanan toplam soru sayısını, toplam görev adedini ve öğrencinin son 7 günlük ödev tamamlama başarı yüzdesini anlık olarak takip edebilirsiniz.',
      position: 'right',
      badge: 'Canlı İlerleme'
    },
    {
      targetId: 'tour-program-routines',
      title: 'Günlük Rutin Görevler (Paragraf & Problem)',
      description: 'Öğrencinin her gün düzenli çözmesi gereken Paragraf ve Problem hedeflerini belirleyip "Bu Haftaya Ekle" butonuyla haftanın 7 gününe otomatik dağıtabilirsiniz.',
      position: 'right',
      badge: 'Düzenli Rutinler'
    },
    {
      targetId: 'tour-program-days',
      title: 'Günlük Program Kartları (Pazartesi - Pazar)',
      description: 'Pazartesi\'den Pazar\'a 7 günün çalışma takvimidir. Sol kütüphaneden sürüklenecek görevler buraya düşer. Her günün altında günün soru toplamını görebilir ve koç değerlendirme notu yazabilirsiniz.',
      position: 'top',
      badge: 'Haftalık Takvim'
    }
  ];

  if (selectedStudent?.isDemo || location.state?.startTour) {
    tourSteps.push(
      {
        targetId: 'tour-sample-task-card',
        title: 'Örnek Ödev / Görev Kartı',
        description: 'Programlanan her ders ve ödev takvimde şık bir kart olarak gösterilir. Üzerinde ders adı, konu başlığı, hedef soru sayısı ve tanımlanan koç notu yer alır.',
        position: 'bottom',
        badge: 'Örnek Görev'
      },
      {
        targetId: 'tour-task-actions',
        title: 'Görev Kartı Üzerindeki Hızlı İşlemler',
        description: 'Programdaki her görevin sağ üst köşesinde görev eylemleri yer alır. Buradan görevi günlere dağıtabilir, kopyalayabilir, silebilir veya göreve özel koç notu yazabilirsiniz.',
        position: 'bottom',
        badge: 'Görev Yönetimi'
      },
      {
        targetId: 'tour-task-distribute',
        title: 'Görevi Günlere Dağıtma / Bölme',
        description: 'Soru hedefini tek bir güne yığmak yerine, bu ikona tıklayarak hedef soru sayısını haftanın seçtiğiniz diğer günlerine eşit veya özel miktarlarda otomatik bölebilir ve dağıtabilirsiniz.',
        position: 'bottom',
        badge: 'Akıllı Bölüştürme'
      },
      {
        targetId: 'tour-task-copy',
        title: 'Görevi Kopyalama & Çoğaltma',
        description: 'Aynı görevi ve hedefi tekrar tekrar oluşturmak yerine kopyalama butonuna basarak anında yeni bir kopyasını oluşturabilir ve istediğiniz güne taşıyabilirsiniz.',
        position: 'bottom',
        badge: 'Hızlı Çoğaltma'
      },
      {
        targetId: 'tour-task-delete',
        title: 'Görevi Programdan Silme',
        description: 'Öğrencinin programından çıkarmak istediğiniz görevleri silme ikonuna tıklayarak haftalık takvimden kolayca kaldırabilirsiniz.',
        position: 'bottom',
        badge: 'Görev Silme'
      },
      {
        targetId: 'tour-task-note',
        title: 'Göreve Özgü Koç Notu & Açıklama',
        description: 'Her bir ödeve özel detaylı talimat, püf noktası veya uyarı ekleyebilirsiniz. Öğrenci kendi panelinde bu ödevi incelerken yazdığınız koç notunu doğrudan görür ve yanıt yazabilir.',
        position: 'bottom',
        badge: 'Özel İletişim'
      }
    );
  }

  tourSteps.push(
    {
      targetId: 'tour-program-sidebar',
      title: 'Görev Seçimi Kütüphanesi',
      description: 'Programın sol tarafında yer alan gelişmiş ders, kaynak ve müfredat kütüphanesidir. Tüm dersler, soru bankaları, YouTube kanalları ve denemeler burada hiyerarşik olarak gruplanır.',
      position: 'left',
      badge: 'Müfredat Kütüphanesi'
    },
    {
      targetId: 'tour-program-task-types',
      title: 'Görev Türleri (Soru, Konu, YouTube)',
      description: 'Öğrenciye tanımlayacağınız çalışma türünü seçebilirsiniz: \'Soru Çözümü\' soru bankası testleri için, \'Konu Çalışması\' fasikül ve konu özetleri için, \'YouTube Video\' ise video ders takibi içindir.',
      position: 'left',
      badge: 'Çalışma Tipi'
    },
    {
      targetId: 'tour-program-branches',
      title: 'Sınav & Ders Branşları',
      description: 'TYT, AYT, YDT, Ara Sınıf (9, 10, 11. Sınıf) veya Branş/Genel Denemeler kategorilerinden hedef sınava uygun müfredat seviyesini filtreleyebilirsiniz.',
      position: 'left',
      badge: 'Branş Kategorisi'
    },
    {
      targetId: 'tour-program-subjects',
      title: 'Dersler ve Kaynak Kitaplar',
      description: 'Seçilen branşa ait dersler (Biyoloji, Matematik, Fizik vb.) ve bu ders altında öğrenciye tanımlı olan orijinal soru bankaları veya kaynak fasikülleri listelenir.',
      position: 'left',
      badge: 'Kaynak Bağlantısı'
    },
    {
      targetId: 'tour-program-draggable-topic',
      title: 'Sürüklenebilir Konu Başlıkları',
      description: 'Müfredattaki konuları ve alt başlıkları farenizle tutup sürükleyerek haftanın istediğiniz gününe sürükleyip bırakabilir, anında ödev olarak atayabilirsiniz.',
      position: 'left',
      badge: 'Sürükle & Bırak'
    },
    {
      targetId: 'tour-program-global-target',
      title: 'Konu / Kitap Hedef Soru Sayısı',
      description: 'Her bir konu başlığının yanındaki kutucuğa varsayılan soru veya sayfa hedefini yazabilirsiniz. Konuyu takvime her sürüklediğinizde bu hedef otomatik olarak tanımlanır.',
      position: 'left',
      badge: 'Soru Sayısı Ayarı'
    },
    {
      targetId: 'tour-program-uncompleted-tasks',
      title: 'Eksik / Aksatılan Görevleri Aktarma',
      description: 'Öğrencinin geçmiş haftada tamamlayamadığı veya eksik bıraktığı ödevleri tek tıkla tespit eder ve otomatik olarak bu haftanın ilk gününe kopyalayarak telafi edilmesini sağlar.',
      position: 'left',
      badge: 'Otomatik Devir'
    },
    {
      targetId: 'tour-program-repetition-planner',
      title: 'Akıllı Aralıklı Tekrar (Spaced Repetition)',
      description: 'Öğrenilen bir konunun hafızada kalıcı olması için 1. Ay (4. Hafta) ve 3. Ay (12. Hafta) tekrarlarını otomatik hesaplar ve zamanı geldiğinde öğrencinin programına tekrar görevi olarak ekler.',
      position: 'left',
      badge: 'Unutmayı Önleme'
    },
    {
      targetId: 'tour-program-virtual-books',
      title: 'Sanal / Planlanan Kitap Desteği',
      description: 'Öğrencinin 2. veya 3. soru bankası henüz sistemde kayıtlı olmasa bile "Planlanan Kitap" etiketiyle ileriki haftalara otomatik tekrar hedefleri koyabilmenizi sağlar.',
      position: 'left',
      badge: 'Kaynak Akışı'
    },
    {
      targetId: 'tour-program-distribution-table',
      title: 'Haftalık Ders Dağılım Matris Tablosu',
      description: 'Haftadaki tüm ödev ve soru hedeflerinin ders bazında gün gün detaylı dökümünü sunar. Öğrencinin sayısal/sözel ders yükünü dengeli dağıttığınızdan emin olabilirsiniz.',
      position: 'top',
      badge: 'Detaylı Analiz'
    }
  );

  const [startDate, setStartDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [tasks, setTasks] = useState<any[]>([]);
  const [dailyCoachNotes, setDailyCoachNotes] = useState<Record<string, string>>({});
  const [dailyStudentNotes, setDailyStudentNotes] = useState<Record<string, string>>({});
  const [savingRoutines, setSavingRoutines] = useState(false);
  const [routines, setRoutines] = useState<any>({ paragraf: 40, problem: 20 });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [books, setBooks] = useState<any[]>([]);
  const [multipliers, setMultipliers] = useState<Record<string, number>>({});
  
  const [plans, setPlans] = useState<any[]>([]);
  const [repetitionEnabled, setRepetitionEnabled] = useState<boolean>(() => {
    return safeStorage.getItem('repetitionEnabled') !== 'false';
  });
  const [showRepetitionPlanner, setShowRepetitionPlanner] = useState<boolean>(() => {
    return safeStorage.getItem('showRepetitionPlanner') !== 'false';
  });
  const [startingRepeatLevel, setStartingRepeatLevel] = useState<'level1' | 'level2' | 'level3'>('level1');
  const [allowVirtualBooks, setAllowVirtualBooks] = useState<boolean>(true);
  const [isTemplateModalOpen, setIsTemplateModalOpen] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<any>(null);
  const [selectedWeek, setSelectedWeek] = useState(1);
  const [shiftingTasks, setShiftingTasks] = useState(false);

  const isRoutineTask = (t: any) => {
    return (
      t.isRoutine ||
      t.type === 'Rutin' ||
      t.subject === 'Paragraf' ||
      t.subject === 'Problem' ||
      t.topic === 'Karma Paragraf Çözümü' ||
      t.topic === 'Karma Problem Çözümü' ||
      t.topic?.toLowerCase().includes('rutin')
    );
  };

  const carryForwardUncompletedTasks = async () => {
    if (!selectedStudent?.uid) return;

    const firstDisplayedDateStr = startDate;
    const firstDisplayedDate = new Date(firstDisplayedDateStr);

    setShiftingTasks(true);
    try {
      const priorDates: string[] = [];
      for (let i = 7; i >= 1; i--) {
        const d = new Date(firstDisplayedDate);
        d.setDate(firstDisplayedDate.getDate() - i);
        priorDates.push(d.toISOString().split('T')[0]);
      }

      const priorPrograms = await studentDataService.getDailyPrograms(selectedStudent.uid, priorDates);

      let uncompletedCount = 0;
      const tasksToMoveByGroup: Record<string, any> = {};

      for (const dp of priorPrograms) {
        if (!dp.tasks || !Array.isArray(dp.tasks) || dp.tasks.length === 0) continue;

        for (const t of dp.tasks) {
          // Completed tasks are skipped
          if (t.isDone) continue;

          // Rutin görevler kopyalanmaz
          if (isRoutineTask(t)) continue;

          const target = Number(t.targetCount);
          const completed = Number(t.completedCount) || 0;
          let remaining = 0;

          if (!isNaN(target) && target > 0) {
            remaining = target > completed ? target - completed : 0;
            if (remaining <= 0) continue;
          } else {
            // Soru/video/sayfa sayısı girilmemişse, her verilmiş görev = 1 adet sayılır
            remaining = 1;
          }

          uncompletedCount++;

          const branchStr = t.branch || '';
          const subjectStr = t.subject || '';
          const topicStr = t.topic || '';
          const typeStr = t.type || 'Soru Çözümü';
          const bookIdStr = t.bookId || '';

          const key = `${branchStr}___${subjectStr}___${topicStr}___${typeStr}___${bookIdStr}`;

          if (!tasksToMoveByGroup[key]) {
            tasksToMoveByGroup[key] = {
              id: Math.random().toString(36).substr(2, 9),
              date: firstDisplayedDateStr,
              branch: branchStr,
              subject: subjectStr,
              topic: topicStr,
              type: typeStr,
              bookId: bookIdStr,
              targetCount: remaining,
              completedCount: 0,
              isDone: false,
              coachNote: t.coachNote || t.note || '',
              studentNote: ''
            };
          } else {
            tasksToMoveByGroup[key].targetCount += remaining;
          }
        }
      }

      const movedTaskKeys = Object.keys(tasksToMoveByGroup);
      if (movedTaskKeys.length === 0) {
        alert('Görünen ilk günden önceki 7 gün boyunca kopyalanacak yapılmamış eksik görev bulunamadı.');
        setShiftingTasks(false);
        return;
      }

      // Sadece kopyalama yapılır, geçmiş günlerin verileri silinmez/değiştirilmez.

      setTasks(prev => {
        const updated = [...prev];

        Object.values(tasksToMoveByGroup).forEach(movedTask => {
          const existingIdx = updated.findIndex(t =>
            t.date === firstDisplayedDateStr &&
            (t.branch || '') === movedTask.branch &&
            (t.subject || '') === movedTask.subject &&
            (t.topic || '') === movedTask.topic &&
            (t.type || '') === movedTask.type &&
            (t.bookId || '') === movedTask.bookId
          );

          if (existingIdx > -1) {
            updated[existingIdx] = {
              ...updated[existingIdx],
              targetCount: (Number(updated[existingIdx].targetCount) || 0) + movedTask.targetCount,
              isDone: false
            };
          } else {
            updated.push(movedTask);
          }
        });

        return updated;
      });

      const dateFormatted = new Date(firstDisplayedDateStr).toLocaleDateString('tr-TR', { day: 'numeric', month: 'long' });
      alert(`Geçmiş 7 gün içindeki yapılmayan ${uncompletedCount} eksik görev kopyalanarak ${dateFormatted} gününe aktarıldı!\n\nDeğişikliklerin kalıcı olması için "Programı Kaydet" butonuna tıklamayı unutmayın.`);
    } catch (err) {
      console.error("Görev kopyalama hatası:", err);
      alert('Görevler kopyalanırken bir hata oluştu.');
    } finally {
      setShiftingTasks(false);
    }
  };

  const resolveVirtualBook = (bookId: string, subject: string) => {
    if (!bookId) return null;
    if (bookId.startsWith('virtual-')) {
      const isSecond = bookId.endsWith('-2');
      const index = isSecond ? 1 : 2;
      const subjectBooks = books
        .filter(b => b.subject === subject && (b.resourceType === 'soru' || !b.resourceType))
        .sort((a,b) => {
            const orderA = a.order !== undefined ? a.order : Number.MAX_SAFE_INTEGER;
            const orderB = b.order !== undefined ? b.order : Number.MAX_SAFE_INTEGER;
            return orderA - orderB;
        });
      return subjectBooks[index] || null;
    }
    return books.find(b => b.id === bookId) || null;
  };

  useEffect(() => {
    studentDataService.getGlobalCurriculumPlans().then(data => setPlans(data || []));
  }, []);

  function sortTasks(tasks: any[]) {
    return [...tasks].sort((a, b) => {
      const getOrder = (t: any) => {
        if (t.subject === 'Paragraf' || t.topic === 'Paragraf') return 1;
        if (t.subject === 'Problem' || t.topic === 'Problem' || t.subject === 'Problemler' || t.topic === 'Problemler') return 2;
        if (t.type === 'Konu Çalışması') return 3;
        if (t.type === 'YouTube Video') return 4;
        if (t.type === 'Soru Çözümü') return 5;
        return 6;
      };
      const orderA = getOrder(a);
      const orderB = getOrder(b);
      if (orderA !== orderB) return orderA - orderB;
      return a.subject.localeCompare(b.subject);
    });
  }

  const downloadPDF = async () => {
    setIsGeneratingPdf(true);
    try {
      const dateStr = days && days.length > 0 ? days[0].date : new Date().toISOString();
      const dateText = new Date(dateStr).toLocaleDateString('tr-TR', { day: 'numeric', month: 'long', year: 'numeric' });
      
      const printWindow = window.open('', '_blank');
      if (!printWindow) {
         alert('Pop-up engelleyiciyi kapatıp tekrar deneyin.');
         setIsGeneratingPdf(false);
         return;
      }

      // Prepare data
      let maxTasks = 0;
      const tasksByDay = days.map((day: any) => {
         const dayTasks = sortTasks((tasks || []).filter((t: any) => t.date === day.date));
         if (dayTasks.length > maxTasks) maxTasks = dayTasks.length;
         return dayTasks;
      });

      const htmlContent = `
        <!DOCTYPE html>
        <html lang="tr">
        <head>
            <meta charset="UTF-8">
            <title>Haftalık Çalışma Programı - ${selectedStudent?.displayName || 'Öğrenci'}</title>
            <script src="https://cdn.tailwindcss.com"></script>
            <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;700;900&display=swap" rel="stylesheet">
            <style>
                body { font-family: 'Inter', sans-serif; background: #f8fafc; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
                @page { size: landscape; margin: 5mm; }
                @media print {
                   body { background: white; }
                   .print-shadow { box-shadow: none !important; border: 1px solid #e2e8f0; }
                }
            </style>
        </head>
        <body class="p-4 text-slate-800 text-[10px]">
            <!-- Header Section -->
            <div class="max-w-[1400px] mx-auto bg-white p-4 rounded-xl print-shadow shadow-sm border border-slate-100 mb-4 flex justify-between items-center">
                <div class="flex items-center gap-4">
                    <img src="${window.location.origin}/images/ON-Logo.png" alt="FocusON Logo" class="h-10 object-contain" />
                    <div>
                        <h1 class="text-xl font-black tracking-widest text-slate-900 uppercase leading-none">Haftalık Çalışma Programı</h1>
                        <p class="text-emerald-600 font-bold uppercase tracking-widest mt-1 text-[9px] bg-emerald-50 inline-block px-2 py-0.5 rounded-full border border-emerald-100 flex-shrink-0">
                            Odaklan. Başar.
                        </p>
                    </div>
                </div>
                <div class="text-right flex flex-col items-end gap-2">
                    <div class="bg-indigo-50 border border-indigo-100 px-3 py-1.5 rounded-xl flex items-center gap-2">
                        <div class="w-8 h-8 bg-indigo-100 text-indigo-600 rounded-lg flex items-center justify-center font-black text-sm">
                           ${selectedStudent?.displayName?.charAt(0) || 'Ö'}
                        </div>
                        <div class="text-left leading-tight">
                            <p class="text-[8px] font-black text-indigo-400 uppercase tracking-widest">ÖĞRENCİ</p>
                            <p class="text-xs font-bold text-indigo-950">${selectedStudent?.displayName || 'İsimsiz Öğrenci'}</p>
                            <p class="text-[9px] font-medium text-indigo-600/80">${selectedStudent?.grade || '-'} / ${selectedStudent?.branch || '-'}</p>
                        </div>
                    </div>
                    <div class="flex gap-3">
                        <div class="text-right">
                           <p class="text-[8px] font-black text-slate-400 uppercase tracking-widest">HEDEF</p>
                           <p class="text-[11px] font-bold text-slate-800">${selectedStudent?.targetUniversity || ''} / ${selectedStudent?.targetDepartment || '-'}</p>
                        </div>
                        <div class="w-px h-6 bg-slate-200"></div>
                        <div class="text-right">
                           <p class="text-[8px] font-black text-slate-400 uppercase tracking-widest">BAŞLANGIÇ TARİHİ</p>
                           <p class="text-[11px] font-bold text-slate-800">${dateText}</p>
                        </div>
                    </div>
                </div>
            </div>

            <!-- Program Table -->
            <div class="max-w-[1400px] mx-auto bg-white rounded-xl print-shadow shadow-sm border border-slate-100 overflow-hidden">
                <table class="w-full text-left border-collapse table-fixed">
                    <thead>
                        <tr class="bg-slate-900 text-white">
                            ${days.map((day: any) => `
                                <th class="p-2 border-r border-slate-700 last:border-0 align-top text-center">
                                    <div class="text-[9px] font-black tracking-widest text-emerald-400 uppercase">${day.label}</div>
                                    <div class="text-[11px] font-bold mt-0.5">${day.shortLabel}</div>
                                </th>
                            `).join('')}
                        </tr>
                    </thead>
                    <tbody>
                        ${Array.from({ length: maxTasks }).map((_, i) => `
                            <tr>
                                ${days.map((day: any, dIndex) => {
                                    const task = tasksByDay[dIndex][i];
                                    if (task) {
                                        const resolvedB = resolveVirtualBook(task.bookId, task.subject);
                                        const bookName = task.bookId 
                                            ? (resolvedB 
                                                ? resolvedB.bookName 
                                                : (task.bookId.startsWith('virtual-') 
                                                    ? (task.bookId.endsWith('-2') ? '2. Kitap (Planlanan)' : '3. Kitap (Planlanan)') 
                                                    : 'Genel Kaynak')) 
                                            : 'Genel Görev';
                                        
                                        const typeColor = task.type === 'YouTube Video' ? 'red' : task.type === 'Konu Çalışması' ? 'orange' : 'indigo';
                                        const tColorCls = {
                                            red: { text: 'text-red-500', bg: 'bg-red-50', border: 'border-red-200', tagBg: 'bg-red-100', tagText: 'text-red-600', countBg: 'bg-red-200', countText: 'text-red-800' },
                                            orange: { text: 'text-orange-500', bg: 'bg-orange-50', border: 'border-orange-200', tagBg: 'bg-orange-100', tagText: 'text-orange-600', countBg: 'bg-orange-200', countText: 'text-orange-800' },
                                            indigo: { text: 'text-emerald-500', bg: 'bg-slate-50', border: 'border-slate-200', tagBg: 'bg-indigo-50/80', tagText: 'text-indigo-600', countBg: 'bg-slate-200', countText: 'text-slate-700' }
                                        }[typeColor] || { text: 'text-emerald-500', bg: 'bg-slate-50', border: 'border-slate-200', tagBg: 'bg-indigo-50/80', tagText: 'text-indigo-600', countBg: 'bg-slate-200', countText: 'text-slate-700' };

                                        return `
                                        <td class="p-1 border-r border-b border-slate-200 last:border-r-0 bg-white align-top">
                                            <div class="${tColorCls.bg} border ${tColorCls.border} p-1.5 rounded-lg flex flex-col h-full min-h-[40px]">
                                                <p class="text-[10px] font-black text-slate-800 uppercase leading-none flex items-start gap-1">
                                                   <span class="${tColorCls.text} text-[8px] mt-[1px]">▶</span>
                                                   <span class="line-clamp-2">${formatSubjectName(task.subject, task.branch)}</span>
                                                </p>
                                                ${task.topic ? `<p class="text-[9px] font-bold ${tColorCls.tagText} leading-tight mt-1 ${tColorCls.tagBg} inline-block px-1 py-0.5 rounded">${task.topic}</p>` : ''}
                                                <div class="mt-auto pt-1 flex items-end justify-between gap-1">
                                                    <p class="text-[8px] font-medium italic text-slate-500 truncate mt-0.5 flex-1 w-0">${bookName}</p>
                                                    ${task.targetCount && task.targetCount > 0 ? `
                                                        <p class="text-[8px] font-black ${tColorCls.countText} ${tColorCls.countBg} px-1 py-0.5 rounded shrink-0">${task.targetCount} ${task.type === 'YouTube Video' ? 'VİDEO' : task.type === 'Konu Çalışması' ? 'SAYFA' : 'SORU'}</p>
                                                    ` : ''}
                                                </div>
                                            </div>
                                        </td>
                                        `;
                                    } else {
                                        return `<td class="p-1 border-r border-b border-slate-200 last:border-r-0 bg-slate-50/50"></td>`;
                                    }
                                }).join('')}
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
            </div>

            <!-- Footer -->
            <div class="max-w-[1400px] mx-auto mt-4 flex justify-between items-end px-2">
                <div>
                     <p class="text-[8px] font-black text-slate-400 uppercase tracking-widest">EĞİTİM KOÇU</p>
                     <p class="text-[11px] font-bold text-slate-800 mt-0.5">${(selectedStudent as any)?.coachName || (userData?.firstName ? userData.firstName + ' ' + userData.lastName : userData?.displayName) || 'Atanan Eğitim Koçu'}</p>
                </div>
                <div class="text-center pb-1">
                     <p class="text-[10px] font-black text-emerald-600 tracking-widest uppercase">"BAŞARI TESADÜF DEĞİLDİR"</p>
                </div>
                <div class="text-right">
                     <p class="text-[8px] font-black text-slate-400 uppercase tracking-widest">WEB SİTESİ</p>
                     <p class="text-[11px] font-bold text-slate-800 mt-0.5">omernasuhakademi.com</p>
                </div>
            </div>
            
            <script>
                // Auto-print when Tailwind styles are likely loaded
                setTimeout(() => {
                    window.print();
                }, 1000);
            </script>
        </body>
        </html>
      `;

      printWindow.document.open();
      printWindow.document.write(htmlContent);
      printWindow.document.close();

    } catch (error) {
      console.error('PDF Error:', error);
    } finally {
      setIsGeneratingPdf(false);
    }
  };

  const activeBranch = ['9. Sınıf', '10. Sınıf', '11. Sınıf'].includes(selectedStudent?.grade || '')
    ? selectedStudent?.grade
    : (selectedStudent?.branch === 'SAYISAL' ? 'SAY' : 
       selectedStudent?.branch === 'EŞİT AĞIRLIK' ? 'EA' : 
       selectedStudent?.branch === 'SÖZEL' ? 'SÖZ' : 
       selectedStudent?.branch === 'DİL' ? 'DİL' : 'TYT') as any;

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  useEffect(() => {
    if (selectedStudent?.branch) {
      const branchMap: Record<string, string> = {
        'SAYISAL': 'SAY',
        'EŞİT AĞIRLIK': 'EA',
        'SÖZEL': 'SÖZ',
        'DİL': 'DİL'
      };
    }
  }, [selectedStudent]);

  useEffect(() => {
    if (selectedStudent) {
      fetchData();
    }
  }, [selectedStudent, startDate]);

  const fetchData = async () => {
    setLoading(true);
    
    const start = new Date(startDate);
    const dates = [];
    for (let i = 0; i < 7; i++) {
        const d = new Date(start);
        d.setDate(start.getDate() + i);
        dates.push(d.toISOString().split('T')[0]);
    }

    const [programsArray, trackerData, globalBooksData, routinesData, examsData] = await Promise.all([
      studentDataService.getDailyPrograms(selectedStudent!.uid, dates),
      studentDataService.getBookTracking(selectedStudent!.uid),
      studentDataService.getGlobalBooks(),
      studentDataService.getRoutines(selectedStudent!.uid),
      studentDataService.getExamResults(selectedStudent!.uid)
    ]);
    
    if (examsData) {
       setMultipliers(calculateSubjectMultipliers(examsData, selectedStudent!.branch));
    }

    if (routinesData) {
        setRoutines({
           paragraf: routinesData.paragraf || 40,
           problem: routinesData.problem || 20
        });
    }
    
    const mergedBooks = trackerData.map((tb: any) => {
        let extraInfo: any = {};
        if (tb.globalBookId) {
            const gb = globalBooksData.find((g: any) => g.id === tb.globalBookId);
            if (gb) {
                 extraInfo = { 
                   topicQuestionCounts: (gb as any).topicQuestionCounts || {},
                   videos: (gb as any).videos || [],
                   channelTitle: (gb as any).channelTitle || '',
                   totalVideos: (gb as any).totalVideos || 0,
                   totalDurationFormatted: (gb as any).totalDurationFormatted || '',
                   totalDurationMinutes: (gb as any).totalDurationMinutes || 0
                 };
            }
        }
        return {
          ...tb,
          ...extraInfo,
          isStudentBook: true
        };
    });

    // Also include global books (e.g. YouTube playlists or global resources not yet added into student's personal list)
    const existingIds = new Set(mergedBooks.map((b: any) => b.id || b.globalBookId));
    const unmergedGlobalBooks = globalBooksData
      .filter((gb: any) => !existingIds.has(gb.id))
      .map((gb: any) => ({
        id: gb.id,
        globalBookId: gb.id,
        bookName: gb.name,
        subject: gb.subject,
        resourceType: gb.resourceType || 'soru',
        order: gb.order,
        channelTitle: gb.channelTitle || '',
        totalVideos: gb.totalVideos || (gb.videos?.length || 0),
        totalDurationFormatted: gb.totalDurationFormatted || '',
        totalDurationMinutes: gb.totalDurationMinutes || 0,
        videos: gb.videos || [],
        topicQuestionCounts: gb.topicQuestionCounts || {},
        completionPercentage: 0,
        completedTopics: [],
        isStudentBook: false
      }));

    let finalBooks = [...mergedBooks, ...unmergedGlobalBooks];
    const bioBookExists = finalBooks.some((b: any) => b.subject === 'Biyoloji' && (b.id === 'demo-biyotik-1' || b.bookName?.includes('Biyotik')));
    if (isTourOpen && (!bioBookExists || selectedStudent?.isDemo || location.state?.startTour)) {
        const sampleBiyotikBook = {
            id: 'demo-biyotik-1',
            bookName: 'Biyotik TYT Biyoloji Soru Bankası',
            subject: 'Biyoloji',
            resourceType: 'soru',
            completionPercentage: 35,
            completedTopics: ['Canlıların Ortak Özellikleri'],
            topicQuestionCounts: {
                'Hücre Bölünmeleri & Mayoz': 50,
                'Kalıtımın Genel İlkeleri': 40
            },
            isStudentBook: true
        };
        finalBooks = [sampleBiyotikBook, ...finalBooks.filter((b: any) => b.id !== 'demo-biyotik-1')];
    }
    setBooks(finalBooks);

    let allTasks: any[] = [];
    const loadedCoachNotes: Record<string, string> = {};
    const loadedStudentNotes: Record<string, string> = {};
    const todayStr = new Date().toISOString().split('T')[0];
    
    dates.forEach(dateStr => {
        const dp = programsArray.find(p => p.date === dateStr);
        if (dp) {
            if (dp.coachNote) loadedCoachNotes[dateStr] = dp.coachNote;
            else if (dp.note) loadedCoachNotes[dateStr] = dp.note; // backward compatibility
            if (dp.studentNote) loadedStudentNotes[dateStr] = dp.studentNote;

            if (dp.tasks) {
                allTasks = [...allTasks, ...dp.tasks.map((t:any) => ({
                    ...t, 
                    date: dateStr,
                    coachNote: t.coachNote || t.note || '',
                    studentNote: t.studentNote || ''
                }))];
            }
        }
    });

    if (isTourOpen && (selectedStudent?.isDemo || location.state?.startTour)) {
        allTasks = [
            {
                id: 'demo-sample-task-1',
                date: dates[0],
                branch: 'TYT',
                subject: 'Biyoloji',
                topic: 'Hücre Bölünmeleri & Mayoz',
                type: 'Soru Çözümü',
                bookId: 'demo-biyotik-1',
                targetCount: 50,
                completedCount: 0,
                isDone: false,
                coachNote: 'Biyotik TYT Biyoloji soru bankasından ilgili testler çözülecek. Yanlışlar kontrol edilsin.',
                studentNote: ''
            },
            {
                id: 'demo-sample-task-2',
                date: dates[2] || dates[0],
                branch: 'TYT',
                subject: 'Matematik',
                topic: 'Fonksiyonlar & Grafikler',
                type: 'Soru Çözümü',
                targetCount: 60,
                completedCount: 0,
                isDone: false,
                coachNote: 'Fasiküldeki test 3 ve test 4 sorularını tamamlamalısın.',
                studentNote: ''
            },
            ...allTasks
        ];
    }

    setTasks(allTasks);
    setDailyCoachNotes(loadedCoachNotes);
    setDailyStudentNotes(loadedStudentNotes);
    setLoading(false);
  };

  const navigateDay = (days: number) => {
    const d = new Date(startDate);
    d.setDate(d.getDate() + days);
    setStartDate(d.toISOString().split('T')[0]);
  };

  const addTask = (date: string, template?: any) => {
    const tasksToAdd: any[] = [];
    
    // Determine primary task coach note based on start level
    let primaryCoachNote = '';
    if (repetitionEnabled && template?.type === 'Soru Çözümü' && template?.bookId) {
      if (startingRepeatLevel === 'level2') {
        primaryCoachNote = 'Aralıklı Tekrar: 1. Ay (4. Hafta)';
      } else if (startingRepeatLevel === 'level3') {
        primaryCoachNote = 'Aralıklı Tekrar: 3. Ay (12. Hafta)';
      }
    }

    tasksToAdd.push({
      id: Math.random().toString(36).substr(2, 9),
      date,
      subject: template?.subject || 'Matematik',
      bookId: template?.bookId || '',
      topic: template?.title || '',
      targetCount: template?.targetCount !== undefined ? template.targetCount : (template?.type === 'Konu Çalışması' || template?.type === 'YouTube Video' ? (template?.durationMinutes || 0) : 100),
      type: template?.type || 'Soru Çözümü',
      completedCount: 0,
      isDone: false,
      coachNote: primaryCoachNote,
      durationMinutes: template?.durationMinutes || 0,
      durationFormatted: template?.durationFormatted || '',
      videoId: template?.videoId || '',
      videoUrl: template?.videoUrl || '',
      channelTitle: template?.channelTitle || ''
    });

    // Spaced Repetition Logic (Aralıklı Tekrar)
    if (repetitionEnabled && template && template.bookId && template.type === 'Soru Çözümü') {
        const subjectBooks = books
          .filter(b => b.subject === template.subject && (b.resourceType === 'soru' || !b.resourceType))
          .sort((a,b) => {
              const orderA = a.order !== undefined ? a.order : Number.MAX_SAFE_INTEGER;
              const orderB = b.order !== undefined ? b.order : Number.MAX_SAFE_INTEGER;
              return orderA - orderB;
          });
          
        let currentBookIndex = subjectBooks.findIndex(b => b.id === template.bookId);
        
        // If the book index is -1 but we have some books, let's treat it as the first book
        if (currentBookIndex === -1 && subjectBooks.length > 0) {
            currentBookIndex = 0;
        }

        if (currentBookIndex !== -1 || allowVirtualBooks) {
            const actualIndex = currentBookIndex === -1 ? 0 : currentBookIndex;
            
            let book2 = subjectBooks[actualIndex + 1];
            let book3 = subjectBooks[actualIndex + 2];
            
            if (allowVirtualBooks) {
                if (!book2) {
                    book2 = {
                        id: `virtual-${template.subject}-2`,
                        bookName: `2. Kitap (Planlanan)`,
                        isVirtual: true
                    };
                }
                if (!book3) {
                    book3 = {
                        id: `virtual-${template.subject}-3`,
                        bookName: `3. Kitap (Planlanan)`,
                        isVirtual: true
                    };
                }
            }
            
            const baseTime = new Date(date).getTime();
            
            // If starting level is level1 (İlk Çalışma): schedule both repetitions
            if (startingRepeatLevel === 'level1') {
                if (book2) {
                    const date4W = new Date(baseTime + 28 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
                    tasksToAdd.push({
                       id: Math.random().toString(36).substr(2, 9),
                       date: date4W,
                       subject: template.subject,
                       bookId: book2.id,
                       topic: template.title,
                       targetCount: template.targetCount !== undefined ? template.targetCount : 100,
                       type: 'Soru Çözümü',
                       completedCount: 0,
                       isDone: false,
                       coachNote: 'Aralıklı Tekrar: 1. Ay (4. Hafta)'
                    });
                }
                
                if (book3) {
                    const date12W = new Date(baseTime + 84 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
                    tasksToAdd.push({
                       id: Math.random().toString(36).substr(2, 9),
                       date: date12W,
                       subject: template.subject,
                       bookId: book3.id,
                       topic: template.title,
                       targetCount: template.targetCount !== undefined ? template.targetCount : 100,
                       type: 'Soru Çözümü',
                       completedCount: 0,
                       isDone: false,
                       coachNote: 'Aralıklı Tekrar: 3. Ay (12. Hafta)'
                    });
                }
            }
            // If starting level is level2 (2. Tekrar / 4. Hafta): schedule only the 3rd repetition (8 weeks / 56 days later)
            else if (startingRepeatLevel === 'level2') {
                if (book3) {
                    const date8W = new Date(baseTime + 56 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
                    tasksToAdd.push({
                       id: Math.random().toString(36).substr(2, 9),
                       date: date8W,
                       subject: template.subject,
                       bookId: book3.id,
                       topic: template.title,
                       targetCount: template.targetCount !== undefined ? template.targetCount : 100,
                       type: 'Soru Çözümü',
                       completedCount: 0,
                       isDone: false,
                       coachNote: 'Aralıklı Tekrar: 3. Ay (12. Hafta)'
                    });
                }
            }
            // If starting level is level3 (3. Tekrar / 12. Hafta): schedule nothing else
        }
    }

    setTasks(prev => [...prev, ...tasksToAdd]);
  };

  const removeTask = (taskId: string) => {
    setTasks(prev => prev.filter(t => t.id !== taskId));
  };

  const duplicateTask = (taskToCopy: any) => {
    const newTask = {
      ...taskToCopy,
      id: Math.random().toString(36).substr(2, 9),
    };
    setTasks(prev => [...prev, newTask]);
  };

  const updateTask = async (taskId: string, field: string, value: any) => {
    if (field === 'isDone' && value === true) {
        const t = tasks.find(t => t.id === taskId);
        if (t) {
            const isDeneme = t.topic?.includes('Deneme') || t.subject?.includes('Genel') || t.subject?.includes('YDT') || t.branch === 'Denemeler' || t.type === 'Deneme';
            if (isDeneme) {
                try {
                    const exams = await studentDataService.getExamResults(selectedStudent!.uid);
                    const hasExam = exams.some((e: any) => e.date === t.date || (e.examType === 'YKS' && e.aytDate === t.date));
                    if (!hasExam) {
                        alert("Bu denemeyi tamamlandı olarak işaretlemek için öğrencinin 'Denemelerim' sayfasından deneme sonucunu girmesi gerekmektedir.");
                        return; // Prevent update
                    }
                } catch(e) {
                    console.error("Deneme kontrolü başarısız:", e);
                }
            }
        }
    }

    setTasks(prev => prev.map(t => {
        if (t.id !== taskId) return t;
        const updatedTask = { ...t, [field]: value };
        if (field === 'subject') {
          updatedTask.topic = '';
          updatedTask.bookId = '';
        }
        return updatedTask;
    }));
  };

  const importFromTemplate = () => {
    if (!selectedPlan) return;
    const content = selectedPlan.content?.[selectedWeek] || {};
    let newTasks = [...tasks];
    
    days.forEach((dayObj, index) => {
        const dayNumber = index + 1;
        const dayTasks = content[dayNumber] || [];
        dayTasks.forEach((templateTask: any) => {
            newTasks.push({
                id: Math.random().toString(36).substr(2, 9),
                date: dayObj.date,
                subject: templateTask.subject || 'Diğer',
                bookId: '',
                topic: templateTask.topic === 'DİĞER' ? 'Özel Konu' : (templateTask.topic || ''),
                targetCount: templateTask.questionCount || 0,
                type: templateTask.type || 'Konu Çalışması',
                completedCount: 0,
                isDone: false,
                note: templateTask.note || ''
            });
        });
    });

    setTasks(newTasks);
    setIsTemplateModalOpen(false);
    setSelectedPlan(null);
    setSelectedWeek(1);
    
    alert('Şablon başarıyla haftaya eklendi! Değişiklikleri kaydetmeyi unutmayın.');
  };

  const handleSave = async () => {
    setSaving(true);
    
    // Group tasks by date
    const tasksByDate = tasks.reduce((acc: any, t: any) => {
      acc[t.date] = acc[t.date] || [];
      acc[t.date].push(t);
      return acc;
    }, {});

    // Ensure all 7 currently displayed days are included, even if they have no tasks
    const start = new Date(startDate);
    for (let i = 0; i < 7; i++) {
        const d = new Date(start);
        d.setDate(start.getDate() + i);
        const dateStr = d.toISOString().split('T')[0];
        if (!tasksByDate[dateStr]) {
            tasksByDate[dateStr] = []; // explicit empty array to overwrite deleted tasks
        }
    }

    const promises = [];
    for (const [date, dailyTasks] of Object.entries(tasksByDate)) {
      promises.push(studentDataService.saveDailyProgram({
         studentId: selectedStudent!.uid,
         date,
         tasks: dailyTasks,
         coachNote: dailyCoachNotes[date] || '',
         studentNote: dailyStudentNotes[date] || ''
      }));
    }
    
    // Save routines
    promises.push(studentDataService.saveRoutines(selectedStudent!.uid, routines));

    // Otomatik Kitap Takibi İşaretleme
    const bookUpdates: Record<string, any> = {};
    
    tasks.forEach((t: any) => {
        if (t.isDone && t.bookId && t.topic) {
            const book = resolveVirtualBook(t.bookId, t.subject);
            if (book) {
                const currentTopics = bookUpdates[book.id]?.completedTopics || book.completedTopics || [];
                if (!currentTopics.includes(t.topic)) {
                    if (!bookUpdates[book.id]) {
                        bookUpdates[book.id] = { ...book, completedTopics: [...currentTopics] };
                    }
                    bookUpdates[book.id].completedTopics.push(t.topic);
                }
            }
        }
    });

    Object.values(bookUpdates).forEach((book: any) => {
        const allTopics = CURRICULUM[book.subject as keyof typeof CURRICULUM] || [];
        const percentage = allTopics.length > 0 ? Math.round((book.completedTopics.length / allTopics.length) * 100) : 0;
        book.completionPercentage = percentage;
        
        promises.push(studentDataService.updateBookProgress(book.id, {
            ...book,
            completedTopics: book.completedTopics,
            completionPercentage: percentage
        }));
    });

    await Promise.all(promises);
    
    if (Object.keys(bookUpdates).length > 0) {
        setBooks(prev => prev.map(b => bookUpdates[b.id] ? { ...b, completedTopics: bookUpdates[b.id].completedTopics, completionPercentage: bookUpdates[b.id].completionPercentage } : b));
    }
    
    // Add notification (once per day)
    try {
      if (selectedStudent) {
        const todayStr = new Date().toISOString().split('T')[0];
        const notifKey = `program_update_notif_${selectedStudent.uid}`;
        const lastNotifDate = safeStorage.getItem(notifKey);

        if (lastNotifDate !== todayStr) {
          await notificationService.addNotification(selectedStudent.uid, {
            title: 'Program Güncellemesi',
            message: 'Yeni haftalık çalışma programın koçun tarafından güncellendi. Hemen incele!',
            type: 'system',
            link: '/panel/ogrenci'
          });
          safeStorage.setItem(notifKey, todayStr);
        }
      }
    } catch (e) {
      console.error("Bildirim gönderilemedi", e);
    }

    setSaving(false);
    alert('Program ve Rutinler kaydedildi!');
  };

  const updateBookTopicCount = async (bookId: string, topic: string, count: number | null) => {
    const book = books.find((b: any) => b.id === bookId);
    if (!book) return;

    const newCounts = { ...((book as any).topicQuestionCounts || {}) };
    if (count === null) {
      delete newCounts[topic];
    } else {
      newCounts[topic] = count;
    }

    const updatedBook = { ...book, topicQuestionCounts: newCounts };
    setBooks((prev: any[]) => prev.map(b => b.id === bookId ? updatedBook : b));
    
    if (book.globalBookId) {
      await studentDataService.updateGlobalBookTopicCounts(book.globalBookId, newCounts);
    } else {
      await studentDataService.updateBookProgress(bookId, { topicQuestionCounts: newCounts });
    }
  };

  const addRoutinesToWeek = () => {
    const start = new Date(startDate);
    const dates = [];
    for (let i = 0; i < 7; i++) {
        const d = new Date(start);
        d.setDate(start.getDate() + i);
        dates.push(d.toISOString().split('T')[0]);
    }

    const newTasks: any[] = [];
    
    dates.forEach(dateStr => {
      // Check if paragraf already exists
      const hasParagraf = tasks.some(t => t.date === dateStr && t.subject === 'Paragraf');
      if (!hasParagraf && routines.paragraf > 0) {
        newTasks.push({
           id: Math.random().toString(36).substr(2, 9),
           date: dateStr,
           subject: 'Paragraf',
           bookId: '',
           topic: 'Karma Paragraf Çözümü',
           targetCount: routines.paragraf,
           type: 'Soru Çözümü',
           completedCount: 0,
           isDone: false
        });
      }

      // Check if problem already exists
      const hasProblem = tasks.some(t => t.date === dateStr && t.subject === 'Problem');
      if (!hasProblem && routines.problem > 0) {
        newTasks.push({
           id: Math.random().toString(36).substr(2, 9),
           date: dateStr,
           subject: 'Problem',
           bookId: '',
           topic: 'Karma Problem Çözümü',
           targetCount: routines.problem,
           type: 'Soru Çözümü',
           completedCount: 0,
           isDone: false
        });
      }
    });

    if (newTasks.length > 0) {
       setTasks(prev => [...prev, ...newTasks]);
    }
  };

  const distributeTaskAcrossDays = (taskId: string, totalCount: number, selectedDayDates: string[]) => {
    if (!selectedDayDates.length) return;
    
    const baseTask = tasks.find((t: any) => t.id === taskId);
    if (!baseTask) return;

    const countPerDay = Math.floor(totalCount / selectedDayDates.length);
    const remainder = totalCount % selectedDayDates.length;

    setTasks(prev => {
        let updatedTasks = prev.filter(t => t.id !== taskId);
        selectedDayDates.forEach((date, index) => {
            const dayCount = countPerDay + (index < remainder ? 1 : 0);
            const existingIndex = updatedTasks.findIndex((t: any) => 
               t.date === date && 
               t.type === baseTask.type &&
               t.branch === baseTask.branch &&
               t.subject === baseTask.subject && 
               t.topic === baseTask.topic &&
               t.bookId === baseTask.bookId
            );
            if (existingIndex > -1) {
                updatedTasks[existingIndex] = { ...updatedTasks[existingIndex], targetCount: (updatedTasks[existingIndex].targetCount || 0) + dayCount };
            } else {
                updatedTasks.push({
                    ...baseTask,
                    id: Math.random().toString(36).substr(2, 9),
                    date: date,
                    targetCount: dayCount,
                    isDone: false
                });
            }
        });
        return updatedTasks;
    });
  };

  if (loading) return <div className="text-center py-20 text-slate-500 font-bold italic animate-pulse">Program Yükleniyor...</div>;

  const days = [];
  const start = new Date(startDate);
  for (let i = 0; i < 7; i++) {
    const d = new Date(start);
    d.setDate(start.getDate() + i);
    days.push({
      date: d.toISOString().split('T')[0],
      label: d.toLocaleDateString('tr-TR', { weekday: 'long' }),
      shortLabel: d.toLocaleDateString('tr-TR', { day: 'numeric', month: 'short' }),
      isToday: d.toISOString().split('T')[0] === new Date().toISOString().split('T')[0]
    });
  }

  const currentBranch = BRANCH_CONFIG[activeBranch];
  const subjects = currentBranch.subjects;

  const currentSubjects = Array.from(new Set([...currentBranch.subjects, ...currentBranch.aytSubjects, ...DENEME_SUBJECTS]));

  const getTaskForDayAndSubject = (date: string, subject: string) => {
    return tasks.find((t: any) => t.date === date && t.subject === subject);
  };

  const calculateDailyCompletion = (dailyTasks: any[]): number => {
    return calculateDailyCompletionWithMultipliers(dailyTasks, multipliers);
  };

  const syncTask = (date: string, subject: string, field: string, value: any) => {
    const existing = getTaskForDayAndSubject(date, subject);
    
    let processedValue = value;
    if (field === 'targetCount') processedValue = parseInt(value) || 0;

    if (existing) {
      updateTask(existing.id, field, processedValue);
    } else {
      const newTask = {
        id: Math.random().toString(36).substr(2, 9),
        date,
        subject,
        bookId: field === 'bookId' ? processedValue : '',
        topic: field === 'topic' ? processedValue : '',
        targetCount: field === 'targetCount' ? processedValue : 0,
        type: 'Soru Çözümü',
        completedCount: 0,
        isDone: field === 'isDone' ? processedValue : false
      };
      setTasks(prev => [...prev, newTask]);
    }
  };

  const handleDragEnd = (event: any) => {
    const { active, over } = event;
    if (!over) return;
    
    // Determine the target date based on what we dropped over
    let targetDate = '';
    if (String(over.id).startsWith('day-')) {
        targetDate = String(over.id).replace('day-', '');
    } else {
        const overTask = tasks.find((t: any) => t.id === over.id);
        if (overTask) targetDate = overTask.date;
    }

    if (!targetDate) return;

    // Dragging a new template from sidebar
    if (active.data.current?.type === 'template') {
        addTask(targetDate, active.data.current.template);
        return;
    }

    // Moving and sorting existing tasks
    if (active.id !== over.id) {
      setTasks(prev => {
        const oldIndex = prev.findIndex((t: any) => t.id === active.id);
        if (oldIndex === -1) return prev;

        const updatedTasks = [...prev];
        // Change date if we moved to a different day
        updatedTasks[oldIndex] = { ...updatedTasks[oldIndex], date: targetDate };

        let newIndex = prev.findIndex((t: any) => t.id === over.id);
        if (newIndex === -1) {
             // Dropped directly onto a day column
             newIndex = updatedTasks.length - 1;
        }

        return arrayMove(updatedTasks, oldIndex, newIndex);
      });
    }
  };

  const totalWeeklyQuestions = tasks.reduce((sum: number, t: any) => sum + ((t.type !== 'Konu Çalışması' && t.type !== 'YouTube Video') ? (Number(t.targetCount) || 0) : 0), 0);

  const updateWeeklyTopicTarget = (topic: string, count: number) => {
    setTasks(prev => prev.map((t: any) => {
      if (t.topic === topic) {
        return { ...t, targetCount: count };
      }
      return t;
    }));
  };

  if (!selectedStudent) { return <NoStudentSelected />; }

  return (
    <DndContext 
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragEnd={handleDragEnd}
    >
      <div className="flex flex-col-reverse xl:flex-row gap-6 pb-20 print:hidden animate-in fade-in slide-in-from-bottom-4 duration-500">
        <OnboardingTour
          steps={tourSteps}
          isOpen={isTourOpen}
          onClose={handleEndTour}
          onComplete={handleEndTour}
          onStepChange={(idx, step) => setCurrentTourTargetId(step?.targetId || null)}
          onNextTour={() => {
            setIsTourOpen(false);
            tourService.markTourCompleted('student_program', user?.uid);
            navigate('/panel/koc/ogrenci/sonuclar', { state: { startTour: true, isDemo: true } });
          }}
          nextTourLabel="Sınav Sonuçları Turu"
          tourKey="student_program"
        />

        <div className="flex-1 space-y-8 min-w-0">
          {/* Header */}
          <div id="tour-program-header" className="flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <h1 className="text-2xl font-black italic text-white uppercase tracking-tighter">HAFTALIK PROGRAM</h1>
                <div className="h-px w-12 bg-white/10" />
                <span className="text-[10px] font-black text-emerald-400 uppercase tracking-widest">Odaktan Nirvanaya</span>
              </div>
              <div className="flex items-center gap-4">
                <button onClick={() => navigateDay(-7)} className="p-1 hover:bg-white/5 rounded text-slate-500" title="Önceki Hafta"><ChevronsLeft size={18} /></button>
                <button onClick={() => navigateDay(-1)} className="p-1 hover:bg-white/5 rounded text-slate-500" title="Önceki Gün"><ChevronLeft size={18} /></button>
                <div className="min-w-[180px] text-center">
                    <p className="text-emerald-400 font-bold text-[10px] uppercase tracking-widest leading-none mb-1">Odak Tarih</p>
                    <p className="text-white font-bold text-sm uppercase tracking-widest">
                       {new Date(days[0].date).toLocaleDateString('tr-TR', { day: 'numeric', month: 'long', year: 'numeric' })}
                    </p>
                </div>
                <button onClick={() => navigateDay(1)} className="p-1 hover:bg-white/5 rounded text-slate-500" title="Sonraki Gün"><ChevronRight size={18} /></button>
                <button onClick={() => navigateDay(7)} className="p-1 hover:bg-white/5 rounded text-slate-500" title="Sonraki Hafta"><ChevronsRight size={18} /></button>
              </div>
            </div>
            <div className="flex flex-wrap items-stretch md:items-center gap-3 w-full md:w-auto">
              <button 
                id="tour-program-pdf"
                onClick={downloadPDF}
                className="w-full sm:w-auto print:hidden bg-slate-800 hover:bg-slate-700 text-white font-black py-2.5 px-4 rounded-xl transition-all flex items-center justify-center gap-2 shadow-lg shadow-slate-900/20 uppercase tracking-widest text-[10px]"
              >
                <Printer size={14} /> PDF İNDİR
              </button>
              {plans && plans.filter(p => p.status !== 'Pasif').length > 0 && (
              <button 
                id="tour-program-template"
                onClick={() => setIsTemplateModalOpen(true)}
                className="w-full sm:w-auto print:hidden bg-indigo-600 hover:bg-indigo-500 text-white font-black py-2.5 px-4 rounded-xl transition-all flex items-center justify-center gap-2 shadow-lg shadow-indigo-600/20 uppercase tracking-widest text-[10px]"
              >
                <FolderOpen size={14} /> ŞABLONDAN SEÇ
              </button>
              )}
              <button 
                id="tour-program-save"
                onClick={handleSave}
                disabled={saving}
                className="w-full sm:w-auto print:hidden bg-emerald-600 hover:bg-emerald-500 text-white font-black py-2.5 px-5 rounded-xl transition-all flex items-center justify-center gap-2 shadow-lg shadow-emerald-600/20 uppercase tracking-widest text-[10px]"
              >
                <Save size={14} /> {saving ? 'GÜNCELLENİYOR...' : 'PROGRAMI KAYDET'}
              </button>
            </div>
          </div>

          {/* Program Grid */}
          <div id="tour-program-days" className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-6">
             {/* Summary Slot */}
             <div id="tour-program-summary" className="bg-indigo-900/40 border border-indigo-500/20 rounded-3xl p-5 flex flex-col gap-4 min-h-[400px]">
                <div className="border-b border-indigo-500/20 pb-3">
                    <span className="text-[10px] font-black text-indigo-400 uppercase tracking-widest">HAFTANIN</span>
                    <span className="text-xs font-bold text-slate-200 block mt-0.5">ÖZETİ</span>
                </div>
                
                <div className="space-y-4 flex-1">
                    <div className="bg-white/5 border border-white/10 rounded-xl p-4">
                        <p className="text-xs font-black text-indigo-300 uppercase tracking-widest mb-1">Görünür Toplam Gör.</p>
                        <p className="text-4xl font-black text-white">{totalWeeklyQuestions} <span className="text-base text-indigo-400">Soru</span></p>
                        <div className="flex justify-between items-end mt-1">
                          <p className="text-xs font-bold text-slate-400">{tasks?.length || 0} Görev</p>
                          <div className="flex items-center gap-1.5" title="Bugüne Kadarki Ortalama Tamamlama Oranı">
                             <span className="text-xs font-black text-emerald-400 uppercase tracking-widest">Başarı</span>
                             <span className="text-lg font-black text-white px-2 py-0.5 bg-emerald-500/20 rounded-md border border-emerald-500/30">
                               %{(() => {
                                 const todayStr = new Date().toISOString().split('T')[0];
                                 const validDays = days.filter(d => {
                                   if (d.date > todayStr) return false;
                                   const dayTasks = tasks?.filter((t: any) => t.date === d.date) || [];
                                   return dayTasks.length > 0;
                                 });
                                 const divisor = validDays.length > 0 ? validDays.length : 1;
                                 return (validDays.reduce((acc, day) => acc + calculateDailyCompletion(tasks?.filter((t: any) => t.date === day.date) || []), 0) / divisor).toFixed(0);
                               })()}
                             </span>
                          </div>
                        </div>
                    </div>

                    <div id="tour-program-routines" className="bg-slate-800/50 rounded-xl p-4 border border-white/5 space-y-4">
                       <div className="flex items-center gap-2 mb-2 border-b border-white/5 pb-2">
                           <Target size={16} className="text-emerald-400" />
                           <h3 className="text-xs font-black text-emerald-400 uppercase tracking-widest">Rutin Görevler</h3>
                       </div>
                       
                       <div className="space-y-4">
                           <div className="flex items-center justify-between gap-2">
                               <label className="text-[10px] text-slate-400 font-bold uppercase mb-1 block">Paragraf Hedefi</label>
                               <div className="flex items-center gap-2">
                                   <input 
                                       type="number"
                                       className="w-16 bg-black/20 border border-white/10 rounded p-1.5 text-sm font-black text-white text-center outline-none focus:border-emerald-500"
                                       value={routines.paragraf || ''}
                                       onChange={(e) => setRoutines({...routines, paragraf: Number(e.target.value)})}
                                       placeholder="Soru"
                                   />
                               </div>
                           </div>
                           <div className="flex items-center justify-between gap-2">
                               <label className="text-[10px] text-slate-400 font-bold uppercase mb-1 block">Problem Hedefi</label>
                               <div className="flex items-center gap-2">
                                   <input 
                                       type="number"
                                       className="w-16 bg-black/20 border border-white/10 rounded p-1.5 text-sm font-black text-white text-center outline-none focus:border-emerald-500"
                                       value={routines.problem || ''}
                                       onChange={(e) => setRoutines({...routines, problem: Number(e.target.value)})}
                                       placeholder="Soru"
                                   />
                               </div>
                           </div>
                           
                           <button 
                               onClick={addRoutinesToWeek}
                               className="w-full py-2 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 text-[10px] font-black uppercase tracking-widest rounded-lg border border-emerald-500/20 transition-all flex items-center justify-center gap-2"
                           >
                               <Plus size={14} /> Bu Haftaya Ekle
                           </button>
                       </div>
                    </div>

                    <div className="bg-white/5 border border-white/10 rounded-xl p-4">
                        <p className="text-xs font-black text-indigo-300 uppercase tracking-widest mb-3 border-b border-white/5 pb-2">Günlük Dağılım</p>
                        <div className="space-y-2.5">
                            {days.map(day => {
                                const dayTasks = tasks?.filter((t: any) => t.date === day.date) || [];
                                const qCount = dayTasks.reduce((sum: number, t: any) => sum + ((t.type !== 'Konu Çalışması' && t.type !== 'YouTube Video') ? (Number(t.targetCount) || 0) : 0), 0);
                                const tCount = dayTasks.length;
                                return (
                                        <div key={day.date} className="flex items-center justify-between gap-2 text-xs">
                                            <span className="font-bold text-slate-400 w-20">{day.label}</span>
                                            <div className="flex items-center gap-4">
                                                <div className="flex items-center gap-1.5">
                                                    <span className="font-black text-white">{tCount}</span>
                                                    <span className="text-[9px] text-slate-500 uppercase">Gör.</span>
                                                </div>
                                                <div className="flex items-center gap-1.5 min-w-[60px] justify-end">
                                                    <span className="font-black text-indigo-400 font-mono text-sm">{qCount}</span>
                                                    <span className="text-[9px] text-slate-500 uppercase">Soru</span>
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    </div>
                 </div>

            {tasks && days.map((day, dayIdx) => (
                <DroppableDay 
                  key={day.date} 
                  id={`day-${day.date}`} 
                  label={day.label} 
                  shortLabel={day.shortLabel} 
                  tasks={tasks.filter((t: any) => t.date === day.date)} 
                  completionPercentage={calculateDailyCompletion(tasks.filter((t: any) => t.date === day.date))}
                  coachNote={dailyCoachNotes[day.date]}
                  studentNote={dailyStudentNotes[day.date]}
                  onCoachNoteChange={(val) => setDailyCoachNotes(prev => ({ ...prev, [day.date]: val }))}
                >
                  <SortableContext items={sortTasks(tasks.filter((t: any) => t.date === day.date)).map((t: any) => t.id)} strategy={verticalListSortingStrategy}>
                    <div className="relative space-y-3 flex-1">
                      {sortTasks(tasks.filter((t: any) => t.date === day.date)).map((task: any, taskIdx: number) => (
                          <SortableTask 
                            key={task.id} 
                            task={task} 
                            updateTask={updateTask} 
                            removeTask={removeTask} 
                            duplicateTask={duplicateTask} 
                            currentSubjects={currentSubjects} 
                            subjects={subjects} 
                            CURRICULUM={CURRICULUM} 
                            books={books} 
                            onDistribute={distributeTaskAcrossDays}
                            allDays={days}
                            isFirstTaskCard={dayIdx === 0 && taskIdx === 0}
                            isTourOpen={isTourOpen}
                          />
                      ))}
                    </div>
                  </SortableContext>
                </DroppableDay>
            ))}
          </div>

          {/* Haftalık Dağılım Tablosu */}
          {tasks && tasks.length > 0 && (
          <div id="tour-program-distribution-table" className="mt-8 bg-slate-900/40 border border-white/5 rounded-3xl p-6 overflow-x-auto print:hidden">
             <div className="flex items-center gap-3 mb-6">
                 <div className="w-10 h-10 rounded-2xl bg-indigo-500/10 flex items-center justify-center text-indigo-400 shrink-0">
                    <Book size={20} />
                 </div>
                 <div>
                    <h2 className="text-lg font-black text-white uppercase tracking-tight">Haftalık Dağılım Tablosu</h2>
                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-0.5">Derslere Göre Görev ve Soru Özeti</p>
                 </div>
             </div>
             
             {(() => {
                const formatSub = (sub: string, branch?: string) => {
                    return formatSubjectName(sub, branch);
                };

                const SORT_ORDER = [
                  "TYT Paragraf",
                  "TYT Problem",
                  "TYT Türkçe",
                  "TYT Matematik",
                  "TYT Geometri",
                  "TYT Fizik",
                  "TYT Kimya",
                  "TYT Biyoloji",
                  "TYT Tarih",
                  "TYT Coğrafya",
                  "10. Sınıf Edebiyat",
                  "10. Sınıf Matematik",
                  "10. Sınıf Fizik",
                  "10. Sınıf Kimya",
                  "10. Sınıf Biyoloji",
                  "10. Sınıf Tarih",
                  "10. Sınıf Coğrafya",
                  "AYT Fizik",
                  "AYT Kimya",
                  "AYT Biyoloji",
                  "AYT Matematik",
                  "Edebiyat",
                  "AYT Tarih",
                  "AYT Coğrafya",
                  "AYT Felsefe",
                  "Din Kültürü",
                  "İngilizce",
                  "TYT Türkçe Denemesi",
                  "Paragraf Denemesi",
                  "TYT Matematik Denemesi", 
                  "Problem Denemesi",
                  "TYT Geometri Denemesi",
                  "TYT Fen Denemesi", 
                  "TYT Sosyal Denemesi", 
                  "AYT Matematik Denemesi", 
                  "AYT Fen Denemesi", 
                  "AYT Sosyal-1 Denemesi", 
                  "AYT Sosyal-2 Denemesi", 
                  "YDT Denemesi",
                  "TYT Genel",
                  "AYT Genel"
                ];

                const subjectStats: any = {};
                const baseSubjects = Array.from(new Set(["Paragraf", "Problem", ...currentSubjects]));
                baseSubjects.forEach(sub => {
                   const formatted = formatSub(sub);
                   if (!subjectStats[formatted]) subjectStats[formatted] = {};
                });

                tasks.forEach((t: any) => {
                    let subjectForFormat = t.subject;
                    if (t.branch === 'Denemeler') {
                        if (t.topic === 'Problemler Denemesi') subjectForFormat = 'Problem';
                        if (t.topic === 'Paragraf Denemesi') subjectForFormat = 'Paragraf';
                        if (t.topic === 'TYT Geometri Denemesi') subjectForFormat = 'Geometri';
                    }
                    const subKey = formatSub(subjectForFormat, t.branch);
                    if (!subjectStats[subKey]) subjectStats[subKey] = {};
                    if (!subjectStats[subKey][t.date]) subjectStats[subKey][t.date] = { tasks: 0, questions: 0, details: [] };
                    
                    subjectStats[subKey][t.date].tasks += 1;
                    const qCount = (t.type !== 'Konu Çalışması' && t.type !== 'YouTube Video') ? (Number(t.targetCount) || 0) : 0;
                    subjectStats[subKey][t.date].questions += qCount;
                    
                    let desc = t.type === 'YouTube Video' ? '📺 Video' : t.type === 'Konu Çalışması' ? '📖 Konu' : '✍️ Soru';
                    const resolvedB = resolveVirtualBook(t.bookId, t.subject);
                    if (resolvedB) desc += ` (${resolvedB.bookName})`;
                    else if (t.bookId && t.bookId.startsWith('virtual-')) {
                        desc += ` (${t.bookId.endsWith('-2') ? '2. Kitap (Planlanan)' : '3. Kitap (Planlanan)'})`;
                    }
                    if (t.topic) desc += ` - ${t.topic}`;
                    if (qCount > 0) desc += ` [${qCount} Soru]`;
                    else if (t.targetCount > 0) desc += ` [${t.targetCount} ${t.type === 'YouTube Video' ? 'Video' : 'Sayfa'}]`;
                    subjectStats[subKey][t.date].details.push(desc);
                });

                const subjectsInTable = Object.keys(subjectStats).filter(subKey => {
                  const hasTasks = Object.keys(subjectStats[subKey]).length > 0;
                  if (hasTasks) return true;
                  
                  // Hide empty deneme subjects
                  const denemeKeywords = ['Denemesi', 'Deneme', 'Genel', 'YDT'];
                  const isDeneme = denemeKeywords.some(kw => subKey.includes(kw));
                  return !isDeneme;
                }).sort((a, b) => {
                  const idxA = SORT_ORDER.indexOf(a);
                  const idxB = SORT_ORDER.indexOf(b);
                  if (idxA !== -1 && idxB !== -1) return idxA - idxB;
                  if (idxA !== -1) return -1;
                  if (idxB !== -1) return 1;
                  return a.localeCompare(b);
                });

                const dayTotals: any = {};
                days.forEach((day:any) => {
                    dayTotals[day.date] = { tasks: 0, questions: 0 };
                });
                let grandTotalTasks = 0;
                let grandTotalQuestions = 0;

                return (
                    <div className="border border-white/5 rounded-xl overflow-hidden bg-slate-950/20">
                      <table className="w-full text-left text-xs text-slate-300">
                          <thead className="relative z-20">
                              <tr className="bg-slate-900/80">
                                  <th className="px-4 py-3 font-black uppercase tracking-widest text-slate-400 border-b border-r border-white/5 w-48 sticky left-0 bg-slate-900 shadow-[2px_0_10px_rgba(0,0,0,0.2)]">Ders</th>
                                  {days.map((day: any) => (
                                      <th key={day.date} className="px-4 py-3 font-black uppercase tracking-widest text-slate-400 border-b border-r border-white/5 last:border-r-0 text-center truncate w-24">
                                          {day.label}
                                      </th>
                                  ))}
                                  <th className="px-4 py-3 bg-indigo-500/10 font-black uppercase tracking-widest text-indigo-400 border-b border-white/5 text-center shadow-inner w-32">TOPLAM</th>
                              </tr>
                          </thead>
                          <tbody className="divide-y divide-white/5">
                              {subjectsInTable.map((subject, index) => {
                                  let totalTasks = 0;
                                  let totalQuestions = 0;
                                  return (
                                      <tr key={subject} className="hover:bg-white/5 transition-colors group">
                                          <td className="px-4 py-3 font-bold text-slate-200 border-r border-white/5 truncate max-w-[200px] sticky left-0 bg-slate-950/50 group-hover:bg-slate-900 transition-colors shadow-[2px_0_10px_rgba(0,0,0,0.2)] z-10" title={subject}>
                                            {subject}
                                          </td>
                                          {days.map((day: any) => {
                                              const stats = subjectStats[subject][day.date] || { tasks: 0, questions: 0 };
                                              totalTasks += stats.tasks;
                                              totalQuestions += stats.questions;
                                              dayTotals[day.date].tasks += stats.tasks;
                                              dayTotals[day.date].questions += stats.questions;
                                              grandTotalTasks += stats.tasks;
                                              grandTotalQuestions += stats.questions;
                                              
                                              return (
                                                  <td key={day.date} className="px-4 py-2 border-r border-white/5 last:border-r-0 text-center align-middle hover:bg-white/[0.02] cursor-default" title={stats.tasks > 0 ? stats.details.join('\n') : "Görev yok"}>
                                                      {stats.tasks > 0 ? (
                                                          <div className="flex flex-col items-center justify-center w-full">
                                                              <span className="text-[11px] font-black text-white">{stats.questions}</span>
                                                              <span className="text-[9px] font-bold text-slate-500">{stats.tasks} Grv</span>
                                                          </div>
                                                      ) : (
                                                          <span className="text-slate-700 font-black opacity-30 select-none">-</span>
                                                      )}
                                                  </td>
                                              );
                                          })}
                                          <td className="px-4 py-3 bg-indigo-500/5 text-center align-middle cursor-default" title={`${totalTasks} Görev, ${totalQuestions} Soru`}>
                                              <div className="flex flex-col items-center justify-center">
                                                  <span className="text-[13px] font-black text-indigo-400">{totalQuestions}</span>
                                                  <span className="text-[9px] text-indigo-600 font-bold tracking-widest uppercase">{totalTasks} Görev</span>
                                              </div>
                                          </td>
                                      </tr>
                                  )
                              })}
                          </tbody>
                          <tfoot className="relative z-20">
                              <tr className="bg-slate-900 border-t-2 border-white/10">
                                  <td className="px-4 py-3 font-black uppercase tracking-widest text-slate-300 border-r border-white/5 sticky left-0 bg-slate-900 shadow-[2px_0_10px_rgba(0,0,0,0.2)]">TOPLAM</td>
                                  {days.map((day: any) => {
                                      const totals = dayTotals[day.date];
                                      return (
                                          <td key={day.date} className="px-4 py-3 border-r border-white/5 last:border-r-0 text-center align-middle cursor-default" title={`Günlük Toplam: ${totals.tasks} Görev, ${totals.questions} Soru`}>
                                              <div className="flex flex-col items-center justify-center">
                                                  <span className="text-[12px] font-black text-white">{totals.questions}</span>
                                                  <span className="text-[9px] text-slate-400 font-bold tracking-widest uppercase">{totals.tasks} Grv</span>
                                              </div>
                                          </td>
                                      )
                                  })}
                                  <td className="px-4 py-3 bg-indigo-500/20 text-center align-middle cursor-default border-t border-indigo-500/20" title={`Haftalık Toplam: ${grandTotalTasks} Görev, ${grandTotalQuestions} Soru`}>
                                      <div className="flex flex-col items-center justify-center">
                                          <span className="text-[14px] font-black text-indigo-300">{grandTotalQuestions}</span>
                                          <span className="text-[10px] text-indigo-400 font-black tracking-widest uppercase">{grandTotalTasks} Görev</span>
                                      </div>
                                  </td>
                              </tr>
                          </tfoot>
                      </table>
                    </div>
                );
             })()}
          </div>
          )}

        </div>

        {/* Sidebar */}
        <aside className="w-full xl:w-80 shrink-0 bg-slate-900/40 border-b xl:border-b-0 xl:border-l border-white/5 p-6 space-y-6 max-h-[50vh] xl:max-h-none overflow-y-auto custom-scrollbar xl:sticky xl:top-0">
            <h2 className="text-sm font-black text-white uppercase tracking-widest sticky top-0 bg-slate-900/80 backdrop-blur-sm z-10 py-2">Görev Hazırlama</h2>

            {/* En Üstteki Aksiyon Butonları (Eksik Görev & Tekrarlayıcı - Minimal Yan Yana) */}
            <div className="grid grid-cols-2 gap-2">
              <button 
                id="tour-program-uncompleted-tasks"
                onClick={carryForwardUncompletedTasks}
                disabled={shiftingTasks}
                className="bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 font-bold py-2 px-2 rounded-lg transition-all flex items-center justify-center gap-1.5 border border-amber-500/30 uppercase tracking-wider text-[9px] disabled:opacity-50"
                title="Görünen ilk günden önceki 7 gün boyunca yapılmayan eksik görevleri kopyalayarak haftanın ilk gününe ekler"
              >
                {shiftingTasks ? <Loader2 size={12} className="animate-spin shrink-0" /> : <RotateCcw size={12} className="shrink-0" />}
                <span className="truncate">Eksik Görevler</span>
              </button>
              <button 
                onClick={() => {
                  const newVal = !showRepetitionPlanner;
                  setShowRepetitionPlanner(newVal);
                  safeStorage.setItem('showRepetitionPlanner', String(newVal));
                }}
                className={`font-bold py-2 px-2 rounded-lg transition-all flex items-center justify-center gap-1.5 border uppercase tracking-wider text-[9px] ${
                  showRepetitionPlanner 
                    ? 'bg-slate-800 text-slate-300 border-white/10 hover:bg-slate-700 hover:text-white'
                    : 'bg-indigo-500/10 text-indigo-400 border-indigo-500/30 hover:bg-indigo-500/20'
                }`}
                title="Tekrar sistem planlayıcısını gizle veya göster"
              >
                {showRepetitionPlanner ? <EyeOff size={12} className="shrink-0" /> : <Eye size={12} className="shrink-0" />}
                <span className="truncate">Tekrarlayıcı</span>
              </button>
            </div>
            
            {/* Tekrar Sistemi Planlayıcısı */}
            {showRepetitionPlanner && (
            <div id="tour-program-repetition-planner" className="bg-slate-950/60 p-4 rounded-2xl border border-white/10 space-y-4">
              <div className="flex items-center justify-between border-b border-white/5 pb-2">
                <div className="flex items-center gap-2">
                  <Sparkles size={16} className="text-indigo-400" />
                  <h3 className="text-xs font-black text-white uppercase tracking-widest">Tekrar Planlayıcı</h3>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setShowRepetitionPlanner(false);
                      safeStorage.setItem('showRepetitionPlanner', 'false');
                    }}
                    className="p-1 rounded text-slate-500 hover:text-slate-300 hover:bg-white/5 transition-colors"
                    title="Tekrarlayıcıyı Gizle"
                  >
                    <EyeOff size={14} />
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      const newVal = !repetitionEnabled;
                      setRepetitionEnabled(newVal);
                      safeStorage.setItem('repetitionEnabled', String(newVal));
                    }}
                    className={`relative inline-flex h-5 w-10 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                      repetitionEnabled ? 'bg-indigo-600' : 'bg-slate-700'
                    }`}
                  >
                    <span
                      className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                        repetitionEnabled ? 'translate-x-5' : 'translate-x-0'
                      }`}
                    />
                  </button>
                </div>
              </div>

              {repetitionEnabled && (
                <div className="space-y-3">
                  {/* Başlangıç Seviyesi */}
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest pl-1">
                      Başlangıç Tekrar Adımı
                    </label>
                    <div className="grid grid-cols-3 gap-1">
                      <button
                        type="button"
                        onClick={() => setStartingRepeatLevel('level1')}
                        className={`py-1.5 px-2 rounded-lg text-[10px] font-black uppercase tracking-wider transition-all border ${
                          startingRepeatLevel === 'level1'
                            ? 'bg-indigo-500/20 text-indigo-400 border-indigo-500/30 font-extrabold'
                            : 'bg-slate-800/50 text-slate-500 border-white/5 hover:text-slate-300'
                        }`}
                      >
                        1. Adım
                      </button>
                      <button
                        type="button"
                        onClick={() => setStartingRepeatLevel('level2')}
                        className={`py-1.5 px-2 rounded-lg text-[10px] font-black uppercase tracking-wider transition-all border ${
                          startingRepeatLevel === 'level2'
                            ? 'bg-indigo-500/20 text-indigo-400 border-indigo-500/30 font-extrabold'
                            : 'bg-slate-800/50 text-slate-500 border-white/5 hover:text-slate-300'
                        }`}
                      >
                        2. Adım
                      </button>
                      <button
                        type="button"
                        onClick={() => setStartingRepeatLevel('level3')}
                        className={`py-1.5 px-2 rounded-lg text-[10px] font-black uppercase tracking-wider transition-all border ${
                          startingRepeatLevel === 'level3'
                            ? 'bg-indigo-500/20 text-indigo-400 border-indigo-500/30 font-extrabold'
                            : 'bg-slate-800/50 text-slate-500 border-white/5 hover:text-slate-300'
                        }`}
                      >
                        3. Adım
                      </button>
                    </div>
                    <p className="text-[9px] text-slate-500 italic pl-1 leading-tight mt-1">
                      {startingRepeatLevel === 'level1' && 'Aynı anda 1. Ay (4. Hafta) ve 3. Ay (12. Hafta) tekrarlarını otomatik oluşturur.'}
                      {startingRepeatLevel === 'level2' && 'Görev 2. Adım olarak eklenir ve 8 hafta sonraki 3. Ay tekrarını planlar.'}
                      {startingRepeatLevel === 'level3' && 'Görev doğrudan 3. Adım olarak eklenir ve sonraki adımları tetiklemez.'}
                    </p>
                  </div>

                  {/* Sanal Kitaplar */}
                  <div id="tour-program-virtual-books" className="pt-1 border-t border-white/5 space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest pl-1">
                        Sanal Kitap Desteği
                      </span>
                      <button
                        type="button"
                        onClick={() => setAllowVirtualBooks(!allowVirtualBooks)}
                        className={`relative inline-flex h-4 w-8 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                          allowVirtualBooks ? 'bg-emerald-600' : 'bg-slate-700'
                        }`}
                      >
                        <span
                          className={`pointer-events-none inline-block h-3 w-3 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                            allowVirtualBooks ? 'translate-x-4' : 'translate-x-0'
                          }`}
                        />
                      </button>
                    </div>
                    <p className="text-[9px] text-slate-500 italic pl-1 leading-tight">
                      Öğrencinin 2. ve 3. kitabı henüz kayıtlı değilse bile "Planlanan Kitap" adıyla tekrar hedefleri ekler.
                    </p>
                  </div>
                </div>
              )}
            </div>
            )}

            <div id="tour-program-sidebar">
              <SidebarHierarchy CURRICULUM={CURRICULUM} tytSubjects={BRANCH_CONFIG['TYT'].subjects} aytSubjects={currentBranch?.aytSubjects || []} books={books} updateBookTopicCount={updateBookTopicCount} studentBranch={selectedStudent?.branch || 'SAYISAL'} studentGrade={selectedStudent?.grade || ''} isTourOpen={isTourOpen} currentTourTargetId={currentTourTargetId} />
            </div>
        </aside>
      </div>

      {isTemplateModalOpen && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-white/10 sm:rounded-2xl w-full max-w-2xl h-full sm:h-auto max-h-screen sm:max-h-[90vh] overflow-hidden flex flex-col">
            <div className="p-6 border-b border-white/10 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <FolderOpen className="text-indigo-400" size={24} />
                <h2 className="text-xl font-black text-white uppercase tracking-tight">Akademik Şablondan İçe Aktar</h2>
              </div>
              <button onClick={() => setIsTemplateModalOpen(false)} className="text-slate-500 hover:text-white transition-colors">
                ✕
              </button>
            </div>
            
            <div className="p-6 overflow-y-auto flex-1">
              {plans.length === 0 ? (
                <div className="text-center text-slate-500 py-12">Henüz hiç şablon oluşturulmamış. Yönetim panelinden ekleyebilirsiniz.</div>
              ) : (
                <div className="space-y-6">
                  <div>
                    <label className="text-xs font-bold text-slate-400 uppercase tracking-widest block mb-2">1. Şablon Seçin</label>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {plans.filter(p => p.status !== 'Pasif').map((plan) => (
                        <button
                          key={plan.id}
                          onClick={() => { setSelectedPlan(plan); setSelectedWeek(1); }}
                          className={`p-4 text-left rounded-xl border flex flex-col bg-slate-800/50 transition-all ${
                            selectedPlan?.id === plan.id ? 'border-indigo-500 bg-indigo-500/10' : 'border-white/5 hover:border-white/20'
                          }`}
                        >
                          <span className="font-bold text-white mb-1">{plan.title}</span>
                          <span className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">{plan.weeks || 4} Haftalık • {plan.type}</span>
                        </button>
                      ))}
                    </div>
                  </div>

                  {selectedPlan && (
                    <div>
                      <label className="text-xs font-bold text-slate-400 uppercase tracking-widest block mb-2">2. Hangi Haftayı Ekleyeceksiniz?</label>
                      <div className="flex flex-wrap gap-2">
                        {Array.from({ length: selectedPlan.weeks || 1 }).map((_, i) => (
                          <button
                            key={i}
                            onClick={() => setSelectedWeek(i + 1)}
                            className={`px-4 py-2 rounded-lg font-bold text-sm transition-all border ${
                              selectedWeek === i + 1 
                                ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/50' 
                                : 'bg-slate-800 text-slate-400 border-white/5 hover:border-white/20'
                            }`}
                          >
                            {i + 1}. Hafta
                          </button>
                        ))}
                      </div>
                      
                      {selectedPlan.content && selectedPlan.content[selectedWeek] && (
                        <div className="mt-4 p-4 rounded-xl bg-black/20 border border-white/5 space-y-3">
                          <p className="text-[11px] font-black text-slate-500 uppercase tracking-widest mb-2 text-center">Hafta Özeti (Önizleme)</p>
                          <div className="flex xl:grid xl:grid-cols-7 gap-2 overflow-x-auto custom-scrollbar pb-2">
                            {Array.from({ length: 7 }).map((_, i) => {
                                const dTasks = selectedPlan.content[selectedWeek][i + 1] || [];
                                return (
                                  <div key={i} className="min-w-[80px] xl:min-w-0 text-center rounded-lg bg-white/5 py-3 border border-white/5 shrink-0">
                                    <p className="text-[10px] font-bold text-slate-400 uppercase mb-1">{i + 1}. Gün</p>
                                    <p className="text-emerald-400 font-black">{dTasks.length > 0 ? `${dTasks.length} Görev` : '-'}</p>
                                  </div>
                                );
                            })}
                          </div>
                          <p className="text-[10px] text-slate-500 italic mt-2 text-center">* Eklendiğinde bu haftanın görevleri seçilen odağın (güncel haftanın) 7 gününe sırasıyla dağıtılacaktır.</p>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>
            
            <div className="p-6 border-t border-white/10 flex justify-end gap-3 bg-slate-900">
              <button 
                onClick={() => setIsTemplateModalOpen(false)}
                className="px-6 py-2 rounded-lg font-bold text-slate-400 hover:text-white transition-colors"
              >
                Vazgeç
              </button>
              <button 
                onClick={importFromTemplate}
                disabled={!selectedPlan}
                className="bg-indigo-600 hover:bg-indigo-500 text-white font-bold py-2 px-8 rounded-lg transition-colors disabled:opacity-50"
              >
                Haftaya Ekle
              </button>
            </div>
          </div>
        </div>
      )}

    </DndContext>
  );
}
