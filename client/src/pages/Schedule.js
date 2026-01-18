import React, { useEffect, useMemo, useState } from 'react';
import { listMyTeams } from '../services/teams';
import { addGame, addPractice, listUpcomingEvents } from '../services/schedule';
import './Shared.css';

export default function Schedule() {
  const [teams, setTeams] = useState([]);
  const [teamId, setTeamId] = useState('');
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [formKind, setFormKind] = useState('game');
  const [game, setGame] = useState({
    opponent_name: '',
    home_away: 'home',
    start_time: '',
    location: '',
    game_type: 'regular',
    notes: '',
  });
  const [practice, setPractice] = useState({
    start_time: '',
    end_time: '',
    location: '',
    focus: '',
    notes: '',
  });

  const selectedTeam = useMemo(() => teams.find((t) => t.id === teamId) || null, [teams, teamId]);

  useEffect(() => {
    (async () => {
      try {
        setLoading(true);
        const t = await listMyTeams();
        setTeams(t);
        if (t[0]?.id) setTeamId(t[0].id);
      } catch (e) {
        setError(e.message || 'Failed to load teams');
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  useEffect(() => {
    (async () => {
      if (!teamId) return;
      try {
        setError('');
        const upcoming = await listUpcomingEvents(teamId, 50);
        setEvents(upcoming);
      } catch (e) {
        setError(e.message || 'Failed to load schedule');
      }
    })();
  }, [teamId]);

  const onCreate = async (e) => {
    e.preventDefault();
    if (!teamId) return;
    try {
      setError('');
      if (formKind === 'game') {
        if (!game.opponent_name.trim()) throw new Error('Opponent name is required');
        if (!game.start_time) throw new Error('Game date/time is required');
        await addGame(teamId, game);
        setGame({ opponent_name: '', home_away: 'home', start_time: '', location: '', game_type: 'regular', notes: '' });
      } else {
        if (!practice.start_time) throw new Error('Practice start date/time is required');
        await addPractice(teamId, practice);
        setPractice({ start_time: '', end_time: '', location: '', focus: '', notes: '' });
      }
      const upcoming = await listUpcomingEvents(teamId, 50);
      setEvents(upcoming);
    } catch (e2) {
      setError(e2.message || 'Failed to create');
    }
  };

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <h1>Schedule</h1>
          <div className="muted">Games and practices for your selected team.</div>
        </div>

        <div className="row gap">
          <select className="input" value={teamId} onChange={(e) => setTeamId(e.target.value)} disabled={loading || teams.length === 0}>
            {teams.length === 0 ? (
              <option value="">No teams yet</option>
            ) : (
              teams.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.name} ({t.season_year || 'Season'})
                </option>
              ))
            )}
          </select>
        </div>
      </div>

      {error && <div className="alert error">{error}</div>}

      <div className="grid-2">
        <div className="card">
          <div className="card-title">Upcoming</div>
          {loading ? (
            <div className="muted">Loading...</div>
          ) : events.length === 0 ? (
            <div className="muted">Nothing scheduled yet.</div>
          ) : (
            <ul className="list">
              {events.map((ev) => (
                <li key={`${ev.kind}-${ev.id}`} className="list-row">
                  <div>
                    <div className="strong">
                      {ev.kind === 'game' ? `Game vs ${ev.opponent_name}` : `Practice${ev.focus ? ` — ${ev.focus}` : ''}`}
                    </div>
                    <div className="muted">{new Date(ev.start_time).toLocaleString()} • {ev.location || 'TBD'}</div>
                  </div>
                  <div className="pill">{ev.kind}</div>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="card">
          <div className="card-title">Add to schedule</div>
          {!selectedTeam ? (
            <div className="muted">Select or create a team first.</div>
          ) : (
            <>
              <div className="row gap" style={{ marginBottom: 10 }}>
                <button className={formKind === 'game' ? 'btn' : 'btn btn-secondary'} onClick={() => setFormKind('game')}>Game</button>
                <button className={formKind === 'practice' ? 'btn' : 'btn btn-secondary'} onClick={() => setFormKind('practice')}>Practice</button>
              </div>

              <form onSubmit={onCreate}>
                {formKind === 'game' ? (
                  <>
                    <div className="grid-2">
                      <label className="field">
                        <span>Opponent</span>
                        <input className="input" value={game.opponent_name} onChange={(e) => setGame((p) => ({ ...p, opponent_name: e.target.value }))} placeholder="e.g., Ridgeview High" />
                      </label>
                      <label className="field">
                        <span>Home/Away</span>
                        <select className="input" value={game.home_away} onChange={(e) => setGame((p) => ({ ...p, home_away: e.target.value }))}>
                          <option value="home">Home</option>
                          <option value="away">Away</option>
                        </select>
                      </label>
                    </div>
                    <div className="grid-2">
                      <label className="field">
                        <span>Date & time</span>
                        <input className="input" type="datetime-local" value={game.start_time} onChange={(e) => setGame((p) => ({ ...p, start_time: e.target.value }))} />
                      </label>
                      <label className="field">
                        <span>Type</span>
                        <select className="input" value={game.game_type} onChange={(e) => setGame((p) => ({ ...p, game_type: e.target.value }))}>
                          <option value="regular">Regular</option>
                          <option value="scrimmage">Scrimmage</option>
                          <option value="playoff">Playoff</option>
                        </select>
                      </label>
                    </div>
                    <label className="field">
                      <span>Location</span>
                      <input className="input" value={game.location} onChange={(e) => setGame((p) => ({ ...p, location: e.target.value }))} placeholder="Stadium / Field" />
                    </label>
                    <label className="field">
                      <span>Notes</span>
                      <textarea className="input" rows={3} value={game.notes} onChange={(e) => setGame((p) => ({ ...p, notes: e.target.value }))} />
                    </label>
                  </>
                ) : (
                  <>
                    <div className="grid-2">
                      <label className="field">
                        <span>Start</span>
                        <input className="input" type="datetime-local" value={practice.start_time} onChange={(e) => setPractice((p) => ({ ...p, start_time: e.target.value }))} />
                      </label>
                      <label className="field">
                        <span>End</span>
                        <input className="input" type="datetime-local" value={practice.end_time} onChange={(e) => setPractice((p) => ({ ...p, end_time: e.target.value }))} />
                      </label>
                    </div>
                    <label className="field">
                      <span>Location</span>
                      <input className="input" value={practice.location} onChange={(e) => setPractice((p) => ({ ...p, location: e.target.value }))} />
                    </label>
                    <label className="field">
                      <span>Focus</span>
                      <input className="input" value={practice.focus} onChange={(e) => setPractice((p) => ({ ...p, focus: e.target.value }))} placeholder="Install, conditioning, special teams…" />
                    </label>
                    <label className="field">
                      <span>Notes</span>
                      <textarea className="input" rows={3} value={practice.notes} onChange={(e) => setPractice((p) => ({ ...p, notes: e.target.value }))} />
                    </label>
                  </>
                )}

                <button className="btn" type="submit" style={{ marginTop: 8 }}>Create</button>
              </form>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
