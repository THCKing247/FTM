import React, { useEffect, useMemo, useState } from 'react';
import { useParams } from 'react-router-dom';
import { getTeam } from '../services/teams';
import { addPlayer, deletePlayer, listPlayers } from '../services/players';
import { listUpcomingEvents } from '../services/schedule';
import './Shared.css';

export default function TeamProfile() {
  const { teamId } = useParams();
  const [team, setTeam] = useState(null);
  const [players, setPlayers] = useState([]);
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState('');
  const [form, setForm] = useState({
    first_name: '',
    last_name: '',
    jersey_number: '',
    position_code: 'WR',
    status: 'active',
    notes: '',
  });

  const canCreate = true; // RLS will enforce permissions

  const load = async () => {
    setLoading(true);
    setErr('');
    try {
      const t = await getTeam(teamId);
      setTeam(t);
      const [p, e] = await Promise.all([listPlayers(teamId), listUpcomingEvents(teamId, 10)]);
      setPlayers(p);
      setEvents(e);
    } catch (e) {
      setErr(e.message || 'Failed to load team');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [teamId]);

  const rosterCount = players.length;
  const activeCount = useMemo(() => players.filter((p) => p.status === 'active').length, [players]);

  const handleAddPlayer = async (e) => {
    e.preventDefault();
    setErr('');
    try {
      await addPlayer(teamId, {
        ...form,
        jersey_number: form.jersey_number ? Number(form.jersey_number) : null,
      });
      setForm({ first_name: '', last_name: '', jersey_number: '', position_code: 'WR', status: 'active', notes: '' });
      setPlayers(await listPlayers(teamId));
    } catch (e2) {
      setErr(e2.message || 'Failed to add player');
    }
  };

  const handleDelete = async (playerId) => {
    if (!window.confirm('Remove this player from the roster?')) return;
    setErr('');
    try {
      await deletePlayer(playerId);
      setPlayers((prev) => prev.filter((p) => p.id !== playerId));
    } catch (e2) {
      setErr(e2.message || 'Failed to delete player');
    }
  };

  if (loading) {
    return (
      <div className="panel">
        <div className="panel-title">Loading team…</div>
      </div>
    );
  }

  if (err) {
    return (
      <div className="panel">
        <div className="panel-title">Team</div>
        <div className="error">{err}</div>
      </div>
    );
  }

  return (
    <div className="stack">
      <div className="panel">
        <div className="panel-title">{team?.name}</div>
        <div className="muted">{[team?.city, team?.mascot].filter(Boolean).join(' • ')}{team?.season_year ? ` • ${team.season_year}` : ''}</div>

        <div className="grid-3" style={{ marginTop: 14 }}>
          <div className="stat">
            <div className="stat-label">Roster</div>
            <div className="stat-value">{rosterCount}</div>
          </div>
          <div className="stat">
            <div className="stat-label">Active</div>
            <div className="stat-value">{activeCount}</div>
          </div>
          <div className="stat">
            <div className="stat-label">Next events</div>
            <div className="stat-value">{events.length}</div>
          </div>
        </div>
      </div>

      <div className="grid-2">
        <div className="panel">
          <div className="panel-title">Roster</div>

          {players.length === 0 ? (
            <div className="muted">No players yet.</div>
          ) : (
            <div className="table">
              <div className="tr th">
                <div>#</div>
                <div>Name</div>
                <div>Pos</div>
                <div>Status</div>
                <div></div>
              </div>
              {players.map((p) => (
                <div key={p.id} className="tr">
                  <div>{p.jersey_number ?? '—'}</div>
                  <div>{p.first_name} {p.last_name}</div>
                  <div className="mono">{p.position_code}</div>
                  <div><span className={`pill ${p.status}`}>{p.status}</span></div>
                  <div style={{ textAlign: 'right' }}>
                    <button className="btn btn-danger" onClick={() => handleDelete(p.id)}>Remove</button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {canCreate && (
            <form className="form" onSubmit={handleAddPlayer} style={{ marginTop: 14 }}>
              <div className="row">
                <label>
                  First name
                  <input value={form.first_name} onChange={(e) => setForm((f) => ({ ...f, first_name: e.target.value }))} required />
                </label>
                <label>
                  Last name
                  <input value={form.last_name} onChange={(e) => setForm((f) => ({ ...f, last_name: e.target.value }))} required />
                </label>
              </div>
              <div className="row">
                <label>
                  Jersey #
                  <input value={form.jersey_number} onChange={(e) => setForm((f) => ({ ...f, jersey_number: e.target.value }))} inputMode="numeric" />
                </label>
                <label>
                  Position
                  <select value={form.position_code} onChange={(e) => setForm((f) => ({ ...f, position_code: e.target.value }))}>
                    {['QB','RB','FB','WR','TE','OL','DL','LB','CB','S','K','P','LS'].map((c) => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                </label>
                <label>
                  Status
                  <select value={form.status} onChange={(e) => setForm((f) => ({ ...f, status: e.target.value }))}>
                    <option value="active">active</option>
                    <option value="injured">injured</option>
                    <option value="inactive">inactive</option>
                  </select>
                </label>
              </div>
              <label>
                Notes
                <textarea value={form.notes} onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))} rows={2} />
              </label>
              <div className="actions">
                <button className="btn" type="submit">Add player</button>
              </div>
            </form>
          )}
        </div>

        <div className="panel">
          <div className="panel-title">Upcoming</div>
          {events.length === 0 ? (
            <div className="muted">No upcoming games or practices.</div>
          ) : (
            <div className="list">
              {events.map((ev) => (
                <div key={ev.id} className="list-item">
                  <div className="list-title">{ev.title}</div>
                  <div className="muted">{new Date(ev.start_time).toLocaleString()} • {ev.location || 'TBD'}</div>
                </div>
              ))}
            </div>
          )}
          <div style={{ marginTop: 12 }}>
            <a className="btn btn-secondary" href="/schedule">Open full schedule</a>
          </div>
        </div>
      </div>
    </div>
  );
}
