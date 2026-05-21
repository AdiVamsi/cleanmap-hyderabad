import "./globals.css";

import type { Metadata } from "next";

export const metadata: Metadata = {
  metadataBase: new URL(
    process.env.NEXT_PUBLIC_SITE_URL ?? "https://cleanmap-hyderabad.vercel.app"
  ),
  title: {
    default: "CleanMap Hyderabad",
    template: "%s — CleanMap Hyderabad"
  },
  description: "Report garbage. Track cleanups. Prove Hyderabad cares.",
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
