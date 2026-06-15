import styles from './AboutPage.module.css';

const FEATURES = [
  {
    section: 'Video',
    color: '#40aaff',
    items: [
      { icon: '♫', title: 'Extract Audio',        desc: 'Pull MP3 or lossless WAV from any video file.' },
      { icon: '◻', title: 'Grab Frame',            desc: 'Capture a PNG frame at any timestamp.' },
      { icon: '⇄', title: 'Transcode',             desc: 'Convert between MP4, WebM and more.' },
      { icon: '✂', title: 'Video Trimmer',         desc: 'Cut a clip to exact in/out points.' },
      { icon: '⬇', title: 'Video Compressor',      desc: 'Reduce file size while keeping quality.' },
      { icon: '◉', title: 'GIF Maker',             desc: 'Turn up to 10 seconds of video into a GIF — perfect for stickers.' },
      { icon: '⊞', title: 'Thumbnail Generator',  desc: 'Extract multiple frames as a preview grid.' },
      { icon: '⬡', title: 'Add Watermark',         desc: 'Overlay text or image onto your video.' },
    ],
  },
  {
    section: 'Audio',
    color: '#c8f060',
    items: [
      { icon: '✂', title: 'Audio Trimmer',       desc: 'Cut audio to any start and end point.' },
      { icon: '⊕', title: 'Audio Merger',         desc: 'Combine two audio tracks into one.' },
      { icon: '◈', title: 'Volume Normaliser',    desc: 'Bring loud or quiet files to a consistent level.' },
      { icon: '〜', title: 'Waveform Visualiser', desc: 'See the waveform of your audio before downloading.' },
    ],
  },
  {
    section: 'Image',
    color: '#b070ff',
    items: [
      { icon: '◑', title: 'Image Filters',       desc: 'Grayscale, sepia, vivid, noir and more — with brightness, contrast and saturation controls.' },
      { icon: '⬡', title: 'Format Convert',      desc: 'Convert between JPG, PNG, WebP and BMP with quality and target size control.' },
      { icon: '✦', title: 'Remove Background',   desc: 'Local AI removes backgrounds — transparent PNG output, no API key needed.' },
      { icon: '⬜', title: 'Image Cropper',       desc: 'Freehand or ratio-locked crop.' },
      { icon: '⬇', title: 'Image Compressor',    desc: 'Reduce file size without changing format.' },
      { icon: '◎', title: 'EXIF Viewer / Strip', desc: 'View or permanently remove metadata including GPS location.' },
      { icon: '⬡', title: 'Image Watermark',     desc: 'Overlay text or logo onto any image.' },
    ],
  },
];

const PRIVACY_POINTS = [
  'Your files never leave your device — ever',
  'No accounts, sign-up or email required',
  'No file size limits imposed by servers',
  'No watermarks on any output',
  'Works offline after the first page load',
  'Open to audit — nothing hidden',
];

const COMPAT = [
  { browser: 'Chrome 90+',   ok: true },
  { browser: 'Firefox 90+',  ok: true },
  { browser: 'Safari 16.4+', ok: true },
  { browser: 'Edge 90+',     ok: true },
  { browser: 'Safari < 16',  ok: false },
  { browser: 'iOS Chrome',   ok: false },
];

export default function AboutPage() {
  return (
    <div className={styles.page}>

      {/* Hero */}
      <div className={styles.hero}>
        <div className={styles.heroLogo}>
          <span className={styles.bracket}>[</span>
          <span className={styles.zero}>0</span>
          <span className={styles.bracket}>]</span>
        </div>
        <div className={styles.heroText}>
          <h1 className={styles.heroTitle}>ZeroUpload</h1>
          <p className={styles.heroDesc}>
            A browser-native media toolkit. Convert, compress, trim, filter and
            process video, audio and images — entirely on your device.
            Nothing is ever uploaded to any server.
          </p>
        </div>
      </div>

      <div className={styles.grid}>

        {/* Features */}
        <div className={styles.col}>
          <div className={styles.sectionLabel}>what you can do</div>
          {FEATURES.map(section => (
            <div key={section.section} className={styles.featureSection}>
              <div className={styles.featureSectionTitle} style={{ color: section.color }}>
                {section.section}
              </div>
              <div className={styles.featureList}>
                {section.items.map(f => (
                  <div
                    key={f.title}
                    className={styles.featureItem}
                    style={{ '--fc': section.color }}
                  >
                    <span className={styles.featureIcon}>{f.icon}</span>
                    <div className={styles.featureBody}>
                      <div className={styles.featureTitle}>{f.title}</div>
                      <div className={styles.featureDesc}>{f.desc}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* Right col — privacy + compat */}
        <div className={styles.col}>

          {/* Privacy */}
          <div className={styles.sectionLabel}>privacy</div>
          <div className={styles.privacyBox}>
            <div className={styles.privacyHeadline}>
              <span className={styles.privacyDot} />
              100% local processing
            </div>
            <p className={styles.privacyBody}>
              When you drop a file into ZeroUpload, it is read directly by your
              browser. No data is transmitted. No server sees your files.
              Your privacy is guaranteed by design — not by policy.
            </p>
            <div className={styles.privacyList}>
              {PRIVACY_POINTS.map(p => (
                <div key={p} className={styles.privacyItem}>
                  <span className={styles.privacyCheck}>✓</span>
                  <span>{p}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Smart routing */}
          <div className={styles.sectionLabel} style={{ marginTop: '1.5rem' }}>smart guidance</div>
          <div className={styles.card}>
            <p className={styles.cardBody}>
              ZeroUpload never abandons you mid-task. If a file is too large for
              one tool, it routes you to the fix — with the same file already
              loaded — so you can complete your job without starting over.
            </p>
          </div>

          {/* Browser compat */}
          <div className={styles.sectionLabel} style={{ marginTop: '1.5rem' }}>browser support</div>
          <div className={styles.compatGrid}>
            {COMPAT.map(c => (
              <div key={c.browser} className={`${styles.compatItem} ${c.ok ? styles.ok : styles.warn}`}>
                <span className={styles.compatBrowser}>{c.browser}</span>
                <span className={styles.compatDot}>{c.ok ? '✓' : '⚠'}</span>
              </div>
            ))}
          </div>

          {/* File limits */}
          <div className={styles.sectionLabel} style={{ marginTop: '1.5rem' }}>recommended file sizes</div>
          <div className={styles.limitsTable}>
            {[
              { type: 'Video',       limit: 'Under 500 MB' },
              { type: 'Audio',       limit: 'Under 100 MB' },
              { type: 'Image',       limit: 'Under 50 MB'  },
              { type: 'Remove BG',   limit: 'Under 2.5 MB' },
              { type: 'GIF input',   limit: 'Under 10 sec' },
            ].map(r => (
              <div key={r.type} className={styles.limitRow}>
                <span className={styles.limitType}>{r.type}</span>
                <span className={styles.limitVal}>{r.limit}</span>
              </div>
            ))}
          </div>

        </div>
      </div>
    </div>
  );
}
