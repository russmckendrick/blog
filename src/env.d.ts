/// <reference path="../.astro/types.d.ts" />

// Extend Window interface for third-party libraries
interface Window {
  // Pagefind search UI
  PagefindUI: new (options: {
    element: Element | string;
    showImages?: boolean;
    excerptLength?: number;
  }) => unknown;

  // Swup page transitions (if used)
  swup?: {
    hooks: {
      on: (event: string, callback: () => void) => void;
    };
  };

  // Reddit embed library (callable function)
  rembeddit?: (() => void) & {
    init?: () => void;
  };
}
