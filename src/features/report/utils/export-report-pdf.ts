export function sanitizeReportPdfFileName(topic: string): string {
  const base = topic.replace(/[/\\?%*:|"<>#\s]+/g, "_").replace(/_+/g, "_").trim();
  return base || "report";
}

/**
 * 截取报告 DOM，按 A4 分页写入 PDF（html2canvas + jsPDF）。
 * 失败时回退 html2pdf.bundle 的 blob 下载。
 */
export async function exportReportHtmlToPdf(element: HTMLElement, topic: string): Promise<void> {
  const safeName = sanitizeReportPdfFileName(topic);
  
  // Directly use printElement. html2canvas is fundamentally incompatible with Tailwind v4's oklch/lab colors.
  await printElement(element, safeName);
}

async function printElement(element: HTMLElement, title: string) {
  const iframe = document.createElement('iframe');
  iframe.style.position = 'fixed';
  iframe.style.right = '0';
  iframe.style.bottom = '0';
  iframe.style.width = '0';
  iframe.style.height = '0';
  iframe.style.border = '0';
  document.body.appendChild(iframe);

  const doc = iframe.contentWindow?.document;
  if (!doc) return;

  // Clone the element so we don't mutate the original
  const clone = element.cloneNode(true) as HTMLElement;
  
  // Create a basic HTML structure
  doc.open();
  doc.write('<html><head><title>' + title + '</title>');
  
  // Copy all styles from the current document to the iframe
  const styleElements = document.querySelectorAll('style, link[rel="stylesheet"]');
  styleElements.forEach(styleEl => {
    doc.write(styleEl.outerHTML);
  });
  
  // Add some specific print styles
  doc.write(`
    <style>
      @media print {
        body { 
          margin: 0; 
          padding: 0; 
          background: white !important; 
          color: black !important;
        }
        
        /* 隐藏最上方的"深度研究报告"卡片 */
        div.text-center { display: none !important; }
        
        /* 强制所有文本颜色为纯黑，解决模糊和发灰问题 */
        * { 
          color: black !important; 
          text-shadow: none !important;
          -webkit-text-fill-color: black !important;
        }
        
        /* 去除背景和边框，使页面更像纯文档 */
        .bg-slate-900\\/40, .bg-\\[\\#1E293B\\] { 
          background-color: transparent !important; 
          border: none !important; 
          padding: 0 !important;
        }
        
        /* 图片自适应 */
        img { max-width: 100% !important; height: auto !important; page-break-inside: avoid; }
        
        /* 代码块换行 */
        pre, code { white-space: pre-wrap !important; word-wrap: break-word !important; }
        
        /* 分页控制 */
        h1, h2, h3 { page-break-after: avoid; }
        p { orphans: 3; widows: 3; }
      }
    </style>
  `);
  doc.write('</head><body>');
  doc.write(clone.outerHTML);
  doc.write('</body></html>');
  doc.close();

  // Wait for images to load, then print
  setTimeout(() => {
    iframe.contentWindow?.focus();
    iframe.contentWindow?.print();
    // Cleanup after print dialog is closed
    setTimeout(() => {
      document.body.removeChild(iframe);
    }, 1000);
  }, 500);
}

async function exportWithHtml2CanvasJsPdf(element: HTMLElement, safeName: string): Promise<void> {
  const [html2canvasModule, jsPDFModule] = await Promise.all([
    import("html2canvas"),
    import("jspdf"),
  ]);

  const html2canvas = html2canvasModule.default || html2canvasModule;
  const JsPDFClass = (jsPDFModule as any).jsPDF || (jsPDFModule as any).default?.jsPDF || (jsPDFModule as any).default || jsPDFModule;

  const canvas = await html2canvas(element, {
    scale: 1.75,
    useCORS: true,
    allowTaint: true,
    logging: false,
    backgroundColor: null,
    windowWidth: element.scrollWidth,
    windowHeight: element.scrollHeight,
  });

  const marginMm = 10;
  const pageWidthMm = 210;
  const pageHeightMm = 297;
  const contentWidthMm = pageWidthMm - marginMm * 2;
  const contentHeightMm = pageHeightMm - marginMm * 2;

  const imgData = canvas.toDataURL("image/jpeg", 0.92);
  const imgWidthMm = contentWidthMm;
  const imgHeightMm = (canvas.height * imgWidthMm) / canvas.width;

  const pdf = new JsPDFClass({ orientation: "portrait", unit: "mm", format: "a4", compress: true });

  let heightLeft = imgHeightMm;
  let yMm = marginMm;
  pdf.addImage(imgData, "JPEG", marginMm, yMm, imgWidthMm, imgHeightMm);
  heightLeft -= contentHeightMm;

  while (heightLeft > 0.5) {
    yMm = marginMm + (heightLeft - imgHeightMm);
    pdf.addPage();
    pdf.addImage(imgData, "JPEG", marginMm, yMm, imgWidthMm, imgHeightMm);
    heightLeft -= contentHeightMm;
  }

  pdf.save(`${safeName}.pdf`);
}

async function tryHtml2PdfBlob(element: HTMLElement): Promise<Blob | null> {
  try {
    const html2pdfModule = await import("html2pdf.js");
    const html2pdf = html2pdfModule.default || html2pdfModule;
    const blob = (await html2pdf()
      .set({
        margin: [10, 10, 10, 10],
        image: { type: "jpeg", quality: 0.92 },
        html2canvas: {
          scale: 1.5,
          useCORS: true,
          allowTaint: true,
          logging: false,
          backgroundColor: null,
        },
        jsPDF: { unit: "mm", format: "a4", orientation: "portrait" },
      })
      .from(element)
      .outputPdf("blob")) as Blob;
    return blob instanceof Blob ? blob : null;
  } catch (error) {
    console.error("tryHtml2PdfBlob failed:", error);
    return null;
  }
}

function triggerDownload(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.rel = "noopener";
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}
