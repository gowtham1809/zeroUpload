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

export default function VideoTrimmer({ sharedFile, onRouteToFix }) {
  const [file, setFile]     = useState(sharedFile || null);
  const [start, setStart]   = useState('00:00:00');
  const [end, setEnd]       = useState('00:00:30');
  const [keepAudio, setKeepAudio] = useState(true);
  const { state, start: startProc, finish, fail, cancel, reset, setProgress } = useProcessor(TIMEOUTS.trim);
  const { getFFmpeg } = useFFmpeg();

  const handleFile = useCallback((f) => {
    reset();
    const msg = validateVideoFile(f, 'compress');
    setFile(f);
    if (msg?.type === 'danger') { fail(msg); return; }
  }, [reset, fail]);

  const run = useCallback(async () => {
    if (!file) return;
    startProc();
    try {
      const ffmpeg  = await getFFmpeg();
      const ext     = file.name.split('.').pop();
      const inName  = `input.${ext}`;
      const outName = `output.${ext}`;
      const { fetchFile } = await import('@ffmpeg/util');

      const args = ['-i', inName, '-ss', start, '-to', end, '-c:v', 'copy'];
      if (keepAudio) args.push('-c:a', 'copy'); else args.push('-an');
      args.push(outName);

      ffmpeg.on('progress', ({ progress }) => setProgress(Math.round(progress * 100), 'Trimming…'));
      await ffmpeg.writeFile(inName, await fetchFile(file));
      await ffmpeg.exec(args);

      const data = await ffmpeg.readFile(outName);
      const blob = new Blob([data.buffer], { type: file.type });
      const url  = URL.createObjectURL(blob);

      finish({ name: `${getBaseName(file)}_trimmed.${ext}`, format: ext.toUpperCase(), size: blob.size, url });
      await ffmpeg.deleteFile(inName); await ffmpeg.deleteFile(outName);
    } catch (e) {
      fail({ type: 'danger', title: 'Trim failed', body: 'Check that start time is before end time.' });
    }
  }, [file, start, end, keepAudio, getFFmpeg, startProc, finish, fail, setProgress]);

  return (
    <ToolShell icon="✂" title="Video Trimmer" description="Cut your video to exact in/out points. The original quality is preserved.">
      <div className={styles.step}>
        <div className={styles.stepLabel}>01 — video file</div>
        <DropZone accept={ACCEPTED.video} onFile={handleFile} file={file} label="Drop a video file" />
      </div>

      <div className={styles.step}>
        <div className={styles.stepLabel}>02 — trim points</div>
        <div className={styles.optionRow}>
          <label className={styles.optionLabel}>start time</label>
          <input className={styles.optionInput} value={start} onChange={e => setStart(e.target.value)} placeholder="HH:MM:SS" />
        </div>
        <div className={styles.optionRow}>
          <label className={styles.optionLabel}>end time</label>
          <input className={styles.optionInput} value={end} onChange={e => setEnd(e.target.value)} placeholder="HH:MM:SS" />
        </div>
        <label className={styles.checkRow}>
          <input type="checkbox" checked={keepAudio} onChange={e => setKeepAudio(e.target.checked)} />
          <span className={styles.checkLabel}>Keep audio track</span>
        </label>
        <div className={styles.infoNote}>
          Uses stream copy — no re-encoding. Output is instant and quality is identical to the original.
        </div>
      </div>

      {state.message && <StatusMessage message={state.message} onAction={t => onRouteToFix?.('video', t)} />}

      <div className={styles.step}>
        <div className={styles.stepLabel}>03 — trim</div>
        {state.processing
          ? <ProgressBar progress={state.progress} stage={state.stage} onCancel={cancel} />
          : <button className={styles.runBtn} onClick={run} disabled={!file}>
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><circle cx="6" cy="6" r="3"/><circle cx="6" cy="18" r="3"/><line x1="20" y1="4" x2="8.12" y2="15.88"/><line x1="14.47" y1="14.48" x2="20" y2="20"/><line x1="8.12" y1="8.12" x2="12" y2="12"/></svg>
              Trim Video
            </button>
        }
      </div>

      {state.result && <ResultBox result={state.result} />}
    </ToolShell>
  );
}
