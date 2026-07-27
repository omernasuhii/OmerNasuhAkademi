const fs = require('fs');

function addWeekNavParentProgram(filePath) {
    let code = fs.readFileSync(filePath, 'utf8');

    // Add ChevronsLeft, ChevronsRight to imports
    if (!code.includes('ChevronsLeft')) {
       code = code.replace(
           /ChevronLeft, ChevronRight/,
           'ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight'
       );
    }

    const replaceFrom = `<button 
            onClick={() => shiftDays(-7)}
            className="p-2 hover:bg-white/5 rounded-xl transition-colors text-slate-400 hover:text-white"
          >
            <ChevronLeft size={20} />
          </button>
          
          <button 
            onClick={() => setCenterDate(new Date().toISOString().split('T')[0])}
            className="px-4 py-2 text-sm font-semibold bg-white/5 text-white rounded-xl hover:bg-white/10 transition-colors"
          >
            Bugün
          </button>

          <button 
            onClick={() => shiftDays(7)}
            className="p-2 hover:bg-white/5 rounded-xl transition-colors text-slate-400 hover:text-white"
          >
            <ChevronRight size={20} />
          </button>`;
          
    const replaceTo = `<button 
            onClick={() => shiftDays(-7)}
            className="p-2 hover:bg-white/5 rounded-xl transition-colors text-slate-400 hover:text-white"
            title="Önceki Hafta"
          >
            <ChevronsLeft size={20} />
          </button>
          
          <button 
            onClick={() => shiftDays(-1)}
            className="p-2 hover:bg-white/5 rounded-xl transition-colors text-slate-400 hover:text-white"
            title="Önceki Gün"
          >
            <ChevronLeft size={20} />
          </button>
          
          <button 
            onClick={() => setCenterDate(new Date().toISOString().split('T')[0])}
            className="px-4 py-2 text-sm font-semibold bg-white/5 text-white rounded-xl hover:bg-white/10 transition-colors"
          >
            Bugün
          </button>

          <button 
            onClick={() => shiftDays(1)}
            className="p-2 hover:bg-white/5 rounded-xl transition-colors text-slate-400 hover:text-white"
            title="Sonraki Gün"
          >
            <ChevronRight size={20} />
          </button>
          
          <button 
            onClick={() => shiftDays(7)}
            className="p-2 hover:bg-white/5 rounded-xl transition-colors text-slate-400 hover:text-white"
            title="Sonraki Hafta"
          >
            <ChevronsRight size={20} />
          </button>`;

    if (code.includes('onClick={() => shiftDays(-7)}')) {
        code = code.replace(replaceFrom, replaceTo);
        fs.writeFileSync(filePath, code);
    }
}

addWeekNavParentProgram('src/pages/parents/ParentProgram.tsx');
