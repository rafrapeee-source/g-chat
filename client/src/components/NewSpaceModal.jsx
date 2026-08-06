import { useEffect, useState } from 'react';
import Modal from './Modal';
import Avatar from './Avatar';
import { api } from '../lib/api';
import { useAuth } from '../context/AuthContext';

export default function NewSpaceModal({ onClose, onCreated }) {
  const { token } = useAuth();
  const [name, setName] = useState('');
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [selected, setSelected] = useState([]);
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    let cancelled = false;
    const timer = setTimeout(() => {
      api.searchUsers(token, query).then((data) => {
        if (!cancelled) setResults(data.users);
      });
    }, 250);
    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [query, token]);

  function toggle(u) {
    setSelected((prev) => (prev.some((s) => s.id === u.id) ? prev.filter((s) => s.id !== u.id) : [...prev, u]));
  }

  async function handleCreate() {
    if (!name.trim()) {
      setError('Give your space a name');
      return;
    }
    setSubmitting(true);
    setError('');
    try {
      const data = await api.createSpace(token, { name: name.trim(), memberIds: selected.map((s) => s.id) });
      onCreated(data.space);
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Modal title="Create a space" onClose={onClose} width={460}>
      <label style={styles.label}>
        Space name
        <input
          autoFocus
          style={styles.input}
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="e.g. Marketing Team"
          maxLength={80}
        />
      </label>

      <label style={styles.label}>
        Add people
        <input
          style={styles.input}
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search people by name or email"
        />
      </label>

      {selected.length > 0 && (
        <div style={styles.chips}>
          {selected.map((s) => (
            <span key={s.id} style={styles.chip}>
              {s.name}
              <button style={styles.chipRemove} onClick={() => toggle(s)} aria-label={`Remove ${s.name}`}>
                ✕
              </button>
            </span>
          ))}
        </div>
      )}

      <div style={styles.list}>
        {results.map((u) => {
          const isSelected = selected.some((s) => s.id === u.id);
          return (
            <button key={u.id} style={styles.row} onClick={() => toggle(u)}>
              <Avatar name={u.name} color={u.avatarColor} status={u.status} size={32} />
              <div style={{ minWidth: 0, textAlign: 'left', flex: 1 }}>
                <div style={styles.rowName}>{u.name}</div>
                <div style={styles.rowEmail}>{u.email}</div>
              </div>
              <span style={{ ...styles.checkbox, ...(isSelected ? styles.checkboxChecked : {}) }}>
                {isSelected ? '✓' : ''}
              </span>
            </button>
          );
        })}
      </div>

      {error && <div style={styles.error}>{error}</div>}

      <button style={styles.createBtn} onClick={handleCreate} disabled={submitting}>
        {submitting ? 'Creating…' : 'Create space'}
      </button>
    </Modal>
  );
}

const styles = {
  label: { display: 'flex', flexDirection: 'column', gap: 6, fontSize: 12.5, fontWeight: 500, color: 'var(--color-text-secondary)', marginBottom: 12 },
  input: { padding: '10px 12px', borderRadius: 8, border: '1px solid var(--color-border)', fontSize: 14, outline: 'none' },
  chips: { display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 10 },
  chip: {
    display: 'flex',
    alignItems: 'center',
    gap: 6,
    background: 'var(--color-bg-selected)',
    color: 'var(--color-primary-dark)',
    padding: '4px 6px 4px 10px',
    borderRadius: 14,
    fontSize: 12.5,
  },
  chipRemove: { background: 'transparent', border: 'none', color: 'inherit', fontSize: 11, padding: 2, lineHeight: 1 },
  list: { display: 'flex', flexDirection: 'column', gap: 2, maxHeight: 200, overflowY: 'auto', marginBottom: 12 },
  row: { display: 'flex', alignItems: 'center', gap: 10, padding: '6px 8px', borderRadius: 8, border: 'none', background: 'transparent', width: '100%' },
  rowName: { fontSize: 13.5, fontWeight: 500 },
  rowEmail: { fontSize: 11.5, color: 'var(--color-text-secondary)' },
  checkbox: {
    width: 20,
    height: 20,
    borderRadius: '50%',
    border: '2px solid var(--color-border)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: 12,
    color: '#fff',
    flexShrink: 0,
  },
  checkboxChecked: { background: 'var(--color-primary)', border: '2px solid var(--color-primary)' },
  error: { background: '#fce8e6', color: 'var(--color-danger)', padding: '8px 12px', borderRadius: 8, fontSize: 13, marginBottom: 10 },
  createBtn: {
    width: '100%',
    padding: '10px 16px',
    borderRadius: 20,
    border: 'none',
    background: 'var(--color-primary)',
    color: '#fff',
    fontWeight: 500,
    fontSize: 14,
  },
};
