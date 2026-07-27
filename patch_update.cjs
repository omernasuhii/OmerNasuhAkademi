const fs = require('fs');
let rules = fs.readFileSync('firestore.rules', 'utf8');

rules = rules.replace(
  "allow update: if isSignedIn() && (isOwner(resource.data.userId) || isParentOf(resource.data.userId)) && (",
  "allow update: if isSignedIn() && (isOwner(resource.data.userId) || isParentOf(resource.data.userId) || isCoachOf(resource.data.userId) || isAdmin()) && ("
);

fs.writeFileSync('firestore.rules', rules);
