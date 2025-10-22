"use client";

interface LoadingSpinnerProps {
  size?: "sm" | "md" | "lg";
  color?: "white" | "orange" | "gray";
  text?: string;
  className?: string;
}

export default function LoadingSpinner({ 
  size = "md", 
  color = "orange", 
  text,
  className = "" 
}: LoadingSpinnerProps) {
  const sizeClasses = {
    sm: "h-4 w-4",
    md: "h-8 w-8", 
    lg: "h-12 w-12"
  };

  const colorClasses = {
    white: "border-white border-t-transparent",
    orange: "border-orange-500 border-t-transparent", 
    gray: "border-gray-300 border-t-transparent dark:border-gray-600"
  };

  const textColorClasses = {
    white: "text-white",
    orange: "text-orange-600 dark:text-orange-400",
    gray: "text-gray-600 dark:text-gray-400"
  };

  return (
    <div className={`flex flex-col items-center justify-center gap-3 ${className}`}>
      <div 
        className={`animate-spin rounded-full border-2 ${sizeClasses[size]} ${colorClasses[color]}`}
        role="status"
        aria-label="Loading"
      />
      {text && (
        <p className={`text-sm ${textColorClasses[color]}`}>
          {text}
        </p>
      )}
    </div>
  );
}