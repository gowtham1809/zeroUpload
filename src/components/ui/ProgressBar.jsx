import styles from './ProgressBar.module.css';

export default function ProgressBar({ progress = 0, stage = '', onCancel }) {
  return (
    <div className={styles.wrap}>
      <div className={styles.header}>
        <span className={styles.stage}>{stage}</span>
        <span className={styles.pct}>{progress}%</span>
      </div>
      <div className={styles.track}>
        <div className={styles.fill} style={{ width: `${progress}%` }} />
        <div className={styles.shimmer} />
      </div>
      {onCancel && (
        <button className={styles.cancel} onClick={onCancel}>
          cancel
        </button>
      )}
    </div>
  );
}
