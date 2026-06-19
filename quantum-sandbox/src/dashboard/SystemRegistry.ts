// id → system. The dashboard renders the list and resolves the active system.

import type { GenerativeSystem } from "../harness/GenerativeSystem";
import { SYSTEMS } from "../systems";

const byId = new Map<string, GenerativeSystem>(SYSTEMS.map((s) => [s.id, s]));

export const allSystems = (): GenerativeSystem[] => SYSTEMS;
export const getSystem = (id: string): GenerativeSystem | undefined => byId.get(id);
export const firstSystem = (): GenerativeSystem | undefined => SYSTEMS[0];
