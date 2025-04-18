import React from "react";
import { Link } from "wouter";
import { Video, Wifi, WifiOff } from "lucide-react";

interface HeaderProps {
  connectionStatus?: 'connected' | 'disconnected' | 'connecting';
}

const Header: React.FC<HeaderProps> = ({ connectionStatus }) => {
  return (
    <header className="w-full border-b border-neutral-200 bg-white">
      <div className="container mx-auto px-4 py-4 flex justify-between items-center">
        <Link href="/" className="flex items-center gap-2 text-primary hover:opacity-90 transition-opacity">
          <Video className="h-6 w-6" />
          <span className="font-bold text-xl">SyncView</span>
        </Link>
        
        {connectionStatus && (
          <div className="flex items-center gap-2">
            {connectionStatus === 'connected' ? (
              <>
                <Wifi className="h-4 w-4 text-green-500" />
                <span className="text-sm text-neutral-700">Connected</span>
              </>
            ) : connectionStatus === 'connecting' ? (
              <>
                <Wifi className="h-4 w-4 text-amber-500 animate-pulse" />
                <span className="text-sm text-neutral-700">Connecting...</span>
              </>
            ) : (
              <>
                <WifiOff className="h-4 w-4 text-red-500" />
                <span className="text-sm text-neutral-700">Disconnected</span>
              </>
            )}
          </div>
        )}
      </div>
    </header>
  );
};

export default Header;