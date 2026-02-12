import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";
import { createClient } from "@supabase/supabase-js";

// Load .env from apps/api/.env
const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(__dirname, "../.env") });

const API_URL = "http://localhost:3000";
const EMAIL = process.env.TEST_EMAIL;
const PASSWORD = process.env.TEST_PASSWORD;

if (!EMAIL || !PASSWORD) {
  console.error(
    "❌ Missing TEST_EMAIL or TEST_PASSWORD in environment variables.",
  );
  console.error("Please add them to apps/api/.env or run with:");
  console.error(
    "TEST_EMAIL=... TEST_PASSWORD=... npm run test:smoke -w apps/api",
  );
  process.exit(1);
}

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY; // Use Service Role to bypass captcha/email verification if needed, OR just public key if we are testing normal login

if (!supabaseUrl || !supabaseKey) {
  console.error("❌ Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY.");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function runSmokeTest() {
  console.log("🚀 Starting Smoke Test...");
  console.log(`Target: ${API_URL}`);
  console.log(`User: ${EMAIL}`);

  // 1. Authenticate
  console.log("\n1️⃣  Authenticating with Supabase...");
  let { data: authData, error: authError } =
    await supabase.auth.signInWithPassword({
      email: EMAIL!,
      password: PASSWORD!,
    });

  if (authError || !authData.session) {
    console.log("⚠️  Login failed. Attempting to create user...");

    // Try to create the user with admin privileges (auto-confirm)
    const { data: createData, error: createError } =
      await supabase.auth.admin.createUser({
        email: EMAIL!,
        password: PASSWORD!,
        email_confirm: true,
      });

    if (createError) {
      console.error("❌ Failed to create test user:", createError.message);
      process.exit(1);
    }

    console.log("✅ User created! Retrying login...");

    // Retry login
    const loginRetry = await supabase.auth.signInWithPassword({
      email: EMAIL!,
      password: PASSWORD!,
    });

    if (loginRetry.error || !loginRetry.data.session) {
      console.error("❌ Auth Retry Failed:", loginRetry.error?.message);
      process.exit(1);
    }

    authData = loginRetry.data;
  }

  const token = authData.session!.access_token;
  const userId = authData.user!.id;
  console.log(`✅ Authenticated! (User ID: ${userId})`);

  const headers = {
    Authorization: `Bearer ${token}`,
    "Content-Type": "application/json",
  };

  // 2. Create Song
  console.log("\n2️⃣  Creating Test Song...");
  const newSong = {
    title: `Smoke Test Song ${Date.now()}`,
    artist: "Test Artist",
    tone: "C",
  };

  const createRes = await fetch(`${API_URL}/songs`, {
    method: "POST",
    headers,
    body: JSON.stringify(newSong),
  });

  if (!createRes.ok) {
    const text = await createRes.text();
    console.error(`❌ Create Song Failed (${createRes.status}):`, text);
    process.exit(1);
  }

  const createdSong = await createRes.json();
  console.log("✅ Song Created:", createdSong.id, createdSong.title);

  // 3. Get Song
  console.log("\n3️⃣  Fetching Created Song...");
  const getRes = await fetch(`${API_URL}/songs/${createdSong.id}`, {
    headers,
  });

  if (!getRes.ok) {
    console.error(`❌ Get Song Failed (${getRes.status})`);
    process.exit(1);
  }

  const fetchedSong = await getRes.json();
  if (fetchedSong.title !== newSong.title) {
    console.error("❌ Song Title Mismatch!");
    process.exit(1);
  }
  console.log("✅ Song Verified!");

  // 4. Delete Song
  console.log("\n4️⃣  Deleting Song...");
  const deleteRes = await fetch(`${API_URL}/songs/${createdSong.id}`, {
    method: "DELETE",
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  if (!deleteRes.ok) {
    const text = await deleteRes.text();
    console.error(`❌ Delete Song Failed (${deleteRes.status}):`, text);
    process.exit(1);
  }
  console.log("✅ Song Deleted!");

  console.log("\n🎉 SMOKE TEST PASSED SUCCESSFULLY!");
  process.exit(0);
}

runSmokeTest().catch((err) => {
  console.error("❌ Unexpected Error:", err);
  process.exit(1);
});
