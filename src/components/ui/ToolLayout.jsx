import styles from './ToolLayout.module.css';

export default function ToolLayout({ children, sidebar }) {
  return (
    <div className={styles.layout}>
      <div className={styles.sidebar}>{sidebar}</div>
      <div className={styles.main}>{children}</div>
    </div>
  );
}
