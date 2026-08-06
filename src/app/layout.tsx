import type { Metadata } from "next";
import "./globals.css";
import { AuthProvider } from "@/lib/auth/auth-context";
import { ThemeProvider } from "@/lib/theme/theme-context";
import SystemGuard from "@/components/layout/SystemGuard";
import LeadAssignmentModal from "@/components/admin/LeadAssignmentModal";

export const metadata: Metadata = {
  title: "BASECHANWISER — Student Compliance & Operations Platform",
  description:
    "Google Material Design 3 student compliance routing, Dashboard dashboard, and Google Forms style module editor.",
  icons: {
    icon: "/logo.png",
    apple: "/logo.png",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="antialiased bg-[var(--background)] text-[var(--foreground)] min-h-screen">
        <ThemeProvider>
          <AuthProvider>
            <SystemGuard>
              {children}
              <LeadAssignmentModal />
            </SystemGuard>
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
