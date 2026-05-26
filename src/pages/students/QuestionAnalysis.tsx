import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  BarChart3, 
  Target, 
  HelpCircle, 
  TrendingUp,
  LineChart,
  Calendar,
  ChevronRight,
  Sparkles,
  PieChart
} from 'lucide-react';

interface YearAnalysis {
  year: string;
  count: number;
}

interface TopicAnalysis {
  name: string;
  data: YearAnalysis[];
}

interface ExamData {
  totalQuestions: number;
  topics: TopicAnalysis[];
}

interface SubjectAnalysis {
  id: string;
  name: string;
  icon: string;
  tyt?: ExamData;
  ayt?: ExamData;
}

const QUESTION_DATA: SubjectAnalysis[] = [
  {
    id: "matematik",
    name: "Matematik",
    icon: "➕",
    tyt: {
      totalQuestions: 30,
      topics: [
        {
          name: "Temel Kavramlar",
          data: [
            {
              year: "2025",
              count: 3
            },
            {
              year: "2024",
              count: 3
            },
            {
              year: "2023",
              count: 3
            },
            {
              year: "2022",
              count: 3
            },
            {
              year: "2021",
              count: 3
            }
          ]
        },
        {
          name: "Sayı Basamakları",
          data: [
            {
              year: "2025",
              count: 1
            },
            {
              year: "2024",
              count: 2
            },
            {
              year: "2023",
              count: 2
            },
            {
              year: "2022",
              count: 1
            },
            {
              year: "2021",
              count: 2
            }
          ]
        },
        {
          name: "Bölme ve Bölünebilme",
          data: [
            {
              year: "2025",
              count: 1
            },
            {
              year: "2024",
              count: 1
            },
            {
              year: "2023",
              count: 1
            },
            {
              year: "2022",
              count: 1
            },
            {
              year: "2021",
              count: 1
            }
          ]
        },
        {
          name: "EBOB-EKOK",
          data: [
            {
              year: "2025",
              count: 0
            },
            {
              year: "2024",
              count: 0
            },
            {
              year: "2023",
              count: 0
            },
            {
              year: "2022",
              count: 0
            },
            {
              year: "2021",
              count: 0
            }
          ]
        },
        {
          name: "Rasyonel Sayılar",
          data: [
            {
              year: "2025",
              count: 2
            },
            {
              year: "2024",
              count: 2
            },
            {
              year: "2023",
              count: 1
            },
            {
              year: "2022",
              count: 2
            },
            {
              year: "2021",
              count: 1
            }
          ]
        },
        {
          name: "Basit Eşitsizlikler",
          data: [
            {
              year: "2025",
              count: 1
            },
            {
              year: "2024",
              count: 1
            },
            {
              year: "2023",
              count: 1
            },
            {
              year: "2022",
              count: 1
            },
            {
              year: "2021",
              count: 1
            }
          ]
        },
        {
          name: "Mutlak Değer",
          data: [
            {
              year: "2025",
              count: 1
            },
            {
              year: "2024",
              count: 1
            },
            {
              year: "2023",
              count: 1
            },
            {
              year: "2022",
              count: 1
            },
            {
              year: "2021",
              count: 1
            }
          ]
        },
        {
          name: "Üslü Sayılar",
          data: [
            {
              year: "2025",
              count: 1
            },
            {
              year: "2024",
              count: 1
            },
            {
              year: "2023",
              count: 1
            },
            {
              year: "2022",
              count: 1
            },
            {
              year: "2021",
              count: 1
            }
          ]
        },
        {
          name: "Köklü Sayılar",
          data: [
            {
              year: "2025",
              count: 1
            },
            {
              year: "2024",
              count: 1
            },
            {
              year: "2023",
              count: 1
            },
            {
              year: "2022",
              count: 1
            },
            {
              year: "2021",
              count: 1
            }
          ]
        },
        {
          name: "Çarpanlara Ayırma",
          data: [
            {
              year: "2025",
              count: 1
            },
            {
              year: "2024",
              count: 1
            },
            {
              year: "2023",
              count: 0
            },
            {
              year: "2022",
              count: 1
            },
            {
              year: "2021",
              count: 1
            }
          ]
        },
        {
          name: "Oran Orantı",
          data: [
            {
              year: "2025",
              count: 1
            },
            {
              year: "2024",
              count: 1
            },
            {
              year: "2023",
              count: 1
            },
            {
              year: "2022",
              count: 1
            },
            {
              year: "2021",
              count: 1
            }
          ]
        },
        {
          name: "Problemler",
          data: [
            {
              year: "2025",
              count: 12
            },
            {
              year: "2024",
              count: 11
            },
            {
              year: "2023",
              count: 13
            },
            {
              year: "2022",
              count: 13
            },
            {
              year: "2021",
              count: 11
            }
          ]
        },
        {
          name: "Kümeler",
          data: [
            {
              year: "2025",
              count: 1
            },
            {
              year: "2024",
              count: 1
            },
            {
              year: "2023",
              count: 1
            },
            {
              year: "2022",
              count: 1
            },
            {
              year: "2021",
              count: 1
            }
          ]
        },
        {
          name: "Mantık",
          data: [
            {
              year: "2025",
              count: 1
            },
            {
              year: "2024",
              count: 1
            },
            {
              year: "2023",
              count: 1
            },
            {
              year: "2022",
              count: 1
            },
            {
              year: "2021",
              count: 1
            }
          ]
        },
        {
          name: "Fonksiyonlar",
          data: [
            {
              year: "2025",
              count: 1
            },
            {
              year: "2024",
              count: 2
            },
            {
              year: "2023",
              count: 1
            },
            {
              year: "2022",
              count: 1
            },
            {
              year: "2021",
              count: 1
            }
          ]
        },
        {
          name: "Polinomlar",
          data: [
            {
              year: "2025",
              count: 0
            },
            {
              year: "2024",
              count: 0
            },
            {
              year: "2023",
              count: 1
            },
            {
              year: "2022",
              count: 0
            },
            {
              year: "2021",
              count: 0
            }
          ]
        },
        {
          name: "Permütasyon-Kombinasyon-Olasılık",
          data: [
            {
              year: "2025",
              count: 2
            },
            {
              year: "2024",
              count: 2
            },
            {
              year: "2023",
              count: 2
            },
            {
              year: "2022",
              count: 2
            },
            {
              year: "2021",
              count: 2
            }
          ]
        },
        {
          name: "Veri - İstatistik",
          data: [
            {
              year: "2025",
              count: 1
            },
            {
              year: "2024",
              count: 1
            },
            {
              year: "2023",
              count: 1
            },
            {
              year: "2022",
              count: 1
            },
            {
              year: "2021",
              count: 1
            }
          ]
        }
      ]
    },
    ayt: {
      totalQuestions: 30,
      topics: [
        {
          name: "Polinomlar",
          data: [
            {
              year: "2025",
              count: 2
            },
            {
              year: "2024",
              count: 2
            },
            {
              year: "2023",
              count: 2
            },
            {
              year: "2022",
              count: 1
            },
            {
              year: "2021",
              count: 1
            }
          ]
        },
        {
          name: "2. Dereceden Denklemler",
          data: [
            {
              year: "2025",
              count: 1
            },
            {
              year: "2024",
              count: 1
            },
            {
              year: "2023",
              count: 1
            },
            {
              year: "2022",
              count: 0
            },
            {
              year: "2021",
              count: 1
            }
          ]
        },
        {
          name: "Karmaşık Sayılar",
          data: [
            {
              year: "2025",
              count: 1
            },
            {
              year: "2024",
              count: 1
            },
            {
              year: "2023",
              count: 1
            },
            {
              year: "2022",
              count: 1
            },
            {
              year: "2021",
              count: 1
            }
          ]
        },
        {
          name: "Eşitsizlikler",
          data: [
            {
              year: "2025",
              count: 1
            },
            {
              year: "2024",
              count: 1
            },
            {
              year: "2023",
              count: 1
            },
            {
              year: "2022",
              count: 1
            },
            {
              year: "2021",
              count: 1
            }
          ]
        },
        {
          name: "Parabol",
          data: [
            {
              year: "2025",
              count: 1
            },
            {
              year: "2024",
              count: 1
            },
            {
              year: "2023",
              count: 1
            },
            {
              year: "2022",
              count: 1
            },
            {
              year: "2021",
              count: 1
            }
          ]
        },
        {
          name: "Logaritma",
          data: [
            {
              year: "2025",
              count: 2
            },
            {
              year: "2024",
              count: 2
            },
            {
              year: "2023",
              count: 2
            },
            {
              year: "2022",
              count: 2
            },
            {
              year: "2021",
              count: 1
            }
          ]
        },
        {
          name: "Diziler",
          data: [
            {
              year: "2025",
              count: 2
            },
            {
              year: "2024",
              count: 2
            },
            {
              year: "2023",
              count: 1
            },
            {
              year: "2022",
              count: 1
            },
            {
              year: "2021",
              count: 1
            }
          ]
        },
        {
          name: "Trigonometri",
          data: [
            {
              year: "2025",
              count: 4
            },
            {
              year: "2024",
              count: 4
            },
            {
              year: "2023",
              count: 5
            },
            {
              year: "2022",
              count: 4
            },
            {
              year: "2021",
              count: 4
            }
          ]
        },
        {
          name: "Limit ve Süreklilik",
          data: [
            {
              year: "2025",
              count: 2
            },
            {
              year: "2024",
              count: 2
            },
            {
              year: "2023",
              count: 0
            },
            {
              year: "2022",
              count: 2
            },
            {
              year: "2021",
              count: 2
            }
          ]
        },
        {
          name: "Türev",
          data: [
            {
              year: "2025",
              count: 4
            },
            {
              year: "2024",
              count: 4
            },
            {
              year: "2023",
              count: 0
            },
            {
              year: "2022",
              count: 3
            },
            {
              year: "2021",
              count: 3
            }
          ]
        },
        {
          name: "İntegral",
          data: [
            {
              year: "2025",
              count: 4
            },
            {
              year: "2024",
              count: 4
            },
            {
              year: "2023",
              count: 0
            },
            {
              year: "2022",
              count: 4
            },
            {
              year: "2021",
              count: 4
            }
          ]
        }
      ]
    }
  },
  {
    id: "turkce",
    name: "Türkçe",
    icon: "🖋️",
    tyt: {
      totalQuestions: 40,
      topics: [
        {
          name: "Sözcükte Anlam",
          data: [
            {
              year: "2025",
              count: 4
            },
            {
              year: "2024",
              count: 4
            },
            {
              year: "2023",
              count: 3
            },
            {
              year: "2022",
              count: 4
            },
            {
              year: "2021",
              count: 3
            }
          ]
        },
        {
          name: "Cümlede Anlam",
          data: [
            {
              year: "2025",
              count: 3
            },
            {
              year: "2024",
              count: 3
            },
            {
              year: "2023",
              count: 4
            },
            {
              year: "2022",
              count: 3
            },
            {
              year: "2021",
              count: 4
            }
          ]
        },
        {
          name: "Paragraf",
          data: [
            {
              year: "2025",
              count: 26
            },
            {
              year: "2024",
              count: 26
            },
            {
              year: "2023",
              count: 26
            },
            {
              year: "2022",
              count: 26
            },
            {
              year: "2021",
              count: 25
            }
          ]
        },
        {
          name: "Ses Bilgisi",
          data: [
            {
              year: "2025",
              count: 1
            },
            {
              year: "2024",
              count: 1
            },
            {
              year: "2023",
              count: 1
            },
            {
              year: "2022",
              count: 1
            },
            {
              year: "2021",
              count: 1
            }
          ]
        },
        {
          name: "Dil Bilgisi / Sözcük Türleri",
          data: [
            {
              year: "2025",
              count: 2
            },
            {
              year: "2024",
              count: 2
            },
            {
              year: "2023",
              count: 2
            },
            {
              year: "2022",
              count: 2
            },
            {
              year: "2021",
              count: 2
            }
          ]
        },
        {
          name: "Yazım Kuralları",
          data: [
            {
              year: "2025",
              count: 2
            },
            {
              year: "2024",
              count: 2
            },
            {
              year: "2023",
              count: 2
            },
            {
              year: "2022",
              count: 2
            },
            {
              year: "2021",
              count: 2
            }
          ]
        },
        {
          name: "Noktalama İşaretleri",
          data: [
            {
              year: "2025",
              count: 2
            },
            {
              year: "2024",
              count: 2
            },
            {
              year: "2023",
              count: 2
            },
            {
              year: "2022",
              count: 2
            },
            {
              year: "2021",
              count: 2
            }
          ]
        },
        {
          name: "Anlatım Bozukluğu",
          data: [
            {
              year: "2025",
              count: 0
            },
            {
              year: "2024",
              count: 0
            },
            {
              year: "2023",
              count: 0
            },
            {
              year: "2022",
              count: 0
            },
            {
              year: "2021",
              count: 1
            }
          ]
        }
      ]
    },
    ayt: {
      totalQuestions: 24,
      topics: [
        {
          name: "Edebiyat Akımları",
          data: [
            {
              year: "2025",
              count: 1
            },
            {
              year: "2024",
              count: 1
            },
            {
              year: "2023",
              count: 1
            },
            {
              year: "2022",
              count: 1
            },
            {
              year: "2021",
              count: 1
            }
          ]
        },
        {
          name: "Şiir Bilgisi",
          data: [
            {
              year: "2025",
              count: 3
            },
            {
              year: "2024",
              count: 3
            },
            {
              year: "2023",
              count: 3
            },
            {
              year: "2022",
              count: 3
            },
            {
              year: "2021",
              count: 3
            }
          ]
        },
        {
          name: "İslamiyet Öncesi ve Geçiş",
          data: [
            {
              year: "2025",
              count: 1
            },
            {
              year: "2024",
              count: 1
            },
            {
              year: "2023",
              count: 1
            },
            {
              year: "2022",
              count: 1
            },
            {
              year: "2021",
              count: 1
            }
          ]
        },
        {
          name: "Halk Edebiyatı",
          data: [
            {
              year: "2025",
              count: 2
            },
            {
              year: "2024",
              count: 2
            },
            {
              year: "2023",
              count: 2
            },
            {
              year: "2022",
              count: 2
            },
            {
              year: "2021",
              count: 2
            }
          ]
        },
        {
          name: "Divan Edebiyatı",
          data: [
            {
              year: "2025",
              count: 4
            },
            {
              year: "2024",
              count: 5
            },
            {
              year: "2023",
              count: 5
            },
            {
              year: "2022",
              count: 4
            },
            {
              year: "2021",
              count: 5
            }
          ]
        },
        {
          name: "Tanzimat Edebiyatı",
          data: [
            {
              year: "2025",
              count: 2
            },
            {
              year: "2024",
              count: 2
            },
            {
              year: "2023",
              count: 1
            },
            {
              year: "2022",
              count: 2
            },
            {
              year: "2021",
              count: 2
            }
          ]
        },
        {
          name: "Servetifünun ve Fecriati",
          data: [
            {
              year: "2025",
              count: 1
            },
            {
              year: "2024",
              count: 1
            },
            {
              year: "2023",
              count: 1
            },
            {
              year: "2022",
              count: 1
            },
            {
              year: "2021",
              count: 1
            }
          ]
        },
        {
          name: "Milli Edebiyat",
          data: [
            {
              year: "2025",
              count: 1
            },
            {
              year: "2024",
              count: 1
            },
            {
              year: "2023",
              count: 1
            },
            {
              year: "2022",
              count: 1
            },
            {
              year: "2021",
              count: 1
            }
          ]
        },
        {
          name: "Cumhuriyet Dönemi",
          data: [
            {
              year: "2025",
              count: 3
            },
            {
              year: "2024",
              count: 3
            },
            {
              year: "2023",
              count: 0
            },
            {
              year: "2022",
              count: 3
            },
            {
              year: "2021",
              count: 3
            }
          ]
        },
        {
          name: "Paragraf / Anlam",
          data: [
            {
              year: "2025",
              count: 6
            },
            {
              year: "2024",
              count: 5
            },
            {
              year: "2023",
              count: 6
            },
            {
              year: "2022",
              count: 6
            },
            {
              year: "2021",
              count: 6
            }
          ]
        }
      ]
    }
  },
  {
    id: "fizik",
    name: "Fizik",
    icon: "⚡",
    tyt: {
      totalQuestions: 7,
      topics: [
        {
          name: "Fizik Bilimine Giriş",
          data: [
            {
              year: "2025",
              count: 1
            },
            {
              year: "2024",
              count: 1
            },
            {
              year: "2023",
              count: 1
            },
            {
              year: "2022",
              count: 1
            },
            {
              year: "2021",
              count: 1
            }
          ]
        },
        {
          name: "Madde ve Özellikleri",
          data: [
            {
              year: "2025",
              count: 1
            },
            {
              year: "2024",
              count: 1
            },
            {
              year: "2023",
              count: 1
            },
            {
              year: "2022",
              count: 1
            },
            {
              year: "2021",
              count: 0
            }
          ]
        },
        {
          name: "Hareket ve Kuvvet",
          data: [
            {
              year: "2025",
              count: 1
            },
            {
              year: "2024",
              count: 1
            },
            {
              year: "2023",
              count: 1
            },
            {
              year: "2022",
              count: 1
            },
            {
              year: "2021",
              count: 1
            }
          ]
        },
        {
          name: "İş, Güç ve Enerji",
          data: [
            {
              year: "2025",
              count: 1
            },
            {
              year: "2024",
              count: 0
            },
            {
              year: "2023",
              count: 0
            },
            {
              year: "2022",
              count: 0
            },
            {
              year: "2021",
              count: 1
            }
          ]
        },
        {
          name: "Isı, Sıcaklık",
          data: [
            {
              year: "2025",
              count: 1
            },
            {
              year: "2024",
              count: 1
            },
            {
              year: "2023",
              count: 1
            },
            {
              year: "2022",
              count: 1
            },
            {
              year: "2021",
              count: 1
            }
          ]
        },
        {
          name: "Elektrik ve Manyetizma",
          data: [
            {
              year: "2025",
              count: 1
            },
            {
              year: "2024",
              count: 1
            },
            {
              year: "2023",
              count: 1
            },
            {
              year: "2022",
              count: 1
            },
            {
              year: "2021",
              count: 1
            }
          ]
        },
        {
          name: "Sıvıların Kaldırma Kuvveti",
          data: [
            {
              year: "2025",
              count: 0
            },
            {
              year: "2024",
              count: 0
            },
            {
              year: "2023",
              count: 1
            },
            {
              year: "2022",
              count: 1
            },
            {
              year: "2021",
              count: 0
            }
          ]
        },
        {
          name: "Basınç",
          data: [
            {
              year: "2025",
              count: 0
            },
            {
              year: "2024",
              count: 1
            },
            {
              year: "2023",
              count: 0
            },
            {
              year: "2022",
              count: 0
            },
            {
              year: "2021",
              count: 1
            }
          ]
        },
        {
          name: "Optik",
          data: [
            {
              year: "2025",
              count: 1
            },
            {
              year: "2024",
              count: 1
            },
            {
              year: "2023",
              count: 1
            },
            {
              year: "2022",
              count: 1
            },
            {
              year: "2021",
              count: 1
            }
          ]
        },
        {
          name: "Dalgalar",
          data: [
            {
              year: "2025",
              count: 0
            },
            {
              year: "2024",
              count: 0
            },
            {
              year: "2023",
              count: 0
            },
            {
              year: "2022",
              count: 0
            },
            {
              year: "2021",
              count: 0
            }
          ]
        }
      ]
    },
    ayt: {
      totalQuestions: 14,
      topics: [
        {
          name: "Vektörler ve Bağıl Hareket",
          data: [
            {
              year: "2025",
              count: 1
            },
            {
              year: "2024",
              count: 1
            },
            {
              year: "2023",
              count: 1
            },
            {
              year: "2022",
              count: 1
            },
            {
              year: "2021",
              count: 1
            }
          ]
        },
        {
          name: "Newton Hareket Yasaları",
          data: [
            {
              year: "2025",
              count: 1
            },
            {
              year: "2024",
              count: 1
            },
            {
              year: "2023",
              count: 1
            },
            {
              year: "2022",
              count: 1
            },
            {
              year: "2021",
              count: 1
            }
          ]
        },
        {
          name: "Atışlar ve Enerji",
          data: [
            {
              year: "2025",
              count: 2
            },
            {
              year: "2024",
              count: 2
            },
            {
              year: "2023",
              count: 2
            },
            {
              year: "2022",
              count: 2
            },
            {
              year: "2021",
              count: 2
            }
          ]
        },
        {
          name: "İtme ve Momentum",
          data: [
            {
              year: "2025",
              count: 1
            },
            {
              year: "2024",
              count: 1
            },
            {
              year: "2023",
              count: 1
            },
            {
              year: "2022",
              count: 1
            },
            {
              year: "2021",
              count: 1
            }
          ]
        },
        {
          name: "Elektriksel Kuvvet ve Alan",
          data: [
            {
              year: "2025",
              count: 1
            },
            {
              year: "2024",
              count: 1
            },
            {
              year: "2023",
              count: 1
            },
            {
              year: "2022",
              count: 1
            },
            {
              year: "2021",
              count: 1
            }
          ]
        },
        {
          name: "Manyetizma",
          data: [
            {
              year: "2025",
              count: 2
            },
            {
              year: "2024",
              count: 2
            },
            {
              year: "2023",
              count: 2
            },
            {
              year: "2022",
              count: 2
            },
            {
              year: "2021",
              count: 1
            }
          ]
        },
        {
          name: "Çembersel Hareket",
          data: [
            {
              year: "2025",
              count: 2
            },
            {
              year: "2024",
              count: 2
            },
            {
              year: "2023",
              count: 2
            },
            {
              year: "2022",
              count: 1
            },
            {
              year: "2021",
              count: 1
            }
          ]
        },
        {
          name: "Basit Harmonik Hareket",
          data: [
            {
              year: "2025",
              count: 1
            },
            {
              year: "2024",
              count: 1
            },
            {
              year: "2023",
              count: 1
            },
            {
              year: "2022",
              count: 1
            },
            {
              year: "2021",
              count: 1
            }
          ]
        },
        {
          name: "Dalga Mekaniği",
          data: [
            {
              year: "2025",
              count: 1
            },
            {
              year: "2024",
              count: 1
            },
            {
              year: "2023",
              count: 1
            },
            {
              year: "2022",
              count: 1
            },
            {
              year: "2021",
              count: 1
            }
          ]
        },
        {
          name: "Modern Fizik",
          data: [
            {
              year: "2025",
              count: 2
            },
            {
              year: "2024",
              count: 2
            },
            {
              year: "2023",
              count: 0
            },
            {
              year: "2022",
              count: 2
            },
            {
              year: "2021",
              count: 2
            }
          ]
        }
      ]
    }
  },
  {
    id: "geometri",
    name: "Geometri",
    icon: "📐",
    tyt: {
      totalQuestions: 10,
      topics: [
        {
          name: "Doğruda ve Üçgende Açılar",
          data: [
            {
              year: "2025",
              count: 1
            },
            {
              year: "2024",
              count: 1
            },
            {
              year: "2023",
              count: 1
            },
            {
              year: "2022",
              count: 1
            },
            {
              year: "2021",
              count: 1
            }
          ]
        },
        {
          name: "Özel Üçgenler",
          data: [
            {
              year: "2025",
              count: 1
            },
            {
              year: "2024",
              count: 1
            },
            {
              year: "2023",
              count: 1
            },
            {
              year: "2022",
              count: 1
            },
            {
              year: "2021",
              count: 1
            }
          ]
        },
        {
          name: "Üçgende Alan ve Benzerlik",
          data: [
            {
              year: "2025",
              count: 1
            },
            {
              year: "2024",
              count: 1
            },
            {
              year: "2023",
              count: 1
            },
            {
              year: "2022",
              count: 1
            },
            {
              year: "2021",
              count: 1
            }
          ]
        },
        {
          name: "Çokgenler",
          data: [
            {
              year: "2025",
              count: 1
            },
            {
              year: "2024",
              count: 1
            },
            {
              year: "2023",
              count: 1
            },
            {
              year: "2022",
              count: 1
            },
            {
              year: "2021",
              count: 1
            }
          ]
        },
        {
          name: "Dörtgenler",
          data: [
            {
              year: "2025",
              count: 3
            },
            {
              year: "2024",
              count: 3
            },
            {
              year: "2023",
              count: 3
            },
            {
              year: "2022",
              count: 3
            },
            {
              year: "2021",
              count: 3
            }
          ]
        },
        {
          name: "Çember ve Daire",
          data: [
            {
              year: "2025",
              count: 1
            },
            {
              year: "2024",
              count: 1
            },
            {
              year: "2023",
              count: 0
            },
            {
              year: "2022",
              count: 0
            },
            {
              year: "2021",
              count: 0
            }
          ]
        },
        {
          name: "Analitik Geometri",
          data: [
            {
              year: "2025",
              count: 1
            },
            {
              year: "2024",
              count: 1
            },
            {
              year: "2023",
              count: 1
            },
            {
              year: "2022",
              count: 1
            },
            {
              year: "2021",
              count: 1
            }
          ]
        },
        {
          name: "Katı Cisimler",
          data: [
            {
              year: "2025",
              count: 1
            },
            {
              year: "2024",
              count: 1
            },
            {
              year: "2023",
              count: 2
            },
            {
              year: "2022",
              count: 2
            },
            {
              year: "2021",
              count: 2
            }
          ]
        }
      ]
    },
    ayt: {
      totalQuestions: 10,
      topics: [
        {
          name: "Trigonometri",
          data: [
            {
              year: "2025",
              count: 3
            },
            {
              year: "2024",
              count: 3
            },
            {
              year: "2023",
              count: 4
            },
            {
              year: "2022",
              count: 4
            },
            {
              year: "2021",
              count: 4
            }
          ]
        },
        {
          name: "Analitik Geometri",
          data: [
            {
              year: "2025",
              count: 3
            },
            {
              year: "2024",
              count: 3
            },
            {
              year: "2023",
              count: 3
            },
            {
              year: "2022",
              count: 3
            },
            {
              year: "2021",
              count: 3
            }
          ]
        },
        {
          name: "Çember ve Daire",
          data: [
            {
              year: "2025",
              count: 2
            },
            {
              year: "2024",
              count: 2
            },
            {
              year: "2023",
              count: 2
            },
            {
              year: "2022",
              count: 1
            },
            {
              year: "2021",
              count: 2
            }
          ]
        },
        {
          name: "Katı Cisimler",
          data: [
            {
              year: "2025",
              count: 1
            },
            {
              year: "2024",
              count: 1
            },
            {
              year: "2023",
              count: 1
            },
            {
              year: "2022",
              count: 1
            },
            {
              year: "2021",
              count: 1
            }
          ]
        },
        {
          name: "Dönüşümler",
          data: [
            {
              year: "2025",
              count: 1
            },
            {
              year: "2024",
              count: 1
            },
            {
              year: "2023",
              count: 0
            },
            {
              year: "2022",
              count: 1
            },
            {
              year: "2021",
              count: 1
            }
          ]
        }
      ]
    }
  },
  {
    id: "kimya",
    name: "Kimya",
    icon: "🧪",
    tyt: {
      totalQuestions: 7,
      topics: [
        {
          name: "Kimya Bilimi",
          data: [
            {
              year: "2025",
              count: 1
            },
            {
              year: "2024",
              count: 1
            },
            {
              year: "2023",
              count: 1
            },
            {
              year: "2022",
              count: 1
            },
            {
              year: "2021",
              count: 1
            }
          ]
        },
        {
          name: "Atom ve Periyodik Sistem",
          data: [
            {
              year: "2025",
              count: 1
            },
            {
              year: "2024",
              count: 1
            },
            {
              year: "2023",
              count: 1
            },
            {
              year: "2022",
              count: 1
            },
            {
              year: "2021",
              count: 1
            }
          ]
        },
        {
          name: "Kimyasal Türler Arası Etkileşimler",
          data: [
            {
              year: "2025",
              count: 1
            },
            {
              year: "2024",
              count: 1
            },
            {
              year: "2023",
              count: 1
            },
            {
              year: "2022",
              count: 1
            },
            {
              year: "2021",
              count: 1
            }
          ]
        },
        {
          name: "Maddenin Halleri",
          data: [
            {
              year: "2025",
              count: 1
            },
            {
              year: "2024",
              count: 1
            },
            {
              year: "2023",
              count: 1
            },
            {
              year: "2022",
              count: 1
            },
            {
              year: "2021",
              count: 1
            }
          ]
        },
        {
          name: "Kimyanın Temel Kanunları",
          data: [
            {
              year: "2025",
              count: 1
            },
            {
              year: "2024",
              count: 1
            },
            {
              year: "2023",
              count: 1
            },
            {
              year: "2022",
              count: 1
            },
            {
              year: "2021",
              count: 1
            }
          ]
        },
        {
          name: "Karışımlar",
          data: [
            {
              year: "2025",
              count: 1
            },
            {
              year: "2024",
              count: 1
            },
            {
              year: "2023",
              count: 1
            },
            {
              year: "2022",
              count: 1
            },
            {
              year: "2021",
              count: 1
            }
          ]
        },
        {
          name: "Asit, Baz ve Tuzlar",
          data: [
            {
              year: "2025",
              count: 1
            },
            {
              year: "2024",
              count: 1
            },
            {
              year: "2023",
              count: 1
            },
            {
              year: "2022",
              count: 1
            },
            {
              year: "2021",
              count: 1
            }
          ]
        }
      ]
    },
    ayt: {
      totalQuestions: 13,
      topics: [
        {
          name: "Modern Atom Teorisi",
          data: [
            {
              year: "2025",
              count: 1
            },
            {
              year: "2024",
              count: 1
            },
            {
              year: "2023",
              count: 1
            },
            {
              year: "2022",
              count: 1
            },
            {
              year: "2021",
              count: 1
            }
          ]
        },
        {
          name: "Gazlar",
          data: [
            {
              year: "2025",
              count: 1
            },
            {
              year: "2024",
              count: 1
            },
            {
              year: "2023",
              count: 1
            },
            {
              year: "2022",
              count: 1
            },
            {
              year: "2021",
              count: 1
            }
          ]
        },
        {
          name: "Sıvı Çözeltiler",
          data: [
            {
              year: "2025",
              count: 2
            },
            {
              year: "2024",
              count: 2
            },
            {
              year: "2023",
              count: 2
            },
            {
              year: "2022",
              count: 2
            },
            {
              year: "2021",
              count: 1
            }
          ]
        },
        {
          name: "Kimyasal Enerji",
          data: [
            {
              year: "2025",
              count: 1
            },
            {
              year: "2024",
              count: 1
            },
            {
              year: "2023",
              count: 1
            },
            {
              year: "2022",
              count: 1
            },
            {
              year: "2021",
              count: 1
            }
          ]
        },
        {
          name: "Kinetik (Hız)",
          data: [
            {
              year: "2025",
              count: 1
            },
            {
              year: "2024",
              count: 1
            },
            {
              year: "2023",
              count: 1
            },
            {
              year: "2022",
              count: 1
            },
            {
              year: "2021",
              count: 1
            }
          ]
        },
        {
          name: "Kimyasal Denge",
          data: [
            {
              year: "2025",
              count: 2
            },
            {
              year: "2024",
              count: 2
            },
            {
              year: "2023",
              count: 2
            },
            {
              year: "2022",
              count: 1
            },
            {
              year: "2021",
              count: 2
            }
          ]
        },
        {
          name: "Elektrokimya",
          data: [
            {
              year: "2025",
              count: 2
            },
            {
              year: "2024",
              count: 2
            },
            {
              year: "2023",
              count: 3
            },
            {
              year: "2022",
              count: 2
            },
            {
              year: "2021",
              count: 2
            }
          ]
        },
        {
          name: "Organik Kimya",
          data: [
            {
              year: "2025",
              count: 3
            },
            {
              year: "2024",
              count: 3
            },
            {
              year: "2023",
              count: 2
            },
            {
              year: "2022",
              count: 4
            },
            {
              year: "2021",
              count: 4
            }
          ]
        }
      ]
    }
  },
  {
    id: "biyoloji",
    name: "Biyoloji",
    icon: "🌿",
    tyt: {
      totalQuestions: 6,
      topics: [
        {
          name: "Canlıların Ortak Özellikleri",
          data: [
            {
              year: "2025",
              count: 0
            },
            {
              year: "2024",
              count: 1
            },
            {
              year: "2023",
              count: 0
            },
            {
              year: "2022",
              count: 0
            },
            {
              year: "2021",
              count: 0
            }
          ]
        },
        {
          name: "Canlıların Temel Bileşenleri",
          data: [
            {
              year: "2025",
              count: 1
            },
            {
              year: "2024",
              count: 1
            },
            {
              year: "2023",
              count: 1
            },
            {
              year: "2022",
              count: 1
            },
            {
              year: "2021",
              count: 1
            }
          ]
        },
        {
          name: "Hücre ve Organelleri",
          data: [
            {
              year: "2025",
              count: 1
            },
            {
              year: "2024",
              count: 1
            },
            {
              year: "2023",
              count: 1
            },
            {
              year: "2022",
              count: 1
            },
            {
              year: "2021",
              count: 1
            }
          ]
        },
        {
          name: "Canlıların Sınıflandırılması",
          data: [
            {
              year: "2025",
              count: 1
            },
            {
              year: "2024",
              count: 1
            },
            {
              year: "2023",
              count: 1
            },
            {
              year: "2022",
              count: 1
            },
            {
              year: "2021",
              count: 1
            }
          ]
        },
        {
          name: "Hücre Bölünmeleri ve Üreme",
          data: [
            {
              year: "2025",
              count: 1
            },
            {
              year: "2024",
              count: 0
            },
            {
              year: "2023",
              count: 1
            },
            {
              year: "2022",
              count: 1
            },
            {
              year: "2021",
              count: 1
            }
          ]
        },
        {
          name: "Kalıtım",
          data: [
            {
              year: "2025",
              count: 1
            },
            {
              year: "2024",
              count: 1
            },
            {
              year: "2023",
              count: 1
            },
            {
              year: "2022",
              count: 1
            },
            {
              year: "2021",
              count: 1
            }
          ]
        },
        {
          name: "Ekosistem Ekolojisi",
          data: [
            {
              year: "2025",
              count: 1
            },
            {
              year: "2024",
              count: 1
            },
            {
              year: "2023",
              count: 1
            },
            {
              year: "2022",
              count: 1
            },
            {
              year: "2021",
              count: 1
            }
          ]
        }
      ]
    },
    ayt: {
      totalQuestions: 13,
      topics: [
        {
          name: "Sinir Sistemi",
          data: [
            {
              year: "2025",
              count: 1
            },
            {
              year: "2024",
              count: 1
            },
            {
              year: "2023",
              count: 1
            },
            {
              year: "2022",
              count: 1
            },
            {
              year: "2021",
              count: 1
            }
          ]
        },
        {
          name: "Endokrin Sistem",
          data: [
            {
              year: "2025",
              count: 1
            },
            {
              year: "2024",
              count: 1
            },
            {
              year: "2023",
              count: 1
            },
            {
              year: "2022",
              count: 1
            },
            {
              year: "2021",
              count: 1
            }
          ]
        },
        {
          name: "Duyu Organları",
          data: [
            {
              year: "2025",
              count: 0
            },
            {
              year: "2024",
              count: 0
            },
            {
              year: "2023",
              count: 1
            },
            {
              year: "2022",
              count: 0
            },
            {
              year: "2021",
              count: 0
            }
          ]
        },
        {
          name: "Destek ve Hareket",
          data: [
            {
              year: "2025",
              count: 1
            },
            {
              year: "2024",
              count: 1
            },
            {
              year: "2023",
              count: 1
            },
            {
              year: "2022",
              count: 1
            },
            {
              year: "2021",
              count: 1
            }
          ]
        },
        {
          name: "Sindirim Sistemi",
          data: [
            {
              year: "2025",
              count: 1
            },
            {
              year: "2024",
              count: 1
            },
            {
              year: "2023",
              count: 1
            },
            {
              year: "2022",
              count: 1
            },
            {
              year: "2021",
              count: 1
            }
          ]
        },
        {
          name: "Dolaşım Sistemi",
          data: [
            {
              year: "2025",
              count: 1
            },
            {
              year: "2024",
              count: 1
            },
            {
              year: "2023",
              count: 1
            },
            {
              year: "2022",
              count: 1
            },
            {
              year: "2021",
              count: 1
            }
          ]
        },
        {
          name: "Solunum Sistemi",
          data: [
            {
              year: "2025",
              count: 1
            },
            {
              year: "2024",
              count: 1
            },
            {
              year: "2023",
              count: 1
            },
            {
              year: "2022",
              count: 1
            },
            {
              year: "2021",
              count: 1
            }
          ]
        },
        {
          name: "Boşaltım Sistemi",
          data: [
            {
              year: "2025",
              count: 1
            },
            {
              year: "2024",
              count: 1
            },
            {
              year: "2023",
              count: 1
            },
            {
              year: "2022",
              count: 1
            },
            {
              year: "2021",
              count: 1
            }
          ]
        },
        {
          name: "Üreme Sistemi",
          data: [
            {
              year: "2025",
              count: 1
            },
            {
              year: "2024",
              count: 1
            },
            {
              year: "2023",
              count: 1
            },
            {
              year: "2022",
              count: 1
            },
            {
              year: "2021",
              count: 1
            }
          ]
        },
        {
          name: "Genden Proteine",
          data: [
            {
              year: "2025",
              count: 2
            },
            {
              year: "2024",
              count: 2
            },
            {
              year: "2023",
              count: 2
            },
            {
              year: "2022",
              count: 2
            },
            {
              year: "2021",
              count: 2
            }
          ]
        },
        {
          name: "Hücresel Solunum",
          data: [
            {
              year: "2025",
              count: 1
            },
            {
              year: "2024",
              count: 1
            },
            {
              year: "2023",
              count: 1
            },
            {
              year: "2022",
              count: 1
            },
            {
              year: "2021",
              count: 1
            }
          ]
        },
        {
          name: "Fotosentez / Kemosentez",
          data: [
            {
              year: "2025",
              count: 1
            },
            {
              year: "2024",
              count: 1
            },
            {
              year: "2023",
              count: 1
            },
            {
              year: "2022",
              count: 1
            },
            {
              year: "2021",
              count: 1
            }
          ]
        },
        {
          name: "Bitki Biyolojisi",
          data: [
            {
              year: "2025",
              count: 1
            },
            {
              year: "2024",
              count: 1
            },
            {
              year: "2023",
              count: 0
            },
            {
              year: "2022",
              count: 1
            },
            {
              year: "2021",
              count: 1
            }
          ]
        }
      ]
    }
  },
  {
    id: "tarih",
    name: "Tarih",
    icon: "📜",
    tyt: {
      totalQuestions: 5,
      topics: [
        {
          name: "Tarih ve Zaman",
          data: [
            {
              year: "2025",
              count: 0
            },
            {
              year: "2024",
              count: 0
            },
            {
              year: "2023",
              count: 0
            },
            {
              year: "2022",
              count: 0
            },
            {
              year: "2021",
              count: 0
            }
          ]
        },
        {
          name: "İlk ve Orta Çağlarda Türk Dünyası",
          data: [
            {
              year: "2025",
              count: 1
            },
            {
              year: "2024",
              count: 1
            },
            {
              year: "2023",
              count: 1
            },
            {
              year: "2022",
              count: 1
            },
            {
              year: "2021",
              count: 1
            }
          ]
        },
        {
          name: "İslam Medeniyetinin Doğuşu",
          data: [
            {
              year: "2025",
              count: 0
            },
            {
              year: "2024",
              count: 0
            },
            {
              year: "2023",
              count: 0
            },
            {
              year: "2022",
              count: 0
            },
            {
              year: "2021",
              count: 0
            }
          ]
        },
        {
          name: "Türklerin İslamiyet'i Kabulü",
          data: [
            {
              year: "2025",
              count: 1
            },
            {
              year: "2024",
              count: 1
            },
            {
              year: "2023",
              count: 1
            },
            {
              year: "2022",
              count: 1
            },
            {
              year: "2021",
              count: 1
            }
          ]
        },
        {
          name: "Beylikten Devlete Osmanlı",
          data: [
            {
              year: "2025",
              count: 1
            },
            {
              year: "2024",
              count: 1
            },
            {
              year: "2023",
              count: 1
            },
            {
              year: "2022",
              count: 1
            },
            {
              year: "2021",
              count: 1
            }
          ]
        },
        {
          name: "Dünya Gücü Osmanlı",
          data: [
            {
              year: "2025",
              count: 0
            },
            {
              year: "2024",
              count: 0
            },
            {
              year: "2023",
              count: 0
            },
            {
              year: "2022",
              count: 0
            },
            {
              year: "2021",
              count: 0
            }
          ]
        },
        {
          name: "XX. Yüzyıl Başlarında Osmanlı",
          data: [
            {
              year: "2025",
              count: 1
            },
            {
              year: "2024",
              count: 1
            },
            {
              year: "2023",
              count: 1
            },
            {
              year: "2022",
              count: 1
            },
            {
              year: "2021",
              count: 1
            }
          ]
        },
        {
          name: "Milli Mücadele",
          data: [
            {
              year: "2025",
              count: 1
            },
            {
              year: "2024",
              count: 1
            },
            {
              year: "2023",
              count: 1
            },
            {
              year: "2022",
              count: 1
            },
            {
              year: "2021",
              count: 1
            }
          ]
        }
      ]
    },
    ayt: {
      totalQuestions: 21,
      topics: [
        {
          name: "Tarih Bilimi",
          data: [
            {
              year: "2025",
              count: 1
            },
            {
              year: "2024",
              count: 1
            },
            {
              year: "2023",
              count: 1
            },
            {
              year: "2022",
              count: 1
            },
            {
              year: "2021",
              count: 1
            }
          ]
        },
        {
          name: "İlk Çağ Medeniyetleri",
          data: [
            {
              year: "2025",
              count: 1
            },
            {
              year: "2024",
              count: 1
            },
            {
              year: "2023",
              count: 1
            },
            {
              year: "2022",
              count: 1
            },
            {
              year: "2021",
              count: 1
            }
          ]
        },
        {
          name: "İslamiyet Öncesi Türk Tarihi",
          data: [
            {
              year: "2025",
              count: 1
            },
            {
              year: "2024",
              count: 1
            },
            {
              year: "2023",
              count: 1
            },
            {
              year: "2022",
              count: 1
            },
            {
              year: "2021",
              count: 1
            }
          ]
        },
        {
          name: "İslam Tarihi",
          data: [
            {
              year: "2025",
              count: 1
            },
            {
              year: "2024",
              count: 1
            },
            {
              year: "2023",
              count: 1
            },
            {
              year: "2022",
              count: 1
            },
            {
              year: "2021",
              count: 1
            }
          ]
        },
        {
          name: "Türk İslam Devletleri",
          data: [
            {
              year: "2025",
              count: 2
            },
            {
              year: "2024",
              count: 2
            },
            {
              year: "2023",
              count: 2
            },
            {
              year: "2022",
              count: 2
            },
            {
              year: "2021",
              count: 2
            }
          ]
        },
        {
          name: "Osmanlı Siyasi (Kuruluş-Yükselme)",
          data: [
            {
              year: "2025",
              count: 2
            },
            {
              year: "2024",
              count: 2
            },
            {
              year: "2023",
              count: 2
            },
            {
              year: "2022",
              count: 2
            },
            {
              year: "2021",
              count: 2
            }
          ]
        },
        {
          name: "Osmanlı Siyasi (Duraklama-Gerileme)",
          data: [
            {
              year: "2025",
              count: 1
            },
            {
              year: "2024",
              count: 1
            },
            {
              year: "2023",
              count: 1
            },
            {
              year: "2022",
              count: 1
            },
            {
              year: "2021",
              count: 1
            }
          ]
        },
        {
          name: "Osmanlı Dağılma / XX. YY",
          data: [
            {
              year: "2025",
              count: 2
            },
            {
              year: "2024",
              count: 2
            },
            {
              year: "2023",
              count: 2
            },
            {
              year: "2022",
              count: 2
            },
            {
              year: "2021",
              count: 2
            }
          ]
        },
        {
          name: "Milli Mücadele Dönemi",
          data: [
            {
              year: "2025",
              count: 4
            },
            {
              year: "2024",
              count: 4
            },
            {
              year: "2023",
              count: 4
            },
            {
              year: "2022",
              count: 4
            },
            {
              year: "2021",
              count: 4
            }
          ]
        },
        {
          name: "Atatürk İlkeleri ve İnkılaplar",
          data: [
            {
              year: "2025",
              count: 3
            },
            {
              year: "2024",
              count: 3
            },
            {
              year: "2023",
              count: 3
            },
            {
              year: "2022",
              count: 3
            },
            {
              year: "2021",
              count: 3
            }
          ]
        },
        {
          name: "Çağdaş Türk ve Dünya Tarihi",
          data: [
            {
              year: "2025",
              count: 3
            },
            {
              year: "2024",
              count: 3
            },
            {
              year: "2023",
              count: 3
            },
            {
              year: "2022",
              count: 3
            },
            {
              year: "2021",
              count: 3
            }
          ]
        }
      ]
    }
  },
  {
    id: "cografya",
    name: "Coğrafya",
    icon: "🌍",
    tyt: {
      totalQuestions: 5,
      topics: [
        {
          name: "Doğa ve İnsan",
          data: [
            {
              year: "2025",
              count: 1
            },
            {
              year: "2024",
              count: 1
            },
            {
              year: "2023",
              count: 1
            },
            {
              year: "2022",
              count: 1
            },
            {
              year: "2021",
              count: 1
            }
          ]
        },
        {
          name: "Dünya'nın Şekli ve Hareketleri",
          data: [
            {
              year: "2025",
              count: 0
            },
            {
              year: "2024",
              count: 0
            },
            {
              year: "2023",
              count: 0
            },
            {
              year: "2022",
              count: 0
            },
            {
              year: "2021",
              count: 0
            }
          ]
        },
        {
          name: "İklim Bilgisi",
          data: [
            {
              year: "2025",
              count: 1
            },
            {
              year: "2024",
              count: 1
            },
            {
              year: "2023",
              count: 1
            },
            {
              year: "2022",
              count: 1
            },
            {
              year: "2021",
              count: 1
            }
          ]
        },
        {
          name: "İç ve Dış Kuvvetler",
          data: [
            {
              year: "2025",
              count: 1
            },
            {
              year: "2024",
              count: 1
            },
            {
              year: "2023",
              count: 1
            },
            {
              year: "2022",
              count: 1
            },
            {
              year: "2021",
              count: 1
            }
          ]
        },
        {
          name: "Nüfus ve Yerleşme",
          data: [
            {
              year: "2025",
              count: 1
            },
            {
              year: "2024",
              count: 1
            },
            {
              year: "2023",
              count: 1
            },
            {
              year: "2022",
              count: 1
            },
            {
              year: "2021",
              count: 1
            }
          ]
        },
        {
          name: "Bölgeler ve Ulaşım",
          data: [
            {
              year: "2025",
              count: 1
            },
            {
              year: "2024",
              count: 1
            },
            {
              year: "2023",
              count: 1
            },
            {
              year: "2022",
              count: 1
            },
            {
              year: "2021",
              count: 1
            }
          ]
        }
      ]
    },
    ayt: {
      totalQuestions: 17,
      topics: [
        {
          name: "Ekstrem Doğa Olayları",
          data: [
            {
              year: "2025",
              count: 1
            },
            {
              year: "2024",
              count: 1
            },
            {
              year: "2023",
              count: 1
            },
            {
              year: "2022",
              count: 1
            },
            {
              year: "2021",
              count: 1
            }
          ]
        },
        {
          name: "Ekosistem ve Madde Döngüsü",
          data: [
            {
              year: "2025",
              count: 2
            },
            {
              year: "2024",
              count: 2
            },
            {
              year: "2023",
              count: 2
            },
            {
              year: "2022",
              count: 2
            },
            {
              year: "2021",
              count: 2
            }
          ]
        },
        {
          name: "Nüfus Politikaları",
          data: [
            {
              year: "2025",
              count: 1
            },
            {
              year: "2024",
              count: 1
            },
            {
              year: "2023",
              count: 1
            },
            {
              year: "2022",
              count: 1
            },
            {
              year: "2021",
              count: 1
            }
          ]
        },
        {
          name: "Türkiye Ekonomi ve Tarım",
          data: [
            {
              year: "2025",
              count: 4
            },
            {
              year: "2024",
              count: 4
            },
            {
              year: "2023",
              count: 4
            },
            {
              year: "2022",
              count: 4
            },
            {
              year: "2021",
              count: 4
            }
          ]
        },
        {
          name: "Küresel ve Bölgesel Örgütler",
          data: [
            {
              year: "2025",
              count: 1
            },
            {
              year: "2024",
              count: 1
            },
            {
              year: "2023",
              count: 1
            },
            {
              year: "2022",
              count: 1
            },
            {
              year: "2021",
              count: 1
            }
          ]
        },
        {
          name: "Ülkeler Coğrafyası",
          data: [
            {
              year: "2025",
              count: 2
            },
            {
              year: "2024",
              count: 2
            },
            {
              year: "2023",
              count: 2
            },
            {
              year: "2022",
              count: 2
            },
            {
              year: "2021",
              count: 2
            }
          ]
        },
        {
          name: "Çevre Sorunları",
          data: [
            {
              year: "2025",
              count: 2
            },
            {
              year: "2024",
              count: 2
            },
            {
              year: "2023",
              count: 2
            },
            {
              year: "2022",
              count: 2
            },
            {
              year: "2021",
              count: 2
            }
          ]
        }
      ]
    }
  },
  {
    id: "felsefe",
    name: "Felsefe",
    icon: "🧠",
    tyt: {
      totalQuestions: 5,
      topics: [
        {
          name: "Felsefeyi Tanıma",
          data: [
            {
              year: "2025",
              count: 1
            },
            {
              year: "2024",
              count: 1
            },
            {
              year: "2023",
              count: 1
            },
            {
              year: "2022",
              count: 1
            },
            {
              year: "2021",
              count: 1
            }
          ]
        },
        {
          name: "Bilgi Felsefesi",
          data: [
            {
              year: "2025",
              count: 1
            },
            {
              year: "2024",
              count: 1
            },
            {
              year: "2023",
              count: 1
            },
            {
              year: "2022",
              count: 1
            },
            {
              year: "2021",
              count: 1
            }
          ]
        },
        {
          name: "Varlık Felsefesi",
          data: [
            {
              year: "2025",
              count: 1
            },
            {
              year: "2024",
              count: 1
            },
            {
              year: "2023",
              count: 1
            },
            {
              year: "2022",
              count: 1
            },
            {
              year: "2021",
              count: 1
            }
          ]
        },
        {
          name: "Ahlak Felsefesi",
          data: [
            {
              year: "2025",
              count: 1
            },
            {
              year: "2024",
              count: 1
            },
            {
              year: "2023",
              count: 1
            },
            {
              year: "2022",
              count: 1
            },
            {
              year: "2021",
              count: 1
            }
          ]
        },
        {
          name: "Siyaset Felsefesi",
          data: [
            {
              year: "2025",
              count: 1
            },
            {
              year: "2024",
              count: 1
            },
            {
              year: "2023",
              count: 1
            },
            {
              year: "2022",
              count: 1
            },
            {
              year: "2021",
              count: 1
            }
          ]
        }
      ]
    },
    ayt: {
      totalQuestions: 12,
      topics: [
        {
          name: "Mantık",
          data: [
            {
              year: "2025",
              count: 3
            },
            {
              year: "2024",
              count: 3
            },
            {
              year: "2023",
              count: 3
            },
            {
              year: "2022",
              count: 3
            },
            {
              year: "2021",
              count: 3
            }
          ]
        },
        {
          name: "Psikoloji",
          data: [
            {
              year: "2025",
              count: 3
            },
            {
              year: "2024",
              count: 3
            },
            {
              year: "2023",
              count: 3
            },
            {
              year: "2022",
              count: 3
            },
            {
              year: "2021",
              count: 3
            }
          ]
        },
        {
          name: "Sosyoloji",
          data: [
            {
              year: "2025",
              count: 3
            },
            {
              year: "2024",
              count: 3
            },
            {
              year: "2023",
              count: 3
            },
            {
              year: "2022",
              count: 3
            },
            {
              year: "2021",
              count: 3
            }
          ]
        },
        {
          name: "Felsefe Tarihi",
          data: [
            {
              year: "2025",
              count: 3
            },
            {
              year: "2024",
              count: 3
            },
            {
              year: "2023",
              count: 3
            },
            {
              year: "2022",
              count: 3
            },
            {
              year: "2021",
              count: 3
            }
          ]
        }
      ]
    }
  },
  {
    id: "din",
    name: "Din",
    icon: "🕌",
    tyt: {
      totalQuestions: 5,
      topics: [
        {
          name: "Bilgi ve İnanç",
          data: [
            {
              year: "2025",
              count: 1
            },
            {
              year: "2024",
              count: 1
            },
            {
              year: "2023",
              count: 1
            },
            {
              year: "2022",
              count: 1
            },
            {
              year: "2021",
              count: 1
            }
          ]
        },
        {
          name: "İbadet ve Ahlak",
          data: [
            {
              year: "2025",
              count: 2
            },
            {
              year: "2024",
              count: 2
            },
            {
              year: "2023",
              count: 2
            },
            {
              year: "2022",
              count: 2
            },
            {
              year: "2021",
              count: 2
            }
          ]
        },
        {
          name: "Hz. Muhammed ve İslam",
          data: [
            {
              year: "2025",
              count: 1
            },
            {
              year: "2024",
              count: 1
            },
            {
              year: "2023",
              count: 1
            },
            {
              year: "2022",
              count: 1
            },
            {
              year: "2021",
              count: 1
            }
          ]
        },
        {
          name: "Kur'an-ı Kerim'de Bazı Kavramlar",
          data: [
            {
              year: "2025",
              count: 1
            },
            {
              year: "2024",
              count: 1
            },
            {
              year: "2023",
              count: 1
            },
            {
              year: "2022",
              count: 1
            },
            {
              year: "2021",
              count: 1
            }
          ]
        }
      ]
    },
    ayt: {
      totalQuestions: 6,
      topics: [
        {
          name: "İslam ve Bilim",
          data: [
            {
              year: "2025",
              count: 1
            },
            {
              year: "2024",
              count: 1
            },
            {
              year: "2023",
              count: 1
            },
            {
              year: "2022",
              count: 1
            },
            {
              year: "2021",
              count: 1
            }
          ]
        },
        {
          name: "Anadolu'da İslam",
          data: [
            {
              year: "2025",
              count: 1
            },
            {
              year: "2024",
              count: 1
            },
            {
              year: "2023",
              count: 1
            },
            {
              year: "2022",
              count: 1
            },
            {
              year: "2021",
              count: 1
            }
          ]
        },
        {
          name: "İslam Düşüncesinde Yorumlar",
          data: [
            {
              year: "2025",
              count: 1
            },
            {
              year: "2024",
              count: 1
            },
            {
              year: "2023",
              count: 1
            },
            {
              year: "2022",
              count: 1
            },
            {
              year: "2021",
              count: 1
            }
          ]
        },
        {
          name: "Dinler",
          data: [
            {
              year: "2025",
              count: 1
            },
            {
              year: "2024",
              count: 1
            },
            {
              year: "2023",
              count: 1
            },
            {
              year: "2022",
              count: 1
            },
            {
              year: "2021",
              count: 1
            }
          ]
        },
        {
          name: "İslam Ahlakı",
          data: [
            {
              year: "2025",
              count: 2
            },
            {
              year: "2024",
              count: 2
            },
            {
              year: "2023",
              count: 2
            },
            {
              year: "2022",
              count: 2
            },
            {
              year: "2021",
              count: 2
            }
          ]
        }
      ]
    }
  }
];

export default function QuestionAnalysis() {
  const [activeSubject, setActiveSubject] = useState(QUESTION_DATA[0].id);
  const [examType, setExamType] = useState<'tyt' | 'ayt'>('tyt');
  const currentSubject = QUESTION_DATA.find(s => s.id === activeSubject)!;

  return (
    <div className="px-[5%] sm:px-[8%] md:px-[12%] lg:px-[15%] max-w-[2000px] mx-auto py-12 space-y-12">
      {/* Header section */}
      <section className="relative overflow-hidden bg-gradient-to-br from-slate-900 via-slate-900 to-emerald-900/30 border border-white/5 p-8 md:p-16 rounded-[40px] shadow-2xl">
        <div className="absolute top-0 right-0 p-8 opacity-5">
          <BarChart3 size={160} />
        </div>
        
        <div className="relative z-10">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-bold uppercase tracking-widest mb-6"
          >
            <PieChart size={14} />
            Soru Dağılım Analizi
          </motion.div>
          
          <motion.h1 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-4xl md:text-5xl font-black text-white tracking-tight mb-6"
          >
            Hangi Konudan <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-teal-400">Kaç Soru</span> Çıkıyor?
          </motion.h1>
          
          <p className="text-slate-400 text-lg leading-relaxed max-w-2xl">
            Son 5 yıla ait ÖSYM verilerini analiz ederek çalışma önceliklerini belirle. Hangi konunun daha kritik olduğunu gör ve stratejini ona göre kur.
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-10">
            <div className="p-6 rounded-3xl bg-white/5 border border-white/10">
              <TrendingUp className="text-emerald-500 mb-2" size={24} />
              <h4 className="text-white font-bold">Trend Analizi</h4>
              <p className="text-slate-500 text-xs">Yıllara göre değişim oranları.</p>
            </div>
            <div className="p-6 rounded-3xl bg-white/5 border border-white/10">
              <Target className="text-blue-500 mb-2" size={24} />
              <h4 className="text-white font-bold">Odak Noktaları</h4>
              <p className="text-slate-500 text-xs">En çok soru çıkan garantili konular.</p>
            </div>
            <div className="p-6 rounded-3xl bg-white/5 border border-white/10">
              <Sparkles className="text-amber-500 mb-2" size={24} />
              <h4 className="text-white font-bold">Yapay Zeka Tahmini</h4>
              <p className="text-slate-500 text-xs">2026 beklentileri ve ipuçları.</p>
            </div>
          </div>
        </div>
      </section>

      
      {/* Exam Type Selector */}
      <div className="flex gap-4">
        <button
          onClick={() => setExamType('tyt')}
          className={`flex-1 py-4 rounded-2xl font-bold tracking-widest uppercase transition-all duration-300 border-2 ${examType === 'tyt' ? 'bg-emerald-600/20 border-emerald-500 text-emerald-400 shadow-[0_0_20px_rgba(16,185,129,0.2)]' : 'bg-slate-900 border-white/5 text-slate-500 hover:border-white/10'}`}
        >
          TYT
        </button>
        <button
          onClick={() => setExamType('ayt')}
          className={`flex-1 py-4 rounded-2xl font-bold tracking-widest uppercase transition-all duration-300 border-2 ${examType === 'ayt' ? 'bg-blue-600/20 border-blue-500 text-blue-400 shadow-[0_0_20px_rgba(59,130,246,0.2)]' : 'bg-slate-900 border-white/5 text-slate-500 hover:border-white/10'}`}
        >
          AYT
        </button>
      </div>
      
      {/* Subject Selector */}
      <div className="flex flex-wrap items-center gap-3 mb-6">
        {QUESTION_DATA.map((subject) => (
          <button
            key={subject.id}
            onClick={() => setActiveSubject(subject.id)}
            className={`
              flex items-center gap-3 px-8 py-5 rounded-[24px] whitespace-nowrap transition-all duration-300 border-2
              ${activeSubject === subject.id 
                ? 'bg-emerald-600 border-emerald-500 text-white shadow-lg shadow-emerald-600/20 scale-105' 
                : 'bg-slate-900 border-white/5 text-slate-400 hover:border-white/10 hover:bg-white/5'
              }
            `}
          >
            <span className="text-2xl">{subject.icon}</span>
            <span className="font-bold tracking-tight text-lg">{subject.name}</span>
          </button>
        ))}
      </div>

      {/* Analysis Table */}
      <div className="bg-slate-900/40 border border-white/5 rounded-[40px] overflow-hidden shadow-2xl">
        <div className="p-8 border-b border-white/5 flex items-center justify-between bg-white/5">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 flex items-center justify-center text-emerald-500">
              <LineChart size={20} />
            </div>
            <div>
              <h3 className="text-xl font-bold text-white tracking-tight">{currentSubject.name} {examType === 'tyt' ? 'TYT' : 'AYT'} Soru Dağılımı</h3>
              {examType === 'ayt' && ['tarih', 'cografya'].includes(activeSubject) && (
                <p className="text-slate-400 text-xs mt-1">
                  * Sosyal-1 ve Sosyal-2 testlerindeki soru sayılarının toplamıdır.
                </p>
              )}
            </div>
          </div>
          <div className="hidden sm:flex gap-2">
            {['2025', '2024', '2023', '2022', '2021'].map(year => (
              <span key={year} className="px-4 py-1.5 rounded-full bg-slate-800 text-slate-400 text-xs font-black tracking-widest">{year}</span>
            ))}
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-900/20">
                <th className="p-6 text-slate-500 text-xs font-black uppercase tracking-widest">Konu Adı</th>
                <th className="p-6 text-center text-slate-500 text-xs font-black uppercase tracking-widest">2025</th>
                <th className="p-6 text-center text-slate-500 text-xs font-black uppercase tracking-widest">2024</th>
                <th className="p-6 text-center text-slate-500 text-xs font-black uppercase tracking-widest">2023</th>
                <th className="p-6 text-center text-slate-500 text-xs font-black uppercase tracking-widest">2022</th>
                <th className="p-6 text-center text-slate-500 text-xs font-black uppercase tracking-widest">2021</th>
                <th className="p-6 text-right text-slate-500 text-xs font-black uppercase tracking-widest">Ortalama</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              <AnimatePresence mode="wait">
                {currentSubject[examType]?.topics.map((topic, index) => {
                  const avg = (topic.data.reduce((acc, curr) => acc + curr.count, 0) / topic.data.length).toFixed(1);
                  return (
                    <motion.tr 
                      key={`${activeSubject}-${topic.name}`}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.03 }}
                      className="hover:bg-white/5 transition-colors group"
                    >
                      <td className="p-6">
                        <div className="flex items-center gap-3">
                          <ChevronRight size={14} className="text-slate-700 group-hover:text-emerald-500 transition-colors" />
                          <span className="text-slate-300 font-semibold group-hover:text-white transition-colors">{topic.name}</span>
                        </div>
                      </td>
                      {topic.data.map((d, i) => (
                        <td key={i} className="p-6 text-center">
                          <div className={`
                            inline-flex items-center justify-center w-10 h-10 rounded-xl font-black text-sm
                            ${d.count > 2 ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/20' : 
                              d.count > 0 ? 'bg-blue-500/10 text-blue-400 border border-white/5' : 
                              'bg-slate-800/50 text-slate-600 border border-white/5'}
                          `}>
                            {d.count}
                          </div>
                        </td>
                      ))}
                      <td className="p-6 text-right">
                        <span className="px-3 py-1 rounded-lg bg-emerald-500/10 text-emerald-500 text-xs font-black">
                          {avg}
                        </span>
                      </td>
                    </motion.tr>
                  );
                })}
              </AnimatePresence>
            </tbody>
          </table>
        </div>
      </div>

      {/* Info Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div className="bg-slate-900 border border-white/5 p-8 rounded-[32px] flex items-start gap-6">
          <div className="w-14 h-14 rounded-2xl bg-blue-500/10 flex items-center justify-center text-blue-500 shrink-0">
            <HelpCircle size={28} />
          </div>
          <div>
            <h4 className="text-white font-bold mb-2 tracking-tight text-lg">Bu Bilgiyle Ne Yapmalıyım?</h4>
            <p className="text-slate-400 text-sm leading-relaxed">
              Ortalaması yüksek olan konular sınavın iskeletini oluşturur. Örneğin Matematik için "Problemler" her yıl sınavın yaklaşık %30'unu oluşturur. Çalışma saatlerini bu dağılıma göre orantıla.
            </p>
          </div>
        </div>
        <div className="bg-slate-900 border border-white/5 p-8 rounded-[32px] flex items-start gap-6">
          <div className="w-14 h-14 rounded-2xl bg-indigo-500/10 flex items-center justify-center text-indigo-500 shrink-0">
            <Sparkles size={28} />
          </div>
          <div>
            <h4 className="text-white font-bold mb-2 tracking-tight text-lg">Yapay Zeka Analizi</h4>
            <p className="text-slate-400 text-sm leading-relaxed">
              ÖSYM son yıllarda Mantık ve Fonksiyon sorularını "Problemler" içine yedirerek sormaya başladı. Sadece konuyu değil, konular arası geçişi de öğrenmelisin.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
