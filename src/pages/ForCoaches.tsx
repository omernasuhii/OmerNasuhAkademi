import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Link } from 'react-router-dom';
import {
  CalendarDays,
  TrendingUp,
  Bot,
  FileText,
  BookOpenCheck,
  Clock,
  ArrowRight,
  Sparkles,
  ShieldCheck,
  CheckCircle2,
  XCircle,
  GraduationCap,
  Users,
  MessageSquareShare,
  Layers,
  Award,
  ChevronRight,
  HelpCircle,
  Calculator,
  Smartphone,
  CreditCard,
  Check,
  Target,
  Zap,
  Lock,
  ChevronDown,
  Send,
  DollarSign
} from 'lucide-react';

export default function ForCoaches() {
  const [activeTab, setActiveTab] = useState<'program' | 'deneme' | 'ai' | 'veli' | 'odeme' | 'envanter' | 'kutuphane'>('program');
  const [studentCount, setStudentCount] = useState<number>(15);
  const [openFaq, setOpenFaq] = useState<number | null>(0);

  // Features detailed tabs
  const tabFeatures = {
    program: {
      title: "Haftalık Akıllı Programlama",
      subtitle: "Dakikalar İçinde Esnek & Korunan Çalışma Planları",
      badge: "Zaman Tasarrufu",
      badgeColor: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
      description:
        "Öğrencilerinize haftalık ders, konu, soru hedefi ve kaynak kitap blokları atayın. Taslak modunda çalışarak programı mükemmelleştirin ve tek tıkla öğrencinize yayınlayın. En önemlisi; öğrencinizin kendi eklediği bireysel çalışmalar sizin yaptığınız güncellemelerle asla silinmez veya kaybolmaz.",
      points: [
        "Sürükle-bırak & blok tabanlı haftalık program şablonları",
        "Öğrencinin kendi eklediği çalışmaları koruma algoritması (Protected Activities)",
        "Taslak (Draft) modu ile öğrenci görmeden önce rahatça planlama ve düzenleme",
        "YKS dersleri, konuları ve popüler kaynak kitaplarla tam entegrasyon",
        "Öğrencinin tamamlama durumlarını (Yapıldı / Yapılmadı / Eksik) renk kodlarıyla anlık izleme"
      ],
      previewStats: [
        { label: "Program Hazırlama", before: "45 dk", after: "5-7 dk" },
        { label: "Öğrenci Uyum Oranı", before: "%52", after: "%89" }
      ],
      mockPreview: (
        <div className="bg-slate-900/90 rounded-2xl border border-slate-800 p-5 shadow-2xl space-y-4">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse"></span>
              <span className="text-xs font-bold text-slate-300">Pazartesi Planı • Taslak Yayınlandı</span>
            </div>
            <span className="text-[11px] px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-semibold">
              3/4 Tamamlandı
            </span>
          </div>

          <div className="space-y-2 text-xs">
            <div className="p-3 rounded-xl bg-slate-800/80 border border-emerald-500/30 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <CheckCircle2 size={16} className="text-emerald-400 shrink-0" />
                <div>
                  <div className="font-semibold text-white">TYT Matematik - Fonksiyonlar</div>
                  <div className="text-[11px] text-slate-400">345 Yayınları • 60 Soru</div>
                </div>
              </div>
              <span className="text-[10px] text-emerald-400 bg-emerald-950/60 px-2 py-0.5 rounded font-mono">Yapıldı</span>
            </div>

            <div className="p-3 rounded-xl bg-slate-800/80 border border-emerald-500/30 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <CheckCircle2 size={16} className="text-emerald-400 shrink-0" />
                <div>
                  <div className="font-semibold text-white">TYT Türkçe - Paragrafta Yapı</div>
                  <div className="text-[11px] text-slate-400">Limit Kronometre • 40 Soru</div>
                </div>
              </div>
              <span className="text-[10px] text-emerald-400 bg-emerald-950/60 px-2 py-0.5 rounded font-mono">Yapıldı</span>
            </div>

            <div className="p-3 rounded-xl bg-slate-800/80 border border-blue-500/30 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-4 h-4 rounded-full border-2 border-blue-400 flex items-center justify-center text-[9px] text-blue-400">●</div>
                <div>
                  <div className="font-semibold text-white">AYT Fizik - Bağıl Hareket</div>
                  <div className="text-[11px] text-slate-400">Öğrenci Kendi Ekledi • Video + 30 Soru</div>
                </div>
              </div>
              <span className="text-[10px] text-blue-400 bg-blue-950/60 px-2 py-0.5 rounded font-mono">Öğrenci Notu</span>
            </div>
          </div>
        </div>
      )
    },
    deneme: {
      title: "Gelişmiş Deneme & Net Analiz Motoru",
      subtitle: "Öğrenci Sınavını Kaydeder, Koç Kök Nedenleri Anında Görür",
      badge: "Derin Analiz",
      badgeColor: "bg-blue-500/10 text-blue-400 border-blue-500/20",
      description:
        "Öğrencileriniz TYT, AYT (Sayısal, EA, Sözel, Dil) ve branş denemesi sonuçlarını kendi panellerinden saniyeler içinde sisteme girer. Koç olarak siz manuel veri girmekle vakit kaybetmezsiniz; sistem ders bazlı net artış/azalış eğrilerini, soru kaçan konuları ve kronik eksikleri anında koç panelinize döker.",
      points: [
        "Öğrencinin kendi girdiği TYT, AYT ve Branş denemelerini anlık inceleme",
        "Ders ve ünite kırılımlı hata/boş analiz tablosu (Derin Deneme Analizi)",
        "Öğrencinin kronik takıldığı konular için otomatik eksik listesi",
        "Koçluk seanslarında tek ekranda tüm sınav geçmişini ve net ivmesini kıyaslama",
        "Eksik tespit edilen konuları tek tıkla sonraki haftanın çalışma programına aktarma"
      ],
      previewStats: [
        { label: "Veri Girme Yükü", before: "Manuel", after: "0 dk (Öğrenci Girer)" },
        { label: "Eksik Tespit Hızı", before: "Günler", after: "Anında" }
      ],
      mockPreview: (
        <div className="bg-slate-900/90 rounded-2xl border border-slate-800 p-5 shadow-2xl space-y-4">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <div>
              <span className="text-xs font-bold text-white block">TYT Genel Deneme #14</span>
              <span className="text-[10px] text-slate-400">Öğrenci Tarafından Kaydedildi</span>
            </div>
            <div className="text-right">
              <span className="text-sm font-extrabold text-emerald-400 block">87.75 Net</span>
              <span className="text-[10px] text-emerald-300/80">▲ +4.25 Son Denemeye Göre</span>
            </div>
          </div>

          <div className="grid grid-cols-4 gap-2 text-center text-xs">
            <div className="bg-slate-800/60 p-2 rounded-xl border border-slate-700">
              <div className="text-[10px] text-slate-400">Türkçe</div>
              <div className="font-bold text-white text-sm">33.75</div>
            </div>
            <div className="bg-slate-800/60 p-2 rounded-xl border border-slate-700">
              <div className="text-[10px] text-slate-400">Matematik</div>
              <div className="font-bold text-white text-sm">28.50</div>
            </div>
            <div className="bg-slate-800/60 p-2 rounded-xl border border-slate-700">
              <div className="text-[10px] text-slate-400">Fen</div>
              <div className="font-bold text-white text-sm">14.25</div>
            </div>
            <div className="bg-slate-800/60 p-2 rounded-xl border border-slate-700">
              <div className="text-[10px] text-slate-400">Sosyal</div>
              <div className="font-bold text-white text-sm">11.25</div>
            </div>
          </div>

          <div className="bg-blue-500/10 border border-blue-500/20 rounded-xl p-2.5 text-[11px] text-blue-200 flex items-center gap-2">
            <Sparkles size={14} className="text-blue-400 shrink-0" />
            <span>Kritik Tespit: Geometri çemberde açı ve Fizik optik sorularında boş oranı yüksek.</span>
          </div>
        </div>
      )
    },
    ai: {
      title: "7/24 AI Asistan & Koç Denetim Paneli",
      subtitle: "Öğrencinin Yanındaki Yapay Zekâ, Koçun Kontrolünde",
      badge: "Yapay Zeka Gücü",
      badgeColor: "bg-purple-500/10 text-purple-400 border-purple-500/20",
      description:
        "Öğrenciniz 7/24 ON Asistan ile çalışma teknikleri, soru yaklaşımları veya program ayrıntıları hakkında konuşabilir. Koç olarak öğrencinin AI ile yaptığı tüm yazışmaları kendi panelinizden canlı ve şeffaf olarak izleyebilir, koçluk seanslarında öğrencinin gerçek ihtiyaçlarına doğrudan nokta atışı yapabilirsiniz.",
      points: [
        "Öğrencinin takıldığı noktalar ve çalışma tüyoları için 7/24 anlık rehberlik",
        "Koç panelinden öğrencinin AI sohbet geçmişini şeffaf şekilde izleme",
        "Koç Asistanı: Öğrencinin haftalık verilerini saniyeler içinde analiz eden yapay zekâ",
        "Ders çalışma motivasyonu, sınav kaygısı ve günlük soru stratejisi",
        "Öğrencinin AI ile iletişimini koç gözetimi altında güvenli tutma"
      ],
      previewStats: [
        { label: "Soru Yanıtlama", before: "Saatler", after: "7/24 Anında" },
        { label: "Gözlem Şeffaflığı", before: "%0", after: "%100" }
      ],
      mockPreview: (
        <div className="bg-slate-900/90 rounded-2xl border border-slate-800 p-5 shadow-2xl space-y-3">
          <div className="flex items-center justify-between border-b border-slate-800 pb-2.5">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded-full bg-purple-500/20 flex items-center justify-center text-purple-400">
                <Bot size={14} />
              </div>
              <span className="text-xs font-bold text-white">Canlı AI Sohbet Denetimi • Ali K.</span>
            </div>
            <span className="text-[10px] text-purple-400 bg-purple-950/60 px-2 py-0.5 rounded font-mono">Koç İzleme Modu</span>
          </div>

          <div className="space-y-2 text-xs">
            <div className="bg-slate-800/70 p-2.5 rounded-xl rounded-tl-none border border-slate-700/80 text-slate-200">
              <span className="text-[10px] text-slate-400 block font-semibold mb-0.5">Öğrenci (22:15):</span>
              Trigonometri yarım açı formüllerini ezberlemekte zorlanıyorum, nasıl pratik yapmalıyım?
            </div>
            <div className="bg-purple-950/40 p-2.5 rounded-xl rounded-tr-none border border-purple-500/30 text-purple-100">
              <span className="text-[10px] text-purple-300 block font-semibold mb-0.5 flex items-center gap-1">
                <Sparkles size={10} /> ON Asistan:
              </span>
              Formülleri toplam-fark formüllerinden türeterek mantığını kavrayabilirsin. Koçunun bu haftaki programına 30 soruluk odak testi eklemesini önerebilirim.
            </div>
          </div>
        </div>
      )
    },
    veli: {
      title: "Otomatik AI Veli Raporu & WhatsApp Koçluk Notu",
      subtitle: "Sistem Otomatik Gönderir, Koç Kendi WhatsApp'ından Tek Tıkla Notunu İletir",
      badge: "Veli Güveni",
      badgeColor: "bg-amber-500/10 text-amber-400 border-amber-500/20",
      description:
        "Haftalık yapay zekâ destekli veli bilgilendirme raporu sistem tarafından otomatik olarak hazırlanır ve veliye iletilir. Koçun saatlerce rapor yazmasına gerek kalmaz. Ayrıca koç, öğrencinin haftalık durumunu özetleyen AI destekli kişisel koçluk notunu tek tıkla kendi WhatsApp'ından veliye gönderebilir (bu bağlantı koçun kendisine de iletilir).",
      points: [
        "Sistem tarafından haftalık otomatik gönderilen yapay zekâ destekli veli raporu",
        "Koç için tek tıkla üretilen AI destekli haftalık koçluk değerlendirme notu",
        "Koçun kendi WhatsApp hattından veliye tek dokunuşla kişisel mesaj iletebilmesi",
        "Paylaşılan dijital karne ve rapor bağlantısının koçun kendisine de otomatik iletilmesi",
        "Velilerin öğrenci gelişimini ve soru sayılarını şeffafça izleyebilmesi"
      ],
      previewStats: [
        { label: "Veli Raporlama Eforu", before: "30 dk / veli", after: "Otomatik Sistem" },
        { label: "Veli Memnuniyet Skoru", before: "7.2 / 10", after: "9.8 / 10" }
      ],
      mockPreview: (
        <div className="bg-slate-900/90 rounded-2xl border border-slate-800 p-5 shadow-2xl space-y-3">
          <div className="flex items-center justify-between border-b border-slate-800 pb-2.5">
            <div className="flex items-center gap-2">
              <FileText size={16} className="text-amber-400" />
              <span className="text-xs font-bold text-white">Otomatik Veli Raporu & Koç Notu</span>
            </div>
            <span className="text-[10px] text-amber-400 bg-amber-950/60 px-2 py-0.5 rounded font-mono">Sistem Otomatik İletti</span>
          </div>

          <div className="grid grid-cols-3 gap-2 text-center text-xs">
            <div className="bg-slate-800/80 p-2 rounded-lg border border-slate-700">
              <div className="text-[10px] text-slate-400">Çözülen Soru</div>
              <div className="font-bold text-white text-sm">1,240</div>
            </div>
            <div className="bg-slate-800/80 p-2 rounded-lg border border-slate-700">
              <div className="text-[10px] text-slate-400">Program Uyumu</div>
              <div className="font-bold text-emerald-400 text-sm">%92</div>
            </div>
            <div className="bg-slate-800/80 p-2 rounded-lg border border-slate-700">
              <div className="text-[10px] text-slate-400">Son Deneme</div>
              <div className="font-bold text-blue-400 text-sm">91.5 Net</div>
            </div>
          </div>

          <div className="text-[11px] text-slate-300 bg-slate-800/60 p-2.5 rounded-xl border border-slate-700">
            <div className="flex items-center justify-between mb-1">
              <span className="text-amber-400 font-semibold">AI Koçluk Notu (WhatsApp Hazır):</span>
              <span className="text-[9px] text-slate-400">Koça da İletildi</span>
            </div>
            "Öğrencimiz bu hafta geometri ve paragraf hedeflerini %92 başarıyla tamamladı. Gelecek hafta AYT Fen ağırlıklı ilerleyeceğiz."
          </div>
        </div>
      )
    },
    odeme: {
      title: "Öğrenci Ödeme Takibi & Otomatik Veli WhatsApp Hatırlatmaları",
      subtitle: "Para Konusunu Kafanıza Takmayın, Sistem 5 ve 1 Gün Önceden Veliye Otomatik İletir",
      badge: "Finansal Kolaylık",
      badgeColor: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
      description:
        "Öğrencileriniz koçluk ücretini doğrudan size (koçuna) öder. Sistemde her öğrencinin ödeme planını, periyodunu ve kalan bakiyesini tek ekranda görürsünüz. Ödeme vadesinden 5 gün ve 1 gün önce sistem veliye otomatik olarak WhatsApp hatırlatma mesajı gönderir; koç olarak para isteme veya takip stresi yaşamazsınız.",
      points: [
        "Öğrenciden FocusON asla ücret almaz; ödeme doğrudan koçun hesabına yapılır",
        "Öğrenci bazlı ödeme günü, taksit tutarı ve bakiye durumu takibi",
        "Ödeme vadesinden 5 gün ve 1 gün önce veliye otomatik gönderilen WhatsApp hatırlatma mesajları",
        "Koçların para isteme veya hesap tutma çekincesini tamamen ortadan kaldıran kurumsal otomasyon",
        "Gelir, tahsilat ve yaklaşan vadeleri gösteren sade finans özeti"
      ],
      previewStats: [
        { label: "Ödeme Takip Stresi", before: "Yüksek", after: "%0 Sıfır Stres" },
        { label: "Tahsilat Takibi", before: "Gecikmeli", after: "Zamanında & Düzenli" }
      ],
      mockPreview: (
        <div className="bg-slate-900/90 rounded-2xl border border-slate-800 p-5 shadow-2xl space-y-3">
          <div className="flex items-center justify-between border-b border-slate-800 pb-2.5">
            <div className="flex items-center gap-2">
              <CreditCard size={16} className="text-emerald-400" />
              <span className="text-xs font-bold text-white">Ödeme & Tahsilat Takip Paneli</span>
            </div>
            <span className="text-[10px] text-emerald-400 bg-emerald-950/60 px-2 py-0.5 rounded font-mono">Doğrudan Koça Ödenir</span>
          </div>

          <div className="space-y-2 text-xs">
            <div className="bg-slate-800/80 p-2.5 rounded-xl border border-emerald-500/30 flex justify-between items-center">
              <div>
                <div className="font-semibold text-white">Zeynep K. • Aylık Koçluk</div>
                <div className="text-[10px] text-emerald-400">Ödendi • 15 Mart</div>
              </div>
              <span className="text-emerald-400 font-bold bg-emerald-950/60 px-2 py-0.5 rounded text-[11px]">Tamamlandı</span>
            </div>

            <div className="bg-slate-800/80 p-2.5 rounded-xl border border-blue-500/30 flex flex-col sm:flex-row justify-between sm:items-center gap-2">
              <div>
                <div className="font-semibold text-white">Burak T. • Aylık Koçluk</div>
                <div className="text-[10px] text-blue-400">Vadeye 5 Gün Kaldı</div>
              </div>
              <span className="text-blue-300 font-medium bg-blue-950/60 border border-blue-500/30 px-2 py-1 rounded-lg text-[10px] flex items-center gap-1 w-fit">
                <Check size={10} className="text-blue-400 shrink-0" />
                <span>5 Gün Önce Veliye Otomatik İletildi</span>
              </span>
            </div>
          </div>
        </div>
      )
    },
    envanter: {
      title: "30+ Bilimsel Kişilik & Öğrenme Stili Envanteri",
      subtitle: "Öğrencinizi Bilimsel Testlerle Tanıyın, Kişiye Özel Koçluk Yapın",
      badge: "Bilimsel Altyapı",
      badgeColor: "bg-rose-500/10 text-rose-400 border-rose-500/20",
      description:
        "VAK (Görsel-İşitsel-Kinestetik), Kolb Öğrenme Stili, Sınav Kaygısı Ölçeği, Zaman Yönetimi Matrisi, ÇABA Testi ve SWOT Analizi gibi 30'dan fazla akademik envanteri öğrencilerinize uygulayın. Sonuçlar otomatik olarak koç paneline görsel analiz raporu olarak yansısın.",
      points: [
        "VAK Öğrenme Stili, Kolb, SWOT Analizi, ÇABA Testi ve Sınav Kaygısı Ölçeği",
        "Öğrencinin beynine ve öğrenme hızına en uygun ders çalışma tekniğini belirleme",
        "Otomatik puanlama ve anında görsel kişilik / öğrenme profili üretimi",
        "Koçluk görüşmelerinde kanıta dayalı ve bilimsel rehberlik sunma",
        "Öğrencinin güçlü ve geliştirilmesi gereken yönlerini tek bakışta görme"
      ],
      previewStats: [
        { label: "Envanter Kütüphanesi", before: "2-3 Test", after: "30+ Bilimsel Test" },
        { label: "Raporlama Eforu", before: "Manuel", after: "Otomatik" }
      ],
      mockPreview: (
        <div className="bg-slate-900/90 rounded-2xl border border-slate-800 p-5 shadow-2xl space-y-3">
          <div className="flex items-center justify-between border-b border-slate-800 pb-2.5">
            <span className="text-xs font-bold text-white">VAK Öğrenme Stili Analizi</span>
            <span className="text-[10px] text-rose-400 bg-rose-950/60 px-2 py-0.5 rounded font-mono">Baskın: Görsel</span>
          </div>

          <div className="space-y-2">
            <div>
              <div className="flex justify-between text-[11px] mb-1">
                <span className="text-slate-300">Görsel Öğrenme</span>
                <span className="text-rose-400 font-bold">%58</span>
              </div>
              <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
                <div className="bg-rose-500 h-full rounded-full w-[58%]"></div>
              </div>
            </div>
            <div>
              <div className="flex justify-between text-[11px] mb-1">
                <span className="text-slate-300">İşitsel Öğrenme</span>
                <span className="text-blue-400 font-bold">%26</span>
              </div>
              <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
                <div className="bg-blue-500 h-full rounded-full w-[26%]"></div>
              </div>
            </div>
            <div>
              <div className="flex justify-between text-[11px] mb-1">
                <span className="text-slate-300">Kinestetik / Dokunsal</span>
                <span className="text-amber-400 font-bold">%16</span>
              </div>
              <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
                <div className="bg-amber-500 h-full rounded-full w-[16%]"></div>
              </div>
            </div>
          </div>
        </div>
      )
    },
    kutuphane: {
      title: "Geniş YKS Müfredat & Kaynak Kitap Havuzu",
      subtitle: "TYT, AYT ve YDT Tüm Dersler, Konular ve Kitaplar Hazır",
      badge: "YKS Odaklı Arşiv",
      badgeColor: "bg-cyan-500/10 text-cyan-400 border-cyan-500/20",
      description:
        "MEB ve ÖSYM güncel YKS müfredatındaki tüm ders, ünite ve alt başlıklar sistemde hazırdır. Yüzlerce popüler YKS yayınevinin soru bankaları, test adetleri ve soru sayıları entegre şekilde gelir; tek tek konu ve kaynak yazmakla vakit kaybetmezsiniz.",
      points: [
        "MEB ve ÖSYM güncel YKS kazanım haritası (TYT, AYT Sayısal/EA/Sözel, YDT)",
        "Popüler YKS kaynak kitap havuzu ve hazır soru dağılımları",
        "Öğrencinin hangi kitaptan kaçıncı testte olduğunu tek bakışta izleme",
        "Kanal ve video ders öneri listeleri ile zenginleştirilmiş çalışma planı",
        "Kişiselleştirilebilir özel kaynak ve ödev tanımlama esnekliği"
      ],
      previewStats: [
        { label: "Müfredat Kapsamı", before: "Manuel", after: "Eksiksiz YKS" },
        { label: "Kaynak Tanımlama", before: "15 dk", after: "10 sn" }
      ],
      mockPreview: (
        <div className="bg-slate-900/90 rounded-2xl border border-slate-800 p-5 shadow-2xl space-y-3">
          <div className="flex items-center justify-between border-b border-slate-800 pb-2.5">
            <span className="text-xs font-bold text-white">YKS Kaynak Kitap Takip Havuzu</span>
            <span className="text-[10px] text-cyan-400 bg-cyan-950/60 px-2 py-0.5 rounded font-mono">12 Kitap Aktif</span>
          </div>

          <div className="space-y-2 text-xs">
            <div className="bg-slate-800/80 p-2.5 rounded-xl border border-slate-700 flex justify-between items-center">
              <div>
                <div className="font-semibold text-white">345 TYT Matematik</div>
                <div className="text-[11px] text-slate-400">Test 42 / 78 • %54 Tamamlandı</div>
              </div>
              <div className="text-cyan-400 font-bold">1,450 / 2,680 Soru</div>
            </div>

            <div className="bg-slate-800/80 p-2.5 rounded-xl border border-slate-700 flex justify-between items-center">
              <div>
                <div className="font-semibold text-white">3D AYT Fizik Soru Bankası</div>
                <div className="text-[11px] text-slate-400">Test 18 / 60 • %30 Tamamlandı</div>
              </div>
              <div className="text-cyan-400 font-bold">540 / 1,800 Soru</div>
            </div>
          </div>
        </div>
      )
    }
  };

  // Comparison items
  const comparisonItems = [
    {
      feature: "Haftalık Program Oluşturma",
      traditional: "Kâğıt, PDF veya formülü bozulan Excel tabloları (her öğrenciye 40-50 dk)",
      focuson: "Sürükle-bırak akıllı şablonlar, öğrencinin kendi çalışmalarını koruyan yapı (5-7 dk)"
    },
    {
      feature: "Deneme & Net Takibi",
      traditional: "WhatsApp'tan atılan fotoğrafları koçun tek tek hesaplaması",
      focuson: "Öğrenci sınavını sisteme girer; koç anında derin konu ve hata analizini inceler"
    },
    {
      feature: "Veli İletişimi & Raporlama",
      traditional: "Haftalık uzun telefon aramaları veya manuel karne hazırlama",
      focuson: "Sistem haftalık otomatik AI veli raporu iletir; koç tek tıkla WhatsApp koçluk notunu atar"
    },
    {
      feature: "Öğrenci Ödeme & Muhasebe Takibi",
      traditional: "Ajandada alacak takibi, veliye para isteme mesajı yazma çekincesi",
      focuson: "Ödeme doğrudan koça yapılır; sistem 5 ve 1 gün önce veliye otomatik WhatsApp hatırlatması iletir"
    },
    {
      feature: "Yapay Zekâ Entegrasyonu",
      traditional: "Yok veya öğrencinin kontrolsüz dış kaynaklar kullanması",
      focuson: "7/24 ON Asistan + Koçun tüm AI sohbetlerini kendi panelinden şeffafça canlı izlemesi"
    },
    {
      feature: "Öğrenci Yönetim Kapasitesi",
      traditional: "Maksimum 10-15 öğrenci sonrası tükenmişlik ve takip hataları",
      focuson: "30 - 50+ öğrenciyi sıfır kafa karışıklığı ve yüksek kaliteyle profesyonelce yönetebilme"
    },
    {
      feature: "Kişilik & Öğrenme Stili Analizi",
      traditional: "Fotokopi testler ve manuel hesaplamalar",
      focuson: "30+ bilimsel envanter (VAK, Kolb, Sınav Kaygısı vb.) tek tıkla dijital rapora dönüşür"
    }
  ];

  // FAQ items - strictly aligned with platform & pricing model
  const faqs = [
    {
      q: "Öğrencilerimden herhangi bir ücret alınıyor mu? Para akışı nasıl çalışır?",
      a: "Hayır! FocusON olarak öğrenciden KESİNLİKLE hiçbir ücret talep etmeyiz. Öğrencileriniz koçluk ücretini doğrudan size (koçuna) kendi aranızda belirlediğiniz yöntemle öder. FocusON, yalnızca koçu sistemde aktif olarak abonelik alan öğrenci sayısı üzerinden (abonelik paketine göre) son derece uygun bir platform lisans bedeliyle ücretlendirir."
    },
    {
      q: "Deneme sonuçlarını koç mu girer, öğrenci mi?",
      a: "Deneme sonuçlarını öğrenci kendi paneline girer. Koçların manuel deneme sonucu girmekle vakit kaybetmesini istemiyoruz. Öğrenci denemesini girdiği anda, koç panelinde ders, ünite ve konu bazlı hata analizi ve net artış grafikleri otomatik olarak hazır olur."
    },
    {
      q: "Haftalık veli raporları nasıl gönderilir? Koçun tek tek rapor yazması gerekir mi?",
      a: "Hayır. Haftalık yapay zekâ destekli veli bilgilendirme raporu sistem tarafından otomatik olarak hazırlanır ve gönderilir. Ayrıca koç, sistemin ürettiği haftalık koçluk değerlendirme notunu tek tıkla kendi kişisel WhatsApp'ından da veliye gönderebilir. Bu rapor bağlantısı aynı zamanda arşivlenmesi için koçun kendisine de iletilir."
    },
    {
      q: "Öğrenci ödemelerini sistem üzerinden nasıl takip ederim?",
      a: "Koç panelinizde her öğrencinizin ödeme günü, taksit tutarı ve tahsilat durumu listelenir. Ödeme vadesinden 5 gün ve 1 gün önce sistem veliye otomatik olarak kibar ve kurumsal bir WhatsApp hatırlatma mesajı iletir. Böylece koç olarak velilerden para isteme veya vadesi yaklaşan ödemeleri hatırlatma çekincesi yaşamazsınız; tüm ödemeler doğrudan sizin hesabınıza yapılır."
    },
    {
      q: "Ben program hazırladıktan sonra öğrencim programa kendi çalışmasını eklerse ne olur?",
      a: "FocusON'un özel 'Protected Activities' algoritması sayesinde, öğrencilerin kendi eklediği çalışmalar ve notlar korunur. Siz koç olarak yeni bir görev eklediğinizde veya haftayı güncellediğinizde öğrencinin kendi girdiği emekler asla silinmez veya ezilmez."
    },
    {
      q: "FocusON şu anda hangi sınavları ve müfredatları kapsıyor?",
      a: "Sistemimiz şu an YKS (TYT, AYT Sayısal, Eşit Ağırlık, Sözel ve YDT) sınavlarına %100 odaklıdır. MEB ve ÖSYM'nin en güncel kazanım listesi ile yüzlerce popüler YKS yayınevinin soru bankaları sisteme eksiksiz tanımlıdır (LGS modülü şu an aktif değildir)."
    },
    {
      q: "Öğrencilerimin ve velilerimin verilerini başka koçlar veya kurumlar görebilir mi?",
      a: "Kesinlikle hayır. Her koçun veritabanı alanı ve öğrenci portföyü tamamen kendine özel ve şifrelidir. Öğrencileriniz yalnızca sizin panelinizde listelenir ve sizin onayınız olmadan hiçbir veriye dışarıdan erişilemez."
    },
    {
      q: "Koç başvurusu yaptıktan sonra süreç nasıl işler?",
      a: "Başvuru formunu doldurduktan sonra eğitim danışmanımız sizinle WhatsApp veya telefon üzerinden 15 dakika içinde iletişime geçer. Sistemin canlı demosu gösterilir, koç hesabınız aktif edilir ve dakikalar içinde öğrencilerinizi ekleyip programlamaya başlayabilirsiniz."
    }
  ];

  // Interactive Calculator logic
  const savedHoursPerWeek = Math.round(studentCount * 1.4);
  const potentialCapacity = studentCount * 3;
  const reportingTimeSaved = Math.round((studentCount * 25) / 60);

  return (
    <div className="min-h-screen bg-slate-950 text-white pt-24 pb-20 selection:bg-emerald-500 selection:text-slate-950">
      {/* Background Decorative Glows */}
      <div className="fixed top-1/4 left-1/2 -translate-x-1/2 w-[800px] h-[450px] bg-emerald-500/10 blur-[160px] rounded-full pointer-events-none -z-10" />
      <div className="fixed bottom-10 right-10 w-[500px] h-[350px] bg-blue-500/10 blur-[140px] rounded-full pointer-events-none -z-10" />

      {/* Hero Section */}
      <div className="max-w-7xl mx-auto px-4 md:px-12 text-center pt-8 pb-16 md:pb-24">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="space-y-6 max-w-4xl mx-auto"
        >
          <div className="inline-flex items-center gap-2.5 px-4 py-2 bg-emerald-500/10 border border-emerald-500/25 rounded-full shadow-lg shadow-emerald-500/10">
            <GraduationCap className="text-emerald-400" size={18} />
            <span className="text-xs md:text-sm font-bold text-emerald-400 uppercase tracking-widest">
              YKS Koçları & Rehberler İçin Yeni Nesil Altyapı
            </span>
          </div>

          <h1 className="text-3xl sm:text-5xl md:text-6xl lg:text-7xl font-black tracking-tight text-white leading-[1.15]">
            Öğrencilerinizi <br className="hidden sm:inline" />
            <span className="bg-clip-text text-transparent bg-gradient-to-r from-emerald-400 via-teal-300 to-blue-400">
              FocusON Altyapısıyla
            </span>{" "}
            Zirveye Taşıyın
          </h1>

          <p className="text-base sm:text-xl text-slate-300 max-w-3xl mx-auto leading-relaxed">
            Dağınık WhatsApp mesajları, formülü bozulan Excel tabloları ve kaybolan kâğıt programlara son. 
            Haftalık akıllı planlama, derin deneme analizi, otomatik veli raporları, ödeme takibi ve 7/24 AI denetimini 
            tek bir profesyonel panelden yönetin.
          </p>

          {/* Action CTAs */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
            <Link
              to="/koc-basvuru"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-3 px-8 py-4 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-base transition-all shadow-xl shadow-emerald-500/25 hover:shadow-emerald-500/40 hover:-translate-y-0.5"
            >
              <span>Hemen Koç Başvurusu Yap</span>
              <ArrowRight size={18} />
            </Link>

            <a
              href="https://wa.me/905432073748?text=Merhaba,%20FocusON%20Akademi%20koçluk%20altyapısı%20hakkında%20detaylı%20bilgi%20ve%20demo%20almak%20istiyorum."
              target="_blank"
              rel="noreferrer"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2.5 px-7 py-4 rounded-xl bg-white/5 hover:bg-white/10 text-white border border-white/10 font-semibold text-base transition-all"
            >
              <MessageSquareShare size={18} className="text-emerald-400" />
              <span>WhatsApp Demo & Danışma</span>
            </a>
          </div>

          {/* Trust Badges */}
          <div className="pt-8 flex flex-wrap items-center justify-center gap-6 text-xs sm:text-sm text-slate-400">
            <div className="flex items-center gap-2">
              <ShieldCheck size={18} className="text-emerald-400" />
              <span>%100 İzole Koç Portföyü</span>
            </div>
            <div className="flex items-center gap-2">
              <DollarSign size={18} className="text-emerald-400" />
              <span>Öğrenci Doğrudan Koça Öder</span>
            </div>
            <div className="flex items-center gap-2">
              <Smartphone size={18} className="text-emerald-400" />
              <span>Mobil & Masaüstü Tam Uyum</span>
            </div>
          </div>
        </motion.div>
      </div>

      {/* Core Stats Overview */}
      <div className="max-w-7xl mx-auto px-4 md:px-12 mb-20">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
          <div className="bg-slate-900/60 border border-slate-800/80 rounded-2xl p-6 text-center hover:border-emerald-500/30 transition-colors">
            <div className="text-3xl md:text-4xl font-black text-emerald-400 mb-1">%70+</div>
            <div className="text-sm font-semibold text-white mb-1">Zaman Tasarrufu</div>
            <div className="text-xs text-slate-400">Manuel program ve tablo yükünden kurtulun</div>
          </div>
          <div className="bg-slate-900/60 border border-slate-800/80 rounded-2xl p-6 text-center hover:border-blue-500/30 transition-colors">
            <div className="text-3xl md:text-4xl font-black text-blue-400 mb-1">3x</div>
            <div className="text-sm font-semibold text-white mb-1">Öğrenci Kapasitesi</div>
            <div className="text-xs text-slate-400">Aynı eforla 3 kat daha fazla öğrenci yönetin</div>
          </div>
          <div className="bg-slate-900/60 border border-slate-800/80 rounded-2xl p-6 text-center hover:border-purple-500/30 transition-colors">
            <div className="text-3xl md:text-4xl font-black text-purple-400 mb-1">7/24</div>
            <div className="text-sm font-semibold text-white mb-1">AI Asistan Desteği</div>
            <div className="text-xs text-slate-400">Öğrencinin her an yanında olan yapay zekâ</div>
          </div>
          <div className="bg-slate-900/60 border border-slate-800/80 rounded-2xl p-6 text-center hover:border-amber-500/30 transition-colors">
            <div className="text-3xl md:text-4xl font-black text-amber-400 mb-1">%100</div>
            <div className="text-sm font-semibold text-white mb-1">Otomatik Veli Raporu</div>
            <div className="text-xs text-slate-400">Sistem otomatik gönderir, koç notu iletir</div>
          </div>
        </div>
      </div>

      {/* Interactive Feature Explorer Tabs */}
      <div className="max-w-7xl mx-auto px-4 md:px-12 mb-28">
        <div className="text-center max-w-3xl mx-auto mb-12">
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-emerald-500/10 border border-emerald-500/20 rounded-full mb-3">
            <Layers className="text-emerald-400" size={14} />
            <span className="text-xs font-bold text-emerald-400 uppercase tracking-wider">Modül Keşfi</span>
          </div>
          <h2 className="text-2xl sm:text-4xl font-extrabold text-white">
            FocusON Koçluk Platformunda Neler Var?
          </h2>
          <p className="text-sm md:text-base text-slate-400 mt-3">
            Eğitim koçluğunun tüm operasyonel ve finansal adımlarını kapsayan modülleri keşfedin.
          </p>
        </div>

        {/* Tab Buttons - 2-Column Compact Grid on Mobile & Balanced Wrap on Desktop */}
        <div className="grid grid-cols-2 sm:flex sm:flex-wrap items-stretch sm:items-center justify-center gap-2 sm:gap-2.5 max-w-5xl mx-auto mb-8 sm:mb-10">
          <button
            onClick={() => setActiveTab('program')}
            className={`flex items-center justify-center sm:justify-start gap-2 px-3 sm:px-4 py-2.5 sm:py-3 rounded-xl text-[11px] sm:text-sm font-semibold transition-all text-center sm:text-left ${
              activeTab === 'program'
                ? 'bg-emerald-500 text-slate-950 shadow-lg shadow-emerald-500/25 font-bold scale-[1.02]'
                : 'bg-slate-900/90 text-slate-300 hover:bg-slate-800 hover:text-white border border-slate-800'
            }`}
          >
            <CalendarDays size={15} className={`shrink-0 ${activeTab === 'program' ? 'text-slate-950' : 'text-emerald-400'}`} />
            <span className="truncate">Akıllı Programlama</span>
          </button>

          <button
            onClick={() => setActiveTab('deneme')}
            className={`flex items-center justify-center sm:justify-start gap-2 px-3 sm:px-4 py-2.5 sm:py-3 rounded-xl text-[11px] sm:text-sm font-semibold transition-all text-center sm:text-left ${
              activeTab === 'deneme'
                ? 'bg-blue-500 text-white shadow-lg shadow-blue-500/25 font-bold scale-[1.02]'
                : 'bg-slate-900/90 text-slate-300 hover:bg-slate-800 hover:text-white border border-slate-800'
            }`}
          >
            <TrendingUp size={15} className={`shrink-0 ${activeTab === 'deneme' ? 'text-white' : 'text-blue-400'}`} />
            <span className="truncate">Deneme & Net Analizi</span>
          </button>

          <button
            onClick={() => setActiveTab('ai')}
            className={`flex items-center justify-center sm:justify-start gap-2 px-3 sm:px-4 py-2.5 sm:py-3 rounded-xl text-[11px] sm:text-sm font-semibold transition-all text-center sm:text-left ${
              activeTab === 'ai'
                ? 'bg-purple-500 text-white shadow-lg shadow-purple-500/25 font-bold scale-[1.02]'
                : 'bg-slate-900/90 text-slate-300 hover:bg-slate-800 hover:text-white border border-slate-800'
            }`}
          >
            <Bot size={15} className={`shrink-0 ${activeTab === 'ai' ? 'text-white' : 'text-purple-400'}`} />
            <span className="truncate">7/24 AI Asistan</span>
          </button>

          <button
            onClick={() => setActiveTab('veli')}
            className={`flex items-center justify-center sm:justify-start gap-2 px-3 sm:px-4 py-2.5 sm:py-3 rounded-xl text-[11px] sm:text-sm font-semibold transition-all text-center sm:text-left ${
              activeTab === 'veli'
                ? 'bg-amber-500 text-slate-950 shadow-lg shadow-amber-500/25 font-bold scale-[1.02]'
                : 'bg-slate-900/90 text-slate-300 hover:bg-slate-800 hover:text-white border border-slate-800'
            }`}
          >
            <FileText size={15} className={`shrink-0 ${activeTab === 'veli' ? 'text-slate-950' : 'text-amber-400'}`} />
            <span className="truncate">Veli Raporu & Koç Notu</span>
          </button>

          <button
            onClick={() => setActiveTab('odeme')}
            className={`flex items-center justify-center sm:justify-start gap-2 px-3 sm:px-4 py-2.5 sm:py-3 rounded-xl text-[11px] sm:text-sm font-semibold transition-all text-center sm:text-left ${
              activeTab === 'odeme'
                ? 'bg-emerald-400 text-slate-950 shadow-lg shadow-emerald-400/25 font-bold scale-[1.02]'
                : 'bg-slate-900/90 text-slate-300 hover:bg-slate-800 hover:text-white border border-slate-800'
            }`}
          >
            <CreditCard size={15} className={`shrink-0 ${activeTab === 'odeme' ? 'text-slate-950' : 'text-emerald-400'}`} />
            <span className="truncate">Ödeme & Veli Takibi</span>
          </button>

          <button
            onClick={() => setActiveTab('envanter')}
            className={`flex items-center justify-center sm:justify-start gap-2 px-3 sm:px-4 py-2.5 sm:py-3 rounded-xl text-[11px] sm:text-sm font-semibold transition-all text-center sm:text-left ${
              activeTab === 'envanter'
                ? 'bg-rose-500 text-white shadow-lg shadow-rose-500/25 font-bold scale-[1.02]'
                : 'bg-slate-900/90 text-slate-300 hover:bg-slate-800 hover:text-white border border-slate-800'
            }`}
          >
            <Target size={15} className={`shrink-0 ${activeTab === 'envanter' ? 'text-white' : 'text-rose-400'}`} />
            <span className="truncate">30+ Kişilik Envanteri</span>
          </button>

          <button
            onClick={() => setActiveTab('kutuphane')}
            className={`col-span-2 sm:col-span-1 flex items-center justify-center sm:justify-start gap-2 px-3 sm:px-4 py-2.5 sm:py-3 rounded-xl text-[11px] sm:text-sm font-semibold transition-all text-center sm:text-left ${
              activeTab === 'kutuphane'
                ? 'bg-cyan-500 text-slate-950 shadow-lg shadow-cyan-500/25 font-bold scale-[1.02]'
                : 'bg-slate-900/90 text-slate-300 hover:bg-slate-800 hover:text-white border border-slate-800'
            }`}
          >
            <BookOpenCheck size={15} className={`shrink-0 ${activeTab === 'kutuphane' ? 'text-slate-950' : 'text-cyan-400'}`} />
            <span className="truncate">YKS Müfredatı & Kitaplar</span>
          </button>
        </div>

        {/* Tab Content Card */}
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -15 }}
            transition={{ duration: 0.3 }}
            className="bg-slate-900/80 border border-slate-800 rounded-3xl p-6 md:p-10 shadow-2xl"
          >
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
              {/* Left Details */}
              <div className="lg:col-span-7 space-y-5">
                <div className="flex items-center gap-3">
                  <span className={`text-xs font-bold px-3 py-1 rounded-full border ${tabFeatures[activeTab].badgeColor}`}>
                    {tabFeatures[activeTab].badge}
                  </span>
                  <span className="text-xs text-slate-400 font-medium">Koç Yönetim Modülü</span>
                </div>

                <h3 className="text-2xl sm:text-3xl font-extrabold text-white">
                  {tabFeatures[activeTab].title}
                </h3>
                <p className="text-sm font-semibold text-emerald-400/90">
                  {tabFeatures[activeTab].subtitle}
                </p>

                <p className="text-slate-300 text-sm md:text-base leading-relaxed">
                  {tabFeatures[activeTab].description}
                </p>

                <div className="space-y-2.5 pt-2">
                  {tabFeatures[activeTab].points.map((pt, idx) => (
                    <div key={idx} className="flex items-start gap-2.5 text-xs sm:text-sm text-slate-300">
                      <CheckCircle2 size={16} className="text-emerald-400 shrink-0 mt-0.5" />
                      <span>{pt}</span>
                    </div>
                  ))}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 sm:gap-4 pt-4 border-t border-slate-800">
                  {tabFeatures[activeTab].previewStats.map((stat, idx) => (
                    <div key={idx} className="bg-slate-950/70 p-3 sm:p-3.5 rounded-xl border border-slate-800/90 flex flex-col justify-between">
                      <div className="text-[11px] font-medium text-slate-400 mb-1.5">{stat.label}</div>
                      <div className="flex flex-wrap items-center gap-1.5 text-xs">
                        <span className="text-[11px] line-through text-slate-500 bg-slate-900/80 px-1.5 py-0.5 rounded border border-slate-800/80 shrink-0">
                          {stat.before}
                        </span>
                        <ArrowRight size={12} className="text-emerald-400 shrink-0" />
                        <span className="text-xs sm:text-sm font-extrabold text-emerald-400 bg-emerald-950/40 px-1.5 py-0.5 rounded border border-emerald-500/20">
                          {stat.after}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Right Mock UI */}
              <div className="lg:col-span-5">
                {tabFeatures[activeTab].mockPreview}
              </div>
            </div>
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Comparison Table: Traditional vs FocusON */}
      <div className="max-w-7xl mx-auto px-4 md:px-12 mb-28">
        <div className="text-center max-w-3xl mx-auto mb-12">
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-blue-500/10 border border-blue-500/20 rounded-full mb-3">
            <Zap className="text-blue-400" size={14} />
            <span className="text-xs font-bold text-blue-400 uppercase tracking-wider">Farkımız</span>
          </div>
          <h2 className="text-2xl sm:text-4xl font-extrabold text-white">
            Geleneksel Koçluk Yöntemleri vs. FocusON
          </h2>
          <p className="text-sm md:text-base text-slate-400 mt-3">
            Manuel iş yüklerinden sıyrılıp gerçek rehberliğe nasıl odaklanacağınızı görün.
          </p>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse bg-slate-900/60 border border-slate-800 rounded-2xl overflow-hidden">
            <thead>
              <tr className="border-b border-slate-800 bg-slate-900/90 text-xs md:text-sm font-bold uppercase tracking-wider">
                <th className="py-4 px-6 text-slate-300 w-1/4">Özellik / Süreç</th>
                <th className="py-4 px-6 text-rose-400/90 w-3/8 bg-rose-950/20 border-r border-slate-800">
                  Geleneksel / Manuel Yöntem
                </th>
                <th className="py-4 px-6 text-emerald-400 w-3/8 bg-emerald-950/20">
                  FocusON Koçluk Altyapısı
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 text-xs md:text-sm">
              {comparisonItems.map((item, idx) => (
                <tr key={idx} className="hover:bg-slate-800/30 transition-colors">
                  <td className="py-4 px-6 font-semibold text-white">{item.feature}</td>
                  <td className="py-4 px-6 text-slate-400 bg-rose-950/10 border-r border-slate-800">
                    <div className="flex items-start gap-2">
                      <XCircle size={16} className="text-rose-400 shrink-0 mt-0.5" />
                      <span>{item.traditional}</span>
                    </div>
                  </td>
                  <td className="py-4 px-6 text-emerald-300 bg-emerald-950/10 font-medium">
                    <div className="flex items-start gap-2">
                      <CheckCircle2 size={16} className="text-emerald-400 shrink-0 mt-0.5" />
                      <span>{item.focuson}</span>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Coach Workflow - Step by Step */}
      <div className="max-w-7xl mx-auto px-4 md:px-12 mb-28">
        <div className="text-center max-w-3xl mx-auto mb-14">
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-purple-500/10 border border-purple-500/20 rounded-full mb-3">
            <Clock className="text-purple-400" size={14} />
            <span className="text-xs font-bold text-purple-400 uppercase tracking-wider">İş Akışı</span>
          </div>
          <h2 className="text-2xl sm:text-4xl font-extrabold text-white">
            FocusON ile Bir Koçun Haftası Nasıl Geçer?
          </h2>
          <p className="text-sm md:text-base text-slate-400 mt-3">
            Öğrenci kaydından deneme analizine ve ödeme takibine 5 kolay adımda kusursuz yönetim.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          <div className="bg-slate-900/70 border border-slate-800 p-5 rounded-2xl relative space-y-3">
            <div className="w-8 h-8 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-black text-sm border border-emerald-500/30">
              1
            </div>
            <h4 className="font-bold text-white text-base">Öğrenci & Hedef Tanımlama</h4>
            <p className="text-xs text-slate-400 leading-relaxed">
              Öğrenciyi panelinize ekleyin; hedef YKS sıralamasını, alanını ve başlangıç seviyesini belirleyin.
            </p>
          </div>

          <div className="bg-slate-900/70 border border-slate-800 p-5 rounded-2xl relative space-y-3">
            <div className="w-8 h-8 rounded-xl bg-blue-500/20 text-blue-400 flex items-center justify-center font-black text-sm border border-blue-500/30">
              2
            </div>
            <h4 className="font-bold text-white text-base">Haftalık Plan Hazırlama</h4>
            <p className="text-xs text-slate-400 leading-relaxed">
              Hazır YKS kaynak kitap havuzundan 5 dakikada haftalık ders, konu ve soru hedeflerini atayın.
            </p>
          </div>

          <div className="bg-slate-900/70 border border-slate-800 p-5 rounded-2xl relative space-y-3">
            <div className="w-8 h-8 rounded-xl bg-purple-500/20 text-purple-400 flex items-center justify-center font-black text-sm border border-purple-500/30">
              3
            </div>
            <h4 className="font-bold text-white text-base">Canlı İlerleme & AI Denetimi</h4>
            <p className="text-xs text-slate-400 leading-relaxed">
              Öğrencinin bitirdiği görevleri görün; 7/24 AI asistanla yaptığı sohbetleri panelden şeffafça izleyin.
            </p>
          </div>

          <div className="bg-slate-900/70 border border-slate-800 p-5 rounded-2xl relative space-y-3">
            <div className="w-8 h-8 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center font-black text-sm border border-amber-500/30">
              4
            </div>
            <h4 className="font-bold text-white text-base">Öğrencinin Deneme Analizi</h4>
            <p className="text-xs text-slate-400 leading-relaxed">
              Öğrencinin girdiği denemenin derin hata tablosunu inceleyin; boş bırakılan konuları sonraki haftaya ekleyin.
            </p>
          </div>

          <div className="bg-slate-900/70 border border-slate-800 p-5 rounded-2xl relative space-y-3">
            <div className="w-8 h-8 rounded-xl bg-rose-500/20 text-rose-400 flex items-center justify-center font-black text-sm border border-rose-500/30">
              5
            </div>
            <h4 className="font-bold text-white text-base">Otomatik Rapor & Ödeme Takibi</h4>
            <p className="text-xs text-slate-400 leading-relaxed">
              Sistem veli raporunu otomatik iletir; koç tek tıkla kendi WhatsApp notunu atar ve ödeme takvimini izler.
            </p>
          </div>
        </div>
      </div>

      {/* Interactive Time & Capacity Calculator */}
      <div className="max-w-5xl mx-auto px-4 md:px-12 mb-28">
        <div className="bg-gradient-to-br from-slate-900 via-slate-900/90 to-emerald-950/40 border border-emerald-500/30 rounded-3xl p-6 md:p-10 shadow-2xl">
          <div className="text-center max-w-2xl mx-auto mb-8">
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-emerald-500/10 border border-emerald-500/20 rounded-full mb-3">
              <Calculator className="text-emerald-400" size={14} />
              <span className="text-xs font-bold text-emerald-400 uppercase tracking-wider">Tasarruf Hesaplayıcı</span>
            </div>
            <h3 className="text-2xl sm:text-3xl font-extrabold text-white">
              FocusON Size Ne Kadar Zaman Kazandırır?
            </h3>
            <p className="text-xs sm:text-sm text-slate-300 mt-2">
              Öğrenci sayınızı kaydırarak haftalık tasarruf edeceğiniz zamanı ve büyüme potansiyelinizi hesaplayın.
            </p>
          </div>

          <div className="space-y-6 max-w-xl mx-auto mb-8">
            <div className="flex items-center justify-between text-sm font-semibold">
              <span className="text-slate-300">Aktif / Hedeflenen Öğrenci Sayısı:</span>
              <span className="text-xl font-extrabold text-emerald-400 bg-emerald-950/60 px-4 py-1 rounded-xl border border-emerald-500/30 font-mono">
                {studentCount} Öğrenci
              </span>
            </div>

            <input
              type="range"
              min="5"
              max="60"
              step="1"
              value={studentCount}
              onChange={(e) => setStudentCount(Number(e.target.value))}
              className="w-full h-2.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-emerald-400"
            />
            <div className="flex justify-between text-[11px] text-slate-500 font-mono">
              <span>5 Öğrenci</span>
              <span>30 Öğrenci</span>
              <span>60 Öğrenci</span>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-center">
            <div className="bg-slate-950/70 p-4 rounded-2xl border border-slate-800">
              <div className="text-2xl sm:text-3xl font-black text-emerald-400 mb-1">
                ~{savedHoursPerWeek} Saat
              </div>
              <div className="text-xs font-semibold text-white">Haftalık Kazanılan Zaman</div>
              <div className="text-[10px] text-slate-400 mt-1">Excel & manuel takip yerine</div>
            </div>

            <div className="bg-slate-950/70 p-4 rounded-2xl border border-slate-800">
              <div className="text-2xl sm:text-3xl font-black text-blue-400 mb-1">
                {potentialCapacity}+ Öğrenci
              </div>
              <div className="text-xs font-semibold text-white">Yönetebileceğiniz Kapasite</div>
              <div className="text-[10px] text-slate-400 mt-1">Aynı efor ve yüksek kaliteyle</div>
            </div>

            <div className="bg-slate-950/70 p-4 rounded-2xl border border-slate-800">
              <div className="text-2xl sm:text-3xl font-black text-amber-400 mb-1">
                ~{reportingTimeSaved} Saat
              </div>
              <div className="text-xs font-semibold text-white">Veli Raporlama Tasarrufu</div>
              <div className="text-[10px] text-slate-400 mt-1">Sistemin otomatik raporları sayesinde</div>
            </div>
          </div>
        </div>
      </div>

      {/* Frequently Asked Questions */}
      <div className="max-w-4xl mx-auto px-4 md:px-12 mb-28">
        <div className="text-center max-w-2xl mx-auto mb-12">
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-slate-800 border border-slate-700 rounded-full mb-3">
            <HelpCircle className="text-emerald-400" size={14} />
            <span className="text-xs font-bold text-emerald-400 uppercase tracking-wider">Merak Edilenler</span>
          </div>
          <h2 className="text-2xl sm:text-4xl font-extrabold text-white">
            Koçlar İçin Sıkça Sorulan Sorular
          </h2>
        </div>

        <div className="space-y-3">
          {faqs.map((faq, idx) => (
            <div
              key={idx}
              className="bg-slate-900/70 border border-slate-800 rounded-2xl overflow-hidden transition-colors"
            >
              <button
                onClick={() => setOpenFaq(openFaq === idx ? null : idx)}
                className="w-full py-4 px-6 text-left flex items-center justify-between gap-4 font-semibold text-sm md:text-base text-white hover:text-emerald-400 transition-colors"
              >
                <span>{faq.q}</span>
                <ChevronDown
                  size={18}
                  className={`text-slate-400 shrink-0 transition-transform ${
                    openFaq === idx ? 'rotate-180 text-emerald-400' : ''
                  }`}
                />
              </button>

              {openFaq === idx && (
                <div className="px-6 pb-4 pt-1 text-xs md:text-sm text-slate-300 leading-relaxed border-t border-slate-800/60">
                  {faq.a}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Final Action CTA Block */}
      <div className="max-w-7xl mx-auto px-4 md:px-12">
        <div className="bg-gradient-to-r from-emerald-950/80 via-slate-900 to-blue-950/80 border border-emerald-500/30 rounded-3xl p-8 md:p-14 text-center relative overflow-hidden shadow-2xl">
          <div className="max-w-3xl mx-auto space-y-6 relative z-10">
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-emerald-500/10 border border-emerald-500/25 rounded-full">
              <Sparkles className="text-emerald-400" size={14} />
              <span className="text-xs font-bold text-emerald-400 uppercase tracking-widest">
                Aramıza Katılın
              </span>
            </div>

            <h2 className="text-2xl sm:text-4xl md:text-5xl font-black text-white tracking-tight">
              Öğrencilerinize Profesyonel Bir Koçluk Deneyimi Yaşatın
            </h2>

            <p className="text-sm md:text-lg text-slate-300 max-w-2xl mx-auto leading-relaxed">
              FocusON altyapısını hemen deneyimlemek için başvuru formunu doldurun veya WhatsApp hattımızdan canlı demo talep edin.
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
              <Link
                to="/koc-basvuru"
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2.5 px-8 py-4 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-base transition-all shadow-xl shadow-emerald-500/25 hover:shadow-emerald-500/40"
              >
                <span>Hemen Koç Başvurusu Yap</span>
                <ArrowRight size={18} />
              </Link>

              <a
                href="https://wa.me/905432073748?text=Merhaba,%20FocusON%20Akademi%20koçluk%20altyapısı%20hakkında%20bilgi%20almak%20ve%20ücretsiz%20demo%20incelemek%20istiyorum."
                target="_blank"
                rel="noreferrer"
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-7 py-4 rounded-xl bg-white/5 hover:bg-white/10 text-white border border-white/10 font-semibold text-base transition-all"
              >
                <MessageSquareShare size={18} className="text-emerald-400" />
                <span>0543 207 37 48 • WhatsApp Hattı</span>
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
