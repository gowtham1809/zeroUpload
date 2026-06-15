import { useState, useCallback, useRef, useEffect } from 'react';
import { MESSAGES } from '@/constants/messages';

export function useProcessor(timeoutMs = 60_000) {
  const [state, setState] = useState({
    processing: false,
    progress:   0,
    stage:      '',
    result:     null,
    message:    null,  // { type, title, body, action }
  });

  const abortRef    = useRef(false);
  const timerRef    = useRef(null);
  const slowRef     = useRef(null);

  // Tab visibility watchdog
  useEffect(() => {
    const handler = () => {
      if (document.hidden && state.processing) {
        setState(s => ({ ...s, message: MESSAGES.TAB_HIDDEN }));
      }
    };
    document.addEventListener('visibilitychange', handler);
    return () => document.removeEventListener('visibilitychange', handler);
  }, [state.processing]);

  const setProgress = useCallback((progress, stage) => {
    setState(s => ({ ...s, progress, stage: stage || s.stage }));
  }, []);

  const setMessage = useCallback((message) => {
    setState(s => ({ ...s, message }));
  }, []);

  const start = useCallback(() => {
    abortRef.current = false;
    setState({ processing: true, progress: 0, stage: 'Starting…', result: null, message: null });

    // Slow warning at 50% of timeout
    slowRef.current = setTimeout(() => {
      if (!abortRef.current) {
        setState(s => ({ ...s, message: MESSAGES.PROCESSING_SLOW }));
      }
    }, timeoutMs * 0.5);

    // Hard timeout
    timerRef.current = setTimeout(() => {
      if (!abortRef.current) {
        abortRef.current = true;
        setState(s => ({
          ...s,
          processing: false,
          message: MESSAGES.PROCESSING_TIMEOUT,
        }));
      }
    }, timeoutMs);
  }, [timeoutMs]);

  const finish = useCallback((result) => {
    clearTimeout(timerRef.current);
    clearTimeout(slowRef.current);
    setState({
      processing: false,
      progress:   100,
      stage:      'Done.',
      result,
      message:    MESSAGES.DONE,
    });
  }, []);

  const fail = useCallback((message) => {
    clearTimeout(timerRef.current);
    clearTimeout(slowRef.current);
    abortRef.current = true;
    setState(s => ({ ...s, processing: false, message }));
  }, []);

  const cancel = useCallback(() => {
    clearTimeout(timerRef.current);
    clearTimeout(slowRef.current);
    abortRef.current = true;
    setState(s => ({ ...s, processing: false, stage: 'Cancelled.' }));
  }, []);

  const reset = useCallback(() => {
    clearTimeout(timerRef.current);
    clearTimeout(slowRef.current);
    abortRef.current = false;
    setState({ processing: false, progress: 0, stage: '', result: null, message: null });
  }, []);

  return {
    state,
    abortRef,
    start, finish, fail, cancel, reset,
    setProgress, setMessage,
  };
}
