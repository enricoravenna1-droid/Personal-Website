import type { Metadata } from "next";
import { Fraunces, Manrope } from "next/font/google";
import { SmoothScroll } from "@/components/smooth-scroll";
import { UtilityBanner } from "@/components/utility-banner";
import { SiteNav } from "@/components/site-nav";
import { SiteFooter } from "@/components/site-footer";
import { ProgressBar } from "@/components/progress-bar";
import { Enhancements } from "@/components/enhancements";
import { SITE } from "@/lib/content";
import "./globals.css";

/**
 * Self-hosted through next/font rather than the two <link> tags the old
 * single-file build used. Google Fonts over a <link> is two extra
 * connections and a render-blocking stylesheet on the critical path;
 * next/font inlines the @font-face and serves the files from our own origin.
 */
const fraunces = Fraunces({
  subsets: ["latin"],
  style: ["normal", "italic"],
  weight: ["300", "600", "700"],
  variable: "--font-fraunces",
  display: "swap",
});

const manrope = Manrope({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
  variable: "--font-manrope",
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
    /**
     * A purpose-built 1200x630 card, not the portrait. `summary_large_image`
     * promises a landscape crop, and photo.jpg is 733x1100 — LinkedIn and
     * Instagram cropped it to a band across his chest. Rebuild with
     * `python3 tools/build_og_card.py` after editing tools/og-card.html.
     */
    images: [
      { url: "/og.jpg", width: 1200, height: 630, alt: `${SITE.name} — ${SITE.positioning}` },
    ],
  },
  twitter: { card: "summary_large_image", images: ["/og.jpg"] },
};

export const viewport = {
  themeColor: "#08090C",
  colorScheme: "dark" as const,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${fraunces.variable} ${manrope.variable}`} suppressHydrationWarning>
      <body>
        <a href="#main" className="skip-link">
          Skip to content
        </a>
        <ProgressBar />
        <Enhancements />
        <UtilityBanner />
        <SiteNav />
        <SmoothScroll>
          <main id="main">{children}</main>
        </SmoothScroll>
        <SiteFooter />
        <a
          href={`https://wa.me/${SITE.whatsapp}`}
          target="_blank"
          rel="noopener noreferrer"
          className="fab-whatsapp"
          aria-label="Chat on WhatsApp"
        >
          <svg viewBox="0 0 24 24" fill="white" aria-hidden="true">
            <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z" />
          </svg>
        </a>
      </body>
    </html>
  );
}
