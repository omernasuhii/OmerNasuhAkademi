import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { auth } from '../../lib/firebase';
import { studentDataService } from '../../services/studentDataService';
import { ChevronLeft, Save, Loader2, CheckCircle2, AlertCircle } from 'lucide-react';
import { motion } from 'motion/react';

export const BASE_TOPICS: Record<string, string[]> = {
  'Türkçe': [
    'Sözcükte Anlam', 'Cümlede Anlam', 'Paragrafta Anlam', 'Yazım Kuralları', 
    'Noktalama İşaretleri', 'Ses Bilgisi', 'Sözcük Yapısı', 'İsimler', 
    'Sıfatlar', 'Zamirler', 'Zarflar', 'Edat-Bağlaç-Ünlem', 'Fiiller', 
    'Ek Fiil', 'Fiilimsi', 'Cümlenin Öğeleri', 'Cümle Türleri', 'Anlatım Bozuklukları'
  ],
  'Edebiyat': [
    'Anlam Bilgisi (Sözcük, Cümle, Paragraf)', 'Şiir Bilgisi', 'Edebî Sanatlar', 
    'Metinlerin Sınıflandırılması', 'İslamiyet Öncesi Türk Edebiyatı', 'Geçiş Dönemi Türk Edebiyatı', 
    'Halk Edebiyatı', 'Divan Edebiyatı', 'Edebi Akımlar', 'Tanzimat Edebiyatı', 'Servet-i Fünun Edebiyatı', 'Fecr-i Ati Edebiyatı', 
    'Milli Edebiyat Dönemi', 'Cumhuriyet Dönemi Şiiri', 'Cumhuriyet Dönemi Roman ve Hikayesi', 'Cumhuriyet Dönemi Tiyatro ve Öğretici Metinler', 'Dünya Edebiyatı'
  ],
  'TYT Tarih': [
    'Tarih ve Zaman', 'İlk ve Orta Çağlarda Türk Dünyası', 'İslam Medeniyetinin Doğuşu', 
    'Türklerin İslamiyet’i Kabulü', 'Beylikten Devlete Osmanlı', 
    'Dünya Gücü Osmanlı', 'Uluslararası İlişkilerde Denge Stratejisi', 'XX. Yüzyıl Başlarında Osmanlı Devleti ve Dünya', 
    'Millî Mücadele', 'Atatürkçülük ve Türk İnkılabı'
  ],
  'AYT Tarih': [
    'Tarih Bilimi ve Zaman', 'İnsanlığın İlk Dönemleri (İlk Çağ Uygarlıkları)', 'Orta Çağ\'da Dünya', 'İlk ve Orta Çağlarda Türk Dünyası', 
    'İslam Medeniyetinin Doğuşu', 'Türklerin İslamiyet\'i Kabulü ve İlk Türk İslam Devletleri', 
    'Yerleşme ve Devletleşme Sürecinde Selçuklu Türkiyesi', 'Beylikten Devlete Osmanlı', 'Dünya Gücü Osmanlı', 
    'Değişim Çağında Avrupa ve Osmanlı', 'Uluslararası İlişkilerde Denge Stratejisi', 
    'XX. Yüzyıl Başlarında Osmanlı Devleti', 'Milli Mücadele Dönemi', 'Atatürkçülük ve Türk İnkılabı', 
    'İki Savaş Arasındaki Dönemde Türkiye ve Dünya', 'II. Dünya Savaşı Sürecinde Türkiye ve Dünya', 
    'II. Dünya Savaşı Sonrasında Türkiye ve Dünya', 'Toplumsallaşma Evresinde Türkiye ve Dünya', 
    'Küreselleşen Dünya'
  ],
  'TYT Coğrafya': [
    'Doğa ve İnsan', 'Dünya’nın Şekli ve Hareketleri', 'Yer ve Zaman', 'Harita Bilgisi', 
    'Atmosfer ve İklim', 'Yer’in Şekillenmesi', 'Doğanın Ekstrem Olayları', 
    'Beşerî Sistemler', 'Nüfus', 'Göç', 'Ekonomik Faaliyetler', 'Bölge Kavramı', 'Doğal Afetler'
  ],
  'AYT Coğrafya': [
    'Ekosistem ve Madde Döngüleri', 'Ekstrem Doğa Olayları ve Küresel İklim Değişimi', 
    'Nüfus Politikaları ve Şehirler', 'Türkiye\'de Nüfus ve Yerleşme', 
    'Ekonomik Faaliyetler ve Doğal Kaynaklar', 'Türkiye Ekonomisi (Tarım, Hayvancılık, Orman)', 
    'Türkiye\'de Madenler ve Enerji Kaynakları', 'Türkiye\'de Sanayi', 'Türkiye\'de Ulaşım ve Ticaret', 'Türkiye\'de Turizm',
    'Kültür Bölgeleri ve Ülkelerarası Etkileşim', 'Küresel Ortam: Bölgeler ve Ülkeler (Örgütler)', 
    'Çevre Sorunları', 'Çevresel Örgütler ve Anlaşmalar'
  ],
  'Felsefe': [
    'Felsefeyi Tanıma', 'Felsefe ile Düşünme', 'Varlık Felsefesi', 'Bilgi Felsefesi', 
    'Bilim Felsefesi', 'Ahlak Felsefesi', 'Din Felsefesi', 'Siyaset Felsefesi', 'Sanat Felsefesi'
  ],
  'Felsefe Grubu': [
    'Psikoloji Bilimini Tanıyalım', 'Psikolojinin Temel Süreçleri', 'Öğrenme, Bellek, Düşünme', 'Ruh Sağlığının Temelleri',
    'Sosyolojiye Giriş', 'Birey ve Toplum', 'Toplumsal Yapı', 'Toplumsal Değişme ve Gelişme', 'Toplum ve Kültür', 'Toplumsal Kurumlar',
    'Mantığa Giriş', 'Klasik Mantık', 'Mantık ve Dil', 'Sembolik Mantık'
  ],
  'Din': [
    'Bilgi ve İnanç', 'Din ve İslam', 'İslam ve İbadet', 'Gençlik ve Değerler', 
    'Allah İnsan İlişkisi', 'Hz. Muhammed ve Gençlik', 'İslam ve Bilim', 'Anadolu’da İslam', 
    'Kur’an’da Bazı Kavramlar', 'Güncel Dinî Meseleler', 'Hint ve Çin Dinleri', 'Yahudilik ve Hristiyanlık'
  ],
  'TYT Matematik': [
    'Temel Kavramlar', 'Sayı Basamakları', 'Bölme ve Bölünebilme', 'EBOB-EKOK', 
    'Rasyonel Sayılar', 'Basit Eşitsizlikler', 'Mutlak Değer', 'Üslü İfadeler', 
    'Köklü İfadeler', 'Çarpanlara Ayırma', 'Oran-Orantı', 'Denklem Çözme', 
    'Problemler', 'Kümeler', 'Mantık', 'Fonksiyonlar', 'Polinomlar', 
    'İkinci Dereceden Denklemler', 'İstatistik', 'Sayma ve Olasılık'
  ],
  'AYT Matematik': [
    'Temel Kavramlar', 'Bölünebilme Kuralları', 'EBOB-EKOK', 'Rasyonel Sayılar', 'Basit Eşitsizlikler', 'Mutlak Değer', 'Üslü ve Köklü İfadeler', 'Çarpanlara Ayırma',
    'Mantık', 'Kümeler', 'Fonksiyonlar', 'Polinomlar', 'İkinci Dereceden Denklemler', 
    'Karmaşık Sayılar', 'Eşitsizlikler', 'Parabol', 'Trigonometri', 'Logaritma', 
    'Diziler', 'Limit ve Süreklilik', 'Türev', 'İntegral', 'Permütasyon - Kombinasyon', 'Olasılık', 'Binom Açılımı', 'Veri ve İstatistik'
  ],
  'Geometri': [
    'Doğruda ve Üçgende Açılar', 'Özel Üçgenler', 'Açı-Kenar Bağıntıları', 
    'Üçgende Eşlik ve Benzerlik', 'Üçgende Alan', 'Üçgende Açıortay ve Kenarortay',
    'Çokgenler', 'Dörtgenler', 'Yamuk', 'Paralelkenar', 'Eşkenar Dörtgen', 'Dikdörtgen', 'Kare', 'Deltoid', 
    'Çemberde Açı', 'Çemberde Uzunluk', 'Dairenin Çevresi ve Alanı', 
    'Analitik Geometri (Nokta ve Doğru)', 'Katı Cisimler', 'Çemberin Analitik İncelenmesi', 'Dönüşüm Geometrisi'
  ],
  'TYT Fizik': [
    'Fizik Bilimine Giriş', 'Madde ve Özellikleri', 'Hareket ve Kuvvet', 'Enerji', 
    'Isı ve Sıcaklık', 'Elektrostatik', 'Elektrik ve Manyetizma', 'Basınç ve Kaldırma Kuvveti', 
    'Dalgalar', 'Optik'
  ],
  'AYT Fizik': [
    'Vektörler', 'Bağıl Hareket', 'Newton’un Hareket Yasaları', 'Bir Boyutta Sabit İvmeli Hareket (Atışlar)', 'İki Boyutta Hareket', 'Enerji ve Hareket', 'İtme ve Çizgisel Momentum', 'Tork ve Denge', 'Basit Makineler', 
    'Elektriksel Kuvvet ve Elektrik Alan', 'Elektriksel Potansiyel', 'Düzgün Elektrik Alan ve Sığa', 'Manyetizma', 'Elektromanyetik İndükleme', 'Alternatif Akım', 'Transformatör',
    'Çembersel Hareket', 'Dönerek Öteleme ve Açısal Momentum', 'Kütle Çekim Kuvveti ve Kepler Yasaları', 'Basit Üst Harmonik Hareket', 'Dalga Mekaniği (Girişim, Kırınım, Doppler)', 'Elektromanyetik Dalgalar',
    'Atom Fiziği', 'Büyük Patlama ve Evrenin Oluşumu', 'Radyoaktivite', 'Modern Fizik', 'Modern Fiziğin Teknolojideki Uygulamaları'
  ],
  'TYT Kimya': [
    'Kimya Bilimi', 'Atom ve Periyodik Sistem', 'Kimyasal Türler Arası Etkileşimler', 
    'Maddenin Halleri', 'Doğa ve Kimya', 'Kimyasal Hesaplamalar', 
    'Karışımlar', 'Asitler, Bazlar ve Tuzlar', 'Kimya Her Yerde'
  ],
  'AYT Kimya': [
    'Modern Atom Teorisi', 'Gazlar', 'Sıvı Çözeltiler ve Çözünürlük', 
    'Kimyasal Tepkimelerde Enerji', 'Kimyasal Tepkimelerde Hız', 
    'Kimyasal Tepkimelerde Denge', 'Asit-Baz Dengesi', 'Çözünürlük Dengesi', 
    'Elektrokimya (Kimya ve Elektrik)', 'Karbon Kimyasına Giriş', 'Organik Bileşikler (Hidrokarbonlar)', 'Organik Bileşikler (Fonksiyonel Gruplar)', 'Enerji Kaynakları'
  ],
  'TYT Biyoloji': [
    'Canlıların Ortak Özellikleri', 'Canlıların Temel Bileşenleri', 'Hücre', 
    'Canlıların Dünyası', 'Hücre Bölünmeleri', 'Kalıtım', 'Ekosistem Ekolojisi'
  ],
  'AYT Biyoloji': [
    'Sinir Sistemi', 'Endokrin Sistem', 'Duyu Organları', 'Destek ve Hareket Sistemi', 'Sindirim Sistemi', 'Dolaşım Sistemi', 'Bağışıklık Sistemi', 'Solunum Sistemi', 'Boşaltım Sistemi', 'Üreme Sistemi ve Embriyonik Gelişim', 'Komünite Ekolojisi', 'Popülasyon Ekolojisi',
    'Yönetici Moleküller (Nükleik Asitler)', 'Genden Proteine', 'Hücresel Solunum', 'Fotosentez', 'Kemosentez', 'Bitkilerin Yapısı', 'Bitkilerde Büyüme, Taşıma ve Üreme', 'Canlılar ve Çevre'
  ],
  'İngilizce': [
    'Kelime Bilgisi', 'Dilbilgisi', 'Cloze Test', 'Cümle Tamamlama', 'Çeviri (İngilizce-Türkçe)', 'Çeviri (Türkçe-İngilizce)', 'Okuma Parçaları', 'Diyalog Tamamlama', 'Anlamca En Yakın Cümle', 'Paragraf Tamamlama', 'Anlam Bütünlüğünü Bozan Cümle'
  ],
  'Almanca': [
    'Kelime Bilgisi', 'Dilbilgisi', 'Cloze Test', 'Cümle Tamamlama', 'Çeviri (Almanca-Türkçe)', 'Çeviri (Türkçe-Almanca)', 'Okuma Parçaları', 'Diyalog Tamamlama', 'Anlamca En Yakın Cümle', 'Paragraf Tamamlama', 'Anlam Bütünlüğünü Bozan Cümle'
  ],
  'Fransızca': [
    'Kelime Bilgisi', 'Dilbilgisi', 'Cloze Test', 'Cümle Tamamlama', 'Çeviri (Fransızca-Türkçe)', 'Çeviri (Türkçe-Fransızca)', 'Okuma Parçaları', 'Diyalog Tamamlama', 'Anlamca En Yakın Cümle', 'Paragraf Tamamlama', 'Anlam Bütünlüğünü Bozan Cümle'
  ],
  'Arapça': [
    'Kelime Bilgisi', 'Dilbilgisi', 'Cloze Test', 'Cümle Tamamlama', 'Çeviri (Arapça-Türkçe)', 'Çeviri (Türkçe-Arapça)', 'Okuma Parçaları', 'Diyalog Tamamlama', 'Anlamca En Yakın Cümle', 'Paragraf Tamamlama', 'Anlam Bütünlüğünü Bozan Cümle'
  ],
  'Rusça': [
    'Kelime Bilgisi', 'Dilbilgisi', 'Cloze Test', 'Cümle Tamamlama', 'Çeviri (Rusça-Türkçe)', 'Çeviri (Türkçe-Rusça)', 'Okuma Parçaları', 'Diyalog Tamamlama', 'Anlamca En Yakın Cümle', 'Paragraf Tamamlama', 'Anlam Bütünlüğünü Bozan Cümle'
  ],
  'Yabancı Dil': [
    'Kelime Bilgisi', 'Dilbilgisi', 'Cümle Tamamlama', 'Çeviri', 'Paragraf Tamamlama', 'Anlamca En Yakın Cümle', 'Diyalog Tamamlama', 'Okuma Parçaları'
  ]
};

const getTopicsForBranch = (branch: string, questionNo: number, examType: string) => {
  const isAYT = examType === 'AYT' || (examType === 'YKS' && ['Matematik', 'Ed-Sos-1', 'Sosyal-2', 'Fen Bilimleri (AYT)'].includes(branch)) || (examType === 'BRANŞ' && branch.includes('AYT'));
  const isTYT = examType === 'TYT' || (examType === 'YKS' && ['Türkçe', 'Sosyal Bilimler', 'Temel Matematik', 'Fen Bilimleri'].includes(branch)) || (examType === 'BRANŞ' && branch.includes('TYT'));

  const strictBranch = branch.replace(' (TYT)', '').replace(' (AYT)', '').replace(' (YDT)', '');

  // TYT Sosyal Bilimler (20 Soru)
  if (strictBranch === 'Sosyal Bilimler') {
    if (questionNo <= 5) return BASE_TOPICS['TYT Tarih'];
    if (questionNo <= 10) return BASE_TOPICS['TYT Coğrafya'];
    if (questionNo <= 15) return BASE_TOPICS['Felsefe'];
    return BASE_TOPICS['Din'];
  }

  // Fen Bilimleri (TYT vs AYT)
  if (strictBranch === 'Fen Bilimleri') {
    if (isAYT) {
      if (questionNo <= 14) return BASE_TOPICS['AYT Fizik'];
      if (questionNo <= 27) return BASE_TOPICS['AYT Kimya'];
      return BASE_TOPICS['AYT Biyoloji'];
    } else {
      if (questionNo <= 7) return BASE_TOPICS['TYT Fizik'];
      if (questionNo <= 14) return BASE_TOPICS['TYT Kimya'];
      return BASE_TOPICS['TYT Biyoloji'];
    }
  }

  // TYT Matematik (40 Soru)
  if (strictBranch === 'Temel Matematik') {
    if (questionNo <= 30) return BASE_TOPICS['TYT Matematik'];
    return BASE_TOPICS['Geometri'];
  }

  // AYT Edebiyat-Sosyal-1 (40 Soru)
  if (strictBranch === 'Ed-Sos-1' || strictBranch === 'Edebiyat-Sosyal-1') {
    if (questionNo <= 24) return BASE_TOPICS['Edebiyat'];
    if (questionNo <= 34) return BASE_TOPICS['AYT Tarih'];
    return BASE_TOPICS['AYT Coğrafya'];
  }

  // AYT Sosyal-2 (40 Soru)
  if (strictBranch === 'Sosyal-2') {
    if (questionNo <= 11) return BASE_TOPICS['AYT Tarih'];
    if (questionNo <= 22) return BASE_TOPICS['AYT Coğrafya'];
    if (questionNo <= 34) return [...BASE_TOPICS['Felsefe'], ...BASE_TOPICS['Felsefe Grubu']];
    return BASE_TOPICS['Din'];
  }

  // AYT Matematik (40 Soru)
  if (strictBranch === 'Matematik') {
    if (questionNo <= 30) return isAYT ? BASE_TOPICS['AYT Matematik'] : BASE_TOPICS['TYT Matematik'];
    return BASE_TOPICS['Geometri'];
  }

  // Individual branches (Branch Exams)
  const normalized = branch.replace(' (TYT)', '').replace(' (AYT)', '').replace(' (YDT)', '');
  if (normalized === 'Türkçe') return BASE_TOPICS['Türkçe'];
  if (normalized === 'Temel Matematik') return [...BASE_TOPICS['TYT Matematik'], ...BASE_TOPICS['Geometri']];
  if (normalized === 'Sosyal Bilimler') return [...BASE_TOPICS['TYT Tarih'], ...BASE_TOPICS['TYT Coğrafya'], ...BASE_TOPICS['Felsefe'], ...BASE_TOPICS['Din']];
  if (normalized === 'Fen Bilimleri') return [...BASE_TOPICS['TYT Fizik'], ...BASE_TOPICS['TYT Kimya'], ...BASE_TOPICS['TYT Biyoloji']];
  if (normalized === 'Edebiyat') return BASE_TOPICS['Edebiyat'];
  if (normalized === 'Tarih' || normalized === 'Tarih-1' || normalized === 'Tarih-2') return isAYT ? BASE_TOPICS['AYT Tarih'] : BASE_TOPICS['TYT Tarih'];
  if (normalized === 'Coğrafya' || normalized === 'Coğrafya-1' || normalized === 'Coğrafya-2') return isAYT ? BASE_TOPICS['AYT Coğrafya'] : BASE_TOPICS['TYT Coğrafya'];
  if (normalized === 'Felsefe' || normalized === 'Felsefe Grubu') return [...BASE_TOPICS['Felsefe'], ...BASE_TOPICS['Felsefe Grubu']];
  if (normalized === 'Din' || normalized === 'Din (Seçmeli)') return BASE_TOPICS['Din'];
  if (normalized === 'Fizik') return isAYT ? BASE_TOPICS['AYT Fizik'] : BASE_TOPICS['TYT Fizik'];
  if (normalized === 'Kimya') return isAYT ? BASE_TOPICS['AYT Kimya'] : BASE_TOPICS['TYT Kimya'];
  if (normalized === 'Biyoloji') return isAYT ? BASE_TOPICS['AYT Biyoloji'] : BASE_TOPICS['TYT Biyoloji'];
  if (normalized === 'Matematik') return isAYT ? [...BASE_TOPICS['AYT Matematik'], ...BASE_TOPICS['Geometri']] : [...BASE_TOPICS['TYT Matematik'], ...BASE_TOPICS['Geometri']];
  if (normalized === 'Geometri') return BASE_TOPICS['Geometri'];
  if (normalized === 'Edebiyat-Sosyal-1' || normalized === 'Ed-Sos-1') return [...BASE_TOPICS['Edebiyat'], ...BASE_TOPICS['AYT Tarih'], ...BASE_TOPICS['AYT Coğrafya']];
  if (normalized === 'Sosyal-2') return [...BASE_TOPICS['AYT Tarih'], ...BASE_TOPICS['AYT Coğrafya'], ...BASE_TOPICS['Felsefe'], ...BASE_TOPICS['Felsefe Grubu'], ...BASE_TOPICS['Din']];
  if (normalized === 'Fen Bilimleri (AYT)') return [...BASE_TOPICS['AYT Fizik'], ...BASE_TOPICS['AYT Kimya'], ...BASE_TOPICS['AYT Biyoloji']];

  if (normalized === 'Yabancı Dil') return BASE_TOPICS['Yabancı Dil'];
  if (['İngilizce', 'Almanca', 'Fransızca', 'Arapça', 'Rusça'].includes(normalized)) return BASE_TOPICS[normalized];

  return [];
};

const ERROR_TYPES = [
  { id: 'bilgi', label: 'BİLGİ', color: 'bg-red-500', light: 'bg-red-500/10', text: 'text-red-500' },
  { id: 'kalip', label: 'KALIP', color: 'bg-orange-500', light: 'bg-orange-500/10', text: 'text-orange-500' },
  { id: 'dikkat', label: 'DİKKAT', color: 'bg-yellow-500', light: 'bg-yellow-500/10', text: 'text-yellow-500' },
  { id: 'zaman', label: 'ZAMAN', color: 'bg-blue-500', light: 'bg-blue-500/10', text: 'text-blue-500' },
  { id: 'none', label: 'HATA YOK', color: 'bg-indigo-600', light: 'bg-indigo-500/10', text: 'text-indigo-400' }
];

const EXAM_TYPE_BRANCHES: Record<string, string[]> = {
  'TYT': ['Türkçe', 'Sosyal Bilimler', 'Temel Matematik', 'Fen Bilimleri'],
  'AYT': ['Matematik', 'Ed-Sos-1', 'Sosyal-2', 'Fen Bilimleri (AYT)', 'Yabancı Dil'],
  'YDT': ['İngilizce', 'Almanca', 'Fransızca', 'Arapça', 'Rusça'],
  'YKS': ['Türkçe', 'Sosyal Bilimler', 'Temel Matematik', 'Fen Bilimleri', 'Ed-Sos-1', 'Sosyal-2', 'Matematik', 'Fen Bilimleri (AYT)', 'İngilizce', 'Almanca', 'Fransızca', 'Arapça', 'Rusça']
};

const FIELD_AYT_BRANCHES: Record<string, string[]> = {
  'SAYISAL': ['Matematik', 'Fen Bilimleri (AYT)'],
  'EŞİT AĞIRLIK': ['Matematik', 'Ed-Sos-1'],
  'SÖZEL': ['Ed-Sos-1', 'Sosyal-2'],
  'DİL': ['İngilizce', 'Almanca', 'Fransızca', 'Arapça', 'Rusça'],
  // Fallbacks just in case
  'SAY': ['Matematik', 'Fen Bilimleri (AYT)'],
  'EA': ['Matematik', 'Ed-Sos-1'],
  'SÖZ': ['Ed-Sos-1', 'Sosyal-2']
};

const BRANCH_QUESTION_COUNTS: Record<string, number> = {
  'Türkçe': 40,
  'Sosyal Bilimler': 20,
  'Temel Matematik': 40,
  'Fen Bilimleri': 20,
  'Ed-Sos-1': 40,
  'Edebiyat-Sosyal-1': 40,
  'Sosyal-2': 40,
  'Matematik': 40,
  'Fen Bilimleri (AYT)': 40,
  'Yabancı Dil': 80,
  'İngilizce': 80,
  'Almanca': 80,
  'Fransızca': 80,
  'Arapça': 80,
  'Rusça': 80,
  'Fizik (AYT)': 14,
  'Kimya (AYT)': 13,
  'Biyoloji (AYT)': 13,
  'Fizik (TYT)': 7,
  'Kimya (TYT)': 7,
  'Biyoloji (TYT)': 6,
  'Tarih-1': 10,
  'Coğrafya-1': 6,
  'Tarih-2': 11,
  'Coğrafya-2': 11,
  'Felsefe Grubu': 12,
  'Din (Seçmeli)': 6,
  'Tarih': 5,
  'Coğrafya': 5,
  'Felsefe': 5,
  'Din': 5,
  'Geometri': 10,
  'Edebiyat': 24
};

export default function ExamAnalysis() {
  const { examId } = useParams();
  const navigate = useNavigate();
  const [exam, setExam] = useState<any>(null);
  const [studentProfile, setStudentProfile] = useState<any>(null);
  const [analysis, setAnalysis] = useState<any>(null);
  const [activeBranch, setActiveBranch] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const loadData = async () => {
      if (!examId) return;
      setLoading(true);
      try {
        const user = auth.currentUser;
        if (!user) return;

        const [results, profile] = await Promise.all([
          studentDataService.getExamResults(user.uid),
          studentDataService.getStudentProfile(user.uid)
        ]);

        const currentExam = (results as any[]).find(e => e.id === examId);
        setExam(currentExam);
        setStudentProfile(profile);

        const existingAnalysis = await studentDataService.getExamAnalysis(examId);
        const queryParams = new URLSearchParams(window.location.search);
        const startType = queryParams.get('type');
        
        if (existingAnalysis) {
          let data = existingAnalysis.data || {};
          let expectedBranches = EXAM_TYPE_BRANCHES[currentExam.examType as string] || [];
          
          if (currentExam.examType === 'BRANŞ') {
            expectedBranches = Object.keys(currentExam.scores || {});
          } else if (currentExam.examType === 'AYT' || currentExam.examType === 'YKS') {
            if (profile?.branch) {
              let allowedAyt = FIELD_AYT_BRANCHES[profile.branch] || FIELD_AYT_BRANCHES[profile.branch.toUpperCase()] || EXAM_TYPE_BRANCHES['AYT'];
              if (profile.branch === 'DİL' && profile.ydtLanguage) {
                allowedAyt = [profile.ydtLanguage];
              }
              if (currentExam.examType === 'AYT') {
                expectedBranches = allowedAyt;
              } else {
                expectedBranches = [...EXAM_TYPE_BRANCHES['TYT'], ...allowedAyt];
              }
            } else {
              expectedBranches = EXAM_TYPE_BRANCHES[currentExam.examType as string] || [];
            }
          }
          
          let needsUpdate = false;
          expectedBranches.forEach(branch => {
            if (!data[branch] || data[branch].length === 0) {
              needsUpdate = true;
              const questionCount = getQuestionCountForBranch(currentExam, branch);
              data[branch] = Array.from({ length: questionCount }, (_, i) => ({
                questionNo: i + 1,
                topic: '',
                errorType: 'none'
              }));
            }
          });

          const finalAnalysis = needsUpdate ? { ...existingAnalysis, data } : existingAnalysis;
          setAnalysis(finalAnalysis);
          
          let initialBranch = Object.keys(finalAnalysis.data)[0];
          if (startType === 'AYT') {
            const aytMatch = Object.keys(finalAnalysis.data).find(b => 
              ['Matematik', 'Ed-Sos-1', 'Sosyal-2', 'Fen Bilimleri (AYT)'].includes(b)
            );
            if (aytMatch) initialBranch = aytMatch;
          } else if (startType === 'YDT') {
            const ydtMatch = Object.keys(finalAnalysis.data).find(b => 
              ['İngilizce', 'Almanca', 'Fransızca', 'Arapça', 'Rusça', 'Yabancı Dil'].includes(b)
            );
            if (ydtMatch) initialBranch = ydtMatch;
          } else if (startType === 'TYT') {
            const tytMatch = Object.keys(finalAnalysis.data).find(b => 
              ['Türkçe', 'Sosyal Bilimler', 'Temel Matematik', 'Fen Bilimleri'].includes(b)
            );
            if (tytMatch) initialBranch = tytMatch;
          }
          setActiveBranch(initialBranch);
        } else if (currentExam) {
          const initialData: any = {};
          let branches = EXAM_TYPE_BRANCHES[currentExam.examType as string] || [];
          
          if (currentExam.examType === 'BRANŞ') {
            branches = Object.keys(currentExam.scores || {});
          } else if (currentExam.examType === 'AYT' || currentExam.examType === 'YKS') {
            if (profile?.branch) {
              let allowedAyt = FIELD_AYT_BRANCHES[profile.branch] || FIELD_AYT_BRANCHES[profile.branch.toUpperCase()] || EXAM_TYPE_BRANCHES['AYT'];
              if (profile.branch === 'DİL' && profile.ydtLanguage) {
                allowedAyt = [profile.ydtLanguage];
              }
              if (currentExam.examType === 'AYT') {
                branches = allowedAyt;
              } else {
                branches = [...EXAM_TYPE_BRANCHES['TYT'], ...allowedAyt];
              }
            } else {
              branches = EXAM_TYPE_BRANCHES[currentExam.examType as string] || [];
            }
          }

          branches.forEach(branch => {
            const questionCount = getQuestionCountForBranch(currentExam, branch);
            initialData[branch] = Array.from({ length: questionCount }, (_, i) => ({
              questionNo: i + 1,
              topic: '',
              errorType: 'none'
            }));
          });

          setAnalysis({
            examId,
            studentId: user.uid,
            data: initialData
          });

          let initialBranch = branches[0];
          if (startType === 'AYT') {
            const aytMatch = branches.find(b => 
              ['Matematik', 'Ed-Sos-1', 'Sosyal-2', 'Fen Bilimleri (AYT)'].includes(b)
            );
            if (aytMatch) initialBranch = aytMatch;
          } else if (startType === 'YDT') {
            const ydtMatch = branches.find(b => 
              ['İngilizce', 'Almanca', 'Fransızca', 'Arapça', 'Rusça', 'Yabancı Dil'].includes(b)
            );
            if (ydtMatch) initialBranch = ydtMatch;
          } else if (startType === 'TYT') {
            const tytMatch = branches.find(b => 
              ['Türkçe', 'Sosyal Bilimler', 'Temel Matematik', 'Fen Bilimleri'].includes(b)
            );
            if (tytMatch) initialBranch = tytMatch;
          }
          setActiveBranch(initialBranch);
        }
      } catch (err) {
        console.error("Analysis load error:", err);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [examId]);

  const getQuestionCountForBranch = (exam: any, branch: string) => {
    if (BRANCH_QUESTION_COUNTS[branch]) return BRANCH_QUESTION_COUNTS[branch];
    const normalizedBranch = branch.replace(' (TYT)', '').replace(' (AYT)', '');
    return BRANCH_QUESTION_COUNTS[normalizedBranch] || 40;
  };

  const handleUpdateQuestion = (index: number, field: string, value: string) => {
    setAnalysis((prev: any) => {
      const branchData = [...prev.data[activeBranch]];
      branchData[index] = { ...branchData[index], [field]: value };
      return {
        ...prev,
        data: {
          ...prev.data,
          [activeBranch]: branchData
        }
      };
    });
  };

  const handleSave = async () => {
    if (!analysis) return;
    setSaving(true);
    try {
      await studentDataService.saveExamAnalysis(analysis);
      // Refresh to get potentially new ID if it was a create
      const updated = await studentDataService.getExamAnalysis(examId!);
      setAnalysis(updated);
    } catch (err) {
      console.error("Save error:", err);
    } finally {
      setSaving(false);
    }
  };

  const checkIfBranchComplete = (branchName: string) => {
    if (!analysis || !exam || !analysis.data[branchName]) return false;
    
    let totalCorrect = 0;
    if (exam.examType === 'BRANŞ') {
       totalCorrect += (parseInt(exam.scores?.[branchName]?.c) || 0);
    } else {
       const branchToFieldsMap: Record<string, string[]> = {
           'Türkçe': ['Türkçe', 'TYT Türkçe'],
           'Sosyal Bilimler': ['Tarih', 'TYT Tarih', 'Coğrafya', 'TYT Coğrafya', 'Felsefe', 'TYT Felsefe', 'Din', 'TYT Din'],
           'Temel Matematik': ['Matematik', 'TYT Matematik', 'Geometri', 'TYT Geometri'],
           'Fen Bilimleri': ['Fizik', 'TYT Fizik', 'Kimya', 'TYT Kimya', 'Biyoloji', 'TYT Biyoloji'],
           'Edebiyat': ['Edebiyat', 'AYT Edebiyat'],
           'Ed-Sos-1': ['Edebiyat', 'AYT Edebiyat', 'Tarih-1', 'AYT Tarih-1', 'Coğrafya-1', 'AYT Coğrafya-1'],
           'Sosyal-2': ['Tarih-2', 'AYT Tarih-2', 'Coğrafya-2', 'AYT Coğrafya-2', 'Felsefe Grubu', 'AYT Felsefe Grubu', 'Din (Seçmeli)', 'AYT Din (Seçmeli)'],
           'Matematik': ['Matematik', 'AYT Matematik'],
           'Fen Bilimleri (AYT)': ['Fizik', 'AYT Fizik', 'Kimya', 'AYT Kimya', 'Biyoloji', 'AYT Biyoloji'],
           'Yabancı Dil': ['Yabancı Dil', 'YDT Yabancı Dil'],
           'İngilizce': ['İngilizce', 'YDT İngilizce'],
           'Almanca': ['Almanca', 'YDT Almanca'],
           'Fransızca': ['Fransızca', 'YDT Fransızca'],
           'Arapça': ['Arapça', 'YDT Arapça'],
           'Rusça': ['Rusça', 'YDT Rusça']
       };
       
       let expectedFields = branchToFieldsMap[branchName] || [branchName];
       
       // Special Handling for AYT Matematik/Fen naming collisions within same list
       if (exam.examType === 'YKS') {
           if (branchName === 'Matematik') expectedFields = ['AYT Matematik'];
           if (branchName === 'Fen Bilimleri (AYT)') expectedFields = ['AYT Fizik', 'AYT Kimya', 'AYT Biyoloji'];
       } else if (exam.examType === 'AYT') {
           if (branchName === 'Matematik') expectedFields = ['Matematik'];
           if (branchName === 'Fen Bilimleri (AYT)') expectedFields = ['Fizik', 'Kimya', 'Biyoloji'];
       }
       
       expectedFields.forEach(field => {
           if (exam.scores?.[field]) {
               totalCorrect += (parseInt(exam.scores[field].c) || 0);
           }
       });
    }

    const noneCount = analysis.data[branchName].filter((q: any) => q.errorType === 'none').length;
    // Default answers initially have 'none' errorType. 
    // They are complete if they replaced exactly (totalQuestions - totalCorrect) 'none's with actual errors.
    return noneCount === totalCorrect;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="animate-spin text-indigo-500" size={32} />
      </div>
    );
  }

  if (!exam || !analysis) {
    return (
      <div className="text-center py-20 bg-slate-900/40 rounded-3xl border border-white/5">
        <AlertCircle className="mx-auto text-red-500 mb-4" size={48} />
        <p className="text-slate-400 font-bold">Sınav bulunamadı veya bir hata oluştu.</p>
        <button 
          onClick={() => navigate('/panel/ogrenci/denemeler')}
          className="mt-4 text-indigo-400 hover:underline"
        >
          Geri Dön
        </button>
      </div>
    );
  }

  let displayBranches = Object.keys(analysis.data);
  const queryParams = new URLSearchParams(window.location.search);
  const startType = queryParams.get('type');

  if (exam.examType === 'YKS') {
    if (startType === 'TYT') {
      displayBranches = displayBranches.filter(b => ['Türkçe', 'Sosyal Bilimler', 'Temel Matematik', 'Fen Bilimleri'].includes(b));
    } else if (startType === 'AYT') {
      displayBranches = displayBranches.filter(b => ['Matematik', 'Ed-Sos-1', 'Sosyal-2', 'Fen Bilimleri (AYT)'].includes(b));
    } else if (startType === 'YDT') {
      displayBranches = displayBranches.filter(b => ['İngilizce', 'Almanca', 'Fransızca', 'Arapça', 'Rusça', 'Yabancı Dil'].includes(b));
    }
  }

  return (
    <div className="space-y-6 pb-20 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <button 
            onClick={() => navigate('/panel/ogrenci/denemeler')}
            className="p-2 hover:bg-white/5 rounded-xl text-slate-400 transition-colors"
          >
            <ChevronLeft size={24} />
          </button>
          <div>
            <h1 className="text-3xl font-bold italic text-white uppercase tracking-tight">Deneme Analizi</h1>
            <p className="text-slate-500">{exam.examName} - {new Date(exam.date).toLocaleDateString('tr-TR')}</p>
          </div>
        </div>

        <button 
          onClick={handleSave}
          disabled={saving}
          className="bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white font-bold py-2.5 px-8 rounded-xl transition-all flex items-center gap-2 shadow-lg shadow-emerald-600/20"
        >
          {saving ? <Loader2 size={18} className="animate-spin" /> : <Save size={18} />}
          Değişiklikleri Kaydet
        </button>
      </div>

      <div className="flex bg-slate-900/60 p-1 rounded-xl border border-white/5 overflow-x-auto custom-scrollbar">
        {displayBranches.map(branch => {
          const isComplete = checkIfBranchComplete(branch);
          return (
            <button
              key={branch}
              onClick={() => setActiveBranch(branch)}
              className={`px-6 py-2.5 rounded-lg text-sm font-bold uppercase tracking-widest transition-all whitespace-nowrap flex items-center gap-2 ${
                activeBranch === branch 
                  ? 'bg-indigo-600 text-white shadow-lg' 
                  : isComplete 
                    ? 'text-emerald-400 bg-emerald-500/10 hover:bg-emerald-500/20'
                    : 'text-slate-400 hover:text-white hover:bg-white/5'
              }`}
            >
              {branch}
              {isComplete && activeBranch !== branch && <CheckCircle2 size={14} className="text-emerald-400" />}
              {isComplete && activeBranch === branch && <CheckCircle2 size={14} className="text-white" />}
            </button>
          );
        })}
      </div>

      <div className="bg-slate-900/40 border border-white/5 rounded-3xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-white/5 border-b border-white/5 text-[10px] font-black uppercase tracking-widest text-slate-400">
                <th className="px-6 py-4 w-16">NO</th>
                <th className="px-6 py-4 w-64">SORU KONUSU</th>
                {ERROR_TYPES.map(type => (
                  <th key={type.id} className={`px-2 py-4 text-center ${type.id !== 'none' ? type.light : ''}`}>
                    <span className={`text-[10px] font-black ${type.text}`}>{type.label}</span>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {analysis.data[activeBranch].map((question: any, idx: number) => (
                <tr key={idx} className="hover:bg-white/5 transition-colors group">
                  <td className="px-6 py-4 text-center">
                    <span className="text-slate-500 font-bold">{question.questionNo}</span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="space-y-2">
                      <select 
                        value={getTopicsForBranch(activeBranch, question.questionNo, exam.examType).includes(question.topic) ? question.topic : (question.topic ? 'Diğer' : '')}
                        onChange={(e) => {
                          if (e.target.value !== 'Diğer') {
                            handleUpdateQuestion(idx, 'topic', e.target.value);
                          } else {
                            handleUpdateQuestion(idx, 'topic', ' '); // Signal other
                          }
                        }}
                        className="w-full bg-slate-800/50 border border-indigo-500/30 rounded-xl p-2.5 text-sm text-white outline-none focus:border-indigo-500 transition-colors"
                      >
                        <option value="">Konu Seçiniz...</option>
                        {(getTopicsForBranch(activeBranch, question.questionNo, exam.examType)).map(topic => (
                          <option key={topic} value={topic}>{topic}</option>
                        ))}
                        <option value="Diğer">Diğer (Listede Yok)</option>
                      </select>
                      
                      {(!getTopicsForBranch(activeBranch, question.questionNo, exam.examType).includes(question.topic) && question.topic !== '') && (
                        <input 
                          type="text"
                          value={question.topic.trim()}
                          onChange={(e) => handleUpdateQuestion(idx, 'topic', e.target.value)}
                          placeholder="Konu adını yazınız..."
                          className="w-full bg-slate-800/30 border border-white/10 rounded-lg p-2 text-xs text-white outline-none focus:border-indigo-500 transition-colors"
                          autoFocus
                        />
                      )}
                    </div>
                  </td>
                  {ERROR_TYPES.map(type => (
                    <td key={type.id} className="px-2 py-4 text-center">
                      <button 
                        onClick={() => handleUpdateQuestion(idx, 'errorType', type.id)}
                        className={`w-6 h-6 rounded-full border-2 transition-all flex items-center justify-center ${
                          question.errorType === type.id 
                            ? `${type.color} border-transparent shadow-[0_0_12px_${type.id === 'none' ? 'rgba(79,70,229,0.5)' : 'rgba(0,0,0,0.3)'}]` 
                            : 'border-slate-700 hover:border-slate-500'
                        }`}
                      >
                        {question.errorType === type.id && (
                          <div className="w-2 h-2 bg-white rounded-full" />
                        )}
                      </button>
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="flex justify-end">
         <button 
          onClick={handleSave}
          disabled={saving}
          className="bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white font-bold py-4 px-12 rounded-2xl transition-all flex items-center gap-3 shadow-xl shadow-emerald-600/20 text-lg"
        >
          {saving ? <Loader2 size={24} className="animate-spin" /> : <Save size={24} />}
          Kaydet ve Kapat
        </button>
      </div>
    </div>
  );
}
