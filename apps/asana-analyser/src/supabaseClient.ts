import { createClient } from "@supabase/supabase-js";
import { SupabaseAsanaRepository } from "@y-v2/asana-content";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseSecretKey = import.meta.env.VITE_SUPABASE_SECRET_KEY;

if (!supabaseUrl || !supabaseSecretKey) {
  throw new Error("VITE_SUPABASE_URL and VITE_SUPABASE_SECRET_KEY must be set (see .env.example)");
}

export const supabaseClient = createClient(supabaseUrl, supabaseSecretKey);
export const asanaRepository = new SupabaseAsanaRepository(supabaseClient);
