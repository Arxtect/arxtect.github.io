"use client";

import { motion } from "framer-motion";
import ProjectSelector from "@/components/project-selector";
import DemoEditor from "@/components/demo-editor";

export default function DemoSection() {
  return (
    <section id="demo" className="relative py-24 overflow-hidden">
      {/* Section background */}
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-primary/[0.02] to-transparent" />

      <div className="relative mx-auto max-w-7xl px-6">
        {/* Section header */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.6 }}
          className="text-center mb-8"
        >
          <span className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/5 px-3 py-1 text-xs font-medium text-primary mb-4">
            Interactive Demo
          </span>
          <h2 className="text-3xl sm:text-4xl font-bold tracking-tight">
            Try It{" "}
            <span className="bg-gradient-to-r from-primary to-cyan-400 bg-clip-text text-transparent">
              Right Now
            </span>
          </h2>
          <p className="mt-3 text-muted-foreground max-w-lg mx-auto">
            A fully functional LaTeX editor running entirely in your browser.
            Select a project, hit compile, and see the PDF render in real time.
          </p>
        </motion.div>

        {/* Project selector */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-50px" }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="flex items-center justify-center gap-3 mb-4"
        >
          <p className="text-sm text-muted-foreground">Select a demo project</p>
          <div className="w-full max-w-xs">
            <ProjectSelector />
          </div>
        </motion.div>

        {/* Editor */}
        <motion.div
          initial={{ opacity: 0, y: 40, scale: 0.98 }}
          whileInView={{ opacity: 1, y: 0, scale: 1 }}
          viewport={{ once: true, margin: "-50px" }}
          transition={{ duration: 0.7, delay: 0.2 }}
          className="rounded-xl border border-border bg-card/80 backdrop-blur-sm shadow-2xl shadow-black/10 overflow-hidden"
          style={{ height: "75vh", minHeight: 500 }}
        >
          <DemoEditor />
        </motion.div>

        {/* Bottom hint */}
        <motion.p
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: 0.5 }}
          className="text-center text-xs text-muted-foreground mt-4"
        >
          Powered by StellarLaTeX WASM engine — pdftex &amp; xetex compiled to WebAssembly
        </motion.p>
      </div>
    </section>
  );
}
