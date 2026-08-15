function pcmToWavBase64(pcmBase64, sampleRate = 24000, numChannels = 1, bitDepth = 16) {
  const pcmBuffer = Buffer.from(pcmBase64, 'base64');
  const wavHeader = Buffer.alloc(44);
  
  wavHeader.write('RIFF', 0);
  wavHeader.writeUInt32LE(36 + pcmBuffer.length, 4);
  wavHeader.write('WAVE', 8);
  
  wavHeader.write('fmt ', 12);
  wavHeader.writeUInt32LE(16, 16);
  wavHeader.writeUInt16LE(1, 20);
  wavHeader.writeUInt16LE(numChannels, 22);
  wavHeader.writeUInt32LE(sampleRate, 24);
  wavHeader.writeUInt32LE(sampleRate * numChannels * bitDepth / 8, 28);
  wavHeader.writeUInt16LE(numChannels * bitDepth / 8, 32);
  wavHeader.writeUInt16LE(bitDepth, 34);
  
  wavHeader.write('data', 36);
  wavHeader.writeUInt32LE(pcmBuffer.length, 40);
  
  const wavBuffer = Buffer.concat([wavHeader, pcmBuffer]);
  return wavBuffer.toString('base64');
}

import { GoogleGenAI } from "@google/genai";
import dotenv from "dotenv";
dotenv.config({ path: ".env.local" });
const ai = new GoogleGenAI({apiKey: process.env.ASSISTAN_API_KEY});
async function main() {
  const response = await ai.models.generateContent({
    model: "gemini-3.1-flash-tts-preview",
    contents: [{ parts: [{ text: "Hello, this is a test of the WAV conversion." }] }],
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
  
  const mimeType = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.mimeType;
  const data = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
  
  if (mimeType.includes("audio/l16")) {
     const wavBase64 = pcmToWavBase64(data);
     console.log("Converted to WAV, length:", wavBase64.length);
     console.log("Starts with RIFF?", Buffer.from(wavBase64, 'base64').toString('utf8', 0, 4) === 'RIFF');
  }
}
main().catch(console.error);
