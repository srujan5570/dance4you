"use client";

import LoadingSpinner from "./LoadingSpinner";

interface PageLoaderProps {
  text?: string;
  className?: string;
}

export default function PageLoader({ 
  text = "Loading...", 
  className = "" 
}: PageLoaderProps) {
  return (
    <div className={`fixed inset-0 bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm z-50 flex items-center justify-center ${className}`}>
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-8 max-w-sm mx-4">
        <LoadingSpinner 
          size="lg" 
          color="orange" 
          text={text}
          className="py-4"
        />
      </div>
    </div>
  );
}