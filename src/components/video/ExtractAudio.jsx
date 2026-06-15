import { useState, useCallback } from 'react';
import ToolShell from '@/components/ui/ToolShell';
import DropZone from '@/components/ui/DropZone';
import ProgressBar from '@/components/ui/ProgressBar';
import StatusMessage from '@/components/ui/StatusMessage';
import ResultBox from '@/components/ui/ResultBox';
import { useProcessor } from '@/hooks/useProcessor';
import { useFFmpeg } from '@/hooks/useFFmpeg';
import { validateVideoFile } from '@/lib/validate';
import { getBaseName, formatBytes } from '@/lib/format';
import { ACCEPTED, TIMEOUTS } from '@/constants/limits';
import styles from './tool.module.css';

const FORMATS = [
  { id: 'mp3', label: 'MP3', desc: 'Smaller file, universal support', mime: 'audio/mpeg',
    args: (i, o) => ['-i', i, '-vn', '-acodec', 'libmp3lame', '-q:a', '2', o] },
  { id: 'wav', label: 'WAV', desc: 'Lossless, larger file', mime: 'audio/wav',
    args: (i, o) => ['-i', i, '-vn', '-acodec', 'pcm_s16le', o] },
];

export default function ExtractAudio({ sharedFile, onRouteToFix }) {
  const [file, setFile]       = useState(sharedFile || null);
  const [format, setFormat]   = useState('mp3');
  const { state, start, finish, fail, cancel, reset, setProgress } = useProcessor(TIMEOUTS.audioExtract);
  const { getFFmpeg }         = useFFmpeg();

  const handleFile = useCallback((f) => {
    reset();
    const msg = validateVideoFile(f, 'extract-audio');
    if (msg?.type === 'danger') { setFile(f); fail(msg); return; }
    setFile(f);
    if (msg) state.message || fail(msg);
  }, [reset, fail]);

  const run = useCallback(async () => {
    if (!file) return;
    const validation = validateVideoFile(file);
    if (validation?.type === 'danger') { fail(validation); return; }
    start();

    try {
      const ffmpeg = await getFFmpeg();
      const fmt    = FORMATS.find(f => f.id === format);
      const inName  = 'input.' + file.name.split('.').pop();
      const outName = `output.${format}`;

      ffmpeg.on('progress', ({ progress }) => setProgress(Math.round(progress * 100), `Encoding ${fmt.label}…`));

      const { fetchFile } = await import('@ffmpeg/util');
      await ffmpeg.writeFile(inName, await fetchFile(file));
      await ffmpeg.exec(fmt.args(inName, outName));

      const data = await ffmpeg.readFile(outName);
      const blob = new Blob([data.buffer], { type: fmt.mime });
      const url  = URL.createObjectURL(blob);

      finish({
        name:   `${getBaseName(file)}.${format}`,
        format: fmt.label,
        size:   blob.size,
        url,
      });

      await ffmpeg.deleteFile(inName);
      await ffmpeg.deleteFile(outName);
    } catch (e) {
      fail({ type: 'danger', title: 'Processing failed', body: e.message });
    }
  }, [file, format, getFFmpeg, start, finish, fail, setProgress]);

  const selectedFmt = FORMATS.find(f => f.id === format);

  return (
    <ToolShell icon="♫" title="Extract Audio" description="Pull the audio track from any video file as MP3 or lossless WAV.">
      <div className={styles.step}>
        <div className={styles.stepLabel}>01 — video file</div>
        <DropZone accept={ACCEPTED.video} onFile={handleFile} file={file} label="Drop a video file" />
      </div>

      <div className={styles.step}>
        <div className={styles.stepLabel}>02 — output format</div>
        <div className={styles.formatGrid}>
          {FORMATS.map(f => (
            <button key={f.id} className={`${styles.fmtBtn} ${format === f.id ? styles.fmtActive : ''}`}
              onClick={() => setFormat(f.id)}>
              <span className={styles.fmtLabel}>{f.label}</span>
              <span className={styles.fmtDesc}>{f.desc}</span>
            </button>
          ))}
        </div>
      </div>

      {state.message && (
        <StatusMessage message={state.message} onAction={(tool) => onRouteToFix?.('video', tool)} />
      )}

      <div className={styles.step}>
        <div className={styles.stepLabel}>03 — extract</div>
        {state.processing
          ? <ProgressBar progress={state.progress} stage={state.stage} onCancel={cancel} />
          : (
            <button className={styles.runBtn} onClick={run} disabled={!file}>
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polygon points="5 3 19 12 5 21 5 3"/></svg>
              Extract {selectedFmt?.label}
            </button>
          )
        }
      </div>

      {state.result && <ResultBox result={state.result} />}
    </ToolShell>
  );
}
