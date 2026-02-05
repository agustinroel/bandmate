import { supabase } from "../lib/supabase.js";

export type BandPayoutSettings = {
  band_id: string;
  stripe_connect_id?: string;
  payout_status: "pending" | "active";
  updated_at: string;
};

export async function getBandPayoutSettings(bandId: string) {
  const { data, error } = await supabase
    .from("band_payout_settings")
    .select("*")
    .eq("band_id", bandId)
    .maybeSingle();

  if (error) throw error;
  return data as BandPayoutSettings | null;
}

export async function upsertBandPayoutSettings(
  bandId: string,
  data: Partial<BandPayoutSettings>,
) {
  const { data: result, error } = await supabase
    .from("band_payout_settings")
    .upsert({
      band_id: bandId,
      ...data,
      updated_at: new Date().toISOString(),
    })
    .select()
    .single();

  if (error) throw error;
  return result as BandPayoutSettings;
}
