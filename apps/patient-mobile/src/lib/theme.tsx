import AsyncStorage from "@react-native-async-storage/async-storage";
import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { useColorScheme } from "react-native";
import { colors, type ThemeColors } from "@/config/branding";

export type PatientTheme = "light" | "dark";
const STORAGE_KEY = "pc-theme";

type ThemeState = {
  theme: PatientTheme;
  setTheme: (next: PatientTheme) => void;
};

const ThemeContext = createContext<ThemeState | null>(null);

/**
 * Darstellung wie im Web (D-056): Hell/Dunkel als bewusste Wahl der
 * Patientin, gilt pro Gerät und wirkt sofort. Vor der ersten Wahl folgt
 * die App dem Systemschema; die Wahl liegt in AsyncStorage (reine
 * Darstellungseinstellung ohne Gesundheits- oder Kontobezug – die
 * Sitzung selbst bleibt verschlüsselt, D-061).
 */
export function ThemeProvider({ children }: { children: ReactNode }) {
  const system = useColorScheme();
  const [stored, setStored] = useState<PatientTheme | null>(null);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEY)
      .then((value) => {
        if (value === "light" || value === "dark") setStored(value);
      })
      .finally(() => setLoaded(true));
  }, []);

  const value = useMemo<ThemeState>(() => {
    const theme: PatientTheme = stored ?? (system === "dark" ? "dark" : "light");
    return {
      theme,
      setTheme: (next) => {
        setStored(next);
        AsyncStorage.setItem(STORAGE_KEY, next).catch(() => {});
      },
    };
  }, [stored, system]);

  // Erst rendern, wenn die gespeicherte Wahl gelesen ist (kein Flackern).
  if (!loaded) return null;
  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useThemeSetting(): ThemeState {
  const context = useContext(ThemeContext);
  if (!context) throw new Error("useThemeSetting außerhalb des ThemeProviders");
  return context;
}

/** Aktuelle Farbpalette (Web-Tokens) für Komponenten. */
export function useTheme(): ThemeColors {
  return colors[useThemeSetting().theme];
}
