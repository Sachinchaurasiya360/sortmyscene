import { useEffect, useState } from 'react';

// Counts down to `expiresAt`, calling onExpire once when it hits zero.
export default function Countdown({ expiresAt, onExpire }) {
  const [remaining, setRemaining] = useState(() =>
    Math.max(0, Math.round((new Date(expiresAt) - Date.now()) / 1000))
  );

  useEffect(() => {
    const target = new Date(expiresAt).getTime();
    const tick = () => {
      const secs = Math.max(0, Math.round((target - Date.now()) / 1000));
      setRemaining(secs);
      if (secs === 0) onExpire?.();
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [expiresAt]);

  const mm = String(Math.floor(remaining / 60)).padStart(2, '0');
  const ss = String(remaining % 60).padStart(2, '0');
  const urgent = remaining <= 60;

  return (
    <span className={`countdown ${urgent ? 'urgent' : ''}`}>
      ⏳ {mm}:{ss}
    </span>
  );
}
