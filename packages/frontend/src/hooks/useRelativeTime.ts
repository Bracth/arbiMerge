import { useState, useEffect } from 'react';

/**
 * Custom hook that takes a timestamp and returns a formatted relative time string.
 * Forces a re-render every 5 seconds to keep the time updated.
 * 
 * Formatting rules:
 * - < 60s: "5s", "10s", etc. (5s intervals)
 * - < 60m: "1m", "2m", etc.
 * - < 24h: "1h", "2h", etc.
 * - >= 24h: "1d", "2d", etc.
 * 
 * @param timestamp - The timestamp in milliseconds or null.
 * @returns A formatted relative time string.
 */
export const useRelativeTime = (timestamp: number | null): string => {
  const [, setTick] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setTick((t) => t + 1);
    }, 5000);

    return () => clearInterval(interval);
  }, []);

  if (timestamp === null) {
    return '--';
  }

  const now = Date.now();
  const diffInSeconds = Math.floor((now - timestamp) / 1000);

  if (diffInSeconds < 0) {
    return '0s';
  }

  if (diffInSeconds < 60) {
    // 5s intervals for seconds
    const seconds = Math.floor(diffInSeconds / 5) * 5;
    return `${seconds}s`;
  } else if (diffInSeconds < 3600) {
    const minutes = Math.floor(diffInSeconds / 60);
    return `${minutes}m`;
  } else if (diffInSeconds < 86400) {
    const hours = Math.floor(diffInSeconds / 3600);
    return `${hours}h`;
  } else {
    const days = Math.floor(diffInSeconds / 86400);
    return `${days}d`;
  }
};
