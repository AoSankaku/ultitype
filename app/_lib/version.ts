export const APP_VERSION = "2026.6.0-alpha12";

export function getAppVersionLabel(nodeEnv: string | undefined = process.env.NODE_ENV) {
  return `${nodeEnv === "development" ? "DEVSRV-" : ""}v${APP_VERSION}`;
}

export const APP_VERSION_LABEL = getAppVersionLabel();
