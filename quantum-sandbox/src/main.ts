import "./style.css";
import { Dashboard } from "./dashboard/Dashboard";
import { mountAtlasHeader } from "./atlasHeader";

mountAtlasHeader("Quantum Sandbox");

const app = document.getElementById("app");
if (!app) throw new Error("missing #app");

new Dashboard(app).boot();
