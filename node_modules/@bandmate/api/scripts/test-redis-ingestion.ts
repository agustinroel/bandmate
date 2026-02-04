
import "dotenv/config";
import { Redis } from "ioredis";
import { supabase } from "../src/lib/supabase.js";
import { addToIngestionQueue } from "../src/services/ingestion-queue.service.js";

const REDIS_URL = process.env.REDIS_URL || "redis://127.0.0.1:6379";

async function run() {
  console.log("🚀 Starting Redis Ingestion Test...");

  // 1. Clear Redis Queue
  console.log("🧹 Clearing Redis 'ingestion-queue'...");
  const redis = new Redis(REDIS_URL);
  await redis.del("bull:ingestion-queue:id");
  await redis.del("bull:ingestion-queue:jobs"); 
  await redis.del("bull:ingestion-queue:wait");
  await redis.del("bull:ingestion-queue:active");
  await redis.del("bull:ingestion-queue:completed");
  await redis.del("bull:ingestion-queue:failed");
  await redis.del("bull:ingestion-queue:delayed");
  await redis.del("bull:ingestion-queue:prioritized");
    // Or just flushdb if we are sure it's isolated, but be safer with keys
  
  // Also flush keys that might be standard for BullMQ if prefix is default
  const keys = await redis.keys("bull:ingestion-queue*");
  if (keys.length > 0) {
      await redis.del(...keys);
      console.log(`   Deleted ${keys.length} Redis keys.`);
  } else {
      console.log("   No Redis keys found for queue.");
  }
  
  await redis.quit();
  console.log("✅ Redis cleared.");

  // 2. Clear Database
  console.log("🧹 Clearing Database (songs, works, arrangements)...");
  
  // Deleting arrangements first due to foreign keys
  const { error: err1 } = await supabase.from("arrangements").delete().neq("id", "00000000-0000-0000-0000-000000000000"); // Delete all
  if (err1) console.error("Error clearing arrangements:", err1);
  else console.log("   Arrangements cleared.");

  // Delete song_works
  const { error: err2 } = await supabase.from("song_works").delete().neq("id", "00000000-0000-0000-0000-000000000000");
  if (err2) console.error("Error clearing song_works:", err2);
  else console.log("   Works cleared.");

  // Delete songs (legacy table if used, but looks like 'song_works' is the main one now from seed files)
  // Checking if 'songs' table exists/is used. Seed-songs.ts used 'songs'.
   const { error: err3 } = await supabase.from("songs").delete().neq("id", "00000000-0000-0000-0000-000000000000"); 
   if (err3) {
       // Ignore if table doesn't exist or is not critical
       console.log("   (Optional) Songs table clear result:", err3.message);
   } else {
       console.log("   Songs table cleared.");
   }

  console.log("✅ Database cleared.");

  // 3. Trigger Ingestion
  console.log("📥 Triggering Ingestion for 'Adele'...");
  const userId = "test-user-id"; // Mock user ID
  
  await addToIngestionQueue({
    type: "ingest-artist",
    payload: { artist: "Adele" },
    userId,
  });

  console.log("⏳ Task queued! Keeping process alive to allow worker (if running) or verifying queue...");
  
  // NOTE: ingestion-queue.service.ts starts the worker immediately upon import.
  // So we just need to wait a bit.
  
  // Let's monitor the queue counts or just keep alive for 30s
  const monitorRedis = new Redis(REDIS_URL);
  
  for (let i = 0; i < 30; i++) {
     await new Promise(r => setTimeout(r, 1000));
     // Maybe print status?
  }
  
  console.log("🏁 Test script finished waiting. Check logs above for worker output.");
  await monitorRedis.quit();
  process.exit(0);
}

run().catch((e) => {
  console.error("❌ Test failed:", e);
  process.exit(1);
});
