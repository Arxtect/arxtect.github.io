"use client";

import React, { useRef, useState, MouseEvent, useEffect } from "react";

interface ThreePaneLayoutProps {
    left?: React.ReactNode;
    center: React.ReactNode;
    right?: React.ReactNode;
}

export default function EditorLayout({
    left,
    center,
    right,
}: ThreePaneLayoutProps) {
    const didDrag = useRef(false);
    const containerRef = useRef<HTMLDivElement>(null);

    const [leftWidth, setLeftWidth] = useState(200);
    const [rightWidth, setRightWidth] = useState(200);

    const [leftCollapsed, setLeftCollapsed] = useState(false);
    const [rightCollapsed, setRightCollapsed] = useState(false);

    const [isDragging, setIsDragging] = useState(false);
    const [dragDirection, setDragDirection] = useState<
        "left" | "right" | null
    >(null);
    const [virtualBarPosition, setVirtualBarPosition] = useState(0);

    useEffect(() => {
        const handleResize = () => {
            const w = containerRef.current?.clientWidth;
            if (w) {
                setLeftWidth(w * 0.1);
                setRightWidth(w * 0.5);
            }
        };
        handleResize();
        window.addEventListener("resize", handleResize);
        return () => window.removeEventListener("resize", handleResize);
    }, []);

    const startResize = (e: MouseEvent, direction: "left" | "right") => {
        e.preventDefault();
        didDrag.current = false;
        const startX = e.clientX;
        const startLW = leftWidth;
        const startRW = rightWidth;
        const cw = containerRef.current?.clientWidth ?? 0;
        let curLW = startLW;
        let curRW = startRW;

        setIsDragging(true);
        setDragDirection(direction);
        setVirtualBarPosition(
            direction === "left"
                ? leftCollapsed
                    ? 0
                    : leftWidth
                : cw - (rightCollapsed ? 0 : rightWidth) - 4,
        );

        document.body.style.userSelect = "none";
        document.body.style.cursor = "col-resize";

        const onMove = (_e: Event) => {
            didDrag.current = true;
            const me = _e as unknown as MouseEvent;
            const dx = me.clientX - startX;
            if (direction === "left") {
                curLW = Math.min(
                    Math.max(100, startLW + dx),
                    cw - 100 - rightWidth - 8,
                );
                setVirtualBarPosition(curLW);
            } else {
                curRW = Math.min(
                    Math.max(100, startRW - dx),
                    cw - 100 - leftWidth - 8,
                );
                setVirtualBarPosition(cw - curRW - 4);
            }
        };

        const onUp = () => {
            window.removeEventListener("mousemove", onMove);
            window.removeEventListener("mouseup", onUp);
            document.body.style.userSelect = "";
            document.body.style.cursor = "";
            if (didDrag.current) {
                if (direction === "left") setLeftWidth(curLW);
                else setRightWidth(curRW);
            }
            setIsDragging(false);
            setDragDirection(null);
            setVirtualBarPosition(0);
            setTimeout(() => {
                didDrag.current = false;
            }, 0);
        };

        window.addEventListener("mousemove", onMove);
        window.addEventListener("mouseup", onUp);
    };

    const toggle = (side: "left" | "right") => {
        if (didDrag.current) return;
        if (side === "left") setLeftCollapsed((c) => !c);
        else setRightCollapsed((c) => !c);
    };

    return (
        <div
            ref={containerRef}
            className="flex flex-1 h-full relative overflow-hidden z-0"
        >
            {isDragging && (
                <div className="absolute inset-0 z-40 cursor-col-resize" />
            )}
            {isDragging && (
                <div
                    className="absolute top-0 bottom-0 bg-secondary opacity-50 z-50 pointer-events-none"
                    style={{ left: virtualBarPosition - 1, width: 2 }}
                />
            )}

            {/* Left */}
            {!leftCollapsed && (
                <div className="h-full overflow-hidden" style={{ width: leftWidth }}>
                    {left}
                </div>
            )}

            {/* Left splitter */}
            <div
                className={`relative cursor-col-resize transition-colors ${isDragging && dragDirection === "left" ? "bg-secondary/30" : "hover:bg-border-hover"}`}
                style={{ width: 4, zIndex: 10 }}
                onMouseDown={(e) => {
                    if ((e.target as HTMLElement).tagName === "BUTTON") return;
                    if (!leftCollapsed) startResize(e, "left");
                }}
            >
                <div
                    className="absolute inset-0 bg-muted"
                    style={{ height: 50 }}
                />
                <div
                    className="absolute inset-0 bg-border"
                    style={{ top: 50 }}
                />
                <button
                    className="absolute top-1/2 -translate-y-1/2 left-0 w-4 h-6 text-xs text-muted-foreground bg-muted hover:bg-accent border rounded"
                    onClick={(e) => {
                        e.stopPropagation();
                        toggle("left");
                    }}
                    onMouseDown={(e) => e.stopPropagation()}
                >
                    {!leftCollapsed ? "⟨" : "⟩"}
                </button>
            </div>

            {/* Center */}
            <div className="flex-1 h-full overflow-auto bg-background">
                {center}
            </div>

            {/* Right splitter */}
            <div
                className={`relative cursor-col-resize transition-colors ${isDragging && dragDirection === "right" ? "bg-secondary/30" : "hover:bg-border-hover"}`}
                style={{ width: 4 }}
                onMouseDown={(e) => {
                    if ((e.target as HTMLElement).tagName === "BUTTON") return;
                    if (!rightCollapsed) startResize(e, "right");
                }}
            >
                <div
                    className="absolute inset-0 bg-muted"
                    style={{ height: 50 }}
                />
                <div
                    className="absolute inset-0 bg-border"
                    style={{ top: 50 }}
                />
                <button
                    className="absolute top-1/2 -translate-y-1/2 right-0 w-4 h-6 text-xs text-muted-foreground bg-muted hover:bg-accent border rounded"
                    onClick={(e) => {
                        e.stopPropagation();
                        toggle("right");
                    }}
                    onMouseDown={(e) => e.stopPropagation()}
                >
                    {!rightCollapsed ? "⟩" : "⟨"}
                </button>
            </div>

            {/* Right */}
            {!rightCollapsed && (
                <div
                    className="h-full bg-muted flex flex-col"
                    style={{ width: rightWidth }}
                >
                    {right}
                </div>
            )}
        </div>
    );
}
