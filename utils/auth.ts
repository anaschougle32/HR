import { Router } from 'expo-router';
import { supabase } from '../lib/supabase';

export const signOut = async (router: Router) => {
  try {
    await supabase.auth.signOut();
    router.replace('/(auth)/login');
  } catch (error) {
    console.error('Error signing out:', error);
  }
};

export const refreshUserSession = async () => {
  try {
    const { data, error } = await supabase.auth.refreshSession();
    if (error) {
      console.error('Session refresh error:', error);
      return null;
    }
    return data;
  } catch (error) {
    console.error('Error refreshing session:', error);
    return null;
  }
};

export const signOutAndSignIn = async (email: string, password: string) => {
  try {
    await supabase.auth.signOut();
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    if (error) throw error;
    return data.session;
  } catch (error) {
    console.error('Error during re-authentication:', error);
    throw error;
  }
};

export const forceUpdateUserRole = async (email: string, role: string) => {
  try {
    const { data: { user }, error } = await supabase.auth.updateUser({
      data: { role }
    });
    if (error) throw error;
    await refreshUserSession();
    return user;
  } catch (error) {
    console.error('Error updating user role:', error);
    throw error;
  }
}; 