export default function Modal({ title, onClose, children, width = 420 }) {
  return (
    <div style={styles.overlay} onMouseDown={onClose}>
      <div style={{ ...styles.dialog, width }} onMouseDown={(e) => e.stopPropagation()}>
        <div style={styles.header}>
          <h2 style={styles.title}>{title}</h2>
          <button style={styles.closeBtn} onClick={onClose} aria-label="Close">
            ✕
          </button>
        </div>
        <div style={styles.body}>{children}</div>
      </div>
    </div>
  );
}

const styles = {
  overlay: {
    position: 'fixed',
    inset: 0,
    background: 'rgba(32, 33, 36, 0.5)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1000,
  },
  dialog: {
    background: '#fff',
    borderRadius: 12,
    boxShadow: 'var(--shadow-2)',
    maxHeight: '85vh',
    display: 'flex',
    flexDirection: 'column',
  },
  header: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '20px 24px 8px',
  },
  title: { fontFamily: 'var(--font-display)', fontSize: 18, margin: 0, fontWeight: 500 },
  closeBtn: {
    background: 'transparent',
    border: 'none',
    fontSize: 16,
    color: 'var(--color-text-secondary)',
    width: 32,
    height: 32,
    borderRadius: '50%',
  },
  body: { padding: '12px 24px 24px', overflowY: 'auto' },
};
