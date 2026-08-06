import { useEffect, useState } from 'react';
import Modal from './Modal';
import Avatar from './Avatar';
import { api } from '../lib/api';
import { useAuth } from '../context/AuthContext';

export default function NewDMModal({ onClose, onCreated }) {
  const { token } = useAuth();
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [starting, setStarting] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    const timer = setTimeout(() => {
      api
        .searchUsers(token, query)
        .then((data) => {
          if (!cancelled) setResults(data.users);
        })
        .catch((err) => !cancelled && setError(err.message))
        .finally(() => !cancelled && setLoading(false));
    }, 250);
    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [query, token]);

  async function handlePick(u) {
    setStarting(u.id);
    setError('');
    try {
      const data = await api.startDM(token, u.id);
      onCreated(data.space);
    } catch (err) {
      setError(err.message);
      setStarting(null);
    }
  }

  return (
    <Modal title="New direct message" onClose={onClose}>
      <input
        autoFocus
        style={styles.search}
        placeholder="Search people by name or email"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
      />
      {error && <div style={styles.error}>{error}</div>}
      <div style={styles.list}>
        {loading && <div style={styles.hint}>Searching…</div>}
        {!loading && results.length === 0 && <div style={styles.hint}>No people found</div>}
        {results.map((u) => (
          <button key={u.id} style={styles.row} onClick={() => handlePick(u)} disabled={starting === u.id}>
            <Avatar name={u.name} color={u.avatarColor} status={u.status} size={36} />
            <div style={{ minWidth: 0, textAlign: 'left' }}>
              <div style={styles.rowName}>{u.name}</div>
              <div style={styles.rowEmail}>{u.email}</div>
            </div>
            {starting === u.id && <span style={styles.spinnerText}>Starting…</span>}
          </button>
        ))}
      </div>
    </Modal>
  );
}

const styles = {
  search: {
    width: '100%',
    padding: '10px 14px',
    borderRadius: 8,
    border: '1px solid var(--color-border)',
    fontSize: 14,
    marginBottom: 12,
    outline: 'none',
  },
  error: { background: '#fce8e6', color: 'var(--color-danger)', padding: '8px 12px', borderRadius: 8, fontSize: 13, marginBottom: 8 },
  list: { display: 'flex', flexDirection: 'column', gap: 2, maxHeight: 320, overflowY: 'auto' },
  hint: { padding: '12px 4px', fontSize: 13, color: 'var(--color-text-tertiary)' },
  row: {
    display: 'flex',
    alignItems: 'center',
    gap: 12,
    padding: '8px 8px',
    borderRadius: 8,
    border: 'none',
    background: 'transparent',
    width: '100%',
  },
  rowName: { fontSize: 14, fontWeight: 500 },
  rowEmail: { fontSize: 12, color: 'var(--color-text-secondary)' },
  spinnerText: { fontSize: 12, color: 'var(--color-text-tertiary)', marginLeft: 'auto' },
};
