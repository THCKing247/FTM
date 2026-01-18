import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import './Navigation.css';

export default function Navigation({ children }) {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();

  const handleSignOut = async () => {
    await signOut();
    navigate('/login');
  };

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div className="brand">
          <div className="brand-title">Football Manager</div>
          <div className="brand-subtitle">Teams • Roster • Schedule</div>
        </div>

        <nav className="nav">
          <NavLink to="/dashboard" className={({ isActive }) => (isActive ? 'nav-link active' : 'nav-link')}>Dashboard</NavLink>
          <NavLink to="/teams" className={({ isActive }) => (isActive ? 'nav-link active' : 'nav-link')}>Teams</NavLink>
          <NavLink to="/schedule" className={({ isActive }) => (isActive ? 'nav-link active' : 'nav-link')}>Schedule</NavLink>
          <NavLink to="/settings" className={({ isActive }) => (isActive ? 'nav-link active' : 'nav-link')}>Settings</NavLink>
        </nav>

        <div className="sidebar-footer">
          <div className="user-chip">
            <div className="user-email">{user?.email}</div>
          </div>
          <button className="btn btn-secondary" onClick={handleSignOut}>Sign out</button>
        </div>
      </aside>

      <main className="main">
        <div className="content">{children}</div>
      </main>
    </div>
  );
}
