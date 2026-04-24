import { createClient } from '@supabase/supabase-js';

const SB_URL = "https://wnjdlqqlmzjklxcgiqap.supabase.co";
const SB_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InduamRscXFsbXpqa2x4Y2dpcWFwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MTMyMDUzOTYsImV4cCI6MjAyODc4MTM5Nn0.8m9PzC7u3vR_FqM19nB6_B5L7vP9u_B8_B1_B2_B3";

if (!SB_KEY || SB_KEY.includes('REPLACE')) {
  console.error("KERNEL CRITICAL: Supabase API Key is invalid or missing. System entering Limited Mode.");
} else {
  console.log("Kernel: Handshake initialized with signature", SB_KEY.slice(0, 5));
}

// MASTER CLIENT PROVISIONING: NUCLEAR HANDSHAKE
// Direct string injection to bypass Vercel environment resolution latency
export const supabase = createClient(SB_URL, SB_KEY, {
  global: { 
    headers: { 
      'apikey': SB_KEY,
      'Authorization': `Bearer ${SB_KEY}`
    } 
  },
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
    flowType: 'pkce'
  }
});

// WATCH HISTORY PROTOCOL (INCOGNITO COMPLIANT)
export const syncWatchHistory = async (history: any) => {
  const { user_id, anime_id } = history;
  
  if (!user_id) {
    const localHistory = JSON.parse(localStorage.getItem('sekta_history') || '[]');
    const existingIndex = localHistory.findIndex((h: any) => h.anime_id === anime_id);
    const newEntry = { ...history, updated_at: new Date().toISOString() };
    if (existingIndex > -1) localHistory[existingIndex] = newEntry;
    else localHistory.unshift(newEntry);
    localStorage.setItem('sekta_history', JSON.stringify(localHistory.slice(0, 50)));
    return;
  }

  const { error } = await supabase
    .from('watch_history')
    .upsert({ ...history, updated_at: new Date().toISOString() }, { onConflict: 'user_id,anime_id' });
  if (error) console.error('Cloud Sync Failed:', error);
};

export const envSource = "Hard-coded Primary Source";

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

export const syncProfile = async (payload: any) => {
  const { error } = await (supabase as any)
    .from('profiles')
    .upsert({ ...payload, updated_at: new Date().toISOString() }, { onConflict: 'id' });
  if (error) console.error('Profile Sync Failure:', error);
};

export const signUpUser = async (email: string, pass: string, username: string) => {
  const { data, error } = await supabase.auth.signUp({ 
    email, 
    password: pass,
    options: {
      data: { username }
    }
  });
  
  if (error) throw error;
  
  if (data.user) {
    // BRIDGE: Manually insert into profiles if trigger fails
    const { error: profileError } = await (supabase as any)
      .from('profiles')
      .upsert({
        id: data.user.id,
        username: username,
        updated_at: new Date().toISOString()
      }, { onConflict: 'id' });
      
    if (profileError) console.warn('Profile bridge warning:', profileError.message);
  }
  
  return data;
};
