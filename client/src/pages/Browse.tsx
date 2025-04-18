import React, { useEffect } from "react";
import { useSiteAuth } from "../contexts/SiteAuthContext";
import ContentBrowser from "../components/ContentBrowser";
import Footer from "../components/Footer";
import { useLocation } from "wouter";
import { Loader2 } from "lucide-react";

const Browse: React.FC = () => {
  const { authenticated, logout } = useSiteAuth();
  const [, setLocation] = useLocation();

  // Redirect to landing if not authenticated
  useEffect(() => {
    if (!authenticated) {
      setLocation("/");
    }
  }, [authenticated, setLocation]);

  // If not authenticated, show loading state
  if (!authenticated) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-neutral-50">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-neutral-600">Redirecting to login...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col">
      <ContentBrowser onLogout={logout} />
      <Footer />
    </div>
  );
};

export default Browse; 