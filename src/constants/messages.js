export const MESSAGES = {
  // File validation
  FILE_TOO_LARGE_VIDEO: (size, fix) => ({
    type: 'danger',
    title: `File too large (${size})`,
    body: 'For smooth processing, please use a video under 500MB.',
    action: fix ? { label: '→ Open Video Compressor', tool: fix } : null,
  }),
  FILE_TOO_LARGE_AUDIO: (size) => ({
    type: 'danger',
    title: `File too large (${size})`,
    body: 'Audio processing works best under 100MB.',
    action: null,
  }),
  FILE_TOO_LARGE_IMAGE: (size, fix) => ({
    type: 'danger',
    title: `File too large (${size})`,
    body: 'For best results, use an image under 50MB.',
    action: fix ? { label: '→ Open Image Compressor', tool: fix } : null,
  }),
  FILE_TOO_LARGE_REMOVE_BG: (size) => ({
    type: 'danger',
    title: `Image too large for background removal (${size})`,
    body: 'Background removal works best under 2.5MB. Compress your image first.',
    action: { label: '→ Open Image Compressor', tool: 'compress' },
  }),
  VIDEO_TOO_LONG_GIF: (duration) => ({
    type: 'danger',
    title: `Video too long for GIF (${duration})`,
    body: 'GIF maker supports up to 10 seconds. Trim your video first.',
    action: { label: '→ Open Video Trimmer', tool: 'trim' },
  }),
  FILE_WARN_LARGE: (size) => ({
    type: 'warning',
    title: `Large file (${size})`,
    body: 'This may take longer than usual. Keep this tab open during processing.',
    action: null,
  }),

  // Processing states
  PROCESSING_SLOW: {
    type: 'warning',
    title: 'Still processing…',
    body: 'Large files take longer. Keep this tab open for best performance.',
  },
  PROCESSING_TIMEOUT: {
    type: 'danger',
    title: 'Taking too long',
    body: 'Try a smaller or shorter file for faster results.',
  },
  TAB_HIDDEN: {
    type: 'warning',
    title: 'Processing may have slowed',
    body: 'Keep this tab active for best performance.',
  },
  LOW_MEMORY: {
    type: 'warning',
    title: 'Limited memory detected',
    body: 'For best results, close other tabs and keep files under 100MB.',
  },

  // First-time messages
  REMOVE_BG_FIRST_LOAD: {
    type: 'info',
    title: 'Downloading AI model (~5MB)',
    body: 'First use only — this is cached locally and never needed again.',
  },

  // Success
  DONE: { type: 'success', title: 'Done — ready to download' },
};
