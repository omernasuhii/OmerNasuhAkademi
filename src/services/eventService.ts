import { collection, doc, getDocs, getDoc, setDoc, updateDoc, deleteDoc, query, where, orderBy } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { handleFirestoreError, OperationType } from './appointmentService';

export type EventType = 'rsvp' | 'ticketed';
export type EventStatus = 'draft' | 'published';
export type EventLocationType = 'physical' | 'online' | 'tbd';
export type DateType = 'fixed' | 'tbd';

export interface TicketTypeInfo {
  id: string;
  name: string;
  price: number;
  capacity?: number;
  soldCount: number;
}

export interface EventData {
  id?: string;
  title: string;
  description: string;
  image?: string;
  eventType: EventType;
  status: EventStatus;
  locationType: EventLocationType;
  locationDetails?: string; 
  dateType: DateType;
  startDate?: string;
  endDate?: string;
  category?: string;
  capacityLimit?: number; 
  hasCapacityLimit: boolean;

  // RSVP Specific
  showGuestList: boolean;
  
  // Ticket Specific
  tickets: TicketTypeInfo[];
  maxTicketsPerOrder?: number;
  
  createdAt: string;
}

export interface EventRSVP {
  id?: string;
  eventId: string;
  studentId: string;
  studentName?: string;
  status: 'attending' | 'not_attending';
  createdAt: string;
}

export interface TicketOrder {
  id?: string;
  eventId: string;
  studentId: string;
  studentName?: string;
  ticketTypeId: string;
  quantity: number;
  totalPrice: number;
  createdAt: string;
}

export const eventService = {
  async getEvents(role: 'admin' | 'student') {
    try {
      let q = collection(db, 'events');
      if (role === 'student') {
         q = query(collection(db, 'events'), where('status', '==', 'published')) as any;
      }
      const snap = await getDocs(q);
      
      let events = snap.docs.map(doc => ({ id: doc.id, ...doc.data() } as EventData));
      
      // Sort by createdAt descending locally (since where + orderBy might require an index)
      events.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      
      return events;
    } catch (error) {
      handleFirestoreError(error, OperationType.GET, 'events');
      return [];
    }
  },

  async getEventById(id: string) {
    try {
      const docRef = doc(db, 'events', id);
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        return { id: docSnap.id, ...docSnap.data() } as EventData;
      }
      return null;
    } catch (error) {
      handleFirestoreError(error, OperationType.GET, 'events');
      return null;
    }
  },

  async createEvent(eventData: Omit<EventData, 'id' | 'createdAt'>) {
    try {
      const newRef = doc(collection(db, 'events'));
      const event: EventData = {
        ...eventData,
        id: newRef.id,
        createdAt: new Date().toISOString(),
      };
      await setDoc(newRef, event);
      return event;
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, 'events');
      throw error;
    }
  },

  async updateEvent(id: string, updates: Partial<EventData>) {
    try {
      const docRef = doc(db, 'events', id);
      await updateDoc(docRef, updates);
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, 'events');
      throw error;
    }
  },

  async deleteEvent(id: string) {
    try {
      const docRef = doc(db, 'events', id);
      await deleteDoc(docRef);
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, 'events');
      throw error;
    }
  },

  async submitRSVP(rsvpData: Omit<EventRSVP, 'id' | 'createdAt'>) {
    try {
      // First, check if RSVP exists to update or create
      const q = query(collection(db, 'event_rsvps'), 
        where('eventId', '==', rsvpData.eventId), 
        where('studentId', '==', rsvpData.studentId)
      );
      const snap = await getDocs(q);
      
      if (!snap.empty) {
        const existingId = snap.docs[0].id;
        await updateDoc(doc(db, 'event_rsvps', existingId), { status: rsvpData.status });
        return { id: existingId, ...rsvpData, createdAt: snap.docs[0].data().createdAt };
      } else {
        const newRef = doc(collection(db, 'event_rsvps'));
        const rsvp: EventRSVP = {
          ...rsvpData,
          id: newRef.id,
          createdAt: new Date().toISOString()
        };
        await setDoc(newRef, rsvp);
        return rsvp;
      }
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, 'event_rsvps');
      throw error;
    }
  },

  async getStudentRSVPs(studentId: string) {
    try {
      const q = query(collection(db, 'event_rsvps'), where('studentId', '==', studentId));
      const snap = await getDocs(q);
      return snap.docs.map(doc => ({ id: doc.id, ...doc.data() } as EventRSVP));
    } catch (error) {
       handleFirestoreError(error, OperationType.GET, 'event_rsvps');
       return [];
    }
  },

  async getEventRSVPs(eventId: string) {
     try {
      const q = query(collection(db, 'event_rsvps'), where('eventId', '==', eventId));
      const snap = await getDocs(q);
      return snap.docs.map(doc => ({ id: doc.id, ...doc.data() } as EventRSVP));
    } catch (error) {
       handleFirestoreError(error, OperationType.GET, 'event_rsvps');
       return [];
    }
  },

  async buyTicket(orderData: Omit<TicketOrder, 'id' | 'createdAt'>) {
    try {
      const newRef = doc(collection(db, 'ticket_orders'));
      const order: TicketOrder = {
        ...orderData,
        id: newRef.id,
        createdAt: new Date().toISOString()
      };
      
      // We should theoretically do this in a transaction and update the ticket sold count.
      // For the simplicity of this app, we will just update it directly.
      const eventRef = doc(db, 'events', orderData.eventId);
      const eventSnap = await getDoc(eventRef);
      
      if (eventSnap.exists()) {
        const evData = eventSnap.data() as EventData;
        const ticketIdx = evData.tickets?.findIndex(t => t.id === orderData.ticketTypeId);
        
        if (ticketIdx !== undefined && ticketIdx >= 0) {
            evData.tickets[ticketIdx].soldCount = (evData.tickets[ticketIdx].soldCount || 0) + orderData.quantity;
            await updateDoc(eventRef, { tickets: evData.tickets });
        }
      }
      
      await setDoc(newRef, order);
      return order;
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, 'ticket_orders');
      throw error;
    }
  },
  
  async getStudentTicketOrders(studentId: string) {
    try {
      const q = query(collection(db, 'ticket_orders'), where('studentId', '==', studentId));
      const snap = await getDocs(q);
      return snap.docs.map(doc => ({ id: doc.id, ...doc.data() } as TicketOrder));
    } catch (error) {
       handleFirestoreError(error, OperationType.GET, 'ticket_orders');
       return [];
    }
  }
};
