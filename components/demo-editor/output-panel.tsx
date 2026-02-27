"use client";

import { useEffect, useMemo, useState } from "react";
import { Download, FileText, FileWarning } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import CompileButton from "./compile-button";
import PDFViewer, { PDFViewerProvider, createPDFViewerStore } from "./pdf-viewer";
import FormattedCompileLog from "./formatted-compile-log";
import { useDemoEditorStore, isTextFile } from "./store";
import type { CompileFileEntry } from "@/lib/compile/types";
import parseLog from "@/lib/compile/parse-log";

type Tab = "pdf" | "log";

export default function OutputPanel() {
    const [activeTab, setActiveTab] = useState<Tab>("pdf");
    const pdfViewerStore = useMemo(() => createPDFViewerStore(), []);
    const setPdfViewerStoreApi = useDemoEditorStore(
        (s) => s.setPdfViewerStoreApi,
    );

    // Register the pdf viewer store API so TextEditor can use it for forward synctex
    useEffect(() => {
        setPdfViewerStoreApi(pdfViewerStore);
        return () => setPdfViewerStoreApi(null);
    }, [pdfViewerStore, setPdfViewerStoreApi]);

    const files = useDemoEditorStore((s) => s.files);
    const config = useDemoEditorStore((s) => s.config);
    const compiling = useDemoEditorStore((s) => s.compiling);
    const pdfBuffer = useDemoEditorStore((s) => s.pdfBuffer);
    const rawLog = useDemoEditorStore((s) => s.rawLog);
    const parsedLog = useDemoEditorStore((s) => s.parsedLog);
    const setCompiling = useDemoEditorStore((s) => s.setCompiling);
    const setPdfBuffer = useDemoEditorStore((s) => s.setPdfBuffer);
    const setRawLog = useDemoEditorStore((s) => s.setRawLog);
    const setParsedLog = useDemoEditorStore((s) => s.setParsedLog);
    const setConfig = useDemoEditorStore((s) => s.setConfig);
    const compileContext = useDemoEditorStore((s) => s.compileContext);

    const handleCompile = async () => {
        setCompiling(true);
        setRawLog("");
        setParsedLog(null);
        const toastId = "compiling-toast";

        try {
            // Collect files into CompileFileEntry[]
            const entries: CompileFileEntry[] = Object.entries(files).map(
                ([path, file]) => ({
                    path,
                    buffer: isTextFile(file)
                        ? new TextEncoder().encode(file.content)
                        : file.data,
                }),
            );

            const result = await compileContext.compile(
                entries,
                config,
                (log) => {
                    setRawLog(log);
                    const message = log?.trim();
                    if (message) {
                        toast.loading(message, { id: toastId });
                    }
                },
            );

            const hasPdf = Boolean(result.pdf);
            const isCompileError = result.status !== 0 || result.result === "error";

            if (hasPdf && result.pdf) {
                // .slice() to get an exact-sized copy (Uint8Array.buffer may be larger)
                setPdfBuffer(result.pdf.slice().buffer as ArrayBuffer);
                setActiveTab("pdf");
            }
            if (result.log) {
                setRawLog(result.log);
                setParsedLog(parseLog(result.log));
            }

            // Some successful compiles may not emit a new PDF blob (for example: no-change/skip paths).
            // In that case, keep showing the existing PDF instead of switching users to the log tab.
            if (!hasPdf && isCompileError && result.log) {
                setActiveTab("log");
            } else if (!hasPdf && !isCompileError && pdfBuffer) {
                setActiveTab("pdf");
            }
        } catch (err) {
            console.error("Compile failed", err);
            const msg =
                err instanceof Error ? err.message : "Unknown compile error";
            setRawLog(msg);
        } finally {
            setCompiling(false);
            toast.dismiss(toastId);
        }
    };

    const handleStopCompile = () => {
        compileContext?.stopCompile();
        setCompiling(false);
    };

    const handleDownloadPdf = () => {
        if (!pdfBuffer) return;
        const blob = new Blob([pdfBuffer], { type: "application/pdf" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = "output.pdf";
        a.click();
        URL.revokeObjectURL(url);
    };

    const errorCount = parsedLog?.errors.length ?? 0;
    const warnCount = parsedLog?.warnings.length ?? 0;

    // Push pdfBuffer into PDFViewer store
    useEffect(() => {
        if (pdfBuffer) {
            pdfViewerStore.getState().setPDFBuffer(pdfBuffer);
        }
    }, [pdfBuffer, pdfViewerStore]);

    return (
        <div className="flex flex-col h-full">
            {/* Toolbar */}
            <div className="flex items-center gap-2 px-2 bg-muted border-b h-9 shrink-0">
                <CompileButton
                    compiling={compiling}
                    engineType={config.engineType}
                    onCompile={handleCompile}
                    onStopCompile={handleStopCompile}
                    onEngineChange={(eng) =>
                        setConfig({ ...config, engineType: eng })
                    }
                />
                <div className="flex-1" />
                <div className="flex items-center gap-1 text-xs">
                    <button
                        className={`flex items-center gap-1 px-2 py-1 rounded ${activeTab === "pdf" ? "bg-accent font-medium" : "hover:bg-accent/50"}`}
                        onClick={() => setActiveTab("pdf")}
                    >
                        <FileText size={14} />
                        PDF
                    </button>
                    <button
                        className={`flex items-center gap-1 px-2 py-1 rounded ${activeTab === "log" ? "bg-accent font-medium" : "hover:bg-accent/50"}`}
                        onClick={() => setActiveTab("log")}
                    >
                        <FileWarning size={14} />
                        Log
                        {errorCount > 0 && (
                            <span className="bg-destructive text-destructive-foreground text-[10px] px-1 rounded-full">
                                {errorCount}
                            </span>
                        )}
                        {warnCount > 0 && errorCount === 0 && (
                            <span className="bg-yellow-500 text-white text-[10px] px-1 rounded-full">
                                {warnCount}
                            </span>
                        )}
                    </button>
                </div>
                {pdfBuffer && (
                    <Button
                        size="sm"
                        variant="ghost"
                        onClick={handleDownloadPdf}
                    >
                        <Download size={14} />
                    </Button>
                )}
            </div>

            {/* Content */}
            <div className="flex-1 flex flex-col min-h-0 overflow-hidden">
                {activeTab === "pdf" ? (
                    <PDFViewerProvider store={pdfViewerStore}>
                        <PDFViewer />
                    </PDFViewerProvider>
                ) : (
                    <FormattedCompileLog
                        parseResult={parsedLog}
                        rawLog={rawLog}
                    />
                )}
            </div>
        </div>
    );
}
