import Link from "next/link";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Test Metode Rendering | Smart Printing",
  description: "Pilih metode rendering untuk Create Quote — CSR atau SSR.",
};

export default function TestMetodeRenderingPage() {
  return (
    <div className="min-h-screen p-4 md:p-4">
      <div className="w-full mx-auto p-5 ">
        <div className="mb-10">
          <h1 className="text-3xl md:text-4xl font-bold text-card-foreground tracking-tight">
            Test Metode Rendering
          </h1>
          <p className="text-muted-foreground mt-2 text-lg">
            Pilih metode rendering untuk menjalankan Create Quote.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* uji mikro */}
          <div className="flex flex-col gap-5">
            <h2 className="text-xl md:text-2xl font-bold text-card-foreground tracking-tight">
              Uji Mikro
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {/* CSR Card */}
              <Link
                href="/test/csr"
                className="group relative bg-card border border-border rounded-2xl p-8 hover:border-primary/50 transition-all duration-300 hover:shadow-lg hover:shadow-primary/5"
              >
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="20"
                      height="20"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      className="text-primary"
                    >
                      <rect
                        x="2"
                        y="3"
                        width="20"
                        height="14"
                        rx="2"
                        ry="2"
                      ></rect>
                      <line x1="8" y1="21" x2="16" y2="21"></line>
                      <line x1="12" y1="17" x2="12" y2="21"></line>
                    </svg>
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-foreground">CSR</h2>
                    <p className="text-xs text-muted-foreground">
                      Client-Side Rendering
                    </p>
                  </div>
                </div>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  Algoritma Greedy BSSF dieksekusi langsung di browser.
                  Komputasi berjalan di main thread client.
                </p>
                <div className="mt-4 inline-flex items-center gap-1 text-sm font-medium text-primary opacity-0 group-hover:opacity-100 transition-opacity">
                  Buka →
                </div>
              </Link>

              {/* SSR Card */}
              <Link
                href="/test/ssr"
                className="group relative bg-card border border-border rounded-2xl p-8 hover:border-primary/50 transition-all duration-300 hover:shadow-lg hover:shadow-primary/5"
              >
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="20"
                      height="20"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      className="text-primary"
                    >
                      <rect
                        x="2"
                        y="2"
                        width="20"
                        height="8"
                        rx="2"
                        ry="2"
                      ></rect>
                      <rect
                        x="2"
                        y="14"
                        width="20"
                        height="8"
                        rx="2"
                        ry="2"
                      ></rect>
                      <line x1="6" y1="6" x2="6.01" y2="6"></line>
                      <line x1="6" y1="18" x2="6.01" y2="18"></line>
                    </svg>
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-foreground">SSR</h2>
                    <p className="text-xs text-muted-foreground">
                      Server-Side Rendering
                    </p>
                  </div>
                </div>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  Algoritma Greedy BSSF dieksekusi di server Node.js via Server
                  Action. Main thread browser tetap responsif.
                </p>
                <div className="mt-4 inline-flex items-center gap-1 text-sm font-medium text-primary opacity-0 group-hover:opacity-100 transition-opacity">
                  Buka →
                </div>
              </Link>
            </div>
          </div>

          {/* uji makro */}
          <div className="flex flex-col gap-5">
            <h2 className="text-xl md:text-2xl font-bold text-card-foreground tracking-tight">
              Uji Makro
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {/* CSR Card */}
              <Link
                href="/create-quote/csr"
                className="group relative bg-card border border-border rounded-2xl p-8 hover:border-primary/50 transition-all duration-300 hover:shadow-lg hover:shadow-primary/5"
              >
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="20"
                      height="20"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      className="text-primary"
                    >
                      <rect
                        x="2"
                        y="3"
                        width="20"
                        height="14"
                        rx="2"
                        ry="2"
                      ></rect>
                      <line x1="8" y1="21" x2="16" y2="21"></line>
                      <line x1="12" y1="17" x2="12" y2="21"></line>
                    </svg>
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-foreground">CSR</h2>
                    <p className="text-xs text-muted-foreground">
                      Client-Side Rendering
                    </p>
                  </div>
                </div>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  Algoritma Greedy BSSF dieksekusi langsung di browser.
                  Komputasi berjalan di main thread client.
                </p>
                <div className="mt-4 inline-flex items-center gap-1 text-sm font-medium text-primary opacity-0 group-hover:opacity-100 transition-opacity">
                  Buka →
                </div>
              </Link>

              {/* SSR Card */}
              <Link
                href="/create-quote/ssr"
                className="group relative bg-card border border-border rounded-2xl p-8 hover:border-primary/50 transition-all duration-300 hover:shadow-lg hover:shadow-primary/5"
              >
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="20"
                      height="20"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      className="text-primary"
                    >
                      <rect
                        x="2"
                        y="2"
                        width="20"
                        height="8"
                        rx="2"
                        ry="2"
                      ></rect>
                      <rect
                        x="2"
                        y="14"
                        width="20"
                        height="8"
                        rx="2"
                        ry="2"
                      ></rect>
                      <line x1="6" y1="6" x2="6.01" y2="6"></line>
                      <line x1="6" y1="18" x2="6.01" y2="18"></line>
                    </svg>
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-foreground">SSR</h2>
                    <p className="text-xs text-muted-foreground">
                      Server-Side Rendering
                    </p>
                  </div>
                </div>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  Algoritma Greedy BSSF dieksekusi di server Node.js via Server
                  Action. Main thread browser tetap responsif.
                </p>
                <div className="mt-4 inline-flex items-center gap-1 text-sm font-medium text-primary opacity-0 group-hover:opacity-100 transition-opacity">
                  Buka →
                </div>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
