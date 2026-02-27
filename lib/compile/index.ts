import { LatexEngine } from "./engine";
import { epsToPdf } from "./process/eps-to-pdf";
import { getPublicBasePath } from "@/lib/utils";
import {
    CompileConfig,
    CompileFileEntry,
    CompileResult,
} from "./types";

export type { CompileResult } from "./types";

/** Extract unique parent folders from a list of file paths. */
function getFoldersToCreate(paths: string[]): string[] {
    const folders = new Set<string>();
    for (const p of paths) {
        const parts = p.split("/").filter(Boolean);
        for (let i = 1; i < parts.length; i++) {
            folders.add(parts.slice(0, i).join("/"));
        }
    }
    return [...folders].sort();
}

/**
 * Convert any .eps files to PDF using Ghostscript WASM.
 * For each xyz.eps, adds a xyz-eps-converted-to.pdf entry alongside the original.
 * This matches the LaTeX epstopdf package convention.
 */
async function processEpsFiles(
    entries: CompileFileEntry[],
    updateCompilingLog?: (message: string) => void,
): Promise<CompileFileEntry[]> {
    const epsEntries = entries.filter((e) =>
        e.path.toLowerCase().endsWith(".eps"),
    );
    if (epsEntries.length === 0) return entries;

    updateCompilingLog?.(
        `Converting ${epsEntries.length} EPS file${epsEntries.length > 1 ? "s" : ""} — loading Ghostscript WASM…`,
    );

    const processedEntries: CompileFileEntry[] = [];
    let count = 0;
    for (const entry of entries) {
        processedEntries.push(entry);
        if (entry.path.toLowerCase().endsWith(".eps")) {
            count++;
            const name = entry.path.split("/").pop() ?? entry.path;
            updateCompilingLog?.(
                `Converting EPS → PDF (${count}/${epsEntries.length}): ${name}`,
            );
            const epsBuffer =
                entry.buffer instanceof Uint8Array
                    ? entry.buffer
                    : new Uint8Array(entry.buffer as ArrayBuffer);
            const pdfBuffer = await epsToPdf(epsBuffer);
            const pathWithoutExt = entry.path.slice(0, -4);
            const newPath = `${pathWithoutExt}-eps-converted-to.pdf`;
            processedEntries.push({ path: newPath, buffer: pdfBuffer.buffer });
        }
    }
    return processedEntries;
}

async function writeEntryToMemFS(
    engine: LatexEngine,
    entries: CompileFileEntry[],
) {
    const folders = getFoldersToCreate(entries.map(({ path }) => path));
    folders.forEach((folder) => engine.makeMemFSFolder(folder));
    await Promise.all(
        entries.map(async ({ path, buffer }) => {
            const data = buffer instanceof Uint8Array
                ? buffer
                : new Uint8Array(buffer as ArrayBuffer);
            engine.writeMemFSFile(path, data);
        }),
    );
}

const pdfTeXEngine = new LatexEngine(getPublicBasePath("/stellar-latex/stellarlatexpdftex.js"));
const xeTeXEngine = new LatexEngine(getPublicBasePath("/stellar-latex/stellarlatexxetex.js"));

/**
 * Simplified CompileContext for the landing-page demo.
 * No collaboration, no caching — just compile files and return a result.
 */
export class CompileContext {
    private _stopCompile: (() => void) | null = null;
    private compiledEngine: LatexEngine | null = null;
    private destroyed = false;

    destroy() {
        if (this.destroyed) return;
        this.destroyed = true;
        this.stopCompile();
    }

    async compile(
        entries: CompileFileEntry[],
        config: CompileConfig,
        updateCompilingLog?: (message: string) => void,
    ): Promise<CompileResult> {
        if (this._stopCompile) {
            throw new Error("A compile is already in progress!");
        }

        let cancelled = false;
        const { engineType, mainFile } = config;
        const engine = engineType === "pdftex" ? pdfTeXEngine : xeTeXEngine;

        const result = await new Promise<CompileResult>(
            async (resolve, reject) => {
                try {
                    if (updateCompilingLog) {
                        engine.setCompilingLogListener((entry) =>
                            updateCompilingLog(entry.message),
                        );
                    }

                    this._stopCompile = () => {
                        cancelled = true;
                        resolve({
                            result: "stopped",
                            status: 0,
                            log: "compile stopped",
                        });
                        engine.stopCompiler();
                    };

                    const engineLabel = engineType === "pdftex" ? "pdfTeX" : "XeTeX";
                    updateCompilingLog?.(`Loading ${engineLabel} engine…`);
                    await engine.loadEngine();
                    if (cancelled || this.destroyed) return;

                    engine.flushWork();
                    if (cancelled || this.destroyed) return;

                    const processedEntries = await processEpsFiles(
                        entries,
                        updateCompilingLog,
                    );
                    await writeEntryToMemFS(engine, processedEntries);
                    engine.setEngineMainFile(mainFile);
                    if (cancelled || this.destroyed) return;

                    const res = await engine.compileLaTeX();
                    resolve(res);
                    this.compiledEngine = engine;
                } catch (err) {
                    reject(err);
                }
            },
        ).finally(() => {
            this._stopCompile = null;
            engine.setCompilingLogListener(null);
        });

        return result;
    }

    stopCompile() {
        this._stopCompile?.();
    }

    // ── SyncTeX ────────────────────────────────────────────────────────────

    async synctexView(
        pdfPath: string,
        texPath: string,
        line: number,
        column: number,
    ) {
        if (!this.compiledEngine) return null;
        return this.compiledEngine.synctexView(pdfPath, texPath, line, column);
    }

    async synctexEdit(
        pdfPath: string,
        page: number,
        x: number,
        y: number,
    ) {
        if (!this.compiledEngine) return null;
        return this.compiledEngine.synctexEdit(pdfPath, page, x, y);
    }

    /** One-shot compile helper. */
    static async compileOnce(
        entries: CompileFileEntry[],
        config: CompileConfig,
        updateCompilingLog?: (message: string) => void,
    ): Promise<CompileResult> {
        const ctx = new CompileContext();
        try {
            return await ctx.compile(entries, config, updateCompilingLog);
        } finally {
            ctx.destroy();
        }
    }
}
