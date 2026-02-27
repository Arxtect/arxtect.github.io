/**
 * Ghostscript WASM Loader
 * Dynamically loads Ghostscript WASM module in browser environment.
 * Adapted from Hawking/packages/web/lib/ghostscript-loader/index.ts
 */

import { getPublicBasePath } from "@/lib/utils";

// Types
interface GhostscriptFS {
  writeFile(filename: string, data: Uint8Array): void;
  readFile(filename: string): Uint8Array;
  unlink?(filename: string): void;
  mkdir?(path: string): void;
  rmdir?(path: string): void;
}

interface GhostscriptInstance {
  FS: GhostscriptFS;
  callMain(args: string[]): Promise<number>;
  [key: string]: unknown;
}

declare global {
  interface Window {
    __ghostscriptInstance?: GhostscriptInstance;
  }
}

// State
let ghostscriptPromise: Promise<GhostscriptInstance> | null = null;
let ghostscriptInstance: GhostscriptInstance | null = null;

// Constants
const URL_BASE = getPublicBasePath(`/static/ghostscript-wasm`);
const EVENT_NAME = "ghostscript-loaded";
const GLOBAL_KEY = "__ghostscriptInstance";

// Utilities
const isBrowser = () => typeof document !== "undefined";

const createScript = (): HTMLScriptElement => {
  const script = document.createElement("script");
  script.type = "module";
  script.innerHTML = `
    try {
      const initGhostscript = (await import('${URL_BASE}/gs.js')).default;
      
      const gs = await initGhostscript({
        locateFile: file => \`${URL_BASE}/\${file}\`
      });
      
      window.${GLOBAL_KEY} = gs;
      window.dispatchEvent(new CustomEvent('${EVENT_NAME}', { detail: gs }));
    } catch (error) {
      window.dispatchEvent(new CustomEvent('${EVENT_NAME}-error', { 
        detail: error instanceof Error ? error : new Error(String(error))
      }));
    }
  `;
  return script;
};

const cleanup = (
  loadedHandler: EventListener,
  errorHandler: EventListener,
) => {
  window.removeEventListener(EVENT_NAME, loadedHandler);
  window.removeEventListener(`${EVENT_NAME}-error`, errorHandler);
};

// Main API
export async function loadGhostscript(): Promise<GhostscriptInstance> {
  if (ghostscriptInstance) return ghostscriptInstance;
  if (ghostscriptPromise) return ghostscriptPromise;

  if (!isBrowser()) {
    throw new Error("Ghostscript loader requires browser environment");
  }

  ghostscriptPromise = new Promise((resolve, reject) => {
    const handleLoaded = (event: CustomEvent) => {
      ghostscriptInstance = event.detail as GhostscriptInstance;
      cleanup(
        handleLoaded as EventListener,
        handleScriptError as EventListener,
      );
      resolve(ghostscriptInstance);
    };

    const handleScriptError = (event: CustomEvent) => {
      ghostscriptPromise = null;
      cleanup(
        handleLoaded as EventListener,
        handleScriptError as EventListener,
      );
      const error = event.detail as Error;
      reject(error || new Error("Failed to load Ghostscript WASM module"));
    };

    const handleNetworkError = () => {
      ghostscriptPromise = null;
      cleanup(
        handleLoaded as EventListener,
        handleScriptError as EventListener,
      );
      reject(new Error("Failed to load Ghostscript script (network error)"));
    };

    const script = createScript();
    script.onerror = handleNetworkError;

    window.addEventListener(EVENT_NAME, handleLoaded as EventListener);
    window.addEventListener(
      `${EVENT_NAME}-error`,
      handleScriptError as EventListener,
    );
    document.head.appendChild(script);
  });

  return ghostscriptPromise;
}

export const getGhostscriptInstance = (): GhostscriptInstance | null =>
  ghostscriptInstance;

export const isGhostscriptLoaded = (): boolean => ghostscriptInstance !== null;

export const resetGhostscriptLoader = (): void => {
  ghostscriptPromise = null;
  ghostscriptInstance = null;

  if (isBrowser() && window[GLOBAL_KEY]) {
    delete window[GLOBAL_KEY];
  }
};
