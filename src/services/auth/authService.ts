import { supabase } from '../supabase/client';

export async function signUpWithEmail(
  name: string,
  phone: string,
  email: string,
  password: string,
) {
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        name,
        phone,
      },
    },
  });

  if (error) {
    throw error;
  }

  return data;
}

export async function signInWithEmail(
  email: string,
  password: string,
) {
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) {
    throw error;
  }

  return data;
}

export async function signOut() {
  const { error } = await supabase.auth.signOut();

  if (error) {
    throw error;
  }
}

export async function getCurrentSession() {
  const {
    data,
    error,
  } = await supabase.auth.getSession();

  if (error) {
    throw error;
  }

  return data.session;
}