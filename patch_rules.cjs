const fs = require('fs');
let rules = fs.readFileSync('firestore.rules', 'utf8');

rules = rules.replace(
  'allow create: if isSignedIn() && (isOwner(incoming().userId) || isParentOf(incoming().userId)) && isValidAnalysis(incoming());',
  'allow create: if isSignedIn() && (isOwner(incoming().userId) || isParentOf(incoming().userId) || isCoachOf(incoming().userId) || isAdmin()) && isValidAnalysis(incoming());'
);

fs.writeFileSync('firestore.rules', rules);
