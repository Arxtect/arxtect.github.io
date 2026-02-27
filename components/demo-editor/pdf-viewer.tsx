import "react-pdf/dist/Page/AnnotationLayer.css";
import "react-pdf/dist/Page/TextLayer.css";
import "./pdf-viewer-style.css";
import dynamic from "next/dynamic";

export * from "./pdf-viewer-store";

export const PDFViewer = dynamic(() => import("./pdf-viewer-component"), {
    ssr: false,
});

export default PDFViewer;
