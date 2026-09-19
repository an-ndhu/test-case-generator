import { useCallback, useEffect, useRef } from 'react';
import { patchProject } from '../store/sessionsSlice';

export function useDebouncedPatch(dispatch, delay = 400) {
  const timer = useRef(null);
  const pending = useRef(null);

  const flush = useCallback(() => {
    if (timer.current) {
      clearTimeout(timer.current);
      timer.current = null;
    }
    if (pending.current) {
      const payload = pending.current;
      pending.current = null;
      return dispatch(patchProject(payload));
    }
    return Promise.resolve();
  }, [dispatch]);

  const save = useCallback(
    (payload) => {
      pending.current = payload;
      if (timer.current) clearTimeout(timer.current);
      timer.current = setTimeout(() => {
        timer.current = null;
        flush();
      }, delay);
    },
    [delay, flush]
  );

  useEffect(() => () => {
    if (timer.current) clearTimeout(timer.current);
  }, []);

  return { save, flush };
}
