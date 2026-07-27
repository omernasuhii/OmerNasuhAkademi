const admin = require('firebase-admin');
try {
  admin.initializeApp();
  console.log("Success", admin.apps.length);
} catch (e) {
  console.error("Failed:", e.message);
}
