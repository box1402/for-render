import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { useVideoSync } from "@/contexts/VideoSyncContext";

const StatusMessages: React.FC = () => {
  const { connectionStatus, partnerStatus } = useVideoSync();

  let statusMessage = "";
  let textColor = "text-neutral-600";

  if (connectionStatus === "connecting") {
    statusMessage = "Connecting to server...";
    textColor = "text-amber-600";
  } else if (connectionStatus === "disconnected") {
    statusMessage = "Disconnected from server. Please refresh the page to reconnect.";
    textColor = "text-red-600";
  } else if (connectionStatus === "connected" && partnerStatus === "waiting") {
    statusMessage = "Connected to server. Waiting for your partner to join...";
    textColor = "text-blue-600";
  } else if (connectionStatus === "connected" && partnerStatus === "offline") {
    statusMessage = "Your partner is currently offline. You're watching alone.";
    textColor = "text-orange-600";
  } else if (connectionStatus === "connected" && partnerStatus === "online") {
    statusMessage = "You and your partner are both online. Playback is synchronized!";
    textColor = "text-green-600";
  }

  if (!statusMessage) {
    return null;
  }

  return (
    <Card className="mb-4">
      <CardContent className="p-3">
        <p className={`text-sm ${textColor}`}>{statusMessage}</p>
      </CardContent>
    </Card>
  );
};

export default StatusMessages;