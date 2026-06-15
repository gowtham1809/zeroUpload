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

const FPS_OPTIONS = ['10', '15', '24'];
const WIDTH_OPTIONS = [
  { label: '320px — smallest', value: '320' },
  { label: '480px — sticker',  value: '480' },
  { label: '640px — standard', value: '640' },
];

export default function GifMaker({ sharedFile, onRouteToFix }) {
  const [file, setFile]       = useState(sharedFile || null);
  const [startSec, setStart]  = useState('0');
  const [duration, setDur]    = useState('5');
  const [fps, setFps]         = useState('15');
  const [width, setWidth]     = useState('480');
  const { state, start, finish, fail, cancel, reset, setProgress } = useProcessor(TIMEOUTS.gif);
  const { getFFmpeg } = useFFmpeg();

  const handleFile = useCallback((f) => {
    reset();
    const msg = validateVideoFile(f);
    setFile(f);
    if (msg?.type === 'danger') { fail(msg); return; }
  }, [reset, fail]);

  const run = useCallback(async () => {
    if (!file) return;

    const dur = parseFloat(duration);
    if (dur > 10) {
      fail({ type: 'danger', title: 'Duration too long', body: 'GIF maker supports up to 10 seconds. Use Video Trimmer first.',
        action: { label: '→ Open Video Trimmer', tool: 'trim' } });
      return;
    }

    start();
    try {
      const ffmpeg  = await getFFmpeg();
      const inName  = 'input.' + file.name.split('.').pop();
      const palette = 'palette.png';
      const outName = 'output.gif';
      const { fetchFile } = await import('@ffmpeg/util');

      await ffmpeg.writeFile(inName, await fetchFile(file));

      // Two-pass GIF: generate palette first for quality
      setProgress(20, 'Generating colour palette…');
      await ffmpeg.exec([
        '-ss', startSec, '-t', duration, '-i', inName,
        '-vf', `fps=${fps},scale=${width}:-1:flags=lanczos,palettegen`, palette
      ]);

      setProgress(60, 'Encoding GIF…');
      await ffmpeg.exec([
        '-ss', startSec, '-t', duration, '-i', inName, '-i', palette,
        '-filter_complex', `fps=${fps},scale=${width}:-1:flags=lanczos[x];[x][1:v]paletteuse`,
        outName
      ]);

      const data = await ffmpeg.readFile(outName);
      const blob = new Blob([data.buffer], { type: 'image/gif' });
      const url  = URL.createObjectURL(blob);

      finish({ name: `${getBaseName(file)}.gif`, format: 'GIF', size: blob.size, url });
      await ffmpeg.deleteFile(inName);
      await ffmpeg.deleteFile(palette);
      await ffmpeg.deleteFile(outName);
    } catch (e) {
      fail({ type: 'danger', title: 'GIF creation failed', body: e.message });
    }
  }, [file, startSec, duration, fps, width, getFFmpeg, start, finish, fail, setProgress]);

  return (
    <ToolShell icon="◉" title="GIF Maker" description="Convert up to 10 seconds of video into a high-quality GIF. Perfect for stickers and reactions.">
      <div className={styles.step}>
        <div className={styles.stepLabel}>01 — video file</div>
        <DropZone accept={ACCEPTED.video} onFile={handleFile} file={file} label="Drop a video file (max 10 sec clip)" />
      </div>

      <div className={styles.step}>
        <div className={styles.stepLabel}>02 — clip settings</div>
        <div className={styles.optionRow}>
          <label className={styles.optionLabel}>start (sec)</label>
          <input className={styles.optionInput} type="number" min="0" value={startSec} onChange={e => setStart(e.target.value)} />
        </div>
        <div className={styles.optionRow}>
          <label className={styles.optionLabel}>duration (sec)</label>
          <input className={styles.optionInput} type="number" min="1" max="10" value={duration} onChange={e => setDur(e.target.value)} />
        </div>
        <div className={styles.optionRow}>
          <label className={styles.optionLabel}>frame rate</label>
          <select className={styles.optionSelect} value={fps} onChange={e => setFps(e.target.value)}>
            {FPS_OPTIONS.map(f => <option key={f} value={f}>{f} fps</option>)}
          </select>
        </div>
        <div className={styles.optionRow}>
          <label className={styles.optionLabel}>width</label>
          <select className={styles.optionSelect} value={width} onChange={e => setWidth(e.target.value)}>
            {WIDTH_OPTIONS.map(w => <option key={w.value} value={w.value}>{w.label}</option>)}
          </select>
        </div>
        <div className={styles.infoNote}>
          <strong>Max 10 seconds.</strong> Uses two-pass palette encoding for best GIF quality. Need a longer clip? Use Video Trimmer first.
        </div>
      </div>

      {state.message && <StatusMessage message={state.message} onAction={t => onRouteToFix?.('video', t)} />}

      <div className={styles.step}>
        <div className={styles.stepLabel}>03 — create GIF</div>
        {state.processing
          ? <ProgressBar progress={state.progress} stage={state.stage} onCancel={cancel} />
          : <button className={styles.runBtn} onClick={run} disabled={!file}>
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><circle cx="12" cy="12" r="10"/><polygon points="10 8 16 12 10 16 10 8"/></svg>
              Make GIF
            </button>
        }
      </div>

      {state.result && <ResultBox result={state.result} />}
    </ToolShell>
  );
}
