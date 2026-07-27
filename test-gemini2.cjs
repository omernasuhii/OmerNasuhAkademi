const { GoogleGenAI } = require("@google/genai");

async function run() {
  try {
    const ai = new GoogleGenAI({ apiKey: process.env.ASSISTAN_API_KEY });
    const response = await ai.models.generateContent({
      model: "gemini-3.1-flash-lite",
      contents: "Hello",
    });
    console.log("Success 3.1-flash-lite:", response.text);
  } catch (e) {
    console.log("Error 3.1-flash-lite:", e.message);
  }

  try {
    const ai = new GoogleGenAI({ apiKey: process.env.ASSISTAN_API_KEY });
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: "Hello",
    });
    console.log("Success 2.5-flash:", response.text);
  } catch (e) {
    console.log("Error 2.5-flash:", e.message);
  }
}
run();
