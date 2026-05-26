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
import { studentDataService } from '../../services/studentDataService';
import { Sparkles, Calendar, Clock, CheckCircle2, Plus, Trash2, Save, Target, ChevronLeft, ChevronRight, Printer, Loader2, Copy, Folder, FolderOpen, ChevronDown, Book, FileText, LayoutList, Youtube } from 'lucide-react';
import { CURRICULUM } from '../../constants/curriculum';
import { BRANCH_CONFIG } from '../../constants/branchConfig';
import { calculateSubjectMultipliers, calculateDailyCompletionWithMultipliers } from '../../lib/programCalculations';

const TASK_TYPES = ['Soru Çözümü', 'Konu Çalışması', 'YouTube Video'];
const BRANCHES = ['TYT', 'AYT', '10. Sınıf', 'Denemeler'];
export const DENEME_SUBJECTS = ['TYT Genel', 'AYT Genel', 'Türkçe', 'Matematik (TYT)', 'Fen (TYT)', 'Sosyal (TYT)', 'Matematik (AYT)', 'Fen (AYT)', 'Sosyal-1', 'Sosyal-2', 'YDT'];

export const DENEME_TYPES = [
    { name: 'TYT Genel Denemesi', subject: 'TYT Genel', questionCount: 120 },
    { name: 'AYT Genel Denemesi', subject: 'AYT Genel', questionCount: 160 },
    
    { name: 'Türkçe Bölüm Denemesi', subject: 'Türkçe', questionCount: 40 },
    { name: 'Dilbilgisi Denemesi', subject: 'Türkçe', questionCount: 15 },
    { name: 'Paragraf Denemesi', subject: 'Türkçe', questionCount: 25 },
    
    { name: 'TYT Matematik Denemesi', subject: 'Matematik (TYT)', questionCount: 40 },
    { name: 'Problemler Denemesi', subject: 'Matematik (TYT)', questionCount: 15 },
    { name: 'TYT Geometri Denemesi', subject: 'Matematik (TYT)', questionCount: 10 },
    
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
    const { topic, subject, branch, type, bookId, isCompleted, targetCount, bookData, updateBookTopicCount } = props;
    
    const defaultTopicCount = bookData?.topicQuestionCounts?.[topic] || targetCount || '';
    const [topicCount, setTopicCount] = useState<string | number>(defaultTopicCount);

    // Update state if bookData changes externally
    React.useEffect(() => {
        if (bookData?.topicQuestionCounts?.[topic]) {
            setTopicCount(bookData.topicQuestionCounts[topic]);
        } else if (targetCount) {
             setTopicCount(targetCount);
        } else {
             setTopicCount('');
        }
    }, [bookData, topic, targetCount]);

    const handleSaveTopicCount = () => {
        if(bookData && updateBookTopicCount) {
             const parsed = parseInt(String(topicCount));
             updateBookTopicCount(bookData.id, topic, !isNaN(parsed) && parsed > 0 ? parsed : null);
        }
    };

    const finalTargetCount = bookData?.topicQuestionCounts?.[topic] || targetCount || (type === 'Konu Çalışması' || type === 'YouTube Video' ? 0 : 100);

    const { attributes, listeners, setNodeRef, isDragging } = useSortable({
        id: `template-${subject}-${topic}`,
        data: { type: 'template', template: { title: topic, subject, type, bookId, targetCount: finalTargetCount } }
    });

    const tColor = type === 'YouTube Video' ? 'red' : type === 'Konu Çalışması' ? 'orange' : 'indigo';
    const bgClasses = {
        indigo: 'bg-indigo-500/10 text-white border border-transparent',
        orange: 'bg-orange-500/10 text-orange-100 border border-orange-500/30',
        red: 'bg-red-500/10 text-red-100 border border-red-500/30'
    }[tColor] || 'bg-indigo-500/10 text-white border border-transparent';

    return (
        <div ref={setNodeRef} {...attributes} {...listeners} className={`p-2 rounded-lg cursor-grab ${isDragging ? 'opacity-50' : ''} ${isCompleted ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' : bgClasses}`}>
           <div className="flex items-center justify-between">
               <p className="text-[10px] font-bold truncate max-w-[200px]" title={topic}>{topic}</p>
               {bookData && (
                   <input 
                      type="number"
                      value={topicCount}
                      onChange={e => setTopicCount(e.target.value)}
                      onBlur={handleSaveTopicCount}
                      onPointerDown={e => e.stopPropagation()}
                      className="w-12 bg-slate-800 text-slate-300 rounded text-[9px] p-1 text-center font-bold outline-none ring-0 placeholder-slate-500 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                      placeholder={type === 'YouTube Video' ? 'Video' : type === 'Konu Çalışması' ? 'Sayfa' : 'Soru'} 
                      title={type === 'YouTube Video' ? 'Video Sayısı (Otomatik Kaydedilir)' : type === 'Konu Çalışması' ? 'Sayfa Sayısı (Otomatik Kaydedilir)' : 'Soru Sayısı (Otomatik Kaydedilir)'}
                   />
               )}
           </div>
        </div>
    );
};

const FolderItem = ({ label, isOpen, onClick, children, icon: Icon = Folder, active = false }: any) => {
    return (
        <div className="flex flex-col">
            <button 
                onClick={onClick} 
                className={`flex items-center gap-2 p-2 rounded-lg transition-all border border-transparent hover:bg-slate-800/50 ${isOpen ? 'bg-slate-800/80 border-slate-700/50' : ''} ${active && !isOpen ? 'border-indigo-500/30 bg-indigo-500/5 text-indigo-400' : 'text-slate-300'}`}
            >
                {isOpen ? <FolderOpen size={14} className="text-indigo-400 flex-shrink-0" /> : <Icon size={14} className={`flex-shrink-0 ${active ? 'text-indigo-400' : 'text-slate-500'}`} />}
                <span className="text-xs font-bold font-sans tracking-wide truncate text-left">{label}</span>
                {isOpen ? <ChevronDown size={14} className="ml-auto text-slate-500 flex-shrink-0" /> : <ChevronRight size={14} className="ml-auto text-slate-600 flex-shrink-0" />}
            </button>
            {isOpen && (
                <div className="flex flex-col gap-1 mt-1 pl-3 ml-2 border-l-2 border-slate-800/50">
                    {children}
                </div>
            )}
        </div>
    );
};

const SidebarHierarchy = ({ CURRICULUM, tytSubjects, aytSubjects, books, updateBookTopicCount }: { CURRICULUM: any, tytSubjects: string[], aytSubjects: string[], books: any[], updateBookTopicCount: (bookId: string, topic: string, count: number | null) => void }) => {
    const [selectedType, setSelectedType] = useState<string | null>(null);
    const [selectedBranch, setSelectedBranch] = useState<string | null>(null);
    const [selectedSubject, setSelectedSubject] = useState<string | null>(null);
    const [selectedBook, setSelectedBook] = useState<string | null>(null);

    const toggleType = (t: string) => { if(selectedType === t) setSelectedType(null); else { setSelectedType(t); setSelectedBranch(null); setSelectedSubject(null); setSelectedBook(null); } };
    const toggleBranch = (b: string) => { if(selectedBranch === b) setSelectedBranch(null); else { setSelectedBranch(b); setSelectedSubject(null); setSelectedBook(null); } };
    const toggleSubject = (s: string) => { if(selectedSubject === s) setSelectedSubject(null); else { setSelectedSubject(s); setSelectedBook(null); } };
    const toggleBook = (b: string) => { if(selectedBook === b) setSelectedBook(null); else setSelectedBook(b); };

    const getAvailableSubjects = (branch: string) => {
        if (branch === 'TYT') return tytSubjects;
        if (branch === 'AYT') return aytSubjects;
        if (branch === '10. Sınıf') return BRANCH_CONFIG['10. Sınıf'].subjects;
        if (branch === 'Denemeler') return DENEME_SUBJECTS;
        return [];
    };

    return (
        <div className="space-y-1 bg-slate-900/50 p-3 rounded-2xl border border-white/5 shadow-inner">
            <h3 className="text-[10px] font-black text-slate-500 uppercase tracking-widest pl-2 mb-3">Görev Seçimi</h3>
            {TASK_TYPES.map(type => (
                <FolderItem 
                    key={type} 
                    label={type} 
                    isOpen={selectedType === type} 
                    active={selectedType === type}
                    onClick={() => toggleType(type)}
                    icon={LayoutList}
                >
                    {BRANCHES.map(branch => (
                        <FolderItem 
                            key={branch} 
                            label={branch} 
                            isOpen={selectedBranch === branch} 
                            active={selectedBranch === branch}
                            onClick={() => toggleBranch(branch)}
                        >
                            {getAvailableSubjects(branch).map(subject => (
                                <FolderItem 
                                    key={subject} 
                                    label={subject} 
                                    isOpen={selectedSubject === subject} 
                                    active={selectedSubject === subject}
                                    onClick={() => toggleSubject(subject)}
                                    icon={Book}
                                >
                                    {branch === 'Denemeler' ? (
                                        <div className="space-y-1 p-2 bg-slate-900/80 rounded-xl border border-white/5 mt-1">
                                            {DENEME_TYPES.filter(d => d.subject === subject).map(d => (
                                                <TopicDraggable key={d.name} topic={d.name} subject={subject} branch={branch} type={type} bookId={null} isCompleted={false} targetCount={d.questionCount} />
                                            ))}
                                            {DENEME_TYPES.filter(d => d.subject === subject).length === 0 && (
                                                <TopicDraggable topic={`${subject} Denemesi`} subject={subject} branch={branch} type={type} bookId={null} isCompleted={false} />
                                            )}
                                        </div>
                                    ) : (
                                        <>
                                            <FolderItem
                                                label="Kaynaksız (Genel Görev)"
                                                isOpen={selectedBook === 'none'}
                                                active={selectedBook === 'none'}
                                                onClick={() => toggleBook('none')}
                                                icon={FileText}
                                            >
                                                <div className="space-y-1 p-2 bg-slate-900/80 rounded-xl border border-white/5 mt-1">
                                                    <TopicDraggable key={`none-Genel Tekrar`} topic="Genel Tekrar / Çalışma" subject={subject} branch={branch} type={type} bookId={null} isCompleted={false} bookData={null} updateBookTopicCount={updateBookTopicCount} />
                                                    {(CURRICULUM[subject] || []).map((topic: string) => (
                                                        <TopicDraggable key={`none-${topic}`} topic={topic} subject={subject} branch={branch} type={type} bookId={null} isCompleted={false} bookData={null} updateBookTopicCount={updateBookTopicCount} />
                                                    ))}
                                                </div>
                                            </FolderItem>
                                            
                                            {books.filter(b => {
                                                if (b.subject !== subject) return false;
                                                const rt = b.resourceType || 'soru';
                                                if (type === 'Soru Çözümü') return rt === 'soru';
                                                if (type === 'Konu Çalışması') return rt === 'konu';
                                                if (type === 'YouTube Video') return rt === 'youtube';
                                                return true;
                                            }).map(book => {
                                                const bookData = books.find(b => b.id === book.id);
                                                return (
                                                <FolderItem
                                                    key={book.id}
                                                    label={`${book.bookName} (%${book.completionPercentage || 0})`}
                                                    isOpen={selectedBook === book.id}
                                                    active={selectedBook === book.id}
                                                    onClick={() => toggleBook(book.id)}
                                                    icon={book.resourceType === 'youtube' ? Youtube : book.resourceType === 'konu' ? FileText : Book}
                                                >
                                                    <div className="space-y-1 p-2 bg-slate-900/80 rounded-xl border border-white/5 mt-1">
                                                        <TopicDraggable key={`${book.id}-Genel Tekrar`} topic="Genel Tekrar / Çalışma" subject={subject} branch={branch} type={type} bookId={book.id} isCompleted={false} bookData={bookData} updateBookTopicCount={updateBookTopicCount} />
                                                        {(CURRICULUM[subject] || []).map((topic: string) => {
                                                            const isCompleted = (bookData?.completedTopics || []).includes(topic);
                                                            return (
                                                                <TopicDraggable key={`${book.id}-${topic}`} topic={topic} subject={subject} branch={branch} type={type} bookId={book.id} isCompleted={isCompleted} bookData={bookData} updateBookTopicCount={updateBookTopicCount} />
                                                            );
                                                        })}
                                                    </div>
                                                </FolderItem>
                                            )})}
                                        </>
                                    )}
                                </FolderItem>
                            ))}
                        </FolderItem>
                    ))}
                </FolderItem>
            ))}
        </div>
    );
};

const DroppableDay = (props: React.PropsWithChildren<{ id: string, label: string, shortLabel: string, tasks: any[], completionPercentage?: number }>) => {
    const { id, label, shortLabel, tasks, children, completionPercentage } = props;
    const { setNodeRef } = useDroppable({ id });
    const dayTotalQuestions = tasks.reduce((sum: number, t: any) => sum + ((t.type !== 'Konu Çalışması' && t.type !== 'YouTube Video') ? (Number(t.targetCount) || 0) : 0), 0);
    const dayTotalTasks = tasks.length;

    return (
        <div ref={setNodeRef} className="bg-slate-900/40 border border-white/5 rounded-3xl p-5 flex flex-col gap-4 min-h-[400px] hover:border-indigo-500/20 transition-all group">
            <div className="flex items-center justify-between border-b border-white/5 pb-3">
                <div className="flex flex-col">
                    <span className="text-sm font-black text-indigo-400 uppercase tracking-widest">{label}</span>
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
            {children}
        </div>
    );
};


const SortableTask = (props: any) => {
  const { task, updateTask, removeTask, duplicateTask, currentSubjects, subjects, CURRICULUM, books } = props;
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

  const taskBooks = books.filter(b => b.subject === task.subject);

  const tColor = task.type === 'YouTube Video' ? 'red' : task.type === 'Konu Çalışması' ? 'orange' : 'emerald';
  const styles = {
    emerald: { text: 'text-emerald-400', icon: 'text-emerald-500', bg: 'bg-emerald-500', border: 'border-emerald-500', shadow: 'shadow-emerald-500/20' },
    orange: { text: 'text-orange-400', icon: 'text-orange-500', bg: 'bg-orange-500', border: 'border-orange-500', shadow: 'shadow-orange-500/20' },
    red: { text: 'text-red-400', icon: 'text-red-500', bg: 'bg-red-500', border: 'border-red-500', shadow: 'shadow-red-500/20' }
  }[tColor] || { text: 'text-emerald-400', icon: 'text-emerald-500', bg: 'bg-emerald-500', border: 'border-emerald-500', shadow: 'shadow-emerald-500/20' };

  const [showDistribute, setShowDistribute] = useState(false);
  const [distributeCount, setDistributeCount] = useState(task.targetCount || 100);
  const [selectedDays, setSelectedDays] = useState<string[]>([task.date]);

  const handleDistribute = (onDistribute: (taskId: string, count: number, days: string[]) => void) => {
    onDistribute(task.id, distributeCount, selectedDays);
    setShowDistribute(false);
  };

  return (
    <div ref={setNodeRef} style={style} {...attributes} {...listeners} className={`${task.isExtra ? 'bg-gradient-to-br from-emerald-500/10 to-transparent border-emerald-500/30' : 'bg-white/5'} border ${task.isDone ? `${styles.border} ${styles.bg}/10` : (task.isExtra ? 'border-emerald-500/30' : 'border-white/10')} rounded-xl p-2 relative group/task cursor-grab active:cursor-grabbing`}>
      {task.isExtra && (
        <div className="absolute -top-2 -left-2 bg-emerald-500 text-white text-[8px] font-black uppercase tracking-widest px-1.5 py-0.5 rounded shadow-lg z-10 flex items-center gap-0.5">
           <Sparkles size={8} /> Öğrenci Ekledi
        </div>
      )}
      <div className="absolute -top-2 -right-2 flex items-center gap-1 opacity-0 group-hover/task:opacity-100 transition-all z-10 scale-75 group-hover/task:scale-100">
        <button 
          onPointerDown={(e) => { e.stopPropagation(); e.preventDefault(); duplicateTask?.(task); }}
          className="w-6 h-6 rounded-full bg-blue-500 hover:bg-blue-400 text-white flex items-center justify-center shadow-lg transition-colors"
          title="Görevi Kopyala"
        >
          <Copy size={10} />
        </button>
        {(task.type === 'Soru Çözümü' || task.type === 'Konu Çalışması' || task.type === 'YouTube Video' || task.branch === 'Denemeler') && (
           <button 
             onPointerDown={(e) => { e.stopPropagation(); e.preventDefault(); setShowDistribute(!showDistribute); }}
             className="w-6 h-6 rounded-full bg-indigo-500 hover:bg-indigo-400 text-white flex items-center justify-center shadow-lg transition-all"
             title="Günlere Dağıt"
           >
             <Sparkles size={10} />
           </button>
        )}
        <button 
          onPointerDown={(e) => { e.stopPropagation(); e.preventDefault(); removeTask(task.id); }}
          className="w-6 h-6 rounded-full bg-red-500 hover:bg-red-400 text-white flex items-center justify-center shadow-lg transition-colors"
          title="Görevi Sil"
        >
          <Trash2 size={10} />
        </button>
      </div>

      <div className="space-y-1 select-none">
        <div className={`w-full text-[10px] font-bold ${styles.text} uppercase mb-1 opacity-80 truncate`}>
          {task.type || 'Soru Çözümü'}
        </div>
        <div className={`w-full text-sm font-black ${styles.text} uppercase truncate`}>
          {task.subject}
        </div>
        <div className="w-full text-xs text-slate-300 font-bold truncate py-0.5">
          {task.topic || 'KONU SEÇİLMEMİŞ'}
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
             className={`w-8 h-8 rounded-lg border flex items-center justify-center transition-all flex-shrink-0 z-10 ${task.isDone ? `${styles.bg} ${styles.border} text-white shadow-lg ${styles.shadow}` : 'border-white/10 text-transparent'}`}
           >
             <CheckCircle2 size={16} />
           </button>
        </div>

        {showDistribute && (
          <div className="mt-2 p-2 bg-slate-900/90 rounded-lg border border-indigo-500/30 space-y-2 z-20" onPointerDown={e => e.stopPropagation()}>
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
  const { selectedStudent } = useStudent();
  const { userData } = useAuth();
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);
  
  const [startDate, setStartDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [tasks, setTasks] = useState<any[]>([]);
  const [savingRoutines, setSavingRoutines] = useState(false);
  const [routines, setRoutines] = useState<any>({ paragraf: 40, problem: 20 });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [books, setBooks] = useState<any[]>([]);
  const [multipliers, setMultipliers] = useState<Record<string, number>>({});

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
                           <p class="text-[8px] font-black text-slate-400 uppercase tracking-widest">HEDEF BÖLÜM</p>
                           <p class="text-[11px] font-bold text-slate-800">${selectedStudent?.targetDepartment || '-'}</p>
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
                                        const bookName = task.bookId ? (books.find((b: any) => b.id === task.bookId)?.bookName || 'Genel Kaynak') : 'Genel Görev';
                                        
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
                                                   <span class="line-clamp-2">${task.subject}</span>
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
                     <p class="text-[11px] font-bold text-slate-800 mt-0.5">${(selectedStudent as any)?.coachName || userData?.displayName || 'FocusON Koç'}</p>
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

  const activeBranch = (selectedStudent?.branch === 'SAYISAL' ? 'SAY' : 
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
        if (tb.globalBookId) {
            const gb = globalBooksData.find((g: any) => g.id === tb.globalBookId);
            if (gb) {
                 return { ...tb, topicQuestionCounts: (gb as any).topicQuestionCounts || {} };
            }
        }
        return tb;
    });

    setBooks(mergedBooks);

    let allTasks: any[] = [];
    const todayStr = new Date().toISOString().split('T')[0];
    
    dates.forEach(dateStr => {
        const dp = programsArray.find(p => p.date === dateStr);
        if (dp && dp.tasks) {
            allTasks = [...allTasks, ...dp.tasks.map((t:any) => ({...t, date: dateStr}))];
        }
    });

    setTasks(allTasks);
    setLoading(false);
  };

  const navigateDay = (days: number) => {
    const d = new Date(startDate);
    d.setDate(d.getDate() + days);
    setStartDate(d.toISOString().split('T')[0]);
  };

  const addTask = (date: string, template?: any) => {
    const newTask = {
      id: Math.random().toString(36).substr(2, 9),
      date,
      subject: template?.subject || 'Matematik',
      bookId: template?.bookId || '',
      topic: template?.title || '',
      targetCount: template?.targetCount !== undefined ? template.targetCount : (template?.type === 'Konu Çalışması' || template?.type === 'YouTube Video' ? 0 : 100),
      type: template?.type || 'Soru Çözümü',
      completedCount: 0,
      isDone: false
    };
    setTasks(prev => [...prev, newTask]);
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

  const updateTask = (taskId: string, field: string, value: any) => {
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
         tasks: dailyTasks
      }));
    }
    
    // Save routines
    promises.push(studentDataService.saveRoutines(selectedStudent!.uid, routines));

    await Promise.all(promises);
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
      const hasParagraf = tasks.some(t => t.date === dateStr && t.subject === 'Türkçe' && t.topic === 'Paragraf');
      if (!hasParagraf && routines.paragraf > 0) {
        newTasks.push({
           id: Math.random().toString(36).substr(2, 9),
           date: dateStr,
           subject: 'Türkçe',
           bookId: '',
           topic: 'Paragraf',
           targetCount: routines.paragraf,
           type: 'Soru Çözümü',
           completedCount: 0,
           isDone: false
        });
      }

      // Check if problem already exists
      const hasProblem = tasks.some(t => t.date === dateStr && t.subject === 'Matematik (TYT)' && t.topic === 'Problemler');
      if (!hasProblem && routines.problem > 0) {
        newTasks.push({
           id: Math.random().toString(36).substr(2, 9),
           date: dateStr,
           subject: 'Matematik (TYT)',
           bookId: '',
           topic: 'Problemler',
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
            const dayCount = index === 0 ? countPerDay + remainder : countPerDay;
            const existingIndex = updatedTasks.findIndex((t: any) => t.date === date && t.topic === baseTask.topic && t.subject === baseTask.subject);
            if (existingIndex > -1) {
                updatedTasks[existingIndex] = { ...updatedTasks[existingIndex], targetCount: dayCount };
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

  return (
    <DndContext 
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragEnd={handleDragEnd}
    >
      <div className="flex gap-6 pb-20 print:hidden animate-in fade-in slide-in-from-bottom-4 duration-500">
        <div className="flex-1 space-y-8">
          {/* Header */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <h1 className="text-2xl font-black italic text-white uppercase tracking-tighter">HAFTALIK PROGRAM</h1>
                <div className="h-px w-12 bg-white/10" />
                <span className="text-[10px] font-black text-emerald-400 uppercase tracking-widest">Odaktan Nirvanaya</span>
              </div>
              <div className="flex items-center gap-4">
                <button onClick={() => navigateDay(-1)} className="p-1 hover:bg-white/5 rounded text-slate-500"><ChevronLeft size={18} /></button>
                <div className="min-w-[180px] text-center">
                    <p className="text-emerald-400 font-bold text-[10px] uppercase tracking-widest leading-none mb-1">Odak Tarih</p>
                    <p className="text-white font-bold text-sm uppercase tracking-widest">
                       {new Date(days[0].date).toLocaleDateString('tr-TR', { day: 'numeric', month: 'long', year: 'numeric' })}
                    </p>
                </div>
                <button onClick={() => navigateDay(1)} className="p-1 hover:bg-white/5 rounded text-slate-500"><ChevronRight size={18} /></button>
              </div>
            </div>
            <div className="flex flex-col md:flex-row items-center gap-4">
              <button 
                onClick={downloadPDF}
                className="print:hidden bg-slate-800 hover:bg-slate-700 text-white font-black py-2.5 px-6 rounded-xl transition-all flex items-center gap-2 shadow-lg shadow-slate-900/20 uppercase tracking-widest text-[10px]"
              >
                <Printer size={14} /> PDF İNDİR
              </button>
              <button 
                onClick={handleSave}
                disabled={saving}
                className="print:hidden bg-emerald-600 hover:bg-emerald-500 text-white font-black py-2.5 px-6 rounded-xl transition-all flex items-center gap-2 shadow-lg shadow-emerald-600/20 uppercase tracking-widest text-[10px]"
              >
                <Save size={14} /> {saving ? 'GÜNCELLENİYOR...' : 'PROGRAMI KAYDET'}
              </button>
            </div>
          </div>

          {/* Program Grid */}
          <div className="grid grid-cols-4 gap-4">
             {/* Summary Slot */}
             <div className="bg-indigo-900/40 border border-indigo-500/20 rounded-3xl p-5 flex flex-col gap-4 min-h-[400px]">
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
                          <div className="flex items-center gap-1.5" title="Son 7 Günün Ortalama Tamamlama Oranı">
                             <span className="text-xs font-black text-emerald-400 uppercase tracking-widest">Başarı</span>
                             <span className="text-lg font-black text-white px-2 py-0.5 bg-emerald-500/20 rounded-md border border-emerald-500/30">
                               %{(days.reduce((acc, day) => acc + calculateDailyCompletion(tasks?.filter((t: any) => t.date === day.date) || []), 0) / (days.length || 1)).toFixed(0)}
                             </span>
                          </div>
                        </div>
                    </div>

                    <div className="bg-slate-800/50 rounded-xl p-4 border border-white/5 space-y-4">
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

            {tasks && days.map((day) => (
                <DroppableDay key={day.date} id={`day-${day.date}`} label={day.label} shortLabel={day.shortLabel} tasks={tasks.filter((t: any) => t.date === day.date)} completionPercentage={calculateDailyCompletion(tasks.filter((t: any) => t.date === day.date))}>
                  <SortableContext items={sortTasks(tasks.filter((t: any) => t.date === day.date)).map((t: any) => t.id)} strategy={verticalListSortingStrategy}>
                    <div className="space-y-3 flex-1">
                      {sortTasks(tasks.filter((t: any) => t.date === day.date)).map((task: any) => (
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
                          />
                      ))}
                    </div>
                  </SortableContext>
                </DroppableDay>
            ))}
          </div>

        </div>

        {/* Sidebar */}
        <aside className="w-80 shrink-0 bg-slate-900/40 border-l border-white/5 p-6 space-y-6">
            <h2 className="text-sm font-black text-white uppercase tracking-widest">Görev Hazırlama</h2>
            <SidebarHierarchy CURRICULUM={CURRICULUM} tytSubjects={BRANCH_CONFIG['TYT'].subjects} aytSubjects={currentBranch.aytSubjects} books={books} updateBookTopicCount={updateBookTopicCount} />
        </aside>
      </div>
    </DndContext>
  );
}
