import { useState, useCallback } from 'react';
import ToolShell from '@/components/ui/ToolShell';
import DropZone from '@/components/ui/DropZone';
import ProgressBar from '@/components/ui/ProgressBar';
import StatusMessage from '@/components/ui/StatusMessage';
import { useProcessor } from '@/hooks/useProcessor';
import { useFFmpeg } from '@/hooks/useFFmpeg';
import { validateVideoFile } from '@/lib/validate';
import { getBaseName } from '@/lib/format';
import { ACCEPTED, TIMEOUTS } from '@/constants/limits';
import styles from './tool.module.css';
import thumbStyles from './ThumbnailGenerator.module.css';

export default function ThumbnailGenerator({ sharedFile, onRouteToFix }) {
  const [file, setFile]     = useState(sharedFile || null);
  const [count, setCount]   = useState(6);
  const [thumbs, setThumbs] = useState([]);
  const { state, start, finish, fail, cancel, reset, setProgress } = useProcessor(TIMEOUTS.thumbnail);
  const { getFFmpeg } = useFFmpeg();

  const handleFile = useCallback((f) => {
    reset(); setThumbs([]);
    const msg = validateVideoFile(f);
    setFile(f);
    if (msg?.type === 'danger') { fail(msg); return; }
  }, [reset, fail]);

  const run = useCallback(async () => {
    if (!file) return;
    start(); setThumbs([]);
    try {
      const ffmpeg  = await getFFmpeg();
      const inName  = 'input.' + file.name.split('.').pop();
      const { fetchFile } = await import('@ffmpeg/util');
      await ffmpeg.writeFile(inName, await fetchFile(file));

      const urls = [];
      for (let i = 0; i < count; i++) {
        setProgress(Math.round((i / count) * 90), `Extracting frame ${i + 1} of ${count}…`);
        const outName = `thumb${i}.jpg`;
        // evenly spaced — use select filter
        await ffmpeg.exec([
          '-i', inName,
          '-vf', `select=eq(n\\,${i * Math.floor(300 / count)}),scale=320:-1`,
          '-vframes', '1', outName
        ]);
        const data = await ffmpeg.readFile(outName);
        const blob = new Blob([data.buffer], { type: 'image/jpeg' });
        urls.push(URL.createObjectURL(blob));
        await ffmpeg.deleteFile(outName);
      }

      await ffmpeg.deleteFile(inName);
      setThumbs(urls);
      finish({ name: `${getBaseName(file)}_thumbnails`, format: 'JPG', size: 0, url: '#' });
    } catch (e) {
      fail({ type: 'danger', title: 'Thumbnail extraction failed', body: e.message });
    }
  }, [file, count, getFFmpeg, start, finish, fail, setProgress]);

  const downloadThumb = (url, i) => {
    const a = document.createElement('a');
    a.href = url; a.download = `${getBaseName(file)}_thumb_${i + 1}.jpg`; a.click();
  };

  return (
    <ToolShell icon="⊞" title="Thumbnail Generator" description="Extract multiple evenly-spaced preview frames from your video.">
      <div className={styles.step}>
        <div className={styles.stepLabel}>01 — video file</div>
        <DropZone accept={ACCEPTED.video} onFile={handleFile} file={file} label="Drop a video file" />
      </div>

      <div className={styles.step}>
        <div className={styles.stepLabel}>02 — number of frames</div>
        <div className={styles.sliderRow}>
          <div className={styles.sliderHeader}>
            <span className={styles.sliderLabel}>frames to extract</span>
            <span className={styles.sliderValue}>{count}</span>
          </div>
          <input type="range" min="2" max="12" value={count}
            onChange={e => setCount(Number(e.target.value))} className={styles.slider} />
        </div>
      </div>

      {state.message && <StatusMessage message={state.message} onAction={t => onRouteToFix?.('video', t)} />}

      <div className={styles.step}>
        <div className={styles.stepLabel}>03 — generate</div>
        {state.processing
          ? <ProgressBar progress={state.progress} stage={state.stage} onCancel={cancel} />
          : <button className={styles.runBtn} onClick={run} disabled={!file}>
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/></svg>
              Generate Thumbnails
            </button>
        }
      </div>

      {thumbs.length > 0 && (
        <div className={styles.step}>
          <div className={styles.stepLabel}>frames — click to download</div>
          <div className={thumbStyles.grid}>
            {thumbs.map((url, i) => (
              <button key={i} className={thumbStyles.thumb} onClick={() => downloadThumb(url, i)}>
                <img src={url} alt={`Frame ${i + 1}`} />
                <span className={thumbStyles.thumbLabel}>Frame {i + 1}</span>
              </button>
            ))}
          </div>
        </div>
      )}
    </ToolShell>
  );
}
