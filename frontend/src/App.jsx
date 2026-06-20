import { useState } from 'react';
import { useAuth } from './context/AuthContext.jsx';
import AuthForm from './components/AuthForm.jsx';
import EventList from './components/EventList.jsx';
import EventDetail from './components/EventDetail.jsx';

export default function App() {
  const { user, loading, logout } = useAuth();
  const [activeEventId, setActiveEventId] = useState(null);

  if (loading) {
    return <div className="muted center full">Loading…</div>;
  }

  if (!user) {
    return <AuthForm />;
  }

  return (
    <div className="app">
      <header className="topbar">
        <h1 className="brand small" onClick={() => setActiveEventId(null)}>
          Sort<span>My</span>Scene
        </h1>
        <div className="topbar-right">
          <span className="muted">Hi, {user.name}</span>
          <button className="btn ghost" onClick={logout}>
            Log out
          </button>
        </div>
      </header>

      <main className="container">
        {activeEventId ? (
          <EventDetail eventId={activeEventId} onBack={() => setActiveEventId(null)} />
        ) : (
          <EventList onSelect={setActiveEventId} />
        )}
      </main>
    </div>
  );
}
