import { GoogleGenAI } from "@google/genai";
import dotenv from "dotenv";
dotenv.config({ path: ".env.local" });
const ai = new GoogleGenAI({apiKey: process.env.ASSISTAN_API_KEY});
async function main() {
  const models = await ai.models.list();
  for await (const model of models) {
    if (model.name.includes("flash")) {
      console.log(model.name);
    }
  }
}
main().catch(console.error);
