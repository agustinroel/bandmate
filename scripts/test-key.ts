import { GoogleGenerativeAI } from "@google/generative-ai";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(__dirname, "../apps/api/.env") });

async function test() {
  const apiKey = process.env.GOOGLE_GENAI_API_KEY;
  console.log("Key length:", apiKey?.length);
  if (!apiKey) return;

  try {
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });
    const result = await model.generateContent("Say 'API KEY WORKS'");
    console.log("RESULT:", result.response.text());
  } catch (err) {
    console.error("SDK FAILED:", err);
  }
}

test();
