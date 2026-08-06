import { useRef, useState } from 'react';

export default function Composer({ onSend, onTypingStart, onTypingStop, placeholder }) {
  const [value, setValue] = useState('');
  const typingRef = useRef(false);
  const stopTimerRef = useRef(null);

  function handleChange(e) {
    setValue(e.target.value);

    if (!typingRef.current) {
      typingRef.current = true;
      onTypingStart?.();
    }
    clearTimeout(stopTimerRef.current);
    stopTimerRef.current = setTimeout(() => {
      typingRef.current = false;
      onTypingStop?.();
    }, 1500);
  }

  function submit() {
    const trimmed = value.trim();
    if (!trimmed) return;
    onSend(trimmed);
    setValue('');
    clearTimeout(stopTimerRef.current);
    if (typingRef.current) {
      typingRef.current = false;
      onTypingStop?.();
    }
  }

  function handleKeyDown(e) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      submit();
    }
  }

  return (
    <div style={styles.wrap}>
      <div style={styles.box}>
        <textarea
          style={styles.textarea}
          value={value}
          onChange={handleChange}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          rows={1}
        />
        <button
          style={{ ...styles.sendBtn, opacity: value.trim() ? 1 : 0.4 }}
          onClick={submit}
          disabled={!value.trim()}
          aria-label="Send message"
        >
          ➤
        </button>
      </div>
    </div>
  );
}

const styles = {
  wrap: { padding: '8px 24px 20px' },
  box: {
    display: 'flex',
    alignItems: 'flex-end',
    gap: 8,
    border: '1px solid var(--color-border)',
    borderRadius: 24,
    padding: '10px 10px 10px 18px',
    boxShadow: 'var(--shadow-1)',
  },
  textarea: {
    flex: 1,
    border: 'none',
    outline: 'none',
    resize: 'none',
    fontSize: 14.5,
    fontFamily: 'var(--font-body)',
    maxHeight: 120,
    lineHeight: 1.5,
    background: 'transparent',
  },
  sendBtn: {
    width: 36,
    height: 36,
    borderRadius: '50%',
    border: 'none',
    background: 'var(--color-primary)',
    color: '#fff',
    fontSize: 14,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
};
