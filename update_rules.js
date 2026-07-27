const fs = require('fs');
let rules = fs.readFileSync('firestore.rules', 'utf8');

rules = rules.replace(
  /function isParentOf\(studentId\) \{[\s\S]*?\}/,
  `function isParentOf(studentId) {
      if (!isSignedIn() || !exists(/databases/$(database)/documents/users/$(request.auth.uid))) {
        return false;
      }
      let parentData = get(/databases/$(database)/documents/users/$(request.auth.uid)).data;
      let stringMatch = parentData.get('studentUid', '') == studentId;
      let listMatch = parentData.get('studentUid', []) is list && studentId in parentData.get('studentUid', []);
      let studentIdsMatch = parentData.get('studentIds', []) is list && studentId in parentData.get('studentIds', []);
      return stringMatch || listMatch || studentIdsMatch;
    }`
);

fs.writeFileSync('firestore.rules', rules);
