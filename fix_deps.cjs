const fs = require('fs');

function fixFile(file, oldStr, newStr) {
  if (fs.existsSync(file)) {
    let content = fs.readFileSync(file, 'utf8');
    content = content.replace(oldStr, newStr);
    fs.writeFileSync(file, content);
    console.log(`Updated ${file}`);
  }
}

fixFile('src/pages/parents/ParentDashboard.tsx', '}, [userData]);', '}, [userData, selectedStudent]);');
fixFile('src/pages/parents/ParentGoals.tsx', '}, [userData, currentMonth]);', '}, [userData, currentMonth, selectedStudent]);');
fixFile('src/pages/parents/ParentProgram.tsx', '}, [centerDate, userData]);', '}, [centerDate, userData, selectedStudent]);');
fixFile('src/pages/parents/ParentWallet.tsx', '}, [user, userData]);', '}, [user, userData, selectedStudent]);');
fixFile('src/pages/parents/ParentSubscription.tsx', '}, [userData]);', '}, [userData, selectedStudent]);');
fixFile('src/pages/parents/ParentPersonality.tsx', '}, [userData]);', '}, [userData, selectedStudent]);');
fixFile('src/pages/parents/ParentAssistant.tsx', '}, [user?.uid]);', '}, [user?.uid, selectedStudent]);');

