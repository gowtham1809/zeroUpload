import { useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { formatBytes, getFileExt } from '@/lib/format';
import styles from './DropZone.module.css';

export default function DropZone({ accept, onFile, file, label = 'Drop a file here', hint }) {
  const onDrop = useCallback(files => { if (files[0]) onFile(files[0]); }, [onFile]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop, accept, maxFiles: 1, multiple: false,
  });

  return (
    <div
      {...getRootProps()}
      className={`${styles.zone} ${isDragActive ? styles.active : ''} ${file ? styles.hasFile : ''}`}
    >
      <input {...getInputProps()} />

      {file ? (
        <div className={styles.file}>
          <div className={styles.ext}>{getFileExt(file)}</div>
          <div className={styles.info}>
            <span className={styles.name}>{file.name}</span>
            <span className={styles.size}>{formatBytes(file.size)}</span>
          </div>
          <div className={styles.change}>click or drop to change</div>
        </div>
      ) : (
        <div className={styles.empty}>
          <div className={styles.uploadIcon}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
              <polyline points="17 8 12 3 7 8"/>
              <line x1="12" y1="3" x2="12" y2="15"/>
            </svg>
          </div>
          <div className={styles.label}>{label}</div>
          <div className={styles.sub}>{hint || 'or click to browse'}</div>
        </div>
      )}
    </div>
  );
}
