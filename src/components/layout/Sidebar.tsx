
"use client";

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LayoutDashboard, PlusCircle, Settings, Briefcase } from 'lucide-react';

import { cn } from '@/lib/utils';
import {
  Sidebar as UISidebar,
  SidebarHeader,
  SidebarContent,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarFooter,
  useSidebar,
} from '@/components/ui/sidebar';
import { Button } from '@/components/ui/button';
import { AppLogo } from '@/components/icons/AppLogo';

const menuItems = [
  { href: '/', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/requests/new', label: 'New Request', icon: PlusCircle },
  // { href: '/clients', label: 'Clients', icon: Briefcase }, // Future feature
  // { href: '/settings', label: 'Settings', icon: Settings }, // Future feature
];

export function Sidebar() {
  const pathname = usePathname();
  const { open, setOpen, isMobile } = useSidebar();

  const handleLinkClick = () => {
    if (isMobile) {
      setOpen(false);
    }
  };
  
  return (
    <UISidebar collapsible="icon" side="left" variant="sidebar" className="border-r">
      <SidebarHeader className="p-4 flex flex-col items-start">
        <Link href="/" className="block group-data-[collapsible=icon]:hidden mb-1">
          <AppLogo height={35} width={130}/>
        </Link>
         <p className="text-xs text-sidebar-foreground/70 group-data-[collapsible=icon]:hidden">Postify v1.0</p>
         <p className="text-[10px] text-sidebar-foreground/50 group-data-[collapsible=icon]:hidden">by Lime Advertising Inc.</p>
      </SidebarHeader>
      <SidebarContent>
        <SidebarMenu>
          {menuItems.map((item) => (
            <SidebarMenuItem key={item.href}>
              <Link href={item.href} passHref legacyBehavior>
                <SidebarMenuButton
                  asChild
                  isActive={pathname === item.href}
                  onClick={handleLinkClick}
                  tooltip={{ children: item.label, side: 'right', align: 'center' }}
                  className="justify-start"
                >
                  <a>
                    <item.icon className="mr-2 h-5 w-5 flex-shrink-0" />
                    <span>{item.label}</span>
                  </a>
                </SidebarMenuButton>
              </Link>
            </SidebarMenuItem>
          ))}
        </SidebarMenu>
      </SidebarContent>
      <SidebarFooter className="p-2">
        {/* Placeholder for user profile or settings shortcut */}
        <SidebarMenuButton
            asChild
            tooltip={{ children: "Settings", side: 'right', align: 'center' }}
            className="justify-start"
          >
            <Link href="/settings">
              <Settings className="mr-2 h-5 w-5 flex-shrink-0" />
              <span>Settings</span>
            </Link>
          </SidebarMenuButton>
      </SidebarFooter>
    </UISidebar>
  );
}
