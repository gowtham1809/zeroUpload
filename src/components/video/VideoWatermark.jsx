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

const POSITIONS = [
  { id: 'topleft',     label: 'Top Left',     x: '20',                      y: '20' },
  { id: 'topright',    label: 'Top Right',    x: 'w-tw-20',                 y: '20' },
  { id: 'bottomleft',  label: 'Bottom Left',  x: '20',                      y: 'h-th-20' },
  { id: 'bottomright', label: 'Bottom Right', x: 'w-tw-20',                 y: 'h-th-20' },
  { id: 'center',      label: 'Center',       x: '(w-tw)/2',                y: '(h-th)/2' },
];

export default function VideoWatermark({ sharedFile, onRouteToFix }) {
  const [file, setFile]       = useState(sharedFile || null);
  const [text, setText]       = useState('© ZeroUpload');
  const [position, setPos]    = useState('bottomright');
  const [fontSize, setFontSize] = useState(28);
  const [opacity, setOpacity] = useState(80);
  const { state, start, finish, fail, cancel, reset, setProgress } = useProcessor(TIMEOUTS.watermark);
  const { getFFmpeg } = useFFmpeg();

  const handleFile = useCallback((f) => {
    reset();
    const msg = validateVideoFile(f, 'compress');
    setFile(f);
    if (msg?.type === 'danger') { fail(msg); return; }
  }, [reset, fail]);

  const run = useCallback(async () => {
    if (!file || !text.trim()) return;
    start();
    try {
      const ffmpeg  = await getFFmpeg();
      const ext     = 'mp4';
      const inName  = 'input.' + file.name.split('.').pop();
      const outName = `output.${ext}`;
      const pos     = POSITIONS.find(p => p.id === position);
      const alpha   = (opacity / 100).toFixed(2);
      const { fetchFile } = await import('@ffmpeg/util');

      // drawtext filter
      const filter = `drawtext=text='${text.replace(/'/g, "\\'")}':fontsize=${fontSize}:fontcolor=white@${alpha}:x=${pos.x}:y=${pos.y}:shadowcolor=black@0.5:shadowx=2:shadowy=2`;

      ffmpeg.on('progress', ({ progress }) => setProgress(Math.round(progress * 100), 'Burning watermark…'));
      await ffmpeg.writeFile(inName, await fetchFile(file));
      await ffmpeg.exec(['-i', inName, '-vf', filter, '-c:a', 'copy', outName]);

      const data = await ffmpeg.readFile(outName);
      const blob = new Blob([data.buffer], { type: 'video/mp4' });
      const url  = URL.createObjectURL(blob);

      finish({ name: `${getBaseName(file)}_watermarked.${ext}`, format: 'MP4', size: blob.size, url });
      await ffmpeg.deleteFile(inName); await ffmpeg.deleteFile(outName);
    } catch (e) {
      fail({ type: 'danger', title: 'Watermark failed', body: e.message });
    }
  }, [file, text, position, fontSize, opacity, getFFmpeg, start, finish, fail, setProgress]);

  const pos = POSITIONS.find(p => p.id === position);

  return (
    <ToolShell icon="⬡" title="Add Watermark" description="Burn text onto your video. Position, size and opacity are all adjustable.">
      <div className={styles.step}>
        <div className={styles.stepLabel}>01 — video file</div>
        <DropZone accept={ACCEPTED.video} onFile={handleFile} file={file} label="Drop a video file" />
      </div>

      <div className={styles.step}>
        <div className={styles.stepLabel}>02 — watermark settings</div>
        <div className={styles.optionRow}>
          <label className={styles.optionLabel}>text</label>
          <input className={styles.optionInput} value={text} onChange={e => setText(e.target.value)} placeholder="Your watermark text" />
        </div>

        <div className={styles.optionRow}>
          <label className={styles.optionLabel}>position</label>
          <select className={styles.optionSelect} value={position} onChange={e => setPos(e.target.value)}>
            {POSITIONS.map(p => <option key={p.id} value={p.id}>{p.label}</option>)}
          </select>
        </div>

        <div className={styles.sliderRow}>
          <div className={styles.sliderHeader}>
            <span className={styles.sliderLabel}>font size</span>
            <span className={styles.sliderValue}>{fontSize}px</span>
          </div>
          <input type="range" min="12" max="72" value={fontSize}
            onChange={e => setFontSize(Number(e.target.value))} className={styles.slider} />
        </div>

        <div className={styles.sliderRow}>
          <div className={styles.sliderHeader}>
            <span className={styles.sliderLabel}>opacity</span>
            <span className={styles.sliderValue}>{opacity}%</span>
          </div>
          <input type="range" min="10" max="100" value={opacity}
            onChange={e => setOpacity(Number(e.target.value))} className={styles.slider} />
        </div>

        <div className={styles.infoNote}>
          Watermark is burned directly into the video — it cannot be removed after. Output is MP4.
        </div>
      </div>

      {state.message && <StatusMessage message={state.message} onAction={t => onRouteToFix?.('video', t)} />}

      <div className={styles.step}>
        <div className={styles.stepLabel}>03 — apply</div>
        {state.processing
          ? <ProgressBar progress={state.progress} stage={state.stage} onCancel={cancel} />
          : <button className={styles.runBtn} onClick={run} disabled={!file || !text.trim()}>
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M12 20h9"/><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"/></svg>
              Burn Watermark
            </button>
        }
      </div>

      {state.result && <ResultBox result={state.result} />}
    </ToolShell>
  );
}
