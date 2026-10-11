import { useEffect, useState } from 'react';

// The current time, refreshed every `everyMs`. Keeps Date.now() out of render.
export function useNow(everyMs = 60000) {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), everyMs);
    return () => clearInterval(id);
  }, [everyMs]);
  return now;
}
