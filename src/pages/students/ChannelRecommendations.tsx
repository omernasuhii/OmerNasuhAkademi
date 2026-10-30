import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Youtube, 
  ExternalLink, 
  Play, 
  BookOpen, 
  Info,
  ChevronRight,
  Sparkles
} from 'lucide-react';

interface Recommendation {
  id: string;
  channelName: string;
  teacherName: string;
  videoTitle: string;
  videoId: string;
  channelUrl: string;
  tags: string[];
  aiAnalysis: string;
}

interface Subject {
  id: string;
  name: string;
  representativeTopic: string;
  icon: string;
  recommendations: Recommendation[];
}

const YKS_RECOMMENDATIONS: Subject[] = [
  {
    id: 'turkce',
    name: 'Türkçe',
    representativeTopic: 'Cümle Bilgisi',
    icon: '🖋️',
    recommendations: [
      {
        id: 't1',
        channelName: 'Rüştü Hoca',
        teacherName: 'Rüştü Bayındır',
        videoTitle: 'Cümle Türleri | TYT Türkçe',
        videoId: 'p6Y_-Z9P0W0',
        channelUrl: 'https://www.youtube.com/@RustuHoca',
        tags: ['TYT', 'Taktiklerle'],
        aiAnalysis: 'Rüştü Hoca, "taktiklerle" anlatımıyla dil bilgisini ve paragrafı pratikleştirir. Uzun konuları kısa yollarla öğretmesi sınavda zaman kazandırır.'
      },
      {
        id: 't2',
        channelName: 'Kadir Gümüş',
        teacherName: 'Kadir Gümüş',
        videoTitle: 'Cümlenin Ögeleri | TYT',
        videoId: '8YdZ6qKlp_Q',
        channelUrl: 'https://www.youtube.com/@benimhocam',
        tags: ['Benim Hocam', 'Detay'],
        aiAnalysis: 'Kadir Hoca, Türkçeye çok hakim ve edebi bir dille anlatır. Dilin mantığını en temelden alıp detaylandırarak anlatması kalıcı öğrenme sağlar.'
      }
    ]
  },
  {
    id: 'matematik',
    name: 'Matematik',
    representativeTopic: 'Fonksiyonlar',
    icon: '➕',
    recommendations: [
      {
        id: 'm1',
        channelName: 'Rehber Matematik',
        teacherName: 'Mehmet Hoca',
        videoTitle: 'Fonksiyonlar - 1 | TYT Matematik Kamfı',
        videoId: 'L1WAbI6f85k',
        channelUrl: 'https://www.youtube.com/@RehberMatematik',
        tags: ['TYT', 'Konu Anlatımı'],
        aiAnalysis: 'Mehmet Hoca, özellikle matematiğe karşı ön yargısı olan öğrenciler için harika bir tercihtir. Anlatımı oldukça sade ve motive edicidir. Temelden başlama konusunda oldukça başarılıdır.'
      },
      {
        id: 'm2',
        channelName: 'Mert Hoca',
        teacherName: 'Mert Hoca',
        videoTitle: 'Fonksiyonlar | 70 Günde TYT Matematik Kampı',
        videoId: '8s3L7J-D4iM',
        channelUrl: 'https://www.youtube.com/@merthoca',
        tags: ['TYT', 'ADIM ADIM'],
        aiAnalysis: 'Mert Hoca, sistemli ve disiplinli bir ilerleme isteyen öğrenciler için idealdir. Kampları oldukça planlıdır ve orta-ileri seviye sorularla ufuk açar.'
      },
      {
        id: 'm3',
        channelName: 'Eyüp B. Matematik',
        teacherName: 'Eyüp B.',
        videoTitle: 'Fonksiyonlar | Konu Anlatımı',
        videoId: 'B6Y-F-w6q7E',
        channelUrl: 'https://www.youtube.com/@EyupB',
        tags: ['Gelişim', 'Soru Çözümü'],
        aiAnalysis: 'Eyüp B., özellikle belirli bir temeli olan ve mantığını kavrayarak ilerlemek isteyen öğrenciler için eşsizdir. Sorulara yaklaşım tarzı derece isteyen öğrencilere hitap eder.'
      },
      {
        id: 'm4',
        channelName: 'Benim Hocam',
        teacherName: 'İlyas Güneş',
        videoTitle: 'Fonksiyonlara Giriş - 1',
        videoId: 'v5V2_iP1aOQ',
        channelUrl: 'https://www.youtube.com/@benimhocam',
        tags: ['Detaylı', 'Giriş'],
        aiAnalysis: 'İlyas Hoca, çok detaylı ve kapsamlı anlatımıyla bilinir. Sıfırdan alıp en ince ayrıntısına kadar öğrenmek isteyenler için güvenli bir limandır.'
      }
    ]
  },
  {
    id: 'geometri',
    name: 'Geometri',
    representativeTopic: 'Üçgende Açılar',
    icon: '📐',
    recommendations: [
      {
        id: 'g1',
        channelName: 'Kenan Kara ile Geometri',
        teacherName: 'Kenan Kara',
        videoTitle: 'Üçgende Açılar | TYT-AYT Geometri Kampı',
        videoId: 'f6Yk_W5N3N8',
        channelUrl: 'https://www.youtube.com/@KenanKara',
        tags: ['TYT-AYT', 'Görsel Mantık'],
        aiAnalysis: 'Kenan Hoca, geometride şekli görmeyi değil, şekli okumayı öğretir. Ezberlemeyi sevmez, her kuralın ispatıyla mantığını kavratır.'
      },
      {
        id: 'g2',
        channelName: 'Mert Hoca Geometri',
        teacherName: 'Mert Hoca',
        videoTitle: 'Üçgende Açılar | 90 Günde Geometri Kampı',
        videoId: 'L1WAbI6f85k',
        channelUrl: 'https://www.youtube.com/@merthoca',
        tags: ['TYT-AYT', 'Sistemli'],
        aiAnalysis: 'Mert Hoca, geometride disiplinli bir program arayanlar için harikadır. Adım adım ilerleyen yapısıyla geometri korkusunu yenmenizi sağlar.'
      }
    ]
  },
  {
    id: 'fizik',
    name: 'Fizik',
    representativeTopic: 'Hareket ve Kuvvet',
    icon: '⚡',
    recommendations: [
      {
        id: 'f1',
        channelName: 'VIP Fizik',
        teacherName: 'Furkan Hoca',
        videoTitle: 'Hareket ve Kuvvet | TYT Fizik Kampı',
        videoId: 'qjA2MizV094',
        channelUrl: 'https://www.youtube.com/@VIPFizik',
        tags: ['TYT', 'Görsel Anlatım'],
        aiAnalysis: 'Vip Fizik, görselleştirme ve animasyonlarla fiziği somutlaştırma konusunda çok başarılıdır. Deneylerle desteklenen anlatımı akılda kalıcılığı artırır.'
      },
      {
        id: 'f2',
        channelName: 'Fizikle Barış',
        teacherName: 'Barış Hoca',
        videoTitle: 'Kuvvet ve Hareket | TYT Fizik',
        videoId: '4-O8iLp3E-U',
        channelUrl: 'https://www.youtube.com/@FizikleBaris',
        tags: ['Dinamik', 'Konu Özeti'],
        aiAnalysis: 'Barış Hoca, enerjik ve dinamik anlatımıyla öğrenciyi derste tutar. Önemli püf noktalarını ve soru kaçırtan kısımları vurgulaması değerlidir.'
      },
      {
        id: 'f3',
        channelName: 'Özcan Aykın',
        teacherName: 'Özcan Aykın',
        videoTitle: 'Hareket ve Kuvvet - Giriş',
        videoId: 'WpS9m7ZfXGg',
        channelUrl: 'https://www.youtube.com/@ozcanaykin',
        tags: ['Akıcı', 'Mantık'],
        aiAnalysis: 'Özcan Hoca, fiziğin mantığını öğretmeye odaklanır. Ezberden uzak, neden-sonuç ilişkisine dayalı anlatımı konuyu tam anlamıyla kavramana yardımcı olur.'
      },
      {
        id: 'f4',
        channelName: 'Altun Fizik',
        teacherName: 'Altun Hoca',
        videoTitle: 'Dinamik | Kuvvet ve Hareket',
        videoId: 'y_n5pSkis7Q',
        channelUrl: 'https://www.youtube.com/@AltunFizik',
        tags: ['Analitik', 'Soru Odaklı'],
        aiAnalysis: 'Altun Fizik, daha teknik ve analitik bir yaklaşım sergiler. Soru çözümleriyle konuyu pekiştirme konusunda oldukça etkili bir kanaldır.'
      }
    ]
  },
  {
    id: 'kimya',
    name: 'Kimya',
    representativeTopic: 'Atom ve Yapısı',
    icon: '🧪',
    recommendations: [
      {
        id: 'k1',
        channelName: 'Görkem Şahin',
        teacherName: 'Görkem Şahin',
        videoTitle: 'Atomun Yapısı | TYT Kimya',
        videoId: 'nL6G05I-mG4',
        channelUrl: 'https://www.youtube.com/@gorkemsahin',
        tags: ['TYT', 'Pratik Kodlama'],
        aiAnalysis: 'Görkem Hoca, samimi anlatımı ve akılda kalıcı kodlamalarıyla kimyayı sevdirir. Özellikle sözel kısımları hikayeleştirmesi büyük avantajdır.'
      },
      {
        id: 'k2',
        channelName: 'Kimya Adası',
        teacherName: 'Kimya Adası',
        videoTitle: 'Atom ve Periyodik Sistem',
        videoId: '8YdZ6qKlp_Q',
        channelUrl: 'https://www.youtube.com/@KimyaAdasi',
        tags: ['TYT', 'Renkli Anlatım'],
        aiAnalysis: 'Kimya Adası, renkli görselleri ve sistemli anlatımıyla dikkat çeker. TYT konularını hızlı ve etkili bir şekilde bitirmek isteyenler için idealdir.'
      },
      {
        id: 'k3',
        channelName: 'Ferrum Kimya',
        teacherName: 'Ferrum Hoca',
        videoTitle: 'Atomun Yapısı ve Tanecikler',
        videoId: 't0V7v4DqZ0o',
        channelUrl: 'https://www.youtube.com/@FerrumKimya',
        tags: ['Sade', 'Öz'],
        aiAnalysis: 'Ferrum Kimya, sakin ve öz anlatımıyla kafa karıştırmaz. Karmaşık konuları en sade haline indirgeyerek anlatma becerisi çok yüksektir.'
      },
      {
        id: 'k4',
        channelName: 'Paraksilen Kimya',
        teacherName: 'Paraksilen',
        videoTitle: 'Atomun Yapısı - Konu Anlatımı',
        videoId: 'f6Yk_W5N3N8',
        channelUrl: 'https://www.youtube.com/@ParaksilenKimya',
        tags: ['Derinlemesine', 'Akademik'],
        aiAnalysis: 'Paraksilen Kimya, akademik derinliği olan ve işin mantığını sonuna kadar sorgulayan bir kanaldır. Full çekmek isteyen öğrenciler için birebirdir.'
      }
    ]
  },
  {
    id: 'biyoloji',
    name: 'Biyoloji',
    representativeTopic: 'Hücre',
    icon: '🌿',
    recommendations: [
      {
        id: 'b1',
        channelName: 'Selin Hoca',
        teacherName: 'Selin Hoca',
        videoTitle: 'Hücre | TYT Biyoloji',
        videoId: 'e9-iR0oY3-k',
        channelUrl: 'https://www.youtube.com/@SelinHoca',
        tags: ['TYT', 'Şematik Anlatım'],
        aiAnalysis: 'Selin Hoca, biyolojinin karmaşık yapılarını şemalarla ve çizimlerle netleştirir. Tekrar videoları ve özetleri sınav öncesi çok faydalıdır.'
      },
      {
        id: 'b2',
        channelName: 'Fundamentals Biyoloji',
        teacherName: 'Fundamentals',
        videoTitle: 'Hücre ve Organeller',
        videoId: 'T_K5LzXW1T8',
        channelUrl: 'https://www.youtube.com/@FundamentalsBiyoloji',
        tags: ['Müfredat Uygun', 'Net'],
        aiAnalysis: 'Fundamentals, müfredata en sadık kalan ve kafa karıştırmayan net bir anlatıma sahiptir. Sınavda ne çıkacaksa onu anlatan profesyonel bir yaklaşımı vardır.'
      },
      {
        id: 'b3',
        channelName: 'Dr. Biyoloji',
        teacherName: 'Dr. Biyoloji',
        videoTitle: 'Hücre Zarı ve Taşınma',
        videoId: 'p6Y_-Z9P0W0',
        channelUrl: 'https://www.youtube.com/@DrBiyoloji',
        tags: ['İleri Seviye', 'Derece'],
        aiAnalysis: 'Dr. Biyoloji, özellikle tıp hedefleyen ve konunun en derinini merak eden öğrenciler için mükemmeldir. Bilimsel ve detaylı bir perspektif sunar.'
      },
      {
        id: 'b4',
        channelName: 'Biyosem',
        teacherName: 'Biyosem',
        videoTitle: 'Hücre Organelleri ve Yapısı',
        videoId: 'v5V2_iP1aOQ',
        channelUrl: 'https://www.youtube.com/@biyosem',
        tags: ['Kodlamalı', 'Hızlı'],
        aiAnalysis: 'Biyosem, akıcı ve enerjik anlatımıyla konuyu hızlıca bitirmeni sağlar. Pratik kodlamaları ve soru tiplerine odaklı anlatımı sınav pratiği kazandırır.'
      }
    ]
  },
  {
    id: 'tarih',
    name: 'Tarih',
    representativeTopic: 'Tarih Bilimine Giriş',
    icon: '📜',
    recommendations: [
      {
        id: 't_r1',
        channelName: 'Ramazan Yetgin',
        teacherName: 'Ramazan Yetgin',
        videoTitle: 'Tarih ve Zaman - 1 | TYT-AYT Tarih',
        videoId: 'sT7nL_7Jp_w',
        channelUrl: 'https://www.youtube.com/@benimhocam',
        tags: ['TYT-AYT', 'Detaylı Anlatım'],
        aiAnalysis: 'Ramazan Hoca, konuyu hikayeleştirerek ve derinlemesine anlatan bir ekoldür. Özellikle AYT kısmında çıkabilecek ince detaylara hakimiyeti ile bilinir.'
      },
      {
        id: 't_r2',
        channelName: 'Sosyal Kale',
        teacherName: 'Hüseyin Sayan',
        videoTitle: 'Tarih ve Zaman | TYT Tarih Full Tekrar',
        videoId: 'qjA2MizV094',
        channelUrl: 'https://www.youtube.com/@SosyalKale',
        tags: ['TYT', 'Nokta Atışı'],
        aiAnalysis: 'Hüseyin Hoca, daha çok özet ve nokta atışı bilgilerle süreci hızlandırmak isteyen öğrencilere hitap eder. Görsel sunumları akıldadır.'
      },
      {
        id: 't_r3',
        channelName: 'Sadettin Akyay',
        teacherName: 'Sadettin Akyay',
        videoTitle: 'Tarih ve Zaman Konu Anlatımı',
        videoId: 'WpS9m7ZfXGg',
        channelUrl: 'https://www.youtube.com/@SadettinAkyay',
        tags: ['Akademik', 'Sade'],
        aiAnalysis: 'Sadettin Hoca, gereksiz detaylardan kaçınan, sınav odaklı ve oldukça sade bir anlatım diline sahiptir. Temiz ve anlaşılır bir üslubu vardır.'
      }
    ]
  },
  {
    id: 'cografya',
    name: 'Coğrafya',
    representativeTopic: 'Dünyanın Şekli ve Hareketleri',
    icon: '🌍',
    recommendations: [
      {
        id: 'c_r1',
        channelName: 'Yavuz Tuna',
        teacherName: 'Yavuz Tuna',
        videoTitle: 'Dünya’nın Şekli ve Sonuçları | TYT Coğrafya',
        videoId: '8YdZ6qKlp_Q',
        channelUrl: 'https://www.youtube.com/@YavuzTuna',
        tags: ['Harita Odaklı', 'Profesyonel'],
        aiAnalysis: 'Yavuz Hoca, harita bilgisini en iyi kullanan hocalardan biridir. Coğrafyayı ezberlemekten ziyade harita üzerinden görmeni ve yorumlamanı sağlar.'
      },
      {
        id: 'c_r2',
        channelName: 'Bayram Meral',
        teacherName: 'Bayram Meral',
        videoTitle: 'Dünya’nın Şekli ve Hareketleri - 1',
        videoId: 'nL6G05I-mG4',
        channelUrl: 'https://www.youtube.com/@benimhocam',
        tags: ['Enerjik', 'Geniş Kapsam'],
        aiAnalysis: 'Bayram Hoca, bitmek bilmeyen enerjisiyle dersi eğlenceli hale getirir. Güncel örnekler ve esprilerle konunun akılda kalmasını sağlar.'
      },
      {
        id: 'c_r3',
        channelName: 'Coğrafyanın Kodları',
        teacherName: 'Yunus Hoca',
        videoTitle: 'Dünyanın Şekli ve Hareketleri | Full Tekrar',
        videoId: 'v5V2_iP1aOQ',
        channelUrl: 'https://www.youtube.com/@CografyaninKodlari',
        tags: ['Kodlama', 'Mantık'],
        aiAnalysis: 'Yunus Hoca, zor görünen coğrafi kavramları pratik kodlamalar ve mantıksal çıkarımlarla basitleştirme konusunda uzmandır.'
      }
    ]
  }
];

export default function ChannelRecommendations() {
  const [activeSubject, setActiveSubject] = useState<string>(YKS_RECOMMENDATIONS[0]?.id || 'matematik');

  const currentSubject = YKS_RECOMMENDATIONS.find(s => s.id === activeSubject) || YKS_RECOMMENDATIONS[0];

  return (
    <div className="px-[5%] sm:px-[8%] md:px-[12%] lg:px-[15%] max-w-[2000px] mx-auto py-12 space-y-12">
      {/* Header section with instructions */}
      <section className="relative overflow-hidden bg-gradient-to-br from-indigo-900/40 via-slate-900 to-slate-900 border border-white/5 p-8 md:p-16 rounded-[40px] shadow-2xl">
        <div className="absolute top-0 right-0 p-8 opacity-10">
          <Youtube size={120} className="text-red-500" />
        </div>
        
        <div className="relative z-10 max-w-3xl">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 text-xs font-bold uppercase tracking-widest mb-6"
          >
            <Sparkles size={14} />
            Hoca Rehberi
          </motion.div>
          
          <motion.h1 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-4xl md:text-5xl font-black text-white tracking-tight mb-6"
          >
            Sana En Uygun <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-indigo-400">Hocayı Seç</span>
          </motion.h1>
          
          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="text-slate-400 text-lg leading-relaxed"
          >
            YKS maratonunda doğru hoca seçimi başarının yarısıdır. Farklı tarzdaki hocaları aynı konu üzerinden karşılaştırarak, senin dilinden en iyi hangisinin anladığını keşfet.
          </motion.p>
          
          <div className="flex flex-wrap gap-4 mt-8">
            <div className="flex items-center gap-2 text-slate-300 text-sm">
              <div className="w-8 h-8 rounded-lg bg-emerald-500/10 flex items-center justify-center text-emerald-500">
                <Play size={16} fill="currentColor" />
              </div>
              <span>Karşılaştırmalı Videolar</span>
            </div>
            <div className="flex items-center gap-2 text-slate-300 text-sm">
              <div className="w-8 h-8 rounded-lg bg-blue-500/10 flex items-center justify-center text-blue-500">
                <BookOpen size={16} />
              </div>
              <span>Konu Odaklı Analiz</span>
            </div>
          </div>
        </div>
      </section>

      {/* Tabs / Subject Navigation */}
      <div className="flex flex-wrap items-center gap-3 mb-6">
        {YKS_RECOMMENDATIONS.map((subject) => (
          <button
            key={subject.id}
            onClick={() => setActiveSubject(subject.id)}
            className={`
              flex items-center gap-3 px-6 py-4 rounded-2xl whitespace-nowrap transition-all duration-300 border-2
              ${activeSubject === subject.id 
                ? 'bg-blue-600 border-blue-500 text-white shadow-lg shadow-blue-600/20 scale-105' 
                : 'bg-slate-900 border-white/5 text-slate-400 hover:border-white/10 hover:bg-white/5'
              }
            `}
          >
            <span className="text-2xl">{subject.icon}</span>
            <span className="font-bold tracking-tight">{subject.name}</span>
          </button>
        ))}
      </div>

      {/* Representative Topic Banner */}
      <div className="bg-blue-600/5 border border-blue-500/10 p-6 rounded-3xl flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-blue-500/10 flex items-center justify-center text-blue-400">
            <Info size={24} />
          </div>
          <div>
            <h3 className="text-white font-bold tracking-tight">Kıyaslama Konusu: {currentSubject?.representativeTopic || ''}</h3>
            <p className="text-slate-500 text-sm">Tüm kanallar bu konu üzerinden örneklendirilmiştir.</p>
          </div>
        </div>
        <div className="px-4 py-2 bg-blue-500/10 text-blue-400 rounded-full text-xs font-black uppercase tracking-widest">
          {currentSubject?.recommendations?.length || 0} Öneri
        </div>
      </div>

      {/* Videos Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 xl:grid-cols-2 gap-8">
        <AnimatePresence mode="wait">
          {(currentSubject?.recommendations || []).map((rec, index) => (
            <motion.div
              key={rec.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.4, delay: index * 0.1 }}
              className="group bg-slate-900/40 border border-white/5 rounded-[32px] overflow-hidden hover:border-white/10 transition-all shadow-xl flex flex-col"
            >
              {/* YouTube Embed */}
              <div className="relative aspect-video w-full">
                <iframe
                  src={`https://www.youtube.com/embed/${rec.videoId}`}
                  title={rec.videoTitle}
                  className="absolute inset-0 w-full h-full border-0"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                ></iframe>
              </div>
              
              <div className="p-8 flex flex-col flex-1">
                <div className="flex items-start justify-between gap-4 mb-4">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="text-red-500"><Youtube size={18} /></span>
                      <h4 className="text-xl font-bold text-white tracking-tight leading-tight uppercase">{rec.channelName}</h4>
                    </div>
                    <p className="text-slate-400 font-medium text-sm">Eğitmen: {rec.teacherName}</p>
                  </div>
                  <a 
                    href={rec.channelUrl} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="p-3 bg-white/5 hover:bg-white/10 rounded-2xl text-slate-300 transition-all hover:scale-110 active:scale-95 shadow-lg"
                  >
                    <ExternalLink size={20} />
                  </a>
                </div>

                <div className="flex flex-wrap gap-2 mb-6">
                  {rec.tags.map(tag => (
                    <span 
                      key={tag} 
                      className="px-3 py-1 bg-blue-500/10 text-blue-400 text-[10px] font-black uppercase tracking-widest rounded-lg border border-blue-500/20"
                    >
                      {tag}
                    </span>
                  ))}
                </div>

                <div className="mb-6 p-5 bg-blue-600/5 rounded-2xl border border-blue-500/10 relative group-hover:bg-blue-600/10 transition-colors">
                  <div className="flex items-center gap-2 mb-2 text-blue-400">
                    <Sparkles size={14} />
                    <span className="text-[10px] font-black uppercase tracking-widest">Yapay Zeka Analizi</span>
                  </div>
                  <p className="text-slate-400 text-xs leading-relaxed italic">
                    "{rec.aiAnalysis}"
                  </p>
                </div>

                <div className="mt-auto">
                  <a 
                    href={rec.channelUrl} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="w-full py-4 bg-slate-800 hover:bg-slate-700 text-white rounded-2xl font-bold flex items-center justify-center gap-2 transition-all group-hover:bg-red-600/10 group-hover:text-red-500 border border-white/5 group-hover:border-red-500/20"
                  >
                    Kanala Abone Ol
                    <ChevronRight size={18} />
                  </a>
                </div>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {/* Footer Info */}
      <div className="bg-slate-900 border border-white/5 p-8 rounded-[32px] text-center">
        <div className="w-16 h-16 rounded-3xl bg-blue-600/10 border border-blue-500/20 flex items-center justify-center text-blue-500 mx-auto mb-4">
          <BookOpen size={30} />
        </div>
        <h3 className="text-xl font-bold text-white mb-2 tracking-tight">Kendi Ders Programını Oluştur</h3>
        <p className="text-slate-400 max-w-xl mx-auto text-sm leading-relaxed">
          Beğendiğin hocaları belirledikten sonra, haftalık programında bu hocaların videolarını takip ederek düzenli bir çalışma disiplini kurabilirsin. Unutma, en iyi hoca senin en iyi anladığın hocadır.
        </p>
      </div>
    </div>
  );
}
