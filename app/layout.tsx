import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { ConvexClientProvider } from "./ConvexClientProvider";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "X DM Hub - Daily Lead Finder",
  description: "Daily lead finder for collab creators and SubWise users",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={inter.className}>
        <ConvexClientProvider>
          <div className="min-h-screen bg-background">
            {children}
          </div>
        </ConvexClientProvider>
      </body>
    </html>
  );
}
