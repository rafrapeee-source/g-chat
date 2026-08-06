import Avatar from './Avatar';

function formatTime(dateStr) {
  return new Date(dateStr).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
}

export default function MessageBubble({ message, showHeader }) {
  return (
    <div style={{ ...styles.row, marginTop: showHeader ? 16 : 2 }}>
      <div style={styles.avatarSlot}>
        {showHeader && <Avatar name={message.sender.name} color={message.sender.avatarColor} size={32} />}
      </div>
      <div style={styles.content}>
        {showHeader && (
          <div style={styles.headerRow}>
            <span style={styles.senderName}>{message.sender.name}</span>
            <span style={styles.time}>{formatTime(message.createdAt)}</span>
          </div>
        )}
        <div style={styles.text}>{message.text}</div>
      </div>
    </div>
  );
}

const styles = {
  row: { display: 'flex', gap: 12, padding: '0 24px' },
  avatarSlot: { width: 32, flexShrink: 0 },
  content: { minWidth: 0, flex: 1 },
  headerRow: { display: 'flex', alignItems: 'baseline', gap: 8, marginBottom: 2 },
  senderName: { fontSize: 13.5, fontWeight: 600, color: 'var(--color-text)' },
  time: { fontSize: 11.5, color: 'var(--color-text-tertiary)' },
  text: { fontSize: 14.5, lineHeight: 1.5, color: 'var(--color-text)', whiteSpace: 'pre-wrap', wordBreak: 'break-word' },
};
