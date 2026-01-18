import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { createTeam, listMyTeams } from '../services/teams';
import './Shared.css';

export default function Teams() {
  const [teams, setTeams] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [creating, setCreating] = useState(false);
  const [form, setForm] = useState({ name: '', city: '', mascot: '', season_year: new Date().getFullYear() });

  const load = async () => {
    setLoading(true);
    setError('');
    try {
      setTeams(await listMyTeams());
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const onCreate = async (e) => {
    e.preventDefault();
    setError('');
    setCreating(true);
    try {
      const team = await createTeam(form);
      setForm({ name: '', city: '', mascot: '', season_year: new Date().getFullYear() });
      setTeams((prev) => [team, ...prev]);
    } catch (e) {
      setError(e.message);
    } finally {
      setCreating(false);
    }
  };

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <h1>Teams</h1>
          <p className="muted">Create a team, invite members, manage roster and schedule.</p>
        </div>
      </div>

      <div className="grid-two">
        <div className="card">
          <h2>Create team</h2>
          <form className="form" onSubmit={onCreate}>
            <label>
              Team name
              <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Eagles" required />
            </label>
            <label>
              City / School
              <input value={form.city} onChange={(e) => setForm({ ...form, city: e.target.value })} placeholder="Central High" />
            </label>
            <label>
              Mascot
              <input value={form.mascot} onChange={(e) => setForm({ ...form, mascot: e.target.value })} placeholder="Eagles" />
            </label>
            <label>
              Season year
              <input
                type="number"
                value={form.season_year}
                onChange={(e) => setForm({ ...form, season_year: Number(e.target.value) })}
                min={1900}
                max={2100}
              />
            </label>
            {error ? <div className="alert alert-error">{error}</div> : null}
            <button className="btn" disabled={creating}>{creating ? 'Creating…' : 'Create team'}</button>
          </form>
        </div>

        <div className="card">
          <h2>My teams</h2>
          {loading ? <div className="muted">Loading…</div> : null}
          {!loading && teams.length === 0 ? <div className="muted">No teams yet. Create one to get started.</div> : null}
          <div className="list">
            {teams.map((t) => (
              <Link key={t.id} className="list-item" to={`/teams/${t.id}`}>
                <div>
                  <div className="list-title">{t.name}</div>
                  <div className="muted">{[t.city, t.mascot].filter(Boolean).join(' • ')}</div>
                </div>
                <div className="pill">{t.season_year || '—'}</div>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
