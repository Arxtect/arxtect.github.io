"use client";

import { motion } from "framer-motion";
import { useState } from "react";

const TABS = ["Quick Start", "Engine API", "SyncTeX", "Configuration"] as const;
type Tab = (typeof TABS)[number];

const CODE: Record<Tab, { filename: string; language: string; code: string }> = {
  "Quick Start": {
    filename: "install.sh",
    language: "bash",
    code: `# Download the latest release from GitHub
# https://github.com/Arxtect/StellarLatex/releases

# The release ships two WASM engines:
#   stellarlatexpdftex.js  + stellarlatexpdftex.wasm
#   stellarlatexxetex.js   + stellarlatexxetex.wasm
#
# Download and copy the .js and .wasm files to your public/ directory

mkdir -p public/stellar-latex/
# Extract the release archive into your project
cp stellar-latex-release/*.js   public/stellar-latex/
cp stellar-latex-release/*.wasm public/stellar-latex/`,
  },
  "Engine API": {
    filename: "compile.ts",
    language: "typescript",
    code: `import { LatexEngine } from "stellar-latex";

// 1. Create an engine instance (pdftex or xetex)
const engine = new LatexEngine();
await engine.loadEngine("/stellar-latex/stellarlatexpdftex.js");

// 2. Write source files into the in-memory filesystem
engine.writeMemFSFile("main.tex", texSourceString);
engine.writeMemFSFile("refs.bib", bibSourceString);

// 3. Set the main file and compile
engine.setEngineMainFile("main.tex");
const result = await engine.compileLaTeX();

// result.pdf   → Uint8Array (the compiled PDF)
// result.log   → string     (full LaTeX log output)
// result.status → "success" | "error"

// 4. Display the PDF
const blob = new Blob([result.pdf], { type: "application/pdf" });
const url  = URL.createObjectURL(blob);`,
  },
  SyncTeX: {
    filename: "synctex.ts",
    language: "typescript",
    code: `import { LatexEngine } from "stellar-latex";

// After a successful compile, the engine keeps
// the SyncTeX data in memory for fast lookups.

// Forward sync: source → PDF position
// "When I click line 42 in main.tex, where is that in the PDF?"
const pdfPos = await engine.synctexView({
  texFile: "/work/main.tex",
  line: 42,
  column: 0,
  pdfFile: "/output/main.pdf",
});
// → { page: 1, x: 72.0, y: 650.3, h: 12.0, v: 650.3 }

// Inverse sync: PDF → source position
// "When I click coordinates (x, y) on page 1, what source line is that?"
const srcPos = await engine.synctexEdit({
  pdfFile: "/output/main.pdf",
  page: 1,
  x: 200,
  y: 400,
});
// → { texFile: "main.tex", line: 42, column: 0 }`,
  },
  Configuration: {
    filename: "config.ts",
    language: "typescript",
    code: `// Engine configuration options
const engine = new LatexEngine();

// Choose engine variant:
//   "stellarlatexpdftex"  — pdfTeX (fast, standard LaTeX)
//   "stellarlatexxetex"   — XeTeX  (Unicode, system fonts)
await engine.loadEngine("/stellar-latex/stellarlatexpdftex.js");

// Write binary assets (images, fonts)
const imageBytes = await fetch("/figures/diagram.png")
  .then(r => r.arrayBuffer())
  .then(b => new Uint8Array(b));
engine.writeMemFSFile("diagram.png", imageBytes);

// Compile with options
engine.setEngineMainFile("main.tex");
const result = await engine.compileLaTeX();

// The engine persists between compilations.
// Subsequent compiles reuse cached .aux, .toc, etc.
// This makes incremental builds significantly faster.

// Clean up when done
engine.closeWorker();`,
  },
};

function CodeBlock({ code, filename }: { code: string; filename: string }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="rounded-lg border border-border bg-[#0d1117] overflow-hidden">
      {/* Title bar */}
      <div className="flex items-center justify-between px-4 py-2 border-b border-white/5 bg-white/[0.02]">
        <div className="flex items-center gap-2">
          <div className="flex gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-red-500/60" />
            <span className="w-2.5 h-2.5 rounded-full bg-yellow-500/60" />
            <span className="w-2.5 h-2.5 rounded-full bg-green-500/60" />
          </div>
          <span className="text-xs text-muted-foreground font-mono ml-2">
            {filename}
          </span>
        </div>
        <button
          onClick={handleCopy}
          className="text-xs text-muted-foreground hover:text-foreground transition-colors font-mono"
        >
          {copied ? "copied!" : "copy"}
        </button>
      </div>
      {/* Code */}
      <pre className="p-4 overflow-x-auto text-sm leading-relaxed">
        <code className="text-primary/90 font-mono whitespace-pre">
          {code}
        </code>
      </pre>
    </div>
  );
}

export default function DocsSection() {
  const [activeTab, setActiveTab] = useState<Tab>("Quick Start");

  return (
    <section id="docs" className="relative py-24">
      <div className="absolute inset-0 bg-[linear-gradient(rgba(128,128,128,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(128,128,128,0.02)_1px,transparent_1px)] bg-[size:48px_48px]" />

      <div className="relative mx-auto max-w-5xl px-6">
        {/* Section header */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.6 }}
          className="text-center mb-12"
        >
          <span className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/5 px-3 py-1 text-xs font-medium text-primary mb-4">
            Documentation
          </span>
          <h2 className="text-3xl sm:text-4xl font-bold tracking-tight">
            Get Started in{" "}
            <span className="bg-gradient-to-r from-primary to-cyan-400 bg-clip-text text-transparent">
              Minutes
            </span>
          </h2>
          <p className="mt-3 text-muted-foreground max-w-lg mx-auto">
            Drop-in LaTeX compilation for any JavaScript application.
            Ship a complete TeX environment with just two static files.
          </p>
        </motion.div>

        {/* Tabs + code */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-50px" }}
          transition={{ duration: 0.6, delay: 0.1 }}
        >
          {/* Tab bar */}
          <div className="flex gap-1 p-1 rounded-lg border border-border bg-muted/50 mb-6 overflow-x-auto">
            {TABS.map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`relative px-4 py-2 text-sm font-medium rounded-md transition-all whitespace-nowrap ${
                  activeTab === tab
                    ? "text-foreground bg-background shadow-sm"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                {tab}
              </button>
            ))}
          </div>

          {/* Code block */}
          <CodeBlock
            code={CODE[activeTab].code}
            filename={CODE[activeTab].filename}
          />
        </motion.div>

        {/* Architecture overview */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-50px" }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="mt-16 grid grid-cols-1 md:grid-cols-3 gap-6"
        >
          {[
            {
              title: "pdftex Engine",
              desc: "Standard pdfTeX compiled to WASM. Supports LaTeX2e, BibTeX, makeindex, and all common packages. ~3 MB gzipped.",
              tag: "stellarlatexpdftex.wasm",
            },
            {
              title: "xetex Engine",
              desc: "XeTeX with HarfBuzz for full Unicode and OpenType font support. Ideal for multilingual and CJK typesetting.",
              tag: "stellarlatexxetex.wasm",
            },
            {
              title: "SyncTeX Built-in",
              desc: "Bidirectional source-PDF mapping compiled into the engine. No external tools — call synctexView() and synctexEdit() directly.",
              tag: "synctex_parser.c",
            },
          ].map((item) => (
            <div
              key={item.title}
              className="rounded-lg border border-border bg-card/50 p-6 hover:border-primary/30 transition-colors"
            >
              <code className="text-[10px] text-primary font-mono bg-primary/10 px-2 py-0.5 rounded">
                {item.tag}
              </code>
              <h3 className="mt-3 text-sm font-semibold">{item.title}</h3>
              <p className="mt-2 text-xs text-muted-foreground leading-relaxed">
                {item.desc}
              </p>
            </div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}
