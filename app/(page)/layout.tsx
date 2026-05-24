"use client";

import * as React from "react";
import { usePathname } from "next/navigation";
import Link from "next/link";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AdminSidebar } from "@/components/ui/shared/sidebar";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ModeToggle } from "@/components/theme/mode-toggle";

// Import komponen Breadcrumb dari Shadcn UI
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";

export default function AdminDashboardLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const pathname = usePathname();

  // Memecah URL menjadi segmen array dan membuang string kosong
  // Contoh: "/admin/content/reading" -> ["admin", "content", "reading"]
  const pathSegments = pathname.split("/").filter(Boolean);

  return (
    <SidebarProvider>
      <AdminSidebar />
      {/* Main tidak bisa di-scroll secara global dengan membatasi tingginya */}
      <main className="w-full flex-1 p-4 h-screen flex flex-col overflow-hidden bg-background">
        <header className="flex justify-between items-center w-full shrink-0 px-2">
          {/* Sisi Kiri: Trigger Sidebar + Dynamic Breadcrumb */}
          <div className="flex items-center gap-4">
            <SidebarTrigger className="text-muted-foreground hover:text-foreground transition-colors" />
            <div className="h-4 w-[1px] bg-border/60 hidden sm:block" />{" "}
            {/* Separator kecil */}
            {/* Dynamic Shadcn Breadcrumb */}
            <Breadcrumb className="hidden sm:block">
              <BreadcrumbList>
                {pathSegments.map((segment, index) => {
                  // Menyusun kembali URL secara bertahap untuk link href
                  const url = `/${pathSegments.slice(0, index + 1).join("/")}`;
                  const isLast = index === pathSegments.length - 1;

                  // Mengubah dash (-) menjadi spasi jika ada nama folder yang panjang
                  const formattedText = segment.replace(/-/g, " ");

                  return (
                    <React.Fragment key={url}>
                      <BreadcrumbItem>
                        {isLast ? (
                          // Halaman terakhir aktif menggunakan BreadcrumbPage (Tanpa link & Text solid)
                          <BreadcrumbPage className="lowercase font-bold text-foreground tracking-wide">
                            {formattedText}
                          </BreadcrumbPage>
                        ) : (
                          // Halaman sebelumnya menggunakan BreadcrumbLink + Next.js Link agar sejalan dengan routing
                          <BreadcrumbLink
                            asChild
                            className="lowercase font-medium text-muted-foreground hover:text-foreground transition-colors"
                          >
                            <Link href={url}>{formattedText}</Link>
                          </BreadcrumbLink>
                        )}
                      </BreadcrumbItem>
                      {/* Tampilkan garis miring pemisah jika bukan elemen terakhir */}
                      {!isLast && (
                        <BreadcrumbSeparator className="text-muted-foreground/40" />
                      )}
                    </React.Fragment>
                  );
                })}
              </BreadcrumbList>
            </Breadcrumb>
          </div>

          {/* Sisi Kanan: Theme Toggle */}
          <div className="flex flex-end gap-5 items-center">
            <ModeToggle />
          </div>
        </header>

        {/* Container Shell Utama */}
        <section className="p-1 bg-sidebar w-full rounded-[1rem] mt-3 h-[calc(100vh-5rem)] overflow-y-auto border border-border/40 shadow-inner">
          <TooltipProvider>{children}</TooltipProvider>
        </section>
      </main>
    </SidebarProvider>
  );
}
