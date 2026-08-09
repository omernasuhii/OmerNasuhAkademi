const fs = require('fs');

let serverTs = fs.readFileSync('server.ts', 'utf8');

const coachAssistantStart = serverTs.indexOf('app.post("/api/coach-assistant"');
const coachAssistantEnd = serverTs.indexOf('app.post("/api/chocolate-audit"');

const oldCoachAssistant = serverTs.slice(coachAssistantStart, coachAssistantEnd);

const newCoachAssistant = `app.post("/api/coach-assistant", async (req, res) => {
    try {
      const { history, userContext } = req.body;
      if (!history || !Array.isArray(history)) {
        return res.status(400).json({ error: "history is required in request body" });
      }

      const ai = getGeminiClient();

      const systemInstruction = \`Sen FocusON Akademi'nin yapay zeka koç asistanısın. Koçlara, öğrencilerinin durumları, gelişimleri ve koçluk süreçleri hakkında fikir alışverişi yapar ve rehberlik sağlarsın. Sana sorulan soruları yanıtlarken 'get_coach_students_data' aracını kullanarak koça ait öğrencilerin detaylı bilgilerini (kitaplar, sınavlar, analizler, randevular) çekebilirsin.\`;

      const tools = [{
        functionDeclarations: [
          {
            name: "get_coach_students_data",
            description: "Koçun kendi öğrencilerinin akademik verilerini ve detaylı analizlerini getirir.",
            parameters: {
              type: "OBJECT",
              properties: {
                studentName: { type: "STRING", description: "Sadece belirli bir öğrencinin verisini getirmek istersen adını yaz. Boş bırakırsan tüm öğrencileri özetler." },
                dataTypes: {
                  type: "ARRAY",
                  items: { type: "STRING" },
                  description: "Hangi veri kategorilerinin getirileceği: 'programs', 'books', 'exams', 'appointments'. Boş bırakılırsa hepsi gelir."
                }
              }
            }
          }
        ]
      }];

      const formattedHistory = history.map((msg: any) => {
        if (msg.role === 'function' || msg.functionResponse) {
          return {
            role: 'user',
            parts: [{ text: \`[Sistem: "\${msg.name || 'Araç'}" aracı çalıştırıldı ve şu sonuçlar elde edildi:\\n\${JSON.stringify(msg.functionResponse || {}, null, 2)}]\` }]
          };
        }
        if (msg.functionCalls) {
          const toolNames = msg.functionCalls.map((fc: any) => fc.name).join(', ');
          return {
            role: 'model',
            parts: [{ text: msg.content || \`[Sistem: "\${toolNames}" aracı çağrıldı.]\` }]
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
        config: { systemInstruction, tools: tools as any },
        history: formattedHistory.slice(0, -1)
      });

      const lastMsg = history[history.length - 1];
      let messagePayload: any = lastMsg.content;
      if (lastMsg.functionResponse) {
         messagePayload = \`[Sistem: "\${lastMsg.name || 'Araç'}" aracı başarıyla çalıştırıldı ve şu sonuçlar elde edildi:\\n\${JSON.stringify(lastMsg.functionResponse || {}, null, 2)}\\n\\n(DİKKAT: Veriyi incele. Eğer yeterli bilgiye ulaştıysan kullanıcıya doğrudan, samimi ve profesyonel bir üslupla yanıt ver. EĞER eksik bir bilgi varsa veya bu verinin sonucuna göre YENİ BİR ARAMA yapman gerekiyorsa, kullanıcıya cevap yazmadan önce doğrudan DİĞER ARAÇLARI ÇAĞIR. 4 aşamaya kadar ardışık araç çağrısı yapabilirsin.)]\`;
      }
      const response = await chat.sendMessage({ message: messagePayload });

      if (response.functionCalls && response.functionCalls.length > 0) {
        return res.json({ 
          functionCalls: response.functionCalls.map(fc => ({ name: fc.name, args: fc.args, id: fc.id })),
          text: response.text || ''
        });
      }

      res.json({ text: response.text });
    } catch (error: any) {
      console.error("Coach Assistant Error:", error);
      res.status(500).json({ error: "Asistan servisi şu an kullanılamıyor." });
    }
  });\n\n  `;

serverTs = serverTs.replace(oldCoachAssistant, newCoachAssistant);
fs.writeFileSync('server.ts', serverTs);
