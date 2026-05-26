import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Plus, Edit2, Trash2, Calendar, MapPin, Ticket, Users, Eye, EyeOff, Save, X, Activity, Image as ImageIcon, MapPinOff, Clock
} from 'lucide-react';
import { eventService, EventData, TicketTypeInfo } from '../../services/eventService';

export default function AdminEvents() {
  const [events, setEvents] = useState<EventData[]>([]);
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [currentEvent, setCurrentEvent] = useState<Partial<EventData> | null>(null);

  useEffect(() => {
    loadEvents();
  }, []);

  const loadEvents = async () => {
    setLoading(true);
    const data = await eventService.getEvents('admin');
    setEvents(data);
    setLoading(false);
  };

  const handleEdit = (ev: EventData) => {
    setCurrentEvent(ev);
    setIsEditing(true);
  };

  const handleCreate = () => {
    setCurrentEvent({
      title: '',
      description: '',
      eventType: 'rsvp',
      status: 'draft',
      locationType: 'tbd',
      dateType: 'tbd',
      hasCapacityLimit: false,
      showGuestList: false,
      tickets: [],
      maxTicketsPerOrder: 1
    });
    setIsEditing(true);
  };

  const handleSave = async () => {
    if (!currentEvent?.title) return;
    
    try {
      if (currentEvent.id) {
        await eventService.updateEvent(currentEvent.id, currentEvent);
      } else {
        await eventService.createEvent(currentEvent as Omit<EventData, 'id' | 'createdAt'>);
      }
      setIsEditing(false);
      loadEvents();
    } catch (e) {
      console.error(e);
      alert('Kaydedilirken hata oluştu.');
    }
  };

  const handleDelete = async (id: string) => {
    if (window.confirm('Bu etkinliği silmek istediğinize emin misiniz?')) {
      await eventService.deleteEvent(id);
      loadEvents();
    }
  };

  if (loading && !isEditing) {
    return (
      <div className="flex-1 p-6 md:p-10 flex flex-col items-center justify-center min-h-[60vh]">
        <div className="w-16 h-16 border-4 border-indigo-500/20 border-t-indigo-500 rounded-full animate-spin mb-4" />
        <h2 className="text-xl font-bold text-white mb-2">Etkinlikler Yükleniyor...</h2>
      </div>
    );
  }

  if (isEditing && currentEvent) {
    return (
      <EventEditor 
        event={currentEvent as EventData} 
        setEvent={setCurrentEvent}
        onSave={handleSave}
        onCancel={() => setIsEditing(false)}
      />
    );
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 pb-6 border-b border-white/5">
        <div>
          <h1 className="text-3xl md:text-5xl font-black tracking-tight text-white mb-2">
            Etkinlik Yönetimi
          </h1>
          <p className="text-slate-500 max-w-xl">
             Öğrencileriniz için yeni etkinlikler planlayın (Online/Fiziksel), bilet satışı yapın veya LCV (katılım durumu) toplayın.
          </p>
        </div>
        <button 
          onClick={handleCreate}
          className="flex items-center gap-2 px-6 py-3 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-2xl transition-all shadow-lg hover:scale-105"
        >
          <Plus size={20} /> Yeni Etkinlik Oluştur
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
        {events.map((ev, idx) => (
          <motion.div
            key={ev.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: idx * 0.1 }}
            className="bg-slate-900/50 backdrop-blur-md rounded-2xl border border-white/5 flex flex-col overflow-hidden relative group"
          >
            {/* Kapak && Durum */}
            <div className="h-40 bg-slate-800 relative">
               {ev.image && <img src={ev.image} alt={ev.title} className="w-full h-full object-cover opacity-60" />}
               <div className="absolute inset-0 bg-gradient-to-t from-slate-900 to-transparent" />
               <div className="absolute top-4 right-4 flex gap-2">
                  {ev.status === 'published' ? (
                     <div className="bg-emerald-500/10 text-emerald-400 px-2 py-1 rounded text-xs font-black uppercase tracking-widest border border-emerald-500/20">
                       Yayında
                     </div>
                  ) : (
                     <div className="bg-slate-800 text-slate-400 px-2 py-1 rounded text-xs font-black uppercase tracking-widest border border-white/5">
                       Taslak
                     </div>
                  )}
                  <div className="bg-indigo-500/10 text-indigo-400 px-2 py-1 rounded text-xs font-black uppercase tracking-widest border border-indigo-500/20">
                     {ev.eventType === 'rsvp' ? 'LCV' : 'Biletli'}
                  </div>
               </div>
               <div className="absolute bottom-4 left-4 right-4">
                  <h3 className="text-xl font-bold text-white leading-tight">{ev.title}</h3>
               </div>
            </div>

            <div className="p-6 flex-1 flex flex-col">
               <div className="space-y-3 mb-6 flex-1">
                  <div className="flex items-center gap-3 text-slate-400 text-sm">
                     <Calendar size={16} className="text-indigo-400" /> 
                     <span>{ev.dateType === 'tbd' ? 'Tarih Belirsiz' : (ev.startDate ? new Date(ev.startDate).toLocaleDateString('tr-TR') : 'Tarih Yok')}</span>
                  </div>
                  <div className="flex items-center gap-3 text-slate-400 text-sm">
                     <MapPin size={16} className="text-rose-400" /> 
                     <span>{ev.locationType === 'tbd' ? 'Yer Belirsiz' : ev.locationType === 'online' ? 'Online' : ev.locationDetails || 'Fiziksel'}</span>
                  </div>
               </div>
            
               <div className="flex items-center gap-2 pt-4 border-t border-white/5 mt-auto">
                 <button 
                   onClick={() => handleEdit(ev)}
                   className="flex-1 bg-white/5 hover:bg-indigo-500/20 hover:text-indigo-400 text-white py-2.5 rounded-xl text-sm font-bold transition-colors border border-white/5 flex items-center justify-center gap-2"
                 >
                   <Edit2 size={16} /> Düzenle
                 </button>
                 <button 
                   onClick={() => ev.id && handleDelete(ev.id)}
                   className="p-2.5 bg-white/5 hover:bg-red-500/20 hover:text-red-400 text-slate-400 rounded-xl transition-colors border border-white/5"
                 >
                   <Trash2 size={16} />
                 </button>
               </div>
            </div>
          </motion.div>
        ))}
        {events.length === 0 && (
           <div className="col-span-full py-20 text-center border-2 border-dashed border-white/5 rounded-3xl">
             <Calendar className="w-16 h-16 text-slate-600 mx-auto mb-4" />
             <p className="text-slate-400 font-medium">Henüz hiç etkinlik oluşturmadınız.</p>
           </div>
        )}
      </div>
    </div>
  );
}

function EventEditor({ event, setEvent, onSave, onCancel }: { event: Partial<EventData>, setEvent: Function, onSave: () => void, onCancel: () => void }) {
  const [activeTab, setActiveTab] = useState<'details' | 'type' | 'settings'>('details');

  const updateField = (field: keyof EventData, value: any) => {
    setEvent((prev: any) => ({ ...prev, [field]: value }));
  };

  const addTicket = () => {
    const newTicket: TicketTypeInfo = {
      id: Math.random().toString(36).substr(2, 9),
      name: 'Standart Bilet',
      price: 0,
      soldCount: 0
    };
    updateField('tickets', [...(event.tickets || []), newTicket]);
  };

  const updateTicket = (idx: number, updates: Partial<TicketTypeInfo>) => {
    const newTickets = [...(event.tickets || [])];
    newTickets[idx] = { ...newTickets[idx], ...updates };
    updateField('tickets', newTickets);
  };

  const removeTicket = (idx: number) => {
    const newTickets = [...(event.tickets || [])];
    newTickets.splice(idx, 1);
    updateField('tickets', newTickets);
  };

  return (
    <div className="bg-slate-900/50 backdrop-blur-md rounded-[32px] border border-white/5 overflow-hidden flex flex-col min-h-[80vh] flex-1">
      {/* Header */}
      <div className="p-6 border-b border-white/5 flex items-center justify-between sticky top-0 bg-slate-900 z-20">
         <div className="flex items-center gap-4">
           <button onClick={onCancel} className="p-2 bg-white/5 rounded-xl hover:bg-white/10 transition-colors">
              <X size={20} className="text-slate-300" />
           </button>
           <h2 className="text-xl font-bold text-white">
             {event.id ? 'Etkinliği Düzenle' : 'Yeni Etkinlik'}
           </h2>
         </div>
         <button onClick={onSave} className="bg-indigo-600 hover:bg-indigo-500 text-white px-6 py-2 rounded-xl font-bold flex items-center gap-2 shadow-lg">
            <Save size={18} /> Kaydet
         </button>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-1 border-b border-white/5 px-6 pt-4">
        {[
          { id: 'details', label: 'Temel Bilgiler', icon: Calendar },
          { id: 'type', label: 'Etkinlik Tipi & Biletler', icon: Ticket },
          { id: 'settings', label: 'Ayarlar', icon: Activity },
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={`px-4 py-3 text-sm font-bold border-b-2 transition-all flex items-center gap-2 ${activeTab === tab.id ? 'border-indigo-500 text-indigo-400' : 'border-transparent text-slate-500 hover:text-slate-300'}`}
          >
            <tab.icon size={16} />
            {tab.label}
          </button>
        ))}
      </div>

      {/* Content */}
      <div className="flex-1 p-6 overflow-y-auto custom-scrollbar">
         {activeTab === 'details' && (
           <div className="max-w-2xl space-y-6">
             <div className="space-y-4">
                <div className="space-y-2">
                   <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest pl-1">Etkinlik Adı</label>
                   <input 
                     type="text" 
                     value={event.title || ''} 
                     onChange={e => updateField('title', e.target.value)}
                     className="w-full bg-black/40 border border-white/5 rounded-2xl p-4 text-white font-bold text-lg outline-none focus:border-indigo-500/50"
                     placeholder="Örn: 2026 YKS Hedef Belirleme Kampı"
                   />
                </div>
                <div className="space-y-2">
                   <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest pl-1">Açıklama</label>
                   <textarea 
                     rows={4}
                     value={event.description || ''} 
                     onChange={e => updateField('description', e.target.value)}
                     className="w-full bg-black/40 border border-white/5 rounded-2xl p-4 text-slate-300 outline-none focus:border-indigo-500/50 resize-none"
                     placeholder="Etkinlik hakkında detaylar..."
                   />
                </div>
                <div className="space-y-2">
                   <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest pl-1">Kapak Görseli URL</label>
                    <div className="flex gap-2">
                       <div className="w-14 h-14 bg-black/40 rounded-xl border border-white/5 flex items-center justify-center shrink-0">
                         <ImageIcon size={24} className="text-slate-600" />
                       </div>
                       <input 
                         type="text" 
                         value={event.image || ''} 
                         onChange={e => updateField('image', e.target.value)}
                         className="w-full bg-black/40 border border-white/5 rounded-2xl p-4 text-white outline-none focus:border-indigo-500/50"
                         placeholder="Resim linki ekleyin..."
                       />
                    </div>
                </div>
             </div>
             
             <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-6 border-t border-white/5">
                <div className="space-y-4">
                  <h4 className="text-white font-bold flex items-center gap-2"><Clock size={18} className="text-indigo-400" /> Zamanlama</h4>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest pl-1">Tarih Durumu</label>
                    <select 
                      value={event.dateType} 
                      onChange={e => updateField('dateType', e.target.value)}
                      className="w-full bg-black/40 border border-white/5 rounded-xl p-3.5 text-sm text-white outline-none appearance-none"
                    >
                      <option value="fixed">Tarihi Belli</option>
                      <option value="tbd">Tarih Belirsiz (Daha Sonra Açıklanacak)</option>
                    </select>
                  </div>
                  {event.dateType === 'fixed' && (
                     <div className="flex gap-4">
                        <div className="space-y-2 flex-1">
                          <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest pl-1">Başlangıç</label>
                          <input 
                            type="datetime-local" 
                            value={event.startDate ? event.startDate.substring(0, 16) : ''} 
                            onChange={e => updateField('startDate', new Date(e.target.value).toISOString())}
                            className="w-full bg-black/40 border border-white/5 rounded-xl p-3.5 text-sm text-white outline-none [color-scheme:dark]"
                          />
                        </div>
                     </div>
                  )}
                </div>

                <div className="space-y-4">
                  <h4 className="text-white font-bold flex items-center gap-2"><MapPin size={18} className="text-rose-400" /> Konum</h4>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest pl-1">Konum Tipi</label>
                    <select 
                      value={event.locationType} 
                      onChange={e => {
                         updateField('locationType', e.target.value);
                         if(e.target.value === 'tbd') updateField('locationDetails', '');
                      }}
                      className="w-full bg-black/40 border border-white/5 rounded-xl p-3.5 text-sm text-white outline-none appearance-none"
                    >
                      <option value="physical">Fiziksel Yeni/Adres</option>
                      <option value="online">Online (Zoom, Meet, vb.)</option>
                      <option value="tbd">Daha Sonra Açıklanacak</option>
                    </select>
                  </div>
                  {event.locationType !== 'tbd' && (
                     <div className="space-y-2">
                        <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest pl-1">
                           {event.locationType === 'online' ? 'Görüşme Linki' : 'Adres Detayı'}
                        </label>
                        <input 
                          type="text" 
                          value={event.locationDetails || ''} 
                          onChange={e => updateField('locationDetails', e.target.value)}
                          className="w-full bg-black/40 border border-white/5 rounded-xl p-3.5 text-sm text-white outline-none focus:border-indigo-500/50"
                          placeholder={event.locationType === 'online' ? "https://..." : "Açık adres..."}
                        />
                     </div>
                  )}
                </div>
             </div>
           </div>
         )}
         
         {activeTab === 'type' && (
            <div className="space-y-8 max-w-4xl">
               <div className="flex gap-4 p-1 bg-black/30 rounded-2xl w-fit">
                  <button 
                     onClick={() => updateField('eventType', 'rsvp')}
                     className={`px-6 py-2.5 rounded-xl text-sm font-bold transition-all ${event.eventType === 'rsvp' ? 'bg-indigo-600 text-white shadow-lg' : 'text-slate-400 hover:text-white hover:bg-white/5'}`}
                  >
                     LCV (Evet / Hayır Katılımı)
                  </button>
                  <button 
                     onClick={() => updateField('eventType', 'ticketed')}
                     className={`px-6 py-2.5 rounded-xl text-sm font-bold transition-all ${event.eventType === 'ticketed' ? 'bg-indigo-600 text-white shadow-lg' : 'text-slate-400 hover:text-white hover:bg-white/5'}`}
                  >
                     Biletli Etkinlik
                  </button>
               </div>

               {event.eventType === 'rsvp' ? (
                  <div className="bg-white/5 rounded-2xl p-6 border border-white/5 space-y-4 max-w-xl">
                     <h4 className="text-lg font-bold text-white mb-2">Katılım Ayarları</h4>
                     <label className="flex items-center gap-3 cursor-pointer">
                        <div className="relative">
                          <input 
                            type="checkbox" 
                            className="sr-only"
                            checked={event.showGuestList}
                            onChange={e => updateField('showGuestList', e.target.checked)}
                          />
                          <div className={`w-10 h-6 bg-slate-700 rounded-full transition-colors ${event.showGuestList ? 'bg-indigo-500' : ''}`}></div>
                          <div className={`absolute left-1 top-1 bg-white w-4 h-4 rounded-full transition-transform ${event.showGuestList ? 'translate-x-4' : ''}`}></div>
                        </div>
                        <div>
                          <p className="text-sm font-bold text-white">Katılımcı Listesini Göster</p>
                          <p className="text-[10px] text-slate-500">Öğrenciler diğer kimlerin katılacağını görebilir.</p>
                        </div>
                     </label>
                  </div>
               ) : (
                  <div className="space-y-6">
                     <div className="flex justify-between items-end">
                        <div>
                           <h4 className="text-lg font-bold text-white">Bilet Tipleri</h4>
                           <p className="text-sm text-slate-400">Ücretsiz bilet oluşturmak için fiyatı 0 (sıfır) bırakın.</p>
                        </div>
                        <button onClick={addTicket} className="bg-white/10 hover:bg-white/20 text-white px-4 py-2 rounded-xl text-sm font-bold transition-colors flex items-center gap-2">
                           <Plus size={16} /> Bilet Ekle
                        </button>
                     </div>

                     <div className="space-y-4">
                        {(event.tickets || []).map((ticket, idx) => (
                           <div key={ticket.id} className="bg-slate-900/80 border border-white/10 rounded-2xl p-5 flex flex-col md:flex-row gap-4 items-center relative group">
                              <button onClick={() => removeTicket(idx)} className="absolute top-4 right-4 p-2 bg-red-500/10 text-red-400 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-500/20">
                                <Trash2 size={16} />
                              </button>
                              
                              <div className="flex-1 w-full space-y-1">
                                 <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest pl-1">Bilet Adı</label>
                                 <input 
                                   type="text" 
                                   value={ticket.name}
                                   onChange={e => updateTicket(idx, { name: e.target.value })}
                                   className="w-full bg-black/40 border border-white/5 rounded-xl p-3 text-sm text-white outline-none"
                                 />
                              </div>
                              <div className="w-full md:w-32 space-y-1 md:ml-4">
                                 <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest pl-1">Fiyat (₺)</label>
                                 <input 
                                   type="number" 
                                   value={ticket.price}
                                   onChange={e => updateTicket(idx, { price: parseInt(e.target.value) || 0 })}
                                   className="w-full bg-black/40 border border-white/5 rounded-xl p-3 text-sm text-white outline-none"
                                 />
                              </div>
                              <div className="w-full md:w-32 space-y-1">
                                 <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest pl-1">Kapasite</label>
                                 <input 
                                   type="number" 
                                   value={ticket.capacity || ''}
                                   onChange={e => updateTicket(idx, { capacity: parseInt(e.target.value) || undefined })}
                                   placeholder="Sınırsız"
                                   className="w-full bg-black/40 border border-white/5 rounded-xl p-3 text-sm text-white outline-none"
                                 />
                              </div>
                           </div>
                        ))}
                        {(!event.tickets || event.tickets.length === 0) && (
                           <div className="text-center py-10 bg-white/5 rounded-2xl border border-white/5 text-slate-500 italic">
                              Hemen sağ üstten ilk biletinizi ekleyin.
                           </div>
                        )}
                     </div>

                     <div className="max-w-xs space-y-2 pt-4">
                       <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest pl-1">Kişi Başı Maks. Bilet Sayısı</label>
                       <input 
                         type="number" 
                         value={event.maxTicketsPerOrder || 1} 
                         onChange={e => updateField('maxTicketsPerOrder', parseInt(e.target.value) || 1)}
                         className="w-full bg-black/40 border border-white/5 rounded-xl p-3.5 text-sm text-white outline-none focus:border-indigo-500/50"
                       />
                     </div>
                  </div>
               )}
            </div>
         )}

         {activeTab === 'settings' && (
           <div className="max-w-2xl space-y-8">
              <div className="space-y-4">
                 <h4 className="text-white font-bold">Genel Görünürlük</h4>
                 <select 
                   value={event.status} 
                   onChange={e => updateField('status', e.target.value)}
                   className="w-full bg-black/40 border border-white/5 rounded-2xl p-4 text-white outline-none focus:border-indigo-500/50 appearance-none"
                 >
                   <option value="draft">Taslak (Hazırlanıyor)</option>
                   <option value="published">Yayında (Aktif)</option>
                 </select>
              </div>

              <div className="space-y-4 pt-6 border-t border-white/5">
                 <h4 className="text-white font-bold">Kapasite & Katılım</h4>
                 
                 <label className="flex items-center gap-3 bg-black/30 p-4 rounded-2xl border border-white/5 cursor-pointer hover:bg-black/50 transition-colors">
                   <div className="relative">
                     <input 
                       type="checkbox" 
                       className="sr-only"
                       checked={event.hasCapacityLimit}
                       onChange={e => updateField('hasCapacityLimit', e.target.checked)}
                     />
                     <div className={`w-10 h-6 bg-slate-700 rounded-full transition-colors ${event.hasCapacityLimit ? 'bg-indigo-500' : ''}`}></div>
                     <div className={`absolute left-1 top-1 bg-white w-4 h-4 rounded-full transition-transform ${event.hasCapacityLimit ? 'translate-x-4' : ''}`}></div>
                   </div>
                   <div>
                     <p className="text-sm font-bold text-white">Etkinlik Kapasite Sınırı Uygula</p>
                   </div>
                 </label>

                 {event.hasCapacityLimit && (
                   <div className="space-y-2 mt-4 ml-14">
                      <label className="text-xs font-black text-slate-500 uppercase tracking-widest pl-1">Genel Maks. Katılımcı Sayısı</label>
                      <input 
                        type="number" 
                        value={event.capacityLimit || ''} 
                        onChange={e => updateField('capacityLimit', parseInt(e.target.value) || 0)}
                        className="w-full bg-black/40 border border-white/5 rounded-2xl p-4 text-white outline-none focus:border-indigo-500/50"
                        placeholder="Örn: 100"
                      />
                   </div>
                 )}
              </div>
           </div>
         )}
      </div>
    </div>
  );
}
