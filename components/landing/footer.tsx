"use client";

import { motion } from "framer-motion";
import { getPublicBasePath, GITHUB_REPO_URL } from "@/lib/utils";

const FOOTER_LINKS = {
  Product: [
    { label: "Live Demo", href: "#demo" },
    { label: "Documentation", href: "#docs" },
    { label: "Features", href: "#features" },
  ],
  "Open Source": [
    {
      label: "GitHub Repository",
      href: GITHUB_REPO_URL,
      external: true,
    },
    {
      label: "WASM Engine Source",
      href: GITHUB_REPO_URL,
      external: true,
    },
    {
      label: "Issue Tracker",
      href: `${GITHUB_REPO_URL}/issues`,
      external: true,
    },
  ],
  Resources: [
    { label: "LaTeX Project", href: "https://www.latex-project.org/", external: true },
    { label: "CTAN", href: "https://ctan.org/", external: true },
  ],
};

export default function Footer() {
  return (
    <footer className="relative border-t border-border bg-muted/30">
      <div className="absolute inset-0 bg-[linear-gradient(rgba(128,128,128,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(128,128,128,0.02)_1px,transparent_1px)] bg-[size:48px_48px]" />

      <div className="relative mx-auto max-w-7xl px-6 py-16">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="grid grid-cols-2 md:grid-cols-4 gap-8"
        >
          {/* Brand column */}
          <div className="col-span-2 md:col-span-1">
            <div className="flex items-center gap-2 mb-4">
              <img
                src={getPublicBasePath("/icon.svg")}
                alt="StellarLaTeX"
                className="w-7 h-7"
              />
              <span className="text-sm font-bold font-mono tracking-tight">
                Stellar<span className="text-primary">LaTeX</span>
              </span>
            </div>
            <p className="text-xs text-muted-foreground leading-relaxed max-w-[200px]">
              Production-ready LaTeX compilation in the browser. Powered by WebAssembly.
            </p>
            <div className="flex items-center gap-3 mt-4">
              <a
                href={GITHUB_REPO_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="text-muted-foreground hover:text-foreground transition-colors"
                aria-label="GitHub"
              >
                <svg viewBox="0 0 16 16" className="w-4 h-4" fill="currentColor">
                  <path d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.013 8.013 0 0016 8c0-4.42-3.58-8-8-8z" />
                </svg>
              </a>
            </div>
          </div>

          {/* Link columns */}
          {Object.entries(FOOTER_LINKS).map(([heading, links]) => (
            <div key={heading}>
              <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-4">
                {heading}
              </h4>
              <ul className="space-y-2.5">
                {links.map((link) => (
                  <li key={link.label}>
                    <a
                      href={link.href}
                      {...("external" in link && link.external
                        ? { target: "_blank", rel: "noopener noreferrer" }
                        : {})}
                      className="text-xs text-muted-foreground hover:text-foreground transition-colors inline-flex items-center gap-1"
                    >
                      {link.label}
                      {"external" in link && link.external && (
                        <svg
                          className="w-3 h-3"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                          strokeWidth={2}
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
                          />
                        </svg>
                      )}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </motion.div>

        {/* Bottom bar */}
        <div className="mt-12 pt-6 border-t border-border flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-[11px] text-muted-foreground">
            &copy; {new Date().getFullYear()} StellarLaTeX. MIT License.
          </p>
          <div className="flex items-center gap-4 text-[11px] text-muted-foreground">
            <span className="inline-flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-primary" />
              Built with WebAssembly
            </span>

          </div>
        </div>
      </div>
    </footer>
  );
}
