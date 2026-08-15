"use client";

/**
 * A set of findings, in the report's rail. All of them — CardRail states the
 * full count in its header for exactly that reason.
 *
 * Takes the findings rather than a strand key: the sections differ per report,
 * and a component that knew one report's section names could not be used by
 * the next one.
 */

import type { Finding } from "@/data/report-types";
import { CardRail, RailItem } from "./CardRail";
import { FindingCard } from "./FindingCard";

export function FindingCarousel({ findings, label }: { findings: Finding[]; label: string }) {
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
