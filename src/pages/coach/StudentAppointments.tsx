import React from 'react';
import { useStudent } from '../../lib/StudentContext';
import AppointmentList from '../../components/appointments/AppointmentList';
import { Calendar } from 'lucide-react';

export default function StudentAppointments() {
  const { selectedStudent } = useStudent();

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-3xl font-bold italic text-white uppercase tracking-tight">
             RANDEVULAR
          </h1>
          <p className="text-slate-500 mt-1">{selectedStudent?.displayName} ile olan geçmiş ve gelecek randevularınız.</p>
        </div>
      </div>

      <div className="bg-slate-900/40 border border-white/5 rounded-3xl p-8">
        <AppointmentList studentIds={[selectedStudent?.uid, selectedStudent?.parentUid].filter(Boolean) as string[]} role="coach" />
      </div>
    </div>
  );
}
