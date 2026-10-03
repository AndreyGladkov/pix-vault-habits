import { TFile, TFolder } from "obsidian";

const at = <T extends object>(entry: T, path: string): T =>
  Object.assign(entry, { path });

// In-memory vault mirroring Obsidian 1.13 semantics: process() skips the write
// when the callback returns the text unchanged.
export const createVault = (initial: Record<string, string> = {}) => {
  const files = new Map(Object.entries(initial));
  const folders = new Set<string>();
  const writes: string[] = [];
  const vault = {
    getAbstractFileByPath: (path: string) =>
      files.has(path)
        ? at(new TFile(), path)
        : folders.has(path)
          ? at(new TFolder(), path)
          : null,
    createFolder: async (path: string) => {
      folders.add(path);
    },
    create: async (path: string, text: string) => {
      files.set(path, text);
      return at(new TFile(), path);
    },
    read: async (file: { path: string }) => files.get(file.path) ?? "",
    process: async (file: { path: string }, fn: (text: string) => string) => {
      const text = files.get(file.path) ?? "";
      const next = fn(text);
      if (next !== text) {
        files.set(file.path, next);
        writes.push(file.path);
      }
      return next;
    },
  };
  return { app: { vault } as never, vault, files, folders, writes };
};
