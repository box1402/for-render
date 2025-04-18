import React, { useEffect } from "react";
import { useRoute, useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import Header from "../components/Header";
import Footer from "../components/Footer";
import VideoPlayer from "../components/VideoPlayer";
import UserStatus from "../components/UserStatus";
import VideoControls from "../components/VideoControls";
import StatusMessages from "../components/StatusMessages";
import { useAuth } from "../contexts/AuthContext";
import { useSiteAuth } from "../contexts/SiteAuthContext";
import { useVideoSync } from "../contexts/VideoSyncContext";
import { apiRequest } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";

const VideoRoom: React.FC = () => {
  const [match, params] = useRoute<{ roomId: string }>('/room/:roomId');
  const [, setLocation] = useLocation();
  const { authenticated, currentRoom, token, logout } = useAuth();
  const { authenticated: siteAuthenticated } = useSiteAuth();
  const { 
    connectionStatus, 
    partnerStatus, 
    syncWithPartner, 
    isSyncing 
  } = useVideoSync();
  const { toast } = useToast();

  // Redirect if not site authenticated
  useEffect(() => {
    if (!siteAuthenticated) {
      setLocation("/");
    }
  }, [siteAuthenticated, setLocation]);

  // Redirect if not room authenticated
  useEffect(() => {
    if (siteAuthenticated && (!authenticated || !currentRoom)) {
      setLocation("/browse");
    }
  }, [siteAuthenticated, authenticated, currentRoom, setLocation]);

  // Fetch the signed URL for the video
  const { data: videoData, isLoading: videoLoading, error: videoError } = useQuery<{url: string}>({
    queryKey: ['/api/video', currentRoom?.id, currentRoom?.videoKey],
    enabled: !!currentRoom?.id && !!currentRoom?.videoKey,
  });

  // Handle video loading error
  useEffect(() => {
    if (videoError) {
      toast({
        title: "Error loading video",
        description: "Could not load the video. Please try again later.",
        variant: "destructive",
      });
    }
  }, [videoError, toast]);

  // Handle exit room
  const handleExitRoom = () => {
    logout();
    setLocation("/browse");
  };

  if (!match || !authenticated || !currentRoom || !siteAuthenticated) {
    return null; // Don't render anything until we're in the right room and authenticated
  }

  return (
    <div className="container mx-auto px-4 py-8 flex flex-col min-h-screen">
      <Header connectionStatus={connectionStatus} />
      
      <div className="mb-6">
        <Button 
          variant="ghost" 
          className="flex items-center text-neutral-600 hover:text-primary"
          onClick={handleExitRoom}
        >
          <ArrowLeft className="mr-1 h-4 w-4" />
          Back to content browser
        </Button>
      </div>
      
      <div id="video-room" className="flex-grow flex flex-col w-full mx-auto max-w-5xl">
        <div className="bg-white rounded-lg shadow-md overflow-hidden mb-4">
          <div className="p-4 border-b border-neutral-200 flex justify-between items-center">
            <div>
              <h2 className="text-lg font-medium">{currentRoom.name}</h2>
              <p className="text-sm text-neutral-500">Secure Private Room</p>
            </div>
            
            <UserStatus 
              connectionStatus={connectionStatus} 
              partnerStatus={partnerStatus} 
            />
          </div>
          
          <VideoPlayer 
            videoUrl={videoData?.url}
            isLoading={videoLoading}
            isSyncing={isSyncing}
          />
          
          <VideoControls 
            onSyncClick={syncWithPartner}
            onExitClick={handleExitRoom}
            isSyncing={isSyncing}
          />
        </div>
        
        <StatusMessages />
      </div>
      
      <Footer />
    </div>
  );
};

export default VideoRoom;
