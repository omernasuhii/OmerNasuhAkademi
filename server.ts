import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import { fileURLToPath } from "url";
import { GoogleGenAI, Type } from "@google/genai";
import dotenv from "dotenv";

const __filename = (typeof import.meta !== 'undefined' && import.meta.url) 
  ? fileURLToPath(import.meta.url) 
  : path.join(process.cwd(), 'server.ts');
const __dirname = path.dirname(__filename);

// Load environment variables from .env file
dotenv.config();

// Gemini configurations Helper
function getGeminiClient() {
  const apiKey = process.env.ASSISTAN_API_KEY;
  if (!apiKey) {
    console.error("[Gemini Client] Error: ASSISTAN_API_KEY is not defined in environment variables!");
    throw new Error("API_KEY_MISSING");
  }
  return new GoogleGenAI({
    apiKey: apiKey,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      }
    }
  });
}

function getModelName(defaultDevModel: string) {
  if (defaultDevModel.includes("flash")) {
    return "gemini-3.5-flash";
  } else {
    return "gemini-3.5-flash"; // Default to flash to prevent errors unless pro is specifically required
  }
}

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // API routes can go here later
  app.get("/api/health", (req, res) => {
    res.json({ status: "ok" });
  });

  app.post("/api/student-assistant", async (req, res) => {
    try {
      const { history, userContext } = req.body;
      if (!history || !Array.isArray(history)) {
        return res.status(400).json({ error: "History is required" });
      }

      const ai = getGeminiClient();
      
      const systemInstruction = `Sen Ömer Nasuh Akademi'nin yapay zeka eğitim asistanısın. Öğrencilere hedeflerine ulaşmaları için empatik, profesyonel ve stratejik rehberlik sağlarsın.
Şu anki öğrencinin bilgileri:
- Adı Soyadı: ${userContext?.firstName || ''} ${userContext?.lastName || ''}
- Sınıfı: ${userContext?.class || 'Belirtilmemiş'}
- Hedefi: ${userContext?.goal || 'Belirtilmemiş'}

Görevlerinden biri, öğrencinin akademik sürecini (çalışma programlarını, bitirdiği kitapları, görev tamamlama oranlarını vb.) analiz edip tavsiyeler vermektir. Öğrenci planları veya kitap takibi durumu hakkında detaylı bir analiz, ilerleme durumu veya tavsiye istediğinde "get_student_academic_data" aracını çağır ve oradan dönen veriyi (günlük çalışma planları, rutinleri, okuduğu kitapları/denemeleri vb.) detaylıca analiz et.

Öğrencinin randevularını yönetebilirsin. Eğer öğrenci randevu almak, mevcut randevularını listelemek veya iptal etmek isterse kullanabilecegin araçları (function_calling) kullan. Randevu iptal kurallarına dikkat et (kalan son 3 saat kala iptal edilemez vs. bu kuralları sen belirleyip öğrenciye aktar. Sadece uygunsa aracı çağır). Yeni randevu alırken mutlaka koçun müsait saatlerini saat saat isteyebileceğin aracı kullan ve ordan dönen saate göre randevu oluştur.

Bu bilgileri dikkate alarak öğrenciyle doğrudan konuş, akademik hedeflerini destekle, program önerileri yap, ve YKS vb. konularda destek ol. Kısa ve öz, cesaretlendirici cevaplar ver. Asla gereksiz bilgi yüklemesi yapma, hep bir rehber gibi yaklaş.`;

      // Define Tools
      const tools = [{
        functionDeclarations: [
          {
            name: "get_appointments",
            description: "Öğrencinin mevcut veya geçmiş tüm randevularını getirir.",
          },
          {
            name: "get_student_academic_data",
            description: "Öğrencinin Koçluk sayfasındaki tüm akademik verilerini (günlük planlar, görevler, kitap takip listeleri, rutinler, tamamlama oranları ve denemeler) getirir. Bu aracı kullanarak öğrencinin çalışma durumu hakkında detaylı analiz yapabilirsin."
          },
          {
            name: "get_coach_schedule",
            description: "Belirtilen koçun (veya öğrenciye atanan koçun) haftalık programını ve müsaitlik durumunu getirir.",
            parameters: {
              type: Type.OBJECT,
              properties: {
                coachId: { type: Type.STRING, description: "Koçun ID'si. Eğer bilinmiyorsa boş bırakılabilir, sistem atanmış koçunkini getirir." }
              }
            }
          },
          {
            name: "book_appointment",
            description: "Öğrenci için yeni bir randevu oluşturur.",
            parameters: {
              type: Type.OBJECT,
              properties: {
                date: { type: Type.STRING, description: "YYYY-MM-DD formatında randevu tarihi" },
                startTime: { type: Type.STRING, description: "HH:mm formatında randevu başlangıç saati" },
                topic: { type: Type.STRING, description: "Görüşme konusu veya talep edilen hizmet (ör: Birebir Matematik Dersi)" }
              },
              required: ["date", "startTime", "topic"]
            }
          },
          {
            name: "start_booking_wizard",
            description: "Öğrenci randevu almak istediğinde kullanıcıya UI üzerinden test tarzında randevu alma ekranı (Randevu tipi, hizmet, eğitmen, gün, saat seçimi) başlatır. Öğrenci koçtan ders vs almak istediğini söylediğinde doğrudan bu asistan ekranını başlat.",
          },
          {
            name: "cancel_appointment",
            description: "Öğrencinin belirtilen kimlik numaralı (ID) randevusunu iptal eder.",
            parameters: {
              type: Type.OBJECT,
              properties: {
                appointmentId: { type: Type.STRING, description: "İptal edilecek randevunun ID'si" }
              },
              required: ["appointmentId"]
            }
          }
        ]
      }];

      // Format previous messages for chat history. 
      // Handle function calls and responses in history if they exist.
      const formattedHistory = history.map(msg => {
        if (msg.role === 'function' || msg.functionResponse) {
          return {
            role: 'user',
            parts: [{ functionResponse: { name: msg.name, response: msg.functionResponse, id: msg.id } }]
          };
        }
        if (msg.functionCalls) {
          return {
            role: 'model',
            parts: msg.functionCalls.map(fc => ({ functionCall: { name: fc.name, args: fc.args, id: fc.id } }))
          };
        }
        return {
          role: msg.role === 'model' ? 'model' : 'user',
          parts: [{ text: msg.content }]
        };
      });
      
      const modelName = getModelName("gemini-3.5-flash");
      const chat = ai.chats.create({
        model: modelName,
        config: { systemInstruction, tools },
        history: formattedHistory.slice(0, -1) // Exclude the last message
      });

      const response = await chat.sendMessage({
        message: history[history.length - 1].content
      });

      if (response.functionCalls && response.functionCalls.length > 0) {
        return res.json({ 
          functionCalls: response.functionCalls.map(fc => ({ name: fc.name, args: fc.args, id: fc.id })),
          text: response.text || '' // Include any conversational text returned
        });
      }

      res.json({ text: response.text });
    } catch (error: any) {
      console.error("Gemini AI Assistant Error:", error);
      let message = "Asistan servisi şu an kullanılamıyor.";
      
      const errStr = typeof error === 'string' ? error : (error?.message || JSON.stringify(error) || '');
      
      if (errStr === "API_KEY_MISSING") {
        message = "Asistan API Anahtarı eksik. Lütfen uygulamanın ayarlarından (Secrets bölümünden) ASSISTAN_API_KEY değerini ekleyin.";
      } else if (errStr.includes("NOT_FOUND") || errStr.includes("not found")) {
        message = "AI Modeli bulunamadı veya erişiminiz yok. Model adlarını ve API yetkilerinizi kontrol edin.";
      } else if (errStr.includes("RESOURCE_EXHAUSTED") || errStr.includes("429")) {
        message = "Gemini API kota limitlerine ulaşıldı veya istek sayısı aşıldı.";
      } else if (errStr.includes("API_KEY_INVALID") || errStr.includes("UNAUTHENTICATED") || errStr.includes("401") || errStr.includes("API key expired")) {
        message = "Geçersiz veya süresi dolmuş Gemini API anahtarı. Lütfen Settings > Secrets panelinden ASSISTAN_API_KEY güncelleyin.";
      } else if (error?.message) {
        message = `AI Entegrasyon Hatası: ${error.message}`;
      } else {
        message = `AI Hatası: ${errStr}`;
      }
      
      res.status(500).json({ error: message });
    }
  });

  app.post("/api/analysis-insight", async (req, res) => {
    try {
      const { analysisType, data, specificInstructions } = req.body;
      if (!analysisType || !data) {
        return res.status(400).json({ error: "analysisType and data are required" });
      }

      const ai = getGeminiClient();
      
      const systemInstruction = `Sen "ON Asistan" adlı profesyonel bir eğitim ve kişilik analiz uzmanısın. 
      Öğrencinin yaptığı "${analysisType}" analizinin sonuçlarını yorumlamakla görevlisin.
      Öğrenciye doğrudan hitap et, samimi, yapıcı ama bilimsel temelli bir dil kullan. 
      Analiz verilerini derinlemesine incele ve öğrencinin gelişimi için somut 3 öneri sun.
      ${specificInstructions || ''}
      Markdown formatında, başlıklar kullanarak yanıt ver.`;

      const prompt = `Analiz Verileri: ${JSON.stringify(data)}
      Lütfen bu verileri analiz et ve öğrenciye özel bir farkındalık raporu hazırla.`;

      const modelName = getModelName("gemini-3-flash-preview");

      const response = await ai.models.generateContent({
        model: modelName,
        contents: [{ role: 'user', parts: [{ text: prompt }] }],
        config: {
          systemInstruction: systemInstruction,
          temperature: 0.7,
        }
      });

      res.json({ text: response.text });
    } catch (error: any) {
      console.error("Analysis Insight Error:", error);
      let message = "Analiz raporu oluşturulamadı.";
      
      const errStr = typeof error === 'string' ? error : (error?.message || JSON.stringify(error) || '');
      
      if (errStr === "API_KEY_MISSING") {
        message = "Asistan API Anahtarı eksik. Lütfen uygulamanın ayarlarından (Secrets bölümünden) ASSISTAN_API_KEY değerini ekleyin.";
      } else if (errStr.includes("NOT_FOUND") || errStr.includes("not found")) {
        message = "Analiz modeli bulunamadı. Lütfen model adlarını ve API yetkilerinizi kontrol edin.";
      } else if (errStr.includes("RESOURCE_EXHAUSTED") || errStr.includes("429")) {
        message = "Gemini API kota limitlerine ulaşıldı.";
      } else if (errStr.includes("API_KEY_INVALID") || errStr.includes("UNAUTHENTICATED") || errStr.includes("401") || errStr.includes("API key expired")) {
        message = "Geçersiz veya süresi dolmuş Gemini API anahtarı. Lütfen Settings > Secrets panelinden ASSISTAN_API_KEY güncelleyin.";
      } else if (error?.message) {
        message = `AI Hatası: ${error.message}`;
      } else {
        message = `AI Hatası: ${errStr}`;
      }
      
      res.status(500).json({ error: message });
    }
  });

  app.post("/api/coach-assistant", async (req, res) => {
    try {
      const { systemInstruction, messages } = req.body;
      if (!messages || !Array.isArray(messages)) {
        return res.status(400).json({ error: "messages are required in request body" });
      }

      const ai = getGeminiClient();

      const contents = messages.map(m => ({
        role: m.role === 'assistant' ? 'model' : 'user',
        parts: [{ text: m.content }]
      }));

      const modelName = getModelName("gemini-3-flash-preview");

      const response = await ai.models.generateContent({
        model: modelName,
        contents: contents,
        config: {
          systemInstruction: systemInstruction,
          temperature: 0.7,
        }
      });

      res.json({ text: response.text });
    } catch (error: any) {
      console.error("Coach Assistant Error:", error);
      let message = "Asistan yanıt veremedi.";
      
      const errStr = typeof error === 'string' ? error : (error?.message || JSON.stringify(error) || '');
      
      if (errStr === "API_KEY_MISSING") {
        message = "Asistan API Anahtarı eksik. Lütfen uygulamanın ayarlarından (Secrets bölümünden) ASSISTAN_API_KEY değerini ekleyin.";
      } else if (errStr.includes("NOT_FOUND") || errStr.includes("not found")) {
        message = "AI Modeli bulunamadı. Lütfen model kurulumunu kontrol edin.";
      } else if (errStr.includes("RESOURCE_EXHAUSTED") || errStr.includes("429")) {
        message = "Gemini API kota limitlerine ulaşıldı.";
      } else if (errStr.includes("API_KEY_INVALID") || errStr.includes("UNAUTHENTICATED") || errStr.includes("401") || errStr.includes("API key expired")) {
        message = "Geçersiz veya süresi dolmuş Gemini API anahtarı. Lütfen Settings > Secrets panelinden ASSISTAN_API_KEY güncelleyin.";
      } else if (error?.message) {
        message = `AI Hatası: ${error.message}`;
      } else {
        message = `AI Hatası: ${errStr}`;
      }
      
      res.status(500).json({ error: message });
    }
  });

  app.post("/api/chocolate-audit", async (req, res) => {
    try {
      const { prompt } = req.body;
      if (!prompt) {
        return res.status(400).json({ error: "Prompt is required" });
      }

      const ai = getGeminiClient();
      const modelName = getModelName("gemini-3-flash-preview");

      const response = await ai.models.generateContent({
        model: modelName,
        contents: prompt,
      });

      res.json({ text: response.text });
    } catch (error: any) {
      console.error("Gemini API Error:", error);
      let message = "AI Analiz servisi şu an kullanılamıyor.";
      
      const errStr = typeof error === 'string' ? error : (error?.message || JSON.stringify(error) || '');
      
      if (errStr === "API_KEY_MISSING") {
        message = "Asistan API Anahtarı eksik. Lütfen uygulamanın ayarlarından (Secrets bölümünden) ASSISTAN_API_KEY değerini ekleyin.";
      } else if (errStr.includes("RESOURCE_EXHAUSTED") || errStr.includes("429")) {
        message = "Gemini API kotası doldu (429). Lütfen API limitlerinizi kontrol edin.";
      } else if (errStr.includes("API_KEY_INVALID") || errStr.includes("UNAUTHENTICATED") || errStr.includes("401") || errStr.includes("403") || errStr.includes("API key expired")) {
        message = "Gemini API yetkilendirme hatası. Lütfen Settings > Secrets panelinden ASSISTAN_API_KEY güncelleyin.";
      } else if (error?.message) {
        message = `AI Hatası: ${error.message}`;
      } else {
        message = `AI Hatası: ${errStr}`;
      }
      
      res.status(500).json({ error: message });
    }
  });

  app.post("/api/calculate-yks", async (req, res) => {
    try {
      const data = req.body;
      
      const reqData = [
        String(data.tytTr?.toFixed(2) || "0.00"),
        String(data.tytSos?.toFixed(2) || "0.00"),
        String(data.tytMat?.toFixed(2) || "0.00"),
        String(data.tytFen?.toFixed(2) || "0.00"),
        String(data.aytEd?.toFixed(2) || "0.00"),
        String(data.aytTar1?.toFixed(2) || "0.00"),
        String(data.aytCog1?.toFixed(2) || "0.00"),
        String(data.aytTar2?.toFixed(2) || "0.00"),
        String(data.aytCog2?.toFixed(2) || "0.00"),
        String(data.aytFel?.toFixed(2) || "0.00"),
        String(data.aytDin?.toFixed(2) || "0.00"),
        String(data.aytMat?.toFixed(2) || "0.00"),
        String(data.aytFiz?.toFixed(2) || "0.00"),
        String(data.aytKim?.toFixed(2) || "0.00"),
        String(data.aytBiy?.toFixed(2) || "0.00"),
        String(data.ydt?.toFixed(2) || "0.00"),
        data.diploma ? String(data.diploma).replace('.', ',') : "50,00"
      ];

      const params = new URLSearchParams();
      params.append('diploma', data.diploma || '50');
      
      const fieldMap = {
        'tmd': data.tytMat, 'ttd': data.tytTr, 'tfd': data.tytFen, 'tsd': data.tytSos,
        'tmy': 0, 'tty': 0, 'tfy': 0, 'tsy': 0,
        'md': data.aytMat, 'fd': data.aytFiz, 'kd': data.aytKim, 'bd': data.aytBiy,
        'ed': data.aytEd, 'tar1d': data.aytTar1, 'cog1d': data.aytCog1,
        'tar2d': data.aytTar2, 'cog2d': data.aytCog2, 'feld': data.aytFel, 'dind': data.aytDin,
        'dd': data.ydt,
        'my': 0, 'fy': 0, 'ky': 0, 'by': 0,
        'ey': 0, 'tar1y': 0, 'cog1y': 0,
        'tar2y': 0, 'cog2y': 0, 'fely': 0, 'diny': 0,
        'dy': 0
      };

      for (const [key, value] of Object.entries(fieldMap)) {
        params.append(key, String(value || 0));
      }

      const [ogmRes, puangoRes] = await Promise.all([
        fetch('https://ogmmateryal.eba.gov.tr/yks-puan-hesaplama', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json; charset=utf-8' },
          body: JSON.stringify(reqData)
        }),
        fetch('https://puango.net/api/hesaplama2.php', {
          method: 'POST',
          headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
          body: params.toString()
        })
      ]);
      
      const ogmText = await ogmRes.text();
      let ogmParsed = [];
      try {
        ogmParsed = JSON.parse(ogmText);
        if (data.kirikOBP && Array.isArray(ogmParsed) && ogmParsed.length > 5) {
          const deduction = Number(data.diploma || 50) * 0.3;
          if (ogmParsed[0]?.tytPuani) ogmParsed[0].tytPuani -= deduction; // Just in case, though OGM returns ham here
          if (ogmParsed[3]?.tytPuani) ogmParsed[3].tytPuani -= deduction;
          if (ogmParsed[4]?.esitAgirlikPuani) ogmParsed[4].esitAgirlikPuani -= deduction;
          if (ogmParsed[4]?.sayisalPuani) ogmParsed[4].sayisalPuani -= deduction;
          if (ogmParsed[4]?.sozelPuani) ogmParsed[4].sozelPuani -= deduction;
          if (ogmParsed[5]?.dilPuani) ogmParsed[5].dilPuani -= deduction;
        }
      } catch(e) {
        console.error("OGM parse error:", e);
      }

      const puangoText = await puangoRes.text();
      let puangoParsed: any = {};
      try {
        const jsonStart = puangoText.indexOf('{');
        if (jsonStart !== -1) {
           puangoParsed = JSON.parse(puangoText.substring(jsonStart));
        }
        
        // Manual Kirik OBP deduction
        if (data.kirikOBP) {
          const deduction = Number(data.diploma || 50) * 0.3;
          if (puangoParsed.tyt_yer) puangoParsed.tyt_yer -= deduction;
          if (puangoParsed.yks_say_yer) puangoParsed.yks_say_yer -= deduction;
          if (puangoParsed.yks_ea_yer) puangoParsed.yks_ea_yer -= deduction;
          if (puangoParsed.yks_soz_yer) puangoParsed.yks_soz_yer -= deduction;
          if (puangoParsed.yks_dil_yer) puangoParsed.yks_dil_yer -= deduction;
        }
      } catch(e) {
        console.error("Puango parse error:", e);
      }

      res.json({ ogm: ogmParsed, puango: puangoParsed });

    } catch (e) {
      console.error(e);
      res.status(500).json({ error: 'Failed to calculate' });
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    // In production, serve from the directory where the bundle is located
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
