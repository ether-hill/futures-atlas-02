import "./style.css";
import { Dashboard } from "./dashboard/Dashboard";
import { mountAtlasHeader } from "./atlasHeader";

mountAtlasHeader({ name: "Quantum Sandbox", path: "/quantum-sandbox" });

const app = document.getElementById("app");
if (!app) throw new Error("missing #app");

new Dashboard(app).boot();
