import Image from "next/image";
import { SITE } from "@/lib/content";

const LinkedInIcon = () => (
  <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
    <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 01-2.063-2.065 2.064 2.064 0 112.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
  </svg>
);

const MailIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75"
    />
  </svg>
);

export function SiteFooter() {
  return (
    <footer>
      <div className="container">
        <div className="footer-identity">
          <Image
            src="/photo.jpg"
            alt={SITE.name}
            className="footer-headshot"
            width={64}
            height={64}
          />
          <div>
            <p className="footer-name">{SITE.name}</p>
            {/* EDIT: footer tagline */}
            <p className="footer-tagline">
              {SITE.positioning} · Builder of communities that last
            </p>
          </div>
        </div>

        <div className="footer-social">
          <a href={SITE.linkedin} target="_blank" rel="noopener noreferrer">
            <LinkedInIcon />
            LinkedIn
          </a>
          <div className="footer-divider" aria-hidden="true" />
          <a href={`mailto:${SITE.email}`}>
            <MailIcon />
            Email
          </a>
        </div>

        <p className="footer-meta">
          {SITE.name} &nbsp;·&nbsp; {new Date().getFullYear()}
        </p>
        <p className="footer-a11y">
          {/* EDIT: replace with a real accessibility statement URL */}
          <a href="/accessibility">Accessibility Statement</a>
        </p>
        <p className="footer-a11y">
          <a href={SITE.resume} download>
            Download Resume
          </a>
        </p>
      </div>
    </footer>
  );
}
