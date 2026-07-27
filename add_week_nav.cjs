const fs = require('fs');

function addWeekNavStudentProgram(filePath) {
    let code = fs.readFileSync(filePath, 'utf8');

    // Add ChevronsLeft, ChevronsRight to imports
    if (!code.includes('ChevronsLeft')) {
       code = code.replace(
           /ChevronLeft, ChevronRight/,
           'ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight'
       );
    }

    const replaceFrom = `<button onClick={() => navigateDay(-1)} className="p-1 hover:bg-white/5 rounded text-slate-500"><ChevronLeft size={18} /></button>
                <div className="min-w-[180px] text-center">
                    <p className="text-emerald-400 font-bold text-[10px] uppercase tracking-widest leading-none mb-1">Odak Tarih</p>
                    <p className="text-white font-bold text-sm uppercase tracking-widest">
                       {new Date(days[0].date).toLocaleDateString('tr-TR', { day: 'numeric', month: 'long', year: 'numeric' })}
                    </p>
                </div>
                <button onClick={() => navigateDay(1)} className="p-1 hover:bg-white/5 rounded text-slate-500"><ChevronRight size={18} /></button>`;
                
    const replaceTo = `<button onClick={() => navigateDay(-7)} className="p-1 hover:bg-white/5 rounded text-slate-500" title="Önceki Hafta"><ChevronsLeft size={18} /></button>
                <button onClick={() => navigateDay(-1)} className="p-1 hover:bg-white/5 rounded text-slate-500" title="Önceki Gün"><ChevronLeft size={18} /></button>
                <div className="min-w-[180px] text-center">
                    <p className="text-emerald-400 font-bold text-[10px] uppercase tracking-widest leading-none mb-1">Odak Tarih</p>
                    <p className="text-white font-bold text-sm uppercase tracking-widest">
                       {new Date(days[0].date).toLocaleDateString('tr-TR', { day: 'numeric', month: 'long', year: 'numeric' })}
                    </p>
                </div>
                <button onClick={() => navigateDay(1)} className="p-1 hover:bg-white/5 rounded text-slate-500" title="Sonraki Gün"><ChevronRight size={18} /></button>
                <button onClick={() => navigateDay(7)} className="p-1 hover:bg-white/5 rounded text-slate-500" title="Sonraki Hafta"><ChevronsRight size={18} /></button>`;

    if (code.includes('navigateDay(-1)')) {
        code = code.replace(replaceFrom, replaceTo);
        fs.writeFileSync(filePath, code);
    }
}

function addWeekNavCoaching(filePath) {
    let code = fs.readFileSync(filePath, 'utf8');

    // Add ChevronsLeft, ChevronsRight to imports
    if (!code.includes('ChevronsLeft')) {
       code = code.replace(
           /ChevronLeft, ChevronRight/,
           'ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight'
       );
    }

    const replaceFrom = `<button onClick={() => navigateDay(-1)} className="p-2 hover:bg-white/10 rounded-lg text-slate-400 transition-colors"><ChevronLeft size={18} /></button>
                <div className="min-w-[140px] text-center">
                   <p className="text-emerald-400 font-bold text-xs uppercase tracking-widest leading-none mb-1">Odak Tarih</p>
                   <p className="text-white font-bold text-sm tracking-tight leading-none">
                     {new Date(centerDate).toLocaleDateString('tr-TR', { day: 'numeric', month: 'long', year: 'numeric' })}
                   </p>
                </div>
                <button onClick={() => navigateDay(1)} className="p-2 hover:bg-white/10 rounded-lg text-slate-400 transition-colors"><ChevronRight size={18} /></button>`;
                
    const replaceTo = `<button onClick={() => navigateDay(-7)} className="p-2 hover:bg-white/10 rounded-lg text-slate-400 transition-colors" title="Önceki Hafta"><ChevronsLeft size={18} /></button>
                <button onClick={() => navigateDay(-1)} className="p-2 hover:bg-white/10 rounded-lg text-slate-400 transition-colors" title="Önceki Gün"><ChevronLeft size={18} /></button>
                <div className="min-w-[140px] text-center">
                   <p className="text-emerald-400 font-bold text-xs uppercase tracking-widest leading-none mb-1">Odak Tarih</p>
                   <p className="text-white font-bold text-sm tracking-tight leading-none">
                     {new Date(centerDate).toLocaleDateString('tr-TR', { day: 'numeric', month: 'long', year: 'numeric' })}
                   </p>
                </div>
                <button onClick={() => navigateDay(1)} className="p-2 hover:bg-white/10 rounded-lg text-slate-400 transition-colors" title="Sonraki Gün"><ChevronRight size={18} /></button>
                <button onClick={() => navigateDay(7)} className="p-2 hover:bg-white/10 rounded-lg text-slate-400 transition-colors" title="Sonraki Hafta"><ChevronsRight size={18} /></button>`;

    if (code.includes('navigateDay(-1)')) {
        code = code.replace(replaceFrom, replaceTo);
        fs.writeFileSync(filePath, code);
    }
}

addWeekNavStudentProgram('src/pages/coach/StudentProgram.tsx');
addWeekNavCoaching('src/pages/student/Coaching.tsx');
