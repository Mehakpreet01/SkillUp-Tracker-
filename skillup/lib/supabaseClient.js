import { createClient } from "@supabase/supabase-js";

function resolveSupabaseConfig() {
  const runtimeSupabaseConfig =
    typeof window !== "undefined" && window.__SUPABASE_CONFIG__
      ? window.__SUPABASE_CONFIG__
      : null;

  const supabaseUrl = runtimeSupabaseConfig?.url || process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = runtimeSupabaseConfig?.anonKey || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  return {
    supabaseUrl,
    supabaseAnonKey,
    hasSupabaseConfig: Boolean(supabaseUrl && supabaseAnonKey),
    hasSupabaseUrl: Boolean(supabaseUrl),
    hasSupabaseAnonKey: Boolean(supabaseAnonKey),
  };
}

export const supabaseConfigStatus = {
  get hasSupabaseConfig() {
    return resolveSupabaseConfig().hasSupabaseConfig;
  },
  get hasSupabaseUrl() {
    return resolveSupabaseConfig().hasSupabaseUrl;
  },
  get hasSupabaseAnonKey() {
    return resolveSupabaseConfig().hasSupabaseAnonKey;
  },
};

function missingSupabaseError() {
  return new Error("Supabase is not configured for this environment. Set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY in Vercel.");
}

function createFallbackSupabase() {
  return {
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
}

let cachedSupabaseClient = null;

function resolveSupabaseClient() {
  const { supabaseUrl, supabaseAnonKey, hasSupabaseConfig } = resolveSupabaseConfig();

  if (!hasSupabaseConfig) {
    return createFallbackSupabase();
  }

  if (!cachedSupabaseClient) {
    cachedSupabaseClient = createClient(supabaseUrl, supabaseAnonKey);
  }

  return cachedSupabaseClient;
}

export const supabase = new Proxy({}, {
  get(_target, property) {
    const client = resolveSupabaseClient();
    const value = client[property];
    return typeof value === "function" ? value.bind(client) : value;
  },
});
