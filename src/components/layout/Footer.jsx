import styles from './Footer.module.css';

export default function Footer() {
  return (
    <footer className={styles.footer}>
      <div className={styles.inner}>
        <div className={styles.left}>
          <span className={styles.brand}>ZeroUpload</span>
          <span className={styles.sep}>//</span>
          <span className={styles.tagline}>all processing happens locally on your device</span>
        </div>
        <div className={styles.right}>
          <span className={styles.privacy}>
            <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
              <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
            </svg>
            no uploads · no accounts · no limits
          </span>
        </div>
      </div>
    </footer>
  );
}
