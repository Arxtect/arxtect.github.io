"use client";

import { create } from "zustand";
import { devtools } from "zustand/middleware";

export type AppState = {
    selectedProjectPath: string;
};

export type AppActions = {
    setSelectedProjectPath: (path: string) => void;
};

export type AppStore = AppState & AppActions;

const initialState: AppState = {
    selectedProjectPath: "/examples/Basic Example.zip",
};

export const useAppStore = create<AppStore>()(
    devtools(
        (set) => ({
            ...initialState,
            setSelectedProjectPath: (path) => set({ selectedProjectPath: path }, false, "setSelectedProjectPath"),
        }),
        { name: "AppStore" },
    ),
);

export const selectSelectedProjectPath = (state: AppStore) => state.selectedProjectPath;
export const selectSetSelectedProjectPath = (state: AppStore) => state.setSelectedProjectPath;