import { JSX } from "react";

// ── Compile types ──────────────────────────────────────────────────────────

export interface CompileFileEntry {
    path: string;
    buffer: ArrayBufferLike | Uint8Array;
}

export interface CompileConfig {
    engineType: "pdftex" | "xetex";
    mainFile: string;
}

export interface CompileResult {
    result: string;
    status: number;
    log: string;
    pdf?: Uint8Array;
    synctex?: Uint8Array;
}

// ── Engine types ───────────────────────────────────────────────────────────

export enum EngineStatus {
    Init = 1,
    Ready = 2,
    Busy = 3,
    Error = 4,
}

export interface WorkerMessage {
    cmd: string;
    result?: string;
    log?: string;
    status?: number;
    pdf?: ArrayBuffer;
    synctex?: ArrayBuffer;
    url?: string;
    src?: string;
    level?: string;
    message?: string;
    page?: number;
    x?: number;
    y?: number;
    h?: number;
    v?: number;
    W?: number;
    H?: number;
    file?: string;
    line?: number;
    column?: number;
}

// ── Log parser types ───────────────────────────────────────────────────────

export interface LogEntry {
    level: "info" | "warning" | "error" | "typesetting";
    message: string;
    content?: string;
    ruleId?: string;
    contentDetails?: string[];
    suppressed?: boolean;
    file?: string;
    line?: string;
    raw?: string;
}

export interface ParseResult {
    all: LogEntry[];
    errors: LogEntry[];
    warnings: LogEntry[];
    typesetting: LogEntry[];
}

export interface Rule {
    ruleId: string;
    regexToMatch: RegExp;
    newMessage?: string;
    contentRegex?: RegExp;
    improvedTitle?: (
        currentTitle: string | JSX.Element,
        details?: string[],
    ) => [string, JSX.Element] | string | JSX.Element;
    cascadesFrom?: string[];
    types?: string[];
}
