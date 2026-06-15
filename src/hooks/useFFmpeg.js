import { useState, useRef, useCallback } from 'react';

export function useFFmpeg() {
  const [loaded, setLoaded]   = useState(false);
  const [loading, setLoading] = useState(false);
  const ffmpegRef             = useRef(null);

  const load = useCallback(async () => {
    if (loaded || loading) return ffmpegRef.current;
    setLoading(true);

    try {
      // Dynamic import — client only
      const { FFmpeg }   = await import('@ffmpeg/ffmpeg');
      const { toBlobURL } = await import('@ffmpeg/util');

      const ffmpeg = new FFmpeg();

      ffmpeg.on('log', ({ message }) => {
        if (import.meta.env.DEV) console.log('[FFmpeg]', message);
      });

      const baseURL = 'https://unpkg.com/@ffmpeg/core@0.12.6/dist/umd';
      await ffmpeg.load({
        coreURL:   await toBlobURL(`${baseURL}/ffmpeg-core.js`,   'text/javascript'),
        wasmURL:   await toBlobURL(`${baseURL}/ffmpeg-core.wasm`, 'application/wasm'),
      });

      ffmpegRef.current = ffmpeg;
      setLoaded(true);
      setLoading(false);
      return ffmpeg;
    } catch (err) {
      setLoading(false);
      throw new Error('Failed to load FFmpeg. Please refresh and try again.');
    }
  }, [loaded, loading]);

  const getFFmpeg = useCallback(async () => {
    if (ffmpegRef.current && loaded) return ffmpegRef.current;
    return load();
  }, [loaded, load]);

  return { loaded, loading, load, getFFmpeg };
}
