import "./style.css";
import { Dashboard } from "./dashboard/Dashboard";

// The global nav is the one shared component, loaded as /atlas-nav.js in
// index.html (it auto-detects this is the Prism project from the URL).

const app = document.getElementById("app");
if (!app) throw new Error("missing #app");

new Dashboard(app).boot();
