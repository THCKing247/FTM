import { supabase } from '../lib/supabase';

export async function listPlayers(teamId) {
  const { data, error } = await supabase
    .from('players')
    .select('id, first_name, last_name, jersey_number, position_code, status, notes, created_at')
    .eq('team_id', teamId)
    .order('jersey_number', { ascending: true, nullsFirst: false });
  if (error) throw error;
  return data || [];
}

export async function addPlayer(teamId, player) {
  const payload = {
    team_id: teamId,
    first_name: player.first_name.trim(),
    last_name: player.last_name.trim(),
    jersey_number: player.jersey_number === '' ? null : Number(player.jersey_number),
    position_code: player.position_code || null,
    status: player.status || 'active',
    notes: player.notes || null,
  };

  const { data, error } = await supabase.from('players').insert(payload).select('*').single();
  if (error) throw error;
  return data;
}

export async function deletePlayer(playerId) {
  const { error } = await supabase.from('players').delete().eq('id', playerId);
  if (error) throw error;
}