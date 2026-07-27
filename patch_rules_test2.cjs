const fs = require('fs');
let rules = fs.readFileSync('firestore.rules', 'utf8');

rules = rules.replace(
  "allow create: if isSignedIn() && (isOwner(incoming().get('userId', '')) || isParentOf(incoming().get('userId', '')) || isCoachOf(incoming().get('userId', '')) || isAdmin()) && isValidAnalysis(incoming());",
  "allow create: if isSignedIn() && isValidAnalysis(incoming());"
);

fs.writeFileSync('firestore.rules', rules);
