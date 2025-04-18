import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";
import { AuthProvider } from "./contexts/AuthContext";
import { SiteAuthProvider } from "./contexts/SiteAuthContext";
import { VideoSyncProvider } from "./contexts/VideoSyncContext";
import { QueryClientProvider } from "@tanstack/react-query";
import { queryClient } from "./lib/queryClient";
import "./test-api"; // Import debug helper

createRoot(document.getElementById("root")!).render(
  <QueryClientProvider client={queryClient}>
    <SiteAuthProvider>
      <AuthProvider>
        <VideoSyncProvider>
          <App />
        </VideoSyncProvider>
      </AuthProvider>
    </SiteAuthProvider>
  </QueryClientProvider>
);
