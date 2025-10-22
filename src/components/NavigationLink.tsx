"use client";

import Link from "next/link";
import { useGlobalLoading } from "./GlobalLoadingProvider";
import { usePathname } from "next/navigation";

interface NavigationLinkProps {
  href: string;
  children: React.ReactNode;
  className?: string;
  onClick?: () => void;
}

export default function NavigationLink({ href, children, className, onClick }: NavigationLinkProps) {
  const { startLoading } = useGlobalLoading();
  const pathname = usePathname();

  const handleClick = () => {
    // Only show loading if navigating to a different page
    if (href !== pathname) {
      startLoading();
    }
    onClick?.();
  };

  return (
    <Link href={href} className={className} onClick={handleClick}>
      {children}
    </Link>
  );
}