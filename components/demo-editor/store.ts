"use client";

import { create } from "zustand";
import { devtools } from "zustand/middleware";

import { CompileContext } from "@/lib/compile";
import { CompileConfig, ParseResult } from "@/lib/compile/types";
import type { StoreApi } from "zustand";
import type { PDFViewerState } from "./pdf-viewer-store";

// ── File node types (replaces yjs FileNode for the demo) ──────────────────

export interface DemoTextFile {
    kind: "text";
    content: string;
}

export interface DemoAssetFile {
    kind: "asset";
    data: ArrayBuffer;
}

export type DemoFile = DemoTextFile | DemoAssetFile;

export function isTextFile(f?: DemoFile): f is DemoTextFile {
    return f?.kind === "text";
}

// ── Pending navigation (for synctex inverse sync) ─────────────────────────

export interface PendingNavigation {
    path: string;
    line: number;
    column: number;
}

// ── Store shape ────────────────────────────────────────────────────────────

export interface DemoEditorState {
    // Project files
    files: Record<string, DemoFile>;
    setFiles: (files: Record<string, DemoFile>) => void;
    updateFileContent: (path: string, content: string) => void;

    // Explorer
    selectedPath: string | undefined;
    setSelectedPath: (path: string | undefined) => void;
    expandedKeys: string[];
    setExpandedKeys: (keys: string[]) => void;

    // Compile config
    config: CompileConfig;
    setConfig: (c: Partial<CompileConfig>) => void;

    // Compile context
    compileContext: CompileContext;

    // Compile state
    compiling: boolean;
    setCompiling: (v: boolean) => void;

    // PDF
    pdfBuffer: ArrayBuffer | null;
    setPdfBuffer: (buf: ArrayBuffer | null) => void;

    // Compile log
    rawLog: string;
    setRawLog: (log: string) => void;
    parsedLog: ParseResult | null;
    setParsedLog: (parsed: ParseResult | null) => void;

    // SyncTeX navigation
    pendingNavigation: PendingNavigation | undefined;
    setPendingNavigation: (nav: PendingNavigation | undefined) => void;

    // PDF viewer store ref (for forward synctex from editor)
    pdfViewerStoreApi: StoreApi<PDFViewerState> | null;
    setPdfViewerStoreApi: (api: StoreApi<PDFViewerState> | null) => void;

    // Reset
    resetEditor: () => void;
}

export const useDemoEditorStore = create<DemoEditorState>()(
    devtools(
        (set, get) => ({
            files: {},
            setFiles: (files) => set({ files }),
            updateFileContent: (path, content) =>
                set((s) => ({
                    files: {
                        ...s.files,
                        [path]: { kind: "text", content },
                    },
                })),

            selectedPath: undefined,
            setSelectedPath: (path) => set({ selectedPath: path }),
            expandedKeys: [],
            setExpandedKeys: (keys) => set({ expandedKeys: keys }),

            config: { engineType: "pdftex", mainFile: "main.tex" },
            setConfig: (c) =>
                set((s) => ({ config: { ...s.config, ...c } })),

            compileContext: new CompileContext(),

            compiling: false,
            setCompiling: (v) => set({ compiling: v }),

            pdfBuffer: null,
            setPdfBuffer: (buf) => set({ pdfBuffer: buf }),

            rawLog: "",
            setRawLog: (log) => set({ rawLog: log }),
            parsedLog: null,
            setParsedLog: (parsed) => set({ parsedLog: parsed }),

            pendingNavigation: undefined,
            setPendingNavigation: (nav) => set({ pendingNavigation: nav }),

            pdfViewerStoreApi: null,
            setPdfViewerStoreApi: (api) => set({ pdfViewerStoreApi: api }),

            resetEditor: () => {
                const { compileContext } = get();
                compileContext.destroy();
                set({
                    files: {},
                    selectedPath: undefined,
                    expandedKeys: [],
                    compiling: false,
                    pdfBuffer: null,
                    rawLog: "",
                    parsedLog: null,
                    compileContext: new CompileContext(),
                });
            },
        }),
        { name: "DemoEditorStore" },
    ),
);
