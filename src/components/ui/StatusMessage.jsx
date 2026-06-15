import styles from './StatusMessage.module.css';

const ICONS = {
  info:    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>,
  warning: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>,
  danger:  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></svg>,
  success: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="20 6 9 17 4 12"/></svg>,
};

export default function StatusMessage({ message, onAction }) {
  if (!message) return null;
  const { type = 'info', title, body, action } = message;

  return (
    <div className={`${styles.msg} ${styles[type]}`} role="alert">
      <span className={styles.icon}>{ICONS[type]}</span>
      <div className={styles.content}>
        {title && <div className={styles.title}>{title}</div>}
        {body  && <div className={styles.body}>{body}</div>}
        {action && (
          <button
            className={styles.action}
            onClick={() => onAction?.(action.tool)}
          >
            {action.label}
          </button>
        )}
      </div>
    </div>
  );
}
