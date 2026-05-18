import { ReactNode } from "react";
import { Metadata } from "next";
import {
  defaultOpenGraph,
  defaultTwitter,
  metaDesc,
  metaTitle,
} from "@/consts";
import { cn, interFont, frauncesFont, monoFont } from "@/lib/utils";
import { APP_ENV, SITE_URL } from "@/config";
import "@/app/globals.css";

export const metadata: Metadata = {
  title: {
    template: `%s | ${metaTitle}`,
    default: metaTitle,
  },
  description: metaDesc,
  keywords: [
    "IPA pronunciation",
    "phonetic alphabet",
    "English pronunciation",
    "browser extension",
    "language learning",
    "pronunciation tool",
  ],
  formatDetection: { telephone: false },
  metadataBase: new URL(SITE_URL),
  openGraph: {
    ...defaultOpenGraph,
    title: metaTitle,
    description: metaDesc,
    url: SITE_URL,
  },
  twitter: {
    ...defaultTwitter,
    title: metaTitle,
    description: metaDesc,
  },
  robots: {
    index: APP_ENV === "production",
    follow: APP_ENV === "production",
    "max-image-preview": "large",
    "max-video-preview": -1,
    "max-snippet": -1,
    googleBot: {
      index: APP_ENV === "production",
      follow: APP_ENV === "production",
      "max-image-preview": "large",
      "max-video-preview": -1,
      "max-snippet": -1,
    },
  },
};

export const viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#FBF7EC",
};

interface RootLayoutProps {
  children: ReactNode;
}

export default function RootLayout({ children }: Readonly<RootLayoutProps>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        suppressHydrationWarning
        className={cn(
          interFont.variable,
          frauncesFont.variable,
          monoFont.variable,
          "font-sans antialiased min-h-screen",
        )}
      >
        {children}
      </body>
    </html>
  );
}
