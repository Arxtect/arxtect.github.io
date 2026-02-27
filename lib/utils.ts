import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export const GITHUB_REPO_URL = "https://github.com/Arxtect/StellarLatex";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function getPublicBasePath(path: string): string {
    if (process.env.NODE_ENV === 'production') {
        return (process.env.NEXT_PUBLIC_BASE_PATH || '') + path;
    } else {
        return '' + path;
    }
}
