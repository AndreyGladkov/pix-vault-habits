// The obsidian package ships only type declarations; the runtime is provided
// by the app. Tests resolve "obsidian" here instead (see vitest.config.mts).
export class TAbstractFile {
  path = "";
}

export class TFile extends TAbstractFile {}

export class TFolder extends TAbstractFile {}

export const normalizePath = (path: string): string => path;

export const getLanguage = (): string => "en";

export class Notice {
  constructor(readonly message: string) {}
}

// Always restarts the timer, i.e. Obsidian's debounce with resetTimer = true.
export const debounce = <T extends unknown[]>(
  callback: (...args: T) => unknown,
  timeout = 0,
) => {
  let timer: number | undefined;
  const debounced = (...args: T) => {
    window.clearTimeout(timer);
    timer = window.setTimeout(() => callback(...args), timeout);
    return debounced;
  };
  debounced.cancel = () => {
    window.clearTimeout(timer);
    return debounced;
  };
  return debounced;
};

export class Plugin {
  constructor(
    readonly app: unknown,
    readonly manifest: unknown,
  ) {}

  async loadData(): Promise<unknown> {
    return null;
  }

  async saveData(_data: unknown): Promise<void> {}

  registerView() {}

  addRibbonIcon() {}

  addCommand() {}

  addSettingTab() {}
}

export class PluginSettingTab {}
