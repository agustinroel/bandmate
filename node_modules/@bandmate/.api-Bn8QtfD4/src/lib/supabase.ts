import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

if (!supabaseUrl) throw new Error("SUPABASE_URL missing. Did you load dotenv?");
if (!supabaseKey)
  throw new Error("Missing Supabase key (SERVICE_ROLE_KEY or ANON_KEY).");

export const supabase = createClient(supabaseUrl, supabaseKey);
