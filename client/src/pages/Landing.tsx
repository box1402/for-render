import React, { useEffect, useState } from "react";
import { useSiteAuth } from "../contexts/SiteAuthContext";
import SitePasswordForm from "../components/SitePasswordForm";
import Footer from "../components/Footer";
import { Video, Loader2 } from "lucide-react";
import { useLocation } from "wouter";
import { Alert, AlertDescription } from "@/components/ui/alert";

const Landing: React.FC = () => {
  const { authenticated, login, loading, error } = useSiteAuth();
  const [isAuthenticating, setIsAuthenticating] = useState(false);
  const [, setLocation] = useLocation();
  const [showError, setShowError] = useState(false);
  
  // Debug logs
  useEffect(() => {
    console.log("Landing component rendering");
    console.log("Authentication state:", authenticated);
    console.log("Loading state:", loading);
  }, [authenticated, loading]);

  // Redirect to browse if already authenticated
  useEffect(() => {
    if (authenticated) {
      setLocation("/browse");
    }
  }, [authenticated, setLocation]);

  // Show error message for 5 seconds
  useEffect(() => {
    if (error) {
      setShowError(true);
      const timer = setTimeout(() => {
        setShowError(false);
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [error]);

  const handleLogin = async (password: string) => {
    console.log("Login attempt initiated with password:", password);
    setIsAuthenticating(true);
    setShowError(false);
    
    try {
      const success = await login(password);
      console.log("Login result:", success);
      
      if (!success) {
        console.log("Login failed");
      }
    } catch (err) {
      console.error("Login error:", err);
    } finally {
      setIsAuthenticating(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col">
      <div className="flex-grow flex flex-col items-center justify-center bg-neutral-50">
        <div className="w-full max-w-md px-4">
          <div className="text-center mb-8">
            <div className="flex justify-center mb-4">
              <div className="bg-primary text-white rounded-full p-4">
                <Video className="h-10 w-10" />
              </div>
            </div>
            <h1 className="text-4xl font-bold text-primary mb-2">SyncView</h1>
            <p className="text-neutral-600">Private, secure two-person video sync platform</p>
          </div>
          
          {showError && error && (
            <Alert variant="destructive" className="mb-4">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
          
          <SitePasswordForm
            onSubmit={handleLogin}
            loading={loading || isAuthenticating}
            error={null} // We handle errors in the parent component now
          />
        </div>
        
        <div className="mt-auto">
          <Footer />
        </div>
      </div>
    </div>
  );
};

export default Landing;