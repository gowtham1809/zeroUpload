import { useState, useCallback, useRef, useEffect } from 'react';
import ToolShell from '@/components/ui/ToolShell';
import DropZone from '@/components/ui/DropZone';
import StatusMessage from '@/components/ui/StatusMessage';
import { validateImageFile } from '@/lib/validate';
import { getBaseName } from '@/lib/format';
import { ACCEPTED } from '@/constants/limits';
import styles from './tool.module.css';
import cropStyles from './ImageCropper.module.css';

const RATIOS = [
  { label: 'Free',    w: 0,  h: 0  },
  { label: '1:1',     w: 1,  h: 1  },
  { label: '4:3',     w: 4,  h: 3  },
  { label: '16:9',    w: 16, h: 9  },
  { label: '3:4',     w: 3,  h: 4  },
  { label: '9:16',    w: 9,  h: 16 },
];

export default function ImageCropper({ sharedFile, onRouteToFix }) {
  const [file, setFile]         = useState(sharedFile || null);
  const [message, setMessage]   = useState(null);
  const [ratio, setRatio]       = useState(RATIOS[0]);
  const [imgLoaded, setImgLoaded] = useState(false);
  const [crop, setCrop]         = useState({ x: 0, y: 0, w: 200, h: 200 });
  const [dragging, setDragging] = useState(false);
  const [dragStart, setDragStart] = useState(null);
  const [imgNatural, setImgNatural] = useState({ w: 0, h: 0 });
  const canvasRef  = useRef(null);
  const previewRef = useRef(null);
  const imgRef     = useRef(null);

  const handleFile = useCallback((f) => {
    const msg = validateImageFile(f, 'crop');
    if (msg?.type === 'danger') { setMessage(msg); return; }
    setMessage(msg);
    setFile(f);
    setImgLoaded(false);
    const url = URL.createObjectURL(f);
    const img = new Image();
    img.onload = () => {
      imgRef.current = img;
      const canvas = previewRef.current;
      const maxW = Math.min(img.width, 600);
      const scale = maxW / img.width;
      canvas.width  = Math.round(img.width  * scale);
      canvas.height = Math.round(img.height * scale);
      setImgNatural({ w: img.width, h: img.height });
      const initW = Math.round(canvas.width * 0.6);
      const initH = Math.round(canvas.height * 0.6);
      setCrop({ x: Math.round((canvas.width - initW) / 2), y: Math.round((canvas.height - initH) / 2), w: initW, h: initH });
      setImgLoaded(true);
      URL.revokeObjectURL(url);
    };
    img.src = url;
  }, []);

  // Draw on canvas whenever crop changes
  useEffect(() => {
    if (!imgLoaded || !previewRef.current || !imgRef.current) return;
    const canvas = previewRef.current;
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(imgRef.current, 0, 0, canvas.width, canvas.height);
    // Overlay
    ctx.fillStyle = 'rgba(0,0,0,0.45)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    // Cut-out
    ctx.clearRect(crop.x, crop.y, crop.w, crop.h);
    ctx.drawImage(imgRef.current, 0, 0, canvas.width, canvas.height);
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(imgRef.current, 0, 0, canvas.width, canvas.height);
    ctx.fillStyle = 'rgba(0,0,0,0.45)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.clearRect(crop.x, crop.y, crop.w, crop.h);
    ctx.drawImage(imgRef.current, 0, 0, canvas.width, canvas.height);
    // Clear the crop region again to show image
    ctx.save();
    ctx.globalCompositeOperation = 'destination-over';
    ctx.fillStyle = 'rgba(0,0,0,0.5)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.restore();
    // Redraw properly
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(imgRef.current, 0, 0, canvas.width, canvas.height);
    ctx.fillStyle = 'rgba(0,0,0,0.5)';
    ctx.fillRect(0, 0, canvas.width, crop.y);
    ctx.fillRect(0, crop.y + crop.h, canvas.width, canvas.height - crop.y - crop.h);
    ctx.fillRect(0, crop.y, crop.x, crop.h);
    ctx.fillRect(crop.x + crop.w, crop.y, canvas.width - crop.x - crop.w, crop.h);
    // Crop border
    ctx.strokeStyle = 'rgba(200,240,96,0.9)';
    ctx.lineWidth = 2;
    ctx.strokeRect(crop.x, crop.y, crop.w, crop.h);
    // Guides
    ctx.strokeStyle = 'rgba(200,240,96,0.3)';
    ctx.lineWidth = 0.5;
    const tx = crop.w / 3, ty = crop.h / 3;
    for (let i = 1; i < 3; i++) {
      ctx.beginPath(); ctx.moveTo(crop.x + tx * i, crop.y); ctx.lineTo(crop.x + tx * i, crop.y + crop.h); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(crop.x, crop.y + ty * i); ctx.lineTo(crop.x + crop.w, crop.y + ty * i); ctx.stroke();
    }
  }, [crop, imgLoaded]);

  const applyRatio = (r) => {
    setRatio(r);
    if (!previewRef.current || r.w === 0) return;
    const canvas = previewRef.current;
    const newW   = Math.min(crop.w, canvas.width);
    const newH   = Math.round(newW * r.h / r.w);
    setCrop(c => ({ ...c, w: newW, h: Math.min(newH, canvas.height) }));
  };

  const handleMouseDown = (e) => {
    const rect = previewRef.current.getBoundingClientRect();
    const sx = (e.clientX - rect.left) * (previewRef.current.width / rect.width);
    const sy = (e.clientY - rect.top)  * (previewRef.current.height / rect.height);
    const inside = sx >= crop.x && sx <= crop.x + crop.w && sy >= crop.y && sy <= crop.y + crop.h;
    setDragging(inside ? 'move' : 'new');
    setDragStart({ sx, sy, ox: crop.x, oy: crop.y, ow: crop.w, oh: crop.h });
  };

  const handleMouseMove = (e) => {
    if (!dragging || !dragStart) return;
    const rect = previewRef.current.getBoundingClientRect();
    const cx   = previewRef.current;
    const mx = (e.clientX - rect.left) * (cx.width / rect.width);
    const my = (e.clientY - rect.top)  * (cx.height / rect.height);
    const dx = mx - dragStart.sx, dy = my - dragStart.sy;
    if (dragging === 'move') {
      setCrop(c => ({ ...c, x: Math.max(0, Math.min(cx.width - c.w, dragStart.ox + dx)), y: Math.max(0, Math.min(cx.height - c.h, dragStart.oy + dy)) }));
    } else {
      const nx = Math.min(dragStart.sx, mx), ny = Math.min(dragStart.sy, my);
      let nw = Math.abs(dx), nh = Math.abs(dy);
      if (ratio.w > 0) nh = nw * ratio.h / ratio.w;
      setCrop({ x: nx, y: ny, w: Math.max(20, nw), h: Math.max(20, nh) });
    }
  };

  const applyCrop = () => {
    if (!imgRef.current || !previewRef.current) return;
    const pCanvas = previewRef.current;
    const scaleX  = imgNatural.w / pCanvas.width;
    const scaleY  = imgNatural.h / pCanvas.height;
    const out = canvasRef.current;
    out.width  = Math.round(crop.w * scaleX);
    out.height = Math.round(crop.h * scaleY);
    out.getContext('2d').drawImage(imgRef.current,
      crop.x * scaleX, crop.y * scaleY, out.width, out.height,
      0, 0, out.width, out.height);
    const dataUrl = out.toDataURL('image/png');
    const a = document.createElement('a');
    a.href = dataUrl; a.download = `${getBaseName(file)}_cropped.png`; a.click();
  };

  return (
    <ToolShell icon="⬜" title="Image Cropper" description="...">
      {/* ✅ Both canvases always in the DOM so refs are valid during img.onload */}
      <canvas
        ref={previewRef}
        className={cropStyles.canvas}
        style={{ display: imgLoaded ? undefined : "none" }}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={() => {
          setDragging(false);
          setDragStart(null);
        }}
        onMouseLeave={() => {
          setDragging(false);
          setDragStart(null);
        }}
      />
      <canvas ref={canvasRef} style={{ display: "none" }} />

      <div className={styles.step}>
        <div className={styles.stepLabel}>01 — image file</div>
        <DropZone
          accept={ACCEPTED.image}
          onFile={handleFile}
          file={file}
          label="Drop an image to crop"
        />
      </div>

      {message && (
        <StatusMessage
          message={message}
          onAction={(t) => onRouteToFix?.("image", t)}
        />
      )}

      {imgLoaded && (
        <>
          <div className={styles.step}>
            <div className={styles.stepLabel}>02 — aspect ratio</div>
            <div className={cropStyles.ratioGrid}>
              {RATIOS.map((r) => (
                <button
                  key={r.label}
                  className={`${cropStyles.ratioBtn} ${ratio.label === r.label ? cropStyles.ratioActive : ""}`}
                  onClick={() => applyRatio(r)}
                >
                  {r.label}
                </button>
              ))}
            </div>
          </div>

          {/* ✅ Wrap canvas in its layout container, but canvas itself lives above */}
          <div className={styles.step}>
            <div className={styles.stepLabel}>
              03 — drag to select crop area
            </div>
            <div className={cropStyles.canvasWrap}>
              {/* canvas is rendered above, just reference its container here */}
            </div>
            <div className={cropStyles.cropInfo}>
              {Math.round(crop.w)} × {Math.round(crop.h)}px (display) — drag
              inside to move, drag outside to redraw
            </div>
          </div>

          <button className={styles.runBtn} onClick={applyCrop}>
            {/* ... svg icon ... */}
            Download Cropped PNG
          </button>
        </>
      )}
    </ToolShell>
  );
}
