import {
  collection,
  doc,
  updateDoc,
  getDocs,
  query,
  where,
  setDoc,
} from "firebase/firestore";
import { getAuth } from "firebase/auth";
import { db } from "../lib/firebase";

export const cartService = {
  async syncCart(userId: string, items: any[]) {
    try {
      const auth = getAuth();
      if (!auth.currentUser || auth.currentUser.uid !== userId) {
        return; // Prevent sync if not authenticated or user mismatch (e.g. during logout)
      }
      const docRef = doc(db, "users", userId);
      const sanitizedItems = JSON.parse(JSON.stringify(items));
      await setDoc(
        docRef,
        {
          cart: {
            items: sanitizedItems,
            updatedAt: new Date().toISOString(),
          }
        },
        { merge: true },
      );
    } catch (e: any) {
      if (e.code === 'permission-denied') {
         // Silently ignore permission denied during logout phase
         return;
      }
      console.error("Cart sync error", e);
    }
  },

  async getAbandonedCarts() {
    try {
      const q = query(collection(db, "users"), where("role", "==", "student"));
      const snap = await getDocs(q);
      const carts: any[] = [];

      snap.docs.forEach((doc) => {
        const data = doc.data();
        if (data.cart && Array.isArray(data.cart.items) && data.cart.items.length > 0) {
          carts.push({
            userId: doc.id,
            items: data.cart.items,
            updatedAt: data.cart.updatedAt || new Date().toISOString(),
          });
        }
      });

      return carts;
    } catch (e) {
      console.error("Cart fetch error", e);
      return [];
    }
  },
};
