import { useState } from 'react';
import { useAuth } from '../context/AuthContext';

export default function AuthPage() {
  const { login, signup } = useAuth();
  const [mode, setMode] = useState('login'); // 'login' | 'signup'
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setSubmitting(true);
    try {
      if (mode === 'login') {
        await login(email.trim(), password);
      } else {
        await signup(name.trim(), email.trim(), password);
      }
    } catch (err) {
      setError(err.message || 'Something went wrong');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div style={styles.page}>
      <div style={styles.card}>
        <div style={styles.brand}>
          <div style={styles.logoDot} />
          <span style={styles.brandText}>Chat</span>
        </div>

        <h1 style={styles.heading}>{mode === 'login' ? 'Sign in' : 'Create your account'}</h1>
        <p style={styles.subheading}>
          {mode === 'login' ? 'Welcome back — pick up where you left off.' : 'Message your team, instantly.'}
        </p>

        <form onSubmit={handleSubmit} style={styles.form}>
          {mode === 'signup' && (
            <label style={styles.label}>
              Name
              <input
                style={styles.input}
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Ada Lovelace"
                required
                maxLength={60}
              />
            </label>
          )}

          <label style={styles.label}>
            Email
            <input
              style={styles.input}
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              required
            />
          </label>

          <label style={styles.label}>
            Password
            <input
              style={styles.input}
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder={mode === 'signup' ? 'At least 6 characters' : 'Your password'}
              required
              minLength={6}
            />
          </label>

          {error && <div style={styles.error}>{error}</div>}

          <button type="submit" style={styles.submitBtn} disabled={submitting}>
            {submitting ? 'Please wait…' : mode === 'login' ? 'Sign in' : 'Create account'}
          </button>
        </form>

        <button
          type="button"
          style={styles.switchBtn}
          onClick={() => {
            setMode(mode === 'login' ? 'signup' : 'login');
            setError('');
          }}
        >
          {mode === 'login' ? "Don't have an account? Sign up" : 'Already have an account? Sign in'}
        </button>
      </div>
    </div>
  );
}

const styles = {
  page: {
    height: '100%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    background: 'linear-gradient(180deg, #f8f9fa 0%, #ffffff 100%)',
    padding: 24,
  },
  card: {
    width: '100%',
    maxWidth: 380,
    background: '#fff',
    border: '1px solid var(--color-border)',
    borderRadius: 'var(--radius-md)',
    boxShadow: 'var(--shadow-2)',
    padding: '40px 36px',
  },
  brand: { display: 'flex', alignItems: 'center', gap: 10, marginBottom: 28 },
  logoDot: {
    width: 32,
    height: 32,
    borderRadius: 8,
    background: 'conic-gradient(from 180deg, #1a73e8, #34a853, #fbbc04, #ea4335, #1a73e8)',
  },
  brandText: { fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 22, color: 'var(--color-text)' },
  heading: { fontFamily: 'var(--font-display)', fontSize: 22, margin: '0 0 6px', color: 'var(--color-text)' },
  subheading: { color: 'var(--color-text-secondary)', fontSize: 14, margin: '0 0 24px' },
  form: { display: 'flex', flexDirection: 'column', gap: 16 },
  label: { display: 'flex', flexDirection: 'column', gap: 6, fontSize: 13, color: 'var(--color-text-secondary)', fontWeight: 500 },
  input: {
    padding: '10px 12px',
    borderRadius: 8,
    border: '1px solid var(--color-border)',
    fontSize: 15,
    color: 'var(--color-text)',
    outline: 'none',
  },
  error: {
    background: '#fce8e6',
    color: 'var(--color-danger)',
    padding: '10px 12px',
    borderRadius: 8,
    fontSize: 13,
  },
  submitBtn: {
    marginTop: 8,
    padding: '11px 16px',
    borderRadius: 20,
    border: 'none',
    background: 'var(--color-primary)',
    color: '#fff',
    fontWeight: 500,
    fontSize: 14,
    transition: 'background 0.15s',
  },
  switchBtn: {
    marginTop: 20,
    width: '100%',
    background: 'transparent',
    border: 'none',
    color: 'var(--color-primary)',
    fontSize: 13,
    fontWeight: 500,
    padding: 8,
  },
};
