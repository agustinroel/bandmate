import { GoogleGenerativeAI } from "@google/generative-ai";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(__dirname, "../apps/api/.env") });

async function test() {
  const apiKey = process.env.GOOGLE_GENAI_API_KEY;
  if (!apiKey) {
    console.error("No API key found.");
    return;
  }

  try {
    const genAI = new GoogleGenerativeAI(apiKey);
    // Use the internal fetch-based approach if listModels is not on the main class
    // Actually, in @google/generative-ai, listModels is not a straightforward method sometimes.
    // Let's try to just fetch the list directly from the API endpoint
    const url = `https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`;
    const response = await fetch(url);
    const data = await response.json();

    console.log("AVAILABLE MODELS:");
    if (data.models) {
      data.models.forEach((m: any) => {
        console.log(
          `- ${m.name} (Supports: ${m.supportedGenerationMethods.join(", ")})`,
        );
      });
    } else {
      console.log("No models returned:", data);
    }
  } catch (err) {
    console.error("Discovery failed:", err);
  }
}

test();
