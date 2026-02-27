"use client";

import { createContext, ReactNode, useContext } from "react";

export interface IAppContext {
    exampleProjectPaths: string[];
}

const AppContext = createContext<IAppContext | undefined>(undefined);

interface AppContextProviderProps {
    children: ReactNode;
    value: IAppContext;
}

export function AppContextProvider({ children, value }: AppContextProviderProps) {
    return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useAppContext(): IAppContext {
    const context = useContext(AppContext);

    if (!context) {
        throw new Error("useAppContext must be used within an AppContextProvider");
    }

    return context;
}