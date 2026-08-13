"use client";

import type { ComponentType } from "react";

import {
  DemoToService,
  EnergyLevels,
  GravityDip,
  SpinTwoStates,
  ThreeTiers,
} from "./act1";
import {
  FactoringScale,
  LogicalQubit,
  MachinesCompared,
  ResistanceDrop,
  RoadmapGap,
  TemperatureScale,
} from "./act2";
import {
  FibreFalloff,
  LinkToNetwork,
  TappedChannel,
  TeleportationSteps,
  ThreeRanges,
} from "./act3";
import {
  DeadlineAxis,
  ExpertSpread,
  QubitThreshold,
  RequirementFalling,
  SupremacyCollapse,
} from "./act4";

/*
  The registry. A story block names a figure by id; an unknown id renders
  nothing rather than breaking the read, and the test catches it in CI.
*/
export const VISUALS: Record<string, ComponentType> = {
  "energy-levels": EnergyLevels,
  "spin-two-states": SpinTwoStates,
  "gravity-dip": GravityDip,
  "three-tiers": ThreeTiers,
  "demo-to-service": DemoToService,

  "resistance-drop": ResistanceDrop,
  "temperature-scale": TemperatureScale,
  "logical-qubit": LogicalQubit,
  "machines-compared": MachinesCompared,
  "roadmap-gap": RoadmapGap,
  "factoring-scale": FactoringScale,

  "tapped-channel": TappedChannel,
  "three-ranges": ThreeRanges,
  "teleportation-steps": TeleportationSteps,
  "link-to-network": LinkToNetwork,
  "fibre-falloff": FibreFalloff,

  "supremacy-collapse": SupremacyCollapse,
  "deadline-axis": DeadlineAxis,
  "qubit-threshold": QubitThreshold,
  "expert-spread": ExpertSpread,
  "requirement-falling": RequirementFalling,
};

export function Figure({ id, caption }: { id: string; caption: string }) {
  const Drawing = VISUALS[id];
  if (!Drawing) return null;
  return (
    <figure className="ql-fig" data-rise>
      <Drawing />
      <figcaption className="ql-fig__caption">{caption}</figcaption>
    </figure>
  );
}
