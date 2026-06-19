#!/usr/bin/env node
/**
 * Scaffold a new in-hub Futures Atlas project.
 *
 *   node scripts/new-project.mjs <slug> "<Title>"
 *
 * Creates src/app/<slug>/{layout,page,research/page,contact/page}.tsx wired to
 * the shared futures-atlas-core ResearchTemplate + ContactTemplate, an EMPTY
 * src/data/<slug>/research.ts (never invent content — fill it with real
 * resources later), and registers the project in src/data/projects.ts so it
 * appears in the nav switcher and every contact dropdown automatically.
 */
import { mkdirSync, writeFileSync, existsSync, readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const [, , slug, title] = process.argv;

if (!slug || !title) {
  console.error('Usage: node scripts/new-project.mjs <slug> "<Title>"');
  process.exit(1);
}
if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug)) {
  console.error(`Slug must be kebab-case (got "${slug}").`);
  process.exit(1);
}

const pascal = slug.split("-").map((s) => s[0].toUpperCase() + s.slice(1)).join("");
const appDir = join(ROOT, "src/app", slug);
if (existsSync(appDir)) {
  console.error(`src/app/${slug} already exists — aborting.`);
  process.exit(1);
}

const layout = `import { ProjectSiteNav } from "@/components/ProjectSiteNav";
import { Footer } from "@/components/Footer";

export default function ${pascal}Layout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <ProjectSiteNav title=${JSON.stringify(title)} base="/${slug}" />
      <main className="flex-1">{children}</main>
      <Footer />
    </>
  );
}
`;

const home = `import { Section } from "futures-atlas-core";
import Link from "next/link";

export const metadata = { title: ${JSON.stringify(`${title} — Futures Atlas`)} };

export default function ${pascal}Home() {
  return (
    <Section variant="header">
      <h1 className="fa-t-display-l">${title}</h1>
      {/* TODO: add this project's introduction. */}
      <p style={{ marginTop: "var(--space-7)", display: "flex", gap: "var(--space-5)" }}>
        <Link href="/${slug}/research" className="fa-btn fa-btn--ghost">Research →</Link>
        <Link href="/${slug}/contact" className="fa-btn fa-btn--ghost">Contact →</Link>
      </p>
    </Section>
  );
}
`;

const research = `import { ResearchTemplate } from "futures-atlas-core";
import { research } from "@/data/${slug}/research";

export const metadata = { title: ${JSON.stringify(`Research — ${title}`)} };

export default function ${pascal}Research() {
  return (
    <ResearchTemplate
      heading="The evidence base"
      intro=${JSON.stringify(`The news, research, videos and resources behind ${title}.`)}
      items={research}
    />
  );
}
`;

const intro =
  `${title} is a project of the Futures Atlas, by Frond Studio in partnership ` +
  `with the Centre for Quantum & Society, to make the futures we might live in ` +
  `visible, tangible, and open to debate. Whether you'd like to collaborate, ` +
  `commission work, or simply share a thought or question, we'd be glad to hear from you.`;

const contact = `import { ContactTemplate } from "futures-atlas-core";
import { contactProjects } from "@/data/projects";

export const metadata = { title: ${JSON.stringify(`Contact — ${title}`)} };

export default function ${pascal}Contact() {
  return (
    <ContactTemplate
      heading="Contact"
      intro={${JSON.stringify(intro)}}
      projects={contactProjects}
      defaultProject=${JSON.stringify(title)}
    />
  );
}
`;

const data = `import type { ResearchItem } from "futures-atlas-core";

// Research evidence base for ${title}.
// See futures-atlas-core/RESEARCH-AUTHORING.md for the authoring rules:
//   types:  "news" | "research" | "video" | "resource"
//   thumbnail priority:  screengrab > press image > logo > commons/unsplash
// Add ONLY real, relevant resources — never invent entries. Leave empty until
// you have real material.
export const research: ResearchItem[] = [];
`;

mkdirSync(join(appDir, "research"), { recursive: true });
mkdirSync(join(appDir, "contact"), { recursive: true });
mkdirSync(join(ROOT, "src/data", slug), { recursive: true });

writeFileSync(join(appDir, "layout.tsx"), layout);
writeFileSync(join(appDir, "page.tsx"), home);
writeFileSync(join(appDir, "research/page.tsx"), research);
writeFileSync(join(appDir, "contact/page.tsx"), contact);
writeFileSync(join(ROOT, "src/data", slug, "research.ts"), data);

// Register in the central project list (insert before the array's closing `];`).
const projectsPath = join(ROOT, "src/data/projects.ts");
const src = readFileSync(projectsPath, "utf8");
const anchor = "];\n\nexport const statusLabel";
if (!src.includes(anchor)) {
  console.error("Could not find the projects array close anchor in projects.ts — register the project manually.");
} else {
  const entry =
    `  {\n` +
    `    id: ${JSON.stringify(slug)},\n` +
    `    title: ${JSON.stringify(title)},\n` +
    `    tagline: "", // TODO: one-line description\n` +
    `    year: "2026",\n` +
    `    field: "", // TODO: short category\n` +
    `    status: "concept",\n` +
    `    path: ${JSON.stringify("/" + slug)},\n` +
    `    inHub: true,\n` +
    `  },\n`;
  writeFileSync(projectsPath, src.replace(anchor, entry + anchor));
}

console.log(`✓ Scaffolded "${title}"`);
console.log(`  /${slug}  /${slug}/research  /${slug}/contact`);
console.log(`  → fill src/data/${slug}/research.ts with real resources, and the TODOs in src/app/${slug}/page.tsx + projects.ts`);
