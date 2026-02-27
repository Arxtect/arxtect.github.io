"use client";

import { createContext, ReactNode, useContext, useMemo } from "react";
import { create, StoreApi, UseBoundStore } from "zustand";
import type { VirtuosoHandle } from "react-virtuoso";

// ── PDF Viewer Store ───────────────────────────────────────────────────────

export interface PDFViewerState {
    pdfBuffer: ArrayBuffer | null;
    virtuoso: VirtuosoHandle | null;
    pagesCount: number;
    pageNumber: number;
    scale: number;
    pageSizes: Array<[number, number]>;
    viewerWidth: number;
    viewerHeight: number;
    scrolling: boolean;
    pageRange: { startIndex: number; endIndex: number };
    setPDFBuffer: (buffer: ArrayBuffer) => void;
    setVirtuoso: (v: VirtuosoHandle | null) => void;
    setViewerDimensions: (w: number, h: number) => void;
    fitToWidth: () => void;
    scaleUp: () => void;
    scaleDown: () => void;
    setScale: (s: number) => void;
    scrollToPage: (n: number) => void;
    calculatePageNumber: () => void;
    setPageRange: (r: { startIndex: number; endIndex: number }) => void;
    setAtTop: (v: boolean) => void;
    setAtBottom: (v: boolean) => void;
    atTop: boolean;
    atBottom: boolean;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    onLoadSuccess: (doc: any) => Promise<void>;
    resetPDFViewerState: () => void;
}

const initialPDFState = {
    pdfBuffer: null,
    virtuoso: null,
    pagesCount: 1,
    pageNumber: 1,
    scale: 1.0,
    pageSizes: [] as Array<[number, number]>,
    viewerWidth: 0,
    viewerHeight: 0,
    scrolling: false,
    atTop: false,
    atBottom: false,
    pageRange: { startIndex: 0, endIndex: 0 },
};

export const createPDFViewerStore = () =>
    create<PDFViewerState>()((set, get) => ({
        ...initialPDFState,
        setPDFBuffer: (buffer) => set({ pdfBuffer: buffer }),
        setVirtuoso: (v) => set({ virtuoso: v }),
        setViewerDimensions: (w, h) =>
            set({ viewerWidth: w, viewerHeight: h }),
        setAtTop: (atTop) => {
            set({ atTop });
            get().calculatePageNumber();
        },
        setAtBottom: (atBottom) => {
            set({ atBottom });
            get().calculatePageNumber();
        },
        setPageRange: (pageRange) => {
            set({ pageRange });
            get().calculatePageNumber();
        },
        fitToWidth: () => {
            const { viewerWidth, pageRange, pageSizes } = get();
            const maxW = Math.max(
                ...pageSizes
                    .slice(pageRange.startIndex, pageRange.endIndex + 1)
                    .map(([w]) => w),
                0,
            );
            set({
                scale: maxW > 0 && viewerWidth > 0 ? viewerWidth / maxW : 1,
            });
        },
        scaleUp: () => set({ scale: Math.min(get().scale + 0.1, 3.0) }),
        scaleDown: () => set({ scale: Math.max(get().scale - 0.1, 0.5) }),
        setScale: (s) => set({ scale: Math.min(Math.max(s, 0.5), 3.0) }),
        scrollToPage: (_n) => {
            const { pageSizes, pageNumber, virtuoso } = get();
            if (!virtuoso) return;
            const index = Math.min(Math.max(_n - 1, 0), pageSizes.length - 1);
            const behavior =
                Math.abs(index + 1 - pageNumber) < 5 ? "smooth" : "auto";
            set({ scrolling: true });
            virtuoso.scrollIntoView({
                index,
                behavior,
                align: "start",
                done: () => set({ scrolling: false }),
            });
            set({ pageNumber: index + 1 });
        },
        calculatePageNumber: () => {
            const { atBottom, atTop, pageRange, pagesCount, scrolling } =
                get();
            if (scrolling) return;
            if (atBottom) set({ pageNumber: pagesCount });
            else if (atTop) set({ pageNumber: 1 });
            else if (pageRange.startIndex !== pageRange.endIndex)
                set({
                    pageNumber:
                        Math.floor(
                            (pageRange.startIndex + pageRange.endIndex) / 2,
                        ) + 1,
                });
            else set({ pageNumber: pageRange.startIndex + 1 });
        },
        onLoadSuccess: async (doc) => {
            const sizes: Array<[number, number]> = [];
            for (let i = 1; i <= doc.numPages; i++) {
                const page = await doc.getPage(i);
                const vp = page.getViewport({ scale: 1 });
                sizes.push([vp.width, vp.height]);
                page.cleanup();
            }
            set({ pagesCount: doc.numPages, pageSizes: sizes });
            get().fitToWidth();
        },
        resetPDFViewerState: () => set({ ...initialPDFState }),
    }));

// ── React context for the store ────────────────────────────────────────────

const PDFViewerCtx = createContext<
    UseBoundStore<StoreApi<PDFViewerState>> | undefined
>(undefined);

export function PDFViewerProvider({
    children,
    store,
}: {
    children: ReactNode;
    store?: UseBoundStore<StoreApi<PDFViewerState>>;
}) {
    const useStore = useMemo(() => store ?? createPDFViewerStore(), [store]);
    return (
        <PDFViewerCtx.Provider value={useStore}>
            {children}
        </PDFViewerCtx.Provider>
    );
}

export function usePDFViewerStore(): UseBoundStore<StoreApi<PDFViewerState>>;
export function usePDFViewerStore<U>(
    selector: (s: PDFViewerState) => U,
): U;
export function usePDFViewerStore<U>(
    selector?: (s: PDFViewerState) => U,
): U | UseBoundStore<StoreApi<PDFViewerState>> {
    const useStore = useContext(PDFViewerCtx);
    if (!useStore)
        throw new Error(
            "usePDFViewerStore must be used within a PDFViewerProvider",
        );

    // eslint-disable-next-line react-hooks/rules-of-hooks
    return selector ? useStore(selector) : useStore;
}
