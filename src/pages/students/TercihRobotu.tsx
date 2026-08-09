import React, { useState, useEffect, useRef, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Search, 
  Filter,
  SlidersHorizontal, 
  ArrowUpDown, 
  ExternalLink, 
  AlertTriangle, 
  Check, 
  Loader2, 
  ChevronLeft,
  ChevronRight, 
  ChevronDown,
  ChevronsLeft,
  ChevronsRight,
  GraduationCap, 
  MapPin, 
  School, 
  X,
  Database,
  RefreshCw,
  Sparkles,
  Info,
  Settings,
  Star,
  BarChart2,
  TrendingUp,
  Layers,
  ShoppingBag,
  ListOrdered,
  Printer,
  Plus,
  Trash2,
  Heart,
  Building2
} from "lucide-react";
import { createClient } from "@supabase/supabase-js";
import { DepartmentStatsModal } from "../../components/tercih/DepartmentStatsModal";
import { CityStatsModal } from "../../components/tercih/CityStatsModal";
import { PreferenceBasketModal } from "../../components/tercih/PreferenceBasketModal";
import { PrintablePreferenceView } from "../../components/tercih/PrintablePreferenceView";

// ============================================================================
// SUPABASE BAĞLANTISI (Secret ortam değişkenleri)
// ============================================================================
const getEnvVar = (key: string) => {
  if (typeof process !== "undefined" && process.env && process.env[key]) {
    return process.env[key];
  }
  return "";
};

// Vite destekli env değişkenlerini al
const viteEnv = (import.meta as any).env || {};

const supabaseUrl = viteEnv.VITE_SUPABASE_URL || getEnvVar("VITE_SUPABASE_URL") || getEnvVar("NEXT_PUBLIC_SUPABASE_URL") || getEnvVar("SUPABASE_URL") || "https://placeholder.supabase.co";
const supabaseAnonKey = viteEnv.VITE_SUPABASE_ANON_KEY || getEnvVar("VITE_SUPABASE_ANON_KEY") || getEnvVar("NEXT_PUBLIC_SUPABASE_ANON_KEY") || getEnvVar("SUPABASE_ANON_KEY") || "placeholder";

const supabase = createClient(supabaseUrl, supabaseAnonKey);

// ============================================================================
// 1. KAPSAMLI VERİ ŞEMALARI (JSON YAPINIZA BİREBİR UYGUN)
// ============================================================================
export interface DepartmentPoint {
  year: string;
  basePoint: number | null;
  basePointOrder: number | null;
  quota: number | null;
  ekKontenjan?: number | null;
  dolulukPercent?: number | null;
  depId?: number;
  departmentId?: number;
  lastQuota?: number | null;
  lastBasePointOrder?: number | null;
  lastBasePoint?: number | null;
  settled?: number | null;
}

export interface Department {
  id: string; // Arayüz için oluşturduğumuz benzersiz anahtar
  departmentId?: number;
  departmentCode?: string | number;
  depId?: number;
  name?: string;
  universityId?: number;
  university?: {
    universityId?: number;
    name?: string;
    typeName?: string;
    regionName?: string;
    cityId?: number;
    city?: {
      cityId?: number;
      name?: string;
      regionId?: number;
    };
    districtId?: number | null;
    detail1?: string | null;
  };
  universityName?: string;
  facultyName?: string;
  facultyId?: number | null;
  typeName?: string;
  timeofEducation?: string;
  pointName?: string;
  teachingType?: string;
  feeType?: string | null;
  fullName?: string;
  lastBasePoint?: number | null;
  lastBasePointOrder?: number | null;
  price?: string | number;
  quota?: number;
  jobId?: number;
  detail1?: string | null;
  detail2?: string | null;
  detail3?: string | null; // "L" veya "O"
  departmentPoints?: DepartmentPoint[];
  [key: string]: any;
}

// ============================================================================
// INDEXEDDB OYALAMA VE ÖNBELLEKLEME SİSTEMİ (IndexedDB Caching Engine)
// ============================================================================
const DB_NAME = "TercihRobotuDB";
const STORE_NAME = "departments_store";
const DB_VERSION = 1;

function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    try {
      const request = indexedDB.open(DB_NAME, DB_VERSION);
      request.onupgradeneeded = (e: any) => {
        const db = e.target.result;
        if (!db.objectStoreNames.contains(STORE_NAME)) {
          db.createObjectStore(STORE_NAME, { keyPath: "id" });
        }
      };
      request.onsuccess = (e: any) => resolve(e.target.result);
      request.onerror = (e: any) => reject(e.target.error);
    } catch (err) {
      reject(err);
    }
  });
}

function saveDepartmentsToCache(data: Department[]): Promise<void> {
  return openDB().then((db) => {
    return new Promise<void>((resolve, reject) => {
      try {
        const transaction = db.transaction(STORE_NAME, "readwrite");
        const store = transaction.objectStore(STORE_NAME);
        
        // Single record insert to bypass IndexedDB batch latency
        const cacheObj = {
          id: "all_departments_data",
          timestamp: Date.now(),
          count: data.length,
          list: data
        };
        
        const req = store.put(cacheObj);
        req.onsuccess = () => {
          localStorage.setItem("tercih_robotu_cache_time", Date.now().toString());
          localStorage.setItem("tercih_robotu_cache_count", data.length.toString());
          resolve();
        };
        req.onerror = (e: any) => reject(e.target.error);
      } catch (err) {
        reject(err);
      }
    });
  });
}

function getDepartmentsFromCache(ignoreExpiry = false): Promise<Department[] | null> {
  return openDB().then((db) => {
    return new Promise<Department[] | null>((resolve, reject) => {
      try {
        const cacheTime = localStorage.getItem("tercih_robotu_cache_time");
        if (!cacheTime) {
          resolve(null);
          return;
        }

        // 24 saat geçerlilik süresi (24 * 60 * 60 * 1000)
        const isExpired = Date.now() - parseInt(cacheTime, 10) > 24 * 60 * 60 * 1000;
        if (isExpired && !ignoreExpiry) {
          resolve(null);
          return;
        }

        const transaction = db.transaction(STORE_NAME, "readonly");
        const store = transaction.objectStore(STORE_NAME);
        const request = store.get("all_departments_data");

        request.onsuccess = () => {
          const res = request.result;
          if (res && Array.isArray(res.list) && res.list.length > 0) {
            resolve(res.list);
          } else {
            resolve(null);
          }
        };
        request.onerror = (e: any) => reject(e.target.error);
      } catch (err) {
        reject(err);
      }
    });
  }).catch(() => null);
}

function clearCache(): Promise<void> {
  return openDB().then((db) => {
    return new Promise<void>((resolve, reject) => {
      try {
        const transaction = db.transaction(STORE_NAME, "readwrite");
        const store = transaction.objectStore(STORE_NAME);
        const req = store.delete("all_departments_data");
        req.onsuccess = () => {
          localStorage.removeItem("tercih_robotu_cache_time");
          localStorage.removeItem("tercih_robotu_cache_count");
          resolve();
        };
        req.onerror = (e: any) => reject(e.target.error);
      } catch (err) {
        reject(err);
      }
    });
  }).catch(() => {});
}

const FALLBACK_DEPARTMENTS: Department[] = [
  {
    id: "fb-1",
    departmentId: 101,
    departmentCode: "101110021",
    name: "Bilgisayar Mühendisliği (İngilizce)",
    universityName: "Boğaziçi Üniversitesi",
    university: {
      name: "Boğaziçi Üniversitesi",
      typeName: "Devlet",
      regionName: "Marmara",
      city: { name: "İstanbul" }
    },
    facultyName: "Mühendislik Fakültesi",
    typeName: "LISANS",
    timeofEducation: "4",
    pointName: "SAY",
    teachingType: "Örgün",
    feeType: "Ücretsiz",
    lastBasePoint: 542.45,
    lastBasePointOrder: 350,
    quota: 80,
    departmentPoints: [
      { year: "2023", basePoint: 542.45, basePointOrder: 350, quota: 80 },
      { year: "2022", basePoint: 535.12, basePointOrder: 380, quota: 80 }
    ]
  },
  {
    id: "fb-2",
    departmentId: 102,
    departmentCode: "101110032",
    name: "Endüstri Mühendisliği (İngilizce)",
    universityName: "Orta Doğu Teknik Üniversitesi (ODTÜ)",
    university: {
      name: "Orta Doğu Teknik Üniversitesi (ODTÜ)",
      typeName: "Devlet",
      regionName: "İç Anadolu",
      city: { name: "Ankara" }
    },
    facultyName: "Mühendislik Fakültesi",
    typeName: "LISANS",
    timeofEducation: "4",
    pointName: "SAY",
    teachingType: "Örgün",
    feeType: "Ücretsiz",
    lastBasePoint: 531.15,
    lastBasePointOrder: 1200,
    quota: 90,
    departmentPoints: [
      { year: "2023", basePoint: 531.15, basePointOrder: 1200, quota: 90 },
      { year: "2022", basePoint: 524.80, basePointOrder: 1350, quota: 90 }
    ]
  },
  {
    id: "fb-3",
    departmentId: 103,
    departmentCode: "101110043",
    name: "Tıp (Türkçe)",
    universityName: "Hacettepe Üniversitesi",
    university: {
      name: "Hacettepe Üniversitesi",
      typeName: "Devlet",
      regionName: "İç Anadolu",
      city: { name: "Ankara" }
    },
    facultyName: "Tıp Fakültesi",
    typeName: "LISANS",
    timeofEducation: "6",
    pointName: "SAY",
    teachingType: "Örgün",
    feeType: "Ücretsiz",
    lastBasePoint: 538.90,
    lastBasePointOrder: 650,
    quota: 200,
    departmentPoints: [
      { year: "2023", basePoint: 538.90, basePointOrder: 650, quota: 200 },
      { year: "2022", basePoint: 531.20, basePointOrder: 710, quota: 200 }
    ]
  },
  {
    id: "fb-4",
    departmentId: 104,
    departmentCode: "101110054",
    name: "Hukuk",
    universityName: "Ankara Üniversitesi",
    university: {
      name: "Ankara Üniversitesi",
      typeName: "Devlet",
      regionName: "İç Anadolu",
      city: { name: "Ankara" }
    },
    facultyName: "Hukuk Fakültesi",
    typeName: "LISANS",
    timeofEducation: "4",
    pointName: "EA",
    teachingType: "Örgün",
    feeType: "Ücretsiz",
    lastBasePoint: 452.12,
    lastBasePointOrder: 4200,
    quota: 450,
    departmentPoints: [
      { year: "2023", basePoint: 452.12, basePointOrder: 4200, quota: 450 },
      { year: "2022", basePoint: 448.50, basePointOrder: 4500, quota: 450 }
    ]
  },
  {
    id: "fb-5",
    departmentId: 105,
    departmentCode: "101110065",
    name: "Yapay Zeka ve Veri Mühendisliği (İngilizce)",
    universityName: "İstanbul Teknik Üniversitesi (İTÜ)",
    university: {
      name: "İstanbul Teknik Üniversitesi (İTÜ)",
      typeName: "Devlet",
      regionName: "Marmara",
      city: { name: "İstanbul" }
    },
    facultyName: "Bilgisayar ve Bilişim Fakültesi",
    typeName: "LISANS",
    timeofEducation: "4",
    pointName: "SAY",
    teachingType: "Örgün",
    feeType: "Ücretsiz",
    lastBasePoint: 539.80,
    lastBasePointOrder: 550,
    quota: 40,
    departmentPoints: [
      { year: "2023", basePoint: 539.80, basePointOrder: 550, quota: 40 },
      { year: "2022", basePoint: 532.40, basePointOrder: 620, quota: 40 }
    ]
  },
  {
    id: "fb-6",
    departmentId: 106,
    departmentCode: "101110076",
    name: "İşletme (İngilizce)",
    universityName: "Boğaziçi Üniversitesi",
    university: {
      name: "Boğaziçi Üniversitesi",
      typeName: "Devlet",
      regionName: "Marmara",
      city: { name: "İstanbul" }
    },
    facultyName: "İktisadi ve İdari Bilimler Fakültesi",
    typeName: "LISANS",
    timeofEducation: "4",
    pointName: "EA",
    teachingType: "Örgün",
    feeType: "Ücretsiz",
    lastBasePoint: 498.30,
    lastBasePointOrder: 950,
    quota: 100,
    departmentPoints: [
      { year: "2023", basePoint: 498.30, basePointOrder: 950, quota: 100 },
      { year: "2022", basePoint: 492.15, basePointOrder: 1100, quota: 100 }
    ]
  },
  {
    id: "fb-7",
    departmentId: 107,
    departmentCode: "101110087",
    name: "Psikoloji (Türkçe)",
    universityName: "Ege Üniversitesi",
    university: {
      name: "Ege Üniversitesi",
      typeName: "Devlet",
      regionName: "Ege",
      city: { name: "İzmir" }
    },
    facultyName: "Edebiyat Fakültesi",
    typeName: "LISANS",
    timeofEducation: "4",
    pointName: "EA",
    teachingType: "Örgün",
    feeType: "Ücretsiz",
    lastBasePoint: 412.50,
    lastBasePointOrder: 18500,
    quota: 80,
    departmentPoints: [
      { year: "2023", basePoint: 412.50, basePointOrder: 18500, quota: 80 },
      { year: "2022", basePoint: 405.20, basePointOrder: 21000, quota: 80 }
    ]
  },
  {
    id: "fb-8",
    departmentId: 108,
    departmentCode: "101110098",
    name: "Yazılım Mühendisliği (Burslu)",
    universityName: "Bahçeşehir Üniversitesi",
    university: {
      name: "Bahçeşehir Üniversitesi",
      typeName: "Vakıf",
      regionName: "Marmara",
      city: { name: "İstanbul" }
    },
    facultyName: "Mühendislik ve Doğa Bilimleri Fakültesi",
    typeName: "LISANS",
    timeofEducation: "4",
    pointName: "SAY",
    teachingType: "Örgün",
    feeType: "Burslu",
    lastBasePoint: 522.60,
    lastBasePointOrder: 2200,
    quota: 15,
    departmentPoints: [
      { year: "2023", basePoint: 522.60, basePointOrder: 2200, quota: 15 },
      { year: "2022", basePoint: 516.30, basePointOrder: 2500, quota: 15 }
    ]
  },
  {
    id: "fb-9",
    departmentId: 109,
    departmentCode: "101110109",
    name: "Uluslararası İlişkiler (İngilizce) (%50 İndirimli)",
    universityName: "Bilkent Üniversitesi",
    university: {
      name: "Bilkent Üniversitesi",
      typeName: "Vakıf",
      regionName: "İç Anadolu",
      city: { name: "Ankara" }
    },
    facultyName: "İktisadi, İdari ve Sosyal Bilimler Fakültesi",
    typeName: "LISANS",
    timeofEducation: "4",
    pointName: "EA",
    teachingType: "Örgün",
    feeType: "%50 İndirimli",
    lastBasePoint: 435.80,
    lastBasePointOrder: 11000,
    quota: 40,
    departmentPoints: [
      { year: "2023", basePoint: 435.80, basePointOrder: 11000, quota: 40 },
      { year: "2022", basePoint: 428.10, basePointOrder: 12500, quota: 40 }
    ]
  },
  {
    id: "fb-10",
    departmentId: 110,
    departmentCode: "101110120",
    name: "Mimarlık (Türkçe)",
    universityName: "Dokuz Eylül Üniversitesi",
    university: {
      name: "Dokuz Eylül Üniversitesi",
      typeName: "Devlet",
      regionName: "Ege",
      city: { name: "İzmir" }
    },
    facultyName: "Mimarlık Fakültesi",
    typeName: "LISANS",
    timeofEducation: "4",
    pointName: "SAY",
    teachingType: "Örgün",
    feeType: "Ücretsiz",
    lastBasePoint: 428.40,
    lastBasePointOrder: 78000,
    quota: 120,
    departmentPoints: [
      { year: "2023", basePoint: 428.40, basePointOrder: 78000, quota: 120 },
      { year: "2022", basePoint: 418.90, basePointOrder: 85000, quota: 120 }
    ]
  },
  {
    id: "fb-11",
    departmentId: 111,
    departmentCode: "101110131",
    name: "Beslenme ve Diyetetik",
    universityName: "Marmara Üniversitesi",
    university: {
      name: "Marmara Üniversitesi",
      typeName: "Devlet",
      regionName: "Marmara",
      city: { name: "İstanbul" }
    },
    facultyName: "Sağlık Bilimleri Fakültesi",
    typeName: "LISANS",
    timeofEducation: "4",
    pointName: "SAY",
    teachingType: "Örgün",
    feeType: "Ücretsiz",
    lastBasePoint: 362.15,
    lastBasePointOrder: 185000,
    quota: 70,
    departmentPoints: [
      { year: "2023", basePoint: 362.15, basePointOrder: 185000, quota: 70 },
      { year: "2022", basePoint: 355.40, basePointOrder: 198000, quota: 70 }
    ]
  },
  {
    id: "fb-12",
    departmentId: 112,
    departmentCode: "101110142",
    name: "Siyaset Bilimi ve Kamu Yönetimi",
    universityName: "İstanbul Üniversitesi",
    university: {
      name: "İstanbul Üniversitesi",
      typeName: "Devlet",
      regionName: "Marmara",
      city: { name: "İstanbul" }
    },
    facultyName: "Siyasal Bilgiler Fakültesi",
    typeName: "LISANS",
    timeofEducation: "4",
    pointName: "EA",
    teachingType: "Örgün",
    feeType: "Ücretsiz",
    lastBasePoint: 388.90,
    lastBasePointOrder: 35000,
    quota: 100,
    departmentPoints: [
      { year: "2023", basePoint: 388.90, basePointOrder: 35000, quota: 100 },
      { year: "2022", basePoint: 381.10, basePointOrder: 41000, quota: 100 }
    ]
  },
  {
    id: "fb-13",
    departmentId: 113,
    departmentCode: "101110153",
    name: "İngiliz Dili ve Edebiyatı (İngilizce)",
    universityName: "Hacettepe Üniversitesi",
    university: {
      name: "Hacettepe Üniversitesi",
      typeName: "Devlet",
      regionName: "İç Anadolu",
      city: { name: "Ankara" }
    },
    facultyName: "Edebiyat Fakültesi",
    typeName: "LISANS",
    timeofEducation: "4",
    pointName: "DİL",
    teachingType: "Örgün",
    feeType: "Ücretsiz",
    lastBasePoint: 468.20,
    lastBasePointOrder: 3100,
    quota: 80,
    departmentPoints: [
      { year: "2023", basePoint: 468.20, basePointOrder: 3100, quota: 80 },
      { year: "2022", basePoint: 459.50, basePointOrder: 3400, quota: 80 }
    ]
  },
  {
    id: "fb-14",
    departmentId: 114,
    departmentCode: "101110164",
    name: "Tarih (Türkçe)",
    universityName: "İstanbul Üniversitesi",
    university: {
      name: "İstanbul Üniversitesi",
      typeName: "Devlet",
      regionName: "Marmara",
      city: { name: "İstanbul" }
    },
    facultyName: "Edebiyat Fakültesi",
    typeName: "LISANS",
    timeofEducation: "4",
    pointName: "SÖZ",
    teachingType: "Örgün",
    feeType: "Ücretsiz",
    lastBasePoint: 395.40,
    lastBasePointOrder: 12500,
    quota: 120,
    departmentPoints: [
      { year: "2023", basePoint: 395.40, basePointOrder: 12500, quota: 120 },
      { year: "2022", basePoint: 388.10, basePointOrder: 14000, quota: 120 }
    ]
  },
  {
    id: "fb-15",
    departmentId: 115,
    departmentCode: "101110175",
    name: "Bilgisayar Programcılığı",
    universityName: "Ege Üniversitesi",
    university: {
      name: "Ege Üniversitesi",
      typeName: "Devlet",
      regionName: "Ege",
      city: { name: "İzmir" }
    },
    facultyName: "Ege Meslek Yüksekokulu",
    typeName: "ONLISANS",
    timeofEducation: "2",
    pointName: "TYT",
    teachingType: "Örgün",
    feeType: "Ücretsiz",
    lastBasePoint: 382.40,
    lastBasePointOrder: 155000,
    quota: 60,
    departmentPoints: [
      { year: "2023", basePoint: 382.40, basePointOrder: 155000, quota: 60 },
      { year: "2022", basePoint: 371.10, basePointOrder: 172000, quota: 60 }
    ]
  }
];

// ============================================================================
// TÜRKİYE ŞEHİR - BÖLGE EŞLEŞTİRME HARİTASI (SAMSUN KARADENİZ V.B. DÜZELTMESİ)
// ============================================================================
export const CITY_REGION_MAP: Record<string, string> = {
  // Marmara Bölgesi
  "İstanbul": "Marmara", "Edirne": "Marmara", "Kırklareli": "Marmara", "Tekirdağ": "Marmara",
  "Çanakkale": "Marmara", "Balıkesir": "Marmara", "Bursa": "Marmara", "Yalova": "Marmara",
  "Kocaeli": "Marmara", "Sakarya": "Marmara", "Bilecik": "Marmara",

  // Ege Bölgesi
  "İzmir": "Ege", "Aydın": "Ege", "Muğla": "Ege", "Manisa": "Ege",
  "Denizli": "Ege", "Uşak": "Ege", "Kütahya": "Ege", "Afyonkarahisar": "Ege", "Afyon": "Ege",

  // Akdeniz Bölgesi
  "Antalya": "Akdeniz", "Isparta": "Akdeniz", "Burdur": "Akdeniz", "Mersin": "Akdeniz",
  "İçel": "Akdeniz", "Adana": "Akdeniz", "Hatay": "Akdeniz", "Osmaniye": "Akdeniz",
  "Kahramanmaraş": "Akdeniz",

  // İç Anadolu Bölgesi
  "Ankara": "İç Anadolu", "Eskişehir": "İç Anadolu", "Konya": "İç Anadolu", "Kayseri": "İç Anadolu",
  "Sivas": "İç Anadolu", "Kırıkkale": "İç Anadolu", "Aksaray": "İç Anadolu", "Karaman": "İç Anadolu",
  "Niğde": "İç Anadolu", "Nevşehir": "İç Anadolu", "Kırşehir": "İç Anadolu", "Yozgat": "İç Anadolu",
  "Çankırı": "İç Anadolu",

  // Karadeniz Bölgesi
  "Samsun": "Karadeniz", "Trabzon": "Karadeniz", "Ordu": "Karadeniz", "Giresun": "Karadeniz",
  "Rize": "Karadeniz", "Artvin": "Karadeniz", "Gümüşhane": "Karadeniz", "Bayburt": "Karadeniz",
  "Amasya": "Karadeniz", "Tokat": "Karadeniz", "Sinop": "Karadeniz", "Çorum": "Karadeniz",
  "Kastamonu": "Karadeniz", "Bartın": "Karadeniz", "Karabük": "Karadeniz", "Zonguldak": "Karadeniz",
  "Düzce": "Karadeniz", "Bolu": "Karadeniz",

  // Doğu Anadolu Bölgesi
  "Erzurum": "Doğu Anadolu", "Erzincan": "Doğu Anadolu", "Kars": "Doğu Anadolu", "Ardahan": "Doğu Anadolu",
  "Iğdır": "Doğu Anadolu", "Ağrı": "Doğu Anadolu", "Muş": "Doğu Anadolu", "Bingöl": "Doğu Anadolu",
  "Bitlis": "Doğu Anadolu", "Van": "Doğu Anadolu", "Hakkari": "Doğu Anadolu", "Hakkâri": "Doğu Anadolu",
  "Malatya": "Doğu Anadolu", "Elazığ": "Doğu Anadolu", "Tunceli": "Doğu Anadolu",

  // Güneydoğu Anadolu Bölgesi
  "Gaziantep": "Güneydoğu Anadolu", "Diyarbakır": "Güneydoğu Anadolu", "Şanlıurfa": "Güneydoğu Anadolu",
  "Mardin": "Güneydoğu Anadolu", "Batman": "Güneydoğu Anadolu", "Siirt": "Güneydoğu Anadolu",
  "Şırnak": "Güneydoğu Anadolu", "Adıyaman": "Güneydoğu Anadolu", "Kilis": "Güneydoğu Anadolu",

  // KKTC & Yabancı
  "Lefkoşa": "KKTC / Yabancı", "Gazimağusa": "KKTC / Yabancı", "Girne": "KKTC / Yabancı",
  "Güzelyurt": "KKTC / Yabancı", "KKTC-Lefkoşa": "KKTC / Yabancı", "KKTC-Gazimağusa": "KKTC / Yabancı",
  "KKTC-Girne": "KKTC / Yabancı", "KKTC-Güzelyurt": "KKTC / Yabancı", "YABANCI": "KKTC / Yabancı"
};

export function getCityRegion(cityName?: string | null, fallbackRegion?: string | null): string {
  if (!cityName) return fallbackRegion || "Diğer";
  const name = cityName.trim();
  if (CITY_REGION_MAP[name]) return CITY_REGION_MAP[name];
  
  const key = Object.keys(CITY_REGION_MAP).find(
    k => k.toLocaleLowerCase('tr-TR') === name.toLocaleLowerCase('tr-TR')
  );
  if (key) return CITY_REGION_MAP[key];
  return fallbackRegion || "Diğer";
}

export default function TercihRobotu() {
  // Database states
  const [departments, setDepartments] = useState<Department[]>([]);
  const [allRawDepartments, setAllRawDepartments] = useState<Department[]>([]);
  const [allFilteredData, setAllFilteredData] = useState<Department[]>([]);
  const [page, setPage] = useState<number>(0);
  const [hasMore, setHasMore] = useState<boolean>(true);
  const [totalCount, setTotalCount] = useState<number>(0);
  const [loading, setLoading] = useState(false);
  const [isInitialLoad, setIsInitialLoad] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  
  const [itemsPerPage, setItemsPerPage] = useState<number>(20);

  // Composite Index setup alert
  const [indexErrorUrl, setIndexErrorUrl] = useState<string | null>(null);

  // Excluded lists
  const [excludedUniversities, setExcludedUniversities] = useState<string[]>([]);
  const [excludedFaculties, setExcludedFaculties] = useState<string[]>([]);
  const [excludedCities, setExcludedCities] = useState<string[]>([]);
  const [excludedDepartments, setExcludedDepartments] = useState<string[]>([]);
  const [excludedIds, setExcludedIds] = useState<string[]>([]);
  const [excludedTeachingTypes, setExcludedTeachingTypes] = useState<string[]>([]);
  const [activeMenuDeptId, setActiveMenuDeptId] = useState<string | null>(null);

  const prevExclusionsRef = useRef({
    excludedUniversities,
    excludedFaculties,
    excludedCities,
    excludedDepartments,
    excludedIds,
    excludedTeachingTypes
  });

  // Tercih Sepeti & Tercih Listesi States (with LocalStorage persistence)
  const [basketList, setBasketList] = useState<Department[]>(() => {
    try {
      const saved = localStorage.getItem("tercih_sepeti_list");
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const [preferenceList, setPreferenceList] = useState<(Department | null)[]>(() => {
    try {
      const saved = localStorage.getItem("tercih_preference_24_list");
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length === 24) {
          const seenIds = new Set<string>();
          return parsed.map((item: Department | null) => {
            if (!item) return null;
            if (seenIds.has(item.id)) return null;
            seenIds.add(item.id);
            return item;
          });
        }
      }
    } catch {}
    return Array(24).fill(null);
  });

  // Modal States
  const [showDeptStatsModal, setShowDeptStatsModal] = useState(false);
  const [showCityStatsModal, setShowCityStatsModal] = useState(false);
  const [showBasketModal, setShowBasketModal] = useState(false);
  const [basketModalTab, setBasketModalTab] = useState<"list" | "basket">("list");
  const [showPrintView, setShowPrintView] = useState(false);
  const [printViewSource, setPrintViewSource] = useState<"list" | "basket">("list");

  // LocalStorage Persistence Handlers
  useEffect(() => {
    try {
      localStorage.setItem("tercih_sepeti_list", JSON.stringify(basketList));
    } catch (e) {}
  }, [basketList]);

  useEffect(() => {
    try {
      localStorage.setItem("tercih_preference_24_list", JSON.stringify(preferenceList));
    } catch (e) {}
  }, [preferenceList]);

  const handleToggleBasket = (dept: Department) => {
    setBasketList((prev) => {
      const exists = prev.some((d) => d.id === dept.id);
      if (exists) {
        return prev.filter((d) => d.id !== dept.id);
      } else {
        return [...prev, dept];
      }
    });
  };

  const handleRemoveFromBasket = (id: string) => {
    setBasketList((prev) => prev.filter((d) => d.id !== id));
  };

  const handleClearBasket = () => {
    setBasketList([]);
  };

  const handleAddToPreferenceSlot = (department: Department, targetSlotIndex?: number) => {
    setPreferenceList((prev) => {
      // Zaten listede var mı kontrol et (id veya departmentCode bazlı)
      const existingIndex = prev.findIndex(
        (slot) => slot !== null && (slot.id === department.id || (slot.departmentCode && slot.departmentCode === department.departmentCode))
      );

      const newList = [...prev];

      // Eğer belirli bir yuvaya yerleştirilmek isteniyorsa
      if (typeof targetSlotIndex === "number" && targetSlotIndex >= 0 && targetSlotIndex < 24) {
        if (existingIndex !== -1) {
          newList[existingIndex] = null; // Eski konumundan çıkar
        }
        newList[targetSlotIndex] = department;
        return newList;
      }

      // Eğer zaten listedeyse başka bir yuvaya tekrar ekleme
      if (existingIndex !== -1) {
        return prev;
      }

      // İlk boş yuvaya ekle
      const firstEmptyIndex = newList.findIndex((slot) => slot === null);
      if (firstEmptyIndex !== -1) {
        newList[firstEmptyIndex] = department;
      } else {
        newList[23] = department;
      }
      return newList;
    });
  };

  const handleRemoveFromPreferenceSlot = (slotIndex: number) => {
    setPreferenceList((prev) => {
      const newList = [...prev];
      newList[slotIndex] = null;
      return newList;
    });
  };

  const handleMovePreferenceSlot = (fromIndex: number, toIndex: number) => {
    if (fromIndex < 0 || fromIndex >= 24 || toIndex < 0 || toIndex >= 24) return;
    setPreferenceList((prev) => {
      const newList = [...prev];
      const temp = newList[fromIndex];
      newList[fromIndex] = newList[toIndex];
      newList[toIndex] = temp;
      return newList;
    });
  };

  const handleClearPreferenceList = () => {
    setPreferenceList(Array(24).fill(null));
  };

  const handleSortPreferenceListByRank = (ascending = true) => {
    setPreferenceList((prev) => {
      const filled = prev.filter(Boolean) as Department[];
      filled.sort((a, b) => {
        const rankA = a.lastBasePointOrder || 9999999;
        const rankB = b.lastBasePointOrder || 9999999;
        return ascending ? rankA - rankB : rankB - rankA;
      });
      const result: (Department | null)[] = Array(24).fill(null);
      filled.slice(0, 24).forEach((item, idx) => {
        result[idx] = item;
      });
      return result;
    });
  };

  const handleAddAllBasketToPreferenceList = () => {
    setPreferenceList((prev) => {
      const newList = [...prev];
      const unaddedBasket = basketList.filter(
        (b) => !newList.some((p) => p !== null && (p.id === b.id || (p.departmentCode && p.departmentCode === b.departmentCode)))
      );

      let bIdx = 0;
      for (let i = 0; i < 24 && bIdx < unaddedBasket.length; i++) {
        if (newList[i] === null) {
          newList[i] = unaddedBasket[bIdx];
          bIdx++;
        }
      }
      return newList;
    });
  };

  // 1. Sıralama Tipi State
  const [sortType, setSortType] = useState<"rank" | "point">("rank");

  // Premium Table Sorting & Filtering States
  const [sortField, setSortField] = useState<string>("rank");
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("asc");
  const [selectedDeptIds, setSelectedDeptIds] = useState<string[]>([]);
  const [yopFilter, setYopFilter] = useState<string>("");
  const [uniFilter, setUniFilter] = useState<string>("");
  const [deptFilter, setDeptFilter] = useState<string>("");
  const [activeChartData, setActiveChartData] = useState<{
    title: string;
    labels: string[];
    values: number[];
    unit: string;
  } | null>(null);

  // 2. Puan Türü State
  const [selectedPointTypes, setSelectedPointTypes] = useState<string[]>([]);

  // 3. Ön/Lisans State
  const [selectedDegree, setSelectedDegree] = useState<"ALL" | "LISANS" | "ONLISANS">("ALL");

  // 4. Öğretim Türü State
  const [selectedTeachingTypes, setSelectedTeachingTypes] = useState<string[]>([]);

  // 5. Ücret State
  const [selectedFees, setSelectedFees] = useState<string[]>([]);

  // 6. Sıralama / Puan Değer Filtreleme States
  const [minRank, setMinRank] = useState<string>("");
  const [maxRank, setMaxRank] = useState<string>("");
  const [minPoint, setMinPoint] = useState<string>("");
  const [maxPoint, setMaxPoint] = useState<string>("");
  const [includeNewDepts, setIncludeNewDepts] = useState<boolean>(true);

  // Auto Rank Filter States
  const [studentRanks, setStudentRanks] = useState<Record<string, string>>({});
  const [minTolerancePercent, setMinTolerancePercent] = useState<number>(10);
  const [maxTolerancePercent, setMaxTolerancePercent] = useState<number>(20);
  const [showAutoRank, setShowAutoRank] = useState<boolean>(true);
  const [show2026Estimate, setShow2026Estimate] = useState<boolean>(false);

  const [pointTypeConstraints, setPointTypeConstraints] = useState<Record<string, { minRank: string; maxRank: string; minPoint: string; maxPoint: string }>>({});
  const [showConstraintsDropdown, setShowConstraintsDropdown] = useState(false);
  const constraintsDropdownRef = useRef<HTMLDivElement>(null);

  // Staged filter snapshot
  const [appliedFilters, setAppliedFilters] = useState({
    pointTypes: [] as string[],
    degree: "ALL" as "ALL" | "LISANS" | "ONLISANS",
    teachingTypes: [] as string[],
    fees: [] as string[],
    minRank: "", maxRank: "", minPoint: "", maxPoint: "",
    pointTypeConstraints: {} as Record<string, { minRank: string; maxRank: string; minPoint: string; maxPoint: string }>,
    regions: [] as string[], cities: [] as string[],
    uniTypes: [] as string[], universities: [] as string[],
    departments: [] as string[], searchTerm: "",
  });

  // 7. Şehir ve Bölge Filtresi States
  const [selectedRegions, setSelectedRegions] = useState<string[]>([]);
  const [showRegionDropdown, setShowRegionDropdown] = useState(false);
  const regionDropdownRef = useRef<HTMLDivElement>(null);
  
  const [selectedCities, setSelectedCities] = useState<string[]>([]);
  const [cityQuery, setCityQuery] = useState("");
  const [showCityDropdown, setShowCityDropdown] = useState(false);
  const cityDropdownRef = useRef<HTMLDivElement>(null);

  // 8. Üniversite ve Üniversite Tipi Filtresi States
  const [selectedUniTypes, setSelectedUniTypes] = useState<string[]>([]);
  const [selectedUniversities, setSelectedUniversities] = useState<string[]>([]);
  const [uniQuery, setUniQuery] = useState("");
  const [showUniDropdown, setShowUniDropdown] = useState(false);
  const [showUniTypeDropdown, setShowUniTypeDropdown] = useState(false);
  const uniDropdownRef = useRef<HTMLDivElement>(null);
  const uniTypeDropdownRef = useRef<HTMLDivElement>(null);

  // 9. Bölümler Filtresi States
  const [selectedDepartments, setSelectedDepartments] = useState<string[]>([]);
  const [deptQuery, setDeptQuery] = useState("");
  const [showDeptDropdown, setShowDeptDropdown] = useState(false);
  const deptDropdownRef = useRef<HTMLDivElement>(null);

  // Öğretim Dili & Şehir Tablo Filtresi States
  const [selectedTeachingLanguages, setSelectedTeachingLanguages] = useState<string[]>([]);
  const [teachingLangQuery, setTeachingLangQuery] = useState("");
  const [showTeachingLangDropdown, setShowTeachingLangDropdown] = useState(false);
  const teachingLangDropdownRef = useRef<HTMLDivElement>(null);

  const [cityFilter, setCityFilter] = useState<string>("");
  const [debouncedCityFilter, setDebouncedCityFilter] = useState<string>("");

  // Keyword search term
  const [searchTerm, setSearchTerm] = useState<string>("");

  // Debounced input states for backend database querying
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState("");
  const [debouncedYopFilter, setDebouncedYopFilter] = useState("");
  const [debouncedUniFilter, setDebouncedUniFilter] = useState("");
  const [debouncedDeptFilter, setDebouncedDeptFilter] = useState("");
  const [debouncedMinRank, setDebouncedMinRank] = useState("");
  const [debouncedMaxRank, setDebouncedMaxRank] = useState("");
  const [debouncedMinPoint, setDebouncedMinPoint] = useState("");
  const [debouncedMaxPoint, setDebouncedMaxPoint] = useState("");
  const [debouncedIncludeNewDepts, setDebouncedIncludeNewDepts] = useState<boolean>(true);

  const [showTeachingDropdown, setShowTeachingDropdown] = useState(false);
  const [showFeeDropdown, setShowFeeDropdown] = useState(false);
  const teachingDropdownRef = useRef<HTMLDivElement>(null);
  const feeDropdownRef = useRef<HTMLDivElement>(null);

  // Loading screen cycling messages state
  const [loadingStep, setLoadingStep] = useState(0);
  const loadingMessages = [
    "Üniversiteler yükleniyor...",
    "Kontenjanlar ayarlanıyor...",
    "Sıralamalar belirleniyor...",
    "YKS taban puanları eşleştiriliyor...",
    "Yıllara göre veriler karşılaştırılıyor...",
    "Tercih robotu veritabanı optimize ediliyor...",
    "Sistem ayarları kontrol ediliyor...",
    "Akademik veriler senkronize ediliyor..."
  ];

  useEffect(() => {
    if (!isInitialLoad) return;
    const interval = setInterval(() => {
      setLoadingStep((prev) => (prev + 1) % loadingMessages.length);
    }, 1800);
    return () => clearInterval(interval);
  }, [isInitialLoad, loadingMessages.length]);

  // Close dropdowns on outside click
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      const target = event.target as Node;
      if (cityDropdownRef.current && !cityDropdownRef.current.contains(target)) setShowCityDropdown(false);
      if (regionDropdownRef.current && !regionDropdownRef.current.contains(target)) setShowRegionDropdown(false);
      if (uniDropdownRef.current && !uniDropdownRef.current.contains(target)) setShowUniDropdown(false);
      if (uniTypeDropdownRef.current && !uniTypeDropdownRef.current.contains(target)) setShowUniTypeDropdown(false);
      if (deptDropdownRef.current && !deptDropdownRef.current.contains(target)) setShowDeptDropdown(false);
      if (teachingLangDropdownRef.current && !teachingLangDropdownRef.current.contains(target)) setShowTeachingLangDropdown(false);
      if (teachingDropdownRef.current && !teachingDropdownRef.current.contains(target)) setShowTeachingDropdown(false);
      if (feeDropdownRef.current && !feeDropdownRef.current.contains(target)) setShowFeeDropdown(false);
      if (constraintsDropdownRef.current && !constraintsDropdownRef.current.contains(target)) setShowConstraintsDropdown(false);
      if (activeMenuDeptId && !(target as HTMLElement).closest(".settings-container")) setActiveMenuDeptId(null);
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [activeMenuDeptId]);

  // Text normalization helper
  const normalizeText = (str?: string | null) => {
    if (!str) return "";
    return str.toLocaleLowerCase('tr-TR')
      .replace(/ı/g, "i").replace(/ğ/g, "g").replace(/ü/g, "u")
      .replace(/ş/g, "s").replace(/ö/g, "o").replace(/ç/g, "c").trim();
  };

  const formatPrice = (priceVal: any) => {
    if (priceVal === undefined || priceVal === null || priceVal === "") return "";
    if (typeof priceVal === "number") return `${priceVal.toLocaleString('tr-TR')} ₺`;
    const parsed = parseFloat(String(priceVal).replace(/[^\d.]/g, ""));
    if (!isNaN(parsed)) return `${parsed.toLocaleString('tr-TR')} ₺`;
    return String(priceVal);
  };

  // ============================================================================
  // DINAMIK VERI LİSTELERİ (JSON İÇİNDEN OTOMATİK ÇEKİLİR - BENZERSİZ MANTIĞI)
  // ============================================================================
  
  const dynamicRegions = React.useMemo(() => {
    const items = new Set<string>();
    allRawDepartments.forEach(d => {
      const cityName = d.university?.city?.name || d.city?.name;
      const reg = getCityRegion(cityName, d.university?.regionName);
      if (reg) items.add(reg.trim());
    });
    return Array.from(items).sort((a, b) => a.localeCompare(b, 'tr'));
  }, [allRawDepartments]);

  const dynamicCities = React.useMemo(() => {
    const items = new Set<string>();
    allRawDepartments.forEach(d => {
      const city = d.university?.city?.name || d.city?.name;
      if (city) items.add(city.trim());
    });
    return Array.from(items).sort((a, b) => a.localeCompare(b, 'tr'));
  }, [allRawDepartments]);

  const dynamicUniversities = React.useMemo(() => {
    const items = new Set<string>();
    allRawDepartments.forEach(d => {
      const uni = d.universityName || d.university?.name;
      if (uni) items.add(uni.trim());
    });
    return Array.from(items).sort((a, b) => a.localeCompare(b, 'tr'));
  }, [allRawDepartments]);

  const dynamicDepartments = React.useMemo(() => {
    const items = new Set<string>();
    allRawDepartments.forEach(d => {
      if (d.name) items.add(d.name.trim());
    });
    return Array.from(items).sort((a, b) => a.localeCompare(b, 'tr'));
  }, [allRawDepartments]);

  const dynamicTeachingLanguages = React.useMemo(() => {
    const items = new Set<string>();
    allRawDepartments.forEach(d => {
      if (d.teachingType) {
        const trimmed = d.teachingType.trim();
        if (trimmed) items.add(trimmed);
      }
    });
    const sorted = Array.from(items).filter(x => x !== "Hiçbiri").sort((a, b) => a.localeCompare(b, 'tr'));
    return ["Hiçbiri", ...sorted];
  }, [allRawDepartments]);

  const filteredTeachingLangOptions = React.useMemo(() => {
    return dynamicTeachingLanguages.filter(lang => 
      normalizeText(lang).includes(normalizeText(teachingLangQuery))
    );
  }, [dynamicTeachingLanguages, teachingLangQuery]);

  const dynamicUniTypes = React.useMemo(() => {
    const types = new Set<string>();
    allRawDepartments.forEach(dept => {
      const type = dept.typeName || dept.university?.typeName;
      if (type) types.add(type.trim().toUpperCase());
    });
    return Array.from(types).sort();
  }, [allRawDepartments]);

  // ============================================================================
  // CASCADE DROPDOWN (BİRİ SEÇİLİNCE DİĞERİNİ DARALTAN) LİSTELER
  // ============================================================================
  
  // Şehirler listesi (Tüm şehirler listelenir)
  const filteredCityOptions = React.useMemo(() => {
    return dynamicCities.filter(city => 
      normalizeText(city).includes(normalizeText(cityQuery))
    );
  }, [dynamicCities, cityQuery]);

  // Üniversiteler listesi (Şehir veya bölge seçildiyse ona göre daralır)
  const filteredUniOptions = React.useMemo(() => {
    return dynamicUniversities.filter(uni => {
      if (selectedRegions.length > 0 || selectedCities.length > 0) {
        const uniInLoc = allRawDepartments.some(d => {
           const dUni = d.universityName || d.university?.name;
           if (dUni !== uni) return false;
           
           const cityName = d.university?.city?.name || d.city?.name;
           const regName = getCityRegion(cityName, d.university?.regionName);
           
           const regMatch = selectedRegions.length === 0 || selectedRegions.includes(regName);
           const cityMatch = selectedCities.length === 0 || (cityName && selectedCities.includes(cityName));
           return regMatch && cityMatch;
        });
        if (!uniInLoc) return false;
      }
      return normalizeText(uni).includes(normalizeText(uniQuery)) && !selectedUniversities.includes(uni);
    });
  }, [dynamicUniversities, selectedRegions, selectedCities, uniQuery, selectedUniversities, allRawDepartments]);

  // Bölümler listesi (Üniversite vb seçildiyse daralır)
  const filteredDeptOptions = React.useMemo(() => {
    return dynamicDepartments.filter(dept => {
      if (selectedUniversities.length > 0) {
        const deptInUni = allRawDepartments.some(d => {
          const dUni = d.universityName || d.university?.name;
          return d.name === dept && dUni && selectedUniversities.includes(dUni);
        });
        if (!deptInUni) return false;
      }
      return normalizeText(dept).includes(normalizeText(deptQuery)) && !selectedDepartments.includes(dept);
    });
  }, [dynamicDepartments, selectedUniversities, deptQuery, selectedDepartments, allRawDepartments]);

  // Dinamik Üniversite Tipi ve Sayaçları
  const dynamicUniTypeOptions = React.useMemo(() => {
    const counts: Record<string, Set<string>> = {};
    dynamicUniTypes.forEach(t => counts[t] = new Set());
    
    // Aktif filtrelere göre sadece kalanları say
    allRawDepartments.forEach(dept => {
      const tName = dept.typeName || dept.university?.typeName;
      const uName = dept.universityName || dept.university?.name;
      const cityName = dept.university?.city?.name || dept.city?.name;
      const regName = getCityRegion(cityName, dept.university?.regionName);
      
      const regMatch = selectedRegions.length === 0 || selectedRegions.includes(regName);
      const cityMatch = selectedCities.length === 0 || (cityName && selectedCities.includes(cityName));
      
      if (tName && counts[tName.toUpperCase()] && uName && regMatch && cityMatch) {
        counts[tName.toUpperCase()].add(uName);
      }
    });

    return dynamicUniTypes.map(type => ({
      id: type,
      label: type === "VAKIF" ? "Vakıf" : type === "DEVLET" ? "Devlet" : type,
      count: counts[type]?.size || 0,
      disabled: false
    }));
  }, [dynamicUniTypes, allRawDepartments, selectedRegions, selectedCities]);

  const getDeptRank = (dept: Department): number | null => {
    if (Array.isArray(dept.departmentPoints) && dept.departmentPoints.length > 0) {
      const p2025 = dept.departmentPoints.find(p => String(p.year) === "2025" && p.basePointOrder != null && Number(p.basePointOrder) > 0);
      if (p2025?.basePointOrder) return Number(p2025.basePointOrder);
      const sortedPoints = [...dept.departmentPoints].sort((a, b) => Number(b.year) - Number(a.year));
      for (const p of sortedPoints) {
        if (p.basePointOrder != null && Number(p.basePointOrder) > 0) {
          return Number(p.basePointOrder);
        }
      }
    }
    return (dept.lastBasePointOrder && Number(dept.lastBasePointOrder) > 0) ? Number(dept.lastBasePointOrder) : null;
  };

  const getDeptPoint = (dept: Department): number | null => {
    if (Array.isArray(dept.departmentPoints) && dept.departmentPoints.length > 0) {
      const p2025 = dept.departmentPoints.find(p => String(p.year) === "2025" && p.basePoint != null && Number(p.basePoint) > 0);
      if (p2025?.basePoint) return Number(p2025.basePoint);
      const sortedPoints = [...dept.departmentPoints].sort((a, b) => Number(b.year) - Number(a.year));
      for (const p of sortedPoints) {
        if (p.basePoint != null && Number(p.basePoint) > 0) {
          return Number(p.basePoint);
        }
      }
    }
    return (dept.lastBasePoint && Number(dept.lastBasePoint) > 0) ? Number(dept.lastBasePoint) : null;
  };

  // ============================================================================
  // ANA FİLTRELEME MOTORU (TÜM KURALLAR)
  // ============================================================================
  const applyClientSideFilters = (dataToFilter: Department[], options?: { ignoreExcludedDepartments?: boolean; ignoreExcludedCities?: boolean }) => {
    let processed = [...dataToFilter];

    // 1. Puan Türü (SAY, EA vs.)
    if (selectedPointTypes.length > 0) {
      processed = processed.filter(d => d.pointName && selectedPointTypes.includes(d.pointName));
    }

    // Excluded items (Dışarıda Bırakılanlar)
    if (excludedUniversities.length > 0) {
      processed = processed.filter(dept => {
        const uName = dept.universityName || dept.university?.name;
        return !uName || !excludedUniversities.includes(uName);
      });
    }
    if (!options?.ignoreExcludedCities && excludedCities.length > 0) {
      processed = processed.filter(dept => {
        const cityName = dept.city?.name || dept.university?.city?.name;
        return !cityName || !excludedCities.includes(cityName);
      });
    }
    if (excludedFaculties.length > 0) {
      processed = processed.filter(dept => {
        const uName = dept.universityName || dept.university?.name || "";
        const dName = dept.name || "";
        const facName = dept.facultyName || dept.fullName?.replace(uName, "").replace(dName, "").trim() || "";
        return !facName || !excludedFaculties.includes(facName);
      });
    }
    if (excludedTeachingTypes.length > 0) {
      processed = processed.filter(dept => !dept.teachingType || !excludedTeachingTypes.includes(dept.teachingType));
    }
    if (!options?.ignoreExcludedDepartments && excludedDepartments.length > 0) {
      processed = processed.filter(dept => !dept.name || !excludedDepartments.includes(dept.name));
    }
    if (excludedIds.length > 0) {
      processed = processed.filter(dept => !excludedIds.includes(dept.id));
    }

    // 2. Üniversite Türü (DEVLET, VAKIF)
    if (selectedUniTypes.length > 0) {
      processed = processed.filter(d => {
        const type = d.typeName || d.university?.typeName;
        return type && selectedUniTypes.includes(type.toUpperCase());
      });
    }

    // 3. Bölge ve Şehir (Kesişimli - AND)
    if (selectedRegions.length > 0 || selectedCities.length > 0) {
      processed = processed.filter(d => {
        const cityName = d.university?.city?.name || d.city?.name;
        const regName = getCityRegion(cityName, d.university?.regionName);
        
        const matchRegion = selectedRegions.length === 0 || (regName && selectedRegions.includes(regName));
        const matchCity = selectedCities.length === 0 || (cityName && selectedCities.includes(cityName));
        
        return matchRegion && matchCity;
      });
    }

    // Özel Durum Filtresi
    if (selectedTeachingLanguages.length > 0) {
      const hasNone = selectedTeachingLanguages.includes("Hiçbiri");
      processed = processed.filter(d => {
        const val = d.teachingType?.trim();
        const isNone = !val || val === "" || val === "Örgün";
        if (isNone) {
          return hasNone;
        }
        return selectedTeachingLanguages.includes(val);
      });
    }

    // Tablo Şehir Arama Filtresi
    if (debouncedCityFilter) {
      const normCity = normalizeText(debouncedCityFilter);
      processed = processed.filter(d => {
        const cName = d.city?.name || d.university?.city?.name;
        return cName && normalizeText(cName).includes(normCity);
      });
    }

    // 4. Öğrenim Süresi (Önlisans / Lisans)
    if (selectedDegree === "LISANS") {
      processed = processed.filter(d => parseInt(d.timeofEducation || "0") >= 4 || d.detail3 === "L");
    } else if (selectedDegree === "ONLISANS") {
      processed = processed.filter(d => parseInt(d.timeofEducation || "0") < 4 || d.detail3 === "O");
    }

    // Öğretim Türü
    if (selectedTeachingTypes.length > 0) {
      processed = processed.filter(dept => {
        const checkStr = normalizeText((dept.name || "") + " " + (dept.fullName || ""));
        let type = "NORMAL";
        if (checkStr.includes("m.t.o.k") || checkStr.includes("mtok")) type = "MTOK";
        else if (checkStr.includes("uzaktan")) type = "UZAKTAN";
        else if (checkStr.includes("acikogretim") || checkStr.includes("acik ogretim")) type = "ACIK";
        else if (checkStr.includes("ikinci ogretim") || checkStr.includes("i.o.") || checkStr.includes("i.ö.")) type = "IKINCI";
        return selectedTeachingTypes.includes(type);
      });
    }

    // 5. Ücret Türü
    if (selectedFees.length > 0) {
      processed = processed.filter(d => {
        let currentFee = "UCRETSIZ";
        const feeTypeLower = (d.feeType || "").toLowerCase();
        const fullNameLower = (d.fullName || "").toLowerCase();
        
        if (feeTypeLower.includes("burslu") || fullNameLower.includes("burslu")) currentFee = "BURSLU";
        else if (feeTypeLower.includes("%75") || fullNameLower.includes("%75")) currentFee = "IND_75";
        else if (feeTypeLower.includes("%50") || fullNameLower.includes("%50")) currentFee = "IND_50";
        else if (feeTypeLower.includes("%25") || fullNameLower.includes("%25")) currentFee = "IND_25";
        else if (feeTypeLower.includes("ücretli") || fullNameLower.includes("ücretli")) currentFee = "UCRETLI";
        else if ((d.typeName === "DEVLET" || d.university?.typeName === "DEVLET") && !feeTypeLower) currentFee = "UCRETSIZ";
        else if (feeTypeLower.includes("ücretsiz") || fullNameLower.includes("ücretsiz")) currentFee = "UCRETSIZ";

        return selectedFees.includes(currentFee);
      });
    }

    // 6. Üniversite ve Bölüm
    if (selectedUniversities.length > 0) {
      processed = processed.filter(d => {
        const uName = d.universityName || d.university?.name;
        return uName && selectedUniversities.includes(uName);
      });
    }
    if (selectedDepartments.length > 0) {
      processed = processed.filter(d => d.name && selectedDepartments.includes(d.name));
    }

    // 7. Serbest Metin Arama (Kapsamlı Search)
    if (debouncedSearchTerm) {
      const query = normalizeText(debouncedSearchTerm);
      processed = processed.filter(d => {
        const uName = normalizeText(d.universityName || d.university?.name);
        const dName = normalizeText(d.name);
        const fName = normalizeText(d.facultyName);
        return uName.includes(query) || dName.includes(query) || fName.includes(query);
      });
    }

    // Tablo İçi Filtreler (Inline Filters)
    if (debouncedYopFilter) {
      processed = processed.filter(dept => {
        const code = dept.departmentCode || dept.depId || dept.departmentId || dept.id;
        return String(code).toLowerCase().includes(debouncedYopFilter.toLowerCase());
      });
    }
    if (debouncedUniFilter) {
      const normUni = normalizeText(debouncedUniFilter);
      processed = processed.filter(dept => {
         const uname = dept.universityName || dept.university?.name || "";
         return normalizeText(uname).includes(normUni);
      });
    }
    if (debouncedDeptFilter) {
      const normDept = normalizeText(debouncedDeptFilter);
      processed = processed.filter(dept => dept.name && normalizeText(dept.name).includes(normDept));
    }

    // 8. Matematiksel Aralıklar (Sıralama ve Puan - 0'ları ve null'ları yoksay)
    processed = processed.filter(dept => {
      const pType = (dept.pointName || "").trim();
      const constraint = pointTypeConstraints[pType];

      const effectiveMinRank = (constraint && constraint.minRank) ? constraint.minRank : debouncedMinRank;
      const effectiveMaxRank = (constraint && constraint.maxRank) ? constraint.maxRank : debouncedMaxRank;
      const effectiveMinPoint = (constraint && constraint.minPoint) ? constraint.minPoint : debouncedMinPoint;
      const effectiveMaxPoint = (constraint && constraint.maxPoint) ? constraint.maxPoint : debouncedMaxPoint;

      const deptRank = getDeptRank(dept);
      const deptPoint = getDeptPoint(dept);
      
      const isNew = (() => {
        if (!dept.departmentPoints || !Array.isArray(dept.departmentPoints)) return true;
        // Geçmiş yıllarda kontenjanı > 0 olan bir kayıt varsa (yani eskiden açılmışsa)
        // O zaman bu yeni bir bölüm DEĞİLDİR (muhtemelen "boş kalmış" bir bölümdür).
        // Eğer tüm geçmiş kayıtlarda kontenjan 0 veya null ise, bu bölüm yenidir.
        // (Sadece en güncel yıl 2025/2026 olarak düşünülebilir, burada geçmişte kontenjan 0 olanlar kastediliyor)
        const hasPastQuota = dept.departmentPoints.some(p => {
          // Güncel yılı hariç tutmak isterseniz (örneğin 2025 veya 2026 yeni açılmış olabilir)
          // Ancak "boş kalmış" bölümlerin önceki yıllarda mutlaka kontenjanı > 0'dır.
          return (p.quota !== null && p.quota > 0);
        });
        
        // Eğer geçmişte kontenjanı > 0 olan bir kayıt var ama rank/point null ise bu "boş kalmış"tır.
        // Yeni açılan bölüm olması için geçmiş kontenjanların 0 olması (veya hiç olmaması) gerekir.
        // Ancak bu fonksiyon güncel yılın verisini de departmentPoints içinde tutuyorsa, 
        // güncel yıl kontenjanına bakmamamız lazım.
        // deptRank === null kontrolü ile birlikte değerlendirirsek:
        if (deptRank !== null || deptPoint !== null) return false; // Puanı/sırası varsa zaten yeni veya boş değil
        
        // rank ve point null ise, geçmişte kontenjanı > 0 olan bir kayıt var mı bakalım
        // Sistemde 2024 ve öncesi "geçmiş" sayılıyor olabilir. (veya en yüksek yıl hariç)
        const maxYear = Math.max(...dept.departmentPoints.map(p => Number(p.year)));
        const pastPoints = dept.departmentPoints.filter(p => Number(p.year) < maxYear);
        
        if (pastPoints.length > 0) {
          const pastHasQuota = pastPoints.some(p => p.quota !== null && p.quota > 0);
          return !pastHasQuota; // Geçmişte kontenjanı 0 olanlar yenidir
        }
        
        return true; // Hiç geçmiş verisi yoksa yenidir
      })();

      if (isNew && debouncedIncludeNewDepts) {
        // Yeni açılan bölümse ve filtrede "dahil et" seçiliyse, sıralama/puan kontrolünü atla
        return true;
      }

      if (effectiveMinRank) {
        const minVal = Number(effectiveMinRank);
        if (!isNaN(minVal) && minVal > 0) {
          if (deptRank === null || deptRank < minVal) return false;
        }
      }
      if (effectiveMaxRank) {
        const maxVal = Number(effectiveMaxRank);
        if (!isNaN(maxVal) && maxVal > 0) {
          if (deptRank === null || deptRank > maxVal) return false;
        }
      }

      if (effectiveMinPoint) {
        const minPt = Number(effectiveMinPoint);
        if (!isNaN(minPt) && minPt > 0) {
          if (deptPoint === null || deptPoint < minPt) return false;
        }
      }
      if (effectiveMaxPoint) {
        const maxPt = Number(effectiveMaxPoint);
        if (!isNaN(maxPt) && maxPt > 0) {
          if (deptPoint === null || deptPoint > maxPt) return false;
        }
      }

      return true;
    });

    // 9. AKILLI SIRALAMA (Sorting) - Boşları (0, null, undefined) Dengele
    if (sortField) {
      processed.sort((a, b) => {
        let valA: any = undefined;
        let valB: any = undefined;

        if (sortField === "yop") { valA = a.departmentCode || a.depId || a.id || ""; valB = b.departmentCode || b.depId || b.id || ""; }
        else if (sortField === "university") { valA = a.universityName || a.university?.name || ""; valB = b.universityName || b.university?.name || ""; }
        else if (sortField === "name") { valA = a.name || ""; valB = b.name || ""; }
        else if (sortField === "city") { valA = a.city?.name || a.university?.city?.name || ""; valB = b.city?.name || b.university?.city?.name || ""; }
        else if (sortField === "type") { valA = a.typeName || a.university?.typeName || ""; valB = b.typeName || b.university?.typeName || ""; }
        else if (sortField === "pointName") { valA = a.pointName || ""; valB = b.pointName || ""; }
        else if (sortField === "quota") { 
          valA = a.departmentPoints?.[0]?.quota ?? a.quota ?? 0; 
          valB = b.departmentPoints?.[0]?.quota ?? b.quota ?? 0; 
        }
        else if (sortField === "settled") { 
          valA = a.departmentPoints?.[0]?.dolulukPercent ?? a.departmentPoints?.[0]?.settled ?? a.departmentPoints?.[0]?.quota ?? a.quota ?? 0; 
          valB = b.departmentPoints?.[0]?.dolulukPercent ?? b.departmentPoints?.[0]?.settled ?? b.departmentPoints?.[0]?.quota ?? b.quota ?? 0; 
        }
        else if (sortField === "rank") {
          const rankA = getDeptRank(a);
          const rankB = getDeptRank(b);
          valA = (rankA === null || rankA === 0) ? 9999999 : rankA;
          valB = (rankB === null || rankB === 0) ? 9999999 : rankB;
        }
        else if (sortField === "point") { 
          const ptA = getDeptPoint(a);
          const ptB = getDeptPoint(b);
          valA = (ptA === null) ? 0 : ptA; 
          valB = (ptB === null) ? 0 : ptB; 
        }
        else if (sortField === "duration") { valA = parseInt(a.timeofEducation || "0"); valB = parseInt(b.timeofEducation || "0"); }
        else if (sortField === "fee") { valA = a.feeType || ""; valB = b.feeType || ""; }

        if (valA === undefined || valA === null) return 1;
        if (valB === undefined || valB === null) return -1;

        if (valA < valB) return sortDirection === "asc" ? -1 : 1;
        if (valA > valB) return sortDirection === "asc" ? 1 : -1;
        return 0;
      });
    }

    return processed;
  };

  // ExcludedDepartments hariç tutularak filtrelenmiş veri (Bölümler Modalı için - tüm aktif filtrelere uyar)
  const unfilteredDataForDepts = useMemo(() => {
    if (allRawDepartments.length === 0) return [];
    return applyClientSideFilters(allRawDepartments, { ignoreExcludedDepartments: true });
  }, [
    allRawDepartments, sortType, sortField, sortDirection, selectedPointTypes, selectedDegree,
    selectedTeachingTypes, selectedFees, selectedRegions, selectedCities, selectedUniTypes,
    selectedUniversities, selectedDepartments, debouncedSearchTerm,
    debouncedYopFilter, debouncedUniFilter, debouncedDeptFilter, debouncedMinRank,
    debouncedMaxRank, debouncedMinPoint, debouncedMaxPoint, debouncedIncludeNewDepts, excludedUniversities,
    excludedFaculties, excludedCities, excludedIds, excludedTeachingTypes, pointTypeConstraints
  ]);

  // ExcludedCities hariç tutularak filtrelenmiş veri (Şehirler Modalı için - tüm aktif filtrelere ve çıkarılan bölümlere uyar)
  const unfilteredDataForCities = useMemo(() => {
    if (allRawDepartments.length === 0) return [];
    return applyClientSideFilters(allRawDepartments, { ignoreExcludedCities: true });
  }, [
    allRawDepartments, sortType, sortField, sortDirection, selectedPointTypes, selectedDegree,
    selectedTeachingTypes, selectedFees, selectedRegions, selectedCities, selectedUniTypes,
    selectedUniversities, selectedDepartments, debouncedSearchTerm,
    debouncedYopFilter, debouncedUniFilter, debouncedDeptFilter, debouncedMinRank,
    debouncedMaxRank, debouncedMinPoint, debouncedMaxPoint, debouncedIncludeNewDepts, excludedUniversities,
    excludedFaculties, excludedDepartments, excludedIds, excludedTeachingTypes, pointTypeConstraints
  ]);

  const handleFetchResults = () => {
    const newApplied = {
      pointTypes: selectedPointTypes,
      degree: selectedDegree,
      teachingTypes: selectedTeachingTypes,
      fees: selectedFees,
      minRank, maxRank, minPoint, maxPoint,
      pointTypeConstraints: { ...pointTypeConstraints },
      regions: selectedRegions, cities: selectedCities,
      uniTypes: selectedUniTypes, universities: selectedUniversities,
      departments: selectedDepartments,
      searchTerm: searchTerm
    };
    setAppliedFilters(newApplied);
    setPage(0);
    setHasMore(true);
  };

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearchTerm(searchTerm);
      setDebouncedYopFilter(yopFilter);
      setDebouncedUniFilter(uniFilter);
      setDebouncedDeptFilter(deptFilter);
      setDebouncedCityFilter(cityFilter);
      setDebouncedMinRank(minRank);
      setDebouncedMaxRank(maxRank);
      setDebouncedMinPoint(minPoint);
      setDebouncedMaxPoint(maxPoint);
      setDebouncedIncludeNewDepts(includeNewDepts);
    }, 400);
    return () => clearTimeout(handler);
  }, [searchTerm, yopFilter, uniFilter, deptFilter, cityFilter, minRank, maxRank, minPoint, maxPoint, includeNewDepts]);

  // ============================================================================
  // VERİ ÇEKME (SUPABASE ÜZERİNDEN HIZLI CACHE VEYA ORDER BY KULLANARAK KUSURSUZ İNDİRME)
  // ============================================================================
  const fetchAllData = async (force = false) => {
    setLoading(true);
    setError(null);
    if (force) {
      setIsInitialLoad(true);
    }
    try {
      if (!supabaseUrl || !supabaseAnonKey || supabaseAnonKey === "placeholder" || supabaseUrl.includes("placeholder")) {
        throw new Error("Supabase bağlantı bilgileri (VITE_SUPABASE_URL ve VITE_SUPABASE_ANON_KEY) bulunamadı. Lütfen AI Studio 'Settings' menüsünden 'Environment Variables' sekmesine ekleyin.");
      }

      // Eğer zorunlu yenileme (force) değilse önce yerel önbelleğe bak
      if (!force) {
        const cachedData = await getDepartmentsFromCache(false);
        if (cachedData && cachedData.length > 0) {
          console.log("Veriler yerel IndexedDB önbelleğinden yüklendi. Adet:", cachedData.length);
          setAllRawDepartments(cachedData);
          setIsInitialLoad(false);
          setLoading(false);
          return;
        }
      } else {
        await clearCache();
      }

      let allData: Department[] = [];
      let pageLoop = 0;
      const pageSize = 1000;
      let hasMoreLoop = true;

      while (hasMoreLoop) {
        const from = pageLoop * pageSize;
        const to = from + pageSize - 1;

        const { data, error: supaError } = await supabase
          .from('bolumler')
          .select('data')
          .order('id', { ascending: true })
          .range(from, to);

        if (supaError) {
          throw new Error(`Supabase hatası: ${supaError.message}`);
        }

        const dataChunk = data ? data.map(item => item.data) : [];

        if (dataChunk.length > 0) {
          allData = [...allData, ...dataChunk];
          pageLoop++;
          
          if (dataChunk.length < pageSize) {
            hasMoreLoop = false;
          }
        } else {
          hasMoreLoop = false;
        }

        if (pageLoop > 50) break; 
      }

      console.log("Supabase'den inen toplam veri:", allData.length);

      const uniqueMap = new Map<string, Department>();
      
      allData.forEach(dept => {
        const uniAd = dept.universityName || dept.university?.name || "";
        const uniqueKey = dept.departmentCode?.toString() 
          || dept.depId?.toString() 
          || `${uniAd}-${dept.name}-${dept.feeType}-${dept.timeofEducation}`;

        if (uniqueKey && !uniqueMap.has(uniqueKey)) {
          uniqueMap.set(uniqueKey, { ...dept, id: uniqueKey });
        }
      });
      
      console.log("Ezilmeden sağ kalan veri:", uniqueMap.size);
      const finalData = Array.from(uniqueMap.values());
      
      setAllRawDepartments(finalData);
      setIsInitialLoad(false);

      // Başarılı yükleme sonrası IndexedDB'ye kaydet
      saveDepartmentsToCache(finalData).catch(err => {
        console.warn("IndexedDB kaydetme hatası:", err);
      });
    } catch (err: any) {
      console.error("Veri çekme hatası (Supabase), yedeklere/önbelleğe yönlendiriliyor:", err);
      
      // Supabase yüklemesi başarısız olduğunda, süresi geçmiş de olsa yerel IndexedDB önbelleğini yüklemeyi dene
      try {
        const expiredCachedData = await getDepartmentsFromCache(true);
        if (expiredCachedData && expiredCachedData.length > 0) {
          console.log("Supabase hatası sonrası eski/expired yerel IndexedDB verisi başarıyla kurtarıldı.");
          setAllRawDepartments(expiredCachedData);
          setIsInitialLoad(false);
          setError("Supabase sunucusuna bağlanılamadı (TypeError: Failed to fetch). Ancak verileriniz yerel tarayıcı önbelleğinden başarıyla yüklenmiştir.");
          setLoading(false);
          return;
        }
      } catch (cacheErr) {
        console.error("Kurtarma önbelleği okunurken hata oluştu:", cacheErr);
      }

      // Eğer önbellek de yoksa, Tercih Robotunun boş kalmaması için zengin yedek/fallback verileri yükle
      console.log("Önbellek bulunamadı, dahili yedek/fallback verileri yükleniyor...");
      setAllRawDepartments(FALLBACK_DEPARTMENTS);
      setIsInitialLoad(false);
      setError(`Supabase veritabanı bağlantısı kurulamadı (TypeError: Failed to fetch). Robotu test edebilmeniz ve kesintisiz kullanabilmeniz için dahili yedek ÖSYM/YÖK verileri başarıyla aktif edilmiştir.`);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAllData(false);
  }, []);

  // TÜM FİLTRE DURUMLARI DEGISTIGINDE VERİYİ GÜNCELLE
  useEffect(() => {
    if (allRawDepartments.length > 0) {
      const processed = applyClientSideFilters(allRawDepartments);
      setAllFilteredData(processed);
      setTotalCount(processed.length);

      // Sadece exclusion (çıkarılanlar) listesi mi değişti?
      const isOnlyExclusionChange = 
        JSON.stringify(prevExclusionsRef.current.excludedUniversities) !== JSON.stringify(excludedUniversities) ||
        JSON.stringify(prevExclusionsRef.current.excludedFaculties) !== JSON.stringify(excludedFaculties) ||
        JSON.stringify(prevExclusionsRef.current.excludedCities) !== JSON.stringify(excludedCities) ||
        JSON.stringify(prevExclusionsRef.current.excludedTeachingTypes) !== JSON.stringify(excludedTeachingTypes) ||
        JSON.stringify(prevExclusionsRef.current.excludedDepartments) !== JSON.stringify(excludedDepartments) ||
        JSON.stringify(prevExclusionsRef.current.excludedIds) !== JSON.stringify(excludedIds);

      prevExclusionsRef.current = {
        excludedUniversities,
        excludedFaculties,
        excludedCities,
        excludedDepartments,
        excludedIds,
        excludedTeachingTypes
      };

      if (!isOnlyExclusionChange) {
        setPage(0);
      } else {
        const newTotalPages = Math.ceil(processed.length / itemsPerPage);
        setPage((prevPage) => {
          if (newTotalPages <= 0) return 0;
          return prevPage >= newTotalPages ? Math.max(0, newTotalPages - 1) : prevPage;
        });
      }
    }
  }, [
    allRawDepartments, sortType, sortField, sortDirection, selectedPointTypes, selectedDegree,
    selectedTeachingTypes, selectedFees, selectedRegions, selectedCities, selectedUniTypes,
    selectedUniversities, selectedDepartments, selectedTeachingLanguages, debouncedSearchTerm,
    debouncedYopFilter, debouncedUniFilter, debouncedDeptFilter, debouncedCityFilter, debouncedMinRank,
    debouncedMaxRank, debouncedMinPoint, debouncedMaxPoint, debouncedIncludeNewDepts, excludedUniversities,
    excludedFaculties, excludedCities, excludedDepartments, excludedIds, excludedTeachingTypes, pointTypeConstraints, itemsPerPage
  ]);

  useEffect(() => {
    const startIndex = page * itemsPerPage;
    const slice = allFilteredData.slice(startIndex, startIndex + itemsPerPage);
    setDepartments(slice);
    setHasMore(startIndex + itemsPerPage < allFilteredData.length);
  }, [allFilteredData, page, itemsPerPage]);

  const clearFilters = () => {
    setSortType("rank"); setSelectedPointTypes([]); setSelectedDegree("ALL");
    setSelectedTeachingTypes([]); setSelectedFees([]); setMinRank(""); setMaxRank("");
    setMinPoint(""); setMaxPoint(""); setPointTypeConstraints({}); setSelectedRegions([]);
    setSelectedCities([]); setSelectedUniTypes([]); setSelectedUniversities([]);
    setSelectedDepartments([]); setSelectedTeachingLanguages([]); setSearchTerm(""); setCityQuery(""); setUniQuery("");
    setDeptQuery(""); setTeachingLangQuery(""); setYopFilter(""); setUniFilter(""); setDeptFilter(""); setCityFilter(""); setDebouncedCityFilter("");
    setExcludedUniversities([]); setExcludedFaculties([]); setExcludedCities([]); setExcludedDepartments([]); setExcludedIds([]); setExcludedTeachingTypes([]);
  };

  const toggleSort = (field: string) => {
    if (sortField === field) {
      setSortDirection(prev => prev === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortDirection("asc");
    }
  };

  // ============================================================================
  // DINAMIK YIL LİSTESİ VE 2026 KONTENJAN / TAHMİN MODELİ
  // ============================================================================
  const availableYears = React.useMemo(() => {
    const yearSet = new Set<string>();
    allRawDepartments.forEach(dept => {
      if (Array.isArray(dept.departmentPoints)) {
        dept.departmentPoints.forEach(p => {
          if (p.year) yearSet.add(String(p.year).trim());
        });
      }
    });
    const sorted = Array.from(yearSet).sort((a, b) => Number(b) - Number(a));
    return sorted.length > 0 ? sorted : ["2026", "2025", "2024", "2023", "2022"];
  }, [allRawDepartments]);

  // 2026 Başarı Sıralaması Tahmin Modeli (Kontenjan Değişimi & Talep Arzusuna Göre)
  const calculateEstimatedRank2026 = (dept: Department) => {
    let quota2026: number | null = null;
    let quota2025: number | null = null;
    let rank2025: number | null = null;
    let rank2024: number | null = null;

    if (Array.isArray(dept.departmentPoints)) {
      const p2026 = dept.departmentPoints.find(p => String(p.year) === "2026");
      const p2025 = dept.departmentPoints.find(p => String(p.year) === "2025");
      const p2024 = dept.departmentPoints.find(p => String(p.year) === "2024");

      quota2026 = p2026?.quota ?? dept.quota ?? null;
      quota2025 = p2025?.quota ?? null;
      rank2025 = p2025?.basePointOrder ?? dept.lastBasePointOrder ?? null;
      rank2024 = p2024?.basePointOrder ?? null;
    } else {
      quota2026 = dept.quota ?? null;
      rank2025 = dept.lastBasePointOrder ?? null;
    }

    if (!rank2025) {
      return {
        estimatedRank: null,
        quota2026,
        quota2025,
        quotaChange: null,
        percentChange: null,
        demandTrend: "neutral" as const,
        explanation: "2025 yılı başarı sırası verisi bulunamadı."
      };
    }

    if (quota2026 === null || quota2025 === null || quota2025 === 0) {
      return {
        estimatedRank: rank2025,
        quota2026,
        quota2025,
        quotaChange: null,
        percentChange: null,
        demandTrend: "neutral" as const,
        explanation: "2026/2025 kontenjan karşılaştırması yapılamadı; 2025 sırası baz alındı."
      };
    }

    const quotaChange = quota2026 - quota2025;
    const percentChange = Number(((quotaChange / quota2025) * 100).toFixed(1));

    // Kontenjan esneklik katsayısı (~0.78)
    const quotaRatio = quota2026 / quota2025;
    const quotaFactor = Math.pow(quotaRatio, 0.78);

    // Talep Arzus / Yıllık Trend Etkisi
    let demandFactor = 1.0;
    let demandTrend: "up" | "down" | "neutral" = "neutral";

    if (rank2024 && rank2025) {
      const trendRatio = rank2025 / rank2024;
      if (trendRatio < 0.95) {
        demandTrend = "up"; // Sıralama öne çekiyor (girmek zorlaşıyor)
        demandFactor = 0.96;
      } else if (trendRatio > 1.05) {
        demandTrend = "down"; // Sıralama geriliyor (girmek kolaylaşıyor)
        demandFactor = 1.04;
      }
    }

    const rawEstimate = Math.round(rank2025 * quotaFactor * demandFactor);
    const estimatedRank = Math.max(1, rawEstimate);

    let explanation = `2026 Kontenjanı: ${quota2026} (2025: ${quota2025}, Değişim: ${quotaChange >= 0 ? '+' : ''}${quotaChange} [${percentChange >= 0 ? '+' : ''}${percentChange}%]).\n`;
    explanation += `2025 Sıralaması: ${rank2025.toLocaleString('tr-TR')}.\n`;
    explanation += `2026 Tahmini Sıra: ~${estimatedRank.toLocaleString('tr-TR')}`;
    if (demandTrend === "up") explanation += " (Yükselen talep ve öne çekme eğilimi).";
    if (demandTrend === "down") explanation += " (Gerileme eğilimi).";

    return {
      estimatedRank,
      quota2026,
      quota2025,
      quotaChange,
      percentChange,
      demandTrend,
      explanation
    };
  };

  const getYearlyValues = (dept: Department, field: "quota" | "rank" | "point" | "settled") => {
    const years = availableYears;
    
    return years.map((yearStr) => {
      // 2026 Yerleşen sayısı boş kalsın
      if (field === "settled" && yearStr === "2026") {
        return undefined;
      }
      if (Array.isArray(dept.departmentPoints)) {
        const found = dept.departmentPoints.find((p: any) => String(p.year) === yearStr);
        if (found) {
          let val: any = undefined;
          if (field === "quota") val = found.quota ?? (yearStr === "2026" ? dept.quota : found.lastQuota);
          if (field === "rank") {
            val = found.basePointOrder ?? found.lastBasePointOrder;
            if ((val === undefined || val === null) && yearStr === "2026") {
              if (!show2026Estimate) return undefined;
              const est = calculateEstimatedRank2026(dept);
              if (est.estimatedRank !== null) {
                return { val: est.estimatedRank, isEstimated: true, details: est };
              }
            }
          }
          if (field === "point") val = found.basePoint ?? found.lastBasePoint;
          if (field === "settled") val = found.dolulukPercent ?? found.settled ?? found.quota;
          
          if (val !== undefined && val !== null && !Number.isNaN(Number(val))) return val;
        } else if (yearStr === "2026") {
          if (field === "quota" && dept.quota) return dept.quota;
          if (field === "rank") {
            if (!show2026Estimate) return undefined;
            const est = calculateEstimatedRank2026(dept);
            if (est.estimatedRank !== null) {
              return { val: est.estimatedRank, isEstimated: true, details: est };
            }
          }
        }
      }
      return undefined;
    });
  };

  const renderChartModal = () => {
    if (!activeChartData) return null;

    const validValues = activeChartData.values.filter(v => typeof v === "number" && !Number.isNaN(v));
    const maxVal = validValues.length > 0 ? Math.max(...validValues, 1) : 1;
    
    return (
      <AnimatePresence>
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="bg-slate-900 border border-white/10 rounded-3xl p-6 w-full max-w-lg shadow-2xl relative"
          >
            <button 
              onClick={() => setActiveChartData(null)}
              className="absolute top-4 right-4 text-slate-400 hover:text-white transition-colors cursor-pointer"
            >
              <X size={18} />
            </button>

            <div className="flex items-center gap-2 mb-4">
              <TrendingUp className="text-blue-400 w-5 h-5" />
              <h3 className="text-base font-bold text-white">{activeChartData.title} Trend Analizi</h3>
            </div>

            <p className="text-xs text-slate-400 mb-6">Son 4 yılın YKS yerleştirme ve puan verilerinin değişimi aşağıda görselleştirilmiştir.</p>

            <div className="space-y-4 my-6">
              {activeChartData.labels.map((year, idx) => {
                const rawVal = activeChartData.values[idx];
                const val = typeof rawVal === "number" && !Number.isNaN(rawVal) ? rawVal : 0;
                const percentage = maxVal > 0 ? Math.max(8, (val / maxVal) * 100) : 8;
                const cleanPercentage = Number.isNaN(percentage) ? 8 : percentage;
                
                const isRank = activeChartData.unit === "Sira";
                const displayVal = val > 0 
                  ? (isRank ? val.toLocaleString('tr-TR') : val.toFixed(2)) 
                  : "Dolmadı/---";

                return (
                  <div key={year} className="space-y-1.5">
                    <div className="flex justify-between text-xs font-semibold">
                      <span className="text-slate-300">{year} Yılı</span>
                      <span className={activeChartData.unit === "Puan" ? "text-emerald-400" : "text-blue-400 font-mono"}>
                        {displayVal} {val > 0 ? activeChartData.unit : ""}
                      </span>
                    </div>
                    <div className="h-3 bg-slate-950 rounded-full overflow-hidden border border-white/5 relative">
                      <motion.div 
                        initial={{ width: 0 }}
                        animate={{ width: `${cleanPercentage}%` }}
                        transition={{ duration: 0.6, ease: "easeOut" }}
                        className={`h-full rounded-full ${
                          activeChartData.unit === "Puan" 
                            ? "bg-gradient-to-r from-emerald-500/80 to-teal-400/80 shadow-[0_0_12px_rgba(16,185,129,0.3)]" 
                            : "bg-gradient-to-r from-blue-500/80 to-indigo-400/80 shadow-[0_0_12px_rgba(59,130,246,0.3)]"
                        }`}
                      />
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="mt-6 pt-4 border-t border-white/5 flex justify-end">
              <button 
                onClick={() => setActiveChartData(null)}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 border border-white/10 text-white text-xs font-bold rounded-xl transition-all cursor-pointer"
              >
                Kapat
              </button>
            </div>
          </motion.div>
        </div>
      </AnimatePresence>
    );
  };

  const applyAutoRankFilter = (pType: string, rankStr: string, minPercent: number, maxPercent: number, totalSelected: number) => {
    const rawRank = rankStr.replace(/\D/g, "");
    const rank = Number(rawRank);
    if (!rank || rank <= 0) {
      if (totalSelected <= 1) {
        setMinRank("");
        setMaxRank("");
      } else {
        setPointTypeConstraints(prev => ({
          ...prev,
          [pType]: {
            ...prev[pType] || { minRank: "", maxRank: "", minPoint: "", maxPoint: "" },
            minRank: "",
            maxRank: ""
          }
        }));
      }
      return;
    }

    const minR = Math.max(1, Math.floor(rank * (1 - minPercent / 100)));
    const maxR = Math.floor(rank * (1 + maxPercent / 100));

    if (totalSelected <= 1) {
      setMinRank(minR.toString());
      setMaxRank(maxR.toString());
    } else {
      setPointTypeConstraints(prev => ({
        ...prev,
        [pType]: {
          ...prev[pType] || { minRank: "", maxRank: "", minPoint: "", maxPoint: "" },
          minRank: minR.toString(),
          maxRank: maxR.toString()
        }
      }));
    }
  };

  const handleStudentRankChange = (pType: string, val: string) => {
    const rawValue = val.replace(/\D/g, "");
    if (rawValue === "") {
      setStudentRanks(prev => {
        const newRanks = { ...prev };
        delete newRanks[pType];
        return newRanks;
      });
      applyAutoRankFilter(pType, "", minTolerancePercent, maxTolerancePercent, selectedPointTypes.length);
      return;
    }
    const formattedVal = Number(rawValue).toLocaleString('tr-TR');
    setStudentRanks(prev => ({ ...prev, [pType]: formattedVal }));
    applyAutoRankFilter(pType, rawValue, minTolerancePercent, maxTolerancePercent, selectedPointTypes.length);
  };

  const handleMinToleranceChange = (percent: number) => {
    setMinTolerancePercent(percent);
    selectedPointTypes.forEach(pType => {
      if (studentRanks[pType]) {
        applyAutoRankFilter(pType, studentRanks[pType], percent, maxTolerancePercent, selectedPointTypes.length);
      }
    });
  };

  const handleMaxToleranceChange = (percent: number) => {
    setMaxTolerancePercent(percent);
    selectedPointTypes.forEach(pType => {
      if (studentRanks[pType]) {
        applyAutoRankFilter(pType, studentRanks[pType], minTolerancePercent, percent, selectedPointTypes.length);
      }
    });
  };

  const togglePointType = (pType: string) => {
    setSelectedPointTypes(prev => {
      if (prev.includes(pType)) {
        if (prev.length <= 1) return prev;
        return prev.filter(t => t !== pType);
      } else {
        return [...prev, pType];
      }
    });
  };

  const handleConstraintChange = (pType: string, field: "minRank" | "maxRank" | "minPoint" | "maxPoint", val: string) => {
    setPointTypeConstraints(prev => ({
      ...prev,
      [pType]: {
        ...prev[pType] || { minRank: "", maxRank: "", minPoint: "", maxPoint: "" },
        [field]: val
      }
    }));
  };

  const handleCitySelect = (city: string) => {
    if (selectedCities.includes(city)) return;
    setSelectedCities(prev => [...prev, city]);
    setCityQuery("");
    setShowCityDropdown(false);
  };

  const toggleCity = (city: string) => {
    if (selectedCities.length === 0) {
      setSelectedCities(dynamicCities.filter(c => c !== city));
      return;
    }
    const isSelected = selectedCities.includes(city);
    const reg = getCityRegion(city);

    if (isSelected) {
      setSelectedCities(prev => prev.filter(c => c !== city));
      if (reg && selectedRegions.includes(reg)) {
        setSelectedRegions(prev => prev.filter(r => r !== reg));
      }
    } else {
      setSelectedCities(prev => {
        const next = [...prev, city];
        if (next.length >= dynamicCities.length) return [];
        if (reg) {
          const regionCities = dynamicCities.filter(c => getCityRegion(c) === reg);
          if (regionCities.length > 0 && regionCities.every(c => next.includes(c))) {
            if (!selectedRegions.includes(reg)) {
              setSelectedRegions(rPrev => [...rPrev, reg]);
            }
          }
        }
        return next;
      });
    }
  };

  const removeCity = (city: string) => {
    const reg = getCityRegion(city);
    setSelectedCities(prev => prev.filter(c => c !== city));
    if (reg && selectedRegions.includes(reg)) {
      setSelectedRegions(prev => prev.filter(r => r !== reg));
    }
  };

  const toggleRegion = (reg: string) => {
    const isSelected = selectedRegions.includes(reg);
    const regionCities = dynamicCities.filter(city => getCityRegion(city) === reg);

    if (isSelected) {
      setSelectedRegions(prev => prev.filter(r => r !== reg));
      if (regionCities.length > 0) {
        setSelectedCities(prev => prev.filter(c => !regionCities.includes(c)));
      }
    } else {
      setSelectedRegions(prev => [...prev, reg]);
      if (regionCities.length > 0) {
        setSelectedCities(prev => Array.from(new Set([...prev, ...regionCities])));
      }
    }
  };

  const toggleUniType = (type: string) => setSelectedUniTypes(prev => prev.includes(type) ? prev.filter(t => t !== type) : [...prev, type]);
  const toggleTeachingType = (type: string) => setSelectedTeachingTypes(prev => prev.includes(type) ? prev.filter(t => t !== type) : [...prev, type]);
  const toggleFeeType = (type: string) => setSelectedFees(prev => prev.includes(type) ? prev.filter(t => t !== type) : [...prev, type]);
  const removeUniversity = (uni: string) => setSelectedUniversities(prev => prev.filter(u => u !== uni));
  const removeDepartment = (dept: string) => setSelectedDepartments(prev => prev.filter(d => d !== dept));

  if (isInitialLoad) {
    return (
      <div className="fixed inset-0 bg-[#020617] flex flex-col items-center justify-center z-50 px-4">
        {/* Subtle background glow */}
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(59,130,246,0.08),transparent_70%)] pointer-events-none" />
        
        <div className="relative flex flex-col items-center max-w-md w-full text-center space-y-8">
          {/* Animated custom loader */}
          <div className="relative w-28 h-28 flex items-center justify-center">
            {/* Outer spinning ring with gradient */}
            <motion.div 
              className="absolute inset-0 rounded-full border-2 border-transparent border-t-blue-500 border-r-teal-400"
              animate={{ rotate: 360 }}
              transition={{ repeat: Infinity, duration: 1.5, ease: "linear" }}
            />
            {/* Middle pulsing ring */}
            <motion.div 
              className="absolute w-20 h-20 rounded-full border border-blue-500/20 bg-blue-500/5 flex items-center justify-center"
              animate={{ scale: [0.95, 1.05, 0.95], opacity: [0.5, 1, 0.5] }}
              transition={{ repeat: Infinity, duration: 2, ease: "easeInOut" }}
            />
            {/* Center icon */}
            <motion.div
              animate={{ rotate: [0, -10, 10, 0] }}
              transition={{ repeat: Infinity, duration: 3, ease: "easeInOut" }}
            >
              <GraduationCap className="w-10 h-10 text-blue-400" />
            </motion.div>
          </div>

          <div className="space-y-3">
            <h3 className="text-white font-extrabold text-xl tracking-tight">
              FocusOn Akademi Tercih Robotu
            </h3>
            <p className="text-slate-400 text-xs tracking-wider uppercase font-semibold">
              Veritabanı bağlantısı kuruluyor
            </p>
          </div>

          {/* Cycling text with slide/fade animation */}
          <div className="h-10 flex items-center justify-center overflow-hidden w-full">
            <AnimatePresence mode="wait">
              <motion.div
                key={loadingStep}
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -15 }}
                transition={{ duration: 0.4 }}
                className="text-blue-400/90 font-medium text-sm flex items-center gap-2"
              >
                <RefreshCw className="w-4 h-4 animate-spin text-teal-400 shrink-0" />
                <span>{loadingMessages[loadingStep]}</span>
              </motion.div>
            </AnimatePresence>
          </div>

          {/* Mini progress indicators */}
          <div className="flex gap-1.5 justify-center">
            {loadingMessages.map((_, idx) => (
              <div 
                key={idx}
                className={`h-1.5 rounded-full transition-all duration-500 ${idx === loadingStep ? "w-6 bg-blue-500" : "w-1.5 bg-slate-800"}`}
              />
            ))}
          </div>

          {/* Bilgilendirme ve Özür Mesajı */}
          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2, duration: 0.5 }}
            className="mt-6 p-4 rounded-2xl bg-slate-900/90 border border-blue-500/20 text-slate-300 text-xs leading-relaxed space-y-2 shadow-2xl backdrop-blur-md max-w-md w-full"
          >
            <div className="flex items-center justify-center gap-2 text-amber-400 font-extrabold text-xs uppercase tracking-wider">
              <Info size={16} className="shrink-0 text-amber-400" />
              <span>Önemli Bilgilendirme</span>
            </div>
            <p className="text-slate-200 text-center font-medium leading-normal">
              YKS tercih verileri geniş kapsamlı olduğu için bu hazırlık süreci <strong>sadece ilk açılışa özeldir</strong>.
            </p>
            <p className="text-slate-400 text-center text-[11px] leading-normal">
              Daha sonraki girişlerinizde veriler önbelleğe alınacağından çok daha hızlı bir açılış sağlanacaktır.
            </p>
            <div className="pt-2 border-t border-white/10 text-center">
              <p className="text-blue-300 font-semibold text-[11px]">
                Sizleri beklettiğimiz için özür diler, anlayışınız için teşekkür ederiz.
              </p>
            </div>
          </motion.div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 w-full max-w-none px-4 md:px-8 py-8 relative z-10">
      
      {/* Header */}
      <div className="mb-8 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-blue-400 text-sm font-semibold uppercase tracking-wider mb-1">
            <Sparkles className="w-4 h-4" />
            2026 YKS Tercih Robotu
          </div>
          <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight text-white">
            Üniversite Tercih Asistanı
          </h1>
          <p className="text-slate-400 text-sm mt-1">
            2026 YKS başarı sıralamaları ve taban puanlarına göre akıllı tercih robotu.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <a
            href="/meslek-rehberi"
            target="_blank"
            rel="noopener noreferrer"
            className="px-4 py-2.5 text-xs font-bold text-blue-400 hover:text-white bg-blue-950/40 hover:bg-blue-600/25 border border-blue-500/20 hover:border-blue-500/40 rounded-xl transition-all flex items-center gap-2 cursor-pointer shadow-lg shadow-blue-500/5 hover:scale-[1.02] active:scale-[0.98]"
          >
            <GraduationCap className="w-4 h-4 text-blue-400 shrink-0" />
            <span>Meslek Rehberi (Hangi Meslek Ne İş Yapar?)</span>
            <ExternalLink className="w-3 h-3 opacity-60 shrink-0" />
          </a>
        </div>
      </div>

      {/* Firestore Missing Index Warning */}
      {indexErrorUrl && (
        <motion.div 
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-6 p-4 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-200 text-sm flex flex-col sm:flex-row items-start gap-3 shadow-lg"
        >
          <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
          <div className="flex-1">
            <h4 className="font-bold text-white mb-1">Bileşik İndeks Gerekli (Firestore Index Needed)</h4>
            <p className="text-amber-300/90 text-xs leading-relaxed mb-3">
              Bu filtreleme kombinasyonu veritabanında özel bir bileşik indeks gerektiriyor. Firestore Console üzerinden bu indeksi tek tıkla oluşturabilirsiniz.
            </p>
            <a 
              href={indexErrorUrl} 
              target="_blank" 
              rel="noopener noreferrer" 
              className="inline-flex items-center gap-1.5 bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold px-4 py-2 rounded-xl text-xs transition-colors shadow-md"
            >
              İndeksi Otomatik Oluştur (Firebase Console)
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
          </div>
        </motion.div>
      )}

      {/* General Error Banner */}
      {error && !indexErrorUrl && (
        <div className="mb-6 p-4 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-200 text-xs font-mono overflow-auto max-h-32">
          <div className="font-bold text-rose-400 mb-1">Bağlantı Hatası:</div>
          {error}
        </div>
      )}

      {/* FILTER PANEL */}
      <div className="w-full bg-slate-900/40 backdrop-blur-md border border-white/5 rounded-2xl p-6 mb-8 space-y-6 shadow-xl relative z-30">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-white/5">
          <div className="flex items-center gap-2">
            <Filter className="text-blue-400 w-5 h-5" />
            <h2 className="text-white font-bold text-lg">Gelişmiş Arama ve Filtreleme Robotu</h2>
          </div>
          <button
            onClick={clearFilters}
            className="px-4 py-2 text-xs font-semibold text-slate-400 hover:text-white bg-slate-950/50 hover:bg-slate-950 border border-white/5 hover:border-white/10 rounded-xl transition-all flex items-center gap-1.5 cursor-pointer self-start sm:self-auto"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            Filtreleri Temizle
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          
          {/* 1. Sıralama Tipi */}
          <div className="space-y-1.5">
            <label className="text-xs text-slate-400 font-semibold uppercase tracking-wider">1. Sıralama Tipi</label>
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => setSortType("rank")}
                className={`py-2 px-3 rounded-xl text-xs font-bold border transition-all text-center flex items-center justify-center gap-1.5 cursor-pointer ${sortType === "rank" ? "bg-blue-600/20 text-blue-400 border-blue-500/40" : "bg-slate-950/40 text-slate-400 border-white/5 hover:border-white/10 hover:text-white"}`}
              >
                <ArrowUpDown size={14} />
                Sıralama (YKS)
              </button>
              <button
                onClick={() => setSortType("point")}
                className={`py-2 px-3 rounded-xl text-xs font-bold border transition-all text-center flex items-center justify-center gap-1.5 cursor-pointer ${sortType === "point" ? "bg-blue-600/20 text-blue-400 border-blue-500/40" : "bg-slate-950/40 text-slate-400 border-white/5 hover:border-white/10 hover:text-white"}`}
              >
                <GraduationCap size={14} />
                Puan (Taban)
              </button>
            </div>
          </div>

          {/* 2. Puan Türü & Sıralama */}
          <div className="space-y-2">
            <label className="text-xs text-slate-400 font-semibold uppercase tracking-wider flex items-center justify-between">
              <span>2. Puan Türü</span>
              {selectedPointTypes.length > 0 && (
                <button 
                  onClick={() => setShowAutoRank(!showAutoRank)}
                  className="text-[10px] bg-slate-900/50 hover:bg-slate-800 text-slate-300 px-2 py-0.5 rounded flex items-center gap-1 transition-colors"
                >
                  {showAutoRank ? "Akıllı Süzgeci Gizle" : "Sıralama Gir"}
                </button>
              )}
            </label>
            
            <div className="grid grid-cols-5 gap-1.5">
              {["TYT", "SAY", "EA", "SÖZ", "DİL"].map(pType => (
                <button
                  key={pType}
                  onClick={() => togglePointType(pType)}
                  className={`py-2 rounded-xl text-xs font-extrabold border transition-all text-center cursor-pointer flex flex-col items-center justify-center gap-1 ${
                    selectedPointTypes.includes(pType) 
                    ? "bg-blue-600 text-white border-blue-500 shadow-md shadow-blue-600/20" 
                    : "bg-slate-950/40 text-slate-400 border-white/5 hover:border-white/10 hover:text-white"
                  }`}
                >
                  <span className={selectedPointTypes.includes(pType) ? "text-[10px]" : "text-xs"}>{pType}</span>
                </button>
              ))}
            </div>

            
          </div>

          {/* 3. Ön/Lisans Seviyesi */}
          <div className="space-y-1.5">
            <label className="text-xs text-slate-400 font-semibold uppercase tracking-wider">3. Ön/Lisans Seviyesi</label>
            <div className="grid grid-cols-3 gap-1">
              {[
                { value: "ALL", label: "Hepsi" },
                { value: "LISANS", label: "Lisans" },
                { value: "ONLISANS", label: "Ön Lisans" }
              ].map(level => (
                <button
                  key={level.value}
                  onClick={() => {
                    setSelectedDegree(level.value as any);
                    if (level.value === "ONLISANS") {
                      setSelectedPointTypes(["TYT"]);
                    }
                  }}
                  className={`py-2 rounded-xl text-xs font-semibold border transition-all text-center cursor-pointer ${selectedDegree === level.value ? "bg-blue-600/20 text-blue-400 border-blue-500/40" : "bg-slate-950/40 text-slate-400 border-white/5 hover:border-white/10 hover:text-white"}`}
                >
                  {level.label}
                </button>
              ))}
            </div>
          </div>

<AnimatePresence>
              {selectedPointTypes.length > 0 && showAutoRank && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  className="overflow-hidden col-span-1 md:col-span-2 lg:col-span-3"
                >
                  <div className="bg-blue-950/20 border border-blue-500/30 rounded-xl p-3 mt-2 shadow-inner">
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-[11px] text-blue-300 font-bold uppercase tracking-wider flex items-center gap-1.5">
                        <Sparkles size={14} className="text-blue-400" />
                        Akıllı Sıralama Süzgeci
                      </span>
                      <span className="text-[9px] text-blue-400/70 bg-blue-500/10 px-2 py-1 rounded hidden sm:inline-block">Sıralamanızı girin, robot sizin için süzsün</span>
                    </div>

                    <div className="flex flex-wrap gap-2 items-center">
                      {selectedPointTypes.map(pType => (
                        <div key={`rank-input-${pType}`} className="flex-1 min-w-[130px] flex items-center bg-slate-900/80 rounded-lg p-1.5 border border-white/5 focus-within:border-blue-500/50 focus-within:ring-1 focus-within:ring-blue-500/50 transition-all">
                          <div className="bg-blue-600 text-white font-black text-[10px] uppercase px-2 py-1.5 rounded-md text-center shadow-sm">
                            {pType}
                          </div>
                          <div className="relative flex-1">
                            <input
                              type="text"
                              placeholder="Sıralama..."
                              value={studentRanks[pType] || ""}
                              onChange={(e) => handleStudentRankChange(pType, e.target.value)}
                              className="w-full bg-transparent border-none py-1 pl-2 pr-6 text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-0 font-mono font-medium"
                            />
                            {studentRanks[pType] && (
                              <Check size={14} className="absolute right-1 top-1/2 -translate-y-1/2 text-emerald-500" />
                            )}
                          </div>
                        </div>
                      ))}
                      
                      {/* Esneklik Ayarı (Aynı Satırda) */}
                      <div className="flex items-center gap-2 bg-slate-900/80 rounded-lg p-1.5 border border-white/5 ml-auto shrink-0 mt-2 sm:mt-0">
                        <div className="flex items-center gap-1.5" title="Sıralamanızın % kaç üstüne çıkılabileceğini belirler">
                          <span className="text-[9px] text-emerald-400 font-bold uppercase whitespace-nowrap">Üst (İyi) %</span>
                          <input 
                            type="number" 
                            min="0"
                            max="100"
                            value={minTolerancePercent}
                            onChange={(e) => handleMinToleranceChange(Number(e.target.value))}
                            className="w-12 bg-slate-950/50 border border-white/10 rounded py-1 px-1 text-xs text-center text-white focus:outline-none focus:border-emerald-500/50 font-mono"
                          />
                        </div>
                        <div className="w-px h-4 bg-white/10"></div>
                        <div className="flex items-center gap-1.5" title="Sıralamanızın % kaç altına inilebileceğini belirler">
                          <span className="text-[9px] text-rose-400 font-bold uppercase whitespace-nowrap">Alt (Kötü) %</span>
                          <input 
                            type="number" 
                            min="0"
                            max="100"
                            value={maxTolerancePercent}
                            onChange={(e) => handleMaxToleranceChange(Number(e.target.value))}
                            className="w-12 bg-slate-950/50 border border-white/10 rounded py-1 px-1 text-xs text-center text-white focus:outline-none focus:border-rose-500/50 font-mono"
                          />
                        </div>
                      </div>
                    </div>

                  </div>
                </motion.div>
              )}
            </AnimatePresence>

          {/* 4. Öğretim Türü */}
          <div className="space-y-1.5">
            <label className="text-xs text-slate-400 font-semibold uppercase tracking-wider">4. Öğretim Türü</label>
            <div className="relative" ref={teachingDropdownRef}>
              <div 
                onClick={() => setShowTeachingDropdown(!showTeachingDropdown)}
                className="w-full bg-slate-950/40 border border-white/5 hover:border-white/10 rounded-xl py-2 px-3 text-xs text-slate-300 cursor-pointer flex items-center justify-between min-h-[38px]"
              >
                <span className="text-slate-400 truncate">
                  {selectedTeachingTypes.length === 0 ? "Tüm Öğretim Türleri" : `${selectedTeachingTypes.length} Tür Seçili`}
                </span>
                <ChevronRight size={14} className={`transform transition-transform text-slate-400 ${showTeachingDropdown ? "rotate-90" : ""}`} />
              </div>

              {showTeachingDropdown && (
                <div className="absolute left-0 right-0 mt-1.5 bg-slate-950 border border-white/10 rounded-xl shadow-2xl z-50 p-2.5 space-y-2">
                  {[
                    { id: "NORMAL", label: "Normal Öğretim" },
                    { id: "IKINCI", label: "İkinci Öğretim" },
                    { id: "UZAKTAN", label: "Uzaktan Öğretim" },
                    { id: "ACIK", label: "Açık Öğretim" },
                    { id: "MTOK", label: "M.T.O.K" }
                  ].map(opt => (
                    <label key={opt.id} className="flex items-center gap-2 cursor-pointer py-1 hover:bg-white/5 px-2 rounded-lg">
                      <input
                        type="checkbox"
                        checked={selectedTeachingTypes.includes(opt.id)}
                        onChange={() => toggleTeachingType(opt.id)}
                        className="sr-only"
                      />
                      <div className={`w-4 h-4 rounded border flex items-center justify-center transition-colors ${selectedTeachingTypes.includes(opt.id) ? "bg-blue-500 border-blue-500" : "border-white/20 bg-slate-950/40"}`}>
                        {selectedTeachingTypes.includes(opt.id) && <Check size={10} className="text-white stroke-[3]" />}
                      </div>
                      <span className="text-xs text-slate-300">{opt.label}</span>
                    </label>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* 5. Ücret Türleri */}
          <div className="space-y-1.5">
            <label className="text-xs text-slate-400 font-semibold uppercase tracking-wider">5. Ücret Türleri</label>
            <div className="relative" ref={feeDropdownRef}>
              <div 
                onClick={() => setShowFeeDropdown(!showFeeDropdown)}
                className="w-full bg-slate-950/40 border border-white/5 hover:border-white/10 rounded-xl py-2 px-3 text-xs text-slate-300 cursor-pointer flex items-center justify-between min-h-[38px]"
              >
                <span className="text-slate-400 truncate">
                  {selectedFees.length === 0 ? "Tüm Ücret Türleri" : `${selectedFees.length} Ücret Seçili`}
                </span>
                <ChevronRight size={14} className={`transform transition-transform text-slate-400 ${showFeeDropdown ? "rotate-90" : ""}`} />
              </div>

              {showFeeDropdown && (
                <div className="absolute left-0 right-0 mt-1.5 bg-slate-950 border border-white/10 rounded-xl shadow-2xl z-50 p-2.5 space-y-2">
                  {[
                    { id: "UCRETLI", label: "Ücretli" },
                    { id: "UCRETSIZ", label: "Ücretsiz" },
                    { id: "BURSLU", label: "Burslu" },
                    { id: "IND_75", label: "%75 İndirimli" },
                    { id: "IND_50", label: "%50 İndirimli" },
                    { id: "IND_25", label: "%25 İndirimli" }
                  ].map(opt => (
                    <label key={opt.id} className="flex items-center gap-2 cursor-pointer py-1 hover:bg-white/5 px-2 rounded-lg">
                      <input
                        type="checkbox"
                        checked={selectedFees.includes(opt.id)}
                        onChange={() => toggleFeeType(opt.id)}
                        className="sr-only"
                      />
                      <div className={`w-4 h-4 rounded border flex items-center justify-center transition-colors ${selectedFees.includes(opt.id) ? "bg-blue-500 border-blue-500" : "border-white/20 bg-slate-950/40"}`}>
                        {selectedFees.includes(opt.id) && <Check size={10} className="text-white stroke-[3]" />}
                      </div>
                      <span className="text-xs text-slate-300">{opt.label}</span>
                    </label>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* 6. Sıralama / Puan Değer Süzgeci */}
          <div className="space-y-1.5">
            <label className="text-xs text-slate-400 font-semibold uppercase tracking-wider">
              6. {sortType === "rank" ? "Başarı Sırası Süzgeci" : "Taban Puan Süzgeci"}
            </label>
            <div className="space-y-2">
              {selectedPointTypes.length <= 1 ? (
                sortType === "rank" ? (
                  <div>
                    <div className="grid grid-cols-2 gap-2">
                      <input
                        type="number"
                        placeholder="En Düşük Sıra (örn. 10.000)"
                        value={minRank}
                        onChange={(e) => setMinRank(e.target.value)}
                        onKeyDown={(e) => { if (e.key === "Enter") handleFetchResults(); }}
                        className="w-full bg-slate-950/40 border border-white/5 hover:border-white/10 rounded-xl py-1.5 px-3 text-xs text-white placeholder-slate-600 focus:outline-none focus:border-blue-500/50"
                      />
                      <input
                        type="number"
                        placeholder="En Yüksek Sıra (örn. 100.000)"
                        value={maxRank}
                        onChange={(e) => setMaxRank(e.target.value)}
                        onKeyDown={(e) => { if (e.key === "Enter") handleFetchResults(); }}
                        className="w-full bg-slate-950/40 border border-white/5 hover:border-white/10 rounded-xl py-1.5 px-3 text-xs text-white placeholder-slate-600 focus:outline-none focus:border-blue-500/50"
                      />
                    </div>
                    {(minRank || maxRank) && (
                      <div className="flex items-center justify-between px-1 pt-1 text-[10px] text-blue-400 font-mono">
                        <span>{minRank ? `Min: ${Number(minRank).toLocaleString('tr-TR')} Sıra` : ''}</span>
                        <span>{maxRank ? `Max: ${Number(maxRank).toLocaleString('tr-TR')} Sıra` : ''}</span>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="grid grid-cols-2 gap-2">
                    <input
                      type="number"
                      placeholder="En Düşük Puan"
                      value={minPoint}
                      onChange={(e) => setMinPoint(e.target.value)}
                      onKeyDown={(e) => { if (e.key === "Enter") handleFetchResults(); }}
                      className="w-full bg-slate-950/40 border border-white/5 hover:border-white/10 rounded-xl py-1.5 px-3 text-xs text-white placeholder-slate-600 focus:outline-none focus:border-blue-500/50"
                    />
                    <input
                      type="number"
                      placeholder="En Yüksek Puan"
                      value={maxPoint}
                      onChange={(e) => setMaxPoint(e.target.value)}
                      onKeyDown={(e) => { if (e.key === "Enter") handleFetchResults(); }}
                      className="w-full bg-slate-950/40 border border-white/5 hover:border-white/10 rounded-xl py-1.5 px-3 text-xs text-white placeholder-slate-600 focus:outline-none focus:border-blue-500/50"
                    />
                  </div>
                )
              ) : (
                <div className="relative" ref={constraintsDropdownRef}>
                  <div 
                    onClick={() => setShowConstraintsDropdown(!showConstraintsDropdown)}
                    className="w-full bg-slate-950/40 border border-white/5 hover:border-white/10 rounded-xl py-1.5 px-3 text-xs text-slate-300 cursor-pointer flex items-center justify-between min-h-[34px]"
                  >
                    <span className="text-slate-400 truncate flex items-center gap-1.5 text-[11px]">
                      <SlidersHorizontal size={12} className="text-blue-400" />
                      Alanlara Göre Özel Sınırlar ({selectedPointTypes.length} Alan)
                    </span>
                    <ChevronRight size={14} className={`transform transition-transform text-slate-400 ${showConstraintsDropdown ? "rotate-90" : ""}`} />
                  </div>

                  {showConstraintsDropdown && (
                    <div className="absolute left-0 right-0 mt-1.5 bg-slate-950 border border-white/10 rounded-xl shadow-2xl z-50 p-3 space-y-3 max-h-64 overflow-y-auto custom-scrollbar">
                      {selectedPointTypes.map(pType => {
                        const constraint = pointTypeConstraints[pType] || { minRank: "", maxRank: "", minPoint: "", maxPoint: "" };
                        return (
                          <div key={pType} className="space-y-1 pb-2 border-b border-white/5 last:border-0 last:pb-0">
                            <div className="text-xs font-bold text-blue-400">{pType} Puan Türü Sınırı</div>
                            {sortType === "rank" ? (
                              <div>
                                <div className="grid grid-cols-2 gap-1.5">
                                  <input
                                    type="number"
                                    placeholder="En Düşük Sıra"
                                    value={constraint.minRank || ""}
                                    onChange={(e) => handleConstraintChange(pType, "minRank", e.target.value)}
                                    onKeyDown={(e) => { if (e.key === "Enter") handleFetchResults(); }}
                                    className="w-full bg-slate-900 border border-white/5 rounded-lg py-1 px-2 text-[11px] text-white focus:outline-none focus:border-blue-500/40"
                                  />
                                  <input
                                    type="number"
                                    placeholder="En Yüksek Sıra"
                                    value={constraint.maxRank || ""}
                                    onChange={(e) => handleConstraintChange(pType, "maxRank", e.target.value)}
                                    onKeyDown={(e) => { if (e.key === "Enter") handleFetchResults(); }}
                                    className="w-full bg-slate-900 border border-white/5 rounded-lg py-1 px-2 text-[11px] text-white focus:outline-none focus:border-blue-500/40"
                                  />
                                </div>
                                {(constraint.minRank || constraint.maxRank) && (
                                  <div className="flex justify-between px-1 pt-0.5 text-[9px] text-blue-400 font-mono">
                                    <span>{constraint.minRank ? Number(constraint.minRank).toLocaleString('tr-TR') : ''}</span>
                                    <span>{constraint.maxRank ? Number(constraint.maxRank).toLocaleString('tr-TR') : ''}</span>
                                  </div>
                                )}
                              </div>
                            ) : (
                              <div className="grid grid-cols-2 gap-1.5">
                                <input
                                  type="number"
                                  placeholder="En Düşük Puan"
                                  value={constraint.minPoint || ""}
                                  onChange={(e) => handleConstraintChange(pType, "minPoint", e.target.value)}
                                  onKeyDown={(e) => { if (e.key === "Enter") handleFetchResults(); }}
                                  className="w-full bg-slate-900 border border-white/5 rounded-lg py-1 px-2 text-[11px] text-white focus:outline-none focus:border-blue-500/40"
                                />
                                <input
                                  type="number"
                                  placeholder="En Yüksek Puan"
                                  value={constraint.maxPoint || ""}
                                  onChange={(e) => handleConstraintChange(pType, "maxPoint", e.target.value)}
                                  onKeyDown={(e) => { if (e.key === "Enter") handleFetchResults(); }}
                                  className="w-full bg-slate-900 border border-white/5 rounded-lg py-1 px-2 text-[11px] text-white focus:outline-none focus:border-blue-500/40"
                                />
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}
              
              <label className="flex items-center gap-2 mt-2 cursor-pointer hover:bg-white/5 py-1 px-1 rounded-lg transition-colors">
                <input
                  type="checkbox"
                  checked={includeNewDepts}
                  onChange={(e) => setIncludeNewDepts(e.target.checked)}
                  className="sr-only"
                />
                <div className={`w-4 h-4 rounded border flex items-center justify-center transition-colors ${includeNewDepts ? "bg-blue-500 border-blue-500" : "border-white/20 bg-slate-950/40"}`}>
                  {includeNewDepts && <Check size={10} className="text-white stroke-[3]" />}
                </div>
                <span className="text-[11px] text-slate-300">Yeni Açılan Bölümleri Dahil Et</span>
              </label>
            </div>
          </div>

          {/* 7. Şehir & Bölge Filtresi */}
          <div className="space-y-1.5">
            <label className="text-xs text-slate-400 font-semibold uppercase tracking-wider flex justify-between">
              <span>7. Şehir & Bölge Filtresi</span>
            </label>
            <div className="grid grid-cols-2 gap-2">
              <div className="relative" ref={regionDropdownRef}>
                <div 
                  onClick={() => setShowRegionDropdown(!showRegionDropdown)}
                  className="w-full bg-slate-950/40 border border-white/5 hover:border-white/10 rounded-xl py-2 px-3 text-xs text-slate-300 cursor-pointer flex items-center justify-between min-h-[38px] truncate"
                >
                  <span className="text-slate-400 truncate">
                    {selectedRegions.length === 0 ? "Bölgeler..." : `${selectedRegions.length} Bölge`}
                  </span>
                  <ChevronRight size={14} className={`transform transition-transform text-slate-400 ${showRegionDropdown ? "rotate-90" : ""}`} />
                </div>

                {showRegionDropdown && (
                  <div className="absolute left-0 right-0 mt-1.5 bg-slate-950 border border-white/10 rounded-xl shadow-2xl z-50 p-2.5 space-y-2">
                    {dynamicRegions.length > 0 ? dynamicRegions.map(reg => (
                      <label key={reg} className="flex items-center gap-2 cursor-pointer py-1 hover:bg-white/5 px-2 rounded-lg">
                        <input
                          type="checkbox"
                          checked={selectedRegions.includes(reg)}
                          onChange={() => toggleRegion(reg)}
                          className="sr-only"
                        />
                        <div className={`w-4 h-4 rounded border flex items-center justify-center transition-colors ${selectedRegions.includes(reg) ? "bg-blue-500 border-blue-500" : "border-white/20 bg-slate-950/40"}`}>
                          {selectedRegions.includes(reg) && <Check size={10} className="text-white stroke-[3]" />}
                        </div>
                        <span className="text-xs text-slate-300 truncate">{reg}</span>
                      </label>
                    )) : (
                       <div className="text-xs text-slate-500 py-1 text-center">Bölge bulunamadı</div>
                    )}
                  </div>
                )}
              </div>

              <div className="relative" ref={cityDropdownRef}>
                <div 
                  onClick={() => setShowCityDropdown(!showCityDropdown)}
                  className="w-full bg-slate-950/40 border border-white/5 hover:border-white/10 rounded-xl py-2 px-3 text-xs text-slate-300 cursor-pointer flex items-center justify-between min-h-[38px] truncate"
                >
                  <span className="text-slate-400 truncate">
                    {selectedCities.length === 0 || selectedCities.length === dynamicCities.length
                      ? "Şehirler (Hepsi Seçili)" 
                      : `${selectedCities.length} / ${dynamicCities.length} Şehir`}
                  </span>
                  <ChevronRight size={14} className={`transform transition-transform text-slate-400 ${showCityDropdown ? "rotate-90" : ""}`} />
                </div>

                {showCityDropdown && (
                  <div className="absolute left-0 right-0 mt-1.5 bg-slate-950 border border-white/10 rounded-xl shadow-2xl z-50 max-h-56 overflow-y-auto custom-scrollbar p-2 space-y-2">
                    <input
                      type="text"
                      placeholder="Şehir ara..."
                      value={cityQuery}
                      onChange={(e) => setCityQuery(e.target.value)}
                      className="w-full bg-slate-900 border border-white/5 rounded-lg py-1 px-2.5 text-xs text-white focus:outline-none focus:border-blue-500/40"
                    />
                    <div className="space-y-1">
                      <label
                        className="flex items-center gap-2 py-1 px-2 rounded-lg cursor-pointer hover:bg-white/5 transition-colors border-b border-white/5 pb-1.5 mb-1"
                      >
                        <input
                          type="checkbox"
                          checked={selectedCities.length === 0 || selectedCities.length === dynamicCities.length}
                          onChange={() => {
                            setSelectedCities([]);
                          }}
                          className="sr-only"
                        />
                        <div className={`w-4 h-4 rounded border flex items-center justify-center transition-colors ${selectedCities.length === 0 || selectedCities.length === dynamicCities.length ? "bg-blue-500 border-blue-500" : "border-white/20 bg-slate-950/40"}`}>
                          {(selectedCities.length === 0 || selectedCities.length === dynamicCities.length) && <Check size={10} className="text-white stroke-[3]" />}
                        </div>
                        <span className="text-xs font-bold text-white flex-1 truncate">Tüm Şehirler (Hepsi Seçili)</span>
                      </label>

                      {filteredCityOptions.length > 0 ? (
                        filteredCityOptions.map(city => {
                          const isSelected = selectedCities.length === 0 || selectedCities.includes(city);
                          return (
                            <label
                              key={city}
                              className="flex items-center gap-2 py-1 px-2 rounded-lg cursor-pointer hover:bg-white/5 transition-colors"
                            >
                              <input
                                type="checkbox"
                                checked={isSelected}
                                onChange={() => toggleCity(city)}
                                className="sr-only"
                              />
                              <div className={`w-4 h-4 rounded border flex items-center justify-center transition-colors ${isSelected ? "bg-blue-500 border-blue-500" : "border-white/20 bg-slate-950/40"}`}>
                                {isSelected && <Check size={10} className="text-white stroke-[3]" />}
                              </div>
                              <span className="text-xs text-slate-300 flex-1 truncate">{city}</span>
                            </label>
                          );
                        })
                      ) : (
                        <div className="text-xs text-slate-500 py-1 text-center">Şehir bulunamadı</div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* 8. Üniversiteler & Tipi */}
          <div className="space-y-1.5">
            <label className="text-xs text-slate-400 font-semibold uppercase tracking-wider">8. Üniversite & Türü</label>
            <div className="grid grid-cols-2 gap-2">
              <div className="relative" ref={uniTypeDropdownRef}>
                <div 
                  onClick={() => setShowUniTypeDropdown(!showUniTypeDropdown)}
                  className="w-full bg-slate-950/40 border border-white/5 hover:border-white/10 rounded-xl py-2 px-3 text-xs text-slate-300 cursor-pointer flex items-center justify-between min-h-[38px] truncate"
                >
                  <span className="text-slate-400 truncate">
                    {selectedUniTypes.length === 0 ? "Tüm Türler" : `${selectedUniTypes.length} Tür`}
                  </span>
                  <ChevronRight size={14} className={`transform transition-transform text-slate-400 ${showUniTypeDropdown ? "rotate-90" : ""}`} />
                </div>

                {showUniTypeDropdown && (
                  <div className="absolute left-0 right-0 mt-1.5 bg-slate-950 border border-white/10 rounded-xl shadow-2xl z-50 p-2.5 space-y-2">
                    {dynamicUniTypeOptions.map(opt => (
                      <label 
                        key={opt.id} 
                        className={`flex items-center gap-2 py-1 px-1.5 rounded-lg transition-all ${
                          opt.disabled 
                            ? "opacity-30 cursor-not-allowed" 
                            : "cursor-pointer hover:bg-white/5"
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={selectedUniTypes.includes(opt.id)}
                          onChange={() => {
                            if (!opt.disabled) toggleUniType(opt.id);
                          }}
                          disabled={opt.disabled}
                          className="sr-only"
                        />
                        <div className={`w-4 h-4 rounded border flex items-center justify-center transition-colors ${
                          selectedUniTypes.includes(opt.id) 
                            ? "bg-blue-500 border-blue-500" 
                            : "border-white/20 bg-slate-950/40"
                        }`}>
                          {selectedUniTypes.includes(opt.id) && <Check size={10} className="text-white stroke-[3]" />}
                        </div>
                        <span className="text-xs text-slate-300 flex-1 truncate">{opt.label}</span>
                        {opt.count > 0 && (
                          <span className="text-[10px] text-slate-500 font-mono">({opt.count})</span>
                        )}
                      </label>
                    ))}
                  </div>
                )}
              </div>

              <div className="relative" ref={uniDropdownRef}>
                <div 
                  onClick={() => setShowUniDropdown(!showUniDropdown)}
                  className="w-full bg-slate-950/40 border border-white/5 hover:border-white/10 rounded-xl py-2 px-3 text-xs text-slate-300 cursor-pointer flex items-center justify-between min-h-[38px] truncate"
                >
                  <span className="text-slate-400 truncate">
                    {selectedUniversities.length === 0 ? "Üniversiteler..." : `${selectedUniversities.length} Üni`}
                  </span>
                  <ChevronRight size={14} className={`transform transition-transform text-slate-400 ${showUniDropdown ? "rotate-90" : ""}`} />
                </div>

                {showUniDropdown && (
                  <div className="absolute left-0 right-0 mt-1.5 bg-slate-950 border border-white/10 rounded-xl shadow-2xl z-50 max-h-56 overflow-y-auto custom-scrollbar p-2 space-y-2">
                    <input
                      type="text"
                      placeholder="Üniversite ara..."
                      value={uniQuery}
                      onChange={(e) => setUniQuery(e.target.value)}
                      className="w-full bg-slate-900 border border-white/5 rounded-lg py-1 px-2.5 text-xs text-white focus:outline-none focus:border-blue-500/40"
                    />
                    <div className="space-y-1">
                      {filteredUniOptions.length > 0 ? (
                        filteredUniOptions.map(uni => (
                          <div
                            key={uni}
                            onClick={() => {
                              if (!selectedUniversities.includes(uni)) {
                                setSelectedUniversities(prev => [...prev, uni]);
                              }
                              setUniQuery("");
                              setShowUniDropdown(false);
                            }}
                            className="text-xs text-slate-300 hover:text-white hover:bg-white/5 py-1.5 px-2.5 rounded-lg cursor-pointer transition-colors truncate"
                          >
                            {uni}
                          </div>
                        ))
                      ) : (
                        <div className="text-xs text-slate-500 py-1 text-center">Üniversite bulunamadı</div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* 9. Bölümler & Öğretim Dili Filtresi */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {/* Bölümler */}
            <div className="space-y-1.5">
              <label className="text-xs text-slate-400 font-semibold uppercase tracking-wider">9. Bölümler</label>
              <div className="relative" ref={deptDropdownRef}>
                <div 
                  onClick={() => setShowDeptDropdown(!showDeptDropdown)}
                  className="w-full bg-slate-950/40 border border-white/5 hover:border-white/10 rounded-xl py-2 px-3 text-xs text-slate-300 cursor-pointer flex items-center justify-between min-h-[38px] truncate"
                >
                  <span className="text-slate-400 truncate">
                    {selectedDepartments.length === 0 ? "Bölümler..." : `${selectedDepartments.length} Bölüm`}
                  </span>
                  <ChevronRight size={14} className={`transform transition-transform text-slate-400 ${showDeptDropdown ? "rotate-90" : ""}`} />
                </div>

                {showDeptDropdown && (
                  <div className="absolute left-0 right-0 mt-1.5 bg-slate-950 border border-white/10 rounded-xl shadow-2xl z-50 max-h-56 overflow-y-auto custom-scrollbar p-2 space-y-2">
                    <input
                      type="text"
                      placeholder="Bölüm ara..."
                      value={deptQuery}
                      onChange={(e) => setDeptQuery(e.target.value)}
                      className="w-full bg-slate-900 border border-white/5 rounded-lg py-1 px-2.5 text-xs text-white focus:outline-none focus:border-blue-500/40"
                    />
                    <div className="space-y-1">
                      {filteredDeptOptions.length > 0 ? (
                        filteredDeptOptions.map(dept => (
                          <div
                            key={dept}
                            onClick={() => {
                              if (!selectedDepartments.includes(dept)) {
                                setSelectedDepartments(prev => [...prev, dept]);
                              }
                              setDeptQuery("");
                              setShowDeptDropdown(false);
                            }}
                            className="text-xs text-slate-300 hover:text-white hover:bg-white/5 py-1.5 px-2.5 rounded-lg cursor-pointer transition-colors truncate"
                          >
                            {dept}
                          </div>
                        ))
                      ) : (
                        <div className="text-xs text-slate-500 py-1 text-center">Bölüm bulunamadı</div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Özel Durum */}
            <div className="space-y-1.5">
              <label className="text-xs text-slate-400 font-semibold uppercase tracking-wider">Özel Durum</label>
              <div className="relative" ref={teachingLangDropdownRef}>
                <div 
                  onClick={() => setShowTeachingLangDropdown(!showTeachingLangDropdown)}
                  className="w-full bg-slate-950/40 border border-white/5 hover:border-white/10 rounded-xl py-2 px-3 text-xs text-slate-300 cursor-pointer flex items-center justify-between min-h-[38px] truncate"
                >
                  <span className="text-slate-400 truncate">
                    {selectedTeachingLanguages.length === 0 ? "Özel Durum Seç..." : `${selectedTeachingLanguages.length} Özel Durum`}
                  </span>
                  <ChevronRight size={14} className={`transform transition-transform text-slate-400 ${showTeachingLangDropdown ? "rotate-90" : ""}`} />
                </div>

                {showTeachingLangDropdown && (
                  <div className="absolute left-0 right-0 mt-1.5 bg-slate-950 border border-white/10 rounded-xl shadow-2xl z-50 max-h-56 overflow-y-auto custom-scrollbar p-2 space-y-2">
                    <input
                      type="text"
                      placeholder="Özel Durum ara..."
                      value={teachingLangQuery}
                      onChange={(e) => setTeachingLangQuery(e.target.value)}
                      className="w-full bg-slate-900 border border-white/5 rounded-lg py-1 px-2.5 text-xs text-white focus:outline-none focus:border-blue-500/40"
                    />
                    <div className="space-y-1">
                      {filteredTeachingLangOptions.length > 0 ? (
                        filteredTeachingLangOptions.map(lang => {
                          const isSelected = selectedTeachingLanguages.includes(lang);
                          return (
                            <label
                              key={lang}
                              className="flex items-center gap-2 py-1 px-2 rounded-lg cursor-pointer hover:bg-white/5 transition-colors"
                            >
                              <input
                                type="checkbox"
                                checked={isSelected}
                                onChange={() => {
                                  if (isSelected) {
                                    setSelectedTeachingLanguages(prev => prev.filter(l => l !== lang));
                                  } else {
                                    setSelectedTeachingLanguages(prev => [...prev, lang]);
                                  }
                                }}
                                className="sr-only"
                              />
                              <div className={`w-4 h-4 rounded border flex items-center justify-center transition-colors ${isSelected ? "bg-blue-500 border-blue-500" : "border-white/20 bg-slate-950/40"}`}>
                                {isSelected && <Check size={10} className="text-white stroke-[3]" />}
                              </div>
                              <span className="text-xs text-slate-300 flex-1 truncate">{lang}</span>
                            </label>
                          );
                        })
                      ) : (
                        <div className="text-xs text-slate-500 py-1 text-center">Özel durum bulunamadı</div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

        </div>

        {/* Selected Filter Badges Container */}
        {(selectedRegions.length > 0 || selectedCities.length > 0 || selectedUniversities.length > 0 || selectedDepartments.length > 0 || selectedTeachingLanguages.length > 0 || excludedUniversities.length > 0 || excludedFaculties.length > 0 || excludedCities.length > 0 || excludedDepartments.length > 0 || excludedIds.length > 0 || excludedTeachingTypes.length > 0) && (
          <div className="flex flex-wrap gap-2 pt-4 border-t border-white/5">
            {selectedTeachingLanguages.map(lang => (
              <span 
                key={`lang-${lang}`} 
                className="inline-flex items-center gap-1.5 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-2.5 py-1 rounded-xl text-xs font-semibold"
              >
                Özel Durum: {lang}
                <button onClick={() => setSelectedTeachingLanguages(prev => prev.filter(l => l !== lang))} className="hover:text-white cursor-pointer">
                  <X size={12} />
                </button>
              </span>
            ))}
            {selectedRegions.map(reg => (
              <span 
                key={`reg-${reg}`} 
                className="inline-flex items-center gap-1.5 bg-blue-500/10 text-blue-400 border border-blue-500/20 px-2.5 py-1 rounded-xl text-xs font-semibold"
              >
                Bölge: {reg}
                <button onClick={() => toggleRegion(reg)} className="hover:text-white cursor-pointer">
                  <X size={12} />
                </button>
              </span>
            ))}
            {selectedCities.map(city => (
              <span 
                key={`city-${city}`} 
                className="inline-flex items-center gap-1.5 bg-sky-500/10 text-sky-400 border border-sky-500/20 px-2.5 py-1 rounded-xl text-xs font-semibold"
              >
                Şehir: {city}
                <button onClick={() => removeCity(city)} className="hover:text-white cursor-pointer">
                  <X size={12} />
                </button>
              </span>
            ))}
            {selectedUniversities.map(uni => (
              <span 
                key={`uni-${uni}`} 
                className="inline-flex items-center gap-1.5 bg-purple-500/10 text-purple-400 border border-purple-500/20 px-2.5 py-1 rounded-xl text-xs font-semibold truncate max-w-xs"
              >
                Üniversite: {uni}
                <button onClick={() => removeUniversity(uni)} className="hover:text-white cursor-pointer shrink-0">
                  <X size={12} />
                </button>
              </span>
            ))}
            {selectedDepartments.map(dept => (
              <span 
                key={`dept-${dept}`} 
                className="inline-flex items-center gap-1.5 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-2.5 py-1 rounded-xl text-xs font-semibold truncate max-w-xs"
              >
                Bölüm: {dept}
                <button onClick={() => removeDepartment(dept)} className="hover:text-white cursor-pointer shrink-0">
                  <X size={12} />
                </button>
              </span>
            ))}

            {/* Excluded items Group Buttons */}
            {excludedIds.length > 0 && (
              <button
                onClick={() => setExcludedIds([])}
                className="inline-flex items-center gap-1.5 bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 border border-rose-500/40 px-3 py-1 rounded-xl text-xs font-bold transition-all cursor-pointer shadow-sm active:scale-95"
                title="Çıkarılan tüm kayıtları geri eklemek için tıklayın"
              >
                Çıkarılan Kayıtlar ({excludedIds.length})
                <X size={13} className="text-rose-400" />
              </button>
            )}
            {excludedCities.length > 0 && (
              <button
                onClick={() => setExcludedCities([])}
                className="inline-flex items-center gap-1.5 bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 border border-rose-500/40 px-3 py-1 rounded-xl text-xs font-bold transition-all cursor-pointer shadow-sm active:scale-95"
                title="Çıkarılan tüm şehirleri geri eklemek için tıklayın"
              >
                Çıkarılan Şehirler ({excludedCities.length})
                <X size={13} className="text-rose-400" />
              </button>
            )}
            {excludedDepartments.length > 0 && (
              <button
                onClick={() => setExcludedDepartments([])}
                className="inline-flex items-center gap-1.5 bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 border border-rose-500/40 px-3 py-1 rounded-xl text-xs font-bold transition-all cursor-pointer shadow-sm active:scale-95"
                title="Çıkarılan tüm bölümleri geri eklemek için tıklayın"
              >
                Çıkarılan Bölümler ({excludedDepartments.length})
                <X size={13} className="text-rose-400" />
              </button>
            )}
            {excludedUniversities.length > 0 && (
              <button
                onClick={() => setExcludedUniversities([])}
                className="inline-flex items-center gap-1.5 bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 border border-rose-500/40 px-3 py-1 rounded-xl text-xs font-bold transition-all cursor-pointer shadow-sm active:scale-95"
                title="Çıkarılan tüm üniversiteleri geri eklemek için tıklayın"
              >
                Çıkarılan Üniversiteler ({excludedUniversities.length})
                <X size={13} className="text-rose-400" />
              </button>
            )}
            {excludedFaculties.length > 0 && (
              <button
                onClick={() => setExcludedFaculties([])}
                className="inline-flex items-center gap-1.5 bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 border border-rose-500/40 px-3 py-1 rounded-xl text-xs font-bold transition-all cursor-pointer shadow-sm active:scale-95"
                title="Çıkarılan tüm fakülteleri geri eklemek için tıklayın"
              >
                Çıkarılan Fakülteler ({excludedFaculties.length})
                <X size={13} className="text-rose-400" />
              </button>
            )}
            {excludedTeachingTypes.length > 0 && (
              <button
                onClick={() => setExcludedTeachingTypes([])}
                className="inline-flex items-center gap-1.5 bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 border border-rose-500/40 px-3 py-1 rounded-xl text-xs font-bold transition-all cursor-pointer shadow-sm active:scale-95"
                title="Çıkarılan tüm özel durumları geri eklemek için tıklayın"
              >
                Çıkarılan Özel Durumlar ({excludedTeachingTypes.length})
                <X size={13} className="text-rose-400" />
              </button>
            )}

            {/* Individual Excluded Item Chips */}
            {excludedCities.map(c => (
              <span 
                key={`ex-city-${c}`} 
                className="inline-flex items-center gap-1.5 bg-rose-500/10 text-rose-400 border border-rose-500/20 px-2.5 py-1 rounded-xl text-xs font-semibold truncate max-w-xs"
                title="Yeniden dahil etmek için tıklayın"
              >
                Çıkarılan Şehir: {c}
                <button 
                  onClick={() => setExcludedCities(prev => prev.filter(x => x !== c))} 
                  className="hover:text-white cursor-pointer shrink-0"
                >
                  <X size={12} />
                </button>
              </span>
            ))}
            {excludedDepartments.map(dept => (
              <span 
                key={`ex-dept-${dept}`} 
                className="inline-flex items-center gap-1.5 bg-rose-500/10 text-rose-400 border border-rose-500/20 px-2.5 py-1 rounded-xl text-xs font-semibold truncate max-w-xs"
                title="Yeniden dahil etmek için tıklayın"
              >
                Çıkarılan Bölüm: {dept}
                <button 
                  onClick={() => setExcludedDepartments(prev => prev.filter(x => x !== dept))} 
                  className="hover:text-white cursor-pointer shrink-0"
                >
                  <X size={12} />
                </button>
              </span>
            ))}

            {/* Individual Excluded Item Chips */}
            {excludedUniversities.map(uni => (
              <span 
                key={`ex-uni-${uni}`} 
                className="inline-flex items-center gap-1.5 bg-rose-500/10 text-rose-400 border border-rose-500/20 px-2.5 py-1 rounded-xl text-xs font-semibold truncate max-w-xs"
                title="Yeniden dahil etmek için tıklayın"
              >
                Çıkarılan Üniversite: {uni}
                <button 
                  onClick={() => setExcludedUniversities(prev => prev.filter(u => u !== uni))} 
                  className="hover:text-white cursor-pointer shrink-0"
                >
                  <X size={12} />
                </button>
              </span>
            ))}
            {excludedFaculties.map(fac => (
              <span 
                key={`ex-fac-${fac}`} 
                className="inline-flex items-center gap-1.5 bg-rose-500/10 text-rose-400 border border-rose-500/20 px-2.5 py-1 rounded-xl text-xs font-semibold truncate max-w-xs"
                title="Yeniden dahil etmek için tıklayın"
              >
                Çıkarılan Fakülte: {fac}
                <button 
                  onClick={() => setExcludedFaculties(prev => prev.filter(f => f !== fac))} 
                  className="hover:text-white cursor-pointer shrink-0"
                >
                  <X size={12} />
                </button>
              </span>
            ))}
            {excludedTeachingTypes.map(type => (
              <span 
                key={`ex-type-${type}`} 
                className="inline-flex items-center gap-1.5 bg-rose-500/10 text-rose-400 border border-rose-500/20 px-2.5 py-1 rounded-xl text-xs font-semibold truncate max-w-xs"
                title="Yeniden dahil etmek için tıklayın"
              >
                Çıkarılan Özel Durum: {type}
                <button 
                  onClick={() => setExcludedTeachingTypes(prev => prev.filter(t => t !== type))} 
                  className="hover:text-white cursor-pointer shrink-0"
                >
                  <X size={12} />
                </button>
              </span>
            ))}
          </div>
        )}

        {/* Search Bar / Action Button Row */}
        <div className="flex flex-col sm:flex-row gap-4 pt-4 border-t border-white/5 items-center">
          <div className="relative flex-1 w-full">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Üniversite, fakülte veya kelime ile ara..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter") handleFetchResults(); }}
              className="w-full bg-slate-950/40 border border-white/5 hover:border-white/10 rounded-xl py-2.5 pl-10 pr-4 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-blue-500/50 transition-colors"
            />
          </div>

          <button
            onClick={handleFetchResults}
            disabled={loading}
            className="w-full sm:w-auto bg-blue-600 hover:bg-blue-500 disabled:bg-blue-800 text-white font-bold py-2.5 px-6 rounded-xl text-xs flex items-center justify-center gap-2 transition-all shadow-lg shadow-blue-600/20 cursor-pointer min-h-[40px]"
          >
            {loading ? (
              <>
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                Sorgulanıyor...
              </>
            ) : (
              <>
                <Search className="w-3.5 h-3.5" />
                Sonuçları Getir / Ara
              </>
            )}
          </button>
        </div>
      </div>

      {/* RESULTS LIST - FULL WIDTH */}
      <div className="w-full space-y-4">
        
        {/* 2026 TAHMİNİ VERİ & SORUMLULUK REDDİ BİLDİRİMİ */}
        <div className="bg-amber-500/10 border border-amber-500/30 rounded-2xl p-3.5 sm:p-4 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 text-amber-300 shadow-lg">
          <div className="flex items-start gap-3 flex-1">
            <div className="p-2 bg-amber-500/20 rounded-xl text-amber-300 border border-amber-500/30 shrink-0 mt-0.5">
              <AlertTriangle className="w-5 h-5 text-amber-300" />
            </div>
            <div className="space-y-1 text-xs sm:text-sm">
              <div className="flex items-center gap-2 font-bold text-amber-300 tracking-wide">
                <span>2026 Tahmini Sıralama & Sorumluluk Reddi Bildirimi</span>
                <span className="px-2 py-0.5 rounded text-[10px] font-extrabold bg-amber-500/20 text-amber-300 border border-amber-500/30">
                  2026*
                </span>
              </div>
              <p className="text-amber-300/90 leading-relaxed text-[11px] sm:text-xs">
                Sistemde gösterilen <strong>2026 yılı kontenjanları gerçek ve güncel verilerdir</strong>. 2026 yılına ait <strong>başarı sıralaması verileri</strong> ise geçmiş yılların yerleşme eğilimleri ve kontenjan değişimleri dikkate alınarak matematiksel algoritmalarla hesaplanmış <strong>tahmini (*)</strong> değerlerdir. Tercih sürecinde verilecek nihai kararlar ve doğabilecek tüm sonuçlara ilişkin <strong>sorumluluk aday ve kullanıcıya aittir</strong>. FocusON Akademi bu tahminlerden doğabilecek herhangi bir hak kaybı veya sorumluluk kabul etmez.
              </p>
            </div>
          </div>

          {/* 2026 Tahminlerini Aç Switch */}
          <div className="flex items-center gap-2.5 shrink-0 bg-amber-500/20 border border-amber-500/30 px-3.5 py-2 rounded-xl text-xs font-bold text-amber-200 self-end md:self-center">
            <span>2026 Tahminlerini Aç</span>
            <button
              type="button"
              onClick={() => setShow2026Estimate(!show2026Estimate)}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none cursor-pointer ${
                show2026Estimate ? "bg-amber-500" : "bg-slate-800 border border-amber-500/30"
              }`}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                  show2026Estimate ? "translate-x-6" : "translate-x-1"
                }`}
              />
            </button>
          </div>
        </div>

        {/* Results Metadata Panel */}
        <div className="bg-slate-900/40 border border-white/5 rounded-2xl p-4 flex flex-col lg:flex-row items-center justify-between gap-3 text-sm">
          <div className="flex flex-wrap items-center gap-3 text-slate-400">
            <div className="flex items-center gap-2">
              <Database className="w-4 h-4 text-blue-400" />
              <span className="font-semibold text-slate-300">Arama Sonuçları:</span>
              <strong className="text-blue-400">{allFilteredData.length} program</strong>
            </div>
          </div>

          {/* Action Buttons: Bölümler, Sepet, Tercih Listem, Yazdır */}
          <div className="flex items-center gap-2 flex-wrap w-full lg:w-auto justify-end">
            
            {/* BÖLÜMLER BUTONU */}
            <button
              onClick={() => setShowDeptStatsModal(true)}
              className="px-3.5 py-2 bg-indigo-600/20 hover:bg-indigo-600/30 border border-indigo-500/30 text-indigo-300 hover:text-white rounded-xl text-xs font-bold flex items-center gap-2 transition-all cursor-pointer shadow-sm"
              title="Filtrelere uyan tüm bölümleri ve dağılımlarını incele"
            >
              <Layers className="w-4 h-4 text-indigo-400" />
              Bölümler
              {excludedDepartments.length > 0 && (
                <span className="px-1.5 py-0.5 bg-rose-500 text-white rounded-full text-[10px] font-extrabold">
                  -{excludedDepartments.length}
                </span>
              )}
            </button>

            {/* ŞEHİRLER BUTONU */}
            <button
              onClick={() => setShowCityStatsModal(true)}
              className="px-3.5 py-2 bg-indigo-600/20 hover:bg-indigo-600/30 border border-indigo-500/30 text-indigo-300 hover:text-white rounded-xl text-xs font-bold flex items-center gap-2 transition-all cursor-pointer shadow-sm"
              title="Filtrelere uyan tüm şehirleri ve dağılımlarını incele"
            >
              <Building2 className="w-4 h-4 text-indigo-400" />
              Şehirler
              {excludedCities.length > 0 && (
                <span className="px-1.5 py-0.5 bg-rose-500 text-white rounded-full text-[10px] font-extrabold">
                  -{excludedCities.length}
                </span>
              )}
            </button>
            {/* SEÇİLENLERİ LİSTEDEN ÇIKAR */}
            {selectedDeptIds.length > 0 && (
              <button
                onClick={() => {
                  setExcludedIds(prev => Array.from(new Set([...prev, ...selectedDeptIds])));
                  setSelectedDeptIds([]);
                }}
                className="px-3.5 py-2 bg-rose-600/20 hover:bg-rose-600/30 border border-rose-500/30 text-rose-300 hover:text-white rounded-xl text-xs font-bold flex items-center gap-2 transition-all cursor-pointer shadow-sm"
              >
                <X className="w-4 h-4" />
                Seçilenleri Çıkar ({selectedDeptIds.length})
              </button>
            )}
            
            {/* SEÇİLENLERİ SEPETE EKLE */}
            {selectedDeptIds.length > 0 && (
              <button
                onClick={() => {
                  const selectedItems = allFilteredData.filter(d => selectedDeptIds.includes(d.id));
                  selectedItems.forEach(item => {
                    if (!basketList.some(b => b.id === item.id)) {
                      setBasketList(prev => [...prev, item]);
                    }
                  });
                  setSelectedDeptIds([]);
                }}
                className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold flex items-center gap-2 transition-all cursor-pointer shadow-md shadow-emerald-600/20"
              >
                <Plus className="w-4 h-4" />
                Seçilenleri Sepete Ekle ({selectedDeptIds.length})
              </button>
            )}

            {/* TERCİH SEPETİ */}
            <button
              onClick={() => {
                setBasketModalTab("basket");
                setShowBasketModal(true);
              }}
              className="px-3.5 py-2 bg-slate-800 hover:bg-slate-700 border border-white/10 text-slate-200 rounded-xl text-xs font-bold flex items-center gap-2 transition-all cursor-pointer"
            >
              <ShoppingBag className="w-4 h-4 text-blue-400" />
              Tercih Sepeti
              <span className="px-2 py-0.5 bg-blue-500/20 text-blue-400 border border-blue-500/30 rounded-full text-[10px] font-extrabold">
                {basketList.length}
              </span>
            </button>

            {/* TERCİH LİSTEM (24 SLOT) */}
            <button
              onClick={() => {
                setBasketModalTab("list");
                setShowBasketModal(true);
              }}
              className="px-3.5 py-2 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-xl text-xs flex items-center gap-2 shadow-lg shadow-blue-600/20 transition-all cursor-pointer"
            >
              <ListOrdered className="w-4 h-4" />
              Tercih Listem
              <span className="px-2 py-0.5 bg-white/20 text-white rounded-full text-[10px] font-extrabold">
                {preferenceList.filter(Boolean).length}/24
              </span>
            </button>

            {/* YAZDIR / PDF */}
            <button
              onClick={() => {
                setPrintViewSource("list");
                setShowPrintView(true);
              }}
              className="px-3 py-2 bg-slate-800 hover:bg-slate-700 border border-white/10 text-slate-300 hover:text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer"
              title="Tercih Listesini Yazdır / PDF İndir"
            >
              <Printer className="w-4 h-4 text-emerald-400" />
              <span className="hidden sm:inline">Yazdır / PDF</span>
            </button>

          </div>
        </div>

        {/* Results Table Container */}
        <div className="bg-slate-900/50 backdrop-blur-md border border-white/5 rounded-2xl overflow-hidden shadow-xl min-h-[400px] flex flex-col justify-between">
          <div className="overflow-x-auto custom-scrollbar">
            <table className="w-full text-left border-collapse whitespace-nowrap min-w-[1200px]">
              <thead className="bg-slate-950/85 sticky top-0 z-10 backdrop-blur-md">
                {/* Header Row 1: Titles */}
                <tr className="border-b border-white/10">
                  <th className="py-3 px-3 text-center text-xs font-bold text-slate-300 uppercase tracking-wider w-12">
                    Seç
                  </th>
                  <th className="py-3 px-4 text-xs font-bold text-slate-300 uppercase tracking-wider w-28 cursor-pointer hover:text-white transition-colors" onClick={() => toggleSort("yop")}>
                    <div className="flex items-center gap-1">
                      YÖP
                      <ArrowUpDown size={12} className={sortField === "yop" ? "text-blue-400" : "text-slate-500"} />
                    </div>
                  </th>
                  <th className="py-3 px-4 text-xs font-bold text-slate-300 uppercase tracking-wider min-w-[240px] cursor-pointer hover:text-white transition-colors" onClick={() => toggleSort("university")}>
                    <div className="flex items-center gap-1">
                      Üniversite
                      <ArrowUpDown size={12} className={sortField === "university" ? "text-blue-400" : "text-slate-500"} />
                    </div>
                  </th>
                  <th className="py-3 px-4 text-xs font-bold text-slate-300 uppercase tracking-wider min-w-[220px] cursor-pointer hover:text-white transition-colors" onClick={() => toggleSort("name")}>
                    <div className="flex items-center gap-1">
                      Bölüm
                      <ArrowUpDown size={12} className={sortField === "name" ? "text-blue-400" : "text-slate-500"} />
                    </div>
                  </th>
                  <th className="py-3 px-4 text-xs font-bold text-slate-300 uppercase tracking-wider w-24 cursor-pointer hover:text-white transition-colors" onClick={() => toggleSort("city")}>
                    <div className="flex items-center gap-1">
                      Şehir
                      <ArrowUpDown size={12} className={sortField === "city" ? "text-blue-400" : "text-slate-500"} />
                    </div>
                  </th>
                  <th className="py-3 px-4 text-xs font-bold text-slate-300 uppercase tracking-wider w-24 cursor-pointer hover:text-white transition-colors" onClick={() => toggleSort("type")}>
                    <div className="flex items-center gap-1">
                      Üni.Türü
                      <ArrowUpDown size={12} className={sortField === "type" ? "text-blue-400" : "text-slate-500"} />
                    </div>
                  </th>
                  <th className="py-3 px-3 text-center text-xs font-bold text-slate-300 uppercase tracking-wider w-20 cursor-pointer hover:text-white transition-colors" onClick={() => toggleSort("pointName")}>
                    <div className="flex items-center justify-center gap-1">
                      Tür
                      <ArrowUpDown size={12} className={sortField === "pointName" ? "text-blue-400" : "text-slate-500"} />
                    </div>
                  </th>
                  <th className="py-3 px-3 text-center text-xs font-bold text-slate-300 uppercase tracking-wider w-32 cursor-pointer hover:text-white transition-colors" onClick={() => toggleSort("quota")}>
                    <div className="flex items-center justify-center gap-1">
                      Kontenjan
                      <ArrowUpDown size={12} className={sortField === "quota" ? "text-blue-400" : "text-slate-500"} />
                    </div>
                  </th>
                  <th className="py-3 px-3 text-center text-xs font-bold text-slate-300 uppercase tracking-wider w-32 cursor-pointer hover:text-white transition-colors" onClick={() => toggleSort("settled")}>
                    <div className="flex items-center justify-center gap-1">
                      Yerleşen
                      <ArrowUpDown size={12} className={sortField === "settled" ? "text-blue-400" : "text-slate-500"} />
                    </div>
                  </th>
                  <th className="py-3 px-3 text-center text-xs font-bold text-slate-300 uppercase tracking-wider w-32 cursor-pointer hover:text-white transition-colors" onClick={() => toggleSort("rank")}>
                    <div className="flex items-center justify-center gap-1">
                      Başarı Sırası
                      <ArrowUpDown size={12} className={sortField === "rank" ? "text-blue-400" : "text-slate-500"} />
                    </div>
                  </th>
                  <th className="py-3 px-3 text-center text-xs font-bold text-slate-300 uppercase tracking-wider w-32 cursor-pointer hover:text-white transition-colors" onClick={() => toggleSort("point")}>
                    <div className="flex items-center justify-center gap-1">
                      Taban Puan
                      <ArrowUpDown size={12} className={sortField === "point" ? "text-blue-400" : "text-slate-500"} />
                    </div>
                  </th>
                  <th className="py-3 px-3 text-center text-xs font-bold text-slate-300 uppercase tracking-wider w-16 cursor-pointer hover:text-white transition-colors" onClick={() => toggleSort("duration")}>
                    <div className="flex items-center justify-center gap-1">
                      Yıl
                      <ArrowUpDown size={11} className={sortField === "duration" ? "text-blue-400" : "text-slate-500"} />
                    </div>
                  </th>
                  <th className="py-3 px-4 text-right text-xs font-bold text-slate-300 uppercase tracking-wider w-36 cursor-pointer hover:text-white transition-colors" onClick={() => toggleSort("fee")}>
                    <div className="flex items-center justify-end gap-1">
                      Ücret (KDV Dahil)
                      <ArrowUpDown size={12} className={sortField === "fee" ? "text-blue-400" : "text-slate-500"} />
                    </div>
                  </th>
                </tr>

                {/* Header Row 2: Live Filters & Year Badges */}
                <tr className="bg-slate-950/60 border-b border-white/5">
                  {/* Select All Checkbox */}
                  <td className="py-2 px-3 text-center">
                    <label className="flex items-center justify-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={departments.length > 0 && departments.every(d => selectedDeptIds.includes(d.id))}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setSelectedDeptIds(prev => {
                              const newIds = [...prev];
                              departments.forEach(d => {
                                if (!newIds.includes(d.id)) newIds.push(d.id);
                              });
                              return newIds;
                            });
                          } else {
                            setSelectedDeptIds(prev => prev.filter(id => !departments.some(d => d.id === id)));
                          }
                        }}
                        className="sr-only"
                      />
                      <div className={`w-4.5 h-4.5 rounded-lg border flex items-center justify-center transition-all ${
                        departments.length > 0 && departments.every(d => selectedDeptIds.includes(d.id))
                          ? "bg-blue-600 border-blue-500 shadow-sm shadow-blue-600/10"
                          : "border-white/10 hover:border-white/30 bg-slate-900"
                      }`}>
                        {departments.length > 0 && departments.every(d => selectedDeptIds.includes(d.id)) && <Check size={11} className="text-white stroke-[3]" />}
                      </div>
                    </label>
                  </td>

                  {/* YÖP Search Input */}
                  <td className="py-2 px-2">
                    <input
                      type="text"
                      placeholder="YÖP"
                      value={yopFilter}
                      onChange={(e) => setYopFilter(e.target.value)}
                      className="w-full bg-slate-900/80 border border-white/10 hover:border-white/25 rounded-xl px-2.5 py-1 text-[11px] text-white focus:outline-none focus:border-blue-500/50 placeholder-slate-600 min-h-[32px] font-mono shadow-inner"
                    />
                  </td>

                  {/* Üniversite Filter */}
                  <td className="py-2 px-2">
                    <input
                      type="text"
                      placeholder="Üniversite ara"
                      value={uniFilter}
                      onChange={(e) => setUniFilter(e.target.value)}
                      className="w-full bg-slate-900/80 border border-white/10 hover:border-white/25 rounded-xl px-3 py-1 text-[11px] text-white focus:outline-none focus:border-blue-500/50 placeholder-slate-600 min-h-[32px] shadow-inner"
                    />
                  </td>

                  {/* Bölüm Filter */}
                  <td className="py-2 px-2">
                    <input
                      type="text"
                      placeholder="Bölüm ara"
                      value={deptFilter}
                      onChange={(e) => setDeptFilter(e.target.value)}
                      className="w-full bg-slate-900/80 border border-white/10 hover:border-white/25 rounded-xl px-3 py-1 text-[11px] text-white focus:outline-none focus:border-blue-500/50 placeholder-slate-600 min-h-[32px] shadow-inner"
                    />
                  </td>

                  {/* Şehir Filter */}
                  <td className="py-2 px-2">
                    <input
                      type="text"
                      placeholder="Şehir ara"
                      value={cityFilter}
                      onChange={(e) => setCityFilter(e.target.value)}
                      className="w-full bg-slate-900/80 border border-white/10 hover:border-white/25 rounded-xl px-2.5 py-1 text-[11px] text-white focus:outline-none focus:border-blue-500/50 placeholder-slate-600 min-h-[32px] shadow-inner"
                    />
                  </td>

                  {/* Empty cells for columns with no filters */}
                  <td className="py-2 px-2"></td>
                  <td className="py-2 px-2"></td>

                  {/* Dynamic Year badges for Kontenjan */}
                  <td className="py-1 px-1">
                    <div className="flex flex-wrap gap-1 justify-center items-center py-1 max-w-[120px] mx-auto select-none">
                      {availableYears.map(yr => (
                        <span 
                          key={`hdr-q-${yr}`} 
                          className={`px-1.5 py-0.5 rounded text-[9px] font-extrabold border shadow-sm leading-none ${
                            yr === "2026" ? "bg-amber-500/20 text-amber-300 border-amber-500/30" :
                            yr === "2025" ? "bg-red-500/20 text-red-400 border-red-500/20" :
                            yr === "2024" ? "bg-teal-500/20 text-teal-400 border-teal-500/20" :
                            yr === "2023" ? "bg-fuchsia-500/20 text-fuchsia-400 border-fuchsia-500/20" :
                            "bg-blue-500/20 text-blue-400 border-blue-500/20"
                          }`}
                        >
                          {yr}{yr === "2026" ? "*" : ""}
                        </span>
                      ))}
                    </div>
                  </td>

                  {/* Dynamic Year badges for Yerleşen */}
                  <td className="py-1 px-1">
                    <div className="flex flex-wrap gap-1 justify-center items-center py-1 max-w-[120px] mx-auto select-none">
                      {availableYears.map(yr => (
                        <span 
                          key={`hdr-s-${yr}`} 
                          className={`px-1.5 py-0.5 rounded text-[9px] font-extrabold border shadow-sm leading-none ${
                            yr === "2026" ? "bg-amber-500/20 text-amber-300 border-amber-500/30" :
                            yr === "2025" ? "bg-red-500/20 text-red-400 border-red-500/20" :
                            yr === "2024" ? "bg-teal-500/20 text-teal-400 border-teal-500/20" :
                            yr === "2023" ? "bg-fuchsia-500/20 text-fuchsia-400 border-fuchsia-500/20" :
                            "bg-blue-500/20 text-blue-400 border-blue-500/20"
                          }`}
                        >
                          {yr}{yr === "2026" ? "*" : ""}
                        </span>
                      ))}
                    </div>
                  </td>

                  {/* Dynamic Year badges for Başarı Sırası */}
                  <td className="py-1 px-1">
                    <div className="flex flex-wrap gap-1 justify-center items-center py-1 max-w-[120px] mx-auto select-none">
                      {availableYears.map(yr => (
                        <span 
                          key={`hdr-r-${yr}`} 
                          className={`px-1.5 py-0.5 rounded text-[9px] font-extrabold border shadow-sm leading-none ${
                            yr === "2026" ? "bg-amber-500/20 text-amber-300 border-amber-500/30" :
                            yr === "2025" ? "bg-red-500/20 text-red-400 border-red-500/20" :
                            yr === "2024" ? "bg-teal-500/20 text-teal-400 border-teal-500/20" :
                            yr === "2023" ? "bg-fuchsia-500/20 text-fuchsia-400 border-fuchsia-500/20" :
                            "bg-blue-500/20 text-blue-400 border-blue-500/20"
                          }`}
                        >
                          {yr}{yr === "2026" ? "*" : ""}
                        </span>
                      ))}
                    </div>
                  </td>

                  {/* Dynamic Year badges for Taban Puan */}
                  <td className="py-1 px-1">
                    <div className="flex flex-wrap gap-1 justify-center items-center py-1 max-w-[120px] mx-auto select-none">
                      {availableYears.map(yr => (
                        <span 
                          key={`hdr-p-${yr}`} 
                          className={`px-1.5 py-0.5 rounded text-[9px] font-extrabold border shadow-sm leading-none ${
                            yr === "2026" ? "bg-amber-500/20 text-amber-300 border-amber-500/30" :
                            yr === "2025" ? "bg-red-500/20 text-red-400 border-red-500/20" :
                            yr === "2024" ? "bg-teal-500/20 text-teal-400 border-teal-500/20" :
                            yr === "2023" ? "bg-fuchsia-500/20 text-fuchsia-400 border-fuchsia-500/20" :
                            "bg-blue-500/20 text-blue-400 border-blue-500/20"
                          }`}
                        >
                          {yr}{yr === "2026" ? "*" : ""}
                        </span>
                      ))}
                    </div>
                  </td>

                  {/* Empty cells */}
                  <td className="py-2 px-2"></td>
                  <td className="py-2 px-2"></td>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5 text-sm bg-slate-900/20">
                {loading ? (
                  Array.from({ length: 5 }).map((_, i) => (
                    <tr key={`sk-${i}`} className="animate-pulse">
                      <td className="py-5 px-3 text-center">
                        <div className="w-5 h-5 rounded-lg bg-white/5 mx-auto" />
                      </td>
                      <td className="py-5 px-4">
                        <div className="h-4 bg-white/5 rounded w-20" />
                      </td>
                      <td className="py-5 px-4">
                        <div className="h-4 bg-white/5 rounded w-48 mb-2" />
                        <div className="h-3 bg-white/5 rounded w-32" />
                      </td>
                      <td className="py-5 px-4">
                        <div className="h-4 bg-white/5 rounded w-40 mb-2" />
                        <div className="h-3 bg-white/5 rounded w-20" />
                      </td>
                      <td className="py-5 px-4">
                        <div className="h-4 bg-white/5 rounded w-16" />
                      </td>
                      <td className="py-5 px-4">
                        <div className="h-4 bg-white/5 rounded w-16" />
                      </td>
                      <td className="py-5 px-3 text-center">
                        <div className="h-5 bg-white/5 rounded w-10 mx-auto" />
                      </td>
                      <td className="py-5 px-3">
                        <div className="h-32 bg-white/5 rounded w-24 mx-auto" />
                      </td>
                      <td className="py-5 px-3">
                        <div className="h-32 bg-white/5 rounded w-24 mx-auto" />
                      </td>
                      <td className="py-5 px-3">
                        <div className="h-32 bg-white/5 rounded w-24 mx-auto" />
                      </td>
                      <td className="py-5 px-3">
                        <div className="h-32 bg-white/5 rounded w-24 mx-auto" />
                      </td>
                      <td className="py-5 px-3">
                        <div className="h-8 bg-white/5 rounded w-12 mx-auto" />
                      </td>
                      <td className="py-5 px-3">
                        <div className="h-4 bg-white/5 rounded w-6 mx-auto" />
                      </td>
                      <td className="py-5 px-4 text-right">
                        <div className="h-4 bg-white/5 rounded w-20 ml-auto" />
                      </td>
                    </tr>
                  ))
                ) : departments.length > 0 ? (
                  departments.map((dept) => {
                    const renderVerticalBox = (field: "quota" | "rank" | "point" | "settled") => {
                      const values = getYearlyValues(dept, field);
                      const years = availableYears;
                      
                      const getLineColor = (valObj: any, idx: number, yearStr: string) => {
                        if (valObj === undefined || valObj === null || valObj === "---") return "text-slate-600";
                        if (yearStr === "2026") return "text-amber-300 font-extrabold";
                        if (field === "point") return "text-emerald-400 font-bold";
                        if (field === "rank") return idx === 0 || (years[0] === "2026" && idx === 1) ? "text-rose-400 font-bold" : "text-slate-200";
                        return idx === 0 ? "text-slate-200" : "text-slate-400";
                      };

                      const getUnit = () => {
                        if (field === "point") return "Puan";
                        if (field === "rank") return "Sıra";
                        if (field === "quota") return "Kont.";
                        return "Yer.";
                      };

                      const formatVal = (valObj: any) => {
                        if (valObj === undefined || valObj === null) return "---";
                        if (typeof valObj === "object" && valObj.isEstimated) {
                          return `~${valObj.val.toLocaleString('tr-TR')}`;
                        }
                        const val = typeof valObj === "object" ? valObj.val : valObj;
                        if (field === "point" && typeof val === "number") return val.toFixed(2);
                        if (field === "rank" && typeof val === "number") return val.toLocaleString('tr-TR');
                        return val;
                      };

                      return (
                        <div className="bg-slate-950/40 border border-white/5 hover:border-white/10 rounded-2xl p-2 flex flex-col items-center justify-between min-h-[160px] w-[112px] text-center transition-all group/box shadow-lg">
                          <div className="flex flex-col gap-0.5 w-full">
                            {values.map((valObj, idx) => {
                              const yearStr = years[idx];
                              const isEst = typeof valObj === "object" && valObj?.isEstimated;
                              const estDetails = typeof valObj === "object" ? valObj?.details : null;

                              return (
                                <div 
                                  key={yearStr} 
                                  className={`text-[11px] font-mono py-0.5 border-b border-white/[0.02] last:border-0 flex items-center justify-between px-1 ${getLineColor(valObj, idx, yearStr)}`}
                                  title={
                                    isEst && estDetails 
                                      ? estDetails.explanation 
                                      : `${yearStr} Yılı ${field === "quota" ? "Kontenjanı" : field === "rank" ? "Başarı Sıralaması" : field === "point" ? "Taban Puanı" : "Yerleşen Sayısı"}`
                                  }
                                >
                                  <span className={`text-[9px] font-bold select-none flex items-center gap-0.5 ${yearStr === "2026" ? "text-amber-400" : "text-slate-500"}`}>
                                    {yearStr}{yearStr === "2026" && isEst ? "*" : ""}:
                                  </span>
                                  <span className={`truncate text-right ${isEst ? "text-amber-300 font-extrabold flex items-center justify-end gap-0.5" : ""}`}>
                                    {formatVal(valObj)}
                                    {isEst && <Sparkles size={8} className="text-amber-400 shrink-0" />}
                                  </span>
                                </div>
                              );
                            })}
                          </div>
                          
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setActiveChartData({
                                title: field === "point" ? "Taban Puan" :
                                       field === "rank" ? "Başarı Sırası" :
                                       field === "quota" ? "Kontenjan" : "Yerleşen Sayısı",
                                labels: years,
                                values: values.map(v => {
                                  if (v === undefined || v === null) return 0;
                                  if (typeof v === "object") return v.val ?? 0;
                                  return typeof v === "number" ? v : 0;
                                }),
                                unit: getUnit()
                              });
                            }}
                            className="mt-1.5 w-full py-1 bg-blue-500/10 hover:bg-blue-500/20 text-blue-400 border border-blue-500/20 rounded-lg text-[9px] font-bold flex items-center justify-center gap-1 transition-all cursor-pointer shadow-sm select-none"
                          >
                            <BarChart2 size={9} />
                            Grafik
                          </button>
                        </div>
                      );
                    };

                    const facultyName = dept.facultyName || dept.fullName?.replace(dept.universityName || dept.university?.name || "", "").replace(dept.name || "", "").trim() || "Fakülte Bilgisi bulunmuyor";

                    return (
                      <tr 
                        key={dept.id}
                        className="hover:bg-white/[0.02] transition-colors group border-b border-white/5"
                      >
                        {/* Checkbox */}
                        <td className="py-4 px-3 text-center">
                          <label className="flex items-center justify-center cursor-pointer">
                            <input
                              type="checkbox"
                              checked={selectedDeptIds.includes(dept.id)}
                              onChange={() => {
                                setSelectedDeptIds(prev => 
                                  prev.includes(dept.id) ? prev.filter(id => id !== dept.id) : [...prev, dept.id]
                                );
                              }}
                              className="sr-only"
                            />
                            <div className={`w-5 h-5 rounded-lg border flex items-center justify-center transition-all ${
                              selectedDeptIds.includes(dept.id) 
                                ? "bg-blue-600 border-blue-500 shadow-md shadow-blue-600/20" 
                                : "border-white/10 hover:border-white/30 bg-slate-950/40"
                            }`}>
                              {selectedDeptIds.includes(dept.id) && <Check size={11} className="text-white stroke-[3]" />}
                            </div>
                          </label>
                        </td>

                        {/* YÖP Code */}
                        <td className="py-4 px-4 text-slate-300 font-mono text-xs">
                          <a 
                            href={`https://yokatlas.yok.gov.tr/detay/${dept.departmentCode || dept.id}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-blue-400 hover:text-blue-300 hover:underline transition-colors font-semibold flex items-center gap-1 cursor-pointer"
                            title="YÖK Atlas Detay Sayfasına Git"
                          >
                            {dept.departmentCode || dept.depId || dept.departmentId || dept.id || "---"}
                          </a>
                        </td>

                        {/* Üniversite Adı */}
                        <td className="py-4 px-4">
                          <div className="flex flex-col gap-1 max-w-xs md:max-w-sm whitespace-normal">
                            <span className="font-extrabold text-white group-hover:text-blue-400 transition-colors leading-tight">
                              {dept.universityName || dept.university?.name || "Bilinmeyen Üniversite"}
                            </span>
                            <span className="text-[11px] text-slate-400 font-medium">
                              {facultyName}
                            </span>
                            <div className="flex items-center gap-2 mt-2">
                              {/* Search on Google */}
                              <button 
                                onClick={() => window.open(`https://www.google.com/search?q=${encodeURIComponent(dept.universityName || dept.university?.name || "")}`, "_blank")}
                                className="w-6 h-6 rounded-full border border-white/10 flex items-center justify-center text-slate-400 hover:text-white hover:border-white/30 hover:bg-white/5 transition-all cursor-pointer"
                                title="Google'da Üniversiteyi Ara"
                              >
                                <Search size={11} />
                              </button>

                              {/* Quick Add to Basket Button */}
                              <button
                                onClick={() => handleToggleBasket(dept)}
                                className={`px-2 py-0.5 rounded-md border text-[10px] font-bold flex items-center gap-1 transition-all cursor-pointer ${
                                  basketList.some(b => b.id === dept.id)
                                    ? "bg-emerald-500/20 border-emerald-500/40 text-emerald-300"
                                    : "bg-blue-600/20 hover:bg-blue-600/30 border-blue-500/30 text-blue-300 hover:text-white"
                                }`}
                                title={basketList.some(b => b.id === dept.id) ? "Sepetten Çıkar" : "Tercih Sepetime Ekle"}
                              >
                                {basketList.some(b => b.id === dept.id) ? (
                                  <>
                                    <Check size={10} />
                                    Sepette
                                  </>
                                ) : (
                                  <>
                                    <Plus size={10} />
                                    Sepete Ekle
                                  </>
                                )}
                              </button>

                              {/* YÖK Atlas Settings Cog Button & Actions Menu */}
                              <div className="relative settings-container">
                                <button 
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setActiveMenuDeptId(activeMenuDeptId === dept.id ? null : dept.id);
                                  }}
                                  className={`w-6 h-6 rounded border flex items-center justify-center transition-all cursor-pointer ${
                                    activeMenuDeptId === dept.id 
                                      ? "bg-blue-600 border-blue-500 text-white shadow-md shadow-blue-600/20" 
                                      : "bg-white/5 border-white/10 text-slate-400 hover:text-white hover:bg-white/10"
                                  }`}
                                  title="Seçenekler ve Filtreler"
                                >
                                  <Settings size={11} />
                                </button>

                                {activeMenuDeptId === dept.id && (
                                  <div className="absolute left-0 mt-1.5 w-56 rounded-xl bg-slate-950 border border-white/10 p-1.5 shadow-2xl z-40 flex flex-col gap-0.5 text-left animate-in fade-in slide-in-from-top-1 duration-150">

                                    <button
                                      onClick={() => {
                                        setActiveMenuDeptId(null);
                                        handleToggleBasket(dept);
                                      }}
                                      className="w-full text-left px-2.5 py-1.5 text-[11px] font-semibold text-blue-400 hover:text-blue-300 hover:bg-blue-500/10 rounded-lg transition-colors flex items-center gap-2 cursor-pointer"
                                    >
                                      <ShoppingBag size={12} />
                                      {basketList.some(b => b.id === dept.id) ? "Sepetten Çıkar" : "Tercih Sepetine Ekle"}
                                    </button>

                                    <button
                                      onClick={() => {
                                        const uniName = dept.universityName || dept.university?.name;
                                        setActiveMenuDeptId(null);
                                        if (uniName) {
                                          setTimeout(() => {
                                            setExcludedUniversities(prev => [...prev, uniName]);
                                          }, 10);
                                        }
                                      }}
                                      className="w-full text-left px-2.5 py-1.5 text-[11px] font-semibold text-rose-400 hover:text-rose-300 hover:bg-rose-500/10 rounded-lg transition-colors flex items-center gap-2 cursor-pointer"
                                    >
                                      <X size={12} className="stroke-[2.5]" />
                                      Üniversiteyi listeden çıkar
                                    </button>
                                    <button
                                      onClick={() => {
                                        setActiveMenuDeptId(null);
                                        if (facultyName && facultyName !== "Fakülte Bilgisi bulunmuyor") {
                                          setTimeout(() => {
                                            setExcludedFaculties(prev => [...prev, facultyName]);
                                          }, 10);
                                        }
                                      }}
                                      className="w-full text-left px-2.5 py-1.5 text-[11px] font-semibold text-rose-400 hover:text-rose-300 hover:bg-rose-500/10 rounded-lg transition-colors flex items-center gap-2 cursor-pointer"
                                    >
                                      <X size={12} className="stroke-[2.5]" />
                                      Fakülteyi listeden çıkar
                                    </button>
                                    <button
                                      onClick={() => {
                                        const cityName = dept.city?.name || dept.university?.city?.name;
                                        setActiveMenuDeptId(null);
                                        if (cityName) {
                                          setTimeout(() => {
                                            setExcludedCities(prev => [...prev, cityName]);
                                          }, 10);
                                        }
                                      }}
                                      className="w-full text-left px-2.5 py-1.5 text-[11px] font-semibold text-rose-400 hover:text-rose-300 hover:bg-rose-500/10 rounded-lg transition-colors flex items-center gap-2 cursor-pointer"
                                    >
                                      <X size={12} className="stroke-[2.5]" />
                                      Şehri listeden çıkar
                                    </button>
                                    <button
                                      onClick={() => {
                                        const deptName = dept.name;
                                        setActiveMenuDeptId(null);
                                        if (deptName) {
                                          setTimeout(() => {
                                            setExcludedDepartments(prev => [...prev, deptName]);
                                          }, 10);
                                        }
                                      }}
                                      className="w-full text-left px-2.5 py-1.5 text-[11px] font-semibold text-rose-400 hover:text-rose-300 hover:bg-rose-500/10 rounded-lg transition-colors flex items-center gap-2 cursor-pointer"
                                    >
                                      <X size={12} className="stroke-[2.5]" />
                                      Bölümü listeden çıkar
                                    </button>
                                    <button
                                      onClick={() => {
                                        const tType = dept.teachingType;
                                        setActiveMenuDeptId(null);
                                        if (tType) {
                                          setTimeout(() => {
                                            setExcludedTeachingTypes(prev => [...prev, tType]);
                                          }, 10);
                                        }
                                      }}
                                      className="w-full text-left px-2.5 py-1.5 text-[11px] font-semibold text-rose-400 hover:text-rose-300 hover:bg-rose-500/10 rounded-lg transition-colors flex items-center gap-2 cursor-pointer"
                                    >
                                      <X size={12} className="stroke-[2.5]" />
                                      Özel durumu listeden çıkar
                                    </button>
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>
                        </td>

                        {/* Bölüm Adı */}
                        <td className="py-4 px-4">
                          <div className="flex flex-col gap-1 max-w-xs whitespace-normal">
                            <span className="text-slate-200 font-bold leading-tight">
                              {dept.name || "Bilinmeyen Bölüm"}
                            </span>
                            {dept.teachingType && (
                              <span className="text-[11px] font-semibold text-emerald-400/90 flex items-center gap-1 mt-0.5">
                                <span className="text-slate-400 font-normal">Özel Durum:</span> {dept.teachingType}
                              </span>
                            )}
                            {dept.feeType && (
                              <span className="inline-flex px-2 py-0.5 rounded bg-blue-500/10 border border-blue-500/20 text-[10px] font-semibold text-blue-400 mt-0.5 w-max">
                                {dept.feeType}
                              </span>
                            )}
                            <div className="flex items-center gap-2 mt-2">
                              {/* Search Bölüm */}
                              <button 
                                onClick={() => window.open(`https://www.google.com/search?q=${encodeURIComponent((dept.universityName || dept.university?.name || "") + " " + (dept.name || ""))}`, "_blank")}
                                className="w-6 h-6 rounded-full border border-white/10 flex items-center justify-center text-slate-400 hover:text-white hover:border-white/30 hover:bg-white/5 transition-all cursor-pointer"
                                title="Google'da Bölümü Ara"
                              >
                                <Search size={11} />
                              </button>
                            </div>
                          </div>
                        </td>

                        {/* Şehir */}
                        <td className="py-4 px-4 text-slate-300">
                          {dept.city?.name || dept.university?.city?.name || "---"}
                        </td>

                        {/* Üni Türü */}
                        <td className="py-4 px-4 text-slate-400 font-semibold text-xs uppercase">
                          {dept.typeName || dept.university?.typeName || "DEVLET"}
                        </td>

                        {/* Tür */}
                        <td className="py-4 px-3 text-center">
                          <span className="inline-flex px-2.5 py-0.5 rounded-lg text-[11px] font-bold bg-slate-950 text-slate-300 border border-white/10 shadow-sm">
                            {dept.pointName || "SAY"}
                          </span>
                        </td>

                        {/* Kontenjan */}
                        <td className="py-3 px-3 text-center">
                          {renderVerticalBox("quota")}
                        </td>

                        {/* Yerleşen */}
                        <td className="py-3 px-3 text-center">
                          {renderVerticalBox("settled")}
                        </td>

                        {/* Başarı Sırası */}
                        <td className="py-3 px-3 text-center">
                          {renderVerticalBox("rank")}
                        </td>

                        {/* Taban Puan */}
                        <td className="py-3 px-3 text-center">
                          {renderVerticalBox("point")}
                        </td>

                        {/* Yıl (Duration) */}
                        <td className="py-4 px-3 text-center text-slate-300 font-bold text-xs">
                          {dept.timeofEducation || (dept.detail3 === "O" ? "2" : "4")}
                        </td>

                        {/* Ücret (KDV Dahil) */}
                        <td className="py-4 px-4 text-right">
                          <span className="text-xs font-semibold text-slate-300">
                            {dept.price !== undefined && dept.price !== null && dept.price !== "" ? formatPrice(dept.price) : ""}
                          </span>
                        </td>
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td colSpan={13} className="py-24 text-center">
                      <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-slate-800/50 mb-4 border border-white/5">
                        <Search size={24} className="text-slate-400" />
                      </div>
                      <h3 className="text-lg font-medium text-white mb-2">Program Bulunamadı</h3>
                      <p className="text-slate-400 text-sm max-w-md mx-auto">
                        Seçilen filtrelere uyan herhangi bir üniversite programı bulunamadı. Lütfen filtrelerinizi esneterek tekrar deneyin.
                      </p>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination Controls */}
          {(() => {
            if (totalCount <= itemsPerPage && page === 0) {
              return (
                <div className="p-6 border-t border-white/5 bg-slate-950/45 flex flex-col sm:flex-row items-center justify-between gap-4">
                  <div className="text-xs text-slate-400 font-medium select-none">
                    Toplam <span className="text-blue-400 font-bold">{totalCount}</span> program gösteriliyor.
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-slate-400 font-semibold">Sayfada Gösterim:</span>
                    {[20, 50, 75, 100, 300].map((size) => (
                      <button
                        key={size}
                        onClick={() => {
                          setItemsPerPage(size);
                          setPage(0);
                        }}
                        className={`px-2.5 py-1 rounded-lg text-xs font-extrabold transition-all cursor-pointer ${
                          itemsPerPage === size
                            ? "bg-blue-600 text-white shadow-md shadow-blue-600/30"
                            : "bg-slate-800/60 text-slate-400 hover:text-white hover:bg-slate-800"
                        }`}
                      >
                        {size}
                      </button>
                    ))}
                  </div>
                </div>
              );
            }

            const totalPages = Math.ceil(totalCount / itemsPerPage);
            const currentPageNum = page + 1;

            const getPageNumbers = () => {
              const pages: (number | string)[] = [];
              const range = 2;

              for (let i = 1; i <= totalPages; i++) {
                if (
                  i === 1 || 
                  i === totalPages || 
                  (i >= currentPageNum - range && i <= currentPageNum + range)
                ) {
                  if (pages.length > 0) {
                    const lastPage = pages[pages.length - 1];
                    if (typeof lastPage === "number" && i - lastPage > 1) {
                      pages.push("...");
                    }
                  }
                  pages.push(i);
                }
              }
              return pages;
            };

            const pages = getPageNumbers();

            return (
              <div className="p-6 border-t border-white/5 bg-slate-950/45 flex flex-col md:flex-row items-center justify-between gap-4 w-full select-none">
                {/* Info text & Page Size Selector */}
                <div className="flex flex-col sm:flex-row sm:items-center gap-3 text-xs text-slate-400 font-medium text-center md:text-left">
                  <div>
                    Toplam <span className="text-blue-400 font-bold">{totalCount}</span> programdan{" "}
                    <span className="text-white font-bold">{Math.min(page * itemsPerPage + 1, totalCount)}</span> -{" "}
                    <span className="text-white font-bold">{Math.min((page + 1) * itemsPerPage, totalCount)}</span> arası gösteriliyor.
                  </div>

                  <div className="flex items-center gap-1.5 justify-center">
                    <span className="text-[11px] text-slate-400 font-semibold">Sayfada:</span>
                    {[20, 50, 75, 100, 300].map((size) => (
                      <button
                        key={size}
                        onClick={() => {
                          setItemsPerPage(size);
                          setPage(0);
                        }}
                        className={`px-2 py-0.5 rounded-lg text-[11px] font-extrabold transition-all cursor-pointer ${
                          itemsPerPage === size
                            ? "bg-blue-600 text-white shadow-md shadow-blue-600/30"
                            : "bg-slate-800/60 text-slate-400 hover:text-white hover:bg-slate-800"
                        }`}
                      >
                        {size}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Page buttons */}
                <div className="flex items-center justify-center gap-1.5 flex-wrap">
                  {/* First Page */}
                  <button
                    onClick={() => page > 0 && setPage(0)}
                    disabled={page === 0}
                    className="p-2 rounded-lg border border-white/5 bg-slate-900/40 hover:bg-slate-800 text-slate-400 hover:text-white disabled:opacity-40 disabled:hover:bg-slate-900/40 disabled:hover:text-slate-400 transition-all cursor-pointer"
                    title="İlk Sayfa"
                  >
                    <ChevronsLeft size={16} />
                  </button>

                  {/* Prev Page */}
                  <button
                    onClick={() => page > 0 && setPage(page - 1)}
                    disabled={page === 0}
                    className="p-2 rounded-lg border border-white/5 bg-slate-900/40 hover:bg-slate-800 text-slate-400 hover:text-white disabled:opacity-40 disabled:hover:bg-slate-900/40 disabled:hover:text-slate-400 transition-all cursor-pointer"
                    title="Önceki Sayfa"
                  >
                    <ChevronLeft size={16} />
                  </button>

                  {/* Numeric Pages */}
                  {pages.map((p, idx) => {
                    if (p === "...") {
                      return (
                        <span key={`ellipsis-${idx}`} className="px-2 text-slate-500 font-medium text-sm">
                          ...
                        </span>
                      );
                    }

                    const pageIdx = (p as number) - 1;
                    const isCurrent = page === pageIdx;

                    return (
                      <button
                        key={`page-${p}`}
                        onClick={() => setPage(pageIdx)}
                        className={`w-9 h-9 rounded-lg flex items-center justify-center text-xs font-bold transition-all cursor-pointer ${
                          isCurrent
                            ? "bg-blue-600 text-white shadow-md shadow-blue-500/20 border border-blue-500/30"
                            : "border border-white/5 bg-slate-900/40 hover:bg-slate-800 text-slate-300 hover:text-white"
                        }`}
                      >
                        {p}
                      </button>
                    );
                  })}

                  {/* Next Page */}
                  <button
                    onClick={() => page < totalPages - 1 && setPage(page + 1)}
                    disabled={page >= totalPages - 1}
                    className="p-2 rounded-lg border border-white/5 bg-slate-900/40 hover:bg-slate-800 text-slate-400 hover:text-white disabled:opacity-40 disabled:hover:bg-slate-900/40 disabled:hover:text-slate-400 transition-all cursor-pointer"
                    title="Sonraki Sayfa"
                  >
                    <ChevronRight size={16} />
                  </button>

                  {/* Last Page */}
                  <button
                    onClick={() => page < totalPages - 1 && setPage(totalPages - 1)}
                    disabled={page >= totalPages - 1}
                    className="p-2 rounded-lg border border-white/5 bg-slate-900/40 hover:bg-slate-800 text-slate-400 hover:text-white disabled:opacity-40 disabled:hover:bg-slate-900/40 disabled:hover:text-slate-400 transition-all cursor-pointer"
                    title="Son Sayfa"
                  >
                    <ChevronsRight size={16} />
                  </button>
                </div>
              </div>
            );
          })()}
        </div>
      </div>

      {/* Premium Trend Visualizer Modal */}
      {renderChartModal()}

      {/* Bölümler Dağılım & Hariç Tutma Modalı */}
      <DepartmentStatsModal
        isOpen={showDeptStatsModal}
        onClose={() => setShowDeptStatsModal(false)}
        unfilteredData={unfilteredDataForDepts}
        allFilteredData={unfilteredDataForDepts}
        excludedDepartments={excludedDepartments}
        onToggleDepartmentExclusion={(deptName) => {
          setExcludedDepartments((prev) =>
            prev.includes(deptName) ? prev.filter((d) => d !== deptName) : [...prev, deptName]
          );
        }}
        onResetExclusions={() => setExcludedDepartments([])}
        onExcludeAllDepartments={(deptNames) => {
          setExcludedDepartments(prev => Array.from(new Set([...prev, ...deptNames])));
        }}
      />

      {/* Şehirler Dağılım & Hariç Tutma Modalı */}
      <CityStatsModal
        isOpen={showCityStatsModal}
        onClose={() => setShowCityStatsModal(false)}
        unfilteredData={unfilteredDataForCities}
        allFilteredData={unfilteredDataForCities}
        excludedCities={excludedCities}
        onToggleExcludeCity={(cityName) => {
          setExcludedCities((prev) =>
            prev.includes(cityName) ? prev.filter((d) => d !== cityName) : [...prev, cityName]
          );
        }}
        onClearExcludedCities={() => setExcludedCities([])}
        onExcludeAllCities={(cityNames) => {
          setExcludedCities(prev => Array.from(new Set([...prev, ...cityNames])));
        }}
      />

      {/* Tercih Sepeti & 24 Sıralı Tercih Listesi Modalı */}
      <PreferenceBasketModal
        isOpen={showBasketModal}
        onClose={() => setShowBasketModal(false)}
        basketList={basketList}
        preferenceList={preferenceList}
        activeTab={basketModalTab}
        onTabChange={setBasketModalTab}
        onRemoveFromBasket={handleRemoveFromBasket}
        onClearBasket={handleClearBasket}
        onAddToPreferenceSlot={handleAddToPreferenceSlot}
        onRemoveFromPreferenceSlot={handleRemoveFromPreferenceSlot}
        onMovePreferenceSlot={handleMovePreferenceSlot}
        onClearPreferenceList={handleClearPreferenceList}
        onSortPreferenceListByRank={handleSortPreferenceListByRank}
        onAddAllBasketToPreferenceList={handleAddAllBasketToPreferenceList}
        onOpenPrintView={(source) => {
          setPrintViewSource(source);
          setShowPrintView(true);
        }}
      />

      {/* Estetik Yazdırma / PDF Görünüm Modalı */}
      <PrintablePreferenceView
        isOpen={showPrintView}
        onClose={() => setShowPrintView(false)}
        preferenceList={preferenceList}
        basketList={basketList}
        source={printViewSource}
      />

    </div>
  );
}