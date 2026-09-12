import { useEffect, useRef, useState } from 'react';
import { CallState } from '../types';

interface UseLiveTimerProps {
  callState: CallState;
}

export function useLiveTimer({ callState }: UseLiveTimerProps) {
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const startTimestampRef = useRef<number | null>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    // Strictly start counting duration ONLY when Telephony state reaches OFFHOOK (active connected call)
    if (callState === 'OFFHOOK') {
      if (!startTimestampRef.current) {
        startTimestampRef.current = Date.now();
        setElapsedSeconds(0);

        if (intervalRef.current) {
          clearInterval(intervalRef.current);
        }

        intervalRef.current = setInterval(() => {
          if (startTimestampRef.current) {
            const diff = Math.floor((Date.now() - startTimestampRef.current) / 1000);
            setElapsedSeconds(diff);
          }
        }, 1000);
      }
    } else {
      // If IDLE, RINGING, or UNKNOWN, stop timer and reset
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      startTimestampRef.current = null;
      if (callState === 'IDLE') {
        setElapsedSeconds(0);
      }
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [callState]);

  return {
    elapsedSeconds,
    isTiming: callState === 'OFFHOOK',
  };
}
