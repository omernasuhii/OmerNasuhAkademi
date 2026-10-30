import React, { useState, useEffect } from 'react';
import { studentDataService } from '../services/studentDataService';
import { calculateBookProgress as calculateBookProgressUtil } from '../utils/bookProgress';
import { useCurriculum } from '../lib/CurriculumContext';
import { 
  X, 
  CheckCircle2, 
  Award, 
  Clock, 
  Calendar, 
  BookOpen, 
  Calculator, 
  AlertCircle,
  FileCheck2,
  Sparkles
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface DenemeResultModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: (result: any) => void;
  studentId?: string;
  initialData?: {
    studentUid?: string;
    studentName?: string;
    bookId?: string | null;
    bookName?: string;
    denemeTopic?: string; // e.g. "Deneme 1"
    subject?: string;
    branch?: string;
    examType?: string; // "BRANŞ" | "TYT" | "AYT" | "YDT" | "9. Sınıf" | "10. Sınıf" | "11. Sınıf"
    date?: string;
    taskId?: string;
    questionCount?: number;
    allBooks?: any[];
  };
}

export default function DenemeResultModal({
  isOpen,
  onClose,
  onSuccess,
  studentId,
  initialData
}: DenemeResultModalProps) {
  const effectiveStudentId = studentId || initialData?.studentUid || '';
  const { curriculum: CURRICULUM, subtopics: SUBTOPICS_MAP } = useCurriculum();

  const [examName, setExamName] = useState('');
  const [examDate, setExamDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [durationMinutes, setDurationMinutes] = useState<number | ''>('');
  const [difficulty, setDifficulty] = useState<'Kolay' | 'Orta' | 'Zor' | 'Çok Zor'>('Orta');
  const [studentNote, setStudentNote] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Single branch deneme state
  const [isBranchExam, setIsBranchExam] = useState(true);
  const [branchSubject, setBranchSubject] = useState('Matematik');
  const [correctCount, setCorrectCount] = useState<number | ''>(0);
  const [incorrectCount, setIncorrectCount] = useState<number | ''>(0);
  const [blankCount, setBlankCount] = useState<number | ''>(0);
  const [totalQuestions, setTotalQuestions] = useState<number>(40);

  // Multi-section general deneme state
  const [generalScores, setGeneralScores] = useState<Record<string, { c: number; i: number; b: number; net: number }>>({});

  useEffect(() => {
    if (isOpen && initialData) {
      const defaultDate = initialData.date || new Date().toISOString().split('T')[0];
      setExamDate(defaultDate);

      const generatedName = initialData.bookName 
        ? `${initialData.bookName} - ${initialData.denemeTopic || 'Deneme'}`
        : `${initialData.subject || 'Genel'} ${initialData.denemeTopic || 'Denemesi'}`;
      setExamName(generatedName);

      const isGeneral = 
        initialData.examType === 'TYT' || 
        initialData.examType === 'AYT' || 
        initialData.examType === 'YKS' || 
        initialData.examType === 'YDT' ||
        initialData.subject?.includes('Genel') ||
        initialData.branch === 'Denemeler';

      const isSingleBranch = !isGeneral;
      setIsBranchExam(isSingleBranch);

      const subj = initialData.subject || 'Matematik';
      setBranchSubject(subj);

      const qCount = initialData.questionCount || 
        (subj.includes('Fizik') || subj.includes('Kimya') || subj.includes('Biyoloji') ? 14 : 40);
      setTotalQuestions(qCount);
      setCorrectCount(0);
      setIncorrectCount(0);
      setBlankCount(qCount);
      setDurationMinutes('');
      setStudentNote('');
      setErrorMessage(null);

      // Initialize general scores if general
      if (isGeneral) {
        if (initialData.examType === 'AYT' || initialData.subject?.includes('AYT')) {
          setGeneralScores({
            'Matematik (AYT)': { c: 0, i: 0, b: 40, net: 0 },
            'Fen Bilimleri (AYT)': { c: 0, i: 0, b: 40, net: 0 },
            'Edebiyat-Sosyal-1 (AYT)': { c: 0, i: 0, b: 40, net: 0 }
          });
        } else {
          setGeneralScores({
            'Türkçe (TYT)': { c: 0, i: 0, b: 40, net: 0 },
            'Temel Matematik (TYT)': { c: 0, i: 0, b: 40, net: 0 },
            'Sosyal Bilimler (TYT)': { c: 0, i: 0, b: 20, net: 0 },
            'Fen Bilimleri (TYT)': { c: 0, i: 0, b: 20, net: 0 }
          });
        }
      }
    }
  }, [isOpen, initialData]);

  // Calculate single branch Net
  const c = Number(correctCount) || 0;
  const w = Number(incorrectCount) || 0;
  const branchNet = Math.max(0, Math.round((c - (w / 4)) * 100) / 100);

  // Auto-calculate blank count
  const calculatedBlank = Math.max(0, totalQuestions - (c + w));

  // General Exam Total Net
  const generalTotalNet = Object.values(generalScores).reduce((sum, val) => sum + (val.net || 0), 0);

  const handleGeneralScoreChange = (section: string, field: 'c' | 'i', val: number, maxQ: number = 40) => {
    setGeneralScores(prev => {
      const current = prev[section] || { c: 0, i: 0, b: maxQ, net: 0 };
      const updated = { ...current, [field]: Math.max(0, val) };
      const totalAnswered = updated.c + updated.i;
      updated.b = Math.max(0, maxQ - totalAnswered);
      updated.net = Math.max(0, Math.round((updated.c - (updated.i / 4)) * 100) / 100);
      return { ...prev, [section]: updated };
    });
  };

  const handleSave = async () => {
    if (!studentId) {
      setErrorMessage("Öğrenci kimliği bulunamadı.");
      return;
    }

    if (!examName.trim()) {
      setErrorMessage("Lütfen deneme adını giriniz.");
      return;
    }

    setIsSubmitting(true);
    setErrorMessage(null);

    try {
      let scoresPayload: Record<string, any> = {};
      let totalNetPayload = 0;
      let examTypeToSave = 'BRANŞ';

      if (isBranchExam) {
        examTypeToSave = 'BRANŞ';
        totalNetPayload = branchNet;
        scoresPayload[branchSubject] = {
          c: c,
          i: w,
          b: calculatedBlank,
          correct: c,
          incorrect: w,
          blank: calculatedBlank,
          net: branchNet,
          totalQuestions: totalQuestions
        };
      } else {
        examTypeToSave = initialData?.examType || (initialData?.subject?.includes('AYT') ? 'AYT' : 'TYT');
        totalNetPayload = Math.round(generalTotalNet * 100) / 100;
        Object.entries(generalScores).forEach(([key, val]) => {
          scoresPayload[key] = {
            c: val.c,
            i: val.i,
            b: val.b,
            correct: val.c,
            incorrect: val.i,
            blank: val.b,
            net: val.net
          };
        });
      }

      // 1. Save Exam Result to Firestore
      const examResultData = {
        studentId: effectiveStudentId,
        examName: examName.trim(),
        examType: examTypeToSave,
        date: examDate,
        scores: scoresPayload,
        totalNet: totalNetPayload,
        durationMinutes: Number(durationMinutes) || null,
        difficulty,
        studentNote: studentNote.trim(),
        bookId: initialData?.bookId || null,
        denemeTopic: initialData?.denemeTopic || null,
        createdAt: new Date().toISOString()
      };

      const savedExamId = await studentDataService.addExamResult(examResultData);

      // 2. If connected to a physical book resource, update book progress
      if (initialData?.bookId && initialData?.denemeTopic && effectiveStudentId) {
        try {
          const allTrackerBooks = await studentDataService.getBookTracking(effectiveStudentId);
          const targetBook = allTrackerBooks.find(b => b.id === initialData.bookId);

          if (targetBook) {
            const currentTopics: string[] = Array.isArray(targetBook.completedTopics) ? targetBook.completedTopics : [];
            if (!currentTopics.includes(initialData.denemeTopic)) {
              const updatedTopics = [...currentTopics, initialData.denemeTopic];
              const newPercentage = calculateBookProgressUtil(targetBook, updatedTopics, CURRICULUM, SUBTOPICS_MAP);

              await studentDataService.updateBookProgress(targetBook.id, {
                ...targetBook,
                completedTopics: updatedTopics,
                completionPercentage: newPercentage
              });
            }
          }
        } catch (bookErr) {
          console.error("Kitap ilerleme güncelleme hatası:", bookErr);
        }
      }

      // 3. If connected to a weekly schedule task, mark the task as done
      if (initialData?.taskId && initialData?.date && effectiveStudentId) {
        try {
          const programs = await studentDataService.getDailyPrograms(effectiveStudentId, [initialData.date]);
          const dayProgram = programs.find(p => p.date === initialData.date);
          if (dayProgram && Array.isArray(dayProgram.tasks)) {
            const updatedTasks = dayProgram.tasks.map((t: any) => {
              if (t.id === initialData.taskId) {
                return {
                  ...t,
                  isDone: true,
                  isWaitingResult: false,
                  completedCount: isBranchExam ? totalQuestions : 1,
                  examId: savedExamId
                };
              }
              return t;
            });

            await studentDataService.saveDailyProgram({
              ...dayProgram,
              tasks: updatedTasks
            });
          }
        } catch (taskErr) {
          console.error("Görev tamamlama hatası:", taskErr);
        }
      } else if (!initialData?.taskId && effectiveStudentId && (initialData?.bookId || initialData?.denemeTopic || isBranchExam)) {
        // Otomatik Eşleştirme: Kaynak takibinden veya bağımsız çözüldüğünde haftalık programdaki bekleyen görevi tamamla
        try {
          const checkDate = examDate || new Date().toISOString().split('T')[0];
          const currD = new Date(checkDate);
          const dateRange: string[] = [];
          for (let offset = -3; offset <= 3; offset++) {
            const d = new Date(currD);
            d.setDate(currD.getDate() + offset);
            dateRange.push(d.toISOString().split('T')[0]);
          }

          const programs = await studentDataService.getDailyPrograms(effectiveStudentId, dateRange);
          let matched = false;

          for (const dayProgram of programs) {
            if (matched) break;
            if (dayProgram && Array.isArray(dayProgram.tasks)) {
              let dayModified = false;
              const updatedTasks = dayProgram.tasks.map((t: any) => {
                if (matched || t.isDone) return t;
                const matchesBook = initialData?.bookId && t.bookId === initialData.bookId;
                const matchesTopic = initialData?.denemeTopic && (t.topic === initialData.denemeTopic || (t.topic && t.topic.includes(initialData.denemeTopic)));
                const matchesBranch = (t.branch === 'Denemeler' || t.type === 'Deneme' || t.topic?.includes('Deneme')) && (
                  (isBranchExam && t.subject === (branchSubject || initialData?.subject)) ||
                  (initialData?.bookName && t.topic?.includes(initialData.bookName))
                );

                if ((matchesBook && matchesTopic) || (matchesBook && !t.isDone) || (matchesTopic && matchesBranch)) {
                  matched = true;
                  dayModified = true;
                  return {
                    ...t,
                    isDone: true,
                    isWaitingResult: false,
                    completedCount: isBranchExam ? totalQuestions : 1,
                    examId: savedExamId
                  };
                }
                return t;
              });

              if (dayModified) {
                await studentDataService.saveDailyProgram({
                  ...dayProgram,
                  tasks: updatedTasks
                });
              }
            }
          }
        } catch (autoSyncErr) {
          console.error("Otomatik program deneme görevi eşleştirme hatası:", autoSyncErr);
        }
      }

      // 4. Award XP and Level Progress to the student
      if (effectiveStudentId) {
        try {
          const awardedXP = isBranchExam ? 50 : 100;
          await studentDataService.awardXP(
            effectiveStudentId, 
            awardedXP, 
            isBranchExam ? `${examName || 'Branş Denemesi'} Tamamlandı (+${awardedXP} XP)` : `${examName || 'Genel Deneme'} Tamamlandı (+${awardedXP} XP)`
          );
        } catch (xpErr) {
          console.error("XP ödüllendirme hatası:", xpErr);
        }
      }

      if (onSuccess) {
        onSuccess({
          id: savedExamId,
          ...examResultData
        });
      }

      onClose();
    } catch (err: any) {
      console.error("Deneme kaydetme hatası:", err);
      setErrorMessage(err?.message || "Deneme sonucu kaydedilirken bir hata oluştu.");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md overflow-y-auto">
        <motion.div 
          initial={{ opacity: 0, scale: 0.95, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 15 }}
          className="w-full max-w-xl bg-slate-900 border border-white/10 rounded-3xl shadow-2xl overflow-hidden my-8"
        >
          {/* Header */}
          <div className="p-6 bg-gradient-to-r from-rose-500/20 via-indigo-500/15 to-purple-500/10 border-b border-white/10 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-rose-500/20 border border-rose-500/30 flex items-center justify-center text-rose-400">
                <FileCheck2 size={20} />
              </div>
              <div>
                <h2 className="text-lg font-bold text-white flex items-center gap-2">
                  Deneme Net & Sonuç Girişi
                  <span className="text-[10px] uppercase font-black px-2 py-0.5 rounded-full bg-rose-500/20 text-rose-300 border border-rose-500/30">
                    Pedagojik Kural
                  </span>
                </h2>
                <p className="text-xs text-slate-400 mt-0.5">
                  Deneme sonucunuzu girdiğinizde görev ve kaynak ilerlemeniz otomatik tamamlanır.
                </p>
              </div>
            </div>
            <button 
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-white rounded-xl hover:bg-white/5 transition-colors"
            >
              <X size={18} />
            </button>
          </div>

          {/* Form Content */}
          <div className="p-6 space-y-5 max-h-[75vh] overflow-y-auto custom-scrollbar">
            {errorMessage && (
              <div className="p-3.5 rounded-2xl bg-rose-500/15 border border-rose-500/30 flex items-center gap-2.5 text-xs text-rose-300">
                <AlertCircle size={16} className="shrink-0 text-rose-400" />
                <span>{errorMessage}</span>
              </div>
            )}

            {/* Exam Name */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
                <BookOpen size={14} className="text-indigo-400" />
                Deneme Adı / Yayın
              </label>
              <input 
                type="text"
                value={examName}
                onChange={e => setExamName(e.target.value)}
                placeholder="Örn: 3D TYT Matematik 10'lu Deneme - Deneme 1"
                className="w-full bg-slate-950/80 border border-white/10 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-slate-500 outline-none focus:border-rose-500 transition-colors"
              />
            </div>

            {/* Date & Duration */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
                  <Calendar size={14} className="text-indigo-400" />
                  Sınav Tarihi
                </label>
                <input 
                  type="date"
                  value={examDate}
                  onChange={e => setExamDate(e.target.value)}
                  className="w-full bg-slate-950/80 border border-white/10 rounded-xl px-3.5 py-2.5 text-xs text-white outline-none focus:border-rose-500 transition-colors"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
                  <Clock size={14} className="text-indigo-400" />
                  Süre (Dakika - İsteğe Bağlı)
                </label>
                <input 
                  type="number"
                  min="0"
                  placeholder="Örn: 45 dk"
                  value={durationMinutes}
                  onChange={e => setDurationMinutes(e.target.value === '' ? '' : Number(e.target.value))}
                  className="w-full bg-slate-950/80 border border-white/10 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-slate-500 outline-none focus:border-rose-500 transition-colors"
                />
              </div>
            </div>

            {/* Mode: Single Branch Exam vs General Exam */}
            {isBranchExam ? (
              <div className="bg-slate-950/60 p-4 rounded-2xl border border-white/5 space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-black text-slate-300 uppercase tracking-wider">
                    {branchSubject} Net Girişi
                  </span>
                  <span className="text-[10px] text-slate-400 font-bold bg-white/5 px-2 py-0.5 rounded-md">
                    Toplam {totalQuestions} Soru
                  </span>
                </div>

                <div className="grid grid-cols-3 gap-3">
                  <div className="space-y-1">
                    <label className="text-[11px] font-bold text-emerald-400 block text-center">Doğru (D)</label>
                    <input 
                      type="number"
                      min="0"
                      max={totalQuestions}
                      value={correctCount}
                      onChange={e => setCorrectCount(e.target.value === '' ? '' : Number(e.target.value))}
                      className="w-full bg-slate-900 border border-emerald-500/30 text-emerald-300 font-bold text-center rounded-xl py-2 text-base outline-none focus:border-emerald-400"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[11px] font-bold text-rose-400 block text-center">Yanlış (Y)</label>
                    <input 
                      type="number"
                      min="0"
                      max={totalQuestions}
                      value={incorrectCount}
                      onChange={e => setIncorrectCount(e.target.value === '' ? '' : Number(e.target.value))}
                      className="w-full bg-slate-900 border border-rose-500/30 text-rose-300 font-bold text-center rounded-xl py-2 text-base outline-none focus:border-rose-400"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[11px] font-bold text-slate-400 block text-center">Boş (B)</label>
                    <div className="w-full bg-slate-900 border border-white/10 text-slate-400 font-bold text-center rounded-xl py-2 text-base flex items-center justify-center">
                      {calculatedBlank}
                    </div>
                  </div>
                </div>

                {/* Calculated Branch Net Display */}
                <div className="p-3 rounded-xl bg-gradient-to-r from-rose-500/10 to-indigo-500/10 border border-rose-500/20 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Calculator size={16} className="text-rose-400" />
                    <span className="text-xs font-bold text-slate-300">Hesaplanan Branş Neti:</span>
                  </div>
                  <div className="flex items-baseline gap-1">
                    <span className="text-xl font-black text-rose-400">{branchNet}</span>
                    <span className="text-xs text-slate-400">Net</span>
                  </div>
                </div>
              </div>
            ) : (
              <div className="bg-slate-950/60 p-4 rounded-2xl border border-white/5 space-y-3">
                <span className="text-xs font-black text-slate-300 uppercase tracking-wider block">
                  Genel Deneme Bölümleri
                </span>

                <div className="space-y-2">
                  {Object.entries(generalScores).map(([section, score]) => (
                    <div key={section} className="flex items-center justify-between gap-2 p-2.5 rounded-xl bg-slate-900 border border-white/5">
                      <span className="text-xs font-bold text-slate-300 truncate max-w-[140px]">{section}</span>
                      <div className="flex items-center gap-2">
                        <div className="flex items-center gap-1">
                          <span className="text-[10px] text-emerald-400 font-bold">D:</span>
                          <input 
                            type="number"
                            min="0"
                            value={score.c}
                            onChange={e => handleGeneralScoreChange(section, 'c', Number(e.target.value) || 0)}
                            className="w-12 bg-slate-950 border border-emerald-500/30 text-emerald-300 text-center text-xs py-1 rounded-lg"
                          />
                        </div>
                        <div className="flex items-center gap-1">
                          <span className="text-[10px] text-rose-400 font-bold">Y:</span>
                          <input 
                            type="number"
                            min="0"
                            value={score.i}
                            onChange={e => handleGeneralScoreChange(section, 'i', Number(e.target.value) || 0)}
                            className="w-12 bg-slate-950 border border-rose-500/30 text-rose-300 text-center text-xs py-1 rounded-lg"
                          />
                        </div>
                        <span className="text-xs font-black text-indigo-300 ml-1 min-w-[50px] text-right">{score.net} Net</span>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Total Net */}
                <div className="p-3 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-between">
                  <span className="text-xs font-bold text-indigo-300">Toplam Genel Net:</span>
                  <span className="text-xl font-black text-indigo-400">{Math.round(generalTotalNet * 100) / 100} Net</span>
                </div>
              </div>
            )}

            {/* Difficulty and Note */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-300">Zorluk Derecesi</label>
                <div className="grid grid-cols-4 gap-1">
                  {(['Kolay', 'Orta', 'Zor', 'Çok Zor'] as const).map(diff => (
                    <button
                      key={diff}
                      type="button"
                      onClick={() => setDifficulty(diff)}
                      className={`py-1.5 rounded-lg text-[10px] font-bold transition-all border ${
                        difficulty === diff
                          ? 'bg-rose-500/20 text-rose-300 border-rose-500/40 shadow-sm'
                          : 'bg-slate-950 text-slate-400 border-white/5 hover:text-slate-200'
                      }`}
                    >
                      {diff}
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-300">Koça Not / Yorum (İsteğe Bağlı)</label>
                <input 
                  type="text"
                  value={studentNote}
                  onChange={e => setStudentNote(e.target.value)}
                  placeholder="Zaman yetiştiremedim, vb."
                  className="w-full bg-slate-950/80 border border-white/10 rounded-xl px-3 py-1.5 text-xs text-white placeholder-slate-500 outline-none focus:border-rose-500 transition-colors"
                />
              </div>
            </div>
          </div>

          {/* Footer Actions */}
          <div className="p-4 bg-slate-950/80 border-t border-white/10 flex items-center justify-end gap-2.5">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="px-4 py-2.5 rounded-xl text-xs font-bold text-slate-400 hover:text-white hover:bg-white/5 transition-colors"
            >
              Vazgeç
            </button>
            <button
              type="button"
              onClick={handleSave}
              disabled={isSubmitting}
              className="px-5 py-2.5 rounded-xl text-xs font-bold bg-rose-600 hover:bg-rose-500 text-white shadow-lg shadow-rose-600/30 flex items-center gap-2 transition-all disabled:opacity-50"
            >
              {isSubmitting ? (
                <span className="inline-block animate-spin">⏳</span>
              ) : (
                <CheckCircle2 size={15} />
              )}
              <span>Sonucu Kaydet ve Tamamla</span>
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
