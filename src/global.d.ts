import type { CamApi } from "../shared/types";

declare global {
  interface Window {
    cam: CamApi;
  }
}

export {};
