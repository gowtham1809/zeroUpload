import styles from './Spinner.module.css';
export default function Spinner({ size = 16 }) {
  return <div className={styles.spinner} style={{ width: size, height: size }} />;
}
