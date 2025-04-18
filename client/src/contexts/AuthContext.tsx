import React, { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { AuthResponse } from "../../../shared/schema";
import { apiRequest } from "../lib/queryClient";
import { websocket } from "../lib/websocket";

interface AuthContextType {
  authenticated: boolean;
  loading: boolean;
  error: string | null;
  currentRoom: {
    id: number;
    name: string;
    videoKey: string;
  } | null;
  token: string | null;
  login: (roomName: string, password: string) => Promise<AuthResponse>;
  logout: () => void;
}

// Create context with default values
const AuthContext = createContext<AuthContextType>({
  authenticated: false,
  loading: false,
  error: null,
  currentRoom: null,
  token: null,
  login: async () => ({ success: false }),
  logout: () => {},
});

// Create provider component
export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [authenticated, setAuthenticated] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currentRoom, setCurrentRoom] = useState<{
    id: number;
    name: string;
    videoKey: string;
  } | null>(null);
  const [token, setToken] = useState<string | null>(null);

  // Check for saved session on mount
  useEffect(() => {
    const savedAuth = sessionStorage.getItem('auth');
    if (savedAuth) {
      try {
        const auth = JSON.parse(savedAuth);
        if (auth.room && auth.token) {
          setCurrentRoom(auth.room);
          setToken(auth.token);
          setAuthenticated(true);
          
          // Reconnect websocket with saved auth
          websocket.authenticate(auth.room.id, auth.token);
        }
      } catch (e) {
        console.error('Error parsing saved auth:', e);
        sessionStorage.removeItem('auth');
      }
    }
  }, []);

  // Login function
  const login = async (roomName: string, password: string): Promise<AuthResponse> => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await apiRequest('POST', '/api/room-auth', { name: roomName, password });
      const data: AuthResponse = await response.json();
      
      if (data.success && data.room && data.token) {
        setCurrentRoom(data.room);
        setToken(data.token);
        setAuthenticated(true);
        
        // Save to session storage
        sessionStorage.setItem('auth', JSON.stringify({
          room: data.room,
          token: data.token
        }));
        
        // Authenticate with websocket
        websocket.authenticate(data.room.id, data.token);
      } else {
        setError(data.message || 'Authentication failed');
      }
      
      setLoading(false);
      return data;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'An unknown error occurred';
      setError(errorMessage);
      setLoading(false);
      return { success: false, message: errorMessage };
    }
  };

  // Logout function
  const logout = () => {
    setAuthenticated(false);
    setCurrentRoom(null);
    setToken(null);
    sessionStorage.removeItem('auth');
    websocket.disconnect();
  };

  const value = {
    authenticated,
    loading,
    error,
    currentRoom,
    token,
    login,
    logout,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

// Create custom hook for using the context
export const useAuth = () => useContext(AuthContext);