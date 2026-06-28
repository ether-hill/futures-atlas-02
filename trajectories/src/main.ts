import "./style.css";
import { boot } from "./app";

// The global Futures Atlas nav is loaded as /atlas-nav.js in index.html (it
// auto-detects this is the Trajectories project from the URL).

const app = document.getElementById("app");
if (!app) throw new Error("missing #app");

boot(app);
