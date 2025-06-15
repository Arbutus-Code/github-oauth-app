import { FastifyInstance, FastifyRequest, FastifyReply } from "fastify";
import { config } from "../config.js";

/**
 * Defines the expected query parameters for the /success route.
 * While 'origin' is also passed in the query string by the /callback route
 * and used by success.html, it's not explicitly typed here as this route's
 * primary concern is the token for logging and error handling if missing.
 * The success.html page itself extracts both 'token' and 'origin'.
 */
interface SuccessQuery {
  token?: string;
}

/**
 * Registers the success route (`/success`).
 * This route is the final step in a successful OAuth flow, responsible for
 * serving the `success.html` page.
 *
 * @param {FastifyInstance} server - The Fastify server instance.
 */
export default async function successRoutes(server: FastifyInstance) {
  /**
   * GET /success
   * This endpoint is reached after a successful GitHub OAuth authentication and permission check.
   * It expects an access 'token' (and implicitly an 'origin' for the frontend)
   * in the query string, passed from the `/callback` route.
   *
   * Its primary role is to serve the `success.html` static page.
   * The `success.html` page contains client-side JavaScript that:
   * 1. Extracts the 'token' and 'origin' from its own URL query parameters.
   * 2. Uses `window.opener.postMessage()` to send the token (or an error message)
   *    back to the Decap CMS window that initiated the OAuth flow.
   * 3. Closes the popup window.
   *
   * If the 'token' is missing from the query parameters, this route logs an error
   * and redirects to the `/error` page.
   */
  server.get(
    "/success",
    async (
      request: FastifyRequest<{ Querystring: SuccessQuery }>,
      reply: FastifyReply,
    ) => {
      const { token } = request.query;

      if (!token) {
        server.log.error("Token missing in /success route query.");
        const errorParams = new URLSearchParams({
          error: encodeURIComponent(
            "Authentication successful, but token not provided to success handler.",
          ),
          origin: config.frontendUrl, // Provide origin for consistent error page behavior
        });
        return reply.code(302).redirect(`/error?${errorParams.toString()}`);
      }

      server.log.info("Authentication successful, serving success.html page.");
      return reply.sendFile("success.html");
    },
  );
}
