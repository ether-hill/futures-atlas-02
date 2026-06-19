import "./style.css";
import { Dashboard } from "./dashboard/Dashboard";

const app = document.getElementById("app");
if (!app) throw new Error("missing #app");

new Dashboard(app).boot();
