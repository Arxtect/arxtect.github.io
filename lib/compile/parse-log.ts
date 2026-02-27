/**
 * Minimal LaTeX log parser for the demo.
 * Extracts errors, warnings, and typesetting messages from raw log text.
 */

import { LogEntry, ParseResult } from "./types";

const ERROR_RE = /^! (.+)$/;
const WARNING_RE = /^(?:La|pdf)?TeX (?:\w+ )?[Ww]arning[^:]*:\s*(.+)$/;
const OVERFULL_RE = /^((?:Over|Under)full \\[hv]box .+)$/;
const LINE_RE = /l\.(\d+)/;
const FILE_RE = /^\(([^\s()]+\.(?:tex|sty|cls|bib|bbl|aux|toc|lof|lot))/;

export default function parseLog(rawLog: string): ParseResult {
    const lines = rawLog.split("\n");
    const errors: LogEntry[] = [];
    const warnings: LogEntry[] = [];
    const typesetting: LogEntry[] = [];

    let currentFile: string | undefined;

    for (let i = 0; i < lines.length; i++) {
        const line = lines[i];

        // Track current file
        const fileMatch = line.match(FILE_RE);
        if (fileMatch) currentFile = fileMatch[1];

        // Errors
        const errorMatch = line.match(ERROR_RE);
        if (errorMatch) {
            const entry: LogEntry = {
                level: "error",
                message: errorMatch[1],
                file: currentFile,
                raw: collectRawContext(lines, i, 5),
            };
            // Look for line number
            for (let j = i + 1; j < Math.min(i + 6, lines.length); j++) {
                const lineMatch = lines[j].match(LINE_RE);
                if (lineMatch) {
                    entry.line = lineMatch[1];
                    break;
                }
            }
            errors.push(entry);
            continue;
        }

        // Warnings
        const warnMatch = line.match(WARNING_RE);
        if (warnMatch) {
            warnings.push({
                level: "warning",
                message: warnMatch[1],
                file: currentFile,
                raw: collectRawContext(lines, i, 3),
            });
            continue;
        }

        // Overfull / underfull
        const overMatch = line.match(OVERFULL_RE);
        if (overMatch) {
            typesetting.push({
                level: "typesetting",
                message: overMatch[1],
                file: currentFile,
                raw: line,
            });
        }
    }

    return {
        all: [...errors, ...warnings, ...typesetting],
        errors,
        warnings,
        typesetting,
    };
}

function collectRawContext(
    lines: string[],
    start: number,
    count: number,
): string {
    return lines.slice(start, start + count).join("\n");
}
