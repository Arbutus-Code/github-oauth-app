import { FastifyInstance, FastifyRequest, FastifyReply } from "fastify";
import { getToken } from "../utils/oauth.js";
import { getGitHubUser, verifyUserPermission } from "../utils/github.js";
import { config } from "../config.js";

/**
 * Defines the structure for query parameters expected on the /callback route.
 */
interface CallbackQuery {
  code?: string;
  state?: string;
  error?: string;
  error_description?: string;
}

/**
 * Registers the GitHub OAuth callback route (`/callback`).
 * This route handles the response from GitHub after user authentication.
 *
 * @param {FastifyInstance} server - The Fastify server instance.
 */
export default async function callbackRoutes(server: FastifyInstance) {
  /**
   * GET /callback
   * Handles the redirect from GitHub after the user attempts to authorize the application.
   * This endpoint performs several critical steps:
   * 1.  Validates the 'state' parameter against the value stored in a signed cookie
   *     to prevent CSRF attacks. The state cookie is cleared immediately after validation.
   * 2.  Checks for any direct errors returned by GitHub (e.g., if the user denied access).
   * 3.  Ensures an authorization 'code' is present in the query parameters.
   * 4.  If all initial checks pass, it attempts to exchange the 'code' for an access token
   *     by calling the GitHub token endpoint (via `getToken` utility).
   * 5.  With the access token, it fetches the authenticated user's GitHub profile (via `getGitHubUser`).
   * 6.  It then verifies if the user has the necessary permissions (write, admin, or maintain)
   *     for the repository specified in the application's configuration (via `verifyUserPermission`).
   * 7.  If all steps are successful and permissions are adequate, it redirects the user to the
   *     `/success` route, passing the access token and frontend origin as query parameters.
   *     The `/success` route is then responsible for relaying the token to the Decap CMS frontend.
   * 8.  If any step fails (e.g., state mismatch, no code, token exchange error, permission denial),
   *     it logs the error and redirects the user to the `/error` route with a descriptive
   *     error message and the frontend origin.
   */
  server.get(
    "/callback",
    async (
      request: FastifyRequest<{ Querystring: CallbackQuery }>,
      reply: FastifyReply,
    ) => {
      const {
        code,
        state: queryState,
        error,
        error_description,
      } = request.query;
      const cookieState = request.unsignCookie(
        request.cookies.oauth_state || "",
      );

      reply.clearCookie("oauth_state", { path: "/" });

      if (
        !queryState ||
        !cookieState ||
        !cookieState.valid ||
        cookieState.value !== queryState
      ) {
        server.log.warn(
          "Invalid OAuth state parameter or cookie mismatch. Potential CSRF attack.",
        );
        const errorMessage =
          cookieState && !cookieState.valid
            ? "Invalid state cookie signature."
            : "State parameter mismatch or missing.";
        const errorParams = new URLSearchParams({
          error: encodeURIComponent(`CSRF validation failed: ${errorMessage}`),
          origin: config.frontendUrl,
        });
        return reply.redirect(`/error?${errorParams.toString()}`);
      }
      server.log.info("OAuth state validated successfully.");

      if (error) {
        server.log.error(
          `OAuth Error from GitHub: ${error} - ${error_description}`,
        );
        const errorParams = new URLSearchParams({
          error: encodeURIComponent(
            error_description ||
              "An error occurred during GitHub authentication.",
          ),
          origin: config.frontendUrl,
        });
        return reply.redirect(`/error?${errorParams.toString()}`);
      }

      if (!code) {
        server.log.error("No authorization code received from GitHub.");
        const errorParams = new URLSearchParams({
          error: encodeURIComponent(
            "Authorization code missing from GitHub callback.",
          ),
          origin: config.frontendUrl,
        });
        return reply.redirect(`/error?${errorParams.toString()}`);
      }

      try {
        server.log.info("Exchanging authorization code for access token...");
        const accessToken = await getToken(code);
        server.log.info("Access token obtained successfully.");

        const githubUser = await getGitHubUser(accessToken, server.log);
        if (!githubUser) {
          server.log.error("Failed to fetch GitHub user profile.");
          const errorParams = new URLSearchParams({
            error: encodeURIComponent(
              "Failed to fetch user profile from GitHub.",
            ),
            origin: config.frontendUrl,
          });
          return reply.redirect(`/error?${errorParams.toString()}`);
        }
        server.log.info(`GitHub user profile fetched: ${githubUser.login}`);

        server.log.info(
          `Verifying repository permissions for user: ${githubUser.login} on repo: ${config.github.repo}`,
        );
        const hasPermission = await verifyUserPermission(
          accessToken,
          githubUser.login,
          server.log,
        );

        if (hasPermission) {
          server.log.info(
            `User ${githubUser.login} has sufficient permissions for ${config.github.repo}.`,
          );
          const successParams = new URLSearchParams({
            token: accessToken,
            origin: config.frontendUrl,
          });
          reply.redirect(`/success?${successParams.toString()}`);
        } else {
          server.log.warn(
            `User ${githubUser.login} does NOT have sufficient permissions for ${config.github.repo}.`,
          );
          const errorParams = new URLSearchParams({
            error: encodeURIComponent(
              "Access Denied: You do not have sufficient permissions for the configured repository.",
            ),
            origin: config.frontendUrl,
          });
          reply.redirect(`/error?${errorParams.toString()}`);
        }
      } catch (err: unknown) {
        const callbackErrorMessage =
          "An internal error occurred during callback processing.";
        if (err instanceof Error) {
          server.log.error(
            { error: err.message, stack: err.stack },
            "Error in /callback route processing",
          );
        } else {
          server.log.error(
            { error: err },
            "An unknown error occurred in /callback route processing",
          );
        }
        const errorParams = new URLSearchParams({
          error: encodeURIComponent(callbackErrorMessage),
          origin: config.frontendUrl,
        });
        reply.redirect(`/error?${errorParams.toString()}`);
      }
    },
  );
}
