import { registerCompanyHandlers } from "./company.handler.js";
import { registerFinancialHandlers } from "./financial.handler.js";
import { registerAuthHandlers } from "./auth.handler.js";
import { registerSettingsHandlers } from "./settings.handler.js";
import { registerCustomerHandlers } from "./customer.handler.js";
import { registerTransactionHandlers } from "./transaction.handler.js";

export function registerAllHandlers() {
  console.log("Registering IPC handlers...");

  registerCompanyHandlers();
  registerFinancialHandlers();
  registerAuthHandlers();
  registerSettingsHandlers();
  registerCustomerHandlers();
  registerTransactionHandlers();

  console.log("All IPC handlers registered");
}
