import { cn } from "@/lib/utils";
import { LayoutGrid, List } from 'lucide-react';

interface ViewToggleProps {
  viewMode: 'pitch' | 'list';
  setViewMode: (mode: 'pitch' | 'list') => void;
}

export function ViewToggle({ viewMode, setViewMode }: ViewToggleProps) {
  return (
    <div className="absolute top-4 right-4 z-10 flex space-x-2">
      <button
        onClick={() => setViewMode('pitch')}
        className={cn(
          "p-2 rounded-md transition-colors",
          viewMode === 'pitch' ? "bg-[#3DFF9A]/20 text-[#3DFF9A]" : "text-gray-400 hover:bg-[#3DFF9A]/10"
        )}
      >
        <LayoutGrid className="h-5 w-5" />
      </button>
      <button
        onClick={() => setViewMode('list')}
        className={cn(
          "p-2 rounded-md transition-colors",
          viewMode === 'list' ? "bg-[#3DFF9A]/20 text-[#3DFF9A]" : "text-gray-400 hover:bg-[#3DFF9A]/10"
        )}
      >
        <List className="h-5 w-5" />
      </button>
    </div>
  );
}