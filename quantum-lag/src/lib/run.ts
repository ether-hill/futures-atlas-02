import { DECK, DECK_VERSION, drawResearchSet } from "@/content/deck";
import type { Claim } from "@/content/types";

/*
  One reducer. Every transition is explicit and testable, and no screen state is
  ever derived from the presence of a DOM node.
*/

export const STORAGE_KEY = "quantum-lag:run:v1";
export const INSTRUMENT_VERSION = "1.0.0";

export type Mode = "guided" | "research";

export type Screen =
  | "intro"
  | "opening"
  | "opening-reveal"
  | "act"
  | "place"
  | "reveal"
  | "master";

/** Research places everything first, then plays the same reveals in order. */
export type Phase = "placing" | "replaying";

export type Telemetry = {
  /** The first year the player put a marker on. */
  firstPlacement: number;
  /** How far they moved it before committing: a hesitation signal. */
  adjustments: number;
  ms: number;
};

export type RunState = {
  version: string;
  deckVersion: string;
  sessionId: string;
  mode: Mode;
  screen: Screen;
  phase: Phase;
  /** Claim ids, in run order. */
  order: string[];
  index: number;
  placements: Record<string, number>;
  telemetry: Record<string, Telemetry>;
  /** The live, uncommitted year for the current claim. */
  draft: number | null;
  revealed: string[];
  /** Acts whose title card has already been shown. */
  actsShown: number[];
  openingPlacement: number | null;
  claimStartedAt: number;
};

export type Action =
  | { type: "start"; mode: Mode; seed: number; sessionId: string; at: number }
  | { type: "draft"; year: number }
  | { type: "commitOpening" }
  | { type: "commit"; at: number }
  | { type: "advance"; at: number }
  | { type: "goto"; screen: Screen }
  | { type: "restart" }
  | { type: "hydrate"; state: RunState };

export const initialState: RunState = {
  version: INSTRUMENT_VERSION,
  deckVersion: DECK_VERSION,
  sessionId: "",
  mode: "guided",
  screen: "intro",
  phase: "placing",
  order: [],
  index: 0,
  placements: {},
  telemetry: {},
  draft: null,
  revealed: [],
  actsShown: [],
  openingPlacement: null,
  claimStartedAt: 0,
};

export function claimById(id: string): Claim {
  const claim = DECK.find((c) => c.id === id);
  if (!claim) throw new Error(`unknown claim: ${id}`);
  return claim;
}

export function claimsFor(state: RunState): Claim[] {
  return state.order.map(claimById);
}

export function currentClaim(state: RunState): Claim | null {
  const id = state.order[state.index];
  return id ? claimById(id) : null;
}

export function reducer(state: RunState, action: Action): RunState {
  switch (action.type) {
    case "hydrate":
      return action.state;

    case "restart":
      return initialState;

    case "start": {
      const claims =
        action.mode === "guided" ? DECK : drawResearchSet(DECK, action.seed);
      return {
        ...initialState,
        sessionId: action.sessionId,
        mode: action.mode,
        screen: "opening",
        order: claims.map((c) => c.id),
        claimStartedAt: action.at,
      };
    }

    case "draft": {
      if (state.screen === "opening") {
        return { ...state, openingPlacement: action.year };
      }
      return { ...state, draft: action.year };
    }

    case "commitOpening":
      return { ...state, screen: "opening-reveal" };

    case "commit": {
      const claim = currentClaim(state);
      if (!claim || state.draft === null) return state;

      const previous = state.telemetry[claim.id];
      const telemetry: Telemetry = {
        firstPlacement: previous?.firstPlacement ?? state.draft,
        adjustments: previous?.adjustments ?? 0,
        ms: action.at - state.claimStartedAt,
      };

      const placements = { ...state.placements, [claim.id]: state.draft };

      // Guided reveals immediately. Research collects everything first, and this
      // ordering rule is the reason the mode exists, so nothing leaks early.
      if (state.mode === "guided") {
        return {
          ...state,
          placements,
          telemetry: { ...state.telemetry, [claim.id]: telemetry },
          revealed: [...state.revealed, claim.id],
          screen: "reveal",
        };
      }

      const last = state.index >= state.order.length - 1;
      return {
        ...state,
        placements,
        telemetry: { ...state.telemetry, [claim.id]: telemetry },
        draft: null,
        index: last ? 0 : state.index + 1,
        phase: last ? "replaying" : "placing",
        screen: last ? "reveal" : "place",
        claimStartedAt: action.at,
      };
    }

    case "advance": {
      // The run ends on the timeline. There is no separate results screen: the
      // three figures that used to fill one now open the walk back through the
      // deck, where they have something to sit against.
      const last = state.index >= state.order.length - 1;
      if (last) return { ...state, screen: "master" };

      const nextIndex = state.index + 1;
      const nextClaim = claimById(state.order[nextIndex]!);

      if (state.phase === "replaying") {
        return {
          ...state,
          index: nextIndex,
          revealed: [...state.revealed, nextClaim.id],
          screen: "reveal",
        };
      }

      // Act titles are shown as the act begins, guided only. The card also
      // carries the previous act's closing line, so it is the seam between acts.
      const newAct = !state.actsShown.includes(nextClaim.act);
      const showActCard = state.mode === "guided" && newAct;

      return {
        ...state,
        index: nextIndex,
        draft: null,
        screen: showActCard ? "act" : "place",
        actsShown: newAct ? [...state.actsShown, nextClaim.act] : state.actsShown,
        claimStartedAt: action.at,
      };
    }

    case "goto": {
      // Landing on an act card counts as having shown that act, because otherwise
      // opening question's hand-off into act one leaves it unrecorded, and the
      // card is shown again before the act's second claim.
      if (action.screen === "act") {
        const claim = currentClaim(state);
        const act = claim?.act;
        return {
          ...state,
          screen: action.screen,
          actsShown:
            act && !state.actsShown.includes(act)
              ? [...state.actsShown, act]
              : state.actsShown,
        };
      }
      return { ...state, screen: action.screen };
    }

    default:
      return state;
  }
}

/**
 * Track how much the marker moved before it was committed. Kept out of the
 * reducer's `draft` case so a re-render never inflates the count.
 */
export function countAdjustment(state: RunState, claimId: string): RunState {
  const previous = state.telemetry[claimId];
  if (!previous) return state;
  return {
    ...state,
    telemetry: {
      ...state.telemetry,
      [claimId]: { ...previous, adjustments: previous.adjustments + 1 },
    },
  };
}

// ---------------------------------------------------------------------------
// Persistence
// ---------------------------------------------------------------------------

/*
  Versioned key, so a refresh mid run resumes rather than restarting. The run is
  kept through the results screen, since a refresh there should not throw the
  result away, and cleared on an explicit restart.
*/

export function save(state: RunState): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    // A full or blocked store is not a reason to interrupt a run.
  }
}

export function load(): RunState | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as RunState;
    if (
      parsed.version !== INSTRUMENT_VERSION ||
      parsed.deckVersion !== DECK_VERSION
    ) {
      return null;
    }
    // Any claim that has left the deck since the run started drops out.
    const order = parsed.order.filter((id) => DECK.some((c) => c.id === id));
    if (order.length === 0) return null;
    return { ...parsed, order, index: Math.min(parsed.index, order.length - 1) };
  } catch {
    return null;
  }
}

export function clear(): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.removeItem(STORAGE_KEY);
  } catch {
    /* nothing to do */
  }
}
