import { useEffect, useState } from 'react';
import { Card } from "@/components/ui/card";
import { Clock } from "lucide-react";

export function UTCClock() {
  const [time, setTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => {
      setTime(new Date());
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  return (
    <Card className="p-4 bg-card/50">
      <div className="flex items-center gap-2">
        <Clock className="h-4 w-4 text-muted-foreground" />
        <span className="font-mono">
          {time.toLocaleTimeString('en-GB', { timeZone: 'UTC' })} UTC
        </span>
      </div>
    </Card>
  );
}