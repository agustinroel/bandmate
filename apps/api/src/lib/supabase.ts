import { createClient, SupabaseClient } from "@supabase/supabase-js";
import dotenv from "dotenv";

dotenv.config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey =
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY;

export const hasSupabase = Boolean(supabaseUrl && supabaseKey);

// Use real credentials if present; otherwise fallback to safe placeholder to prevent import-time crashes in test runners
export const supabase: SupabaseClient = hasSupabase
  ? createClient(supabaseUrl!, supabaseKey!)
  : createClient(
      "https://placeholder.supabase.co",
      "placeholder-key-for-offline-and-tests"
    );
