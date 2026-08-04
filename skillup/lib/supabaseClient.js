import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const hasSupabaseConfig = Boolean(supabaseUrl && supabaseAnonKey);

function missingSupabaseError() {
  return new Error("Supabase is not configured for this environment. Set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY in Vercel.");
}

const fallbackSupabase = {
  auth: {
    getSession: async () => ({ data: { session: null } }),
    onAuthStateChange: () => ({ data: { subscription: { unsubscribe: () => {} } } }),
    signInWithPassword: async () => ({ data: null, error: missingSupabaseError() }),
    signUp: async () => ({ data: null, error: missingSupabaseError() }),
  },
  from: () => {
    throw missingSupabaseError();
  },
};

export const supabase = hasSupabaseConfig ? createClient(supabaseUrl, supabaseAnonKey) : fallbackSupabase;
