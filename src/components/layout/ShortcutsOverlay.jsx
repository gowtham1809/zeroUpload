import { useEffect } from 'react';
import { SHORTCUTS } from '@/constants/shortcuts';
import styles from './ShortcutsOverlay.module.css';

export default function ShortcutsOverlay({ open, onClose }) {
  // Close on Escape
  useEffect(() => {
    if (!open) return;
    const handler = (e) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [open, onClose]);

  // Lock body scroll
  useEffect(() => {
    if (open) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => { document.body.style.overflow = ''; };
  }, [open]);

  if (!open) return null;

  return (
    <div className={styles.backdrop} onClick={onClose} role="dialog" aria-modal="true" aria-label="Keyboard shortcuts">
      <div className={styles.panel} onClick={e => e.stopPropagation()}>

        {/* Header */}
        <div className={styles.header}>
          <div className={styles.headerLeft}>
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <rect x="2" y="4" width="20" height="16" rx="2"/>
              <path d="M6 8h.01M10 8h.01M14 8h.01M18 8h.01M8 12h.01M12 12h.01M16 12h.01M7 16h10"/>
            </svg>
            <span className={styles.title}>Keyboard Shortcuts</span>
          </div>
          <button className={styles.closeBtn} onClick={onClose} aria-label="Close">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <line x1="18" y1="6" x2="6" y2="18"/>
              <line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
          </button>
        </div>

        {/* Shortcut groups */}
        <div className={styles.body}>
          {SHORTCUTS.map(group => (
            <div key={group.group} className={styles.group}>
              <div className={styles.groupLabel}>{group.group}</div>
              <div className={styles.items}>
                {group.items.map((item, i) => (
                  <div key={i} className={styles.item}>
                    <span className={styles.itemLabel}>{item.label}</span>
                    <div className={styles.keys}>
                      {item.keys.map((k, ki) => (
                        <span key={ki} className={styles.key}>{k}</span>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* Footer tip */}
        <div className={styles.footer}>
          <span>Press</span>
          <span className={styles.key}>?</span>
          <span>anytime to open this panel</span>
        </div>

      </div>
    </div>
  );
}
