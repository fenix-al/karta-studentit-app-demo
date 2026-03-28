import { useState, useEffect, useCallback } from 'react';

export function useFetch<T>(fetcher: () => Promise<T>, deps: any[] = []) {
  const [data,    setData]    = useState<T | null>(null);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await fetcher();
      setData(result);
    } catch (e: any) {
      setError(e?.message ?? 'Gabim në ngarkimin e të dhënave.');
    } finally {
      setLoading(false);
    }
  }, deps);

  useEffect(() => { load(); }, [load]);

  return { data, loading, error, reload: load };
}
