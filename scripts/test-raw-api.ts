import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";
const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(__dirname, "../apps/api/.env") });

async function test() {
  const apiKey = process.env.GOOGLE_GENAI_API_KEY;
  if (!apiKey) {
    console.log("No API Key found.");
    return;
  }

  const models = [
    "gemini-2.0-flash",
    "gemini-2.0-flash-lite",
    "gemini-1.5-flash",
    "gemini-flash-latest",
    "gemini-1.5-pro",
    "gemini-pro-latest",
  ];

  process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";

  for (const modelName of models) {
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${modelName}:generateContent?key=${apiKey}`;
    try {
      const response = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{ parts: [{ text: "ping" }] }],
        }),
      });

      const body = await response.text();
      console.log(`\n--- MODEL: ${modelName} ---`);
      console.log(`Status: ${response.status}`);
      if (
        body.trim().startsWith("<!DOCTYPE") ||
        body.trim().startsWith("<html")
      ) {
        console.log("HTML RECEIVED (PROXY/ERROR INTERCEPTION)");
        console.log("Body preview:", body.substring(0, 200));
      } else {
        try {
          const json = JSON.parse(body);
          if (json.error) {
            console.log("API ERROR:", json.error.message);
          } else {
            console.log("SUCCESS!");
          }
        } catch (e) {
          console.log("RAW BODY:", body.substring(0, 200));
        }
      }
    } catch (err: any) {
      console.log(`FAILED FETCH ${modelName}:`, err.message);
    }
  }
}

test();
