import React, { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { useLocation } from "wouter";

interface SiteAuthContextType {
  authenticated: boolean;
  loading: boolean;
  error: string | null;
  login: (password: string) => Promise<boolean>;
  logout: () => void;
}

// Create context with default values
const SiteAuthContext = createContext<SiteAuthContextType>({
  authenticated: false,
  loading: false,
  error: null,
  login: async () => false,
  logout: () => {},
});

// Create provider component
export const SiteAuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [, setLocation] = useLocation();
  // Initialize state from sessionStorage
  const [authenticated, setAuthenticated] = useState<boolean>(() => {
    const saved = sessionStorage.getItem('siteAuth');
    return saved ? JSON.parse(saved).authenticated === true : false;
  });
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Debug log for authentication state changes
  useEffect(() => {
    console.log("Authentication state:", authenticated);
  }, [authenticated]);

  // Simple login function that directly calls fetch
  const login = async (password: string): Promise<boolean> => {
    console.log("Login attempt with password:", password);
    setLoading(true);
    setError(null);
    
    try {
      // Direct fetch call without going through apiRequest
      const response = await fetch('/api/site-auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password }),
        credentials: 'include'
      });
      
      // Directly log the raw response for debugging
      console.log("API raw response:", response);
      
      const text = await response.text();
      console.log("Response text:", text);
      
      let data;
      try {
        data = JSON.parse(text);
      } catch (e) {
        console.error("Failed to parse response as JSON:", e);
        setError("Invalid response from server");
        setLoading(false);
        return false;
      }
      
      console.log("Parsed response data:", data);
      
      if (data.success) {
        console.log("Authentication successful!");
        
        // Update state and session storage
        setAuthenticated(true);
        sessionStorage.setItem('siteAuth', JSON.stringify({ authenticated: true }));
        
        // Redirect to browse page after successful login
        setLocation("/browse");
        
        setLoading(false);
        return true;
      } else {
        console.log("Authentication failed:", data.message);
        setError(data.message || 'Invalid password');
        setLoading(false);
        return false;
      }
    } catch (err) {
      console.error("Authentication error:", err);
      setError('Connection error. Please try again.');
      setLoading(false);
      return false;
    }
  };

  // Logout function
  const logout = () => {
    console.log("Logging out");
    setAuthenticated(false);
    sessionStorage.removeItem('siteAuth');
    sessionStorage.removeItem('auth');
    setLocation("/");
  };

  // Context value
  const contextValue = {
    authenticated,
    loading,
    error,
    login,
    logout,
  };

  return <SiteAuthContext.Provider value={contextValue}>{children}</SiteAuthContext.Provider>;
};

// Custom hook for using the context
export const useSiteAuth = () => useContext(SiteAuthContext);