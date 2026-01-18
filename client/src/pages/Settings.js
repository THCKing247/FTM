import React, { useEffect, useState } from 'react';
import { getMyProfile, updateMyProfile } from '../services/profiles';
import './Shared.css';

export default function Settings() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [profile, setProfile] = useState(null);
  const [displayName, setDisplayName] = useState('');

  useEffect(() => {
    (async () => {
      try {
        setLoading(true);
        const p = await getMyProfile();
        setProfile(p);
        setDisplayName(p.display_name || '');
      } catch (e) {
        setError(e.message || 'Failed to load profile');
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const handleSave = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    try {
      const updated = await updateMyProfile({ display_name: displayName });
      setProfile(updated);
      setSuccess('Saved');
    } catch (e) {
      setError(e.message || 'Save failed');
    }
  };

  if (loading) return <div className="card">Loading…</div>;

  return (
    <div className="stack">
      <div className="card">
        <div className="h1">Settings</div>
        <div className="muted">Update your profile. Team permissions are managed inside each team.</div>
      </div>

      <form className="card" onSubmit={handleSave}>
        <div className="h2">Profile</div>
        {error && <div className="alert error">{error}</div>}
        {success && <div className="alert success">{success}</div>}
        <div className="grid2">
          <label className="field">
            <span>Display name</span>
            <input value={displayName} onChange={(e) => setDisplayName(e.target.value)} placeholder="Coach K" />
          </label>
          <label className="field">
            <span>Email</span>
            <input value={profile?.email || ''} disabled />
          </label>
        </div>
        <div className="row">
          <button className="btn" type="submit">Save</button>
        </div>
      </form>
    </div>
  );
}
