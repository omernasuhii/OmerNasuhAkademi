const fs = require('fs');
let rules = fs.readFileSync('firestore.rules', 'utf8');

const oldAdmin = `    function isSystemAdmin() {
      return isSignedIn() && (request.auth.token.email == 'destek@omernasuhakademi.com' || request.auth.token.email == 'ustunegitimdanismanligi@gmail.com');
    }`;

const newAdmin = `    function isSystemAdmin() {
      return isSignedIn() && request.auth.token.email == 'destek@omernasuhakademi.com';
    }`;

rules = rules.replace(oldAdmin, newAdmin);
fs.writeFileSync('firestore.rules', rules);
