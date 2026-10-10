import { createContext, useContext, useState, ReactNode } from "react";

interface SensitiveContextType {
  showSensitive: boolean;
  toggleSensitive: () => void;
}

const SensitiveContext = createContext<SensitiveContextType | undefined>(undefined);

export function SensitiveProvider({ children }: { children: ReactNode }) {
  const [showSensitive, setShowSensitive] = useState(false); // Default to blurred

  const toggleSensitive = () => setShowSensitive((prev) => !prev);

  return (
    <SensitiveContext.Provider value={{ showSensitive, toggleSensitive }}>
      {children}
    </SensitiveContext.Provider>
  );
}

// eslint-disable-next-line react-refresh/only-export-components
export function useSensitive() {
  const context = useContext(SensitiveContext);
  if (context === undefined) {
    throw new Error("useSensitive must be used within a SensitiveProvider");
  }
  return context;
}
