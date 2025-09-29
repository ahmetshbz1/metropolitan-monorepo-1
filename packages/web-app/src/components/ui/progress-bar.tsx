"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";

export function ProgressBar() {
  const [isLoading, setIsLoading] = useState(false);
  const [progress, setProgress] = useState(0);
  const pathname = usePathname();

  useEffect(() => {
    setIsLoading(true);
    setProgress(10);

    // Simulate loading progress
    const timer1 = setTimeout(() => setProgress(30), 100);
    const timer2 = setTimeout(() => setProgress(70), 300);
    const timer3 = setTimeout(() => {
      setProgress(100);
      setTimeout(() => {
        setIsLoading(false);
        setProgress(0);
      }, 200);
    }, 500);

    return () => {
      clearTimeout(timer1);
      clearTimeout(timer2);
      clearTimeout(timer3);
    };
  }, [pathname]);

  if (!isLoading && progress === 0) return null;

  return (
    <div className="fixed top-0 left-0 right-0 z-[100] h-1">
      <div
        className="h-full bg-gradient-to-r from-primary via-primary to-primary/80 transition-all duration-300 ease-out relative overflow-hidden shadow-lg"
        style={{
          width: `${progress}%`,
          boxShadow: "0 0 10px hsl(var(--primary) / 0.6)",
        }}
      >
        {/* Animated shine effect */}
        <div
          className="absolute inset-0 bg-gradient-to-r from-transparent via-white/40 to-transparent opacity-75"
          style={{
            transform: "translateX(-100%)",
            animation: isLoading ? "shimmer 2s infinite" : "none",
          }}
        />
      </div>

      <style jsx global>{`
        @keyframes shimmer {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(300%); }
        }
      `}</style>
    </div>
  );
}