import { useCallback, useEffect, useRef, useState } from 'react';

export function useFetch<T>(fetcher: () => Promise<T>, deps: any[] = []) {
  const [data,    setData]    = useState<T | null>(null);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState<string | null>(null);
  const mountedRef = useRef(false);
  const requestIdRef = useRef(0);

  const load = useCallback(async () => {
    const requestId = requestIdRef.current + 1;
    requestIdRef.current = requestId;

    if (mountedRef.current) {
      setLoading(true);
      setError(null);
    }

    try {
      const result = await fetcher();
      if (!mountedRef.current || requestIdRef.current !== requestId) return;
      setData(result);
    } catch (e: any) {
      if (!mountedRef.current || requestIdRef.current !== requestId) return;
      setError(e?.message ?? 'Gabim në ngarkimin e të dhënave.');
    } finally {
      if (!mountedRef.current || requestIdRef.current !== requestId) return;
      setLoading(false);
    }
  }, deps);

  useEffect(() => {
    mountedRef.current = true;
    load();

    return () => {
      mountedRef.current = false;
      requestIdRef.current += 1;
    };
  }, [load]);

  return { data, loading, error, reload: load };
}
