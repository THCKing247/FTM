import { supabase } from '../lib/supabase';

export async function listUpcomingEvents(teamId, limit = 25) {
  // Games + Practices in one list (client-side merge)
  const [{ data: games, error: gErr }, { data: practices, error: pErr }] = await Promise.all([
    supabase
      .from('games')
      .select('id, start_time, location, status, home_away, game_type, team_score, opponent_score, opponent:opponents(name)')
      .eq('team_id', teamId)
      .gte('start_time', new Date().toISOString())
      .order('start_time', { ascending: true })
      .limit(limit),
    supabase
      .from('practices')
      .select('id, start_time, end_time, location, focus, notes')
      .eq('team_id', teamId)
      .gte('start_time', new Date().toISOString())
      .order('start_time', { ascending: true })
      .limit(limit),
  ]);

  if (gErr) throw gErr;
  if (pErr) throw pErr;

  const items = [
    ...(games || []).map((g) => ({
      kind: 'game',
      id: g.id,
      start_time: g.start_time,
      opponent_name: g.opponent?.name || 'Opponent',
      title: `${g.home_away === 'home' ? 'vs' : '@'} ${g.opponent?.name || 'Opponent'}`,
      subtitle: `${g.game_type} • ${g.status}`,
      location: g.location,
    })),
    ...(practices || []).map((p) => ({
      kind: 'practice',
      id: p.id,
      start_time: p.start_time,
      focus: p.focus || '',
      title: 'Practice',
      subtitle: p.focus || '',
      location: p.location,
    })),
  ];

  items.sort((a, b) => new Date(a.start_time) - new Date(b.start_time));
  return items;
}

export async function addPractice(teamId, payload) {
  const { data, error } = await supabase
    .from('practices')
    .insert({ team_id: teamId, ...payload })
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function addGame(teamId, payload) {
  // payload: { opponent_name, start_time, location, home_away, game_type }
  const opponentName = (payload.opponent_name || '').trim();
  let opponent_id = null;
  if (opponentName) {
    // Upsert-ish by name (case-insensitive match)
    const { data: found, error: fErr } = await supabase
      .from('opponents')
      .select('id')
      .ilike('name', opponentName)
      .limit(1);
    if (fErr) throw fErr;
    opponent_id = found?.[0]?.id || null;
    if (!opponent_id) {
      const { data: created, error: cErr } = await supabase
        .from('opponents')
        .insert({ name: opponentName })
        .select('id')
        .single();
      if (cErr) throw cErr;
      opponent_id = created.id;
    }
  }

  const { data, error } = await supabase
    .from('games')
    .insert({
      team_id: teamId,
      opponent_id,
      start_time: payload.start_time,
      location: payload.location || null,
      home_away: payload.home_away || 'home',
      game_type: payload.game_type || 'regular',
      status: 'scheduled',
    })
    .select()
    .single();
  if (error) throw error;
  return data;
}
