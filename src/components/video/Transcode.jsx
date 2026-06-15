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

const TARGETS = [
  { id: 'webm', label: 'WebM',  desc: 'Best for web (VP9 + Opus)',  ext: 'webm', mime: 'video/webm',
    args: (i,o) => ['-i',i,'-c:v','libvpx-vp9','-c:a','libopus',o] },
  { id: 'mp4',  label: 'MP4',   desc: 'Universal (H.264 + AAC)',    ext: 'mp4',  mime: 'video/mp4',
    args: (i,o) => ['-i',i,'-c:v','libx264','-c:a','aac','-movflags','+faststart',o] },
  { id: 'mov',  label: 'MOV',   desc: 'Apple compatible',           ext: 'mov',  mime: 'video/quicktime',
    args: (i,o) => ['-i',i,'-c:v','libx264','-c:a','aac',o] },
];

export default function Transcode({ sharedFile, onRouteToFix }) {
  const [file, setFile]     = useState(sharedFile || null);
  const [target, setTarget] = useState('webm');
  const { state, start, finish, fail, cancel, reset, setProgress } = useProcessor(TIMEOUTS.transcode);
  const { getFFmpeg } = useFFmpeg();

  const handleFile = useCallback((f) => {
    reset();
    const msg = validateVideoFile(f, 'compress');
    setFile(f);
    if (msg?.type === 'danger') { fail(msg); return; }
  }, [reset, fail]);

  const run = useCallback(async () => {
    if (!file) return;
    start();
    try {
      const ffmpeg = await getFFmpeg();
      const t      = TARGETS.find(t => t.id === target);
      const inName = 'input.' + file.name.split('.').pop();
      const outName = `output.${t.ext}`;
      const { fetchFile } = await import('@ffmpeg/util');

      ffmpeg.on('progress', ({ progress }) => setProgress(Math.round(progress * 100), `Transcoding to ${t.label}…`));
      await ffmpeg.writeFile(inName, await fetchFile(file));
      await ffmpeg.exec(t.args(inName, outName));

      const data = await ffmpeg.readFile(outName);
      const blob = new Blob([data.buffer], { type: t.mime });
      const url  = URL.createObjectURL(blob);

      finish({ name: `${getBaseName(file)}.${t.ext}`, format: t.label, size: blob.size, url });
      await ffmpeg.deleteFile(inName); await ffmpeg.deleteFile(outName);
    } catch (e) {
      fail({ type: 'danger', title: 'Transcode failed', body: e.message });
    }
  }, [file, target, getFFmpeg, start, finish, fail, setProgress]);

  return (
    <ToolShell icon="⇄" title="Transcode" description="Convert between video formats — MP4, WebM, MOV — entirely in your browser.">
      <div className={styles.step}>
        <div className={styles.stepLabel}>01 — video file</div>
        <DropZone accept={ACCEPTED.video} onFile={handleFile} file={file} label="Drop a video file" />
      </div>

      <div className={styles.step}>
        <div className={styles.stepLabel}>02 — output format</div>
        <div className={styles.formatGrid}>
          {TARGETS.map(t => (
            <button key={t.id} className={`${styles.fmtBtn} ${target === t.id ? styles.fmtActive : ''}`}
              onClick={() => setTarget(t.id)}>
              <span className={styles.fmtLabel}>{t.label}</span>
              <span className={styles.fmtDesc}>{t.desc}</span>
            </button>
          ))}
        </div>
      </div>

      {state.message && <StatusMessage message={state.message} onAction={t => onRouteToFix?.('video', t)} />}

      <div className={styles.step}>
        <div className={styles.stepLabel}>03 — convert</div>
        {state.processing
          ? <ProgressBar progress={state.progress} stage={state.stage} onCancel={cancel} />
          : <button className={styles.runBtn} onClick={run} disabled={!file}>
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="17 1 21 5 17 9"/><path d="M3 11V9a4 4 0 0 1 4-4h14"/><polyline points="7 23 3 19 7 15"/><path d="M21 13v2a4 4 0 0 1-4 4H3"/></svg>
              Transcode Video
            </button>
        }
      </div>

      {state.result && <ResultBox result={state.result} />}
    </ToolShell>
  );
}
