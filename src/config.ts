import dotenv from "dotenv";

dotenv.config();

/**
 * Retrieves an environment variable by its key.
 * If the variable is not found and a default value is provided, the default is returned.
 * If the variable is not found and no default is provided, an error is thrown.
 *
 * @param {string} key - The environment variable key.
 * @param {string} [defaultValue] - The default value to use if the variable is not set.
 * @returns {string} The value of the environment variable or the default value.
 * @throws {Error} If the environment variable is not set and no default value is provided.
 */
const getConfigValue = (key: string, defaultValue?: string): string => {
  const value = process.env[key];
  if (value) {
    return value;
  }
  if (defaultValue !== undefined) {
    return defaultValue;
  }
  throw new Error(
    `Missing environment variable: ${key} and no default value provided.`,
  );
};

/**
 * Application configuration object.
 * Values are sourced from environment variables, with defaults provided for some.
 * It's crucial to set these environment variables appropriately for production deployments,
 * especially sensitive values like `GITHUB_CLIENT_SECRET` and `SESSION_SECRET`.
 */
export const config = {
  /** Node environment (e.g., 'development', 'production') */
  nodeEnv: getConfigValue("NODE_ENV", "development"),
  /** Port the application will listen on */
  port: parseInt(getConfigValue("PORT", "3000"), 10),
  /** Host address the application will bind to */
  host: getConfigValue("HOST", "0.0.0.0"),

  /** GitHub OAuth application settings */
  github: {
    /** GitHub OAuth App Client ID */
    clientId: getConfigValue("GITHUB_CLIENT_ID"),
    /** GitHub OAuth App Client Secret */
    clientSecret: getConfigValue("GITHUB_CLIENT_SECRET"),
    /** GitHub OAuth App Callback URL */
    callbackUrl: getConfigValue("GITHUB_CALLBACK_URL"),
    /** GitHub OAuth scope(s) */
    scope: getConfigValue("GITHUB_SCOPE", "repo"),
    /** Target GitHub repository (owner/repo) for permission checks */
    repo: getConfigValue("GITHUB_REPO"),
  },

  /** URL of the frontend application for CORS configuration */
  frontendUrl: getConfigValue("FRONTEND_URL"),
  /**
   * Secret key for signing cookies/sessions. Must be a strong, unique random string.
   * The default value is insecure and MUST be overridden in production.
   */
  sessionSecret: getConfigValue(
    "SESSION_SECRET",
    "a_very_strong_secret_key_that_should_be_changed",
  ),

  /** Rate limiting settings */
  rateLimit: {
    /** Maximum number of requests allowed per window */
    requests: parseInt(getConfigValue("RATE_LIMIT_REQUESTS", "100"), 10),
    /** Time window in minutes for rate limiting */
    windowMinutes: parseInt(
      getConfigValue("RATE_LIMIT_WINDOW_MINUTES", "60"),
      10,
    ),
  },

  /** Logging level for the application (e.g., 'info', 'debug', 'warn', 'error') */
  logLevel: getConfigValue("LOG_LEVEL", "info"),
};
