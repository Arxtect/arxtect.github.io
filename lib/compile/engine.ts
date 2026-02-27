import { CompileResult, EngineStatus, WorkerMessage } from "./types";

export class LatexEngine {
    private enginePath: string;
    private compilingLogListener:
        | ((entry: { level: string; message: string }) => void)
        | null = null;

    constructor(enginePath: string) {
        this.enginePath = enginePath;
    }

    private latexWorker: Worker | undefined = undefined;
    private latexWorkerStatus: EngineStatus = EngineStatus.Init;
    private loadingEnginePromise: Promise<void> | null = null;

    async loadEngine(): Promise<void> {
        if (this.loadingEnginePromise) {
            return this.loadingEnginePromise;
        }

        this.latexWorkerStatus = EngineStatus.Init;
        this.loadingEnginePromise = new Promise<void>((resolve, reject) => {
            this.latexWorker = new Worker(this.enginePath);
            this.latexWorker.onmessage = (ev: MessageEvent<WorkerMessage>) => {
                const data = ev.data;
                if (this.handleCompilingLogMessage(data)) return;
                const cmd = data.result;
                if (cmd === "ok") {
                    this.latexWorkerStatus = EngineStatus.Ready;
                    resolve();
                } else {
                    this.latexWorkerStatus = EngineStatus.Error;
                    this.loadingEnginePromise = null;
                    reject();
                }
            };
        });

        await this.loadingEnginePromise;
        this.latexWorker!.onmessage = () => {};
        this.latexWorker!.onerror = () => {};
    }

    isReady(): boolean {
        return this.latexWorkerStatus === EngineStatus.Ready;
    }

    private checkEngineStatus(): void {
        if (!this.isReady()) {
            throw Error("Engine is still spinning or not ready yet!");
        }
    }

    async compileLaTeX(): Promise<CompileResult> {
        this.checkEngineStatus();
        this.latexWorkerStatus = EngineStatus.Busy;

        const res = await new Promise<CompileResult>((resolve) => {
            if (!this.latexWorker) return;

            this.latexWorker.onmessage = (ev: MessageEvent<WorkerMessage>) => {
                const data = ev.data;
                if (this.handleCompilingLogMessage(data)) return;
                if (data.cmd !== "compile") return;

                this.latexWorkerStatus = EngineStatus.Ready;
                resolve({
                    result: data.result ?? "error",
                    status: data.status ?? 255,
                    log: data.log ?? "No log",
                    pdf: data.pdf ? new Uint8Array(data.pdf) : undefined,
                    synctex: data.synctex
                        ? new Uint8Array(data.synctex)
                        : undefined,
                });
            };

            this.latexWorker!.postMessage({ cmd: "compilelatex" });
        });

        if (this.latexWorker) this.latexWorker.onmessage = () => {};
        return res;
    }

    stopCompiler(): void {
        if (this.latexWorkerStatus === EngineStatus.Busy) {
            this.latexWorker?.terminate();
            this.latexWorker = undefined;
            this.latexWorkerStatus = EngineStatus.Init;
            this.loadingEnginePromise = null;
        }
    }

    setEngineMainFile(filename: string): void {
        this.checkEngineStatus();
        this.latexWorker?.postMessage({ cmd: "setmainfile", url: filename });
    }

    writeMemFSFile(filename: string, srccode: string | Uint8Array): void {
        this.checkEngineStatus();
        this.latexWorker?.postMessage({
            cmd: "writefile",
            url: filename,
            src: srccode,
        });
    }

    makeMemFSFolder(folder: string): void {
        this.checkEngineStatus();
        if (folder === "" || folder === "/") return;
        this.latexWorker?.postMessage({ cmd: "mkdir", url: folder });
    }

    flushWork(): void {
        if (this.latexWorkerStatus === EngineStatus.Ready) {
            this.latexWorker?.postMessage({ cmd: "flushwork" });
        }
    }

    flushBuild(): void {
        if (this.latexWorkerStatus === EngineStatus.Ready) {
            this.latexWorker?.postMessage({ cmd: "flushbuild" });
        }
    }

    setCompilingLogListener(
        listener:
            | ((entry: { level: string; message: string }) => void)
            | null,
    ): void {
        this.compilingLogListener = listener;
    }

    private handleCompilingLogMessage(data: WorkerMessage): boolean {
        if (data.cmd !== "engine_compiling_log") return false;
        this.compilingLogListener?.({
            level: data.level ?? "info",
            message: data.message ?? "",
        });
        return true;
    }

    closeWorker(): void {
        if (this.latexWorker) {
            this.latexWorker.postMessage({ cmd: "grace" });
            this.latexWorker = undefined;
        }
    }

    // ── SyncTeX ────────────────────────────────────────────────────────────

    async synctexView(
        pdfPath: string,
        texPath: string,
        line: number,
        column: number,
    ): Promise<{
        page: number;
        x: number;
        y: number;
        h: number;
        v: number;
        W: number;
        H: number;
    } | null> {
        if (!this.isReady()) return null;

        return new Promise((resolve) => {
            if (!this.latexWorker) {
                resolve(null);
                return;
            }

            this.latexWorker.onmessage = (ev: MessageEvent<WorkerMessage>) => {
                const data = ev.data;
                if (data.cmd !== "synctex_view") return;
                if (data.result === "ok" && data.page !== undefined) {
                    resolve({
                        page: data.page,
                        x: data.x!,
                        y: data.y!,
                        h: data.h!,
                        v: data.v!,
                        W: data.W!,
                        H: data.H!,
                    });
                } else {
                    resolve(null);
                }
            };

            this.latexWorker.postMessage({
                cmd: "synctex_view",
                pdfPath,
                texPath,
                line,
                column,
            });
        });
    }

    async synctexEdit(
        pdfPath: string,
        page: number,
        x: number,
        y: number,
    ): Promise<{
        file: string;
        line: number;
        column: number;
    } | null> {
        if (!this.isReady()) return null;

        return new Promise((resolve) => {
            if (!this.latexWorker) {
                resolve(null);
                return;
            }

            this.latexWorker.onmessage = (ev: MessageEvent<WorkerMessage>) => {
                const data = ev.data;
                if (data.cmd !== "synctex_edit") return;
                if (data.result === "ok" && data.file !== undefined) {
                    resolve({
                        file: data.file,
                        line: data.line!,
                        column: data.column!,
                    });
                } else {
                    resolve(null);
                }
            };

            this.latexWorker.postMessage({
                cmd: "synctex_edit",
                pdfPath,
                page,
                x,
                y,
            });
        });
    }
}
