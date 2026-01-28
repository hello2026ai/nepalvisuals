import { createClient } from '@supabase/supabase-js';
import { supabase } from '../supabaseClient';
import * as bcrypt from 'bcryptjs';

// Create a separate admin client for user management
// WARNING: This requires the Service Role Key to be exposed in .env
// This is acceptable for local development/admin demos but NOT for production client-side apps.
const serviceRoleKey = import.meta.env.VITE_SUPABASE_SERVICE_ROLE_KEY;
const supabaseAdmin = serviceRoleKey 
  ? createClient(import.meta.env.VITE_SUPABASE_URL, serviceRoleKey)
  : null;

export interface UserProfile {
  id: string;
  email: string;
  full_name: string | null;
  avatar_url: string | null;
  role: 'Admin' | 'Customer' | 'Guide';
  status: 'Active' | 'Inactive' | 'Banned';
  created_at: string;
  updated_at: string;
  password?: string | null;
}

export const UserService = {
  async getAllUsers() {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .order('created_at', { ascending: false });
    
    if (error) throw error;
    return data as UserProfile[];
  },

  async getUserById(id: string) {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', id)
      .single();
    
    if (error) throw error;
    return data as UserProfile;
  },

  async createUser(user: Partial<UserProfile>, password?: string) {
    if (!supabaseAdmin) {
      throw new Error('Admin privileges required. Service Role Key not configured.');
    }

    const email = user.email ? user.email.trim().toLowerCase() : '';
    if (!email) throw new Error('Email is required');

    // 1. Create user in Supabase Auth (this generates the UUID)
    // We use admin.createUser to avoid signing in as the new user
    const { data: authUser, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email: email,
      password: password || 'tempPass123!', // Auth requires a password, even if we verify via profiles
      email_confirm: true,
      user_metadata: { full_name: user.full_name }
    });

    if (authError) {
      console.error('Auth creation failed:', authError);
      throw new Error(authError.message);
    }

    if (!authUser.user) {
      throw new Error('User creation failed: No user returned');
    }

    // 2. Prepare Profile Payload
    // Note: The 'profiles' table might have a trigger that auto-inserts rows on auth.users insert.
    // We try to upsert (insert or update) to handle both cases.
    const payload: Partial<UserProfile> = { 
      ...user,
      id: authUser.user.id, // CRITICAL: Use the ID from Auth
      email: email
    };
    
    if (password && password.trim().length > 0) {
      try {
        const hash = await bcrypt.hash(password, 12);
        payload.password = hash;
      } catch (err) {
        console.error('Password hashing failed:', err);
        // We continue, but password won't be in profile (auth has it though)
      }
    }

    const { data, error } = await supabase
      .from('profiles')
      .upsert(payload) // Upsert to handle potential triggers
      .select()
      .single();
    
    if (error) throw error;
    return data as UserProfile;
  },

  async updateUser(id: string, updates: Partial<UserProfile>, newPassword?: string) {
    // Remove 'password' from updates to avoid accidentally setting it to null/empty
    // if it was present in the updates object (e.g. from state)
    const { password: _ignored, ...cleanUpdates } = updates;
    
    const payload: Partial<UserProfile> = { 
      ...cleanUpdates,
      email: cleanUpdates.email ? cleanUpdates.email.trim().toLowerCase() : cleanUpdates.email,
      updated_at: new Date().toISOString() 
    };

    if (newPassword && newPassword.trim().length > 0) {
      try {
        const hash = await bcrypt.hash(newPassword, 12);
        payload.password = hash;
      } catch (err) {
        console.error('Password hashing failed:', err);
        throw new Error('Failed to secure password');
      }
    }

    const { data, error } = await supabase
      .from('profiles')
      .update(payload)
      .eq('id', id)
      .select()
      .single();
    
    if (error) throw error;
    return data as UserProfile;
  },

  async deleteUser(id: string) {
    const { error } = await supabase
      .from('profiles')
      .delete()
      .eq('id', id);
    
    if (error) throw error;
  }
};
