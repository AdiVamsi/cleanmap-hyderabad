import "./globals.css";

import type { Metadata, Viewport } from "next";

export const metadata: Metadata = {
  metadataBase: new URL(
    process.env.NEXT_PUBLIC_SITE_URL ?? "https://cleanmap-hyderabad.vercel.app"
  ),
  title: {
    default: "CleanMap Hyderabad",
    template: "%s — CleanMap Hyderabad"
  },
  description: "Report garbage. Track cleanups. Prove Hyderabad cares.",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "CleanMap"
  },
  icons: {
    icon: "/icons/icon.svg",
    apple: "/icons/icon.svg"
  },
  openGraph: {
    siteName: "CleanMap Hyderabad",
    type: "website"
  },
  twitter: {
    card: "summary_large_image"
  }
};

export const viewport: Viewport = {
  themeColor: "#E85D04"
};

export default function RootLayout({
  children
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
