import raw from "@/data/figures.json";

export type Point = [number, number];

export type Series = {
  key: string;
  label: string;
  color: string;
  points: Point[];
  dashed?: boolean;
  /** Parallel to points; a non-null entry annotates that point (scatter only). */
  pointLabels?: (string | null)[];
  pointLabelPos?: ({ anchor: "start" | "middle" | "end"; dx: number; dy: number } | null)[];
};

export type Axis = {
  label: string | null;
  /** Used on the board, where a full sentence of axis title does not fit. */
  shortLabel?: string;
  type?: "year" | "category" | "linear";
  scale?: "linear" | "log";
  domain?: [number, number];
  tickStep?: number;
  ticks?: number[];
  tickLabels?: string[];
  format?: ValueFormat;
  rotate?: number;
};

export type ValueFormat = "int" | "fixed2" | "trim2" | "pct0" | "pct2";

export type FigureKind =
  | "line"
  | "bar"
  | "stackedBar"
  | "scatter"
  | "hbar"
  | "groupedHBar";

export type Annotation = { y: number; label: string; dashed?: boolean };

export type Figure = {
  id: string;
  slug: string;
  chapter: { n: number; name: string };
  section: string;
  reportPage: number;
  title: string;
  source: string;
  kind: FigureKind;
  xAxis: Axis;
  yAxis: Axis;
  series: Series[];
  categories?: string[];
  legend?: {
    position: "top" | "top-left" | "top-right" | "below" | "bottom-right";
    shape: "square" | "dot" | "line";
    columns?: number;
  };
  legendOrder?: string[];
  annotations?: Annotation[];
  endLabels?: boolean;
  endLabelValueOnly?: boolean;
  showTotals?: boolean;
  labelLast?: boolean;
  labelAll?: boolean;
  valueFormat?: ValueFormat;
  takeaway: string;
  levers: string[];
  csvFile: string;
  csvUrl: string | null;
  /** Attribution line under the title; differs per dataset. */
  chartNote?: string;
  /** Values accumulate, so a counterfactual damps the increments, not the level. */
  cumulative?: boolean;
  /** One of the four figures shown above the fold. */
  hero?: boolean;
  /** Set at runtime when the series has been extended past the published data. */
  projection?: { fromX: number; label: string };
};

export type FigureMeta = {
  report: string;
  publisher: string;
  published: string;
  reportUrl: string;
  pdfUrl: string;
  dataUrl: string;
  licence: string;
  chartNote: string;
  palette: string[];
  generatedFrom: string;
};

export const meta = raw.meta as FigureMeta;
export const figures = raw.figures as unknown as Figure[];

export const figureById = (id: string) => figures.find((f) => f.id === id);

/* ------------------------------------------------------------------ formatting */

export function formatValue(v: number, fmt: ValueFormat = "trim2"): string {
  switch (fmt) {
    case "int":
      return Math.round(v).toLocaleString("en-US");
    case "fixed2":
      return v.toFixed(2);
    case "pct0":
      return `${Math.round(v * 100)}%`;
    case "pct2":
      return `${(v * 100).toFixed(2)}%`;
    case "trim2":
    default:
      return String(Number(v.toFixed(2)));
  }
}

export function formatTick(v: number, axis: Axis): string {
  if (axis.format) return formatValue(v, axis.format);
  if (axis.type === "year") return String(Math.round(v));
  const abs = Math.abs(v);
  if (abs !== 0 && (abs < 0.01 || abs >= 1e6)) return String(v);
  return String(Number(v.toFixed(2)));
}

/** Rough text width in px. Figtree averages ~0.54em over mixed case. */
export function textWidth(s: string, size: number, bold = false): number {
  return s.length * size * (bold ? 0.58 : 0.54);
}
