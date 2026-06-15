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

export default function GrabFrame({ sharedFile, onRouteToFix }) {
  const [file, setFile]           = useState(sharedFile || null);
  const [timestamp, setTimestamp] = useState('00:00:05');
  const [imgFormat, setImgFormat] = useState('png');
  const { state, start, finish, fail, cancel, reset, setProgress } = useProcessor(TIMEOUTS.thumbnail);
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
      const ffmpeg  = await getFFmpeg();
      const inName  = 'input.' + file.name.split('.').pop();
      const outName = `frame.${imgFormat}`;
      const { fetchFile } = await import('@ffmpeg/util');

      await ffmpeg.writeFile(inName, await fetchFile(file));
      setProgress(30, 'Seeking to timestamp…');
      await ffmpeg.exec(['-i', inName, '-ss', timestamp, '-frames:v', '1', outName]);
      setProgress(80, 'Encoding frame…');

      const data = await ffmpeg.readFile(outName);
      const mime = imgFormat === 'png' ? 'image/png' : 'image/jpeg';
      const blob = new Blob([data.buffer], { type: mime });
      const url  = URL.createObjectURL(blob);

      finish({ name: `${getBaseName(file)}_frame_${timestamp.replace(/:/g,'')}.${imgFormat}`, format: imgFormat.toUpperCase(), size: blob.size, url });
      await ffmpeg.deleteFile(inName);
      await ffmpeg.deleteFile(outName);
    } catch (e) {
      fail({ type: 'danger', title: 'Failed to grab frame', body: 'Check the timestamp is within the video duration.' });
    }
  }, [file, timestamp, imgFormat, getFFmpeg, start, finish, fail, setProgress]);

  return (
    <ToolShell icon="◻" title="Grab Frame" description="Extract a single frame from a video at any timestamp.">
      <div className={styles.step}>
        <div className={styles.stepLabel}>01 — video file</div>
        <DropZone accept={ACCEPTED.video} onFile={handleFile} file={file} label="Drop a video file" />
      </div>

      <div className={styles.step}>
        <div className={styles.stepLabel}>02 — timestamp &amp; format</div>
        <div className={styles.optionRow}>
          <label className={styles.optionLabel}>timestamp</label>
          <input className={styles.optionInput} value={timestamp}
            onChange={e => setTimestamp(e.target.value)} placeholder="HH:MM:SS" />
        </div>
        <div className={styles.optionRow}>
          <label className={styles.optionLabel}>format</label>
          <select className={styles.optionSelect} value={imgFormat} onChange={e => setImgFormat(e.target.value)}>
            <option value="png">PNG — lossless</option>
            <option value="jpg">JPG — smaller</option>
          </select>
        </div>
      </div>

      {state.message && <StatusMessage message={state.message} onAction={t => onRouteToFix?.('video', t)} />}

      <div className={styles.step}>
        <div className={styles.stepLabel}>03 — extract</div>
        {state.processing
          ? <ProgressBar progress={state.progress} stage={state.stage} onCancel={cancel} />
          : <button className={styles.runBtn} onClick={run} disabled={!file}>
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polygon points="5 3 19 12 5 21 5 3"/></svg>
              Grab Frame
            </button>
        }
      </div>

      {state.result && <ResultBox result={state.result} />}
    </ToolShell>
  );
}
