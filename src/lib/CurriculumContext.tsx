import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { studentDataService } from '../services/studentDataService';
import { CURRICULUM as DEFAULT_CURRICULUM } from '../constants/curriculum';
import { SUBTOPICS as DEFAULT_SUBTOPICS } from '../constants/subtopics';

interface CurriculumContextType {
  curriculum: Record<string, string[]>;
  subtopics: Record<string, string[]>;
  loading: boolean;
  refreshCurriculum: () => Promise<void>;
  saveSubject: (subject: string, topics: string[]) => Promise<void>;
  saveTopicSubtopics: (topic: string, subtopicsList: string[]) => Promise<void>;
  saveAllSubtopics: (newSubtopics: Record<string, string[]>) => Promise<void>;
  deleteSubject: (subject: string) => Promise<void>;
  resetToDefaults: () => Promise<void>;
}

const CurriculumContext = createContext<CurriculumContextType>({
  curriculum: DEFAULT_CURRICULUM,
  subtopics: DEFAULT_SUBTOPICS,
  loading: true,
  refreshCurriculum: async () => {},
  saveSubject: async () => {},
  saveTopicSubtopics: async () => {},
  saveAllSubtopics: async () => {},
  deleteSubject: async () => {},
  resetToDefaults: async () => {}
});

export const useCurriculum = () => useContext(CurriculumContext);

export function CurriculumProvider({ children }: { children: ReactNode }) {
  const [curriculum, setCurriculum] = useState<Record<string, string[]>>(DEFAULT_CURRICULUM);
  const [subtopics, setSubtopics] = useState<Record<string, string[]>>(DEFAULT_SUBTOPICS);
  const [loading, setLoading] = useState(true);

  const fetchCurriculum = async () => {
    setLoading(true);
    const dbData = await studentDataService.getCurriculum();
    
    if (dbData) {
      const mergedCurriculum = dbData.subjects && Object.keys(dbData.subjects).length > 0
        ? { ...DEFAULT_CURRICULUM, ...dbData.subjects }
        : DEFAULT_CURRICULUM;
      
      const mergedSubtopics = dbData.subtopics && Object.keys(dbData.subtopics).length > 0
        ? { ...DEFAULT_SUBTOPICS, ...dbData.subtopics }
        : DEFAULT_SUBTOPICS;

      setCurriculum(mergedCurriculum);
      setSubtopics(mergedSubtopics);
    } else {
      setCurriculum(DEFAULT_CURRICULUM);
      setSubtopics(DEFAULT_SUBTOPICS);
      // Seed db with defaults if authenticated
      try {
        const { auth } = await import('../lib/firebase');
        if (auth.currentUser) {
          const { doc, setDoc, serverTimestamp } = await import('firebase/firestore');
          const { db } = await import('../lib/firebase');
          await setDoc(
            doc(db, 'settings', 'curriculum'), 
            { 
              subjects: DEFAULT_CURRICULUM, 
              subtopics: DEFAULT_SUBTOPICS,
              updatedAt: serverTimestamp() 
            }, 
            { merge: true }
          );
        }
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

  const saveSubject = async (subject: string, topics: string[]) => {
    await studentDataService.saveCurriculumSubject(subject, topics);
    setCurriculum(prev => ({ ...prev, [subject]: topics }));
  };

  const saveTopicSubtopics = async (topic: string, subtopicsList: string[]) => {
    await studentDataService.saveCurriculumSubtopics(topic, subtopicsList);
    setSubtopics(prev => ({ ...prev, [topic]: subtopicsList }));
  };

  const saveAllSubtopics = async (newSubtopics: Record<string, string[]>) => {
    await studentDataService.saveAllSubtopics(newSubtopics);
    setSubtopics(newSubtopics);
  };

  const deleteSubject = async (subject: string) => {
    await studentDataService.deleteCurriculumSubject(subject);
    setCurriculum(prev => {
      const next = { ...prev };
      delete next[subject];
      return next;
    });
  };

  const resetToDefaults = async () => {
    await studentDataService.resetCurriculumToDefaults(DEFAULT_CURRICULUM, DEFAULT_SUBTOPICS);
    setCurriculum(DEFAULT_CURRICULUM);
    setSubtopics(DEFAULT_SUBTOPICS);
  };

  return (
    <CurriculumContext.Provider value={{ 
      curriculum, 
      subtopics, 
      loading, 
      refreshCurriculum: fetchCurriculum,
      saveSubject,
      saveTopicSubtopics,
      saveAllSubtopics,
      deleteSubject,
      resetToDefaults
    }}>
      {children}
    </CurriculumContext.Provider>
  );
}
