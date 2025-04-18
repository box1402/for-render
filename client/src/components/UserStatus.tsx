import React from "react";
import { Badge } from "@/components/ui/badge";
import { User } from "lucide-react";

interface UserStatusProps {
  connectionStatus: 'connected' | 'disconnected' | 'connecting';
  partnerStatus: 'online' | 'waiting' | 'offline';
}

const UserStatus: React.FC<UserStatusProps> = ({
  connectionStatus,
  partnerStatus,
}) => {
  let statusColor = "";
  let statusText = "";
  
  if (connectionStatus !== 'connected') {
    statusColor = "text-amber-500 bg-amber-50";
    statusText = connectionStatus === 'connecting' ? "Connecting..." : "Disconnected";
  } else if (partnerStatus === 'waiting') {
    statusColor = "text-blue-500 bg-blue-50";
    statusText = "Waiting for Partner";
  } else if (partnerStatus === 'offline') {
    statusColor = "text-orange-500 bg-orange-50";
    statusText = "Partner Offline";
  } else if (partnerStatus === 'online') {
    statusColor = "text-green-500 bg-green-50";
    statusText = "Partner Online";
  }
  
  return (
    <div className="flex items-center gap-2">
      <Badge variant="outline" className={`px-3 py-1 ${statusColor}`}>
        <User className="h-3 w-3 mr-1" />
        {statusText}
      </Badge>
    </div>
  );
};

export default UserStatus;