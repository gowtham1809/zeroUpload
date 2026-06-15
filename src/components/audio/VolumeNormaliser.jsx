import { useState, useCallback } from 'react';
import ToolShell from '@/components/ui/ToolShell';
import DropZone from '@/components/ui/DropZone';
import ProgressBar from '@/components/ui/ProgressBar';
import StatusMessage from '@/components/ui/StatusMessage';
import ResultBox from '@/components/ui/ResultBox';
import { useProcessor } from '@/hooks/useProcessor';
import { useFFmpeg } from '@/hooks/useFFmpeg';
import { validateAudioFile } from '@/lib/validate';
import { getBaseName } from '@/lib/format';
import { ACCEPTED, TIMEOUTS } from '@/constants/limits';
import styles from './tool.module.css';

export default function VolumeNormaliser({ onRouteToFix }) {
  const [file, setFile]       = useState(null);
  const [targetDb, setTarget] = useState(-14);
  const { state, start, finish, fail, cancel, reset, setProgress } = useProcessor(TIMEOUTS.normalise);
  const { getFFmpeg } = useFFmpeg();

  const handleFile = useCallback((f) => {
    reset();
    const msg = validateAudioFile(f);
    setFile(f);
    if (msg?.type === 'danger') { fail(msg); return; }
  }, [reset, fail]);

  const run = useCallback(async () => {
    if (!file) return;
    start();
    try {
      const ffmpeg  = await getFFmpeg();
      const ext     = file.name.split('.').pop();
      const inName  = `input.${ext}`;
      const outName = `output.${ext}`;
      const { fetchFile } = await import('@ffmpeg/util');

      // loudnorm filter — EBU R128 loudness normalisation
      setProgress(20, 'Analysing audio levels…');
      await ffmpeg.writeFile(inName, await fetchFile(file));
      setProgress(50, 'Normalising volume…');
      await ffmpeg.exec(['-i', inName, '-af', `loudnorm=I=${targetDb}:TP=-1.5:LRA=11`, outName]);

      const data = await ffmpeg.readFile(outName);
      const blob = new Blob([data.buffer], { type: file.type });
      const url  = URL.createObjectURL(blob);

      finish({ name: `${getBaseName(file)}_normalised.${ext}`, format: ext.toUpperCase(), size: blob.size, url });
      await ffmpeg.deleteFile(inName); await ffmpeg.deleteFile(outName);
    } catch (e) {
      fail({ type: 'danger', title: 'Normalisation failed', body: e.message });
    }
  }, [file, targetDb, getFFmpeg, start, finish, fail, setProgress]);

  return (
    <ToolShell icon="◈" title="Volume Normaliser" description="Bring audio to a consistent loudness level using EBU R128 normalisation.">
      <div className={styles.step}>
        <div className={styles.stepLabel}>01 — audio file</div>
        <DropZone accept={ACCEPTED.audio} onFile={handleFile} file={file} label="Drop an audio file" />
      </div>

      <div className={styles.step}>
        <div className={styles.stepLabel}>02 — target loudness</div>
        <div className={styles.sliderRow}>
          <div className={styles.sliderHeader}>
            <span className={styles.sliderLabel}>integrated loudness (LUFS)</span>
            <span className={styles.sliderValue}>{targetDb} dB</span>
          </div>
          <input type="range" min="-24" max="-6" value={targetDb}
            onChange={e => setTarget(Number(e.target.value))} className={styles.slider} />
        </div>
        <div className={styles.infoNote}>
          <strong>-14 LUFS</strong> — Spotify / YouTube standard &nbsp;|&nbsp;
          <strong>-16 LUFS</strong> — Podcast standard &nbsp;|&nbsp;
          <strong>-23 LUFS</strong> — Broadcast standard
        </div>
      </div>

      {state.message && <StatusMessage message={state.message} />}

      <div className={styles.step}>
        <div className={styles.stepLabel}>03 — normalise</div>
        {state.processing
          ? <ProgressBar progress={state.progress} stage={state.stage} onCancel={cancel} />
          : <button className={styles.runBtn} onClick={run} disabled={!file}>
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></svg>
              Normalise Volume
            </button>
        }
      </div>

      {state.result && <ResultBox result={state.result} />}
    </ToolShell>
  );
}
