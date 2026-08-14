import Board from "@/components/Board";
import { figures, meta } from "@/lib/figures";
import { INTERVENTIONS } from "@/lib/interventions";
import { HORIZON } from "@/lib/project";

export default function Page() {
  return (
    <Board
      figures={figures}
      interventions={INTERVENTIONS}
      meta={meta}
      copy={{
        seriesNo: "01",
        siblingHref: "/quantum",
        siblingLabel: "Quantum board →",
        title: (
          <>
            The 2026 AI Index, <em>redrawn</em>
          </>
        ),
        tagline: (
          <>
            {figures.length} figures rebuilt from Stanford HAI&rsquo;s published CSVs. Say what you
            would do about AI, and when, then watch what it does to them.
          </>
        ),
        placeholder: "What would you do about AI, and when?",
        restLabel: "figures",
        horizon: HORIZON,
        provenance: (
          <>
            <strong>The baseline is not a redrawing.</strong> Every published series is generated
            at build time from <code>data/raw/csv/fig_&lt;id&gt;.csv</code>, downloaded verbatim
            from the AI Index&rsquo;s public data folder. No value is retyped, interpolated or
            smoothed. Open <em>Data</em> under any figure to read the numbers, or{" "}
            <em>Source CSV</em> to fetch the original. Charts run on to {HORIZON} once an
            intervention needs a future to land in.
          </>
        ),
      }}
    />
  );
}
