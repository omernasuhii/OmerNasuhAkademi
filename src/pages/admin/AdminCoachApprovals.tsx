import React, { useEffect, useState } from "react";
import {
  collection,
  query,
  where,
  getDocs,
  doc,
  updateDoc,
} from "firebase/firestore";
import { db } from "../../lib/firebase";
import { referralService } from "../../services/referralService";
import { UserCheck, X } from "lucide-react";

export default function AdminCoachApprovals() {
  const [coaches, setCoaches] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchPendingCoaches();
  }, []);

  const fetchPendingCoaches = async () => {
    try {
      const q = query(
        collection(db, "users"),
        where("role", "==", "coach"),
        where("approved", "==", false),
      );
      const snap = await getDocs(q);
      const pendingCoaches = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
      setCoaches(pendingCoaches);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (id: string) => {
    try {
      await updateDoc(doc(db, "users", id), { approved: true });
      await referralService.grantCoachWelcomeGift(id, 1500);
      setCoaches((prev) => prev.filter((c) => c.id !== id));
      alert("Koç başarıyla onaylandı ve 1.500 TL hoş geldin bakiyesi kontrol edildi.");
    } catch (err) {
      console.error(err);
      alert("Onaylama sırasında bir hata oluştu.");
    }
  };

  const handleReject = async (id: string) => {
    if (
      !window.confirm(
        "Bu başvuruyu reddetmek istediğinize emin misiniz? (Bu işlem kullanıcı hesabını silmez ancak red olarak işaretlenebilir; şu an için sadece listeden kaldıracaktır)",
      )
    ) {
      return;
    }
    try {
      await updateDoc(doc(db, "users", id), { approved: "rejected" });
      setCoaches((prev) => prev.filter((c) => c.id !== id));
      alert("Başvuru reddedildi.");
    } catch (err) {
      console.error(err);
    }
  };

  if (loading) {
    return (
      <div className="flex-1 flex justify-center items-center h-64">
        <div className="w-8 h-8 border-4 border-indigo-500/20 border-t-indigo-500 rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-white mb-2 tracking-tight">
          Koç Onayları
        </h1>
        <p className="text-slate-400">
          Onay bekleyen koç başvurularını yönetin.
        </p>
      </div>

      <div className="bg-slate-900/60 backdrop-blur-xl border border-white/10 rounded-3xl overflow-hidden shadow-2xl">
        <div className="p-6">
          <div className="flex items-center gap-4 border-b border-white/5 pb-4 mb-4">
            <div className="w-8 h-8 rounded-xl bg-indigo-500/20 flex items-center justify-center">
              <UserCheck className="w-4 h-4 text-indigo-400" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white">
                Bekleyen Başvurular
              </h2>
              <p className="text-sm text-slate-400">
                {coaches.length} başvuru bekliyor
              </p>
            </div>
          </div>

          {coaches.length === 0 ? (
            <div className="text-center py-12">
              <div className="w-16 h-16 bg-white/5 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <UserCheck className="w-8 h-8 text-slate-500" />
              </div>
              <h3 className="text-white font-bold text-lg mb-1">
                Başvuru Bulunmuyor
              </h3>
              <p className="text-slate-400">
                Şu anda onay bekleyen yeni koç başvurusu bulunmamaktadır.
              </p>
            </div>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {coaches.map((coach) => (
                <div
                  key={coach.id}
                  className="bg-slate-950/50 rounded-2xl p-5 border border-white/5 hover:bg-white/[0.02] transition-colors group relative"
                >
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <h3 className="text-lg font-bold text-white mb-1">
                        {coach.firstName} {coach.lastName}
                      </h3>
                      <p className="text-sm text-slate-400">{coach.email}</p>
                      <p className="text-sm text-slate-400">{coach.phone}</p>
                    </div>
                  </div>

                  <div className="flex gap-2 mt-4 pt-4 border-t border-white/5">
                    <button
                      onClick={() => handleApprove(coach.id)}
                      className="flex-1 bg-indigo-500/10 text-indigo-400 hover:bg-indigo-500 hover:text-white px-4 py-2 rounded-xl text-sm justify-center items-center transition-colors font-semibold"
                    >
                      Onayla
                    </button>
                    <button
                      onClick={() => handleReject(coach.id)}
                      className="bg-red-500/10 text-red-400 hover:bg-red-500 hover:text-white px-4 py-2 rounded-xl text-sm items-center transition-colors font-semibold"
                      title="Reddet"
                    >
                      <X className="w-4 h-4 mx-auto" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
