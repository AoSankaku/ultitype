import type { AppSettings } from "../../_lib/types";

export type InputSettingsController = {
  settings: AppSettings;
  onChange: (settings: Partial<AppSettings>) => void;
  [key: string]: any;
};
