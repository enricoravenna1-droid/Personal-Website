import type { Metadata } from "next";
import { Syne, DM_Sans } from "next/font/google";
import { SmoothScroll } from "@/components/smooth-scroll";
import { SiteNav } from "@/components/site-nav";
import { SiteFooter } from "@/components/site-footer";
import { Enhancements } from "@/components/enhancements";
import { SITE } from "@/lib/content";
import "./globals.css";

/**
 * Self-hosted through next/font. Syne carries display type, DM Sans the
 * body. Both served from our own origin: no render-blocking Google Fonts
 * stylesheet on the critical path.
 */
const syne = Syne({
  subsets: ["latin"],
  weight: ["500", "600", "700", "800"],
  variable: "--font-syne",
  display: "swap",
});

const dmSans = DM_Sans({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-dm-sans",
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL(SITE.domain),
  title: {
    default: `${SITE.name} — ${SITE.positioning}`,
    template: `%s — ${SITE.name}`,
  },
  description:
    "Israeli-born nonprofit executive, IDF veteran, and community builder. Where there is a possibility, there's a responsibility.",
  openGraph: {
    type: "website",
    url: SITE.domain,
    siteName: SITE.name,
    images: [
      { url: "/og.jpg", width: 1200, height: 630, alt: `${SITE.name} — ${SITE.positioning}` },
    ],
  },
  twitter: { card: "summary_large_image", images: ["/og.jpg"] },
};

export const viewport = {
  themeColor: "#0F2E33",
  colorScheme: "dark" as const,
};

/**
 * The chrome is deliberately thin: a nav, the page, a footer. The rotating
 * banner, the reading-progress bar and the WhatsApp button were removed in
 * the 2026-10-31 rebuild. Cleaner is the brief.
 */
export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${syne.variable} ${dmSans.variable}`} suppressHydrationWarning>
      <body>
        <a href="#main" className="skip-link">
          Skip to content
        </a>
        <Enhancements />
        <SiteNav />
        <SmoothScroll>
          <main id="main">{children}</main>
        </SmoothScroll>
        <SiteFooter />
      </body>
    </html>
  );
}
