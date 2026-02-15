import type { CSSProperties } from "react";

export const selectChevronStyle: CSSProperties = {
  backgroundImage:
    'url("data:image/svg+xml,%3Csvg xmlns=%27http://www.w3.org/2000/svg%27 viewBox=%270 0 20 20%27 fill=%27none%27%3E%3Cpath d=%27M6 8l4 4 4-4%27 stroke=%27%23CBD5E1%27 stroke-width=%272%27 stroke-linecap=%27round%27 stroke-linejoin=%27round%27/%3E%3C/svg%3E")',
  backgroundRepeat: "no-repeat",
  backgroundPosition: "right 0.75rem center",
  backgroundSize: "1rem",
};

export const selectClassName =
  "h-10 w-full appearance-none rounded-lg border border-white/10 !bg-bg-card px-3 pr-10 text-sm text-white [color-scheme:dark] focus:outline-none focus:ring-2 focus:ring-primary/60";
