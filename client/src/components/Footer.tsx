import React from "react";

const Footer: React.FC = () => {
  return (
    <footer className="w-full py-4 text-center border-t border-neutral-200 mt-8 text-neutral-500 text-sm">
      <p>&copy; {new Date().getFullYear()} SyncView - Secure Video Sync Platform</p>
    </footer>
  );
};

export default Footer;