import Avatar from './Avatar';

function formatTime(dateStr) {
  const d = new Date(dateStr);
  const now = new Date();
  const sameDay = d.toDateString() === now.toDateString();
  if (sameDay) return d.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
  return d.toLocaleDateString([], { month: 'short', day: 'numeric' });
}

export default function Sidebar({
  user,
  spaces,
  activeSpaceId,
  onSelectSpace,
  onNewDM,
  onNewSpace,
  onLogout,
  presenceMap,
}) {
  const directMessages = spaces.filter((s) => s.isDirect);
  const groupSpaces = spaces.filter((s) => !s.isDirect);

  return (
    <div style={styles.rail}>
      <div style={styles.header}>
        <div style={styles.brand}>
          <div style={styles.logoDot} />
          <span style={styles.brandText}>Chat</span>
        </div>
        <button style={styles.iconBtn} title="Sign out" onClick={onLogout} aria-label="Sign out">
          ⏻
        </button>
      </div>

      <div style={styles.me}>
        <Avatar name={user.name} color={user.avatarColor} status="online" size={32} />
        <div style={styles.meText}>
          <div style={styles.meName}>{user.name}</div>
          <div style={styles.meEmail}>{user.email}</div>
        </div>
      </div>

      <div style={styles.scrollArea}>
        <SectionHeader label="Direct messages" onAdd={onNewDM} addTitle="New direct message" />
        {directMessages.length === 0 && <EmptyHint text="No conversations yet" />}
        {directMessages.map((s) => {
          const live = s.dmPartner ? presenceMap[s.dmPartner.id] : null;
          const status = live?.status || s.dmPartner?.status || 'offline';
          return (
            <SpaceRow
              key={s.id}
              space={s}
              active={s.id === activeSpaceId}
              status={status}
              onClick={() => onSelectSpace(s)}
            />
          );
        })}

        <SectionHeader label="Spaces" onAdd={onNewSpace} addTitle="Create a space" />
        {groupSpaces.length === 0 && <EmptyHint text="No spaces yet" />}
        {groupSpaces.map((s) => (
          <SpaceRow key={s.id} space={s} active={s.id === activeSpaceId} onClick={() => onSelectSpace(s)} isSpace />
        ))}
      </div>
    </div>
  );
}

function SectionHeader({ label, onAdd, addTitle }) {
  return (
    <div style={styles.sectionHeader}>
      <span>{label}</span>
      <button style={styles.addBtn} onClick={onAdd} title={addTitle} aria-label={addTitle}>
        +
      </button>
    </div>
  );
}

function EmptyHint({ text }) {
  return <div style={styles.emptyHint}>{text}</div>;
}

function SpaceRow({ space, active, onClick, status, isSpace }) {
  return (
    <button
      onClick={onClick}
      style={{
        ...styles.row,
        background: active ? 'var(--color-bg-selected)' : 'transparent',
      }}
    >
      <Avatar
        name={space.name}
        color={space.dmPartner?.avatarColor || '#5f6368'}
        status={!isSpace ? status : undefined}
        isSpace={isSpace}
        size={32}
      />
      <div style={styles.rowText}>
        <div style={styles.rowTop}>
          <span style={{ ...styles.rowName, fontWeight: active ? 600 : 500 }}>{space.name}</span>
          {space.lastMessageAt && <span style={styles.rowTime}>{formatTime(space.lastMessageAt)}</span>}
        </div>
        <div style={styles.rowPreview}>{space.lastMessagePreview || 'No messages yet'}</div>
      </div>
    </button>
  );
}

const styles = {
  rail: {
    width: 288,
    minWidth: 288,
    height: '100%',
    borderRight: '1px solid var(--color-border)',
    background: 'var(--color-bg-rail)',
    display: 'flex',
    flexDirection: 'column',
  },
  header: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '16px 16px 8px',
  },
  brand: { display: 'flex', alignItems: 'center', gap: 8 },
  logoDot: {
    width: 22,
    height: 22,
    borderRadius: 6,
    background: 'conic-gradient(from 180deg, #1a73e8, #34a853, #fbbc04, #ea4335, #1a73e8)',
  },
  brandText: { fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 18 },
  iconBtn: {
    background: 'transparent',
    border: 'none',
    color: 'var(--color-text-secondary)',
    fontSize: 16,
    padding: 8,
    borderRadius: '50%',
  },
  me: {
    display: 'flex',
    alignItems: 'center',
    gap: 10,
    padding: '8px 16px 16px',
    borderBottom: '1px solid var(--color-border)',
  },
  meText: { minWidth: 0 },
  meName: { fontSize: 14, fontWeight: 500, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' },
  meEmail: {
    fontSize: 12,
    color: 'var(--color-text-secondary)',
    whiteSpace: 'nowrap',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
  },
  scrollArea: { overflowY: 'auto', flex: 1, padding: '4px 8px 16px' },
  sectionHeader: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '16px 8px 6px',
    fontSize: 12,
    fontWeight: 600,
    letterSpacing: 0.3,
    color: 'var(--color-text-secondary)',
    textTransform: 'uppercase',
  },
  addBtn: {
    background: 'transparent',
    border: 'none',
    color: 'var(--color-text-secondary)',
    fontSize: 16,
    width: 24,
    height: 24,
    borderRadius: '50%',
    lineHeight: 1,
  },
  emptyHint: { padding: '4px 12px 8px', fontSize: 13, color: 'var(--color-text-tertiary)' },
  row: {
    width: '100%',
    display: 'flex',
    alignItems: 'center',
    gap: 12,
    padding: '8px 10px',
    borderRadius: 8,
    border: 'none',
    textAlign: 'left',
  },
  rowText: { minWidth: 0, flex: 1 },
  rowTop: { display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', gap: 8 },
  rowName: { fontSize: 14, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', color: 'var(--color-text)' },
  rowTime: { fontSize: 11, color: 'var(--color-text-tertiary)', flexShrink: 0 },
  rowPreview: {
    fontSize: 12,
    color: 'var(--color-text-secondary)',
    whiteSpace: 'nowrap',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
  },
};
