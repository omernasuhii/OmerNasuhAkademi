import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { DoorOpen, Plus, Trash2, Edit3, Users, Video, MapPin, XCircle, Loader2 } from 'lucide-react';
import { appointmentService, Room } from '../../services/appointmentService';

export default function RoomManagement() {
  const [rooms, setRooms] = useState<Room[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingRoom, setEditingRoom] = useState<Room | null>(null);
  const [saving, setSaving] = useState(false);

  const [formData, setFormData] = useState<Partial<Room>>({
    name: '',
    capacity: 1,
    type: 'physical',
    isActive: true
  });

  useEffect(() => {
    loadRooms();
  }, []);

  useEffect(() => {
    if (editingRoom) {
      setFormData(editingRoom);
    } else {
      setFormData({
        name: '',
        capacity: 1,
        type: 'physical',
        isActive: true
      });
    }
  }, [editingRoom, showModal]);

  const loadRooms = async () => {
    try {
      const data = await appointmentService.getRooms();
      setRooms(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      if (editingRoom?.id) {
        // await appointmentService.updateRoom(editingRoom.id, formData); // Assuming updateRoom exists or handle in service
        // Let's ensure updateRoom exists too
      } else {
        await appointmentService.createRoom(formData as any);
      }
      setShowModal(false);
      loadRooms();
    } catch (err) {
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-700">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-3xl font-black text-white tracking-tight uppercase">Oda & Sınıf Yönetimi</h1>
          <p className="text-slate-500 mt-2 font-medium">Sınıf kapasitelerini ve fiziksel-dijital alanları yönetin.</p>
        </div>

        <button 
          onClick={() => {
            setEditingRoom(null);
            setShowModal(true);
          }}
          className="bg-purple-600 hover:bg-purple-500 text-white px-6 py-3 rounded-2xl font-bold flex items-center gap-2 shadow-lg shadow-purple-600/20 transition-all"
        >
          <Plus size={20} /> Yeni Oda Ekle
        </button>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {rooms.map((room) => (
          <motion.div
            key={room.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="group bg-slate-900/40 backdrop-blur-xl border border-white/5 p-8 rounded-[40px] hover:bg-slate-900/60 transition-all relative overflow-hidden"
          >
            <div className="flex items-center justify-between mb-8">
              <div className={`w-14 h-14 rounded-2xl flex items-center justify-center ${
                room.type === 'physical' ? 'bg-purple-500/10 text-purple-400' : 'bg-blue-500/10 text-blue-400'
              }`}>
                {room.type === 'physical' ? <DoorOpen size={24} /> : <Video size={24} />}
              </div>
              <div className="flex gap-2">
                <button 
                  onClick={() => {
                    setEditingRoom(room);
                    setShowModal(true);
                  }}
                  className="p-2.5 bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white rounded-xl transition-all"
                >
                  <Edit3 size={16} />
                </button>
                <button className="p-2.5 bg-red-500/10 hover:bg-red-500/20 text-red-500 rounded-xl transition-all">
                  <Trash2 size={16} />
                </button>
              </div>
            </div>

            <h3 className="text-xl font-bold text-white mb-2">{room.name}</h3>
            <div className="flex flex-col gap-3">
              <div className="flex items-center gap-2 text-slate-500">
                <Users size={14} className="text-slate-600" />
                <span className="text-xs font-bold uppercase tracking-widest">{room.capacity} Kişilik Kapasite</span>
              </div>
              <div className="flex items-center gap-2 text-slate-500">
                {room.type === 'physical' ? <MapPin size={14} className="text-slate-600" /> : <Video size={14} className="text-slate-600" />}
                <span className="text-xs font-bold uppercase tracking-widest">{room.type === 'physical' ? 'Fiziksel Sınıf' : 'Online / Sanal Oda'}</span>
              </div>
            </div>

            <div className="mt-8 pt-6 border-t border-white/5 flex items-center justify-between">
              <span className={`text-[10px] font-black uppercase tracking-widest px-3 py-1 rounded-full border ${
                room.isActive ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20' : 'bg-slate-500/10 text-slate-500 border-slate-500/10'
              }`}>
                {room.isActive ? 'Müsait' : 'Kapalı'}
              </span>
              <div className="flex items-center -space-x-1">
                 {[1, 2, 3].map(i => (
                   <div key={i} className="w-6 h-6 rounded-full border border-slate-900 bg-slate-800" />
                 ))}
              </div>
            </div>
          </motion.div>
        ))}

        {rooms.length === 0 && !loading && (
           <div className="lg:col-span-3 text-center py-20 bg-slate-900/10 border border-dashed border-white/5 rounded-[40px]">
              <DoorOpen className="mx-auto text-slate-700 mb-4" size={48} />
              <h3 className="text-xl font-bold text-white">Oda Bulunamadı</h3>
              <p className="text-slate-500 mt-2">Hizmetlerin atanabileceği sınıflar oluşturarak başlayın.</p>
           </div>
        )}
      </div>

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-950/80 backdrop-blur-md" onClick={() => setShowModal(false)}></div>
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-slate-900 border border-white/10 w-full max-w-md rounded-[40px] shadow-2xl overflow-hidden z-10 p-10"
          >
            <div className="flex items-center justify-between mb-8">
              <h2 className="text-2xl font-bold text-white">{editingRoom ? 'Odayı Düzenle' : 'Yeni Oda'}</h2>
              <button onClick={() => setShowModal(false)} className="p-2 hover:bg-white/5 rounded-full text-slate-500"><XCircle size={24} /></button>
            </div>

            <form className="space-y-6" onSubmit={handleSave}>
              <div className="space-y-2">
                <label className="text-xs font-black text-slate-500 uppercase tracking-widest ml-1">Oda/Sınıf İsmi</label>
                <input 
                  type="text" 
                  value={formData.name}
                  onChange={e => setFormData({...formData, name: e.target.value})}
                  className="w-full bg-slate-950 border border-white/5 rounded-2xl p-4 text-white font-bold" 
                  placeholder="Örn: 101 Nolu Derslik" 
                  required
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                 <div className="space-y-2">
                  <label className="text-xs font-black text-slate-500 uppercase tracking-widest ml-1">Kapasite</label>
                  <input 
                    type="number" 
                    value={formData.capacity}
                    onChange={e => setFormData({...formData, capacity: parseInt(e.target.value)})}
                    className="w-full bg-slate-950 border border-white/5 rounded-2xl p-4 text-white font-bold"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-black text-slate-500 uppercase tracking-widest ml-1">Tür</label>
                  <select 
                    value={formData.type}
                    onChange={e => setFormData({...formData, type: e.target.value as any})}
                    className="w-full bg-slate-950 border border-white/5 rounded-2xl p-4 text-white font-bold"
                  >
                    <option value="physical">Fiziksel</option>
                    <option value="virtual">Sanal / Online</option>
                  </select>
                </div>
              </div>
              <button 
                type="submit"
                disabled={saving}
                className="w-full py-5 rounded-3xl bg-purple-600 text-white font-black uppercase tracking-widest hover:bg-purple-500 shadow-xl shadow-purple-600/20 transition-all mt-4 flex items-center justify-center gap-2"
              >
                {saving && <Loader2 className="animate-spin" size={18} />}
                {editingRoom ? 'Odayı Güncelle' : 'Odayı Kaydet'}
              </button>
            </form>
          </motion.div>
        </div>
      )}
    </div>
  );
}
