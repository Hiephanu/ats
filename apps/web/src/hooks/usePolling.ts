import { useState, useEffect, useRef } from 'react';

export function usePolling<T>(url: string, intervalMs: number = 3000, stopCondition?: (data: T) => boolean) {
  const [data, setData] = useState<T | null>(null);
  const [error, setError] = useState<Error | null>(null);
  const [isPolling, setIsPolling] = useState(false);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    let mounted = true;

    const poll = async () => {
      if (!url) return;
      
      try {
        setIsPolling(true);
        const res = await fetch(url);
        if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
        const result = await res.json();
        
        if (mounted) {
          setData(result.data);
          setError(null);
          
          if (stopCondition && stopCondition(result.data)) {
            setIsPolling(false);
            return; // Stop polling
          }

          timeoutRef.current = setTimeout(poll, intervalMs);
        }
      } catch (e) {
        if (mounted) {
          setError(e instanceof Error ? e : new Error('Unknown error'));
          // keep polling even on error, but maybe longer interval?
          timeoutRef.current = setTimeout(poll, intervalMs * 2);
        }
      }
    };

    if (url) {
      poll();
    }

    return () => {
      mounted = false;
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, [url, intervalMs, stopCondition]);

  return { data, error, isPolling };
}
