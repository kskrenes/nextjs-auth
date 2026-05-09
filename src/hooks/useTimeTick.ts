import { useState, useEffect } from 'react';

export function useTimeTick(intervalMs: number = 60000): number {
  const [tick, setTick] = useState(0);
  const safeIntervalMs = Number.isFinite(intervalMs) && intervalMs > 0 ? intervalMs : 60000;

  useEffect(() => {
    const timer = setInterval(() => setTick(t => t + 1), safeIntervalMs);
    return () => clearInterval(timer);
  }, [safeIntervalMs]);

  return tick;
}
