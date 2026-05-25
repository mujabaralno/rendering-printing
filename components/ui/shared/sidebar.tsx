"use client";

import * as React from "react";
import { Plus, ClipboardCheck, Server, EarthIcon, Printer } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";

import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
} from "@/components/ui/sidebar";

// Admin Menu Items
const adminNavItems = [
  {
    title: "Create Quote",
    url: "/",
    icon: Plus,
  },
  {
    title: "Test",
    url: "/test",
    icon: ClipboardCheck,
    items: [
      {
        title: "Client-Side",
        url: "/test/csr",
        icon: EarthIcon,
      },
      {
        title: "Server-Side",
        url: "/test/ssr",
        icon: Server,
      },
    ],
  },
];

export function AdminSidebar() {
  const pathname = usePathname();

  return (
    <Sidebar className="bg-background border-none">
      <SidebarContent className="p-4 bg-background">
        <SidebarGroup>
          {/* Label khusus untuk Admin Panel */}
          <SidebarGroupLabel className="mb-4 px-2 text-xs font-bold uppercase tracking-[0.2em] text-primary">
            <Printer className="mr-2" /> Smart Printing
          </SidebarGroupLabel>

          <SidebarGroupContent>
            <SidebarMenu className="gap-1.5">
              {adminNavItems.map((item) => {
                // Cek aktif untuk menu utama atau submenu
                const isActive =
                  pathname === item.url ||
                  (item.items &&
                    item.items.some((sub) => pathname === sub.url));

                return (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton
                      asChild
                      className={`
                        w-full transition-all duration-300 ease-out group px-3 py-5 rounded-xl
                        ${
                          isActive
                            ? "bg-primary text-primary-foreground shadow-sm shadow-primary/20 hover:bg-primary/95"
                            : "text-muted-foreground hover:bg-secondary/50 hover:text-foreground"
                        }
                      `}
                    >
                      <Link href={item.url} className="flex items-center gap-3">
                        <item.icon
                          className={`h-5 w-5 transition-transform duration-300 ${isActive ? "scale-110" : "group-hover:scale-110"}`}
                        />
                        <span className="font-semibold text-sm tracking-wide">
                          {item.title}
                        </span>
                      </Link>
                    </SidebarMenuButton>

                    {/* Submenu untuk Question Bank */}
                    {item.items?.length ? (
                      <SidebarMenuSub className="mt-1.5 ml-4 border-l border-border/50 pl-2">
                        {item.items.map((subItem) => {
                          const isSubActive = pathname === subItem.url;
                          return (
                            <SidebarMenuSubItem
                              key={subItem.title}
                              className="mb-1"
                            >
                              <SidebarMenuSubButton
                                asChild
                                className={`
                                  w-full transition-all duration-300 ease-out px-3 py-4 rounded-lg
                                  ${
                                    isSubActive
                                      ? "bg-primary text-primary-foreground shadow-sm shadow-primary/20 hover:bg-primary/95"
                                      : "text-muted-foreground hover:bg-secondary/50 hover:text-foreground"
                                  }
                                `}
                              >
                                <Link
                                  href={subItem.url}
                                  className="flex items-center gap-3"
                                >
                                  <subItem.icon
                                    className={`transition-all duration-300 ${isSubActive ? "scale-110 " : "group-hover:scale-110"}`}
                                    color={`${isSubActive ? "white" : "var(--muted-foreground)"}`}
                                  />
                                  <span className="font-medium text-sm">
                                    {subItem.title}
                                  </span>
                                </Link>
                              </SidebarMenuSubButton>
                            </SidebarMenuSubItem>
                          );
                        })}
                      </SidebarMenuSub>
                    ) : null}
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  );
}
