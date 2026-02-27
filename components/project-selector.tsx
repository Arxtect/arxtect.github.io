"use client";

import { useRef } from "react";
import { Upload } from "lucide-react";
import { toast } from "sonner";

import {
	selectSelectedProjectPath,
	selectSetSelectedProjectPath,
	useAppStore,
} from "@/app/store";
import { useAppContext } from "@/components/app-context";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import { useDemoEditorStore } from "@/components/demo-editor/store";
import { loadZipFromArrayBuffer, inferMainTexFile, detectEngineType } from "@/lib/demo/zip-loader";

function getFileName(path: string): string {
	const fileName = path.split("/").pop() ?? path;
	return fileName.replace(/\.zip$/i, "");
}

export default function ProjectSelector() {
	const { exampleProjectPaths } = useAppContext();
	const selectedProjectPath = useAppStore(selectSelectedProjectPath);
	const setSelectedProjectPath = useAppStore(selectSetSelectedProjectPath);
	const fileInputRef = useRef<HTMLInputElement>(null);

	const setFiles = useDemoEditorStore((s) => s.setFiles);
	const setSelectedPath = useDemoEditorStore((s) => s.setSelectedPath);
	const setConfig = useDemoEditorStore((s) => s.setConfig);
	const setExpandedKeys = useDemoEditorStore((s) => s.setExpandedKeys);
	const resetEditor = useDemoEditorStore((s) => s.resetEditor);

	const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
		const file = e.target.files?.[0];
		if (!file) return;

		if (!file.name.endsWith(".zip")) {
			toast.error("Please select a .zip file");
			return;
		}

		try {
			resetEditor();
			const buf = await file.arrayBuffer();
			const projectFiles = await loadZipFromArrayBuffer(buf);
			const paths = Object.keys(projectFiles);
			const mainFile = inferMainTexFile(projectFiles);
			const engineType = detectEngineType(projectFiles);

			setFiles(projectFiles);
			setSelectedPath(mainFile);
			setConfig({ mainFile, engineType });

			// Expand root-level folders
			const rootFolders = [
				...new Set(
					paths
						.filter((p) => p.includes("/"))
						.map((p) => p.split("/")[0]),
				),
			];
			setExpandedKeys(rootFolders);

			// Use a custom key so it doesn't match any example path
			setSelectedProjectPath(`__upload__:${file.name}`);
			toast.success(`Loaded "${file.name}"`);
		} catch (err) {
			toast.error("Failed to load zip: " + (err instanceof Error ? err.message : String(err)));
		}

		// Reset input so the same file can be re-uploaded
		if (fileInputRef.current) fileInputRef.current.value = "";
	};

	return (
		<div className="flex items-center gap-2 w-full">
			<Select value={selectedProjectPath} onValueChange={setSelectedProjectPath}>
				<SelectTrigger className="w-full max-w-md">
					<SelectValue placeholder="Select demo project" />
				</SelectTrigger>
				<SelectContent>
					{exampleProjectPaths.map((path) => (
						<SelectItem key={path} value={path}>
							{getFileName(path)}
						</SelectItem>
					))}
					{selectedProjectPath.startsWith("__upload__:") && (
						<SelectItem value={selectedProjectPath}>
							📁 {selectedProjectPath.replace("__upload__:", "")}
						</SelectItem>
					)}
				</SelectContent>
			</Select>

			<input
				ref={fileInputRef}
				type="file"
				accept=".zip"
				className="hidden"
				onChange={handleFileUpload}
			/>
			<button
				onClick={() => fileInputRef.current?.click()}
				className="shrink-0 inline-flex items-center gap-1.5 rounded-md border border-border bg-background px-3 py-2 text-sm font-medium hover:bg-muted transition-colors"
				title="Import your project (.zip)"
			>
				<Upload size={14} />
				<span className="hidden sm:inline">Import your project</span>
			</button>
		</div>
	);
}
