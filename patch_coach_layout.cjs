const fs = require('fs');
let content = fs.readFileSync('src/pages/coach/CoachLayout.tsx', 'utf8');

if (!content.includes('Lock,')) {
  content = content.replace('X\n} from \'lucide-react\';', 'X,\n  Lock\n} from \'lucide-react\';');
}

const mappingStart = `              {studentMenuItems.map((item) => (
                <NavLink
                  key={item.path}
                  to={item.path}
                  end
                  className={({ isActive }) => \`
                    flex items-center gap-3 px-4 py-3.5 rounded-2xl transition-all group
                    \${isActive 
                      ? 'bg-emerald-600/10 text-emerald-400 border border-emerald-600/20' 
                      : 'text-slate-500 hover:text-slate-200 hover:bg-white/5'
                    }
                  \`}
                >
                  <item.icon size={18} className="shrink-0" />
                  <span className="text-sm font-bold tracking-tight">{item.title}</span>
                </NavLink>
              ))}`;

const mappingReplacement = `              {studentMenuItems.map((item) => {
                const isAlwaysOpen = ['', 'profil', 'cuzdan'].includes(item.path);
                const hasActiveSub = !!(selectedStudent?.subscriptionPlan && selectedStudent?.subscriptionStatus === 'active');
                const isDisabled = !hasActiveSub && !isAlwaysOpen;
                
                return (
                <NavLink
                  key={item.path}
                  to={isDisabled ? '#' : item.path}
                  end
                  onClick={(e) => {
                    if (isDisabled) e.preventDefault();
                  }}
                  className={({ isActive }) => \`
                    flex items-center justify-between px-4 py-3.5 rounded-2xl transition-all group
                    \${isActive && !isDisabled
                      ? 'bg-emerald-600/10 text-emerald-400 border border-emerald-600/20' 
                      : 'text-slate-500 hover:text-slate-200 hover:bg-white/5'
                    }
                    \${isDisabled ? 'opacity-50 cursor-not-allowed' : ''}
                  \`}
                >
                  <div className="flex items-center gap-3">
                    <item.icon size={18} className="shrink-0" />
                    <span className="text-sm font-bold tracking-tight">{item.title}</span>
                  </div>
                  {isDisabled && <Lock size={14} className="text-slate-500" />}
                </NavLink>
              )})}`;

content = content.replace(mappingStart, mappingReplacement);

// Now update the Outlet part to show the Lock screen
const outletStart = `        {/* Route Content */}
        <div className="flex-1 px-4 md:px-8 pb-4 md:pb-8 pt-2 md:pt-4">
          {!selectedStudent && !location.pathname.includes('/musaitlik') ? (
            <div className="h-full flex flex-col items-center justify-center text-center max-w-lg mx-auto">
              <div className="w-20 h-20 bg-emerald-500/10 rounded-3xl flex items-center justify-center text-emerald-500 mb-6 border border-emerald-500/20">
                <Users size={40} />
              </div>
              <h2 className="text-2xl font-bold text-white mb-2">Bir Öğrenci Seçin</h2>
              <p className="text-slate-500">
                Öğrenci bazlı özellikleri kullanabilmek için lütfen soldaki panelden takip etmek istediğiniz öğrenciyi seçin.
              </p>
            </div>
          ) : (
            <Outlet />
          )}
        </div>`;

const outletReplacement = `        {/* Route Content */}
        <div className="flex-1 px-4 md:px-8 pb-4 md:pb-8 pt-2 md:pt-4">
          {(() => {
            if (!selectedStudent && !location.pathname.includes('/musaitlik')) {
              return (
                <div className="h-full flex flex-col items-center justify-center text-center max-w-lg mx-auto">
                  <div className="w-20 h-20 bg-emerald-500/10 rounded-3xl flex items-center justify-center text-emerald-500 mb-6 border border-emerald-500/20">
                    <Users size={40} />
                  </div>
                  <h2 className="text-2xl font-bold text-white mb-2">Bir Öğrenci Seçin</h2>
                  <p className="text-slate-500">
                    Öğrenci bazlı özellikleri kullanabilmek için lütfen soldaki panelden takip etmek istediğiniz öğrenciyi seçin.
                  </p>
                </div>
              );
            }
            
            if (selectedStudent) {
              const currentPath = location.pathname.replace('/panel/koc/ogrenci', '').replace(/^\\//, '');
              const isAlwaysOpen = ['', 'profil', 'cuzdan'].includes(currentPath);
              const hasActiveSub = !!(selectedStudent?.subscriptionPlan && selectedStudent?.subscriptionStatus === 'active');
              
              if (!hasActiveSub && !isAlwaysOpen) {
                return (
                  <div className="h-full flex flex-col items-center justify-center text-center max-w-md mx-auto mt-20">
                    <div className="w-24 h-24 bg-[#070b14] border border-white/10 rounded-3xl flex items-center justify-center mb-6 shadow-2xl">
                      <Lock size={40} className="text-slate-500" />
                    </div>
                    <h2 className="text-2xl font-bold text-white mb-3 tracking-tight">Erişim Kısıtlı</h2>
                    <p className="text-slate-400 mb-8 leading-relaxed text-sm">
                      Bu öğrencinin aktif bir aboneliği bulunmadığı için bu sayfaya erişim sağlanamamaktadır. Öğrencinin abonelik başlatması gerekmektedir.
                    </p>
                  </div>
                );
              }
            }

            return <Outlet />;
          })()}
        </div>`;

content = content.replace(outletStart, outletReplacement);

fs.writeFileSync('src/pages/coach/CoachLayout.tsx', content);
