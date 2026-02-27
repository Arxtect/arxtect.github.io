import { loadGhostscript } from "@/lib/ghostscript-loader";

export async function epsToPdf(buffer: Uint8Array): Promise<Uint8Array> {
  const gs = await loadGhostscript();
  // Write into the WASM FS
  gs.FS.writeFile("in.eps", buffer);

  // Run Ghostscript: EPS → PDF
  await gs.callMain([
    "-sDEVICE=pdfwrite",
    "-dCompatibilityLevel=1.4",
    "-dPDFSETTINGS=/printer",
    "-dNOPAUSE",
    "-dQUIET",
    "-dBATCH",
    "-dEPSCrop",
    "-sOutputFile=out.pdf",
    "in.eps",
  ]);

  // Read back the converted PDF
  const out = gs.FS.readFile("out.pdf");
  return out;
}
