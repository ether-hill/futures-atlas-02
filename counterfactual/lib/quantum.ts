import raw from "@/data/quantum.json";
import type { Figure, FigureMeta } from "@/lib/figures";

export type QuantumMeta = FigureMeta & {
  definition: string;
  cutoff: string;
};

export const quantumMeta = raw.meta as unknown as QuantumMeta;
export const quantumFigures = raw.figures as unknown as Figure[];
