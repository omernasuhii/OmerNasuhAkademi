import React from 'react';
import { BarChart3, Bell, BrainCircuit, CalendarDays, LineChart } from 'lucide-react';

export default function TrialTracking() {
  return (
    <div className="min-h-screen bg-slate-950 text-white p-6 md:p-12 space-y-16">
      <div className="max-w-6xl mx-auto space-y-6 text-center">
        <h1 className="text-4xl md:text-6xl font-black text-white tracking-tighter">
          Deneme Takibi ve Analiz Sistemi
        </h1>
        <p className="text-xl text-slate-400 max-w-2xl mx-auto">
          Öğrencilerimizin sınav hazırlık sürecini şeffaf, veriye dayalı ve sistematik bir şekilde yönetiyoruz.
        </p>
      </div>

      <div className="max-w-6xl mx-auto grid md:grid-cols-2 gap-8">
        <FeatureCard 
            icon={<BrainCircuit className="text-blue-400" size={32} />}
            title="Sistematik Veri Günlüğü"
            description="Öğrencinin girdiği tüm TYT, AYT ve YDT denemelerinin tarihi, yayın bilgisi ve netleri düzenli olarak veritabanımıza işleniyor. Böylece hiçbir veri kaybolmuyor veya gözden kaçmıyor."
        />
        <FeatureCard 
            icon={<LineChart className="text-emerald-400" size={32} />}
            title="Gelişim İvmesinin Görselleştirilmesi"
            description="Sadece tekil sınav sonuçlarına değil, geçmişten bugüne uzanan trende bakıyoruz. Öğrenci ve veli dashboard'larımızda bu netler bir gelişim eğrisi olarak listeleniyor; böylece genel düşüş veya yükseliş eğilimleri anında fark ediliyor."
        />
        <FeatureCard 
            icon={<Bell className="text-indigo-400" size={32} />}
            title="Otomatik Bildirim ve Şeffaflık"
            description="Yeni bir deneme verisi sisteme eklendiğinde WhatsApp entegrasyonumuz ile bilgilendirme sağlanıyor. Sonuçlar anlık olarak veli ve öğrenci bilgilendirme panellerine iletilerek sürecin tamamen şeffaf ve eşzamanlı yürümesi sağlanıyor."
        />
        <FeatureCard 
            icon={<CalendarDays className="text-amber-400" size={32} />}
            title="Frekans ve Takvim Denetimi"
            description="Öğrencinin belirlediğimiz çalışma rotasına ve sınav takvimine uygun sıklıkta deneme çözüp çözmediğini kronolojik olarak kontrol ediyoruz."
        />
        <FeatureCard 
            icon={<BarChart3 className="text-pink-400" size={32} />}
            title="Sadece Net Değil Sıralama Takibi"
            description="Sadece netlerine bakıp süreç analizi yapmıyoruz. YKS gibi sıralama sınavı olan bir süreçte katılımcı sayısını ve sıralamayı değerlendirerek yüzdelik dilim belirliyoruz."
        />
      </div>
    </div>
  );
}

function FeatureCard({ icon, title, description }: { icon: React.ReactNode, title: string, description: string }) {
    return (
        <div className="bg-slate-900 border border-white/10 rounded-3xl p-8 shadow-2xl flex flex-col items-center text-center space-y-4">
            <div className="p-4 bg-slate-950 rounded-2xl border border-white/5">
                {icon}
            </div>
            <h3 className="text-xl font-black text-white">{title}</h3>
            <p className="text-slate-400 text-sm">{description}</p>
        </div>
    );
}
