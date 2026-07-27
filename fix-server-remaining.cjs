const fs = require('fs');
let code = fs.readFileSync('server.ts', 'utf8');

const sendWhatsAppOld = `  if (admin.apps.length) {
    try {
      await admin.firestore().collection("phone_verifications").doc(formattedPhone).set({
        code: code,
        uid: uid || null,
        origin: origin || null,
        updatedAt: admin.firestore.FieldValue.serverTimestamp()
      });
    } catch (dbErr) {
      console.error("[Twilio WhatsApp] Error saving verification code to Firestore:", dbErr);
    }
  }`;

const sendWhatsAppNew = `  if (admin.apps.length && process.env.FIREBASE_SERVICE_ACCOUNT) {
    try {
      await admin.firestore().collection("phone_verifications").doc(formattedPhone).set({
        code: code,
        uid: uid || null,
        origin: origin || null,
        updatedAt: admin.firestore.FieldValue.serverTimestamp()
      });
    } catch (dbErr) {
      console.error("[Twilio WhatsApp] Error saving verification code to Firestore:", dbErr);
    }
  } else {
    try {
      const { db } = await import('./src/lib/firebase.ts');
      const { doc, setDoc, serverTimestamp } = await import('firebase/firestore');
      await setDoc(doc(db, "phone_verifications", formattedPhone), {
        code: code,
        uid: uid || null,
        origin: origin || null,
        updatedAt: serverTimestamp()
      });
    } catch (dbErr) {
      console.error("[Twilio WhatsApp] Error saving verification code to Client SDK Firestore:", dbErr);
    }
  }`;

code = code.replace(sendWhatsAppOld, sendWhatsAppNew);

const verifyDirectOld = `    if (!admin.apps.length) {
      return res.status(503).json({ error: "Firebase Admin initialized değil." });
    }
    const dbAdmin = admin.firestore();`;

const verifyDirectNew = `    let dbAdmin;
    let isClientSDK = false;
    if (admin.apps.length && process.env.FIREBASE_SERVICE_ACCOUNT) {
      dbAdmin = admin.firestore();
    } else {
      isClientSDK = true;
      const { db } = await import('./src/lib/firebase.ts');
      const { collection, getDocs, query, where, doc, updateDoc, writeBatch } = await import('firebase/firestore');
      dbAdmin = {
         collection: (path) => ({
             where: (field, op, val) => ({
                 get: async () => {
                     const q = query(collection(db, path), where(field, op, val));
                     const snap = await getDocs(q);
                     return {
                        empty: snap.empty,
                        size: snap.size,
                        docs: snap.docs.map(d => ({ ref: d.ref, data: () => d.data() }))
                     };
                 }
             })
         }),
         batch: () => {
             const b = writeBatch(db);
             return {
                 update: (ref, data) => b.update(ref, data),
                 commit: () => b.commit()
             }
         }
      };
    }`;

code = code.replace(verifyDirectOld, verifyDirectNew);

const verifySuccessOld = `    if (!admin.apps.length) {
      return res.json({ success: true, message: "Firebase Admin not initialized" });
    }
    const dbAdmin = admin.firestore();`;

const verifySuccessNew = `    let dbAdmin;
    if (admin.apps.length && process.env.FIREBASE_SERVICE_ACCOUNT) {
      dbAdmin = admin.firestore();
    } else {
      const { db } = await import('./src/lib/firebase.ts');
      const { collection, getDocs, query, where, doc, updateDoc, writeBatch } = await import('firebase/firestore');
      dbAdmin = {
         collection: (path) => ({
             where: (field, op, val) => ({
                 get: async () => {
                     const q = query(collection(db, path), where(field, op, val));
                     const snap = await getDocs(q);
                     return {
                        empty: snap.empty,
                        size: snap.size,
                        docs: snap.docs.map(d => ({ ref: d.ref }))
                     };
                 }
             })
         }),
         batch: () => {
             const b = writeBatch(db);
             return {
                 update: (ref, data) => b.update(ref, data),
                 commit: () => b.commit()
             }
         }
      };
    }`;

code = code.replace(verifySuccessOld, verifySuccessNew);

fs.writeFileSync('server.ts', code);
