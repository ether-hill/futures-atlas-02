/**
 * PDF export — WYSIWYG: the actual rendered slide boards are rasterised with
 * html2canvas (after document.fonts.ready, so Archivo/Plex Mono are in) and
 * placed one per landscape page. The honesty frame is stamped into every
 * page's footer per the brief's honesty layer.
 */

import type { Deck } from "./types";
import { HONESTY_LINE } from "./types";
import { toSlug } from "./sectors";

export async function buildPdf(boards: HTMLElement[], deck: Deck): Promise<void> {
  await document.fonts.ready;
  const [{ default: html2canvas }, { jsPDF }] = await Promise.all([
    import("html2canvas"),
    import("jspdf"),
  ]);

  const doc = new jsPDF({ orientation: "landscape", unit: "px", format: [1280, 760] });

  for (let i = 0; i < boards.length; i++) {
    const canvas = await html2canvas(boards[i], {
      scale: 2,
      backgroundColor: "#0f0f10",
      logging: false,
      useCORS: true,
    });
    if (i > 0) doc.addPage([1280, 760], "landscape");
    doc.setFillColor(11, 11, 12);
    doc.rect(0, 0, 1280, 760, "F");
    doc.addImage(canvas.toDataURL("image/jpeg", 0.92), "JPEG", 0, 0, 1280, 720);
    // footer stamp on every page (courier ships with jsPDF — no font embed needed)
    doc.setFont("courier", "normal");
    doc.setFontSize(9);
    doc.setTextColor(103, 100, 92);
    doc.text("SIGNAL REACTOR", 24, 745);
    doc.text(HONESTY_LINE, 1256, 745, { align: "right" });
  }

  doc.setProperties({
    title: `Signal Reactor — ${deck.sector}`,
    subject: HONESTY_LINE,
    creator: "Signal Reactor — Futures Atlas",
  });
  doc.save(`signal-reactor-${toSlug(deck.sector)}.pdf`);
}
