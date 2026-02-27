"use client";

import { ChevronDown, ChevronRight, AlertTriangle, XCircle, Info } from "lucide-react";
import { useState } from "react";

import type { ParseResult, LogEntry } from "@/lib/compile/types";

function getSeverityIcon(level: string) {
    switch (level) {
        case "error":
            return <XCircle size={14} className="text-destructive shrink-0" />;
        case "warning":
            return (
                <AlertTriangle
                    size={14}
                    className="text-yellow-500 shrink-0"
                />
            );
        default:
            return (
                <Info size={14} className="text-muted-foreground shrink-0" />
            );
    }
}

function LogEntryCard({ entry }: { entry: LogEntry }) {
    const [open, setOpen] = useState(false);

    return (
        <div className="border rounded px-2 py-1.5 text-xs">
            <div
                className="flex items-center gap-1.5 cursor-pointer"
                onClick={() => setOpen((o) => !o)}
            >
                {open ? (
                    <ChevronDown size={12} />
                ) : (
                    <ChevronRight size={12} />
                )}
                {getSeverityIcon(entry.level)}
                <span className="font-medium truncate flex-1">
                    {entry.message}
                </span>
                {entry.file && (
                    <span className="text-muted-foreground ml-2">
                        {entry.file}
                        {entry.line ? `:${entry.line}` : ""}
                    </span>
                )}
            </div>
            {open && entry.raw && (
                <pre className="mt-1 p-2 bg-muted rounded text-[10px] overflow-auto max-h-40 whitespace-pre-wrap">
                    {entry.raw}
                </pre>
            )}
        </div>
    );
}

interface FormattedCompileLogProps {
    parseResult: ParseResult | null;
    rawLog: string;
}

export default function FormattedCompileLog({
    parseResult,
    rawLog,
}: FormattedCompileLogProps) {
    const [showRaw, setShowRaw] = useState(false);

    if (!parseResult && !rawLog) {
        return (
            <div className="flex items-center justify-center h-full text-muted-foreground text-sm">
                No compile log yet
            </div>
        );
    }

    const errors = parseResult?.errors ?? [];
    const warnings = parseResult?.warnings ?? [];
    const typesetting = parseResult?.typesetting ?? [];

    return (
        <div className="flex flex-col h-full">
            {/* Summary header */}
            <div className="flex items-center gap-2 p-2 bg-muted text-sm">
                <span className="font-medium">Compile Log</span>
                {errors.length > 0 && (
                    <span className="text-[10px] h-5 px-1.5 rounded-full bg-destructive text-destructive-foreground inline-flex items-center">
                        {errors.length} error{errors.length > 1 ? "s" : ""}
                    </span>
                )}
                {warnings.length > 0 && (
                    <span className="text-[10px] h-5 px-1.5 rounded-full border border-yellow-500 text-yellow-600 inline-flex items-center">
                        {warnings.length} warning
                        {warnings.length > 1 ? "s" : ""}
                    </span>
                )}
                <div className="flex-1" />
                <button
                    className="text-xs text-muted-foreground hover:underline"
                    onClick={() => setShowRaw((r) => !r)}
                >
                    {showRaw ? "Formatted" : "Raw"}
                </button>
            </div>

            <div className="flex-1 overflow-auto p-2">
                {showRaw ? (
                    <pre className="text-[10px] whitespace-pre-wrap">
                        {rawLog}
                    </pre>
                ) : (
                    <div className="flex flex-col gap-1">
                        {errors.map((e, i) => (
                            <LogEntryCard key={`e-${i}`} entry={e} />
                        ))}
                        {warnings.map((w, i) => (
                            <LogEntryCard key={`w-${i}`} entry={w} />
                        ))}
                        {typesetting.map((t, i) => (
                            <LogEntryCard key={`t-${i}`} entry={t} />
                        ))}
                        {errors.length === 0 &&
                            warnings.length === 0 &&
                            typesetting.length === 0 && (
                                <div className="text-xs text-muted-foreground py-4 text-center">
                                    No issues found
                                </div>
                            )}
                    </div>
                )}
            </div>
        </div>
    );
}
