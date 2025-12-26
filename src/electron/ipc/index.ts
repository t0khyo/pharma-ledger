import { registerCompanyHandlers } from "./company.handler.js";
import { registerFinancialHandlers } from "./financial.handler.js";
import { registerAuthHandlers } from "./auth.handler.js";

export function registerAllHandlers() {
  console.log("Registering IPC handlers...");

  registerCompanyHandlers();
  registerFinancialHandlers();
  registerAuthHandlers();

  console.log("All IPC handlers registered");
}
