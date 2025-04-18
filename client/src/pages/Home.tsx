import React from "react";
import { useLocation } from "wouter";
import AuthForm from "../components/AuthForm";
import Header from "../components/Header";
import Footer from "../components/Footer";
import { useAuth } from "../contexts/AuthContext";
import { useSiteAuth } from "../contexts/SiteAuthContext";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";

const Home: React.FC = () => {
  const [, setLocation] = useLocation();
  const { login, loading, error } = useAuth();
  const { authenticated: siteAuthenticated } = useSiteAuth();

  // Redirect to Landing if not site authenticated
  React.useEffect(() => {
    if (!siteAuthenticated) {
      setLocation("/");
    }
  }, [siteAuthenticated, setLocation]);

  const handleLogin = async (roomName: string, password: string) => {
    const result = await login(roomName, password);
    if (result.success && result.room) {
      setLocation(`/room/${result.room.id}`);
    }
  };

  const handleBack = () => {
    setLocation("/browse");
  };

  // Don't render anything if not site authenticated
  if (!siteAuthenticated) {
    return null;
  }

  return (
    <div className="container mx-auto px-4 py-8 flex flex-col min-h-screen">
      <Header />
      
      <div className="mb-6">
        <Button 
          variant="ghost" 
          className="flex items-center text-neutral-600 hover:text-primary"
          onClick={handleBack}
        >
          <ArrowLeft className="mr-1 h-4 w-4" />
          Back to content browser
        </Button>
      </div>
      
      <div className="text-center mb-8">
        <h1 className="text-2xl font-bold text-primary">Join Existing Room</h1>
        <p className="text-neutral-600">Enter room credentials to join an existing viewing session</p>
      </div>
      
      <AuthForm 
        onSubmit={handleLogin} 
        loading={loading} 
        error={error} 
      />
      
      <Footer />
    </div>
  );
};

export default Home;
