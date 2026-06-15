import { useState, useCallback } from 'react';
import ToolShell from '@/components/ui/ToolShell';
import DropZone from '@/components/ui/DropZone';
import StatusMessage from '@/components/ui/StatusMessage';
import { validateImageFile } from '@/lib/validate';
import { getBaseName } from '@/lib/format';
import { ACCEPTED } from '@/constants/limits';
import styles from './tool.module.css';
import exifStyles from './ExifViewer.module.css';

// Read EXIF from JPEG without external library
function readExif(buffer) {
  const view  = new DataView(buffer);
  const tags  = {};
  if (view.getUint16(0) !== 0xFFD8) return null; // not JPEG

  const TAG_NAMES = {
    0x010F: 'Camera Make',    0x0110: 'Camera Model',
    0x0112: 'Orientation',   0x011A: 'X Resolution',
    0x011B: 'Y Resolution',  0x0128: 'Resolution Unit',
    0x0132: 'Date Modified', 0x013B: 'Artist',
    0x8298: 'Copyright',     0x8769: 'Exif SubIFD',
    0x9003: 'Date Taken',    0x9004: 'Date Digitized',
    0x9286: 'User Comment',  0xA002: 'Image Width',
    0xA003: 'Image Height',  0x8825: 'GPS Info',
    0x9202: 'Aperture',      0x9203: 'Brightness',
    0x9204: 'Exposure Bias', 0x9205: 'Max Aperture',
    0x9207: 'Metering Mode', 0x9208: 'Light Source',
    0x9209: 'Flash',         0x920A: 'Focal Length',
    0xA405: 'Focal Length 35mm', 0x829A: 'Exposure Time',
    0x829D: 'F-Number',      0x8827: 'ISO Speed',
  };

  let offset = 2;
  while (offset < view.byteLength) {
    const marker = view.getUint16(offset);
    if (marker === 0xFFE1) { // APP1 — EXIF
      const exifOffset = offset + 4;
      if (view.getUint32(exifOffset) !== 0x45786966) break; // "Exif"
      const tiffOffset = exifOffset + 6;
      const littleEndian = view.getUint16(tiffOffset) === 0x4949;
      const ifdOffset = tiffOffset + view.getUint32(tiffOffset + 4, littleEndian);
      const numEntries = view.getUint16(ifdOffset, littleEndian);
      for (let i = 0; i < numEntries; i++) {
        const entryOffset = ifdOffset + 2 + i * 12;
        const tag  = view.getUint16(entryOffset, littleEndian);
        const type = view.getUint16(entryOffset + 2, littleEndian);
        const valOffset = entryOffset + 8;
        let val = '';
        try {
          if (type === 2) { // ASCII
            const strOff = tiffOffset + view.getUint32(valOffset, littleEndian);
            const arr = [];
            for (let j = strOff; j < strOff + 50 && view.getUint8(j) !== 0; j++) arr.push(String.fromCharCode(view.getUint8(j)));
            val = arr.join('').trim();
          } else if (type === 3) val = view.getUint16(valOffset, littleEndian);
          else if (type === 4) val = view.getUint32(valOffset, littleEndian);
          else if (type === 5) { const n = view.getUint32(tiffOffset + view.getUint32(valOffset, littleEndian), littleEndian); const d = view.getUint32(tiffOffset + view.getUint32(valOffset, littleEndian) + 4, littleEndian); val = d ? `${n}/${d}` : n; }
        } catch {}
        if (val !== '' && TAG_NAMES[tag]) tags[TAG_NAMES[tag]] = String(val);
      }
      break;
    }
    const len = view.getUint16(offset + 2);
    offset += 2 + len;
  }
  return Object.keys(tags).length > 0 ? tags : null;
}

export default function ExifViewer({ sharedFile }) {
  const [file, setFile]     = useState(sharedFile || null);
  const [exif, setExif]     = useState(null);
  const [hasExif, setHasExif] = useState(null);
  const [message, setMessage] = useState(null);
  const [stripping, setStripping] = useState(false);

  const handleFile = useCallback(async (f) => {
    const msg = validateImageFile(f, 'exif');
    if (msg?.type === 'danger') { setMessage(msg); return; }
    setMessage(null);
    setFile(f); setExif(null); setHasExif(null);
    try {
      const buf  = await f.arrayBuffer();
      const data = readExif(buf);
      setExif(data);
      setHasExif(data !== null);
    } catch { setHasExif(false); }
  }, []);

  const stripExif = useCallback(async () => {
    if (!file) return;
    setStripping(true);
    try {
      const url = URL.createObjectURL(file);
      const img = new Image();
      await new Promise(res => { img.onload = res; img.src = url; });
      const canvas = document.createElement('canvas');
      canvas.width = img.naturalWidth; canvas.height = img.naturalHeight;
      canvas.getContext('2d').drawImage(img, 0, 0);
      URL.revokeObjectURL(url);
      const ext  = file.name.split('.').pop().toLowerCase();
      const mime = ext === 'png' ? 'image/png' : 'image/jpeg';
      const dataUrl = canvas.toDataURL(mime, 1);
      const a = document.createElement('a');
      a.href = dataUrl; a.download = `${getBaseName(file)}_no_exif.${ext}`; a.click();
      setMessage({ type: 'success', title: 'EXIF stripped', body: 'Downloaded a clean copy with all metadata removed.' });
    } catch { setMessage({ type: 'danger', title: 'Strip failed', body: 'Could not process this image.' }); }
    finally { setStripping(false); }
  }, [file]);

  const GPS_TAGS = ['GPS Info', 'GPS Latitude', 'GPS Longitude'];
  const hasGps   = exif && Object.keys(exif).some(k => GPS_TAGS.includes(k));

  return (
    <ToolShell icon="◎" title="EXIF Viewer" description="View metadata embedded in your image — camera, date, GPS — and strip it for privacy.">
      <div className={styles.step}>
        <div className={styles.stepLabel}>01 — image file</div>
        <DropZone accept={{ 'image/jpeg': ['.jpg', '.jpeg'], 'image/tiff': ['.tiff', '.tif'] }}
          onFile={handleFile} file={file} label="Drop a JPEG or TIFF image" hint="EXIF is only present in JPEG and TIFF files" />
      </div>

      {message && <StatusMessage message={message} />}

      {hasExif === false && !message && (
        <StatusMessage message={{ type: 'info', title: 'No EXIF data found', body: 'This image has no embedded metadata, or it has already been stripped.' }} />
      )}

      {hasGps && (
        <StatusMessage message={{ type: 'warning', title: 'GPS location found', body: 'This image contains location data. Strip EXIF below to remove it before sharing.' }} />
      )}

      {exif && (
        <div className={styles.step}>
          <div className={styles.stepLabel}>metadata found — {Object.keys(exif).length} tags</div>
          <div className={exifStyles.table}>
            {Object.entries(exif).map(([k, v]) => (
              <div key={k} className={`${exifStyles.row} ${GPS_TAGS.includes(k) ? exifStyles.gpsRow : ''}`}>
                <span className={exifStyles.key}>{k}</span>
                <span className={exifStyles.val}>{v}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {file && hasExif !== null && (
        <div className={styles.step}>
          <div className={styles.stepLabel}>strip all metadata</div>
          <button className={styles.runBtn} onClick={stripExif} disabled={stripping}>
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14H6L5 6"/><path d="M10 11v6M14 11v6"/><path d="M9 6V4h6v2"/></svg>
            {stripping ? 'Stripping…' : 'Strip EXIF & Download'}
          </button>
        </div>
      )}
    </ToolShell>
  );
}
