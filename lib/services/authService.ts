import { supabase } from '../supabaseClient';
import * as bcrypt from 'bcryptjs';

export type AdminRole = 'Super Admin' | 'Admin';

export interface CustomAdminSession {
  id: string;
  email: string;
  role: AdminRole;
  created_at: string;
}

const STORAGE_KEY = 'custom_admin_session';

export const AuthService = {
  async loginWithProfiles(email: string, password: string): Promise<CustomAdminSession> {
    const normalizedEmail = email.trim().toLowerCase();
    
    console.log('[AuthService] Login attempt', { email: normalizedEmail });
    
    const { data: profile, error } = await supabase
      .from('profiles')
      .select('id,email,role,status,password')
      .eq('email', normalizedEmail)
      .single();

    if (error || !profile) {
      console.warn('[AuthService] No matching profile found for email', {
        error,
        email: normalizedEmail,
        errorCode: error?.code,
        errorMessage: error?.message
      });
      throw new Error('Invalid email or password.');
    }

    console.log('[AuthService] Profile found', { 
      id: profile.id, 
      role: profile.role, 
      status: profile.status, 
      hasPassword: !!profile.password 
    });
    
    if (profile.status !== 'Active') {
      throw new Error('Account is inactive. Contact administrator.');
    }

    if (!profile.password) {
      throw new Error('Password not set. Please reset your password.');
    }

    // DEBUG: Test bcrypt in browser
    try {
        const testHash = await bcrypt.hash('test', 10);
        const testCompare = await bcrypt.compare('test', testHash);
        console.log('[AuthService] Bcrypt Self-Test', { testHash, testCompare });
    } catch (e) {
        console.error('[AuthService] Bcrypt Self-Test FAILED', e);
    }
    
    console.log('[AuthService] Comparing passwords', {
        inputLength: password.length,
        hashStart: profile.password.substring(0, 10),
        hashLength: profile.password.length
    });

    const matched = await bcrypt.compare(password, profile.password);
    if (!matched) {
      console.warn('[AuthService] Password mismatch for email');
      throw new Error('Invalid email or password.');
    }

    if (profile.role !== 'Admin' && profile.role !== 'Super Admin') {
      throw new Error('Access denied. Admin role required.');
    }

    const session: CustomAdminSession = {
      id: profile.id,
      email: profile.email,
      role: profile.role as AdminRole,
      created_at: new Date().toISOString()
    };

    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(session));
    return session;
  },

  getCustomSession(): CustomAdminSession | null {
    const raw = sessionStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    try {
      return JSON.parse(raw) as CustomAdminSession;
    } catch {
      return null;
    }
  },

  async logout() {
    sessionStorage.removeItem(STORAGE_KEY);
    try {
      await supabase.auth.signOut();
    } catch {
      // ignore
    }
  }
};
