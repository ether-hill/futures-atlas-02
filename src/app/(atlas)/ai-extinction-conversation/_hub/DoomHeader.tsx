import { DoomNav } from "./DoomNav";

export function DoomHeader({ title, lead, compact = false }: { title: string; lead: string; compact?: boolean }) {
  return (
    <header className={`ds-head ${compact ? "ds-head--compact" : ""}`}>
      <DoomNav />
      <h1 className={compact ? "fa-t-title" : "fa-t-display-l"}>{title}</h1>
      <p className={compact ? "ds-lead ds-lead--compact" : "fa-t-lead ds-lead"}>{lead}</p>
    </header>
  );
}
