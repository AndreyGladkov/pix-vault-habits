import { cleanup } from "@testing-library/react";
import { afterEach } from "vitest";

afterEach(cleanup);

// jsdom has no layout engine and therefore no ResizeObserver.
window.ResizeObserver ??= class {
  observe() {}
  unobserve() {}
  disconnect() {}
};
