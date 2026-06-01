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
    // Functions нь тусдаа codebase (өөрийн tsconfig/compile) — root lint-ээс хасна.
    "functions/**",
    // Tooling scripts (seed гэх мэт) — Admin SDK, app биш.
    "scripts/**",
    // Service worker — firebase compat global (importScripts).
    "public/**",
    // Firebase deploy cache (build артефакт).
    ".firebase/**",
  ]),
]);

export default eslintConfig;
