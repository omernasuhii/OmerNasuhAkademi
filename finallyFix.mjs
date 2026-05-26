import fs from 'fs';

const QUESTION_DATA = [
  {
    id: 'matematik',
    name: 'Matematik',
    icon: '➕',
    tyt: {
      totalQuestions: 30, // 30 mat + 10 geo = 40
      topics: [
        { name: 'Temel Kavramlar', data: [{ year: '2025', count: 3 }, { year: '2024', count: 3 }, { year: '2023', count: 3 }, { year: '2022', count: 3 }, { year: '2021', count: 3 }] },
        { name: 'Sayı Basamakları', data: [{ year: '2025', count: 1 }, { year: '2024', count: 2 }, { year: '2023', count: 2 }, { year: '2022', count: 1 }, { year: '2021', count: 2 }] },
        { name: 'Bölme ve Bölünebilme', data: [{ year: '2025', count: 1 }, { year: '2024', count: 1 }, { year: '2023', count: 1 }, { year: '2022', count: 1 }, { year: '2021', count: 1 }] },
        { name: 'EBOB-EKOK', data: [{ year: '2025', count: 0 }, { year: '2024', count: 0 }, { year: '2023', count: 0 }, { year: '2022', count: 0 }, { year: '2021', count: 0 }] },
        { name: 'Rasyonel Sayılar', data: [{ year: '2025', count: 2 }, { year: '2024', count: 2 }, { year: '2023', count: 1 }, { year: '2022', count: 2 }, { year: '2021', count: 1 }] },
        { name: 'Basit Eşitsizlikler', data: [{ year: '2025', count: 1 }, { year: '2024', count: 1 }, { year: '2023', count: 1 }, { year: '2022', count: 1 }, { year: '2021', count: 1 }] },
        { name: 'Mutlak Değer', data: [{ year: '2025', count: 1 }, { year: '2024', count: 1 }, { year: '2023', count: 1 }, { year: '2022', count: 1 }, { year: '2021', count: 1 }] },
        { name: 'Üslü Sayılar', data: [{ year: '2025', count: 1 }, { year: '2024', count: 1 }, { year: '2023', count: 1 }, { year: '2022', count: 1 }, { year: '2021', count: 1 }] },
        { name: 'Köklü Sayılar', data: [{ year: '2025', count: 1 }, { year: '2024', count: 1 }, { year: '2023', count: 1 }, { year: '2022', count: 1 }, { year: '2021', count: 1 }] },
        { name: 'Çarpanlara Ayırma', data: [{ year: '2025', count: 1 }, { year: '2024', count: 1 }, { year: '2023', count: 0 }, { year: '2022', count: 1 }, { year: '2021', count: 1 }] },
        { name: 'Oran Orantı', data: [{ year: '2025', count: 1 }, { year: '2024', count: 1 }, { year: '2023', count: 1 }, { year: '2022', count: 1 }, { year: '2021', count: 1 }] },
        { name: 'Problemler', data: [{ year: '2025', count: 12 }, { year: '2024', count: 11 }, { year: '2023', count: 13 }, { year: '2022', count: 13 }, { year: '2021', count: 11 }] },
        { name: 'Kümeler', data: [{ year: '2025', count: 1 }, { year: '2024', count: 1 }, { year: '2023', count: 1 }, { year: '2022', count: 1 }, { year: '2021', count: 1 }] },
        { name: 'Mantık', data: [{ year: '2025', count: 1 }, { year: '2024', count: 1 }, { year: '2023', count: 1 }, { year: '2022', count: 1 }, { year: '2021', count: 1 }] },
        { name: 'Fonksiyonlar', data: [{ year: '2025', count: 1 }, { year: '2024', count: 2 }, { year: '2023', count: 1 }, { year: '2022', count: 1 }, { year: '2021', count: 1 }] },
        { name: 'Polinomlar', data: [{ year: '2025', count: 0 }, { year: '2024', count: 0 }, { year: '2023', count: 1 }, { year: '2022', count: 0 }, { year: '2021', count: 0 }] },
        { name: 'Permütasyon-Kombinasyon-Olasılık', data: [{ year: '2025', count: 2 }, { year: '2024', count: 2 }, { year: '2023', count: 2 }, { year: '2022', count: 2 }, { year: '2021', count: 2 }] },
        { name: 'Veri - İstatistik', data: [{ year: '2025', count: 1 }, { year: '2024', count: 1 }, { year: '2023', count: 1 }, { year: '2022', count: 1 }, { year: '2021', count: 1 }] }
      ]
    },
    ayt: {
      totalQuestions: 30, // Geometri ayirdiysak 30 kalir
      topics: [
        { name: 'Polinomlar', data: [{ year: '2025', count: 2 }, { year: '2024', count: 2 }, { year: '2023', count: 2 }, { year: '2022', count: 1 }, { year: '2021', count: 1 }] },
        { name: '2. Dereceden Denklemler', data: [{ year: '2025', count: 1 }, { year: '2024', count: 1 }, { year: '2023', count: 1 }, { year: '2022', count: 0 }, { year: '2021', count: 1 }] },
        { name: 'Karmaşık Sayılar', data: [{ year: '2025', count: 1 }, { year: '2024', count: 1 }, { year: '2023', count: 1 }, { year: '2022', count: 1 }, { year: '2021', count: 1 }] },
        { name: 'Eşitsizlikler', data: [{ year: '2025', count: 1 }, { year: '2024', count: 1 }, { year: '2023', count: 1 }, { year: '2022', count: 1 }, { year: '2021', count: 1 }] },
        { name: 'Parabol', data: [{ year: '2025', count: 1 }, { year: '2024', count: 1 }, { year: '2023', count: 1 }, { year: '2022', count: 1 }, { year: '2021', count: 1 }] },
        { name: 'Logaritma', data: [{ year: '2025', count: 2 }, { year: '2024', count: 2 }, { year: '2023', count: 2 }, { year: '2022', count: 2 }, { year: '2021', count: 1 }] },
        { name: 'Diziler', data: [{ year: '2025', count: 2 }, { year: '2024', count: 2 }, { year: '2023', count: 1 }, { year: '2022', count: 1 }, { year: '2021', count: 1 }] },
        { name: 'Trigonometri', data: [{ year: '2025', count: 4 }, { year: '2024', count: 4 }, { year: '2023', count: 5 }, { year: '2022', count: 4 }, { year: '2021', count: 4 }] },
        { name: 'Limit ve Süreklilik', data: [{ year: '2025', count: 2 }, { year: '2024', count: 2 }, { year: '2023', count: 0 }, { year: '2022', count: 2 }, { year: '2021', count: 2 }] },
        { name: 'Türev', data: [{ year: '2025', count: 4 }, { year: '2024', count: 4 }, { year: '2023', count: 0 }, { year: '2022', count: 3 }, { year: '2021', count: 3 }] },
        { name: 'İntegral', data: [{ year: '2025', count: 4 }, { year: '2024', count: 4 }, { year: '2023', count: 0 }, { year: '2022', count: 4 }, { year: '2021', count: 4 }] }
      ]
    }
  },
  {
    id: 'turkce',
    name: 'Türkçe',
    icon: '🖋️',
    tyt: {
      totalQuestions: 40,
      topics: [
        { name: 'Sözcükte Anlam', data: [{ year: '2025', count: 4 }, { year: '2024', count: 4 }, { year: '2023', count: 3 }, { year: '2022', count: 4 }, { year: '2021', count: 3 }] },
        { name: 'Cümlede Anlam', data: [{ year: '2025', count: 3 }, { year: '2024', count: 3 }, { year: '2023', count: 4 }, { year: '2022', count: 3 }, { year: '2021', count: 4 }] },
        { name: 'Paragraf', data: [{ year: '2025', count: 26 }, { year: '2024', count: 26 }, { year: '2023', count: 26 }, { year: '2022', count: 26 }, { year: '2021', count: 25 }] },
        { name: 'Ses Bilgisi', data: [{ year: '2025', count: 1 }, { year: '2024', count: 1 }, { year: '2023', count: 1 }, { year: '2022', count: 1 }, { year: '2021', count: 1 }] },
        { name: 'Dil Bilgisi / Sözcük Türleri', data: [{ year: '2025', count: 2 }, { year: '2024', count: 2 }, { year: '2023', count: 2 }, { year: '2022', count: 2 }, { year: '2021', count: 2 }] },
        { name: 'Yazım Kuralları', data: [{ year: '2025', count: 2 }, { year: '2024', count: 2 }, { year: '2023', count: 2 }, { year: '2022', count: 2 }, { year: '2021', count: 2 }] },
        { name: 'Noktalama İşaretleri', data: [{ year: '2025', count: 2 }, { year: '2024', count: 2 }, { year: '2023', count: 2 }, { year: '2022', count: 2 }, { year: '2021', count: 2 }] },
        { name: 'Anlatım Bozukluğu', data: [{ year: '2025', count: 0 }, { year: '2024', count: 0 }, { year: '2023', count: 0 }, { year: '2022', count: 0 }, { year: '2021', count: 1 }] }
      ]
    },
    ayt: {
      totalQuestions: 24, // Edebiyat
      topics: [
        { name: 'Edebiyat Akımları', data: [{ year: '2025', count: 1 }, { year: '2024', count: 1 }, { year: '2023', count: 1 }, { year: '2022', count: 1 }, { year: '2021', count: 1 }] },
        { name: 'Şiir Bilgisi', data: [{ year: '2025', count: 3 }, { year: '2024', count: 3 }, { year: '2023', count: 3 }, { year: '2022', count: 3 }, { year: '2021', count: 3 }] },
        { name: 'İslamiyet Öncesi ve Geçiş', data: [{ year: '2025', count: 1 }, { year: '2024', count: 1 }, { year: '2023', count: 1 }, { year: '2022', count: 1 }, { year: '2021', count: 1 }] },
        { name: 'Halk Edebiyatı', data: [{ year: '2025', count: 2 }, { year: '2024', count: 2 }, { year: '2023', count: 2 }, { year: '2022', count: 2 }, { year: '2021', count: 2 }] },
        { name: 'Divan Edebiyatı', data: [{ year: '2025', count: 4 }, { year: '2024', count: 5 }, { year: '2023', count: 5 }, { year: '2022', count: 4 }, { year: '2021', count: 5 }] },
        { name: 'Tanzimat Edebiyatı', data: [{ year: '2025', count: 2 }, { year: '2024', count: 2 }, { year: '2023', count: 1 }, { year: '2022', count: 2 }, { year: '2021', count: 2 }] },
        { name: 'Servetifünun ve Fecriati', data: [{ year: '2025', count: 1 }, { year: '2024', count: 1 }, { year: '2023', count: 1 }, { year: '2022', count: 1 }, { year: '2021', count: 1 }] },
        { name: 'Milli Edebiyat', data: [{ year: '2025', count: 1 }, { year: '2024', count: 1 }, { year: '2023', count: 1 }, { year: '2022', count: 1 }, { year: '2021', count: 1 }] },
        { name: 'Cumhuriyet Dönemi', data: [{ year: '2025', count: 3 }, { year: '2024', count: 3 }, { year: '2023', count: 0 }, { year: '2022', count: 3 }, { year: '2021', count: 3 }] },
        { name: 'Paragraf / Anlam', data: [{ year: '2025', count: 6 }, { year: '2024', count: 5 }, { year: '2023', count: 6 }, { year: '2022', count: 6 }, { year: '2021', count: 6 }] }
      ]
    }
  },
  {
    id: 'fizik',
    name: 'Fizik',
    icon: '⚡',
    tyt: {
      totalQuestions: 7,
      topics: [
        { name: 'Fizik Bilimine Giriş', data: [{ year: '2025', count: 1 }, { year: '2024', count: 1 }, { year: '2023', count: 1 }, { year: '2022', count: 1 }, { year: '2021', count: 1 }] },
        { name: 'Madde ve Özellikleri', data: [{ year: '2025', count: 1 }, { year: '2024', count: 1 }, { year: '2023', count: 1 }, { year: '2022', count: 1 }, { year: '2021', count: 0 }] },
        { name: 'Hareket ve Kuvvet', data: [{ year: '2025', count: 1 }, { year: '2024', count: 1 }, { year: '2023', count: 1 }, { year: '2022', count: 1 }, { year: '2021', count: 1 }] },
        { name: 'İş, Güç ve Enerji', data: [{ year: '2025', count: 1 }, { year: '2024', count: 0 }, { year: '2023', count: 0 }, { year: '2022', count: 0 }, { year: '2021', count: 1 }] },
        { name: 'Isı, Sıcaklık', data: [{ year: '2025', count: 1 }, { year: '2024', count: 1 }, { year: '2023', count: 1 }, { year: '2022', count: 1 }, { year: '2021', count: 1 }] },
        { name: 'Elektrik ve Manyetizma', data: [{ year: '2025', count: 1 }, { year: '2024', count: 1 }, { year: '2023', count: 1 }, { year: '2022', count: 1 }, { year: '2021', count: 1 }] },
        { name: 'Sıvıların Kaldırma Kuvveti', data: [{ year: '2025', count: 0 }, { year: '2024', count: 0 }, { year: '2023', count: 1 }, { year: '2022', count: 1 }, { year: '2021', count: 0 }] },
        { name: 'Basınç', data: [{ year: '2025', count: 0 }, { year: '2024', count: 1 }, { year: '2023', count: 0 }, { year: '2022', count: 0 }, { year: '2021', count: 1 }] },
        { name: 'Optik', data: [{ year: '2025', count: 1 }, { year: '2024', count: 1 }, { year: '2023', count: 1 }, { year: '2022', count: 1 }, { year: '2021', count: 1 }] },
        { name: 'Dalgalar', data: [{ year: '2025', count: 0 }, { year: '2024', count: 0 }, { year: '2023', count: 0 }, { year: '2022', count: 0 }, { year: '2021', count: 0 }] }
      ]
    },
    ayt: {
      totalQuestions: 14,
      topics: [
        { name: 'Vektörler ve Bağıl Hareket', data: [{ year: '2025', count: 1 }, { year: '2024', count: 1 }, { year: '2023', count: 1 }, { year: '2022', count: 1 }, { year: '2021', count: 1 }] },
        { name: 'Newton Hareket Yasaları', data: [{ year: '2025', count: 1 }, { year: '2024', count: 1 }, { year: '2023', count: 1 }, { year: '2022', count: 1 }, { year: '2021', count: 1 }] },
        { name: 'Atışlar ve Enerji', data: [{ year: '2025', count: 2 }, { year: '2024', count: 2 }, { year: '2023', count: 2 }, { year: '2022', count: 2 }, { year: '2021', count: 2 }] },
        { name: 'İtme ve Momentum', data: [{ year: '2025', count: 1 }, { year: '2024', count: 1 }, { year: '2023', count: 1 }, { year: '2022', count: 1 }, { year: '2021', count: 1 }] },
        { name: 'Elektriksel Kuvvet ve Alan', data: [{ year: '2025', count: 1 }, { year: '2024', count: 1 }, { year: '2023', count: 1 }, { year: '2022', count: 1 }, { year: '2021', count: 1 }] },
        { name: 'Manyetizma', data: [{ year: '2025', count: 2 }, { year: '2024', count: 2 }, { year: '2023', count: 2 }, { year: '2022', count: 2 }, { year: '2021', count: 1 }] },
        { name: 'Çembersel Hareket', data: [{ year: '2025', count: 2 }, { year: '2024', count: 2 }, { year: '2023', count: 2 }, { year: '2022', count: 1 }, { year: '2021', count: 1 }] },
        { name: 'Basit Harmonik Hareket', data: [{ year: '2025', count: 1 }, { year: '2024', count: 1 }, { year: '2023', count: 1 }, { year: '2022', count: 1 }, { year: '2021', count: 1 }] },
        { name: 'Dalga Mekaniği', data: [{ year: '2025', count: 1 }, { year: '2024', count: 1 }, { year: '2023', count: 1 }, { year: '2022', count: 1 }, { year: '2021', count: 1 }] },
        { name: 'Modern Fizik', data: [{ year: '2025', count: 2 }, { year: '2024', count: 2 }, { year: '2023', count: 0 }, { year: '2022', count: 2 }, { year: '2021', count: 2 }] }
      ]
    }
  },
  {
    id: 'geometri',
    name: 'Geometri',
    icon: '📐',
    tyt: {
      totalQuestions: 10,
      topics: [
        { name: 'Doğruda ve Üçgende Açılar', data: [{ year: '2025', count: 1 }, { year: '2024', count: 1 }, { year: '2023', count: 1 }, { year: '2022', count: 1 }, { year: '2021', count: 1 }] },
        { name: 'Özel Üçgenler', data: [{ year: '2025', count: 1 }, { year: '2024', count: 1 }, { year: '2023', count: 1 }, { year: '2022', count: 1 }, { year: '2021', count: 1 }] },
        { name: 'Üçgende Alan ve Benzerlik', data: [{ year: '2025', count: 1 }, { year: '2024', count: 1 }, { year: '2023', count: 1 }, { year: '2022', count: 1 }, { year: '2021', count: 1 }] },
        { name: 'Çokgenler', data: [{ year: '2025', count: 1 }, { year: '2024', count: 1 }, { year: '2023', count: 1 }, { year: '2022', count: 1 }, { year: '2021', count: 1 }] },
        { name: 'Dörtgenler', data: [{ year: '2025', count: 3 }, { year: '2024', count: 3 }, { year: '2023', count: 3 }, { year: '2022', count: 3 }, { year: '2021', count: 3 }] },
        { name: 'Çember ve Daire', data: [{ year: '2025', count: 1 }, { year: '2024', count: 1 }, { year: '2023', count: 0 }, { year: '2022', count: 0 }, { year: '2021', count: 0 }] },
        { name: 'Analitik Geometri', data: [{ year: '2025', count: 1 }, { year: '2024', count: 1 }, { year: '2023', count: 1 }, { year: '2022', count: 1 }, { year: '2021', count: 1 }] },
        { name: 'Katı Cisimler', data: [{ year: '2025', count: 1 }, { year: '2024', count: 1 }, { year: '2023', count: 2 }, { year: '2022', count: 2 }, { year: '2021', count: 2 }] }
      ]
    },
    ayt: {
      totalQuestions: 10,
      topics: [
        { name: 'Trigonometri', data: [{ year: '2025', count: 3 }, { year: '2024', count: 3 }, { year: '2023', count: 4 }, { year: '2022', count: 4 }, { year: '2021', count: 4 }] },
        { name: 'Analitik Geometri', data: [{ year: '2025', count: 3 }, { year: '2024', count: 3 }, { year: '2023', count: 3 }, { year: '2022', count: 3 }, { year: '2021', count: 3 }] },
        { name: 'Çember ve Daire', data: [{ year: '2025', count: 2 }, { year: '2024', count: 2 }, { year: '2023', count: 2 }, { year: '2022', count: 1 }, { year: '2021', count: 2 }] },
        { name: 'Katı Cisimler', data: [{ year: '2025', count: 1 }, { year: '2024', count: 1 }, { year: '2023', count: 1 }, { year: '2022', count: 1 }, { year: '2021', count: 1 }] },
        { name: 'Dönüşümler', data: [{ year: '2025', count: 1 }, { year: '2024', count: 1 }, { year: '2023', count: 0 }, { year: '2022', count: 1 }, { year: '2021', count: 1 }] }
      ]
    }
  },
  {
    id: 'kimya',
    name: 'Kimya',
    icon: '🧪',
    tyt: {
      totalQuestions: 7,
      topics: [
        { name: 'Kimya Bilimi', data: [{ year: '2025', count: 1 }, { year: '2024', count: 1 }, { year: '2023', count: 1 }, { year: '2022', count: 1 }, { year: '2021', count: 1 }] },
        { name: 'Atom ve Periyodik Sistem', data: [{ year: '2025', count: 1 }, { year: '2024', count: 1 }, { year: '2023', count: 1 }, { year: '2022', count: 1 }, { year: '2021', count: 1 }] },
        { name: 'Kimyasal Türler Arası Etkileşimler', data: [{ year: '2025', count: 1 }, { year: '2024', count: 1 }, { year: '2023', count: 1 }, { year: '2022', count: 1 }, { year: '2021', count: 1 }] },
        { name: 'Maddenin Halleri', data: [{ year: '2025', count: 1 }, { year: '2024', count: 1 }, { year: '2023', count: 1 }, { year: '2022', count: 1 }, { year: '2021', count: 1 }] },
        { name: 'Kimyanın Temel Kanunları', data: [{ year: '2025', count: 1 }, { year: '2024', count: 1 }, { year: '2023', count: 1 }, { year: '2022', count: 1 }, { year: '2021', count: 1 }] },
        { name: 'Karışımlar', data: [{ year: '2025', count: 1 }, { year: '2024', count: 1 }, { year: '2023', count: 1 }, { year: '2022', count: 1 }, { year: '2021', count: 1 }] },
        { name: 'Asit, Baz ve Tuzlar', data: [{ year: '2025', count: 1 }, { year: '2024', count: 1 }, { year: '2023', count: 1 }, { year: '2022', count: 1 }, { year: '2021', count: 1 }] }
      ]
    },
    ayt: {
      totalQuestions: 13,
      topics: [
        { name: 'Modern Atom Teorisi', data: [{ year: '2025', count: 1 }, { year: '2024', count: 1 }, { year: '2023', count: 1 }, { year: '2022', count: 1 }, { year: '2021', count: 1 }] },
        { name: 'Gazlar', data: [{ year: '2025', count: 1 }, { year: '2024', count: 1 }, { year: '2023', count: 1 }, { year: '2022', count: 1 }, { year: '2021', count: 1 }] },
        { name: 'Sıvı Çözeltiler', data: [{ year: '2025', count: 2 }, { year: '2024', count: 2 }, { year: '2023', count: 2 }, { year: '2022', count: 2 }, { year: '2021', count: 1 }] },
        { name: 'Kimyasal Enerji', data: [{ year: '2025', count: 1 }, { year: '2024', count: 1 }, { year: '2023', count: 1 }, { year: '2022', count: 1 }, { year: '2021', count: 1 }] },
        { name: 'Kinetik (Hız)', data: [{ year: '2025', count: 1 }, { year: '2024', count: 1 }, { year: '2023', count: 1 }, { year: '2022', count: 1 }, { year: '2021', count: 1 }] },
        { name: 'Kimyasal Denge', data: [{ year: '2025', count: 2 }, { year: '2024', count: 2 }, { year: '2023', count: 2 }, { year: '2022', count: 1 }, { year: '2021', count: 2 }] },
        { name: 'Elektrokimya', data: [{ year: '2025', count: 2 }, { year: '2024', count: 2 }, { year: '2023', count: 3 }, { year: '2022', count: 2 }, { year: '2021', count: 2 }] },
        { name: 'Organik Kimya', data: [{ year: '2025', count: 3 }, { year: '2024', count: 3 }, { year: '2023', count: 2 }, { year: '2022', count: 4 }, { year: '2021', count: 4 }] }
      ]
    }
  },
  {
    id: 'biyoloji',
    name: 'Biyoloji',
    icon: '🌿',
    tyt: {
      totalQuestions: 6,
      topics: [
        { name: 'Canlıların Ortak Özellikleri', data: [{ year: '2025', count: 0 }, { year: '2024', count: 1 }, { year: '2023', count: 0 }, { year: '2022', count: 0 }, { year: '2021', count: 0 }] },
        { name: 'Canlıların Temel Bileşenleri', data: [{ year: '2025', count: 1 }, { year: '2024', count: 1 }, { year: '2023', count: 1 }, { year: '2022', count: 1 }, { year: '2021', count: 1 }] },
        { name: 'Hücre ve Organelleri', data: [{ year: '2025', count: 1 }, { year: '2024', count: 1 }, { year: '2023', count: 1 }, { year: '2022', count: 1 }, { year: '2021', count: 1 }] },
        { name: 'Canlıların Sınıflandırılması', data: [{ year: '2025', count: 1 }, { year: '2024', count: 1 }, { year: '2023', count: 1 }, { year: '2022', count: 1 }, { year: '2021', count: 1 }] },
        { name: 'Hücre Bölünmeleri ve Üreme', data: [{ year: '2025', count: 1 }, { year: '2024', count: 0 }, { year: '2023', count: 1 }, { year: '2022', count: 1 }, { year: '2021', count: 1 }] },
        { name: 'Kalıtım', data: [{ year: '2025', count: 1 }, { year: '2024', count: 1 }, { year: '2023', count: 1 }, { year: '2022', count: 1 }, { year: '2021', count: 1 }] },
        { name: 'Ekosistem Ekolojisi', data: [{ year: '2025', count: 1 }, { year: '2024', count: 1 }, { year: '2023', count: 1 }, { year: '2022', count: 1 }, { year: '2021', count: 1 }] }
      ]
    },
    ayt: {
      totalQuestions: 13,
      topics: [
        { name: 'Sinir Sistemi', data: [{ year: '2025', count: 1 }, { year: '2024', count: 1 }, { year: '2023', count: 1 }, { year: '2022', count: 1 }, { year: '2021', count: 1 }] },
        { name: 'Endokrin Sistem', data: [{ year: '2025', count: 1 }, { year: '2024', count: 1 }, { year: '2023', count: 1 }, { year: '2022', count: 1 }, { year: '2021', count: 1 }] },
        { name: 'Duyu Organları', data: [{ year: '2025', count: 0 }, { year: '2024', count: 0 }, { year: '2023', count: 1 }, { year: '2022', count: 0 }, { year: '2021', count: 0 }] },
        { name: 'Destek ve Hareket', data: [{ year: '2025', count: 1 }, { year: '2024', count: 1 }, { year: '2023', count: 1 }, { year: '2022', count: 1 }, { year: '2021', count: 1 }] },
        { name: 'Sindirim Sistemi', data: [{ year: '2025', count: 1 }, { year: '2024', count: 1 }, { year: '2023', count: 1 }, { year: '2022', count: 1 }, { year: '2021', count: 1 }] },
        { name: 'Dolaşım Sistemi', data: [{ year: '2025', count: 1 }, { year: '2024', count: 1 }, { year: '2023', count: 1 }, { year: '2022', count: 1 }, { year: '2021', count: 1 }] },
        { name: 'Solunum Sistemi', data: [{ year: '2025', count: 1 }, { year: '2024', count: 1 }, { year: '2023', count: 1 }, { year: '2022', count: 1 }, { year: '2021', count: 1 }] },
        { name: 'Boşaltım Sistemi', data: [{ year: '2025', count: 1 }, { year: '2024', count: 1 }, { year: '2023', count: 1 }, { year: '2022', count: 1 }, { year: '2021', count: 1 }] },
        { name: 'Üreme Sistemi', data: [{ year: '2025', count: 1 }, { year: '2024', count: 1 }, { year: '2023', count: 1 }, { year: '2022', count: 1 }, { year: '2021', count: 1 }] },
        { name: 'Genden Proteine', data: [{ year: '2025', count: 2 }, { year: '2024', count: 2 }, { year: '2023', count: 2 }, { year: '2022', count: 2 }, { year: '2021', count: 2 }] },
        { name: 'Hücresel Solunum', data: [{ year: '2025', count: 1 }, { year: '2024', count: 1 }, { year: '2023', count: 1 }, { year: '2022', count: 1 }, { year: '2021', count: 1 }] },
        { name: 'Fotosentez / Kemosentez', data: [{ year: '2025', count: 1 }, { year: '2024', count: 1 }, { year: '2023', count: 1 }, { year: '2022', count: 1 }, { year: '2021', count: 1 }] },
        { name: 'Bitki Biyolojisi', data: [{ year: '2025', count: 1 }, { year: '2024', count: 1 }, { year: '2023', count: 0 }, { year: '2022', count: 1 }, { year: '2021', count: 1 }] }
      ]
    }
  },
  {
    id: 'tarih',
    name: 'Tarih',
    icon: '📜',
    tyt: {
      totalQuestions: 5,
      topics: [
        { name: 'Tarih ve Zaman', data: [{ year: '2025', count: 0 }, { year: '2024', count: 0 }, { year: '2023', count: 0 }, { year: '2022', count: 0 }, { year: '2021', count: 0 }] },
        { name: 'İlk ve Orta Çağlarda Türk Dünyası', data: [{ year: '2025', count: 1 }, { year: '2024', count: 1 }, { year: '2023', count: 1 }, { year: '2022', count: 1 }, { year: '2021', count: 1 }] },
        { name: 'İslam Medeniyetinin Doğuşu', data: [{ year: '2025', count: 0 }, { year: '2024', count: 0 }, { year: '2023', count: 0 }, { year: '2022', count: 0 }, { year: '2021', count: 0 }] },
        { name: 'Türklerin İslamiyet\'i Kabulü', data: [{ year: '2025', count: 1 }, { year: '2024', count: 1 }, { year: '2023', count: 1 }, { year: '2022', count: 1 }, { year: '2021', count: 1 }] },
        { name: 'Beylikten Devlete Osmanlı', data: [{ year: '2025', count: 1 }, { year: '2024', count: 1 }, { year: '2023', count: 1 }, { year: '2022', count: 1 }, { year: '2021', count: 1 }] },
        { name: 'Dünya Gücü Osmanlı', data: [{ year: '2025', count: 0 }, { year: '2024', count: 0 }, { year: '2023', count: 0 }, { year: '2022', count: 0 }, { year: '2021', count: 0 }] },
        { name: 'XX. Yüzyıl Başlarında Osmanlı', data: [{ year: '2025', count: 1 }, { year: '2024', count: 1 }, { year: '2023', count: 1 }, { year: '2022', count: 1 }, { year: '2021', count: 1 }] },
        { name: 'Milli Mücadele', data: [{ year: '2025', count: 1 }, { year: '2024', count: 1 }, { year: '2023', count: 1 }, { year: '2022', count: 1 }, { year: '2021', count: 1 }] }
      ]
    },
    ayt: {
      totalQuestions: 21,
      topics: [
        { name: 'Tarih Bilimi', data: [{ year: '2025', count: 1 }, { year: '2024', count: 1 }, { year: '2023', count: 1 }, { year: '2022', count: 1 }, { year: '2021', count: 1 }] },
        { name: 'İlk Çağ Medeniyetleri', data: [{ year: '2025', count: 1 }, { year: '2024', count: 1 }, { year: '2023', count: 1 }, { year: '2022', count: 1 }, { year: '2021', count: 1 }] },
        { name: 'İslamiyet Öncesi Türk Tarihi', data: [{ year: '2025', count: 1 }, { year: '2024', count: 1 }, { year: '2023', count: 1 }, { year: '2022', count: 1 }, { year: '2021', count: 1 }] },
        { name: 'İslam Tarihi', data: [{ year: '2025', count: 1 }, { year: '2024', count: 1 }, { year: '2023', count: 1 }, { year: '2022', count: 1 }, { year: '2021', count: 1 }] },
        { name: 'Türk İslam Devletleri', data: [{ year: '2025', count: 2 }, { year: '2024', count: 2 }, { year: '2023', count: 2 }, { year: '2022', count: 2 }, { year: '2021', count: 2 }] },
        { name: 'Osmanlı Siyasi (Kuruluş-Yükselme)', data: [{ year: '2025', count: 2 }, { year: '2024', count: 2 }, { year: '2023', count: 2 }, { year: '2022', count: 2 }, { year: '2021', count: 2 }] },
        { name: 'Osmanlı Siyasi (Duraklama-Gerileme)', data: [{ year: '2025', count: 1 }, { year: '2024', count: 1 }, { year: '2023', count: 1 }, { year: '2022', count: 1 }, { year: '2021', count: 1 }] },
        { name: 'Osmanlı Dağılma / XX. YY', data: [{ year: '2025', count: 2 }, { year: '2024', count: 2 }, { year: '2023', count: 2 }, { year: '2022', count: 2 }, { year: '2021', count: 2 }] },
        { name: 'Milli Mücadele Dönemi', data: [{ year: '2025', count: 4 }, { year: '2024', count: 4 }, { year: '2023', count: 4 }, { year: '2022', count: 4 }, { year: '2021', count: 4 }] },
        { name: 'Atatürk İlkeleri ve İnkılaplar', data: [{ year: '2025', count: 3 }, { year: '2024', count: 3 }, { year: '2023', count: 3 }, { year: '2022', count: 3 }, { year: '2021', count: 3 }] },
        { name: 'Çağdaş Türk ve Dünya Tarihi', data: [{ year: '2025', count: 3 }, { year: '2024', count: 3 }, { year: '2023', count: 3 }, { year: '2022', count: 3 }, { year: '2021', count: 3 }] }
      ]
    }
  },
  {
    id: 'cografya',
    name: 'Coğrafya',
    icon: '🌍',
    tyt: {
      totalQuestions: 5,
      topics: [
        { name: 'Doğa ve İnsan', data: [{ year: '2025', count: 1 }, { year: '2024', count: 1 }, { year: '2023', count: 1 }, { year: '2022', count: 1 }, { year: '2021', count: 1 }] },
        { name: 'Dünya\'nın Şekli ve Hareketleri', data: [{ year: '2025', count: 0 }, { year: '2024', count: 0 }, { year: '2023', count: 0 }, { year: '2022', count: 0 }, { year: '2021', count: 0 }] },
        { name: 'İklim Bilgisi', data: [{ year: '2025', count: 1 }, { year: '2024', count: 1 }, { year: '2023', count: 1 }, { year: '2022', count: 1 }, { year: '2021', count: 1 }] },
        { name: 'İç ve Dış Kuvvetler', data: [{ year: '2025', count: 1 }, { year: '2024', count: 1 }, { year: '2023', count: 1 }, { year: '2022', count: 1 }, { year: '2021', count: 1 }] },
        { name: 'Nüfus ve Yerleşme', data: [{ year: '2025', count: 1 }, { year: '2024', count: 1 }, { year: '2023', count: 1 }, { year: '2022', count: 1 }, { year: '2021', count: 1 }] },
        { name: 'Bölgeler ve Ulaşım', data: [{ year: '2025', count: 1 }, { year: '2024', count: 1 }, { year: '2023', count: 1 }, { year: '2022', count: 1 }, { year: '2021', count: 1 }] }
      ]
    },
    ayt: {
      totalQuestions: 17,
      topics: [
        { name: 'Ekstrem Doğa Olayları', data: [{ year: '2025', count: 1 }, { year: '2024', count: 1 }, { year: '2023', count: 1 }, { year: '2022', count: 1 }, { year: '2021', count: 1 }] },
        { name: 'Ekosistem ve Madde Döngüsü', data: [{ year: '2025', count: 2 }, { year: '2024', count: 2 }, { year: '2023', count: 2 }, { year: '2022', count: 2 }, { year: '2021', count: 2 }] },
        { name: 'Nüfus Politikaları', data: [{ year: '2025', count: 1 }, { year: '2024', count: 1 }, { year: '2023', count: 1 }, { year: '2022', count: 1 }, { year: '2021', count: 1 }] },
        { name: 'Türkiye Ekonomi ve Tarım', data: [{ year: '2025', count: 4 }, { year: '2024', count: 4 }, { year: '2023', count: 4 }, { year: '2022', count: 4 }, { year: '2021', count: 4 }] },
        { name: 'Küresel ve Bölgesel Örgütler', data: [{ year: '2025', count: 1 }, { year: '2024', count: 1 }, { year: '2023', count: 1 }, { year: '2022', count: 1 }, { year: '2021', count: 1 }] },
        { name: 'Ülkeler Coğrafyası', data: [{ year: '2025', count: 2 }, { year: '2024', count: 2 }, { year: '2023', count: 2 }, { year: '2022', count: 2 }, { year: '2021', count: 2 }] },
        { name: 'Çevre Sorunları', data: [{ year: '2025', count: 2 }, { year: '2024', count: 2 }, { year: '2023', count: 2 }, { year: '2022', count: 2 }, { year: '2021', count: 2 }] }
      ]
    }
  },
  {
    id: 'felsefe',
    name: 'Felsefe',
    icon: '🧠',
    tyt: {
      totalQuestions: 5,
      topics: [
        { name: 'Felsefeyi Tanıma', data: [{ year: '2025', count: 1 }, { year: '2024', count: 1 }, { year: '2023', count: 1 }, { year: '2022', count: 1 }, { year: '2021', count: 1 }] },
        { name: 'Bilgi Felsefesi', data: [{ year: '2025', count: 1 }, { year: '2024', count: 1 }, { year: '2023', count: 1 }, { year: '2022', count: 1 }, { year: '2021', count: 1 }] },
        { name: 'Varlık Felsefesi', data: [{ year: '2025', count: 1 }, { year: '2024', count: 1 }, { year: '2023', count: 1 }, { year: '2022', count: 1 }, { year: '2021', count: 1 }] },
        { name: 'Ahlak Felsefesi', data: [{ year: '2025', count: 1 }, { year: '2024', count: 1 }, { year: '2023', count: 1 }, { year: '2022', count: 1 }, { year: '2021', count: 1 }] },
        { name: 'Siyaset Felsefesi', data: [{ year: '2025', count: 1 }, { year: '2024', count: 1 }, { year: '2023', count: 1 }, { year: '2022', count: 1 }, { year: '2021', count: 1 }] }
      ]
    },
    ayt: {
      totalQuestions: 12,
      topics: [
        { name: 'Mantık', data: [{ year: '2025', count: 3 }, { year: '2024', count: 3 }, { year: '2023', count: 3 }, { year: '2022', count: 3 }, { year: '2021', count: 3 }] },
        { name: 'Psikoloji', data: [{ year: '2025', count: 3 }, { year: '2024', count: 3 }, { year: '2023', count: 3 }, { year: '2022', count: 3 }, { year: '2021', count: 3 }] },
        { name: 'Sosyoloji', data: [{ year: '2025', count: 3 }, { year: '2024', count: 3 }, { year: '2023', count: 3 }, { year: '2022', count: 3 }, { year: '2021', count: 3 }] },
        { name: 'Felsefe Tarihi', data: [{ year: '2025', count: 3 }, { year: '2024', count: 3 }, { year: '2023', count: 3 }, { year: '2022', count: 3 }, { year: '2021', count: 3 }] }
      ]
    }
  },
  {
    id: 'din',
    name: 'Din',
    icon: '🕌',
    tyt: {
      totalQuestions: 5,
      topics: [
        { name: 'Bilgi ve İnanç', data: [{ year: '2025', count: 1 }, { year: '2024', count: 1 }, { year: '2023', count: 1 }, { year: '2022', count: 1 }, { year: '2021', count: 1 }] },
        { name: 'İbadet ve Ahlak', data: [{ year: '2025', count: 2 }, { year: '2024', count: 2 }, { year: '2023', count: 2 }, { year: '2022', count: 2 }, { year: '2021', count: 2 }] },
        { name: 'Hz. Muhammed ve İslam', data: [{ year: '2025', count: 1 }, { year: '2024', count: 1 }, { year: '2023', count: 1 }, { year: '2022', count: 1 }, { year: '2021', count: 1 }] },
        { name: 'Kur\'an-ı Kerim\'de Bazı Kavramlar', data: [{ year: '2025', count: 1 }, { year: '2024', count: 1 }, { year: '2023', count: 1 }, { year: '2022', count: 1 }, { year: '2021', count: 1 }] }
      ]
    },
    ayt: {
      totalQuestions: 6,
      topics: [
        { name: 'İslam ve Bilim', data: [{ year: '2025', count: 1 }, { year: '2024', count: 1 }, { year: '2023', count: 1 }, { year: '2022', count: 1 }, { year: '2021', count: 1 }] },
        { name: 'Anadolu\'da İslam', data: [{ year: '2025', count: 1 }, { year: '2024', count: 1 }, { year: '2023', count: 1 }, { year: '2022', count: 1 }, { year: '2021', count: 1 }] },
        { name: 'İslam Düşüncesinde Yorumlar', data: [{ year: '2025', count: 1 }, { year: '2024', count: 1 }, { year: '2023', count: 1 }, { year: '2022', count: 1 }, { year: '2021', count: 1 }] },
        { name: 'Dinler', data: [{ year: '2025', count: 1 }, { year: '2024', count: 1 }, { year: '2023', count: 1 }, { year: '2022', count: 1 }, { year: '2021', count: 1 }] },
        { name: 'İslam Ahlakı', data: [{ year: '2025', count: 2 }, { year: '2024', count: 2 }, { year: '2023', count: 2 }, { year: '2022', count: 2 }, { year: '2021', count: 2 }] }
      ]
    }
  }
];

let content = fs.readFileSync('src/pages/students/QuestionAnalysis.tsx', 'utf8');

// The original QUESTION_DATA declaration looks like:  `const QUESTION_DATA: SubjectAnalysis[] = [`
// We will replace everything from `const QUESTION_DATA: SubjectAnalysis[] = [` to the `];` before `export default function QuestionAnalysis() {`

const startTag = 'const QUESTION_DATA: SubjectAnalysis[] = [';
const startIndex = content.indexOf(startTag);
if (startIndex !== -1) {
  // Find the exact `];` before `export default function`
  const exportIndex = content.indexOf('export default function QuestionAnalysis');
  const endIndex = content.lastIndexOf('];', exportIndex);
  
  if (endIndex !== -1) {
    // Stringify our array to valid TS array syntax
    const arrayStr = JSON.stringify(QUESTION_DATA, null, 2).replace(/"([^"]+)":/g, '$1:');
    
    // Replace it in content
    const newContent = content.substring(0, startIndex) +
                       'const QUESTION_DATA: SubjectAnalysis[] = ' +
                       arrayStr + ';' +
                       content.substring(endIndex + 2);
                       
    fs.writeFileSync('src/pages/students/QuestionAnalysis.tsx', newContent, 'utf8');
  }
}
