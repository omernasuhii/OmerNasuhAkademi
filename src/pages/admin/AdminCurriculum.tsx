import React, { useState, useEffect } from 'react';
import { Calendar, Layers, Map, Search, Edit2, Plus, Clock, FileText, Trash2, X, Check, Save } from 'lucide-react';
import { studentDataService } from '../../services/studentDataService';
import { useCurriculum } from '../../lib/CurriculumContext';

export default function AdminCurriculum() {
  const [searchTerm, setSearchTerm] = useState('');
  const [plans, setPlans] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingPlan, setEditingPlan] = useState<any>(null);
  
  const [managingContentForPlan, setManagingContentForPlan] = useState<any>(null);

  const [formData, setFormData] = useState({
    title: '',
    type: 'TYT Kampı',
    duration: '',
    weeks: 4,
    status: 'Aktif',
    description: ''
  });

  useEffect(() => {
    loadPlans();
  }, []);

  const loadPlans = async () => {
    setLoading(true);
    const data = await studentDataService.getGlobalCurriculumPlans();
    setPlans(data || []);
    setLoading(false);
  };

  const handleOpenModal = (plan: any = null) => {
    if (plan) {
      setEditingPlan(plan);
      setFormData({
        title: plan.title || '',
        type: plan.type || 'TYT Kampı',
        duration: plan.duration || '',
        weeks: plan.weeks || 4,
        status: plan.status || 'Aktif',
        description: plan.description || ''
      });
    } else {
      setEditingPlan(null);
      setFormData({
        title: '',
        type: 'TYT Kampı',
        duration: '',
        weeks: 4,
        status: 'Aktif',
        description: ''
      });
    }
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingPlan(null);
  };

  const handleSavePlan = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title) {
      alert('Lütfen şablon adını girin.');
      return;
    }

    const planToSave = {
      ...(editingPlan || {}),
      ...formData
    };

    try {
      await studentDataService.saveGlobalCurriculumPlan(planToSave);
      await loadPlans();
      handleCloseModal();
    } catch (error) {
      alert('Şablon kaydedilirken bir hata oluştu');
    }
  };

  const handleDeletePlan = async (id: string) => {
    if (window.confirm('Bu şablonu silmek istediğinize emin misiniz?')) {
      try {
        await studentDataService.deleteGlobalCurriculumPlan(id);
        await loadPlans();
      } catch (error) {
        alert('Şablon silinirken bir hata oluştu');
      }
    }
  };

  const openContentManager = (plan: any) => {
    setManagingContentForPlan({ ...plan, content: plan.content || {} });
  };
  
  const filteredPlans = plans.filter(p => p.title?.toLowerCase().includes(searchTerm.toLowerCase()));

  if (managingContentForPlan) {
    return <CurriculumContentEditor plan={managingContentForPlan} onBack={async () => { setManagingContentForPlan(null); await loadPlans(); }} />;
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-white tracking-tight uppercase">Müfredat ve Program Yönetimi</h1>
          <p className="text-slate-400 text-sm">Haftalık ders programı şablonlarını, öğrenci kamplarını ve akademik planları yönetin.</p>
        </div>
        <button
          onClick={() => handleOpenModal()}
          className="flex items-center gap-2 bg-emerald-500 hover:bg-emerald-600 text-white px-4 py-2 rounded-lg font-bold transition-colors"
        >
          <Plus size={20} />
          Yeni Şablon Oluştur
        </button>
      </div>

      <div className="flex flex-col md:flex-row gap-4">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
          <input
            type="text"
            placeholder="Şablon veya kamp adı ara..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-slate-800 border border-white/10 rounded-lg pl-10 pr-4 py-2 text-sm text-white placeholder-slate-500 outline-none focus:border-emerald-500/50"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {loading ? (
          <div className="col-span-full p-12 text-center text-slate-400">Yükleniyor...</div>
        ) : (
          <>
            {filteredPlans.map(plan => (
              <div key={plan.id} className="bg-slate-800/50 rounded-xl border border-white/10 overflow-hidden flex flex-col group hover:border-emerald-500/50 transition-colors">
                <div className="p-5 border-b border-white/10 bg-slate-800 relative">
                  <span className={`absolute top-4 right-4 px-2 py-1 rounded text-[10px] font-bold ${
                    plan.status === 'Aktif' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-rose-500/20 text-rose-400'
                  }`}>
                    {plan.status}
                  </span>
                  <div className="w-10 h-10 rounded-lg bg-emerald-500/20 flex items-center justify-center text-emerald-400 mb-3">
                    <Calendar size={20} />
                  </div>
                  <h3 className="text-lg font-bold text-white mb-1 line-clamp-1" title={plan.title}>{plan.title}</h3>
                  <div className="text-sm text-emerald-400">{plan.type}</div>
                </div>
                
                <div className="p-5 flex-1 flex flex-col justify-between">
                  <div className="space-y-3 mb-6">
                    <div className="flex items-center gap-3 text-slate-300 text-sm">
                      <Clock size={16} className="text-slate-500" />
                      <span>Süre: <strong className="text-white">{plan.duration || '-'}</strong></span>
                    </div>
                    <div className="flex items-center gap-3 text-slate-300 text-sm">
                      <Layers size={16} className="text-slate-500" />
                      <span>Hafta Sayısı: <strong className="text-white">{plan.weeks || 0} Hafta</strong></span>
                    </div>
                    {plan.description && (
                      <div className="text-xs text-slate-400 line-clamp-2 mt-2">{plan.description}</div>
                    )}
                  </div>
                  
                  <div className="flex gap-2 mt-auto">
                    <button onClick={() => openContentManager(plan)} className="flex-1 bg-white/5 hover:bg-white/10 text-white text-sm font-medium py-2 rounded transition-colors flex items-center justify-center gap-2">
                      <FileText size={16} />
                      İçeriği Gör
                    </button>
                    <button onClick={() => handleOpenModal(plan)} className="bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 p-2 rounded transition-colors">
                      <Edit2 size={16} />
                    </button>
                    <button onClick={() => handleDeletePlan(plan.id)} className="bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 p-2 rounded transition-colors">
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
              </div>
            ))}

            <button onClick={() => handleOpenModal()} className="bg-slate-800/30 rounded-xl border-2 border-dashed border-white/10 hover:border-emerald-500/50 hover:bg-emerald-500/5 transition-all outline-none flex flex-col items-center justify-center text-slate-400 hover:text-emerald-400 min-h-[250px]">
              <Plus size={32} className="mb-2" />
              <span className="font-bold">Yeni Şablon</span>
            </button>
          </>
        )}
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-white/10 sm:rounded-2xl p-6 w-full max-w-2xl h-full sm:h-auto max-h-screen sm:max-h-[90vh] overflow-y-auto">
            <h2 className="text-xl font-black text-white mb-6 uppercase tracking-tight">
              {editingPlan ? 'Şablonu Düzenle' : 'Yeni Şablon Oluştur'}
            </h2>
            
            <form onSubmit={handleSavePlan} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="col-span-2">
                  <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Şablon Adı</label>
                  <input
                    type="text"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    className="w-full bg-black/20 border border-white/10 rounded-lg p-3 text-sm text-white outline-none focus:border-emerald-500/50"
                    placeholder="Örn: TYT Matematik 30 Günde Bitirme Kampı"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Hedef Türü</label>
                  <select
                    value={formData.type}
                    onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                    className="w-full bg-black/20 border border-white/10 rounded-lg p-3 text-sm text-white outline-none focus:border-emerald-500/50"
                  >
                    <option value="TYT Kampı">TYT Kampı</option>
                    <option value="AYT Kampı">AYT Kampı</option>
                    <option value="TYT Dönemlik">TYT Dönemlik</option>
                    <option value="AYT Dönemlik">AYT Dönemlik</option>
                    <option value="Ara Sınıf Programı">Ara Sınıf Programı</option>
                    <option value="Soru Çözüm Kategorisi">Soru Çözüm Kategorisi</option>
                    <option value="DİĞER">DİĞER</option>
                  </select>
                </div>
                
                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Durum</label>
                  <select
                    value={formData.status}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                    className="w-full bg-black/20 border border-white/10 rounded-lg p-3 text-sm text-white outline-none focus:border-emerald-500/50"
                  >
                    <option value="Aktif">Aktif</option>
                    <option value="Pasif">Pasif</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Süre (Metin)</label>
                  <input
                    type="text"
                    value={formData.duration}
                    onChange={(e) => setFormData({ ...formData, duration: e.target.value })}
                    className="w-full bg-black/20 border border-white/10 rounded-lg p-3 text-sm text-white outline-none focus:border-emerald-500/50"
                    placeholder="Örn: 4 Hafta"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Hafta Sayısı</label>
                  <input
                    type="number"
                    min="1"
                    max="52"
                    value={formData.weeks}
                    onChange={(e) => setFormData({ ...formData, weeks: parseInt(e.target.value) || 1 })}
                    className="w-full bg-black/20 border border-white/10 rounded-lg p-3 text-sm text-white outline-none focus:border-emerald-500/50"
                  />
                </div>

                <div className="col-span-2">
                  <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Açıklama</label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    className="w-full bg-black/20 border border-white/10 rounded-lg p-3 text-sm text-white outline-none focus:border-emerald-500/50"
                    rows={3}
                    placeholder="Bu şablon hakkında özet bilgi..."
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-6 border-t border-white/10">
                <button
                  type="button"
                  onClick={handleCloseModal}
                  className="px-6 py-2 text-sm font-bold text-slate-400 hover:text-white transition-colors"
                >
                  İptal
                </button>
                <button
                  type="submit"
                  className="px-6 py-2 bg-emerald-500 hover:bg-emerald-600 text-white text-sm font-bold rounded-lg transition-colors"
                >
                  {editingPlan ? 'Güncelle' : 'Kaydet'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

function CurriculumContentEditor({ plan, onBack }: { plan: any, onBack: () => void }) {
  const { curriculum } = useCurriculum();
  const [content, setContent] = useState<any>(plan.content || {});
  const [selectedWeek, setSelectedWeek] = useState(1);
  const [selectedDay, setSelectedDay] = useState(1);
  const [saving, setSaving] = useState(false);

  const saveContent = async () => {
    setSaving(true);
    try {
      await studentDataService.saveGlobalCurriculumPlan({ ...plan, content });
      alert('İçerik başarıyla kaydedildi.');
    } catch (error) {
      alert('Kaydedilirken hata oluştu.');
    }
    setSaving(false);
  };

  const getDayTasks = () => {
    return content[selectedWeek]?.[selectedDay] || [];
  };

  const addTask = () => {
    const newContent = { ...content };
    if (!newContent[selectedWeek]) newContent[selectedWeek] = {};
    if (!newContent[selectedWeek][selectedDay]) newContent[selectedWeek][selectedDay] = [];
    
    newContent[selectedWeek][selectedDay].push({
      id: Math.random().toString(36).substring(2, 9),
      subject: '',
      topic: '',
      type: 'Konu Çalışması',
      questionCount: 0,
      note: ''
    });
    setContent(newContent);
  };

  const updateTask = (taskId: string, field: string, value: any) => {
    const newContent = { ...content };
    const tasks = newContent[selectedWeek][selectedDay];
    const taskIndex = tasks.findIndex((t: any) => t.id === taskId);
    if (taskIndex > -1) {
      tasks[taskIndex][field] = value;
      setContent(newContent);
    }
  };

  const removeTask = (taskId: string) => {
    const newContent = { ...content };
    newContent[selectedWeek][selectedDay] = newContent[selectedWeek][selectedDay].filter((t: any) => t.id !== taskId);
    setContent(newContent);
  };

  const maxWeeks = plan.weeks || 1;
  const days = ['1. Gün', '2. Gün', '3. Gün', '4. Gün', '5. Gün', '6. Gün', '7. Gün'];

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <button onClick={onBack} className="text-sm font-bold text-slate-400 hover:text-white transition-colors mb-2 flex items-center gap-2">
            <X size={16} /> Geri Dön
          </button>
          <h1 className="text-2xl font-black text-white tracking-tight uppercase flex items-center gap-3">
            <Layers className="text-emerald-500" />
            {plan.title} - İçerik
          </h1>
        </div>
        <button
          onClick={saveContent}
          disabled={saving}
          className="flex items-center gap-2 bg-emerald-500 hover:bg-emerald-600 text-white px-6 py-2 rounded-lg font-bold transition-colors disabled:opacity-50"
        >
          <Save size={20} />
          {saving ? 'Kaydediliyor...' : 'Tüm İçeriği Kaydet'}
        </button>
      </div>

      <div className="flex flex-col lg:flex-row gap-6">
        <div className="lg:w-64 shrink-0 space-y-4">
          <div className="bg-slate-800 rounded-xl border border-white/5 p-4 max-h-[600px] overflow-y-auto w-full">
             <h3 className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-4 px-2">Haftalar</h3>
             <div className="space-y-1">
               {Array.from({ length: maxWeeks }).map((_, i) => {
                 const w = i + 1;
                 const isActive = selectedWeek === w;
                 return (
                   <button
                     key={w}
                     onClick={() => setSelectedWeek(w)}
                     className={`w-full text-left px-4 py-3 rounded-lg text-sm font-bold transition-all ${
                       isActive ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' : 'text-slate-400 hover:bg-white/5 hover:text-white border border-transparent'
                     }`}
                   >
                     {w}. Hafta
                   </button>
                 );
               })}
             </div>
          </div>
        </div>

        <div className="flex-1 space-y-6">
           <div className="bg-slate-800/50 rounded-xl border border-white/5 overflow-hidden">
             <div className="overflow-x-auto">
               <div className="grid grid-cols-7 border-b border-white/5 min-w-[700px]">
                  {days.map((dayName, index) => {
                  const d = index + 1;
                  const isActive = selectedDay === d;
                  const taskCount = content[selectedWeek]?.[d]?.length || 0;
                  return (
                    <button
                      key={d}
                      onClick={() => setSelectedDay(d)}
                      className={`p-4 flex flex-col items-center justify-center gap-1 transition-colors border-r border-white/5 last:border-0 ${
                        isActive ? 'bg-emerald-500/10' : 'hover:bg-white/5 bg-slate-900/40'
                      }`}
                    >
                      <span className={`text-[11px] font-black uppercase tracking-widest ${isActive ? 'text-emerald-400' : 'text-slate-500'}`}>{dayName}</span>
                      {taskCount > 0 && (
                        <span className="text-[10px] font-bold bg-white/10 text-slate-300 px-2 py-0.5 rounded-full">{taskCount} Görev</span>
                      )}
                    </button>
                  );
                })}
             </div>
             </div>

             <div className="p-6">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-sm font-bold text-white uppercase tracking-wider">{selectedWeek}. Hafta - {selectedDay}. Gün İçeriği</h3>
                  <button onClick={addTask} className="text-xs font-bold bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 px-3 py-1.5 rounded-lg flex items-center gap-2 transition-colors">
                    <Plus size={14} /> Görev Ekle
                  </button>
                </div>

                <div className="space-y-4">
                  {getDayTasks().length === 0 ? (
                    <div className="text-center py-12 text-slate-500 text-sm border-2 border-dashed border-white/5 rounded-xl">
                      Bu güne henüz görev eklenmemiş.<br/>
                      Yeni bir görev ekleyerek programı zenginleştirin.
                    </div>
                  ) : (
                    getDayTasks().map((task: any, idx: number) => (
                      <div key={task.id} className="bg-black/20 border border-white/5 rounded-xl p-4 flex flex-col md:flex-row gap-4 items-start md:items-center">
                        <div className="shrink-0 w-6 h-6 rounded-full bg-slate-800 flex items-center justify-center text-xs font-bold text-slate-400">
                          {idx + 1}
                        </div>
                        <div className="flex-1 grid grid-cols-1 md:grid-cols-12 gap-4 w-full">
                          <div className="md:col-span-3">
                            <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Ders</label>
                            <select
                              value={task.subject}
                              onChange={(e) => {
                                updateTask(task.id, 'subject', e.target.value);
                                updateTask(task.id, 'topic', ''); // Reset topic when subject changes
                              }}
                              className="w-full bg-slate-900 border border-white/10 rounded-lg px-3 py-2 text-sm text-white outline-none focus:border-emerald-500/50"
                            >
                              <option value="">Ders Seçin</option>
                              {Object.keys(curriculum).map(subj => (
                                <option key={subj} value={subj}>{subj}</option>
                              ))}
                              <option value="DİĞER">DİĞER</option>
                            </select>
                          </div>
                          <div className="md:col-span-4">
                            <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Konu / İçerik</label>
                            {task.subject && task.subject !== 'DİĞER' && curriculum[task.subject] ? (
                              <div className="flex flex-col gap-2">
                                <select
                                  value={task.topic === 'DİĞER' ? 'DİĞER' : (curriculum[task.subject].includes(task.topic) ? task.topic : (task.topic ? 'DİĞER' : ''))}
                                  onChange={(e) => updateTask(task.id, 'topic', e.target.value === 'DİĞER' ? 'Özel Konu' : e.target.value)}
                                  className="w-full bg-slate-900 border border-white/10 rounded-lg px-3 py-2 text-sm text-white outline-none focus:border-emerald-500/50"
                                >
                                  <option value="">Konu Seçin</option>
                                  {curriculum[task.subject].map((t: string) => (
                                    <option key={t} value={t}>{t}</option>
                                  ))}
                                  <option value="DİĞER">DİĞER (Özel Konu Gireceğim)</option>
                                </select>
                                {(!curriculum[task.subject].includes(task.topic) && task.topic !== '') && (
                                  <input
                                    type="text"
                                    value={task.topic}
                                    onChange={(e) => updateTask(task.id, 'topic', e.target.value)}
                                    placeholder="Özel konu girin..."
                                    className="w-full bg-slate-900 border border-white/10 rounded-lg px-3 py-2 text-sm text-white outline-none focus:border-emerald-500/50"
                                  />
                                )}
                              </div>
                            ) : (
                              <input
                                type="text"
                                value={task.topic}
                                onChange={(e) => updateTask(task.id, 'topic', e.target.value)}
                                placeholder="Örn: Rasyonel Sayılar"
                                className="w-full bg-slate-900 border border-white/10 rounded-lg px-3 py-2 text-sm text-white outline-none focus:border-emerald-500/50"
                              />
                            )}
                          </div>
                          <div className="md:col-span-3">
                            <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Tür</label>
                            <select
                              value={task.type}
                              onChange={(e) => updateTask(task.id, 'type', e.target.value)}
                              className="w-full bg-slate-900 border border-white/10 rounded-lg px-3 py-2 text-sm text-white outline-none focus:border-emerald-500/50"
                            >
                              <option value="Soru Çözümü">Soru Çözümü</option>
                              <option value="Konu Çalışması">Konu Çalışması</option>
                              <option value="YouTube Video">YouTube Video</option>
                            </select>
                          </div>
                          <div className="md:col-span-2">
                            <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Soru S.</label>
                            <input
                              type="number"
                              min="0"
                              value={task.questionCount}
                              onChange={(e) => updateTask(task.id, 'questionCount', parseInt(e.target.value) || 0)}
                              className="w-full bg-slate-900 border border-white/10 rounded-lg px-3 py-2 text-sm text-white outline-none focus:border-emerald-500/50"
                            />
                          </div>
                          <div className="md:col-span-12">
                             <input
                               type="text"
                               value={task.note}
                               onChange={(e) => updateTask(task.id, 'note', e.target.value)}
                               placeholder="Görevin açıklaması veya not (Opsiyonel)"
                               className="w-full bg-slate-900 border border-white/10 rounded-lg px-3 py-2 text-sm text-slate-300 outline-none focus:border-emerald-500/50"
                             />
                          </div>
                        </div>
                        <button onClick={() => removeTask(task.id)} className="shrink-0 text-slate-500 hover:text-rose-400 p-2 transition-colors self-start md:self-center">
                          <Trash2 size={16} />
                        </button>
                      </div>
                    ))
                  )}
                </div>
             </div>
           </div>
        </div>
      </div>
    </div>
  );
}
