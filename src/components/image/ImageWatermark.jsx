import { useState, useCallback, useRef, useEffect } from 'react';
import ToolShell from '@/components/ui/ToolShell';
import DropZone from '@/components/ui/DropZone';
import StatusMessage from '@/components/ui/StatusMessage';
import { validateImageFile } from '@/lib/validate';
import { getBaseName } from '@/lib/format';
import { ACCEPTED } from '@/constants/limits';
import styles from './tool.module.css';
import wmStyles from './ImageWatermark.module.css';

const POSITIONS = [
  { id: 'tl', label: 'Top Left',     x: 'left',   y: 'top'    },
  { id: 'tr', label: 'Top Right',    x: 'right',  y: 'top'    },
  { id: 'bl', label: 'Bottom Left',  x: 'left',   y: 'bottom' },
  { id: 'br', label: 'Bottom Right', x: 'right',  y: 'bottom' },
  { id: 'c',  label: 'Center',       x: 'center', y: 'center' },
];

export default function ImageWatermark({ sharedFile, onRouteToFix }) {
  const [file, setFile]       = useState(sharedFile || null);
  const [text, setText]       = useState('© ZeroUpload');
  const [position, setPos]    = useState('br');
  const [fontSize, setFontSize] = useState(32);
  const [opacity, setOpacity] = useState(70);
  const [color, setColor]     = useState('#ffffff');
  const [message, setMessage] = useState(null);
  const [imgLoaded, setImgLoaded] = useState(false);
  const canvasRef = useRef(null);
  const imgRef    = useRef(null);

  const handleFile = useCallback((f) => {
    const msg = validateImageFile(f, 'watermark');
    if (msg?.type === 'danger') { setMessage(msg); return; }
    setMessage(msg);
    setFile(f);
    const url = URL.createObjectURL(f);
    const img = new Image();
    img.onload = () => {
      imgRef.current = img;
      const canvas = canvasRef.current;
      const maxW   = Math.min(img.width, 700);
      const scale  = maxW / img.width;
      canvas.width  = Math.round(img.width  * scale);
      canvas.height = Math.round(img.height * scale);
      setImgLoaded(true);
      URL.revokeObjectURL(url);
    };
    img.src = url;
  }, []);

  // Live preview
  useEffect(() => {
    if (!imgLoaded || !canvasRef.current || !imgRef.current) return;
    const canvas = canvasRef.current;
    const ctx    = canvas.getContext('2d');
    ctx.drawImage(imgRef.current, 0, 0, canvas.width, canvas.height);
    if (!text.trim()) return;

    const pos    = POSITIONS.find(p => p.id === position);
    const fSize  = Math.round(fontSize * (canvas.width / 700));
    ctx.font     = `bold ${fSize}px sans-serif`;
    ctx.globalAlpha = opacity / 100;

    // Shadow for readability
    ctx.shadowColor   = 'rgba(0,0,0,0.6)';
    ctx.shadowBlur    = 4;
    ctx.shadowOffsetX = 1;
    ctx.shadowOffsetY = 1;
    ctx.fillStyle = color;

    const pad   = Math.round(fSize * 0.6);
    const tw    = ctx.measureText(text).width;
    let x, y;

    if (pos.x === 'left')   x = pad;
    else if (pos.x === 'right')  x = canvas.width - tw - pad;
    else x = (canvas.width - tw) / 2;

    if (pos.y === 'top')    y = pad + fSize;
    else if (pos.y === 'bottom') y = canvas.height - pad;
    else y = canvas.height / 2 + fSize / 3;

    ctx.fillText(text, x, y);
    ctx.globalAlpha  = 1;
    ctx.shadowColor  = 'transparent';
    ctx.shadowBlur   = 0;
  }, [imgLoaded, text, position, fontSize, opacity, color]);

  const download = () => {
    if (!canvasRef.current || !file) return;
    const ext     = file.name.split('.').pop().toLowerCase();
    const mime    = ext === 'png' ? 'image/png' : 'image/jpeg';
    const dataUrl = canvasRef.current.toDataURL(mime, 0.95);
    const a = document.createElement('a');
    a.href = dataUrl; a.download = `${getBaseName(file)}_watermarked.${ext}`; a.click();
  };

  return (
    <ToolShell icon="⬡" title="Image Watermark" description="Add a text watermark to any image. Preview updates live as you type.">
      <div className={styles.step}>
        <div className={styles.stepLabel}>01 — image file</div>
        <DropZone accept={ACCEPTED.image} onFile={handleFile} file={file} label="Drop an image" />
      </div>

      {message && <StatusMessage message={message} onAction={t => onRouteToFix?.('image', t)} />}

      {imgLoaded && (
        <>
          <div className={styles.step}>
            <div className={styles.stepLabel}>02 — watermark settings</div>
            <div className={styles.optionRow}>
              <label className={styles.optionLabel}>text</label>
              <input className={styles.optionInput} value={text} onChange={e => setText(e.target.value)} placeholder="Your watermark" />
            </div>

            <div className={styles.optionRow}>
              <label className={styles.optionLabel}>colour</label>
              <input type="color" value={color} onChange={e => setColor(e.target.value)} className={wmStyles.colorPicker} />
              <span className={styles.optionLabel} style={{ minWidth: 'auto', marginLeft: 8 }}>{color}</span>
            </div>

            <div className={wmStyles.posGrid}>
              {POSITIONS.map(p => (
                <button key={p.id} className={`${wmStyles.posBtn} ${position === p.id ? wmStyles.posActive : ''}`}
                  onClick={() => setPos(p.id)}>{p.label}</button>
              ))}
            </div>

            <div className={styles.sliderRow}>
              <div className={styles.sliderHeader}>
                <span className={styles.sliderLabel}>font size</span>
                <span className={styles.sliderValue}>{fontSize}px</span>
              </div>
              <input type="range" min="12" max="96" value={fontSize}
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
          </div>

          <div className={wmStyles.canvasWrap}>
            <canvas ref={canvasRef} className={wmStyles.canvas} />
            <div className={wmStyles.canvasHint}>Live preview</div>
          </div>

          <button className={styles.runBtn} onClick={download} disabled={!text.trim()}>
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
            Download Watermarked Image
          </button>
        </>
      )}

      {!imgLoaded && <canvas ref={canvasRef} style={{ display: 'none' }} />}
    </ToolShell>
  );
}
