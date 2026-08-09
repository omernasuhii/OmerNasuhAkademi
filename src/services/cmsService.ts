import { 
  collection, 
  doc, 
  getDoc, 
  getDocs, 
  query, 
  where, 
  orderBy, 
  limit, 
  setDoc, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  serverTimestamp 
} from 'firebase/firestore';
import { db } from '../lib/firebase';

export interface RelationshipResult {
  collectionId: string;
  collectionName: string;
  count: number;
  docIds: string[];
}

export const collectionMetadata: Record<string, { name: string; description: string; category: string }> = {
  users: { name: 'Kullanıcılar', description: 'Öğrenci, Koç, Veli ve Yönetici profilleri', category: 'Kullanıcı & Üyelik' },
  global_books: { name: 'Global Kitaplar', description: 'Sistem kütüphanesindeki kitaplar', category: 'Eğitim & Akademik' },
  daily_programs: { name: 'Günlük Programlar', description: 'Öğrenci günlük ders çalışma planları', category: 'Eğitim & Akademik' },
  routines: { name: 'Rutinler', description: 'Öğrenci günlük alışkanlık ve rutinleri', category: 'Eğitim & Akademik' },
  weekly_reports: { name: 'Haftalık Raporlar', description: 'Soru çözüm istatistikleri ve haftalık soru sayıları', category: 'Eğitim & Akademik' },
  exam_results: { name: 'Sınav Sonuçları', description: 'TYT, AYT, YDT deneme ve sınav skorları', category: 'Eğitim & Akademik' },
  exam_analyses: { name: 'Sınav Analizleri', description: 'Derinlemesine soru bazlı deneme analizleri', category: 'Eğitim & Akademik' },
  book_tracking: { name: 'Kitap Takibi', description: 'Öğrencilerin kitap bitirme ve soru durumları', category: 'Eğitim & Akademik' },
  weekly_programs: { name: 'Haftalık Programlar', description: 'Arşiv haftalık çalışma planları', category: 'Eğitim & Akademik' },
  monthly_goals: { name: 'Aylık Hedefler', description: 'Öğrencilerin aylık ders ve konu hedefleri', category: 'Eğitim & Akademik' },
  appointments: { name: 'Randevular', description: 'Koçluk ve ders randevu kayıtları', category: 'Koçluk & Görüşme' },
  coach_schedules: { name: 'Koç Takvimleri', description: 'Koçların müsaitlik zaman aralıkları', category: 'Koçluk & Görüşme' },
  services: { name: 'Hizmetler', description: 'Platformda sunulan paket ve hizmet tanımları', category: 'Sistem & Ayarlar' },
  rooms: { name: 'Odalar & Masalar', description: 'Sanal kütüphane çalışma masası ve odaları', category: 'Sistem & Ayarlar' },
  wallet_transactions: { name: 'Cüzdan Hareketleri', description: 'Ödeme, yükleme ve harcama finansal logları', category: 'İletişim & Finans' },
  user_analyses: { name: 'Üye Analiz Testleri', description: 'VAK-S, Çalışma Tarzı vb. test sonuçları', category: 'Eğitim & Akademik' },
  chocolate_bank_status: { name: 'Çikolata Bakiyeleri', description: 'Ödül sistemi kullanıcı puan bakiyeleri', category: 'İletişim & Finans' },
  chocolate_bank_transactions: { name: 'Çikolata Hareketleri', description: 'Çikolata puanı kazanım ve harcama geçmişi', category: 'İletişim & Finans' },
  notifications: { name: 'Bildirimler', description: 'Kullanıcılara gönderilen sistem bildirimleri', category: 'İletişim & Finans' },
  userTokens: { name: 'FCM Bildirim Tokenları', description: 'Mobil ve web push bildirim cihaz adresleri', category: 'Sistem & Ayarlar' },
  coupons: { name: 'İndirim Kuponları', description: 'Promosyon ve referans hediye kuponları', category: 'İletişim & Finans' },
  referral_history: { name: 'Referans Geçmişi', description: 'Davet kodu kullanım ve prim geçmişi', category: 'İletişim & Finans' },
  products: { name: 'Mağaza Ürünleri', description: 'Market ve hediyelik ürün kataloğu', category: 'Etkinlik & Mağaza' },
  purchases: { name: 'Satın Alımlar', description: 'Mağaza ürün siparişleri ve teslimat durumları', category: 'Etkinlik & Mağaza' },
  programs: { name: 'Eğitim Programları', description: 'Toplu kurs ve özel koçluk programları', category: 'Eğitim & Akademik' },
  program_enrollments: { name: 'Program Kayıtları', description: 'Öğrencilerin kayıt olduğu özel programlar', category: 'Eğitim & Akademik' },
  events: { name: 'Etkinlikler & Seminerler', description: 'Platform geneli canlı web seminer ve etkinlikler', category: 'Etkinlik & Mağaza' },
  event_rsvps: { name: 'Etkinlik Kayıtları', description: 'Etkinliklere katılan öğrenci kayıtları', category: 'Etkinlik & Mağaza' },
  ticket_orders: { name: 'Bilet Siparişleri', description: 'Ücretli etkinlik ve seminer bilet siparişleri', category: 'Etkinlik & Mağaza' },
  user_sessions: { name: 'Oturum Logları', description: 'Öğrenci platformda kalma ve çalışma süreleri', category: 'Sistem & Ayarlar' },
  study_sessions: { name: 'Çalışma Seansları', description: 'Metronom ve kronometre ders seansları', category: 'Eğitim & Akademik' },
  weeklyEvaluations: { name: 'Haftalık Değerlendirmeler', description: 'Koçların öğrenciye yazdığı haftalık değerlendirmeler', category: 'Koçluk & Görüşme' },
  academic_calendar: { name: 'Akademik Takvim', description: 'ÖSYM ve kritik sınav akademik takvim tarihleri', category: 'Eğitim & Akademik' },
  caba_tests: { name: 'CABA Test Sonuçları', description: 'Bursluluk ve seviye tespit sınav sonuçları', category: 'Eğitim & Akademik' },
  chats: { name: 'Sohbet Odaları', description: 'Öğrenci-Koç mesajlaşma kanalları', category: 'İletişim & Finans' },
  inbox_messages: { name: 'Gelen Kutusu Mesajları', description: 'Destek ve iletişim formu mesajları', category: 'İletişim & Finans' },
  whatsapp_messages: { name: 'WhatsApp Logları', description: 'Otomatik WhatsApp bildirim gönderim kayıtları', category: 'İletişim & Finans' },
  whatsapp_templates: { name: 'WhatsApp Şablonları', description: 'WhatsApp mesaj şablon metinleri', category: 'Sistem & Ayarlar' },
  settings: { name: 'Sistem Ayarları', description: 'Müfredat, soru bankası ve global konfigürasyonlar', category: 'Sistem & Ayarlar' }
};

export const cmsService = {
  // Fetch collection items with limit & fallback sorting
  async getCollectionData(collectionPath: string, sortingField: string = 'updatedAt', resultLimit: number = 200) {
    try {
      let q;
      if (sortingField) {
        q = query(collection(db, collectionPath), orderBy(sortingField, 'desc'), limit(resultLimit));
      } else {
        q = query(collection(db, collectionPath), limit(resultLimit));
      }
      const snap = await getDocs(q);
      return snap.docs.map(d => ({ id: d.id, ...d.data() as any }));
    } catch (err) {
      console.warn(`[CMS] Primary query failed for ${collectionPath}, trying fallback without sort:`, err);
      try {
        const q = query(collection(db, collectionPath), limit(resultLimit));
        const snap = await getDocs(q);
        return snap.docs.map(d => ({ id: d.id, ...d.data() as any }));
      } catch (innerErr) {
        console.error(`[CMS] Fallback failed for ${collectionPath}:`, innerErr);
        return [];
      }
    }
  },

  // Save/Update document
  async saveDocument(collectionPath: string, docId: string | null, data: Record<string, any>) {
    const cleanData = { ...data };
    delete cleanData.id; // ensure ID is not stored inside data body
    cleanData.updatedAt = serverTimestamp();

    if (docId) {
      const ref = doc(db, collectionPath, docId);
      await setDoc(ref, cleanData, { merge: true });
      return docId;
    } else {
      const ref = await addDoc(collection(db, collectionPath), {
        ...cleanData,
        createdAt: serverTimestamp()
      });
      return ref.id;
    }
  },

  // Delete single document
  async deleteDocument(collectionPath: string, docId: string) {
    const ref = doc(db, collectionPath, docId);
    await deleteDoc(ref);
  },

  // Check related records across all collections
  async checkRelatedRecords(collectionPath: string, docId: string, itemData: Record<string, any>): Promise<RelationshipResult[]> {
    const results: RelationshipResult[] = [];
    const targetId = docId;

    // Helper to search documents in a collection
    const queryCollection = async (collName: string, fieldName: string, value: string): Promise<string[]> => {
      try {
        const q = query(collection(db, collName), where(fieldName, '==', value));
        const snap = await getDocs(q);
        return snap.docs.map(d => d.id);
      } catch (e) {
        return [];
      }
    };

    const checkDocExists = async (collName: string, id: string): Promise<string[]> => {
      try {
        const snap = await getDoc(doc(db, collName, id));
        return snap.exists() ? [id] : [];
      } catch (e) {
        return [];
      }
    };

    // If deleting from "users"
    if (collectionPath === 'users') {
      const userChecks = [
        { coll: 'daily_programs', field: 'studentId' },
        { coll: 'routines', field: 'studentId' },
        { coll: 'weekly_reports', field: 'studentId' },
        { coll: 'exam_results', field: 'studentId' },
        { coll: 'exam_analyses', field: 'studentId' },
        { coll: 'book_tracking', field: 'studentId' },
        { coll: 'weekly_programs', field: 'studentId' },
        { coll: 'monthly_goals', field: 'studentId' },
        { coll: 'appointments', field: 'studentId' },
        { coll: 'appointments', field: 'coachId' },
        { coll: 'coach_schedules', field: 'coachId' },
        { coll: 'wallet_transactions', field: 'studentId' },
        { coll: 'wallet_transactions', field: 'coachId' },
        { coll: 'user_analyses', field: 'userId' },
        { coll: 'user_analyses', field: 'studentId' },
        { coll: 'chocolate_bank_status', field: 'studentId' },
        { coll: 'chocolate_bank_transactions', field: 'studentId' },
        { coll: 'chocolate_bank_transactions', field: 'coachId' },
        { coll: 'notifications', field: 'userId' },
        { coll: 'purchases', field: 'studentId' },
        { coll: 'program_enrollments', field: 'studentId' },
        { coll: 'event_rsvps', field: 'studentId' },
        { coll: 'ticket_orders', field: 'studentId' },
        { coll: 'weeklyEvaluations', field: 'studentId' },
        { coll: 'user_sessions', field: 'userId' },
        { coll: 'study_sessions', field: 'studentId' },
        { coll: 'coupons', field: 'refereeId' },
        { coll: 'coupons', field: 'referrerId' },
        { coll: 'referral_history', field: 'refereeId' },
        { coll: 'referral_history', field: 'referrerId' },
      ];

      const foundMap: Record<string, Set<string>> = {};

      for (const check of userChecks) {
        const ids = await queryCollection(check.coll, check.field, targetId);
        if (ids.length > 0) {
          if (!foundMap[check.coll]) foundMap[check.coll] = new Set();
          ids.forEach(id => foundMap[check.coll].add(id));
        }
      }

      // Check direct document IDs in caba_tests & routines & chocolate_bank_status if equal to targetId
      const directDocColls = ['caba_tests', 'routines', 'chocolate_bank_status'];
      for (const coll of directDocColls) {
        const ids = await checkDocExists(coll, targetId);
        if (ids.length > 0) {
          if (!foundMap[coll]) foundMap[coll] = new Set();
          ids.forEach(id => foundMap[coll].add(id));
        }
      }

      for (const [coll, idSet] of Object.entries(foundMap)) {
        const docIds = Array.from(idSet);
        const meta = collectionMetadata[coll];
        results.push({
          collectionId: coll,
          collectionName: meta ? meta.name : coll,
          count: docIds.length,
          docIds
        });
      }
    }

    // If deleting from "global_books"
    else if (collectionPath === 'global_books') {
      const ids = await queryCollection('book_tracking', 'bookId', targetId);
      if (ids.length > 0) {
        results.push({
          collectionId: 'book_tracking',
          collectionName: collectionMetadata.book_tracking?.name || 'Kitap Takibi',
          count: ids.length,
          docIds: ids
        });
      }
    }

    // If deleting from "exam_results"
    else if (collectionPath === 'exam_results') {
      const ids = await queryCollection('exam_analyses', 'examId', targetId);
      if (ids.length > 0) {
        results.push({
          collectionId: 'exam_analyses',
          collectionName: collectionMetadata.exam_analyses?.name || 'Sınav Analizleri',
          count: ids.length,
          docIds: ids
        });
      }
    }

    // If deleting from "programs"
    else if (collectionPath === 'programs') {
      const ids = await queryCollection('program_enrollments', 'programId', targetId);
      if (ids.length > 0) {
        results.push({
          collectionId: 'program_enrollments',
          collectionName: collectionMetadata.program_enrollments?.name || 'Program Kayıtları',
          count: ids.length,
          docIds: ids
        });
      }
    }

    // If deleting from "events"
    else if (collectionPath === 'events') {
      const rsvpIds = await queryCollection('event_rsvps', 'eventId', targetId);
      if (rsvpIds.length > 0) {
        results.push({
          collectionId: 'event_rsvps',
          collectionName: collectionMetadata.event_rsvps?.name || 'Etkinlik Kayıtları',
          count: rsvpIds.length,
          docIds: rsvpIds
        });
      }
      const ticketIds = await queryCollection('ticket_orders', 'eventId', targetId);
      if (ticketIds.length > 0) {
        results.push({
          collectionId: 'ticket_orders',
          collectionName: collectionMetadata.ticket_orders?.name || 'Bilet Siparişleri',
          count: ticketIds.length,
          docIds: ticketIds
        });
      }
    }

    // If deleting from "products"
    else if (collectionPath === 'products') {
      const ids = await queryCollection('purchases', 'productId', targetId);
      if (ids.length > 0) {
        results.push({
          collectionId: 'purchases',
          collectionName: collectionMetadata.purchases?.name || 'Satın Alımlar',
          count: ids.length,
          docIds: ids
        });
      }
    }

    // If deleting from "services"
    else if (collectionPath === 'services') {
      const ids = await queryCollection('appointments', 'serviceId', targetId);
      if (ids.length > 0) {
        results.push({
          collectionId: 'appointments',
          collectionName: collectionMetadata.appointments?.name || 'Randevular',
          count: ids.length,
          docIds: ids
        });
      }
    }

    // If deleting from "rooms"
    else if (collectionPath === 'rooms') {
      const ids = await queryCollection('appointments', 'roomId', targetId);
      if (ids.length > 0) {
        results.push({
          collectionId: 'appointments',
          collectionName: collectionMetadata.appointments?.name || 'Randevular',
          count: ids.length,
          docIds: ids
        });
      }
    }

    return results;
  },

  // Perform cascade deletion
  async cascadeDelete(collectionPath: string, docId: string, relatedList: RelationshipResult[]) {
    // Delete all connected documents across collections
    for (const rel of relatedList) {
      for (const relDocId of rel.docIds) {
        try {
          await deleteDoc(doc(db, rel.collectionId, relDocId));
        } catch (e) {
          console.error(`[CMS Cascade Delete] Error deleting ${rel.collectionId}/${relDocId}:`, e);
        }
      }
    }
    // Finally delete main document
    await deleteDoc(doc(db, collectionPath, docId));
  }
};
