import React, { createContext, useContext, useState, useMemo } from "react";

interface ThemeContextType {
  hue: number;
  setHue: (hue: number) => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [hue, setHue] = useState(210); // Domyślny błękit

  // Ustawiamy zmienną CSS --hue na głównym elemencie
  document.documentElement.style.setProperty("--hue", hue.toString());

  const value = useMemo(() => ({ hue, setHue }), [hue]);

  return (
    <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
  );
};

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error("useTheme must be used within a ThemeProvider");
  }
  return context;
};
