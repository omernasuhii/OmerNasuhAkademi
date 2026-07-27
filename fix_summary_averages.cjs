const fs = require('fs');

function fixFile(filePath) {
    let code = fs.readFileSync(filePath, 'utf8');

    const replaceFrom = `    // Weekly Averages from data
    const weeksList = Object.values(weeklyData);
    const overallAvgCompletion = weeksList.length > 0 
      ? Math.round((weeksList.reduce((acc, w) => acc + (w.targetPoints > 0 ? (w.earnedPoints / w.targetPoints) : (w.earnedPoints > 0 ? 1 : 0)), 0) / weeksList.length) * 100)
      : 0;

    // Sort weeks descending to get last 4
    const sortedWeeks = Object.keys(weeklyData).sort((a, b) => b.localeCompare(a)).slice(0, 4);`;

    const replaceTo = `    // Filter out future weeks
    const currentNow = new Date();
    const curTodayDay = currentNow.getUTCDay();
    const curTodayDiff = currentNow.getUTCDate() - curTodayDay + (curTodayDay === 0 ? -6 : 1);
    const currentWeekStartStr = new Date(Date.UTC(currentNow.getUTCFullYear(), currentNow.getUTCMonth(), curTodayDiff)).toISOString().split('T')[0];

    const pastOrCurrentWeekKeys = Object.keys(weeklyData).filter(weekStart => weekStart <= currentWeekStartStr);
    
    // Weekly Averages from data
    const weeksList = pastOrCurrentWeekKeys.map(k => weeklyData[k]);
    const overallAvgCompletion = weeksList.length > 0 
      ? Math.round((weeksList.reduce((acc, w) => acc + (w.targetPoints > 0 ? (w.earnedPoints / w.targetPoints) : (w.earnedPoints > 0 ? 1 : 0)), 0) / weeksList.length) * 100)
      : 0;

    // Sort weeks descending to get last 4
    const sortedWeeks = pastOrCurrentWeekKeys.sort((a, b) => b.localeCompare(a)).slice(0, 4);`;

    // Only apply if the old block exists and it wasn't replaced yet
    if (code.includes('const weeksList = Object.values(weeklyData);')) {
       code = code.replace(replaceFrom, replaceTo);
       fs.writeFileSync(filePath, code);
    }
}

fixFile('src/pages/coach/StudentSummary.tsx');
fixFile('src/pages/coach/CoachOverallAssessment.tsx');
