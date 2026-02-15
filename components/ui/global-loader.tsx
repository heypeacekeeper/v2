"use client";

import { Rocket } from "lucide-react";

interface GlobalLoaderProps {
  message?: string;
  submessage?: string;
}

export function GlobalLoader({ 
  message = "Loading", 
  submessage 
}: GlobalLoaderProps) {
  return (
    <div className="fixed inset-0 z-[100] bg-background flex flex-col items-center justify-center">
      <div className="relative flex flex-col items-center gap-6">
        {/* Animated rocket logo */}
        <div className="relative">
          <div className="w-20 h-20 rounded-2xl bg-primary/10 flex items-center justify-center">
            <Rocket className="w-10 h-10 text-primary animate-bounce" />
          </div>
          {/* Orbiting dots */}
          <div className="absolute inset-0 animate-spin" style={{ animationDuration: "3s" }}>
            <div className="absolute -top-2 left-1/2 -translate-x-1/2 w-2 h-2 rounded-full bg-primary" />
          </div>
          <div className="absolute inset-0 animate-spin" style={{ animationDuration: "3s", animationDelay: "1s" }}>
            <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 w-2 h-2 rounded-full bg-primary/60" />
          </div>
          <div className="absolute inset-0 animate-spin" style={{ animationDuration: "3s", animationDelay: "2s" }}>
            <div className="absolute top-1/2 -right-2 -translate-y-1/2 w-2 h-2 rounded-full bg-primary/30" />
          </div>
        </div>

        {/* Text */}
        <div className="text-center space-y-1">
          <p className="text-lg font-medium text-foreground">{message}</p>
          {submessage && (
            <p className="text-sm text-muted-foreground">{submessage}</p>
          )}
        </div>

        {/* Progress bar */}
        <div className="w-48 h-1 bg-secondary rounded-full overflow-hidden">
          <div 
            className="h-full bg-primary rounded-full"
            style={{
              animation: "loading-progress 1.5s ease-in-out infinite",
            }}
          />
        </div>
      </div>

      <style jsx>{`
        @keyframes loading-progress {
          0% {
            width: 0%;
            margin-left: 0%;
          }
          50% {
            width: 60%;
            margin-left: 20%;
          }
          100% {
            width: 0%;
            margin-left: 100%;
          }
        }
      `}</style>
    </div>
  );
}

export function PageLoader({ message = "Loading..." }: { message?: string }) {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
      <div className="relative">
        <div className="w-16 h-16 rounded-xl bg-primary/10 flex items-center justify-center">
          <Rocket className="w-8 h-8 text-primary animate-bounce" />
        </div>
        {/* Orbiting dots for page loader too */}
        <div className="absolute inset-0 animate-spin" style={{ animationDuration: "2.5s" }}>
          <div className="absolute -top-1.5 left-1/2 -translate-x-1/2 w-1.5 h-1.5 rounded-full bg-primary" />
        </div>
        <div className="absolute inset-0 animate-spin" style={{ animationDuration: "2.5s", animationDelay: "0.8s" }}>
          <div className="absolute -bottom-1.5 left-1/2 -translate-x-1/2 w-1.5 h-1.5 rounded-full bg-primary/60" />
        </div>
      </div>
      <p className="text-sm text-muted-foreground">{message}</p>
    </div>
  );
}

// Small inline rocket loader for buttons and small areas
export function RocketLoader({ size = "sm", className = "" }: { size?: "xs" | "sm" | "md"; className?: string }) {
  const sizeClasses = {
    xs: "w-3 h-3",
    sm: "w-4 h-4",
    md: "w-5 h-5",
  };

  return (
    <Rocket className={`${sizeClasses[size]} text-current animate-bounce ${className}`} />
  );
}
