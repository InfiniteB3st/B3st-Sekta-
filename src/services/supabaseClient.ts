import { createClient } from '@supabase/supabase-js';

/**
 * SENIOR FULL-STACK ARCHITECT: Hardened Supabase Singleton
 * Explicitly engineered to prevent OAuth Channel Blockage and "No API Key" Race Conditions.
 */

const SB_URL = "https://wnjdlqqlmzjklxcgiqap.supabase.co";
const SB_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InduamRscXFsbXpqa2x4Y2dpcWFwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MTMyMDUzOTYsImV4cCI6MjAyODc4MTM5Nn0.8m9PzC7u3vR_FqM19nB6_B5L7vP9u_B8_B1_B2_B3";

// Singleton Instance Holder
let instance: ReturnType<typeof createClient> | null = null;

/**
 * Get the hardened Supabase Client instance.
 * Ensures the handshake is always performed with forced headers.
 */
export const getSupabase = (): any => {
  if (!instance) {
    instance = createClient(SB_URL, SB_KEY, {
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
  }
  return instance;
};

// EXPORT THE MASTER CLIENT
export const supabase = getSupabase();

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

  if (!profile && !fetchError) {
    console.log("IDENTITY PROTECOL: Auto-generating profile for new node:", user.id);
    const { data: newProfile, error: createError } = await (supabase as any)
      .from('profiles')
      .upsert({
        id: user.id,
        username: user.user_metadata?.full_name || user.email?.split('@')[0] || 'sekta_member',
        email: user.email,
        accent_color: '#ffb100', // Default HiAnime Yellow
        avatar_url: user.user_metadata?.avatar_url || 'https://i.imgur.com/Heuy9Y8.png',
        updated_at: new Date().toISOString()
      }, { onConflict: 'id' })
      .select()
      .single();
    
    if (createError) console.error('Profile Provisioning Failed:', createError);
    return newProfile;
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
