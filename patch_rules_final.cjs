const fs = require('fs');
let rules = fs.readFileSync('firestore.rules', 'utf8');

const oldRules = `    match /user_analyses/{analysisId} {
      function isValidAnalysis(data) {
        return isValidId(data.get('userId', '')) &&
               data.get('analysisType', '') is string;
      }
      allow read: if isSignedIn() && (resource == null || isOwner(resource.data.userId) || isAdmin() || isCoachOf(resource.data.userId) || isParentOf(resource.data.userId));
      allow create: if isSignedIn() && isValidAnalysis(incoming());
      allow update: if isSignedIn() && (isOwner(resource.data.userId) || isParentOf(resource.data.userId) || isCoachOf(resource.data.userId) || isAdmin()) && (
        incoming().diff(existing()).affectedKeys().hasOnly(['aiInsight', 'data'])
      );
      allow delete: if isAdmin();
    }`;

const newRules = `    match /user_analyses/{analysisId} {
      function isValidAnalysis(data) {
        return isValidId(data.get('userId', '')) &&
               data.get('analysisType', '') is string;
      }
      allow read: if isSignedIn() && (resource == null || isOwner(resource.data.userId) || isAdmin() || isCoachOf(resource.data.userId) || isParentOf(resource.data.userId));
      allow create: if isSignedIn() && (isOwner(incoming().get('userId', '')) || isAdmin() || isCoachOf(incoming().get('userId', '')) || isParentOf(incoming().get('userId', ''))) && isValidAnalysis(incoming());
      allow update: if isSignedIn() && (isOwner(resource.data.userId) || isAdmin() || isCoachOf(resource.data.userId) || isParentOf(resource.data.userId)) && (
        incoming().diff(existing()).affectedKeys().hasOnly(['aiInsight', 'data'])
      );
      allow delete: if isAdmin();
    }`;

if (rules.includes('allow create: if isSignedIn() && isValidAnalysis(incoming());')) {
  rules = rules.replace(oldRules, newRules);
  fs.writeFileSync('firestore.rules', rules);
  console.log("Rules patched");
} else {
  console.log("Could not find the target string.");
}

