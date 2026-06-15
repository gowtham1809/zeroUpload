import styles from './Toggle.module.css';
export default function Toggle({ checked, onChange, label }) {
  return (
    <label className={styles.label}>
      <div
        className={`${styles.track} ${checked ? styles.on : ''}`}
        onClick={() => onChange(!checked)}
        role="switch"
        aria-checked={checked}
        tabIndex={0}
        onKeyDown={e => { if (e.key === ' ' || e.key === 'Enter') onChange(!checked); }}
      >
        <div className={styles.thumb} />
      </div>
      {label && <span className={styles.text}>{label}</span>}
    </label>
  );
}
