import React from 'react';
import { Card } from "@/components/ui/card";
import { format } from "date-fns";

interface TimelineEvent {
  id: string;
  time: Date;
  type: 'execution' | 'override' | 'scheduled';
  functionName: string;
}

interface ScheduleTimelineProps {
  events: TimelineEvent[];
}

export function ScheduleTimeline({ events }: ScheduleTimelineProps) {
  const sortedEvents = [...events].sort((a, b) => a.time.getTime() - b.time.getTime());

  return (
    <Card className="p-4">
      <h3 className="text-lg font-semibold mb-4">Schedule Timeline</h3>
      <div className="relative">
        {sortedEvents.map((event, index) => (
          <div 
            key={event.id}
            className="flex items-center gap-4 mb-4"
          >
            <div className="w-24 text-sm text-muted-foreground">
              {format(event.time, 'HH:mm')}
            </div>
            <div className="flex-1">
              <div className={`
                p-2 rounded-lg
                ${event.type === 'execution' ? 'bg-green-100' : ''}
                ${event.type === 'override' ? 'bg-yellow-100' : ''}
                ${event.type === 'scheduled' ? 'bg-blue-100' : ''}
              `}>
                <p className="font-medium">{event.functionName}</p>
                <p className="text-sm text-muted-foreground capitalize">
                  {event.type}
                </p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </Card>
  );
}