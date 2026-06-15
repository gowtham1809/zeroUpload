import { useState, useCallback, useRef } from 'react';
import ToolShell from '@/components/ui/ToolShell';
import DropZone from '@/components/ui/DropZone';
import StatusMessage from '@/components/ui/StatusMessage';
import ResultBox from '@/components/ui/ResultBox';
import Toggle from '@/components/ui/Toggle';
import { validateImageFile } from '@/lib/validate';
import { getBaseName, formatBytes } from '@/lib/format';
import { ACCEPTED } from '@/constants/limits';
import styles from './tool.module.css';
import convertStyles from './ImageConvert.module.css';

const FORMATS = [
  { id: 'image/jpeg', label: 'JPG',  ext: 'jpg',  lossy: true  },
  { id: 'image/png',  label: 'PNG',  ext: 'png',  lossy: false },
  { id: 'image/webp', label: 'WebP', ext: 'webp', lossy: true  },
  { id: 'image/bmp',  label: 'BMP',  ext: 'bmp',  lossy: false },
];

export default function ImageConvert({ sharedFile, onRouteToFix }) {
  const [file, setFile]             = useState(sharedFile || null);
  const [preview, setPreview]       = useState(null);
  const [targetFmt, setTargetFmt]   = useState('image/webp');
  const [quality, setQuality]       = useState(90);
  const [useTargetSize, setUseTargetSize] = useState(false);
  const [targetSizeVal, setTargetSizeVal] = useState(500);
  const [targetSizeUnit, setTargetSizeUnit] = useState('KB');
  const [converting, setConverting] = useState(false);
  const [result, setResult]         = useState(null);
  const [message, setMessage]       = useState(null);
  const [origSize, setOrigSize]     = useState(0);
  const canvasRef = useRef(null);

  const selectedFmt = FORMATS.find(f => f.id === targetFmt);

  const handleFile = useCallback((f) => {
    const msg = validateImageFile(f, 'convert');
    if (msg?.type === 'danger') { setMessage(msg); return; }
    setMessage(msg);
    setFile(f); setResult(null); setOrigSize(f.size);
    setPreview(URL.createObjectURL(f));
  }, []);

  const convert = useCallback(() => {
    if (!file || !preview) return;
    setConverting(true);
    const img = new Image();
    img.onload = () => {
      const canvas = canvasRef.current;
      canvas.width = img.naturalWidth; canvas.height = img.naturalHeight;
      const ctx = canvas.getContext('2d');
      if (targetFmt === 'image/jpeg') { ctx.fillStyle = '#fff'; ctx.fillRect(0, 0, canvas.width, canvas.height); }
      ctx.drawImage(img, 0, 0);

      const encode = (q) => canvas.toDataURL(targetFmt, q);
      const b64size = (du) => Math.round((du.split(',')[1].length * 3) / 4);

      let dataUrl, finalQ = quality;

      if (useTargetSize && selectedFmt.lossy) {
        const targetBytes = targetSizeVal * (targetSizeUnit === 'MB' ? 1048576 : 1024);
        let lo = 1, hi = 100, best = null;
        for (let i = 0; i < 12; i++) {
          const mid = Math.round((lo + hi) / 2);
          const url = encode(mid / 100);
          if (b64size(url) <= targetBytes) { best = url; finalQ = mid; lo = mid + 1; }
          else hi = mid - 1;
          if (lo > hi) break;
        }
        dataUrl = best || encode(0.01);
      } else {
        dataUrl = encode(selectedFmt.lossy ? quality / 100 : undefined);
      }

      const outputSize = b64size(dataUrl);
      const savings    = Math.round((1 - outputSize / origSize) * 100);
      setResult({ dataUrl, name: `${getBaseName(file)}.${selectedFmt.ext}`, size: outputSize, format: selectedFmt.label, savings, finalQ: useTargetSize && selectedFmt.lossy ? finalQ : null });
      setConverting(false);
    };
    img.src = preview;
  }, [file, preview, targetFmt, quality, useTargetSize, targetSizeVal, targetSizeUnit, selectedFmt, origSize]);

  const download = () => {
    if (!result) return;
    const a = document.createElement('a'); a.href = result.dataUrl; a.download = result.name; a.click();
  };

  const sourceFmtLabel = file ? (file.type?.split('/')[1] || file.name.split('.').pop()).toUpperCase() : null;

  return (
    <ToolShell icon="⬡" title="Image Convert" description="Convert between JPG, PNG, WebP and BMP with quality and target file size control.">
      <div className={convertStyles.layout}>
        <div className={convertStyles.left}>
          <div className={styles.step}>
            <div className={styles.stepLabel}>01 — image file</div>
            <DropZone accept={ACCEPTED.image} onFile={handleFile} file={file} label="Drop an image to convert" />
          </div>

          <div className={styles.step}>
            <div className={styles.stepLabel}>02 — output format</div>
            <div className={convertStyles.fmtGrid}>
              {FORMATS.map(f => {
                const isSame = file && f.id === file.type;
                return (
                  <button key={f.id}
                    className={`${convertStyles.fmtBtn} ${targetFmt === f.id ? convertStyles.fmtActive : ''} ${isSame ? convertStyles.fmtSame : ''}`}
                    onClick={() => { setTargetFmt(f.id); setResult(null); }}>
                    <span className={convertStyles.fmtLabel}>{f.label}</span>
                    {isSame && <span className={convertStyles.fmtSameTag}>current</span>}
                  </button>
                );
              })}
            </div>
          </div>

          {selectedFmt?.lossy && (
            <div className={styles.step}>
              <div className={styles.stepLabel}>02b — quality</div>
              <div className={styles.sliderRow}>
                <div className={styles.sliderHeader}>
                  <span className={styles.sliderLabel}>quality</span>
                  <span className={styles.sliderValue}>{quality}%</span>
                </div>
                <input type="range" min="10" max="100" value={quality}
                  onChange={e => { setQuality(Number(e.target.value)); setResult(null); }} className={styles.slider} />
              </div>

              <div className={styles.step} style={{ marginTop: 8 }}>
                <Toggle checked={useTargetSize} onChange={setUseTargetSize} label="Reduce to target file size" />
                {useTargetSize && (
                  <div className={convertStyles.targetRow}>
                    <input type="number" min="1" className={styles.optionInput}
                      value={targetSizeVal} onChange={e => { setTargetSizeVal(Number(e.target.value)); setResult(null); }} />
                    <select className={styles.optionSelect} value={targetSizeUnit}
                      onChange={e => { setTargetSizeUnit(e.target.value); setResult(null); }}>
                      <option value="KB">KB</option>
                      <option value="MB">MB</option>
                    </select>
                  </div>
                )}
              </div>
            </div>
          )}

          {message && <StatusMessage message={message} onAction={t => onRouteToFix?.('image', t)} />}

          <div className={styles.step}>
            <div className={styles.stepLabel}>03 — convert</div>
            <button className={styles.runBtn} onClick={convert} disabled={!file || converting}>
              {converting ? 'Converting…' : `${sourceFmtLabel || '?'} → ${selectedFmt?.label}`}
            </button>
          </div>

          {result && (
            <ResultBox result={result}
              onDownload={download}
              extra={result.finalQ !== null ? `Quality auto-set to ${result.finalQ}% to hit target` : null}
            />
          )}
        </div>

        <div className={convertStyles.right}>
          <div className={styles.stepLabel}>preview</div>
          {preview
            ? <div className={convertStyles.previewWrap}>
                <img src={preview} alt="Preview" className={convertStyles.previewImg} />
                {file && <div className={convertStyles.previewMeta}><span>{file.name}</span><span>{formatBytes(file.size)}</span></div>}
              </div>
            : <div className={convertStyles.previewEmpty}>image preview</div>
          }

          <div className={styles.stepLabel} style={{ marginTop: '1.25rem' }}>format guide</div>
          <div className={convertStyles.guide}>
            {[
              { fmt: 'JPG',  color: '#40aaff', use: 'Photos. Lossy — smallest files.' },
              { fmt: 'PNG',  color: '#c8f060', use: 'Logos, transparency. Lossless.' },
              { fmt: 'WebP', color: '#b070ff', use: 'Web. Best compression ratio.' },
              { fmt: 'BMP',  color: '#ff7070', use: 'Legacy. Uncompressed, large.' },
            ].map(g => (
              <div key={g.fmt} className={convertStyles.guideRow}>
                <span className={convertStyles.guideFmt} style={{ color: g.color }}>{g.fmt}</span>
                <span className={convertStyles.guideUse}>{g.use}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
      <canvas ref={canvasRef} style={{ display: 'none' }} />
    </ToolShell>
  );
}
