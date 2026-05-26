import React from 'react';
import { 
  BarChart, 
  PieChart, 
  Target, 
  Filter, 
  ImageIcon, 
  Bot,
  AlertCircle,
  Sparkles,
  Search,
  BookOpen,
  Focus,
  Clock,
  Layers,
  LineChart
} from 'lucide-react';

export default function DeepAnalysis() {
  return (
    <div className="min-h-screen bg-slate-950 text-white pt-24 pb-12">
      {/* Hero Section */}
      <div className="px-6 md:px-12 text-center max-w-5xl mx-auto space-y-8 mb-20">
        <div className="inline-flex items-center gap-3 bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 px-6 py-3 rounded-full text-sm font-bold uppercase tracking-widest shadow-lg">
            <Search size={20} />
            <span>Türkiye'nin En Kapsamlı Sistemi</span>
        </div>
        <h1 className="text-5xl md:text-7xl font-black text-white tracking-tighter">
          Derin Deneme <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-indigo-500">Analizi</span>
        </h1>
        <p className="text-xl md:text-2xl text-slate-400 max-w-3xl mx-auto leading-relaxed">
          TYT ve AYT denemelerinizi sadece doğru-yanlış sayılarıyla değil; <br className="hidden md:block"/> 
          hatalarınızın kök nedenlerini bularak analiz ediyoruz.
        </p>
      </div>

      {/* ON Asistan Section */}
      <div className="max-w-6xl mx-auto px-6 mb-24">
        <div className="bg-slate-900 border border-indigo-500/30 rounded-3xl p-8 md:p-12 relative overflow-hidden flex flex-col md:flex-row items-center gap-8 shadow-2xl shadow-indigo-500/10 hover:border-indigo-500/50 transition-colors">
          <div className="absolute inset-0 bg-gradient-to-br from-indigo-600/10 to-purple-600/10 pointer-events-none"></div>
          
          <div className="w-24 h-24 md:w-32 md:h-32 bg-indigo-950 rounded-full flex items-center justify-center flex-shrink-0 border border-indigo-500/30 shadow-inner relative z-10">
            <Bot size={48} className="text-indigo-400 md:w-16 md:h-16" />
          </div>
          
          <div className="flex-1 z-10 text-center md:text-left">
            <div className="flex items-center justify-center md:justify-start gap-2 mb-4">
              <Sparkles className="text-amber-400" size={24} />
              <h3 className="text-2xl md:text-4xl font-black text-white">ON Asistan İle Tam Entegrasyon</h3>
            </div>
            <p className="text-indigo-100/80 text-lg md:text-xl leading-relaxed">
              Öğrencinin <strong>100 farklı verisine</strong> erişebilen yapay zeka asistanımız ON Asistan, 
              deneme analiz sonuçlarınızı da büyük veri havuzu ile çaprazlayarak okur. 
              Salt veriyi değil, sizin öğrenme haritanıza özel stratejileri ve 
              gözden kaçan detayları sizin için özetler.
            </p>
          </div>
        </div>
      </div>

      {/* Features Grid */}
      <div className="max-w-6xl mx-auto px-6 grid grid-cols-1 md:grid-cols-12 gap-6">
        
        {/* Feature 1 */}
        <div className="bg-slate-900 border border-white/5 rounded-3xl p-8 hover:border-blue-500/30 transition-colors md:col-span-7 group">
          <Filter className="text-blue-400 mb-6 group-hover:scale-110 transition-transform" size={40} />
          <h3 className="text-3xl font-black text-white mb-4">Detaylı Filtreleme Metrikleri</h3>
          <p className="text-slate-400 text-lg leading-relaxed">
            Sisteme girilen binlerce soruyu <strong>Tarih, Sınav Türü (TYT/AYT), Yayınevi, Ders, Konu, Kitapçık Türü ve Hata Türüne </strong> göre süzebilir, tam olarak incelemek istediğiniz performans aralığına odaklanabilirsiniz.
          </p>
        </div>

        {/* Feature 2 */}
        <div className="bg-slate-900 border border-white/5 rounded-3xl p-8 hover:border-pink-500/30 transition-colors md:col-span-5 group">
          <AlertCircle className="text-pink-400 mb-6 group-hover:scale-110 transition-transform" size={40} />
          <h3 className="text-3xl font-black text-white mb-4">Hatanın Anatomisi</h3>
          <p className="text-slate-400 text-lg leading-relaxed mb-4">
            Sadece "Yanlış" demiyoruz. Sistemimiz hatayı dört ana kategoriye ayırır:
          </p>
          <ul className="space-y-3 font-medium text-slate-300">
            <li className="flex items-center gap-3"><Clock size={18} className="text-amber-400"/> Zaman Yetmezliği</li>
            <li className="flex items-center gap-3"><BookOpen size={18} className="text-blue-400"/> Bilgi Eksikliği</li>
            <li className="flex items-center gap-3"><Focus size={18} className="text-emerald-400"/> Dikkat Hatası</li>
            <li className="flex items-center gap-3"><Layers size={18} className="text-purple-400"/> Soru Kalıp Eksikliği</li>
          </ul>
        </div>

        {/* Feature 3 */}
        <div className="bg-slate-900 border border-white/5 rounded-3xl p-8 hover:border-emerald-500/30 transition-colors md:col-span-4 group flex flex-col justify-between">
          <div>
            <Target className="text-emerald-400 mb-6 group-hover:scale-110 transition-transform" size={40} />
            <h3 className="text-2xl font-black text-white mb-3">Matris Raporlama</h3>
            <p className="text-slate-400 leading-relaxed mb-4">
              <strong>"Hangi konu neden hatalı?"</strong> ve <strong>"Kaçıncı soru neden eksik kaldı?"</strong> sorularına cevap veren detaylı çapraz tablolarla zayıf yönlerinizi keşfedin.
            </p>
          </div>
        </div>

        {/* Feature 4 */}
        <div className="bg-slate-900 border border-white/5 rounded-3xl p-8 hover:border-amber-500/30 transition-colors md:col-span-8 group">
          <ImageIcon className="text-amber-400 mb-6 group-hover:scale-110 transition-transform" size={40} />
          <h3 className="text-3xl font-black text-white mb-4">Görsel Hafıza Entegrasyonu</h3>
          <p className="text-slate-400 text-lg leading-relaxed">
            Hatalı yapılan veya boş bırakılan her sorunun ekran görüntüsü, hata tipi ve doğru cevabıyla birlikte sistemimizde arşivlenir. Geriye dönük soru tekrarları için büyük ve akıllı kişiselleştirilebilir bir soru bankasına sahip olursunuz.
          </p>
        </div>

        {/* Feature: Zero Error Booklet */}
        <div className="bg-slate-900 border border-white/5 rounded-3xl p-8 hover:border-cyan-500/30 transition-colors md:col-span-12 group flex flex-col md:flex-row items-center gap-8 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none -mr-32 -mt-32"></div>
          <div className="w-20 h-20 bg-slate-950 border border-cyan-500/20 rounded-2xl flex items-center justify-center flex-shrink-0 z-10">
            <BookOpen className="text-cyan-400 group-hover:scale-110 transition-transform" size={40} />
          </div>
          <div className="flex-1 z-10 text-center md:text-left">
            <h3 className="text-3xl font-black text-white mb-4">Sıfır Hata Kitapçığı <span className="text-cyan-400">(Kişiye Özel)</span></h3>
            <p className="text-slate-400 text-lg leading-relaxed">
              Arşivlenen hatalı ve boş sorularınızdan tamamen <strong>size özel "Sıfır Hata Kitapçıkları"</strong> oluşturuyoruz. 
              Sınavdan önce tüm eksiklerinizi tek bir fiziksel veya dijital denemeymiş gibi tekrar çözme imkanı bularak, bir daha aynı hatayı yapmama garantisi sağlıyoruz.
            </p>
          </div>
        </div>

        {/* Feature 5 */}
        <div className="bg-slate-900 border border-white/5 rounded-3xl p-8 hover:border-indigo-500/30 transition-colors md:col-span-12 group">
          <div className="flex items-center gap-4 mb-8">
            <LineChart className="text-indigo-400 group-hover:scale-110 transition-transform" size={40} />
            <h3 className="text-3xl font-black text-white">Akıllı Analiz Grafikleri ve Çapraz Tablolar</h3>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <div className="bg-slate-950 rounded-2xl p-6 border border-white/5">
              <h4 className="text-lg font-bold text-blue-400 mb-2">Makro Düzey Analizler</h4>
              <ul className="space-y-2 text-slate-400 text-sm list-disc list-inside">
                <li>Yayına Göre Doğru ve Yanlış Dağılımı</li>
                <li>Derse Göre Doğru ve Yanlış Dağılımı</li>
                <li>Alan Dağılımı (Sayısal, EA vb.)</li>
                <li>Kitapçık Türü (A/B) Dağılımı</li>
              </ul>
            </div>
            
            <div className="bg-slate-950 rounded-2xl p-6 border border-white/5">
              <h4 className="text-lg font-bold text-pink-400 mb-2">Mikro Hata Tespitleri</h4>
              <ul className="space-y-2 text-slate-400 text-sm list-disc list-inside">
                <li>Ders Göre Eksik Dağılımı</li>
                <li>Hata Dağılımı (Dikkat, Bilgi vb.)</li>
                <li>Konu Tamamlama Oranları</li>
                <li>Sorulan Soru Sayısına Göre Analiz</li>
              </ul>
            </div>

            <div className="bg-slate-950 rounded-2xl p-6 border border-white/5">
              <h4 className="text-lg font-bold text-emerald-400 mb-2">Matris ve Teşhis Tabloları</h4>
              <ul className="space-y-2 text-slate-400 text-sm list-disc list-inside">
                <li><strong>Hangi Konu Neden Hatalı?</strong> Tablosu</li>
                <li><strong>Kaçıncı Soru Neden Eksik Kaldı?</strong> Tablosu</li>
                <li>Yanlışlar Hangi Sorularda Dağılımı</li>
                <li>Görselli Deneme Analiz Arşivi</li>
              </ul>
            </div>
          </div>
          
          <p className="mt-8 text-center text-slate-400 max-w-4xl mx-auto leading-relaxed">
            Bu tablolar sayesinde; matematikte <strong>dikkat hatasını</strong> 15. sorularda mı yapıyorsunuz, yoksa Türkçe'de <strong>zaman yetmezliğinden</strong> mi paragraf kaçırıyorsunuz, hepsini istatistiksel bir kesinlikle ortaya koyuyoruz.
          </p>
        </div>

        {/* View Example Section */}
        <div className="md:col-span-12 mt-12 mb-8">
          <div className="bg-gradient-to-r from-indigo-500/20 to-purple-500/20 border border-indigo-500/30 rounded-3xl p-8 md:p-16 text-center">
            <h2 className="text-3xl md:text-5xl font-black text-white mb-6">Örneği İnceleyin</h2>
            <p className="text-lg md:text-xl text-indigo-200 mb-10 max-w-3xl mx-auto">
              Sistemimizin size sunacağı derin deneme analizi raporunun örnek bir çıktısını aşağıdan inceleyebilirsiniz. 
              Sınavlarınıza yönelik bu denli detaylı verilerle hedefinize nokta atışı ilerleyin.
            </p>
            
            <div className="bg-slate-950 rounded-2xl p-4 md:p-8 border border-white/10 shadow-2xl relative">
              <div className="mb-6 flex flex-col md:flex-row items-center justify-between bg-indigo-500/10 border border-indigo-500/20 p-4 rounded-xl text-left">
                <div className="flex items-center gap-3 text-indigo-300 mb-4 md:mb-0">
                  <AlertCircle size={24} className="flex-shrink-0" />
                  <span className="text-sm">PDF dosyaları bazen tarayıcıda doğrudan yüklenmeyebilir. </span>
                </div>
                <a href="/ornek-rapor.pdf" target="_blank" rel="noopener noreferrer" className="bg-indigo-500 hover:bg-indigo-600 text-white px-6 py-2.5 rounded-full font-bold transition-colors flex items-center gap-2 whitespace-nowrap">
                  Raporu Yeni Sekmede Aç
                </a>
              </div>
              
              <div className="w-full h-[800px] overflow-hidden rounded-xl bg-slate-900 border border-white/5 relative">
                 <iframe src="/ornek-rapor.pdf" className="w-full h-full border-0 absolute inset-0 bg-white" title="Örnek Deneme Analizi Raporu"></iframe> 
              </div>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
