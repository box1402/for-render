import React, { createContext, useContext, useState, useCallback, useEffect, ReactNode } from "react";
import { VideoSyncAction } from "../../../shared/schema";
import { websocket } from "@/lib/websocket";
import { useToast } from "@/hooks/use-toast";

interface VideoSyncContextType {
  registerVideoElement: (videoElement: HTMLVideoElement) => void;
  unregisterVideoElement: () => void;
  connectionStatus: 'connected' | 'disconnected' | 'connecting';
  partnerStatus: 'online' | 'waiting' | 'offline';
  isSyncing: boolean;
  syncWithPartner: () => void;
}

const VideoSyncContext = createContext<VideoSyncContextType>({
  registerVideoElement: () => {},
  unregisterVideoElement: () => {},
  connectionStatus: 'disconnected',
  partnerStatus: 'offline',
  isSyncing: false,
  syncWithPartner: () => {},
});

export const VideoSyncProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [videoElement, setVideoElement] = useState<HTMLVideoElement | null>(null);
  const [connectionStatus, setConnectionStatus] = useState<'connected' | 'disconnected' | 'connecting'>('disconnected');
  const [partnerStatus, setPartnerStatus] = useState<'online' | 'waiting' | 'offline'>('offline');
  const [isSyncing, setIsSyncing] = useState(false);
  const { toast } = useToast();
  
  // Handle incoming sync actions
  const handleSyncAction = (action: VideoSyncAction) => {
    if (!videoElement) return;
    
    setIsSyncing(true);
    
    try {
      switch (action.type) {
        case 'play':
          videoElement.currentTime = action.timestamp;
          videoElement.play().catch(console.error);
          break;
        case 'pause':
          videoElement.currentTime = action.timestamp;
          videoElement.pause();
          break;
        case 'seek':
          videoElement.currentTime = action.timestamp;
          break;
      }
    } catch (err) {
      console.error('Error handling sync action:', err);
    }
    
    // Clear syncing state after a short delay
    setTimeout(() => {
      setIsSyncing(false);
    }, 1000);
  };
  
  // Setup websocket event listeners
  useEffect(() => {
    // Listen for connection status changes
    const statusHandler = (status: 'connected' | 'disconnected' | 'connecting') => {
      setConnectionStatus(status);
      if (status === 'disconnected') {
        setPartnerStatus('offline');
      }
    };
    
    // Listen for partner status updates
    const partnerStatusHandler = (data: { online: boolean; userId: string }) => {
      if (data.online) {
        setPartnerStatus('online');
        toast({
          title: "Partner connected",
          description: "Your viewing partner has joined the room.",
        });
      } else {
        setPartnerStatus('offline');
        toast({
          title: "Partner disconnected",
          description: "Your viewing partner has left the room.",
        });
      }
    };
    
    // Listen for sync actions
    const syncActionHandler = (action: VideoSyncAction) => {
      handleSyncAction(action);
    };
    
    // Register event handlers
    const removeStatusListener = websocket.onStatusChange(statusHandler);
    const removePartnerListener = websocket.on('partnerStatus', partnerStatusHandler);
    const removeSyncListener = websocket.on('sync', syncActionHandler);
    
    // Set initial connection status
    setConnectionStatus(websocket.getStatus());
    
    // Cleanup
    return () => {
      removeStatusListener();
      removePartnerListener();
      removeSyncListener();
    };
  }, [toast, videoElement]);
  
  // Register video element
  const registerVideoElement = useCallback((element: HTMLVideoElement) => {
    setVideoElement(element);
    
    // Add video event listeners to send sync actions
    const handlePlay = () => {
      const action: VideoSyncAction = {
        type: 'play',
        timestamp: element.currentTime
      };
      websocket.sendSyncAction(action);
    };
    
    const handlePause = () => {
      const action: VideoSyncAction = {
        type: 'pause',
        timestamp: element.currentTime
      };
      websocket.sendSyncAction(action);
    };
    
    const handleSeek = () => {
      const action: VideoSyncAction = {
        type: 'seek',
        timestamp: element.currentTime
      };
      websocket.sendSyncAction(action);
    };
    
    // Add event listeners
    element.addEventListener('play', handlePlay);
    element.addEventListener('pause', handlePause);
    element.addEventListener('seeked', handleSeek);
    
    // Return cleanup function
    return () => {
      element.removeEventListener('play', handlePlay);
      element.removeEventListener('pause', handlePause);
      element.removeEventListener('seeked', handleSeek);
    };
  }, []);
  
  // Unregister video element
  const unregisterVideoElement = useCallback(() => {
    setVideoElement(null);
  }, []);
  
  // Sync with partner manually
  const syncWithPartner = useCallback(() => {
    if (!videoElement) return;
    
    setIsSyncing(true);
    
    const action: VideoSyncAction = videoElement.paused
      ? { type: 'pause', timestamp: videoElement.currentTime }
      : { type: 'play', timestamp: videoElement.currentTime };
    
    websocket.sendSyncAction(action);
    
    toast({
      title: "Sync requested",
      description: "Syncing playback with your partner...",
    });
    
    // Clear syncing state after a short delay
    setTimeout(() => {
      setIsSyncing(false);
    }, 1000);
  }, [videoElement, toast]);
  
  const value = {
    registerVideoElement,
    unregisterVideoElement,
    connectionStatus,
    partnerStatus,
    isSyncing,
    syncWithPartner,
  };
  
  return (
    <VideoSyncContext.Provider value={value}>
      {children}
    </VideoSyncContext.Provider>
  );
};

export const useVideoSync = () => useContext(VideoSyncContext);