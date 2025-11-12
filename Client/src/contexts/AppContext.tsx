import React, {
  createContext,
  useContext,
  useState,
  useMemo,
  useCallback,
} from "react";
import { UsosUserInfo } from "../assets/types.tsx"; // Popraw ścieżkę do typów

// Definiujemy stan uwierzytelniania jako jeden obiekt
interface AuthState {
  user: UsosUserInfo | null;
  authLoading: boolean;
}

interface AppContextType {
  isMenuOpen: boolean;
  setIsMenuOpen: (isOpen: boolean) => void;

  authState: AuthState;
  setUser: (user: UsosUserInfo | null) => void;
  setAuthLoading: (isLoading: boolean) => void;
  setLoggedInUser: (user: UsosUserInfo) => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

const initialAuthState: AuthState = {
  user: null,
  authLoading: true, // Zaczynamy jako "ładujący"
};

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [authState, setAuthState] = useState<AuthState>(initialAuthState);

  const setIsMenuOpenStable = useCallback((isOpen: boolean) => {
    setIsMenuOpen(isOpen);
  }, []);

  const setUser = useCallback((user: UsosUserInfo | null) => {
    setAuthState((prev) => ({ ...prev, user }));
  }, []);

  const setAuthLoading = useCallback((isLoading: boolean) => {
    setAuthState((prev) => ({ ...prev, authLoading: isLoading }));
  }, []);

  const setLoggedInUser = useCallback((user: UsosUserInfo) => {
    setAuthState({ user, authLoading: false });
  }, []);

  const value = useMemo(
    () => ({
      isMenuOpen,
      setIsMenuOpen: setIsMenuOpenStable,
      authState,
      setUser,
      setAuthLoading,
      setLoggedInUser,
    }),
    [
      isMenuOpen,
      authState,
      setIsMenuOpenStable,
      setUser,
      setAuthLoading,
      setLoggedInUser,
    ]
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
