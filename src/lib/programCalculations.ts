import { studentDataService } from '../services/studentDataService';

export const safeGetTime = (dateVal: any) => {
  if (!dateVal) return 0;
  if (dateVal.toDate && typeof dateVal.toDate === 'function') {
    return dateVal.toDate().getTime();
  }
  const d = new Date(dateVal);
  return isNaN(d.getTime()) ? 0 : d.getTime();
};

export const TASK_WEIGHTS: Record<string, number> = {
  'Soru Çözümü': 100,
  'Konu Çalışması': 30,
  'YouTube Video': 30,
  'Deneme': 150,
};

export const SUBJECT_MAX_NETS: Record<string, number> = {
  // TYT
  'Türkçe': 40,
  'Matematik (TYT)': 30,
  'Geometri': 10,
  'Fizik (TYT)': 7,
  'Kimya (TYT)': 7,
  'Biyoloji (TYT)': 6,
  'Tarih': 5,
  'Coğrafya': 5,
  'Felsefe': 5,
  'Din Kültürü': 5,
  // AYT SAY
  'Matematik (AYT)': 30,
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
  'Matematik (TYT)': ['Matematik', 'TYT Matematik', 'Temel Matematik', 'Matematik (TYT)', 'Problem', 'TYT Problem'],
  'Geometri': ['Geometri', 'TYT Geometri', 'AYT Geometri', 'Geometri (TYT)', 'Geometri (AYT)'],
  'Türkçe': ['Türkçe', 'TYT Türkçe', 'Turkce', 'Paragraf', 'TYT Paragraf', 'Dilbilgisi', 'Dil Bilgisi'],
  'Tarih': ['Tarih', 'Tarih (TYT)', 'TYT Tarih'],
  'Coğrafya': ['Coğrafya', 'Coğrafya (TYT)', 'TYT Coğrafya', 'Cografya'],
  'Felsefe': ['Felsefe', 'Felsefe (TYT)', 'TYT Felsefe'],
  'Din Kültürü': ['Din', 'Din (TYT)', 'TYT Din', 'Din Kültürü ve Ahlak Bilgisi', 'Din Kültürü', 'Din Kulturu'],
  'Fizik (TYT)': ['Fizik', 'TYT Fizik'],
  'Kimya (TYT)': ['Kimya', 'TYT Kimya'],
  'Biyoloji (TYT)': ['Biyoloji', 'TYT Biyoloji'],
  'Edebiyat': ['Türk Dili ve Edebiyatı', 'AYT Edebiyat', 'Edebiyat (AYT)', 'Edebiyat'],
  'Matematik (AYT)': ['AYT Matematik'],
  'Fizik (AYT)': ['AYT Fizik'],
  'Kimya (AYT)': ['AYT Kimya'],
  'Biyoloji (AYT)': ['AYT Biyoloji'],
  'Tarih-1': ['AYT Tarih-1', 'Tarih-1 (AYT)', 'Tarih-1'],
  'Coğrafya-1': ['AYT Coğrafya-1', 'Coğrafya-1 (AYT)', 'Coğrafya-1', 'Cografya-1'],
  'Tarih-2': ['AYT Tarih-2', 'Tarih-2 (AYT)', 'Tarih-2'],
  'Coğrafya-2': ['AYT Coğrafya-2', 'Coğrafya-2 (AYT)', 'Coğrafya-2', 'Cografya-2'],
  'Felsefe Grubu': ['AYT Felsefe Grubu', 'Felsefe Grubu'],
  'Din (Seçmeli)': ['AYT Din (Seçmeli)', 'Din (Seçmeli)'],
  'Yabancı Dil': ['YDT', 'İngilizce', 'YDT İngilizce', 'Almanca', 'Fransızca', 'Arapça', 'Rusça', 'Yabancı Dil']
};

export const isGeneralExam = (exam: any): boolean => {
  if (!exam) return false;
  const examTypeUpper = String(exam.examType || '').toUpperCase().trim();
  const typeUpper = String(exam.type || '').toUpperCase().trim();
  const categoryUpper = String(exam.category || '').toUpperCase().trim();
  
  // Branş denemeleri kontrolü
  if (examTypeUpper === 'BRANŞ' || examTypeUpper === 'BRANS' || examTypeUpper === 'DERS') return false;
  if (typeUpper === 'BRANŞ' || typeUpper === 'BRANS' || typeUpper === 'DERS') return false;
  if (categoryUpper === 'BRANŞ' || categoryUpper === 'BRANS') return false;
  if (exam.isBranch === true || exam.isBranchExam === true) return false;

  const name = String(exam.examName || exam.title || '').toLowerCase();
  if (name.includes('branş deneme') || name.includes('brans deneme') || name.includes('branş denemesi') || name.includes('brans denemesi')) {
    return false;
  }
  return true;
};

export const getCanonicalSubjectName = (subject: string, branch?: string): string => {
  if (!subject || typeof subject !== 'string') return '';
  const cleanBranch = (branch || '').trim().toUpperCase();
  const subTrim = subject.trim();

  // If AYT branch is specified
  if (cleanBranch === 'AYT' || subTrim.toUpperCase().includes('AYT')) {
    if (subTrim === 'Matematik' || subTrim === 'AYT Matematik' || subTrim === 'Matematik (AYT)') return 'Matematik (AYT)';
    if (subTrim === 'Fizik' || subTrim === 'AYT Fizik' || subTrim === 'Fizik (AYT)') return 'Fizik (AYT)';
    if (subTrim === 'Kimya' || subTrim === 'AYT Kimya' || subTrim === 'Kimya (AYT)') return 'Kimya (AYT)';
    if (subTrim === 'Biyoloji' || subTrim === 'AYT Biyoloji' || subTrim === 'Biyoloji (AYT)') return 'Biyoloji (AYT)';
    if (subTrim === 'Edebiyat' || subTrim === 'AYT Edebiyat' || subTrim === 'Türk Dili ve Edebiyatı') return 'Edebiyat';
    if (subTrim === 'Tarih' || subTrim === 'AYT Tarih' || subTrim === 'Tarih-1') return 'Tarih-1';
    if (subTrim === 'Coğrafya' || subTrim === 'AYT Coğrafya' || subTrim === 'Coğrafya-1') return 'Coğrafya-1';
    if (subTrim === 'Felsefe' || subTrim === 'AYT Felsefe' || subTrim === 'Felsefe Grubu') return 'Felsefe Grubu';
    if (subTrim === 'Din Kültürü' || subTrim === 'Din' || subTrim === 'Din (Seçmeli)') return 'Din (Seçmeli)';
    if (subTrim === 'Geometri' || subTrim === 'AYT Geometri') return 'Geometri';
  }

  for (const [canonical, aliases] of Object.entries(SUBJECT_ALIASES)) {
    if (canonical === subTrim || (Array.isArray(aliases) && aliases.includes(subTrim))) {
      return canonical;
    }
  }
  return subTrim;
};

export const getTaskSubjectMultiplier = (
  multipliers: Record<string, number> | undefined,
  subject?: string,
  branch?: string,
  type?: string
): number => {
  if (!multipliers || Object.keys(multipliers).length === 0) return 1.0;
  if (!subject) return 1.0;

  // 1. Direct match
  if (typeof multipliers[subject] === 'number') {
    return multipliers[subject];
  }

  // 2. Canonical name lookup (branch-aware)
  const canonical = getCanonicalSubjectName(subject, branch);
  if (canonical && typeof multipliers[canonical] === 'number') {
    return multipliers[canonical];
  }

  // 3. Fallbacks based on branch
  const cleanSub = subject.trim().toLowerCase();
  const cleanBranch = (branch || '').trim().toUpperCase();
  const isAYT = cleanBranch === 'AYT' || cleanSub.includes('ayt');

  if (isAYT) {
    if ((cleanSub.includes('matematik') || cleanSub.includes('mat')) && typeof multipliers['Matematik (AYT)'] === 'number') {
      return multipliers['Matematik (AYT)'];
    }
    if (cleanSub.includes('fizik') && typeof multipliers['Fizik (AYT)'] === 'number') return multipliers['Fizik (AYT)'];
    if (cleanSub.includes('kimya') && typeof multipliers['Kimya (AYT)'] === 'number') return multipliers['Kimya (AYT)'];
    if (cleanSub.includes('biyoloji') && typeof multipliers['Biyoloji (AYT)'] === 'number') return multipliers['Biyoloji (AYT)'];
    if (cleanSub.includes('geometri') && typeof multipliers['Geometri'] === 'number') return multipliers['Geometri'];
    if (cleanSub.includes('edebiyat') && typeof multipliers['Edebiyat'] === 'number') return multipliers['Edebiyat'];
    if (cleanSub.includes('tarih') && typeof multipliers['Tarih-1'] === 'number') return multipliers['Tarih-1'];
    if ((cleanSub.includes('coğrafya') || cleanSub.includes('cografya')) && typeof multipliers['Coğrafya-1'] === 'number') return multipliers['Coğrafya-1'];
    if (cleanSub.includes('felsefe') && typeof multipliers['Felsefe Grubu'] === 'number') return multipliers['Felsefe Grubu'];
    if (cleanSub.includes('din') && typeof multipliers['Din (Seçmeli)'] === 'number') return multipliers['Din (Seçmeli)'];
  }

  // TYT or general subject fallbacks
  if (cleanSub.includes('matematik') || cleanSub.includes('problem')) {
    if (typeof multipliers['Matematik (TYT)'] === 'number') return multipliers['Matematik (TYT)'];
  }
  if (cleanSub.includes('türkçe') || cleanSub.includes('turkce') || cleanSub.includes('paragraf')) {
    if (typeof multipliers['Türkçe'] === 'number') return multipliers['Türkçe'];
  }
  if (cleanSub.includes('geometri') || cleanSub.includes('geo')) {
    if (typeof multipliers['Geometri'] === 'number') return multipliers['Geometri'];
  }
  if (cleanSub.includes('fizik')) {
    if (typeof multipliers['Fizik (TYT)'] === 'number') return multipliers['Fizik (TYT)'];
  }
  if (cleanSub.includes('kimya')) {
    if (typeof multipliers['Kimya (TYT)'] === 'number') return multipliers['Kimya (TYT)'];
  }
  if (cleanSub.includes('biyoloji')) {
    if (typeof multipliers['Biyoloji (TYT)'] === 'number') return multipliers['Biyoloji (TYT)'];
  }
  if (cleanSub.includes('tarih')) {
    if (typeof multipliers['Tarih'] === 'number') return multipliers['Tarih'];
  }
  if (cleanSub.includes('coğrafya') || cleanSub.includes('cografya')) {
    if (typeof multipliers['Coğrafya'] === 'number') return multipliers['Coğrafya'];
  }
  if (cleanSub.includes('felsefe')) {
    if (typeof multipliers['Felsefe'] === 'number') return multipliers['Felsefe'];
  }
  if (cleanSub.includes('din')) {
    if (typeof multipliers['Din Kültürü'] === 'number') return multipliers['Din Kültürü'];
  }

  // 4. Fuzzy search across multipliers keys
  for (const [key, val] of Object.entries(multipliers)) {
    const kLower = key.toLowerCase();
    if (kLower.includes(cleanSub) || cleanSub.includes(kLower)) {
      return val;
    }
  }

  return 1.0;
};

export const calculateSubjectMultipliers = (exams: any[], studentBranch?: string) => {
  if (!exams || !Array.isArray(exams) || exams.length === 0) return {};

  const subjectTotals: Record<string, { totalNet: number, count: number }> = {};
  
  // Sadece son 4 GENEL denemeyi al (branş denemeleri hariç tutulur, tarihe göre azalan sırayla)
  const generalExams = exams.filter(e => e != null && isGeneralExam(e));

  const recentExams = [...generalExams]
    .sort((a, b) => safeGetTime(b?.date || b?.aytDate) - safeGetTime(a?.date || a?.aytDate))
    .slice(0, 4);
  
  recentExams.forEach(exam => {
    if (!exam) return;
    const scores = exam.scores || {};
    if (typeof scores !== 'object' || scores === null) return;
    const examType = String(exam.examType || '').toUpperCase();
    const isAytExam = examType === 'AYT';
    const isTytExam = examType === 'TYT' || examType === 'YKS' || !isAytExam;

    // Bu deneme türünde öğrencinin sorumlu olduğu standart ders listesi
    const expectedSubjects: string[] = [];
    if (isTytExam) {
      expectedSubjects.push(
        'Türkçe',
        'Tarih',
        'Coğrafya',
        'Felsefe',
        'Din Kültürü',
        'Matematik (TYT)',
        'Geometri',
        'Fizik (TYT)',
        'Kimya (TYT)',
        'Biyoloji (TYT)'
      );
    }
    if (isAytExam) {
      if (studentBranch === 'SAYISAL') {
        expectedSubjects.push('Matematik (AYT)', 'Geometri', 'Fizik (AYT)', 'Kimya (AYT)', 'Biyoloji (AYT)');
      } else if (studentBranch === 'EŞİT AĞIRLIK') {
        expectedSubjects.push('Matematik (AYT)', 'Geometri', 'Edebiyat', 'Tarih-1', 'Coğrafya-1');
      } else if (studentBranch === 'SÖZEL') {
        expectedSubjects.push('Edebiyat', 'Tarih-1', 'Coğrafya-1', 'Tarih-2', 'Coğrafya-2', 'Felsefe Grubu', 'Din (Seçmeli)');
      } else if (studentBranch === 'DİL') {
        expectedSubjects.push('Yabancı Dil');
      } else {
        expectedSubjects.push('Matematik (AYT)', 'Geometri', 'Fizik (AYT)', 'Kimya (AYT)', 'Biyoloji (AYT)', 'Edebiyat', 'Tarih-1', 'Coğrafya-1');
      }
    }
    if (examType === 'YDT') {
      expectedSubjects.push('Yabancı Dil');
    }

    const examSubjectNets: Record<string, number> = {};
    const evaluatedInThisExam = new Set<string>();

    Object.entries(scores).forEach(([subj, scoreObj]: [string, any]) => {
      const net = parseFloat(scoreObj?.n ?? scoreObj ?? 0);
      if (isNaN(net)) return;
      const validNet = Math.max(0, net);

      let canonical = '';
      if (subj === 'Geometri' || subj === 'TYT Geometri' || subj === 'AYT Geometri') {
        canonical = 'Geometri';
      } else if (subj === 'Din' || subj === 'TYT Din' || subj === 'Din Kültürü' || subj === 'Din Kültürü ve Ahlak Bilgisi') {
        canonical = 'Din Kültürü';
      } else if (isAytExam) {
        if (subj === 'Matematik' || subj === 'AYT Matematik') {
          canonical = 'Matematik (AYT)';
        } else if (subj === 'Fizik' || subj === 'AYT Fizik') {
          canonical = 'Fizik (AYT)';
        } else if (subj === 'Kimya' || subj === 'AYT Kimya') {
          canonical = 'Kimya (AYT)';
        } else if (subj === 'Biyoloji' || subj === 'AYT Biyoloji') {
          canonical = 'Biyoloji (AYT)';
        } else {
          canonical = getCanonicalSubjectName(subj);
        }
      } else {
        if (subj === 'Matematik' || subj === 'TYT Matematik' || subj === 'Temel Matematik') {
          canonical = 'Matematik (TYT)';
        } else if (subj === 'Fizik' || subj === 'TYT Fizik') {
          canonical = 'Fizik (TYT)';
        } else if (subj === 'Kimya' || subj === 'TYT Kimya') {
          canonical = 'Kimya (TYT)';
        } else if (subj === 'Biyoloji' || subj === 'TYT Biyoloji') {
          canonical = 'Biyoloji (TYT)';
        } else {
          canonical = getCanonicalSubjectName(subj);
        }
      }

      if (!canonical) return;

      examSubjectNets[canonical] = (examSubjectNets[canonical] || 0) + validNet;
      evaluatedInThisExam.add(canonical);
    });

    // Öğrenci genel denemeye girmişse ancak bir dersi tamamen boş bıraktıysa (örneğin Din veya Geometri),
    // o dersteki neti 0 olarak hesaba katılır (böylece başarı oranı düşer ve çarpanı artar).
    expectedSubjects.forEach(expCanonical => {
      if (!evaluatedInThisExam.has(expCanonical)) {
        examSubjectNets[expCanonical] = 0;
      }
    });

    Object.entries(examSubjectNets).forEach(([canonical, netSum]) => {
      if (!subjectTotals[canonical]) {
        subjectTotals[canonical] = { totalNet: 0, count: 0 };
      }
      subjectTotals[canonical].totalNet += netSum;
      subjectTotals[canonical].count += 1;
    });
  });

  const multipliers: Record<string, number> = {};

  for (const [canonical, maxNet] of Object.entries(SUBJECT_MAX_NETS)) {
    // AYT dersleri için öğrencinin alanına uygunluk kontrolü
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
      // Taban çarpan 1.00'dır. Başarı oranı düştükçe (örneğin tamamen boş bırakıldığında) 2.50'ye kadar yükselir.
      multipliers[canonical] = Number((1 + (1 - successRate) * 1.5).toFixed(2));
    } else {
      multipliers[canonical] = 1.0;
    }
  }

  return multipliers;
};

export const calculateDailyCompletionWithMultipliers = (dailyTasks: any[], multipliers?: Record<string, number>): number => {
    if (!dailyTasks || !Array.isArray(dailyTasks) || dailyTasks.length === 0) return 0;
    const safeMultipliers = multipliers || {};
    
    let targetPoints = 0;
    let earnedPoints = 0;

    dailyTasks.forEach(task => {
        if (!task) return;
        let taskWeight = TASK_WEIGHTS[task.type as keyof typeof TASK_WEIGHTS] || 30;
        
        const subjectMultiplier = getTaskSubjectMultiplier(safeMultipliers, task.subject, task.branch, task.type); 
        const finalWeight = taskWeight * subjectMultiplier;
        
        if (!task.isExtra) {
            targetPoints += finalWeight;
        }
        
        if (task.type === 'Soru Çözümü') {
            const target = Number(task.targetCount) || 1;
            const completed = Number(task.completedCount) || (task.isDone ? target : 0);
            const ratio = Math.min(1, Math.max(0, completed / target));
            earnedPoints += (finalWeight * ratio);
        } else if (task.type === 'YouTube Video') {
            // YouTube videoları görev başına puanlandırılır: Her video 1 görevdir (süreler hedef sayısı değildir)
            const isCompleted = task.isDone || (Number(task.completedCount) >= 1);
            if (isCompleted) {
                earnedPoints += finalWeight;
            }
        } else if (task.type === 'Konu Çalışması') {
            const target = Number(task.targetCount) || 0;
            if (target > 0) {
                const completed = Number(task.completedCount) || (task.isDone ? target : 0);
                const ratio = Math.min(1, Math.max(0, completed / target));
                earnedPoints += (finalWeight * ratio);
            } else {
                if (task.isDone) earnedPoints += finalWeight;
            }
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
