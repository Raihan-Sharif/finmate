import { createClient } from './client';

/**
 * Simplified session utilities - most logic now handled in useAuth hook
 */

export async function refreshSession() {
  const supabase = createClient();
  
  try {
    const { data: { session }, error } = await supabase.auth.refreshSession();
    
    if (error) {
      console.error('Session refresh error:', error);
      return { session: null, error };
    }
    
    return { session, error: null };
  } catch (error) {
    console.error('Unexpected session refresh error:', error);
    return { session: null, error };
  }
}

export async function getCurrentSession() {
  const supabase = createClient();
  
  try {
    const { data: { session }, error } = await supabase.auth.getSession();
    
    if (error) {
      console.error('Error getting session:', error);
      return null;
    }
    
    return session;
  } catch (error) {
    console.error('Error getting session:', error);
    return null;
  }
}