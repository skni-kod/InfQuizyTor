import React, { createContext, useContext, useState, useMemo } from "react";

// Ten kontekst będzie zarządzał stanem UI, np. widocznością widgetów [cite: 113]
interface AppContextType {
  isMenuOpen: boolean;
  setIsMenuOpen: (isOpen: boolean) => void;
  // W przyszłości:
  // user: User | null;
  // subjects: Subject[];
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const value = useMemo(
    () => ({
      isMenuOpen,
      setIsMenuOpen,
    }),
    [isMenuOpen]
  );

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
};

export const useAppContext = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error("useAppContext must be used within an AppProvider");
  }
  return context;
};
