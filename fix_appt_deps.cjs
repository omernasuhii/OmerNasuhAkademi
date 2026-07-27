const fs = require('fs');
let file = 'src/components/appointments/AppointmentList.tsx';
if (fs.existsSync(file)) {
  let content = fs.readFileSync(file, 'utf8');
  content = content.replace('}, [user, studentId, role, limit, statuses]);', '}, [user, studentId, targetUserId, studentIds, filterRequesterRole, role, limit, statuses]);');
  fs.writeFileSync(file, content);
  console.log(`Updated ${file}`);
}
