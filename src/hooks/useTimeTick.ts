// useTimeTick.js
import { useState, useEffect } from 'react';

export function useTimeTick(intervalMs: number = 60000): number {
  const [tick, setTick] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => setTick(t => t + 1), intervalMs);
    return () => clearInterval(timer);
  }, [intervalMs]);

  return tick;
}
