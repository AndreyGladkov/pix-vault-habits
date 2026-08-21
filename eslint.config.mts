import obsidianmd from "eslint-plugin-obsidianmd";
import { globalIgnores, defineConfig } from "eslint/config";

export default defineConfig(
  globalIgnores([
    "node_modules",
    "main.js",
    "esbuild.config.mjs",
    "version-bump.mjs",
    "versions.json",
    "package.json",
    "package-lock.json",
    "tsconfig.json",
  ]),
  {
    languageOptions: {
      // Browser + Obsidian globals are provided by the obsidianmd recommended
      // config; only the TypeScript project service needs to be configured here.
      parserOptions: {
        projectService: {
          allowDefaultProject: ["eslint.config.mts", "manifest.json"],
        },
        tsconfigRootDir: import.meta.dirname,
        extraFileExtensions: [".json"],
      },
    },
  },
  ...obsidianmd.configs.recommended,
);

