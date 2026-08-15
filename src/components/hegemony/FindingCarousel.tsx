"use client";

/**
 * A strand's findings, in the report's rail. All of them — CardRail states the
 * full count in its header for exactly that reason.
 */

import { findingsIn, type Strand } from "@/data/hegemony";
import { CardRail, RailItem } from "./CardRail";
import { FindingCard } from "./FindingCard";

export function FindingCarousel({ strand, label }: { strand: Strand; label: string }) {
  const findings = findingsIn(strand);
  return (
    <CardRail label={label} count={findings.length} noun="findings">
      {findings.map((f) => (
        <RailItem key={f.id}>
          <FindingCard finding={f} />
        </RailItem>
      ))}
    </CardRail>
  );
}
