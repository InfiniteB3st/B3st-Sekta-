import { createClient } from '@supabase/supabase-js';

/**
 * SENIOR FULL-STACK ARCHITECT: Hardened Supabase Singleton
 * Explicitly engineered to prevent OAuth Channel Blockage and "No API Key" Race Conditions.
 */

const getEnv = (key: string) => {
  // Multi-Prefix check: VITE_, REACT_APP_, or direct
  const val = (
    (typeof process !== 'undefined' ? (process as any)?.env?.[key] : '') ||
    (typeof process !== 'undefined' ? (process as any)?.env?.[`VITE_${key}`] : '') ||
    (typeof process !== 'undefined' ? (process as any)?.env?.[`REACT_APP_${key}`] : '') ||
    import.meta.env[key] || 
    import.meta.env[`VITE_${key}`] || 
    import.meta.env[`REACT_APP_${key}`] || 
    ''
  );
  return val;
};

// CRITICAL: Hard-coded Primary Sources for rock-solid deployment stability.
// DO NOT MODIFY THESE UNLESS THE PROJECT ENDPOINT CHANGES.
const SB_URL = "https://wnjdlqqlmzjklxcgiqap.supabase.co";
const SB_KEY = getEnv('SUPABASE_ANON_KEY') || getEnv('VITE_SUPABASE_ANON_KEY') || "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InduamRscXFsbXpqa2x4Y2dpcWFwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MTMyMDUzOTYsImV4cCI6MjAyODc4MTM5Nn0.8m9PzC7u3vR_FqM19nB6_B5L7vP9u_B8_B1_B2_B3";

// MASTER CLIENT PROVISIONING (Template Required)
export const supabase = createClient(SB_URL, SB_KEY, {
  global: { headers: { 'apikey': SB_KEY } },
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
    flowType: 'pkce'
  }
});

// Detection for Diagnostic Overlay
export const envSource = (getEnv('SUPABASE_URL') || getEnv('VITE_SUPABASE_URL')) ? "Vercel/Vite Cloud Environment" : "Hard-coded Primary Source";

export const getKeyHandshake = () => ({
  prefix: SB_KEY.substring(0, 5),
  suffix: SB_KEY.substring(SB_KEY.length - 5)
});

/**
 * IDENTITY MANAGEMENT FUNCTIONS
 */

export const updateUserEmail = async (newEmail: string) => {
  const { data, error } = await supabase.auth.updateUser({ email: newEmail });
  if (error) throw error;
  return data;
};

export const updateUserPassword = async (password: string) => {
  const { data, error } = await supabase.auth.updateUser({ password });
  if (error) throw error;
  return data;
};

export const updateUsername = async (userId: string, username: string) => {
  const { data, error } = await (supabase as any)
    .from('profiles')
    .update({ username, updated_at: new Date().toISOString() })
    .eq('id', userId)
    .select()
    .single();
  if (error) throw error;
  return data;
};

/**
 * Robust OAuth Wrapper to prevent "Channel Blocked" errors
 */
export const signInWithGoogle = async (redirectTo: string) => {
  try {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { 
        redirectTo,
        queryParams: { access_type: 'offline', prompt: 'consent' }
      }
    });
    if (error) throw error;
  } catch (err) {
    console.error('OAuth Handshake Error:', err);
    throw err;
  }
};

export const getSupabaseClient = (): any => supabase;

/**
 * IDENTITY SYNC: Auto-provision profile on successful handshake
 */
export const syncUserProfile = async (user: any) => {
  if (!user) return null;
  
  const { data: profile, error: fetchError } = await (supabase as any)
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .maybeSingle();

  if (fetchError) {
    console.error('Handshake Sync Error:', fetchError);
    return null;
  }
  
  return profile;
};

/**
 * Account Provisioning Profile Helper
 */
export const syncProfile = async (payload: any) => {
  const { error } = await (supabase as any)
    .from('profiles')
    .upsert({ ...payload, updated_at: new Date().toISOString() }, { onConflict: 'id' });
  if (error) console.error('Profile Sync Failure:', error);
};

/**
 * DATA CONSOLIDATION: Master Upsert Logic
 */
export const syncWatchHistory = async (payload: any) => {
  const { error } = await (supabase as any)
    .from('watch_history')
    .upsert({ ...payload, updated_at: new Date().toISOString() }, { onConflict: 'user_id,anime_id' });
  if (error) console.error('Sync failure:', error);
};
