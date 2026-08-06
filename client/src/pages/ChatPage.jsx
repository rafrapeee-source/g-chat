import { useCallback, useEffect, useState } from 'react';
import Sidebar from '../components/Sidebar';
import ChatView from '../components/ChatView';
import NewDMModal from '../components/NewDMModal';
import NewSpaceModal from '../components/NewSpaceModal';
import { api } from '../lib/api';
import { getSocket } from '../lib/socket';
import { useAuth } from '../context/AuthContext';

export default function ChatPage() {
  const { token, user, logout } = useAuth();
  const [spaces, setSpaces] = useState([]);
  const [activeSpaceId, setActiveSpaceId] = useState(null);
  const [presenceMap, setPresenceMap] = useState({});
  const [modal, setModal] = useState(null); // 'dm' | 'space' | null
  const [loading, setLoading] = useState(true);

  const loadSpaces = useCallback(async () => {
    const data = await api.listSpaces(token);
    setSpaces(data.spaces);
    return data.spaces;
  }, [token]);

  useEffect(() => {
    loadSpaces()
      .then((list) => {
        if (list.length > 0) setActiveSpaceId(list[0].id);
      })
      .finally(() => setLoading(false));
  }, [loadSpaces]);

  useEffect(() => {
    const socket = getSocket();
    if (!socket) return;

    function onPresence({ userId, status, lastSeen }) {
      setPresenceMap((prev) => ({ ...prev, [userId]: { status, lastSeen } }));
    }

    function onAnyNewMessage(msg) {
      setSpaces((prev) => {
        const idx = prev.findIndex((s) => s.id === msg.space);
        if (idx === -1) {
          // We're not aware of this space yet (e.g. someone just added us) - refresh list
          loadSpaces();
          return prev;
        }
        const updated = { ...prev[idx], lastMessageAt: msg.createdAt, lastMessagePreview: msg.text.slice(0, 200) };
        const rest = prev.filter((_, i) => i !== idx);
        return [updated, ...rest];
      });
    }

    socket.on('presence:update', onPresence);
    socket.on('message:new', onAnyNewMessage);

    return () => {
      socket.off('presence:update', onPresence);
      socket.off('message:new', onAnyNewMessage);
    };
  }, [loadSpaces]);

  function handleSelectSpace(space) {
    setActiveSpaceId(space.id);
  }

  function handleSpaceCreated(space) {
    setSpaces((prev) => {
      const exists = prev.some((s) => s.id === space.id);
      return exists ? prev : [space, ...prev];
    });
    setActiveSpaceId(space.id);
    setModal(null);
  }

  function handleSpaceUpdated(spaceId, text) {
    setSpaces((prev) => {
      const idx = prev.findIndex((s) => s.id === spaceId);
      if (idx === -1) return prev;
      const updated = { ...prev[idx], lastMessageAt: new Date().toISOString(), lastMessagePreview: text.slice(0, 200) };
      const rest = prev.filter((_, i) => i !== idx);
      return [updated, ...rest];
    });
  }

  const activeSpace = spaces.find((s) => s.id === activeSpaceId);

  if (loading) {
    return <div style={styles.loadingScreen}>Loading your chats…</div>;
  }

  return (
    <div style={styles.app}>
      <Sidebar
        user={user}
        spaces={spaces}
        activeSpaceId={activeSpaceId}
        onSelectSpace={handleSelectSpace}
        onNewDM={() => setModal('dm')}
        onNewSpace={() => setModal('space')}
        onLogout={logout}
        presenceMap={presenceMap}
      />

      {activeSpace ? (
        <ChatView space={activeSpace} presenceMap={presenceMap} onSpaceUpdated={handleSpaceUpdated} />
      ) : (
        <div style={styles.emptyMain}>
          <div style={styles.emptyCard}>
            <div style={styles.emptyTitle}>Welcome to Chat</div>
            <div style={styles.emptySub}>Start a direct message or create a space to get going.</div>
            <div style={styles.emptyActions}>
              <button style={styles.primaryBtn} onClick={() => setModal('dm')}>
                New direct message
              </button>
              <button style={styles.secondaryBtn} onClick={() => setModal('space')}>
                Create a space
              </button>
            </div>
          </div>
        </div>
      )}

      {modal === 'dm' && <NewDMModal onClose={() => setModal(null)} onCreated={handleSpaceCreated} />}
      {modal === 'space' && <NewSpaceModal onClose={() => setModal(null)} onCreated={handleSpaceCreated} />}
    </div>
  );
}

const styles = {
  app: { display: 'flex', height: '100%', width: '100%' },
  loadingScreen: {
    height: '100%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    color: 'var(--color-text-secondary)',
    fontSize: 14,
  },
  emptyMain: { flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' },
  emptyCard: { textAlign: 'center', maxWidth: 320 },
  emptyTitle: { fontFamily: 'var(--font-display)', fontSize: 22, marginBottom: 8 },
  emptySub: { fontSize: 14, color: 'var(--color-text-secondary)', marginBottom: 24 },
  emptyActions: { display: 'flex', gap: 10, justifyContent: 'center' },
  primaryBtn: {
    padding: '10px 18px',
    borderRadius: 20,
    border: 'none',
    background: 'var(--color-primary)',
    color: '#fff',
    fontWeight: 500,
    fontSize: 14,
  },
  secondaryBtn: {
    padding: '10px 18px',
    borderRadius: 20,
    border: '1px solid var(--color-border)',
    background: '#fff',
    color: 'var(--color-primary)',
    fontWeight: 500,
    fontSize: 14,
  },
};
