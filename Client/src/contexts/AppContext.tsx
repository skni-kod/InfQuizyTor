import React, { createContext, useContext, useState, useMemo } from "react";
// Upewnij się, że ten typ istnieje w Twoim pliku types.tsx
import { UsosUserInfo } from "../assets/types.tsx"; // Popraw ścieżkę do typów

interface AppContextType {
  isMenuOpen: boolean;
  setIsMenuOpen: (isOpen: boolean) => void;

  // Dane zalogowanego użytkownika
  user: UsosUserInfo | null;
  setUser: (user: UsosUserInfo | null) => void;
  // Status sprawdzania autoryzacji przy starcie aplikacji
  authLoading: boolean;
  setAuthLoading: (isLoading: boolean) => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [user, setUser] = useState<UsosUserInfo | null>(null);
  const [authLoading, setAuthLoading] = useState(true); // Zaczynamy jako "ładujący"

  const value = useMemo(
    () => ({
      isMenuOpen,
      setIsMenuOpen,
      user,
      setUser,
      authLoading,
      setAuthLoading,
    }),
    [isMenuOpen, user, authLoading]
  ); // Dodaj nowe stany do zależności

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
};

export const useAppContext = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error("useAppContext must be used within an AppProvider");
  }
  return context;
};
