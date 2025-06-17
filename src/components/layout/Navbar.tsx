
"use client";
import type { HTMLAttributes } from 'react';
import { AppLogo } from '@/components/icons/AppLogo';
import { SidebarTrigger } from '@/components/ui/sidebar';
import { cn } from '@/lib/utils';
import Link from 'next/link';

interface NavbarProps extends HTMLAttributes<HTMLElement> {}

export function Navbar({ className, ...props }: NavbarProps) {
  return (
    <header
      className={cn(
        "sticky top-0 z-40 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60",
        className
      )}
      {...props}
    >
      <div className="container flex h-16 items-center justify-between_ max-w-screen-2xl px-4 md:px-6_">
        <div className="flex items-center gap-4">
          <SidebarTrigger className="md:hidden" />
          <Link href="/" className="flex items-center space-x-2">
            <AppLogo height={30} width={120} />
          </Link>
        </div>
        {/* Placeholder for user menu or other actions */}
        {/* <UserNav /> */}
      </div>
    </header>
  );
}
