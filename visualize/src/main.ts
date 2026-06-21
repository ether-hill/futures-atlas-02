import "./style.css";
import { boot } from "./app";

// The global nav is the one shared component, loaded as /atlas-nav.js in
// index.html (it auto-detects this is the Visualize project from the URL).

const app = document.getElementById("app");
if (!app) throw new Error("missing #app");

boot(app);
