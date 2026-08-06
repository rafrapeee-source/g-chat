function initials(name = '') {
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

const statusColor = {
  online: 'var(--color-online)',
  away: 'var(--color-away)',
  offline: 'var(--color-offline)',
};

export default function Avatar({ name, color = '#1a73e8', size = 36, status, isSpace = false }) {
  return (
    <div style={{ position: 'relative', width: size, height: size, flexShrink: 0 }}>
      <div
        style={{
          width: size,
          height: size,
          borderRadius: isSpace ? 8 : '50%',
          background: color,
          color: '#fff',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: size * 0.4,
          fontWeight: 500,
          fontFamily: 'var(--font-display)',
          userSelect: 'none',
        }}
      >
        {isSpace ? '#' : initials(name)}
      </div>
      {status && (
        <span
          style={{
            position: 'absolute',
            bottom: -1,
            right: -1,
            width: size * 0.32,
            height: size * 0.32,
            minWidth: 10,
            minHeight: 10,
            borderRadius: '50%',
            background: statusColor[status] || statusColor.offline,
            border: '2px solid #fff',
          }}
        />
      )}
    </div>
  );
}
