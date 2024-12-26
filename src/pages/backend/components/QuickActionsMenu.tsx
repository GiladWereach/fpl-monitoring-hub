import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { MoreHorizontal, Play, Pause } from "lucide-react";

interface QuickActionsMenuProps {
  scheduleId: string;
  status: boolean;
  onStatusChange: () => void;
}

export function QuickActionsMenu({ 
  scheduleId, 
  status, 
  onStatusChange 
}: QuickActionsMenuProps) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="h-8 w-8 p-0">
          <span className="sr-only">Open menu</span>
          <MoreHorizontal className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem onClick={onStatusChange}>
          {status ? (
            <>
              <Pause className="mr-2 h-4 w-4" />
              <span>Disable</span>
            </>
          ) : (
            <>
              <Play className="mr-2 h-4 w-4" />
              <span>Enable</span>
            </>
          )}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}