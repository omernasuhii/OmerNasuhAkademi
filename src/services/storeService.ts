import { collection, doc, getDocs, getDoc, setDoc, updateDoc, deleteDoc, query, where, orderBy, Timestamp, runTransaction } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { chocolateBankService } from './chocolateBankService';

export interface Product {
  id?: string;
  title: string;
  description: string;
  image?: string;
  price: number; 
  stock?: number | null;
  isActive: boolean;
  category: string;
  examType?: string;
  difficulty?: number;
  subject?: string;
  publicationType?: string;
  publisher?: string;
  bookstore?: string;
  type: 'digital' | 'physical';
  createdAt: string;
}

export interface Purchase {
  id?: string;
  studentId: string;
  productId: string;
  productTitle: string;
  purchasedAt: string;
  status: 'completed' | 'pending' | 'delivered';
  cost: number;
  quantity?: number;
  totalCost?: number;
}

export const storeService = {
  async getProducts(role: 'admin' | 'student') {
    try {
      const q = role === 'admin' 
        ? query(collection(db, 'products'), orderBy('createdAt', 'desc'))
        : query(collection(db, 'products'), where('isActive', '==', true), orderBy('createdAt', 'desc'));
      
      const snap = await getDocs(q);
      return snap.docs.map(doc => ({ id: doc.id, ...doc.data() } as Product));
    } catch (error) {
      console.error('Error fetching products:', error);
      return [];
    }
  },

  async createProduct(productData: Omit<Product, 'id' | 'createdAt'>) {
    try {
      const newRef = doc(collection(db, 'products'));
      const product: Product = {
        ...productData,
        id: newRef.id,
        createdAt: new Date().toISOString(),
      };
      await setDoc(newRef, product);
      return product;
    } catch (error) {
      console.error('Error creating product:', error);
      throw error;
    }
  },

  async updateProduct(id: string, updates: Partial<Product>) {
    try {
      const docRef = doc(db, 'products', id);
      await updateDoc(docRef, updates);
    } catch (error) {
      console.error('Error updating product:', error);
      throw error;
    }
  },

  async deleteProduct(id: string) {
    try {
      const docRef = doc(db, 'products', id);
      await deleteDoc(docRef);
    } catch (error) {
      console.error('Error deleting product:', error);
      throw error;
    }
  },

  async purchaseProduct(studentId: string, productId: string, quantity: number = 1) {
    try {
      // Use a transaction if stock logic is needed, but we can do a simpler orchestrator here.
      const productDef = await getDoc(doc(db, 'products', productId));
      if (!productDef.exists()) throw new Error('Product not found');
      
      const product = productDef.data() as Product;
      if (!product.isActive) throw new Error('Product is not active');
      if (product.stock !== undefined && product.stock !== null && product.stock < quantity) {
        throw new Error('Product is out of stock');
      }

      // Remove points deduction since this is a real-money store now.
      // In the future this will integrate with an actual cart and payment provider.

      // Record purchase
      const purchaseRef = doc(collection(db, 'purchases'));
      const purchase: Purchase = {
        id: purchaseRef.id,
        studentId,
        productId: productDef.id,
        productTitle: product.title,
        purchasedAt: new Date().toISOString(),
        status: product.type === 'digital' ? 'completed' : 'pending',
        cost: product.price,
        quantity,
        totalCost: product.price * quantity
      };
      await setDoc(purchaseRef, purchase);

      // Decrease stock if applicable
      if (product.stock !== undefined && product.stock !== null) {
        await updateDoc(doc(db, 'products', productId), {
          stock: product.stock - quantity
        });
      }

      return purchase;
    } catch (error) {
      console.error('Error purchasing product:', error);
      throw error;
    }
  },

  async getPurchases(studentId?: string) {
    try {
      let q = collection(db, 'purchases') as any;
      if (studentId) {
        q = query(q, where('studentId', '==', studentId), orderBy('purchasedAt', 'desc'));
      } else {
        q = query(q, orderBy('purchasedAt', 'desc'));
      }
      
      const snap = await getDocs(q);
      return snap.docs.map(doc => ({ id: doc.id, ...(doc.data() as any) } as Purchase));
    } catch (error) {
      console.error('Error fetching purchases:', error);
      return [];
    }
  }
};
