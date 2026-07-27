const fs = require('fs');
let rules = fs.readFileSync('firestore.rules', 'utf8');

rules = rules.replace(
  /match \/exam_analyses\/\{analysisId\} \{\s*allow read: if isSignedIn\(\) && \(isOwner\(resource\.data\.get\('studentId', ''\)\) \|\| isAdmin\(\) \|\| isCoachOf\(resource\.data\.get\('studentId', ''\)\) \|\| isParentOf\(resource\.data\.get\('studentId', ''\)\)\);/,
  "match /exam_analyses/{analysisId} {\n      allow read: if isSignedIn() && (isOwner(resource.data.studentId) || isAdmin() || isCoachOf(resource.data.studentId) || isParentOf(resource.data.studentId));"
);

fs.writeFileSync('firestore.rules', rules);
