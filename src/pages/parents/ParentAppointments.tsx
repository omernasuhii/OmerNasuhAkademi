import React, { useState } from "react";
import { useAuth } from "../../lib/AuthContext";
import { useStudent } from "../../lib/StudentContext";
import AppointmentList from "../../components/appointments/AppointmentList";
import BookingModal from "../../components/appointments/BookingModal";
import { Booking } from "../../services/appointmentService";
import { Calendar, User, BookOpen, Plus } from "lucide-react";
import { motion } from "framer-motion";

export default function ParentAppointments() {
  const { userData } = useAuth();
  const { selectedStudent } = useStudent();
  const [activeTab, setActiveTab] = useState<"parent" | "student">("parent");
  const [isBookingOpen, setIsBookingOpen] = useState(false);
  const [rescheduleAppointment, setRescheduleAppointment] = useState<
    Booking | undefined
  >(undefined);

  const handleOpenBooking = () => {
    setRescheduleAppointment(undefined);
    setIsBookingOpen(true);
  };

  const handleReschedule = (app: Booking) => {
    setRescheduleAppointment(app);
    setIsBookingOpen(true);
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-black text-white tracking-tight uppercase">
            Randevular
          </h2>
          <p className="text-slate-500 text-sm mt-1 font-medium italic">
            Görüşme ve ders takvimini takip edin.
          </p>
        </div>
        <button
          onClick={handleOpenBooking}
          className="bg-blue-600 hover:bg-blue-500 text-white font-bold py-3 px-6 rounded-2xl transition-all flex items-center justify-center gap-2 shadow-lg shadow-blue-600/20 group"
        >
          <Plus
            size={20}
            className="group-hover:rotate-90 transition-transform duration-300"
          />
          Yeni Randevu
        </button>
      </div>

      <div className="bg-slate-900/50 p-1.5 rounded-2xl flex flex-wrap gap-2 w-fit border border-white/5">
        <button
          onClick={() => setActiveTab("parent")}
          className={`flex-1 min-w-[150px] flex items-center justify-center gap-2 py-3 px-6 rounded-xl font-bold text-sm transition-all relative overflow-hidden ${
            activeTab === "parent"
              ? "text-white"
              : "text-slate-500 hover:text-slate-300 hover:bg-white/5"
          }`}
        >
          {activeTab === "parent" && (
            <motion.div
              layoutId="parentTab"
              className="absolute inset-0 bg-blue-600 rounded-xl"
            />
          )}
          <User size={16} className="relative z-10" />
          <span className="relative z-10">Benim Randevularım</span>
        </button>

        <button
          onClick={() => setActiveTab("student")}
          className={`flex-1 min-w-[150px] flex items-center justify-center gap-2 py-3 px-6 rounded-xl font-bold text-sm transition-all relative overflow-hidden ${
            activeTab === "student"
              ? "text-white"
              : "text-slate-500 hover:text-slate-300 hover:bg-white/5"
          }`}
        >
          {activeTab === "student" && (
            <motion.div
              layoutId="parentTab"
              className="absolute inset-0 bg-emerald-600 rounded-xl"
            />
          )}
          <BookOpen size={16} className="relative z-10" />
          <span className="relative z-10">Öğrenci Randevuları</span>
        </button>
      </div>

      <div className="bg-slate-900/40 border border-white/5 rounded-[32px] p-6 lg:p-8">
        {activeTab === "parent" ? (
          <div>
            <h3 className="text-lg font-bold text-white mb-6 flex items-center gap-2">
              <User size={20} className="text-blue-500" />
              Sizin Randevularınız
            </h3>
            <AppointmentList
              role="student"
              targetUserId={selectedStudent?.uid}
              filterRequesterRole="parent"
              onReschedule={handleReschedule}
            />
          </div>
        ) : (
          <div>
            <h3 className="text-lg font-bold text-white mb-6 flex items-center gap-2">
              <BookOpen size={20} className="text-emerald-500" />
              Öğrencinin Randevuları ({userData?.studentName || "Öğrenci"})
            </h3>
            {selectedStudent?.uid ? (
              <div className="space-y-8">
                <div>
                  <h4 className="text-sm font-black text-slate-500 uppercase tracking-widest mb-4">
                    Gelecek Randevular
                  </h4>
                  <AppointmentList
                    role="student"
                    targetUserId={selectedStudent.uid}
                    filterRequesterRole="student"
                    statuses={["pending", "confirmed"]}
                    readOnly={true}
                  />
                </div>

                <div>
                  <h4 className="text-sm font-black text-slate-500 uppercase tracking-widest mb-4">
                    Geçmiş Randevular
                  </h4>
                  <AppointmentList
                    role="student"
                    targetUserId={selectedStudent.uid}
                    filterRequesterRole="student"
                    statuses={["completed", "missed", "cancelled"]}
                    readOnly={true}
                  />
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <div className="bg-amber-500/10 p-4 rounded-full mb-4">
                  <Calendar className="text-amber-500" size={32} />
                </div>
                <p className="text-slate-400 font-medium max-w-md">
                  Öğrenci hesabı ile henüz bağlantı kurulamadı. Lütfen destek
                  ekibi ile iletişime geçin.
                </p>
              </div>
            )}
          </div>
        )}
      </div>

      <BookingModal
        isOpen={isBookingOpen}
        onClose={() => setIsBookingOpen(false)}
        initialBooking={rescheduleAppointment}
      />
    </div>
  );
}
