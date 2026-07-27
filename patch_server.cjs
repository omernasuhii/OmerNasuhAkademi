const fs = require('fs');
let content = fs.readFileSync('server.ts', 'utf8');

const coachEndpointStr = `
  app.post("/api/coach-report-generate", async (req, res) => {
    try {
      const { analysesData, studentName } = req.body;

      if (!analysesData) {
        return res.status(400).json({ error: "analysesData is required" });
      }

      const ai = getGeminiClient();
      
      const systemInstruction = \`Sen FocusON Akademi'de profesyonel bir eğitim koçu ve rehberlik uzmanısın.
      Aşağıda "\${studentName || 'Öğrencinin'}" yapmış olduğu kişilik ve rehberlik analizlerinin sonuç özetleri verilmiştir.
      Görevin, koçun kendisi için öğrenciyi tanıma ve yönlendirme amaçlı bir "Koç Değerlendirme Raporu" oluşturmaktır.
      - Öğrencinin öğrenme stiline, motivasyon kaynaklarına ve güçlü/zayıf yönlerine odaklan,
      - Koçluk sürecinde kullanılabilecek stratejiler öner,
      - Dilin profesyonel, analitik ve doğrudan koça hitap eden bir tonda olsun.
      - Raporu doğrudan yaz, "İşte rapor" gibi giriş cümleleri kullanma.
      - Formatı Markdown olarak hazırla ve alt başlıklar kullan.\`;

      const prompt = \`Öğrenci Analiz Sonuçları:\\n\${JSON.stringify(analysesData, null, 2)}\\n\\nLütfen koç değerlendirme raporunu oluştur.\`;

      const result = await ai.models.generateContent({
        model: "gemini-2.5-flash",
        contents: prompt,
        config: {
          systemInstruction: systemInstruction,
        }
      });

      res.json({ text: result.text });
    } catch (error: any) {
      console.error("AI Error:", error);
      res.status(500).json({ error: "Failed to generate report" });
    }
  });
`;

if (!content.includes('coach-report-generate')) {
  content = content.replace('app.post("/api/parent-report-generate", async (req, res) => {', coachEndpointStr + '\n  app.post("/api/parent-report-generate", async (req, res) => {');
  fs.writeFileSync('server.ts', content);
}
