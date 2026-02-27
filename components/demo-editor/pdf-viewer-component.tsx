import { Loader } from "lucide-react";
import { forwardRef, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Document, Page, pdfjs } from "react-pdf";
import { Components, Virtuoso, VirtuosoHandle } from "react-virtuoso";

import { usePDFViewerStore } from "./pdf-viewer-store";
import { useDemoEditorStore } from "./store";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { getPublicBasePath } from "@/lib/utils";

// ── pdfjs worker ───────────────────────────────────────────────────────────

pdfjs.GlobalWorkerOptions.workerSrc = new URL(
    "pdfjs-dist/build/pdf.worker.min.mjs",
    import.meta.url,
).toString();

/** Options for react-pdf Document — point at static assets copied from Hawking. */
const pdfjsOptions = {
    cMapUrl: getPublicBasePath("/static/pdfjs-dist/cmaps/"),
    wasmUrl: getPublicBasePath("/static/pdfjs-dist/wasm/"),
    standardFontDataUrl: getPublicBasePath("/static/pdfjs-dist/standard_fonts/"),
    cMapPacked: true,
};

// ── Sub-components ─────────────────────────────────────────────────────────

function PageLoading({ height, width }: { height: number; width: number }) {
    return (
        <div
            style={{ height, width }}
            className="flex items-center justify-center"
        >
            <Loader className="h-8 w-8 animate-spin text-primary" />
        </div>
    );
}

function NoData({ height, width }: { height: number; width: number }) {
    return (
        <div
            style={{ height, width }}
            className="flex flex-col items-center justify-center gap-3 text-muted-foreground"
        >
            <p className="text-sm text-center">
                Compile a project to see the PDF here.
            </p>
        </div>
    );
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const VirtuosoList: Components["List"] = forwardRef(function VList(props: any, ref) {
    const pdfBuffer = usePDFViewerStore((s) => s.pdfBuffer);
    const viewerH = usePDFViewerStore((s) => s.viewerHeight);
    const viewerW = usePDFViewerStore((s) => s.viewerWidth);
    const onLoadSuccess = usePDFViewerStore((s) => s.onLoadSuccess);
    const copy = useMemo(() => pdfBuffer?.slice(), [pdfBuffer]);

    return (
        <Document
            file={copy}
            onLoadSuccess={onLoadSuccess}
            className="flex-1 relative z-0"
            options={pdfjsOptions}
            loading={<PageLoading height={viewerH} width={viewerW} />}
            noData={<NoData height={viewerH} width={viewerW} />}
        >
            <div {...props} ref={ref} className="flex-1 min-h-0">
                {props.children}
            </div>
        </Document>
    );
});

// ── Main PDFViewer component ───────────────────────────────────────────────

const SCALE_STEP = 0.1;
const MIN_SCALE = 0.5;
const MAX_SCALE = 3.0;

export default function PDFViewer() {
    const containerRef = useRef<HTMLDivElement>(null);
    const viewportRef = useRef<HTMLDivElement>(null);
    const dragStateRef = useRef({ startX: 0, startY: 0 });
    const [scrollParent, setScrollParent] = useState<HTMLElement | undefined>(
        undefined,
    );

    const store = usePDFViewerStore();
    const setViewerDimensions = usePDFViewerStore(
        (s) => s.setViewerDimensions,
    );
    const setVirtuoso = usePDFViewerStore((s) => s.setVirtuoso);
    const scale = usePDFViewerStore((s) => s.scale);
    const pageSizes = usePDFViewerStore((s) => s.pageSizes);
    const setAtTop = usePDFViewerStore((s) => s.setAtTop);
    const setAtBottom = usePDFViewerStore((s) => s.setAtBottom);
    const setPageRange = usePDFViewerStore((s) => s.setPageRange);

    const config = useDemoEditorStore((s) => s.config);
    const compileContext = useDemoEditorStore((s) => s.compileContext);
    const files = useDemoEditorStore((s) => s.files);
    const setSelectedPath = useDemoEditorStore((s) => s.setSelectedPath);
    const setPendingNavigation = useDemoEditorStore(
        (s) => s.setPendingNavigation,
    );

    const virtuosoRef = useCallback(
        (v: VirtuosoHandle | null) => setVirtuoso(v),
        // eslint-disable-next-line react-hooks/exhaustive-deps
        [],
    );

    // ── Inverse synctex: click PDF → jump to source ──
    const handlePointerDown = useCallback((e: React.PointerEvent) => {
        dragStateRef.current.startX = e.clientX;
        dragStateRef.current.startY = e.clientY;
    }, []);

    const handlePointerUp = useCallback(
        async (e: React.PointerEvent<HTMLDivElement>, pageNumber: number) => {
            const dx = e.clientX - dragStateRef.current.startX;
            const dy = e.clientY - dragStateRef.current.startY;
            // Ignore drags
            if (Math.hypot(dx, dy) > 4) return;
            // Ignore text selection
            const selection = window.getSelection();
            if (selection && !selection.isCollapsed) return;

            const rect = e.currentTarget.getBoundingClientRect();
            const x = (e.clientX - rect.left) / scale;
            const y = (e.clientY - rect.top) / scale;
            const pdfPath =
                "/output/" + config.mainFile.replace(/\.[^.]+$/, ".pdf");

            try {
                const result = await compileContext.synctexEdit(
                    pdfPath,
                    pageNumber,
                    x,
                    y,
                );

                if (result) {
                    let filePath = result.file;
                    if (filePath.startsWith("/work/")) {
                        filePath = filePath.substring(6);
                    }

                    // Only navigate if the file exists in our project
                    if (files[filePath]) {
                        setSelectedPath(filePath);
                        setPendingNavigation({
                            path: filePath,
                            line: result.line,
                            column: result.column,
                        });
                    }
                }
            } catch (err) {
                console.error("synctexEdit error:", err);
            }
        },
        [scale, config.mainFile, compileContext, files, setSelectedPath, setPendingNavigation],
    );

    const handleWheel = useCallback(
        (e: WheelEvent) => {
            if (e.ctrlKey || e.metaKey) {
                e.preventDefault();
                e.stopPropagation();
                const delta = e.deltaY > 0 ? -SCALE_STEP : SCALE_STEP;
                store.setState({
                    scale: Math.max(
                        MIN_SCALE,
                        Math.min(MAX_SCALE, scale + delta),
                    ),
                });
            }
        },
        [scale, store],
    );

    useEffect(() => {
        const el = containerRef.current;
        if (!el) return;
        el.addEventListener("wheel", handleWheel, { passive: false });
        return () => el.removeEventListener("wheel", handleWheel);
    }, [handleWheel]);

    useEffect(() => {
        const el = containerRef.current;
        if (!el) return;
        const ro = new ResizeObserver((entries) => {
            const { width, height } = entries[0].contentRect;
            setViewerDimensions(width, height);
        });
        ro.observe(el);
        return () => ro.disconnect();
    }, [setViewerDimensions]);

    // Set scroll parent once viewport ref is available
    useEffect(() => {
        if (viewportRef.current) {
            setScrollParent(viewportRef.current);
        }
    }, []);

    return (
        <ScrollArea
            ref={containerRef}
            viewportRef={viewportRef}
            className="flex-1 min-h-0 h-full w-full"
        >
            <Virtuoso
                ref={virtuosoRef}
                data={pageSizes}
                itemContent={(index, [width, height]) => (
                    <div
                        style={{
                            height: height * scale + 12 * scale,
                            minWidth: width * scale,
                            paddingBottom: 12 * scale,
                        }}
                        className="flex justify-center"
                    >
                        <div
                            style={{
                                height: height * scale,
                                minWidth: width * scale,
                            }}
                        >
                            <Page
                                pageNumber={index + 1}
                                onPointerDown={handlePointerDown}
                                onPointerUp={(e) =>
                                    handlePointerUp(e, index + 1)
                                }
                                scale={scale}
                                loading={
                                    <PageLoading
                                        height={height * scale}
                                        width={width * scale}
                                    />
                                }
                            />
                        </div>
                    </div>
                )}
                components={{ List: VirtuosoList }}
                customScrollParent={scrollParent}
                rangeChanged={setPageRange}
                atBottomStateChange={setAtBottom}
                atTopStateChange={setAtTop}
            />
            <ScrollBar orientation="horizontal" thumbClassName="bg-gray-400" />
            <ScrollBar orientation="vertical" thumbClassName="bg-gray-400" />
        </ScrollArea>
    );
}
