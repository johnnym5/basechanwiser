import type { Metadata } from "next";
import "./globals.css";
import { AuthProvider } from "@/lib/auth/auth-context";
import { ThemeProvider } from "@/lib/theme/theme-context";
import SystemGuard from "@/components/layout/SystemGuard";
import LeadAssignmentModal from "@/components/admin/LeadAssignmentModal";
import InitialSeeder from "@/components/common/InitialSeeder";
import OfflineIndicator from "@/components/common/OfflineIndicator";
import { SettingsProvider } from "@/context/SettingsContext";

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
        <OfflineIndicator />
        <ThemeProvider>
          <AuthProvider>
            <SettingsProvider>
              <GuardWrapper>
                {children}
                <LeadAssignmentModal />
                <InitialSeeder />
              </GuardWrapper>
            </SettingsProvider>
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}

// ── GUARD WRAPPER: Decouples Login from SystemGuard ──
import { usePathname } from "next/navigation";
function GuardWrapper({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  // Whitelist public routes from the global authentication check.
  // This allows the login page to render instantly without waiting for Firebase.
  const isPublicRoute = pathname === "/login" || pathname === "/maintenance" || pathname === "/";

  if (isPublicRoute) {
    return <>{children}</>;
  }

  return <SystemGuard>{children}</SystemGuard>;
}
