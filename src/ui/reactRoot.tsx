import { StrictMode, type ReactNode } from "react";
import { createRoot, type Root } from "react-dom/client";

export const mountReactRoot = (
  container: HTMLElement,
  node: ReactNode,
): Root => {
  const root = createRoot(container);
  root.render(<StrictMode>{node}</StrictMode>);
  return root;
};
