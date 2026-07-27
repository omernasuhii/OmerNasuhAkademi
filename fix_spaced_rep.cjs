const fs = require('fs');

function fixSpacedRepetition(filePath) {
    let code = fs.readFileSync(filePath, 'utf8');
    
    // Change 56 * 24 * 60 * 60 * 1000 to 84 * 24 * 60 * 60 * 1000
    // Change 'Aralıklı Tekrar: 2. Ay (8. Hafta)' to 'Aralıklı Tekrar: 3. Ay (12. Hafta)'
    code = code.replace(
        /const date8W = new Date\(baseTime \+ 56 \* 24 \* 60 \* 60 \* 1000\)\.toISOString\(\)\.split\('T'\)\[0\];/,
        "const date8W = new Date(baseTime + 84 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];"
    );
    code = code.replace(
        /coachNote: 'Aralıklı Tekrar: 2\. Ay \(8\. Hafta\)'/,
        "coachNote: 'Aralıklı Tekrar: 3. Ay (12. Hafta)'"
    );

    fs.writeFileSync(filePath, code);
}

function fixWeeklyReportsFilter(filePath) {
    let code = fs.readFileSync(filePath, 'utf8');
    
    const filterSnippet = `
    const now = new Date();
    const todayDay = now.getUTCDay();
    const todayDiff = now.getUTCDate() - todayDay + (todayDay === 0 ? -6 : 1);
    const currentWeekStart = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), todayDiff)).toISOString().split('T')[0];

    const weeklyReportsArray = Object.keys(weeklyData)
      .filter(weekStart => weekStart <= currentWeekStart)
      .sort((a, b) => b.localeCompare(a)).map(weekStart => {`;
      
    code = code.replace(
        /const weeklyReportsArray = Object\.keys\(weeklyData\)\.sort\(\(a, b\) => b\.localeCompare\(a\)\)\.map\(weekStart => \{/,
        filterSnippet
    );
    
    fs.writeFileSync(filePath, code);
}

fixSpacedRepetition('src/pages/coach/StudentProgram.tsx');
fixWeeklyReportsFilter('src/pages/coach/StudentSummary.tsx');
fixWeeklyReportsFilter('src/pages/coach/CoachOverallAssessment.tsx');
