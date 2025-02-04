'use client';

import { cn } from "@/lib/utils";
import { Loader2 } from "lucide-react";

const variants = {
  default: "h-4 w-4",
  sm: "h-3 w-3",
  lg: "h-6 w-6",
  xl: "h-8 w-8",
  icon: "h-4 w-4 text-muted-foreground",
  page: "h-8 w-8 text-primary",
};

export function LoadingSpinner({ 
  variant = "default",
  className,
  text,
  fullPage = false,
}) {
  const spinnerSize = variants[variant] || variants.default;

  if (fullPage) {
    return (
      <div className="fixed inset-0 flex items-center justify-center bg-background/80 backdrop-blur-sm">
        <div className="flex flex-col items-center space-y-4">
          <Loader2 className={cn("animate-spin text-primary", variants.page)} />
          {text && (
            <p className="text-sm text-muted-foreground animate-pulse">
              {text}
            </p>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className={cn(
      "flex items-center justify-center",
      text ? "space-x-2" : "",
      className
    )}>
      <Loader2 className={cn("animate-spin", spinnerSize)} />
      {text && (
        <span className="text-sm text-muted-foreground">{text}</span>
      )}
    </div>
  );
}

export function LoadingPage({ text = "Loading...", bottomText = "Please wait while we load your content" }) {
  return (
    <div className="h-full w-full flex flex-col items-center justify-center min-h-[400px]">
      <div className="flex flex-col items-center space-y-6">
        <div className="relative">
          <div className="h-16 w-16 rounded-full border-4 border-primary/5 border-t-primary animate-spin" />
        </div>
        <div className="flex flex-col items-center space-y-2">
          <p className="text-base font-medium text-muted-foreground animate-pulse">
            {text}
          </p>
          <p className="text-xs text-muted-foreground/70">
            {bottomText}
          </p>
        </div>
      </div>
    </div>
  );
}

export function LoadingSkeleton() {
  return (
    <div className="w-full space-y-4">
      <div className="flex items-center space-x-4">
        <div className="h-12 w-12 rounded-full bg-muted animate-pulse" />
        <div className="space-y-2">
          <div className="h-4 w-[200px] bg-muted animate-pulse rounded" />
          <div className="h-4 w-[150px] bg-muted animate-pulse rounded" />
        </div>
      </div>
      <div className="space-y-2">
        <div className="h-4 w-full bg-muted animate-pulse rounded" />
        <div className="h-4 w-[80%] bg-muted animate-pulse rounded" />
        <div className="h-4 w-[90%] bg-muted animate-pulse rounded" />
      </div>
    </div>
  );
}

export function LoadingDots() {
  return (
    <div className="flex space-x-1 items-center justify-center">
      {[...Array(3)].map((_, i) => (
        <div
          key={i}
          className="h-2 w-2 rounded-full bg-primary animate-bounce"
          style={{ animationDelay: `${i * 0.1}s` }}
        />
      ))}
    </div>
  );
} 