import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { ShoppingCart, Clock, Loader2, AlertCircle } from 'lucide-react';
import { appointmentService } from '../../services/appointmentService';
import { cartService } from '../../services/cartService';

export default function AdminCarts() {
  const [carts, setCarts] = useState<any[]>([]);
  const [students, setStudents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [fetchedCarts, fetchedStudents] = await Promise.all([
        cartService.getAbandonedCarts(),
        appointmentService.getAllStudents()
      ]);
      
      const sortedCarts = fetchedCarts.sort((a, b) => 
        new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
      );
      
      setCarts(sortedCarts);
      setStudents(fetchedStudents);
    } catch (error) {
      console.error("Error loading carts:", error);
    } finally {
      setLoading(false);
    }
  };

  const getStudentInfo = (studentId: string) => {
    const student = students.find(s => s.uid === studentId);
    if (!student) return { name: 'Bilinmiyor', email: '' };
    return {
       name: `${student.firstName || ''} ${student.lastName || ''}`.trim() || student.displayName || 'Bilinmiyor',
       email: student.email || ''
    };
  };

  const calculateTotal = (items: any[]) => {
    return items.reduce((sum, item) => sum + (item.price * (item.quantity || 1)), 0);
  };

  if (loading) {
    return (
      <div className="flex justify-center py-20">
        <Loader2 className="animate-spin text-indigo-500" size={32} />
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 pb-6 border-b border-white/5">
        <div>
          <h1 className="text-3xl md:text-5xl font-black tracking-tight text-white mb-2">
            Terk Edilmiş Sepetler
          </h1>
          <p className="text-slate-500 max-w-xl">
             Öğrencilerin sepetine eklediği ancak satın alma işlemini tamamlamadığı ürünleri görüntüleyin.
          </p>
        </div>
      </div>

      {carts.length === 0 ? (
        <div className="bg-slate-900/50 border border-white/5 rounded-[32px] p-12 text-center">
           <div className="w-20 h-20 bg-slate-800 rounded-full flex items-center justify-center mx-auto mb-6">
              <ShoppingCart className="text-slate-500" size={32} />
           </div>
           <h3 className="text-xl font-bold text-white mb-2">Terk Edilmiş Sepet Yok</h3>
           <p className="text-slate-500 mb-6 max-w-md mx-auto">
             Şu anda sistemde tamamlanmamış ve rafta kalmış bir sepet bulunmuyor.
           </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {carts.map((cart) => {
            const studentInfo = getStudentInfo(cart.userId);
            const totalItems = cart.items.reduce((sum: number, item: any) => sum + (item.quantity || 1), 0);
            const isStale = new Date().getTime() - new Date(cart.updatedAt).getTime() > 24 * 60 * 60 * 1000;
            
            return (
              <div key={cart.userId} className="bg-slate-900/60 backdrop-blur-xl border border-white/5 rounded-[32px] p-6 hover:bg-white/[0.02] transition-colors relative group">
                <div className="flex items-start justify-between mb-6">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-full bg-slate-800 flex items-center justify-center text-xl font-bold text-slate-400 shrink-0">
                      {studentInfo.name.charAt(0) || '?'}
                    </div>
                    <div className="overflow-hidden">
                      <h3 className="text-lg font-bold text-white truncate">{studentInfo.name}</h3>
                      <p className="text-slate-500 text-sm truncate">{studentInfo.email}</p>
                    </div>
                  </div>
                </div>

                {isStale && (
                  <div className="flex items-center gap-2 mb-4 bg-amber-500/10 text-amber-500 border border-amber-500/20 px-3 py-1.5 rounded-lg text-xs font-bold w-fit">
                    <AlertCircle size={14} />
                    <span>24 Saatten Eski</span>
                  </div>
                )}

                <div className="space-y-3 mb-6">
                  <div className="text-xs font-black text-slate-500 uppercase tracking-widest border-b border-white/5 pb-2">
                    Sepet İçeriği ({totalItems} Ürün)
                  </div>
                  <div className="space-y-2 max-h-[150px] overflow-y-auto custom-scrollbar pr-2">
                    {cart.items.map((item: any, idx: number) => (
                      <div key={idx} className="flex justify-between items-center bg-black/20 p-2 rounded-xl">
                         <div className="flex-1 truncate pr-3">
                           <p className="text-sm text-slate-300 font-medium truncate">{item.title}</p>
                           <p className="text-[10px] text-slate-500 capitalize">{item.type} {item.quantity > 1 ? `x${item.quantity}` : ''}</p>
                         </div>
                         <div className="text-white font-mono text-sm font-bold shrink-0">
                            ₺{item.price * (item.quantity || 1)}
                         </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="flex items-end justify-between pt-4 border-t border-white/5">
                   <div>
                     <div className="flex items-center gap-1.5 text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1">
                        <Clock size={12} />
                        Son İşlem
                     </div>
                     <span className="text-slate-300 text-sm">{new Date(cart.updatedAt).toLocaleString('tr-TR', { dateStyle: 'short', timeStyle: 'short' })}</span>
                   </div>
                   <div className="text-right">
                     <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest block mb-1">Toplam Tutar</span>
                     <span className="text-2xl font-black text-indigo-400">₺{calculateTotal(cart.items)}</span>
                   </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
