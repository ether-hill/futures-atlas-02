import "./style.css";
import "./experience.css";
import "./experience4.css";
import { boot } from "./app";

// The global nav is the one shared component, loaded as /atlas-nav.js in
// index.html (it auto-detects this is the Magnifica project from the URL).

const app = document.getElementById("app");
if (!app) throw new Error("missing #app");

boot(app);
