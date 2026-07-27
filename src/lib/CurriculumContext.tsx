import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { studentDataService } from '../services/studentDataService';
import { CURRICULUM as DEFAULT_CURRICULUM } from '../constants/curriculum';

interface CurriculumContextType {
  curriculum: Record<string, string[]>;
  loading: boolean;
  refreshCurriculum: () => Promise<void>;
}

const CurriculumContext = createContext<CurriculumContextType>({
  curriculum: DEFAULT_CURRICULUM,
  loading: true,
  refreshCurriculum: async () => {}
});

export const useCurriculum = () => useContext(CurriculumContext);

export function CurriculumProvider({ children }: { children: ReactNode }) {
  const [curriculum, setCurriculum] = useState<Record<string, string[]>>(DEFAULT_CURRICULUM);
  const [loading, setLoading] = useState(true);

  const fetchCurriculum = async () => {
    setLoading(true);
    const dbCurriculum = await studentDataService.getCurriculum();
    if (dbCurriculum && Object.keys(dbCurriculum).length > 0) {
      // Varsayılan müfredat ile veritabanındaki müfredatı birleştir (Eksik dersler otomatik gelsin)
      const mergedCurriculum = { ...DEFAULT_CURRICULUM, ...dbCurriculum };
      setCurriculum(mergedCurriculum);
    } else {
      setCurriculum(DEFAULT_CURRICULUM);
      // Seed db with DEFAULT_CURRICULUM
      try {
        const { doc, setDoc, serverTimestamp } = await import('firebase/firestore');
        const { db } = await import('../lib/firebase');
        await setDoc(doc(db, 'settings', 'curriculum'), { subjects: DEFAULT_CURRICULUM, updatedAt: serverTimestamp() }, { merge: true });
      } catch (e: any) {
        if (e.code !== 'permission-denied') {
          console.error('Failed to seed curriculum', e);
        }
      }
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchCurriculum();
  }, []);

  return (
    <CurriculumContext.Provider value={{ curriculum, loading, refreshCurriculum: fetchCurriculum }}>
      {children}
    </CurriculumContext.Provider>
  );
}
