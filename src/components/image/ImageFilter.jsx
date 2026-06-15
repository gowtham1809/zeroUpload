import { useState, useRef, useCallback, useEffect } from 'react';
import ToolShell from '@/components/ui/ToolShell';
import DropZone from '@/components/ui/DropZone';
import StatusMessage from '@/components/ui/StatusMessage';
import ResultBox from '@/components/ui/ResultBox';
import { validateImageFile } from '@/lib/validate';
import { getBaseName, formatBytes } from '@/lib/format';
import { ACCEPTED } from '@/constants/limits';
import styles from './tool.module.css';
import filterStyles from './ImageFilter.module.css';

const FILTERS = {
  none:      { label: 'Original',  fn: null },
  grayscale: { label: 'Grayscale', fn: (d) => { for(let i=0;i<d.length;i+=4){const l=0.299*d[i]+0.587*d[i+1]+0.114*d[i+2];d[i]=d[i+1]=d[i+2]=l;} } },
  sepia:     { label: 'Sepia',     fn: (d) => { for(let i=0;i<d.length;i+=4){const r=d[i],g=d[i+1],b=d[i+2];d[i]=Math.min(255,r*0.393+g*0.769+b*0.189);d[i+1]=Math.min(255,r*0.349+g*0.686+b*0.168);d[i+2]=Math.min(255,r*0.272+g*0.534+b*0.131);} } },
  invert:    { label: 'Invert',    fn: (d) => { for(let i=0;i<d.length;i+=4){d[i]=255-d[i];d[i+1]=255-d[i+1];d[i+2]=255-d[i+2];} } },
  warm:      { label: 'Warm',      fn: (d) => { for(let i=0;i<d.length;i+=4){d[i]=Math.min(255,d[i]*1.15);d[i+1]=Math.min(255,d[i+1]*1.05);d[i+2]=Math.min(255,d[i+2]*0.85);} } },
  cool:      { label: 'Cool',      fn: (d) => { for(let i=0;i<d.length;i+=4){d[i]=Math.min(255,d[i]*0.85);d[i+2]=Math.min(255,d[i+2]*1.20);} } },
  vivid:     { label: 'Vivid',     fn: (d) => { for(let i=0;i<d.length;i+=4){const g=0.299*d[i]+0.587*d[i+1]+0.114*d[i+2];d[i]=Math.min(255,g+1.4*(d[i]-g));d[i+1]=Math.min(255,g+1.4*(d[i+1]-g));d[i+2]=Math.min(255,g+1.4*(d[i+2]-g));} } },
  noir:      { label: 'Noir',      fn: (d) => { for(let i=0;i<d.length;i+=4){const l=0.299*d[i]+0.587*d[i+1]+0.114*d[i+2];const f=(259*(80+255))/(255*(259-80));const v=Math.min(255,Math.max(0,f*(l-128)+128));d[i]=d[i+1]=d[i+2]=v;} } },
};

export default function ImageFilter({ sharedFile, onRouteToFix }) {
  const [file, setFile]             = useState(sharedFile || null);
  const [activeFilter, setActiveFilter] = useState('none');
  const [brightness, setBrightness] = useState(0);
  const [contrast, setContrast]     = useState(0);
  const [saturation, setSaturation] = useState(0);
  const [message, setMessage]       = useState(null);
  const [imageLoaded, setImageLoaded] = useState(false);
  const [dims, setDims]             = useState(null);
  const canvasRef  = useRef(null);
  const origRef    = useRef(null);

  const handleFile = useCallback(async (f) => {
    const msg = validateImageFile(f, 'filter');
    if (msg?.type === 'danger') { setMessage(msg); return; }
    setMessage(msg);
    setFile(f);
    setImageLoaded(false);
    setActiveFilter('none');
    setBrightness(0); setContrast(0); setSaturation(0);

    const url = URL.createObjectURL(f);
    const img = new Image();
    img.onload = () => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const maxW = Math.min(img.width, 700);
      const scale = maxW / img.width;
      canvas.width  = Math.round(img.width  * scale);
      canvas.height = Math.round(img.height * scale);
      const ctx = canvas.getContext('2d');
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
      origRef.current = ctx.getImageData(0, 0, canvas.width, canvas.height);
      setDims({ w: canvas.width, h: canvas.height });
      setImageLoaded(true);
      URL.revokeObjectURL(url);
    };
    img.src = url;
  }, []);

  const applyAll = useCallback((filterKey, bri, con, sat) => {
    const canvas = canvasRef.current;
    if (!canvas || !origRef.current) return;
    const ctx = canvas.getContext('2d');
    const imgData = new ImageData(new Uint8ClampedArray(origRef.current.data), origRef.current.width, origRef.current.height);
    const d = imgData.data;
    const fn = FILTERS[filterKey]?.fn;
    if (fn) fn(d);
    for (let i = 0; i < d.length; i += 4) {
      if (bri !== 0) { d[i]=Math.min(255,Math.max(0,d[i]+bri*2.55)); d[i+1]=Math.min(255,Math.max(0,d[i+1]+bri*2.55)); d[i+2]=Math.min(255,Math.max(0,d[i+2]+bri*2.55)); }
      if (con !== 0) { const f=(259*(con+255))/(255*(259-con)); d[i]=Math.min(255,Math.max(0,f*(d[i]-128)+128)); d[i+1]=Math.min(255,Math.max(0,f*(d[i+1]-128)+128)); d[i+2]=Math.min(255,Math.max(0,f*(d[i+2]-128)+128)); }
      if (sat !== 0) { const g=0.299*d[i]+0.587*d[i+1]+0.114*d[i+2];const s=1+sat/100; d[i]=Math.min(255,Math.max(0,g+s*(d[i]-g))); d[i+1]=Math.min(255,Math.max(0,g+s*(d[i+1]-g))); d[i+2]=Math.min(255,Math.max(0,g+s*(d[i+2]-g))); }
    }
    ctx.putImageData(imgData, 0, 0);
  }, []);

  const handleFilter = (key) => { setActiveFilter(key); applyAll(key, brightness, contrast, saturation); };
  const handleBri = (v) => { setBrightness(v); applyAll(activeFilter, v, contrast, saturation); };
  const handleCon = (v) => { setContrast(v);   applyAll(activeFilter, brightness, v, saturation); };
  const handleSat = (v) => { setSaturation(v); applyAll(activeFilter, brightness, contrast, v); };

  const handleReset = () => {
    setActiveFilter('none'); setBrightness(0); setContrast(0); setSaturation(0);
    const canvas = canvasRef.current;
    if (canvas && origRef.current) canvas.getContext('2d').putImageData(origRef.current, 0, 0);
  };

  const handleExport = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const dataUrl = canvas.toDataURL('image/png', 1);
    const a = document.createElement('a');
    a.href = dataUrl;
    a.download = `${getBaseName(file)}_filtered.png`;
    a.click();
  };

  return (
    <ToolShell icon="◑" title="Image Filters" description="Apply preset filters and adjust brightness, contrast and saturation in real time.">
      <div className={styles.step}>
        <div className={styles.stepLabel}>01 — image file</div>
        <DropZone accept={ACCEPTED.image} onFile={handleFile} file={file} label="Drop an image file" />
      </div>

      {message && <StatusMessage message={message} onAction={t => onRouteToFix?.('image', t)} />}

      {imageLoaded && (
        <>
          <div className={styles.step}>
            <div className={styles.stepLabel}>02 — preset filters</div>
            <div className={filterStyles.filterGrid}>
              {Object.entries(FILTERS).map(([key, f]) => (
                <button key={key}
                  className={`${filterStyles.filterBtn} ${activeFilter === key ? filterStyles.filterActive : ''}`}
                  onClick={() => handleFilter(key)}>
                  {f.label}
                </button>
              ))}
            </div>
          </div>

          <div className={styles.step}>
            <div className={styles.stepLabel}>03 — adjustments</div>
            {[
              { label: 'brightness', value: brightness, set: handleBri },
              { label: 'contrast',   value: contrast,   set: handleCon },
              { label: 'saturation', value: saturation, set: handleSat },
            ].map(a => (
              <div key={a.label} className={styles.sliderRow}>
                <div className={styles.sliderHeader}>
                  <span className={styles.sliderLabel}>{a.label}</span>
                  <span className={styles.sliderValue}>{a.value > 0 ? `+${a.value}` : a.value}</span>
                </div>
                <input type="range" min="-100" max="100" value={a.value}
                  onChange={e => a.set(Number(e.target.value))} className={styles.slider} />
              </div>
            ))}
          </div>

          <div className={filterStyles.actions}>
            <button className={filterStyles.resetBtn} onClick={handleReset}>Reset</button>
            <button className={styles.runBtn} onClick={handleExport}>
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
              Export PNG
            </button>
          </div>
        </>
      )}

      <div className={filterStyles.canvasWrap}>
        {!file && (
          <div className={filterStyles.canvasEmpty}>
            <span>canvas preview</span>
          </div>
        )}
        <canvas ref={canvasRef} className={filterStyles.canvas} style={{ display: imageLoaded ? 'block' : 'none' }} />
        {imageLoaded && dims && (
          <div className={filterStyles.canvasMeta}>
            <span>{dims.w} × {dims.h}px</span>
            <span className={filterStyles.filterBadge}>{FILTERS[activeFilter]?.label}</span>
          </div>
        )}
      </div>
    </ToolShell>
  );
}
