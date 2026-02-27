"use client";

import {
    ChevronDown,
    ChevronRight,
    File,
    FileDigit,
    FolderClosed,
    FolderOpen,
    Star,
} from "lucide-react";
import { useCallback, useMemo } from "react";

import { cn } from "@/lib/utils";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useDemoEditorStore, DemoFile, isTextFile } from "./store";

interface TreeNode {
    key: string;
    label: string;
    isLeaf: boolean;
    children?: TreeNode[];
}

/**
 * Build a tree structure from a flat Record<path, DemoFile>.
 */
function buildTree(files: Record<string, DemoFile>): TreeNode[] {
    interface FolderBucket {
        children: Map<string, FolderBucket>;
        file?: DemoFile;
        path: string;
    }

    const root: FolderBucket = {
        children: new Map(),
        path: "",
    };

    for (const path of Object.keys(files)) {
        const parts = path.split("/").filter(Boolean);
        let cur = root;
        for (let i = 0; i < parts.length; i++) {
            const part = parts[i];
            if (!cur.children.has(part)) {
                cur.children.set(part, {
                    children: new Map(),
                    path: parts.slice(0, i + 1).join("/"),
                });
            }
            cur = cur.children.get(part)!;
        }
        cur.file = files[path];
    }

    function toNodes(bucket: FolderBucket): TreeNode[] {
        const nodes: TreeNode[] = [];
        for (const [name, child] of bucket.children) {
            const isLeaf = child.children.size === 0 && child.file != null;
            nodes.push({
                key: child.path,
                label: name,
                isLeaf,
                children: isLeaf ? undefined : toNodes(child),
            });
        }
        // folders first, then files, alphabetically
        nodes.sort((a, b) => {
            if (!a.isLeaf && b.isLeaf) return -1;
            if (a.isLeaf && !b.isLeaf) return 1;
            return a.label.localeCompare(b.label);
        });
        return nodes;
    }

    return toNodes(root);
}

function TreeItem({
    node,
    depth,
}: {
    node: TreeNode;
    depth: number;
}) {
    const selectedPath = useDemoEditorStore((s) => s.selectedPath);
    const expandedKeys = useDemoEditorStore((s) => s.expandedKeys);
    const setSelectedPath = useDemoEditorStore((s) => s.setSelectedPath);
    const setExpandedKeys = useDemoEditorStore((s) => s.setExpandedKeys);
    const config = useDemoEditorStore((s) => s.config);
    const setConfig = useDemoEditorStore((s) => s.setConfig);
    const files = useDemoEditorStore((s) => s.files);

    const isExpanded = expandedKeys.includes(node.key);
    const isSelected = selectedPath === node.key;
    const isMainFile = config.mainFile === node.key;
    const file = files[node.key];
    const isTexFile = node.isLeaf && node.key.endsWith(".tex");

    const handleClick = () => {
        if (node.isLeaf) {
            setSelectedPath(node.key);
        } else {
            setExpandedKeys(
                isExpanded
                    ? expandedKeys.filter((k) => k !== node.key)
                    : [...expandedKeys, node.key],
            );
        }
    };

    const handleContextMenu = useCallback(
        (e: React.MouseEvent) => {
            if (!isTexFile) return;
            e.preventDefault();
            setConfig({ mainFile: node.key });
        },
        [isTexFile, node.key, setConfig],
    );

    return (
        <>
            <div
                className={cn(
                    "flex items-center gap-1 min-w-0 cursor-pointer py-0.5 px-1 rounded text-sm select-none hover:bg-accent",
                    isSelected && "bg-accent font-medium",
                )}
                style={{ paddingLeft: depth * 16 + 4 }}
                onClick={handleClick}
                onContextMenu={handleContextMenu}
                title={isTexFile ? "Right-click to set as main file" : undefined}
            >
                {node.isLeaf ? (
                    <>
                        <span className="w-4" />
                        {file && !isTextFile(file) ? (
                            <FileDigit size={14} className="shrink-0" />
                        ) : (
                            <File size={14} className="shrink-0" />
                        )}
                    </>
                ) : isExpanded ? (
                    <>
                        <ChevronDown size={14} className="shrink-0" />
                        <FolderOpen size={14} className="shrink-0" />
                    </>
                ) : (
                    <>
                        <ChevronRight size={14} className="shrink-0" />
                        <FolderClosed size={14} className="shrink-0" />
                    </>
                )}
                <span className="min-w-0 flex-1 truncate">{node.label}</span>
                {isMainFile && (
                    <Star
                        size={12}
                        className="shrink-0 fill-orange-400 text-orange-400"
                    />
                )}
            </div>
            {!node.isLeaf && isExpanded && node.children && (
                <>
                    {node.children.map((child) => (
                        <TreeItem
                            key={child.key}
                            node={child}
                            depth={depth + 1}
                        />
                    ))}
                </>
            )}
        </>
    );
}

export default function FileExplorer() {
    const files = useDemoEditorStore((s) => s.files);
    const config = useDemoEditorStore((s) => s.config);
    const tree = useMemo(() => buildTree(files), [files]);

    return (
        <div className="flex flex-col h-full overflow-hidden">
            <div className="flex items-center bg-muted w-full px-2 h-9 shrink-0 text-sm font-medium text-muted-foreground border-b">
                Explorer
            </div>
            <ScrollArea className="flex-1 min-h-0 px-1">
                <div className="grid grid-cols-1 py-1">
                    {tree.map((node) => (
                        <TreeItem key={node.key} node={node} depth={0} />
                    ))}
                </div>
            </ScrollArea>
            <div className="flex items-center gap-1 px-2 py-1 border-t text-xs text-muted-foreground truncate">
                <Star size={10} className="shrink-0 fill-orange-400 text-orange-400" />
                <span className="truncate">{config.mainFile}</span>
            </div>
        </div>
    );
}
