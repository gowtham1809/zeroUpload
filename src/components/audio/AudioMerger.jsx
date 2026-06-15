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

const MODES = [
  { id: 'concat',  label: 'Concatenate', desc: 'Play one after the other' },
  { id: 'mix',     label: 'Mix',         desc: 'Overlay both tracks together' },
];

export default function AudioMerger({ onRouteToFix }) {
  const [file1, setFile1] = useState(null);
  const [file2, setFile2] = useState(null);
  const [mode, setMode]   = useState('concat');
  const { state, start, finish, fail, cancel, reset, setProgress } = useProcessor(TIMEOUTS.audioMerge);
  const { getFFmpeg } = useFFmpeg();

  const handleFile1 = useCallback((f) => { reset(); const m = validateAudioFile(f); setFile1(f); if (m?.type==='danger') fail(m); }, [reset, fail]);
  const handleFile2 = useCallback((f) => { const m = validateAudioFile(f); setFile2(f); if (m?.type==='danger') fail(m); }, [fail]);

  const run = useCallback(async () => {
    if (!file1 || !file2) return;
    start();
    try {
      const ffmpeg  = await getFFmpeg();
      const ext1    = file1.name.split('.').pop();
      const ext2    = file2.name.split('.').pop();
      const outName = 'merged.mp3';
      const { fetchFile } = await import('@ffmpeg/util');

      await ffmpeg.writeFile(`a.${ext1}`, await fetchFile(file1));
      await ffmpeg.writeFile(`b.${ext2}`, await fetchFile(file2));
      setProgress(30, mode === 'concat' ? 'Concatenating…' : 'Mixing tracks…');

      if (mode === 'concat') {
        await ffmpeg.exec(['-i', `a.${ext1}`, '-i', `b.${ext2}`, '-filter_complex', '[0:a][1:a]concat=n=2:v=0:a=1', outName]);
      } else {
        await ffmpeg.exec(['-i', `a.${ext1}`, '-i', `b.${ext2}`, '-filter_complex', '[0:a][1:a]amix=inputs=2:duration=longest', outName]);
      }

      const data = await ffmpeg.readFile(outName);
      const blob = new Blob([data.buffer], { type: 'audio/mpeg' });
      const url  = URL.createObjectURL(blob);

      finish({ name: `${getBaseName(file1)}_merged.mp3`, format: 'MP3', size: blob.size, url });
      await ffmpeg.deleteFile(`a.${ext1}`); await ffmpeg.deleteFile(`b.${ext2}`); await ffmpeg.deleteFile(outName);
    } catch (e) {
      fail({ type: 'danger', title: 'Merge failed', body: e.message });
    }
  }, [file1, file2, mode, getFFmpeg, start, finish, fail, setProgress]);

  return (
    <ToolShell icon="⊕" title="Audio Merger" description="Concatenate two audio files or mix them together into a single track.">
      <div className={styles.step}>
        <div className={styles.stepLabel}>01 — first audio file</div>
        <DropZone accept={ACCEPTED.audio} onFile={handleFile1} file={file1} label="Drop first audio file" />
      </div>
      <div className={styles.step}>
        <div className={styles.stepLabel}>02 — second audio file</div>
        <DropZone accept={ACCEPTED.audio} onFile={handleFile2} file={file2} label="Drop second audio file" />
      </div>
      <div className={styles.step}>
        <div className={styles.stepLabel}>03 — merge mode</div>
        <div className={styles.formatGrid}>
          {MODES.map(m => (
            <button key={m.id} className={`${styles.fmtBtn} ${mode === m.id ? styles.fmtActive : ''}`} onClick={() => setMode(m.id)}>
              <span className={styles.fmtLabel}>{m.label}</span>
              <span className={styles.fmtDesc}>{m.desc}</span>
            </button>
          ))}
        </div>
      </div>
      {state.message && <StatusMessage message={state.message} />}
      <div className={styles.step}>
        <div className={styles.stepLabel}>04 — merge</div>
        {state.processing
          ? <ProgressBar progress={state.progress} stage={state.stage} onCancel={cancel} />
          : <button className={styles.runBtn} onClick={run} disabled={!file1 || !file2}>
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
              Merge Audio
            </button>
        }
      </div>
      {state.result && <ResultBox result={state.result} />}
    </ToolShell>
  );
}
