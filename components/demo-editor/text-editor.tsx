"use client";

import Editor, { loader } from "@monaco-editor/react";
import * as monaco from "monaco-editor";
import { useEffect, useRef, useState } from "react";

import { useDemoEditorStore, isTextFile } from "./store";
import { getPublicBasePath } from "@/lib/utils";
import latexMonarch from "./latex.monarch.json";
import bibtexMonarch from "./bibtex.monarch.json";

// Configure Monaco workers — use pre-built bundle from public/static/monaco-dist/
// (same approach as Hawking: getWorkerUrl returns a public path, not an ES module)
if (typeof self !== "undefined") {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (self as any).MonacoEnvironment = {
        getWorkerUrl() {
            return getPublicBasePath("/static/monaco-dist/editor.worker.bundle.js");
        },
    };
}

loader.config({ monaco });

// Register LaTeX and BibTeX with full Monarch tokenizers (from Hawking)
loader.init().then((m) => {
    const { languages } = m;

    // LaTeX
    languages.register({ id: "latex" });
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    languages.setMonarchTokensProvider("latex", latexMonarch as any);
    languages.setLanguageConfiguration("latex", {
        comments: { lineComment: "%" },
        brackets: [
            ["{", "}"],
            ["[", "]"],
            ["(", ")"],
        ],
        autoClosingPairs: [
            { open: "{", close: "}" },
            { open: "[", close: "]" },
            { open: "(", close: ")" },
            { open: '"', close: '"' },
            { open: "$", close: "$" },
        ],
        surroundingPairs: [
            { open: "{", close: "}" },
            { open: "[", close: "]" },
            { open: "(", close: ")" },
            { open: '"', close: '"' },
            { open: "$", close: "$" },
        ],
        folding: {
            markers: {
                start: /^\\begin\b/,
                end: /^\\end\b/,
            },
        },
    });

    // BibTeX
    languages.register({ id: "bibtex" });
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    languages.setMonarchTokensProvider("bibtex", bibtexMonarch as any);
});

function getLanguage(path: string): string {
    if (path.endsWith(".bib")) return "bibtex";
    if (path.endsWith(".tex")) return "latex";
    return "plaintext";
}

export default function TextEditor() {
    const selectedPath = useDemoEditorStore((s) => s.selectedPath);
    const files = useDemoEditorStore((s) => s.files);
    const updateFileContent = useDemoEditorStore((s) => s.updateFileContent);
    const config = useDemoEditorStore((s) => s.config);
    const compileContext = useDemoEditorStore((s) => s.compileContext);
    const pendingNavigation = useDemoEditorStore((s) => s.pendingNavigation);
    const setPendingNavigation = useDemoEditorStore(
        (s) => s.setPendingNavigation,
    );

    const editorRef = useRef<monaco.editor.IStandaloneCodeEditor>(null);
    const [editor, setEditor] = useState<monaco.editor.IStandaloneCodeEditor | null>(null);

    const pdfViewerStoreApi = useDemoEditorStore((s) => s.pdfViewerStoreApi);

    const file = selectedPath ? files[selectedPath] : undefined;
    const content = file && isTextFile(file) ? file.content : undefined;
    const language = selectedPath ? getLanguage(selectedPath) : "plaintext";

    // Update editor value when switching files
    useEffect(() => {
        if (editorRef.current && content !== undefined) {
            const model = editorRef.current.getModel();
            if (model && model.getValue() !== content) {
                model.setValue(content);
            }
        }
    }, [selectedPath, content, editor]);

    // ── Handle pending navigation from inverse synctex (PDF → editor) ──
    useEffect(() => {
        if (
            editor &&
            pendingNavigation &&
            pendingNavigation.path === selectedPath
        ) {
            const { line, column } = pendingNavigation;
            editor.revealLineInCenter(line);
            editor.setPosition({
                lineNumber: line,
                column: Math.max(1, column),
            });
            editor.focus();
            setPendingNavigation(undefined);
        }
    }, [editor, pendingNavigation, selectedPath, setPendingNavigation]);

    // ── Forward synctex: editor click → scroll PDF ──
    useEffect(() => {
        if (!editor) return;

        const disposable = editor.onMouseDown(async (e) => {
            if (!e.target.position || !selectedPath) return;

            const row = e.target.position.lineNumber;
            const col = e.target.position.column;
            const pdfPath =
                "/output/" + config.mainFile.replace(/\.[^.]+$/, ".pdf");
            const texPath = "/work/" + selectedPath;

            const result = await compileContext.synctexView(
                pdfPath,
                texPath,
                row,
                col,
            );

            if (result && pdfViewerStoreApi) {
                const { scale, virtuoso } = pdfViewerStoreApi.getState();
                virtuoso?.scrollToIndex({
                    index: result.page - 1,
                    offset: (result.v - 128) * scale,
                });
            }
        });

        return () => disposable.dispose();
    }, [editor, selectedPath, config.mainFile, compileContext, pdfViewerStoreApi]);

    if (!selectedPath || content === undefined) {
        return (
            <div className="flex items-center justify-center h-full text-muted-foreground">
                Select a file to edit
            </div>
        );
    }

    return (
        <div className="flex flex-col h-full overflow-hidden">
            <div className="flex items-center bg-muted px-2 h-9 shrink-0 text-sm text-muted-foreground border-b">
                {selectedPath}
            </div>
            <div className="flex-1 h-0">
                <Editor
                    key={selectedPath}
                    defaultValue={content}
                    language={language}
                    onMount={(ed) => {
                        editorRef.current = ed;
                        setEditor(ed);
                    }}
                    onChange={(value) => {
                        if (value !== undefined && selectedPath) {
                            updateFileContent(selectedPath, value);
                        }
                    }}
                    theme="vs-dark"
                    options={{
                        wordWrap: "on",
                        minimap: { enabled: false },
                        fontSize: 14,
                        lineNumbers: "on",
                        glyphMargin: true,
                    }}
                />
            </div>
        </div>
    );
}
