import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'motion/react';
import { Brain, Sparkles, ChevronLeft, Calendar, User, Activity, Target, ShieldCheck, Heart, GraduationCap, Loader2, Sparkle, Zap, BarChart3, Scale, Search, PenTool, Gavel, Clock, AlertCircle, ShieldAlert, BookOpen, Fingerprint, CheckCircle2, Info, Users, Monitor, Palette, Bug, ShieldAlert as ShieldIcon, IterationCcw, Layout, Trophy, Smartphone, Timer, Candy, Eye, Compass, Snowflake, Puzzle, Grid, UserCheck, Flame, Dumbbell } from 'lucide-react';
import { analysisService } from '../../services/analysisService';
import Markdown from 'react-markdown';

export default function AnalysisDetail() {
  const { resultId } = useParams();
  const navigate = useNavigate();
  const [result, setResult] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [aiInsight, setAiInsight] = useState('');
  const [generatingAi, setGeneratingAi] = useState(false);

  useEffect(() => {
    if (resultId) {
      loadResult();
    }
  }, [resultId]);

  const loadResult = async () => {
    try {
      const data = await analysisService.getResultById(resultId!) as any;
      
      if (data) {
        setResult(data);
        // Ensure data.data exists before triggering AI
        if (data.data) {
          if (data.aiInsight) {
            setAiInsight(data.aiInsight);
          } else {
            generateAiInsight(data);
          }
        }
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const generateAiInsight = async (data: any) => {
    setGeneratingAi(true);
    try {
      let specificInstructions = '';
      
      if (data.analysisType === 'AG-MOT') {
        specificInstructions = `
        - Bu bir "Akademik Gelecek ve Motivasyon Blokajları" analizidir.
        - Verilerdeki risk skoruna göre (Kritik: 70+, Orta: 46-69, Normal: <46) yorum yap.
        - "Ya Hep Ya Hiç", "Felaketleştirme", "Zihin Okuma" gibi bilişsel çarpıtmalar üzerinde dur.
        - "Sokratik Sorgulama" tarzında yapıcı sorular sor.`;
      } else if (data.analysisType === 'HIRAT') {
        specificInstructions = `
        - Bu bir "Hedef İzleme ve Risk Analizi" (HİRAT) raporudur.
        - HPP (Haftalık Performans Puanı) üzerinden "Trafik Işığı Modeli"ne (Yeşil, Sarı, Kırmızı, Mavi) atıfta bulun.
        - Gerçekleşme oranları düşükse "Backlog / Borçlanma" ve "Kök Neden" analizi yap.
        - Eğer HPP çok yüksekse (%110+) "Tükenmişlik (Burnout)" uyarısı yap.`;
      } else if (data.analysisType === 'AID-Y') {
        specificInstructions = `
        - Bu bir "Akademik İnanç Dönüştürme" (AİD-Y) atölye çalışmasıdır.
        - Eski ve yeni inanç arasındaki farka, derecelendirme değişimine odaklan.
        - Carol Dweck'in "Gelişim Zihniyeti" perspektifiyle, zihinsel mahkemede çürütülen kanıtları yorumla.
        - Öğrencinin "Henüz (Yet)" gücünü nasıl kullanabileceğine dair cesaretlendirici bir dil kullan.`;
      } else if (data.analysisType === 'ADTE-20') {
        specificInstructions = `
        - Bu bir "Akademik Odak ve Dikkat Yönetimi" (ADTE-20) taramasıdır.
        - Bölüm A (Dikkat) ve Bölüm B (Hiperaktivite/Dürtüsellik) skorlarına odaklan.
        - Skorlar 20+ ise mutlaka profesyonel bir uzmana (Psikiyatrist) yönlendirme yap (nazikçe).
        - 11-19 arası ise "Odaklanma Tasarımı" (Pomodoro, çevresel düzenleme) önerileri sun.
        - Bu bir ön tarama aracıdır, kesin tanı değildir vurgusunu yap.`;
      } else if (data.analysisType === 'APEA-3D') {
        specificInstructions = `
        - Bu bir "Akademik Performans Engel Analizi" (APEA-3D) raporudur.
        - Bilişsel, Duygusal ve Davranışsal boyutlardaki skorlara (Maks 50) odaklan.
        - 35+ skorlar baskın sorun alanlarıdır. 
        - Analiz verilerine göre bir "Reçete" (Müdahale Stratejisi) sun.
        - Bilişsel yüksekse: Özel ders, yöntem eğitimi.
        - Duygusal yüksekse: Kaygı yönetimi, nefes egzersizi.
        - Davranışsal yüksekse: Dijital detoks, zaman yönetimi.`;
      } else if (data.analysisType === 'APK-S') {
        specificInstructions = `
        - Bu bir "Akademik Performans Kaygısı ve Sınav Stresi Envanteri" (APK-S) raporudur.
        - Bilişsel, Fiziksel ve Davranışsal belirtiler skorlarına odaklan. (Maks 40 üzerinden)
        - Öğrencinin "dürtücü güç" (optimum düzey) veya "ketleyici güç" (blokaj) evresinde olup olmadığını değerlendir (Yerkes-Dodson Yasası).
        - Toplam puana (120 üzerinden) göre risk düzeyini belirt (Düşük: <49, Yönetilebilir: 49-72, Yüksek: 73-96, Panik: 97+).
        - Özellikle yüksek fiziksel belirtiler varsa profesyonel destek vurgusu yap, somut rahatlama önerileri (nefes egzersizi vb.) ver.`;
      } else if (data.analysisType === 'AB-CTE') {
        specificInstructions = `
        - Bu bir "Akademik ve Bilişsel Algı Cümle Tamamlama Envanteri" (AB-CTE) raporudur.
        - Öğrencinin verdiği cevapları İçerik Analizi (Pozitif, Negatif, Çatışmalı) yaparak kategoriye ayır.
        - Eğer aşırı Negatif/Çatışmalı cevaplar varsa "Gizli Mükemmeliyetçi", "Pasif Direnişçi" veya "Öğrenilmiş Çaresizlik" profili açısından değerlendir.
        - Cevaplara göre Sokratik sorgulama ile öğrencinin yanlış inançlarını sorgulayıcı yapıcı sorular sor.
        - "Cevaplarınızı incelediğimde..." diyerek bazı cevaplardan doğrudan alıntılar yap (örn: "Hata yaptığım zaman..." cevabın üzerine).`;
      } else if (data.analysisType === 'AS-EQ') {
        specificInstructions = `
        - Bu bir "Akademik ve Sosyal Duygusal Zekâ Envanteri" (AS-EQ) raporudur.
        - Öğrencinin duygularını tanıma, yönetme, başkalarını anlama ve sosyal becerileri kapasitesini değerlendir.
        - 125 puan üzerinden (skor verilerinde "total" içinde bulunur) değerlendirme yap.
        - Toplam skor 100-125 çok iyi, 75-99 geliştirilmeli, <75 riskli.
        - Düşük olan alt boyutlara yönelik "Trafik Işığı Tekniği", "Başarı Günlüğü" veya "Onun Ayakkabıları" gibi somut müdahaleler öner.`;
      } else if (data.analysisType === 'AYCE') {
        specificInstructions = `
        - Bu bir "Akademik Yetkinlik ve Çalışma Stratejileri Envanteri" (AYÇE) raporudur.
        - Öğrencinin ders çalışma sürecindeki "verimsizlik kaçaklarını" tespit et. (Planlama, Tekrar, Not Alma, Süre Yönetimi)
        - 100 puan üzerinden (skor verilerinde "total" içinde bulunur) değerlendirme yap.
        - Toplam 0-50 (Amatör), 51-75 (Gelişmekte), 76-100 (Profesyonel) olarak profilledirmeler yap.
        - Zayıf alanlarına göre somut teknikler öner: Planlama için (Ye-Kurbağayı), Tekrar için (1-7-30 Kuralı), Not almak için (Cornell Metodu), Süre için (Pomodoro Tekniği - 25+5).`;
      } else if (data.analysisType === 'AT-CM') {
        specificInstructions = `
        - Bu bir "Akıllı Tuş: Duygu Kontrol ve Çıpalama Modülü" (AT-ÇM) raporudur.
        - Öğrencinin seçtiği "Tuş" (hareket) ve "Duygu" arasındaki nörolojik bağı değerlendir.
        - Pavlov'un Klasik Koşullanma prensiplerine göre bu çapanın nasıl güçlendirileceğine (Stacking Anchors) dair tavsiyeler ver.
        - Çapanın "şarj edilmesi" (haftalık tekrar) ve "bozulmaması" (negatif anlarda kullanmama) için uyarılar yap.
        - Öğrencinin test sonucundaki hissiyatına göre (testResult) çapanın oturup oturmadığını yorumla.`;
      } else if (data.analysisType === 'ADDE-20') {
        specificInstructions = `
        - Bu bir "Algılanan Aile Akademik ve Duygusal Destek Ölçeği" (ADDE-20) raporudur.
        - 100 puan üzerinden (total) genel değerlendirme yap (80+ mükemmel, 60-79 iyi, <60 geliştirilmeli).
        - "Duygusal Destek" (emotional) ve "Akademik Destek" (academic) puanlarını ayrı ayrı yorumla (Her biri 50 üzerinden).
        - Elde edilen Profile göre (İdeal, Proje Çocuk, Sevgi Dolu Ama Yetersiz, İhmalkar) spesifik analiz yap.
        - "Tampon Hipotezi" ve "Baumrind Ebeveynlik Stilleri"ne atıfta bulunarak bilimsel bir derinlik kazandır.
        - Aile içi iletişimi güçlendirmek için hem öğrenciye hem de ailesine (raporun sonunda veliye not kısmında) somut ödevler ver.`;
      } else if (data.analysisType === 'B-AVO') {
        specificInstructions = `
        - Bu bir "Bilişsel Anti-Virüs Operasyonu" (B-AVO) raporudur.
        - Öğrencinin tespit ettiği bilişsel çarpıtmaları (selectedDistortions) ve bu çarpıtmaları nasıl "Anti-Virüs" (thoughtRecords) ile değiştirdiğini analiz et.
        - Aaron Beck'in Bilişsel Modeli ve David Burns'ün çarpıtmalarına bilimsel atıflar yap.
        - Kaygı düzeyindeki (scores.preAnxiety -> scores.postAnxiety) değişimi yorumla.
        - Öğrenciye, zihnindeki bu "virüsleri" günlük hayatta (sınav anı, çalışma masası) yakalaması için "Sistem Tarayıcısı" gibi düşünmesini sağlayacak somut koçluk ödevleri ver.`;
      } else if (data.analysisType === 'ADT-Ö') {
        specificInstructions = `
        - Bu bir "Branş Bazlı Akademik Tutum ve Önyargı Analizi" (ADT-Ö) raporudur.
        - Öğrencinin branşlara verdiği puanları (ratings) ve bu puanların ABC Tutum Modeli (Bilişsel, Duyuşsal, Davranışsal) üzerindeki etkisini yorumla.
        - Tespit edilen Teşhisleri (diagnosis: TEMEL EKSİKLİĞİ, ÖĞRETMEN/ÖNYARGI, KAÇINMA/KORKU) baz alarak her biri için spesifik akademik reçeteler sun.
        - Düşük puanlı dersler için öğrencinin yazdığı nedenleri (ratings.reason) dikkate alarak "AMİD" veya "B-AVO" gibi diğer modüllere yönlendirme yapabilirsin.
        - Öğrencile samimi bir tonda konuş; derslere karşı olan direncinin "zekâ" ile değil "tutum" ile ilgili olduğunu vurgulayarak motivasyonunu artır.`;
      } else if (data.analysisType === 'ÇDÖ-E') {
        specificInstructions = `
        - Bu bir "Çalışma Davranışı ve Öz-Disiplin Envanteri" (ÇDÖ-E) raporudur.
        - Öğrencinin Planlama (scores.planning), Süreklilik (scores.continuity) ve Disiplin (scores.discipline) puanlarını analiz et.
        - Zimmerman'ın Öz-Düzenlemeli Öğrenme Modeli ve Angela Duckworth'ün GRIT (Azim) Teorisi'ne bilimsel atıflar yap.
        - Öğrenciye atanan Profili (TURİST ÖĞRENCİ, SAMAN ALEVİ, PROFESYONEL ÖĞRENCİ) yorumla.
        - Düşük puanlı boyutlara yönelik somut koçluk teknikleri (Planlama için Haftalık Blok, Süreklilik için Zinciri Kırma, Disiplin için Dijital Detoks) öner.
        - Öğrenciye, disiplinin bir "zekâ" türü değil, "kas" gibi geliştirilebilir bir alışkanlık olduğunu hissettir.`;
      } else if (data.analysisType === 'Ç-MOD') {
        specificInstructions = `
        - Bu bir "Çikolata Modeli: Haz Erteleme ve Ödül Yönetimi" (Ç-MOD) raporudur.
        - Öğrencinin Haz Yönetimi (gratification), Erteleme (delay) ve Otokontrol (selfControl) skorlarını analiz et.
        - Walter Mischel'in Marshmallow Deneyi ve Premack İlkesi (Büyükanne Kuralı) prensiplerine atıfta bulun.
        - Atanan Profili (SÜREKLİ İFLAS EDEN, DENGE ARAYAN TÜCCAR, DENGELİ YATIRIMCI) yorumla.
        - "Önce hak et, sonra tüket" felsefesiyle, öğrencinin hayatındaki hazların (telefon, oyun vb.) bedelini (Çikolata Puan - ÇP) nasıl belirleyebileceğine dair somut bir "Ekonomi Planı" öner.
        - "Dopaminerjik Sistem"in nasıl çalıştığını ve anlık dopamin yerine "uzun vadeli tatmin"in önemini açıkla.`;
      } else if (data.analysisType === 'AMID') {
        specificInstructions = `
        - Bu bir "Alt Modalite İnanç Değişim Protokolü" (AMİD) raporudur.
        - Öğrencinin değiştirmek istediği eski inancı (oldBelief) ve yeni inancı (newBelief) kıyasla.
        - İnanç-Metre skorlarındaki (preScore, postScore) düşüşü (değişim farkını) yorumla. Eğer fark büyükse (Örn: 9'dan 2'ye) değişimin başarılı olduğunu onayla.
        - Alt modalite (Submodalities) tekniklerine (parlaklık, renk, hareket) dayalı olarak bu değişimin beynin hangi mekanizmalarıyla gerçekleştiğini açıkla.
        - Öğrenciye bu yeni inancı "sıcak tutması" için günlük kısa hatırlatmalar öner.`;
      } else if (data.analysisType === 'ÇZ-8') {
        specificInstructions = `
        - Bu bir "ÇZ-8: Çoklu Zekâ Alanları Değerlendirme Envanteri" raporudur.
        - Howard Gardner'ın Çoklu Zekâ Teorisini temel alır. Zeka tiplerinin (Sözel, Sayısal, Görsel, Bedensel, Müziksel, Sosyal, İçsel, Doğacı) skorlarına odaklan.
        - Öğrencinin en yüksek skorlu (baskın) olan 2-3 zeka alanını öne çıkar ve bu alanlarda nasıl daha etkili öğrenebileceğini açıkla.
        - En düşük skorlu alanları yargılamadan, bu alanların nasıl geliştirilebileceği veya farklı zeka alanlarıyla nasıl desteklenebileceği konusunda öneriler ver.
        - Kendi öğrenme stiline uygun ders çalışma teknikleri ve kariyer/alan yönelim tavsiyeleri sun.`;
      } else if (data.analysisType === 'DART') {
        specificInstructions = `
        - Bu bir "DART Hedef Yönetimi ve Eylem Planı" raporudur.
        - Öğrencinin Makro, Mezo, Aylık, Haftalık ve Mikro hedeflerini incele. Hedeflerin arasındaki uyumu değerlendir.
        - WOOP tekniği ile belirlediği en büyük engeli ve oluşturduğu B Planını analiz et.
        - DART (Durumu Analiz et - Amacı Netleştir - Rotayı Böl - Takip Et) metodolojisi ve Bilişsel Yük Kuramı çerçevesinde öğrenciye takip edilebilir 3 eylem adımı sun.`;
      } else if (data.analysisType === 'DOPA') {
        specificInstructions = `
        - Bu bir "DOPA: Dikkat ve Odaklanma Performans Analizi" raporudur.
        - Öğrencinin 'Omission' (Atlanan/Dikkat Kopuşu) ve 'Commission' (Yanlış İşaretlenen/Dürtüsellik) hata türlerini analiz et.
        - Öz-bildirim anketine verdiği yanıtlara dayanarak, öğrencinin sınav anındaki algısal dikkat durumunu değerlendir (yorulma, dalıp gitme).
        - Test sonuçlarına göre onu "Tavşan (Hızlı/Hatalı)", "Kaplumbağa (Yavaş/Hatasız)" veya "Uykucu (Çabuk Yorulan)" profillerinden birine yerleştir.
        - Dikkat kondisyonunu artıracak odaklanma egzersizleri (metronomla okuma, tersine işlem vb.) sun.`;
      } else if (data.analysisType === 'GTS-36') {
        specificInstructions = `
        - Bu bir "GTS-36: Gelecek Tasarım ve Tercih Simülasyonu" raporudur.
        - Öğrencinin seçtiği hedef mesleğe uygunluğunu analiz et.
        - Uçuş, Gerçekçi ve Güvenlik hatlarındaki tercihlerini risk analizine tabi tut.
        - Aile onayı ve şehir dışı faktörlerini (veto risklerini) göz önünde bulundurarak profesyonel tercih tavsiyeleri ver.`;
      } else if (data.analysisType === 'IM-OM') {
        specificInstructions = `
        - Bu bir "İM-OM: İçsel Motor ve Oto-Motivasyon Modülü" raporudur.
        - Öğrencinin anketteki yanıtlarına ve 'toplam erteleme skoruna' göre teşhis koy (Mükemmeliyetçi, Hazcı, Hayalperest vb.).
        - Öğrenciye motivasyonun bir his değil, bir eylem olduğunu hatırlat.
        - Durumuna en uygun 1 veya 2 spesifik eylem stratejisi sun (5 Saniye Kuralı, Salami Dilimleme, vb.). Hedef harekete geçirmektir.`;
      } else if (data.analysisType === 'K-E-A') {
        specificInstructions = `
        - Bu bir "K-E-A: Kartopu Etkisi ve Alışkanlık Modülü" raporudur. 
        - Öğrencinin belirlediği mikro görevleri incele. Aşırı küçük olmalarını öv ve neden işe yaradığını (Atalet/Eylemsizlik yasası) basitçe açıkla.
        - 21 Günlük zincire vurgu yaparak ilk kıvılcımın sürtünmeyi aşmak olduğunu belirt.`;
      } else if (data.analysisType === 'KOLB-DÖSE') {
        specificInstructions = `
        - Bu bir "KOLB-DÖSE: Deneyimsel Öğrenme Stilleri" raporudur.
        - Öğrencinin test puanlarına göre ortaya çıkan tipini (Örn: Ayrıştıran, Özümseyen, Yerleştiren, Değiştiren) incele.
        - Dünyayı nasıl algıladığını (Somut vs Soyut) ve bilgiyi nasıl işlediğini (Aktif vs Yansıtıcı) samimi bir dille, öğrencinin gözünden açıkla.
        - Güçlü yönlerini ve ders çalışırkenki zayıf noktalarını dürüstçe belirt.
        - Sınava hazırlık veya genel akademik süreç için 3 doğrudan uygulanabilir koçluk tavsiyesi (Örn: test çözme vs teori okuma dengesi) ver.`;
      } else if (data.analysisType === 'MERCEK') {
        specificInstructions = `
        - Bu bir "MERCEK: Çok Boyutlu Problem Çözme ve Bakış Açısı" raporudur.
        - Öğrencinin "Kontrol Edemediği" kısımları nasıl bıraktığını, 10 yıl sonradan kendine verdiği tavsiyeyi ve empati merceğindeki (Ters Açı) değişimini incele.
        - Duygu Değişim Skoruna (Pre-Post) vurgu yap ve öğrencinin bakış açısı esnekliğini öv.
        - Bir Stoacı (farkındalık) ve NLP uzmanı gibi ona bir sonraki kriz anında hangi merceği kullanması gerektiğini öner.`;
      } else if (data.analysisType === 'MÇ-ZP') {
        specificInstructions = `
        - Bu bir "Mükemmellik Çemberi: Özgüven ve Zirve Performans" raporudur.
        - Öğrencinin seçtiği kaynağa (${data.form?.neededEmotion?.label}) ve anısına vurgu yap.
        - Çapalama (Anchoring) tekniğinin sınav anında nasıl "kısayol" olacağını nörolojik bir dille (ama samimi) anlat.
        - Bedensel çapayı (${data.form?.physicalAnchor}) ne zaman ve nasıl "ateşlemesi" gerektiğine dair 3 pratik taktik ver.`;
      } else if (data.analysisType === 'VAK-S') {
        specificInstructions = `
        - Bu bir "VAK-S: Öğrenme Stilleri" analizidir.
        - Görsel, İşitsel ve Kinestetik puanlarına (Maks: 10) odaklan.
        - En yüksek puanlı stilini (veya yakın olanları) yorumla.
        - Görselse: Renkli kalemler, zihin haritaları.
        - İşitselse: Sesli anlatım, tartışma grupları.
        - Kinestetikse: Hareket ederek çalışma, uygulama.`;
      } else if (data.analysisType === 'SP-BE') {
        specificInstructions = `
        - Bu bir "SP-BE: Stres Profili" analizidir.
        - Öğrencinin stres anındaki tepkisini (Volkan: Agresif, Buzdağı: İçine kapanık, Halterci: Aşırı yüklenen) yorumla.
        - Stres puanına göre (8+ Kritik) uyarılar yap.
        - Strese karşı "Panzehir" stratejileri (Nefes, Gözlemci kalma, Hareket) öner.`;
      } else if (data.analysisType === 'SI-GOZ') {
        specificInstructions = `
        - Bu bir "Sİ-GÖZ: Sihirli Gözlükler" analizidir.
        - Öğrencinin "Sorun" olarak gördüğü bir durumu nasıl "Fırsat"a (Gümüş Çerçeve) çevirdiğini yorumla.
        - Bakış açısı esnekliğini (Cognitive Reframing) öv.
        - Bir dahaki kriz anında bu gözlüğü nasıl takacağına dair somut bir "Sistem Hatırlatıcısı" ver.`;
      } else if (data.analysisType === 'SS-DKM') {
        specificInstructions = `
        - Bu bir "SS-DKM: Sınav Sonrası Analiz & Karar Matrisi"dir.
        - Duygusal durum (Yas, Öfke, Kabulleniş) ve Akademik durum sentezini yap.
        - Karar Matrisi sonucuna (Vazgeçme, Aynı Devam, Strateji Değiştir) göre yol haritası sun.
        - Kaybedilen bir sınavın bir "Son" değil, bir "Veri" olduğunu vurgula.`;
      } else if (data.analysisType === 'SZP-30') {
        specificInstructions = `
        - Bu bir "SZP-30: Son 30 Gün Zirve Performans" planıdır.
        - Mevcut deneme netlerini ve hedef netlerini kıyasla.
        - 30 günlük "Acil Eylem Planı"ndaki stratejileri (Soru Analizi, Deneme Sıklığı, Uyku) yorumla.
        - Son virajdaki psikolojik dayanıklılık (Resilience) üzerinde dur.`;
      } else if (data.analysisType === 'SOC-A') {
        specificInstructions = `
        - Bu bir "SOÇ-A: Soru Okuma ve Çözme Analizi"dir.
        - Soru okurken yapılan teknik hataları (Altını çizme, Hızlı okuma, Önyargı vb.) incele.
        - "Soru Kökünü Yanlış Anlama" veya "Seçeneklere Takılma" gibi kronikleşen hataları düzeltmek için taktikler ver.
        - Odaklanma ve Görsel Okuma teknikleri öner.`;
      } else if (data.analysisType === 'SW-D') {
        specificInstructions = `
        - Bu bir "SW-D: SWISH İmaj Dönüştürme" protokolüdür.
        - Olumsuz görüntünün (Panik, başarısızlık) nasıl olumlu bir görüntüyle saniyeler içinde değiştirildiğini yorumla.
        - Beynin "Nöro-Plastisite" özelliğini nasıl kullandığına dair bilgi ver.
        - Bu zihinsel antrenmanın (Flash Effect) sınav anında nasıl kullanılacağını açıkla.`;
      } else if (data.analysisType === 'TOTE') {
        specificInstructions = `
        - Bu bir "TOTE: Hedef ve Davranış Döngüsü" analizidir.
        - Test (Hedef) -> Operation (Eylem) -> Test (Kontrol) -> Exit (Sonuç) döngüsünü yorumla.
        - "Loop"ta takılı kalan yerleri (Hatalı stratejiler) tespit et.
        - Hedefe ulaşana kadar esnek kalmak üzerine tavsiyeler ver.`;
      } else if (data.analysisType === 'VGF-E') {
        specificInstructions = `
        - Bu bir "VGF-E: Veli Gözlem ve Farkındalık Envanteri"dir.
        - Veli gözlemi ile öğrenci gerçeği arasındaki köprüyü kur.
        - Ailenin "Beklenti"leri ile öğrencinin "Kapasite/Eylem" dengesini yorumla.
        - Aile içi sağlıklı iletişim ve "Tampon Hipotezi"ne atıfta bulun.`;
      } else if (data.analysisType === 'WD-3D') {
        specificInstructions = `
        - Bu bir "WD-3D: Walt Disney Planlama" analizidir.
        - Hayalperest (Ne istiyor?), Gerçekçi (Nasıl yapacak?), Eleştirmen (Riskler ne?) rollerini sentezle.
        - Planın "Sızdırmazlık" testinden geçip geçmediğini yorumla.
        - Disney'in bu dehasını kendi sınav sistemine nasıl entegre edebileceğini açıkla.`;
      } else if (data.analysisType === 'T-LINE') {
        specificInstructions = `
        - Bu bir "T-LINE: Zaman Çizgisi Motivasyonu" analizidir.
        - Geçmişteki başarı anısının bugünkü "Kaynak" duygusunu nasıl beslediğini yorumla.
        - Gelecekteki hedefin zihindeki netliğini ve çekiciliğini analiz et.
        - "Geleceği Bugüne Getirmek" için vizyonlama ödevleri ver.`;
      } else if (data.analysisType === 'ZS-ODO') {
        specificInstructions = `
        - Bu bir "ZS-ODÖ: Zihinsel Sabotaj Analizi"dir.
        - Öğrenciyi durduran "Zihinsel Gardiyanları/Sabotajcıları" tespit et.
        - Öz-Şefkat ve Akılcı İkna teknikleriyle bu sabotajcıları nasıl susturabileceğini açıkla.
        - "Kurban Psikolojisi" yerine "Sorumlu Aktör" bilincini aşıla.`;
      } else if (data.analysisType === 'ZG-ZP') {
        specificInstructions = `
        - Bu bir "ZG-ZP: Zor Gün Zafer Planı"dır.
        - Sınav günü olası aksiliklere (Gürültü, heyecan, zor soru vb.) karşı geliştirilen "B Planları"nı yorumla.
        - Önleyici stres yönetimi stratejilerini öv.
        - Mental provanın (Visualization) önemini vurgula.`;
      } else if (data.analysisType === 'PDAR-360') {
        specificInstructions = `
        - Bu bir "PDAR-360: Panoramik Deneme Analizi"dir.
        - Denemedeki doğru/yanlış analizini bir "Ar-Ge" çalışması gibi ele al.
        - Bilgi eksiği vs Teknik hata dengesine odaklan.
        - "Net Kaçaklarını" önlemek için branş bazlı mikro hedefler belirle.`;
      } else if (data.analysisType === 'KLS') {
        specificInstructions = `
        - Bu bir "KLS: Kariyer Seçim Laboratuvarı" analizidir.
        - Puan odaklı değil, yetenek ve değer odaklı bir kariyer haritası çiz.
        - Holland Mesleki Kişilik Tipleri (Gerçekçi, Araştırmacı, Sanatçı vb.) ile bağlantı kur.
        - Geleceğin dünyasında öğrencinin seçeceği mesleğin sürdürülebilirliğini yorumla.`;
      } else if (data.analysisType === 'ÖTI-A') {
        specificInstructions = `
        - Bu bir "ÖTI-A: Öğrenci Tanıma ve İlk Analiz" raporudur.
        - Öğrencinin akademik hedefini, SWOT analizindeki en belirgin Güçlü ve Tehdit yönlerini sentezle.
        - Çalışma Davranış Skoruna (${data.form?.behaviorScore || 'N/A'}/50) göre öğrencinin disiplin seviyesini yorumla.
        - Dijital ekran süresi (${data.form?.digital?.screenTime} saat) ve zaman hırsızlarına yönelik "Dijital Detoks" vurgusu yap.
        - Profesyonel bir stratejist gibi, hedefine ulaşması için "Kıvılcım Etkisi" yaratacak 2 somut ödev ver.`;
      }

      // Proxy client side Gemini call securely via node API
      const res = await fetch('/api/analysis-insight', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          analysisType: data.analysisType,
          data: data.data,
          specificInstructions
        })
      });

      if (!res.ok) {
        throw new Error(await res.text() || 'Yapay zeka analiz raporu alınamadı');
      }

      const resJson = await res.json();
      const text = resJson.text;
      
      setAiInsight(text);
      
      // Save for future use
      await analysisService.updateResult(data.id, { aiInsight: text });
    } catch (err) {
      setAiInsight("Şu anda yapay zeka analizi yapılamıyor. Lütfen daha sonra tekrar deneyiniz.");
    } finally {
      setGeneratingAi(false);
    }
  };

  const getParentFeedback = () => {
    if (!result) return null;
    
    if (result.analysisType === 'VAK-S') {
        return "Sayın Veli, Öğrencimizin öğrenme stilini analiz ettik. Çocuğunuzun bilgiyi en iyi nasıl kavradığını (Görsel, İşitsel veya Kinestetik) artık biliyoruz. Evdeki çalışma ortamını bu stile göre (örn: Görselse renkli notlar, işitselse anlatma) düzenlemeniz başarısını %40'a varan oranda artırabilir.";
    }

    if (result.analysisType === 'SP-BE') {
        return "Sayın Veli, Öğrencimiz stres altında 'Volkan' (Agresif/Patlamaya hazır) veya 'Buzdağı' (İçine kapanan) tepkileri verebiliyor. Bu anlarda onunla tartışmak yerine, ona güvenli bir alan tanımanız ve seçtiğimiz stres yönetimi tekniklerini desteklemeniz krizleri önleyecektir.";
    }

    if (result.analysisType === 'ZS-ODO') {
        return "Sayın Veli, Öğrencimizin başarısını engelleyen en büyük düşman 'kendisi' olabilir; yani zihnindeki sabotajcı düşünceler. Bu hafta ona 'başarı' baskısı kurmak yerine, küçük çabalarını takdir ederek bu 'iç sabotajcıları' susturmasına yardımcı olmanızı bekliyoruz.";
    }

    if (result.analysisType === 'WD-3D') {
        return "Sayın Veli, Bugün Walt Disney'in kullandığı planlama stratejisiyle bir hedef analizi yaptık. Öğrencimiz hayallerini gerçeklere dökmek için somut bir yol haritası çıkardı. Bu planı bozmadan, ona 'Gerçekçi' ve 'Eleştirmen' olduğu anlarda anlayışla yaklaşmanız değerlidir.";
    }

    if (result.analysisType === 'T-LINE') {
        return "Sayın Veli, Öğrencimizin motivasyonunu geçmişteki başarı köklerinden bugüne taşıdık. Gelecekteki hedefini zihninde 'şimdiki zaman' gibi hissetmesini sağladık. Bu vizyonun canlı kalması için onun gelecekle ilgili hayallerini destekleyen bir dil kullanmanızı rica ederiz.";
    }

    if (result.analysisType === 'VGF-E') {
        return "Sayın Veli, Sizin gözlemleriniz bizim için altın değerinde. Analiz sonuçlarına göre evdeki disiplin ve huzur dengesi öğrencinin sınav başarısının en büyük yakıtıdır. Sizin desteğinizle bu süreci bir 'stres' değil 'başarı' yolculuğuna çevireceğiz.";
    }

    if (result.analysisType === 'KLS') {
        return "Sayın Veli, Meslek seçimi bir hayat seçimidir. Öğrencimizin sadece puanına göre değil, yetenek ve değerlerine göre bir kariyer planı yapması için çalışıyoruz. Onu sevmediği bir bölüme zorlamak yerine, tutkuyla yapacağı alanı birlikte desteklememiz en doğrusu olacaktır.";
    }

    if (result.analysisType === 'AG-MOT') {
      const score = result.data.totalScore;
      if (score >= 70) {
        return "Sayın Veli, Öğrencimizle yaptığımız motivasyon analizinde; sınavı bir 'ölüm-kalım meselesi' haline getirdiği görülmüştür. Bu kadar yüksek beklenti ve korku, maalesef performansı artırmaz, aksine 'donup kalma' etkisi yaratır. Evde 'Kazanırsın aslanım' gibi baskılar yerine, koşulsuz sevgi ve güven mesajı vermeniz bu felaket senaryosunu yıkacaktır.";
      }
      return "Sayın Veli, Öğrencimizin motivasyon durumu dengeli görünmektedir. Akademik hedeflerine yönelik sağlıklı bir kaygı düzeyine sahiptir.";
    }
    
    if (result.analysisType === 'HIRAT') {
      const hpp = result.data.hpp;
      if (hpp < 70) {
        return `Sayın Veli, Bu haftaki raporu incelediğimizde öğrencilerimizin hedeflerinde sapma olduğunu (%${Math.round(hpp)} başarı) görüyoruz. Bu durum konu yığılmasına neden olabilir. Bu hafta odaklanmamız gereken nokta 'Neden çalışılmadı?' değil, 'Önümüzdeki engelleri nasıl kaldırırız?' olmalıdır.`;
      }
      return `Sayın Veli, Öğrencimiz bu haftayı %${Math.round(hpp)} başarı ile tamamlamıştır. Planlı ilerlemesi sistemli bir başarıyı getirecektir.`;
    }
    
    if (result.analysisType === 'AID-Y') {
        return "Sayın Veli, Bugün öğrencimizle 'Zihinsel Temizlik' çalışması yaptık. Fark ettik ki; öğrencimiz başarısızlığı bir 'sonuç' olarak değil, bir 'kimlik' olarak görüyor. Sizden ricamız; evde sonuçları değil, süreci övmenizdir. 'Zekisin' demek yerine 'Çok güzel çabaladın' deyin. Bu, onun hata yapma korkusunu yenmesini sağlayacaktır.";
    }

    if (result.analysisType === 'ADTE-20') {
        const scoreA = result.data.scores.partA;
        const scoreB = result.data.scores.partB;
        if (scoreA >= 20 || scoreB >= 20) {
            return "Sayın Veli, Öğrencimizle yaptığımız akademik takipte; sürdürülebilir dikkat konusunda belirgin zorluklar gözlemledik. Yaptığımız ADTE-20 ön taramasında skorlar riskli düzeyde çıkmıştır. Bu bir zeka sorunu değil, biyolojik bir süreç olabilir. Bir çocuk ve ergen psikiyatristinden görüş almanız, çocuğumuzun potansiyelini tam kullanması için çok faydalı olacaktır.";
        }
        return "Sayın Veli, Öğrencimizin odaklanma profili normal sınırlar içerisindedir. Zaman yönetimi teknikleriyle verimliliğini artırmaya devam ediyoruz.";
    }

    if (result.analysisType === 'APEA-3D') {
        const { cognitive, emotional, behavioral } = result.data.scores;
        let dominant = 'Bilişsel';
        if (emotional > cognitive && emotional > behavioral) dominant = 'Duygusal';
        if (behavioral > cognitive && behavioral > emotional) dominant = 'Davranışsal';

        const descriptions: Record<string, string> = {
            'Bilişsel': 'Sorun "İstememek" değil "Yapamamak". Çalışsa da verim alamıyor, temel eksikleri var.',
            'Duygusal': 'Sorun "Bilmemek" değil "İnanamamak". Performans anksiyetesi bilgiyi kilitliyor.',
            'Davranışsal': 'Sorun "Kapasite" değil "Disiplin". Potansiyeli var ama eyleme geçemiyor.'
        };

        return `Sayın Veli, Öğrencimizle yaptığımız 'Performans Engel Analizi' sonucunda gördük ki; başarısızlığın temel nedeni zekâsı veya yeteneği değil, ${dominant.toLowerCase()} faktörlerdir. ${descriptions[dominant]} Bu süreçte ona sadece 'Ders çalış' demek yerine, koçluğumuzun önerdiği stratejik destekleri sağlamanız akademik başarıyı hızlandıracaktır.`;
    }

    if (result.analysisType === 'APK-S') {
        const physical = result.data.scores.physical;
        if (physical >= 30) {
            return "Sayın Veli, Öğrencimizle yaptığımız 'Sınav Kaygısı Analizi'nde; öğrencimizin zihinsel olarak sınava hazır olduğu ancak bedensel olarak yüksek stres tepkileri (kalp çarpıntısı, mide ağrısı vb.) verdiği görülmüştür (Fiziksel Boyut: Yüksek). Bu durum çocuğunuzun 'çok istediğini' ancak 'başaramama korkusunun' vücudunu kilitlediğini gösterir. Evde 'Sakin ol, heyecan yapma' demek işe yaramaz. Onun fiziksel olarak rahatlamasını sağlayacak aktiviteler ve 'Sonuç ne olursa olsun değerlisin' mesajı, en iyi ilaçtır.";
        }
        return "Sayın Veli, Öğrencimizin sınav kaygısı yönetilebilir seviyelerdedir. Sınav stresi şimdilik onun performansını olumlu etkileyecek güdüleyici bir güç olarak duruyor.";
    }

    if (result.analysisType === 'AB-CTE') {
        return "Sayın Veli, Öğrencimizle yaptığımız 'İçgörü Çalışması'nda; bilinçaltındaki akademik algısını, başarı ve gelecekle ilgili hislerini inceledik. Bu hafta sizden ricamız; evdeki konuşmaların odağını 'Sonuç/Net' üzerinden değil, 'Çaba/Süreç' üzerinden kurmanızdır. Hata yapmanın öğrenmenin bir parçası olduğunu ona hissettirmemiz gerekiyor.";
    }

    if (result.analysisType === 'AS-EQ') {
        const score = result.data.scores.total;
        if (score < 75) {
            return "Sayın Veli, Öğrencimizle yaptığımız 'Duygusal Zekâ (EQ)' analizinde; stres yönetimi (Öz-Yönetim) konusunda zorlandığını tespit ettik. EQ, bir kas gibidir ve geliştirilebilir. Çocuğumuz şu an duygularını 'yönetmek' yerine, duyguları tarafından 'yönetiliyor' (Öfkelenince dersi bırakıyor). Bu hafta evde ona 'Ders çalış' demek yerine; 'Şu an ne hissediyorsun? Bu duygu sana ne anlatıyor?' diye sorarak duygusal kaslarını güçlendireceğiz. Başarı, sadece zekanın değil, duyguların da yönetimidir.";
        }
        return "Sayın Veli, Öğrencimiz 'Duygusal Zekâ (EQ)' analizinde oldukça başarılı bir profil çizmiştir. Öz-yönetim ve motivasyon becerilerinin gücü, akademik sürecine çok olumlu yansıyacaktır. Evde destekleyici ve olumlu iletişim sürecini devam ettirmenizi rica ederiz.";
    }

    if (result.analysisType === 'AYCE') {
        return "Sayın Veli, Öğrencimizle yaptığımız 'Çalışma Stratejileri Analizi' sonucunda; öğrencimizin masa başında geçirdiği sürenin verimli olmadığı, çünkü planlama ve tekrarlama yöntemlerinde eksikleri olduğu görülmüştür. Çok çalışmak ile akıllı çalışmak farklıdır. Biz bu hafta itibariyle 'saat odaklı' değil 'verim odaklı' sisteme geçiyoruz. Odasından gelen sesler (kendi kendine anlatma) veya masasında gördüğünüz renkli kağıtlar (hatırlatıcılar) oyun değil, yeni çalışma sistemimizin parçasıdır.";
    }

    if (result.analysisType === 'AT-CM') {
        return `Sayın Veli, Bugün öğrencimizle beyin programlama tekniklerinden 'Çıpalama'yı çalıştık. Bunu bir 'Akıllı Tuş' gibi düşünebilirsiniz. Çocuğunuzun vücudunda özel bir nokta belirledik ve bu noktayı '${result.data.answers.chosenEmotion}' duygusuyla eşleştirdik. Sınavda dikkati dağıldığında veya paniklediğinde, o küçük hareketi yaparak beynine otomatik sakinleşme komutunu gönderecek. Bu çapanın zayıflamaması için haftada bir kez evde kısa tekrarlar yapması yeterli olacaktır.`;
    }

    if (result.analysisType === 'ADDE-20') {
        const { emotional, academic } = result.data.scores;
        if (emotional < 25 && academic > 40) {
            return "Sayın Veli, Analiz sonucunda öğrencimizin sağladığınız maddi imkanların (oda, kitap, kurs) farkında olduğu ve bu konuda desteklendiğini hissettiği görülmüştür. Ancak, sınav stresiyle başa çıkarken biraz daha 'koşulsuz sevgi' ve 'anlaşılma' hissine ihtiyaç duymaktadır. Bu hafta ders başarısını sormadan, sadece onunla kaliteli vakit geçirmenizi rica ederiz.";
        }
        if (emotional > 40 && academic < 25) {
            return "Sayın Veli, Öğrencimiz ailenizden büyük bir sevgi ve güven alıyor, bu harika bir temel. Ancak çalışma ortamının sessizliği veya kaynaklara erişim gibi 'akademik araçlar' konusunda bazı eksikler hissediyor. Evdeki gürültü düzenini ve çalışma masası ergonomisini tekrar gözden geçirmekte fayda olabilir.";
        }
        return "Sayın Veli, Öğrencimizle yaptığımız 'Aile Destek Analizi' sonucunda genel tablonun dengeli ve yapıcı olduğu görülmüştür. Sınav sürecindeki bu 'takım ruhu' öğrencinin kaygısını azaltan en önemli tampondur. Bu huzurlu ortamı korumaya devam etmenizi öneririz.";
    }

    if (result.analysisType === 'B-AVO') {
        return "Sayın Veli, Bugün öğrencimizin zihnindeki 'Virüsleri' (onu durduran olumsuz otomatik düşünceleri) temizledik. Öğrencimizin hata yaptığında kendine çok acımasız davrandığını ve 'Felaketleştirme' gibi zihinsel hatalar yaptığını fark ettik. Sizden ricamız; o hata yaptığında 'Neden yapamadın?' diye sormak yerine, 'Bu hatadan ne öğrendik, bir dahakine neyi farklı yapacağız?' diyerek onun yeni 'Anti-Virüs' yazılımını desteklemenizdir.";
    }
    
    if (result.analysisType === 'ADT-Ö') {
        return "Sayın Veli, Öğrencimizle yaptığımız 'Ders Tutum Analizi'nde; genel bir başarısızlık değil, 'Noktasal Dirençler' tespit ettik. Bazı derslerde 'öğrenilmiş çaresizlik' yaşıyor. Bu derslerde ona 'Daha çok çalış' demek yerine, 'Yapabilirim' inancını tazeleyecek küçük başarı adımları planlıyoruz. Bu hafta bu derslerdeki küçük ilerlemelerini bile alkışlamanız motivasyonunu ciddi oranda artıracaktır.";
    }

    if (result.analysisType === 'ÇDÖ-E') {
        return `Sayın Veli, Öğrencimizle yaptığımız 'Çalışma Davranışı Analizi'nde; öğrencimizin akademik niyetinin olduğu ancak bunu sürdürme konusunda 'davranışsal disiplin' eksikliği yaşadığı görülmüştür. Profili '${result.data.profile}' olarak belirlenmiştir. Bu hafta evde 'Jandarma' rolünü bırakıp, onun çalışma saatlerine sadık kalıp kalmadığını sessizce izleyip bizimle paylaşmanız disiplin kazanma süreci için çok kritiktir.`;
    }

    if (result.analysisType === 'Ç-MOD') {
        const { gratification, delay, selfControl } = result.data.scores;
        if (result.data.profile === 'SÜREKLİ İFLAS EDEN') {
            return "Sayın Veli, Öğrencimizle yaptığımız analizde; 'haz erteleme' becerisinin henüz gelişme aşamasında olduğu ve anlık keyiflere (telefon, internet vb.) karşı koymakta çok zorlandığı görülmüştür. Bu durum akademik süreci 'sürekli iflas' noktasına getirebilir. Bu hafta itibariyle evde 'Çikolata Modeli'ni uygulayacağız. Keyif verici her şeyin (temel ihtiyaçlar hariç) bir puan bedeli olacak ve öğrencimiz önce çalışarak bu puanı 'hak etmek' zorunda kalacaktır. Lütfen ona 'bedava' ödüller vermeyerek bu irade eğitimini destekleyiniz.";
        }
        return `Sayın Veli, Öğrencimiz haz erteleme ve ödül yönetimi konusunda '${result.data.profile}' profiline sahiptir. Kendi otokontrol mekanizmasını kurmaya başlamıştır. Bu süreci, evde ona daha fazla özerklik vererek ve kendi 'ödül bütçesini' yönetmesine izin vererek destekleyebilirsiniz.`;
    }

    if (result.analysisType === 'AMID') {
        return `Sayın Veli, Bugün öğrencimizle zihinsel prangalardan kurtulma çalışması yaptık. Çocuğunuzun '${result.data.answers.oldBelief}' şeklindeki kısıtlayıcı inancını, zihindeki 'ayarlarını' değiştirerek '${result.data.answers.newBelief}' inancı ile güncelledik. Önceden imkansız gibi görünen konular şu an onun için 'parlak ve ulaşılabilir' bir görüntüye dönüştü. Bu yeni inancı pekiştirmek için evde onu motive edecek her türlü adımda bu yeni bakış açısını hatırlatmanız çok değerlidir.`;
    }

    if (result.analysisType === 'ÇZ-8') {
        return "Sayın Veli, Öğrencimizin Çoklu Zekâ Alanları (ÇZ-8) analizi tamamlanmıştır. Çocuğumuzun dünyayı hangi pencereden algıladığını (sözel, sayısal, sosyal, bedensel vb.) gördük. Eğitimde tek bir 'zeki' modeli yoktur; öğrencilerimizin baskın zekâ alanına göre yönlendirilmesi çok önemlidir. Evde, ona kendi 'öğrenme dilinde' yaklaşmanız (örneğin görsel zekası yüksekse şemalarla, bedensel zekası yüksekse hareket ederek çalışmasına izin vermek) onun akademik başarısını ve özgüvenini kalıcı olarak artıracaktır.";
    }

    if (result.analysisType === 'DART') {
        return "Sayın Veli, Öğrencimizle birlikte akademik rotasını belirlediğimiz 'DART Hedef Çalışması'nı tamamladık. Artık sadece 'ders çalış' demiyoruz; 'Bugün hedeflerinin %85'ini tamamla' diyoruz. Süreçte sizden ricamız, çocuğunuza 'Sınavı kazanacak mısın?' gibi makro (uzak) sorular sormamanızdır. Bunun yerine 'Bugünkü planını tamamlayabildin mi?' gibi mikro (yönetilebilir) sorular sormanız, kaygısını azaltıp odaklanmasını artıracaktır.";
    }

    if (result.analysisType === 'DOPA') {
        return "Sayın Veli, Öğrencimizle uyguladığımız 'Dikkat Performans Testi'nde (DOPA); Öğrencimizin dikkat potansiyelinin yüksek olduğu, ancak 'hız-kontrol' dengesini kurmakta zorlandığı görülmüştür. Bu bir 'dikkat eksikliği' değil, 'dikkat kondisyonunun' antrenman eksikliğidir. Odaklanma egzersizleriyle bu süreyi artıracağız.";
    }

    if (result.analysisType === 'GTS-36') {
        return "Sayın Veli, Öğrencimizle yaptığımız 'GTS-36: Tercih Simülasyonu' çalışmasında asıl gayemiz, sadece bir üniversiteye yerleşmesi değil, mutlu ve başarılı olacağı doğru alana yönelmesidir. Lütfen sadece puanı yetiyor diye ilgi duymadığı bölümlere ya da 'bizim yanımızda kalsın' diye sınırlı tercih yapmasına baskı kurmaktan kaçınalım. İyi bir tercih, bütün hayatı şekillendirir.";
    }

    if (result.analysisType === 'IM-OM') {
        return "Sayın Veli, Bugün öğrencimizle 'Oto-Motivasyon' çalıştık. Gördük ki; öğrencimiz aslında çalışmak istiyor ama işin büyüklüğü gözünü korkuttuğu için sürekli erteliyor ya da ilham bekliyor. Biz ona 'Küçük Adımlar' tekniğini öğrettik. Sizden çok önemli bir ricamız var: Lütfen ona 'Hadi ders çalış' demeyi bırakın. Dışarıdan gelen her 'Hadi' komutu, onun içindeki 'Oto-Pilot'u devre dışı bırakıyor. Kendi başlattığı 30 dakikalık çalışma, sizin zorunuzla yaptığı 3 saatten daha verimlidir.";
    }

    if (result.analysisType === 'K-E-A') {
        return "Sayın Veli, Öğrencimizle uyguladığımız 'Kartopu Modülü' kapsamında, ona bazen 'Sadece 5 dakika çalış' gibi çok küçük hedefler verebiliriz. Lütfen bunu 'ders çalışmıyor' veya 'koç az ödev veriyor' olarak yorumlamayın. Büyük bir yangını başlatmak için önce küçük bir kıvılcım gerekir. Çocuğunuzun çalışma isteğini (kıvılcımı) söndürmemek için, o odasına girip 5 dakika sonra çıksa bile 'Aferin, görevini yaptın' deyin. Bu takdir, o 5 dakikayı yakında 50 dakikaya çıkaracaktır.";
    }

    if (result.analysisType === 'KOLB-DÖSE') {
        return "Sayın Veli, Yapılan KOLB analizi sonucunda öğrencimizin kendine has doğal öğrenme stili belirlenmiştir. Kimi öğrenci saatlerce kitap okuyarak ('Özümseyen'), kimi öğrenci testin başına geçip yanlış yapa yapa ('Ayrıştıran/Yerleştiren') öğrenir. Lütfen çocuğunuzun çalışma tarzını dışarıdan 'oyalanmak' veya 'farklı şeyler yapmak' olarak değil, beyninin doğal süreçlere ihtiyacı olarak yorumlayıp ona alan tanıyalım.";
    }

    if (result.analysisType === 'MERCEK') {
        return "Sayın Veli, Öğrencimizle bugün 'Mercek Çalışması' yaptık. Kendisi akademik veya sosyal bir soruna saplanıp kaldığı anlarda (Tünel Bakışı), soruna 6 farklı perspektifle bakmayı deneyimledi. Özellikle 'Gelecekten Bakış' ve 'Empati' teknikleri zihinsel yükünü hafifletti. Sizden ricamız; o bir sorunla geldiğinde hemen çözüm üretmek yerine ona şu soruyu sormanızdır: 'Buna bir drone kamerasından baksaydın ne görürdün?' Bu soru, onun sakinleşip mantıklı düşünmesini sağlayacaktır.";
    }

    if (result.analysisType === 'MÇ-ZP') {
        return "Sayın Veli, Bugün öğrencimizle 'Mükemmellik Çemberi' adını verdiğimiz bir özgüven çalışması yaptık. Çocuğunuzun zihninde, ihtiyaç duyduğu anda basabileceği bir 'Özgüven Butonu' (Bedensel Çapa) oluşturduk. Sınav sabahları veya ders çalışırken, onun bazen gözlerini kapatıp derin nefes aldığını veya yumruğunu sıktığını görebilirsiniz. Lütfen 'Ne yapıyorsun?' diye müdahale etmeyin, o an zihnindeki o güçlü başarı anlarını vücuduna geri çağırıyor demektir.";
    }

    if (result.analysisType === 'ÖTI-A') {
        return `Değerli Velimiz, Öğrencimizle yaptığımız akademik ön analiz (ÖTİ-A) sonucunda; mevcut çalışma disiplini ve dijital bağımlılık düzeyi haritalandırılmıştır. Çocuğunuzun hedefine ulaşması için stratejik bir yol haritası belirlenmiş olup, ekran süresini kontrol altına alma ve öz-disiplin inşa etme konularında desteğinizi rica ederiz.`;
    }
    
    return null;
  };

  const getAnalysisTitle = (type: string) => {
    const titles: Record<string, string> = {
      'OZ-AF': '360° ÖZ-AF Analizi',
      'ABBA': 'ABBA Envanteri',
      'AG-MOT': 'AG-MOT Motivasyon Analizi',
      'HIRAT': 'HIRAT Planlama Analizi',
      'AID-Y': 'AID-Y İnanç Analizi',
      'ADTE-20': 'ADTE-20 Dikkat Analizi',
      'APEA-3D': 'APEA-3D Engel Analizi',
      'APK-S': 'APK-S Kaygı Analizi',
      'AB-CTE': 'AB-CTE Çaba Analizi',
      'AS-EQ': 'AS-EQ Duygusal Zekâ',
      'AYCE': 'AYCE Aile Yönetimi',
      'AT-CM': 'AT-CM Çıpalama Modülü',
      'ADDE-20': 'ADDE-20 Değerler Envanteri',
      'ADT-Ö': 'ADT-Ö Tutum Analizi',
      'B-AVO': 'B-AVO Virüs Tarama',
      'ÇDÖ-E': 'ÇDÖ-E Davranış Analizi',
      'AMID': 'AMİD Modülü',
      'Ç-MOD': 'Çikolata Modeli',
      'Ç-MOD-AI-AUDIT': 'Çikolata Modeli AI İçgörüsü',
      'ÇZ-8': 'ÇZ-8 Çoklu Zekâ',
      'DART': 'DART Hedef Yönetimi',
      'DOPA': 'DOPA Dikkat Analizi',
      'GTS-36': 'GTS-36 Tercih Simülasyonu',
      'IM-OM': 'İM-OM Oto-Motivasyon',
      'K-E-A': 'K-E-A Kartopu Etkisi',
      'KOLB-DÖSE': 'KOLB Öğrenme Stili',
      'MERCEK': 'MERCEK Bakış Açısı',
      'MÇ-ZP': 'Mükemmellik Çemberi',
      'ÖTI-A': 'Öğrenci Ön Analizi',
      'VAK-S': 'VAK-S Öğrenme Stilleri',
      'SP-BE': 'SP-BE Stres Profili',
      'ZS-ODO': 'ZS-ODÖ Zihinsel Sabotaj',
      'SI-GOZ': 'Sİ-GÖZ Sihirli Gözlükler',
      'SW-D': 'SW-D İmaj Dönüştürme',
      'TOTE': 'TOTE Döngü Analizi',
      'WD-3D': 'WD-3D Disney Planlama',
      'T-LINE': 'T-LINE Zaman Çizgisi',
      'VGF-E': 'VGF-E Veli Gözlem',
      'KLS': 'KLS Kariyer Laboratuvarı',
      'SOC-A': 'SOÇ-A Soru Okuma Stratejisi',
      'PDAR-360': 'PDAR-360 Deneme Analizi',
      'SS-DKM': 'SS-DKM Sınav Sonrası Analiz',
      'SZP-30': 'SZP-30 Son Viraj Analizi',
      'ZG-ZP': 'ZG-ZP Zor Gün Zafer Planı',
      'SCM': 'SCM: Sınav Check-up ve Motivasyon',
      'SD-SYE': 'SD-SYE: Stratejik Sınav Yönetimi'
    };
    return titles[type] || type;
  };

  if (loading) return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
      <Loader2 className="animate-spin text-blue-500" size={40} />
      <p className="text-slate-400 font-bold animate-pulse">Analiz Verileri Getiriliyor...</p>
    </div>
  );

  if (!result) return <div>Bulunamadı</div>;

  const translateKey = (key: string) => {
    const translations: Record<string, string> = {
      academics: 'Ders Başarısı',
      sleep: 'Uyku Düzeni',
      family: 'Aile İlişkileri',
      friends: 'Arkadaş İlişkileri',
      motivation: 'Motivasyon / Ruh Hali',
      health: 'Fiziksel Sağlık / Beslenme',
      'Ders Başarısı': 'Ders Başarısı',
      'Uyku Düzeni': 'Uyku Düzeni',
      'Aile İlişkileri': 'Aile İlişkileri',
      'Arkadaş İlişkileri': 'Arkadaş İlişkileri',
      'Motivasyon / Ruh Hali': 'Motivasyon / Ruh Hali',
      'Fiziksel Sağlık / Beslenme': 'Fiziksel Sağlık / Beslenme',
      totalScore: 'Toplam Motivasyon Skoru',
      riskLevel: 'Risk Seviyesi',
      hpp: 'Haftalık Performans Puanı (HPP)',
      math: 'Matematik',
      turkish: 'Türkçe',
      subject: 'Konu Bitirme',
      exam: 'Deneme Sınavı',
      revision: 'Hata Analizi/Tekrar',
      focus: 'Odaklanma/Pomodoro',
      negativeBelief: 'Negatif İnanç',
      positiveBelief: 'Pozitif İnanç',
      initialIntensity: 'Başlangıç İnanç Derecesi',
      finalIntensity: 'Yeni İnanç Derecesi',
      actionPlan: 'Eylem Planı',
      partA: 'Dikkat Eksikliği (Bölüm A)',
      partB: 'Hiperaktivite / Dürtü (Bölüm B)',
      total: 'Toplam Risk Skoru',
      cognitive: 'Bilişsel Faktörler',
      emotional: 'Duygusal Faktörler',
      behavioral: 'Davranışsal Faktörler',
      Verbal: 'Sözel-Dilsel Zekâ',
      Logical: 'Mantıksal-Matematiksel Zekâ',
      Visual: 'Görsel-Uzamsal Zekâ',
      Kinesthetic: 'Bedensel-Kinestetik Zekâ',
      Musical: 'Müziksel-Ritmik Zekâ',
      Interpersonal: 'Sosyal-Kişilerarası Zekâ',
      Intrapersonal: 'İçsel-Öze Dönük Zekâ',
      Naturalistic: 'Doğacı Zekâ'
    };
    return translations[key] || key;
  };

  return (
    <div className="max-w-5xl mx-auto space-y-8 pb-20 animate-in fade-in duration-500">
      <header className="space-y-4">
        <button 
          onClick={() => navigate(-1)}
          className="flex items-center gap-2 text-slate-500 hover:text-white transition-colors text-xs font-bold uppercase tracking-widest"
        >
          <ChevronLeft size={16} />
          Geri Dön
        </button>
        <div className="flex justify-between items-end">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 text-[10px] font-black uppercase tracking-widest">
              <Brain size={12} />
              {getAnalysisTitle(result.analysisType)}
            </div>
            <h1 className="text-3xl font-black text-white">Analiz Detay Raporu</h1>
          </div>
          <p className="text-slate-500 text-xs font-bold uppercase tracking-widest bg-white/5 px-4 py-2 rounded-2xl border border-white/5">
            {result.timestamp?.toDate().toLocaleDateString('tr-TR')}
          </p>
        </div>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left: Raw Data / Metrics */}
        <div className="lg:col-span-1 space-y-6">
          <div className="bg-slate-900/50 backdrop-blur-xl border border-white/5 rounded-[32px] p-5 sm:p-7 space-y-6">
            <h3 className="text-base font-black text-white flex items-center gap-2 uppercase tracking-widest border-b border-white/5 pb-4">
              <Activity className="text-blue-400" size={18} />
              Analiz Verileri
            </h3>

            {result.analysisType === 'VAK-S' && (
                <div className="space-y-6 text-center">
                    <div className="w-20 h-20 bg-indigo-500/20 rounded-3xl flex items-center justify-center text-indigo-400 mx-auto border border-indigo-500/20 mb-4">
                        <Puzzle size={40} />
                    </div>
                    <div className="text-3xl font-black text-white">{result.data.results?.dominantStyle}</div>
                    <div className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-6">BASKIN ÖĞRENME STİLİ</div>
                    <div className="grid grid-cols-1 gap-4 text-left">
                        {[
                            { label: 'Görsel', value: result.data.results?.counts?.G, color: 'bg-blue-500' },
                            { label: 'İşitsel', value: result.data.results?.counts?.İ, color: 'bg-emerald-500' },
                            { label: 'Kinestetik', value: result.data.results?.counts?.K, color: 'bg-amber-500' }
                        ].map(item => (
                            <div key={item.label} className="bg-white/5 p-4 rounded-2xl border border-white/5">
                                <div className="flex justify-between text-[10px] font-black uppercase tracking-widest mb-2">
                                    <span className="text-slate-500">{item.label}</span>
                                    <span className="text-white">{item.value}/15</span>
                                </div>
                                <div className="h-1.5 bg-white/5 rounded-full overflow-hidden">
                                    <div className={`h-full ${item.color}`} style={{ width: `${(item.value / 15) * 100}%` }} />
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {result.analysisType === 'SP-BE' && (
                <div className="space-y-6 text-center">
                    <div className="w-20 h-20 bg-rose-500/20 rounded-3xl flex items-center justify-center text-rose-400 mx-auto border border-rose-500/20 mb-4">
                        {result.data.results?.dominantType === 'Volkan' && <Flame size={40} />}
                        {result.data.results?.dominantType === 'Buzdağı' && <Snowflake size={40} />}
                        {result.data.results?.dominantType === 'Halterci' && <Dumbbell size={40} />}
                    </div>
                    <div className="text-3xl font-black text-white uppercase">{result.data.results?.dominantType}</div>
                    <div className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-6">STRES PROFİLİ</div>
                    <div className="grid grid-cols-1 gap-3 text-left">
                        {[
                            { label: 'Volkan (SAVAŞ)', value: result.data.results?.counts?.A, max: 6, color: 'bg-rose-500' },
                            { label: 'Buzdağı (KAÇ)', value: result.data.results?.counts?.B, max: 6, color: 'bg-blue-400' },
                            { label: 'Halterci (YÜK)', value: result.data.results?.counts?.C, max: 6, color: 'bg-amber-500' }
                        ].map(item => (
                            <div key={item.label} className="bg-white/5 p-4 rounded-2xl border border-white/5">
                                <div className="flex justify-between text-[10px] font-black uppercase tracking-widest mb-2">
                                    <span className="text-slate-500">{item.label}</span>
                                    <span className="text-white">{item.value}/{item.max}</span>
                                </div>
                                <div className="h-1.5 bg-white/5 rounded-full overflow-hidden">
                                    <div className={`h-full ${item.color}`} style={{ width: `${(item.value / item.max) * 100}%` }} />
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {(result.analysisType === 'KLS' || result.analysisType === 'SZP-30' || result.analysisType === 'SS-DKM' || result.analysisType === 'ZG-ZP' || result.analysisType === 'SCM' || result.analysisType === 'SD-SYE') && (
                <div className="space-y-6 text-center">
                    <div className="w-20 h-20 bg-amber-500/20 rounded-3xl flex items-center justify-center text-amber-400 mx-auto border border-amber-500/20 mb-4">
                        <Activity size={40} />
                    </div>
                    <div className="text-5xl font-black text-white">{result.data.totalScore ?? result.data.score ?? result.data.scores?.total}</div>
                    <div className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2">TOPLAM PUAN</div>
                    <div className="px-4 py-2 bg-amber-500/10 rounded-xl border border-amber-500/20 inline-block">
                         <div className="text-xs font-black text-amber-500 uppercase tracking-widest">{result.data.profile || 'ANALİZ TAMAMLANDI'}</div>
                    </div>
                </div>
            )}

            {(result.analysisType === 'ZS-ODO' || result.analysisType === 'SI-GOZ' || result.analysisType === 'SW-D' || result.analysisType === 'TOTE' || result.analysisType === 'WD-3D' || result.analysisType === 'T-LINE' || result.analysisType === 'SOC-A' || result.analysisType === 'PDAR-360') && (
                <div className="space-y-6">
                    <div className="bg-indigo-500/10 p-6 rounded-3xl border border-indigo-500/20 text-center">
                        <div className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2">DURUM</div>
                        <div className="text-xl font-black text-white">VERİLER KAYDEDİLDİ</div>
                        <p className="text-[10px] text-slate-400 mt-2 italic">Girdi ve seçimlerin yapay zeka analizine aktarılmıştır.</p>
                    </div>
                    <div className="grid grid-cols-1 gap-2">
                        {result.data.results && Object.entries(result.data.results).map(([k, v]: any) => (
                             <div key={k} className="flex justify-between p-3 bg-white/5 rounded-xl text-[10px] font-bold uppercase tracking-widest">
                                <span className="text-slate-500">{k}:</span>
                                <span className="text-indigo-400">{typeof v === 'object' ? 'Detay Kayıtlı' : v}</span>
                             </div>
                        ))}
                    </div>
                </div>
            )}

            {result.analysisType === 'OZ-AF' && (
              <div className="space-y-6">
                {Object.entries(result.data.wheel).map(([key, val]: any) => (
                    <div key={key} className="space-y-2">
                        <div className="flex justify-between text-[10px] font-black uppercase tracking-widest">
                            <span className="text-slate-500">{translateKey(key)}</span>
                            <span className="text-blue-400">{val}/10</span>
                        </div>
                        <div className="w-full bg-white/5 h-1.5 rounded-full overflow-hidden">
                            <div className="h-full bg-blue-500" style={{ width: `${val * 10}%` }} />
                        </div>
                    </div>
                ))}
              </div>
            )}

            {result.analysisType === 'ABBA' && (
              <div className="space-y-6">
                <div className="grid grid-cols-1 gap-4">
                    <div className="bg-pink-500/5 border border-pink-500/10 rounded-2xl p-4 flex justify-between items-center">
                        <div className="flex items-center gap-3">
                            <Heart className="text-pink-400" size={18} />
                            <span className="text-xs font-black text-white uppercase tracking-widest">Aile Desteği</span>
                        </div>
                        <span className="text-lg font-black text-pink-400">{result.data.averages.family.toFixed(1)}</span>
                    </div>
                    <div className="bg-indigo-500/5 border border-indigo-500/10 rounded-2xl p-4 flex justify-between items-center">
                        <div className="flex items-center gap-3">
                            <ShieldCheck className="text-indigo-400" size={18} />
                            <span className="text-xs font-black text-white uppercase tracking-widest">Benlik Saygısı</span>
                        </div>
                        <span className="text-lg font-black text-indigo-400">{result.data.averages.self.toFixed(1)}</span>
                    </div>
                    <div className="bg-emerald-500/5 border border-emerald-500/10 rounded-2xl p-4 flex justify-between items-center">
                        <div className="flex items-center gap-3">
                            <GraduationCap className="text-emerald-400" size={18} />
                            <span className="text-xs font-black text-white uppercase tracking-widest">Akademik İnanç</span>
                        </div>
                        <span className="text-lg font-black text-emerald-400">{result.data.averages.academic.toFixed(1)}</span>
                    </div>
                </div>
              </div>
            )}

            {result.analysisType === 'AG-MOT' && (
              <div className="space-y-6">
                 <div className="bg-red-500/5 border border-red-500/10 rounded-[32px] p-6 text-center space-y-4">
                    <div className="w-16 h-16 rounded-full bg-red-500/20 flex items-center justify-center text-red-500 mx-auto shadow-inner">
                        <Zap size={32} className="fill-red-500" />
                    </div>
                    <div>
                        <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] mb-1">Motivasyon Risk Skoru</p>
                        <p className="text-4xl font-black text-white">{result.data.totalScore}<span className="text-lg text-slate-600">/100</span></p>
                    </div>
                    <div className={`inline-block px-4 py-1.5 rounded-full text-[11px] font-black uppercase tracking-widest ${
                      result.data.totalScore >= 70 ? 'bg-red-500/20 text-red-400 border border-red-500/30' :
                      result.data.totalScore >= 46 ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30' :
                      'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                    }`}>
                        {result.data.riskLevel}
                    </div>
                 </div>

                 <div className="space-y-2 p-4 bg-white/5 rounded-3xl border border-white/5">
                    <h4 className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Skor Yorumu</h4>
                    <p className="text-xs text-slate-300 font-medium leading-relaxed">
                        {result.data.totalScore >= 70 
                          ? "Yüksek Risk: Öğrenci zihnen 'şalteri indirmiş' durumda. Acil bilişsel müdahale ve koçluk desteği önerilir."
                          : result.data.totalScore >= 46
                          ? "Orta Risk: Dönemsel karamsarlık ve bilişsel çarpıtmalar başlamış. Mükemmeliyetçilik baskısı olabilir."
                          : "Normal Düzey: Gerçekçi kaygı düzeyinde, motivasyonu koruma odaklı devam edilebilir."
                        }
                    </p>
                 </div>
              </div>
            )}

            {result.analysisType === 'HIRAT' && (
              <div className="space-y-6">
                 <div className="bg-emerald-500/5 border border-emerald-500/10 rounded-[32px] p-6 text-center space-y-4">
                    <div className="w-16 h-16 rounded-full bg-emerald-500/20 flex items-center justify-center text-emerald-500 mx-auto shadow-inner">
                        <BarChart3 size={32} />
                    </div>
                    <div>
                        <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] mb-1">Haftalık Başarı (HPP)</p>
                        <p className="text-4xl font-black text-white">%{Math.round(result.data.hpp)}</p>
                    </div>
                    <div className={`inline-block px-4 py-1.5 rounded-full text-[11px] font-black uppercase tracking-widest ${
                      result.data.hpp >= 90 ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' :
                      result.data.hpp >= 70 ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30' :
                      result.data.hpp > 0 ? 'bg-red-500/20 text-red-400 border border-red-500/30' :
                      'bg-blue-500/20 text-blue-400 border border-blue-500/30'
                    }`}>
                        {result.data.riskLevel}
                    </div>
                 </div>

                 <div className="space-y-3">
                    <h4 className="text-[10px] font-black text-slate-500 uppercase tracking-widest pl-1">Detaylı Dağılım</h4>
                    <div className="grid grid-cols-1 gap-2.5">
                        {Object.entries(result.data.categories).map(([key, cat]: any) => {
                            const success = cat.target > 0 ? (cat.actual / cat.target) * 100 : 0;
                            return (
                                <div key={key} className="bg-white/5 rounded-2xl p-4 flex items-center justify-between border border-white/5 hover:border-white/10 transition-colors">
                                    <div className="space-y-0.5">
                                        <p className="text-xs font-black text-white uppercase tracking-tight">{translateKey(key)}</p>
                                        <p className="text-[10px] font-bold text-slate-500 uppercase tracking-tighter">
                                            {cat.actual} / {cat.target}
                                        </p>
                                    </div>
                                    <div className="text-right space-y-1">
                                        <div className="text-sm font-black text-white">%{Math.round(success)}</div>
                                        <div className="text-[8px] font-black text-indigo-400 uppercase tracking-widest border border-indigo-500/20 px-2 py-0.5 rounded-full">
                                            Doğru: %{cat.quality}
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                 </div>
              </div>
            )}

            {result.analysisType === 'AID-Y' && (
                <div className="space-y-6">
                    <div className="bg-orange-500/5 border border-orange-500/10 rounded-[32px] p-8 space-y-6">
                        <div className="flex justify-between items-center border-b border-white/5 pb-4">
                            <div className="flex items-center gap-3">
                                <Scale className="text-orange-400" size={20} />
                                <h4 className="text-xs font-black text-white uppercase tracking-widest">İnanç Değişimi</h4>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                            <div className="space-y-2">
                                <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest text-center">Eski İnanç Derecesi</p>
                                <p className="text-4xl font-black text-red-400 text-center">{result.data.initialIntensity}<span className="text-sm text-slate-600">/10</span></p>
                            </div>
                            <div className="flex items-center justify-center">
                                <Activity className="text-slate-700 animate-pulse" size={24} />
                            </div>
                            <div className="space-y-2">
                                <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest text-center">Yeni İnanç Derecesi</p>
                                <p className="text-4xl font-black text-emerald-400 text-center">{result.data.finalIntensity}<span className="text-sm text-slate-600">/10</span></p>
                            </div>
                        </div>

                        <div className="space-y-4">
                             <div className="p-4 bg-red-500/5 border border-red-500/10 rounded-2xl space-y-2">
                                <h5 className="text-[9px] font-black text-red-400 uppercase tracking-widest">Dönüştürülen İnanç</h5>
                                <p className="text-xs text-white font-medium italic">"{result.data.negativeBelief}"</p>
                             </div>
                             <div className="p-4 bg-emerald-500/5 border border-emerald-500/10 rounded-2xl space-y-2">
                                <h5 className="text-[9px] font-black text-emerald-400 uppercase tracking-widest">Yeni Güçlendirici İnanç</h5>
                                <p className="text-xs text-white font-black">"{result.data.positiveBelief}"</p>
                             </div>
                        </div>
                    </div>

                    <div className="p-6 bg-slate-900 border border-white/5 rounded-3xl space-y-4">
                        <h4 className="text-xs font-black text-slate-500 uppercase tracking-widest flex items-center gap-2">
                            <Gavel size={14} className="text-emerald-400" />
                            Bugünün Eylemi
                        </h4>
                        <p className="text-sm text-white font-medium bg-emerald-500/10 border border-emerald-500/20 p-4 rounded-2xl leading-relaxed">
                            {result.data.actionPlan}
                        </p>
                    </div>
                </div>
            )}

            {result.analysisType === 'ADTE-20' && (
                <div className="space-y-6">
                    <div className="bg-purple-500/5 border border-purple-500/10 rounded-[32px] p-8 space-y-6">
                        <div className="flex justify-between items-center border-b border-white/5 pb-4">
                            <div className="flex items-center gap-3">
                                <Clock className="text-purple-400" size={20} />
                                <h4 className="text-xs font-black text-white uppercase tracking-widest">Dikkat & Odak Profili</h4>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div className="space-y-2 p-5 bg-white/5 rounded-2xl border border-white/5 flex flex-col items-center justify-center">
                                <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Dikkat Eksikliği</p>
                                <p className={`text-4xl font-black ${result.data.scores.partA >= 20 ? 'text-red-400' : 'text-white'}`}>
                                    {result.data.scores.partA}<span className="text-sm text-slate-600">/30</span>
                                </p>
                            </div>
                            <div className="space-y-2 p-5 bg-white/5 rounded-2xl border border-white/5 flex flex-col items-center justify-center">
                                <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Dürtüsellik</p>
                                <p className={`text-4xl font-black ${result.data.scores.partB >= 20 ? 'text-red-400' : 'text-white'}`}>
                                    {result.data.scores.partB}<span className="text-sm text-slate-600">/30</span>
                                </p>
                            </div>
                        </div>

                        <div className="p-4 bg-white/5 rounded-2xl border border-white/5 space-y-3">
                            <div className="flex justify-between items-center">
                                <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Kümülatif Risk</span>
                                <span className="text-xs font-black text-white">{result.data.scores.total}/60</span>
                            </div>
                            <div className="w-full h-2 bg-white/5 rounded-full overflow-hidden">
                                <div 
                                    className={`h-full transition-all duration-1000 ${
                                        result.data.scores.total >= 40 ? 'bg-red-500' : 
                                        result.data.scores.total >= 22 ? 'bg-amber-500' : 'bg-emerald-500'
                                    }`}
                                    style={{ width: `${(result.data.scores.total / 60) * 100}%` }}
                                />
                            </div>
                        </div>
                    </div>

                    <div className="p-6 bg-slate-900 border border-white/5 rounded-3xl space-y-4">
                        <div className="flex items-center gap-2 text-amber-500">
                            <AlertCircle size={18} />
                            <h4 className="text-xs font-black uppercase tracking-widest">Risk Analiz Notu</h4>
                        </div>
                        <p className="text-xs text-slate-400 font-medium leading-relaxed italic">
                            {result.data.scores.total >= 40 
                                ? "Kritik Skor: Dikkat performansı akademik hedefleri ciddi oranda etkiliyor olabilir. Uzman görüşü şarttır."
                                : result.data.scores.total >= 22
                                ? "Sınırda Skor: Çevresel düzenlemeler ve odaklanma teknikleriyle gelişim sağlanabilir."
                                : "Normal Skor: Belirgin bir dikkat yönetimi sorunu gözlemlenmemiştir."
                            }
                        </p>
                    </div>
                </div>
            )}

            {result.analysisType === 'APEA-3D' && (
                <div className="space-y-8">
                    <div className="bg-indigo-500/5 border border-indigo-500/10 rounded-[40px] p-6 sm:p-8 space-y-8">
                        <div className="flex justify-between items-center border-b border-white/5 pb-6">
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-indigo-500/20 rounded-xl">
                                    <ShieldAlert className="text-indigo-400" size={22} />
                                </div>
                                <h4 className="text-xs font-black text-white uppercase tracking-[0.2em]">Engel Profili</h4>
                            </div>
                        </div>

                        <div className="flex flex-col gap-5">
                            {[
                                { id: 'cognitive', icon: Brain, color: 'text-blue-400', bg: 'bg-blue-400/10' },
                                { id: 'emotional', icon: Heart, color: 'text-pink-400', bg: 'bg-pink-400/10' },
                                { id: 'behavioral', icon: Activity, color: 'text-amber-400', bg: 'bg-amber-400/10' }
                            ].map((item) => (
                                <div key={item.id} className="group relative">
                                    <div className="flex justify-between items-end mb-3 px-2">
                                        <div className="flex items-center gap-3">
                                            <div className={`p-2 rounded-lg ${item.bg} ${item.color}`}>
                                                <item.icon size={16} />
                                            </div>
                                            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{translateKey(item.id)}</span>
                                        </div>
                                        <div className="text-right">
                                            <span className="text-2xl font-black text-white">{result.data.scores[item.id]}</span>
                                            <span className="text-[10px] font-bold text-slate-600 ml-1">/ 50</span>
                                        </div>
                                    </div>
                                    <div className="w-full h-3 bg-white/5 rounded-full overflow-hidden p-0.5 border border-white/5">
                                        <div 
                                            className={`h-full rounded-full transition-all duration-1000 ${
                                                item.id === 'cognitive' ? 'bg-blue-500 shadow-[0_0_10px_rgba(59,130,246,0.5)]' : 
                                                item.id === 'emotional' ? 'bg-pink-500 shadow-[0_0_10px_rgba(236,72,153,0.5)]' : 
                                                'bg-amber-500 shadow-[0_0_10px_rgba(245,158,11,0.5)]'
                                            }`}
                                            style={{ width: `${(result.data.scores[item.id] / 50) * 100}%` }}
                                        />
                                    </div>
                                    {result.data.scores[item.id] >= 35 && (
                                        <div className="mt-2 flex items-center gap-1.5 px-3 py-1 rounded-lg bg-red-500/10 text-red-400 border border-red-500/10 text-[8px] font-black uppercase tracking-widest italic animate-pulse">
                                            <ShieldAlert size={10} /> Kritik Bariyer Tespit Edildi
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>

                        <div className="pt-6 border-t border-white/5 space-y-4">
                            <div className="flex items-center gap-2 text-indigo-400 px-1">
                                <Search size={16} />
                                <h4 className="text-[10px] font-black uppercase tracking-widest">Baskın Engel</h4>
                            </div>
                            {Object.entries(result.data.scores)
                                .filter(([k]) => k !== 'total')
                                .sort((a: any, b: any) => b[1] - a[1])
                                .slice(0, 1)
                                .map(([key, val]: any) => (
                                <div key={key} className="bg-white/5 rounded-2xl p-5 border border-white/5 space-y-3">
                                    <p className="text-xs text-slate-400 font-medium leading-relaxed italic">
                                        En yüksek skorlu engeliniz: <strong className="text-white uppercase">{translateKey(key)}</strong>
                                    </p>
                                    <p className="text-[10px] text-slate-500 leading-normal line-clamp-3">
                                        Bu durum potansiyelinizi %{Math.round((val / 50) * 100)} oranında kısıtlıyor olabilir. Odaklanmanız gereken ilk alan budur.
                                    </p>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            )}

            {result.analysisType === 'APK-S' && (
                <div className="space-y-8">
                    <div className="bg-rose-500/5 border border-rose-500/10 rounded-[40px] p-6 sm:p-8 space-y-8">
                        <div className="flex justify-between items-center border-b border-white/5 pb-6">
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-rose-500/20 rounded-xl">
                                    <Activity className="text-rose-400" size={22} />
                                </div>
                                <h4 className="text-xs font-black text-white uppercase tracking-[0.2em]">Stres Haritası</h4>
                            </div>
                        </div>

                        <div className="flex flex-col gap-5">
                            {[
                                { id: 'cognitive', icon: Brain, color: 'text-blue-400', bg: 'bg-blue-400/10', title: 'Zihinsel Blokaj' },
                                { id: 'physical', icon: Heart, color: 'text-rose-400', bg: 'bg-rose-400/10', title: 'Bedensel Tepki' },
                                { id: 'behavioral', icon: Activity, color: 'text-amber-400', bg: 'bg-amber-400/10', title: 'Kaçınma & Eylem' }
                            ].map((item) => (
                                <div key={item.id} className="group relative">
                                    <div className="flex justify-between items-end mb-3 px-2">
                                        <div className="flex items-center gap-3">
                                            <div className={`p-2 rounded-lg ${item.bg} ${item.color}`}>
                                                <item.icon size={16} />
                                            </div>
                                            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{item.title}</span>
                                        </div>
                                        <div className="text-right">
                                            <span className="text-2xl font-black text-white">{result.data.scores[item.id]}</span>
                                            <span className="text-[10px] font-bold text-slate-600 ml-1">/ 40</span>
                                        </div>
                                    </div>
                                    <div className="w-full h-3 bg-white/5 rounded-full overflow-hidden p-0.5 border border-white/5">
                                        <div 
                                            className={`h-full rounded-full transition-all duration-1000 ${
                                                item.id === 'cognitive' ? 'bg-blue-500 shadow-[0_0_10px_rgba(59,130,246,0.5)]' : 
                                                item.id === 'physical' ? 'bg-rose-500 shadow-[0_0_10px_rgba(244,63,94,0.5)]' : 
                                                'bg-amber-500 shadow-[0_0_10px_rgba(245,158,11,0.5)]'
                                            }`}
                                            style={{ width: `${(result.data.scores[item.id] / 40) * 100}%` }}
                                        />
                                    </div>
                                    {result.data.scores[item.id] >= 30 && (
                                        <div className="mt-2 flex items-center gap-1.5 px-3 py-1 rounded-lg bg-red-500/10 text-red-400 border border-red-500/10 text-[8px] font-black uppercase tracking-widest italic animate-pulse">
                                            <AlertCircle size={10} /> Alarm Seviyesi
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>

                        <div className="pt-6 border-t border-white/5 space-y-4">
                            <div className="bg-white/5 rounded-2xl p-5 border border-white/5 flex flex-col items-center justify-center text-center gap-4">
                                <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Genel Stres Skoru</h4>
                                <div className="text-4xl font-black text-white tracking-tighter">
                                    {result.data.scores.total} <span className="text-lg text-slate-500">/ 120</span>
                                </div>
                                <div className="w-full bg-slate-900/50 rounded-xl p-3 border border-white/5">
                                    <p className="text-xs font-black uppercase tracking-widest" style={{
                                        color: result.data.scores.total >= 97 ? '#ef4444' : 
                                               result.data.scores.total >= 73 ? '#f59e0b' : 
                                               result.data.scores.total >= 49 ? '#3b82f6' : '#10b981'
                                    }}>
                                        {result.data.scores.total >= 97 ? 'Panik Düzeyi (Kırmızı Bölge)' : 
                                         result.data.scores.total >= 73 ? 'Yüksek Kaygı (Alarm)' : 
                                         result.data.scores.total >= 49 ? 'Orta Kaygı (Yönetilebilir)' : 'Düşük Kaygı (Sağlıklı)'}
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}
            {result.analysisType === 'AB-CTE' && (
                <div className="space-y-8">
                    <div className="bg-cyan-500/5 border border-cyan-500/10 rounded-[40px] p-6 sm:p-8 space-y-6">
                        <div className="flex items-center gap-3 border-b border-white/5 pb-6">
                            <div className="p-2 bg-cyan-500/20 rounded-xl">
                                <BookOpen className="text-cyan-400" size={22} />
                            </div>
                            <h4 className="text-xs font-black text-white uppercase tracking-[0.2em]">Cümle Tamamlama Yanıtları</h4>
                        </div>
                        <div className="grid gap-3">
                            {Object.entries(result.data.answers).map(([id, answer]) => (
                                <div key={id} className="bg-white/5 rounded-2xl p-4 border border-white/5">
                                    <span className="text-[10px] font-black text-cyan-500 uppercase tracking-widest italic mb-1 block">Cümle {id}</span>
                                    <p className="text-sm font-medium text-slate-300">
                                        <span className="text-slate-500 mr-2">...</span>
                                        {String(answer)}
                                    </p>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            )}
            
            {result.analysisType === 'AS-EQ' && (
                <div className="space-y-8">
                    <div className="bg-emerald-500/5 border border-emerald-500/10 rounded-[40px] p-6 sm:p-8 space-y-8">
                        <div className="flex justify-between items-center border-b border-white/5 pb-6">
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-emerald-500/20 rounded-xl">
                                    <Brain className="text-emerald-400" size={22} />
                                </div>
                                <h4 className="text-xs font-black text-white uppercase tracking-[0.2em]">AS-EQ Profili</h4>
                            </div>
                        </div>

                        <div className="bg-white/5 rounded-2xl p-5 border border-white/5 flex flex-col items-center justify-center text-center gap-4">
                            <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Genel EQ Skoru</h4>
                            <div className="text-4xl font-black text-white tracking-tighter">
                                {result.data.scores.total} <span className="text-lg text-slate-500">/ 125</span>
                            </div>
                            <div className="w-full bg-slate-900/50 rounded-xl p-3 border border-white/5">
                                <p className="text-xs font-black uppercase tracking-widest" style={{
                                    color: result.data.scores.total >= 100 ? '#10b981' : 
                                           result.data.scores.total >= 75 ? '#3b82f6' : '#ef4444'
                                }}>
                                    {result.data.scores.total >= 100 ? 'Yüksek EQ (Lider Ruhlu)' : 
                                     result.data.scores.total >= 75 ? 'Orta EQ (Gelişime Açık)' : 
                                     'Düşük EQ (Risk Altında)'}
                                </p>
                            </div>
                        </div>

                        <div className="flex flex-col gap-5">
                            {['Öz-Bilinç', 'Öz-Yönetim', 'Motivasyon', 'Empati', 'Sosyal Beceriler'].map((key) => (
                                <div key={key} className="group relative">
                                    <div className="flex justify-between items-end mb-3 px-2">
                                        <div className="flex items-center gap-3">
                                            <span className="text-[10px] font-black text-slate-300 uppercase tracking-widest">{key}</span>
                                        </div>
                                        <div className="text-right">
                                            <span className="text-2xl font-black text-white">{result.data.scores[key]}</span>
                                            <span className="text-[10px] font-bold text-slate-600 ml-1">/ 25</span>
                                        </div>
                                    </div>
                                    <div className="w-full h-3 bg-white/5 rounded-full overflow-hidden p-0.5 border border-white/5">
                                        <div 
                                            className="h-full bg-emerald-500 rounded-full transition-all duration-1000 shadow-[0_0_10px_rgba(16,185,129,0.5)]"
                                            style={{ width: `${(result.data.scores[key] / 25) * 100}%` }}
                                        />
                                    </div>
                                    {result.data.scores[key] < 15 && (
                                        <div className="mt-2 flex items-center gap-1.5 px-3 py-1 rounded-lg bg-red-500/10 text-red-400 border border-red-500/10 text-[8px] font-black uppercase tracking-widest italic animate-pulse">
                                            <AlertCircle size={10} /> Düşük Performans
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            )}
            
            {result.analysisType === 'AYCE' && (
                <div className="space-y-8">
                    <div className="bg-orange-500/5 border border-orange-500/10 rounded-[40px] p-6 sm:p-8 space-y-8">
                        <div className="flex justify-between items-center border-b border-white/5 pb-6">
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-orange-500/20 rounded-xl">
                                    <BookOpen className="text-orange-400" size={22} />
                                </div>
                                <h4 className="text-xs font-black text-white uppercase tracking-[0.2em]">AYÇE Profili</h4>
                            </div>
                        </div>

                        <div className="bg-white/5 rounded-2xl p-5 border border-white/5 flex flex-col items-center justify-center text-center gap-4">
                            <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Genel Strateji Skoru</h4>
                            <div className="text-4xl font-black text-white tracking-tighter">
                                {result.data.scores.total} <span className="text-lg text-slate-500">/ 100</span>
                            </div>
                            <div className="w-full bg-slate-900/50 rounded-xl p-3 border border-white/5">
                                <p className="text-xs font-black uppercase tracking-widest" style={{
                                    color: result.data.scores.total >= 76 ? '#10b981' : 
                                           result.data.scores.total >= 51 ? '#f59e0b' : '#ef4444'
                                }}>
                                    {result.data.scores.total >= 76 ? 'Profesyonel Öğrenci' : 
                                     result.data.scores.total >= 51 ? 'Gelişmekte Olan Öğrenci' : 
                                     'Amatör Öğrenci'}
                                </p>
                            </div>
                        </div>

                        <div className="flex flex-col gap-5">
                            {['Planlama ve Hedefleme', 'Etkili Tekrar ve Hafıza', 'Not Alma ve Aktif Öğrenme', 'Süre ve Dikkat Yönetimi'].map((key) => (
                                <div key={key} className="group relative">
                                    <div className="flex justify-between items-end mb-3 px-2">
                                        <div className="flex items-center gap-3">
                                            <span className="text-[10px] font-black text-slate-300 uppercase tracking-widest">{key}</span>
                                        </div>
                                        <div className="text-right">
                                            <span className="text-2xl font-black text-white">{result.data.scores[key]}</span>
                                            <span className="text-[10px] font-bold text-slate-600 ml-1">/ 25</span>
                                        </div>
                                    </div>
                                    <div className="w-full h-3 bg-white/5 rounded-full overflow-hidden p-0.5 border border-white/5">
                                        <div 
                                            className="h-full bg-orange-500 rounded-full transition-all duration-1000 shadow-[0_0_10px_rgba(249,115,22,0.5)]"
                                            style={{ width: `${(result.data.scores[key] / 25) * 100}%` }}
                                        />
                                    </div>
                                    {result.data.scores[key] < 15 && (
                                        <div className="mt-2 flex items-center gap-1.5 px-3 py-1 rounded-lg bg-red-500/10 text-red-400 border border-red-500/10 text-[8px] font-black uppercase tracking-widest italic animate-pulse">
                                            <AlertCircle size={10} /> Düşük Performans
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            )}

            {result.analysisType === 'AT-CM' && (
                <div className="space-y-8">
                    <div className="bg-indigo-500/5 border border-indigo-500/10 rounded-[40px] p-6 sm:p-8 space-y-8">
                        <div className="flex justify-between items-center border-b border-white/5 pb-6">
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-indigo-500/20 rounded-xl">
                                    <Zap className="text-indigo-400" size={22} />
                                </div>
                                <h4 className="text-xs font-black text-white uppercase tracking-[0.2em]">Akıllı Tuş Yapılandırması</h4>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="bg-white/5 rounded-3xl p-6 border border-white/5 space-y-4">
                                <div className="flex items-center gap-3 text-indigo-400">
                                    <Fingerprint size={20} />
                                    <span className="text-[10px] font-black uppercase tracking-widest">Seçilen Tuş (Anchor)</span>
                                </div>
                                <p className="text-lg font-bold text-white">{result.data.answers.chosenAnchor}</p>
                            </div>

                            <div className="bg-white/5 rounded-3xl p-6 border border-white/5 space-y-4">
                                <div className="flex items-center gap-3 text-emerald-400">
                                    <Target size={20} />
                                    <span className="text-[10px] font-black uppercase tracking-widest">Eşleşen Duygu</span>
                                </div>
                                <p className="text-lg font-bold text-white">{result.data.answers.chosenEmotion}</p>
                            </div>
                        </div>

                        <div className="p-6 bg-slate-900/50 rounded-3xl border border-white/5 space-y-4">
                            <div className="flex items-center gap-3 text-amber-500">
                                <CheckCircle2 size={20} />
                                <span className="text-[10px] font-black uppercase tracking-widest">Test Sonucu Hissiyatı</span>
                            </div>
                            <p className="text-sm text-slate-400 font-medium italic leading-relaxed">
                                "{result.data.answers.testResult}"
                            </p>
                        </div>

                        <div className="p-6 bg-blue-500/5 border border-blue-500/10 rounded-3xl space-y-3">
                            <h4 className="text-xs font-bold text-blue-400 uppercase tracking-widest flex items-center gap-2">
                                <Info size={14} /> Önemli Hatırlatma
                            </h4>
                            <p className="text-[10px] text-slate-400 font-medium leading-relaxed">
                                Bu çapa sonsuza kadar sürmez. Haftada bir kez (şarj eder gibi) sessiz bir ortamda tuşa basıp aynı duyguyu yoğun bir şekilde hissetmen gerekir. Negatif bir durumdayken (üzgün, sinirli) bu tuşu kullanma, aksi halde çapanın frekansı bozulabilir.
                            </p>
                        </div>
                    </div>
                </div>
            )}

            {result.analysisType === 'ADDE-20' && (
                <div className="space-y-8">
                    <div className="bg-rose-500/5 border border-rose-500/10 rounded-[40px] p-6 sm:p-8 space-y-8">
                        <div className="flex justify-between items-center border-b border-white/5 pb-6">
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-rose-500/20 rounded-xl">
                                    <Users className="text-rose-400" size={22} />
                                </div>
                                <h4 className="text-xs font-black text-white uppercase tracking-[0.2em]">Destek Profili</h4>
                            </div>
                        </div>

                        <div className="bg-white/5 rounded-3xl p-6 border border-white/5 flex flex-col items-center justify-center text-center gap-4">
                            <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest uppercase tracking-widest">Temel Karakteristik</h4>
                            <div className="text-2xl font-black text-white tracking-tighter">
                                {result.data.profile}
                            </div>
                            <div className="text-[10px] font-black text-rose-500 uppercase tracking-widest bg-rose-500/10 px-4 py-2 rounded-full border border-rose-500/20">
                                Toplam Skor: {result.data.scores.total} / 100
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="space-y-4">
                                <div className="flex justify-between items-end px-2">
                                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Duygusal Destek</span>
                                    <span className="text-xl font-black text-rose-400">{result.data.scores.emotional} / 50</span>
                                </div>
                                <div className="w-full h-3 bg-white/5 rounded-full overflow-hidden p-0.5 border border-white/5">
                                    <div 
                                        className="h-full bg-rose-500 rounded-full shadow-[0_0_10px_rgba(244,63,94,0.5)]"
                                        style={{ width: `${(result.data.scores.emotional / 50) * 100}%` }}
                                    />
                                </div>
                            </div>

                            <div className="space-y-4">
                                <div className="flex justify-between items-end px-2">
                                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Akademik Destek</span>
                                    <span className="text-xl font-black text-indigo-400">{result.data.scores.academic} / 50</span>
                                </div>
                                <div className="w-full h-3 bg-white/5 rounded-full overflow-hidden p-0.5 border border-white/5">
                                    <div 
                                        className="h-full bg-indigo-500 rounded-full shadow-[0_0_10px_rgba(99,102,241,0.5)]"
                                        style={{ width: `${(result.data.scores.academic / 50) * 100}%` }}
                                    />
                                </div>
                            </div>
                        </div>

                        <div className="p-6 bg-slate-900/50 rounded-3xl border border-white/5 space-y-3">
                            <h4 className="text-[10px] font-black text-slate-500 uppercase tracking-widest flex items-center gap-2">
                                <AlertCircle size={14} /> Analiz Notu
                            </h4>
                            <p className="text-xs text-slate-400 font-medium leading-relaxed italic">
                                Bu analiz ailenin gerçekte ne yaptığını değil, senin bu süreci nasıl deneyimlediğini gösterir. Paylaşılan veriler, ailene karşı bir suçlama aracı değil, senin sınav kaygını azaltmak için yapılacak ortak iyileştirmelerin bir yol haritasıdır.
                            </p>
                        </div>
                    </div>
                </div>
            )}

            {result.analysisType === 'B-AVO' && (
                <div className="space-y-8">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="bg-emerald-500/5 border border-emerald-500/10 rounded-[40px] p-8 flex flex-col items-center justify-center text-center space-y-4">
                            <div className="w-16 h-16 rounded-3xl bg-emerald-500/20 flex items-center justify-center text-emerald-400">
                                <ShieldCheck size={32} />
                            </div>
                            <div>
                                <h4 className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">Operasyon Durumu</h4>
                                <div className="text-2xl font-black text-white">SİSTEM TEMİZLENDİ</div>
                            </div>
                        </div>

                        <div className="bg-indigo-500/5 border border-indigo-500/10 rounded-[40px] p-8 flex flex-col items-center justify-center text-center space-y-4">
                            <div className="w-16 h-16 rounded-3xl bg-indigo-500/20 flex items-center justify-center text-indigo-400">
                                <Activity size={32} />
                            </div>
                            <div>
                                <h4 className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">Kaygı Azalması</h4>
                                <div className="text-2x font-black text-white">-{result.data.scores.drop} PUAN</div>
                            </div>
                        </div>
                    </div>

                    <div className="bg-slate-900/50 border border-white/5 rounded-[40px] p-6 sm:p-8 space-y-6">
                        <div className="flex items-center gap-3 border-b border-white/5 pb-6">
                            <div className="p-2 bg-emerald-500/20 rounded-xl">
                                <Bug className="text-emerald-400" size={22} />
                            </div>
                            <h4 className="text-xs font-black text-white uppercase tracking-[0.2em]">Karantina Kayıtları</h4>
                        </div>

                        <div className="space-y-4">
                            {result.data.thoughtRecords.map((record: any, idx: number) => (
                                <div key={idx} className="bg-white/5 border border-white/5 rounded-3xl p-6 space-y-4">
                                    <div className="flex flex-col md:flex-row gap-6">
                                        <div className="flex-1 space-y-2">
                                            <span className="text-[9px] font-black text-red-400 uppercase tracking-widest block">Virüslü Düşünce</span>
                                            <p className="text-sm font-bold text-slate-400 italic line-through decoration-red-500/30">"{record.negativeThought}"</p>
                                        </div>
                                        <div className="flex-1 space-y-2">
                                            <span className="text-[9px] font-black text-emerald-400 uppercase tracking-widest block">Anti-Virüs Çözümü</span>
                                            <p className="text-sm font-bold text-white">"{record.antiVirus}"</p>
                                        </div>
                                    </div>
                                    <div className="pt-3 border-t border-white/5 flex justify-between items-center">
                                        <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Tespit Edilen Tür</span>
                                        <span className="px-3 py-1 bg-white/5 rounded-full text-[10px] font-bold text-indigo-400 border border-white/10 uppercase tracking-widest">
                                            {record.distortionType}
                                        </span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            )}

            {result.analysisType === 'ADT-Ö' && (
                <div className="space-y-8">
                    <div className="bg-indigo-500/5 border border-indigo-500/10 rounded-[40px] p-6 sm:p-8 space-y-8">
                        <div className="flex justify-between items-center border-b border-white/5 pb-6">
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-indigo-500/20 rounded-xl">
                                    <BookOpen className="text-indigo-400" size={22} />
                                </div>
                                <h4 className="text-xs font-black text-white uppercase tracking-[0.2em]">Branş Bazlı Isı Haritası</h4>
                            </div>
                        </div>

                        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                            {Object.entries(result.data.ratings).map(([id, rating]: [string, any]) => (
                                <div key={id} className="bg-white/5 rounded-3xl p-4 border border-white/5 space-y-2 text-center group hover:bg-white/10 transition-all">
                                    <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest block">{id.toUpperCase()}</span>
                                    <div className={`text-2xl font-black ${rating.score >= 8 ? 'text-emerald-400' : rating.score >= 5 ? 'text-amber-400' : 'text-rose-400'}`}>
                                        {rating.score}
                                    </div>
                                    {rating.reason && (
                                        <p className="text-[8px] text-slate-500 font-medium italic line-clamp-1 group-hover:line-clamp-none">
                                            {rating.reason}
                                        </p>
                                    )}
                                </div>
                            ))}
                        </div>

                        <div className="space-y-4">
                            <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-2">Kritik Teşhisler</h4>
                            <div className="flex flex-wrap gap-3">
                                {result.data.diagnosis.length > 0 ? result.data.diagnosis.map((d: string) => (
                                    <div key={d} className="px-4 py-2 bg-indigo-500/10 border border-indigo-500/20 rounded-full text-[10px] font-black text-indigo-400 uppercase tracking-widest">
                                        {d}
                                    </div>
                                )) : (
                                    <div className="px-4 py-2 bg-emerald-500/10 border border-emerald-500/20 rounded-full text-[10px] font-black text-emerald-400 uppercase tracking-widest">
                                        BELİRGİN BİR DİRENÇ TESPİT EDİLMEDİ
                                    </div>
                                )}
                            </div>
                        </div>

                        <div className="p-6 bg-slate-900/50 rounded-3xl border border-white/5 space-y-3">
                            <h4 className="text-[10px] font-black text-slate-500 uppercase tracking-widest flex items-center gap-2">
                                <AlertCircle size={14} /> ABC Tutum Modeli Notu
                            </h4>
                            <p className="text-xs text-slate-400 font-medium leading-relaxed">
                                Bu analiz, akademik başarının sadece "çalışma" ile değil, derslere yüklenen "anlam" (tutum) ile ilgili olduğunu vurgular. Teşhislerinize göre belirlenen koçluk hamlelerini uygulamak, derse olan direncinizi kıracaktır.
                            </p>
                        </div>
                    </div>
                </div>
            )}

            {result.analysisType === 'ÇDÖ-E' && (
                <div className="space-y-8">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <div className="bg-indigo-500/5 border border-indigo-500/10 rounded-[40px] p-8 text-center space-y-4">
                            <div className="w-16 h-16 rounded-3xl bg-indigo-500/20 flex items-center justify-center text-indigo-400 mx-auto">
                                <Layout size={32} />
                            </div>
                            <div>
                                <h4 className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">Planlama Puanı</h4>
                                <div className="text-3xl font-black text-white">{result.data.scores.planning} / 40</div>
                            </div>
                        </div>

                        <div className="bg-amber-500/5 border border-amber-500/10 rounded-[40px] p-8 text-center space-y-4">
                            <div className="w-16 h-16 rounded-3xl bg-amber-500/20 flex items-center justify-center text-amber-400 mx-auto">
                                <IterationCcw size={32} />
                            </div>
                            <div>
                                <h4 className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">Süreklilik Puanı</h4>
                                <div className="text-3xl font-black text-white">{result.data.scores.continuity} / 40</div>
                            </div>
                        </div>

                        <div className="bg-emerald-500/5 border border-emerald-500/10 rounded-[40px] p-8 text-center space-y-4">
                            <div className="w-16 h-16 rounded-3xl bg-emerald-500/20 flex items-center justify-center text-emerald-400 mx-auto">
                                <ShieldCheck size={32} />
                            </div>
                            <div>
                                <h4 className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">Disiplin Puanı</h4>
                                <div className="text-3xl font-black text-white">{result.data.scores.discipline} / 40</div>
                            </div>
                        </div>
                    </div>

                    <div className="bg-slate-900/50 border border-white/5 rounded-[40px] p-8 md:p-12 text-center space-y-6 relative overflow-hidden">
                        <div className="absolute top-0 right-0 p-8 opacity-10">
                            <Trophy size={120} className="text-white" />
                        </div>
                        <div className="relative z-10 space-y-4">
                            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/5 border border-white/10 text-slate-400 text-[10px] font-black uppercase tracking-widest">
                                Akademik İrade Profili
                            </div>
                            <h3 className="text-5xl font-black text-white tracking-tighter italic">
                                {result.data.profile}
                            </h3>
                            <div className="flex justify-center gap-4">
                                <div className="px-4 py-2 bg-indigo-500/10 border border-indigo-500/20 rounded-2xl text-xs font-bold text-indigo-400">
                                    Toplam Skor: {result.data.scores.total} / 120
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        <div className="p-8 bg-blue-500/5 border border-blue-500/10 rounded-[40px] space-y-4">
                             <h4 className="text-sm font-black text-blue-400 uppercase tracking-widest flex items-center gap-2">
                                <Search size={18} /> Zimmerman Modeli
                             </h4>
                             <p className="text-sm text-slate-400 font-medium leading-relaxed">
                                Öz-düzenlemeli öğrenme kapasiteniz, çalışma sürecinizi ne kadar yönetebildiğinizi gösterir. Planlama skorunuz bu kapasitenin mimarisidir.
                             </p>
                        </div>
                        <div className="p-8 bg-rose-500/5 border border-rose-500/10 rounded-[40px] space-y-4">
                             <h4 className="text-sm font-black text-rose-400 uppercase tracking-widest flex items-center gap-2">
                                <Activity size={18} /> GRIT (Azim) Teorisi
                             </h4>
                             <p className="text-sm text-slate-400 font-medium leading-relaxed">
                                Süreklilik ve disiplin skorlarınız, Angela Duckworth'ün başarıdaki en büyük etken olarak gördüğü "Azim" seviyenizin dışa vurumudur.
                             </p>
                        </div>
                    </div>
                </div>
            )}

            {result.analysisType === 'AMID' && (
                <div className="space-y-8">
                    <div className="bg-violet-500/5 border border-violet-500/10 rounded-[40px] p-6 sm:p-8 space-y-8">
                        <div className="flex justify-between items-center border-b border-white/5 pb-6">
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-violet-500/20 rounded-xl">
                                    <Monitor className="text-violet-400" size={22} />
                                </div>
                                <h4 className="text-xs font-black text-white uppercase tracking-[0.2em]">İnanç Yazılım Raporu</h4>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="bg-red-500/5 border border-red-500/10 rounded-3xl p-6 space-y-3">
                                <span className="text-[10px] font-black text-red-400 uppercase tracking-widest">Silinen İnanç</span>
                                <p className="text-lg font-bold text-slate-300 line-through decoration-red-500/50">{result.data.answers.oldBelief}</p>
                            </div>
                            <div className="bg-emerald-500/5 border border-emerald-500/10 rounded-3xl p-6 space-y-3">
                                <span className="text-[10px] font-black text-emerald-400 uppercase tracking-widest">Yüklenen İnanç</span>
                                <p className="text-lg font-bold text-white uppercase tracking-tighter">{result.data.answers.newBelief}</p>
                            </div>
                        </div>

                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                            <div className="p-4 bg-white/5 rounded-2xl border border-white/5 text-center">
                                <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest block mb-1">Eski Skor</span>
                                <span className="text-xl font-black text-red-500">{result.data.answers.preScore}</span>
                            </div>
                            <div className="p-4 bg-white/5 rounded-2xl border border-white/5 text-center">
                                <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest block mb-1">Yeni Skor</span>
                                <span className="text-xl font-black text-emerald-500">{result.data.answers.postScore}</span>
                            </div>
                            <div className="p-4 bg-white/5 rounded-2xl border border-white/5 text-center">
                                <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest block mb-1">Değişim Oranı</span>
                                <span className="text-xl font-black text-violet-400">%{Math.round(((result.data.answers.preScore - result.data.answers.postScore) / 10) * 100)}</span>
                            </div>
                            <div className="p-4 bg-white/5 rounded-2xl border border-white/5 text-center">
                                <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest block mb-1">Durum</span>
                                <span className="text-xs font-black text-emerald-400 uppercase">BAŞARILI</span>
                            </div>
                        </div>

                        <div className="p-6 bg-slate-900/50 rounded-3xl border border-white/5 space-y-3">
                            <h4 className="text-[10px] font-black text-violet-400 uppercase tracking-widest flex items-center gap-2">
                                <Palette size={14} /> Gözlem ve Hissiyat
                            </h4>
                            <p className="text-xs text-slate-400 font-medium leading-relaxed italic">
                                "{result.data.answers.feedback}"
                            </p>
                        </div>
                    </div>
                </div>
            )}

            {result.analysisType === 'Ç-MOD-AI-AUDIT' && (
                <div className="space-y-8">
                    <div className="bg-amber-500/5 border border-amber-500/10 rounded-[40px] p-6 sm:p-8 space-y-8">
                        <div className="flex justify-between items-center border-b border-white/5 pb-6">
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-amber-500/20 rounded-xl">
                                    <Candy className="text-amber-400" size={22} />
                                </div>
                                <h4 className="text-xs font-black text-white uppercase tracking-[0.2em]">AI Müfettiş Ödül Bankası Raporu</h4>
                            </div>
                        </div>

                        <div className="bg-amber-500/10 rounded-3xl p-6 md:p-10 border border-amber-500/20">
                            <h3 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
                               <Sparkles className="text-amber-400" size={24} />
                               Ekonomi ve İrade Analizi
                            </h3>
                            <div className="prose prose-invert prose-amber max-w-none prose-headings:font-black prose-p:leading-relaxed prose-p:text-slate-300">
                               <Markdown>{result.data.insight}</Markdown>
                            </div>
                        </div>
                    </div>
                </div>
            )}
            {result.analysisType === 'Ç-MOD' && (
                <div className="space-y-8">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <div className="bg-amber-500/5 border border-amber-500/10 rounded-[40px] p-8 text-center space-y-4">
                            <div className="w-16 h-16 rounded-3xl bg-amber-500/20 flex items-center justify-center text-amber-400 mx-auto">
                                <Smartphone size={32} />
                            </div>
                            <div>
                                <h4 className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">Haz Yönetimi</h4>
                                <div className="text-3xl font-black text-white">{result.data.scores.gratification} / 25</div>
                            </div>
                        </div>

                        <div className="bg-rose-500/5 border border-rose-500/10 rounded-[40px] p-8 text-center space-y-4">
                            <div className="w-16 h-16 rounded-3xl bg-rose-500/20 flex items-center justify-center text-rose-400 mx-auto">
                                <Timer size={32} />
                            </div>
                            <div>
                                <h4 className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">Erteleme Becerisi</h4>
                                <div className="text-3xl font-black text-white">{result.data.scores.delay} / 25</div>
                            </div>
                        </div>

                        <div className="bg-emerald-500/5 border border-emerald-500/10 rounded-[40px] p-8 text-center space-y-4">
                            <div className="w-16 h-16 rounded-3xl bg-emerald-500/20 flex items-center justify-center text-emerald-400 mx-auto">
                                <ShieldCheck size={32} />
                            </div>
                            <div>
                                <h4 className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">Otokontrol</h4>
                                <div className="text-3xl font-black text-white">{result.data.scores.selfControl} / 25</div>
                            </div>
                        </div>
                    </div>

                    <div className="bg-slate-900/50 border border-white/5 rounded-[40px] p-8 md:p-12">
                        <div className="flex flex-col md:flex-row gap-12 items-center">
                            <div className="flex-1 space-y-6">
                                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-400 text-[10px] font-black uppercase tracking-widest">
                                    İRADE PROFİLİ TESPİTİ
                                </div>
                                <h3 className="text-4xl font-black text-white">{result.data.profile}</h3>
                                <p className="text-slate-400 font-medium leading-relaxed">
                                    {result.data.profile === 'SÜREKLİ İFLAS EDEN' 
                                      ? "Haz erteleme becerilerin henüz istenen düzeyde değil. Gelecekteki büyük bir ödül için şu anki küçük bir keyfinden vazgeçmekte zorlanıyorsun. İçsel 'Çikolata Bankan' sürekli eksi bakiye veriyor."
                                      : result.data.profile === 'DENGE ARAYAN TÜCCAR'
                                      ? "Kendi içsel ödül sistemini kurmaya başlamışsın ancak bazen anlık hazlara yenik düşebiliyorsun. Disiplini bir pazarlık aracı olarak kullanmayı öğreniyorsun."
                                      : "Tebrikler! Gerçek bir 'Dengeli Yatırımcı'sın. Hazzı ertelemenin, başarının en temel anahtarı olduğunu kavramışsın. Önce hak ediyor, sonra keyfini sürüyorsun."
                                    }
                                </p>
                            </div>
                            <div className="w-64 h-64 relative shrink-0">
                                <div className="absolute inset-0 bg-amber-500/20 blur-[60px] animate-pulse"></div>
                                <div className="relative w-full h-full bg-slate-950 rounded-[48px] border border-white/10 flex flex-col items-center justify-center p-6 text-center">
                                    <Candy size={64} className="text-amber-500 mb-4" />
                                    <div className="text-xs font-black text-slate-500 uppercase tracking-widest">TOPLAM PUAN</div>
                                    <div className="text-5xl font-black text-white">{result.data.scores.total}</div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {result.analysisType === 'ÇZ-8' && (
                <div className="space-y-8">
                    <div className="bg-indigo-500/5 border border-indigo-500/10 rounded-[40px] p-6 sm:p-8 space-y-8">
                        <div className="flex justify-between items-center border-b border-white/5 pb-6">
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-indigo-500/20 rounded-xl">
                                    <Brain className="text-indigo-400" size={22} />
                                </div>
                                <h4 className="text-xs font-black text-white uppercase tracking-[0.2em]">ÇZ-8 Zekâ Profili</h4>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            {Object.entries(result.data.scores).sort(([, a]: any, [, b]: any) => b - a).map(([key, score]: any) => (
                                <div key={key} className="bg-white/5 rounded-3xl p-5 border border-white/5 space-y-3 relative overflow-hidden group">
                                    <div className="flex justify-between items-center z-10 relative">
                                        <span className="text-[10px] font-black text-slate-300 uppercase tracking-widest">{translateKey(key)}</span>
                                        <div className="text-xl font-black text-white">{score} <span className="text-sm font-bold text-slate-500">/ 50</span></div>
                                    </div>
                                    <div className="w-full h-2 bg-white/5 rounded-full overflow-hidden z-10 relative">
                                        <div 
                                            className="h-full bg-indigo-500 rounded-full transition-all duration-1000 shadow-[0_0_10px_rgba(99,102,241,0.5)]"
                                            style={{ width: `${(score / 50) * 100}%` }}
                                        />
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            )}
            
            {result.analysisType === 'DART' && (
                <div className="space-y-8">
                    <div className="bg-rose-500/5 border border-rose-500/10 rounded-[40px] p-6 sm:p-8 space-y-8">
                        <div className="flex justify-between items-center border-b border-white/5 pb-6">
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-rose-500/20 rounded-xl">
                                    <Target className="text-rose-400" size={22} />
                                </div>
                                <h4 className="text-xs font-black text-white uppercase tracking-[0.2em]">Hedef Formülü Raporu</h4>
                            </div>
                        </div>

                        <div className="bg-rose-500/10 rounded-3xl p-6 md:p-10 border border-rose-500/20">
                            <h3 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
                               <Sparkles className="text-rose-400" size={24} />
                               AI Eylem ve Strateji İçgörüsü
                            </h3>
                            <div className="prose prose-invert prose-rose max-w-none prose-headings:font-black prose-p:leading-relaxed prose-p:text-slate-300">
                               <Markdown>{result.data.insight}</Markdown>
                            </div>
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="bg-white/5 p-6 rounded-3xl border border-white/5">
                                <h4 className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2">Makro Hedef</h4>
                                <p className="text-white font-medium">{result.data.answers?.makro}</p>
                            </div>
                            <div className="bg-white/5 p-6 rounded-3xl border border-white/5">
                                <h4 className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2">Mikro Hedef (Bugün)</h4>
                                <p className="text-white font-medium">{result.data.answers?.mikro}</p>
                            </div>
                            <div className="bg-amber-500/10 p-6 rounded-3xl border border-amber-500/20 md:col-span-2">
                                <h4 className="text-[10px] font-black text-amber-500 uppercase tracking-widest mb-2">B Planı Stratejisi (WOOP)</h4>
                                <p className="text-amber-100 font-medium">Engel: {result.data.answers?.engel}</p>
                                <p className="text-amber-400 font-bold mt-2">Plan: {result.data.answers?.bPlan}</p>
                            </div>
                        </div>
                    </div>
                </div>
            )}
            
            {result.analysisType === 'DOPA' && (
                <div className="space-y-8">
                    <div className="bg-cyan-500/5 border border-cyan-500/10 rounded-[40px] p-6 sm:p-8 space-y-8">
                        <div className="flex justify-between items-center border-b border-white/5 pb-6">
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-cyan-500/20 rounded-xl">
                                    <Eye className="text-cyan-400" size={22} />
                                </div>
                                <h4 className="text-xs font-black text-white uppercase tracking-[0.2em]">Dikkat ve Odaklanma Raporu</h4>
                            </div>
                        </div>

                        <div className="bg-cyan-500/10 rounded-3xl p-6 md:p-10 border border-cyan-500/20">
                            <h3 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
                               <Sparkles className="text-cyan-400" size={24} />
                               AI Dikkat İçgörüsü
                            </h3>
                            <div className="prose prose-invert prose-cyan max-w-none prose-headings:font-black prose-p:leading-relaxed prose-p:text-slate-300">
                               <Markdown>{result.data.insight}</Markdown>
                            </div>
                        </div>
                    </div>
                </div>
            )}
            
            {result.analysisType === 'GTS-36' && (
                <div className="space-y-8">
                    <div className="bg-indigo-500/5 border border-indigo-500/10 rounded-[40px] p-6 sm:p-8 space-y-8">
                        <div className="flex justify-between items-center border-b border-white/5 pb-6">
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-indigo-500/20 rounded-xl">
                                    <Compass className="text-indigo-400" size={22} />
                                </div>
                                <h4 className="text-xs font-black text-white uppercase tracking-[0.2em]">Gelecek ve Tercih Raporu</h4>
                            </div>
                        </div>

                        <div className="bg-indigo-500/10 rounded-3xl p-6 md:p-10 border border-indigo-500/20">
                            <h3 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
                               <Sparkles className="text-indigo-400" size={24} />
                               AI Tercih Simülasyonu
                            </h3>
                            <div className="prose prose-invert prose-indigo max-w-none prose-headings:font-black prose-p:leading-relaxed prose-p:text-slate-300">
                               <Markdown>{result.data.insight}</Markdown>
                            </div>
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="bg-white/5 p-6 rounded-3xl border border-white/5">
                                <h4 className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2">Hedef Meslek</h4>
                                <p className="text-white font-medium">{result.data.answers?.targetProfession}</p>
                            </div>
                            <div className="bg-white/5 p-6 rounded-3xl border border-white/5">
                                <h4 className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2">Öğrenci Sırası</h4>
                                <p className="text-white font-medium">{result.data.answers?.studentRank}</p>
                            </div>
                            <div className="bg-white/5 p-6 rounded-3xl border border-white/5 md:col-span-2">
                                <h4 className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2">Risk Alanları</h4>
                                <div className="text-sm space-y-2 mt-2">
                                   <div className="flex gap-2">
                                        <span className="text-rose-400 font-bold shrink-0">Uçuş (%10):</span>
                                        <span className="text-slate-300">{result.data.answers?.flightZone}</span>
                                   </div>
                                   <div className="flex gap-2">
                                        <span className="text-blue-400 font-bold shrink-0">Gerçekçi (%50):</span>
                                        <span className="text-slate-300">{result.data.answers?.realisticZone}</span>
                                   </div>
                                   <div className="flex gap-2">
                                        <span className="text-emerald-400 font-bold shrink-0">Güvenlik (%40):</span>
                                        <span className="text-slate-300">{result.data.answers?.safetyZone}</span>
                                   </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {result.analysisType === 'IM-OM' && (
                <div className="space-y-8">
                    <div className="bg-rose-500/5 border border-rose-500/10 rounded-[40px] p-6 sm:p-8 space-y-8">
                        <div className="flex justify-between items-center border-b border-white/5 pb-6">
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-rose-500/20 rounded-xl">
                                    <Zap className="text-rose-400" size={22} />
                                </div>
                                <h4 className="text-xs font-black text-white uppercase tracking-[0.2em]">İçsel Motor Raporu</h4>
                            </div>
                        </div>

                        <div className="bg-rose-500/10 rounded-3xl p-6 md:p-10 border border-rose-500/20">
                            <h3 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
                               <Sparkles className="text-rose-400" size={24} />
                               AI Erteleme ve Motivasyon Analizi
                            </h3>
                            <div className="prose prose-invert prose-rose max-w-none prose-headings:font-black prose-p:leading-relaxed prose-p:text-slate-300">
                               <Markdown>{result.data.insight}</Markdown>
                            </div>
                        </div>

                        <div className="bg-white/5 p-6 rounded-3xl border border-white/5 text-center">
                            <h4 className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2">Erteleme Puanı</h4>
                            <p className="text-3xl font-black text-rose-400">{result.data.totalScore} <span className="text-sm font-bold text-slate-500 uppercase tracking-widest">/ 50</span></p>
                            <p className="text-sm text-slate-400 mt-2">
                                {result.data.totalScore >= 40 ? 'Motor Bozuk (Atalet Hali)' 
                                : result.data.totalScore >= 25 ? 'Marş Basmıyor (İteklemek Lazım)' 
                                : 'Motor Çalışıyor'}
                            </p>
                        </div>
                    </div>
                </div>
            )}
            
            {result.analysisType === 'K-E-A' && (
                <div className="space-y-8">
                    <div className="bg-cyan-500/5 border border-cyan-500/10 rounded-[40px] p-6 sm:p-8 space-y-8">
                        <div className="flex justify-between items-center border-b border-white/5 pb-6">
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-cyan-500/20 rounded-xl">
                                    <Snowflake className="text-cyan-400" size={22} />
                                </div>
                                <h4 className="text-xs font-black text-white uppercase tracking-[0.2em]">Kartopu Raporu</h4>
                            </div>
                        </div>

                        <div className="bg-cyan-500/10 rounded-3xl p-6 md:p-10 border border-cyan-500/20">
                            <h3 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
                               <Sparkles className="text-cyan-400" size={24} />
                               AI Alışkanlık Analizi
                            </h3>
                            <div className="prose prose-invert prose-cyan max-w-none prose-headings:font-black prose-p:leading-relaxed prose-p:text-slate-300">
                               <Markdown>{result.data.insight}</Markdown>
                            </div>
                        </div>

                        {result.data.answers && result.data.answers.subject && (
                            <div className="bg-slate-900/50 rounded-3xl p-6 md:p-8 border border-white/5 space-y-6">
                                <div className="flex items-center gap-3 mb-2">
                                    <Target className="text-cyan-400" size={24} />
                                    <h4 className="text-lg font-black text-white">Büyüme Planı</h4>
                                </div>
                                
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div className="bg-white/5 p-4 rounded-2xl border border-white/5">
                                        <div className="text-[10px] font-black text-cyan-400 uppercase tracking-widest mb-1">Ders</div>
                                        <div className="text-white font-bold">{result.data.answers.subject}</div>
                                    </div>
                                    <div className="bg-white/5 p-4 rounded-2xl border border-white/5">
                                        <div className="text-[10px] font-black text-cyan-400 uppercase tracking-widest mb-1">Mikro Görev (Çekirdek)</div>
                                        <div className="text-slate-300">{result.data.answers.microTask}</div>
                                    </div>
                                </div>

                                <div className="mt-8">
                                    <h5 className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-4">Kartopu Etkisi (7 Günlük İvme)</h5>
                                    <div className="flex flex-wrap gap-2 md:gap-4 relative items-center justify-between">
                                        {[
                                            { day: 1, val: result.data.answers.day1, label: 'Başlangıç' },
                                            { day: 2, val: result.data.answers.day2 },
                                            { day: 3, val: result.data.answers.day3 },
                                            { day: 4, val: result.data.answers.day4 },
                                            { day: 5, val: result.data.answers.day5 },
                                            { day: 6, val: result.data.answers.day6 },
                                            { day: 7, val: result.data.answers.day7, label: 'Zirve' }
                                        ].map((item, index) => (
                                            <div key={item.day} className="flex-1 min-w-[60px] flex flex-col items-center gap-2 group">
                                                <div className="text-[9px] font-bold text-slate-500 uppercase tracking-widest whitespace-nowrap">
                                                    {item.label || `${item.day}. Gün`}
                                                </div>
                                                <div 
                                                    className="w-full aspect-square rounded-full flex items-center justify-center font-black text-white relative transition-all duration-300"
                                                    style={{ 
                                                        backgroundColor: `rgba(6, 182, 212, ${0.1 + (index * 0.15)})`,
                                                        height: `${40 + (index * 10)}px`,
                                                        width: `${40 + (index * 10)}px`
                                                    }}
                                                >
                                                    {item.val}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            )}

            {result.analysisType === 'KOLB-DÖSE' && (
                <div className="space-y-8">
                    <div className="bg-fuchsia-500/5 border border-fuchsia-500/10 rounded-[40px] p-6 sm:p-8 space-y-8">
                        <div className="flex justify-between items-center border-b border-white/5 pb-6">
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-fuchsia-500/20 rounded-xl">
                                    <Puzzle className="text-fuchsia-400" size={22} />
                                </div>
                                <h4 className="text-xs font-black text-white uppercase tracking-[0.2em]">Öğrenme Stili Raporu</h4>
                            </div>
                        </div>

                        {result.data.resultsData && (
                            <div className="flex flex-col gap-4">
                                <div className="bg-white/5 p-6 rounded-3xl border border-white/5 text-center flex flex-col justify-center">
                                    <h4 className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">STİL PROFİLİ</h4>
                                    <p className="text-2xl font-black text-fuchsia-400">
                                        {result.data.resultsData.typeTitle}
                                    </p>
                                </div>
                                <div className="bg-white/5 p-6 rounded-3xl border border-white/5 text-center">
                                    <h4 className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-4">PUAN DAĞILIMI</h4>
                                    <div className="flex justify-center gap-6 text-sm font-bold text-slate-300">
                                        <div>SY: <span className="text-fuchsia-400">{result.data.resultsData.counts?.SY ?? 0}</span></div>
                                        <div>SK: <span className="text-fuchsia-400">{result.data.resultsData.counts?.SK ?? 0}</span></div>
                                        <div>YG: <span className="text-cyan-400">{result.data.resultsData.counts?.YG ?? 0}</span></div>
                                        <div>AY: <span className="text-cyan-400">{result.data.resultsData.counts?.AY ?? 0}</span></div>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            )}

            {result.analysisType === 'MERCEK' && (
                <div className="space-y-8">
                    <div className="bg-indigo-500/5 border border-indigo-500/10 rounded-[40px] p-6 sm:p-8 space-y-8">
                        <div className="flex justify-between items-center border-b border-white/5 pb-6">
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-indigo-500/20 rounded-xl">
                                    <Eye className="text-indigo-400" size={22} />
                                </div>
                                <h4 className="text-xs font-black text-white uppercase tracking-[0.2em]">Mercek Raporu</h4>
                            </div>
                            <div className="flex items-center gap-3 bg-indigo-500/10 px-4 py-2 rounded-2xl border border-indigo-500/20">
                                <span className="text-[10px] font-black text-slate-400 uppercase">Yük Azalması</span>
                                <span className="text-sm font-black text-indigo-400">-{ (result.data.form?.preScore || 0) - (result.data.form?.postScore || 0) } Puan</span>
                            </div>
                        </div>

                        <div className="bg-indigo-500/10 rounded-3xl p-6 md:p-10 border border-indigo-500/20 shadow-inner">
                            <h3 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
                               <Brain className="text-indigo-400" size={24} />
                               AI Bilişsel Analizi
                            </h3>
                            <div className="prose prose-invert prose-indigo max-w-none prose-headings:font-black prose-p:leading-relaxed prose-p:text-slate-300">
                               <Markdown>{result.insight || result.data.insight}</Markdown>
                            </div>
                        </div>

                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                            <div className="bg-white/5 p-4 rounded-2xl border border-white/5 text-center">
                                <p className="text-[9px] font-black text-slate-500 uppercase mb-1">Başlangıç</p>
                                <p className="text-xl font-black text-slate-300">{result.data.form?.preScore || 0}/10</p>
                            </div>
                            <div className="bg-white/5 p-4 rounded-2xl border border-white/5 text-center">
                                <p className="text-[9px] font-black text-slate-500 uppercase mb-1">Bitiş</p>
                                <p className="text-xl font-black text-emerald-400">{result.data.form?.postScore || 0}/10</p>
                            </div>
                            <div className="bg-white/5 p-4 rounded-2xl border border-white/5 text-center col-span-2">
                                <p className="text-[9px] font-black text-slate-500 uppercase mb-1">Ele Alınan Durum</p>
                                <p className="text-xs font-bold text-indigo-300 truncate px-2">{result.data.form?.problem || 'Belirtilmedi'}</p>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {result.analysisType === 'MÇ-ZP' && (
                <div className="space-y-8">
                    <div className="bg-yellow-500/5 border border-yellow-500/10 rounded-[40px] p-6 sm:p-8 space-y-8">
                        <div className="flex justify-between items-center border-b border-white/5 pb-6">
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-yellow-500/20 rounded-xl">
                                    <Zap className="text-yellow-400" size={22} />
                                </div>
                                <h4 className="text-xs font-black text-white uppercase tracking-[0.2em]">Özgüven Çemberi</h4>
                            </div>
                            <div className="flex items-center gap-2 bg-yellow-500/10 px-4 py-2 rounded-2xl border border-yellow-500/20">
                                <Sparkles size={14} className="text-yellow-400" />
                                <span className="text-[10px] font-black text-yellow-400 uppercase tracking-widest">{result.data.form?.neededEmotion?.label || 'Zirve Performans'}</span>
                            </div>
                        </div>

                        <div className="bg-yellow-500/10 rounded-3xl p-6 md:p-10 border border-yellow-500/20 shadow-xl">
                            <h3 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
                               <Sparkles className="text-yellow-400" size={24} />
                               AI Performans Analizi
                            </h3>
                            <div className="prose prose-invert prose-yellow max-w-none prose-headings:font-black prose-p:leading-relaxed prose-p:text-slate-300">
                               <Markdown>{result.insight || result.data.insight}</Markdown>
                            </div>
                        </div>

                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                            <div className="bg-white/5 p-4 rounded-2xl border border-white/5 text-center">
                                <p className="text-[9px] font-black text-slate-500 uppercase mb-1">Çember Rengi</p>
                                <div className="flex items-center justify-center gap-2">
                                    <div className={`w-3 h-3 rounded-full ${result.data.form?.circleColor?.class}`} />
                                    <p className="text-[11px] font-bold text-white">{result.data.form?.circleColor?.name}</p>
                                </div>
                            </div>
                            <div className="bg-white/5 p-4 rounded-2xl border border-white/5 text-center">
                                <p className="text-[9px] font-black text-slate-500 uppercase mb-1">Fiziksel Çapa</p>
                                <p className="text-xs font-bold text-yellow-400 uppercase tracking-widest">{result.data.form?.physicalAnchor || 'Belirtilmedi'}</p>
                            </div>
                            <div className="bg-white/5 p-4 rounded-2xl border border-white/5 text-center col-span-2 sm:col-span-1">
                                <p className="text-[9px] font-black text-slate-500 uppercase mb-1">Duygu Kaynağı</p>
                                <p className="text-xs font-bold text-slate-300">{result.data.form?.neededEmotion?.label}</p>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {result.analysisType === 'ÖTI-A' && (
                <div className="space-y-8">
                    <div className="bg-emerald-500/5 border border-emerald-500/10 rounded-[40px] p-6 sm:p-8 space-y-8">
                        <div className="flex justify-between items-center border-b border-white/5 pb-6">
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-emerald-500/20 rounded-xl">
                                    <BarChart3 className="text-emerald-400" size={22} />
                                </div>
                                <h4 className="text-xs font-black text-white uppercase tracking-[0.2em]">Stratejik Analiz Tablosu</h4>
                            </div>
                            <div className="flex items-center gap-2 bg-emerald-500/10 px-4 py-2 rounded-2xl border border-emerald-500/20">
                                <UserCheck size={14} className="text-emerald-400" />
                                <span className="text-[10px] font-black text-emerald-400 uppercase tracking-widest">ÖTI-A Baz Verisi</span>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                             <div className="bg-white/5 p-6 rounded-3xl border border-white/5 space-y-4">
                                <h5 className="text-[10px] font-black text-emerald-400 uppercase tracking-widest">Akademik Özet</h5>
                                <div className="space-y-3">
                                    <div className="flex justify-between text-sm">
                                        <span className="text-slate-500">Hedef:</span>
                                        <span className="text-white font-bold">{result.data.form?.academic?.target}</span>
                                    </div>
                                    <div className="flex justify-between text-sm">
                                        <span className="text-slate-500">Başarılı Ders:</span>
                                        <span className="text-white font-bold">{result.data.form?.academic?.favoriteDers}</span>
                                    </div>
                                    <div className="flex justify-between text-sm">
                                        <span className="text-slate-500">Zor Ders:</span>
                                        <span className="text-white font-bold">{result.data.form?.academic?.hardestDers}</span>
                                    </div>
                                </div>
                             </div>

                             <div className="bg-white/5 p-6 rounded-3xl border border-white/5 space-y-4">
                                <h5 className="text-[10px] font-black text-emerald-400 uppercase tracking-widest">Çalışma Disiplini</h5>
                                <div className="flex items-center gap-4">
                                    <div className="text-3xl font-black text-white">{result.data.behaviorScore || result.data.form?.behavior?.filter(Boolean).length || 0}/5</div>
                                    <div className="flex gap-1">
                                       {[1,2,3,4,5].map((star: any) => (
                                          <div key={star} className={`w-2 h-2 rounded-full ${star <= (result.data.behaviorScore || result.data.form?.behavior?.filter(Boolean).length || 0) ? 'bg-emerald-500' : 'bg-white/10'}`} />
                                       ))}
                                    </div>
                                </div>
                             </div>
                        </div>
                    </div>
                </div>
            )}

            {result.analysisType === 'OZ-AF' && (
                <div className="space-y-6">
                    <div className="flex items-center gap-6 p-8 bg-white/5 rounded-3xl border border-white/10">
                        <div className="w-20 h-20 bg-rose-500/20 rounded-2xl flex items-center justify-center text-rose-500">
                            <ShieldCheck size={40} />
                        </div>
                        <div className="text-center md:text-left">
                            <div className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">BASKIN TEPKİ</div>
                            <div className="text-3xl font-black text-white uppercase">{result.data.results?.dominantType}</div>
                        </div>
                    </div>
                    <div className="grid grid-cols-1 gap-3">
                        {[
                            { label: 'Volkan (Savaş)', value: result.data.results?.counts?.A, max: 6 },
                            { label: 'Buzdağı (Kaç/Don)', value: result.data.results?.counts?.B, max: 6 },
                            { label: 'Halterci (Yüktaşıma)', value: result.data.results?.counts?.C, max: 6 }
                        ].map(item => (
                            <div key={item.label} className="bg-white/5 p-4 rounded-2xl border border-white/5 flex items-center justify-between">
                                <span className="text-xs font-bold text-slate-300">{item.label}</span>
                                <div className="flex items-center gap-4">
                                    <div className="w-32 h-2 bg-white/5 rounded-full overflow-hidden">
                                        <div className="h-full bg-rose-500" style={{ width: `${(item.value / item.max) * 100}%` }} />
                                    </div>
                                    <span className="text-sm font-black text-white">{item.value}</span>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}
            
            {(result.analysisType === 'KLS' || result.analysisType === 'SZP-30' || result.analysisType === 'SS-DKM' || result.analysisType === 'ZG-ZP') && (
                <div className="space-y-8">
                    <div className="bg-amber-500/5 border border-amber-500/10 rounded-[40px] p-6 sm:p-8 space-y-8">
                        <div className="flex justify-between items-center border-b border-white/5 pb-6">
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-amber-500/20 rounded-xl">
                                    <Activity className="text-amber-400" size={22} />
                                </div>
                                <h4 className="text-xs font-black text-white uppercase tracking-[0.2em]">Puanlama Özeti</h4>
                            </div>
                        </div>
                        <div className="grid grid-cols-1 gap-4">
                            <div className="bg-white/5 p-8 rounded-3xl border border-white/5 text-center">
                                <div className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2">TOPLAM PUAN</div>
                                <div className="text-5xl font-black text-white">{result.data.totalScore ?? result.data.score ?? result.data.scores?.total}</div>
                                <div className="mt-4 text-sm font-bold text-amber-500">{result.data.profile || 'Analiz Edildi'}</div>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            <div className="bg-white/5 p-6 rounded-3xl border border-white/5 space-y-4">
                <h5 className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Analiz Özeti</h5>
                {result.analysisType === 'OZ-AF' ? (
                    <div className="space-y-3">
                        <div className="text-[11px] font-medium text-slate-400 whitespace-pre-wrap leading-relaxed">
                            <strong className="text-red-400">🛑 DUR: </strong> {result.data.traffic?.stop}
                        </div>
                        <div className="text-[11px] font-medium text-slate-400 whitespace-pre-wrap leading-relaxed">
                            <strong className="text-amber-400">🟡 BAŞLA: </strong> {result.data.traffic?.start}
                        </div>
                    </div>
                ) : (
                    <div className="text-[11px] font-medium text-slate-400 leading-relaxed italic">
                        Cevap anahtarı ve detaylı puanlama verileri kaydedilmiştir.
                    </div>
                )}
            </div>
          </div>

          {getParentFeedback() && (
            <div className="bg-indigo-500/5 border border-indigo-500/10 rounded-[32px] p-8 space-y-4">
               <div className="flex items-center gap-2 text-indigo-400">
                  <ShieldCheck size={18} />
                  <h4 className="text-xs font-black uppercase tracking-widest">Veli Bilgilendirme Notu</h4>
               </div>
               <p className="text-xs text-slate-400 font-medium leading-relaxed italic">
                  "{getParentFeedback()}"
               </p>
               <div className="pt-2">
                  <p className="text-[9px] text-slate-600 font-bold uppercase tracking-widest italic">
                    * Bu not koçun tarafından veline iletilecek şablonu temsil eder.
                  </p>
               </div>
            </div>
          )}
        </div>

        {/* Right: AI Analysis Report */}
        <div className="lg:col-span-2 space-y-6">
            <div className="bg-slate-900/50 backdrop-blur-xl border border-white/5 rounded-[32px] p-8 md:p-12 relative overflow-hidden">
                <div className="absolute top-0 right-0 p-8">
                    <Sparkle size={48} className="text-blue-500/10" />
                </div>
                
                <header className="flex items-center gap-3 mb-10 pb-6 border-b border-white/5">
                    <div className="w-10 h-10 rounded-xl bg-blue-500 flex items-center justify-center text-white shadow-lg shadow-blue-500/20">
                        <Sparkles size={20} />
                    </div>
                    <div className="space-y-0.5">
                        <h3 className="text-xl font-black text-white">Yapay Zeka Analiz Çıktısı</h3>
                        <p className="text-[10px] font-black text-blue-400 uppercase tracking-widest">ON Asistan Tarafından Üretildi</p>
                    </div>
                </header>

                {generatingAi ? (
                    <div className="space-y-8 animate-pulse">
                        <div className="h-4 bg-white/5 rounded-full w-3/4" />
                        <div className="space-y-3">
                            <div className="h-3 bg-white/5 rounded-full w-full" />
                            <div className="h-3 bg-white/5 rounded-full w-5/6" />
                            <div className="h-3 bg-white/5 rounded-full w-4/6" />
                        </div>
                        <div className="flex items-center gap-4">
                            <Loader2 className="animate-spin text-blue-500" />
                            <span className="text-sm font-bold text-slate-500">Zihinsel Model İşleniyor...</span>
                        </div>
                    </div>
                ) : (
                    <div className="prose prose-invert prose-slate max-w-none prose-headings:font-black prose-headings:tracking-tight prose-p:font-medium prose-p:leading-relaxed prose-p:text-slate-300">
                        <Markdown>{aiInsight}</Markdown>
                    </div>
                )}
            </div>
        </div>
      </div>
    </div>
  );
}
