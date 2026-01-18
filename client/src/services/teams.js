import { supabase } from '../lib/supabase';

export async function listMyTeams() {
  const { data, error } = await supabase
    .from('team_members')
    .select('role, team:teams(id, name, city, mascot, season_year, created_at)')
    .order('created_at', { ascending: false, foreignTable: 'teams' });
  if (error) throw error;
  return (data || []).map((r) => ({ ...r.team, my_role: r.role }));
}

export async function createTeam(payload) {
  const { data, error } = await supabase
    .from('teams')
    .insert([
      {
        name: payload.name,
        city: payload.city,
        mascot: payload.mascot,
        season_year: payload.season_year,
      },
    ])
    .select('id, name, city, mascot, season_year, created_at')
    .single();
  if (error) throw error;
  return data;
}

export async function getTeam(teamId) {
  const { data, error } = await supabase
    .from('teams')
    .select('id, name, city, mascot, season_year, created_at')
    .eq('id', teamId)
    .single();
  if (error) throw error;
  return data;
}

export async function getMyTeamRole(teamId) {
  const { data, error } = await supabase
    .from('team_members')
    .select('role')
    .eq('team_id', teamId)
    .eq('user_id', (await supabase.auth.getUser()).data.user?.id)
    .maybeSingle();
  if (error) throw error;
  return data?.role || null;
}