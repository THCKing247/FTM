import React, { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import './Login.css';

export default function Login() {
  const { signIn, signUp, user } = useAuth();
  const navigate = useNavigate();
  const [mode, setMode] = useState('signin'); // 'signin' | 'signup'
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const title = useMemo(() => (mode === 'signin' ? 'Sign in' : 'Create account'), [mode]);

  React.useEffect(() => {
    if (user) navigate('/dashboard');
  }, [user, navigate]);

  const submit = async (e) => {
    e.preventDefault();
    setError('');
    setBusy(true);
    try {
      const result = mode === 'signin'
        ? await signIn(email.trim(), password)
        : await signUp(email.trim(), password, displayName.trim());

      if (!result.success) {
        setError(result.error || 'Something went wrong');
        return;
      }

      // If email confirmations are enabled, the session may not start immediately.
      navigate('/dashboard');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="login-wrap">
      <div className="login-card">
        <div className="login-header">
          <div className="login-brand">Football Manager</div>
          <div className="login-sub">Run your roster, schedule, and stats in one place.</div>
        </div>

        <div className="mode-toggle">
          <button
            className={mode === 'signin' ? 'pill active' : 'pill'}
            onClick={() => setMode('signin')}
            type="button"
          >
            Sign in
          </button>
          <button
            className={mode === 'signup' ? 'pill active' : 'pill'}
            onClick={() => setMode('signup')}
            type="button"
          >
            Sign up
          </button>
        </div>

        <form onSubmit={submit} className="login-form">
          <h2>{title}</h2>

          {mode === 'signup' && (
            <label>
              Display name
              <input value={displayName} onChange={(e) => setDisplayName(e.target.value)} placeholder="Coach K" />
            </label>
          )}

          <label>
            Email
            <input value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@email.com" type="email" />
          </label>

          <label>
            Password
            <input value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" type="password" />
          </label>

          {error && <div className="error">{error}</div>}

          <button className="btn" disabled={busy}>
            {busy ? 'Working…' : title}
          </button>

          {mode === 'signup' && (
            <p className="hint">
              If your project has email confirmation enabled, you may need to confirm your email before signing in.
            </p>
          )}
        </form>
      </div>
    </div>
  );
}
