import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Circle } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { format } from "date-fns";

interface LiveStatusProps {
  showLabel?: boolean;
}

export function LiveStatus({ showLabel = true }: LiveStatusProps) {
  const [isActive, setIsActive] = useState(false);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Query to check if there's an active gameweek
  const { data: currentEvent } = useQuery({
    queryKey: ["current-event"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("events")
        .select("*")
        .lt("deadline_time", new Date().toISOString())
        .gt("deadline_time", new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString())
        .order("deadline_time", { ascending: false })
        .limit(1)
        .maybeSingle();

      if (error) throw error;
      return data;
    },
    refetchInterval: 60000, // Check every minute
  });

  // Query to check for active matches
  const { data: activeMatches } = useQuery({
    queryKey: ["active-matches", currentEvent?.id],
    enabled: !!currentEvent?.id,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("fixtures")
        .select("*")
        .eq("event", currentEvent.id)
        .eq("started", true)
        .is("finished", false);

      if (error) throw error;
      return data;
    },
    refetchInterval: 30000 // Check every 30 seconds
  });

  // Query to fetch live data
  const { error: liveError } = useQuery({
    queryKey: ["live-data", currentEvent?.id],
    queryFn: async () => {
      const { data, error } = await supabase.functions.invoke("fetch-live-gameweek");
      if (error) throw error;
      setLastUpdate(new Date());
      return data;
    },
    enabled: !!currentEvent && !!activeMatches?.length,
    refetchInterval: 120000, // Fetch every 2 minutes during active gameweek
    retry: true,
    retryDelay: 30000, // Retry after 30 seconds on failure
  });

  // Subscribe to real-time updates
  useEffect(() => {
    if (!currentEvent?.id) return;

    const channel = supabase
      .channel("live-updates")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "gameweek_live_performance",
          filter: `event_id=eq.${currentEvent.id}`,
        },
        () => {
          setIsActive(true);
          setLastUpdate(new Date());
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [currentEvent?.id]);

  // Update error state
  useEffect(() => {
    if (liveError) {
      setError(liveError.message);
      setIsActive(false);
    } else {
      setError(null);
    }
  }, [liveError]);

  const getStatusColor = () => {
    if (error) return "text-destructive fill-destructive";
    if (!currentEvent) return "text-muted-foreground fill-muted-foreground";
    if (isActive && activeMatches?.length) return "text-success fill-success";
    return "text-muted-foreground fill-muted-foreground";
  };

  const getTooltipContent = () => {
    if (error) return `Error: ${error}`;
    if (!currentEvent) return "No active gameweek";
    if (!lastUpdate) return "Waiting for first update...";
    return `Last updated: ${format(lastUpdate, "HH:mm:ss")}`;
  };

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger>
          <div className="flex items-center gap-2">
            <Circle
              className={cn(
                "h-3 w-3",
                getStatusColor(),
                isActive && activeMatches?.length && "animate-pulse"
              )}
            />
            {showLabel && <span className="text-sm">Live Updates</span>}
          </div>
        </TooltipTrigger>
        <TooltipContent>
          <p>{getTooltipContent()}</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}