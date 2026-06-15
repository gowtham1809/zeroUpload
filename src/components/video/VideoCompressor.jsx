import { useState, useCallback } from 'react';
import ToolShell from '@/components/ui/ToolShell';
import DropZone from '@/components/ui/DropZone';
import ProgressBar from '@/components/ui/ProgressBar';
import StatusMessage from '@/components/ui/StatusMessage';
import ResultBox from '@/components/ui/ResultBox';
import { useProcessor } from '@/hooks/useProcessor';
import { useFFmpeg } from '@/hooks/useFFmpeg';
import { validateVideoFile } from '@/lib/validate';
import { getBaseName } from '@/lib/format';
import { ACCEPTED, TIMEOUTS } from '@/constants/limits';
import styles from './tool.module.css';

// CRF: 18 = high quality, 28 = smaller file, 35 = aggressive compression
const PRESETS = [
  { id: 'light',      label: 'Light',      desc: '~60% of original',   crf: '23' },
  { id: 'balanced',   label: 'Balanced',   desc: '~40% of original',   crf: '28' },
  { id: 'aggressive', label: 'Aggressive', desc: '~20% of original',   crf: '33' },
];

export default function VideoCompressor({ sharedFile, onRouteToFix }) {
  const [file, setFile]     = useState(sharedFile || null);
  const [preset, setPreset] = useState('balanced');
  const { state, start, finish, fail, cancel, reset, setProgress } = useProcessor(TIMEOUTS.compress);
  const { getFFmpeg } = useFFmpeg();

  const handleFile = useCallback((f) => {
    reset();
    const msg = validateVideoFile(f);
    setFile(f);
    if (msg?.type === 'danger') { fail(msg); return; }
  }, [reset, fail]);

  const run = useCallback(async () => {
    if (!file) return;
    start();
    try {
      const ffmpeg = await getFFmpeg();
      const p      = PRESETS.find(p => p.id === preset);
      const ext    = 'mp4';
      const inName = 'input.' + file.name.split('.').pop();
      const outName = `output.${ext}`;
      const { fetchFile } = await import('@ffmpeg/util');

      ffmpeg.on('progress', ({ progress }) => setProgress(Math.round(progress * 100), 'Compressing…'));
      await ffmpeg.writeFile(inName, await fetchFile(file));
      await ffmpeg.exec(['-i', inName, '-c:v', 'libx264', '-crf', p.crf, '-preset', 'fast', '-c:a', 'aac', '-movflags', '+faststart', outName]);

      const data = await ffmpeg.readFile(outName);
      const blob = new Blob([data.buffer], { type: 'video/mp4' });
      const url  = URL.createObjectURL(blob);
      const savings = Math.round((1 - blob.size / file.size) * 100);

      finish({ name: `${getBaseName(file)}_compressed.${ext}`, format: 'MP4', size: blob.size, url, savings });
      await ffmpeg.deleteFile(inName); await ffmpeg.deleteFile(outName);
    } catch (e) {
      fail({ type: 'danger', title: 'Compression failed', body: e.message });
    }
  }, [file, preset, getFFmpeg, start, finish, fail, setProgress]);

  return (
    <ToolShell icon="⬇" title="Video Compressor" description="Reduce video file size using H.264 encoding. Output is always MP4.">
      <div className={styles.step}>
        <div className={styles.stepLabel}>01 — video file</div>
        <DropZone accept={ACCEPTED.video} onFile={handleFile} file={file} label="Drop a video file" />
      </div>

      <div className={styles.step}>
        <div className={styles.stepLabel}>02 — compression level</div>
        <div className={styles.formatGrid}>
          {PRESETS.map(p => (
            <button key={p.id} className={`${styles.fmtBtn} ${preset === p.id ? styles.fmtActive : ''}`}
              onClick={() => setPreset(p.id)}>
              <span className={styles.fmtLabel}>{p.label}</span>
              <span className={styles.fmtDesc}>{p.desc}</span>
            </button>
          ))}
        </div>
        <div className={styles.infoNote}>
          Compresses to MP4 (H.264). Larger or longer videos take more time — keep this tab open during processing.
        </div>
      </div>

      {state.message && <StatusMessage message={state.message} onAction={t => onRouteToFix?.('video', t)} />}

      <div className={styles.step}>
        <div className={styles.stepLabel}>03 — compress</div>
        {state.processing
          ? <ProgressBar progress={state.progress} stage={state.stage} onCancel={cancel} />
          : <button className={styles.runBtn} onClick={run} disabled={!file}>
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="3 8 12 3 21 8"/><polyline points="3 16 12 21 21 16"/><line x1="12" y1="3" x2="12" y2="21"/></svg>
              Compress Video
            </button>
        }
      </div>

      {state.result && <ResultBox result={state.result} />}
    </ToolShell>
  );
}
