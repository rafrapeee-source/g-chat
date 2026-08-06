import { useEffect, useMemo, useRef, useState } from 'react';
import Avatar from './Avatar';
import MessageBubble from './MessageBubble';
import Composer from './Composer';
import { api } from '../lib/api';
import { getSocket } from '../lib/socket';
import { useAuth } from '../context/AuthContext';

function isSameMinute(a, b) {
  return new Date(a).getTime() - new Date(b).getTime() < 5 * 60 * 1000;
}

export default function ChatView({ space, presenceMap, onSpaceUpdated }) {
  const { token, user } = useAuth();
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [typingUsers, setTypingUsers] = useState({});
  const scrollRef = useRef(null);
  const bottomRef = useRef(null);

  const otherMemberNames = useMemo(
    () => space.members.filter((m) => String(m.user) !== String(user.id)).map((m) => m.name),
    [space, user.id]
  );

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setMessages([]);
    setTypingUsers({});

    api.getMessages(token, space.id).then((data) => {
      if (!cancelled) {
        setMessages(data.messages);
        setLoading(false);
      }
    });

    const socket = getSocket();
    if (socket) socket.emit('space:join', space.id);

    function onNewMessage(msg) {
      if (msg.space !== space.id) return;
      setMessages((prev) => [...prev, msg]);
      setTypingUsers((prev) => {
        const next = { ...prev };
        delete next[msg.sender.id];
        return next;
      });
    }

    function onTypingUpdate({ spaceId, userId, name, typing }) {
      if (spaceId !== space.id || userId === user.id) return;
      setTypingUsers((prev) => {
        const next = { ...prev };
        if (typing) next[userId] = name;
        else delete next[userId];
        return next;
      });
    }

    socket?.on('message:new', onNewMessage);
    socket?.on('typing:update', onTypingUpdate);

    return () => {
      cancelled = true;
      socket?.off('message:new', onNewMessage);
      socket?.off('typing:update', onTypingUpdate);
    };
  }, [space.id, token, user.id]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages.length, typingUsers]);

  function handleSend(text) {
    const socket = getSocket();
    if (!socket) return;
    socket.emit('message:send', { spaceId: space.id, text }, (res) => {
      if (res?.error) {
        console.error('Send failed:', res.error);
      } else {
        onSpaceUpdated?.(space.id, text);
      }
    });
  }

  function handleTypingStart() {
    getSocket()?.emit('typing:start', { spaceId: space.id });
  }
  function handleTypingStop() {
    getSocket()?.emit('typing:stop', { spaceId: space.id });
  }

  const headerStatus = space.dmPartner ? presenceMap[space.dmPartner.id]?.status || space.dmPartner.status : null;
  const typingNames = Object.values(typingUsers);

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <Avatar
          name={space.name}
          color={space.dmPartner?.avatarColor || '#5f6368'}
          isSpace={!space.isDirect}
          status={headerStatus}
          size={34}
        />
        <div style={{ minWidth: 0 }}>
          <div style={styles.headerName}>{space.name}</div>
          <div style={styles.headerSub}>
            {space.isDirect
              ? headerStatus === 'online'
                ? 'Online'
                : 'Offline'
              : `${space.memberCount} member${space.memberCount === 1 ? '' : 's'} · ${otherMemberNames.slice(0, 3).join(', ')}${otherMemberNames.length > 3 ? '…' : ''}`}
          </div>
        </div>
      </div>

      <div style={styles.messages} ref={scrollRef}>
        {loading && <div style={styles.loading}>Loading messages…</div>}
        {!loading && messages.length === 0 && (
          <div style={styles.emptyState}>
            <div style={styles.emptyTitle}>Say hello 👋</div>
            <div style={styles.emptySub}>This is the beginning of your conversation{space.isDirect ? '' : ` in ${space.name}`}.</div>
          </div>
        )}
        {messages.map((m, i) => {
          const prev = messages[i - 1];
          const showHeader = !prev || prev.sender.id !== m.sender.id || !isSameMinute(m.createdAt, prev.createdAt);
          return <MessageBubble key={m.id} message={m} showHeader={showHeader} />;
        })}
        {typingNames.length > 0 && (
          <div style={styles.typingIndicator}>
            {typingNames.join(', ')} {typingNames.length === 1 ? 'is' : 'are'} typing…
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      <Composer
        onSend={handleSend}
        onTypingStart={handleTypingStart}
        onTypingStop={handleTypingStop}
        placeholder={`Message ${space.name}`}
      />
    </div>
  );
}

const styles = {
  container: { flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0, height: '100%' },
  header: {
    display: 'flex',
    alignItems: 'center',
    gap: 12,
    padding: '14px 24px',
    borderBottom: '1px solid var(--color-border)',
  },
  headerName: { fontFamily: 'var(--font-display)', fontSize: 16, fontWeight: 500, color: 'var(--color-text)' },
  headerSub: {
    fontSize: 12,
    color: 'var(--color-text-secondary)',
    whiteSpace: 'nowrap',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
  },
  messages: { flex: 1, overflowY: 'auto', padding: '16px 0' },
  loading: { textAlign: 'center', color: 'var(--color-text-tertiary)', fontSize: 13, marginTop: 40 },
  emptyState: { textAlign: 'center', marginTop: 60, padding: '0 24px' },
  emptyTitle: { fontFamily: 'var(--font-display)', fontSize: 18, marginBottom: 6 },
  emptySub: { fontSize: 13, color: 'var(--color-text-secondary)' },
  typingIndicator: { padding: '6px 24px', fontSize: 12.5, color: 'var(--color-text-tertiary)', fontStyle: 'italic' },
};
