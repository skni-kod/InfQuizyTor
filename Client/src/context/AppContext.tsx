// src/context/AppContext.tsx
import { createContext, useContext, useState, type ReactNode } from "react";

// 1. Definicja, jak wyglądają nasze dane użytkownika (przykład)
interface IUser {
  id: string;
  name: string;
  level: number;
}

// 2. Definicja, jak wygląda cały stan globalny
interface IAppContextState {
  user: IUser | null;
  theme: "dark" | "light";
  login: (user: IUser) => void;
  logout: () => void;
}

// 3. Stworzenie Contextu (z wartością domyślną)
const AppContext = createContext<IAppContextState | undefined>(undefined);

// 4. Stworzenie "Dostawcy" (Providera)
interface AppProviderProps {
  children: ReactNode;
}

export const AppProvider = ({ children }: AppProviderProps) => {
  const [user, setUser] = useState<IUser | null>({
    id: "u1",
    name: "Student_Rakieta",
    level: 3,
  });
  const [theme, _setTheme] = useState<"dark" | "light">("dark");

  // Funkcje do modyfikacji stanu
  const login = (userData: IUser) => setUser(userData);
  const logout = () => setUser(null);

  const value = {
    user,
    theme,
    login,
    logout,
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
};

// 5. Stworzenie customowego hooka do łatwego używania stanu
export const useAppContext = () => {
  const context = useContext(AppContext);
  if (context === undefined) {
    throw new Error("useAppContext must be used within an AppProvider");
  }
  return context;
};
