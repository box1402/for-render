import { Switch, Route, useLocation } from "wouter";
import { Toaster } from "@/components/ui/toaster";
import NotFound from "@/pages/not-found";
import Landing from "@/pages/Landing";
import Browse from "@/pages/Browse";
import Home from "@/pages/Home";
import VideoRoom from "@/pages/VideoRoom";
import { useAuth } from "./contexts/AuthContext";
import { useSiteAuth } from "./contexts/SiteAuthContext";
import { useEffect } from "react";

function Router() {
  const [location, setLocation] = useLocation();
  const { authenticated: roomAuthenticated } = useAuth();
  const { authenticated: siteAuthenticated } = useSiteAuth();

  // Redirect to landing if not site authenticated
  useEffect(() => {
    // If accessing any page other than landing while not site authenticated, redirect to landing
    if (!siteAuthenticated && location !== "/") {
      setLocation("/");
    }
  }, [siteAuthenticated, location, setLocation]);

  // Redirect to home if not room authenticated and trying to access the video room
  useEffect(() => {
    if (location.startsWith("/room") && !roomAuthenticated) {
      // If site authenticated but not room authenticated, go to browse
      if (siteAuthenticated) {
        setLocation("/browse");
      } else {
        // Otherwise go to landing
        setLocation("/");
      }
    }
  }, [location, roomAuthenticated, siteAuthenticated, setLocation]);

  return (
    <Switch>
      <Route path="/" component={Landing} />
      <Route path="/browse" component={Browse} />
      <Route path="/join" component={Home} />
      <Route path="/room/:roomId" component={VideoRoom} />
      {/* Fallback to 404 */}
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <>
      <Router />
      <Toaster />
    </>
  );
}

export default App;
