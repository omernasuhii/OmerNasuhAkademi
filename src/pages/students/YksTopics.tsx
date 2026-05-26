import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  BookText, 
  Layers, 
  Info, 
  ChevronRight, 
  CheckCircle2, 
  Zap,
  GraduationCap,
  Calendar,
  AlertCircle
} from 'lucide-react';

interface Topic {
  title: string;
  isNew?: boolean;
  isChanged?: boolean;
}

interface SubjectTopics {
  id: string;
  name: string;
  icon: string;
  color: string;
  tyt: Topic[];
  ayt: Topic[];
  maarif: Topic[]; // Only for 9-10 (TYT range)
}

const TOPICS_DATA: SubjectTopics[] = [
  {
    id: 'turkce',
    name: 'Türkçe',
    icon: '🖋️',
    color: 'emerald',
    tyt: [
      { title: 'Sözcükte Anlam' },
      { title: 'Cümlede Anlam' },
      { title: 'Paragraf (Ana Düşünce, Yapı, Yorum)' },
      { title: 'Ses Bilgisi' },
      { title: 'Yazım Kuralları' },
      { title: 'Noktalama İşaretleri' },
      { title: 'Sözcük Yapısı ve Ekler' },
      { title: 'Sözcük Türleri (İsim, Sıfat, Zamir, Zarf)' },
      { title: 'Edat, Bağlaç, Ünlem' },
      { title: 'Fiiller ve Ek Fiil' },
      { title: 'Fiilimsiler' },
      { title: 'Cümlenin Ögeleri' },
      { title: 'Cümle Türleri' },
      { title: 'Anlatım Bozuklukları' }
    ],
    ayt: [
      { title: 'Güzel Sanatlar ve Edebiyat' },
      { title: 'Coşku ve Heyecanı Dile Getiren Metinler (Şiir)' },
      { title: 'Olay Çevresinde Oluşan Edebi Metinler' },
      { title: 'Öğretici Metinler' },
      { title: 'Tarih İçinde Türk Edebiyatı' },
      { title: 'Destan Dönemi Türk Edebiyatı' },
      { title: 'İslamiyet Etkisinde Gelişen Türk Edebiyatı' },
      { title: 'Tanzimat Edebiyatı' },
      { title: 'Servet-i Fünun ve Fecr-i Ati' },
      { title: 'Milli Edebiyat' },
      { title: 'Cumhuriyet Dönemi Türk Edebiyatı' }
    ],
    maarif: [
      { title: 'Okuma (Anlama ve Yorumlama)', isChanged: true },
      { title: 'Yazma (Yaratıcı ve Akademik)', isNew: true },
      { title: 'Konuşma ve Sunum Becerileri', isNew: true },
      { title: 'Dil Bilgisi (İşlevsel Yaklaşım)', isChanged: true },
      { title: 'Edebi Metin Analizi', isChanged: true }
    ]
  },
  {
    id: 'matematik',
    name: 'Matematik',
    icon: '➕',
    color: 'blue',
    tyt: [
      { title: 'Temel Kavramlar' },
      { title: 'Sayı Basamakları' },
      { title: 'Bölme ve Bölünebilme' },
      { title: 'EBOB-EKOK' },
      { title: 'Rasyonel Sayılar' },
      { title: 'Basit Eşitsizlikler' },
      { title: 'Mutlak Değer' },
      { title: 'Üslü Sayılar' },
      { title: 'Köklü Sayılar' },
      { title: 'Çarpanlara Ayırma' },
      { title: 'Oran-Orantı' },
      { title: 'Denklem Çözme' },
      { title: 'Problemler (Sayı, Kesir, Yaş, İşçi, Karışım, Yüzde, Hareket, Grafik)' },
      { title: 'Kümeler' },
      { title: 'Fonksiyonlar' },
      { title: 'Permütasyon-Kombinasyon' },
      { title: 'Olasılık' },
      { title: 'Veri ve İstatistik' }
    ],
    ayt: [
      { title: 'Polinomlar' },
      { title: '2. Dereceden Denklemler' },
      { title: 'Karmaşık Sayılar' },
      { title: 'Eşitsizlikler' },
      { title: 'Parabol' },
      { title: 'Logaritma' },
      { title: 'Diziler' },
      { title: 'Trigonometri' },
      { title: 'Limit ve Süreklilik' },
      { title: 'Türev' },
      { title: 'İntegral' }
    ],
    maarif: [
      { title: 'Sayı Kümeleri ve İşlemler', isChanged: true },
      { title: 'Mantık ve İspat', isNew: true },
      { title: 'Denklemler ve Eşitsizlikler' },
      { title: 'Fonksiyonlar (Algoritmik Yaklaşım)', isChanged: true },
      { title: 'Veri Analizi ve Karar Verme', isChanged: true },
      { title: 'Geometrik Şekiller ve Ölçme' }
    ]
  },
  {
    id: 'fizik',
    name: 'Fizik',
    icon: '⚡',
    color: 'amber',
    tyt: [
      { title: 'Fizik Bilimine Giriş' },
      { title: 'Madde ve Özellikleri' },
      { title: 'Hareket ve Kuvvet' },
      { title: 'Enerji' },
      { title: 'Isı, Sıcaklık ve Genleşme' },
      { title: 'Basınç ve Kaldırma Kuvveti' },
      { title: 'Elektrostatik' },
      { title: 'Elektrik ve Manyetizma' },
      { title: 'Optik' },
      { title: 'Dalgalar' }
    ],
    ayt: [
      { title: 'Vektörler' },
      { title: 'Bağıl Hareket' },
      { title: 'Newton’un Hareket Yasaları' },
      { title: 'Bir Boyutta Sabit İvmeli Hareket' },
      { title: 'İki Boyutta Hareket' },
      { title: 'Enerji ve Hareket' },
      { title: 'İtme ve Çizgisel Momentum' },
      { title: 'Tork ve Denge' },
      { title: 'Basit Makineler' },
      { title: 'Elektriksel Kuvvet ve Alan' },
      { title: 'Manyetizma ve Elektromanyetik İndükleme' },
      { title: 'Çembersel Hareket' },
      { title: 'Basit Harmonik Hareket' },
      { title: 'Dalga Mekaniği' },
      { title: 'Atom Fiziğine Giriş ve Radyoaktivite' },
      { title: 'Modern Fizik' }
    ],
    maarif: [
      { title: 'Fiziksel Nicelikler ve Ölçme', isChanged: true },
      { title: 'Kuvvet ve Hareket (Modelleme Odaklı)', isChanged: true },
      { title: 'Enerjinin Dönüşümü ve Verimlilik' },
      { title: 'Dalgalar ve Teknolojik Bakış', isNew: true },
      { title: 'Optik ve Işık Teorileri' }
    ]
  },
  {
    id: 'geometri',
    name: 'Geometri',
    icon: '📐',
    color: 'emerald',
    tyt: [
      { title: 'Doğruda ve Üçgende Açılar' },
      { title: 'Dik Üçgen' },
      { title: 'İkizkenar ve Eşkenar Üçgen' },
      { title: 'Üçgende Alan ve Benzerlik' },
      { title: 'Üçgen Kenar-Açı İlişkileri' },
      { title: 'Çokgenler' },
      { title: 'Dörtgenler' },
      { title: 'Yamuk, Paralelkenar, Eşkenar Dörtgen, Dikdörtgen, Kare, Deltoid' },
      { title: 'Çember ve Daire' },
      { title: 'Katı Cisimler' }
    ],
    ayt: [
      { title: 'Çemberin Analitik İncelenmesi' },
      { title: 'Dönüşüm Geometrisi' },
      { title: 'Trigonometri-2' },
      { title: 'Katı Cisimler (Derinlemesine)' }
    ],
    maarif: [
      { title: 'Geometrik Şekillerin Analizi', isChanged: true },
      { title: 'Dönüşümlerle Modelleme', isNew: true },
      { title: 'Ölçme ve Veri İlişkisi' }
    ]
  },
  {
    id: 'kimya',
    name: 'Kimya',
    icon: '🧪',
    color: 'emerald',
    tyt: [
      { title: 'Kimya Bilimi' },
      { title: 'Atom ve Periyodik Sistem' },
      { title: 'Kimyasal Türler Arası Etkileşimler' },
      { title: 'Maddenin Halleri' },
      { title: 'Doğa ve Kimya' },
      { title: 'Kimyanın Temel Kanunları' },
      { title: 'Karışımlar' },
      { title: 'Asitler, Bazlar ve Tuzlar' },
      { title: 'Kimya Her Yerde' }
    ],
    ayt: [
      { title: 'Modern Atom Teorisi' },
      { title: 'Gazlar' },
      { title: 'Sıvı Çözeltiler ve Çözünürlük' },
      { title: 'Kimyasal Tepkimelerde Enerji' },
      { title: 'Kimyasal Tepkimelerde Hız' },
      { title: 'Kimyasal Denge' },
      { title: 'Asit-Baz Dengesi' },
      { title: 'Çözünürlük Dengesi' },
      { title: 'Kimya ve Elektrik' },
      { title: 'Karbon Kimyasına Giriş' },
      { title: 'Organik Bileşikler' },
      { title: 'Enerji Kaynakları ve Bilimsel Gelişmeler' }
    ],
    maarif: [
      { title: 'Atom ve Elementlerin Oluşumu', isNew: true },
      { title: 'Kimyasal Bağlar ve Etkileşimler', isChanged: true },
      { title: 'Maddi Dünyanın Düzeni', isChanged: true }
    ]
  },
  {
    id: 'biyoloji',
    name: 'Biyoloji',
    icon: '🌿',
    color: 'emerald',
    tyt: [
      { title: 'Canlıların Ortak Özellikleri' },
      { title: 'Canlıların Temel Bileşenleri' },
      { title: 'Hücre' },
      { title: 'Canlıların Sınıflandırılması' },
      { title: 'Hücre Bölünmeleri' },
      { title: 'Kalıtım' },
      { title: 'Ekosistem Ekolojisi ve Güncel Çevre Sorunları' }
    ],
    ayt: [
      { title: 'İnsan Fizyolojisi (Sistemler)' },
      { title: 'Komünite ve Popülasyon Ekolojisi' },
      { title: 'Genden Proteine' },
      { title: 'Canlılarda Enerji Dönüşümleri' },
      { title: 'Bitki Biyolojisi' },
      { title: 'Canlılar ve Çevre' }
    ],
    maarif: [
      { title: 'Hücreden Organizmaya', isChanged: true },
      { title: 'Biyolojik Çeşitlilik ve Koruma', isNew: true },
      { title: 'Kalıtımın Temelleri' }
    ]
  },
  {
    id: 'tarih',
    name: 'Tarih',
    icon: '📜',
    color: 'emerald',
    tyt: [
      { title: 'Tarih ve Zaman' },
      { title: 'İnsanlığın İlk Dönemleri' },
      { title: 'Orta Çağ’da Dünya' },
      { title: 'İlk ve Orta Çağlarda Türk Dünyası' },
      { title: 'İslam Medeniyetinin Doğuşu' },
      { title: 'Türklerin İslamiyet’i Kabulü ve İlk Türk İslam Devletleri' },
      { title: 'Yerleşme ve Devletleşme Sürecinde Selçuklu Türkiyesi' },
      { title: 'Beylikten Devlete Osmanlı Siyaseti (1302-1453)' },
      { title: 'Dünya Gücü Osmanlı (1453-1595)' },
      { title: 'Değişim Çağında Avrupa ve Osmanlı' },
      { title: 'Uluslararası İlişkilerde Denge Stratejisi (1774-1914)' },
      { title: 'XX. Yüzyıl Başlarında Osmanlı Devleti ve Dünya' },
      { title: 'Milli Mücadele' },
      { title: 'Atatürkçülük ve Türk İnkılabı' }
    ],
    ayt: [
      { title: 'İki Savaş Arasındaki Dönemde Türkiye ve Dünya' },
      { title: 'II. Dünya Savaşı Sürecinde Türkiye ve Dünya' },
      { title: 'II. Dünya Savaşı Sonrasında Türkiye ve Dünya' },
      { title: 'Yumuşama Dönemi ve Sonrası' },
      { title: 'Küreselleşen Dünya' }
    ],
    maarif: [
      { title: 'Tarih Yazımı ve Kanıt Analizi', isNew: true },
      { title: 'Uygarlıkların Oluşumu ve Etkileşimi', isChanged: true },
      { title: 'Türk Tarihinde Kurumsallaşma', isChanged: true }
    ]
  },
  {
    id: 'cografya',
    name: 'Coğrafya',
    icon: '🌍',
    color: 'emerald',
    tyt: [
      { title: 'Doğa ve İnsan' },
      { title: 'Dünya’nın Şekli ve Hareketleri' },
      { title: 'Yer ve Zaman (Coğrafi Konum)' },
      { title: 'Harita Bilgisi' },
      { title: 'Atmosfer ve İklim' },
      { title: 'Yer’in Yapısı ve İç Kuvvetler' },
      { title: 'Dış Kuvvetler' },
      { title: 'Su, Toprak ve Bitki Varlığı' },
      { title: 'Yerleşme ve Nüfus' },
      { title: 'Ekonomik Faaliyetler' },
      { title: 'Bölgeler' },
      { title: 'Doğal Afetler' }
    ],
    ayt: [
      { title: 'Ekosistemlerin İşleyişi' },
      { title: 'Nüfus Politikaları' },
      { title: 'Türkiye’de Ekonomik Faaliyetler' },
      { title: 'Küresel Ortam: Bölgeler ve Ülkeler' },
      { title: 'Çevre ve Toplum' }
    ],
    maarif: [
      { title: 'Mekânsal Analiz Becerileri', isChanged: true },
      { title: 'Yerkürenin Dinamikleri ve İnsan', isChanged: true },
      { title: 'Sürdürülebilir Çevre Yönetimi', isNew: true }
    ]
  }
];

export default function YksTopics() {
  const [activeSubject, setActiveSubject] = useState(TOPICS_DATA[0].id);
  const [activeModel, setActiveModel] = useState<'current' | 'maarif'>('current');

  const currentSubject = TOPICS_DATA.find(s => s.id === activeSubject)!;

  return (
    <div className="px-[5%] sm:px-[8%] md:px-[12%] lg:px-[15%] max-w-[2000px] mx-auto py-12 space-y-12">
      {/* Header section */}
      <section className="relative overflow-hidden bg-gradient-to-br from-slate-900 via-slate-900 to-indigo-900/30 border border-white/5 p-8 md:p-16 rounded-[40px] shadow-2xl">
        <div className="absolute top-0 right-0 p-8 opacity-5">
          <BookText size={160} />
        </div>
        
        <div className="relative z-10">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-xs font-bold uppercase tracking-widest mb-6"
          >
            <GraduationCap size={14} />
            Müfredat Rehberi
          </motion.div>
          
          <motion.h1 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-4xl md:text-5xl font-black text-white tracking-tight mb-6"
          >
            YKS <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-blue-400">Konu Listesi</span>
          </motion.h1>
          
          <p className="text-slate-400 text-lg leading-relaxed max-w-2xl">
            Sınava hazırlık sürecinde hangi konudan sorumlu olduğunu bilmek planlamanın temelidir. Maarif Modeli ve Mevcut Müfredat arasındaki farkları incele.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 mt-10">
            <button
              onClick={() => setActiveModel('current')}
              className={`flex-1 p-6 rounded-3xl border-2 transition-all duration-300 text-left ${activeModel === 'current' ? 'bg-indigo-600/10 border-indigo-500 text-white' : 'bg-white/5 border-transparent text-slate-400 hover:bg-white/10'}`}
            >
              <div className="flex items-center justify-between mb-2">
                <Layers size={24} className={activeModel === 'current' ? 'text-indigo-400' : 'text-slate-500'} />
                {activeModel === 'current' && <CheckCircle2 size={20} className="text-indigo-400" />}
              </div>
              <h3 className="font-bold text-lg tracking-tight">Mevcut Müfredat</h3>
              <p className="text-xs opacity-60">11. ve 12. sınıflar için geçerli sistem.</p>
            </button>

            <button
              onClick={() => setActiveModel('maarif')}
              className={`flex-1 p-6 rounded-3xl border-2 transition-all duration-300 text-left ${activeModel === 'maarif' ? 'bg-indigo-600/10 border-indigo-500 text-white' : 'bg-white/5 border-transparent text-slate-400 hover:bg-white/10'}`}
            >
              <div className="flex items-center justify-between mb-2">
                <Zap size={24} className={activeModel === 'maarif' ? 'text-indigo-400' : 'text-slate-500'} />
                {activeModel === 'maarif' && <CheckCircle2 size={20} className="text-indigo-400" />}
              </div>
              <h3 className="font-bold text-lg tracking-tight">Maarif Modeli</h3>
              <p className="text-xs opacity-60">9. ve 10. sınıflar (TYT) için yeni nesil model.</p>
            </button>
          </div>
        </div>
      </section>

      {/* Subject Selector */}
      <div className="flex flex-wrap items-center gap-3 mb-6">
        {TOPICS_DATA.map((subject) => (
          <button
            key={subject.id}
            onClick={() => setActiveSubject(subject.id)}
            className={`
              flex items-center gap-3 px-8 py-5 rounded-[24px] whitespace-nowrap transition-all duration-300 border-2
              ${activeSubject === subject.id 
                ? 'bg-blue-600 border-blue-500 text-white shadow-lg shadow-blue-600/20 scale-105' 
                : 'bg-slate-900 border-white/5 text-slate-400 hover:border-white/10 hover:bg-white/5'
              }
            `}
          >
            <span className="text-2xl">{subject.icon}</span>
            <span className="font-bold tracking-tight text-lg">{subject.name}</span>
          </button>
        ))}
      </div>

      {/* Warning for Maarif Model limitations */}
      {activeModel === 'maarif' && (
        <motion.div 
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className="bg-amber-500/5 border border-amber-500/20 p-6 rounded-3xl flex items-start gap-4"
        >
          <div className="w-10 h-10 rounded-xl bg-amber-500/10 flex items-center justify-center text-amber-500 shrink-0">
            <AlertCircle size={20} />
          </div>
          <div>
            <h4 className="text-amber-500 font-bold mb-1 tracking-tight">Önemli Bilgilendirme</h4>
            <p className="text-slate-400 text-sm leading-relaxed">
              Maarif Modeli şu an için sadece 9. ve 10. sınıf (TYT kapsamı) düzeyinde uygulanmaktadır. 11. ve 12. sınıf AYT konuları henüz bu model kapsamına dahil edilmemiştir.
            </p>
          </div>
        </motion.div>
      )}

      {/* Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <AnimatePresence mode="wait">
          {activeModel === 'current' ? (
            <>
              {/* TYT COLUMN */}
              <motion.div 
                key={`${activeSubject}-tyt`}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="space-y-6"
              >
                <div className="flex items-center justify-between px-4">
                  <h2 className="text-2xl font-black text-white tracking-tight flex items-center gap-3">
                    <div className="w-2 h-8 bg-blue-500 rounded-full"></div>
                    TYT Konuları
                  </h2>
                </div>
                <div className="bg-slate-900/40 border border-white/5 rounded-[32px] p-8 space-y-3">
                  {currentSubject.tyt.map((topic, i) => (
                    <TopicItem key={i} topic={topic} index={i} />
                  ))}
                </div>
              </motion.div>

              {/* AYT COLUMN */}
              <motion.div 
                key={`${activeSubject}-ayt`}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ delay: 0.1 }}
                className="space-y-6"
              >
                <div className="flex items-center justify-between px-4">
                  <h2 className="text-2xl font-black text-white tracking-tight flex items-center gap-3">
                    <div className="w-2 h-8 bg-indigo-500 rounded-full"></div>
                    AYT Konuları
                  </h2>
                </div>
                <div className="bg-slate-900/40 border border-white/5 rounded-[32px] p-8 space-y-3">
                  {currentSubject.ayt.map((topic, i) => (
                    <TopicItem key={i} topic={topic} index={i} />
                  ))}
                </div>
              </motion.div>
            </>
          ) : (
            <>
              {/* MAARIF COLUMN */}
              <motion.div 
                key={`${activeSubject}-maarif`}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="lg:col-span-2 space-y-6"
              >
                <div className="flex items-center justify-between px-4">
                  <h2 className="text-2xl font-black text-white tracking-tight flex items-center gap-3">
                    <div className="w-2 h-8 bg-emerald-500 rounded-full"></div>
                    Maarif Modeli (9-10. Sınıf)
                  </h2>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {currentSubject.maarif.map((topic, i) => (
                    <div key={i} className="bg-slate-900/40 border border-white/5 rounded-3xl p-6 hover:border-emerald-500/20 transition-all group">
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex items-center gap-4">
                          <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center text-emerald-500 group-hover:scale-110 transition-transform">
                            <CheckCircle2 size={20} />
                          </div>
                          <span className="text-slate-200 font-bold tracking-tight">{topic.title}</span>
                        </div>
                        <div className="flex gap-2">
                          {topic.isNew && <span className="px-2 py-0.5 bg-emerald-500/10 text-emerald-500 text-[8px] font-black uppercase rounded">Yeni</span>}
                          {topic.isChanged && <span className="px-2 py-0.5 bg-amber-500/10 text-amber-500 text-[8px] font-black uppercase rounded">Güncellendi</span>}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </motion.div>
            </>
          )}
        </AnimatePresence>
      </div>

      {/* Legend Footer */}
      <footer className="pt-8 border-t border-white/5 grid grid-cols-1 md:grid-cols-3 gap-8">
        <div className="flex items-center gap-4">
          <div className="w-10 h-10 rounded-2xl bg-indigo-500/10 flex items-center justify-center text-indigo-500">
            <Info size={18} />
          </div>
          <div>
            <p className="text-white text-sm font-bold">MEB Uyumlu</p>
            <p className="text-slate-500 text-xs text-balance">Konular en güncel MEB yayınları baz alınarak hazırlanmıştır.</p>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <div className="w-10 h-10 rounded-2xl bg-emerald-500/10 flex items-center justify-center text-emerald-500">
            <Zap size={18} />
          </div>
          <div>
            <p className="text-white text-sm font-bold">Beceri Temelli</p>
            <p className="text-slate-500 text-xs text-balance">Yeni modelde formül yerine beceri ve uygulama ön plandadır.</p>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <div className="w-10 h-10 rounded-2xl bg-blue-500/10 flex items-center justify-center text-blue-500">
            <Calendar size={18} />
          </div>
          <div>
            <p className="text-white text-sm font-bold">TYT/AYT Ayrımı</p>
            <p className="text-slate-500 text-xs text-balance">AYT hazırlığı için mevcut müfredat bölümünü takip etmelisin.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}

const TopicItem = ({ topic, index }: { topic: Topic; index: number; key?: React.Key }) => {
  return (
    <div className="flex items-center justify-between p-4 rounded-2xl hover:bg-white/5 transition-colors group">
      <div className="flex items-center gap-4">
        <span className="text-slate-700 font-black text-xs w-6">{index + 1}.</span>
        <span className="text-slate-300 font-medium tracking-wide group-hover:text-white transition-colors">{topic.title}</span>
      </div>
      <ChevronRight size={16} className="text-slate-700 group-hover:text-slate-400 group-hover:translate-x-1 transition-all" />
    </div>
  );
};
