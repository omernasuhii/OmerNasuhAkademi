import React, { useState, useEffect } from 'react';
import { FileText, Plus, Search, Edit2, Trash2, Filter, Lock, ImageIcon, ExternalLink } from 'lucide-react';
import { studentDataService } from '../../services/studentDataService';
import { BRANCH_CONFIG } from '../../constants/branchConfig';
import { useCurriculum } from '../../lib/CurriculumContext';
import { formatDriveUrl } from '../../lib/formatDriveUrl';

export default function AdminQuestions() {
  const { curriculum } = useCurriculum();
  const [questions, setQuestions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState('Hepsi');
  const [subjectFilter, setSubjectFilter] = useState('Hepsi');

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingQuestion, setEditingQuestion] = useState<any>(null);

  const [formData, setFormData] = useState({
    title: '',
    type: 'TYT',
    subject: 'Türkçe',
    topic: '',
    difficulty: 'Orta',
    questionText: '',
    correctAnswer: 'A',
    solutionText: ''
  });

  useEffect(() => {
    loadQuestions();
  }, []);

  const loadQuestions = async () => {
    setLoading(true);
    const [standaloneData, globalExams] = await Promise.all([
      studentDataService.getGlobalQuestions(),
      studentDataService.getGlobalAcademicExams()
    ]);
    
    let allQuestions = [...(standaloneData || [])];
    
    if (globalExams) {
      globalExams.forEach((exam: any) => {
        if (exam.questions) {
          exam.questions.forEach((q: any) => {
            allQuestions.push({
              id: `ge-${exam.id}-${q.sectionName}-${q.number}`,
              title: `${exam.title} - ${q.sectionName} Soru ${q.number}`,
              type: exam.type,
              subject: q.sectionName,
              topic: q.subject,
              difficulty: 'Orta',
              questionText: q.subject || 'Kurumsal Deneme Sorusu',
              imageUrl: q.imageUrl,
              correctAnswer: q.answer,
              isFromGlobalExam: true,
              globalExamId: exam.id
            });
          });
        }
      });
    }

    setQuestions(allQuestions);
    setLoading(false);
  };

  const handleOpenModal = (question: any = null) => {
    if (question) {
      setEditingQuestion(question);
      setFormData({
        title: question.title || '',
        type: question.type || 'TYT',
        subject: question.subject || 'Türkçe',
        topic: question.topic || '',
        difficulty: question.difficulty || 'Orta',
        questionText: question.questionText || '',
        correctAnswer: question.correctAnswer || 'A',
        solutionText: question.solutionText || ''
      });
    } else {
      setEditingQuestion(null);
      setFormData({
        title: '',
        type: 'TYT',
        subject: 'Türkçe',
        topic: '',
        difficulty: 'Orta',
        questionText: '',
        correctAnswer: 'A',
        solutionText: ''
      });
    }
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingQuestion(null);
  };

  const handleSaveQuestion = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.questionText) {
      alert('Lütfen soru metnini girin.');
      return;
    }

    const questionToSave = {
      ...(editingQuestion || {}),
      ...formData
    };

    try {
      await studentDataService.saveGlobalQuestion(questionToSave);
      await loadQuestions();
      handleCloseModal();
    } catch (error) {
      alert('Soru kaydedilirken bir hata oluştu');
    }
  };

  const handleDeleteQuestion = async (id: string) => {
    if (window.confirm('Bu soruyu silmek istediğinize emin misiniz?')) {
      try {
        await studentDataService.deleteGlobalQuestion(id);
        await loadQuestions();
      } catch (error) {
        alert('Soru silinirken bir hata oluştu');
      }
    }
  };

  const filteredQuestions = questions.filter(q => {
    const matchesSearch = q.title?.toLowerCase().includes(searchTerm.toLowerCase()) || q.questionText?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = typeFilter === 'Hepsi' || q.type === typeFilter;
    const matchesSubject = subjectFilter === 'Hepsi' || q.subject === subjectFilter;
    return matchesSearch && matchesType && matchesSubject;
  });

  const allSubjects = Object.keys(curriculum).sort();
  const currentTopics = formData.subject ? (curriculum[formData.subject] || []) : [];

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-white tracking-tight uppercase">Soru Havuzu</h1>
          <p className="text-slate-400 text-sm">Sistemdeki tüm soruları merkezi olarak yönetin.</p>
        </div>
        <button
          onClick={() => handleOpenModal()}
          className="flex items-center gap-2 bg-emerald-500 hover:bg-emerald-600 text-white px-4 py-2 rounded-lg font-bold transition-colors"
        >
          <Plus size={20} />
          Yeni Soru Ekle
        </button>
      </div>

      <div className="flex flex-col md:flex-row gap-4">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
          <input
            type="text"
            placeholder="Soru metni veya başlık ara..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-slate-800 border border-white/10 rounded-lg pl-10 pr-4 py-2 text-sm text-white placeholder-slate-500 outline-none focus:border-emerald-500/50"
          />
        </div>
        <div className="flex items-center gap-2">
          <Filter size={20} className="text-slate-400" />
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="bg-slate-800 border border-white/10 rounded-lg px-3 py-2 text-sm text-white outline-none focus:border-emerald-500/50"
          >
            <option value="Hepsi">Tüm Türler</option>
            <option value="TYT">TYT</option>
            <option value="AYT">AYT</option>
            <option value="DİĞER">DİĞER</option>
          </select>
          <select
            value={subjectFilter}
            onChange={(e) => setSubjectFilter(e.target.value)}
            className="bg-slate-800 border border-white/10 rounded-lg px-3 py-2 text-sm text-white outline-none focus:border-emerald-500/50"
          >
            <option value="Hepsi">Tüm Dersler</option>
            {allSubjects.map((sub: string) => (
              <option key={sub} value={sub}>{sub}</option>
            ))}
          </select>
        </div>
      </div>

      <div className="bg-slate-800/50 rounded-xl border border-white/10 overflow-hidden">
        <div className="grid grid-cols-12 gap-4 p-4 text-xs font-bold text-slate-400 border-b border-white/10 uppercase tracking-wider">
          <div className="col-span-4">Soru & Başlık</div>
          <div className="col-span-3">Ders / Konu</div>
          <div className="col-span-2">Zorluk</div>
          <div className="col-span-1 text-center">Cevap</div>
          <div className="col-span-2 text-right">İşlemler</div>
        </div>

        {loading ? (
          <div className="p-8 text-center text-slate-400">Yükleniyor...</div>
        ) : filteredQuestions.length === 0 ? (
          <div className="p-8 text-center text-slate-400">Soru bulunamadı.</div>
        ) : (
          <div className="divide-y divide-white/5 max-h-[600px] overflow-y-auto">
            {filteredQuestions.map((q: any) => (
              <div key={q.id} className="grid grid-cols-12 gap-4 p-4 text-sm items-center hover:bg-white/5 transition-colors">
                <div className="col-span-4 text-white font-medium break-words">
                  <div className="flex items-center gap-2">
                    <FileText size={16} className="text-emerald-400 shrink-0" />
                    <span className="truncate">{q.title || "İsimsiz Soru"}</span>
                    {q.isFromGlobalExam && (
                      <span className="bg-indigo-500/20 text-indigo-300 text-[10px] px-2 py-0.5 rounded-full whitespace-nowrap">Kurumsal</span>
                    )}
                  </div>
                  <div className="text-[11px] text-slate-500 mt-0.5 ml-6 line-clamp-1">
                    {q.imageUrl ? (
                      <a href={formatDriveUrl(q.imageUrl)} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 hover:text-emerald-400 transition-colors text-xs">
                        <ImageIcon size={12} /> Resmi Gör <ExternalLink size={10} />
                      </a>
                    ) : (
                      q.questionText
                    )}
                  </div>
                </div>
                <div className="col-span-3">
                  <div className="text-white text-xs">{q.subject} - {q.type}</div>
                  <div className="text-[10px] text-slate-400 truncate">{q.topic || '-'}</div>
                </div>
                <div className="col-span-2">
                  <span className={`px-2 py-1 rounded-full text-[10px] font-bold ${
                    q.difficulty === 'Zor' ? 'bg-red-500/20 text-red-400' :
                    q.difficulty === 'Orta' ? 'bg-amber-500/20 text-amber-400' :
                    'bg-emerald-500/20 text-emerald-400'
                  }`}>
                    {q.difficulty}
                  </span>
                </div>
                <div className="col-span-1 text-center font-bold text-emerald-400">
                  {q.correctAnswer}
                </div>
                <div className="col-span-2 flex items-center justify-end gap-2">
                  {q.isFromGlobalExam ? (
                    <div className="flex items-center gap-2 text-slate-500 text-xs px-2">
                      <Lock size={14} /> Salt Okunur
                    </div>
                  ) : (
                    <>
                      <button onClick={() => handleOpenModal(q)} className="p-2 text-slate-400 hover:text-white hover:bg-white/10 rounded-lg transition-colors">
                        <Edit2 size={16} />
                      </button>
                      <button onClick={() => handleDeleteQuestion(q.id)} className="p-2 text-red-400 hover:text-red-300 hover:bg-red-500/20 rounded-lg transition-colors">
                        <Trash2 size={16} />
                      </button>
                    </>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-white/10 sm:rounded-2xl p-6 w-full max-w-2xl h-full sm:h-auto max-h-screen sm:max-h-[90vh] overflow-y-auto">
            <h2 className="text-xl font-black text-white mb-6 uppercase tracking-tight">
              {editingQuestion ? 'Soruyu Düzenle' : 'Yeni Soru Ekle'}
            </h2>
            
            <form onSubmit={handleSaveQuestion} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="col-span-2">
                  <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Başlık / Etiket</label>
                  <input
                    type="text"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    className="w-full bg-black/20 border border-white/10 rounded-lg p-3 text-sm text-white outline-none focus:border-emerald-500/50"
                    placeholder="Örn: Rasyonel Sayılar Yeni Nesil Soru 1"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Sınav Türü</label>
                  <select
                    value={formData.type}
                    onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                    className="w-full bg-black/20 border border-white/10 rounded-lg p-3 text-sm text-white outline-none focus:border-emerald-500/50"
                  >
                    <option value="TYT">TYT</option>
                    <option value="AYT">AYT</option>
                    <option value="DİĞER">DİĞER</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Ders</label>
                  <select
                    value={formData.subject}
                    onChange={(e) => setFormData({ ...formData, subject: e.target.value, topic: '' })}
                    className="w-full bg-black/20 border border-white/10 rounded-lg p-3 text-sm text-white outline-none focus:border-emerald-500/50"
                  >
                    <option value="">Seçiniz</option>
                    {allSubjects.map((sub: string) => (
                      <option key={sub} value={sub}>{sub}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Konu</label>
                  <select
                    value={formData.topic}
                    onChange={(e) => setFormData({ ...formData, topic: e.target.value })}
                    className="w-full bg-black/20 border border-white/10 rounded-lg p-3 text-sm text-white outline-none focus:border-emerald-500/50"
                    disabled={!formData.subject}
                  >
                    <option value="">Seçiniz</option>
                    {currentTopics.map((topic: string) => (
                      <option key={topic} value={topic}>{topic}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Zorluk</label>
                  <select
                    value={formData.difficulty}
                    onChange={(e) => setFormData({ ...formData, difficulty: e.target.value })}
                    className="w-full bg-black/20 border border-white/10 rounded-lg p-3 text-sm text-white outline-none focus:border-emerald-500/50"
                  >
                    <option value="Kolay">Kolay</option>
                    <option value="Orta">Orta</option>
                    <option value="Zor">Zor</option>
                  </select>
                </div>

                <div className="col-span-2">
                  <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Soru Metni</label>
                  <textarea
                    value={formData.questionText}
                    onChange={(e) => setFormData({ ...formData, questionText: e.target.value })}
                    className="w-full bg-black/20 border border-white/10 rounded-lg p-3 text-sm text-white outline-none focus:border-emerald-500/50"
                    rows={4}
                    placeholder="Soruyu buraya yazın..."
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Doğru Cevap</label>
                  <select
                    value={formData.correctAnswer}
                    onChange={(e) => setFormData({ ...formData, correctAnswer: e.target.value })}
                    className="w-full bg-black/20 border border-white/10 rounded-lg p-3 text-sm text-white outline-none focus:border-emerald-500/50"
                  >
                    <option value="A">A</option>
                    <option value="B">B</option>
                    <option value="C">C</option>
                    <option value="D">D</option>
                    <option value="E">E</option>
                  </select>
                </div>
                
                <div className="col-span-2">
                  <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Çözüm (Opsiyonel)</label>
                  <textarea
                    value={formData.solutionText}
                    onChange={(e) => setFormData({ ...formData, solutionText: e.target.value })}
                    className="w-full bg-black/20 border border-white/10 rounded-lg p-3 text-sm text-white outline-none focus:border-emerald-500/50"
                    rows={3}
                    placeholder="Çözümü açıklayın..."
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
                  {editingQuestion ? 'Güncelle' : 'Kaydet'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
