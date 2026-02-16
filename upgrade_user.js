import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: './apps/api/.env' });

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase config');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

const userId = '30c0dae0-84e2-4754-b57a-4d777f669e8d';
const { error } = await supabase
  .from('profiles')
  .update({ subscription_tier: 'pro' })
  .eq('id', userId);

if (error) {
  console.error('Error updating profile:', error);
  process.exit(1);
}

console.log('Successfully upgraded user to PRO');
