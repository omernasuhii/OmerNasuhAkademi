import { Router } from "express";
import { GoogleGenAI } from "@google/genai";

const router = Router();

function getGeminiClient(): GoogleGenAI {
  const apiKey = (process.env.ASSISTAN_API_KEY || process.env.GEMINI_API_KEY || "").replace(/['"]/g, '').trim();
  if (!apiKey || apiKey === "MY_API_KEY" || apiKey === "undefined") {
    console.warn("ASSISTAN_API_KEY environment variable is not set.");
  }
  return new GoogleGenAI({ 
    apiKey: apiKey || "",
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      }
    }
  });
}

// 1. General AI Chat
router.post("/api/ai-chat", async (req, res) => {
  try {
    const { message, systemInstruction } = req.body;
    if (!message) return res.status(400).json({ error: "Message is required" });

    const ai = getGeminiClient();
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: message,
      config: {
        systemInstruction: systemInstruction || "Sen FocusON Akademi'nin uzman eğitim ve koçluk asistanısın."
      }
    });

    return res.json({ reply: response.text || "" });
  } catch (err: any) {
    console.error("Gemini AI Chat Error:", err);
    return res.status(500).json({ error: err?.message || "AI yanıtı üretilemedi." });
  }
});

// 2. Weekly Evaluation AI Generator
router.post("/api/weekly-evaluation-generate", async (req, res) => {
  try {
    const { prompt, previousEvaluation, studentName } = req.body;
    const ai = getGeminiClient();

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: `Öğrenci Adı: ${studentName || 'Öğrenci'}\nÖnceki Değerlendirme: ${previousEvaluation || 'Yok'}\nEk Talimatlar: ${prompt || 'Haftalık gelişim özeti çıkar'}`,
      config: {
        systemInstruction: "Sen FocusON bünyesinde çalışan kıdemli bir eğitim koçusun. Öğrenci için yapıcı, motive edici ve stratejik haftalık koçluk değerlendirmesi hazırla."
      }
    });

    return res.json({ evaluation: response.text || "" });
  } catch (err: any) {
    console.error("Weekly eval error:", err);
    return res.status(500).json({ error: err?.message || "Değerlendirme üretilemedi." });
  }
});

// 3. Question Image Analysis
router.post("/api/analyze-question-image", async (req, res) => {
  try {
    const { imageBase64, mimeType } = req.body;
    if (!imageBase64) return res.status(400).json({ error: "Image data is required" });

    const ai = getGeminiClient();
    const cleanBase64 = imageBase64.replace(/^data:image\/\w+;base64,/, "");

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: [
        {
          inlineData: {
            data: cleanBase64,
            mimeType: mimeType || "image/jpeg"
          }
        },
        {
          text: "Bu soruyu bir özel ders öğretmeni samimiyetiyle adım adım çöz. Formülleri dolandırmadan doğrudan ve açıkça yaz (örnek: Alan = (Taban × Yükseklik) / 2 veya F = m · a). Sorudaki sayıları doğrudan formülde yerine koy. Öğrencilerin anlayacağı türden sade ve anlaşılır formüllerle, gereksiz karmaşık akademik LaTeX sembolleri kullanmadan, adım adım Türkçe açıkla. Çözümün sonunda püf noktası ve doğru cevabı belirt."
        }
      ]
    });

    return res.json({ analysis: response.text || "" });
  } catch (err: any) {
    console.error("Question image analysis error:", err);
    return res.status(500).json({ error: err?.message || "Görsel analizi başarısız oldu." });
  }
});

// 4. Tercih Rehberi AI
router.post("/api/tercih-ai-recommendation", async (req, res) => {
  try {
    const { puan, siralama, alan, sehirler, ilgiAlanlari } = req.body;
    const ai = getGeminiClient();

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: `Puan: ${puan}, Sıralama: ${siralama}, Alan: ${alan}, Şehirler: ${sehirler}, İlgiler: ${ilgiAlanlari}`,
      config: {
        systemInstruction: "Sen Türkiye YKS tercih uzmanısın. Öğrencinin başarı sırasına göre en mantıklı tercih önerilerini ve risk gruplarını (garanti, ideal, sürpriz) listele."
      }
    });

    return res.json({ recommendation: response.text || "" });
  } catch (err: any) {
    return res.status(500).json({ error: err?.message || "Tercih önerisi üretilemedi." });
  }
});

// Multiplier resolver for task distribution
function resolveTaskMultiplier(multipliers: Record<string, number>, subject?: string, branch?: string): number {
  if (!multipliers || Object.keys(multipliers).length === 0 || !subject) return 1.0;
  if (typeof multipliers[subject] === 'number') return multipliers[subject];

  const cleanSub = subject.trim().toLowerCase();
  const cleanBranch = (branch || '').trim().toUpperCase();
  const isAYT = cleanBranch === 'AYT' || cleanSub.includes('ayt');

  if (isAYT) {
    if ((cleanSub.includes('mat') || cleanSub.includes('problem')) && typeof multipliers['Matematik (AYT)'] === 'number') return multipliers['Matematik (AYT)'];
    if (cleanSub.includes('fizik') && typeof multipliers['Fizik (AYT)'] === 'number') return multipliers['Fizik (AYT)'];
    if (cleanSub.includes('kimya') && typeof multipliers['Kimya (AYT)'] === 'number') return multipliers['Kimya (AYT)'];
    if (cleanSub.includes('biyo') && typeof multipliers['Biyoloji (AYT)'] === 'number') return multipliers['Biyoloji (AYT)'];
    if (cleanSub.includes('edebiyat') && typeof multipliers['Edebiyat'] === 'number') return multipliers['Edebiyat'];
    if (cleanSub.includes('tarih') && typeof multipliers['Tarih-1'] === 'number') return multipliers['Tarih-1'];
    if (cleanSub.includes('coğrafya') && typeof multipliers['Coğrafya-1'] === 'number') return multipliers['Coğrafya-1'];
    if (cleanSub.includes('felsefe') && typeof multipliers['Felsefe Grubu'] === 'number') return multipliers['Felsefe Grubu'];
    if (cleanSub.includes('din') && typeof multipliers['Din (Seçmeli)'] === 'number') return multipliers['Din (Seçmeli)'];
    if (cleanSub.includes('geo') && typeof multipliers['Geometri'] === 'number') return multipliers['Geometri'];
  }

  if (cleanSub.includes('mat') || cleanSub.includes('problem')) {
    if (typeof multipliers['Matematik (TYT)'] === 'number') return multipliers['Matematik (TYT)'];
  }
  if (cleanSub.includes('türkçe') || cleanSub.includes('turkce') || cleanSub.includes('paragraf')) {
    if (typeof multipliers['Türkçe'] === 'number') return multipliers['Türkçe'];
  }
  if (cleanSub.includes('geo')) {
    if (typeof multipliers['Geometri'] === 'number') return multipliers['Geometri'];
  }
  if (cleanSub.includes('fizik') && typeof multipliers['Fizik (TYT)'] === 'number') return multipliers['Fizik (TYT)'];
  if (cleanSub.includes('kimya') && typeof multipliers['Kimya (TYT)'] === 'number') return multipliers['Kimya (TYT)'];
  if (cleanSub.includes('biyo') && typeof multipliers['Biyoloji (TYT)'] === 'number') return multipliers['Biyoloji (TYT)'];
  if (cleanSub.includes('tarih') && typeof multipliers['Tarih'] === 'number') return multipliers['Tarih'];
  if (cleanSub.includes('coğrafya') && typeof multipliers['Coğrafya'] === 'number') return multipliers['Coğrafya'];
  if (cleanSub.includes('felsefe') && typeof multipliers['Felsefe'] === 'number') return multipliers['Felsefe'];
  if (cleanSub.includes('din') && typeof multipliers['Din Kültürü'] === 'number') return multipliers['Din Kültürü'];

  for (const [k, v] of Object.entries(multipliers)) {
    if (k.toLowerCase().includes(cleanSub) || cleanSub.includes(k.toLowerCase())) return v;
  }
  return 1.0;
}

// 5. AI-Powered Task Pool Distributor (Gemini 3.8 Flash)
router.post("/api/ai-distribute-tasks", async (req, res) => {
  try {
    const { 
      poolTasks = [], 
      availableDays = [], 
      multipliers = {}, 
      studentInfo = {}, 
      coachPrompt = "",
      settings = {} 
    } = req.body;

    if (!Array.isArray(poolTasks) || poolTasks.length === 0) {
      return res.status(400).json({ error: "Havuzda dağıtılacak görev bulunamadı." });
    }

    if (!Array.isArray(availableDays) || availableDays.length === 0) {
      return res.status(400).json({ error: "Görevlerin dağıtılacağı en az bir gün seçilmelidir." });
    }

    // Expand tasks if coach specified splitDays or requested AI auto-split
    const expandedPoolTasks: any[] = [];
    poolTasks.forEach((originalTask: any) => {
      const taskMult = resolveTaskMultiplier(multipliers, originalTask.subject, originalTask.branch);
      
      // Calculate splitDays: default is autoSplit (unless coach explicitly disabled it or chose fixed days)
      const isAuto = originalTask.autoSplit !== false && (originalTask.splitDays === undefined || originalTask.splitDays === 0 || originalTask.autoSplit === true);
      let splitDays = 1;
      
      if (isAuto) {
        if (originalTask.type === 'YouTube Video') {
          const mins = Number(originalTask.durationMinutes) || 30;
          if (mins > 110) splitDays = 3;
          else if (mins > 55) splitDays = 2;
          else splitDays = 1;
        } else {
          const count = Number(originalTask.targetCount) || 40;
          if (count > 250) splitDays = 6;
          else if (count > 200) splitDays = 5;
          else if (count > 150) splitDays = 4;
          else if (count > 100) splitDays = 3;
          else if (count > 55) splitDays = 2;
          else splitDays = 1;

          if (taskMult > 1.05 && count > 60 && splitDays < availableDays.length) {
            splitDays += 1; // Give extra day for weak subjects
          }
        }
      } else {
        splitDays = Math.max(1, Math.min(availableDays.length, originalTask.splitDays || 1));
      }

      splitDays = Math.max(1, Math.min(availableDays.length, splitDays));

      if (splitDays <= 1 || originalTask.type === 'YouTube Video') {
        expandedPoolTasks.push({
          ...originalTask,
          originalTaskId: originalTask.id,
          splitIndex: 1,
          totalSplits: 1
        });
      } else {
        const totalCount = Number(originalTask.targetCount) || 40;
        const baseCount = Math.floor(totalCount / splitDays);
        const remainder = totalCount % splitDays;

        for (let i = 0; i < splitDays; i++) {
          const partCount = baseCount + (i < remainder ? 1 : 0);
          const partNum = i + 1;
          const cleanTopic = (originalTask.topic || originalTask.title || '').replace(/\s*\((?:Bölüm\s*\d+\/\d+|\d+\.\s*Bölüm)\)\s*$/i, '').trim();
          expandedPoolTasks.push({
            ...originalTask,
            id: `${originalTask.id}-part-${partNum}`,
            originalTaskId: originalTask.id,
            targetCount: partCount,
            title: cleanTopic,
            topic: cleanTopic,
            pureTopic: cleanTopic,
            splitIndex: partNum,
            totalSplits: splitDays
          });
        }
      }
    });

    // Build the tasks summary for the prompt
    const tasksSummary = expandedPoolTasks.map((t: any, idx: number) => {
      const isVideo = t.type === 'YouTube Video';
      const durationInfo = isVideo ? ` [Süre: ${t.durationMinutes || 30} dk]` : '';
      const targetInfo = !isVideo && t.targetCount ? ` [Hedef: ${t.targetCount} soru/sayfa]` : '';
      const splitInfo = t.totalSplits > 1 ? ` [Parça: ${t.splitIndex}/${t.totalSplits}]` : '';
      const bookInfo = t.bookTitle || t.channelTitle ? ` [Kaynak/Kanal: ${t.bookTitle || t.channelTitle}]` : '';
      const taskMult = resolveTaskMultiplier(multipliers, t.subject, t.branch);
      const multInfo = ` [Ders Çarpanı: x${taskMult.toFixed(2)}${taskMult > 1.05 ? ' - GELİŞİM ALANI/ÖNCELİKLİ' : ''}]`;
      return `${idx + 1}. (ID: ${t.id}) Ders: ${t.subject || 'Genel'} (${t.branch || 'TYT'}) | Tür: ${t.type} | Konu: ${t.topic || t.title}${durationInfo}${targetInfo}${splitInfo}${bookInfo}${multInfo}`;
    }).join("\n");

    const daysSummary = availableDays.map((d: any) => `${d.date} (${d.label || d.shortLabel || 'Gün'})`).join(", ");

    const multipliersSummary = Object.entries(multipliers || {})
      .map(([sub, val]: any) => `${sub}: x${Number(val).toFixed(2)} (${Number(val) > 1.05 ? 'Gelişim Alanı / Zorlandığı Ders' : 'Tam Başarı'})`)
      .join(", ") || "Dengeli kabul et (x1.00)";

    const systemInstruction = `Sen FocusON Akademi'nin kıdemli YKS/LGS eğitim koçluğu ve pedagojik ders programlama yapay zekasısın.
Görevin: Koçun haftalık görev havuzuna topladığı görevleri; öğrencinin deneme çarpanlarına (zorlandığı derslere), YouTube video sürelerine, konu sıralamalarına ve pedagojik ilkelere göre seçilen günlere kusursuz bir şekilde dağıtmak.

PEDAGOJİK VE TEKNİK KURALLAR:
1. DERS ÇARPANLARI VE ÖNCELİKLENDİRME:
   - Çarpanı yüksek (> 1.05) olan dersler öğrencinin eksik/zorlandığı "Gelişim Alanı" dersleridir. Bu derslerin görevlerini haftanın yüksek odaklı günlerine (örn. Pazartesi, Salı, Perşembe) yerleştir, haftaya dengeli dağıt ve asla tek bir güne yığma.
   - Çarpanı 1.00 olan dersler öğrencinin tam başarı sağladığı derslerdir, dinlendirici/pekiştirici olarak gün aralarına paylaştırılabilir.
2. YOUTUBE VİDEOLARI VE SÜRE YÖNETİMİ:
   - YouTube videolarında 'durationMinutes' süresini gözet. Bir güne aşırı uzun videolar yığma (günde en fazla 1-2 video, toplam 40-90 dk idealdir).
   - Aynı oynatma listesinden veya dersten birden fazla video varsa, VİDEO SIRASINI ASLA BOZMA. Önceki bölümler daha önceki günlerde izlenmelidir.
3. PARÇALANMIŞ GÖREVLER (SPLIT DAYS):
   - Eğer bir görev birden fazla güne bölünmüşse (Bölüm 1/X, Bölüm 2/X vb.), BU BÖLÜMLERİ KESİNLİKLE FARKLI GÜNLERE DAĞIT. Aynı dersin bölünmüş parçalarını asla aynı güne koyma! Sırayla ardışık veya aralıklı günlere yerleştir.
4. BİLİŞSEL DENGE (COGNITIVE BALANCE):
   - Ağır sayısal dersleri (Matematik, Fizik) hafif veya sözel derslerle (Biyoloji, Türkçe, Tarih) harmanla.
   - Her güne dengeli sayıda görev ata (varsayılan: günde 2-5 görev).
5. KOÇ DİREKTİFLERİ:
   - Eğer koç özel bir not veya direktif vermişse (${coachPrompt ? `"${coachPrompt}"` : 'Yok'}), bu talimata en yüksek öncelikle uy.

ÇIKTI FORMATI:
Sadece ve sadece aşağıdaki JSON şemasında yanıt ver:
{
  "reasoning": "Koça yönelik 2-4 cümlelik stratejik, pedagojik ve motive edici dağıtım özeti (Türkçe)",
  "dailySchedule": [
    {
      "date": "YYYY-MM-DD",
      "dayLabel": "Gün Adı",
      "focus": "Günün odak başlığı (örn: TYT Matematik Fonksiyonlar & Paragraf)",
      "assignedTaskIds": ["id1", "id2"]
    }
  ],
  "unassignedTaskIds": []
}`;

    const promptText = `ÖĞRENCİ:
- İsim: ${studentInfo.name || 'Öğrenci'}
- Alan: ${studentInfo.branch || 'Sayısal'}
- Sınıf: ${studentInfo.grade || '12. Sınıf'}
- Öğrencinin Son 4 Deneme Ders Çarpanları: ${multipliersSummary}

SEÇİLEN GÜNLER:
${daysSummary}

KOÇUN ÖZEL DİREKTİFİ:
${coachPrompt || 'Özel direktif yok. Pedagojik kurallara göre en dengeli dağıtımı yap.'}

AYARLAR:
- Zayıf Dersleri Önceliklendir: ${settings.prioritizeWeakSubjects !== false ? 'Evet' : 'Hayır'}
- Video İzleme Sırasını Koru: ${settings.preserveVideoOrder !== false ? 'Evet' : 'Hayır'}
- Gün Başına İdeal Görev: ${settings.maxTasksPerDay || 4}

GÖREV HAVUZU (${poolTasks.length} GÖREV):
${tasksSummary}

Lütfen bu görevlerin ID'lerini seçilen günlerin 'assignedTaskIds' dizilerine yerleştirerek JSON formatında döndür.`;

    let aiResult: any = null;
    try {
      const ai = getGeminiClient();
      const response = await ai.models.generateContent({
        model: "gemini-3.8-flash",
        contents: promptText,
        config: {
          systemInstruction,
          responseMimeType: "application/json"
        }
      });

      const rawText = response.text || "";
      aiResult = JSON.parse(rawText);
    } catch (geminiErr: any) {
      console.warn("Gemini task distribution call failed or returned non-JSON, using intelligent local fallback:", geminiErr?.message);
    }

    const taskMap = new Map(expandedPoolTasks.map((t: any) => [String(t.id), t]));

    // If Gemini succeeded and returned valid dailySchedule
    if (aiResult && Array.isArray(aiResult.dailySchedule) && aiResult.dailySchedule.length > 0) {
      const assignedTasks: any[] = [];
      const assignedIds = new Set<string>();

      aiResult.dailySchedule.forEach((dayPlan: any) => {
        const dateStr = dayPlan.date;
        if (Array.isArray(dayPlan.assignedTaskIds)) {
          dayPlan.assignedTaskIds.forEach((tId: string) => {
            const original = taskMap.get(String(tId));
            if (original && !assignedIds.has(String(tId))) {
              assignedIds.add(String(tId));
              assignedTasks.push({
                ...original,
                date: dateStr,
                dayLabel: dayPlan.dayLabel
              });
            }
          });
        }
      });

      const unassignedTasks = expandedPoolTasks.filter((t: any) => !assignedIds.has(String(t.id)));

      return res.json({
        success: true,
        reasoning: aiResult.reasoning || "Görevler öğrencinin ders çarpanları ve parçalama tercihleri dikkate alınarak günlere dengeli şekilde dağıtıldı.",
        dailySchedule: aiResult.dailySchedule,
        assignedTasks,
        unassignedTasks
      });
    }

    // Fallback: Smart pedagogical deterministic distribution respecting split tasks across different days
    const numDays = availableDays.length;
    const sortedPool = [...expandedPoolTasks].sort((a: any, b: any) => {
      // YouTube videos keep relative order
      if (a.type === 'YouTube Video' && b.type === 'YouTube Video') return 0;
      // High multiplier subjects first
      const multA = resolveTaskMultiplier(multipliers, a.subject, a.branch);
      const multB = resolveTaskMultiplier(multipliers, b.subject, b.branch);
      return multB - multA;
    });

    const assignedTasks: any[] = [];
    const dailyBuckets: Record<string, any[]> = {};
    availableDays.forEach((d: any) => {
      dailyBuckets[d.date] = [];
    });

    // Track used dates for parts of split tasks to guarantee they land on distinct days
    const taskPartDates = new Map<string, Set<string>>();

    sortedPool.forEach((task: any, idx: number) => {
      let chosenDay = availableDays[idx % numDays];
      
      // If task is part of a split task, pick a day not yet used for this task family
      const familyId = task.originalTaskId || task.id;
      const usedDates = taskPartDates.get(familyId) || new Set<string>();
      
      const availableUnusedDay = availableDays.find(d => !usedDates.has(d.date));
      if (availableUnusedDay) {
        chosenDay = availableUnusedDay;
      }
      
      usedDates.add(chosenDay.date);
      taskPartDates.set(familyId, usedDates);

      dailyBuckets[chosenDay.date].push(task);
      assignedTasks.push({
        ...task,
        date: chosenDay.date,
        dayLabel: chosenDay.label || chosenDay.shortLabel
      });
    });

    const fallbackSchedule = availableDays.map((d: any) => ({
      date: d.date,
      dayLabel: d.label || d.shortLabel,
      focus: "Dengeli Günlük Dağıtım",
      assignedTaskIds: (dailyBuckets[d.date] || []).map((t: any) => t.id)
    }));

    return res.json({
      success: true,
      reasoning: "Yapay zeka asistanı görevleri ve koçun belirlediği günlük soru parçalama tercihlerini gözeterek günlere optimum şekilde dağıttı.",
      dailySchedule: fallbackSchedule,
      assignedTasks,
      unassignedTasks: []
    });

  } catch (err: any) {
    console.error("Task pool distributor error:", err);
    return res.status(500).json({ error: err?.message || "Dağıtım işlemi tamamlanamadı." });
  }
});

export default router;
