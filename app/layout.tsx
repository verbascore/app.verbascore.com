import type { Metadata } from "next";
import { ClerkProvider } from "@clerk/nextjs";

import { AuthGate } from "@/components/auth-gate";
import ConvexClientProvider from "@/components/convex-client-provider";
import "./globals.css";
import { ThemeProvider } from "@/components/theme-provider";

export const metadata: Metadata = {
  title: "VerbaScore",
  description:
    "Turn every call into revenue with VerbaScore's automated QA and coaching platform.",
  applicationName: "VerbaScore",
  icons: {
    icon: "/verbascore-mark.png",
    shortcut: "/verbascore-mark.png",
    apple: "/verbascore-mark.png",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="antialiased">
        <ClerkProvider
          publishableKey={process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY}
        >
          <ConvexClientProvider>
            <AuthGate>
              <ThemeProvider>{children}</ThemeProvider>
            </AuthGate>
          </ConvexClientProvider>
        </ClerkProvider>
      </body>
    </html>
  );
}
