import React from "react";
import { Button } from "@/components/ui/button";
import { RefreshCw, LogOut, Loader2 } from "lucide-react";

interface VideoControlsProps {
  onSyncClick: () => void;
  onExitClick: () => void;
  isSyncing: boolean;
}

const VideoControls: React.FC<VideoControlsProps> = ({
  onSyncClick,
  onExitClick,
  isSyncing,
}) => {
  return (
    <div className="p-4 flex flex-wrap gap-3 items-center justify-between border-t border-neutral-200">
      <Button 
        onClick={onSyncClick} 
        variant="secondary"
        disabled={isSyncing}
        className="flex items-center gap-2"
      >
        {isSyncing ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin" />
            <span>Syncing...</span>
          </>
        ) : (
          <>
            <RefreshCw className="h-4 w-4" />
            <span>Sync Playback</span>
          </>
        )}
      </Button>
      
      <Button 
        onClick={onExitClick} 
        variant="outline"
        className="text-red-500 border-red-200 hover:bg-red-50 hover:text-red-600 flex items-center gap-2"
      >
        <LogOut className="h-4 w-4" />
        <span>Exit Room</span>
      </Button>
    </div>
  );
};

export default VideoControls;