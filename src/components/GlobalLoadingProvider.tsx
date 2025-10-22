"use client";

import { createContext, useContext, useState, useEffect } from "react";
import { usePathname, useSearchParams } from "next/navigation";
import PageLoader from "./PageLoader";

interface LoadingContextType {
  loading: boolean;
  setLoading: (loading: boolean) => void;
  startLoading: () => void;
  stopLoading: () => void;
}

const LoadingContext = createContext<LoadingContextType | undefined>(undefined);

export function useGlobalLoading() {
  const context = useContext(LoadingContext);
  if (!context) {
    throw new Error("useGlobalLoading must be used within a GlobalLoadingProvider");
  }
  return context;
}

interface GlobalLoadingProviderProps {
  children: React.ReactNode;
}

export default function GlobalLoadingProvider({ children }: GlobalLoadingProviderProps) {
  const [loading, setLoading] = useState(false);
  const pathname = usePathname();
  const searchParams = useSearchParams();

  // Auto-stop loading when route changes
  useEffect(() => {
    setLoading(false);
  }, [pathname, searchParams]);

  const startLoading = () => setLoading(true);
  const stopLoading = () => setLoading(false);

  const value = {
    loading,
    setLoading,
    startLoading,
    stopLoading
  };

  return (
    <LoadingContext.Provider value={value}>
      {children}
      {loading && <PageLoader />}
    </LoadingContext.Provider>
  );
}