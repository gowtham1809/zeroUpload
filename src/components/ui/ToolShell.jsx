import styles from './ToolShell.module.css';

export default function ToolShell({ title, icon, description, children }) {
  return (
    <div className={styles.shell}>
      <div className={styles.header}>
        <span className={styles.icon}>{icon}</span>
        <div className={styles.meta}>
          <h2 className={styles.title}>{title}</h2>
          <p className={styles.desc}>{description}</p>
        </div>
      </div>
      <div className={styles.body}>{children}</div>
    </div>
  );
}
