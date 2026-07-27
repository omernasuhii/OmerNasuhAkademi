import { studentDataService } from '../services/studentDataService';

export const safeGetTime = (dateVal: any) => {
  if (!dateVal) return 0;
  if (dateVal.toDate && typeof dateVal.toDate === 'function') {
    return dateVal.toDate().getTime();
  }
  const d = new Date(dateVal);
  return isNaN(d.getTime()) ? 0 : d.getTime();
};

export const TASK_WEIGHTS = {
  'Soru Çözümü': 3,
  'Konu Çalışması': 1,
  'YouTube Video': 1,
  'Deneme': 2,
};

export const SUBJECT_MAX_NETS: Record<string, number> = {
  // TYT
  'Türkçe': 40,
  'Matematik (TYT)': 40,
  'Fizik (TYT)': 7,
  'Kimya (TYT)': 7,
  'Biyoloji (TYT)': 6,
  'Tarih': 5,
  'Coğrafya': 5,
  'Felsefe': 5,
  'Din Kültürü': 5,
  // AYT SAY
  'Matematik (AYT)': 40,
  'Fizik (AYT)': 14,
  'Kimya (AYT)': 13,
  'Biyoloji (AYT)': 13,
  // AYT EA/SÖZ
  'Edebiyat': 24,
  'Tarih-1': 10,
  'Coğrafya-1': 6,
  'Tarih-2': 11,
  'Coğrafya-2': 11,
  'Felsefe Grubu': 12,
  'Din (Seçmeli)': 6,
  // YDT
  'Yabancı Dil': 80
};

// Aliases mapping for common names used in the app
export const SUBJECT_ALIASES: Record<string, string[]> = {
  'Matematik (TYT)': ['Matematik', 'TYT Matematik'],
  'Tarih': ['Tarih (TYT)', 'TYT Tarih'],
  'Coğrafya': ['Coğrafya (TYT)', 'TYT Coğrafya'],
  'Felsefe': ['Felsefe (TYT)', 'TYT Felsefe'],
  'Din Kültürü': ['Din (TYT)', 'TYT Din'],
  'Fizik (TYT)': ['Fizik', 'TYT Fizik'],
  'Kimya (TYT)': ['Kimya', 'TYT Kimya'],
  'Biyoloji (TYT)': ['Biyoloji', 'TYT Biyoloji'],
  'Edebiyat': ['Türk Dili ve Edebiyatı', 'AYT Edebiyat', 'Edebiyat (AYT)'],
  'Matematik (AYT)': ['AYT Matematik'],
  'Fizik (AYT)': ['AYT Fizik'],
  'Kimya (AYT)': ['AYT Kimya'],
  'Biyoloji (AYT)': ['AYT Biyoloji'],
  'Tarih-1': ['AYT Tarih-1', 'Tarih-1 (AYT)'],
  'Coğrafya-1': ['AYT Coğrafya-1', 'Coğrafya-1 (AYT)'],
};

export const getCanonicalSubjectName = (subject: string): string => {
  for (const [canonical, aliases] of Object.entries(SUBJECT_ALIASES)) {
    if (canonical === subject || aliases.includes(subject)) {
      return canonical;
    }
  }
  return subject;
};

export const calculateSubjectMultipliers = (exams: any[], studentBranch?: string) => {
  if (!exams || exams.length === 0) return {};

  const subjectTotals: Record<string, { totalNet: number, count: number }> = {};
  
  // Sadece son 4 denemeyi al (tarihe göre azalan sırayla)
  const recentExams = [...exams]
    .sort((a, b) => safeGetTime(b.date) - safeGetTime(a.date))
    .slice(0, 4);
  
  recentExams.forEach(exam => {
    // Collect mapped scores (this handles both TYT and AYT correctly assuming structure is { subject: net })
    // The structure typical in this app: exam.scores is array of {name, d, y, n} or similar
    // Also we have mappedScores in StudentExamResults
    
    // Some exams might have results stored differently. We expect exam.scores as an array or object.
    const scores = exam.scores || {};
    
    Object.entries(scores).forEach(([subj, scoreObj]: [string, any]) => {
      const net = parseFloat(scoreObj?.n || 0);
      const canonical = getCanonicalSubjectName(subj);
      
      if (!subjectTotals[canonical]) {
         subjectTotals[canonical] = { totalNet: 0, count: 0 };
      }
      subjectTotals[canonical].totalNet += Math.max(0, net); // don't count negative nets
      subjectTotals[canonical].count += 1;
    });
  });

  const multipliers: Record<string, number> = {};

  for (const [canonical, maxNet] of Object.entries(SUBJECT_MAX_NETS)) {
    // If subject is an AYT subject, check if it fits the branch
    if (canonical.includes('(AYT)') || canonical === 'Edebiyat' || canonical.includes('Tarih-') || canonical.includes('Coğrafya-') || canonical === 'Felsefe Grubu' || canonical === 'Din (Seçmeli)' || canonical === 'Yabancı Dil') {
       if (studentBranch === 'SAYISAL') {
          if (!['Matematik (AYT)', 'Fizik (AYT)', 'Kimya (AYT)', 'Biyoloji (AYT)'].includes(canonical)) continue;
       } else if (studentBranch === 'EŞİT AĞIRLIK') {
          if (!['Matematik (AYT)', 'Edebiyat', 'Tarih-1', 'Coğrafya-1'].includes(canonical)) continue;
       } else if (studentBranch === 'SÖZEL') {
          if (!['Edebiyat', 'Tarih-1', 'Coğrafya-1', 'Tarih-2', 'Coğrafya-2', 'Felsefe Grubu', 'Din (Seçmeli)'].includes(canonical)) continue;
       } else if (studentBranch === 'DİL') {
          if (canonical !== 'Yabancı Dil') continue;
       }
    }

    if (subjectTotals[canonical] && subjectTotals[canonical].count > 0) {
      const avgNet = subjectTotals[canonical].totalNet / subjectTotals[canonical].count;
      const successRate = Math.min(1, Math.max(0, avgNet / maxNet));
      // Base multiplier is 1. It goes up to 2.5 if success rate is 0.
      multipliers[canonical] = Number((1 + (1 - successRate) * 1.5).toFixed(2));
    } else {
      multipliers[canonical] = 1.0;
    }
  }

  return multipliers;
};

export const calculateDailyCompletionWithMultipliers = (dailyTasks: any[], multipliers: Record<string, number>): number => {
    if (!dailyTasks || dailyTasks.length === 0) return 0;
    
    let targetPoints = 0;
    let earnedPoints = 0;

    dailyTasks.forEach(task => {
        let taskWeight = TASK_WEIGHTS[task.type as keyof typeof TASK_WEIGHTS] || 1;
        
        const canonical = getCanonicalSubjectName(task.subject);
        const subjectMultiplier = multipliers[canonical] || 1.0; 
        const finalWeight = taskWeight * subjectMultiplier;
        
        if (!task.isExtra) {
            targetPoints += finalWeight;
        }
        
        if (task.type === 'Soru Çözümü' || task.type === 'Konu Çalışması' || task.type === 'YouTube Video') {
            const target = Number(task.targetCount) || 1;
            const completed = Number(task.completedCount) || (task.isDone ? target : 0);
            const ratio = completed / target;
            earnedPoints += (finalWeight * ratio);
        } else {
            if (task.isDone) earnedPoints += finalWeight;
        }
    });

    if (targetPoints === 0) {
        if (earnedPoints > 0) return 100;
        return 0;
    }
    return Math.round((earnedPoints / targetPoints) * 100);
};
