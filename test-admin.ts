import admin from 'firebase-admin';

async function test() {
  try {
    admin.initializeApp();
    const db = admin.firestore();
    await db.collection('test_admin').add({ test: true });
    console.log("Admin SDK initialized successfully and wrote to DB!");
  } catch (e) {
    console.error("Admin SDK failure:", e.message);
  }
}

test();
