import React, { createContext, useContext, useState, useEffect } from 'react';

export type CartItemType = 'product' | 'event' | 'course';

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
  addToCart: (item: Omit<CartItem, 'id'> & { quantity?: number }) => void;
  removeFromCart: (itemId: string) => void;
  updateQuantity: (itemId: string, quantity: number) => void;
  clearCart: () => void;
  totalItems: number;
  totalPrice: number;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);

  useEffect(() => {
    try {
      const saved = localStorage.getItem('user_cart');
      if (saved) setItems(JSON.parse(saved));
    } catch (e) {}
  }, []);

  const saveCart = (newItems: CartItem[]) => {
    setItems(newItems);
    localStorage.setItem('user_cart', JSON.stringify(newItems));
  };

  const addToCart = (item: Omit<CartItem, 'id'> & { quantity?: number }) => {
    const existingIndex = items.findIndex(i => i.itemId === item.itemId && i.type === item.type);
    const qty = item.quantity || 1;
    if (existingIndex >= 0) {
      const newItems = [...items];
      newItems[existingIndex].quantity += qty;
      saveCart(newItems);
    } else {
      saveCart([...items, { ...item, id: `${item.type}_${item.itemId}`, quantity: qty }]);
    }
  };

  const removeFromCart = (itemId: string) => {
    saveCart(items.filter(i => i.id !== itemId));
  };

  const updateQuantity = (itemId: string, quantity: number) => {
    if (quantity <= 0) {
      removeFromCart(itemId);
      return;
    }
    const newItems = items.map(item => 
      item.id === itemId ? { ...item, quantity } : item
    );
    saveCart(newItems);
  };

  const clearCart = () => {
    saveCart([]);
  };

  const totalItems = items.reduce((sum, item) => sum + item.quantity, 0);
  const totalPrice = items.reduce((sum, item) => sum + (item.price * item.quantity), 0);

  return (
    <CartContext.Provider value={{ items, addToCart, removeFromCart, updateQuantity, clearCart, totalItems, totalPrice }}>
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const context = useContext(CartContext);
  if (context === undefined) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
}
