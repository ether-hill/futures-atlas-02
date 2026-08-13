"use client";

import { useEffect, useLayoutEffect, useMemo, useReducer, useRef } from "react";

import { ActCard } from "./ActCard";
import { Home } from "./Home";
import { MasterTimeline } from "./MasterTimeline";
import { Opening } from "./Opening";
import { Place } from "./Place";
import { Reveal } from "./Reveal";

import { ACTS, DECK } from "@/content/deck";
import {
  claimsFor,
  clear,
  currentClaim,
  initialState,
  load,
  reducer,
  save,
  type Mode,
} from "@/lib/run";
import { scoreClaim } from "@/lib/scoring";

/*
  The whole instrument, driven by one reducer. Screen state is never derived
  from the presence of a DOM node.
*/

type Props = {
  mode: Mode;
  showChooser?: boolean;
};

export function Run({ mode, showChooser = false }: Props) {
  const [state, dispatch] = useReducer(reducer, initialState);
  const hydrated = useRef(false);

  /*
    Committing a claim must not move the line.

    Holding the scroll offset is not enough: on a short viewport the commit
    button sits below the fold, so pressing it scrolls the page first, and the
    offset captured at that moment is already wrong. What has to be held is the
    line's position on screen, recorded when the marker was last moved, before
    any of that happens.

    Both screens put the line at the same document offset, so restoring it is a
    single instant scroll with nothing to animate.
  */
  const heldLineTop = useRef<number | null>(null);

  const rememberLine = () => {
    const line = document.querySelector(".ql-line-slot");
    if (line) heldLineTop.current = line.getBoundingClientRect().top;
  };

  useLayoutEffect(() => {
    if (heldLineTop.current === null) return;
    const held = heldLineTop.current;
    heldLineTop.current = null;
    const line = document.querySelector(".ql-line-slot");
    if (!line) return;
    const target = line.getBoundingClientRect().top + window.scrollY - held;
    window.scrollTo({
      top: Math.max(0, target),
      behavior: "instant" as ScrollBehavior,
    });
  }, [state.screen]);

  // Resume a run in progress rather than restarting it.
  useEffect(() => {
    const saved = load();
    if (saved && saved.mode === mode) dispatch({ type: "hydrate", state: saved });
    hydrated.current = true;
  }, [mode]);

  useEffect(() => {
    if (!hydrated.current) return;
    if (state.screen === "intro") return;
    save(state);
  }, [state]);

  const claims = useMemo(() => claimsFor(state), [state]);
  const claim = currentClaim(state);
  const total = state.order.length;

  // The running record shown under each reveal.
  const record = useMemo(() => {
    let lag = 0;
    let leap = 0;
    let inside = 0;
    for (const id of state.revealed) {
      const c = claims.find((x) => x.id === id);
      const placed = state.placements[id];
      if (!c || placed === undefined) continue;
      const v = scoreClaim(c, placed);
      if (v.direction === "lag") lag += 1;
      if (v.direction === "leap") leap += 1;
      if (v.insideRange) inside += 1;
    }
    return { lag, leap, inside };
  }, [state.revealed, state.placements, claims]);

  const start = (chosen: Mode) => {
    clear();
    dispatch({
      type: "start",
      mode: chosen,
      seed: Math.floor(Math.random() * 2 ** 31),
      sessionId:
        typeof crypto !== "undefined" && "randomUUID" in crypto
          ? crypto.randomUUID()
          : String(Date.now()),
      at: Date.now(),
    });
  };

  const restart = () => {
    clear();
    dispatch({ type: "restart" });
  };

  switch (state.screen) {
    case "intro":
      return (
        <Home
          mode={mode}
          total={mode === "guided" ? DECK.length : 0}
          showChooser={showChooser}
          onStart={start}
          onSkip={() => dispatch({ type: "goto", screen: "master" })}
        />
      );

    case "opening":
    case "opening-reveal":
      return (
        <Opening
          placed={state.openingPlacement}
          revealed={state.screen === "opening-reveal"}
          onDraft={(year) => dispatch({ type: "draft", year })}
          onCommit={() => dispatch({ type: "commitOpening" })}
          onContinue={() => {
            const first = claims[0];
            dispatch({
              type: "goto",
              screen: state.mode === "guided" && first ? "act" : "place",
            });
          }}
        />
      );

    case "act": {
      if (!claim) return null;
      const act = ACTS.find((a) => a.act === claim.act)!;
      // The previous act's closing line hands over to this one.
      const previous = ACTS.find((a) => a.act === claim.act - 1);
      return (
        <ActCard
          act={act}
          handover={previous?.interstitial}
          onContinue={() => dispatch({ type: "goto", screen: "place" })}
        />
      );
    }

    case "place":
      if (!claim) return null;
      return (
        <Place
          claim={claim}
          index={state.index}
          total={total}
          draft={state.draft}
          mode={state.mode}
          onDraft={(year) => {
            rememberLine();
            dispatch({ type: "draft", year });
          }}
          onCommit={() => dispatch({ type: "commit", at: Date.now() })}
        />
      );

    case "reveal": {
      if (!claim) return null;
      const placed = state.placements[claim.id];
      if (placed === undefined) return null;
      return (
        <Reveal
          key={claim.id}
          claim={claim}
          index={state.index}
          total={total}
          mode={state.mode}
          placed={placed}
          record={record}
          isLast={state.index >= total - 1}
          onNext={() => dispatch({ type: "advance", at: Date.now() })}
        />
      );
    }

    case "master":
      return (
        <MasterTimeline
          claims={claims.length > 0 ? claims : DECK}
          placements={state.placements}
          onBack={() => dispatch({ type: "goto", screen: "intro" })}
          onRestart={restart}
        />
      );

    default:
      return null;
  }
}
