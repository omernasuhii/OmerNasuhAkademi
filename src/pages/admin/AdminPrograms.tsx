import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Plus, Edit2, Trash2, Video, FileText, List, Eye, EyeOff, Save, X, Activity, Users, Star, ArrowRight, Settings, Image as ImageIcon
} from 'lucide-react';
import { programService, Program, ProgramStep } from '../../services/programService';

export default function AdminPrograms() {
  const [programs, setPrograms] = useState<Program[]>([]);
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [currentProgram, setCurrentProgram] = useState<Partial<Program> | null>(null);

  useEffect(() => {
    loadPrograms();
  }, []);

  const loadPrograms = async () => {
    setLoading(true);
    const data = await programService.getPrograms('admin');
    setPrograms(data);
    setLoading(false);
  };

  const handleEdit = (prog: Program) => {
    setCurrentProgram(prog);
    setIsEditing(true);
  };

  const handleCreate = () => {
    setCurrentProgram({
      title: '',
      description: '',
      completionType: 'flexible',
      isPaid: false,
      visibility: 'hidden',
      orderType: 'any',
      hideFutureSteps: false,
      steps: []
    });
    setIsEditing(true);
  };

  const handleSave = async () => {
    if (!currentProgram?.title) return;
    
    try {
      if (currentProgram.id) {
        await programService.updateProgram(currentProgram.id, currentProgram);
      } else {
        await programService.createProgram(currentProgram as Omit<Program, 'id' | 'createdAt' | 'enrolledCount'>);
      }
      setIsEditing(false);
      loadPrograms();
    } catch (e) {
      console.error(e);
      alert('Kaydedilirken hata oluştu.');
    }
  };

  const handleDelete = async (id: string) => {
    if (window.confirm('Bu programı silmek istediğinize emin misiniz?')) {
      await programService.deleteProgram(id);
      loadPrograms();
    }
  };

  if (loading && !isEditing) {
    return (
      <div className="flex-1 p-6 md:p-10 flex flex-col items-center justify-center min-h-[60vh]">
        <div className="w-16 h-16 border-4 border-indigo-500/20 border-t-indigo-500 rounded-full animate-spin mb-4" />
        <h2 className="text-xl font-bold text-white mb-2">Programlar Yükleniyor...</h2>
      </div>
    );
  }

  if (isEditing && currentProgram) {
    return (
      <ProgramEditor 
        program={currentProgram as Program} 
        setProgram={setCurrentProgram}
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
            Online Programlar
          </h1>
          <p className="text-slate-500 max-w-xl">
             Yönetici olarak tüm etkileşimli gelişim programlarını buradan oluşturabilir, düzenleyebilir ve yayınlayabilirsiniz.
          </p>
        </div>
        <button 
          onClick={handleCreate}
          className="flex items-center gap-2 px-6 py-3 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-2xl transition-all shadow-lg hover:scale-105"
        >
          <Plus size={20} /> Yeni Program Ekle
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
        {programs.map((prog, idx) => (
          <motion.div
            key={prog.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: idx * 0.1 }}
            className="bg-slate-900/50 backdrop-blur-md rounded-2xl border border-white/5 p-6 hover:bg-slate-800/50 transition-colors flex flex-col overflow-hidden relative group"
          >
            {prog.visibility === 'public' ? (
               <div className="absolute top-4 right-4 bg-emerald-500/10 text-emerald-400 px-2 py-1 rounded text-xs font-black uppercase tracking-widest border border-emerald-500/20 flex items-center gap-1">
                 <Eye size={14} /> Açık
               </div>
            ) : (
               <div className="absolute top-4 right-4 bg-slate-800 text-slate-400 px-2 py-1 rounded text-xs font-black uppercase tracking-widest border border-white/5 flex items-center gap-1">
                 <EyeOff size={14} /> {prog.visibility === 'private' ? 'Özel' : 'Gizli'}
               </div>
            )}
            
            <h3 className="text-xl font-bold text-white mb-2 pr-20">{prog.title}</h3>
            <p className="text-slate-400 text-sm mb-6 line-clamp-2 flex-1">{prog.description}</p>
            
            <div className="grid grid-cols-2 gap-4 mb-6">
               <div className="bg-black/20 rounded-xl p-3 border border-white/5">
                 <div className="flex items-center gap-1.5 text-slate-500 mb-1">
                    <List size={14} /> <span className="text-[10px] uppercase font-bold tracking-widest">Adım Sayısı</span>
                 </div>
                 <p className="text-lg font-black text-white">{prog.steps?.length || 0}</p>
               </div>
               <div className="bg-black/20 rounded-xl p-3 border border-white/5">
                 <div className="flex items-center gap-1.5 text-slate-500 mb-1">
                    <Users size={14} /> <span className="text-[10px] uppercase font-bold tracking-widest">Katılımcı</span>
                 </div>
                 <p className="text-lg font-black text-white">{prog.enrolledCount}</p>
               </div>
            </div>

            <div className="flex items-center gap-2 pt-4 border-t border-white/5">
              <button 
                onClick={() => handleEdit(prog)}
                className="flex-1 bg-white/5 hover:bg-indigo-500/20 hover:text-indigo-400 text-white py-2 rounded-xl text-sm font-bold transition-colors border border-white/5 hover:border-indigo-500/30 flex items-center justify-center gap-2"
              >
                <Edit2 size={16} /> Düzenle
              </button>
              <button 
                onClick={() => prog.id && handleDelete(prog.id)}
                className="p-2 bg-white/5 hover:bg-red-500/20 hover:text-red-400 text-slate-400 rounded-xl transition-colors border border-white/5"
              >
                <Trash2 size={16} />
              </button>
            </div>
          </motion.div>
        ))}
        {programs.length === 0 && (
           <div className="col-span-full py-20 text-center border-2 border-dashed border-white/5 rounded-3xl">
             <Activity className="w-16 h-16 text-slate-600 mx-auto mb-4" />
             <p className="text-slate-400 font-medium">Henüz hiç online program oluşturmadınız.</p>
           </div>
        )}
      </div>
    </div>
  );
}

function ProgramEditor({ program, setProgram, onSave, onCancel }: { program: Partial<Program>, setProgram: Function, onSave: () => void, onCancel: () => void }) {
  const [activeTab, setActiveTab] = useState<'details' | 'steps' | 'settings'>('details');

  const updateField = (field: keyof Program, value: any) => {
    setProgram((prev: any) => ({ ...prev, [field]: value }));
  };

  const addStep = () => {
    const newStep: ProgramStep = {
      id: Math.random().toString(36).substr(2, 9),
      title: 'Yeni Adım',
      type: 'text',
      content: '',
      order: (program.steps?.length || 0) + 1
    };
    updateField('steps', [...(program.steps || []), newStep]);
  };

  const updateStep = (idx: number, updates: Partial<ProgramStep>) => {
    const newSteps = [...(program.steps || [])];
    newSteps[idx] = { ...newSteps[idx], ...updates };
    updateField('steps', newSteps);
  };

  const removeStep = (idx: number) => {
    const newSteps = [...(program.steps || [])];
    newSteps.splice(idx, 1);
    updateField('steps', newSteps);
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
             {program.id ? 'Programı Düzenle' : 'Yeni Program Oluştur'}
           </h2>
         </div>
         <button onClick={onSave} className="bg-indigo-600 hover:bg-indigo-500 text-white px-6 py-2 rounded-xl font-bold flex items-center gap-2">
            <Save size={18} /> Kaydet
         </button>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-1 border-b border-white/5 px-6 pt-4">
        {[
          { id: 'details', label: 'Genel Bilgiler', icon: FileText },
          { id: 'steps', label: 'Program Adımları', icon: List },
          { id: 'settings', label: 'Erişim ve Ayarlar', icon: Settings },
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
      <div className="flex-1 p-6 overflow-y-auto max-h-[70vh] custom-scrollbar">
         {activeTab === 'details' && (
           <div className="max-w-2xl space-y-6">
             <div className="space-y-2">
                <label className="text-xs font-black text-slate-500 uppercase tracking-widest pl-1">Program Başlığı</label>
                <input 
                  type="text" 
                  value={program.title || ''} 
                  onChange={e => updateField('title', e.target.value)}
                  className="w-full bg-black/40 border border-white/5 rounded-2xl p-4 text-white font-bold text-lg outline-none focus:border-indigo-500/50"
                  placeholder="Başarı İçin Uykunu Yönet..."
                />
             </div>
             <div className="space-y-2">
                <label className="text-xs font-black text-slate-500 uppercase tracking-widest pl-1">Açıklama</label>
                <textarea 
                  rows={4}
                  value={program.description || ''} 
                  onChange={e => updateField('description', e.target.value)}
                  className="w-full bg-black/40 border border-white/5 rounded-2xl p-4 text-slate-300 outline-none focus:border-indigo-500/50 resize-none"
                  placeholder="Program hakkında detaylı bilgi verin..."
                />
             </div>
             <div className="space-y-2">
                <label className="text-xs font-black text-slate-500 uppercase tracking-widest pl-1">Özet Kapak Görseli URL</label>
                 <div className="flex gap-2">
                    <div className="w-12 h-12 bg-black/40 rounded-xl border border-white/5 flex items-center justify-center shrink-0">
                      <ImageIcon size={20} className="text-slate-600" />
                    </div>
                    <input 
                      type="text" 
                      value={program.image || ''} 
                      onChange={e => updateField('image', e.target.value)}
                      className="w-full bg-black/40 border border-white/5 rounded-2xl p-3 text-white outline-none focus:border-indigo-500/50"
                      placeholder="https://..."
                    />
                 </div>
             </div>
             
             <div className="grid grid-cols-2 gap-4 pt-4 border-t border-white/5">
                <div className="space-y-2">
                  <label className="text-xs font-black text-slate-500 uppercase tracking-widest pl-1">Tamamlama Türü</label>
                  <select 
                    value={program.completionType} 
                    onChange={e => updateField('completionType', e.target.value)}
                    className="w-full bg-black/40 border border-white/5 rounded-2xl p-4 text-white outline-none focus:border-indigo-500/50 appearance-none"
                  >
                    <option value="flexible">Esnek Zamanlı (İstediğinde Tamamla)</option>
                    <option value="scheduled">Belirli Günlerde / Tarihlerde</option>
                  </select>
                </div>
                {program.completionType === 'flexible' ? (
                   <div className="space-y-2">
                    <label className="text-xs font-black text-slate-500 uppercase tracking-widest pl-1">Zaman Sınırı (Gün)</label>
                    <input 
                      type="number" 
                      value={program.timeLimitDays || ''} 
                      onChange={e => updateField('timeLimitDays', parseInt(e.target.value))}
                      className="w-full bg-black/40 border border-white/5 rounded-2xl p-4 text-white outline-none focus:border-indigo-500/50"
                      placeholder="Boş bırakılabilir"
                    />
                  </div>
                ) : (
                  <div className="space-y-2">
                    <label className="text-xs font-black text-slate-500 uppercase tracking-widest pl-1">Başlama Tarihi</label>
                    <input 
                      type="date" 
                      value={program.startDate || ''} 
                      onChange={e => updateField('startDate', e.target.value)}
                      className="w-full bg-black/40 border border-white/5 rounded-2xl p-4 text-white outline-none focus:border-indigo-500/50 [color-scheme:dark]"
                    />
                  </div>
                )}
             </div>
           </div>
         )}
         
         {activeTab === 'steps' && (
            <div className="space-y-6 max-w-4xl">
               <div className="flex justify-between items-center bg-black/20 p-4 border border-white/5 rounded-2xl mb-6">
                 <div>
                    <h3 className="text-white font-bold">Program Adımları İçeriği</h3>
                    <p className="text-sm text-slate-500">Öğrencilerin etkileşime gireceği medya veya görevleri sıralı olarak ekleyin.</p>
                 </div>
                 <button onClick={addStep} className="bg-white/10 hover:bg-white/20 text-white px-4 py-2 rounded-xl text-sm font-bold transition-colors flex items-center gap-2">
                   <Plus size={16} /> Adım Ekle
                 </button>
               </div>
               
               {program.steps && program.steps.length > 0 ? (
                 <div className="space-y-4">
                    {program.steps.map((step, idx) => (
                       <div key={step.id} className="bg-slate-900/80 border border-indigo-500/20 rounded-2xl p-5 flex flex-col gap-4 relative group">
                          <button onClick={() => removeStep(idx)} className="absolute top-4 right-4 p-2 bg-red-500/10 text-red-400 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-500/20">
                            <Trash2 size={16} />
                          </button>
                          
                          <div className="flex items-center gap-4 mr-10">
                            <div className="w-8 h-8 rounded-full bg-indigo-500/20 text-indigo-400 flex items-center justify-center font-black shrink-0 border border-indigo-500/30">
                              {idx + 1}
                            </div>
                            <input 
                              type="text" 
                              value={step.title}
                              onChange={e => updateStep(idx, { title: e.target.value })}
                              className="flex-1 bg-transparent border-none outline-none text-white font-bold text-lg"
                              placeholder="Adım Başlığı (Örn: Giriş Mülakatı)"
                            />
                          </div>

                          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 p-4 bg-black/30 rounded-xl border border-white/5">
                            <div className="md:col-span-1 space-y-2">
                               <label className="text-[10px] uppercase font-black text-slate-500 tracking-widest pl-1">İçerik Türü</label>
                               <select 
                                 value={step.type}
                                 onChange={e => updateStep(idx, { type: e.target.value as any })}
                                 className="w-full bg-slate-900 border border-white/10 rounded-xl p-2.5 text-sm text-white outline-none appearance-none"
                               >
                                  <option value="text">Salt Metin</option>
                                  <option value="photo_video">Fotoğraf / Video</option>
                                  <option value="audio">Ses Dosyası</option>
                                  <option value="quiz">Soru / Kod (Quiz)</option>
                                  <option value="file">Dosya (PDF, vb.)</option>
                               </select>
                            </div>
                            <div className="md:col-span-3 space-y-2">
                               <label className="text-[10px] uppercase font-black text-slate-500 tracking-widest pl-1">İçerik Detayı / URL / Metin</label>
                               <textarea
                                 value={step.content}
                                 onChange={e => updateStep(idx, { content: e.target.value })}
                                 className="w-full bg-slate-900 border border-white/10 rounded-xl p-3 text-sm text-white outline-none min-h-[80px]"
                                 placeholder={step.type === 'photo_video' ? "Video URL'si veya embed kodu girin" : "Miting/yönerge detayı"}
                               />
                            </div>
                          </div>
                       </div>
                    ))}
                 </div>
               ) : (
                 <div className="text-center py-10 bg-white/5 rounded-2xl border border-white/5 text-slate-500 italic">
                    Henüz adım eklemediniz.
                 </div>
               )}
            </div>
         )}

         {activeTab === 'settings' && (
           <div className="max-w-2xl space-y-6">
              <div className="grid grid-cols-2 gap-4">
                 <div className="space-y-2">
                    <label className="text-xs font-black text-slate-500 uppercase tracking-widest pl-1">Görünürlük</label>
                    <select 
                      value={program.visibility} 
                      onChange={e => updateField('visibility', e.target.value)}
                      className="w-full bg-black/40 border border-white/5 rounded-2xl p-4 text-white outline-none focus:border-indigo-500/50 appearance-none"
                    >
                      <option value="hidden">Gizli (Taslak)</option>
                      <option value="private">Özel (Sadece Link ile / Belirli Gruplara)</option>
                      <option value="public">Açık (Herkese Genel)</option>
                    </select>
                 </div>
                 
                 <div className="space-y-2">
                    <label className="text-xs font-black text-slate-500 uppercase tracking-widest pl-1">Grup Aboneliği</label>
                    <select 
                      value={program.groupId || ''} 
                      onChange={e => updateField('groupId', e.target.value)}
                      className="w-full bg-black/40 border border-white/5 rounded-2xl p-4 text-white outline-none focus:border-indigo-500/50 appearance-none"
                    >
                      <option value="">Grup Yok (Tüm Kullanıcılara Göre)</option>
                      <option value="pro_group">Premium Öğrenciler</option>
                      <option value="beta_group">Beta Test Grubu</option>
                    </select>
                 </div>
              </div>

              <div className="grid grid-cols-2 gap-4 pt-4 border-t border-white/5">
                 <div className="space-y-4">
                   <label className="flex items-center gap-3 bg-black/30 p-4 rounded-2xl border border-white/5 cursor-pointer hover:bg-black/50 transition-colors">
                     <div className="relative">
                       <input 
                         type="checkbox" 
                         className="sr-only"
                         checked={program.orderType === 'fixed'}
                         onChange={e => updateField('orderType', e.target.checked ? 'fixed' : 'any')}
                       />
                       <div className={`w-10 h-6 bg-slate-700 rounded-full transition-colors ${program.orderType === 'fixed' ? 'bg-indigo-500' : ''}`}></div>
                       <div className={`absolute left-1 top-1 bg-white w-4 h-4 rounded-full transition-transform ${program.orderType === 'fixed' ? 'translate-x-4' : ''}`}></div>
                     </div>
                     <div>
                       <p className="text-sm font-bold text-white">Sabit Adım Sırası</p>
                       <p className="text-[10px] text-slate-500 mt-1">Öğrenci bir öncekini bitirmeden diğerine geçemez.</p>
                     </div>
                   </label>
                   
                   {program.orderType === 'fixed' && (
                      <label className="flex items-center gap-3 bg-black/30 p-4 rounded-2xl border border-white/5 cursor-pointer hover:bg-black/50 transition-colors">
                        <div className="relative">
                          <input 
                            type="checkbox" 
                            className="sr-only"
                            checked={program.hideFutureSteps}
                            onChange={e => updateField('hideFutureSteps', e.target.checked)}
                          />
                          <div className={`w-10 h-6 bg-slate-700 rounded-full transition-colors ${program.hideFutureSteps ? 'bg-indigo-500' : ''}`}></div>
                          <div className={`absolute left-1 top-1 bg-white w-4 h-4 rounded-full transition-transform ${program.hideFutureSteps ? 'translate-x-4' : ''}`}></div>
                        </div>
                        <div>
                          <p className="text-sm font-bold text-white">Gelecekteki Adımları Gizle</p>
                        </div>
                      </label>
                   )}
                 </div>

                 <div className="space-y-4">
                   <div className="space-y-2">
                     <label className="text-xs font-black text-slate-500 uppercase tracking-widest pl-1">Ücret Tipi</label>
                     <select 
                        value={program.isPaid ? 'paid' : 'free'} 
                        onChange={e => updateField('isPaid', e.target.value === 'paid')}
                        className="w-full bg-black/40 border border-white/5 rounded-2xl p-4 text-white outline-none focus:border-indigo-500/50 appearance-none"
                      >
                        <option value="free">Ücretsiz</option>
                        <option value="paid">Ücretli</option>
                     </select>
                   </div>
                   {program.isPaid && (
                     <div className="space-y-2">
                        <label className="text-xs font-black text-slate-500 uppercase tracking-widest pl-1">Fiyat (₺)</label>
                        <input 
                          type="number" 
                          value={program.price || ''} 
                          onChange={e => updateField('price', parseInt(e.target.value))}
                          className="w-full bg-black/40 border border-white/5 rounded-2xl p-4 text-white outline-none focus:border-indigo-500/50"
                        />
                     </div>
                   )}
                 </div>
              </div>
              
              <div className="space-y-2 pt-4 border-t border-white/5">
                <label className="text-xs font-black text-slate-500 uppercase tracking-widest pl-1">Program Sonu Ödülü (İsteğe Bağlı)</label>
                <div className="flex gap-2">
                   <div className="w-12 h-12 bg-amber-500/10 rounded-xl border border-amber-500/20 flex items-center justify-center shrink-0">
                     <Star size={20} className="text-amber-500" />
                   </div>
                   <input 
                     type="text" 
                     value={program.rewardName || ''} 
                     onChange={e => updateField('rewardName', e.target.value)}
                     className="w-full bg-black/40 border border-white/5 rounded-2xl p-3 text-white outline-none focus:border-amber-500/50"
                     placeholder="Örn: Katıılım Sertifikası, %10 İndirim Kuponu"
                   />
                </div>
              </div>
           </div>
         )}
      </div>
    </div>
  );
}
