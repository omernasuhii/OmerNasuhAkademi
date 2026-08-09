import { doc, setDoc } from 'firebase/firestore';
import { db, auth } from '../lib/firebase';

export const ALL_TOUR_KEYS = [
  'coach_dashboard',
  'coach_students',
  'student_summary',
  'student_program',
  'student_exams',
  'student_exam_results',
  'student_deep_analysis',
  'student_ai_chats',
  'student_profile',
  'coach_personality',
  'student_goals',
  'student_wallet',
  'coach_assistant',
  'coach_appointments',
  'coach_overall_assessment',
  'coach_profile',
  'coach_wallet',
  'student_data_entry',
  'student_appointments'
];

export const tourService = {
  isMobileScreen(): boolean {
    if (typeof window === 'undefined') return false;
    return window.innerWidth < 768;
  },

  isTourCompleted(tourKey: string, userData?: any): boolean {
    if (!tourKey) return false;

    // Check Firestore user data first
    if (userData?.completedTours?.[tourKey] === true) {
      try {
        localStorage.setItem(`tour_completed_${tourKey}`, 'true');
      } catch (e) {}
      return true;
    }

    // Fallback to localStorage
    try {
      if (localStorage.getItem(`tour_completed_${tourKey}`) === 'true') {
        return true;
      }
    } catch (e) {}

    return false;
  },

  shouldAutoStartTour(tourKey: string, userData?: any, locationStateStartTour?: boolean): boolean {
    // 1. Mobile screen constraint: Never auto-start tour on small screens (phones, <768px)
    if (this.isMobileScreen()) {
      return false;
    }

    // 2. If continuing an active tour flow via state transition
    if (locationStateStartTour) {
      return true;
    }

    // 3. Otherwise, if tour is already completed in Firestore or localStorage, do not auto-start
    if (this.isTourCompleted(tourKey, userData)) {
      return false;
    }

    return true;
  },

  async markTourCompleted(tourKey: string, userId?: string): Promise<void> {
    if (!tourKey) return;

    // Save to localStorage immediately
    try {
      localStorage.setItem(`tour_completed_${tourKey}`, 'true');
    } catch (e) {}

    const targetUid = userId || auth.currentUser?.uid;
    if (!targetUid) return;

    // Save to Firestore users document
    try {
      await setDoc(doc(db, 'users', targetUid), {
        completedTours: {
          [tourKey]: true
        }
      }, { merge: true });
    } catch (err) {
      console.error(`Error marking tour ${tourKey} completed in Firestore:`, err);
    }
  },

  async resetAllTours(userId?: string): Promise<void> {
    // Clear localStorage keys
    ALL_TOUR_KEYS.forEach(key => {
      try {
        localStorage.removeItem(`tour_completed_${key}`);
      } catch (e) {}
    });

    const targetUid = userId || auth.currentUser?.uid;
    if (!targetUid) return;

    // Reset completedTours in Firestore
    try {
      const resetMap: Record<string, boolean> = {};
      ALL_TOUR_KEYS.forEach(key => {
        resetMap[key] = false;
      });
      await setDoc(doc(db, 'users', targetUid), {
        completedTours: resetMap
      }, { merge: true });
    } catch (err) {
      console.error('Error resetting completed tours in Firestore:', err);
    }
  }
};
