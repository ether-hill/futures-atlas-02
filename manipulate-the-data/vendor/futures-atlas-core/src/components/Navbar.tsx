import type { ReactNode } from "react";
import { AtlasBar, type AtlasProject } from "./AtlasBar";
import { ProjectNav, type NavPage } from "./ProjectNav";

/**
 * One bar, two scopes:
 *   LEFT  — the persistent Futures Atlas anchor + (optional) project switcher.
 *   RIGHT — the current project's page links (Home, Research, …), active underlined,
 *           collapsing to a hamburger on mobile.
 * `trailing` renders extra controls after the page links (e.g. a theme toggle).
 */
export function Navbar({
  currentProject,
  projects = [],
  pages = [],
  activeHref,
  homeHref = "/",
  trailing,
}: {
  currentProject?: { name: string; slug: string };
  projects?: AtlasProject[];
  pages?: NavPage[];
  activeHref?: string;
  homeHref?: string;
  trailing?: ReactNode;
}) {
  return (
    <header className="fa-navbar">
      <div
        className="fa-navbar__inner"
        style={{ maxWidth: "var(--container-max)", marginInline: "auto", paddingInline: "var(--gutter)", width: "100%" }}
      >
        <AtlasBar currentProject={currentProject} projects={projects} homeHref={homeHref} />
        <div className="fa-navbar__right">
          <ProjectNav pages={pages} activeHref={activeHref} />
          {trailing}
        </div>
      </div>
    </header>
  );
}
