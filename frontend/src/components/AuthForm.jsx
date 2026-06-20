import { useState } from 'react';
import { useAuth } from '../context/AuthContext.jsx';

export default function AuthForm() {
  const { login, register } = useAuth();
  const [mode, setMode] = useState('login'); // 'login' | 'register'
  const [name, setName] = useState('');
  const [email, setEmail] = useState('demo@sortmyscene.test');
  const [password, setPassword] = useState('password123');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  async function onSubmit(e) {
    e.preventDefault();
    setError('');
    setBusy(true);
    try {
      if (mode === 'login') {
        await login(email.trim(), password);
      } else {
        await register(name.trim(), email.trim(), password);
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="auth-wrap">
      <div className="card auth-card">
        <h1 className="brand">
          Sort<span>My</span>Scene
        </h1>
        <p className="muted">
          {mode === 'login' ? 'Sign in to book your seats' : 'Create an account'}
        </p>

        <form onSubmit={onSubmit} className="form">
          {mode === 'register' && (
            <label>
              Name
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                placeholder="Your name"
              />
            </label>
          )}
          <label>
            Email
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              placeholder="you@example.com"
            />
          </label>
          <label>
            Password
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={6}
              placeholder="••••••••"
            />
          </label>

          {error && <div className="alert error">{error}</div>}

          <button className="btn primary" disabled={busy}>
            {busy ? 'Please wait…' : mode === 'login' ? 'Sign in' : 'Create account'}
          </button>
        </form>

        <p className="muted small">
          {mode === 'login' ? "Don't have an account? " : 'Already registered? '}
          <button
            className="link"
            type="button"
            onClick={() => {
              setError('');
              setMode(mode === 'login' ? 'register' : 'login');
            }}
          >
            {mode === 'login' ? 'Register' : 'Sign in'}
          </button>
        </p>
        <p className="muted small">
          Demo login is pre-filled: <code>demo@sortmyscene.test / password123</code>
        </p>
      </div>
    </div>
  );
}
