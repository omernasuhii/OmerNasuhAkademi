const fs = require('fs');
let rules = fs.readFileSync('firestore.rules', 'utf8');

const oldParentOf = `    function isParentOf(studentId) {
      return isSignedIn() && (
        (exists(/databases/$(database)/documents/users/$(request.auth.uid)) && (
          get(/databases/$(database)/documents/users/$(request.auth.uid)).data.get('studentUid', '') == studentId ||
          (get(/databases/$(database)/documents/users/$(request.auth.uid)).data.get('studentUid', []) is list && studentId in get(/databases/$(database)/documents/users/$(request.auth.uid)).data.get('studentUid', [])) ||
          (get(/databases/$(database)/documents/users/$(request.auth.uid)).data.get('studentIds', []) is list && studentId in get(/databases/$(database)/documents/users/$(request.auth.uid)).data.get('studentIds', []))
        )) ||
        (exists(/databases/$(database)/documents/users/$(studentId)) && 
         get(/databases/$(database)/documents/users/$(studentId)).data.get('parentEmail', '') != '' && 
         request.auth.token.email != null &&
         get(/databases/$(database)/documents/users/$(studentId)).data.get('parentEmail', '') == request.auth.token.email)
      );
    }`;

const newParentOf = `    function isParentOf(studentId) {
      return isSignedIn() && (
        (exists(/databases/$(database)/documents/users/$(request.auth.uid)) && (
          get(/databases/$(database)/documents/users/$(request.auth.uid)).data.get('studentUid', '') == studentId ||
          (get(/databases/$(database)/documents/users/$(request.auth.uid)).data.get('studentUid', []) is list && studentId in get(/databases/$(database)/documents/users/$(request.auth.uid)).data.get('studentUid', [])) ||
          (get(/databases/$(database)/documents/users/$(request.auth.uid)).data.get('studentIds', []) is list && studentId in get(/databases/$(database)/documents/users/$(request.auth.uid)).data.get('studentIds', []))
        )) ||
        (exists(/databases/$(database)/documents/users/$(studentId)) && 
         get(/databases/$(database)/documents/users/$(studentId)).data.get('parentEmail', '') != '' && 
         'email' in request.auth.token &&
         get(/databases/$(database)/documents/users/$(studentId)).data.get('parentEmail', '') == request.auth.token.email)
      );
    }`;

rules = rules.replace(oldParentOf, newParentOf);
fs.writeFileSync('firestore.rules', rules);
