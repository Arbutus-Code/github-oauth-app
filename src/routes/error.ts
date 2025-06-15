import { FastifyInstance, FastifyRequest, FastifyReply } from "fastify";

/**
 * Defines the expected query parameters for the /error route.
 * The `error.html` page primarily uses the 'error' parameter to display the message.
 * 'message' is supported for backward compatibility.
 * An 'origin' parameter is also expected to be passed by redirecting routes,
 * which `error.html` can use (e.g., to attempt to communicate back to the opener).
 */
interface ErrorQuery {
  message?: string;
  error?: string;
}

/**
 * Registers the error route (`/error`).
 * This route is responsible for serving the `error.html` page, which displays
 * error messages to the user within the OAuth popup.
 *
 * @param {FastifyInstance} server - The Fastify server instance.
 */
export default async function errorRoutes(server: FastifyInstance) {
  /**
   * GET /error
   * This endpoint is used to display error messages within the OAuth popup window.
   * It expects an 'error' (or 'message' for compatibility) and an 'origin' parameter
   * in the query string, typically provided by other routes when they encounter an issue.
   *
   * Its primary role is to serve the `error.html` static page.
   * The `error.html` page contains client-side JavaScript that:
   * 1. Extracts the 'error' message and 'origin' from its own URL query parameters.
   * 2. Displays the error message to the user.
   * 3. May attempt to use `window.opener.postMessage()` to send an error notification
   *    back to the Decap CMS window that initiated the OAuth flow, using the 'origin'.
   * 4. Provides a way for the user to close the popup (or it might close automatically).
   */
  server.get(
    "/error",
    async (
      request: FastifyRequest<{ Querystring: ErrorQuery }>,
      reply: FastifyReply,
    ) => {
      const errorMessage =
        request.query.error ||
        request.query.message ||
        "An unspecified error occurred.";

      server.log.warn(
        `Displaying error page with message: "${decodeURIComponent(errorMessage)}"`,
      );

      return reply.sendFile("error.html");
    },
  );
}
