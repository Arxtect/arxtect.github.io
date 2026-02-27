# StellarLatexLanding

Landing page and interactive LaTeX demo editor for Stellar LaTeX.

## Tech Stack

- Next.js 16 (App Router)
- React 19 + TypeScript
- Tailwind CSS 4 + shadcn/ui
- Monaco Editor
- react-pdf + pdfjs-dist
- Zustand

## Requirements

- Node.js 20+
- npm 10+

## Local Development

```bash
npm install
npm run dev
```

Open `http://localhost:3000`.

## Scripts

- `npm run dev` - start dev server
- `npm run build` - production build
- `npm run start` - run production server
- `npm run lint` - run ESLint

## Project Structure

```text
app/
  layout.tsx
  page.tsx
  store.ts

components/
  app-context.tsx
  project-selector.tsx
  demo-editor/
    index.tsx
    store.ts
    editor-layout.tsx
    file-explorer.tsx
    text-editor.tsx
    output-panel.tsx
    compile-button.tsx
    pdf-viewer.tsx
    pdf-viewer-component.tsx
    pdf-viewer-store.tsx

lib/
  compile/
  demo/zip-loader.ts
  ghostscript-loader/

public/
  examples/
  stellar-latex/
  static/
```

## How the Demo Works

1. A sample project zip from `public/examples/` is loaded.
2. Files are written into the WASM engine memory filesystem.
3. Compile runs in a web worker (`pdftex` or `xetex`).
4. PDF output is rendered with `react-pdf`.
5. SyncTeX supports source-to-PDF and PDF-to-source navigation.

## Important Notes

- Keep `react-pdf` and `pdfjs-dist` versions aligned.
- `react-pdf` must stay client-only (`next/dynamic({ ssr: false })`).
- Keep compile context alive for SyncTeX; destroying it breaks navigation.
- WASM engine assets must exist in `public/stellar-latex/`.
- Monaco worker bundle must exist in `public/static/monaco-dist/`.

## Reference Implementation

`../Hawking/packages/web` is the full editor implementation and should be used as the behavior reference for landing demo features.
