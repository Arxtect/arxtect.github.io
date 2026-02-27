"use client";

import dynamic from "next/dynamic";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";

import { useAppStore, selectSelectedProjectPath } from "@/app/store";
import { useDemoEditorStore } from "./store";
import { loadZipProject, inferMainTexFile, detectEngineType } from "@/lib/demo/zip-loader";
import EditorLayout from "./editor-layout";
import FileExplorer from "./file-explorer";
import OutputPanel from "./output-panel";

// Lazy-load Monaco (heavy) to avoid SSR issues
const TextEditor = dynamic(() => import("./text-editor"), { ssr: false });

export default function DemoEditor() {
    const selectedProject = useAppStore(selectSelectedProjectPath);
    const setFiles = useDemoEditorStore((s) => s.setFiles);
    const setSelectedPath = useDemoEditorStore((s) => s.setSelectedPath);
    const setExpandedKeys = useDemoEditorStore((s) => s.setExpandedKeys);
    const setConfig = useDemoEditorStore((s) => s.setConfig);
    const resetEditor = useDemoEditorStore((s) => s.resetEditor);

    const [loading, setLoading] = useState(false);
    const [downloadProgress, setDownloadProgress] = useState(0);
    const loadedRef = useRef<string | null>(null);

    // Load zip project when selection changes
    useEffect(() => {
        if (!selectedProject || selectedProject === loadedRef.current) return;

        // Skip fetch for user-uploaded projects (already loaded by ProjectSelector)
        if (selectedProject.startsWith("__upload__:")) {
            loadedRef.current = selectedProject;
            return;
        }

        let cancelled = false;
        const load = async () => {
            setLoading(true);
            setDownloadProgress(0);
            resetEditor();
            try {
                const projectFiles = await loadZipProject(
                    selectedProject,
                    (progress) => setDownloadProgress(progress),
                );
                if (cancelled) return;

                const mainFile = inferMainTexFile(projectFiles);
                const engineType = detectEngineType(projectFiles);

                setFiles(projectFiles);
                setSelectedPath(mainFile);
                setConfig({ mainFile, engineType });

                // Expand only the folders leading to the main file
                const mainParts = mainFile.split("/");
                const foldersToExpand: string[] = [];
                for (let i = 1; i < mainParts.length; i++) {
                    foldersToExpand.push(mainParts.slice(0, i).join("/"));
                }
                setExpandedKeys(foldersToExpand);

                loadedRef.current = selectedProject;
            } catch (err) {
                if (!cancelled) {
                    console.error("Failed to load project", err);
                    toast.error("Failed to load project");
                }
            } finally {
                if (!cancelled) setLoading(false);
            }
        };
        load();
        return () => {
            cancelled = true;
        };
    }, [
        selectedProject,
        resetEditor,
        setFiles,
        setSelectedPath,
        setConfig,
        setExpandedKeys,
    ]);

    if (!selectedProject) {
        return (
            <div className="flex items-center justify-center h-full text-muted-foreground">
                Select a project above to get started
            </div>
        );
    }

    if (loading) {
        return (
            <div className="flex items-center justify-center h-full text-muted-foreground">
                <div className="flex flex-col items-center gap-3 w-48">
                    <div className="h-6 w-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                    <span>Loading project...</span>
                    <div className="w-full h-1.5 rounded-full bg-muted overflow-hidden">
                        <div
                            className="h-full bg-primary rounded-full transition-all duration-200 ease-out"
                            style={{ width: `${Math.round(downloadProgress * 100)}%` }}
                        />
                    </div>
                    <span className="text-xs">{Math.round(downloadProgress * 100)}%</span>
                </div>
            </div>
        );
    }

    return (
        <EditorLayout
            left={<FileExplorer />}
            center={<TextEditor />}
            right={<OutputPanel />}
        />
    );
}
