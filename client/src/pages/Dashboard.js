import React, { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { listMyTeams } from '../services/teams';
import { listUpcomingEvents } from '../services/schedule';
import './Shared.css';

export default function Dashboard() {
  const [teams, setTeams] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedTeamId, setSelectedTeamId] = useState('');
  const [events, setEvents] = useState([]);
  const [error, setError] = useState('');

  useEffect(() => {
    (async () => {
      try {
        setLoading(true);
        setError('');
        const rows = await listMyTeams();
        setTeams(rows);
        setSelectedTeamId((prev) => prev || rows?.[0]?.id || '');
      } catch (e) {
        setError(e.message || String(e));
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  useEffect(() => {
    if (!selectedTeamId) {
      setEvents([]);
      return;
    }
    (async () => {
      try {
        const upcoming = await listUpcomingEvents(selectedTeamId);
        setEvents(upcoming);
      } catch {
        // non-blocking
      }
    })();
  }, [selectedTeamId]);

  const selected = useMemo(
    () => teams.find((t) => t.id === selectedTeamId) || null,
    [teams, selectedTeamId]
  );

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <h1>Dashboard</h1>
          <p className="muted">Quick snapshot of your roster and upcoming events.</p>
        </div>
        <div className="row gap">
          <Link className="btn" to="/teams">Manage teams</Link>
          <Link className="btn btn-secondary" to="/schedule">Open schedule</Link>
        </div>
      </div>

      {error && <div className="alert alert-error">{error}</div>}

      <div className="card">
        <div className="row space-between wrap">
          <div>
            <div className="label">Active team</div>
            <select
              className="select"
              value={selectedTeamId}
              onChange={(e) => setSelectedTeamId(e.target.value)}
              disabled={loading || teams.length === 0}
            >
              {teams.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.name} ({t.season_year})
                </option>
              ))}
            </select>
          </div>
          {selected && (
            <div className="kpi">
              <div className="kpi-title">{selected.city || '—'} {selected.mascot || ''}</div>
              <div className="kpi-sub">Season {selected.season_year}</div>
            </div>
          )}
        </div>
      </div>

      <div className="grid-2">
        <div className="card">
          <h2>My teams</h2>
          {loading ? (
            <div className="muted">Loading…</div>
          ) : teams.length ? (
            <div className="list">
              {teams.map((t) => (
                <Link key={t.id} className="list-item" to={`/teams/${t.id}`}>
                  <div>
                    <div className="list-title">{t.name}</div>
                    <div className="muted">{t.city || '—'} • {t.season_year}</div>
                  </div>
                  <div className="badge">{t.my_role}</div>
                </Link>
              ))}
            </div>
          ) : (
            <div className="muted">No teams yet. Create one in Teams.</div>
          )}
        </div>

        <div className="card">
          <h2>Upcoming</h2>
          {selectedTeamId ? (
            events.length ? (
              <div className="list">
                {events.map((ev) => (
                  <div key={`${ev.kind}-${ev.id}`} className="list-item">
                    <div>
                      <div className="list-title">{ev.title}</div>
                      <div className="muted">
                        {new Date(ev.start_time).toLocaleString()} • {ev.location || 'TBD'}
                      </div>
                    </div>
                    <div className="badge">{ev.kind}</div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="muted">No upcoming games or practices.</div>
            )
          ) : (
            <div className="muted">Pick a team to see upcoming events.</div>
          )}
        </div>
      </div>
    </div>
  );
}
