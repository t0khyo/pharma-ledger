import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { IconAlertTriangle, IconInfoCircle, IconX } from "@tabler/icons-react";
import type { SmartAlert } from "src/shared/types/transaction.types";
import { useState } from "react";
import { Button } from "@/components/ui/button";

interface SmartAlertsProps {
  alerts: SmartAlert[];
  loading?: boolean;
}

export function SmartAlerts({ alerts, loading }: SmartAlertsProps) {
  const [dismissed, setDismissed] = useState<string[]>([]);

  if (loading || !alerts || alerts.length === 0) return null;

  const visibleAlerts = alerts.filter(a => !dismissed.includes(a.id));
  
  if (visibleAlerts.length === 0) return null;

  return (
    <div className="flex flex-col gap-2 mb-4">
      {visibleAlerts.map((alert) => (
        <Alert 
          key={alert.id} 
          variant={alert.type === 'destructive' ? 'destructive' : 'default'}
          className={`relative ${alert.type === 'warning' ? 'bg-amber-50 text-amber-900 border-amber-200 dark:bg-amber-950/30 dark:text-amber-200 dark:border-amber-900' : ''}`}
        >
          {alert.type === 'destructive' || alert.type === 'warning' ? (
            <IconAlertTriangle className="h-4 w-4" />
          ) : (
            <IconInfoCircle className="h-4 w-4" />
          )}
          <AlertTitle className="text-sm font-semibold mb-1">
            {alert.type === 'destructive' ? 'تنبيه هام' : alert.type === 'warning' ? 'تحذير' : 'ملحوظة'}
          </AlertTitle>
          <AlertDescription className="text-sm">
            {alert.message}
          </AlertDescription>
          <Button 
            variant="ghost" 
            size="icon" 
            className="absolute top-2 left-2 h-6 w-6 opacity-70 hover:opacity-100"
            onClick={() => setDismissed([...dismissed, alert.id])}
          >
            <IconX className="h-4 w-4" />
          </Button>
        </Alert>
      ))}
    </div>
  );
}
