// id → piece factory, plus static descriptors for the gallery (read once from a
// freshly constructed, un-initialised instance — construction is side-effect free).

import type { Piece, PieceFactory, ParamSchema, Backend, Config } from "../core/piece";
import { defaultsOf } from "../core/piece";
import { randomSeedString } from "../core/rng";
import { PIECES } from "../pieces";

export interface Descriptor {
  id: string;
  title: string;
  tags: string[];
  backend: Backend;
  schema: ParamSchema;
  loopSeconds?: number;
}

const factories: PieceFactory[] = PIECES;
const samples: Piece[] = factories.map((f) => f());

export const descriptors: Descriptor[] = samples.map((p) => ({
  id: p.id,
  title: p.title,
  tags: p.tags,
  backend: p.backend,
  schema: p.schema,
  loopSeconds: p.loopSeconds,
}));

const byId = new Map<string, PieceFactory>();
samples.forEach((p, i) => byId.set(p.id, factories[i]!));

export const createPiece = (id: string): Piece | undefined => byId.get(id)?.();
export const getDescriptor = (id: string): Descriptor | undefined => descriptors.find((d) => d.id === id);
export const firstDescriptor = (): Descriptor | undefined => descriptors[0];

/** A fresh default Config for a piece — defaults from its schema, banner size. */
export function defaultConfig(id: string, size = { w: 1500, h: 500 }, theme = "quantum-ink"): Config | null {
  const d = getDescriptor(id);
  if (!d) return null;
  return {
    pieceId: id,
    seed: randomSeedString(),
    params: defaultsOf(d.schema),
    size,
    meta: { complexity: 0.45, chaos: 0.45 },
    theme,
  };
}
