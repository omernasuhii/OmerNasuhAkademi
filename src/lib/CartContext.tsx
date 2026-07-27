import React, { createContext, useContext, useState, useEffect } from "react";
import { useAuth } from "./AuthContext";
import { cartService } from "../services/cartService";
import { safeStorage } from "./localStorage";

export type CartItemType = "product" | "event" | "course" | "subscription";

export interface CartItem {
  id: string; // unique cart item id (can be same as itemId if 1 qty per item max)
  itemId: string; // original product/event id
  type: CartItemType;
  title: string;
  price: number;
  image?: string;
  quantity: number;
  metadata?: any;
}

interface CartContextType {
  items: CartItem[];
  addToCart: (item: Omit<CartItem, "id"> & { quantity?: number }) => void;
  removeFromCart: (itemId: string) => void;
  updateQuantity: (itemId: string, quantity: number) => void;
  clearCart: () => void;
  totalItems: number;
  totalPrice: number;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export function CartProvider({ children }: { children: React.ReactNode }) {
  const { user, userData, loading } = useAuth();
  const [items, setItems] = useState<CartItem[]>([]);
  const [isInitialized, setIsInitialized] = useState(false);
  const [currentUser, setCurrentUser] = useState<string | null | undefined>(
    undefined,
  );

  // Handle User Change & Initialization
  useEffect(() => {
    if (loading) return;

    // Detect user change
    const currentUserId = user ? user.uid : null;
    if (currentUser !== currentUserId) {
      setCurrentUser(currentUserId);
      setIsInitialized(false);

      // Sadece login olan kullanıcının sepeti olur, logout olunca sepeti temizle
      if (!currentUserId) {
        setItems([]);
      }
      return; // Re-run effect after state update
    }

    if (!isInitialized && user) {
      const initCart = async () => {
        const cartKey = `user_cart_${user.uid}`;
        let initialItems: CartItem[] = [];

        // Try to load from current LocalStorage
        try {
          const saved = safeStorage.getItem(cartKey);
          if (saved) {
            initialItems = JSON.parse(saved);
          }
        } catch (e) {}

        // Fetch from Firestore
        try {
          const { getDoc, doc } = await import("firebase/firestore");
          const { db } = await import("./firebase");

          const docRef = doc(db, "users", user.uid);
          const snap = await getDoc(docRef);
          if (snap.exists() && snap.data().cart && snap.data().cart.items) {
            initialItems = snap.data().cart.items;
            safeStorage.setItem(cartKey, JSON.stringify(initialItems));
          }
        } catch (e) {
          console.error("Error fetching remote cart", e);
        }

        setItems(initialItems);
        setIsInitialized(true);
      };

      initCart();
    } else if (!user) {
      setItems([]);
      setIsInitialized(true);
    }
  }, [user, loading, isInitialized, currentUser]);

  // Sync to firestore on user login, or on cart change if logged in
  useEffect(() => {
    const hasUserData = !!userData;
    if (user && hasUserData && isInitialized) {
      cartService.syncCart(user.uid, items);
    }
  }, [user, !!userData, items, isInitialized]);

  const saveCart = (newItems: CartItem[]) => {
    if (!user) return;
    setItems(newItems);
    const cartKey = `user_cart_${user.uid}`;
    safeStorage.setItem(cartKey, JSON.stringify(newItems));
  };

  const addToCart = (item: Omit<CartItem, "id"> & { quantity?: number }) => {
    if (!user) {
      alert("Sepete ürün eklemek için lütfen giriş yapın.");
      return;
    }

    let currentItems = [...items];

    // Eğer sepete abonelik ekleniyorsa, sepetteki diğer abonelikleri temizle (Sadece 1 tür abonelik paketi olabilir)
    if (item.type === "subscription") {
      currentItems = currentItems.filter(
        (i) => i.type !== "subscription" || i.itemId === item.itemId,
      );
    }

    const existingIndex = currentItems.findIndex(
      (i) => i.itemId === item.itemId && i.type === item.type,
    );
    const qty = item.quantity || 1;
    if (existingIndex >= 0) {
      if (item.type === "subscription") {
        // Aboneliklerin adeti artmaz, sadece var olmaya devam eder
        return;
      }
      currentItems[existingIndex].quantity += qty;
      saveCart(currentItems);
    } else {
      saveCart([
        ...currentItems,
        { ...item, id: `${item.type}_${item.itemId}`, quantity: qty },
      ]);
    }
  };

  const removeFromCart = (itemId: string) => {
    saveCart(items.filter((i) => i.id !== itemId));
  };

  const updateQuantity = (itemId: string, quantity: number) => {
    if (quantity <= 0) {
      removeFromCart(itemId);
      return;
    }
    const newItems = items.map((item) =>
      item.id === itemId ? { ...item, quantity } : item,
    );
    saveCart(newItems);
  };

  const clearCart = () => {
    saveCart([]);
  };

  const totalItems = items.reduce((sum, item) => sum + item.quantity, 0);
  const totalPrice = items.reduce(
    (sum, item) => sum + item.price * item.quantity,
    0,
  );

  return (
    <CartContext.Provider
      value={{
        items,
        addToCart,
        removeFromCart,
        updateQuantity,
        clearCart,
        totalItems,
        totalPrice,
      }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const context = useContext(CartContext);
  if (context === undefined) {
    throw new Error("useCart must be used within a CartProvider");
  }
  return context;
}
