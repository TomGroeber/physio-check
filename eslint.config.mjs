import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
    // Entpackte Archiv-Reste, gehören nicht zum Projekt:
    "PHYSIOCHECK_PHASE_B/**",
    "__MACOSX/**",
    "test-results/**",
    // Eigene Lint-Konfigurationen: App (expo lint) und geteiltes Paket.
    "apps/**",
    "packages/**",
  ]),
]);

export default eslintConfig;
