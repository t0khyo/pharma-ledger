import { registerCompanyHandlers } from "./company.handler.js";
import { registerFinancialHandlers } from "./financial.handler.js";

export function registerAllHandlers() {
  console.log("Registering IPC handlers...");

  registerCompanyHandlers();
  registerFinancialHandlers();

  console.log("All IPC handlers registered");
}
