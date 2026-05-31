/// <reference path="../.astro/types.d.ts" />

// Extend Window interface for third-party libraries
interface Window {
  // Plausible Analytics (custom events / goals)
  plausible?: (
    event: string,
    options?: {
      props?: Record<string, string | number | boolean>;
      interactive?: boolean;
      callback?: () => void;
    }
  ) => void;

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
