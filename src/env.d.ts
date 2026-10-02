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
