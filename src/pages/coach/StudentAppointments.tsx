import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useStudent } from '../../lib/StudentContext';
import { useAuth } from '../../lib/AuthContext';
import { tourService } from '../../services/tourService';
import AppointmentList from '../../components/appointments/AppointmentList';
import { Calendar, Sparkles } from 'lucide-react';
import { OnboardingTour, TourStep } from '../../components/OnboardingTour';
import NoStudentSelected from '../../components/NoStudentSelected';
import { SAMPLE_DEMO_STUDENT } from './CoachStudents';

export default function StudentAppointments() {
  const { user, userData } = useAuth();
  const { selectedStudent, setSelectedStudent } = useStudent();
  const navigate = useNavigate();
  const location = useLocation();
  const [isTourOpen, setIsTourOpen] = useState(false);

  const activeStudent = selectedStudent || (location.state?.startTour || location.state?.isDemo ? SAMPLE_DEMO_STUDENT : null);

  useEffect(() => {
    if (tourService.shouldAutoStartTour('student_appointments', userData, location.state?.startTour)) {
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
    tourService.markTourCompleted('student_appointments', user?.uid);
  };

  const tourSteps: TourStep[] = [
    {
      targetId: 'tour-student-appointments-header',
      title: 'Öğrenci Randevuları',
      description: `${activeStudent?.displayName || 'Seçili öğrenci'} ile planlanmış birebir koçluk görüşmelerini, seans durumlarını ve randevu geçmişini buradan takip edebilirsiniz.`,
      position: 'bottom'
    },
    {
      targetId: 'tour-student-appointments-list',
      title: 'Görüşme ve Seans Geçmişi',
      description: 'Öğrenciye tanımlanmış onaylı, beklemede, katılım sağlanan veya iptal edilen koçluk seansları bu listede gösterilir.',
      position: 'top'
    }
  ];

  if (!activeStudent) {
    return <NoStudentSelected />;
  }

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <OnboardingTour
        steps={tourSteps}
        isOpen={isTourOpen}
        onClose={handleEndTour}
        onComplete={handleEndTour}
        onNextTour={() => {
          setIsTourOpen(false);
          tourService.markTourCompleted('student_appointments', user?.uid);
          navigate('/panel/koc/ogrenci/program', { state: { startTour: true, isDemo: true } });
        }}
        nextTourLabel="Haftalık Program Turu"
        tourKey="student_appointments"
      />

      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6" id="tour-student-appointments-header">
        <div>
          <h1 className="text-3xl font-bold italic text-white uppercase tracking-tight">
             RANDEVULAR
          </h1>
          <p className="text-slate-500 mt-1">{activeStudent?.displayName} ile olan geçmiş ve gelecek randevularınız.</p>
        </div>
      </div>

      <div className="bg-slate-900/40 border border-white/5 rounded-3xl p-8" id="tour-student-appointments-list">
        <AppointmentList 
          studentIds={[activeStudent?.uid, activeStudent?.parentUid].filter(Boolean) as string[]} 
          role="coach" 
          showSamples={isTourOpen || activeStudent?.isDemo}
        />
      </div>
    </div>
  );
}
