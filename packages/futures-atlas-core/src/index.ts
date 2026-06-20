// futures-atlas-core — public API

// components
export { Container } from "./components/Container";
export { Section } from "./components/Section";
export { Page } from "./components/Page";
export { Button } from "./components/Button";
export { Card, CardBody } from "./components/Card";
export { ResearchTemplate, type ResearchItem } from "./components/ResearchTemplate";
export { ContactTemplate } from "./components/ContactTemplate";

// navbar — the global bar is now the one shared /atlas-nav.js component (host
// public/); the old React GlobalNav was removed in the nav unification.
export { FaLogoMark } from "./components/FaLogoMark";
export { Navbar } from "./components/Navbar";
export { AtlasBar, type AtlasProject } from "./components/AtlasBar";
export { ProjectNav, type NavPage } from "./components/ProjectNav";

// runtime theming
export { ThemeProvider } from "./ThemeProvider";
export {
  buildOverrideCss,
  applyOverrides,
  fetchOverrides,
  isKnownToken,
  OVERRIDE_STYLE_ID,
  type Overrides,
} from "./runtime";

// token registry
export { TOKENS, GROUPS, tokenById, type TokenDef, type ControlKind, type Mode } from "./tokens";

// style guide panel
export { StyleGuide } from "./style-guide/StyleGuide";
