import { useEffect, useState } from 'react';

/**
 * Runs `load()` whenever `deps` change and tracks { data, error, loading }. Keeps the previous
 * data while reloading so lists don't flash empty between pages. `reload()` runs it again.
 */
export function useAsync(load, deps) {
  const [state, setState] = useState({ data: undefined, error: null, loading: true });
  const [run, setRun] = useState(0);
  useEffect(() => {
    let live = true;
    setState((s) => ({ ...s, error: null, loading: true }));
    load().then(
      (data) => live && setState({ data, error: null, loading: false }),
      (error) => live && setState({ data: undefined, error, loading: false }),
    );
    return () => {
      live = false;
    };
  }, [...deps, run]); // callers list what `load` depends on
  return { ...state, reload: () => setRun((n) => n + 1) };
}
