const fs = require('fs');

// 1. Fix Summary.tsx
let summaryCode = fs.readFileSync('src/pages/students/Summary.tsx', 'utf8');

const bannerRegex = /\{\!hasCoach \&\& \(\s*<motion\.div\s*initial=\{\{ opacity: 0, y: -20 \}\}.*?<\/motion\.div>\s*\)\}/s;
summaryCode = summaryCode.replace(bannerRegex, '');

const hasCoachRegex = /\s*const hasCoach = \!\!\(userData\?\.coachId \|\| userData\?\.assignedCoachId\);\s*/;
summaryCode = summaryCode.replace(hasCoachRegex, '');

fs.writeFileSync('src/pages/students/Summary.tsx', summaryCode);

// 2. Fix StudentLayout.tsx
let layoutCode = fs.readFileSync('src/pages/students/StudentLayout.tsx', 'utf8');

const hasCoachLayoutRegex = /\s*const hasCoach = \!\!\(userData\?\.coachId \|\| userData\?\.assignedCoachId\);\s*/;
layoutCode = layoutCode.replace(hasCoachLayoutRegex, '');

const isDisabledRegex = /\s*const isDisabled = \!hasCoach \&\& item\.path \!\=\= \'\'\s*;/g;
layoutCode = layoutCode.replace(isDisabledRegex, 'const isDisabled = false;');

const layoutConditionRegex = /\{\!hasCoach \&\& \!isSummaryPage \? \([\s\S]*?Özet Sayfasına Dön\s*<\/NavLink>\s*<\/div>\s*\) : \(\s*(<Outlet \/>\s*)\)\}/;
layoutCode = layoutCode.replace(layoutConditionRegex, '{<Outlet />}');

fs.writeFileSync('src/pages/students/StudentLayout.tsx', layoutCode);
