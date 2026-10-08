import { type Update } from "@tauri-apps/plugin-updater";

// OverHud: the updater points at the official Overlayed releases, which would
// install over this build and drop its changes, so update checks are off.
export const useUpdate = (): { update: Update | null; error: string } => {
  return { update: null, error: "" };
};
