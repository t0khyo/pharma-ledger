import { registerCompanyHandlers } from "./company.handler.js";

export function registerAllHandlers() {
  console.log("Registering IPC handlers...");

  registerCompanyHandlers();

  console.log("All IPC handlers registered");
}
