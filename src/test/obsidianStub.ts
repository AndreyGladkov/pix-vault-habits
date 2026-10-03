// The obsidian package ships only type declarations; the runtime is provided
// by the app. Tests resolve "obsidian" here instead (see vitest.config.mts).
export class TAbstractFile {
  path = "";
}

export class TFile extends TAbstractFile {}

export class TFolder extends TAbstractFile {}

export const normalizePath = (path: string): string => path;
