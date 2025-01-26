import { cn } from "@/lib/utils";
import { LayoutGrid, List } from 'lucide-react';

interface ViewToggleProps {
  viewMode: 'pitch' | 'list';
  setViewMode: (mode: 'pitch' | 'list') => void;
}

export function ViewToggle({ viewMode, setViewMode }: ViewToggleProps) {
  return (
    <div className="absolute -right-14 top-1/3 flex flex-col space-y-2 z-10">
      <button
        onClick={() => setViewMode('pitch')}
        className={cn(
          "p-2 rounded-l-md transition-colors border-r-2",
          viewMode === 'pitch' 
            ? "bg-[#3DFF9A]/20 text-[#3DFF9A] border-[#3DFF9A]" 
            : "text-gray-400 hover:bg-[#3DFF9A]/10 border-transparent"
        )}
        title="Pitch View"
      >
        <LayoutGrid className="h-5 w-5" />
      </button>
      <button
        onClick={() => setViewMode('list')}
        className={cn(
          "p-2 rounded-l-md transition-colors border-r-2",
          viewMode === 'list' 
            ? "bg-[#3DFF9A]/20 text-[#3DFF9A] border-[#3DFF9A]" 
            : "text-gray-400 hover:bg-[#3DFF9A]/10 border-transparent"
        )}
        title="List View"
      >
        <List className="h-5 w-5" />
      </button>
    </div>
  );
}