// futures-atlas-core — public API

// components
export { Container } from "./components/Container";
export { Section } from "./components/Section";
export { Page } from "./components/Page";
export { Button } from "./components/Button";
export { Card, CardBody } from "./components/Card";
export {
  ResearchTemplate,
  type ResearchItem,
  type ResearchType,
  type ThumbnailType,
} from "./components/ResearchTemplate";
export { VideoEmbed, youTubeId } from "./components/VideoEmbed";
export { ContactTemplate } from "./components/ContactTemplate";

// navbar
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
