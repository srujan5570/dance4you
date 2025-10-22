"use client";

import LoadingSpinner from "./LoadingSpinner";

interface ButtonLoaderProps {
  loading: boolean;
  children: React.ReactNode;
  loadingText?: string;
  disabled?: boolean;
  onClick?: () => void;
  type?: "button" | "submit" | "reset";
  className?: string;
  variant?: "primary" | "secondary" | "danger";
}

export default function ButtonLoader({
  loading,
  children,
  loadingText = "Loading...",
  disabled = false,
  onClick,
  type = "button",
  className = "",
  variant = "primary"
}: ButtonLoaderProps) {
  const baseClasses = "inline-flex items-center justify-center gap-2 px-4 py-2 rounded-xl font-medium transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed";
  
  const variantClasses = {
    primary: "bg-orange-500 hover:bg-orange-600 text-white shadow-lg hover:shadow-xl",
    secondary: "bg-gray-200 hover:bg-gray-300 text-gray-800 dark:bg-gray-700 dark:hover:bg-gray-600 dark:text-gray-200",
    danger: "bg-red-500 hover:bg-red-600 text-white shadow-lg hover:shadow-xl"
  };

  const isDisabled = loading || disabled;

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={isDisabled}
      className={`${baseClasses} ${variantClasses[variant]} ${className}`}
    >
      {loading ? (
        <>
          <LoadingSpinner size="sm" color="white" />
          {loadingText}
        </>
      ) : (
        children
      )}
    </button>
  );
}

// Named export for compatibility
export { ButtonLoader };