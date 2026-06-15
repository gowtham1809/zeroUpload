import { useState, useCallback, useRef } from 'react';
import ToolShell from '@/components/ui/ToolShell';
import DropZone from '@/components/ui/DropZone';
import StatusMessage from '@/components/ui/StatusMessage';
import Spinner from '@/components/ui/Spinner';
import { validateImageFile } from '@/lib/validate';
import { getBaseName, formatBytes } from '@/lib/format';
import { ACCEPTED } from '@/constants/limits';
import styles from './tool.module.css';
import bgStyles from './RemoveBg.module.css';

export default function RemoveBg({ sharedFile, onRouteToFix }) {
  const [file, setFile]         = useState(sharedFile || null);
  const [preview, setPreview]   = useState(null);
  const [resultUrl, setResultUrl] = useState(null);
  const [processing, setProcessing] = useState(false);
  const [message, setMessage]   = useState(null);
  const [bgColor, setBgColor]   = useState('transparent');
  const [modelLoading, setModelLoading] = useState(false);

  const handleFile = useCallback((f) => {
    const msg = validateImageFile(f, 'remove-bg');
    if (msg?.type === 'danger') { setMessage(msg); setFile(f); return; }
    setMessage(msg);
    setFile(f);
    setResultUrl(null);
    setPreview(URL.createObjectURL(f));
  }, []);

  const run = useCallback(async () => {
    if (!file) return;
    setProcessing(true);
    setResultUrl(null);

    try {
      setModelLoading(true);
      setMessage({ type: 'info', title: 'Loading AI model…', body: 'First use only — cached locally after download (~5MB).' });
      const { removeBackground } = await import('@imgly/background-removal');
      setModelLoading(false);
      setMessage({ type: 'info', title: 'Removing background…', body: 'Processing locally — your image never leaves your device.' });

      const blob   = await removeBackground(file);
      let finalBlob = blob;

      // If user picked a background colour, composite onto canvas
      if (bgColor !== 'transparent') {
        const url = URL.createObjectURL(blob);
        const img = new Image();
        await new Promise(res => { img.onload = res; img.src = url; });
        const canvas = document.createElement('canvas');
        canvas.width = img.width; canvas.height = img.height;
        const ctx = canvas.getContext('2d');
        ctx.fillStyle = bgColor;
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(img, 0, 0);
        URL.revokeObjectURL(url);
        finalBlob = await new Promise(res => canvas.toBlob(res, 'image/png'));
      }

      const resultUrl = URL.createObjectURL(finalBlob);
      setResultUrl(resultUrl);
      setMessage({ type: 'success', title: 'Background removed', body: 'Download your PNG with transparent background below.' });
    } catch (e) {
      setMessage({ type: 'danger', title: 'Background removal failed', body: 'Try a smaller image or a different browser.' });
    } finally {
      setProcessing(false);
      setModelLoading(false);
    }
  }, [file, bgColor]);

  const download = () => {
    if (!resultUrl || !file) return;
    const a = document.createElement('a');
    a.href = resultUrl;
    a.download = `${getBaseName(file)}_no_bg.png`;
    a.click();
  };

  const BG_OPTIONS = [
    { value: 'transparent', label: 'Transparent' },
    { value: '#ffffff',     label: 'White' },
    { value: '#000000',     label: 'Black' },
    { value: '#f5f5f5',     label: 'Light grey' },
  ];

  return (
    <ToolShell icon="✦" title="Remove Background" description="Local AI removes the background from any image. Transparent PNG output. Max 2.5MB.">
      <div className={styles.step}>
        <div className={styles.stepLabel}>01 — image file (max 2.5 MB)</div>
        <DropZone accept={ACCEPTED.image} onFile={handleFile} file={file}
          label="Drop an image" hint="Best under 2.5 MB — larger files may crash" />
      </div>

      <div className={styles.step}>
        <div className={styles.stepLabel}>02 — background replacement (optional)</div>
        <div className={bgStyles.bgOptions}>
          {BG_OPTIONS.map(o => (
            <button key={o.value}
              className={`${bgStyles.bgBtn} ${bgColor === o.value ? bgStyles.bgActive : ''}`}
              onClick={() => setBgColor(o.value)}>
              <div className={bgStyles.bgSwatch}
                style={{ background: o.value === 'transparent'
                  ? 'repeating-conic-gradient(#ccc 0% 25%, #fff 0% 50%) 0 0 / 10px 10px'
                  : o.value }} />
              <span>{o.label}</span>
            </button>
          ))}
        </div>
      </div>

      {message && <StatusMessage message={message} onAction={t => onRouteToFix?.('image', t)} />}

      <div className={styles.step}>
        <div className={styles.stepLabel}>03 — remove</div>
        <button className={styles.runBtn} onClick={run} disabled={!file || processing || message?.type === 'danger'}>
          {processing
            ? <><Spinner size={13} /> {modelLoading ? 'Loading model…' : 'Removing background…'}</>
            : <><svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg>Remove Background</>
          }
        </button>
      </div>

      {/* Before / After preview */}
      {(preview || resultUrl) && (
        <div className={bgStyles.compare}>
          {preview && (
            <div className={bgStyles.compareItem}>
              <div className={bgStyles.compareLabel}>Before</div>
              <img src={preview} alt="Original" className={bgStyles.compareImg} />
            </div>
          )}
          {resultUrl && (
            <div className={bgStyles.compareItem}>
              <div className={bgStyles.compareLabel}>After</div>
              <div className={bgStyles.transparentBg}>
                <img src={resultUrl} alt="Background removed" className={bgStyles.compareImg} />
              </div>
              <button className={styles.runBtn} style={{ marginTop: 8 }} onClick={download}>
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
                Download PNG
              </button>
            </div>
          )}
        </div>
      )}
    </ToolShell>
  );
}
