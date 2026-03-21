export function getRequiredEnv(variable: string) {
  const value = process.env[variable];

  if (!value) {
    console.error(`Environment variable '${variable}' is missing`);
    throw new Error(`Environment variable '${variable}' is missing`);
  }

  return value;
}

export const SONIOX_API_BASE_URL = "https://api.soniox.com";
export const SONIOX_API_KEY = getRequiredEnv("SONIOX_API_KEY");
export const WEBHOOK_URL = `${getRequiredEnv("CONVEX_SITE_URL")}/soniox/notify`;
export const WEBHOOK_AUTH_HEADER_NAME = "x-soniox-auth";
export const WEBHOOK_AUTH_HEADER_VALUE = getRequiredEnv(
  "SONIOX_AUTH_HEADER_VALUE",
);
