// Auto-builds a Tweakpane control panel from a system's ParamSchema. Changing a
// param mutates the SHARED params object in place; `hot` params apply live,
// cold params trigger a reset via the host. (Convention from frond-algorithm-lab;
// the same .d.ts shim note applies — Tweakpane v4 re-exports from @tweakpane/core.)

import { Pane } from "tweakpane";
import type { ParamSchema, Params } from "./GenerativeSystem";

type TpEvent = { value: unknown };
interface Binding {
  on(ev: "change", cb: (e: TpEvent) => void): Binding;
}
interface Button {
  on(ev: "click", cb: () => void): Button;
}
interface PaneLike {
  addBinding(obj: object, key: string, opts?: Record<string, unknown>): Binding;
  addButton(opts: { title: string }): Button;
  addFolder(opts: { title: string; expanded?: boolean }): PaneLike;
  refresh(): void;
  dispose(): void;
}

export interface PanelHandlers {
  onChange: (key: string, hot: boolean) => void;
  onSeed: (seed: string) => void;
  randomSeed: () => string;
}

export interface PanelHandle {
  refresh: () => void;
  dispose: () => void;
}

export function buildPanel(
  container: HTMLElement,
  schema: ParamSchema,
  params: Params,
  handlers: PanelHandlers,
): PanelHandle {
  const pane = new Pane({ container }) as unknown as PaneLike;

  for (const key of Object.keys(schema)) {
    const spec = schema[key]!;
    const label = spec.type !== "seed" && spec.label ? spec.label : key;

    if (spec.type === "seed") {
      const seedF = pane.addFolder({ title: "seed", expanded: true });
      seedF.addBinding(params, key, { label: "value" }).on("change", (ev) => handlers.onSeed(String(ev.value)));
      seedF.addButton({ title: "reseed" }).on("click", () => {
        const s = handlers.randomSeed();
        (params as Record<string, string>)[key] = s;
        pane.refresh();
        handlers.onSeed(s);
      });
      continue;
    }
    if (spec.type === "select") {
      const options: Record<string, string> = {};
      for (const o of spec.options) options[o] = o;
      pane.addBinding(params, key, { label, options }).on("change", () => handlers.onChange(key, spec.hot ?? false));
      continue;
    }
    if (spec.type === "number") {
      pane
        .addBinding(params, key, { label, min: spec.min, max: spec.max, step: spec.step })
        .on("change", () => handlers.onChange(key, spec.hot ?? false));
      continue;
    }
    if (spec.type === "int") {
      pane
        .addBinding(params, key, { label, min: spec.min, max: spec.max, step: 1 })
        .on("change", () => handlers.onChange(key, spec.hot ?? false));
      continue;
    }
    // bool
    pane.addBinding(params, key, { label }).on("change", () => handlers.onChange(key, spec.hot ?? false));
  }

  return {
    refresh: () => pane.refresh(),
    dispose: () => pane.dispose(),
  };
}
