"use client";

import { motion, useScroll, useTransform } from "framer-motion";
import { useRef } from "react";
import {
  Zap,
  Globe,
  Server,
  HardDrive,
  ArrowLeftRight,
  Type,
  FolderTree,
  Wifi,
} from "lucide-react";
import { Button } from "../ui/button";
import { toast } from "sonner";

const FEATURES = [
  {
    icon: Zap,
    title: "20% Faster Compilation",
    description:
      "Optimized WebAssembly binary delivers compilation speeds up to 20% faster than local TeX Live and Overleaf across academic papers and complex projects.",
    accent: "from-amber-400 to-orange-500",
  },
  {
    icon: Globe,
    title: "Zero Installation",
    description:
      "No 15 GB TeX Live download. No PATH configuration. Open a browser tab and start compiling instantly — works on any device with a modern browser.",
    accent: "from-emerald-400 to-cyan-500",
  },
  {
    icon: Server,
    title: "Zero Server Compute",
    description:
      "Compilation runs entirely in the browser via WASM. Eliminate server-side TeX workers, reduce infrastructure cost, and scale to unlimited concurrent users at near-zero marginal cost.",
    accent: "from-violet-400 to-purple-500",
  },
  {
    icon: HardDrive,
    title: "Minimal Storage Footprint",
    description:
      "A full TeX Live installation requires 15 GB+. Our engine ships only the packages each document actually uses — typically under 10 MB — loaded on demand over the network.",
    accent: "from-blue-400 to-indigo-500",
  },
  {
    icon: ArrowLeftRight,
    title: "Bidirectional SyncTeX",
    description:
      "Click a line in the editor to jump to the corresponding position in the PDF, and vice versa. Powered by compiled-in SyncTeX with sub-second latency.",
    accent: "from-pink-400 to-rose-500",
  },
  {
    icon: Type,
    title: "Broad Font Support",
    description:
      "Ship with CJK fonts, Microsoft-compatible fonts, and common academic typefaces out of the box — no manual font uploads required.",
    accent: "from-teal-400 to-emerald-500",
  },
  {
    icon: FolderTree,
    title: "Smart File Resolution",
    description:
      "Intelligent file-tree search automatically resolves includes and inputs even when authors don't follow standard directory conventions.",
    accent: "from-orange-400 to-red-500",
  },
  {
    icon: Wifi,
    title: "Local-First, No Latency",
    description:
      "Source files stay in the browser. No round-trip to a remote server for each keystroke or compile. Offline-capable once assets are cached.",
    accent: "from-cyan-400 to-blue-500",
  },
];

const containerVariants = {
  hidden: {},
  visible: {
    transition: { staggerChildren: 0.08 },
  },
};

const cardVariants = {
  hidden: { opacity: 0, y: 40 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.5, ease: "easeOut" as const },
  },
};

export default function HeroSection() {
  const sectionRef = useRef<HTMLElement>(null);
  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ["start end", "end start"],
  });
  const bgY = useTransform(scrollYProgress, [0, 1], ["0%", "30%"]);

  return (
    <section
      ref={sectionRef}
      className="relative min-h-screen pt-32 pb-24 overflow-hidden"
    >
      {/* Animated grid background */}
      <motion.div
        style={{ y: bgY }}
        className="pointer-events-none absolute inset-0"
      >
        <div className="absolute inset-0 bg-[linear-gradient(rgba(128,128,128,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(128,128,128,0.03)_1px,transparent_1px)] bg-[size:64px_64px]" />
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[600px] h-[600px] rounded-full bg-primary/5 blur-[120px]" />
      </motion.div>

      <div className="relative mx-auto max-w-7xl px-6">
        {/* Hero headline */}
        <div className="text-center max-w-3xl mx-auto mb-24">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
          >
            <span className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/5 px-4 py-1.5 text-xs font-medium text-primary mb-6">
              <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
              WebAssembly-Powered LaTeX Engine
            </span>
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.3 }}
            className="text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight leading-tight"
          >
            Compile LaTeX{" "}
            <span className="bg-gradient-to-r from-primary to-cyan-400 bg-clip-text text-transparent">
              in the Browser
            </span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.5 }}
            className="mt-6 text-lg text-muted-foreground max-w-2xl mx-auto leading-relaxed"
          >
            A production-ready LaTeX engine compiled to WebAssembly. No compile
            server needed — everything runs client-side. Embed full{" "}
            <code className="text-sm bg-muted px-1.5 py-0.5 rounded font-mono">
              pdftex
            </code>{" "}
            and{" "}
            <code className="text-sm bg-muted px-1.5 py-0.5 rounded font-mono">
              xetex
            </code>{" "}
            compilation directly in your web application.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.7 }}
            className="mt-10 flex flex-wrap items-center justify-center gap-4"
          >
            <a
              href="#demo"
              className="inline-flex items-center gap-2 rounded-lg bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground hover:bg-primary/90 transition-colors shadow-lg shadow-primary/20"
            >
              Try Live Demo
              <svg
                className="w-4 h-4"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M19 9l-7 7-7-7"
                />
              </svg>
            </a>
            <a
              href="#docs"
              className="inline-flex items-center gap-2 rounded-lg border border-border px-6 py-3 text-sm font-semibold hover:bg-muted transition-colors"
            >
              Read the Docs
            </a>
          </motion.div>

          {/* Terminal-style install snippet */}
          {/* <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.9 }}
            className="mt-8 inline-flex items-center gap-3 rounded-lg border border-border bg-muted/50 px-5 py-3 font-mono text-sm"
          >
            <span className="text-primary">$</span>
            <span className="text-muted-foreground">
              npm install stellar-latex
            </span>
            <button
              onClick={() =>
                navigator.clipboard.writeText("npm install stellar-latex")
              }
              className="ml-2 text-muted-foreground hover:text-foreground transition-colors"
              title="Copy"
            >
              <svg
                className="w-4 h-4"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
              >
                <rect x="9" y="9" width="13" height="13" rx="2" />
                <path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1" />
              </svg>
            </button>
          </motion.div> */}
        </div>

        {/* Feature grid */}
        <motion.div
          id="features"
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-100px" }}
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4"
        >
          {FEATURES.map((feature) => (
            <motion.div
              key={feature.title}
              variants={cardVariants}
              className="group relative rounded-xl border border-border bg-card/50 backdrop-blur-sm p-6 hover:border-primary/30 transition-all duration-300"
            >
              <div
                className={`inline-flex items-center justify-center w-10 h-10 rounded-lg bg-gradient-to-br ${feature.accent} mb-4`}
              >
                <feature.icon className="w-5 h-5 text-white" />
              </div>
              <h3 className="text-sm font-semibold mb-2 tracking-tight">
                {feature.title}
              </h3>
              <p className="text-xs text-muted-foreground leading-relaxed">
                {feature.description}
              </p>
              {/* hover glow */}
              <div className="pointer-events-none absolute inset-0 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-500 bg-gradient-to-br from-primary/5 to-transparent" />
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}
