import type { Metadata } from "next";
import { Geist } from "next/font/google";
import { ClerkProvider } from "@clerk/nextjs";

import ConvexClientProvider from "@/components/convex-client-provider";
import "./globals.css";
import { ThemeProvider } from "@/components/theme-provider";

const fontSans = Geist({ subsets: ["latin"], variable: "--font-sans" });

export const metadata: Metadata = {
  title: "VerbaScore",
  description:
    "Turn every call into revenue with VerbaScore's automated QA and coaching platform.",
  applicationName: "VerbaScore",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning className={fontSans.variable}>
      <body className="antialiased">
        <ClerkProvider>
          <ConvexClientProvider>
            <ThemeProvider>{children}</ThemeProvider>
          </ConvexClientProvider>
        </ClerkProvider>
      </body>
    </html>
  );
}
