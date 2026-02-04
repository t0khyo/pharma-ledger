import { IconMoon, IconSun } from "@tabler/icons-react";
import { useTheme } from "next-themes";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";

export function DarkModeToggle() {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  // Prevent hydration mismatch
  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <Button
        variant="ghost"
        size="icon"
        className="h-9 w-9"
        disabled
      >
        <IconSun className="h-4 w-4" />
      </Button>
    );
  }

  const isDark = theme === "dark";

  return (
    <Button
      variant="ghost"
      size="icon"
      className="h-9 w-9"
      onClick={() => setTheme(isDark ? "light" : "dark")}
      title={isDark ? "التبديل إلى الوضع الفاتح" : "التبديل إلى الوضع الداكن"}
    >
      {isDark ? (
        <IconSun className="h-4 w-4 transition-transform hover:rotate-180" />
      ) : (
        <IconMoon className="h-4 w-4 transition-transform hover:-rotate-12" />
      )}
    </Button>
  );
}
