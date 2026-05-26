import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Calendar, MapPin, Clock, Ticket, CheckCircle2, UserX, UserCheck, ChevronRight, X, ArrowRight, ShoppingBag
} from 'lucide-react';
import { eventService, EventData, EventRSVP, TicketOrder } from '../../services/eventService';
import { useAuth } from '../../lib/AuthContext';
import { useCart } from '../../lib/CartContext';

export default function StudentEvents() {
  const { user, userData } = useAuth();
  const [events, setEvents] = useState<EventData[]>([]);
  const [rsvps, setRsvps] = useState<EventRSVP[]>([]);
  const [ticketOrders, setTicketOrders] = useState<TicketOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedEvent, setSelectedEvent] = useState<EventData | null>(null);

  useEffect(() => {
    if (user) loadData();
  }, [user]);

  const loadData = async () => {
    setLoading(true);
    const [evs, rsvpList, ticketList] = await Promise.all([
      eventService.getEvents('student'),
      eventService.getStudentRSVPs(user!.uid),
      eventService.getStudentTicketOrders(user!.uid)
    ]);
    setEvents(evs);
    setRsvps(rsvpList);
    setTicketOrders(ticketList);
    setLoading(false);
  };

  if (loading && !selectedEvent) {
    return (
      <div className="flex-1 p-6 md:p-10 flex flex-col items-center justify-center min-h-[60vh]">
        <div className="w-16 h-16 border-4 border-indigo-500/20 border-t-indigo-500 rounded-full animate-spin mb-4" />
        <h2 className="text-xl font-bold text-white mb-2">Etkinlikler Yükleniyor...</h2>
      </div>
    );
  }

  if (selectedEvent) {
     return (
       <EventDetail 
          event={selectedEvent} 
          rsvps={rsvps}
          ticketOrders={ticketOrders}
          onBack={() => setSelectedEvent(null)}
          onUpdate={loadData}
          userContext={{ uid: user!.uid, name: userData!.firstName + ' ' + userData!.lastName }}
       />
     );
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 pb-6 border-b border-white/5">
        <div>
           <h1 className="text-3xl md:text-5xl font-black tracking-tight text-white mb-2">
             Etkinlikler
           </h1>
           <p className="text-slate-500 max-w-xl">
              Fiziksel veya online seminerlere, webinarlara ve toplantılara katılıp gelişiminizi destekleyin.
           </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {events.map((ev, idx) => {
          const rsvp = rsvps.find(r => r.eventId === ev.id);
          const hasTicket = ticketOrders.find(t => t.eventId === ev.id);
          
          let statusBadge = null;
          if (ev.eventType === 'rsvp' && rsvp) {
             statusBadge = rsvp.status === 'attending' 
                ? <div className="bg-emerald-500/10 text-emerald-400 px-3 py-1 rounded text-[10px] font-black uppercase tracking-widest border border-emerald-500/20">Kayıtlı</div>
                : <div className="bg-rose-500/10 text-rose-400 px-3 py-1 rounded text-[10px] font-black uppercase tracking-widest border border-rose-500/20">Katılmayacak</div>;
          } else if (ev.eventType === 'ticketed' && hasTicket) {
             statusBadge = <div className="bg-emerald-500/10 text-emerald-400 px-3 py-1 rounded text-[10px] font-black uppercase tracking-widest border border-emerald-500/20">Bilet Alındı</div>;
          }

          return (
            <motion.div
              key={ev.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.1 }}
              onClick={() => setSelectedEvent(ev)}
              className="bg-slate-900/50 backdrop-blur-md rounded-3xl border border-white/5 overflow-hidden group cursor-pointer hover:border-indigo-500/30 transition-all hover:-translate-y-1 hover:shadow-xl hover:shadow-indigo-500/10"
            >
               <div className="h-40 bg-slate-800 relative">
                  {ev.image ? (
                     <img src={ev.image} alt={ev.title} className="w-full h-full object-cover opacity-60 group-hover:scale-105 transition-transform duration-700" />
                  ) : (
                     <div className="w-full h-full bg-gradient-to-tr from-indigo-900/30 to-purple-900/30 flex items-center justify-center">
                        <Calendar size={40} className="text-indigo-900/50" />
                     </div>
                  )}
                  <div className="absolute top-4 right-4 flex gap-2">
                     <div className="backdrop-blur-md bg-black/40 text-white px-3 py-1 rounded text-[10px] font-black uppercase tracking-widest border border-white/10 shadow-lg">
                        {ev.eventType === 'rsvp' ? 'LCV' : 'Biletli'}
                     </div>
                     {statusBadge}
                  </div>
               </div>

               <div className="p-6">
                  <h3 className="text-xl font-bold text-white mb-4 line-clamp-2">{ev.title}</h3>
                  <div className="space-y-2 mb-6">
                     <div className="flex items-center gap-3 text-slate-400 text-sm">
                        <Calendar size={16} className="text-indigo-400" /> 
                        <span className="font-medium text-slate-300">{ev.dateType === 'tbd' ? 'Tarih Belirsiz' : (ev.startDate ? new Date(ev.startDate).toLocaleDateString('tr-TR', { day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : 'Tarih Yok')}</span>
                     </div>
                     <div className="flex items-center gap-3 text-slate-400 text-sm">
                        <MapPin size={16} className="text-rose-400" /> 
                        <span className="font-medium text-slate-300">{ev.locationType === 'tbd' ? 'Yer Belirsiz' : ev.locationType === 'online' ? 'Online Katılım' : ev.locationDetails || 'Fiziksel'}</span>
                     </div>
                  </div>
               </div>
            </motion.div>
          );
        })}
        {events.length === 0 && (
           <div className="col-span-full py-20 text-center border-2 border-dashed border-white/5 rounded-3xl">
             <Calendar className="w-16 h-16 text-slate-600 mx-auto mb-4" />
             <p className="text-slate-400 font-medium">Yaklaşan etkinlik bulunmuyor.</p>
           </div>
        )}
      </div>
    </div>
  );
}

function EventDetail({ event, rsvps, ticketOrders, onBack, onUpdate, userContext }: any) {
   const [isSubmitting, setIsSubmitting] = useState(false);
   const [successMessage, setSuccessMessage] = useState<string | null>(null);
   const { addToCart } = useCart();
   
   const [selectedTicket, setSelectedTicket] = useState(event.tickets?.[0]?.id);
   const [quantity, setQuantity] = useState(1);

   const rsvp = rsvps.find((r: any) => r.eventId === event.id);
   const myTickets = ticketOrders.filter((t: any) => t.eventId === event.id);

   const handleRSVP = async (status: 'attending' | 'not_attending') => {
      setIsSubmitting(true);
      try {
         await eventService.submitRSVP({
            eventId: event.id!,
            studentId: userContext.uid,
            studentName: userContext.name,
            status
         });
         await onUpdate();
      } catch (e) {
         alert("Hata oluştu");
      }
      setIsSubmitting(false);
   };

   const handleBuyTicket = async () => {
      if (!selectedTicket) return;
      const tInfo = event.tickets.find((t: any) => t.id === selectedTicket);
      if (!tInfo) return;

      if (tInfo.price > 0) {
         addToCart({
            itemId: `${event.id}_${tInfo.id}`,
            type: 'event',
            title: `${event.title} - ${tInfo.name}`,
            price: tInfo.price,
            image: event.image,
            quantity: quantity,
            metadata: { eventId: event.id, ticketTypeId: tInfo.id }
         });
         setSuccessMessage(`"${tInfo.name}" sepete eklendi.`);
         setTimeout(() => setSuccessMessage(null), 3000);
         setQuantity(1);
         return;
      }

      setIsSubmitting(true);
      try {
         await eventService.buyTicket({
            eventId: event.id!,
            studentId: userContext.uid,
            studentName: userContext.name,
            ticketTypeId: selectedTicket,
            quantity: quantity,
            totalPrice: tInfo.price * quantity,
         });
         await onUpdate();
         setQuantity(1);
         setSuccessMessage(`Ücretsiz biletiniz başarıyla alındı!`);
         setTimeout(() => setSuccessMessage(null), 3000);
      } catch (e) {
         alert("Hata oluştu");
      }
      setIsSubmitting(false);
   };

   const activeTicketInfo = event.tickets?.find((t: any) => t.id === selectedTicket);

   return (
      <div className="space-y-6 animate-in fade-in duration-300 max-w-4xl mx-auto relative">
         {successMessage && (
            <div className="fixed bottom-4 right-4 bg-emerald-500 text-white px-6 py-3 rounded-xl shadow-lg font-medium flex items-center gap-2 z-50 animate-in fade-in slide-in-from-bottom-4">
               <CheckCircle2 className="w-5 h-5" />
               {successMessage}
            </div>
         )}
         <button onClick={onBack} className="flex items-center gap-2 text-slate-400 hover:text-white transition-colors bg-white/5 px-4 py-2 rounded-xl text-sm font-bold">
            <X size={16} /> Kapat
         </button>
         
         <div className="bg-slate-900/80 backdrop-blur-md rounded-[32px] border border-white/5 overflow-hidden shadow-2xl">
            <div className="h-64 relative bg-slate-800">
               {event.image ? (
                 <img src={event.image} alt={event.title} className="w-full h-full object-cover opacity-60" />
               ) : (
                 <div className="w-full h-full bg-gradient-to-tr from-indigo-900/50 to-purple-900/50" />
               )}
               <div className="absolute inset-0 bg-gradient-to-t from-slate-900 to-transparent" />
            </div>
            
            <div className="p-8 md:p-12 -mt-20 relative z-10">
               <div className="mb-8">
                  <div className="inline-flex mb-4 items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-[10px] font-black uppercase tracking-widest">
                     {event.eventType === 'rsvp' ? 'LCV Etkinlik' : 'Biletli Etkinlik'}
                  </div>
                  <h1 className="text-3xl md:text-5xl font-black text-white leading-tight mb-6">{event.title}</h1>
                  
                  <div className="flex flex-wrap gap-4 md:gap-8 bg-black/30 p-6 rounded-2xl border border-white/5 mb-8">
                     <div className="space-y-1">
                        <div className="flex items-center gap-2 text-slate-500 text-xs font-black uppercase tracking-widest">
                           <Calendar size={14} className="text-indigo-400" /> Tarih & Saat
                        </div>
                        <p className="text-white font-medium">
                           {event.dateType === 'tbd' ? 'Daha Sonra Açıklanacak' : (event.startDate ? new Date(event.startDate).toLocaleDateString('tr-TR', { day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : '-')}
                        </p>
                     </div>
                     <div className="w-px bg-white/10 hidden md:block" />
                     <div className="space-y-1">
                        <div className="flex items-center gap-2 text-slate-500 text-xs font-black uppercase tracking-widest">
                           <MapPin size={14} className="text-rose-400" /> Konum / Link
                        </div>
                        <p className="text-white font-medium">
                           {event.locationType === 'tbd' ? 'Daha Sonra Açıklanacak' : event.locationDetails || (event.locationType === 'online' ? 'Online' : 'Fiziksel')}
                        </p>
                     </div>
                  </div>
                  
                  <div className="prose prose-invert max-w-none text-slate-300 whitespace-pre-wrap">
                     {event.description}
                  </div>
               </div>

               <div className="border-t border-white/10 pt-8 mt-8">
                  <h3 className="text-xl font-bold text-white mb-6">Katılım İşlemleri</h3>
                  
                  {event.eventType === 'rsvp' ? (
                     <div className="bg-white/5 border border-white/10 rounded-2xl p-6 flex flex-col md:flex-row items-center justify-between gap-6">
                        <div>
                           <h4 className="font-bold text-white mb-1">Durumunuz</h4>
                           {rsvp ? (
                              <p className="text-sm text-slate-400">
                                 {rsvp.status === 'attending' ? 'Katılacağınızı belirttiniz.' : 'Katılmayacağınızı belirttiniz.'}
                              </p>
                           ) : (
                              <p className="text-sm text-slate-400">Katılım durumunuzu henüz belirtmediniz.</p>
                           )}
                        </div>
                        <div className="flex gap-3 w-full md:w-auto">
                           <button 
                             onClick={() => handleRSVP('not_attending')}
                             disabled={isSubmitting}
                             className={`flex-1 md:flex-none px-6 py-3 rounded-xl font-bold text-sm transition-all flex items-center justify-center gap-2 border disabled:opacity-50
                               ${rsvp?.status === 'not_attending' ? 'bg-rose-500/20 text-rose-400 border-rose-500/30' : 'bg-transparent text-slate-400 border-white/10 hover:bg-white/5'}
                             `}
                           >
                              <UserX size={18} /> Katılamıyorum
                           </button>
                           <button 
                             onClick={() => handleRSVP('attending')}
                             disabled={isSubmitting}
                             className={`flex-1 md:flex-none px-6 py-3 rounded-xl font-bold text-sm transition-all flex items-center justify-center gap-2 border disabled:opacity-50
                               ${rsvp?.status === 'attending' ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30' : 'bg-indigo-600 text-white border-transparent hover:bg-indigo-500'}
                             `}
                           >
                              <UserCheck size={18} /> Katılacağım
                           </button>
                        </div>
                     </div>
                  ) : (
                     <div className="space-y-6">
                        {myTickets.length > 0 && (
                           <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-2xl p-6">
                              <h4 className="font-bold text-emerald-400 mb-4 flex items-center gap-2"><Ticket size={18} /> Sahip Olduğunuz Biletler</h4>
                              <div className="space-y-3">
                                 {myTickets.map((t: any) => {
                                    const ttype = event.tickets?.find((tx: any) => tx.id === t.ticketTypeId);
                                    return (
                                       <div key={t.id} className="bg-emerald-500/5 rounded-xl block md:flex justify-between items-center p-4 border border-emerald-500/10">
                                          <div>
                                             <p className="font-bold text-white">{ttype?.name || 'Bilet'}</p>
                                             <p className="text-xs text-emerald-500/70">{new Date(t.createdAt).toLocaleDateString()} alındı.</p>
                                          </div>
                                          <div className="bg-emerald-500/20 px-3 py-1 rounded-lg text-emerald-400 font-black text-sm mt-3 md:mt-0 md:text-right">
                                             {t.quantity} Adet <br className="hidden md:block" /> <span className="text-xs font-normal opacity-70">Toplam: {t.totalPrice}₺</span>
                                          </div>
                                       </div>
                                    );
                                 })}
                              </div>
                           </div>
                        )}
                        
                        <div className="bg-slate-800/50 border border-white/5 rounded-2xl p-6">
                           <h4 className="font-bold text-white mb-6">Yeni Bilet Al</h4>
                           {event.tickets?.length > 0 ? (
                              <div className="flex flex-col md:flex-row gap-6">
                                 <div className="flex-1 space-y-3">
                                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest pl-1">Bilet Tipi</label>
                                    <div className="grid grid-cols-1 gap-3">
                                       {event.tickets.map((t: any) => {
                                          const isSelected = selectedTicket === t.id;
                                          return (
                                             <div 
                                                key={t.id} 
                                                onClick={() => setSelectedTicket(t.id)}
                                                className={`p-4 rounded-xl border flex items-center justify-between cursor-pointer transition-colors
                                                   ${isSelected ? 'bg-indigo-500/10 border-indigo-500 text-white' : 'bg-black/30 border-white/5 text-slate-400'}`}
                                             >
                                                <div className="font-bold">{t.name}</div>
                                                <div className={`font-black ${isSelected ? 'text-indigo-400' : 'text-slate-300'}`}>
                                                   {t.price === 0 ? 'Ücretsiz' : `${t.price} ₺`}
                                                </div>
                                             </div>
                                          );
                                       })}
                                    </div>
                                 </div>
                                 
                                 <div className="w-full md:w-48 flex flex-col justify-end space-y-4">
                                    <div className="space-y-3">
                                       <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest pl-1">Adet</label>
                                       <select 
                                          value={quantity} 
                                          onChange={e => setQuantity(Number(e.target.value))}
                                          className="w-full bg-black/40 border border-white/5 rounded-xl p-4 text-white outline-none appearance-none"
                                       >
                                          {Array.from({ length: event.maxTicketsPerOrder || 1 }, (_, i) => i + 1).map(n => (
                                             <option key={n} value={n}>{n}</option>
                                          ))}
                                       </select>
                                    </div>
                                    <button 
                                      onClick={handleBuyTicket}
                                      disabled={isSubmitting || !selectedTicket}
                                      className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-bold py-4 rounded-xl transition-all shadow-lg shadow-indigo-600/20 disabled:opacity-50 flex items-center justify-center"
                                    >
                                       {isSubmitting ? 'İşleniyor...' : (activeTicketInfo && activeTicketInfo.price > 0 ? <>Sepete Ekle <ShoppingBag size={18} className="ml-2" /></> : 'Bilet Al')}
                                    </button>
                                 </div>
                              </div>
                           ) : (
                              <p className="text-slate-500 text-center py-4">Bu etkinlik için henüz bilet eklenmemiş.</p>
                           )}
                        </div>
                     </div>
                  )}
               </div>
            </div>
         </div>
      </div>
   );
}
