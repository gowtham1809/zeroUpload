// ── File size limits (bytes) ──
export const LIMITS = {
  video: {
    warn:     200 * 1024 * 1024,   // 200MB
    hard:     500 * 1024 * 1024,   // 500MB
    gif_secs: 10,                   // max 10 seconds for GIF
  },
  audio: {
    warn:      50 * 1024 * 1024,   // 50MB
    hard:     100 * 1024 * 1024,   // 100MB
  },
  image: {
    warn:      20 * 1024 * 1024,   // 20MB
    hard:      50 * 1024 * 1024,   // 50MB
    removeBg:   2.5 * 1024 * 1024, // 2.5MB hard stop
  },
};

// ── Processing timeouts (ms) ──
export const TIMEOUTS = {
  audioExtract:  30_000,
  transcode:     60_000,
  trim:          60_000,
  compress:      60_000,
  gif:           45_000,
  thumbnail:     20_000,
  watermark:     30_000,
  audioTrim:     30_000,
  audioMerge:    45_000,
  normalise:     30_000,
  filter:         5_000,
  convert:        5_000,
  removeBg:      15_000,
  crop:           3_000,
  imageCompress:  5_000,
  exif:           2_000,
  imageWatermark: 5_000,
};

// ── Accepted MIME types ──
export const ACCEPTED = {
  video: { 'video/*': ['.mp4', '.mov', '.avi', '.mkv', '.webm', '.m4v'] },
  audio: { 'audio/*': ['.mp3', '.wav', '.aac', '.m4a', '.ogg', '.flac'] },
  image: { 'image/*': ['.jpg', '.jpeg', '.png', '.webp', '.bmp', '.gif', '.tiff'] },
};
