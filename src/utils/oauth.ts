import {
  AuthorizationCode,
  ModuleOptions,
  AuthorizationTokenConfig,
} from "simple-oauth2";
import { config } from "../config.js";

/**
 * Configuration object for the `simple-oauth2` client.
 * It defines client credentials, GitHub's OAuth endpoints, and custom HTTP headers.
 * @type {ModuleOptions}
 */
const oauthConfig: ModuleOptions = {
  client: {
    id: config.github.clientId,
    secret: config.github.clientSecret,
  },
  auth: {
    tokenHost: "https://github.com",
    tokenPath: "/login/oauth/access_token",
    authorizePath: "/login/oauth/authorize",
  },
  http: {
    headers: { "User-Agent": "DecapCMS-GitHub-OAuth-App" }, // Recommended User-Agent for API requests
  },
};

/**
 * An instance of `simple-oauth2.AuthorizationCode` configured for GitHub OAuth.
 * This client is used to generate authorization URLs and exchange codes for tokens.
 */
export const oauthClient = new AuthorizationCode(oauthConfig);

/**
 * Generates the GitHub authorization URL to redirect the user to.
 *
 * @param {string} state - An opaque value used to maintain state between the request and callback.
 *                         Provides protection against CSRF attacks.
 * @returns {string} The fully formed GitHub authorization URL.
 */
export const getAuthorizationUrl = (state: string): string => {
  const authorizationUri = oauthClient.authorizeURL({
    redirect_uri: config.github.callbackUrl,
    scope: config.github.scope,
    state: state,
  });
  return authorizationUri;
};

/**
 * Exchanges an authorization code for a GitHub access token.
 * State validation should be performed by the caller before invoking this function.
 *
 * @param {string} code - The authorization code received from GitHub after user approval.
 * @returns {Promise<string>} A promise that resolves with the access token string.
 * @throws {Error} If the token exchange fails or an error occurs.
 */
export const getToken = async (code: string): Promise<string> => {
  const tokenParams: AuthorizationTokenConfig = {
    code,
    redirect_uri: config.github.callbackUrl,
    scope: config.github.scope, // `scope` is included for clarity, though GitHub might not always require it if already in authorizeURL.
  };

  try {
    const accessToken = await oauthClient.getToken(tokenParams);
    // Ensure that access_token is a string, as simple-oauth2 can return a complex object.
    if (typeof accessToken.token.access_token === "string") {
      return accessToken.token.access_token;
    }
    throw new Error(
      "Access token received from GitHub is not in the expected string format.",
    );
  } catch (error: unknown) {
    let message = "Unknown error during token exchange";
    if (error instanceof Error) {
      message = error.message;
    } else if (typeof error === "string") {
      message = error;
    } else if (
      error &&
      typeof error === "object" &&
      "message" in error &&
      typeof error.message === "string"
    ) {
      message = error.message;
    }
    console.error("Access Token Error Details:", message, error);
    throw new Error(`Failed to obtain access token from GitHub: ${message}`);
  }
};
