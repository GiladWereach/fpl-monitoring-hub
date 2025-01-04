import { useState, useEffect } from 'react';

export function UTCClock() {
  const [time, setTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => {
      setTime(new Date());
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  return (
    <span className="font-mono">
      {time.toLocaleTimeString('en-GB', { timeZone: 'UTC' })}
    </span>
  );
}