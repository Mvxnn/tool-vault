import type { Metadata } from "next";
import "./globals.css";
import { ThemeProvider } from "@/components/theme-provider";
import { SeedProvider } from "@/components/seed-provider";
import { Sidebar } from "@/components/layout/sidebar";
import { Header } from "@/components/layout/header";
import { Toaster } from "@/components/ui/sonner";

import { PwaRegister } from "@/components/pwa-register";

export const metadata: Metadata = {
  title: "Tool Vault",
  description: "Personal Developer Tool Database",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1.0, viewport-fit=cover" />
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap"
          rel="stylesheet"
        />
      </head>
      <body
        style={{ fontFamily: "'Inter', system-ui, -apple-system, sans-serif" }}
        className="antialiased"
      >
        <PwaRegister />
        <ThemeProvider
          attribute="class"
          defaultTheme="dark"
          enableSystem
          disableTransitionOnChange
        >
          <SeedProvider>
            <div className="flex min-h-screen bg-background text-foreground">
              <Sidebar />
              <main className="flex-1 md:ml-[250px] flex flex-col min-h-screen">
                <Header />
                <div className="flex-1 p-4 md:p-6 relative">
                  {children}
                </div>
              </main>
            </div>
            <Toaster />
          </SeedProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
