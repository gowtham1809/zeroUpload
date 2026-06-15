import { useState, useCallback, useRef, useEffect } from 'react';
import ToolShell from '@/components/ui/ToolShell';
import DropZone from '@/components/ui/DropZone';
import StatusMessage from '@/components/ui/StatusMessage';
import Spinner from '@/components/ui/Spinner';
import { validateAudioFile } from '@/lib/validate';
import { formatDuration, formatBytes } from '@/lib/format';
import { ACCEPTED } from '@/constants/limits';
import styles from './WaveformVisualiser.module.css';
import toolStyles from './tool.module.css';

export default function WaveformVisualiser() {
  const [file, setFile]         = useState(null);
  const [loading, setLoading]   = useState(false);
  const [duration, setDuration] = useState(null);
  const [message, setMessage]   = useState(null);
  const [playing, setPlaying]   = useState(false);
  const canvasRef = useRef(null);
  const audioRef  = useRef(null);
  const sourceRef = useRef(null);

  const handleFile = useCallback(async (f) => {
    const msg = validateAudioFile(f);
    if (msg?.type === 'danger') { setMessage(msg); return; }
    setMessage(msg);
    setFile(f);
    setLoading(true);
    setPlaying(false);

    try {
      const arrayBuffer = await f.arrayBuffer();
      const audioCtx    = new (window.AudioContext || window.webkitAudioContext)();
      const decoded     = await audioCtx.decodeAudioData(arrayBuffer);
      setDuration(decoded.duration);

      // Draw waveform
      const canvas  = canvasRef.current;
      const ctx     = canvas.getContext('2d');
      const data    = decoded.getChannelData(0);
      const W       = canvas.width;
      const H       = canvas.height;
      const step    = Math.ceil(data.length / W);
      const mid     = H / 2;

      const style   = getComputedStyle(document.documentElement);
      const accent  = style.getPropertyValue('--accent').trim() || '#c8f060';
      const bg      = style.getPropertyValue('--bg3').trim() || '#1c1c19';

      ctx.clearRect(0, 0, W, H);
      ctx.fillStyle = bg;
      ctx.fillRect(0, 0, W, H);

      for (let x = 0; x < W; x++) {
        let min = 1, max = -1;
        for (let j = 0; j < step; j++) {
          const v = data[(x * step) + j] || 0;
          if (v < min) min = v;
          if (v > max) max = v;
        }
        const alpha = 0.5 + Math.abs(max - min) * 0.5;
        ctx.fillStyle = accent.replace(')', `, ${alpha.toFixed(2)})`).replace('rgb', 'rgba').replace('#', 'rgba(').replace('c8f060', '200,240,96,');
        // Simpler: just use accent color with opacity
        ctx.globalAlpha = 0.4 + Math.abs(max - min) * 0.6;
        ctx.fillStyle = accent.startsWith('#') ? accent : accent;
        ctx.fillRect(x, mid + min * mid, 1, Math.max(1, (max - min) * mid));
      }
      ctx.globalAlpha = 1;

      // Create audio element for playback
      const url = URL.createObjectURL(f);
      if (audioRef.current) {
        audioRef.current.src = url;
      }
    } catch (e) {
      setMessage({ type: 'danger', title: 'Could not decode audio', body: 'This format may not be supported by your browser.' });
    } finally {
      setLoading(false);
    }
  }, []);

  const togglePlay = () => {
    if (!audioRef.current) return;
    if (playing) { audioRef.current.pause(); setPlaying(false); }
    else         { audioRef.current.play();  setPlaying(true);  }
  };

  return (
    <ToolShell icon="〜" title="Waveform Visualiser" description="See the waveform of your audio and play it back directly in your browser.">
      <div className={toolStyles.step}>
        <div className={toolStyles.stepLabel}>01 — audio file</div>
        <DropZone accept={ACCEPTED.audio} onFile={handleFile} file={file} label="Drop an audio file" />
      </div>

      {message && <StatusMessage message={message} />}

      {loading && (
        <div className={styles.loading}>
          <Spinner size={18} />
          <span>Decoding audio…</span>
        </div>
      )}

      {file && !loading && (
        <>
          <div className={toolStyles.step}>
            <div className={toolStyles.stepLabel}>waveform</div>
            <div className={styles.canvasWrap}>
              <canvas ref={canvasRef} className={styles.canvas} width={700} height={120} />
            </div>
          </div>

          <div className={styles.player}>
            <button className={styles.playBtn} onClick={togglePlay}>
              {playing
                ? <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><rect x="6" y="4" width="4" height="16"/><rect x="14" y="4" width="4" height="16"/></svg>
                : <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><polygon points="5 3 19 12 5 21 5 3"/></svg>
              }
              {playing ? 'Pause' : 'Play'}
            </button>
            <div className={styles.meta}>
              {duration && <span>{formatDuration(duration)}</span>}
              <span>{formatBytes(file.size)}</span>
              <span>{file.name.split('.').pop().toUpperCase()}</span>
            </div>
            <audio ref={audioRef} onEnded={() => setPlaying(false)} style={{ display: 'none' }} />
          </div>
        </>
      )}
    </ToolShell>
  );
}
