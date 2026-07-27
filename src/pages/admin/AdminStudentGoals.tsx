import React, { useState, useEffect } from 'react';
import { Target, Search, Filter, GraduationCap, Building2, User, BarChart2 } from 'lucide-react';
import { studentDataService } from '../../services/studentDataService';

export default function AdminStudentGoals() {
  const [students, setStudents] = useState<any[]>([]);
  const [coaches, setCoaches] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [branchFilter, setBranchFilter] = useState('Hepsi');
  const [coachFilter, setCoachFilter] = useState('Hepsi');

  useEffect(() => {
    loadStudents();
  }, []);

  const loadStudents = async () => {
    setLoading(true);
    // getting all users to filter students
    const users = await studentDataService.getAllCollectionData('users', 'createdAt', 200);
    const studentUsers = users.filter((u: any) => u.role === 'student');
    const coachUsers = users.filter((u: any) => u.role === 'coach');
    
    setStudents(studentUsers);
    setCoaches(coachUsers);
    setLoading(false);
  };

  const filteredStudents = students.filter(student => {
    const nameMatch = `${student.firstName || ''} ${student.lastName || ''}`.toLowerCase().includes(searchTerm.toLowerCase());
    const branchMatch = branchFilter === 'Hepsi' || student.branch === branchFilter;
    const coachMatch = coachFilter === 'Hepsi' || student.coachId === coachFilter;
    return nameMatch && branchMatch && coachMatch;
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-white tracking-tight uppercase">Öğrenci Hedefleri</h1>
          <p className="text-slate-400 text-sm">Tüm öğrencilerin üniversite, bölüm ve net hedeflerini izleyin.</p>
        </div>
      </div>

      <div className="flex flex-col md:flex-row gap-4">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
          <input
            type="text"
            placeholder="Öğrenci adı ara..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-slate-800 border border-white/10 rounded-lg pl-10 pr-4 py-2 text-sm text-white placeholder-slate-500 outline-none focus:border-emerald-500/50"
          />
        </div>
        <div className="flex items-center gap-2">
          <Filter size={20} className="text-slate-400" />
          <select
            value={coachFilter}
            onChange={(e) => setCoachFilter(e.target.value)}
            className="bg-slate-800 border border-white/10 rounded-lg px-3 py-2 text-sm text-white outline-none focus:border-emerald-500/50"
          >
            <option value="Hepsi">Tüm Koçlar</option>
            {coaches.map(coach => (
              <option key={coach.id} value={coach.id}>
                {coach.firstName || ''} {coach.lastName || ''}
              </option>
            ))}
          </select>
          <select
            value={branchFilter}
            onChange={(e) => setBranchFilter(e.target.value)}
            className="bg-slate-800 border border-white/10 rounded-lg px-3 py-2 text-sm text-white outline-none focus:border-emerald-500/50"
          >
            <option value="Hepsi">Tüm Alanlar</option>
            <option value="SAYISAL">Sayısal</option>
            <option value="EŞİT AĞIRLIK">Eşit Ağırlık</option>
            <option value="SÖZEL">Sözel</option>
            <option value="DİL">Dil</option>
            <option value="TYT">Sadece TYT</option>
          </select>
        </div>
      </div>

      <div className="bg-slate-800/50 rounded-xl border border-white/10 overflow-hidden">
        <div className="grid grid-cols-12 gap-4 p-4 text-xs font-bold text-slate-400 border-b border-white/10 uppercase tracking-wider">
          <div className="col-span-3">Öğrenci</div>
          <div className="col-span-2">Alan / Hedef Sınav</div>
          <div className="col-span-4">Hedef Üniversite / Bölüm</div>
          <div className="col-span-3 text-right">Hedef Net (TYT / AYT)</div>
        </div>

        {loading ? (
          <div className="p-8 text-center text-slate-400">Yükleniyor...</div>
        ) : filteredStudents.length === 0 ? (
          <div className="p-8 text-center text-slate-400">Öğrenci bulunamadı.</div>
        ) : (
          <div className="divide-y divide-white/5 max-h-[600px] overflow-y-auto">
            {filteredStudents.map((student) => {
              const fullName = `${student.firstName || ''} ${student.lastName || ''}`.trim() || 'İsimsiz Öğrenci';
              const targetUni = student.targetUniversity || '-';
              const targetDept = student.targetDepartment || '-';
              const tytTarget = student.targetTyt !== undefined ? student.targetTyt : '-';
              const aytTarget = student.targetAyt !== undefined ? student.targetAyt : '-';
              const branch = student.branch || '-';

              return (
                <div key={student.id} className="grid grid-cols-12 gap-4 p-4 text-sm items-center hover:bg-white/5 transition-colors">
                  <div className="col-span-3 text-white font-medium flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0">
                      <User size={16} />
                    </div>
                    <span className="truncate">{fullName}</span>
                  </div>
                  
                  <div className="col-span-2">
                    <span className={`px-2 py-1 rounded-full text-[10px] font-bold ${
                      branch === 'SAYISAL' ? 'bg-blue-500/20 text-blue-400' :
                      branch === 'EŞİT AĞIRLIK' ? 'bg-amber-500/20 text-amber-400' :
                      branch === 'SÖZEL' ? 'bg-purple-500/20 text-purple-400' :
                      'bg-slate-500/20 text-slate-400'
                    }`}>
                      {branch}
                    </span>
                  </div>

                  <div className="col-span-4">
                    <div className="flex items-center gap-2">
                      <Building2 size={14} className="text-slate-500 shrink-0" />
                      <div className="text-white text-xs truncate" title={targetUni}>{targetUni}</div>
                    </div>
                    <div className="flex items-center gap-2 mt-1">
                      <GraduationCap size={14} className="text-slate-500 shrink-0" />
                      <div className="text-[11px] text-emerald-400 truncate" title={targetDept}>{targetDept}</div>
                    </div>
                  </div>

                  <div className="col-span-3 flex justify-end gap-4 text-right">
                    <div>
                      <div className="text-[10px] text-slate-500 uppercase">TYT</div>
                      <div className="text-amber-400 font-bold">{tytTarget}</div>
                    </div>
                    <div>
                      <div className="text-[10px] text-slate-500 uppercase">AYT</div>
                      <div className="text-blue-400 font-bold">{aytTarget}</div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
