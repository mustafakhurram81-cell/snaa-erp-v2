import type { Metadata } from "next";
import { Plus_Jakarta_Sans } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "@/components/theme-provider";
import { CurrencyProvider } from "@/lib/currency";
import { ToastProvider } from "@/components/ui/toast";
import { AppShell } from "@/components/layout/app-shell";
import { AuthProvider } from "@/lib/auth-context";
import { ErrorBoundary } from "@/components/shared/error-boundary";

export const metadata: Metadata = {
  title: "Smith Instruments ERP",
  description: "Enterprise Resource Planning System for Smith Instruments - Surgical Instruments Manufacturing",
};

const jakarta = Plus_Jakarta_Sans({
  subsets: ["latin"],
  variable: "--font-jakarta",
  display: "swap",
});

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning className={jakarta.variable}>
      <head>
      </head>
      <body className="antialiased">
        <ThemeProvider>
          <AuthProvider>
            <CurrencyProvider>
              <ToastProvider>
                <AppShell><ErrorBoundary>{children}</ErrorBoundary></AppShell>
              </ToastProvider>
            </CurrencyProvider>
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}

