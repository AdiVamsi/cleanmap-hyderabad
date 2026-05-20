import "mapbox-gl/dist/mapbox-gl.css";
import "./globals.css";

import type { Metadata } from "next";

export const metadata: Metadata = {
  metadataBase: new URL(
    process.env.NEXT_PUBLIC_SITE_URL ?? "https://cleanmap-hyderabad.vercel.app"
  ),
  title: "CleanMap Hyderabad",
  description: "Community-reported cleanup spots across Hyderabad.",
  openGraph: {
    siteName: "CleanMap Hyderabad",
    type: "website"
  },
  twitter: {
    card: "summary_large_image"
  }
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
