import { 
  collection, 
  doc, 
  getDoc, 
  getDocs, 
  setDoc, 
  updateDoc, 
  query, 
  where, 
  orderBy, 
  serverTimestamp,
  addDoc,
  onSnapshot
} from 'firebase/firestore';
import { db, auth } from '../lib/firebase';
import { notificationService } from './notificationService';

export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
    tenantId?: string | null;
    providerInfo?: {
      providerId?: string | null;
      email?: string | null;
    }[];
  }
}

export function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  if (!auth.currentUser) {
    console.warn('Ignored Firestore error because user is not authenticated:', error);
    return;
  }

  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid || 'AUTH_CURRENT_USER_WAS_NULL_OR_NOT_FOUND',
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
      tenantId: auth.currentUser?.tenantId,
      providerInfo: auth.currentUser?.providerData?.map(provider => ({
        providerId: provider.providerId,
        email: provider.email,
      })) || []
    },
    operationType,
    path
  }
  console.error('Firestore Error: ', JSON.stringify(errInfo));
}

export interface TimeSlot {
  start: string; // HH:mm
  end: string;   // HH:mm
}

export type ServiceType = 'one-on-one' | 'lesson' | 'course';
export type PaymentType = 'cash' | 'subscription' | 'both';

export interface Service {
  id?: string;
  title: string;
  type: ServiceType;
  description: string;
  basePrice: number;
  paymentTypes: ('cash' | 'subscription')[];
  isOnlineAvailable: boolean;
  allowOnlineRequest: boolean; // Online talep kapatılabilir
  isActive: boolean;
  assignedCoachIds: string[];
  assignedRoomIds: string[]; // Belirli odalar/sınıflar atanabilir
  cancellationPolicy: string; // İptal iade ve değişiklik politikası
  locationType: 'default' | 'custom' | 'student_address';
  customLocation?: string; // İşletme haricinde bir konum

  // Sadece Birebir (One-on-One) için
  duration: number; // minutes
  bufferTime?: number; // Dinlenme süresi (minutes)
  approvalType: 'automatic' | 'manual';
  variablePricingEnabled: boolean; // Ücret değişken olabilir (personel, Süre, Hizmet)
  pricingVariations?: any[]; // { criteria: 'coach'|'duration', targetId: string, price: number }
  multipleRequestsPerSession: boolean; // Talepler 1 seans için 1'den fazla da olacak şekilde açılabilir

  // Sadece Ders ve Kurs (Lesson & Course) için
  maxParticipants: number;
  allowCoachSubstitution: boolean; // Derslere/Kurslara atanan personel değişiklik gösterebilir
  isRecurring: boolean; // Ders için zorunlu, Kurs için opsiyonel
  recurringDays?: string[]; // (örn: ['monday', 'wednesday']) Haftalık olarak planlanabilir
  enableWaitingList: boolean; // Tüm taleplerin dolması durumunda bekleme listesi
  maxPeoplePerRequest: number; // Talep başına kişi sayısı (ör. 3 arkadaş tek randevu)
}

export interface Room {
  id?: string;
  name: string;
  capacity: number;
  type: 'physical' | 'virtual';
  isActive: boolean;
}

export interface Booking {
  id?: string;
  studentId: string;
  requesterId?: string;
  requesterRole?: 'student' | 'parent';
  studentName: string;
  serviceId: string;
  serviceType: ServiceType;
  coachId?: string;
  coachName?: string;
  roomId?: string;
  roomName?: string;
  date: string;
  startTime: string;
  endTime?: string;
  status: 'pending' | 'confirmed' | 'cancelled' | 'completed' | 'missed';
  paymentStatus: 'unpaid' | 'paid';
  paymentMethod?: 'cash' | 'subscription';
  isOnline: boolean;
  location?: string;
  participantCount: number;
  createdAt?: any;
  updatedAt?: any;
}

export interface WeeklySchedule {
  [key: string]: TimeSlot[]; // e.g., 'monday', 'tuesday', etc.
}

export interface BlockedDate {
  id: string;
  startDate: string;
  endDate: string;
  isAllDay?: boolean;
  startTime?: string;
  endTime?: string;
  reason?: string;
}

export interface CoachSchedule {
  coachId: string;
  weeklyHours: WeeklySchedule;
  manualBusySlots?: { date: string, start: string, end: string }[];
  blockedDates?: BlockedDate[];
}

export const appointmentService = {
  // Services
  async getServices() {
    try {
      const q = query(collection(db, 'services'), where('isActive', '==', true));
      const snap = await getDocs(q);
      return snap.docs.map(doc => ({ id: doc.id, ...doc.data() } as Service));
    } catch (error) {
      handleFirestoreError(error, OperationType.LIST, 'services');
      return [];
    }
  },

  async createService(data: Omit<Service, 'id'>) {
    try {
      const docRef = await addDoc(collection(db, 'services'), {
        ...data,
        createdAt: serverTimestamp()
      });
      return docRef.id;
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, 'services');
      throw error;
    }
  },

  async updateService(id: string, data: Partial<Service>) {
    try {
      const { id: _, ...cleanData } = data as any;
      await updateDoc(doc(db, 'services', id), {
        ...cleanData,
        updatedAt: serverTimestamp()
      });
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `services/${id}`);
      throw error;
    }
  },

  async deleteService(id: string) {
    try {
      await updateDoc(doc(db, 'services', id), {
        isActive: false,
        updatedAt: serverTimestamp()
      });
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `services/${id}`);
      throw error;
    }
  },

  // Rooms
  async getRooms() {
    try {
      const snap = await getDocs(collection(db, 'rooms'));
      return snap.docs.map(doc => ({ id: doc.id, ...doc.data() } as Room));
    } catch (error) {
      handleFirestoreError(error, OperationType.LIST, 'rooms');
      return [];
    }
  },

  async createRoom(data: Omit<Room, 'id'>) {
    try {
      const docRef = await addDoc(collection(db, 'rooms'), {
        ...data,
        createdAt: serverTimestamp()
      });
      return docRef.id;
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, 'rooms');
      throw error;
    }
  },

  async updateRoom(id: string, data: Partial<Room>) {
    try {
      const { id: _, ...cleanData } = data as any;
      await updateDoc(doc(db, 'rooms', id), {
        ...cleanData,
        updatedAt: serverTimestamp()
      });
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `rooms/${id}`);
      throw error;
    }
  },

  // Existing functionality updated
  async getCoaches() {
    try {
      const q = query(collection(db, 'users'), where('role', '==', 'coach'));
      const snap = await getDocs(q);
      const coaches = snap.docs.map(doc => {
        const data = doc.data() as any;
        return { 
          uid: doc.id, 
          ...data,
          displayName: data.displayName || (data.firstName && data.lastName ? `${data.firstName} ${data.lastName}` : data.firstName || data.email?.split('@')[0] || 'İsimsiz Personel')
        };
      });
      
      if (coaches.length === 0) {
        // Fallback: fetch all and filter client-side
        const allSnap = await getDocs(collection(db, 'users'));
        const allCoaches = allSnap.docs
          .map(doc => {
            const data = doc.data() as any;
            return { 
              uid: doc.id, 
              ...data,
              displayName: data.displayName || (data.firstName && data.lastName ? `${data.firstName} ${data.lastName}` : data.firstName || data.email?.split('@')[0] || 'İsimsiz Personel')
            };
          })
          .filter(u => u.role === 'coach');
        return allCoaches;
      }
      
      return coaches;
    } catch (error) {
      handleFirestoreError(error, OperationType.LIST, 'users');
      return [];
    }
  },

  async getCoachSchedule(coachId: string): Promise<CoachSchedule | null> {
    try {
      const docRef = doc(db, 'coach_schedules', coachId);
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        return docSnap.data() as CoachSchedule;
      }
      return null;
    } catch (error) {
      handleFirestoreError(error, OperationType.GET, `coach_schedules/${coachId}`);
      return null;
    }
  },

  async updateCoachSchedule(coachId: string, schedule: Partial<CoachSchedule>) {
    try {
      const docRef = doc(db, 'coach_schedules', coachId);
      await setDoc(docRef, { 
        coachId, 
        ...schedule,
        updatedAt: serverTimestamp() 
      }, { merge: true });
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, `coach_schedules/${coachId}`);
      throw error;
    }
  },

  async bookAppointment(data: Omit<Booking, 'id' | 'createdAt' | 'updatedAt'>) {
    try {
      const colRef = collection(db, 'appointments');
      const docRef = await addDoc(colRef, {
        ...data,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });
      
      const currentUserUid = auth.currentUser?.uid;
      
      // Notify Coach if Student booked
      if (currentUserUid === data.studentId && data.coachId) {
          try {
             await notificationService.addNotification(data.coachId, {
                title: 'Yeni Randevu Talebi',
                message: `Öğrenciniz '${data.studentName}' ${data.date} tarihinde saat ${data.startTime} için bir randevu talep etti.`,
                type: 'appointment',
                link: '/panel/koc/randevular'
             });
          } catch(e) {}
      }
      // Notify Student if Coach booked
      else if (currentUserUid === data.coachId) {
          try {
             await notificationService.addNotification(data.studentId, {
                title: 'Yeni Randevu Atandı',
                message: `Koçun sana ${data.date} tarihi saat ${data.startTime} için yeni bir randevu atadı.`,
                type: 'appointment',
                link: '/panel/ogrenci/randevular'
             });
          } catch(e) {}
      }

      return docRef.id;
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, 'appointments');
      throw error;
    }
  },

  async getAppointments(userId: string, role: 'student' | 'coach' | 'admin') {
    if (!auth.currentUser) return [];
    
    let q;
    const colRef = collection(db, 'appointments');
    
    if (role === 'admin') {
      q = query(colRef, orderBy('date', 'desc'), orderBy('startTime', 'asc'));
    } else if (role === 'coach') {
      q = query(colRef, where('coachId', '==', userId), orderBy('date', 'desc'), orderBy('startTime', 'asc'));
    } else {
      q = query(colRef, where('studentId', '==', userId), orderBy('date', 'desc'), orderBy('startTime', 'asc'));
    }

    try {
      const snap = await getDocs(q);
      return snap.docs.map(doc => ({ id: doc.id, ...(doc.data() as any) } as Booking));
    } catch (error) {
      handleFirestoreError(error, OperationType.GET, 'appointments');
      return [];
    }
  },

  onAppointmentsChange(role: 'admin' | 'coach' | 'student', userId: string, callback: (appointments: Booking[]) => void) {
    if (!auth.currentUser) {
      callback([]);
      return () => {};
    }

    let q;
    const colRef = collection(db, 'appointments');
    
    if (role === 'admin') {
      q = query(colRef, orderBy('date', 'desc'), orderBy('startTime', 'asc'));
    } else if (role === 'coach') {
      q = query(colRef, where('coachId', '==', userId), orderBy('date', 'desc'), orderBy('startTime', 'asc'));
    } else {
      q = query(colRef, where('studentId', '==', userId), orderBy('date', 'desc'), orderBy('startTime', 'asc'));
    }

    return onSnapshot(q, (snap) => {
      const apps = snap.docs.map(doc => ({ id: doc.id, ...(doc.data() as any) } as Booking));
      callback(apps);
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, 'appointments');
    });
  },

  async updateAppointmentStatus(appointmentId: string, status: Booking['status']) {
    try {
      const docRef = doc(db, 'appointments', appointmentId);
      const appSnap = await getDoc(docRef);
      await updateDoc(docRef, { 
        status, 
        updatedAt: serverTimestamp() 
      });
      
      if (appSnap.exists()) {
         const data = appSnap.data() as Booking;
         const currentUserUid = auth.currentUser?.uid;
         
         if (currentUserUid === data.coachId) {
             if (status === 'confirmed') {
                 await notificationService.addNotification(data.studentId, {
                     title: 'Randevu Onaylandı',
                     message: `Harika! ${data.date} saat ${data.startTime} için olan randevun koçun tarafından onaylandı.`,
                     type: 'appointment',
                     link: '/panel/ogrenci/randevular'
                 });
             } else if (status === 'cancelled') {
                 await notificationService.addNotification(data.studentId, {
                     title: 'Randevu İptal Edildi',
                     message: `Maalesef ${data.date} saat ${data.startTime} için olan randevun koçun tarafından iptal edildi. Lütfen yeni bir randevu al.`,
                     type: 'appointment',
                     link: '/panel/ogrenci/randevular'
                 });
             }
         } else if (currentUserUid === data.studentId) {
             if (status === 'cancelled') {
                 if (data.coachId) {
                     await notificationService.addNotification(data.coachId, {
                         title: 'Randevu İptal Edildi',
                         message: `Öğrenciniz '${data.studentName}', ${data.date} saat ${data.startTime} için olan randevusunu iptal etti.`,
                         type: 'appointment',
                         link: '/panel/koc/randevular'
                     });
                 }
             }
         }
      }
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `appointments/${appointmentId}`);
      throw error;
    }
  },

  async updateAppointment(appointmentId: string, data: Partial<Booking>) {
    try {
      const { id: _, ...cleanData } = data as any;
      const docRef = doc(db, 'appointments', appointmentId);
      const appSnap = await getDoc(docRef);
      await updateDoc(docRef, {
        ...cleanData,
        updatedAt: serverTimestamp()
      });
      
      if (appSnap.exists()) {
          const oldData = appSnap.data() as Booking;
          const currentUserUid = auth.currentUser?.uid;
          
          if (currentUserUid === oldData.studentId && oldData.coachId) {
             await notificationService.addNotification(oldData.coachId, {
                 title: 'Randevu Güncellendi',
                 message: `Öğrenciniz '${oldData.studentName}', randevusunu ${data.date || oldData.date} tarihi saat ${data.startTime || oldData.startTime} olarak güncelledi.`,
                 type: 'appointment',
                 link: '/panel/koc/randevular'
             });
          } else if (currentUserUid === oldData.coachId) {
             await notificationService.addNotification(oldData.studentId, {
                 title: 'Randevu Güncellendi',
                 message: `Koçun, randevunu ${data.date || oldData.date} tarihi saat ${data.startTime || oldData.startTime} olarak güncelledi.`,
                 type: 'appointment',
                 link: '/panel/ogrenci/randevular'
             });
          }
      }
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `appointments/${appointmentId}`);
      throw error;
    }
  },

  async getCoachStudents(coachId: string) {
    try {
      const q = query(collection(db, 'users'), where('role', '==', 'student'), where('coachId', '==', coachId));
      const snap = await getDocs(q);
      return snap.docs.map(doc => ({ uid: doc.id, ...doc.data() } as any));
    } catch (error) {
      handleFirestoreError(error, OperationType.LIST, 'users');
      return [];
    }
  },

  async getAllStudents() {
    try {
      const q = query(collection(db, 'users'), where('role', '==', 'student'));
      const snap = await getDocs(q);
      return snap.docs.map(doc => ({ uid: doc.id, ...doc.data() } as any));
    } catch (error) {
      handleFirestoreError(error, OperationType.LIST, 'users');
      return [];
    }
  }
};
