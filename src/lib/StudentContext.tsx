import React, { createContext, useContext, useState, useEffect } from 'react';

interface Student {
  uid: string;
  displayName?: string;
  firstName?: string;
  lastName?: string;
  email?: string;
  photoURL?: string;
  grade?: string;
  branch?: string;
  targetDepartment?: string;
  targetTyt?: number;
  targetAyt?: number;
  walletBalance?: number;
  subscriptionPlan?: string;
  lastSubscriptionUpdate?: any;
  createdAt?: any;
}

interface StudentContextType {
  selectedStudent: Student | null;
  setSelectedStudent: (student: Student | null) => void;
}

const StudentContext = createContext<StudentContextType | undefined>(undefined);

export function StudentProvider({ children }: { children: React.ReactNode }) {
  const [selectedStudent, setSelectedStudentState] = useState<Student | null>(() => {
    const saved = localStorage.getItem('coach_selected_student');
    return saved ? JSON.parse(saved) : null;
  });

  const setSelectedStudent = (student: Student | null) => {
    setSelectedStudentState(student);
    if (student) {
      localStorage.setItem('coach_selected_student', JSON.stringify(student));
    } else {
      localStorage.removeItem('coach_selected_student');
    }
  };

  return (
    <StudentContext.Provider value={{ selectedStudent, setSelectedStudent }}>
      {children}
    </StudentContext.Provider>
  );
}

export function useStudent() {
  const context = useContext(StudentContext);
  if (context === undefined) {
    throw new Error('useStudent must be used within a StudentProvider');
  }
  return context;
}
