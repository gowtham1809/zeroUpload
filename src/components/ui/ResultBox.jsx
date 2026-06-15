import { formatBytes } from '@/lib/format';
import styles from './ResultBox.module.css';

export default function ResultBox({ result, onDownload, extra }) {
  if (!result) return null;

  const handleDownload = () => {
    if (onDownload) { onDownload(); return; }
    if (result.url && result.url !== '#') {
      const a = document.createElement('a');
      a.href = result.url;
      a.download = result.name;
      a.click();
    }
  };

  return (
    <div className={styles.box}>
      <div className={styles.header}>
        <div className={styles.check}>
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
            <polyline points="20 6 9 17 4 12"/>
          </svg>
        </div>
        <span className={styles.label}>ready to download</span>
        {result.savings != null && (
          <span className={`${styles.badge} ${result.savings > 0 ? styles.smaller : styles.larger}`}>
            {result.savings > 0
              ? `${result.savings}% smaller`
              : result.savings < 0
              ? `${Math.abs(result.savings)}% larger`
              : 'same size'}
          </span>
        )}
      </div>

      {result.name && (
        <div className={styles.file}>
          <span className={styles.fileName}>{result.name}</span>
          {result.size > 0 && <span className={styles.fileSize}>{formatBytes(result.size)}</span>}
        </div>
      )}

      {extra && <div className={styles.extra}>{extra}</div>}

      <button className={styles.downloadBtn} onClick={handleDownload}>
        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
          <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
          <polyline points="7 10 12 15 17 10"/>
          <line x1="12" y1="15" x2="12" y2="3"/>
        </svg>
        Download {result.format || result.name}
      </button>
    </div>
  );
}
