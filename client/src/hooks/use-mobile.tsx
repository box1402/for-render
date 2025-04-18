import { useState, useEffect } from "react";

export function useIsMobile() {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    // Check if window is available (client-side)
    if (typeof window !== "undefined") {
      // Set initial value
      setIsMobile(window.innerWidth < 768);

      // Add event listener
      const handleResize = () => {
        setIsMobile(window.innerWidth < 768);
      };

      // Listen for window resize
      window.addEventListener("resize", handleResize);

      // Clean up on unmount
      return () => {
        window.removeEventListener("resize", handleResize);
      };
    }
  }, []);

  return isMobile;
}