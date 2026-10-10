import { Eye, EyeOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useSensitive } from "@/contexts/SensitiveContext";
import { Tooltip, TooltipContent, TooltipTrigger, TooltipProvider } from "@/components/ui/tooltip";

export function SensitiveToggle() {
  const { showSensitive, toggleSensitive } = useSensitive();

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            onClick={toggleSensitive}
            className="text-muted-foreground hover:text-foreground"
            aria-label={showSensitive ? "تفعيل وضع الخصوصية" : "إيقاف وضع الخصوصية"}
          >
            {showSensitive ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
          </Button>
        </TooltipTrigger>
        <TooltipContent>
          <p>{showSensitive ? "تفعيل وضع الخصوصية" : "إيقاف وضع الخصوصية"}</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
