import { useState, useEffect } from 'react';
import { Download } from 'lucide-react';


const useOS = () => {
  const [os, setOs] = useState<"Windows" | "macOS" | "Linux" | "Unknown">("Unknown");

  useEffect(() => {
    const platform = window.navigator.platform.toLowerCase();
    if (platform.includes("win")) setOs("Windows");
    else if (platform.includes("mac")) setOs("macOS");
    else if (platform.includes("linux")) setOs("Linux");
  }, []);

  return os;
};
