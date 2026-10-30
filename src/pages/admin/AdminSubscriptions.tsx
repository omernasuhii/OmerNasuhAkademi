import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { CreditCard, CheckCircle, Clock, Trash2, ArrowRight } from 'lucide-react';
import { studentDataService } from '../../services/studentDataService';
import { appointmentService } from '../../services/appointmentService';
import { isSubscriptionActive, filterAndSyncActiveSubscriptions } from '../../services/subscriptionService';

export default function AdminSubscriptions() {
  const [activeTab, setActiveTab] = useState<'current' | 'history'>('current');
  const [students, setStudents] = useState<any[]>([]);
  const [history, setHistory] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const fetchedStudents = await appointmentService.getAllStudents();
      setStudents(fetchedStudents);
      
      const allHistory: any[] = [];
      fetchedStudents.forEach(student => {
        if (student.subscriptionHistory && Array.isArray(student.subscriptionHistory)) {
          allHistory.push(...student.subscriptionHistory);
        }
      });

      const sortedHistory = allHistory.sort((a, b) => 
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );
      setHistory(sortedHistory);
      
    } catch (error) {
      console.error("Error loading subscriptions", error);
    } finally {
      setLoading(false);
    }
  };

  const currentSubscriptions = filterAndSyncActiveSubscriptions(students);

  const getActionColor = (action: string) => {
    switch (action) {
      case 'trial_started': return 'bg-amber-500/10 text-amber-400 border-amber-500/20';
      case 'trial_ended': return 'bg-purple-500/10 text-purple-400 border-purple-500/20';
      case 'started': return 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20';
      case 'renewed': return 'bg-blue-500/10 text-blue-400 border-blue-500/20';
      case 'upgraded': return 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20';
      case 'expired': return 'bg-slate-500/10 text-slate-400 border-slate-500/20';
      case 'cancelled': return 'bg-red-500/10 text-red-400 border-red-500/20';
      default: return 'bg-white/10 text-white border-white/20';
    }
  };

  const getActionText = (action: string) => {
    switch (action) {
      case 'trial_started': return '7 Günlük Deneme Başladı';
      case 'trial_ended': return 'Deneme Tamamlandı';
      case 'started': return 'Başladı';
      case 'renewed': return 'Yenilendi';
      case 'upgraded': return 'Yükseltildi / Geçiş Yaptı';
      case 'expired': return 'Süresi Doldu';
      case 'cancelled': return 'İptal Edildi';
      default: return action;
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center py-20">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 pb-6 border-b border-white/5">
        <div>
          <h1 className="text-3xl md:text-5xl font-black tracking-tight text-white mb-2">
            Abonelikler
          </h1>
          <p className="text-slate-500 max-w-xl">
            Tüm öğrencilerin aktif aboneliklerini ve geçmiş abonelik hareketlerini (yenilemeler, yükseltmeler) takip edin.
          </p>
        </div>
      </div>

      <div className="flex bg-slate-900/50 p-1.5 rounded-2xl w-fit border border-white/5">
        <button
          onClick={() => setActiveTab('current')}
          className={`px-6 py-2.5 rounded-xl text-sm font-black uppercase tracking-widest transition-all ${
            activeTab === 'current' 
            ? 'bg-blue-600 text-white shadow-lg' 
            : 'text-slate-500 hover:text-white'
          }`}
        >
          Mevcut Abonelikler
        </button>
        <button
          onClick={() => setActiveTab('history')}
          className={`px-6 py-2.5 rounded-xl text-sm font-black uppercase tracking-widest transition-all ${
            activeTab === 'history' 
            ? 'bg-blue-600 text-white shadow-lg' 
            : 'text-slate-500 hover:text-white'
          }`}
        >
          Geçmiş İşlemler & Geçişler
        </button>
      </div>

      {activeTab === 'current' ? (
        currentSubscriptions.length === 0 ? (
          <div className="bg-slate-900/50 border border-white/5 rounded-[32px] p-12 text-center">
            <div className="w-20 h-20 bg-slate-800 rounded-full flex items-center justify-center mx-auto mb-6">
              <CreditCard className="text-slate-500" size={32} />
            </div>
            <h3 className="text-xl font-bold text-white mb-2">Aktif Abonelik Yok</h3>
            <p className="text-slate-500 mb-6 max-w-md mx-auto">
              Şu anda sistemde aktif aboneliği bulunan bir öğrenci bulunmuyor.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {currentSubscriptions.map(student => {
              const now = new Date();
              const endDate = new Date(student.subscriptionEndDate);
              const totalDays = 28; // Usually 28 (4 weeks)
              const remainingDays = Math.max(0, Math.ceil((endDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)));
              const progress = Math.max(0, Math.min(100, ((totalDays - remainingDays) / totalDays) * 100));

              return (
                <div key={student.uid} className="bg-slate-900/60 backdrop-blur-xl border border-white/5 rounded-[32px] p-6 hover:bg-white/[0.02] transition-colors relative group">
                  <div className="flex items-start justify-between mb-6">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-full bg-slate-800 flex items-center justify-center text-xl font-bold">
                        {student.firstName?.charAt(0) || 'U'}
                      </div>
                      <div>
                        <h3 className="text-lg font-bold text-white">{student.firstName} {student.lastName}</h3>
                        <p className="text-slate-500 text-sm">{student.email}</p>
                      </div>
                    </div>
                  </div>

                  <div className="bg-black/40 border border-white/5 rounded-2xl p-4 mb-4">
                    <div className="flex items-center justify-between mb-1">
                      <div className="text-xs font-black text-slate-500 uppercase tracking-widest">Paket</div>
                      {student.isTrial && (
                        <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-400 border border-amber-500/30">
                          7 Günlük Deneme
                        </span>
                      )}
                    </div>
                    <div className="text-xl font-bold text-blue-400">{student.subscriptionPlan}</div>
                  </div>

                  <div className="space-y-4">
                    <div className="flex justify-between items-center text-sm">
                      <span className="text-slate-400">Kalan Süre</span>
                      <span className="text-white font-bold">{remainingDays} Gün</span>
                    </div>
                    
                    <div className="w-full bg-slate-800/50 rounded-full h-2 overflow-hidden">
                      <div 
                        className="bg-blue-500 h-full rounded-full" 
                        style={{ width: `${progress}%` }}
                      />
                    </div>
                    
                    <div className="flex justify-between text-xs text-slate-500">
                      <span>Bitiş: {new Date(student.subscriptionEndDate).toLocaleDateString('tr-TR')}</span>
                      <span>Oto {student.autoRenew !== false ? 'Açık' : 'Kapalı'}</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )
      ) : (
        history.length === 0 ? (
          <div className="bg-slate-900/50 border border-white/5 rounded-[32px] p-12 text-center">
            <div className="w-20 h-20 bg-slate-800 rounded-full flex items-center justify-center mx-auto mb-6">
              <Clock className="text-slate-500" size={32} />
            </div>
            <h3 className="text-xl font-bold text-white mb-2">Geçmiş Kaydı Yok</h3>
            <p className="text-slate-500 mb-6 max-w-md mx-auto">
              Henüz sistemde kaydedilmiş bir abonelik hareketi bulunmuyor.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-white/5 text-slate-400 text-sm">
                  <th className="py-4 px-4 font-medium uppercase tracking-wider">Tarih</th>
                  <th className="py-4 px-4 font-medium uppercase tracking-wider">Öğrenci</th>
                  <th className="py-4 px-4 font-medium uppercase tracking-wider">İşlem</th>
                  <th className="py-4 px-4 font-medium uppercase tracking-wider">Paket Değişimi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {history.map((record) => (
                  <tr key={record.id} className="hover:bg-white/[0.02] transition-colors">
                    <td className="py-4 px-4 whitespace-nowrap">
                      <div className="text-slate-300">
                        {new Date(record.createdAt).toLocaleDateString('tr-TR')}
                      </div>
                      <div className="text-slate-500 text-xs">
                        {new Date(record.createdAt).toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' })}
                      </div>
                    </td>
                    <td className="py-4 px-4 text-white font-medium">
                      {record.studentName}
                    </td>
                    <td className="py-4 px-4">
                      <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-black uppercase tracking-widest border ${getActionColor(record.action)}`}>
                        {getActionText(record.action)}
                      </span>
                    </td>
                    <td className="py-4 px-4">
                      {record.action === 'upgraded' ? (
                        <div className="flex items-center gap-3">
                          <span className="text-slate-400 line-through">{record.oldPlan}</span>
                          <ArrowRight size={16} className="text-slate-600" />
                          <span className="text-yellow-400 font-bold">{record.newPlan}</span>
                        </div>
                      ) : (
                        <span className="text-blue-400 font-bold">{record.newPlan}</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )
      )}
    </div>
  );
}
