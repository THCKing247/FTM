import { supabase } from '../lib/supabase';

export async function getMyProfile() {
  const { data, error } = await supabase.from('profiles').select('*').single();
  if (error) throw error;
  return data;
}

export async function updateMyProfile(patch) {
  const { data, error } = await supabase.from('profiles').update(patch).eq('id', (await supabase.auth.getUser()).data.user.id).select('*').single();
  if (error) throw error;
  return data;
}
