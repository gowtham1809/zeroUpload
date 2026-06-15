import { useState, useCallback, useRef } from 'react';
import ToolShell from '@/components/ui/ToolShell';
import DropZone from '@/components/ui/DropZone';
import StatusMessage from '@/components/ui/StatusMessage';
import ResultBox from '@/components/ui/ResultBox';
import { validateImageFile } from '@/lib/validate';
import { getBaseName, formatBytes } from '@/lib/format';
import { ACCEPTED } from '@/constants/limits';
import styles from './tool.module.css';

const PRESETS = [
  { id: 'web',      label: 'Web',        desc: 'Optimised for websites',        quality: 75, format: 'image/webp' },
  { id: 'email',    label: 'Email',      desc: 'Small enough to attach',        quality: 65, format: 'image/jpeg' },
  { id: 'balanced', label: 'Balanced',   desc: 'Good quality, half the size',   quality: 82, format: 'image/webp' },
  { id: 'custom',   label: 'Custom',     desc: 'Set quality manually',          quality: 80, format: 'image/jpeg' },
];

export default function ImageCompressor({ sharedFile, onRouteToFix }) {
  const [file, setFile]       = useState(sharedFile || null);
  const [preset, setPreset]   = useState('balanced');
  const [quality, setQuality] = useState(82);
  const [message, setMessage] = useState(null);
  const [result, setResult]   = useState(null);
  const [compressing, setCompressing] = useState(false);
  const canvasRef = useRef(null);

  const handleFile = useCallback((f) => {
    const msg = validateImageFile(f, 'compress');
    if (msg?.type === 'danger') { setMessage(msg); return; }
    setMessage(msg);
    setFile(f); setResult(null);
  }, []);

  const run = useCallback(() => {
    if (!file) return;
    setCompressing(true);
    const p = PRESETS.find(p => p.id === preset);
    const q = preset === 'custom' ? quality / 100 : p.quality / 100;
    const fmt = preset === 'custom' ? 'image/webp' : p.format;
    const ext = fmt === 'image/webp' ? 'webp' : 'jpg';

    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      const canvas = canvasRef.current;
      canvas.width = img.naturalWidth; canvas.height = img.naturalHeight;
      canvas.getContext('2d').drawImage(img, 0, 0);
      const dataUrl = canvas.toDataURL(fmt, q);
      const b64size = Math.round((dataUrl.split(',')[1].length * 3) / 4);
      const savings = Math.round((1 - b64size / file.size) * 100);
      setResult({ dataUrl, name: `${getBaseName(file)}_compressed.${ext}`, format: ext.toUpperCase(), size: b64size, savings });
      setCompressing(false);
      URL.revokeObjectURL(url);
    };
    img.src = url;
  }, [file, preset, quality]);

  const download = () => {
    if (!result) return;
    const a = document.createElement('a'); a.href = result.dataUrl; a.download = result.name; a.click();
  };

  const selectedPreset = PRESETS.find(p => p.id === preset);

  return (
    <ToolShell icon="⬇" title="Image Compressor" description="Reduce image file size without changing the format. Outputs WebP or JPG.">
      <div className={styles.step}>
        <div className={styles.stepLabel}>01 — image file</div>
        <DropZone accept={ACCEPTED.image} onFile={handleFile} file={file} label="Drop an image to compress" />
      </div>

      <div className={styles.step}>
        <div className={styles.stepLabel}>02 — compression preset</div>
        <div className={styles.formatGrid}>
          {PRESETS.map(p => (
            <button key={p.id} className={`${styles.fmtBtn} ${preset === p.id ? styles.fmtActive : ''}`}
              onClick={() => { setPreset(p.id); setQuality(p.quality); setResult(null); }}>
              <span className={styles.fmtLabel}>{p.label}</span>
              <span className={styles.fmtDesc}>{p.desc}</span>
            </button>
          ))}
        </div>

        {preset === 'custom' && (
          <div className={styles.sliderRow} style={{ marginTop: 8 }}>
            <div className={styles.sliderHeader}>
              <span className={styles.sliderLabel}>quality</span>
              <span className={styles.sliderValue}>{quality}%</span>
            </div>
            <input type="range" min="10" max="95" value={quality}
              onChange={e => { setQuality(Number(e.target.value)); setResult(null); }} className={styles.slider} />
          </div>
        )}
      </div>

      {message && <StatusMessage message={message} onAction={t => onRouteToFix?.('image', t)} />}

      <div className={styles.step}>
        <div className={styles.stepLabel}>03 — compress</div>
        <button className={styles.runBtn} onClick={run} disabled={!file || compressing}>
          {compressing ? 'Compressing…' : 'Compress Image'}
        </button>
      </div>

      {result && <ResultBox result={result} onDownload={download} />}
      <canvas ref={canvasRef} style={{ display: 'none' }} />
    </ToolShell>
  );
}
