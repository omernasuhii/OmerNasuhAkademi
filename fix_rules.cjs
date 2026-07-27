const fs = require('fs');
let rules = fs.readFileSync('firestore.rules', 'utf8');

rules = rules.replace(
  'match /study_sessions/{sessionId} {\n      allow read: if isSignedIn() && (isOwner(resource.data.get("studentId", "")) || isAdmin() || isCoachOf(resource.data.get("studentId", "")) || isParentOf(resource.data.get("studentId", "")));\n      allow create: if isSignedIn() && (isOwner(incoming().get("studentId", "")) || isAdmin());\n      allow update, delete: if isSignedIn() && (isOwner(resource.data.get("studentId", "")) || isAdmin());\n    }',
  'match /study_sessions/{sessionId} {\n      allow read: if isSignedIn() && (resource.data.studentId == request.auth.uid || isAdmin() || isCoachOf(resource.data.studentId) || isParentOf(resource.data.studentId));\n      allow create: if isSignedIn() && (incoming().studentId == request.auth.uid || isAdmin());\n      allow update, delete: if isSignedIn() && (resource.data.studentId == request.auth.uid || isAdmin());\n    }'
);

fs.writeFileSync('firestore.rules', rules);
