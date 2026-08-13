import type { Metadata } from "next";
import Board from "@/components/Board";
import { QUANTUM_INTERVENTIONS } from "@/lib/quantum-interventions";
import { quantumFigures, quantumMeta } from "@/lib/quantum";

export const metadata: Metadata = {
  title: "Counterfactual Quantum",
  description:
    "Dutch and world quantum research, assembled from OpenAlex and Quantum Delta NL, then redrawn under decisions that were not taken.",
};

export default function Page() {
  return (
    <Board
      figures={quantumFigures}
      interventions={QUANTUM_INTERVENTIONS}
      meta={quantumMeta}
      copy={{
        seriesNo: "02",
        siblingHref: "/",
        siblingLabel: "← AI board",
        title: (
          <>
            Quantum, <em>from Delft</em>
          </>
        ),
        tagline: (
          <>
            Quantum has no AI Index, so this one is assembled: {quantumFigures.length} figures from
            OpenAlex and from Quantum Delta NL&rsquo;s own report. The Dutch programme runs out of
            money in 2028. Say what should happen next.
          </>
        ),
        placeholder: "What should happen next, and when?",
        restLabel: "figures",
        /* The whole Dutch argument is about what happens after 2028, so this
           board needs enough runway past that date for the answer to show. */
        horizon: 2032,
        provenance: (
          <>
            <strong>Two sources of very different quality.</strong> The publication series come
            from the OpenAlex API, queried by topic so that the definition of &ldquo;quantum&rdquo;
            is explicit rather than a judgement call. {quantumMeta.definition} Every response is
            archived unedited in <code>data/raw/quantum/</code>. The investment and patent figures
            come from Quantum Delta NL&rsquo;s <em>State of Quantum 2025</em>, which publishes
            endpoints rather than series, so they are drawn as two points and nothing is drawn
            between them. {quantumMeta.cutoff}
          </>
        ),
      }}
    />
  );
}
