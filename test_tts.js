import { GoogleGenAI } from "@google/genai";
import dotenv from "dotenv";
dotenv.config({ path: ".env.local" });
const ai = new GoogleGenAI({apiKey: process.env.ASSISTAN_API_KEY});
async function main() {
  const response = await ai.models.generateContent({
    model: "gemini-3.1-flash-tts-preview",
    contents: [{ parts: [{ text: "Hello, this is a test." }] }],
    config: {
      responseModalities: ["AUDIO"],
      speechConfig: {
        voiceConfig: {
          prebuiltVoiceConfig: {
            voiceName: "Puck"
          }
        }
      }
    }
  });
  console.log("Mime Type:", response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.mimeType);
}
main().catch(console.error);
