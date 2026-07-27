import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { Package, CheckCircle, Clock, Truck, XCircle, Edit2, Loader2, Save } from 'lucide-react';
import { storeService, Purchase } from '../../services/storeService';
import { appointmentService } from '../../services/appointmentService';

export default function AdminOrders() {
  const [orders, setOrders] = useState<Purchase[]>([]);
  const [students, setStudents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingOrder, setEditingOrder] = useState<string | null>(null);
  const [statusUpdates, setStatusUpdates] = useState<Record<string, string>>({});

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [fetchedOrders, fetchedStudents] = await Promise.all([
        storeService.getPurchases(),
        appointmentService.getAllStudents()
      ]);
      setOrders(fetchedOrders);
      setStudents(fetchedStudents);
    } catch (error) {
      console.error("Error loading orders:", error);
    } finally {
      setLoading(false);
    }
  };

  const getStudentName = (studentId: string) => {
    const student = students.find(s => s.uid === studentId);
    if (!student) return 'Bilinmiyor';
    return `${student.firstName || ''} ${student.lastName || ''}`.trim();
  };

  const handleUpdateStatus = async (orderId: string) => {
    const newStatus = statusUpdates[orderId];
    if (!newStatus) return;

    try {
      await storeService.updatePurchaseStatus(orderId, newStatus as any);
      setOrders(orders.map(o => o.id === orderId ? { ...o, status: newStatus as any } : o));
      setEditingOrder(null);
    } catch (err) {
      console.error(err);
      alert('Sipariş güncellenirken hata oluştu.');
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20';
      case 'pending': return 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20';
      case 'delivered': return 'bg-blue-500/10 text-blue-400 border-blue-500/20';
      case 'cancelled': return 'bg-red-500/10 text-red-400 border-red-500/20';
      default: return 'bg-slate-500/10 text-slate-400 border-slate-500/20';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'completed': return 'Tamamlandı';
      case 'pending': return 'Bekliyor';
      case 'delivered': return 'Teslim Edildi';
      case 'cancelled': return 'İptal Edildi';
      default: return status;
    }
  };

  const renderStatusIcon = (status: string) => {
    switch (status) {
      case 'completed': return <CheckCircle size={16} />;
      case 'pending': return <Clock size={16} />;
      case 'delivered': return <Truck size={16} />;
      case 'cancelled': return <XCircle size={16} />;
      default: return <Package size={16} />;
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center py-20">
        <Loader2 className="animate-spin text-blue-500" size={32} />
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 pb-6 border-b border-white/5">
        <div>
          <h1 className="text-3xl md:text-5xl font-black tracking-tight text-white mb-2">
            Sipariş Yönetimi
          </h1>
          <p className="text-slate-500 max-w-xl">
             Öğrencilerin mağazadan satın aldığı ürünleri buradan görüntüleyebilir ve sipariş durumlarını güncelleyebilirsiniz.
          </p>
        </div>
      </div>

      {orders.length === 0 ? (
        <div className="bg-slate-900/50 border border-white/5 rounded-[32px] p-12 text-center">
           <div className="w-20 h-20 bg-slate-800 rounded-full flex items-center justify-center mx-auto mb-6">
              <Package className="text-slate-500" size={32} />
           </div>
           <h3 className="text-xl font-bold text-white mb-2">Henüz Sipariş Bulunmuyor</h3>
           <p className="text-slate-500 mb-6 max-w-md mx-auto">
             Mağazadan ürün satın alındığında siparişler burada listelenecektir.
           </p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-white/5 text-slate-400 text-sm">
                <th className="py-4 px-4 font-medium uppercase tracking-wider">Tarih</th>
                <th className="py-4 px-4 font-medium uppercase tracking-wider">Öğrenci</th>
                <th className="py-4 px-4 font-medium uppercase tracking-wider">Ürün</th>
                <th className="py-4 px-4 font-medium uppercase tracking-wider">Adet</th>
                <th className="py-4 px-4 font-medium uppercase tracking-wider">Tutar</th>
                <th className="py-4 px-4 font-medium uppercase tracking-wider">Durum</th>
                <th className="py-4 px-4 font-medium uppercase tracking-wider text-right">İşlem</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {orders.map((order) => (
                <tr key={order.id} className="hover:bg-white/[0.02] transition-colors">
                  <td className="py-4 px-4 whitespace-nowrap">
                    <div className="text-slate-300">
                      {new Date(order.purchasedAt).toLocaleDateString('tr-TR')}
                    </div>
                    <div className="text-slate-500 text-xs">
                      {new Date(order.purchasedAt).toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' })}
                    </div>
                  </td>
                  <td className="py-4 px-4">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-slate-800 flex items-center justify-center text-slate-400 font-bold shrink-0">
                        {getStudentName(order.studentId).charAt(0) || 'U'}
                      </div>
                      <span className="text-white font-medium">{getStudentName(order.studentId)}</span>
                    </div>
                  </td>
                  <td className="py-4 px-4 text-slate-300">
                    {order.productTitle}
                  </td>
                  <td className="py-4 px-4 text-slate-400 font-mono">
                    {order.quantity || 1}
                  </td>
                  <td className="py-4 px-4 text-white font-mono font-bold">
                    {order.totalCost ? `${order.totalCost} ₺` : `${order.cost} ₺`}
                  </td>
                  <td className="py-4 px-4">
                    {editingOrder === order.id ? (
                      <select
                        value={statusUpdates[order.id!] || order.status}
                        onChange={(e) => setStatusUpdates({ ...statusUpdates, [order.id!]: e.target.value })}
                        className="bg-slate-900 border border-white/10 rounded-lg py-1.5 px-3 text-white text-sm outline-none focus:border-blue-500 transition-colors"
                      >
                        <option value="pending">Bekliyor</option>
                        <option value="completed">Tamamlandı</option>
                        <option value="delivered">Teslim Edildi</option>
                        <option value="cancelled">İptal Edildi</option>
                      </select>
                    ) : (
                      <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-black uppercase tracking-widest border ${getStatusColor(order.status)}`}>
                        {renderStatusIcon(order.status)}
                        {getStatusText(order.status)}
                      </span>
                    )}
                  </td>
                  <td className="py-4 px-4 text-right">
                    {editingOrder === order.id ? (
                      <button
                        onClick={() => order.id && handleUpdateStatus(order.id)}
                        className="p-2 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 rounded-xl transition-colors inline-block"
                        title="Kaydet"
                      >
                        <Save size={16} />
                      </button>
                    ) : (
                      <button
                        onClick={() => {
                          setEditingOrder(order.id!);
                          setStatusUpdates({ ...statusUpdates, [order.id!]: order.status });
                        }}
                        className="p-2 bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white rounded-xl transition-colors inline-block"
                        title="Durumu Güncelle"
                      >
                        <Edit2 size={16} />
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
