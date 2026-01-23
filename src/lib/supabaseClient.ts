import { createClient, type SupabaseClient } from "@supabase/supabase-js";

type SupabaseAuthClient = SupabaseClient;

const supabaseUrl =
  import.meta.env.VITE_SUPABASE_URL ?? "https://twyleroxrqlcrpjwpmap.supabase.co";
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const supabase: SupabaseAuthClient | null = supabaseAnonKey
  ? createClient(supabaseUrl, supabaseAnonKey)
  : null;
