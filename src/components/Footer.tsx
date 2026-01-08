import type { SVGProps } from "react";

function InstagramIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true" {...props}>
      <path
        d="M7.5 2.75h9A4.75 4.75 0 0 1 21.25 7.5v9A4.75 4.75 0 0 1 16.5 21.25h-9A4.75 4.75 0 0 1 2.75 16.5v-9A4.75 4.75 0 0 1 7.5 2.75Z"
        stroke="currentColor"
        strokeWidth="1.5"
      />
      <path
        d="M12 16a4 4 0 1 0 0-8 4 4 0 0 0 0 8Z"
        stroke="currentColor"
        strokeWidth="1.5"
      />
      <path
        d="M17.25 6.75h.01"
        stroke="currentColor"
        strokeWidth="2.5"
        strokeLinecap="round"
      />
    </svg>
  );
}

function FacebookIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true" {...props}>
      <path
        d="M14 8.5h2V5.75A18 18 0 0 0 13.6 5.6c-2.4 0-4.1 1.46-4.1 4.15V12H7v3h2.5v6h3.1v-6h2.8l.5-3h-3.3V10c0-1 .33-1.5 1.4-1.5Z"
        fill="currentColor"
      />
    </svg>
  );
}

function TwitterIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true" {...props}>
      <path
        d="M18.9 2H21l-4.6 5.26L22 22h-5l-3.9-5.1L8.6 22H6.5l5-5.8L2 2h5.1l3.5 4.7L14.7 2h4.2ZM18 20.3h1.2L6.9 3.6H5.6L18 20.3Z"
        fill="currentColor"
      />
    </svg>
  );
}

export function Footer() {
  return (
    <footer className="mt-12 sm:mt-16 md:mt-20 border-t border-white/10">
      <div className="container-max py-6 sm:py-8 md:py-10 px-4">
        <div className="flex flex-col gap-6 sm:gap-8 md:flex-row md:items-start md:justify-between">
          <div>
            <div className="text-base sm:text-lg font-semibold tracking-wide">Contact</div>
            <div className="mt-2 space-y-1 text-xs sm:text-sm text-white/70">
              <div>Rajalakshmi Institute of Technology</div>
              <div>Email: yatra@ritchennai.edu.in</div>
              <div>Phone: +91 XXXXXXXXXX</div>
            </div>
          </div>

          <div>
            <div className="text-base sm:text-lg font-semibold tracking-wide">Social</div>
            <div className="mt-3 flex items-center gap-3 sm:gap-4">
              <a
                href="https://instagram.com"
                target="_blank"
                rel="noreferrer"
                className="rounded-full border border-white/10 bg-white/5 p-2 text-white/80 hover:text-white touch-manipulation"
                aria-label="Instagram"
                style={{ minWidth: "44px", minHeight: "44px", display: "flex", alignItems: "center", justifyContent: "center" }}
              >
                <InstagramIcon className="h-5 w-5" />
              </a>
              <a
                href="https://facebook.com"
                target="_blank"
                rel="noreferrer"
                className="rounded-full border border-white/10 bg-white/5 p-2 text-white/80 hover:text-white touch-manipulation"
                aria-label="Facebook"
                style={{ minWidth: "44px", minHeight: "44px", display: "flex", alignItems: "center", justifyContent: "center" }}
              >
                <FacebookIcon className="h-5 w-5" />
              </a>
              <a
                href="https://x.com"
                target="_blank"
                rel="noreferrer"
                className="rounded-full border border-white/10 bg-white/5 p-2 text-white/80 hover:text-white touch-manipulation"
                aria-label="Twitter"
                style={{ minWidth: "44px", minHeight: "44px", display: "flex", alignItems: "center", justifyContent: "center" }}
              >
                <TwitterIcon className="h-5 w-5" />
              </a>
            </div>
          </div>
        </div>

        <div className="mt-6 sm:mt-8 md:mt-10 text-xs text-white/40">
          © {new Date().getFullYear()} YATRA'26
        </div>
      </div>
    </footer>
  );
}


